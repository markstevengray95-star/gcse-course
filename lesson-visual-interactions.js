(() => {
  if(typeof state==='undefined') return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function classify(svg){
    const t=(svg.getAttribute('aria-label')||'').toLowerCase();
    const classes=[...svg.querySelectorAll('*')].map(x=>x.getAttribute('class')||'').join(' ').toLowerCase();
    const text=`${t} ${classes}`;
    if(/wave/.test(text))return 'wave'; if(/circuit|resistor|current/.test(text))return 'circuit'; if(/particle|state|gas/.test(text))return 'particles';
    if(/membrane|diffusion|osmosis/.test(text))return 'membrane'; if(/force|newton|momentum|pressure/.test(text))return 'forces'; if(/energy|profile/.test(text))return 'energy';
    if(/enzyme/.test(text))return 'enzyme'; if(/cell|dna|chromosome|heart|circul|ecolog|feedback/.test(text))return 'biology'; if(/atom|bond|electrolysis|chromat/.test(text))return 'chemistry';
    return 'concept';
  }
  function prediction(kind,title){
    const map={
      wave:[`Predict what happens if the modelled amplitude is increased.`,`Amplitude increases, but changing amplitude alone does not change the wave frequency.`],
      circuit:[`At constant potential difference, predict the effect of increasing resistance on current.`,`Current decreases because I = V/R when potential difference is constant.`],
      particles:[`Predict the effect of increasing temperature on particle motion.`,`Average kinetic energy increases, so particles move faster.`],
      membrane:[`Predict the effect of a steeper concentration gradient on net diffusion rate, with other factors unchanged.`,`A steeper concentration gradient increases the net rate of diffusion.`],
      forces:[`Predict the motion if the resultant force becomes larger in the direction of travel.`,`Acceleration increases for the same mass because F = ma.`],
      energy:[`Predict what happens to dissipated energy when efficiency decreases for the same total input.`,`A larger fraction of the input is transferred to non-useful stores.`],
      enzyme:[`Predict what happens to enzyme activity if temperature rises far beyond the optimum.`,`Activity falls because the active site changes shape as the enzyme denatures.`]
    };
    return map[kind]||[`Before revealing the next part, predict what change you would expect in ${title}.`,`Use the scientific relationship shown in the diagram to justify your prediction.`];
  }

  function addVariableControl(panel,svg,kind){
    if(panel.querySelector('[data-visual-variable]'))return;
    const supported={wave:['Amplitude model','Low','High'],particles:['Temperature model','Cooler','Hotter'],membrane:['Concentration gradient','Shallow','Steep'],circuit:['Resistance model','Lower R','Higher R'],forces:['Resultant force model','Smaller','Larger']};
    const config=supported[kind];if(!config)return;
    panel.insertAdjacentHTML('beforeend',`<div class="visual-variable" data-visual-variable><label><span>${config[0]}</span><input type="range" min="0" max="100" value="50"><small><b>${config[1]}</b><b>${config[2]}</b></small></label><p data-variable-feedback></p></div>`);
    const input=panel.querySelector('[data-visual-variable] input'),fb=panel.querySelector('[data-variable-feedback]');
    const update=()=>{
      const n=Number(input.value),level=n<34?'low':n>66?'high':'mid';panel.dataset.modelLevel=level;
      if(kind==='wave'){
        const wave=svg.querySelector('.lesson-wave');if(wave){wave.style.transformOrigin='center';wave.style.transform=`scaleY(${0.55+n/110})`;}
        fb.textContent=`Schematic amplitude: ${level}. Frequency is not being changed by this control.`;
      }else if(kind==='particles'){
        svg.style.setProperty('--particle-speed',`${Math.max(.4,2.2-n/60)}s`);fb.textContent=`Temperature model: ${level}. Higher temperature represents greater average particle kinetic energy.`;
      }else if(kind==='membrane')fb.textContent=`Gradient model: ${level}. A steeper gradient gives faster net diffusion when other factors are unchanged.`;
      else if(kind==='circuit')fb.textContent=`Resistance model: ${level}. At fixed potential difference, increasing resistance reduces current.`;
      else if(kind==='forces')fb.textContent=`Resultant-force model: ${level}. For constant mass, a larger resultant force gives a larger acceleration.`;
    };
    input.addEventListener('input',update);update();
  }

  function enhanceVisual(wrapper){
    if(wrapper.dataset.visualInteractive==='true')return;const svg=wrapper.querySelector('svg.lesson-specific-diagram');if(!svg)return;
    wrapper.dataset.visualInteractive='true';const title=svg.getAttribute('aria-label')||'Scientific diagram',kind=classify(svg),[question,answer]=prediction(kind,title);
    wrapper.insertAdjacentHTML('beforeend',`<div class="lesson-visual-controls" data-lesson-visual-controls><button type="button" data-label-test>Test labels</button><button type="button" data-label-next>Reveal next label</button><button type="button" data-process-step>Step process</button><button type="button" data-process-reset>Reset</button><button type="button" data-visual-zoom>Zoom ⛶</button><button type="button" data-visual-save>＋ Notebook</button></div><section class="visual-prediction"><span class="eyebrow">Predict before reveal</span><p>${esc(question)}</p><button type="button" data-prediction-reveal>Reveal explanation</button><p data-prediction-answer hidden>${esc(answer)}</p></section>`);
    const panel=wrapper.querySelector('[data-lesson-visual-controls]'),labels=[...svg.querySelectorAll('.lesson-diagram-label')],steps=[...svg.querySelectorAll('.lesson-diagram-arrow,.lesson-diagram-node,.lesson-particle,.lesson-electron,.lesson-ion-positive,.lesson-ion-negative')];
    let labelIndex=0,stepIndex=0;
    panel.querySelector('[data-label-test]').addEventListener('click',()=>{wrapper.classList.add('visual-label-test');labels.forEach(x=>x.classList.remove('visual-label-revealed'));labelIndex=0;});
    panel.querySelector('[data-label-next]').addEventListener('click',()=>{wrapper.classList.add('visual-label-test');if(labels[labelIndex])labels[labelIndex++].classList.add('visual-label-revealed');});
    panel.querySelector('[data-process-step]').addEventListener('click',()=>{if(!steps.length)return;wrapper.classList.add('visual-process-test');steps.forEach((x,i)=>x.classList.toggle('visual-step-visible',i<stepIndex));if(steps[stepIndex])steps[stepIndex].classList.add('visual-step-visible');stepIndex=Math.min(stepIndex+1,steps.length);});
    panel.querySelector('[data-process-reset]').addEventListener('click',()=>{wrapper.classList.remove('visual-label-test','visual-process-test','visual-zoomed');labels.forEach(x=>x.classList.remove('visual-label-revealed'));steps.forEach(x=>x.classList.remove('visual-step-visible'));labelIndex=0;stepIndex=0;});
    panel.querySelector('[data-visual-zoom]').addEventListener('click',()=>{if(wrapper.requestFullscreen)wrapper.requestFullscreen();else wrapper.classList.toggle('visual-zoomed');});
    panel.querySelector('[data-visual-save]').addEventListener('click',()=>{const labelText=labels.map(x=>x.textContent.trim()).filter(Boolean).join(' · ');window.GCSE_COURSE_POLISH?.addNote?.(`${title}${labelText?`\nLabels: ${labelText}`:''}\nPrediction: ${question}\n${answer}`,`${title} · interactive diagram`,'lesson-visual');});
    wrapper.parentElement?.querySelector('[data-prediction-reveal]')?.addEventListener('click',e=>{const ans=e.currentTarget.parentElement.querySelector('[data-prediction-answer]');ans.hidden=false;e.currentTarget.disabled=true;});
    addVariableControl(wrapper,svg,kind);
  }

  function enhance(){document.querySelectorAll('#topicContent .lesson-specific-visual').forEach(enhanceVisual);}
  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.body,{childList:true,subtree:true});requestAnimationFrame(enhance);
  window.GCSE_LESSON_VISUAL_INTERACTIONS={enhance,enhanceVisual,classify,prediction};
})();