(() => {
  const data = window.GCSE_COURSE_DATA;
  if (!data?.topics) return;

  const L = (title, ref, section, scope='combined', tier='all', focus=[], practical='') => ({title,ref,section,scope,tier,focus,practical});

  const biology = {
    b1:{spec:'4.1',title:'Cell biology',paper:1,sections:[
      {ref:'4.1.1',title:'Cell structure',lessons:[
        L('Eukaryotic and prokaryotic cells','4.1.1.1','Eukaryotes and prokaryotes','combined','all',['Compare plant/animal eukaryotic cells with bacterial prokaryotic cells.','Use scale, size and standard form when comparing cells.','Relate DNA location and plasmids to prokaryotic cell structure.']),
        L('Animal cell structures and functions','4.1.1.2','Animal and plant cells','combined','all',['Identify nucleus, cytoplasm, cell membrane, mitochondria and ribosomes.','Explain how each sub-cellular structure contributes to cell function.','Interpret diagrams and micrographs of animal cells.']),
        L('Plant cell structures and functions','4.1.1.2','Animal and plant cells','combined','all',['Identify chloroplasts, permanent vacuole and cellulose cell wall as well as structures shared with animal cells.','Relate chloroplasts to photosynthesis and cell walls to support.','Compare plant and animal cells precisely.']),
        L('Specialised animal cells','4.1.1.3','Cell specialisation','combined','all',['Explain how sperm, nerve and muscle cell structures suit their functions.','Use structure-function language rather than simply listing features.','Apply knowledge to unfamiliar specialised cells.']),
        L('Specialised plant cells','4.1.1.3','Cell specialisation','combined','all',['Explain adaptations of root hair, xylem and phloem cells.','Link specialised cell structure to transport and support.','Apply structure-function reasoning to unfamiliar plant cells.']),
        L('Cell differentiation','4.1.1.4','Cell differentiation','combined','all',['Explain differentiation and why specialised cells contain different structures.','Compare differentiation in animal and plant development.','Link cell division, growth and differentiation.']),
        L('Light and electron microscopy','4.1.1.5','Microscopy','combined','all',['Compare magnification and resolution of light and electron microscopes.','Explain how electron microscopy improved understanding of sub-cellular structures.','Distinguish magnification from resolution.']),
        L('Magnification, image size and real size','4.1.1.5','Microscopy','combined','all',['Calculate magnification, image size or real size.','Convert between mm, micrometres and nanometres.','Use standard form where appropriate.']),
        L('Required practical: microscopy','4.1.1.2','Animal and plant cells','combined','all',['Prepare and observe plant and animal cells using a light microscope.','Produce biological drawings with labels and a magnification scale.','Evaluate image quality and measurement uncertainty.'],'Required practical 1: use a light microscope to observe, draw and label plant and animal cells.'),
        L('Culturing microorganisms and aseptic technique','4.1.1.6','Culturing microorganisms','triple','all',['Describe bacterial growth by binary fission and suitable culture conditions.','Explain aseptic technique and the purpose of sterilising equipment.','Explain why school cultures are incubated at a maximum of 25 degrees C.']),
        L('Bacterial growth calculations and colony areas','4.1.1.6','Culturing microorganisms','triple','higher',['Calculate bacterial population growth from division time.','Calculate colony or inhibition-zone areas using pi r squared.','Express large populations in standard form.']),
        L('Required practical: antibiotics and antiseptics','4.1.1.6','Culturing microorganisms','triple','all',['Investigate effects of antiseptics or antibiotics on bacterial growth.','Measure zones of inhibition consistently.','Identify controls, aseptic precautions and sources of uncertainty.'],'Required practical 2 (Biology only): investigate antiseptics or antibiotics using agar plates.')
      ]},
      {ref:'4.1.2',title:'Cell division',lessons:[
        L('Chromosomes, DNA and genes','4.1.2.1','Chromosomes','combined','all',['Describe chromosomes as DNA molecules carrying many genes.','Recall that body-cell chromosomes occur in pairs.','Connect nucleus, chromosomes, DNA and genes.']),
        L('The cell cycle','4.1.2.2','Mitosis and the cell cycle','combined','all',['Sequence cell growth, DNA replication, mitosis and cytoplasmic division.','Explain why sub-cellular structures increase before division.','Recognise contexts in which mitosis is occurring.']),
        L('Mitosis, growth and repair','4.1.2.2','Mitosis and the cell cycle','combined','all',['Explain that mitosis produces genetically identical daughter cells.','Link mitosis to growth, development, repair and replacement.','Distinguish mitosis from meiosis.']),
        L('Stem cells and differentiation','4.1.2.3','Stem cells','combined','all',['Define stem cells as undifferentiated cells that can produce other cell types.','Compare embryonic, adult bone-marrow and plant meristem stem cells.','Explain potential medical and agricultural uses.']),
        L('Stem-cell treatments, risks and ethics','4.1.2.3','Stem cells','combined','all',['Evaluate potential benefits and risks of stem-cell treatments.','Explain therapeutic cloning in outline.','Consider ethical objections alongside scientific evidence.'])
      ]},
      {ref:'4.1.3',title:'Transport in cells',lessons:[
        L('Diffusion and concentration gradients','4.1.3.1','Diffusion','combined','all',['Define diffusion as net movement down a concentration gradient.','Explain effects of concentration difference, temperature and membrane surface area.','Apply diffusion to oxygen, carbon dioxide and urea transport.']),
        L('Surface area to volume ratio and exchange surfaces','4.1.3.1','Diffusion','combined','all',['Calculate and compare surface-area-to-volume ratios.','Explain why multicellular organisms need specialised exchange surfaces and transport systems.','Relate thin membranes, large area, blood supply and ventilation to effective exchange.']),
        L('Osmosis','4.1.3.2','Osmosis','combined','all',['Define osmosis as water movement through a partially permeable membrane from dilute to concentrated solution.','Predict water movement and changes in cell or tissue mass.','Calculate percentage gain or loss of mass.']),
        L('Required practical: osmosis in plant tissue','4.1.3.2','Osmosis','combined','all',['Investigate plant-tissue mass change across solution concentrations.','Control size, time, temperature and blotting technique.','Plot and interpret percentage-change data.'],'Required practical 3: investigate osmosis using plant tissue in salt or sugar solutions.'),
        L('Active transport','4.1.3.3','Active transport','combined','all',['Explain movement against a concentration gradient using energy from respiration.','Apply active transport to mineral uptake by roots and glucose absorption in the gut.','Compare diffusion, osmosis and active transport.'])
      ]}
    ]},

    b2:{spec:'4.2',title:'Organisation',paper:1,sections:[
      {ref:'4.2.1',title:'Principles of organisation',lessons:[
        L('Cells, tissues, organs and organ systems','4.2.1','Principles of organisation','combined','all',['Order levels of organisation from cells to organism.','Define tissue, organ and organ system accurately.','Apply the hierarchy to unfamiliar examples.'])
      ]},
      {ref:'4.2.2',title:'Animal tissues, organs and organ systems',lessons:[
        L('The human digestive system','4.2.2.1','The human digestive system','combined','all',['Identify major digestive organs and their roles.','Explain digestion as conversion of large insoluble molecules into small soluble molecules.','Link digestion to absorption and use of nutrients.']),
        L('Enzymes and active sites','4.2.2.1','The human digestive system','combined','all',['Describe enzymes as biological catalysts with specific active sites.','Use the lock-and-key model as a simplified explanation.','Explain enzyme specificity.']),
        L('Temperature, pH and enzyme activity','4.2.2.1','The human digestive system','combined','all',['Explain how temperature changes collision frequency and high temperature denatures enzymes.','Explain how pH can alter active-site shape.','Interpret enzyme-rate graphs.']),
        L('Carbohydrases, proteases and lipases','4.2.2.1','The human digestive system','combined','all',['Recall substrates and products of major digestive enzymes.','Recall sites of production and action in the digestive system.','Use digestion products in later metabolic explanations.']),
        L('Bile and fat digestion','4.2.2.1','The human digestive system','combined','all',['Explain bile production, storage and release.','Explain neutralisation of stomach acid and emulsification of lipids.','Link smaller fat droplets to increased surface area and faster lipase action.']),
        L('Required practical: food tests','4.2.2.1','The human digestive system','combined','all',['Use Benedict’s solution, iodine and Biuret reagent appropriately.','Record positive and negative observations accurately.','Use controls and safe heating where required.'],'Required practical 4: use qualitative reagents to test for carbohydrates, lipids and proteins.'),
        L('Required practical: pH and amylase','4.2.2.1','The human digestive system','combined','all',['Investigate effect of pH on amylase activity using continuous sampling.','Control temperature using a water bath or heater.','Calculate reaction rate from time taken for starch disappearance.'],'Required practical 5: investigate the effect of pH on amylase activity.'),
        L('Heart structure and double circulation','4.2.2.2','The heart and blood vessels','combined','all',['Identify chambers and major blood vessels named in the specification.','Explain pulmonary and systemic circulation.','Link ventricular wall thickness to pumping role.']),
        L('Lungs and gas exchange','4.2.2.2','The heart and blood vessels','combined','all',['Identify trachea, bronchi, alveoli and surrounding capillaries.','Explain alveolar adaptations for gas exchange.','Link ventilation and blood flow to diffusion gradients.']),
        L('Arteries, veins and capillaries','4.2.2.2','The heart and blood vessels','combined','all',['Compare vessel wall thickness, lumen size and valves.','Relate vessel structure to pressure and function.','Use rate calculations for blood flow where required.']),
        L('Pacemakers and heart-rate control','4.2.2.2','The heart and blood vessels','combined','all',['Explain the role of natural pacemaker cells in the right atrium.','Describe artificial pacemakers as electrical devices correcting heart-rate irregularities.','Apply knowledge to treatment contexts.']),
        L('Blood components and their functions','4.2.2.3','Blood','combined','all',['Describe plasma, red cells, white cells and platelets.','Explain adaptations of red and white blood cells.','Recognise blood cells from images.']),
        L('Coronary heart disease','4.2.2.4','Coronary heart disease','combined','all',['Explain fatty deposits narrowing coronary arteries and reducing oxygen supply to heart muscle.','Link reduced oxygen to respiration and heart function.','Interpret risk and treatment information.']),
        L('Stents, statins, valves and transplants','4.2.2.4','Coronary heart disease','combined','all',['Compare stents and statins as CHD treatments.','Explain consequences and treatments of faulty heart valves.','Evaluate transplants and artificial hearts using benefits and risks.']),
        L('Health, disease and interactions','4.2.2.5','Health issues','combined','all',['Define health as physical and mental wellbeing.','Explain interactions between communicable and non-communicable conditions.','Interpret incidence and epidemiological data.']),
        L('Risk factors, correlation and causation','4.2.2.6','Lifestyle and non-communicable disease','combined','all',['Identify lifestyle and environmental risk factors.','Distinguish correlation from a proven causal mechanism.','Interpret scatter graphs, tables and population data.']),
        L('Lifestyle and cardiovascular disease','4.2.2.6','Lifestyle and non-communicable disease','combined','all',['Explain effects of diet, exercise and smoking on cardiovascular disease risk.','Use evidence to evaluate lifestyle recommendations.','Recognise that disease often has multiple interacting causes.']),
        L('Obesity, diabetes, alcohol and smoking risks','4.2.2.6','Lifestyle and non-communicable disease','combined','all',['Link obesity to Type 2 diabetes risk.','Explain effects of alcohol on liver/brain and smoking on respiratory disease and cancer.','Evaluate data without assuming correlation proves causation.']),
        L('Cancer: benign and malignant tumours','4.2.2.7','Cancer','combined','all',['Explain cancer as uncontrolled cell division.','Distinguish benign from malignant tumours and metastasis.','Recognise lifestyle and genetic risk factors.'])
      ]},
      {ref:'4.2.3',title:'Plant tissues, organs and systems',lessons:[
        L('Plant tissues and leaf structure','4.2.3.1','Plant tissues','combined','all',['Relate epidermal, palisade, spongy mesophyll, xylem, phloem and meristem tissues to function.','Identify tissues in a leaf cross-section.','Link leaf organisation to photosynthesis and gas exchange.']),
        L('Xylem and water transport','4.2.3.2','Plant organ system','combined','all',['Describe xylem transport of water and mineral ions from roots to leaves.','Explain transpiration as evaporation and diffusion of water from leaves.','Relate xylem structure to function.']),
        L('Phloem and translocation','4.2.3.2','Plant organ system','combined','all',['Describe movement of dissolved sugars by translocation.','Explain transport from sources to sinks.','Distinguish phloem transport from xylem transport.']),
        L('Transpiration and stomata','4.2.3.2','Plant organ system','combined','all',['Explain effects of light, temperature, humidity and air movement on transpiration.','Describe guard-cell control of stomata.','Interpret potometer or water-loss data.'])
      ]}
    ]},

    b3:{spec:'4.3',title:'Infection and response',paper:1,sections:[
      {ref:'4.3.1',title:'Communicable diseases',lessons:[
        L('Pathogens, infection and transmission','4.3.1.1','Communicable diseases','combined','all',['Classify viruses, bacteria, protists and fungi as pathogen groups.','Explain direct-contact, water and airborne transmission.','Explain how disease spread can be reduced.']),
        L('Viral diseases: measles, HIV and TMV','4.3.1.2','Viral diseases','combined','all',['Recall transmission, effects and control of measles.','Explain how HIV damages immune function and how spread can be reduced.','Explain how TMV reduces plant growth by reducing photosynthesis.']),
        L('Bacterial diseases: Salmonella and gonorrhoea','4.3.1.3','Bacterial diseases','combined','all',['Recall transmission, symptoms and control of Salmonella.','Recall cause, transmission and control of gonorrhoea.','Link antibiotic resistance to treatment difficulty.']),
        L('Fungal disease: rose black spot','4.3.1.4','Fungal diseases','combined','all',['Recognise symptoms and effects of rose black spot.','Explain environmental spread by water or wind.','Explain control by fungicides and removal of infected leaves.']),
        L('Protist disease: malaria','4.3.1.5','Protist diseases','combined','all',['Explain malaria transmission using the mosquito vector.','Relate life cycle and transmission to control methods.','Evaluate mosquito-control strategies.']),
        L('Non-specific human defence systems','4.3.1.6','Human defence systems','combined','all',['Explain roles of skin, nose, trachea/bronchi and stomach in preventing pathogen entry.','Distinguish non-specific barriers from immune responses.','Apply barrier-defence knowledge to unfamiliar contexts.']),
        L('White blood cells, phagocytosis and antibodies','4.3.1.6','Human defence systems','combined','all',['Explain phagocytosis, antibody production and antitoxin production.','Link antibody specificity to antigens.','Explain coordinated immune defence after pathogen entry.']),
        L('Vaccination and population protection','4.3.1.7','Vaccination','combined','all',['Explain how inactive/dead pathogen material stimulates antibody production and memory.','Explain faster secondary response to the same pathogen.','Explain how high vaccination coverage reduces spread.']),
        L('Antibiotics and painkillers','4.3.1.8','Antibiotics and painkillers','combined','all',['Explain why antibiotics treat bacterial but not viral infections.','Distinguish medicines that kill pathogens from symptom-relieving painkillers.','Explain why antibiotic resistance is a concern.']),
        L('Drug discovery and sources','4.3.1.9','Discovery and development of drugs','combined','all',['Recall examples of medicines originating from plants or microorganisms.','Explain why new compounds may still be synthesised after discovery from natural sources.','Use historical examples to illustrate scientific development.']),
        L('Preclinical testing, clinical trials and peer review','4.3.1.9','Discovery and development of drugs','combined','all',['Explain testing for toxicity, efficacy and dose.','Describe progression from cells/tissues/animals to volunteers and patients.','Explain placebos, double-blind trials and peer review.'])
      ]},
      {ref:'4.3.2',title:'Monoclonal antibodies (Biology only, HT)',lessons:[
        L('Producing monoclonal antibodies','4.3.2.1','Producing monoclonal antibodies','triple','higher',['Explain stimulation of lymphocytes, hybridoma formation and cloning.','Explain specificity to a particular antigen binding site.','Sequence production and purification of monoclonal antibodies.']),
        L('Uses of monoclonal antibodies','4.3.2.2','Uses of monoclonal antibodies','triple','higher',['Explain diagnostic, analytical, research and treatment uses.','Explain targeted delivery to cancer cells in a given context.','Evaluate advantages, limitations and side effects.'])
      ]},
      {ref:'4.3.3',title:'Plant disease (Biology only)',lessons:[
        L('Plant diseases, pests and mineral deficiencies','4.3.3.1','Detection and identification of plant diseases','triple','all',['Recognise TMV, black spot and aphids as specified examples.','Explain nitrate deficiency causing stunted growth and magnesium deficiency causing chlorosis.','Link mineral-ion roles to symptoms.']),
        L('Detecting and identifying plant disease','4.3.3.1','Detection and identification of plant diseases','triple','higher',['Recognise disease symptoms and pest evidence.','Explain identification using manuals, laboratory testing or monoclonal-antibody kits.','Use symptoms as evidence rather than assuming one cause.']),
        L('Plant physical, chemical and mechanical defences','4.3.3.2','Plant defence responses','triple','all',['Describe cellulose walls, waxy cuticle and bark as physical defences.','Describe antibacterial chemicals and poisons as chemical defences.','Describe thorns, hairs, leaf movement and mimicry as mechanical adaptations.'])
      ]}
    ]},

    b4:{spec:'4.4',title:'Bioenergetics',paper:1,sections:[
      {ref:'4.4.1',title:'Photosynthesis',lessons:[
        L('Photosynthetic reaction and equation','4.4.1.1','Photosynthetic reaction','combined','all',['Write and interpret word/symbol representations of photosynthesis.','Describe photosynthesis as an endothermic reaction.','Explain transfer of light energy to chloroplasts.']),
        L('Light intensity and photosynthesis rate','4.4.1.2','Rate of photosynthesis','combined','all',['Explain light intensity as a limiting factor.','Measure and calculate rate from oxygen production or another suitable indicator.','Interpret rate graphs.']),
        L('Carbon dioxide, temperature and chlorophyll as limiting factors','4.4.1.2','Rate of photosynthesis','combined','all',['Explain effects of carbon dioxide concentration, temperature and chlorophyll amount.','Identify limiting factors from graphs and data.','Explain plateaus when another factor becomes limiting.']),
        L('Inverse square law and photosynthesis','4.4.1.2','Rate of photosynthesis','combined','higher',['Use the inverse-square relationship for light intensity and distance where applicable.','Rearrange simple proportional relationships.','Evaluate limitations of lamp-distance investigations.']),
        L('Required practical: photosynthesis rate','4.4.1.2','Rate of photosynthesis','combined','all',['Investigate effect of light intensity on an aquatic plant.','Control temperature, carbon dioxide availability and plant size.','Calculate rate and evaluate measurement of oxygen production.'],'Required practical 6: investigate the effect of light intensity on photosynthesis rate.'),
        L('Uses of glucose in plants','4.4.1.3','Uses of glucose from photosynthesis','combined','all',['Explain use of glucose in respiration.','Explain conversion to starch, fats/oils and cellulose.','Explain use with nitrate ions to make amino acids and proteins.'])
      ]},
      {ref:'4.4.2',title:'Respiration',lessons:[
        L('Aerobic respiration','4.4.2.1','Aerobic and anaerobic respiration','combined','all',['Describe respiration as an exothermic cellular process.','Write the aerobic respiration word equation and recognise symbols.','Explain uses of transferred energy in living organisms.']),
        L('Anaerobic respiration in animals','4.4.2.1','Aerobic and anaerobic respiration','combined','all',['Explain anaerobic respiration in muscles when oxygen supply is insufficient.','Explain incomplete glucose breakdown and lower energy transfer.','Relate lactic acid accumulation to muscle fatigue.']),
        L('Anaerobic respiration in plants and yeast','4.4.2.1','Aerobic and anaerobic respiration','combined','all',['Write the yeast/plant anaerobic respiration word equation.','Explain fermentation and its economic uses.','Compare products with muscle anaerobic respiration.']),
        L('Exercise, oxygen debt and recovery','4.4.2.2','Response to exercise','combined','all',['Explain increased heart rate, breathing rate and breath volume during exercise.','Explain oxygen debt and lactic acid accumulation.','Higher Tier: explain transport of lactic acid to liver and conversion back to glucose.']),
        L('Metabolism and synthesis of molecules','4.4.2.3','Metabolism','combined','all',['Define metabolism as the sum of cell/body reactions.','Link respiration energy to enzyme-controlled synthesis and breakdown.','Connect glucose, amino acids, fatty acids, glycerol and urea across metabolic pathways.'])
      ]}
    ]},

    b5:{spec:'4.5',title:'Homeostasis and response',paper:2,sections:[
      {ref:'4.5.1',title:'Homeostasis',lessons:[
        L('Homeostasis and control systems','4.5.1','Homeostasis','combined','all',['Define homeostasis as regulation of internal conditions.','Explain why enzyme and cell function need stable conditions.','Identify receptors, coordination centres and effectors in control systems.']),
        L('Negative feedback as a control principle','4.5.1','Homeostasis','combined','all',['Explain detecting deviation from an optimum and producing corrective responses.','Apply the receptor-centre-effector sequence.','Compare nervous and chemical responses.'])
      ]},
      {ref:'4.5.2',title:'The human nervous system',lessons:[
        L('Nervous system organisation','4.5.2.1','Structure and function','combined','all',['Explain flow of information from receptors to CNS and effectors.','Identify brain and spinal cord as CNS.','Link neurone structure and electrical impulses to rapid responses.']),
        L('Reflex arcs and synapses','4.5.2.1','Structure and function','combined','all',['Sequence sensory neurone, synapse, relay neurone and motor neurone.','Explain why reflexes are rapid and automatic.','Apply reflex-arc reasoning to unfamiliar stimuli.']),
        L('Required practical: reaction time','4.5.2.1','Structure and function','combined','all',['Plan and carry out an investigation into a factor affecting reaction time.','Use repeats, means and control variables appropriately.','Evaluate reliability and human variation.'],'Required practical 7: investigate the effect of a factor on human reaction time.'),
        L('The brain: regions and functions','4.5.2.2','The brain','triple','all',['Identify cerebral cortex, cerebellum and medulla.','Describe major functions of each region.','Use evidence from damage or stimulation studies.']),
        L('Investigating the brain','4.5.2.2','The brain','triple','higher',['Explain mapping using damaged patients, electrical stimulation and MRI.','Explain why brain research and treatment are difficult.','Evaluate benefits and risks of neurological procedures.']),
        L('Eye structure and function','4.5.2.3','The eye','triple','all',['Identify retina, optic nerve, sclera, cornea, iris, ciliary muscles and suspensory ligaments.','Relate eye structures to light detection and focusing.','Explain adaptation to dim light in outline.']),
        L('Accommodation','4.5.2.3','The eye','triple','all',['Explain near focus using ciliary contraction, slack ligaments and thick lens.','Explain distant focus using relaxed ciliary muscles, taut ligaments and thin lens.','Trace how refraction changes.']),
        L('Myopia, hyperopia and correction','4.5.2.3','The eye','triple','all',['Interpret ray diagrams for short- and long-sightedness.','Explain spectacle-lens correction.','Compare correction technologies in context.']),
        L('Thermoregulation','4.5.2.4','Control of body temperature','triple','all',['Explain roles of thermoregulatory centre and skin/blood temperature receptors.','Describe sweating, vasodilation, vasoconstriction and shivering.','Higher Tier: explain how responses alter heat transfer.'])
      ]},
      {ref:'4.5.3',title:'Hormonal coordination in humans',lessons:[
        L('The endocrine system','4.5.3.1','Human endocrine system','combined','all',['Explain hormones as chemicals secreted into blood by glands.','Compare slower, longer-lasting hormonal responses with nervous responses.','Identify pituitary, pancreas, thyroid, adrenal glands, ovaries and testes.']),
        L('Insulin and blood glucose','4.5.3.2','Control of blood glucose concentration','combined','all',['Explain detection and correction of high blood glucose.','Explain insulin-driven uptake and glycogen storage.','Interpret blood-glucose graphs.']),
        L('Type 1 and Type 2 diabetes','4.5.3.2','Control of blood glucose concentration','combined','all',['Compare causes and treatments of Type 1 and Type 2 diabetes.','Explain obesity as a risk factor for Type 2 diabetes without treating it as the sole cause.','Evaluate treatment information.']),
        L('Glucagon and negative feedback','4.5.3.2','Control of blood glucose concentration','combined','higher',['Explain glucagon response when blood glucose is low.','Explain conversion of glycogen to glucose.','Explain interaction of insulin and glucagon as negative feedback.']),
        L('Water balance, osmosis and excretion','4.5.3.3','Maintaining water and nitrogen balance','triple','all',['Explain water and ion losses through lungs, skin and kidneys.','Explain osmotic consequences when body fluids are too concentrated or dilute.','Describe kidney role in removing excess water, ions and urea.']),
        L('Kidney filtration and selective reabsorption','4.5.3.3','Maintaining water and nitrogen balance','triple','all',['Describe filtration of blood and selective reabsorption of useful substances.','Interpret before/after filtration data.','Explain urine composition from filtration and reabsorption.']),
        L('Deamination and urea formation','4.5.3.3','Maintaining water and nitrogen balance','triple','higher',['Explain removal of amino groups from excess amino acids in the liver.','Explain formation of toxic ammonia and conversion to urea.','Link protein metabolism to excretion.']),
        L('ADH and water balance','4.5.3.3','Maintaining water and nitrogen balance','triple','higher',['Explain ADH release when blood is too concentrated.','Explain increased kidney-tubule permeability and water reabsorption.','Explain ADH regulation by negative feedback.']),
        L('Kidney failure, dialysis and transplant','4.5.3.3','Maintaining water and nitrogen balance','triple','all',['Describe basic principles of dialysis.','Compare dialysis with kidney transplantation.','Evaluate advantages, disadvantages and practical constraints.']),
        L('Reproductive hormones and puberty','4.5.3.4','Hormones in human reproduction','combined','all',['Explain roles of oestrogen and testosterone in puberty and reproduction.','Explain ovulation and sperm production.','Distinguish glands and target effects.']),
        L('FSH, LH, oestrogen and progesterone','4.5.3.4','Hormones in human reproduction','combined','all',['Recall core roles of FSH, LH, oestrogen and progesterone.','Higher Tier: explain interactions controlling the menstrual cycle.','Interpret hormone-level graphs.']),
        L('Hormonal and non-hormonal contraception','4.5.3.5','Contraception','combined','all',['Describe major contraception methods in the specification.','Explain how hormonal methods influence egg maturation or release.','Evaluate effectiveness, side effects and non-scientific considerations from given evidence.']),
        L('Fertility treatment and IVF','4.5.3.6','Hormones to treat infertility','combined','higher',['Explain use of FSH/LH fertility drugs.','Sequence key stages of IVF.','Evaluate success, stress, multiple-birth risk and ethical issues.']),
        L('Adrenaline and fight-or-flight','4.5.3.7','Feedback systems','combined','higher',['Explain adrenal release of adrenaline during fear or stress.','Explain increased heart rate and delivery of oxygen/glucose to muscles and brain.','Apply response to an unfamiliar scenario.']),
        L('Thyroxine and negative feedback','4.5.3.7','Feedback systems','combined','higher',['Explain thyroxine role in basal metabolic rate, growth and development.','Explain thyroxine control by negative feedback.','Interpret simple feedback diagrams.'])
      ]},
      {ref:'4.5.4',title:'Plant hormones (Biology only)',lessons:[
        L('Auxin and plant tropisms','4.5.4.1','Control and coordination','triple','all',['Explain phototropism and gravitropism through unequal auxin distribution and growth.','Compare root and shoot responses.','Use diagrams to predict growth direction.']),
        L('Gibberellins and ethene','4.5.4.1','Control and coordination','triple','higher',['Explain gibberellins in seed germination and ethene in fruit ripening at the required level.','Recognise that detailed molecular mechanisms are not required.','Apply hormonal control to horticulture.']),
        L('Required practical: plant responses','4.5.4.1','Control and coordination','triple','all',['Investigate effects of light or gravity on seedling growth.','Record length data and labelled biological drawings.','Control growth conditions and evaluate variability.'],'Required practical 8 (Biology only): investigate light or gravity on seedling growth.'),
        L('Uses of plant hormones','4.5.4.2','Use of plant hormones','triple','higher',['Explain uses of auxins as weedkillers, rooting powders and tissue-culture aids.','Explain ethene control of fruit ripening.','Explain gibberellin uses in dormancy, flowering and fruit size.'])
      ]}
    ]},

    b6:{spec:'4.6',title:'Inheritance, variation and evolution',paper:2,sections:[
      {ref:'4.6.1',title:'Reproduction',lessons:[
        L('Sexual reproduction','4.6.1.1','Sexual and asexual reproduction','combined','all',['Explain fusion of male and female gametes.','Explain mixing of genetic information and resulting variation.','Identify animal and flowering-plant gametes.']),
        L('Asexual reproduction and clones','4.6.1.1','Sexual and asexual reproduction','combined','all',['Explain reproduction from one parent with no gamete fusion.','Explain genetically identical offspring through mitosis.','Compare asexual with sexual reproduction.']),
        L('Meiosis and gamete formation','4.6.1.2','Meiosis','combined','all',['Explain chromosome-number halving and formation of four non-identical gametes.','Explain why two cell divisions occur after DNA replication.','Explain restoration of chromosome number at fertilisation.']),
        L('Sexual versus asexual reproduction','4.6.1.3','Advantages and disadvantages of sexual and asexual reproduction','triple','all',['Compare variation, speed, mate requirement and colonisation benefits.','Apply advantages/disadvantages to unfamiliar organisms.','Link variation to changing environments and selective breeding.']),
        L('DNA, genes, chromosomes and the genome','4.6.1.4','DNA and the genome','combined','all',['Describe DNA as a polymer forming a double helix.','Define gene, chromosome and genome.','Explain that genes code for amino-acid sequences that make proteins.']),
        L('DNA structure and nucleotides','4.6.1.5','DNA structure','triple','all',['Describe DNA as two strands forming a double helix.','Describe nucleotides using sugar, phosphate and base components at required level.','Relate base sequence to protein coding.']),
        L('Protein synthesis: transcription and translation','4.6.1.5','DNA structure','triple','higher',['Explain transcription from DNA to a complementary template molecule.','Explain translation at ribosomes using amino acids.','Link base order to amino-acid sequence and protein structure.']),
        L('Gene expression and mutations','4.6.1.5','DNA structure','triple','higher',['Explain how DNA mutations may alter protein structure or expression.','Explain why many mutations have little or no phenotypic effect.','Apply mutation consequences to unfamiliar examples.']),
        L('Genetic inheritance vocabulary','4.6.1.6','Genetic inheritance','combined','all',['Define allele, dominant, recessive, homozygous, heterozygous, genotype and phenotype.','Use symbols consistently in genetic crosses.','Distinguish genotype from phenotype.']),
        L('Monohybrid genetic crosses and probabilities','4.6.1.6','Genetic inheritance','combined','all',['Construct Punnett squares.','Calculate offspring genotype/phenotype probabilities and ratios.','Explain why probability does not guarantee outcomes in small families.']),
        L('Inherited disorders and embryo screening','4.6.1.7','Inherited disorders','combined','all',['Explain dominant polydactyly and recessive cystic fibrosis inheritance.','Use genetic crosses to calculate risk.','Evaluate embryo screening using scientific, social and ethical evidence.']),
        L('Sex determination','4.6.1.8','Sex determination','combined','all',['Explain XX and XY sex chromosomes.','Construct a genetic cross for sex inheritance.','Use direct proportion and simple ratios.'])
      ]},
      {ref:'4.6.2',title:'Variation and evolution',lessons:[
        L('Genetic and environmental variation','4.6.2.1','Variation','combined','all',['Distinguish genetic, environmental and combined causes of variation.','Explain genome-environment interaction in phenotype development.','Interpret variation data.']),
        L('Mutations and new variants','4.6.2.1','Variation','combined','all',['Explain mutations as sources of genetic variants.','Recognise that most mutations have no effect, some affect phenotype and few determine phenotype.','Explain how a beneficial phenotype may spread after environmental change.']),
        L('Evolution by natural selection','4.6.2.2','Evolution','combined','all',['Explain inherited variation, selection pressure, differential survival/reproduction and population change.','Define evolution as change in inherited characteristics over time.','Avoid implying organisms change because they need to.']),
        L('Formation of new species','4.6.2.2','Evolution','combined','all',['Explain how populations can become sufficiently different that they no longer interbreed to produce fertile offspring.','Link accumulated inherited differences to species formation.','Apply the idea to a given population scenario.']),
        L('Selective breeding','4.6.2.3','Selective breeding','combined','all',['Sequence selection of desired parents and repeated breeding.','Explain uses in food plants and domesticated animals.','Evaluate risks including reduced genetic variation and inherited defects.']),
        L('Genetic engineering principles','4.6.2.4','Genetic engineering','combined','all',['Explain transfer of a useful gene into another organism.','Give specified application examples including crops and microorganisms.','Evaluate benefits and concerns from evidence.']),
        L('Genetic engineering process','4.6.2.4','Genetic engineering','combined','higher',['Describe isolation of a useful gene and use of vectors such as plasmids/viruses.','Explain insertion into target cells and selection of modified organisms.','Apply the process to a novel example.'])
      ]},
      {ref:'4.6.3',title:'Development of understanding of genetics and evolution',lessons:[
        L('Darwin and natural selection','4.6.3.1','Theory of evolution','triple','all',['Explain Darwin’s observations and proposed mechanism.','Explain why the theory was controversial initially.','Recognise contributions of evidence from geology and fossils.']),
        L('Speciation','4.6.3.2','Speciation','triple','all',['Explain isolation followed by different selection pressures.','Explain accumulation of genetic differences.','Explain reproductive isolation as the final criterion.']),
        L('Mendel and the development of genetics','4.6.3.3','The understanding of genetics','triple','all',['Explain how Mendel’s work suggested inherited units.','Explain why his ideas were not immediately accepted.','Link later chromosome and DNA evidence to gene theory.']),
        L('Evidence for evolution','4.6.3.4','Evidence for evolution','combined','all',['Use genes, fossils and antibiotic resistance as evidence supporting evolution.','Distinguish evidence from the theory it supports.','Interpret evidence in unfamiliar contexts.']),
        L('Fossil formation and the fossil record','4.6.3.5','Fossils','combined','all',['Explain preservation, mineral replacement and trace fossils.','Explain why early soft-bodied life left an incomplete record.','Use fossils to infer evolutionary change.']),
        L('Extinction','4.6.3.6','Extinction','combined','all',['Define extinction.','Explain environmental, competitive, disease and catastrophic contributors.','Apply extinction factors to a species scenario.']),
        L('Antibiotic-resistant bacteria','4.6.3.7','Resistant bacteria','combined','all',['Explain random mutation and selection of resistant bacteria.','Explain how inappropriate antibiotic use increases selection pressure.','Explain why completing courses and restricting use can slow resistance.'])
      ]},
      {ref:'4.6.4',title:'Classification of living organisms',lessons:[
        L('Linnaean classification and binomial naming','4.6.4','Classification of living organisms','combined','all',['Order kingdom, phylum, class, order, family, genus and species.','Explain binomial naming.','Use classification information in unfamiliar examples.']),
        L('Three-domain system and modern classification','4.6.4','Classification of living organisms','combined','all',['Explain how microscopy, biochemistry and genetic evidence changed classification.','Describe the three-domain system: Archaea, Bacteria and Eukaryota.','Interpret evolutionary trees.'])
      ]}
    ]},

    b7:{spec:'4.7',title:'Ecology',paper:2,sections:[
      {ref:'4.7.1',title:'Adaptations, interdependence and competition',lessons:[
        L('Communities, ecosystems and interdependence','4.7.1.1','Communities','combined','all',['Describe organism, population, community and ecosystem levels.','Explain interdependence for food, shelter, pollination and seed dispersal.','Explain how removing one species can affect a whole community.']),
        L('Competition in plants and animals','4.7.1.1','Communities','combined','all',['Explain plant competition for light, space, water and mineral ions.','Explain animal competition for food, mates and territory.','Apply competition ideas to unfamiliar habitats.']),
        L('Stable communities','4.7.1.1','Communities','combined','all',['Explain dynamic balance in a stable community.','Use population data to infer changes in interdependence.','Avoid assuming stable means completely unchanging.']),
        L('Abiotic factors','4.7.1.2','Abiotic factors','combined','all',['Explain effects of light, temperature, moisture, soil pH/minerals, wind and gas levels.','Interpret graphs and tables showing abiotic effects.','Predict consequences of changing abiotic conditions.']),
        L('Biotic factors','4.7.1.3','Biotic factors','combined','all',['Explain effects of food availability, predators, pathogens and competition.','Interpret population data involving biotic change.','Explain direct and indirect community effects.']),
        L('Structural, behavioural and functional adaptations','4.7.1.4','Adaptations','combined','all',['Classify adaptations as structural, behavioural or functional.','Explain how adaptations improve survival/reproduction in a given environment.','Apply knowledge to unfamiliar organisms.']),
        L('Extremophiles','4.7.1.4','Adaptations','combined','all',['Define extremophiles.','Relate adaptations to extreme temperature, pressure or salt conditions.','Use deep-sea bacteria as an example without overgeneralising.'])
      ]},
      {ref:'4.7.2',title:'Organisation of an ecosystem',lessons:[
        L('Food chains, producers and consumers','4.7.2.1','Levels of organisation','combined','all',['Explain producers as photosynthetic biomass sources.','Construct food chains from data.','Identify primary, secondary and tertiary consumers.']),
        L('Predator-prey cycles','4.7.2.1','Levels of organisation','combined','all',['Interpret predator-prey population graphs.','Explain time lags between prey and predator changes.','Avoid assuming one factor alone controls population size.']),
        L('Quadrats, transects and ecological sampling','4.7.2.1','Levels of organisation','combined','all',['Choose random quadrats for abundance and transects for change across gradients.','Calculate means and estimate population size.','Explain how sample size and randomisation reduce uncertainty and bias.']),
        L('Required practical: field sampling','4.7.2.1','Levels of organisation','combined','all',['Measure abundance and investigate distribution in a habitat.','Use quadrats/transects, random sampling and environmental measurements.','Process data using means and appropriate graphs.'],'Required practical 9: investigate population size and distribution using sampling techniques.'),
        L('The carbon cycle','4.7.2.2','How materials are cycled','combined','all',['Explain photosynthesis, feeding, respiration, death and decomposition in carbon cycling.','Explain microorganism roles in returning carbon dioxide.','Interpret carbon-cycle diagrams.']),
        L('The water cycle and material recycling','4.7.2.2','How materials are cycled','combined','all',['Explain evaporation, condensation, precipitation and movement through organisms.','Explain why materials must be recycled for future organisms.','Recognise that the nitrogen cycle is not required here.']),
        L('Factors affecting decomposition','4.7.2.3','Decomposition','triple','all',['Explain effects of temperature, water and oxygen availability on decay.','Link decomposer activity to enzyme-controlled reactions.','Calculate and interpret decay rates.']),
        L('Composting and biogas','4.7.2.3','Decomposition','triple','all',['Explain how gardeners/farmers optimise decay for compost.','Explain anaerobic decay and methane production.','Evaluate conditions in biogas generators.']),
        L('Required practical: temperature and decay','4.7.2.3','Decomposition','triple','all',['Investigate effect of temperature on milk decay using pH change.','Control starting conditions and measurement intervals.','Plot and interpret pH/time data.'],'Required practical 10 (Biology only): investigate temperature and decay using milk pH.'),
        L('Environmental change and species distribution','4.7.2.4','Impact of environmental change','triple','higher',['Evaluate effects of temperature, water availability and atmospheric gases on distributions.','Distinguish seasonal, geographic and human-caused changes.','Use evidence to justify conclusions.'])
      ]},
      {ref:'4.7.3',title:'Biodiversity and human interaction',lessons:[
        L('Biodiversity and ecosystem stability','4.7.3.1','Biodiversity','combined','all',['Define biodiversity at global and ecosystem scales.','Explain why biodiversity can increase ecosystem stability.','Explain dependence of humans on functioning ecosystems.']),
        L('Waste management and pollution','4.7.3.2','Waste management','combined','all',['Explain water, air and land pollution sources.','Explain how pollution can reduce biodiversity.','Evaluate waste-management approaches using evidence.']),
        L('Land use and peat bogs','4.7.3.3','Land use','combined','all',['Explain how building, quarrying, farming and landfill reduce habitat area.','Explain biodiversity and carbon consequences of peat destruction.','Evaluate conflicts between resource use and habitat conservation.']),
        L('Deforestation','4.7.3.4','Deforestation','combined','all',['Explain drivers including cattle/rice farming and biofuel crops.','Explain biodiversity and carbon-cycle consequences.','Evaluate environmental trade-offs.']),
        L('Global warming: biological consequences','4.7.3.5','Global warming','combined','all',['Describe biological consequences of rising temperatures.','Link carbon dioxide and methane increases to warming in context.','Evaluate evidence and acknowledge uncertainty appropriately.']),
        L('Maintaining biodiversity','4.7.3.6','Maintaining biodiversity','combined','all',['Explain breeding programmes, habitat protection, field margins and recycling.','Explain reducing deforestation and emissions as conservation measures.','Evaluate competing economic and environmental pressures.'])
      ]},
      {ref:'4.7.4',title:'Trophic levels in an ecosystem (Biology only)',lessons:[
        L('Trophic levels and decomposers','4.7.4.1','Trophic levels','triple','all',['Identify producers, primary/secondary/tertiary consumers and apex predators.','Explain decomposer feeding by extracellular enzyme secretion and absorption.','Assign organisms to trophic levels from a food web.']),
        L('Pyramids of biomass','4.7.4.2','Pyramids of biomass','triple','all',['Construct biomass pyramids from data.','Place producers at the base and compare trophic biomass.','Interpret unusual data carefully.']),
        L('Biomass losses between trophic levels','4.7.4.3','Transfer of biomass','triple','all',['Explain losses through uneaten material, egestion, excretion and respiration.','Explain why less biomass is available at higher trophic levels.','Relate glucose use in respiration to biomass loss.']),
        L('Efficiency of biomass transfer','4.7.4.3','Transfer of biomass','triple','all',['Calculate percentage or fractional biomass-transfer efficiency.','Use efficiency to explain limited trophic-chain length.','Interpret biomass data quantitatively.'])
      ]},
      {ref:'4.7.5',title:'Food production (Biology only)',lessons:[
        L('Food security','4.7.5.1','Factors affecting food security','triple','all',['Define food security.','Explain effects of population growth, changing diets, pests/pathogens, climate, input costs and conflict.','Interpret population/food-production statistics.']),
        L('Intensive farming and energy transfer','4.7.5.2','Farming techniques','triple','all',['Explain how limiting movement and controlling temperature can improve food-production efficiency.','Explain use of high-protein feed.','Evaluate productivity against animal-welfare and ethical concerns.']),
        L('Sustainable fisheries','4.7.5.3','Sustainable fisheries','triple','all',['Explain why fish stocks must remain high enough for reproduction.','Explain effects of net size and quotas.','Evaluate fisheries-management strategies.']),
        L('Mycoprotein production','4.7.5.4','Role of biotechnology','triple','all',['Explain aerobic culture of Fusarium on glucose syrup.','Explain harvesting and purification of biomass.','Relate biotechnology to food security.']),
        L('Biotechnology, insulin and GM crops','4.7.5.4','Role of biotechnology','triple','all',['Explain microbial production of human insulin.','Explain potential food-security roles of GM crops.','Evaluate benefits and concerns in a given biotechnology context.'])
      ]}
    ]}
  };

  const lessonLookup={};
  Object.entries(biology).forEach(([topicId,spec])=>{
    const topic=data.topics.find(t=>t.id===topicId); if(!topic) return;
    const flattened=[];
    spec.sections.forEach(section=>section.lessons.forEach(lesson=>{
      lessonLookup[`${topicId}::${lesson.title}`]=lesson;
      flattened.push([lesson.title,lesson.scope]);
    }));
    topic.lessons=flattened;
    topic.specRef=spec.spec;
    topic.specSections=spec.sections.map(s=>({ref:s.ref,title:s.title}));
    topic.summary=`AQA GCSE Biology ${spec.spec}: ${spec.sections.map(s=>s.title).join('; ')}.`;
  });

  window.GCSE_BIOLOGY_SPEC_DETAIL={
    specification:'AQA GCSE Biology 8461',
    paper1:['b1','b2','b3','b4'],
    paper2:['b5','b6','b7'],
    keyIdeas:'4.8',
    topics:biology,
    lessonLookup,
    getLesson(topicId,title){return lessonLookup[`${topicId}::${title}`]||null;}
  };
})();