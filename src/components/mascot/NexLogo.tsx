import React from 'react';

interface NexLogoProps {
  size?: number;
  className?: string;
}

export const NexLogo: React.FC<NexLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="NexLearn Mascot Logo"
    >
      <defs>
        <radialGradient
          id="nexLogoGradient"
          cx="40%"
          cy="35%"
          r="65%"
          fx="35%"
          fy="30%"
        >
          <stop offset="0%" stopColor="#FFA18A" />
          <stop offset="45%" stopColor="#FF6B4A" />
          <stop offset="90%" stopColor="#C94426" />
          <stop offset="100%" stopColor="#962A14" />
        </radialGradient>

        <linearGradient id="nexLogoVisor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E2330" />
          <stop offset="100%" stopColor="#0B0D12" />
        </linearGradient>

        <filter id="nexLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main Mascot Orb */}
      <path
        d="M 100 18
           C 148 18, 182 52, 182 100
           C 182 148, 146 182, 100 182
           C 54 182, 18 148, 18 100
           C 18 52, 52 18, 100 18 Z"
        fill="url(#nexLogoGradient)"
      />

      {/* Specular Highlight */}
      <path
        d="M 52 42 C 72 26, 128 26, 148 42"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Visor */}
      <rect
        x="44"
        y="76"
        width="112"
        height="48"
        rx="24"
        fill="url(#nexLogoVisor)"
        stroke="#262B38"
        strokeWidth="3"
      />

      {/* Left Glowing Eye */}
      <ellipse
        cx="76"
        cy="100"
        rx="9"
        ry="12"
        fill="#3DD9A4"
        filter="url(#nexLogoGlow)"
      />
      <circle cx="73" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />

      {/* Right Glowing Eye */}
      <ellipse
        cx="124"
        cy="100"
        rx="9"
        ry="12"
        fill="#3DD9A4"
        filter="url(#nexLogoGlow)"
      />
      <circle cx="121" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />

      {/* Friendly Smile */}
      <path
        d="M 92 110 Q 100 116 108 110"
        stroke="#A0A6B4"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
