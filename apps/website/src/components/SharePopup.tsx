"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { ShareContent } from "./ShareContent";

interface SharePopupProps {
  onClose: () => void;
  lng: string;
  city: string;
}

export const SharePopup = ({ onClose, lng, city }: SharePopupProps) => {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");

    return (): void => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <ShareContent lng={lng} onClose={onClose} city={city} />
    </div>,
    document.body,
  );
};
