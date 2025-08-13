import React from 'react';

interface SignedworkLogoProps {
  className?: string;
  size?: number;
}

export function SignedworkLogo({ className = "", size = 24 }: SignedworkLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded rectangle frame */}
      <rect 
        x="8" 
        y="8" 
        width="84" 
        height="84" 
        rx="12" 
        ry="12" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      
      {/* Fountain pen body */}
      <rect 
        x="35" 
        y="20" 
        width="12" 
        height="35" 
        rx="2" 
        fill="currentColor" 
        transform="rotate(25 41 37.5)"
      />
      
      {/* Pen tip */}
      <polygon 
        points="42,50 48,58 36,58" 
        fill="currentColor" 
        transform="rotate(25 42 54)"
      />
      
      {/* Pen nib detail */}
      <circle 
        cx="42" 
        cy="52" 
        r="2" 
        fill="white" 
        transform="rotate(25 42 52)"
      />
      
      {/* Signature line */}
      <path 
        d="M25 70 Q40 65 55 70 Q70 75 80 70" 
        stroke="currentColor" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
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
      {/* Simplified icon version without frame */}
      
      {/* Fountain pen body */}
      <rect 
        x="30" 
        y="15" 
        width="14" 
        height="40" 
        rx="3" 
        fill="currentColor" 
        transform="rotate(25 37 35)"
      />
      
      {/* Pen tip */}
      <polygon 
        points="37,52 45,62 29,62" 
        fill="currentColor" 
        transform="rotate(25 37 57)"
      />
      
      {/* Pen nib detail */}
      <circle 
        cx="37" 
        cy="55" 
        r="3" 
        fill="white" 
        transform="rotate(25 37 55)"
      />
      
      {/* Signature line */}
      <path 
        d="M15 75 Q35 68 55 75 Q75 82 85 75" 
        stroke="currentColor" 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round"
      />
    </svg>
  );
}