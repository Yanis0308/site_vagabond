import { FontAwesome6 } from "@expo/vector-icons";
import {
  type CameraPictureOptions,
  type CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import {
  type ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";

import { logger } from "@/utils/logger";

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function CameraTest(): ReactElement {
  const { t } = useTranslation("common");
  // Tous les hooks doivent être appelés au début, sans condition
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");

  const onPressRequestPermission = useCallback(
    () => void requestPermission(),
    [requestPermission],
  );

  // Hooks pour les sources d'image et gestionnaires d'événements
  const imageSource = useMemo(() => ({ uri }), [uri]);
  const onPressTakeAnotherPicture = useCallback(() => {
    setUri(null);
  }, []);

  const cameraPictureOptions = useMemo<CameraPictureOptions>(
    () => ({
      shutterSound: true,
      // imageType: "jpg",
      // quality: 0,
      // base64: true,
      exif: true,
    }),
    [],
  );

  const takePicture = useCallback(async (): Promise<void> => {
    const photo = await ref.current?.takePictureAsync(cameraPictureOptions);
    if (photo?.uri !== undefined) {
      setUri(photo.uri);
      await MediaLibrary.saveToLibraryAsync(photo.uri);
    }
  }, [cameraPictureOptions]);

  const takePictureWithoutProcessing = useCallback(async (): Promise<void> => {
    const photo = await ref.current?.takePictureAsync({
      ...cameraPictureOptions,
      skipProcessing: true,
    });
    if (photo?.uri !== undefined) {
      setUri(photo.uri);
      await MediaLibrary.saveToLibraryAsync(photo.uri);
    }
  }, [cameraPictureOptions]);

  const toggleFacing = useCallback((): void => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const onPress = useCallback(() => void takePicture(), [takePicture]);
  const _onPress = useCallback(
    () => void takePictureWithoutProcessing(),
    [takePictureWithoutProcessing],
  );

  // Rendu conditionnel basé sur l'état des permissions
  if (permission === null) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          Chargement des permissions...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          {t("camera_permission_required")}
        </Text>
        <Button
          onPress={onPressRequestPermission}
          title="Accorder la permission"
        />
      </View>
    );
  }

  // Fonction de rendu de l'image prise
  const renderPicture = (): ReactElement => {
    return (
      <View>
        <Image
          source={imageSource}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button
          onPress={onPressTakeAnotherPicture}
          title="Prendre une autre photo"
        />
      </View>
    );
  };

  // Fonction de rendu de la caméra
  const renderCamera = (): ReactElement => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={"picture"}
        facing={facing}
        ratio="4:3"
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <Pressable onPress={onPress}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: "white",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <Pressable onPress={_onPress}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: "grey",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="rotate-left" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };

  logger(uri);

  // Déterminer si nous devrions afficher l'image ou la caméra
  const shouldShowPicture = typeof uri === "string" && uri.length > 0;

  return (
    <View style={styles.container}>
      {shouldShowPicture ? renderPicture() : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
});
