import { Place } from "@/components/PlaceMarker";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";

type PlaceDetailsSheetV2Props = {
  place: Place | null;
  // handleClose: () => void;
  onPressLink: () => void;
};

export const PlaceDetailsSheet = ({
  place,
  onPressLink,
}: PlaceDetailsSheetV2Props) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [randomParagraph, setRandomParagraph] = useState("randPhrase()");

  useEffect(() => {
    if (place !== null) {
      bottomSheetModalRef.current?.present();
    } else {
      // bottomSheetModalRef.current?.close();
    }
  }, [place]);

  // variables
  const snapPoints = useMemo(() => ["15%", "80%"], []);

  // callbacks
  // const handlePresentModalPress = useCallback(() => {
  //   bottomSheetModalRef.current?.present();
  // }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  // renders
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      detached
      bottomInset={10}
      style={{ marginHorizontal: 20 }}
      enablePanDownToClose={false}
    >
      <BottomSheetView style={styles.contentContainer}>
        <VStack className="w-full gap-5 px-10 pb-10">
          <Center className={"gap-5"}>
            <Heading size={"2xl"} className={"text-center"}>
              🏛️ {place?.attributes.title}
            </Heading>
            <Image
              size="2xl"
              source={{
                uri: `https://picsum.photos/seed/${place?.id}/1000/1000`,
              }}
              alt="Place photo illustration"
            />
            <Button onPress={onPressLink}>
              <ButtonText>Log the place</ButtonText>
            </Button>
          </Center>
          <Text size={"lg"}>
            {place?.attributes.description}
            {/*{randomParagraph}*/}
          </Text>
        </VStack>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
});
