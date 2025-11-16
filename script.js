const OW_API_KEY = "YOUR_API_KEY_HERE";
let unitSystem = "metric";

const qInput = document.getElementById('qInput');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');

const placeLabel = document.getElementById('placeLabel');
const dateLabel = document.getElementById('dateLabel');
const lastUpdated = document.getElementById('lastUpdated');

const iconImg = document.getElementById('iconImg');
const tempLabel = document.getElementById('tempLabel');
const descLabel = document.getElementById('descLabel');
const feelsBlock = document.getElementById('feelsBlock');
const pressureBlock = document.getElementById('pressureBlock');

const windVal = document.getElementById('windVal');
const humVal = document.getElementById('humVal');
const uvVal = document.getElementById('uvVal');
const minmaxVal = document.getElementById('minmaxVal');

const hourList = document.getElementById('hourList');
const dayList = document.getElementById('dayList');
const tzLabel = document.getElementById('tzLabel');

const metricBtn = document.getElementById('metricBtn');
const imperialBtn = document.getElementById('imperialBtn');

let mapInstance = null;
let mapMarker = null;

function toTemperatureLabel(val){
  if (unitSystem === 'metric') return Math.round(val) + '°C';
  return Math.round((val * 9/5) + 32) + '°F';
}

function windLabel(speed){
  if (unitSystem === 'metric') return Math.round(speed * 3.6) + ' km/h';
  return Math.round(speed * 2.237) + ' mph';
}

function shortDate(ts){
  return moment(ts * 1000).format('ddd, MMM D');
}
function fullDate(ts){
  return moment(ts * 1000).format('dddd, MMMM D, YYYY');
}
function timeLabel(ts){
  return moment(ts * 1000).format('h:mm A');
}

function showErrorContainers(msg){
  hourList.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`;
  dayList.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`;
}

function setupMap(lat, lon){
  if (!mapInstance){
    mapInstance = L.map('mapArea', { zoomControl:true }).setView([lat, lon], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
  } else {
    mapInstance.setView([lat, lon], 9);
  }

  if (mapMarker){
    mapInstance.removeLayer(mapMarker);
  }
  mapMarker = L.marker([lat, lon]).addTo(mapInstance);
  mapMarker.bindPopup(placeLabel.textContent).openPopup();
}

async function getWeatherForCity(cityName){
  try {
    hourList.innerHTML = '<div class="loading"><div class="spinner"></div>Fetching hourly data…</div>';
    dayList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading daily forecast…</div>';

    const curUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=${unitSystem}&appid=${OW_API_KEY}`;
    const curResp = await fetch(curUrl);
    const cur = await curResp.json();
    if (curResp.status !== 200) throw new Error(cur.message || 'City not found');

    const fUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&units=${unitSystem}&appid=${OW_API_KEY}`;
    const fResp = await fetch(fUrl);
    const forecast = await fResp.json();
    if (fResp.status !== 200) throw new Error(forecast.message || 'Forecast unavailable');

    renderWeather(cur, forecast);

  } catch(err){
    console.error('getWeatherForCity error', err);
    showErrorContainers('Unable to fetch weather. ' + (err.message || 'Try another city'));
    placeLabel.textContent = '—';
    dateLabel.textContent = '—';
    lastUpdated.textContent = 'Last updated: —';
  }
}

async function getWeatherByCoords(lat, lon){
  try {
    hourList.innerHTML = '<div class="loading"><div class="spinner"></div>Fetching hourly data…</div>';
    dayList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading daily forecast…</div>';

    const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unitSystem}&appid=${OW_API_KEY}`;
    const curResp = await fetch(curUrl);
    const cur = await curResp.json();
    if (curResp.status !== 200) throw new Error(cur.message || 'Location not found');

    const fUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unitSystem}&appid=${OW_API_KEY}`;
    const fResp = await fetch(fUrl);
    const forecast = await fResp.json();
    if (fResp.status !== 200) throw new Error(forecast.message || 'Forecast unavailable');

    renderWeather(cur, forecast);

  } catch(err){
    console.error('getWeatherByCoords error', err);
    showErrorContainers('Unable to fetch weather for coordinates.');
  }
}

