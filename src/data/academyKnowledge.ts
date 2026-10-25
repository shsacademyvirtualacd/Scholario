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
    'Sage AI Academic Assistant (in-portal study assistant for enrolled students): 24/7 curriculum-aligned AI study companion inside the logged-in LMS with multimodal image/document analysis, RAG Subject Note Vault search, voice notes, text-to-speech in English & Urdu, and printable A4 PDF quiz/note generation.',
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

export const ROAMING_TANGO_SECTION_BUBBLES: RoamingSectionBubble[] = [
  {
    id: 'hero-1',
    sectionHint: 'hero',
    text: "Meow! I'm Tango 🐱 Tap me if you have questions about SHS Virtual Academy!",
    topicPrompt: 'What is SHS Virtual Academy and how does Scholario work?',
  },
  {
    id: 'hero-2',
    sectionHint: 'hero',
    text: 'Studying for FBISE, Punjab, Sindh, KPK, O/A Levels, or IELTS? Tap me to explore! 🐾',
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
    text: 'Inside the portal: live classes, Subject Note Vault, online tests & the Sage AI study assistant! 🎓',
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

// Backward-compatible export alias
export const ROAMING_CAT_SECTION_BUBBLES = ROAMING_TANGO_SECTION_BUBBLES;

/**
 * Unicode-aware regex that matches ONLY the specified star/sparkle characters
 * (✦ ✧ ★ ☆ ✨ ⭐ 🌟 💫 ⋆ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰) and any variation selectors attached to them,
 * without ever splitting UTF-16 surrogate pairs for other emoji (🐱, 👋, 😊, 🐾, etc.).
 */
const TANGO_STAR_CODEPOINTS = new Set<number>([
  0x2726, // ✦
  0x2727, // ✧
  0x2605, // ★
  0x2606, // ☆
  0x2728, // ✨
  0x2b50, // ⭐
  0x1f31f, // 🌟
  0x1f4ab, // 💫
  0x22c6, // ⋆
  0x2729, // ✩
  0x272a, // ✪
  0x272b, // ✫
  0x272c, // ✬
  0x272d, // ✭
  0x272e, // ✮
  0x272f, // ✯
  0x2730, // ✰
]);

export function stripTangoStarsUnicode(input: string): string {
  if (!input) return '';
  const codePoints = Array.from(input);
  const out: string[] = [];
  let skipVariationSelector = false;

  for (const ch of codePoints) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && TANGO_STAR_CODEPOINTS.has(cp)) {
      skipVariationSelector = true;
      continue;
    }
    if (skipVariationSelector && (cp === 0xfe0e || cp === 0xfe0f)) {
      continue;
    }
    skipVariationSelector = false;
    out.push(ch);
  }

  return out.join('');
}

export function truncateByCodePoints(input: string, maxCodePoints: number): string {
  if (!input) return '';
  const cps = Array.from(input);
  return cps.length <= maxCodePoints ? input : cps.slice(0, maxCodePoints).join('');
}

