// Home Hub v1 — sample data first. We'll connect live Google data next.
const sampleToday = [
  { time: '8:00', title: 'Family breakfast' },
  { time: '10:30', title: 'Errands / grocery pickup' },
  { time: '6:00', title: 'Dinner' }
];
const sampleTodos = ['Water outdoor plants', 'Take trash to curb', 'Schedule appointments'];
const sampleGroceries = ['Milk', 'Eggs', 'Bread', 'Fruit'];
const weather = { temp: 78, condition: 'Partly cloudy', high: 82, low: 66, rain: '20%', wind: '7 mph' };
function updateClock(){
  const now = new Date();
  document.getElementById('time').textContent = now.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  document.getElementById('date').textContent = now.toLocaleDateString([], {weekday:'long', month:'long', day:'numeric'});
}
function renderToday(){
  document.getElementById('todayList').innerHTML = sampleToday.map(e => `<li><span>${e.title}</span><span class="item-time">${e.time}</span></li>`).join('');
}
function renderLists(){
  document.getElementById('todoList').innerHTML = sampleTodos.map(x => `<li>${x}</li>`).join('');
  document.getElementById('groceryList').innerHTML = sampleGroceries.map(x => `<li>${x}</li>`).join('');
}
function renderWeather(){
  document.getElementById('temp').textContent = `${weather.temp}°`;
  document.getElementById('condition').textContent = weather.condition;
  document.getElementById('weatherDetails').innerHTML = [
    ['High', `${weather.high}°`], ['Low', `${weather.low}°`], ['Rain', weather.rain], ['Wind', weather.wind]
  ].map(r => `<div class="detail-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('');
}
function renderWeek(){
  const start = new Date();
  const days = Array.from({length:7}, (_, i)=>{ const d=new Date(start); d.setDate(start.getDate()+i); return d; });
  document.getElementById('weekList').innerHTML = days.map((d,i)=>`
    <div class="day">
      <div class="day-name">${d.toLocaleDateString([], {weekday:'short'})}</div>
      <div class="day-date">${d.getDate()}</div>
      <div class="day-event">${i===0?'Family calendar': i===2?'Trash day':''}</div>
      <div class="day-event">${i===4?'Meal plan':''}</div>
    </div>`).join('');
}
updateClock(); setInterval(updateClock, 1000);
renderToday(); renderLists(); renderWeather(); renderWeek();
