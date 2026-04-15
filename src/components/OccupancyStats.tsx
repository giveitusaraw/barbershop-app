import React from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { OccupancyStats as OccupancyStatsType, BarberOccupancyStats } from '../types';

interface OccupancyStatsProps {
  stats: OccupancyStatsType;
  title: string;
  barberStats?: BarberOccupancyStats[];
  thresholds: {
    good: number;
    medium: number;
  };
}

const getOccupancyColor = (rate: number, thresholds: { good: number; medium: number }): string => {
  if (rate >= thresholds.good) return 'text-green-600';
  if (rate >= thresholds.medium) return 'text-yellow-600';
  return 'text-red-600';
};

const getOccupancyBgColor = (rate: number, thresholds: { good: number; medium: number }): string => {
  if (rate >= thresholds.good) return 'bg-green-600';
  if (rate >= thresholds.medium) return 'bg-yellow-600';
  return 'bg-red-600';
};

const formatTimeInHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const OccupancyStats: React.FC<OccupancyStatsProps> = ({
  stats,
  title,
  barberStats,
  thresholds
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Disp: <span className="font-medium text-gray-700">{formatTimeInHours(stats.available_minutes)}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Ocup: <span className="font-medium text-gray-700">{formatTimeInHours(stats.occupied_minutes)}</span></span>
          </div>
          <span className={`text-xl font-bold ${getOccupancyColor(stats.occupancy_rate, thresholds)}`}>
            {stats.occupancy_rate.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getOccupancyBgColor(stats.occupancy_rate, thresholds)} transition-all duration-300`}
          style={{ width: `${Math.min(100, stats.occupancy_rate)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {new Date(stats.period_start).toLocaleDateString('pt-PT')} — {new Date(stats.period_end).toLocaleDateString('pt-PT')}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Bom ≥{thresholds.good}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>Médio ≥{thresholds.medium}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Baixo</span>
        </div>
      </div>

      {barberStats && barberStats.length > 0 && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Por Funcionário</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {barberStats.map((barber) => (
              <div key={barber.barber_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{barber.barber_name}</span>
                  <span className={`text-xs font-bold ${getOccupancyColor(barber.occupancy_rate, thresholds)}`}>
                    {barber.occupancy_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${getOccupancyBgColor(barber.occupancy_rate, thresholds)}`}
                    style={{ width: `${Math.min(100, barber.occupancy_rate)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{formatTimeInHours(barber.available_minutes)} disp.</span>
                  <span>{formatTimeInHours(barber.occupied_minutes)} ocup.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
