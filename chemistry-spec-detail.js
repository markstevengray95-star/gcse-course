(() => {
  const data=window.GCSE_COURSE_DATA;
  if(!data?.topics) return;
  const L=(title,ref,section,scope='combined',tier='all',focus=[],equations=[],practical='')=>({title,ref,section,scope,tier,focus,equations,practical});

  const chemistry={
    c1:{spec:'4.1',title:'Atomic structure and the periodic table',paper:1,sections:[
      {ref:'4.1.1',title:'A simple model of the atom, symbols, relative atomic mass, electronic charge and isotopes',lessons:[
        L('Atoms, elements and compounds','4.1.1.1','Atoms, elements and compounds','combined','all',['Distinguish atoms, elements and compounds.','Use symbols, formulae, word equations and balanced symbol equations.','Relate compounds to fixed combinations of elements.']),
        L('Writing formulae and balancing equations','4.1.1.1','Atoms, elements and compounds','combined','all',['Translate between names, formulae and symbol equations.','Balance equations by conserving every type of atom.','Higher Tier: recognise where ionic or half equations are appropriate.']),
        L('Mixtures and physical separation','4.1.1.2','Mixtures','combined','all',['Distinguish mixtures from compounds.','Select filtration, crystallisation, simple distillation, fractional distillation or chromatography.','Explain why separation of mixtures is physical rather than chemical.']),
        L('Development of the atomic model','4.1.1.3','The development of the model of the atom','combined','all',['Sequence the solid-sphere, plum-pudding, nuclear and Bohr models.','Link alpha-scattering evidence to the nuclear model.','Explain how evidence causes scientific models to change.']),
        L('Subatomic particles and relative charge','4.1.1.4','Relative electrical charges of subatomic particles','combined','all',['Recall relative charges of protons, neutrons and electrons.','Use proton number to identify an element.','Explain why atoms are electrically neutral.']),
        L('Atomic size, nuclear size and mass','4.1.1.5','Size and mass of atoms','combined','all',['Compare the scale of an atom and nucleus using standard form.','Recall relative masses of subatomic particles.','Calculate proton, neutron and electron numbers from atomic notation.']),
        L('Isotopes','4.1.1.5','Size and mass of atoms','combined','all',['Define isotopes using proton and neutron numbers.','Interpret isotope notation.','Explain why isotopes of an element have very similar chemistry.']),
        L('Relative atomic mass from isotope abundance','4.1.1.6','Relative atomic mass','combined','all',['Explain relative atomic mass as a weighted mean.','Calculate Ar from isotope masses and abundances.','Interpret abundance data and check whether an answer is plausible.']),
        L('Electronic structure of the first 20 elements','4.1.1.7','Electronic structure','combined','all',['Represent electronic structures using numbers or shell diagrams.','Fill lower energy levels first.','Link outer-shell electrons to chemical behaviour.'])
      ]},
      {ref:'4.1.2',title:'The periodic table',lessons:[
        L('Modern periodic table and electronic structure','4.1.2.1','The periodic table','combined','all',['Explain arrangement by atomic number.','Relate group number to outer-shell electrons.','Use periodic position to predict chemical behaviour.']),
        L('Development of the periodic table and Mendeleev','4.1.2.2','Development of the periodic table','combined','all',['Describe limitations of early atomic-mass ordering.','Explain why Mendeleev left gaps and changed some orders.','Use later discoveries as evidence supporting his predictions.']),
        L('Metals and non-metals in the periodic table','4.1.2.3','Metals and non-metals','combined','all',['Locate metals and non-metals.','Relate ion formation to metallic/non-metallic behaviour.','Connect position, electron arrangement and reactivity.']),
        L('Group 0 noble gases','4.1.2.4','Group 0','combined','all',['Explain low reactivity from stable outer electron shells.','Describe boiling-point trend down the group.','Predict properties of unfamiliar Group 0 elements from trends.']),
        L('Group 1 alkali metals: reactions','4.1.2.5','Group 1','combined','all',['Describe reactions of lithium, sodium and potassium with oxygen, chlorine and water.','Write or interpret equations for Group 1 reactions.','Identify common patterns in products.']),
        L('Group 1 reactivity trend','4.1.2.5','Group 1','combined','all',['Explain increasing reactivity down Group 1 using outer-electron ideas.','Predict reactions of an unfamiliar Group 1 element.','Connect electron loss to positive ion formation.']),
        L('Group 7 halogens: properties and compounds','4.1.2.6','Group 7','combined','all',['Describe halogens as diatomic non-metals.','Describe compounds formed with metals and non-metals.','Explain melting/boiling trends using molecular size.']),
        L('Group 7 displacement reactions','4.1.2.6','Group 7','combined','all',['Describe decreasing reactivity down Group 7.','Predict displacement reactions.','Explain the trend using attraction for an incoming electron.'])
      ]},
      {ref:'4.1.3',title:'Properties of transition metals (Chemistry only)',lessons:[
        L('Transition metals compared with Group 1','4.1.3.1','Comparison with Group 1 elements','triple','all',['Compare transition-metal melting points, densities, strength and reactivity with Group 1.','Use chromium, manganese, iron, cobalt, nickel and copper as examples.','Interpret unfamiliar property data.']),
        L('Transition-metal ions, coloured compounds and catalysts','4.1.3.2','Typical properties','triple','all',['Recall that transition metals can form ions with different charges.','Recognise coloured compounds as a typical feature.','Explain their use as catalysts in suitable contexts.'])
      ]}
    ]},

    c2:{spec:'4.2',title:'Bonding, structure, and the properties of matter',paper:1,sections:[
      {ref:'4.2.1',title:'Chemical bonds, ionic, covalent and metallic',lessons:[
        L('Comparing ionic, covalent and metallic bonding','4.2.1.1','Chemical bonds','combined','all',['Identify the particles involved in each strong-bond type.','Explain bonding using electrostatic attraction and electron transfer/sharing.','Choose a likely bond type from element types.']),
        L('Formation of ions and ionic bonding','4.2.1.2','Ionic bonding','combined','all',['Explain electron transfer between metals and non-metals.','Predict common ion charges from group number.','Connect ion formation to noble-gas electronic structures.']),
        L('Dot-and-cross diagrams for ionic compounds','4.2.1.2','Ionic bonding','combined','all',['Draw electron-transfer diagrams for Groups 1/2 with Groups 6/7.','Show ion charges and complete outer shells.','Distinguish transferred electrons from shared electrons.']),
        L('Giant ionic lattices and empirical formulae','4.2.1.3','Ionic compounds','combined','all',['Describe a giant lattice of oppositely charged ions.','Explain electrostatic attraction in all directions.','Deduce empirical formulae from ion ratios or lattice diagrams.']),
        L('Covalent bonding and shared electron pairs','4.2.1.4','Covalent bonding','combined','all',['Explain covalent bonds as shared pairs of electrons.','Draw specified dot-and-cross diagrams.','Recognise small molecules, polymers and giant covalent structures.']),
        L('Representing molecules and giant covalent structures','4.2.1.4','Covalent bonding','combined','all',['Use displayed/line and dot-and-cross representations.','Deduce molecular formulae from models.','Discuss limitations of 2D and 3D bonding models.']),
        L('Metallic bonding and delocalised electrons','4.2.1.5','Metallic bonding','combined','all',['Describe a giant regular structure of metal atoms/ions.','Explain delocalised outer electrons.','Relate electrostatic attraction to strong metallic bonding.'])
      ]},
      {ref:'4.2.2',title:'How bonding and structure are related to properties',lessons:[
        L('Particle model and the three states of matter','4.2.2.1','The three states of matter','combined','all',['Describe particle arrangement and motion in solids, liquids and gases.','Explain state changes using energy and forces between particles.','Higher Tier: evaluate limitations of the simple sphere model.']),
        L('State symbols in chemical equations','4.2.2.2','State symbols','combined','all',['Use (s), (l), (g) and (aq) correctly.','Add state symbols to equations from contextual information.','Distinguish dissolved aqueous species from liquids.']),
        L('Properties of ionic compounds','4.2.2.3','Properties of ionic compounds','combined','all',['Explain high melting and boiling points.','Explain conductivity when molten or aqueous.','Connect properties to mobile ions and strong lattice attractions.']),
        L('Properties of small molecular substances','4.2.2.4','Properties of small molecules','combined','all',['Distinguish strong covalent bonds from weak intermolecular forces.','Explain low melting/boiling points.','Explain lack of electrical conductivity.']),
        L('Molecular size and intermolecular forces','4.2.2.4','Properties of small molecules','combined','all',['Relate increasing molecular size to stronger intermolecular forces.','Use trends in boiling point to reason about molecular substances.','Avoid confusing intermolecular forces with covalent bonds.']),
        L('Polymers: structure and properties','4.2.2.5','Polymers','combined','all',['Describe polymers as very large covalent molecules.','Relate strong intermolecular forces/entanglement to solid state.','Interpret repeating-unit diagrams.']),
        L('Giant covalent structures','4.2.2.6','Giant covalent structures','combined','all',['Explain very high melting points from many strong covalent bonds.','Recognise diamond, graphite and silicon dioxide as giant covalent examples.','Connect structure to bulk properties.']),
        L('Properties of metals and alloys','4.2.2.7','Properties of metals and alloys','combined','all',['Explain malleability from layers of atoms.','Explain why alloys are harder than pure metals.','Relate structure to useful mechanical properties.']),
        L('Metals as electrical and thermal conductors','4.2.2.8','Metals as conductors','combined','all',['Explain electrical conduction by mobile delocalised electrons.','Explain thermal transfer through metal structures.','Compare metal conduction with ionic conduction.'])
      ]},
      {ref:'4.2.3',title:'Structure and bonding of carbon',lessons:[
        L('Diamond structure and properties','4.2.3.1','Diamond','combined','all',['Describe four covalent bonds per carbon.','Explain hardness and high melting point.','Explain lack of conductivity from absence of mobile charge carriers.']),
        L('Graphite structure and properties','4.2.3.2','Graphite','combined','all',['Describe layered hexagonal structure.','Explain softness/slipperiness from weak forces between layers.','Explain conductivity from one delocalised electron per carbon.']),
        L('Graphene','4.2.3.3','Graphene and fullerenes','combined','all',['Describe graphene as one layer of graphite.','Relate strength and conductivity to bonding.','Connect properties to electronics and composites.']),
        L('Fullerenes and carbon nanotubes','4.2.3.3','Graphene and fullerenes','combined','all',['Recognise hollow carbon structures.','Describe nanotube geometry and useful properties.','Link structure to nanotechnology applications.'])
      ]},
      {ref:'4.2.4',title:'Bulk and surface properties including nanoparticles (Chemistry only)',lessons:[
        L('Nanoparticles and surface-area-to-volume ratio','4.2.4.1','Sizes of particles and their properties','triple','all',['Compare nanoparticle size with atoms and bulk materials.','Explain why nanoparticles have a very high surface-area-to-volume ratio.','Relate size to properties differing from bulk substances.']),
        L('Uses, benefits and risks of nanoparticles','4.2.4.2','Uses of nanoparticles','triple','all',['Describe uses in medicine, electronics, cosmetics and catalysts.','Evaluate benefits and possible risks.','Recognise limits in current evidence about long-term effects.'])
      ]}
    ]},

    c3:{spec:'4.3',title:'Quantitative chemistry',paper:1,sections:[
      {ref:'4.3.1',title:'Chemical measurements, conservation of mass and quantitative equations',lessons:[
        L('Conservation of mass and balanced equations','4.3.1.1','Conservation of mass and balanced chemical equations','combined','all',['Explain conservation of atoms in reactions.','Balance symbol equations using coefficients.','Distinguish coefficients from formula subscripts.']),
        L('Relative formula mass and percentage by mass','4.3.1.2','Relative formula mass','combined','all',['Calculate Mr from Ar values.','Use balanced equations to compare formula masses.','Calculate percentage by mass of an element in a compound.']),
        L('Mass changes involving gases','4.3.1.3','Mass changes when a reactant or product is a gas','combined','all',['Explain apparent mass changes in open systems.','Use equations to identify escaped or gained gases.','Apply particle conservation to observations.']),
        L('Measurement uncertainty and range','4.3.1.4','Chemical measurements','combined','all',['Recognise that all measurements have uncertainty.','Use range about a mean as a simple uncertainty measure.','Distinguish random spread from systematic error.'])
      ]},
      {ref:'4.3.2',title:'Amount of substance and masses of pure substances',lessons:[
        L('The mole and Avogadro constant','4.3.2.1','Moles','combined','higher',['Define mole as an amount of substance.','Use mass, Mr and moles quantitatively.','Connect macroscopic mass to particle amount.'],['moles = mass / Mr']),
        L('Mole calculations from mass','4.3.2.1','Moles','combined','higher',['Calculate moles from mass and relative formula mass.','Rearrange for mass or Mr.','Use appropriate significant figures.'],['n = m/Mr']),
        L('Reacting masses from balanced equations','4.3.2.2','Amounts of substances in equations','combined','higher',['Interpret coefficients as mole ratios.','Convert mass to moles before using reaction ratios.','Calculate unknown reactant/product masses.']),
        L('Using moles to balance equations','4.3.2.3','Using moles to balance equations','combined','higher',['Convert experimental masses to moles.','Simplify mole amounts to whole-number ratios.','Use ratios to determine balanced coefficients.']),
        L('Limiting reactants','4.3.2.4','Limiting reactants','combined','higher',['Identify which reactant is completely consumed.','Explain how a limiting reactant controls product amount.','Use mole ratios to identify excess.']),
        L('Concentration in g per dm3','4.3.2.5','Concentration of solutions','combined','all',['Calculate concentration from mass and solution volume.','Convert cm3 to dm3 where needed.','Rearrange to find mass or volume.'],['concentration = mass / volume'])
      ]},
      {ref:'4.3.3',title:'Yield and atom economy (Chemistry only)',lessons:[
        L('Percentage yield','4.3.3.1','Percentage yield','triple','all',['Explain why actual yield can be below theoretical yield.','Calculate percentage yield.','Evaluate practical causes of product loss.'],['percentage yield = actual yield / theoretical yield x 100']),
        L('Atom economy','4.3.3.2','Atom economy','triple','all',['Explain atom economy as proportion of reactants ending in desired product.','Calculate percentage atom economy from a balanced equation.','Relate high atom economy to sustainability and economics.'],['atom economy = Mr desired product / sum Mr reactants x 100']),
        L('Yield versus atom economy','4.3.3.1','Percentage yield and atom economy','triple','all',['Distinguish efficiency of obtaining product from efficiency of atom use.','Compare processes using both measures.','Identify why high yield does not guarantee high atom economy.'])
      ]},
      {ref:'4.3.4',title:'Concentrations in mol/dm3 (Chemistry only, HT)',lessons:[
        L('Concentration in mol per dm3','4.3.4','Using concentrations of solutions in mol/dm3','triple','higher',['Calculate molar concentration from moles and volume.','Convert between mol/dm3 and g/dm3 using Mr.','Use titration data in concentration calculations.'],['c = n/V']),
        L('Titration calculations using moles','4.3.4','Using concentrations of solutions in mol/dm3','triple','higher',['Use reacting volumes and known concentration.','Apply balanced-equation mole ratios.','Calculate an unknown molar or mass concentration.'])
      ]},
      {ref:'4.3.5',title:'Amount of substance and gas volumes (Chemistry only, HT)',lessons:[
        L('Gas volumes at room temperature and pressure','4.3.5','Use of amount of substance in relation to volumes of gases','triple','higher',['Use the molar gas volume of 24 dm3 at room temperature and pressure.','Convert between gas volume and moles.','Apply equation ratios to gas-volume calculations.'],['gas volume = moles x 24 dm3'])
      ]}
    ]},

    c4:{spec:'4.4',title:'Chemical changes',paper:1,sections:[
      {ref:'4.4.1',title:'Reactivity of metals',lessons:[
        L('Metal oxides, oxidation and reduction','4.4.1.1','Metal oxides','combined','all',['Describe metal + oxygen reactions.','Define oxidation as gain of oxygen and reduction as loss of oxygen.','Identify oxidation/reduction in simple metal-oxide reactions.']),
        L('The reactivity series','4.4.1.2','The reactivity series','combined','all',['Recall key metals plus carbon and hydrogen in reactivity order.','Use reactions with water/acids to infer reactivity.','Predict displacement reactions.']),
        L('Metal displacement reactions','4.4.1.2','The reactivity series','combined','all',['Predict whether one metal displaces another.','Write equations for displacement.','Link reactivity to tendency to form positive ions.']),
        L('Extraction of metals and reduction with carbon','4.4.1.3','Extraction of metals and reduction','combined','all',['Explain why unreactive metals may occur native.','Use carbon to explain extraction of less reactive metals.','Evaluate extraction routes from provided information.']),
        L('Redox in terms of electrons','4.4.1.4','Oxidation and reduction in terms of electrons','combined','higher',['Define oxidation as electron loss and reduction as electron gain.','Identify oxidised and reduced species.','Write ionic equations for displacement reactions.'])
      ]},
      {ref:'4.4.2',title:'Reactions of acids',lessons:[
        L('Acids reacting with metals','4.4.2.1','Reactions of acids with metals','combined','all',['Predict salt and hydrogen products.','Use hydrochloric/sulfuric acid naming rules.','Higher Tier: explain the reaction as redox electron transfer.']),
        L('Neutralisation and salt formation','4.4.2.2','Neutralisation of acids and salt production','combined','all',['Predict salts formed from specified acids and bases.','Write word/symbol equations.','Use common ion formulae to deduce salt formulae.']),
        L('Acids with carbonates','4.4.2.2','Neutralisation of acids and salt production','combined','all',['Predict salt, water and carbon dioxide products.','Use gas-test evidence for carbon dioxide.','Write balanced equations for acid-carbonate reactions.']),
        L('Making soluble salts from insoluble bases','4.4.2.3','Soluble salts','combined','all',['Explain why excess insoluble solid is used.','Explain filtration and crystallisation stages.','Connect method choice to purity of the final salt.'],[],'Required practical 1: prepare a pure, dry soluble salt from an insoluble oxide or carbonate.'),
        L('pH scale and indicators','4.4.2.4','The pH scale and neutralisation','combined','all',['Interpret pH 0–14.','Use universal indicator or pH probes.','Identify acidic, neutral and alkaline solutions.']),
        L('Hydrogen ions, hydroxide ions and neutralisation','4.4.2.4','The pH scale and neutralisation','combined','all',['Explain acids using H+ ions and alkalis using OH- ions.','Write the ionic neutralisation equation.','Connect pH change to neutralisation.']),
        L('Titration technique','4.4.2.5','Titrations','triple','all',['Describe accurate acid-alkali titration using appropriate volumetric apparatus.','Use an indicator to identify an endpoint.','Use repeats to obtain concordant reacting volumes.'],[],'Required practical 2 (Chemistry only): determine reacting volumes by titration.'),
        L('Strong and weak acids','4.4.2.6','Strong and weak acids','triple','higher',['Distinguish strength from concentration.','Explain strong/weak acids in terms of degree of ionisation.','Relate a one-unit pH change to a tenfold H+ concentration change.'])
      ]},
      {ref:'4.4.3',title:'Electrolysis',lessons:[
        L('Electrolytes and the process of electrolysis','4.4.3.1','The process of electrolysis','combined','all',['Explain why molten/aqueous ionic substances conduct.','Describe cation movement to cathode and anion movement to anode.','Predict discharge as oxidation/reduction at electrodes.']),
        L('Half equations in electrolysis','4.4.3.1','The process of electrolysis','combined','higher',['Write balanced half equations.','Show electron gain at the cathode and loss at the anode.','Check both atoms and charge.']),
        L('Electrolysis of molten ionic compounds','4.4.3.2','Electrolysis of molten ionic compounds','combined','all',['Predict metal formation at cathode.','Predict non-metal formation at anode.','Use ion charges to explain products.']),
        L('Electrolysis for extracting reactive metals','4.4.3.3','Using electrolysis to extract metals','combined','all',['Explain why metals above carbon may need electrolysis.','Relate extraction route to reactivity.','Recognise energy/cost implications.']),
        L('Electrolysis of aqueous solutions','4.4.3.4','Electrolysis of aqueous solutions','combined','all',['Apply rules for competing ions in aqueous electrolysis.','Predict cathode and anode products.','Explain product choice from ion/electrode chemistry.']),
        L('Required practical: electrolysis of aqueous solutions','4.4.3.4','Electrolysis of aqueous solutions','combined','all',['Observe electrode products safely in supervised laboratory work.','Use gas tests/observations to identify products.','Link results to ions present in solution.'],[],'Required practical 3: investigate electrolysis of aqueous solutions using inert electrodes.')
      ]}
    ]},

    c5:{spec:'4.5',title:'Energy changes',paper:1,sections:[
      {ref:'4.5.1',title:'Exothermic and endothermic reactions',lessons:[
        L('Exothermic and endothermic energy transfers','4.5.1.1','Energy transfer during exothermic and endothermic reactions','combined','all',['Classify reactions from temperature change of surroundings.','Relate exothermic to energy transfer out and endothermic to transfer in.','Apply to combustion, neutralisation, decomposition and everyday uses.']),
        L('Required practical: temperature changes in reactions','4.5.1.1','Energy transfer during exothermic and endothermic reactions','combined','all',['Compare temperature changes while controlling relevant variables.','Identify major heat-loss and measurement limitations.','Interpret sign and magnitude of temperature change.'],[],'Required practical 4: investigate variables affecting temperature changes in reacting solutions.'),
        L('Reaction profiles and activation energy','4.5.1.2','Reaction profiles','combined','all',['Draw exothermic/endothermic profiles.','Identify reactants, products, activation energy and overall energy change.','Explain activation energy as the minimum collision energy for reaction.']),
        L('Bond breaking and bond making','4.5.1.3','The energy change of reactions','combined','higher',['Explain bond breaking as requiring energy.','Explain bond formation as releasing energy.','Compare totals to classify overall energy change.']),
        L('Bond-energy calculations','4.5.1.3','The energy change of reactions','combined','higher',['Calculate energy required to break bonds.','Calculate energy released forming bonds.','Find overall reaction energy change and interpret sign.'])
      ]},
      {ref:'4.5.2',title:'Chemical cells and fuel cells (Chemistry only)',lessons:[
        L('Simple chemical cells and voltage','4.5.2.1','Cells and batteries','triple','all',['Explain how two different electrodes and an electrolyte can produce a potential difference.','Relate voltage to electrode materials and electrolyte.','Interpret reactivity data for cells.']),
        L('Batteries and rechargeable cells','4.5.2.1','Cells and batteries','triple','all',['Distinguish single cells from batteries.','Compare rechargeable and non-rechargeable systems.','Explain recharge as reversal of chemical reactions using external current.']),
        L('Hydrogen fuel cells','4.5.2.2','Fuel cells','triple','all',['Describe continuous supply of fuel and oxygen.','State overall hydrogen fuel-cell product as water.','Compare fuel cells with rechargeable batteries.']),
        L('Fuel-cell half equations','4.5.2.2','Fuel cells','triple','higher',['Interpret/write electrode half equations when supplied with suitable information.','Track oxidation/reduction at electrodes.','Relate electron transfer to electrical output.'])
      ]}
    ]},

    c6:{spec:'4.6',title:'The rate and extent of chemical change',paper:2,sections:[
      {ref:'4.6.1',title:'Rate of reaction',lessons:[
        L('Calculating rates of reaction','4.6.1.1','Calculating rates of reactions','combined','all',['Calculate mean rate from quantity change/time.','Use mass, gas volume or concentration data.','Interpret units and graphs of reaction progress.']),
        L('Instantaneous rate and tangents','4.6.1.1','Calculating rates of reactions','combined','higher',['Use gradient of a tangent to find instantaneous rate.','Draw a suitable tangent to a curved graph.','Compare changing rate during a reaction.']),
        L('Effect of concentration on rate','4.6.1.2','Factors which affect the rates of chemical reactions','combined','all',['Describe increasing rate with increasing concentration.','Link to collision frequency.','Interpret rate data for different concentrations.']),
        L('Required practical: concentration and reaction rate','4.6.1.2','Factors which affect the rates of chemical reactions','combined','all',['Compare gas-volume and colour/turbidity methods.','Develop and test a hypothesis.','Control variables and analyse rate data.'],[],'Required practical 5: investigate how concentration affects rate using gas-volume and colour/turbidity methods.'),
        L('Effect of pressure on gas reaction rate','4.6.1.2','Factors which affect the rates of chemical reactions','combined','all',['Explain pressure effects on gas particle spacing.','Link increased pressure to collision frequency.','Distinguish pressure effects from concentration in solution.']),
        L('Effect of surface area on rate','4.6.1.2','Factors which affect the rates of chemical reactions','combined','all',['Explain why powders react faster than large lumps.','Link surface area to exposed reacting particles.','Use surface-area evidence in practical contexts.']),
        L('Effect of temperature on rate','4.6.1.2','Factors which affect the rates of chemical reactions','combined','all',['Explain increased collision frequency and energy.','Relate temperature to fraction of collisions exceeding activation energy.','Interpret temperature-rate graphs.']),
        L('Collision theory and activation energy','4.6.1.3','Collision theory and activation energy','combined','all',['State conditions for successful collisions.','Use collision theory to explain concentration, pressure, surface area and temperature effects.','Distinguish collision frequency from collision energy.']),
        L('Catalysts and activation energy','4.6.1.4','Catalysts','combined','all',['Define catalyst as changing rate without being used up.','Explain alternative pathway with lower activation energy.','Interpret catalysed and uncatalysed reaction profiles.'])
      ]},
      {ref:'4.6.2',title:'Reversible reactions and dynamic equilibrium',lessons:[
        L('Reversible reactions','4.6.2.1','Reversible reactions','combined','all',['Recognise reversible-reaction notation.','Explain that products can reform reactants.','Predict how changed conditions can favour one direction.']),
        L('Energy changes in reversible reactions','4.6.2.2','Energy changes and reversible reactions','combined','all',['Explain why exothermic forward means endothermic reverse.','State equal magnitude of energy change in opposite directions.','Interpret energy information for reversible systems.']),
        L('Dynamic equilibrium in closed systems','4.6.2.3','Equilibrium','combined','all',['Define equilibrium as equal forward/reverse rates.','Explain why concentrations remain constant while reactions continue.','Recognise need for a closed system.']),
        L('Le Chatelier principle','4.6.2.4','The effect of changing conditions on equilibrium','combined','higher',['Predict qualitative shifts after condition changes.','Explain response as opposing the imposed change.','Separate equilibrium position from reaction rate.']),
        L('Concentration and equilibrium','4.6.2.5','The effect of changing concentration','combined','higher',['Predict effect of adding/removing reactants or products.','Explain new equilibrium composition qualitatively.','Avoid saying equilibrium permanently stops.']),
        L('Temperature and equilibrium','4.6.2.6','The effect of temperature changes on equilibrium','combined','higher',['Use endothermic/exothermic direction to predict shifts.','Explain effect on relative product amount.','Separate rate increase from equilibrium-position change.']),
        L('Pressure and equilibrium','4.6.2.7','The effect of pressure changes on equilibrium','combined','higher',['Use gaseous molecule counts to predict pressure effects.','Identify when pressure change has no positional effect.','Apply to unfamiliar gaseous equilibria.'])
      ]}
    ]},

    c7:{spec:'4.7',title:'Organic chemistry',paper:2,sections:[
      {ref:'4.7.1',title:'Carbon compounds as fuels and feedstock',lessons:[
        L('Crude oil as a mixture of hydrocarbons','4.7.1.1','Crude oil, hydrocarbons and alkanes','combined','all',['Describe crude oil as finite ancient biomass.','Define hydrocarbons.','Recognise alkanes and the general formula CnH2n+2.']),
        L('First four alkanes and formulae','4.7.1.1','Crude oil, hydrocarbons and alkanes','combined','all',['Recall methane, ethane, propane and butane.','Recognise molecular/structural representations.','Use the alkane general formula.']),
        L('Fractional distillation of crude oil','4.7.1.2','Fractional distillation and petrochemicals','combined','all',['Explain separation by boiling range, evaporation and condensation.','Relate fraction size to different hydrocarbon molecules.','Explain crude-oil fractions as fuels and feedstock.']),
        L('Petrochemicals and modern materials','4.7.1.2','Fractional distillation and petrochemicals','combined','all',['Identify fuels, solvents, lubricants, polymers and detergents as petrochemical products.','Explain importance of carbon-chain chemistry.','Link feedstock to chemical manufacture.']),
        L('Hydrocarbon size and boiling point','4.7.1.3','Properties of hydrocarbons','combined','all',['Relate chain length to intermolecular forces and boiling point.','Explain viscosity/flammability trends qualitatively.','Use molecular size to interpret fraction properties.']),
        L('Combustion of hydrocarbons','4.7.1.3','Properties of hydrocarbons','combined','all',['Write complete combustion equations.','Identify carbon dioxide and water products.','Relate fuel combustion to energy transfer and emissions.']),
        L('Cracking hydrocarbons','4.7.1.4','Cracking and alkenes','combined','all',['Explain why long hydrocarbons are cracked.','Describe catalytic/steam cracking in general terms.','Identify shorter alkanes and alkenes as products.']),
        L('Alkenes and the bromine-water test','4.7.1.4','Cracking and alkenes','combined','all',['Describe alkene unsaturation qualitatively.','Recall bromine-water colour change.','Explain why alkenes are useful polymer feedstock.'])
      ]},
      {ref:'4.7.2',title:'Reactions of alkenes and alcohols (Chemistry only)',lessons:[
        L('Structure and formulae of alkenes','4.7.2.1','Structure and formulae of alkenes','triple','all',['Use general formula CnH2n.','Recognise ethene, propene, butene and pentene.','Identify C=C as the functional feature.']),
        L('Addition reactions of alkenes','4.7.2.2','Reactions of alkenes','triple','all',['Explain addition across C=C.','Recognise reactions with hydrogen, water and halogens.','Predict products from displayed structures.']),
        L('Alcohols: functional group and homologous series','4.7.2.3','Alcohols','triple','all',['Recognise -OH functional group.','Recall first four alcohols.','Interpret structural/molecular formulae.']),
        L('Reactions and uses of alcohols','4.7.2.3','Alcohols','triple','all',['Describe combustion and oxidation of alcohols.','Describe reaction with sodium and use as solvents/fuels.','Relate ethanol chemistry to practical uses.']),
        L('Carboxylic acids and functional group','4.7.2.4','Carboxylic acids','triple','all',['Recognise -COOH.','Recall first four carboxylic acids.','Connect weak-acid behaviour to reactions.']),
        L('Reactions of carboxylic acids and esterification','4.7.2.4','Carboxylic acids','triple','all',['Describe reactions with carbonates and alcohols.','Recognise ester formation.','Relate functional groups to reaction type.'])
      ]},
      {ref:'4.7.3',title:'Synthetic and naturally occurring polymers (Chemistry only)',lessons:[
        L('Addition polymerisation','4.7.3.1','Addition polymerisation','triple','all',['Explain monomers joining without small-molecule by-product.','Relate alkene double bonds to polymer formation.','Draw repeating units and identify monomers.']),
        L('Condensation polymerisation','4.7.3.2','Condensation polymerisation','triple','higher',['Explain monomers with two functional groups joining.','Recognise elimination of a small molecule.','Interpret polymer structures.']),
        L('Amino acids and polypeptides','4.7.3.3','Amino acids','triple','higher',['Recognise amino and carboxyl functional groups.','Explain condensation into polypeptides.','Relate amino-acid sequence to proteins.']),
        L('DNA and naturally occurring polymers','4.7.3.4','DNA and other naturally occurring polymers','triple','all',['Recognise DNA as a polymer built from nucleotide units.','Recognise proteins and starch/cellulose as natural polymers.','Connect monomer/polymer ideas across biology and chemistry.'])
      ]}
    ]},

    c8:{spec:'4.8',title:'Chemical analysis',paper:2,sections:[
      {ref:'4.8.1',title:'Purity, formulations and chromatography',lessons:[
        L('Pure substances and melting/boiling points','4.8.1.1','Pure substances','combined','all',['Define pure substance chemically.','Use sharp melting/boiling temperatures as evidence of purity.','Distinguish chemical meaning of pure from everyday meaning.']),
        L('Formulations','4.8.1.2','Formulations','combined','all',['Define formulation as a designed mixture.','Explain roles of components and controlled proportions.','Identify formulations from contextual information.']),
        L('Chromatography: stationary and mobile phases','4.8.1.3','Chromatography','combined','all',['Explain separation through different distributions between phases.','Interpret number/position of spots.','Use chromatograms to compare mixtures and pure substances.']),
        L('Rf calculations and chromatogram interpretation','4.8.1.3','Chromatography','combined','all',['Calculate Rf from solute and solvent distances.','Use suitable significant figures.','Compare Rf values only under matching conditions.'],['Rf = distance moved by substance / distance moved by solvent']),
        L('Required practical: paper chromatography','4.8.1.3','Chromatography','combined','all',['Separate coloured substances using supervised chromatography.','Measure distances from the origin accurately.','Calculate and compare Rf values.'],['Rf = distance moved by substance / distance moved by solvent'],'Required practical 6: use paper chromatography to separate coloured substances and calculate Rf values.')
      ]},
      {ref:'4.8.2',title:'Identification of common gases',lessons:[
        L('Test for hydrogen','4.8.2.1','Test for hydrogen','combined','all',['Recall the characteristic burning-splint result.','Distinguish observation from gas conclusion.','Choose the test only when hydrogen is a plausible product.']),
        L('Test for oxygen','4.8.2.2','Test for oxygen','combined','all',['Recall the glowing-splint result.','Use clear observational wording.','Distinguish oxygen from other common gases.']),
        L('Test for carbon dioxide','4.8.2.3','Test for carbon dioxide','combined','all',['Recall limewater result.','Link carbonate-acid reactions to carbon dioxide.','Use observation-first exam language.']),
        L('Test for chlorine','4.8.2.4','Test for chlorine','combined','all',['Recall damp litmus bleaching result.','Distinguish bleaching from a simple colour indicator change.','Apply to electrolysis gas identification.'])
      ]},
      {ref:'4.8.3',title:'Identification of ions by chemical and spectroscopic means (Chemistry only)',lessons:[
        L('Flame tests for metal ions','4.8.3.1','Flame tests','triple','all',['Recall specified flame colours for Li, Na, K, Ca and Cu ions.','Explain why mixtures may mask colours.','Use observations to identify a cation.']),
        L('Metal hydroxide precipitate tests','4.8.3.2','Metal hydroxides','triple','all',['Recall precipitate colours for specified ions.','Use excess sodium hydroxide behaviour for aluminium.','Write suitable precipitation equations where required.']),
        L('Test for carbonate ions','4.8.3.3','Carbonates','triple','all',['React carbonate with dilute acid.','Identify released carbon dioxide using limewater.','Record observation before conclusion.']),
        L('Test for halide ions','4.8.3.4','Halides','triple','all',['Use acidified silver nitrate appropriately in theory questions.','Recall chloride white, bromide cream and iodide yellow precipitates.','Interpret unknown results.']),
        L('Test for sulfate ions','4.8.3.5','Sulfates','triple','all',['Use acidified barium solution in theory questions.','Recognise white precipitate as sulfate evidence.','Combine test evidence to identify an unknown.']),
        L('Required practical: identifying ions in unknown compounds','4.8.3.5','Ion identification','triple','all',['Select specified tests for unknown ionic compounds.','Record flame/precipitate observations systematically.','Use multiple observations to identify ions.'],[],'Required practical 7 (Chemistry only): use chemical tests to identify ions in unknown single ionic compounds.'),
        L('Instrumental methods in chemical analysis','4.8.3.6','Instrumental methods','triple','all',['Compare instrumental methods with wet chemical tests.','State advantages of sensitivity, accuracy and speed.','Recognise need for interpretation/calibration.']),
        L('Flame emission spectroscopy','4.8.3.7','Flame emission spectroscopy','triple','all',['Explain that metal ions produce characteristic line spectra.','Use line position to identify ions.','Use line intensity to infer concentration.'])
      ]}
    ]},

    c9:{spec:'4.9',title:'Chemistry of the atmosphere',paper:2,sections:[
      {ref:'4.9.1',title:'Composition and evolution of the atmosphere',lessons:[
        L('Modern atmospheric composition','4.9.1.1','The proportions of different gases in the atmosphere','combined','all',['Recall approximate nitrogen and oxygen proportions.','Recognise small proportions of carbon dioxide, water vapour and noble gases.','Use percentages and ratios from atmospheric data.']),
        L('Earth’s early atmosphere','4.9.1.2','The Earth’s early atmosphere','combined','all',['Describe a volcanic-gas model of early atmosphere.','Explain ocean formation as water vapour condensed.','Evaluate theories where early evidence is limited.']),
        L('How oxygen increased','4.9.1.3','How oxygen increased','combined','all',['Explain photosynthetic oxygen production by algae/plants.','Describe long-term rise in atmospheric oxygen.','Relate oxygen rise to evolution of aerobic organisms.']),
        L('How carbon dioxide decreased','4.9.1.4','How carbon dioxide decreased','combined','all',['Explain removal by photosynthesis.','Explain dissolution and carbonate sediment formation.','Relate fossil-fuel and sedimentary-rock formation to stored carbon.'])
      ]},
      {ref:'4.9.2',title:'Carbon dioxide and methane as greenhouse gases',lessons:[
        L('Greenhouse gases and the greenhouse effect','4.9.2.1','Greenhouse gases','combined','all',['Identify water vapour, carbon dioxide and methane.','Explain interaction of short- and long-wavelength radiation with matter.','Distinguish natural greenhouse effect from enhanced greenhouse forcing.']),
        L('Human activities increasing carbon dioxide','4.9.2.2','Human activities which contribute to an increase in greenhouse gases','combined','all',['Identify combustion and land-use changes as major examples.','Connect activities to atmospheric concentration.','Interpret trend data critically.']),
        L('Human activities increasing methane','4.9.2.2','Human activities which contribute to an increase in greenhouse gases','combined','all',['Identify agriculture, waste and other methane sources.','Connect activity to emissions.','Compare evidence and uncertainty in climate reporting.']),
        L('Evidence, peer review and climate models','4.9.2.2','Human activities which contribute to an increase in greenhouse gases','combined','all',['Evaluate quality of evidence.','Recognise uncertainty in complex-system models.','Explain importance of peer review and communication.']),
        L('Potential effects of global climate change','4.9.2.3','Global climate change','combined','all',['Describe multiple potential effects.','Discuss scale, risk and environmental implications.','Distinguish evidence-based projections from certainty.']),
        L('Carbon footprints and reduction strategies','4.9.2.4','The carbon footprint and its reduction','combined','all',['Define carbon footprint over a full life cycle.','Suggest ways to reduce carbon dioxide/methane emissions.','Explain economic, social or technical barriers.'])
      ]},
      {ref:'4.9.3',title:'Common atmospheric pollutants and their sources',lessons:[
        L('Products and pollutants from burning fuels','4.9.3.1','Atmospheric pollutants from fuels','combined','all',['Predict products from fuel composition and combustion conditions.','Explain formation of CO, SO2, NOx and particulates.','Distinguish complete and incomplete combustion.']),
        L('Carbon monoxide and particulate pollution','4.9.3.2','Properties and effects of atmospheric pollutants','combined','all',['Explain carbon monoxide toxicity.','Explain particulate effects on health and global dimming.','Connect pollutant source to effect.']),
        L('Sulfur dioxide, nitrogen oxides and acid rain','4.9.3.2','Properties and effects of atmospheric pollutants','combined','all',['Explain respiratory effects.','Relate sulfur dioxide and nitrogen oxides to acid rain.','Evaluate pollution-control approaches from supplied information.'])
      ]}
    ]},

    c10:{spec:'4.10',title:'Using resources',paper:2,sections:[
      {ref:'4.10.1',title:'Using Earth’s resources and obtaining potable water',lessons:[
        L('Natural, finite and renewable resources','4.10.1.1','Using the Earth’s resources and sustainable development','combined','all',['Classify finite and renewable resources.','Give examples of natural, agricultural and synthetic products.','Interpret resource data and orders of magnitude.']),
        L('Sustainable development and chemistry','4.10.1.1','Using the Earth’s resources and sustainable development','combined','all',['Define sustainable development.','Explain chemistry’s role in reducing resource use/waste.','Evaluate trade-offs in industrial choices.']),
        L('Potable water versus pure water','4.10.1.2','Potable water','combined','all',['Distinguish potable from chemically pure water.','Describe treatment of freshwater.','Explain why desalination is energy intensive.']),
        L('Producing potable water from freshwater and seawater','4.10.1.2','Potable water','combined','all',['Describe filtration and sterilisation stages.','Compare distillation/reverse osmosis with freshwater treatment.','Choose suitable methods from contextual information.']),
        L('Required practical: analysis and purification of water','4.10.1.2','Potable water','combined','all',['Analyse supervised water samples using pH and dissolved-solids observations.','Use distillation as a purification/separation technique.','Evaluate source-dependent water quality.'],[],'Required practical 8: analyse and purify water samples, including pH, dissolved solids and distillation.'),
        L('Waste-water treatment','4.10.1.3','Waste water treatment','combined','all',['Describe screening, sedimentation, anaerobic digestion and aerobic treatment.','Compare sewage, agricultural and industrial waste water.','Comment on relative difficulty of obtaining potable water from different sources.']),
        L('Phytomining and bioleaching','4.10.1.4','Alternative methods of extracting metals','combined','higher',['Explain extraction from low-grade copper ores.','Compare phytomining and bioleaching.','Evaluate benefits/limitations versus conventional mining.'])
      ]},
      {ref:'4.10.2',title:'Life cycle assessment and recycling',lessons:[
        L('Life cycle assessment stages','4.10.2.1','Life cycle assessment','combined','all',['Track raw materials, manufacture, use and disposal.','Include transport/distribution impacts.','Compare products using quantitative data where available.']),
        L('Limitations and value judgements in LCAs','4.10.2.1','Life cycle assessment','combined','all',['Distinguish quantifiable impacts from subjective judgements.','Recognise selective or biased LCAs.','Evaluate claims using complete life-cycle evidence.']),
        L('Reduce, reuse and recycle','4.10.2.2','Ways of reducing the use of resources','combined','all',['Explain how reduction/reuse/recycling conserve resources and energy.','Compare recycling routes for metals, glass and plastics.','Evaluate environmental costs of separation and processing.'])
      ]},
      {ref:'4.10.3',title:'Using materials (Chemistry only)',lessons:[
        L('Corrosion and rusting','4.10.3.1','Corrosion and its prevention','triple','all',['Define corrosion.','Explain need for both oxygen and water in rusting.','Interpret rusting-condition experiments.']),
        L('Preventing corrosion and sacrificial protection','4.10.3.1','Corrosion and its prevention','triple','all',['Explain barrier methods.','Explain galvanising/sacrificial protection using reactivity.','Choose a method for a given application.']),
        L('Alloys as useful materials','4.10.3.2','Alloys as useful materials','triple','all',['Recall examples such as bronze, brass and steels.','Relate composition to properties.','Interpret unfamiliar alloy data and uses.']),
        L('Ceramics, polymers and composites','4.10.3.3','Ceramics, polymers and composites','triple','all',['Compare material classes.','Relate structure/properties to uses.','Select materials using quantitative property data.'])
      ]},
      {ref:'4.10.4',title:'Haber process and NPK fertilisers (Chemistry only)',lessons:[
        L('Haber process raw materials and reaction','4.10.4.1','The Haber process','triple','all',['Recall nitrogen and hydrogen sources.','Write/interpret the reversible ammonia equation.','Describe recycling of unreacted gases.']),
        L('Haber process conditions and compromise','4.10.4.1','The Haber process','triple','higher',['Explain temperature and pressure effects using rate and equilibrium.','Explain catalyst role.','Evaluate commercial compromise among yield, rate, energy and cost.']),
        L('NPK fertilisers and nutrient ions','4.10.4.2','Production and uses of NPK fertilisers','triple','all',['Explain purpose of nitrogen, phosphorus and potassium compounds.','Compare industrial production routes.','Interpret fertiliser composition information.'])
      ]}
    ]}
  };

  const lessonLookup={};
  Object.entries(chemistry).forEach(([topicId,spec])=>{
    const topic=data.topics.find(t=>t.id===topicId); if(!topic) return;
    const flattened=[];
    spec.sections.forEach(section=>section.lessons.forEach(lesson=>{lessonLookup[`${topicId}::${lesson.title}`]=lesson; flattened.push([lesson.title,lesson.scope]);}));
    topic.lessons=flattened; topic.specRef=spec.spec; topic.specSections=spec.sections.map(s=>({ref:s.ref,title:s.title}));
    topic.summary=`AQA GCSE Chemistry ${spec.spec}: ${spec.sections.map(s=>s.title).join('; ')}.`;
  });

  window.GCSE_CHEMISTRY_SPEC_DETAIL={specification:'AQA GCSE Chemistry 8462',paper1:['c1','c2','c3','c4','c5'],paper2:['c6','c7','c8','c9','c10'],keyIdeas:'4.11',topics:chemistry,lessonLookup,getLesson(topicId,title){return lessonLookup[`${topicId}::${title}`]||null;}};
})();