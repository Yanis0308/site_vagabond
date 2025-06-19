import { useAtomValue } from "jotai";
import { memo } from "react";

import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { displayingLoaderAtom } from "@/stores/displayingLoader";

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
} from "../ui/alert-dialog";

export const FullScreenLoader = memo(() => {
  const displayingLoader = useAtomValue(displayingLoaderAtom);
  return (
    <AlertDialog isOpen={displayingLoader} size="sm">
      <AlertDialogBackdrop />
      <AlertDialogContent className="bg-white">
        <AlertDialogBody className="mb-4 mt-3">
          <Spinner size="large" className="text-primary-600" />
          <Text className="mt-4 text-center font-medium text-gray-700">
            {"Chargement..."}
          </Text>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
});

FullScreenLoader.displayName = "FullScreenLoader";
