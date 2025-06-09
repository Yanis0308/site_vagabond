import { ajvResolver } from "@hookform/resolvers/ajv";
import { usePreventRemove } from "@react-navigation/native";
import { type Static } from "@sinclair/typebox";
import { jsonSchemas } from "@vagabond/shared-utils";
import { type JSONSchemaType } from "ajv";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { Controller, type ControllerProps, useForm } from "react-hook-form";
import { Alert, View } from "react-native";

import { StarRating } from "@/components/validate-place/StarRating";
import { useValidatePlaceMutation } from "@/hooks/mutations/useValidatePlaceMutation";
import { logger } from "@/utils/logger";

import { CustomButton } from "../custom-ui/CustomButton";
import { CustomText } from "../custom-ui/CustomText";
import { CustomTextarea } from "../custom-ui/CustomTextarea";
import { Box } from "../ui/box";
import { PolaroidImage } from "./PolaroidImage";
import { type Place } from "./types";

interface ReviewStepProps {
  place: Place;
  capturedImage: string;
  position: {
    lat: number;
    lng: number;
  };
  imageKey: string;
  onGoBack: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = React.memo(
  ({ place, capturedImage, position, imageKey, setIsLoading, onGoBack }) => {
    const router = useRouter();
    const validatePlace = useValidatePlaceMutation();

    const {
      handleSubmit,
      formState: { isSubmitting, isValid },
      control,
      setValue,
      register,
      watch,
      setFocus,
    } = useForm<Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>>(
      useMemo(
        () => ({
          resolver: ajvResolver(
            jsonSchemas.CreateVisitedPoiRequestSchema as JSONSchemaType<
              Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>
            >,
            {
              addUsedSchema: false,
              schemas: jsonSchemas,
            },
          ),
          mode: "all",
          defaultValues: {
            comment: "",
          },
        }),
        [],
      ),
    );

    // Watch rating value to conditionally show comment field
    const ratingValue = watch("rating");

    // Auto focus comment field when rating is selected
    useEffect(() => {
      if (ratingValue > 0) {
        setTimeout(() => {
          setFocus("comment");
        }, 100);
      }
    }, [ratingValue, setFocus]);

    useEffect(() => {
      register("imageKey");
      setValue("imageKey", imageKey);
    }, [register, setValue, imageKey]);

    useEffect(() => {
      register("coords");
      setValue("coords", { latitude: position.lat, longitude: position.lng });
    }, [register, setValue, position]);

    useEffect(() => {
      setIsLoading(isSubmitting);
    }, [isSubmitting, setIsLoading]);

    const onSubmit = useCallback(() => {
      void handleSubmit(
        async (
          data: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>,
        ) => {
          try {
            await validatePlace.mutateAsync({
              placeId: place.id,
              imageKey: data.imageKey,
              rating: data.rating,
              comment: data.comment,
              coords: data.coords,
            });

            router.back();
          } catch (error) {
            // Important: ne pas re-throw l'erreur pour que handleSubmit puisse reset isSubmitting
            logger("=== FORM ON SUBMIT ERROR ===", error);
          }
        },
      )();
    }, [handleSubmit, validatePlace, place.id, router]);

    usePreventRemove(
      true,
      useCallback(() => {
        // Prompt the user before leaving the screen
        Alert.alert(
          "Discard changes?",
          "You have unsaved changes. Discard them and leave the screen?",
          [
            {
              text: "Don't leave",
              style: "cancel",
              onPress: (): void => {
                // Do nothing
              },
            },
            {
              text: "Discard",
              style: "destructive",
              onPress: (): void => {
                onGoBack();
              },
            },
          ],
        );
      }, [onGoBack]),
    );

    const renderRating = useCallback(
      ({
        field: { value, onChange },
      }: Parameters<
        ControllerProps<
          Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>,
          "rating"
        >["render"]
      >[0]) => (
        <Box className="flex flex-row items-center gap-2 pt-8">
          <CustomText type="rating" className="w-[70px] text-rust-600">
            {"Notez votre expérience :"}
          </CustomText>
          <StarRating rating={value} onChange={onChange} />
        </Box>
      ),
      [],
    );

    const renderComment = useCallback(
      ({
        field,
      }: Parameters<
        ControllerProps<
          Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>,
          "comment"
        >["render"]
      >[0]) => {
        return (
          <CustomTextarea
            placeholder={
              "Laissez un commentaire (facultatif) pour les prochains vagabonds !"
            }
            {...field}
          />
        );
      },
      [],
    );

    return (
      <View className="flex flex-1">
        {/* Étape validation */}
        <View className="flex items-center">
          <PolaroidImage
            imageUrl={capturedImage}
            title={place.data[0]?.name ?? ""}
          />
        </View>
        <Box className="mx-8 mb-8 flex flex-col items-center gap-6">
          <Controller control={control} name="rating" render={renderRating} />
          <Controller control={control} name="comment" render={renderComment} />
          <CustomButton
            label="✨ Valider le lieu"
            onPress={onSubmit}
            type="submit"
            isDisabled={!isValid || isSubmitting}
          />
        </Box>
      </View>
    );
  },
);

ReviewStep.displayName = "ReviewStep";
