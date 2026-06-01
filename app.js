// ─── STATE ───────────────────────────────────────────────────────────────────
const S = {
  org: '',
  proj: '',
  pat: '',
  apiKey: '',
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  S.org    = localStorage.getItem('az_org')    || '';
  S.proj   = localStorage.getItem('az_proj')   || '';
  S.pat    = localStorage.getItem('az_pat')    || '';
  S.apiKey = localStorage.getItem('az_apikey') || '';

  if (S.org)    document.getElementById('cfg-org').value    = S.org;
  if (S.proj)   document.getElementById('cfg-proj').value   = S.proj;
  if (S.pat)    document.getElementById('cfg-pat').value    = S.pat;
  if (S.apiKey) document.getElementById('cfg-apikey').value = S.apiKey;

  updateConnStatus();
  updateTopbarChip();
})();

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  el.classList.add('active');
  const titles = { board: 'Mi Board', generate: 'Generar Artefactos', create: 'Crear Work Item', config: 'Configuración' };
  document.getElementById('page-title').textContent = titles[name] || name;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
function saveConfig() {
  const org  = document.getElementById('cfg-org').value.trim();
  const proj = document.getElementById('cfg-proj').value.trim();
  const pat  = document.getElementById('cfg-pat').value.trim();
  if (!org || !proj || !pat) {
    showResult('cfg-result', 'Completá todos los campos obligatorios.', 'error');
    return;
  }
  S.org = org; S.proj = proj; S.pat = pat;
  localStorage.setItem('az_org', org);
  localStorage.setItem('az_proj', proj);
  localStorage.setItem('az_pat', pat);
  updateConnStatus();
  updateTopbarChip();
  showResult('cfg-result', '✓ Configuración guardada correctamente.', 'success');
}

function saveApiKey() {
  const k = document.getElementById('cfg-apikey').value.trim();
  if (!k) { showResult('apikey-result', 'Ingresá una API key válida.', 'error'); return; }
  S.apiKey = k;
  localStorage.setItem('az_apikey', k);
  showResult('apikey-result', '✓ API key guardada correctamente.', 'success');
}

async function testConn() {
  if (!S.org || !S.pat) { showResult('cfg-result', 'Guardá la configuración primero.', 'error'); return; }
  showResult('cfg-result', '<span class="spinner"></span> Probando conexión...', 'info');
  try {
    const r = await fetch(
      `https://dev.azure.com/${enc(S.org)}/_apis/projects?api-version=7.1`,
      { headers: { Authorization: auth() } }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const names = (d.value || []).map(p => p.name).join(', ');
    showResult('cfg-result', `✓ Conectado. Proyectos encontrados: ${names || '(ninguno visible)'}`, 'success');
  } catch (e) {
    showResult('cfg-result', `Error: ${e.message}. Verificá organización y PAT.`, 'error');
  }
}

function toggleVis(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'ti ti-eye-off';
  } else {
    input.type = 'password';
    icon.className = 'ti ti-eye';
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function auth()    { return 'Basic ' + btoa(':' + S.pat); }
function enc(s)    { return encodeURIComponent(s); }
function azUrl()   { return `https://dev.azure.com/${enc(S.org)}/${enc(S.proj)}`; }
function wiUrl(id) { return `${azUrl()}/_workitems/edit/${id}`; }

function stateColor(s) {
  const m = { 'in progress': 'b-blue', active: 'b-blue', new: 'b-gray', 'to do': 'b-gray', done: 'b-green', closed: 'b-green', resolved: 'b-green', blocked: 'b-red', removed: 'b-red' };
  return m[(s || '').toLowerCase()] || 'b-amber';
}
function typeColor(t) {
  const m = { task: 'b-blue', bug: 'b-red', 'user story': 'b-amber', 'product backlog item': 'b-amber', epic: 'b-purple', feature: 'b-purple', 'test case': 'b-green' };
  return m[(t || '').toLowerCase()] || 'b-gray';
}

function updateConnStatus() {
  const dot   = document.getElementById('conn-dot');
  const label = document.getElementById('conn-label');
  if (S.org && S.pat) {
    dot.style.background = '#22c55e';
    label.textContent = S.org;
  } else {
    dot.style.background = '#aaa';
    label.textContent = 'Sin conectar';
  }
}

function updateTopbarChip() {
  const chip = document.getElementById('topbar-chip');
  if (S.proj) {
    chip.textContent = S.proj;
    chip.style.display = '';
  } else {
    chip.style.display = 'none';
  }
}

function showResult(id, msg, type) {
  const el = document.getElementById(id);
  const icons = { success: 'ti-check', error: 'ti-alert-circle', info: 'ti-info-circle' };
  el.innerHTML = `<div class="alert alert-${type}"><i class="ti ${icons[type] || 'ti-info-circle'}"></i> ${msg}</div>`;
}

function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('req-text').value = e.target.result; };
  reader.readAsText(file);
}

