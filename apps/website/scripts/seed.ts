import { getPayload } from "payload";

import config from "../payload.config";

const REGIONS = [
  {
    slug: "auvergne-rhone-alpes",
    nom: "Auvergne-Rhône-Alpes",
    nomComplet: "l'Auvergne-Rhône-Alpes",
  },
  {
    slug: "bourgogne-franche-comte",
    nom: "Bourgogne-Franche-Comté",
    nomComplet: "la Bourgogne-Franche-Comté",
  },
  { slug: "bretagne", nom: "Bretagne", nomComplet: "la Bretagne" },
  {
    slug: "centre-val-de-loire",
    nom: "Centre-Val de Loire",
    nomComplet: "le Centre-Val de Loire",
  },
  { slug: "corse", nom: "Corse", nomComplet: "la Corse" },
  { slug: "grand-est", nom: "Grand Est", nomComplet: "le Grand Est" },
  {
    slug: "hauts-de-france",
    nom: "Hauts-de-France",
    nomComplet: "les Hauts-de-France",
  },
  {
    slug: "ile-de-france",
    nom: "Île-de-France",
    nomComplet: "l'Île-de-France",
  },
  { slug: "normandie", nom: "Normandie", nomComplet: "la Normandie" },
  {
    slug: "nouvelle-aquitaine",
    nom: "Nouvelle-Aquitaine",
    nomComplet: "la Nouvelle-Aquitaine",
  },
  { slug: "occitanie", nom: "Occitanie", nomComplet: "l'Occitanie" },
  {
    slug: "pays-de-la-loire",
    nom: "Pays de la Loire",
    nomComplet: "les Pays de la Loire",
  },
  {
    slug: "provence-alpes-cote-dazur",
    nom: "Provence-Alpes-Côte d'Azur",
    nomComplet: "la Provence-Alpes-Côte d'Azur",
  },
];

const REGION_NB_POIS: Record<string, number> = {
  "auvergne-rhone-alpes": 17726,
  "bourgogne-franche-comte": 10722,
  bretagne: 7815,
  "centre-val-de-loire": 6101,
  corse: 1410,
  "grand-est": 15250,
  "hauts-de-france": 11821,
  "ile-de-france": 8460,
  normandie: 8882,
  "nouvelle-aquitaine": 14544,
  occitanie: 16460,
  "pays-de-la-loire": 5881,
  "provence-alpes-cote-dazur": 7676,
};

const REGION_TOP_POIS: Record<string, Array<{ nom: string; slug: string }>> = {
  "auvergne-rhone-alpes": [
    { nom: "Chaîne des Puys", slug: "chaine-des-puys" },
    { nom: "Lac d'Annecy", slug: "lac-d-annecy" },
    { nom: "Mont Blanc", slug: "mont-blanc" },
    { nom: "Gorges de l'Ardèche", slug: "gorges-de-l-ardeche" },
    { nom: "Vieux Lyon", slug: "vieux-lyon" },
    { nom: "Parc naturel du Vercors", slug: "parc-naturel-du-vercors" },
  ],
  "bourgogne-franche-comte": [
    { nom: "Hospices de Beaune", slug: "hospices-de-beaune" },
    { nom: "Abbaye de Fontenay", slug: "abbaye-de-fontenay" },
    { nom: "Roche de Solutré", slug: "roche-de-solutre" },
    { nom: "Citadelle de Besançon", slug: "citadelle-de-besancon" },
    { nom: "Route des Grands Crus", slug: "route-des-grands-crus" },
    { nom: "Cascades du Hérisson", slug: "cascades-du-herisson" },
  ],
  bretagne: [
    { nom: "Pointe du Raz", slug: "pointe-du-raz" },
    { nom: "Fort de Saint-Malo", slug: "fort-de-saint-malo" },
    { nom: "Alignements de Carnac", slug: "alignements-de-carnac" },
    { nom: "Côte de Granit Rose", slug: "cote-de-granit-rose" },
    { nom: "Forêt de Brocéliande", slug: "foret-de-broceliande" },
  ],
  "centre-val-de-loire": [
    { nom: "Château de Chambord", slug: "chateau-de-chambord" },
    { nom: "Château de Chenonceau", slug: "chateau-de-chenonceau" },
    { nom: "Cathédrale de Chartres", slug: "cathedrale-de-chartres" },
    { nom: "Château d'Amboise", slug: "chateau-d-amboise" },
    { nom: "Château de Villandry", slug: "chateau-de-villandry" },
  ],
  corse: [
    { nom: "Calanques de Piana", slug: "calanques-de-piana" },
    { nom: "GR20", slug: "gr20" },
    { nom: "Citadelle de Bonifacio", slug: "citadelle-de-bonifacio" },
    { nom: "Réserve de Scandola", slug: "reserve-de-scandola" },
    { nom: "Aiguilles de Bavella", slug: "aiguilles-de-bavella" },
  ],
  "grand-est": [
    { nom: "Cathédrale de Strasbourg", slug: "cathedrale-de-strasbourg" },
    { nom: "Place Stanislas", slug: "place-stanislas" },
    { nom: "Route des Vins d'Alsace", slug: "route-des-vins-d-alsace" },
    { nom: "Cathédrale de Reims", slug: "cathedrale-de-reims" },
    { nom: "Haut-Koenigsbourg", slug: "haut-koenigsbourg" },
    { nom: "Petite France Strasbourg", slug: "petite-france-strasbourg" },
  ],
  "hauts-de-france": [
    { nom: "Baie de Somme", slug: "baie-de-somme" },
    { nom: "Cathédrale d'Amiens", slug: "cathedrale-d-amiens" },
    { nom: "Beffroi de Lille", slug: "beffroi-de-lille" },
    {
      nom: "Palais des Beaux-Arts de Lille",
      slug: "palais-des-beaux-arts-de-lille",
    },
    { nom: "Cap Blanc-Nez", slug: "cap-blanc-nez" },
    { nom: "Château de Chantilly", slug: "chateau-de-chantilly" },
  ],
  "ile-de-france": [
    { nom: "Tour Eiffel", slug: "tour-eiffel" },
    { nom: "Château de Versailles", slug: "chateau-de-versailles" },
    { nom: "Musée du Louvre", slug: "musee-du-louvre" },
    { nom: "Sacré-Cœur", slug: "sacre-coeur" },
    { nom: "Disneyland Paris", slug: "disneyland-paris" },
    { nom: "Château de Fontainebleau", slug: "chateau-de-fontainebleau" },
  ],
  normandie: [
    { nom: "Falaises d'Étretat", slug: "falaises-d-etretat" },
    { nom: "Plages du Débarquement", slug: "plages-du-debarquement" },
    { nom: "Tapisserie de Bayeux", slug: "tapisserie-de-bayeux" },
    { nom: "Giverny", slug: "giverny" },
    { nom: "Abbaye du Mont-Saint-Michel", slug: "abbaye-du-mont-saint-michel" },
    { nom: "Honfleur", slug: "honfleur" },
  ],
  "nouvelle-aquitaine": [
    { nom: "Dune du Pilat", slug: "dune-du-pilat" },
    { nom: "Saint-Émilion", slug: "saint-emilion" },
    { nom: "Grottes de Lascaux", slug: "grottes-de-lascaux" },
    { nom: "Cité du Vin", slug: "cite-du-vin" },
    { nom: "Île de Ré", slug: "ile-de-re" },
    { nom: "Futuroscope", slug: "futuroscope" },
  ],
  occitanie: [
    { nom: "Cité de Carcassonne", slug: "cite-de-carcassonne" },
    { nom: "Pont du Gard", slug: "pont-du-gard" },
    { nom: "Cirque de Gavarnie", slug: "cirque-de-gavarnie" },
    { nom: "Canal du Midi", slug: "canal-du-midi" },
    { nom: "Viaduc de Millau", slug: "viaduc-de-millau" },
    { nom: "Gouffre de Padirac", slug: "gouffre-de-padirac" },
  ],
  "pays-de-la-loire": [
    { nom: "Machines de l'Île", slug: "machines-de-l-ile" },
    {
      nom: "Château des Ducs de Bretagne",
      slug: "chateau-des-ducs-de-bretagne",
    },
    { nom: "Abbaye de Fontevraud", slug: "abbaye-de-fontevraud" },
    { nom: "Puy du Fou", slug: "puy-du-fou" },
    { nom: "Le Mans Classic", slug: "le-mans-classic" },
  ],
  "provence-alpes-cote-dazur": [
    { nom: "Calanques de Marseille", slug: "calanques-de-marseille" },
    { nom: "Palais des Papes", slug: "palais-des-papes" },
    { nom: "Gorges du Verdon", slug: "gorges-du-verdon" },
    { nom: "Promenade des Anglais", slug: "promenade-des-anglais" },
    { nom: "Saint-Tropez", slug: "saint-tropez" },
    { nom: "Luberon", slug: "luberon" },
  ],
};

