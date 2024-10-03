import { Box } from "@/components/ui/box";
import { useSession } from "@/contexts/AuthContext";
import { useLoginMutation } from "@/hooks/mutations/useLoginMutation";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";

export default function SignInScreen() {
  const { isPending, mutate } = useLoginMutation();
  const { session } = useSession();

  console.log("=== in sign-in, session:", session);
  if (session !== null) {
    router.replace("/");
  }

  return (
    <Box className={"flex h-full w-full items-center justify-center gap-4"}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={() => {
          mutate();
        }}
        disabled={isPending}
      />
    </Box>
  );
}
