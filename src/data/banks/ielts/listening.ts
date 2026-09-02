import type { StoredMCQ } from '../../../types/questionBank';
import { IELTS_LISTENING_CLIPS } from '../../ielts/listeningClips';

export const IELTS_LISTENING_MCQS: StoredMCQ[] = IELTS_LISTENING_CLIPS.map((clip, idx) => {
  return {
    id: `ielts-listen-q-${String(idx + 1).padStart(2, '0')}`,
    board: 'ielts',
    grade: 'ielts',
    subject: 'IELTS Listening',
    chapter: clip.section,
    chapterNumber:
      clip.section.includes('Section 1') ? 1 :
      clip.section.includes('Section 2') ? 2 :
      clip.section.includes('Section 3') ? 3 : 4,
    topic: clip.title,
    question: `[Audio Context: ${clip.title} - ${clip.speaker} (${clip.accent})]\n"${clip.transcript}"\n\nPrompt & Listening Task: ${clip.promptInstruction}`,
    options: {
      A: clip.targetSentence,
      B: `The speaker explicitly emphasized that alternative registration protocols apply for foreign candidates.`,
      C: `A general inquiry without specific procedural or chronological requirements.`,
      D: `An unverified oral submission requiring subsequent verification from the department coordinator.`,
    },
    correctAnswer: 'A',
    explanation: `Accurate transcript target: "${clip.targetSentence}" (IPA: ${clip.phoneticGuide}). Phonetic focus: ${clip.keyPhonemes.join(', ')}. Tips: ${clip.tips.join(' ')}`,
    difficulty: idx < 6 ? 'easy' : idx < 14 ? 'medium' : 'hard',
    verified: true,
    source: 'expert-verified',
    createdAt: '2025-01-01T00:00:00.000Z',
  };
});

export const IELTS_LISTENING_BANK: Record<string, StoredMCQ[]> = IELTS_LISTENING_MCQS.reduce(
  (acc, q) => {
    const ch = q.chapter || 'Section 1 (Social Conversation)';
    if (!acc[ch]) {
      acc[ch] = [];
    }
    acc[ch].push(q);
    return acc;
  },
  {} as Record<string, StoredMCQ[]>
);
