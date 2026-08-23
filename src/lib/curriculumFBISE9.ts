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