const DEPARTEMENTS: Array<{
  slug: string;
  nom: string;
  numero: string;
  regionSlug: string;
}> = [
  // Auvergne-Rhône-Alpes
  { slug: "ain", nom: "Ain", numero: "01", regionSlug: "auvergne-rhone-alpes" },
  {
    slug: "allier",
    nom: "Allier",
    numero: "03",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "ardeche",
    nom: "Ardèche",
    numero: "07",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "cantal",
    nom: "Cantal",
    numero: "15",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "drome",
    nom: "Drôme",
    numero: "26",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "isere",
    nom: "Isère",
    numero: "38",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "loire",
    nom: "Loire",
    numero: "42",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "haute-loire",
    nom: "Haute-Loire",
    numero: "43",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "puy-de-dome",
    nom: "Puy-de-Dôme",
    numero: "63",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "rhone",
    nom: "Rhône",
    numero: "69",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "savoie",
    nom: "Savoie",
    numero: "73",
    regionSlug: "auvergne-rhone-alpes",
  },
  {
    slug: "haute-savoie",
    nom: "Haute-Savoie",
    numero: "74",
    regionSlug: "auvergne-rhone-alpes",
  },
  // Bourgogne-Franche-Comté
  {
    slug: "cote-dor",
    nom: "Côte-d'Or",
    numero: "21",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "doubs",
    nom: "Doubs",
    numero: "25",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "jura",
    nom: "Jura",
    numero: "39",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "nievre",
    nom: "Nièvre",
    numero: "58",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "haute-saone",
    nom: "Haute-Saône",
    numero: "70",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "saone-et-loire",
    nom: "Saône-et-Loire",
    numero: "71",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "yonne",
    nom: "Yonne",
    numero: "89",
    regionSlug: "bourgogne-franche-comte",
  },
  {
    slug: "territoire-de-belfort",
    nom: "Territoire de Belfort",
    numero: "90",
    regionSlug: "bourgogne-franche-comte",
  },
  // Bretagne
  {
    slug: "cotes-darmor",
    nom: "Côtes-d'Armor",
    numero: "22",
    regionSlug: "bretagne",
  },
  { slug: "finistere", nom: "Finistère", numero: "29", regionSlug: "bretagne" },
  {
    slug: "ille-et-vilaine",
    nom: "Ille-et-Vilaine",
    numero: "35",
    regionSlug: "bretagne",
  },
  { slug: "morbihan", nom: "Morbihan", numero: "56", regionSlug: "bretagne" },
  // Centre-Val de Loire
  {
    slug: "cher",
    nom: "Cher",
    numero: "18",
    regionSlug: "centre-val-de-loire",
  },
  {
    slug: "eure-et-loir",
    nom: "Eure-et-Loir",
    numero: "28",
    regionSlug: "centre-val-de-loire",
  },
  {
    slug: "indre",
    nom: "Indre",
    numero: "36",
    regionSlug: "centre-val-de-loire",
  },
  {
    slug: "indre-et-loire",
    nom: "Indre-et-Loire",
    numero: "37",
    regionSlug: "centre-val-de-loire",
  },
  {
    slug: "loir-et-cher",
    nom: "Loir-et-Cher",
    numero: "41",
    regionSlug: "centre-val-de-loire",
  },
  {
    slug: "loiret",
    nom: "Loiret",
    numero: "45",
    regionSlug: "centre-val-de-loire",
  },
  // Corse
  {
    slug: "corse-du-sud",
    nom: "Corse-du-Sud",
    numero: "2A",
    regionSlug: "corse",
  },
  {
    slug: "haute-corse",
    nom: "Haute-Corse",
    numero: "2B",
    regionSlug: "corse",
  },
  // Grand Est
  { slug: "ardennes", nom: "Ardennes", numero: "08", regionSlug: "grand-est" },
  { slug: "aube", nom: "Aube", numero: "10", regionSlug: "grand-est" },
  { slug: "marne", nom: "Marne", numero: "51", regionSlug: "grand-est" },
  {
    slug: "haute-marne",
    nom: "Haute-Marne",
    numero: "52",
    regionSlug: "grand-est",
  },
  {
    slug: "meurthe-et-moselle",
    nom: "Meurthe-et-Moselle",
    numero: "54",
    regionSlug: "grand-est",
  },
  { slug: "meuse", nom: "Meuse", numero: "55", regionSlug: "grand-est" },
  { slug: "moselle", nom: "Moselle", numero: "57", regionSlug: "grand-est" },
  { slug: "bas-rhin", nom: "Bas-Rhin", numero: "67", regionSlug: "grand-est" },
  {
    slug: "haut-rhin",
    nom: "Haut-Rhin",
    numero: "68",
    regionSlug: "grand-est",
  },
  { slug: "vosges", nom: "Vosges", numero: "88", regionSlug: "grand-est" },
  // Hauts-de-France
  { slug: "aisne", nom: "Aisne", numero: "02", regionSlug: "hauts-de-france" },
  { slug: "nord", nom: "Nord", numero: "59", regionSlug: "hauts-de-france" },
  { slug: "oise", nom: "Oise", numero: "60", regionSlug: "hauts-de-france" },
  {
    slug: "pas-de-calais",
    nom: "Pas-de-Calais",
    numero: "62",
    regionSlug: "hauts-de-france",
  },
  { slug: "somme", nom: "Somme", numero: "80", regionSlug: "hauts-de-france" },
  // Île-de-France
  { slug: "paris", nom: "Paris", numero: "75", regionSlug: "ile-de-france" },
  {
    slug: "seine-et-marne",
    nom: "Seine-et-Marne",
    numero: "77",
    regionSlug: "ile-de-france",
  },
  {
    slug: "yvelines",
    nom: "Yvelines",
    numero: "78",
    regionSlug: "ile-de-france",
  },
  {
    slug: "essonne",
    nom: "Essonne",
    numero: "91",
    regionSlug: "ile-de-france",
  },
  {
    slug: "hauts-de-seine",
    nom: "Hauts-de-Seine",
    numero: "92",
    regionSlug: "ile-de-france",
  },
  {
    slug: "seine-saint-denis",
    nom: "Seine-Saint-Denis",
    numero: "93",
    regionSlug: "ile-de-france",
  },
  {
    slug: "val-de-marne",
    nom: "Val-de-Marne",
    numero: "94",
    regionSlug: "ile-de-france",
  },
  {
    slug: "val-doise",
    nom: "Val-d'Oise",
    numero: "95",
    regionSlug: "ile-de-france",
  },
  // Normandie
  { slug: "calvados", nom: "Calvados", numero: "14", regionSlug: "normandie" },
  { slug: "eure", nom: "Eure", numero: "27", regionSlug: "normandie" },
  { slug: "manche", nom: "Manche", numero: "50", regionSlug: "normandie" },
  { slug: "orne", nom: "Orne", numero: "61", regionSlug: "normandie" },
  {
    slug: "seine-maritime",
    nom: "Seine-Maritime",
    numero: "76",
    regionSlug: "normandie",
  },
  // Nouvelle-Aquitaine
  {
    slug: "charente",
    nom: "Charente",
    numero: "16",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "charente-maritime",
    nom: "Charente-Maritime",
    numero: "17",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "correze",
    nom: "Corrèze",
    numero: "19",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "creuse",
    nom: "Creuse",
    numero: "23",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "dordogne",
    nom: "Dordogne",
    numero: "24",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "gironde",
    nom: "Gironde",
    numero: "33",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "landes",
    nom: "Landes",
    numero: "40",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "lot-et-garonne",
    nom: "Lot-et-Garonne",
    numero: "47",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "pyrenees-atlantiques",
    nom: "Pyrénées-Atlantiques",
    numero: "64",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "deux-sevres",
    nom: "Deux-Sèvres",
    numero: "79",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "vienne",
    nom: "Vienne",
    numero: "86",
    regionSlug: "nouvelle-aquitaine",
  },
  {
    slug: "haute-vienne",
    nom: "Haute-Vienne",
    numero: "87",
    regionSlug: "nouvelle-aquitaine",
  },
  // Occitanie
  { slug: "ariege", nom: "Ariège", numero: "09", regionSlug: "occitanie" },
  { slug: "aude", nom: "Aude", numero: "11", regionSlug: "occitanie" },
  { slug: "aveyron", nom: "Aveyron", numero: "12", regionSlug: "occitanie" },
  { slug: "gard", nom: "Gard", numero: "30", regionSlug: "occitanie" },
  {
    slug: "haute-garonne",
    nom: "Haute-Garonne",
    numero: "31",
    regionSlug: "occitanie",
  },
  { slug: "gers", nom: "Gers", numero: "32", regionSlug: "occitanie" },
  { slug: "herault", nom: "Hérault", numero: "34", regionSlug: "occitanie" },
  { slug: "lot", nom: "Lot", numero: "46", regionSlug: "occitanie" },
  { slug: "lozere", nom: "Lozère", numero: "48", regionSlug: "occitanie" },
  {
    slug: "hautes-pyrenees",
    nom: "Hautes-Pyrénées",
    numero: "65",
    regionSlug: "occitanie",
  },
  {
    slug: "pyrenees-orientales",
    nom: "Pyrénées-Orientales",
    numero: "66",
    regionSlug: "occitanie",
  },
  { slug: "tarn", nom: "Tarn", numero: "81", regionSlug: "occitanie" },
  {
    slug: "tarn-et-garonne",
    nom: "Tarn-et-Garonne",
    numero: "82",
    regionSlug: "occitanie",
  },
  // Pays de la Loire
  {
    slug: "loire-atlantique",
    nom: "Loire-Atlantique",
    numero: "44",
    regionSlug: "pays-de-la-loire",
  },
  {
    slug: "maine-et-loire",
    nom: "Maine-et-Loire",
    numero: "49",
    regionSlug: "pays-de-la-loire",
  },
  {
    slug: "mayenne",
    nom: "Mayenne",
    numero: "53",
    regionSlug: "pays-de-la-loire",
  },
  {
    slug: "sarthe",
    nom: "Sarthe",
    numero: "72",
    regionSlug: "pays-de-la-loire",
  },
  {
    slug: "vendee",
    nom: "Vendée",
    numero: "85",
    regionSlug: "pays-de-la-loire",
  },
  // Provence-Alpes-Côte d'Azur
  {
    slug: "alpes-de-haute-provence",
    nom: "Alpes-de-Haute-Provence",
    numero: "04",
    regionSlug: "provence-alpes-cote-dazur",
  },
  {
    slug: "hautes-alpes",
    nom: "Hautes-Alpes",
    numero: "05",
    regionSlug: "provence-alpes-cote-dazur",
  },
  {
    slug: "alpes-maritimes",
    nom: "Alpes-Maritimes",
    numero: "06",
    regionSlug: "provence-alpes-cote-dazur",
  },
  {
    slug: "bouches-du-rhone",
    nom: "Bouches-du-Rhône",
    numero: "13",
    regionSlug: "provence-alpes-cote-dazur",
  },
  {
    slug: "var",
    nom: "Var",
    numero: "83",
    regionSlug: "provence-alpes-cote-dazur",
  },
  {
    slug: "vaucluse",
    nom: "Vaucluse",
    numero: "84",
    regionSlug: "provence-alpes-cote-dazur",
  },
];

