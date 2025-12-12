import { Stack } from "expo-router";
import { type ReactElement } from "react";

export default function NotFoundScreen(): ReactElement {
  //TODO: ajouter un bouton pour retourner à la homepage
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
    </>
  );
}
