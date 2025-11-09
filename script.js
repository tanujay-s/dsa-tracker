
let DATA = {roadmap:[], concepts:[], stl:[], problems:[]};
const STORAGE_KEY = 'dsa_tracker_v3';
let state = { progress:{} };

// nav
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

function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) state=JSON.parse(raw);}catch(e){} }
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }

async function loadData(){
  const base='data/';
  const arr=[['roadmap','roadmap.json'],['concepts','concepts.json'],['stl','stl.json'],['problems','problems.json']];
  for(const [k,f] of arr){
    const r = await fetch(base+f);
    DATA[k] = await r.json();
  }
  renderAll();
}

function el(tag, cls, html){ const d=document.createElement(tag); if(cls) d.className=cls; if(html!==undefined) d.innerHTML=html; return d; }

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

function renderRoadmap(){
  const wrap = document.getElementById('roadmapList'); wrap.innerHTML='';
  DATA.roadmap.forEach(w=>{
    const card = el('div','topic-card');
    const key = 'week_'+w.Week;
    const done = !!state.progress[key];
    card.innerHTML = `<div class="section-title">Week ${w.Week}: ${w.Topic} <span class="badge">${w.Phase}</span></div>
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
      row.innerHTML = `<div><div style="font-weight:700">${p.Problem}</div><div class="meta">${p.Platform||''} • ${p.Difficulty||''}</div></div>`;
      const right = el('div','');
      const a = el('a','link','Open'); a.href = p.Link || '#'; a.target='_blank';
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

function renderConcepts(){
  const c = document.getElementById('conceptList'); c.innerHTML='';
  DATA.concepts.forEach(x=>{
    c.appendChild(el('div','topic-card', `<div class="section-title">${x.Subtopic} <span class="badge">${x.Topic}</span></div><div class="small">${x.Algorithm||''}</div>`));
  });
}

function renderSTL(){
  const s = document.getElementById('stlList'); s.innerHTML='';
  DATA.stl.forEach(x=>{
    s.appendChild(el('div','topic-card', `<div class="section-title">${x['STL Component']}</div><div class="small">${x['Key Functions']||''}</div>`));
  });
}

function renderAll(){ renderDashboard(); renderRoadmap(); renderProblems(); renderConcepts(); renderSTL(); }

// events
document.getElementById('searchInput').addEventListener('input', e=> renderProblems(e.target.value));

// init
loadState();
loadData();
