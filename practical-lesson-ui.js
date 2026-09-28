(() => {
  if(typeof topics==='undefined'||typeof state==='undefined'||typeof renderTopic!=='function') return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  const apparatusSvg=(items,title)=>{
    const shown=(items||[]).slice(0,5);
    const pos=[[80,80],[500,80],[80,270],[500,270],[290,335]];
    const boxes=shown.map((item,i)=>`<g><rect x="${pos[i][0]}" y="${pos[i][1]}" width="180" height="72" rx="14"/><text x="${pos[i][0]+90}" y="${pos[i][1]+31}" text-anchor="middle">${esc(item).slice(0,28)}</text><text x="${pos[i][0]+90}" y="${pos[i][1]+51}" text-anchor="middle" class="small">${i+1}</text><line x1="${pos[i][0]+90}" y1="${pos[i][1]+72}" x2="380" y2="215"/></g>`).join('');
    return `<svg class="practical-apparatus-svg" viewBox="0 0 760 430" role="img" aria-label="Apparatus schematic for ${esc(title)}"><rect width="760" height="430" rx="24" class="bg"/><circle cx="380" cy="215" r="74" class="hub"/><text x="380" y="205" text-anchor="middle" class="hub-title">Practical</text><text x="380" y="229" text-anchor="middle" class="hub-sub">setup</text>${boxes}</svg>`;
  };
  function contextFor(deck){
    const topic=activeTopic();if(!topic)return null;
    const title=deck.querySelector('.presentation-title-copy h2')?.textContent?.trim();if(!title)return null;
    const index=topic.lessons.findIndex(x=>x?.[0]===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index)||null;
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);if(!model)return null;
    const practical=window.GCSE_PRACTICAL_LESSON_ENGINE?.build?.(topic,title,model);if(!practical)return null;
    return {topic,title,index,lesson,model,practical};
  }
  function panel(ctx){
    const p=ctx.practical;
    return `<section class="practical-presentation-coach" data-practical-coach>
      <header><div><span class="eyebrow">Required practical lesson</span><h3>Plan → measure → analyse → evaluate</h3><p>${esc(p.reference)}</p></div><button type="button" data-practical-save>Save plan to notebook</button></header>
      <div class="practical-phase-tabs" role="tablist"><button class="active" type="button" data-practical-tab="before">Before</button><button type="button" data-practical-tab="during">During</button><button type="button" data-practical-tab="after">After</button><button type="button" data-practical-tab="exam">Exam</button></div>
      <div class="practical-phase active" data-practical-panel="before">
        <div class="practical-two-col"><section><h4>Purpose</h4><p>${esc(p.before.purpose)}</p><h4>Theory</h4><p>${esc(p.before.theory)}</p><div class="practical-prediction"><strong>Predict first</strong><p>${esc(p.before.prediction)}</p><textarea rows="3" placeholder="Write your prediction and scientific reason…"></textarea></div></section><section>${apparatusSvg(p.apparatus,ctx.title)}<h4>Apparatus</h4><ul>${p.apparatus.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section></div>
        <div class="variable-grid"><article><strong>Independent</strong><p>${esc(p.variables.independent)}</p></article><article><strong>Dependent</strong><p>${esc(p.variables.dependent)}</p></article><article><strong>Controls</strong><ul>${p.variables.controls.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article></div>
      </div>
      <div class="practical-phase" data-practical-panel="during" hidden>
        <div class="practical-two-col"><section><h4>Method builder</h4><ol class="practical-method-list">${p.during.method.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section><section><h4>Safety controls</h4><ul class="practical-safety-list">${p.during.safety.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button type="button" data-practical-lab>Open Practical Lab →</button></section></div>
        <h4>Live results table</h4><div class="practical-table-wrap"><table><thead><tr>${p.during.table.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${Array.from({length:4},()=>`<tr>${p.during.table.map(()=>'<td><input type="text" aria-label="Practical result entry"></td>').join('')}</tr>`).join('')}</tbody></table></div><p class="muted">Record every result first. Identify anomalies rather than deleting them silently.</p>
      </div>
      <div class="practical-phase" data-practical-panel="after" hidden>
        <div class="practical-after-grid"><article><strong>Graph / processing</strong><p>${esc(p.after.analysis)}</p></article><article><strong>Conclusion</strong><p>${esc(p.after.conclusion)}</p></article><article><strong>Uncertainty</strong><p>${esc(p.after.uncertainty)}</p></article></div>
        <h4>Evaluate the evidence</h4><ul>${p.after.evaluation.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><textarea rows="4" data-practical-evaluation placeholder="Write a specific limitation → improvement → why it improves the evidence…"></textarea>
      </div>
      <div class="practical-phase" data-practical-panel="exam" hidden>
        <span class="question-command">Evaluate</span><span class="question-marks">4 marks</span><h4>${esc(p.exam.question)}</h4><textarea rows="5" data-practical-exam-answer placeholder="Write your exam answer before revealing the mark points…"></textarea><details><summary>Reveal marking points</summary><ul>${p.exam.marking.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>
      </div>
    </section>`;
  }
  function bind(coach,ctx){
    coach.querySelectorAll('[data-practical-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      coach.querySelectorAll('[data-practical-tab]').forEach(x=>x.classList.toggle('active',x===btn));
      coach.querySelectorAll('[data-practical-panel]').forEach(p=>{const on=p.dataset.practicalPanel===btn.dataset.practicalTab;p.hidden=!on;p.classList.toggle('active',on);});
    }));
    coach.querySelector('[data-practical-lab]')?.addEventListener('click',()=>{state.activeTab='practicals';renderTopic();});
    coach.querySelector('[data-practical-save]')?.addEventListener('click',()=>{
      const p=ctx.practical;const text=[p.reference,p.before.purpose,`IV: ${p.variables.independent}`,`DV: ${p.variables.dependent}`,`Controls: ${p.variables.controls.join('; ')}`,`Method: ${p.during.method.join(' ')}`,`Analysis: ${p.after.analysis}`].join('\n');
      window.GCSE_COURSE_POLISH?.addNote?.(text,`${ctx.title} · practical plan`,'practical-plan');
    });
  }
  function upgrade(deck){
    if(deck.dataset.phase7Practical==='done')return;
    deck.dataset.phase7Practical='done';
    const ctx=contextFor(deck);if(!ctx)return;
    const target=deck.querySelector('.slide-spec')||deck.querySelector('.slide-practice');if(!target)return;
    target.insertAdjacentHTML('beforeend',panel(ctx));
    bind(target.querySelector('[data-practical-coach]'),ctx);
  }
  function scan(){document.querySelectorAll('.lesson-presentation').forEach(upgrade);}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(scan);
  window.GCSE_PRACTICAL_LESSON_UI={scan};
})();