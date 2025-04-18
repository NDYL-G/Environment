const latitude = 50.4;
const longitude = -5.0;

// --- Weather: Open-Meteo ---
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
  .then(res => res.json())
  .then(data => {
    const weather = data.current_weather;

    // Temperature
    const celsius = weather.temperature;
    const fahrenheit = Math.round(celsius * 9 / 5 + 32);
    document.getElementById('temperature').textContent = `${celsius}°C / ${fahrenheit}°F`;

    // Thermometer fill
    const scale = 80 / 40; // SVG height range from -10°C to 30°C
    const height = Math.min(Math.max((celsius + 10) * scale, 0), 80);
    const y = 90 - height;
    const fill = document.getElementById("thermo-fill");
    fill.setAttribute("height", height);
    fill.setAttribute("y", y);

    // Wind speed
    const kmh = weather.windspeed;
    const mph = Math.round(kmh * 0.621371);
    document.getElementById('wind').textContent = `${mph} mph / ${kmh} km/h`;

    // Wind direction
    const arrow = document.querySelector('#wind-direction img');
    arrow.style.transform = `rotate(${weather.winddirection}deg)`;

    // Weather icon selection
    const iconMap = {
      0: "clear-day",
      1: "partly-cloudy",
      2: "cloudy",
      3: "rain",
      45: "fog",
      61: "rain",
      71: "snow",
      95: "thunderstorm"
    };
    const condition = iconMap[weather.weathercode] || "clear-day";
    document.getElementById('weather-icon').src = `svg/weather/${condition}.svg`;
  })
  .catch(err => {
    document.getElementById('temperature').textContent = "Weather unavailable.";
    console.error("Weather error:", err);
  });

// --- Moon Phase: WeatherAPI ---
const weatherApiKey = "92d5ca8a8ff247aa805142432251804";

fetch(`https://api.weatherapi.com/v1/astronomy.json?key=${weatherApiKey}&q=Cornwall&dt=today`)
  .then(res => res.json())
  .then(data => {
    const phaseName = data.astronomy?.astro?.moon_phase;
    if (phaseName) {
      const phaseFile = phaseName.toLowerCase().replace(/\s+/g, "-");
      document.getElementById('moon-content').textContent = phaseName;
      document.getElementById('moon-icon').src = `svg/moon/${phaseFile}.svg`;
    }
  })
  .catch(err => {
    document.getElementById('moon-content').textContent = "Moon phase unavailable.";
    console.error("Moon phase error:", err);
  });

// --- Tides: Storm Glass + Wave Chart ---
const stormGlassApiKey = "7d1d0136-1c61-11f0-9606-0242ac130003-7d1d019a-1c61-11f0-9606-0242ac130003";
const now = new Date().toISOString();

fetch(`https://api.stormglass.io/v2/tide/extremes/point?lat=${latitude}&lng=${longitude}&start=${now}`, {
  headers: { 'Authorization': stormGlassApiKey }
})
  .then(res => res.json())
  .then(data => {
    const tides = data.data;
    if (!tides || tides.length === 0) return;

    // Update text content
    const content = tides.slice(0, 2).map(t => {
      const time = new Date(t.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `${t.type === 'high' ? '↑ High' : '↓ Low'} tide at ${time} — ${t.height.toFixed(1)}m`;
    }).join('<br>');
    document.getElementById('tide-content').innerHTML = content;

    // Build dynamic wave chart
    const chart = document.getElementById('tide-chart');
    chart.innerHTML = ''; // clear
    const min = 0.5, max = 6.5;
    const scale = 40 / (max - min); // px per meter

    // Base wave line
    const wavePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    wavePath.setAttribute("d", `
      M0 50 
      Q30 30, 60 50 
      T120 50 
      T180 50 
      T240 50
    `);
    wavePath.setAttribute("stroke", "#FD9803");
    wavePath.setAttribute("stroke-width", "3");
    wavePath.setAttribute("fill", "none");
    chart.appendChild(wavePath);

    // Add tide markers
    tides.slice(0, 2).forEach((tide, i) => {
      const x = 60 + i * 80;
      const h = (tide.height - min) * scale;
      const y = 60 - h;

      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("cx", x);
      marker.setAttribute("cy", y);
      marker.setAttribute("r", "6");
      marker.setAttribute("fill", tide.type === 'high' ? "#FD9803" : "#112656");
      chart.appendChild(marker);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y - 10);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "12");
      label.setAttribute("fill", "#112656");
      label.textContent = `${tide.height.toFixed(1)}m`;
      chart.appendChild(label);
    });
  })
  .catch(err => {
    document.getElementById('tide-content').textContent = "Tide data unavailable.";
    console.error("Tide data error:", err);
  });
