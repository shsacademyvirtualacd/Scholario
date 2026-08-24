// ─────────────────────────────────────────────────────────────────────────────
// FBISE Grade 9 Authoritative Curriculum Specification & Chapter Definitions
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for Grade 9 FBISE subjects, chapters, sub-topics,
// and curriculum validation rules.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChapterDef {
  id: string;
  number: number;
  chapterNumber?: number;
  name: string;
  category?: 'Nasr' | 'Nazm' | 'Ghazal' | 'Core';
  subtopics?: string[];
  description?: string;
}

export interface FBISEGrade9SubjectCurriculum {
  subject: string;
  aliases: string[];
  chapters: ChapterDef[];
  guidelines: string;
}

export const FBISE_GRADE_10_CURRICULUM: Record<string, FBISEGrade9SubjectCurriculum> = {
  Physics: {
    subject: 'Physics',
    aliases: ['physics', 'phy'],
    guidelines: 'Focus on conceptual and numerical problems, formulas ($T=2\\pi\\sqrt{l/g}$, $v=f\\lambda$, $F=k\\frac{q_1q_2}{r^2}$, $V=IR$, $P=VI$, $\\frac{1}{f}=\\frac{1}{p}+\\frac{1}{q}$, $E=mc^2$, $N=N_0(1/2)^n$), ray diagrams, circuits, logic gates, and radioactivity strictly for Grade 10 FBISE & Sindh.',
    chapters: [
      { id: 'phy10_ch1', number: 10, name: 'Simple Harmonic Motion and Waves', subtopics: ['Simple Harmonic Motion (SHM)', 'Mass-spring system and Restoring force', 'Simple Pendulum ($T=2\\pi\\sqrt{l/g}$)', 'Damped Oscillations', 'Wave motion (Longitudinal vs Transverse)', 'Wave equation ($v=f\\lambda$)', 'Ripple tank (Reflection, Refraction, Diffraction)'] },
      { id: 'phy10_ch2', number: 11, name: 'Sound', subtopics: ['Sound Waves and Nature of Sound', 'Speed of Sound in various media', 'Characteristics of Sound (Loudness, Pitch, Quality/Timbre)', 'Sound Intensity and Decibel scale ($\\beta = 10\\log(I/I_0)$)', 'Reflection of sound (Echo)', 'Audible frequency range ($20\\text{ Hz} - 20\\text{ kHz}$)', 'Ultrasound and Applications in medicine/industry'] },
      { id: 'phy10_ch3', number: 12, name: 'Geometrical Optics', subtopics: ['Reflection of Light and Laws of Reflection', 'Spherical mirrors (Concave and Convex mirrors)', 'Mirror Formula ($\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{q}$)', 'Refraction of Light and Snell’s Law ($n = \\frac{\\sin i}{\\sin r}$)', 'Total Internal Reflection and Critical Angle', 'Lenses (Convex and Concave lens)', 'Lens formula and Power of lens ($P=1/f$)', 'Optical instruments (Simple Microscope, Compound Microscope, Astronomical Telescope)', 'Defects of vision (Myopia and Hypermetropia)'] },
      { id: 'phy10_ch4', number: 13, name: 'Electrostatics', subtopics: ['Production of electric charge by friction', 'Electrostatic induction and Gold leaf electroscope', 'Coulomb’s Law ($F = k\\frac{q_1 q_2}{r^2}$)', 'Electric Field and Electric Field Intensity ($E = F/q$)', 'Electric Potential ($V = W/q$)', 'Capacitors and Capacitance ($C = Q/V$)', 'Combinations of capacitors (Series and Parallel)', 'Uses of capacitors and Electrostatic hazards/applications (Photocopier, Paint spray)'] },
      { id: 'phy10_ch5', number: 14, name: 'Current Electricity', subtopics: ['Electric Current ($I = Q/t$)', 'Potential Difference and Electromotive Force (EMF)', 'Ohm’s Law ($V = IR$)', 'Ohmic and Non-ohmic conductors', 'Factors affecting Resistance and Specific Resistance ($R = \\rho L/A$)', 'Series and Parallel combinations of Resistors', 'Electrical energy and Joule’s Law ($W = I^2 Rt$)', 'Electric Power ($P = VI = I^2 R = V^2/R$)', 'Kilowatt-hour (kWh)', 'Hazards of electricity and Safety devices (Fuse, Circuit Breaker, Earth wire)'] },
      { id: 'phy10_ch6', number: 15, name: 'Electromagnetism', subtopics: ['Magnetic effect of a steady current and Right-hand grip rule', 'Force on a current-carrying conductor in a magnetic field ($F = ILB\\sin\\theta$)', 'Fleming’s Left-Hand Rule and DC Motor', 'Electromagnetic Induction', 'Faraday’s Law and Lenz’s Law', 'AC Generator', 'Mutual Induction and Transformers ($\\frac{V_s}{V_p} = \\frac{N_s}{N_p} = \\frac{I_p}{I_s}$)'] },
      { id: 'phy10_ch7', number: 16, name: 'Basic Electronics', subtopics: ['Thermionic Emission', 'Cathode Rays and properties of electrons', 'Cathode-Ray Oscilloscope (CRO)', 'Analogue and Digital Electronics', 'Logic Gates (AND, OR, NOT, NAND, NOR) and Truth Tables', 'Applications of logic gates (Burglar alarm, fire alarm)'] },
      { id: 'phy10_ch8', number: 17, name: 'Information and Communication Technology (ICT)', subtopics: ['Components of ICT', 'Transmission of electrical signals through wires', 'Transmission of light signals through Optical Fibers', 'Transmission of radio waves through space', 'Information storage devices (Hard disk, Optical disc, Flash drive)', 'Applications of ICT (Computer, Internet, Email, Cellular phone)'] },
      { id: 'phy10_ch9', number: 18, name: 'Atomic & Nuclear Physics', subtopics: ['Atom and Atomic Nucleus (Atomic number $Z$, Mass number $A$, Nucleons)', 'Isotopes and Isotopes of Hydrogen/Carbon', 'Natural Radioactivity and Background Radiation', 'Alpha ($\\alpha$), Beta ($\\beta$), and Gamma ($\\gamma$) radiation properties', 'Nuclear Transmutation and Decay Equations', 'Half-life of radioactive elements ($N = N_0(1/2)^n$)', 'Radioisotopes and uses in medicine, agriculture, and carbon dating', 'Nuclear Fission and Nuclear Fusion', 'Einstein’s Mass-Energy equation ($E = mc^2$)', 'Radiation Hazards and Safety precautions'] },
    ],
  },
  Chemistry: {
    subject: 'Chemistry',
    aliases: ['chemistry', 'chem'],
    guidelines: 'Focus on chemical equilibria ($K_c$), pH/pOH calculations, organic functional groups, hydrocarbons, biochemical molecules, and industrial processes strictly for Grade 10 FBISE & Sindh.',
    chapters: [
      { id: 'chem10_ch1', number: 9, name: 'Chemical Equilibrium', subtopics: ['Reversible reactions and Dynamic Equilibrium', 'Law of Mass Action and equilibrium constant ($K_c$)', 'Derivation of $K_c$ for general reactions', 'Importance and units of Equilibrium Constant', 'Le Chatelier’s principle'] },
      { id: 'chem10_ch2', number: 10, name: 'Acids, Bases, and Salts', subtopics: ['Arrhenius, Bronsted-Lowry, and Lewis concepts of acids and bases', 'Self-ionization of water and $K_w$', 'pH and pOH scale ($pH = -\\log[H^+]$)', 'Indicators and pH measurement', 'Neutralization reaction', 'Preparation and classification of salts (Normal, Acidic, Basic)'] },
      { id: 'chem10_ch3', number: 11, name: 'Organic Chemistry', subtopics: ['Origin and characteristics of organic compounds', 'Diversity of organic compounds (Catenation, Isomerism)', 'Structural formulas, condensed formulas, and dot-cross formulas', 'Classification of organic compounds (Open-chain, Closed-chain/Cyclic)', 'Functional groups (Alcohols, Ethers, Aldehydes, Ketones, Carboxylic acids, Esters, Amines)'] },
      { id: 'chem10_ch4', number: 12, name: 'Hydrocarbons', subtopics: ['Classification of Hydrocarbons', 'Alkanes (Preparation, Combustion, Halogenation substitution)', 'Alkenes (Preparation, Addition of halogen, hydrogenation, oxidation with $\\text{KMnO}_4$)', 'Alkynes (Preparation, Addition reactions)', 'Industrial uses of methane, ethene, and ethyne'] },
      { id: 'chem10_ch5', number: 13, name: 'Biochemistry', subtopics: ['Carbohydrates (Monosaccharides, Disaccharides, Polysaccharides) and photosynthesis', 'Proteins and Amino acids as building blocks', 'Lipids, Fatty acids, and Oils vs Fats', 'Nucleic Acids (DNA and RNA structure)', 'Vitamins (Fat-soluble vs Water-soluble) and deficiencies'] },
      { id: 'chem10_ch6', number: 14, name: 'Environmental Chemistry I: The Atmosphere', subtopics: ['Layers of Atmosphere (Troposphere, Stratosphere)', 'Major air pollutants ($\\text{CO}, \\text{SO}_2, \\text{NO}_x$, Lead)', 'Greenhouse effect and Global Warming', 'Acid rain causes, reactions, and destructive effects', 'Ozone layer depletion by CFCs'] },
      { id: 'chem10_ch7', number: 15, name: 'Environmental Chemistry II: Water', subtopics: ['Properties of water and hydrogen bonding', 'Soft and Hard water', 'Temporary and Permanent hardness of water', 'Methods of removing temporary and permanent hardness (Boiling, Clark’s method, Washing soda, Ion exchange)', 'Waterborne infectious diseases'] },
      { id: 'chem10_ch8', number: 16, name: 'Chemical Industries', subtopics: ['Basic metallurgical operations (Crushing, Concentration, Roasting, Smelting, Bessemerization)', 'Extraction of Copper', 'Manufacture of Sodium Carbonate by Solvay’s Process', 'Manufacture of Urea (Reactions and flow sheet diagram)', 'Petroleum refining and fractional distillation'] },
    ],
  },
  Biology: {
    subject: 'Biology',
    aliases: ['biology', 'bio'],
    guidelines: 'Focus on human anatomy, physiological systems, genetic inheritance, biotechnology, and pharmacology strictly for Grade 10 FBISE & Sindh.',
    chapters: [
      { id: 'bio10_ch1', number: 10, name: 'Gaseous Exchange', subtopics: ['Gaseous exchange in plants (Stomata, Lenticels)', 'Human respiratory system (Air passageway, Lungs, Alveoli)', 'Mechanism of breathing (Inhalation vs Exhalation)', 'Respiratory disorders (Bronchitis, Emphysema, Pneumonia, Asthma, Lung Cancer)', 'Effects of smoking on respiratory system'] },
      { id: 'bio10_ch2', number: 11, name: 'Homeostasis', subtopics: ['Homeostasis mechanisms (Osmoregulation, Thermoregulation, Excretion)', 'Homeostasis in plants (Removal of extra water, metabolic wastes)', 'Human urinary system (Kidney structure, Nephron histology and physiology)', 'Urine formation (Filtration, Selective reabsorption, Secretion)', 'Kidney disorders (Kidney stones, Renal failure)', 'Treatments: Lithotripsy, Peritoneal Dialysis, Hemodialysis, Kidney Transplant'] },
      { id: 'bio10_ch3', number: 12, name: 'Coordination and Control', subtopics: ['Types of coordination (Nervous vs Chemical)', 'Neurons (Structure, Sensory, Motor, Interneurons)', 'Human Nervous System (Central: Brain, Spinal Cord; Peripheral: Somatic, Autonomic)', 'Reflex arc', 'Endocrine System (Pituitary, Thyroid, Pancreas, Adrenal, Gonads) and hormones', 'Disorders of nervous system (Paralysis, Epilepsy)'] },
      { id: 'bio10_ch4', number: 13, name: 'Support and Movement', subtopics: ['Human skeleton (Axial skeleton, Appendicular skeleton)', 'Bone and Cartilage histology', 'Types of Joints (Immovable, Slightly movable, Synovial/Movable)', 'Muscles and movement (Antagonistic muscles: Biceps and Triceps)', 'Disorders of skeletal system (Osteoporosis, Arthritis)'] },
      { id: 'bio10_ch5', number: 14, name: 'Reproduction', subtopics: ['Methods of Asexual reproduction (Binary fission, Budding, Spore formation, Vegetative propagation)', 'Sexual reproduction in flowering plants (Pollination, Double fertilization, Seed germination)', 'Sexual reproduction in animals', 'Sexually transmitted diseases (AIDS)'] },
      { id: 'bio10_ch6', number: 15, name: 'Inheritance', subtopics: ['Chromosomes and Genes', 'Structure of DNA and Watson-Crick model', 'Mendel’s Laws of Inheritance (Law of Segregation, Law of Independent Assortment)', 'Co-dominance and Incomplete dominance', 'Variations (Continuous vs Discontinuous) and Natural Selection'] },
      { id: 'bio10_ch7', number: 16, name: 'Man and His Environment', subtopics: ['Ecosystem components (Biotic and Abiotic)', 'Food chains and Food webs', 'Biogeochemical cycles (Carbon cycle, Nitrogen cycle)', 'Interactions in ecosystems (Competition, Predation, Symbiosis: Mutualism, Commensalism, Parasitism)', 'Global environmental problems and Conservation'] },
      { id: 'bio10_ch8', number: 17, name: 'Biotechnology', subtopics: ['Introduction and scope of biotechnology', 'Fermentation and Fermenters (Alcoholic, Lactic acid)', 'Genetic Engineering steps and tools (Restriction enzymes, Plasmids, Recombinant DNA)', 'Achievements of genetic engineering (Insulin, Human growth hormone, Golden rice)', 'Single Cell Protein (SCP)'] },
      { id: 'bio10_ch9', number: 18, name: 'Pharmacology', subtopics: ['Medicinal drugs and sources (Plants, Animals, Microorganisms, Synthetic)', 'Antibiotics and Antibiotic resistance', 'Vaccines and Immunization mechanism', 'Sedatives, Narcotics, Hallucinogens', 'Drug addiction and social problems'] },
    ],
  },
  Mathematics: {
    subject: 'Mathematics',
    aliases: ['mathematics', 'math', 'maths'],
    guidelines: 'Focus on quadratic equations, theory of quadratic roots, variations, trigonometry, statistics, and circle theorems strictly for Grade 10 FBISE & Sindh.',
    chapters: [
      { id: 'math10_ch1', number: 1, name: 'Quadratic Equations', subtopics: ['Standard form of quadratic equation ($ax^2+bx+c=0$)', 'Solution by Factorization', 'Solution by Completing the Square', 'Quadratic Formula ($x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$)', 'Equations reducible to quadratic form'] },
      { id: 'math10_ch2', number: 2, name: 'Theory of Quadratic Equations', subtopics: ['Nature of roots and Discriminant ($\\Delta = b^2-4ac$)', 'Cube roots of unity ($1, \\omega, \\omega^2$) and properties ($1+\\omega+\\omega^2=0, \\omega^3=1$)', 'Relations between roots and coefficients ($\\alpha+\\beta = -b/a, \\alpha\\beta = c/a$)', 'Formation of quadratic equation ($x^2 - S x + P = 0$)', 'Synthetic Division', 'Simultaneous equations involving linear and quadratic equations'] },
      { id: 'math10_ch3', number: 3, name: 'Variations', subtopics: ['Ratio, Proportion, and Fourth/Mean proportional', 'Direct Variation and Inverse Variation', 'Joint Variation', 'Theorems on Proportions (Invertendo, Alternando, Componendo, Dividendo, Componendo-Dividendo)', 'Application problems on variations'] },
      { id: 'math10_ch4', number: 4, name: 'Partial Fractions', subtopics: ['Proper and Improper rational fractions', 'Resolution into partial fractions: non-repeated linear factors', 'Resolution: repeated linear factors', 'Resolution: non-repeated quadratic factors'] },
      { id: 'math10_ch5', number: 5, name: 'Sets and Functions', subtopics: ['Operations on sets (Union, Intersection, Difference, Symmetric difference)', 'De Morgan’s Laws', 'Venn Diagrams', 'Binary Relations and Cartesian product ($A \\times B$)', 'Domain and Range of relations', 'Functions (Injective, Surjective, Bijective)'] },
      { id: 'math10_ch6', number: 6, name: 'Basic Statistics', subtopics: ['Frequency distribution and Cumulative frequency', 'Measures of Central Tendency (Arithmetic Mean, Median, Mode, Geometric Mean, Harmonic Mean)', 'Measures of Dispersion (Range, Variance, Standard Deviation)'] },
      { id: 'math10_ch7', number: 7, name: 'Introduction to Trigonometry', subtopics: ['Measurement of angles (Sexagesimal system vs Radian system, $\\theta = l/r$)', 'Trigonometric ratios ($\\sin, \\cos, \\tan, \\csc, \\sec, \\cot$)', 'Trigonometric identities ($\\sin^2\\theta+\\cos^2\\theta=1, 1+\\tan^2\\theta=\\sec^2\\theta, 1+\\cot^2\\theta=\\csc^2\\theta$)', 'Signs of trigonometric functions in quadrants', 'Angles of elevation and depression'] },
      { id: 'math10_ch8', number: 8, name: 'Practical Geometry – Circles', subtopics: ['Construction of circles and tangents', 'Inscribed, Circumscribed, and Escribed circles to triangles', 'Tangents from an external point to a circle'] },
    ],
  },
};

