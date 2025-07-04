// OpenWeatherMap API Key
const API_KEY = 'da17e7241a82eeb5df6ee7dc849e73c3';

// DOM elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');

// Weather elements
const cityEl = document.getElementById('city');
const dateEl = document.getElementById('date');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('description');
const iconEl = document.getElementById('weather-icon');
const windEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const feelsLikeEl = document.getElementById('feels-like');
const pressureEl = document.getElementById('pressure');
const hourlyContainer = document.getElementById('hourly-forecast');
const dailyContainer = document.getElementById('daily-forecast');

// Initialize the map
let map = null;
let marker = null;

// Initialize with metric units
let currentUnit = 'metric';

// Format date
function formatDate(timestamp) {
    return moment(timestamp * 1000).format('dddd, MMMM D, YYYY');
}

// Format time
function formatTime(timestamp) {
    return moment(timestamp * 1000).format('h:mm A');
}

// Format day name
function formatDay(timestamp) {
    return moment(timestamp * 1000).format('ddd');
}

// Convert temperature based on unit
function convertTemp(temp) {
    if (currentUnit === 'metric') {
        return `${Math.round(temp)}°C`;
    } else {
        return `${Math.round((temp * 9/5) + 32)}°F`;
    }
}

// Convert wind speed based on unit
function convertWindSpeed(speed) {
    if (currentUnit === 'metric') {
        return `${Math.round(speed * 3.6)} km/h`;
    } else {
        return `${Math.round(speed * 2.237)} mph`;
    }
}

// Initialize map
function initMap(lat, lon) {
    if (map === null) {
        map = L.map('map').setView([lat, lon], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 11);
    }
    
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`${cityEl.textContent}`)
        .openPopup();
}

// Fetch weather data
async function fetchWeather(city) {
    try {
        // Show loading state
        hourlyContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading hourly forecast...</div>';
        dailyContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading daily forecast...</div>';
        
        // Fetch current weather
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`);
        const currentData = await currentRes.json();
        
        if (currentData.cod !== 200) {
            throw new Error(currentData.message || 'City not found');
        }
        
        // Fetch forecast
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`);
        const forecastData = await forecastRes.json();
        
        if (forecastData.cod !== '200') {
            throw new Error(forecastData.message || 'Forecast not available');
        }
        
        // Update UI
        updateWeatherUI(currentData, forecastData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        hourlyContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
        dailyContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        // Show loading state
        hourlyContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading hourly forecast...</div>';
        dailyContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading daily forecast...</div>';
        
        // Fetch current weather
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`);
        const currentData = await currentRes.json();
        
        if (currentData.cod !== 200) {
            throw new Error(currentData.message || 'Location not available');
        }
        
        // Fetch forecast
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`);
        const forecastData = await forecastRes.json();
        
        if (forecastData.cod !== '200') {
            throw new Error(forecastData.message || 'Forecast not available');
        }
        
        // Update UI
        updateWeatherUI(currentData, forecastData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        hourlyContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
        dailyContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}

// Update UI with weather data
function updateWeatherUI(currentData, forecastData) {
    // Update current weather
    cityEl.textContent = `${currentData.name}, ${currentData.sys.country}`;
    dateEl.textContent = formatDate(currentData.dt);
    tempEl.textContent = convertTemp(currentData.main.temp);
    descEl.textContent = currentData.weather[0].description;
    iconEl.src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
    windEl.textContent = convertWindSpeed(currentData.wind.speed);
    humidityEl.textContent = `${currentData.main.humidity}%`;
    feelsLikeEl.textContent = convertTemp(currentData.main.feels_like);
    pressureEl.textContent = `${currentData.main.pressure} hPa`;
    
    // Update map
    initMap(currentData.coord.lat, currentData.coord.lon);
    
    // Update hourly forecast
    hourlyContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const hourData = forecastData.list[i];
        const hourEl = document.createElement('div');
        hourEl.className = 'hour-card animate';
        hourEl.style.animationDelay = `${i * 0.05}s`;
        hourEl.innerHTML = `
            <div class="hour-time">${formatTime(hourData.dt)}</div>
            <img src="https://openweathermap.org/img/wn/${hourData.weather[0].icon}.png" alt="Weather">
            <div class="hour-temp">${convertTemp(hourData.main.temp)}</div>
        `;
        hourlyContainer.appendChild(hourEl);
    }
    
    // Update daily forecast
    dailyContainer.innerHTML = '';
    // Group forecast by day
    const dailyForecast = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!dailyForecast[day]) {
            dailyForecast[day] = {
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max,
                icon: item.weather[0].icon
            };
        } else {
            if (item.main.temp_min < dailyForecast[day].minTemp) {
                dailyForecast[day].minTemp = item.main.temp_min;
            }
            if (item.main.temp_max > dailyForecast[day].maxTemp) {
                dailyForecast[day].maxTemp = item.main.temp_max;
            }
        }
    });
    
    // Display next 5 days
    const days = Object.keys(dailyForecast).slice(0, 5);
    days.forEach((day, index) => {
        const dayData = dailyForecast[day];
        const dayEl = document.createElement('div');
        dayEl.className = 'day-card animate';
        dayEl.style.animationDelay = `${index * 0.1}s`;
        dayEl.innerHTML = `
            <div class="day-name">${day}</div>
            <div class="day-weather">
                <img src="https://openweathermap.org/img/wn/${dayData.icon}.png" alt="Weather">
            </div>
            <div class="day-temp">
                <span style="color: var(--primary);">${convertTemp(dayData.maxTemp)}</span> / 
                <span style="opacity: 0.7;">${convertTemp(dayData.minTemp)}</span>
            </div>
        `;
        dailyContainer.appendChild(dayEl);
    });
}

// Unit toggle
function toggleUnit(unit) {
    currentUnit = unit;
    
    // Update active button
    celsiusBtn.classList.toggle('active', unit === 'metric');
    fahrenheitBtn.classList.toggle('active', unit === 'imperial');
    
    // Get current city and fetch with new units
    const currentCity = cityEl.textContent.split(',')[0].trim();
    fetchWeather(currentCity);
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeather(city);
        searchInput.value = '';
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            fetchWeather(city);
            searchInput.value = '';
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        }, error => {
            console.error('Geolocation error:', error);
            hourlyContainer.innerHTML = `<div class="error-message">Geolocation error: ${error.message}</div>`;
            dailyContainer.innerHTML = `<div class="error-message">Geolocation error: ${error.message}</div>`;
        });
    } else {
        hourlyContainer.innerHTML = '<div class="error-message">Geolocation is not supported by your browser</div>';
        dailyContainer.innerHTML = '<div class="error-message">Geolocation is not supported by your browser</div>';
    }
});

celsiusBtn.addEventListener('click', () => toggleUnit('metric'));
fahrenheitBtn.addEventListener('click', () => toggleUnit('imperial'));

// Initialize with default city
fetchWeather('New York');
