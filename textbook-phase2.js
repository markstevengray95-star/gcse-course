(() => {
  const DATA=window.GCSE_COURSE_DATA;
  const RICH=window.GCSE_RICH_CONTENT;
  if(!DATA||!RICH)return;

  const STORAGE_KEY='gcse-science-textbook-phase2-v1';
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9α-ω+−-]+/g,' ').trim();
  const STOP=new Set('this that with from into about through which while where when then than have has had are was were will would should could can may might your their there these those each both more most some such using used use also only very what why how explain describe state give identify calculate compare suggest analyse evaluate science scientific topic section lesson idea ideas process processes'.split(' '));
  const words=s=>norm(s).split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
  const uniq=list=>[...new Set(list.filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];
  const sentenceList=text=>String(text||'').replace(/\s+/g,' ').trim().match(/[^.!?]+[.!?]?/g)?.map(s=>s.trim()).filter(Boolean)||[];
  const subjectName=topic=>DATA.subjects?.find(s=>s.id===topic.subject)?.name||topic.subject;

  const misconceptionRules=[
    ['osmosis','Osmosis is the net movement of water molecules through a partially permeable membrane; it is not the movement of the dissolved solute.'],
    ['diffusion','Particles move randomly in both directions. Diffusion describes the net movement from higher concentration to lower concentration.'],
    ['active transport','Active transport moves substances against a concentration gradient and requires energy; it is not a type of diffusion.'],
    ['enzyme','Enzymes are biological catalysts. They are not used up by the reaction, although their active site can be altered by extreme conditions.'],
    ['mitosis','Mitosis produces genetically identical daughter cells for growth and repair; it does not produce gametes.'],
    ['stem cell','Stem cells can differentiate into other cell types. Differentiation does not mean the cells contain different DNA.'],
    ['antibiotic','Antibiotics act against bacteria, not viruses.'],
    ['vaccin','Vaccination prepares the immune system to respond more rapidly; it does not directly kill every pathogen entering the body.'],
    ['photosynthesis','Plants do not obtain their food from the soil. They manufacture glucose by photosynthesis and absorb mineral ions from the soil.'],
    ['respiration','Respiration is a set of chemical reactions in cells that transfer energy; it is not the same thing as breathing.'],
    ['homeostasis','Homeostasis keeps internal conditions within limits rather than holding them at one perfectly fixed value.'],
    ['dominant','A dominant allele is expressed when present; dominant does not mean more common, stronger or better.'],
    ['natural selection','Individual organisms do not evolve because they need to. Natural selection changes allele frequencies in populations over generations.'],
    ['ion','Ions form when electrons are gained or lost. Changing the number of protons would change the element.'],
    ['isotope','Isotopes of the same element have the same number of protons but different numbers of neutrons.'],
    ['ionic bond','Ionic bonding is the electrostatic attraction between oppositely charged ions, not simply the transfer of electrons.'],
    ['covalent','A covalent bond is a shared pair of electrons; it is not a transfer of electrons between atoms.'],
    ['metallic','Metallic bonding involves positive ions and delocalised electrons; the electrons are free to move through the structure but are not outside the metal.'],
    ['mole','The mole measures amount of substance. It is not the same quantity as mass in grams.'],
    ['electrolysis','Electrolysis requires mobile ions. In a solid ionic compound the ions are fixed in position and cannot carry charge through the substance.'],
    ['exothermic','Exothermic reactions transfer energy to the surroundings. Bond breaking itself requires energy; bond making releases energy.'],
    ['endothermic','Endothermic reactions take in more energy breaking bonds than is released when new bonds form.'],
    ['catalyst','A catalyst lowers activation energy but does not change the overall energy change of the reaction or the equilibrium position.'],
    ['equilibrium','At dynamic equilibrium the forward and reverse reaction rates are equal; the concentrations do not have to be equal.'],
    ['chromatograph','A pure substance gives one spot under a particular set of chromatography conditions; the distance moved also depends on the solvent and stationary phase.'],
    ['greenhouse','The greenhouse effect is caused by absorption and re-emission of infrared radiation, not by greenhouse gases forming a solid barrier around Earth.'],
    ['potable','Potable water is safe to drink; it does not have to be chemically pure water.'],
    ['current','Current is the rate of flow of charge. Current is not used up by components in a circuit.'],
    ['potential difference','Potential difference is energy transferred per unit charge; it is not the same quantity as current.'],
    ['resistance','Resistance describes how strongly a component opposes current. It is not a substance that is used up.'],
    ['power','Power is the rate of energy transfer, not an amount of energy.'],
    ['density','Density depends on mass per unit volume. A large object is not automatically more dense than a small object.'],
    ['internal energy','Internal energy is the total kinetic and potential energy of the particles in a system; it is not the same as temperature.'],
    ['half-life','After one half-life half of the original unstable nuclei remain on average; a radioactive sample does not suddenly become safe or inactive.'],
    ['radioactive','Radioactive decay is random for an individual nucleus but predictable statistically for a large sample.'],
    ['mass','Mass is the amount of matter and is measured in kilograms; weight is a force measured in newtons.'],
    ['weight','Weight depends on gravitational field strength, whereas mass does not change when the object moves to a different gravitational field.'],
    ['resultant force','A moving object does not need a resultant force to keep moving at constant velocity; a resultant force is needed to change velocity.'],
    ['momentum','Momentum is a vector, so direction matters when applying conservation of momentum.'],
    ['wavelength','Wavelength is the distance between equivalent points on successive waves; it is not the amplitude.'],
    ['frequency','Frequency is the number of complete waves passing a point each second; it is not wave speed.'],
    ['electromagnetic','All electromagnetic waves travel at the same speed in a vacuum, despite having different frequencies and wavelengths.'],
    ['transformer','A transformer requires a changing magnetic field, so it operates with alternating current rather than a steady direct current.'],
    ['orbit','An orbiting object is continuously accelerating because its velocity changes direction, even if its speed remains constant.'],
    ['red shift','Red-shift means observed wavelengths are longer than expected; it does not mean the galaxy itself visibly turns red.']
  ];

  const subjectFallback={
    biology:'Do not stop at naming a structure or process. Link the biological feature to the mechanism and then to its effect on the organism or system.',
    chemistry:'Do not describe only what is observed. Where relevant, connect the observation to particles, bonding, electron transfer or the chemical change taking place.',
    physics:'Do not quote a quantity or equation without explaining the relationship. State what changes, what is kept constant and include the correct units or direction where relevant.'
  };

  function lessonRecords(topic,mode='triple'){
    return (topic.lessons||[]).map(([name,scope],index)=>({name,scope,index,lesson:RICH.getLesson?.(topic,name,index)})).filter(r=>r.lesson&&(mode==='triple'||r.scope!=='triple'));
  }

  function lessonHay(rec){
    const l=rec.lesson||{};
    return [rec.name,l.title,l.section?.[0],l.section?.[1],...(l.objectives||[]),...(l.terms||[]).flat(),l.worked?.title,l.worked?.question,l.examTip].filter(Boolean).join(' ');
  }

  function relevantLessons(topic,guide,sectionIndex,mode='triple'){
    const section=guide.textbook?.[sectionIndex]||[];
    const queryWords=new Set(words(section.join(' ')));
    const records=lessonRecords(topic,mode).map(rec=>{
      const hayWords=words(lessonHay(rec));
      const overlap=hayWords.reduce((n,w)=>n+(queryWords.has(w)?1:0),0);
      const titleWords=words(rec.name);const titleBonus=titleWords.reduce((n,w)=>n+(queryWords.has(w)?2:0),0);
      return {...rec,score:overlap+titleBonus};
    }).sort((a,b)=>b.score-a.score||a.index-b.index);
    if(!records.length)return [];
    if(records[0].score>0)return records.slice(0,3);
    const target=Math.min(records.length-1,Math.floor(sectionIndex*Math.max(1,records.length)/(guide.textbook?.length||1)));
    return [records[target],records[Math.min(records.length-1,target+1)],records[Math.max(0,target-1)]].filter((r,i,a)=>r&&a.findIndex(x=>x.index===r.index)===i);
  }

  function quickExplanation(body){
    const sentences=sentenceList(body);if(!sentences.length)return String(body||'').trim();
    let out=sentences[0];if(out.length<145&&sentences[1])out+=` ${sentences[1]}`;
    return out.length>320?`${out.slice(0,317).trim()}…`:out;
  }

  function misconceptionFor(topic,section,related){
    const title=section?.[0]||topic.title;
    const focus=related[0]?.name||title;
    const hay=norm([...(section||[]),...related.map(r=>lessonHay(r))].join(' '));
    const hit=misconceptionRules.find(([key])=>hay.includes(norm(key)));
    if(hit)return `${hit[1]} In ${topic.code} ${title}, connect this correction explicitly to ${focus}.`;
    const term=(related.flatMap(r=>r.lesson?.terms||[]).map(x=>x?.[0]).find(Boolean));
    return `${subjectFallback[topic.subject]} For ${topic.code} ${title}, ${term?`use ${term} precisely and `:''}connect the explanation directly to ${focus}.`;
  }

  function objectiveTasks(related,title){
    const tasks=uniq(related.flatMap(r=>r.lesson?.objectives||[]).map(x=>String(x).trim())).slice(0,3);
    const fallbacks=[`Explain the key science behind ${title}.`,`Use at least two scientific terms from this page to explain the process or relationship.`,`Apply the idea from this page to a new example and justify your reasoning.`];
    for(const f of fallbacks)if(tasks.length<3)tasks.push(f);
    return tasks.slice(0,3);
  }

  function buildSectionModel(topic,guide,sectionIndex,mode='triple'){
    const section=guide.textbook?.[sectionIndex]||[`Section ${sectionIndex+1}`,''];
    const title=section[0]||`Section ${sectionIndex+1}`;
    const body=section[1]||'';
    const related=relevantLessons(topic,guide,sectionIndex,mode);
    const deep=uniq([body,...related.map(r=>r.lesson?.section?.[1])]).filter(x=>x&&x.length>25).slice(0,3);
    const bestExample=related.find(r=>r.lesson?.worked?.question)?.lesson?.worked||guide.worked||null;
    const terms=uniq(related.flatMap(r=>(r.lesson?.terms||[]).map(t=>t?.[0])).filter(Boolean)).slice(0,6);
    const example=bestExample?{
      title:bestExample.title||'Worked example',
      question:bestExample.question||'',
      steps:uniq(bestExample.steps||[]).slice(0,5)
    }:{title:'Example',question:`Apply ${title.toLowerCase()} to a familiar GCSE science context.`,steps:[]};
    return{
      id:`${topic.id}-section-${sectionIndex+1}`,
      topicId:topic.id,subject:topic.subject,sectionIndex,title,
      quick:quickExplanation(body),deep,example,
      misconception:misconceptionFor(topic,section,related),
      questions:objectiveTasks(related,title),terms,
      relatedLessonTitles:related.map(r=>r.name)
    };
  }

  function answerGuidance(model){
    const termText=model.terms.length?`Use these terms accurately where relevant: ${model.terms.slice(0,4).join(', ')}.`:'Use precise scientific vocabulary from the page.';
    return `${termText} Your explanation should link the scientific idea to the process, evidence or outcome rather than simply naming it.`;
  }

  function renderStructuredPage(node,model){
    if(!node||node.dataset.phaseT2==='done')return;
    const termRow=node.querySelector('.chapter-term-row');if(termRow)termRow.remove();
    const deep=model.deep.map((p,i)=>`<p${i===0?' class="textbook-deep-lead"':''}>${esc(p)}</p>`).join('');
    const steps=model.example.steps.length?`<details class="textbook-example-reasoning"><summary>Show worked reasoning</summary><ol>${model.example.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></details>`:'';
    const questions=model.questions.map((q,i)=>`<article class="textbook-check-item"><div><span>${i+1}</span><strong>${esc(q)}</strong></div><textarea rows="3" data-textbook-check-answer="${i}" placeholder="Write your answer here…"></textarea></article>`).join('');
    node.innerHTML=`
      <header class="textbook-phase2-head"><span class="eyebrow">${esc(model.title)}</span><h2>${esc(model.title)}</h2><p>Learn the idea first, then deepen it, see it applied and check that you can explain it yourself.</p></header>
      <section class="textbook-quick-explanation"><div class="textbook-section-label"><span>1</span><div><small>Start here</small><strong>Quick explanation</strong></div></div><p>${esc(model.quick)}</p></section>
      <section class="textbook-deep-explanation"><div class="textbook-section-label"><span>2</span><div><small>Build the science</small><strong>Understand it properly</strong></div></div><div class="textbook-reading-copy">${deep}</div>${model.terms.length?`<div class="textbook-page-terms"><small>Key language</small>${model.terms.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</section>
      <section class="textbook-context-example"><div class="textbook-section-label"><span>3</span><div><small>See it used</small><strong>Example</strong></div></div><div class="textbook-example-card"><span class="eyebrow">${esc(model.example.title)}</span><p>${esc(model.example.question)}</p>${steps}</div></section>
      <aside class="textbook-misconception"><div class="textbook-section-label"><span>!</span><div><small>Common error</small><strong>Common misconception</strong></div></div><p>${esc(model.misconception)}</p></aside>
      <section class="textbook-understanding-check"><div class="textbook-section-label"><span>4</span><div><small>Now you</small><strong>Check your understanding</strong></div></div><div class="textbook-check-list">${questions}</div><button type="button" class="textbook-guidance-toggle" data-textbook-guidance-toggle>Show answer guidance</button><div class="textbook-answer-guidance" data-textbook-answer-guidance hidden><strong>Answer guidance</strong><p>${esc(answerGuidance(model))}</p></div></section>`;
    if(termRow){termRow.classList.add('textbook-phase2-term-row');node.querySelector('.textbook-deep-explanation')?.appendChild(termRow);}
    node.dataset.phaseT2='done';
  }

  function savedAnswers(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}}catch{return{}}}
  function saveAnswer(key,value){const all=savedAnswers();all[key]=value;localStorage.setItem(STORAGE_KEY,JSON.stringify(all));}

  function enhanceReader(reader){
    if(!reader||reader.dataset.phaseT2==='done')return false;
    const topic=DATA.topics?.find(t=>t.id===reader.dataset.textbookTopic);const guide=RICH.guides?.[topic?.id];if(!topic||!guide)return false;
    const mode=typeof state!=='undefined'?state.mode:'triple';
    const pages=[...reader.querySelectorAll('.textbook-chapter-page')];if(!pages.length)return false;
    pages.forEach((node,index)=>renderStructuredPage(node,buildSectionModel(topic,guide,index,mode)));
    const stored=savedAnswers();
    reader.querySelectorAll('[data-textbook-check-answer]').forEach(area=>{
      const page=area.closest('[data-textbook-page]');const key=`${topic.id}:${page?.dataset.textbookPage||'page'}:${area.dataset.textbookCheckAnswer}`;
      if(stored[key])area.value=stored[key];
      area.addEventListener('input',()=>saveAnswer(key,area.value));
    });
    reader.querySelectorAll('[data-textbook-guidance-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
      const box=btn.parentElement?.querySelector('[data-textbook-answer-guidance]');if(!box)return;box.hidden=!box.hidden;btn.textContent=box.hidden?'Show answer guidance':'Hide answer guidance';
    }));
    reader.dataset.phaseT2='done';return true;
  }

  function scan(){document.querySelectorAll('.textbook-reader').forEach(enhanceReader);}
  if(typeof document!=='undefined'){
    new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});
    requestAnimationFrame(scan);
  }

  window.GCSE_TEXTBOOK_PHASE2={buildSectionModel,relevantLessons,quickExplanation,misconceptionFor,enhanceReader,storageKey:STORAGE_KEY};
})();