const DEPARTEMENT_NB_POIS: Record<string, number> = {
  // Auvergne-Rhône-Alpes (17726 total)
  ain: 1767,
  allier: 1222,
  ardeche: 1448,
  cantal: 940,
  drome: 1341,
  isere: 2403,
  loire: 1308,
  "haute-loire": 1023,
  "puy-de-dome": 1662,
  rhone: 1709,
  savoie: 1389,
  "haute-savoie": 1514,
  // Bourgogne-Franche-Comté (10722 total)
  "cote-dor": 2132,
  doubs: 1652,
  jura: 1621,
  nievre: 795,
  "haute-saone": 1221,
  "saone-et-loire": 1886,
  yonne: 1188,
  "territoire-de-belfort": 225,
  // Bretagne (7815 total)
  "cotes-darmor": 2016,
  finistere: 2388,
  "ille-et-vilaine": 1453,
  morbihan: 1958,
  // Centre-Val de Loire (6101 total)
  cher: 829,
  "eure-et-loir": 899,
  indre: 891,
  "indre-et-loire": 1234,
  "loir-et-cher": 962,
  loiret: 1286,
  // Corse (1410 total)
  "corse-du-sud": 499,
  "haute-corse": 911,
  // Grand Est (15250 total)
  ardennes: 1181,
  aube: 962,
  marne: 1639,
  "haute-marne": 1075,
  "meurthe-et-moselle": 1328,
  meuse: 1095,
  moselle: 2590,
  "bas-rhin": 2519,
  "haut-rhin": 1616,
  vosges: 1245,
  // Hauts-de-France (11821 total)
  aisne: 2078,
  nord: 2833,
  oise: 1967,
  "pas-de-calais": 2923,
  somme: 2020,
  // Île-de-France (8460 total)
  paris: 2340,
  "seine-et-marne": 1453,
  yvelines: 1404,
  essonne: 915,
  "hauts-de-seine": 669,
  "seine-saint-denis": 338,
  "val-de-marne": 628,
  "val-doise": 713,
  // Normandie (8882 total)
  calvados: 2393,
  eure: 1271,
  manche: 1714,
  orne: 1337,
  "seine-maritime": 2167,
  // Nouvelle-Aquitaine (14544 total)
  charente: 1008,
  "charente-maritime": 1626,
  correze: 908,
  creuse: 647,
  dordogne: 1630,
  gironde: 1891,
  landes: 1185,
  "lot-et-garonne": 1049,
  "pyrenees-atlantiques": 1873,
  "deux-sevres": 1012,
  vienne: 937,
  "haute-vienne": 778,
  // Occitanie (16460 total)
  ariege: 916,
  aude: 1531,
  aveyron: 1553,
  gard: 1505,
  "haute-garonne": 1873,
  gers: 1243,
  herault: 2074,
  lot: 1027,
  lozere: 650,
  "hautes-pyrenees": 1037,
  "pyrenees-orientales": 1205,
  tarn: 1183,
  "tarn-et-garonne": 663,
  // Pays de la Loire (5881 total)
  "loire-atlantique": 1490,
  "maine-et-loire": 1503,
  mayenne: 808,
  sarthe: 976,
  vendee: 1104,
  // Provence-Alpes-Côte d'Azur (7676 total)
  "alpes-de-haute-provence": 1054,
  "hautes-alpes": 1001,
  "alpes-maritimes": 1528,
  "bouches-du-rhone": 1722,
  var: 1242,
  vaucluse: 1128,
};

