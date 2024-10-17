import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import { PermissionStatus } from "expo-modules-core/src/PermissionsInterface";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

import { PictureInput } from "@/components/PictureInput";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useUploadFileMutation } from "@/hooks/mutations/useUploadFileMutation";
import { useValidatePlaceMutation } from "@/hooks/mutations/useValidatePlaceMutation";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { useUserMe } from "@/hooks/queries/useUserMe";
import { logger } from "@/utils/logger";

const ValidatePlaceSchema = z.object({
  position: z.object({ lat: z.number(), lng: z.number() }),
  imageInfo: z.object({
    uri: z.string().url(),
    fileName: z.string(),
    mimeType: z.string(),
  }),
});

type ValidatePlaceType = z.infer<typeof ValidatePlaceSchema>;

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function PlaceDetails(): ReactElement {
  const { data: placesData } = usePlaces();
  const { data: usersMeData } = useUserMe();
  const { place: placeId } = useLocalSearchParams<{ place: string }>();
  const place = placesData?.find(
    (placeElement) => `${placeElement.id}` === placeId,
  );
  const [, setLocationPermissionStatus] = useState<PermissionStatus | null>(
    null,
  );

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
    register,
  } = useForm<ValidatePlaceType>(
    useMemo(
      () => ({
        resolver: zodResolver(ValidatePlaceSchema),
        mode: "all",
        defaultValues: { imageInfo: undefined },
      }),
      [],
    ),
  );

  const uploadFile = useUploadFileMutation();
  const validatePlace = useValidatePlaceMutation();

  const onSubmit = async (data: ValidatePlaceType): Promise<void> => {
    logger("submiting with ", data);
    try {
      const [{ id: uploadedFileId }] = await uploadFile.mutateAsync(
        data.imageInfo,
      );
      logger("uploadedFileId", uploadedFileId);
      const currentUserId = usersMeData?.id;
      if (currentUserId === undefined) {
        //TODO: mieux gérer cela avec un load et bloquer le bouton du formulaire, ou le gérer côté backend
        return;
      }
      await validatePlace.mutateAsync({
        place: placeId,
        users_permissions_user: currentUserId,
        position: { latitude: data.position.lat, longitude: data.position.lng },
        photo: uploadedFileId,
      });
      router.back();
    } catch (error) {
      logger("error in submitting", error);
    }
  };

  useEffect(() => {
    register("position");
  }, [register]);

  useEffect(() => {
    void (async (): Promise<void> => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      if (status !== Location.PermissionStatus.GRANTED) {
        alert("permission not granted");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setValue(
        "position",
        {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        { shouldValidate: true },
      );
    })();
  }, [setValue]);

  const missingPlaceComponent = useMemo(
    () => (
      <Box>
        <Text>Error - Missing place</Text>
      </Box>
    ),
    [],
  );
  if (place === undefined) {
    return missingPlaceComponent;
  }

  logger("errors", errors);

  return (
    <ScrollView className={"flex-1"}>
      <Stack.Screen
        options={{
          title: place.title,
        }}
      />
      <VStack className="w-full flex-1 p-4">
        <FormControl
          isInvalid={"position" in errors}
          size="md"
          isDisabled={true}
          isReadOnly={true}
          isRequired={true}
        >
          <FormControlLabel>
            <FormControlLabelText>
              Your current location is {JSON.stringify(watch("position"))}
            </FormControlLabelText>
          </FormControlLabel>
          <FormControlError>
            <FormControlErrorIcon as={AlertCircle} />
            <FormControlErrorText>Your position is needed</FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl
          isInvalid={"imageUrl" in errors}
          size="md"
          isDisabled={true}
          isReadOnly={true}
          isRequired={true}
        >
          <FormControlLabel>
            <FormControlLabelText>Your photo</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="imageInfo"
            // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
            render={({ field: { value, onChange } }) => (
              <PictureInput
                currentImageInfo={value}
                // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
                setImageInfo={(newImageInfo) => {
                  onChange(newImageInfo);
                }}
                // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
                resetImage={() => {
                  onChange(undefined);
                }}
              />
            )}
          />
          <FormControlError>
            <FormControlErrorIcon as={AlertCircle} />
            <FormControlErrorText>Your photo is needed</FormControlErrorText>
          </FormControlError>
        </FormControl>
        {/*TODO: utiliser une librairie du style classnames cx()*/}
        <Button
          className={`mt-10 ${isSubmitting ? "opacity-50" : ""}`}
          size="sm"
          onPress={void handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <ButtonText>Submit</ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
}