function renderWeather(current, forecastData){
  placeLabel.textContent = `${current.name}, ${current.sys.country || ''}`.trim();
  dateLabel.textContent = fullDate(current.dt);
  lastUpdated.textContent = `Last updated: ${moment().format('lll')}`;

  iconImg.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
  iconImg.alt = current.weather[0].description || 'weather';
  tempLabel.textContent = toTemperatureLabel(current.main.temp);
  descLabel.textContent = current.weather[0].description || '—';
  feelsBlock.textContent = `Feels like ${toTemperatureLabel(current.main.feels_like)}`;
  pressureBlock.textContent = `Pressure ${current.main.pressure} hPa`;

  windVal.textContent = windLabel(current.wind.speed);
  humVal.textContent = `${current.main.humidity}%`;
  uvVal.textContent = '—';

  tzLabel.textContent = forecastData.city && forecastData.city.timezone ? `UTC${formatTZ(forecastData.city.timezone)}` : 'Local';

  const lat = current.coord.lat, lon = current.coord.lon;
  setupMap(lat, lon);

  hourList.innerHTML = '';
  const nextHours = forecastData.list.slice(0, 8);
  nextHours.forEach(item => {
    const node = document.createElement('div');
    node.className = 'hour-card';
    node.innerHTML = `
      <div style="font-size:0.9rem;font-weight:600">${timeLabel(item.dt)}</div>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="icon"/>
      <div style="margin-top:6px;font-weight:700">${toTemperatureLabel(item.main.temp)}</div>
      <div style="font-size:0.85rem;color:var(--muted)">${item.weather[0].main}</div>
    `;
    hourList.appendChild(node);
  });

  const byDay = {};
  forecastData.list.forEach(entry => {
    const day = moment(entry.dt * 1000).format('YYYY-MM-DD');
    if (!byDay[day]) byDay[day] = { min: entry.main.temp_min, max: entry.main.temp_max, icon: entry.weather[0].icon, dt: entry.dt };
    else {
      byDay[day].min = Math.min(byDay[day].min, entry.main.temp_min);
      byDay[day].max = Math.max(byDay[day].max, entry.main.temp_max);
    }
  });

  const days = Object.keys(byDay).slice(0, 5).map(k => ({ dayKey: k, ...byDay[k] }));

  if (days[0]) minmaxVal.textContent = `${toTemperatureLabel(days[0].min)} / ${toTemperatureLabel(days[0].max)}`;

  dayList.innerHTML = '';
  days.forEach(d => {
    const row = document.createElement('div');
    row.className = 'day-card';
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-weight:700">${moment(d.dayKey).format('ddd')}</div>
        <div style="color:var(--muted)">${moment(d.dayKey).format('MMM D')}</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <img src="https://openweathermap.org/img/wn/${d.icon}.png" alt="" style="width:36px;height:36px"/>
        <div style="text-align:right">
          <div style="font-weight:700">${toTemperatureLabel(d.max)}</div>
          <div style="color:var(--muted);font-size:0.88rem">${toTemperatureLabel(d.min)}</div>
        </div>
      </div>
    `;
    dayList.appendChild(row);
  });
}

function formatTZ(secOffset){
  const hours = Math.floor(secOffset / 3600);
  const mins = Math.abs(Math.floor((secOffset % 3600) / 60));
  return `${hours >= 0 ? '+' : ''}${hours}${mins ? ':' + String(mins).padStart(2,'0') : ''}`;
}

searchBtn.addEventListener('click', () => {
  const q = qInput.value.trim();
  if (!q) return;
  getWeatherForCity(q);
  qInput.value = '';
});

qInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

locBtn.addEventListener('click', () => {
  if (!navigator.geolocation){
    showErrorContainers('Geolocation not available in this browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
  }, err => {
    showErrorContainers('Permission denied or location unavailable.');
  });
});

metricBtn.addEventListener('click', () => {
  unitSystem = 'metric';
  metricBtn.classList.add('active');
  imperialBtn.classList.remove('active');
  const city = placeLabel.textContent.split(',')[0].trim();
  if (city && city !== '—') getWeatherForCity(city);
});

imperialBtn.addEventListener('click', () => {
  unitSystem = 'imperial';
  imperialBtn.classList.add('active');
  metricBtn.classList.remove('active');
  const city = placeLabel.textContent.split(',')[0].trim();
  if (city && city !== '—') getWeatherForCity(city);
});

(function bootstrap(){
  getWeatherForCity('New York');
})();
