(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  if(!DATA||!RICH||typeof renderTextbook!=='function') return;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const norm=s=>String(s||'').trim().toLowerCase();

  const plans={
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

  const diagramSteps={
    cell:['Cell membrane','Cytoplasm','Nucleus','Organelles'],membrane:['High concentration','Partially permeable membrane','Net movement','Low concentration'],mitosis:['DNA copied','Chromosomes align','Chromosomes separate','2 identical cells'],
    digestive:['Food','Enzymes','Small intestine','Absorption'],circulation:['Heart','Artery','Capillary','Vein'],planttransport:['Roots','Xylem','Leaves','Phloem'],pathogen:['Pathogen','Barrier','Immune response','Memory cells'],immunity:['Antigen','Lymphocyte','Antibody','Memory cell'],plantdefence:['Pathogen','Physical barrier','Chemical defence','Reduced infection'],
    photosynthesis:['Light + CO₂ + H₂O','Chloroplast','Glucose','O₂'],respiration:['Glucose + O₂','Respiration','Energy transfer','CO₂ + H₂O'],metabolism:['Nutrients','Cell reactions','Biomolecules','Energy'],control:['Stimulus','Receptor','Coordinator','Effector'],nervous:['Stimulus','Sensory neurone','CNS','Motor response'],endocrine:['Change','Hormone','Target organ','Negative feedback'],dna:['DNA','Gene','Protein','Characteristic'],selection:['Variation','Selection pressure','Survival','Allele frequency change'],ecosystem:['Abiotic factors','Producer','Consumer','Decomposer'],foodweb:['Producer','Primary consumer','Secondary consumer','Decomposer'],carboncycle:['CO₂','Photosynthesis','Biomass','Respiration / decay'],
    atom:['Nucleus','Protons + neutrons','Electron shells','Atomic number'],periodic:['Atomic number','Group','Outer electrons','Chemical behaviour'],isotopes:['Same protons','Different neutrons','Same element','Weighted Ar'],ionic:['Metal + non-metal','Electron transfer','Opposite ions','Giant lattice'],covalent:['Non-metal atoms','Shared electrons','Covalent bond','Molecule / network'],metallic:['Positive ions','Delocalised electrons','Attraction','Conductivity'],moles:['Mass','Moles','Reacting ratio','Product'],limiting:['Reactant amounts','Convert to moles','Compare ratio','Limiting reactant'],concentration:['Solute','Volume','Concentration','Reaction quantity'],reactivity:['Metal','Electron loss','Reactivity series','Extraction'],electrolysis:['Electrolyte','Mobile ions','Electrodes','Products'],acid:['Acid + base','Neutralisation','Salt solution','Crystals'],bondenergy:['Break bonds','Energy in','Make bonds','Energy out'],energychange:['Reactants','Energy transfer','Products','Overall change'],collisions:['Particles','Collision','Enough energy','Reaction'],equilibrium:['Closed system','Forward reaction','Reverse reaction','Equal rates'],hydrocarbon:['Crude oil','Fractions','Cracking','Useful molecules'],cracking:['Long alkane','Heat + catalyst','Short alkane','Alkene'],organicfamilies:['Alkane','Alkene','Alcohol','Carboxylic acid'],chromatography:['Mixture','Stationary phase','Separation','Rf value'],gastests:['Unknown gas','Test','Observation','Identification'],iontests:['Unknown ion','Reagent','Observation','Identification'],atmosphere:['Sunlight','Earth','Infrared','Greenhouse gases'],pollution:['Source','Pollutant','Atmosphere','Health / environment'],lifecycle:['Raw material','Manufacture','Use','Disposal'],water:['Raw water','Filter','Sterilise','Potable water'],haber:['N₂ + H₂','Fe catalyst','Equilibrium','NH₃'],
    energy:['Energy store','Transfer','Useful output','Dissipation'],sankey:['Input energy','Useful transfer','Dissipated transfer','Efficiency'],heating:['Energy','Mass','Specific heat capacity','Temperature change'],circuit:['Supply','Current','Component','Potential difference'],grid:['Generator','Step-up transformer','Grid cables','Step-down transformer'],particles:['Particle arrangement','Heating','Internal energy','State change'],density:['Mass','Volume','Density','Material'],decay:['Unstable nucleus','Radiation','Random decay','Lower activity'],penetration:['Alpha','Paper','Beta / aluminium','Gamma / lead'],force:['Forces','Resultant force','Acceleration','Motion'],momentum:['Before','Total momentum','Interaction','After'],wave:['Amplitude','Wavelength','Frequency','Wave speed'],emspectrum:['Radio','Microwave / IR','Visible / UV','X-ray / gamma'],magnet:['Current / magnet','Magnetic field','Force / induction','Device'],motor:['Current','Magnetic field','Force','Rotation'],transformer:['AC primary','Changing field','Secondary coil','Changed pd'],orbit:['Gravity','Circular motion','Orbit','Satellite / planet'],stars:['Nebula','Main sequence','Giant / supergiant','Remnant'],redshift:['Known spectrum','Galaxy spectrum','Red shift','Expansion']
  };

  const richTermInfo={
    osmosis:['Water movement through a partially permeable membrane is essential in cell transport.','Water entering a root hair cell from a more dilute soil solution.','Osmosis is water movement, not movement of the dissolved solute.'],
    diffusion:['Diffusion explains passive particle movement in lungs, intestines and cells.','Oxygen moves from alveoli into blood down a concentration gradient.','Particles move randomly both ways; diffusion describes the net movement.'],
    enzyme:['Enzymes link digestion, metabolism and required practical work.','Amylase catalyses the breakdown of starch.','Enzymes are catalysts and are not used up in the reaction.'],
    homeostasis:['Homeostasis links nervous and hormonal control.','Blood glucose is maintained within a narrow range by negative feedback.','Conditions are maintained within limits, not at one perfectly fixed value.'],
    isotope:['Isotopes connect atomic structure, relative atomic mass and radioactivity.','Carbon-12 and carbon-14 have the same proton number but different neutron numbers.','Different proton numbers would mean different elements.'],
    ion:['Ions are central to bonding, acids and electrolysis.','A sodium atom loses one electron to form Na⁺.','Ions form by electron transfer, not proton transfer.'],
    mole:['The mole connects particle number to measurable laboratory quantities.','Moles = mass ÷ relative formula mass.','Do not confuse amount in moles with mass in grams.'],
    catalyst:['Catalysts explain reaction-rate changes without being consumed.','An iron catalyst is used in the Haber process.','A catalyst lowers activation energy but does not change the overall reaction energy.'],
    equilibrium:['Dynamic equilibrium is central to reversible and industrial reactions.','In a closed system the forward and reverse reactions can occur at equal rates.','Equal rates do not mean equal concentrations.'],
    resistance:['Resistance connects current, potential difference and component behaviour.','A hot filament lamp has a higher resistance than a cooler filament.','A changing resistance does not make V = IR invalid for an individual reading.'],
    power:['Power measures the rate of energy transfer or rate of doing work.','A 2 kW device transfers 2000 J each second.','Power is not an amount of energy.'],
    momentum:['Momentum is a vector used in collision and safety calculations.','Momentum = mass × velocity.','Direction matters, so signs may be needed in calculations.'],
    wavelength:['Wavelength links wave diagrams, wave speed and frequency.','Measure from one crest to the next corresponding crest.','Wavelength is not the amplitude of a wave.'],
    'half-life':['Half-life describes predictable decay of a large sample of unstable nuclei.','After two half-lives, one quarter of the original activity remains.','A sample does not become completely non-radioactive after one half-life.']
  };

  function specFor(topic){return topic.subject==='biology'?window.GCSE_BIOLOGY_SPEC_DETAIL:topic.subject==='chemistry'?window.GCSE_CHEMISTRY_SPEC_DETAIL:window.GCSE_PHYSICS_SPEC_DETAIL;}
  function buildTerms(topic,guide){
    const map=new Map();
    for(const [term,definition] of guide.terms||[]) map.set(norm(term),{term,definition});
    const spec=specFor(topic)?.topics?.[topic.id];
    const words=topic.subject==='biology'?['enzyme','diffusion','osmosis','homeostasis','adaptation','variation','ecosystem']:topic.subject==='chemistry'?['ion','isotope','mole','catalyst','equilibrium','oxidation','reduction']:['power','resistance','momentum','wavelength','half-life','energy','force'];
    for(const lesson of spec?.sections?.flatMap(s=>s.lessons)||[]) for(const word of words) if(!map.has(word)&&norm(`${lesson.title} ${lesson.focus?.join(' ')}`).includes(word)) map.set(word,{term:word.replace(/\b\w/g,m=>m.toUpperCase()),definition:`A key ${topic.subject} idea used in ${lesson.title}.`});
    return [...map.values()].slice(0,14).map(rec=>{
      const detail=richTermInfo[norm(rec.term)];
      const related=(guide.terms||[]).map(([t])=>t).filter(t=>norm(t)!==norm(rec.term)).slice(0,5);
      return {...rec,why:detail?.[0]||`This is an important ${DATA.subjects.find(s=>s.id===topic.subject)?.name} term in ${topic.title}. Accurate use improves scientific explanations and exam answers.`,example:detail?.[1]||`Use this term when explaining a process, calculation, practical result or unfamiliar context in ${topic.title}.`,mistake:detail?.[2]||'Do not use the word as a label only. State what it means and connect it directly to the evidence or process in the question.',related};
    });
  }

  function linkTerms(text,terms){
    const source=String(text??'');
    const termByLower=new Map(terms.map(t=>[norm(t.term),t]));
    const alternatives=[...termByLower.values()].sort((a,b)=>b.term.length-a.term.length).map(t=>t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    if(!alternatives.length) return esc(source);
    const rx=new RegExp(`\\b(${alternatives.join('|')})\\b`,'gi');
    let out='',last=0,match;
    while((match=rx.exec(source))){
      out+=esc(source.slice(last,match.index));
      const rec=termByLower.get(norm(match[0]));
      out+=`<button type="button" class="term-link" data-term="${esc(rec.term)}">${esc(match[0])}</button>`;
      last=match.index+match[0].length;
    }
    return out+esc(source.slice(last));
  }

  function genericSvg(label,steps){
    const body=steps.map((step,i)=>{const x=25+i*150;return `<rect x="${x}" y="105" width="125" height="70" rx="14" class="diagram-node"/><text x="${x+10}" y="140" class="diagram-label">${esc(step.length>17?step.slice(0,17)+'…':step)}</text>${i<steps.length-1?`<line x1="${x+125}" y1="140" x2="${x+145}" y2="140" class="diagram-arrow"/>`:''}`;}).join('');
    return `<svg viewBox="0 0 640 300" role="img" aria-label="${esc(label)}">${body}</svg>`;
  }
  function graphSvg(type,label){
    if(type==='rategraph'||type==='halflife'||type==='motiongraph'||type==='heatingcurve'){
      const path=type==='halflife'?'M80 55 C180 130 310 200 565 235':type==='heatingcurve'?'M80 230 L190 170 L330 170 L450 95 L570 95':type==='motiongraph'?'M80 230 L220 150 L350 150 L540 70':'M80 235 C170 120 290 75 565 65';
      return `<svg viewBox="0 0 640 300" role="img" aria-label="${esc(label)}"><line x1="70" y1="250" x2="590" y2="250" class="diagram-axis"/><line x1="70" y1="250" x2="70" y2="35" class="diagram-axis"/><path d="${path}" class="diagram-curve"/><text x="275" y="285">x-axis</text><text x="8" y="45">y-axis</text></svg>`;
    }
    if(type==='ivgraph') return `<svg viewBox="0 0 640 300" role="img" aria-label="${esc(label)}"><line x1="320" y1="270" x2="320" y2="30" class="diagram-axis"/><line x1="70" y1="150" x2="590" y2="150" class="diagram-axis"/><path d="M110 235 L530 65" class="diagram-curve"/><path d="M110 250 C230 210 270 175 320 150 C370 125 410 90 530 50" class="diagram-curve alt"/><text x="545" y="140">V</text><text x="332" y="38">I</text></svg>`;
    return null;
  }
  function visual(type,label){
    const graph=graphSvg(type,label);if(graph)return graph;
    if(typeof diagramSvg==='function'&&['cell','circulation','pathogen','photosynthesis','control','dna','ecosystem','atom','bonding','moles','electrolysis','collisions','hydrocarbon','chromatography','atmosphere','lifecycle','energy','particles','decay','force','wave','magnet','orbit','profile','circuit'].includes(type)) return diagramSvg(type,{title:label,code:''});
    return genericSvg(label,diagramSteps[type]||['Key idea','Model','Evidence','Application']);
  }

  let activeTerms=[];
  function ensureTermModal(){if(document.getElementById('termInfoModal'))return;document.body.insertAdjacentHTML('beforeend',`<div id="termInfoModal" class="term-modal" hidden><div class="term-modal-backdrop" data-close-term></div><section class="term-modal-card" role="dialog" aria-modal="true" aria-labelledby="termModalTitle"><button class="term-modal-close" type="button" data-close-term>×</button><span class="eyebrow">Key terminology</span><h2 id="termModalTitle"></h2><p class="term-definition" id="termModalDefinition"></p><div class="term-modal-grid"><article><strong>Why it matters</strong><p id="termModalWhy"></p></article><article><strong>Example</strong><p id="termModalExample"></p></article><article class="term-warning"><strong>Common misconception</strong><p id="termModalMistake"></p></article><article><strong>Related terms</strong><div id="termModalRelated" class="term-related"></div></article></div></section></div>`);document.querySelectorAll('[data-close-term]').forEach(x=>x.addEventListener('click',closeTerm));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTerm();closeDiagram();}});}
  function openTerm(name){ensureTermModal();const rec=activeTerms.find(r=>norm(r.term)===norm(name));if(!rec)return;document.getElementById('termModalTitle').textContent=rec.term;document.getElementById('termModalDefinition').textContent=rec.definition;document.getElementById('termModalWhy').textContent=rec.why;document.getElementById('termModalExample').textContent=rec.example;document.getElementById('termModalMistake').textContent=rec.mistake;document.getElementById('termModalRelated').innerHTML=rec.related.map(t=>`<button type="button" class="related-term" data-term="${esc(t)}">${esc(t)}</button>`).join('')||'<span>No linked terms yet.</span>';const modal=document.getElementById('termInfoModal');modal.hidden=false;document.body.classList.add('term-modal-open');modal.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>openTerm(b.dataset.term)));}
  function closeTerm(){const m=document.getElementById('termInfoModal');if(m)m.hidden=true;document.body.classList.remove('term-modal-open');}
  function ensureDiagramModal(){if(document.getElementById('diagramModal'))return;document.body.insertAdjacentHTML('beforeend',`<div id="diagramModal" class="diagram-modal" hidden><div class="diagram-modal-backdrop" data-close-diagram></div><section class="diagram-modal-card" role="dialog" aria-modal="true" aria-labelledby="diagramModalTitle"><button class="term-modal-close" type="button" data-close-diagram>×</button><span class="eyebrow">Textbook diagram</span><h2 id="diagramModalTitle"></h2><div id="diagramModalVisual" class="diagram-modal-visual"></div><p id="diagramModalCaption"></p></section></div>`);document.querySelectorAll('[data-close-diagram]').forEach(x=>x.addEventListener('click',closeDiagram));}
  function openDiagram(topic,index){ensureDiagramModal();const item=(plans[topic.id]||[])[index];if(!item)return;document.getElementById('diagramModalTitle').textContent=item[1];document.getElementById('diagramModalVisual').innerHTML=visual(item[0],item[1]);document.getElementById('diagramModalCaption').textContent=`This simplified GCSE diagram highlights the relationship you need for ${item[1].toLowerCase()}. Use it with the textbook explanation and lesson detail.`;document.getElementById('diagramModal').hidden=false;document.body.classList.add('term-modal-open');}
  function closeDiagram(){const m=document.getElementById('diagramModal');if(m)m.hidden=true;document.body.classList.remove('term-modal-open');}

  const base=renderTextbook;
  renderTextbook=function(topic,guide){
    if(!guide){base(topic,guide);return;}
    activeTerms=buildTerms(topic,guide);
    const chapters=guide.textbook.map((section,i)=>`<article class="panel textbook-chapter enhanced-chapter"><span class="eyebrow">${esc(topic.code)} · Section ${i+1}</span><h2>${linkTerms(section[0],activeTerms)}</h2><p>${linkTerms(section[1],activeTerms)}</p><div class="chapter-term-row">${activeTerms.filter(r=>norm(section.join(' ')).includes(norm(r.term))).slice(0,5).map(r=>`<button type="button" class="chapter-term-pill" data-term="${esc(r.term)}">${esc(r.term)} <span>ⓘ</span></button>`).join('')}</div></article>`).join('');
    const gallery=(plans[topic.id]||[]).map(([type,label],i)=>`<button type="button" class="textbook-diagram" data-diagram-index="${i}"><span>${visual(type,label)}</span><strong>${esc(label)}</strong><small>Open diagram + explanation</small></button>`).join('');
    const terminology=activeTerms.map(r=>`<button type="button" class="term-chip" data-term="${esc(r.term)}"><strong>${esc(r.term)}</strong><span>${esc(r.definition)}</span></button>`).join('');
    els.topicContent.innerHTML=`<div class="enhanced-textbook"><div class="textbook-intro panel"><div><span class="eyebrow">Interactive textbook</span><h2>${esc(topic.code)} · ${esc(topic.title)}</h2><p>Highlighted terminology is clickable. Open a term for its definition, context, example and misconception check.</p></div><div class="textbook-tools"><span>${activeTerms.length} key terms</span><span>${(plans[topic.id]||[]).length} diagrams</span></div></div><div class="textbook-main enhanced-textbook-main">${chapters}<article class="panel content-panel worked-example"><span class="eyebrow">Worked example</span><h2>${esc(guide.worked.title)}</h2><p>${linkTerms(guide.worked.question,activeTerms)}</p><ol>${guide.worked.steps.map(s=>`<li>${linkTerms(s,activeTerms)}</li>`).join('')}</ol></article></div><section class="panel textbook-diagram-gallery"><div class="textbook-section-head"><div><span class="eyebrow">Visual learning</span><h2>Key diagrams for ${esc(topic.title)}</h2><p>Each topic now has multiple relevant diagrams. Select one to enlarge it.</p></div></div><div class="diagram-gallery-grid">${gallery}</div></section><section class="panel terminology-section"><div class="textbook-section-head"><div><span class="eyebrow">Key terminology</span><h2>Terminology explorer</h2><p>Search or select a term for more information.</p></div><label class="term-search-label">Find a term<input type="search" class="term-search" placeholder="Search terminology…" autocomplete="off"></label></div><div class="term-chip-grid">${terminology}</div></section></div>`;
    els.topicContent.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>openTerm(b.dataset.term)));
    els.topicContent.querySelectorAll('[data-diagram-index]').forEach(b=>b.addEventListener('click',()=>openDiagram(topic,Number(b.dataset.diagramIndex))));
    const search=els.topicContent.querySelector('.term-search');if(search)search.addEventListener('input',()=>{const q=norm(search.value);els.topicContent.querySelectorAll('.term-chip').forEach(c=>c.hidden=!!q&&!norm(c.textContent).includes(q));});
  };

  window.GCSE_TEXTBOOK_ENHANCEMENTS={diagramPlan:plans,buildTerms,linkTerms,visual};
})();