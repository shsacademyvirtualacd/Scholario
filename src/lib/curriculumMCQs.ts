import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';
import { isGrade9FBISE } from './curriculumFBISE9';
import { getGrade9FBISEQuestions } from './fbise9QuestionsBank';

/**
 * High-quality curriculum-aligned MCQ questions
 * Covering key topics across FBISE & Sindh Board subjects (English, Physics, Chemistry, Math, Biology, CS, Pak Studies, Islamiat, etc.)
 */
export function generateCurriculumFallbackMCQs(
  subject: string,
  topic: string,
  count: number,
  difficulty: MCQDifficulty = 'medium',
  grade: string = '10',
  board: string = 'fbise',
  excludeTexts: string[] = []
): MCQQuestion[] {
  // Check if this is Grade 9 FBISE
  if (isGrade9FBISE(board, grade)) {
    const selectedChaps = topic && topic !== 'Full Syllabus' && topic !== 'Mixed Chapters' ? [topic] : [];
    const fbise9Questions = getGrade9FBISEQuestions(subject, selectedChaps, count, difficulty, excludeTexts);
    if (fbise9Questions.length > 0) {
      return fbise9Questions;
    }
  }

  const normSubject = (subject || '').toLowerCase();
  const normTopic = (topic || '').toLowerCase();
  const normExcludes = (excludeTexts || []).map((t) => t.trim().toLowerCase());

  const questions: MCQQuestion[] = [];

  // ==========================================
  // 1. ENGLISH (Grammar, Tenses, Voice, Speech, Vocabulary, Parts of Speech)
  // ==========================================
  if (normSubject.includes('eng')) {
    // Check for specific sub-topics or provide comprehensive English grammar bank
    if (normTopic.includes('tense') || normTopic.includes('verb') || normTopic.includes('gramm')) {
      questions.push(
        {
          id: 'eng_t1',
          question: 'Choose the correct form of the verb: "By the time the doctor arrived, the patient ______."',
          options: {
            A: 'had died',
            B: 'died',
            C: 'has died',
            D: 'was dying',
          },
          correctAnswer: 'A',
          explanation: 'When two actions occurred at different times in the past, the earlier completed action is expressed in the Past Perfect Tense ("had + past participle"), while the subsequent action takes Simple Past ("arrived").',
          topic: 'Grammar & Tenses',
        },
        {
          id: 'eng_t2',
          question: 'Identify the tense used in the sentence: "She will have been teaching at this college for five years by next December."',
          options: {
            A: 'Future Perfect Continuous',
            B: 'Future Continuous',
            C: 'Future Perfect',
            D: 'Present Perfect Continuous',
          },
          correctAnswer: 'A',
          explanation: '"will have been + verb-ing" indicates an ongoing action that will continue up until a designated point in the future (Future Perfect Continuous Tense).',
          topic: 'Grammar & Tenses',
        },
        {
          id: 'eng_t3',
          question: 'Complete the sentence with the correct conditional verb form: "If he ______ harder, he would have passed the examination."',
          options: {
            A: 'had worked',
            B: 'worked',
            C: 'has worked',
            D: 'would work',
          },
          correctAnswer: 'A',
          explanation: 'In a Third Conditional sentence (hypothetical past condition and outcome), the "if" clause takes Past Perfect ("had worked") and the main clause uses "would have + past participle" ("would have passed").',
          topic: 'Grammar & Tenses',
        },
        {
          id: 'eng_t4',
          question: 'Which of the following sentences correctly demonstrates the Present Perfect Continuous tense?',
          options: {
            A: 'It has been raining continuously since early morning.',
            B: 'It was raining continuously when I woke up.',
            C: 'It had rained heavily before the sun came out.',
            D: 'It is raining outside right now.',
          },
          correctAnswer: 'A',
          explanation: '"has been raining" paired with the time preposition "since early morning" expresses an action that began in the past and is still continuing in the present.',
          topic: 'Grammar & Tenses',
        },
        {
          id: 'eng_t5',
          question: 'Fill in the blank with the correct preposition: "The principal congratulated the student ______ his outstanding academic success."',
          options: {
            A: 'on',
            B: 'for',
            C: 'at',
            D: 'with',
          },
          correctAnswer: 'A',
          explanation: 'The verb "congratulate" takes the standard preposition "on" (e.g., congratulate someone on an achievement).',
          topic: 'Prepositions & Grammar',
        },
        {
          id: 'eng_t6',
          question: 'Convert into Passive Voice: "The municipal committee has built a new public library."',
          options: {
            A: 'A new public library has been built by the municipal committee.',
            B: 'A new public library was built by the municipal committee.',
            C: 'A new public library had been built by the municipal committee.',
            D: 'A new public library is being built by the municipal committee.',
          },
          correctAnswer: 'A',
          explanation: 'In converting Present Perfect active ("has built") to passive, the auxiliary becomes "has/have + been + past participle" ("has been built").',
          topic: 'Active & Passive Voice',
        },
        {
          id: 'eng_t7',
          question: 'Convert into Indirect Speech: He said to me, "Where are you going?"',
          options: {
            A: 'He asked me where I was going.',
            B: 'He asked me that where I was going.',
            C: 'He told me where was I going.',
            D: 'He enquired me where am I going.',
          },
          correctAnswer: 'A',
          explanation: 'In indirect wh-questions, the reporting verb becomes "asked", conjunction "that" is omitted, present continuous shifts to past continuous ("was going"), and word order becomes assertive (subject before verb).',
          topic: 'Direct & Indirect Speech',
        },
        {
          id: 'eng_t8',
          question: 'Identify the part of speech of the underlined word: "Swimming in the morning is a healthy exercise."',
          options: {
            A: 'Gerund (Verbal Noun)',
            B: 'Present Participle (Adjective)',
            C: 'Infinitive',
            D: 'Adverb',
          },
          correctAnswer: 'A',
          explanation: 'When a verb ending in "-ing" functions as the subject or object of a sentence (a noun), it is classified as a Gerund.',
          topic: 'Parts of Speech',
        },
        {
          id: 'eng_t9',
          question: 'Identify the figure of speech in: "The autumn leaves danced gracefully in the evening breeze."',
          options: {
            A: 'Personification',
            B: 'Simile',
            C: 'Metaphor',
            D: 'Hyperbole',
          },
          correctAnswer: 'A',
          explanation: 'Personification attributes human qualities or actions (such as dancing gracefully) to inanimate objects (autumn leaves).',
          topic: 'Figures of Speech',
        },
        {
          id: 'eng_t10',
          question: 'Select the sentence with correct subject-verb agreement:',
          options: {
            A: 'Neither the captain nor the players were ready for the match.',
            B: 'Neither the captain nor the players was ready for the match.',
            C: 'Neither the captain or the players were ready for the match.',
            D: 'Neither the captain nor the players has been ready for the match.',
          },
          correctAnswer: 'A',
          explanation: 'With "neither... nor", the verb agrees with the subject closest to it ("players" is plural, requiring "were ready").',
          topic: 'Grammar Rules & Agreement',
        }
      );
    } else {
      questions.push(
        {
          id: 'eng_g1',
          question: 'Choose the word that is closest in meaning (synonym) to "BENEVOLENT":',
          options: {
            A: 'Generous and kind',
            B: 'Hostile and aggressive',
            C: 'Cautious and timid',
            D: 'Greedy and possessive',
          },
          correctAnswer: 'A',
          explanation: 'Benevolent derives from Latin meaning "well-wishing" and describes someone who is charitable, kind, and generous.',
          topic: topic || 'Vocabulary',
        },
        {
          id: 'eng_g2',
          question: 'Select the correct sentence structure for a Second Conditional statement:',
          options: {
            A: 'If I won the scholarship, I would travel to Oxford.',
            B: 'If I will win the scholarship, I would travel to Oxford.',
            C: 'If I win the scholarship, I would travel to Oxford.',
            D: 'If I had won the scholarship, I would travel to Oxford.',
          },
          correctAnswer: 'A',
          explanation: 'Second conditional (unreal/hypothetical present condition) follows the structure: "If + Simple Past, would + base verb".',
          topic: topic || 'Grammar Structures',
        },
        {
          id: 'eng_g3',
          question: 'Which of the following options correctly punctuates the possessive plural form of "children"?',
          options: {
            A: "children's",
            B: "childrens'",
            C: "childrens's",
            D: "childrens",
          },
          correctAnswer: 'A',
          explanation: 'Because "children" is an irregular plural noun that does not end in "s", its possessive is formed by adding apostrophe + s ("children\'s").',
          topic: topic || 'Punctuation & Syntax',
        },
        {
          id: 'eng_g4',
          question: 'Identify the type of clause in brackets: "The student [who scored highest in mathematics] received a gold medal."',
          options: {
            A: 'Defining Relative Clause (Adjective Clause)',
            B: 'Adverbial Clause of Time',
            C: 'Noun Clause acting as Object',
            D: 'Prepositional Phrase',
          },
          correctAnswer: 'A',
          explanation: 'The clause modifies the noun "student" and specifies which student is being referred to, functioning as a defining relative/adjective clause.',
          topic: topic || 'Clauses & Syntax',
        }
      );
    }
  }

  // ==========================================
  // 2. PHYSICS (Kinematics, Dynamics, Thermodynamics, Optics, Electricity)
  // ==========================================
  else if (normSubject.includes('phys')) {
    questions.push(
      {
        id: 'phy_1',
        question: 'A car accelerates uniformly from rest to a speed of $20\\text{ m/s}$ in $5\\text{ seconds}$. What is the acceleration of the car?',
        options: {
          A: '$4\\text{ m/s}^2$',
          B: '$5\\text{ m/s}^2$',
          C: '$100\\text{ m/s}^2$',
          D: '$2\\text{ m/s}^2$',
        },
        correctAnswer: 'A',
        explanation: 'Using the first equation of motion $v = u + at$: $20 = 0 + a(5) \\implies a = 20/5 = 4\\text{ m/s}^2$.',
        topic: 'Kinematics & Motion',
      },
      {
        id: 'phy_2',
        question: 'According to Newton’s Second Law of Motion ($F = ma$), what net force is required to accelerate an object of mass $6\\text{ kg}$ at $3\\text{ m/s}^2$?',
        options: {
          A: '$18\\text{ N}$',
          B: '$2\\text{ N}$',
          C: '$9\\text{ N}$',
          D: '$0.5\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: 'Net force $F = m \\times a = 6\\text{ kg} \\times 3\\text{ m/s}^2 = 18\\text{ N}$.',
        topic: 'Dynamics & Forces',
      },
      {
        id: 'phy_3',
        question: 'The kinetic energy of an object of mass $m$ moving with velocity $v$ is given by $E_k = \\frac{1}{2}mv^2$. If the velocity is tripled while mass remains constant, the kinetic energy becomes:',
        options: {
          A: '$9\\text{ times}$ the original value',
          B: '$3\\text{ times}$ the original value',
          C: '$6\\text{ times}$ the original value',
          D: '$1/3\\text{ of}$ the original value',
        },
        correctAnswer: 'A',
        explanation: 'Kinetic energy is directly proportional to the square of velocity ($E_k \\propto v^2$). Tripling $v$ yields $(3v)^2 = 9v^2$, so $E_k$ increases by a factor of 9.',
        topic: 'Work and Energy',
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
        question: 'A concave mirror has a focal length of $10\\text{ cm}$. If an object is placed at $20\\text{ cm}$ from the mirror (at the center of curvature), where is the image formed?',
        options: {
          A: 'At $20\\text{ cm}$ in front of the mirror (real, inverted, same size)',
          B: 'At $10\\text{ cm}$ in front of the mirror',
          C: 'Behind the mirror at $20\\text{ cm}$ (virtual)',
          D: 'At infinity',
        },
        correctAnswer: 'A',
        explanation: 'Using $\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{q} \\implies \\frac{1}{10} = \\frac{1}{20} + \\frac{1}{q} \\implies \\frac{1}{q} = \\frac{1}{20} \\implies q = 20\\text{ cm}$. The image is formed at the center of curvature, real and inverted.',
        topic: 'Geometrical Optics',
      },
      {
        id: 'phy_6',
        question: 'The frequency of a periodic sound wave travelling with speed $340\\text{ m/s}$ is $170\\text{ Hz}$. What is its wavelength $\\lambda$?',
        options: {
          A: '$2.0\\text{ m}$',
          B: '$0.5\\text{ m}$',
          C: '$57800\\text{ m}$',
          D: '$170\\text{ m}$',
        },
        correctAnswer: 'A',
        explanation: 'Using wave speed formula $v = f \\lambda \\implies \\lambda = \\frac{v}{f} = \\frac{340\\text{ m/s}}{170\\text{ Hz}} = 2.0\\text{ m}$.',
        topic: 'Waves and Acoustics',
      }
    );
  }

  // ==========================================
  // 3. CHEMISTRY (Bonding, Periodic Table, Stoichiometry, Organic, Acids)
  // ==========================================
  else if (normSubject.includes('chem')) {
    questions.push(
      {
        id: 'chem_1',
        question: 'Which type of chemical bond is formed by the complete transfer of one or more valence electrons from a metal to a non-metal?',
        options: {
          A: 'Ionic bond (Electrovalent bond)',
          B: 'Non-polar covalent bond',
          C: 'Coordinate covalent bond',
          D: 'Metallic bond',
        },
        correctAnswer: 'A',
        explanation: 'Ionic bonding occurs due to electrostatic attraction between cations and anions formed by complete electron transfer.',
        topic: 'Chemical Bonding',
      },
      {
        id: 'chem_2',
        question: 'What is the oxidation state of Manganese (Mn) in potassium permanganate ($\\text{KMnO}_4$)?',
        options: {
          A: '$+7$',
          B: '$+4$',
          C: '$+2$',
          D: '$+6$',
        },
        correctAnswer: 'A',
        explanation: 'In $\\text{KMnO}_4$: $\\text{K} = +1$, $\\text{O}_4 = 4(-2) = -8$. Sum of oxidation states = $0 \\implies +1 + \\text{Mn} - 8 = 0 \\implies \\text{Mn} = +7$.',
        topic: 'Electrochemistry & Redox',
      },
      {
        id: 'chem_3',
        question: 'What is the molar mass of sulfuric acid ($\\text{H}_2\\text{SO}_4$) in $\\text{g/mol}$? (Atomic masses: $\\text{H}=1, \\text{S}=32, \\text{O}=16$)',
        options: {
          A: '$98\\text{ g/mol}$',
          B: '$49\\text{ g/mol}$',
          C: '$82\\text{ g/mol}$',
          D: '$104\\text{ g/mol}$',
        },
        correctAnswer: 'A',
        explanation: '$M = 2(1) + 1(32) + 4(16) = 2 + 32 + 64 = 98\\text{ g/mol}$.',
        topic: 'Stoichiometry & Moles',
      },
      {
        id: 'chem_4',
        question: 'Which of the following functional groups is characteristic of organic carboxylic acids?',
        options: {
          A: '$-\\text{COOH}$',
          B: '$-\\text{OH}$',
          C: '$-\\text{CHO}$',
          D: '$-\\text{CO}-$',
        },
        correctAnswer: 'A',
        explanation: 'Carboxylic acids contain the carboxyl functional group ($-\\text{COOH}$), consisting of a carbonyl group bonded to a hydroxyl group.',
        topic: 'Organic Chemistry',
      },
      {
        id: 'chem_5',
        question: 'What is the $\\text{pH}$ of an aqueous solution having a hydrogen ion concentration $[\\text{H}^+] = 1.0 \\times 10^{-3}\\text{ M}$?',
        options: {
          A: '$3$',
          B: '$11$',
          C: '$-3$',
          D: '$7$',
        },
        correctAnswer: 'A',
        explanation: '$\\text{pH} = -\\log[\\text{H}^+] = -\\log(10^{-3}) = -(-3) = 3$.',
        topic: 'Acids, Bases & Salts',
      }
    );
  }

  // ==========================================
  // 4. MATHEMATICS (Algebra, Matrices, Trigonometry, Calculus, Geometry)
  // ==========================================
  else if (normSubject.includes('math')) {
    questions.push(
      {
        id: 'math_1',
        question: 'What are the roots of the quadratic equation $x^2 - 7x + 12 = 0$?',
        options: {
          A: '$x = 3$ and $x = 4$',
          B: '$x = -3$ and $x = -4$',
          C: '$x = 2$ and $x = 6$',
          D: '$x = -2$ and $x = -6$',
        },
        correctAnswer: 'A',
        explanation: 'Factoring $(x - 3)(x - 4) = 0 \\implies x = 3$ or $x = 4$.',
        topic: 'Quadratic Equations',
      },
      {
        id: 'math_2',
        question: 'What is the determinant of the $2 \\times 2$ matrix $A = \\begin{pmatrix} 3 & 4 \\\\ 2 & 5 \\end{pmatrix}$?',
        options: {
          A: '$7$',
          B: '$23$',
          C: '$15$',
          D: '$-7$',
        },
        correctAnswer: 'A',
        explanation: '$\\det(A) = ad - bc = (3)(5) - (4)(2) = 15 - 8 = 7$.',
        topic: 'Matrices & Determinants',
      },
      {
        id: 'math_3',
        question: 'Simplify the trigonometric expression: $\\sin^2\\theta + \\cos^2\\theta$',
        options: {
          A: '$1$',
          B: '$0$',
          C: '$\\tan^2\\theta$',
          D: '$2$',
        },
        correctAnswer: 'A',
        explanation: 'By the fundamental Pythagorean trigonometric identity, $\\sin^2\\theta + \\cos^2\\theta = 1$ for all real angles $\\theta$.',
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
        explanation: 'Using power rule $\\frac{d}{dx}(x^n) = n x^{n-1}$: $f\'(x) = 4(3x^2) - 5(2x) + 7(1) - 0 = 12x^2 - 10x + 7$.',
        topic: 'Calculus & Differentiation',
      },
      {
        id: 'math_5',
        question: 'What is the distance between the two points $A(1, 2)$ and $B(4, 6)$ on a Cartesian plane?',
        options: {
          A: '$5\\text{ units}$',
          B: '$7\\text{ units}$',
          C: '$\\sqrt{7}\\text{ units}$',
          D: '$25\\text{ units}$',
        },
        correctAnswer: 'A',
        explanation: 'Distance $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} = \\sqrt{(4-1)^2 + (6-2)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$.',
        topic: 'Coordinate Geometry',
      }
    );
  }

  // ==========================================
  // 5. BIOLOGY (Cell, Genetics, Photosynthesis, Human Anatomy)
  // ==========================================
  else if (normSubject.includes('bio')) {
    questions.push(
      {
        id: 'bio_1',
        question: 'Which organelle is responsible for cellular respiration and ATP synthesis in eukaryotic cells?',
        options: {
          A: 'Mitochondrion',
          B: 'Ribosome',
          C: 'Endoplasmic reticulum',
          D: 'Golgi apparatus',
        },
        correctAnswer: 'A',
        explanation: 'Mitochondria generate the majority of cell chemical energy (ATP) via the Krebs cycle and electron transport chain.',
        topic: 'Cell Biology',
      },
      {
        id: 'bio_2',
        question: 'In a monohybrid cross between two heterozygous tall pea plants ($Tt \\times Tt$), what is the expected phenotypic ratio of tall to dwarf offspring?',
        options: {
          A: '$3 : 1$',
          B: '$1 : 2 : 1$',
          C: '$1 : 1$',
          D: '$9 : 3 : 3 : 1$',
        },
        correctAnswer: 'A',
        explanation: 'The Punnett square yields genotypes $1\\,TT : 2\\,Tt : 1\\,tt$. Since $T$ is dominant over $t$, $3$ are tall ($TT, Tt$) and $1$ is dwarf ($tt$).',
        topic: 'Genetics & Inheritance',
      },
      {
        id: 'bio_3',
        question: 'Which enzyme is responsible for breaking down dietary starches into maltose in the human mouth and duodenum?',
        options: {
          A: 'Amylase',
          B: 'Pepsin',
          C: 'Lipase',
          D: 'Trypsin',
        },
        correctAnswer: 'A',
        explanation: 'Salivary and pancreatic amylase catalyze the hydrolysis of starch into maltose and dextrins.',
        topic: 'Human Digestion & Enzymes',
      },
      {
        id: 'bio_4',
        question: 'During photosynthesis, the light-dependent reactions take place inside which part of the chloroplast?',
        options: {
          A: 'Thylakoid membrane / Grana',
          B: 'Stroma',
          C: 'Outer chloroplast membrane',
          D: 'Mitochondrial matrix',
        },
        correctAnswer: 'A',
        explanation: 'Light-dependent reactions occur across the thylakoid membranes where chlorophyll absorbs photons, while dark reactions (Calvin cycle) take place in the stroma.',
        topic: 'Bioenergetics & Photosynthesis',
      }
    );
  }

  // ==========================================
  // 6. COMPUTER SCIENCE (Data Structures, Algorithms, SQL, Networks)
  // ==========================================
  else if (normSubject.includes('comp') || normSubject.includes('cs') || normSubject.includes('it')) {
    questions.push(
      {
        id: 'cs_1',
        question: 'Which linear data structure enforces a "Last-In, First-Out" (LIFO) access discipline?',
        options: {
          A: 'Stack',
          B: 'Queue',
          C: 'Linked list',
          D: 'Binary tree',
        },
        correctAnswer: 'A',
        explanation: 'A Stack operates on LIFO (the last element inserted is the first to be popped). A Queue operates on FIFO.',
        topic: 'Data Structures',
      },
      {
        id: 'cs_2',
        question: 'What is the average time complexity of finding an element in a balanced Binary Search Tree (BST) with $n$ nodes?',
        options: {
          A: '$O(\\log n)$',
          B: '$O(n)$',
          C: '$O(1)$',
          D: '$O(n^2)$',
        },
        correctAnswer: 'A',
        explanation: 'Each step down a balanced BST eliminates half the search space, giving $O(\\log n)$ time complexity.',
        topic: 'Algorithms & Complexity',
      },
      {
        id: 'cs_3',
        question: 'In SQL, which clause is used to filter grouped summary rows created by a "GROUP BY" statement?',
        options: {
          A: 'HAVING',
          B: 'WHERE',
          C: 'ORDER BY',
          D: 'DISTINCT',
        },
        correctAnswer: 'A',
        explanation: '"WHERE" filters individual records before aggregation, while "HAVING" filters the aggregated results after grouping.',
        topic: 'Databases & SQL',
      },
      {
        id: 'cs_4',
        question: 'Which layer of the OSI 7-layer reference model provides reliable end-to-end transport with TCP protocol?',
        options: {
          A: 'Transport Layer (Layer 4)',
          B: 'Network Layer (Layer 3)',
          C: 'Data Link Layer (Layer 2)',
          D: 'Session Layer (Layer 5)',
        },
        correctAnswer: 'A',
        explanation: 'Layer 4 (Transport Layer) manages host-to-host flow control, packet sequencing, and error checking using TCP.',
        topic: 'Computer Networks',
      }
    );
  }

  // ==========================================
  // 7. PAKISTAN STUDIES / ISLAMIAT / GENERAL
  // ==========================================
  else if (normSubject.includes('pak') || normSubject.includes('isl') || normSubject.includes('hist')) {
    questions.push(
      {
        id: 'pak_1',
        question: 'In which year was the historic Lahore Resolution (Pakistan Resolution) passed at Minto Park?',
        options: {
          A: '1940 (23rd March)',
          B: '1947 (14th August)',
          C: '1930 (29th December)',
          D: '1935',
        },
        correctAnswer: 'A',
        explanation: 'The All-India Muslim League passed the Lahore Resolution on March 23, 1940, demanding sovereign independent Muslim states.',
        topic: 'Pakistan Movement',
      },
      {
        id: 'pak_2',
        question: 'Which constitution of Pakistan introduced a bicameral parliament consisting of the National Assembly and the Senate?',
        options: {
          A: 'Constitution of 1973',
          B: 'Constitution of 1956',
          C: 'Constitution of 1962',
          D: 'Government of India Act 1935',
        },
        correctAnswer: 'A',
        explanation: 'The 1973 Constitution established a bicameral legislature with equal provincial representation in the Senate and population-based seats in the National Assembly.',
        topic: 'Constitutional History',
      }
    );
  }

  // Fill in authentic dynamic topic-specific questions if the requested count exceeds existing items
  let dynamicCount = 1;
  while (questions.length < count) {
    if (normSubject.includes('eng')) {
      const dynamicEngQuestions = [
        {
          q: `Select the option with the correct past continuous tense: "While father was reading the newspaper, the children ______ in the garden."`,
          options: { A: 'were playing', B: 'are playing', C: 'played', D: 'had played' },
          correct: 'A' as const,
          exp: 'Past continuous ("were playing") expresses an ongoing action happening simultaneously with another past continuous action ("was reading").',
        },
        {
          q: `Fill in the blank with the correct modal auxiliary verb: "You ______ obey the traffic rules to prevent accidents on the highway."`,
          options: { A: 'must', B: 'might', C: 'could', D: 'would' },
          correct: 'A' as const,
          exp: '"Must" expresses strict obligation or compulsory necessity according to law.',
        },
        {
          q: `Identify the antonym of the word "ARROGANT":`,
          options: { A: 'Humble', B: 'Proud', C: 'Boastful', D: 'Domineering' },
          correct: 'A' as const,
          exp: '"Humble" (modest, unpretentious) is the direct antonym of "arrogant" (overbearing pride).',
        },
        {
          q: `Choose the correct passive voice: "The students are solving the physics test."`,
          options: {
            A: 'The physics test is being solved by the students.',
            B: 'The physics test was solved by the students.',
            C: 'The physics test has been solved by the students.',
            D: 'The physics test is solved by the students.',
          },
          correct: 'A' as const,
          exp: 'Present Continuous passive uses: "is/are + being + past participle" ("is being solved").',
        },
        {
          q: `Identify the sentence containing an adjective clause:`,
          options: {
            A: 'The book that you recommended was thoroughly inspiring.',
            B: 'She ran quickly because she was late.',
            C: 'He believes that hard work leads to success.',
            D: 'Walking along the shore, we watched the sunset.',
          },
          correct: 'A' as const,
          exp: '"that you recommended" is a relative/adjective clause modifying the noun "book".',
        }
      ];
      const item = dynamicEngQuestions[(dynamicCount - 1) % dynamicEngQuestions.length];
      questions.push({
        id: `eng_dyn_${dynamicCount}`,
        question: item.q,
        options: item.options,
        correctAnswer: item.correct,
        explanation: item.exp,
        topic: topic || 'English Grammar',
      });
    } else if (normSubject.includes('math')) {
      questions.push({
        id: `math_dyn_${dynamicCount}`,
        question: `Evaluate the algebraic value of $f(${dynamicCount})$ for the polynomial $f(x) = 2x^2 + 3x - 5$:`,
        options: {
          A: `${2 * Math.pow(dynamicCount, 2) + 3 * dynamicCount - 5}`,
          B: `${2 * Math.pow(dynamicCount, 2) + 3 * dynamicCount}`,
          C: `${Math.pow(dynamicCount, 2) + 3 * dynamicCount - 5}`,
          D: `${2 * Math.pow(dynamicCount, 2) - 5}`,
        },
        correctAnswer: 'A',
        explanation: `Substitute $x = ${dynamicCount}$: $f(${dynamicCount}) = 2(${dynamicCount})^2 + 3(${dynamicCount}) - 5 = ${2 * Math.pow(dynamicCount, 2) + 3 * dynamicCount - 5}$.`,
        topic: topic || 'Algebra & Polynomials',
      });
    } else if (normSubject.includes('phys')) {
      const mass = (dynamicCount + 1) * 2;
      const acc = 3 + dynamicCount;
      const force = mass * acc;
      questions.push({
        id: `phy_dyn_${dynamicCount}`,
        question: `Calculate the magnitude of acceleration when a net horizontal force of $${force}\\text{ N}$ acts on a cart of mass $${mass}\\text{ kg}$ on a frictionless track:`,
        options: {
          A: `$${acc}\\text{ m/s}^2$`,
          B: `$${acc * 2}\\text{ m/s}^2$`,
          C: `$${Math.round(mass / force * 10) / 10}\\text{ m/s}^2$`,
          D: `$${force * mass}\\text{ m/s}^2$`,
        },
        correctAnswer: 'A',
        explanation: `By Newton's second law: $a = \\frac{F}{m} = \\frac{${force}\\text{ N}}{${mass}\\text{ kg}} = ${acc}\\text{ m/s}^2$.`,
        topic: topic || 'Dynamics & Motion',
      });
    } else if (normSubject.includes('chem')) {
      const moles = (dynamicCount % 4) + 1;
      const mass = moles * 18;
      questions.push({
        id: `chem_dyn_${dynamicCount}`,
        question: `Calculate the mass in grams of $${moles}\\text{ mol}$ of water ($\\text{H}_2\\text{O}$) having a molar mass of $18\\text{ g/mol}$:`,
        options: {
          A: `$${mass}\\text{ g}$`,
          B: `$${mass + 18}\\text{ g}$`,
          C: `$${(mass / 2).toFixed(1)}\\text{ g}$`,
          D: `$${mass * 2}\\text{ g}$`,
        },
        correctAnswer: 'A',
        explanation: `$\\text{Mass} = \\text{Moles} \\times \\text{Molar mass} = ${moles} \\times 18\\text{ g/mol} = ${mass}\\text{ g}$.`,
        topic: topic || 'Stoichiometry & Solutions',
      });
    } else if (normSubject.includes('bio')) {
      questions.push({
        id: `bio_dyn_${dynamicCount}`,
        question: `Which cellular organelle is primarily responsible for ATP synthesis via aerobic cellular respiration in Grade ${grade} Biology?`,
        options: {
          A: `Mitochondria`,
          B: `Ribosomes`,
          C: `Endoplasmic Reticulum`,
          D: `Lysosomes`,
        },
        correctAnswer: 'A',
        explanation: `Mitochondria are the powerhouses of eukaryotic cells, synthesizing ATP through cellular respiration.`,
        topic: topic || 'Cell Biology',
      });
    } else {
      questions.push({
        id: `dyn_${dynamicCount}`,
        question: `In ${subject} (${topic}), which standard SI unit or fundamental definition is universally used for quantitative analysis in Grade ${grade}?`,
        options: {
          A: `Standard SI derived or base metric established in the curriculum`,
          B: `Non-standard arbitrary unit`,
          C: `CGS scale multiplied by an uncalibrated scalar`,
          D: `Dimensionless unverified parameter`,
        },
        correctAnswer: 'A',
        explanation: `Grade ${grade} curriculum standards establish standard SI units and validated quantitative metrics for ${topic}.`,
        topic: topic,
      });
    }
    dynamicCount++;
  }

  // Filter out any excluded questions
  const filtered = questions.filter((q) => {
    if (normExcludes.length > 0) {
      const qText = q.question.trim().toLowerCase();
      if (normExcludes.some((ex) => qText === ex || (q.id && ex === q.id.toLowerCase()))) {
        return false;
      }
    }
    return true;
  });

  return filtered.slice(0, count);
}
