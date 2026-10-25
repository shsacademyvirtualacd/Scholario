/**
 * Official Verified Knowledge Base for SHS Virtual Academy & Scholario LMS
 *
 * IMPORTANT:
 * Every single fact in this file is sourced directly from the project codebase
 * (`HeroSection.tsx`, `FeaturesSection.tsx`, `HowItWorksSection.tsx`, `ComparisonSection.tsx`,
 * `PricingSection.tsx`, `FAQSection.tsx`, and `src/constants/taxonomy.ts`).
 * Zero invented fees, zero fake student counts, zero fabricated teacher names, and zero unverified claims.
 */

export interface PublicGuideQuickChip {
  id: string;
  label: string;
  prompt: string;
}

export interface RoamingSectionBubble {
  id: string;
  sectionHint: 'hero' | 'android' | 'features' | 'how-it-works' | 'comparison' | 'pricing' | 'faq' | 'idle';
  text: string;
  topicPrompt: string;
}

export const ACADEMY_KNOWLEDGE_BASE = {
  institutionName: 'SHS Virtual Academy',
  platformName: 'Scholario',
  platformDomain: 'scholario.me',
  portalNature:
    'Scholario is the official Learning Management System (LMS) and virtual academy portal built exclusively for SHS Virtual Academy. It is a single-institution portal for enrolled students, parents/guardians, faculty teachers, and administrative staff.',
  supportContact: {
    email: 'shs.academy.virtual@gmail.com',
    hours: '9:00 AM to 9:00 PM PKT (Monday to Saturday)',
  },
  boardsAndPrograms: [
    {
      name: 'Federal Board (FBISE)',
      grades: ['9th Grade', '10th Grade', '11th Grade', '12th Grade'],
      streams: [
        'Science (Biology / Medical)',
        'Science (Computer Science)',
        'General Science',
        'Pre-Medical (HSSC)',
        'Pre-Engineering (HSSC)',
        'ICS (Computer Science)',
      ],
      feeStructure:
        'Default term tuition in system configuration is PKR 3,000 per term for Grades 9–10 and PKR 4,000 per term for Grades 11–12. Exact student fee vouchers are generated in the student portal based on enrolled board, grade, and stream.',
    },
    {
      name: 'Punjab Board (BISE Lahore & Provincial Boards)',
      grades: ['9th Grade'],
      streams: ['Science (Medical)', 'Science (Computer Science)', 'General Science'],
      feeStructure:
        'Default term tuition in system configuration is PKR 3,000 per term for Grade 9. Exact fee vouchers are generated in the student portal upon enrollment.',
    },
    {
      name: 'Sindh Board',
      grades: ['9th Grade', '10th Grade', '11th Grade', '12th Grade'],
      streams: ['Science (Biology)', 'Science (Computer Science)', 'Pre-Medical', 'Pre-Engineering', 'ICS'],
      feeStructure:
        'Default term tuition in system configuration is PKR 3,000 per term for Grades 9–10 and PKR 4,000 per term for Grades 11–12.',
    },
    {
      name: 'KPK Board (BISE Peshawar & Provincial Boards)',
      grades: ['9th Grade (SSC-I)', '10th Grade (SSC-II)', '11th Grade (HSSC-I)', '12th Grade (HSSC-II)'],
      streams: [
        'Science (Biology)',
        'Science (Computer Science)',
        'Pre-Medical',
        'Pre-Engineering',
        'ICS',
        'General Science',
        'Humanities / Arts',
      ],
      feeStructure:
        'Default term tuition in system configuration is PKR 3,000 per term for Grades 9–10 and PKR 4,000 per term for Grades 11–12.',
    },
    {
      name: 'Cambridge O Levels',
      grades: ['O1 (Year 9)', 'O2 (Year 10)', 'O3 (Year 11)'],
      streams: ['Science (Pre-Medical / Pre-Engineering)', 'Commerce / Business', 'Humanities / General'],
      feeStructure:
        'Strictly per-subject tuition at PKR 5,000 per subject per term, with a flat 5% discount when enrolling in 2 or more subjects.',
    },
    {
      name: 'Cambridge A Levels',
      grades: ['AS Level (A1)', 'A2 Level'],
      streams: ['Pre-Medical', 'Pre-Engineering', 'Computer Science & Tech', 'Business & Commerce', 'Humanities & Law'],
      feeStructure:
        'Strictly per-subject tuition at PKR 6,500 per subject per term, with a flat 5% discount when enrolling in 2 or more subjects.',
    },
    {
      name: 'IELTS Preparation',
      grades: ['Band 5.0–6.5 Foundation', 'Band 7.0+ Intensive', 'Crash Course (4 Weeks)', 'Executive / Weekend Batch'],
      streams: ['IELTS Academic (University & Study Abroad)', 'IELTS General Training (Immigration & Work)'],
      subjects: [
        'IELTS Listening',
        'IELTS Reading',
        'IELTS Writing',
        'IELTS Speaking',
        'English Grammar & Vocabulary',
        'Reading & Comprehension',
      ],
      feeStructure:
        'Default term tuition is PKR 2,500 per term for IELTS Academic and PKR 3,000 per term for IELTS General Training.',
    },
  ],
  coreFeatures: [
    'Sage AI Academic Assistant: 24/7 curriculum-aligned AI study companion with multimodal image/document analysis, RAG Subject Note Vault search, voice notes, text-to-speech in English & Urdu, and printable A4 PDF quiz/note generation.',
    'Live Interactive Classes: Scheduled daily and weekly live sessions launched directly from the student dashboard via Zoom or Google Meet.',
    'Subject Note Vault: 24/7 organized access to chapter notes, formula sheets, and past papers uploaded by faculty.',
    'Online Testing & Assessments: Timed MCQ exams and written tests with handwritten answer photo uploads, teacher grading, and detailed feedback.',
    'Real-Time Attendance Tracking: Automated session attendance logs with a 75% minimum attendance requirement for final exam clearance.',
    'Dedicated Parent Portal: Read-only guardian dashboard showing live attendance percentages, upcoming deadlines, test grades, and official academy announcements.',
    'Manual Fee Verification: Simple fee voucher generation and bank/mobile wallet receipt upload verified by administration within 24 business hours.',
    'Official Android App: Native Android APK available directly on the home page for mobile learning.',
  ],
  howToJoinSteps: [
    '1. Tap "Get Started" or "Sign In" at the top of the home page.',
    '2. Create your student account and select your Educational Board (FBISE, Punjab, Sindh, KPK, O/A Levels, or IELTS), Grade, and Stream.',
    '3. For official enrollment inquiries or assistance, email shs.academy.virtual@gmail.com (Support hours: 9 AM – 9 PM PKT, Monday to Saturday).',
  ],
  missingFactsPolicy: [
    'Do NOT invent physical campus addresses, phone/WhatsApp numbers, individual teacher names, past board exam pass percentages, topper lists, or unverified scholarships.',
    'If a visitor asks for a phone number, physical address, teacher bio, or custom discount not listed above, state honestly that those details are not listed publicly on the portal and invite them to email shs.academy.virtual@gmail.com or click Get Started.',
  ],
};

