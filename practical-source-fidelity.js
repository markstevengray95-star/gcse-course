(() => {
  const PORT=window.GCSE_PRACTICAL_SOURCE_PORT;
  if(!PORT)return;

  const sourceIds=Object.keys(PORT.catalog);
  PORT.sourceIds=sourceIds.slice();

  // The original practical-sim intentionally contained 26 practical topics. The
  // synced GCSE course contains two additional Separate Science required practicals.
  // Keep the source set intact and add explicit course-completion teaching models so
  // no AQA launcher ever falls back to an unrelated practical.
  PORT.catalog['milk-decay']={
    subject:'biology',scene:'milk-decay',number:10,separate:true,courseSupplement:true,
    question:'How does temperature affect the rate of milk decay measured by pH change?',
    method:[
      'Use equal simulated samples with the same starting pH and compare different temperatures.',
      'Keep sample volume, starting conditions and measurement interval constant.',
      'Record pH change over the same time period, repeat temperatures and compare the pattern.'
    ],
    safety:'Simulation only. Any real milk-decay practical must use the school-approved method, hygiene controls and teacher risk assessment.',
    note:'Course-completion teaching model for AQA Biology required practical 10. The pH values are illustrative model outputs, not experimental reference data.',
    setups:[{
      name:'Temperature and pH change',
      iv:'Temperature (°C)',
      dv:'pH after the selected observation time',
      controls:['Same milk sample volume and starting pH','Same observation time for a comparison series','Same pH measurement method and starting conditions'],
      inputs:[
        {type:'range',key:'x',label:'Temperature',min:5,max:45,step:5,value:25,unit:'°C'},
        {type:'range',key:'time',label:'Observation time',min:15,max:120,step:15,value:60,unit:'min'}
      ],
      xLabel:'Temperature (°C)',yLabel:'pH after observation time'
    }],
    model(v){
      const start=6.7;
      const tempFactor=Math.min(4,Math.max(.12,Math.pow(2,(Number(v.x)-20)/10)));
      const drop=Math.min(2.3,.18*tempFactor*(Number(v.time)/60));
      const ph=Math.max(4.4,start-drop);
      return {x:Number(v.x),y:ph,readings:[['Starting pH',start.toFixed(2)],['Final pH',ph.toFixed(2)],['pH decrease',(start-ph).toFixed(2)],['Observation time',`${v.time} min`]],observation:'A larger pH decrease over the same time represents faster decay in this teaching model.',start,ph,drop};
    }
  };

  PORT.catalog['ion-tests']={
    subject:'chemistry',scene:'ion-tests',number:7,separate:true,courseSupplement:true,
    question:'Which chemical-test observations identify the ions in an unknown ionic compound?',
    method:[
      'Select one simulated unknown and choose a suitable ion test.',
      'Record the observation before deciding which ion it supports.',
      'Use more than one appropriate observation where needed to identify both ions in the compound.'
    ],
    safety:'Simulation only. Real ion tests use school-approved reagents, quantities, eye protection and teacher supervision; follow the school risk assessment.',
    note:'Course-completion teaching model for AQA Chemistry required practical 7. It rehearses the specified observation-to-ion reasoning without replacing supervised laboratory work.',
    setups:[{
      name:'Identify ions in an unknown',
      iv:'Unknown ionic compound and selected chemical test',
      dv:'Characteristic flame, precipitate or gas-test observation',
      controls:['Use the specified test procedure consistently','Use clean apparatus between tests','Record observations before drawing a conclusion'],
      inputs:[
        {type:'choice',key:'x',label:'Unknown sample',options:['Unknown A','Unknown B','Unknown C','Unknown D','Unknown E'],value:'Unknown A'},
        {type:'choice',key:'test',label:'Chemical test',options:['Flame test','Sodium hydroxide','Acidified silver nitrate','Acidified barium solution','Dilute acid then limewater'],value:'Flame test'}
      ],
      xLabel:'Unknown / test',yLabel:'Observation',qualitative:true
    }],
    model(v){
      const compounds={
        'Unknown A':{name:'sodium chloride',cation:'Na⁺',anion:'Cl⁻'},
        'Unknown B':{name:'copper(II) sulfate',cation:'Cu²⁺',anion:'SO₄²⁻'},
        'Unknown C':{name:'potassium sulfate',cation:'K⁺',anion:'SO₄²⁻'},
        'Unknown D':{name:'calcium chloride',cation:'Ca²⁺',anion:'Cl⁻'},
        'Unknown E':{name:'sodium carbonate',cation:'Na⁺',anion:'CO₃²⁻'}
      };
      const sample=compounds[v.x]||compounds['Unknown A'];
      let observation='No characteristic positive result in this model.',evidence='This test does not identify an ion present in the selected unknown.';
      if(v.test==='Flame test'){
        const flames={'Na⁺':'yellow','K⁺':'lilac','Ca²⁺':'orange-red','Cu²⁺':'green'};
        observation=`${flames[sample.cation]||'No characteristic'} flame colour`;
        evidence=`Evidence for ${sample.cation}.`;
      }else if(v.test==='Sodium hydroxide'){
        const hydroxides={'Cu²⁺':'Blue precipitate','Ca²⁺':'White precipitate'};
        if(hydroxides[sample.cation]){observation=hydroxides[sample.cation];evidence=`Evidence consistent with ${sample.cation}.`;}
      }else if(v.test==='Acidified silver nitrate'&&sample.anion==='Cl⁻'){
        observation='White precipitate';evidence='Evidence for chloride ions, Cl⁻.';
      }else if(v.test==='Acidified barium solution'&&sample.anion==='SO₄²⁻'){
        observation='White precipitate';evidence='Evidence for sulfate ions, SO₄²⁻.';
      }else if(v.test==='Dilute acid then limewater'&&sample.anion==='CO₃²⁻'){
        observation='Effervescence; the gas turns limewater milky';evidence='Evidence for carbonate ions, CO₃²⁻, through carbon dioxide production.';
      }
      return {x:`${v.x} / ${v.test}`,y:null,readings:[['Observation',observation],['Interpretation',evidence],['Teacher reveal',sample.name]],observation:`${observation}. ${evidence}`,sample};
    }
  };

  PORT.resolution['milk-decay']=[.01];
  PORT.resolution['ion-tests']=[0];
  PORT.courseSupplementIds=['milk-decay','ion-tests'];

  const baseMatch=PORT.matchCoursePractical.bind(PORT);
  PORT.matchCoursePractical=(text='',subject='')=>{
    const value=String(text);
    if(/milk.*pH|temperature.*decay|decay.*milk/i.test(value))return 'milk-decay';
    if(/identify ions|unknown.*ionic|chemical tests.*ions|ions in unknown/i.test(value))return 'ion-tests';
    return baseMatch(value,subject);
  };

  const apparatus={
    osmosis:['Balance, equal potato cylinders and labelled beakers of sucrose solution.'],
    enzymes:['35 °C water bath, amylase, starch, pH buffers, iodine spotting tile and timer.'],
    photosynthesis:['Pondweed, sodium hydrogencarbonate solution, lamp, ruler and gas-collection tube.'],
    microbiology:['Prepared agar plate, sterile discs, equal antiseptic volumes and a sterile-water control.'],
    'food-tests':['Separate food portions, clean test tubes and the selected reagent; a water bath for Benedict’s.'],
    'reaction-time':['Ruler-release signal and Catch button or Space key on the same device for every trial.'],
    'plant-responses':['Equal seedlings and a light source placed overhead or to one side.','Equal seedlings placed upright or on their sides in darkness.'],
    'field-investigations':['Transect tape and a 0.5 m × 0.5 m quadrat on the simulated habitat.','Random coordinate selector and a 0.5 m × 0.5 m quadrat.'],
    microscopy:['Thin stained slide, coverslip, low-power objective and calibrated scale.'],
    chromatography:['Paper with pencil baseline, a small ink spot and solvent below the baseline.'],
    'water-purification':['Filter funnel and paper for solids; condenser and receiver for dissolved salt; equal-volume samples for tests.'],
    electrolysis:['Low-voltage DC supply, two inert graphite electrodes and the selected aqueous electrolyte.'],
    'making-salts':['Dilute sulfuric acid, copper oxide, filter funnel, evaporating basin and drying papers.'],
    'temperature-changes':['Insulated cup, lid, thermometer and equal 25 cm³ volumes of acid and alkali.'],
    'rates-of-reaction':['Equal magnesium pieces, excess acid, sealed flask, gas syringe and timer.','Thiosulfate and acid solutions, marked cross, flask and timer.'],
    titration:['Rinsed burette of acid, pipette of alkali, flask and phenolphthalein indicator.'],
    'hookes-law':['Clamped spring, masses, pointer and ruler aligned with the unloaded position.'],
    'specific-heat-capacity':['Insulated metal block, heater, thermometer, ammeter, voltmeter and timer.'],
    resistance:['Low-voltage circuit with wire, ruler, ammeter and voltmeter across the wire.','10 Ω and 20 Ω resistors, low-voltage supply, ammeter and voltmeter across the combination.'],
    density:['Zeroed balance, cube and ruler for three dimensions.','Zeroed balance, irregular solid and measuring cylinder for water displacement.','Zeroed balance and measuring cylinder; weigh the empty cylinder first.'],
    'iv-characteristics':['Current-limited supply, selected component, ammeter in series and voltmeter across the component.'],
    acceleration:['Trolley, pulley, hanging mass and light gates; transfer masses to vary force.','Trolley, pulley, fixed hanging mass and light gates; add mass to the trolley.'],
    waves:['Shallow ripple tank, dipper, frequency control and ruler spanning several wavefronts.','Vibration generator, taut string, fixed tension and ruler spanning several wavelengths.'],
    radiation:['Leslie cube faces at the same temperature and infrared detector at a fixed distance.','Equal-area surfaces and a common infrared source at a fixed distance.'],
    insulation:['Identical lidded beakers, equal insulation thickness, hot water and thermometer.'],
    light:['Plane mirror, ray box, paper normal and protractor measured from the normal.','Transparent parallel-sided block, ray box, paper normal and protractor.'],
    'milk-decay':['Equal milk samples, labelled temperature conditions, timer and pH measurement display.'],
    'ion-tests':['Labelled unknown sample, clean test vessel and the selected simulated ion-test reagent.']
  };
  PORT.apparatusGuide=apparatus;
  PORT.guideSteps=()=>{
    const s=PORT.currentSetup(),list=apparatus[PORT.state.id]||[],equipment=list[PORT.state.mode]||list[0]||`Apparatus for ${s.name}.`;
    const condition=/^No |^Selected |^Unknown /.test(s.iv)?'Use the selected specimen, unknown or procedure.':`Choose ${s.iv}.`;
    return [
      ['Identify the apparatus',equipment],
      ['Set and check conditions',`${condition} Keep constant: ${s.controls.join('; ')}.`],
      ['Prepare to observe or measure',`Look for ${s.dv}. ${PORT.config().safety}`]
    ];
  };

  const baseRun=PORT.run.bind(PORT);
  const baseRecord=PORT.record.bind(PORT);
  const baseRepeat=PORT.repeat.bind(PORT);
  const baseReset=PORT.resetApparatus.bind(PORT);
  const baseSetMode=PORT.setMode.bind(PORT);
  const baseSetValue=PORT.setValue.bind(PORT);
  const baseTitrationDrop=PORT.titrationDrop.bind(PORT);
  const baseRandomQuadrat=PORT.randomQuadrat.bind(PORT);

  PORT.run=()=>{
    const st=PORT.state;
    if(!st.guideReady)return null;
    st._currentRecorded=false;
    if(st.id==='making-salts'&&PORT.currentSetup().procedure){
      if(st.result){st.stage=st.stage>=4?0:st.stage+1;}
      st.result=PORT.config().model(st.values,st);
      st.measurement=null;
      PORT.persist();
      return st.result;
    }
    return baseRun();
  };
  PORT.record=()=>{
    const row=baseRecord();
    if(row)PORT.state._currentRecorded=true;
    return row;
  };
  PORT.repeat=()=>{
    if(!PORT.state.guideReady||!PORT.state.result||!PORT.state._currentRecorded)return false;
    const row=baseRepeat();
    if(row)PORT.state._currentRecorded=true;
    return row;
  };
  PORT.resetApparatus=()=>{const out=baseReset();PORT.state._currentRecorded=false;return out;};
  PORT.setMode=mode=>{const out=baseSetMode(mode);PORT.state._currentRecorded=false;return out;};
  PORT.setValue=(key,value)=>{const out=baseSetValue(key,value);if(out)PORT.state._currentRecorded=false;return out;};
  PORT.titrationDrop=()=>{if(!PORT.state.guideReady)return false;const out=baseTitrationDrop();PORT.state._currentRecorded=false;return out;};
  PORT.randomQuadrat=()=>{if(!PORT.state.guideReady)return false;const out=baseRandomQuadrat();PORT.state._currentRecorded=false;return out;};

  // Match the original app's reaction-time workflow: a false start is rejected and a
  // successful catch produces a reading that the learner then chooses to record.
  PORT.catchReaction=()=>{
    const st=PORT.state;
    if(st.id!=='reaction-time')return null;
    if(st.reactionPhase!=='go'){
      st.reactionPhase='false-start';
      clearTimeout(st.reactionTimer);
      st.result=null;st.measurement=null;st._currentRecorded=false;
      return {falseStart:true};
    }
    const ms=performance.now()-st.reactionStart;
    st.reactionPhase='caught';st.reactionMs=ms;
    st.result=PORT.config().model(st.values,st);st.measurement=ms;st._currentRecorded=false;
    PORT.persist();
    return st.result;
  };

  // Restored records count as recorded; a newly initialised result does not.
  const baseInitialise=PORT.initialise.bind(PORT);
  PORT.initialise=(id,mode=0)=>{const st=baseInitialise(id,mode);st._currentRecorded=false;return st;};

  window.GCSE_PRACTICAL_SOURCE_FIDELITY={sourceIds:PORT.sourceIds,supplements:PORT.courseSupplementIds,apparatusGuide:apparatus};
})();