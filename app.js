const COORDS = {
  'Living Room': [42, 22],
  'Kitchen': [63, 50],
  'Rotunda': [50, 43],
  'Dining Room': [69, 62],
  'Hall Bathroom': [50, 62],
  'Master Bathroom': [79, 37],
  'Bedroom 1': [31, 46],
  'Bedroom 2': [31, 63],
  'Office': [76, 84],
  'Laundry Room': [53, 83]
};

const roomList = document.getElementById('roomList');
const planWrap = document.getElementById('planWrap');
const updatedAt = document.getElementById('updatedAt');

function bucket(days, last) {
  if (!last) return ['n', 'Never'];
  if (days < 1) return ['g', '<24h'];
  if (days < 3) return ['y', '1-3d'];
  if (days < 7) return ['o', '3-7d'];
  return ['r', '7+d'];
}

function daysAgo(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 86400000;
}

function fmtAgo(days) {
  if (days == null) return 'never';
  if (days < 1) return `${Math.round(days * 24)}h ago`;
  return `${days.toFixed(1)}d ago`;
}

function clearMarkers(){
  planWrap.querySelectorAll('.marker').forEach(m=>m.remove());
}

function addMarker(name, cls, label){
  const xy = COORDS[name];
  if (!xy) return;
  const m = document.createElement('div');
  m.className = `marker ${cls}`;
  m.style.left = `${xy[0]}%`;
  m.style.top = `${xy[1]}%`;
  m.textContent = `${name} • ${label}`;
  planWrap.appendChild(m);
}

async function load(){
  const res = await fetch(`state.json?ts=${Date.now()}`, { cache: 'no-store' });
  const data = await res.json();

  updatedAt.textContent = `State updated: ${new Date(data.updated_at).toLocaleString()} (auto refresh every 5 min)`;

  const rooms = (data.rooms || []).map(r => {
    const d = daysAgo(r.last_cleaned_at);
    const [cls, label] = bucket(d, r.last_cleaned_at);
    return { ...r, days: d, cls, label };
  }).sort((a,b)=> (b.days ?? 9999) - (a.days ?? 9999));

  roomList.innerHTML = '';
  clearMarkers();

  rooms.forEach(r => {
    const item = document.createElement('div');
    item.className = 'room';
    item.innerHTML = `<div class="name">${r.name} <span class="dot ${r.cls}"></span></div>
      <div class="meta">${r.label} • ${fmtAgo(r.days)} • cleaned ${r.clean_count || 0} times</div>`;
    roomList.appendChild(item);
    addMarker(r.name, r.cls, r.label);
  });
}

load().catch(err => {
  updatedAt.textContent = `Failed to load state.json: ${err.message}`;
});
setInterval(load, 5 * 60 * 1000);
