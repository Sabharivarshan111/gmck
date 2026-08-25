import React, { useEffect, useState } from 'react';

interface SuccessCheckmarkProps {
  checked: boolean;
  size?: number;
  color?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  checked,
  size = 20,
  color = '#22d98a',
  className = '',
  onClick,
}) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (checked) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 700);
      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
    }
  }, [checked]);

  return (
    <div
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Radial Glow Pulse */}
      {animating && (
        <div
          className="absolute inset-[-6px] rounded-full pointer-events-none animate-success-glow"
          style={{
            background: `radial-gradient(circle, ${color}80, transparent 70%)`,
          }}
        />
      )}

      {/* SVG Canvas with Circle & Checkmark */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        style={{ width: size, height: size }}
      >
        {/* Base inactive border */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/35"
          strokeWidth="6"
        />

        {/* Animated Green Circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill={checked ? `${color}1f` : 'none'}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          style={{
            strokeDasharray: 285,
            strokeDashoffset: checked ? 0 : 285,
            transition: checked
              ? 'stroke-dashoffset 0.38s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'stroke-dashoffset 0.12s ease-in',
          }}
        />

        {/* Animated Checkmark (only visible when checked to prevent any stray subpixel artifacts) */}
        <path
          d="M28 50 L42 66 L74 34"
          fill="none"
          stroke={color}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: checked ? 1 : 0,
            strokeDasharray: 90,
            strokeDashoffset: checked ? 0 : 90,
            transition: checked
              ? 'stroke-dashoffset 0.3s cubic-bezier(0.6, 0, 0.3, 1) 0.18s, opacity 0.1s ease-in'
              : 'stroke-dashoffset 0.12s ease-in, opacity 0.1s ease-out',
          }}
        />
      </svg>
    </div>
  );
};
