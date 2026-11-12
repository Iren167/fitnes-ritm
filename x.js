/* Ритм · VS-44: меню, расчёт месяца, расписание групп, мелкие анимации */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var WA = (document.body.getAttribute('data-wa') || '').replace(/\D/g, '');

  /* меню: бургер, закрытие, подсветка текущего раздела */
  (function () {
    var bar = $('.s-bar'), burger = $('.x-burger'), links = $$('.x-nav a');
    if (!bar) return;
    function close() { bar.classList.remove('is-open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }
    if (burger) burger.addEventListener('click', function () { var o = bar.classList.toggle('is-open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    links.forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) { if (!bar.contains(e.target)) close(); });
    var secs = links.map(function (a) { return $(a.getAttribute('href')); });
    function mark() {
      var y = window.innerHeight * 0.35, cur = -1;
      secs.forEach(function (s, i) { if (!s) return; var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', mark, { passive: true }); window.addEventListener('resize', mark); mark();
  })();

  /* волна от клика по кнопкам */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.s-btn'); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), x = document.createElement('span');
    x.className = 'x-ripple'; x.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(x); setTimeout(function () { x.remove(); }, 650);
  });

  /* плавное появление блоков */
  (function () {
    var els = $$('.x-rv'); if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* расчёт месяца: формат + занятий в неделю -> чек со скидкой за пакет */
  (function () {
    var root = $('[data-k]'); if (!root) return;
    var F = [{ n: 'Групповая', p: 700, d: 'до 8 человек' }, { n: 'Персональная', p: 2200, d: 'один на один' }, { n: 'Сплит – вдвоём', p: 1400, d: 'цена с человека' }, { n: 'Онлайн', p: 1300, d: 'по видеосвязи' }];
    var TIERS = [{ n: 8, off: 5 }, { n: 12, off: 8 }, { n: 16, off: 10 }];
    var st = { f: 0, w: 3 }, shown = 0, raf = null;
    var fe = $('[data-k-f]'), rng = $('[data-k-w]'), out = $('[data-k-wv]'), lines = $('[data-k-lines]'), tot = $('[data-k-total]'), avg = $('[data-k-avg]'), hint = $('[data-k-hint]'), send = $('[data-k-send]'), tiers = $$('[data-k-tier]');
    F.forEach(function (f, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.innerHTML = f.n + '<small>' + fmt(f.p) + ' ₽ · ' + f.d + '</small>';
      b.addEventListener('click', function () { st.f = i; render(); }); fe.appendChild(b);
    });
    rng.addEventListener('input', function () { st.w = +rng.value; render(); });
    function tween(to) {
      if (raf) cancelAnimationFrame(raf);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { shown = to; tot.textContent = fmt(to) + ' ₽'; return; }
      var from = shown, t0 = null;
      raf = requestAnimationFrame(function step(ts) { if (!t0) t0 = ts; var k = Math.min((ts - t0) / 450, 1), e = 1 - Math.pow(1 - k, 3); shown = from + (to - from) * e; tot.textContent = fmt(shown) + ' ₽'; if (k < 1) raf = requestAnimationFrame(step); else { shown = to; tot.textContent = fmt(to) + ' ₽'; } });
    }
    function render() {
      var f = F[st.f], n = st.w * 4, base = f.p * n, off = 0;
      TIERS.forEach(function (t) { if (n >= t.n) off = t.off; });
      var disc = Math.round(base * off / 100), sum = base - disc;
      $$('button', fe).forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.f ? 'true' : 'false'); });
      out.innerHTML = st.w + '<small>' + (st.w === 1 ? 'раз' : 'раза') + ' в неделю</small>';
      rng.style.setProperty('--p', ((st.w - 1) / 4 * 100) + '%');
      var h = '<li><span>' + f.n + ' × ' + n + '</span><span>' + fmt(base) + ' ₽</span></li>';
      if (disc) h += '<li class="is-disc"><span>Скидка за пакет ' + off + '%</span><span>−' + fmt(disc) + ' ₽</span></li>';
      lines.innerHTML = h; tween(sum);
      avg.textContent = fmt(sum / n) + ' ₽';
      tiers.forEach(function (t, i) { t.classList.toggle('on', n >= TIERS[i].n); });
      var nx = null; TIERS.forEach(function (t) { if (!nx && n < t.n) nx = t; });
      hint.textContent = nx ? 'Ещё ' + (nx.n - n) + ' занятий в месяц – и скидка за пакет ' + nx.off + '%' : 'Максимальная скидка за пакет уже учтена';
      var msg = 'Здравствуйте! Хочу записаться в «Ритм». Формат: ' + f.n.toLowerCase() + ', ' + st.w + ' раза в неделю (' + n + ' занятий в месяц), по расчёту на сайте ' + fmt(sum) + ' ₽ в месяц. Начну с пробной тренировки.';
      send.href = WA ? 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) : '#contacts';
    }
    render();
  })();

  /* расписание групп */
  (function () {
    var root = $('[data-sch]'); if (!root) return;
    var D = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    var S = [
      [['08:00', 'Функциональная', 'Ксения Л.', 3], ['19:00', 'Силовая для новичков', 'Артём В.', 5], ['20:15', 'Стретчинг', 'Мария Т.', 6]],
      [['07:30', 'Пилатес', 'Мария Т.', 4], ['18:30', 'Здоровая спина', 'Ксения Л.', 2], ['19:45', 'Кардио-интервалы', 'Артём В.', 7]],
      [['08:00', 'Силовая для новичков', 'Ксения Л.', 5], ['12:00', 'Пилатес', 'Мария Т.', 6], ['19:00', 'Функциональная', 'Артём В.', 1]],
      [['07:30', 'Стретчинг', 'Мария Т.', 8], ['18:30', 'Силовая для новичков', 'Артём В.', 4], ['19:45', 'Здоровая спина', 'Ксения Л.', 3]],
      [['08:00', 'Функциональная', 'Ксения Л.', 5], ['19:00', 'Пилатес', 'Мария Т.', 2], ['20:15', 'Кардио-интервалы', 'Артём В.', 6]],
      [['10:00', 'Силовая для новичков', 'Ксения Л.', 4], ['11:15', 'Стретчинг', 'Мария Т.', 7], ['12:30', 'Функциональная', 'Артём В.', 3]],
      [['11:00', 'Пилатес', 'Мария Т.', 5], ['12:15', 'Здоровая спина', 'Ксения Л.', 6]]
    ];
    var days = $('[data-sch-days]'), list = $('[data-sch-list]'), cur = (new Date().getDay() + 6) % 7;
    D.forEach(function (d, i) { var b = document.createElement('button'); b.type = 'button'; b.textContent = d; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', function () { cur = i; paint(); }); days.appendChild(b); });
    function paint() {
      $$('button', days).forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); });
      list.innerHTML = S[cur].map(function (c, k) {
        var low = c[3] <= 2;
        return '<li style="animation-delay:' + (k * 70) + 'ms"><span class="sch__time">' + c[0] + '</span><span class="sch__name"><b>' + c[1] + '</b><span>60 минут · ' + c[2] + '</span></span><span class="sch__left' + (low ? ' low' : '') + '">осталось ' + c[3] + ' ' + (c[3] === 1 ? 'место' : (c[3] < 5 ? 'места' : 'мест')) + '</span></li>';
      }).join('');
    }
    paint();
  })();
})();
