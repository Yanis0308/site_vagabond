import { type StaffToolsBoundaryLevel } from "@vagabond/shared-utils";
import { ChevronDown, Circle } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Alert } from "react-native";

import { config } from "@/constants/Config";
import { useStaffToolsCompleteZoneMutation } from "@/hooks/mutations/useStaffToolsCompleteZoneMutation";
import { useStaffToolsValidatePlaceMutation } from "@/hooks/mutations/useStaffToolsValidatePlaceMutation";
import { useUserVisitedPois } from "@/hooks/queries/useUserVisitedPois";
import { getOsmUrl } from "@/utils/openstreetmap";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "../ui/radio";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "../ui/select";

const PERCENTAGE_OPTIONS = [
  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

const BOUNDARY_LEVELS: Array<{
  label: string;
  value: StaffToolsBoundaryLevel;
}> = [
  { label: "Ville", value: "CITY" },
  { label: "Dép.", value: "COUNTY" },
  { label: "Région", value: "REGION" },
];

export const StaffInfoSection = ({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}): ReactNode => {
  const validateMutation = useStaffToolsValidatePlaceMutation();
  const completeZoneMutation = useStaffToolsCompleteZoneMutation();
  const {
    data: { visitedPoiIds },
  } = useUserVisitedPois();
  const isAlreadyValidated = visitedPoiIds.includes(placeId);

  const [boundaryLevel, setBoundaryLevel] =
    useState<StaffToolsBoundaryLevel>("CITY");
  const [percentage, setPercentage] = useState(50);

  const handleValidatePlace = (): void => {
    validateMutation.mutate(placeId, {
      onSuccess: () => {
        Alert.alert("✓", "Lieu validé avec succès");
      },
      onError: () => {
        Alert.alert("Erreur", "Impossible de valider ce lieu");
      },
    });
  };

  const handleCompleteZone = (): void => {
    Alert.alert(
      "Compléter la zone ?",
      `Ajuster la zone (${boundaryLevel}) à ${String(percentage)}% de validations.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: (): void => {
            completeZoneMutation.mutate(
              { poiId: placeId, boundaryLevel, percentage },
              {
                onSuccess: (result) => {
                  Alert.alert(
                    "✓ Zone complétée",
                    `${result.addedCount} ajoutés, ${result.removedCount} supprimés`,
                  );
                },
                onError: () => {
                  Alert.alert("Erreur", "Impossible de compléter la zone");
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <Box className="mx-3 mt-6 flex gap-2 border border-dashed border-primary-500 px-3 pb-3">
      <CustomText type="title" className="text-center text-primary-700">
        {"- Staff section -"}
      </CustomText>

      <Box className="flex-row flex-wrap gap-2">
        <Button
          size="small"
          action="secondary"
          href={getOsmUrl(placeId)}
          isDisabled={getOsmUrl(placeId) === null}
        >
          <ButtonText>{"OSM"}</ButtonText>
        </Button>
        <Button
          size="small"
          action="secondary"
          href={`https://www.google.com/maps/search/?api=1&query=${placeName}`}
        >
          <ButtonText>{"Maps"}</ButtonText>
        </Button>
      </Box>

      <CustomText type="title" className="text-center text-primary-700">
        {"- POI Info -"}
      </CustomText>
      <Box className="flex">
        <CustomText>
          {`ID: ${placeId}\n`}
          {`Name: ${placeName}`}
        </CustomText>
      </Box>

      {config.isDevEnv && (
        <>
          <CustomText type="title" className="text-center text-primary-700">
            {"- Staff Tools -"}
          </CustomText>

          <Button
            size="small"
            action="primary"
            onPress={handleValidatePlace}
            isDisabled={validateMutation.isPending || isAlreadyValidated}
          >
            <ButtonText>
              {isAlreadyValidated
                ? "Déjà validé"
                : validateMutation.isPending
                  ? "..."
                  : "Valider ce lieu"}
            </ButtonText>
          </Button>

          <CustomText className="mt-2 font-semibold">
            {"Compléter une zone"}
          </CustomText>

          <RadioGroup value={boundaryLevel} onChange={setBoundaryLevel}>
            {BOUNDARY_LEVELS.map(({ label, value: levelValue }) => (
              <Radio key={levelValue} value={levelValue}>
                <RadioIndicator>
                  <RadioIcon as={Circle} />
                </RadioIndicator>
                <RadioLabel>{label}</RadioLabel>
              </Radio>
            ))}
          </RadioGroup>

          <Box className="gap-2">
            <CustomText>{"Pourcentage :"}</CustomText>
            <Select
              selectedValue={String(percentage)}
              onValueChange={(value: string) => {
                setPercentage(parseInt(value, 10));
              }}
            >
              <SelectTrigger>
                <SelectInput value={`${String(percentage)}%`} />
                <SelectIcon className="mr-3" as={ChevronDown} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {PERCENTAGE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option}
                      label={`${String(option)}%`}
                      value={String(option)}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </Box>

          <Button
            size="small"
            action="primary"
            className="mt-3"
            onPress={handleCompleteZone}
            isDisabled={completeZoneMutation.isPending}
          >
            <ButtonText>
              {completeZoneMutation.isPending ? "..." : "Appliquer"}
            </ButtonText>
          </Button>
        </>
      )}
    </Box>
  );
};

StaffInfoSection.displayName = "StaffInfoSection";
