// import { type Static, Type } from "typebox";

// import { PoiCategoryTypesSchema } from "../api/poi-categories.js";
// import { CoordsSchema } from "../geo.js";

// // Gemini dont support string regex pattern and need "type: string" for enum field

// export const PoiEnrichedPhotoSchema = Type.Object(
//   {
//     url: Type.String({
//       maxLength: 2048,
//       description: "URL of the photo",
//     }),
//     caption: Type.String({
//       maxLength: 500,
//       description: "Caption describing the photo",
//     }),
//     credit: Type.String({
//       maxLength: 200,
//       description: "Credit/attribution for the photo",
//     }),
//     isPrimary: Type.Boolean({
//       description: "Whether this is the primary/cover photo",
//     }),
//   },
//   {
//     description: "Photo with URL, caption, credit, and primary indicator",
//     $id: "PoiEnrichedPhoto",
//     additionalProperties: false,
//   },
// );

// export type PoiEnrichedPhoto = Static<typeof PoiEnrichedPhotoSchema>;

// export const PoiEnrichedPopularitySchema = Type.Object(
//   {
//     rating: Type.Number({
//       minimum: 0,
//       maximum: 5,
//       description: "Average rating (0-5 scale)",
//     }),
//     reviewCount: Type.Integer({ minimum: 0, description: "Number of reviews" }),
//   },
//   {
//     description: "Popularity metrics including rating and crowd levels",
//     $id: "PoiEnrichedPopularity",
//     additionalProperties: false,
//   },
// );

// export const PoiEnrichedAddressSchema = Type.Object(
//   {
//     street: Type.String({ maxLength: 500, description: "Street address" }),
//     city: Type.String({ maxLength: 200, description: "City name" }),
//     postalCode: Type.String({ maxLength: 20, description: "Postal/ZIP code" }),
//     country: Type.String({ maxLength: 100, description: "Country name" }),
//     fullAddress: Type.String({
//       maxLength: 1000,
//       description: "Complete formatted address",
//     }),
//   },
//   {
//     description: "Physical address information",
//     $id: "PoiEnrichedAddress",
//     additionalProperties: false,
//   },
// );

// export const PoiEnrichedOpeningHoursSchema = Type.Object(
//   {
//     day: Type.Enum(
//       [
//         "monday",
//         "tuesday",
//         "wednesday",
//         "thursday",
//         "friday",
//         "saturday",
//         "sunday",
//       ],
//       { description: "Day of the week", type: "string" },
//     ),
//     timeSlots: Type.Array(
//       Type.Object(
//         {
//           open: Type.String({
//             pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
//             maxLength: 5,
//             description: "Opening time in HH:MM format",
//           }),
//           close: Type.String({
//             pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$",
//             maxLength: 5,
//             description: "Closing time in HH:MM format",
//           }),
//         },
//         { $id: "PoiEnrichedOpeningHoursTimeSlot", additionalProperties: false },
//       ),
//       {
//         description: "Time slots for this day (empty array means closed)",
//         minItems: 0,
//       },
//     ),
//   },
//   {
//     description: "Opening hours for a specific day of the week",
//     $id: "PoiEnrichedOpeningHours",
//     additionalProperties: false,
//   },
// );

// export const PoiEnrichedAverageVisitDurationSchema = Type.Object(
//   {
//     durationInMinutes: Type.Integer({
//       minimum: 0,
//       description: "Duration in minutes",
//     }),
//   },
//   {
//     description: "Average time visitors spend at the POI",
//     $id: "PoiEnrichedAverageVisitDuration",
//     additionalProperties: false,
//   },
// );

// export const PoiEnrichedAccessibilitySchema = Type.Object(
//   {
//     wheelchairAccessible: Type.Boolean({
//       description: "Whether wheelchair access is available",
//     }),
//     accessibleParking: Type.Boolean({
//       description: "Whether accessible parking is available",
//     }),
//     accessibleRestrooms: Type.Boolean({
//       description: "Whether accessible restrooms are available",
//     }),
//     notes: Type.String({
//       maxLength: 1000,
//       description: "Additional accessibility notes",
//     }),
//   },
//   {
//     description: "Accessibility information for people with reduced mobility",
//     $id: "PoiEnrichedAccessibility",
//     additionalProperties: false,
//   },
// );

// export const PoiEnrichedPriceSchema = Type.Object(
//   {
//     adult: Type.Number({ minimum: 0, description: "Adult ticket price" }),
//     child: Type.Number({ minimum: 0, description: "Child ticket price" }),
//     currency: Type.String({
//       pattern: "^[A-Z]{3}$",
//       maxLength: 3,
//       description: "ISO 4217 currency code",
//     }),
//     notes: Type.String({
//       maxLength: 1000,
//       description: "Additional pricing notes or special offers",
//     }),
//   },
//   {
//     description: "Pricing information",
//     $id: "PoiEnrichedPrice",
//     additionalProperties: false,
//   },
// );

