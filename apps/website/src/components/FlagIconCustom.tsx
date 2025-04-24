import { FlagIcon, type FlagIconCode } from "react-flag-kit";

export const FlagIconCustom = ({
  code,
  size,
  className = "",
}: {
  code: string;
  size: number;
  className?: string;
}): React.JSX.Element => (
  <FlagIcon
    className={className + " border border-gray-200 shrink-0 inline-block"}
    code={code as FlagIconCode}
    size={size}
  />
);
