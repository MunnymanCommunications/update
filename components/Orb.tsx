
import React from 'react';

interface OrbProps {
  status: 'idle' | 'connecting' | 'active' | 'speaking';
  hue: number;
}

const Orb: React.FC<OrbProps> = ({ status, hue }) => {
  const getAnimationClass = () => {
    switch (status) {
      case 'connecting':
        return 'animate-pulse-slow';
      case 'active':
        return 'animate-breath';
      case 'speaking':
        return 'animate-speak';
      case 'idle':
      default:
        return '';
    }
  };

  const orbStyle: React.CSSProperties = {
    filter: `hue-rotate(${hue}deg) blur(50px)`,
    transform: 'scale(1.0)',
  };

  return (
    <div className="relative w-[400px] h-[400px] md:w-[600px] md:h-[600px]">
      <style>
        {`
          @keyframes breath {
            0%, 100% { transform: scale(1.0); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          @keyframes speak {
            0%, 100% { transform: scale(1.0); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
          }
           @keyframes pulse-slow {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.9; }
          }
          .animate-breath { animation: breath 5s ease-in-out infinite; }
          .animate-speak { animation: speak 1s ease-in-out infinite; }
          .animate-pulse-slow { animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        `}
      </style>
      <div 
        className={`absolute inset-0 bg-blue-500 rounded-full transition-all duration-500 ${getAnimationClass()}`}
        style={orbStyle}
      />
    </div>
  );
};

export default Orb;
