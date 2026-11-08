/* DaVinci Flora & Living: procedural art-directed image slots.
   Every picture is a placeholder composition (inline SVG, no embedded text).
   To use real photography later, give a slot a data-photo="url" attribute (see app.js). */
(function () {
  let uid = 0;
  const R = (s) => { let a = (s >>> 0) || 1; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const mix = (h, t, amt) => { const a = hex(h), b = hex(t); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * amt).toString(16).padStart(2, '0')).join(''); };
  const dark = (h, a) => mix(h, '#2a1d10', a);
  const light = (h, a) => mix(h, '#fff4dc', a);

  function svg(inner, defs, W, H) {
    W = W || 400; H = H || 500;
    return '<svg class="art" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' + (defs || '') + '</defs>' + inner + '<rect width="' + W + '" height="' + H + '" filter="url(#grain)" opacity=".5" style="mix-blend-mode:multiply"/></svg>';
  }

  function room(id, wall, floor, floorY) {
    floorY = floorY || 378;
    const defs =
      '<linearGradient id="w' + id + '" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="' + wall[0] + '"/><stop offset="1" stop-color="' + wall[1] + '"/></linearGradient>' +
      '<linearGradient id="f' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + floor[0] + '"/><stop offset="1" stop-color="' + floor[1] + '"/></linearGradient>' +
      '<linearGradient id="v' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1d10" stop-opacity=".28"/></linearGradient>';
    const body =
      '<rect width="400" height="500" fill="url(#w' + id + ')"/>' +
      '<g filter="url(#soft2)" opacity=".55"><path d="M-30 30 L180 -10 L330 ' + floorY + ' L40 ' + (floorY + 30) + 'Z" fill="#fff3d0" opacity=".5"/></g>' +
      '<rect y="' + floorY + '" width="400" height="' + (500 - floorY) + '" fill="url(#f' + id + ')"/>' +
      '<rect y="' + (floorY - 3) + '" width="400" height="5" fill="#3a2a14" opacity=".12"/>' +
      '<rect width="400" height="500" fill="url(#v' + id + ')"/>';
    return { defs, body };
  }

  function potSvg(id, cx, y, w, h, col, shape) {
    const g = 'pg' + id + '_' + cx + '_' + Math.round(w);
    const defs = '<linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + light(col, .22) + '"/><stop offset=".45" stop-color="' + col + '"/><stop offset="1" stop-color="' + dark(col, .38) + '"/></linearGradient>';
    const top = y - h;
    let body = '';
    const shadow = '<ellipse cx="' + (cx + 8) + '" cy="' + (y + 3) + '" rx="' + (w * .72) + '" ry="9" fill="#2a1d10" opacity=".3" filter="url(#soft)"/>';
    if (shape === 'cyl') {
      body = '<path d="M' + (cx - w / 2) + ' ' + top + 'h' + w + 'l-7 ' + h + 'h' + (-(w - 14)) + 'z" fill="url(#' + g + ')"/>' +
        '<rect x="' + (cx - w / 2 - 3) + '" y="' + (top - 6) + '" width="' + (w + 6) + '" height="14" rx="3" fill="url(#' + g + ')"/>';
    } else if (shape === 'bowl') {
      body = '<path d="M' + (cx - w / 2) + ' ' + top + 'h' + w + 'C' + (cx + w / 2) + ' ' + (top + h * .8) + ' ' + (cx + w * .3) + ' ' + y + ' ' + (cx + w * .2) + ' ' + y + 'h' + (-w * .4) + 'C' + (cx - w * .3) + ' ' + y + ' ' + (cx - w / 2) + ' ' + (top + h * .8) + ' ' + (cx - w / 2) + ' ' + top + 'z" fill="url(#' + g + ')"/>' +
        '<ellipse cx="' + cx + '" cy="' + top + '" rx="' + (w / 2) + '" ry="7" fill="' + dark(col, .45) + '"/>';
    } else {
      body = '<path d="M' + (cx - w / 2) + ' ' + top + 'h' + w + 'C' + (cx + w / 2 - 2) + ' ' + (top + h * .55) + ' ' + (cx + w * .36) + ' ' + y + ' ' + (cx + w * .3) + ' ' + y + 'h' + (-w * .6) + 'C' + (cx - w * .36) + ' ' + y + ' ' + (cx - w / 2 + 2) + ' ' + (top + h * .55) + ' ' + (cx - w / 2) + ' ' + top + 'z" fill="url(#' + g + ')"/>' +
        '<rect x="' + (cx - w * .56) + '" y="' + (top - h * .14) + '" width="' + (w * 1.12) + '" height="' + (h * .2) + '" rx="4" fill="url(#' + g + ')"/>';
    }
    return { defs, body: shadow + body + '<ellipse cx="' + cx + '" cy="' + (top - 4) + '" rx="' + (w * .46) + '" ry="5" fill="#3b2a1a" opacity=".85"/>' };
  }

  function leafCloud(r, cx, cy, rx, ry, n, cols, lw, lh, fruit) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (lw * (.7 + r() * .6)).toFixed(1) + '" ry="' + lh + '" transform="rotate(' + Math.round(r() * 180 - 90) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + pick(r, cols) + '" opacity="' + (.78 + r() * .22).toFixed(2) + '"/>';
    }
    if (fruit) {
      for (let i = 0; i < fruit.n; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * .85;
        const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, c = pick(r, fruit.cols);
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + fruit.r + '" fill="' + c + '"/><circle cx="' + (x - fruit.r * .3).toFixed(1) + '" cy="' + (y - fruit.r * .35).toFixed(1) + '" r="' + (fruit.r * .3) + '" fill="#fff6d8" opacity=".55"/>';
      }
    }
    return s;
  }

  function trunk(r, cx, top, h, spread, w) {
    let s = '<g fill="none" stroke-linecap="round">';
    [-1, 0, 1].forEach((i) => {
      const w2 = i === 0 ? w : w * .62;
      s += '<path d="M' + (cx + i * 9) + ' ' + (top + 6) + ' C' + (cx + i * 26 + (r() * 16 - 8)) + ' ' + (top - h * .35) + ' ' + (cx + i * spread * .7 + (r() * 20 - 10)) + ' ' + (top - h * .7) + ' ' + (cx + i * spread + (r() * 16 - 8)) + ' ' + (top - h) + '" stroke="#5a4632" stroke-width="' + w2 + '"/>';
      s += '<path d="M' + (cx + i * 9 - 2) + ' ' + (top + 6) + ' C' + (cx + i * 26 - 3) + ' ' + (top - h * .35) + ' ' + (cx + i * spread * .7 - 3) + ' ' + (top - h * .7) + ' ' + (cx + i * spread - 2) + ' ' + (top - h) + '" stroke="#8a7255" stroke-width="' + (w2 * .25) + '" opacity=".6"/>';
    });
    return s + '</g>';
  }

  function tree(o, kind) {
    const r = R(o.s || 7), id = ++uid;
    const rm = room(id, o.w || ['#ecdfc4', '#d6bf94'], o.f || ['#cdb083', '#a98a5e']);
    const col = o.pot || '#b4562f', shape = o.shape || 'round';
    const pw = o.pw || 112, ph = o.ph || 96, base = 415;
    const pt = potSvg(id, 200, base, pw, ph, col, shape);
    const top = base - ph;
    let s = rm.body + pt.body;
    if (kind === 'olive') {
      s += trunk(r, 200, top, 150, 56, 12);
      s += leafCloud(r, 200, top - 190, 132, 96, 210, ['#8c9b6c', '#a7b28c', '#6f8052', '#c3cbab', '#7d8e5e'], 12, 3.2);
    } else if (kind === 'citrus') {
      s += trunk(r, 200, top, 90, 24, 9);
      s += leafCloud(r, 200, top - 150, 112, 92, 170, ['#4f6a2e', '#5f7c37', '#3f5a26', '#6e8b40'], 11, 5.5, { n: 17, r: 8, cols: ['#e8a02c', '#f1c13e', '#e58a24'] });
    } else if (kind === 'fig') {
      s += trunk(r, 200, top, 120, 40, 10);
      s += leafCloud(r, 200, top - 170, 118, 92, 70, ['#5f7c37', '#6e8b40', '#4a6a2d', '#7a9648'], 20, 12, { n: 5, r: 9, cols: ['#6b3f5a', '#7b4a66'] });
    } else if (kind === 'cypress') {
      const cy = top - 150;
      for (let i = 0; i < 9; i++) {
        const k = i / 8;
        s += '<ellipse cx="' + (200 + (r() * 6 - 3)) + '" cy="' + (cy + k * 130 - 8) + '" rx="' + (14 + Math.sin(k * 3.1) * 26) + '" ry="' + (62 - k * 14) + '" fill="' + pick(r, ['#2f4a2b', '#38552f', '#27401f']) + '"/>';
      }
      s += leafCloud(r, 200, cy + 40, 30, 120, 90, ['#3f5f38', '#2c4526', '#4b6e3f'], 8, 3);
    }
    return svg(s, rm.defs + pt.defs);
  }

  function agave(o) {
    const r = R(o.s || 3), id = ++uid;
    const rm = room(id, o.w || ['#ecdfc4', '#d6bf94'], o.f || ['#cdb083', '#a98a5e']);
    const pt = potSvg(id, 200, 415, o.pw || 150, 100, o.pot || '#c9b79a', o.shape || 'bowl');
    let s = rm.body + pt.body;
    const cols = ['#7e9a86', '#6f8c78', '#8fa896', '#5f7b69'];
    for (let i = 0; i < 17; i++) {
      const a = (-80 + i * 10) * Math.PI / 180, L = 120 + r() * 50 - Math.abs(i - 8) * 3;
      const x = 200 + Math.sin(a) * L, y = 322 - Math.cos(a) * L * .9;
      const nx = Math.cos(a) * 11, ny = Math.sin(a) * 11;
      s += '<path d="M' + (200 - nx) + ' 322 Q' + ((200 + x) / 2 - nx * 1.6) + ' ' + ((322 + y) / 2) + ' ' + x + ' ' + y + ' Q' + ((200 + x) / 2 + nx * 1.6) + ' ' + ((322 + y) / 2) + ' ' + (200 + nx) + ' 322Z" fill="' + pick(r, cols) + '" stroke="' + dark('#5f7b69', .2) + '" stroke-width=".6" opacity=".96"/>';
    }
    return svg(s, rm.defs + pt.defs);
  }

  function herb(o, kind) {
    const r = R(o.s || 5), id = ++uid;
    const rm = room(id, o.w || ['#ecdfc4', '#d6bf94'], o.f || ['#cdb083', '#a98a5e']);
    const pt = potSvg(id, 200, 415, o.pw || 130, 95, o.pot || '#b4562f', o.shape || 'round');
    let s = rm.body + pt.body + '<g fill="none" stroke-linecap="round">';
    const n = kind === 'lavender' ? 22 : 30;
    for (let i = 0; i < n; i++) {
      const x0 = 200 + (r() * 90 - 45), x1 = 200 + (i / n - .5) * 250 + (r() * 30 - 15), y1 = 140 + r() * 80;
      s += '<path d="M' + x0 + ' 322 Q' + ((x0 + x1) / 2 + r() * 20 - 10) + ' ' + ((322 + y1) / 2) + ' ' + x1 + ' ' + y1 + '" stroke="' + (kind === 'lavender' ? '#7f9560' : '#4f6a3a') + '" stroke-width="2.2"/>';
      if (kind === 'lavender') {
        for (let j = 0; j < 7; j++) s += '<ellipse cx="' + (x1 + (r() * 4 - 2)) + '" cy="' + (y1 - j * 7) + '" rx="3.6" ry="5" fill="' + pick(r, ['#8a77b0', '#9c88c2', '#7664a0']) + '"/>';
      } else {
        for (let j = 0; j < 9; j++) s += '<path d="M' + x1 + ' ' + (y1 + j * 9) + ' l' + (r() * 12 - 6) + ' -10" stroke="' + pick(r, ['#5d7b45', '#4a6a35', '#6f8c52']) + '" stroke-width="2.4"/>';
      }
    }
    return svg(s + '</g>', rm.defs + pt.defs);
  }

  function potOnly(o) {
    const r = R(o.s || 9), id = ++uid;
    const rm = room(id, o.w || ['#eadfc8', '#d9c7a3'], o.f || ['#cdb083', '#a98a5e'], 360);
    const a = potSvg(id, 150, 400, 150, 150, o.pot || '#b4562f', 'round');
    const b = potSvg(id, 290, 400, 96, 100, o.pot2 || '#c9b79a', o.shape || 'cyl');
    const c = potSvg(id, 232, 400, 70, 52, o.pot3 || '#6d7a4a', 'bowl');
    return svg(rm.body + a.body + b.body + c.body, rm.defs + a.defs + b.defs + c.defs);
  }

  function combo(o) {
    const r = R(o.s || 2), id = ++uid;
    const rm = room(id, o.w || ['#ecdfc4', '#d6bf94'], o.f || ['#cdb083', '#a98a5e']);
    const p1 = potSvg(id, 135, 415, 100, 86, o.pot || '#b4562f', 'round');
    const p2 = potSvg(id, 275, 415, 92, 78, o.pot2 || '#c9b79a', 'cyl');
    let s = rm.body + p1.body + p2.body;
    s += trunk(r, 135, 329, 120, 30, 9) + leafCloud(r, 135, 150, 92, 76, 120, ['#8c9b6c', '#a7b28c', '#6f8052', '#c3cbab'], 11, 3);
    s += trunk(r, 275, 337, 80, 20, 8) + leafCloud(r, 275, 218, 84, 66, 110, ['#4f6a2e', '#5f7c37', '#6e8b40'], 10, 5, { n: 9, r: 7, cols: ['#e8a02c', '#f1c13e'] });
    return svg(s, rm.defs + p1.defs + p2.defs);
  }

  /* LIVING */
  function arch(x, y, w, h, fill, extra) {
    return '<path d="M' + x + ' ' + (y + h) + 'V' + (y + w / 2) + 'a' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + w + ' 0V' + (y + h) + 'z" fill="' + fill + '" ' + (extra || '') + '/>';
  }

  function swatch(o) {
    const id = ++uid, cols = o.cols || ['#e9dcc0', '#d9a441', '#8d9a6a', '#b4562f', '#c9b79a', '#6b4f3a'];
    const rm = room(id, o.w || ['#efe4cd', '#ddcba8'], ['#cdb083', '#a98a5e'], 430);
    let s = rm.body;
    s += arch(80, 50, 240, 340, light(cols[0], .1), 'opacity=".9"');
    cols.forEach((c, i) => {
      const x = 56 + (i % 3) * 100, y = 250 + Math.floor(i / 3) * 96;
      s += '<rect x="' + (x + 4) + '" y="' + (y + 6) + '" width="86" height="86" fill="#2a1d10" opacity=".18" filter="url(#soft)"/><rect x="' + x + '" y="' + y + '" width="86" height="86" fill="' + c + '"/><rect x="' + x + '" y="' + y + '" width="86" height="86" fill="url(#v' + id + ')" opacity=".5"/>';
    });
    return svg(s, rm.defs);
  }

  function tins(o) {
    const id = ++uid, c = o.col || '#d9a441';
    const rm = room(id, o.w || ['#efe4cd', '#ddcba8'], ['#cdb083', '#a98a5e'], 380);
    let s = rm.body + '<ellipse cx="205" cy="392" rx="150" ry="12" fill="#2a1d10" opacity=".25" filter="url(#soft)"/>';
    [[120, 400, 108, 140], [250, 400, 92, 108]].forEach((t, i) => {
      const [cx, y, w, h] = t, g = 'tg' + id + i;
      s += '<defs><linearGradient id="' + g + '" x1="0" x2="1"><stop offset="0" stop-color="#d9d6cf"/><stop offset=".4" stop-color="#f3f1ea"/><stop offset="1" stop-color="#a9a69c"/></linearGradient></defs>';
      s += '<rect x="' + (cx - w / 2) + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" rx="5" fill="url(#' + g + ')"/><rect x="' + (cx - w / 2) + '" y="' + (y - h * .62) + '" width="' + w + '" height="' + h * .34 + '" fill="' + c + '"/><ellipse cx="' + cx + '" cy="' + (y - h) + '" rx="' + w / 2 + '" ry="6" fill="#c8c5bc"/><ellipse cx="' + cx + '" cy="' + (y - h - 1) + '" rx="' + w / 2 * .84 + '" ry="4" fill="' + c + '"/>';
    });
    return svg(s, rm.defs);
  }

  function plaster(o) {
    const r = R(o.s || 4), id = ++uid, c = o.col || '#d9c3a0';
    const defs = '<linearGradient id="p' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + light(c, .25) + '"/><stop offset="1" stop-color="' + dark(c, .18) + '"/></linearGradient>';
    let s = '<rect width="400" height="500" fill="url(#p' + id + ')"/><g filter="url(#soft2)">';
    for (let i = 0; i < 16; i++) {
      s += '<path d="M' + (r() * 400 - 40) + ' ' + (r() * 500) + ' q' + (60 + r() * 80) + ' ' + (r() * 60 - 30) + ' ' + (110 + r() * 100) + ' ' + (r() * 40 - 20) + ' q-30 ' + (30 + r() * 30) + ' -' + (120 + r() * 60) + ' ' + (r() * 20) + 'z" fill="' + (r() > .5 ? light(c, .45) : dark(c, .28)) + '" opacity="' + (.2 + r() * .3).toFixed(2) + '"/>';
    }
    s += '</g>';
    return svg(s, defs);
  }

  function tile(o) {
    const r = R(o.s || 6), id = ++uid, base = o.col || '#4f7a6a';
    let s = '<rect width="400" height="500" fill="' + dark(base, .4) + '"/>';
    if (o.hex) {
      const w = 68, h = 59;
      for (let row = -1; row < 9; row++) for (let col = -1; col < 7; col++) {
        const x = col * w + (row % 2 ? w / 2 : 0), y = row * h * .76 + 20, c = pick(r, [base, light(base, .12), dark(base, .14)]);
        s += '<path d="M' + x + ' ' + (y - 34) + 'l30 17v34l-30 17l-30-17v-34z" fill="' + c + '" stroke="' + dark(base, .5) + '" stroke-width="2.4"/>';
      }
    } else {
      for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
        const x = col * 82 - 6, y = row * 82 - 6, c = pick(r, [base, light(base, .15), dark(base, .1), light(base, .3)]);
        s += '<rect x="' + x + '" y="' + y + '" width="78" height="78" fill="' + c + '"/><path d="M' + x + ' ' + y + 'l78 0l-78 78z" fill="#fff" opacity="' + (.06 + r() * .1).toFixed(2) + '"/>';
      }
    }
    return svg(s, '');
  }

  function micro(o) {
    const r = R(o.s || 8), c = o.col || '#b9b2a4';
    let s = '<rect width="400" height="500" fill="' + c + '"/><g filter="url(#soft2)">';
    for (let i = 0; i < 12; i++) s += '<ellipse cx="' + r() * 400 + '" cy="' + r() * 500 + '" rx="' + (80 + r() * 90) + '" ry="' + (50 + r() * 70) + '" fill="' + (r() > .5 ? light(c, .35) : dark(c, .25)) + '" opacity="' + (.25 + r() * .25).toFixed(2) + '"/>';
    return svg(s + '</g>', '');
  }

  function tools(o) {
    const id = ++uid, rm = room(id, o.w || ['#d9c7a3', '#c2ab82'], ['#b99d70', '#9a7e55'], 40);
    let s = '<rect width="400" height="500" fill="#d3c0a0"/>';
    s += '<g transform="rotate(-24 200 250)"><rect x="150" y="60" width="100" height="150" rx="3" fill="#c5c9c6"/><rect x="150" y="60" width="100" height="150" rx="3" fill="#fff" opacity=".18"/><rect x="190" y="210" width="20" height="40" fill="#8a8f8c"/><rect x="184" y="250" width="32" height="170" rx="14" fill="#8a5a36"/><rect x="190" y="250" width="8" height="170" rx="4" fill="#b17b50" opacity=".6"/></g>';
    s += '<g transform="rotate(32 270 360)"><rect x="248" y="300" width="44" height="64" rx="4" fill="#d8c79a"/>' + Array.from({ length: 9 }, (_, i) => '<line x1="' + (252 + i * 4.5) + '" y1="300" x2="' + (252 + i * 4.5) + '" y2="364" stroke="#a89468" stroke-width="1.4"/>').join('') + '<rect x="252" y="364" width="36" height="14" fill="#9a9488"/><rect x="258" y="378" width="24" height="90" rx="11" fill="#3e4a2b"/></g>';
    s += '<ellipse cx="120" cy="420" rx="62" ry="40" fill="#2a1d10" opacity=".22" filter="url(#soft)"/><ellipse cx="116" cy="410" rx="56" ry="34" fill="#a9a8a1"/><ellipse cx="116" cy="404" rx="48" ry="26" fill="#d9a441"/>';
    return svg(s, rm.defs);
  }

  function interior(o) {
    const r = R(o.s || 12), id = ++uid;
    const rm = room(id, o.w || ['#eadfc7', '#d4bd94'], ['#bfa27a', '#9d805a'], 400);
    let s = rm.body;
    s += arch(70, 40, 260, 360, dark(o.w ? o.w[1] : '#d4bd94', .16), 'opacity=".55"');
    s += arch(86, 58, 228, 342, light(o.w ? o.w[0] : '#eadfc7', .2));
    s += '<g filter="url(#soft2)" opacity=".5"><path d="M110 120 L300 90 L300 400 L110 400Z" fill="#fff3d0" opacity=".4"/></g>';
    s += '<rect x="40" y="396" width="320" height="22" fill="#cbb48a"/><rect x="40" y="396" width="320" height="4" fill="#fff" opacity=".35"/>';
    s += '<ellipse cx="205" cy="398" rx="62" ry="7" fill="#2a1d10" opacity=".28" filter="url(#soft)"/>';
    s += '<path d="M170 398 C150 330 160 300 198 296 C240 300 250 330 232 398z" fill="#b4562f"/><path d="M180 398 C165 335 172 310 198 306 C196 340 196 370 200 398z" fill="#fff" opacity=".12"/>';
    s += '<g fill="none" stroke="#5a4632" stroke-width="2.4" stroke-linecap="round">';
    for (let i = 0; i < 5; i++) { const x = 190 + i * 7, tx = 130 + i * 40 + r() * 20; s += '<path d="M' + x + ' 300 Q' + (x + (tx - x) / 2) + ' 200 ' + tx + ' ' + (110 + r() * 40) + '"/>'; }
    s += '</g>' + leafCloud(r, 205, 150, 100, 52, 60, ['#8c9b6c', '#a7b28c', '#6f8052'], 12, 3.4);
    return svg(s, rm.defs);
  }

  function workshop(o) {
    const r = R(o.s || 14), id = ++uid;
    let s = '<rect width="400" height="500" fill="#d5bd97"/><g opacity=".25">' + Array.from({ length: 14 }, (_, i) => '<rect x="0" y="' + (i * 38) + '" width="400" height="2" fill="#8a6a42"/>').join('') + '</g>';
    const pts = [[110, 140, 78, '#b4562f'], [250, 120, 52, '#c9b79a'], [300, 270, 70, '#6d7a4a']];
    pts.forEach((p) => { s += '<circle cx="' + (p[0] + 8) + '" cy="' + (p[1] + 10) + '" r="' + p[2] + '" fill="#2a1d10" opacity=".22" filter="url(#soft)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + p[3] + '"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] * .72 + '" fill="' + dark(p[3], .5) + '"/>'; });
    s += leafCloud(r, 110, 140, 50, 40, 36, ['#6f8052', '#8c9b6c', '#a7b28c'], 12, 3.4);
    ['#e9dcc0', '#d9a441', '#8d9a6a', '#b4562f'].forEach((c, i) => { s += '<rect x="' + (50 + i * 62) + '" y="' + (330 + i % 2 * 14) + '" width="54" height="74" fill="' + c + '" transform="rotate(' + (i * 4 - 6) + ' ' + (77 + i * 62) + ' 370)"/>'; });
    s += '<g transform="rotate(-18 200 450)"><rect x="150" y="430" width="90" height="34" rx="3" fill="#c5c9c6"/><rect x="236" y="440" width="86" height="14" rx="7" fill="#8a5a36"/></g>';
    return svg(s, '');
  }


  /* WIDE SCENES (1600 x 900) for full-width heroes */
  const OL = ['#8c9b6c', '#a7b28c', '#6f8052', '#c3cbab', '#7d8e5e'];
  function blotch(r, n, W, H, c, a) {
    let s = '<g filter="url(#soft2)">';
    for (let i = 0; i < n; i++) s += '<ellipse cx="' + (r() * W).toFixed(0) + '" cy="' + (r() * H).toFixed(0) + '" rx="' + (90 + r() * 200).toFixed(0) + '" ry="' + (60 + r() * 140).toFixed(0) + '" fill="' + (r() > .5 ? light(c, .4) : dark(c, .22)) + '" opacity="' + (a * (.5 + r() * .5)).toFixed(2) + '"/>';
    return s + '</g>';
  }
  function slabs(r, y0, H, W, base) {
    let s = '', y = y0, row = 0;
    while (y < H) {
      const h = 34 + row * 16; let x = -r() * 120;
      while (x < W) { const w = 120 + r() * 160; s += '<rect x="' + x.toFixed(0) + '" y="' + y + '" width="' + (w - 6).toFixed(0) + '" height="' + (h - 5) + '" fill="' + pick(r, [base, light(base, .12), dark(base, .1), light(base, .22)]) + '"/>'; x += w; }
      y += h; row++;
    }
    return '<rect y="' + y0 + '" width="' + W + '" height="' + (H - y0) + '" fill="' + dark(base, .35) + '"/>' + s;
  }
  function courtyard(o) {
    const r = R(o.s || 41), id = ++uid, W = 1600, H = 900, fy = 735;
    const defs = '<linearGradient id="cw' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0e2c9"/><stop offset="1" stop-color="#d7bd94"/></linearGradient>' +
      '<linearGradient id="cv' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#2a1d10" stop-opacity="0"/><stop offset="1" stop-color="#2a1d10" stop-opacity=".35"/></linearGradient>';
    let s = '<rect width="' + W + '" height="' + H + '" fill="url(#cw' + id + ')"/>' + blotch(r, 22, W, fy, '#e3cfac', .5);
    s += '<rect x="60" y="0" width="130" height="' + fy + '" fill="#cbb08a"/><rect x="60" y="0" width="34" height="' + fy + '" fill="#fff3d8" opacity=".35"/><rect x="48" y="0" width="154" height="40" fill="#bea47c"/>';
    s += arch(450, 250, 260, fy - 250, '#c4a678') + arch(470, 270, 220, fy - 270, '#6f7a5a');
    for (let i = 0; i < 3; i++) s += '<rect x="' + (486 + i * 64) + '" y="420" width="56" height="70" fill="#3f4a33" opacity=".45"/><rect x="' + (486 + i * 64) + '" y="505" width="56" height="70" fill="#3f4a33" opacity=".45"/>';
    s += '<line x1="580" y1="300" x2="580" y2="' + fy + '" stroke="#4f5a3e" stroke-width="4"/>';
    s += arch(1290, 300, 220, fy - 300, '#bfa077') + arch(1306, 316, 188, fy - 316, '#5b4a36', 'opacity=".75"');
    s += '<g filter="url(#soft2)" opacity=".6"><path d="M0 -40 L700 -40 L1150 ' + fy + ' L420 ' + fy + 'Z" fill="#fff3d0" opacity=".45"/></g>';
    s += slabs(r, fy, H, W, '#cdbb9a');
    const a = potSvg(id, 820, 790, 120, 170, '#b8693c', 'round'), b = potSvg(id, 1470, 820, 150, 200, '#94573a', 'round'), c = potSvg(id, 1080, 840, 250, 160, '#b4562f', 'round'), d = potSvg(id, 330, 815, 110, 120, '#a65a36', 'bowl');
    s += a.body + d.body;
    for (let i = 0; i < 14; i++) { const ang = (-75 + i * 11) * Math.PI / 180, L = 70 + r() * 30; s += '<path d="M330 690 L' + (330 + Math.sin(ang) * L).toFixed(0) + ' ' + (690 - Math.cos(ang) * L).toFixed(0) + '" stroke="' + pick(r, ['#7e9a86', '#6f8c78', '#8fa896']) + '" stroke-width="5" stroke-linecap="round"/>'; }
    s += c.body + trunk(r, 1080, 680, 300, 170, 30) + leafCloud(r, 1060, 300, 360, 200, 1300, OL, 17, 4.6) + b.body;
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#cv' + id + ')"/>';
    return svg(s, defs + a.defs + b.defs + c.defs + d.defs, W, H);
  }
  function grove(o) {
    const r = R(o.s || 17), id = ++uid, W = 1600, H = 900, gy = 640;
    const defs = '<linearGradient id="sk' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e3d6"/><stop offset="1" stop-color="#f4e2bd"/></linearGradient>' +
      '<linearGradient id="gr' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c5a0"/><stop offset="1" stop-color="#b79c74"/></linearGradient>';
    let s = '<rect width="' + W + '" height="' + H + '" fill="url(#sk' + id + ')"/>';
    s += '<path d="M0 520 C220 470 420 500 640 470 C900 430 1100 490 1350 450 C1480 430 1560 445 1600 440 V' + gy + ' H0Z" fill="#c2bd98" opacity=".7"/>';
    s += '<path d="M0 580 C300 540 520 575 800 545 C1080 515 1300 560 1600 530 V' + gy + ' H0Z" fill="#a3a37b" opacity=".75"/>';
    for (let i = 0; i < 9; i++) { const x = 60 + i * 175 + r() * 40; s += leafCloud(r, x, 560 - r() * 20, 46, 30, 40, ['#8a9468', '#7a8a5c', '#9aa47a'], 10, 3); }
    s += '<rect y="' + gy + '" width="' + W + '" height="' + (H - gy) + '" fill="url(#gr' + id + ')"/>';
    for (let i = 0; i < 380; i++) s += '<circle cx="' + (r() * W).toFixed(0) + '" cy="' + (gy + r() * (H - gy)).toFixed(0) + '" r="' + (1 + r() * 2.4).toFixed(1) + '" fill="' + pick(r, ['#a58a62', '#e8d8b8', '#8f7552']) + '" opacity=".55"/>';
    const P = [];
    const tree = (cx, base, sc, kind, col) => {
      const p = potSvg(id, cx, base, 150 * sc, 130 * sc, col, 'round'); P.push(p.defs);
      let t = '<ellipse cx="' + (cx + 40 * sc) + '" cy="' + (base + 4) + '" rx="' + (170 * sc) + '" ry="' + (16 * sc) + '" fill="#2a1d10" opacity=".22" filter="url(#soft)"/>' + p.body;
      const top = base - 130 * sc;
      if (kind === 'olive') t += trunk(r, cx, top, 230 * sc, 110 * sc, 20 * sc) + leafCloud(r, cx, top - 300 * sc, 230 * sc, 150 * sc, Math.round(620 * sc), OL, 20 * sc, 5.4 * sc);
      else t += trunk(r, cx, top, 120 * sc, 40 * sc, 14 * sc) + leafCloud(r, cx, top - 200 * sc, 170 * sc, 140 * sc, Math.round(420 * sc), ['#4f6a2e', '#5f7c37', '#3f5a26', '#6e8b40'], 17 * sc, 8 * sc, { n: Math.round(26 * sc), r: 12 * sc, cols: ['#e8a02c', '#f1c13e', '#e58a24'] });
      return t;
    };
    s += tree(1440, 700, .62, 'olive', '#a65a36') + tree(1240, 730, .78, 'citrus', '#b4562f') + tree(870, 820, 1.08, 'olive', '#b4562f') + tree(1130, 860, .82, 'citrus', '#9a4a2a');
    return svg(s, defs + P.join(''), W, H);
  }
  function plasterroom(o) {
    const r = R(o.s || 23), id = ++uid, W = 1600, H = 900, fy = 720, c = '#ddcbae';
    const defs = '<linearGradient id="pw' + id + '" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#ebdec8"/><stop offset="1" stop-color="#d2bd9a"/></linearGradient>' +
      '<linearGradient id="pf' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3b9a9"/><stop offset="1" stop-color="#9e9383"/></linearGradient>' +
      '<linearGradient id="pl' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e3c4"/></linearGradient>';
    let s = '<rect width="' + W + '" height="' + H + '" fill="url(#pw' + id + ')"/>' + blotch(r, 30, W, fy, c, .55);
    s += arch(150, 120, 330, fy - 120, dark(c, .14)) + arch(168, 138, 294, fy - 138, 'url(#pl' + id + ')');
    s += '<line x1="315" y1="140" x2="315" y2="' + fy + '" stroke="#b9a582" stroke-width="3" opacity=".6"/><line x1="168" y1="420" x2="462" y2="420" stroke="#b9a582" stroke-width="3" opacity=".6"/>';
    s += arch(590, 200, 300, fy - 200, dark(c, .1)) + arch(606, 216, 268, fy - 216, dark(c, .2));
    s += '<rect x="606" y="560" width="268" height="18" fill="' + light(c, .25) + '"/><ellipse cx="740" cy="560" rx="40" ry="6" fill="#2a1d10" opacity=".25" filter="url(#soft)"/>';
    s += '<path d="M712 560 C700 500 708 470 740 466 C772 470 780 500 768 560z" fill="#a8512c"/><path d="M724 560 C714 505 720 480 740 476 C738 510 736 540 740 560z" fill="#fff" opacity=".14"/>';
    s += '<g fill="none" stroke="#5a4632" stroke-width="3" stroke-linecap="round">';
    for (let i = 0; i < 4; i++) { const tx = 650 + i * 60 + r() * 20; s += '<path d="M' + (734 + i * 4) + ' 470 Q' + ((734 + tx) / 2) + ' 380 ' + tx + ' ' + (290 + r() * 50) + '"/>'; }
    s += '</g>' + leafCloud(r, 740, 330, 120, 60, 70, OL, 14, 4);
    s += '<g filter="url(#soft2)" opacity=".75"><path d="M168 300 L462 300 L780 ' + fy + ' L330 ' + fy + 'Z" fill="#fff6e0" opacity=".5"/><path d="M330 ' + fy + ' L780 ' + fy + ' L1100 ' + H + ' L420 ' + H + 'Z" fill="#fff6e0" opacity=".45"/></g>';
    s += '<rect y="' + fy + '" width="' + W + '" height="' + (H - fy) + '" fill="url(#pf' + id + ')"/>' + blotch(r, 10, W, H - fy, '#b3a998', .35).replace('<g ', '<g transform="translate(0 ' + fy + ')" ');
    s += '<rect x="120" y="' + (fy - 70) + '" width="780" height="70" fill="#d9c9a8"/><rect x="120" y="' + (fy - 70) + '" width="780" height="8" fill="#fff" opacity=".35"/><rect x="120" y="' + fy + '" width="780" height="10" fill="#2a1d10" opacity=".18"/>';
    s += '<rect y="' + (fy - 3) + '" width="' + W + '" height="5" fill="#3a2a14" opacity=".1"/>';
    return svg(s, defs, W, H);
  }
  function worktable(o) {
    const r = R(o.s || 29), W = 1600, H = 900;
    let s = '<rect width="' + W + '" height="' + H + '" fill="#cdb28a"/>';
    for (let i = 0; i < 9; i++) s += '<rect x="0" y="' + (i * 100) + '" width="' + W + '" height="3" fill="#7d5f3c" opacity=".35"/>';
    for (let i = 0; i < 70; i++) { const y = r() * H; s += '<path d="M0 ' + y.toFixed(0) + ' Q800 ' + (y + r() * 30 - 15).toFixed(0) + ' 1600 ' + (y + r() * 20 - 10).toFixed(0) + '" stroke="#8a6a42" stroke-width="1" fill="none" opacity=".18"/>'; }
    const sh = (x, y, w, h, extra) => '<rect x="' + (x + 10) + '" y="' + (y + 14) + '" width="' + w + '" height="' + h + '" fill="#2a1d10" opacity=".22" filter="url(#soft)" ' + (extra || '') + '/>';
    [['#ddc8a6', 860, 120, -4], ['#b9a98f', 1120, 170, 5], ['#c9a184', 980, 420, -8]].forEach((b, i) => {
      s += '<g transform="rotate(' + b[3] + ' ' + (b[1] + 110) + ' ' + (b[2] + 110) + ')">' + sh(b[1], b[2], 220, 220) + '<rect x="' + b[1] + '" y="' + b[2] + '" width="220" height="220" fill="' + b[0] + '"/>' + blotch(R(i + 3), 6, 220, 220, b[0], .6).replace('<g ', '<g transform="translate(' + b[1] + ' ' + b[2] + ')" ') + '</g>';
    });
    ['#e9dcc0', '#d9a441', '#8d9a6a', '#b4562f', '#c9b79a', '#6b4f3a'].forEach((c, i) => { s += '<g transform="rotate(' + (-30 + i * 9) + ' 1400 760)">' + sh(1360, 560, 80, 200) + '<rect x="1360" y="560" width="80" height="200" fill="' + c + '"/><rect x="1360" y="730" width="80" height="30" fill="#fbf6ea"/></g>'; });
    [[1420, 230, 92, '#b4562f'], [760, 640, 70, '#c9b79a'], [1260, 560, 56, '#6d7a4a']].forEach((p) => { s += '<circle cx="' + (p[0] + 12) + '" cy="' + (p[1] + 14) + '" r="' + p[2] + '" fill="#2a1d10" opacity=".22" filter="url(#soft)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + p[3] + '"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] * .74) + '" fill="' + dark(p[3], .5) + '"/>'; });
    s += leafCloud(r, 1420, 230, 70, 60, 70, OL, 14, 4) + leafCloud(r, 1260, 560, 40, 36, 30, ['#4f6a2e', '#5f7c37'], 12, 6);
    s += '<g stroke="#5a4632" stroke-width="3" fill="none" stroke-linecap="round"><path d="M640 300 Q720 340 820 330"/><path d="M620 380 Q700 400 790 420"/></g>' + leafCloud(r, 740, 340, 90, 40, 60, OL, 14, 4);
    s += '<g transform="rotate(-20 1180 790)">' + sh(1080, 760, 170, 56) + '<rect x="1080" y="760" width="170" height="56" rx="4" fill="#c5c9c6"/><rect x="1080" y="760" width="170" height="56" rx="4" fill="#fff" opacity=".2"/><rect x="1250" y="776" width="150" height="24" rx="12" fill="#8a5a36"/></g>';
    s += '<circle cx="1000" cy="250" r="66" fill="#2a1d10" opacity=".2" filter="url(#soft)"/><circle cx="992" cy="240" r="62" fill="#efe7d6"/><circle cx="992" cy="240" r="48" fill="#d9a441"/>';
    s += '<rect width="' + W + '" height="' + H + '" fill="#2a1d10" opacity=".06"/>';
    return svg(s, '', W, H);
  }

  function loggia(o) {
    const r = R(o.s || 53), id = ++uid, W = 1600, H = 900, fy = 720;
    const defs = '<linearGradient id="lw' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2d0b0"/><stop offset="1" stop-color="#c7ab80"/></linearGradient>' +
      '<linearGradient id="ls' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ead9"/><stop offset=".7" stop-color="#f3e3bf"/></linearGradient>';
    let s = '<rect width="' + W + '" height="' + H + '" fill="url(#lw' + id + ')"/>' + blotch(r, 18, W, fy, '#d8c19c', .45);
    const xs = [110, 600, 1090], aw = 400, top = 150;
    xs.forEach((x, i) => {
      s += '<clipPath id="lc' + id + i + '">' + arch(x, top, aw, fy - top, '#000').replace('/>', '/>') + '</clipPath>';
      s += '<g clip-path="url(#lc' + id + i + ')"><rect x="' + x + '" y="' + top + '" width="' + aw + '" height="' + (fy - top) + '" fill="url(#ls' + id + ')"/>' +
        '<path d="M' + x + ' 560 C' + (x + 120) + ' 520 ' + (x + 260) + ' 545 ' + (x + aw) + ' 515 V' + fy + ' H' + x + 'Z" fill="#a9a67f" opacity=".8"/>' +
        '<rect x="' + x + '" y="610" width="' + aw + '" height="' + (fy - 610) + '" fill="#cdb58b"/>' +
        trunk(r, x + 200 + (i - 1) * 40, 640, 150, 70, 14) + leafCloud(r, x + 200 + (i - 1) * 40, 430, 150, 100, 300, OL, 14, 4) + '</g>';
      s += '<rect x="' + (x - 34) + '" y="' + (top + aw / 2) + '" width="34" height="' + (fy - top - aw / 2) + '" fill="#bfa277"/>';
    });
    s += '<rect x="1490" y="' + (top + aw / 2) + '" width="110" height="' + (fy - top - aw / 2) + '" fill="#bfa277"/>';
    s += '<g filter="url(#soft2)" opacity=".55">' + xs.map((x) => '<path d="M' + (x + 30) + ' ' + fy + ' L' + (x + aw - 30) + ' ' + fy + ' L' + (x + aw + 140) + ' ' + H + ' L' + (x + 120) + ' ' + H + 'Z" fill="#fff4d6"/>').join('') + '</g>';
    s += slabs(r, fy, H, W, '#cfbd9b');
    const pa = potSvg(id, 1500, 860, 150, 150, '#a65a36', 'round');
    s += pa.body + leafCloud(r, 1500, 640, 90, 80, 120, ['#4f6a2e', '#5f7c37', '#6e8b40'], 12, 6, { n: 10, r: 9, cols: ['#e8a02c', '#f1c13e'] });
    return svg(s, defs + pa.defs, W, H);
  }
  function showroomwide(o) {
    const r = R(o.s || 61), id = ++uid, W = 1600, H = 900, fy = 700;
    const defs = '<linearGradient id="sw' + id + '" x1="0" y1="0" x2="1" y2=".5"><stop offset="0" stop-color="#ece0c9"/><stop offset="1" stop-color="#d6c09b"/></linearGradient>' +
      '<linearGradient id="sf' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2b8a7"/><stop offset="1" stop-color="#9c917f"/></linearGradient>';
    let s = '<rect width="' + W + '" height="' + H + '" fill="url(#sw' + id + ')"/>' + blotch(r, 22, W, fy, '#e0cfb0', .45);
    const cols = ['#e9dcc0', '#d9a441', '#8d9a6a', '#b4562f', '#c9b79a', '#6b4f3a', '#4f7a6a', '#d8c19c', '#b9a98f', '#efe6d4', '#9aa27a', '#8f5a3c'];
    for (let row = 0; row < 3; row++) for (let c = 0; c < 6; c++) {
      const x = 90 + c * 104, y = 150 + row * 140;
      s += '<rect x="' + (x + 5) + '" y="' + (y + 8) + '" width="86" height="118" fill="#2a1d10" opacity=".16" filter="url(#soft)"/><rect x="' + x + '" y="' + y + '" width="86" height="118" fill="' + cols[(row * 6 + c) % cols.length] + '"/>';
    }
    s += '<rect x="70" y="138" width="660" height="4" fill="#9b8461" opacity=".5"/>';
    s += '<g filter="url(#soft2)" opacity=".5"><path d="M760 0 L1100 0 L1300 ' + fy + ' L880 ' + fy + 'Z" fill="#fff4d6"/></g>';
    s += '<rect y="' + fy + '" width="' + W + '" height="' + (H - fy) + '" fill="url(#sf' + id + ')"/>';
    s += '<rect x="520" y="610" width="620" height="26" fill="#a8865c"/><rect x="560" y="636" width="16" height="140" fill="#7d6243"/><rect x="1084" y="636" width="16" height="140" fill="#7d6243"/>';
    [['#d9a441', 600], ['#8d9a6a', 680], ['#b4562f', 760], ['#efe6d4', 900]].forEach((c) => { s += '<rect x="' + c[1] + '" y="592" width="60" height="18" fill="' + c[0] + '" transform="rotate(' + (r() * 10 - 5).toFixed(1) + ' ' + c[1] + ' 600)"/>'; });
    const p1 = potSvg(id, 1300, 820, 210, 170, '#b4562f', 'round'), p2 = potSvg(id, 1500, 800, 120, 150, '#c9b79a', 'cyl');
    s += p1.body + trunk(r, 1300, 650, 280, 130, 24) + leafCloud(r, 1290, 300, 250, 170, 800, OL, 15, 4.2) + p2.body;
    for (let i = 0; i < 7; i++) s += '<ellipse cx="' + (1500 + (r() * 6 - 3)) + '" cy="' + (380 + i * 40) + '" rx="' + (16 + Math.sin(i / 6 * 3.1) * 34) + '" ry="70" fill="' + pick(r, ['#2f4a2b', '#38552f', '#27401f']) + '"/>';
    return svg(s, defs + p1.defs + p2.defs, W, H);
  }

  const K = { olive: (o) => tree(o, 'olive'), citrus: (o) => tree(o, 'citrus'), fig: (o) => tree(o, 'fig'), cypress: (o) => tree(o, 'cypress'), agave, lavender: (o) => herb(o, 'lavender'), rosemary: (o) => herb(o, 'rosemary'), pot: potOnly, combo, swatch, tins, plaster, tile, micro, tools, interior, workshop, courtyard, grove, plasterroom, worktable, loggia, showroomwide };

  window.DV_ART = function (spec) { return (K[spec.k] || K.plaster)(spec); };
})();
