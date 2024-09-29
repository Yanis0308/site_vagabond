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
import { placesData } from "@/constants/Places";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

type PlaceDetailsProps = {};

const ValidatePlaceSchema = z.object({
  position: z.object({ lat: z.number(), lng: z.number() }),
  imageUrl: z.string().url(),
});

type ValidatePlaceType = z.infer<typeof ValidatePlaceSchema>;
type ValidatePlacePartial = Partial<z.infer<typeof ValidatePlaceSchema>>;

export default function PlaceDetails({}: PlaceDetailsProps) {
  const { place: placeId } = useLocalSearchParams<{ place: string }>();
  const place = placesData.data.find(
    (placeElement) => `${placeElement.id}` === placeId,
  );

  if (place === undefined) {
    return (
      <Box>
        <Text>Error - Missing place</Text>
      </Box>
    );
  }

  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    resetField,
  } = useForm<ValidatePlaceType>({
    resolver: zodResolver(ValidatePlaceSchema),
    mode: "all",
    defaultValues: { imageUrl: undefined },
  });

  const onSubmit = (data: ValidatePlaceType) => {
    console.log("submiting with ", data);
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
  }, []);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (watch("position") !== undefined) {
    text = JSON.stringify(watch("position"));
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
            name="imageUrl"
            render={({ field: { value, onChange } }) => (
              <PictureInput
                currentImage={value}
                setImage={(newImage: string) => {
                  onChange(newImage);
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

        <Button className="mt-10" size="sm" onPress={handleSubmit(onSubmit)}>
          <ButtonText>Submit</ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
}
