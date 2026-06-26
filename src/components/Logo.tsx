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
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="49" fill="#FFFFFF" />

          {/* Outer circular border */}
          <circle cx="50" cy="50" r="46" stroke="#68A14E" strokeWidth="2.5" fill="none" />

          {/* Left Hand */}
          <g id="left-hand-inline" stroke="#68A14E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M 37,60 C 36,52 32,45 27,41 C 24,37 23,33 24,30 C 25,28 27,28 28.5,30 C 30.5,32.5 32.5,36 34,39" />
            <path d="M 28,40 C 27,32 27.5,24 29,19 C 29.8,16 31.2,16 32,19 C 33,23 34,30 34.5,34" />
            <path d="M 33.5,33 C 33,24 34.5,16 36,13 C 36.8,11 38.2,11 39,13 C 40,17 41,25 41,31" />
            <path d="M 40,30 C 40,22 41.5,15 43,12 C 43.8,10 45.2,10 46,12 C 47,16 47.5,24 47.5,30" />
            <path d="M 46.5,29 C 47,23 48.5,18 49.5,16 C 50.3,14.5 51.5,14.5 52,16 C 52.8,19 53,26 52,32 C 51,38 49,46 49,58" />
          </g>

          {/* Right Hand (Mirrored) */}
          <use href="#left-hand-inline" transform="translate(100, 0) scale(-1, 1)" />

          {/* Mound of Grains inside the bowl */}
          <path d="M 33,32 Q 50,21 67,32 Z" fill="#88C057" stroke="#68A14E" strokeWidth="1" />
          <g fill="#558B2F">
            <circle cx="36" cy="31" r="1.1" />
            <circle cx="45" cy="26" r="1.1" />
            <circle cx="55" cy="26" r="1.1" />
            <circle cx="64" cy="31" r="1.1" />
            <circle cx="41" cy="30" r="1.1" />
            <circle cx="50" cy="26" r="1.1" />
            <circle cx="59" cy="30" r="1.1" />
          </g>
          <g fill="#AED581">
            <circle cx="39" cy="29" r="1.1" />
            <circle cx="48" cy="25" r="1.1" />
            <circle cx="58" cy="27" r="1.1" />
            <circle cx="44" cy="28" r="1.1" />
            <circle cx="53" cy="27" r="1.1" />
            <circle cx="62" cy="32" r="1.1" />
          </g>
          <g fill="#68A14E">
            <circle cx="42" cy="27" r="1.1" />
            <circle cx="52" cy="25" r="1.1" />
            <circle cx="61" cy="29" r="1.1" />
            <circle cx="38" cy="32" r="1.1" />
            <circle cx="47" cy="27" r="1.1" />
            <circle cx="56" cy="28" r="1.1" />
          </g>

          {/* The Bowl */}
          <path d="M 33,32 C 33,48 67,48 67,32 Z" fill="#FFFFFF" stroke="#68A14E" strokeWidth="1.5" />
          <path d="M 32,32 L 68,32" stroke="#68A14E" strokeWidth="1.8" fill="none" />

          {/* Decorative carving on the bowl */}
          <path d="M 50,33 L 50,47" stroke="#68A14E" strokeWidth="0.8" strokeDasharray="1 1.5" fill="none" />
          <path d="M 36,36 C 41,41 45,41 50,36 C 55,41 59,41 64,36" stroke="#68A14E" strokeWidth="1" fill="none" />
          <path d="M 38,40 C 42,44 45,44 50,40 C 55,44 58,44 62,40" stroke="#68A14E" strokeWidth="0.8" fill="none" />
          <path d="M 45,40 Q 42,37 45,34 Q 48,37 45,40 Z" fill="#68A14E" opacity="0.85" />
          <path d="M 55,40 Q 52,37 55,34 Q 58,37 55,40 Z" fill="#68A14E" opacity="0.85" />

          {/* Scattered Grains at the bottom */}
          <g stroke="#68A14E" strokeWidth="0.4">
            <ellipse cx="44" cy="63" rx="2.2" ry="1" transform="rotate(-20 44 63)" fill="#68A14E" />
            <ellipse cx="48" cy="65" rx="2" ry="0.9" transform="rotate(35 48 65)" fill="#AED581" />
            <ellipse cx="52" cy="65" rx="2" ry="0.9" transform="rotate(-30 52 65)" fill="#AED581" />
            <ellipse cx="56" cy="63" rx="2.2" ry="1" transform="rotate(20 56 63)" fill="#68A14E" />
            <ellipse cx="39" cy="62" rx="1.8" ry="0.8" transform="rotate(-40 39 62)" fill="#AED581" />
            <ellipse cx="61" cy="62" rx="1.8" ry="0.8" transform="rotate(40 61 62)" fill="#AED581" />
            <ellipse cx="35" cy="63" rx="1.5" ry="0.7" transform="rotate(15 35 63)" fill="#68A14E" />
            <ellipse cx="65" cy="63" rx="1.5" ry="0.7" transform="rotate(-15 65 63)" fill="#68A14E" />
          </g>
        </svg>
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
