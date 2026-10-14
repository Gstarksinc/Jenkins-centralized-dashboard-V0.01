import React from 'react';
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning } from 'lucide-react';

interface JenkinsWeatherIconProps {
  score?: number | null;
  size?: number;
}

export const JenkinsWeatherIcon: React.FC<JenkinsWeatherIconProps> = ({
  score = 100,
  size = 18,
}) => {
  const s = score ?? 100;

  if (s >= 80) {
    return (
      <span title={`Build stability: Sunny (${s}%)`}>
        <Sun className="text-amber-500 hover:scale-110 transition-transform" size={size} />
      </span>
    );
  }
  if (s >= 60) {
    return (
      <span title={`Build stability: Partially Cloudy (${s}%)`}>
        <CloudSun className="text-amber-600 hover:scale-110 transition-transform" size={size} />
      </span>
    );
  }
  if (s >= 40) {
    return (
      <span title={`Build stability: Cloudy (${s}%)`}>
        <Cloud className="text-slate-400 hover:scale-110 transition-transform" size={size} />
      </span>
    );
  }
  if (s >= 20) {
    return (
      <span title={`Build stability: Rainy (${s}%)`}>
        <CloudRain className="text-blue-500 hover:scale-110 transition-transform" size={size} />
      </span>
    );
  }
  return (
    <span title={`Build stability: Stormy (${s}%)`}>
      <CloudLightning className="text-rose-500 hover:scale-110 transition-transform" size={size} />
    </span>
  );
};
