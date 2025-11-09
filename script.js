/* DSA Tracker – full app logic with Concepts (Core/Advanced) accordions
   - Tabs: Dashboard / Roadmap / Problems / Concepts / STL
   - Progress: localStorage (per-problem + per-week)
   - Data: fetches from data/*.json
   - Concepts: grouped into Core / Advanced (expandable), each with Videos (Beginner/Intermediate/Advanced), Blogs (GFG/CP-Alg/LC Discuss), Premium (optional)
*/

let DATA = { roadmap: [], concepts: [], stl: [], problems: [] };
const STORAGE_KEY = 'dsa_tracker_v3';
let state = { progress:{} };

// ------------- NAV -------------
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.target;
    document.querySelectorAll('main section').forEach(s=> s.style.display='none');
    document.getElementById(t).style.display='block';
    window.scrollTo({top:0, behavior:'instant'});
  });
});

// ------------- STATE -------------
function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) state=JSON.parse(raw);}catch(e){} }
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }

// ------------- DATA -------------
async function loadData(){
  const base='data/';
  const arr=[['roadmap','roadmap.json'],['concepts','concepts.json'],['stl','stl.json'],['problems','problems.json']];
  for(const [k,f] of arr){
    const r = await fetch(base+f);
    DATA[k] = await r.json();
  }
  renderAll();
}

// ------------- UTILS -------------
function el(tag, cls, html){ const d=document.createElement(tag); if(cls) d.className=cls; if(html!==undefined) d.innerHTML=html; return d; }
function openNewTab(url){ if(!url) return; window.open(url, '_blank', 'noopener'); }

// ------------- DASHBOARD -------------
function calcProgress(){
  const total = DATA.problems.length;
  let solved = 0;
  DATA.problems.forEach(p=>{ if(state.progress['p_'+p.ID]) solved++; });
  const percent = total? Math.round(solved/total*100):0;
  return {total, solved, percent};
}
function renderDashboard(){
  const p = calcProgress();
  document.getElementById('solvedCount').textContent = p.solved;
  document.getElementById('totalCount').textContent = p.total;
  document.getElementById('percentText').textContent = p.percent + '%';
  document.getElementById('progFill').style.width = p.percent + '%';
}

// ------------- ROADMAP -------------
function renderRoadmap(){
  const wrap = document.getElementById('roadmapList'); wrap.innerHTML='';
  DATA.roadmap.forEach(w=>{
    const key = 'week_'+w.Week;
    const done = !!state.progress[key];
    const card = el('div','topic-card');
    card.innerHTML = `
      <div class="section-title">Week ${w.Week}: ${w.Topic} <span class="badge">${w.Phase}</span></div>
      <div class="small">${w.Goal}</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div class="small">~ ${w.Problems} problems</div>
        <button class="${done? 'btn-done':'btn-mark'}" data-week="${w.Week}">${done? 'Done':'Mark Done'}</button>
      </div>`;
    wrap.appendChild(card);
  });
  document.querySelectorAll('[data-week]').forEach(b=> b.addEventListener('click', e=>{
    const wk = e.target.getAttribute('data-week');
    const k = 'week_'+wk;
    if(state.progress[k]) delete state.progress[k]; else state.progress[k]=true;
    saveState(); renderRoadmap(); renderDashboard();
  }));
}

// ------------- PROBLEMS -------------
function renderProblems(filter=''){
  const container = document.getElementById('problemList'); container.innerHTML='';
  const q = (filter||'').toLowerCase();
  const grouped = {};
  DATA.problems.forEach(p=>{
    if(q && !((p.Problem||'').toLowerCase().includes(q) || (p.Topic||'').toLowerCase().includes(q) || (p.Difficulty||'').toLowerCase().includes(q))) return;
    if(!grouped[p.Topic]) grouped[p.Topic]=[];
    grouped[p.Topic].push(p);
  });
  Object.keys(grouped).sort().forEach(topic=>{
    const arr = grouped[topic];
    const card = el('div','topic-card');
    card.appendChild(el('div','section-title', `${topic} <span class="badge">${arr.length} problems</span>`));
    const list = el('div','');
    const show = 12;

    function addRow(p){
      const row = el('div','problem-row');
      row.innerHTML = `
        <div>
          <div style="font-weight:700">${p.Problem}</div>
          <div class="meta">${p.Platform||''} • ${p.Difficulty||''}</div>
        </div>`;
      const right = el('div','');
      const a = el('a','link','Open');
      a.href = p.Link || '#'; a.target = '_blank'; a.rel = 'noopener';
      const key = 'p_'+p.ID;
      const btn = el('button','', state.progress[key] ? 'Solved' : 'Mark');
      btn.style.marginLeft='8px';
      btn.addEventListener('click', ()=>{
        if(state.progress[key]) delete state.progress[key]; else state.progress[key]=true;
        saveState(); renderProblems(document.getElementById('searchInput').value); renderDashboard();
      });
      right.appendChild(a); right.appendChild(btn);
      row.appendChild(right);
      list.appendChild(row);
    }

    arr.slice(0,show).forEach(addRow);
    card.appendChild(list);

    if(arr.length>show){
      const more = el('div','show-more');
      const btn = el('button','', 'Show More');
      btn.addEventListener('click', ()=>{
        list.innerHTML='';
        arr.forEach(addRow);
        btn.style.display='none';
      });
      more.appendChild(btn);
      card.appendChild(more);
    }

    container.appendChild(card);
  });
}
document.getElementById('searchInput').addEventListener('input', e=> renderProblems(e.target.value));