const VILLES: Array<{
  slug: string;
  nom: string;
  departementSlug: string;
  population: number;
  nbPois: number;
  latitude: number;
  longitude: number;
}> = [
  // Île-de-France
  {
    slug: "paris",
    nom: "Paris",
    departementSlug: "paris",
    population: 2161000,
    nbPois: 50,
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    slug: "argenteuil",
    nom: "Argenteuil",
    departementSlug: "val-doise",
    population: 113200,
    nbPois: 12,
    latitude: 48.9472,
    longitude: 2.2467,
  },
  {
    slug: "saint-denis",
    nom: "Saint-Denis",
    departementSlug: "seine-saint-denis",
    population: 113100,
    nbPois: 14,
    latitude: 48.9362,
    longitude: 2.3574,
  },
  {
    slug: "montreuil",
    nom: "Montreuil",
    departementSlug: "seine-saint-denis",
    population: 109900,
    nbPois: 12,
    latitude: 48.8638,
    longitude: 2.4484,
  },
  {
    slug: "nanterre",
    nom: "Nanterre",
    departementSlug: "hauts-de-seine",
    population: 96200,
    nbPois: 10,
    latitude: 48.8924,
    longitude: 2.2071,
  },
  {
    slug: "creteil",
    nom: "Créteil",
    departementSlug: "val-de-marne",
    population: 92400,
    nbPois: 9,
    latitude: 48.791,
    longitude: 2.4628,
  },
  {
    slug: "versailles",
    nom: "Versailles",
    departementSlug: "yvelines",
    population: 85400,
    nbPois: 18,
    latitude: 48.8014,
    longitude: 2.1301,
  },

  // Auvergne-Rhône-Alpes
  {
    slug: "lyon",
    nom: "Lyon",
    departementSlug: "rhone",
    population: 522250,
    nbPois: 45,
    latitude: 45.764,
    longitude: 4.8357,
  },
  {
    slug: "saint-etienne",
    nom: "Saint-Étienne",
    departementSlug: "loire",
    population: 174600,
    nbPois: 20,
    latitude: 45.4397,
    longitude: 4.3872,
  },
  {
    slug: "grenoble",
    nom: "Grenoble",
    departementSlug: "isere",
    population: 158200,
    nbPois: 22,
    latitude: 45.1885,
    longitude: 5.7245,
  },
  {
    slug: "villeurbanne",
    nom: "Villeurbanne",
    departementSlug: "rhone",
    population: 154800,
    nbPois: 14,
    latitude: 45.7667,
    longitude: 4.88,
  },
  {
    slug: "clermont-ferrand",
    nom: "Clermont-Ferrand",
    departementSlug: "puy-de-dome",
    population: 147800,
    nbPois: 18,
    latitude: 45.7772,
    longitude: 3.087,
  },
  {
    slug: "valence",
    nom: "Valence",
    departementSlug: "drome",
    population: 65600,
    nbPois: 10,
    latitude: 44.9334,
    longitude: 4.8924,
  },
  {
    slug: "chambery",
    nom: "Chambéry",
    departementSlug: "savoie",
    population: 60600,
    nbPois: 12,
    latitude: 45.5646,
    longitude: 5.9178,
  },
  {
    slug: "bourg-en-bresse",
    nom: "Bourg-en-Bresse",
    departementSlug: "ain",
    population: 42600,
    nbPois: 8,
    latitude: 46.2056,
    longitude: 5.2254,
  },
  {
    slug: "aurillac",
    nom: "Aurillac",
    departementSlug: "cantal",
    population: 25300,
    nbPois: 6,
    latitude: 44.9261,
    longitude: 2.441,
  },
  {
    slug: "privas",
    nom: "Privas",
    departementSlug: "ardeche",
    population: 8700,
    nbPois: 5,
    latitude: 44.7355,
    longitude: 4.5986,
  },
  {
    slug: "moulins",
    nom: "Moulins",
    departementSlug: "allier",
    population: 19700,
    nbPois: 6,
    latitude: 46.5646,
    longitude: 3.3327,
  },

  // Bourgogne-Franche-Comté
  {
    slug: "dijon",
    nom: "Dijon",
    departementSlug: "cote-dor",
    population: 159350,
    nbPois: 22,
    latitude: 47.322,
    longitude: 5.0415,
  },
  {
    slug: "besancon",
    nom: "Besançon",
    departementSlug: "doubs",
    population: 120800,
    nbPois: 16,
    latitude: 47.2378,
    longitude: 6.0241,
  },
  {
    slug: "belfort",
    nom: "Belfort",
    departementSlug: "territoire-de-belfort",
    population: 46400,
    nbPois: 8,
    latitude: 47.64,
    longitude: 6.86,
  },
  {
    slug: "auxerre",
    nom: "Auxerre",
    departementSlug: "yonne",
    population: 35100,
    nbPois: 8,
    latitude: 47.7979,
    longitude: 3.5714,
  },
  {
    slug: "lons-le-saunier",
    nom: "Lons-le-Saunier",
    departementSlug: "jura",
    population: 17200,
    nbPois: 6,
    latitude: 46.6754,
    longitude: 5.5519,
  },
  {
    slug: "vesoul",
    nom: "Vesoul",
    departementSlug: "haute-saone",
    population: 14800,
    nbPois: 5,
    latitude: 47.62,
    longitude: 6.15,
  },

  // Bretagne
  {
    slug: "rennes",
    nom: "Rennes",
    departementSlug: "ille-et-vilaine",
    population: 222500,
    nbPois: 25,
    latitude: 48.1173,
    longitude: -1.6778,
  },
  {
    slug: "brest",
    nom: "Brest",
    departementSlug: "finistere",
    population: 142700,
    nbPois: 18,
    latitude: 48.3904,
    longitude: -4.4861,
  },
  {
    slug: "saint-malo",
    nom: "Saint-Malo",
    departementSlug: "ille-et-vilaine",
    population: 46500,
    nbPois: 15,
    latitude: 48.6493,
    longitude: -1.999,
  },
  {
    slug: "lorient",
    nom: "Lorient",
    departementSlug: "morbihan",
    population: 57800,
    nbPois: 10,
    latitude: 47.7483,
    longitude: -3.37,
  },
  {
    slug: "vannes",
    nom: "Vannes",
    departementSlug: "morbihan",
    population: 55400,
    nbPois: 12,
    latitude: 47.6559,
    longitude: -2.76,
  },
  {
    slug: "quimper",
    nom: "Quimper",
    departementSlug: "finistere",
    population: 63900,
    nbPois: 12,
    latitude: 47.996,
    longitude: -4.1024,
  },

  // Centre-Val de Loire
  {
    slug: "tours",
    nom: "Tours",
    departementSlug: "indre-et-loire",
    population: 139200,
    nbPois: 18,
    latitude: 47.3941,
    longitude: 0.6848,
  },
  {
    slug: "orleans",
    nom: "Orléans",
    departementSlug: "loiret",
    population: 116700,
    nbPois: 16,
    latitude: 47.9029,
    longitude: 1.9093,
  },
  {
    slug: "bourges",
    nom: "Bourges",
    departementSlug: "cher",
    population: 66600,
    nbPois: 12,
    latitude: 47.081,
    longitude: 2.3988,
  },
  {
    slug: "blois",
    nom: "Blois",
    departementSlug: "loir-et-cher",
    population: 47100,
    nbPois: 10,
    latitude: 47.5861,
    longitude: 1.3359,
  },
  {
    slug: "chartres",
    nom: "Chartres",
    departementSlug: "eure-et-loir",
    population: 39200,
    nbPois: 10,
    latitude: 48.4469,
    longitude: 1.4891,
  },
  {
    slug: "chateauroux",
    nom: "Châteauroux",
    departementSlug: "indre",
    population: 43500,
    nbPois: 7,
    latitude: 46.8103,
    longitude: 1.6916,
  },

  // Corse
  {
    slug: "ajaccio",
    nom: "Ajaccio",
    departementSlug: "corse-du-sud",
    population: 73000,
    nbPois: 14,
    latitude: 41.9192,
    longitude: 8.7386,
  },
  {
    slug: "bastia",
    nom: "Bastia",
    departementSlug: "haute-corse",
    population: 48500,
    nbPois: 12,
    latitude: 42.6972,
    longitude: 9.451,
  },

  // Grand Est
  {
    slug: "strasbourg",
    nom: "Strasbourg",
    departementSlug: "bas-rhin",
    population: 287200,
    nbPois: 35,
    latitude: 48.5734,
    longitude: 7.7521,
  },
  {
    slug: "reims",
    nom: "Reims",
    departementSlug: "marne",
    population: 184000,
    nbPois: 22,
    latitude: 49.2583,
    longitude: 3.9797,
  },
  {
    slug: "metz",
    nom: "Metz",
    departementSlug: "moselle",
    population: 121800,
    nbPois: 18,
    latitude: 49.1193,
    longitude: 6.1757,
  },
  {
    slug: "mulhouse",
    nom: "Mulhouse",
    departementSlug: "haut-rhin",
    population: 109400,
    nbPois: 14,
    latitude: 47.7508,
    longitude: 7.3359,
  },
  {
    slug: "nancy",
    nom: "Nancy",
    departementSlug: "meurthe-et-moselle",
    population: 105100,
    nbPois: 16,
    latitude: 48.6921,
    longitude: 6.1844,
  },
  {
    slug: "colmar",
    nom: "Colmar",
    departementSlug: "haut-rhin",
    population: 70400,
    nbPois: 14,
    latitude: 48.0794,
    longitude: 7.3558,
  },
  {
    slug: "troyes",
    nom: "Troyes",
    departementSlug: "aube",
    population: 61600,
    nbPois: 12,
    latitude: 48.2973,
    longitude: 4.0744,
  },
  {
    slug: "charleville-mezieres",
    nom: "Charleville-Mézières",
    departementSlug: "ardennes",
    population: 47600,
    nbPois: 7,
    latitude: 49.7719,
    longitude: 4.72,
  },
  {
    slug: "epinal",
    nom: "Épinal",
    departementSlug: "vosges",
    population: 31900,
    nbPois: 7,
    latitude: 48.1725,
    longitude: 6.4502,
  },
  {
    slug: "chaumont",
    nom: "Chaumont",
    departementSlug: "haute-marne",
    population: 22100,
    nbPois: 5,
    latitude: 48.1116,
    longitude: 5.1389,
  },
  {
    slug: "bar-le-duc",
    nom: "Bar-le-Duc",
    departementSlug: "meuse",
    population: 14900,
    nbPois: 5,
    latitude: 48.7725,
    longitude: 5.16,
  },

  // Hauts-de-France
  {
    slug: "lille",
    nom: "Lille",
    departementSlug: "nord",
    population: 236700,
    nbPois: 30,
    latitude: 50.6292,
    longitude: 3.0573,
  },
  {
    slug: "amiens",
    nom: "Amiens",
    departementSlug: "somme",
    population: 135500,
    nbPois: 16,
    latitude: 49.8941,
    longitude: 2.2958,
  },
  {
    slug: "roubaix",
    nom: "Roubaix",
    departementSlug: "nord",
    population: 99200,
    nbPois: 10,
    latitude: 50.6942,
    longitude: 3.1746,
  },
  {
    slug: "tourcoing",
    nom: "Tourcoing",
    departementSlug: "nord",
    population: 98700,
    nbPois: 9,
    latitude: 50.7233,
    longitude: 3.1611,
  },
  {
    slug: "dunkerque",
    nom: "Dunkerque",
    departementSlug: "nord",
    population: 87100,
    nbPois: 10,
    latitude: 51.0343,
    longitude: 2.3768,
  },
  {
    slug: "calais",
    nom: "Calais",
    departementSlug: "pas-de-calais",
    population: 73500,
    nbPois: 10,
    latitude: 50.9513,
    longitude: 1.8587,
  },
  {
    slug: "beauvais",
    nom: "Beauvais",
    departementSlug: "oise",
    population: 56800,
    nbPois: 8,
    latitude: 49.4304,
    longitude: 2.0952,
  },
  {
    slug: "arras",
    nom: "Arras",
    departementSlug: "pas-de-calais",
    population: 42000,
    nbPois: 10,
    latitude: 50.292,
    longitude: 2.7816,
  },
  {
    slug: "laon",
    nom: "Laon",
    departementSlug: "aisne",
    population: 24800,
    nbPois: 6,
    latitude: 49.5639,
    longitude: 3.62,
  },

  // Normandie
  {
    slug: "le-havre",
    nom: "Le Havre",
    departementSlug: "seine-maritime",
    population: 172400,
    nbPois: 18,
    latitude: 49.4944,
    longitude: 0.1079,
  },
  {
    slug: "rouen",
    nom: "Rouen",
    departementSlug: "seine-maritime",
    population: 114400,
    nbPois: 20,
    latitude: 49.4432,
    longitude: 1.0999,
  },
  {
    slug: "caen",
    nom: "Caen",
    departementSlug: "calvados",
    population: 108600,
    nbPois: 18,
    latitude: 49.1829,
    longitude: -0.3707,
  },
  {
    slug: "evreux",
    nom: "Évreux",
    departementSlug: "eure",
    population: 51200,
    nbPois: 8,
    latitude: 49.0241,
    longitude: 1.1508,
  },
  {
    slug: "cherbourg",
    nom: "Cherbourg",
    departementSlug: "manche",
    population: 36900,
    nbPois: 8,
    latitude: 49.6337,
    longitude: -1.6222,
  },
  {
    slug: "alencon",
    nom: "Alençon",
    departementSlug: "orne",
    population: 26200,
    nbPois: 6,
    latitude: 48.431,
    longitude: 0.0913,
  },

  // Nouvelle-Aquitaine
  {
    slug: "bordeaux",
    nom: "Bordeaux",
    departementSlug: "gironde",
    population: 260000,
    nbPois: 35,
    latitude: 44.8378,
    longitude: -0.5792,
  },
  {
    slug: "limoges",
    nom: "Limoges",
    departementSlug: "haute-vienne",
    population: 133400,
    nbPois: 14,
    latitude: 45.8315,
    longitude: 1.2578,
  },
  {
    slug: "poitiers",
    nom: "Poitiers",
    departementSlug: "vienne",
    population: 90300,
    nbPois: 14,
    latitude: 46.5802,
    longitude: 0.3404,
  },
  {
    slug: "la-rochelle",
    nom: "La Rochelle",
    departementSlug: "charente-maritime",
    population: 79000,
    nbPois: 16,
    latitude: 46.1603,
    longitude: -1.1511,
  },
  {
    slug: "pau",
    nom: "Pau",
    departementSlug: "pyrenees-atlantiques",
    population: 77800,
    nbPois: 12,
    latitude: 43.2951,
    longitude: -0.3708,
  },
  {
    slug: "bayonne",
    nom: "Bayonne",
    departementSlug: "pyrenees-atlantiques",
    population: 52100,
    nbPois: 12,
    latitude: 43.4929,
    longitude: -1.4748,
  },
  {
    slug: "niort",
    nom: "Niort",
    departementSlug: "deux-sevres",
    population: 60200,
    nbPois: 8,
    latitude: 46.323,
    longitude: -0.4593,
  },
  {
    slug: "angouleme",
    nom: "Angoulême",
    departementSlug: "charente",
    population: 42700,
    nbPois: 8,
    latitude: 45.65,
    longitude: 0.16,
  },
  {
    slug: "mont-de-marsan",
    nom: "Mont-de-Marsan",
    departementSlug: "landes",
    population: 32400,
    nbPois: 6,
    latitude: 43.89,
    longitude: -0.4982,
  },
  {
    slug: "agen",
    nom: "Agen",
    departementSlug: "lot-et-garonne",
    population: 34500,
    nbPois: 7,
    latitude: 44.2033,
    longitude: 0.6166,
  },
  {
    slug: "gueret",
    nom: "Guéret",
    departementSlug: "creuse",
    population: 13100,
    nbPois: 5,
    latitude: 46.1717,
    longitude: 1.87,
  },
  {
    slug: "tulle",
    nom: "Tulle",
    departementSlug: "correze",
    population: 14800,
    nbPois: 5,
    latitude: 45.2669,
    longitude: 1.77,
  },

  // Occitanie
  {
    slug: "toulouse",
    nom: "Toulouse",
    departementSlug: "haute-garonne",
    population: 498000,
    nbPois: 40,
    latitude: 43.6047,
    longitude: 1.4442,
  },
  {
    slug: "montpellier",
    nom: "Montpellier",
    departementSlug: "herault",
    population: 295500,
    nbPois: 30,
    latitude: 43.6108,
    longitude: 3.8767,
  },
  {
    slug: "nimes",
    nom: "Nîmes",
    departementSlug: "gard",
    population: 151100,
    nbPois: 20,
    latitude: 43.8367,
    longitude: 4.3601,
  },
  {
    slug: "perpignan",
    nom: "Perpignan",
    departementSlug: "pyrenees-orientales",
    population: 121000,
    nbPois: 14,
    latitude: 42.6887,
    longitude: 2.8948,
  },
  {
    slug: "beziers",
    nom: "Béziers",
    departementSlug: "herault",
    population: 78600,
    nbPois: 10,
    latitude: 43.3441,
    longitude: 3.215,
  },
  {
    slug: "carcassonne",
    nom: "Carcassonne",
    departementSlug: "aude",
    population: 47700,
    nbPois: 14,
    latitude: 43.213,
    longitude: 2.3491,
  },
  {
    slug: "albi",
    nom: "Albi",
    departementSlug: "tarn",
    population: 51100,
    nbPois: 12,
    latitude: 43.9296,
    longitude: 2.1484,
  },
  {
    slug: "tarbes",
    nom: "Tarbes",
    departementSlug: "hautes-pyrenees",
    population: 42300,
    nbPois: 8,
    latitude: 43.2328,
    longitude: 0.0716,
  },
  {
    slug: "auch",
    nom: "Auch",
    departementSlug: "gers",
    population: 22900,
    nbPois: 6,
    latitude: 43.6467,
    longitude: 0.5857,
  },
  {
    slug: "rodez",
    nom: "Rodez",
    departementSlug: "aveyron",
    population: 24800,
    nbPois: 7,
    latitude: 44.3497,
    longitude: 2.5753,
  },
  {
    slug: "cahors",
    nom: "Cahors",
    departementSlug: "lot",
    population: 20000,
    nbPois: 7,
    latitude: 44.4475,
    longitude: 1.4402,
  },
  {
    slug: "mende",
    nom: "Mende",
    departementSlug: "lozere",
    population: 12100,
    nbPois: 5,
    latitude: 44.5181,
    longitude: 3.4986,
  },
  {
    slug: "foix",
    nom: "Foix",
    departementSlug: "ariege",
    population: 9800,
    nbPois: 5,
    latitude: 42.9638,
    longitude: 1.6052,
  },

  // Pays de la Loire
  {
    slug: "nantes",
    nom: "Nantes",
    departementSlug: "loire-atlantique",
    population: 320700,
    nbPois: 30,
    latitude: 47.2184,
    longitude: -1.5536,
  },
  {
    slug: "angers",
    nom: "Angers",
    departementSlug: "maine-et-loire",
    population: 157200,
    nbPois: 18,
    latitude: 47.4784,
    longitude: -0.5632,
  },
  {
    slug: "le-mans",
    nom: "Le Mans",
    departementSlug: "sarthe",
    population: 146600,
    nbPois: 16,
    latitude: 48.0061,
    longitude: 0.1996,
  },
  {
    slug: "laval",
    nom: "Laval",
    departementSlug: "mayenne",
    population: 53800,
    nbPois: 8,
    latitude: 48.0733,
    longitude: -0.769,
  },
  {
    slug: "la-roche-sur-yon",
    nom: "La Roche-sur-Yon",
    departementSlug: "vendee",
    population: 56100,
    nbPois: 8,
    latitude: 46.6708,
    longitude: -1.4268,
  },

  // Provence-Alpes-Côte d'Azur
  {
    slug: "marseille",
    nom: "Marseille",
    departementSlug: "bouches-du-rhone",
    population: 873100,
    nbPois: 45,
    latitude: 43.2965,
    longitude: 5.3698,
  },
  {
    slug: "nice",
    nom: "Nice",
    departementSlug: "alpes-maritimes",
    population: 342700,
    nbPois: 35,
    latitude: 43.7102,
    longitude: 7.262,
  },
  {
    slug: "toulon",
    nom: "Toulon",
    departementSlug: "var",
    population: 176200,
    nbPois: 18,
    latitude: 43.1242,
    longitude: 5.928,
  },
  {
    slug: "aix-en-provence",
    nom: "Aix-en-Provence",
    departementSlug: "bouches-du-rhone",
    population: 147100,
    nbPois: 22,
    latitude: 43.5297,
    longitude: 5.4474,
  },
  {
    slug: "avignon",
    nom: "Avignon",
    departementSlug: "vaucluse",
    population: 93800,
    nbPois: 18,
    latitude: 43.9493,
    longitude: 4.8055,
  },
  {
    slug: "cannes",
    nom: "Cannes",
    departementSlug: "alpes-maritimes",
    population: 75000,
    nbPois: 14,
    latitude: 43.5528,
    longitude: 7.0174,
  },
  {
    slug: "antibes",
    nom: "Antibes",
    departementSlug: "alpes-maritimes",
    population: 73200,
    nbPois: 12,
    latitude: 43.5808,
    longitude: 7.1239,
  },
  {
    slug: "gap",
    nom: "Gap",
    departementSlug: "hautes-alpes",
    population: 41200,
    nbPois: 8,
    latitude: 44.559,
    longitude: 6.079,
  },
  {
    slug: "digne-les-bains",
    nom: "Digne-les-Bains",
    departementSlug: "alpes-de-haute-provence",
    population: 17100,
    nbPois: 6,
    latitude: 44.0927,
    longitude: 6.2363,
  },

  // Additional cities to reach ~120
  // Île-de-France
  {
    slug: "boulogne-billancourt",
    nom: "Boulogne-Billancourt",
    departementSlug: "hauts-de-seine",
    population: 121100,
    nbPois: 12,
    latitude: 48.8352,
    longitude: 2.2409,
  },
  {
    slug: "vitry-sur-seine",
    nom: "Vitry-sur-Seine",
    departementSlug: "val-de-marne",
    population: 94600,
    nbPois: 8,
    latitude: 48.7875,
    longitude: 2.3929,
  },
  {
    slug: "colombes",
    nom: "Colombes",
    departementSlug: "hauts-de-seine",
    population: 89400,
    nbPois: 7,
    latitude: 48.9233,
    longitude: 2.2544,
  },
  {
    slug: "aubervilliers",
    nom: "Aubervilliers",
    departementSlug: "seine-saint-denis",
    population: 89400,
    nbPois: 7,
    latitude: 48.9134,
    longitude: 2.3826,
  },
  {
    slug: "asnieres-sur-seine",
    nom: "Asnières-sur-Seine",
    departementSlug: "hauts-de-seine",
    population: 88600,
    nbPois: 7,
    latitude: 48.9119,
    longitude: 2.2883,
  },
  {
    slug: "courbevoie",
    nom: "Courbevoie",
    departementSlug: "hauts-de-seine",
    population: 84500,
    nbPois: 7,
    latitude: 48.8966,
    longitude: 2.2566,
  },

  // Hauts-de-France
  {
    slug: "saint-quentin",
    nom: "Saint-Quentin",
    departementSlug: "aisne",
    population: 54400,
    nbPois: 8,
    latitude: 49.8465,
    longitude: 3.2876,
  },
  {
    slug: "compiegne",
    nom: "Compiègne",
    departementSlug: "oise",
    population: 41000,
    nbPois: 10,
    latitude: 49.4177,
    longitude: 2.8263,
  },

  // Occitanie
  {
    slug: "montauban",
    nom: "Montauban",
    departementSlug: "tarn-et-garonne",
    population: 61200,
    nbPois: 8,
    latitude: 44.0176,
    longitude: 1.3548,
  },
  {
    slug: "sete",
    nom: "Sète",
    departementSlug: "herault",
    population: 44800,
    nbPois: 10,
    latitude: 43.4035,
    longitude: 3.6966,
  },

  // Normandie
  {
    slug: "dieppe",
    nom: "Dieppe",
    departementSlug: "seine-maritime",
    population: 29200,
    nbPois: 8,
    latitude: 49.9249,
    longitude: 1.078,
  },

  // Grand Est
  {
    slug: "chalons-en-champagne",
    nom: "Châlons-en-Champagne",
    departementSlug: "marne",
    population: 44900,
    nbPois: 7,
    latitude: 48.9566,
    longitude: 4.363,
  },

  // Auvergne-Rhône-Alpes
  {
    slug: "annecy",
    nom: "Annecy",
    departementSlug: "haute-savoie",
    population: 131500,
    nbPois: 20,
    latitude: 45.8992,
    longitude: 6.1294,
  },
  {
    slug: "saint-priest",
    nom: "Saint-Priest",
    departementSlug: "rhone",
    population: 47000,
    nbPois: 6,
    latitude: 45.6966,
    longitude: 4.945,
  },
  {
    slug: "vienne",
    nom: "Vienne",
    departementSlug: "isere",
    population: 30400,
    nbPois: 10,
    latitude: 45.5254,
    longitude: 4.878,
  },

  // Nouvelle-Aquitaine
  {
    slug: "perigueux",
    nom: "Périgueux",
    departementSlug: "dordogne",
    population: 30000,
    nbPois: 8,
    latitude: 45.1847,
    longitude: 0.7213,
  },
  {
    slug: "bergerac",
    nom: "Bergerac",
    departementSlug: "dordogne",
    population: 26800,
    nbPois: 7,
    latitude: 44.853,
    longitude: 0.483,
  },
];

