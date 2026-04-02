export function getWeatherLabel(code) {
  if (code === 0) return 'Clear Sky';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([80, 81, 82].includes(code)) return 'Rain Showers';
  if (code === 95) return 'Thunderstorm';
  if ([96, 99].includes(code)) return 'Heavy Thunderstorm';
  return 'Unknown';
}

export function getSeasonBadge(month) { // month = 0-11
  if ([6, 7, 8].includes(month)) return { label: 'Peak Dry Season', type: 'success' };
  if ([2, 3, 4].includes(month)) return { label: 'Long Rains', type: 'info' };
  if ([9, 10].includes(month)) return { label: 'Short Rains', type: 'info' };
  return { label: 'Dry Season', type: 'warning' };
}
