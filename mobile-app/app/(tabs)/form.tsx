import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { router } from "expo-router";

export default function MapsTab() {
  const goDetails = () => {
    router.push({
      pathname: "/place-details/[place]",
      params: { place: "33" },
    });
  };

  goDetails();

  return (
    <Box className={"flex-1 justify-end"}>
      <Button onPress={goDetails}>
        <ButtonText>Go to place 33</ButtonText>
      </Button>
    </Box>
  );
}
