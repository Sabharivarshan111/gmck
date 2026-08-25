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
      const timer = setTimeout(() => setAnimating(false), 800);
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
          r="47"
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/35"
          strokeWidth="6"
        />

        {/* Animated Green Circle */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill={checked ? `${color}1f` : 'none'}
          stroke={color}
          strokeWidth="7.5"
          strokeLinecap="round"
          style={{
            strokeDasharray: 295,
            strokeDashoffset: checked ? 0 : 295,
            transition: checked
              ? 'stroke-dashoffset 0.4s ease-out'
              : 'stroke-dashoffset 0.15s ease-in',
          }}
        />

        {/* Animated Checkmark */}
        <path
          d="M28 52 L44 67 L73 35"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 48,
            strokeDashoffset: checked ? 0 : 48,
            transition: checked
              ? 'stroke-dashoffset 0.32s cubic-bezier(0.6, 0, 0.3, 1) 0.2s'
              : 'stroke-dashoffset 0.15s ease-in',
          }}
        />
      </svg>
    </div>
  );
};
