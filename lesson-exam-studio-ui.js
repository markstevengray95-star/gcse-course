(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const KEY='gcse-science-exam-studio-v1';
  const parse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  let saved=parse(localStorage.getItem(KEY),{});
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  function ctxFor(deck){
    const topic=activeTopic();if(!topic)return null;
    const title=deck.dataset.lessonTitle||deck.querySelector('.presentation-title-copy h2')?.textContent?.trim();if(!title)return null;
    const index=topic.lessons.findIndex(x=>x?.[0]===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    model.subject=topic.subject;
    const practical=window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,title,model)||null;
    const pack=window.GCSE_LESSON_EXAM_STUDIO?.build?.(model,practical);if(!pack)return null;
    const key=window.GCSE_COURSE_AUDIT_FIXES?.stableKey?.(topic.id,title)||`lesson:${topic.id}:${encodeURIComponent(title)}`;
    return{topic,title,index,lesson,model,practical,pack,key};
  }
  const qKey=(ctx,q)=>`${ctx.key}:${q.id}`;
  function stored(ctx,q){return saved[qKey(ctx,q)]||{answer:'',checked:[],teacherScore:null,mode:'self'};}
  function save(ctx,q,data){saved[qKey(ctx,q)]={...stored(ctx,q),...data,updated:Date.now()};localStorage.setItem(KEY,JSON.stringify(saved));}
  function scoreFor(ctx,q){const s=stored(ctx,q);if(s.mode==='teacher'&&Number.isFinite(Number(s.teacherScore)))return Math.max(0,Math.min(q.marks,Number(s.teacherScore)));return Math.min(q.marks,(s.checked||[]).length);}
  function card(ctx,q){
    const s=stored(ctx,q);const guide=ctx.pack.commandGuide[q.command]||'';
    return `<article class="exam-studio-question" data-exam-question="${esc(q.id)}"><header><div><span class="exam-command">${esc(q.command)}</span><strong>${esc(q.section)}</strong></div><span>${q.marks} marks</span></header><details class="exam-command-coach"><summary>Command word coach</summary><p>${esc(guide)}</p></details><h4>${esc(q.prompt)}</h4><textarea rows="5" data-exam-answer placeholder="Write your full answer before revealing the marking guidance…">${esc(s.answer||'')}</textarea><div class="exam-question-actions"><button type="button" data-exam-reveal>Reveal indicative mark scheme</button><button type="button" data-exam-revisit>Revisit relevant slide</button><button type="button" data-exam-save-note>Save answer to notebook</button></div><section class="exam-marking" data-exam-marking hidden><p class="exam-indicative-note">Indicative practice guidance — not an official AQA mark scheme.</p><div class="exam-marker-mode"><button type="button" data-marker-mode="self" class="${s.mode!=='teacher'?'active':''}">Self mark</button><button type="button" data-marker-mode="teacher" class="${s.mode==='teacher'?'active':''}">Teacher mark</button></div><div class="exam-self-mark" data-self-mark>${q.marking.map((m,i)=>`<label><input type="checkbox" data-mark-point="${i}" ${s.checked?.includes(i)?'checked':''}><span>${esc(m.text)}</span></label>`).join('')}</div><div class="exam-teacher-mark" data-teacher-mark><label>Teacher score <input type="number" min="0" max="${q.marks}" step="1" value="${s.teacherScore??''}" data-teacher-score> / ${q.marks}</label></div><details class="exam-model-answer"><summary>Show model answer</summary><p>${esc(q.modelAnswer)}</p>${q.levelOfResponse?'<small>For extended responses, use this as indicative content rather than a point-per-mark official level descriptor.</small>':''}</details><div class="exam-question-score">Practice score: <strong data-question-score>${scoreFor(ctx,q)}</strong> / ${q.marks}</div></section></article>`;
  }
  function total(ctx,root){const score=ctx.pack.questions.reduce((n,q)=>n+scoreFor(ctx,q),0);const el=root.querySelector('[data-exam-total-score]');if(el)el.textContent=String(score);const done=ctx.pack.questions.filter(q=>stored(ctx,q).answer?.trim()).length;const progress=root.querySelector('[data-exam-progress]');if(progress)progress.textContent=`${done}/${ctx.pack.questions.length} answered · ${score}/${ctx.pack.totalMarks} marks`;}
  function revisit(deck,q){
    const candidates={specpoint:'.slide-specpoint',specapply:'.slide-specapply',worked:'.slide-worked',spec:'.slide-spec',exam:'.slide-exam'};
    const target=deck.querySelector(candidates[q.revisitType]||'.slide-teach');if(!target)return;
    const slides=[...deck.querySelectorAll('.presentation-slide')],idx=slides.indexOf(target);if(idx<0)return;
    window.GCSE_PRESENTATION_LESSONS?.showSlide?.(deck,idx);
    target.scrollIntoView?.({behavior:'smooth',block:'start'});
  }
  function bindQuestion(el,ctx,q,root,deck){
    const answer=el.querySelector('[data-exam-answer]');let timer=null;
    answer?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{save(ctx,q,{answer:answer.value});total(ctx,root);},200);});
    el.querySelector('[data-exam-reveal]')?.addEventListener('click',()=>{el.querySelector('[data-exam-marking]').hidden=false;});
    el.querySelector('[data-exam-revisit]')?.addEventListener('click',()=>revisit(deck,q));
    el.querySelector('[data-exam-save-note]')?.addEventListener('click',()=>{const text=answer?.value?.trim();if(text)window.GCSE_COURSE_POLISH?.addNote?.(`${q.command} · ${q.marks} marks\n${q.prompt}\n\nMy answer:\n${text}\n\nPractice score: ${scoreFor(ctx,q)}/${q.marks}`,`${ctx.title} · Exam Studio`,'exam-studio');});
    el.querySelectorAll('[data-marker-mode]').forEach(btn=>btn.addEventListener('click',()=>{save(ctx,q,{mode:btn.dataset.markerMode});el.querySelectorAll('[data-marker-mode]').forEach(x=>x.classList.toggle('active',x===btn));el.dataset.markerMode=btn.dataset.markerMode;total(ctx,root);}));
    el.querySelectorAll('[data-mark-point]').forEach(box=>box.addEventListener('change',()=>{const checked=[...el.querySelectorAll('[data-mark-point]:checked')].map(x=>Number(x.dataset.markPoint));save(ctx,q,{checked,mode:'self'});el.querySelector('[data-question-score]').textContent=String(scoreFor(ctx,q));total(ctx,root);}));
    el.querySelector('[data-teacher-score]')?.addEventListener('input',e=>{save(ctx,q,{teacherScore:e.target.value===''?null:Number(e.target.value),mode:'teacher'});el.querySelector('[data-question-score]').textContent=String(scoreFor(ctx,q));total(ctx,root);});
    el.dataset.markerMode=stored(ctx,q).mode||'self';
  }
  function upgrade(deck){
    if(deck.dataset.phase9ExamStudio==='done')return;const ctx=ctxFor(deck);if(!ctx)return;
    const examSlide=deck.querySelector('.slide-exam');if(!examSlide)return;deck.dataset.phase9ExamStudio='done';
    const section=document.createElement('section');section.className='lesson-exam-studio';section.dataset.examStudio='';
    section.innerHTML=`<div class="exam-studio-head"><div><span class="eyebrow">Phase 9 · Exam Studio</span><h3>Original AQA-style lesson exam pack</h3><p>${esc(ctx.pack.note)}</p></div><div class="exam-total"><strong><span data-exam-total-score>0</span> / ${ctx.pack.totalMarks}</strong><small data-exam-progress></small></div></div><div class="exam-studio-list">${ctx.pack.questions.map(q=>card(ctx,q)).join('')}</div><div class="exam-studio-footer"><button type="button" data-exam-save-pack>Save exam review to notebook</button></div>`;
    examSlide.appendChild(section);
    ctx.pack.questions.forEach(q=>{const el=section.querySelector(`[data-exam-question="${q.id}"]`);if(el)bindQuestion(el,ctx,q,section,deck);});
    section.querySelector('[data-exam-save-pack]')?.addEventListener('click',()=>{const lines=ctx.pack.questions.map(q=>`${q.command} (${q.marks}) — ${scoreFor(ctx,q)}/${q.marks}`).join('\n');window.GCSE_COURSE_POLISH?.addNote?.(`Exam Studio review · ${ctx.pack.totalMarks} marks\n${lines}`,`${ctx.title} · exam review`,'exam-studio-review');});
    total(ctx,section);
    const toolbar=deck.querySelector('.presentation-toolbar-actions');if(toolbar&&!toolbar.querySelector('[data-exam-chip]')){const chip=document.createElement('span');chip.className='exam-studio-chip';chip.dataset.examChip='';chip.textContent=`Exam ${ctx.pack.totalMarks}m`;toolbar.prepend(chip);}
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(upgrade);}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});requestAnimationFrame(scan);
  window.GCSE_LESSON_EXAM_STUDIO_UI={scan,upgrade};
})();