export const PUBLIC_GUIDE_QUICK_CHIPS: PublicGuideQuickChip[] = [
  {
    id: 'offer',
    label: 'What do you offer?',
    prompt: 'What programs, features, and classes does SHS Virtual Academy offer on Scholario?',
  },
  {
    id: 'join',
    label: 'How do I join?',
    prompt: 'How do I enroll or join SHS Virtual Academy as a student?',
  },
  {
    id: 'fees',
    label: 'Fees',
    prompt: 'What is the fee structure for matric/intermediate boards, O/A Levels, and IELTS?',
  },
  {
    id: 'boards',
    label: 'Which boards?',
    prompt: 'Which educational boards and grades do you cover?',
  },
];

export const ROAMING_CAT_SECTION_BUBBLES: RoamingSectionBubble[] = [
  {
    id: 'hero-1',
    sectionHint: 'hero',
    text: "Meow! I'm Tango 🐱 Tap me if you have questions about SHS Virtual Academy!",
    topicPrompt: 'What is SHS Virtual Academy and how does Scholario work?',
  },
  {
    id: 'hero-2',
    sectionHint: 'hero',
    text: 'Studying for FBISE, Punjab, Sindh, KPK, O/A Levels, or IELTS? Tap me to explore! ✨',
    topicPrompt: 'Which educational boards and grades do you cover?',
  },
  {
    id: 'android-1',
    sectionHint: 'android',
    text: 'Ooh, you can grab our official Scholario Android APK right here! 📱🐾',
    topicPrompt: 'Tell me about the Scholario Android app and mobile features.',
  },
  {
    id: 'features-1',
    sectionHint: 'features',
    text: 'Live classes, Subject Note Vault, online tests, and Sage AI — all in one portal! 🎓',
    topicPrompt: 'What features do students get inside the Scholario portal?',
  },
  {
    id: 'features-2',
    sectionHint: 'features',
    text: 'Parents get their own read-only dashboard to track attendance and grades! 👨‍👩‍👧',
    topicPrompt: 'How does the Parent Portal work at SHS Virtual Academy?',
  },
  {
    id: 'how-1',
    sectionHint: 'how-it-works',
    text: 'Joining is easy! Pick your board, grade & stream to get your tailored dashboard 🚀',
    topicPrompt: 'How do I enroll or join SHS Virtual Academy as a student?',
  },
  {
    id: 'comparison-1',
    sectionHint: 'comparison',
    text: 'No more scattered WhatsApp links — classes, notes & tests stay organized here! 📚',
    topicPrompt: 'How is Scholario better than traditional tuition and WhatsApp groups?',
  },
  {
    id: 'pricing-1',
    sectionHint: 'pricing',
    text: 'Curious about term fees or O/A Level per-subject pricing? Tap me to ask! 💡',
    topicPrompt: 'What is the fee structure for matric/intermediate boards, O/A Levels, and IELTS?',
  },
  {
    id: 'faq-1',
    sectionHint: 'faq',
    text: 'Still have a question? Tap me and ask — I know the whole academy guide! 🐾',
    topicPrompt: 'What are the most common questions about SHS Virtual Academy?',
  },
  {
    id: 'idle-1',
    sectionHint: 'idle',
    text: 'Purr... scrolling around? Tap me anytime to chat about classes or boards! 🐱',
    topicPrompt: 'What programs, features, and classes does SHS Virtual Academy offer on Scholario?',
  },
];

