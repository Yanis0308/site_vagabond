export interface NearbyPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

export const NEARBY_PLACES: NearbyPlace[] = [
  {
    id: "tour-eiffel",
    name: "Tour Eiffel",
    latitude: 48.8584,
    longitude: 2.2945,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/960px-Tour_Eiffel_Wikimedia_Commons.jpg",
  },
  {
    id: "mont-saint-michel",
    name: "Mont-Saint-Michel",
    latitude: 48.636,
    longitude: -1.5115,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mont-Saint-Michel_vu_du_ciel.jpg/960px-Mont-Saint-Michel_vu_du_ciel.jpg",
  },
  {
    id: "pont-du-gard",
    name: "Pont du Gard",
    latitude: 43.9475,
    longitude: 4.5353,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Pont_du_Gard_BLS.jpg/960px-Pont_du_Gard_BLS.jpg",
  },
  {
    id: "chateau-chambord",
    name: "Château de Chambord",
    latitude: 47.6161,
    longitude: 1.5173,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Ch%C3%A2teau_de_Chambord.jpg/960px-Ch%C3%A2teau_de_Chambord.jpg",
  },
  {
    id: "gorges-du-verdon",
    name: "Gorges du Verdon",
    latitude: 43.7376,
    longitude: 6.3636,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Gorges_du_Verdon.jpg/960px-Gorges_du_Verdon.jpg",
  },
  {
    id: "dune-du-pilat",
    name: "Dune du Pilat",
    latitude: 44.5892,
    longitude: -1.2134,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Dune_du_Pilat.jpg/960px-Dune_du_Pilat.jpg",
  },
];
