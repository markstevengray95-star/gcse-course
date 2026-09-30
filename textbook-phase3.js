(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const TX=window.GCSE_TEXTBOOK_ENHANCEMENTS;
  if(!DATA||!TX?.diagramPlan||typeof TX.visual!=='function')return;

  const STORAGE_KEY='gcse-science-textbook-phase3-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return{}}};
  let saved=readState();
  const persist=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));

  const LABELS={
    cell:['Cell membrane','Cytoplasm','Nucleus','Organelles'],membrane:['High concentration','Partially permeable membrane','Net water movement','Low concentration'],mitosis:['DNA copied','Chromosomes align','Chromosomes separate','Two identical cells'],
    digestive:['Food','Digestive enzymes','Small intestine','Absorption'],circulation:['Heart','Artery','Capillary','Vein'],planttransport:['Roots','Xylem','Leaves','Phloem'],pathogen:['Pathogen','Physical barrier','Immune response','Memory cells'],immunity:['Antigen','Lymphocyte','Antibody','Memory cell'],plantdefence:['Pathogen','Physical barrier','Chemical defence','Reduced infection'],
    photosynthesis:['Light + carbon dioxide + water','Chloroplast','Glucose','Oxygen'],respiration:['Glucose + oxygen','Respiration','Energy transfer','Carbon dioxide + water'],metabolism:['Nutrients','Cell reactions','Biomolecules','Energy transfer'],control:['Stimulus','Receptor','Coordinator','Effector'],nervous:['Stimulus','Sensory neurone','CNS','Motor response'],endocrine:['Change','Hormone','Target organ','Negative feedback'],dna:['DNA','Gene','Protein','Characteristic'],punnett:['Parental alleles','Gametes','Possible combinations','Genotype / phenotype'],selection:['Variation','Selection pressure','Survival and reproduction','Allele frequency change'],ecosystem:['Abiotic factors','Producer','Consumer','Decomposer'],foodweb:['Producer','Primary consumer','Secondary consumer','Decomposer'],carboncycle:['Carbon dioxide','Photosynthesis','Biomass','Respiration / decay'],
    atom:['Nucleus','Protons and neutrons','Electron shells','Atomic number'],periodic:['Atomic number','Group','Outer electrons','Chemical behaviour'],isotopes:['Same proton number','Different neutron number','Same element','Weighted relative atomic mass'],ionic:['Metal + non-metal','Electron transfer','Oppositely charged ions','Giant ionic lattice'],covalent:['Non-metal atoms','Shared electrons','Covalent bond','Molecule / network'],metallic:['Positive metal ions','Delocalised electrons','Electrostatic attraction','Electrical conductivity'],moles:['Mass','Amount in moles','Reacting ratio','Product amount'],limiting:['Reactant amounts','Convert to moles','Compare ratio','Limiting reactant'],concentration:['Solute amount','Solution volume','Concentration','Reaction quantity'],reactivity:['Metal','Electron loss','Reactivity series','Extraction method'],electrolysis:['Electrolyte','Mobile ions','Electrodes','Products'],acid:['Acid + base','Neutralisation','Salt solution','Crystals'],profile:['Reactants','Activation energy','Energy pathway','Products'],bondenergy:['Break bonds','Energy absorbed','Make bonds','Energy released'],energychange:['Reactants','Energy transfer','Products','Overall energy change'],collisions:['Reactant particles','Collision','Sufficient energy','Reaction'],rategraph:['Time axis','Quantity axis','Initial rate','Plateau'],equilibrium:['Closed system','Forward reaction','Reverse reaction','Equal rates'],hydrocarbon:['Crude oil','Fractions','Cracking','Useful molecules'],cracking:['Long-chain alkane','Heat + catalyst','Shorter alkane','Alkene'],organicfamilies:['Alkane','Alkene','Alcohol','Carboxylic acid'],chromatography:['Mixture','Stationary phase','Separated spots','Rf value'],gastests:['Unknown gas','Chemical test','Observation','Identification'],iontests:['Unknown ion','Reagent','Observation','Identification'],atmosphere:['Incoming sunlight','Earth surface','Infrared radiation','Greenhouse gases'],pollution:['Source','Pollutant','Atmosphere','Health / environmental effect'],lifecycle:['Raw material','Manufacture','Use','Disposal / recycling'],water:['Raw water','Filtration','Sterilisation','Potable water'],haber:['Nitrogen + hydrogen','Iron catalyst','Dynamic equilibrium','Ammonia'],
    energy:['Energy store','Transfer pathway','Useful output','Dissipation'],sankey:['Input energy','Useful transfer','Dissipated transfer','Efficiency'],heating:['Energy transferred','Mass','Specific heat capacity','Temperature change'],circuit:['Power supply','Current','Component','Potential difference'],ivgraph:['Potential difference axis','Current axis','Ohmic conductor','Filament / non-linear behaviour'],grid:['Generator','Step-up transformer','Transmission cables','Step-down transformer'],particles:['Particle arrangement','Heating','Internal energy','State change'],heatingcurve:['Temperature axis','Energy / time axis','Heating region','State-change plateau'],density:['Mass','Volume','Density','Material comparison'],decay:['Unstable nucleus','Radiation emitted','Random decay','Activity decreases'],penetration:['Alpha','Paper / skin','Beta / aluminium','Gamma / thick lead'],halflife:['Time axis','Activity / count rate','Halving interval','Exponential decay'],force:['Forces','Resultant force','Acceleration','Motion'],motiongraph:['Time axis','Motion quantity axis','Gradient','Changing motion'],momentum:['Before interaction','Total momentum','Collision / interaction','After interaction'],wave:['Amplitude','Wavelength','Frequency','Wave speed'],emspectrum:['Radio','Microwave / infrared','Visible / ultraviolet','X-ray / gamma'],refraction:['Incident ray','Normal','Boundary','Refracted ray'],magnet:['Magnet / current','Magnetic field','Force / induction','Device'],motor:['Current','Magnetic field','Force','Rotation'],transformer:['AC primary coil','Changing magnetic field','Secondary coil','Changed potential difference'],orbit:['Gravitational force','Circular motion','Orbit','Satellite / planet'],stars:['Nebula','Main sequence star','Giant / supergiant','Stellar remnant'],redshift:['Reference spectrum','Galaxy spectrum','Longer wavelength','Expanding Universe']
  };

  const TEST_PROMPTS={
    biology:'Name the labelled structures or stages, then explain how each one contributes to the biological process.',
    chemistry:'Name each labelled feature, then connect it to particles, bonding, electron transfer, evidence or the chemical change shown.',
    physics:'Name each labelled feature, then state the physical quantity, relationship or change represented by it.'
  };

  function topicFor(id){return DATA.topics?.find(t=>t.id===id);}
  function subjectName(topic){return DATA.subjects?.find(s=>s.id===topic?.subject)?.name||topic?.subject||'Science';}
  function profileFor(type,label,topic){
    const labels=LABELS[type]||String(label||'').split(/\s+(?:and|to|vs)\s+|[,–—:]/i).map(x=>x.trim()).filter(Boolean).slice(0,4);
    while(labels.length<4)labels.push(['Starting point','Key change','Scientific relationship','Outcome'][labels.length]);
    return{
      type,label,labels:labels.slice(0,5),
      testPrompt:TEST_PROMPTS[topic?.subject]||'Identify each feature and explain what it represents.',
      processPrompt:topic?.subject==='biology'?'Follow how the biological structure or process changes from one stage to the next.':topic?.subject==='chemistry'?'Follow the chemical sequence and connect each stage to particles, bonding, electrons or observable evidence.':'Follow the physical sequence and connect each stage to the quantities, forces, energy transfers or wave behaviour involved.'
    };
  }

  function stepExplanation(topic,profile,step,index){
    const n=index+1;
    if(topic.subject==='biology')return `Stage ${n}: ${step}. Explain what is happening here, then link the structure or process to the biological outcome that follows.`;
    if(topic.subject==='chemistry')return `Stage ${n}: ${step}. Describe what changes here and relate it to the particles, bonding, electrons or evidence shown by the diagram.`;
    return `Stage ${n}: ${step}. Identify the physical change or relationship at this stage and link it to the quantity, force, energy transfer or wave behaviour that follows.`;
  }

  function buildDiagramModel(topic,type,label,index=0){
    const profile=profileFor(type,label,topic);
    return{
      id:`${topic.id}-${type}-${index+1}`,topicId:topic.id,subject:topic.subject,type,label,
      labels:profile.labels,
      steps:profile.labels.map((step,i)=>({label:step,explanation:stepExplanation(topic,profile,step,i)})),
      testPrompt:profile.testPrompt,processPrompt:profile.processPrompt,
      svg:TX.visual(type,label)
    };
  }

  function getTopicState(topicId){
    if(!saved[topicId]||typeof saved[topicId]!=='object')saved[topicId]={diagram:0,mode:'learn'};
    return saved[topicId];
  }

  function enhanceVisualPage(reader){
    const topic=topicFor(reader?.dataset?.textbookTopic);if(!topic)return false;
    const page=reader.querySelector('.textbook-visual-page');if(!page||page.dataset.phaseT3==='done')return false;
    const plan=TX.diagramPlan?.[topic.id]||[];if(!plan.length)return false;
    const models=plan.map(([type,label],i)=>buildDiagramModel(topic,type,label,i));
    const rec=getTopicState(topic.id);rec.diagram=clamp(Number(rec.diagram)||0,0,models.length-1);if(!['learn','test','process'].includes(rec.mode))rec.mode='learn';

    page.innerHTML=`
      <header class="textbook-phase3-head">
        <span class="eyebrow">Visual learning · ${esc(subjectName(topic))}</span>
        <h2>Interactive diagram studio</h2>
        <p>Use each diagram in three ways: learn the labels, test yourself without them, then step through the scientific process.</p>
      </header>
      <nav class="textbook-diagram-tabs" aria-label="Choose a textbook diagram">
        ${models.map((m,i)=>`<button type="button" data-t3-diagram="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(m.label)}</strong></button>`).join('')}
      </nav>
      <section class="textbook-diagram-studio" data-t3-studio>
        <div class="textbook-diagram-toolbar">
          <div class="textbook-diagram-modes" role="group" aria-label="Diagram mode">
            <button type="button" data-t3-mode="learn">Learn</button>
            <button type="button" data-t3-mode="test">Test</button>
            <button type="button" data-t3-mode="process">Process</button>
          </div>
          <div class="textbook-diagram-view-tools" role="group" aria-label="Diagram view controls">
            <button type="button" data-t3-zoom-out aria-label="Zoom out">−</button><button type="button" data-t3-zoom-reset>100%</button><button type="button" data-t3-zoom-in aria-label="Zoom in">+</button><button type="button" data-t3-focus>Focus ⛶</button>
          </div>
        </div>
        <div class="textbook-diagram-stage-wrap">
          <div class="textbook-diagram-stage" data-t3-stage></div>
          <aside class="textbook-diagram-side" data-t3-side aria-live="polite"></aside>
        </div>
        <div class="textbook-diagram-caption" data-t3-caption></div>
      </section>`;

    let active=rec.diagram,mode=rec.mode,zoom=1,processStep=0,revealed=new Set(),activeLabel=0;
    const studio=page.querySelector('[data-t3-studio]'),stage=page.querySelector('[data-t3-stage]'),side=page.querySelector('[data-t3-side]'),caption=page.querySelector('[data-t3-caption]');

    function save(){rec.diagram=active;rec.mode=mode;persist();}
    function current(){return models[active];}
    function setZoom(next){zoom=clamp(next,.7,1.7);stage.style.setProperty('--diagram-zoom',zoom);page.querySelector('[data-t3-zoom-reset]').textContent=`${Math.round(zoom*100)}%`;}
    function renderLearn(model){
      side.innerHTML=`<div class="t3-side-head"><small>Learn mode</small><strong>Click a label</strong><p>Select each label and connect it to the visual.</p></div><div class="t3-label-list">${model.labels.map((x,i)=>`<button type="button" data-t3-label="${i}"><span>${i+1}</span>${esc(x)}</button>`).join('')}</div><div class="t3-label-explain"><strong>${esc(model.labels[activeLabel])}</strong><p>${esc(model.steps[activeLabel].explanation)}</p></div>`;
      side.querySelectorAll('[data-t3-label]').forEach(btn=>btn.addEventListener('click',()=>{activeLabel=Number(btn.dataset.t3Label);render();}));
    }
    function renderTest(model){
      side.innerHTML=`<div class="t3-side-head"><small>Test mode</small><strong>Label it from memory</strong><p>${esc(model.testPrompt)}</p></div><div class="t3-test-list">${model.labels.map((x,i)=>`<button type="button" data-t3-reveal="${i}" class="${revealed.has(i)?'revealed':''}"><span>${i+1}</span><strong>${revealed.has(i)?esc(x):'Reveal label'}</strong></button>`).join('')}</div><button type="button" class="t3-reset-test" data-t3-reset-test>Reset labels</button>`;
      side.querySelectorAll('[data-t3-reveal]').forEach(btn=>btn.addEventListener('click',()=>{revealed.add(Number(btn.dataset.t3Reveal));render();}));
      side.querySelector('[data-t3-reset-test]')?.addEventListener('click',()=>{revealed.clear();render();});
    }
    function renderProcess(model){
      const step=model.steps[processStep];
      side.innerHTML=`<div class="t3-side-head"><small>Process mode</small><strong>Stage ${processStep+1} of ${model.steps.length}</strong><p>${esc(model.processPrompt)}</p></div><div class="t3-process-card"><span>${String(processStep+1).padStart(2,'0')}</span><h3>${esc(step.label)}</h3><p>${esc(step.explanation)}</p></div><div class="t3-process-controls"><button type="button" data-t3-step-prev ${processStep===0?'disabled':''}>← Previous stage</button><button type="button" data-t3-step-next ${processStep===model.steps.length-1?'disabled':''}>Next stage →</button></div><div class="t3-process-dots">${model.steps.map((_,i)=>`<i class="${i===processStep?'active':''}"></i>`).join('')}</div>`;
      side.querySelector('[data-t3-step-prev]')?.addEventListener('click',()=>{processStep=Math.max(0,processStep-1);render();});
      side.querySelector('[data-t3-step-next]')?.addEventListener('click',()=>{processStep=Math.min(model.steps.length-1,processStep+1);render();});
    }
    function render(){
      const model=current();
      page.querySelectorAll('[data-t3-diagram]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.t3Diagram)===active));
      page.querySelectorAll('[data-t3-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.t3Mode===mode));
      stage.className=`textbook-diagram-stage mode-${mode}`;
      stage.innerHTML=`<div class="t3-svg-frame">${model.svg}</div>`;
      stage.querySelector('svg')?.setAttribute('aria-label',`${model.label}. ${mode} mode.`);
      if(mode==='learn')renderLearn(model);else if(mode==='test')renderTest(model);else renderProcess(model);
      caption.innerHTML=`<div><small>${esc(subjectName(topic))} · ${esc(topic.code)}</small><strong>${esc(model.label)}</strong></div><p>${mode==='learn'?'Use the labels to connect terminology to the visual representation.':mode==='test'?'Diagram labels are hidden. Recall them before revealing each answer.':'Step through the sequence and explain why each stage leads to the next.'}</p>`;
      setZoom(zoom);save();
    }

    page.querySelectorAll('[data-t3-diagram]').forEach(btn=>btn.addEventListener('click',()=>{active=Number(btn.dataset.t3Diagram);processStep=0;activeLabel=0;revealed.clear();render();}));
    page.querySelectorAll('[data-t3-mode]').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.t3Mode;processStep=0;activeLabel=0;revealed.clear();render();}));
    page.querySelector('[data-t3-zoom-out]').addEventListener('click',()=>setZoom(zoom-.1));
    page.querySelector('[data-t3-zoom-in]').addEventListener('click',()=>setZoom(zoom+.1));
    page.querySelector('[data-t3-zoom-reset]').addEventListener('click',()=>setZoom(1));
    page.querySelector('[data-t3-focus]').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await studio.requestFullscreen?.();}catch{studio.classList.toggle('focus-fallback');}});
    page.addEventListener('keydown',event=>{if(mode!=='process')return;if(event.key==='ArrowDown'||event.key==='ArrowRight'){processStep=Math.min(current().steps.length-1,processStep+1);render();}if(event.key==='ArrowUp'||event.key==='ArrowLeft'){processStep=Math.max(0,processStep-1);render();}});
    document.addEventListener('fullscreenchange',()=>studio.classList.toggle('is-fullscreen',document.fullscreenElement===studio));
    page.dataset.phaseT3='done';render();return true;
  }

  function scan(){document.querySelectorAll('#topicContent .textbook-reader').forEach(enhanceVisualPage);}
  const observer=new MutationObserver(scan);observer.observe(document.getElementById('topicContent')||document.body,{childList:true,subtree:true});
  queueMicrotask(scan);

  window.GCSE_TEXTBOOK_PHASE3={storageKey:STORAGE_KEY,labels:LABELS,profileFor,buildDiagramModel,enhanceVisualPage};
})();