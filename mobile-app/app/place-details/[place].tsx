import { PictureInput } from "@/components/PictureInput";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useUploadFileMutation } from "@/hooks/mutations/useUploadFileMutation";
import { useValidatePlaceMutation } from "@/hooks/mutations/useValidatePlaceMutation";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { useUserMe } from "@/hooks/queries/useUserMe";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

const ValidatePlaceSchema = z.object({
  position: z.object({ lat: z.number(), lng: z.number() }),
  imageInfo: z.object({
    uri: z.string().url(),
    fileName: z.string(),
    mimeType: z.string(),
  }),
});

type ValidatePlaceType = z.infer<typeof ValidatePlaceSchema>;

export default function PlaceDetails() {
  const { data: placesData } = usePlaces();
  const { data: usersMeData } = useUserMe();
  const { place: placeId } = useLocalSearchParams<{ place: string }>();
  const place = placesData?.find(
    (placeElement) => `${placeElement.id}` === placeId,
  );

  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<ValidatePlaceType>({
    resolver: zodResolver(ValidatePlaceSchema),
    mode: "all",
    defaultValues: { imageInfo: undefined },
  });

  const uploadFile = useUploadFileMutation();
  const validatePlace = useValidatePlaceMutation();

  const onSubmit = async (data: ValidatePlaceType) => {
    console.log("submiting with ", data);
    try {
      const [{ id: uploadedFileId }] = await uploadFile.mutateAsync(
        data.imageInfo,
      );
      console.log("uploadedFileId", uploadedFileId);
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
      router.replace("/");
    } catch (error) {
      console.error("error in submitting", error);
    }
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
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

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (watch("position") !== undefined) {
    text = JSON.stringify(watch("position"));
  }

  if (place === undefined) {
    return (
      <Box>
        <Text>Error - Missing place</Text>
      </Box>
    );
  }

  console.log("errors", errors);

  return (
    <ScrollView className={"flex-1"}>
      <VStack className="w-full flex-1 p-4">
        <Text>Location: {text}</Text>
        <FormControl
          isInvalid={"position" in errors}
          size="md"
          isDisabled={true}
          isReadOnly={true}
          isRequired={true}
        >
          <FormControlLabel>
            <FormControlLabelText>Your current location</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name="position"
            render={({ field: { value } }) => (
              <Input className="my-1">
                <InputField value={JSON.stringify(value)} />
              </Input>
            )}
          />

          <FormControlHelper>
            <FormControlHelperText>
              Allow Vagabond to access your position
            </FormControlHelperText>
          </FormControlHelper>
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
            render={({ field: { value, onChange } }) => (
              <PictureInput
                currentImageInfo={value}
                setImageInfo={(newImageInfo) => {
                  onChange(newImageInfo);
                }}
                resetImage={() => onChange(undefined)}
              />
            )}
          />

          <FormControlHelper>
            <FormControlHelperText>Add a photo</FormControlHelperText>
          </FormControlHelper>
          <FormControlError>
            <FormControlErrorIcon as={AlertCircle} />
            <FormControlErrorText>Your photo is needed</FormControlErrorText>
          </FormControlError>
        </FormControl>
        {/*TODO: utiliser une librairie du style classnames cx()*/}
        <Button
          className={`mt-10 ${isSubmitting ? "opacity-50" : ""}`}
          size="sm"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <ButtonText>Submit</ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
}
