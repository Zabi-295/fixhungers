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
    lg: "w-14 h-14",
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${dimensions[size]} rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-[80%] h-[80%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="36" stroke="url(#logoPrimary)" strokeWidth="6" fill="none" strokeDasharray="170 50" strokeLinecap="round" transform="rotate(-45 50 50)" />
          <path d="M30 55 C30 68, 70 68, 70 55 C65 55, 35 55, 30 55 Z" fill="url(#logoPrimary)" />
          <path d="M50 32 C50 32, 43 25, 37 31 C31 37, 44 49, 50 53 C56 49, 69 37, 63 31 C57 25, 50 32, 50 32 Z" fill="url(#logoAccent)" />
          <path d="M68 24 L70 27 L73 27 L71 29 L72 32 L70 30 L68 32 L69 29 L67 27 L68 27 Z" fill="#F59E0B" />
        </svg>
      </div>
      {!iconOnly && (
        <span className={`font-bold text-foreground tracking-tight select-none ${textSizes[size]}`}>
          <span className="text-primary font-extrabold">Fix</span>
          <span className="text-foreground">Hunger</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
