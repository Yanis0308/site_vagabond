import { ajvResolver } from "@hookform/resolvers/ajv";
import {
  allJsonSchemas,
  type CreateVisitedPoiRequest,
  CreateVisitedPoiRequestSchema,
} from "@vagabond/shared-utils";
import { type JSONSchemaType } from "ajv";
import { useSetAtom } from "jotai";
import React, { useEffect } from "react";
import { Controller, type ControllerProps, useForm } from "react-hook-form";
import { View } from "react-native";

import { StarRating } from "@/components/validate-place/StarRating";
import { useValidatePlaceMutation } from "@/hooks/mutations/useValidatePlaceMutation";
import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

import { CustomText } from "../custom-ui/CustomText";
import { CustomTextarea } from "../custom-ui/CustomTextarea";
import { PolaroidForm } from "../polaroid/PolaroidForm";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";

interface ReviewStepProps {
  place: PoiType;
  capturedImage: string;
  imageKey: string | null;
  setReviewFormEnded: (value: boolean) => void;
  isUploading: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  place,
  capturedImage,
  imageKey,
  isUploading,
  setReviewFormEnded,
}) => {
  const userLocation = useUserLocation();
  const validatePlace = useValidatePlaceMutation();
  const setDisplayingLoader = useSetAtom(displayingLoaderAtom);

  const {
    control,
    setValue,
    register,
    watch,
    setFocus,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVisitedPoiRequest>({
    resolver: ajvResolver(
      CreateVisitedPoiRequestSchema as JSONSchemaType<CreateVisitedPoiRequest>,
      {
        addUsedSchema: false,
        schemas: allJsonSchemas,
      },
    ),
    mode: "all",
    defaultValues: {
      rating: 0,
      comment: "",
      imageKey: "",
      coords: {
        latitude: 0,
        longitude: 0,
      },
    },
  });

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

  const onSubmit = async (data: CreateVisitedPoiRequest): Promise<void> => {
    // Data is already validated by the resolver
    try {
      setDisplayingLoader(true);
      await validatePlace.mutateAsync({
        placeId: place.id,
        imageKey: data.imageKey,
        rating: data.rating,
        comment: data.comment,
        coords: data.coords,
      });

      setReviewFormEnded(true);
    } catch (error) {
      logger("=== FORM ON SUBMIT ERROR ===", error);
    } finally {
      setDisplayingLoader(false);
    }
  };

  const onError = (formErrors: Record<string, unknown>): void => {
    logger("=== FORM VALIDATION ERROR ===", formErrors);
  };

  const renderRating = ({
    field: { value, onChange },
  }: Parameters<
    ControllerProps<CreateVisitedPoiRequest, "rating">["render"]
  >[0]): React.ReactElement => (
    <Box className="flex flex-col items-center gap-2 pt-8">
      <CustomText type="rating" className="text-rust-600">
        {"Notez votre expérience :"}
      </CustomText>
      <StarRating rating={value} onChange={onChange} />
    </Box>
  );

  const renderComment = ({
    field,
    fieldState,
  }: Parameters<
    ControllerProps<CreateVisitedPoiRequest, "comment">["render"]
  >[0]): React.ReactElement => {
    return (
      <CustomTextarea
        placeholder={
          "Laissez un commentaire (facultatif) pour les prochains vagabonds !"
        }
        isInvalid={fieldState.invalid}
        {...field}
      />
    );
  };

  return (
    <View className="flex flex-1">
      {/* Étape validation */}
      <View className="flex items-center">
        <PolaroidForm imageUrl={capturedImage} title={place.name} />
      </View>
      <Box className="mx-8 mb-12 flex flex-col items-center gap-6">
        <Controller control={control} name="rating" render={renderRating} />
        {errors.rating !== undefined && (
          <CustomText className="text-sm text-red-600">
            {"Veuillez sélectionner une note"}
          </CustomText>
        )}
        <Controller control={control} name="comment" render={renderComment} />
        {errors.comment !== undefined && (
          <CustomText className="text-sm text-red-600">
            {"Veuillez entrer un commentaire (facultatif)"}
          </CustomText>
        )}
        {isUploading && (
          <Box className="flex flex-row items-center gap-2 rounded-lg bg-primary-100 px-4 py-3">
            <CustomText className="text-sm text-primary-600">
              {"📤 Envoi de la photo en cours..."}
            </CustomText>
          </Box>
        )}
        {errors.coords !== undefined && (
          <Box className="flex flex-row items-center gap-2 rounded-lg bg-red-100 px-4 py-3">
            <CustomText className="text-sm text-red-600">
              {"Position GPS requise"}
            </CustomText>
          </Box>
        )}
        <Button
          onPress={handleSubmit(onSubmit, onError)}
          action="submit"
          isDisabled={isSubmitting}
        >
          <ButtonText>
            {isSubmitting ? "⏳ Envoi en cours..." : "✨ Valider le lieu"}
          </ButtonText>
        </Button>
      </Box>
    </View>
  );
};

ReviewStep.displayName = "ReviewStep";
