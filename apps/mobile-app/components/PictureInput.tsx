import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Images } from "lucide-react-native";
import { memo, ReactElement, useMemo, useState } from "react";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { UploadFileParams } from "@/hooks/mutations/useUploadFileMutation";
import { logger } from "@/utils/logger";

interface PictureInputProps {
  //TODO: problème de typage du watch
  currentImageInfo: UploadFileParams | undefined;
  setImageInfo: (newImageInfo: UploadFileParams) => void;
  resetImage: () => void;
}

export const PictureInput = memo(
  ({
    currentImageInfo,
    setImageInfo,
    resetImage,
  }: PictureInputProps): ReactElement => {
    const [showModal, setShowModal] = useState(false);

    const openCamera = async (): Promise<void> => {
      await ImagePicker.requestCameraPermissionsAsync();

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      logger(result);

      if (!result.canceled && result.assets[0] !== undefined) {
        setImageInfo(result.assets[0]);
        setShowModal(false);
      }
    };

    const pickImage = async (): Promise<void> => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      logger(result);

      if (!result.canceled && result.assets[0] !== undefined) {
        setImageInfo(result.assets[0]);
        setShowModal(false);
      }
    };

    const source = useMemo(
      () => ({ uri: currentImageInfo?.uri }),
      [currentImageInfo?.uri],
    );

    return (
      <Box className={"h-full flex-1"}>
        <Pressable
          //eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPress={() => {
            setShowModal(true);
          }}
          disabled={currentImageInfo !== undefined}
        >
          <VStack
            className={
              "h-52 flex-1 flex-col items-center justify-center rounded border border-gray-300"
            }
          >
            {currentImageInfo === undefined ? (
              <>
                <Icon
                  className="h-32 w-full text-typography-500"
                  as={ImagePlus}
                />
                <Text size={"2xl"} className={"text-typography-500"}>
                  Add your photo
                </Text>
              </>
            ) : (
              <>
                <CustomImage
                  source={source}
                  alt={"your image"}
                  resizeMode={"contain"}
                  className={"size-full"}
                />
                <Button onPress={resetImage}>
                  <ButtonText>Remove photo</ButtonText>
                </Button>
              </>
            )}
          </VStack>
        </Pressable>
        <Modal
          isOpen={showModal}
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onClose={(): void => {
            setShowModal(false);
          }}
        >
          <ModalBackdrop />
          <ModalContent>
            <ModalBody>
              <VStack className={"gap-4"}>
                <Button className={"gap-2"} onPress={void openCamera}>
                  <ButtonIcon as={Camera} />
                  <ButtonText className={""}>Open camera</ButtonText>
                </Button>
                <Button className={"gap-2"} onPress={void pickImage}>
                  <ButtonIcon as={Images} className="mr-2" />
                  <ButtonText className={"pl-4"}>Open gallery</ButtonText>
                </Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    );
  },
);

PictureInput.displayName = "PictureInput";
