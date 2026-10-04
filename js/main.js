(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Barra de progreso + menú sólido + enlace activo ----
  const bar = document.getElementById('progress-bar');
  const nav = document.getElementById('nav');
  const links = [...document.querySelectorAll('.nav__links a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    nav.classList.toggle('is-solid', h.scrollTop > 40);

    let current = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.35) current = i; });
    links.forEach((a, i) => a.classList.toggle('is-active', i === current));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Menú móvil ----
  const toggle = document.getElementById('nav-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  links.forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // ---- Aparición al hacer scroll ----
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // ---- Tarjetas que se voltean ----
  document.querySelectorAll('.flip').forEach(card => {
    card.addEventListener('click', () => {
      card.setAttribute('aria-pressed', card.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  // ---- Infografía interactiva ----
  const recursos = {
    texto: {
      t: 'Texto',
      d: 'Sirve de base conceptual o de narrativa complementaria: titulares, subtítulos, guiones y explicaciones que dan sentido al resto de recursos.',
      e: ['Guion', 'Subtítulos', 'Hipertexto']
    },
    audio: {
      t: 'Audio y paisajes sonoros',
      d: 'Música de fondo, efectos especiales, efectos de sonido y voz en off. La voz del narrador aporta emoción y cercanía al relato.',
      e: ['Voz en off', 'Música', 'Podcast', 'Efectos']
    },
    imagen: {
      t: 'Imagen y video',
      d: 'Fotografías, animaciones, videos e ilustraciones que muestran lo que las palabras solo describen y sostienen la atención del público.',
      e: ['Fotografía', 'Animación', 'Video', 'Ilustración', 'GIF']
    },
    interactivo: {
      t: 'Interactividad e hipervínculos',
      d: 'Botones, mapas conceptuales, rutas de decisión e infografías interactivas —como esta— que permiten al usuario elegir su propio camino.',
      e: ['Botones', 'Mapas conceptuales', 'Rutas de decisión', 'Infografías']
    }
  };
  const panel = document.getElementById('res-panel');
  const title = document.getElementById('res-title');
  const desc = document.getElementById('res-desc');
  const ej = document.getElementById('res-ej');
  const nodes = [...document.querySelectorAll('.info__node')];

  function selectNode(node) {
    const r = recursos[node.dataset.res];
    nodes.forEach(n => n.setAttribute('aria-selected', String(n === node)));
    title.textContent = r.t;
    desc.textContent = r.d;
    ej.innerHTML = '';
    r.e.forEach(x => { const li = document.createElement('li'); li.textContent = x; ej.appendChild(li); });
    panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
  }
  nodes.forEach((n, i) => {
    n.addEventListener('click', () => selectNode(n));
    n.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); const nx = nodes[(i + 1) % nodes.length]; nx.focus(); selectNode(nx); }
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); const pv = nodes[(i - 1 + nodes.length) % nodes.length]; pv.focus(); selectNode(pv); }
    });
  });

  // ---- Balanza de ventajas / desventajas ----
  const beam = document.getElementById('scale-beam');
  const pans = beam.querySelectorAll('.scale__pan');
  const readout = document.getElementById('scale-readout');
  const args = [...document.querySelectorAll('.arg')];

  function updateScale() {
    const pro = args.filter(a => a.dataset.side === 'pro' && a.open).length;
    const con = args.filter(a => a.dataset.side === 'con' && a.open).length;
    const angle = Math.max(-16, Math.min(16, (con - pro) * 4)); // izquierda = ventajas
    beam.style.transform = `rotate(${angle}deg)`;
    pans[0].style.transform = `rotate(${-angle}deg)`;
    pans[0].style.transformOrigin = '60px 30px';
    pans[1].style.transform = `rotate(${-angle}deg)`;
    pans[1].style.transformOrigin = '340px 30px';

    if (pro === 0 && con === 0) readout.textContent = 'Abre los argumentos y observa cómo se inclina la balanza.';
    else if (pro === con) readout.textContent = `Equilibrio: ${pro} ventaja(s) y ${con} desventaja(s). Ambas narrativas se complementan.`;
    else if (pro > con) readout.textContent = `La balanza se inclina hacia las ventajas (${pro} vs. ${con}).`;
    else readout.textContent = `La balanza se inclina hacia las desventajas (${con} vs. ${pro}).`;
  }
  args.forEach(a => a.addEventListener('toggle', updateScale));

  // ---- Red de nodos animada en la portada ----
  const canvas = document.getElementById('hero-net');
  const ctx = canvas.getContext('2d');
  let pts = [], w = 0, h = 0, raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, (w * h) / 18000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      y2: Math.random() < 0.15
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 130) {
          ctx.strokeStyle = `rgba(150, 180, 255, ${0.22 * (1 - d / 130)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.fillStyle = p.y2 ? 'rgba(245, 196, 0, .9)' : 'rgba(190, 210, 255, .7)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.y2 ? 2.6 : 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  function step() {
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    });
    draw();
    raf = requestAnimationFrame(step);
  }
  resize();
  if (reduceMotion) draw(); else step();
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); if (reduceMotion) draw(); else step(); });
})();
