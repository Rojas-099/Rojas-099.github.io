/* =========================================================
   APP.JS — Arranque, caminar/mirar, menú de años y ventanas.
   Computador: arrastrar el mouse para mirar, WASD o flechas
   para caminar, clic en la foto para ver la información.
   Celular: joystick para caminar, arrastrar para mirar,
   tocar la foto para abrirla.
   ========================================================= */
(() => {
  const $ = id => document.getElementById(id);
  const coarse = matchMedia('(pointer: coarse)').matches;
  let museum, renderer, scene, camera;
  const pos = new THREE.Vector3(); let yaw = 0, pitch = 0;
  let current = -1;          // año más cercano (0..8), -1 = ninguno
  let tween = null;          // caminata automática hacia un año
  const keys = {};
  const joy = { x: 0, y: 0 };

  /* ---------- Carga ---------- */
  function setBar(p, msg) { $('bar').style.width = Math.round(p * 100) + '%'; if (msg) $('load-msg').textContent = msg; }

  function loadImage(src) {
    return new Promise((ok) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = () => { // si falla, un cuadro gris para no romper el museo
        const c = document.createElement('canvas'); c.width = 4; c.height = 3;
        c.getContext('2d').fillStyle = '#777'; c.getContext('2d').fillRect(0, 0, 4, 3); ok(c);
      };
      im.src = (typeof PHOTOS !== 'undefined' && PHOTOS[src]) || src;
    });
  }
  const photoSrc = it => (typeof PHOTOS !== 'undefined' && PHOTOS[it.image]) || it.image;

  async function start() {
    setBar(0.1, 'Loading fonts…');
    try {
      await Promise.race([
        Promise.all(['40px "Archivo Black"', 'bold 20px "Libre Baskerville"', 'italic 20px "Libre Baskerville"', '20px "Permanent Marker"']
          .map(f => document.fonts.load(f))),
        new Promise(r => setTimeout(r, 2500))
      ]);
    } catch (e) { /* sin internet: usa letras del sistema */ }
    setBar(0.3, 'Hanging the photos…');
    let done = 0;
    const images = await Promise.all(YEARS.map(it => loadImage(it.image).then(im => { setBar(0.3 + 0.4 * (++done / YEARS.length)); return im; })));
    setBar(0.75, 'Building the rotunda…');
    await new Promise(r => setTimeout(r, 30));

    renderer = new THREE.WebGLRenderer({ antialias: !coarse || devicePixelRatio < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
    $('viewport').appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, 1, 0.05, 80);
    camera.rotation.order = 'YXZ';
    museum = ROT.build(scene, renderer, images);
    setBar(0.88, 'Lighting the rooms…');
    GFX.apply(scene, renderer, museum, !coarse);
    resize();
    pos.copy(museum.start.pos); yaw = museum.start.yaw; pitch = museum.start.pitch;
    applyCam();
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    setBar(1, 'Ready.');
    buildYears();
    $('enter-row').hidden = false;
    $('enter').focus();
    $('enter').onclick = () => {
      $('loading').hidden = true;
      balloon(coarse ? 'Use the joystick to walk and drag the screen to look around. Tap a photo to learn more.'
        : 'Drag with the mouse to look around. Walk with W A S D or the arrow keys. Click a photo to learn more, or use the round icons: ZOOM (photo), VIEW (walk up close), LOOK (scale model), INFO (read).', 8000);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Cámara ---------- */
  function applyCam() {
    camera.position.copy(pos);
    camera.rotation.set(pitch, yaw, 0);
  }
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 82 : 68;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => renderer && resize());

  // No dejar pasar paredes, pedestal ni bancas
  function collide(p) {
    const r = Math.hypot(p.x, p.z), rMax = museum.bounds.rMax;
    if (r > rMax) { p.x *= rMax / r; p.z *= rMax / r; }
    museum.colliders.forEach(c => {
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz);
      if (d < c.r && d > 1e-4) { p.x = c.x + dx / d * c.r; p.z = c.z + dz / d * c.r; }
    });
  }

  /* ---------- Caminata automática (en arco alrededor del centro) ---------- */
  function goTo(i, mode) {
    const vp = (mode === 'close' ? museum.closeViews : mode === 'model' ? museum.modelViews : museum.viewpoints)[i];
    const a0 = Math.atan2(pos.x, pos.z), r0 = Math.hypot(pos.x, pos.z);
    const a1 = Math.atan2(vp.pos.x, vp.pos.z), r1 = Math.hypot(vp.pos.x, vp.pos.z);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    let dy = vp.yaw - yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    const dist = Math.abs(da) * Math.max(r0, r1) + Math.abs(r1 - r0);
    tween = { t: 0, dur: Math.min(2.4, 0.7 + dist / 9), a0, da, r0, r1, y0: yaw, dy, p0: pitch, p1: vp.pitch, i };
    setCurrent(i, true);
  }
  function stepTween(dt) {
    tween.t = Math.min(1, tween.t + dt / tween.dur);
    const e = tween.t < 0.5 ? 2 * tween.t * tween.t : 1 - Math.pow(-2 * tween.t + 2, 2) / 2;
    const a = tween.a0 + tween.da * e;
    // si el camino cruza cerca del centro, se abre un poco hacia afuera
    const r = Math.max(tween.r0 + (tween.r1 - tween.r0) * e, 3.2);
    pos.set(Math.sin(a) * r, ROT.EYE, Math.cos(a) * r);
    yaw = tween.y0 + tween.dy * e; pitch = tween.p0 + (tween.p1 - tween.p0) * e;
    if (tween.t >= 1) tween = null;
  }

  /* ---------- Año más cercano ---------- */
  function nearest() {
    const r = Math.hypot(pos.x, pos.z);
    if (r < 3.6) return -1;
    const a = Math.atan2(-pos.x, -pos.z); // mismo ángulo que usa museum.angleOf
    let best = -1, bd = 1e9;
    for (let i = 0; i < 9; i++) {
      const d = Math.abs(((a - museum.angleOf(i + 1)) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      if (d < bd) { bd = d; best = i; }
    }
    return bd < museum.SEG * 0.55 ? best : -1;
  }
  function setCurrent(i, force) {
    if (i === current && !force) return;
    current = i;
    document.querySelectorAll('.tl-stop').forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-pressed', j === i); });
    $('tl-fill').style.width = i < 0 ? '0%' : (i / 9 * 100) + '%';
    $('blurb').textContent = i < 0 ? MUSEUM.intro : YEARS[i].blurb;
    const now = $('now');
    if (i < 0) {
      now.querySelector('.chip').style.background = '#5a1d2a';
      now.querySelector('b').textContent = 'Rotunda';
      now.querySelector('span').textContent = 'Choose a year or walk to a photo';
    } else {
      const it = YEARS[i];
      now.querySelector('.chip').style.background = it.theme.wall;
      now.querySelector('b').textContent = it.year;
      now.querySelector('span').textContent = it.name;
    }
  }

  // Línea de tiempo de arriba: un punto por año
  function buildYears() {
    const box = $('tl-stops');
    YEARS.forEach((it, i) => {
      const b = document.createElement('button');
      b.className = 'tl-stop'; b.style.setProperty('--c', it.theme.wall);
      b.innerHTML = `<i class="tl-dot"></i><span>${it.year}</span>`;
      b.title = it.name; b.setAttribute('aria-label', `${it.year}: ${it.name}`);
      b.onclick = () => goTo(i);
      box.appendChild(b);
    });
    setCurrent(-1, true);
  }
  $('btn-prev').onclick = () => goTo(current <= 0 ? 8 : current - 1);
  $('btn-next').onclick = () => goTo(current < 0 || current >= 8 ? 0 : current + 1);
  $('learn').onclick = () => current >= 0 ? openExhibit(current) : goTo(0);

  /* ---------- Bucle principal ---------- */
  let last = performance.now(), hintT = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const tm = now / 1000;
    if (!overlayOpen()) {
      if (tween) stepTween(dt);
      else {
        let f = 0, s = 0;
        if (keys.KeyW || keys.ArrowUp) f += 1;
        if (keys.KeyS || keys.ArrowDown) f -= 1;
        if (keys.KeyD) s += 1;
        if (keys.KeyA) s -= 1;
        if (keys.ArrowLeft) yaw += 1.8 * dt;
        if (keys.ArrowRight) yaw -= 1.8 * dt;
        f += -joy.y; s += joy.x;
        if (f || s) {
          const len = Math.min(1, Math.hypot(f, s)) / (Math.hypot(f, s) || 1);
          const sp = 3.4 * dt * (keys.ShiftLeft || keys.ShiftRight ? 1.7 : 1);
          const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
          pos.x += (fx * f - fz * s) * sp * len; pos.z += (fz * f + fx * s) * sp * len;
          collide(pos);
        }
        setCurrent(nearest());
      }
    }
    museum.anim.forEach(fn => fn(tm));
    applyCam();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  /* ---------- Teclado ---------- */
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Escape') { closeViewer(); closeOverlay(); return; }
    if (overlayOpen()) return;
    keys[e.code] = true;
    if (/^Digit[1-9]$/.test(e.code)) goTo(+e.code.slice(5) - 1);
    if (e.code === 'Enter' && current >= 0 && document.activeElement === document.body) openExhibit(current);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (tween && /^(Key[WASD]|Arrow)/.test(e.code)) tween = null;
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  /* ---------- Mirar arrastrando y tocar las fotos ---------- */
  const vp = $('viewport');
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null;
  function pick(cx, cy) {
    ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(museum.targets, false)[0];
    lastZoom = !!(hit && hit.object.userData.zoom);
    lastView = !!(hit && hit.object.userData.view);
    lastModel = !!(hit && hit.object.userData.model);
    if (hit && hit.object.userData.game !== undefined) return hit.distance < 9 || hit.object.userData.icon ? 100 + hit.object.userData.game : -1;
    return hit && (hit.distance < 9 || hit.object.userData.icon) ? hit.object.userData.index : -1;
  }
  let lastZoom = false, lastView = false, lastModel = false;
  vp.addEventListener('pointerdown', e => {
    if (!museum) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false };
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', e => {
    if (!museum) return;
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) { drag.moved = true; vp.classList.add('drag'); }
      if (drag.moved) {
        tween = null;
        const k = coarse ? 0.006 : 0.0045;
        yaw += dx * k; pitch = Math.max(-0.9, Math.min(0.9, pitch + dy * k));
      }
    } else if (!coarse) {
      vp.classList.toggle('hover', pick(e.clientX, e.clientY) >= 0);
    }
  });
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const tap = !drag.moved && performance.now() - drag.t < 600;
    drag = null; vp.classList.remove('drag');
    if (tap) {
      const i = pick(e.clientX, e.clientY);
      if (i >= 100) GAMES.open(i - 100, openOverlay, closeOverlay);
      else if (i >= 0) { if (lastView) goTo(i, 'close'); else if (lastModel) goTo(i, 'model'); else if (lastZoom) openViewer(i); else openExhibit(i); }
    }
  }
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', e => { drag = null; vp.classList.remove('drag'); });

  /* ---------- Joystick ---------- */
  if (coarse) {
    const j = $('joy'), knob = j.querySelector('.knob');
    j.hidden = false;
    const place = () => { const d = $('dock').getBoundingClientRect(); j.style.bottom = (innerHeight - d.top + 14) + 'px'; };
    place(); addEventListener('resize', place); setTimeout(place, 300);
    new ResizeObserver(place).observe($('dock'));
    let jid = null;
    const move = e => {
      const r = j.getBoundingClientRect(), R = r.width / 2;
      let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
      joy.x = x; joy.y = y; knob.style.transform = `translate(${x * R * 0.6}px, ${y * R * 0.6}px)`;
    };
    j.addEventListener('pointerdown', e => { jid = e.pointerId; j.setPointerCapture(jid); tween = null; move(e); e.preventDefault(); });
    j.addEventListener('pointermove', e => { if (e.pointerId === jid) move(e); });
    const stop = e => { if (e.pointerId !== jid) return; jid = null; joy.x = joy.y = 0; knob.style.transform = ''; };
    j.addEventListener('pointerup', stop); j.addEventListener('pointercancel', stop);
  }

  /* ---------- Ayuda amarilla ---------- */
  let balloonTimer;
  function balloon(text, ms) {
    const b = $('balloon'); b.textContent = text; b.hidden = false; b.classList.remove('fade');
    clearTimeout(balloonTimer);
    balloonTimer = setTimeout(() => { b.classList.add('fade'); setTimeout(() => (b.hidden = true), 600); }, ms);
  }

  /* ---------- Ventanas ---------- */
  const ov = $('overlay');
  const overlayOpen = () => !ov.hidden || !$('viewer').hidden || !$('loading').hidden;
  function openOverlay(title, html, buttons) {
    for (const k in keys) keys[k] = false;
    $('ov-title').textContent = title; $('ov-body').innerHTML = html;
    const foot = $('ov-foot'); foot.innerHTML = '';
    buttons.forEach(([label, fn, def]) => {
      const b = document.createElement('button'); b.className = 'btn' + (def ? ' default' : ''); b.textContent = label; b.onclick = fn; foot.appendChild(b);
    });
    ov.hidden = false; ov.querySelector('.win-body').scrollTop = 0;
    (foot.querySelector('.default') || foot.lastChild).focus();
  }
  function closeOverlay() { ov.hidden = true; }
  $('ov-close').onclick = closeOverlay;
  ov.addEventListener('click', e => { if (e.target === ov) closeOverlay(); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function openExhibit(i) {
    const it = YEARS[i];
    setCurrent(i, true);
    const html = `
      <div class="exhibit">
        <div class="photo" id="ex-photo" title="Open the photo">
          <img src="${photoSrc(it)}" alt="${esc(it.caption)}">
          <small>${esc(it.caption)}</small>
        </div>
        <div>
          <div class="yr" style="color:${it.theme.wall}">${it.year}</div>
          <h2>${esc(it.name)}</h2>
          <span class="kind">${esc(it.type)}</span>
          <p>${esc(it.text)}</p>
          <div class="meta">
            <div><b>Source:</b> ${esc(it.source)}</div>
            <div><b>Photo:</b> ${esc(it.credit.author)}, ${esc(it.credit.license)}, Wikimedia Commons<br>
              <a href="${it.credit.link}" target="_blank" rel="noopener">${esc(it.credit.link)}</a></div>
          </div>
        </div>
      </div>`;
    openOverlay(`${it.year} — ${it.name}`, html, [
      ['◀ ' + (YEARS[i - 1] ? YEARS[i - 1].year : YEARS[8].year), () => { const j = (i + 8) % 9; closeOverlay(); goTo(j); }],
      ['View photo', () => openViewer(i)],
      [(YEARS[i + 1] ? YEARS[i + 1].year : YEARS[0].year) + ' ▶', () => { const j = (i + 1) % 9; closeOverlay(); goTo(j); }],
      ['Close', closeOverlay, true]
    ]);
    $('ex-photo').onclick = () => openViewer(i);
  }

  $('btn-help').onclick = () => openOverlay('Help', `
    <div class="text-win">
      <p><b>The Silicon Rotunda</b> is a round museum with nine rooms, one for every year from 1995 to 2003.
      Each room shows <b>one photo</b> of a real computer from that year.</p>
      <h3>On a computer</h3>
      <ul><li>Drag with the mouse to look around.</li><li>Walk with <b>W A S D</b> or the arrow keys (hold Shift to walk faster).</li>
      <li>Click a photo, its text or its gold plaque to learn more.</li><li>Round icons show where you can look closer: <b>ZOOM</b> opens the photo big, <b>VIEW</b> walks you up to the photo, <b>LOOK</b> walks you up to the scale model, and <b>INFO</b> opens the full text.</li><li>Click the gold <b>VIEW</b> eye above a room's rug to walk up close to the photo and its text.</li><li>Press <b>1</b> to <b>9</b> to jump to a year.</li><li>After every two rooms there is a <b>game kiosk</b>. Click its <b>PLAY</b> icon or screen to play a quick game about the two rooms you just saw.</li></ul>
      <h3>On a phone or tablet</h3>
      <ul><li>Use the round joystick to walk.</li><li>Drag the screen to look around.</li><li>Tap a photo to learn more, or its glowing dot to zoom in.</li><li>Tap the gold <b>VIEW</b> eye above a rug to walk up close to the photo and its text.</li><li>Tap <b>PLAY</b> on a game kiosk for a quick game.</li></ul>
      <h3>The timeline</h3>
      <p>The timeline at the top has one dot for every year. Tap a dot to walk to that year. ◀ and ▶ at the bottom go to the previous or next year, and the short text at the bottom explains what you are looking at.</p>
    </div>`, [['OK', closeOverlay, true]]);

  $('btn-credits').onclick = () => openOverlay('Credits', `
    <div class="text-win">
      <p>All photos come from <b>Wikimedia Commons</b> under free licenses. The texts use official sources
      (Computer History Museum, IBM and Apple).</p>
      <table class="credits"><tr><th>Year</th><th>Computer</th><th>Photo</th></tr>
      ${YEARS.map(it => `<tr><td>${it.year}</td><td>${esc(it.name)}</td><td>${esc(it.credit.author)}, ${esc(it.credit.license)}<br>
        <a href="${it.credit.link}" target="_blank" rel="noopener">${esc(it.credit.link)}</a></td></tr>`).join('')}
      </table>
      <p style="margin-top:10px">3D engine: Three.js (MIT license). Fonts: Archivo Black, Libre Baskerville and Permanent Marker (Google Fonts).</p>
    </div>`, [['OK', closeOverlay, true]]);

  /* ---------- Visor con zoom ---------- */
  const vw = { s: 1, x: 0, y: 0 };
  const vimg = $('vw-img');
  function vwApply() { vimg.style.transform = `translate(-50%, -50%) translate(${vw.x}px, ${vw.y}px) scale(${vw.s})`; }
  function openViewer(i) {
    const it = YEARS[i];
    vimg.src = photoSrc(it); vimg.alt = it.caption;
    $('vw-title').textContent = `${it.year} — ${it.name}`;
    vw.s = 1; vw.x = vw.y = 0; vwApply();
    $('viewer').hidden = false; $('vw-done').focus();
  }
  function closeViewer() { $('viewer').hidden = true; }
  const zoom = f => { vw.s = Math.max(1, Math.min(5, vw.s * f)); if (vw.s === 1) vw.x = vw.y = 0; vwApply(); };
  $('vw-in').onclick = () => zoom(1.4); $('vw-out').onclick = () => zoom(1 / 1.4);
  $('vw-reset').onclick = () => { vw.s = 1; vw.x = vw.y = 0; vwApply(); };
  $('vw-done').onclick = closeViewer; $('vw-close').onclick = closeViewer;
  const stage = $('stage');
  stage.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  const pts = new Map(); let pinch0 = 0, s0 = 1;
  stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); s0 = vw.s; } });
  stage.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    if (pts.size === 1 && vw.s > 1) { vw.x += e.clientX - p.x; vw.y += e.clientY - p.y; vwApply(); }
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; vw.s = Math.max(1, Math.min(5, s0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0)); vwApply(); }
  });
  const up = e => pts.delete(e.pointerId);
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('dblclick', () => zoom(vw.s > 1 ? 0 : 2));

  start().catch(err => {
    console.error(err);
    setBar(1, 'Sorry, this browser could not start the 3D museum (WebGL is needed).');
  });
})();
