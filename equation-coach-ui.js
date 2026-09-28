(() => {
  if(typeof state==='undefined'||typeof topics==='undefined') return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const lessonFor=(topic,title,index)=>window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;

  function coachPanel(model,compact=false){
    const vars=(model.vars||[]).map(([s,n,u])=>`<tr><td><code>${esc(s)}</code></td><td>${esc(n)}</td><td>${esc(u)}</td></tr>`).join('');
    return `<section class="equation-coach-panel ${compact?'compact':''}" data-equation-coach-panel>
      <div class="equation-coach-head"><div><span class="eyebrow">Equation Coach</span><h3>${esc(model.equation)}</h3><p>${esc(model.meaning)}</p></div><button type="button" data-equation-save>＋ Notebook</button></div>
      <div class="equation-route">${model.route.map((x,i)=>`<span><b>${i+1}</b>${esc(x)}</span>`).join('')}</div>
      ${vars?`<div class="equation-symbols"><h4>Symbols & units</h4><table><thead><tr><th>Symbol</th><th>Meaning</th><th>Unit</th></tr></thead><tbody>${vars}</tbody></table></div>`:`<div class="equation-unit-note"><strong>Units</strong><p>${esc(model.unitGuidance)}</p></div>`}
      <div class="equation-unit-note"><strong>Unit check</strong><p>${esc(model.unitGuidance)}</p><div class="unit-check-actions"><button type="button" data-unit-choice="convert">Convert first</button><button type="button" data-unit-choice="substitute">Substitute immediately</button></div><p data-unit-feedback hidden></p></div>
      <div class="equation-rearrange"><h4>Rearrange before numbers</h4>${model.rearrange.map(x=>`<code>${esc(x)}</code>`).join('')}</div>
      <div class="equation-worked"><h4>Worked example</h4><ol>${model.worked.map((x,i)=>`<li data-calc-step="${i}" class="calc-step-hidden">${esc(x)}</li>`).join('')}</ol><div class="calc-reveal-controls"><button type="button" data-calc-next>Reveal next step</button><button type="button" data-calc-all>Reveal all</button><button type="button" data-calc-reset>Reset</button></div></div>
      <div class="equation-practice-grid"><article><span class="eyebrow">Scaffolded</span><p>${esc(model.scaffold)}</p><textarea rows="2" placeholder="Write the equation, rearrangement and substitution…"></textarea></article><article><span class="eyebrow">Independent</span><p>${esc(model.independent)}</p><textarea rows="2" placeholder="Solve independently…"></textarea></article></div>
      <div class="equation-exam"><strong>Exam application</strong><p>${esc(model.exam)}</p></div>
    </section>`;
  }

  function bindPanel(panel,model,title){
    const steps=[...panel.querySelectorAll('[data-calc-step]')];
    panel.querySelector('[data-calc-next]')?.addEventListener('click',()=>steps.find(x=>x.classList.contains('calc-step-hidden'))?.classList.remove('calc-step-hidden'));
    panel.querySelector('[data-calc-all]')?.addEventListener('click',()=>steps.forEach(x=>x.classList.remove('calc-step-hidden')));
    panel.querySelector('[data-calc-reset]')?.addEventListener('click',()=>steps.forEach(x=>x.classList.add('calc-step-hidden')));
    panel.querySelectorAll('[data-unit-choice]').forEach(btn=>btn.addEventListener('click',()=>{
      const fb=panel.querySelector('[data-unit-feedback]');fb.hidden=false;
      const good=btn.dataset.unitChoice==='convert';
      fb.className=good?'unit-feedback correct':'unit-feedback warning';
      fb.textContent=good?'Correct: make units compatible before substitution.':'Check first: substituting before unit conversion is a common source of lost marks.';
    }));
    panel.querySelector('[data-equation-save]')?.addEventListener('click',()=>{
      const responses=[...panel.querySelectorAll('textarea')].map(x=>x.value.trim()).filter(Boolean);
      const note=`${model.equation}\n${model.meaning}\n\n${model.vars?.map(x=>`${x[0]} = ${x[1]} (${x[2]})`).join('\n')||model.unitGuidance}${responses.length?`\n\nMy calculation practice:\n${responses.join('\n\n')}`:''}`;
      window.GCSE_COURSE_POLISH?.addNote?.(note,`${title} · Equation Coach`,'equation-coach');
    });
  }

  function rebuildNav(deck){
    const slides=[...deck.querySelectorAll('.presentation-slide')];
    slides.forEach((s,i)=>s.dataset.slideIndex=String(i));
    const dots=deck.querySelector('.presentation-dots');if(!dots)return;
    dots.innerHTML=slides.map((s,i)=>`<button type="button" data-slide-jump="${i}" aria-label="Go to slide ${i+1}" title="${esc(s.dataset.slideLabel||s.querySelector('h2,h3')?.textContent||`Slide ${i+1}`)}"><span></span></button>`).join('');
    dots.querySelectorAll('[data-slide-jump]').forEach(btn=>btn.addEventListener('click',()=>window.GCSE_PRESENTATION_LESSONS?.showSlide?.(deck,Number(btn.dataset.slideJump))));
    const current=Math.min(Number(deck.dataset.slide||0),slides.length-1);window.GCSE_PRESENTATION_LESSONS?.showSlide?.(deck,current);
  }

  function addSlides(deck,topic,title,index,lesson){
    if(deck.dataset.equationCoachEnhanced==='true')return;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model?.equations?.length){deck.dataset.equationCoachEnhanced='true';return;}
    const before=deck.querySelector('.slide-practice');if(!before)return;
    model.equations.forEach((eq,i)=>{
      const coach=window.GCSE_EQUATION_COACH?.build?.(eq,topic.subject);if(!coach)return;
      const slide=document.createElement('article');slide.className='presentation-slide slide-equationcoach';slide.hidden=true;slide.dataset.slideLabel=`Equation ${i+1}`;
      slide.innerHTML=`<div class="presentation-slide-heading"><span>Σ${i+1}</span><div><small>Calculation teaching</small><h2>Equation Coach · ${esc(eq)}</h2></div></div>${coachPanel(coach)}`;
      before.parentNode.insertBefore(slide,before);bindPanel(slide.querySelector('[data-equation-coach-panel]'),coach,title);
    });
    deck.dataset.equationCoachEnhanced='true';rebuildNav(deck);
  }

  function modal(){
    let d=document.getElementById('equationCoachDialog');if(d)return d;
    d=document.createElement('dialog');d.id='equationCoachDialog';d.className='equation-coach-dialog';d.innerHTML='<div class="equation-dialog-head"><strong>Equation Coach</strong><button type="button" data-equation-dialog-close>×</button></div><div data-equation-dialog-body></div>';
    document.body.appendChild(d);d.querySelector('[data-equation-dialog-close]').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;
  }

  function bindEquationChips(deck,title,topic){
    deck.querySelectorAll('.presentation-equations code').forEach(code=>{
      if(code.dataset.equationClickable)return;code.dataset.equationClickable='true';code.tabIndex=0;code.setAttribute('role','button');code.title='Open Equation Coach';
      const open=()=>{const m=window.GCSE_EQUATION_COACH?.build?.(code.textContent.trim(),topic.subject);if(!m)return;const d=modal(),body=d.querySelector('[data-equation-dialog-body]');body.innerHTML=coachPanel(m,true);bindPanel(body.querySelector('[data-equation-coach-panel]'),m,title);d.showModal?.();};
      code.addEventListener('click',open);code.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  function enhance(){
    const deck=document.querySelector('#topicContent .lesson-presentation');if(!deck||state.activeTab!=='lessons')return;
    const topic=activeTopic();if(!topic)return;const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;const index=Math.max(0,Math.min(state.activeLessonIndex,lessons.length-1));const title=lessons[index]?.[0];if(!title)return;
    const lesson=lessonFor(topic,title,index);if(!lesson)return;addSlides(deck,topic,title,index,lesson);bindEquationChips(deck,title,topic);
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(enhance);
  window.GCSE_EQUATION_COACH_UI={enhance,coachPanel,addSlides,rebuildNav};
})();