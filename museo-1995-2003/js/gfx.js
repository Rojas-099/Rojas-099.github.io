/* =========================================================
   GFX.JS — Mejora los gráficos del museo:
   - colores correctos (sRGB) y tono de cámara de cine (ACES)
   - en computador: piso de madera barnizada que refleja la sala,
     metal y vidrio con brillo real, y sombras suaves sobre el piso
   - en celular: sombras más livianas y reflejos en metal y vidrio,
     sin el reflejo del piso (para que siga fluido)
   ========================================================= */
const GFX = (() => {
  function apply(scene, renderer, museum, high) {
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = high ? 1.05 : 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = high ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

    const done = new Set(), stdCache = new Map();
    const lumOf = c => 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;

    // Arregla colores y texturas para el modo sRGB
    function fix(m) {
      if (done.has(m)) return; done.add(m);
      if (m.color) m.color.convertSRGBToLinear();
      if (m.emissive) m.emissive.convertSRGBToLinear();
      if (m.specular) m.specular.convertSRGBToLinear();
      if (m.map) { m.map.encoding = THREE.sRGBEncoding; m.map.needsUpdate = true; }
      if (m.isMeshBasicMaterial || m.isSpriteMaterial) m.toneMapped = false;
    }
    // Cambia un material simple por uno físico (PBR), solo en computador
    function toStd(m, o) {
      const key = m.uuid + (o.userData.rough || '');
      if (stdCache.has(key)) return stdCache.get(key);
      let rough = 0.85, metal = 0;
      if (m.isMeshPhongMaterial) {
        rough = m.shininess >= 90 ? 0.22 : 0.4;
        metal = m.shininess >= 90 && lumOf(m.color) > 0.25 && !m.transparent ? 0.45 : 0;
      }
      if (o.userData.rough) rough = o.userData.rough;
      const s = new THREE.MeshStandardMaterial({
        color: m.color, map: m.map || null, emissive: m.emissive || new THREE.Color(0),
        transparent: m.transparent, opacity: m.opacity, side: m.side, depthWrite: m.depthWrite,
        roughness: rough, metalness: metal, envMapIntensity: o.userData.rough ? 0.9 : 0.55
      });
      stdCache.set(key, s);
      return s;
    }

    scene.traverse(o => {
      if (!o.material) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach(fix);
      if (o.isMesh) {
        const out = list.map(m => (m.isMeshPhongMaterial || (high && m.isMeshLambertMaterial && o.userData.rough)) ? toStd(m, o) : m);
        o.material = Array.isArray(o.material) ? out : out[0];
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const big = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) > 5;
        const m0 = Array.isArray(o.material) ? o.material[0] : o.material;
        o.castShadow = !big && !m0.transparent && !m0.isMeshBasicMaterial;
        o.receiveShadow = !m0.isMeshBasicMaterial;
      }
    });

    // Luces: un poco menos de luz general para que se noten los focos
    scene.children.filter(o => o.isAmbientLight).forEach(l => { l.intensity = high ? 0.38 : 0.45; });
    scene.children.filter(o => o.isHemisphereLight).forEach(l => { l.intensity = high ? 0.6 : 0.7; });
    scene.children.filter(o => o.isDirectionalLight).forEach(l => { l.intensity = 0; });

    // luz que entra por la claraboya de la cúpula, con sombras suaves (también en celular)
    {
      const sky = new THREE.DirectionalLight(0xfff1dc, 0.85);
      sky.position.set(3.5, 16, 2.5); sky.target.position.set(0, 0, 0);
      sky.castShadow = true;
      sky.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
      const sc = sky.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 4; sc.far = 30;
      sky.shadow.bias = -0.0004; sky.shadow.normalBias = 0.03; sky.shadow.radius = 4;
      scene.add(sky, sky.target);
    }

    // reflejos del entorno en metal, vidrio y plástico: una foto 360° de la sala
    // tomada desde el centro (sin el pedestal, que taparía la cámara)
    {
      const hidden = [];
      scene.traverse(o => { if (o.userData.center && o.visible) { o.visible = false; hidden.push(o); } });
      const rt = new THREE.WebGLCubeRenderTarget(high ? 256 : 128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
      rt.texture.encoding = THREE.sRGBEncoding;
      const cc = new THREE.CubeCamera(0.1, 40, rt); cc.position.set(0, 2.2, 0); scene.add(cc);
      cc.update(renderer, scene);
      scene.remove(cc);
      hidden.forEach(o => (o.visible = true));
      stdCache.forEach(m => { m.envMap = rt.texture; m.needsUpdate = true; });
    }

    if (high) {
      // reflejos en el piso barnizado: una copia de la sala "al revés" debajo del piso,
      // y el piso un poco transparente encima (truco clásico de los videojuegos)
      const floor = scene.children.find(o => o.userData.rough);
      const mirror = new THREE.Group(); mirror.scale.y = -1;
      scene.children.slice().forEach(o => {
        if (o === floor || o.isLight || o.type === 'Object3D') return;
        const c = o.clone();
        c.traverse(n => { n.castShadow = false; n.receiveShadow = false; });
        mirror.add(c);
      });
      scene.add(mirror);
      if (floor) {
        const fm = floor.material;
        fm.transparent = true; fm.opacity = 0.84; fm.depthWrite = true;
      }
    }
  }
  return { apply };
})();
