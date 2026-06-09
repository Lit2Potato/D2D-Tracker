const STORAGE_KEY = 'door-knock-tracker-v1';

const statusMeta = {
  A: { name: 'Hot lead', className: 'hot' },
  B: { name: 'Warm/maybe', className: 'warm' },
  C: { name: 'Closed/no', className: 'closed' },
  D1: { name: 'No answer 1', className: 'd1' },
  D2: { name: 'No answer 2', className: 'd2' },
  D3: { name: 'No answer 3', className: 'd3' },
  Booked: { name: 'Booked', className: 'booked' },
  Completed: { name: 'Completed', className: 'completed' },
};

const statuses = Object.keys(statusMeta);
const services = ['Lawn mowing (no bag)', 'Lawn mowing (with bag)', 'Weeding', 'Interlock resanding', 'Window cleaning', 'Snow shoveling', 'Other'];
const recurringSchedules = ['Unsure', 'One-off', 'Weekly', 'Bi-weekly', 'Monthly', 'Seasonal', 'As needed', 'Other'];
const transportMethods = ['Unsure', 'Walking', 'Biking', 'E-bike', 'Car', 'Other'];
const followStatuses = ['A', 'B', 'D1', 'D2'];

const DAILY_TUTORIAL = {
  title: 'Daily Door-to-Door Workflow',
  steps: [
    'Start by choosing the street or area you want to knock today.',
    'Add each house as you go, using the address or house number.',
    'Mark the result right after each door.',
    'Use notes for anything important: has interlock, big lawn, nice homeowner, asked me to come back, or already has a lawn guy.',
    'At the end of the session, check your follow-ups and plan which D1/D2 houses to revisit.',
    'The goal is to avoid wasting houses just because nobody answered the first time.',
  ],
  statuses: [
    ['A', 'answered / good conversation / potential lead'],
    ['B', 'answered but not interested right now'],
    ['C', 'clear no / do not focus on this house'],
    ['D1', 'no answer, first attempt'],
    ['D2', 'no answer, second attempt'],
    ['D3', 'no answer, third attempt, stop knocking for now'],
  ],
};

const emptyDoor = {
  addressNumber: '',
  street: '',
  unit: '',
  status: 'D1',
  homeowner: '',
  phone: '',
  service: 'Lawn mowing (no bag)',
  services: [],
  recurringSchedule: 'Unsure',
  transportMethod: 'Unsure',
  priceQuoted: '',
  estimatedValue: '',
  lastKnocked: '',
  nextFollowUp: '',
  notes: '',
  history: [],
};

function normalizeServices(door = {}) {
  if (Array.isArray(door.services)) return door.services.map((service) => String(service).trim()).filter(Boolean);
  if (typeof door.services === 'string' && door.services.trim()) return splitServices(door.services);
  if (typeof door.service === 'string' && door.service.trim()) return splitServices(door.service);
  if (typeof door.serviceInterestedIn === 'string' && door.serviceInterestedIn.trim()) return splitServices(door.serviceInterestedIn);
  return [];
}

function normalizeDoor(door = {}) {
  const selectedServices = normalizeServices(door);
  return {
    ...emptyDoor,
    ...door,
    service: selectedServices[0] || door.service || '',
    services: selectedServices,
    recurringSchedule: recurringSchedules.includes(door?.recurringSchedule) ? door.recurringSchedule : 'Unsure',
    transportMethod: transportMethods.includes(door?.transportMethod) ? door.transportMethod : 'Unsure',
    history: Array.isArray(door?.history) ? door.history : [],
  };
}

function splitServices(value) {
  return String(value || '')
    .split(';')
    .map((service) => service.trim())
    .filter(Boolean);
}

function joinServices(value) {
  return normalizeServices({ services: value }).join('; ');
}

function displayServices(door) {
  return normalizeServices(door).join(', ') || 'No service selected';
}

function serviceOptionsFor(value) {
  const selected = normalizeServices({ services: value });
  return [...selected.filter((service) => !services.includes(service)), ...services];
}

