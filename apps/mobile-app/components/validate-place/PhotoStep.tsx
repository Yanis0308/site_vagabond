import { CameraView } from "expo-camera";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { useSetAtom } from "jotai";
import React, { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";

import { CustomText } from "../custom-ui/CustomText";
import { GalleryIcon } from "../icons/GalleryIcon";
import { SwitchCameraIcon } from "../icons/SwitchCameraIcon";
import { TakePhotoIcon } from "../icons/TakePhotoIcon";
import { themeColors } from "../ui/gluestack-ui-provider/config";
import { Pressable } from "../ui/pressable";
import { View } from "../ui/view";
import { type CameraPermission } from "./types";

interface PhotoStepProps {
  cameraPermission: CameraPermission | null;
  onPhotoTaken: (imageUri: string) => void;
}

export const PhotoStep: React.FC<PhotoStepProps> = React.memo(
  ({ cameraPermission, onPhotoTaken }) => {
    const cameraRef = useRef<CameraView | null>(null);
    const [isSelfie, setIsSelfie] = useState(false);
    const setDisplayingLoader = useSetAtom(displayingLoaderAtom);

    const switchCamera = useCallback((): void => {
      setIsSelfie((current) => !current);
    }, []);

    const takePicture = useCallback(async (): Promise<void> => {
      if (cameraRef.current === null) return;

      setDisplayingLoader(true);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          shutterSound: false,
        });

        setDisplayingLoader(false);

        // Navigate immediately with the photo
        onPhotoTaken(photo.uri);
      } catch (error) {
        logger("Error taking picture:", error);
        Alert.alert("Erreur", "Impossible de prendre la photo");
        setDisplayingLoader(false);
      }
    }, [cameraRef, onPhotoTaken, setDisplayingLoader]);

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

        // Navigate immediately with the photo
        onPhotoTaken(asset.uri);
      }
    }, [onPhotoTaken]);

    const handleCenterButton = useCallback((): void => {
      void takePicture();
    }, [takePicture]);

    const handlePickFromGallery = useCallback((): void => {
      void pickFromGallery();
    }, [pickFromGallery]);

    return (
      <View className="flex-1 items-center justify-between">
        {/* Camera */}
        <View
          className={cn(
            !Device.isDevice && "border",
            "border-white max-h-[75vh] aspect-[3/4]",
          )}
        >
          {cameraPermission?.granted === true ? (
            <CameraView
              ref={cameraRef}
              facing={isSelfie ? "front" : "back"}
              mirror={isSelfie}
              animateShutter={false}
              ratio="4:3" // Try to use 4:3 ratio but that's not working on all devices
              style={{
                aspectRatio: "3/4",
                width: "100%",
                borderWidth: Device.isDevice ? 0 : 1,
                borderColor: "purple",
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <CustomText className="mt-4 px-4 text-center text-white">
                {"Give me permission"}
              </CustomText>
            </View>
          )}
        </View>

        {/* Bottom buttons */}
        <View className="flex w-full flex-1 justify-center">
          <View className="my-10 flex flex-row items-center justify-around">
            {/* Gallery button */}
            <Pressable
              onPress={handlePickFromGallery}
              className="rounded-full border-2 border-primary-100 bg-skyBlue-50 p-2"
            >
              <GalleryIcon size={40} />
            </Pressable>

            {/* Take photo button */}
            <Pressable
              onPress={handleCenterButton}
              className="rounded-full border-4 border-skyBlue-50 bg-primary-400 p-0.5"
            >
              <TakePhotoIcon size={75} color={themeColors.skyBlue["50"].hex} />
            </Pressable>

            {/* Switch camera button */}
            <Pressable
              onPress={switchCamera}
              className="rounded-full border-2 border-primary-100 bg-skyBlue-50 p-2"
            >
              <SwitchCameraIcon size={40} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  },
);

PhotoStep.displayName = "PhotoStep";