function needsConfig(target) {
  if (!S.org || !S.pat) {
    alert('Primero configurá tu conexión en la sección Configuración.');
    showPage('config', document.querySelector('[data-page="config"]'));
    return true;
  }
  return false;
}

// ─── BOARD ────────────────────────────────────────────────────────────────────
async function loadBoard() {
  if (needsConfig()) return;
  const cont = document.getElementById('board-container');
  cont.innerHTML = '<div class="loading-bar"><span class="spinner"></span> Cargando work items...</div>';

  const ft  = document.getElementById('f-type').value;
  const fs  = document.getElementById('f-state').value;
  const fa  = document.getElementById('f-assigned').value;

  const conds = [];
  if (fa === 'me') conds.push(`[System.AssignedTo] = @me`);
  if (ft !== 'all') conds.push(`[System.WorkItemType] = '${ft}'`);
  if (fs !== 'all') conds.push(`[System.State] = '${fs}'`);

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const wiql = `SELECT [System.Id] FROM WorkItems ${where} ORDER BY [System.ChangedDate] DESC`;

  try {
    const r = await fetch(`${azUrl()}/_apis/wit/wiql?api-version=7.1`, {
      method: 'POST',
      headers: { Authorization: auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: wiql })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} — ${await r.text()}`);

    const data = await r.json();
    const ids  = (data.workItems || []).slice(0, 100).map(w => w.id);

    if (!ids.length) {
      cont.innerHTML = '<div class="empty-state"><i class="ti ti-mood-empty"></i><p>Sin resultados con estos filtros</p></div>';
      return;
    }

    const fields = [
      'System.Id', 'System.Title', 'System.WorkItemType', 'System.State',
      'System.AssignedTo', 'System.AreaPath', 'Microsoft.VSTS.Scheduling.StoryPoints',
      'System.Tags', 'System.IterationPath'
    ].join(',');

    const r2 = await fetch(
      `${azUrl()}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=7.1`,
      { headers: { Authorization: auth() } }
    );
    if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
    const d2 = await r2.json();

    cont.innerHTML = `<div class="board-header">${d2.value.length} resultado(s)</div>`;
    d2.value.forEach(wi => renderWiItem(wi, cont));

  } catch (e) {
    cont.innerHTML = `
      <div class="result-block">
        <h4><i class="ti ti-alert-circle"></i> Error de conexión</h4>
        <pre>${e.message}\n\nVerificá:\n• Organización y proyecto correctos\n• PAT con permisos Work Items (read)\n• Estar en una URL https:// (no file://)</pre>
      </div>`;
  }
}

function renderWiItem(wi, container) {
  const f   = wi.fields;
  const url = wiUrl(wi.id);
  const pts = f['Microsoft.VSTS.Scheduling.StoryPoints'];
  const assignedTo = f['System.AssignedTo'];
  const assignedName = typeof assignedTo === 'object' ? assignedTo?.displayName : assignedTo;
  const area = (f['System.AreaPath'] || '').split('\\').pop();
  const iter = (f['System.IterationPath'] || '').split('\\').pop();

  const div = document.createElement('div');
  div.className = 'wi-item';
  div.innerHTML = `
    <div class="wi-title"><a href="${url}" target="_blank" rel="noopener">#${wi.id} — ${escHtml(f['System.Title'])}</a></div>
    <div class="wi-meta">
      <span class="badge ${typeColor(f['System.WorkItemType'])}">${f['System.WorkItemType']}</span>
      <span class="badge ${stateColor(f['System.State'])}">${f['System.State']}</span>
      ${pts ? `<span class="badge b-gray">${pts} pts</span>` : ''}
      ${assignedName ? `<span class="badge b-gray"><i class="ti ti-user" style="font-size:11px"></i> ${escHtml(assignedName)}</span>` : ''}
      ${area ? `<span class="badge b-gray"><i class="ti ti-folder" style="font-size:11px"></i> ${escHtml(area)}</span>` : ''}
      ${iter && iter !== area ? `<span class="badge b-gray"><i class="ti ti-calendar" style="font-size:11px"></i> ${escHtml(iter)}</span>` : ''}
    </div>`;
  container.appendChild(div);
}

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── GENERATE ARTIFACTS ───────────────────────────────────────────────────────
async function generateArtifacts() {
  const req = document.getElementById('req-text').value.trim();
  if (!req) { alert('Ingresá el requerimiento o pegá el documento funcional.'); return; }
  if (!S.apiKey) {
    alert('Necesitás una Anthropic API Key para generar artefactos. Configurala en la sección Configuración.');
    showPage('config', document.querySelector('[data-page="config"]'));
    return;
  }

  const btn = document.getElementById('btn-gen');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analizando...';

  const res   = document.getElementById('gen-results');
  const doCreate = document.getElementById('auto-create').checked && S.org && S.pat;

  const checked = [...document.querySelectorAll('.art-grid input:checked')].map(i => i.value);

  res.innerHTML = '<div class="loading-bar"><span class="spinner"></span> Claude está analizando el documento...</div>';

  const prompt = buildPrompt(req, checked);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': S.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${r.status}`);
    }

    const d   = await r.json();
    const raw = (d.content || []).map(c => c.text || '').join('');
    const jm  = raw.match(/\{[\s\S]*\}/);
    if (!jm) throw new Error('La IA no devolvió JSON válido. Intentá de nuevo.');

    const artifacts = JSON.parse(jm[0]);
    renderArtifacts(artifacts, res, checked);

    if (doCreate) {
      await pushToAzure(artifacts, res);
    }

  } catch (e) {
    res.innerHTML = `
      <div class="result-block">
        <h4><i class="ti ti-alert-circle"></i> Error</h4>
        <pre>${e.message}</pre>
      </div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-sparkles"></i> Analizar y Generar';
}

function buildPrompt(req, checked) {
  return `Sos un analista técnico senior y product manager experto. Analizá el siguiente documento/requerimiento y generá ÚNICAMENTE un JSON válido (sin texto adicional, sin bloques markdown, sin backticks) con la siguiente estructura:

{
  "titulo": "Título descriptivo del proyecto/feature",
  "resumen": "Resumen ejecutivo en 2-3 oraciones",
  ${checked.includes('epic') ? `"epics": [{"id":"EPIC-01","titulo":"...","descripcion":"...","objetivo":"..."}],` : '"epics": [],'}
  ${checked.includes('feature') ? `"features": [{"id":"FEAT-01","epic_id":"EPIC-01","titulo":"...","descripcion":"...","valor_negocio":"..."}],` : '"features": [],'}
  ${checked.includes('user_stories') ? `"user_stories": [{"id":"US-01","feature_id":"FEAT-01","titulo":"...","descripcion":"Como [ROL] quiero [ACCIÓN] para [BENEFICIO]","prioridad":"Alta|Media|Baja","story_points":3,"criterios_aceptacion":["Dado que... Cuando... Entonces..."]}],` : '"user_stories": [],'}
  ${checked.includes('tasks') ? `"tasks": [{"id":"TASK-01","us_id":"US-01","titulo":"...","descripcion":"...","tipo":"desarrollo|diseño|testing|devops","estimacion_horas":4}],` : '"tasks": [],'}
  ${checked.includes('use_cases') ? `"use_cases": [{"id":"UC-01","nombre":"...","actor_principal":"...","objetivo":"...","precondiciones":["..."],"flujo_principal":["1. ...","2. ..."],"flujos_alternativos":["A1. ..."],"postcondiciones":["..."]}],` : '"use_cases": [],'}
  ${checked.includes('test_cases') ? `"test_cases": [{"id":"TC-01","us_id":"US-01","titulo":"...","tipo":"funcional|regresion|borde|negativo","precondiciones":["..."],"pasos":["1. ...","2. ..."],"resultado_esperado":"...","prioridad":"Alta|Media|Baja"}],` : '"test_cases": [],'}
  ${checked.includes('solution_design') ? `"solution_design": {"resumen_tecnico":"...","arquitectura":"...","componentes":["..."],"tecnologias":["..."],"integraciones":["..."],"consideraciones_seguridad":["..."],"consideraciones_performance":["..."],"riesgos":["..."]}` : '"solution_design": null'}
}

Generá al menos 2-3 items por cada sección. Sé específico y detallado basándote en el documento provisto.

DOCUMENTO / REQUERIMIENTO:
${req}`;
}

function renderArtifacts(a, container, checked) {
  container.innerHTML = '';

  if (a.titulo) {
    container.innerHTML += `
      <div class="result-block" style="border-left:3px solid var(--accent)">
        <h4><i class="ti ti-file-description"></i> ${escHtml(a.titulo)}</h4>
        <pre>${escHtml(a.resumen || '')}</pre>
      </div>`;
  }

  if (a.epics?.length) {
    container.innerHTML += resultBlock('ti-trophy', 'Epics',
      a.epics.map(e => `${e.id}: ${e.titulo}\n${e.descripcion || ''}`).join('\n\n'));
  }
  if (a.features?.length) {
    container.innerHTML += resultBlock('ti-puzzle', 'Features',
      a.features.map(f => `${f.id} [${f.epic_id}]: ${f.titulo}\n${f.descripcion || ''}`).join('\n\n'));
  }
  if (a.user_stories?.length) {
    container.innerHTML += resultBlock('ti-users', 'User Stories',
      a.user_stories.map(u =>
        `${u.id}: ${u.titulo}\n${u.descripcion}\nCA: ${(u.criterios_aceptacion || []).slice(0, 2).join(' | ')}\nPrioridad: ${u.prioridad || ''} | ${u.story_points || '?'} pts`
      ).join('\n\n'));
  }
  if (a.tasks?.length) {
    container.innerHTML += resultBlock('ti-checklist', 'Tasks',
      a.tasks.map(t => `${t.id} [${t.us_id}]: ${t.titulo}\n${t.descripcion || ''} (${t.estimacion_horas || '?'}h)`).join('\n\n'));
  }
  if (a.use_cases?.length) {
    container.innerHTML += resultBlock('ti-arrows-exchange', 'Casos de Uso',
      a.use_cases.map(u =>
        `${u.id}: ${u.nombre}\nActor: ${u.actor_principal}\nFlujo: ${(u.flujo_principal || []).slice(0, 3).join(' → ')}`
      ).join('\n\n'));
  }
  if (a.test_cases?.length) {
    container.innerHTML += resultBlock('ti-test-pipe', 'Casos de Prueba',
      a.test_cases.map(t =>
        `${t.id}: ${t.titulo} [${t.tipo}]\nEsperado: ${t.resultado_esperado}`
      ).join('\n\n'));
  }
  if (a.solution_design) {
    const sd = a.solution_design;
    container.innerHTML += resultBlock('ti-topology-star', 'Diseño de Solución',
      `${sd.resumen_tecnico || ''}\n\nArquitectura: ${sd.arquitectura || ''}\nComponentes: ${(sd.componentes || []).join(', ')}\nTecnologías: ${(sd.tecnologias || []).join(', ')}\nRiesgos: ${(sd.riesgos || []).slice(0, 2).join(' | ')}`);
  }
}

function resultBlock(icon, title, content) {
  return `
    <div class="result-block">
      <h4><i class="ti ${icon}"></i> ${title}</h4>
      <pre>${escHtml(content)}</pre>
    </div>`;
}

// ─── PUSH TO AZURE ─────────────────────────────────────────────────────────────
async function pushToAzure(artifacts, container) {
  container.innerHTML += '<div class="loading-bar" id="az-loading"><span class="spinner"></span> Creando work items en Azure DevOps...</div>';

  const area = document.getElementById('gen-area').value.trim();
  const iter = document.getElementById('gen-iter').value.trim();

  const createdBlock = document.createElement('div');
  createdBlock.className = 'result-block';
  createdBlock.innerHTML = '<h4><i class="ti ti-brand-azure"></i> Work Items creados en Azure DevOps</h4>';
  container.appendChild(createdBlock);

  const idMap = {}; // local_id → azure_id para parent linking

  try {
    // 1. Epics
    for (const epic of (artifacts.epics || [])) {
      const wi = await createWI('Epic', epic.titulo, epic.descripcion, area, iter);
      idMap[epic.id] = wi.id;
      appendCreated(createdBlock, wi.id, epic.titulo, 'Epic');
    }

    // 2. Features
    for (const feat of (artifacts.features || [])) {
      const parentId = idMap[feat.epic_id];
      const wi = await createWI('Feature', feat.titulo, feat.descripcion, area, iter, parentId);
      idMap[feat.id] = wi.id;
      appendCreated(createdBlock, wi.id, feat.titulo, 'Feature');
    }

    // 3. User Stories
    for (const us of (artifacts.user_stories || [])) {
      const desc = buildUSDescription(us);
      const parentId = idMap[us.feature_id];
      const wi = await createWI('User Story', `${us.id}: ${us.titulo}`, desc, area, iter, parentId, us.story_points);
      idMap[us.id] = wi.id;
      appendCreated(createdBlock, wi.id, us.titulo, 'User Story');
    }

    // 4. Tasks
    for (const task of (artifacts.tasks || [])) {
      const parentId = idMap[task.us_id];
      const wi = await createWI('Task', `${task.id}: ${task.titulo}`, task.descripcion, area, iter, parentId);
      idMap[task.id] = wi.id;
      appendCreated(createdBlock, wi.id, task.titulo, 'Task');
    }

    // 5. Test Cases
    for (const tc of (artifacts.test_cases || [])) {
      const desc = buildTCDescription(tc);
      const wi = await createWI('Test Case', `${tc.id}: ${tc.titulo}`, desc, area, iter);
      appendCreated(createdBlock, wi.id, tc.titulo, 'Test Case');
    }

  } catch (e) {
    createdBlock.innerHTML += `<pre style="font-size:12px;color:#991b1b;margin-top:8px">Error al crear work items: ${e.message}</pre>`;
  }

  document.getElementById('az-loading')?.remove();
}

function buildUSDescription(us) {
  let html = `<p>${us.descripcion || ''}</p>`;
  if (us.criterios_aceptacion?.length) {
    html += `<br><strong>Criterios de Aceptación:</strong><ul>${us.criterios_aceptacion.map(c => `<li>${c}</li>`).join('')}</ul>`;
  }
  return html;
}

function buildTCDescription(tc) {
  let html = `<strong>Tipo:</strong> ${tc.tipo || ''}<br>`;
  if (tc.precondiciones?.length) html += `<strong>Precondiciones:</strong><ul>${tc.precondiciones.map(p => `<li>${p}</li>`).join('')}</ul>`;
  if (tc.pasos?.length) html += `<strong>Pasos:</strong><ol>${tc.pasos.map(p => `<li>${p}</li>`).join('')}</ol>`;
  html += `<strong>Resultado esperado:</strong> ${tc.resultado_esperado || ''}`;
  return html;
}

async function createWI(type, title, description, area, iter, parentId, storyPoints) {
  const body = [
    { op: 'add', path: '/fields/System.Title', value: title },
  ];
  if (description) body.push({ op: 'add', path: '/fields/System.Description', value: description });
  if (area)        body.push({ op: 'add', path: '/fields/System.AreaPath', value: area });
  if (iter)        body.push({ op: 'add', path: '/fields/System.IterationPath', value: iter });
  if (storyPoints) body.push({ op: 'add', path: '/fields/Microsoft.VSTS.Scheduling.StoryPoints', value: Number(storyPoints) });
  if (parentId)    body.push({ op: 'add', path: '/relations/-', value: { rel: 'System.LinkTypes.Hierarchy-Reverse', url: `${azUrl()}/_apis/wit/workItems/${parentId}` } });

  const r = await fetch(
    `${azUrl()}/_apis/wit/workitems/$${enc(type)}?api-version=7.1`,
    {
      method: 'POST',
      headers: { Authorization: auth(), 'Content-Type': 'application/json-patch+json' },
      body: JSON.stringify(body)
    }
  );
  if (!r.ok) throw new Error(`HTTP ${r.status} al crear ${type}: ${await r.text()}`);
  return await r.json();
}

function appendCreated(container, wiId, title, type) {
  const url = wiUrl(wiId);
  const div = document.createElement('div');
  div.className = 'wi-created-row';
  div.innerHTML = `
    <span>
      <span class="badge ${typeColor(type)}" style="margin-right:6px">${type}</span>
      #${wiId} ${escHtml(title)}
    </span>
    <a href="${url}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Abrir</a>`;
  container.appendChild(div);
}

