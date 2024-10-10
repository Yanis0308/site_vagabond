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
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Images } from "lucide-react-native";
import { useState } from "react";

type PictureInputProps = {
  //TODO: problème de typage du watch
  currentImageInfo: UploadFileParams | undefined;
  setImageInfo: (newImageInfo: UploadFileParams) => void;
  resetImage: () => void;
};

export const PictureInput = ({
  currentImageInfo,
  setImageInfo,
  resetImage,
}: PictureInputProps) => {
  const [showModal, setShowModal] = useState(false);

  const openCamera = async () => {
    await ImagePicker.requestCameraPermissionsAsync();

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    console.log(result);

    if (!result.canceled && result.assets && result.assets[0] !== undefined) {
      setImageInfo(result.assets[0]);
      setShowModal(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    console.log(result);

    if (!result.canceled && result.assets && result.assets[0] !== undefined) {
      setImageInfo(result.assets[0]);
      setShowModal(false);
    }
  };

  return (
    <Box className={"h-full flex-1"}>
      <Pressable
        onPress={() => setShowModal(true)}
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
                source={{ uri: currentImageInfo.uri }}
                alt={"your image"}
                resizeMode={"contain"}
                className={"h-full w-full"}
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
        onClose={() => {
          setShowModal(false);
        }}
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalBody>
            <VStack className={"gap-4"}>
              <Button className={"gap-2"} onPress={openCamera}>
                <ButtonIcon as={Camera} />
                <ButtonText className={""}>Open camera</ButtonText>
              </Button>
              <Button className={"gap-2"} onPress={pickImage}>
                <ButtonIcon as={Images} className="mr-2" />
                <ButtonText className={"pl-4"}>Open gallery</ButtonText>
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
