import React, { type ReactElement, useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { InitialStep } from "@/components/app-review/InitialStep";
import { NegativeStep } from "@/components/app-review/NegativeStep";
import { Modal, ModalBackdrop } from "@/components/ui/modal";
import { useAppReviewMutation } from "@/hooks/mutations/useAppReviewMutation";
import { logger } from "@/utils/logger";

interface AppReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

type ModalStep = "initial" | "negative";

async function tryRequestStoreReview(): Promise<void> {
  try {
    const StoreReview = await import("expo-store-review");
    if (
      typeof StoreReview.hasAction !== "function" ||
      typeof StoreReview.isAvailableAsync !== "function" ||
      typeof StoreReview.requestReview !== "function"
    ) {
      // Native module not available (simulator / Expo Go / old build)
      return;
    }
    const isAvailable =
      (await StoreReview.hasAction()) && (await StoreReview.isAvailableAsync());
    if (isAvailable) {
      await StoreReview.requestReview();
    }
  } catch (error: unknown) {
    logger("StoreReview error:", error);
  }
}

export const AppReviewModal = ({
  visible,
  onClose,
}: AppReviewModalProps): ReactElement => {
  const [step, setStep] = useState<ModalStep>("initial");
  const [comment, setComment] = useState<string>("");
  const mutation = useAppReviewMutation();

  const { height } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value / 2 }],
  }));

  const handleReset = (): void => {
    setStep("initial");
    setComment("");
  };

  const handleClose = (): void => {
    handleReset();
    onClose();
  };

  const handleThumbsUp = (): void => {
    mutation.mutate(
      { positive: true, comment: null },
      {
        onSuccess: () => {
          handleClose();
          void tryRequestStoreReview();
        },
        onError: (error) => {
          logger("AppReview mutation error:", error);
          handleClose();
        },
      },
    );
  };

  const handleThumbsDownSubmit = (): void => {
    mutation.mutate(
      { positive: false, comment: comment.trim() },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (error) => {
          logger("AppReview mutation error:", error);
          handleClose();
        },
      },
    );
  };

  return (
    <Modal isOpen={visible} size="full">
      <ModalBackdrop onPress={Keyboard.dismiss} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          className="w-full max-w-[85%] rounded-3xl bg-background-100 px-4 py-6 shadow-lg"
          style={animatedStyle}
        >
          {step === "initial" ? (
            <InitialStep
              isPending={mutation.isPending}
              onThumbsUp={handleThumbsUp}
              onThumbsDown={() => {
                setStep("negative");
              }}
            />
          ) : (
            <NegativeStep
              isPending={mutation.isPending}
              comment={comment}
              onCommentChange={setComment}
              onSubmit={handleThumbsDownSubmit}
              onBack={handleReset}
            />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

AppReviewModal.displayName = "AppReviewModal";
