const fs = require('fs');
const path = require('path');

const part1 = require('./data/englishPart1.cjs');
const part2 = require('./data/englishPart2.cjs');
const part3 = require('./data/englishPart3.cjs');

const morePart1 = require('./data/englishTenMorePart1.cjs');
const morePart2 = require('./data/englishTenMorePart2.cjs');
const morePart3 = require('./data/englishTenMorePart3.cjs');

const base40English = {
  ...part1,
  ...part2,
  ...part3,
};

const extra10English = {
  ...morePart1,
  ...morePart2,
  ...morePart3,
};

const { safeWriteQuestionBank } = require('./utils/safeJsonWriter.cjs');

const JSON_PATH = path.resolve(__dirname, '../src/data/grade9FbiseBank.json');
const raw = fs.readFileSync(JSON_PATH, 'utf-8');
const bank = JSON.parse(raw);

const now = new Date().toISOString();

const englishChaptersMeta = [
  { num: 1, name: 'Parts of Speech', subtopic: 'Nouns, Pronouns, Verbs, Adjectives, Adverbs, Prepositions' },
  { num: 2, name: 'Tenses (all forms)', subtopic: 'Present, Past, Future tenses and time markers' },
  { num: 3, name: 'Active & Passive Voice', subtopic: 'Active and Passive transformations across all tenses and moods' },
  { num: 4, name: 'Direct & Indirect Narration', subtopic: 'Direct to Indirect speech, reporting verbs and backshifting' },
  { num: 5, name: 'Sentence Correction', subtopic: 'Grammar mechanics, agreement, parallelism, and modifiers' },
  { num: 6, name: 'Types of Sentences', subtopic: 'Simple, Compound, Complex, Declarative, Interrogative, Conditionals' },
  { num: 7, name: 'Subject-Verb Agreement', subtopic: 'Rules of proximity, collective nouns, compound subjects' },
  { num: 8, name: 'Prepositions', subtopic: 'Prepositions of time, place, direction, and dependent prepositions' },
  { num: 9, name: 'Conjunctions', subtopic: 'Coordinating, Subordinating, and Correlative conjunctions' },
  { num: 10, name: 'Articles', subtopic: 'Indefinite, Definite, and Zero articles usage' },
  { num: 11, name: 'Punctuation', subtopic: 'Commas, semicolons, colons, apostrophes, capitalization' },
  { num: 12, name: 'Modals/Auxiliary Verbs', subtopic: 'Ability, permission, obligation, deduction, semi-modals' },
  { num: 13, name: 'Clauses', subtopic: 'Independent, Noun, Adjective, and Adverbial clauses' },
  { num: 14, name: 'Degrees of Comparison', subtopic: 'Positive, comparative, and superlative transformations' },
  { num: 15, name: 'Vocabulary & Comprehension', subtopic: 'Synonyms, antonyms, one-word substitutions, context clues' },
  { num: 16, name: 'Idioms & Phrases', subtopic: 'Meanings, idioms, proverbs, and phrasal verbs' },
  { num: 17, name: 'Word Formation (Prefixes/Suffixes)', subtopic: 'Prefixes, suffixes, derivations, and compound words' },
];

if (!bank.English) {
  bank.English = {};
}

let totalGenerated = 0;
for (const meta of englishChaptersMeta) {
  const chapName = meta.name;
  const baseQuestions = base40English[chapName] || [];
  const extraQuestions = extra10English[chapName] || [];

  if (baseQuestions.length !== 40) {
    console.error(`ERROR: Chapter "${chapName}" has ${baseQuestions.length} base questions (expected 40)!`);
    process.exit(1);
  }
  if (extraQuestions.length !== 10) {
    console.error(`ERROR: Chapter "${chapName}" has ${extraQuestions.length} extra questions (expected 10)!`);
    process.exit(1);
  }

  const combined50 = [...baseQuestions, ...extraQuestions];
  const difficulties = ['easy', 'medium', 'medium', 'hard'];

  bank.English[chapName] = combined50.map((qItem, idx) => {
    return {
      id: `fbise9_eng_ch${meta.num}_q${idx + 1}`,
      board: 'fbise',
      grade: '9',
      subject: 'English',
      chapter: chapName,
      chapterNumber: meta.num,
      topic: meta.subtopic,
      question: qItem.q,
      options: {
        A: qItem.A,
        B: qItem.B,
        C: qItem.C,
        D: qItem.D,
      },
      correctAnswer: qItem.ans,
      explanation: qItem.exp,
      difficulty: difficulties[idx % difficulties.length],
      verified: true,
      source: 'curriculum-bank',
      createdAt: now,
    };
  });

  totalGenerated += bank.English[chapName].length;
}

safeWriteQuestionBank(JSON_PATH, bank);
console.log(`Successfully generated and written ${totalGenerated} English questions (50 per topic across 17 topics).`);
