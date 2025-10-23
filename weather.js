const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap key
let units = 'metric';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');

const placeEl = document.getElementById('place');
const dateEl = document.getElementById('dateStr');
const lastUpdEl = document.getElementById('lastUpd');
const iconEl = document.getElementById('weatherIcon');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('desc');
const feelEl = document.getElementById('feel');
const pressEl = document.getElementById('press');
const windEl = document.getElementById('wind');
const humEl = document.getElementById('hum');
const uvEl = document.getElementById('uv');
const minmaxEl = document.getElementById('minmax');
const hourlyEl = document.getElementById('hourly');
const dailyEl = document.getElementById('daily');
const tzEl = document.getElementById('tz');
const unitC = document.getElementById('unitC');
const unitF = document.getElementById('unitF');

let map = null, marker = null;

function fmtDate(ts){return moment(ts*1000).format('dddd, MMM D, YYYY');}
function fmtTime(ts){return moment(ts*1000).format('h:mm A');}
function toTempLabel(v){return units==='metric'?Math.round(v)+'°C':Math.round((v*9/5)+32)+'°F';}
function toWindLabel(s){return units==='metric'?Math.round(s*3.6)+' km/h':Math.round(s*2.237)+' mph';}

function setLoading(msg){
  hourlyEl.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`;
  dailyEl.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`;
}
function showError(msg){
  hourlyEl.innerHTML = `<div class="loading">${msg}</div>`;
  dailyEl.innerHTML = `<div class="loading">${msg}</div>`;
}

function placeMap(lat, lon, title=''){
  if (!map){
    map = L.map('map').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);
  } else map.setView([lat, lon], 10);
  if (marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map).bindPopup(title).openPopup();
}

async function fetchCityWeather(q){
  try{
    setLoading('Fetching weather…');
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=${units}&appid=${API_KEY}`;
    const curRes = await fetch(curUrl);
    const cur = await curRes.json();
    if (!curRes.ok) throw new Error(cur.message||'Current weather failed');

    const fUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&units=${units}&appid=${API_KEY}`;
    const fRes = await fetch(fUrl);
    const forecast = await fRes.json();
    if (!fRes.ok) throw new Error(forecast.message||'Forecast failed');

    render(cur, forecast);
  }catch(err){
    console.error(err);
    showError('Unable to load weather. Try another city or check API key.');
    placeEl.textContent='—';dateEl.textContent='—';lastUpdEl.textContent='Last updated: —';
  }
}

async function fetchCoordsWeather(lat, lon){
  try{
    setLoading('Fetching weather for your location…');
    const curUrl=`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const curRes=await fetch(curUrl);const cur=await curRes.json();
    if(!curRes.ok)throw new Error(cur.message||'Current weather failed');

    const fUrl=`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const fRes=await fetch(fUrl);const forecast=await fRes.json();
    if(!fRes.ok)throw new Error(forecast.message||'Forecast failed');

    render(cur, forecast);
  }catch(err){
    console.error(err);
    showError('Unable to load weather for coordinates.');
  }
}

function render(current, forecast){
  placeEl.textContent=`${current.name}, ${current.sys.country||''}`.trim();
  dateEl.textContent=fmtDate(current.dt);
  lastUpdEl.textContent=`Last updated: ${moment().format('lll')}`;
  iconEl.src=`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
  iconEl.alt=current.weather[0].description||'weather';
  tempEl.textContent=toTempLabel(current.main.temp);
  descEl.textContent=current.weather[0].description||'—';
  feelEl.textContent=`Feels ${toTempLabel(current.main.feels_like)}`;
  pressEl.textContent=`Pressure ${current.main.pressure} hPa`;
  windEl.textContent=toWindLabel(current.wind.speed);
  humEl.textContent