const savedDoors = loadDoors();
let doors = savedDoors.map(normalizeDoor);
if (JSON.stringify(savedDoors) !== JSON.stringify(doors)) saveDoors();
let activeView = 'route';
let editingId = null;
let filters = { query: '', street: '', status: '', service: '', recurringSchedule: '', transportMethod: '', followUp: '', knockedToday: false };
let isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

const app = document.querySelector('#app');

function nowIso() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function dollars(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function loadDoors() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveDoors() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doors));
}

function historyItem(status, note) {
  return { id: crypto.randomUUID(), at: nowIso(), status, note };
}

function setView(view) {
  activeView = view;
  render();
}

function addDemoData() {
  const sample = [
    {
      ...emptyDoor,
      id: crypto.randomUUID(),
      addressNumber: '42',
      street: 'Maple Ave',
      status: 'A',
      homeowner: 'Sam',
      phone: '555-0142',
      service: 'Interlock resanding',
      services: ['Interlock resanding'],
      recurringSchedule: 'One-off',
      transportMethod: 'Car',
      priceQuoted: '450',
      estimatedValue: '450',
      lastKnocked: nowIso(),
      nextFollowUp: today(),
      notes: 'Asked for a quote after seeing the driveway.',
      history: [historyItem('A', 'Interested in spring work')],
    },
    {
      ...emptyDoor,
      id: crypto.randomUUID(),
      addressNumber: '55',
      street: 'Maple Ave',
      status: 'D2',
      service: 'Lawn mowing (no bag)',
      services: ['Lawn mowing (no bag)'],
      recurringSchedule: 'Weekly',
      transportMethod: 'Walking',
      lastKnocked: nowIso(),
      nextFollowUp: today(),
      notes: 'Try evening next time.',
      history: [historyItem('D1', 'No answer'), historyItem('D2', 'No answer again')],
    },
    {
      ...emptyDoor,
      id: crypto.randomUUID(),
      addressNumber: '18',
      street: 'Cedar Court',
      status: 'Booked',
      homeowner: 'Priya',
      service: 'Window cleaning',
      services: ['Window cleaning'],
      recurringSchedule: 'Monthly',
      transportMethod: 'Biking',
      priceQuoted: '180',
      estimatedValue: '180',
      lastKnocked: nowIso(),
      notes: 'Booked for Saturday morning.',
      history: [historyItem('B', 'Wanted spouse to confirm'), historyItem('Booked', 'Booked job')],
    },
  ];
  doors = [...sample, ...doors];
  saveDoors();
  render();
}

function stats() {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
  doors.forEach((door) => {
    counts[door.status] = (counts[door.status] || 0) + 1;
  });
  const answered = doors.filter((door) => ['A', 'B', 'C', 'Booked', 'Completed'].includes(door.status)).length;
  const revenue = doors
    .filter((door) => ['Booked', 'Completed'].includes(door.status))
    .reduce((total, door) => total + Number(door.estimatedValue || door.priceQuoted || 0), 0);
  return {
    knockedToday: doors.filter((door) => dateOnly(door.lastKnocked) === today()).length,
    total: doors.length,
    counts,
    answerRate: doors.length ? Math.round((answered / doors.length) * 100) : 0,
    hot: counts.A || 0,
    booked: (counts.Booked || 0) + (counts.Completed || 0),
    revenue,
  };
}

function filteredDoors() {
  const query = filters.query.toLowerCase().trim();
  return doors.filter((door) => {
    const doorServices = normalizeServices(door);
    const haystack = [door.addressNumber, door.street, door.unit, door.homeowner, door.phone, doorServices.join(' '), door.recurringSchedule, door.transportMethod, door.notes].join(' ').toLowerCase();
    return (
      (!query || haystack.includes(query)) &&
      (!filters.street || door.street.toLowerCase().includes(filters.street.toLowerCase())) &&
      (!filters.status || door.status === filters.status) &&
      (!filters.service || doorServices.includes(filters.service)) &&
      (!filters.recurringSchedule || door.recurringSchedule === filters.recurringSchedule) &&
      (!filters.transportMethod || door.transportMethod === filters.transportMethod) &&
      (!filters.followUp || door.nextFollowUp === filters.followUp) &&
      (!filters.knockedToday || dateOnly(door.lastKnocked) === today())
    );
  });
}

