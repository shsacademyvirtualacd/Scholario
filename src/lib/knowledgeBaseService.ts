/**
 * Sage Knowledge Base & RAG Retrieval Service
 * 
 * Provides:
 * 1. Document chunking pipeline with configurable token/character boundaries
 * 2. Vector search integration with database vector store (match_knowledge_base RPC)
 * 3. Authoritative institutional seed knowledge (Grading policies, Note Vault, Attendance, Rules)
 * 4. Fallback search mechanism when database vector extension is pending
 */

export const SAGE_CHAT_MODEL = 'gemini-3.6-flash';
export const SAGE_EMBEDDING_MODEL = 'gemini-embedding-001';
export const SAGE_EMBEDDING_DIMENSIONS = 768;

export interface KnowledgeBaseChunk {
  id?: string;
  title: string;
  category: 'notes' | 'policy' | 'handbook' | 'faq' | 'curriculum' | string;
  source_type: 'note_vault' | 'policy_doc' | 'handbook' | 'faq' | string;
  source_id?: string;
  metadata?: Record<string, any>;
  content_chunk: string;
  chunk_index?: number;
  similarity?: number;
}

export interface IngestDocumentParams {
  title: string;
  category: 'notes' | 'policy' | 'handbook' | 'faq' | 'curriculum' | string;
  source_type: 'note_vault' | 'policy_doc' | 'handbook' | 'faq' | string;
  source_id?: string;
  metadata?: Record<string, any>;
  content: string;
}

/**
 * Splits continuous text into overlapping semantic chunks
 */
export function chunkDocumentText(
  text: string,
  maxChunkSize = 750,
  overlap = 100
): string[] {
  if (!text || text.trim().length === 0) return [];
  const clean = text.trim();
  if (clean.length <= maxChunkSize) return [clean];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + maxChunkSize;
    if (endIndex >= clean.length) {
      chunks.push(clean.substring(startIndex).trim());
      break;
    }

    // Attempt to break cleanly on a paragraph or sentence boundary
    const lookbackZone = clean.substring(startIndex + maxChunkSize - 150, endIndex);
    const lastParagraph = lookbackZone.lastIndexOf('\n\n');
    const lastNewline = lookbackZone.lastIndexOf('\n');
    const lastPeriod = lookbackZone.lastIndexOf('. ');

    let splitOffset = maxChunkSize;
    if (lastParagraph !== -1) {
      splitOffset = (maxChunkSize - 150) + lastParagraph + 2;
    } else if (lastPeriod !== -1) {
      splitOffset = (maxChunkSize - 150) + lastPeriod + 2;
    } else if (lastNewline !== -1) {
      splitOffset = (maxChunkSize - 150) + lastNewline + 1;
    }

    chunks.push(clean.substring(startIndex, startIndex + splitOffset).trim());
    startIndex += Math.max(1, splitOffset - overlap);
  }

  return chunks.filter((c) => c.length > 20);
}

/**
 * Institutional verified seed knowledge for fallback retrieval
 */
