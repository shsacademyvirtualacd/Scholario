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
  Islamiat: {
    subject: 'Islamiat',
    aliases: ['islamiat', 'islamiyat', 'islamic studies', 'isl'],
    guidelines: 'Questions must be strictly grounded in the official Grade 9 FBISE Islamiat curriculum chapters. Test genuine Quranic/Hadith references, historical events of the Madani era, Seerat-un-Nabi (PBUH), Islamic ethics, societal transactions, and prominent Islamic personalities. Do NOT invent references.',
    chapters: [
      { id: 'isl_ch1', number: 1, name: 'باب اول — قرآن مجید کی تدوین و حفاظت، حفاظتِ حدیث نبویؐ', subtopics: ['نزولِ قرآن اور کتابتِ وحی', 'عہدِ صدیقی اور عہدِ عثمانی میں تدوین و حفاظتِ قرآن', 'حفاظتِ حدیث اور صحابہ کرام کی مساعی', 'کتبِ احادیث (صحاحِ ستہ تعارف)'] },
      { id: 'isl_ch2', number: 2, name: 'باب دوم — ایمانیات و عبادات', subtopics: ['توحید اور اس کے انسانی زندگی پر اثرات', 'رسالت اور ختمِ نبوتؐ پر پختہ ایمان', 'آخرت اور جزا و سزا کا تصور', 'نماز، روزہ، زکوٰۃ اور حج کی روحانی و معاشرتی اہمیت'] },
      { id: 'isl_ch3', number: 3, name: 'باب سوم — سیرتِ نبویؐ کا مدنی دور اور اسوۂ رسولؐ', subtopics: ['ہجرتِ مدینہ اور میثاقِ مدینہ', 'مواخاتِ مدینہ کی اہمیت', 'غزوہ بدر، غزوہ احد، غزوہ خندق، صلح حدیبیہ اور فتح مکہ', 'حجۃ الوداع کا خطبہ اور انسانی حقوق کا اولین چارٹر', 'رسول اللہؐ کا اسوۂ حسنہ (رحمت للعالمین)'] },
      { id: 'isl_ch4', number: 4, name: 'باب چہارم — اخلاق و آداب', subtopics: ['صدق و دیانت داری', 'حیا اور پاکدامنی', 'عفو و درگزر اور بردباری', 'ایفائے عہد اور امانت داری', 'تکبر، غیبت، جھوٹ اور حسد کی ممانعت'] },
      { id: 'isl_ch5', number: 5, name: 'باب پنجم — حسنِ معاملات و معاشرت', subtopics: ['والدین اور اساتذہ کے حقوق و آداب', 'صلہ رحمی اور پڑوسیوں کے حقوق', 'کسبِ حلال اور تجارت کے اسلامی اصول', 'سود، ذخیرہ اندوزی اور ناپ تول میں کمی کی ممانعت'] },
      { id: 'isl_ch6', number: 6, name: 'باب ششم — ہدایت کے سرچشمے اور مشاہیرِ اسلام', subtopics: ['حضرت ابوبکر صدیقؓ کی سیرت و کارنامے', 'حضرت عمر فاروقؓ کی سیرت و فتوحات', 'حضرت عثمان غنیؓ کی سیرت و جود و سخا', 'حضرت علی المرتضیٰؓ کی شجاعت و علم', 'امہات المؤمنینؓ اور صحابیاتؓ کا اسوہ', 'ائمہ اربعہ اور مسلم سائنسدان'] },
      { id: 'isl_ch7', number: 7, name: 'باب ہفتم — اسلامی تعلیمات اور عصرِ حاضر کے تقاضے', subtopics: ['اتحاد بین المسلمین اور فرقہ واریت کا خاتمہ', 'اسلام اور سائنس و ٹیکنالوجی', 'ماحولیاتی آلودگی اور شجرکاری کی اسلامی تعلیمات', 'سوشل میڈیا کا ذمہ دارانہ استعمال اور اسلامی آداب'] },
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

  const subjectData = FBISE_GRADE_9_CURRICULUM[canonicalSubject];
  let matchedChapter: ChapterDef | undefined;

  if (subjectData) {
    matchedChapter = subjectData.chapters.find((ch) => {
      const chNorm = ch.name.toLowerCase();
      return chNorm === normTopic || chNorm.includes(normTopic) || normTopic.includes(chNorm);
    });
  }

  const chapterName = matchedChapter?.name || rawTopic;
  const subtopics = matchedChapter?.subtopics || [chapterName];
  const guidelines = subjectData?.guidelines || '';

  // Subject-specific keyword scopes and anti-bleed forbidden patterns
  const normSub = canonicalSubject.toLowerCase();
  const requiredKeywords: string[] = [];
  const forbiddenCrossChapterPatterns: { pattern: RegExp; reason: string }[] = [];

  if (normSub.includes('chem')) {
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
      requiredKeywords.push('mole', 'molar mass', 'avogadro', 'amu', 'formula mass', 'empirical formula', 'percentage composition', 'limiting reactant', 'stoichiometric');
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
      requiredKeywords.push('oxidation', 'reduction', 'redox', 'oxidation state', 'oxidizing agent', 'reducing agent', 'electrolytic cell', 'galvanic cell', 'voltaic cell', 'anode', 'cathode', 'electrolysis', 'electroplating', 'corrosion');
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
  } else if (normSub.includes('isl')) {
    // Islamiyat anti-science / anti-cross-subject patterns
    forbiddenCrossChapterPatterns.push(
      { pattern: /\b(si unit|newton|joule|pascal|molar mass|stoichiometr|chemical reaction|velocity|acceleration|polynomial|quadratic|logarithm|mitosis|chloroplast|organelle|quantitative analysis|titration|gravitational)\b/i, reason: 'Science/Math concepts are completely invalid in Islamiat.' }
    );

    if (normTopic.includes('ایمانیات') || normTopic.includes('عبادات') || normTopic.includes('iman') || normTopic.includes('ibad') || normTopic.includes('bab 2') || normTopic.includes('باب دوم')) {
      requiredKeywords.push(
        'ایمان', 'توحید', 'شرک', 'رسالت', 'ختم نبوت', 'ملائکہ', 'فرشتے', 'کتب', 'تورات', 'زبور', 'انجیل', 'قرآن',
        'آخرت', 'قیامت', 'جزا و سزا', 'برزخ', 'بعث', 'میزان', 'صراط', 'جنت', 'جہنم', 'نماز', 'صلوٰۃ', 'روزہ', 'صوم',
        'زکوٰۃ', 'نصاب', 'حج', 'احرام', 'طواف', 'وقوف عرفات', 'تولہ سونا', 'تولہ چاندی', 'مصارف زکوٰۃ', 'تقویٰ', 'ارکان اسلام',
        'عبادت', 'دعاء', 'جبرائیل', 'میکائیل', 'اسرافیل', 'عزرائیل', 'کلمہ',
        'tauheed', 'shirk', 'risalat', 'khatam-un-nabiyyin', 'malaika', 'angels', 'jibreel', 'mikaeel', 'israfeel', 'izraeel',
        'books', 'torah', 'zabur', 'injeel', 'quran', 'akhirah', 'hereafter', 'day of judgment', 'paradise', 'hell',
        'salat', 'namaz', 'prayer', 'sawm', 'roza', 'fasting', 'zakat', 'nisab', 'hajj', 'pilgrimage', 'arafat', 'tawaf', 'ihram', 'pillars of islam', 'worship'
      );
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(غزوہ بدر|غزوہ احد|غزوہ خندق|صلح حدیبیہ|فتح مکہ|میثاق مدینہ|مواخات|ہجرت مدینہ)\b/i, reason: 'Ghazwat and Seerat-un-Nabi belong to Bab 3 (Seerat-un-Nabi).' },
        { pattern: /\b(حضرت ابوبکر|حضرت عمر|حضرت عثمان|حضرت علی|خلفائے راشدین|جامع القرآن|فاتح ایران)\b/i, reason: 'Khulafa-e-Rashideen belong to Bab 6 (Mashahir).' },
        { pattern: /\b(کسبِ حلال|ناپ تول|سود کی ممانعت|ذخیرہ اندوزی|تجارت کے اصول)\b/i, reason: 'Muamlat and commerce belong to Bab 5.' },
        { pattern: /\b(صدق و دیانت|حیا و پاکدامنی|عفو و درگزر|ایفائے عہد|غیبت و تکبر)\b/i, reason: 'Akhlaq and moral etiquette belong to Bab 4.' }
      );
    } else if (normTopic.includes('قرآن') || normTopic.includes('حدیث') || normTopic.includes('bab 1') || normTopic.includes('باب اول')) {
      requiredKeywords.push('قرآن', 'حدیث', 'وحی', 'نزول', 'کتابت وحی', 'تدوین قرآن', 'حضرت زید بن ثابت', 'عہد صدیقی', 'عہد عثمانی', 'حفاظت حدیث', 'صحاح ستہ', 'بخاری', 'مسلم', 'ترمذی', 'ابوداؤد', 'نسائی', 'ابن ماجہ');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(نماز کے ارکان|زکوٰۃ کا نصاب|حج کا طریقہ|غزوہ بدر)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('سیرت') || normTopic.includes('مدنی') || normTopic.includes('bab 3') || normTopic.includes('باب سوم')) {
      requiredKeywords.push('ہجرت مدینہ', 'میثاق مدینہ', 'مواخات', 'غزوہ بدر', 'غزوہ احد', 'غزوہ خندق', 'احزاب', 'صلح حدیبیہ', 'بیعت رضوان', 'فتح مکہ', 'حجۃ الوداع', 'رحمت للعالمین', 'اسوہ حسنہ');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(زکوٰۃ کا نصاب|صحاح ستہ کے نام|تدوین قرآن کمیٹی)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('اخلاق') || normTopic.includes('آداب') || normTopic.includes('bab 4') || normTopic.includes('باب چہارم')) {
      requiredKeywords.push('اخلاق', 'آداب', 'صدق', 'دیانت', 'حیا', 'پاکدامنی', 'عفو', 'درگزر', 'بردباری', 'ایفائے عہد', 'امانت', 'تکبر', 'غیبت', 'جھوٹ', 'حسد');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(غزوہ بدر|زکوٰۃ کے مصارف|تدوین حدیث)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('معاملات') || normTopic.includes('معاشرت') || normTopic.includes('bab 5') || normTopic.includes('باب پنجم')) {
      requiredKeywords.push('والدین کے حقوق', 'اساتذہ کے حقوق', 'صلہ رحمی', 'پڑوسیوں کے حقوق', 'کسب حلال', 'تجارت کے اصول', 'سود کی ممانعت', 'ذخیرہ اندوزی', 'ناپ تول میں کمی', 'مطففین');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(غزوہ احد|تدوین قرآن|نماز کے فرائض)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('مشاہیر') || normTopic.includes('سرچشمے') || normTopic.includes('bab 6') || normTopic.includes('باب ششم')) {
      requiredKeywords.push('حضرت ابوبکر صدیق', 'حضرت عمر فاروق', 'حضرت عثمان غنی', 'حضرت علی المرتضی', 'امہات المؤمنین', 'حضرت خدیجہ', 'حضرت عائشہ', 'حضرت فاطمہ', 'خلفائے راشدین', 'جامع القرآن', 'ذوالنورین', 'فاتح خیبر');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(زکوٰۃ کا نصاب|نماز کے ارکان|سود کی حرمت)\b/i, reason: 'Belongs to other chapters.' }
      );
    } else if (normTopic.includes('عصری') || normTopic.includes('تعلیمات') || normTopic.includes('bab 7') || normTopic.includes('باب ہفتم')) {
      requiredKeywords.push('اتحاد بین المسلمین', 'فرقہ واریت', 'اسلام اور سائنس', 'ماحولیاتی آلودگی', 'شجرکاری', 'سوشل میڈیا', 'طلب العلم فریضۃ');
    }
  } else if (normSub.includes('phys')) {
    if (normTopic.includes('measurement') || normTopic.includes('physical quantit')) {
      requiredKeywords.push('base unit', 'derived unit', 'vernier', 'screw gauge', 'least count', 'zero error', 'significant figure', 'prefix', 'scientific notation', 'measuring cylinder', 'kelvin', 'meter', 'second', 'kilogram');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(equations of motion|speed-time graph|pascal's law|archimedes|magnetic pole)\b/i, reason: 'Belongs to other physics chapters.' }
      );
    } else if (normTopic.includes('kinematic')) {
      requiredKeywords.push('speed', 'velocity', 'acceleration', 'displacement', 'distance', 'scalar', 'vector', 'speed-time graph', 'equations of motion', 'free fall', 'gravity');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(vernier caliper least count|pascal's law|hydraulic lift|magnetic pole|hooke's law)\b/i, reason: 'Belongs to other physics chapters.' }
      );
    }
  } else if (normSub.includes('bio')) {
    if (normTopic.includes('cell')) {
      requiredKeywords.push('cell', 'organelle', 'nucleus', 'mitochondria', 'ribosome', 'chloroplast', 'endoplasmic reticulum', 'golgi', 'cell wall', 'membrane', 'prokaryote', 'eukaryote', 'osmosis', 'diffusion');
      forbiddenCrossChapterPatterns.push(
        { pattern: /\b(flower double fertilization|fossil paleontology|transpiration pull|mendel genetics)\b/i, reason: 'Belongs to other biology chapters.' }
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