// ─── CREATE SINGLE ─────────────────────────────────────────────────────────────
async function createSingle() {
  if (needsConfig()) return;
  const title = document.getElementById('c-title').value.trim();
  if (!title) { alert('El título es obligatorio.'); return; }

  const btn = document.getElementById('btn-create');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creando...';

  const type    = document.getElementById('c-type').value;
  const desc    = document.getElementById('c-desc').value.trim();
  const ac      = document.getElementById('c-ac').value.trim();
  const assign  = document.getElementById('c-assign').value.trim();
  const pts     = document.getElementById('c-points').value;
  const prio    = document.getElementById('c-priority').value;
  const area    = document.getElementById('c-area').value.trim();
  const iter    = document.getElementById('c-iter').value.trim();

  const fullDesc = desc + (ac ? `<br><br><strong>Criterios de Aceptación:</strong><br>${ac.replace(/\n/g,'<br>')}` : '');

  try {
    const body = [
      { op: 'add', path: '/fields/System.Title', value: title },
      { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: parseInt(prio) }
    ];
    if (fullDesc) body.push({ op: 'add', path: '/fields/System.Description', value: fullDesc });
    if (assign)   body.push({ op: 'add', path: '/fields/System.AssignedTo', value: assign });
    if (pts)      body.push({ op: 'add', path: '/fields/Microsoft.VSTS.Scheduling.StoryPoints', value: Number(pts) });
    if (area)     body.push({ op: 'add', path: '/fields/System.AreaPath', value: area });
    if (iter)     body.push({ op: 'add', path: '/fields/System.IterationPath', value: iter });

    const r = await fetch(
      `${azUrl()}/_apis/wit/workitems/$${enc(type)}?api-version=7.1`,
      {
        method: 'POST',
        headers: { Authorization: auth(), 'Content-Type': 'application/json-patch+json' },
        body: JSON.stringify(body)
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    const wi  = await r.json();
    const url = wiUrl(wi.id);

    document.getElementById('create-result').innerHTML = `
      <div class="result-block" style="border-left:3px solid #22c55e">
        <h4><i class="ti ti-check"></i> Work item creado</h4>
        <div class="wi-created-row">
          <span><span class="badge ${typeColor(type)}" style="margin-right:6px">${type}</span>#${wi.id} ${escHtml(title)}</span>
          <a href="${url}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Abrir en Azure</a>
        </div>
      </div>`;

    // Limpiar form
    ['c-title','c-desc','c-ac','c-assign','c-points','c-area','c-iter'].forEach(id => {
      document.getElementById(id).value = '';
    });

  } catch (e) {
    document.getElementById('create-result').innerHTML = `
      <div class="result-block" style="border-left:3px solid #ef4444">
        <h4><i class="ti ti-alert-circle"></i> Error</h4>
        <pre>${e.message}</pre>
      </div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-plus"></i> Crear Work Item';
}
