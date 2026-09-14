import React, { useState } from 'react';

export interface PieChartItem {
  label: string;
  value: number;
  color: string;
  subtext?: string;
}

interface PieChartProps {
  data: PieChartItem[];
  title?: string;
  subtitle?: string;
  centerValue?: string | number;
  centerLabel?: string;
  size?: number;
  donutThickness?: number;
  className?: string;
  legendPosition?: 'bottom' | 'right';
  formatValue?: (val: number) => string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  centerValue,
  centerLabel,
  size = 180,
  donutThickness = 24,
  className = '',
  legendPosition = 'right',
  formatValue = (v) => v.toString(),
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0);
  const validItems = data.filter((item) => item.value > 0);

  const center = size / 2;
  const radius = (size - 16) / 2;
  const innerRadius = radius - donutThickness;

  // Function to create SVG donut arc path
  const createArc = (startAngle: number, endAngle: number, isHovered: boolean) => {
    const currentRadius = isHovered ? radius + 3 : radius;
    const currentInnerRadius = isHovered ? Math.max(innerRadius - 2, 0) : innerRadius;

    // Handle full 360 circle
    if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
      return `
        M ${center} ${center - currentRadius}
        A ${currentRadius} ${currentRadius} 0 1 1 ${center} ${center + currentRadius}
        A ${currentRadius} ${currentRadius} 0 1 1 ${center} ${center - currentRadius}
        M ${center} ${center - currentInnerRadius}
        A ${currentInnerRadius} ${currentInnerRadius} 0 1 0 ${center} ${center + currentInnerRadius}
        A ${currentInnerRadius} ${currentInnerRadius} 0 1 0 ${center} ${center - currentInnerRadius}
        Z
      `;
    }

    const x1 = center + currentRadius * Math.cos(startAngle);
    const y1 = center + currentRadius * Math.sin(startAngle);
    const x2 = center + currentRadius * Math.cos(endAngle);
    const y2 = center + currentRadius * Math.sin(endAngle);

    const x3 = center + currentInnerRadius * Math.cos(endAngle);
    const y3 = center + currentInnerRadius * Math.sin(endAngle);
    const x4 = center + currentInnerRadius * Math.cos(startAngle);
    const y4 = center + currentInnerRadius * Math.sin(startAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${currentInnerRadius} ${currentInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  // Compute angles for each valid slice
  let currentAngle = -Math.PI / 2; // Start from top (12 o'clock)
  const slices = validItems.map((item, idx) => {
    const angle = total > 0 ? (item.value / total) * 2 * Math.PI : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
    return {
      ...item,
      originalIndex: idx,
      startAngle,
      endAngle,
      percent,
    };
  });

  const activeItem = hoveredIndex !== null && hoveredIndex < validItems.length ? validItems[hoveredIndex] : null;
  const activePercent = activeItem && total > 0 ? Math.round((activeItem.value / total) * 100) : null;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs ${className}`}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {title}
            </h3>
          )}
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div
        className={`flex ${
          legendPosition === 'bottom' ? 'flex-col items-center' : 'flex-col sm:flex-row items-center justify-between'
        } gap-4`}
      >
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          {total === 0 ? (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={center}
                cy={center}
                r={radius - donutThickness / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={donutThickness}
                className="text-slate-100 dark:text-slate-800/80"
              />
            </svg>
          ) : (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
              {slices.map((slice, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <path
                    key={slice.label + idx}
                    d={createArc(slice.startAngle, slice.endAngle, isHovered)}
                    fill={slice.color}
                    className="transition-all duration-200 cursor-pointer hover:opacity-90 stroke-white dark:stroke-slate-900 stroke-[1.5]"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>
          )}

          {/* Donut Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            {activeItem ? (
              <>
                <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white leading-tight">
                  {formatValue(activeItem.value)}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                  {activeItem.label}
                </span>
                <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                  {activePercent}% of total
                </span>
              </>
            ) : (
              <>
                {centerValue !== undefined && (
                  <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white leading-tight">
                    {centerValue}
                  </span>
                )}
                {centerLabel && (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[85px]">
                    {centerLabel}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="w-full flex-1 space-y-1.5 min-w-0">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div
                key={item.label + idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800/80 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-200 text-xs">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
                    {formatValue(item.value)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
