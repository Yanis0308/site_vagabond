# Déploiements Vercel pilotés par GitHub Actions, pas par l'intégration Git native

Le **Website** et le **Dashboard** sont déployés sur Vercel via des workflows GitHub Actions qui pilotent
la **CLI Vercel** avec un **token CI unique**, et non par l'intégration Git native de Vercel. Cette dernière
est désactivée par projet (`vercel.json` → `git.deploymentEnabled: false`, versionné). Raison principale :
l'intégration native impose, sur un projet d'équipe, la **facturation Vercel Pro par siège** (chaque
contributeur Git = un membre payant) ; déployer depuis un token CI unique découple les déploiements des
identités Git et évite cette facturation.

Le build est **exécuté sur le runner GitHub Actions** en mode `prebuilt` (`vercel pull` → `vercel build`
→ `vercel deploy --prebuilt`) : le cloud build de Vercel n'est jamais invoqué. C'est ce qui permet de
déployer depuis un compte non payant — Vercel réserve le build cloud déclenché par la CLI/API aux équipes
payantes (sur le plan Hobby, un build cloud reste bloqué : « Deployment Blocked / commit author did not have
contributing access », et le step CI se fige sur « building… » car l'état « blocked » n'est pas terminal).
En prebuilt, on n'envoie que l'artefact `.vercel/output` déjà construit, ce qui contourne entièrement ce verrou.

## Modèle d'environnements

Deux environnements par app (cf. **Dev** / **Production** dans `CONTEXT.md`) :

- **Dev** — sur push `main`, déploiement `preview` (`vercel deploy --prebuilt`) réattribué (`vercel alias set`)
  à une URL `*.vercel.app` stable.
- **Production** — déclenchement **manuel** (`workflow_dispatch`), build et deploy en `--prod`.

La configuration de build et les variables d'environnement restent dans le projet Vercel, scopées par
environnement, et sont rapatriées sur le runner par `vercel pull` (`.vercel/.env.<env>.local`). Next.js fige
les `NEXT_PUBLIC_*` au build → Dev et Production sont buildés séparément, jamais promus l'un de l'autre. Les
déploiements ne sont **pas** conditionnés par la CI (`ci-checks.yml`).

Chaque app fixe son `buildCommand` dans son `vercel.json` pour passer par Turbo
(`pnpm turbo run build --filter=@vagabond/<app>`), afin que les libs du monorepo (`dependsOn: ["^build"]`)
soient buildées avant l'app — `next build` seul ne les résout pas.

Le Website applique ses migrations Payload dans un **step release dédié** (après le build, avant le deploy),
pas dans le build (le `buildCommand` exclut donc `payload migrate`) : le workflow exécute `payload migrate`
avec `DATABASE_URL` / `PAYLOAD_SECRET` rapatriés par `vercel pull`.

## Considered Options

- **Garder l'intégration Git native** — rejetée : c'est précisément ce qui déclenche la facturation par siège.
- **Builder sur Vercel (cloud build, sans `prebuilt`)** — rejetée : Vercel verrouille le build cloud
  déclenché par la CLI/API derrière une équipe payante, ce qui réintroduit le coût que l'on veut éviter et
  fait échouer/figer les déploiements sur le plan Hobby. Le build se fait donc sur le runner, en `prebuilt`.
- **Promote l'artefact Dev en Production** (au lieu de rebuild `--prod`) — rejetée : Next.js fige les
  `NEXT_PUBLIC_*` dans le bundle **au moment du build**, et ces variables diffèrent entre Dev et Production
  (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, projet Supabase). Promouvoir l'artefact Dev shipperait
  les valeurs publiques de Dev en prod. La Production doit donc être **rebuildée** avec l'env scopé Production.
- **`payload migrate` dans le build** — rejetée : anti-pattern build ≠ release (migration rejouée à chaque
  build, builds concurrents). La migration est un step release séparé.

## Consequences

- Le token Vercel (`VERCEL_TOKEN`) devient un secret critique : il porte à lui seul le droit de déployer.
- Tant que `git.deploymentEnabled: false` est en place, **aucun** déploiement n'est automatique sur push :
  retirer ce flag réactiverait silencieusement l'intégration native (et la facturation).
- Le build monorepo (libs, `payload generate:importmap`) s'exécute sur le runner ; un `timeout-minutes`
  borne tout build anormal.
- La base doit être **joignable depuis les runners GitHub** pour `payload migrate` (Supabase l'est), et
  `vercel pull` doit exposer `DATABASE_URL` / `PAYLOAD_SECRET` comme variables d'environnement du projet Vercel.
- La Production est un acte manuel : pas de déploiement prod automatique au merge.
