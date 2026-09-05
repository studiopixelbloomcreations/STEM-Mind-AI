import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { HelpCircle } from 'lucide-react';

interface StuckButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const StuckButton: React.FC<StuckButtonProps> = ({ onClick, disabled }) => {
  return (
    <Button
      variant="stuck"
      size="md"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2"
    >
      <Icon icon={HelpCircle} size={16} />
      <span>I&apos;m Stuck &bull; Show Me How</span>
    </Button>
  );
};
