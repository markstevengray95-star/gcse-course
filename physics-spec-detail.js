(() => {
  const data = window.GCSE_COURSE_DATA;
  if (!data?.topics) return;

  const L = (title, ref, section, scope='combined', tier='all', focus=[], equations=[], practical='') => ({
    title, ref, section, scope, tier, focus, equations, practical
  });

  const physics = {
    p1: {
      spec:'4.1', title:'Energy', paper:1,
      sections:[
        {ref:'4.1.1', title:'Energy changes in a system', lessons:[
          L('Energy stores, systems and transfer pathways','4.1.1.1','Energy stores and systems','combined','all',[
            'Identify the system being considered and the relevant energy stores before and after a change.',
            'Describe transfers caused by heating, mechanical work and electrical work.',
            'Use conservation of energy to track where energy is redistributed.'
          ]),
          L('Kinetic energy calculations','4.1.1.2','Changes in energy','combined','all',[
            'Use mass and speed to calculate the kinetic energy of a moving object.',
            'Recognise the squared relationship between speed and kinetic energy.',
            'Rearrange the equation and keep SI units consistent.'
          ],['Ek = 1/2 mv^2']),
          L('Gravitational potential energy','4.1.1.2','Changes in energy','combined','all',[
            'Link changes in height to changes in gravitational potential energy.',
            'Use gravitational field strength correctly.',
            'Connect GPE changes to kinetic energy in falling or rising systems.'
          ],['Ep = mgh']),
          L('Elastic potential energy and springs','4.1.1.2','Changes in energy','combined','all',[
            'Explain energy storage in stretched or compressed elastic objects.',
            'Use spring constant and extension in calculations.',
            'Distinguish elastic energy from force-extension calculations.'
          ],['Ee = 1/2 ke^2']),
          L('Specific heat capacity and thermal energy','4.1.1.3','Energy changes in systems','combined','all',[
            'Explain how heating changes the thermal energy stored in a system.',
            'Use mass, specific heat capacity and temperature change in calculations.',
            'Interpret temperature-change data and identify major sources of uncertainty.'
          ],['Delta E = mc Delta theta'],'Required practical 1: determine the specific heat capacity of one or more materials.'),
          L('Power: rate of energy transfer','4.1.1.4','Power','combined','all',[
            'Define power as energy transferred or work done per unit time.',
            'Compare devices that transfer the same energy in different times.',
            'Use watts as joules per second.'
          ],['P = E/t','P = W/t'])
        ]},
        {ref:'4.1.2', title:'Conservation and dissipation of energy', lessons:[
          L('Conservation of energy and dissipation','4.1.2.1','Energy transfers in a system','combined','all',[
            'Explain why total energy in a closed system is conserved.',
            'Describe useful and dissipated transfers without saying energy is destroyed.',
            'Trace energy into thermal stores of surroundings.'
          ]),
          L('Reducing unwanted energy transfers','4.1.2.1','Energy transfers in a system','combined','all',[
            'Explain how lubrication reduces frictional heating.',
            'Relate thermal conductivity and thickness to the rate of energy transfer.',
            'Apply insulation ideas to buildings and everyday devices.'
          ]),
          L('Required practical: thermal insulation','4.1.2.1','Energy transfers in a system','triple','all',[
            'Plan a fair comparison of insulating materials or thickness.',
            'Identify independent, dependent and control variables.',
            'Use repeated temperature measurements to compare cooling rates.'
          ],[],'Required practical 2 (Physics only): investigate thermal insulation.'),
          L('Efficiency of energy transfers','4.1.2.2','Efficiency','combined','all',[
            'Calculate efficiency from useful and total energy or power.',
            'Express efficiency as a decimal or percentage.',
            'Explain how engineering changes can increase useful output or reduce dissipation.'
          ],['efficiency = useful output / total input'])
        ]},
        {ref:'4.1.3', title:'National and global energy resources', lessons:[
          L('Renewable and non-renewable energy resources','4.1.3','National and global energy resources','combined','all',[
            'Classify fossil fuels, nuclear fuel and renewable resources.',
            'Compare reliability, environmental effects and typical uses.',
            'Interpret patterns or trends in energy-resource data.',
            'Evaluate choices using environmental, economic and social evidence.'
          ])
        ]}
      ]
    },

    p2: {
      spec:'4.2', title:'Electricity', paper:1,
      sections:[
        {ref:'4.2.1', title:'Current, potential difference and resistance', lessons:[
          L('Circuit symbols and drawing circuits','4.2.1.1','Standard circuit diagram symbols','combined','all',[
            'Recognise and draw standard circuit symbols.',
            'Interpret circuit diagrams and identify complete conducting loops.',
            'Place ammeters in series and voltmeters in parallel.'
          ]),
          L('Charge, current and time','4.2.1.2','Electrical charge and current','combined','all',[
            'Describe current as the rate of flow of charge.',
            'Use coulombs, amperes and seconds consistently.',
            'Explain why a source of potential difference is needed for sustained charge flow.'
          ],['Q = It']),
          L('Potential difference, current and resistance','4.2.1.3','Current, resistance and potential difference','combined','all',[
            'Explain how current depends on both resistance and potential difference.',
            'Use V = IR for calculations and rearrangements.',
            'Distinguish potential difference from current.'
          ],['V = IR']),
          L('Required practical: resistance of wires and resistor combinations','4.2.1.3','Current, resistance and potential difference','combined','all',[
            'Investigate the effect of wire length on resistance at constant temperature.',
            'Construct and compare resistor combinations in series and parallel.',
            'Calculate resistance from measured current and potential difference.'
          ],['V = IR'],'Required practical 3: investigate factors affecting resistance.'),
          L('Ohmic conductors, filament lamps, diodes, thermistors and LDRs','4.2.1.4','Resistors','combined','all',[
            'Distinguish linear and non-linear current-potential difference relationships.',
            'Explain how filament-lamp resistance changes as temperature changes.',
            'Explain the behaviour and applications of diodes, thermistors and LDRs.'
          ]),
          L('Required practical: I-V characteristics','4.2.1.4','Resistors','combined','all',[
            'Measure current and potential difference for different circuit elements.',
            'Plot I-V characteristic graphs accurately.',
            'Use graph shape to identify ohmic and non-ohmic behaviour.'
          ],[],'Required practical 4: investigate I-V characteristics of a resistor, filament lamp and diode.')
        ]},
        {ref:'4.2.2', title:'Series and parallel circuits', lessons:[
          L('Series circuits','4.2.2','Series and parallel circuits','combined','all',[
            'Apply the rule that current is the same at all points in a series circuit.',
            'Share potential difference across series components.',
            'Add resistances in series and solve equivalent-resistance problems.'
          ],['Rtotal = R1 + R2 + ...']),
          L('Parallel and mixed circuits','4.2.2','Series and parallel circuits','combined','all',[
            'Apply the rule that potential difference is the same across parallel branches.',
            'Use conservation of current at junctions.',
            'Explain qualitatively why adding a parallel branch reduces total resistance.'
          ])
        ]},
        {ref:'4.2.3', title:'Domestic uses and safety', lessons:[
          L('Direct and alternating potential difference','4.2.3.1','Direct and alternating potential difference','combined','all',[
            'Compare dc and ac supplies.',
            'Recall that UK mains is approximately 230 V at 50 Hz.',
            'Interpret simple potential-difference against time graphs.'
          ]),
          L('Mains wiring and electrical safety','4.2.3.2','Mains electricity','combined','all',[
            'Identify live, neutral and earth wires and their functions.',
            'Explain why the live wire can remain dangerous when a switch is open.',
            'Explain the purpose of earthing and safe insulation.'
          ])
        ]},
        {ref:'4.2.4', title:'Energy transfers', lessons:[
          L('Electrical power','4.2.4.1','Power','combined','all',[
            'Relate power to potential difference and current.',
            'Use resistance to calculate electrical power.',
            'Compare power ratings of electrical devices.'
          ],['P = VI','P = I^2R']),
          L('Electrical energy transferred by appliances','4.2.4.2','Energy transfers in everyday appliances','combined','all',[
            'Calculate electrical energy transferred from power and time.',
            'Calculate energy transferred when charge moves through a potential difference.',
            'Describe energy-store changes in common domestic appliances.'
          ],['E = Pt','E = QV']),
          L('The National Grid','4.2.4.3','The National Grid','combined','all',[
            'Describe the role of cables and transformers in the National Grid.',
            'Explain why electricity is transmitted at high potential difference.',
            'Link lower current to reduced heating losses in transmission cables.'
          ])
        ]},
        {ref:'4.2.5', title:'Static electricity (Physics only)', lessons:[
          L('Static charge and transfer of electrons','4.2.5.1','Static charge','triple','all',[
            'Explain charging by transfer of electrons between insulating materials.',
            'Predict attraction and repulsion between charged objects.',
            'Explain sparking in terms of charge movement.'
          ]),
          L('Electric fields and electrostatic forces','4.2.5.2','Electric fields','triple','all',[
            'Describe an electric field as a region in which a charged object experiences a force.',
            'Draw field patterns around isolated charged spheres.',
            'Explain why electrostatic force changes with distance.'
          ])
        ]}
      ]
    },

    p3: {
      spec:'4.3', title:'Particle model of matter', paper:1,
      sections:[
        {ref:'4.3.1', title:'Changes of state and the particle model', lessons:[
          L('Density and the particle model','4.3.1.1','Density of materials','combined','all',[
            'Use the particle model to explain density differences between solids, liquids and gases.',
            'Calculate density from mass and volume.',
            'Select appropriate methods for regular, irregular and liquid samples.'
          ],['rho = m/V'],'Required practical 5: determine densities of regular and irregular solids and liquids.'),
          L('Changes of state and conservation of mass','4.3.1.2','Changes of state','combined','all',[
            'Describe melting, freezing, boiling, evaporation, condensation and sublimation using particles.',
            'Explain why mass is conserved during physical changes of state.',
            'Distinguish physical changes from chemical changes.'
          ])
        ]},
        {ref:'4.3.2', title:'Internal energy and energy transfers', lessons:[
          L('Internal energy of a system','4.3.2.1','Internal energy','combined','all',[
            'Describe internal energy as the total kinetic and potential energy of particles.',
            'Explain how heating changes particle energy.',
            'Distinguish temperature rise from change of state.'
          ]),
          L('Specific heat capacity and heating curves','4.3.2.2','Temperature changes and specific heat capacity','combined','all',[
            'Apply the specific heat capacity equation.',
            'Interpret heating and cooling graphs.',
            'Explain why substances warm at different rates for the same energy input.'
          ],['Delta E = mc Delta theta']),
          L('Specific latent heat and state changes','4.3.2.3','Changes of state and specific latent heat','combined','all',[
            'Explain why temperature remains constant during a change of state.',
            'Distinguish latent heat of fusion from latent heat of vaporisation.',
            'Calculate energy required for a change of state.'
          ],['E = mL'])
        ]},
        {ref:'4.3.3', title:'Particle model and pressure', lessons:[
          L('Particle motion, temperature and gas pressure','4.3.3.1','Particle motion in gases','combined','all',[
            'Relate gas temperature to average kinetic energy of particles.',
            'Explain gas pressure as the result of particle collisions with container walls.',
            'Explain qualitatively how pressure changes with temperature at constant volume.'
          ]),
          L('Pressure and volume of a gas','4.3.3.2','Pressure in gases','triple','higher',[
            'Explain compression and expansion using the particle model.',
            'Use the pressure-volume relationship for a fixed mass of gas at constant temperature.',
            'Interpret pressure-volume data.'
          ],['pV = constant']),
          L('Doing work on a gas','4.3.3.3','Increasing the pressure of a gas','triple','higher',[
            'Explain work as energy transfer by a force.',
            'Explain why compressing a gas can increase its internal energy and temperature.',
            'Apply the idea to examples such as a bicycle pump.'
          ])
        ]}
      ]
    },

    p4: {
      spec:'4.4', title:'Atomic structure', paper:1,
      sections:[
        {ref:'4.4.1', title:'Atoms and isotopes', lessons:[
          L('Structure and scale of the atom','4.4.1.1','The structure of an atom','combined','all',[
            'Describe the nucleus, protons, neutrons and electrons.',
            'Compare the scale of the atom and nucleus using standard form.',
            'Explain electron energy levels and electromagnetic absorption or emission.'
          ]),
          L('Atomic number, mass number and isotopes','4.4.1.2','Mass number, atomic number and isotopes','combined','all',[
            'Calculate proton, neutron and electron numbers from atomic notation.',
            'Explain isotopes as atoms of the same element with different neutron numbers.',
            'Describe positive-ion formation by loss of electrons.'
          ]),
          L('Development of the atomic model','4.4.1.3','Development of the model of the atom','combined','all',[
            'Sequence the solid-sphere, plum-pudding, nuclear and Bohr models.',
            'Explain how alpha-scattering evidence led to the nuclear model.',
            'Use this history as an example of models changing when evidence changes.'
          ])
        ]},
        {ref:'4.4.2', title:'Atoms and nuclear radiation', lessons:[
          L('Radioactive decay, activity and count rate','4.4.2.1','Radioactive decay and nuclear radiation','combined','all',[
            'Explain radioactive decay as a random process involving unstable nuclei.',
            'Distinguish activity from count rate and use the becquerel correctly.',
            'Identify alpha, beta, gamma and neutron radiation.'
          ]),
          L('Alpha, beta and gamma: penetration and ionisation','4.4.2.1','Radioactive decay and nuclear radiation','combined','all',[
            'Compare penetration, range in air and ionising ability.',
            'Select a suitable radiation source for a stated use.',
            'Relate hazard to ionisation and exposure.'
          ]),
          L('Nuclear equations','4.4.2.2','Nuclear equations','combined','all',[
            'Write balanced alpha and beta decay equations.',
            'Track changes to mass number and atomic number.',
            'Explain why gamma emission changes neither mass nor charge.'
          ]),
          L('Half-life and random radioactive decay','4.4.2.3','Half-lives and random radioactive decay','combined','all',[
            'Define half-life using activity, count rate or undecayed nuclei.',
            'Use repeated halving and decay graphs.',
            'Explain why single decays are unpredictable but large samples show predictable trends.'
          ]),
          L('Irradiation, contamination and radiation risk','4.4.2.4','Radioactive contamination','combined','all',[
            'Distinguish irradiation from contamination.',
            'Compare hazards and appropriate safety precautions.',
            'Explain why internal contamination can be especially hazardous for strongly ionising sources.'
          ])
        ]},
        {ref:'4.4.3', title:'Hazards, uses and background radiation (Physics only)', lessons:[
          L('Background radiation and radiation dose','4.4.3.1','Background radiation','triple','all',[
            'Identify natural and human-made sources of background radiation.',
            'Explain why background dose varies with location and occupation.',
            'Interpret radiation-dose data.'
          ]),
          L('Half-life, activity and long-term hazard','4.4.3.2','Different half-lives of radioactive isotopes','triple','all',[
            'Explain how half-life influences activity over time.',
            'Compare hazards of short- and long-half-life isotopes in context.',
            'Use standard-form data where appropriate.'
          ]),
          L('Medical uses of nuclear radiation','4.4.3.3','Uses of nuclear radiation','triple','all',[
            'Explain uses of radioactive tracers and radiation treatment.',
            'Choose radiation properties appropriate to a medical purpose.',
            'Evaluate benefits and risks using evidence.'
          ])
        ]},
        {ref:'4.4.4', title:'Nuclear fission and fusion (Physics only)', lessons:[
          L('Nuclear fission and chain reactions','4.4.4.1','Nuclear fission','triple','all',[
            'Describe neutron absorption and splitting of a heavy unstable nucleus.',
            'Explain emission of neutrons and energy during fission.',
            'Explain how a chain reaction can be sustained and controlled.'
          ]),
          L('Nuclear fusion','4.4.4.2','Nuclear fusion','triple','all',[
            'Describe fusion as joining light nuclei to form a heavier nucleus.',
            'Explain that fusion can release energy because some mass is converted to radiation energy.',
            'Relate fusion to energy production in stars.'
          ])
        ]}
      ]
    },

    p5: {
      spec:'4.5', title:'Forces', paper:2,
      sections:[
        {ref:'4.5.1', title:'Forces and their interactions', lessons:[
          L('Scalar and vector quantities','4.5.1.1','Scalar and vector quantities','combined','all',[
            'Distinguish quantities with magnitude only from those with magnitude and direction.',
            'Represent vectors using arrows.',
            'Classify common physical quantities correctly.'
          ]),
          L('Contact and non-contact forces','4.5.1.2','Contact and non-contact forces','combined','all',[
            'Identify friction, drag, tension and normal contact forces.',
            'Identify gravitational, electrostatic and magnetic forces as non-contact forces.',
            'Describe force pairs arising from interactions.'
          ]),
          L('Gravity, mass and weight','4.5.1.3','Gravity','combined','all',[
            'Distinguish mass from weight.',
            'Use gravitational field strength and W = mg.',
            'Explain centre of mass and proportionality between mass and weight.'
          ],['W = mg']),
          L('Resultant forces and free-body diagrams','4.5.1.4','Resultant forces','combined','all',[
            'Calculate resultant force for collinear forces.',
            'Use free-body diagrams to represent forces on an object.',
            'Higher extension: resolve forces and use scale vector diagrams.'
          ])
        ]},
        {ref:'4.5.2', title:'Work done and energy transfer', lessons:[
          L('Work done by forces','4.5.2','Work done and energy transfer','combined','all',[
            'Explain work done as energy transferred by a force through a distance.',
            'Use joules and newton-metres correctly.',
            'Relate frictional work to thermal energy changes.'
          ],['W = Fs'])
        ]},
        {ref:'4.5.3', title:'Forces and elasticity', lessons:[
          L('Elastic and inelastic deformation','4.5.3','Forces and elasticity','combined','all',[
            'Distinguish elastic from inelastic deformation.',
            'Explain stretching, compression and bending using forces.',
            'Recognise the limit of proportionality.'
          ]),
          L('Hooke\'s law and spring constant','4.5.3','Forces and elasticity','combined','all',[
            'Use force-extension data to identify proportional behaviour.',
            'Calculate spring constant.',
            'Link spring extension to elastic potential energy.'
          ],['F = ke','Ee = 1/2 ke^2']),
          L('Required practical: force and extension','4.5.3','Forces and elasticity','combined','all',[
            'Measure force and extension systematically.',
            'Plot force-extension graphs and identify the linear region.',
            'Use gradient to determine spring constant where appropriate.'
          ],['F = ke'],'Required practical 6: investigate force and extension for a spring.')
        ]},
        {ref:'4.5.4', title:'Moments, levers and gears (Physics only)', lessons:[
          L('Moments and balanced turning effects','4.5.4','Moments, levers and gears','triple','all',[
            'Calculate a moment from force and perpendicular distance.',
            'Apply clockwise and anticlockwise balance.',
            'Explain how levers and gears transmit turning effects.'
          ],['M = Fd'])
        ]},
        {ref:'4.5.5', title:'Pressure in fluids (Physics only)', lessons:[
          L('Pressure on surfaces and in fluids','4.5.5.1.1','Pressure in a fluid 1','triple','all',[
            'Calculate pressure from normal force and area.',
            'Explain why fluid pressure acts normal to surfaces.',
            'Use pascals correctly.'
          ],['p = F/A']),
          L('Liquid pressure with depth and upthrust','4.5.5.1.2','Pressure in a fluid 2','triple','higher',[
            'Use p = h rho g for liquid pressure.',
            'Explain why pressure increases with depth and liquid density.',
            'Explain upthrust, floating and sinking using pressure differences.'
          ],['p = h rho g']),
          L('Atmospheric pressure','4.5.5.2','Atmospheric pressure','triple','all',[
            'Explain atmospheric pressure using particle collisions.',
            'Explain why atmospheric pressure decreases with altitude.',
            'Use a simple atmospheric model to reason about pressure.'
          ])
        ]},
        {ref:'4.5.6', title:'Forces and motion', lessons:[
          L('Distance and displacement','4.5.6.1.1','Distance and displacement','combined','all',[
            'Distinguish scalar distance from vector displacement.',
            'State displacement using magnitude and direction.',
            'Convert distance units accurately.'
          ]),
          L('Speed and average speed','4.5.6.1.2','Speed','combined','all',[
            'Calculate speed from distance and time.',
            'Use typical speeds as estimation checks.',
            'Calculate average speed for non-uniform motion.'
          ],['s = vt']),
          L('Velocity and changing direction','4.5.6.1.3','Velocity','combined','all',[
            'Distinguish speed from velocity.',
            'Use direction when describing velocity.',
            'Higher extension: explain constant speed but changing velocity in circular motion.'
          ]),
          L('Distance-time graphs','4.5.6.1.4','The distance-time relationship','combined','all',[
            'Interpret stationary and moving sections of distance-time graphs.',
            'Calculate speed from gradient.',
            'Higher extension: use a tangent to find instantaneous speed.'
          ]),
          L('Acceleration and velocity-time graphs','4.5.6.1.5','Acceleration','combined','all',[
            'Calculate acceleration from change in velocity and time.',
            'Find acceleration from velocity-time graph gradient.',
            'Higher extension: find displacement from area under a velocity-time graph.'
          ],['a = Delta v/t']),
          L('Newton\'s First Law','4.5.6.2.1','Newton\'s First Law','combined','all',[
            'Relate zero resultant force to constant velocity or remaining at rest.',
            'Explain changes in motion when resultant force is non-zero.',
            'Apply the law to everyday motion.'
          ]),
          L('Newton\'s Second Law and inertial mass','4.5.6.2.2','Newton\'s Second Law','combined','all',[
            'Use resultant force, mass and acceleration quantitatively.',
            'Estimate forces and accelerations in transport contexts.',
            'Higher extension: explain inertial mass as force divided by acceleration.'
          ],['F = ma']),
          L('Required practical: force, mass and acceleration','4.5.6.2.2','Newton\'s Second Law','combined','all',[
            'Vary force while controlling mass and measure acceleration.',
            'Vary mass while controlling force and measure acceleration.',
            'Use graphs and proportional reasoning to test F = ma.'
          ],['F = ma'],'Required practical 7: investigate force, mass and acceleration.'),
          L('Newton\'s Third Law','4.5.6.2.3','Newton\'s Third Law','combined','all',[
            'Identify equal and opposite forces acting on different objects.',
            'Avoid confusing interaction pairs with balanced forces on one object.',
            'Apply the law to equilibrium and motion examples.'
          ]),
          L('Stopping distance, thinking distance and braking distance','4.5.6.3.1','Stopping distance','combined','all',[
            'Describe stopping distance as thinking distance plus braking distance.',
            'Explain why both parts increase with speed.',
            'Interpret stopping-distance data.'
          ]),
          L('Reaction time and thinking distance','4.5.6.3.2','Reaction time','combined','all',[
            'Recall typical human reaction-time ranges.',
            'Explain effects of tiredness, distraction and other factors on reaction time.',
            'Evaluate simple reaction-time investigations.'
          ]),
          L('Factors affecting braking distance','4.5.6.3.3','Factors affecting braking distance 1','combined','all',[
            'Explain effects of road, weather, tyres and brakes.',
            'Connect speed to required stopping distance.',
            'Use evidence to make safety conclusions.'
          ]),
          L('Braking forces, kinetic energy and deceleration','4.5.6.3.4','Factors affecting braking distance 2','combined','all',[
            'Explain how braking transfers kinetic energy to thermal stores.',
            'Relate higher speed to more kinetic energy and larger braking demands.',
            'Explain consequences of very large braking forces and decelerations.'
          ])
        ]},
        {ref:'4.5.7', title:'Momentum (Higher Tier)', lessons:[
          L('Momentum of moving objects','4.5.7.1','Momentum is a property of moving objects','combined','higher',[
            'Calculate momentum from mass and velocity.',
            'Use direction and sign consistently.',
            'Use kg m/s as the momentum unit.'
          ],['p = mv']),
          L('Conservation of momentum','4.5.7.2','Conservation of momentum','combined','higher',[
            'Apply total momentum before = total momentum after in a closed system.',
            'Solve collision and separation problems.',
            'Explain assumptions behind conservation calculations.'
          ]),
          L('Force and change of momentum','4.5.7.3','Changes in momentum','triple','higher',[
            'Relate force to rate of change of momentum.',
            'Explain how increasing collision time reduces force for the same momentum change.',
            'Apply the model to transport-safety contexts.'
          ],['F = Delta p/Delta t'])
        ]}
      ]
    },

    p6: {
      spec:'4.6', title:'Waves', paper:2,
      sections:[
        {ref:'4.6.1', title:'Waves in air, fluids and solids', lessons:[
          L('Transverse and longitudinal waves','4.6.1.1','Transverse and longitudinal waves','combined','all',[
            'Distinguish transverse and longitudinal wave motion.',
            'Use compression and rarefaction correctly for longitudinal waves.',
            'Explain that energy travels while the medium oscillates about fixed positions.'
          ]),
          L('Wave properties: amplitude, wavelength, frequency and period','4.6.1.2','Properties of waves','combined','all',[
            'Identify amplitude and wavelength from diagrams.',
            'Relate frequency and period.',
            'Describe wave speed as the speed of energy transfer through a medium.'
          ],['T = 1/f','v = f lambda']),
          L('Measuring wave speed and using the wave equation','4.6.1.2','Properties of waves','combined','all',[
            'Measure speed of sound or water waves using distance and time.',
            'Use frequency and wavelength to calculate wave speed.',
            'Convert units before substitution.'
          ],['v = f lambda']),
          L('Required practical: wave speed, frequency and wavelength','4.6.1.2','Properties of waves','combined','all',[
            'Use a ripple tank and/or solid-wave apparatus to make measurements.',
            'Select suitable apparatus and reduce measurement uncertainty.',
            'Use measured frequency and wavelength to calculate wave speed.'
          ],['v = f lambda'],'Required practical 8: measure frequency, wavelength and wave speed.'),
          L('Reflection, transmission and absorption of waves','4.6.1.3','Reflection of waves','triple','all',[
            'Use ray diagrams to represent reflection.',
            'Describe reflection, transmission and absorption at boundaries.',
            'Apply the law of reflection qualitatively.'
          ]),
          L('Required practical: reflection and refraction of light','4.6.1.3','Reflection of waves','triple','all',[
            'Investigate reflection from surfaces and refraction through different substances.',
            'Measure angles carefully from the normal.',
            'Use repeat readings and ray diagrams to improve reliability.'
          ],[],'Required practical 9 (Physics only): reflection and refraction of light.'),
          L('Sound waves, the ear and hearing range','4.6.1.4','Sound waves','triple','higher',[
            'Explain how sound causes vibrations in solids and in the ear.',
            'Explain conversion between sound waves and mechanical vibrations.',
            'Recall the approximate human hearing range of 20 Hz to 20 kHz.'
          ]),
          L('Ultrasound, seismic waves and echo sounding','4.6.1.5','Waves for detection and exploration','triple','higher',[
            'Explain partial reflection of ultrasound at boundaries.',
            'Compare P-waves and S-waves and use them as evidence for Earth structure.',
            'Explain echo sounding and hidden-structure detection.'
          ])
        ]},
        {ref:'4.6.2', title:'Electromagnetic waves', lessons:[
          L('The electromagnetic spectrum','4.6.2.1','Types of electromagnetic waves','combined','all',[
            'Order radio to gamma by wavelength and frequency.',
            'Explain that all electromagnetic waves are transverse.',
            'State that all travel at the same speed in a vacuum.'
          ]),
          L('Reflection, refraction, absorption and transmission of EM waves','4.6.2.2','Properties of electromagnetic waves 1','combined','higher',[
            'Explain that interaction with materials depends on wavelength.',
            'Draw refraction ray diagrams.',
            'Use change of wave speed to explain refraction qualitatively.'
          ]),
          L('Required practical: infrared emission and absorption','4.6.2.2','Properties of electromagnetic waves 1','combined','all',[
            'Compare infrared emission or absorption for different surfaces.',
            'Control temperature, surface area and distance where relevant.',
            'Interpret temperature or detector data.'
          ],[],'Required practical 10: investigate infrared absorption or radiation from different surfaces.'),
          L('Generation, absorption and hazards of EM radiation','4.6.2.3','Properties of electromagnetic waves 2','combined','all',[
            'Explain how changes in atoms and nuclei can generate or absorb electromagnetic waves.',
            'Higher extension: explain radio-wave production and induced oscillations in circuits.',
            'Compare health risks from ultraviolet, X-rays and gamma rays using evidence.'
          ]),
          L('Uses of electromagnetic waves','4.6.2.4','Uses and applications of electromagnetic waves','combined','all',[
            'Match regions of the spectrum to communication, heating, imaging and medical uses.',
            'Higher extension: explain why wavelength/frequency properties make each region suitable.',
            'Balance benefit and risk in applications.'
          ]),
          L('Lenses and image formation','4.6.2.5','Lenses','triple','all',[
            'Distinguish convex and concave lenses.',
            'Construct ray diagrams and identify real or virtual images.',
            'Calculate magnification and use focal length language accurately.'
          ],['magnification = image height/object height']),
          L('Visible light, colour, filters and surfaces','4.6.2.6','Visible light','triple','all',[
            'Explain colour by selective reflection, absorption and transmission.',
            'Distinguish specular and diffuse reflection.',
            'Predict the appearance of objects through colour filters.'
          ])
        ]},
        {ref:'4.6.3', title:'Black body radiation (Physics only)', lessons:[
          L('Emission and absorption of infrared radiation','4.6.3.1','Emission and absorption of infrared radiation','triple','all',[
            'Explain that all objects emit and absorb infrared radiation.',
            'Relate emission rate to temperature.',
            'Describe a perfect black body as an ideal absorber and emitter.'
          ]),
          L('Radiation balance and Earth temperature','4.6.3.2','Perfect black bodies and radiation','triple','higher',[
            'Explain equilibrium when absorption and emission rates are equal.',
            'Explain temperature change when the balance changes.',
            'Apply the model to Earth surface and atmosphere energy balance.'
          ])
        ]}
      ]
    },

    p7: {
      spec:'4.7', title:'Magnetism and electromagnetism', paper:2,
      sections:[
        {ref:'4.7.1', title:'Permanent and induced magnetism, magnetic forces and fields', lessons:[
          L('Permanent magnets, induced magnets and poles','4.7.1.1','Poles of a magnet','combined','all',[
            'Describe attraction and repulsion between magnetic poles.',
            'Distinguish permanent and induced magnets.',
            'Explain induced magnetism as an attractive effect that usually disappears when the field is removed.'
          ]),
          L('Magnetic fields and field-line patterns','4.7.1.2','Magnetic fields','combined','all',[
            'Define a magnetic field as a region where magnetic force acts.',
            'Draw field direction from north to south outside a magnet.',
            'Use a compass to map field direction and relate compass behaviour to Earth\'s field.'
          ])
        ]},
        {ref:'4.7.2', title:'The motor effect', lessons:[
          L('Magnetic fields around currents and solenoids','4.7.2.1','Electromagnetism','combined','all',[
            'Describe the circular magnetic field around a current-carrying wire.',
            'Explain how increasing current changes field strength.',
            'Explain how a solenoid and iron core make a strong electromagnet.'
          ]),
          L('The motor effect and Fleming\'s left-hand rule','4.7.2.2','Fleming\'s left-hand rule','combined','higher',[
            'Explain force on a current-carrying conductor in a magnetic field.',
            'Use Fleming\'s left-hand rule for field-current-force direction.',
            'Identify factors affecting force magnitude.'
          ]),
          L('Motor-effect force calculations','4.7.2.2','Fleming\'s left-hand rule','combined','higher',[
            'Use magnetic flux density, current and conductor length.',
            'Apply the equation only when conductor and field are perpendicular.',
            'Rearrange and use tesla correctly.'
          ],['F = BIl']),
          L('Electric motors','4.7.2.3','Electric motors','combined','higher',[
            'Explain why opposite forces on a current-carrying coil create rotation.',
            'Relate coil orientation, magnetic field and current to torque.',
            'Apply the motor-effect model to simple motors.'
          ]),
          L('Loudspeakers and headphones','4.7.2.4','Loudspeakers','triple','higher',[
            'Explain how a varying current produces a varying force on a coil.',
            'Link coil motion to pressure variations in air.',
            'Connect electrical input to sound output.'
          ])
        ]},
        {ref:'4.7.3', title:'Induced potential, transformers and the National Grid (Physics only, HT)', lessons:[
          L('Generator effect and induced potential','4.7.3.1','Induced potential','triple','higher',[
            'Explain induction from relative motion or a changing magnetic field.',
            'Identify factors affecting magnitude and direction of induced potential difference.',
            'Explain the opposing magnetic effect qualitatively.'
          ]),
          L('Alternators and dynamos','4.7.3.2','Uses of the generator effect','triple','higher',[
            'Explain how alternators produce ac and dynamos produce dc.',
            'Interpret generated potential-difference against time graphs.',
            'Relate changing flux to changing output.'
          ]),
          L('Microphones and the generator effect','4.7.3.3','Microphones','triple','higher',[
            'Explain how sound-pressure variations move a coil.',
            'Explain how coil motion in a magnetic field induces a changing electrical signal.',
            'Compare microphone and loudspeaker energy pathways.'
          ]),
          L('Transformers and turns ratio','4.7.3.4','Transformers','triple','higher',[
            'Explain why transformers require alternating current.',
            'Relate primary/secondary potential differences to turns ratio.',
            'Distinguish step-up and step-down transformers.'
          ],['Vp/Vs = Np/Ns']),
          L('Transformer power and efficient transmission','4.7.3.4','Transformers','triple','higher',[
            'Use input-output power relationships for ideal transformers.',
            'Calculate current from power and potential difference.',
            'Explain why high-potential-difference transmission reduces energy losses.'
          ],['VpIp = VsIs'])
        ]}
      ]
    },

    p8: {
      spec:'4.8', title:'Space physics (Physics only)', paper:2,
      sections:[
        {ref:'4.8.1', title:'Solar system, orbital motions and satellites', lessons:[
          L('The Solar System, galaxies and star formation','4.8.1.1','Our solar system','triple','all',[
            'Describe the Sun, planets, dwarf planets and natural satellites.',
            'Place the Solar System within the Milky Way.',
            'Explain star formation from a nebula using gravity and the start of fusion.'
          ]),
          L('Life cycle of Sun-like stars','4.8.1.2','The life cycle of a star','triple','all',[
            'Sequence nebula, protostar, main sequence, red giant and white dwarf stages.',
            'Explain the role of fusion and gravitational balance.',
            'Relate stellar mass to the path through the life cycle.'
          ]),
          L('Massive stars, supernovae and element formation','4.8.1.2','The life cycle of a star','triple','all',[
            'Sequence red supergiant, supernova and neutron-star/black-hole outcomes.',
            'Explain that stellar fusion produces elements up to iron.',
            'Explain that supernovae form and distribute heavier elements.'
          ]),
          L('Orbital motion and satellites','4.8.1.3','Orbital motion, natural and artificial satellites','triple','all',[
            'Explain gravity as the force maintaining circular orbits.',
            'Compare planets, natural satellites and artificial satellites.',
            'Higher extension: explain changing velocity at constant speed and the link between orbital radius and speed.'
          ])
        ]},
        {ref:'4.8.2', title:'Red-shift and the expanding Universe', lessons:[
          L('Red-shift and galaxy recession','4.8.2','Red-shift','triple','all',[
            'Describe increased observed wavelength from receding galaxies.',
            'Relate larger red-shift to greater recession speed for distant galaxies.',
            'Use observations as evidence for an expanding Universe.'
          ]),
          L('Big Bang evidence, dark matter and dark energy','4.8.2','Red-shift','triple','all',[
            'Explain how red-shift supports the Big Bang model.',
            'Describe the Big Bang as an early hot, dense state followed by expansion.',
            'Recognise that dark matter and dark energy remain areas of active scientific investigation.'
          ])
        ]}
      ]
    }
  };

  const lessonLookup = {};
  Object.entries(physics).forEach(([topicId, spec]) => {
    const topic = data.topics.find(t => t.id === topicId);
    if (!topic) return;
    const flattened = [];
    spec.sections.forEach(section => {
      section.lessons.forEach(lesson => {
        lessonLookup[`${topicId}::${lesson.title}`] = lesson;
        flattened.push([lesson.title, lesson.scope]);
      });
    });
    topic.lessons = flattened;
    topic.specRef = spec.spec;
    topic.specSections = spec.sections.map(s => ({ref:s.ref,title:s.title}));
    topic.summary = `AQA GCSE Physics ${spec.spec}: ${spec.sections.map(s=>s.title).join('; ')}.`;
  });

  window.GCSE_PHYSICS_SPEC_DETAIL = {
    specification:'AQA GCSE Physics 8463',
    paper1:['p1','p2','p3','p4'],
    paper2:['p5','p6','p7','p8'],
    topics:physics,
    lessonLookup,
    getLesson(topicId, title){ return lessonLookup[`${topicId}::${title}`] || null; }
  };
})();