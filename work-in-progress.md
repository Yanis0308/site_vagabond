- forcer SSL sur supabase

- modifier et valider une liste de catégories de 100 éléments max
- gérer les images
- clean les retours jina ?

- lire tout le code wikidata et wikipedia

- retirer les mentions à google maps et jina pour utiliser des mots clefs

- ajouter sentry sur les APIs

- Pour Jina :
  -- récupérer liste de 10 résultats (au lieu de 5)
  -- tester / retirer insta, facebook, tripadvisor etc ou les gérer avec un mode qui supporte JS
  -- wikipedia retirer et le faire à la mano pour éviter de récupérer trop de contenu (Palais des Beaux arts de Lille 148k token)

- lorsqu'on a validé un poi qui est maintenant désactivé ou supprimé on voit encore sa validation

- les images de la PlaceDetailsSheet n'ont plus besoin d'être centré avec largeur fixe quand on en a plusieurs

- vérifier que hôtel particulier est désormais bien exclu

- statue faidherbe en double sur dev / prd et pas local -> bien présente 2 fois sur Mapbox avec précision réduite, de base les points sont à 1 mètre et au zoom 10 ça tombe peut etre à 10 mètres près

- les points désactivés s'affichent toujours sur mapbox
- les points ajoutés en bdd sont manquants sur mapbox sans synchronisation

- vérifier que la bdd de DEV n'est pas exposée publiquement par la data API de supabase (activée pour le MCP supabase pour ChatGPT)

- comparer la version de poi_enriched comme ça pour les relancer je peux mettre 0 en bdd + ajouter status cancelled comme ça on conserve le num de version précédent

- spinner discret debug pour les admins quand une requete réseau tourne ou lib plus complète

- Migrer vers ESLint v10 quand typescript-eslint l'aura supporté (actuellement on utilise ESLint V9)