interface ArticleSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: {
    root: {
      type: "root";
      children: Array<{
        type: "paragraph";
        children: Array<{
          type: "text";
          text: string;
          format?: number;
          detail?: number;
          mode?: string;
          style?: string;
          version?: number;
        }>;
        direction: "ltr";
        format: "";
        indent: number;
        version: number;
      }>;
      direction: "ltr";
      format: "";
      indent: number;
      version: number;
    };
  };
  categorySlug: string;
  author: string;
  publishedAt: string;
  status: "published" | "draft";
  metaTitle: string;
  metaDescription: string;
  faq: Array<{ question: string; answer: string }>;
  tags: Array<{ tag: string }>;
}

function makeLexicalContent(paragraphs: string[]): ArticleSeed["content"] {
  return {
    root: {
      type: "root",
      children: paragraphs.map((text) => ({
        type: "paragraph" as const,
        children: [
          {
            type: "text" as const,
            text,
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
            version: 1,
          },
        ],
        direction: "ltr" as const,
        format: "" as const,
        indent: 0,
        version: 1,
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

const ARTICLES: ArticleSeed[] = [
  // ── Gamification ────────────────────────────────────────────────────────
  {
    title: "La gamification touristique en France : guide complet 2025",
    slug: "gamification-touristique-france-guide-complet-2025",
    excerpt:
      "Découvrez comment la gamification transforme le tourisme en France. Ce guide complet explore les mécaniques de jeu, les solutions disponibles et les résultats concrets obtenus par les territoires français en 2025.",
    content: makeLexicalContent([
      "La gamification touristique est devenue un levier incontournable pour les acteurs du tourisme en France. En intégrant des mécaniques de jeu — points, badges, défis, classements — dans l'expérience de visite, les territoires parviennent à capter l'attention d'un public de plus en plus connecté. En 2025, plus de 40 % des offices de tourisme français ont adopté au moins une solution de gamification pour dynamiser leur offre.",
      "Le principe est simple : transformer la découverte d'un territoire en une aventure ludique. Le visiteur ne se contente plus de contempler un monument ou un paysage. Il collecte des points d'intérêt, débloque des récompenses, relève des défis géolocalisés et partage ses exploits avec une communauté. Cette approche répond à une demande croissante d'expériences immersives et personnalisées, portée notamment par les 25-45 ans.",
      "Les résultats sont éloquents. Les territoires ayant déployé des solutions de gamification constatent en moyenne une augmentation de 25 % du temps passé sur site, une hausse de 30 % des visites hors saison et une meilleure répartition des flux touristiques. Les visiteurs gamifiés explorent davantage de lieux méconnus, contribuant ainsi à désengorger les sites les plus fréquentés.",
      "Plusieurs approches coexistent sur le marché français : les chasses au trésor numériques, les parcours géolocalisés avec réalité augmentée, les cartes à gratter digitales et les applications de collection de points d'intérêt comme Vagabond. Chaque solution répond à des besoins spécifiques selon la taille du territoire, le budget disponible et le profil des visiteurs ciblés.",
      "Pour réussir un projet de gamification touristique, trois piliers sont essentiels : un contenu éditorial de qualité qui valorise le patrimoine local, une mécanique de jeu intuitive qui motive sans frustrer, et une stratégie de distribution qui atteint les visiteurs au bon moment de leur parcours de décision. Les territoires les plus avancés combinent ces trois dimensions pour créer des expériences mémorables.",
    ]),
    categorySlug: "gamification",
    author: "Équipe Vagabond",
    publishedAt: "2025-03-15T10:00:00.000Z",
    status: "published",
    metaTitle: "Gamification touristique en France : guide complet 2025",
    metaDescription:
      "Guide complet sur la gamification touristique en France. Mécaniques de jeu, solutions, résultats concrets et bonnes pratiques pour les territoires.",
    faq: [
      {
        question: "Qu'est-ce que la gamification touristique ?",
        answer:
          "La gamification touristique consiste à intégrer des mécaniques de jeu (points, badges, défis, classements) dans l'expérience de visite d'un territoire pour la rendre plus engageante et mémorable.",
      },
      {
        question:
          "Quels sont les bénéfices de la gamification pour un territoire ?",
        answer:
          "Les territoires gamifiés constatent en moyenne +25 % de temps passé sur site, +30 % de visites hors saison et une meilleure répartition des flux touristiques vers les sites moins connus.",
      },
      {
        question: "Comment choisir une solution de gamification touristique ?",
        answer:
          "Le choix dépend de la taille du territoire, du budget, du profil des visiteurs et des objectifs. Les critères clés sont la qualité du contenu, l'intuitivité de la mécanique de jeu et la capacité de distribution.",
      },
    ],
    tags: [
      { tag: "gamification" },
      { tag: "tourisme" },
      { tag: "innovation" },
      { tag: "guide" },
    ],
  },
  {
    title:
      "Comment les offices de tourisme utilisent la gamification pour engager leurs visiteurs",
    slug: "offices-tourisme-gamification-engagement-visiteurs",
    excerpt:
      "Les offices de tourisme français adoptent massivement la gamification pour fidéliser les visiteurs. Stratégies concrètes, retours d'expérience et indicateurs clés de performance pour réussir votre projet de gamification territoriale.",
    content: makeLexicalContent([
      "Face à la transformation numérique du secteur touristique, les offices de tourisme français se réinventent. La gamification s'impose comme une réponse stratégique à un double défi : attirer de nouveaux visiteurs et prolonger leur engagement sur le territoire. En 2025, les structures les plus innovantes ont intégré des mécaniques de jeu dans l'ensemble de leur parcours visiteur, de la phase d'inspiration à la recommandation post-séjour.",
      "Le cas de l'office de tourisme de Bordeaux illustre parfaitement cette tendance. En déployant un parcours gamifié dans le centre historique, la structure a constaté une augmentation de 40 % des téléchargements de son application et un taux de complétion des parcours de 68 %. Les visiteurs passent en moyenne 2h30 de plus dans le centre-ville et visitent trois lieux supplémentaires par rapport aux parcours classiques.",
      "Pour les offices de tourisme, la gamification offre également un outil précieux de collecte de données. Chaque interaction — scan d'un QR code, validation d'un point d'intérêt, partage sur les réseaux sociaux — génère des informations exploitables sur les comportements de visite. Ces données permettent d'affiner les recommandations, d'identifier les sites sous-valorisés et de piloter la stratégie touristique avec des indicateurs concrets.",
      "Les facteurs de succès identifiés par les offices pionniers sont la simplicité d'accès (pas d'inscription obligatoire pour commencer), la richesse du contenu éditorial et la valorisation du patrimoine local plutôt que la seule mécanique de jeu. Les solutions qui fonctionnent le mieux sont celles qui enrichissent véritablement la connaissance du territoire tout en offrant une expérience ludique gratifiante.",
    ]),
    categorySlug: "gamification",
    author: "Équipe Vagabond",
    publishedAt: "2025-05-22T09:00:00.000Z",
    status: "published",
    metaTitle:
      "Offices de tourisme et gamification : stratégies d'engagement visiteurs",
    metaDescription:
      "Comment les offices de tourisme utilisent la gamification pour engager les visiteurs. Stratégies, retours d'expérience et KPI concrets.",
    faq: [
      {
        question:
          "Pourquoi les offices de tourisme adoptent-ils la gamification ?",
        answer:
          "La gamification permet d'attirer de nouveaux visiteurs, de prolonger leur temps de séjour, de répartir les flux et de collecter des données précieuses sur les comportements de visite.",
      },
      {
        question:
          "Quel budget prévoir pour un projet de gamification en office de tourisme ?",
        answer:
          "Les budgets varient de 5 000 € pour une solution clé en main à plus de 50 000 € pour un dispositif sur mesure avec réalité augmentée. Les solutions SaaS comme Vagabond offrent des formules accessibles dès quelques centaines d'euros par mois.",
      },
      {
        question:
          "Comment mesurer le succès d'un dispositif de gamification touristique ?",
        answer:
          "Les KPI principaux sont le nombre de participants, le taux de complétion des parcours, le temps moyen passé sur le territoire, le nombre de sites visités par session et le taux de recommandation.",
      },
    ],
    tags: [
      { tag: "office de tourisme" },
      { tag: "gamification" },
      { tag: "engagement" },
      { tag: "stratégie" },
    ],
  },
  {
    title:
      "Terra Aventura, Baludik, Vagabond : comparatif des solutions de gamification territoriale",
    slug: "terra-aventura-baludik-vagabond-comparatif-gamification-territoriale",
    excerpt:
      "Comparatif détaillé des principales solutions de gamification touristique en France. Terra Aventura, Baludik et Vagabond : fonctionnalités, tarifs, couverture géographique et retours d'expérience pour faire le bon choix.",
    content: makeLexicalContent([
      "Le marché français de la gamification touristique s'est structuré autour de plusieurs acteurs complémentaires. Terra Aventura, Baludik et Vagabond proposent chacun une approche distincte pour transformer la découverte des territoires en expérience ludique. Ce comparatif objectif analyse leurs forces, leurs limites et leurs cas d'usage idéaux pour aider les territoires et les voyageurs à faire un choix éclairé.",
      "Terra Aventura, lancé en Nouvelle-Aquitaine, est le pionnier des chasses au trésor numériques en France. Avec plus de 400 parcours et 1 million de participants, la plateforme a démontré la viabilité du modèle. Son point fort réside dans la qualité narrative de ses parcours, co-construits avec les collectivités. En revanche, sa couverture géographique reste concentrée sur le sud-ouest et le modèle de chasse au trésor linéaire peut limiter la liberté d'exploration.",
      "Baludik se positionne comme un outil de création de parcours gamifiés accessible aux collectivités. Sa force réside dans son éditeur de contenu qui permet aux offices de tourisme de créer leurs propres expériences sans compétence technique. L'application propose également des parcours en réalité augmentée. La contrepartie est que la qualité de l'expérience dépend fortement de l'investissement éditorial de chaque territoire.",
      "Vagabond adopte une approche différente centrée sur la collection et l'exploration libre. Plutôt que de suivre un parcours prédéfini, le voyageur découvre les points d'intérêt à son rythme et les collectionne dans un carnet digital. La mécanique de carte à gratter numérique crée un effet de découverte addictif, tandis que la couverture nationale de plus de 140 000 POI garantit une expérience riche partout en France. L'application est gratuite pour les voyageurs et propose un modèle B2B pour les territoires.",
      "En résumé, Terra Aventura excelle pour les parcours narratifs scénarisés, Baludik offre la meilleure autonomie de création pour les collectivités, et Vagabond propose l'expérience d'exploration libre la plus complète à l'échelle nationale. Le choix dépend avant tout des objectifs du territoire et du profil des visiteurs ciblés.",
    ]),
    categorySlug: "gamification",
    author: "Équipe Vagabond",
    publishedAt: "2025-07-10T08:30:00.000Z",
    status: "published",
    metaTitle:
      "Terra Aventura vs Baludik vs Vagabond : comparatif gamification 2025",
    metaDescription:
      "Comparatif Terra Aventura, Baludik et Vagabond. Fonctionnalités, couverture et tarifs pour choisir votre solution de gamification.",
    faq: [
      {
        question:
          "Quelle est la différence entre Terra Aventura, Baludik et Vagabond ?",
        answer:
          "Terra Aventura propose des chasses au trésor narratives en Nouvelle-Aquitaine. Baludik est un outil de création de parcours gamifiés pour les collectivités. Vagabond est une application d'exploration libre avec collection de POI à l'échelle nationale.",
      },
      {
        question:
          "Quelle solution de gamification choisir pour mon territoire ?",
        answer:
          "Terra Aventura convient aux parcours scénarisés, Baludik aux collectivités souhaitant créer en autonomie, et Vagabond aux territoires voulant une couverture nationale avec exploration libre. Le choix dépend de vos objectifs et de votre budget.",
      },
      {
        question:
          "Ces applications de gamification touristique sont-elles gratuites ?",
        answer:
          "Vagabond est gratuit pour les voyageurs. Terra Aventura est également gratuit à l'utilisation. Baludik est un outil payant destiné aux collectivités. Les modèles économiques varient : certains se financent par les collectivités, d'autres par des partenariats.",
      },
    ],
    tags: [
      { tag: "comparatif" },
      { tag: "gamification" },
      { tag: "terra aventura" },
      { tag: "baludik" },
    ],
  },

  // ── Destinations ────────────────────────────────────────────────────────
  {
    title: "Carte à gratter voyage : pourquoi passer au digital avec Vagabond",
    slug: "carte-a-gratter-voyage-digital-vagabond",
    excerpt:
      "La carte à gratter voyage se réinvente en version digitale. Découvrez pourquoi Vagabond transforme ce concept culte en une expérience mobile interactive avec géolocalisation, statistiques et partage social.",
    content: makeLexicalContent([
      "La carte à gratter voyage est un classique que l'on retrouve dans des milliers de foyers français. Affichée au mur du salon, elle permet de visualiser d'un coup d'œil les pays ou régions visités en grattant la couche dorée. Mais ce concept iconique présente des limites : elle est statique, imprécise et impossible à partager facilement. En 2025, le passage au digital s'impose naturellement.",
      "Vagabond reprend l'essence de la carte à gratter en la propulsant sur mobile. Chaque point d'intérêt visité se révèle sur une carte interactive, créant le même effet de satisfaction que le grattage physique. Mais la version digitale va beaucoup plus loin : géolocalisation automatique, granularité au niveau du POI plutôt que du pays, statistiques détaillées de vos explorations et possibilité de partager vos découvertes avec vos proches.",
      "L'un des avantages majeurs du format digital est la richesse des données associées. Chaque lieu visité s'accompagne d'informations contextuelles : histoire, horaires, photos, avis de la communauté. La carte à gratter traditionnelle vous dit « j'ai visité la France », Vagabond vous dit « j'ai découvert 47 points d'intérêt en Bretagne dont la Pointe du Raz, les Alignements de Carnac et la Côte de Granit Rose ».",
      "Le format mobile apporte également une dimension sociale absente de la carte physique. Comparez vos explorations avec vos amis, découvrez les lieux les plus populaires de la communauté et recevez des suggestions personnalisées basées sur vos centres d'intérêt. La carte à gratter voyage devient un compagnon vivant qui évolue avec vous, voyage après voyage.",
    ]),
    categorySlug: "destinations",
    author: "Équipe Vagabond",
    publishedAt: "2025-04-08T11:00:00.000Z",
    status: "published",
    metaTitle:
      "Carte à gratter voyage digitale : passez au mobile avec Vagabond",
    metaDescription:
      "La carte à gratter voyage passe au digital avec Vagabond. Transformez vos explorations en collection interactive avec stats et partage.",
    faq: [
      {
        question: "Qu'est-ce qu'une carte à gratter voyage digitale ?",
        answer:
          "C'est une version mobile et interactive de la carte à gratter traditionnelle. Au lieu de gratter une couche dorée, vous collectez les lieux visités via géolocalisation sur votre smartphone, avec des statistiques et du partage social.",
      },
      {
        question: "Vagabond remplace-t-il la carte à gratter murale ?",
        answer:
          "Vagabond complète et enrichit le concept. L'application offre une granularité bien supérieure (POI par POI au lieu de pays par pays), des données contextuelles et une dimension sociale que la carte physique ne propose pas.",
      },
      {
        question: "L'application Vagabond est-elle gratuite ?",
        answer:
          "Oui, Vagabond est gratuit pour les voyageurs. L'application permet de collecter des points d'intérêt, suivre ses statistiques d'exploration et partager ses découvertes sans aucun frais.",
      },
    ],
    tags: [
      { tag: "carte à gratter" },
      { tag: "voyage" },
      { tag: "digital" },
      { tag: "application" },
    ],
  },
  {
    title: "7 applications pour explorer la France en 2025",
    slug: "7-applications-explorer-france-2025",
    excerpt:
      "Sélection des 7 meilleures applications mobiles pour découvrir la France en 2025. De la randonnée à la gamification touristique, trouvez l'outil idéal pour enrichir vos voyages et week-ends sur le territoire.",
    content: makeLexicalContent([
      "Explorer la France n'a jamais été aussi accessible grâce aux applications mobiles dédiées au voyage et à la découverte. En 2025, le smartphone est devenu le compagnon indispensable du voyageur, remplaçant guides papier, cartes routières et offices de tourisme physiques. Voici notre sélection des 7 applications incontournables pour transformer chaque sortie en aventure.",
      "Vagabond se distingue par son approche unique de collection de points d'intérêt. L'application recense plus de 140 000 lieux remarquables sur tout le territoire français et les transforme en objets à collecter. La mécanique de carte à gratter digitale crée une motivation puissante pour sortir des sentiers battus. Visorando reste la référence pour la randonnée avec 350 000 itinéraires balisés et des cartes IGN hors ligne. AllTrails complète l'offre avec une communauté internationale et des avis détaillés sur chaque sentier.",
      "Côté culture et patrimoine, Mapstr permet de créer des listes personnalisées de lieux à visiter tandis que Détour propose des audioguides géolocalisés gratuits pour plus de 300 villes françaises. Pour les amateurs de road trips, Furkot planifie automatiquement les étapes, les hébergements et les ravitaillements sur des itinéraires de plusieurs jours.",
      "Enfin, Komoot se spécialise dans les activités outdoor en combinant vélo, randonnée et VTT avec une planification d'itinéraire intelligente qui tient compte du dénivelé et de la difficulté. Chacune de ces applications répond à un besoin spécifique, et les combiner permet de couvrir tous les aspects d'un voyage en France, de la planification à la découverte spontanée.",
    ]),
    categorySlug: "destinations",
    author: "Équipe Vagabond",
    publishedAt: "2025-06-18T10:30:00.000Z",
    status: "published",
    metaTitle: "7 meilleures applications pour explorer la France en 2025",
    metaDescription:
      "Top 7 des applications pour découvrir la France en 2025. Randonnée, gamification, culture et road trip : le guide pour choisir.",
    faq: [
      {
        question:
          "Quelle est la meilleure application pour découvrir la France ?",
        answer:
          "Cela dépend de vos centres d'intérêt. Vagabond excelle pour la collection de lieux et l'exploration ludique. Visorando est idéal pour la randonnée. Détour convient parfaitement pour la découverte culturelle en ville.",
      },
      {
        question:
          "Existe-t-il des applications gratuites pour visiter la France ?",
        answer:
          "Oui, Vagabond, Détour et AllTrails proposent des versions gratuites très complètes. Visorando et Komoot offrent également des fonctionnalités de base gratuites avec des options premium.",
      },
      {
        question: "Peut-on utiliser ces applications sans connexion internet ?",
        answer:
          "La plupart proposent un mode hors ligne. Visorando et Komoot permettent de télécharger les cartes à l'avance. Vagabond synchronise les données en cache pour une utilisation en zone blanche.",
      },
    ],
    tags: [
      { tag: "applications" },
      { tag: "voyage" },
      { tag: "France" },
      { tag: "top" },
    ],
  },
  {
    title: "Les 10 régions françaises les moins connues à découvrir",
    slug: "10-regions-francaises-moins-connues-decouvrir",
    excerpt:
      "Explorez les territoires méconnus de France qui regorgent de trésors cachés. Des Hauts-de-France au Centre-Val de Loire, découvrez 10 régions sous-estimées qui méritent votre prochaine visite.",
    content: makeLexicalContent([
      "La France regorge de destinations emblématiques — Paris, la Côte d'Azur, les châteaux de la Loire — mais certains territoires restent injustement méconnus du grand public. Ces régions sous-estimées offrent pourtant des paysages spectaculaires, un patrimoine riche et une authenticité que les sites surfréquentés ont parfois perdue. Voici notre sélection de 10 territoires à mettre en tête de votre liste d'exploration.",
      "La Creuse, département le moins peuplé de France métropolitaine, recèle des paysages de bocage préservés et des villages de caractère comme Aubusson, capitale mondiale de la tapisserie. L'Ariège, au pied des Pyrénées, surprend par ses grottes préhistoriques (Niaux, Mas-d'Azil), ses châteaux cathares et ses stations thermales authentiques. Le Gers, terre de d'Artagnan, séduit les épicuriens avec sa gastronomie classée au patrimoine immatériel.",
      "Dans le nord, l'Aisne dévoile des cathédrales gothiques remarquables (Laon, Soissons) et les vestiges émouvants du Chemin des Dames. La Lozère, département le moins peuplé, offre les gorges du Tarn, les causses et les Cévennes classés à l'UNESCO. Le Territoire de Belfort, plus petit département de métropole, concentre un patrimoine industriel fascinant autour du Lion de Bartholdi et de la citadelle Vauban.",
      "La Haute-Marne dissimule des sites remarquables comme le mémorial Charles de Gaulle à Colombey et les forges de Bologne. Les Deux-Sèvres révèlent le Marais poitevin, la « Venise verte » traversable en barque plate. Le Cantal offre des volcans endormis, des burons en pierre et les plus grandes estives d'Europe. Enfin, la Nièvre abrite le Morvan, massif granitique couvert de forêts où se pratiquent le flottage du bois et les randonnées sauvages.",
      "Explorer ces territoires méconnus avec une application comme Vagabond permet de structurer sa découverte et de ne manquer aucun trésor caché. Chaque point d'intérêt collecté enrichit votre carte d'exploration et vous motive à aller toujours plus loin hors des sentiers battus.",
    ]),
    categorySlug: "destinations",
    author: "Équipe Vagabond",
    publishedAt: "2025-09-05T09:30:00.000Z",
    status: "published",
    metaTitle: "10 régions françaises méconnues à découvrir absolument",
    metaDescription:
      "Découvrez 10 régions françaises sous-estimées qui regorgent de trésors cachés. Creuse, Ariège, Gers, Lozère... Le guide des destinations méconnues.",
    faq: [
      {
        question: "Quelles sont les régions les moins visitées de France ?",
        answer:
          "Les départements les moins visités sont la Creuse, la Lozère, le Territoire de Belfort, la Haute-Marne et l'Aisne. Ces territoires offrent pourtant un patrimoine remarquable et des paysages préservés.",
      },
      {
        question: "Pourquoi visiter les régions méconnues de France ?",
        answer:
          "Les régions méconnues offrent une authenticité préservée, des prix plus abordables, moins de foule et des rencontres plus riches avec les habitants. C'est aussi une façon de soutenir des territoires qui ont besoin du tourisme.",
      },
      {
        question: "Comment organiser un voyage dans une région méconnue ?",
        answer:
          "Utilisez une application comme Vagabond pour repérer les points d'intérêt locaux. Contactez les offices de tourisme locaux qui proposent souvent des parcours thématiques. Privilégiez les hébergements chez l'habitant pour une immersion authentique.",
      },
    ],
    tags: [
      { tag: "régions" },
      { tag: "France méconnue" },
      { tag: "découverte" },
      { tag: "hors des sentiers battus" },
    ],
  },

  // ── Voyageurs ───────────────────────────────────────────────────────────
  {
    title: "Comment bien préparer un road trip en France avec Vagabond",
    slug: "preparer-road-trip-france-vagabond",
    excerpt:
      "Guide pratique pour organiser un road trip mémorable en France avec l'application Vagabond. Itinéraires, points d'intérêt, budget, équipement et astuces pour une aventure réussie sur les routes françaises.",
    content: makeLexicalContent([
      "Le road trip en France connaît un engouement sans précédent. Avec 13 régions aux paysages variés, un réseau routier dense et un patrimoine exceptionnel, l'Hexagone se prête idéalement à l'aventure sur quatre roues. Mais un road trip réussi se prépare. Voici notre guide complet pour organiser votre prochaine escapade avec Vagabond comme copilote digital.",
      "La première étape consiste à définir votre itinéraire en fonction de vos centres d'intérêt et de la durée disponible. Pour un week-end prolongé, concentrez-vous sur une ou deux régions limitrophes. Pour une semaine, vous pouvez traverser trois à quatre régions en variant les plaisirs. Vagabond vous aide à identifier les points d'intérêt sur votre route et à ne pas manquer les trésors cachés entre deux étapes principales.",
      "Le budget est un facteur déterminant. Comptez en moyenne 80 à 120 euros par jour pour un couple en incluant le carburant, l'hébergement et les repas. Les aires de camping-car gratuites, les chambres d'hôtes et les marchés locaux permettent de réduire significativement les coûts. Vagabond signale les points d'intérêt gratuits et les sites naturels qui ne nécessitent aucun budget d'entrée.",
      "Côté équipement, privilégiez le minimalisme : une bonne carte routière en complément du GPS, un chargeur de voiture pour vos appareils, une glacière pour les pique-niques et des vêtements adaptés à la météo changeante. Téléchargez les zones hors ligne de Vagabond avant de partir pour naviguer même dans les zones blanches rurales.",
      "Enfin, la magie d'un road trip réside dans l'imprévu. Laissez-vous guider par la curiosité, arrêtez-vous dans les villages qui vous attirent et discutez avec les locaux. Vagabond rend ces détours gratifiants en transformant chaque découverte spontanée en un point d'intérêt à collecter, ajoutant une dimension ludique à chaque kilomètre parcouru.",
    ]),
    categorySlug: "voyageurs",
    author: "Équipe Vagabond",
    publishedAt: "2025-04-25T10:00:00.000Z",
    status: "published",
    metaTitle: "Préparer un road trip en France : guide complet avec Vagabond",
    metaDescription:
      "Guide complet pour organiser un road trip en France. Itinéraires, budget, équipement et astuces avec l'application Vagabond comme copilote digital.",
    faq: [
      {
        question: "Quel budget prévoir pour un road trip en France ?",
        answer:
          "Comptez 80 à 120 euros par jour pour un couple (carburant, hébergement, repas). Ce budget peut être réduit en utilisant des aires gratuites, des chambres d'hôtes et des marchés locaux.",
      },
      {
        question:
          "Quelle est la meilleure période pour un road trip en France ?",
        answer:
          "Mai-juin et septembre-octobre offrent le meilleur compromis entre météo agréable et fréquentation modérée. Juillet-août convient pour le nord et la montagne mais les côtes sont très fréquentées.",
      },
      {
        question: "Comment Vagabond aide-t-il à préparer un road trip ?",
        answer:
          "Vagabond recense plus de 140 000 points d'intérêt en France. L'application permet d'identifier les lieux à visiter sur votre route, de collecter vos découvertes et de suivre votre progression d'exploration.",
      },
    ],
    tags: [
      { tag: "road trip" },
      { tag: "France" },
      { tag: "guide pratique" },
      { tag: "voyage" },
    ],
  },
  {
    title: "5 idées de week-ends insolites en Hauts-de-France",
    slug: "5-idees-weekends-insolites-hauts-de-france",
    excerpt:
      "Sortez des sentiers battus avec ces 5 week-ends insolites en Hauts-de-France. De la Baie de Somme aux terrils du bassin minier, découvrez une région riche en surprises insoupçonnées.",
    content: makeLexicalContent([
      "Les Hauts-de-France souffrent d'une image injustement réductrice. Loin des clichés sur la grisaille et l'industrie, cette région offre une diversité de paysages et d'expériences qui en font une destination de week-end idéale. Située à moins de deux heures de Paris, elle permet des escapades courtes mais riches en découvertes. Voici 5 idées de week-ends insolites pour redécouvrir cette région méconnue.",
      "Premier week-end : la Baie de Somme et ses phoques. La plus grande baie du nord de la France abrite une colonie permanente de phoques veaux-marins et gris, observable depuis la pointe du Hourdel. Complétez par une traversée guidée de la baie à marée basse, une visite du parc ornithologique du Marquenterre et un dîner de fruits de mer au Crotoy. Vagabond recense 45 points d'intérêt sur ce seul territoire.",
      "Deuxième week-end : les terrils du bassin minier UNESCO. Classés au patrimoine mondial, les terrils jumeaux de Loos-en-Gohelle culminent à 186 mètres et offrent un panorama saisissant. Le centre minier de Lewarde, plus grand musée de la mine en France, complète cette plongée dans l'histoire industrielle. Troisième week-end : le cap Blanc-Nez et la Côte d'Opale, où les falaises de craie rivalisent avec celles de Douvres et les plages immenses invitent au char à voile.",
      "Quatrième week-end : Lille et sa métropole culturelle. Au-delà du Vieux-Lille et de ses estaminets, explorez le LaM (musée d'art moderne) à Villeneuve-d'Ascq, la Piscine-musée de Roubaix et la Villa Cavrois, chef-d'œuvre Art déco restauré. Cinquième week-end : la forêt de Compiègne et le château de Pierrefonds. Cette forêt domaniale de 14 000 hectares abrite l'un des plus beaux châteaux néo-gothiques de France, restauré par Viollet-le-Duc, décor de nombreux films et séries.",
    ]),
    categorySlug: "voyageurs",
    author: "Équipe Vagabond",
    publishedAt: "2026-01-12T09:00:00.000Z",
    status: "published",
    metaTitle:
      "5 week-ends insolites en Hauts-de-France : idées et itinéraires",
    metaDescription:
      "5 idées de week-ends insolites en Hauts-de-France. Baie de Somme, terrils UNESCO, Côte d'Opale, Lille culturel et forêt de Compiègne.",
    faq: [
      {
        question: "Que faire en Hauts-de-France le temps d'un week-end ?",
        answer:
          "La région offre une grande diversité : observation de phoques en Baie de Somme, patrimoine minier UNESCO, falaises de la Côte d'Opale, culture à Lille ou nature en forêt de Compiègne. Chaque expérience se concentre sur un périmètre accessible en week-end.",
      },
      {
        question: "Les Hauts-de-France valent-ils le détour ?",
        answer:
          "Absolument. La région possède 4 sites UNESCO, la plus grande baie du nord de la France, des musées de rang international et une gastronomie riche. Sa proximité avec Paris (1h-2h en TGV) en fait une destination week-end idéale.",
      },
      {
        question: "Comment se déplacer en Hauts-de-France ?",
        answer:
          "La voiture reste le moyen le plus pratique pour explorer la région. Le TGV dessert Lille (1h depuis Paris), Amiens (1h20) et Calais (1h30). Des réseaux de bus locaux complètent l'offre pour les sites touristiques majeurs.",
      },
    ],
    tags: [
      { tag: "week-end" },
      { tag: "Hauts-de-France" },
      { tag: "insolite" },
      { tag: "idées voyage" },
    ],
  },
];

const CATEGORIES = [
  {
    name: "Destinations",
    slug: "destinations",
    color: "#3B82F6",
    description: "Guides de régions et villes",
  },
  {
    name: "Gamification",
    slug: "gamification",
    color: "#9B4DCA",
    description: "Articles sur la gamification touristique",
  },
  {
    name: "Voyageurs",
    slug: "voyageurs",
    color: "#FF5C5C",
    description: "Tips, stories, témoignages",
  },
  {
    name: "Vagabond",
    slug: "vagabond",
    color: "#F59E0B",
    description: "Actualités produit et nouvelles fonctionnalités",
  },
];

async function seed(): Promise<void> {
  const payload = await getPayload({ config });

  // ── Seed regions ──────────────────────────────────────────────────────
  console.log("Seeding regions...");
  const regionMap = new Map<string, string | number>();
  for (const region of REGIONS) {
    const existing = await payload.find({
      collection: "regions",
      where: { slug: { equals: region.slug } },
      limit: 1,
    });
    const existingDoc = existing.docs[0];
    if (existingDoc !== undefined) {
      regionMap.set(region.slug, existingDoc.id);
      console.log(`  ✓ ${region.nom} (exists)`);
      continue;
    }
    const created = await payload.create({
      collection: "regions",
      data: region,
    });
    regionMap.set(region.slug, created.id);
    console.log(`  + ${region.nom}`);
  }
  console.log(`${String(regionMap.size)} regions done.\n`);

  // ── Update regions with nbPois and topPois ────────────────────────────
  console.log("Updating regions with nbPois and topPois...");
  for (const [slug, nbPois] of Object.entries(REGION_NB_POIS)) {
    const regionId = regionMap.get(slug);
    if (regionId === undefined) {
      console.log(`  ✗ Region ${slug} not found in map`);
      continue;
    }
    const topPois = REGION_TOP_POIS[slug] ?? [];
    await payload.update({
      collection: "regions",
      id: regionId,
      data: { nbPois, topPois },
    });
    console.log(
      `  ✓ ${slug} — ${String(nbPois)} POIs, ${String(topPois.length)} top POIs`,
    );
  }
  console.log("Region updates done.\n");

  // ── Seed departements ─────────────────────────────────────────────────
  console.log("Seeding departements...");
  const deptMap = new Map<string, string | number>();
  let deptCount = 0;
  for (const dept of DEPARTEMENTS) {
    const existing = await payload.find({
      collection: "departements",
      where: { slug: { equals: dept.slug } },
      limit: 1,
    });
    const existingDoc = existing.docs[0];
    if (existingDoc !== undefined) {
      deptMap.set(dept.slug, existingDoc.id);
      console.log(`  ✓ ${dept.nom} (exists)`);
      deptCount++;
      continue;
    }
    const regionId = regionMap.get(dept.regionSlug);
    if (regionId === undefined) {
      console.log(`  ✗ ${dept.nom} — region ${dept.regionSlug} not found`);
      continue;
    }
    const created = await payload.create({
      collection: "departements",
      data: {
        slug: dept.slug,
        nom: dept.nom,
        numero: dept.numero,
        region: regionId as number,
      },
    });
    deptMap.set(dept.slug, created.id);
    console.log(`  + ${dept.nom}`);
    deptCount++;
  }
  console.log(`${String(deptCount)} departements done.\n`);

  // ── Update departements with nbPois ───────────────────────────────────
  console.log("Updating departements with nbPois...");
  for (const [slug, nbPois] of Object.entries(DEPARTEMENT_NB_POIS)) {
    const deptId = deptMap.get(slug);
    if (deptId === undefined) {
      console.log(`  ✗ Departement ${slug} not found in map`);
      continue;
    }
    await payload.update({
      collection: "departements",
      id: deptId,
      data: { nbPois },
    });
    console.log(`  ✓ ${slug} — ${String(nbPois)} POIs`);
  }
  console.log("Departement updates done.\n");

  // ── Seed villes ───────────────────────────────────────────────────────
  console.log("Seeding villes...");
  let villeCount = 0;
  for (const ville of VILLES) {
    const existing = await payload.find({
      collection: "villes",
      where: { slug: { equals: ville.slug } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      console.log(`  ✓ ${ville.nom} (exists)`);
      villeCount++;
      continue;
    }
    const deptId = deptMap.get(ville.departementSlug);
    if (deptId === undefined) {
      console.log(
        `  ✗ ${ville.nom} — departement ${ville.departementSlug} not found`,
      );
      continue;
    }
    await payload.create({
      collection: "villes",
      data: {
        slug: ville.slug,
        nom: ville.nom,
        departement: deptId as number,
        population: ville.population,
        nbPois: ville.nbPois,
        latitude: ville.latitude,
        longitude: ville.longitude,
      },
    });
    console.log(`  + ${ville.nom}`);
    villeCount++;
  }
  console.log(`${String(villeCount)} villes done.\n`);

  // ── Seed categories ───────────────────────────────────────────────────
  console.log("Seeding categories...");
  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: "categories",
      where: { slug: { equals: cat.slug } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      console.log(`  ✓ ${cat.name} (exists)`);
      continue;
    }
    await payload.create({
      collection: "categories",
      data: cat,
    });
    console.log(`  + ${cat.name}`);
  }
  console.log("Categories done.\n");

  // ── Seed articles ─────────────────────────────────────────────────────
  console.log("Seeding articles...");
  const categoryMap = new Map<string, string | number>();
  for (const cat of CATEGORIES) {
    const found = await payload.find({
      collection: "categories",
      where: { slug: { equals: cat.slug } },
      limit: 1,
    });
    const foundDoc = found.docs[0];
    if (foundDoc !== undefined) {
      categoryMap.set(cat.slug, foundDoc.id);
    }
  }

  let articleCount = 0;
  for (const article of ARTICLES) {
    const existing = await payload.find({
      collection: "articles",
      where: { slug: { equals: article.slug } },
      limit: 1,
    });
    const existingDoc = existing.docs[0];
    if (existingDoc !== undefined) {
      console.log(`  ✓ ${article.title} (exists)`);
      articleCount++;
      continue;
    }
    const categoryId = categoryMap.get(article.categorySlug);
    if (categoryId === undefined) {
      console.log(
        `  ✗ ${article.title} — category ${article.categorySlug} not found`,
      );
      continue;
    }
    await payload.create({
      collection: "articles",
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: categoryId as number,
        author: article.author,
        publishedAt: article.publishedAt,
        status: article.status,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        faq: article.faq,
        tags: article.tags,
      },
    });
    console.log(`  + ${article.title}`);
    articleCount++;
  }
  console.log(`${String(articleCount)} articles done.\n`);

  console.log("Seed complete!");
  process.exit(0);
}

void seed();
