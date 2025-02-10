import { Stack } from "expo-router";
import { type ReactElement } from "react";

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function NotFoundScreen(): ReactElement {
  //TODO: ajouter un bouton pour retourner à la homepage
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
    </>
  );
}
