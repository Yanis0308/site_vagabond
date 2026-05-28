import type { PoiEnrichedData } from "@vagabond/shared-utils";
import { memo, type ReactNode } from "react";
import { Linking, Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { trackEvent } from "@/lib/analytics/analytics";
import { cn } from "@/utils/cn";

import { OpeningHoursCompact } from "./OpeningHoursCompact";

interface ContactInfoSectionProps {
  poiId: string;
  address?: PoiEnrichedData["address"];
  phone?: PoiEnrichedData["phone"];
  website?: PoiEnrichedData["website"];
  openingHours?: PoiEnrichedData["openingHours"];
  price?: PoiEnrichedData["price"];
  className?: string;
}

interface ContactInfoRowProps {
  icon: string;
  text: string;
  onPress?: () => void;
  actionIcon?: string;
}

const ContactInfoRow = memo(
  ({ icon, text, onPress, actionIcon }: ContactInfoRowProps): ReactNode => {
    const content = (
      <Box className="flex-row items-center gap-3 py-2">
        <CustomText type="ratingText" className="w-6 text-lg">
          {icon}
        </CustomText>
        <CustomText type="ratingText" className="flex-1">
          {text}
        </CustomText>
        {actionIcon !== undefined && (
          <CustomText type="ratingText" className="text-lg text-primary-500">
            {actionIcon}
          </CustomText>
        )}
      </Box>
    );

    if (onPress !== undefined) {
      return (
        <Pressable onPress={onPress} className="active:opacity-70">
          {content}
        </Pressable>
      );
    }

    return content;
  },
);

ContactInfoRow.displayName = "ContactInfoRow";

export const ContactInfoSection = memo(
  ({
    poiId,
    address,
    phone,
    website,
    openingHours,
    price,
    className,
  }: ContactInfoSectionProps): ReactNode => {
    const hasPrice = price?.adult !== undefined || price?.child !== undefined;
    const hasPriceInfo = hasPrice || price?.notes !== undefined;

    const hasAnyInfo =
      address !== undefined ||
      (phone !== undefined && phone !== "") ||
      (website !== undefined && website !== "") ||
      (openingHours !== undefined && openingHours.length > 0) ||
      hasPriceInfo;

    if (!hasAnyInfo) {
      return null;
    }

    const fullAddress =
      address?.fullAddress ??
      [address?.street, address?.postalCode, address?.city, address?.country]
        .filter(Boolean)
        .join(", ");

    const handleAddressPress = (): void => {
      if (fullAddress !== "") {
        void trackEvent("poi_directions_requested", { poi_id: poiId });
        // Try to open native GPS apps first (geo: scheme)
        // Fallback to Google Maps if geo: is not supported
        const geoUrl = `geo:0,0?q=${encodeURIComponent(fullAddress)}`;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

        Linking.canOpenURL(geoUrl)
          .then((supported) => {
            if (supported) {
              return Linking.openURL(geoUrl);
            }
            // Fallback to Google Maps
            return Linking.canOpenURL(mapsUrl).then((mapsSupported) => {
              if (mapsSupported) {
                return Linking.openURL(mapsUrl);
              }
              return Promise.resolve();
            });
          })
          .catch(() => {
            // If geo: fails, try Google Maps as fallback
            Linking.canOpenURL(mapsUrl)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(mapsUrl);
                }
                return Promise.resolve();
              })
              .catch(() => {
                // Handle error silently
              });
          });
      }
    };

    const handlePhonePress = (): void => {
      if (phone !== undefined && phone !== "") {
        void trackEvent("poi_phone_called", { poi_id: poiId });
        const telUrl = `tel:${phone}`;
        Linking.canOpenURL(telUrl)
          .then((supported) => {
            if (supported) {
              return Linking.openURL(telUrl);
            }
            return Promise.resolve();
          })
          .catch(() => {
            // Handle error silently
          });
      }
    };

    const handleWebsitePress = (): void => {
      if (website !== undefined && website !== "") {
        void trackEvent("poi_website_opened", { poi_id: poiId });
        Linking.canOpenURL(website)
          .then((supported) => {
            if (supported) {
              return Linking.openURL(website);
            }
            return Promise.resolve();
          })
          .catch(() => {
            // Handle error silently
          });
      }
    };

    const formatPrice = (
      amount: number | undefined,
      currency?: string,
    ): string | null => {
      if (amount === undefined) {
        return null;
      }
      const currencySymbol = currency === "EUR" ? "€" : (currency ?? "");
      return `${amount.toFixed(2)} ${currencySymbol}`.trim();
    };

    const priceParts: string[] = [];
    if (price?.adult !== undefined) {
      priceParts.push(`Adulte: ${formatPrice(price.adult, price.currency)}`);
    }
    if (price?.child !== undefined) {
      priceParts.push(`Enfant: ${formatPrice(price.child, price.currency)}`);
    }
    const priceText = priceParts.join(" • ");

    const infoItems: ReactNode[] = [];

    // Address
    if (fullAddress !== "") {
      infoItems.push(
        <ContactInfoRow
          key="address"
          icon="📍"
          text={fullAddress}
          onPress={handleAddressPress}
          actionIcon="→"
        />,
      );
    }

    // Phone
    if (phone !== undefined && phone !== "") {
      infoItems.push(
        <ContactInfoRow
          key="phone"
          icon="📞"
          text={phone}
          onPress={handlePhonePress}
          actionIcon="→"
        />,
      );
    }

    // Website
    if (website !== undefined && website !== "") {
      infoItems.push(
        <ContactInfoRow
          key="website"
          icon="🌐"
          text={website}
          onPress={handleWebsitePress}
          actionIcon="→"
        />,
      );
    }

    // Opening hours
    if (openingHours !== undefined && openingHours.length > 0) {
      infoItems.push(
        <OpeningHoursCompact
          key="openingHours"
          poiId={poiId}
          openingHours={openingHours}
        />,
      );
    }

    // Price
    if (hasPriceInfo) {
      infoItems.push(
        <Box key="price" className="flex-row items-center gap-3 py-2">
          <CustomText type="ratingText" className="w-6 text-lg">
            {"💰"}
          </CustomText>
          <Box className="flex-1">
            {priceText !== "" && (
              <CustomText type="ratingText">{priceText}</CustomText>
            )}
            {price.notes !== undefined && price.notes !== "" && (
              <CustomText type="ratingText" className="mt-1 text-sm">
                {price.notes}
              </CustomText>
            )}
          </Box>
        </Box>,
      );
    }

    return (
      <Box className={cn("mx-4 mt-6 rounded-lg bg-white", className)}>
        <CustomText type="rating" className="px-6 py-2 text-primary-700">
          {"Informations"}
        </CustomText>
        {infoItems.map((item, index) => (
          <Box key={index}>
            <Box className="px-6">{item}</Box>
            {index < infoItems.length - 1 && <Divider className="my-1" />}
          </Box>
        ))}
        <Box className="pb-4" />
      </Box>
    );
  },
);

ContactInfoSection.displayName = "ContactInfoSection";
