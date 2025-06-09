import { type CameraType, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Camera, FlipHorizontal, Folder, RotateCcw } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, Pressable, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useUploadFileMutation } from "@/hooks/mutations/useUploadFileMutation";
import { logger } from "@/utils/logger";

import { type CameraPermission, type ImageInfo, type Place } from "./types";

interface PhotoStepProps {
  place: Place;
  cameraPermission: CameraPermission | null;
  onPhotoTaken: (imageUri: string, uploadedFileId: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const PhotoStep: React.FC<PhotoStepProps> = React.memo(
  ({ place, cameraPermission, onPhotoTaken, setIsLoading }) => {
    const { t } = useTranslation("common");

    const cameraRef = useRef<CameraView | null>(null);
    const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
    const onCameraSwitch = useCallback((): void => {
      setCameraFacing((current) => (current === "back" ? "front" : "back"));
    }, []);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(true);

    const uploadFile = useUploadFileMutation();

    const source = useMemo(
      () => (capturedImage !== null ? { uri: capturedImage } : null),
      [capturedImage],
    );

    const uploadImage = useCallback(
      async (imageData: ImageInfo): Promise<string | null> => {
        setIsUploading(true);
        try {
          const fileInfo = await uploadFile.mutateAsync(imageData);
          logger("uploadedFileId", fileInfo);
          return fileInfo.key;
        } catch (error) {
          logger("Error uploading image:", error);
          Alert.alert("Erreur", "Impossible d'envoyer la photo");
          return null;
        } finally {
          setIsUploading(false);
        }
      },
      [uploadFile],
    );

    useEffect(() => {
      setIsLoading(isUploading);
    }, [isUploading, setIsLoading]);

    const takePicture = useCallback(async (): Promise<void> => {
      if (cameraRef.current === null) return;

      try {
        const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
        logger("sizes", sizes);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo !== undefined) {
          const imageData: ImageInfo = {
            uri: photo.uri,
            fileName: `photo_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
          };

          setCapturedImage(photo.uri);
          setShowCamera(false);

          const uploadedKey = await uploadImage(imageData);
          if (uploadedKey !== null) {
            onPhotoTaken(photo.uri, uploadedKey);
          }
        }
      } catch (error) {
        logger("Error taking picture:", error);
        Alert.alert("Erreur", "Impossible de prendre la photo");
      }
    }, [cameraRef, uploadImage, onPhotoTaken]);

    const pickFromGallery = useCallback(async (): Promise<void> => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin d'accéder à votre galerie",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
      });

      if (!result.canceled && result.assets[0] !== undefined) {
        const asset = result.assets[0];
        const imageData: ImageInfo = {
          uri: asset.uri,
          fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        };

        setCapturedImage(asset.uri);
        setShowCamera(false);

        const uploadedKey = await uploadImage(imageData);
        if (uploadedKey !== null) {
          onPhotoTaken(asset.uri, uploadedKey);
        }
      }
    }, [uploadImage, onPhotoTaken]);

    const handleCenterButton = useCallback((): void => {
      if (showCamera) {
        void takePicture();
      }
    }, [showCamera, takePicture]);

    const handleCameraSwitch = useCallback((): void => {
      if (capturedImage !== null) {
        setCapturedImage(null);
        setShowCamera(true);
      } else {
        onCameraSwitch();
      }
    }, [capturedImage, onCameraSwitch]);

    const centerButtonReady =
      showCamera || (capturedImage !== null && !isUploading);

    const onPress = useCallback((): void => {
      void pickFromGallery();
    }, [pickFromGallery]);

    return (
      <>
        {/* Carte postale - Étape photo */}
        <View className="mx-4 my-6 min-h-[600px] flex-1 overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Image principale ou caméra */}
          <View className="flex-1 bg-gray-100">
            {showCamera && cameraPermission?.granted === true ? (
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={cameraFacing}
                mirror={cameraFacing === "front"}
                // Try to use 4:3 ratio but that's not working on all devices
                ratio="4:3"
              />
            ) : capturedImage !== null && source !== null ? (
              <Image source={source} className="size-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Camera size={80} className="text-gray-400" />
                <Text className="mt-4 px-4 text-center text-gray-500">
                  {t("validate_place_description")}
                </Text>
              </View>
            )}

            {/* Overlay de chargement pendant l'upload */}
            {isUploading && (
              <View className="absolute inset-0 items-center justify-center bg-black-50">
                <View className="items-center rounded-lg bg-white p-6">
                  <Spinner size="large" className="text-primary-600" />
                  <Text className="mt-3 text-gray-700">
                    {t("uploading_photo")}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Informations du lieu */}
          <View className="bg-white p-6">
            <Text className="mb-2 text-center text-2xl font-bold text-gray-800">
              {place.data[0]?.name ?? "Lieu inconnu"}
            </Text>
            <Text className="text-center text-gray-600">
              {t("validate_place_date")}{" "}
              {new Date().toLocaleDateString("fr", {
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Boutons du bas - Étape photo */}
        <View className="flex-row items-center justify-around px-8 pb-8">
          {/* Bouton galerie */}
          <Pressable
            onPress={onPress}
            className="size-16 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <Folder size={24} className="text-primary-600" />
          </Pressable>

          {/* Bouton central */}
          <Button
            onPress={handleCenterButton}
            disabled={!centerButtonReady || isUploading}
            className={`size-20 rounded-full shadow-lg ${
              centerButtonReady && !isUploading ? "bg-white" : "bg-gray-300"
            }`}
          >
            <View
              className={`size-12 rounded-full ${
                centerButtonReady && !isUploading
                  ? "bg-primary-400"
                  : "bg-gray-400"
              }`}
            />
          </Button>

          {/* Bouton switch caméra/reset */}
          <Pressable
            onPress={handleCameraSwitch}
            className="size-16 items-center justify-center rounded-full bg-white shadow-lg"
          >
            {capturedImage !== null ? (
              <RotateCcw size={24} className="text-primary-600" />
            ) : (
              <FlipHorizontal size={24} className="text-primary-600" />
            )}
          </Pressable>
        </View>
      </>
    );
  },
);

PhotoStep.displayName = "PhotoStep";
