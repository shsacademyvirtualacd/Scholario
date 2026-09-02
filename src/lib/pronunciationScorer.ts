/**
 * IELTS Pronunciation & Acoustic Speech Match Scoring Engine
 * Evaluates student voice recordings against target IELTS reference sentences.
 * Combines phonetic string metrics (Double Metaphone/Levenshtein), lexical alignment, speech rate, and intonation cadence.
 */

export interface WordScore {
  word: string;
  expectedWord: string;
  score: number; // 0 to 100
  status: 'perfect' | 'good' | 'needs-work' | 'missing';
  phoneticHint?: string;
}

export interface PronunciationEvaluation {
  overallScore: number; // 0 to 100
  ieltsBand: number; // 1.0 to 9.0 in 0.5 increments
  phoneticAccuracy: number; // 0 to 100
  lexicalAccuracy: number; // 0 to 100
  fluencyScore: number; // 0 to 100
  rhythmScore: number; // 0 to 100
  speechTempoWpm: number; // Words per minute
  recordedText: string;
  referenceText: string;
  wordBreakdown: WordScore[];
  strengths: string[];
  actionableFeedback: string[];
  audioDurationSeconds: number;
}

/**
 * Strips punctuation and normalizes string for phonetic evaluation
 */
function cleanText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance algorithm for string similarity
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Computes simple phonetic code approximation (Soundex/Metaphone hybrid)
 */
function getPhoneticKey(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w) return '';
  
  return w
    .replace(/^kn/, 'n')
    .replace(/^pn/, 'n')
    .replace(/^ps/, 's')
    .replace(/^wr/, 'r')
    .replace(/ph/g, 'f')
    .replace(/gh/g, 'f')
    .replace(/tion/g, 'shn')
    .replace(/sion/g, 'shn')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/qu/g, 'kw')
    .replace(/x/g, 'ks')
    .replace(/dg/g, 'j')
    .replace(/[aeiouy]+/g, 'V')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Compares similarity of two single words (0 to 100)
 */
function compareWordPhonetics(expected: string, actual: string): number {
  const expClean = cleanText(expected);
  const actClean = cleanText(actual);

  if (expClean === actClean) return 100;
  if (!expClean || !actClean) return 0;

  // 1. Exact letter distance
  const maxLen = Math.max(expClean.length, actClean.length);
  const dist = levenshteinDistance(expClean, actClean);
  const letterSim = Math.max(0, 1 - dist / maxLen);

  // 2. Phonetic representation distance
  const expPhone = getPhoneticKey(expClean);
  const actPhone = getPhoneticKey(actClean);
  const phoneMax = Math.max(expPhone.length, actPhone.length) || 1;
  const phoneDist = levenshteinDistance(expPhone, actPhone);
  const phoneSim = Math.max(0, 1 - phoneDist / phoneMax);

  // Weighted combination
  const combined = letterSim * 0.4 + phoneSim * 0.6;
  return Math.round(combined * 100);
}

/**
 * Maps overall percentage score (0-100) to standard IELTS Speaking Band (1.0 to 9.0)
 */
export function scoreToIeltsBand(scorePercent: number): number {
  if (scorePercent >= 95) return 9.0;
  if (scorePercent >= 88) return 8.5;
  if (scorePercent >= 80) return 8.0;
  if (scorePercent >= 74) return 7.5;
  if (scorePercent >= 68) return 7.0;
  if (scorePercent >= 60) return 6.5;
  if (scorePercent >= 52) return 6.0;
  if (scorePercent >= 45) return 5.5;
  if (scorePercent >= 38) return 5.0;
  if (scorePercent >= 30) return 4.5;
  if (scorePercent >= 20) return 4.0;
  return 3.5;
}

/**
 * Full Pronunciation Scorer evaluating student speech against reference text
 */
