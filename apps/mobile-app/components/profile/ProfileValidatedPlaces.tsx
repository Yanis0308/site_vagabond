import { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";

import { ProfileHierarchicalAccordion } from "./ProfileHierarchicalAccordion";
import type { CountryType } from "./utils";

interface ProfileValidatedPlacesProps {
  countries: CountryType[];
  allowVisitedPoiNavigation: boolean;
}

export const ProfileValidatedPlaces = memo(
  ({
    countries,
    allowVisitedPoiNavigation,
  }: ProfileValidatedPlacesProps): ReactElement => {
    const { t } = useTranslation("common");

    return (
      <Box className="rounded-lg border border-gray-200 bg-white py-4 shadow-sm">
        <CustomText className="mb-4 px-4 text-lg font-semibold text-gray-900">
          {t("validated_places")}
        </CustomText>

        {countries.length === 0 ? (
          <Box className="items-center justify-center py-8">
            <CustomText className="text-gray-500">
              {t("no_validated_places")}
            </CustomText>
          </Box>
        ) : (
          <ProfileHierarchicalAccordion
            countries={countries}
            allowVisitedPoiNavigation={allowVisitedPoiNavigation}
          />
        )}
      </Box>
    );
  },
);

ProfileValidatedPlaces.displayName = "ProfileValidatedPlaces";
