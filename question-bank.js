(() => {
  const extra = {
    b1:[
      ['A student places plant cells in a concentrated sugar solution. Explain why the cells lose mass.',4,['water moves','osmosis','partially permeable membrane','higher water concentration inside','net movement out']],
      ['An image of a cell is 72 mm wide. The real cell is 0.024 mm wide. Calculate the magnification.',2,['3000']],
      ['Explain two advantages and one limitation of using an electron microscope rather than a light microscope.',4,['higher resolution','higher magnification','smaller structures','not living','expensive','complex preparation']]
    ],
    b2:[
      ['Explain how the small intestine is adapted for rapid absorption of digested food molecules.',4,['large surface area','villi','thin wall','blood supply','concentration gradient']],
      ['A student measures 18 cm³ of gas produced in 90 s. Calculate the mean rate in cm³/s.',2,['0.2']],
      ['Compare the roles of xylem and phloem in a flowering plant.',4,['xylem water','mineral ions','roots to leaves','phloem sugars','translocation','both transport tissues']]
    ],
    b3:[
      ['Explain why a second exposure to the same pathogen often produces a faster immune response.',4,['memory cells','same antigen','rapid antibody production','specific antibodies']],
      ['Give two ways the body prevents pathogens entering before the specific immune response begins.',2,['skin','mucus','cilia','stomach acid']],
      ['A bacterial population becomes resistant to an antibiotic. Explain why continued use of the antibiotic can increase the proportion of resistant bacteria.',4,['variation','resistant bacteria survive','susceptible die','reproduce','resistance increases']]
    ],
    b4:[
      ['A plant is kept at high light intensity but the rate of photosynthesis remains low. Suggest two other limiting factors and explain how each could reduce the rate.',4,['carbon dioxide','temperature','chlorophyll','enzyme activity','limiting']],
      ['Write the word equation for aerobic respiration and explain why respiration rate increases during exercise.',4,['glucose','oxygen','carbon dioxide','water','more energy demand']],
      ['A pond plant produces 84 bubbles in 4 minutes. Calculate the mean bubble rate per minute.',2,['21']]
    ],
    b5:[
      ['Explain how negative feedback restores blood glucose concentration after it rises above the normal level.',5,['pancreas','insulin','cells take up glucose','liver','glycogen','blood glucose falls']],
      ['Compare nervous and hormonal communication in the body.',4,['electrical impulses','neurones','fast','hormones','blood','slower','longer lasting']],
      ['A student has reaction times of 0.24, 0.25, 0.23, 0.61 and 0.24 s. Identify the anomalous result and calculate the mean without it.',2,['0.61','0.24']]
    ],
    b6:[
      ['Two parents are both heterozygous for a recessive disorder: Dd × Dd. State the probability that a child is affected and explain your answer.',3,['25','1/4','dd']],
      ['Explain how meiosis and fertilisation contribute to genetic variation.',4,['meiosis','different gametes','half chromosome number','random fertilisation','different allele combinations']],
      ['Describe how selective breeding differs from natural selection.',4,['humans choose','desired characteristics','controlled breeding','environment selects','survival','reproduction']]
    ],
    b7:[
      ['A mean of 5.5 daisies is counted in each 0.5 m² quadrat. Estimate the number of daisies in a 200 m² field.',2,['2200']],
      ['Explain why biodiversity can make an ecosystem more stable.',3,['more species','food web','alternative resources','less effect of one population change']],
      ['Describe how carbon in dead organisms can return to the atmosphere.',3,['decomposers','respiration','carbon dioxide']]
    ],
    c1:[
      ['An atom has atomic number 17 and mass number 37. State the number of protons, neutrons and electrons in the neutral atom.',3,['17 protons','20 neutrons','17 electrons']],
      ['Explain why Group 1 metals become more reactive down the group.',4,['outer electron','further from nucleus','shielding','weaker attraction','lost more easily']],
      ['Explain why noble gases are very unreactive.',2,['full outer shell','stable electron arrangement']]
    ],
    c2:[
      ['Explain why sodium chloride has a high melting point and conducts electricity when molten but not when solid.',5,['giant ionic lattice','strong electrostatic attraction','energy needed','ions fixed solid','ions mobile molten']],
      ['Compare the structures and electrical conductivity of diamond and graphite.',5,['giant covalent','carbon atoms','diamond four bonds','graphite three bonds','delocalised electrons','conducts']],
      ['Explain why simple molecular substances usually have low boiling points.',3,['weak intermolecular forces','little energy needed','molecules separate']]
    ],
    c3:[
      ['Calculate the amount in moles in 11 g of carbon dioxide, CO₂. Mr = 44.',2,['0.25']],
      ['A solution contains 12 g of solute in 300 cm³. Calculate the concentration in g/dm³.',3,['40']],
      ['Explain why the measured mass of a reaction mixture may decrease when a gas is produced in an open flask even though mass is conserved.',3,['gas escapes','open system','total mass including gas conserved']]
    ],
    c4:[
      ['Explain why aluminium is extracted using electrolysis rather than reduction with carbon.',3,['more reactive than carbon','cannot be displaced by carbon','electrolysis']],
      ['During electrolysis, copper ions move to the cathode. Explain what happens to the copper ions there.',3,['gain electrons','reduction','copper atoms form']],
      ['Explain the difference between a strong acid and a weak acid of the same concentration.',3,['degree of ionisation','strong fully ionises','weak partially ionises']]
    ],
    c5:[
      ['A reaction transfers 9.6 kJ to the surroundings. State whether it is exothermic or endothermic and explain your choice.',2,['exothermic','energy to surroundings']],
      ['Explain what activation energy means and how a catalyst changes it.',3,['minimum energy','successful collision','catalyst lowers','alternative pathway']],
      ['Bond breaking requires 620 kJ and bond making releases 780 kJ. Calculate the overall energy change and classify the reaction.',3,['-160','exothermic']]
    ],
    c6:[
      ['Explain why powdered calcium carbonate reacts faster than the same mass in large lumps.',4,['larger surface area','more exposed particles','more frequent collisions','more successful collisions per second']],
      ['A catalyst is added to a reversible reaction at equilibrium. Explain what happens to the position of equilibrium.',3,['no change position','both forward and reverse faster','equilibrium reached faster']],
      ['Explain why increasing temperature can change both reaction rate and equilibrium position.',4,['particles faster','more successful collisions','rate increases','equilibrium depends on energy change']]
    ],
    c7:[
      ['Explain why long-chain hydrocarbons are cracked.',4,['less useful','high demand smaller molecules','alkenes','fuels','economic']],
      ['Describe how bromine water can distinguish an alkane from an alkene.',3,['alkene decolourises','orange to colourless','alkane no change']],
      ['Explain how addition polymerisation changes many alkene molecules into a polymer.',3,['double bond opens','monomers join','long chain']]
    ],
    c8:[
      ['A dye spot travels 4.2 cm while the solvent front travels 7.0 cm. Calculate the Rf value.',2,['0.6']],
      ['Explain why two substances with the same Rf value measured using different solvents cannot automatically be assumed to be the same substance.',2,['Rf depends on solvent','same conditions required']],
      ['An unknown gas turns damp red litmus paper blue. Identify the gas.',1,['ammonia']]
    ],
    c9:[
      ['Describe two changes that occurred as the early atmosphere developed into the modern atmosphere.',4,['carbon dioxide decreased','oxygen increased','water vapour condensed','nitrogen proportion increased','photosynthesis']],
      ['Explain how increasing atmospheric carbon dioxide can increase average global temperature.',4,['absorbs infrared','Earth emits infrared','re-radiates','less energy escapes']],
      ['State one pollutant released by incomplete combustion and explain one harmful effect.',2,['carbon monoxide','toxic','particulates','respiratory','soot']]
    ],
    c10:[
      ['Explain why recycling aluminium can reduce environmental impacts compared with extracting new aluminium.',4,['less mining','less energy','less waste','lower emissions']],
      ['Describe two stages used to produce potable water from a freshwater source.',2,['filtration','sterilisation','remove solids','kill microbes']],
      ['Explain why a life-cycle assessment may not give one completely objective answer about which product is best.',3,['data uncertainty','different assumptions','weighting impacts','different boundaries']]
    ],
    p1:[
      ['A 1200 kg car travels at 15 m/s. Calculate its kinetic energy.',3,['135000']],
      ['A device receives 500 J of energy and transfers 350 J usefully. Calculate its efficiency as a percentage.',2,['70']],
      ['Explain why adding insulation can reduce the rate of energy transfer from a hot building.',3,['reduces conduction','traps air','lower thermal conductivity','slower transfer']]
    ],
    p2:[
      ['A resistor has a potential difference of 12 V and a current of 0.40 A. Calculate its resistance.',2,['30']],
      ['Explain why current is the same through components connected in series.',2,['single path','charge cannot accumulate']],
      ['Explain why the National Grid uses a very high potential difference for transmission.',4,['same power','lower current','less heating','lower I squared R losses']]
    ],
    p3:[
      ['A block has a mass of 540 g and a volume of 200 cm³. Calculate its density in g/cm³.',2,['2.7']],
      ['Explain what happens to particle energy and arrangement when a solid melts.',4,['energy transferred','internal energy increases','particles vibrate more','overcome forces','move past each other']],
      ['A 2.0 kg sample has a specific latent heat of 150000 J/kg. Calculate the energy required for the change of state.',2,['300000']]
    ],
    p4:[
      ['Explain why alpha radiation is highly ionising but has a short range in air.',3,['large charge','interacts strongly','loses energy quickly']],
      ['A radioactive source has an activity of 800 Bq and a half-life of 6 hours. Calculate the activity after 18 hours.',2,['100']],
      ['Explain the difference between irradiation and radioactive contamination.',3,['irradiation exposure','source outside','contamination radioactive material on or inside']]
    ],
    p5:[
      ['A 900 kg car accelerates at 2.5 m/s². Calculate the resultant force.',2,['2250']],
      ['Explain why a driver travelling faster usually has a greater stopping distance.',4,['greater thinking distance','travels further during reaction time','greater kinetic energy','more braking distance']],
      ['A 0.20 kg ball moves at 8.0 m/s. Calculate its momentum.',2,['1.6']]
    ],
    p6:[
      ['A wave has frequency 25 Hz and wavelength 1.6 m. Calculate its wave speed.',2,['40']],
      ['Explain what happens to a wave when it is refracted at a boundary.',3,['speed changes','direction changes','frequency unchanged']],
      ['Compare infrared and ultraviolet radiation in terms of wavelength, frequency and one use or hazard.',4,['infrared longer wavelength','lower frequency','ultraviolet shorter','higher frequency','use','hazard']]
    ],
    p7:[
      ['Explain how increasing current in a wire placed in a magnetic field affects the force on the wire.',3,['force increases','motor effect','F proportional current']],
      ['A transformer has 1200 turns on the primary coil and 100 turns on the secondary. The primary pd is 240 V. Calculate the secondary pd.',3,['20']],
      ['Explain why electromagnetic induction requires a changing magnetic field through a conductor.',3,['change in magnetic flux','induces potential difference','no change no induced pd']]
    ],
    p8:[
      ['Describe the main stages in the life cycle of a star with a mass much greater than the Sun.',5,['nebula','protostar','main sequence','red supergiant','supernova','neutron star','black hole']],
      ['Explain why a satellite moving in a circular orbit is accelerating even if its speed is constant.',3,['velocity changes direction','acceleration change in velocity','centripetal force']],
      ['Explain how observations of red-shift support the idea that the Universe is expanding.',4,['wavelength increased','galaxies moving away','more distant greater redshift','recession','expanding universe']]
    ]
  };

  const rich = window.GCSE_RICH_CONTENT;
  if(!rich?.guides) return;
  Object.entries(extra).forEach(([topicId,questions])=>{
    const guide=rich.guides[topicId];
    if(!guide) return;
    const existing=new Set((guide.exam||[]).map(q=>q[0]));
    questions.forEach(q=>{if(!existing.has(q[0])) guide.exam.push(q);});
  });
  window.GCSE_EXTRA_QUESTION_BANK=extra;
})();