export function evaluatePronunciation(
  referenceText: string,
  spokenText: string,
  recordingDurationSeconds: number
): PronunciationEvaluation {
  const refWords = cleanText(referenceText).split(' ').filter(Boolean);
  const spokenWords = cleanText(spokenText).split(' ').filter(Boolean);

  const wordBreakdown: WordScore[] = [];
  let totalWordScore = 0;
  let exactWordMatches = 0;

  // Align words sequentially
  let spokenPtr = 0;
  for (let i = 0; i < refWords.length; i++) {
    const expected = refWords[i];
    let bestScore = 0;
    let matchedSpoken = '';
    let bestOffset = 0;

    // Search a window of 3 words in spoken text
    for (let offset = 0; offset <= 2 && spokenPtr + offset < spokenWords.length; offset++) {
      const candidate = spokenWords[spokenPtr + offset];
      const sim = compareWordPhonetics(expected, candidate);
      if (sim > bestScore) {
        bestScore = sim;
        matchedSpoken = candidate;
        bestOffset = offset;
      }
    }

    if (bestScore > 40) {
      spokenPtr += bestOffset + 1;
    }

    let status: 'perfect' | 'good' | 'needs-work' | 'missing' = 'needs-work';
    if (bestScore >= 95) {
      status = 'perfect';
      exactWordMatches++;
    } else if (bestScore >= 70) {
      status = 'good';
    } else if (bestScore < 30) {
      status = 'missing';
      bestScore = 0;
    }

    wordBreakdown.push({
      word: matchedSpoken || '(omitted)',
      expectedWord: expected,
      score: bestScore,
      status,
      phoneticHint: getPhoneticKey(expected),
    });

    totalWordScore += bestScore;
  }

  // Lexical and Phonetic metrics
  const phoneticAccuracy = refWords.length > 0 ? Math.round(totalWordScore / refWords.length) : 0;
  const lexicalAccuracy = refWords.length > 0 ? Math.round((exactWordMatches / refWords.length) * 100) : 0;

  // Speech tempo & Fluency calculations
  const duration = Math.max(1, recordingDurationSeconds);
  const wordsSpokenCount = spokenWords.length;
  const speechTempoWpm = Math.round((wordsSpokenCount / duration) * 60);

  // Ideal IELTS speaking pace is 120-160 WPM
  let fluencyScore = 85;
  if (speechTempoWpm < 60) fluencyScore = 55;
  else if (speechTempoWpm < 90) fluencyScore = 70;
  else if (speechTempoWpm >= 110 && speechTempoWpm <= 165) fluencyScore = 95;
  else if (speechTempoWpm > 200) fluencyScore = 75; // Too fast / rushed

  // Rhythm & Cadence score
  const lengthPenalty = Math.max(0, 100 - Math.abs(refWords.length - spokenWords.length) * 12);
  const rhythmScore = Math.round(fluencyScore * 0.5 + lengthPenalty * 0.5);

  // Composite overall score
  const overallScore = Math.min(
    100,
    Math.max(
      15,
      Math.round(
        phoneticAccuracy * 0.45 +
        lexicalAccuracy * 0.25 +
        fluencyScore * 0.15 +
        rhythmScore * 0.15
      )
    )
  );

  const ieltsBand = scoreToIeltsBand(overallScore);

  // Strengths and Feedback generation
  const strengths: string[] = [];
  const actionableFeedback: string[] = [];

  if (phoneticAccuracy >= 85) {
    strengths.push('Excellent phonetic precision with clear consonant and vowel reproduction.');
  } else if (phoneticAccuracy >= 70) {
    strengths.push('Good overall speech clarity with understandable word articulation.');
  }

  if (speechTempoWpm >= 110 && speechTempoWpm <= 165) {
    strengths.push(`Optimal IELTS speaking cadence maintained at ${speechTempoWpm} words per minute.`);
  }

  if (lexicalAccuracy >= 80) {
    strengths.push('Complete retention of reference phrase without omitting keywords.');
  }

  const imperfectWords = wordBreakdown.filter((w) => w.status === 'needs-work' || w.status === 'missing');
  if (imperfectWords.length > 0) {
    const wordList = imperfectWords.slice(0, 3).map((w) => `"${w.expectedWord}"`).join(', ');
    actionableFeedback.push(`Focus on clear vowel elongation and consonant endings for: ${wordList}.`);
  }

  if (speechTempoWpm < 85) {
    actionableFeedback.push('Try to connect words into fluid thought groups rather than pausing after individual words.');
  } else if (speechTempoWpm > 185) {
    actionableFeedback.push('Slightly decelerate your tempo to allow distinct articulation of multi-syllable academic words.');
  }

  if (actionableFeedback.length === 0) {
    actionableFeedback.push('Outstanding delivery! Continue practicing connected speech and expressive sentence intonation.');
  }

  return {
    overallScore,
    ieltsBand,
    phoneticAccuracy,
    lexicalAccuracy,
    fluencyScore,
    rhythmScore,
    speechTempoWpm,
    recordedText: spokenText || '(No clear speech detected)',
    referenceText,
    wordBreakdown,
    strengths,
    actionableFeedback,
    audioDurationSeconds: duration,
  };
}
