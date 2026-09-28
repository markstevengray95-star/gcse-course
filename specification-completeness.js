(() => {
  const maps={
    biology:window.GCSE_BIOLOGY_SPEC_DETAIL,
    chemistry:window.GCSE_CHEMISTRY_SPEC_DETAIL,
    physics:window.GCSE_PHYSICS_SPEC_DETAIL
  };

  const KEY_IDEAS={
    biology:[
      {keys:/cell|tissue|organ|stem|mitosis|meiosis/i,text:'Living systems are built from cells; specialised cells form tissues, organs and organ systems.'},
      {keys:/enzyme|protein|dna|gene|molecule|membrane/i,text:'Biological molecules have structures that are linked to their functions.'},
      {keys:/ecosystem|population|community|food|competition|interdepend|sampling/i,text:'Organisms interact in populations, communities and ecosystems and depend on their environment and on each other.'},
      {keys:/adapt|selection|evolution|variation/i,text:'Adaptation and natural selection explain how populations change and how biodiversity develops.'},
      {keys:/photosynth|plant|chloroplast/i,text:'Photosynthesis captures light energy and makes organic compounds that support life and food webs.'},
      {keys:/respirat|metabol|exercise/i,text:'Respiration transfers energy from organic compounds so cells can carry out life processes.'},
      {keys:/cycle|carbon|water|decompos|resource/i,text:'Materials are continually recycled between organisms and the environment.'},
      {keys:/inherit|gene|genome|phenotype|environment/i,text:'Characteristics arise from the interaction between the genome and the environment.'},
      {keys:/evolution|classification|fossil|extinction/i,text:'Evolution by natural selection explains both diversity and relationships between organisms.'}
    ],
    chemistry:[
      {keys:/atom|element|isotope|periodic/i,text:'Matter is made from atoms of elements, and atomic structure explains periodic patterns.'},
      {keys:/ionic|covalent|metallic|bond|structure|polymer/i,text:'Chemical behaviour and material properties depend on bonding, particle arrangement and structure.'},
      {keys:/rate|activation|catalyst|collision/i,text:'Chemical reactions have activation barriers, so conditions and catalysts can change reaction rates.'},
      {keys:/acid|proton/i,text:'Some chemical reactions can be understood as proton transfer.'},
      {keys:/redox|electrolysis|electron/i,text:'Some chemical reactions involve electron transfer.'},
      {keys:/covalent|organic|polymer/i,text:'Chemical change can involve changes in how atoms share electrons and form covalent bonds.'},
      {keys:/energy|exo|endo|bond energy/i,text:'Energy is conserved during chemical reactions, although it can be transferred between the reacting system and surroundings.'},
      {keys:/mole|mass|equation|yield|concentration|gas volume/i,text:'Quantitative chemistry connects particle-scale changes to measurable amounts using equations, ratios and conserved mass.'}
    ],
    physics:[
      {keys:/particle|wave|light|sound|model/i,text:'Physics uses models, including particle and wave models, to explain observations and make predictions.'},
      {keys:/force|acceleration|radioactive|cause|effect/i,text:'Cause-and-effect relationships connect changes in physical systems to measurable outcomes.'},
      {keys:/field|gravity|magnet|electric|electrostatic/i,text:'Gravitational, electric and magnetic fields explain interactions that act across a distance.'},
      {keys:/pressure|temperature|potential difference|voltage|gradient/i,text:'Differences between parts of a system can drive change, such as pressure, temperature or electrical potential differences.'},
      {keys:/proportional|hooke|mass|weight|resistance|current/i,text:'Many physical models use proportional relationships that can be tested with measurements and graphs.'},
      {keys:/equation|calculate|energy|power|momentum|density|speed|acceleration|wave/i,text:'Physical laws and models are often expressed mathematically and used quantitatively.'}
    ]
  };

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function specMeta(topic,lessonTitle){
    return maps[topic?.subject]?.getLesson?.(topic.id,lessonTitle)||null;
  }

  function commandGuidance(point=''){
    const p=point.trim();
    if(/^calculate|^use .* calculate|calculation/i.test(p)) return 'Show the relationship or equation, substitute values with units, calculate clearly and check the answer is sensible.';
    if(/^explain/i.test(p)) return 'Give the scientific idea, then link it to the stated outcome using a clear cause-and-effect chain.';
    if(/^compare|^distinguish/i.test(p)) return 'Give linked similarities and differences using the same comparison points for both sides.';
    if(/^evaluate/i.test(p)) return 'Use evidence for advantages and limitations, then make a justified conclusion in the context of the question.';
    if(/^interpret|graph|data|trend/i.test(p)) return 'Quote or use the evidence, identify the pattern and then connect it to the relevant scientific idea.';
    if(/^predict/i.test(p)) return 'State the expected outcome and justify it from the scientific model, relationship or evidence.';
    if(/^describe|^recall|^state|^identify|^recognise/i.test(p)) return 'Use precise subject terminology and include every named feature or stage required by the question.';
    if(/^apply|unfamiliar/i.test(p)) return 'Transfer the principle to the new context rather than relying on memorised wording from a familiar example.';
    return 'Be able to recall this accurately, explain it scientifically and apply it when the context is unfamiliar.';
  }

  function relevantKeyIdeas(topic,meta){
    const bank=KEY_IDEAS[topic.subject]||[];
    const hay=`${topic.title} ${meta.title} ${meta.section} ${(meta.focus||[]).join(' ')}`;
    const matched=bank.filter(item=>item.keys.test(hay)).map(item=>item.text);
    return (matched.length?matched:bank.slice(0,2)).slice(0,3);
  }

  function skillsFor(topic,meta){
    const joined=`${meta.title} ${meta.section} ${(meta.focus||[]).join(' ')} ${(meta.equations||[]).join(' ')}`.toLowerCase();
    const skills=[
      {type:'Working scientifically',text:'Use scientific models, evidence and cause-and-effect reasoning; distinguish observations, results and conclusions.'}
    ];
    if(/calculate|graph|percentage|ratio|mean|rate|standard form|equation|gradient|area|volume|concentration|probability|magnification/.test(joined)||meta.equations?.length){
      skills.push({type:'Maths',text:'Show mathematical working clearly, use consistent units, interpret graphs/data and select the correct relationship where needed.'});
    }
    if(meta.practical){
      skills.push({type:'Apparatus & practical',text:'Know the purpose of the required practical, the variables or observations involved, how data are recorded and how validity, repeatability and uncertainty are judged. Practical work itself should follow teacher supervision and school risk assessment.'});
    }
    if(/evaluate|evidence|uncertainty|risk|limitation|correlation|conclusion/.test(joined)){
      skills.push({type:'Evaluation',text:'Judge the quality of evidence, identify limitations and justify improvements or conclusions rather than giving unsupported opinions.'});
    }
    return skills;
  }

  function buildCoverage(topic,lessonTitle,lesson){
    const meta=specMeta(topic,lessonTitle);
    if(!meta) return null;
    const points=(meta.focus||[]).map((text,index)=>({index:index+1,text,guidance:commandGuidance(text)}));
    return {
      subject:topic.subject,
      topicId:topic.id,
      lessonTitle,
      ref:meta.ref,
      section:meta.section,
      scope:meta.scope,
      tier:meta.tier,
      points,
      equations:[...(meta.equations||[])],
      practical:meta.practical||'',
      keyIdeas:relevantKeyIdeas(topic,meta),
      skills:skillsFor(topic,meta),
      explanation:lesson?.depth?.explanation||lesson?.section?.[1]||topic.summary,
      misconception:lesson?.depth?.misconception||lesson?.sequence?.misconception||'',
      application:lesson?.depth?.application||lesson?.sequence?.application||''
    };
  }

  function coverageHtml(topic,lesson){
    const c=buildCoverage(topic,lesson.title,lesson);
    if(!c) return '';
    const scope=c.scope==='triple'?`Separate ${topic.subject[0].toUpperCase()+topic.subject.slice(1)} only`:'Combined + Separate';
    const tier=c.tier==='higher'?'Higher Tier':'Foundation + Higher';
    return `<section class="spec-completeness" data-note-block data-note-title="${esc(lesson.title)} · Full AQA specification coverage">
      <div class="spec-complete-head">
        <div><span class="eyebrow">Full specification coverage</span><h3>AQA ${esc(c.ref)} · ${esc(c.section)}</h3><p>Everything mapped to this sub-lesson is shown below so the teaching content and specification checklist stay together.</p></div>
        <div class="spec-complete-badges"><span>${esc(scope)}</span><span class="${c.tier==='higher'?'higher':''}">${esc(tier)}</span></div>
      </div>
      <div class="spec-core-reading"><strong>Core teaching</strong><p>${esc(c.explanation)}</p></div>
      <div class="spec-point-list">
        ${c.points.map(p=>`<article class="spec-point" data-spec-point="${p.index}"><span class="spec-point-number">${p.index}</span><div><strong>Specification point</strong><p>${esc(p.text)}</p><small>${esc(p.guidance)}</small></div></article>`).join('')}
      </div>
      ${c.equations.length?`<div class="spec-equation-row"><strong>Equations / quantitative relationships</strong><div>${c.equations.map(eq=>`<code>${esc(eq)}</code>`).join('')}</div></div>`:''}
      ${c.practical?`<div class="spec-practical-link"><strong>Required practical connection</strong><p>${esc(c.practical)}</p><small>Learn the scientific purpose, variables/observations, data handling and evaluation. Carry out practical work only under the appropriate school supervision and risk assessment.</small></div>`:''}
      <div class="spec-complete-grid">
        <article><span class="eyebrow">AQA key ideas linked here</span><ul>${c.keyIdeas.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>
        <article><span class="eyebrow">Skills to practise</span><ul>${c.skills.map(x=>`<li><strong>${esc(x.type)}:</strong> ${esc(x.text)}</li>`).join('')}</ul></article>
      </div>
      ${(c.application||c.misconception)?`<div class="spec-application-grid">${c.application?`<article><strong>Apply the specification</strong><p>${esc(c.application)}</p></article>`:''}${c.misconception?`<article><strong>Common error to avoid</strong><p>${esc(c.misconception)}</p></article>`:''}</div>`:''}
      <p class="spec-source-note">Specification content is paraphrased for teaching. The AQA subsection reference above is the authoritative location for the formal wording.</p>
    </section>`;
  }

  if(typeof lessonExpandedHtml==='function'){
    const previous=lessonExpandedHtml;
    lessonExpandedHtml=function(lesson){
      const topic=topics.find(t=>t.id===state.activeTopicId);
      return `${previous(lesson)}${topic?coverageHtml(topic,lesson):''}`;
    };
  }

  window.GCSE_SPECIFICATION_COMPLETENESS={maps,KEY_IDEAS,specMeta,buildCoverage,coverageHtml,commandGuidance,skillsFor,relevantKeyIdeas};
})();