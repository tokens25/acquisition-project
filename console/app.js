
  var SVGNS = 'http://www.w3.org/2000/svg';
  function rect(r, cls) {
    var el = document.createElementNS(SVGNS, 'rect');
    el.setAttribute('x', r[0]); el.setAttribute('y', r[1]);
    el.setAttribute('width', r[2]); el.setAttribute('height', r[3]);
    el.setAttribute('rx', '1.5');
    el.setAttribute('class', cls);
    return el;
  }
  function wireframe(mapId, part) {
    var map = MAPS[mapId];
    if (!map || !map.parts[part]) return null;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', map.vb);
    svg.setAttribute('class', 'vis');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Where ' + part + ' sits');
    (map.furn || []).forEach(function (f) { svg.appendChild(rect(f, 'w')); });
    Object.keys(map.parts).forEach(function (k) {
      if (k !== part) svg.appendChild(rect(map.parts[k], 'w'));
    });
    var r = map.parts[part];
    // Big regions get a wash and an edge; small ones read better filled solid.
    if (r[2] * r[3] > 1400) {
      svg.appendChild(rect(r, 'on-wash'));
      svg.appendChild(rect(r, 'on-edge'));
    } else {
      svg.appendChild(rect(r, 'on-fill'));
    }
    return svg;
  }

  var CUSTOM_ID = 'custom';
  var TABS = [
    { id: 'default', label: 'Default view', note: 'Before you open a step' },
    { id: 'edit', label: 'Edit view', note: 'Once a step is open' },
    { id: 'archive', label: 'Archive', note: 'The frame, and the shared bits' }
  ];
  var KEY = 'acq-feedback-v4';
  var PRIS = ['now', 'next', 'idea'];
  var PRI_LABEL = { now: 'Now', next: 'Next', idea: 'Idea' };
  var open = {};

  var store = { notes: {}, pri: {}, custom: [], tab: 'default' };
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.notes) {
      store = {
        notes: raw.notes || {}, pri: raw.pri || {}, custom: raw.custom || [],
        tab: ['edit', 'archive'].indexOf(raw.tab) >= 0 ? raw.tab : 'default'
      };
    } else {
      // Carry notes forward from earlier versions of this page.
      var old = JSON.parse(localStorage.getItem('acq-feedback-v3') ||
                           localStorage.getItem('acq-feedback-v2') || 'null');
      if (old && old.notes) { store.notes = old.notes; store.pri = old.pri || {}; store.custom = old.custom || []; }
      else {
        var v1 = JSON.parse(localStorage.getItem('acq-feedback-v1') || 'null');
        if (v1) store.notes = v1;
      }
    }
  } catch (e) { /* private mode, or nothing saved */ }

  var sheet = document.getElementById('sheet');
  var tabsEl = document.getElementById('tabs');
  var tally = document.getElementById('tally');
  var toast = document.getElementById('toast');
  var toastTimer;
  /** Set by the boot probe. null until we know; false when there is no dev server. */
  var live = null;
  var busy = false;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
  }
  function say(msg) {
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.textContent = ''; }, 2800);
  }
  function noted(name) { return (store.notes[name] || '').trim(); }
  function grow(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  function esc(s) { return s.replace(/"/g, '\\"'); }

  /**
   * Sends one instruction to Claude Code running in this checkout.
   *
   * Only possible when the page is served by the dev server — the published
   * artifact cannot reach localhost, which is why the buttons hide themselves
   * rather than failing when pressed.
   */
  function ask(body, statusEl, btn) {
    if (busy) { setStatus(statusEl, 'err', 'Claude is already working on something.'); return; }
    busy = true;
    setBusy(true);

    var started = Date.now();
    var tick = setInterval(function () {
      setStatus(statusEl, 'run', 'working… ' + Math.round((Date.now() - started) / 1000) + 's');
    }, 1000);
    setStatus(statusEl, 'run', 'working… 0s');

    fetch('/api/claude', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || res.d.error) {
          setStatus(statusEl, 'err', res.d.error || 'Something went wrong.');
          return;
        }
        var bits = [];
        if (res.d.seconds != null) bits.push(res.d.seconds + 's');
        if (res.d.turns != null) bits.push(res.d.turns + ' turns');
        if (res.d.cost != null) bits.push('$' + Number(res.d.cost).toFixed(3));
        var head = 'done · ' + bits.join(' · ');
        var reply = (res.d.result || '').trim();
        setStatus(statusEl, res.d.ok === false ? 'err' : 'ok', reply ? head + '\n' + reply : head);
      })
      .catch(function (e) {
        setStatus(statusEl, 'err', 'Could not reach the dev server. ' + e.message);
      })
      .then(function () {
        clearInterval(tick);
        busy = false;
        setBusy(false);
        if (btn) btn.focus();
      });
  }

  function setStatus(el, state, text) {
    if (!el) return;
    el.dataset.state = state;
    el.textContent = text;
  }

  /**
   * While a run is in flight, nothing else may start one.
   *
   * Releasing does not simply enable everything — a row with an empty box was
   * disabled before the run and must stay that way.
   */
  function setBusy(on) {
    var all = document.getElementById('sendall');
    if (all) all.disabled = on;
    Array.prototype.forEach.call(document.querySelectorAll('.send'), function (b) {
      if (on) { b.disabled = true; return; }
      var row = b.closest('.row');
      b.disabled = !(row && noted(row.dataset.name));
    });
  }

  function groups() {
    return AREAS.concat([[CUSTOM_ID, 'Your own', 'both',
      'Anything with no name yet. Say what it does and where, and I will name it.',
      store.custom.map(function (c) {
        return [c.name, c.anchor || 'added by you', c.what || '', null];
      })]]);
  }
  function inTab(g, tab) {
    if (g[2] === tab) return true;
    return g[2] === 'both' && tab !== 'archive';
  }
  /** How a section is titled outside the tabs — in the copy, where there is no tab. */
  function fullTitle(g) {
    if (g[2] === 'default') return 'Default view — ' + g[1];
    if (g[2] === 'edit') return 'Edit view — ' + g[1];
    return g[1];
  }

  // ── Tabs ──────────────────────────────────────────────
  function buildTabs() {
    tabsEl.textContent = '';
    TABS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.dataset.tab = t.id;
      b.setAttribute('aria-selected', store.tab === t.id ? 'true' : 'false');

      var label = document.createElement('span');
      label.className = 'tab__label';
      label.textContent = t.label;
      var note = document.createElement('span');
      note.className = 'tab__note';
      note.textContent = t.note;
      var badge = document.createElement('span');
      badge.className = 'tab__badge';
      badge.dataset.for = t.id;

      b.appendChild(label); b.appendChild(note); b.appendChild(badge);
      b.addEventListener('click', function () {
        if (store.tab === t.id) return;
        store.tab = t.id;
        save();
        render();
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
      tabsEl.appendChild(b);
    });
  }

  // ── Render ────────────────────────────────────────────
  function buildRow(name, anchor, what, mapId, isCustom, sectionTitle) {
    var el = document.createElement('div');
    el.className = 'row';
    el.dataset.hay = (name + ' ' + anchor + ' ' + what).toLowerCase();
    el.dataset.name = name;

    var c1 = document.createElement('div');
    c1.className = 'name';
    c1.textContent = name;
    var a = document.createElement('code');
    a.className = 'anchor';
    a.textContent = anchor;
    c1.appendChild(a);

    var c2 = document.createElement('div');
    var art = mapId ? wireframe(mapId, name) : null;
    if (art) c2.appendChild(art);
    else {
      var none = document.createElement('div');
      none.className = 'vis-none';
      none.textContent = 'no map yet';
      c2.appendChild(none);
    }

    var c3 = document.createElement('div');
    c3.className = 'what';
    c3.textContent = what;

    var c4 = document.createElement('div');
    c4.className = 'cell';

    var ta = document.createElement('textarea');
    ta.rows = 1;
    ta.placeholder = 'What should change here?';
    ta.value = store.notes[name] || '';
    ta.setAttribute('aria-label', 'Feedback for ' + name);

    var pri = document.createElement('div');
    pri.className = 'pri';
    PRIS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.p = p;
      b.textContent = PRI_LABEL[p];
      b.setAttribute('aria-label', PRI_LABEL[p] + ' — ' + name);
      b.addEventListener('click', function () {
        if (store.pri[name] === p) delete store.pri[name];
        else store.pri[name] = p;
        paintRow(el, name, pri);
        save();
        recount();
      });
      pri.appendChild(b);
    });

    ta.addEventListener('input', function () {
      store.notes[name] = ta.value;
      grow(ta);
      paintRow(el, name, pri);
      if (!busy) send.disabled = !ta.value.trim();
      save();
      recount();
    });

    var foot = document.createElement('div');
    foot.className = 'cell__foot';
    foot.appendChild(pri);
    var gap = document.createElement('span');
    gap.className = 'spacer';
    foot.appendChild(gap);

    var status = document.createElement('p');
    status.className = 'sent';

    var send = document.createElement('button');
    send.type = 'button';
    send.className = 'send';
    send.textContent = 'Send';
    send.title = 'Send this note to Claude Code, working in this checkout';
    send.hidden = !live;
    send.disabled = !(store.notes[name] || '').trim();
    send.addEventListener('click', function () {
      var text = (store.notes[name] || '').trim();
      if (!text) { setStatus(status, 'err', 'Write something first.'); return; }
      ask({ prompt: text, name: name, anchor: anchor, section: sectionTitle }, status, send);
    });
    foot.appendChild(send);

    // Cmd/Ctrl + Enter sends, so a note can go without reaching for the mouse.
    ta.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send.click(); }
    });

    c4.appendChild(ta);
    c4.appendChild(foot);
    c4.appendChild(status);

    if (isCustom) {
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'drop';
      del.textContent = 'Remove this area';
      del.addEventListener('click', function () {
        store.custom = store.custom.filter(function (c) { return c.name !== name; });
        delete store.notes[name];
        delete store.pri[name];
        save();
        render();
      });
      c4.appendChild(del);
    }

    el.appendChild(c1); el.appendChild(c2); el.appendChild(c3); el.appendChild(c4);
    paintRow(el, name, pri);
    requestAnimationFrame(function () { grow(ta); });
    return el;
  }

  function paintRow(el, name, pri) {
    if (noted(name)) el.setAttribute('data-note', '');
    else el.removeAttribute('data-note');
    if (store.pri[name]) el.setAttribute('data-pri', store.pri[name]);
    else el.removeAttribute('data-pri');
    Array.prototype.forEach.call(pri.children, function (b) {
      b.setAttribute('aria-pressed', store.pri[name] === b.dataset.p ? 'true' : 'false');
    });
  }

  function render() {
    sheet.textContent = '';
    Array.prototype.forEach.call(tabsEl.children, function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === store.tab ? 'true' : 'false');
    });

    groups().filter(function (g) { return inTab(g, store.tab); }).forEach(function (group) {
      var id = group[0], title = group[1], view = group[2], blurb = group[3], rows = group[4];
      var isCustom = id === CUSTOM_ID;
      var domId = 'sec-' + id;

      var sec = document.createElement('section');
      sec.id = domId;
      sec.dataset.sec = id;
      sec.dataset.view = view;
      if (!open[id]) sec.className = 'shut';

      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'sec-head';
      head.setAttribute('aria-expanded', open[id] ? 'true' : 'false');

      var chev = document.createElement('span');
      chev.className = 'sec-head__chev';
      var h2 = document.createElement('h2');
      h2.className = 'sec-head__title';
      h2.textContent = title;
      var count = document.createElement('span');
      count.className = 'sec-head__count';
      count.dataset.for = id;

      head.appendChild(chev); head.appendChild(h2);
      if (view === 'both') {
        var shared = document.createElement('span');
        shared.className = 'sec-head__shared';
        shared.textContent = 'both views';
        head.appendChild(shared);
      }
      head.appendChild(count);
      head.addEventListener('click', function () {
        var shut = !sec.classList.contains('shut');
        sec.classList.toggle('shut', shut);
        head.setAttribute('aria-expanded', shut ? 'false' : 'true');
        if (shut) delete open[id]; else open[id] = true;
      });
      sec.appendChild(head);

      if (blurb) {
        var p = document.createElement('p');
        p.className = 'sec-blurb';
        p.textContent = blurb;
        sec.appendChild(p);
      }

      rows.forEach(function (r) {
        sec.appendChild(buildRow(r[0], r[1], r[2], r[3], isCustom, fullTitle(group)));
      });

      if (isCustom) {
        var wrap = document.createElement('div');
        wrap.className = 'addrow';
        var add = document.createElement('button');
        add.type = 'button';
        add.className = 'act';
        add.textContent = 'Add an area';
        add.addEventListener('click', function () {
          var nm = prompt('What is it called? If it has no name yet, describe it and I will name it.');
          if (!nm || !nm.trim()) return;
          nm = nm.trim();
          if (store.custom.some(function (c) { return c.name === nm; })) { say('That one is already listed'); return; }
          var where = prompt('Where is it? A selector, a screen, or just "top right of the panel".') || 'added by you';
          store.custom.push({ name: nm, anchor: where.trim(), what: '' });
          open[CUSTOM_ID] = true;
          save();
          render();
          var t = sheet.querySelector('[data-name="' + esc(nm) + '"] textarea');
          if (t) t.focus();
        });
        wrap.appendChild(add);
        sec.appendChild(wrap);
      }

      sheet.appendChild(sec);

    });

    recount();
  }

  // ── Counts ────────────────────────────────────────────
  function recount() {
    var counts = { now: 0, next: 0, idea: 0, none: 0 };
    var total = 0;
    var perTab = { default: 0, edit: 0, archive: 0 };

    groups().forEach(function (group) {
      var n = 0;
      group[4].forEach(function (r) {
        if (!noted(r[0])) return;
        n++; total++;
        counts[store.pri[r[0]] || 'none']++;
      });
      if (n) {
        if (group[2] === 'both') { perTab.default += n; perTab.edit += n; }
        else perTab[group[2]] += n;
      }
      var el = sheet.querySelector('[data-for="' + group[0] + '"]');
      if (!el) return;
      el.textContent = group[4].length + (group[4].length === 1 ? ' area' : ' areas');
      if (n) {
        var b = document.createElement('b');
        b.textContent = ' · ' + n + ' noted';
        el.appendChild(b);
      }
    });

    TABS.forEach(function (t) {
      var el = tabsEl.querySelector('[data-for="' + t.id + '"]');
      if (el) el.textContent = perTab[t.id] ? String(perTab[t.id]) : '';
    });

    tally.textContent = '';
    if (!total) { tally.textContent = 'Nothing noted yet'; return; }
    var b0 = document.createElement('b');
    b0.textContent = total + ' noted';
    tally.appendChild(b0);
    [['now', 'c-now'], ['next', 'c-next'], ['idea', 'c-idea']].forEach(function (p) {
      if (!counts[p[0]]) return;
      var s = document.createElement('span');
      s.className = p[1];
      s.textContent = '   ' + counts[p[0]] + ' ' + PRI_LABEL[p[0]].toLowerCase();
      tally.appendChild(s);
    });
    if (counts.none) {
      var s2 = document.createElement('span');
      s2.textContent = '   ' + counts.none + ' unmarked';
      tally.appendChild(s2);
    }
  }

  // ── Gathering every note ──────────────────────────────
  // Always takes every note, from all three tabs — a tab is a way to look at
  // the table, not a way to cut down what gets sent.
  function assemble() {
    var all = [];
    groups().forEach(function (group) {
      group[4].forEach(function (r) {
        if (!noted(r[0])) return;
        all.push({
          section: fullTitle(group), name: r[0], anchor: r[1],
          pri: store.pri[r[0]] || null,
          text: store.notes[r[0]].trim().replace(/\s+/g, ' ')
        });
      });
    });
    if (!all.length) return null;

    var lines = [];
    function block(items, heading) {
      lines.push(heading);
      var last = null;
      items.forEach(function (x) {
        if (x.section !== last) { lines.push('### ' + x.section); last = x.section; }
        lines.push('- **' + x.name + '** (`' + x.anchor + '`) — ' + x.text);
      });
      lines.push('');
    }

    if (all.some(function (x) { return x.pri; })) {
      [['now', '## Do first'], ['next', '## Then'], ['idea', '## Ideas, no rush'], [null, '## Unmarked']]
        .forEach(function (g) {
          var items = all.filter(function (x) { return x.pri === g[0]; });
          if (items.length) block(items, g[1]);
        });
    } else {
      var last = null;
      all.forEach(function (x) {
        if (x.section !== last) { lines.push('## ' + x.section); last = x.section; }
        lines.push('- **' + x.name + '** (`' + x.anchor + '`) — ' + x.text);
      });
    }

    return {
      count: all.length,
      text: 'Feedback on the acquisition tool — ' + all.length +
            (all.length === 1 ? ' area' : ' areas') + ':\n\n' + lines.join('\n').trim()
    };
  }

  document.getElementById('copy').addEventListener('click', function () {
    var got = assemble();
    if (!got) { say('Nothing noted yet'); return; }
    navigator.clipboard.writeText(got.text).then(
      function () { say('Copied ' + got.count + ' from all tabs'); },
      function () { say('Copy blocked by the browser; select the text by hand'); }
    );
  });

  // ── Send all ──────────────────────────────────────────
  // One run carrying the whole pass, in the order the priorities set. Sending
  // note by note would start a fresh agent per row, and they would undo each
  // other where two notes touch the same file.
  document.getElementById('sendall').addEventListener('click', function () {
    var got = assemble();
    var status = document.getElementById('allstatus');
    if (!got) { setStatus(status, 'err', 'Nothing noted yet.'); return; }
    if (!confirm('Send all ' + got.count + ' notes to Claude? It will edit files in this checkout, and commit nothing.')) return;
    ask({
      prompt: got.text + '\n\nWork through these in the order given. NAMING.md maps every' +
              ' component name to where it lives. Keep the build passing, and do not commit.'
    }, status, null);
  });

  document.getElementById('clear').addEventListener('click', function () {
    if (!confirm('Clear every note on this page, in both tabs? Areas you added stay.')) return;
    store.notes = {};
    store.pri = {};
    save();
    render();
    say('Cleared');
  });

  function sizeHead() {
    var top = document.querySelector('.top');
    if (top) document.documentElement.style.setProperty('--head-h', top.offsetHeight + 'px');
  }
  window.addEventListener('resize', sizeHead);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeHead);

  /**
   * Is there a dev server behind this page?
   *
   * Served from Vite, /api/claude answers and the send buttons appear. Opened
   * as a published artifact, the request cannot leave the sandbox, so they stay
   * hidden and Copy feedback remains the way out. Neither case is an error, so
   * neither says anything alarming.
   */
  function probe() {
    fetch('/api/claude', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        live = Boolean(d && d.available);
        if (!live) { offline(); return; }
        document.getElementById('sendall').hidden = false;
        document.getElementById('copy').classList.remove('primary');
        Array.prototype.forEach.call(document.querySelectorAll('.send'), function (b) {
          b.hidden = false;
        });
        var lede = document.getElementById('lede');
        if (lede) {
          lede.textContent = 'Find the area, say what should change, then send it straight to Claude.';
        }
        sizeHead();
      })
      .catch(function () { live = false; offline(); });
  }

  /**
   * Says why there are no send buttons.
   *
   * Opened as a file:// or as a published artifact there is no dev server to
   * reach, and silently hiding the buttons reads as "this feature is missing"
   * rather than "you are on the wrong copy".
   */
  function offline() {
    var lede = document.getElementById('lede');
    if (!lede) return;
    lede.textContent = 'Find the area, say what should change, then copy it over. ';
    var a = document.createElement('a');
    a.href = 'http://localhost:5173/feedback.html';
    a.textContent = 'Open the localhost copy to send straight to Claude.';
    a.className = 'lede__link';
    lede.appendChild(a);
    sizeHead();
  }

  buildTabs();
  render();
  sizeHead();
  probe();
})();
</script>