export const FBISE_GRADE_9_CURRICULUM: Record<string, FBISEGrade9SubjectCurriculum> = {
  Physics: {
    subject: 'Physics',
    aliases: ['physics', 'phy'],
    guidelines: 'Focus on conceptual questions, formulas ($v=u+at$, $F=ma$, $W=Fd$, $P=F/A$, $\\rho=m/V$, $E_k=\\frac{1}{2}mv^2$, $E_p=mgh$), SI units, graphical analysis, numerical problems, physical laws, and definitions strictly for Grade 9 FBISE.',
    chapters: [
      { id: 'phy_ch1', number: 1, name: 'Physical Quantities and Measurement', subtopics: ['Base and Derived quantities', 'SI Units', 'Prefixes', 'Scientific Notation', 'Vernier Calipers & Screw Gauge', 'Measuring Cylinder', 'Significant Figures'] },
      { id: 'phy_ch2', number: 2, name: 'Kinematics', subtopics: ['Rest and Motion', 'Types of Motion', 'Scalar and Vectors', 'Distance and Displacement', 'Speed and Velocity', 'Acceleration', 'Distance-Time & Speed-Time Graphs', 'Equations of Motion', 'Motion under Gravity'] },
      { id: 'phy_ch3', number: 3, name: 'Dynamics – I', subtopics: ['Force and Inertia', 'Newton’s First Law of Motion', 'Newton’s Second Law of Motion ($F=ma$)', 'Mass and Weight', 'Newton’s Third Law of Motion', 'Tension and Acceleration in a String'] },
      { id: 'phy_ch4', number: 4, name: 'Dynamics – II', subtopics: ['Momentum ($p=mv$)', 'Law of Conservation of Momentum', 'Friction and Limiting Friction', 'Rolling Friction vs Sliding Friction', 'Circular Motion and Centripetal Force ($F_c=\\frac{mv^2}{r}$)', 'Centrifugal Effect'] },
      { id: 'phy_ch5', number: 5, name: 'Pressure and Deformation in Solids', subtopics: ['Pressure ($P=F/A$)', 'Atmospheric Pressure and Barometer', 'Pressure in Liquids ($P=\\rho gh$)', 'Pascal’s Principle and Hydraulic Lift', 'Archimedes Principle and Upthrust', 'Hooke’s Law and Elastic Limit', 'Young’s Modulus'] },
      { id: 'phy_ch6', number: 6, name: 'Work and Energy', subtopics: ['Work ($W=Fs\\cos\\theta$)', 'Kinetic Energy ($E_k=\\frac{1}{2}mv^2$)', 'Potential Energy ($E_p=mgh$)', 'Forms and Interconversion of Energy', 'Law of Conservation of Energy', 'Efficiency ($E = \\frac{\\text{Output}}{\\text{Input}} \\times 100\\%$)', 'Power ($P=W/t$) and Watts'] },
      { id: 'phy_ch7', number: 7, name: 'Density and Temperature', subtopics: ['Density of Solids and Liquids', 'Thermal Equilibrium', 'Temperature and Heat', 'Thermometric Scales (Celsius, Fahrenheit, Kelvin)', 'Thermal Expansion of Solids', 'Specific Heat Capacity ($Q=mc\\Delta T$)', 'Latent Heat of Fusion and Vaporization'] },
      { id: 'phy_ch8', number: 8, name: 'Magnetism', subtopics: ['Magnetic Materials and Non-magnetic Materials', 'Magnetic Poles and Fields', 'Magnetic Field Lines', 'Electromagnetism Basics', 'Induced Magnetism', 'Magnetic Screening and Uses of Magnets'] },
      { id: 'phy_ch9', number: 9, name: 'Nature of Science and Physics', subtopics: ['Scientific Method in Physics', 'Role of Physics in Technology & Society', 'Measurement Uncertainties and Safety', 'Historical Contributions of Muslim Scientists (Ibn al-Haytham, Al-Biruni)'] },
    ],
  },
  Chemistry: {
    subject: 'Chemistry',
    aliases: ['chemistry', 'chem'],
    guidelines: 'Use atomic/molecular concepts, chemical equations, valency, formulas, calculations (moles, molar mass), reaction mechanisms, structures, experiments, and separation techniques strictly according to Grade 9 FBISE.',
    chapters: [
      { id: 'chem_ch1', number: 1, name: 'Nature of Science in Chemistry', subtopics: ['Scientific inquiry in chemistry', 'Branches of chemistry', 'Empirical scientific method', 'Safety in chemistry laboratory'] },
      { id: 'chem_ch2', number: 2, name: 'Matter', subtopics: ['States of matter', 'Physical and chemical properties', 'Elements, compounds, and mixtures', 'Homogeneous and heterogeneous mixtures'] },
      { id: 'chem_ch3', number: 3, name: 'Atomic Structure', subtopics: ['Subatomic particles (Protons, Neutrons, Electrons)', 'Rutherford’s atomic model & Bohr’s atomic theory', 'Atomic number ($Z$) and Mass number ($A$)', 'Electronic configuration (s, p subshells)', 'Isotopes and their applications ($^{12}\\text{C}, ^{14}\\text{C}, ^{235}\\text{U}$)'] },
      { id: 'chem_ch4', number: 4, name: 'Periodic Table and Periodicity of Properties', subtopics: ['Modern Periodic Table and Periodic Law', 'Periods and Groups', 'Periodic trends: Atomic Radius, Ionization Energy, Electron Affinity, Electronegativity', 'Metals, Non-metals and Metalloids'] },
      { id: 'chem_ch5', number: 5, name: 'Chemical Bonding', subtopics: ['Octet and Duplet rules', 'Ionic Bonding and Lattice energy', 'Covalent Bonding (Single, Double, Triple)', 'Coordinate (Dative) Covalent Bonding', 'Polar vs Non-polar covalent bonds', 'Metallic Bonding', 'Intermolecular forces (Hydrogen bonding)'] },
      { id: 'chem_ch6', number: 6, name: 'Stoichiometry', subtopics: ['Atomic mass unit (amu)', 'Relative atomic mass and Formula mass', 'The Mole concept and Avogadro’s Number ($6.022 \\times 10^{23}$)', 'Molar mass calculations', 'Percentage composition and Empirical formula', 'Stoichiometric calculations based on balanced equations'] },
      { id: 'chem_ch7', number: 7, name: 'Electrochemistry', subtopics: ['Oxidation and Reduction concepts', 'Oxidation states and rules', 'Oxidizing and Reducing agents', 'Electrolytic cells vs Galvanic (Voltaic) cells', 'Electrolysis of molten NaCl and water', 'Electroplating and Corrosion prevention'] },
      { id: 'chem_ch8', number: 8, name: 'Energetics', subtopics: ['Exothermic and Endothermic reactions', 'Enthalpy change ($\\Delta H$)', 'Energy profile diagrams', 'Activation energy', 'Heat of combustion and neutralization'] },
      { id: 'chem_ch9', number: 9, name: 'Chemical Equilibrium', subtopics: ['Reversible and Irreversible reactions', 'Dynamic Equilibrium state', 'Law of Mass Action and Equilibrium constant expression ($K_c$)', 'Le Chatelier’s principle basics'] },
      { id: 'chem_ch10', number: 10, name: 'Acids, Bases, and Salts', subtopics: ['Arrhenius theory of acids and bases', 'Properties of acids and bases', 'pH and pOH scale ($pH = -\\log[H^+]$)', 'Indicators and Titration basics', 'Preparation and types of salts (Normal, Acidic, Basic)'] },
      { id: 'chem_ch11', number: 11, name: 'Environmental Chemistry – Air', subtopics: ['Composition of the atmosphere', 'Air pollutants (CO, $\\text{SO}_2$, $\\text{NO}_x$, Lead)', 'Acid rain causes and effects', 'Greenhouse effect and Global warming', 'Depletion of ozone layer'] },
      { id: 'chem_ch12', number: 12, name: 'Environmental Chemistry – Water', subtopics: ['Properties of water (Universal solvent, hydrogen bonding)', 'Soft vs Hard water (Temporary & Permanent hardness)', 'Methods of removing hardness', 'Water pollution and treatment of industrial effluents'] },
      { id: 'chem_ch13', number: 13, name: 'Organic Chemistry', subtopics: ['Characteristics of organic compounds', 'Tetravalency and catenation of carbon', 'Classification of organic compounds', 'Functional groups (Alcohols, Aldehydes, Ketones, Carboxylic acids, Esters)'] },
      { id: 'chem_ch14', number: 14, name: 'Hydrocarbons', subtopics: ['Saturated hydrocarbons (Alkanes - combustion, substitution)', 'Unsaturated hydrocarbons (Alkenes & Alkynes - addition reactions)', 'Physical properties and industrial uses of hydrocarbons'] },
      { id: 'chem_ch15', number: 15, name: 'Biochemistry', subtopics: ['Carbohydrates (Monosaccharides, Disaccharides, Polysaccharides)', 'Proteins and Amino acids', 'Lipids and Fatty acids', 'Nucleic Acids (DNA and RNA basics)', 'Vitamins and their biological importance'] },
      { id: 'chem_ch16', number: 16, name: 'Empirical Data Collection and Analysis', subtopics: ['Accuracy, Precision, and Errors in chemical experiments', 'Significant figures in laboratory measurements', 'Data plotting and standard curve interpretation'] },
      { id: 'chem_ch17', number: 17, name: 'Separation Techniques', subtopics: ['Filtration and Crystallization', 'Distillation and Fractional distillation', 'Sublimation and Solvent extraction'] },
      { id: 'chem_ch18', number: 18, name: 'Qualitative Analysis', subtopics: ['Flame test for metal cations', 'Precipitation reactions for cation and anion identification', 'Confirmatory chemical tests for halides, sulfates, and carbonates'] },
      { id: 'chem_ch19', number: 19, name: 'Chromatography', subtopics: ['Principles of chromatography (Stationary vs Mobile phase)', 'Paper chromatography setup', 'Calculation of Retention Factor ($R_f$ value)', 'Applications of chromatography in chemical analysis'] },
    ],
  },
  Biology: {
    subject: 'Biology',
    aliases: ['biology', 'bio'],
    guidelines: 'Use biological terminology, cell structures, biochemical pathways, organ systems, genetics, taxonomy, and physiological mechanisms strictly aligned with Grade 9 FBISE.',
    chapters: [
      { id: 'bio_ch1', number: 1, name: 'The Science of Biology', subtopics: ['Major fields and branches of biology', 'Relationship of biology to other sciences', 'Careers in biology', 'Muslim scientists (Jabir ibn Hayyan, Abdul Malik Asmai, Bu Ali Sina)', 'Scientific method and biological problem solving'] },
      { id: 'bio_ch2', number: 2, name: 'Molecular Biology', subtopics: ['Biomolecules of life', 'Structure and function of Water, Carbohydrates, Lipids, Proteins', 'Enzymes as biological catalysts', 'Mechanism of enzyme action (Lock and key model)'] },
      { id: 'bio_ch3', number: 3, name: 'The Cell', subtopics: ['Cell Theory', 'Microscopy (Light vs Electron microscope)', 'Prokaryotic vs Eukaryotic cells', 'Cell Organelles (Nucleus, Mitochondria, Ribosomes, ER, Golgi, Chloroplasts)', 'Cell membrane and transport mechanisms (Diffusion, Osmosis, Active Transport)'] },
      { id: 'bio_ch4', number: 4, name: 'Tissues, Organs and Organ Systems', subtopics: ['Plant tissues (Meristematic, Epidermal, Ground, Xylem, Phloem)', 'Animal tissues (Epithelial, Connective, Muscle, Nervous)', 'Organ and organ system level of organization'] },
      { id: 'bio_ch5', number: 5, name: 'Cell Cycle', subtopics: ['Interphase ($G_1, S, G_2$ phases)', 'Mitosis (Prophase, Metaphase, Anaphase, Telophase)', 'Cytokinesis', 'Significance of Mitosis', 'Meiosis (Meiosis I, Crossing over, Meiosis II)', 'Necrosis and Apoptosis'] },
      { id: 'bio_ch6', number: 6, name: 'Biodiversity', subtopics: ['Aims and principles of classification', 'History of classification systems (Two-Kingdom to Five-Kingdom system)', 'The Five Kingdoms (Monera, Protista, Fungi, Plantae, Animalia)', 'Binomial Nomenclature (Linnaeus rules)', 'Conservation of Biodiversity and Endangered species in Pakistan'] },
      { id: 'bio_ch7', number: 7, name: 'Metabolism', subtopics: ['Anabolism and Catabolism', 'Role of ATP as energy currency', 'Photosynthesis (Light reactions, Calvin cycle, Factors affecting rate)', 'Cellular Respiration (Aerobic vs Anaerobic/Fermentation, Glycolysis, Krebs cycle, ETC)'] },
      { id: 'bio_ch8', number: 8, name: 'Plant Physiology', subtopics: ['Water and mineral uptake in roots', 'Transpiration and factors affecting transpiration rate', 'Opening and closing of stomata', 'Translocation of organic solutes (Pressure Flow hypothesis)'] },
      { id: 'bio_ch9', number: 9, name: 'Plant Reproduction', subtopics: ['Asexual reproduction in plants (Natural vegetative propagation, Artificial cuttings/grafting)', 'Sexual reproduction in angiosperms (Flower structure, Pollination, Double fertilization)', 'Seed formation and Germination conditions'] },
      { id: 'bio_ch10', number: 10, name: 'Evolution', subtopics: ['Theory of Natural Selection (Darwinism)', 'Evidences of Evolution (Fossil record, Comparative anatomy, Homologous and Analogous organs)', 'Mechanism of speciation and genetic variation'] },
    ],
  },
  Mathematics: {
    subject: 'Mathematics',
    aliases: ['mathematics', 'math', 'maths'],
    guidelines: 'Generate mathematically authentic problems. Include calculations, algebraic factorization, proofs, coordinates, trigonometry with bearings, geometry of straight lines/polygons, and statistics strictly for Grade 9 FBISE. Ensure mathematically accurate answer keys.',
    chapters: [
      { id: 'math_ch1', number: 1, name: 'Real Numbers', subtopics: ['Rational and Irrational numbers', 'Properties of real numbers under addition and multiplication', 'Radicals and Radicands', 'Laws of Exponents/Indices', 'Complex numbers basics ($i = \\sqrt{-1}$)'] },
      { id: 'math_ch2', number: 2, name: 'Logarithms', subtopics: ['Scientific notation', 'Concept of Logarithm (Common log vs Natural log)', 'Characteristic and Mantissa', 'Laws of Logarithms ($\\log(ab) = \\log a + \\log b$, $\\log(a/b) = \\log a - \\log b$, $\\log(a^n) = n\\log a$, Change of base)', 'Application of logarithms in numerical calculations'] },
      { id: 'math_ch3', number: 3, name: 'Sets and Relations', subtopics: ['Operations on sets (Union, Intersection, Difference, Complement)', 'Venn Diagrams', 'De Morgan’s Laws', 'Binary Relations', 'Functions/Mappings (Injective, Surjective, Bijective)'] },
      { id: 'math_ch4', number: 4, name: 'Factorization and Algebraic Manipulation', subtopics: ['Factorization of formulas ($a^2-b^2$, $a^3\\pm b^3$, $a^2\\pm 2ab+b^2$, trinomials)', 'Remainder Theorem and Factor Theorem', 'HCF and LCM of algebraic expressions', 'Simplification of rational algebraic expressions'] },
      { id: 'math_ch5', number: 5, name: 'Linear Equations and Inequalities', subtopics: ['Linear equations in one variable', 'Equations involving absolute value ($|x| = a$)', 'Linear inequalities ($ax + b < c$)', 'Graphing linear equations and finding solutions'] },
      { id: 'math_ch6', number: 6, name: 'Trigonometry and Bearing', subtopics: ['Trigonometric ratios ($\\sin, \\cos, \\tan, \\csc, \\sec, \\cot$)', 'Trigonometric ratios of standard angles ($30^\\circ, 45^\\circ, 60^\\circ$)', 'Fundamental Trigonometric Identities ($\\sin^2\\theta + \\cos^2\\theta = 1$)', 'Angles of Elevation and Depression', 'Bearings and navigational problem solving'] },
      { id: 'math_ch7', number: 7, name: 'Coordinate Geometry', subtopics: ['Cartesian plane and Coordinates', 'Distance Formula ($d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$)', 'Mid-point Formula ($(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2})$)', 'Collinear and non-collinear points'] },
      { id: 'math_ch8', number: 8, name: 'Geometry of Straight Lines', subtopics: ['Parallel lines and Transversal lines', 'Alternate interior angles, Corresponding angles, Consecutive angles', 'Congruence of triangles (SSS, SAS, ASA, RHS theorems)'] },
      { id: 'math_ch9', number: 9, name: 'Geometry and Polygons', subtopics: ['Properties of Parallelograms, Rectangles, Rhombus, Squares, Trapeziums', 'Interior and Exterior angles of polygons ($S = (n-2) \\times 180^\\circ$)', 'Circle theorems (Chords, Tangents, Central and Inscribed angles)'] },
      { id: 'math_ch10', number: 10, name: 'Practical Geometry', subtopics: ['Construction of Triangles (given sides and angles)', 'Construction of Altitudes, Angle Bisectors, Perpendicular Bisectors, and Medians', 'Construction of Tangents to circles'] },
      { id: 'math_ch11', number: 11, name: 'Basic Statistics', subtopics: ['Frequency distribution and Cumulative frequency', 'Histograms and Frequency polygons', 'Measures of Central Tendency (Arithmetic Mean, Median, Mode)', 'Measures of Dispersion (Range, Variance, Standard Deviation)'] },
    ],
  },
  Urdu: {
    subject: 'Urdu',
    aliases: ['urdu', 'urd'],
    guidelines: 'Questions must use the actual selected Grade 9 FBISE textbook lesson, poem, or ghazal. Test text comprehension, meanings of words, central idea (مرکزی خیال), tashreeh (تشریح), characters/events, references (سیاق و سباق), and poet/author info. Never generate random or invented Urdu passages.',
    chapters: [
      // NASR (نثر)
      { id: 'urdu_nasr_1', number: 1, name: 'اخلاقِ حسنہ', category: 'Nasr', description: 'نثر: اخلاقِ حسنہ — مصنف: مولانا شبلی نعمانی' },
      { id: 'urdu_nasr_2', number: 2, name: 'کتبہ', category: 'Nasr', description: 'نثر: کتبہ — افسانہ' },
      { id: 'urdu_nasr_3', number: 3, name: 'بھیڑیا', category: 'Nasr', description: 'نثر: بھیڑیا' },
      { id: 'urdu_nasr_4', number: 4, name: 'آرام و سکون', category: 'Nasr', description: 'نثر: آرام و سکون — ڈراما از امتیاز علی تاج' },
      { id: 'urdu_nasr_5', number: 5, name: 'حکیم اور مرزا غالب', category: 'Nasr', description: 'نثر: حکیم اور مرزا غالب' },
      { id: 'urdu_nasr_6', number: 6, name: 'نام دیوہالی', category: 'Nasr', description: 'نثر: نام دیوہالی — خاکہ از مولوی عبدالحق' },
      { id: 'urdu_nasr_7', number: 7, name: 'ابتدائی حباب', category: 'Nasr', description: 'نثر: ابتدائی حباب' },
      { id: 'urdu_nasr_8', number: 8, name: 'لڑی میں پروئے ہوئے منظر', category: 'Nasr', description: 'نثر: لڑی میں پروئے ہوئے منظر — سفرنامہ' },
      { id: 'urdu_nasr_9', number: 9, name: 'اپنی مدد آپ', category: 'Nasr', description: 'نثر: اپنی مدد آپ — سر سید احمد خان' },
      // NAZM (نظم)
      { id: 'urdu_nazm_1', number: 10, name: 'حمد', category: 'Nazm', description: 'نظم: حمد — الطاف حسین حالی / حفیظ جالندھری' },
      { id: 'urdu_nazm_2', number: 11, name: 'نعت', category: 'Nazm', description: 'نظم: نعت — احسان دانش / ماہر القادری' },
      { id: 'urdu_nazm_3', number: 12, name: 'جاوید کے نام', category: 'Nazm', description: 'نظم: جاوید کے نام — علامہ محمد اقبال' },
      { id: 'urdu_nazm_4', number: 13, name: 'محنت کی برکات', category: 'Nazm', description: 'نظم: محنت کی برکات' },
      { id: 'urdu_nazm_5', number: 14, name: 'کرکٹ اور مشاعرہ', category: 'Nazm', description: 'نظم: کرکٹ اور مشاعرہ — ظریفانہ نظم' },
      { id: 'urdu_nazm_6', number: 15, name: 'پیامِ لطیف', category: 'Nazm', description: 'نظم: پیامِ لطیف' },
      // GHAZAL (غزل)
      { id: 'urdu_ghazal_1', number: 16, name: 'فقیرانہ آئے صدا کر چلے', category: 'Ghazal', description: 'غزل: فقیرانہ آئے صدا کر چلے — میر تقی میر' },
      { id: 'urdu_ghazal_2', number: 17, name: 'سن تو سہی جہاں میں ہے تیرا افسانہ کیا', category: 'Ghazal', description: 'غزل: سن تو سہی جہاں میں ہے تیرا افسانہ کیا — خواجہ حیدر علی آتش' },
      { id: 'urdu_ghazal_3', number: 18, name: 'غم یا خوشی ہے تو', category: 'Ghazal', description: 'غزل: غم یا خوشی ہے تو — مرزا اسد اللہ خان غالب' },
      { id: 'urdu_ghazal_4', number: 19, name: 'کاش طوفاں میں سفینے کو اتار ہوتا', category: 'Ghazal', description: 'غزل: کاش طوفاں میں سفینے کو اتار ہوتا' },
    ],
  },
  English: {
    subject: 'English',
    aliases: ['english', 'eng', 'english compulsory', 'english 9', 'english grammar'],
    guidelines: 'Questions must be strictly grounded in the official Grade 9 FBISE English Grammar and Language curriculum. Test precise grammar mechanics, syntax, structural transformations, punctuation, vocabulary context, idioms, and usage rules with no cross-topic bleed.',
    chapters: [
      { id: 'eng_ch1', number: 1, name: 'Parts of Speech', subtopics: ['Nouns (Proper, Common, Abstract, Collective, Material)', 'Pronouns (Personal, Reflexive, Emphatic, Relative, Demonstrative)', 'Verbs (Transitive, Intransitive, Linking, Auxiliary)', 'Adjectives and Adverbs (Manner, Place, Time, Degree, Frequency)', 'Prepositions, Conjunctions, Interjections'] },
      { id: 'eng_ch2', number: 2, name: 'Tenses (all forms)', subtopics: ['Present Simple, Continuous, Perfect, Perfect Continuous', 'Past Simple, Continuous, Perfect, Perfect Continuous', 'Future Simple, Continuous, Perfect, Perfect Continuous', 'Time markers (since, for, already, yet, by the time)', 'Sequence of tenses and conditional time clauses'] },
      { id: 'eng_ch3', number: 3, name: 'Active & Passive Voice', subtopics: ['Rules of voice transformation across all 8 passive tenses', 'Imperative sentences (commands, requests, prohibitions)', 'Interrogative sentences (WH-questions and auxiliary questions)', 'Modal verbs in passive voice', 'Ditransitive verbs and prepositional passive constructions'] },
      { id: 'eng_ch4', number: 4, name: 'Direct & Indirect Narration', subtopics: ['Reporting verbs and tense backshifting rules', 'Changes in pronouns, possessives, and demonstratives', 'Changes in adverbs of time and place (now->then, tomorrow->next day)', 'Assertive, Interrogative, Imperative, Exclamatory, and Optative sentences', 'Universal truths and habitual actions (no backshift)'] },
      { id: 'eng_ch5', number: 5, name: 'Sentence Correction', subtopics: ['Subject-Verb agreement errors and proximity traps', 'Misplaced and dangling modifiers', 'Faulty parallelism in lists and correlative structures', 'Pronoun-antecedent agreement and incorrect case', 'Double negatives, double comparatives, and redundant expressions'] },
      { id: 'eng_ch6', number: 6, name: 'Types of Sentences', subtopics: ['Structural: Simple, Compound, Complex, Compound-Complex', 'Functional: Declarative, Interrogative, Imperative, Exclamatory, Optative', 'Conditionals: Zero, First, Second, and Third conditionals'] },
      { id: 'eng_ch7', number: 7, name: 'Subject-Verb Agreement', subtopics: ['Singular and plural subject rules', 'Compound subjects with and, either...or, neither...nor', 'Intervening phrases (as well as, along with, in addition to)', 'Indefinite pronouns (each, everyone, both, many, all)', 'Collective nouns and plural-form singular nouns (Mathematics, Physics, News)'] },
      { id: 'eng_ch8', number: 8, name: 'Prepositions', subtopics: ['Prepositions of Time (at, on, in, by, until, during)', 'Prepositions of Place and Direction (between, among, into, onto, through)', 'Dependent and fixed prepositions (accused of, good at, abide by, congratulate on)', 'Prepositional phrases and collocations'] },
      { id: 'eng_ch9', number: 9, name: 'Conjunctions', subtopics: ['Coordinating Conjunctions (FANBOYS: for, and, nor, but, or, yet, so)', 'Subordinating Conjunctions (because, although, unless, until, lest...should)', 'Correlative Conjunctions (either...or, neither...nor, not only...but also)', 'Conjunctive Adverbs and transitional markers (however, therefore, consequently)'] },
      { id: 'eng_ch10', number: 10, name: 'Articles', subtopics: ['Indefinite articles (a, an based on phonetic vowel sound)', 'Definite article (the: superlatives, unique entities, rivers, musical instruments)', 'Zero Article (omission before proper, abstract, material nouns, and meals)', 'Articles with geographical features and double comparatives'] },
      { id: 'eng_ch11', number: 11, name: 'Punctuation', subtopics: ['Terminal punctuation (full stop, question mark, exclamation mark)', 'Commas in lists, introductory clauses, and non-defining relative clauses', 'Semicolons, colons, and hyphens in compound words', 'Apostrophes for possession vs contractions (its vs it\'s, plural possessives)', 'Capitalization rules for proper nouns, titles, and direct speech quotes'] },
      { id: 'eng_ch12', number: 12, name: 'Modals/Auxiliary Verbs', subtopics: ['Modals of Ability and Permission (can, could, may, might)', 'Modals of Obligation and Necessity (must, have to, should, ought to)', 'Modals of Deduction and Logical Certainty (must be, cannot be)', 'Semi-modals (need, dare, used to) and primary auxiliaries (be, do, have)'] },
      { id: 'eng_ch13', number: 13, name: 'Clauses', subtopics: ['Independent vs Dependent (Subordinate) clauses', 'Noun Clauses (functioning as Subject, Object of Verb, Object of Preposition)', 'Adjective / Relative Clauses (defining vs non-defining with who, whom, whose, which, that)', 'Adverb Clauses (Time, Place, Reason, Condition, Concession, Purpose, Result)'] },
      { id: 'eng_ch14', number: 14, name: 'Degrees of Comparison', subtopics: ['Positive, Comparative, and Superlative degrees of adjectives and adverbs', 'Regular (-er, -est, more, most) and Irregular forms (good-better-best, bad-worse-worst, far-farther/further)', 'Interchange and transformation of degrees without alteration of meaning', 'Structures with as...as, comparative with than, and the + comparative, the + comparative'] },
      { id: 'eng_ch15', number: 15, name: 'Vocabulary & Comprehension', subtopics: ['Context clues and determination of meaning in sentences', 'Synonyms and Antonyms of high-frequency FBISE Grade 9 vocabulary', 'Connotation (positive, neutral, negative) vs Denotation', 'Author\'s tone, mood, main idea, and inference analysis from textual excerpts'] },
      { id: 'eng_ch16', number: 16, name: 'Idioms & Phrases', subtopics: ['Meaning and contextual usage of standard English idioms', 'High-yield Phrasal Verbs (call off, look into, give in, put up with, bring about)', 'Idiomatic collocations and figurative vs literal interpretations'] },
      { id: 'eng_ch17', number: 17, name: 'Word Formation (Prefixes/Suffixes)', subtopics: ['Common Prefixes (un-, in-, im-, dis-, mis-, re-, pre-, anti-)', 'Common Suffixes (-ment, -tion, -ness, -able, -ful, -less, -ify, -ize)', 'Derivation and conversion between parts of speech (verb -> noun, adjective -> adverb)', 'Compound words formation and root word identification'] },
    ],
  },
};

