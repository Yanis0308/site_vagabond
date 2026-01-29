import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { type PoiEnrichedType } from "@/http/pois";

import { CollapsibleSection } from "./CollapsibleSection";

interface AccessibilitySectionProps {
  accessibility?: PoiEnrichedType["accessibility"];
  className?: string;
}

export const AccessibilitySection = memo(
  ({ accessibility, className }: AccessibilitySectionProps): ReactNode => {
    if (accessibility === undefined) {
      return null;
    }

    const hasAccessibilityInfo =
      accessibility.wheelchairAccessible !== undefined ||
      accessibility.accessibleParking !== undefined ||
      accessibility.accessibleRestrooms !== undefined ||
      (accessibility.notes !== undefined && accessibility.notes !== "");

    if (!hasAccessibilityInfo) {
      return null;
    }

    const getAccessibilityText = (value: boolean | undefined): string => {
      if (value === undefined) {
        return "";
      }
      return value ? "Oui" : "Non";
    };

    const accessibilityList: string[] = [];
    if (accessibility.wheelchairAccessible !== undefined) {
      accessibilityList.push(
        `Fauteuil roulant: ${getAccessibilityText(accessibility.wheelchairAccessible)}`,
      );
    }
    if (accessibility.accessibleParking !== undefined) {
      accessibilityList.push(
        `Parking: ${getAccessibilityText(accessibility.accessibleParking)}`,
      );
    }
    if (accessibility.accessibleRestrooms !== undefined) {
      accessibilityList.push(
        `Toilettes: ${getAccessibilityText(accessibility.accessibleRestrooms)}`,
      );
    }

    return (
      <CollapsibleSection
        title="Accessibilité"
        emoji="♿"
        className={className}
      >
        {accessibilityList.map((item, index) => (
          <CustomText key={index} className="text-sm text-gray-700">
            {item}
          </CustomText>
        ))}
        {accessibility.notes !== undefined && accessibility.notes !== "" && (
          <CustomText className="mt-1 text-sm text-gray-500">
            {accessibility.notes}
          </CustomText>
        )}
      </CollapsibleSection>
    );
  },
);

AccessibilitySection.displayName = "AccessibilitySection";
