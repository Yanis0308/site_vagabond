import { ajvResolver } from "@hookform/resolvers/ajv";
import { allJsonSchemas, type ImageSource } from "@vagabond/shared-utils";
import { type JSONSchemaType } from "ajv";
import { useSetAtom } from "jotai";
import React from "react";
import { Controller, type ControllerProps, useForm } from "react-hook-form";
import { View } from "react-native";
import { type Static, Type } from "typebox";

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

const ReviewFormDataSchema = Type.Object({
  rating: Type.Number({ minimum: 1, maximum: 5 }),
  comment: Type.String(),
});

type ReviewFormData = Static<typeof ReviewFormDataSchema>;

interface ReviewStepProps {
  place: PoiType;
  capturedImage: string;
  imageSource: ImageSource;
  onValidated: (visitedPoiId: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  place,
  capturedImage,
  imageSource,
  onValidated,
}) => {
  const { simplifiedLocation } = useUserLocation();
  const validatePlace = useValidatePlaceMutation();
  const setDisplayingLoader = useSetAtom(displayingLoaderAtom);

  const {
    control,
    watch,
    setFocus,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: ajvResolver(
      ReviewFormDataSchema as JSONSchemaType<ReviewFormData>,
      {
        addUsedSchema: false,
        schemas: allJsonSchemas,
      },
    ),
    mode: "all",
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  // Watch rating value to conditionally show comment field
  const ratingValue = watch("rating");

  // Auto focus comment field when rating is selected
  React.useEffect(() => {
    if (ratingValue > 0) {
      setTimeout(() => {
        setFocus("comment");
      }, 100);
    }
  }, [ratingValue, setFocus]);

  const onSubmit = async (data: ReviewFormData): Promise<void> => {
    try {
      setDisplayingLoader(true);
      const { id: visitedPoiId } = await validatePlace.mutateAsync({
        placeId: place.id,
        imageSource,
        rating: data.rating,
        comment: data.comment,
        coords: simplifiedLocation ?? { latitude: 0, longitude: 0 },
      });

      onValidated(visitedPoiId);
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
    ControllerProps<ReviewFormData, "rating">["render"]
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
    ControllerProps<ReviewFormData, "comment">["render"]
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

  const isSubmitDisabled = isSubmitting;

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
        <Button
          onPress={handleSubmit(onSubmit, onError)}
          action="submit"
          isDisabled={isSubmitDisabled}
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