// ------------- CONCEPTS (Core/Advanced accordions + direct links) -------------
function conceptsByLevel(){
  const core = [], adv = [];
  DATA.concepts.forEach(c => {
    const lvl = (c.Level || 'Core').toLowerCase();
    (lvl === 'advanced' ? adv : core).push(c);
  });
  return { core, adv };
}

function conceptCard(c){
  // Build buttons group: Videos (Beginner/Intermediate/Advanced), Blogs (GFG/CP-Alg/LC Discuss), Premium (optional)
  const wrap = el('div','topic-card');
  wrap.appendChild(el('div','section-title', `${c.Subtopic} <span class="badge">${c.Topic}</span>`));
  if (c.Algorithm) wrap.appendChild(el('div','small', c.Algorithm));

  const actions = el('div','', '');
  actions.style.marginTop = '8px';

  // Video buttons
  if (c.Videos){
    const vb = el('div','small','<b>Watch:</b> ');
    const addV = (label, url) => {
      if(!url) return;
      const b = el('button','', label);
      b.style.marginRight = '6px';
      b.addEventListener('click', ()=> openNewTab(url));
      vb.appendChild(b);
    };
    addV('Beginner', c.Videos.Beginner);
    addV('Intermediate', c.Videos.Intermediate);
    addV('Advanced', c.Videos.Advanced);
    actions.appendChild(vb);
  }

  // Blog links
  if (Array.isArray(c.Blogs) && c.Blogs.length){
    const bl = el('div','small','<b>Read:</b> ');
    c.Blogs.forEach(bi=>{
      if(!bi || !bi.url) return;
      const a = el('a','link', bi.site || 'Blog');
      a.href = bi.url; a.target = '_blank'; a.rel = 'noopener';
      bl.appendChild(document.createTextNode(' '));
      bl.appendChild(a);
    });
    actions.appendChild(bl);
  }

  // Premium
  if (c.Premium){
    const pr = el('div','small','<b>Premium:</b> ');
    Object.keys(c.Premium).forEach(k=>{
      const url = c.Premium[k];
      if(!url) return;
      const a = el('a','link', `🌟 ${k}`);
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      pr.appendChild(document.createTextNode(' '));
      pr.appendChild(a);
    });
    actions.appendChild(pr);
  }

  wrap.appendChild(actions);
  return wrap;
}

function renderConcepts(){
  const container = document.getElementById('conceptList'); container.innerHTML='';
  const { core, adv } = conceptsByLevel();

  // Accordion helper
  const section = (title, items, open=true) => {
    const sec = el('div','card','');
    const head = el('div','', `
      <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div class="section-title">${title} <span class="badge">${items.length}</span></div>
        <div class="small" id="arrow"> ${open ? '▼' : '▶'} </div>
      </div>
    `);
    const body = el('div','', '');
    body.style.display = open ? 'block' : 'none';

    items.forEach(c => body.appendChild(conceptCard(c)));

    head.addEventListener('click', ()=>{
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      head.querySelector('#arrow').textContent = isOpen ? '▶' : '▼';
    });

    sec.appendChild(head);
    sec.appendChild(body);
    return sec;
  };

  // Core expanded, Advanced collapsed
  container.appendChild(section('Core Concepts', core, true));
  container.appendChild(section('Advanced Concepts', adv, false));
}

// ------------- STL -------------
function renderSTL(){
  const s = document.getElementById('stlList'); s.innerHTML='';
  DATA.stl.forEach(x=>{
    s.appendChild(el('div','topic-card', `<div class="section-title">${x['STL Component']}</div><div class="small">${x['Key Functions']||''}</div>`));
  });
}

// ------------- BOOT -------------
function renderAll(){ renderDashboard(); renderRoadmap(); renderProblems(); renderConcepts(); renderSTL(); }

loadState();
loadData();
