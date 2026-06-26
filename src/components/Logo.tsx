import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  iconOnly = false,
  size = "md",
}) => {
  const dimensions = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Icon Graphic */}
      <div className={`${dimensions[size]} shrink-0`}>
        <img src="/logo.png" alt="Fix Hunger" className="w-full h-full object-contain" />
      </div>

      {/* HTML Branding Text */}
      {!iconOnly && (
        <span className={`font-bold tracking-tight select-none ${textSizes[size]}`}>
          <span className="text-[#68A14E] font-extrabold">Fix </span>
          <span className="text-foreground">Hunger</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
