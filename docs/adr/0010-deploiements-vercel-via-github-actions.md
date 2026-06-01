# Déploiements Vercel pilotés par GitHub Actions, pas par l'intégration Git native

Le **Website** et le **Dashboard** sont déployés sur Vercel via des workflows GitHub Actions
(`amondnet/vercel-action`) déclenchés par un **token CI unique**, et non plus par l'intégration
Git native de Vercel. Cette dernière est désactivée par projet (`vercel.json` →
`git.deploymentEnabled: false`, versionné). Raison principale : l'intégration native impose, sur un
projet d'équipe, la **facturation Vercel Pro par siège** (chaque contributeur Git = un membre payant) ;
déployer depuis un token CI unique découple les déploiements des identités Git et évite cette facturation.

## Modèle d'environnements

Trois environnements par app (cf. **Preview** / **Dev** / **Production** dans `CONTEXT.md`) :

- **Preview** — sur PR (`pull_request`), build Vercel en cible `preview`, URL éphémère commentée sur la PR.
- **Dev** — sur push `main`, build `preview` réattribué (`alias`) à une URL `*.vercel.app` stable.
- **Production** — déclenchement **manuel** (`workflow_dispatch`), build `--prod`.

Le build reste **exécuté sur Vercel** (mode CLI de l'action, pas `prebuilt`) : on ne change que le
déclencheur, la configuration de build et les variables d'environnement restent dans le projet Vercel,
scopées par environnement. La build command du Website (qui inclut `payload migrate`) est laissée
inchangée. Les déploiements ne sont **pas** conditionnés par la CI (`ci-checks.yml`).

## Considered Options

- **Garder l'intégration Git native** — rejetée : c'est précisément ce qui déclenche la facturation par siège.
- **Promote l'artefact Dev en Production** (au lieu de rebuild `--prod`) — rejetée : Next.js fige les
  `NEXT_PUBLIC_*` dans le bundle **au moment du build**, et ces variables diffèrent entre Dev et Production
  (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, projet Supabase). Promouvoir l'artefact Dev shipperait
  les valeurs publiques de Dev en prod. La Production doit donc être **rebuildée** avec l'env scopé Production.
- **Builder sur GitHub Actions (`prebuilt`)** — rejetée pour ce ticket : réutilise le Turbo cache mais
  réimplémente le build (monorepo, libs, `payload generate:importmap`) pour un bénéfice (build minutes)
  qui n'est pas une contrainte ici. Le build reste sur Vercel.

## Consequences

- Le token Vercel (`VERCEL_TOKEN`) devient un secret critique : il porte à lui seul le droit de déployer.
- Tant que `git.deploymentEnabled: false` est en place, **aucun** déploiement n'est automatique sur push :
  retirer ce flag réactiverait silencieusement l'intégration native (et la facturation).
- `payload migrate` continue de tourner dans le build Vercel (anti-pattern connu : build ≠ release,
  builds concurrents) — laissé en l'état, hors scope de cette décision, à revisiter séparément.
- La Production est un acte manuel : pas de déploiement prod automatique au merge.