export const ACADEMY_KNOWLEDGE_SYSTEM_PROMPT = `You are Tango, the friendly, playful orange tabby cat guide on the public home page of Scholario (SHS Virtual Academy).
Your job is to welcome prospective students and parents, answer questions about SHS Virtual Academy and the Scholario LMS platform, and guide them to click "Get Started" or "Sign In" when they are ready.

STRICT GROUNDING RULES (CRITICAL):
1. Answer ONLY using the verified facts below. NEVER invent fees, exam results, student headcounts, teacher names, ratings, physical addresses, phone numbers, or guarantees.
2. If a user asks for a detail not present in the verified facts below (such as a phone/WhatsApp number, physical street address, specific teacher bios, or custom scholarship percentages), say honestly that it isn't listed on the public page and invite them to email ${ACADEMY_KNOWLEDGE_BASE.supportContact.email} (${ACADEMY_KNOWLEDGE_BASE.supportContact.hours}) or tap "Get Started".
3. You have ZERO access to private student records, grades, attendance logs, or internal database tables on this public page.
4. Keep your answers warm, concise (2 to 5 short sentences or a clean bullet list), and lightly cat-themed (an occasional friendly "Meow!" or "🐾", never overdone).

VERIFIED FACTS ABOUT SHS VIRTUAL ACADEMY & SCHOLARIO:
- Institution & Platform: ${ACADEMY_KNOWLEDGE_BASE.portalNature}
- Boards & Grades Covered:
  • Federal Board (FBISE): Grades 9, 10, 11, 12 (Medical/Biology, Computer Science, General Science, Pre-Medical, Pre-Engineering, ICS). Default term fee: PKR 3,000/term (Grades 9–10), PKR 4,000/term (Grades 11–12).
  • Punjab Board: Grade 9 (Medical, Computer Science, General Science). Default term fee: PKR 3,000/term.
  • Sindh Board: Grades 9, 10, 11, 12 (Biology, Computer Science, Pre-Medical, Pre-Engineering, ICS). Default term fee: PKR 3,000/term (Grades 9–10), PKR 4,000/term (Grades 11–12).
  • KPK Board: Grades 9 (SSC-I), 10 (SSC-II), 11 (HSSC-I), 12 (HSSC-II) (Biology, CS, Pre-Medical, Pre-Engineering, ICS, General Science, Humanities). Default term fee: PKR 3,000/term (Grades 9–10), PKR 4,000/term (Grades 11–12).
  • Cambridge O Levels (O1, O2, O3): PKR 5,000 per subject per term, with a flat 5% discount for 2 or more subjects.
  • Cambridge A Levels (AS/A1, A2): PKR 6,500 per subject per term, with a flat 5% discount for 2 or more subjects.
  • IELTS Preparation: Covers Listening, Reading, Writing, Speaking, plus Grammar & Comprehension. IELTS Academic is PKR 2,500/term; IELTS General Training is PKR 3,000/term.
- Core Platform Features:
  ${ACADEMY_KNOWLEDGE_BASE.coreFeatures.map((f) => `• ${f}`).join('\n  ')}
- How to Join / Enroll:
  ${ACADEMY_KNOWLEDGE_BASE.howToJoinSteps.join('\n  ')}
- Support Contact: Email ${ACADEMY_KNOWLEDGE_BASE.supportContact.email} (${ACADEMY_KNOWLEDGE_BASE.supportContact.hours}).`;

