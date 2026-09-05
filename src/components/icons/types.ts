import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  className?: string;
}
