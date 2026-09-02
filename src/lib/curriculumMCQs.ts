import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';
import { getGrade9FBISEQuestions } from './fbise9QuestionsBank';
import { validateQuestionTopicRelevance, validateMCQQuestion, checkQuestionDuplicate } from './mcqValidator';
import { getChapterSyllabusScope } from './curriculumFBISE9';
import { IELTS_GRAMMAR_MCQS, IELTS_COMPREHENSION_MCQS } from '../data/banks/ielts/index';

/**
 * High-quality, strictly syllabus-scoped fallback MCQ generator.
 * Guarantees that ALL returned questions belong strictly to the requested subject & chapter,
 * with zero cross-chapter bleed and zero meta phrases.
 */
export function generateCurriculumFallbackMCQs(
  subject: string,
  topic: string,
  count: number,
  difficulty: MCQDifficulty = 'medium',
  grade: string = '9',
  board: string = 'fbise',
  excludeTexts: string[] = []
): MCQQuestion[] {
  const normSubject = (subject || 'Physics').trim();
  const normTopic = (topic || 'General Science').trim();
  const normSub = normSubject.toLowerCase();
  const normTop = normTopic.toLowerCase();
  const isIelts =
    board?.toLowerCase() === 'ielts' ||
    String(grade).toUpperCase() === 'IELTS' ||
    normSub.includes('ielts') ||
    normSub === 'grammar' ||
    normSub.includes('comprehension');

  // 0. High priority: IELTS Question Bank (Grammar & Comprehension)
  if (isIelts) {
    const isComprehension =
      normSub.includes('comprehension') ||
      normTop.includes('comprehension') ||
      normTop.includes('passage') ||
      normSub.includes('reading');

    const sourcePool = isComprehension ? IELTS_COMPREHENSION_MCQS : IELTS_GRAMMAR_MCQS;
    const excludeSet = new Set(excludeTexts.map((t) => t.trim().toLowerCase()));

    const filtered = sourcePool.filter(
      (q) => !excludeSet.has(q.question.trim().toLowerCase()) && !excludeSet.has(q.id.toLowerCase())
    );

    // Shuffle pool deterministically / randomly
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'Verified IELTS language proficiency skill assessment.',
      chapter: q.chapter || (isComprehension ? 'Comprehension of Passages' : 'Grammar'),
      topic: q.topic || q.chapter || (isComprehension ? 'Comprehension of Passages' : 'Grammar'),
      difficulty: (q.difficulty as MCQDifficulty) || difficulty,
    }));

    if (selected.length > 0) {
      return selected;
    }
  }

  const selectedChaps = normTopic && normTopic !== 'Full Syllabus' && normTopic !== 'Mixed Chapters' && normTopic !== 'All'
    ? [normTopic]
    : [];

  // 1. Try authoritative Grade 9 FBISE static question bank first
  const fbise9Questions = getGrade9FBISEQuestions(normSubject, selectedChaps, count, difficulty, excludeTexts);
  if (fbise9Questions.length >= count) {
    return fbise9Questions.slice(0, count);
  }

  // 2. Build dedicated, chapter-scoped questions pool
  const questions: MCQQuestion[] = [...fbise9Questions];
  const validationContext = { subject: normSubject, topic: normTopic, grade: String(grade), board: String(board) };
  const scope = getChapterSyllabusScope(normSubject, normTopic);

  // Helper to safely add valid, non-duplicate, chapter-confined question
  const addSafeQuestion = (q: MCQQuestion) => {
    if (!validateMCQQuestion(q, validationContext).valid) return false;
    if (!validateQuestionTopicRelevance(q, validationContext).valid) return false;
    if (checkQuestionDuplicate(q, questions, 0.85).isDuplicate) return false;
    questions.push(q);
    return true;
  };

  let dynIdx = 1;
  const maxIterations = Math.max(count * 50, 500);

  while (questions.length < count && dynIdx <= maxIterations) {
    const chapterLabel = scope.chapter || normTopic;

    // ── 1. PHYSICS ─────────────────────────────────────────────────────────────
    if (normSub.includes('phys')) {
      if (normTop.includes('measurement') || normTop.includes('physical quantit')) {
        const d = (dynIdx % 10) + 1;
        const main = 2.0 + (dynIdx % 5) * 0.5;
        const total = (main + d * 0.01).toFixed(2);
        addSafeQuestion({
          id: `cur_phy_meas_${dynIdx}`,
          question: `A Vernier Calipers has a least count of $0.01\\text{ cm}$. If the main scale reads $${main.toFixed(1)}\\text{ cm}$ and the $${d}\\text{th}$ vernier division coincides with a main scale mark, what is the total measured reading?`,
          options: {
            A: `$${total}\\text{ cm}$`,
            B: `$${(main + d * 0.1).toFixed(2)}\\text{ cm}$`,
            C: `$${main.toFixed(2)}\\text{ cm}$`,
            D: `$${(main + d * 0.001).toFixed(3)}\\text{ cm}$`,
          },
          correctAnswer: 'A',
          explanation: `Total Reading = Main scale reading + (Coinciding vernier division $\\times$ Least count) = $${main.toFixed(1)} + (${d} \\times 0.01) = ${total}\\text{ cm}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      } else if (normTop.includes('kinematic') || normTop.includes('motion')) {
        const a = (dynIdx % 7) + 2;
        const t = (dynIdx % 6) + 2;
        const s = 0.5 * a * t * t;
        addSafeQuestion({
          id: `cur_phy_kin_${dynIdx}`,
          question: `An object starting from rest moves with uniform acceleration $a = ${a}\\text{ m/s}^2$ for time $t = ${t}\\text{ s}$. Calculate the total distance traveled:`,
          options: {
            A: `$${s.toFixed(1)}\\text{ m}$`,
            B: `$${(s * 2).toFixed(1)}\\text{ m}$`,
            C: `$${(a * t).toFixed(1)}\\text{ m}$`,
            D: `$${(s / 2).toFixed(1)}\\text{ m}$`,
          },
          correctAnswer: 'A',
          explanation: `Using the second equation of motion: $S = ut + \\frac{1}{2}at^2 = 0 + \\frac{1}{2}(${a})(${t}^2) = ${s.toFixed(1)}\\text{ m}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      } else if (normTop.includes('dynamic') || normTop.includes('force')) {
        const m = (dynIdx % 8) + 2;
        const a = (dynIdx % 6) + 2;
        const f = m * a;
        addSafeQuestion({
          id: `cur_phy_dyn_${dynIdx}`,
          question: `According to Newton's Second Law of Motion ($F=ma$), what net force is required to accelerate a body of mass $${m}\\text{ kg}$ at $${a}\\text{ m/s}^2$?`,
          options: {
            A: `$${f}\\text{ N}$`,
            B: `$${f + 12}\\text{ N}$`,
            C: `$${Math.round(f / 2)}\\text{ N}$`,
            D: `$${m + a}\\text{ N}$`,
          },
          correctAnswer: 'A',
          explanation: `$F = ma = ${m}\\text{ kg} \\times ${a}\\text{ m/s}^2 = ${f}\\text{ N}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      } else {
        const baseProps = [
          { q: 'mass', u: 'kilogram (kg)' },
          { q: 'time', u: 'second (s)' },
          { q: 'length', u: 'meter (m)' },
          { q: 'electric current', u: 'ampere (A)' },
          { q: 'thermodynamic temperature', u: 'kelvin (K)' },
          { q: 'amount of substance', u: 'mole (mol)' },
          { q: 'luminous intensity', u: 'candela (cd)' },
          { q: 'force in SI system', u: 'Newton (N)' },
          { q: 'energy and work', u: 'Joule (J)' },
          { q: 'power in SI system', u: 'Watt (W)' },
          { q: 'pressure in SI system', u: 'Pascal (Pa)' },
          { q: 'frequency of periodic waves', u: 'Hertz (Hz)' },
        ];
        const bp = baseProps[(dynIdx - 1) % baseProps.length];
        addSafeQuestion({
          id: `cur_phy_base_${dynIdx}`,
          question: `Which of the following is the standard SI unit for measuring ${bp.q}?`,
          options: {
            A: `${bp.u}`,
            B: `arbitrary unit`,
            C: `cgs unit`,
            D: `fps unit`,
          },
          correctAnswer: 'A',
          explanation: `The International System of Units (SI) defines ${bp.u} as the standard unit for ${bp.q}.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      }

    // ── 2. CHEMISTRY ───────────────────────────────────────────────────────────
    } else if (normSub.includes('chem')) {
      if (normTop.includes('atom') || normTop.includes('structure')) {
        const z = (dynIdx % 20) + 1;
        const n = z + (dynIdx % 4) + 1;
        const a = z + n;
        addSafeQuestion({
          id: `cur_chem_atom_${dynIdx}`,
          question: `An atom of a chemical element has atomic number $Z = ${z}$ and mass number $A = ${a}$. How many neutrons are in its atomic nucleus?`,
          options: {
            A: `${n}`,
            B: `${z}`,
            C: `${a}`,
            D: `${a + z}`,
          },
          correctAnswer: 'A',
          explanation: `Number of neutrons $N = A - Z = ${a} - ${z} = ${n}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      } else if (normTop.includes('periodic') || normTop.includes('element')) {
        const elems = [
          { name: 'Lithium ($Li$)', group: 'Group 1 (Alkali Metals)', p: 2 },
          { name: 'Sodium ($Na$)', group: 'Group 1 (Alkali Metals)', p: 3 },
          { name: 'Potassium ($K$)', group: 'Group 1 (Alkali Metals)', p: 4 },
          { name: 'Rubidium ($Rb$)', group: 'Group 1 (Alkali Metals)', p: 5 },
          { name: 'Beryllium ($Be$)', group: 'Group 2 (Alkaline Earth Metals)', p: 2 },
          { name: 'Magnesium ($Mg$)', group: 'Group 2 (Alkaline Earth Metals)', p: 3 },
          { name: 'Calcium ($Ca$)', group: 'Group 2 (Alkaline Earth Metals)', p: 4 },
          { name: 'Strontium ($Sr$)', group: 'Group 2 (Alkaline Earth Metals)', p: 5 },
          { name: 'Fluorine ($F$)', group: 'Group 17 (Halogens)', p: 2 },
          { name: 'Chlorine ($Cl$)', group: 'Group 17 (Halogens)', p: 3 },
          { name: 'Bromine ($Br$)', group: 'Group 17 (Halogens)', p: 4 },
          { name: 'Iodine ($I$)', group: 'Group 17 (Halogens)', p: 5 },
          { name: 'Helium ($He$)', group: 'Group 18 (Noble Gases)', p: 1 },
          { name: 'Neon ($Ne$)', group: 'Group 18 (Noble Gases)', p: 2 },
          { name: 'Argon ($Ar$)', group: 'Group 18 (Noble Gases)', p: 3 },
          { name: 'Krypton ($Kr$)', group: 'Group 18 (Noble Gases)', p: 4 },
        ];
        const el = elems[(dynIdx - 1) % elems.length];
        addSafeQuestion({
          id: `cur_chem_per_${dynIdx}`,
          question: `To which group of the Modern Periodic Table does the element ${el.name} belong?`,
          options: {
            A: `${el.group}`,
            B: `Transition Metals`,
            C: `Lanthanides`,
            D: `Actinides`,
          },
          correctAnswer: 'A',
          explanation: `${el.name} belongs to ${el.group} in Period ${el.p} of the Modern Periodic Table.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      } else {
        const moles = (dynIdx % 7) + 1;
        const massH2O = moles * 18;
        addSafeQuestion({
          id: `cur_chem_mole_${dynIdx}`,
          question: `Calculate the mass in grams of $${moles}\\text{ mol}$ of water ($\\text{H}_2\\text{O}$) given molar mass $M = 18\\text{ g/mol}$:`,
          options: {
            A: `$${massH2O}\\text{ g}$`,
            B: `$${massH2O + 18}\\text{ g}$`,
            C: `$${Math.round(massH2O / 2)}\\text{ g}$`,
            D: `$${moles + 18}\\text{ g}$`,
          },
          correctAnswer: 'A',
          explanation: `$\\text{Mass} = \\text{Moles} \\times \\text{Molar Mass} = ${moles} \\times 18 = ${massH2O}\\text{ g}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      }

    // ── 3. MATHEMATICS ─────────────────────────────────────────────────────────
    } else if (normSub.includes('math')) {
      if (normTop.includes('matrix') || normTop.includes('matrices')) {
        const a = (dynIdx % 8) + 1;
        const d = (dynIdx % 7) + 2;
        const b = (dynIdx % 5) + 1;
        const c = 1;
        const det = a * d - b * c;
        addSafeQuestion({
          id: `cur_math_mat_${dynIdx}`,
          question: `Calculate the determinant of the $2 \\times 2$ matrix $M = \\begin{bmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{bmatrix}$:`,
          options: {
            A: `$${det}$`,
            B: `$${det + 3}$`,
            C: `$${det - 2}$`,
            D: `$${a + d + b + c}$`,
          },
          correctAnswer: 'A',
          explanation: `$\\det(M) = ad - bc = (${a} \\times ${d}) - (${b} \\times ${c}) = ${a * d} - ${b * c} = ${det}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      } else {
        const a = (dynIdx % 9) + 2;
        const b = (dynIdx % 7) + 1;
        const sqDiff = a * a - b * b;
        addSafeQuestion({
          id: `cur_math_dyn_${dynIdx}`,
          question: `Evaluate the algebraic value of $(${a} - ${b})(${a} + ${b})$ using the algebraic difference of squares identity:`,
          options: {
            A: `$${sqDiff}$`,
            B: `$${sqDiff + 4}$`,
            C: `$${sqDiff - 3}$`,
            D: `$${a * a + b * b}$`,
          },
          correctAnswer: 'A',
          explanation: `Using $(a - b)(a + b) = a^2 - b^2 = ${a}^2 - ${b}^2 = ${a * a} - ${b * b} = ${sqDiff}$.`,
          topic: chapterLabel,
          chapter: chapterLabel,
        });
      }

    // ── 4. BIOLOGY ─────────────────────────────────────────────────────────────
    } else if (normSub.includes('bio')) {
      const bioPool = [
        {
          q: `Which cell organelle is known as the "powerhouse of the cell" for synthesizing ATP?`,
          opts: { A: 'Mitochondria', B: 'Ribosome', C: 'Golgi apparatus', D: 'Endoplasmic reticulum' },
          ans: 'A' as const,
          exp: 'Mitochondria are the sites of aerobic cellular respiration, synthesizing adenosine triphosphate (ATP).',
        },
        {
          q: `During which phase of cell division do sister chromatids separate toward opposite poles?`,
          opts: { A: 'Anaphase', B: 'Prophase', C: 'Metaphase', D: 'Telophase' },
          ans: 'A' as const,
          exp: 'During anaphase, centromeres divide and sister chromatids are pulled toward opposite poles.',
        },
        {
          q: `Enzymes function as biological catalysts by which mechanism?`,
          opts: { A: 'Lowering the activation energy of the reaction', B: 'Increasing the activation energy', C: 'Being consumed permanently in the reaction', D: 'Changing the chemical equilibrium' },
          ans: 'A' as const,
          exp: 'Enzymes accelerate biochemical reactions by lowering the activation energy barrier.',
        },
        {
          q: `Which vascular tissue in plants conducts water and dissolved mineral ions upward from roots?`,
          opts: { A: 'Xylem', B: 'Phloem', C: 'Cambium', D: 'Epidermis' },
          ans: 'A' as const,
          exp: 'Xylem vessels conduct water and minerals upward from roots, while phloem transports sugars.',
        },
        {
          q: `In Whittaker\'s five-kingdom system, which kingdom contains unicellular eukaryotes such as Amoeba?`,
          opts: { A: 'Protista', B: 'Monera', C: 'Fungi', D: 'Plantae' },
          ans: 'A' as const,
          exp: 'Kingdom Protista includes predominantly unicellular and simple colonial eukaryotic organisms.',
        },
        {
          q: `Which blood component initiates clotting to prevent blood loss at an injury site?`,
          opts: { A: 'Platelets (Thrombocytes)', B: 'Erythrocytes (RBCs)', C: 'Leukocytes (WBCs)', D: 'Blood Plasma' },
          ans: 'A' as const,
          exp: 'Platelets release thromboplastin initiating the cascade that converts fibrinogen to insoluble fibrin.',
        },
        {
          q: `Which chamber of the human heart pumps oxygenated blood into the systemic aorta?`,
          opts: { A: 'Left Ventricle', B: 'Right Ventricle', C: 'Left Atrium', D: 'Right Atrium' },
          ans: 'A' as const,
          exp: 'The left ventricle has the thickest muscular myocardium to pump oxygenated blood into the aorta.',
        },
        {
          q: `What is the primary site of photosynthetic light-dependent reactions within chloroplasts?`,
          opts: { A: 'Thylakoid membranes (Grana)', B: 'Stroma matrix', C: 'Outer membrane', D: 'Intermembrane space' },
          ans: 'A' as const,
          exp: 'Chlorophyll pigments embedded in thylakoid membranes absorb light to drive photolysis.',
        },
        {
          q: `Which vitamin deficiency causes Rickets in children, resulting in soft, weakened bones?`,
          opts: { A: 'Vitamin D (Calciferol)', B: 'Vitamin C (Ascorbic acid)', C: 'Vitamin A (Retinol)', D: 'Vitamin K (Phylloquinone)' },
          ans: 'A' as const,
          exp: 'Vitamin D facilitates calcium absorption in the intestine; deficiency leads to rickets.',
        },
        {
          q: `Which digestive enzyme secreted by the stomach begins the breakdown of proteins into polypeptides?`,
          opts: { A: 'Pepsin', B: 'Amylase', C: 'Lipase', D: 'Trypsin' },
          ans: 'A' as const,
          exp: 'Pepsin is activated from pepsinogen in the acidic gastric environment to hydrolyze proteins.',
        },
        {
          q: `In the human respiratory system, in which micro-structures does gas exchange between air and blood occur?`,
          opts: { A: 'Alveoli', B: 'Bronchioles', C: 'Trachea', D: 'Larynx' },
          ans: 'A' as const,
          exp: 'Alveoli provide a large, thin, highly vascularized surface area for oxygen and CO2 diffusion.',
        },
        {
          q: `What is the basic functional structural and filtration unit of the human kidney?`,
          opts: { A: 'Nephron', B: 'Neuron', C: 'Glomerulus capsule', D: 'Ureter' },
          ans: 'A' as const,
          exp: 'The nephron is the microscopic structural and functional unit responsible for filtering blood.',
        },
        {
          q: `Which plant hormone is primarily responsible for apical dominance and phototropism?`,
          opts: { A: 'Auxin (Indole-3-acetic acid)', B: 'Gibberellin', C: 'Cytokinin', D: 'Abscisic Acid' },
          ans: 'A' as const,
          exp: 'Auxins stimulate cell elongation on the shaded side of stems, causing phototropic bending.',
        },
        {
          q: `Which organelle contains hydrolytic digestive enzymes for intracellular digestion and recycling?`,
          opts: { A: 'Lysosome', B: 'Peroxisome', C: 'Vacuole', D: 'Centrosome' },
          ans: 'A' as const,
          exp: 'Lysosomes are membrane-bound vesicles containing acidic hydrolases that break down macromolecules.',
        },
        {
          q: `What is the phenotypic Mendelian monohybrid ratio in the F2 generation for complete dominance?`,
          opts: { A: '3 : 1', B: '1 : 2 : 1', C: '9 : 3 : 3 : 1', D: '1 : 1' },
          ans: 'A' as const,
          exp: 'Mendel\'s law of segregation yields a 3:1 dominant to recessive phenotypic ratio in F2 monohybrid crosses.',
        },
      ];
      const bq = bioPool[(dynIdx - 1) % bioPool.length];
      addSafeQuestion({
        id: `cur_bio_${dynIdx}`,
        question: bq.q,
        options: bq.opts,
        correctAnswer: bq.ans,
        explanation: bq.exp,
        topic: chapterLabel,
        chapter: chapterLabel,
      });

    // ── 5. COMPUTER SCIENCE ───────────────────────────────────────────────────
    } else if (normSub.includes('comp') || normSub.includes('cs')) {
      const decVal = (dynIdx % 20) + 1;
      const binVal = decVal.toString(2);
      const kbMult = (dynIdx % 10) + 2;
      const csPool = [
        {
          q: `How many bytes of storage are equivalent to $${kbMult}\\text{ KB}$ (Kilobytes)?`,
          opts: { A: `$${kbMult * 1024}\\text{ Bytes}$`, B: `$${kbMult * 1000}\\text{ Bytes}$`, C: `$${kbMult * 512}\\text{ Bytes}$`, D: `$${kbMult * 2048}\\text{ Bytes}$` },
          ans: 'A' as const,
          exp: `$1\\text{ KB} = 1024\\text{ Bytes}$. Therefore, $${kbMult}\\text{ KB} = ${kbMult} \\times 1024 = ${kbMult * 1024}\\text{ Bytes}$.`,
        },
        {
          q: `Convert the decimal integer $${decVal}$ into its equivalent binary representation:`,
          opts: {
            A: `$${binVal}_2$`,
            B: `$${(decVal + 1).toString(2)}_2$`,
            C: `$${(decVal + 2).toString(2)}_2$`,
            D: `$${(Math.max(1, decVal - 1)).toString(2)}_2$`,
          },
          ans: 'A' as const,
          exp: `The decimal number $${decVal}$ converted to binary (base-2) is $${binVal}_2$.`,
        },
        {
          q: `Which component of the Central Processing Unit (CPU) performs arithmetic calculations and logical decisions?`,
          opts: { A: 'Arithmetic Logic Unit (ALU)', B: 'Control Unit (CU)', C: 'Cache Memory', D: 'Instruction Register' },
          ans: 'A' as const,
          exp: 'The Arithmetic Logic Unit (ALU) performs all fundamental arithmetic calculations and logical comparisons in the CPU.',
        },
        {
          q: `Which type of primary computer memory is volatile, losing its data when electrical power is disconnected?`,
          opts: { A: 'Random Access Memory (RAM)', B: 'Read Only Memory (ROM)', C: 'Hard Disk Drive (HDD)', D: 'Solid State Drive (SSD)' },
          ans: 'A' as const,
          exp: 'RAM is primary volatile memory that requires continuous electric power to retain stored data.',
        },
        {
          q: `In computer networking, which protocol provides reliable, connection-oriented data packet delivery with sequence acknowledgments?`,
          opts: { A: 'Transmission Control Protocol (TCP)', B: 'User Datagram Protocol (UDP)', C: 'Internet Control Message Protocol (ICMP)', D: 'Address Resolution Protocol (ARP)' },
          ans: 'A' as const,
          exp: 'TCP establishes three-way handshakes and sequence acknowledgements to ensure reliable transmission over networks.',
        },
        {
          q: `Which network topology connects every individual device directly to a central multiport switch or hub?`,
          opts: { A: 'Star Topology', B: 'Bus Topology', C: 'Ring Topology', D: 'Mesh Topology' },
          ans: 'A' as const,
          exp: 'In a star topology, each network host is connected directly to a central multiport switch or hub.',
        },
        {
          q: `In high-level programming, which operator is used to compute the remainder of integer division?`,
          opts: { A: 'Modulo operator (`%`)', B: 'Division operator (`/`)', C: 'Floor division (`//`)', D: 'Exponentiation (`^`)' },
          ans: 'A' as const,
          exp: 'The modulo operator `%` calculates the remainder left over when one integer is divided by another.',
        },
        {
          q: `Which fundamental logic gate produces an output of $1$ (HIGH) ONLY when all of its inputs are $1$ (HIGH)?`,
          opts: { A: 'AND Gate', B: 'OR Gate', C: 'NOT Gate', D: 'XOR Gate' },
          ans: 'A' as const,
          exp: 'An AND gate produces a true (1) output if and only if all inputs are true (1).',
        },
        {
          q: `How many bits make up a standard IPv4 (Internet Protocol version 4) address?`,
          opts: { A: '32 bits (4 bytes)', B: '64 bits (8 bytes)', C: '128 bits (16 bytes)', D: '16 bits (2 bytes)' },
          ans: 'A' as const,
          exp: 'An IPv4 address consists of four 8-bit octets totaling 32 bits.',
        },
        {
          q: `Which software layer manages computer hardware resources and provides common services for application programs?`,
          opts: { A: 'Operating System (OS)', B: 'Compiler', C: 'Database Management System', D: 'Web Browser' },
          ans: 'A' as const,
          exp: 'The Operating System acts as the intermediary between computer hardware and user application programs.',
        },
        {
          q: `Which type of malicious software self-replicates across computer networks without requiring human intervention?`,
          opts: { A: 'Computer Worm', B: 'Trojan Horse', C: 'Spyware', D: 'Adware' },
          ans: 'A' as const,
          exp: 'A worm is standalone malware that replicates itself to spread to other computers automatically.',
        },
        {
          q: `In the database concept, which attribute uniquely identifies each record in a database table?`,
          opts: { A: 'Primary Key', B: 'Foreign Key', C: 'Composite Key', D: 'Secondary Key' },
          ans: 'A' as const,
          exp: 'A Primary Key enforces entity integrity by uniquely distinguishing each tuple/record in a relation.',
        },
        {
          q: `What is the standard port number used for secure HTTPS web browsing?`,
          opts: { A: 'Port 443', B: 'Port 80', C: 'Port 21', D: 'Port 25' },
          ans: 'A' as const,
          exp: 'HTTPS traffic encrypted via TLS/SSL standardly routes over TCP port 443.',
        },
        {
          q: `Which high-level language translator translates and executes source code line-by-line?`,
          opts: { A: 'Interpreter', B: 'Compiler', C: 'Assembler', D: 'Linker' },
          ans: 'A' as const,
          exp: 'An interpreter processes program code line by line, executing instructions sequentially.',
        },
        {
          q: `Which data structure follows the Last-In, First-Out (LIFO) order of elements?`,
          opts: { A: 'Stack', B: 'Queue', C: 'Array', D: 'Linked List' },
          ans: 'A' as const,
          exp: 'A stack operates strictly on LIFO order using push and pop operations.',
        },
      ];
      const cq = csPool[(dynIdx - 1) % csPool.length];
      addSafeQuestion({
        id: `cur_cs_${dynIdx}`,
        question: cq.q,
        options: cq.opts,
        correctAnswer: cq.ans,
        explanation: cq.exp,
        topic: chapterLabel,
        chapter: chapterLabel,
      });

    // ── 6. ENGLISH ─────────────────────────────────────────────────────────────
    } else if (normSub.includes('eng')) {
      const engPool = [
        {
          q: `Identify the grammatical part of speech of the capitalized word: "She spoke ELOQUENTLY during the presentation."`,
          opts: { A: 'Adverb', B: 'Adjective', C: 'Noun', D: 'Preposition' },
          ans: 'A' as const,
          exp: '"Eloquently" modifies the verb "spoke", describing how the action was performed, making it an adverb.',
        },
        {
          q: `Choose the correct preposition to complete the sentence: "He has been residing in Islamabad _____ 2018."`,
          opts: { A: 'since', B: 'for', C: 'from', D: 'during' },
          ans: 'A' as const,
          exp: '"Since" is used with a specific starting point in time in the present perfect continuous tense.',
        },
        {
          q: `Convert to Passive Voice: "The author wrote an outstanding novel."`,
          opts: { A: 'An outstanding novel was written by the author.', B: 'An outstanding novel is written by the author.', C: 'An outstanding novel has been written by the author.', D: 'An outstanding novel had written by the author.' },
          ans: 'A' as const,
          exp: 'Past simple active (wrote) converts to "was written" + by agent in passive voice.',
        },
        {
          q: `Which literary figure of speech is employed in: "The golden sunflowers bowed gracefully to the rising sun"?`,
          opts: { A: 'Personification', B: 'Simile', C: 'Metaphor', D: 'Hyperbole' },
          ans: 'A' as const,
          exp: 'Personification attributes human qualities (bowing gracefully) to non-human elements.',
        },
        {
          q: `What is the accurate synonym of the vocabulary word "Meticulous"?`,
          opts: { A: 'Careful and precise', B: 'Careless and hasty', C: 'Lazy and indifferent', D: 'Aggressive and harsh' },
          ans: 'A' as const,
          exp: '"Meticulous" refers to showing great attention to detail and being very thorough and precise.',
        },
        {
          q: `Identify the conditional sentence type: "If it rains tomorrow, we will stay indoors."`,
          opts: { A: 'First Conditional (Real Possibility)', B: 'Zero Conditional', C: 'Second Conditional (Hypothetical)', D: 'Third Conditional (Past Unfulfilled)' },
          ans: 'A' as const,
          exp: 'If + present simple, followed by will + bare infinitive is the standard First Conditional for real possibilities.',
        },
        {
          q: `Convert into indirect reporting: He said, "I am studying English literature."`,
          opts: { A: 'He said that he was studying English literature.', B: 'He said that he is studying English literature.', C: 'He said that he had studied English literature.', D: 'He told that he studies English literature.' },
          ans: 'A' as const,
          exp: 'Present continuous "am studying" backshifts to past continuous "was studying" in indirect reported speech.',
        },
        {
          q: `What is the accurate antonym of the word "Abundant"?`,
          opts: { A: 'Scarce and meager', B: 'Plentiful and rich', C: 'Bountiful', D: 'Excessive' },
          ans: 'A' as const,
          exp: '"Scarce" means in short supply or insufficient, which is the direct opposite of "abundant".',
        },
        {
          q: `Which of the following sentences contains a correct Gerund phrase acting as the subject?`,
          opts: { A: 'Swimming daily improves cardiovascular health.', B: 'She was swimming across the lake.', C: 'They will swim in the morning.', D: 'To swim is my favorite sport.' },
          ans: 'A' as const,
          exp: 'In "Swimming daily improves...", "Swimming" is a verbal noun (gerund) serving as the grammatical subject.',
        },
        {
          q: `Identify the sentence that correctly employs punctuation with an Oxford comma:`,
          opts: { A: 'We bought apples, oranges, and bananas.', B: 'We bought apples oranges, and bananas.', C: 'We bought apples, oranges and, bananas.', D: 'We bought apples, oranges, bananas,' },
          ans: 'A' as const,
          exp: 'The Oxford comma places a comma before the coordinating conjunction in a series of three or more items.',
        },
        {
          q: `What type of clause is the bracketed part: "[Although he studied hard], he felt nervous during the exam"?`,
          opts: { A: 'Adverbial clause of concession', B: 'Noun clause', C: 'Adjective clause', D: 'Relative clause' },
          ans: 'A' as const,
          exp: '"Although he studied hard" is a subordinate adverb clause indicating contrast/concession.',
        },
        {
          q: `Choose the correct idiom meaning "to face a difficult situation with courage":`,
          opts: { A: 'Bite the bullet', B: 'Break the ice', C: 'Spill the beans', D: 'Hit the sack' },
          ans: 'A' as const,
          exp: '"Bite the bullet" means to accept or endure an inevitable grim situation with courage.',
        },
        {
          q: `Identify the correct spelling of the following word:`,
          opts: { A: 'Accommodate', B: 'Acomodate', C: 'Accomodate', D: 'Acommodate' },
          ans: 'A' as const,
          exp: '"Accommodate" is spelled with double \'c\' and double \'m\'.',
        },
        {
          q: `Which mood is expressed in the sentence: "I wish I were capable of traveling to space"?`,
          opts: { A: 'Subjunctive Mood', B: 'Indicative Mood', C: 'Imperative Mood', D: 'Interrogative Mood' },
          ans: 'A' as const,
          exp: 'The subjunctive mood expresses wishes, hypothetical conditions, or non-factual desires using "were".',
        },
      ];
      const eq = engPool[(dynIdx - 1) % engPool.length];
      addSafeQuestion({
        id: `cur_eng_${dynIdx}`,
        question: eq.q,
        options: eq.opts,
        correctAnswer: eq.ans,
        explanation: eq.exp,
        topic: chapterLabel,
        chapter: chapterLabel,
      });

    // ── 7. URDU ────────────────────────────────────────────────────────────────
    } else if (normSub.includes('urd')) {
      const urduPool = [
        {
          q: `قواعد کی رو سے وہ اسم جو کسی معین اور خاص شخص، جگہ یا چیز کا نام ہو، کیا کہلاتا ہے؟`,
          opts: { A: 'اسمِ معرفہ (اسمِ خاص)', B: 'اسمِ نکرہ (اسمِ عام)', C: 'اسمِ صفت', D: 'اسمِ ضمیر' },
          ans: 'A' as const,
          exp: 'اسمِ معرفہ وہ اسم ہے جو کسی معین اور خاص شخص، جگہ یا چیز کا نام ہو۔',
        },
        {
          q: `غزل کے پہلے شعر کو جس کے دونوں مصرعے ہم قافیہ اور ہم ردیف ہوں، کیا کہا جاتا ہے؟`,
          opts: { A: 'مطلع', B: 'مقطع', C: 'حسنِ مطلع', D: 'بیت الغزل' },
          ans: 'A' as const,
          exp: 'غزل کے ہم قافیہ و ہم ردیف پہلے شعر کو مطلع کہتے ہیں۔',
        },
        {
          q: `لفظ "شجاعت" کا درست مترادف لفظ کون سا ہے؟`,
          opts: { A: 'بہادری اور دلیری', B: 'سخاوت اور فیاضی', C: 'صبر اور تحمل', D: 'عدل اور انصاف' },
          ans: 'A' as const,
          exp: 'شجاعت کا لغوی اور معنوی مفہوم دلیری و بہادری ہے۔',
        },
        {
          q: `وہ جملہ جس میں مسند اور مسند الیہ دونوں اسم ہوں، کیا کہلاتا ہے؟`,
          opts: { A: 'جملہ اسمیہ', B: 'جملہ فعلیہ', C: 'جملہ انشائیہ', D: 'جملہ خبریہ' },
          ans: 'A' as const,
          exp: 'جملہ اسمیہ میں مبتدا اور خبر دونوں اسم ہوتے ہیں اور فعلِ ناقص کے ذریعے جملہ مکمل ہوتا ہے۔',
        },
        {
          q: `علامہ اقبال کی مشہور نظم "شکوہ اور جوابِ شکوہ" ان کے کس شعری مجموعے میں شامل ہے؟`,
          opts: { A: 'بانگِ درا', B: 'بالِ جبریل', C: 'ضربِ کلیم', D: 'ارمغانِ حجاز' },
          ans: 'A' as const,
          exp: 'شکوہ اور جوابِ شکوہ علامہ اقبال کے پہلے اردو مجموعہ کلام "بانگِ درا" میں شامل ہیں۔',
        },
        {
          q: `کسی شعر میں کسی تاریخی واقعے، قرآنی آیت یا مذہبی قصے کی طرف اشارہ کرنا کیا کہلاتا ہے؟`,
          opts: { A: 'تلمیح', B: 'تشبیہ', C: 'استعارہ', D: 'مجازِ مرسل' },
          ans: 'A' as const,
          exp: 'علمِ بیان میں کسی مشہور تاریخی واقعے یا قرآنی قصے کی طرف مختصر اشارے کو تلمیح کہتے ہیں۔',
        },
        {
          q: `شعر کے آخر میں بار بار دہرائے جانے والے ہو بہو الفاظ کیا کہلاتے ہیں؟`,
          opts: { A: 'ردیف', B: 'قافیہ', C: 'وزن', D: 'بحر' },
          ans: 'A' as const,
          exp: 'ردیف وہ کلمہ یا کلمات ہیں جو قافیے کے بعد ہر شعر یا مصرع کے آخر میں من و عن دہرائے جاتے ہیں۔',
        },
        {
          q: `لفظ "فراز" کا درست متضاد لفظ کون سا ہے؟`,
          opts: { A: 'نشیب', B: 'بلندی', C: 'عروج', D: 'کمال' },
          ans: 'A' as const,
          exp: 'فراز کا معنی بلندی ہے اور اس کا متضاد نشیب (پستی) ہے۔',
        },
        {
          q: `وہ کلمہ جو کسی کام کے کرنے یا ہونے کو ظاہر کرے لیکن اس میں زمانہ پایا جائے، کیا کہلاتا ہے؟`,
          opts: { A: 'فعل', B: 'اسم', C: 'حرف', D: 'صفت' },
          ans: 'A' as const,
          exp: 'فعل وہ کلمہ ہے جس میں کسی کام کا کرنا یا ہونا کسی زمانے (ماضی، حال، مستقبل) کے ساتھ پایا جائے۔',
        },
        {
          q: `غزل کا آخری شعر جس میں شاعر اپنا تخلص استعمال کرے، کیا کہلاتا ہے؟`,
          opts: { A: 'مقطع', B: 'مطلع', C: 'بیت', D: 'فرد' },
          ans: 'A' as const,
          exp: 'مقطع غزل کا وہ آخری شعر ہے جس میں شاعر اپنا تخلص درج کرتا ہے۔',
        },
        {
          q: `لفظ "مسرت" کا درست ہم معنی (مترادف) لفظ کون سا ہے؟`,
          opts: { A: 'خوشی اور شادمانی', B: 'غم اور اندوہ', C: 'حیرت', D: 'خوف' },
          ans: 'A' as const,
          exp: 'مسرت کا معنی خوشی، انبساط اور شادمانی ہے۔',
        },
        {
          q: `حروفِ عطف کی مثال کون سی ہے؟`,
          opts: { A: 'اور، و، پھر', B: 'سے، پر، تک', C: 'کاش، اگر', D: 'کیونکہ، تاکہ' },
          ans: 'A' as const,
          exp: 'حروفِ عطف دو کلموں یا جملوں کو آپس میں ملانے والے حروف ہوتے ہیں جیسے اور، و، پھر وغیرہ۔',
        },
        {
          q: `مرکبِ توصیفی کن دو اجزاء سے مل کر بنتا ہے؟`,
          opts: { A: 'صفت اور موصوف', B: 'مضاف اور مضاف الیہ', C: 'معطوف اور معطوف علیہ', D: 'اسم اور فعل' },
          ans: 'A' as const,
          exp: 'مرکبِ توصیفی وہ مرکبِ ناقص ہے جو صفت اور موصوف سے مل کر بنے جیسے "نیک لڑکا"۔',
        },
      ];
      const uq = urduPool[(dynIdx - 1) % urduPool.length];
      addSafeQuestion({
        id: `cur_urd_${dynIdx}`,
        question: uq.q,
        options: uq.opts,
        correctAnswer: uq.ans,
        explanation: uq.exp,
        topic: chapterLabel,
        chapter: chapterLabel,
      });

    // ── 8. PAKISTAN STUDIES ────────────────────────────────────────────────────
    } else if (normSub.includes('pak') || normSub.includes('pst')) {
      const pstPool = [
        {
          q: `قراردادِ لاہور (قراردادِ پاکستان) کس تاریخ کو آل انڈیا مسلم لیگ کے اجلاس میں پیش کی گئی؟`,
          opts: { A: '23 مارچ 1940ء', B: '14 اگست 1947ء', C: '21 اپریل 1938ء', D: '3 جون 1947ء' },
          ans: 'A' as const,
          exp: '23 مارچ 1940ء کو منٹو پارک (اقبال پارک) لاہور میں شیرِ بنگال مولوی اے کے فضل الحق نے تاریخی قرارداد پیش کی۔',
        },
        {
          q: `پاکستان اور چین کے درمیان واقع دنیا کا سب سے بلند بین الاقوامی زمینی تجارتی راستہ کون سی شاہراہ ہے؟`,
          opts: { A: 'شاہراہِ قراقرم (N-35)', B: 'شاہراہِ ریشم قدیم', C: 'موٹروے M-2', D: 'گرینڈ ٹرنک (GT) روڈ' },
          ans: 'A' as const,
          exp: 'شاہراہِ قراقرم درہ خنجراب کے ذریعے پاکستان اور عوامی جمہوریہ چین کو آپس میں ملاتی ہے۔',
        },
        {
          q: `پاکستان کا سب سے بڑا قدرتی دریا کون سا ہے؟`,
          opts: { A: 'دریائے سندھ', B: 'دریائے جہلم', C: 'دریائے چناب', D: 'دریائے راوی' },
          ans: 'A' as const,
          exp: 'دریائے سندھ پاکستان کا قومی اور سب سے طویل و بڑا دریا ہے جس پر ملک کی زراعت کا بنیادی انحصار ہے۔',
        },
        {
          q: `قیامِ پاکستان کے بعد ریاست کی پہلی دستور ساز اسمبلی کے صدر کون منتخب ہوئے؟`,
          opts: { A: 'قائدِ اعظم محمد علی جناحؒ', B: 'لیاقت علی خانؒ', C: 'خواجہ ناظم الدین', D: 'مولوی تمیز الدین' },
          ans: 'A' as const,
          exp: '11 اگست 1947ء کو قائدِ اعظم محمد علی جناحؒ پاکستان کی پہلی دستور ساز اسمبلی کے بلامقابلہ صدر منتخب ہوئے۔',
        },
        {
          q: `پاکستان کی سب سے بلند پہاڑی چوٹی K-2 کس پہاڑی سلسلے میں واقع ہے؟`,
          opts: { A: 'سلسلہ کوہ قراقرم', B: 'سلسلہ کوہ ہمالیہ', C: 'سلسلہ کوہ ہندوکش', D: 'سلسلہ کوہ سلیمان' },
          ans: 'A' as const,
          exp: 'کے ٹو (گڈون آسٹن) دنیا کی دوسری اور پاکستان کی بلند ترین چوٹی ہے جو سلسلہ کوہ قراقرم میں واقع ہے۔',
        },
        {
          q: `علامہ محمد اقبالؒ نے اپنا تاریخی خطبہ الٰہ آباد کس سال پیش کیا جس میں الگ مسلم ریاست کا تصور دیا گیا؟`,
          opts: { A: '1930ء', B: '1940ء', C: '1935ء', D: '1928ء' },
          ans: 'A' as const,
          exp: 'دسمبر 1930ء میں مسلم لیگ کے الٰہ آباد اجلاس میں علامہ اقبالؒ نے برصغیر کے مسلمانوں کے لیے الگ خطہ ارض کی تجویز پیش کی۔',
        },
        {
          q: `پاکستان کا پہلا متفقہ آئین کس سال نافذ ہوا؟`,
          opts: { A: '1956ء', B: '1962ء', C: '1973ء', D: '1947ء' },
          ans: 'A' as const,
          exp: '23 مارچ 1956ء کو پاکستان کا پہلا آئین نافذ ہوا جس کے تحت ملک کو اسلامی جمہوریہ قرار دیا گیا۔',
        },
        {
          q: `قراردادِ مقاصد (Objectives Resolution) کس تاریخ کو دستور ساز اسمبلی میں منظور ہوئی؟`,
          opts: { A: '12 مارچ 1949ء', B: '14 اگست 1947ء', C: '23 مارچ 1956ء', D: '11 ستمبر 1948ء' },
          ans: 'A' as const,
          exp: '12 مارچ 1949ء کو وزیر اعظم لیاقت علی خان کی پیش کردہ تاریخی قراردادِ مقاصد اسمبلی نے منظور کی۔',
        },
        {
          q: `پاکستان کا قومی ترانہ کس معروف شاعر نے تحریر کیا؟`,
          opts: { A: 'حفیظ جالندھری', B: 'علامہ اقبال', C: 'فیض احمد فیض', D: 'احمد فراز' },
          ans: 'A' as const,
          exp: 'پاکستان کا قومی ترانہ حفیظ جالندھری نے تحریر کیا اور احمد جی چھاگلہ نے اس کی موسیقی ترتیب دی۔',
        },
        {
          q: `رقبے کے اعتبار سے پاکستان کا سب سے بڑا صوبہ کون سا ہے؟`,
          opts: { A: 'بلوچستان', B: 'پنجاب', C: 'سندھ', D: 'خیبر پختونخوا' },
          ans: 'A' as const,
          exp: 'صوبہ بلوچستان رقبے کے لحاظ سے پاکستان کا سب سے بڑا صوبہ ہے جو ملک کے تقریباً 44 فیصد رقبے پر محیط ہے۔',
        },
        {
          q: `پاکستان میں موجود دنیا کی دوسری سب سے بڑی نمک کی کان کہاں واقع ہے؟`,
          opts: { A: 'کھیوڑہ (ضلع جہلم)', B: 'وارچہ', C: 'کالا باغ', D: 'بہادر خیل' },
          ans: 'A' as const,
          exp: 'کھیوڑہ سالٹ مائن دنیا کی دوسری اور پاکستان کی سب سے بڑی قدرتی نمک کی کان ہے۔',
        },
        {
          q: `پاکستان کو سمندری راستوں سے دنیا سے منسلک کرنے والی سب سے قدیم اور بڑی قدرتی بندرگاہ کون سی ہے؟`,
          opts: { A: 'کراچی پورٹ', B: 'گوادر پورٹ', C: 'پورٹ قاسم', D: 'پسنی بندرگاہ' },
          ans: 'A' as const,
          exp: 'کراچی بندرگاہ پاکستان کی سب سے پرانی اور مصروف ترین تجارتی بندرگاہ ہے۔',
        },
      ];
      const pq = pstPool[(dynIdx - 1) % pstPool.length];
      addSafeQuestion({
        id: `cur_pst_${dynIdx}`,
        question: pq.q,
        options: pq.opts,
        correctAnswer: pq.ans,
        explanation: pq.exp,
        topic: chapterLabel,
        chapter: chapterLabel,
      });

    // ── 10. GENERAL / OTHER TOPICS ─────────────────────────────────────────────
    } else {
      const genPool = [
        {
          q: `Which form of renewable energy harnesses electromagnetic radiation directly from the Sun?`,
          opts: { A: 'Solar photovoltaic energy', B: 'Geothermal energy', C: 'Nuclear fission', D: 'Tidal energy' },
          ans: 'A' as const,
          exp: 'Solar energy directly converts solar electromagnetic photons into electrical or thermal energy.',
        },
        {
          q: `What is the chemical formula for ordinary pure water at standard ambient temperature and pressure?`,
          opts: { A: '$\\text{H}_2\\text{O}$', B: '$\\text{CO}_2$', C: '$\\text{NaCl}$', D: '$\\text{CH}_4$' },
          ans: 'A' as const,
          exp: 'Water consists of two hydrogen atoms covalently bonded to one oxygen atom ($\\text{H}_2\\text{O}$).',
        },
        {
          q: `Which layer of Earth\'s atmosphere contains the ozone layer that absorbs harmful solar ultraviolet (UV) radiation?`,
          opts: { A: 'Stratosphere', B: 'Troposphere', C: 'Mesosphere', D: 'Thermosphere' },
          ans: 'A' as const,
          exp: 'The stratosphere contains the protective ozone layer (O3) situated roughly 15 to 35 km above sea level.',
        },
        {
          q: `What is the standard unit of frequency corresponding to one complete cycle of oscillation per second?`,
          opts: { A: 'Hertz (Hz)', B: 'Decibel (dB)', C: 'Watt (W)', D: 'Joule (J)' },
          ans: 'A' as const,
          exp: 'One Hertz (Hz) equals one oscillation or vibrational cycle per second ($1\\text{ s}^{-1}$).',
        },
        {
          q: `Which device is used to measure electric potential difference (voltage) between two points in an electric circuit?`,
          opts: { A: 'Voltmeter', B: 'Ammeter', C: 'Galvanometer', D: 'Ohmmeter' },
          ans: 'A' as const,
          exp: 'A voltmeter is connected in parallel across circuit components to measure the potential difference in volts.',
        },
      ];
      const gq = genPool[(dynIdx - 1) % genPool.length];
      addSafeQuestion({
        id: `cur_gen_${dynIdx}`,
        question: gq.q,
        options: gq.opts,
        correctAnswer: gq.ans,
        explanation: gq.exp,
        topic: chapterLabel,
        chapter: chapterLabel,
      });
    }

    dynIdx++;
  }

  // Filter out any excluded questions
  const normExcludes = (excludeTexts || []).map((t) => t.trim().toLowerCase());
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
