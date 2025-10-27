import { ajvResolver } from "@hookform/resolvers/ajv";
import { type Static } from "@sinclair/typebox";
import { jsonSchemas } from "@vagabond/shared-utils";
import { type JSONSchemaType } from "ajv";
import { useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo } from "react";
import { Controller, type ControllerProps, useForm } from "react-hook-form";
import { View } from "react-native";

import { StarRating } from "@/components/validate-place/StarRating";
import { useValidatePlaceMutation } from "@/hooks/mutations/useValidatePlaceMutation";
import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";
import { logger } from "@/utils/logger";

import { CustomText } from "../custom-ui/CustomText";
import { CustomTextarea } from "../custom-ui/CustomTextarea";
import { PolaroidForm } from "../polaroid/PolaroidForm";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import { type Place } from "./types";

interface ReviewStepProps {
  place: Place;
  capturedImage: string;
  imageKey: string | null;
  setReviewFormEnded: (value: boolean) => void;
  isUploading: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = React.memo(
  ({ place, capturedImage, imageKey, isUploading, setReviewFormEnded }) => {
    const userLocation = useUserLocation();
    const validatePlace = useValidatePlaceMutation();
    const setDisplayingLoader = useSetAtom(displayingLoaderAtom);

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
    // eslint-disable-next-line react-hooks/incompatible-library -- forced to
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
      if (imageKey !== null) {
        setValue("imageKey", imageKey);
      }
    }, [register, setValue, imageKey]);

    useEffect(() => {
      register("coords");
      setValue(
        "coords",
        userLocation === null
          ? {
              latitude: 0,
              longitude: 0,
            }
          : {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
      );
    }, [register, setValue, userLocation]);

    useEffect(() => {
      setDisplayingLoader(isSubmitting);
    }, [isSubmitting, setDisplayingLoader]);

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

            // Reset loader before closing the modal to prevent it from staying visible
            setDisplayingLoader(false);
            setReviewFormEnded(true);
          } catch (error) {
            // Important: ne pas re-throw l'erreur pour que handleSubmit puisse reset isSubmitting
            logger("=== FORM ON SUBMIT ERROR ===", error);
            // Reset loader on error too
            setDisplayingLoader(false);
          }
        },
      )();
    }, [
      handleSubmit,
      validatePlace,
      place.id,
      setReviewFormEnded,
      setDisplayingLoader,
    ]);

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
          <PolaroidForm
            imageUrl={capturedImage}
            title={place.data[0]?.name ?? ""}
          />
        </View>
        <Box className="mx-8 mb-12 flex flex-col items-center gap-6">
          <Controller control={control} name="rating" render={renderRating} />
          <Controller control={control} name="comment" render={renderComment} />
          {isUploading && (
            <Box className="flex flex-row items-center gap-2 rounded-lg bg-primary-100 px-4 py-3">
              <CustomText className="text-sm text-primary-600">
                {"📤 Envoi de la photo en cours..."}
              </CustomText>
            </Box>
          )}
          <Button
            onPress={onSubmit}
            action="submit"
            isDisabled={!isValid || isSubmitting || isUploading}
          >
            <ButtonText>{"✨ Valider le lieu"}</ButtonText>
          </Button>
        </Box>
      </View>
    );
  },
);

ReviewStep.displayName = "ReviewStep";