function routeDoors() {
  const rank = { A: 0, B: 1, D2: 2, D1: 3 };
  return [...doors]
    .filter((door) => followStatuses.includes(door.status))
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || `${a.street}${a.addressNumber}`.localeCompare(`${b.street}${b.addressNumber}`));
}

function dueDoors() {
  return filteredDoors()
    .filter((door) => followStatuses.includes(door.status) && (!door.nextFollowUp || door.nextFollowUp <= today()))
    .sort((a, b) => (a.nextFollowUp || '').localeCompare(b.nextFollowUp || ''));
}

function render() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Field tracker</p>
        <h1>Door Knock Tracker</h1>
      </div>
      <button class="iconButton" data-action="open-form" title="Add door">+</button>
    </header>
    ${isOffline ? '<div class="offlineNotice">Offline mode: saved doors still work on this device. Export a CSV when you reconnect.</div>' : ''}
    <main>${viewHtml()}</main>
    <button class="fab" data-action="open-form">+ Add Door</button>
    <nav class="tabs">
      ${tabButton('route', 'Route')}
      ${tabButton('doors', 'Doors')}
      ${tabButton('follow', 'Due')}
      ${tabButton('dashboard', 'Stats')}
      ${tabButton('settings', 'Settings')}
    </nav>
  `;
}

function tabButton(view, label) {
  return `<button class="tab ${activeView === view ? 'active' : ''}" data-view="${view}"><span>${label}</span></button>`;
}

function viewHtml() {
  if (activeView === 'dashboard') return dashboardHtml();
  if (activeView === 'doors') return doorsHtml();
  if (activeView === 'follow') return listHtml('Follow-up due', dueDoors(), 'A, B, D1, and D2 houses due for attention show here.');
  if (activeView === 'settings') return settingsHtml();
  return listHtml("Today's route", routeDoors(), 'Add D1/D2 no-answers or A/B follow-ups to build a route.');
}

function dashboardHtml() {
  const s = stats();
  return `
    <section class="stack">
      <div class="statHero">
        <div><p class="eyebrow">Today</p><strong>${s.knockedToday}</strong><span>doors knocked</span></div>
        <div><p class="eyebrow">Overall</p><strong>${s.total}</strong><span>tracked doors</span></div>
      </div>
      <div class="metricGrid">
        <div class="metric"><span>Answer rate</span><strong>${s.answerRate}%</strong></div>
        <div class="metric"><span>Hot leads</span><strong>${s.hot}</strong></div>
        <div class="metric"><span>Booked jobs</span><strong>${s.booked}</strong></div>
        <div class="metric"><span>Est. revenue</span><strong>${dollars(s.revenue)}</strong></div>
      </div>
      <div class="statusGrid">
        ${statuses.map((status) => `<div class="statusCount ${statusMeta[status].className}"><span>${status}</span><strong>${s.counts[status] || 0}</strong><small>${statusMeta[status].name}</small></div>`).join('')}
      </div>
    </section>`;
}

function doorsHtml() {
  return `
    <section class="stack">
      <div class="searchPanel">
        <input data-filter="query" value="${escapeHtml(filters.query)}" placeholder="Search address, name, notes">
        <details>
          <summary>Filters</summary>
          <div class="filterGrid">
            <input data-filter="street" value="${escapeHtml(filters.street)}" placeholder="Street">
            <select data-filter="status">
              <option value="">Any status</option>
              ${statuses.map((status) => `<option ${filters.status === status ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
            <select data-filter="service">
              <option value="">Any service</option>
              ${serviceOptionsFor(filters.service).map((service) => `<option value="${escapeHtml(service)}" ${filters.service === service ? 'selected' : ''}>${escapeHtml(service)}</option>`).join('')}
            </select>
            <select data-filter="recurringSchedule">
              <option value="">Any recurring</option>
              ${recurringSchedules.map((schedule) => `<option ${filters.recurringSchedule === schedule ? 'selected' : ''}>${schedule}</option>`).join('')}
            </select>
            <select data-filter="transportMethod">
              <option value="">Any transport</option>
              ${transportMethods.map((method) => `<option ${filters.transportMethod === method ? 'selected' : ''}>${method}</option>`).join('')}
            </select>
            <input type="date" data-filter="followUp" value="${escapeHtml(filters.followUp)}">
            <label class="checkRow"><input type="checkbox" data-filter="knockedToday" ${filters.knockedToday ? 'checked' : ''}> Knocked today</label>
          </div>
        </details>
      </div>
      ${listHtml('Doors', filteredDoors(), 'Add a door or clear filters to see more houses.', false)}
    </section>`;
}

function listHtml(title, list, emptyText, wrap = true) {
  const body = `
    <div class="sectionTitle"><h2>${title}</h2><b>${list.length}</b></div>
    ${list.length ? list.map(doorCardHtml).join('') : `<div class="empty"><strong>Nothing here yet</strong><p>${emptyText}</p></div>`}
  `;
  return wrap ? `<section class="stack">${body}</section>` : body;
}

function badge(status) {
  const meta = statusMeta[status] || statusMeta.D1;
  return `<span class="badge ${meta.className}">${status} ${meta.name}</span>`;
}

function doorCardHtml(door) {
  const risky = door.status === 'C' || door.status === 'D3';
  const facts = [
    `Last: ${door.lastKnocked ? new Date(door.lastKnocked).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'}`,
    `Follow-up: ${door.nextFollowUp || 'None'}`,
    `Recurring: ${door.recurringSchedule || 'Unsure'}`,
    `Transport: ${door.transportMethod || 'Unsure'}`,
    door.priceQuoted || door.estimatedValue ? `Value: ${dollars(door.estimatedValue || door.priceQuoted)}` : '',
  ].filter(Boolean);
  return `
    <article class="doorCard">
      <div class="cardHead">
        <div>
          <h3>${escapeHtml(door.addressNumber)} ${escapeHtml(door.street)}</h3>
          <p>${escapeHtml([door.unit, door.homeowner, displayServices(door)].filter(Boolean).join(' - '))}</p>
        </div>
        ${badge(door.status)}
      </div>
      ${risky ? `<div class="warning">Heads up: this house is marked ${door.status}. Revisit only if you mean to.</div>` : ''}
      <div class="quickGrid">
        ${['A', 'B', 'C', 'D1', 'D2', 'D3'].map((status) => `<button class="quick ${statusMeta[status].className}" data-action="status" data-id="${door.id}" data-status="${status}">${status}</button>`).join('')}
      </div>
      <div class="actionRow">
        ${door.status === 'D1' || door.status === 'D2' ? `<button data-action="no-answer" data-id="${door.id}">No answer again</button>` : ''}
        ${['D1', 'D2', 'D3'].includes(door.status) ? `<button data-action="answered" data-id="${door.id}">Answered now</button>` : ''}
        ${door.status === 'D3' ? `<button data-action="reset-d3" data-id="${door.id}">Reset D3 to D1</button>` : ''}
      </div>
      <div class="cardFacts">${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join('')}</div>
      ${door.notes ? `<p class="notes">${escapeHtml(door.notes)}</p>` : ''}
      ${timelineHtml(door)}
      <div class="cardTools">
        <button data-action="edit" data-id="${door.id}">Edit</button>
        <button class="danger" data-action="delete" data-id="${door.id}">Delete</button>
      </div>
    </article>`;
}

function timelineHtml(door) {
  if (!door.history || !door.history.length) return '';
  return `
    <details class="timeline">
      <summary>Timeline</summary>
      ${door.history
        .slice()
        .reverse()
        .map((item) => `<div><span class="mini ${statusMeta[item.status]?.className || 'd1'}">${escapeHtml(item.status)}</span><span>${new Date(item.at).toLocaleString()}</span><small>${escapeHtml(item.note || '')}</small></div>`)
        .join('')}
    </details>`;
}

function settingsHtml() {
  return `
    <section class="stack">
      <div>
        <div class="sectionTitle"><h2>Backup & data</h2></div>
        <div class="settingsPanel">
          <button data-action="export">Export CSV</button>
          <label class="fileButton">Import CSV<input type="file" accept=".csv,text/csv" data-action="import"></label>
          <label class="fileButton">Replace from CSV<input type="file" accept=".csv,text/csv" data-action="replace-import"></label>
          <button data-action="demo">Add demo data</button>
          <button class="danger" data-action="clear">Clear local data</button>
        </div>
        <div class="tip"><strong>Backup before switching devices.</strong> Export CSV on this device, open the hosted app on the other device, then import that CSV there. Import adds missing houses and skips ones already saved. Replace from CSV swaps the current list after you confirm.</div>
      </div>
      <div>
        <div class="sectionTitle"><h2>Tutorial</h2></div>
        <div class="tutorialPanel">
          <div>
            <strong>Daily door-to-door use</strong>
            <p>A short rundown for using the tracker while walking a street.</p>
          </div>
          <button data-action="show-tutorial">Show Daily D2D Tutorial</button>
        </div>
      </div>
    </section>`;
}

function showTutorial() {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="modal">
      <section class="sheet tutorialSheet" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <div class="sheetHead">
          <h2 id="tutorial-title">${escapeHtml(DAILY_TUTORIAL.title)}</h2>
          <button type="button" class="iconButton" data-action="close-form">x</button>
        </div>
        <ol class="tutorialSteps">
          ${DAILY_TUTORIAL.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
        <div class="statusGuide">
          ${DAILY_TUTORIAL.statuses.map(([status, text]) => `<div><span class="mini ${statusMeta[status].className}">${status}</span><p>${escapeHtml(text)}</p></div>`).join('')}
        </div>
      </section>
    </div>`,
  );
}

function openForm(door = { ...emptyDoor }) {
  editingId = door.id || null;
  document.body.insertAdjacentHTML('beforeend', formHtml(door));
}

function formHtml(door) {
  return `
    <div class="modal">
      <form class="sheet" data-form>
        <div class="sheetHead">
          <h2>${door.id ? 'Edit door' : 'Add door'}</h2>
          <button type="button" class="iconButton" data-action="close-form">x</button>
        </div>
        <div class="twoCols">
          ${field('Number', 'addressNumber', door.addressNumber, 'text', true)}
          ${field('Street', 'street', door.street, 'text', true)}
        </div>
        ${field('Unit / quick note', 'unit', door.unit)}
        <div class="statusPicker">
          ${statuses.map((status) => `<button type="button" class="${door.status === status ? `selected ${statusMeta[status].className}` : ''}" data-pick-status="${status}">${status}</button>`).join('')}
        </div>
        ${['D1', 'D2', 'D3'].includes(door.status) ? `<div class="answeredBox"><span>Answered now</span><button type="button" data-pick-status="A">A</button><button type="button" data-pick-status="B">B</button><button type="button" data-pick-status="C">C</button></div>` : ''}
        <div class="twoCols">
          ${field('Name', 'homeowner', door.homeowner)}
          ${field('Phone', 'phone', door.phone, 'tel')}
        </div>
        <fieldset class="servicePicker">
          <legend>Services</legend>
          ${serviceOptionsFor(door.services).map((service) => {
            const checked = normalizeServices(door).includes(service) ? 'checked' : '';
            return `<label class="serviceChip"><input type="checkbox" name="services" value="${escapeHtml(service)}" ${checked}> <span>${escapeHtml(service)}</span></label>`;
          }).join('')}
        </fieldset>
        <div class="formGrid">
          <label>Recurring Schedule<select name="recurringSchedule">${recurringSchedules.map((schedule) => `<option ${door.recurringSchedule === schedule ? 'selected' : ''}>${schedule}</option>`).join('')}</select></label>
          <label>Transport Method<select name="transportMethod">${transportMethods.map((method) => `<option ${door.transportMethod === method ? 'selected' : ''}>${method}</option>`).join('')}</select></label>
        </div>
        <div class="twoCols">
          ${field('Quote', 'priceQuoted', door.priceQuoted, 'number')}
          ${field('Job value', 'estimatedValue', door.estimatedValue, 'number')}
        </div>
        ${field('Next follow-up', 'nextFollowUp', door.nextFollowUp, 'date')}
        <label>Notes<textarea name="notes" rows="3">${escapeHtml(door.notes)}</textarea></label>
        <input type="hidden" name="status" value="${escapeHtml(door.status)}">
        <button class="saveButton" type="submit">Save door</button>
      </form>
    </div>`;
}

function field(label, name, value = '', type = 'text', required = false) {
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? 'required' : ''}></label>`;
}

function closeForm() {
  document.querySelector('.modal')?.remove();
  editingId = null;
}

function saveForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const selectedServices = Array.from(form.querySelectorAll('input[name="services"]:checked')).map((input) => input.value);
  const existing = editingId ? doors.find((door) => door.id === editingId) : null;
  const statusChanged = !existing || existing.status !== data.status;
  const saved = {
    ...emptyDoor,
    ...existing,
    ...data,
    id: editingId || crypto.randomUUID(),
    service: selectedServices[0] || '',
    services: selectedServices,
    lastKnocked: statusChanged ? nowIso() : existing?.lastKnocked || nowIso(),
    history: statusChanged ? [...(existing?.history || []), historyItem(data.status, editingId ? 'Status updated' : 'Added door')] : existing?.history || [],
  };
  doors = editingId ? doors.map((door) => (door.id === editingId ? saved : door)) : [saved, ...doors];
  saveDoors();
  closeForm();
  render();
}

function updateStatus(id, status, note = `Changed to ${status}`) {
  doors = doors.map((door) => {
    if (door.id !== id) return door;
    return { ...door, status, lastKnocked: nowIso(), history: [...(door.history || []), historyItem(status, note)] };
  });
  saveDoors();
  render();
}

function noAnswerAgain(id) {
  const door = doors.find((item) => item.id === id);
  if (!door) return;
  if (door.status === 'D1') updateStatus(id, 'D2', 'No answer again');
  if (door.status === 'D2') updateStatus(id, 'D3', 'Third no answer');
}

function exportCsv() {
  const headers = ['id', 'addressNumber', 'street', 'unit', 'status', 'homeowner', 'phone', 'service', 'services', 'recurringSchedule', 'transportMethod', 'priceQuoted', 'estimatedValue', 'lastKnocked', 'nextFollowUp', 'notes', 'history'];
  const rows = doors.map((door) => headers.map((key) => {
    if (key === 'history') return csvEscape(JSON.stringify(door.history || []));
    if (key === 'service') return csvEscape(normalizeServices(door)[0] || '');
    if (key === 'services') return csvEscape(joinServices(door.services));
    return csvEscape(door[key]);
  }).join(','));
  const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `door-tracker-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

function normalizeImportedDoor(data) {
  let history = [];
  try {
    history = data.history ? JSON.parse(data.history) : [];
  } catch {
    history = [];
  }
  const status = statuses.includes(data.status) ? data.status : 'D1';
  const importedServices = data.services ? splitServices(data.services) : normalizeServices(data);
  return normalizeDoor({
    ...emptyDoor,
    ...data,
    id: data.id || crypto.randomUUID(),
    status,
    service: importedServices[0] || data.service || '',
    services: importedServices,
    history: history.length ? history : [historyItem(status, 'Imported')],
  });
}

function doorKey(door) {
  const addressNumber = String(door.addressNumber || '').trim().toLowerCase();
  const street = String(door.street || '').trim().toLowerCase();
  const unit = String(door.unit || '').trim().toLowerCase();
  return addressNumber || street ? [addressNumber, street, unit].join('|') : '';
}

function mergeImportedDoors(imported, existingDoors) {
  const next = [...existingDoors];
  const indexById = new Map(next.filter((door) => door.id).map((door, index) => [door.id, index]));
  const indexByAddress = new Map(next.map((door, index) => [doorKey(door), index]).filter(([key]) => key));
  let added = 0;
  let skipped = 0;

  imported.forEach((door) => {
    const addressKey = doorKey(door);
    const matchIndex = indexById.has(door.id) ? indexById.get(door.id) : indexByAddress.get(addressKey);
    if (typeof matchIndex === 'number') {
      skipped += 1;
    } else {
      const newIndex = next.length;
      next.push(door);
      indexById.set(door.id, newIndex);
      if (addressKey) indexByAddress.set(addressKey, newIndex);
      added += 1;
    }
  });

  return { doors: next, added, skipped };
}

async function importCsv(file, mode = 'merge') {
  const rows = parseCsv(await file.text());
  if (!rows.length) {
    alert('This CSV is empty.');
    return;
  }
  const [headers, ...dataRows] = rows;
  const imported = dataRows
    .map((row) => {
    const data = Object.fromEntries(headers.map((key, index) => [key, row[index] || '']));
    return normalizeImportedDoor(data);
  })
    .filter((door) => door.addressNumber || door.street || door.homeowner || door.notes);

  if (mode === 'replace') {
    doors = imported;
    saveDoors();
    render();
    alert(`Restored ${imported.length} houses from CSV.`);
    return;
  }

  const result = mergeImportedDoors(imported, doors);
  doors = result.doors;
  saveDoors();
  render();
  alert(`Import complete: ${result.added} added, ${result.skipped} already existed, 0 duplicated.`);
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button, [data-view], [data-action], [data-pick-status]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (target.dataset.view) setView(target.dataset.view);
  if (action === 'open-form') openForm();
  if (action === 'close-form') closeForm();
  if (action === 'edit') openForm(doors.find((door) => door.id === id));
  if (action === 'delete' && confirm('Delete this door?')) {
    doors = doors.filter((door) => door.id !== id);
    saveDoors();
    render();
  }
  if (action === 'status') updateStatus(id, target.dataset.status);
  if (action === 'answered') openForm({ ...doors.find((door) => door.id === id), status: 'A' });
  if (action === 'no-answer') noAnswerAgain(id);
  if (action === 'reset-d3') updateStatus(id, 'D1', 'Reset D3 to D1');
  if (action === 'export') exportCsv();
  if (action === 'show-tutorial') showTutorial();
  if (action === 'demo') addDemoData();
  if (action === 'clear' && confirm('Delete all saved doors in this browser?')) {
    doors = [];
    saveDoors();
    render();
  }
  if (target.dataset.pickStatus) {
    const form = target.closest('form');
    form.status.value = target.dataset.pickStatus;
    form.querySelectorAll('[data-pick-status]').forEach((button) => button.className = '');
    target.className = `selected ${statusMeta[target.dataset.pickStatus].className}`;
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.matches('[data-form]')) {
    event.preventDefault();
    saveForm(event.target);
  }
});

document.addEventListener('input', (event) => {
  updateFilter(event);
});

function updateFilter(event) {
  const filter = event.target.dataset.filter;
  if (!filter) return;
  const position = event.target.selectionStart;
  filters[filter] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  render();
  const next = document.querySelector(`[data-filter="${filter}"]`);
  if (next && next.type !== 'checkbox') {
    next.focus();
    if (typeof position === 'number') next.setSelectionRange(position, position);
  }
}

document.addEventListener('change', (event) => {
  updateFilter(event);
  if (event.target.dataset.action === 'import' && event.target.files[0]) importCsv(event.target.files[0], 'merge');
  if (event.target.dataset.action === 'replace-import' && event.target.files[0] && confirm('Replace all current saved doors with this CSV backup?')) {
    importCsv(event.target.files[0], 'replace');
  }
});

render();

window.addEventListener('online', () => {
  isOffline = false;
  render();
});

window.addEventListener('offline', () => {
  isOffline = true;
  render();
});

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(window.location.protocol)) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