// // === SEASONAL CLOSURE ===
// export const PoiEnrichedSeasonalClosureSchema = Type.Object(
//   {
//     startDate: Type.String({
//       pattern: "^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])$",
//       maxLength: 5,
//       description: "Start date of closure in DD-MM format",
//     }),
//     endDate: Type.String({
//       pattern: "^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])$",
//       maxLength: 5,
//       description: "End date of closure in DD-MM format",
//     }),
//     notes: Type.String({
//       maxLength: 500,
//       description: "Additional notes about seasonal closure",
//     }),
//   },
//   {
//     description: "Seasonal closure period for the POI",
//     $id: "PoiEnrichedSeasonalClosure",
//     additionalProperties: false,
//   },
// );

// // === TRANSPORT AND ACCESS ===
// export const PoiEnrichedParkingTypeSchema = Type.Enum(
//   ["free", "paid", "unavailable"],
//   {
//     description: "Parking type status (free, paid, or unavailable)",
//     $id: "PoiEnrichedParkingType",
//     type: "string",
//   },
// );

// export const PoiEnrichedTransportAccessSchema = Type.Object(
//   {
//     hasParking: Type.Boolean({
//       description: "Whether parking is available",
//     }),
//     parkingType: PoiEnrichedParkingTypeSchema,
//     publicTransportAccessible: Type.Boolean({
//       description: "Whether the POI is accessible by public transport",
//     }),
//     publicTransportNotes: Type.String({
//       maxLength: 500,
//       description: "Details about public transport access",
//     }),
//   },
//   {
//     description: "Transport and access information for the POI",
//     $id: "PoiEnrichedTransportAccess",
//     additionalProperties: false,
//   },
// );

// // === AMENITIES ===
// export const PoiEnrichedWifiTypeSchema = Type.Enum(
//   ["free", "paid", "unavailable"],
//   {
//     description: "Wifi type status (free, paid, or unavailable)",
//     $id: "PoiEnrichedWifiType",
//     type: "string",
//   },
// );

// export const PoiEnrichedPetPolicySchema = Type.Enum(
//   ["allowed", "not_allowed", "on_request"],
//   {
//     description: "Pet policy for the POI",
//     $id: "PoiEnrichedPetPolicy",
//     type: "string",
//   },
// );

// export const PoiEnrichedPaymentMethodSchema = Type.Enum(
//   ["cash", "credit_card"],
//   {
//     description: "Accepted payment method",
//     $id: "PoiEnrichedPaymentMethod",
//     type: "string",
//   },
// );

// export const PoiEnrichedAmenitiesSchema = Type.Object(
//   {
//     wifi: PoiEnrichedWifiTypeSchema,
//     restrooms: Type.Boolean({
//       description: "Whether restrooms are available",
//     }),
//     petPolicy: PoiEnrichedPetPolicySchema,
//     powerOutlets: Type.Boolean({
//       description: "Whether power outlets are available for visitors",
//     }),
//     paymentMethods: Type.Array(PoiEnrichedPaymentMethodSchema, {
//       description: "List of accepted payment methods",
//     }),
//   },
//   {
//     description: "Amenities and services available at the POI",
//     $id: "PoiEnrichedAmenities",
//     additionalProperties: false,
//   },
// );

// // === SOCIAL MEDIA ===
// export const PoiEnrichedSocialMediaSchema = Type.Object(
//   {
//     instagramHandle: Type.String({
//       maxLength: 100,
//       pattern: "^@[a-zA-Z0-9._]+$",
//       description: "Instagram handle (with @)",
//     }),
//     facebookUrl: Type.String({
//       maxLength: 2048,
//       description: "Facebook page URL",
//     }),
//     twitterHandle: Type.String({
//       maxLength: 100,
//       pattern: "^@[a-zA-Z0-9_]+$",
//       description: "Twitter/X handle (with @)",
//     }),
//   },
//   {
//     description: "Social media presence of the POI",
//     $id: "PoiEnrichedSocialMedia",
//     additionalProperties: false,
//   },
// );

// export const PoiEnrichedTouristInterestsLevelSchema = Type.Enum(
//   ["must-see", "high", "medium", "low", "niche"],
//   {
//     description: "Tourist interest level",
//     $id: "PoiEnrichedTouristInterestsLevel",
//     type: "string",
//   },
// );

// // Shared field schemas
// export const PoiEnrichedDescriptionFieldSchema = Type.String({
//   maxLength: 5000,
//   description: "Description for the POI card on the mobile app",
//   $id: "PoiEnrichedDescriptionField",
// });

// export const PoiEnrichedSeoDescriptionFieldSchema = Type.String({
//   maxLength: 5000,
//   description:
//     "Complete and comprehensive description for the website with SEO-optimized keywords",
//   $id: "PoiEnrichedSeoDescriptionField",
// });

