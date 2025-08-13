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
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(221.2, 83.2%, 53.3%)" />
          <stop offset="100%" stopColor="hsl(221.2, 83.2%, 43.3%)" />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle 
        cx="60" 
        cy="60" 
        r="56" 
        fill="url(#logoGradient)" 
        stroke="hsl(221.2, 83.2%, 33.3%)" 
        strokeWidth="2"
      />
      
      {/* Document/paper background */}
      <rect 
        x="25" 
        y="35" 
        width="70" 
        height="50" 
        rx="4" 
        fill="white" 
        stroke="hsl(210, 40%, 90%)" 
        strokeWidth="1"
      />
      
      {/* Document lines */}
      <line x1="35" y1="50" x2="75" y2="50" stroke="hsl(210, 20%, 85%)" strokeWidth="1.5" />
      <line x1="35" y1="57" x2="85" y2="57" stroke="hsl(210, 20%, 85%)" strokeWidth="1.5" />
      <line x1="35" y1="64" x2="70" y2="64" stroke="hsl(210, 20%, 85%)" strokeWidth="1.5" />
      
      {/* Pen/stylus */}
      <rect 
        x="60" 
        y="25" 
        width="4" 
        height="25" 
        rx="2" 
        fill="hsl(221.2, 83.2%, 53.3%)" 
        transform="rotate(45 62 37.5)"
      />
      
      {/* Pen tip */}
      <polygon 
        points="65,42 68,48 62,48" 
        fill="hsl(221.2, 83.2%, 33.3%)" 
        transform="rotate(45 65 45)"
      />
      
      {/* Signature line with flourish */}
      <path 
        d="M35 75 Q50 70 65 75 Q80 80 90 75" 
        stroke="hsl(221.2, 83.2%, 53.3%)" 
        strokeWidth="2.5" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Small checkmark for "verified work" */}
      <path 
        d="M75 40 L80 45 L90 32" 
        stroke="hsl(142, 76%, 36%)" 
        strokeWidth="3" 
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
      {/* Simplified icon version */}
      
      {/* Document background */}
      <rect 
        x="15" 
        y="25" 
        width="70" 
        height="50" 
        rx="4" 
        fill="currentColor" 
        opacity="0.1"
      />
      
      {/* Document lines */}
      <line x1="25" y1="40" x2="65" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="25" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="25" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      
      {/* Pen */}
      <rect 
        x="55" 
        y="15" 
        width="4" 
        height="20" 
        rx="2" 
        fill="currentColor" 
        transform="rotate(45 57 25)"
      />
      
      {/* Signature line */}
      <path 
        d="M25 80 Q45 75 65 80 Q80 85 85 80" 
        stroke="currentColor" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Checkmark */}
      <path 
        d="M70 30 L75 35 L85 22" 
        stroke="currentColor" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}