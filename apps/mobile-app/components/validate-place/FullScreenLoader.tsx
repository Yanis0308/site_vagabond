import { useAtomValue } from "jotai";
import { memo } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Spinner } from "@/components/ui/spinner";
import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";

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
          <CustomText className="mt-4 text-center font-medium text-gray-700">
            {"Chargement..."}
          </CustomText>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
});

FullScreenLoader.displayName = "FullScreenLoader";
