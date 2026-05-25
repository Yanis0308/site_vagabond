import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, ButtonText } from "@/components/ui/button";

interface PlaceDetailsUserFeedbackProps {
  placeId: string;
}

export const PlaceDetailsUserFeedback = ({
  placeId,
}: PlaceDetailsUserFeedbackProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <View className="px-4 pb-8 pt-4">
      <Button
        action="text"
        className="self-center px-4 py-2"
        href={`/user-feedback/${placeId}`}
      >
        <ButtonText className="text-base text-primary-600 no-underline">
          {t("user_feedback.place_details.cta")}
        </ButtonText>
      </Button>
    </View>
  );
};

PlaceDetailsUserFeedback.displayName = "PlaceDetailsUserFeedback";
