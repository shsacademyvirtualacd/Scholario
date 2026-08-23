import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';
import { getGrade9FBISEQuestions } from './fbise9QuestionsBank';
import { validateQuestionTopicRelevance, validateMCQQuestion, checkQuestionDuplicate } from './mcqValidator';
import { getChapterSyllabusScope } from './curriculumFBISE9';

/**
 * High-quality, strictly syllabus-scoped fallback MCQ generator.
 * Guarantees that ALL returned questions belong strictly to the requested subject & chapter,
 * with zero cross-chapter bleed.
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
  const normTopic = (topic || '').trim();
  const selectedChaps = normTopic && normTopic !== 'Full Syllabus' && normTopic !== 'Mixed Chapters' && normTopic !== 'All'
    ? [normTopic]
    : [];

  // 1. Try authoritative Grade 9 FBISE question bank first
  const fbise9Questions = getGrade9FBISEQuestions(normSubject, selectedChaps, count, difficulty, excludeTexts);
  if (fbise9Questions.length >= count) {
    return fbise9Questions.slice(0, count);
  }

  // 2. Build dedicated, chapter-scoped questions pool
  const questions: MCQQuestion[] = [...fbise9Questions];
  const validationContext = { subject: normSubject, topic: normTopic, grade: String(grade), board: String(board) };
  const scope = getChapterSyllabusScope(normSubject, normTopic);

  const normSub = normSubject.toLowerCase();
  const normTop = normTopic.toLowerCase();

  // Helper to safely add valid, non-duplicate, chapter-confined question
  const addSafeQuestion = (q: MCQQuestion) => {
    if (!validateMCQQuestion(q, validationContext).valid) return false;
    if (!validateQuestionTopicRelevance(q, validationContext).valid) return false;
    if (checkQuestionDuplicate(q, questions, 0.65).isDuplicate) return false;
    questions.push(q);
    return true;
  };

  // Chapter-specific parameterized dynamic generation
  let dynIdx = 1;
  while (questions.length < count && dynIdx <= count * 15) {
    if (normSub.includes('phys')) {
      if (normTop.includes('measurement') || normTop.includes('physical quantit')) {
        const measVariants = [
          {
            q: `A Vernier Calipers has a least count of $0.01\\text{ cm}$. If the main scale reads $2.4\\text{ cm}$ and the ${dynIdx % 10 + 1}\\text{th}$ vernier division coincides with a main scale mark, what is the total reading?`,
            opts: {
              A: `$${(2.4 + (dynIdx % 10 + 1) * 0.01).toFixed(2)}\\text{ cm}$`,
              B: `$${(2.4 + (dynIdx % 10 + 1) * 0.1).toFixed(2)}\\text{ cm}$`,
              C: `$2.40\\text{ cm}$`,
              D: `$${(2.4 + (dynIdx % 10 + 1) * 0.001).toFixed(3)}\\text{ cm}$`,
            },
            ans: 'A' as const,
            exp: `Total Reading = Main scale reading + (Coinciding vernier division $\\times$ Least count) = $2.4 + (${dynIdx % 10 + 1} \\times 0.01) = ${(2.4 + (dynIdx % 10 + 1) * 0.01).toFixed(2)}\\text{ cm}$.`,
          },
          {
            q: `Which of the following SI prefixes represents the multiplier $10^{-${(dynIdx % 4 + 1) * 3}}$?`,
            opts: (dynIdx % 4 === 0)
              ? { A: 'Milli ($m$)', B: 'Micro ($\\mu$)', C: 'Nano ($n$)', D: 'Pico ($p$)' }
              : (dynIdx % 4 === 1)
              ? { A: 'Micro ($\\mu$)', B: 'Milli ($m$)', C: 'Nano ($n$)', D: 'Kilo ($k$)' }
              : (dynIdx % 4 === 2)
              ? { A: 'Nano ($n$)', B: 'Micro ($\\mu$)', C: 'Pico ($p$)', D: 'Mega ($M$)' }
              : { A: 'Pico ($p$)', B: 'Nano ($n$)', C: 'Femto ($f$)', D: 'Giga ($G$)' },
            ans: 'A' as const,
            exp: 'Standard SI metric prefixes establish base-10 powers for precision scientific measurements.',
          },
          {
            q: `A student measures the thickness of a glass slab using a micrometer screw gauge with pitch $0.5\\text{ mm}$ and 50 circular divisions. What is the least count?`,
            opts: { A: '$0.01\\text{ mm}$ ($0.001\\text{ cm}$)', B: '$0.1\\text{ mm}$', C: '$0.001\\text{ mm}$', D: '$0.05\\text{ mm}$' },
            ans: 'A' as const,
            exp: '$\\text{Least Count} = \\frac{\\text{Pitch}}{\\text{Total Circular Divisions}} = \\frac{0.5\\text{ mm}}{50} = 0.01\\text{ mm}$.',
          },
          {
            q: `How many significant figures are in the measurement $0.00${dynIdx + 1}050\\text{ kg}$?`,
            opts: { A: '4', B: '3', C: '6', D: '7' },
            ans: 'A' as const,
            exp: 'Leading zeros are not significant. The significant digits include the non-zero digits and trailing zeros after the decimal (4 significant figures).',
          },
        ];
        const v = measVariants[dynIdx % measVariants.length];
        addSafeQuestion({
          id: `cur_phy_meas_${dynIdx}`,
          question: v.q,
          options: v.opts,
          correctAnswer: v.ans,
          explanation: v.exp,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      } else if (normTop.includes('kinematic')) {
        const u = 0;
        const a = (dynIdx % 4) + 2;
        const t = (dynIdx % 5) + 3;
        const s = u * t + 0.5 * a * t * t;
        addSafeQuestion({
          id: `cur_phy_kin_${dynIdx}`,
          question: `An object starting from rest moves with uniform acceleration $a = ${a}\\text{ m/s}^2$ for $t = ${t}\\text{ s}$. Calculate the total distance covered:`,
          options: {
            A: `$${s.toFixed(1)}\\text{ m}$`,
            B: `$${(s * 2).toFixed(1)}\\text{ m}$`,
            C: `$${(a * t).toFixed(1)}\\text{ m}$`,
            D: `$${(s / 2).toFixed(1)}\\text{ m}$`,
          },
          correctAnswer: 'A',
          explanation: `Using the second equation of motion: $S = ut + \\frac{1}{2}at^2 = 0 + \\frac{1}{2}(${a})(${t}^2) = ${s.toFixed(1)}\\text{ m}$.`,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      } else if (normTop.includes('dynamic') || normTop.includes('force')) {
        const m = (dynIdx % 5) + 2;
        const a = (dynIdx % 4) + 3;
        const f = m * a;
        addSafeQuestion({
          id: `cur_phy_dyn_${dynIdx}`,
          question: `According to Newton's Second Law of Motion ($F=ma$), what net force is required to accelerate a body of mass $${m}\\text{ kg}$ at $${a}\\text{ m/s}^2$?`,
          options: {
            A: `$${f}\\text{ N}$`,
            B: `$${f + 10}\\text{ N}$`,
            C: `$${(f / 2).toFixed(0)}\\text{ N}$`,
            D: `$${m + a}\\text{ N}$`,
          },
          correctAnswer: 'A',
          explanation: `$F = ma = ${m}\\text{ kg} \\times ${a}\\text{ m/s}^2 = ${f}\\text{ N}$.`,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      } else if (normTop.includes('work') || normTop.includes('energy')) {
        const m = (dynIdx % 4) + 2;
        const h = (dynIdx % 5) * 4 + 5;
        const ep = m * 10 * h;
        addSafeQuestion({
          id: `cur_phy_work_${dynIdx}`,
          question: `Calculate the gravitational potential energy ($E_p = mgh$) of a $${m}\\text{ kg}$ object raised to a vertical height of $${h}\\text{ m}$ ($g = 10\\text{ m/s}^2$):`,
          options: {
            A: `$${ep}\\text{ J}$`,
            B: `$${ep / 2}\\text{ J}$`,
            C: `$${ep * 2}\\text{ J}$`,
            D: `$${ep + 100}\\text{ J}$`,
          },
          correctAnswer: 'A',
          explanation: `$E_p = mgh = ${m} \\times 10 \\times ${h} = ${ep}\\text{ J}$.`,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      } else {
        // General physics concept faithful to chapter name
        addSafeQuestion({
          id: `cur_phy_gen_${dynIdx}`,
          question: `In Grade ${grade} Physics (${scope.chapter}), which SI unit or defining physical law governs standard quantitative problem solving?`,
          options: {
            A: `Standard SI units and verified physical laws defined in ${scope.chapter}`,
            B: `Arbitrary uncalibrated measurement units`,
            C: `Non-standard imperial fractions`,
            D: `Dimensionless empirical estimates`,
          },
          correctAnswer: 'A',
          explanation: `All physical measurements and calculations in ${scope.chapter} are strictly formulated using standard SI units.`,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      }
    } else if (normSub.includes('chem')) {
      if (normTop.includes('atom') || normTop.includes('structure')) {
        const z = (dynIdx % 10) + 1;
        const n = z + (dynIdx % 3);
        const a = z + n;
        addSafeQuestion({
          id: `cur_chem_atom_${dynIdx}`,
          question: `An atom has atomic number $Z = ${z}$ and mass number $A = ${a}$. How many neutrons are in its nucleus?`,
          options: {
            A: `${n}`,
            B: `${z}`,
            C: `${a}`,
            D: `${a + z}`,
          },
          correctAnswer: 'A',
          explanation: `Number of neutrons $N = A - Z = ${a} - ${z} = ${n}$.`,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      } else {
        addSafeQuestion({
          id: `cur_chem_gen_${dynIdx}`,
          question: `In Grade ${grade} Chemistry (${scope.chapter}), which foundational chemical principle is standardly applied?`,
          options: {
            A: `Syllabus-defined chemical concepts and atomic/molecular principles for ${scope.chapter}`,
            B: `Non-empirical speculative properties`,
            C: `Alchemical historical hypotheses`,
            D: `Arbitrary non-stoichiometric ratios`,
          },
          correctAnswer: 'A',
          explanation: `Grade ${grade} Chemistry curriculum establishes precise chemical definitions and experimental laws for ${scope.chapter}.`,
          topic: scope.chapter,
          chapter: scope.chapter,
        });
      }
    } else if (normSub.includes('math')) {
      const a = (dynIdx % 6) + 2;
      const b = (dynIdx % 4) + 1;
      const sqDiff = a * a - b * b;
      addSafeQuestion({
        id: `cur_math_dyn_${dynIdx}`,
        question: `Evaluate the algebraic value of $(${a} - ${b})(${a} + ${b})$ using the difference of squares identity $a^2 - b^2$:`,
        options: {
          A: `$${sqDiff}$`,
          B: `$${sqDiff + 2}$`,
          C: `$${sqDiff - 2}$`,
          D: `$${a * a + b * b}$`,
        },
        correctAnswer: 'A',
        explanation: `Using $(a - b)(a + b) = a^2 - b^2 = ${a}^2 - ${b}^2 = ${a * a} - ${b * b} = ${sqDiff}$.`,
        topic: scope.chapter,
        chapter: scope.chapter,
      });
    } else {
      addSafeQuestion({
        id: `cur_gen_dyn_${dynIdx}`,
        question: `In ${normSubject} (${scope.chapter}), which standard curriculum standard is tested for Grade ${grade}?`,
        options: {
          A: `Authentic syllabus-aligned concepts and verified textbook principles for ${scope.chapter}`,
          B: `Non-syllabus speculative claims`,
          C: `Arbitrary unverified definitions`,
          D: `Informal general knowledge trivia`,
        },
        correctAnswer: 'A',
        explanation: `Curriculum assessments strictly evaluate verified learning outcomes specified for ${scope.chapter}.`,
        topic: scope.chapter,
        chapter: scope.chapter,
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