export const CORE_INSTITUTIONAL_KNOWLEDGE: KnowledgeBaseChunk[] = [
  {
    title: 'Attendance & Exam Clearance Policy',
    category: 'policy',
    source_type: 'handbook',
    source_id: 'policy-att-75',
    metadata: { scope: 'students', min_attendance: '75%' },
    content_chunk:
      'Students must maintain a minimum of 75% attendance in each enrolled class offering to qualify for semester examinations and official board registration. Automated QR check-in and geofence tracking record entry. Absences exceeding 3 consecutive days require official medical documentation or an approved leave application submitted via the portal.',
  },
  {
    title: 'DepEd & FBISE Grading and Transmutation Scale',
    category: 'policy',
    source_type: 'handbook',
    source_id: 'policy-grading-fbise',
    metadata: { scope: 'assessment', passing_mark: '33%' },
    content_chunk:
      'The academic grading framework uses standard transmutation tables. The minimum passing threshold is 33% for FBISE secondary and higher secondary certifications (75% transmuted passing grade in DepEd-aligned evaluations). A+ represents 80% and above, A represents 70-79%, B represents 60-69%, C represents 50-59%, D represents 40-49%, and E represents 33-39%. Practical assessments constitute 15-20% of the aggregate grade for scientific laboratory subjects.',
  },
  {
    title: 'Online Examination Regulations & Proctoring',
    category: 'policy',
    source_type: 'handbook',
    source_id: 'policy-exam-rules',
    metadata: { scope: 'exams', tab_switch_detection: true },
    content_chunk:
      'All formal periodic examinations and written tests must be submitted before the countdown timer expires. In timed online tests, browser tab switching and window minimization are monitored. Written submissions must be uploaded as clear, legible PDF or high-resolution JPEG files displaying student name, roll number, and handwritten workings.',
  },
  {
    title: 'Subject Note Vault Structure & Availability',
    category: 'notes',
    source_type: 'handbook',
    source_id: 'vault-overview',
    metadata: { scope: 'curriculum', grades: ['9', '10', '11', '12'] },
    content_chunk:
      'The Subject Note Vault organizes teacher-verified lecture notes, formula sheets, chapter summaries, and past paper solutions for Grades 9 through 12. Notes are categorized by Board (FBISE, Sindh Board), Class Grade, and Stream (Pre-Medical, Pre-Engineering, Computer Science / ICS). Students can access all materials 24/7 with offline download support.',
  },
  {
    title: 'Tuition Billing, Installments & Verification',
    category: 'policy',
    source_type: 'handbook',
    source_id: 'finance-fees',
    metadata: { scope: 'operations', grace_days: 14 },
    content_chunk:
      'Tuition fee assessments are generated per academic semester or monthly billing plan. Installment plans allow split payments across 2 or 3 scheduled dates. Receipts and bank deposit proofs uploaded through the checkout portal are verified by the finance office within 24 business hours. Overdue accounts past 14 grace days incur standard late charges unless a scholarship or hardship discount is formally approved.',
  },
  {
    title: 'FBISE Physics Syllabus & Key Chapters (Grades 9-12)',
    category: 'curriculum',
    source_type: 'note_vault',
    source_id: 'curriculum-physics',
    metadata: { subject: 'Physics', board: 'FBISE' },
    content_chunk:
      'FBISE Physics emphasizes conceptual derivations and numerical problem solving. Class 9 covers Physical Quantities, Kinematics, Dynamics, Turning Effect of Forces, Gravitation, Work & Energy, and Properties of Matter. Class 10 covers Simple Harmonic Motion & Waves, Sound, Geometrical Optics, Electrostatics, Current Electricity, Electromagnetism, Basic Electronics, and Atomic & Nuclear Physics. Class 11-12 covers Vectors & Equilibrium, Motion & Force, Work, Power & Energy, Circular Motion, Fluid Dynamics, Oscillations, Waves, Physical Optics, Thermodynamics, Electrostatics, Current, Electromagnetism, Induction, AC Circuits, Physics of Solids, Electronics, Dawn of Modern Physics, Atomic Spectra, and Nuclear Physics.',
  },
  {
    title: 'FBISE Mathematics Core Formulations & Units (Grades 9-12)',
    category: 'curriculum',
    source_type: 'note_vault',
    source_id: 'curriculum-math',
    metadata: { subject: 'Mathematics', board: 'FBISE' },
    content_chunk:
      'FBISE Mathematics covers Matrices & Determinants, Real & Complex Numbers, Logarithms, Algebraic Expressions & Formulas, Factorization, Linear Equations, Quadratic Equations (discriminant $\\Delta = b^2 - 4ac$, quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$), Trigonometry (fundamental identities $\\sin^2 \\theta + \\cos^2 \\theta = 1$, addition formulas, Law of Sines & Cosines), Analytical Geometry (straight line equations, conic sections), Differentiation (product, quotient, and chain rules), Integration (integration by parts $\\int u v\\, dx = u \\int v\\, dx - \\int (u\' \\int v\\, dx)\\, dx$), and Vectors.',
  },
  {
    title: 'FBISE Chemistry & Biology Fundamentals',
    category: 'curriculum',
    source_type: 'note_vault',
    source_id: 'curriculum-chem-bio',
    metadata: { subject: 'Chemistry/Biology', board: 'FBISE' },
    content_chunk:
      'FBISE Chemistry focuses on Atomic Structure, Chemical Bonding, States of Matter, Solutions, Electrochemistry, Chemical Kinetics, Equilibrium ($K_c, K_p$), Thermodynamics, and Organic Reaction Mechanisms (alkanes, alkenes, functional groups, SN1/SN2 mechanisms). FBISE Biology focuses on Cell Structure, Biological Molecules, Enzymes, Bioenergetics (Photosynthesis, Cellular Respiration), Biodiversity, Human Physiology (Circulation, Digestion, Nervous Coordination), Genetics, and Biotechnology.',
  },
];

/**
 * Fallback in-memory search using token overlap scoring
 */
export function searchFallbackKnowledgeBase(
  query: string,
  limit = 4,
  categoryFilter?: string
): KnowledgeBaseChunk[] {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) {
    return CORE_INSTITUTIONAL_KNOWLEDGE.slice(0, limit);
  }

  const scored = CORE_INSTITUTIONAL_KNOWLEDGE.map((chunk) => {
    if (categoryFilter && chunk.category !== categoryFilter) {
      return { chunk, score: -1 };
    }
    const combined = `${chunk.title} ${chunk.content_chunk} ${JSON.stringify(chunk.metadata || {})}`.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (chunk.title.toLowerCase().includes(term)) score += 3;
      if (combined.includes(term)) score += 1;
    }
    return { chunk: { ...chunk, similarity: Math.min(0.95, 0.4 + score * 0.1) }, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.chunk);
}
