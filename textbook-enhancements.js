(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  if(!DATA||!RICH||typeof renderTextbook!=='function') return;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  const diagramPlan={
    b1:[['cell','Animal and plant cell structure'],['membrane','Movement across cell membranes'],['mitosis','Cell cycle and mitosis']],
    b2:[['digestive','Digestive system and enzymes'],['circulation','Double circulatory system'],['planttransport','Xylem and phloem transport']],
    b3:[['pathogen','Pathogens and body defences'],['immunity','Immune response and vaccination'],['plantdefence','Plant disease and defence']],
    b4:[['photosynthesis','Photosynthesis and limiting factors'],['respiration','Aerobic and anaerobic respiration'],['metabolism','Energy and metabolism']],
    b5:[['control','Homeostatic control loop'],['nervous','Nervous system and reflex arc'],['endocrine','Hormonal control and blood glucose']],
    b6:[['dna','DNA, genes and chromosomes'],['punnett','Genetic inheritance'],['selection','Natural selection and evolution']],
    b7:[['ecosystem','Ecosystem organisation'],['foodweb','Food chains and trophic levels'],['carboncycle','Carbon cycle and decomposition']],
    c1:[['atom','Atomic structure'],['periodic','Periodic table and electron structure'],['isotopes','Isotopes and relative atomic mass']],
    c2:[['ionic','Ionic bonding and lattices'],['covalent','Covalent bonding and structures'],['metallic','Metallic bonding']],
    c3:[['moles','Mass, moles and reacting ratios'],['limiting','Limiting reactants'],['concentration','Concentration calculations']],
    c4:[['reactivity','Reactivity series and extraction'],['electrolysis','Electrolysis'],['acid','Acids, salts and neutralisation']],
    c5:[['profile','Reaction profiles'],['bondenergy','Bond energies'],['energychange','Exothermic and endothermic reactions']],
    c6:[['collisions','Collision theory'],['rategraph','Rate graphs'],['equilibrium','Dynamic equilibrium']],
    c7:[['hydrocarbon','Crude oil and fractions'],['cracking','Cracking hydrocarbons'],['organicfamilies','Organic functional groups']],
    c8:[['chromatography','Paper chromatography'],['gastests','Gas tests'],['iontests','Ion identification']],
    c9:[['atmosphere','Atmosphere and greenhouse effect'],['carboncycle','Carbon movement'],['pollution','Atmospheric pollutants']],
    c10:[['lifecycle','Life-cycle assessment'],['water','Potable water treatment'],['haber','Haber process']],
    p1:[['energy','Energy stores and transfers'],['sankey','Useful and dissipated energy'],['heating','Heating and specific heat capacity']],
    p2:[['circuit','Series and parallel circuits'],['ivgraph','Current–potential difference characteristics'],['grid','National Grid']],
    p3:[['particles','Particle model of states'],['heatingcurve','Heating curve and latent heat'],['density','Density measurement']],
    p4:[['decay','Radioactive decay'],['penetration','Alpha, beta and gamma penetration'],['halflife','Half-life graph']],
    p5:[['force','Resultant force and acceleration'],['motiongraph','Motion graphs'],['momentum','Momentum and collisions']],
    p6:[['wave','Wave properties'],['emspectrum','Electromagnetic spectrum'],['refraction','Reflection and refraction']],
    p7:[['magnet','Magnetic fields'],['motor','Motor effect'],['transformer','Transformers and induction']],
    p8:[['orbit','Solar System and orbital motion'],['stars','Stellar evolution'],['redshift','Red-shift and expanding Universe']]
  };

  const relatedTerms={
    biology:['structure','function','surface area','concentration gradient','enzyme','homeostasis','variation','adaptation','ecosystem'],
    chemistry:['particle','bond','ion','electron','mole','reaction','equilibrium','oxidation','reduction','concentration'],
    physics:['system','energy','force','field','current','potential difference','resistance','wave','momentum','radiation']
  };

  const termExtras={
    osmosis:{why:'It explains water movement across cell membranes and is central to plant and animal cell questions.',example:'Water entering a root hair cell from a more dilute soil solution.',mistake:'Do not describe osmosis as movement of solute particles; it is movement of water molecules through a partially permeable membrane.'},
    diffusion:{why:'It explains passive movement of particles in cells, lungs, intestines and many practical contexts.',example:'Oxygen diffusing from alveoli into the blood.',mistake:'Particles move randomly in both directions; the net movement is down the concentration gradient.'},
    enzyme:{why:'Enzymes control biological reactions and link directly to digestion, metabolism and required practical work.',example:'Amylase catalysing the breakdown of starch.',mistake:'Enzymes are not used up in the reaction and high temperature does not simply make them work faster indefinitely.'},
    homeostasis:{why:'It links nervous and hormonal control systems throughout Biology.',example:'Maintaining blood glucose concentration within a narrow range.',mistake:'Homeostasis does not keep conditions perfectly constant; it keeps them within limits.'},
    isotope:{why:'It links atomic structure to relative atomic mass and nuclear physics.',example:'Carbon-12 and carbon-14 have the same number of protons but different neutron numbers.',mistake:'Isotopes are atoms of the same element, so they must have the same proton number.'},
    ion:{why:'Ions are essential to bonding, electrolysis, acids and quantitative chemistry.',example:'A sodium atom loses one electron to form Na⁺.',mistake:'An ion forms by gaining or losing electrons, not protons.'},
    mole:{why:'The mole connects microscopic particles to measurable laboratory masses.',example:'One mole of carbon-12 atoms has a mass of 12 g.',mistake:'Do not confuse moles with mass; convert using relative formula mass.'},
    catalyst:{why:'Catalysts explain rate changes in chemistry and enzyme action in biology.',example:'Manganese dioxide catalysing decomposition of hydrogen peroxide.',mistake:'A catalyst changes activation energy, not the overall energy change of the reaction.'},
    equilibrium:{why:'It is central to reversible reactions and industrial chemistry such as the Haber process.',example:'In a closed system, forward and reverse reactions can occur at equal rates.',mistake:'At equilibrium the reactions have not stopped and reactant/product concentrations do not have to be equal.'},
    resistance:{why:'Resistance controls current and links circuit behaviour to component characteristics.',example:'A filament lamp becomes more resistant as its filament gets hotter.',mistake:'V = IR still applies to individual measurements even when resistance is changing.'},
    power:{why:'Power compares how quickly energy is transferred or work is done.',example:'A 2 kW kettle transfers 2000 J of energy each second.',mistake:'Power is a rate, not an amount of energy.'},
    momentum:{why:'Momentum explains collisions, safety systems and force–time relationships.',example:'A heavy vehicle moving quickly has a large momentum.',mistake:'Momentum is a vector, so direction must be included.'},
    wavelength:{why:'Wavelength links wave diagrams to wave speed, frequency and the electromagnetic spectrum.',example:'The distance from one crest to the next crest.',mistake:'Wavelength is not the vertical height of a wave.'},
    'half-life':{why:'Half-life lets us describe predictable behaviour of large samples of unstable nuclei.',example:'After two half-lives, one quarter of the original activity remains.',mistake:'A sample does not become completely non-radioactive after one half-life.'}
  };

  function normalise(s){return String(s||'').trim().toLowerCase();}
  function slug(s){return normalise(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

  function buildTermRecord(topic,term,definition,guide){
    const extra=termExtras[normalise(term)]||{};
    const subject=DATA.subjects.find(s=>s.id===topic.subject)?.name||topic.subject;
    const sections=(guide?.textbook||[]).filter(s=>normalise(s[1]).includes(normalise(term))||normalise(s[0]).includes(normalise(term))).map(s=>s[0]);
    const linkedLessons=(topic.lessons||[]).map(([name])=>name).filter(name=>normalise(name).includes(normalise(term))||normalise(term).split(/\s+/).some(w=>w.length>4&&normalise(name).includes(w))).slice(0,4);
    const defaultWhy=`This is a core ${subject} term in ${topic.title}. Using it accurately helps turn a vague description into a precise GCSE scientific explanation.`;
    const defaultExample=linkedLessons.length?`You will use this idea in: ${linkedLessons.join('; ')}.`:`Apply the term when explaining a process, interpreting data or answering an exam question about ${topic.title}.`;
    const defaultMistake=`Do not rely on the word alone. Define it precisely and connect it to the particles, structures, quantities or process in the question.`;
    const related=(guide?.terms||[]).map(([t])=>t).filter(t=>normalise(t)!==normalise(term)).slice(0,5);
    return {term,definition,why:extra.why||defaultWhy,example:extra.example||defaultExample,mistake:extra.mistake||defaultMistake,sections,linkedLessons,related};
  }

  function termRegistry(topic,guide){
    const map=new Map();
    for(const [term,definition] of guide?.terms||[]) map.set(normalise(term),buildTermRecord(topic,term,definition,guide));
    const spec=topic.subject==='biology'?window.GCSE_BIOLOGY_SPEC_DETAIL:topic.subject==='chemistry'?window.GCSE_CHEMISTRY_SPEC_DETAIL:window.GCSE_PHYSICS_SPEC_DETAIL;
    const mapped=spec?.topics?.[topic.id];
    for(const lesson of mapped?.sections?.flatMap(s=>s.lessons)||[]){
      for(const candidate of relatedTerms[topic.subject]||[]){
        if((normalise(lesson.title)+' '+normalise(lesson.focus?.join(' '))).includes(candidate)&&!map.has(candidate)){
          const pretty=candidate.replace(/\b\w/g,m=>m.toUpperCase());
          map.set(candidate,buildTermRecord(topic,pretty,`A key ${topic.subject} idea used in ${lesson.title}.`,guide));
        }
      }
    }
    return [...map.values()].slice(0,14);
  }

  function linkTerms(text,terms){
    let html=esc(text);
    const ordered=[...terms].sort((a,b)=>b.term.length-a.term.length);
    for(const rec of ordered){
      const safe=rec.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const rx=new RegExp(`\\b(${safe})\\b`,'gi');
      html=html.replace(rx,match=>`<button type="button" class="term-link" data-term="${esc(rec.term)}">${match}</button>`);
    }
    return html;
  }

  function svgWrap(label,body){return `<svg viewBox="0 0 640 300" role="img" aria-label="${esc(label)}">${body}</svg>`;}
  function text(x,y,t,cls=''){return `<text x="${x}" y="${y}" class="${cls}">${esc(t)}</text>`;}
  function arrow(x1,y1,x2,y2){return `<defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" class="arrow-fill"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="diagram-arrow" marker-end="url(#a)"/>`;}

  function educationalSvg(type,label){
    const generic=(items)=>svgWrap(label,items.map((item,i)=>{const x=25+i*150;return `<rect x="${x}" y="105" width="125" height="70" rx="14" class="diagram-node"/>${text(x+12,145,item,'diagram-label')}${i<items.length-1?arrow(x+125,140,x+148,140):''}`;}).join(''));
    const maps={
      membrane:()=>svgWrap(label,`<rect x="245" y="35" width="150" height="230" rx="22" class="diagram-membrane"/>${text(270,25,'cell membrane')}${text(45,70,'high concentration')}${text(455,70,'low concentration')}${[80,125,170,215].map(y=>`<circle cx="90" cy="${y}" r="11" class="diagram-particle"/>`).join('')}${[90,165].map(y=>`<circle cx="520" cy="${y}" r="11" class="diagram-particle"/>`).join('')}${arrow(125,145,235,145)}${text(125,135,'net diffusion')}`),
      mitosis:()=>generic(['DNA copied','Chromosomes align','Chromosomes separate','2 identical cells']),
      digestive:()=>generic(['Food','Stomach','Small intestine','Absorption']),
      planttransport:()=>generic(['Roots','Xylem','Leaves','Phloem']),
      immunity:()=>generic(['Antigen','Lymphocyte','Antibody','Memory cell']),
      plantdefence:()=>generic(['Pathogen','Barrier','Chemical defence','Reduced infection']),
      respiration:()=>generic(['Glucose + O₂','Respiration','ATP / energy','CO₂ + H₂O']),
      metabolism:()=>generic(['Nutrients','Cell reactions','Biomolecules','Energy transfers']),
      nervous:()=>generic(['Stimulus','Receptor','Sensory neurone','Motor response']),
      endocrine:()=>generic(['Change','Hormone','Target organ','Negative feedback']),
      punnett:()=>svgWrap(label,`${text(45,40,'Aa × Aa')}<rect x="180" y="65" width="260" height="180" class="diagram-grid"/><line x1="310" y1="65" x2="310" y2="245" class="diagram-line"/><line x1="180" y1="155" x2="440" y2="155" class="diagram-line"/>${text(235,120,'AA')}${text(360,120,'Aa')}${text(235,210,'Aa')}${text(360,210,'aa')}`),
      selection:()=>generic(['Variation','Selection pressure','Survival + reproduction','Allele frequency changes']),
      foodweb:()=>generic(['Producer','Primary consumer','Secondary consumer','Decomposer']),
      carboncycle:()=>generic(['CO₂ atmosphere','Photosynthesis','Biomass','Respiration / decay']),
      periodic:()=>svgWrap(label,`<rect x="40" y="55" width="560" height="180" rx="12" class="diagram-grid"/>${[0,1,2,3,4,5,6,7].map(i=>`<line x1="${40+i*70}" y1="55" x2="${40+i*70}" y2="235" class="diagram-line"/>`).join('')}${text(55,45,'Groups →')}${text(50,275,'Similar outer-electron structures give similar chemistry.')}`),
      isotopes:()=>generic(['Same protons','Different neutrons','Same element','Weighted Ar']),
      ionic:()=>generic(['Metal atom','Electron transfer','Positive + negative ions','Giant lattice']),
      covalent:()=>generic(['Non-metal atoms','Shared electrons','Covalent bonds','Molecule / network']),
      metallic:()=>generic(['Positive ions','Delocalised electrons','Electrostatic attraction','Conductivity']),
      limiting:()=>generic(['Known mass','Convert to moles','Compare ratio','Find limiting reactant']),
      concentration:()=>generic(['Solute amount','Solution volume','Concentration','Reaction quantity']),
      reactivity:()=>generic(['More reactive metal','Electron loss','Reduction / displacement','Extraction method']),
      acid:()=>generic(['Acid + base','Neutralisation','Salt solution','Crystallisation']),
      bondenergy:()=>generic(['Break bonds','Energy in','Make bonds','Energy out']),
      energychange:()=>generic(['Reactants','Energy transfer','Products','ΔH sign']),
      rategraph:()=>svgWrap(label,`<line x1="70" y1="245" x2="590" y2="245" class="diagram-axis"/><line x1="70" y1="245" x2="70" y2="35" class="diagram-axis"/><path d="M70 235 C160 115 270 75 565 65" class="diagram-curve"/>${text(270,285,'time')}${text(5,40,'product')}${text(390,55,'plateau')}`),
      equilibrium:()=>generic(['Closed system','Forward reaction','Reverse reaction','Equal rates']),
      cracking:()=>generic(['Long alkane','Heat + catalyst','Short alkane','Alkene']),
      organicfamilies:()=>generic(['Alkane','Alkene','Alcohol','Carboxylic acid']),
      gastests:()=>generic(['Unknown gas','Test reagent','Observation','Identification']),
      iontests:()=>generic(['Unknown ion','Add reagent','Observe colour / precipitate','Identify ion']),
      pollution:()=>generic(['Fuel / activity','Pollutant','Atmospheric reaction','Health / environment']),
      water:()=>generic(['Raw water','Filter','Sterilise','Potable water']),
      haber:()=>generic(['N₂ + H₂','Fe catalyst','Equilibrium','NH₃']),
      sankey:()=>svgWrap(label,`${arrow(55,145,250,145)}${arrow(250,145,535,85)}${arrow(250,145,535,220)}${text(55,130,'input energy')}${text(405,70,'useful')}${text(405,245,'dissipated')}`),
      heating:()=>generic(['Energy transferred','Mass','Specific heat capacity','Temperature rise']),
      ivgraph:()=>svgWrap(label,`<line x1="320" y1="270" x2="320" y2="30" class="diagram-axis"/><line x1="70" y1="150" x2="590" y2="150" class="diagram-axis"/><path d="M110 235 L530 65" class="diagram-curve"/><path d="M110 250 C230 210 270 175 320 150 C370 125 410 90 530 50" class="diagram-curve alt"/>${text(540,145,'V')}${text(330,35,'I')}`),
      grid:()=>generic(['Generator','Step-up transformer','High-voltage cables','Step-down transformer']),
      heatingcurve:()=>svgWrap(label,`<line x1="70" y1="250" x2="590" y2="250" class="diagram-axis"/><line x1="70" y1="250" x2="70" y2="35" class="diagram-axis"/><path d="M80 230 L190 170 L330 170 L450 95 L570 95" class="diagram-curve"/>${text(225,160,'state change')}${text(455,85,'state change')}`),
      density:()=>generic(['Measure mass','Measure volume','ρ = m/V','Compare materials']),
      penetration:()=>generic(['α stopped by paper','β stopped by aluminium','γ reduced by lead','Different hazards']),
      halflife:()=>svgWrap(label,`<line x1="70" y1="250" x2="590" y2="250" class="diagram-axis"/><line x1="70" y1="250" x2="70" y2="35" class="diagram-axis"/><path d="M80 55 C170 120 300 190 570 235" class="diagram-curve"/>${text(250,285,'time')}${text(5,45,'activity')}`),
      motiongraph:()=>svgWrap(label,`<line x1="70" y1="250" x2="590" y2="250" class="diagram-axis"/><line x1="70" y1="250" x2="70" y2="35" class="diagram-axis"/><path d="M80 230 L220 150 L350 150 L540 70" class="diagram-curve"/>${text(245,285,'time')}${text(10,45,'distance')}`),
      momentum:()=>generic(['Before collision','Total momentum','Interaction','After collision']),
      emspectrum:()=>generic(['Radio','Microwave / IR','Visible / UV','X-ray / gamma']),
      refraction:()=>svgWrap(label,`<line x1="70" y1="150" x2="570" y2="150" class="diagram-boundary"/><line x1="320" y1="35" x2="320" y2="270" class="diagram-normal"/><line x1="160" y1="55" x2="320" y2="150" class="diagram-ray"/><line x1="320" y1="150" x2="430" y2="270" class="diagram-ray"/>${text(330,55,'normal')}${text(80,140,'medium 1')}${text(80,175,'medium 2')}`),
      motor:()=>generic(['Current','Magnetic field','Force','Rotation']),
      transformer:()=>generic(['AC primary','Changing field','Secondary coil','Changed pd']),
      stars:()=>generic(['Nebula','Main sequence','Giant / supergiant','Remnant']),
      redshift:()=>generic(['Known spectrum','Galaxy spectrum','Lines shift red','Universe expanding'])
    };
    if(maps[type]) return maps[type]();
    if(typeof diagramSvg==='function') return diagramSvg(type,{title:label,code:''});
    return generic(['Key idea','Model','Evidence','Application']);
  }

  function renderDiagramGallery(topic){
    const plans=diagramPlan[topic.id]||[];
    return `<section class="panel textbook-diagram-gallery"><div class="textbook-section-head"><div><span class="eyebrow">Visual learning</span><h2>Key diagrams for ${esc(topic.title)}</h2><p>Use these diagrams alongside the explanations. Click a diagram to enlarge it.</p></div></div><div class="diagram-gallery-grid">${plans.map(([type,label],i)=>`<button type="button" class="textbook-diagram" data-diagram-index="${i}" aria-label="Open ${esc(label)} diagram"><span>${educationalSvg(type,label)}</span><strong>${esc(label)}</strong><small>Open diagram + explanation</small></button>`).join('')}</div></section>`;
  }

  function terminologyHtml(topic,guide,terms){
    return `<section class="panel terminology-section"><div class="textbook-section-head"><div><span class="eyebrow">Key terminology</span><h2>Terminology explorer</h2><p>Click any term for a fuller definition, context, example, misconception and related vocabulary.</p></div><label class="term-search-label">Find a term<input type="search" class="term-search" placeholder="Search terminology…" autocomplete="off"></label></div><div class="term-chip-grid">${terms.map(rec=>`<button type="button" class="term-chip" data-term="${esc(rec.term)}"><strong>${esc(rec.term)}</strong><span>${esc(rec.definition)}</span></button>`).join('')}</div></section>`;
  }

  function modalHtml(){
    if(document.getElementById('termInfoModal')) return;
    document.body.insertAdjacentHTML('beforeend',`<div id="termInfoModal" class="term-modal" hidden><div class="term-modal-backdrop" data-close-term></div><section class="term-modal-card" role="dialog" aria-modal="true" aria-labelledby="termModalTitle"><button class="term-modal-close" type="button" data-close-term aria-label="Close terminology information">×</button><span class="eyebrow">Key terminology</span><h2 id="termModalTitle"></h2><p class="term-definition" id="termModalDefinition"></p><div class="term-modal-grid"><article><strong>Why it matters</strong><p id="termModalWhy"></p></article><article><strong>Example</strong><p id="termModalExample"></p></article><article class="term-warning"><strong>Common misconception</strong><p id="termModalMistake"></p></article><article><strong>Related terms</strong><div id="termModalRelated" class="term-related"></div></article></div></section></div>`);
    document.querySelectorAll('[data-close-term]').forEach(el=>el.addEventListener('click',closeTermModal));
    document.addEventListener('keydown',e=>{if(e.key==='Escape') closeTermModal();});
  }

  let activeTerms=[];
  function openTermModal(term){
    modalHtml();
    const rec=activeTerms.find(r=>normalise(r.term)===normalise(term));
    if(!rec) return;
    document.getElementById('termModalTitle').textContent=rec.term;
    document.getElementById('termModalDefinition').textContent=rec.definition;
    document.getElementById('termModalWhy').textContent=rec.why;
    document.getElementById('termModalExample').textContent=rec.example;
    document.getElementById('termModalMistake').textContent=rec.mistake;
    document.getElementById('termModalRelated').innerHTML=rec.related.map(t=>`<button type="button" class="related-term" data-term="${esc(t)}">${esc(t)}</button>`).join('')||'<span>No linked terms in this topic yet.</span>';
    const modal=document.getElementById('termInfoModal'); modal.hidden=false; document.body.classList.add('term-modal-open');
    modal.querySelectorAll('[data-term]').forEach(btn=>btn.addEventListener('click',()=>openTermModal(btn.dataset.term)));
  }
  function closeTermModal(){const modal=document.getElementById('termInfoModal');if(modal) modal.hidden=true;document.body.classList.remove('term-modal-open');}

  function diagramModalHtml(){
    if(document.getElementById('diagramModal')) return;
    document.body.insertAdjacentHTML('beforeend',`<div id="diagramModal" class="diagram-modal" hidden><div class="diagram-modal-backdrop" data-close-diagram></div><section class="diagram-modal-card" role="dialog" aria-modal="true" aria-labelledby="diagramModalTitle"><button class="term-modal-close" type="button" data-close-diagram aria-label="Close diagram">×</button><span class="eyebrow">Textbook diagram</span><h2 id="diagramModalTitle"></h2><div id="diagramModalVisual" class="diagram-modal-visual"></div><p id="diagramModalCaption"></p></section></div>`);
    document.querySelectorAll('[data-close-diagram]').forEach(el=>el.addEventListener('click',closeDiagramModal));
  }
  function openDiagram(topic,index){diagramModalHtml();const plan=(diagramPlan[topic.id]||[])[index];if(!plan)return;const [type,label]=plan;document.getElementById('diagramModalTitle').textContent=label;document.getElementById('diagramModalVisual').innerHTML=educationalSvg(type,label);document.getElementById('diagramModalCaption').textContent=`This simplified GCSE model highlights the relationships most useful when learning ${label.toLowerCase()}. Use the surrounding textbook text and specification lesson for the full scientific detail.`;document.getElementById('diagramModal').hidden=false;document.body.classList.add('term-modal-open');}
  function closeDiagramModal(){const modal=document.getElementById('diagramModal');if(modal)modal.hidden=true;document.body.classList.remove('term-modal-open');}

  const baseRenderTextbook=renderTextbook;
  renderTextbook=function(topic,guide){
    if(!guide){baseRenderTextbook(topic,guide);return;}
    activeTerms=termRegistry(topic,guide);
    const chapters=(guide.textbook||[]).map((section,i)=>`<article class="panel textbook-chapter enhanced-chapter"><span class="eyebrow">${esc(topic.code)} · Section ${i+1}</span><h2>${linkTerms(section[0],activeTerms)}</h2><p>${linkTerms(section[1],activeTerms)}</p><div class="chapter-term-row">${activeTerms.filter(r=>normalise(section[0]+' '+section[1]).includes(normalise(r.term))).slice(0,5).map(r=>`<button type="button" class="chapter-term-pill" data-term="${esc(r.term)}">${esc(r.term)} <span>ⓘ</span></button>`).join('')}</div></article>`).join('');
    els.topicContent.innerHTML=`<div class="enhanced-textbook">
      <div class="textbook-intro panel"><div><span class="eyebrow">Interactive textbook</span><h2>${esc(topic.code)} · ${esc(topic.title)}</h2><p>Key terminology is highlighted throughout the text. Select a highlighted term for a fuller explanation, example and misconception check.</p></div><div class="textbook-tools"><span>${activeTerms.length} key terms</span><span>${(diagramPlan[topic.id]||[]).length} diagrams</span></div></div>
      <div class="textbook-main enhanced-textbook-main">${chapters}<article class="panel content-panel worked-example"><span class="eyebrow">Worked example</span><h2>${esc(guide.worked.title)}</h2><p>${linkTerms(guide.worked.question,activeTerms)}</p><ol>${guide.worked.steps.map(s=>`<li>${linkTerms(s,activeTerms)}</li>`).join('')}</ol></article></div>
      ${renderDiagramGallery(topic)}
      ${terminologyHtml(topic,guide,activeTerms)}
    </div>`;

    els.topicContent.querySelectorAll('[data-term]').forEach(btn=>btn.addEventListener('click',()=>openTermModal(btn.dataset.term)));
    els.topicContent.querySelectorAll('[data-diagram-index]').forEach(btn=>btn.addEventListener('click',()=>openDiagram(topic,Number(btn.dataset.diagramIndex))));
    const search=els.topicContent.querySelector('.term-search');
    if(search) search.addEventListener('input',()=>{const q=normalise(search.value);els.topicContent.querySelectorAll('.term-chip').forEach(chip=>{chip.hidden=q&&!normalise(chip.textContent).includes(q);});});
  };

  window.GCSE_TEXTBOOK_ENHANCEMENTS={diagramPlan,termRegistry,educationalSvg};
})();