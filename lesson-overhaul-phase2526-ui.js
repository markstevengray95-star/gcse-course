(() => {
  if(typeof topics==='undefined'||typeof state==='undefined')return;
  const MODEL_KEY='gcse-science-interactive-models-v1';
  const VIDEO_KEY='gcse-science-video-decisions-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=(key,f={})=>{try{return JSON.parse(localStorage.getItem(key)||'')||f}catch{return f}};
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const activeTopic=()=>topics.find(t=>t.id===state.activeTopicId);
  let modelStore=parse(MODEL_KEY,{}),videoStore=parse(VIDEO_KEY,{}),videoTimer=null;

  function context(deck){
    const topic=activeTopic();if(!topic)return null;
    const lessons=typeof visibleLessons==='function'?visibleLessons(topic):topic.lessons;
    const title=deck.dataset.lessonTitle||'';const index=lessons.findIndex(([name])=>name===title);if(index<0)return null;
    const lesson=window.GCSE_RICH_CONTENT?.getLesson?.(topic,title,index);
    const model=window.GCSE_LESSON_PRESENTATION_CATALOG?.build?.(topic,title,index,lesson);
    if(!model?.overhaul25||!model?.overhaul26)return null;
    return{topic,title,index,lesson,model,key:model.id};
  }

  function modelState(ctx){modelStore[ctx.key]||={stage:0,variable:50,answers:{}};return modelStore[ctx.key];}
  function videoState(ctx){videoStore[ctx.key]||={pause:0,answers:{},completed:[],playing:false,progress:0};return videoStore[ctx.key];}
  const persistModels=()=>save(MODEL_KEY,modelStore),persistVideos=()=>save(VIDEO_KEY,videoStore);

  function modelGraphic(ctx,s){
    const phase=ctx.model.overhaul25,stage=phase.stages[s.stage]||phase.stages[0],pct=Math.max(0,Math.min(100,Number(s.variable)||0));
    return `<div class="phase25-model-canvas" data-phase25-canvas data-model-level="${pct<34?'low':pct>66?'high':'mid'}"><div class="model-system-line"><span class="model-node input">Input</span><i></i><span class="model-node mechanism">Mechanism</span><i></i><span class="model-node outcome">Outcome</span></div><div class="model-pulse" style="--model-pos:${pct}%"></div><div class="model-stage-copy"><small>${esc(phase.modelType.replace(/-/g,' '))}</small><strong>${esc(stage.heading)}</strong><p>${esc(stage.explanation)}</p><em>${esc(stage.focus)}</em></div></div>`;
  }

  function phase25Html(ctx){
    const phase=ctx.model.overhaul25,s=modelState(ctx),stage=phase.stages[s.stage]||phase.stages[0],saved=s.answers[stage.id];
    return `<section class="phase25-interactive-model" data-phase25-model data-lesson-key="${esc(ctx.key)}"><div class="phase2526-head"><div><span class="eyebrow">Phase 25 · Interactive Diagrams & Models</span><h3>Explore the ${esc(phase.modelType.replace(/-/g,' '))}</h3><p>Move through four stages, change a model condition and make a mini-decision before the explanation is revealed.</p></div><span class="phase2526-badge">${esc(phase.identity)}</span></div><div class="phase25-stage-tabs">${phase.stages.map((x,i)=>`<button type="button" data-model-stage="${i}" class="${i===s.stage?'active':''}">${esc(x.label)}</button>`).join('')}</div>${modelGraphic(ctx,s)}<div class="phase25-variable"><label><span>${esc(phase.variableLabel)}</span><input type="range" min="0" max="100" value="${Number(s.variable)||50}" data-model-variable><small><b>Lower</b><b>Higher</b></small></label><p data-model-state-copy>${Number(s.variable)<50?esc(phase.lowState):esc(phase.highState)}</p></div><div class="phase25-decision"><span class="eyebrow">Mini-decision</span><h4>${esc(stage.decision.prompt)}</h4><div class="phase25-choice-grid">${stage.decision.choices.map(choice=>`<button type="button" data-model-choice="${esc(choice.id)}" class="${saved?.choice===choice.id?'selected':''}">${esc(choice.id)} · ${esc(choice.text)}</button>`).join('')}</div><div class="phase25-feedback" ${saved?'':'hidden'} data-model-feedback><strong>${saved?.correct?'✓ Scientific choice':'↺ Reconsider'}</strong><p>${esc(stage.decision.feedback)}</p></div></div><div class="phase25-footer"><span>${phase.vocabulary.length?`Key language: ${phase.vocabulary.map(esc).join(' · ')}`:'Use precise scientific vocabulary from this lesson.'}</span><button type="button" data-model-note>＋ Save model insight</button></div></section>`;
  }

  function sceneHtml(ctx,v){
    const phase=ctx.model.overhaul26,pause=phase.pauses[Math.max(0,Math.min(v.pause,phase.pauses.length-1))],saved=v.answers[pause.id],progress=Math.max(0,Math.min(100,v.progress||0));
    return `<div class="phase26-player" data-phase26-player><div class="phase26-screen ${v.playing?'is-playing':''}"><div class="phase26-scene-art"><span></span><i></i><b></b></div><div class="phase26-scene-copy"><small>${esc(pause.label)} · ${pause.time}s</small><strong>${esc(pause.scene)}</strong></div><div class="phase26-progress"><i style="width:${progress}%"></i></div></div><div class="phase26-player-controls"><button type="button" data-video-play>${v.playing?'Pause':'▶ Play scenario'}</button><button type="button" data-video-restart>↺ Restart</button><span>${v.completed.length}/${phase.pauses.length} decisions complete</span></div><div class="phase26-decision"><span class="eyebrow">Decision point</span><h4>${esc(pause.prompt)}</h4><div class="phase26-choice-grid">${pause.choices.map(choice=>`<button type="button" data-video-choice="${esc(choice.id)}" class="${saved?.choice===choice.id?'selected':''}">${esc(choice.id)} · ${esc(choice.text)}</button>`).join('')}</div>${saved?`<div class="phase26-consequence ${saved.correct?'correct':'retry'}"><strong>${saved.correct?'✓ Strong decision':'↺ Think again'}</strong><p>${esc(saved.consequence)}</p><small>${esc(pause.feedback)}</small></div>`:''}</div><div class="phase26-pause-nav">${phase.pauses.map((x,i)=>`<button type="button" data-video-pause="${i}" class="${i===v.pause?'active':''} ${v.completed.includes(x.id)?'complete':''}">${i+1}</button>`).join('')}</div>`;
  }

  function phase26Html(ctx){
    const phase=ctx.model.overhaul26,v=videoState(ctx);return `<section class="phase26-video-decisions" data-phase26-video data-lesson-key="${esc(ctx.key)}"><div class="phase2526-head"><div><span class="eyebrow">Phase 26 · Video Decision Points</span><h3>${esc(phase.scenarioTitle)}</h3><p>${esc(phase.transcriptIntro)}</p></div><span class="phase2526-badge">3 pause points</span></div>${sceneHtml(ctx,v)}<details class="phase26-transcript"><summary>Accessible transcript</summary>${phase.pauses.map((p,i)=>`<article><strong>${i+1}. ${esc(p.label)}</strong><p>${esc(p.scene)}</p><small>${esc(p.feedback)}</small></article>`).join('')}</details><div class="phase26-complete ${v.completed.length===phase.pauses.length?'is-complete':''}"><strong>${v.completed.length===phase.pauses.length?'✓ Scenario complete':'Scenario progress'}</strong><span>${esc(phase.completionPrompt)}</span></div></section>`;
  }

  function stopVideo(){if(videoTimer){clearInterval(videoTimer);videoTimer=null;}}
  function renderModel(panel,ctx){panel.outerHTML=phase25Html(ctx);const next=ctx.deck.parentElement?.querySelector(`[data-phase25-model][data-lesson-key="${ctx.key.replace(/"/g,'\\"')}"]`);if(next)bindModel(next,ctx);}
  function renderVideo(panel,ctx){panel.outerHTML=phase26Html(ctx);const next=ctx.deck.parentElement?.querySelector(`[data-phase26-video][data-lesson-key="${ctx.key.replace(/"/g,'\\"')}"]`);if(next)bindVideo(next,ctx);}

  function bindModel(panel,ctx){
    const s=modelState(ctx),phase=ctx.model.overhaul25;
    panel.querySelectorAll('[data-model-stage]').forEach(btn=>btn.addEventListener('click',()=>{s.stage=Number(btn.dataset.modelStage);persistModels();renderModel(panel,ctx);}));
    panel.querySelector('[data-model-variable]')?.addEventListener('input',e=>{s.variable=Number(e.target.value);persistModels();const copy=panel.querySelector('[data-model-state-copy]');if(copy)copy.textContent=s.variable<50?phase.lowState:phase.highState;const pulse=panel.querySelector('.model-pulse');if(pulse)pulse.style.setProperty('--model-pos',`${s.variable}%`);});
    panel.querySelectorAll('[data-model-choice]').forEach(btn=>btn.addEventListener('click',()=>{const stage=phase.stages[s.stage],choice=stage.decision.choices.find(x=>x.id===btn.dataset.modelChoice);s.answers[stage.id]={choice:choice.id,correct:choice.correct};persistModels();renderModel(panel,ctx);}));
    panel.querySelector('[data-model-note]')?.addEventListener('click',()=>{const stage=phase.stages[s.stage],answer=s.answers[stage.id];window.GCSE_COURSE_POLISH?.addNote?.(`${ctx.title} · Interactive model\n${stage.heading}\n${stage.explanation}\n${answer?`Decision: ${answer.choice} · ${stage.decision.feedback}`:''}`,`${ctx.title} · interactive model`,'interactive-model');});
  }

  function bindVideo(panel,ctx){
    const v=videoState(ctx),phase=ctx.model.overhaul26;
    panel.querySelectorAll('[data-video-choice]').forEach(btn=>btn.addEventListener('click',()=>{const pause=phase.pauses[v.pause],choice=pause.choices.find(x=>x.id===btn.dataset.videoChoice);v.answers[pause.id]={choice:choice.id,correct:choice.correct,consequence:choice.consequence};if(choice.correct&&!v.completed.includes(pause.id))v.completed.push(pause.id);v.playing=false;stopVideo();persistVideos();renderVideo(panel,ctx);}));
    panel.querySelectorAll('[data-video-pause]').forEach(btn=>btn.addEventListener('click',()=>{v.pause=Number(btn.dataset.videoPause);v.playing=false;v.progress=Math.round((v.pause/phase.pauses.length)*100);stopVideo();persistVideos();renderVideo(panel,ctx);}));
    panel.querySelector('[data-video-restart]')?.addEventListener('click',()=>{stopVideo();videoStore[ctx.key]={pause:0,answers:{},completed:[],playing:false,progress:0};persistVideos();renderVideo(panel,ctx);});
    panel.querySelector('[data-video-play]')?.addEventListener('click',()=>{
      if(v.playing){v.playing=false;stopVideo();persistVideos();renderVideo(panel,ctx);return;}
      v.playing=true;persistVideos();renderVideo(panel,ctx);const fresh=ctx.deck.parentElement?.querySelector(`[data-phase26-video][data-lesson-key="${ctx.key.replace(/"/g,'\\"')}"]`);if(!fresh)return;
      stopVideo();videoTimer=setInterval(()=>{v.progress=Math.min(100,(v.progress||0)+2);const bar=fresh.querySelector('.phase26-progress i');if(bar)bar.style.width=`${v.progress}%`;const target=((v.pause+1)/phase.pauses.length)*100;if(v.progress>=target){v.playing=false;stopVideo();persistVideos();const play=fresh.querySelector('[data-video-play]');if(play)play.textContent='▶ Continue scenario';}},180);
    });
  }

  function inject(deck){
    const ctx=context(deck);if(!ctx)return;ctx.deck=deck;const parent=deck.parentElement;if(!parent)return;
    let phase25=parent.querySelector('[data-phase25-model]');if(!phase25){const anchor=parent.querySelector('[data-phase24-expert]')||parent.querySelector('[data-phase23-team-quiz]')||parent.querySelector('.lesson-presentation-mastery')||deck;anchor.insertAdjacentHTML('afterend',phase25Html(ctx));phase25=anchor.nextElementSibling;bindModel(phase25,ctx);}
    let phase26=parent.querySelector('[data-phase26-video]');if(!phase26){phase25.insertAdjacentHTML('afterend',phase26Html(ctx));phase26=phase25.nextElementSibling;bindVideo(phase26,ctx);}
  }
  function scan(){if(state.activeTab!=='lessons')return;document.querySelectorAll('.lesson-presentation').forEach(inject);}
  new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(scan);
  window.GCSE_LESSON_OVERHAUL_PHASE2526_UI={scan,inject,modelState,videoState};
})();