/**
 * Normalizes a subject name to match standard Grade 9 FBISE taxonomy
 */
export function normalizeFBISEGrade9Subject(rawSubject: string): string | null {
  const norm = (rawSubject || '').trim().toLowerCase();
  for (const [canonical, data] of Object.entries(FBISE_GRADE_9_CURRICULUM)) {
    if (canonical.toLowerCase() === norm) return canonical;
    if (data.aliases.some((alias) => norm.includes(alias) || alias.includes(norm))) {
      return canonical;
    }
  }
  return null;
}

/**
 * Returns the exact list of chapters for a given Grade 9 FBISE subject
 */
export function getFBISEGrade9Chapters(subjectName: string): ChapterDef[] {
  const canonical = normalizeFBISEGrade9Subject(subjectName);
  if (!canonical || !FBISE_GRADE_9_CURRICULUM[canonical]) {
    return [];
  }
  return FBISE_GRADE_9_CURRICULUM[canonical].chapters.map((c) => ({
    ...c,
    chapterNumber: c.chapterNumber || c.number,
  }));
}

/**
 * Returns chapter names string array for popular topic suggestions
 */
export function getFBISEGrade9PopularTopics(subjectName: string): string[] {
  const chapters = getFBISEGrade9Chapters(subjectName);
  return chapters.map((c) => c.name);
}

