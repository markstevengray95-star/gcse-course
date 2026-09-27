(() => {
  const attemptKey = 'gcse-science-exam-attempts-v1';
  const safe = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  let examAttempts = safe(localStorage.getItem(attemptKey), []);

  const equations = {
    b1:[['Magnification','magnification = image size ÷ real size','Use the same units for image size and real size before calculating.']],
    b2:[['Mean rate','rate = change ÷ time','State the unit, for example cm³/min or g/min.']],
    b4:[['Mean rate','rate = amount of product ÷ time','Photosynthesis rate can be estimated from oxygen produced per unit time.']],
    b5:[['Mean reaction time','mean = total of repeats ÷ number of repeats','Identify justified anomalies before calculating a mean.']],
    b7:[['Population estimate','estimated population = mean number per quadrat × total area ÷ quadrat area','Random sampling reduces bias; more samples improve reliability.']],
    c3:[
      ['Amount in moles','moles = mass ÷ relative formula mass','Higher Tier: use balanced equations to connect mole ratios.'],
      ['Concentration by mass','concentration (g/dm³) = mass of solute (g) ÷ volume (dm³)','Convert cm³ to dm³ by dividing by 1000.'],
      ['Percentage yield','percentage yield = actual yield ÷ theoretical yield × 100','Chemistry-only content.'],
      ['Atom economy','atom economy = Mr of desired product ÷ total Mr of products × 100','Use coefficients from the balanced equation.'],
      ['Gas volume at RTP','gas volume (dm³) = moles × 24','Chemistry-only Higher Tier at room temperature and pressure.']
    ],
    c5:[['Bond energy change','energy change = energy to break bonds − energy released making bonds','Positive values are endothermic; negative values are exothermic.']],
    c6:[['Rate of reaction','mean rate = quantity of reactant used or product formed ÷ time','Rate can be found from the gradient of a quantity–time graph.']],
    c8:[['Rf value','Rf = distance travelled by substance ÷ distance travelled by solvent front','Rf has no unit and should be between 0 and 1.']],
    p1:[
      ['Kinetic energy','Ek = ½mv²','Mass in kg, speed in m/s, energy in J.'],
      ['Gravitational potential energy','Ep = mgh','Use g = gravitational field strength in N/kg.'],
      ['Elastic potential energy','Ee = ½ke²','Applies in the linear elastic region.'],
      ['Power','P = E ÷ t  or  P = W ÷ t','Power is the rate of energy transfer or doing work.'],
      ['Specific heat capacity','ΔE = mcΔθ','Temperature change can be in °C because it is a difference.'],
      ['Efficiency','efficiency = useful output ÷ total input','Multiply by 100 for a percentage.']
    ],
    p2:[
      ['Charge flow','Q = It','Charge in C, current in A, time in s.'],
      ['Ohm’s law','V = IR','Use only where resistance is constant.'],
      ['Electrical power','P = VI  and  P = I²R','Power in W.'],
      ['Electrical energy','E = Pt  and  E = QV','Energy in J when SI units are used.']
    ],
    p3:[
      ['Density','ρ = m ÷ V','Use kg/m³ or g/cm³ consistently.'],
      ['Specific heat capacity','ΔE = mcΔθ','Energy needed for a temperature change.'],
      ['Specific latent heat','E = mL','Energy changes state without changing temperature.'],
      ['Gas pressure and volume','pV = constant','Physics-only Higher Tier for a fixed mass of gas at constant temperature.']
    ],
    p5:[
      ['Weight','W = mg','Weight is a force in newtons; mass is in kilograms.'],
      ['Work done','W = Fs','Use distance moved in the direction of the force.'],
      ['Hooke’s law','F = ke','Applies before the limit of proportionality.'],
      ['Speed','v = s ÷ t','Use the gradient of a distance–time graph.'],
      ['Acceleration','a = Δv ÷ t','Use the gradient of a velocity–time graph.'],
      ['Newton’s second law','F = ma','Use resultant force, not an individual force unless it is the resultant.'],
      ['Momentum','p = mv','Momentum has direction.'],
      ['Force and momentum','F = Δp ÷ Δt','Increasing collision time reduces force for the same momentum change.'],
      ['Moment','moment = force × perpendicular distance','Physics-only content.']
    ],
    p6:[['Wave speed','v = fλ','Speed in m/s, frequency in Hz, wavelength in m.'],['Period and frequency','T = 1 ÷ f','One complete oscillation takes one period.']],
    p7:[
      ['Motor effect','F = BIl','Physics-only quantitative form: field strength × current × conductor length.'],
      ['Transformer ratio','Vp ÷ Vs = Np ÷ Ns','Only works for transformers using alternating current.'],
      ['Ideal transformer power','VpIp = VsIs','Assumes negligible energy loss.']
    ]
  };

  const lessonRules = [
    [/microscop|magnification/i,'Microscopy is about both magnification and resolution. Convert units before using magnification = image size ÷ real size.','Do not describe magnification as “making the cell bigger”; the specimen is unchanged, only the image is enlarged.','Practise converting mm, µm and nm before doing a magnification calculation.'],
    [/mitosis|cell cycle/i,'Before mitosis, DNA is copied. Chromosomes are separated so two genetically identical daughter cells are produced for growth and repair.','Mitosis does not produce gametes; meiosis produces gametes.','Link cell division to growth, tissue repair or a named example such as replacement of skin cells.'],
    [/diffusion/i,'Diffusion is the net movement of particles from higher concentration to lower concentration because particles move randomly. Rate increases with a steeper gradient, larger surface area and higher temperature.','Diffusion does not require energy from respiration.','Explain gas exchange by linking a concentration gradient to a short diffusion distance and large surface area.'],
    [/osmosis/i,'Osmosis is the net movement of water through a partially permeable membrane from a dilute solution to a more concentrated solution.','Osmosis is water movement only; do not describe solute particles moving by osmosis.','Predict mass changes in plant tissue placed in different solution concentrations.'],
    [/active transport/i,'Active transport moves substances from lower concentration to higher concentration using energy transferred by respiration.','It is not “fast diffusion”; movement is against the concentration gradient.','Use mineral ion uptake by root hair cells or glucose absorption in the small intestine as an example.'],
    [/enzyme|amylase/i,'Enzymes are biological catalysts. The active site must be complementary to the substrate; temperature and pH can alter the active site and therefore rate.','High temperature does not “kill” an enzyme; it changes its structure and denatures it.','Interpret a rate graph and explain the rise to an optimum followed by a decrease.'],
    [/heart|circulat|blood vessel/i,'The heart creates pressure to move blood through a double circulatory system. Vessel structure is linked to pressure and exchange.','Veins are not “deoxygenated vessels” in every case; pulmonary veins carry oxygenated blood.','Compare arteries, veins and capillaries using wall thickness, lumen, valves and function.'],
    [/pathogen|communicable/i,'A pathogen is a disease-causing microorganism. Transmission depends on the pathogen and can involve air, water, contact or vectors.','A symptom is an effect of disease; it is not the pathogen itself.','For a named disease, connect pathogen type → transmission → symptoms → prevention.'],
    [/vaccin|immune|antibod/i,'Vaccination exposes the immune system to antigens so specific antibodies and memory cells are produced, allowing a faster secondary response.','Vaccines do not directly kill pathogens already causing an infection.','Explain how high vaccination coverage can reduce transmission through a population.'],
    [/photosynth/i,'Photosynthesis is an endothermic process transferring light energy into glucose. Light, carbon dioxide, temperature and chlorophyll can limit the rate.','Plants respire as well as photosynthesise.','Use a limiting-factor graph to identify why the rate has reached a plateau.'],
    [/respiration/i,'Respiration transfers energy from glucose. Aerobic respiration uses oxygen; anaerobic pathways transfer less energy and form different products.','Respiration is not the same as breathing.','Link increased respiration during exercise to oxygen demand, carbon dioxide removal and muscle activity.'],
    [/nervous|reflex|reaction time/i,'Receptors detect stimuli, neurones transmit electrical impulses and effectors produce responses. Reflexes use a rapid pathway that reduces delay.','Hormones travel in blood; nervous impulses travel along neurones.','Describe a reflex arc in the correct sequence from stimulus to response.'],
    [/blood glucose|insulin|diabetes/i,'Negative feedback keeps blood glucose within limits. Insulin lowers blood glucose; glucagon raises it by acting mainly on the liver.','Insulin does not “destroy sugar”; it promotes uptake and storage.','Explain the response after a carbohydrate-rich meal and during fasting.'],
    [/dna|gene|chromosome|genome/i,'Chromosomes are long DNA molecules. Genes are sections of DNA that code for products such as proteins; the genome is the complete genetic material of an organism.','A gene is not the same thing as a chromosome.','Move between DNA → gene → protein → characteristic in an explanation.'],
    [/meiosis|gamete/i,'Meiosis halves chromosome number and creates genetically different gametes. Fertilisation restores the normal chromosome number.','Meiosis produces four non-identical cells, unlike mitosis.','Use meiosis and random fertilisation to explain genetic variation.'],
    [/natural selection|evolution|resistan/i,'Natural selection requires inherited variation, a selection pressure, differential survival and reproduction, and change in allele frequency over generations.','Organisms do not evolve because they “need” to; selection acts on existing variation.','Apply the sequence to antibiotic resistance or another changing environment.'],
    [/quadrat|transect|sampling/i,'Sampling estimates abundance and distribution without counting every organism. Random quadrats reduce bias; transects show change across a gradient.','More quadrats improve reliability but do not automatically remove systematic bias.','Plan sampling with a random method, repeats, a mean and a justified sample size.'],
    [/atomic model|atom|isotope/i,'Atomic number is proton number; mass number is protons plus neutrons. Isotopes have the same proton number but different neutron numbers.','Changing neutrons does not change the element.','Calculate numbers of subatomic particles from isotope notation and explain isotope chemistry using electron structure.'],
    [/ionic bond/i,'Ionic bonding involves electron transfer to form oppositely charged ions held by strong electrostatic attraction in a giant lattice.','The bond is the electrostatic attraction, not the transfer itself.','Explain melting point and conductivity using particles, charge and mobility.'],
    [/covalent|giant covalent|graphite|diamond/i,'Covalent bonds are strong attractions between nuclei and shared pairs of electrons. Structure determines whether a substance is molecular or giant covalent.','Low boiling point in simple molecules is due to weak intermolecular forces, not weak covalent bonds.','Compare diamond and graphite by linking bonding and structure to hardness and conductivity.'],
    [/metallic|alloy/i,'Metals contain positive ions in a lattice surrounded by delocalised electrons. Strong electrostatic attraction gives high melting points and mobile electrons allow conduction.','Do not describe metallic bonding as atoms sharing fixed electron pairs.','Explain why alloys are harder by considering disruption of regular layers.'],
    [/mole|avogadro|limiting reactant/i,'The mole links particle number to measurable mass. Convert mass to moles before using balanced-equation ratios.','Do not use mass ratios directly unless they are justified by Mr values.','Use the sequence mass → moles → mole ratio → moles → mass.'],
    [/electrolysis/i,'Electrolysis uses electrical energy to decompose an ionic substance. Positive ions move to the cathode and negative ions to the anode.','Remember: cathode is negative in electrolysis and attracts cations.','Predict products by considering the ions present and whether the electrolyte is molten or aqueous.'],
    [/exother|endother|activation|bond energ/i,'Breaking bonds requires energy and making bonds releases energy. Overall energy change depends on the balance between these transfers.','A catalyst lowers activation energy but does not change the overall energy change.','Use a reaction profile to identify activation energy and whether products are above or below reactants.'],
    [/rate|collision|catalyst/i,'Reaction rate increases when successful collisions happen more often. Concentration, pressure, surface area and temperature alter collision frequency or energy.','A catalyst is not used up overall and does not increase the energy of particles.','Explain a rate change using collision frequency and the fraction of particles above activation energy.'],
    [/equilibrium|le chatelier/i,'At dynamic equilibrium in a closed system, forward and reverse reactions continue at equal rates. A change in conditions shifts the equilibrium position.','Equal rates do not mean equal concentrations.','Predict a shift, then explain how it opposes the imposed change.'],
    [/chromatograph|rf/i,'Chromatography separates substances because they have different attractions to the mobile and stationary phases. Rf compares substance travel with solvent-front travel.','Never measure from the bottom of the paper; measure from the start line.','Calculate an Rf value and compare it with reference data collected under the same conditions.'],
    [/density/i,'Density describes mass per unit volume. Measure mass and volume independently and keep units consistent.','A larger object is not necessarily denser; density is independent of sample size for a uniform material.','Choose a suitable method for volume: dimensions for regular solids, displacement for irregular solids.'],
    [/current|charge|circuit/i,'Current is the rate of flow of charge. Potential difference transfers energy per unit charge, while resistance determines how strongly a component opposes current.','Current is not “used up” as it moves through a series circuit.','Use circuit rules and V = IR to explain changes when resistance or supply pd changes.'],
    [/series circuit/i,'In series, current is the same through every component, potential differences add to the supply, and resistances add.','Do not say potential difference is always the same in series.','Predict how adding a resistor in series changes total resistance and current.'],
    [/parallel circuit/i,'In parallel, potential difference is the same across branches and current splits between branches before recombining.','Do not apply the series-current rule to parallel branches.','Use current conservation at a junction and compare branch resistance.'],
    [/radioactive|half-life|alpha|beta|gamma/i,'Radioactive decay is random for a single nucleus but predictable for a large sample. Half-life is the time for activity or undecayed nuclei to halve.','Half-life is not the time for all nuclei to decay.','Use repeated halving to interpret a decay graph and compare penetration and ionisation of alpha, beta and gamma.'],
    [/resultant|newton|acceleration/i,'A resultant force causes acceleration. Newton’s second law links resultant force, mass and acceleration using F = ma.','Constant speed in a straight line means resultant force is zero, not that no forces act.','Draw a force diagram, calculate the resultant, then connect it to acceleration.'],
    [/momentum/i,'Momentum equals mass × velocity and is conserved in a closed system. Force is linked to the rate of change of momentum.','Momentum is a vector, so direction matters.','Use conservation before and after a collision, keeping a consistent sign convention.'],
    [/wave|wavelength|frequency/i,'Wave speed equals frequency × wavelength. Amplitude relates to maximum displacement; frequency is oscillations per second.','Amplitude is not the same as wavelength.','Read a wave diagram, identify λ and amplitude, then calculate speed from v = fλ.'],
    [/electromagnetic spectrum/i,'All electromagnetic waves are transverse and travel at the same speed in a vacuum, but differ in frequency and wavelength.','Higher frequency means shorter wavelength, not slower speed in a vacuum.','Link each region to an application and a hazard using how it interacts with matter.'],
    [/motor effect|electromagnet/i,'A current produces a magnetic field. In an external magnetic field, a current-carrying conductor can experience a force: the motor effect.','An electromagnet requires current; a permanent magnet does not.','Predict ways to increase force by changing field strength, current or conductor length.'],
    [/transformer|induction|generator/i,'Electromagnetic induction requires a changing magnetic field through a conductor. Transformers use changing magnetic flux and different turns ratios to change alternating pd.','A transformer does not work with steady direct current.','Use the turns ratio to predict whether a transformer is step-up or step-down.'],
    [/red-shift|universe|big bang/i,'Red-shift means observed wavelengths from distant galaxies are increased. Greater red-shift generally corresponds to faster recession and supports an expanding Universe.','Red-shift is evidence for recession; it is not caused by stars simply becoming redder.','Connect red-shift and cosmic microwave background evidence to the Big Bang model.']
  ];

  function lessonDepth(title, topic){
    const match = lessonRules.find(([pattern]) => pattern.test(title));
    const fallback = [null,
      `Focus on the precise meaning of ${title.toLowerCase()} and how the idea fits into ${topic.title.toLowerCase()}.`,
      'Avoid vague phrases. Name the scientific process, quantity or structure and then explain the link.',
      `Apply ${title.toLowerCase()} to a new context, graph, calculation or practical observation.`
    ];
    const row = match || fallback;
    const topicEquations = equations[topic.id] || [];
    const relatedEquation = topicEquations.find(eq => title.toLowerCase().split(/\W+/).some(word => word.length>4 && eq.join(' ').toLowerCase().includes(word))) || null;
    return {explanation:row[1], misconception:row[2], application:row[3], equation:relatedEquation};
  }

  if (RICH && typeof RICH.getLesson === 'function') {
    const baseGetLesson = RICH.getLesson;
    RICH.getLesson = function(topic, lessonTitle, index=0){
      const lesson = baseGetLesson(topic, lessonTitle, index);
      if(!lesson) return lesson;
      return {...lesson, depth: lessonDepth(lessonTitle, topic)};
    };
  }

  if (typeof lessonExpandedHtml === 'function') {
    const baseLessonHtml = lessonExpandedHtml;
    lessonExpandedHtml = function(lesson){
      const original = baseLessonHtml(lesson);
      if(!lesson?.depth) return original;
      const d = lesson.depth;
      const extra = `<div class="learn-card deep-dive"><span class="eyebrow">Deeper understanding</span><h3>What matters in this lesson</h3><p>${escapeHtml(d.explanation)}</p><div class="lesson-insight-grid"><div><strong>Common mistake</strong><span>${escapeHtml(d.misconception)}</span></div><div><strong>Apply it</strong><span>${escapeHtml(d.application)}</span></div>${d.equation?`<div><strong>Useful equation</strong><span>${escapeHtml(d.equation[1])}</span></div>`:''}</div></div>`;
      return original.replace(/<\/div><\/div>$/, `${extra}</div></div>`);
    };
  }

  function equationHtml(topic){
    const list = equations[topic.id] || [];
    const physicsNote = topic.subject === 'physics' ? '<p class="exam-warning">For 2027 AQA GCSE Physics and Combined Science exams, an equations sheet is provided, but students are still assessed on selecting, rearranging and applying equations correctly.</p>' : '';
    if(!list.length){
      return `<div class="panel content-panel"><span class="eyebrow">Maths in science</span><h2>${topic.code}: mathematical skills</h2><p>This topic has no dedicated equation bank in the course. Focus on ratios, percentages, graph interpretation, significant figures, standard form and unit conversion where they appear in questions.</p></div>`;
    }
    return `<div class="panel content-panel"><span class="eyebrow">Equation & maths bank</span><h2>${topic.code}: equations to use confidently</h2>${physicsNote}<div class="equation-grid">${list.map(([name,eq,tip])=>`<article class="equation-card"><span>${escapeHtml(name)}</span><strong>${escapeHtml(eq)}</strong><p>${escapeHtml(tip)}</p></article>`).join('')}</div><div class="maths-method"><strong>Calculation routine</strong><span>1. Write the equation</span><span>2. Convert to suitable units</span><span>3. Substitute values</span><span>4. Rearrange if needed</span><span>5. Calculate and give a unit</span></div></div>`;
  }

  function storeAttempt(topic, index, q, answer){
    const points = q[2].map(k=>({k,hit:keywordHit(answer,k)}));
    const score = Math.min(q[1], points.filter(p=>p.hit).length);
    examAttempts.push({id:Date.now()+Math.random(),topic:topic.id,question:index,score,max:q[1],created:new Date().toISOString()});
    examAttempts = examAttempts.slice(-150);
    localStorage.setItem(attemptKey, JSON.stringify(examAttempts));
  }

  if(typeof renderExamPractice === 'function'){
    const baseExam = renderExamPractice;
    renderExamPractice = function(topic, guide){
      baseExam(topic, guide);
      els.topicContent.querySelectorAll('[data-mark]').forEach(btn=>btn.addEventListener('click',()=>{
        const i=Number(btn.dataset.mark), q=guide.exam[i], answer=document.getElementById(`exam-answer-${i}`)?.value || '';
        if(answer.trim()) storeAttempt(topic,i,q,answer);
      }));
    };
  }

  function topicAttemptStat(topicId){
    const list=examAttempts.filter(a=>a.topic===topicId);
    const score=list.reduce((n,a)=>n+a.score,0),max=list.reduce((n,a)=>n+a.max,0);
    return {attempts:list.length,score,max,percent:max?Math.round(score/max*100):null,last:list[list.length-1]||null};
  }

  function coachHtml(topic){
    const current=topicAttemptStat(topic.id), lessons=visibleLessons(topic), done=lessons.reduce((n,_,i)=>n+(lessonProgress[lessonKey(topic.id,i)]?1:0),0);
    const courseStats=availableTopics().map(t=>({topic:t,...topicAttemptStat(t.id)})).filter(x=>x.attempts).sort((a,b)=>(a.percent??101)-(b.percent??101));
    const weak=courseStats.slice(0,4);
    let next='Complete the first unfinished lesson, then answer an exam question.';
    if(done===lessons.length && current.attempts===0) next='Lessons are complete. Try the exam-practice questions to test application.';
    if(current.percent!==null && current.percent<60) next='Revisit the lesson and textbook sections linked to missing mark points, then reattempt the exam question.';
    if(current.percent!==null && current.percent>=60 && current.percent<85) next='Good foundation. Improve precision by using the exact scientific terms from the mark points.';
    if(current.percent!==null && current.percent>=85) next='Strong recent practice. Use retrieval or move to another topic, then return later for spaced practice.';
    return `<div class="coach-grid">
      <article class="panel content-panel"><span class="eyebrow">Current topic</span><h2>${topic.code} progress coach</h2><div class="coach-metrics"><div><strong>${done}/${lessons.length}</strong><span>lessons complete</span></div><div><strong>${current.percent===null?'—':current.percent+'%'}</strong><span>practice accuracy</span></div><div><strong>${current.attempts}</strong><span>marked attempts</span></div></div><div class="coach-next"><strong>Recommended next step</strong><p>${escapeHtml(next)}</p><button class="button primary" id="coachNextLesson" type="button">Open next lesson</button></div></article>
      <article class="panel content-panel"><span class="eyebrow">Across the course</span><h2>Topics to revisit</h2>${weak.length?`<div class="revisit-list">${weak.map(x=>`<button type="button" data-coach-topic="${x.topic.id}"><span>${x.topic.code} · ${escapeHtml(x.topic.title)}</span><strong>${x.percent}%</strong></button>`).join('')}</div>`:'<p class="muted">Complete some exam-practice auto-marks and the coach will build a revision picture here.</p>'}<button class="text-button danger-subtle" id="clearAttemptHistory" type="button">Clear practice history</button></article>
    </div>`;
  }

  function bindCoach(topic){
    document.getElementById('coachNextLesson')?.addEventListener('click',()=>{
      const lessons=visibleLessons(topic); let next=lessons.findIndex((_,i)=>!lessonProgress[lessonKey(topic.id,i)]); if(next<0)next=0;
      state.activeLessonIndex=next;state.activeTab='lessons';renderTopic();
    });
    els.topicContent.querySelectorAll('[data-coach-topic]').forEach(btn=>btn.addEventListener('click',()=>openTopic(btn.dataset.coachTopic)));
    document.getElementById('clearAttemptHistory')?.addEventListener('click',()=>{examAttempts=[];localStorage.removeItem(attemptKey);renderTopic();});
  }

  if(typeof renderTopicContent === 'function'){
    const baseTopicContent = renderTopicContent;
    renderTopicContent = function(topic){
      if(state.activeTab==='equations'){els.topicContent.innerHTML=equationHtml(topic);return;}
      if(state.activeTab==='coach'){els.topicContent.innerHTML=coachHtml(topic);bindCoach(topic);return;}
      return baseTopicContent(topic);
    };
  }

  window.GCSE_COURSE_ENHANCEMENTS={equations,lessonDepth,getAttempts:()=>examAttempts};
})();
