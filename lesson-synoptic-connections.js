(() => {
  const clean=v=>String(v??'').trim();
  const TOPIC_LINKS={
    b1:[['b2','Cells specialise and combine into tissues, organs and organ systems.'],['b6','DNA, chromosomes, mitosis and cell division underpin inheritance.'],['c2','Cell membranes and biological structures depend on molecular structure and interactions.']],
    b2:[['b1','Organisation depends on specialised cells and transport across cell membranes.'],['b4','Digestive and circulatory systems supply the reactants needed for respiration.'],['p1','Biological processes transfer energy and depend on energy supplied by respiration.']],
    b3:[['b5','Immune responses and body defence are coordinated biological responses.'],['b6','Variation and selection explain the development of antibiotic resistance.'],['c7','Medicines and organic molecules connect biological response with chemical structure.']],
    b4:[['b2','Gas exchange, circulation and digestion supply materials for respiration and photosynthesis.'],['p1','Respiration and photosynthesis connect chemical stores with energy transfers.'],['c5','Photosynthesis and respiration involve energy changes in chemical reactions.']],
    b5:[['b2','Control systems depend on organs and transport systems working together.'],['b1','Nervous and hormonal responses ultimately depend on specialised cells and membranes.'],['p5','Reaction time and reflexes can be analysed using motion, distance and time.']],
    b6:[['b1','DNA, chromosomes and cell division provide the cellular basis of inheritance.'],['b3','Natural selection explains antibiotic-resistant bacteria.'],['b7','Variation, adaptation and selection shape populations in ecosystems.']],
    b7:[['b6','Variation and natural selection explain adaptation within populations.'],['c9','Atmospheric change and greenhouse gases affect ecosystems and biodiversity.'],['c10','Resource use, sustainability and life-cycle choices affect habitats and biodiversity.']],
    c1:[['c2','Electron structure explains bonding and many material properties.'],['p4','Atomic structure links directly to nuclear structure, isotopes and radiation.'],['c4','Periodic position and electron structure help explain chemical reactivity.']],
    c2:[['c1','Electron arrangements determine ionic, covalent and metallic bonding.'],['c3','Structure, formulae and relative masses underpin quantitative chemistry.'],['p3','Particle arrangements and forces help explain states and bulk properties.']],
    c3:[['c4','Moles and reacting masses quantify chemical changes.'],['c6','Rates data and reaction quantities require proportional and graphical reasoning.'],['p1','Conservation and quantitative reasoning connect chemistry calculations with energy calculations.']],
    c4:[['c1','Electron structure and periodic trends explain reactivity.'],['c2','Ionic bonding explains electrolysis and movement of ions.'],['c3','Chemical equations and moles quantify reactions and electrolysis.']],
    c5:[['c4','Chemical changes can be classified by their energy transfer.'],['p1','Energy changes in reactions connect chemical stores with wider energy-transfer models.'],['c6','Activation energy and reaction profiles connect energy changes with reaction rates.']],
    c6:[['c5','Activation energy links collision theory with reaction energy profiles.'],['c3','Rates experiments use quantitative data, proportional reasoning and graphs.'],['b4','Limiting factors and rate ideas also appear in photosynthesis and enzyme-controlled biology.']],
    c7:[['c2','Carbon bonding and molecular structure determine the properties of organic compounds.'],['c9','Combustion of fuels links organic chemistry to atmospheric pollution and climate.'],['c10','Polymers, fuels and feedstocks connect organic chemistry with resource use and sustainability.']],
    c8:[['c1','Atomic and ionic identities underpin flame tests and instrumental analysis.'],['c2','Bonding and structure help explain properties used in separation and identification.'],['c3','Concentration and quantitative reasoning support chemical analysis.']],
    c9:[['c7','Combustion of hydrocarbons changes atmospheric composition.'],['b7','Climate change and pollution affect ecosystems and biodiversity.'],['c10','Resource choices and sustainability can reduce environmental impacts.']],
    c10:[['c7','Organic feedstocks, polymers and fuels are major resource-use decisions.'],['c9','Resource extraction and manufacture connect to atmospheric and environmental impacts.'],['b7','Sustainable resource use affects habitats, biodiversity and food security.']],
    p1:[['b4','Respiration transfers energy from chemical stores for biological processes.'],['c5','Chemical reactions can transfer energy between stores and surroundings.'],['p5','Work done and power connect energy transfers with forces and motion.']],
    p2:[['p7','Electric currents and magnetic fields combine in motors, generators and transformers.'],['c4','Electrolysis also depends on charge flow, potential difference and ions.'],['p1','Electrical devices transfer energy and power links energy to time.']],
    p3:[['c2','Particle arrangement and bonding explain many material properties and changes of state.'],['p1','Heating changes internal energy and can cause temperature or state changes.'],['c6','Particle motion and collisions connect thermal ideas with rates of reaction.']],
    p4:[['c1','Atomic models, isotopes and subatomic particles underpin nuclear physics.'],['b3','Radiation can be used in medicine, linking nuclear physics with biological applications.'],['p8','Nuclear processes and spectra contribute to understanding stars and the Universe.']],
    p5:[['p1','Work done, kinetic energy and power connect forces with energy transfers.'],['p6','Forces and motion affect waves and measurements such as time, distance and speed.'],['b5','Reaction time provides a biological context for motion measurements.']],
    p6:[['p7','Electromagnetic induction and communication rely on wave behaviour.'],['p2','Electromagnetic waves and electrical systems are linked in communication technologies.'],['p8','Light spectra and red-shift provide evidence about stars and the expanding Universe.']],
    p7:[['p2','Current creates magnetic fields and changing fields can induce potential differences.'],['p1','Motors and transformers transfer energy and involve power/efficiency.'],['p6','Electromagnetic radiation and fields are different models but often appear together in technologies.']],
    p8:[['p6','Light, spectra and red-shift provide astronomical evidence.'],['p4','Nuclear fusion and radioactive processes help explain stars and element formation.'],['p1','Stars involve enormous energy transfers over their life cycles.']]
  };
  function topicById(all,id){return(all||[]).find(t=>t.id===id)||null;}
  function lessonHook(model){
    const text=`${model?.title||''} ${(model?.keyTerms||[]).map(x=>x[0]).join(' ')}`.toLowerCase();
    if(/respirat|photosynth|energy/.test(text))return'Compare how energy is transferred and conserved in both contexts.';
    if(/diffusion|osmosis|transport|current|ion/.test(text))return'Compare what moves, what causes the movement and what limits the rate.';
    if(/rate|enzyme|collision|limiting/.test(text))return'Identify the factor controlling rate in each context and explain the mechanism.';
    if(/force|motion|momentum|speed|acceleration/.test(text))return'Translate the cause-and-effect chain into quantities, directions and measurable evidence.';
    if(/atom|electron|bond|ion|radiation/.test(text))return'Connect the microscopic particle model to the observable behaviour in both topics.';
    if(/ecosystem|climate|resource|sustain/.test(text))return'Trace the causal chain from scientific process to environmental consequence.';
    return'Identify the scientific idea that transfers between the two contexts, then explain where the analogy stops.';
  }
  function build(model,topic,allTopics=[]){
    if(!model||!topic)return null;
    const raw=TOPIC_LINKS[topic.id]||[];
    const links=raw.map(([id,reason],index)=>{
      const target=topicById(allTopics,id);if(!target)return null;
      const sameSubject=target.subject===topic.subject;
      const transfer=lessonHook(model);
      return{
        id:`${model.id}:synoptic:${index}`,targetId:id,targetCode:target.code,targetTitle:target.title,targetSubject:target.subject,sameSubject,
        reason,transfer,
        question:`Using ${model.title} and ${target.code} ${target.title}, ${transfer.charAt(0).toLowerCase()+transfer.slice(1)}`,
        examChallenge:`A GCSE question combines ${model.title} with ${target.title}. Explain one valid connection, apply it to an unfamiliar context, and state one important difference between the two situations.`
      };
    }).filter(Boolean);
    return{lessonId:model.id,title:model.title,topicId:topic.id,links};
  }
  function validate(plan){
    const missing=[];if(!plan)return['synoptic-plan'];
    if((plan.links||[]).length<2)missing.push('link-count');
    (plan.links||[]).forEach((l,i)=>{if(!clean(l.targetTitle))missing.push(`target-${i}`);if(!clean(l.reason))missing.push(`reason-${i}`);if(!clean(l.transfer))missing.push(`transfer-${i}`);if(!clean(l.question))missing.push(`question-${i}`);if(!clean(l.examChallenge))missing.push(`exam-${i}`);});
    return[...new Set(missing)];
  }
  window.GCSE_LESSON_SYNOPTIC={build,validate,TOPIC_LINKS};
})();