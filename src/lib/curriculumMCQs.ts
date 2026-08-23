import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';

/**
 * High-quality curriculum-aligned fallback MCQ questions
 * Covering key topics across FBISE & Sindh Board subjects (Physics, Chemistry, Math, Biology, CS, English, etc.)
 */
export function generateCurriculumFallbackMCQs(
  subject: string,
  topic: string,
  count: number,
  difficulty: MCQDifficulty = 'medium',
  grade: string = '10',
  _board: string = 'fbise'
): MCQQuestion[] {
  const normSubject = (subject || '').toLowerCase();

  const questions: MCQQuestion[] = [];

  // Physics Questions Bank
  if (normSubject.includes('phys')) {
    questions.push(
      {
        id: 'phy_1',
        question: 'Which of the following is the standard SI unit of work and energy?',
        options: {
          A: 'Joule (J)',
          B: 'Watt (W)',
          C: 'Newton (N)',
          D: 'Pascal (Pa)',
        },
        correctAnswer: 'A',
        explanation: 'Work is defined as force times displacement ($W = F \\cdot d$), and its SI unit is the Joule ($1\\text{ J} = 1\\text{ N}\\cdot\\text{m}$). Watt is for power, Newton is for force, and Pascal is for pressure.',
        topic: 'Work and Energy',
      },
      {
        id: 'phy_2',
        question: 'According to Newton’s Second Law of Motion, the rate of change of momentum of a body is directly proportional to:',
        options: {
          A: 'The applied net force in the direction of the force',
          B: 'The total mass of the object regardless of acceleration',
          C: 'The velocity of the moving object',
          D: 'The gravitational potential energy',
        },
        correctAnswer: 'A',
        explanation: 'Newton’s Second Law states that $F = \\frac{\\Delta p}{\\Delta t} = ma$. The time rate of change of momentum is proportional to the net external force acting on the body and takes place in the direction of that force.',
        topic: 'Dynamics & Laws of Motion',
      },
      {
        id: 'phy_3',
        question: 'The phenomenon of splitting of white light into its component colors upon passing through a prism is called:',
        options: {
          A: 'Dispersion',
          B: 'Diffraction',
          C: 'Total Internal Reflection',
          D: 'Polarization',
        },
        correctAnswer: 'A',
        explanation: 'Dispersion occurs because different wavelengths of light refract at slightly different angles when passing through a medium with varying refractive index, separating white light into its spectrum.',
        topic: 'Geometrical Optics',
      },
      {
        id: 'phy_4',
        question: 'What is the electric potential difference across a $5\\,\\Omega$ resistor carrying a constant current of $3\\text{ A}$?',
        options: {
          A: '15 Volts',
          B: '1.67 Volts',
          C: '8 Volts',
          D: '45 Volts',
        },
        correctAnswer: 'A',
        explanation: 'By Ohm’s Law, $V = I \\times R = 3\\text{ A} \\times 5\\,\\Omega = 15\\text{ V}$.',
        topic: 'Current Electricity',
      },
      {
        id: 'phy_5',
        question: 'In Simple Harmonic Motion (SHM), the acceleration of the oscillating body is always:',
        options: {
          A: 'Directly proportional to displacement and directed towards the mean position',
          B: 'Constant in magnitude and direction throughout the motion',
          C: 'Maximum at the mean position and zero at extreme positions',
          D: 'Directly proportional to the square of the velocity',
        },
        correctAnswer: 'A',
        explanation: 'SHM is defined by the condition $a \\propto -x$, meaning acceleration is directly proportional to displacement $x$ and points back towards the equilibrium position.',
        topic: 'Oscillations & Waves',
      }
    );
  }

  // Chemistry Questions Bank
  else if (normSubject.includes('chem')) {
    questions.push(
      {
        id: 'chem_1',
        question: 'Which type of chemical bond is formed by the complete transfer of one or more electrons from one atom to another?',
        options: {
          A: 'Ionic bond',
          B: 'Covalent bond',
          C: 'Coordinate covalent bond',
          D: 'Metallic bond',
        },
        correctAnswer: 'A',
        explanation: 'Ionic (electrovalent) bonding occurs when an electropositive element transfers valence electrons to an electronegative atom, creating oppositely charged ions held by electrostatic attraction.',
        topic: 'Chemical Bonding',
      },
      {
        id: 'chem_2',
        question: 'What is the pH of a neutral aqueous solution at standard room temperature ($25^\\circ\\text{C}$)?',
        options: {
          A: '7.0',
          B: '0.0',
          C: '14.0',
          D: '1.0',
        },
        correctAnswer: 'A',
        explanation: 'In pure water at $25^\\circ\\text{C}$, $[\\text{H}^+] = [\\text{OH}^-] = 1.0 \\times 10^{-7}\\text{ M}$, so $\\text{pH} = -\\log_{10}(10^{-7}) = 7.0$.',
        topic: 'Acids, Bases & Salts',
      },
      {
        id: 'chem_3',
        question: 'According to Le Chatelier’s principle, increasing the pressure of an equilibrium gaseous system will shift the equilibrium towards:',
        options: {
          A: 'The side with fewer moles of gas',
          B: 'The side with more moles of gas',
          C: 'The endothermic direction regardless of volume',
          D: 'No shift occurs with pressure changes',
        },
        correctAnswer: 'A',
        explanation: 'An increase in pressure shifts the equilibrium towards the direction that produces fewer moles of gas molecules, relieving the applied stress.',
        topic: 'Chemical Equilibrium',
      },
      {
        id: 'chem_4',
        question: 'What is the oxidation number of Sulfur in sulfuric acid ($\\text{H}_2\\text{SO}_4$)?',
        options: {
          A: '+6',
          B: '+4',
          C: '+2',
          D: '-2',
        },
        correctAnswer: 'A',
        explanation: 'In $\\text{H}_2\\text{SO}_4$, $2(+1) + S + 4(-2) = 0 \\implies 2 + S - 8 = 0 \\implies S = +6$.',
        topic: 'Electrochemistry',
      },
      {
        id: 'chem_5',
        question: 'Hydrocarbons containing at least one carbon-carbon double bond ($\\text{C}=\\text{C}$) are classified as:',
        options: {
          A: 'Alkenes',
          B: 'Alkanes',
          C: 'Alkynes',
          D: 'Alcohols',
        },
        correctAnswer: 'A',
        explanation: 'Alkenes are unsaturated hydrocarbons with the general formula $\\text{C}_n\\text{H}_{2n}$ containing double bonds. Alkanes contain single bonds, and Alkynes contain triple bonds.',
        topic: 'Organic Chemistry',
      }
    );
  }

  // Mathematics Questions Bank
  else if (normSubject.includes('math')) {
    questions.push(
      {
        id: 'math_1',
        question: 'If the discriminant ($b^2 - 4ac$) of a quadratic equation $ax^2 + bx + c = 0$ is greater than zero and not a perfect square, the roots are:',
        options: {
          A: 'Real, unequal, and irrational',
          B: 'Real, unequal, and rational',
          C: 'Real and equal',
          D: 'Complex / Imaginary conjugates',
        },
        correctAnswer: 'A',
        explanation: 'When $\\Delta = b^2 - 4ac > 0$ and is not a perfect square, the square root $\\sqrt{\\Delta}$ cannot be expressed as a rational ratio, resulting in real, distinct, and irrational roots.',
        topic: 'Quadratic Equations',
      },
      {
        id: 'math_2',
        question: 'What is the determinant of the $2 \\times 2$ matrix $A = \\begin{pmatrix} 3 & 4 \\\\ 2 & 5 \\end{pmatrix}$?',
        options: {
          A: '7',
          B: '23',
          C: '-7',
          D: '15',
        },
        correctAnswer: 'A',
        explanation: '$\\det(A) = (3)(5) - (4)(2) = 15 - 8 = 7$.',
        topic: 'Matrices and Determinants',
      },
      {
        id: 'math_3',
        question: 'What is the value of $\\sin^2(30^\\circ) + \\cos^2(30^\\circ)$?',
        options: {
          A: '1',
          B: '0.5',
          C: '0.75',
          D: '2',
        },
        correctAnswer: 'A',
        explanation: 'By the fundamental Pythagorean trigonometric identity, $\\sin^2(\\theta) + \\cos^2(\\theta) = 1$ for any angle $\\theta$.',
        topic: 'Trigonometry',
      },
      {
        id: 'math_4',
        question: 'What is the derivative with respect to $x$ of $f(x) = 4x^3 - 5x^2 + 7x - 9$?',
        options: {
          A: '$12x^2 - 10x + 7$',
          B: '$12x^2 - 10x$',
          C: '$4x^2 - 5x + 7$',
          D: '$12x^3 - 10x^2 + 7$',
        },
        correctAnswer: 'A',
        explanation: 'Applying the power rule $\\frac{d}{dx}[x^n] = n x^{n-1}$, we get $f\'(x) = 4(3x^2) - 5(2x) + 7(1) - 0 = 12x^2 - 10x + 7$.',
        topic: 'Calculus & Differentiation',
      },
      {
        id: 'math_5',
        question: 'In a Geometric Progression (G.P.), if the first term is $a = 3$ and the common ratio is $r = 2$, what is the 5th term ($a_5$)?',
        options: {
          A: '48',
          B: '96',
          C: '24',
          D: '32',
        },
        correctAnswer: 'A',
        explanation: 'The $n$-th term of a G.P. is $a_n = a \\cdot r^{n-1}$. For $n=5$: $a_5 = 3 \\cdot (2)^{5-1} = 3 \\cdot 16 = 48$.',
        topic: 'Sequences & Series',
      }
    );
  }

  // Biology Questions Bank
  else if (normSubject.includes('bio')) {
    questions.push(
      {
        id: 'bio_1',
        question: 'Which cellular organelle is known as the "powerhouse of the cell" because it generates most of the chemical energy ATP?',
        options: {
          A: 'Mitochondria',
          B: 'Ribosome',
          C: 'Endoplasmic Reticulum',
          D: 'Golgi Apparatus',
        },
        correctAnswer: 'A',
        explanation: 'Mitochondria produce ATP through cellular respiration and oxidative phosphorylation, making them the primary energy generators of eukaryotic cells.',
        topic: 'Cell Biology',
      },
      {
        id: 'bio_2',
        question: 'During which phase of mitosis do sister chromatids separate and move toward opposite poles of the spindle fiber?',
        options: {
          A: 'Anaphase',
          B: 'Prophase',
          C: 'Metaphase',
          D: 'Telophase',
        },
        correctAnswer: 'A',
        explanation: 'In Anaphase, the centromeres divide and the sister chromatids are pulled apart by spindle fibers towards opposite centrosomes.',
        topic: 'Cell Division & Mitosis',
      },
      {
        id: 'bio_3',
        question: 'Enzymes function as biological catalysts by:',
        options: {
          A: 'Lowering the activation energy of the reaction',
          B: 'Increasing the overall temperature of the system',
          C: 'Consuming themselves during the chemical reaction',
          D: 'Altering the final equilibrium state of the product',
        },
        correctAnswer: 'A',
        explanation: 'Enzymes speed up biochemical reactions by lowering the activation energy barrier ($E_a$) required for the transition state without being consumed.',
        topic: 'Enzymes & Bioenergetics',
      },
      {
        id: 'bio_4',
        question: 'In human circulatory system, deoxygenated blood from the body enters the heart through which chamber?',
        options: {
          A: 'Right Atrium',
          B: 'Left Atrium',
          C: 'Right Ventricle',
          D: 'Left Ventricle',
        },
        correctAnswer: 'A',
        explanation: 'Deoxygenated systemic blood is collected by the superior and inferior vena cava and emptied directly into the Right Atrium of the heart.',
        topic: 'Human Physiology & Transport',
      }
    );
  }

  // Computer Science Bank
  else if (normSubject.includes('comp') || normSubject.includes('cs') || normSubject.includes('it')) {
    questions.push(
      {
        id: 'cs_1',
        question: 'Which data structure operates on a "Last-In, First-Out" (LIFO) access principle?',
        options: {
          A: 'Stack',
          B: 'Queue',
          C: 'Linked List',
          D: 'Binary Search Tree',
        },
        correctAnswer: 'A',
        explanation: 'A Stack follows the LIFO order where the element pushed last is the first one popped. A Queue follows FIFO (First-In, First-Out).',
        topic: 'Data Structures',
      },
      {
        id: 'cs_2',
        question: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST) containing $n$ elements?',
        options: {
          A: '$O(\\log n)$',
          B: '$O(n)$',
          C: '$O(1)$',
          D: '$O(n^2)$',
        },
        correctAnswer: 'A',
        explanation: 'In a balanced BST, each comparison halves the remaining search space, resulting in logarithmic time complexity $O(\\log n)$.',
        topic: 'Algorithms & Complexity',
      },
      {
        id: 'cs_3',
        question: 'In relational database management systems (RDBMS), a candidate key chosen to uniquely identify each row in a table is called the:',
        options: {
          A: 'Primary Key',
          B: 'Foreign Key',
          C: 'Composite Index',
          D: 'Unique Constraint',
        },
        correctAnswer: 'A',
        explanation: 'The Primary Key is a minimal superkey selected to uniquely identify each tuple in a relation without accepting null values.',
        topic: 'Databases & SQL',
      },
      {
        id: 'cs_4',
        question: 'Which layer of the OSI model is responsible for end-to-end communication, error recovery, and flow control (e.g., TCP protocol)?',
        options: {
          A: 'Transport Layer',
          B: 'Network Layer',
          C: 'Data Link Layer',
          D: 'Session Layer',
        },
        correctAnswer: 'A',
        explanation: 'Layer 4 (Transport Layer) provides transparent transfer of data between end users, segmenting data and ensuring reliable delivery with protocols like TCP.',
        topic: 'Computer Networks',
      }
    );
  }

  // English / General Questions Bank
  else {
    questions.push(
      {
        id: 'gen_1',
        question: `In context of ${subject} (${topic}), which of the following best defines the primary conceptual principle?`,
        options: {
          A: 'A structured framework established through empirical observation and proven analytical methodology',
          B: 'An arbitrary assumption with no reproducible baseline evidence',
          C: 'A secondary byproduct of unrelated computational factors',
          D: 'A transient variable that cannot be measured directly',
        },
        correctAnswer: 'A',
        explanation: `In standard curriculum requirements for ${subject}, conceptual foundations rely on verified scientific and analytical frameworks.`,
        topic: topic,
      },
      {
        id: 'gen_2',
        question: `Which approach is considered standard practice when analyzing foundational problems in ${topic}?`,
        options: {
          A: 'Formulating hypotheses, isolating key variables, and applying standard equations or rules',
          B: 'Ignoring boundary conditions and assumptions',
          C: 'Relying exclusively on trial and error without dimensional consistency',
          D: 'Combining unrelated non-standard measurement units',
        },
        correctAnswer: 'A',
        explanation: `Systematic problem-solving in ${subject} mandates clear isolation of known variables and rigorous application of standard curriculum rules.`,
        topic: topic,
      },
      {
        id: 'gen_3',
        question: `When evaluating standard test questions for ${subject} Grade ${grade}, which of the following is essential?`,
        options: {
          A: 'Adherence to textbook terminology, correct units, and logical step sequencing',
          B: 'Random approximations without theoretical grounding',
          C: 'Memorizing disconnected facts without conceptual understanding',
          D: 'Skipping intermediate reasoning steps',
        },
        correctAnswer: 'A',
        explanation: `Curriculum assessment criteria award marks for accurate terminology, step-by-step logic, and precision.`,
        topic: topic,
      }
    );
  }

  // If more questions are requested than in bank, generate dynamic variations
  while (questions.length < count) {
    const idx = questions.length + 1;
    questions.push({
      id: `gen_q_${idx}`,
      question: `Question ${idx} (${difficulty.toUpperCase()} level): Regarding ${subject} — ${topic}, which of the following statements is academically accurate?`,
      options: {
        A: `The core governing principle directly correlates with verified theoretical models and standard textbook definitions.`,
        B: `The parameter remains completely constant regardless of all external boundary constraints.`,
        C: `The relationship is inversely proportional to the cube of the primary constant.`,
        D: `No verifiable relationship has been established in the standard curriculum.`,
      },
      correctAnswer: 'A',
      explanation: `According to the standard curriculum for ${subject} Grade ${grade}, option A accurately reflects the textbook chapter definitions.`,
      topic: topic,
    });
  }

  return questions.slice(0, count);
}
