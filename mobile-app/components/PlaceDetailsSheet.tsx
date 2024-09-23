import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetIcon
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Place } from "@/components/PlaceMarker";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";

type PlaceDetailsSheetProps = {
  place: Place | null,
  handleClose: () => void
}
export const PlaceDetailsSheet = ({place, handleClose}: PlaceDetailsSheetProps) => {
  return (
    <Actionsheet
      isOpen={place !== null}
      onClose={handleClose}
      snapPoints={[80]}
    >
        <ActionsheetBackdrop />
        <ActionsheetContent className="">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full pt-5">
            <HStack space="md" className="justify-center items-center">
              <VStack className="flex-1">
                <Text className="font-bold">Mastercard</Text>
                <Text>Card ending in 2345</Text>
              </VStack>
            </HStack>
          </VStack>
        </ActionsheetContent>
    </Actionsheet>
  );
};
