/* =========================================================
   MODELS.JS — Maquetas a escala (3D) de la computadora de cada año.
   Cada una se arma con piezas de bordes redondeados, teclas,
   logos, mouse y parlantes, con las medidas aproximadas del
   aparato real. Después se ajusta para que quepa en la vitrina.
   ========================================================= */
const MODELS = (() => {
  const L = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const P = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 70, specular: 0x666666 }, o));
  const METAL = c => P(c, { shininess: 100, specular: 0xffffff });

  // pantalla con un fondo de escritorio de la época
  function screenMat(kind) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 192;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 192);
    if (kind === 'win') { gr.addColorStop(0, '#1d8384'); gr.addColorStop(1, '#126061'); }
    else if (kind === 'aqua') { gr.addColorStop(0, '#6f9fe0'); gr.addColorStop(1, '#1d4c98'); }
    else { gr.addColorStop(0, '#8a90cf'); gr.addColorStop(1, '#5a60a6'); }
    g.fillStyle = gr; g.fillRect(0, 0, 256, 192);
    if (kind === 'win') {
      g.fillStyle = '#c0c0c0'; g.fillRect(0, 176, 256, 16);
      g.fillStyle = '#fff'; g.fillRect(4, 179, 40, 10); g.fillStyle = '#000'; g.font = 'bold 9px Arial'; g.fillText('Start', 12, 187);
      g.fillStyle = '#fff'; [12, 44, 76].forEach(y => g.fillRect(12, y, 18, 16));
      g.fillStyle = '#c0c0c0'; g.fillRect(70, 40, 120, 90); g.fillStyle = '#000080'; g.fillRect(72, 42, 116, 10);
      g.fillStyle = '#fff'; g.fillRect(74, 56, 112, 70);
    } else {
      g.fillStyle = kind === 'aqua' ? 'rgba(240,240,240,.92)' : '#dcdcdc'; g.fillRect(0, 0, 256, 12);
      g.fillStyle = '#eee'; [24, 56, 88].forEach(y => g.fillRect(222, y, 20, 16));
      g.fillStyle = kind === 'aqua' ? '#e8e8e8' : '#d8d8d8'; g.fillRect(40, 40, 140, 100);
      g.fillStyle = kind === 'aqua' ? '#c5d4e8' : '#bbb'; g.fillRect(40, 40, 140, 12);
      if (kind === 'aqua') { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(60, 170, 140, 18); }
    }
    // reflejo suave del vidrio
    const sh = g.createLinearGradient(0, 0, 256, 192);
    sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(0, 0, 256, 192);
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) });
  }

  // rectángulo de esquinas redondeadas
  function rshape(a, b, r) {
    r = Math.max(0.0005, Math.min(r, a / 2 - 1e-4, b / 2 - 1e-4));
    const s = new THREE.Shape(), x = -a / 2, y = -b / 2;
    s.moveTo(x + r, y); s.lineTo(x + a - r, y); s.quadraticCurveTo(x + a, y, x + a, y + r);
    s.lineTo(x + a, y + b - r); s.quadraticCurveTo(x + a, y + b, x + a - r, y + b);
    s.lineTo(x + r, y + b); s.quadraticCurveTo(x, y + b, x, y + b - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // caja con bordes redondeados. axis 'y' = redondeada vista desde arriba (bases de portátil),
  // axis 'z' = redondeada vista de frente (monitores, torres)
  function rbox(p, w, h, d, r, m, x = 0, y = 0, z = 0, axis = 'z') {
    const thick = axis === 'y' ? h : d;
    const bev = Math.min(r * 0.6, thick * 0.35);
    let geo;
    if (axis === 'y') {
      geo = new THREE.ExtrudeGeometry(rshape(w - 2 * bev, d - 2 * bev, r), { depth: Math.max(1e-4, h - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 6 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, bev - h / 2, 0);
    } else {
      geo = new THREE.ExtrudeGeometry(rshape(w - 2 * bev, h - 2 * bev, r), { depth: Math.max(1e-4, d - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 6 });
      geo.translate(0, 0, bev - d / 2);
    }
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o;
  }
  function box(p, w, h, d, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; }
  function plane(p, w, h, m, x, y, z) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); p.add(o); return o; }
  function cyl(p, r1, r2, h, m, x = 0, y = 0, z = 0, seg = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); p.add(o); return o; }
  function sphere(p, r, m, x, y, z, sx = 1, sy = 1, sz = 1) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); p.add(o); return o; }

  // teclado: todas las teclas en una sola pieza (rápido de dibujar)
  function keys(p, cols, rows, kw, kd, gap, m, x, y, z) {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(kw, kw * 0.35, kd), m, cols * rows);
    const t = new THREE.Object3D(); let i = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      t.position.set(x + (c - (cols - 1) / 2) * (kw + gap), y, z + r * (kd + gap));
      t.updateMatrix(); im.setMatrixAt(i++, t.matrix);
    }
    p.add(im); return im;
  }
  // logo de manzana sencillo (círculo con hojita), para la tapa o el frente
  function apple(p, size, m, x, y, z, ry = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
    g.add(new THREE.Mesh(new THREE.CircleGeometry(size * 0.5, 20), m));
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(size * 0.18, 10), m);
    leaf.scale.set(0.6, 1.2, 1); leaf.position.set(size * 0.1, size * 0.62, 0); leaf.rotation.z = -0.5; g.add(leaf);
    return g;
  }
  function mouse(p, m, x, z) { return sphere(p, 0.03, m, x, 0.012, z, 1, 0.4, 1.6); }

  // portátil genérico: base + teclado + trackpad + tapa abierta con pantalla
  function laptop(g, o) {
    const { w, d, bh, lh, lt, base, lid, scr, open = 1.85 } = o;
    rbox(g, w, bh, d, o.r || 0.012, base, 0, bh / 2, 0, 'y');
    box(g, w * 0.88, 0.002, d * 0.44, o.well || L(0x18181a), 0, bh + 0.0005, -d * 0.1);
    const kw = w * 0.88 / 14 - 0.0025, kd = d * 0.44 / 5 - 0.0025;
    keys(g, 14, 5, kw, kd, 0.0025, o.keys, 0, bh + 0.002, -d * 0.1 - d * 0.22 + kd / 2 + 0.001);
    if (o.pad) rbox(g, w * 0.24, 0.002, d * 0.19, 0.004, o.pad, 0, bh + 0.0008, d * 0.29, 'y');
    const hinge = new THREE.Group(); hinge.position.set(0, bh, -d / 2 + lt / 2); hinge.rotation.x = -(open - Math.PI / 2); g.add(hinge);
    rbox(hinge, w, lh, lt, o.r || 0.012, lid, 0, lh / 2, -lt / 2);
    box(hinge, (o.sw || w * 0.8) + 0.01, (o.sh || lh * 0.78) + 0.01, 0.001, L(0x0c0c0e), 0, lh * 0.53, 0.0005);
    plane(hinge, o.sw || w * 0.8, o.sh || lh * 0.78, scr, 0, lh * 0.53, 0.0012);
    if (o.logo) apple(hinge, 0.04, o.logo, 0, lh * 0.55, -lt - 0.0006, Math.PI);
    return hinge;
  }

  const build = {
    1995() { // IBM ThinkPad 701C con el teclado "mariposa" abierto
      const g = new THREE.Group(), black = P(0x1c1c1e, { shininess: 25 }), keyM = P(0x2e2e33, { shininess: 30 });
      laptop(g, { w: 0.245, d: 0.2, bh: 0.034, lh: 0.19, lt: 0.012, base: black, lid: black, keys: keyM, scr: screenMat('win'), sw: 0.2, sh: 0.15 });
      // las dos mitades del teclado, más anchas que el cuerpo
      rbox(g, 0.145, 0.006, 0.105, 0.006, black, -0.074, 0.037, -0.012, 'y');
      rbox(g, 0.145, 0.006, 0.105, 0.006, black, 0.074, 0.037, -0.012, 'y');
      keys(g, 15, 6, 0.0165, 0.0145, 0.002, keyM, 0, 0.042, -0.058);
      sphere(g, 0.0045, L(0xd02020), 0.004, 0.045, -0.006);
      box(g, 0.05, 0.004, 0.002, L(0x4060c0), 0.07, 0.017, 0.1011);  // logo IBM (franja azul)
      return g;
    },
    1996() { // Apple PowerBook 1400
      const g = new THREE.Group(), gray = P(0x3b3b40, { shininess: 25 });
      laptop(g, { w: 0.29, d: 0.23, bh: 0.05, lh: 0.22, lt: 0.016, base: gray, lid: P(0x2f2f34, { shininess: 25 }), keys: P(0x202024, { shininess: 30 }), pad: P(0x55555a, { shininess: 10 }), scr: screenMat('mac'), sw: 0.22, sh: 0.165, logo: P(0x9a9aa0) });
      box(g, 0.11, 0.012, 0.002, L(0x111113), 0.055, 0.025, 0.1155);   // bahía del CD
      box(g, 0.02, 0.004, 0.002, L(0x55aa55), -0.11, 0.035, 0.1155);   // lucecita
      return g;
    },
    1997() { // Power Macintosh G3 de escritorio, con monitor, teclado y mouse beige
      const g = new THREE.Group(), beige = P(0xdcd2bc, { shininess: 15 }), dark = L(0x6a6458), keyM = P(0xcfc5ae, { shininess: 15 });
      rbox(g, 0.42, 0.14, 0.43, 0.01, beige, 0, 0.07, 0);
      box(g, 0.13, 0.008, 0.003, dark, 0.11, 0.095, 0.2155);            // disquetera
      box(g, 0.15, 0.014, 0.003, P(0xc9bfa8), 0.11, 0.06, 0.2155);       // CD
      apple(g, 0.022, P(0x7a9a50), -0.17, 0.11, 0.2165);
      rbox(g, 0.37, 0.34, 0.07, 0.015, beige, 0, 0.14 + 0.175, 0.11);    // frente del monitor
      rbox(g, 0.29, 0.26, 0.24, 0.03, beige, 0, 0.14 + 0.17, -0.05);     // tubo del monitor
      box(g, 0.3, 0.225, 0.002, L(0x111111), 0, 0.14 + 0.185, 0.1455);
      plane(g, 0.28, 0.21, screenMat('mac'), 0, 0.14 + 0.185, 0.1468);
      rbox(g, 0.44, 0.03, 0.16, 0.01, beige, 0, 0.015, 0.34, 'y');        // teclado
      keys(g, 18, 5, 0.019, 0.02, 0.003, keyM, -0.02, 0.034, 0.29);
      mouse(g, beige, 0.28, 0.33);
      return g;
    },
    1998() { // iMac G3 Bondi Blue con su mouse redondo
      const g = new THREE.Group();
      const shell = P(0x1aa0b4, { shininess: 90 }), ice = P(0xe8f0f2, { shininess: 60 });
      sphere(g, 0.2, shell, 0, 0.235, -0.1, 0.95, 0.9, 0.85);
      rbox(g, 0.38, 0.37, 0.1, 0.035, ice, 0, 0.235, 0.07);
      rbox(g, 0.38, 0.065, 0.104, 0.03, shell, 0, 0.085, 0.07);
      box(g, 0.3, 0.23, 0.002, L(0x101012), 0, 0.26, 0.1205);
      plane(g, 0.29, 0.22, screenMat('mac'), 0, 0.26, 0.1218);
      apple(g, 0.022, P(0x2a5f6e), 0, 0.085, 0.1225);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 10, 24, Math.PI), shell);
      handle.position.set(0, 0.4, -0.12); g.add(handle);
      rbox(g, 0.26, 0.04, 0.26, 0.04, shell, 0, 0.02, -0.02, 'y');
      sphere(g, 0.03, shell, 0.24, 0.015, 0.2, 1, 0.45, 1);              // mouse "puck"
      rbox(g, 0.36, 0.022, 0.13, 0.01, ice, -0.02, 0.011, 0.24, 'y');     // teclado
      keys(g, 16, 5, 0.019, 0.018, 0.003, P(0x1aa0b4, { shininess: 60 }), -0.02, 0.026, 0.195);
      return g;
    },
    1999() { // iBook "clamshell" Blueberry
      const g = new THREE.Group(), blue = P(0x3f62c2, { shininess: 80 }), white = P(0xf0f0f0, { shininess: 50 });
      const base = cyl(g, 0.17, 0.165, 0.05, blue, 0, 0.025, 0, 48); base.scale.set(1, 1, 0.85);
      const top = cyl(g, 0.155, 0.155, 0.006, white, 0, 0.051, 0, 48); top.scale.set(1, 1, 0.8);
      keys(g, 14, 5, 0.0165, 0.0155, 0.0025, P(0xf8f8f8, { shininess: 40 }), 0, 0.056, -0.075);
      rbox(g, 0.075, 0.003, 0.055, 0.006, P(0xdedede), 0, 0.055, 0.075, 'y');
      const hinge = new THREE.Group(); hinge.position.set(0, 0.052, -0.11); hinge.rotation.x = -0.28; g.add(hinge);
      const lid = cyl(hinge, 0.16, 0.16, 0.022, blue, 0, 0.13, -0.014, 48); lid.scale.set(1, 1, 0.82); lid.rotation.x = Math.PI / 2;
      rbox(hinge, 0.275, 0.215, 0.012, 0.03, white, 0, 0.13, 0.002);
      box(hinge, 0.225, 0.17, 0.001, L(0x101012), 0, 0.135, 0.0085);
      plane(hinge, 0.215, 0.162, screenMat('mac'), 0, 0.135, 0.0092);
      apple(hinge, 0.035, white, 0, 0.13, -0.0255, Math.PI);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 10, 28, Math.PI), white);
      handle.rotation.x = -Math.PI / 2; handle.position.set(0, 0.025, -0.14); handle.rotation.z = Math.PI; g.add(handle);
      return g;
    },
    2000() { // Power Mac G4 Cube con monitor, parlantes esféricos y teclado
      const g = new THREE.Group();
      const clear = new THREE.MeshPhongMaterial({ color: 0xeef6fa, transparent: true, opacity: 0.3, shininess: 120, specular: 0xffffff, depthWrite: false });
      const silver = METAL(0xd4d8dd);
      rbox(g, 0.17, 0.19, 0.17, 0.006, silver, 0, 0.14, 0);
      rbox(g, 0.2, 0.25, 0.2, 0.012, clear, 0, 0.125, 0);
      box(g, 0.1, 0.002, 0.008, L(0x222222), 0, 0.2505, 0);
      apple(g, 0.03, P(0xffffff), 0, 0.18, 0.0865);
      const mon = new THREE.Group(); mon.position.set(0.36, 0, -0.06); mon.rotation.y = -0.2; g.add(mon);
      rbox(mon, 0.42, 0.33, 0.035, 0.02, clear, 0, 0.29, 0);
      rbox(mon, 0.39, 0.3, 0.025, 0.012, P(0x2a2a2c, { shininess: 60 }), 0, 0.29, 0);
      plane(mon, 0.35, 0.26, screenMat('aqua'), 0, 0.29, 0.0127);
      rbox(mon, 0.06, 0.13, 0.04, 0.01, clear, 0, 0.07, -0.03);
      [-0.14, 0.62].forEach(x => {                                        // parlantes Harman Kardon
        sphere(g, 0.055, clear, x, 0.06, 0.02);
        sphere(g, 0.035, METAL(0x8a8e94), x, 0.06, 0.02);
      });
      rbox(g, 0.42, 0.02, 0.15, 0.01, P(0xf2f2f2), 0.3, 0.01, 0.2, 'y');
      keys(g, 16, 5, 0.021, 0.02, 0.003, P(0xffffff, { shininess: 40 }), 0.3, 0.024, 0.155);
      return g;
    },
    2001() { // PowerBook G4 de titanio
      const g = new THREE.Group(), ti = METAL(0xbcc0c4);
      laptop(g, { w: 0.34, d: 0.24, bh: 0.026, lh: 0.235, lt: 0.008, r: 0.008, base: ti, lid: ti, keys: P(0x2a2a2e, { shininess: 40 }), well: L(0x8d9196), pad: P(0xa9adb2, { shininess: 30 }), scr: screenMat('aqua'), sw: 0.31, sh: 0.2, open: 1.9, logo: P(0xffffff, { emissive: 0x666666 }) });
      return g;
    },
    2002() { // iMac G4 "Sunflower": base blanca redonda, brazo cromado y pantalla plana
      const g = new THREE.Group(), white = P(0xf6f6f6, { shininess: 80 }), chrome = METAL(0xd8dce0);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.135, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), white);
      dome.scale.y = 0.85; g.add(dome);
      cyl(g, 0.137, 0.137, 0.006, P(0xbfbfbf), 0, 0.003, 0, 40);
      apple(g, 0.025, P(0x9a9a9a), 0, 0.06, 0.1235);
      const neck = cyl(g, 0.009, 0.009, 0.25, chrome, 0, 0.215, -0.02, 14); neck.rotation.x = 0.25;
      sphere(g, 0.016, chrome, 0, 0.11, 0.0);
      rbox(g, 0.4, 0.32, 0.035, 0.025, white, 0, 0.36, 0.02);
      box(g, 0.355, 0.26, 0.001, L(0x101012), 0, 0.365, 0.0376);
      plane(g, 0.345, 0.255, screenMat('aqua'), 0, 0.365, 0.0382);
      const clear = new THREE.MeshPhongMaterial({ color: 0xeef6fa, transparent: true, opacity: 0.35, shininess: 120, specular: 0xffffff, depthWrite: false });
      [-0.3, 0.3].forEach(x => { sphere(g, 0.05, clear, x, 0.05, 0.05); sphere(g, 0.03, METAL(0x9da1a6), x, 0.05, 0.05); });
      rbox(g, 0.43, 0.018, 0.15, 0.01, P(0xf2f2f2), 0, 0.009, 0.26, 'y');
      keys(g, 17, 5, 0.021, 0.02, 0.003, P(0xffffff, { shininess: 40 }), 0, 0.022, 0.215);
      mouse(g, P(0xf4f4f4), 0.28, 0.27);
      return g;
    },
    2003() { // Power Mac G5: torre de aluminio con rejilla perforada y manijas
      const g = new THREE.Group(), alu = METAL(0xc8ccd1);
      rbox(g, 0.206, 0.47, 0.475, 0.008, alu, 0, 0.275, 0);
      const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
      x.fillStyle = '#c4c8cd'; x.fillRect(0, 0, 128, 256); x.fillStyle = '#2e3238';
      for (let yy = 4; yy < 256; yy += 6) for (let xx = (yy / 6 % 2) * 3 + 3; xx < 128; xx += 6) { x.beginPath(); x.arc(xx, yy, 1.9, 0, 7); x.fill(); }
      const grille = new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(c), shininess: 60, specular: 0x888888 });
      plane(g, 0.19, 0.44, grille, 0, 0.275, 0.2381);
      const back = plane(g, 0.19, 0.44, grille, 0, 0.275, -0.2381); back.rotation.y = Math.PI;
      // manijas arriba y patas abajo (marco de aluminio)
      [0.22, -0.22].forEach(z => {
        rbox(g, 0.206, 0.05, 0.035, 0.012, alu, 0, 0.52, z);
        rbox(g, 0.206, 0.04, 0.035, 0.012, alu, 0, 0.02, z);
      });
      box(g, 0.002, 0.012, 0.15, L(0x2a2a2a), 0.104, 0.44, 0.08);        // bandeja del disco
      apple(g, 0.06, P(0x8f9399), 0.1035, 0.3, 0, Math.PI / 2);
      const btn = cyl(g, 0.007, 0.007, 0.003, P(0x9a9ea3), 0.06, 0.2, 0.2385, 16); btn.rotation.x = Math.PI / 2;
      return g;
    }
  };

  // Arma la maqueta del año y la achica para que quepa en la vitrina (máx. size metros)
  function make(year, size) {
    const g = build[year] ? build[year]() : new THREE.Group();
    g.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
    const k = size / Math.max(sz.x, sz.z, sz.y * 1.15);
    const wrap = new THREE.Group(); g.scale.setScalar(k);
    g.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k);
    wrap.add(g);
    return wrap;
  }
  return { make };
})();
