'use strict';
(() => {
  const config = window.PRESTOL_CONFIG;
  const params = new URLSearchParams(location.search);
  const group = params.get('g') || '';
  let segment = 'home';
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goal = name => { if (config.METRIKA_ID && typeof window.ym === 'function') window.ym(config.METRIKA_ID, 'reachGoal', name); };
  if (config.GROUPS[group]) {
    $('#hero-title').textContent = config.GROUPS[group].title;
    $('#hero-subtitle').textContent = config.GROUPS[group].subtitle;
    if (group === 'stol') $('#hero-subtitle').dataset.confirm = 'price-scope';
  }
  function selectSegment(value, track = true) {
    segment = value;
    $$('[data-seg]').forEach(tab => { const active = tab.dataset.seg === value; tab.setAttribute('aria-selected', active); tab.tabIndex = active ? 0 : -1; });
    $$('[data-segp]').forEach(panel => { panel.hidden = panel.dataset.segp !== value; });
    if (track) goal('seg_' + value);
  }
  function selectForm(value) {
    $$('.tab[data-tab]').forEach(tab => { const active = tab.dataset.tab === value; tab.setAttribute('aria-selected', active); tab.tabIndex = active ? 0 : -1; });
    $$('[data-only]').forEach(label => { const active = label.dataset.only === value; label.hidden = !active; $$('input, textarea', label).forEach(field => { field.disabled = !active; }); });
    if (value === 'b') $('#f-product').value = 'Подбор камня';
  }
  $$('[data-seg]').forEach(tab => tab.addEventListener('click', () => selectSegment(tab.dataset.seg)));
  $$('.tab[data-tab]').forEach(tab => tab.addEventListener('click', () => selectForm(tab.dataset.tab)));
  $$('.tabs').forEach((list, index) => {
    list.setAttribute('aria-label', index === 0 ? 'Ваша задача' : 'Данные для расчёта');
    const tabs = $$('.tab', list);
    tabs.forEach((tab, i) => {
      tab.id = 'tab-' + index + '-' + i;
      const panel = index === 0 ? $('[data-segp="' + tab.dataset.seg + '"]') : $('#leadForm');
      if (panel) { if (!panel.id) panel.id = 'panel-' + index + '-' + i; tab.setAttribute('aria-controls', panel.id); if (index === 0) { panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id); } }
      tab.addEventListener('keydown', event => {
        const key = event.key;
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return;
        event.preventDefault();
        const next = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : (i + (['ArrowRight','ArrowDown'].includes(key) ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].click(); tabs[next].focus();
      });
    });
  });
  selectSegment(group === 'pro' ? 'des' : 'home', false);
  selectForm('a');
  const menu = $('.menu-toggle');
  function closeMenu() { $('#main-nav').classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', open); menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); $('#main-nav').classList.toggle('is-open', open); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  $$('#main-nav a').forEach(link => link.addEventListener('click', () => { if (link.hash === '#seg') selectSegment('des'); closeMenu(); }));
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-go]');
    if (action) {
      goal('click_calc');
      if (action.dataset.tab) selectForm(action.dataset.tab);
      else if (action.dataset.pick) selectForm('a');
      if (action.dataset.pick) $('#f-product').value = action.dataset.pick;
      const target = $('#' + action.dataset.go);
      target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
      closeMenu();
    }
    if (event.target.closest('a[href^="tel:"]')) goal('click_phone');
  });
  function phoneDigits(value) { let digits = value.replace(/\D/g, ''); if (digits[0] === '8') digits = '7' + digits.slice(1); if (digits[0] !== '7' && digits.length) digits = '7' + digits; return digits.slice(0, 11); }
  function formatPhone(value) { const digits = phoneDigits(value); if (!digits) return ''; let out = '+7'; if (digits.length > 1) out += ' ' + digits.slice(1,4); if (digits.length > 4) out += ' ' + digits.slice(4,7); if (digits.length > 7) out += '-' + digits.slice(7,9); if (digits.length > 9) out += '-' + digits.slice(9,11); return out; }
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', () => { input.value = formatPhone(input.value); input.removeAttribute('aria-invalid'); $('#' + input.id + '-error').textContent = ''; });
    input.addEventListener('blur', () => { if (input.value && phoneDigits(input.value).length !== 11) { input.setAttribute('aria-invalid','true'); $('#' + input.id + '-error').textContent = 'Введите телефон полностью: +7 и ещё 10 цифр.'; } });
  });
  function checkFiles() {
    const input = $('#f-file'), files = [...input.files];
    let message = '';
    if (files.length > 10) message = 'Прикрепите не больше 10 файлов.';
    else if (files.reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024) message = 'Общий размер файлов больше 20 МБ. Уменьшите их или уберите часть.';
    else if (files.some(file => !/\.(pdf|jpe?g|png|heic|dwg|xlsx)$/i.test(file.name))) message = 'Подойдут PDF, JPG, PNG, HEIC, DWG или XLSX.';
    $('#f-file-error').textContent = message;
    if (message) input.setAttribute('aria-invalid','true'); else input.removeAttribute('aria-invalid');
    return !message;
  }
  $('#f-file').addEventListener('change', () => {
    checkFiles();
    const files = [...$('#f-file').files];
    $('.upload-status').textContent = files.length ? files.map(file => file.name).join(', ') : 'Файлы не выбраны';
  });
  [[$('#leadForm'), 'calc', '#ok'], [$('#catForm'), 'catalog', '#catOk']].forEach(([form, type, successSelector]) => {
    let started = false, sending = false;
    form.addEventListener('input', () => { if (!started) { goal('form_start'); started = true; } });
    form.addEventListener('change', () => { if (!started) { goal('form_start'); started = true; } });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending) return;
      const phone = $('input[type="tel"]', form), error = $('#' + form.id + '-error');
      error.textContent = '';
      if (phoneDigits(phone.value).length !== 11) { $('#' + phone.id + '-error').textContent = 'Укажите телефон: +7 и ещё 10 цифр.'; phone.setAttribute('aria-invalid','true'); phone.focus(); return; }
      if (type === 'calc' && !$('#f-file').disabled && !checkFiles()) { $('#f-file').focus(); return; }
      const data = new FormData(form);
      ['name','city','wish','product'].forEach(key => { if (!data.has(key)) data.set(key, ''); });
      data.set('phone', '+' + phoneDigits(phone.value));
      data.set('form', type); data.set('segment', segment); data.set('g', group);
      for (const [key, value] of params) if (/^utm_/i.test(key) || key === 'yclid') data.append(key, value);
      if (!$('#f-file').files.length || type === 'catalog' || $('#f-file').disabled) data.delete('files[]');
      const button = $('button[type="submit"]', form), original = button.textContent;
      sending = true; button.disabled = true; button.textContent = 'Отправляем…'; form.setAttribute('aria-busy','true');
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(config.FORM_ENDPOINT, { method:'POST', body:data, signal:controller.signal, headers:{'Accept':'application/json'} });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        // A static host fallback must never be mistaken for a saved application.
        if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected JSON acknowledgement');
        const result = await response.json();
        if (result.success !== true && result.ok !== true) throw new Error('Lead not acknowledged');
        form.hidden = true; $(successSelector).hidden = false; $(successSelector).tabIndex = -1; $(successSelector).focus();
        goal(type === 'calc' ? 'lead_calc' : 'lead_catalog');
      } catch (_) {
        error.textContent = 'Не получилось отправить. Позвоните 8 (800) 600-05-31 или попробуйте ещё раз';
      } finally { clearTimeout(timeout); sending = false; button.disabled = false; button.textContent = original; form.removeAttribute('aria-busy'); }
    });
  });
  const lightbox = $('#lightbox'), lightboxImage = $('img', lightbox), scroll = $('.lightbox-scroll', lightbox);
  $$('.zoom-image').forEach(button => button.addEventListener('click', () => { lightboxImage.src = button.dataset.image; lightboxImage.alt = $('img', button).alt; scroll.classList.remove('is-zoomed'); $('[data-zoom]').textContent = 'Увеличить'; lightbox.showModal(); }));
  $('[data-close]').addEventListener('click', () => lightbox.close());
  $('[data-zoom]').addEventListener('click', event => { const zoomed = scroll.classList.toggle('is-zoomed'); event.target.textContent = zoomed ? 'Уменьшить' : 'Увеличить'; });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  const bar = $('.mobile-bar');
  const barObserver = new IntersectionObserver(entries => { entries.forEach(entry => { bar.hidden = entry.isIntersecting || window.scrollY < $('#intro').offsetHeight / 2; }); }, { threshold:0 });
  barObserver.observe($('#intro'));
  document.addEventListener('focusin', event => { if (event.target.matches('input, select, textarea')) bar.classList.add('is-input'); });
  document.addEventListener('focusout', () => { requestAnimationFrame(() => { if (!document.activeElement.matches('input, select, textarea')) bar.classList.remove('is-input'); }); });
  if (config.METRIKA_ID) {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script'); script.async = true; script.src = 'https://mc.yandex.ru/metrika/tag.js'; document.head.append(script);
    window.ym(config.METRIKA_ID, 'init', { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
  }
})();