export const ACADEMY_KNOWLEDGE_SYSTEM_PROMPT = `You are Tango, the friendly orange tabby cat guide on the public home page of Scholario (SHS Virtual Academy).
Your job is to welcome prospective students and parents, answer questions about SHS Virtual Academy and the Scholario LMS platform, and guide them to click "Get Started" or "Sign In" when they are ready.

IDENTITY & ROLE BOUNDARY:
- Your name is strictly Tango. Never call yourself Sage. "Sage AI" is the separate 24/7 in-app study assistant inside the logged-in student portal. If asked about Sage AI, explain briefly that you are Tango (the public home page guide) and Sage AI is the study assistant inside the portal for enrolled students.
- Do NOT repeat your self-introduction ("I'm Tango...") after the first message in a conversation. Since the chat already starts with your greeting, jump straight into answering the user's message.
- Never use star or sparkle symbols or emojis (✦ ✧ ★ ☆ ✨ ⭐ 🌟 💫 ⋆ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰) anywhere in your responses. Other friendly emojis like 🐱, 👋, 😊, 🐾 are welcome in moderation.

FORMATTING & TONE RULES (CRITICAL):
- Use plain, short sentences.
- Avoid asterisks (* or **) completely. Do not wrap words in asterisks.
- Use simple "- " bullets ONLY when listing 3 or more items. For 1 or 2 items, write a normal short sentence instead of bullets.

REPLY LENGTH & PROPORTIONALITY (CRITICAL):
- Answer in proportion to the user's message:
  1. Short or casual messages ("hi", "hello", "hey", "salam", "hmm", "ok", "okay", "thanks", "thank you", etc.): Reply with 1 short friendly sentence plus one question like "What would you like to know about boards, fees, or live classes?" Do NOT repeat the feature list and do NOT re-introduce yourself.
  2. Specific questions (e.g., about fees, a specific board, joining, parent portal, Android app, or support): Answer ONLY what was asked, in 2 to 4 plain sentences (using "- " bullets only if listing 3+ items).
  3. Full feature overview: Give the full overview of Scholario features ONLY when the user specifically asks "what do you offer", "what features do you have", or similar.

STRICT GROUNDING RULES:
1. Answer ONLY using the verified facts below. NEVER invent fees, exam results, student headcounts, teacher names, ratings, physical addresses, phone numbers, or guarantees.
2. If a user asks for a detail not present in the verified facts below (such as a phone/WhatsApp number, physical street address, specific teacher bios, or custom scholarship percentages), say honestly in 1-2 sentences that it isn't listed on the public page and invite them to email ${ACADEMY_KNOWLEDGE_BASE.supportContact.email} (${ACADEMY_KNOWLEDGE_BASE.supportContact.hours}) or tap "Get Started".
3. You have ZERO access to private student records, grades, attendance logs, or internal database tables on this public page.

VERIFIED FACTS ABOUT SHS VIRTUAL ACADEMY & SCHOLARIO:
- Institution & Platform: ${ACADEMY_KNOWLEDGE_BASE.portalNature}
- Boards & Grades Covered:
  - Federal Board (FBISE): Grades 9, 10, 11, 12 (Medical/Biology, Computer Science, General Science, Pre-Medical, Pre-Engineering, ICS). Default term fee: PKR 3,000/term (Grades 9–10), PKR 4,000/term (Grades 11–12).
  - Punjab Board: Grade 9 (Medical, Computer Science, General Science). Default term fee: PKR 3,000/term.
  - Sindh Board: Grades 9, 10, 11, 12 (Biology, Computer Science, Pre-Medical, Pre-Engineering, ICS). Default term fee: PKR 3,000/term (Grades 9–10), PKR 4,000/term (Grades 11–12).
  - KPK Board: Grades 9 (SSC-I), 10 (SSC-II), 11 (HSSC-I), 12 (HSSC-II) (Biology, CS, Pre-Medical, Pre-Engineering, ICS, General Science, Humanities). Default term fee: PKR 3,000/term (Grades 9–10), PKR 4,000/term (Grades 11–12).
  - Cambridge O Levels (O1, O2, O3): PKR 5,000 per subject per term, with a flat 5% discount for 2 or more subjects.
  - Cambridge A Levels (AS/A1, A2): PKR 6,500 per subject per term, with a flat 5% discount for 2 or more subjects.
  - IELTS Preparation: Covers Listening, Reading, Writing, Speaking, plus Grammar & Comprehension. IELTS Academic is PKR 2,500/term; IELTS General Training is PKR 3,000/term.
- Core Platform Features:
  ${ACADEMY_KNOWLEDGE_BASE.coreFeatures.map((f) => `- ${f}`).join('\n  ')}
- How to Join / Enroll:
  ${ACADEMY_KNOWLEDGE_BASE.howToJoinSteps.join('\n  ')}
- Support Contact: Email ${ACADEMY_KNOWLEDGE_BASE.supportContact.email} (${ACADEMY_KNOWLEDGE_BASE.supportContact.hours}).`;

/**
 * Deterministic local fallback responder for Tango grounded strictly in `academyKnowledge.ts`.
 * Used when the Gemini API is unreachable or rate-limited so the Tango public guide never breaks.
 */
