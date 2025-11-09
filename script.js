// Simple DSA Tracker - loads JSON data and provides progress tracking
let DATA = { roadmap: [], concepts: [], stl: [], problems: [] };
const STORAGE_KEY = 'dsa_tracker_repo_v1';
let state = { progress: {} };

// navigation
document.querySelectorAll('.bottom-nav button').forEach(btn => {
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.target;
    document.querySelectorAll('main section').forEach(s=> s.style.display='none');
    document.getElementById(t).style.display = 'block';
    window.scrollTo({top:0, behavior:'instant'});
  });
});

function loadState(){ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) state = JSON.parse(raw); }catch(e){ console.warn(e); } }
function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ console.warn(e); } }

async function loadData(){
  const base = 'data/';
  const urls = ['roadmap.json','concepts.json','stl.json','problems.json'];
  const keys = ['roadmap','concepts','stl','problems'];
  for(let i=0;i<urls.length;i++){
    try{
      const resp = await fetch(base+urls[i]);
      const j = await resp.json();
      DATA[keys[i]] = j;
    }catch(e){ console.error('Failed to load', urls[i], e); }
  }
  renderAll();
}

function el(tag, cls, html){ const d=document.createElement(tag); if(cls) d.className=cls; if(html!==undefined) d.innerHTML=html; return d; }

function calcProgress(){
  const total = DATA.problems.length;
  let solved = 0;
  DATA.problems.forEach(p=>{ if(state.progress['p_'+p.ID]) solved++; });
  const percent = total? Math.round(solved/total*100):0;
  return { total, solved, percent };
}

function renderDashboard(){
  const p = calcProgress();
  document.getElementById('solvedCount').textContent = p.solved;
  document.getElementById('totalCount').textContent = p.total;
  document.getElementById('percentText').textContent = p.percent + '%';
  document.getElementById('progFill').style.width = p.percent + '%';
}

function renderRoadmap(){
  const container = document.getElementById('roadmapList');
  container.innerHTML = '';
  DATA.roadmap.forEach(w=>{
    const card = el('div','card small');
    card.innerHTML = '<div style="display:flex;justify-content:space-between"><div><strong>Week '+w.Week+': '+w.Topic+'</strong><div class="small">'+w.Phase+' • '+w.Goal+'</div></div><div><button data-week="'+w.Week+'" class="mark-week">'+(state.progress['week_'+w.Week]? 'Done':'Mark')+'</button></div></div>';
    container.appendChild(card);
  });
  document.querySelectorAll('.mark-week').forEach(b=> b.addEventListener('click', e=>{
    const wk = e.target.getAttribute('data-week');
    if(state.progress['week_'+wk]) delete state.progress['week_'+wk]; else state.progress['week_'+wk]=true;
    saveState(); renderRoadmap(); renderDashboard();
  }));
}

function renderProblems(filter=''){
  const container = document.getElementById('problemList');
  container.innerHTML = '';
  const q = (filter||'').toLowerCase();
  const grouped = {};
  DATA.problems.forEach(p=>{
    if(q && !((p.Problem||'').toLowerCase().includes(q) || (p.Topic||'').toLowerCase().includes(q))) return;
    if(!grouped[p.Topic]) grouped[p.Topic]=[];
    grouped[p.Topic].push(p);
  });
  Object.keys(grouped).sort().forEach(topic=>{
    const arr = grouped[topic];
    const card = el('div','card');
    card.appendChild(el('div','small','<strong>'+topic+'</strong> — '+arr.length+' problems'));
    const list = el('div','', '');
    const show = 12;
    arr.slice(0,show).forEach(p=>{
      const row = el('div','problem-row');
      row.innerHTML = '<div><div style="font-weight:600">'+p.Problem+'</div><div class="meta">'+(p.Difficulty||'')+' • '+(p.Platform||'')+'</div></div>';
      const right = el('div','');
      const a = el('a','','Open'); a.href = p.Link||'#'; a.target='_blank';
      const key = 'p_'+p.ID;
      const chk = el('button','', state.progress[key]? 'Solved':'Mark');
      chk.style.marginLeft='8px';
      chk.addEventListener('click', ()=>{
        if(state.progress[key]) delete state.progress[key]; else state.progress[key]=true;
        saveState(); renderProblems(document.getElementById('searchInput').value); renderDashboard();
      });
      right.appendChild(a); right.appendChild(chk);
      row.appendChild(right);
      list.appendChild(row);
    });
    card.appendChild(list);
    if(arr.length>show){
      const more = el('div','show-more'); const btn = el('button','','Show More');
      btn.addEventListener('click', ()=>{
        list.innerHTML = '';
        arr.forEach(p=>{
          const row = el('div','problem-row');
          row.innerHTML = '<div><div style="font-weight:600">'+p.Problem+'</div><div class="meta">'+(p.Difficulty||'')+' • '+(p.Platform||'')+'</div></div>';
          const right = el('div','');
          const a = el('a','','Open'); a.href=p.Link||'#'; a.target='_blank';
          const key = 'p_'+p.ID;
          const chk = el('button','', state.progress[key]? 'Solved':'Mark');
          chk.style.marginLeft='8px';
          chk.addEventListener('click', ()=>{
            if(state.progress[key]) delete state.progress[key]; else state.progress[key]=true;
            saveState(); renderProblems(document.getElementById('searchInput').value); renderDashboard();
          });
          right.appendChild(a); right.appendChild(chk);
          row.appendChild(right);
          list.appendChild(row);
        });
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
    c.appendChild(el('div','','<strong>'+x.Subtopic+'</strong><div class="small">'+(x.Algorithm||'')+'</div>'));
  });
}

function renderSTL(){
  const c = document.getElementById('stlList'); c.innerHTML='';
  DATA.stl.forEach(s=>{
    c.appendChild(el('div','','<strong>'+s['STL Component']+'</strong><div class="small">'+(s['Key Functions']||'')+'</div>'));
  });
}

function renderAll(){ renderDashboard(); renderRoadmap(); renderProblems(); renderConcepts(); renderSTL(); }

// init
loadState();
loadData();
document.getElementById('searchInput').addEventListener('input', e=> renderProblems(e.target.value));
