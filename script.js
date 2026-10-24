(() => {
  'use strict';

  const NB = ' ';
  const SVCS = [
    { id: 'coupe', cat: 'cheveux', name: 'Coupe homme', desc: 'Shampoing, coupe ciseaux ou tondeuse, coiffage', dur: 30, price: 15 },
    { id: 'degrade', cat: 'cheveux', name: 'Dégradé', desc: 'Américain, taper ou skin fade, finitions au rasoir', dur: 40, price: 18 },
    { id: 'cb', cat: 'formule', name: 'Coupe + barbe', desc: 'La coupe complète et la barbe taillée à la lame', dur: 50, price: 25, tag: 'Le plus demandé' },
    { id: 'barbe', cat: 'barbe', name: 'Taille de barbe', desc: 'Tracé, taille et contours, serviette chaude', dur: 20, price: 10 },
    { id: 'rasage', cat: 'barbe', name: 'Rasage traditionnel', desc: 'Serviette chaude, rasoir droit, soin apaisant', dur: 30, price: 15 },
    { id: 'enfant', cat: 'cheveux', name: 'Coupe enfant', desc: 'Jusqu’à 12 ans', dur: 20, price: 10 },
  ];
  const CATS = [['cheveux', 'Coupes'], ['barbe', 'Barbe & rasage'], ['formule', 'Formule']];
  const BARBERS = [
    { id: 'any', name: 'Sans préférence', sub: 'Le premier disponible', ini: '✦' },
    { id: 'yanis', name: 'Yanis', sub: 'Dégradés et contours', ini: 'Y' },
    { id: 'hugo', name: 'Hugo', sub: 'Barbe et rasage', ini: 'H' },
  ];
  // 0 = dimanche. Horaires publiés (PagesJaunes / Mappy) — à confirmer.
  const HOURS = { 1: [14, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19] };
  const DF = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const DS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const FAQ = [
    { q: 'Puis-je venir sans rendez-vous' + NB + '?', a: 'Oui, selon les disponibilités du moment. Les clients avec rendez-vous restent prioritaires' + NB + ': réserver en ligne vous évite d’attendre.' },
    { q: 'Comment modifier ou annuler mon rendez-vous' + NB + '?', a: 'Depuis le lien reçu par SMS, ou par téléphone au 06 41 34 06 30. Merci de prévenir au moins 2 heures à l’avance.' },
    { q: 'Combien de temps dure un rendez-vous' + NB + '?', a: 'De 20 minutes pour une taille de barbe ou une coupe enfant à 50 minutes pour la formule coupe + barbe. La durée de chaque prestation est indiquée dans la carte.' },
    { q: 'Faut-il payer en ligne' + NB + '?', a: 'Non. La réservation est gratuite et sans compte' + NB + ': vous réglez directement au salon.' },
    { q: 'Coiffez-vous les enfants' + NB + '?', a: 'Oui, la coupe enfant est proposée jusqu’à 12 ans. Comptez une vingtaine de minutes.' },
    { q: 'Comment fonctionne l’offre première visite' + NB + '?', a: 'Cochez «' + NB + 'Première visite' + NB + '» en réservant en ligne' + NB + ': 10' + NB + '% sont déduits de votre prestation au salon.' },
    { q: 'Comment utiliser une carte cadeau' + NB + '?', a: 'Présentez-la au salon, imprimée ou sur votre téléphone. Elle est valable un an sur toutes les prestations.' },
  ];
  const GIFTS = ['20' + NB + '€', '30' + NB + '€', '50' + NB + '€', 'Coupe + barbe'];
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  // Taux d'occupation simulé des créneaux, en attendant un vrai agenda.
  const OCC = 42;

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')) + NB + '€';
  const hm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const busy = (d, m, who) => hash(d.toDateString() + '|' + m + '|' + who) % 100 < OCC;
  const visibleRatio = el => { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)) / Math.max(1, r.height); };

  function slotsFor(d, who, now) {
    const H = d && HOURS[d.getDay()]; if (!H) return [];
    const out = [];
    for (let m = H[0] * 60; m <= H[1] * 60 - 30; m += 30) {
      const t = new Date(d); t.setHours(0, m, 0, 0);
      const past = t.getTime() <= now.getTime() + 30 * 60000;
      const free = who === 'any' ? (!busy(d, m, 'yanis') || !busy(d, m, 'hugo')) : !busy(d, m, who);
      out.push({ m, label: hm(m), ok: !past && free });
    }
    return out;
  }
  function openDays(now, n) {
    const out = []; const base = new Date(now); base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 40 && out.length < n; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      if (HOURS[d.getDay()] && slotsFor(d, 'any', now).some(s => s.ok)) out.push(d);
    }
    return out;
  }
  function rel(d, now) {
    if (!d) return '';
    const t = new Date(now); t.setHours(0, 0, 0, 0);
    const diff = Math.round((d - t) / 86400000);
    if (diff === 0) return 'Aujourd’hui';
    if (diff === 1) return 'Demain';
    return DF[d.getDay()] + ' ' + d.getDate();
  }

  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const B0 = () => ({ step: 0, svc: null, barber: 'any', day: 0, slot: null, first: '', phone: '', firstVisit: false, done: false });
  let b = B0();
  let faqOpen = 0, gift = 1;

  /* ---------- Réservation ---------- */
  const maxStep = x => !x.svc ? 0 : (x.slot == null ? 2 : 3);
  const valid = x => !!x.svc && x.slot != null && x.first.trim().length >= 2 && x.phone.replace(/\D/g, '').length >= 10;

  function ctx() {
    const now = new Date(); const days = openDays(now, 6);
    const di = Math.max(0, Math.min(b.day, days.length - 1));
    return { now, days, di, day: days[di] };
  }

  function set(patch, rerender = true) {
    b = { ...b, ...patch };
    if (rerender) renderBooking(); else renderBookingChrome();
    renderServices();
  }

  function pickSvc(id) { set({ svc: id, step: 1, done: false }); }
  function pickBarber(id) {
    const { now, day } = ctx();
    const keep = b.slot != null && slotsFor(day, id, now).some(s => s.m === b.slot && s.ok);
    set({ barber: id, slot: keep ? b.slot : null, step: 2 });
  }
  function goStep(n) { if (!b.done && n <= maxStep(b)) set({ step: n }); }
  function primary() {
    if (b.step === 0 && b.svc) set({ step: 1 });
    else if (b.step === 1) set({ step: 2 });
    else if (b.step === 2 && b.slot != null) set({ step: 3 });
    else if (b.step === 3 && valid(b)) set({ step: 4, done: true });
  }
  function bookNext() {
    const now = new Date(); const days = openDays(now, 6);
    for (let i = 0; i < days.length; i++) {
      const s = slotsFor(days[i], 'any', now).find(x => x.ok);
      if (s) { set({ day: i, slot: s.m, barber: 'any', done: false, step: b.svc ? 3 : 0 }); return; }
    }
  }

  // Titre, étapes, pied de carte : tout sauf le contenu de l'étape (pour ne pas perdre le focus des champs).
  function renderBookingChrome() {
    const { now, day } = ctx();
    const svc = SVCS.find(s => s.id === b.svc); const bar = BARBERS.find(x => x.id === b.barber) || BARBERS[0];
    $('bkTitle').textContent = ['Choisissez une prestation', 'Avec qui' + NB + '?', 'Choisissez votre créneau', 'Vos coordonnées', 'Rendez-vous confirmé'][b.done ? 4 : b.step];
    $('bkCount').textContent = b.done ? 'Confirmé' : 'Étape ' + (b.step + 1) + ' sur 4';
    $('bkBack').hidden = b.done || b.step === 0;
    const mx = maxStep(b);
    $('bkSteps').innerHTML = ['Prestation', 'Barbier', 'Créneau', 'Coordonnées'].map((l, i) => {
      const st = (b.done || i < b.step) ? 'done' : i === b.step ? 'active' : 'todo';
      return '<button type="button" class="bk-step ' + st + (!b.done && i <= mx ? ' reachable' : '') + '" data-step="' + i + '"><span class="bar"></span><span>' + l + '</span></button>';
    }).join('');
    $('bkFoot').hidden = b.done;
    const price = svc ? svc.price : 0; const total = b.firstVisit ? Math.round(price * 90) / 100 : price;
    $('bkFootL').textContent = svc ? svc.name + ' · ' + bar.name : 'Aucune prestation choisie';
    $('bkFootS').textContent = svc ? (b.slot != null ? rel(day, now) + ' à ' + hm(b.slot) + ' · ' + fmt(total) : svc.dur + NB + 'min · ' + fmt(price)) : 'Sans compte · paiement au salon';
    const pOn = b.step === 0 ? !!svc : b.step === 1 ? true : b.step === 2 ? b.slot != null : valid(b);
    const p = $('bkPrimary');
    p.textContent = b.step === 3 ? 'Confirmer le rendez-vous' : 'Continuer';
    p.setAttribute('aria-disabled', String(!pOn));
  }

  function renderBooking() {
    renderBookingChrome();
    const { now, days, di, day } = ctx();
    const svc = SVCS.find(s => s.id === b.svc); const bar = BARBERS.find(x => x.id === b.barber) || BARBERS[0];
    let h = '';
    if (b.done) {
      const dateL = day ? DF[day.getDay()] + ' ' + day.getDate() + ' ' + MO[day.getMonth()] : '';
      const digits = b.phone.replace(/\D/g, '');
      const masked = digits.length >= 4 ? digits.slice(0, 2) + ' •• •• •• ' + digits.slice(-2) : b.phone;
      const line = svc && day && b.slot != null ? svc.name + ' avec ' + (b.barber === 'any' ? 'le premier barbier disponible' : bar.name) + ', ' + dateL.toLowerCase() + ' à ' + hm(b.slot) + '.' : '';
      let ics = '#';
      if (svc && day && b.slot != null) {
        const st = new Date(day); st.setHours(0, b.slot, 0, 0); const en = new Date(st.getTime() + svc.dur * 60000);
        const f = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'DTSTART:' + f(st), 'DTEND:' + f(en), 'SUMMARY:' + svc.name + ' – Etoile Coiffure', 'LOCATION:5 place Aristide Briand, 52100 Saint-Dizier', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
      }
      h = '<div class="bk-pane gap12" style="animation-duration:.5s">' +
        '<span class="done-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
        '<div class="done-t">C’est réservé, ' + esc(b.first.trim()) + '.</div>' +
        '<p class="done-p">' + esc(line) + ' SMS de confirmation envoyé au ' + esc(masked) + '.</p>' +
        '<div class="done-btns"><a href="' + ics + '" download="etoile-coiffure.ics">Ajouter à mon agenda</a><button type="button" data-act="reset">Nouvelle réservation</button></div></div>';
    } else if (b.step === 0) {
      h = '<div class="bk-pane">' + SVCS.map(s =>
        '<button type="button" class="opt opt-svc' + (s.id === b.svc ? ' on' : '') + '" data-svc="' + s.id + '"><span class="n">' + s.name + '</span><span class="m">' + s.dur + NB + 'min</span><span class="p">' + fmt(s.price) + '</span></button>'
      ).join('') + '</div>';
    } else if (b.step === 1) {
      h = '<div class="bk-pane gap8">' + BARBERS.map(x =>
        '<button type="button" class="opt opt-barber' + (x.id === b.barber ? ' on' : '') + '" data-barber="' + x.id + '"><span class="ini">' + x.ini + '</span><span class="t"><b>' + x.name + '</b><span class="m">' + x.sub + '</span></span></button>'
      ).join('') + '</div>';
    } else if (b.step === 2) {
      const raw = slotsFor(day, b.barber, now); const nFree = raw.filter(s => s.ok).length;
      const dateL = day ? DF[day.getDay()] + ' ' + day.getDate() + ' ' + MO[day.getMonth()] : '';
      h = '<div class="bk-pane" style="display:block">' +
        '<div class="days">' + days.map((d, i) =>
          '<button type="button" class="opt opt-day' + (i === di ? ' on' : '') + '" data-day="' + i + '"><span class="m">' + DS[d.getDay()] + '</span><span class="num">' + d.getDate() + '</span></button>'
        ).join('') + '</div>' +
        '<div class="day-info"><b>' + dateL + '</b><span>' + (nFree ? nFree + ' créneaux libres' : 'Complet ce jour') + '</span></div>' +
        '<div class="slots">' + raw.map(s =>
          '<button type="button" class="opt opt-slot' + (s.ok && s.m === b.slot ? ' on' : '') + '" data-slot="' + s.m + '"' + (s.ok ? '' : ' disabled') + '>' + s.label + '</button>'
        ).join('') + '</div></div>';
    } else if (b.step === 3) {
      h = '<div class="bk-pane gap12">' +
        '<label class="field">Prénom<input id="fFirst" value="' + esc(b.first) + '" placeholder="Votre prénom" autocomplete="given-name"></label>' +
        '<label class="field">Téléphone mobile<input id="fPhone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(b.phone) + '" placeholder="06 00 00 00 00"></label>' +
        '<button type="button" class="fv" role="checkbox" aria-checked="' + b.firstVisit + '" data-act="fv"><span class="box">' + (b.firstVisit ? '✓' : '') + '</span><span><b>Première visite</b> — 10 % déduits au salon</span></button>' +
        '</div>';
    }
    $('bkBody').innerHTML = h;
  }

  function initBooking() {
    $('bkBody').addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t || t.disabled) return;
      if (t.dataset.svc) pickSvc(t.dataset.svc);
      else if (t.dataset.barber) pickBarber(t.dataset.barber);
      else if (t.dataset.day) set({ day: +t.dataset.day, slot: null });
      else if (t.dataset.slot) set({ slot: +t.dataset.slot, step: 3 });
      else if (t.dataset.act === 'fv') {
        b.firstVisit = !b.firstVisit;
        t.setAttribute('aria-checked', String(b.firstVisit)); t.querySelector('.box').textContent = b.firstVisit ? '✓' : '';
        renderBookingChrome();
      } else if (t.dataset.act === 'reset') set(B0());
    });
    $('bkBody').addEventListener('input', e => {
      if (e.target.id === 'fFirst') set({ first: e.target.value }, false);
      else if (e.target.id === 'fPhone') set({ phone: e.target.value }, false);
    });
    $('bkBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') primary(); });
    $('bkSteps').addEventListener('click', e => { const t = e.target.closest('[data-step]'); if (t) goStep(+t.dataset.step); });
    $('bkBack').addEventListener('click', () => set({ step: Math.max(0, b.step - 1) }));
    $('bkPrimary').addEventListener('click', primary);
    $('bookNext').addEventListener('click', bookNext);
    renderBooking();
  }

  // Tous les liens « Réserver » : la carte s'illumine à l'arrivée ; si elle est déjà à l'écran, on ne fait pas défiler.
  function initBookingLinks() {
    const card = $('reserver');
    let pending = false;
    const flash = () => { card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); };
    document.addEventListener('click', e => {
      const c = e.target.closest('[data-choose]'); if (c) pickSvc(c.dataset.choose);
      const a = e.target.closest('a[href="#reserver"]'); if (!a) return;
      const vis = visibleRatio(card);
      if (vis > 0.9) {
        e.preventDefault(); flash();
        const f = card.querySelector('.bk-body button:not([disabled]), .bk-body input'); if (f) f.focus({ preventScroll: true });
      } else if (vis >= 0.35) flash();
      else pending = true;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && pending) { pending = false; setTimeout(flash, 120); } }), { threshold: 0.35 }).observe(card);
    }
  }

  /* ---------- Prestations ---------- */
  function renderServices() {
    document.querySelectorAll('.svc-btn[data-choose]').forEach(a => {
      const on = a.dataset.choose === b.svc;
      a.classList.toggle('on', on); a.textContent = on ? 'Choisi ✓' : 'Choisir';
    });
  }
  function initServices() {
    $('svcList').innerHTML = CATS.map(([id, label]) => {
      const items = SVCS.filter(s => s.cat === id);
      return '<div class="svc-group"><div class="svc-cat" data-reveal="0"><span>' + esc(label) + '</span><span>' + items.length + ' prestation' + (items.length > 1 ? 's' : '') + '</span></div>' +
        items.map((s, i) =>
          '<div class="svc spot" data-reveal="' + i * 70 + '">' +
          '<div class="svc-t"><span class="svc-name">' + s.name + (s.tag ? '<span class="svc-tag">' + s.tag + '</span>' : '') + '</span><span class="svc-d">' + s.desc + '</span></div>' +
          '<div class="svc-r"><span class="svc-dur">' + s.dur + NB + 'min</span><span class="svc-price">' + fmt(s.price) + '</span>' +
          '<a href="#reserver" class="svc-btn" data-choose="' + s.id + '">Choisir</a></div></div>'
        ).join('') + '</div>';
    }).join('');
  }

  /* ---------- Infos dynamiques (prochain créneau, horaires) ---------- */
  function renderLive() {
    const now = new Date(); const days = openDays(now, 6);
    let nextL = '';
    for (const d of days) { const s = slotsFor(d, 'any', now).find(x => x.ok); if (s) { nextL = rel(d, now) + ' · ' + s.label; break; } }
    document.querySelectorAll('[data-next]').forEach(el => { el.textContent = nextL || '—'; });
    document.querySelectorAll('[data-next-dock]').forEach(el => { el.textContent = nextL || 'Réservation en ligne'; });

    const dow = now.getDay(); const H = HOURS[dow]; const mins = now.getHours() * 60 + now.getMinutes();
    let isOpen = false, openL = '';
    if (H && mins >= H[0] * 60 && mins < H[1] * 60) { isOpen = true; openL = 'Ouvert · jusqu’à ' + H[1] + NB + 'h'; }
    else if (H && mins < H[0] * 60) openL = 'Fermé · ouvre à ' + H[0] + NB + 'h';
    else { for (let i = 1; i <= 7; i++) { const dd = (dow + i) % 7; if (HOURS[dd]) { openL = 'Fermé · ouvre ' + (i === 1 ? 'demain' : DF[dd].toLowerCase()) + ' à ' + HOURS[dd][0] + NB + 'h'; break; } } }
    $('openStatus').classList.toggle('open', isOpen);
    $('openL').textContent = openL;
    $('heroStatus').textContent = openL;
    $('heroStatusItem').classList.toggle('open', isOpen);
    $('hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d =>
      '<div' + (d === dow ? ' class="today"' : '') + '><span>' + DF[d] + (d === dow ? ' · aujourd’hui' : '') + '</span><span>' + (HOURS[d] ? HOURS[d][0] + 'h – ' + HOURS[d][1] + 'h' : 'Fermé') + '</span></div>'
    ).join('');

    // Pied de page : jours consécutifs aux mêmes horaires regroupés.
    const groups = [];
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      const h = HOURS[d] ? HOURS[d][0] + 'h – ' + HOURS[d][1] + 'h' : 'Fermé';
      const g = groups[groups.length - 1];
      if (g && g.h === h) g.to = d; else groups.push({ from: d, to: d, h });
    });
    $('footHours').innerHTML = groups.map(g =>
      '<li><span>' + (g.from === g.to ? DF[g.from] : DS[g.from] + ' – ' + DS[g.to]) + '</span><span>' + g.h + '</span></li>'
    ).join('');
    $('year').textContent = now.getFullYear();
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    const list = $('faqList');
    list.innerHTML = FAQ.map((f, i) =>
      '<div class="faq-item">' +
      '<button type="button" class="faq-q" aria-expanded="false" aria-controls="faq-a' + i + '" data-i="' + i + '">' + f.q +
      '<span class="faq-ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>' +
      '<div class="faq-a" id="faq-a' + i + '"><div><p>' + f.a + '</p></div></div></div>'
    ).join('');
    const sync = () => list.querySelectorAll('.faq-item').forEach((it, i) => {
      it.classList.toggle('open', i === faqOpen);
      it.querySelector('.faq-q').setAttribute('aria-expanded', String(i === faqOpen));
    });
    list.addEventListener('click', e => { const q = e.target.closest('.faq-q'); if (!q) return; const i = +q.dataset.i; faqOpen = faqOpen === i ? -1 : i; sync(); });
    sync();
  }

  /* ---------- Carte cadeau ---------- */
  function initGift() {
    const opts = $('giftOpts');
    opts.innerHTML = GIFTS.map((l, i) => '<button type="button" class="gift-opt" data-i="' + i + '">' + l + '</button>').join('');
    const sync = () => {
      opts.querySelectorAll('.gift-opt').forEach((o, i) => o.setAttribute('aria-pressed', String(i === gift)));
      const v = GIFTS[gift]; const el = $('giftVal'); el.textContent = v; el.classList.toggle('long', v.length > 6);
    };
    opts.addEventListener('click', e => { const o = e.target.closest('.gift-opt'); if (o) { gift = +o.dataset.i; sync(); } });
    sync();
    const tilt = $('tilt');
    tilt.addEventListener('pointermove', e => {
      if (reduced || e.pointerType !== 'mouse') return;
      const r = tilt.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'perspective(1000px) rotateY(' + (x * 12).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)';
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- Galerie ---------- */
  function initGallery() {
    const t = $('gallery'), bar = $('galBar');
    const onGal = () => {
      const vis = Math.min(1, t.clientWidth / Math.max(1, t.scrollWidth)); const max = t.scrollWidth - t.clientWidth;
      const p = max > 0 ? t.scrollLeft / max : 0;
      bar.style.width = (vis * 100).toFixed(2) + '%';
      bar.style.transform = 'translateX(' + (vis < 1 ? p * (1 / vis - 1) * 100 : 0).toFixed(2) + '%)';
    };
    const by = dir => {
      const card = t.querySelector('figure'); const step = card ? card.getBoundingClientRect().width + 16 : t.clientWidth * 0.8;
      t.scrollBy({ left: dir * step, behavior: reduced ? 'auto' : 'smooth' });
    };
    $('galPrev').addEventListener('click', () => by(-1));
    $('galNext').addEventListener('click', () => by(1));
    t.addEventListener('scroll', onGal, { passive: true });
    window.addEventListener('resize', onGal, { passive: true });
    // Glisser à la souris (le tactile et les trackpads défilent nativement).
    let drag = null;
    t.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, s: t.scrollLeft };
      t.style.scrollSnapType = 'none'; t.style.cursor = 'grabbing';
    });
    t.addEventListener('pointermove', e => { if (drag) t.scrollLeft = drag.s - (e.clientX - drag.x); });
    const up = () => { if (!drag) return; drag = null; t.style.cursor = ''; const sl = t.scrollLeft; t.style.scrollSnapType = ''; t.scrollLeft = sl; };
    t.addEventListener('pointerup', up); t.addEventListener('pointerleave', up);
    onGal(); setTimeout(onGal, 400);
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    const menu = $('menu'), open = $('openMenu');
    const close = () => { menu.hidden = true; document.body.style.overflow = ''; open.setAttribute('aria-expanded', 'false'); };
    open.addEventListener('click', () => { menu.hidden = false; document.body.style.overflow = 'hidden'; open.setAttribute('aria-expanded', 'true'); });
    $('closeMenu').addEventListener('click', close);
    menu.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) close(); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 1000 && !menu.hidden) close(); }, { passive: true });
    return () => !menu.hidden;
  }

  /* ---------- Effets ---------- */
  // Le texte de présentation s'illumine mot à mot au fil du défilement.
  function initStatement() {
    const el = $('statement'); if (!el || reduced) return () => {};
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => '<span class="w">' + esc(w) + '</span>').join(' ');
    const spans = Array.from(el.children); let lit = -1;
    return () => {
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const n = Math.round(Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (r.height + vh * 0.38))) * spans.length);
      if (n !== lit) { lit = n; spans.forEach((s, i) => s.classList.toggle('on', i < n)); }
    };
  }

  function initCounters() {
    const years = new Date().getFullYear() - 2011;
    document.querySelectorAll('[data-years]').forEach(el => { el.dataset.count = years; el.textContent = years; });
    if (reduced || !('IntersectionObserver' in window)) return;
    const run = el => {
      const to = +el.dataset.count, t0 = performance.now(), d = 1500;
      const step = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(el => { el.textContent = '0'; io.observe(el); });
  }

  function initSpotlight() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('pointermove', e => {
      const el = e.target.closest && e.target.closest('.spot'); if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  function initImages() {
    document.querySelectorAll('img.fade').forEach(img => {
      const done = () => img.classList.add('loaded');
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
    // Bandeau défilant : contenu doublé pour une boucle sans à-coup.
    const track = document.querySelector('.ticker-track'); if (track) track.innerHTML += track.innerHTML;
  }

  /* ---------- Scroll : progression, header, parallaxe ---------- */
  function initScroll(extra) {
    const prog = $('progress'), header = $('header'), img = $('heroImg'), hero = $('accueil');
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY || 0; const max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      header.classList.toggle('scrolled', y > 40);
      if (!reduced && y < hero.offsetHeight) {
        const h = img.parentNode.clientHeight || 800;
        img.style.transform = 'translate3d(0,' + Math.min(y * 0.18, h * 0.12).toFixed(1) + 'px,0) scale(1.04)';
      }
      extra();
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    frame();
  }

  // Apparition au défilement : seuls les éléments sous la ligne de flottaison au chargement sont masqués.
  function initReveal() {
    if (!('IntersectionObserver' in window) || reduced) return;
    const vh = window.innerHeight;
    const show = el => {
      io.unobserve(el);
      const d = +el.getAttribute('data-reveal') || 0;
      el.style.transition = 'opacity .9s ' + EASE + ' ' + d + 'ms, transform 1.1s ' + EASE + ' ' + d + 'ms';
      el.style.opacity = '1'; el.style.transform = 'translate3d(0,0,0)';
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; el.style.transition = ''; }, 1200 + d);
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) show(e.target); }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top < vh * 0.94) return;
      el.style.opacity = '0'; el.style.transform = 'translate3d(0,36px,0)';
      io.observe(el);
    });
  }

  function initObservers(menuOpen) {
    if (!('IntersectionObserver' in window)) return;
    const links = document.querySelectorAll('.nav a[data-spy]');
    const spy = new IntersectionObserver(es => {
      const hit = es.filter(e => e.isIntersecting).map(e => e.target.id);
      if (hit.length) links.forEach(a => a.classList.toggle('active', a.dataset.spy === hit[0]));
    }, { rootMargin: '-35% 0px -60% 0px' });
    ['accueil', 'salon', 'prestations', 'realisations', 'avis', 'carte-cadeau', 'faq', 'infos', 'cta-final'].forEach(id => { const el = $(id); if (el) spy.observe(el); });

    const dock = $('dock'); const vis = {};
    const sync = () => {
      const on = vis.reserver === false && !vis['cta-final'] && !menuOpen();
      dock.classList.toggle('on', on);
      dock.setAttribute('aria-hidden', String(!on)); dock.tabIndex = on ? 0 : -1;
    };
    const dio = new IntersectionObserver(es => { es.forEach(e => { vis[e.target.id] = e.isIntersecting; }); sync(); });
    ['reserver', 'cta-final'].forEach(id => dio.observe($(id)));
    $('openMenu').addEventListener('click', sync); $('closeMenu').addEventListener('click', sync);
  }

  initServices();
  initBooking();
  initBookingLinks();
  initFaq();
  initGift();
  initGallery();
  initImages();
  const menuOpen = initMenu();
  renderLive();
  initScroll(initStatement());
  initReveal();
  initCounters();
  initSpotlight();
  initObservers(menuOpen);
  setInterval(() => { renderLive(); if (!b.done && b.step !== 3) renderBooking(); else renderBookingChrome(); }, 60000);
})();
