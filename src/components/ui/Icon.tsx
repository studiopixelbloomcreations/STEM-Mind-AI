import React from 'react';
import { IconProps as CustomIconProps } from '../icons/types';

interface IconWrapperProps extends CustomIconProps {
  icon: React.ComponentType<CustomIconProps>;
  className?: string;
  size?: number | string;
}

export const Icon: React.FC<IconWrapperProps> = ({
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
