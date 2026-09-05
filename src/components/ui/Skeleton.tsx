import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
}) => {
  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      style={{ width, height }}
      className={`relative overflow-hidden bg-[var(--color-bg-surface-alt)] border border-[#232835] ${roundedStyles} ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-[#2D3445] to-transparent"
        style={{
          animation: 'shimmer 1.8s infinite',
        }}
      />
    </div>
  );
};
