import React from 'react';

interface SignedworkLogoProps {
  className?: string;
  size?: number;
}

export function SignedworkLogo({ className = "", size = 32 }: SignedworkLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Classic shield shape background */}
      <path 
        d="M50 10 L75 20 L75 45 Q75 65 50 85 Q25 65 25 45 L25 20 Z" 
        fill="hsl(215, 25%, 20%)" 
        stroke="hsl(215, 25%, 15%)" 
        strokeWidth="1.5"
      />
      
      {/* Inner shield detail */}
      <path 
        d="M50 15 L70 23 L70 43 Q70 60 50 77 Q30 60 30 43 L30 23 Z" 
        fill="hsl(215, 30%, 25%)" 
        stroke="hsl(215, 20%, 30%)" 
        strokeWidth="0.5"
      />
      
      {/* Professional document icon */}
      <rect 
        x="38" 
        y="32" 
        width="24" 
        height="30" 
        rx="2" 
        fill="white" 
        stroke="hsl(215, 15%, 85%)" 
        strokeWidth="0.8"
      />
      
      {/* Document header line */}
      <rect 
        x="41" 
        y="35" 
        width="18" 
        height="2" 
        fill="hsl(215, 25%, 20%)"
      />
      
      {/* Document content lines */}
      <rect x="41" y="40" width="15" height="1" fill="hsl(215, 15%, 60%)" />
      <rect x="41" y="43" width="18" height="1" fill="hsl(215, 15%, 60%)" />
      <rect x="41" y="46" width="12" height="1" fill="hsl(215, 15%, 60%)" />
      <rect x="41" y="49" width="16" height="1" fill="hsl(215, 15%, 60%)" />
      
      {/* Classic fountain pen */}
      <rect 
        x="53" 
        y="25" 
        width="2.5" 
        height="12" 
        rx="1.25" 
        fill="hsl(215, 25%, 20%)" 
        transform="rotate(25 54.25 31)"
      />
      
      {/* Pen nib */}
      <polygon 
        points="55,34 57,38 53,38" 
        fill="hsl(35, 65%, 45%)" 
        transform="rotate(25 55 36)"
      />
      
      {/* Professional signature */}
      <path 
        d="M40 55 Q48 53 56 55" 
        stroke="hsl(215, 25%, 20%)" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Quality seal/badge */}
      <circle 
        cx="58" 
        cy="42" 
        r="4" 
        fill="hsl(145, 55%, 45%)" 
        stroke="white" 
        strokeWidth="1"
      />
      
      {/* Check mark in seal */}
      <path 
        d="M56 42 L57.5 43.5 L60 40.5" 
        stroke="white" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SignedworkIcon({ className = "", size = 24 }: SignedworkLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified classic shield */}
      <path 
        d="M50 15 L70 22 L70 42 Q70 58 50 75 Q30 58 30 42 L30 22 Z" 
        fill="currentColor" 
        opacity="0.15"
        stroke="currentColor" 
        strokeWidth="1.5"
        opacity="0.3"
      />
      
      {/* Professional document */}
      <rect 
        x="40" 
        y="35" 
        width="20" 
        height="25" 
        rx="1.5" 
        fill="currentColor" 
        opacity="0.8"
      />
      
      {/* Document lines */}
      <rect x="43" y="40" width="10" height="1" fill="white" opacity="0.9" />
      <rect x="43" y="43" width="14" height="1" fill="white" opacity="0.7" />
      <rect x="43" y="46" width="8" height="1" fill="white" opacity="0.7" />
      <rect x="43" y="49" width="12" height="1" fill="white" opacity="0.7" />
      
      {/* Professional pen */}
      <rect 
        x="52" 
        y="28" 
        width="2" 
        height="10" 
        rx="1" 
        fill="currentColor" 
        transform="rotate(25 53 33)"
      />
      
      {/* Signature */}
      <path 
        d="M42 54 Q48 52 54 54" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
        opacity="0.9"
      />
      
      {/* Quality badge */}
      <circle 
        cx="56" 
        cy="40" 
        r="3" 
        fill="currentColor" 
        opacity="0.9"
      />
      
      {/* Check mark */}
      <path 
        d="M54.5 40 L55.5 41 L57.5 38.5" 
        stroke="white" 
        strokeWidth="1" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}