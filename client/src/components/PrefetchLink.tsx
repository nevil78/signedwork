import { memo, useEffect } from "react";
import { Link } from "wouter";

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: () => void;
}

// Prefetch component to preload pages on hover
export const PrefetchLink = memo(({ href, children, className, onMouseEnter }: PrefetchLinkProps) => {
  const handleMouseEnter = () => {
    // Prefetch the page when user hovers over the link
    if (href.includes('/terms')) {
      /* @vite-ignore */
      import('@/pages/terms').catch(() => {
        // Silently fail if prefetch doesn't work
      });
    } else if (href.includes('/privacy')) {
      /* @vite-ignore */
      import('@/pages/privacy').catch(() => {
        // Silently fail if prefetch doesn't work
      });
    }
    onMouseEnter?.();
  };

  return (
    <Link href={href}>
      <a className={className} onMouseEnter={handleMouseEnter}>
        {children}
      </a>
    </Link>
  );
});

PrefetchLink.displayName = "PrefetchLink";