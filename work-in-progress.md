- gérer les images redimensionnées etc

- retirer les mentions à google maps et jina pour utiliser des mots clefs

- ajouter sentry sur les APIs

- lorsqu'on a validé un poi qui est maintenant désactivé ou supprimé on voit encore sa validation

- statue faidherbe en double sur dev / prd et pas local -> bien présente 2 fois sur Mapbox avec précision réduite, de base les points sont à 1 mètre et au zoom 10 ça tombe peut etre à 10 mètres près

- comparer la version de poi_enriched comme ça pour les relancer je peux mettre 0 en bdd + ajouter status cancelled comme ça on conserve le num de version précédent

- spinner discret debug pour les admins quand une requete réseau tourne ou lib plus complète

- Migrer vers ESLint v10 quand typescript-eslint l'aura supporté (actuellement on utilise ESLint V9)

- surveiller les releases d'expo pour avoir eslint-plugin-react-hooks v6 et regarder si ça trigger les erreurs de react-compiler - et retirer eslint-plugin-react-compiler

- expo picker mettre et tester shouldDownloadFromNetwork true
- on a plus l'orientation de la photo dans les exif ?
- si on a une 404 ne pas retry via react query

