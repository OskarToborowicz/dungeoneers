import React from 'react';

interface ClassIconProps {
  className?: string;
}

const ClassIcon: React.FC<ClassIconProps> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L15 5L12 8L9 5L12 2ZM12 10L15 13L12 16L9 13L12 10ZM12 18L15 21L12 24L9 21L12 18Z" />
    </svg>
  );
};

export default ClassIcon;
