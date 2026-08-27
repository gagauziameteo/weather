document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

const CITIES = [
  { id:'comrat', name:'Комрат', ru:'столица АТО Гагаузия', lat:46.2996, lon:28.6560, dot:'var(--dot-amber)' },
  { id:'ceadir', name:'Чадыр-Лунга', ru:'второй по величине город', lat:46.0567, lon:28.8194, dot:'var(--dot-indigo)' },
  { id:'vulcanesti', name:'Вулканешты', ru:'южные ворота Гагаузии', lat:45.6903, lon:28.4139, dot:'var(--dot-grey)' },
];

const WCODE = {
  0:['☀️','Ясно'], 1:['🌤️','Малооблачно'], 2:['⛅','Переменная облачность'], 3:['☁️','Пасмурно'],
  45:['🌫️','Туман'], 48:['🌫️','Изморозь'],
  51:['🌦️','Слабая морось'], 53:['🌦️','Морось'], 55:['🌧️','Сильная морось'],
  56:['🌧️','Ледяная морось'], 57:['🌧️','Сильная ледяная морось'],
  61:['🌦️','Небольшой дождь'], 63:['🌧️','Дождь'], 65:['🌧️','Сильный дождь'],
  66:['🌧️','Ледяной дождь'], 67:['🌧️','Сильный ледяной дождь'],
  71:['🌨️','Небольшой снег'], 73:['❄️','Снег'], 75:['❄️','Сильный снег'], 77:['❄️','Снежные зёрна'],
  80:['🌦️','Ливень'], 81:['🌧️','Сильный ливень'], 82:['⛈️','Очень сильный ливень'],
  85:['🌨️','Снежный ливень'], 86:['❄️','Сильный снежный ливень'],
  95:['⛈️','Гроза'], 96:['⛈️','Гроза с градом'], 99:['⛈️','Сильная гроза с градом'],
};
function wInfo(code){ return WCODE[code] || ['—','Нет данных']; }

function dayName(dateStr, idx){
  if(idx===0) return 'Сегодня';
  if(idx===1) return 'Завтра';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { weekday:'short' }).replace('.','');
}

function windDir(deg){
  const dirs = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];
  return dirs[Math.round(deg/45)%8];
}

const tabsEl = document.getElementById('stationTabs');
const panelsEl = document.getElementById('panels');
const statusEl = document.getElementById('globalStatus');

if(tabsEl && panelsEl){
  CITIES.forEach((c,i)=>{
    const tab = document.createElement('button');
    tab.className = 'station-tab' + (i===0?' active':'');
    tab.id = 'tab-' + c.id;
    tab.style.setProperty('--dot', c.dot);
    tab.innerHTML = `<span class="n">Станция 0${i+1}</span><span class="city">${c.name}</span><span class="temp-preview" id="preview-${c.id}">—</span>`;
    tab.addEventListener('click', ()=> showPanel(c.id));
    tabsEl.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'panel' + (i===0?' active':'');
    panel.id = 'panel-' + c.id;
    panel.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>${c.name}</h2>
          <div class="coords">${c.lat.toFixed(4)}° N, ${c.lon.toFixed(4)}° E · ${c.ru}</div>
        </div>
        <div class="status-line" id="status-${c.id}">загрузка…</div>
      </div>
      <div id="content-${c.id}"><div class="loading">Получаем данные…</div></div>
    `;
    panelsEl.appendChild(panel);
  });
}

function showPanel(id){
  document.querySelectorAll('.station-tab').forEach(t=>t.classList.toggle('active', t.id === 'tab-'+id));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id === 'panel-'+id));
}

async function loadCity(c){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('network');
  return res.json();
}

function renderCity(c, data){
  const cur = data.current;
  const [icon, desc] = wInfo(cur.weather_code);

  document.getElementById('preview-'+c.id).textContent = `${Math.round(cur.temperature_2m)}°C · ${icon}`;

  const content = document.getElementById('content-'+c.id);
  content.innerHTML = `
    <div class="now-grid">
      <div class="now-cell hero-cell">
        <span class="label">Сейчас</span>
        <span class="value">${Math.round(cur.temperature_2m)}<span class="unit">°C</span></span>
        <div class="desc">${icon} ${desc}</div>
      </div>
      <div class="now-cell">
        <span class="label">Ощущается</span>
        <span class="value">${Math.round(cur.apparent_temperature)}<span class="unit">°C</span></span>
        <div class="desc">по ощущениям</div>
      </div>
      <div class="now-cell">
        <span class="label">Ветер</span>
        <span class="value">${Math.round(cur.wind_speed_10m)}<span class="unit">км/ч</span></span>
        <div class="desc">${windDir(cur.wind_direction_10m)}, порывистый</div>
      </div>
      <div class="now-cell">
        <span class="label">Влажность</span>
        <span class="value">${Math.round(cur.relative_humidity_2m)}<span class="unit">%</span></span>
        <div class="desc">давление ${Math.round(cur.surface_pressure)} гПа</div>
      </div>
    </div>
    <div class="section-label">Прогноз на 5 дней</div>
    <div class="forecast-row">
      ${data.daily.time.map((date, idx)=>{
        const [dicon] = wInfo(data.daily.weather_code[idx]);
        const hi = Math.round(data.daily.temperature_2m_max[idx]);
        const lo = Math.round(data.daily.temperature_2m_min[idx]);
        return `<div class="day-card">
          <div class="dname">${dayName(date, idx)}</div>
          <div class="dicon">${dicon}</div>
          <div class="drange">${hi}° <span class="lo">${lo}°</span></div>
        </div>`;
      }).join('')}
    </div>
  `;

  const now = new Date();
  document.getElementById('status-'+c.id).textContent = `обновлено в ${now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}`;
}

function positionSun(){
  const hour = new Date().getHours() + new Date().getMinutes()/60;
  const pct = Math.max(0.06, Math.min(0.86, (hour - 5) / 15));
  const sun = document.getElementById('sun');
  if(!sun) return;
  sun.style.left = (pct*100) + '%';
  sun.style.right = 'auto';
  const isNight = hour < 5.5 || hour > 20.5;
  if(isNight){ sun.style.opacity = '0.25'; }
}
positionSun();

if(tabsEl && panelsEl){
  (async function init(){
    await Promise.all(CITIES.map(async (c)=>{
      try{
        const data = await loadCity(c);
        renderCity(c, data);
      }catch(e){
        document.getElementById('content-'+c.id).innerHTML = `<div class="error">Не удалось загрузить данные для ${c.name}. Проверьте подключение к интернету и обновите страницу.</div>`;
        document.getElementById('status-'+c.id).textContent = 'ошибка';
      }
    }));
    if(statusEl) statusEl.style.display = 'none';
  })();
}
