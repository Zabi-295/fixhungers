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
          className="w-[85%] h-[85%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="logoWarm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          
          {/* Cradling Hand */}
          <path d="M 22,58 C 22,72, 38,82, 50,82 C 62,82, 78,72, 78,58 C 74,68, 62,74, 50,74 C 38,74, 26,68, 22,58 Z" fill="url(#logoPrimary)" />
          
          {/* Food Bowl */}
          <path d="M 30,50 C 30,64, 70,64, 70,50 Z" fill="url(#logoAccent)" />
          <rect x="26" y="46" width="48" height="4" rx="2" fill="url(#logoPrimary)" />
          
          {/* Heart Steam */}
          <path d="M 50,18 C 50,18, 43,10, 36,16 C 30,22, 43,36, 50,40 C 57,36, 70,22, 64,16 C 57,10, 50,18, 50,18 Z" fill="url(#logoWarm)" />
          
          {/* Sparkles */}
          <path d="M 72,22 L 74,25 L 77,25 L 75,27 L 76,30 L 74,28 L 72,30 L 73,27 L 71,25 L 72,25 Z" fill="#F59E0B" />
          <path d="M 24,30 L 25,32 L 27,32 L 25,33 L 26,35 L 24,34 L 22,35 L 23,33 L 21,32 L 23,32 Z" fill="#34D399" />
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
