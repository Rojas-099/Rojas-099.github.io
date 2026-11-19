/* =========================================================
   GAMES.JS — 4 minijuegos rápidos, uno cada 2 salas.
   Cada juego usa SOLO datos de las 2 salas que acabas de ver.
   1. Memory Cards (1995–1996): voltear cartas y hacer parejas
   2. Spec Dice (1997–1998): lanzar el dado y comparar con tu celular
   3. True or False? (1999–2000): cartas de verdadero o falso
   4. Guess It! (2001–2002): adivinar con una barra (peso, precio, pantalla)
   Las comparaciones con "un celular de hoy" son valores típicos
   y aproximados (8 GB de RAM, 128 GB de memoria, unos 3 GHz).
   ========================================================= */
const GAMES = (() => {
  const LIST = [
    { title: 'Memory Cards', years: '1995 – 1996', after: 2, how: 'Flip two cards at a time and find the 4 pairs.' },
    { title: 'Spec Dice', years: '1997 – 1998', after: 4, how: 'Roll the die. Each face shows a real 1997–1998 number. Guess how your phone compares.' },
    { title: 'True or False?', years: '1999 – 2000', after: 6, how: 'Read each card and choose True or False.' },
    { title: 'Guess It!', years: '2001 – 2002', after: 8, how: 'Move the slider to guess the number, then check how close you were.' }
  ];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- 1. Memory Cards ---------- */
  function memory(box) {
    const pairs = [
      ['ThinkPad 701C', 'Its keyboard opened wider than the laptop'],
      ['MoMA', 'Art museum that keeps the ThinkPad 701C'],
      ['PowerBook 1400', 'First PowerBook with a built-in CD-ROM'],
      ['BookCover', 'Lid cover you could personalize']
    ];
    const cards = shuffle(pairs.flatMap((p, i) => [{ id: i, text: p[0], big: true }, { id: i, text: p[1] }]));
    let open = [], found = 0, moves = 0, lock = false;
    box.innerHTML = `<div class="g-status" id="g-st">Pairs found: 0 / 4 · Moves: 0</div><div class="mem-grid">${cards.map((c, k) =>
      `<button class="mem-card" data-k="${k}" aria-label="Card ${k + 1}"><span class="front">?</span><span class="back${c.big ? ' big' : ''}">${esc(c.text)}</span></button>`).join('')}</div>`;
    box.querySelectorAll('.mem-card').forEach(b => b.onclick = () => {
      if (lock || b.classList.contains('up')) return;
      b.classList.add('up'); open.push(b);
      if (open.length < 2) return;
      moves++;
      const [a, c] = open, same = cards[a.dataset.k].id === cards[c.dataset.k].id;
      if (same) { a.classList.add('ok'); c.classList.add('ok'); found++; open = []; }
      else { lock = true; setTimeout(() => { a.classList.remove('up'); c.classList.remove('up'); open = []; lock = false; }, 900); }
      box.querySelector('#g-st').textContent = `Pairs found: ${found} / 4 · Moves: ${moves}`;
      if (found === 4) win(box, `You found all the pairs in ${moves} moves!`);
    });
  }

  /* ---------- 2. Spec Dice ---------- */
  function dice(box) {
    const faces = [
      { label: 'iMac memory (RAM), 1998', then: '32 MB', q: 'A typical phone today has 8 GB of RAM. How many times more is that?', opts: ['About 25 times', 'About 250 times', 'About 2,500 times'], ok: 1, note: '8 GB is 8,192 MB. That is 256 times the iMac’s 32 MB.' },
      { label: 'iMac hard drive, 1998', then: '4 GB', q: 'A typical phone today stores 128 GB. How many iMac drives is that?', opts: ['4', '32', '320'], ok: 1, note: '128 ÷ 4 = 32 iMac hard drives.' },
      { label: 'iMac processor speed, 1998', then: '233 MHz', q: 'Phone processors today run at about 3 GHz (3,000 MHz). How many times faster is the clock?', opts: ['About 3 times', 'About 13 times', 'About 130 times'], ok: 1, note: '3,000 ÷ 233 ≈ 13. And today’s chips also have many cores!' },
      { label: 'iMac price, 1998', then: 'about $1,300', q: 'What did that money buy?', opts: ['Only the screen', 'The whole computer and its screen in one case', 'Just the keyboard and mouse'], ok: 1, note: 'The iMac was an all-in-one: computer, 15-inch screen and CD-ROM in one case.' },
      { label: 'Power Macintosh G3 speed, 1997', then: '233 or 266 MHz', q: 'What was special about this Mac’s processor?', opts: ['It was the first Mac with the PowerPC G3', 'It had no processor', 'It used a phone chip'], ok: 0, note: 'The Power Macintosh G3 was the first Mac with the PowerPC G3 processor.' },
      { label: 'iMac screen, 1998', then: '15 inches', q: 'The iMac screen was a CRT, like an old TV. What is a CRT?', opts: ['A flat touch screen', 'A deep glass tube screen', 'A projector'], ok: 1, note: 'CRT means cathode-ray tube, which is why the iMac G3 was so deep at the back.' }
    ];
    const pips = n => ({ 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[n]);
    const dieHtml = n => `<div class="die">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => `<i class="${pips(n).includes(p) ? 'on' : ''}"></i>`).join('')}</div>`;
    let score = 0, rolls = 0;
    box.innerHTML = `<div class="g-status" id="g-st">Score: 0 / 0</div>
      <div class="dice-row"><div id="g-die">${dieHtml(6)}</div><button class="btn default" id="g-roll">Roll the die</button></div>
      <div id="g-face"></div>`;
    const roll = box.querySelector('#g-roll');
    roll.onclick = () => {
      roll.disabled = true; let t = 0;
      const anim = setInterval(() => {
        box.querySelector('#g-die').innerHTML = dieHtml(1 + (Math.random() * 6 | 0));
        if (++t > 9) {
          clearInterval(anim);
          const n = 1 + (Math.random() * 6 | 0), f = faces[n - 1];
          box.querySelector('#g-die').innerHTML = dieHtml(n);
          box.querySelector('#g-face').innerHTML = `<div class="g-card"><small>${esc(f.label)}</small><div class="g-big">${esc(f.then)}</div><p>${esc(f.q)}</p>
            <div class="g-opts">${f.opts.map((o, i) => `<button class="btn" data-i="${i}">${esc(o)}</button>`).join('')}</div><p class="g-note" hidden></p></div>`;
          box.querySelectorAll('.g-opts .btn').forEach(b => b.onclick = () => {
            const ok = +b.dataset.i === f.ok; rolls++; if (ok) score++;
            box.querySelectorAll('.g-opts .btn').forEach(x => { x.disabled = true; if (+x.dataset.i === f.ok) x.classList.add('right'); });
            if (!ok) b.classList.add('wrong');
            const note = box.querySelector('.g-note'); note.hidden = false; note.textContent = (ok ? 'Correct! ' : 'Not quite. ') + f.note;
            box.querySelector('#g-st').textContent = `Score: ${score} / ${rolls}`;
            roll.disabled = false; roll.textContent = 'Roll again';
          });
        }
      }, 70);
    };
  }

  /* ---------- 3. True or False? ---------- */
  function truefalse(box) {
    const cards = shuffle([
      { s: 'The iBook (1999) had a 15-inch screen.', a: false, why: 'It had a 12.1-inch display.' },
      { s: 'With an AirPort card, up to 10 computers could share one Internet connection.', a: true, why: 'AirPort shared one connection with up to 10 computers at up to 11 Mbps.' },
      { s: 'The iBook was the first “wireless ready” portable.', a: true, why: 'It had built-in antennas and a slot for an AirPort card.' },
      { s: 'The Power Mac G4 Cube was about the size of a washing machine.', a: false, why: 'It fit inside an eight-inch cube.' },
      { s: 'The G4 Cube came with a 450 MHz PowerPC G4 processor.', a: true, why: '450 MHz, with 500 MHz as an option.' },
      { s: 'The G4 Cube’s case was clear.', a: true, why: 'The computer seemed to float inside a clear acrylic case.' }
    ]).slice(0, 5);
    let k = 0, score = 0;
    const show = () => {
      if (k >= cards.length) return win(box, `You got ${score} of ${cards.length} right!`);
      const c = cards[k];
      box.innerHTML = `<div class="g-status">Card ${k + 1} of ${cards.length} · Score: ${score}</div>
        <div class="g-card tf"><p class="g-big2">${esc(c.s)}</p>
        <div class="g-opts two"><button class="btn tf-t" data-a="1">✓ True</button><button class="btn tf-f" data-a="0">✗ False</button></div><p class="g-note" hidden></p></div>`;
      box.querySelectorAll('.g-opts .btn').forEach(b => b.onclick = () => {
        const ok = (b.dataset.a === '1') === c.a; if (ok) score++;
        box.querySelectorAll('.g-opts .btn').forEach(x => { x.disabled = true; if ((x.dataset.a === '1') === c.a) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        const note = box.querySelector('.g-note'); note.hidden = false;
        note.innerHTML = `${ok ? 'Correct!' : 'Not quite.'} ${esc(c.why)}<br><button class="btn default" id="g-next">${k + 1 < cards.length ? 'Next card' : 'See score'}</button>`;
        box.querySelector('#g-next').onclick = () => { k++; show(); };
      });
    };
    show();
  }

  /* ---------- 4. Guess It! ---------- */
  function guess(box) {
    const qs = [
      { q: 'How much did the Titanium PowerBook G4 (2001) weigh?', unit: 'kg', min: 0.5, max: 8, step: 0.1, ans: 2.4, fmt: v => v.toFixed(1) + ' kg', fact: '5.3 pounds, about 2.4 kg, and only one inch thick.' },
      { q: 'What was the starting price of the Titanium PowerBook G4 in 2001?', unit: 'US$', min: 500, max: 5000, step: 50, ans: 2599, fmt: v => 'US $' + Math.round(v).toLocaleString('en-US'), fact: 'Prices started at US $2,599.' },
      { q: 'How big was the flat screen of the iMac G4 (2002)?', unit: 'inches', min: 10, max: 30, step: 1, ans: 15, fmt: v => Math.round(v) + ' inches', fact: 'A 15-inch flat panel on a movable chrome neck.' }
    ];
    let k = 0, points = 0;
    const show = () => {
      if (k >= qs.length) return win(box, `You scored ${points} of ${qs.length * 100} points!`);
      const c = qs[k], start = c.min + (c.max - c.min) / 2;
      box.innerHTML = `<div class="g-status">Question ${k + 1} of ${qs.length} · Points: ${points}</div>
        <div class="g-card"><p class="g-big2">${esc(c.q)}</p>
        <div class="g-big" id="g-val">${c.fmt(start)}</div>
        <input type="range" id="g-range" min="${c.min}" max="${c.max}" step="${c.step}" value="${start}" aria-label="Your guess">
        <div class="g-scale"><span>${c.fmt(c.min)}</span><span>${c.fmt(c.max)}</span></div>
        <div class="g-opts"><button class="btn default" id="g-check">Check my guess</button></div><p class="g-note" hidden></p></div>`;
      const r = box.querySelector('#g-range'), v = box.querySelector('#g-val');
      r.oninput = () => (v.textContent = c.fmt(+r.value));
      box.querySelector('#g-check').onclick = () => {
        const g = +r.value, err = Math.abs(g - c.ans) / (c.max - c.min);
        const pts = Math.max(0, Math.round(100 - err * 250)); points += pts;
        r.disabled = true; box.querySelector('#g-check').remove();
        const note = box.querySelector('.g-note'); note.hidden = false;
        note.innerHTML = `Your guess: <b>${c.fmt(g)}</b> · Real answer: <b>${c.fmt(c.ans)}</b> · +${pts} points<br>${esc(c.fact)}<br><button class="btn default" id="g-next">${k + 1 < qs.length ? 'Next question' : 'See score'}</button>`;
        box.querySelector('#g-next').onclick = () => { k++; show(); };
      };
    };
    show();
  }

  function win(box, msg) {
    const again = document.createElement('div');
    again.className = 'g-win';
    again.innerHTML = `<div class="g-big">🏆 ${esc(msg)}</div><button class="btn default" id="g-again">Play again</button>`;
    box.appendChild(again);
    again.querySelector('#g-again').onclick = () => start(box, box.dataset.game | 0);
  }
  function start(box, n) { box.dataset.game = n; [memory, dice, truefalse, guess][n](box); }

  // Abre el juego n (0..3) en la ventana del museo
  function open(n, openOverlay, close) {
    const g = LIST[n];
    openOverlay(`Game ${n + 1} — ${g.title} (${g.years})`, `<div class="game"><p class="g-how">${esc(g.how)}</p><div id="g-box"></div></div>`, [['Close', close, true]]);
    start(document.getElementById('g-box'), n);
  }
  return { LIST, open };
})();