/**
 * Checks if a given board and grade is Grade 9 FBISE
 */
export function isGrade9FBISE(board?: string | null, grade?: string | null): boolean {
  const b = (board || '').toLowerCase();
  const g = String(grade || '').trim();
  const isFbise = b === 'fbise' || b === 'federal' || b.includes('fbise') || b.includes('federal');
  const isNine = g === '9' || g === '9th' || g.toLowerCase() === 'grade 9';
  return isFbise && isNine;
}

export interface ChapterSyllabusScope {
  subject: string;
  chapter: string;
  chapterNumber?: number;
  subtopics: string[];
  guidelines: string;
  requiredKeywords: string[];
  forbiddenCrossChapterPatterns: { pattern: RegExp; reason: string }[];
  isFullSyllabus: boolean;
}

/**
 * Returns the exact syllabus scope, subtopics, and anti-bleed validation rules for a subject & topic/chapter.
 */
export function getChapterSyllabusScope(
  subject: string,
  topicOrChapter: string
): ChapterSyllabusScope {
  const canonicalSubject = normalizeFBISEGrade9Subject(subject) || subject;
  const rawTopic = (topicOrChapter || '').trim();
  const normTopic = rawTopic.toLowerCase();

  const isFullSyllabus =
    !rawTopic ||
    normTopic === 'full syllabus' ||
    normTopic === 'mixed chapters' ||
    normTopic === 'all' ||
    normTopic === 'entire syllabus';

  if (isFullSyllabus) {
    return {
      subject: canonicalSubject,
      chapter: 'Full Syllabus',
      subtopics: ['Comprehensive review of all syllabus chapters'],
      guidelines: FBISE_GRADE_9_CURRICULUM[canonicalSubject]?.guidelines || 'Syllabus-aligned questions',
      requiredKeywords: [],
      forbiddenCrossChapterPatterns: [],
      isFullSyllabus: true,
    };
  }

  const subjectData9 = FBISE_GRADE_9_CURRICULUM[canonicalSubject];
  const subjectData10 = FBISE_GRADE_10_CURRICULUM[canonicalSubject];
  let matchedChapter: ChapterDef | undefined;
  let matchedSubjectData = subjectData9 || subjectData10;

  if (subjectData9) {
    matchedChapter = subjectData9.chapters.find((ch) => {
      const chNorm = ch.name.toLowerCase();
      return chNorm === normTopic || chNorm.includes(normTopic) || normTopic.includes(chNorm);
    });
  }

  if (!matchedChapter && subjectData10) {
    matchedChapter = subjectData10.chapters.find((ch) => {
      const chNorm = ch.name.toLowerCase();
      return chNorm === normTopic || chNorm.includes(normTopic) || normTopic.includes(chNorm);
    });
    if (matchedChapter) {
      matchedSubjectData = subjectData10;
    }
  }

  const chapterName = matchedChapter?.name || rawTopic;
  const subtopics = matchedChapter?.subtopics || [chapterName];
  const guidelines = matchedSubjectData?.guidelines || '';

  // Subject-specific keyword scopes and anti-bleed forbidden patterns
  const normSub = canonicalSubject.toLowerCase();
  const requiredKeywords: string[] = [];
  const forbiddenCrossChapterPatterns: { pattern: RegExp; reason: string }[] = [];

  if (normSub.includes('phys')) {
    if (normTopic.includes('atomic') || normTopic.includes('nuclear') || normTopic.includes('radioactiv')) {
      requiredKeywords.push(
        'radioactiv', 'radiation', 'alpha', 'beta', 'gamma', 'half-life', 'nucleus', 'decay',
        'fission', 'fusion', 'isotope', 'geiger', 'radioisotope', 'curie', 'becquerel',
        'mass-energy', 'einstein', 'carbon-14', 'nucleon', 'e=mc^2', 'e = mc^2', 'atomic number',
        'mass number', 'background radiation', 'scintillation', 'cloud chamber', 'transmutation',
        'penetrating power', 'ionizing power', 'daughter nucleus', 'parent nucleus'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|micrometer screw gauge|least count of \d+|positive zero error|significant figures in \d+|pitch of \d+)\b/i, reason: 'Measuring instruments belong to Chapter 1 (Measurements), not Nuclear Physics.' },
        { pattern: /\b(equations of motion|speed-time graph|distance-time graph|uniform acceleration|initial velocity|final velocity|free fall|v\s*=\s*u\s*\+\s*at|s\s*=\s*ut)\b/i, reason: 'Kinematics belongs to Chapter 2, not Nuclear Physics.' },
        { pattern: /\b(newton's (first|second|third) law|law of inertia|f\s*=\s*ma|net force of|mass of \d+\s*kg accelerates|momentum p\s*=\s*mv|conservation of momentum|centripetal force)\b/i, reason: 'Dynamics & forces belong to Chapters 3 & 4.' },
        { pattern: /\b(density of (solid|liquid|water)|density \\rho\s*=\s*m\/v|thermal expansion|specific heat capacity|thermometer|celsius scale)\b/i, reason: 'Thermal physics & density belong to earlier chapters.' },
        { pattern: /\b(pascal's law|hydraulic lift|archimedes|upthrust|young's modulus|hooke's law)\b/i, reason: 'Fluids & pressure belong to Chapter 5.' },
        { pattern: /\b(concave mirror|convex mirror|mirror formula|snell's law|total internal reflection|myopia|hypermetropia|focal length of mirror)\b/i, reason: 'Geometrical optics belongs to Optics chapter.' },
        { pattern: /\b(ohm's law|resistor carrying|electric current of \d+\s*a|potential difference of \d+\s*v|coulomb's law f\s*=\s*k)\b/i, reason: 'Current electricity belongs to Electricity chapters.' }
      );
    } else if (normTopic.includes('optic') || normTopic.includes('mirror') || normTopic.includes('lens')) {
      requiredKeywords.push(
        'mirror', 'lens', 'concave', 'convex', 'focal length', 'refraction', 'reflection', 'snell',
        'index of refraction', 'critical angle', 'total internal reflection', 'optical fiber', 'microscope',
        'telescope', 'myopia', 'hypermetropia', 'magnification', 'ray diagram', 'real image', 'virtual image',
        'power of lens', 'dioptre', 'diopter', 'center of curvature', 'principal focus', 'pole'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|micrometer screw gauge|least count of \d+|significant figures)\b/i, reason: 'Measuring instruments belong to Chapter 1.' },
        { pattern: /\b(alpha particle|beta decay|gamma radiation|half-life of|nuclear fission|nuclear fusion|radioactiv)\b/i, reason: 'Radioactivity belongs to Nuclear Physics.' },
        { pattern: /\b(f\s*=\s*ma|newton's second law|momentum p\s*=\s*mv|centripetal force)\b/i, reason: 'Forces and dynamics belong to Dynamics chapters.' },
        { pattern: /\b(specific heat capacity|latent heat of|thermal expansion)\b/i, reason: 'Thermal physics belongs to Thermal chapters.' }
      );
    } else if (normTopic.includes('current electric') || (normTopic.includes('electric') && !normTopic.includes('electrostat'))) {
      requiredKeywords.push(
        'electric current', 'ohm\'s law', 'resistor', 'resistance', 'resistivity', 'series circuit',
        'parallel circuit', 'potential difference', 'electromotive force', 'emf', 'joule\'s law',
        'electric power', 'kilowatt-hour', 'kwh', 'fuse', 'circuit breaker', 'earth wire', 'ammeter', 'voltmeter',
        'specific resistance', 'ohmic conductor', 'non-ohmic'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|micrometer screw gauge|least count)\b/i, reason: 'Measuring instruments belong to Chapter 1.' },
        { pattern: /\b(alpha radiation|beta decay|half-life of|nuclear fission|nuclear fusion)\b/i, reason: 'Belongs to Nuclear Physics.' },
        { pattern: /\b(concave mirror|convex lens|snell's law|telescope|microscope)\b/i, reason: 'Belongs to Geometrical Optics.' }
      );
    } else if (normTopic.includes('electrostat') || normTopic.includes('charge')) {
      requiredKeywords.push(
        'coulomb', 'electrostatic', 'electric charge', 'electric field', 'field intensity', 'electric potential',
        'potential difference', 'capacitor', 'capacitance', 'dielectric', 'farad', 'gold leaf electroscope', 'point charge',
        'photocopier', 'electrostatic induction'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|micrometer screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(alpha radiation|half-life of|nuclear fission)\b/i, reason: 'Belongs to Nuclear Physics.' },
        { pattern: /\b(concave mirror|convex lens|snell's law)\b/i, reason: 'Belongs to Optics.' }
      );
    } else if (normTopic.includes('electromagnet') || normTopic.includes('induction')) {
      requiredKeywords.push(
        'magnetic effect', 'right-hand grip rule', 'fleming\'s left-hand rule', 'dc motor', 'electromagnetic induction',
        'faraday\'s law', 'lenz\'s law', 'ac generator', 'transformer', 'step-up', 'step-down', 'mutual induction', 'magnetic flux'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(half-life of|nuclear fission|alpha decay)\b/i, reason: 'Belongs to Nuclear Physics.' },
        { pattern: /\b(concave mirror|convex lens|snell's law)\b/i, reason: 'Belongs to Optics.' }
      );
    } else if (normTopic.includes('electronic') || normTopic.includes('logic gate')) {
      requiredKeywords.push(
        'thermionic emission', 'cathode ray', 'cro', 'logic gate', 'truth table', 'and gate', 'or gate',
        'not gate', 'nand gate', 'nor gate', 'boolean', 'electron gun', 'oscilloscope'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(half-life of|nuclear fission|alpha decay)\b/i, reason: 'Belongs to Nuclear Physics.' }
      );
    } else if (normTopic.includes('wave') || normTopic.includes('harmonic') || normTopic.includes('shm') || normTopic.includes('pendulum')) {
      requiredKeywords.push(
        'simple harmonic motion', 'shm', 'restoring force', 'mass-spring', 'simple pendulum', 'time period',
        'damped oscillation', 'wave motion', 'longitudinal', 'transverse', 'wavelength', 'frequency', 'wave speed',
        'ripple tank', 'diffraction', 'crest', 'trough', 'compression', 'rarefaction'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(half-life|alpha particle|nuclear fission)\b/i, reason: 'Belongs to Nuclear Physics.' },
        { pattern: /\b(concave mirror|snell's law|telescope)\b/i, reason: 'Belongs to Optics.' }
      );
    } else if (normTopic.includes('sound')) {
      requiredKeywords.push(
        'sound wave', 'speed of sound', 'loudness', 'pitch', 'quality', 'timbre', 'sound intensity',
        'decibel', 'echo', 'audible frequency', '20 hz', 'ultrasound', 'sonar', 'compression'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(half-life|alpha particle|nuclear fission)\b/i, reason: 'Belongs to Nuclear Physics.' },
        { pattern: /\b(concave mirror|snell's law|telescope)\b/i, reason: 'Belongs to Optics.' }
      );
    } else if (normTopic.includes('ict') || normTopic.includes('information and communication')) {
      requiredKeywords.push(
        'ict', 'optical fiber', 'radio wave', 'hard disk', 'flash drive', 'computer network',
        'telecommunication', 'transmission of signals', 'internet', 'data storage'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(half-life|nuclear fission)\b/i, reason: 'Belongs to Nuclear Physics.' }
      );
    } else if (normTopic.includes('measurement') || normTopic.includes('physical quantit')) {
      requiredKeywords.push(
        'base unit', 'derived unit', 'vernier', 'screw gauge', 'least count', 'zero error',
        'significant figure', 'prefix', 'scientific notation', 'measuring cylinder', 'kelvin',
        'meter', 'second', 'kilogram', 'ampere', 'mole', 'candela', 'stopwatch', 'physical balance',
        'digital balance', 'pitch', 'meniscus', 'standard form', 'precision', 'accuracy', 'micro',
        'pico', 'nano', 'kilo', 'mega', 'giga', 'derived quantity', 'base quantity'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(equations of motion|speed-time graph|distance-time graph|uniform acceleration|initial velocity|final velocity|motion under gravity|free fall|v\s*=\s*u\s*\+\s*at|s\s*=\s*ut)\b/i, reason: 'Kinematics & motion concepts belong to Chapter 2 (Kinematics).' },
        { pattern: /\b(newton's (first|second|third) law|law of inertia|f\s*=\s*ma|net force of|mass of \d+\s*kg accelerates|momentum p\s*=\s*mv|conservation of momentum|centripetal force|static friction|sliding friction)\b/i, reason: 'Dynamics & forces concepts belong to Chapters 3 & 4 (Dynamics).' },
        { pattern: /\b(kinetic energy|potential energy|e_k\s*=\s*\\frac\{1\}\{2\}mv\^2|e_p\s*=\s*mgh|work done w\s*=\s*f|power in watts|efficiency of machine|forms of energy)\b/i, reason: 'Work and Energy concepts belong to Chapter 6 (Work and Energy).' },
        { pattern: /\b(pascal's (law|principle)|hydraulic lift|archimedes|upthrust|hydrostatic pressure|barometer|hooke's law|young's modulus|stress and strain|elasticity)\b/i, reason: 'Pressure and Deformation concepts belong to Chapter 5.' },
        { pattern: /\b(specific heat capacity|thermal expansion|latent heat of|thermometric property|temperature scale|celsius to fahrenheit|expansion of water)\b/i, reason: 'Thermal physics concepts belong to Chapter 7 (Density and Temperature).' },
        { pattern: /\b(magnetic pole|magnetic domain|ferromagnetism|solenoid|magnetic field lines|electromagnet)\b/i, reason: 'Magnetism concepts belong to Chapter 8 (Magnetism).' },
        { pattern: /\b(ohm's law|electric potential difference|resistor carrying|electric current of \d+\s*a|concave mirror|convex mirror|focal length|refraction|snell's law|reflection)\b/i, reason: 'Electricity and Optics belong to Grade 10 Physics.' }
      );
    } else if (normTopic.includes('kinematic')) {
      requiredKeywords.push(
        'speed', 'velocity', 'acceleration', 'deceleration', 'retardation', 'displacement', 'distance', 'scalar', 'vector',
        'speed-time graph', 'distance-time graph', 'equations of motion', 'free fall', 'gravity',
        'translatory', 'rotatory', 'vibratory', 'uniform velocity', 'uniform acceleration',
        'slope of graph', 'area under speed-time graph'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|micrometer screw gauge|least count of \d+|positive zero error|significant figures in \d+)\b/i, reason: 'Measuring instruments belong to Chapter 1 (Measurements).' },
        { pattern: /\b(newton's (first|second|third) law|law of inertia|f\s*=\s*ma|atwood machine|friction coefficient|tension in string)\b/i, reason: 'Forces and laws of motion belong to Dynamics.' },
        { pattern: /\b(kinetic energy|potential energy|e_k|e_p|work done|joule|watt)\b/i, reason: 'Work and Energy belongs to Chapter 6.' },
        { pattern: /\b(pascal's law|hydraulic lift|archimedes|upthrust|hooke's law|young's modulus)\b/i, reason: 'Fluid pressure belongs to Chapter 5.' },
        { pattern: /\b(magnetic pole|electromagnet|resistor|ohm's law|concave mirror)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('dynamics – ii') || normTopic.includes('dynamics-ii') || normTopic.includes('dynamics ii') || normTopic.includes('momentum') || normTopic.includes('circular motion')) {
      requiredKeywords.push(
        'momentum', 'conservation of momentum', 'impulse', 'friction', 'static friction',
        'limiting friction', 'rolling friction', 'centripetal force', 'centripetal acceleration',
        'banking of roads', 'centrifuge', 'circular motion'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count|significant figure)\b/i, reason: 'Belongs to Chapter 1 (Measurements).' },
        { pattern: /\b(kinetic energy formula|potential energy formula|work done|joule|watt)\b/i, reason: 'Belongs to Chapter 6 (Work and Energy).' },
        { pattern: /\b(pascal's law|archimedes|hooke's law|young's modulus)\b/i, reason: 'Belongs to Chapter 5.' }
      );
    } else if (normTopic.includes('dynamics – i') || normTopic.includes('dynamics-i') || (normTopic.includes('dynamics') && !normTopic.includes('ii'))) {
      requiredKeywords.push(
        'newton', 'first law', 'second law', 'third law', 'inertia', 'force', 'mass',
        'weight', 'action and reaction', 'f = ma', 'tension', 'atwood machine', 'pulley'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count|significant figure)\b/i, reason: 'Belongs to Chapter 1 (Measurements).' },
        { pattern: /\b(kinetic energy|work done|potential energy|joule|watt)\b/i, reason: 'Belongs to Chapter 6 (Work and Energy).' },
        { pattern: /\b(pascal's law|archimedes|hydraulic lift|hooke's law)\b/i, reason: 'Belongs to Chapter 5.' },
        { pattern: /\b(concave mirror|resistor|ohm's law|potential difference)\b/i, reason: 'Belongs to Grade 10.' }
      );
    } else if (normTopic.includes('pressure') || normTopic.includes('deformation')) {
      requiredKeywords.push(
        'pressure', 'pascal', 'atmospheric pressure', 'barometer', 'hydraulics', 'hydraulic lift',
        'archimedes', 'upthrust', 'buoyancy', 'floatation', 'density', 'elasticity', 'hooke',
        'stress', 'strain', 'young\'s modulus', 'elastic limit'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(equations of motion|speed-time graph|centripetal force)\b/i, reason: 'Belongs to Kinematics / Dynamics.' },
        { pattern: /\b(kinetic energy|potential energy|work done)\b/i, reason: 'Belongs to Work and Energy.' }
      );
    } else if (normTopic.includes('work') || normTopic.includes('energy')) {
      requiredKeywords.push(
        'work', 'energy', 'kinetic energy', 'potential energy', 'gravitational potential energy',
        'joule', 'watt', 'power', 'efficiency', 'conservation of energy', 'forms of energy',
        'interconversion', 'solar energy', 'fossil fuel', 'biogas', 'biomass', 'wind energy',
        'hydroelectric', 'geothermal', 'mass-energy'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count|zero error)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(pascal's law|hydraulic lift|archimedes|young's modulus)\b/i, reason: 'Belongs to Chapter 5.' },
        { pattern: /\b(resistor carrying current|ohm's law|concave mirror)\b/i, reason: 'Belongs to Grade 10.' }
      );
    } else if (normTopic.includes('density') || normTopic.includes('temperature') || normTopic.includes('heat')) {
      requiredKeywords.push(
        'density', 'temperature', 'heat', 'thermal', 'thermal energy', 'thermal equilibrium', 'thermometer', 'celsius',
        'fahrenheit', 'kelvin', 'thermal expansion', 'linear expansion', 'volume expansion', 'expansion',
        'bimetallic', 'anomalous expansion', 'specific heat capacity', 'latent heat', 'fusion', 'vaporization', 'evaporation',
        'steam', 'boiling', 'melting', 'absolute zero', 'internal energy', 'kinetic theory'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(equations of motion|centripetal force|atwood machine)\b/i, reason: 'Belongs to Kinematics / Dynamics.' }
      );
    } else if (normTopic.includes('magnetism') || normTopic.includes('magnetic')) {
      requiredKeywords.push(
        'magnet', 'magnetic pole', 'magnetic field', 'field lines', 'north pole', 'south pole',
        'domain', 'ferromagnet', 'temporary magnet', 'permanent magnet', 'electromagnet',
        'solenoid', 'demagnetization', 'magnetic shielding'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper|screw gauge|least count)\b/i, reason: 'Belongs to Chapter 1.' },
        { pattern: /\b(equations of motion|kinetic energy|work done)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('nature of science') || normTopic.includes('science and physics')) {
      requiredKeywords.push(
        'hypothesis', 'scientific method', 'theory', 'law', 'experiment', 'observation',
        'falsifiability', 'peer review', 'scientific inquiry', 'scientific knowledge',
        'measurement', 'error', 'uncertainty', 'precision', 'accuracy', 'laser', 'radiation',
        'hazard', 'safety', 'ethics', 'nobel', 'technology', 'frontiers of physics',
        'al-haytham', 'ibn al-haytham', 'al-khwarizmi', 'al-biruni', 'dr. abdus salam',
        'abdus salam', 'pinhole camera', 'camera obscura', 'branches of physics',
        'biophysics', 'geophysics', 'thermodynamics', 'nuclear physics', 'astrophysics',
        'solid state physics', 'plasma physics', 'parallax error', 'fire extinguisher',
        'scientific calculation', 'mri', 'random error', 'systematic error'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(equations of motion|speed-time graph|centripetal force)\b/i, reason: 'Belongs to Kinematics / Dynamics.' }
      );
    }
  } else if (normSub.includes('chem')) {
    if (normTopic.includes('atomic structure') || normTopic.includes('atom')) {
      requiredKeywords.push(
        'atom', 'proton', 'neutron', 'electron', 'nucleus', 'subatomic',
        'rutherford', 'bohr', 'gold foil', 'alpha particle', 'scattering',
        'atomic number', 'mass number', 'nucleon', 'isotope', 'isotopic',
        'electronic configuration', 'shell', 'subshell', 'orbital', 'valence',
        'k shell', 'l shell', 'm shell', 'n shell', '1s', '2s', '2p', '3s', '3p',
        'energy level', 'quantized', 'quantum', 'spectral', 'line spectrum',
        'canal rays', 'cathode rays', 'discharge tube', 'goldstein', 'chadwick',
        'thomson', 'planck', 'deuterium', 'tritium', 'protium', 'carbon-14',
        'cobalt-60', 'iodine-131', 'uranium-235', 'half-life', 'radioisotope'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(molar mass|avogadro|moles? of (water|nacl|co2|o2|h2|gas)|\bstoichiometr|empirical formula|percentage composition of)\b/i, reason: 'Stoichiometry & Mole concepts belong to Chapter 6 (Stoichiometry), not Atomic Structure.' },
        { pattern: /\b(arrhenius|ph of (the )?solution|poh|acid-base indicator|titration|neutralization reaction|acid rain)\b/i, reason: 'Acids, Bases & Salts concepts belong to Chapter 10, not Atomic Structure.' },
        { pattern: /\b(functional group|alkane|alkene|alkyne|homologous series|catenation|isomerism|esterification|carboxylic acid)\b/i, reason: 'Organic chemistry concepts belong to Chapters 13 & 14, not Atomic Structure.' },
        { pattern: /\b(oxidation state of|redox|galvanic cell|electrolytic cell|anode and cathode in electrolysis|corrosion of iron|rusting)\b/i, reason: 'Electrochemistry concepts belong to Chapter 7, not Atomic Structure.' },
        { pattern: /\b(le chatelier|equilibrium constant kc|dynamic equilibrium|reversible reaction)\b/i, reason: 'Chemical equilibrium concepts belong to Chapter 9, not Atomic Structure.' },
        { pattern: /\b(enthalpy change|exothermic and endothermic|activation energy|heat of combustion)\b/i, reason: 'Chemical energetics concepts belong to Chapter 8, not Atomic Structure.' },
        { pattern: /\b(paper chromatography|retention factor|rf value|fractional distillation|crystallization)\b/i, reason: 'Separation techniques belong to Chapters 17 & 19, not Atomic Structure.' }
      );
    } else if (normTopic.includes('stoichiometr') || normTopic.includes('mole')) {
      requiredKeywords.push('mole', 'molar mass', 'avogadro', 'amu', 'formula mass', 'empirical formula', 'percentage composition', 'limiting reactant', 'stoichiometric', 'stoichiometry', 'yield', 'percentage yield', 'theoretical yield', 'actual yield');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(bohr's postulates|rutherford alpha scattering|cathode ray discharge)\b/i, reason: 'Atomic models belong to Atomic Structure chapter.' },
        { pattern: /\b(alkane|alkene|functional group|catenation)\b/i, reason: 'Organic chemistry belongs to Chapters 13 & 14.' }
      );
    } else if (normTopic.includes('acid') || normTopic.includes('base') || normTopic.includes('salt')) {
      requiredKeywords.push('arrhenius', 'acid', 'base', 'salt', 'ph', 'poh', 'indicator', 'neutralization', 'litmus', 'phenolphthalein', 'hydronium', 'hydroxide');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(rutherford model|bohr orbit|electronic configuration 1s|isotopes of carbon)\b/i, reason: 'Belongs to Atomic Structure chapter.' },
        { pattern: /\b(alkane|alkene|functional group|hydrocarbon)\b/i, reason: 'Belongs to Organic Chemistry.' }
      );
    } else if (normTopic.includes('periodic table') || normTopic.includes('periodicity')) {
      requiredKeywords.push('periodic table', 'period', 'group', 'atomic radius', 'ionization energy', 'electron affinity', 'electronegativity', 'moseley', 'mendeleev', 'noble gases', 'halogens', 'alkali metals');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(moles? of (pure )?water|empirical formula calculation|stoichiometric)\b/i, reason: 'Belongs to Stoichiometry chapter.' },
        { pattern: /\b(titration|ph value|indicator color)\b/i, reason: 'Belongs to Acids & Bases.' }
      );
    } else if (normTopic.includes('bonding')) {
      requiredKeywords.push('ionic bond', 'covalent bond', 'coordinate covalent', 'dative', 'octet rule', 'duplet rule', 'polar', 'non-polar', 'metallic bond', 'hydrogen bonding', 'lattice energy');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(rutherford scattering|discovery of neutron|canal rays)\b/i, reason: 'Belongs to Atomic Structure chapter.' },
        { pattern: /\b(le chatelier|equilibrium constant kc)\b/i, reason: 'Belongs to Equilibrium.' }
      );
    } else if (normTopic.includes('organic') || normTopic.includes('hydrocarbon')) {
      requiredKeywords.push('organic', 'carbon', 'catenation', 'tetravalency', 'hydrocarbon', 'alkane', 'alkene', 'alkyne', 'functional group', 'alcohol', 'aldehyde', 'ketone', 'carboxylic acid', 'ester', 'methane', 'ethane', 'ethene', 'ethyne');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(rutherford|bohr radius|discovery of electron|alpha particle scattering)\b/i, reason: 'Belongs to Atomic Structure chapter.' },
        { pattern: /\b(galvanic cell|electrolysis of molten nacl)\b/i, reason: 'Belongs to Electrochemistry.' }
      );
    } else if (normTopic.includes('electrochemistry')) {
      requiredKeywords.push('oxidation', 'reduction', 'redox', 'oxidation state', 'oxidizing agent', 'reducing agent', 'electrolytic cell', 'galvanic cell', 'voltaic cell', 'anode', 'cathode', 'electrolysis', 'electroplating', 'corrosion', 'cell', 'downs', 'nelson', 'electrode', 'electrolyte', 'potential', 'she');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(rutherford|bohr model|energy level mvr)\b/i, reason: 'Belongs to Atomic Structure.' },
        { pattern: /\b(alkane|alkene|catenation)\b/i, reason: 'Belongs to Organic Chemistry.' }
      );
    }
  } else if (normSub.includes('math')) {
    if (normTopic.includes('real number') || normTopic.includes('radical')) {
      requiredKeywords.push(
        'real number', 'rational', 'irrational', 'integer', 'natural number', 'whole number',
        'surd', 'radical', 'radicand', 'index', 'laws of exponents', 'laws of radicals',
        'conjugate', 'rationaliz', 'closure property', 'commutative property', 'associative property',
        'distributive property', 'additive identity', 'multiplicative identity', 'additive inverse',
        'multiplicative inverse', 'trichotomy', 'transitive', 'imaginary unit', 'complex number',
        'real part', 'imaginary part', 'terminating decimal', 'non-terminating', 'recurring',
        'sqrt', 'cube root', 'power', 'fraction', 'simplest radical form'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|log_|\blog\b|mantissa|characteristic of log|antilog)\b/i, reason: 'Logarithms concepts belong to Chapter 2 (Logarithms), not Real Numbers.' },
        { pattern: /\b(cartesian product|subset|universal set|venn diagram|null set|\bunion\b|\bintersection\b of sets)\b/i, reason: 'Set operations belong to Chapter 3 (Sets and Relations).' },
        { pattern: /\b(sin |cos |tan |trigonometr|bearing of|angle of elevation)\b/i, reason: 'Trigonometric ratios belong to Chapter 6 (Trigonometry and Bearing).' },
        { pattern: /\b(distance between the (two )?points|midpoint formula|collinear points in cartesian)\b/i, reason: 'Coordinate geometry belongs to Chapter 7 (Coordinate Geometry).' },
        { pattern: /\b(arithmetic mean|median of data|mode of data|standard deviation|frequency distribution|histogram)\b/i, reason: 'Statistics concepts belong to Chapter 11 (Basic Statistics).' },
        { pattern: /\b(factorize the polynomial|remainder theorem|factor theorem|hcf and lcm of polynomials)\b/i, reason: 'Polynomial factoring belongs to Chapter 4.' },
        { pattern: /\b(si base unit|velocity|acceleration|chemical equation|electron|cell organelle|surah|hadith|newton|joule)\b/i, reason: 'Cross-subject content (Science/Islamiat) is forbidden in Mathematics.' }
      );
    } else if (normTopic.includes('logarithm')) {
      requiredKeywords.push('logarithm', 'log', 'characteristic', 'mantissa', 'base', 'laws of logarithms', 'common logarithm', 'natural logarithm', 'antilogarithm', 'scientific notation');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(sin |cos |tan |trigonometr|bearing)\b/i, reason: 'Trigonometry belongs to Chapter 6.' },
        { pattern: /\b(matrix|determinant|distance between points)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('set') || normTopic.includes('relation')) {
      requiredKeywords.push('set', 'subset', 'union', 'intersection', 'complement', 'difference', 'cartesian product', 'relation', 'domain', 'range', 'function', 'venn diagram', 'de morgan');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|trigonometr|surds|radicals)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('factoriz') || normTopic.includes('algebraic')) {
      requiredKeywords.push('factor', 'factorize', 'algebraic expression', 'remainder theorem', 'factor theorem', 'hcf', 'lcm', 'middle term', 'difference of squares', 'sum of cubes', 'difference of cubes', 'identity');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|trigonometr|bearing|distance formula|arithmetic mean)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('linear equation') || normTopic.includes('inequalit')) {
      requiredKeywords.push('linear equation', 'inequality', 'absolute value', 'solution set', 'root', 'variable', 'number line');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|trigonometr|cartesian distance)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('trigonometr') || normTopic.includes('bearing')) {
      requiredKeywords.push('trigonometry', 'sine', 'cosine', 'tangent', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'hypotenuse', 'bearing', 'angle of elevation', 'angle of depression', 'pythagorean identity');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|surds|remainder theorem|frequency distribution)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('coordinate')) {
      requiredKeywords.push('coordinate', 'cartesian', 'distance formula', 'midpoint formula', 'origin', 'quadrant', 'abscissa', 'ordinate', 'collinear');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|trigonometr|remainder theorem)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('statistic')) {
      requiredKeywords.push('statistics', 'frequency', 'mean', 'median', 'mode', 'range', 'variance', 'standard deviation', 'histogram', 'frequency polygon', 'cumulative frequency');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(logarithm|trigonometr|surds|cartesian)\b/i, reason: 'Belongs to other chapters.' }
      );
    }
  } else if (normSub.includes('bio')) {
    if (normTopic.includes('cell cycle') || normTopic.includes('mitosis') || normTopic.includes('meiosis')) {
      requiredKeywords.push('cell cycle', 'interphase', 'mitosis', 'meiosis', 'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis', 'karyokinesis', 'g1', 's phase', 'g2', 'g0', 'spindle', 'centrosome', 'centriole', 'sister chromatid', 'homologous', 'synapsis', 'chiasma', 'crossing over', 'bivalent', 'tetrad', 'apoptosis', 'necrosis', 'cleavage furrow', 'phragmoplast', 'cell plate', 'cancer', 'tumor', 'cyclin');
    } else if (normTopic.includes('the cell') || normTopic.includes('cell structure')) {
      requiredKeywords.push('cell', 'organelle', 'nucleus', 'mitochondria', 'ribosome', 'chloroplast', 'endoplasmic reticulum', 'golgi', 'cell wall', 'membrane', 'prokaryote', 'eukaryote', 'osmosis', 'diffusion', 'lysosome', 'vacuole', 'centriole', 'microscope', 'microscopy', 'magnification', 'resolution', 'sem', 'tem', 'cytoplasm', 'cristae', 'granum', 'thylakoid', 'plastid', 'fluid mosaic', 'phospholipid', 'peptidoglycan');
    } else if (normTopic.includes('molecular biology')) {
      requiredKeywords.push('dna', 'rna', 'protein', 'lipid', 'carbohydrate', 'nucleotide', 'amino acid', 'peptide', 'polypeptide', 'phospholipid', 'glucose', 'monosaccharide', 'polysaccharide', 'adenine', 'thymine', 'guanine', 'cytosine', 'uracil', 'double helix', 'watson', 'crick', 'ester bond', 'glycosidic', 'triglyceride', 'fatty acid', 'hydrogen bond', 'nitrogenous base', 'vitamin', 'ascorbic', 'scurvy', 'rickets', 'water', 'mineral', 'collagen', 'starch', 'glycogen', 'cellulose');
    } else if (normTopic.includes('science of biology')) {
      requiredKeywords.push('biology', 'scientific method', 'hypothesis', 'observation', 'experiment', 'deduction', 'theory', 'law', 'bioeconomics', 'biophysics', 'biochemistry', 'biometry', 'biogeography', 'zoology', 'botany', 'microbiology', 'morphology', 'anatomy', 'histology', 'physiology', 'genetics', 'ecology', 'jabir ibn hayyan', 'abdul malik asmai', 'bu ali sina', 'quantitative', 'qualitative', 'biosphere', 'population', 'community', 'biome', 'organism', 'organization', 'subatomic', 'molecule', 'brassica', 'mustard', 'rana tigrina', 'frog', 'amoeba', 'volvox');
    } else if (normTopic.includes('tissue') || normTopic.includes('organ')) {
      requiredKeywords.push('tissue', 'organ', 'organ system', 'epithelial', 'connective', 'muscle', 'nervous', 'xylem', 'phloem', 'meristematic', 'meristem', 'parenchyma', 'collenchyma', 'sclerenchyma', 'epidermal', 'ground tissue', 'stomach', 'heart', 'liver', 'root', 'stem', 'leaf', 'neuron', 'axon', 'dendrite', 'matrix');
    } else if (normTopic.includes('biodiversity')) {
      requiredKeywords.push('biodiversity', 'classification', 'species', 'genus', 'family', 'order', 'class', 'phylum', 'kingdom', 'monera', 'protista', 'fungi', 'plantae', 'animalia', 'linnaeus', 'whittaker', 'binomial nomenclature', 'scientific name', 'deforestation', 'endangered', 'conservation', 'taxa', 'taxonomy', 'flora', 'fauna', 'virus', 'viruses', 'prion', 'viroid', 'acellular', 'crystalliz', 'three kingdom', 'two kingdom', 'five kingdom', 'markhor', 'indus dolphin', 'snow leopard', 'houbara', 'chakor', 'national animal', 'national bird', 'habitat loss', 'poaching', 'wwf');
    } else if (normTopic.includes('metabolism') || normTopic.includes('enzyme')) {
      requiredKeywords.push('metabolism', 'anabolism', 'catabolism', 'enzyme', 'substrate', 'active site', 'lock and key', 'induced fit', 'koshland', 'fischer', 'activation energy', 'denaturation', 'inhibitor', 'coenzyme', 'cofactor', 'prosthetic group', 'temperature', 'ph', 'atp', 'adenosine triphosphate');
    } else if (normTopic.includes('plant physiology') || normTopic.includes('photosynthesis') || normTopic.includes('respiration')) {
      requiredKeywords.push('photosynthesis', 'respiration', 'chlorophyll', 'light reaction', 'dark reaction', 'calvin cycle', 'glycolysis', 'krebs cycle', 'atp', 'transpiration', 'stomata', 'guard cell', 'xylem', 'phloem', 'cohesion-tension', 'potometer', 'osmosis', 'turgor', 'aerobic', 'anaerobic', 'fermentation', 'electron transport');
    } else if (normTopic.includes('plant reproduction')) {
      requiredKeywords.push('reproduction', 'flower', 'stamen', 'carpel', 'pistil', 'anther', 'pollen', 'ovule', 'ovary', 'pollination', 'fertilization', 'double fertilization', 'endosperm', 'zygote', 'seed', 'fruit', 'germination', 'hypogeal', 'epigeal', 'asexual', 'sexual', 'vegetative', 'cutting', 'grafting', 'microspore', 'megaspore', 'corm', 'bulb', 'rhizome', 'tuber', 'runner', 'sucker', 'propagation');
    } else if (normTopic.includes('evolution')) {
      requiredKeywords.push('evolution', 'natural selection', 'darwin', 'lamarck', 'adaptation', 'speciation', 'fossil', 'paleontology', 'homologous', 'analogous', 'vestigial', 'variation', 'origin of species', 'fitness', 'gene pool', 'geological time', 'ancestor');
    }
  } else if (normSub.includes('comp') || normSub.includes('cs')) {
    if (normTopic.includes('fundamental') || normTopic.includes('hardware') || normTopic.includes('introduction')) {
      requiredKeywords.push('computer', 'cpu', 'alu', 'cu', 'ram', 'rom', 'input device', 'output device', 'motherboard', 'bus', 'system software', 'application software', 'operating system', 'bit', 'byte');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(sql query|select from where|database table|primary key|foreign key)\b/i, reason: 'Databases belong to Chapter 7/Database chapter.' },
        { pattern: /\b(loop in c|printf|scanf|int main|pointer in c)\b/i, reason: 'Programming in C belongs to Chapters 5 & 6.' }
      );
    } else if (normTopic.includes('network') || normTopic.includes('communication')) {
      requiredKeywords.push('network', 'lan', 'wan', 'man', 'pan', 'topology', 'star topology', 'bus topology', 'ring topology', 'mesh topology', 'ip address', 'router', 'switch', 'modem', 'transmission media', 'fiber optic', 'twisted pair', 'coaxial');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(c programming syntax|database normalization)\b/i, reason: 'Belongs to other chapters.' }
      );
    }
  }

  return {
    subject: canonicalSubject,
    chapter: chapterName,
    chapterNumber: matchedChapter?.number,
    subtopics,
    guidelines,
    requiredKeywords,
    forbiddenCrossChapterPatterns,
    isFullSyllabus: false,
  };
}