export function getPublicGuideLocalAnswer(rawQuery: string): string {
  const q = (rawQuery || '').trim().toLowerCase();
  const cleanWords = q.replace(/[^\p{L}\p{N}\s]/gu, '').trim();

  // 1. Short/casual greetings & acknowledgements: 1 short friendly sentence + 1 question, no feature list
  if (
    /^(hi+|hello+|hey+|heya|hiya|salam|assalam\s*o\s*alaikum|aoa|yo|sup|good\s*(morning|afternoon|evening))$/i.test(
      cleanWords
    )
  ) {
    return `Hello there! 👋🐱 What would you like to know about boards, fees, or live classes?`;
  }

  if (/^(hmm+|hm+|ok+|okay|k|alright|got\s*it|i\s*see|cool|nice|great|awesome|yes|yep|yeah|no|nope)$/i.test(cleanWords)) {
    return `Happy to help anytime! 🐾 What would you like to know about boards, fees, or live classes?`;
  }

  if (/^(thanks|thank\s*you|thx|ty|shukriya|jazakallah|thanks\s*a\s*lot)$/i.test(cleanWords)) {
    return `You're very welcome! 🐱🐾 What else would you like to know about boards, fees, or live classes?`;
  }

  // 2. Identity question
  if (/\b(who are you|your name|tango|sage)\b/.test(q)) {
    return `I'm Tango 🐱, the public home page guide for SHS Virtual Academy on Scholario. I help prospective students and parents with questions about boards, fees, and enrollment, while Sage AI is the 24/7 study assistant inside the portal for enrolled students. What would you like to know about our classes or boards?`;
  }

  // 3. Fees / tuition question
  if (/\b(fee|fees|price|cost|tuition|charges|pkr|discount|payment|voucher)\b/.test(q)) {
    return `Here is our tuition structure per term on Scholario 🐾:\n- Matric & Intermediate Boards (FBISE, Punjab, Sindh, KPK): PKR 3,000/term for Grades 9–10 and PKR 4,000/term for Grades 11–12\n- Cambridge O Levels: PKR 5,000 per subject/term (5% discount for 2+ subjects)\n- Cambridge A Levels: PKR 6,500 per subject/term (5% discount for 2+ subjects)\n- IELTS Preparation: PKR 2,500/term (Academic) and PKR 3,000/term (General Training)\nOnce you sign in, you can upload your bank or mobile wallet receipt for verification within 24 business hours.`;
  }

  // 4. Full feature overview (only when asking what we offer / features / programs)
  if (/\b(what do you offer|features|programs|what is scholario|about shs|overview|everything you offer)\b/.test(q)) {
    return `SHS Virtual Academy on Scholario offers a complete online learning portal for Grade 9–12, Cambridge O/A Levels, and IELTS students 🎓:\n- Live interactive classes via Zoom and Google Meet\n- 24/7 Subject Note Vault and online MCQ & written assessments\n- In-portal Sage AI study assistant with voice notes and printable A4 PDFs\n- Dedicated read-only Parent Portal for real-time attendance and grade tracking\nWould you like details on a specific board, fee structure, or how to enroll?`;
  }

  // 5. Boards / grades / subjects
  if (/\b(board|boards|fbise|federal|punjab|sindh|kpk|cambridge|o\s*level|a\s*level|ielts|grade|grades|class|classes|stream|subject|subjects)\b/.test(q)) {
    return `SHS Virtual Academy supports 7 academic tracks on Scholario 🎓:\n- Federal Board (FBISE), Sindh Board, and KPK Board: Grades 9–12 (Biology/Medical, CS, Pre-Medical, Pre-Engineering, ICS)\n- Punjab Board: Grade 9 (Medical, Computer Science, General Science)\n- Cambridge O Levels (O1–O3) and A Levels (AS/A2)\n- IELTS Preparation: Academic and General Training covering all 4 skills\nWhich board or grade are you interested in joining?`;
  }

  // 6. How to join / enroll
  if (/\b(join|enroll|register|sign\s*up|admission|start|apply|account)\b/.test(q)) {
    return `You can join SHS Virtual Academy in three quick steps 🐾:\n- Tap Get Started or Sign In at the top of this page to create your account\n- Select your Board, Grade, and Stream (or O/A Level and IELTS subjects)\n- Your dashboard will immediately load your subjects, live class schedule, Note Vault, and fee voucher\nIf you need help, email shs.academy.virtual@gmail.com (9 AM – 9 PM PKT, Mon–Sat).`;
  }

  // 7. Parent portal / attendance
  if (/\b(parent|guardian|attendance|track)\b/.test(q)) {
    return `Parents and guardians get a dedicated read-only Parent Portal 👨‍👩‍👧 to check real-time class attendance (75% minimum required for exam clearance), upcoming assignment deadlines, and test grades. Would you like to know how to set up a student and parent account?`;
  }

  // 8. Android app / mobile
  if (/\b(android|apk|app|mobile|phone)\b/.test(q)) {
    return `You can download the official Scholario Android APK directly from the Android app section on this home page 📱. It gives students full access to live classes, the Subject Note Vault, online tests, and the in-portal study tools right on their phone.`;
  }

  // 9. Contact / support
  if (/\b(contact|email|phone|whatsapp|address|location|support|help)\b/.test(q)) {
    return `You can reach the SHS Virtual Academy support team at shs.academy.virtual@gmail.com 📧 from 9:00 AM to 9:00 PM PKT (Monday to Saturday). A public phone number or physical address isn't listed on the page, so email or tapping Get Started is the quickest way to connect!`;
  }

  // Default concise reply for short or unrecognized messages
  return `I'm here to help with any questions about SHS Virtual Academy! 🐾 What would you like to know about boards, fees, or live classes?`;
}
