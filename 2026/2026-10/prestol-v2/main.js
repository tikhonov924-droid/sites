'use strict';
(() => {
  const config=window.PRESTOL_CONFIG;
  const params=new URLSearchParams(location.search);
  const $=(s,p=document)=>p.querySelector(s);
  const $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const hero=params.get('hero')==='b'?'b':'a';
  const group=params.get('g')||'';
  const review=params.get('review')==='1';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let material='';
  const goal=name=>{if(config.METRIKA_ID&&typeof window.ym==='function')window.ym(config.METRIKA_ID,'reachGoal',name)};
  document.documentElement.dataset.hero=hero;
  if(hero==='b'){
    const picture=$('.hero-art picture');
    $$('source',picture).forEach(source=>{source.srcset=source.media?'img/hero-dark-640.webp':[640,960,1280].map(w=>'img/hero-dark-'+w+'.webp '+w+'w').join(', ')});
    $('img',picture).src='img/hero-dark-1280.webp';
    $('img',picture).alt='Тёмный зелёный камень с белыми прожилками';
    $('[property="og:image"]').content='img/hero-dark-1280.webp';
  }
  if(config.GROUPS[group]){
    $('#hero-title').textContent=config.GROUPS[group].title;
    $('#product').value=config.GROUPS[group].category;
    document.documentElement.classList.toggle('has-long-title',group==='pro'||group==='obl'||group==='lest');
  }
  if(review){
    $('.review-switch').hidden=false;
    $$('[data-hero-link]').forEach(link=>{
      const query=new URLSearchParams(params);query.set('hero',link.dataset.heroLink);
      link.href='?'+query.toString();
      link.setAttribute('aria-current',link.dataset.heroLink===hero?'true':'false');
    });
  }
  const requestedMaterial=params.get('material');
  if(['Мрамор','Гранит','Кварцит','Травертин','Оникс','Сланец'].includes(requestedMaterial)){
    material=requestedMaterial;$('#product').value='Подбор камня';
    $('#selected-material').hidden=false;$('#selected-material').textContent='Выбранный камень: '+material;
  }
  const menu=$('.menu-toggle');
  const closeMenu=()=>{$('#navigation').classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню')};
  menu.addEventListener('click',()=>{
    const open=menu.getAttribute('aria-expanded')!=='true';
    menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');$('#navigation').classList.toggle('is-open',open);
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
  $$('#navigation a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-calc]');
    if(action){
      event.preventDefault();goal('click_calc');closeMenu();
      if(action.dataset.category){$('#product').value=action.dataset.category;material='';}
      if(action.dataset.material){$('#product').value='Подбор камня';material=action.dataset.material;}
      $('#selected-material').hidden=!material;
      $('#selected-material').textContent=material?'Выбранный камень: '+material:'';
      $('#request').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
    }
    if(event.target.closest('a[href^="tel:"]'))goal('click_phone');
    if(event.target.closest('[data-messenger]'))goal('click_messenger');
  });
  const contact=$('#contact');
  function phoneDigits(value){let digits=value.replace(/\D/g,'');if(digits.startsWith('8'))digits='7'+digits.slice(1);if(digits&&!digits.startsWith('7'))digits='7'+digits;return digits.slice(0,11)}
  function phoneMask(value){const d=phoneDigits(value);if(!d)return '';return '+7'+(d.length>1?' '+d.slice(1,4):'')+(d.length>4?' '+d.slice(4,7):'')+(d.length>7?'-'+d.slice(7,9):'')+(d.length>9?'-'+d.slice(9,11):'')}
  function isPhone(value){return /^[+\d\s()\-]+$/.test(value)}
  function validContact(value){return isPhone(value)?phoneDigits(value).length===11:/^@[\p{L}\d_][\p{L}\d_.\-]{2,63}$/u.test(value)||/^https:\/\/(t\.me|wa\.me)\/[\w+.-]+\/?$/i.test(value)}
  contact.addEventListener('input',()=>{
    if(isPhone(contact.value))contact.value=phoneMask(contact.value);
    contact.removeAttribute('aria-invalid');$('#contact-error').textContent='';
  });
  function validateFiles(){
    const files=[...$('#files').files];let message='';
    if(files.length>10)message='Прикрепите не больше 10 файлов.';
    else if(files.reduce((sum,f)=>sum+f.size,0)>20*1024*1024)message='Общий размер файлов больше 20 МБ. Уменьшите их или уберите часть.';
    else if(files.some(f=>! /\.(pdf|jpe?g|png|heic|dwg|xlsx)$/i.test(f.name)))message='Подойдут PDF, JPG, PNG, HEIC, DWG или XLSX.';
    $('#files-error').textContent=message;
    if(message)$('#files').setAttribute('aria-invalid','true');else $('#files').removeAttribute('aria-invalid');
    return !message;
  }
  $('#files').addEventListener('change',()=>{validateFiles();const names=[...$('#files').files].map(f=>f.name);$('#file-names').textContent=names.length?names.join(', '):'Файлы не выбраны'});
  const form=$('#lead-form');let started=false,sending=false;
  const start=()=>{if(!started){started=true;goal('form_start')}};
  form.addEventListener('input',start);form.addEventListener('change',start);
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending)return;
    $('#form-error').textContent='';
    if(!validContact(contact.value.trim())){
      $('#contact-error').textContent='Укажите телефон полностью или имя в мессенджере в формате @имя.';
      contact.setAttribute('aria-invalid','true');contact.focus();return;
    }
    if(!validateFiles()){$('#files').focus();return;}
    const data=new FormData(form);
    data.set('phone',isPhone(contact.value)?'+'+phoneDigits(contact.value):contact.value.trim());
    data.set('form','calc');data.set('g',group);data.set('hero',hero);data.set('material',material);
    for(const [key,value] of params)if(/^utm_/i.test(key)||key==='yclid')data.append(key,value);
    if(!$('#files').files.length)data.delete('files[]');
    const button=$('button[type=submit]',form);const original=button.textContent;
    sending=true;button.disabled=true;button.textContent='Отправляем…';form.setAttribute('aria-busy','true');
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch(config.FORM_ENDPOINT,{method:'POST',body:data,signal:controller.signal,headers:{Accept:'application/json'}});
      if(!response.ok||!(response.headers.get('content-type')||'').includes('application/json'))throw new Error('Response not acknowledged');
      const result=await response.json();if(result.ok!==true&&result.success!==true)throw new Error('Not saved');
      form.hidden=true;$('#success').hidden=false;$('#success').focus();goal('lead_calc');
    }catch(_){$('#form-error').textContent='Не получилось отправить. Позвоните 8 (800) 600-05-31 или попробуйте ещё раз.';}
    finally{clearTimeout(timeout);sending=false;button.disabled=false;button.textContent=original;form.removeAttribute('aria-busy');}
  });
  const bar=$('.mobile-bar');
  new IntersectionObserver(entries=>{for(const entry of entries)bar.hidden=entry.isIntersecting||scrollY<$('#opening').offsetHeight/2},{threshold:0}).observe($('#opening'));
  document.addEventListener('focusin',event=>{if(event.target.matches('input,select'))bar.classList.add('is-input')});
  document.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!document.activeElement.matches('input,select'))bar.classList.remove('is-input')}));
  if(config.METRIKA_ID){
    window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();
    const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js';document.head.append(script);
    window.ym(config.METRIKA_ID,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
  }
})();
