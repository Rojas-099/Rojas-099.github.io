/* =========================================================
   GAMES.JS — 4 minijuegos rápidos y animados, uno cada 2 salas.
   Los datos salen del texto de las salas (data.js) y del guion.
   1. Memory Cards (1995–1996): las cartas se muestran 2 s, se voltean
      en 3D y hay que encontrar 4 parejas antes de 60 s.
   2. Spec Dice (1997–1998): un dado 3D rueda y cae en una cara; cada
      cara trae un dato real y una pregunta con 15 s.
   3. True or False? (1999–2000): cartas que se deslizan a la derecha
      (True) o a la izquierda (False), 10 s por carta, con racha.
   4. Guess It! (2001–2002): barra para adivinar, dibujo que cambia de
      tamaño, 20 s por pregunta y marcador que corre hasta la respuesta.
   Sonidos cortos con Web Audio (se pueden apagar) y confeti al ganar.
   Comparaciones con "un celular de hoy": valores típicos aproximados.
   ========================================================= */
const GAMES = (() => {
  const LIST = [
    { title: 'Memory Cards', years: '1995 – 1996', after: 2, how: 'Look fast! The cards show for two seconds. Then flip two at a time and find the 4 pairs before the time runs out.' },
    { title: 'Spec Dice', years: '1997 – 1998', after: 4, how: 'Roll the die three times. Each face shows a real number from 1997 or 1998. Answer before the time runs out!' },
    { title: 'True or False?', years: '1999 – 2000', after: 6, how: 'Swipe the card right for TRUE or left for FALSE (or tap the buttons). Be quick: 12 seconds per card!' },
    { title: 'Guess It!', years: '2001 – 2002', after: 8, how: 'Move the slider to guess the number, then watch how close you were. 20 seconds per question!' }
  ];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Ayudas comunes: limpieza, sonido, tiempo, confeti ---------- */
  let run = 0;                 // cambia cada vez que se abre, reinicia o cierra un juego
  const live = id => { const b = document.getElementById('g-box'); return id === run && b && b.offsetParent !== null; };
  const later = (id, fn, ms) => setTimeout(() => { if (live(id)) fn(); }, ms);

  let AC = null, muted = false;
  try { muted = localStorage.getItem('rot-mute') === '1'; } catch (e) {}
  function sfx(kind) {
    if (muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const notes = {
        ok: [[660, 0, .09], [880, .09, .14]], bad: [[180, 0, .22]], flip: [[520, 0, .05]], tick: [[1200, 0, .03]],
        roll: [[300, 0, .04], [360, .06, .04], [320, .12, .04], [400, .18, .04]],
        win: [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .3]]
      }[kind] || [];
      notes.forEach(([f, t, d]) => {
        const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + t;
        o.type = kind === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.02);
      });
    } catch (e) {}
  }

  // barra de tiempo: devuelve { stop(), left() }
  function timer(id, el, secs, onEnd) {
    const t0 = performance.now(); let stopped = false, lastTick = 4;
    el.innerHTML = '<i></i><span></span>';
    const bar = el.firstChild, lab = el.lastChild;
    const step = () => {
      if (stopped || !live(id)) return;
      const left = Math.max(0, secs - (performance.now() - t0) / 1000);
      bar.style.width = (left / secs * 100) + '%';
      el.classList.toggle('hurry', left < Math.min(5, secs / 3));
      lab.textContent = Math.ceil(left) + ' s';
      if (left <= 3 && Math.ceil(left) < lastTick) { lastTick = Math.ceil(left); sfx('tick'); }
      if (left <= 0) { stopped = true; onEnd(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return { stop() { stopped = true; }, left: () => Math.max(0, secs - (performance.now() - t0) / 1000) };
  }

  function confetti(box) {
    const host = box.closest('.win-body') || box, c = document.createElement('canvas');
    c.className = 'g-confetti'; host.appendChild(c);
    const r = host.getBoundingClientRect(); c.width = r.width; c.height = r.height;
    c.style.top = host.scrollTop + 'px';
    const g = c.getContext('2d'), cols = ['#e8c45a', '#2f7d32', '#c0392b', '#1f5fa8', '#e67e22', '#8e44ad'];
    const ps = Array.from({ length: 110 }, () => ({ x: c.width / 2, y: c.height * 0.45, vx: (Math.random() - .5) * 12, vy: -Math.random() * 11 - 3, s: 5 + Math.random() * 6, a: Math.random() * 6, c: cols[Math.random() * cols.length | 0] }));
    const t0 = performance.now();
    const step = now => {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (now - t0 < 2200) requestAnimationFrame(step); else c.remove();
    };
    requestAnimationFrame(step);
  }

  function popText(el, text, good) {
    const s = document.createElement('div'); s.className = 'g-pop ' + (good ? 'good' : 'bad'); s.textContent = text;
    el.appendChild(s); setTimeout(() => s.remove(), 900);
  }

  function finish(box, id, msg, stars) {
    const end = document.createElement('div');
    end.className = 'g-win';
    end.innerHTML = `<div class="g-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? 'on' : ''}">★</span>`).join('')}</div>
      <div class="g-big">${esc(msg)}</div><button class="btn default" id="g-again">Play again</button>`;
    box.appendChild(end);
    end.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (stars >= 2) { sfx('win'); setTimeout(() => confetti(box), 250); } else sfx('bad');
    end.querySelector('#g-again').onclick = () => start(box, box.dataset.game | 0);
  }

  /* ---------- 1. Memory Cards (1995–1996) ---------- */
  function memory(box, id) {
    const pairs = [
      ['Butterfly keyboard', 'Opened wider than the ThinkPad, like wings'],
      ['MoMA', 'Art museum that keeps the ThinkPad 701C'],
      ['PowerBook 1400', 'First PowerBook with a built-in CD-ROM'],
      ['BookCover', 'Lid cover you could personalize']
    ];
    const cards = shuffle(pairs.flatMap((p, i) => [{ id: i, text: p[0], big: true }, { id: i, text: p[1] }]));
    let open = [], found = 0, moves = 0, lock = true, t = null;
    box.innerHTML = `<div class="g-bar"><span class="g-status" id="g-st">Pairs: 0 / 4 · Moves: 0</span><div class="g-timer" id="g-t"></div></div>
      <div class="mem-grid">${cards.map((c, k) =>
        `<button class="mem-card up" data-k="${k}" aria-label="Card ${k + 1}" style="--d:${k * 60}ms"><span class="inner"><span class="front">?</span><span class="back${c.big ? ' big' : ''}">${esc(c.text)}</span></span></button>`).join('')}</div>
      <p class="g-peek" id="g-peek">Memorize the cards…</p>`;
    const st = box.querySelector('#g-st');
    // vistazo de 2 segundos y luego todas se voltean
    later(id, () => {
      box.querySelectorAll('.mem-card').forEach(b => b.classList.remove('up')); sfx('flip');
      box.querySelector('#g-peek').textContent = 'Go!';
      lock = false;
      t = timer(id, box.querySelector('#g-t'), 60, () => { lock = true; finish(box, id, `Time’s up! You found ${found} of 4 pairs.`, found >= 3 ? 1 : 0); });
    }, 2200);
    box.querySelectorAll('.mem-card').forEach(b => b.onclick = () => {
      if (lock || b.classList.contains('up')) return;
      b.classList.add('up'); open.push(b); sfx('flip');
      if (open.length < 2) return;
      moves++;
      const [a, c] = open, same = cards[a.dataset.k].id === cards[c.dataset.k].id;
      if (same) {
        a.classList.add('ok'); c.classList.add('ok'); found++; open = []; sfx('ok'); popText(c, '+1 pair!', true);
      } else {
        lock = true; a.classList.add('shake'); c.classList.add('shake'); sfx('bad');
        later(id, () => { a.classList.remove('up', 'shake'); c.classList.remove('up', 'shake'); open = []; lock = false; }, 850);
      }
      st.textContent = `Pairs: ${found} / 4 · Moves: ${moves}`;
      if (found === 4) {
        t.stop(); lock = true;
        const secs = Math.round(60 - t.left());
        finish(box, id, `All 4 pairs in ${secs} seconds and ${moves} moves!`, moves <= 6 ? 3 : moves <= 9 ? 2 : 1);
      }
    });
  }

  /* ---------- 2. Spec Dice (1997–1998) ---------- */
  function dice(box, id) {
    const faces = [
      { label: 'Power Macintosh G3, 1997', then: 'PowerPC G3', q: 'The Power Macintosh G3 was the first Mac with…', opts: ['the PowerPC G3 processor', 'a touch screen', 'Wi-Fi'], ok: 0, note: 'It was the first Mac with the PowerPC G3 processor.' },
      { label: 'Power Macintosh G3 speed, 1997', then: '233 or 266 MHz', q: 'Phone chips today run at about 3 GHz (3,000 MHz). About how many times faster is that than 233 MHz?', opts: ['About 3 times', 'About 13 times', 'About 130 times'], ok: 1, note: '3,000 ÷ 233 ≈ 13 times faster, and phones have many cores too!' },
      { label: 'iMac price, 1998', then: 'about $1,300', q: 'What did about $1,300 buy in 1998?', opts: ['Only the screen', 'The whole iMac, screen included, in one case', 'Just the keyboard'], ok: 1, note: 'The iMac was an all-in-one computer for about $1,300.' },
      { label: 'iMac memory (RAM), 1998', then: '32 MB', q: 'A phone today has about 8 GB of RAM. How many times more than the iMac?', opts: ['About 25 times', 'About 250 times', 'About 2,500 times'], ok: 1, note: '8 GB = 8,192 MB, about 250 times the iMac’s 32 MB.' },
      { label: 'iMac hard drive, 1998', then: '4 GB', q: 'A phone today stores about 128 GB. How many iMac hard drives is that?', opts: ['4', '32', '320'], ok: 1, note: '128 ÷ 4 = 32 iMac hard drives.' },
      { label: 'iMac screen, 1998', then: '15 inches', q: 'Where was the iMac’s 15-inch screen?', opts: ['In a separate box', 'In the same translucent case as the computer', 'It had no screen'], ok: 1, note: 'Screen, computer and CD-ROM were all in one translucent Bondi Blue case.' }
    ];
    const pipMap = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    const face = n => `<div class="df f${n}">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => `<i class="${pipMap[n].includes(p) ? 'on' : ''}"></i>`).join('')}</div>`;
    // rotación que deja la cara n al frente
    const rot = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
    const ROUNDS = 3;
    let score = 0, round = 0, spin = 0, t = null;
    const unused = shuffle([1, 2, 3, 4, 5, 6]);
    box.innerHTML = `<div class="g-bar"><span class="g-status" id="g-st">Roll 0 / ${ROUNDS} · Score: 0</span><div class="g-timer" id="g-t"></div></div>
      <div class="dice-row"><div class="die3d-wrap"><div class="die3d" id="g-die">${[1, 2, 3, 4, 5, 6].map(face).join('')}</div></div>
      <button class="btn default g-roll" id="g-roll">🎲 Roll the die</button></div>
      <div id="g-face"></div>`;
    const die = box.querySelector('#g-die'), rollBtn = box.querySelector('#g-roll'), st = box.querySelector('#g-st');
    rollBtn.onclick = () => {
      rollBtn.disabled = true; box.querySelector('#g-face').innerHTML = ''; round++;
      const n = unused.pop(), f = faces[n - 1];
      spin += 2;
      const [rx, ry] = rot[n];
      const wrap = die.parentNode; wrap.classList.remove('hop'); void wrap.offsetWidth; wrap.classList.add('hop');
      die.style.transform = `rotateX(${rx + spin * 360}deg) rotateY(${ry + spin * 360}deg)`;
      sfx('roll'); later(id, () => sfx('roll'), 450);
      later(id, () => {
        const holder = box.querySelector('#g-face');
        holder.innerHTML = `<div class="g-card slide-in"><small>${esc(f.label)}</small><div class="g-big">${esc(f.then)}</div><p>${esc(f.q)}</p>
          <div class="g-opts">${f.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o)}</button>`).join('')}</div><p class="g-note" hidden></p></div>`;
        const btns = holder.querySelectorAll('.g-opts .btn');
        let done = false;
        const answer = picked => {
          if (done) return; done = true; t.stop();
          const ok = picked === f.ok; if (ok) score++;
          btns.forEach(x => { x.disabled = true; if (+x.dataset.i === f.ok) x.classList.add('right'); });
          if (picked >= 0 && !ok) btns[picked].classList.add('wrong');
          sfx(ok ? 'ok' : 'bad'); popText(holder.firstChild, ok ? '+1' : (picked < 0 ? 'Too slow!' : 'Oops!'), ok);
          const note = holder.querySelector('.g-note'); note.hidden = false;
          note.textContent = (ok ? 'Correct! ' : picked < 0 ? 'Time’s up! ' : 'Not quite. ') + f.note;
          st.textContent = `Roll ${round} / ${ROUNDS} · Score: ${score}`;
          if (round < ROUNDS) { rollBtn.disabled = false; rollBtn.textContent = '🎲 Roll again'; } else {
            rollBtn.textContent = '🎲 Done!';
            later(id, () => finish(box, id, `You got ${score} of ${ROUNDS} right!`, score), 900);
          }
        };
        btns.forEach(b => b.onclick = () => answer(+b.dataset.i));
        st.textContent = `Roll ${round} / ${ROUNDS} · Score: ${score}`;
        t = timer(id, box.querySelector('#g-t'), 15, () => answer(-1));
        holder.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 1300);
    };
  }

  /* ---------- 3. True or False? (1999–2000) ---------- */
  function truefalse(box, id) {
    const cards = shuffle([
      { s: 'The iBook was the first “wireless ready” laptop.', a: true, why: 'It had built-in antennas and a slot for an AirPort card.' },
      { s: 'The iBook had a 15-inch screen.', a: false, why: 'It had a 12.1-inch display.' },
      { s: 'With an AirPort card, up to 10 computers could share one Internet connection.', a: true, why: 'Up to 10 computers, at up to 11 Mbps.' },
      { s: 'The Power Mac G4 Cube was as big as a washing machine.', a: false, why: 'It fit inside an eight-inch cube.' },
      { s: 'The G4 Cube had a 450 MHz processor.', a: true, why: 'A 450 MHz PowerPC G4, with 500 MHz as an option.' },
      { s: 'The G4 Cube had a clear case.', a: true, why: 'Its enclosure was clear acrylic.' },
      { s: 'The iBook came out in the year 2000.', a: false, why: 'It came out on July 21, 1999.' }
    ]).slice(0, 6);
    let k = 0, score = 0, streak = 0;
    const show = () => {
      if (k >= cards.length) return finish(box, id, `You got ${score} of ${cards.length} right!`, score >= 6 ? 3 : score >= 4 ? 2 : score >= 3 ? 1 : 0);
      const c = cards[k];
      box.innerHTML = `<div class="g-bar"><span class="g-status">Card ${k + 1} / ${cards.length} · Score: ${score}${streak >= 2 ? ` · 🔥 ${streak} in a row` : ''}</span><div class="g-timer" id="g-t"></div></div>
        <div class="tf-zone"><div class="tf-hint l">◀ FALSE</div><div class="tf-hint r">TRUE ▶</div>
        <div class="g-card tf-card enter" id="g-card"><p class="g-big2">${esc(c.s)}</p><div class="tf-stamp"></div></div></div>
        <div class="g-opts two"><button class="btn tf-f" data-a="0">✗ False</button><button class="btn tf-t" data-a="1">✓ True</button></div><p class="g-note" hidden></p>`;
      const card = box.querySelector('#g-card'), btns = box.querySelectorAll('.g-opts .btn');
      let done = false, t = null;
      const answer = v => {        // v: true, false o null (se acabó el tiempo)
        if (done) return; done = true; t.stop();
        const ok = v === c.a; if (ok) { score++; streak++; } else streak = 0;
        btns.forEach(x => { x.disabled = true; if ((x.dataset.a === '1') === c.a) x.classList.add('right'); });
        const stamp = card.querySelector('.tf-stamp'); stamp.textContent = c.a ? 'TRUE' : 'FALSE'; stamp.className = 'tf-stamp show ' + (c.a ? 't' : 'f');
        card.classList.remove('enter');
        card.style.transition = 'transform .5s ease-in, opacity .5s';
        card.style.transform = v === null ? 'scale(.94)' : `translateX(${v ? 22 : -22}%) rotate(${v ? 6 : -6}deg)`;
        card.classList.add(ok ? 'good' : 'bad');
        sfx(ok ? 'ok' : 'bad');
        const note = box.querySelector('.g-note'); note.hidden = false;
        note.innerHTML = `${ok ? 'Correct!' : v === null ? 'Time’s up!' : 'Not quite.'} It is <b>${c.a ? 'TRUE' : 'FALSE'}</b>. ${esc(c.why)}<br><button class="btn default" id="g-next">${k + 1 < cards.length ? 'Next card ▶' : 'See score'}</button>`;
        box.querySelector('#g-next').onclick = () => { k++; show(); };
      };
      btns.forEach(b => b.onclick = () => answer(b.dataset.a === '1'));
      // deslizar la carta con el dedo o el mouse
      let sx = null;
      card.addEventListener('pointerdown', e => { if (done) return; sx = e.clientX; card.setPointerCapture(e.pointerId); card.classList.remove('enter'); card.style.transition = 'none'; });
      card.addEventListener('pointermove', e => {
        if (sx === null) return; const dx = e.clientX - sx;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
        card.classList.toggle('lean-t', dx > 40); card.classList.toggle('lean-f', dx < -40);
      });
      const up = e => {
        if (sx === null) return; const dx = e.clientX - sx; sx = null; card.classList.remove('lean-t', 'lean-f');
        if (Math.abs(dx) > 70) answer(dx > 0);
        else { card.style.transition = 'transform .25s'; card.style.transform = ''; }
      };
      card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
      t = timer(id, box.querySelector('#g-t'), 12, () => answer(null));
    };
    show();
  }

  /* ---------- 4. Guess It! (2001–2002) ---------- */
  function guess(box, id) {
    const qs = [
      { q: 'How much did the Titanium PowerBook G4 (2001) weigh?', min: 0.5, max: 8, step: 0.1, ans: 2.4, vis: 'weight', fmt: v => (+v).toFixed(1) + ' kg', fact: 'About 2.4 kg (5.3 pounds), and only one inch thick!' },
      { q: 'What was the starting price of the Titanium PowerBook G4?', min: 500, max: 5000, step: 50, ans: 2599, vis: 'price', fmt: v => 'US $' + Math.round(v).toLocaleString('en-US'), fact: 'Prices started at US $2,599.' },
      { q: 'How big was the flat screen of the iMac G4 (2002)?', min: 10, max: 30, step: 1, ans: 15, vis: 'screen', fmt: v => Math.round(v) + ' inches', fact: 'A 15-inch flat screen on a chrome neck that moves, like a sunflower.' }
    ];
    let k = 0, points = 0;
    const visual = (c, v) => {
      const f = (v - c.min) / (c.max - c.min);
      if (c.vis === 'weight') return `<div class="gv-scale"><div class="gv-laptop" style="transform:scale(${0.6 + f * 0.9})">💻</div><div class="gv-dial"><i style="transform:rotate(${-80 + f * 160}deg)"></i></div></div>`;
      if (c.vis === 'price') return `<div class="gv-money">${'<span>💵</span>'.repeat(1 + Math.round(f * 11))}</div>`;
      return `<div class="gv-screen"><div style="width:${30 + f * 70}%"><span>${Math.round(v)}″</span></div></div>`;
    };
    const show = () => {
      if (k >= qs.length) return finish(box, id, `You scored ${points} of ${qs.length * 100} points!`, points >= 240 ? 3 : points >= 170 ? 2 : points >= 100 ? 1 : 0);
      const c = qs[k], start = +(c.min + Math.round((c.max - c.min) / 2 / c.step) * c.step).toFixed(2);
      box.innerHTML = `<div class="g-bar"><span class="g-status">Question ${k + 1} / ${qs.length} · Points: <b id="g-pts">${points}</b></span><div class="g-timer" id="g-t"></div></div>
        <div class="g-card slide-in"><p class="g-big2">${esc(c.q)}</p>
        <div class="g-vis" id="g-vis">${visual(c, start)}</div>
        <div class="g-big" id="g-val">${c.fmt(start)}</div>
        <div class="g-track"><input type="range" id="g-range" min="${c.min}" max="${c.max}" step="${c.step}" value="${start}" aria-label="Your guess"><div class="g-answer" id="g-ans" hidden></div></div>
        <div class="g-scale"><span>${c.fmt(c.min)}</span><span>${c.fmt(c.max)}</span></div>
        <div class="g-opts"><button class="btn default" id="g-check">✔ Check my guess</button></div><p class="g-note" hidden></p></div>`;
      const r = box.querySelector('#g-range'), v = box.querySelector('#g-val'), vis = box.querySelector('#g-vis');
      let lastStep = null, done = false, t = null;
      r.oninput = () => {
        v.textContent = c.fmt(+r.value); vis.innerHTML = visual(c, +r.value);
        const s = Math.round((+r.value - c.min) / (c.max - c.min) * 10); if (s !== lastStep) { lastStep = s; sfx('tick'); }
      };
      const check = () => {
        if (done) return; done = true; t.stop();
        const g = +r.value, err = Math.abs(g - c.ans) / (c.max - c.min);
        const pts = Math.max(0, Math.round(100 - err * 250));
        r.disabled = true; box.querySelector('#g-check').remove();
        // el marcador dorado corre hasta la respuesta real
        const ans = box.querySelector('#g-ans'); ans.hidden = false; ans.style.left = '0%';
        requestAnimationFrame(() => requestAnimationFrame(() => { ans.style.left = ((c.ans - c.min) / (c.max - c.min) * 100) + '%'; }));
        later(id, () => {
          v.textContent = c.fmt(c.ans); vis.innerHTML = visual(c, c.ans);
          sfx(pts >= 60 ? 'ok' : 'bad'); popText(box.querySelector('.g-card'), '+' + pts, pts >= 60);
          // los puntos suben contando
          const from = points; points += pts; const pe = box.querySelector('#g-pts'), t0 = performance.now();
          const count = now => { const e = Math.min(1, (now - t0) / 700); pe.textContent = Math.round(from + pts * e); if (e < 1 && live(id)) requestAnimationFrame(count); };
          requestAnimationFrame(count);
          const note = box.querySelector('.g-note'); note.hidden = false;
          note.innerHTML = `Your guess: <b>${c.fmt(g)}</b> · Real answer: <b>${c.fmt(c.ans)}</b> · <b>+${pts}</b> points<br>${esc(c.fact)}<br><button class="btn default" id="g-next">${k + 1 < qs.length ? 'Next question ▶' : 'See score'}</button>`;
          box.querySelector('#g-next').onclick = () => { k++; show(); };
        }, 950);
      };
      box.querySelector('#g-check').onclick = check;
      t = timer(id, box.querySelector('#g-t'), 20, check);
    };
    show();
  }

  function start(box, n) {
    run++; const id = run;
    box.dataset.game = n;
    [memory, dice, truefalse, guess][n](box, id);
  }

  // Abre el juego n (0..3) en la ventana del museo
  function open(n, openOverlay, close) {
    const g = LIST[n];
    openOverlay(`Game ${n + 1} — ${g.title} (${g.years})`,
      `<div class="game"><div class="g-head"><p class="g-how">${esc(g.how)}</p><button class="btn g-mute" id="g-mute" aria-label="Sound on or off">${muted ? '🔇' : '🔊'}</button></div><div id="g-box"></div></div>`,
      [['Close', () => { run++; close(); }, true]]);
    const m = document.getElementById('g-mute');
    m.onclick = () => { muted = !muted; m.textContent = muted ? '🔇' : '🔊'; try { localStorage.setItem('rot-mute', muted ? '1' : '0'); } catch (e) {} };
    start(document.getElementById('g-box'), n);
  }
  return { LIST, open };
})();
