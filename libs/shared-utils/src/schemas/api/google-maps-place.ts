import { Type, type Static } from "typebox";

// ============================================
// Sub-schemas for nested structures
// ============================================

/**
 * Schema for a user review
 */
export const ReviewSchema = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    profilePicture: Type.String(),
    rating: Type.Number({ minimum: 0, maximum: 5 }),
    description: Type.String(),
    images: Type.Array(Type.String()),
    when: Type.String(),
  },
  { $id: "Review" },
);

/**
 * Schema for complete address components
 */
export const CompleteAddressSchema = Type.Object(
  {
    borough: Type.Optional(Type.String()),
    street: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    postalCode: Type.Optional(Type.String()),
    state: Type.Optional(Type.String()),
    country: Type.Optional(Type.String()),
  },
  { $id: "CompleteAddress" },
);

/**
 * Schema for about section option
 */
export const AboutOptionSchema = Type.Object(
  {
    name: Type.String(),
    enabled: Type.Boolean(),
  },
  { $id: "AboutOption" },
);

/**
 * Schema for about section item
 */
export const AboutItemSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    options: Type.Array(AboutOptionSchema),
  },
  { $id: "AboutItem" },
);

/**
 * Schema for link and source pairs (reservations, order online, etc.)
 */
export const LinkSourceSchema = Type.Object(
  {
    link: Type.String(),
    source: Type.String(),
  },
  { $id: "LinkSource" },
);

/**
 * Schema for menu information
 */
export const MenuSchema = Type.Object(
  {
    link: Type.String(),
    source: Type.String(),
  },
  { $id: "Menu" },
);

/**
 * Schema for owner information
 */
export const OwnerSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    link: Type.String(),
  },
  { $id: "Owner" },
);

/**
 * Schema for image with title
 */
export const ImageWithTitleSchema = Type.Object(
  {
    title: Type.String(),
    image: Type.String(),
  },
  { $id: "ImageWithTitle" },
);

// ============================================
// Main Google Maps Place Schema (Strict)
// ============================================

/**
 * Strict schema for Google Maps place data
 * Required fields: title, latitude, longitude, categories
 * At least one of cid or dataId must be present (validated separately)
 */
export const GoogleMapsPlaceStrictSchema = Type.Object(
  {
    // Identifiers (at least one required - validated at runtime)
    id: Type.Optional(Type.String()),
    link: Type.Optional(Type.String()),
    cid: Type.Optional(Type.String()),
    dataId: Type.Optional(Type.String()),

    // Required base information
    title: Type.String({ minLength: 1 }),
    categories: Type.Array(Type.String()),
    category: Type.Optional(Type.String()),
    address: Type.Optional(Type.String()),

    // Required coordinates
    latitude: Type.Number(),
    longitude: Type.Number(),
    plusCode: Type.Optional(Type.String()),

    // Optional contact information
    website: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),

    // Optional hours and status
    openHours: Type.Optional(
      Type.Record(Type.String(), Type.Array(Type.String())),
    ),
    popularTimes: Type.Optional(
      Type.Record(Type.String(), Type.Record(Type.String(), Type.Number())),
    ),
    status: Type.Optional(Type.String()),
    timezone: Type.Optional(Type.String()),

    // Optional review information
    reviewCount: Type.Optional(Type.Number()),
    reviewRating: Type.Optional(Type.Number()),
    reviewsPerRating: Type.Optional(Type.Record(Type.String(), Type.Number())),
    reviewsLink: Type.Optional(Type.String()),
    userReviews: Type.Optional(Type.Array(ReviewSchema)),

    // Optional additional information
    description: Type.Optional(Type.String()),
    thumbnail: Type.Optional(Type.String()),
    priceRange: Type.Optional(Type.String()),
    images: Type.Optional(Type.Array(ImageWithTitleSchema)),
    reservations: Type.Optional(Type.Array(LinkSourceSchema)),
    orderOnline: Type.Optional(Type.Array(LinkSourceSchema)),
    menu: Type.Optional(MenuSchema),
    owner: Type.Optional(OwnerSchema),
    completeAddress: Type.Optional(CompleteAddressSchema),
    about: Type.Optional(Type.Array(AboutItemSchema)),
  },
  {
    additionalProperties: false,
    $id: "GoogleMapsPlaceStrict",
  },
);

// ============================================
// Type exports
// ============================================

export type Review = Static<typeof ReviewSchema>;
export type CompleteAddress = Static<typeof CompleteAddressSchema>;
export type AboutOption = Static<typeof AboutOptionSchema>;
export type AboutItem = Static<typeof AboutItemSchema>;
export type LinkSource = Static<typeof LinkSourceSchema>;
export type Menu = Static<typeof MenuSchema>;
export type Owner = Static<typeof OwnerSchema>;
export type ImageWithTitle = Static<typeof ImageWithTitleSchema>;
export type GoogleMapsPlaceStrict = Static<typeof GoogleMapsPlaceStrictSchema>;
