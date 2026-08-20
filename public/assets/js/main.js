(() => {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-toggle');
  const lang = document.querySelector('.lang');
  const langToggle = document.querySelector('.lang-toggle');
  const intro = document.querySelector('.intro');

  if (intro) {
    const seen = sessionStorage.getItem('dealIntro');
    if (seen) intro.remove();
    else {
      sessionStorage.setItem('dealIntro', '1');
      setTimeout(() => intro.classList.add('is-done'), 1250);
      setTimeout(() => intro.remove(), 1950);
    }
  }

  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  menuBtn?.addEventListener('click', () => body.classList.toggle('menu-open'));
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => body.classList.remove('menu-open')));

  langToggle?.addEventListener('click', (e) => { e.stopPropagation(); lang.classList.toggle('open'); });
  document.addEventListener('click', () => lang?.classList.remove('open'));

  // Keep visitors on the same page when switching languages (all localized routes share the same slug structure).
  const currentParts = location.pathname.split('/').filter(Boolean);
  if (currentParts.length && ['hr','en','de','nl'].includes(currentParts[0])) {
    document.querySelectorAll('.lang-menu a').forEach(a => {
      const target = a.getAttribute('href').split('/').filter(Boolean)[0];
      a.setAttribute('href', '/' + [target, ...currentParts.slice(1)].join('/') + (location.pathname.endsWith('/') ? '/' : ''));
    });
  }

  const params = new URLSearchParams(location.search);
  const requestedService = params.get('service');
  if (requestedService) {
    const sel = document.querySelector('select[name="service"]');
    if (sel && [...sel.options].some(o => o.value === requestedService)) sel.value = requestedService;
  }

  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

  // Gentle cursor-aware movement on large service cards, disabled on touch devices.
  if (matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--mx', x.toFixed(3));
        card.style.setProperty('--my', y.toFixed(3));
      });
      card.addEventListener('mouseleave', () => { card.style.removeProperty('--mx'); card.style.removeProperty('--my'); });
    });
  }

  // Forms: save enquiry through Pages Function. If unavailable, offer direct contact methods instead of silently failing.
  document.querySelectorAll('[data-enquiry-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true; btn.textContent = '…';
      status.className = 'form-status'; status.textContent = '';
      const payload = Object.fromEntries(new FormData(form));
      payload.page = location.href;
      try {
        const res = await fetch('/api/inquiry', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'send_failed');
        status.classList.add('ok');
        status.textContent = form.dataset.success || 'Hvala. Vaš upit je zaprimljen.';
        form.reset();
      } catch (err) {
        status.classList.add('err');
        status.textContent = form.dataset.error || 'Upit trenutačno nije moguće poslati. Nazovite nas ili pošaljite WhatsApp poruku.';
      } finally { btn.disabled = false; btn.textContent = original; }
    });
  });

  // Cookie consent. Analytics is only loaded after explicit consent and only when an ID is configured.
  const cookie = document.querySelector('.cookie-banner');
  const stored = localStorage.getItem('deal-cookie-consent');
  if (cookie && !stored) setTimeout(() => cookie.classList.add('show'), 900);
  const setConsent = value => {
    localStorage.setItem('deal-cookie-consent', value);
    cookie?.classList.remove('show');
    if (value === 'all') loadAnalytics();
  };
  document.querySelector('[data-cookie-all]')?.addEventListener('click', () => setConsent('all'));
  document.querySelector('[data-cookie-necessary]')?.addEventListener('click', () => setConsent('necessary'));
  if (stored === 'all') loadAnalytics();

  function loadAnalytics() {
    const id = document.documentElement.dataset.analytics;
    if (!id || window.__dealAnalytics) return;
    window.__dealAnalytics = true;
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments)}
    gtag('js', new Date()); gtag('config', id, { anonymize_ip: true });
  }
})();
