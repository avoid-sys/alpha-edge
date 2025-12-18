import React from 'react';

export const NeumorphicCard = ({ children, className = '', ...props }) => (
  <div
    className={`bg-[#e0e5ec] rounded-2xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] border border-white/40 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const NeumorphicButton = ({ children, className = '', variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'bg-[#e0e5ec] shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] active:shadow-[inset_-2px_-2px_5px_#ffffff,inset_2px_2px_5px_#aeaec040]',
    action: 'bg-[#e0e5ec] shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#aeaec040] hover:shadow-[-2px_-2px_5px_#ffffff,2px_2px_5px_#aeaec040] active:shadow-[inset_-2px_-2px_5px_#ffffff,inset_2px_2px_5px_#aeaec040]'
  };

  return (
    <button
      className={`px-6 py-3 rounded-xl border border-white/40 transition-all duration-200 text-gray-700 font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const StatBox = ({ title, value, subValue, icon: Icon, trend, className = '' }) => (
  <NeumorphicCard className={`p-6 ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subValue && (
          <p className="text-xs text-gray-400 mt-1">{subValue}</p>
        )}
        {trend && (
          <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </p>
        )}
      </div>
      {Icon && <Icon size={32} className="text-gray-400" />}
    </div>
  </NeumorphicCard>
);
