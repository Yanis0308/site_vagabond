import type { PoiEnrichedData } from "@vagabond/shared-utils";
import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";

import { CollapsibleSection } from "./CollapsibleSection";

interface TransportAccessSectionProps {
  transportAccess?: PoiEnrichedData["transportAccess"];
  className?: string;
}

const PARKING_TYPE_LABELS: Record<string, string> = {
  free: "Gratuit",
  paid: "Payant",
  unavailable: "Non disponible",
};

export const TransportAccessSection = memo(
  ({ transportAccess, className }: TransportAccessSectionProps): ReactNode => {
    if (transportAccess === undefined) {
      return null;
    }

    const hasTransportInfo =
      transportAccess.hasParking !== undefined ||
      transportAccess.parkingType !== undefined ||
      transportAccess.publicTransportAccessible !== undefined ||
      (transportAccess.publicTransportNotes !== undefined &&
        transportAccess.publicTransportNotes !== "");

    if (!hasTransportInfo) {
      return null;
    }

    const getYesNoText = (value: boolean | undefined): string => {
      if (value === undefined) {
        return "";
      }
      return value ? "Oui" : "Non";
    };

    const transportList: string[] = [];
    if (transportAccess.hasParking !== undefined) {
      transportList.push(
        `Parking: ${getYesNoText(transportAccess.hasParking)}`,
      );
    }
    if (transportAccess.parkingType !== undefined) {
      transportList.push(
        `Type: ${PARKING_TYPE_LABELS[transportAccess.parkingType] ?? transportAccess.parkingType}`,
      );
    }
    if (transportAccess.publicTransportAccessible !== undefined) {
      transportList.push(
        `Transport en commun: ${getYesNoText(transportAccess.publicTransportAccessible)}`,
      );
    }

    return (
      <CollapsibleSection
        title="Transport et accès"
        emoji="🚗"
        className={className}
      >
        {transportList.map((item, index) => (
          <CustomText key={index} className="text-sm text-gray-700">
            {item}
          </CustomText>
        ))}
        {transportAccess.publicTransportNotes !== undefined &&
          transportAccess.publicTransportNotes !== "" && (
            <CustomText className="mt-1 text-sm text-gray-500">
              {transportAccess.publicTransportNotes}
            </CustomText>
          )}
      </CollapsibleSection>
    );
  },
);

TransportAccessSection.displayName = "TransportAccessSection";
