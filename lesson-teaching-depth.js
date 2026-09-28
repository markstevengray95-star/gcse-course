(() => {
  const clean=v=>String(v??'').trim();
  const words=v=>clean(v).toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);
  const overlap=(a,b)=>{const bw=new Set(words(b));return words(a).reduce((n,w)=>n+(bw.has(w)?1:0),0);};

  const profiles=[
    {rx:/diffusion|osmosis|active transport|exchange surface/i,example:'Use a cell or exchange surface and track what moves, in which direction, and what provides the driving force.',application:'Predict how changing concentration, surface area, membrane properties or energy supply changes movement.',question:'Describe the movement first, then explain why there is a net movement.'},
    {rx:/enzyme|active site|amylase|digestion/i,example:'Use an enzyme–substrate example and connect active-site shape to the rate of product formation.',application:'Apply the idea to a temperature or pH change and predict the effect on enzyme activity.',question:'Explain the pattern using collisions, active-site shape and denaturation where appropriate.'},
    {rx:/heart|blood|circulation|vessel|gas exchange|lung/i,example:'Trace a named substance through the relevant organ or vessel and link structure to its transport or exchange function.',application:'Apply structure–function reasoning to pressure, flow, diffusion distance or surface area.',question:'State the structural feature, then explain exactly how it improves the function.'},
    {rx:/photosynth|respirat|metabolism/i,example:'Track reactants, products and energy transfer through the process rather than memorising the equation alone.',application:'Predict the effect of changing a limiting factor or energy demand.',question:'Link the change in conditions to the process and then to the measured outcome.'},
    {rx:/homeostasis|negative feedback|nervous|reflex|hormone|insulin|glucose|temperature/i,example:'Build the control pathway as change → receptor → coordination centre → effector → response.',application:'Apply the feedback loop to a variable moving above or below its normal range.',question:'Explain how the response reverses the original change.'},
    {rx:/dna|gene|chromosome|allele|mitosis|meiosis|inherit|variation|selection/i,example:'Move carefully through the levels DNA → gene/allele → protein or inherited information → phenotype or cell outcome.',application:'Apply the relationship to a genetic cross, cell division or selection context.',question:'Use the correct genetic level in every step of the explanation.'},
    {rx:/ecosystem|food chain|quadrat|transect|biodiversity|cycle|decomposition/i,example:'Use a named organism, factor or sampling result and identify the direct ecological relationship first.',application:'Predict a direct effect and then at least one indirect consequence through the ecosystem.',question:'Support the ecological conclusion with evidence rather than description alone.'},
    {rx:/atom|isotope|electron|periodic|group 1|group 7|group 0/i,example:'Use proton number and electron arrangement to connect atomic structure to identity and chemical behaviour.',application:'Predict ion formation, reactivity or a periodic trend from the particle arrangement.',question:'Explain the observation using electrons and nuclear charge where relevant.'},
    {rx:/ionic|covalent|metallic|bond|diamond|graphite|polymer|nanoparticle/i,example:'Start with the structure and particles present, then identify the forces or mobile charge carriers.',application:'Use bonding and structure to predict melting point, conductivity or mechanical properties.',question:'Name the particles and forces explicitly instead of saying only that bonds are strong.'},
    {rx:/mole|relative formula mass|concentration|yield|atom economy|gas volume|stoichiometr/i,example:'Write a route from the known quantity to moles or ratio and then to the required quantity before inserting numbers.',application:'Apply the route to an unfamiliar reaction while keeping units and balanced-equation ratios consistent.',question:'Show every conversion and justify the reacting ratio from the balanced equation.'},
    {rx:/acid|alkali|salt|electrolysis|redox|oxidation|reduction/i,example:'Identify the reacting particles and track ions, hydrogen ions or electrons through the change.',application:'Predict products or write an ionic/half equation in a new chemical context.',question:'Explain product formation using particle movement or electron transfer.'},
    {rx:/exother|endother|activation energy|bond energy|reaction profile/i,example:'Separate the energy needed to break bonds from the energy released when new bonds form.',application:'Use a reaction profile or bond energies to classify and quantify the overall energy change.',question:'Distinguish activation energy from the overall energy change.'},
    {rx:/rate|collision|catalyst|equilibrium|le chatelier/i,example:'For rate, use successful-collision frequency; for equilibrium, compare forward and reverse processes.',application:'Predict how concentration, pressure, temperature or catalyst changes the system.',question:'State the change, explain the particle-level effect, then connect it to rate or equilibrium position.'},
    {rx:/alkane|alkene|cracking|alcohol|carboxylic|polymer|organic/i,example:'Identify the functional group or homologous series before predicting reactions and products.',application:'Use a structural formula or reaction condition to identify an unfamiliar organic product.',question:'Use the structural feature as the evidence for the classification or reaction.'},
    {rx:/chromatograph|rf|flame test|gas test|ion test|analysis/i,example:'Separate the observation from the conclusion and use the measured result to identify or distinguish substances.',application:'Choose an analytical method and interpret an unfamiliar result or chromatogram.',question:'State the observation first, then the conclusion it supports.'},
    {rx:/atmosphere|greenhouse|climate|pollut/i,example:'Separate evidence, mechanism and consequence when explaining atmospheric change.',application:'Use data or a mechanism to assess the likely consequence of changing gas concentration.',question:'Connect the molecular or radiation mechanism to the observed environmental effect.'},
    {rx:/resource|water|life cycle|recycl|haber|fertiliser|corrosion/i,example:'Track material and energy inputs through the process and identify environmental and economic trade-offs.',application:'Use data from an unfamiliar process to justify a resource-management choice.',question:'Give evidence for both the benefit and the limitation before reaching a conclusion.'},
    {rx:/energy|kinetic|gravitational|elastic|power|efficien|specific heat/i,example:'Define the system, identify the initial and final energy stores, then quantify the transfer if possible.',application:'Use the appropriate equation or efficiency relationship in a different physical context.',question:'Describe where energy is transferred and avoid saying that energy is simply lost.'},
    {rx:/current|potential difference|resistance|circuit|ohm|series|parallel|mains|national grid/i,example:'Identify the circuit arrangement first, then apply current, potential difference and resistance relationships.',application:'Predict what changes when a component or branch is altered and justify it quantitatively where possible.',question:'Link the circuit rule or equation directly to the component behaviour.'},
    {rx:/density|particle model|state|internal energy|latent|gas pressure/i,example:'Use particle spacing, motion and forces to explain the macroscopic observation.',application:'Apply the particle model or relevant equation to a change of state, heating or pressure context.',question:'Separate temperature change from energy transferred during a change of state.'},
    {rx:/radioactive|alpha|beta|gamma|half-life|fission|fusion/i,example:'Distinguish the random decay of an individual nucleus from the predictable behaviour of a large sample.',application:'Interpret a decay graph, compare radiation or balance a nuclear change.',question:'Use nuclear changes and penetration/ionisation properties rather than vague statements about danger.'},
    {rx:/force|newton|acceleration|velocity|distance-time|momentum|stopping|moment|pressure/i,example:'Represent the forces or motion first, then select the relationship that links the known quantities.',application:'Apply the model to an unfamiliar free-body diagram, motion graph or calculation.',question:'State the resultant effect before describing how the motion changes.'},
    {rx:/wave|frequency|wavelength|electromagnetic|sound|lens|light|infrared|black body/i,example:'Identify the wave quantity or interaction, then use a labelled diagram or v = fλ relationship where appropriate.',application:'Predict how the wave changes when frequency, wavelength, medium or boundary changes.',question:'Distinguish wave speed, frequency and wavelength clearly in the explanation.'},
    {rx:/magnet|motor|electromagnet|induction|generator|transformer/i,example:'Identify the current, field and motion or changing magnetic flux before deciding the effect.',application:'Apply the motor effect, induction or transformer relationship to a changed setup.',question:'State what changes in the magnetic interaction and how that produces the observed effect.'},
    {rx:/solar system|star|orbit|red-shift|universe|big bang/i,example:'Start with the astronomical observation, then state the model or conclusion that the observation supports.',application:'Apply the same evidence-to-model reasoning to an unfamiliar star, orbit or cosmological observation.',question:'Separate what is directly observed from the scientific interpretation.'}
  ];

  function bestTerm(point,terms=[]){
    const ranked=(terms||[]).filter(x=>Array.isArray(x)&&x[0]&&x[1]).map(pair=>({pair,score:overlap(point,pair[0])})).sort((a,b)=>b.score-a.score);
    return ranked[0]?.pair||terms?.[0]||null;
  }

  function profileFor(text){return profiles.find(p=>p.rx.test(text))||null;}

  function enrich({topic,title,point,core,terms,application,misconception,guidance,index}){
    const combined=`${title} ${point}`;
    const profile=profileFor(combined);
    const term=bestTerm(point,terms);
    const definition=term?`${term[0]} — ${term[1]}`:`${point}`;
    const explanation=clean(core)||`This specification point requires you to understand and apply: ${point}`;
    const example=profile?.example||`Use a concrete ${topic?.subject||'science'} example and show exactly how it demonstrates this idea.`;
    const apply=profile?.application||clean(application)||`Apply this idea to an unfamiliar GCSE-style context.`;
    const misconceptionText=clean(misconception)||`Do not replace the scientific explanation with vague everyday wording.`;
    const question=profile?.question||clean(guidance)||`Explain this specification point accurately, then apply it to a new context.`;
    return {
      index:index+1,text:clean(point),definition,explanation,example,application:apply,
      misconception:misconceptionText,question,
      visualKey:combined.toLowerCase(),
      sequence:['definition','explanation','example','visual','application','misconception','question']
    };
  }

  function validate(unit){
    const required=['definition','explanation','example','application','misconception','question','visualKey'];
    return required.filter(k=>!clean(unit?.[k]));
  }

  window.GCSE_LESSON_TEACHING_DEPTH={enrich,validate,profileFor,bestTerm};
})();