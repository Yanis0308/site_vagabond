import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSession } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const { signOut } = useSession();

  return (
    <Box className={"flex h-full w-full items-center justify-center gap-4"}>
      <Text>Welcome !</Text>
      <Button>
        <ButtonText onPress={signOut}>Sign out</ButtonText>
      </Button>
    </Box>
  );
}
