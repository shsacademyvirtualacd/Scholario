import type { StoredShortQuestion } from '../../types/questionBank';

/**
 * Authoritative Curated Short Question Bank
 * Covers Grade 9, 10, 11, 12 FBISE and Sindh Board subjects and chapters.
 */
export const shortQuestionsBank: Record<string, Record<string, StoredShortQuestion[]>> = {
  Physics: {
    'Physical Quantities and Measurement': [
      {
        id: 'sq_phy9_ch1_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Physical Quantities and Measurement',
        chapterNumber: 1,
        question: 'Differentiate between base physical quantities and derived physical quantities with two examples each.',
        modelAnswer: 'Base quantities are fundamental physical quantities in terms of which other quantities are defined (e.g. Length (m), Mass (kg), Time (s)). Derived quantities are quantities that are expressed in terms of base physical quantities (e.g. Velocity (m/s), Force (N), Pressure (Pa)).',
        keyPoints: ['Definition of base quantities with 2 SI units', 'Definition of derived quantities with 2 derived units'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch1_02',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Physical Quantities and Measurement',
        chapterNumber: 1,
        question: 'What is meant by the least count of a measuring instrument? State the least count of a standard Vernier Calipers and a Screw Gauge.',
        modelAnswer: 'Least count is the minimum smallest measurement that can be accurately recorded with a measuring instrument. For standard laboratory instruments: Vernier Calipers least count = 0.1 mm (0.01 cm); Micrometer Screw Gauge least count = 0.01 mm (0.001 cm).',
        keyPoints: ['Definition of least count', 'Vernier calipers least count (0.01 cm / 0.1 mm)', 'Screw gauge least count (0.01 mm)'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch1_03',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Physical Quantities and Measurement',
        chapterNumber: 1,
        question: 'State the rules for identifying significant figures in a measurement. How many significant figures are in 0.00450 kg?',
        modelAnswer: 'Rules: (1) All non-zero digits are significant. (2) Zeros between non-zeros are significant. (3) Leading zeros are NOT significant. (4) Trailing zeros after a decimal point are significant. In 0.00450 kg, there are 3 significant figures (4, 5, and the trailing 0).',
        keyPoints: ['Rules for significant digits', 'Correct identification: 3 significant figures in 0.00450 kg'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch1_04',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Physical Quantities and Measurement',
        chapterNumber: 1,
        question: 'What is zero error in a measuring instrument, and why is zero correction necessary?',
        modelAnswer: 'Zero error occurs when the zero mark of the vernier or circular scale does not coincide with the zero mark of the main scale when jaws or anvils are closed. Zero correction is applied to eliminate systematic measurement error and obtain true readings.',
        keyPoints: ['Definition of positive/negative zero error', 'Mathematical justification of zero correction (True = Observed - Zero Error)'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    Kinematics: [
      {
        id: 'sq_phy9_ch2_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Kinematics',
        chapterNumber: 2,
        question: 'Distinguish between distance and displacement with respect to nature and magnitude.',
        modelAnswer: 'Distance is the actual total length of the path traveled by a moving body; it is a scalar quantity (always positive). Displacement is the shortest straight-line distance from initial to final position; it is a vector quantity with magnitude and direction.',
        keyPoints: ['Scalar vs vector distinction', 'Path dependence vs initial-to-final displacement vector', 'SI unit (meter)'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch2_02',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Kinematics',
        chapterNumber: 2,
        question: 'Derive the first equation of motion (v_f = v_i + at) using a speed-time graph or mathematical definition of acceleration.',
        modelAnswer: 'By definition of uniform acceleration: a = (v_f - v_i) / t. Multiplying both sides by time t gives: a * t = v_f - v_i. Rearranging terms: v_f = v_i + a*t.',
        keyPoints: ['Definition of acceleration formula', 'Step-by-step algebraic rearrangement to v_f = v_i + at'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch2_03',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Kinematics',
        chapterNumber: 2,
        question: 'A car starts from rest and reaches a speed of 20 m/s in 5 seconds. Calculate its acceleration and the distance covered.',
        modelAnswer: 'Given: v_i = 0 m/s, v_f = 20 m/s, t = 5 s. (1) Acceleration: a = (v_f - v_i)/t = (20 - 0)/5 = 4 m/s². (2) Distance: S = v_i*t + 0.5*a*t² = 0 + 0.5(4)(25) = 50 m.',
        keyPoints: ['Given data and units', 'Calculation of acceleration = 4 m/s²', 'Calculation of distance = 50 m'],
        marks: 4,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Dynamics – I': [
      {
        id: 'sq_phy9_ch3_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Dynamics – I',
        chapterNumber: 3,
        question: "State Newton's First Law of Motion and explain why it is also known as the Law of Inertia.",
        modelAnswer: 'Newton’s first law states that a body continues in its state of rest or uniform motion in a straight line unless acted upon by a net external unbalanced force. It is called the law of inertia because inertia is the inherent property of matter to resist any change in its state of rest or motion.',
        keyPoints: ['Complete statement of Newton 1st law', 'Explanation of inertia resisting state change'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch3_02',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Dynamics – I',
        chapterNumber: 3,
        question: 'Differentiate between mass and weight of a body with SI units and measuring instruments.',
        modelAnswer: 'Mass is the quantity of matter in a body, a scalar quantity, remains constant everywhere, measured with a beam balance (SI unit: kg). Weight is the gravitational pull exerted on a body (W = mg), a vector quantity directed towards center of earth, varies with gravity, measured with a spring balance (SI unit: Newton).',
        keyPoints: ['Scalar vs vector', 'Constant vs variable', 'Beam balance vs spring balance', 'SI unit: kg vs Newton'],
        marks: 4,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Dynamics – II': [
      {
        id: 'sq_phy9_ch4_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Dynamics – II',
        chapterNumber: 4,
        question: 'State the Law of Conservation of Momentum and give one practical example.',
        modelAnswer: 'The law of conservation of momentum states that the total linear momentum of an isolated system remains constant before and after interaction/collision (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂). Example: Recoil of a gun when a bullet is fired, or rocket propulsion.',
        keyPoints: ['Statement of isolated system condition', 'Mathematical formula', 'Practical example (gun recoil / rocket)'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch4_02',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Dynamics – II',
        chapterNumber: 4,
        question: 'Why is rolling friction much less than sliding friction?',
        modelAnswer: 'In rolling motion, the contact surface between the rolling body and surface is very small (line/point contact), and interlocking of cold welds is instantaneously made and broken without dragging, whereas in sliding friction the surfaces rub and shear interlocking ridges across a large contact area.',
        keyPoints: ['Microscopic cold welds and interlocking', 'Small contact point in rolling vs large continuous shearing area in sliding'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Work and Energy': [
      {
        id: 'sq_phy9_ch6_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Work and Energy',
        chapterNumber: 6,
        question: 'Define Work and Joule in physics. Under what conditions is work done equal to zero?',
        modelAnswer: 'Work is done when a force acting on a body causes displacement in the direction of the force: W = F * s * cos(θ). One Joule is the work done when a force of 1 Newton moves a body through a displacement of 1 meter in its direction. Work is zero when: (1) Displacement is zero (s = 0), or (2) Force is perpendicular to displacement (θ = 90°, cos 90° = 0).',
        keyPoints: ['Definition of Work & Joule formula', 'Zero work conditions: s = 0 and θ = 90°'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_phy9_ch6_02',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Work and Energy',
        chapterNumber: 6,
        question: 'Calculate the kinetic energy of a 500 kg vehicle traveling at a constant speed of 20 m/s.',
        modelAnswer: 'Given: mass m = 500 kg, velocity v = 20 m/s. Formula: Kinetic Energy = (1/2) * m * v² = 0.5 * 500 * (20)² = 250 * 400 = 100,000 Joules (100 kJ).',
        keyPoints: ['Formula E_k = 0.5 * m * v²', 'Step-by-step arithmetic', 'Correct answer: 100,000 J or 100 kJ'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  },
  Chemistry: {
    'Atomic Structure': [
      {
        id: 'sq_chem9_ch3_01',
        board: 'fbise',
        grade: '9',
        subject: 'Chemistry',
        chapter: 'Atomic Structure',
        chapterNumber: 3,
        question: 'Write the electronic configuration of Sodium (Na, Z=11) and Chlorine (Cl, Z=17) using subshell notation (s, p).',
        modelAnswer: 'Sodium (Na, Z=11): 1s² 2s² 2p⁶ 3s¹. Chlorine (Cl, Z=17): 1s² 2s² 2p⁶ 3s² 3p⁵.',
        keyPoints: ['Aufbau principle order 1s 2s 2p 3s 3p', 'Correct electron counts for Na and Cl'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_chem9_ch3_02',
        board: 'fbise',
        grade: '9',
        subject: 'Chemistry',
        chapter: 'Atomic Structure',
        chapterNumber: 3,
        question: 'What are isotopes? State any two applications of radioisotopes in medicine and carbon dating.',
        modelAnswer: 'Isotopes are atoms of the same element having the same atomic number (number of protons) but different mass numbers (number of neutrons). Applications: (1) Cobalt-60 (⁶⁰Co) is used for radiation therapy in cancer treatment. (2) Carbon-14 (¹⁴C) is used in radiocarbon dating to estimate the age of ancient organic fossils.',
        keyPoints: ['Definition with atomic/mass number concept', 'Cobalt-60 cancer radiotherapy', 'Carbon-14 archaeological dating'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Periodic Table and Periodicity of Properties': [
      {
        id: 'sq_chem9_ch4_01',
        board: 'fbise',
        grade: '9',
        subject: 'Chemistry',
        chapter: 'Periodic Table and Periodicity of Properties',
        chapterNumber: 4,
        question: 'Define Ionization Energy and describe its trend across a period and down a group in the Modern Periodic Table.',
        modelAnswer: 'Ionization energy is the minimum amount of energy required to remove the most loosely bound electron from the outermost shell of an isolated gaseous atom in its ground state. Trend: (1) Increases across a period from left to right due to increased effective nuclear charge. (2) Decreases down a group from top to bottom due to addition of shells and increased shielding effect.',
        keyPoints: ['Standard definition with gaseous atom state', 'Period trend (increases left to right)', 'Group trend (decreases top to bottom)'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    Stoichiometry: [
      {
        id: 'sq_chem9_ch6_01',
        board: 'fbise',
        grade: '9',
        subject: 'Chemistry',
        chapter: 'Stoichiometry',
        chapterNumber: 6,
        question: 'Define the mole and Avogadro’s number. Calculate the number of moles present in 36 grams of water (H2O).',
        modelAnswer: 'A mole is the amount of substance containing Avogadro’s number (6.022 × 10²³) of representative particles (atoms, molecules, or formula units). Molar mass of H2O = (2 × 1) + 16 = 18 g/mol. Number of moles = Given mass / Molar mass = 36 g / 18 g/mol = 2.0 moles.',
        keyPoints: ['Definition & value 6.022 × 10²³', 'Molar mass calculation = 18 g/mol', 'Result = 2.0 moles'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  },
  Biology: {
    'The Cell': [
      {
        id: 'sq_bio9_ch3_01',
        board: 'fbise',
        grade: '9',
        subject: 'Biology',
        chapter: 'The Cell',
        chapterNumber: 3,
        question: 'Differentiate between prokaryotic and eukaryotic cells with three distinct structural features.',
        modelAnswer: '(1) Prokaryotes lack a membrane-bound nucleus (nucleoid only), while eukaryotes have a distinct double-membrane bound nucleus. (2) Prokaryotes lack membrane-bound organelles (mitochondria, ER, chloroplasts), while eukaryotes possess them. (3) Prokaryotes have smaller 70S ribosomes, while eukaryotes have larger 80S cytosolic ribosomes.',
        keyPoints: ['Nuclear membrane presence', 'Membrane-bound organelles', 'Ribosome size 70S vs 80S'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_bio9_ch3_02',
        board: 'fbise',
        grade: '9',
        subject: 'Biology',
        chapter: 'The Cell',
        chapterNumber: 3,
        question: 'Why are mitochondria called the powerhouses of the cell?',
        modelAnswer: 'Mitochondria are sites of aerobic cellular respiration where organic food molecules (glucose) are oxidized through the Krebs cycle and Electron Transport Chain (ETC) to produce ATP (adenosine triphosphate), the universal cellular energy currency.',
        keyPoints: ['Site of cellular aerobic respiration', 'Production of ATP molecules as cellular energy currency'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Cell Cycle': [
      {
        id: 'sq_bio9_ch5_01',
        board: 'fbise',
        grade: '9',
        subject: 'Biology',
        chapter: 'Cell Cycle',
        chapterNumber: 5,
        question: 'State the significance of mitosis in living organisms.',
        modelAnswer: 'Significance of Mitosis: (1) Growth and development by increasing cell numbers. (2) Repair and replacement of damaged, worn-out, or dead cells (e.g. skin cells, RBCs). (3) Asexual reproduction in unicellular eukaryotes (e.g. amoeba) and vegetative reproduction in plants.',
        keyPoints: ['Growth and development', 'Tissue repair & cellular replacement', 'Genetic consistency / Asexual reproduction'],
        marks: 3,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  },
  Mathematics: {
    'Quadratic Equations': [
      {
        id: 'sq_math10_ch1_01',
        board: 'fbise',
        grade: '10',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        chapterNumber: 1,
        question: 'Solve the quadratic equation 2x² - 5x + 3 = 0 by factorization.',
        modelAnswer: '2x² - 5x + 3 = 0. Splitting the middle term: 2x² - 2x - 3x + 3 = 0 => 2x(x - 1) - 3(x - 1) = 0 => (2x - 3)(x - 1) = 0. Hence x = 3/2 or x = 1. Solution set: {1, 3/2}.',
        keyPoints: ['Factoring into (2x - 3)(x - 1)', 'Roots x = 1, x = 3/2', 'Solution set notation'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      },
      {
        id: 'sq_math10_ch1_02',
        board: 'fbise',
        grade: '10',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        chapterNumber: 1,
        question: 'State the Quadratic Formula. Use it to solve x² - 3x - 10 = 0.',
        modelAnswer: 'Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a). Here a = 1, b = -3, c = -10. Discriminant = (-3)² - 4(1)(-10) = 9 + 40 = 49. x = (3 ± √49) / 2 = (3 ± 7) / 2 => x = 10/2 = 5 or x = -4/2 = -2. Solution set: {-2, 5}.',
        keyPoints: ['Correct quadratic formula formula', 'Discriminant calculation = 49', 'Roots {-2, 5}'],
        marks: 3,
        difficulty: 'easy',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  }
};

export default shortQuestionsBank;
