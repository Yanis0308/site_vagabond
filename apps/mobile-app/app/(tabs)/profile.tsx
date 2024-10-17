import { ReactElement } from "react";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSession } from "@/contexts/AuthContext";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function HomeScreen(): ReactElement {
  const { signOut } = useSession();

  return (
    <Box className={"flex size-full items-center justify-center gap-4"}>
      <Text>Welcome !</Text>
      <Button>
        <ButtonText onPress={signOut}>Sign out</ButtonText>
      </Button>
    </Box>
  );
}
