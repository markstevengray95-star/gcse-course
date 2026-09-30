(() => {
  const STORAGE_KEY='gcse-science-textbook-phase10-v1';
  const defaults={text:'standard',spacing:'standard',focus:false};
  const load=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return {...defaults}}};
  const save=s=>localStorage.setItem(STORAGE_KEY,JSON.stringify(s));

  function apply(reader,state){
    reader.classList.toggle('textbook-text-large',state.text==='large');
    reader.classList.toggle('textbook-spacing-relaxed',state.spacing==='relaxed');
    reader.classList.toggle('textbook-reading-focus',Boolean(state.focus));
    const large=reader.querySelector('[data-textbook-large-text]');if(large)large.setAttribute('aria-pressed',String(state.text==='large'));
    const spacing=reader.querySelector('[data-textbook-line-spacing]');if(spacing)spacing.setAttribute('aria-pressed',String(state.spacing==='relaxed'));
    const focus=reader.querySelector('[data-textbook-focus-reading]');if(focus){focus.setAttribute('aria-pressed',String(Boolean(state.focus)));focus.textContent=state.focus?'Exit focus':'Focus reading';}
    const status=reader.querySelector('[data-textbook-access-status]');if(status)status.textContent=`Text ${state.text}; spacing ${state.spacing}; focus ${state.focus?'on':'off'}.`;
  }

  function install(reader){
    if(!reader||reader.dataset.phaseT10==='done')return false;const state=load();const top=reader.querySelector('.textbook-reader-topbar'),main=reader.querySelector('.textbook-reader-main'),pages=reader.querySelector('[data-textbook-pages]');if(!top||!main||!pages)return false;
    if(!pages.id)pages.id=`textbook-reading-${reader.dataset.textbookTopic||'chapter'}`;
    const skip=document.createElement('a');skip.className='textbook-skip-link';skip.href=`#${pages.id}`;skip.textContent='Skip to textbook page';reader.prepend(skip);
    const tools=document.createElement('div');tools.className='textbook-reading-tools';tools.setAttribute('aria-label','Textbook reading controls');tools.innerHTML=`<button type="button" data-textbook-large-text aria-pressed="false" title="Toggle larger textbook text">A+ Text</button><button type="button" data-textbook-line-spacing aria-pressed="false" title="Toggle relaxed line spacing">↕ Spacing</button><button type="button" data-textbook-focus-reading aria-pressed="false">Focus reading</button><button type="button" data-textbook-print>Print chapter</button><span class="sr-only" role="status" aria-live="polite" data-textbook-access-status></span>`;
    top.appendChild(tools);
    tools.querySelector('[data-textbook-large-text]').addEventListener('click',()=>{state.text=state.text==='large'?'standard':'large';save(state);apply(reader,state);});
    tools.querySelector('[data-textbook-line-spacing]').addEventListener('click',()=>{state.spacing=state.spacing==='relaxed'?'standard':'relaxed';save(state);apply(reader,state);});
    tools.querySelector('[data-textbook-focus-reading]').addEventListener('click',()=>{state.focus=!state.focus;save(state);apply(reader,state);});
    tools.querySelector('[data-textbook-print]').addEventListener('click',()=>{reader.classList.add('textbook-print-all');requestAnimationFrame(()=>window.print());});
    window.addEventListener('afterprint',()=>reader.classList.remove('textbook-print-all'));
    reader.querySelectorAll('button,a,input,textarea,select,summary').forEach(el=>{if(!el.hasAttribute('tabindex'))el.tabIndex=0;});
    apply(reader,state);reader.dataset.phaseT10='done';return true;
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('#topicContent .textbook-reader').forEach(install));observer.observe(document.documentElement,{childList:true,subtree:true});document.querySelectorAll('#topicContent .textbook-reader').forEach(install);
  window.GCSE_TEXTBOOK_PHASE10={install,apply,storageKey:STORAGE_KEY};
})();