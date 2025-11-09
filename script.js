/* DSA Tracker – robust script with Concepts (Core/Advanced) accordions
   - DOM-safe (waits for DOMContentLoaded)
   - Keeps Dashboard / Roadmap / Problems / STL working
   - Concepts grouped Core/Advanced, links open in new tab (NT1)
*/

(function () {
  const STORAGE_KEY = 'dsa_tracker_v3';
  let DATA = { roadmap: [], concepts: [], stl: [], problems: [] };
  let state = { progress: {} };

  // ---------- small helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html !== undefined) d.innerHTML = html; return d; };
  const openNewTab = (url) => { if (!url) return; window.open(url, '_blank', 'noopener'); };

  function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = JSON.parse(raw); } catch (_) {} }
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }

  async function loadData() {
    const base = 'data/';
    const jobs = [
      ['roadmap', 'roadmap.json'],
      ['concepts', 'concepts.json'],
      ['stl', 'stl.json'],
      ['problems', 'problems.json']
    ];
    for (const [k, f] of jobs) {
      try {
        const r = await fetch(base + f, { cache: 'no-store' });
        DATA[k] = await r.json();
      } catch (e) {
        console.warn('Failed to load', f, e);
        DATA[k] = DATA[k] || [];
      }
    }
  }

  // ---------- Dashboard ----------
  function calcProgress() {
    const total = DATA.problems.length;
    let solved = 0;
    DATA.problems.forEach(p => { if (state.progress['p_' + p.ID]) solved++; });
    const percent = total ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percent };
  }
  function renderDashboard() {
    const solvedEl = $('#solvedCount');
    const totalEl = $('#totalCount');
    const percentEl = $('#percentText');
    const progFill = $('#progFill');
    if (!solvedEl || !totalEl || !percentEl || !progFill) return;

    const p = calcProgress();
    solvedEl.textContent = p.solved;
    totalEl.textContent = p.total;
    percentEl.textContent = p.percent + '%';
    progFill.style.width = p.percent + '%';
  }

  // ---------- Roadmap ----------
  function renderRoadmap() {
    const wrap = $('#roadmapList');
    if (!wrap) return;
    wrap.innerHTML = '';
    (DATA.roadmap || []).forEach(w => {
      const key = 'week_' + w.Week;
      const done = !!state.progress[key];
      const card = el('div', 'topic-card');
      card.innerHTML = `
        <div class="section-title">Week ${w.Week}: ${w.Topic} <span class="badge">${w.Phase || ''}</span></div>
        <div class="small">${w.Goal || ''}</div>
        <div style="display:flex;justify-content:space-between;margin-top:6px">
          <div class="small">~ ${w.Problems || 0} problems</div>
          <button class="${done ? 'btn-done' : 'btn-mark'}" data-week="${w.Week}">${done ? 'Done' : 'Mark Done'}</button>
        </div>`;
      wrap.appendChild(card);
    });
    $$('#roadmapList [data-week]').forEach(b => {
      b.addEventListener('click', (e) => {
        const wk = e.currentTarget.getAttribute('data-week');
        const k = 'week_' + wk;
        if (state.progress[k]) delete state.progress[k]; else state.progress[k] = true;
        saveState(); renderRoadmap(); renderDashboard();
      });
    });
  }

  // ---------- Problems ----------
  function renderProblems(filter = '') {
    const container = $('#problemList');
    if (!container) return;
    container.innerHTML = '';
    const q = (filter || '').toLowerCase();
    const grouped = {};
    (DATA.problems || []).forEach(p => {
      const inSearch = (p.Problem || '').toLowerCase().includes(q)
        || (p.Topic || '').toLowerCase().includes(q)
        || (p.Difficulty || '').toLowerCase().includes(q);
      if (q && !inSearch) return;
      if (!grouped[p.Topic]) grouped[p.Topic] = [];
      grouped[p.Topic].push(p);
    });

    Object.keys(grouped).sort().forEach(topic => {
      const arr = grouped[topic];
      const card = el('div', 'topic-card');
      card.appendChild(el('div', 'section-title', `${topic} <span class="badge">${arr.length} problems</span>`));
      const list = el('div', '');

      const show = 12;
      function addRow(p) {
        const row = el('div', 'problem-row');
        row.innerHTML = `
          <div>
            <div style="font-weight:700">${p.Problem}</div>
            <div class="meta">${p.Platform || ''} • ${p.Difficulty || ''}</div>
          </div>`;
        const right = el('div', '');
        const a = el('a', 'link', 'Open');
        a.href = p.Link || '#'; a.target = '_blank'; a.rel = 'noopener';
        const key = 'p_' + p.ID;
        const btn = el('button', '', state.progress[key] ? 'Solved' : 'Mark');
        btn.style.marginLeft = '8px';
        btn.addEventListener('click', () => {
          if (state.progress[key]) delete state.progress[key]; else state.progress[key] = true;
          saveState(); renderProblems($('#searchInput') ? $('#searchInput').value : ''); renderDashboard();
        });
        right.appendChild(a); right.appendChild(btn);
        row.appendChild(right);
        list.appendChild(row);
      }

      arr.slice(0, show).forEach(addRow);
      card.appendChild(list);

      if (arr.length > show) {
        const more = el('div', 'show-more');
        const btn = el('button', '', 'Show More');
        btn.addEventListener('click', () => {
          list.innerHTML = '';
          arr.forEach(addRow);
          btn.style.display = 'none';
        });
        more.appendChild(btn);
        card.appendChild(more);
      }

      container.appendChild(card);
    });
  }

  // ---------- Concepts (Core/Advanced accordions + direct links) ----------
  function splitConceptsByLevel() {
    const core = [], adv = [];
    (DATA.concepts || []).forEach(c => {
      const lvl = (c.Level || 'Core').toLowerCase();
      (lvl === 'advanced' ? adv : core).push(c);
    });
    return { core, adv };
  }

  function conceptCard(c) {
    const wrap = el('div', 'topic-card');
    wrap.appendChild(el('div', 'section-title', `${c.Subtopic} <span class="badge">${c.Topic}</span>`));
    if (c.Algorithm) wrap.appendChild(el('div', 'small', c.Algorithm));

    const actions = el('div', '');
    actions.style.marginTop = '8px';

    // Videos
    if (c.Videos) {
      const vb = el('div', 'small', '<b>Watch:</b> ');
      const addV = (label, url) => {
        if (!url) return;
        const b = el('button', '', label);
        b.style.marginRight = '6px';
        b.addEventListener('click', () => openNewTab(url));
        vb.appendChild(b);
      };
      addV('Beginner', c.Videos.Beginner);
      addV('Intermediate', c.Videos.Intermediate);
      addV('Advanced', c.Videos.Advanced);
      actions.appendChild(vb);
    }

    // Blogs
    if (Array.isArray(c.Blogs) && c.Blogs.length) {
      const bl = el('div', 'small', '<b>Read:</b> ');
      c.Blogs.forEach(bi => {
        if (!bi || !bi.url) return;
        const a = el('a', 'link', bi.site || 'Blog');
        a.href = bi.url; a.target = '_blank'; a.rel = 'noopener';
        bl.appendChild(document.createTextNode(' '));
        bl.appendChild(a);
      });
      actions.appendChild(bl);
    }

    // Premium
    if (c.Premium) {
      const pr = el('div', 'small', '<b>Premium:</b> ');
      Object.keys(c.Premium).forEach(k => {
        const url = c.Premium[k];
        if (!url) return;
        const a = el('a', 'link', `🌟 ${k}`);
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        pr.appendChild(document.createTextNode(' '));
        pr.appendChild(a);
      });
      actions.appendChild(pr);
    }

    wrap.appendChild(actions);
    return wrap;
  }

  function accordionSection(title, items, open = true) {
    const sec = el('div', 'card', '');
    const head = el('div', '', `
      <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div class="section-title">${title} <span class="badge">${items.length}</span></div>
        <div class="small arrow-icon">${open ? '▼' : '▶'}</div>
      </div>
    `);
    const body = el('div', '', '');
    body.style.display = open ? 'block' : 'none';
    items.forEach(c => body.appendChild(conceptCard(c)));

    head.addEventListener('click', () => {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      head.querySelector('.arrow-icon').textContent = isOpen ? '▶' : '▼';
    });

    sec.appendChild(head);
    sec.appendChild(body);
    return sec;
  }

  function renderConcepts() {
    const container = $('#conceptList');
    if (!container) return;
    container.innerHTML = '';
    const { core, adv } = splitConceptsByLevel();
    container.appendChild(accordionSection('Core Concepts', core, true));
    container.appendChild(accordionSection('Advanced Concepts', adv, false));
  }

  // ---------- STL ----------
  function renderSTL() {
    const s = $('#stlList');
    if (!s) return;
    s.innerHTML = '';
    (DATA.stl || []).forEach(x => {
      s.appendChild(el('div', 'topic-card',
        `<div class="section-title">${x['STL Component']}</div><div class="small">${x['Key Functions'] || ''}</div>`));
    });
  }

  // ---------- NAV bind (safe) ----------
  function bindNav() {
    $$('.bottom-nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.bottom-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const t = btn.dataset.target;
        $$('#main > section').forEach(s => s.style.display = 'none');
        const target = $('#' + t);
        if (target) target.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    });
  }

  // ---------- Problems search bind (safe) ----------
  function bindSearch() {
    const si = $('#searchInput');
    if (si) si.addEventListener('input', e => renderProblems(e.target.value));
  }

  // ---------- Render all ----------
  function renderAll() {
    renderDashboard();
    renderRoadmap();
    renderProblems('');
    renderConcepts();
    renderSTL();
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', async () => {
    loadState();
    bindNav();
    bindSearch();
    await loadData();
    // show Dashboard by default, hide others (safe)
    $$('#main > section').forEach(s => s.style.display = 'none');
    const def = $('#dashboard'); if (def) def.style.display = 'block';
    renderAll();
  });
})();
