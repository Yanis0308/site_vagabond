import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { type PoiEnrichedType } from "@/http/pois";

import { CollapsibleSection } from "./CollapsibleSection";

interface AmenitiesSectionProps {
  amenities?: PoiEnrichedType["amenities"];
  className?: string;
}

const PET_POLICY_LABELS: Record<string, string> = {
  allowed: "Autorisés",
  not_allowed: "Interdits",
  on_request: "Sur demande",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  credit_card: "Carte bancaire",
};

const WIFI_LABELS: Record<string, string> = {
  free: "Gratuit",
  paid: "Payant",
  unavailable: "Non disponible",
};

export const AmenitiesSection = memo(
  ({ amenities, className }: AmenitiesSectionProps): ReactNode => {
    if (amenities === undefined) {
      return null;
    }

    const hasAmenities =
      amenities.wifi !== undefined ||
      amenities.restrooms !== undefined ||
      amenities.petPolicy !== undefined ||
      amenities.powerOutlets !== undefined ||
      (amenities.paymentMethods !== undefined &&
        amenities.paymentMethods.length > 0);

    if (!hasAmenities) {
      return null;
    }

    const getYesNoText = (value: boolean | undefined): string => {
      if (value === undefined) {
        return "";
      }
      return value ? "Oui" : "Non";
    };

    const amenitiesList: string[] = [];
    if (amenities.wifi !== undefined) {
      amenitiesList.push(
        `WiFi: ${WIFI_LABELS[amenities.wifi] ?? amenities.wifi}`,
      );
    }
    if (amenities.restrooms !== undefined) {
      amenitiesList.push(`Toilettes: ${getYesNoText(amenities.restrooms)}`);
    }
    if (amenities.petPolicy !== undefined) {
      amenitiesList.push(
        `Animaux: ${PET_POLICY_LABELS[amenities.petPolicy] ?? amenities.petPolicy}`,
      );
    }
    if (amenities.powerOutlets !== undefined) {
      amenitiesList.push(`Prises: ${getYesNoText(amenities.powerOutlets)}`);
    }
    if (
      amenities.paymentMethods !== undefined &&
      amenities.paymentMethods.length > 0
    ) {
      amenitiesList.push(
        `Paiement: ${amenities.paymentMethods.map((method) => PAYMENT_METHOD_LABELS[method] ?? method).join(", ")}`,
      );
    }

    return (
      <CollapsibleSection title="Équipements" emoji="🛎️" className={className}>
        {amenitiesList.map((item, index) => (
          <CustomText key={index} className="text-sm text-black-700">
            {item}
          </CustomText>
        ))}
      </CollapsibleSection>
    );
  },
);

AmenitiesSection.displayName = "AmenitiesSection";
