'use client';
import React from 'react';

const GoButton = ({ onGo, isAnimating }) => {
  return (
    <button
      type="submit"
      onClick={onGo}
      className="flex-1 bg-[#a435f0] text-white font-bold py-3 rounded-lg hover:bg-[#8f2cd6] disabled:opacity-50 transition-all duration-200"
      disabled={isAnimating}
    >
      Go
    </button>
  );
};

export default GoButton;