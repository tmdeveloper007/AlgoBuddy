import React from 'react';

const ResetButton = ({ onReset, isAnimating }) => {
  return (
    <button
      type="button"
      onClick={onReset}
      disabled={isAnimating}
      className="flex-1 border-2 border-[#1a1a1a] dark:border-[#f7f9fa] text-[#1a1a1a] dark:text-[#f7f9fa] font-bold py-[10px] rounded-lg hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-white dark:hover:text-[#1a1a1a] disabled:opacity-50 transition-all duration-200"
    >
      Reset
    </button>
  );
};

export default ResetButton;