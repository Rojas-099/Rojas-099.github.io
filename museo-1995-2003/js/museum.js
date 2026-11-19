/* =========================================================
   MUSEUM.JS — Construye la rotonda 3D con Three.js.
   La sala es un decágono (10 paredes): 1 pared de entrada
   y 9 nichos, uno por año (1995 a la izquierda al entrar,
   2003 a la derecha). Cada nicho tiene: pared pintada con su
   tema, UN cuadro con la foto, foco de luz, cordón de terciopelo
   y un atril con la placa. En el centro hay un disquete gigante
   sobre un pedestal, y arriba una cúpula con óculo (claraboya).
   Unidades: metros.
   ========================================================= */

const ROT = (() => {
  const N = 10;                       // 10 paredes
  const SEG = Math.PI * 2 / N;        // 36 grados cada una
  const R = 13;                       // distancia del centro a cada pared
  const H = 6;                        // alto de las paredes
  const HALF = R * Math.tan(SEG / 2); // medio ancho de cada pared
  const RC = R / Math.cos(SEG / 2);   // distancia del centro a las esquinas
  const EYE = 1.6;                    // altura de los ojos del visitante

  // Ángulo (giro) de la pared k. k = 0 es la entrada; k = 1..9 son 1995..2003
  const angleOf = k => Math.PI - k * SEG;
  // Pasa un punto "local" del nicho (x a la derecha, z hacia la pared = -R) a coordenadas del mundo
  function toWorld(phi, x, y, z) {
    const c = Math.cos(phi), s = Math.sin(phi);
    return new THREE.Vector3(x * c + z * s, y, -x * s + z * c);
  }

  // Números al azar repetibles (para que los dibujos salgan siempre iguales)
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  let MAX_ANISO = 4;
  function tex(c, repeat) {
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = MAX_ANISO;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    return t;
  }
  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  /* ---------- Dibujos de las paredes (uno por tema) ---------- */
  function drawPattern(g, kind, w, h, t, rand) {
    g.save();
    g.strokeStyle = t.accent; g.fillStyle = t.accent;
    switch (kind) {
      case 'keys': { // teclas de teclado y el puntito rojo TrackPoint
        const k = 46, gap = 10;
        g.globalAlpha = 0.13; g.lineWidth = 2;
        for (let y = 6; y < h; y += k + gap) {
          const off = ((y / (k + gap)) % 2) * (k / 2);
          for (let x = -k + off; x < w; x += k + gap) { roundRect(g, x, y, k, k, 7); g.stroke(); }
        }
        g.globalAlpha = 0.5;
        for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(rand() * w, rand() * h, 5, 0, 7); g.fill(); }
        break;
      }
      case 'books': { // tapas de libro en diagonal (la "BookCover")
        g.globalAlpha = 0.12;
        for (let x = -h; x < w + h; x += 70) {
          g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.lineTo(x + h + 26, 0); g.lineTo(x + 26, h); g.fill();
        }
        g.globalAlpha = 0.08; g.fillStyle = '#fff';
        for (let x = -h + 35; x < w + h; x += 140) {
          g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.lineTo(x + h + 8, 0); g.lineTo(x + 8, h); g.fill();
        }
        break;
      }
      case 'rainbow': { // rayitas finas y la franja de 6 colores del logo de la época
        g.globalAlpha = 0.09; g.fillStyle = '#3a2a12';
        for (let x = 0; x < w; x += 9) g.fillRect(x, 0, 2, h);
        break;
      }
      case 'bubbles': { // burbujas translúcidas (Bondi Blue)
        for (let i = 0; i < 70; i++) {
          const r = 8 + rand() * 46, x = rand() * w, y = rand() * h;
          g.globalAlpha = 0.07 + rand() * 0.08; g.fillStyle = '#ffffff';
          g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
          g.globalAlpha = 0.25; g.lineWidth = 2; g.strokeStyle = t.accent; g.stroke();
        }
        break;
      }
      case 'waves': { // ondas de señal inalámbrica (AirPort)
        g.lineWidth = 9;
        [[0, h], [w, h], [w / 2, -40]].forEach(([cx, cy], j) => {
          for (let r = 60; r < 900; r += 55) {
            g.globalAlpha = 0.22 - r / 6000; g.strokeStyle = j === 2 ? '#fff' : t.accent;
            g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
          }
        });
        break;
      }
      case 'cubes': { // cubos en perspectiva (G4 Cube)
        const s = 44, dx = s * Math.cos(Math.PI / 6), dy = s / 2;
        g.lineWidth = 2; g.globalAlpha = 0.18;
        for (let row = -1; row * s * 1.5 < h + s; row++) {
          for (let col = -1; col * dx * 2 < w + s; col++) {
            const cx = col * dx * 2 + (row % 2 ? dx : 0), cy = row * s * 1.5;
            g.beginPath();
            g.moveTo(cx, cy - s); g.lineTo(cx + dx, cy - dy); g.lineTo(cx + dx, cy + dy);
            g.lineTo(cx, cy + s); g.lineTo(cx - dx, cy + dy); g.lineTo(cx - dx, cy - dy); g.closePath();
            g.moveTo(cx, cy); g.lineTo(cx, cy + s); g.moveTo(cx, cy); g.lineTo(cx + dx, cy - dy);
            g.moveTo(cx, cy); g.lineTo(cx - dx, cy - dy);
            g.stroke();
          }
        }
        break;
      }
      case 'brushed': { // metal cepillado (titanio)
        for (let y = 0; y < h; y += 2) {
          g.globalAlpha = rand() * 0.12; g.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
          g.fillRect(0, y, w, 1 + (rand() * 2 | 0));
        }
        g.globalAlpha = 0.25; g.fillStyle = t.accent;
        for (let x = 40; x < w; x += 160) g.fillRect(x, 0, 2, h);
        break;
      }
      case 'flowers': { // girasoles (iMac G4 "Sunflower")
        for (let i = 0; i < 26; i++) {
          const x = rand() * w, y = rand() * h, r = 14 + rand() * 22;
          g.globalAlpha = 0.22; g.fillStyle = t.accent;
          for (let p = 0; p < 12; p++) {
            const a = p / 12 * Math.PI * 2;
            g.beginPath(); g.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.55, r * 0.22, a, 0, 7); g.fill();
          }
          g.globalAlpha = 0.3; g.fillStyle = '#4a2a08'; g.beginPath(); g.arc(x, y, r * 0.6, 0, 7); g.fill();
        }
        break;
      }
      case 'grille': { // agujeritos de la rejilla de aluminio (Power Mac G5)
        const st = 20;
        for (let y = 6; y < h; y += st) for (let x = ((y / st) % 2) * st / 2; x < w; x += st) {
          g.globalAlpha = 0.45; g.fillStyle = '#05080f'; g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill();
          g.globalAlpha = 0.14; g.fillStyle = t.accent; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2, 0, 7); g.fill();
        }
        break;
      }
    }
    g.restore();
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // Textura completa de la pared de un año
  // Yeso pintado: ruido muy suave para que no se vea plano
  function plaster(g, w, h, seed) {
    const rand = rng(seed);
    for (let i = 0; i < w * h / 60; i++) {
      g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.04)';
      g.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
    }
  }
  function bayWallTexture(item, k) {
    const t = item.theme;
    const W = 1024, Hh = Math.round(W * H / (2 * HALF)), s = W / (2 * HALF);
    const c = canvas(W, Hh), g = c.getContext('2d');
    const py = y => Hh - y * s;
    g.fillStyle = t.wall; g.fillRect(0, 0, W, Hh);
    // el dibujo del tema, apenas visible (como un papel tapiz muy discreto)
    const pc = canvas(W, Hh);
    drawPattern(pc.getContext('2d'), t.pattern, W, Hh, t, rng(item.year));
    g.globalAlpha = 0.22; g.drawImage(pc, 0, 0); g.globalAlpha = 1;
    plaster(g, W, Hh, item.year);
    // la luz del techo: más oscuro arriba, sombra suave en las esquinas
    let gr = g.createLinearGradient(0, 0, 0, Hh);
    gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(0.3, 'rgba(0,0,0,.08)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.12, 'rgba(0,0,0,0)'); gr.addColorStop(0.88, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    // luz del foco sobre la pared (forma de abanico, como un riel de luces real)
    g.save(); g.translate(W / 2, py(5.4)); g.scale(1, 1.9);
    gr = g.createRadialGradient(0, 0.9 * s, 10, 0, 0.9 * s, 1.9 * s);
    gr.addColorStop(0, 'rgba(255,244,222,.30)'); gr.addColorStop(0.6, 'rgba(255,244,222,.12)'); gr.addColorStop(1, 'rgba(255,244,222,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0.9 * s, 1.9 * s, 0, 7); g.fill(); g.restore();
    // zócalo sencillo y sombra en el piso
    g.fillStyle = t.dark; g.fillRect(0, py(0.14), W, 0.14 * s);
    g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, py(0.14), W, 2);
    // año y nombre del tema en letras de vinilo, como en los museos
    const light = lum(t.wall) < 0.5;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = light ? 'rgba(245,240,230,.92)' : 'rgba(35,26,16,.9)';
    g.font = `${Math.round(0.6 * s)}px "Libre Baskerville", Georgia, serif`;
    g.fillText(String(item.year), W / 2, py(4.85));
    g.font = `bold ${Math.round(0.22 * s)}px "Libre Baskerville", Georgia, serif`;
    spaced(g, t.title.toUpperCase(), W / 2, py(4.38), 7);
    g.fillRect(W / 2 - 0.35 * s, py(4.3), 0.7 * s, 2);
    return tex(c);
  }
  function spaced(g, text, x, y, sp) {
    const widths = [...text].map(ch => g.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + sp * (text.length - 1);
    let cx = x - total / 2; g.textAlign = 'left';
    [...text].forEach((ch, i) => { g.fillText(ch, cx, y); cx += widths[i] + sp; });
    g.textAlign = 'center';
  }

  // Pared de entrada: puertas pintadas, letrero EXIT y nombre del museo
  function entranceTexture() {
    const W = 1024, Hh = Math.round(W * H / (2 * HALF)), s = W / (2 * HALF), py = y => Hh - y * s;
    const c = canvas(W, Hh), g = c.getContext('2d');
    g.fillStyle = '#6e665c'; g.fillRect(0, 0, W, Hh);
    plaster(g, W, Hh, 11);
    // bloques de piedra
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2;
    for (let y = 0.6, r = 0; y < H; y += 0.6, r++) {
      g.beginPath(); g.moveTo(0, py(y)); g.lineTo(W, py(y)); g.stroke();
      for (let x = (r % 2) * 0.6 * s; x < W; x += 1.2 * s) { g.beginPath(); g.moveTo(x, py(y)); g.lineTo(x, py(y - 0.6)); g.stroke(); }
    }
    let gr = g.createLinearGradient(0, 0, 0, Hh);
    gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(0.35, 'rgba(0,0,0,.05)'); gr.addColorStop(1, 'rgba(0,0,0,.15)');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#3d3832'; g.fillRect(0, py(0.14), W, 0.14 * s);
    // puertas de vidrio con marco oscuro
    const dw = 2.6 * s, dh = 3.0 * s, dx = W / 2 - dw / 2;
    g.fillStyle = '#1f1f1f'; g.fillRect(dx - 0.1 * s, py(3.0) - 0.1 * s, dw + 0.2 * s, dh + 0.1 * s);
    gr = g.createLinearGradient(0, py(3.0), 0, py(0));
    gr.addColorStop(0, '#9fb0b8'); gr.addColorStop(1, '#5d6a70');
    g.fillStyle = gr; g.fillRect(dx, py(3.0), dw, dh);
    g.fillStyle = 'rgba(255,255,255,.12)';
    g.beginPath(); g.moveTo(dx + 0.3 * s, py(3)); g.lineTo(dx + 0.8 * s, py(3)); g.lineTo(dx + 0.2 * s, py(0)); g.lineTo(dx - 0.3 * s + 0.3 * s, py(0)); g.fill();
    g.fillStyle = '#1f1f1f'; g.fillRect(W / 2 - 3, py(3.0), 6, dh);
    g.fillStyle = '#b9b9b9'; g.fillRect(W / 2 - 0.12 * s, py(1.9), 0.04 * s, 0.6 * s); g.fillRect(W / 2 + 0.08 * s, py(1.9), 0.04 * s, 0.6 * s);
    // letrero EXIT pequeño
    g.fillStyle = '#156b35'; g.fillRect(W / 2 - 0.32 * s, py(3.5), 0.64 * s, 0.24 * s);
    g.fillStyle = '#e6fff0'; g.font = `bold ${Math.round(0.17 * s)}px Verdana, sans-serif`; g.textAlign = 'center';
    g.fillText('EXIT', W / 2, py(3.32));
    // nombre del museo en letras metálicas
    g.fillStyle = '#ece6da';
    g.font = `${Math.round(0.42 * s)}px "Libre Baskerville", Georgia, serif`;
    spaced(g, 'THE SILICON ROTUNDA', W / 2, py(4.7), 10);
    g.font = `${Math.round(0.16 * s)}px "Libre Baskerville", Georgia, serif`;
    spaced(g, 'COMPUTER MUSEUM  ·  1995 – 2003', W / 2, py(4.25), 8);
    return tex(c);
  }

  // Placa dorada del atril
  function plaqueTexture(item) {
    const c = canvas(640, 440), g = c.getContext('2d');
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, 640, 440);
    g.fillStyle = item.theme.wall; g.fillRect(0, 0, 640, 18);
    g.fillStyle = '#111'; g.textAlign = 'left';
    g.font = 'bold 76px "Libre Baskerville", Georgia, serif'; g.fillText(String(item.year), 34, 112);
    let size = 50; g.font = `bold ${size}px "Libre Baskerville", Georgia, serif`;
    while (g.measureText(item.name).width > 580 && size > 30) { size -= 1; g.font = `bold ${size}px "Libre Baskerville", Georgia, serif`; }
    g.fillText(item.name, 34, 196);
    g.font = '36px Verdana, Tahoma, sans-serif'; g.fillStyle = '#333'; g.fillText(item.type, 34, 252);
    g.fillStyle = '#777'; g.fillRect(34, 284, 572, 3);
    g.fillStyle = '#111'; g.font = 'bold 32px Verdana, Tahoma, sans-serif';
    g.fillText('Tap the photo or INFO', 34, 340); g.fillText('to read more.', 34, 386);
    return tex(c);
  }

  /* ---------- Piso (tablas de roble, tapetes sobrios y círculo de piedra en el centro) ---------- */
  function floorTexture(size) {
    const S = size, rad = RC + 0.2, m = S / (2 * rad);
    const c = canvas(S, S), g = c.getContext('2d');
    const rand = rng(7);
    g.fillStyle = '#6b5039'; g.fillRect(0, 0, S, S);
    const bw = 0.2 * m;
    for (let y = 0; y < S; y += bw) {
      let x = -rand() * 2 * m;
      while (x < S) {
        const len = (1.2 + rand() * 1.4) * m, v = rand() * 18 - 9;
        g.fillStyle = `rgb(${112 + v | 0},${84 + v | 0},${58 + v | 0})`; g.fillRect(x, y, len, bw);
        g.fillStyle = 'rgba(40,25,12,.10)';
        for (let k = 0; k < 4; k++) g.fillRect(x, y + rand() * bw, len, 1);
        g.fillStyle = 'rgba(30,18,8,.55)'; g.fillRect(x, y, 1.5, bw);
        x += len;
      }
      g.fillStyle = 'rgba(30,18,8,.45)'; g.fillRect(0, y, S, 1.5);
    }
    g.translate(S / 2, S / 2);
    // sombra suave junto a las paredes
    const edge = g.createRadialGradient(0, 0, (R - 1.5) * m, 0, 0, rad * m);
    edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = edge; g.beginPath(); g.arc(0, 0, rad * m, 0, 7); g.fill();
    // tapetes sobrios frente a cada año
    YEARS.forEach((it, i) => {
      const phi = angleOf(i + 1), t = it.theme;
      g.save(); g.rotate(-phi);
      const x0 = -2.3 * m, z0 = (-R + 1.35) * m, w = 4.6 * m, d = 3.6 * m;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0 + 4, z0 + 4, w, d);
      g.fillStyle = '#2f2c29'; g.fillRect(x0, z0, w, d);
      const r2 = rng(i + 50);
      for (let k = 0; k < 2500; k++) { g.fillStyle = r2() > 0.5 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.06)'; g.fillRect(x0 + r2() * w, z0 + r2() * d, 2, 2); }
      g.strokeStyle = t.wall; g.lineWidth = 0.06 * m; g.strokeRect(x0 + 0.18 * m, z0 + 0.18 * m, w - 0.36 * m, d - 0.36 * m);
      // charco de luz del foco en el piso, junto a la pared
      const pool = g.createRadialGradient(0, (-R + 1.2) * m, 0, 0, (-R + 1.2) * m, 2.6 * m);
      pool.addColorStop(0, 'rgba(255,238,205,.22)'); pool.addColorStop(1, 'rgba(255,238,205,0)');
      g.fillStyle = pool; g.fillRect(-3 * m, (-R) * m, 6 * m, 4 * m);
      g.restore();
    });
    // tapete de entrada
    g.save(); g.rotate(-angleOf(0));
    g.fillStyle = '#2f2c29'; g.fillRect(-1.5 * m, (-R + 0.2) * m, 3 * m, 2.2 * m);
    g.restore();
    // círculo central de piedra con los años grabados
    g.fillStyle = '#8a8378'; g.beginPath(); g.arc(0, 0, 3.4 * m, 0, 7); g.fill();
    const r3 = rng(9);
    for (let k = 0; k < 9000; k++) { const a = r3() * 7, rr = Math.sqrt(r3()) * 3.4 * m; g.fillStyle = r3() > 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'; g.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, 2, 2); }
    g.strokeStyle = '#8a6a34'; g.lineWidth = 0.04 * m;
    [3.4, 2.3].forEach(r => { g.beginPath(); g.arc(0, 0, r * m, 0, 7); g.stroke(); });
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${Math.round(0.3 * m)}px "Libre Baskerville", Georgia, serif`;
    g.fillStyle = 'rgba(40,32,24,.8)';
    YEARS.forEach((it, i) => {
      g.save(); g.rotate(-angleOf(i + 1)); g.translate(0, -2.85 * m); g.rotate(Math.PI);
      g.fillText(String(it.year), 0, 0); g.restore();
    });
    const sh = g.createRadialGradient(0, 0, 1.2 * m, 0, 0, 2.0 * m);
    sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 2.0 * m, 0, 7); g.fill();
    const sun = g.createRadialGradient(0, 0, 0, 0, 0, 5 * m);
    sun.addColorStop(0, 'rgba(255,245,225,.10)'); sun.addColorStop(1, 'rgba(255,245,225,0)');
    g.fillStyle = sun; g.beginPath(); g.arc(0, 0, 5 * m, 0, 7); g.fill();
    return tex(c);
  }

  // Casetones de la cúpula (de yeso y piedra, como el Panteón de Roma)
  function domeTexture() {
    const W = 1024, Hh = 256, cols = 28, rows = 5, c = canvas(W, Hh), g = c.getContext('2d');
    const cw = W / cols, ch = Hh / rows;
    g.fillStyle = '#9d968a'; g.fillRect(0, 0, W, Hh);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = q * cw, y = r * ch;
      for (let st = 0; st < 3; st++) {
        const p = 0.12 + st * 0.07, v = 150 - st * 22;
        g.fillStyle = `rgb(${v + 8},${v + 2},${v - 8})`;
        g.fillRect(x + cw * p, y + ch * p, cw * (1 - 2 * p), ch * (1 - 2 * p));
      }
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + cw * 0.12, y + ch * 0.12, cw * 0.76, 3);
    }
    plaster(g, W, Hh, 5);
    return tex(c);
  }

  function skyTexture() {
    const c = canvas(256, 256), g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#cfe8ff'); gr.addColorStop(1, '#7fb4ea');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(255,255,255,.7)';
    [[80, 90, 30], [110, 80, 26], [170, 160, 34], [150, 170, 24]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    return tex(c);
  }

  function beamTexture() { // degradado para los conos de luz
    const c = canvas(4, 128), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#fff3cf'); gr.addColorStop(1, '#000000');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    return tex(c);
  }

  function marbleTexture() {
    const c = canvas(256, 512), g = c.getContext('2d'), rand = rng(3);
    g.fillStyle = '#d9d3c7'; g.fillRect(0, 0, 256, 512);
    plaster(g, 256, 512, 3);
    g.strokeStyle = 'rgba(120,105,90,.10)';
    for (let i = 0; i < 6; i++) {
      g.lineWidth = 1; g.beginPath(); let x = rand() * 256, y = 0; g.moveTo(x, y);
      while (y < 512) { x += (rand() - 0.5) * 30; y += 30 + rand() * 30; g.lineTo(x, y); }
      g.stroke();
    }
    for (let x = 0; x < 256; x += 21) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x, 0, 5, 512); }
    return tex(c, true);
  }

  function plinthTexture() { // texto grabado alrededor del pedestal central
    const c = canvas(2048, 128), g = c.getContext('2d');
    g.fillStyle = '#a69f93'; g.fillRect(0, 0, 2048, 128);
    plaster(g, 2048, 128, 8);
    g.font = '40px "Libre Baskerville", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(70,60,48,.8)';
    const txt = 'THE SILICON ROTUNDA  ·  COMPUTERS 1995 – 2003  ·';
    for (let i = 0; i < 2; i++) g.fillText(txt, 512 + i * 1024, 66);
    return tex(c);
  }

  function floppyLabelTexture() {
    const c = canvas(512, 300), g = c.getContext('2d');
    g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, 512, 300);
    g.strokeStyle = '#c6cbd6'; g.lineWidth = 2;
    for (let y = 90; y < 300; y += 50) { g.beginPath(); g.moveTo(20, y); g.lineTo(492, y); g.stroke(); }
    g.fillStyle = '#2a3a6a'; g.textAlign = 'center';
    g.font = '52px "Permanent Marker", "Comic Sans MS", cursive'; g.fillText('BACKUP 1998', 256, 130);
    return tex(c);
  }
  // Cartelito con el mini texto (debajo de cada foto)
  function captionTexture(item) {
    const W = 1600, Hh = 236, c = canvas(W, Hh), g = c.getContext('2d'), t = item.theme;
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = t.wall; g.fillRect(0, 0, 22, Hh);
    g.strokeStyle = '#2a2016'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, W - 5, Hh - 5);
    g.fillStyle = '#111'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = 'bold 66px "Libre Baskerville", Georgia, serif';
    g.fillText(item.year + ' · ' + item.name, 60, 74);
    let size = 50; g.font = `${size}px Verdana, Tahoma, sans-serif`;
    while (g.measureText(item.blurb).width > W - 100 && size > 40) { size -= 1; g.font = `${size}px Verdana, Tahoma, sans-serif`; }
    // si no cabe en una línea, se parte en dos
    const words = item.blurb.split(' '); let l1 = item.blurb, l2 = '';
    if (g.measureText(item.blurb).width > W - 100) {
      l1 = ''; let k = 0;
      while (k < words.length && g.measureText(l1 + words[k] + ' ').width < W - 100) l1 += words[k++] + ' ';
      l2 = words.slice(k).join(' ');
    }
    g.fillStyle = '#222';
    if (l2) { g.font = `40px Verdana, Tahoma, sans-serif`; g.fillText(l1.trim(), 60, 150); g.fillText(l2, 60, 198); }
    else g.fillText(l1, 60, 162);
    return tex(c);
  }
  // Punto brillante (lupa) para ver la foto de cerca
  let DOT_TEX = null;
  function dotTexture() { return iconTexture('zoom', 'ZOOM'); }
  // Íconos para acercarse: un círculo con dibujo y una etiqueta debajo
  function iconTexture(kind, label) {
    const c = canvas(256, 330), g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 70, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,236,170,.45)'); gr.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#111'; g.lineWidth = 10;
    g.beginPath(); g.arc(128, 128, 84, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 70, 0, 7); g.stroke();
    g.strokeStyle = '#111'; g.fillStyle = '#111'; g.lineWidth = 12; g.lineCap = 'round';
    if (kind === 'zoom' || kind === 'model') {
      g.beginPath(); g.arc(116, 116, 30, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(138, 138); g.lineTo(164, 164); g.stroke();
      g.lineWidth = 8; g.beginPath(); g.moveTo(102, 116); g.lineTo(130, 116); g.moveTo(116, 102); g.lineTo(116, 130); g.stroke();
    } else if (kind === 'view') {
      g.beginPath(); g.moveTo(66, 128); g.quadraticCurveTo(128, 70, 190, 128); g.quadraticCurveTo(128, 186, 66, 128); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 22, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(128, 128, 12, 0, 7); g.fill();
    } else if (kind === 'play') {
      g.beginPath(); g.moveTo(106, 84); g.lineTo(178, 128); g.lineTo(106, 172); g.closePath(); g.fill();
    } else if (kind === 'info') {
      g.font = 'bold 120px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('i', 128, 134);
    }
    // etiqueta
    g.font = 'bold 44px Verdana, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(label).width + 36;
    g.fillStyle = '#111'; roundRect(g, 128 - w / 2, 260, w, 62, 14); g.fill();
    g.fillStyle = '#fff'; g.fillText(label, 128, 292);
    return tex(c);
  }

  // Punto de visión del tapete (ojo dorado con anillo)
  let SPOT_TEX = null, MODEL_TEX = null, INFO_TEX = null;
  function spotTexture() { return iconTexture('view', 'VIEW'); }

  // Etiqueta del pedestal de la maqueta
  function modelTagTexture(item) {
    const c = canvas(740, 240), g = c.getContext('2d');
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, 740, 240);
    g.strokeStyle = '#2a2016'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, 735, 235);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 44px Verdana, Tahoma, sans-serif'; g.fillText('SCALE MODEL · ' + item.year, 370, 74);
    let size = 46; g.font = `bold ${size}px "Libre Baskerville", Georgia, serif`;
    while (g.measureText(item.name).width > 690 && size > 28) { size -= 1; g.font = `bold ${size}px "Libre Baskerville", Georgia, serif`; }
    g.fillText(item.name, 370, 160);
    return tex(c);
  }
  // Brillo de la lámpara del foco
  let GLOW_TEX = null;
  function glowTexture() {
    const c = canvas(64, 64), g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,240,210,.8)'); gr.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return tex(c);
  }

  // Pantalla del quiosco de juego
  function kioskScreenTexture(n, game) {
    const c = canvas(640, 400), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#16324a'); gr.addColorStop(1, '#0a1622');
    g.fillStyle = gr; g.fillRect(0, 0, 640, 400);
    g.strokeStyle = '#e8c45a'; g.lineWidth = 6; g.strokeRect(14, 14, 612, 372);
    g.fillStyle = '#e8c45a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 40px Verdana, Tahoma, sans-serif'; g.fillText('GAME ' + (n + 1), 320, 78);
    g.fillStyle = '#ffffff'; let size = 62; g.font = `bold ${size}px "Libre Baskerville", Georgia, serif`;
    while (g.measureText(game.title).width > 570 && size > 30) { size -= 2; g.font = `bold ${size}px "Libre Baskerville", Georgia, serif`; }
    g.fillText(game.title, 320, 170);
    g.font = '36px Verdana, Tahoma, sans-serif'; g.fillStyle = '#cfe3f2'; g.fillText(game.years, 320, 245);
    g.fillStyle = '#e8c45a'; roundRect(g, 200, 290, 240, 66, 14); g.fill();
    g.fillStyle = '#111'; g.font = 'bold 36px Verdana, Tahoma, sans-serif'; g.fillText('▶ PLAY', 320, 324);
    return tex(c);
  }

  /* ---------- Construcción ---------- */
  function build(scene, renderer, images) {
    MAX_ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const targets = [];       // cosas que se pueden tocar (cuadros y placas)
    const viewpoints = [];    // dónde se para la cámara frente a cada año
    const colliders = [];     // obstáculos redondos (bancas y pedestal)
    const anim = [];
    const hotspots = [];
    const modelViews = [];   // vista de cerca de la maqueta
    const closeViews = [];   // vista de cerca (al tocar el punto del tapete)
    const floorSpots = [];
    SPOT_TEX = spotTexture();
    DOT_TEX = dotTexture();
    MODEL_TEX = iconTexture('model', 'LOOK');
    INFO_TEX = iconTexture('info', 'INFO');
    GLOW_TEX = glowTexture();

    scene.background = new THREE.Color('#120f0d');
    scene.add(new THREE.AmbientLight(0xfff3e6, 0.5));
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x40342a, 0.5));
    const key = new THREE.DirectionalLight(0xfff2e0, 0.35); key.position.set(3, 10, 2); scene.add(key);
    const sun = new THREE.PointLight(0xfff0d0, 0.4, 30, 1.2); sun.position.set(0, 9, 0); scene.add(sun);

    const lam = (o) => new THREE.MeshLambertMaterial(o);
    const isMobile = matchMedia('(pointer: coarse)').matches;

    // Piso
    const floor = new THREE.Mesh(new THREE.CircleGeometry(RC + 0.2, 80),
      lam({ map: floorTexture(isMobile ? 1536 : 2048) }));
    floor.rotation.x = -Math.PI / 2; floor.userData.rough = 0.38; scene.add(floor);

    // Paredes (cada una es un plano mirando al centro)
    const wallGeo = new THREE.PlaneGeometry(2 * HALF + 0.02, H);
    for (let k = 0; k < N; k++) {
      const phi = angleOf(k);
      const map = k === 0 ? entranceTexture() : bayWallTexture(YEARS[k - 1], k);
      const wall = new THREE.Mesh(wallGeo, lam({ map }));
      wall.position.copy(toWorld(phi, 0, H / 2, -R)); wall.rotation.y = phi;
      scene.add(wall);
    }

    // Cornisa alrededor, arriba de las paredes
    const corniceMat = lam({ color: 0xc9c2b5, side: THREE.DoubleSide });
    const cornice = new THREE.Mesh(new THREE.CylinderGeometry(RC - 0.25, RC - 0.05, 0.45, N, 1, true, Math.PI / N), corniceMat);
    cornice.position.y = H - 0.2; scene.add(cornice);

    // Columnas de mármol en cada esquina
    const marble = lam({ map: marbleTexture(), color: 0xdedad2 });
    const capMat = lam({ color: 0xbdb6aa });
    const colGeo = new THREE.CylinderGeometry(0.3, 0.34, H - 0.7, 20);
    const capGeo = new THREE.BoxGeometry(0.95, 0.3, 0.95);
    for (let k = 0; k < N; k++) {
      const phi = angleOf(k) - SEG / 2;
      const p = toWorld(phi, 0, 0, -(RC - 0.12));
      const col = new THREE.Mesh(colGeo, marble); col.position.set(p.x, (H - 0.7) / 2 + 0.3, p.z); scene.add(col);
      const base = new THREE.Mesh(capGeo, capMat); base.position.set(p.x, 0.15, p.z); base.rotation.y = phi; scene.add(base);
      const cap = new THREE.Mesh(capGeo, capMat); cap.position.set(p.x, H - 0.4 + 0.15, p.z); cap.rotation.y = phi; scene.add(cap);
    }

    // Cúpula con casetones y óculo
    const domeR = RC + 0.05, hole = 0.17, squash = 0.5;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(domeR, 48, 14, 0, Math.PI * 2, hole, Math.PI / 2 - hole),
      new THREE.MeshBasicMaterial({ map: domeTexture(), side: THREE.BackSide, color: 0xdddddd }));
    dome.scale.y = squash; dome.position.y = H; scene.add(dome);
    const ocY = H + domeR * Math.cos(hole) * squash;
    const ocR = domeR * Math.sin(hole);
    const sky = new THREE.Mesh(new THREE.CircleGeometry(ocR + 0.3, 40), new THREE.MeshBasicMaterial({ map: skyTexture() }));
    sky.position.y = ocY + 0.25; sky.rotation.x = Math.PI / 2; scene.add(sky);
    // rayo de luz del óculo al piso
    const beamTex = beamTexture();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(ocR, ocR * 1.6, ocY, 32, 1, true),
      new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    shaft.position.y = ocY / 2; shaft.material.opacity = 0.04; scene.add(shaft);

    // Pedestales y vitrinas de las maquetas
    const pedMat = lam({ color: 0x2f2f31 }), pedTopMat = lam({ color: 0x1f1f21 });
    const vitGeo = new THREE.BoxGeometry(0.8, 0.66, 0.7);
    const vitMat = new THREE.MeshPhongMaterial({ color: 0xe6f2f5, transparent: true, opacity: 0.12, shininess: 100, specular: 0xffffff, depthWrite: false });
    const vitEdges = new THREE.EdgesGeometry(vitGeo), vitLine = new THREE.LineBasicMaterial({ color: 0x55595e });

    // Materiales compartidos de los nichos
    const brass = new THREE.MeshPhongMaterial({ color: 0xb8bcc2, specular: 0xffffff, shininess: 95 }); // acero (postes)
    const velvet = lam({ color: 0x1c1c1e }); // cordón negro
    const matMat = lam({ color: 0xf1ebdd });
    const fixtureMat = lam({ color: 0x1a1a1a });
    const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.92, 10);
    const postTop = new THREE.SphereGeometry(0.07, 12, 8);
    const postBase = new THREE.CylinderGeometry(0.17, 0.2, 0.05, 18);

    YEARS.forEach((item, i) => {
      const k = i + 1, phi = angleOf(k), t = item.theme;
      const grp = new THREE.Group(); grp.rotation.y = phi; scene.add(grp);
      const img = images[i];
      const aspect = img.width / img.height;
      let pw = Math.min(2.5, 1.95 * aspect), ph = pw / aspect;
      const m = 0.16, f = 0.13, cy = 2.85, wz = -R;

      // marco, paspartú y foto
      const frameMat = lam({ color: t.frame });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(pw + 2 * m + 2 * f, ph + 2 * m + 2 * f, 0.12), frameMat);
      frame.position.set(0, cy, wz + 0.07); grp.add(frame);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(pw + 2 * m + 0.04, ph + 2 * m + 0.04, 0.125), matMat);
      inner.position.set(0, cy, wz + 0.075); grp.add(inner);
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(pw + 2 * m, ph + 2 * m), matMat);
      mat.position.set(0, cy, wz + 0.14); grp.add(mat);
      const ptex = new THREE.Texture(img); ptex.needsUpdate = true; ptex.anisotropy = MAX_ANISO;
      ptex.minFilter = THREE.LinearMipmapLinearFilter;
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: ptex, toneMapped: false }));
      photo.userData.photo = true;
      photo.position.set(0, cy, wz + 0.145); grp.add(photo);
      [frame, inner, mat, photo].forEach(o => { o.userData.index = i; targets.push(o); });

      // mini texto debajo de la foto
      const cap = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.56), new THREE.MeshBasicMaterial({ map: captionTexture(item) }));
      cap.position.set(0, 1.28, wz + 0.03); cap.userData.index = i; targets.push(cap); grp.add(cap);

      // punto brillante para ver la foto de cerca (abre el visor con zoom)
      const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT_TEX, depthTest: true, transparent: true }));
      dot.scale.set(0.5, 0.645, 1);
      dot.position.copy(toWorld(phi, pw / 2 + m + f - 0.05, cy + ph / 2 + m + f - 0.05, wz + 0.3));
      dot.userData = { index: i, zoom: true, icon: true }; scene.add(dot); targets.push(dot); hotspots.push(dot);

      // foco del techo y su cono de luz
      const fx = new THREE.Vector3(0, 5.55, wz + 2.3), aim = new THREE.Vector3(0, cy, wz + 0.15);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.36, 14), fixtureMat);
      lamp.position.copy(fx); lamp.lookAt(aim); lamp.rotateX(Math.PI / 2); grp.add(lamp);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xfff1d6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.copy(fx).lerp(aim, 0.06); glow.scale.set(0.55, 0.55, 1); grp.add(glow);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H - 5.55, 6), fixtureMat);
      rod.position.set(0, (H + 5.55) / 2, wz + 2.3); grp.add(rod);


      // cordón de terciopelo
      const rz = wz + 1.05, xs = [-1.75, 0, 1.75];
      xs.forEach(x => {
        const p = new THREE.Mesh(postGeo, brass); p.position.set(x, 0.49, rz); grp.add(p);
        const tp = new THREE.Mesh(postTop, brass); tp.position.set(x, 0.97, rz); grp.add(tp);
        const b = new THREE.Mesh(postBase, brass); b.position.set(x, 0.025, rz); grp.add(b);
      });
      for (let s = 0; s < 2; s++) {
        const a = xs[s], b = xs[s + 1];
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(a, 0.9, rz), new THREE.Vector3((a + b) / 2, 0.66, rz), new THREE.Vector3(b, 0.9, rz)]);
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.028, 8), velvet));
      }

      // atril con placa dorada
      const lx = 2.75, lz = wz + 1.25;
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.36), lam({ color: 0x2b2b2d }));
      stand.position.set(lx, 0.5, lz); grp.add(stand);
      const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.6, 0.05), lam({ color: 0x2b2b2d }));
      topBox.position.set(lx, 1.12, lz + 0.02); topBox.rotation.x = -0.75; grp.add(topBox);
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), new THREE.MeshBasicMaterial({ map: plaqueTexture(item) }));
      plaque.position.set(lx, 1.12, lz + 0.02); plaque.rotation.x = -0.75; plaque.translateZ(0.03); grp.add(plaque);
      [stand, plaque].forEach(o => { o.userData.index = i; targets.push(o); });
      const info = new THREE.Sprite(new THREE.SpriteMaterial({ map: INFO_TEX, transparent: true }));
      info.scale.set(0.3, 0.39, 1); info.position.set(lx, 1.75, lz); info.userData = { index: i, icon: true };
      grp.add(info); targets.push(info); hotspots.push(info);

      // maqueta a escala de la computadora del año, en una vitrina sobre un pedestal
      const mx = -2.75, mz = wz + 1.35;
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.7), pedMat); ped.position.set(mx, 0.5, mz); grp.add(ped);
      const pedTop = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.04, 0.74), pedTopMat); pedTop.position.set(mx, 1.02, mz); grp.add(pedTop);
      const model = MODELS.make(item.year, 0.62); model.position.set(mx, 1.04, mz); model.rotation.y = 0.45; grp.add(model);
      const vit = new THREE.Mesh(vitGeo, vitMat); vit.position.set(mx, 1.04 + 0.33, mz); grp.add(vit);
      const vitEdge = new THREE.LineSegments(vitEdges, vitLine); vitEdge.position.copy(vit.position); grp.add(vitEdge);
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.24), new THREE.MeshBasicMaterial({ map: modelTagTexture(item) }));
      tag.position.set(mx, 0.8, mz + 0.351); grp.add(tag);
      [ped, vit, tag].forEach(o => { o.userData.index = i; targets.push(o); });
      // ícono LOOK sobre la vitrina: acerca la cámara a la maqueta
      const look = new THREE.Sprite(new THREE.SpriteMaterial({ map: MODEL_TEX, transparent: true }));
      look.scale.set(0.34, 0.44, 1); look.position.set(mx, 1.04 + 0.66 + 0.3, mz); look.userData = { index: i, model: true, icon: true };
      grp.add(look); targets.push(look); hotspots.push(look);
      {
        const portrait = innerWidth < innerHeight;
        const cam = toWorld(phi, mx + (portrait ? 0.9 : 0.75), EYE - 0.05, mz + (portrait ? 1.7 : 1.2));
        const tgt = toWorld(phi, mx, 1.28, mz);
        const dx = tgt.x - cam.x, dz = tgt.z - cam.z;
        modelViews.push({ pos: cam, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(tgt.y - cam.y, Math.hypot(dx, dz)) });
      }

      viewpoints.push({ pos: toWorld(phi, 0, EYE, wz + 6.1), yaw: phi, pitch: 0.17 });

      // punto de visión sobre el tapete: al tocarlo, la cámara se acerca a la foto y su texto
      const portrait = innerWidth < innerHeight;
      closeViews.push({ pos: toWorld(phi, 0, EYE, wz + (portrait ? 4.5 : 3.3)), yaw: phi, pitch: portrait ? 0.16 : 0.22 });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 40),
        new THREE.MeshBasicMaterial({ color: 0xe8c45a, transparent: true, opacity: 0.85, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(toWorld(phi, 0, 0.02, wz + 3.35)); scene.add(ring);
      const spot = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPOT_TEX, transparent: true }));
      spot.scale.set(0.8, 1.03, 1);
      spot.position.copy(toWorld(phi, 0, 0.6, wz + 3.35));
      spot.userData = { index: i, view: true, icon: true }; scene.add(spot); targets.push(spot); floorSpots.push(spot);
    });

    // Bancas de museo en el círculo del medio
    const seatMat = lam({ color: 0x3b2c22 }), legMat = lam({ color: 0x1b1b1b });
    [2, 4, 6, 8].forEach(c => {
      const phi = angleOf(c) - SEG / 2, p = toWorld(phi, 0, 0, -5.2);
      const b = new THREE.Group(); b.position.copy(p); b.rotation.y = phi; scene.add(b);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.62), seatMat); seat.position.y = 0.46; b.add(seat);
      [-0.95, 0.95].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.55), legMat); l.position.set(x, 0.21, 0); b.add(l); });
      colliders.push({ x: p.x, z: p.z, r: 1.25 });
    });

    // Quioscos de juego: uno después de cada 2 salas (en las esquinas 2, 4, 6 y 8)
    const games = [];
    if (typeof GAMES !== 'undefined') {
      const PLAY_TEX = iconTexture('play', 'PLAY');
      const kMat = lam({ color: 0x2b2b2d }), bezel = lam({ color: 0x151517 });
      GAMES.LIST.forEach((game, n) => {
        const phi = angleOf(game.after) - SEG / 2, p = toWorld(phi, 0, 0, -9.6);
        const k = new THREE.Group(); k.position.copy(p); k.rotation.y = phi; scene.add(k);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.42), kMat); body.position.y = 0.5; k.add(body);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.6), bezel); foot.position.y = 0.03; k.add(foot);
        const head = new THREE.Group(); head.position.set(0, 1.18, 0.04); head.rotation.x = -0.45; k.add(head);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.06), bezel); head.add(frame);
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: kioskScreenTexture(n, game) }));
        scr.position.z = 0.031; head.add(scr);
        const play = new THREE.Sprite(new THREE.SpriteMaterial({ map: PLAY_TEX, transparent: true }));
        play.scale.set(0.34, 0.44, 1); play.position.set(0, 1.86, 0); k.add(play);
        [body, frame, scr, play].forEach(o => { o.userData = { game: n, icon: o === play }; targets.push(o); });
        hotspots.push(play);
        colliders.push({ x: p.x, z: p.z, r: 0.75 });
        games.push({ pos: p, phi });
      });
    }

    // Pedestal central de piedra con una vitrina de vidrio (adentro, un disquete de 3.5 pulgadas)
    const stone = lam({ color: 0xa69f93 });
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.45, 0.95, 48), [
      lam({ map: plinthTexture() }), stone, stone]);
    plinth.position.y = 0.475; plinth.userData.center = true; scene.add(plinth);
    colliders.push({ x: 0, z: 0, r: 2.0 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), lam({ color: 0x2b2b2d }));
    base.position.y = 0.99; scene.add(base);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.6, 0.86),
      new THREE.MeshPhongMaterial({ color: 0xdfeff2, transparent: true, opacity: 0.16, shininess: 90, specular: 0xffffff, depthWrite: false }));
    glass.position.y = 1.33; glass.userData.center = true; scene.add(glass);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3a3a3a });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), edgeMat); edges.position.copy(glass.position); edges.userData.center = true; scene.add(edges);
    const floppy = new THREE.Group(); floppy.position.set(0, 1.16, 0); floppy.rotation.x = -0.35; floppy.userData.center = true; scene.add(floppy);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.43, 0.025), lam({ color: 0x1d1d22 }));
    floppy.add(body);
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.15, 0.03), new THREE.MeshPhongMaterial({ color: 0xc8ccd3, shininess: 80 }));
    shutter.position.set(0.02, 0.14, 0); floppy.add(shutter);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), lam({ map: floppyLabelTexture() }));
    label.position.set(0, -0.09, 0.0135); floppy.add(label);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.12), lam({ color: 0x2b2b2d }));
    stand.position.set(0, 1.08, -0.05); stand.userData.center = true; scene.add(stand);
    anim.push((tm) => { const k = 1 + Math.sin(tm * 2.4) * 0.06; hotspots.forEach(d => { const b = d.userData.base || (d.userData.base = d.scale.clone()); d.scale.set(b.x * k, b.y * k, 1); }); floorSpots.forEach(d => { d.scale.set(0.8 * k, 1.03 * k, 1); d.position.y = 0.6 + Math.sin(tm * 2) * 0.03; }); });

    return {
      targets, viewpoints, closeViews, modelViews, colliders, anim, games,
      bounds: { rMax: R - 1.35, rMin: 0 },
      start: { pos: new THREE.Vector3(0, EYE, R - 3.2), yaw: 0, pitch: 0.02 },
      angleOf, SEG, toWorld, H
    };
  }

  return { build, R, EYE };
})();
