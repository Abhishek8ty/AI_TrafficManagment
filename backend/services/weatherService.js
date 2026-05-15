const axios = require('axios');

async function getWeather(lat, lng) {
  try {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key || key === 'demo') return simulateWeather();

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`;
    const res = await axios.get(url, { timeout: 5000 });
    const d = res.data;

    return {
      condition: d.weather[0].main,
      description: d.weather[0].description,
      temp: Math.round(d.main.temp),
      humidity: d.main.humidity,
      windSpeed: Math.round(d.wind.speed * 3.6),
      visibility: d.visibility ? Math.round(d.visibility / 1000) : 10,
      icon: d.weather[0].icon,
      impact: getWeatherImpact(d.weather[0].main),
    };
  } catch {
    return simulateWeather();
  }
}

function getWeatherImpact(condition) {
  const impacts = {
    Rain: { etaMultiplier: 1.25, label: 'Rain slowing traffic', severity: 'medium' },
    Thunderstorm: { etaMultiplier: 1.5, label: 'Storm causing delays', severity: 'high' },
    Fog: { etaMultiplier: 1.35, label: 'Low visibility', severity: 'high' },
    Snow: { etaMultiplier: 1.6, label: 'Snow on roads', severity: 'high' },
    Clear: { etaMultiplier: 1.0, label: 'Clear conditions', severity: 'none' },
    Clouds: { etaMultiplier: 1.05, label: 'Overcast', severity: 'low' },
  };
  return impacts[condition] || { etaMultiplier: 1.0, label: 'Normal conditions', severity: 'none' };
}

function simulateWeather() {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Fog'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  return {
    condition,
    description: condition.toLowerCase(),
    temp: Math.round(22 + Math.random() * 15),
    humidity: Math.round(40 + Math.random() * 50),
    windSpeed: Math.round(5 + Math.random() * 25),
    visibility: condition === 'Fog' ? 2 : 10,
    icon: '01d',
    impact: getWeatherImpact(condition),
  };
}

module.exports = { getWeather };
