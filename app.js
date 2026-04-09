const roomList = document.getElementById('roomList');
const updatedAt = document.getElementById('updatedAt');

const zoneByRoom = Object.fromEntries(
  Array.from(document.querySelectorAll('.room-zone')).map((zone) => [
    zone.dataset.room,
    zone,
  ])
);

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

function resetZones() {
  Object.values(zoneByRoom).forEach((zone) => {
    zone.classList.remove('g', 'y', 'o', 'r', 'n');
    zone.classList.add('n');
  });
}

function colorZone(roomName, cls, label, days) {
  const zone = zoneByRoom[roomName];
  if (!zone) return;
  zone.classList.remove('g', 'y', 'o', 'r', 'n');
  zone.classList.add(cls);

  const title = zone.querySelector('title');
  if (title) {
    title.textContent = `${roomName} • ${label} • ${fmtAgo(days)}`;
  }
}

async function load() {
  const res = await fetch(`state.json?ts=${Date.now()}`, { cache: 'no-store' });
  const data = await res.json();

  updatedAt.textContent = `State updated: ${new Date(data.updated_at).toLocaleString()} (auto refresh every 5 min)`;

  const rooms = (data.rooms || [])
    .map((r) => {
      const d = daysAgo(r.last_cleaned_at);
      const [cls, label] = bucket(d, r.last_cleaned_at);
      return { ...r, days: d, cls, label };
    })
    .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));

  roomList.innerHTML = '';
  resetZones();

  rooms.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'room';
    item.innerHTML = `<div class="name">${r.name} <span class="dot ${r.cls}"></span></div>
      <div class="meta">${r.label} • ${fmtAgo(r.days)} • cleaned ${r.clean_count || 0} times</div>`;
    roomList.appendChild(item);
    colorZone(r.name, r.cls, r.label, r.days);
  });
}

load().catch((err) => {
  updatedAt.textContent = `Failed to load state.json: ${err.message}`;
});
setInterval(load, 5 * 60 * 1000);
