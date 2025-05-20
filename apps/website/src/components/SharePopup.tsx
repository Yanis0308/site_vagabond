import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

import { ShareContent } from "./ShareContent";

interface SharePopupProps {
  onClose: () => void;
  lng: string;
}

export const SharePopup = ({ onClose, lng }: SharePopupProps): ReactNode => {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");

    return (): void => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <ShareContent lng={lng} onClose={onClose} />
    </div>,
    document.body,
  );
};