/**
 * Deterministic local fallback responder grounded strictly in `academyKnowledge.ts`.
 * Used when the Gemini API is unreachable or rate-limited so the public guide never breaks.
 */
export function getPublicGuideLocalAnswer(rawQuery: string): string {
  const q = (rawQuery || '').toLowerCase();

  if (/\b(fee|price|cost|tuition|charges|pkr|discount|payment|voucher)\b/.test(q)) {
    return `Here is our official tuition structure on Scholario 🐾:\n• **Matric & Intermediate Boards (FBISE, Punjab, Sindh, KPK):** PKR 3,000/term for Grades 9–10 and PKR 4,000/term for Grades 11–12.\n• **Cambridge O Levels:** PKR 5,000 per subject/term (flat **5% discount** for 2+ subjects).\n• **Cambridge A Levels:** PKR 6,500 per subject/term (flat **5% discount** for 2+ subjects).\n• **IELTS Preparation:** PKR 2,500/term (Academic) and PKR 3,000/term (General Training).\n\nOnce you sign in, you can view your exact fee voucher and upload your bank or mobile wallet receipt for verification within 24 business hours!`;
  }

  if (/\b(board|fbise|federal|punjab|sindh|kpk|cambridge|o\s*level|a\s*level|ielts|grade|class|stream|subject)\b/.test(q)) {
    return `SHS Virtual Academy supports **7 major tracks** on Scholario 🎓:\n• **Federal Board (FBISE):** Grades 9–12 (Biology/Medical, CS, Pre-Med, Pre-Eng, ICS, General Science)\n• **Punjab Board:** Grade 9 (Medical, CS, General Science)\n• **Sindh Board:** Grades 9–12 (Biology, CS, Pre-Med, Pre-Eng, ICS)\n• **KPK Board:** Grades 9–12 / SSC & HSSC (Biology, CS, Pre-Med, Pre-Eng, ICS, Humanities)\n• **Cambridge O Levels (O1–O3) & A Levels (AS/A2)**\n• **IELTS Preparation:** Academic & General Training (all 4 skills: Listening, Reading, Writing, Speaking).`;
  }

  if (/\b(join|enroll|register|sign\s*up|admission|start|apply|account)\b/.test(q)) {
    return `Joining **SHS Virtual Academy** on Scholario is super simple 🐾:\n1. Tap **"Get Started"** or **"Sign In"** at the top of this page.\n2. Create your account and select your **Board, Grade, and Stream**.\n3. Your dashboard will automatically load your subjects, live class schedule, Note Vault, and fee voucher!\n\nIf you need enrollment help, email us anytime at **shs.academy.virtual@gmail.com** (9 AM – 9 PM PKT, Mon–Sat).`;
  }

  if (/\b(parent|guardian|attendance|track)\b/.test(q)) {
    return `Yes! Parents and guardians get a dedicated **read-only Parent Portal** 👨‍👩‍👧 where they can monitor real-time class attendance (75% minimum required for exam clearance), upcoming assignment deadlines, online test grades, and official academy announcements.`;
  }

  if (/\b(android|apk|app|mobile|phone)\b/.test(q)) {
    return `You can download the official **Scholario Android APK** directly from the Android app card on this home page 📱! It gives you full access to live classes, the Subject Note Vault, online tests, and Sage AI right on your phone.`;
  }

  if (/\b(contact|email|phone|whatsapp|address|location|support|help)\b/.test(q)) {
    return `You can reach the **SHS Virtual Academy** support team at **shs.academy.virtual@gmail.com** 📧 during our support hours (**9:00 AM – 9:00 PM PKT, Monday to Saturday**). A public phone number or physical campus address isn't listed on the portal, so email or tapping **Get Started** is the fastest way to connect!`;
  }

  return `Meow! I'm **Tango**, your SHS Virtual Academy guide 🐱🐾\n\nOn **Scholario**, enrolled students get:\n• **Live Interactive Classes** (via Zoom / Google Meet)\n• **24/7 Subject Note Vault** & **Online MCQ / Written Tests**\n• **Sage AI Study Companion** (with math rendering, voice notes & printable A4 PDFs)\n• **Coverage for FBISE, Punjab, Sindh, KPK, Cambridge O/A Levels & IELTS**\n\nAsk me about **boards, fees, features, or how to join**, or tap **Get Started** above!`;
}
