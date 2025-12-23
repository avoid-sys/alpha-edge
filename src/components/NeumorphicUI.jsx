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
      className={`px-6 py-3 sm:px-6 sm:py-3 rounded-xl border border-white/40 transition-all duration-200 text-gray-700 font-medium min-h-[48px] sm:min-h-[auto] ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const StatBox = ({ title, value, subValue, icon: Icon, trend, className = '' }) => (
  <NeumorphicCard className={`px-4 py-4 sm:px-5 sm:py-4 min-h-[80px] sm:min-h-[auto] ${className}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">
          {title}
        </p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mt-1 leading-tight break-words overflow-hidden text-ellipsis max-w-full">
          {value}
        </p>
        {subValue && (
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1 leading-snug break-words overflow-hidden text-ellipsis max-w-full">
            {subValue}
          </p>
        )}
        {typeof trend === 'number' && !Number.isNaN(trend) && trend !== 0 && (
          <p
            className={`text-[11px] sm:text-xs mt-1 font-semibold ${
              trend >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </p>
        )}
      </div>
      {Icon && (
        <div className="flex-shrink-0 pl-1">
          <Icon size={22} className="sm:w-7 sm:h-7 text-gray-400" />
        </div>
      )}
    </div>
  </NeumorphicCard>
);
