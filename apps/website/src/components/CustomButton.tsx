"use client";

interface CustomButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
}

export const CustomButton = ({
  onClick,
  children,
  variant = "primary",
  className = "",
  ariaLabel,
  icon,
  hideOnMobile = false,
  hideOnDesktop = false,
  showTooltip = false,
  tooltipText = "",
}: CustomButtonProps) => {
  const baseClasses =
    "flex w-full items-center justify-center rounded-lg px-4 py-2 text-center";

  const variantClasses = {
    primary: "animate-bounce bg-primary-500 text-white hover:bg-primary-600",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    outline:
      "border border-primary-500 bg-white text-primary-500 hover:bg-primary-50",
  };

  const visibilityClasses = [];
  if (hideOnMobile) visibilityClasses.push("hidden md:flex");
  if (hideOnDesktop) visibilityClasses.push("md:hidden");

  const buttonClasses = [baseClasses, variantClasses[variant], className].join(
    " ",
  );

  const divClasses = ["relative", ...visibilityClasses].join(" ");

  return (
    <div className={divClasses}>
      <button
        onClick={onClick}
        className={buttonClasses}
        aria-label={ariaLabel}
      >
        {icon !== undefined && <span className="mr-2 size-5">{icon}</span>}
        {children}
      </button>

      {showTooltip && tooltipText !== "" && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-sm text-white">
          {tooltipText}
          <div className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
};
