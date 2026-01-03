export interface Review {
  name: string;
  profilePicture: string;
  rating: number;
  description: string;
  images: string[];
  when: string;
}

export interface CompleteAddress {
  borough?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  country?: string;
}

export interface AboutOption {
  name: string;
  enabled: boolean;
}

export interface AboutItem {
  id: string;
  name: string;
  options: AboutOption[];
}

export interface LinkSource {
  link: string;
  source: string;
}

export interface Menu {
  link: string;
  source: string;
}

export interface Owner {
  id: string;
  name: string;
  link: string;
}

export interface PlaceEntry {
  // Identifiants
  id?: string;
  link?: string;
  cid?: string;
  dataId?: string;

  // Informations de base
  title?: string;
  categories?: string[];
  category?: string;
  address?: string;

  // Coordonnées
  latitude?: number;
  longitude?: number;
  plusCode?: string;

  // Contact
  website?: string;
  phone?: string;

  // Horaires
  openHours?: Record<string, string[]>;
  popularTimes?: Record<string, Record<number, number>>;
  status?: string;
  timezone?: string;

  // Avis
  reviewCount?: number;
  reviewRating?: number;
  reviewsPerRating?: Record<number, number>;
  reviewsLink?: string;
  userReviews?: Review[];

  // Autres
  description?: string;
  thumbnail?: string;
  priceRange?: string;
  images?: Array<{ title: string; image: string }>;
  reservations?: LinkSource[];
  orderOnline?: LinkSource[];
  menu?: Menu;
  owner?: Owner;
  completeAddress?: CompleteAddress;
  about?: AboutItem[];
}
