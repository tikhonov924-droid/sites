'use strict';
(() => {
  const root=document.documentElement;
  const params=new URLSearchParams(location.search);
  const update=()=>{
    const section=root.dataset.concept==='section';
    document.querySelector('.hero-atlas').hidden=section;
    document.querySelector('.hero-section').hidden=!section;
    document.querySelectorAll('[data-concept]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el.dataset.concept===root.dataset.concept))});
    document.querySelectorAll('[data-type]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el.dataset.type===root.dataset.type))});
    params.set('concept',root.dataset.concept);params.set('type',root.dataset.type);
    history.replaceState(null,'','?'+params+location.hash);
    document.querySelectorAll('.type-columns a').forEach((a,i)=>a.href='?concept='+root.dataset.concept+'&type='+(i?'onest':'inter'));
  };
  document.querySelectorAll('.review-bar button').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.concept)root.dataset.concept=button.dataset.concept;
    if(button.dataset.type)root.dataset.type=button.dataset.type;
    update();
  }));
  const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
  const close=()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('open')};
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  update();
})();
