import React from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  className?: string;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  strokeWidth = 1.75,
  size = 20,
  className = '',
  ...props
}) => {
  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={`inline-block shrink-0 ${className}`}
      {...props}
    />
  );
};
