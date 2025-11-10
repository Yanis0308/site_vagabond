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

    const { control, setValue, register, watch, setFocus, getValues } = useForm<
      Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema>
    >(
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
    // eslint-disable-next-line react-hooks/incompatible-library -- needed for dynamic UI updates
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
      if (imageKey !== null && imageKey !== "") {
        setValue("imageKey", imageKey, { shouldValidate: true });
      }
    }, [register, setValue, imageKey]);

    useEffect(() => {
      register("coords");
      if (userLocation !== null) {
        setValue(
          "coords",
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          { shouldValidate: true },
        );
      }
    }, [register, setValue, userLocation]);

    const onSubmit = useCallback(async () => {
      if (imageKey === null || imageKey === "" || userLocation === null) {
        logger("=== FORM VALIDATION ERROR ===", {
          imageKey,
          userLocation,
        });
        return;
      }

      const formValues = getValues();
      const currentRating = formValues.rating;
      const currentComment = formValues.comment;

      if (
        currentRating === undefined ||
        currentRating === 0 ||
        currentRating < 1
      ) {
        logger("=== INVALID RATING ===", currentRating);
        return;
      }

      try {
        setDisplayingLoader(true);
        await validatePlace.mutateAsync({
          placeId: place.id,
          imageKey: imageKey,
          rating: currentRating,
          comment:
            currentComment === undefined || currentComment === ""
              ? ""
              : currentComment,
          coords: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        });

        setDisplayingLoader(false);
        setReviewFormEnded(true);
      } catch (error) {
        logger("=== FORM ON SUBMIT ERROR ===", error);
        setDisplayingLoader(false);
      }
    }, [
      imageKey,
      userLocation,
      getValues,
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
        <Box className="flex flex-col items-center gap-2 pt-8">
          <CustomText type="rating" className="text-rust-600">
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
            isDisabled={
              isUploading ||
              imageKey === null ||
              imageKey === "" ||
              ratingValue === undefined ||
              ratingValue < 1
            }
          >
            <ButtonText>{"✨ Valider le lieu"}</ButtonText>
          </Button>
        </Box>
      </View>
    );
  },
);

ReviewStep.displayName = "ReviewStep";
