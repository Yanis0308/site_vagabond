import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { Center } from "@/components/ui/center";

import { CustomText } from "../custom-ui/CustomText";
import { Spinner } from "../ui/spinner";

export function LoadingSection(): ReactElement {
  const { t } = useTranslation("common");

  return (
    <Center className="py-8">
      <Spinner size="large" className="text-primary-600" />
      <CustomText className="mt-4 font-medium text-typography-500">
        {t("place_details_sheet.loading_enriched_data")}
      </CustomText>
    </Center>
  );
}
