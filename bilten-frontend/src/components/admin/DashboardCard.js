import React from 'react';

const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  trendDirection = 'up',
  onClick,
  className = '',
  children 
}) => {
  const getTrendColor = () => {
    if (trendDirection === 'up') {
      return 'text-green-400';
    } else if (trendDirection === 'down') {
      return 'text-red-400';
    }
    return 'text-blue-400';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') {
      return '↗';
    } else if (trendDirection === 'down') {
      return '↘';
    }
    return '→';
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border border-white/10 
        bg-white/5 backdrop-blur-sm p-6 transition-all duration-300
        hover:bg-white/10 hover:border-white/20 hover:shadow-lg
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Animated background lines */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-4 left-4 w-20 h-20 border border-white/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border border-white/20 rounded-full animate-pulse delay-1000"></div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                <span className="text-white text-xl">{icon}</span>
              </div>
            )}
            <h3 className="text-white font-medium text-sm opacity-80">
              {title}
            </h3>
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {children ? (
          children
        ) : (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">
              {value}
            </div>
            {trend && (
              <p className="text-xs text-white/60">
                {trend}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
