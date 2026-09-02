import type { StoredLongQuestion } from '../../../types/questionBank';

/**
 * Authoritative Curated IELTS Long Questions Bank
 * Covers comprehensive analysis, extended responses, and essay tasks across IELTS subjects.
 */
export const IELTS_LISTENING_LONG_QUESTIONS: Record<string, StoredLongQuestion[]> = {
  'Section 4 (Academic Lecture)': [
    {
      id: 'lq_ielts_listen_s4_01',
      board: 'ielts',
      grade: 'ielts',
      subject: 'IELTS Listening',
      chapter: 'Section 4 (Academic Lecture)',
      chapterNumber: 4,
      topic: 'Oceanic Microplastic Deposition & Biodiversity Impact',
      question: 'Comprehensive analysis of an academic lecture on oceanic microplastics and marine trophic cascade.',
      parts: [
        {
          label: '(a)',
          text: 'Explain the mechanism by which primary microplastics differ from secondary microplastics in marine ecosystems, and summarize the three major transport mechanisms discussed in university oceanography lectures.',
          marks: 5,
        },
        {
          label: '(b)',
          text: 'Detail the note-taking and keyword-filtering techniques required when tracking unbroken scientific descriptions with dense technical nomenclature in Section 4.',
          marks: 5,
        },
      ],
      modelAnswer: '(a) Primary microplastics are manufactured at microscopic dimensions (microbeads, industrial pellets), whereas secondary microplastics result from photodegradation and mechanical wave weathering of macroplastics. The three major transport vectors are surface ocean gyres, fluvial runoff, and atmospheric wind-borne deposition.\n(b) In Section 4, candidates should focus on lecture structure markers (e.g., "The primary mechanism...", "Furthermore, research confirms..."), ignore non-essential descriptive adjectives, and capture core nouns and verbs that fit the note framework.',
      markingScheme: [
        'Accurate distinction between primary and secondary microplastics with transport vectors (5 Marks)',
        'Detailed note-taking strategy and macro-marker tracking methodology (5 Marks)',
      ],
      marks: 10,
      difficulty: 'hard',
      verified: true,
      source: 'expert-verified',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  'Section 3 (Academic Discussion)': [
    {
      id: 'lq_ielts_listen_s3_01',
      board: 'ielts',
      grade: 'ielts',
      subject: 'IELTS Listening',
      chapter: 'Section 3 (Academic Discussion)',
      chapterNumber: 3,
      topic: 'Comparative Research Methodology in Behavioral Psychology',
      question: 'Analysis of tutorial dialogue on qualitative vs quantitative data collection methodologies.',
      parts: [
        {
          label: '(a)',
          text: 'Outline the criteria used by academic supervisors to evaluate sample size adequacy and methodology justification in student research proposals.',
          marks: 5,
        },
        {
          label: '(b)',
          text: 'Analyze the conversational dynamics in Section 3 where candidates must distinguish between tutor suggestions, student misunderstandings, and final agreed revisions.',
          marks: 5,
        },
      ],
      modelAnswer: '(a) Supervisors assess sample representativeness, statistical power, randomized sampling protocols, and ethical participant consent.\n(b) Candidates must identify concession indicators ("I see your point, but...", "Let us modify that") to ensure they do not record initial erroneous student hypotheses as the agreed action.',
      markingScheme: [
        'Methodology evaluation standards in academic tutorials (5 Marks)',
        'Discourse tracking and conversational consensus identification (5 Marks)',
      ],
      marks: 10,
      difficulty: 'hard',
      verified: true,
      source: 'expert-verified',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
};

export const IELTS_SPEAKING_LONG_QUESTIONS: Record<string, StoredLongQuestion[]> = {
  'Part 2 (Individual Long Turn)': [
    {
      id: 'lq_ielts_speak_p2_01',
      board: 'ielts',
      grade: 'ielts',
      subject: 'IELTS Speaking',
      chapter: 'Part 2 (Individual Long Turn)',
      chapterNumber: 2,
      topic: 'Cue Card: Describe an Environmental Initiative in Your Community',
      question: 'Describe an environmental initiative or project that was recently introduced in your local area or city.',
      parts: [
        {
          label: '(a)',
          text: 'Provide a structured 2-minute candidate response covering: (1) What the initiative is and who organized it, (2) How it was implemented, (3) The public participation and reception, and (4) Explain why you believe this project is effective or what future improvements are required.',
          marks: 6,
        },
        {
          label: '(b)',
          text: 'Provide a detailed self-assessment breakdown against the 4 IELTS Speaking Band Descriptors (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation) demonstrating Band 8.5 performance criteria.',
          marks: 4,
        },
      ],
      modelAnswer: '(a) A comprehensive Band 8+ response using varied tenses (past simple for background, present continuous for current operations, future conditional for projections) and topic-specific vocabulary (e.g., "community-led reforestation", "municipal waste segregation", "carbon offset initiatives").\n(b) Fluency: natural speech rate with minimal hesitation; Lexical Resource: idiomatic phrases and collocations; Grammar: complex compound sentences with subordinate clauses; Pronunciation: accurate intonation contours and connected speech.',
      markingScheme: [
        'Well-structured 4-point response with fluent delivery and sophisticated vocabulary (6 Marks)',
        'Thorough analysis of 4 official IELTS Speaking criteria (4 Marks)',
      ],
      marks: 10,
      difficulty: 'hard',
      verified: true,
      source: 'expert-verified',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
};

export const IELTS_WRITING_ACADEMIC_LONG_QUESTIONS: Record<string, StoredLongQuestion[]> = {
  'Academic Task 2 (Discursive Essay)': [
    {
      id: 'lq_ielts_wacad_t2_01',
      board: 'ielts',
      grade: 'ielts',
      subject: 'IELTS Writing (Academic)',
      chapter: 'Academic Task 2 (Discursive Essay)',
      chapterNumber: 2,
      topic: 'Artificial Intelligence & the Future of Higher Education',
      question: 'Prompt: "Some educators argue that artificial intelligence tools should be completely banned in universities to protect academic integrity, while others maintain that AI literacy is an indispensable skill for the future workforce. Discuss both views and give your own opinion."',
      parts: [
        {
          label: '(a)',
          text: 'Write a comprehensive formal academic essay (minimum 250 words) that provides balanced discussion of both perspectives with a clear, sustained personal thesis.',
          marks: 6,
        },
        {
          label: '(b)',
          text: 'Annotate the essay demonstrating how the four official marking criteria (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) were satisfied at Band 8.5+ level.',
          marks: 4,
        },
      ],
      modelAnswer: '(a) A 4-paragraph essay: Introduction (paraphrase + balanced thesis); Body 1 (examination of plagiarism risks and assessment vulnerabilities); Body 2 (benefits of AI-assisted critical analysis and vocational preparedness); Conclusion (reasoned synthesis advocating ethical AI integration).\n(b) Annotation detailing cohesive devices, topical collocations, non-restrictive relative clauses, and varied sentence structures.',
      markingScheme: [
        'Comprehensive 250+ word academic essay addressing all prompt elements (6 Marks)',
        'Band 8.5+ criteria annotations with syntactic and lexical breakdown (4 Marks)',
      ],
      marks: 10,
      difficulty: 'hard',
      verified: true,
      source: 'expert-verified',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
};

export const IELTS_WRITING_GT_LONG_QUESTIONS: Record<string, StoredLongQuestion[]> = {
  'GT Task 2 (General Essay)': [
    {
      id: 'lq_ielts_wgt_t2_01',
      board: 'ielts',
      grade: 'ielts',
      subject: 'IELTS Writing (GT)',
      chapter: 'GT Task 2 (General Essay)',
      chapterNumber: 2,
      topic: 'Remote Working & Work-Life Balance',
      question: 'Prompt: "In many countries, working from home has become widespread. While some people believe it improves work-life balance, others feel it creates isolation and reduces productivity. Do the advantages of remote working outweigh the disadvantages?"',
      parts: [
        {
          label: '(a)',
          text: 'Write a complete General Training essay (minimum 250 words) evaluating the economic, social, and psychological dimensions of telecommuting.',
          marks: 6,
        },
        {
          label: '(b)',
          text: 'Explain the organizational structure used to weigh advantages against disadvantages without losing focus on your overarching thesis.',
          marks: 4,
        },
      ],
      modelAnswer: '(a) A well-developed essay exploring flexible scheduling, reduced commuting stress vs isolation and blurred work-personal boundaries, concluding with a firm evaluation.\n(b) Clear comparative paragraphing where disadvantages are addressed and shown to be manageable through hybrid models.',
      markingScheme: [
        'Complete General Training essay with coherent paragraphing (6 Marks)',
        'Analytical breakdown of advantages vs disadvantages weighting (4 Marks)',
      ],
      marks: 10,
      difficulty: 'hard',
      verified: true,
      source: 'expert-verified',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
};

export const ALL_IELTS_LONG_QUESTIONS: Record<string, Record<string, StoredLongQuestion[]>> = {
  'IELTS Listening': IELTS_LISTENING_LONG_QUESTIONS,
  'IELTS Speaking': IELTS_SPEAKING_LONG_QUESTIONS,
  'IELTS Writing (Academic)': IELTS_WRITING_ACADEMIC_LONG_QUESTIONS,
  'IELTS Writing (GT)': IELTS_WRITING_GT_LONG_QUESTIONS,
};