// export const PoiEnrichedFunFactsFieldSchema = Type.Array(
//   Type.String({ maxLength: 500 }),
//   {
//     minItems: 0,
//     maxItems: 10,
//     description: "Array of interesting facts about the POI",
//     $id: "PoiEnrichedFunFactsField",
//   },
// );

// export const PoiEnrichedInstagrammableFieldSchema = Type.Boolean({
//   description: "Whether the POI is considered Instagram-worthy or photogenic",
//   $id: "PoiEnrichedInstagrammableField",
// });

// export const PoiEnrichedFamilyFriendlyFieldSchema = Type.Boolean({
//   description: "Whether the POI is suitable for families and children",
//   $id: "PoiEnrichedFamilyFriendlyField",
// });

// export const PoiEnrichedCategoriesFieldSchema = Type.Array(
//   PoiCategoryTypesSchema,
//   {
//     description: "Categories or tags associated with the POI",
//     $id: "PoiEnrichedCategoriesField",
//   },
// );

// export const PoiEnrichedLocationTypeFieldSchema = Type.Enum(
//   ["interior", "exterior", "both"],
//   {
//     description: "Whether the POI is indoors, outdoors, or both",
//     $id: "PoiEnrichedLocationTypeField",
//     type: "string",
//   },
// );

// export const PoiEnrichedPracticalTipsFieldSchema = Type.Array(
//   Type.String({ maxLength: 500 }),
//   {
//     description:
//       "Practical tips and advice for visitors: visiting tips, useful information, recommendations, and best practices for visiting the POI",
//     $id: "PoiEnrichedPracticalTipsField",
//   },
// );

// export const PoiEnrichedPhoneFieldSchema = Type.String({
//   // pattern:
//   //   "^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$",
//   maxLength: 50,
//   description: "Contact phone number",
//   $id: "PoiEnrichedPhoneField",
// });

// export const PoiEnrichedWebsiteFieldSchema = Type.String({
//   maxLength: 2048,
//   description: "Official website URL of the POI",
//   $id: "PoiEnrichedWebsiteField",
// });

// export const PoiEnrichedReservationRequiredFieldSchema = Type.Boolean({
//   description: "Whether a reservation is required to visit the POI",
//   $id: "PoiEnrichedReservationRequiredField",
// });

// export const PoiEnrichedSeasonalClosureFieldSchema = Type.Array(
//   PoiEnrichedSeasonalClosureSchema,
//   {
//     description: "List of seasonal closure periods",
//     $id: "PoiEnrichedSeasonalClosureField",
//   },
// );

// export const PoiEnrichedTransportAccessFieldSchema =
//   PoiEnrichedTransportAccessSchema;

// export const PoiEnrichedAmenitiesFieldSchema = PoiEnrichedAmenitiesSchema;

// export const PoiEnrichedSocialMediaFieldSchema = PoiEnrichedSocialMediaSchema;

// export const PoiEnrichedSchema = Type.Object(
//   {
//     name: Type.String({
//       maxLength: 1000,
//       description: "Name of the POI",
//     }),
//     position: CoordsSchema,
//     photos: Type.Array(PoiEnrichedPhotoSchema),
//     popularity: PoiEnrichedPopularitySchema,
//     address: PoiEnrichedAddressSchema,
//     phone: PoiEnrichedPhoneFieldSchema,
//     website: PoiEnrichedWebsiteFieldSchema,
//     openingHours: Type.Array(PoiEnrichedOpeningHoursSchema),
//     price: PoiEnrichedPriceSchema,
//     socialMedia: PoiEnrichedSocialMediaFieldSchema,
//     description: PoiEnrichedDescriptionFieldSchema,
//     seoDescription: PoiEnrichedSeoDescriptionFieldSchema,
//     funFacts: PoiEnrichedFunFactsFieldSchema,
//     instagrammable: PoiEnrichedInstagrammableFieldSchema,
//     familyFriendly: PoiEnrichedFamilyFriendlyFieldSchema,
//     categories: PoiEnrichedCategoriesFieldSchema,
//     averageVisitDuration: PoiEnrichedAverageVisitDurationSchema,
//     accessibility: PoiEnrichedAccessibilitySchema,
//     locationType: PoiEnrichedLocationTypeFieldSchema,
//     practicalTips: PoiEnrichedPracticalTipsFieldSchema,
//     touristInterest: PoiEnrichedTouristInterestsLevelSchema,
//     seasonalClosure: PoiEnrichedSeasonalClosureFieldSchema,
//     transportAccess: PoiEnrichedTransportAccessFieldSchema,
//     amenities: PoiEnrichedAmenitiesFieldSchema,
//     reservationRequired: PoiEnrichedReservationRequiredFieldSchema,
//   },
//   {
//     $id: "PoiEnriched",
//     additionalProperties: false,
//   },
// );

// export type PoiEnrichedData = Static<typeof PoiEnrichedSchema>;
