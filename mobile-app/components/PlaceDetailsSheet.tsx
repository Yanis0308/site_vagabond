import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { PlaceType } from "@/http/places";
import { ValidatedPlaceType } from "@/http/validate-place";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PlaceDetailsSheetV2Props = {
  place: PlaceType | null;
  validatedPlace: ValidatedPlaceType | null;
  onPressLink: () => void;
};

export const PlaceDetailsSheet = ({
  place,
  validatedPlace,
  onPressLink,
}: PlaceDetailsSheetV2Props) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [randomParagraph, setRandomParagraph] = useState("randPhrase()");

  useEffect(() => {
    if (place !== null) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.close();
    }
  }, [place]);

  const snapPoints = useMemo(() => ["15%", "80%"], []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  //TODO: utiliser le BottomSheet classique plutôt que la Modal pour éviter des Mount / Unmount ? La modal sert à en empiler plusieurs uniquement il me semble
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      style={{ marginHorizontal: 10 }}
      enablePanDownToClose={false}
    >
      <BottomSheetScrollView>
        <VStack className="w-full gap-5 px-5 pb-10">
          <Center className={"gap-5"}>
            <Heading size={"2xl"} className={"text-center"}>
              🏛️ {place?.title}
            </Heading>
            <Image
              size="2xl"
              source={`https://picsum.photos/seed/${place?.id}/1000/1000`}
              alt="Place photo illustration"
            />
            {validatedPlace !== null ? null : (
              <Button onPress={onPressLink}>
                <ButtonText>📍 J'y suis !</ButtonText>
              </Button>
            )}
          </Center>
          <Text size={"lg"}>{place?.description}</Text>
          {validatedPlace !== null ? (
            <VStack className={"items-center gap-1"}>
              <Heading size={"xl"}>Your photo :</Heading>
              <Image
                size="2xl"
                source={`${validatedPlace.photo.formats.large.url}`}
                alt="Place photo illustration"
              />
            </VStack>
          ) : null}
        </VStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};
