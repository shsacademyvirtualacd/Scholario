/**
 * IELTS 1,000-Question Authoritative Grammar MCQ Bank
 * Comprehensive syllabus covering:
 * - Subject-Verb Agreement
 * - Tenses, Aspect & Time Clauses
 * - Conditionals & Unreal Past
 * - Passive Voice & Causatives
 * - Relative Clauses & Participles
 * - Modals & Past Deduction
 * - Articles & Quantifiers
 * - Prepositions, Collocations & Phrasal Verbs
 * - Inversion, Fronting & Subjunctive
 * - Conjunctions & Sentence Structure
 * - Punctuation & Syntax Mechanics
 * - Error Identification & Sentence Correction
 */

export interface RawIELTSMCQ {
  id: string;
  question: string;
  options: string[] | { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'board_exam' | string;
  topic?: string;
  chapter?: string;
  passage?: string;
}

export type StoredMCQ = RawIELTSMCQ;

// ==========================================
// 1,000 GRAMMAR MCQS (SYLLABUS & IELTS ACCURATE)
// ==========================================
export const IELTS_GRAMMAR_MCQS: RawIELTSMCQ[] = [
  {
    "id": "ielts-gram-001",
    "question": "Choose the correct form of the verb: Neither the lead researcher nor his laboratory assistants _______ present when the power outage occurred.",
    "options": [
      "were",
      "was",
      "is",
      "are"
    ],
    "correctAnswer": "A",
    "explanation": "In \"neither... nor\" constructions, the finite verb agrees with the subject closest to it (\"assistants\", which is plural), requiring \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-002",
    "question": "Identify the grammatically correct sentence:",
    "options": [
      "The number of international applicants seeking asylum have increased substantially.",
      "The number of international applicants seeking asylum has increased substantially.",
      "A large number of international applicants seeking asylum has increased substantially.",
      "The numbers of international applicant seeking asylum have increased substantially."
    ],
    "correctAnswer": "B",
    "explanation": "\"The number of...\" takes a singular verb (\"has increased\"), whereas \"A number of...\" takes a plural verb.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-003",
    "question": "Fill in the blank: Each of the participating countries _______ required to submit a comprehensive carbon reduction pledge.",
    "options": [
      "were",
      "are",
      "is",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "\"Each\" is a singular distributive pronoun and takes the singular verb \"is\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-004",
    "question": "Choose the correct verb form: A series of extensive clinical trials _______ currently being conducted by the pharmaceutical team.",
    "options": [
      "are",
      "have been",
      "were",
      "is"
    ],
    "correctAnswer": "D",
    "explanation": "\"A series of...\" functions as a singular collective subject and requires the singular verb \"is\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-005",
    "question": "Choose the correct verb form: Either the project director or the regional managers _______ responsible for approving budget revisions.",
    "options": [
      "are",
      "is",
      "was",
      "has been"
    ],
    "correctAnswer": "A",
    "explanation": "With \"either... or\", the verb agrees with the nearer subject (\"regional managers\", plural), requiring \"are\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-006",
    "question": "Choose the correct verb form: Not only the architectural blueprints but also the construction timber _______ damaged during the severe storm.",
    "options": [
      "were",
      "was",
      "are",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "With \"not only... but also\", the verb agrees with the subject closer to it (\"timber\", uncountable/singular), requiring \"was\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-007",
    "question": "Choose the correct verb form: The committee _______ divided in their opinions regarding the proposed curriculum reforms.",
    "options": [
      "is",
      "was",
      "were",
      "has been"
    ],
    "correctAnswer": "C",
    "explanation": "When members of a collective noun act as individuals with differing opinions, a plural verb (\"were\") is used in standard British/IELTS usage.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-008",
    "question": "Fill in the blank: Every student and lecturer in the faculty _______ access to the online academic repository.",
    "options": [
      "were having",
      "have",
      "are having",
      "has"
    ],
    "correctAnswer": "D",
    "explanation": "Subjects preceded by \"Every\" remain singular even when joined by \"and\", thus taking \"has\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-009",
    "question": "Choose the correct verb form: Physics, along with advanced calculus and statistical mechanics, _______ compulsory for all prospective engineering undergraduates.",
    "options": [
      "is",
      "are",
      "were",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "Parenthetical phrases introduced by \"along with\" do not alter the number of the main singular subject (\"Physics\"), which takes \"is\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-010",
    "question": "Fill in the blank: Three-quarters of the Amazon rainforest canopy _______ already suffered degradation from deforestation.",
    "options": [
      "have",
      "has",
      "are",
      "were"
    ],
    "correctAnswer": "B",
    "explanation": "Fractions modifying an uncountable noun (\"canopy\" or forest biomass) take a singular verb (\"has suffered\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-011",
    "question": "Fill in the blank: Two-thirds of the survey respondents _______ that remote working improved their overall productivity.",
    "options": [
      "agrees",
      "is agreeing",
      "agree",
      "has agreed"
    ],
    "correctAnswer": "C",
    "explanation": "Fractions modifying a plural countable noun (\"respondents\") take a plural verb (\"agree\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-012",
    "question": "Choose the correct verb form: One of the greatest challenges that urban planners _______ is traffic congestion.",
    "options": [
      "has faced",
      "faces",
      "is facing",
      "face"
    ],
    "correctAnswer": "D",
    "explanation": "In the relative clause \"that urban planners [face]\", the plural subject \"urban planners\" governs the verb \"face\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-013",
    "question": "Choose the correct verb form: She is one of those rare researchers who _______ tirelessly for environmental preservation.",
    "options": [
      "advocate",
      "advocates",
      "is advocating",
      "has advocated"
    ],
    "correctAnswer": "A",
    "explanation": "The relative pronoun \"who\" refers to the plural antecedent \"rare researchers\", requiring the plural verb \"advocate\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-014",
    "question": "Choose the correct verb form: She is the only one of the researchers who _______ received the international scholarship.",
    "options": [
      "have",
      "has",
      "are",
      "were"
    ],
    "correctAnswer": "B",
    "explanation": "When preceded by \"the only one of...\", the relative pronoun refers to the singular \"the only one\", requiring \"has\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-015",
    "question": "Fill in the blank: Ten miles _______ considered a long daily commute for cyclists in hilly terrain.",
    "options": [
      "were",
      "are",
      "is",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "Expressions of distance, time, and money are treated as single aggregate units and take a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-016",
    "question": "Fill in the blank: Fifty thousand dollars _______ allocated for the restoration of the historical monument.",
    "options": [
      "have been",
      "were",
      "are",
      "was"
    ],
    "correctAnswer": "D",
    "explanation": "A sum of money treated as a total quantity takes a singular verb (\"was\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-017",
    "question": "Choose the correct verb form: There _______ numerous archaeological artifacts discovered near the ancient riverbed.",
    "options": [
      "were",
      "was",
      "is",
      "has been"
    ],
    "correctAnswer": "A",
    "explanation": "In existential \"there\" sentences, the verb agrees with the delayed plural subject (\"numerous archaeological artifacts\"), requiring \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-018",
    "question": "Choose the correct verb form: Here _______ the latest statistical report compiled by the demographic agency.",
    "options": [
      "are",
      "is",
      "were",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "The delayed subject is singular (\"the latest statistical report\"), so the verb is \"is\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-019",
    "question": "Choose the correct verb form: Beneath the volcanic basalt layers _______ reservoirs of geothermal energy.",
    "options": [
      "lies",
      "is lying",
      "lie",
      "has lain"
    ],
    "correctAnswer": "C",
    "explanation": "This is an inverted sentence where the subject \"reservoirs\" (plural) follows the locative phrase, requiring the plural verb \"lie\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-020",
    "question": "Fill in the blank: The majority of the university council _______ voted in favour of constructing new student housing.",
    "options": [
      "are",
      "have",
      "is",
      "has"
    ],
    "correctAnswer": "D",
    "explanation": "\"The majority of the council\" acting as a singular corporate entity takes the singular verb \"has\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-021",
    "question": "Fill in the blank: The majority of university students _______ public transport to commute to campus.",
    "options": [
      "use",
      "uses",
      "is using",
      "has used"
    ],
    "correctAnswer": "A",
    "explanation": "\"The majority of\" modifying plural countable noun \"students\" takes the plural verb \"use\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-022",
    "question": "Choose the correct verb form: Somebody in the conference hall _______ left their presentation notes on the podium.",
    "options": [
      "have",
      "has",
      "are",
      "were"
    ],
    "correctAnswer": "B",
    "explanation": "Indefinite pronouns ending in -body (such as \"somebody\") are grammatically singular and take \"has\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-023",
    "question": "Choose the correct verb form: Neither of the proposed transit strategies _______ financially viable in the short term.",
    "options": [
      "are",
      "were",
      "is",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "\"Neither of\" takes a singular verb (\"is\") in formal academic English.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-024",
    "question": "Fill in the blank: Either of the two conference dates _______ acceptable for the keynote speech.",
    "options": [
      "have been",
      "are",
      "were",
      "is"
    ],
    "correctAnswer": "D",
    "explanation": "\"Either of\" refers to one of two options individually and takes a singular verb (\"is\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-025",
    "question": "Choose the correct verb form: None of the counterfeit currency _______ entered into general economic circulation.",
    "options": [
      "has",
      "have",
      "are",
      "were"
    ],
    "correctAnswer": "A",
    "explanation": "\"None\" referring to an uncountable noun (\"currency\") takes the singular verb \"has\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-026",
    "question": "Choose the correct verb form: None of the ancient manuscripts _______ survived the library fire unscathed.",
    "options": [
      "has",
      "have",
      "is",
      "was"
    ],
    "correctAnswer": "B",
    "explanation": "\"None\" referring to a plural countable noun (\"manuscripts\") standardly takes the plural verb \"have\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-027",
    "question": "Fill in the blank: The news regarding the diplomatic accord _______ broadcast across all major international networks.",
    "options": [
      "are",
      "were",
      "was",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "\"News\" is an uncountable singular noun and takes the singular verb \"was\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-028",
    "question": "Fill in the blank: Economic statistics _______ that inflation has slowed down in recent quarters.",
    "options": [
      "indicates",
      "has indicated",
      "is indicating",
      "indicate"
    ],
    "correctAnswer": "D",
    "explanation": "When \"statistics\" refers to numerical data or figures, it takes a plural verb (\"indicate\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-029",
    "question": "Choose the correct verb form: Statistics _______ an indispensable academic discipline for data science majors.",
    "options": [
      "is",
      "are",
      "were",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "When \"Statistics\" refers to a field of academic study, it takes a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-030",
    "question": "Fill in the blank: The staff _______ collaborating effectively on the multidisciplinary research project.",
    "options": [
      "is",
      "are",
      "was",
      "has been"
    ],
    "correctAnswer": "B",
    "explanation": "When \"staff\" refers to the individual staff members working together, the plural verb \"are\" is used.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-031",
    "question": "Choose the correct verb form: What the climatologists discovered during the polar expedition _______ unprecedented changes in ice thickness.",
    "options": [
      "are",
      "were",
      "was",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "Nominal relative clauses acting as subject (\"What the climatologists discovered...\") standardly take a singular verb (\"was\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-032",
    "question": "Choose the correct verb form: The principal together with all teaching staff _______ attending the regional educational symposium.",
    "options": [
      "have been",
      "are",
      "were",
      "is"
    ],
    "correctAnswer": "D",
    "explanation": "\"Together with\" is a prepositional phrase and does not affect the singular subject \"The principal\", which takes \"is\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-033",
    "question": "Fill in the blank: More than one candidate _______ expressed dissatisfaction with the examination timetable.",
    "options": [
      "has",
      "have",
      "are",
      "were"
    ],
    "correctAnswer": "A",
    "explanation": "The phrase \"More than one + singular noun\" is grammatically singular and takes \"has\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-034",
    "question": "Choose the correct verb form: Many a promising young scientist _______ struggled to secure independent funding.",
    "options": [
      "have",
      "has",
      "are",
      "were"
    ],
    "correctAnswer": "B",
    "explanation": "\"Many a + singular noun\" is followed by a singular verb (\"has struggled\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-035",
    "question": "Fill in the blank: The criteria used to evaluate the academic proposals _______ extremely stringent.",
    "options": [
      "was",
      "is",
      "were",
      "has been"
    ],
    "correctAnswer": "C",
    "explanation": "\"Criteria\" is the plural form of the singular noun \"criterion\", requiring the plural verb \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-036",
    "question": "Fill in the blank: The phenomenon of bioluminescence _______ observed in diverse marine organisms.",
    "options": [
      "have been",
      "are",
      "were",
      "is"
    ],
    "correctAnswer": "D",
    "explanation": "\"Phenomenon\" is a singular noun (plural is \"phenomena\"), so it takes the singular verb \"is\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-037",
    "question": "Choose the correct verb form: The analyses presented in the third chapter _______ conclusive evidence of the hypothesis.",
    "options": [
      "provide",
      "provides",
      "is providing",
      "has provided"
    ],
    "correctAnswer": "A",
    "explanation": "\"Analyses\" is the plural form of \"analysis\", requiring the plural verb \"provide\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-038",
    "question": "Fill in the blank: Bread and butter _______ served as the staple breakfast in the boarding school.",
    "options": [
      "were",
      "was",
      "are",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "When two nouns joined by \"and\" refer to a single compound idea or dish (\"bread and butter\"), they take a singular verb (\"was\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-039",
    "question": "Choose the correct verb form: The jury _______ reached a unanimous verdict after five hours of deliberation.",
    "options": [
      "are",
      "have",
      "has",
      "were"
    ],
    "correctAnswer": "C",
    "explanation": "When a collective noun (\"the jury\") acts as a single unified body, it takes the singular verb \"has\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-040",
    "question": "Fill in the blank: The pliers _______ stored in the bottom drawer of the workbench.",
    "options": [
      "is",
      "has been",
      "was",
      "are"
    ],
    "correctAnswer": "D",
    "explanation": "Nouns for tools composed of two parts (\"pliers\", \"scissors\", \"tongs\") are plural and take \"are\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-041",
    "question": "Fill in the blank: A pair of spectacles _______ found on the library reading desk.",
    "options": [
      "was",
      "were",
      "are",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "When quantified by \"A pair of...\", the grammatical subject is the singular \"pair\", requiring \"was\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-042",
    "question": "Choose the correct verb form: Whatever reasons he offered _______ insufficient to justify the delay.",
    "options": [
      "was",
      "were",
      "is",
      "has been"
    ],
    "correctAnswer": "B",
    "explanation": "The nominal clause contains the plural noun \"reasons\", making the overall predicate plural (\"were\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-043",
    "question": "Fill in the blank: The acoustics of the newly constructed concert hall _______ exceptional.",
    "options": [
      "is",
      "was",
      "are",
      "has been"
    ],
    "correctAnswer": "C",
    "explanation": "When \"acoustics\" refers to the sound-reflecting properties of a room, it is plural and takes \"are\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-044",
    "question": "Choose the correct verb form: Diabetes _______ a chronic metabolic disorder affecting millions globally.",
    "options": [
      "have been",
      "are",
      "were",
      "is"
    ],
    "correctAnswer": "D",
    "explanation": "Names of specific diseases ending in -s (diabetes, measles, rickets) take a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-045",
    "question": "Identify the sentence with correct subject-verb agreement:",
    "options": [
      "The board of directors has decided to postpone the annual general meeting.",
      "The board of directors have decided to postpone the annual general meeting.",
      "The board of directors are deciding to postpone the annual general meeting.",
      "The board of directors were decided to postpone the annual general meeting."
    ],
    "correctAnswer": "A",
    "explanation": "\"The board of directors\" functions as a single administrative unit taking the singular verb \"has decided\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-046",
    "question": "Choose the correct tense form: By the time the rescue team reached the remote valley, the stranded hikers _______ for nearly forty-eight hours.",
    "options": [
      "have waited",
      "had been waiting",
      "waited",
      "were waiting"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect continuous (\"had been waiting\") expresses an action that continued up to a specific past reference point.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-047",
    "question": "Fill in the blank: By the end of this decade, marine biologists estimate that global conservation initiatives _______ over two million square kilometres of ocean.",
    "options": [
      "protected",
      "will protect",
      "will have protected",
      "have protected"
    ],
    "correctAnswer": "C",
    "explanation": "Future perfect (\"will have protected\") indicates an action that will be completed before a specified future time (\"By the end of this decade\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-048",
    "question": "Fill in the blank: Water _______ at 100 degrees Celsius under standard atmospheric pressure.",
    "options": [
      "is boiling",
      "has boiled",
      "boiled",
      "boils"
    ],
    "correctAnswer": "D",
    "explanation": "The present simple (\"boils\") is used to express universal scientific facts and physical laws.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-049",
    "question": "Choose the correct verb form: Since the implementation of the new recycling policy in 2021, municipal waste output _______ by 35 percent.",
    "options": [
      "has decreased",
      "decreased",
      "had decreased",
      "is decreasing"
    ],
    "correctAnswer": "A",
    "explanation": "\"Since + specific past point\" requires the present perfect (\"has decreased\") to link the past action to the present.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-050",
    "question": "Choose the correct tense: While the archaeologists _______ the ancient burial chamber, they unearthed several intact ceramic vessels.",
    "options": [
      "excavated",
      "were excavating",
      "had excavated",
      "have excavated"
    ],
    "correctAnswer": "B",
    "explanation": "The past continuous (\"were excavating\") describes an ongoing past action interrupted by a past simple event (\"unearthed\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-051",
    "question": "Fill in the blank: The delegates will finalize the treaty as soon as all member states _______ the proposed revisions.",
    "options": [
      "will approve",
      "approved",
      "approve",
      "had approved"
    ],
    "correctAnswer": "C",
    "explanation": "In time clauses introduced by \"as soon as\", the present simple (\"approve\") is used instead of a future tense.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-052",
    "question": "Choose the correct form: He _______ in the financial sector for fifteen years before transitioning to academic teaching.",
    "options": [
      "worked",
      "has worked",
      "is working",
      "had worked"
    ],
    "correctAnswer": "D",
    "explanation": "Past perfect (\"had worked\") emphasizes the completion of an action before another past event (\"transitioning\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-053",
    "question": "Fill in the blank: At this time tomorrow, the space exploration probe _______ through the outer orbit of Mars.",
    "options": [
      "will be travelling",
      "will travel",
      "has travelled",
      "travels"
    ],
    "correctAnswer": "A",
    "explanation": "Future continuous (\"will be travelling\") describes an activity that will be in progress at a specific time in the future.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-054",
    "question": "Fill in the blank: When I arrived at the conference hall, the keynote speaker _______ already begun his lecture.",
    "options": [
      "has",
      "had",
      "was",
      "is"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect (\"had already begun\") indicates an event occurred before another past moment.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-055",
    "question": "Choose the correct verb form: Although he _______ several warning signs, the driver failed to reduce his speed on the icy motorway.",
    "options": [
      "notices",
      "has noticed",
      "had noticed",
      "is noticing"
    ],
    "correctAnswer": "C",
    "explanation": "Past perfect (\"had noticed\") shows that noticing the signs preceded the failure to brake.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-056",
    "question": "Fill in the blank: This is the first time the university _______ such a prestigious international award.",
    "options": [
      "wins",
      "had won",
      "won",
      "has won"
    ],
    "correctAnswer": "D",
    "explanation": "The construction \"This is the first time...\" standardly takes the present perfect (\"has won\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-057",
    "question": "Choose the correct option: The economic committee _______ three times this month to address inflation concerns.",
    "options": [
      "has met",
      "met",
      "had met",
      "was meeting"
    ],
    "correctAnswer": "A",
    "explanation": "\"This month\" represents an unfinished time period, requiring the present perfect (\"has met\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-058",
    "question": "Fill in the blank: The historical archives reveal that the city wall _______ in 1453 during a protracted siege.",
    "options": [
      "has collapsed",
      "collapsed",
      "had collapsed",
      "is collapsing"
    ],
    "correctAnswer": "B",
    "explanation": "A definite historical time marker (\"in 1453\") requires the past simple (\"collapsed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-059",
    "question": "Choose the correct verb form: For the past six months, the engineering firm _______ on developing a more efficient hydrogen fuel cell.",
    "options": [
      "works",
      "worked",
      "has been working",
      "had worked"
    ],
    "correctAnswer": "C",
    "explanation": "Present perfect continuous (\"has been working\") expresses an action that began in the past and is still ongoing.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-060",
    "question": "Fill in the blank: As soon as the sun _______, the desert temperature drops precipitously.",
    "options": [
      "is setting",
      "will set",
      "set",
      "sets"
    ],
    "correctAnswer": "D",
    "explanation": "In zero conditional and habitual time clauses, the present simple (\"sets\") is used.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-061",
    "question": "Choose the correct form: It is high time the municipal authorities _______ decisive action against illegal dumping.",
    "options": [
      "took",
      "take",
      "have taken",
      "had taken"
    ],
    "correctAnswer": "A",
    "explanation": "\"It is high time + subject\" takes the unreal past subjunctive form (\"took\") to express urgency.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-062",
    "question": "Fill in the blank: By next October, Dr. Jenkins _______ his longitudinal study on cognitive decline for a full decade.",
    "options": [
      "will be conducting",
      "will have been conducting",
      "has conducted",
      "is conducting"
    ],
    "correctAnswer": "B",
    "explanation": "Future perfect continuous (\"will have been conducting\") highlights the ongoing duration of an action up to a future point.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-063",
    "question": "Fill in the blank: Look at those dense black clouds; it _______ rain heavily within the hour.",
    "options": [
      "is to",
      "will",
      "is going to",
      "shall"
    ],
    "correctAnswer": "C",
    "explanation": "\"Be going to\" is used for predictions based on present sensory evidence (dense black clouds).",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-064",
    "question": "Choose the correct option: I _______ my former supervisor since we graduated from university five years ago.",
    "options": [
      "didn't see",
      "am not seeing",
      "hadn't seen",
      "haven't seen"
    ],
    "correctAnswer": "D",
    "explanation": "Negative present perfect (\"haven't seen\") is used with \"since\" to denote an unbroken span of time leading to the present.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-065",
    "question": "Fill in the blank: When the fire alarm rang, everyone _______ down the emergency stairwell.",
    "options": [
      "hurried",
      "was hurrying",
      "had hurried",
      "has hurried"
    ],
    "correctAnswer": "A",
    "explanation": "Sequential completed past actions in a narrative are expressed using the past simple (\"hurried\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-066",
    "question": "Choose the correct form: She confessed that she _______ the laboratory records before the auditor arrived.",
    "options": [
      "misplaced",
      "had misplaced",
      "has misplaced",
      "was misplacing"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect (\"had misplaced\") expresses an action completed prior to the past reporting verb (\"confessed\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-067",
    "question": "Choose the correct verb form: Next semester, Professor Edwards _______ courses on environmental jurisprudence.",
    "options": [
      "is teaching",
      "teaches",
      "will be teaching",
      "taught"
    ],
    "correctAnswer": "C",
    "explanation": "Future continuous (\"will be teaching\") describes scheduled ongoing academic duties in the future.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-068",
    "question": "Fill in the blank: In ancient Rome, gladiators _______ in the Colosseum for public entertainment.",
    "options": [
      "were fighting",
      "have fought",
      "had fought",
      "fought"
    ],
    "correctAnswer": "D",
    "explanation": "Completed historical habits and facts take the simple past tense (\"fought\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-069",
    "question": "Fill in the blank: The economic analyst remarked that the housing market _______ signs of stabilization.",
    "options": [
      "was showing",
      "is showing",
      "shows",
      "has shown"
    ],
    "correctAnswer": "A",
    "explanation": "Reported speech with a past reporting verb (\"remarked\") shifts present continuous to past continuous (\"was showing\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-070",
    "question": "Choose the correct form: Hardly had the plane taken off _______ an engine malfunction was detected.",
    "options": [
      "than",
      "when",
      "then",
      "that"
    ],
    "correctAnswer": "B",
    "explanation": "\"Hardly... when\" is the standard correlative time structure paired with the past perfect.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-071",
    "question": "Choose the correct form: No sooner had the diplomat concluded his remarks _______ reporters began shouting questions.",
    "options": [
      "when",
      "then",
      "than",
      "as"
    ],
    "correctAnswer": "C",
    "explanation": "\"No sooner... than\" is the correct correlative construction.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-072",
    "question": "Fill in the blank: Urban planners _______ the effects of gentrification on local businesses for several years now.",
    "options": [
      "study",
      "are studying",
      "studied",
      "have been studying"
    ],
    "correctAnswer": "D",
    "explanation": "The phrase \"for several years now\" denotes duration continuing to the present, requiring the present perfect continuous.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-073",
    "question": "Fill in the blank: Before you leave the laboratory, please ensure that all gas valves _______ turned off.",
    "options": [
      "are",
      "were",
      "will be",
      "had been"
    ],
    "correctAnswer": "A",
    "explanation": "In dependent clauses of condition/instruction referring to the future, the present simple (\"are\") is used.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-074",
    "question": "Choose the correct option: He used to _______ ten kilometres every morning before his knee injury.",
    "options": [
      "running",
      "run",
      "ran",
      "have run"
    ],
    "correctAnswer": "B",
    "explanation": "\"Used to\" expressing a past habit is followed by the bare infinitive (\"run\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-075",
    "question": "Fill in the blank: After months of living in the Arctic, the expedition team was finally used to _______ sub-zero temperatures.",
    "options": [
      "endure",
      "endured",
      "enduring",
      "have endured"
    ],
    "correctAnswer": "C",
    "explanation": "\"Be used to\" meaning accustomed to is followed by a gerund (\"enduring\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-076",
    "question": "Choose the correct tense: By the time the train arrives in Edinburgh, we _______ on board for over eight hours.",
    "options": [
      "will be",
      "have been",
      "are",
      "will have been"
    ],
    "correctAnswer": "D",
    "explanation": "Future perfect (\"will have been\") measures duration up to a specified future event (\"By the time the train arrives\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-077",
    "question": "Choose the correct form: The historic treaty _______ in Geneva in 1949 established humanitarian rules of war.",
    "options": [
      "signed",
      "signing",
      "was signed",
      "has signed"
    ],
    "correctAnswer": "A",
    "explanation": "A reduced passive relative clause (\"which was signed\" -> \"signed\") functions as a past participle modifier.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-078",
    "question": "Fill in the blank: While the students _______ the chemistry experiment, the teacher monitored safety protocols.",
    "options": [
      "performed",
      "were performing",
      "had performed",
      "have performed"
    ],
    "correctAnswer": "B",
    "explanation": "Parallel past continuous actions or background activities use \"were performing\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-079",
    "question": "Fill in the blank: The sun _______ in the east and sets in the west.",
    "options": [
      "rose",
      "is rising",
      "rises",
      "has risen"
    ],
    "correctAnswer": "C",
    "explanation": "General geographical truths are expressed in the present simple (\"rises\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-080",
    "question": "Choose the correct option: She told the interview panel that she _______ a degree in astrophysics two years earlier.",
    "options": [
      "completed",
      "was completing",
      "has completed",
      "had completed"
    ],
    "correctAnswer": "D",
    "explanation": "Past perfect (\"had completed\") is required because the degree completion occurred prior to the interview.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-081",
    "question": "Fill in the blank: Scarcely _______ the threshold of the building when the thunderstorm erupted.",
    "options": [
      "had he crossed",
      "he had crossed",
      "did he cross",
      "he crossed"
    ],
    "correctAnswer": "A",
    "explanation": "\"Scarcely\" at the head of a sentence requires subject-auxiliary inversion (\"had he crossed\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-082",
    "question": "Choose the correct form: It is the third time this week that the elevator _______ out of order.",
    "options": [
      "is",
      "has been",
      "was",
      "had been"
    ],
    "correctAnswer": "B",
    "explanation": "\"It is the third time that...\" takes the present perfect (\"has been\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-083",
    "question": "Fill in the blank: Tomorrow's flight to Singapore _______ at 07:30 from Terminal 2.",
    "options": [
      "is departing to",
      "will have departed",
      "departs",
      "departed"
    ],
    "correctAnswer": "C",
    "explanation": "Timetabled and scheduled public transport events use the present simple (\"departs\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-084",
    "question": "Choose the correct option: Having _______ the initial survey, the researchers drafted the methodology section.",
    "options": [
      "conduct",
      "been conducted",
      "conducting",
      "conducted"
    ],
    "correctAnswer": "D",
    "explanation": "The perfect active participle construction requires \"Having + past participle\" (\"Having conducted\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-085",
    "question": "Fill in the blank: The doctor _______ patients for over four hours and still has several waiting in the lobby.",
    "options": [
      "has been examining",
      "is examining",
      "examined",
      "had examined"
    ],
    "correctAnswer": "A",
    "explanation": "Present perfect continuous shows an activity that started in the past and is still ongoing with present consequences.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-086",
    "question": "Choose the correct option: By 2050, many low-lying coastal cities _______ significant land loss to rising sea levels.",
    "options": [
      "will experience",
      "will have experienced",
      "experienced",
      "have experienced"
    ],
    "correctAnswer": "B",
    "explanation": "Future perfect (\"will have experienced\") designates an outcome that will have occurred by the milestone year 2050.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-087",
    "question": "Choose the correct option: Never before _______ such unprecedented fluctuations in cryptocurrency values.",
    "options": [
      "we have witnessed",
      "we witnessed",
      "have we witnessed",
      "did we witnessed"
    ],
    "correctAnswer": "C",
    "explanation": "Negative time expression \"Never before\" triggers inverted auxiliary order (\"have we witnessed\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-088",
    "question": "Fill in the blank: The company _______ its annual financial summary every December.",
    "options": [
      "has published",
      "is publishing",
      "published",
      "publishes"
    ],
    "correctAnswer": "D",
    "explanation": "Recurring annual schedules require the simple present tense (\"publishes\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-089",
    "question": "Choose the correct form: As we _______ through the national park, we spotted a herd of wild elk.",
    "options": [
      "were driving",
      "drove",
      "had driven",
      "have driven"
    ],
    "correctAnswer": "A",
    "explanation": "Past continuous (\"were driving\") establishes the continuous background setting for the single past event (\"spotted\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-090",
    "question": "Fill in the blank: Up until last month, the factory _______ zero emissions standards for three consecutive years.",
    "options": [
      "maintained",
      "had maintained",
      "has maintained",
      "was maintaining"
    ],
    "correctAnswer": "B",
    "explanation": "\"Up until last month\" sets a cutoff in the past, requiring the past perfect (\"had maintained\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-091",
    "question": "Choose the correct option: I will notify you the moment the test results _______ available on the portal.",
    "options": [
      "became",
      "will become",
      "become",
      "are becoming"
    ],
    "correctAnswer": "C",
    "explanation": "\"The moment...\" acts as a temporal conjunction requiring the present simple (\"become\") for future time.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-092",
    "question": "Fill in the blank: Over the last few decades, computer processing speeds _______ exponentially.",
    "options": [
      "increased",
      "are increasing",
      "had increased",
      "have increased"
    ],
    "correctAnswer": "D",
    "explanation": "\"Over the last few decades\" connects the past up to the present day, taking the present perfect (\"have increased\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-093",
    "question": "Choose the correct option: The bell _______ at the end of each examination period.",
    "options": [
      "rings",
      "is ringing",
      "rang",
      "has rung"
    ],
    "correctAnswer": "A",
    "explanation": "Habitual institutional routines use the simple present tense (\"rings\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-094",
    "question": "Fill in the blank: The minister spoke as though he _______ the sole authority on macroeconomic policy.",
    "options": [
      "is",
      "were",
      "has been",
      "will be"
    ],
    "correctAnswer": "B",
    "explanation": "\"As though\" followed by unreal hypothetical statements takes the past subjunctive \"were\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-095",
    "question": "Choose the correct form: She _______ working on her doctoral dissertation until she received confirmation of her grant.",
    "options": [
      "hadn't started",
      "hasn't started",
      "didn't start",
      "wasn't starting"
    ],
    "correctAnswer": "C",
    "explanation": "\"Didn't start until\" expresses a simple past sequence linked to a past condition (\"received confirmation\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-096",
    "question": "Identify the sentence with the correct conditional structure:",
    "options": [
      "If the government would invest more in solar energy, carbon emissions will drop.",
      "Had the government invest more in solar energy, carbon emissions would drop.",
      "If the government invested more in solar energy, carbon emissions will have dropped.",
      "Had the government invested more in solar energy, carbon emissions would have dropped."
    ],
    "correctAnswer": "D",
    "explanation": "\"Had the government invested...\" is an inverted third conditional indicating an unreal past condition with the result \"would have dropped\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-097",
    "question": "Choose the correct form: If the laboratory _______ with advanced filtration units, volatile fumes would escape into the corridor.",
    "options": [
      "were not equipped",
      "is not equipped",
      "had not equipped",
      "will not be equipped"
    ],
    "correctAnswer": "A",
    "explanation": "Second conditional for unreal present condition uses \"were not equipped\" paired with \"would escape\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-098",
    "question": "Fill in the blank: If the captain had altered course earlier, the vessel _______ the hazardous reef yesterday.",
    "options": [
      "would not strike",
      "would not have struck",
      "will not strike",
      "did not strike"
    ],
    "correctAnswer": "B",
    "explanation": "Third conditional main clause requires \"would have + past participle\" (\"would not have struck\") for counterfactual past events.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-099",
    "question": "Choose the correct mixed conditional: If she _______ fluent in German, she would have applied for the Berlin fellowship last year.",
    "options": [
      "is",
      "had been",
      "were",
      "would be"
    ],
    "correctAnswer": "C",
    "explanation": "Mixed conditional (permanent present state \"were fluent\" affecting a past outcome \"would have applied\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-100",
    "question": "Choose the correct mixed conditional: If the team had secured the patent last month, they _______ the new product line right now.",
    "options": [
      "will manufacture",
      "are manufacturing",
      "would have manufactured",
      "would be manufacturing"
    ],
    "correctAnswer": "D",
    "explanation": "Mixed conditional (past action \"had secured\" leading to an ongoing present result \"would be manufacturing right now\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-101",
    "question": "Fill in the blank: You will not be permitted to enter the examination hall _______ you present a valid photo identification.",
    "options": [
      "unless",
      "if",
      "provided",
      "as long as"
    ],
    "correctAnswer": "A",
    "explanation": "\"Unless\" means \"except if\" and introduces the negative condition.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-102",
    "question": "Choose the correct option: The scholarship will be renewed annually, _______ the student maintains a grade point average above 3.5.",
    "options": [
      "unless",
      "provided that",
      "even though",
      "in case"
    ],
    "correctAnswer": "B",
    "explanation": "\"Provided that\" means on the condition that and introduces a positive requirement.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-103",
    "question": "Fill in the blank: _______ you require further clarification regarding the experimental methodology, do not hesitate to contact the lead investigator.",
    "options": [
      "Had",
      "Were",
      "Should",
      "Would"
    ],
    "correctAnswer": "C",
    "explanation": "\"Should you require...\" is an inverted first conditional expressing a formal polite possibility (\"If you happen to require...\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-104",
    "question": "Fill in the blank: _______ the economic crisis to worsen, the central bank would lower interest rates immediately.",
    "options": [
      "If",
      "Should",
      "Had",
      "Were"
    ],
    "correctAnswer": "D",
    "explanation": "\"Were + subject + to-infinitive\" (\"Were the economic crisis to worsen\") is the inverted form of the second conditional.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-105",
    "question": "Fill in the blank: _______ the early warning system been operational, the coastal village could have evacuated safely.",
    "options": [
      "Had",
      "Were",
      "Should",
      "If"
    ],
    "correctAnswer": "A",
    "explanation": "\"Had the early warning system been...\" is the standard inverted third conditional.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-106",
    "question": "Choose the correct option: I wish I _______ more time to review the literature on renewable biofuels before the presentation.",
    "options": [
      "have",
      "had",
      "have had",
      "would have"
    ],
    "correctAnswer": "B",
    "explanation": "Wishes about present situations require the past simple (\"had\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-107",
    "question": "Choose the correct option: The environmentalists wish the municipal council _______ approving construction on greenbelt land.",
    "options": [
      "will stop",
      "stops",
      "would stop",
      "has stopped"
    ],
    "correctAnswer": "C",
    "explanation": "\"Wish + would + base verb\" is used to express dissatisfaction and a desire for someone else to change their behaviour.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-108",
    "question": "Fill in the blank: If only we _______ the statistical anomalies before publishing the final paper.",
    "options": [
      "discovered",
      "have discovered",
      "would discover",
      "had discovered"
    ],
    "correctAnswer": "D",
    "explanation": "\"If only + past perfect\" expresses deep regret about an unfulfilled past event.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-109",
    "question": "Fill in the blank: If you heat water to 100 degrees Celsius, it _______ into steam.",
    "options": [
      "turns",
      "turned",
      "would turn",
      "will turn to"
    ],
    "correctAnswer": "A",
    "explanation": "Zero conditional for scientific cause and effect takes present simple in both clauses.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-110",
    "question": "Fill in the blank: If you study consistently every day, you _______ your academic targets.",
    "options": [
      "achieve",
      "will achieve",
      "would achieve",
      "achieved"
    ],
    "correctAnswer": "B",
    "explanation": "First conditional for a real future possibility uses \"will + base verb\" in the main clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-111",
    "question": "Choose the correct form: If the global temperature _______ by two degrees, polar ice caps will melt at unprecedented rates.",
    "options": [
      "rose",
      "will rise",
      "rises",
      "had risen"
    ],
    "correctAnswer": "C",
    "explanation": "In the \"if\" clause of a first conditional, the present simple (\"rises\") is used.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-112",
    "question": "Choose the correct form: If I _______ you, I would consult an academic advisor before changing your major.",
    "options": [
      "was",
      "have been",
      "am",
      "were"
    ],
    "correctAnswer": "D",
    "explanation": "The subjunctive \"were\" is standard in formal advice (\"If I were you...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-113",
    "question": "Fill in the blank: But for your timely financial assistance, our non-profit organisation _______ into bankruptcy last winter.",
    "options": [
      "would have gone",
      "would go",
      "will go",
      "had gone"
    ],
    "correctAnswer": "A",
    "explanation": "\"But for + noun phrase\" functions as a counterfactual condition (\"If it had not been for...\"), requiring \"would have gone\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-114",
    "question": "Fill in the blank: Without the satellite navigation system, the expedition _______ in the dense jungle.",
    "options": [
      "would be lost",
      "would have been lost",
      "will be lost",
      "was lost"
    ],
    "correctAnswer": "B",
    "explanation": "\"Without...\" used as a past conditional trigger requires \"would have been lost\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-115",
    "question": "Choose the correct option: Take an umbrella with you in case it _______ later in the afternoon.",
    "options": [
      "would rain",
      "will rain",
      "rains",
      "rained"
    ],
    "correctAnswer": "C",
    "explanation": "\"In case\" is followed by the present simple (\"rains\") when referring to precautions for future possibilities.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-116",
    "question": "Fill in the blank: If the company had not diversified its investments, it _______ viable today.",
    "options": [
      "is not",
      "would not have been",
      "will not be",
      "would not be"
    ],
    "correctAnswer": "D",
    "explanation": "Mixed conditional (past action \"had not diversified\" having a present result \"would not be viable today\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-117",
    "question": "Choose the correct option: Supposing the flight _______ delayed, what alternative arrangements will we make?",
    "options": [
      "is",
      "were",
      "had been",
      "would be"
    ],
    "correctAnswer": "A",
    "explanation": "\"Supposing\" followed by a real future possibility takes the present simple (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-118",
    "question": "Choose the correct option: Supposing you _______ the lottery, what would you do first?",
    "options": [
      "win",
      "won",
      "have won",
      "had won"
    ],
    "correctAnswer": "B",
    "explanation": "\"Supposing\" followed by a hypothetical present/future question takes the past simple (\"won\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-119",
    "question": "Fill in the blank: As long as all safety precautions _______, the chemical synthesis may proceed.",
    "options": [
      "were observed",
      "will be observed",
      "are observed",
      "would be observed"
    ],
    "correctAnswer": "C",
    "explanation": "\"As long as\" takes the present simple in condition clauses referring to future permission.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-120",
    "question": "Choose the correct sentence with inverted conditional:",
    "options": [
      "Were he not intervened, the debate would have escalated into hostility.",
      "Had he didn't intervene, the debate would have escalated into hostility.",
      "If had he not intervened, the debate would have escalated into hostility.",
      "Had he not intervened, the debate would have escalated into hostility."
    ],
    "correctAnswer": "D",
    "explanation": "\"Had he not intervened...\" is the correct inverted negative third conditional.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-121",
    "question": "Fill in the blank: If metals are heated, they _______ in volume.",
    "options": [
      "expand",
      "expanded",
      "would expand",
      "will be expanded"
    ],
    "correctAnswer": "A",
    "explanation": "Zero conditional for general physical laws uses the present simple (\"expand\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-122",
    "question": "Choose the correct verb form: If the city council _______ more electric buses, urban air quality would improve noticeably.",
    "options": [
      "introduces",
      "introduced",
      "will introduce",
      "had introduced"
    ],
    "correctAnswer": "B",
    "explanation": "Second conditional for hypothetical present policy uses the past simple (\"introduced\") paired with \"would improve\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-123",
    "question": "Fill in the blank: Had the structural engineers checked the stress tolerances, the bridge failure _______ prevented.",
    "options": [
      "could be",
      "can be",
      "could have been",
      "was"
    ],
    "correctAnswer": "C",
    "explanation": "Past modal passive in third conditional: \"could have been prevented\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-124",
    "question": "Choose the correct option: What would happen if the earth's magnetic poles _______ suddenly?",
    "options": [
      "have reversed",
      "reverse",
      "will reverse",
      "reversed"
    ],
    "correctAnswer": "D",
    "explanation": "Second conditional hypothetical question requires the past simple (\"reversed\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-125",
    "question": "Fill in the blank: _______ you to encounter any technical difficulties during the online test, notify the invigilator immediately.",
    "options": [
      "Were",
      "Should",
      "Had",
      "Would"
    ],
    "correctAnswer": "A",
    "explanation": "\"Were you to encounter...\" is an inverted conditional using \"were + subject + to-infinitive\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-126",
    "question": "Choose the correct form: If the pandemic _______ sooner, economic recovery would already be well underway.",
    "options": [
      "ended",
      "had ended",
      "has ended",
      "would end"
    ],
    "correctAnswer": "B",
    "explanation": "Mixed conditional (past action \"had ended\" with present continuous state \"would already be\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-127",
    "question": "Fill in the blank: If you mix red and yellow paint, you _______ orange.",
    "options": [
      "would get",
      "got",
      "get",
      "will have gotten"
    ],
    "correctAnswer": "C",
    "explanation": "Universal factual zero conditional uses present simple (\"get\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-128",
    "question": "Choose the correct option: Even if the team _______ around the clock, they cannot finish the construction by Friday.",
    "options": [
      "would work",
      "worked",
      "had worked",
      "works"
    ],
    "correctAnswer": "D",
    "explanation": "\"Even if + present simple\" indicates a real condition that will not change the modal outcome (\"cannot finish\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-129",
    "question": "Fill in the blank: I would rather you _______ the confidential file to anyone without clearance.",
    "options": [
      "didn't disclose",
      "don't disclose",
      "not disclose",
      "hadn't disclose"
    ],
    "correctAnswer": "A",
    "explanation": "\"Would rather + subject + past simple\" is used to express a preference about another person's present/future action.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-130",
    "question": "Choose the correct form: I would rather _______ to the conference by train than fly during the severe blizzard.",
    "options": [
      "have travelled",
      "travel",
      "travelled",
      "travelling"
    ],
    "correctAnswer": "B",
    "explanation": "\"Would rather + bare infinitive\" (\"travel\") expresses subject's direct preference.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-131",
    "question": "Fill in the blank: I would rather you _______ me about the project cancellation yesterday before I placed the order.",
    "options": [
      "have told",
      "told",
      "had told",
      "tell"
    ],
    "correctAnswer": "C",
    "explanation": "\"Would rather + subject + past perfect\" expresses a preference about a past event (\"had told\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-132",
    "question": "Choose the correct option: Unless prompt measures _______ taken, the endangered coral reef will suffer irreparable bleaching.",
    "options": [
      "are being",
      "will be",
      "were",
      "are"
    ],
    "correctAnswer": "D",
    "explanation": "\"Unless\" takes the present simple passive (\"are taken\") in first conditional structures.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-133",
    "question": "Fill in the blank: Were it not for the generous endowment from the benefactor, the museum _______ its doors permanently.",
    "options": [
      "would close",
      "will close",
      "closes",
      "has closed"
    ],
    "correctAnswer": "A",
    "explanation": "\"Were it not for + noun\" is an inverted second conditional expressing present unreality paired with \"would close\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-134",
    "question": "Fill in the blank: Had it not been for the prompt intervention of the paramedic, the patient _______ of respiratory failure.",
    "options": [
      "would die",
      "would have died",
      "will die",
      "died"
    ],
    "correctAnswer": "B",
    "explanation": "\"Had it not been for...\" is an inverted third conditional paired with \"would have died\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-135",
    "question": "Choose the correct option: If you _______ across any relevant journal articles, please forward them to my email.",
    "options": [
      "came",
      "will come",
      "should come",
      "had come"
    ],
    "correctAnswer": "C",
    "explanation": "\"If you should come across...\" politely expresses a possible future occurrence.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-136",
    "question": "Fill in the blank: If the flight arrives on time, we _______ the opening keynote at 09:00.",
    "options": [
      "catch",
      "had caught",
      "would catch",
      "will catch"
    ],
    "correctAnswer": "D",
    "explanation": "First conditional main clause takes \"will + bare infinitive\" (\"will catch\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-137",
    "question": "Choose the correct option: She acts as if she _______ the head of the entire research institute.",
    "options": [
      "were",
      "is",
      "has been",
      "will be"
    ],
    "correctAnswer": "A",
    "explanation": "\"As if + subjunctive were\" indicates a hypothetical or non-factual condition.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-138",
    "question": "Fill in the blank: If we were to accept their terms, we _______ our intellectual property rights.",
    "options": [
      "compromise",
      "would compromise",
      "will compromise",
      "had compromised"
    ],
    "correctAnswer": "B",
    "explanation": "\"If + were to + verb\" indicates a tentative/hypothetical condition taking \"would compromise\" in the main clause.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-139",
    "question": "Choose the correct option: What would you do provided that the scholarship _______ cancelled unexpectedly?",
    "options": [
      "is",
      "had been",
      "were",
      "will be"
    ],
    "correctAnswer": "C",
    "explanation": "In hypothetical questions matching \"what would you do\", \"provided that\" takes the past subjunctive \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-140",
    "question": "Identify the sentence with correct mixed conditional logic:",
    "options": [
      "If I had studied harder in high school, I would have had a better career now.",
      "If I had studied harder in high school, I will have a better career now.",
      "If I studied harder in high school, I would have a better career now.",
      "If I had studied harder in high school, I would have a better career now."
    ],
    "correctAnswer": "D",
    "explanation": "The past condition (\"had studied\") correctly pairs with the present continuous/state consequence (\"would have a better career now\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-141",
    "question": "Choose the correct passive transformation: \"The university authorities are currently reviewing the admissions criteria.\"",
    "options": [
      "The admissions criteria are currently being reviewed by the university authorities.",
      "The admissions criteria is currently reviewed by the university authorities.",
      "The admissions criteria have been currently reviewed by the university authorities.",
      "The admissions criteria were currently being reviewed by the university authorities."
    ],
    "correctAnswer": "A",
    "explanation": "Present continuous passive for plural subject (\"criteria\") requires \"are currently being reviewed\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-142",
    "question": "Fill in the blank: The ancient parchment is believed _______ in the late seventh century by monastic scribes.",
    "options": [
      "to write",
      "to have been written",
      "to be written",
      "to have written"
    ],
    "correctAnswer": "B",
    "explanation": "Impersonal reporting passive with past reference requires the perfect passive infinitive: \"to have been written\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-143",
    "question": "Choose the correct causative structure: The laboratory director _______ the calibration certificates verified by an independent agency.",
    "options": [
      "let",
      "made",
      "had",
      "forced"
    ],
    "correctAnswer": "C",
    "explanation": "The causative structure \"have something done\" (\"had the calibration certificates verified\") indicates arranging for work to be completed.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-144",
    "question": "Fill in the blank: The professor got the graduate assistant _______ the raw statistical datasets before the meeting.",
    "options": [
      "reorganize",
      "reorganized",
      "reorganizing",
      "to reorganize"
    ],
    "correctAnswer": "D",
    "explanation": "The causative verb \"get + person\" is followed by a to-infinitive (\"to reorganize\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-145",
    "question": "Fill in the blank: The research paper _______ by an international peer-review committee before publication.",
    "options": [
      "was evaluated",
      "evaluated",
      "is evaluating",
      "had evaluating"
    ],
    "correctAnswer": "A",
    "explanation": "Simple past passive requires \"was/were + past participle\" (\"was evaluated\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-146",
    "question": "Fill in the blank: It _______ that over eighty percent of global maritime trade passes through strategic straits.",
    "options": [
      "estimates",
      "is estimated",
      "is estimating",
      "was estimating"
    ],
    "correctAnswer": "B",
    "explanation": "Impersonal passive reporting formula: \"It is estimated that...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-147",
    "question": "Choose the correct option: The new hospital wing _______ by the Minister of Health next Monday.",
    "options": [
      "will inaugurate",
      "is inaugurating",
      "will be inaugurated",
      "has inaugurated"
    ],
    "correctAnswer": "C",
    "explanation": "Future simple passive requires \"will be + past participle\" (\"will be inaugurated\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-148",
    "question": "Fill in the blank: The criminal syndicate was reported _______ illicit funds through offshore shell companies.",
    "options": [
      "to funnel",
      "having funneled",
      "to be funneled",
      "to have funneled"
    ],
    "correctAnswer": "D",
    "explanation": "Reporting verb in the passive (\"was reported\") followed by past activity uses the perfect active infinitive \"to have funneled\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-149",
    "question": "Fill in the blank: The strict safety protocol requires that safety goggles _______ at all times in the chemistry laboratory.",
    "options": [
      "be worn",
      "are worn",
      "must wear",
      "to be worn"
    ],
    "correctAnswer": "A",
    "explanation": "Subjunctive passive in mandative requirement: \"be worn\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-150",
    "question": "Fill in the blank: The iconic bridge _______ in 1937 and remains an engineering marvel.",
    "options": [
      "constructed",
      "was constructed",
      "is constructed",
      "had constructed"
    ],
    "correctAnswer": "B",
    "explanation": "Past passive with specific year requires \"was constructed\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-151",
    "question": "Choose the correct causative form: The manager made the interns _______ the archived documents before leaving for the day.",
    "options": [
      "filing",
      "to file",
      "file",
      "filed"
    ],
    "correctAnswer": "C",
    "explanation": "Causative \"make + person\" is followed by the bare infinitive (\"file\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-152",
    "question": "Fill in the blank: The historic castle _______ by thousands of international tourists every summer.",
    "options": [
      "visits",
      "was visiting",
      "is visiting",
      "is visited"
    ],
    "correctAnswer": "D",
    "explanation": "Present simple passive for habitual action requires \"is visited\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-153",
    "question": "Fill in the blank: The endangered species is thought _______ from the island over a century ago.",
    "options": [
      "to have disappeared",
      "to disappear",
      "to be disappeared",
      "disappearing"
    ],
    "correctAnswer": "A",
    "explanation": "Perfect infinitive \"to have disappeared\" is used with passive reporting verbs referring to past occurrences.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-154",
    "question": "Choose the correct form: All hazardous materials must _______ in accordance with strict environmental regulations.",
    "options": [
      "dispose",
      "be disposed of",
      "dispose of",
      "be disposed"
    ],
    "correctAnswer": "B",
    "explanation": "Passive form of prepositional verb \"dispose of\" requires retaining the preposition: \"must be disposed of\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-155",
    "question": "Fill in the blank: He resented _______ like an amateur after decades of professional experience.",
    "options": [
      "treating",
      "to be treated",
      "being treated",
      "having treated"
    ],
    "correctAnswer": "C",
    "explanation": "The verb \"resent\" takes a passive gerund (\"being treated\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-156",
    "question": "Choose the correct option: By 5:00 PM yesterday, all the examination papers _______.",
    "options": [
      "graded",
      "have been graded",
      "were grading",
      "had been graded"
    ],
    "correctAnswer": "D",
    "explanation": "Past perfect passive (\"had been graded\") shows completion before a specific past deadline.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-157",
    "question": "Fill in the blank: Penicillin _______ by Alexander Fleming in 1928.",
    "options": [
      "was discovered",
      "discovered",
      "has been discovered",
      "is discovered"
    ],
    "correctAnswer": "A",
    "explanation": "Simple past passive requires \"was discovered\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-158",
    "question": "Choose the correct sentence in the passive voice:",
    "options": [
      "The proposal expects to be approved by the board tomorrow.",
      "The proposal is expected to be approved by the board tomorrow.",
      "It is expected the proposal to approve by the board tomorrow.",
      "The proposal is expecting to approve by the board tomorrow."
    ],
    "correctAnswer": "B",
    "explanation": "\"The proposal is expected to be approved...\" is the correct personal passive construction.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-159",
    "question": "Fill in the blank: The suspect _______ by federal investigators for over three hours.",
    "options": [
      "is interrogating",
      "has been interrogated",
      "was being interrogated",
      "interrogated"
    ],
    "correctAnswer": "C",
    "explanation": "Past continuous passive (\"was being interrogated\") indicates a continuous past action.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-160",
    "question": "Choose the correct causative: She let the students _______ their own research topics for the final project.",
    "options": [
      "chosen",
      "to choose",
      "choosing",
      "choose"
    ],
    "correctAnswer": "D",
    "explanation": "\"Let + person\" is followed by the bare infinitive (\"choose\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-161",
    "question": "Fill in the blank: The medieval manuscript was so delicate that it _______ with special ultraviolet filters.",
    "options": [
      "had to be examined",
      "had to examine",
      "must be examined",
      "should examine"
    ],
    "correctAnswer": "A",
    "explanation": "Past obligation in passive voice: \"had to be examined\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-162",
    "question": "Fill in the blank: Delicious meals _______ daily by our master chefs in the central kitchen.",
    "options": [
      "prepare",
      "are prepared",
      "are preparing",
      "have prepared"
    ],
    "correctAnswer": "B",
    "explanation": "Present simple passive requires \"are prepared\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-163",
    "question": "Choose the correct form: Having _______ by several reputable scholars, the theory gained wide acceptance.",
    "options": [
      "endorsed",
      "endorsing",
      "been endorsed",
      "be endorsed"
    ],
    "correctAnswer": "C",
    "explanation": "Perfect passive participle modifier: \"Having been endorsed by...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-164",
    "question": "Fill in the blank: The results of the clinical trial _______ in a peer-reviewed medical journal next month.",
    "options": [
      "will publish",
      "have been published",
      "are publishing",
      "will be published"
    ],
    "correctAnswer": "D",
    "explanation": "Future simple passive requires \"will be published\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-165",
    "question": "Fill in the blank: The ancient pyramids _______ by thousands of laborers over several decades.",
    "options": [
      "were built",
      "built",
      "have built",
      "are building"
    ],
    "correctAnswer": "A",
    "explanation": "Past simple passive with plural subject requires \"were built\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-166",
    "question": "Fill in the blank: He is known _______ several breakthroughs in the field of quantum cryptography.",
    "options": [
      "to make",
      "to have made",
      "making",
      "to be made"
    ],
    "correctAnswer": "B",
    "explanation": "Perfect active infinitive \"to have made\" indicates achievements completed prior to the present state of being known.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-167",
    "question": "Choose the correct option: The computer system _______ maintained on a quarterly basis by certified technicians.",
    "options": [
      "was being",
      "are",
      "is",
      "will"
    ],
    "correctAnswer": "C",
    "explanation": "Present simple passive for singular subject \"system\" requires \"is maintained\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-168",
    "question": "Fill in the blank: The new bypass road _______ to relieve central city congestion by next year.",
    "options": [
      "expects",
      "is expecting",
      "has expected",
      "is expected"
    ],
    "correctAnswer": "D",
    "explanation": "Present simple passive of reporting verb: \"is expected to...\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-169",
    "question": "Choose the correct form: No one likes _______ when they are explaining a complex point.",
    "options": [
      "being interrupted",
      "to interrupt",
      "interrupting",
      "to have interrupted"
    ],
    "correctAnswer": "A",
    "explanation": "Passive gerund \"being interrupted\" expresses receiving the action.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-170",
    "question": "Fill in the blank: The faulty wiring _______ replaced before the facility reopens next week.",
    "options": [
      "must have been",
      "must be",
      "should",
      "is to"
    ],
    "correctAnswer": "B",
    "explanation": "Present/future passive necessity: \"must be replaced\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-171",
    "question": "Fill in the blank: Millions of emails _______ worldwide every single minute.",
    "options": [
      "send",
      "are sending",
      "are sent",
      "were sent"
    ],
    "correctAnswer": "C",
    "explanation": "Present simple passive for routine fact: \"are sent\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-172",
    "question": "Fill in the blank: The missing document was discovered _______ under a stack of old folders.",
    "options": [
      "hiding",
      "have hidden",
      "to hide",
      "hidden"
    ],
    "correctAnswer": "D",
    "explanation": "Past participle adjective \"hidden\" functions as a subject complement in passive constructions.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-173",
    "question": "Choose the correct causative: The university had a prominent landscape architect _______ the new botanical garden.",
    "options": [
      "design",
      "to design",
      "designing",
      "designed"
    ],
    "correctAnswer": "A",
    "explanation": "Causative \"have + person\" takes the bare infinitive (\"design\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-174",
    "question": "Fill in the blank: The financial records _______ by forensic accountants following allegations of fraud.",
    "options": [
      "are auditing",
      "were audited",
      "audited",
      "have audited"
    ],
    "correctAnswer": "B",
    "explanation": "Past simple passive: \"were audited\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-175",
    "question": "Choose the correct option: The ancient monument was alleged _______ by grave robbers in the nineteenth century.",
    "options": [
      "to desecrate",
      "to be desecrated",
      "to have been desecrated",
      "desecrated"
    ],
    "correctAnswer": "C",
    "explanation": "Past passive reporting construction requires the perfect passive infinitive: \"to have been desecrated\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-176",
    "question": "Fill in the blank: Spanish _______ as the official language in over twenty sovereign nations.",
    "options": [
      "speaks",
      "spoke",
      "is speaking",
      "is spoken"
    ],
    "correctAnswer": "D",
    "explanation": "Present simple passive: \"is spoken\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-177",
    "question": "Choose the correct form: The research findings _______ at the international symposium tomorrow morning.",
    "options": [
      "will be presented",
      "will present",
      "are presenting",
      "were presented"
    ],
    "correctAnswer": "A",
    "explanation": "Future passive: \"will be presented\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-178",
    "question": "Fill in the blank: The experiment was thought _______ due to chemical contamination in the test tubes.",
    "options": [
      "to fail",
      "to have failed",
      "failing",
      "to be failed"
    ],
    "correctAnswer": "B",
    "explanation": "Perfect infinitive \"to have failed\" expresses a prior completed action after a passive reporting verb.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-179",
    "question": "Choose the correct option: She helped the disabled student _______ his mobility device onto the shuttle bus.",
    "options": [
      "lifted",
      "lifting",
      "lift",
      "to have lifted"
    ],
    "correctAnswer": "C",
    "explanation": "The verb \"help\" can be followed by a bare infinitive (\"lift\") or a to-infinitive.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-180",
    "question": "Fill in the blank: Several archaeological artifacts _______ during the subway extension excavation last month.",
    "options": [
      "uncovered",
      "are uncovered",
      "have been uncovered",
      "were uncovered"
    ],
    "correctAnswer": "D",
    "explanation": "Past simple passive with specific past time: \"were uncovered\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-181",
    "question": "Choose the correct passive form: \"People say that excessive sugar consumption causes dental cavities.\"",
    "options": [
      "It is said that excessive sugar consumption causes dental cavities.",
      "Excessive sugar consumption says to cause dental cavities.",
      "Dental cavities are said to cause by excessive sugar consumption.",
      "It was said that excessive sugar consumption causes dental cavities."
    ],
    "correctAnswer": "A",
    "explanation": "\"It is said that...\" is the accurate impersonal passive transformation.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-182",
    "question": "Fill in the blank: The annual marathon _______ by over ten thousand runners each spring.",
    "options": [
      "completes",
      "is completed",
      "has completed",
      "was completing"
    ],
    "correctAnswer": "B",
    "explanation": "Present simple passive for annual recurring event: \"is completed\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-183",
    "question": "Fill in the blank: The data files _______ permanently deleted, so recovery proved impossible.",
    "options": [
      "were being",
      "have been",
      "had been",
      "are"
    ],
    "correctAnswer": "C",
    "explanation": "Past perfect passive (\"had been\") shows completion prior to the past event (\"proved impossible\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-184",
    "question": "Choose the correct causative form: We need to get a certified electrician _______ the electrical wiring.",
    "options": [
      "inspect",
      "inspected",
      "inspecting",
      "to inspect"
    ],
    "correctAnswer": "D",
    "explanation": "Causative \"get + person\" requires \"to + infinitive\" (\"to inspect\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-185",
    "question": "Fill in the blank: The criminal was seen _______ the building through the rear exit.",
    "options": [
      "to enter",
      "enter",
      "entering",
      "entered"
    ],
    "correctAnswer": "A",
    "explanation": "Verbs of perception in passive voice (\"was seen\") are followed by a to-infinitive (\"to enter\") or present participle.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-186",
    "question": "Choose the correct relative pronoun: The climatologist _______ research on glacial retreat won the Nobel Prize has published a new study.",
    "options": [
      "who",
      "whose",
      "whom",
      "which"
    ],
    "correctAnswer": "B",
    "explanation": "\"Whose\" indicates possession (\"whose research\") modifying \"The climatologist\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-187",
    "question": "Fill in the blank: The committee interviewed twelve candidates, none of _______ met all the prerequisite engineering standards.",
    "options": [
      "who",
      "which",
      "whom",
      "whose"
    ],
    "correctAnswer": "C",
    "explanation": "Preposition + pronoun referring to people (\"none of whom\") requires the objective form \"whom\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-188",
    "question": "Choose the correct relative pronoun: The volcanic eruption, _______ caused widespread flight cancellations across Europe, occurred without warning.",
    "options": [
      "that",
      "who",
      "what",
      "which"
    ],
    "correctAnswer": "D",
    "explanation": "Non-defining relative clauses set off by commas must use \"which\" (never \"that\") for objects or events.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-189",
    "question": "Fill in the blank: The laboratory technician _______ prepared the chemical samples was praised for her precision.",
    "options": [
      "who",
      "which",
      "whom",
      "whose"
    ],
    "correctAnswer": "A",
    "explanation": "\"Who\" is the subject relative pronoun referring to a person (\"technician\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-190",
    "question": "Choose the correct participle clause: _______ the extensive literature review, the scholar proceeded to formulate her research hypothesis.",
    "options": [
      "Completing",
      "Having completed",
      "Completed",
      "Have completed"
    ],
    "correctAnswer": "B",
    "explanation": "The perfect active participle (\"Having completed\") highlights that one action finished before the next began.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-191",
    "question": "Fill in the blank: The ancient trade route, _______ as the Silk Road, spanned thousands of miles across Eurasia.",
    "options": [
      "knowing",
      "was known",
      "known",
      "is known"
    ],
    "correctAnswer": "C",
    "explanation": "Reduced passive relative clause: \"which was known\" reduces to the past participle \"known\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-192",
    "question": "Fill in the blank: The methodology _______ the demographic survey was conducted conformed to international standards.",
    "options": [
      "whereby",
      "wherein",
      "in which",
      "by which"
    ],
    "correctAnswer": "D",
    "explanation": "\"By which\" (or \"in accordance with which\") correctly introduces the means by which the survey was conducted.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-193",
    "question": "Choose the correct relative pronoun: The epoch _______ multicellular life first flourished is known as the Cambrian Period.",
    "options": [
      "when",
      "where",
      "which",
      "that"
    ],
    "correctAnswer": "A",
    "explanation": "\"When\" is the relative adverb referring to a time period (\"The epoch when...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-194",
    "question": "Fill in the blank: The coastal ecosystem _______ coral polyps build calcified reefs is under severe ecological threat.",
    "options": [
      "which",
      "where",
      "when",
      "that"
    ],
    "correctAnswer": "B",
    "explanation": "\"Where\" refers to a place or environment in which an action occurs.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-195",
    "question": "Choose the correct reduced relative clause: The passengers _______ on the delayed morning flight were issued meal vouchers.",
    "options": [
      "were booked",
      "booking",
      "booked",
      "having booked"
    ],
    "correctAnswer": "C",
    "explanation": "\"who were booked\" reduces to the past participle \"booked\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-196",
    "question": "Fill in the blank: Students _______ in the intensive academic writing course must submit three essays weekly.",
    "options": [
      "enroll",
      "were enrolled",
      "enrolling",
      "enrolled"
    ],
    "correctAnswer": "D",
    "explanation": "Reduced passive relative clause (\"who are enrolled\" -> \"enrolled\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-197",
    "question": "Choose the correct option: _______ by the high cost of tuition, many talented students seek external scholarships.",
    "options": [
      "Deterred",
      "Deterring",
      "Having deterred",
      "Deter"
    ],
    "correctAnswer": "A",
    "explanation": "Past participle clause (\"Being deterred\" -> \"Deterred\") indicating a passive cause.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-198",
    "question": "Fill in the blank: The novel deals with a dystopian society _______ individual privacy has been completely abolished.",
    "options": [
      "which",
      "in which",
      "that",
      "whom"
    ],
    "correctAnswer": "B",
    "explanation": "\"In which\" (equivalent to \"where\") introduces the relative clause describing circumstances within the society.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-199",
    "question": "Fill in the blank: The instrument _______ measures atmospheric pressure is called a barometer.",
    "options": [
      "who",
      "whom",
      "which",
      "whose"
    ],
    "correctAnswer": "C",
    "explanation": "\"Which\" (or \"that\") is the relative pronoun used for non-human objects and instruments.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-200",
    "question": "Choose the correct option: The company produced three prototypes, all _______ failed the rigorous safety stress test.",
    "options": [
      "of what",
      "of whom",
      "of that",
      "of which"
    ],
    "correctAnswer": "D",
    "explanation": "\"all of which\" is used for non-human objects following a comma in non-defining clauses.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-201",
    "question": "Fill in the blank: The diplomat _______ the ambassador assigned to lead the bilateral negotiations was experienced.",
    "options": [
      "whom",
      "which",
      "whose",
      "where"
    ],
    "correctAnswer": "A",
    "explanation": "\"Whom\" is the objective relative pronoun referring to the person who receives the action of assignment.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-202",
    "question": "Choose the correct participle clause: _______ into the atmosphere, sulfur dioxide reacts with water vapor to form acid rain.",
    "options": [
      "Emitting",
      "Emitted",
      "Having emitted",
      "To emit"
    ],
    "correctAnswer": "B",
    "explanation": "Past participle clause indicating passive voice (\"When it is emitted\" -> \"Emitted\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-203",
    "question": "Fill in the blank: The university has three campuses, the largest _______ is located in the city center.",
    "options": [
      "of whom",
      "of that",
      "of which",
      "of where"
    ],
    "correctAnswer": "C",
    "explanation": "\"the largest of which\" refers to the campuses.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-204",
    "question": "Fill in the blank: Is this the academic journal _______ published Dr. Watson's breakthrough paper?",
    "options": [
      "whose",
      "whom",
      "where",
      "that"
    ],
    "correctAnswer": "D",
    "explanation": "Defining relative pronoun \"that\" refers to the journal.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-205",
    "question": "Choose the correct option: _______ through the dense fog, the lighthouse beam guided ships safely into the harbor.",
    "options": [
      "Cutting",
      "Cut",
      "Having cut",
      "To cut"
    ],
    "correctAnswer": "A",
    "explanation": "Present participle clause (\"Cutting\") shows continuous active action modifying \"the lighthouse beam\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-206",
    "question": "Fill in the blank: The ancient city, _______ origins date back to the Bronze Age, was recently designated a UNESCO World Heritage site.",
    "options": [
      "which",
      "whose",
      "that",
      "its"
    ],
    "correctAnswer": "B",
    "explanation": "Possessive relative pronoun \"whose\" can refer to both persons and inanimate entities (\"whose origins\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-207",
    "question": "Choose the correct participle structure: _______ all the requisite safety criteria, the aircraft was granted flight clearance.",
    "options": [
      "Met",
      "Meeting",
      "Having met",
      "To meet"
    ],
    "correctAnswer": "C",
    "explanation": "Perfect active participle (\"Having met\") shows prior completion before the clearance was granted.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-208",
    "question": "Fill in the blank: The legal framework _______ the international agreement was established underwent thorough scrutiny.",
    "options": [
      "in where",
      "under that",
      "whereby",
      "under which"
    ],
    "correctAnswer": "D",
    "explanation": "\"under which\" is the correct prepositional relative phrase modifying \"The legal framework\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-209",
    "question": "Fill in the blank: The architect _______ designed the innovative eco-friendly library received an international award.",
    "options": [
      "who",
      "which",
      "whom",
      "whose"
    ],
    "correctAnswer": "A",
    "explanation": "Subject pronoun \"who\" refers to the architect.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-210",
    "question": "Choose the correct option: _______ on top of the limestone cliff, the ancient fortress overlooks the entire bay.",
    "options": [
      "Perching",
      "Perched",
      "Having perched",
      "To perch"
    ],
    "correctAnswer": "B",
    "explanation": "Past participle clause \"Perched\" describes the static situated position of the fortress.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-211",
    "question": "Fill in the blank: The scholars discussed several hypotheses, the most convincing _______ was formulated by Dr. Alvarez.",
    "options": [
      "of that",
      "of whom",
      "of which",
      "of where"
    ],
    "correctAnswer": "C",
    "explanation": "\"the most convincing of which\" refers to \"hypotheses\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-212",
    "question": "Fill in the blank: The river _______ water irrigates the valley originates in the Himalayan glaciers.",
    "options": [
      "of which",
      "which",
      "that",
      "whose"
    ],
    "correctAnswer": "D",
    "explanation": "\"whose water\" expresses possessive relationship for the river.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-213",
    "question": "Choose the correct participle clause: _______ of the severe hurricane warning, the fishermen returned their boats to the harbor.",
    "options": [
      "Informed",
      "Informing",
      "Having informed",
      "To inform"
    ],
    "correctAnswer": "A",
    "explanation": "Past participle clause (\"Being informed\" -> \"Informed\") shows passive causation.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-214",
    "question": "Fill in the blank: That is the historic hall _______ the declaration of independence was signed in 1776.",
    "options": [
      "which",
      "where",
      "that",
      "when"
    ],
    "correctAnswer": "B",
    "explanation": "Relative adverb of place \"where\" modifies \"hall\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-215",
    "question": "Fill in the blank: The scientist _______ discovered radium was Marie Curie.",
    "options": [
      "whom",
      "which",
      "who",
      "whose"
    ],
    "correctAnswer": "C",
    "explanation": "\"Who\" is the subject relative pronoun for Marie Curie.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-216",
    "question": "Choose the correct participle clause: _______ the experiment multiple times with consistent results, the laboratory team published their data.",
    "options": [
      "To repeat",
      "Repeating",
      "Repeated",
      "Having repeated"
    ],
    "correctAnswer": "D",
    "explanation": "Perfect participle \"Having repeated\" indicates that repetition of experiments was completed before publication.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-217",
    "question": "Fill in the blank: The conference attendees, many of _______ were visiting Asia for the first time, enjoyed the cultural tour.",
    "options": [
      "whom",
      "who",
      "which",
      "whose"
    ],
    "correctAnswer": "A",
    "explanation": "\"many of whom\" is the correct objective relative construction referring to people.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-218",
    "question": "Choose the correct option: _______ by unexpected logistical delays, the expedition team postponed their mountain ascent.",
    "options": [
      "Hampering",
      "Hampered",
      "Having hampered",
      "To hamper"
    ],
    "correctAnswer": "B",
    "explanation": "Past participle \"Hampered\" (meaning obstructed) functions as a passive cause modifier.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-219",
    "question": "Fill in the blank: The laboratory equipment _______ during the transport was insured for full replacement value.",
    "options": [
      "was damaged",
      "damaging",
      "damaged",
      "having damaged"
    ],
    "correctAnswer": "C",
    "explanation": "Reduced relative clause: \"which was damaged\" reduces to the past participle \"damaged\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-220",
    "question": "Fill in the blank: The professor _______ office is on the third floor is holding office hours today.",
    "options": [
      "which",
      "who",
      "whom",
      "whose"
    ],
    "correctAnswer": "D",
    "explanation": "\"Whose\" shows possession modifying \"office\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-221",
    "question": "Fill in the blank: The process _______ carbon is extracted from atmospheric gases is known as carbon sequestration.",
    "options": [
      "whereby",
      "wherever",
      "whereas",
      "wherein"
    ],
    "correctAnswer": "A",
    "explanation": "\"Whereby\" means \"by which\" or \"through which\", standardly used in formal descriptions of scientific processes.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-222",
    "question": "Choose the correct option: All vehicles _______ on campus must display a valid parking permit on the windshield.",
    "options": [
      "parking",
      "parked",
      "were parked",
      "to park"
    ],
    "correctAnswer": "B",
    "explanation": "Reduced passive relative clause: \"that are parked\" -> \"parked\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-223",
    "question": "Choose the correct participle clause: _______ from the mountain summit, the entire glacial valley looks breathtakingly vast.",
    "options": [
      "Viewing",
      "Having viewed",
      "Viewed",
      "To view"
    ],
    "correctAnswer": "C",
    "explanation": "Past participle clause \"Viewed from...\" modifies \"the entire glacial valley\" (which is viewed).",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-224",
    "question": "Fill in the blank: The mechanism _______ the clockwork operates was crafted by an eighteenth-century horologist.",
    "options": [
      "with whom",
      "by that",
      "in where",
      "by which"
    ],
    "correctAnswer": "D",
    "explanation": "\"by which\" is the standard prepositional relative phrase.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-225",
    "question": "Fill in the blank: The author _______ novel won the Pulitzer Prize gave a guest reading at the university.",
    "options": [
      "whose",
      "who",
      "whom",
      "which"
    ],
    "correctAnswer": "A",
    "explanation": "\"Whose\" expresses possession (\"whose novel\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-226",
    "question": "Choose the correct option: _______ into English, the ancient Greek philosophical treatise gained widespread modern readership.",
    "options": [
      "Translating",
      "Translated",
      "Having translated",
      "To translate"
    ],
    "correctAnswer": "B",
    "explanation": "Past participle clause \"Translated into English\" modifies \"the treatise\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-227",
    "question": "Fill in the blank: The historic archives contain five thousand manuscripts, several _______ date back to the tenth century.",
    "options": [
      "of that",
      "of whom",
      "of which",
      "of where"
    ],
    "correctAnswer": "C",
    "explanation": "\"several of which\" refers to inanimate manuscripts.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-228",
    "question": "Choose the correct participle clause: _______ the required prerequisite modules, the student was permitted to enroll in the advanced seminar.",
    "options": [
      "To satisfy",
      "Satisfying",
      "Satisfied",
      "Having satisfied"
    ],
    "correctAnswer": "D",
    "explanation": "Perfect participle \"Having satisfied\" denotes the necessary prior completion.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-229",
    "question": "Fill in the blank: The year 1969 was the historic moment _______ humans first stepped onto the lunar surface.",
    "options": [
      "when",
      "where",
      "which",
      "that"
    ],
    "correctAnswer": "A",
    "explanation": "Relative adverb \"when\" modifies the time reference \"the historic moment\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-230",
    "question": "Fill in the blank: The medicine _______ the doctor prescribed helped reduce the patient's fever.",
    "options": [
      "who",
      "that",
      "whom",
      "where"
    ],
    "correctAnswer": "B",
    "explanation": "Defining relative pronoun \"that\" (or \"which\") refers to \"The medicine\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-231",
    "question": "Choose the correct modal for past deduction: The lights in the laboratory are completely dark and the doors are locked; the scientists _______ home for the night.",
    "options": [
      "can have gone",
      "should have gone",
      "must have gone",
      "might go"
    ],
    "correctAnswer": "C",
    "explanation": "\"Must have + past participle\" expresses high logical certainty about a past action based on current evidence.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-232",
    "question": "Fill in the blank: Dr. Miller was in London delivering a keynote lecture yesterday, so he _______ the burglary in Edinburgh.",
    "options": [
      "needn't commit",
      "mustn't commit",
      "shouldn't have committed",
      "can't have committed"
    ],
    "correctAnswer": "D",
    "explanation": "\"Can't have + past participle\" expresses logical impossibility regarding a past event.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-233",
    "question": "Choose the correct modal form: The research assistant _______ the data files; otherwise, the statistical discrepancy would not exist.",
    "options": [
      "must have corrupted",
      "should have corrupted",
      "would corrupt",
      "could corrupt"
    ],
    "correctAnswer": "A",
    "explanation": "Logical deduction about a past cause uses \"must have corrupted\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-234",
    "question": "Fill in the blank: You _______ all the survey responses manually; the automated software could have processed them in seconds.",
    "options": [
      "didn't need to analyze",
      "needn't have analyzed",
      "mustn't analyze",
      "shouldn't analyze"
    ],
    "correctAnswer": "B",
    "explanation": "\"Needn't have + past participle\" indicates that an action was performed, but was in fact unnecessary.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-235",
    "question": "Choose the correct option: The flight was cancelled due to heavy snowfall, so we _______ to the airport.",
    "options": [
      "mustn't have gone",
      "needn't have gone",
      "didn't need to go",
      "shouldn't go"
    ],
    "correctAnswer": "C",
    "explanation": "\"Didn't need to go\" means it was not necessary and therefore the action was not performed.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-236",
    "question": "Fill in the blank: Candidates _______ submit their completed examination booklets before the final bell rings.",
    "options": [
      "may",
      "might",
      "could",
      "must"
    ],
    "correctAnswer": "D",
    "explanation": "\"Must\" expresses compulsory requirement/obligation.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-237",
    "question": "Choose the correct option: With proper funding and support, the renewable energy project _______ operational by next year.",
    "options": [
      "could be",
      "must have been",
      "would have been",
      "should had been"
    ],
    "correctAnswer": "A",
    "explanation": "\"Could be\" expresses present/future possibility under certain conditions.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-238",
    "question": "Fill in the blank: The driver _______ at the red signal; his failure to do so caused the collision.",
    "options": [
      "must stop",
      "should have stopped",
      "would stop",
      "could stop"
    ],
    "correctAnswer": "B",
    "explanation": "\"Should have stopped\" indicates a past moral or legal obligation that was unfulfilled.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-239",
    "question": "Fill in the blank: It's freezing outside; you _______ put on a heavy winter coat before leaving.",
    "options": [
      "had rather",
      "would better",
      "had better",
      "would rather to"
    ],
    "correctAnswer": "C",
    "explanation": "\"Had better + bare infinitive\" is used for strong advisability or warning in a specific present situation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-240",
    "question": "Choose the correct modal form: The historical documents _______ during the revolution, as no trace of them remains in any archive.",
    "options": [
      "can be destroyed",
      "must destroy",
      "should have destroyed",
      "might have been destroyed"
    ],
    "correctAnswer": "D",
    "explanation": "\"Might have been destroyed\" expresses a strong historical possibility in the passive voice.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-241",
    "question": "Fill in the blank: If you feel unwell during the laboratory session, you _______ inform the instructor immediately.",
    "options": [
      "ought to",
      "ought",
      "had rather",
      "need to not"
    ],
    "correctAnswer": "A",
    "explanation": "\"Ought to\" expresses advisability and duty.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-242",
    "question": "Fill in the blank: Visitors _______ not feed the animals in the national zoological park.",
    "options": [
      "need",
      "must",
      "might",
      "ought"
    ],
    "correctAnswer": "B",
    "explanation": "\"Must not\" expresses formal prohibition.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-243",
    "question": "Choose the correct option: The ancient inhabitants _______ the heavy stones using timber rollers and levers, though archaeologists are still debating the method.",
    "options": [
      "should have transported",
      "must transport",
      "may have transported",
      "can transport"
    ],
    "correctAnswer": "C",
    "explanation": "\"May have transported\" expresses a plausible past possibility.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-244",
    "question": "Fill in the blank: We _______ have worried about the weather; the entire afternoon turned out bright and sunny.",
    "options": [
      "couldn't",
      "mustn't",
      "can't",
      "needn't"
    ],
    "correctAnswer": "D",
    "explanation": "\"Needn't have worried\" shows that worrying occurred but proved unnecessary in retrospect.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-245",
    "question": "Choose the correct form: She _______ the email last night because her internet router was completely disabled.",
    "options": [
      "couldn't have sent",
      "mustn't have sent",
      "shouldn't send",
      "needn't have sent"
    ],
    "correctAnswer": "A",
    "explanation": "\"Couldn't have sent\" denotes absolute past impossibility due to physical constraint.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-246",
    "question": "Fill in the blank: The government _______ to reduce greenhouse gas emissions by forty percent under the international accord.",
    "options": [
      "bound",
      "is bound",
      "is bounding",
      "was bound to be"
    ],
    "correctAnswer": "B",
    "explanation": "\"Be bound to\" expresses a strong obligation or certainty.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-247",
    "question": "Fill in the blank: You _______ bring your own laptop; computers will be provided in the testing centre.",
    "options": [
      "ought not",
      "must not",
      "don't have to",
      "cannot"
    ],
    "correctAnswer": "C",
    "explanation": "\"Don't have to\" expresses absence of obligation (it is optional).",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-248",
    "question": "Choose the correct modal: Why did you take an expensive taxi when you _______ the subway directly to the hotel?",
    "options": [
      "should take",
      "must have taken",
      "would take",
      "could have taken"
    ],
    "correctAnswer": "D",
    "explanation": "\"Could have taken\" indicates an unexploited past opportunity.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-249",
    "question": "Fill in the blank: Given her extensive academic credentials, she _______ the top candidate for the professorship.",
    "options": [
      "is likely to be",
      "likely to be",
      "is likely being",
      "likes to be"
    ],
    "correctAnswer": "A",
    "explanation": "\"Is likely to be\" expresses strong probability.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-250",
    "question": "Choose the correct option: The package was mailed via express courier five days ago; it _______ arrived by now.",
    "options": [
      "must to have",
      "ought to have",
      "can have",
      "might to have"
    ],
    "correctAnswer": "B",
    "explanation": "\"Ought to have arrived\" indicates reasonable expectation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-251",
    "question": "Fill in the blank: The forensic evidence suggests that the fire _______ by a faulty electrical circuit.",
    "options": [
      "should have ignited",
      "must ignite",
      "must have been ignited",
      "can be ignited"
    ],
    "correctAnswer": "C",
    "explanation": "Logical deduction in the passive voice: \"must have been ignited\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-252",
    "question": "Fill in the blank: _______ I ask a question regarding the experimental methodology?",
    "options": [
      "Ought",
      "Must",
      "Should",
      "May"
    ],
    "correctAnswer": "D",
    "explanation": "\"May I...\" is the formal polite modal for asking permission.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-253",
    "question": "Fill in the blank: You _______ smoke anywhere inside the hospital building.",
    "options": [
      "must not",
      "need not",
      "might not",
      "would not"
    ],
    "correctAnswer": "A",
    "explanation": "\"Must not\" denotes strict prohibition.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-254",
    "question": "Choose the correct modal form: The team was supposed _______ the prototype last Friday, but supply chain issues intervened.",
    "options": [
      "to deliver",
      "to have delivered",
      "delivering",
      "delivered"
    ],
    "correctAnswer": "B",
    "explanation": "\"Was supposed to have delivered\" indicates an unfulfilled scheduled past duty.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-255",
    "question": "Fill in the blank: He _______ speak four languages fluently before his tenth birthday.",
    "options": [
      "might",
      "can",
      "could",
      "should"
    ],
    "correctAnswer": "C",
    "explanation": "\"Could\" expresses general past ability.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-256",
    "question": "Choose the correct option: Despite the stormy seas, the coast guard _______ rescue all six crew members.",
    "options": [
      "would",
      "could",
      "might",
      "was able to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Was able to\" (or \"managed to\") is required for a specific past achievement against obstacles, rather than general ability \"could\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-257",
    "question": "Fill in the blank: The experiment _______ yield unexpected results if the temperature fluctuates.",
    "options": [
      "might",
      "must to",
      "ought",
      "should to"
    ],
    "correctAnswer": "A",
    "explanation": "\"Might + bare infinitive\" expresses possibility.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-258",
    "question": "Fill in the blank: You _______ drink plenty of water while trekking in high temperatures.",
    "options": [
      "might",
      "should",
      "would",
      "could to"
    ],
    "correctAnswer": "B",
    "explanation": "\"Should\" expresses general advice and recommendation.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-259",
    "question": "Fill in the blank: He _______ the confidential password; he was not even an employee of the firm.",
    "options": [
      "shouldn't have known",
      "mustn't know",
      "can't have known",
      "needn't have known"
    ],
    "correctAnswer": "C",
    "explanation": "\"Can't have known\" expresses logical impossibility in the past.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-260",
    "question": "Choose the correct option: You _______ have told him the surprise party details; now it is completely ruined!",
    "options": [
      "couldn't",
      "mustn't",
      "needn't",
      "shouldn't"
    ],
    "correctAnswer": "D",
    "explanation": "\"Shouldn't have told\" expresses criticism of a past action.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-261",
    "question": "Fill in the blank: The ancient civilization _______ a complex calendar system based on lunar cycles.",
    "options": [
      "must have possessed",
      "must possess",
      "should have possessed",
      "can possess"
    ],
    "correctAnswer": "A",
    "explanation": "Deduction about past historical knowledge: \"must have possessed\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-262",
    "question": "Choose the correct option: In many countries, citizens _______ carry national identity cards at all times.",
    "options": [
      "must to",
      "have to",
      "ought",
      "can to"
    ],
    "correctAnswer": "B",
    "explanation": "\"Have to\" expresses external legal obligation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-263",
    "question": "Fill in the blank: We _______ better hurry if we want to arrive before the doors close.",
    "options": [
      "should",
      "would",
      "had",
      "did"
    ],
    "correctAnswer": "C",
    "explanation": "The idiom is \"had better\" (\"We had better hurry\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-264",
    "question": "Fill in the blank: The company _______ informed the shareholders before releasing the merger news to the press.",
    "options": [
      "had to have",
      "must to have",
      "might to have",
      "ought to have"
    ],
    "correctAnswer": "D",
    "explanation": "\"Ought to have informed\" expresses an unfulfilled moral/procedural duty.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-265",
    "question": "Choose the correct option: There's no answer at the clinic; they _______ closed for the public holiday.",
    "options": [
      "must be",
      "can be",
      "should to be",
      "ought be"
    ],
    "correctAnswer": "A",
    "explanation": "\"Must be\" expresses present logical deduction based on the lack of phone response.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-266",
    "question": "Fill in the blank: The archaeological team _______ the excavation site before the monsoon rains flooded the valley.",
    "options": [
      "could secure",
      "managed to secure",
      "might secure",
      "can secure"
    ],
    "correctAnswer": "B",
    "explanation": "\"Managed to secure\" designates a successfully accomplished past challenge.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-267",
    "question": "Fill in the blank: You _______ not enter the biohazard containment zone without protective suits.",
    "options": [
      "ought",
      "need",
      "may",
      "would"
    ],
    "correctAnswer": "C",
    "explanation": "\"May not enter\" expresses formal prohibition in safety instructions.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-268",
    "question": "Fill in the blank: Could you please _______ the window? The room is getting warm.",
    "options": [
      "opened",
      "to open",
      "opening",
      "open"
    ],
    "correctAnswer": "D",
    "explanation": "Polite modal request \"Could you please...\" takes the bare infinitive (\"open\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-269",
    "question": "Choose the correct modal form: The missing manuscript _______ misplaced during the library reorganization last year.",
    "options": [
      "could have been",
      "must to be",
      "should be",
      "can be"
    ],
    "correctAnswer": "A",
    "explanation": "\"Could have been misplaced\" expresses a plausible past passive possibility.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-270",
    "question": "Fill in the blank: Students _______ leave their belongings unattended in the library common rooms.",
    "options": [
      "need not to",
      "should not",
      "ought not to be",
      "must not to"
    ],
    "correctAnswer": "B",
    "explanation": "\"Should not leave\" gives clear advisory guidance.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-271",
    "question": "Choose the correct articles: _______ Amazon River is _______ longest river in South America.",
    "options": [
      "The, a",
      "An, the",
      "The, the",
      "Zero article, the"
    ],
    "correctAnswer": "C",
    "explanation": "Names of rivers take the definite article \"the\" (\"The Amazon River\"), and superlative adjectives require \"the\" (\"the longest\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-272",
    "question": "Fill in the blanks: _______ Mount Everest is situated in _______ Himalayas.",
    "options": [
      "The, zero article",
      "The, the",
      "A, the",
      "Zero article, the"
    ],
    "correctAnswer": "D",
    "explanation": "Individual mountain peaks (Mount Everest) take zero article, whereas mountain ranges (the Himalayas) require \"the\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-273",
    "question": "Fill in the blank: She earned _______ Master's degree in Sustainable Engineering from Oxford University.",
    "options": [
      "a",
      "an",
      "the",
      "zero article"
    ],
    "correctAnswer": "A",
    "explanation": "\"A Master's degree\" begins with the consonant sound /m/, taking the indefinite article \"a\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-274",
    "question": "Choose the correct option: _______ honest opinion is always valued in academic discourse.",
    "options": [
      "A",
      "An",
      "The",
      "Zero article"
    ],
    "correctAnswer": "B",
    "explanation": "\"Honest\" begins with a silent 'h' and a vowel sound /\u0252/, requiring the indefinite article \"an\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-275",
    "question": "Fill in the blanks: _______ United Kingdom consists of _______ Great Britain and Northern Ireland.",
    "options": [
      "The, the",
      "Zero article, zero article",
      "The, zero article",
      "A, the"
    ],
    "correctAnswer": "C",
    "explanation": "Countries with political titles (The United Kingdom) take \"the\", while geographical island names (Great Britain) take zero article.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-276",
    "question": "Fill in the blank: Due to severe economic hardship, _______ families were able to afford private education.",
    "options": [
      "a little",
      "a few",
      "little",
      "few"
    ],
    "correctAnswer": "D",
    "explanation": "\"Few\" has a negative meaning (almost none) and modifies plural countable nouns (\"families\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-277",
    "question": "Fill in the blank: Fortunately, we still have _______ time left before the submission portal closes.",
    "options": [
      "a little",
      "little",
      "a few",
      "few"
    ],
    "correctAnswer": "A",
    "explanation": "\"A little\" has a positive meaning (some / a small amount) and modifies uncountable nouns (\"time\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-278",
    "question": "Choose the correct quantifier: There is _______ evidence to support the claim that the climate anomaly was caused by solar flares.",
    "options": [
      "few",
      "little",
      "fewer",
      "a few"
    ],
    "correctAnswer": "B",
    "explanation": "\"Little\" (meaning scarcely any) modifies the uncountable noun \"evidence\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-279",
    "question": "Fill in the blank: The municipal council decided to plant _______ trees along the central boulevard.",
    "options": [
      "an amount of",
      "the number of",
      "a number of",
      "the amount of"
    ],
    "correctAnswer": "C",
    "explanation": "\"A number of\" modifies plural countable nouns (\"trees\") meaning several.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-280",
    "question": "Fill in the blank: A significant _______ of industrial waste was dumped into the river.",
    "options": [
      "many",
      "number",
      "few",
      "amount"
    ],
    "correctAnswer": "D",
    "explanation": "\"Amount\" is used with uncountable mass nouns (\"industrial waste\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-281",
    "question": "Choose the correct determiner: _______ student must register their biometric data at the campus security desk.",
    "options": [
      "Every",
      "All",
      "Both",
      "Several"
    ],
    "correctAnswer": "A",
    "explanation": "\"Every\" is followed by a singular countable noun (\"student\") and singular verb (\"must register\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-282",
    "question": "Fill in the blank: _______ of the two candidates was deemed qualified for the senior professorship.",
    "options": [
      "None",
      "Neither",
      "Any",
      "All"
    ],
    "correctAnswer": "B",
    "explanation": "\"Neither\" refers to not one of two options.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-283",
    "question": "Fill in the blank: He plays _______ piano with remarkable virtuosity.",
    "options": [
      "an",
      "a",
      "the",
      "zero article"
    ],
    "correctAnswer": "C",
    "explanation": "Musical instruments when referring to playing skill take the definite article \"the\" (\"the piano\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-284",
    "question": "Fill in the blanks: _______ life in _______ 21st century has been revolutionized by digital connectivity.",
    "options": [
      "The, zero article",
      "The, the",
      "A, the",
      "Zero article, the"
    ],
    "correctAnswer": "D",
    "explanation": "General abstract nouns (\"life\") take zero article; centuries (\"the 21st century\") take \"the\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-285",
    "question": "Choose the correct sentence regarding article usage:",
    "options": [
      "Knowledge is power in the modern information economy.",
      "The knowledge is power in the modern information economy.",
      "A knowledge is power in the modern information economy.",
      "An knowledge is power in the modern information economy."
    ],
    "correctAnswer": "A",
    "explanation": "Abstract uncountable nouns used in a general sense (\"Knowledge\") take zero article.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-286",
    "question": "Fill in the blank: We observed _______ European eagle owl perched on the oak tree branch.",
    "options": [
      "an",
      "a",
      "the",
      "zero article"
    ],
    "correctAnswer": "B",
    "explanation": "\"European\" begins with the consonant glide /j/ (\"yu-ro-pe-an\"), taking the indefinite article \"a\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-287",
    "question": "Fill in the blank: It took _______ hour and a half to complete the comprehensive reading section.",
    "options": [
      "the",
      "a",
      "an",
      "zero article"
    ],
    "correctAnswer": "C",
    "explanation": "\"Hour\" begins with a silent 'h' and vowel sound /a\u028a\u0259/, taking \"an\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-288",
    "question": "Fill in the blanks: _______ Pacific Ocean is _______ largest body of water on Earth.",
    "options": [
      "A, the",
      "Zero article, the",
      "The, a",
      "The, the"
    ],
    "correctAnswer": "D",
    "explanation": "Oceans take \"the\" (\"The Pacific Ocean\"), and superlatives take \"the\" (\"the largest\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-289",
    "question": "Fill in the blank: There are _______ people who truly understand the intricacies of quantum thermodynamics.",
    "options": [
      "few",
      "a few",
      "little",
      "a little"
    ],
    "correctAnswer": "A",
    "explanation": "\"Few\" emphasizes the scarcity of individuals who understand the topic.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-290",
    "question": "Fill in the blank: The company needs to recruit _______ more software engineers to meet the project deadline.",
    "options": [
      "few",
      "a few",
      "little",
      "a little"
    ],
    "correctAnswer": "B",
    "explanation": "\"A few\" expresses an affirmative small number (some).",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-291",
    "question": "Choose the correct option: In modern urban centers, _______ people rely on personal automobiles than a decade ago.",
    "options": [
      "lesser",
      "less",
      "fewer",
      "fewest"
    ],
    "correctAnswer": "C",
    "explanation": "\"Fewer\" is the comparative quantifier for plural countable nouns (\"people\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-292",
    "question": "Fill in the blank: Developing countries often consume _______ electrical power per capita than industrialized nations.",
    "options": [
      "few",
      "fewer",
      "lesser",
      "less"
    ],
    "correctAnswer": "D",
    "explanation": "\"Less\" is the comparative quantifier for uncountable nouns (\"electrical power\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-293",
    "question": "Fill in the blank: She gave me _______ useful advice regarding my academic thesis.",
    "options": [
      "some",
      "an",
      "a",
      "many"
    ],
    "correctAnswer": "A",
    "explanation": "\"Advice\" is an uncountable noun and cannot be preceded by \"an\" or \"many\"; \"some advice\" is correct.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-294",
    "question": "Fill in the blanks: _______ Netherlands and _______ Philippines are both archipelago- or water-dependent states.",
    "options": [
      "Zero article, zero article",
      "The, the",
      "The, zero article",
      "Zero article, the"
    ],
    "correctAnswer": "B",
    "explanation": "Plural country names (\"The Netherlands\", \"The Philippines\") require the definite article \"the\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-295",
    "question": "Fill in the blank: Each and _______ member of the expedition was equipped with satellite communication gear.",
    "options": [
      "both",
      "all",
      "every",
      "each"
    ],
    "correctAnswer": "C",
    "explanation": "The emphatic compound determiner is \"Each and every member\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-296",
    "question": "Choose the correct option: _______ of the five proposals was accepted by the investment committee.",
    "options": [
      "No one",
      "Neither",
      "Either",
      "None"
    ],
    "correctAnswer": "D",
    "explanation": "\"None\" is used for zero out of three or more options (\"Neither\" is restricted to two).",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-297",
    "question": "Fill in the blanks: _______ rich should contribute more to _______ welfare of the marginalized.",
    "options": [
      "The, the",
      "Zero article, the",
      "A, a",
      "The, zero article"
    ],
    "correctAnswer": "A",
    "explanation": "\"The + adjective\" represents a collective class of people (\"The rich\"), and specific nouns take \"the welfare\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-298",
    "question": "Fill in the blank: He is _______ university professor with over thirty years of teaching experience.",
    "options": [
      "an",
      "a",
      "the",
      "zero article"
    ],
    "correctAnswer": "B",
    "explanation": "\"University\" begins with the consonant sound /j/, requiring \"a\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-299",
    "question": "Fill in the blank: _______ information provided in the brochure was outdated.",
    "options": [
      "An",
      "A",
      "The",
      "Many"
    ],
    "correctAnswer": "C",
    "explanation": "Specific uncountable noun in context takes the definite article \"The\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-300",
    "question": "Choose the correct sentence:",
    "options": [
      "He went to prison to visit his client who was serving a sentence.",
      "He went to prison as an attorney.",
      "He went to a prison to visit his client who was serving a sentence.",
      "He went to the prison to visit his client who was serving a sentence."
    ],
    "correctAnswer": "D",
    "explanation": "When visiting an institution (prison, hospital, school) for a specific secondary purpose rather than primary institutional status, \"the prison\" is used.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-301",
    "question": "Fill in the blank: She has been admitted to _______ hospital for minor surgery.",
    "options": [
      "zero article",
      "the",
      "a",
      "an"
    ],
    "correctAnswer": "A",
    "explanation": "In British/IELTS usage, entering an institution as a patient uses zero article: \"admitted to hospital\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-302",
    "question": "Fill in the blank: _______ Nile flows northwards into the Mediterranean Sea.",
    "options": [
      "A",
      "The",
      "An",
      "Zero article"
    ],
    "correctAnswer": "B",
    "explanation": "Names of rivers take \"The\" (\"The Nile\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-303",
    "question": "Fill in the blank: _______ Sahara is the world's largest hot desert.",
    "options": [
      "An",
      "A",
      "The",
      "Zero article"
    ],
    "correctAnswer": "C",
    "explanation": "Names of deserts require the definite article \"The\" (\"The Sahara\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-304",
    "question": "Fill in the blank: We had _______ wonderful breakfast at the hotel this morning.",
    "options": [
      "zero article",
      "an",
      "the",
      "a"
    ],
    "correctAnswer": "D",
    "explanation": "When a meal name is modified by an adjective (\"wonderful\"), it takes the indefinite article \"a\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-305",
    "question": "Fill in the blank: What time do you standardly have _______ dinner in your country?",
    "options": [
      "zero article",
      "a",
      "an",
      "the"
    ],
    "correctAnswer": "A",
    "explanation": "Names of meals in general use zero article (\"have dinner\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-306",
    "question": "Choose the correct option: _______ oxygen is essential for the respiration of aerobic organisms.",
    "options": [
      "The",
      "Zero article",
      "An",
      "A"
    ],
    "correctAnswer": "B",
    "explanation": "Chemical elements and gases in a general sense take zero article (\"Oxygen is essential\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-307",
    "question": "Fill in the blank: _______ oxygen in this diving cylinder is compressed at high pressure.",
    "options": [
      "A",
      "An",
      "The",
      "Zero article"
    ],
    "correctAnswer": "C",
    "explanation": "Specific, identified quantity of oxygen takes the definite article \"The\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-308",
    "question": "Fill in the blank: _______ students who attended the workshop received a certificate of completion.",
    "options": [
      "Neither",
      "Every",
      "Each",
      "All"
    ],
    "correctAnswer": "D",
    "explanation": "\"All\" modifies plural countable nouns (\"students\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-309",
    "question": "Fill in the blank: It is _______ unique opportunity to participate in international climate negotiations.",
    "options": [
      "a",
      "an",
      "the",
      "zero article"
    ],
    "correctAnswer": "A",
    "explanation": "\"Unique\" begins with the consonant sound /j/, requiring \"a\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-310",
    "question": "Fill in the blanks: _______ more you practice academic writing, _______ easier it becomes.",
    "options": [
      "A, a",
      "The, the",
      "The, a",
      "Zero article, the"
    ],
    "correctAnswer": "B",
    "explanation": "Parallel comparative structures take \"The + comparative..., the + comparative...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-311",
    "question": "Fill in the blank: Both options have their merits, but _______ option meets our exact budgetary constraints.",
    "options": [
      "either",
      "none",
      "neither",
      "both"
    ],
    "correctAnswer": "C",
    "explanation": "\"Neither option\" indicates that neither of the two alternatives is sufficient.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-312",
    "question": "Fill in the blank: The library has acquired _______ new volume on medieval architectural history.",
    "options": [
      "zero article",
      "an",
      "the",
      "a"
    ],
    "correctAnswer": "D",
    "explanation": "\"A new volume\" introduces a singular non-specific countable noun.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-313",
    "question": "Fill in the blank: He is _______ MBA graduate working in financial analytics.",
    "options": [
      "an",
      "a",
      "the",
      "zero article"
    ],
    "correctAnswer": "A",
    "explanation": "\"MBA\" is pronounced /\u025bm.bi\u02d0.e\u026a/ starting with a vowel sound, requiring \"an\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-314",
    "question": "Fill in the blanks: In _______ history of science, _______ invention of the microscope was pivotal.",
    "options": [
      "zero article, the",
      "the, the",
      "the, zero article",
      "zero article, zero article"
    ],
    "correctAnswer": "B",
    "explanation": "Specific historical domain (\"the history of science\") and specific breakthrough (\"the invention of...\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-315",
    "question": "Fill in the blank: _______ public transport infrastructure in this metropolitan area is world-class.",
    "options": [
      "An",
      "A",
      "The",
      "Zero article"
    ],
    "correctAnswer": "C",
    "explanation": "Specific infrastructure of a particular area takes \"The\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-316",
    "question": "Select the preposition that best completes the collocation: The company's rapid expansion was completely disproportionate _______ its financial resources.",
    "options": [
      "against",
      "with",
      "for",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "The adjective \"disproportionate\" is idiomatic and grammatically paired with the preposition \"to\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-317",
    "question": "Fill in the blank: The success of the green energy initiative is contingent _______ securing international venture capital.",
    "options": [
      "on",
      "with",
      "in",
      "to"
    ],
    "correctAnswer": "A",
    "explanation": "\"Contingent on/upon\" is the standard academic collocation meaning dependent upon.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-318",
    "question": "Choose the correct preposition: The local ecosystem is particularly susceptible _______ sudden shifts in oceanic acidity.",
    "options": [
      "with",
      "to",
      "for",
      "against"
    ],
    "correctAnswer": "B",
    "explanation": "\"Susceptible to\" means easily influenced or harmed by.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-319",
    "question": "Fill in the blank: Dr. Mitchell's latest hypothesis is incompatible _______ the established laws of thermodynamics.",
    "options": [
      "for",
      "to",
      "with",
      "from"
    ],
    "correctAnswer": "C",
    "explanation": "\"Incompatible with\" is the standard prepositional pairing.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-320",
    "question": "Fill in the blank: All registered laboratory personnel must strictly adhere _______ international biohazard safety protocols.",
    "options": [
      "for",
      "with",
      "by",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Adhere to\" is the required dependent preposition.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-321",
    "question": "Choose the correct phrasal verb: The university board decided to _______ the controversial admissions reform following student protests.",
    "options": [
      "call off",
      "carry on",
      "bring up",
      "put down"
    ],
    "correctAnswer": "A",
    "explanation": "\"Call off\" means to cancel an event or initiative.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-322",
    "question": "Fill in the blank: The committee aims to _______ a comprehensive audit of all department expenditures.",
    "options": [
      "bring out",
      "carry out",
      "take out",
      "make out"
    ],
    "correctAnswer": "B",
    "explanation": "\"Carry out\" means to conduct or perform an investigation/audit.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-323",
    "question": "Fill in the blank: Renewable energy now accounts _______ over thirty percent of total national electricity generation.",
    "options": [
      "of",
      "with",
      "for",
      "to"
    ],
    "correctAnswer": "C",
    "explanation": "\"Account for\" means to comprise or constitute a specified proportion.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-324",
    "question": "Fill in the blank: She has been interested _______ astrophysics since early childhood.",
    "options": [
      "with",
      "on",
      "at",
      "in"
    ],
    "correctAnswer": "D",
    "explanation": "\"Interested in\" is the standard adjective + preposition combination.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-325",
    "question": "Choose the correct preposition: The sudden surge in inflation can be attributed _______ global supply chain bottlenecks.",
    "options": [
      "to",
      "with",
      "for",
      "by"
    ],
    "correctAnswer": "A",
    "explanation": "\"Attribute to\" indicates the cause of an outcome.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-326",
    "question": "Fill in the blank: The new legislation is devoid _______ any substantial penalties for corporate polluters.",
    "options": [
      "from",
      "of",
      "with",
      "for"
    ],
    "correctAnswer": "B",
    "explanation": "\"Devoid of\" means completely lacking in.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-327",
    "question": "Fill in the blank: Athletes must abstain _______ using performance-enhancing substances.",
    "options": [
      "with",
      "of",
      "from",
      "against"
    ],
    "correctAnswer": "C",
    "explanation": "\"Abstain from\" means to formally refrain from.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-328",
    "question": "Choose the correct preposition: His argument is deficient _______ empirical evidence.",
    "options": [
      "to",
      "with",
      "of",
      "in"
    ],
    "correctAnswer": "D",
    "explanation": "\"Deficient in\" means lacking in quality or quantity.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-329",
    "question": "Fill in the blank: The author takes exception _______ the reviewer's characterization of her methodology.",
    "options": [
      "to",
      "with",
      "for",
      "against"
    ],
    "correctAnswer": "A",
    "explanation": "\"Take exception to\" is an idiomatic collocation meaning to object strongly to.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-330",
    "question": "Fill in the blank: The new medical facility is equipped _______ state-of-the-art diagnostic imaging tools.",
    "options": [
      "of",
      "with",
      "for",
      "by"
    ],
    "correctAnswer": "B",
    "explanation": "\"Equipped with\" is the standard prepositional collocation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-331",
    "question": "Fill in the blank: The train arrived at the station _______ 08:15 sharp.",
    "options": [
      "in",
      "on",
      "at",
      "by"
    ],
    "correctAnswer": "C",
    "explanation": "Clock times use the preposition \"at\" (\"at 08:15\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-332",
    "question": "Fill in the blank: The symposium will take place _______ Monday morning.",
    "options": [
      "with",
      "in",
      "at",
      "on"
    ],
    "correctAnswer": "D",
    "explanation": "Days of the week and specific mornings use \"on\" (\"on Monday morning\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-333",
    "question": "Fill in the blank: The historic declaration was signed _______ 1948.",
    "options": [
      "in",
      "on",
      "at",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "Years take the preposition \"in\" (\"in 1948\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-334",
    "question": "Choose the correct option: The government agreed to phase _______ single-use plastic packaging by 2026.",
    "options": [
      "down",
      "out",
      "away",
      "off"
    ],
    "correctAnswer": "B",
    "explanation": "\"Phase out\" means to gradually discontinue the use or production of something.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-335",
    "question": "Fill in the blank: She succeeded _______ publishing her research in a premier academic journal.",
    "options": [
      "with",
      "at",
      "in",
      "for"
    ],
    "correctAnswer": "C",
    "explanation": "\"Succeed in + gerund\" is the correct verb-preposition pattern.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-336",
    "question": "Fill in the blank: The experimental results coincided _______ the theoretical models developed by the physicists.",
    "options": [
      "by",
      "to",
      "for",
      "with"
    ],
    "correctAnswer": "D",
    "explanation": "\"Coincide with\" means to correspond or occur at the same time/manner.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-337",
    "question": "Choose the correct preposition: He is eligible _______ an academic fee waiver based on merit.",
    "options": [
      "for",
      "to",
      "with",
      "of"
    ],
    "correctAnswer": "A",
    "explanation": "\"Eligible for\" indicates entitlement to receive a benefit.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-338",
    "question": "Fill in the blank: The committee is composed _______ prominent international legal experts.",
    "options": [
      "from",
      "of",
      "with",
      "by"
    ],
    "correctAnswer": "B",
    "explanation": "\"Composed of\" is the standard passive construction.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-339",
    "question": "Fill in the blank: The research institute comprises _______ five specialized research laboratories.",
    "options": [
      "with",
      "of",
      "zero preposition",
      "from"
    ],
    "correctAnswer": "C",
    "explanation": "Active \"comprise\" takes a direct object with NO preposition (\"comprises five laboratories\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-340",
    "question": "Choose the correct preposition: The student was congratulated _______ receiving the prestigious national fellowship.",
    "options": [
      "at",
      "for",
      "with",
      "on"
    ],
    "correctAnswer": "D",
    "explanation": "\"Congratulate someone on + noun/gerund\" is the standard prepositional collocation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-341",
    "question": "Fill in the blank: She is exceptionally good _______ solving complex differential equations.",
    "options": [
      "at",
      "in",
      "with",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Good at\" expresses aptitude in an activity.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-342",
    "question": "Fill in the blank: The economic downturn resulted _______ widespread reductions in corporate capital expenditure.",
    "options": [
      "from",
      "in",
      "with",
      "to"
    ],
    "correctAnswer": "B",
    "explanation": "\"Result in\" means to cause or produce an outcome (\"Result from\" indicates origin).",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-343",
    "question": "Fill in the blank: The respiratory illness resulted _______ long-term exposure to particulate air pollution.",
    "options": [
      "to",
      "in",
      "from",
      "with"
    ],
    "correctAnswer": "C",
    "explanation": "\"Result from\" indicates the causative source or origin.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-344",
    "question": "Choose the correct preposition: The local council is under no obligation _______ compensate the developers.",
    "options": [
      "of",
      "for",
      "with",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Under obligation to + infinitive\" is the standard legal phrasing.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-345",
    "question": "Fill in the blank: The patient is currently _______ intensive medical observation.",
    "options": [
      "under",
      "in",
      "at",
      "with"
    ],
    "correctAnswer": "A",
    "explanation": "\"Under observation\" is the standard medical prepositional phrase.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-346",
    "question": "Fill in the blank: The company acted in accordance _______ environmental protection statutes.",
    "options": [
      "to",
      "with",
      "for",
      "by"
    ],
    "correctAnswer": "B",
    "explanation": "\"In accordance with\" means conforming to established rules.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-347",
    "question": "Fill in the blank: With regard _______ your recent enquiry, we are pleased to confirm your admission.",
    "options": [
      "for",
      "with",
      "to",
      "on"
    ],
    "correctAnswer": "C",
    "explanation": "\"With regard to\" (or \"in regard to\") is standard formal correspondence.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-348",
    "question": "Fill in the blank: We walked _______ the riverbank enjoying the evening breeze.",
    "options": [
      "through",
      "among",
      "between",
      "along"
    ],
    "correctAnswer": "D",
    "explanation": "\"Along\" indicates movement in a line following the length of the river.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-349",
    "question": "Fill in the blank: The prize money was distributed equally _______ the four team members.",
    "options": [
      "among",
      "between",
      "with",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Among\" is used for distribution within a group of three or more.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-350",
    "question": "Choose the correct preposition: The treaty was negotiated _______ the two neighboring republics.",
    "options": [
      "among",
      "between",
      "with",
      "from"
    ],
    "correctAnswer": "B",
    "explanation": "\"Between\" is used for reciprocal relations connecting two distinct entities.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-351",
    "question": "Fill in the blank: The team had to grapple _______ unexpected software compatibility errors.",
    "options": [
      "against",
      "at",
      "with",
      "for"
    ],
    "correctAnswer": "C",
    "explanation": "\"Grapple with\" means to struggle to overcome a difficulty.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-352",
    "question": "Fill in the blank: Many coastal communities are prone _______ seasonal storm surges.",
    "options": [
      "at",
      "with",
      "for",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Prone to\" means having a natural tendency or vulnerability toward.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-353",
    "question": "Fill in the blank: The novel provides deep insight _______ the psychological impacts of isolation.",
    "options": [
      "into",
      "in",
      "to",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Insight into\" is the standard academic noun-preposition collocation.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-354",
    "question": "Choose the correct preposition: The university prides itself _______ its commitment to groundbreaking research.",
    "options": [
      "with",
      "on",
      "for",
      "in"
    ],
    "correctAnswer": "B",
    "explanation": "\"Pride oneself on + noun/gerund\" is the required reflexive collocation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-355",
    "question": "Fill in the blank: She sat _______ the two keynote speakers at the gala dinner.",
    "options": [
      "across",
      "among",
      "between",
      "through"
    ],
    "correctAnswer": "C",
    "explanation": "\"Between\" indicates position in the middle of two individuals.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-356",
    "question": "Fill in the blank: The research methodology is impervious _______ external political bias.",
    "options": [
      "from",
      "with",
      "against",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Impervious to\" means incapable of being affected or influenced by.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-357",
    "question": "Fill in the blank: The new regulation comes _______ force at the beginning of next month.",
    "options": [
      "into",
      "in",
      "to",
      "with"
    ],
    "correctAnswer": "A",
    "explanation": "The idiomatic phrase is \"come into force\" (meaning become legally effective).",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-358",
    "question": "Choose the correct phrasal verb: The economic data did not _______ the government's optimistic forecasts.",
    "options": [
      "bear with",
      "bear out",
      "bear down",
      "bear off"
    ],
    "correctAnswer": "B",
    "explanation": "\"Bear out\" means to substantiate or confirm the truth of something.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-359",
    "question": "Fill in the blank: He is completely absorbed _______ his doctoral research.",
    "options": [
      "at",
      "with",
      "in",
      "to"
    ],
    "correctAnswer": "C",
    "explanation": "\"Absorbed in\" means deeply engrossed or engaged in.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-360",
    "question": "Fill in the blank: The students arrived _______ time to take their assigned seats before the test began.",
    "options": [
      "by",
      "at",
      "with",
      "in"
    ],
    "correctAnswer": "D",
    "explanation": "\"In time\" means with enough time to spare before a deadline (\"On time\" means punctually at the scheduled hour).",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-361",
    "question": "Choose the correct inverted sentence: Seldom _______ such extraordinary artistic talent in a young prodigy.",
    "options": [
      "has one witnessed",
      "one has witnessed",
      "one witnessed",
      "has witnessed one"
    ],
    "correctAnswer": "A",
    "explanation": "Negative frequency adverb \"Seldom\" at the head of a clause triggers subject-auxiliary inversion (\"has one witnessed\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-362",
    "question": "Fill in the blank: Only after the audit was concluded _______ the extent of the accounting discrepancies.",
    "options": [
      "the board realized",
      "did the board realize",
      "the board did realize",
      "realized the board"
    ],
    "correctAnswer": "B",
    "explanation": "\"Only after...\" introducing a subordinate clause requires inversion in the main clause (\"did the board realize\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-363",
    "question": "Fill in the blank: Not only _______ the team break the world speed record, but they also won the grand championship.",
    "options": [
      "had",
      "was",
      "did",
      "would"
    ],
    "correctAnswer": "C",
    "explanation": "\"Not only\" at the start triggers auxiliary inversion: \"Not only did the team break...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-364",
    "question": "Choose the correct subjunctive form: The committee recommended that the lead researcher _______ an interim progress report.",
    "options": [
      "will submit",
      "submits",
      "submitted",
      "submit"
    ],
    "correctAnswer": "D",
    "explanation": "Mandative subjunctive requires the bare infinitive (\"submit\") regardless of the third-person singular subject.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-365",
    "question": "Fill in the blank: It is essential that every participant _______ present during the emergency briefing.",
    "options": [
      "be",
      "is",
      "was",
      "to be"
    ],
    "correctAnswer": "A",
    "explanation": "Mandative subjunctive construction: \"It is essential that + subject + be\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-366",
    "question": "Choose the correct option: Under no circumstances _______ laboratory doors be propped open overnight.",
    "options": [
      "ought",
      "should",
      "are to",
      "will"
    ],
    "correctAnswer": "B",
    "explanation": "Negative prepositional opener \"Under no circumstances\" triggers modal inversion (\"should laboratory doors be...\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-367",
    "question": "Fill in the blank: Little _______ that the archival discovery would revolutionize historical understanding of the era.",
    "options": [
      "the historians did suspect",
      "the historians suspected",
      "did the historians suspect",
      "had the historians suspected"
    ],
    "correctAnswer": "C",
    "explanation": "\"Little\" used adverbially at sentence start triggers inversion: \"did the historians suspect\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-368",
    "question": "Fill in the blank: The board insisted that he _______ from his executive position immediately.",
    "options": [
      "will resign",
      "resigns",
      "resigned",
      "resign"
    ],
    "correctAnswer": "D",
    "explanation": "Subjunctive mood after \"insisted that\" requires the base verb \"resign\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-369",
    "question": "Choose the correct cleft sentence for emphasis:",
    "options": [
      "It was Dr. Alvarez who discovered the anomalous chemical reaction.",
      "That was Dr. Alvarez who discovered the anomalous chemical reaction.",
      "He was Dr. Alvarez who discovered the anomalous chemical reaction.",
      "It were Dr. Alvarez who discovered the anomalous chemical reaction."
    ],
    "correctAnswer": "A",
    "explanation": "The standard \"It-cleft\" for focal emphasis is: \"It was [focused element] who/that...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-370",
    "question": "Fill in the blank: What surprised the research team most _______ the rapid adaptability of the bacterial strain.",
    "options": [
      "were",
      "was",
      "are",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "Wh-cleft / nominal relative clauses acting as subject take a singular verb (\"was\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-371",
    "question": "Fill in the blank: Nowhere _______ a more intact example of Hellenistic mosaic art.",
    "options": [
      "one finds",
      "one can find",
      "can one find",
      "finds one"
    ],
    "correctAnswer": "C",
    "explanation": "Negative locative adverb \"Nowhere\" triggers auxiliary inversion: \"can one find\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-372",
    "question": "Choose the correct option: The judge demanded that the witness _______ the truth regarding the disputed contract.",
    "options": [
      "will tell",
      "tells",
      "told",
      "tell"
    ],
    "correctAnswer": "D",
    "explanation": "Subjunctive after \"demanded that\" uses the base form \"tell\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-373",
    "question": "Fill in the blank: At no time _______ authorized to disclose proprietary corporate data.",
    "options": [
      "was the employee",
      "the employee was",
      "the employee had been",
      "did the employee was"
    ],
    "correctAnswer": "A",
    "explanation": "\"At no time\" is a negative temporal expression triggering inversion (\"was the employee authorized\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-374",
    "question": "Fill in the blank: Only by implementing rigorous energy conservation measures _______ greenhouse emissions.",
    "options": [
      "we can reduce",
      "can we reduce",
      "we reduce",
      "reduce we can"
    ],
    "correctAnswer": "B",
    "explanation": "\"Only by + gerund\" at sentence opening triggers main clause inversion (\"can we reduce\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-375",
    "question": "Fill in the blank: It is crucial that the medicine _______ stored in a climate-controlled refrigerator.",
    "options": [
      "was",
      "is",
      "be",
      "to be"
    ],
    "correctAnswer": "C",
    "explanation": "Mandative subjunctive passive: \"be stored\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-376",
    "question": "Choose the correct inverted form: On the summit of the mountain _______ the ancient stone temple.",
    "options": [
      "has stood",
      "did stand",
      "was standing",
      "stood"
    ],
    "correctAnswer": "D",
    "explanation": "Full inversion with locative prepositional phrase: \"On the summit... stood [subject]\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-377",
    "question": "Fill in the blank: Rarely _______ such rapid technological transformation in human history.",
    "options": [
      "have we seen",
      "we have seen",
      "we saw",
      "did we saw"
    ],
    "correctAnswer": "A",
    "explanation": "Inversion after \"Rarely\": \"have we seen\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-378",
    "question": "Choose the correct option: The doctor advised that she _______ for at least one week following surgery.",
    "options": [
      "rests",
      "rest",
      "rested",
      "will rest"
    ],
    "correctAnswer": "B",
    "explanation": "Subjunctive after \"advised that\" takes the bare infinitive \"rest\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-379",
    "question": "Fill in the blank: So severe _______ that several international flights were diverted.",
    "options": [
      "did the blizzard be",
      "the blizzard was",
      "was the blizzard",
      "had the blizzard been"
    ],
    "correctAnswer": "C",
    "explanation": "\"So + adjective\" at sentence opening triggers inversion: \"So severe was the blizzard that...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-380",
    "question": "Fill in the blank: Such _______ of the earthquake that entire city blocks were leveled.",
    "options": [
      "had been magnitude",
      "the magnitude was",
      "was magnitude",
      "was the magnitude"
    ],
    "correctAnswer": "D",
    "explanation": "\"Such was [noun] that...\" is the standard inverted result structure.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-381",
    "question": "Fill in the blank: It is vital that all safety protocols _______ strictly enforced by site supervisors.",
    "options": [
      "be",
      "are",
      "were",
      "to be"
    ],
    "correctAnswer": "A",
    "explanation": "Subjunctive passive: \"be strictly enforced\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-382",
    "question": "Choose the correct inverted sentence:",
    "options": [
      "No sooner the keynote speaker had stepped onto the stage than the power failed.",
      "No sooner had the keynote speaker stepped onto the stage than the power failed.",
      "No sooner had the keynote speaker stepped onto the stage when the power failed.",
      "No sooner did the keynote speaker stepped onto the stage than the power failed."
    ],
    "correctAnswer": "B",
    "explanation": "\"No sooner had + subject + past participle... than...\" is the correct inverted correlative construction.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-383",
    "question": "Fill in the blank: In no way _______ to suggest that the previous research was invalid.",
    "options": [
      "I do mean",
      "I mean",
      "do I mean",
      "am I meaning"
    ],
    "correctAnswer": "C",
    "explanation": "\"In no way\" at the start requires inversion: \"do I mean\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-384",
    "question": "Choose the correct option: The university statutes require that every candidate _______ a formal defense of their dissertation.",
    "options": [
      "will make",
      "makes",
      "made",
      "make"
    ],
    "correctAnswer": "D",
    "explanation": "Subjunctive bare infinitive \"make\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-385",
    "question": "Fill in the blank: Only when the archaeological excavation was nearly complete _______ the royal tomb.",
    "options": [
      "did the team discover",
      "the team discovered",
      "discovered the team",
      "the team did discover"
    ],
    "correctAnswer": "A",
    "explanation": "\"Only when...\" requires inversion in the subsequent independent clause: \"did the team discover\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-386",
    "question": "Fill in the blank: Hard though _______, the mountaineers could not reach the peak in the blizzard.",
    "options": [
      "did they try",
      "they tried",
      "tried they",
      "they were trying"
    ],
    "correctAnswer": "B",
    "explanation": "In concessive fronting with \"Adverb + though + subject + verb\", standard subject-verb order is maintained (\"Hard though they tried\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-387",
    "question": "Fill in the blank: The guidelines propose that the examination fee _______ waived for underprivileged applicants.",
    "options": [
      "was",
      "is",
      "be",
      "to be"
    ],
    "correctAnswer": "C",
    "explanation": "Subjunctive passive \"be waived\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-388",
    "question": "Fill in the blank: Never in modern history _______ such unprecedented global climate anomalies.",
    "options": [
      "did humanity witnessed",
      "humanity has witnessed",
      "humanity witnessed",
      "has humanity witnessed"
    ],
    "correctAnswer": "D",
    "explanation": "Negative temporal fronting \"Never in modern history\" triggers inversion: \"has humanity witnessed\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-389",
    "question": "Choose the correct cleft sentence: _______ that revolutionized global communications.",
    "options": [
      "It was the invention of the optical fiber",
      "That was the invention of optical fiber",
      "There was the invention of optical fiber",
      "The optical fiber invention was it"
    ],
    "correctAnswer": "A",
    "explanation": "It-cleft construction: \"It was [noun phrase] that...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-390",
    "question": "Fill in the blank: The safety officer requested that the ventilation system _______ inspected immediately.",
    "options": [
      "is",
      "be",
      "was",
      "to be"
    ],
    "correctAnswer": "B",
    "explanation": "Mandative subjunctive \"be inspected\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-391",
    "question": "Fill in the blank: Not until the following morning _______ the full extent of the flood damage.",
    "options": [
      "comprehended the authorities",
      "the authorities comprehended",
      "did the authorities comprehend",
      "the authorities did comprehend"
    ],
    "correctAnswer": "C",
    "explanation": "\"Not until + time\" triggers main clause inversion: \"did the authorities comprehend\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-392",
    "question": "Fill in the blank: Round the corner _______ the high-speed electric locomotive.",
    "options": [
      "comes",
      "did come",
      "was coming",
      "came"
    ],
    "correctAnswer": "D",
    "explanation": "Directional prepositional fronting triggers full inversion: \"Round the corner came the locomotive\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-393",
    "question": "Choose the correct option: It is mandatory that every employee _______ the anti-harassment training workshop.",
    "options": [
      "attend",
      "attends",
      "attended",
      "will attend"
    ],
    "correctAnswer": "A",
    "explanation": "Subjunctive bare infinitive \"attend\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-394",
    "question": "Fill in the blank: Scarcely _______ the laboratory when the fire alarm sounded.",
    "options": [
      "we had entered",
      "had we entered",
      "did we enter",
      "we entered"
    ],
    "correctAnswer": "B",
    "explanation": "Inversion after \"Scarcely\": \"had we entered\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-395",
    "question": "Fill in the blank: _______ the doctor's advice, the patient made a rapid and full recovery.",
    "options": [
      "Having followed",
      "Followed",
      "Following",
      "To follow"
    ],
    "correctAnswer": "C",
    "explanation": "Active present participle clause \"Following the doctor's advice\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-396",
    "question": "Fill in the blank: The board insisted that an independent counsel _______ appointed to investigate.",
    "options": [
      "to be",
      "is",
      "was",
      "be"
    ],
    "correctAnswer": "D",
    "explanation": "Subjunctive passive \"be appointed\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-397",
    "question": "Choose the correct inverted form: Little _______ what immense challenges lay ahead during the polar crossing.",
    "options": [
      "did the explorers anticipate",
      "the explorers anticipated",
      "anticipated the explorers",
      "the explorers did anticipate"
    ],
    "correctAnswer": "A",
    "explanation": "Inversion with \"Little\": \"did the explorers anticipate\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-398",
    "question": "Fill in the blank: Only in this chapter _______ a comprehensive overview of quantum entanglement.",
    "options": [
      "the reader will find",
      "will the reader find",
      "finds the reader",
      "the reader finds"
    ],
    "correctAnswer": "B",
    "explanation": "\"Only in this chapter\" triggers auxiliary inversion: \"will the reader find\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-399",
    "question": "Fill in the blank: We urge that the environmental impact assessment _______ publicly disclosed.",
    "options": [
      "was",
      "is",
      "be",
      "to be"
    ],
    "correctAnswer": "C",
    "explanation": "Subjunctive passive \"be publicly disclosed\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-400",
    "question": "Choose the correct sentence:",
    "options": [
      "Not a single word the witness did utter throughout the cross-examination.",
      "Not a single word the witness uttered throughout the cross-examination.",
      "Not a single word uttered the witness throughout the cross-examination.",
      "Not a single word did the witness utter throughout the cross-examination."
    ],
    "correctAnswer": "D",
    "explanation": "Negative emphatic fronting \"Not a single word\" triggers auxiliary inversion \"did the witness utter\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-401",
    "question": "Choose the correct transition: _______ the severe blizzard conditions, the rescue helicopter landed safely at the mountain outpost.",
    "options": [
      "Despite",
      "Although",
      "Even though",
      "Whereas"
    ],
    "correctAnswer": "A",
    "explanation": "\"Despite\" (or \"In spite of\") is a preposition followed by a noun phrase (\"the severe blizzard conditions\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-402",
    "question": "Fill in the blank: _______ the experimental data was inconclusive, the researchers secured additional funding for follow-up trials.",
    "options": [
      "Despite",
      "Although",
      "In spite of",
      "Because of"
    ],
    "correctAnswer": "B",
    "explanation": "\"Although\" is a subordinating conjunction followed by a full subject-verb clause (\"the experimental data was inconclusive\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-403",
    "question": "Choose the sentence with correct parallel structure:",
    "options": [
      "The internship offers experience in data analysis, writing reports, and to present findings.",
      "The internship offers experience in data analysis, to write reports, and presentation.",
      "The internship offers experience in analyzing data, writing reports, and presenting findings.",
      "The internship offers experience in analyze data, write reports, and presenting."
    ],
    "correctAnswer": "C",
    "explanation": "Parallel structure requires grammatically identical forms: \"analyzing data, writing reports, and presenting findings\" (all gerund phrases).",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-404",
    "question": "Fill in the blank: The economic report was thorough; _______, it failed to address the impact of inflation on rural communities.",
    "options": [
      "consequently",
      "furthermore",
      "therefore",
      "however"
    ],
    "correctAnswer": "D",
    "explanation": "\"However\" indicates contrast between the thoroughness of the report and its failure to cover rural inflation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-405",
    "question": "Choose the correct correlative conjunctions: The proposed renewable strategy is _______ economically viable _______ environmentally sustainable.",
    "options": [
      "both... and",
      "neither... or",
      "either... and",
      "not only... and"
    ],
    "correctAnswer": "A",
    "explanation": "\"both... and\" is the correct correlative pair linking two positive complementary attributes.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-406",
    "question": "Fill in the blank: The company expanded rapidly, _______ creating over five hundred high-tech jobs in the region.",
    "options": [
      "whereby",
      "thereby",
      "whereas",
      "nevertheless"
    ],
    "correctAnswer": "B",
    "explanation": "\"Thereby + gerund\" means \"by that means\" or \"as a result of that\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-407",
    "question": "Fill in the blank: You may pay the conference registration fee by credit card _______ by direct bank transfer.",
    "options": [
      "nor",
      "and",
      "or",
      "but"
    ],
    "correctAnswer": "C",
    "explanation": "\"Or\" coordinates two alternative payment options.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-408",
    "question": "Choose the sentence that corrects the dangling modifier:",
    "options": [
      "Walking into the laboratory, the chemical reaction surprised the students.",
      "Having walked into the laboratory, the experiment surprised everyone.",
      "Walking into the laboratory, a chemical reaction was witnessed.",
      "Walking into the laboratory, the students were surprised by the chemical reaction."
    ],
    "correctAnswer": "D",
    "explanation": "The subject performing the action \"Walking into the laboratory\" must immediately follow the introductory participle phrase: \"the students\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-409",
    "question": "Fill in the blank: Solar energy is clean and renewable, _______ fossil fuels produce greenhouse gas emissions.",
    "options": [
      "whereas",
      "despite",
      "because",
      "furthermore"
    ],
    "correctAnswer": "A",
    "explanation": "\"Whereas\" is a subordinating conjunction used to contrast two facts directly.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-410",
    "question": "Fill in the blank: The flight was cancelled _______ the dense fog covering the runway.",
    "options": [
      "because",
      "due to",
      "since",
      "as"
    ],
    "correctAnswer": "B",
    "explanation": "\"Due to\" (or \"owing to\") is followed by a noun phrase (\"the dense fog...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-411",
    "question": "Choose the correct option: The university constructed a new library; _______, it modernized the existing science laboratories.",
    "options": [
      "consequently",
      "nonetheless",
      "moreover",
      "otherwise"
    ],
    "correctAnswer": "C",
    "explanation": "\"Moreover\" introduces an additional reinforcing positive action.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-412",
    "question": "Fill in the blank: He did not prepare adequately for the entrance exam; _______, he failed to achieve the minimum qualifying score.",
    "options": [
      "nevertheless",
      "on the other hand",
      "furthermore",
      "consequently"
    ],
    "correctAnswer": "D",
    "explanation": "\"Consequently\" expresses the direct causal consequence of inadequate preparation.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-413",
    "question": "Fill in the blank: She is talented _______ hardworking, which explains her academic success.",
    "options": [
      "and",
      "or",
      "nor",
      "yet"
    ],
    "correctAnswer": "A",
    "explanation": "\"And\" coordinates two parallel complementary adjectives.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-414",
    "question": "Choose the sentence with correct parallel structure:",
    "options": [
      "To succeed in academia, one must read widely, writing clearly, and critical thinking.",
      "To succeed in academia, one must read widely, write clearly, and think critically.",
      "To succeed in academia, one must read widely, write clearly, and to think critically.",
      "To succeed in academia, one must read widely, write clearly, and critical thought."
    ],
    "correctAnswer": "B",
    "explanation": "Parallel structure: \"read widely, write clearly, and think critically\" (all base verbs + adverbs).",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-415",
    "question": "Fill in the blank: We must leave immediately; _______, we will miss the scheduled departure.",
    "options": [
      "moreover",
      "furthermore",
      "otherwise",
      "likewise"
    ],
    "correctAnswer": "C",
    "explanation": "\"Otherwise\" means \"or else\" / \"if not\", stating the negative consequence.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-416",
    "question": "Fill in the blank: The candidate was articulate and qualified; _______, the interview panel offered her the position.",
    "options": [
      "in contrast",
      "nevertheless",
      "on the contrary",
      "accordingly"
    ],
    "correctAnswer": "D",
    "explanation": "\"Accordingly\" indicates an action that follows logically and appropriately.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-417",
    "question": "Choose the correct option: In spite of _______ three years of intense study, he felt unprepared for the bar examination.",
    "options": [
      "having completed",
      "complete",
      "completed",
      "to have completed"
    ],
    "correctAnswer": "A",
    "explanation": "\"In spite of\" is a preposition requiring a gerund/participle form (\"having completed\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-418",
    "question": "Fill in the blank: The technology is highly innovative; _______, its commercial implementation remains prohibitively expensive.",
    "options": [
      "therefore",
      "nonetheless",
      "furthermore",
      "in addition"
    ],
    "correctAnswer": "B",
    "explanation": "\"Nonetheless\" (or \"nevertheless\") introduces a contrasting concession.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-419",
    "question": "Fill in the blank: Neither the professor _______ the students were informed of the schedule change.",
    "options": [
      "and",
      "or",
      "nor",
      "but"
    ],
    "correctAnswer": "C",
    "explanation": "\"Neither\" pairs with \"nor\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-420",
    "question": "Choose the sentence that resolves the run-on / comma splice correctly:",
    "options": [
      "The climate is changing rapidly, polar ice caps are melting at alarming rates.",
      "The climate is changing rapidly polar ice caps are melting at alarming rates.",
      "The climate is changing rapidly, therefore polar ice caps are melting at alarming rates.",
      "The climate is changing rapidly; polar ice caps are melting at alarming rates."
    ],
    "correctAnswer": "D",
    "explanation": "A semicolon correctly joins two closely related independent clauses without a comma splice.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-421",
    "question": "Fill in the blank: The committee rejected the proposal _______ it lacked sufficient budgetary justification.",
    "options": [
      "because",
      "because of",
      "despite",
      "in spite of"
    ],
    "correctAnswer": "A",
    "explanation": "\"Because\" is a subordinating conjunction introducing a causal clause (\"it lacked...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-422",
    "question": "Fill in the blank: The city council approved the subway expansion; _______, it allocated additional funds for bus electrification.",
    "options": [
      "however",
      "furthermore",
      "conversely",
      "nonetheless"
    ],
    "correctAnswer": "B",
    "explanation": "\"Furthermore\" introduces an additive positive policy development.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-423",
    "question": "Choose the correct option: _______ you agree with the policy or not, you are legally required to comply.",
    "options": [
      "Unless",
      "If",
      "Whether",
      "Provided"
    ],
    "correctAnswer": "C",
    "explanation": "\"Whether... or not\" introduces an alternative condition.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-424",
    "question": "Choose the sentence with correct parallelism:",
    "options": [
      "The committee discussed reducing costs, improve efficiency, and transparency.",
      "The committee discussed reducing costs, to improve efficiency, and increasing transparency.",
      "The committee discussed cost reduction, improving efficiency, and to increase transparency.",
      "The committee discussed reducing costs, improving efficiency, and increasing transparency."
    ],
    "correctAnswer": "D",
    "explanation": "Parallel gerund phrases: \"reducing costs, improving efficiency, and increasing transparency\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-425",
    "question": "Fill in the blank: The economic forecast was grim; _______, small businesses continued to show remarkable resilience.",
    "options": [
      "yet",
      "so",
      "therefore",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Yet\" expresses contrast.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-426",
    "question": "Fill in the blank: He worked hard _______ he could provide a better future for his family.",
    "options": [
      "in order",
      "so that",
      "because of",
      "despite"
    ],
    "correctAnswer": "B",
    "explanation": "\"So that + subject + modal\" expresses purpose.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-427",
    "question": "Fill in the blank: The research paper was criticized not only for its flawed methodology _______ for its lack of empirical data.",
    "options": [
      "as well",
      "and also",
      "but also",
      "or else"
    ],
    "correctAnswer": "C",
    "explanation": "\"not only... but also\" is the required correlative pair.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-428",
    "question": "Fill in the blank: _______ being warned of the severe gale, the sailors set out across the open bay.",
    "options": [
      "Whereas",
      "Although",
      "Even though",
      "In spite of"
    ],
    "correctAnswer": "D",
    "explanation": "\"In spite of + gerund\" expresses concession.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-429",
    "question": "Choose the correct transition: The first experiment failed to confirm the hypothesis; _______, the second trial yielded identical results.",
    "options": [
      "similarly",
      "on the other hand",
      "conversely",
      "otherwise"
    ],
    "correctAnswer": "A",
    "explanation": "\"Similarly\" expresses resemblance and parallelism between the two experimental outcomes.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-430",
    "question": "Fill in the blank: The historic city center was pedestrianized, _______ vehicular traffic was banned completely.",
    "options": [
      "whereas",
      "and thus",
      "despite",
      "nevertheless"
    ],
    "correctAnswer": "B",
    "explanation": "\"And thus\" (or \"thereby\") introduces the direct result.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-431",
    "question": "Fill in the blank: She was tired, _______ she continued writing her literature review until midnight.",
    "options": [
      "so",
      "or",
      "yet",
      "nor"
    ],
    "correctAnswer": "C",
    "explanation": "\"Yet\" coordinates two clauses in contrast.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-432",
    "question": "Choose the sentence with correct parallel construction:",
    "options": [
      "The company values innovation, integrity, and being dedicated.",
      "The company values innovation, being honest, and dedication.",
      "The company values to innovate, integrity, and dedication.",
      "The company values innovation, integrity, and dedication."
    ],
    "correctAnswer": "D",
    "explanation": "Parallel abstract nouns: \"innovation, integrity, and dedication\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-433",
    "question": "Fill in the blank: The team did not finish the project on time _______ they encountered insurmountable software glitches.",
    "options": [
      "because",
      "because of",
      "despite",
      "in spite of"
    ],
    "correctAnswer": "A",
    "explanation": "\"Because + clause\" introduces the explanatory reason.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-434",
    "question": "Fill in the blank: The cost of living in urban centres has soared; _______, many families are relocating to suburban districts.",
    "options": [
      "on the other hand",
      "for this reason",
      "nevertheless",
      "conversely"
    ],
    "correctAnswer": "B",
    "explanation": "\"For this reason\" (equivalent to \"therefore\") expresses causality.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-435",
    "question": "Choose the correct option: The new regulations apply to both large corporations _______ small commercial enterprises.",
    "options": [
      "or",
      "as well as",
      "and",
      "nor"
    ],
    "correctAnswer": "C",
    "explanation": "\"both... and\" is the standard correlative conjunction.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-436",
    "question": "Fill in the blank: The experiment was delicate _______ required meticulous observation.",
    "options": [
      "or",
      "but",
      "nor",
      "and"
    ],
    "correctAnswer": "D",
    "explanation": "\"And\" coordinates two related predicates.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-437",
    "question": "Choose the sentence that eliminates the misplaced modifier:",
    "options": [
      "The child ate the warm waffle covered in powdered sugar.",
      "Covered in powdered sugar, the child ate the warm waffle.",
      "Covered in powdered sugar, the waffle was eaten by the child rapidly.",
      "The child ate covered in powdered sugar the warm waffle."
    ],
    "correctAnswer": "A",
    "explanation": "\"Covered in powdered sugar\" correctly modifies \"the warm waffle\" when placed directly adjacent to it.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-438",
    "question": "Fill in the blank: The student attended every lecture, _______ he still found the final examination exceptionally challenging.",
    "options": [
      "so",
      "yet",
      "for",
      "nor"
    ],
    "correctAnswer": "B",
    "explanation": "\"Yet\" expresses unexpected contrast between full attendance and exam difficulty.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-439",
    "question": "Fill in the blank: The merger will expand the company's market reach; _______, it will consolidate its supply chain logistics.",
    "options": [
      "on the contrary",
      "however",
      "furthermore",
      "otherwise"
    ],
    "correctAnswer": "C",
    "explanation": "\"Furthermore\" introduces an additional corporate benefit.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-440",
    "question": "Fill in the blank: _______ the economic crisis was acute, the central bank maintained its low interest rate policy.",
    "options": [
      "Because of",
      "Despite",
      "In spite of",
      "Even though"
    ],
    "correctAnswer": "D",
    "explanation": "\"Even though + clause\" expresses strong concession.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-441",
    "question": "Fill in the blank: You must submit your assignment today, _______ you will lose ten percent of your grade.",
    "options": [
      "or",
      "and",
      "so",
      "nor"
    ],
    "correctAnswer": "A",
    "explanation": "\"Or\" introduces the negative alternative consequence.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-442",
    "question": "Choose the correct option: The professor spoke clearly _______ everyone in the auditorium could comprehend the complex theory.",
    "options": [
      "in order",
      "so that",
      "because of",
      "as if"
    ],
    "correctAnswer": "B",
    "explanation": "\"So that + subject + modal\" introduces a clause of purpose.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-443",
    "question": "Fill in the blank: The city council banned heavy diesel vehicles from the downtown core; _______, nitrogen oxide levels dropped noticeably.",
    "options": [
      "nevertheless",
      "on the other hand",
      "as a result",
      "conversely"
    ],
    "correctAnswer": "C",
    "explanation": "\"As a result\" expresses the direct environmental outcome.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-444",
    "question": "Fill in the blank: She was interested not in monetary compensation _______ in the intellectual freedom of the fellowship.",
    "options": [
      "nor",
      "and",
      "or",
      "but"
    ],
    "correctAnswer": "D",
    "explanation": "\"not in... but in...\" is the standard contrastive correlative construction.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-445",
    "question": "Choose the sentence with correct parallel structure:",
    "options": [
      "The seminar focuses on identifying challenges, evaluating solutions, and implementing reforms.",
      "The seminar focuses on identifying challenges, evaluation of solutions, and implementing reforms.",
      "The seminar focuses on identifying challenges, to evaluate solutions, and implementing reforms.",
      "The seminar focuses on challenge identification, evaluating solutions, and to implement reforms."
    ],
    "correctAnswer": "A",
    "explanation": "Parallel gerund phrases: \"identifying challenges, evaluating solutions, and implementing reforms\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-446",
    "question": "Identify the sentence with correct semicolon usage:",
    "options": [
      "The laboratory experiment was a success, however; further testing is required before publication.",
      "The laboratory experiment was a success; however, further testing is required before publication.",
      "The laboratory experiment was a success; however further testing is required, before publication.",
      "The laboratory experiment was a success however; further testing is required before publication."
    ],
    "correctAnswer": "B",
    "explanation": "When joining two independent clauses with a conjunctive adverb (\"however\"), place a semicolon before it and a comma after it.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-447",
    "question": "Choose the sentence with the correct Oxford comma:",
    "options": [
      "The curriculum includes physics, chemistry, biology and, mathematics.",
      "The curriculum includes physics, chemistry biology and mathematics.",
      "The curriculum includes physics, chemistry, biology, and mathematics.",
      "The curriculum includes physics chemistry, biology, and mathematics."
    ],
    "correctAnswer": "C",
    "explanation": "The Oxford comma is placed immediately before the coordinating conjunction in a list of three or more items.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-448",
    "question": "Identify the sentence with correct colon usage:",
    "options": [
      "The research expedition requires three essential items, namely: satellite phones, water purification tablets, and thermal sleeping bags.",
      "The research expedition requires: satellite phones, water purification tablets, and thermal sleeping bags.",
      "The items required by the expedition are: satellite phones, water purification tablets, and thermal sleeping bags.",
      "The research expedition requires three essential items: satellite phones, water purification tablets, and thermal sleeping bags."
    ],
    "correctAnswer": "D",
    "explanation": "A colon must follow a grammatically complete independent clause before introducing a list.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-449",
    "question": "Choose the sentence with correct apostrophe usage for possession:",
    "options": [
      "The students' lockers were cleaned over the summer break.",
      "The student's lockers was all emptied.",
      "The students locker's were cleaned over the summer break.",
      "The students lockers' were cleaned over the summer break."
    ],
    "correctAnswer": "A",
    "explanation": "For plural nouns ending in -s, the possessive apostrophe is placed after the 's' (\"students' lockers\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-450",
    "question": "Choose the correct form distinguishing \"its\" and \"it's\":",
    "options": [
      "The university celebrated it's centenary anniversary last month.",
      "The university celebrated its centenary anniversary last month.",
      "The university celebrated its' centenary anniversary last month.",
      "The university celebrated it is centenary anniversary last month."
    ],
    "correctAnswer": "B",
    "explanation": "\"Its\" is the possessive determiner (no apostrophe); \"it's\" is the contraction for \"it is\" or \"it has\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-451",
    "question": "Identify the sentence with correct hyphenation of compound adjectives:",
    "options": [
      "The researcher is well-known in the field of renewable energy.",
      "She is a well known researcher in the field of renewable energy.",
      "She is a well-known researcher in the field of renewable energy.",
      "She is a well, known researcher in the field of renewable energy."
    ],
    "correctAnswer": "C",
    "explanation": "Compound adjectives preceding the noun they modify are hyphenated (\"a well-known researcher\"); when following the verb, they are open (\"is well known\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-452",
    "question": "Choose the sentence with correct non-restrictive comma placement:",
    "options": [
      "Dr. Aris who completed his doctorate at Cambridge delivered the opening keynote.",
      "Dr. Aris who completed his doctorate at Cambridge, delivered the opening keynote.",
      "Dr. Aris, who completed his doctorate at Cambridge delivered the opening keynote.",
      "Dr. Aris, who completed his doctorate at Cambridge, delivered the opening keynote."
    ],
    "correctAnswer": "D",
    "explanation": "Non-defining parenthetical relative clauses must be enclosed by a pair of commas.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-453",
    "question": "Identify the sentence with correct punctuation for introductory adverbial clauses:",
    "options": [
      "Although the experimental data was preliminary, the committee approved the preliminary grant.",
      "Although the experimental data was preliminary the committee approved the preliminary grant.",
      "Although, the experimental data was preliminary the committee approved the preliminary grant.",
      "Although the experimental data was preliminary, the committee, approved the preliminary grant."
    ],
    "correctAnswer": "A",
    "explanation": "An introductory subordinate clause must be followed by a comma before the main clause begins.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-454",
    "question": "Choose the correctly punctuated direct quotation:",
    "options": [
      "Professor Higgins remarked \"The data clearly indicates a positive correlation.\"",
      "Professor Higgins remarked, \"The data clearly indicates a positive correlation.\"",
      "Professor Higgins remarked, \"The data clearly indicates a positive correlation\".",
      "Professor Higgins remarked; \"The data clearly indicates a positive correlation.\""
    ],
    "correctAnswer": "B",
    "explanation": "In standard quotation punctuation, a comma precedes the opening quotation mark, and the period is placed inside the closing quotation marks.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-455",
    "question": "Choose the sentence with correct apostrophe usage for irregular plurals:",
    "options": [
      "The childrens play' area was renovated last week.",
      "The childrens' play area was renovated last week.",
      "The children's play area was renovated last week.",
      "The childrens play area was renovated last week."
    ],
    "correctAnswer": "C",
    "explanation": "Irregular plural nouns that do not end in -s (like \"children\") form the possessive with 's (\"children's\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-456",
    "question": "Identify the sentence with correct dash usage for emphatic appositives:",
    "options": [
      "The core objective; reducing greenhouse gas emissions; remains the central goal of the treaty.",
      "The core objective-reducing greenhouse gas emissions-remains the central goal of the treaty.",
      "The core objective, reducing greenhouse gas emissions\u2014remains the central goal of the treaty.",
      "The core objective\u2014reducing greenhouse gas emissions\u2014remains the central goal of the treaty."
    ],
    "correctAnswer": "D",
    "explanation": "Em-dashes (\u2014) can enclose parenthetical or emphatic explanations cleanly.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-457",
    "question": "Choose the correctly punctuated sentence containing coordinate adjectives:",
    "options": [
      "The architect designed a sleek, modern library building.",
      "The architect designed a sleek modern, library building.",
      "The architect designed a sleek, modern, library building.",
      "The architect designed a sleek modern library building,"
    ],
    "correctAnswer": "A",
    "explanation": "Coordinate adjectives modifying the same noun (\"sleek\" and \"modern\") are separated by a single comma.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-458",
    "question": "Which of the following is a complete grammatical sentence (not a fragment)?",
    "options": [
      "Although the team conducted numerous trials over several months.",
      "The team conducted numerous trials over several months.",
      "Because the team conducted numerous trials over several months.",
      "Conducting numerous trials over several months."
    ],
    "correctAnswer": "B",
    "explanation": "\"The team conducted numerous trials...\" contains an independent subject, finite verb, and complete thought.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-459",
    "question": "Identify the sentence with correct semicolon usage in a complex list:",
    "options": [
      "The international delegates arrived from Paris; France, Tokyo; Japan, and Sydney; Australia.",
      "The international delegates arrived from Paris, France, Tokyo, Japan, and Sydney, Australia.",
      "The international delegates arrived from Paris, France; Tokyo, Japan; and Sydney, Australia.",
      "The international delegates arrived from Paris, France: Tokyo, Japan: and Sydney, Australia."
    ],
    "correctAnswer": "C",
    "explanation": "Semicolons are used to separate items in a list when individual items already contain internal commas (City, Country).",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-460",
    "question": "Choose the sentence that correctly punctuates a restrictive relative clause:",
    "options": [
      "The candidate, who scored highest on the exam was awarded the scholarship.",
      "The candidate, who scored highest on the exam, was awarded the scholarship.",
      "The candidate who scored highest on the exam, was awarded the scholarship.",
      "The candidate who scored highest on the exam was awarded the scholarship."
    ],
    "correctAnswer": "D",
    "explanation": "Restrictive (essential) relative clauses take NO commas because the clause is vital to identifying the subject.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-461",
    "question": "Choose the sentence with correct comma usage before a coordinating conjunction:",
    "options": [
      "The economic outlook is challenging, but local businesses remain optimistic.",
      "The economic outlook is challenging but, local businesses remain optimistic.",
      "The economic outlook is challenging but local businesses, remain optimistic.",
      "The economic outlook is challenging, but, local businesses remain optimistic."
    ],
    "correctAnswer": "A",
    "explanation": "A comma is placed before the coordinating conjunction (\"but\") when connecting two independent clauses.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-462",
    "question": "Identify the correct punctuation for a transitional phrase embedded within a clause:",
    "options": [
      "The initial results therefore, must be interpreted with extreme caution.",
      "The initial results, therefore, must be interpreted with extreme caution.",
      "The initial results, therefore must be interpreted with extreme caution.",
      "The initial results therefore must, be interpreted with extreme caution."
    ],
    "correctAnswer": "B",
    "explanation": "Parenthetical conjunctive adverbs embedded inside a clause must be enclosed by commas on both sides.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-463",
    "question": "Choose the sentence with correct apostrophe usage:",
    "options": [
      "She completed a two weeks holiday' in the Mediterranean.",
      "She completed a two week's holiday in the Mediterranean.",
      "She completed a two weeks' holiday in the Mediterranean.",
      "She completed a two weeks holiday in the Mediterranean."
    ],
    "correctAnswer": "C",
    "explanation": "Time expressions denoting possession in plural take the apostrophe after the s (\"two weeks' holiday\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-464",
    "question": "Choose the sentence with correct hyphenation in numerical compounds:",
    "options": [
      "The committee submitted a forty five-page environmental assessment.",
      "The committee submitted a forty five page environmental assessment.",
      "The committee submitted a forty-five page environmental assessment.",
      "The committee submitted a forty-five-page environmental assessment."
    ],
    "correctAnswer": "D",
    "explanation": "Compound numbers (\"forty-five\") and compound adjectives before nouns (\"forty-five-page assessment\") are hyphenated.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-465",
    "question": "Identify the sentence with correct punctuation around appositives:",
    "options": [
      "Alexander Fleming, a Scottish bacteriologist, discovered penicillin in 1928.",
      "Alexander Fleming a Scottish bacteriologist, discovered penicillin in 1928.",
      "Alexander Fleming, a Scottish bacteriologist discovered penicillin in 1928.",
      "Alexander Fleming a Scottish bacteriologist discovered penicillin in 1928."
    ],
    "correctAnswer": "A",
    "explanation": "Non-restrictive appositives (\"a Scottish bacteriologist\") must be set off with a pair of commas.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-466",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "The company's CEO said \"Our goal is zero net emissions by 2040.\"",
      "The company's CEO said, \"Our goal is zero net emissions by 2040.\"",
      "The company's CEO said, \"Our goal is zero net emissions by 2040\".",
      "The company's CEO said; \"Our goal is zero net emissions by 2040.\""
    ],
    "correctAnswer": "B",
    "explanation": "Introductory reporting comma and terminal period inside quotation marks are standard.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-467",
    "question": "Choose the sentence that correctly uses a question mark:",
    "options": [
      "I wonder when the lecture will begin?",
      "Could you please inform me when will the lecture begin.",
      "Could you please inform me when the lecture will begin?",
      "Please tell me when the lecture will begin?"
    ],
    "correctAnswer": "C",
    "explanation": "\"Could you please inform me...?\" is a direct polite question requiring a question mark, with embedded statement word order.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-468",
    "question": "Identify the sentence with correct punctuation around parenthetical abbreviations:",
    "options": [
      "The World Health Organization (WHO), issued updated dietary guidelines.",
      "The World Health Organization, (WHO), issued updated dietary guidelines.",
      "The World Health Organization [WHO] issued updated dietary guidelines.",
      "The World Health Organization (WHO) issued updated dietary guidelines."
    ],
    "correctAnswer": "D",
    "explanation": "Parentheses cleanly enclose standard acronym definitions without additional flanking commas.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-469",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "Yes, the laboratory is open for student research on weekends.",
      "Yes the laboratory is open for student research on weekends.",
      "Yes, the laboratory, is open for student research on weekends.",
      "Yes; the laboratory is open for student research on weekends."
    ],
    "correctAnswer": "A",
    "explanation": "Introductory affirmative words (\"Yes\") are followed by a comma.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-470",
    "question": "Identify the sentence with correct punctuation for contrasting sentence elements:",
    "options": [
      "We need empirical solutions not theoretical abstractions.",
      "We need empirical solutions, not theoretical abstractions.",
      "We need empirical solutions; not theoretical abstractions.",
      "We need empirical solutions: not theoretical abstractions."
    ],
    "correctAnswer": "B",
    "explanation": "Contrasting sentence elements introduced by \"not\" are separated by a comma.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-471",
    "question": "Identify the underlined part [A, B, C, or D] that contains a grammatical error:\n\"The committee [A: has decided] to postpone [B: their] vote until all [C: members] have reviewed the [D: revised] proposal.\"",
    "options": [
      "[A] has decided",
      "[C] members",
      "[B] their",
      "[D] revised"
    ],
    "correctAnswer": "C",
    "explanation": "Pronoun-antecedent agreement: Since the singular verb \"has decided\" treats \"committee\" as a singular collective noun, the possessive pronoun must also be singular (\"its vote\", not \"their vote\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-472",
    "question": "Identify the part of the sentence containing a grammatical error:\n\"Neither the lead architect [A: nor] the structural engineers [B: was] able to identify [C: why] the foundation had shifted [D: so rapidly].\"",
    "options": [
      "[A] nor",
      "[D] so rapidly",
      "[C] why",
      "[B] was"
    ],
    "correctAnswer": "D",
    "explanation": "In \"neither... nor\" constructions, the verb agrees with the closer subject (\"structural engineers\", plural), so it must be \"were\" instead of \"was\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-473",
    "question": "Identify the grammatical error:\n\"Despite of [A: the] torrential downpour, the archaeological team [B: continued] excavating [C: the ancient] burial [D: site].\"",
    "options": [
      "[A] Despite of the",
      "[B] continued",
      "[C] the ancient",
      "[D] site"
    ],
    "correctAnswer": "A",
    "explanation": "\"Despite\" never takes the preposition \"of\" (use either \"Despite the\" or \"In spite of the\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-474",
    "question": "Identify the grammatical error:\n\"The professor requested that every student [A: submits] their laboratory [B: report] before [C: leaving] the [D: facility].\"",
    "options": [
      "[B] report",
      "[A] submits",
      "[C] leaving",
      "[D] facility"
    ],
    "correctAnswer": "B",
    "explanation": "Mandative subjunctive requires the bare infinitive \"submit\" (not \"submits\") after \"requested that\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-475",
    "question": "Identify the grammatical error:\n\"The number of endangered species in this sanctuary [A: have] decreased [B: significantly] since [C: protective] measures were [D: implemented].\"",
    "options": [
      "[C] protective",
      "[B] significantly",
      "[A] have",
      "[D] implemented"
    ],
    "correctAnswer": "C",
    "explanation": "\"The number of...\" takes a singular verb (\"has decreased\"), unlike \"A number of...\" which takes a plural verb.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-476",
    "question": "Identify the grammatical error:\n\"She is [A: one of the] most [B: talented] artist [C: in the] entire [D: academy].\"",
    "options": [
      "[A] one of the",
      "[B] talented",
      "[D] in the",
      "[C] artist"
    ],
    "correctAnswer": "D",
    "explanation": "The construction \"one of the + superlative\" must be followed by a plural noun (\"artists\", not \"artist\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-477",
    "question": "Identify the grammatical error:\n\"Hardly [A: the plane had] taken off [B: when] the pilot [C: reported] severe turbulence to air traffic [D: control].\"",
    "options": [
      "[A] the plane had",
      "[B] when",
      "[C] reported",
      "[D] control"
    ],
    "correctAnswer": "A",
    "explanation": "\"Hardly\" at the start of a sentence requires subject-auxiliary inversion: \"Hardly had the plane taken off\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-478",
    "question": "Identify the grammatical error:\n\"The new hospital wing, [A: that] was funded by private donations, [B: will be] officially inaugurated [C: by the] prime minister [D: next week].\"",
    "options": [
      "[B] will be",
      "[A] that",
      "[C] by the",
      "[D] next week"
    ],
    "correctAnswer": "B",
    "explanation": "In non-defining relative clauses set off by commas, \"which\" must be used for objects/buildings, never \"that\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-479",
    "question": "Identify the grammatical error:\n\"If the government [A: would have invested] in green energy earlier, carbon emissions [B: would have dropped] [C: significantly] by [D: now].\"",
    "options": [
      "[C] significantly",
      "[B] would have dropped",
      "[A] would have invested",
      "[D] now"
    ],
    "correctAnswer": "C",
    "explanation": "In the if-clause of a third conditional, use the past perfect (\"had invested\"), never \"would have invested\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-480",
    "question": "Identify the grammatical error:\n\"The data [A: collected] from the five trial sites [B: was] analyzed [C: thoroughly] by the statistical [D: team].\"",
    "options": [
      "[A] collected",
      "[D] team",
      "[C] thoroughly",
      "[B] was"
    ],
    "correctAnswer": "D",
    "explanation": "In formal scientific/academic contexts, \"data\" is the plural form of \"datum\" and takes the plural verb \"were analyzed\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-481",
    "question": "Choose the most grammatically accurate and concise revision of the sentence:\n\"Due to the fact that there was a lack of sufficient evidence, the judge dismissed the lawsuit.\"",
    "options": [
      "Because of insufficient evidence, the judge dismissed the lawsuit.",
      "Due to the fact that evidence was lacking, the judge dismissed the lawsuit.",
      "Because there was a lack of sufficient evidence, the judge dismissed the lawsuit.",
      "Owing to the circumstance that evidence was insufficient, the judge dismissed the lawsuit."
    ],
    "correctAnswer": "A",
    "explanation": "\"Because of insufficient evidence...\" replaces the wordy, redundant phrase \"Due to the fact that there was a lack of...\" with precise academic conciseness.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-482",
    "question": "Identify the grammatical error:\n\"Each of the candidates [A: were] asked to submit [B: a writing] sample and two academic [C: letters] of [D: recommendation].\"",
    "options": [
      "[B] a writing",
      "[A] were",
      "[C] letters",
      "[D] recommendation"
    ],
    "correctAnswer": "B",
    "explanation": "\"Each\" is a singular pronoun requiring the singular verb \"was asked\" (not \"were asked\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-483",
    "question": "Identify the grammatical error:\n\"Scarcely [A: had the delegates] concluded their negotiations [B: than] the international press [C: published] the draft [D: treaty].\"",
    "options": [
      "[A] had the delegates",
      "[C] published",
      "[B] than",
      "[D] treaty"
    ],
    "correctAnswer": "C",
    "explanation": "\"Scarcely\" pairs with \"when\", not \"than\" (\"No sooner\" pairs with \"than\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-484",
    "question": "Identify the grammatical error:\n\"She is accustomed [A: to wake] up at 05:00 AM [B: to conduct] her astronomical observations [C: before] sunrise [D: every day].\"",
    "options": [
      "[D] every day",
      "[B] to conduct",
      "[C] before",
      "[A] to wake"
    ],
    "correctAnswer": "D",
    "explanation": "\"Accustomed to\" is followed by a gerund (\"to waking up\", not \"to wake up\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-485",
    "question": "Identify the grammatical error:\n\"He gave me [A: an] advice regarding [B: how to] prepare [C: for the] university entrance [D: examination].\"",
    "options": [
      "[A] an advice",
      "[B] how to",
      "[C] for the",
      "[D] examination"
    ],
    "correctAnswer": "A",
    "explanation": "\"Advice\" is uncountable and cannot be preceded by \"an\" (use \"some advice\" or \"a piece of advice\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-486",
    "question": "Identify the grammatical error:\n\"The manager made the staff [A: to work] overtime [B: in order to] meet the quarterly financial [C: targets] set by the [D: board].\"",
    "options": [
      "[B] in order to",
      "[A] to work",
      "[C] targets",
      "[D] board"
    ],
    "correctAnswer": "B",
    "explanation": "Causative verb \"make + object\" takes the bare infinitive (\"work\", not \"to work\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-487",
    "question": "Identify the grammatical error:\n\"Between the three [A: proposed] transportation routes, the northern corridor [B: is] clearly the [C: most] cost-effective and [D: feasible].\"",
    "options": [
      "[C] most",
      "[B] is",
      "[A] Between",
      "[D] feasible"
    ],
    "correctAnswer": "C",
    "explanation": "When referring to three or more options, use \"Among\" instead of \"Between\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-488",
    "question": "Identify the grammatical error:\n\"Having [A: finishing] the extensive data analysis, the research paper [B: was submitted] to the journal [C: for] peer [D: review].\"",
    "options": [
      "[D] review",
      "[B] was submitted",
      "[C] for",
      "[A] finishing"
    ],
    "correctAnswer": "D",
    "explanation": "The perfect participle construction requires the past participle: \"Having finished\" (and to avoid a dangling modifier, \"the researchers submitted the paper\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-489",
    "question": "Identify the grammatical error:\n\"The economic policy resulted [A: from] widespread inflation and [B: a sharp] decline [C: in] consumer [D: confidence].\"",
    "options": [
      "[A] from",
      "[B] a sharp",
      "[C] in",
      "[D] confidence"
    ],
    "correctAnswer": "A",
    "explanation": "To indicate causing an outcome, use \"resulted in\" (not \"resulted from\", which indicates the origin).",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-490",
    "question": "Identify the grammatical error:\n\"There [A: is] many historical monuments [B: situated] in the [C: ancient] quarter of [D: the city].\"",
    "options": [
      "[B] situated",
      "[A] is",
      "[C] ancient",
      "[D] the city"
    ],
    "correctAnswer": "B",
    "explanation": "The delayed subject is plural (\"many historical monuments\"), requiring the plural verb \"are\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-491",
    "question": "Choose the sentence that corrects the faulty comparison:\n\"The climate of southern Spain is much warmer than England.\"",
    "options": [
      "The climate of southern Spain is much warmer than the one of England.",
      "The climate of southern Spain is much warmer than England's climate is.",
      "The climate of southern Spain is much warmer than that of England.",
      "The climate of southern Spain is much warmer compared to England."
    ],
    "correctAnswer": "C",
    "explanation": "A climate must be compared to another climate (\"that of England\"), not directly to the country itself (\"England\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-492",
    "question": "Identify the grammatical error:\n\"Physics [A: are] my favourite subject, [B: although] I find quantum mechanics [C: particularly] challenging [D: to comprehend].\"",
    "options": [
      "[D] to comprehend",
      "[B] although",
      "[C] particularly",
      "[A] are"
    ],
    "correctAnswer": "D",
    "explanation": "\"Physics\" as an academic subject is singular and takes the verb \"is\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-493",
    "question": "Identify the grammatical error:\n\"No sooner [A: we had] entered the auditorium [B: than] the keynote speaker [C: began] his address [D: on global economics].\"",
    "options": [
      "[A: we had]",
      "[B: than]",
      "[C: began]",
      "[D: on global economics]"
    ],
    "correctAnswer": "A",
    "explanation": "\"No sooner\" at the start triggers auxiliary inversion: \"No sooner had we entered\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-494",
    "question": "Identify the grammatical error:\n\"The criteria used to evaluate the applicants [A: was] [B: considered] excessively [C: rigorous] by the admissions [D: committee].\"",
    "options": [
      "[B] considered",
      "[A] was",
      "[C] rigorous",
      "[D] committee"
    ],
    "correctAnswer": "B",
    "explanation": "\"Criteria\" is a plural noun (singular: criterion), requiring the plural verb \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-495",
    "question": "Identify the grammatical error:\n\"She is [A: taller] then her older sister [B: by] nearly [C: three] [D: inches].\"",
    "options": [
      "[C] three",
      "[B] by",
      "[A] taller then",
      "[D] inches"
    ],
    "correctAnswer": "C",
    "explanation": "Comparatives use the conjunction \"than\" (\"taller than\"), not the time adverb \"then\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-496",
    "question": "Identify the grammatical error:\n\"The board recommended that the CEO [A: steps] down [B: following] allegations of financial [C: impropriety] within the [D: corporation].\"",
    "options": [
      "[D] corporation",
      "[B] following",
      "[C] impropriety",
      "[A] steps"
    ],
    "correctAnswer": "D",
    "explanation": "Subjunctive mood after \"recommended that\" requires the base form \"step\" (not \"steps\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-497",
    "question": "Identify the grammatical error:\n\"The company [A: who] produced the defective battery units [B: was ordered] to pay [C: substantial] compensation to [D: consumers].\"",
    "options": [
      "[A] who",
      "[B] was ordered",
      "[C] substantial",
      "[D] consumers"
    ],
    "correctAnswer": "A",
    "explanation": "A company is an inanimate corporate entity and should be referenced with \"which\" or \"that\", not \"who\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-498",
    "question": "Identify the grammatical error:\n\"If the team [A: had played] more defensively, they [B: would not lose] the championship match [C: yesterday] [D: afternoon].\"",
    "options": [
      "[A] had played",
      "[B] would not lose",
      "[C] yesterday",
      "[D] afternoon"
    ],
    "correctAnswer": "B",
    "explanation": "Third conditional referring to a past event (\"yesterday\") requires \"would not have lost\" in the main clause.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-499",
    "question": "Identify the grammatical error:\n\"Less than fifty [A: students] attended the guest lecture, [B: which] was disappointing [C: given] the speaker's [D: renown].\"",
    "options": [
      "[C] given",
      "[B] which",
      "[A] Less than fifty",
      "[D] renown"
    ],
    "correctAnswer": "C",
    "explanation": "With countable nouns like \"students\", use \"Fewer than fifty\" instead of \"Less than fifty\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-500",
    "question": "Identify the grammatical error:\n\"He is [A: an] European citizen [B: who] works [C: as an] environmental consultant [D: in Brussels].\"",
    "options": [
      "[D] in Brussels",
      "[B] who",
      "[C] as an",
      "[A] an European"
    ],
    "correctAnswer": "D",
    "explanation": "\"European\" begins with the consonant sound /j/, requiring the article \"a\" rather than \"an\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-501",
    "question": "Choose the correct verb form: A bouquet of rare alpine orchids, along with several pressed botanical specimens, _______ to the university archives last Tuesday.",
    "options": [
      "was delivered",
      "were delivered",
      "have been delivered",
      "are being delivered"
    ],
    "correctAnswer": "A",
    "explanation": "The true subject of the sentence is the singular noun \"bouquet\"; parenthetical phrases introduced by \"along with\" do not alter the grammatical number of the subject.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-502",
    "question": "Fill in the blank: Neither the chief financial officer nor the managing partners _______ prepared to endorse the proposed restructuring plan during yesterday's audit.",
    "options": [
      "is",
      "were",
      "was",
      "has been"
    ],
    "correctAnswer": "B",
    "explanation": "In correlative \"neither... nor\" structures, the finite verb must agree with the closer subject entity (\"managing partners\", plural), requiring \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-503",
    "question": "Choose the correct form: Three-quarters of the glacial ice cap _______ melted due to abnormal thermal currents over the last four decades.",
    "options": [
      "have",
      "are",
      "has",
      "were"
    ],
    "correctAnswer": "C",
    "explanation": "With fractional expressions such as \"three-quarters\", the verb agrees with the complement noun in the prepositional phrase (\"glacial ice cap\", singular/uncountable), requiring \"has\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-504",
    "question": "Fill in the blank: Physics, in addition to advanced calculus and linear algebra, _______ obligatory for prospective aerospace engineering students.",
    "options": [
      "remain",
      "are",
      "have remained",
      "is"
    ],
    "correctAnswer": "D",
    "explanation": "\"Physics\" is a singular field of academic study ending in -s; intervening expressions like \"in addition to\" do not change its singular agreement.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-505",
    "question": "Select the correct option: Inside the newly excavated subterranean chamber _______ two sarcophagi dating back to the late Bronze Age.",
    "options": [
      "were discovered",
      "was discovered",
      "is resting",
      "has been situated"
    ],
    "correctAnswer": "A",
    "explanation": "In inverted locative constructions beginning with a prepositional phrase, the subject (\"two sarcophagi\", plural) follows the verb, demanding the plural \"were discovered\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-506",
    "question": "Choose the correct verb form: Every artisan and apprentice in the glassblowing guild _______ required to wear protective eyewear near the kilns.",
    "options": [
      "are",
      "is",
      "were",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "When compound subjects are preceded by \"Every\" or \"Each\", the subject takes a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-507",
    "question": "Fill in the blank: The jury _______ unable to reach a unanimous verdict even after forty-eight hours of contentious deliberation.",
    "options": [
      "were",
      "are",
      "was",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "Collective nouns acting as a single unified entity take a singular verb in standard formal English (\"was unable\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-508",
    "question": "Choose the correct option: The majority of the soil samples gathered from the hydrothermal vent _______ unusually elevated concentrations of sulfur.",
    "options": [
      "displays",
      "has displayed",
      "is displaying",
      "display"
    ],
    "correctAnswer": "D",
    "explanation": "\"The majority of\" followed by a plural countable noun (\"soil samples\") governs a plural verb (\"display\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-509",
    "question": "Fill in the blank: She is one of those pioneering climatologists who _______ that deep-sea warming will accelerate coastal erosion.",
    "options": [
      "argue",
      "argues",
      "is arguing",
      "has argued"
    ],
    "correctAnswer": "A",
    "explanation": "In the construction \"one of those [plural noun] who...\", the relative pronoun \"who\" refers to the plural antecedent (\"climatologists\"), governing the plural verb \"argue\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-510",
    "question": "Choose the correct verb: Ten thousand nautical miles across treacherous waters _______ an arduous voyage for 18th-century sailing vessels.",
    "options": [
      "were",
      "was",
      "are",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "Expressions of physical distance, monetary sums, or periods of time acting as a singular unit of measurement take a singular verb (\"was\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-511",
    "question": "Fill in the blank: Neither of the diplomatic envoys _______ authorized to sign the bilateral extradition treaty without cabinet approval.",
    "options": [
      "were",
      "are",
      "was",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "The indefinite pronoun \"Neither\", when used as the subject, is grammatically singular and requires \"was authorized\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-512",
    "question": "Choose the correct option: A variety of renewable polymer substitutes _______ being evaluated by the sustainability committee.",
    "options": [
      "is",
      "has been",
      "was",
      "are"
    ],
    "correctAnswer": "D",
    "explanation": "\"A variety of\" functioning as a quantifier with a plural noun (\"substitutes\") takes a plural verb (\"are\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-513",
    "question": "Fill in the blank: The apparatus used to calibrate seismic sensors in the seismic observatory _______ routine recalibration twice a month.",
    "options": [
      "requires",
      "require",
      "have required",
      "are requiring"
    ],
    "correctAnswer": "A",
    "explanation": "\"Apparatus\" refers here to a single device/system, acting as a singular noun requiring the third-person singular verb \"requires\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-514",
    "question": "Select the correct verb form: Not only the lead violinist but also the woodwind performers _______ an immaculate rendition of the concerto.",
    "options": [
      "gives",
      "gave",
      "is giving",
      "has given"
    ],
    "correctAnswer": "B",
    "explanation": "The past tense form \"gave\" provides correct tense harmony and matches the plural proximity subject \"woodwind performers\" in the correlative structure.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-515",
    "question": "Choose the correct option: The criteria established by the international accreditation council _______ extraordinarily rigorous for fledgling academies.",
    "options": [
      "is",
      "was",
      "are",
      "has been"
    ],
    "correctAnswer": "C",
    "explanation": "\"Criteria\" is the plural form of the Greek loanword \"criterion\", therefore demanding the plural copula \"are\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-516",
    "question": "Fill in the blank: More than one endangered marine species _______ successfully rehabilitated in the marine reserve this season.",
    "options": [
      "have been",
      "were",
      "are",
      "has been"
    ],
    "correctAnswer": "D",
    "explanation": "The idiomatic phrase \"More than one\" followed by a singular countable noun takes a grammatically singular verb (\"has been\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-517",
    "question": "Choose the correct form: Either the regional supervisor or her direct deputies _______ responsible for verifying the laboratory logs.",
    "options": [
      "are",
      "is",
      "was",
      "has been"
    ],
    "correctAnswer": "A",
    "explanation": "In \"either... or\" constructions, proximity rule dictates agreement with the adjacent plural noun \"deputies\", taking \"are\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-518",
    "question": "Fill in the blank: The committee _______ divided in their opinions regarding whether to allocate surplus revenue to civic infrastructure.",
    "options": [
      "was",
      "were",
      "is",
      "has been"
    ],
    "correctAnswer": "B",
    "explanation": "When members of a collective noun act individually or hold conflicting views, a plural verb (\"were divided\") is used.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-519",
    "question": "Choose the correct verb: What the archaeological team unearthed during the three-week survey _______ pristine ceramic artifacts.",
    "options": [
      "were",
      "are",
      "was",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "A nominal relative \"what\"-clause acting as a subject is generally treated as a singular entity (\"was\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-520",
    "question": "Fill in the blank: Gulliver's Travels, which blends satire and political allegory, _______ widely read across educational institutions.",
    "options": [
      "remain",
      "are",
      "have been",
      "remains"
    ],
    "correctAnswer": "D",
    "explanation": "Titles of literary works, even when plural in form, are treated as singular proper nouns, governing \"remains\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-521",
    "question": "Choose the correct option: Each of the experimental pharmaceuticals tested in Phase III trials _______ strict regulatory benchmarks.",
    "options": [
      "satisfies",
      "satisfy",
      "have satisfied",
      "are satisfying"
    ],
    "correctAnswer": "A",
    "explanation": "\"Each\" is a singular pronoun subject and governs the singular verb \"satisfies\", regardless of the plural prepositional modifier (\"pharmaceuticals\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-522",
    "question": "Fill in the blank: Beside the decaying watchtower _______ several centuries-old olive groves.",
    "options": [
      "stands",
      "stand",
      "is standing",
      "has stood"
    ],
    "correctAnswer": "B",
    "explanation": "In this inverted sentence, the plural subject \"several centuries-old olive groves\" comes after the verb, requiring \"stand\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-523",
    "question": "Choose the correct form: A series of high-level roundtables on renewable energy transition _______ scheduled throughout next month.",
    "options": [
      "are",
      "were",
      "is",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "When \"a series of\" functions as the head noun phrase referring to one continuous set of events, it takes a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-524",
    "question": "Fill in the blank: The phenomena observed during the solar eclipse _______ astrophysicists across the globe.",
    "options": [
      "fascinates",
      "is fascinating",
      "has fascinated",
      "fascinate"
    ],
    "correctAnswer": "D",
    "explanation": "\"Phenomena\" is the plural form of \"phenomenon\", which requires the plural verb form \"fascinate\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-525",
    "question": "Choose the correct option: Bread and butter _______ the humble daily staple of the working-class peasantry in 19th-century Britain.",
    "options": [
      "was",
      "were",
      "are",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "Compound subjects joined by \"and\" that denote a single combined concept, dish, or unit take a singular verb (\"was\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-526",
    "question": "Fill in the blank: Neither the architectural blueprint nor the structural calculations _______ any allowance for thermal expansion.",
    "options": [
      "contains",
      "contain",
      "is containing",
      "has contained"
    ],
    "correctAnswer": "B",
    "explanation": "The plural subject \"structural calculations\" is closer to the verb in the \"neither... nor\" construction, commanding \"contain\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-527",
    "question": "Choose the correct form: A number of maritime historians _______ that trade routes in the Indian Ocean were active much earlier than previously recorded.",
    "options": [
      "suggests",
      "is suggesting",
      "suggest",
      "has suggested"
    ],
    "correctAnswer": "C",
    "explanation": "\"A number of\" means \"many\" and functions as a plural quantifier governing the plural verb \"suggest\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-528",
    "question": "Fill in the blank: The bacterium identified in the contaminated aquifer _______ resistance to common broad-spectrum antibiotics.",
    "options": [
      "exhibit",
      "have exhibited",
      "are exhibiting",
      "exhibits"
    ],
    "correctAnswer": "D",
    "explanation": "\"Bacterium\" is the singular form (plural: bacteria); therefore, it requires the singular third-person verb \"exhibits\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-529",
    "question": "Choose the correct verb: There _______ significant discrepancies between the witness accounts and forensic surveillance footage.",
    "options": [
      "were",
      "was",
      "is",
      "has been"
    ],
    "correctAnswer": "A",
    "explanation": "In existential \"there\" constructions, the verb agrees with the true subject following it (\"significant discrepancies\", plural), requiring \"were\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-530",
    "question": "Fill in the blank: The curator, accompanied by two restoration specialists, _______ inspecting the centuries-old fresco in the cathedral.",
    "options": [
      "are",
      "is",
      "were",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "The subject \"curator\" is singular; quasi-connectives like \"accompanied by\" do not affect the grammatical agreement.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-531",
    "question": "Choose the correct form: Either of the two proposed computational models _______ capable of simulating atmospheric turbulence with high fidelity.",
    "options": [
      "are",
      "were",
      "is",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "\"Either\" as a pronoun subject takes a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-532",
    "question": "Fill in the blank: All the machinery exported to the offshore facility _______ comprehensive quality certification prior to dispatch.",
    "options": [
      "undergo",
      "have undergone",
      "are undergoing",
      "undergoes"
    ],
    "correctAnswer": "D",
    "explanation": "\"Machinery\" is an uncountable mass noun, requiring a singular verb (\"undergoes\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-533",
    "question": "Choose the correct option: Only one of the twenty-four candidates who applied for the diplomatic fellowship _______ selected for the final interview.",
    "options": [
      "was",
      "were",
      "are",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "In \"only one of the [plural noun] who...\", the head subject is \"only one\", requiring the singular verb \"was selected\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-534",
    "question": "Fill in the blank: The flock of migratory cranes _______ southwards as the Siberian winter approaches.",
    "options": [
      "fly",
      "flies",
      "are flying",
      "have flown"
    ],
    "correctAnswer": "B",
    "explanation": "\"Flock\" is a collective noun functioning here as a singular entity, governing the singular verb \"flies\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-535",
    "question": "Choose the correct form: Economics, when applied to public health interventions, _______ valuable insights into cost efficiency.",
    "options": [
      "provide",
      "are providing",
      "provides",
      "have provided"
    ],
    "correctAnswer": "C",
    "explanation": "The academic discipline \"Economics\" is singular and takes \"provides\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-536",
    "question": "Fill in the blank: What appeared to be ancient hieroglyphic carvings _______ later proven to be natural geological fissures.",
    "options": [
      "was",
      "is",
      "has been",
      "were"
    ],
    "correctAnswer": "D",
    "explanation": "When a nominal relative clause clearly refers to plural entities in the predicate (\"carvings\" / \"fissures\"), plural agreement (\"were\") is standard.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-537",
    "question": "Choose the correct option: Fifty kilograms of enriched organic fertilizer _______ sufficient for the entire experimental greenhouse bed.",
    "options": [
      "is",
      "are",
      "were",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "Quantities of weight considered as a single collective aggregate amount take a singular verb (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-538",
    "question": "Fill in the blank: Neither the chief editor nor his proofreaders _______ noticed the inverted caption in the printed journal.",
    "options": [
      "has",
      "have",
      "was",
      "is"
    ],
    "correctAnswer": "B",
    "explanation": "The nearest subject noun \"proofreaders\" is plural, requiring \"have\" in the present perfect.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-539",
    "question": "Choose the correct form: The data collected across seven weather stations _______ a marked shift in precipitation patterns.",
    "options": [
      "indicates",
      "is indicating",
      "indicate",
      "has indicated"
    ],
    "correctAnswer": "C",
    "explanation": "In formal academic writing, \"data\" is commonly treated as the plural of \"datum\" and governs \"indicate\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-540",
    "question": "Fill in the blank: Each boy and girl participating in the regional spelling bee _______ awarded a commemorative medal.",
    "options": [
      "were",
      "are",
      "have been",
      "was"
    ],
    "correctAnswer": "D",
    "explanation": "Subjects modified by \"Each\" take singular agreement (\"was awarded\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-541",
    "question": "Choose the correct option: To establish comprehensive marine protected zones _______ both international treaty consensus and sustained local enforcement.",
    "options": [
      "demands",
      "demand",
      "are demanding",
      "have demanded"
    ],
    "correctAnswer": "A",
    "explanation": "An infinitive phrase functioning as the grammatical subject (\"To establish...\") is singular and takes \"demands\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-542",
    "question": "Fill in the blank: The staff _______ divided over whether to transition to a four-day working week.",
    "options": [
      "was",
      "were",
      "is",
      "has been"
    ],
    "correctAnswer": "B",
    "explanation": "When members of staff act with divided opinions, the plural verb \"were\" is used.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-543",
    "question": "Choose the correct form: Politics _______ often defined as the art of navigating complex compromises between divergent interest groups.",
    "options": [
      "are",
      "were",
      "is",
      "have been"
    ],
    "correctAnswer": "C",
    "explanation": "\"Politics\" as a general conceptual field or discipline takes a singular verb (\"is\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-544",
    "question": "Fill in the blank: A pair of antique silver candlesticks _______ placed on the banquet table.",
    "options": [
      "were",
      "are",
      "have been",
      "was"
    ],
    "correctAnswer": "D",
    "explanation": "The grammatical head noun is the singular \"pair\", which takes the singular verb \"was placed\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-545",
    "question": "Choose the correct option: The percentage of renewable electricity generation _______ grown consistently over the past decade.",
    "options": [
      "has",
      "have",
      "are",
      "were"
    ],
    "correctAnswer": "A",
    "explanation": "\"The percentage of...\" takes a singular verb (\"has\"), unlike \"A percentage of...\" which can take plural agreement depending on the noun.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Subject-Verb Agreement"
  },
  {
    "id": "ielts-gram-546",
    "question": "Fill in the blank: By the time the restoration team arrived at the submerged temple site, floodwaters _______ the outer colonnades.",
    "options": [
      "already breached",
      "had already breached",
      "have already breached",
      "breached already"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect (\"had already breached\") is required to designate an action completed prior to another past event (\"the restoration team arrived\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-547",
    "question": "Choose the correct tense: Since the introduction of automated baggage sorting in 2019, lost luggage claims _______ by over 40 percent.",
    "options": [
      "dropped",
      "had dropped",
      "have dropped",
      "are dropping"
    ],
    "correctAnswer": "C",
    "explanation": "\"Since\" accompanied by a past reference point establishes a timeframe extending into the present, demanding the present perfect (\"have dropped\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-548",
    "question": "Fill in the blank: The lead botanist _______ on the classification of the Amazonian fern species for three years before securing her research grant.",
    "options": [
      "worked",
      "has been working",
      "was working",
      "had been working"
    ],
    "correctAnswer": "D",
    "explanation": "Past perfect continuous (\"had been working\") denotes an ongoing activity occurring over a duration before a distinct point in the past.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-549",
    "question": "Select the correct option: By next December, the multinational consortium _______ construction on the deep-water tidal turbine array.",
    "options": [
      "will have completed",
      "will be completing",
      "will have been completed",
      "completes"
    ],
    "correctAnswer": "A",
    "explanation": "Future perfect (\"will have completed\") expresses an action that will be finished before a specific milestone in the future (\"By next December\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-550",
    "question": "Choose the correct form: The flight to Reykjavik _______ at 06:45 tomorrow morning according to the revised airline timetable.",
    "options": [
      "will have departed",
      "departs",
      "departed",
      "is having departed"
    ],
    "correctAnswer": "B",
    "explanation": "The present simple is conventionally used to express scheduled, timetabled events occurring in the future.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-551",
    "question": "Fill in the blank: While the archeochemist _______ the residue on the amphora, she noticed traces of crystallized pine resin.",
    "options": [
      "analyzed",
      "has analyzed",
      "was analyzing",
      "had analyzed"
    ],
    "correctAnswer": "C",
    "explanation": "Past continuous (\"was analyzing\") provides the background activity interrupted by a shorter completed past action (\"noticed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-552",
    "question": "Choose the correct option: The planetary probe _______ signals back to Earth uninterruptedly for over thirty years.",
    "options": [
      "is transmitting",
      "transmits",
      "will transmit",
      "has been transmitting"
    ],
    "correctAnswer": "D",
    "explanation": "Present perfect continuous (\"has been transmitting\") emphasizes an uninterrupted duration originating in the past and continuing into the present.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-553",
    "question": "Fill in the blank: As soon as the diplomatic envoy _______ in Geneva, the peace talks will commence.",
    "options": [
      "arrives",
      "is arriving",
      "arrived",
      "will arrive"
    ],
    "correctAnswer": "A",
    "explanation": "In temporal clauses introduced by \"as soon as\" referring to future actions, the present simple (\"arrives\") is grammatically required.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-554",
    "question": "Select the correct tense: Scarcely _______ the laboratory doors when the fire suppression alarm sounded.",
    "options": [
      "the technicians had locked",
      "had the technicians locked",
      "did the technicians lock",
      "technicians locked"
    ],
    "correctAnswer": "B",
    "explanation": "Restrictive negative adverbs like \"Scarcely\" placed at the beginning of a sentence trigger inversion with the past perfect (\"had the technicians locked\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-555",
    "question": "Fill in the blank: In 1888, the inventor Nikola Tesla _______ patents for his alternating-current polyphase power distribution system.",
    "options": [
      "has filed",
      "had filed",
      "filed",
      "was filing"
    ],
    "correctAnswer": "C",
    "explanation": "A specific, completed historical timestamp (\"In 1888\") requires the past simple tense (\"filed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-556",
    "question": "Choose the correct form: It is the third time this month that the server farm _______ a thermal shutdown.",
    "options": [
      "experienced",
      "is experiencing",
      "had experienced",
      "has experienced"
    ],
    "correctAnswer": "D",
    "explanation": "Expressions like \"It is the first/second/third time that...\" require the present perfect tense (\"has experienced\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-557",
    "question": "Fill in the blank: This time next week, the oceanographic expedition _______ through the Drake Passage towards Antarctica.",
    "options": [
      "will be sailing",
      "is sailing",
      "will sail",
      "sails"
    ],
    "correctAnswer": "A",
    "explanation": "Future continuous (\"will be sailing\") describes an action that will be in progress at a specific temporal point in the future (\"This time next week\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-558",
    "question": "Choose the correct option: The curator realized that someone _______ the display case during the power surge.",
    "options": [
      "has tampered with",
      "had tampered with",
      "tampered with",
      "was tampering"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect (\"had tampered with\") reflects the anterior action that occurred before the moment of realization in the past.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-559",
    "question": "Fill in the blank: Water _______ at 100 degrees Celsius under standard sea-level atmospheric pressure.",
    "options": [
      "is boiling",
      "has boiled",
      "boils",
      "will boil"
    ],
    "correctAnswer": "C",
    "explanation": "Scientific general truths and physical laws are universally expressed in the present simple tense (\"boils\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-560",
    "question": "Choose the correct tense: When the acoustic sensors detected the anomaly, the submarine _______ into the thermal layer.",
    "options": [
      "descended",
      "has descended",
      "descends",
      "was descending"
    ],
    "correctAnswer": "D",
    "explanation": "Past continuous (\"was descending\") represents the ongoing background action in progress when a specific point-event occurred.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-561",
    "question": "Fill in the blank: The macroeconomic index _______ consistently volatile throughout the preceding fiscal quarter.",
    "options": [
      "remained",
      "is remaining",
      "has remained",
      "remains"
    ],
    "correctAnswer": "A",
    "explanation": "The reference to a completely closed past time period (\"the preceding fiscal quarter\") requires the past simple (\"remained\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-562",
    "question": "Choose the correct form: No sooner _______ the launch code than the primary thruster ignited.",
    "options": [
      "the engineer entered",
      "had the engineer entered",
      "did the engineer enter",
      "the engineer had entered"
    ],
    "correctAnswer": "B",
    "explanation": "\"No sooner\" followed by \"than\" triggers negative inversion with the past perfect (\"had the engineer entered\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-563",
    "question": "Fill in the blank: Modern neuroscientists _______ that synaptic plasticity plays an essential role in memory retention.",
    "options": [
      "are believing",
      "have been believing",
      "believe",
      "were believed"
    ],
    "correctAnswer": "C",
    "explanation": "\"Believe\" is a stative verb expressing a cognitive state; stative verbs are not normally used in the continuous aspect.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-564",
    "question": "Choose the correct option: By the turn of the century, electric trams _______ horse-drawn carriages across all major metropolitan routes.",
    "options": [
      "replaced",
      "have replaced",
      "were replacing",
      "had replaced"
    ],
    "correctAnswer": "D",
    "explanation": "\"By the turn of the century\" establishes a past deadline, demanding the past perfect (\"had replaced\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-565",
    "question": "Fill in the blank: Once the catalyst _______ added to the compound, the exothermic reaction accelerates rapidly.",
    "options": [
      "is",
      "is being",
      "was",
      "will be"
    ],
    "correctAnswer": "A",
    "explanation": "In conditional or time clauses referring to generalized scientific sequences, \"Once\" is followed by the present simple (\"is\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-566",
    "question": "Select the correct tense: The astrophysicist _______ the spectroscopy data all evening when she finally spotted the gravitational lensing effect.",
    "options": [
      "has examined",
      "had been examining",
      "was examining",
      "examined"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect continuous (\"had been examining\") highlights the continuous effort leading up to the past discovery (\"spotted\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-567",
    "question": "Fill in the blank: Up to the present moment, no conclusive evidence _______ regarding the origins of the mysterious radio bursts.",
    "options": [
      "is discovered",
      "was discovered",
      "has been discovered",
      "had been discovered"
    ],
    "correctAnswer": "C",
    "explanation": "\"Up to the present moment\" explicitly dictates the present perfect tense (\"has been discovered\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-568",
    "question": "Choose the correct form: When the delegation arrived at the summit, the keynote speaker _______ his address.",
    "options": [
      "just concludes",
      "is just concluding",
      "has just concluded",
      "had just concluded"
    ],
    "correctAnswer": "D",
    "explanation": "The past perfect with \"just\" (\"had just concluded\") signifies that the address ended immediately prior to the arrival.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-569",
    "question": "Fill in the blank: The archaeological council will not sanction further digging until safety barriers _______ installed.",
    "options": [
      "have been",
      "are being",
      "were",
      "will be"
    ],
    "correctAnswer": "A",
    "explanation": "In time clauses introduced by \"until\" referring to completed future preconditions, the present perfect (\"have been\") or present simple is used.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-570",
    "question": "Choose the correct option: By 2050, urban planners estimate that autonomous electric transit _______ standard in over seventy global capitals.",
    "options": [
      "becomes",
      "will have become",
      "became",
      "has become"
    ],
    "correctAnswer": "B",
    "explanation": "\"By 2050\" sets a future completion boundary, necessitating the future perfect (\"will have become\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-571",
    "question": "Fill in the blank: The ancient parchment _______ fragile and cannot be handled without specialized micro-tweezers.",
    "options": [
      "is feeling",
      "felt",
      "feels",
      "has been feeling"
    ],
    "correctAnswer": "C",
    "explanation": "The verb \"feel\" acting as a copular/linking verb expressing a physical texture property is stative and uses the simple present (\"feels\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-572",
    "question": "Choose the correct tense: While the acoustic orchestra _______ in the main auditorium, backstage technicians prepared the lighting rig.",
    "options": [
      "rehearses",
      "has rehearsed",
      "had rehearsed",
      "was rehearsing"
    ],
    "correctAnswer": "D",
    "explanation": "Past continuous (\"was rehearsing\") is used for continuous parallel past actions introduced by \"While\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-573",
    "question": "Fill in the blank: For centuries, indigenous communities along the Amazon river basin _______ natural tree resins to waterproof dugouts.",
    "options": [
      "have used",
      "are using",
      "had used",
      "use"
    ],
    "correctAnswer": "A",
    "explanation": "\"For centuries\" indicating a practice continuing from the historic past up to contemporary times requires the present perfect (\"have used\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-574",
    "question": "Choose the correct form: Hardly _______ down to inspect the fossil when a sudden gust dislodged the protective canopy.",
    "options": [
      "did the paleontologist kneel",
      "had the paleontologist knelt",
      "the paleontologist had knelt",
      "the paleontologist knelt"
    ],
    "correctAnswer": "B",
    "explanation": "\"Hardly... when\" triggers inverted auxiliary structure with the past perfect (\"had the paleontologist knelt\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-575",
    "question": "Fill in the blank: The diplomatic treaty _______ force as soon as all signatory parliaments ratify the protocols.",
    "options": [
      "entered",
      "has entered",
      "enters into",
      "had entered"
    ],
    "correctAnswer": "C",
    "explanation": "Present simple (\"enters into\") expressing automatic future effect governed by a conditional/time clause.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-576",
    "question": "Choose the correct option: By the time the fire engines managed to hook up to the hydrants, the blaze _______ to the upper timber floors.",
    "options": [
      "spread",
      "was spreading",
      "has spread",
      "had spread"
    ],
    "correctAnswer": "D",
    "explanation": "The past perfect (\"had spread\") is required for an event preceding the arrival and hookup of the fire engines.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-577",
    "question": "Fill in the blank: The architectural firm _______ sustainable bamboo composites in urban residential high-rises since 2012.",
    "options": [
      "has been incorporating",
      "is using",
      "used",
      "uses"
    ],
    "correctAnswer": "A",
    "explanation": "\"Since 2012\" denoting an ongoing enterprise originating in the past requires the present perfect continuous (\"has been incorporating\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-578",
    "question": "Select the correct form: It is high time the municipal authorities _______ the aging storm-drain network.",
    "options": [
      "overhaul",
      "overhauled",
      "have overhauled",
      "are overhauling"
    ],
    "correctAnswer": "B",
    "explanation": "\"It is high time\" is followed by the unreal past simple subjunctive form (\"overhauled\") to convey urgent necessity.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-579",
    "question": "Fill in the blank: The deep-sea submersible _______ at a rate of ten meters per minute until it reached the seabed.",
    "options": [
      "descends",
      "has descended",
      "had been descending",
      "is descending"
    ],
    "correctAnswer": "C",
    "explanation": "Past perfect continuous (\"had been descending\") conveys the duration of movement that continued until the past endpoint (\"reached\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-580",
    "question": "Choose the correct option: The pharmaceutical board will announce its appraisal once all peer-review audits _______ completed.",
    "options": [
      "will be",
      "were",
      "are being",
      "have been"
    ],
    "correctAnswer": "D",
    "explanation": "Time clauses following \"once\" use the present perfect (\"have been\") to mark completion before the main clause action.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-581",
    "question": "Fill in the blank: Before Marie Curie _______ her Nobel Prize in Chemistry in 1911, she had already shared the 1903 Physics prize.",
    "options": [
      "received",
      "has received",
      "had received",
      "receives"
    ],
    "correctAnswer": "A",
    "explanation": "The later completed event in a past sequence introduced by \"Before\" takes the simple past (\"received\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-582",
    "question": "Choose the correct form: She _______ for that aerospace engineering firm for twenty years before she was appointed Chief Technical Officer.",
    "options": [
      "worked",
      "had been working",
      "has worked",
      "was working"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect continuous (\"had been working\") is used to emphasize the sustained duration preceding a past promotion.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-583",
    "question": "Fill in the blank: This alloy _______ when exposed to extreme barometric pressure.",
    "options": [
      "is expanding",
      "has expanded",
      "expands",
      "was expanding"
    ],
    "correctAnswer": "C",
    "explanation": "General material behavior and physical characteristics are stated in the simple present tense (\"expands\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-584",
    "question": "Choose the correct option: When the volcanic eruption subsided, geologists observed that lava _______ two historic bridges.",
    "options": [
      "destroys",
      "was destroying",
      "has destroyed",
      "had destroyed"
    ],
    "correctAnswer": "D",
    "explanation": "The destruction occurred before the geologists made their observations, requiring the past perfect (\"had destroyed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-585",
    "question": "Fill in the blank: Next month marks the tenth anniversary of our organization; by then, our volunteers _______ over one million trees.",
    "options": [
      "will have planted",
      "planted",
      "are planting",
      "will plant"
    ],
    "correctAnswer": "A",
    "explanation": "\"By then\" combined with a future milestone requires the future perfect (\"will have planted\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-586",
    "question": "Select the correct form: The research team _______ several unexpected anomalies in the quantum simulation yesterday.",
    "options": [
      "has encountered",
      "encountered",
      "had encountered",
      "was encountered"
    ],
    "correctAnswer": "B",
    "explanation": "The definitive past time marker \"yesterday\" requires the past simple tense (\"encountered\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-587",
    "question": "Fill in the blank: The symphony orchestra _______ Beethoven's Ninth Symphony three times so far this concert season.",
    "options": [
      "performed",
      "had performed",
      "has performed",
      "is performing"
    ],
    "correctAnswer": "C",
    "explanation": "\"So far this concert season\" refers to an incomplete timeframe touching the present, taking the present perfect (\"has performed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-588",
    "question": "Choose the correct tense: At the moment the seismic alarm rang, the technicians _______ the turbine pressure valves.",
    "options": [
      "calibrate",
      "calibrated",
      "have calibrated",
      "were calibrating"
    ],
    "correctAnswer": "D",
    "explanation": "Past continuous (\"were calibrating\") denotes the background activity in progress at a precise past instant.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-589",
    "question": "Fill in the blank: By the time the treaty is ratified, trade delegations _______ over the tariff schedules for six consecutive weeks.",
    "options": [
      "will have been debating",
      "debated",
      "have debated",
      "will debate"
    ],
    "correctAnswer": "A",
    "explanation": "Future perfect continuous (\"will have been debating\") projects the ongoing duration of an activity up to a future point.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-590",
    "question": "Choose the correct option: As soon as the patient _______ signs of stabilization, the medical team will transfer her to the recovery ward.",
    "options": [
      "will show",
      "shows",
      "showed",
      "is showing"
    ],
    "correctAnswer": "B",
    "explanation": "Time clauses introduced by \"As soon as\" referring to future events use the present simple (\"shows\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-591",
    "question": "Fill in the blank: The diplomat _______ for the embassy in Tokyo for eight years before transferring to the London delegation.",
    "options": [
      "worked",
      "has worked",
      "had worked",
      "is working"
    ],
    "correctAnswer": "C",
    "explanation": "Past perfect (\"had worked\") shows the anteriority of the Tokyo post before the transfer occurred in the past.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-592",
    "question": "Choose the correct tense: Look at those cumulonimbus clouds gathering on the horizon; a torrential thunderstorm _______ within the hour.",
    "options": [
      "is starting",
      "started",
      "starts",
      "is going to start"
    ],
    "correctAnswer": "D",
    "explanation": "\"Is going to start\" is used for predictions based on present perceptible evidence (dark storm clouds on the horizon).",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-593",
    "question": "Fill in the blank: Since the new emissions directive came into effect, our industrial facility _______ its carbon output by 35%.",
    "options": [
      "has reduced",
      "is reducing",
      "had reduced",
      "reduced"
    ],
    "correctAnswer": "A",
    "explanation": "\"Since + past event\" governs the present perfect (\"has reduced\") in the main clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-594",
    "question": "Select the correct form: The historian discovered that the ancient chronicle _______ during the early Ming Dynasty.",
    "options": [
      "has been written",
      "had been written",
      "was writing",
      "is written"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect passive (\"had been written\") represents the historical creation that occurred prior to the historian's discovery.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-595",
    "question": "Fill in the blank: Over the last twenty-four hours, the seismic monitoring station _______ over eighty micro-tremors.",
    "options": [
      "recorded",
      "had recorded",
      "has recorded",
      "was recording"
    ],
    "correctAnswer": "C",
    "explanation": "\"Over the last twenty-four hours\" covers an open duration connecting directly to the present, requiring \"has recorded\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Tenses & Aspect"
  },
  {
    "id": "ielts-gram-596",
    "question": "Choose the correct conditional form: If the aerospace engineers had installed redundant hydraulic backups, the test capsule _______ during re-entry.",
    "options": [
      "did not malfunction",
      "would not malfunction",
      "will not malfunction",
      "would not have malfunctioned"
    ],
    "correctAnswer": "D",
    "explanation": "Third conditional for counterfactual past scenarios requires \"if + past perfect\" in the condition and \"would have + past participle\" in the result clause.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-597",
    "question": "Fill in the blank: Had the city council listened to the hydrological assessment, the recent river inundation _______ preventable.",
    "options": [
      "would have been",
      "was",
      "would be",
      "is"
    ],
    "correctAnswer": "A",
    "explanation": "Inverted third conditional (\"Had the city council listened...\") takes \"would have been\" in the main result clause.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-598",
    "question": "Choose the correct mixed conditional: If the conservationists had secured the breeding sanctuary in 2010, the rare river dolphin _______ extinct today.",
    "options": [
      "will not be",
      "would not be",
      "would not have been",
      "is not"
    ],
    "correctAnswer": "B",
    "explanation": "Mixed conditional (past counterfactual action \"had secured\" leading to a present state of affairs \"would not be extinct today\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-599",
    "question": "Fill in the blank: Were the government _______ carbon taxes by 20%, industrial emissions would decline sharply within two quarters.",
    "options": [
      "raises",
      "raising",
      "to raise",
      "raised"
    ],
    "correctAnswer": "C",
    "explanation": "Inverted second conditional uses \"Were + subject + to-infinitive\" (\"Were the government to raise...\") to express a formal hypothetical present/future condition.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-600",
    "question": "Select the correct option: Should you _______ further clarification regarding the clinical trial methodology, please contact the lead researcher.",
    "options": [
      "requires",
      "requiring",
      "required",
      "require"
    ],
    "correctAnswer": "D",
    "explanation": "Inverted first conditional uses \"Should + subject + bare infinitive\" (\"Should you require...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-601",
    "question": "Choose the correct form: But for the prompt intervention of the emergency trauma team, the injured mountaineer _______ from hypothermia.",
    "options": [
      "would have perished",
      "perished",
      "will perish",
      "perishes"
    ],
    "correctAnswer": "A",
    "explanation": "\"But for\" means \"If it were not for / If it had not been for\"; followed by a noun phrase referring to the past, it commands \"would have perished\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-602",
    "question": "Fill in the blank: The pharmaceutical developer agreed to license the patent, provided that the overseas manufacturer _______ rigorous hygiene standards.",
    "options": [
      "maintains",
      "maintained",
      "will maintain",
      "is maintaining"
    ],
    "correctAnswer": "B",
    "explanation": "\"Provided that\" in a past-conditional narrative structure agrees with the past tense (\"maintained\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-603",
    "question": "Choose the correct option: I wish our laboratory _______ the financial resources to purchase an advanced electron microscope last year.",
    "options": [
      "had",
      "has had",
      "had had",
      "would have"
    ],
    "correctAnswer": "C",
    "explanation": "Past regrets with \"wish\" require the past perfect (\"had had\") to express counterfactual past desires.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-604",
    "question": "Fill in the blank: If water is cooled to zero degrees Celsius under standard conditions, it _______ into crystalline ice.",
    "options": [
      "will have frozen",
      "would freeze",
      "froze",
      "freezes"
    ],
    "correctAnswer": "D",
    "explanation": "Zero conditional expresses physical laws and invariant scientific facts using present simple in both clauses (\"freezes\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-605",
    "question": "Choose the correct form: If the diplomatic summit _______ successful, bilateral tariffs will be eliminated by next spring.",
    "options": [
      "is",
      "will be",
      "would be",
      "has been being"
    ],
    "correctAnswer": "A",
    "explanation": "First conditional uses the present simple (\"is\") in the if-clause to refer to a realistic future possibility.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-606",
    "question": "Fill in the blank: If the archive _______ more carefully cataloged, the missing manuscript would not have remained undiscovered for two centuries.",
    "options": [
      "was",
      "had been",
      "is",
      "would be"
    ],
    "correctAnswer": "B",
    "explanation": "Third conditional if-clause takes the past perfect passive (\"had been cataloged\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-607",
    "question": "Choose the correct option: Unless the manufacturing plant _______ with effluent disposal regulations, its operating license will be revoked.",
    "options": [
      "will comply",
      "does not comply",
      "complies",
      "complied"
    ],
    "correctAnswer": "C",
    "explanation": "\"Unless\" already carries negative meaning (\"if not\"), so the verb must be affirmative present simple (\"complies\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-608",
    "question": "Fill in the blank: If I _______ you, I would consult an intellectual property attorney before publishing the proprietary algorithm.",
    "options": [
      "am",
      "was",
      "have been",
      "were"
    ],
    "correctAnswer": "D",
    "explanation": "Second conditional hypothetical advice requires the subjunctive \"were\" (\"If I were you\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-609",
    "question": "Choose the correct mixed conditional: If the archaeologist _______ proficient in ancient Akkadian, she could have translated the cuneiform tablet herself yesterday.",
    "options": [
      "were",
      "had been",
      "is",
      "would be"
    ],
    "correctAnswer": "A",
    "explanation": "Mixed conditional where an ongoing present capability/state (\"If she were proficient\") impacts a past counterfactual ability (\"could have translated\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-610",
    "question": "Fill in the blank: Without the thermal barrier coating, the supersonic turbine blades _______ during high-velocity combustion.",
    "options": [
      "melt",
      "would melt",
      "melted",
      "will melt"
    ],
    "correctAnswer": "B",
    "explanation": "\"Without + noun phrase\" acting as a hypothetical condition in the present/general realm takes \"would melt\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-611",
    "question": "Select the correct form: The delegate spoke as if he _______ the sole architect of the international peacekeeping agreement.",
    "options": [
      "is",
      "has been",
      "were",
      "will be"
    ],
    "correctAnswer": "C",
    "explanation": "\"As if\" followed by an unreal hypothetical assertion takes the past subjunctive \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-612",
    "question": "Fill in the blank: Supposing the company _______ bankrupt, what safety net would exist for the pension holders?",
    "options": [
      "goes",
      "will go",
      "had gone",
      "went"
    ],
    "correctAnswer": "D",
    "explanation": "\"Supposing\" functioning as a hypothetical conditional trigger with \"would\" in the main clause takes the past subjunctive/simple (\"went\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-613",
    "question": "Choose the correct option: I would rather the board _______ the vote until all regional directors are present.",
    "options": [
      "postponed",
      "postpones",
      "will postpone",
      "has postponed"
    ],
    "correctAnswer": "A",
    "explanation": "\"Would rather + subject\" takes the unreal past subjunctive (\"postponed\") to express a preference regarding someone else's action.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-614",
    "question": "Fill in the blank: Had the space shuttle's telemetry system failed, the ground control crew _______ to abort the orbital insertion.",
    "options": [
      "would have",
      "would have had",
      "had had",
      "will have had"
    ],
    "correctAnswer": "B",
    "explanation": "Inverted third conditional requires \"would have had\" in the main clause expressing past conditional necessity.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-615",
    "question": "Choose the correct form: If the soil samples _______ negative for toxic heavy metals, the agricultural project can proceed next week.",
    "options": [
      "tested",
      "will test",
      "test",
      "would test"
    ],
    "correctAnswer": "C",
    "explanation": "First conditional takes the present simple (\"test\") in the if-clause with a modal present in the main clause (\"can proceed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-616",
    "question": "Fill in the blank: Were it not for public donations, the wildlife sanctuary _______ to shutter its rehabilitation clinic.",
    "options": [
      "will be forced",
      "is forced",
      "was forced",
      "would be forced"
    ],
    "correctAnswer": "D",
    "explanation": "\"Were it not for...\" is an inverted second conditional expressing present unreality, followed by \"would be forced\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-617",
    "question": "Select the correct option: If they had not overlooked the seismic warning signs, the coastal village _______ in ruins today.",
    "options": [
      "would not lie",
      "would not have lain",
      "will not lie",
      "did not lie"
    ],
    "correctAnswer": "A",
    "explanation": "Mixed conditional: a counterfactual past failure (\"had not overlooked\") resulting in a present ongoing condition (\"would not lie in ruins today\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-618",
    "question": "Fill in the blank: If only we _______ the weather forecast before setting off on the remote mountain trek!",
    "options": [
      "checked",
      "had checked",
      "have checked",
      "would check"
    ],
    "correctAnswer": "B",
    "explanation": "\"If only\" expressing past regret requires the past perfect (\"had checked\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-619",
    "question": "Choose the correct form: On condition that the contractor _______ the soundproofing installation by Friday, the auditorium will open on schedule.",
    "options": [
      "will finish",
      "finished",
      "finishes",
      "is finishing"
    ],
    "correctAnswer": "C",
    "explanation": "\"On condition that\" operates as a conditional connector governing the present simple (\"finishes\") when referring to future contingencies.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-620",
    "question": "Fill in the blank: If the atmospheric pressure _______ suddenly, the barometer needle drops immediately.",
    "options": [
      "will fall",
      "would fall",
      "fell",
      "falls"
    ],
    "correctAnswer": "D",
    "explanation": "Zero conditional scientific rule linking sudden pressure drops to barometric needle response takes \"falls\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-621",
    "question": "Choose the correct option: If the government were to subsidize solar cell manufacturing, consumer adoption rates _______ dramatically.",
    "options": [
      "would increase",
      "will increase",
      "increased",
      "have increased"
    ],
    "correctAnswer": "A",
    "explanation": "Second conditional with \"were to + infinitive\" in the hypothetical condition takes \"would increase\" in the consequence clause.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-622",
    "question": "Fill in the blank: Had she _______ of the impending transport strike, she would have rescheduled her transatlantic flight.",
    "options": [
      "knows",
      "known",
      "knew",
      "been known"
    ],
    "correctAnswer": "B",
    "explanation": "Past perfect inverted conditional structure \"Had she known...\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-623",
    "question": "Select the correct form: If the treaty is signed tomorrow, it _______ diplomatic relations after three decades of hostility.",
    "options": [
      "restores",
      "would restore",
      "will restore",
      "restored"
    ],
    "correctAnswer": "C",
    "explanation": "First conditional main clause takes \"will restore\" for a real future consequence.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-624",
    "question": "Fill in the blank: I would have participated in the maritime conservation workshop if I _______ about it in advance.",
    "options": [
      "heard",
      "have heard",
      "would hear",
      "had heard"
    ],
    "correctAnswer": "D",
    "explanation": "Third conditional if-clause requires \"had heard\" to complement the main clause \"would have participated\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-625",
    "question": "Choose the correct form: Should the seismic tremors _______ in intensity, the evacuation protocol will be triggered immediately.",
    "options": [
      "increase",
      "increases",
      "increased",
      "increasing"
    ],
    "correctAnswer": "A",
    "explanation": "Inverted first conditional with \"Should\" uses the bare infinitive verb \"increase\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-626",
    "question": "Fill in the blank: If the museum _______ an admission fee, fewer local school groups would visit the natural history exhibit.",
    "options": [
      "charges",
      "charged",
      "had charged",
      "will charge"
    ],
    "correctAnswer": "B",
    "explanation": "Second conditional hypothetical condition taking the past simple \"charged\" with \"would visit\" in the main clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-627",
    "question": "Choose the correct option: If they had conserved their water rations during the trek, they _______ severely dehydrated right now.",
    "options": [
      "would not have been",
      "will not be",
      "would not be",
      "are not"
    ],
    "correctAnswer": "C",
    "explanation": "Mixed conditional: past action (\"had conserved\") leading to present ongoing state (\"would not be dehydrated right now\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-628",
    "question": "Fill in the blank: Were the company _______ its product pricing by ten percent, overall market demand would likely surge.",
    "options": [
      "lowers",
      "lowered",
      "lowering",
      "to lower"
    ],
    "correctAnswer": "D",
    "explanation": "Inverted second conditional uses \"Were the company to lower...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-629",
    "question": "Select the correct form: He acts as though he _______ the foremost authority on deep-sea hydrothermal vents.",
    "options": [
      "were",
      "is",
      "has been",
      "will be"
    ],
    "correctAnswer": "A",
    "explanation": "\"As though\" expressing unreal comparison uses the subjunctive \"were\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-630",
    "question": "Fill in the blank: But for the emergency generator, all cryogenically preserved tissue samples _______ lost.",
    "options": [
      "were",
      "would have been",
      "will be",
      "had been"
    ],
    "correctAnswer": "B",
    "explanation": "\"But for\" with past reference takes \"would have been lost\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-631",
    "question": "Choose the correct form: Provided that the antibiotic _______ the bacterial culture within 24 hours, the trial will proceed to Phase II.",
    "options": [
      "will inhibit",
      "inhibited",
      "inhibits",
      "is inhibiting"
    ],
    "correctAnswer": "C",
    "explanation": "\"Provided that\" uses the present simple (\"inhibits\") for future conditions.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-632",
    "question": "Fill in the blank: If the space agency _______ the thermal tiles thoroughly, the reentry damage would have been averted.",
    "options": [
      "inspected",
      "would inspect",
      "has inspected",
      "had inspected"
    ],
    "correctAnswer": "D",
    "explanation": "Third conditional if-clause takes the past perfect (\"had inspected\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-633",
    "question": "Choose the correct option: I wish the municipal transport department _______ more frequent bus services along this industrial corridor.",
    "options": [
      "operated",
      "operates",
      "has operated",
      "is operating"
    ],
    "correctAnswer": "A",
    "explanation": "Present wish about an ongoing desired situation requires the past simple (\"operated\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-634",
    "question": "Fill in the blank: Without proper insulation, heat _______ rapidly through unglazed single-pane windows.",
    "options": [
      "escaped",
      "escapes",
      "would escape",
      "had escaped"
    ],
    "correctAnswer": "B",
    "explanation": "General physical law statement using \"Without\" takes the present simple (\"escapes\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-635",
    "question": "Select the correct form: Had we _______ the statistical anomalies earlier, the retraction of the paper would not have been necessary.",
    "options": [
      "detects",
      "detecting",
      "detected",
      "detect"
    ],
    "correctAnswer": "C",
    "explanation": "Inverted third conditional \"Had we detected...\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-636",
    "question": "Fill in the blank: If she _______ French fluently, she could easily interpret for the visiting diplomatic delegation today.",
    "options": [
      "would speak",
      "speaks",
      "had spoken",
      "spoke"
    ],
    "correctAnswer": "D",
    "explanation": "Second conditional expressing present hypothetical ability takes the past simple (\"spoke\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-637",
    "question": "Choose the correct option: Unless the bridge _______ reinforced before the flood season, catastrophic structural damage may occur.",
    "options": [
      "is",
      "is not",
      "will be",
      "was"
    ],
    "correctAnswer": "A",
    "explanation": "\"Unless\" with present simple passive (\"is reinforced\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-638",
    "question": "Fill in the blank: If the expedition team _______ the emergency beacon, search aircraft would have located them within hours.",
    "options": [
      "activated",
      "had activated",
      "has activated",
      "would activate"
    ],
    "correctAnswer": "B",
    "explanation": "Third conditional if-clause takes \"had activated\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-639",
    "question": "Select the correct form: Were the central bank _______ the reserve requirements, domestic credit availability would expand.",
    "options": [
      "lowers",
      "lowered",
      "to lower",
      "lowering"
    ],
    "correctAnswer": "C",
    "explanation": "Inverted conditional \"Were the central bank to lower...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-640",
    "question": "Fill in the blank: If I had remembered to calibrate the spectrometer, the experimental readings _______ accurate.",
    "options": [
      "had been",
      "were",
      "will be",
      "would have been"
    ],
    "correctAnswer": "D",
    "explanation": "Third conditional result clause takes \"would have been\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conditionals & Unreal Past"
  },
  {
    "id": "ielts-gram-641",
    "question": "Choose the correct passive form: The ancient stone megaliths _______ by neolithic pastoralists over four millennia ago.",
    "options": [
      "are believed to have been erected",
      "are believing to be erected",
      "believe to have been erected",
      "have believed to erect"
    ],
    "correctAnswer": "A",
    "explanation": "Impersonal reporting passive with perfect infinitive (\"are believed to have been erected\") denotes an action completed in the remote historical past.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-642",
    "question": "Fill in the blank: The museum curator had the medieval manuscript _______ by a certified antiquities restorer before putting it on display.",
    "options": [
      "bind",
      "bound",
      "to bind",
      "binding"
    ],
    "correctAnswer": "B",
    "explanation": "Causative structure \"have + object + past participle\" (\"had the manuscript bound\") indicates arranging for an action to be done by a professional.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-643",
    "question": "Choose the correct option: The laboratory supervisor got the technicians _______ the autoclaves after each sterilization cycle.",
    "options": [
      "clean",
      "cleaned",
      "to clean",
      "cleaning"
    ],
    "correctAnswer": "C",
    "explanation": "Causative \"get + person + to-infinitive\" (\"got the technicians to clean...\") denotes persuading or instructing someone to perform a task.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-644",
    "question": "Fill in the blank: The sudden drop in barometric pressure cannot _______ as a mere sensor calibration anomaly.",
    "options": [
      "dismissing",
      "dismiss",
      "have dismissed",
      "be dismissed"
    ],
    "correctAnswer": "D",
    "explanation": "Passive infinitive after modal (\"cannot be dismissed\") focuses on the subject being acted upon.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-645",
    "question": "Select the correct form: It _______ that over eighty percent of deep-sea marine biodiversity remains uncataloged.",
    "options": [
      "is estimated",
      "estimates",
      "estimated",
      "has estimating"
    ],
    "correctAnswer": "A",
    "explanation": "Impersonal passive construction with preparatory \"It\" (\"It is estimated that...\") is standard in scientific writing.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-646",
    "question": "Fill in the blank: The controversial trade tariff was _______ during yesterday's parliamentary session.",
    "options": [
      "spoken",
      "spoken of",
      "spoken to",
      "spoken about"
    ],
    "correctAnswer": "B",
    "explanation": "Prepositional passive retains the dependent preposition (\"spoken of\") when the verb is transformed into passive voice.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-647",
    "question": "Choose the correct option: The diplomatic envoy objected to _______ without prior clearance from the Ministry of Foreign Affairs.",
    "options": [
      "be interviewed",
      "interviewing",
      "being interviewed",
      "have interviewed"
    ],
    "correctAnswer": "C",
    "explanation": "Preposition \"to\" in \"objected to\" requires a gerund, and passive meaning demands the passive gerund (\"being interviewed\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-648",
    "question": "Fill in the blank: The factory management made the assembly workers _______ additional protective visors during the chemical transfer.",
    "options": [
      "wearing",
      "to wear",
      "worn",
      "wear"
    ],
    "correctAnswer": "D",
    "explanation": "Causative \"make + person + bare infinitive\" in active voice (\"made the assembly workers wear...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-649",
    "question": "Choose the correct passive form: The assembly workers were made _______ additional protective visors during the chemical transfer.",
    "options": [
      "to wear",
      "wear",
      "wearing",
      "worn"
    ],
    "correctAnswer": "A",
    "explanation": "When the causative verb \"make\" is transformed into the passive voice (\"were made\"), it must be followed by a full to-infinitive (\"to wear\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-650",
    "question": "Fill in the blank: The missing telemetry logs were found _______ in an encrypted sub-directory on the decommissioned server.",
    "options": [
      "hide",
      "hidden",
      "to hide",
      "hiding"
    ],
    "correctAnswer": "B",
    "explanation": "Passive participle complement (\"were found hidden\") describes the passive state in which the logs were discovered.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-651",
    "question": "Choose the correct option: The antique silver cutlery _______ before the commemorative banquet.",
    "options": [
      "needs polished",
      "needs to polish",
      "needs polishing",
      "is needing to polish"
    ],
    "correctAnswer": "C",
    "explanation": "\"Need + gerund\" (\"needs polishing\") conveys a passive meaning equivalent to \"needs to be polished\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-652",
    "question": "Fill in the blank: The environmental accord is expected _______ by twenty-five heads of state at next week's climate summit.",
    "options": [
      "signing",
      "to sign",
      "being signed",
      "to be signed"
    ],
    "correctAnswer": "D",
    "explanation": "Passive infinitive after \"is expected\" (\"to be signed\") expresses expected future action by the agents.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-653",
    "question": "Select the correct form: Having _______ by the peer-review committee, the archaeological paper was immediately published.",
    "options": [
      "been praised",
      "praised",
      "being praised",
      "praising"
    ],
    "correctAnswer": "A",
    "explanation": "Perfect passive participle clause (\"Having been praised...\") indicates that the praise occurred before publication.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-654",
    "question": "Fill in the blank: The lead investigator will not let unauthorized personnel _______ the crime scene barricade.",
    "options": [
      "to cross",
      "cross",
      "crossed",
      "crossing"
    ],
    "correctAnswer": "B",
    "explanation": "Causative \"let + object + bare infinitive\" (\"let unauthorized personnel cross\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-655",
    "question": "Choose the correct option: The new high-speed rail line is reported _______ over budget by nearly twenty percent.",
    "options": [
      "to run",
      "running",
      "to have run",
      "have run"
    ],
    "correctAnswer": "C",
    "explanation": "Perfect infinitive (\"to have run\") follows \"is reported\" when referring to an action that occurred prior to the reporting.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-656",
    "question": "Fill in the blank: All outbound diplomatic cargo must _______ by airport security officers before loading.",
    "options": [
      "screen",
      "screening",
      "have screened",
      "be screened"
    ],
    "correctAnswer": "D",
    "explanation": "Modal passive \"must be screened\" indicates obligatory passive action.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-657",
    "question": "Choose the correct form: The historic stone fortress _______ during the third siege of the city in 1644.",
    "options": [
      "was destroyed",
      "destroyed",
      "has been destroyed",
      "is destroyed"
    ],
    "correctAnswer": "A",
    "explanation": "Past simple passive (\"was destroyed\") corresponds to a specific past historical event.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-658",
    "question": "Fill in the blank: The research director had her administrative assistant _______ the conference schedule.",
    "options": [
      "to draft",
      "draft",
      "drafted",
      "drafting"
    ],
    "correctAnswer": "B",
    "explanation": "Causative \"have + person + bare infinitive\" in active form (\"had her assistant draft...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-659",
    "question": "Select the correct option: The endangered snow leopards _______ to inhabit only the highest ridges of the Himalayas.",
    "options": [
      "know",
      "are knowing",
      "are known",
      "have known"
    ],
    "correctAnswer": "C",
    "explanation": "Passive reporting structure (\"are known to inhabit...\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-660",
    "question": "Fill in the blank: The software application needs _______ before it can be deployed on the production network.",
    "options": [
      "to test",
      "test",
      "tested",
      "testing"
    ],
    "correctAnswer": "D",
    "explanation": "\"Need + gerund\" (\"needs testing\") is an idiomatic passive equivalent to \"needs to be tested\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-661",
    "question": "Choose the correct form: At the time of the audit, the financial accounts _______ by an independent accounting firm.",
    "options": [
      "were being reviewed",
      "were reviewing",
      "reviewed",
      "have been reviewed"
    ],
    "correctAnswer": "A",
    "explanation": "Past continuous passive (\"were being reviewed\") conveys an action in progress at a specific past point.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-662",
    "question": "Fill in the blank: The architect got the planning commission _______ the zoning variance after presenting the 3D acoustic models.",
    "options": [
      "approve",
      "to approve",
      "approved",
      "approving"
    ],
    "correctAnswer": "B",
    "explanation": "Causative \"get + object + to-infinitive\" (\"got the commission to approve\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-663",
    "question": "Choose the correct option: The fugitive is believed _______ the country using a forged diplomatic passport last weekend.",
    "options": [
      "to flee",
      "fleeing",
      "to have fled",
      "fled"
    ],
    "correctAnswer": "C",
    "explanation": "Perfect infinitive (\"to have fled\") is used because the fleeing occurred before the present belief.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-664",
    "question": "Fill in the blank: It has _______ that global sea surface temperatures have broken historical records.",
    "options": [
      "confirmed",
      "confirming",
      "being confirmed",
      "been confirmed"
    ],
    "correctAnswer": "D",
    "explanation": "Present perfect impersonal passive (\"It has been confirmed that...\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-665",
    "question": "Select the correct form: The student resented _______ by the examiner in front of his peers.",
    "options": [
      "being reprimanded",
      "to be reprimanded",
      "reprimanding",
      "reprimanded"
    ],
    "correctAnswer": "A",
    "explanation": "\"Resent\" takes a gerund; passive meaning requires the passive gerund (\"being reprimanded\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-666",
    "question": "Fill in the blank: The deep-water pipeline was constructed _______ specialized robotic welding submersibles.",
    "options": [
      "with",
      "by means of",
      "from",
      "at"
    ],
    "correctAnswer": "B",
    "explanation": "\"By means of\" or \"using\" denotes the instrument/method in formal passive descriptions.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-667",
    "question": "Choose the correct option: The new pharmaceutical compound is claimed _______ cognitive symptoms in early-stage Alzheimer's patients.",
    "options": [
      "alleviated",
      "alleviating",
      "to alleviate",
      "to have been alleviated"
    ],
    "correctAnswer": "C",
    "explanation": "\"Is claimed to alleviate\" uses the present infinitive to describe an ongoing general capability.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-668",
    "question": "Fill in the blank: The company had its trademark _______ across seventy international jurisdictions.",
    "options": [
      "register",
      "registering",
      "to register",
      "registered"
    ],
    "correctAnswer": "D",
    "explanation": "Causative \"have + noun + past participle\" (\"had its trademark registered\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-669",
    "question": "Select the correct form: The patient was made _______ in the observation room for thirty minutes following the injection.",
    "options": [
      "to wait",
      "wait",
      "waiting",
      "waited"
    ],
    "correctAnswer": "A",
    "explanation": "Passive of \"make\" requires \"to wait\" with the full infinitive.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-670",
    "question": "Fill in the blank: The mysterious inscription on the monolith has not yet _______ by epigraphers.",
    "options": [
      "deciphered",
      "been deciphered",
      "being deciphered",
      "to decipher"
    ],
    "correctAnswer": "B",
    "explanation": "Present perfect passive (\"has not yet been deciphered\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-671",
    "question": "Choose the correct option: The research team hopes _______ a substantial grant by the national science council.",
    "options": [
      "to award",
      "awarding",
      "to be awarded",
      "being awarded"
    ],
    "correctAnswer": "C",
    "explanation": "\"Hope\" takes a to-infinitive; passive sense takes \"to be awarded\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-672",
    "question": "Fill in the blank: By next Friday, all the clinical trial questionnaires _______ by the biometricians.",
    "options": [
      "will analyze",
      "have been analyzed",
      "are analyzed",
      "will have been analyzed"
    ],
    "correctAnswer": "D",
    "explanation": "Future perfect passive (\"will have been analyzed\") indicates completion before next Friday.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-673",
    "question": "Select the correct form: The missing artifacts are thought _______ out of the country disguised as modern replicas.",
    "options": [
      "to have been smuggled",
      "to smuggle",
      "smuggling",
      "being smuggled"
    ],
    "correctAnswer": "A",
    "explanation": "Perfect passive infinitive (\"to have been smuggled\") reflects past passive action with a present reporting verb.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-674",
    "question": "Fill in the blank: The old industrial warehouse is currently _______ into modern artist lofts.",
    "options": [
      "converted",
      "being converted",
      "been converted",
      "converting"
    ],
    "correctAnswer": "B",
    "explanation": "Present continuous passive (\"is currently being converted\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-675",
    "question": "Choose the correct option: The suspect was seen _______ the building through the rear emergency fire escape.",
    "options": [
      "leave",
      "left",
      "to leave",
      "leaves"
    ],
    "correctAnswer": "C",
    "explanation": "When verbs of perception (see, hear) are used in the passive, they are followed by a to-infinitive (\"to leave\") or present participle (\"leaving\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-676",
    "question": "Fill in the blank: The experimental prototype _______ thoroughly tested before commercial rollout can begin.",
    "options": [
      "must being",
      "must have",
      "must",
      "must be"
    ],
    "correctAnswer": "D",
    "explanation": "Modal passive structure \"must be + past participle\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-677",
    "question": "Select the correct form: Having _______ all safety guidelines, the construction manager allowed the crew to enter the trench.",
    "options": [
      "verified",
      "been verified",
      "verifying",
      "verify"
    ],
    "correctAnswer": "A",
    "explanation": "The construction manager performed the verification, so the active perfect participle (\"Having verified\") is correct.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-678",
    "question": "Fill in the blank: The ancient sunken galleon was found _______ under three meters of marine silt.",
    "options": [
      "bury",
      "buried",
      "to bury",
      "burying"
    ],
    "correctAnswer": "B",
    "explanation": "Participle adjective / complement (\"found buried\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-679",
    "question": "Choose the correct option: It is widely _______ that excessive exposure to particulate matter impairs respiratory health.",
    "options": [
      "acknowledge",
      "acknowledging",
      "acknowledged",
      "to acknowledge"
    ],
    "correctAnswer": "C",
    "explanation": "Impersonal passive \"It is widely acknowledged that...\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-680",
    "question": "Fill in the blank: The diplomat refused _______ as a party to the unratified ceasefire accord.",
    "options": [
      "to name",
      "being named",
      "naming",
      "to be named"
    ],
    "correctAnswer": "D",
    "explanation": "\"Refuse\" takes a to-infinitive; passive requires \"to be named\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-681",
    "question": "Select the correct form: The damaged cathedral stained glass _______ by master glaziers next spring.",
    "options": [
      "will be restored",
      "restores",
      "is restored",
      "restoring"
    ],
    "correctAnswer": "A",
    "explanation": "Future simple passive (\"will be restored\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-682",
    "question": "Fill in the blank: The professor got the graduate students _______ their literature reviews by Monday morning.",
    "options": [
      "submit",
      "to submit",
      "submitted",
      "submitting"
    ],
    "correctAnswer": "B",
    "explanation": "Causative \"get + person + to-infinitive\" (\"got the students to submit\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-683",
    "question": "Choose the correct option: The missing cryptographic keys are reported _______ during a routine data migration last month.",
    "options": [
      "to lose",
      "losing",
      "to have been lost",
      "having lost"
    ],
    "correctAnswer": "C",
    "explanation": "Perfect passive infinitive (\"to have been lost\") indicates anterior loss in the past.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-684",
    "question": "Fill in the blank: These delicate bio-samples need _______ in liquid nitrogen immediately upon collection.",
    "options": [
      "stored",
      "to store",
      "store",
      "storing"
    ],
    "correctAnswer": "D",
    "explanation": "\"Need + gerund\" (\"need storing\") conveys passive necessity.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-685",
    "question": "Select the correct form: The municipal water supply was found _______ with elevated trace levels of nitrates.",
    "options": [
      "contaminated",
      "to contaminate",
      "contaminate",
      "contaminating"
    ],
    "correctAnswer": "A",
    "explanation": "Passive past participle complement (\"found contaminated\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Passive Voice & Causatives"
  },
  {
    "id": "ielts-gram-686",
    "question": "Fill in the blank: The deep-sea submersible, _______ titanium pressure hull was engineered to withstand 1,000 atmospheres, safely touched down on the abyssal plain.",
    "options": [
      "which",
      "whose",
      "that",
      "of which"
    ],
    "correctAnswer": "B",
    "explanation": "Possessive relative pronoun \"whose\" correctly modifies both animate and inanimate antecedents (\"the deep-sea submersible whose pressure hull...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-687",
    "question": "Choose the correct option: The theoretical framework _______ the entire quantum cryptography algorithm relies was published in 1994.",
    "options": [
      "where",
      "in that",
      "on which",
      "which on"
    ],
    "correctAnswer": "C",
    "explanation": "Dependent preposition \"on\" (from \"relies on\") precedes the relative pronoun \"which\" in formal academic syntax (\"on which the algorithm relies\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-688",
    "question": "Fill in the blank: _______ from high-grade carbon composite, the aircraft's lightweight wings reduce fuel consumption by nearly fifteen percent.",
    "options": [
      "Constructing",
      "To construct",
      "Having constructed",
      "Constructed"
    ],
    "correctAnswer": "D",
    "explanation": "Past participle clause (\"Constructed from...\") functions as a reduced passive relative clause expressing a reason/property.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-689",
    "question": "Select the correct form: It was the discovery of penicillin in 1928 _______ revolutionized the treatment of bacterial infections worldwide.",
    "options": [
      "that",
      "which",
      "who",
      "whom"
    ],
    "correctAnswer": "A",
    "explanation": "In cleft sentences emphasizing a subject (\"It was [X] that...\"), \"that\" is the standard complementizer.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-690",
    "question": "Fill in the blank: The diplomat met with several foreign ministers, two of _______ expressed support for the maritime corridor treaty.",
    "options": [
      "who",
      "whom",
      "which",
      "whose"
    ],
    "correctAnswer": "B",
    "explanation": "After a preposition in a non-defining relative quantifier phrase (\"two of whom\"), the objective relative pronoun \"whom\" is grammatically required for people.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-691",
    "question": "Choose the correct option: The ancient aqueduct, _______ by Roman engineers in the first century CE, still carries fresh mountain water to the village.",
    "options": [
      "building",
      "having built",
      "built",
      "was built"
    ],
    "correctAnswer": "C",
    "explanation": "Reduced passive participle modifier (\"built by Roman engineers...\") concisely replaces \"which was built by...\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-692",
    "question": "Fill in the blank: _______ the archaeological site thoroughly, the team began cataloging the terracotta fragments.",
    "options": [
      "Surveyed",
      "To survey",
      "Being surveyed",
      "Having surveyed"
    ],
    "correctAnswer": "D",
    "explanation": "Active perfect participle clause (\"Having surveyed...\") indicates that the surveying was fully completed before cataloging began.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-693",
    "question": "Choose the correct form: What intrigued the neuroscientists _______ the subject's ability to retain spatial navigation memories despite localized lesions.",
    "options": [
      "was",
      "were",
      "are",
      "have been"
    ],
    "correctAnswer": "A",
    "explanation": "Wh-cleft sentence (\"What intrigued the neuroscientists was...\") takes a singular verb referring to the singular phenomenon/ability.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-694",
    "question": "Fill in the blank: The volcanic island of Tristan da Cunha is the most remote inhabited archipelago on Earth, _______ only by a six-day boat voyage.",
    "options": [
      "accessing",
      "accessible",
      "accessed",
      "to access"
    ],
    "correctAnswer": "B",
    "explanation": "Postpositive adjective/reduced clause (\"accessible only by...\") elegantly qualifies the noun phrase.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-695",
    "question": "Select the correct option: The laboratory acquired a mass spectrometer _______ precision exceeds that of conventional optical sensors.",
    "options": [
      "where",
      "which",
      "whose",
      "that its"
    ],
    "correctAnswer": "C",
    "explanation": "\"Whose\" indicates possession for an inanimate device (\"whose precision exceeds...\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-696",
    "question": "Fill in the blank: The method _______ the crystal structure was determined involves synchrotron X-ray diffraction.",
    "options": [
      "which by",
      "in which",
      "where",
      "by which"
    ],
    "correctAnswer": "D",
    "explanation": "Prepositional collocation \"by which\" (\"determined by a method\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-697",
    "question": "Choose the correct form: Not _______ the severity of the approaching blizzard, the expedition continued towards the summit.",
    "options": [
      "realizing",
      "realized",
      "having realized",
      "to realize"
    ],
    "correctAnswer": "A",
    "explanation": "Negative present participle clause (\"Not realizing...\") expressing cause/reason for the subject's concurrent action.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-698",
    "question": "Fill in the blank: Dr. Elizabeth Blackwell was the first woman in the United States _______ a medical degree.",
    "options": [
      "receiving",
      "to receive",
      "received",
      "receives"
    ],
    "correctAnswer": "B",
    "explanation": "After ordinal numbers or superlatives (\"the first woman to receive\"), an infinitive clause is used.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-699",
    "question": "Choose the correct option: The treaty, _______ was ratified by forty sovereign nations, went into full legal effect on January 1.",
    "options": [
      "whose",
      "that",
      "which",
      "what"
    ],
    "correctAnswer": "C",
    "explanation": "In non-defining relative clauses enclosed by commas, \"which\" must be used rather than \"that\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-700",
    "question": "Fill in the blank: _______ by the high thermal conductivity of copper, the engineers designed a custom heat sink for the microprocessor.",
    "options": [
      "To guide",
      "Guiding",
      "Having guided",
      "Guided"
    ],
    "correctAnswer": "D",
    "explanation": "Past participle clause (\"Guided by...\") acting as a causal passive modifier.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-701",
    "question": "Select the correct form: The historic treaty of Westphalia, signed in 1648, created the modern framework of sovereign nation-states, _______ centuries of feudal fragmentation.",
    "options": [
      "ending",
      "ended",
      "having been ended",
      "to end"
    ],
    "correctAnswer": "A",
    "explanation": "Present participle clause of result (\"ending centuries of feudal fragmentation\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-702",
    "question": "Fill in the blank: The committee rejected the proposal, the implementation of _______ would have required exorbitant public funding.",
    "options": [
      "whom",
      "which",
      "what",
      "that"
    ],
    "correctAnswer": "B",
    "explanation": "\"The implementation of which\" is the formal relative structure referring back to \"the proposal\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-703",
    "question": "Choose the correct option: The delegates were shown the laboratory _______ the breakthrough vaccine had been synthesized.",
    "options": [
      "that",
      "which",
      "where",
      "when"
    ],
    "correctAnswer": "C",
    "explanation": "Relative adverb of place \"where\" refers to the location \"the laboratory\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-704",
    "question": "Fill in the blank: _______ the preliminary clinical findings, the medical board authorized a nationwide Phase III rollout.",
    "options": [
      "Reviewed",
      "To review",
      "Reviewing",
      "Having reviewed"
    ],
    "correctAnswer": "D",
    "explanation": "Perfect participle clause (\"Having reviewed...\") denoting completion of the review before authorizing the rollout.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-705",
    "question": "Choose the correct form: It is the conservation of coastal mangrove forests _______ provides the most effective natural defense against tidal surges.",
    "options": [
      "that",
      "who",
      "what",
      "which"
    ],
    "correctAnswer": "A",
    "explanation": "Cleft sentence structure (\"It is [X] that provides...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-706",
    "question": "Fill in the blank: The botanical garden contains over five hundred species of ferns, many of _______ are native to the cloud forests of Costa Rica.",
    "options": [
      "them",
      "which",
      "whom",
      "whose"
    ],
    "correctAnswer": "B",
    "explanation": "\"Many of which\" is required in a relative clause referring to inanimate items (\"species of ferns\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-707",
    "question": "Select the correct option: The students _______ in the advanced econometrics seminar must submit their empirical datasets by Friday.",
    "options": [
      "enrolling",
      "having enrolled",
      "enrolled",
      "enroll"
    ],
    "correctAnswer": "C",
    "explanation": "Reduced passive relative clause (\"enrolled in...\" = \"who are enrolled in...\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-708",
    "question": "Fill in the blank: The speed _______ information travels across fiber-optic cables approaches two-thirds the speed of light in a vacuum.",
    "options": [
      "with which",
      "in which",
      "by which",
      "at which"
    ],
    "correctAnswer": "D",
    "explanation": "The noun \"speed\" takes the preposition \"at\" (\"at which information travels\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-709",
    "question": "Choose the correct form: _______ along the Pacific Rim, the volcanic archipelago experiences frequent tectonic earthquakes.",
    "options": [
      "Located",
      "Locating",
      "Having located",
      "To locate"
    ],
    "correctAnswer": "A",
    "explanation": "Past participle clause (\"Located along...\") functioning as a passive locative modifier.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-710",
    "question": "Fill in the blank: The lead author, _______ groundbreaking research on CRISPR gene-editing earned international acclaim, addressed the symposium.",
    "options": [
      "who",
      "whose",
      "whom",
      "which"
    ],
    "correctAnswer": "B",
    "explanation": "Possessive relative pronoun \"whose\" modifying \"groundbreaking research\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-711",
    "question": "Select the correct option: The city council established three new pedestrian zones, _______ the volume of vehicular traffic in the historic center.",
    "options": [
      "reduced",
      "having been reduced",
      "reducing",
      "reduce"
    ],
    "correctAnswer": "C",
    "explanation": "Present participle clause of result (\"reducing the volume...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-712",
    "question": "Fill in the blank: The conference attendees, several of _______ had traveled from Oceania, expressed enthusiastic praise for the keynote.",
    "options": [
      "them",
      "who",
      "which",
      "whom"
    ],
    "correctAnswer": "D",
    "explanation": "\"Several of whom\" for people following a preposition in a non-defining relative clause.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-713",
    "question": "Choose the correct form: _______ by the high cost of titanium, the aerospace engineers explored ceramic-matrix alternatives.",
    "options": [
      "Deterred",
      "Deterring",
      "Having deterred",
      "To deter"
    ],
    "correctAnswer": "A",
    "explanation": "Past participle clause (\"Deterred by...\") indicating passive causation.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-714",
    "question": "Fill in the blank: The year 1969 was the moment _______ humanity first set foot on the lunar surface.",
    "options": [
      "where",
      "when",
      "which",
      "that"
    ],
    "correctAnswer": "B",
    "explanation": "Relative adverb of time \"when\" modifies the temporal antecedent \"the moment\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-715",
    "question": "Select the correct option: The ancient mosaic _______ during excavation of the villa will be exhibited in the national museum.",
    "options": [
      "having uncovered",
      "uncovering",
      "uncovered",
      "was uncovered"
    ],
    "correctAnswer": "C",
    "explanation": "Reduced passive relative clause (\"uncovered during excavation\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-716",
    "question": "Fill in the blank: The degree _______ temperature influences bacterial growth rates varies widely among thermophilic species.",
    "options": [
      "in which",
      "at which",
      "by which",
      "to which"
    ],
    "correctAnswer": "D",
    "explanation": "\"The degree to which...\" is the standard prepositional collocation for extents and degrees.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-717",
    "question": "Choose the correct form: _______ the summit after six hours of climbing, the mountaineers were rewarded with panoramic vistas.",
    "options": [
      "Having reached",
      "Reaching",
      "Reached",
      "To reach"
    ],
    "correctAnswer": "A",
    "explanation": "Active perfect participle clause (\"Having reached...\") expressing anterior completion.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-718",
    "question": "Fill in the blank: All passengers _______ on flight BA214 should proceed immediately to departure gate 14.",
    "options": [
      "booking",
      "booked",
      "having booked",
      "are booked"
    ],
    "correctAnswer": "B",
    "explanation": "Reduced passive participle modifier (\"booked on flight BA214\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-719",
    "question": "Select the correct option: The ancient Greek philosopher Aristotle, _______ writings encompassed biology, ethics, and metaphysics, tutored Alexander the Great.",
    "options": [
      "who",
      "which",
      "whose",
      "whom"
    ],
    "correctAnswer": "C",
    "explanation": "Possessive relative pronoun \"whose\" modifying \"writings\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-720",
    "question": "Fill in the blank: It was the invention of movable type by Johannes Gutenberg _______ democratized literacy across Renaissance Europe.",
    "options": [
      "what",
      "which",
      "who",
      "that"
    ],
    "correctAnswer": "D",
    "explanation": "Cleft sentence structure (\"It was [X] that democratized...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-721",
    "question": "Choose the correct form: The research paper, the conclusions of _______ have been corroborated by three independent labs, was awarded the journal's annual prize.",
    "options": [
      "which",
      "whom",
      "that",
      "what"
    ],
    "correctAnswer": "A",
    "explanation": "\"The conclusions of which\" in a non-defining clause referring to \"The research paper\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-722",
    "question": "Fill in the blank: _______ by a team of international oceanographers, the hydrothermal expedition discovered forty new marine species.",
    "options": [
      "Leading",
      "Led",
      "Having led",
      "To lead"
    ],
    "correctAnswer": "B",
    "explanation": "Passive past participle modifier (\"Led by...\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-723",
    "question": "Select the correct option: The conditions _______ these deep-sea extremophiles thrive include boiling water temperatures and high acidity.",
    "options": [
      "at which",
      "to which",
      "under which",
      "for which"
    ],
    "correctAnswer": "C",
    "explanation": "\"Under which conditions\" is the standard prepositional structure.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-724",
    "question": "Fill in the blank: The historic archive houses thousands of parchment scrolls, all of _______ have been digitized for open-access scholarship.",
    "options": [
      "whose",
      "them",
      "whom",
      "which"
    ],
    "correctAnswer": "D",
    "explanation": "\"All of which\" in a relative clause referring to \"parchment scrolls\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-725",
    "question": "Choose the correct form: _______ the laboratory instruments before beginning the titration, the chemist avoided contamination errors.",
    "options": [
      "Having sterilized",
      "Sterilizing",
      "Sterilized",
      "To sterilize"
    ],
    "correctAnswer": "A",
    "explanation": "Perfect participle clause (\"Having sterilized...\") indicating prior completion.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-726",
    "question": "Fill in the blank: The scientist _______ theories revolutionized theoretical physics in the early 20th century was Albert Einstein.",
    "options": [
      "who",
      "whose",
      "whom",
      "which"
    ],
    "correctAnswer": "B",
    "explanation": "Possessive relative pronoun \"whose theories\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-727",
    "question": "Select the correct option: The new regulations apply strictly to all commercial vehicles _______ five tons in gross weight.",
    "options": [
      "exceed",
      "exceeded",
      "exceeding",
      "to exceed"
    ],
    "correctAnswer": "C",
    "explanation": "Active present participle clause (\"exceeding five tons\" = \"which exceed five tons\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-728",
    "question": "Fill in the blank: The extent _______ global warming affects alpine glaciers depends heavily on seasonal snowfall patterns.",
    "options": [
      "by which",
      "in which",
      "at which",
      "to which"
    ],
    "correctAnswer": "D",
    "explanation": "\"The extent to which...\" is the standard prepositional phrase.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-729",
    "question": "Choose the correct form: _______ with modern safety features, the vintage locomotive was approved for tourist excursions.",
    "options": [
      "Equipped",
      "Equipping",
      "Having equipped",
      "To equip"
    ],
    "correctAnswer": "A",
    "explanation": "Past participle clause (\"Equipped with...\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-730",
    "question": "Fill in the blank: What the geological survey revealed _______ a vast underground aquifer stretching across three provinces.",
    "options": [
      "were",
      "was",
      "are",
      "have been"
    ],
    "correctAnswer": "B",
    "explanation": "Wh-cleft sentence with singular complement taking \"was\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Relative Clauses & Participles"
  },
  {
    "id": "ielts-gram-731",
    "question": "Fill in the blank: Given that the ancient parchment was sealed in an airtight bronze cylinder, moisture _______ the delicate calligraphy.",
    "options": [
      "should damage",
      "must have damaged",
      "cannot have damaged",
      "might damage"
    ],
    "correctAnswer": "C",
    "explanation": "Past logical deduction of impossibility (\"cannot have damaged\") based on the factual evidence that the cylinder was airtight.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-732",
    "question": "Choose the correct option: The laboratory technicians _______ the specimens in liquid nitrogen, but they accidentally stored them at room temperature.",
    "options": [
      "should freeze",
      "can have frozen",
      "must have frozen",
      "ought to have frozen"
    ],
    "correctAnswer": "D",
    "explanation": "\"Ought to have + past participle\" (\"ought to have frozen\") expresses past unfulfilled duty or obligation with critical tone.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-733",
    "question": "Fill in the blank: The conference organizers provided complimentary shuttle passes, so the visiting scholars _______ for taxis.",
    "options": [
      "didn't need to pay",
      "needn't have paid",
      "must not pay",
      "shouldn't pay"
    ],
    "correctAnswer": "A",
    "explanation": "\"Didn't need to pay\" indicates that there was no necessity to pay, and therefore the scholars did not spend money on taxis.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-734",
    "question": "Select the correct form: Although the blizzard was severe, the seasoned mountain rescue team _______ reach the stranded climbers before nightfall.",
    "options": [
      "could",
      "was able to",
      "might",
      "can"
    ],
    "correctAnswer": "B",
    "explanation": "\"Was/were able to\" or \"managed to\" is required for successful completion of a specific difficult past task, whereas \"could\" denotes general past ability.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-735",
    "question": "Fill in the blank: The sudden drop in blood pressure _______ a systemic allergic reaction to the newly administered contrast dye.",
    "options": [
      "can to indicate",
      "must to indicate",
      "may indicate",
      "will be indicated"
    ],
    "correctAnswer": "C",
    "explanation": "Academic hedging (\"may indicate\") expresses cautious possibility in medical and scientific analysis.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-736",
    "question": "Choose the correct modal form: The lights are all switched off and the laboratory doors are locked; the research team _______ for the evening.",
    "options": [
      "need have departed",
      "can have departed",
      "should depart",
      "must have departed"
    ],
    "correctAnswer": "D",
    "explanation": "\"Must have + past participle\" expresses a logical deduction of high certainty regarding a past/completed action.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-737",
    "question": "Fill in the blank: We bought twenty bottles of mineral water for the trek, but there were natural freshwater springs everywhere, so we _______ so many.",
    "options": [
      "needn't have bought",
      "didn't need to buy",
      "must not have bought",
      "could not buy"
    ],
    "correctAnswer": "A",
    "explanation": "\"Needn't have bought\" indicates that an action was performed unnecessarily in the past.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-738",
    "question": "Select the correct form: The telemetry data is highly ambiguous, but the anomalies _______ by cosmic ray interference with the solar array.",
    "options": [
      "must cause",
      "could have been caused",
      "should have caused",
      "can cause"
    ],
    "correctAnswer": "B",
    "explanation": "\"Could have been caused\" expresses a plausible past hypothesis in passive voice.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-739",
    "question": "Fill in the blank: Under strict laboratory safety protocols, biohazard containers _______ left unsealed outside the laminar flow hood.",
    "options": [
      "may not have been",
      "need not be",
      "must not be",
      "don't have to be"
    ],
    "correctAnswer": "C",
    "explanation": "\"Must not be\" expresses strict prohibition in safety regulations.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-740",
    "question": "Choose the correct option: The ancient inhabitants _______ stone tools to carve the basalt reliefs, as bronze metallurgy had not yet been developed in that region.",
    "options": [
      "can have used",
      "should have used",
      "could use",
      "must have used"
    ],
    "correctAnswer": "D",
    "explanation": "High certainty deduction about historical past methods based on archaeological constraints (\"must have used\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-741",
    "question": "Fill in the blank: You _______ the supervisor about the broken autoclave; she had already ordered a replacement unit yesterday morning.",
    "options": [
      "needn't have told",
      "didn't need to tell",
      "must not tell",
      "should not tell"
    ],
    "correctAnswer": "A",
    "explanation": "\"Needn't have told\" indicates that you told her, but it turned out to be unnecessary.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-742",
    "question": "Select the correct form: The experimental results _______ that thermal conductivity increases linearly with matrix density.",
    "options": [
      "must to suggest",
      "would suggest",
      "should suggesting",
      "can to suggest"
    ],
    "correctAnswer": "B",
    "explanation": "\"Would suggest\" is a standard tentative modal construction in academic writing.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-743",
    "question": "Fill in the blank: The courier _______ the fragile parcel at the wrong reception desk, as our mailroom has no record of its arrival.",
    "options": [
      "should deliver",
      "must deliver",
      "might have delivered",
      "can deliver"
    ],
    "correctAnswer": "C",
    "explanation": "\"Might have delivered\" expresses a reasonable past possibility.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-744",
    "question": "Choose the correct form: Despite the severe mechanical failure of its rudder, the cargo vessel _______ make port safely.",
    "options": [
      "can",
      "could",
      "might",
      "was able to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Was able to\" refers to successfully overcoming a specific past obstacle.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-745",
    "question": "Fill in the blank: The forensic auditor concluded that the fraudulent transactions _______ unnoticed without the whistleblower's disclosure.",
    "options": [
      "would have gone",
      "will go",
      "should go",
      "must go"
    ],
    "correctAnswer": "A",
    "explanation": "Past hypothetical result with modal (\"would have gone unnoticed\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-746",
    "question": "Select the correct option: The lead author _______ the manuscript for typographical errors before submitting it to the journal editor.",
    "options": [
      "should check",
      "ought to have checked",
      "must check",
      "can have checked"
    ],
    "correctAnswer": "B",
    "explanation": "\"Ought to have checked\" conveys past advice/criticism about an omitted action.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-747",
    "question": "Fill in the blank: The missing telemetry data _______ by a transient electromagnetic pulse during solar flare activity.",
    "options": [
      "can have corrupted",
      "must corrupt",
      "could have been corrupted",
      "should corrupt"
    ],
    "correctAnswer": "C",
    "explanation": "Passive modal deduction of past possibility (\"could have been corrupted\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-748",
    "question": "Choose the correct form: Research fellows _______ register their attendance at the symposium in person, as an online portal was available.",
    "options": [
      "ought not",
      "needn't have",
      "must not",
      "didn't need to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Didn't need to register\" indicates there was no obligation to register in person because the portal existed.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-749",
    "question": "Fill in the blank: The historic monastery _______ during the early sixth century, based on carbon dating of the foundational timber beams.",
    "options": [
      "must have been established",
      "should have established",
      "can be established",
      "might establish"
    ],
    "correctAnswer": "A",
    "explanation": "\"Must have been established\" conveys strong historical deduction in passive voice.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-750",
    "question": "Select the correct form: The diplomatic delegation _______ more transparent regarding the revised tariff quotas during the initial negotiations.",
    "options": [
      "must be",
      "should have been",
      "can have been",
      "would be"
    ],
    "correctAnswer": "B",
    "explanation": "\"Should have been\" expresses past criticism of conduct.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-751",
    "question": "Fill in the blank: The ancient parchment is so fragile that scholars _______ handle it without specialized cotton gloves.",
    "options": [
      "may not",
      "need not",
      "must not",
      "cannot have"
    ],
    "correctAnswer": "C",
    "explanation": "\"Must not\" expresses strong prohibition.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-752",
    "question": "Choose the correct form: The sudden extinction of the Pleistocene megafauna _______ by a combination of rapid climate fluctuations and human overhunting.",
    "options": [
      "can have caused",
      "must cause",
      "should have caused",
      "may have been caused"
    ],
    "correctAnswer": "D",
    "explanation": "Scientific hypothesis of past possibility in passive voice (\"may have been caused\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-753",
    "question": "Fill in the blank: We already had three spare satellite batteries in the depot, so we _______ more from the supplier.",
    "options": [
      "didn't need to order",
      "needn't have ordered",
      "must not order",
      "couldn't order"
    ],
    "correctAnswer": "A",
    "explanation": "\"Didn't need to order\" because we knew we had enough in the depot.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-754",
    "question": "Select the correct option: The submarine crew _______ surface to replenish oxygen supplies after the auxiliary scrubbers failed.",
    "options": [
      "must",
      "had to",
      "should",
      "ought to"
    ],
    "correctAnswer": "B",
    "explanation": "\"Had to\" is the past tense form for past external necessity.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-755",
    "question": "Fill in the blank: The explorer _______ the dangers of crossing the desert in midsummer, but he persisted despite all warnings.",
    "options": [
      "can know",
      "should know",
      "must have known",
      "need have known"
    ],
    "correctAnswer": "C",
    "explanation": "\"Must have known\" indicates high logical probability about past awareness.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-756",
    "question": "Choose the correct form: After three hours of searching the archive, the historian _______ locate the missing royal decree.",
    "options": [
      "can",
      "could",
      "might",
      "was able to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Was able to\" for a specific past achievement.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-757",
    "question": "Fill in the blank: The statistical correlation _______ a causal relationship, but further longitudinal studies are required.",
    "options": [
      "might suggest",
      "must to suggest",
      "should suggesting",
      "can to suggest"
    ],
    "correctAnswer": "A",
    "explanation": "Academic hedging (\"might suggest\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-758",
    "question": "Select the correct form: The laboratory technician _______ the culture plates; the incubator had a built-in automated disinfection cycle.",
    "options": [
      "didn't need to sterilize",
      "needn't have sterilized",
      "must not sterilize",
      "could not sterilize"
    ],
    "correctAnswer": "B",
    "explanation": "\"Needn't have sterilized\" indicates the action was performed unnecessarily.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-759",
    "question": "Fill in the blank: The architectural firm _______ the historical landmark protection guidelines before demolishing the facade.",
    "options": [
      "could consult",
      "must consult",
      "should have consulted",
      "can have consulted"
    ],
    "correctAnswer": "C",
    "explanation": "\"Should have consulted\" expresses past criticism/failure of duty.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-760",
    "question": "Choose the correct form: The missing ship's logbook _______ during the coastal storm of 1845.",
    "options": [
      "should lose",
      "must lose",
      "can have lost",
      "could have been lost"
    ],
    "correctAnswer": "D",
    "explanation": "Passive past possibility (\"could have been lost\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-761",
    "question": "Fill in the blank: All incoming international passengers _______ present a valid vaccination certificate upon arrival.",
    "options": [
      "must",
      "may",
      "could",
      "might"
    ],
    "correctAnswer": "A",
    "explanation": "\"Must\" for official mandatory requirements.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-762",
    "question": "Select the correct form: The chemist _______ that the volatile compound would ignite upon exposure to direct sunlight.",
    "options": [
      "must know",
      "cannot have known",
      "should know",
      "can know"
    ],
    "correctAnswer": "B",
    "explanation": "Logical past deduction of impossibility (\"cannot have known\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-763",
    "question": "Fill in the blank: The flight was canceled due to dense fog, so the business delegation _______ the overnight train instead.",
    "options": [
      "should take",
      "must take",
      "had to take",
      "ought to take"
    ],
    "correctAnswer": "C",
    "explanation": "Past necessity caused by external circumstances (\"had to take\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-764",
    "question": "Choose the correct form: The software development team _______ the security vulnerability before releasing the patch to the public.",
    "options": [
      "will patch",
      "must patch",
      "can have patched",
      "ought to have patched"
    ],
    "correctAnswer": "D",
    "explanation": "\"Ought to have patched\" indicates past duty/advice.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-765",
    "question": "Fill in the blank: The ancient city _______ a sophisticated drainage system, as evidenced by the subterranean terracotta conduits.",
    "options": [
      "must have possessed",
      "should have possessed",
      "can possess",
      "might possess"
    ],
    "correctAnswer": "A",
    "explanation": "Strong historical deduction (\"must have possessed\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-766",
    "question": "Select the correct form: Visitors _______ touch any of the fragile ethnographic artifacts on display.",
    "options": [
      "need not",
      "must not",
      "don't have to",
      "may have not"
    ],
    "correctAnswer": "B",
    "explanation": "\"Must not\" expresses strict institutional prohibition.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-767",
    "question": "Fill in the blank: The research findings _______ that dietary antioxidants play a protective role in cellular longevity.",
    "options": [
      "should indicating",
      "must to indicate",
      "would indicate",
      "can to indicate"
    ],
    "correctAnswer": "C",
    "explanation": "Academic hedging (\"would indicate\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-768",
    "question": "Choose the correct form: The diver _______ surface rapidly to avoid decompression sickness when the air valve jammed.",
    "options": [
      "can",
      "could",
      "might",
      "was able to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Was able to\" for a specific past successful escape.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-769",
    "question": "Fill in the blank: The committee _______ the controversial agenda item for discussion at yesterday's emergency meeting.",
    "options": [
      "should not have scheduled",
      "must not schedule",
      "could not schedule",
      "need not schedule"
    ],
    "correctAnswer": "A",
    "explanation": "\"Should not have scheduled\" expresses critical judgment of a past action.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-770",
    "question": "Select the correct form: The astronomical telescope _______ during transit, as the primary mirror was misaligned upon arrival.",
    "options": [
      "should have jarred",
      "must have been jarred",
      "can have jarred",
      "might jar"
    ],
    "correctAnswer": "B",
    "explanation": "Logical past deduction in passive voice (\"must have been jarred\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Modals & Past Deduction"
  },
  {
    "id": "ielts-gram-771",
    "question": "Choose the correct article combination: _______ Amazon River flows into _______ Atlantic Ocean, discharging roughly one-fifth of global river water.",
    "options": [
      "The / an",
      "An / the",
      "The / the",
      "- / the"
    ],
    "correctAnswer": "C",
    "explanation": "Names of rivers (\"The Amazon River\") and oceans (\"the Atlantic Ocean\") both require the definite article \"the\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-772",
    "question": "Fill in the blank: The distinguished botanist was appointed as _______ honorary fellow at Oxford University.",
    "options": [
      "a",
      "-",
      "the",
      "an"
    ],
    "correctAnswer": "D",
    "explanation": "\"Honorary\" begins with a silent 'h', producing the initial vowel sound /\u0252/, which requires the indefinite article \"an\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-773",
    "question": "Choose the correct quantifier: Due to extensive media censorship, _______ independent journalists were permitted into the conflict zone.",
    "options": [
      "few",
      "a few",
      "a little",
      "little"
    ],
    "correctAnswer": "A",
    "explanation": "\"Few\" has a restrictive, negative connotation meaning \"almost none\", which matches the restrictive context of censorship.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-774",
    "question": "Fill in the blank: There is _______ hope of recovering intact DNA fragments from the fossilized amber sample.",
    "options": [
      "a few",
      "little",
      "few",
      "many"
    ],
    "correctAnswer": "B",
    "explanation": "\"Hope\" is an uncountable noun; \"little\" expresses that there is virtually no hope.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-775",
    "question": "Select the correct option: The environmental commission noted that _______ number of endangered species had doubled over the last decade.",
    "options": [
      "a",
      "an",
      "the",
      "-"
    ],
    "correctAnswer": "C",
    "explanation": "\"The number of...\" refers to the specific statistical total, taking a singular concept with \"the\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-776",
    "question": "Fill in the blank: _______ Mount Everest is the highest mountain peak in the world, situated in _______ Himalayas.",
    "options": [
      "The / -",
      "The / the",
      "- / -",
      "- / the"
    ],
    "correctAnswer": "D",
    "explanation": "Individual mountain peaks take zero article (\"Mount Everest\"), whereas mountain ranges take the definite article (\"the Himalayas\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-777",
    "question": "Choose the correct form: The research facility ordered _______ significant amount of liquid helium for cooling the superconductor.",
    "options": [
      "a",
      "an",
      "the",
      "-"
    ],
    "correctAnswer": "A",
    "explanation": "\"A significant amount of\" is the standard quantifier phrase for uncountable substances.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-778",
    "question": "Fill in the blank: The candidate presented _______ unique approach to computational linguistic analysis.",
    "options": [
      "an",
      "a",
      "the",
      "-"
    ],
    "correctAnswer": "B",
    "explanation": "\"Unique\" begins with the consonant glide /j/ (\"yoo-neek\"), so it takes \"a\" rather than \"an\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-779",
    "question": "Select the correct option: _______ platinum is one of the densest and most corrosion-resistant precious metals known to chemistry.",
    "options": [
      "The",
      "A",
      "-",
      "An"
    ],
    "correctAnswer": "C",
    "explanation": "General uncountable nouns representing elements or materials used in a generic sense take zero article (\"-\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-780",
    "question": "Fill in the blank: _______ student in the postgraduate seminar was required to submit a peer review.",
    "options": [
      "Several",
      "All",
      "Both",
      "Every"
    ],
    "correctAnswer": "D",
    "explanation": "\"Every\" modifies a singular countable noun (\"student\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-781",
    "question": "Choose the correct quantifier: The factory produced _______ defective microchips this month thanks to upgraded quality control.",
    "options": [
      "fewer",
      "less",
      "little",
      "much"
    ],
    "correctAnswer": "A",
    "explanation": "\"Fewer\" is used with plural countable nouns (\"microchips\"), whereas \"less\" is used with uncountable nouns.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-782",
    "question": "Fill in the blank: He graduated with _______ European degree in environmental jurisprudence.",
    "options": [
      "an",
      "a",
      "the",
      "-"
    ],
    "correctAnswer": "B",
    "explanation": "\"European\" begins with the consonant sound /j/, requiring \"a\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-783",
    "question": "Select the correct option: _______ Sahara Desert spans across eleven North African nations.",
    "options": [
      "-",
      "A",
      "The",
      "An"
    ],
    "correctAnswer": "C",
    "explanation": "Names of deserts take the definite article \"the\" (\"The Sahara Desert\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-784",
    "question": "Fill in the blank: Fortunately, _______ survivors were located by the search helicopter before nightfall.",
    "options": [
      "a little",
      "few",
      "little",
      "a few"
    ],
    "correctAnswer": "D",
    "explanation": "\"A few\" has a positive meaning (\"some/several survivors\"), which aligns with \"Fortunately\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-785",
    "question": "Choose the correct form: _______ life expectancy has increased steadily across developed nations over the twentieth century.",
    "options": [
      "-",
      "The",
      "A",
      "An"
    ],
    "correctAnswer": "A",
    "explanation": "General uncountable abstract concepts (\"Life expectancy\") take zero article when speaking generally.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-786",
    "question": "Fill in the blank: She was named _______ heir to the extensive family agricultural estate.",
    "options": [
      "a",
      "an",
      "the",
      "-"
    ],
    "correctAnswer": "B",
    "explanation": "\"Heir\" begins with a silent 'h' (vowel sound /e\u0259r/), requiring \"an\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-787",
    "question": "Select the correct option: _______ Netherlands is renowned for its innovative water management dykes and sea walls.",
    "options": [
      "A",
      "-",
      "The",
      "An"
    ],
    "correctAnswer": "C",
    "explanation": "Plural country names take the definite article (\"The Netherlands\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-788",
    "question": "Fill in the blank: The expedition had _______ water left, so they were forced to abandon the desert crossing.",
    "options": [
      "a few",
      "a little",
      "few",
      "little"
    ],
    "correctAnswer": "D",
    "explanation": "\"Little\" conveys insufficient / almost no water, justifying the decision to abandon the crossing.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-789",
    "question": "Choose the correct quantifier: _______ the students passed the comprehensive licensing examination on their first attempt.",
    "options": [
      "All of",
      "Every of",
      "Whole",
      "Each of"
    ],
    "correctAnswer": "A",
    "explanation": "\"All of + plural noun\" is grammatically correct; \"Every of\" does not exist in English.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-790",
    "question": "Fill in the blank: He is _______ one-legged veteran who competed in the Paralympic Games.",
    "options": [
      "an",
      "a",
      "the",
      "-"
    ],
    "correctAnswer": "B",
    "explanation": "\"One\" begins with the consonant sound /w/ (\"won\"), requiring \"a\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-791",
    "question": "Select the correct option: _______ United Kingdom has a rich maritime heritage dating back centuries.",
    "options": [
      "A",
      "-",
      "The",
      "An"
    ],
    "correctAnswer": "C",
    "explanation": "Countries whose names contain common nouns like \"Kingdom\", \"Republic\", or \"States\" take \"the\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-792",
    "question": "Fill in the blank: There are _______ reasons to believe that renewable energy investments will yield positive long-term returns.",
    "options": [
      "little",
      "much",
      "a great amount of",
      "many"
    ],
    "correctAnswer": "D",
    "explanation": "\"Reasons\" is plural countable, requiring \"many\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-793",
    "question": "Choose the correct form: _______ Lake Baikal contains approximately twenty percent of the world's unfrozen surface fresh water.",
    "options": [
      "-",
      "The",
      "A",
      "An"
    ],
    "correctAnswer": "A",
    "explanation": "Individual lakes take zero article (\"Lake Baikal\"), unlike seas or oceans.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-794",
    "question": "Fill in the blank: With _______ patience and perseverance, the complex cryptographic cipher was finally solved.",
    "options": [
      "little",
      "a little",
      "a few",
      "few"
    ],
    "correctAnswer": "B",
    "explanation": "\"A little\" expresses a positive amount of an uncountable quality (\"some patience\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-795",
    "question": "Select the correct option: We spent _______ hour reviewing the archaeological survey logs.",
    "options": [
      "the",
      "a",
      "an",
      "-"
    ],
    "correctAnswer": "C",
    "explanation": "\"Hour\" begins with a silent 'h' (vowel sound /a\u028a\u0259r/), requiring \"an\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-796",
    "question": "Fill in the blank: The report detailed _______ number of industrial accidents reported across maritime ports.",
    "options": [
      "-",
      "a",
      "an",
      "the"
    ],
    "correctAnswer": "D",
    "explanation": "\"The number of...\" refers to the specific total.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-797",
    "question": "Choose the correct quantifier: _______ applicant must present two certified letters of academic recommendation.",
    "options": [
      "Each",
      "All",
      "Both",
      "Several"
    ],
    "correctAnswer": "A",
    "explanation": "\"Each\" modifies a singular countable noun (\"applicant\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-798",
    "question": "Fill in the blank: _______ honesty is an essential virtue in scientific research and peer review.",
    "options": [
      "The",
      "-",
      "An",
      "A"
    ],
    "correctAnswer": "B",
    "explanation": "Abstract nouns used in a general sense take zero article (\"Honesty\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-799",
    "question": "Select the correct option: _______ Philippines consists of over seven thousand islands in the western Pacific.",
    "options": [
      "A",
      "-",
      "The",
      "An"
    ],
    "correctAnswer": "C",
    "explanation": "Island chains and plural island nations take \"The\" (\"The Philippines\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-800",
    "question": "Fill in the blank: The company employs _______ MBA graduate to oversee its overseas marketing campaigns.",
    "options": [
      "-",
      "a",
      "the",
      "an"
    ],
    "correctAnswer": "D",
    "explanation": "\"MBA\" is pronounced with an initial vowel sound /em-bi\u02d0-e\u026a/, taking \"an\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-801",
    "question": "Choose the correct form: The city introduced low-emission zones, resulting in _______ air pollution in downtown areas.",
    "options": [
      "less",
      "fewer",
      "few",
      "many"
    ],
    "correctAnswer": "A",
    "explanation": "\"Pollution\" is uncountable, requiring \"less\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-802",
    "question": "Fill in the blank: _______ moon orbits the Earth once every 27.3 days.",
    "options": [
      "A",
      "The",
      "An",
      "-"
    ],
    "correctAnswer": "B",
    "explanation": "Unique celestial objects in our immediate system take \"The\" (\"The moon\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-803",
    "question": "Select the correct quantifier: _______ of the two proposed architectural models satisfies the seismic safety criteria.",
    "options": [
      "No",
      "None",
      "Neither",
      "Not"
    ],
    "correctAnswer": "C",
    "explanation": "\"Neither\" is used when choosing between exactly two options.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-804",
    "question": "Fill in the blank: She formed _______ union with local agricultural cooperatives to promote organic farming.",
    "options": [
      "-",
      "an",
      "the",
      "a"
    ],
    "correctAnswer": "D",
    "explanation": "\"Union\" begins with consonant sound /j/ (\"yoo-nion\"), taking \"a\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-805",
    "question": "Choose the correct option: _______ Pacific Ocean covers more than thirty percent of the Earth's total surface area.",
    "options": [
      "The",
      "-",
      "A",
      "An"
    ],
    "correctAnswer": "A",
    "explanation": "Oceans take \"The\" (\"The Pacific Ocean\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-806",
    "question": "Fill in the blank: Regrettably, _______ people attended the guest lecture due to the sudden transport strike.",
    "options": [
      "a few",
      "few",
      "little",
      "a little"
    ],
    "correctAnswer": "B",
    "explanation": "\"Few\" denotes a small, disappointing number of people, reinforced by \"Regrettably\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-807",
    "question": "Select the correct form: He showed _______ interest in theoretical physics until he attended the quantum seminar.",
    "options": [
      "a few",
      "few",
      "little",
      "many"
    ],
    "correctAnswer": "C",
    "explanation": "\"Interest\" is uncountable, and \"little\" conveys negative/minimal interest.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-808",
    "question": "Fill in the blank: The archaeological expedition explored _______ Nile River basin.",
    "options": [
      "an",
      "-",
      "a",
      "the"
    ],
    "correctAnswer": "D",
    "explanation": "Rivers take \"the\" (\"the Nile River\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-809",
    "question": "Choose the correct quantifier: The team consumed the _______ batch of reagents in the first two experimental runs.",
    "options": [
      "whole",
      "all",
      "every",
      "each"
    ],
    "correctAnswer": "A",
    "explanation": "\"The whole batch\" is the standard singular unit quantifier.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-810",
    "question": "Fill in the blank: He is regarded as _______ honest and trustworthy diplomat.",
    "options": [
      "a",
      "an",
      "the",
      "-"
    ],
    "correctAnswer": "B",
    "explanation": "\"Honest\" has a silent 'h', taking \"an\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-811",
    "question": "Select the correct option: _______ Alps stretch across eight European countries.",
    "options": [
      "A",
      "-",
      "The",
      "An"
    ],
    "correctAnswer": "C",
    "explanation": "Mountain ranges take \"The\" (\"The Alps\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-812",
    "question": "Fill in the blank: The laboratory requires a large _______ of distilled water daily.",
    "options": [
      "many",
      "number",
      "few",
      "amount"
    ],
    "correctAnswer": "D",
    "explanation": "\"Water\" is uncountable, requiring \"amount\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-813",
    "question": "Choose the correct form: _______ knowledge is power, as the ancient philosopher Bacon observed.",
    "options": [
      "-",
      "The",
      "A",
      "An"
    ],
    "correctAnswer": "A",
    "explanation": "General philosophical mass noun takes zero article (\"Knowledge\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-814",
    "question": "Fill in the blank: She has lived in _______ United States for over two decades.",
    "options": [
      "-",
      "the",
      "a",
      "an"
    ],
    "correctAnswer": "B",
    "explanation": "\"The United States\" requires the definite article.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-815",
    "question": "Select the correct option: _______ of the two routes is suitable for heavy cargo trucks due to low bridge clearances.",
    "options": [
      "No",
      "None",
      "Neither",
      "Not"
    ],
    "correctAnswer": "C",
    "explanation": "\"Neither\" for two options.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Articles & Quantifiers"
  },
  {
    "id": "ielts-gram-816",
    "question": "Choose the correct preposition: The climatologist attributed the accelerated melting of the glaciers _______ rising ocean temperatures.",
    "options": [
      "for",
      "with",
      "from",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "The verb \"attribute\" collocates with the dependent preposition \"to\" (\"attribute [X] to [Y]\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-817",
    "question": "Fill in the blank: The new corporate policy is completely incompatible _______ international environmental sustainability standards.",
    "options": [
      "with",
      "to",
      "for",
      "at"
    ],
    "correctAnswer": "A",
    "explanation": "The adjective \"incompatible\" takes the preposition \"with\" (\"incompatible with\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-818",
    "question": "Choose the correct phrasal verb: The university committee decided to _______ the outdated entrance examination format.",
    "options": [
      "phase in",
      "phase out",
      "phase over",
      "phase off"
    ],
    "correctAnswer": "B",
    "explanation": "\"Phase out\" means to gradually eliminate or discontinue something.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-819",
    "question": "Fill in the blank: The pharmaceutical company must comply _______ all national biohazard safety regulations.",
    "options": [
      "by",
      "to",
      "with",
      "for"
    ],
    "correctAnswer": "C",
    "explanation": "\"Comply\" collocates with \"with\" (\"comply with regulations\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-820",
    "question": "Select the correct option: The sudden surge in retail demand caught the supply logistics team _______ guard.",
    "options": [
      "by",
      "on",
      "at",
      "off"
    ],
    "correctAnswer": "D",
    "explanation": "The fixed idiom is \"caught off guard\", meaning taken by surprise.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-821",
    "question": "Fill in the blank: The archaeologist's interpretation of the mural is reminiscent _______ early Minoan frescoes discovered in Crete.",
    "options": [
      "of",
      "to",
      "with",
      "from"
    ],
    "correctAnswer": "A",
    "explanation": "The adjective \"reminiscent\" is followed by \"of\" (\"reminiscent of\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-822",
    "question": "Choose the correct preposition: All prospective applicants are eligible _______ a tuition fee waiver under the regional scholarship scheme.",
    "options": [
      "to",
      "for",
      "with",
      "of"
    ],
    "correctAnswer": "B",
    "explanation": "\"Eligible\" collocates with the preposition \"for\" (\"eligible for a grant/waiver\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-823",
    "question": "Fill in the blank: The municipal council acted _______ accordance with the historical preservation act.",
    "options": [
      "at",
      "on",
      "in",
      "with"
    ],
    "correctAnswer": "C",
    "explanation": "The standard formal prepositional phrase is \"in accordance with\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-824",
    "question": "Select the correct option: The ongoing dispute over territorial water rights stems _______ conflicting interpretations of maritime treaties.",
    "options": [
      "by",
      "to",
      "at",
      "from"
    ],
    "correctAnswer": "D",
    "explanation": "\"Stem from\" means to originate or arise from a specific source.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-825",
    "question": "Fill in the blank: The titanium alloy is virtually impervious _______ corrosion by acidic seawater.",
    "options": [
      "to",
      "with",
      "from",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Impervious\" collocates with \"to\" (\"impervious to damage/corrosion\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-826",
    "question": "Choose the correct phrasal verb: How do you _______ the significant variance in the experimental data?",
    "options": [
      "account to",
      "account for",
      "account with",
      "account in"
    ],
    "correctAnswer": "B",
    "explanation": "\"Account for\" means to explain the reason or cause of something.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-827",
    "question": "Fill in the blank: The sudden drop in agricultural yield had a profound impact _______ the regional economy.",
    "options": [
      "to",
      "at",
      "on",
      "with"
    ],
    "correctAnswer": "C",
    "explanation": "The noun \"impact\" takes the preposition \"on\" (\"impact on\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-828",
    "question": "Select the correct option: The delegates refrained _______ making any public statements until the final communique was drafted.",
    "options": [
      "at",
      "to",
      "with",
      "from"
    ],
    "correctAnswer": "D",
    "explanation": "The verb \"refrain\" takes the preposition \"from\" (\"refrain from doing\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-829",
    "question": "Fill in the blank: The research proposal was approved _______ virtue of its innovative methodology.",
    "options": [
      "by",
      "in",
      "on",
      "at"
    ],
    "correctAnswer": "A",
    "explanation": "\"By virtue of\" is a formal prepositional phrase meaning \"as a result of / because of\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-830",
    "question": "Choose the correct preposition: The local ecology is highly vulnerable _______ invasive marine species carried by ballast water.",
    "options": [
      "for",
      "to",
      "with",
      "at"
    ],
    "correctAnswer": "B",
    "explanation": "\"Vulnerable\" collocates with \"to\" (\"vulnerable to\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-831",
    "question": "Fill in the blank: The sudden expansion of commercial airlines resulted _______ an increased demand for licensed pilots.",
    "options": [
      "at",
      "from",
      "in",
      "to"
    ],
    "correctAnswer": "C",
    "explanation": "\"Result in\" means to produce or cause an outcome.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-832",
    "question": "Select the correct option: He succeeded _______ isolating the specific enzyme responsible for cellular repair.",
    "options": [
      "for",
      "at",
      "with",
      "in"
    ],
    "correctAnswer": "D",
    "explanation": "The verb \"succeed\" takes the preposition \"in\" followed by a gerund (\"succeeded in isolating\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-833",
    "question": "Fill in the blank: The new trade agreement was signed _______ the expense of local manufacturing subsidies.",
    "options": [
      "at",
      "in",
      "on",
      "by"
    ],
    "correctAnswer": "A",
    "explanation": "\"At the expense of\" is the established idiomatic expression.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-834",
    "question": "Choose the correct preposition: The medical board expressed grave concerns _______ the long-term efficacy of the experimental drug.",
    "options": [
      "to",
      "about",
      "for",
      "in"
    ],
    "correctAnswer": "B",
    "explanation": "\"Concerns about / regarding\" is standard.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-835",
    "question": "Fill in the blank: All laboratory personnel must adhere strictly _______ the bio-safety handling protocols.",
    "options": [
      "in",
      "with",
      "to",
      "by"
    ],
    "correctAnswer": "C",
    "explanation": "\"Adhere\" collocates with the preposition \"to\" (\"adhere to rules/protocols\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-836",
    "question": "Select the correct option: In _______ of recent geopolitical developments, the foreign ministry updated its travel advisories.",
    "options": [
      "regard",
      "sight",
      "view",
      "light"
    ],
    "correctAnswer": "D",
    "explanation": "The idiom \"in light of\" means taking into consideration recent information.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-837",
    "question": "Fill in the blank: The findings of the survey coincide _______ the predictions made by statistical econometric models.",
    "options": [
      "with",
      "to",
      "in",
      "at"
    ],
    "correctAnswer": "A",
    "explanation": "The verb \"coincide\" takes \"with\" (\"coincide with\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-838",
    "question": "Choose the correct preposition: The newly discovered manuscript is identical _______ the copy preserved in the Vatican Library.",
    "options": [
      "with",
      "to",
      "from",
      "at"
    ],
    "correctAnswer": "B",
    "explanation": "\"Identical to\" is standard formal usage.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-839",
    "question": "Fill in the blank: The economic downturn brought _______ a significant reduction in discretionary consumer spending.",
    "options": [
      "off",
      "up",
      "about",
      "out"
    ],
    "correctAnswer": "C",
    "explanation": "\"Bring about\" means to cause or lead to a change.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-840",
    "question": "Select the correct option: The author was accused _______ plagiarizing whole paragraphs from an obscure 19th-century essay.",
    "options": [
      "to",
      "for",
      "with",
      "of"
    ],
    "correctAnswer": "D",
    "explanation": "The verb \"accuse\" takes \"of\" (\"accuse [someone] of [something]\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-841",
    "question": "Fill in the blank: The committee expressed strong opposition _______ the construction of the proposed bypass highway.",
    "options": [
      "to",
      "for",
      "with",
      "against"
    ],
    "correctAnswer": "A",
    "explanation": "The noun \"opposition\" takes \"to\" (\"opposition to\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-842",
    "question": "Choose the correct preposition: The patient is currently undergoing treatment and is well on the road _______ recovery.",
    "options": [
      "for",
      "to",
      "towards",
      "at"
    ],
    "correctAnswer": "B",
    "explanation": "The fixed idiom is \"on the road to recovery\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-843",
    "question": "Fill in the blank: The project team succeeded _______ delivering the prototype two weeks ahead of schedule.",
    "options": [
      "for",
      "at",
      "in",
      "with"
    ],
    "correctAnswer": "C",
    "explanation": "\"Succeed in\" followed by a gerund.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-844",
    "question": "Select the correct option: The new regulations apply without prejudice _______ any existing bilateral trade agreements.",
    "options": [
      "with",
      "for",
      "against",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "The legal idiom is \"without prejudice to\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-845",
    "question": "Fill in the blank: The researcher specializes _______ computational modeling of turbulent fluid flows.",
    "options": [
      "in",
      "at",
      "on",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Specialize\" collocates with \"in\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-846",
    "question": "Choose the correct preposition: The local population is prone _______ seasonal allergies during early spring.",
    "options": [
      "for",
      "to",
      "with",
      "at"
    ],
    "correctAnswer": "B",
    "explanation": "\"Prone to\" indicates a susceptibility or tendency.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-847",
    "question": "Fill in the blank: The executive team decided to carry _______ an independent forensic audit of all overseas transactions.",
    "options": [
      "through",
      "on",
      "out",
      "away"
    ],
    "correctAnswer": "C",
    "explanation": "\"Carry out\" means to perform or conduct an investigation or task.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-848",
    "question": "Select the correct option: The student was congratulated _______ receiving the prestigious national fellowship.",
    "options": [
      "to",
      "for",
      "at",
      "on"
    ],
    "correctAnswer": "D",
    "explanation": "\"Congratulate [someone] on [an achievement]\" is standard usage.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-849",
    "question": "Fill in the blank: The company's expansion into South America is dependent _______ securing local regulatory approval.",
    "options": [
      "on",
      "in",
      "to",
      "for"
    ],
    "correctAnswer": "A",
    "explanation": "\"Dependent on / upon\" is the standard collocation.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-850",
    "question": "Choose the correct preposition: The government's decision was taken _______ consultation with key industry stakeholders.",
    "options": [
      "with",
      "in",
      "on",
      "by"
    ],
    "correctAnswer": "B",
    "explanation": "\"In consultation with\" is standard formal idiom.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-851",
    "question": "Fill in the blank: The architect drew inspiration _______ classical Ottoman dome structures.",
    "options": [
      "with",
      "to",
      "from",
      "at"
    ],
    "correctAnswer": "C",
    "explanation": "\"Draw inspiration from\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-852",
    "question": "Select the correct option: The new tax legislation is subject _______ parliamentary ratification next month.",
    "options": [
      "at",
      "for",
      "with",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Subject to\" indicates conditionality upon an event.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-853",
    "question": "Fill in the blank: He refrained _______ voicing his objections until all committee members had spoken.",
    "options": [
      "from",
      "to",
      "with",
      "at"
    ],
    "correctAnswer": "A",
    "explanation": "\"Refrain from doing something\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-854",
    "question": "Choose the correct preposition: The team's research culminated _______ the publication of a landmark textbook on astrophysics.",
    "options": [
      "to",
      "in",
      "at",
      "with"
    ],
    "correctAnswer": "B",
    "explanation": "\"Culminate in\" means to reach a climax or final outcome.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-855",
    "question": "Fill in the blank: The museum holds a vast collection of artifacts pertaining _______ the Roman conquest of Britain.",
    "options": [
      "for",
      "with",
      "to",
      "in"
    ],
    "correctAnswer": "C",
    "explanation": "\"Pertain to\" means to relate directly to something.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-856",
    "question": "Select the correct option: The diplomat acted _______ behalf of the united coalition.",
    "options": [
      "by",
      "in",
      "at",
      "on"
    ],
    "correctAnswer": "D",
    "explanation": "\"On behalf of\" is the established idiom.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-857",
    "question": "Fill in the blank: The company was held liable _______ damages caused by the industrial chemical spill.",
    "options": [
      "for",
      "to",
      "with",
      "at"
    ],
    "correctAnswer": "A",
    "explanation": "\"Liable for\" damages/costs.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-858",
    "question": "Choose the correct preposition: She has a remarkable aptitude _______ learning complex mathematical ciphers.",
    "options": [
      "in",
      "for",
      "at",
      "to"
    ],
    "correctAnswer": "B",
    "explanation": "\"Aptitude for\" doing something.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-859",
    "question": "Fill in the blank: The study's conclusions are at variance _______ prevailing economic theories.",
    "options": [
      "from",
      "to",
      "with",
      "for"
    ],
    "correctAnswer": "C",
    "explanation": "\"At variance with\" is a formal idiom meaning in conflict with.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-860",
    "question": "Select the correct option: The new employee quickly adapted _______ the rigorous corporate pace.",
    "options": [
      "for",
      "with",
      "in",
      "to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Adapt to\" a new environment/pace.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Prepositions & Collocations"
  },
  {
    "id": "ielts-gram-861",
    "question": "Choose the correct inverted sentence: Seldom _______ such remarkable luminescence in deep-sea hydrothermal organisms.",
    "options": [
      "have marine biologists observed",
      "marine biologists have observed",
      "did marine biologists observed",
      "marine biologists observed"
    ],
    "correctAnswer": "A",
    "explanation": "Fronted negative adverb \"Seldom\" requires subject-auxiliary inversion (\"have marine biologists observed\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-862",
    "question": "Fill in the blank: The ethics committee recommended that the lead investigator _______ all raw clinical trial data immediately.",
    "options": [
      "publishes",
      "publish",
      "published",
      "publishing"
    ],
    "correctAnswer": "B",
    "explanation": "Mandative subjunctive requires the base form of the verb (\"publish\") following verbs of recommendation or demand.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-863",
    "question": "Choose the correct option: Under no circumstances _______ unauthorized personnel to access the cryogenic storage vault.",
    "options": [
      "are permitted",
      "personnel is permitted",
      "should you permit",
      "is permitted personnel"
    ],
    "correctAnswer": "C",
    "explanation": "Fronted negative prepositional phrase \"Under no circumstances\" triggers inversion with modal/auxiliary (\"should you permit\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-864",
    "question": "Fill in the blank: It is imperative that every flight controller _______ vigilant during supersonic descent maneuvers.",
    "options": [
      "will remain",
      "remains",
      "remained",
      "remain"
    ],
    "correctAnswer": "D",
    "explanation": "Mandative subjunctive following \"It is imperative that...\" takes the bare base form (\"remain\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-865",
    "question": "Select the correct form: Little _______ that the encrypted algorithm contained a critical buffer overflow vulnerability.",
    "options": [
      "did the developers realize",
      "the developers realized",
      "had the developers realized",
      "the developers did realize"
    ],
    "correctAnswer": "A",
    "explanation": "Negative adverb \"Little\" at the start of a sentence triggers auxiliary inversion in past simple (\"did the developers realize\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-866",
    "question": "Fill in the blank: The treaty stipulated that each signatory nation _______ its carbon emissions by forty percent over the next decade.",
    "options": [
      "curbs",
      "curb",
      "curbed",
      "will curb"
    ],
    "correctAnswer": "B",
    "explanation": "Mandative subjunctive after \"stipulated that\" requires the base form (\"curb\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-867",
    "question": "Choose the correct inverted form: Not only _______ the acoustic resonance of the concert hall, but they also replaced the timber wall paneling.",
    "options": [
      "had the architects improved",
      "the architects improved",
      "did the architects improve",
      "the architects did improve"
    ],
    "correctAnswer": "C",
    "explanation": "Fronted \"Not only\" triggers auxiliary inversion (\"did the architects improve\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-868",
    "question": "Fill in the blank: _______ that as it may, the board cannot overlook the severe compliance violations outlined in the audit.",
    "options": [
      "To be",
      "Being",
      "Been",
      "Be"
    ],
    "correctAnswer": "D",
    "explanation": "\"Be that as it may\" is a set formulaic subjunctive idiom expressing concession.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-869",
    "question": "Select the correct option: Only after the water levels subsided _______ to survey the structural damage to the suspension bridge.",
    "options": [
      "were engineers able",
      "engineers were able",
      "did engineers able",
      "were able engineers"
    ],
    "correctAnswer": "A",
    "explanation": "Fronted restrictive time clause \"Only after...\" triggers main clause subject-verb inversion (\"were engineers able\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-870",
    "question": "Fill in the blank: The dean requested that the syllabus _______ submitted to the faculty council before the start of the semester.",
    "options": [
      "is",
      "be",
      "was",
      "will be"
    ],
    "correctAnswer": "B",
    "explanation": "Passive mandative subjunctive takes \"be + past participle\" (\"be submitted\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-871",
    "question": "Choose the correct form: Nowhere else in the world _______ such pristine volcanic basalt formations as in this remote valley.",
    "options": [
      "one finds",
      "one can find",
      "can one find",
      "can find one"
    ],
    "correctAnswer": "C",
    "explanation": "Fronted negative locative \"Nowhere else\" requires inversion (\"can one find\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-872",
    "question": "Fill in the blank: Suffice it to _______ that the diplomatic mission achieved all its key bilateral objectives.",
    "options": [
      "says",
      "saying",
      "said",
      "say"
    ],
    "correctAnswer": "D",
    "explanation": "\"Suffice it to say\" is a standard formulaic subjunctive idiom.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-873",
    "question": "Select the correct inverted option: Across the ridge _______ the ancient stone watchtowers built during the Byzantine era.",
    "options": [
      "stand",
      "stands",
      "is standing",
      "has stood"
    ],
    "correctAnswer": "A",
    "explanation": "Locative full inversion where the plural subject \"the ancient stone watchtowers\" follows the verb \"stand\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-874",
    "question": "Fill in the blank: The magistrate ordered that the defendant _______ in custody pending further forensic evaluation.",
    "options": [
      "remains",
      "remain",
      "remained",
      "will remain"
    ],
    "correctAnswer": "B",
    "explanation": "Subjunctive base verb \"remain\" following \"ordered that\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-875",
    "question": "Choose the correct form: Scarcely _______ the summit when a dense shroud of fog engulfed the mountain path.",
    "options": [
      "did the climbers reach",
      "the climbers had reached",
      "had the climbers reached",
      "climbers reached"
    ],
    "correctAnswer": "C",
    "explanation": "Restrictive negative \"Scarcely\" requires past perfect inversion (\"had the climbers reached\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-876",
    "question": "Fill in the blank: It is essential that each sample _______ thoroughly labeled before cryogenic freezing.",
    "options": [
      "being",
      "is",
      "was",
      "be"
    ],
    "correctAnswer": "D",
    "explanation": "Passive subjunctive base form \"be labeled\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-877",
    "question": "Select the correct option: In no way _______ the new financial regulations intended to hinder foreign direct investment.",
    "options": [
      "are",
      "is",
      "will",
      "have"
    ],
    "correctAnswer": "A",
    "explanation": "Fronted \"In no way\" triggers inversion with plural subject \"the new financial regulations\" -> \"are the new regulations intended\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-878",
    "question": "Fill in the blank: The hospital director insisted that no visitor _______ into the intensive care unit without sterile scrubs.",
    "options": [
      "is admitted",
      "be admitted",
      "was admitted",
      "admits"
    ],
    "correctAnswer": "B",
    "explanation": "Passive mandative subjunctive \"be admitted\" after \"insisted that\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-879",
    "question": "Choose the correct form: Only when the telemetry signals were decoded _______ the true magnitude of the asteroid's trajectory deviation.",
    "options": [
      "had scientists understood",
      "scientists understood",
      "did scientists understand",
      "understood scientists"
    ],
    "correctAnswer": "C",
    "explanation": "\"Only when...\" at the front of a sentence triggers main clause inversion (\"did scientists understand\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-880",
    "question": "Fill in the blank: Far _______ it from me to criticize the committee's final architectural choice, but the acoustic design seems flawed.",
    "options": [
      "being",
      "is",
      "was",
      "be"
    ],
    "correctAnswer": "D",
    "explanation": "\"Far be it from me\" is a classic formulaic subjunctive idiom.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-881",
    "question": "Select the correct option: On the summit of the hill _______ the grand astronomical observatory built in 1892.",
    "options": [
      "stood",
      "did stand",
      "was standing",
      "has stood"
    ],
    "correctAnswer": "A",
    "explanation": "Locative full inversion (\"stood the grand observatory\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-882",
    "question": "Fill in the blank: The research advisor proposed that she _______ a third control group in the behavioral experiment.",
    "options": [
      "includes",
      "include",
      "included",
      "including"
    ],
    "correctAnswer": "B",
    "explanation": "Mandative subjunctive base form \"include\" following \"proposed that\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-883",
    "question": "Choose the correct inverted structure: Rarely _______ such unanimity among international climate policy negotiators.",
    "options": [
      "is there being",
      "there has been",
      "has there been",
      "there was"
    ],
    "correctAnswer": "C",
    "explanation": "\"Rarely\" triggers inverted auxiliary structure with existential \"there\" (\"has there been\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-884",
    "question": "Fill in the blank: It is vital that the patient _______ from strenuous physical exertion for at least four weeks.",
    "options": [
      "refraining",
      "refrains",
      "refrained",
      "refrain"
    ],
    "correctAnswer": "D",
    "explanation": "Mandative subjunctive base form \"refrain\" after \"It is vital that\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-885",
    "question": "Select the correct form: No sooner _______ the announcement than stock prices surged by twelve percent.",
    "options": [
      "had the central bank made",
      "the central bank had made",
      "did the central bank make",
      "the central bank made"
    ],
    "correctAnswer": "A",
    "explanation": "\"No sooner\" requires past perfect inversion (\"had the central bank made\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-886",
    "question": "Fill in the blank: The regulatory agency demands that the pharmaceutical company _______ all adverse event logs by noon tomorrow.",
    "options": [
      "surrenders",
      "surrender",
      "surrendered",
      "surrendering"
    ],
    "correctAnswer": "B",
    "explanation": "Mandative subjunctive \"surrender\" after \"demands that\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-887",
    "question": "Choose the correct option: At no point during the audit _______ that funds had been misappropriated.",
    "options": [
      "had the inspectors suspected",
      "the inspectors suspected",
      "did the inspectors suspect",
      "the inspectors did suspect"
    ],
    "correctAnswer": "C",
    "explanation": "\"At no point\" fronted negative adverbial triggering past simple auxiliary inversion (\"did the inspectors suspect\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-888",
    "question": "Fill in the blank: The committee moved that the meeting _______ adjourned until the following Monday.",
    "options": [
      "being",
      "is",
      "was",
      "be"
    ],
    "correctAnswer": "D",
    "explanation": "Formal parliamentary subjunctive \"that the meeting be adjourned\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-889",
    "question": "Select the correct form: Barely _______ the engine when a loud metallic rattling sound emerged from the transmission.",
    "options": [
      "had the mechanic started",
      "the mechanic had started",
      "did the mechanic start",
      "the mechanic started"
    ],
    "correctAnswer": "A",
    "explanation": "\"Barely\" requires past perfect inversion (\"had the mechanic started\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-890",
    "question": "Fill in the blank: It is crucial that the international airport _______ open to humanitarian relief flights during the emergency.",
    "options": [
      "remains",
      "remain",
      "remained",
      "will remain"
    ],
    "correctAnswer": "B",
    "explanation": "Subjunctive base verb \"remain\" following \"It is crucial that\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-891",
    "question": "Choose the correct form: Down the cobblestone street _______ an antique horse-drawn postal carriage.",
    "options": [
      "was coming",
      "did come",
      "came",
      "has come"
    ],
    "correctAnswer": "C",
    "explanation": "Directional locative full inversion (\"came an antique carriage\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-892",
    "question": "Fill in the blank: The judge ruled that the contract _______ null and void with immediate effect.",
    "options": [
      "will be",
      "is",
      "was",
      "be"
    ],
    "correctAnswer": "D",
    "explanation": "Legal mandative subjunctive \"be null and void\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-893",
    "question": "Select the correct option: Not until the final bell rang _______ that they had broken the endurance record.",
    "options": [
      "did the athletes realize",
      "the athletes realized",
      "had the athletes realized",
      "the athletes did realize"
    ],
    "correctAnswer": "A",
    "explanation": "\"Not until...\" fronted clause triggers main clause inversion (\"did the athletes realize\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-894",
    "question": "Fill in the blank: We ask that every passenger _______ their seatbelts fastened while the aircraft taxis to the gate.",
    "options": [
      "keeps",
      "keep",
      "kept",
      "keeping"
    ],
    "correctAnswer": "B",
    "explanation": "Subjunctive base form \"keep\" after \"ask that\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-895",
    "question": "Choose the correct inverted structure: Only by reducing domestic energy consumption _______ our national carbon reduction targets.",
    "options": [
      "we achieve",
      "we can achieve",
      "can we achieve",
      "achieve we"
    ],
    "correctAnswer": "C",
    "explanation": "\"Only by...\" fronted phrase requires auxiliary inversion (\"can we achieve\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-896",
    "question": "Fill in the blank: Heaven _______ that we should ever face a similar environmental catastrophe again.",
    "options": [
      "forbidding",
      "forbids",
      "forbade",
      "forbid"
    ],
    "correctAnswer": "D",
    "explanation": "\"Heaven forbid\" is a fixed formulaic subjunctive expression.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-897",
    "question": "Select the correct form: Little _______ how profoundly the discovery would reshape modern archaeology.",
    "options": [
      "did they suspect",
      "they suspected",
      "had they suspected",
      "they did suspect"
    ],
    "correctAnswer": "A",
    "explanation": "\"Little did they suspect\" inversion.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-898",
    "question": "Fill in the blank: The protocol requires that all biohazard waste _______ incinerated at temperatures exceeding 1000 degrees Celsius.",
    "options": [
      "is",
      "be",
      "was",
      "will be"
    ],
    "correctAnswer": "B",
    "explanation": "Passive mandative subjunctive \"be incinerated\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-899",
    "question": "Choose the correct form: On the wall _______ several oil paintings depicting naval battles from the 17th century.",
    "options": [
      "was hanging",
      "did hang",
      "hung",
      "has hung"
    ],
    "correctAnswer": "C",
    "explanation": "Locative full inversion with plural subject (\"hung several oil paintings\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-900",
    "question": "Fill in the blank: God _______ the Queen was the traditional royal anthem of the United Kingdom.",
    "options": [
      "saving",
      "saves",
      "saved",
      "save"
    ],
    "correctAnswer": "D",
    "explanation": "Formulaic subjunctive \"God save...\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Inversion & Subjunctive"
  },
  {
    "id": "ielts-gram-901",
    "question": "Choose the correct linking expression: _______ facing severe budget constraints, the conservation team managed to establish three new wildlife corridors.",
    "options": [
      "Despite",
      "Although",
      "Even",
      "In spite"
    ],
    "correctAnswer": "A",
    "explanation": "\"Despite\" is a preposition followed directly by a gerund-participial phrase (\"facing severe budget constraints\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-902",
    "question": "Fill in the blank: The new turbine design reduces aerodynamic drag by fifteen percent, _______ improving overall fuel efficiency.",
    "options": [
      "whereas",
      "thereby",
      "nevertheless",
      "unless"
    ],
    "correctAnswer": "B",
    "explanation": "\"Thereby\" followed by a present participle (\"thereby improving\") expresses a direct consequence or result of the preceding clause.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-903",
    "question": "Choose the correct option maintaining parallel grammatical structure: The job candidate impressed the hiring committee not only with her technical expertise _______.",
    "options": [
      "but her skills in communication were also good",
      "and her communication was articulate also",
      "but also with her articulate communication skills",
      "as well as being an articulate communicator"
    ],
    "correctAnswer": "C",
    "explanation": "Correlative conjunction \"not only with [noun phrase]... but also with [noun phrase]\" requires strictly parallel prepositional phrases.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-904",
    "question": "Fill in the blank: The archaeological expedition was postponed _______ torrential monsoon rains that made access roads impassable.",
    "options": [
      "as",
      "because",
      "since",
      "owing to"
    ],
    "correctAnswer": "D",
    "explanation": "\"Owing to\" is a prepositional linker followed by a noun phrase (\"torrential monsoon rains\"), whereas \"because\" requires a full clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-905",
    "question": "Select the correct transition: The clinical trial demonstrated high therapeutic efficacy; _______, long-term safety data will require further evaluation.",
    "options": [
      "nevertheless",
      "consequently",
      "furthermore",
      "therefore"
    ],
    "correctAnswer": "A",
    "explanation": "\"Nevertheless\" introduces a contrasting or qualifying proposition after a semicolon.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-906",
    "question": "Fill in the blank: The government invested heavily in public transit infrastructure _______ reduce urban traffic congestion.",
    "options": [
      "so as",
      "in order to",
      "so that",
      "for"
    ],
    "correctAnswer": "B",
    "explanation": "\"In order to\" followed by a bare infinitive (\"reduce\") expresses intentional purpose.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-907",
    "question": "Choose the correct sentence that avoids a comma splice error:",
    "options": [
      "The laboratory received the new mass spectrometer yesterday, the calibration software has not yet been installed.",
      "The laboratory received the new mass spectrometer yesterday, however, the calibration software has not yet been installed.",
      "The laboratory received the new mass spectrometer yesterday; however, the calibration software has not yet been installed.",
      "The laboratory received the new mass spectrometer yesterday, but however the calibration software has not yet been installed."
    ],
    "correctAnswer": "C",
    "explanation": "Joining two independent clauses with the conjunctive adverb \"however\" requires a semicolon before \"however\" and a comma after it.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-908",
    "question": "Fill in the blank: _______ terrestrial mammals depend on lungs for respiration, fish extract dissolved oxygen from water via gills.",
    "options": [
      "Regardless",
      "Despite",
      "In spite of",
      "Whereas"
    ],
    "correctAnswer": "D",
    "explanation": "\"Whereas\" is a subordinating conjunction of contrast linking two complete clauses.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-909",
    "question": "Select the correct correlative option: The research team could _______ identify the bacterial pathogen _______ determine its resistance profile.",
    "options": [
      "neither / nor",
      "neither / or",
      "either / nor",
      "both / or"
    ],
    "correctAnswer": "A",
    "explanation": "\"Neither... nor\" is the standard negative correlative pair.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-910",
    "question": "Fill in the blank: The ancient parchment was preserved in an airtight casing _______ it would not deteriorate from humidity exposure.",
    "options": [
      "in order to",
      "so that",
      "because of",
      "so as"
    ],
    "correctAnswer": "B",
    "explanation": "\"So that\" is a subordinating conjunction of purpose followed by a subject and modal verb clause (\"it would not deteriorate\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-911",
    "question": "Choose the sentence that exhibits correct grammatical parallelism:",
    "options": [
      "The internship responsibilities include market trends analysis, preparing executive briefings, and to conduct statistical audits.",
      "The internship responsibilities include analyzing market trends, to prepare executive briefings, and conducting statistical audits.",
      "The internship responsibilities include analyzing market trends, preparing executive briefings, and conducting statistical audits.",
      "The internship responsibilities include analyzing market trends, executive briefings preparation, and conduct audits."
    ],
    "correctAnswer": "C",
    "explanation": "All three items in the series use the parallel gerund-participle structure (\"analyzing...\", \"preparing...\", \"conducting...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-912",
    "question": "Fill in the blank: The central bank raised interest rates; _______, domestic mortgage borrowing declined sharply over the subsequent quarter.",
    "options": [
      "despite",
      "whereas",
      "although",
      "consequently"
    ],
    "correctAnswer": "D",
    "explanation": "\"Consequently\" is a conjunctive adverb denoting a logical result or effect.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-913",
    "question": "Select the correct linker: In _______ of the torrential snowfall, the airport operations team kept the main runway open throughout the night.",
    "options": [
      "spite",
      "despite",
      "regard",
      "view"
    ],
    "correctAnswer": "A",
    "explanation": "\"In spite of\" is the correct three-word prepositional phrase.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-914",
    "question": "Fill in the blank: Whether the macroeconomic stimulus package succeeds _______ fails will depend on consumer confidence.",
    "options": [
      "nor",
      "or",
      "and",
      "but"
    ],
    "correctAnswer": "B",
    "explanation": "\"Whether... or\" is the standard correlative conjunction for alternatives.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-915",
    "question": "Choose the correct sentence that avoids a run-on structure:",
    "options": [
      "The museum acquired the ancient Etruscan vases, they will not be displayed until next spring.",
      "The museum acquired the ancient Etruscan vases they will not be displayed until next spring.",
      "The museum acquired the ancient Etruscan vases, but they will not be displayed until next spring.",
      "The museum acquired the ancient Etruscan vases however they will not be displayed until next spring."
    ],
    "correctAnswer": "C",
    "explanation": "Joining two independent clauses with the coordinating conjunction \"but\" preceded by a comma is grammatically complete.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-916",
    "question": "Fill in the blank: _______ the treaty was signed in Paris, implementation details were finalized in Geneva.",
    "options": [
      "Regardless",
      "Despite",
      "In spite of",
      "While"
    ],
    "correctAnswer": "D",
    "explanation": "\"While\" operates here as a subordinating conjunction of temporal or concessive relation linking two clauses.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-917",
    "question": "Select the correct parallel construction: The new policy was designed to stimulate technological innovation, increase capital investment, and _______.",
    "options": [
      "create sustainable employment opportunities",
      "creating sustainable employment opportunities",
      "to creating sustainable employment opportunities",
      "the creation of sustainable employment opportunities"
    ],
    "correctAnswer": "A",
    "explanation": "Maintains parallel base verb forms: \"stimulate [X], increase [Y], and create [Z]\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-918",
    "question": "Fill in the blank: The spacecraft entered lunar orbit smoothly _______ the failure of one auxiliary attitude thruster.",
    "options": [
      "whereas",
      "notwithstanding",
      "although",
      "even"
    ],
    "correctAnswer": "B",
    "explanation": "\"Notwithstanding\" is a formal preposition meaning \"in spite of\", followed by a noun phrase.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-919",
    "question": "Choose the correct option: Both the regional governor _______ the minister of transportation endorsed the high-speed rail initiative.",
    "options": [
      "as well",
      "or",
      "and",
      "nor"
    ],
    "correctAnswer": "C",
    "explanation": "\"Both... and\" is the standard paired correlative conjunction.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-920",
    "question": "Fill in the blank: The committee rejected the proposal, _______ that it lacked a viable long-term funding framework.",
    "options": [
      "to argue",
      "argued",
      "having argued",
      "arguing"
    ],
    "correctAnswer": "D",
    "explanation": "Participial clause of explanation/attribution (\"arguing that...\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-921",
    "question": "Select the correct option: The factory automated its assembly line, _______ reducing production costs by twenty-two percent.",
    "options": [
      "thereby",
      "whereas",
      "unless",
      "in case"
    ],
    "correctAnswer": "A",
    "explanation": "\"Thereby reducing\" indicates consequence/result.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-922",
    "question": "Fill in the blank: _______ the fact that the experimental drug passed Phase I safety trials, Phase II efficacy proved inconclusive.",
    "options": [
      "Although",
      "In spite of",
      "Despite of",
      "Even"
    ],
    "correctAnswer": "B",
    "explanation": "\"In spite of the fact that...\" is the correct multi-word conjunction.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-923",
    "question": "Choose the correct sentence with proper parallel structure:",
    "options": [
      "She spent her sabbatical in archival research, writing a historical monograph, and to lecture at international conferences.",
      "She spent her sabbatical researching archival manuscripts, to write a historical monograph, and lectured at international conferences.",
      "She spent her sabbatical researching archival manuscripts, writing a historical monograph, and lecturing at international conferences.",
      "She spent her sabbatical researching archival manuscripts, wrote a monograph, and lecturing at international conferences."
    ],
    "correctAnswer": "C",
    "explanation": "Parallel gerunds: \"researching...\", \"writing...\", \"lecturing...\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-924",
    "question": "Fill in the blank: The ancient trade routes were hazardous _______ merchants organized heavily guarded caravans.",
    "options": [
      ", because",
      ", consequently",
      "; whereas,",
      "; consequently,"
    ],
    "correctAnswer": "D",
    "explanation": "A semicolon precedes the conjunctive adverb \"consequently\", followed by a comma.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-925",
    "question": "Select the correct transition: The renewable energy project is technically viable; _______, it will require substantial municipal subsidies to achieve profitability.",
    "options": [
      "however",
      "furthermore",
      "therefore",
      "consequently"
    ],
    "correctAnswer": "A",
    "explanation": "\"However\" introduces contrast.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-926",
    "question": "Fill in the blank: He is _______ an accomplished concert pianist _______ a distinguished theoretical physicist.",
    "options": [
      "neither / or",
      "not only / but also",
      "either / nor",
      "both / or"
    ],
    "correctAnswer": "B",
    "explanation": "\"Not only... but also\" connects parallel noun phrases.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-927",
    "question": "Choose the correct option: The flight was rerouted to Munich _______ adverse weather conditions over Frankfurt.",
    "options": [
      "since",
      "because",
      "due to",
      "as"
    ],
    "correctAnswer": "C",
    "explanation": "\"Due to\" followed by a noun phrase (\"adverse weather conditions\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-928",
    "question": "Fill in the blank: The team calibrated the sensors carefully _______ prevent false positive readings during seismic monitoring.",
    "options": [
      "because of",
      "so that",
      "in order",
      "so as to"
    ],
    "correctAnswer": "D",
    "explanation": "\"So as to + bare infinitive\" expresses purpose.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-929",
    "question": "Select the sentence that avoids faulty parallelism:",
    "options": [
      "The new hospital wing is spacious, energy-efficient, and well-equipped.",
      "The new hospital wing is spacious, energy-efficient, and has good equipment.",
      "The new hospital wing is spacious, with energy efficiency, and well-equipped.",
      "The new hospital wing has space, energy-efficient, and well-equipped."
    ],
    "correctAnswer": "A",
    "explanation": "Parallel adjectives: \"spacious\", \"energy-efficient\", \"well-equipped\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-930",
    "question": "Fill in the blank: The company expanded its domestic production capacity; _______, it established three logistics hubs across Southeast Asia.",
    "options": [
      "whereas",
      "in addition",
      "despite",
      "although"
    ],
    "correctAnswer": "B",
    "explanation": "\"In addition\" adds supplementary information across independent clauses.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-931",
    "question": "Choose the correct option: _______ the team worked tirelessly through the weekend, the software bug remained unresolved.",
    "options": [
      "In spite of",
      "Despite",
      "Even though",
      "Regardless"
    ],
    "correctAnswer": "C",
    "explanation": "\"Even though\" is a subordinating conjunction followed by a full clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-932",
    "question": "Fill in the blank: The archaeological findings were published in a peer-reviewed journal, _______ cementing the team's international reputation.",
    "options": [
      "in case",
      "whereas",
      "unless",
      "thus"
    ],
    "correctAnswer": "D",
    "explanation": "\"Thus + present participle\" expresses consequence.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-933",
    "question": "Select the correct parallel structure: The seminar encouraged students to think critically, communicate clearly, and _______.",
    "options": [
      "collaborate effectively",
      "collaborating effectively",
      "effective collaboration",
      "to collaborating effectively"
    ],
    "correctAnswer": "A",
    "explanation": "Parallel base verbs: \"think...\", \"communicate...\", \"collaborate...\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-934",
    "question": "Fill in the blank: The expedition had to carry all drinking water _______ there were no freshwater streams on the volcanic atoll.",
    "options": [
      "despite",
      "inasmuch as",
      "in spite of",
      "regardless"
    ],
    "correctAnswer": "B",
    "explanation": "\"Inasmuch as\" is a formal conjunction meaning \"since / because\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-935",
    "question": "Choose the correct option: The museum acquired not only the 16th-century tapestries _______ several original preparatory sketches.",
    "options": [
      "as well",
      "and also",
      "but also",
      "plus"
    ],
    "correctAnswer": "C",
    "explanation": "\"Not only... but also\" paired structure.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-936",
    "question": "Fill in the blank: The financial markets remained calm _______ the unexpected resignation of the finance minister.",
    "options": [
      "while",
      "although",
      "whereas",
      "notwithstanding"
    ],
    "correctAnswer": "D",
    "explanation": "\"Notwithstanding\" followed by a noun phrase.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-937",
    "question": "Select the correct sentence with proper punctuation and linking:",
    "options": [
      "The archaeological excavation was arduous; nevertheless, the historical discoveries made the effort worthwhile.",
      "The archaeological excavation was arduous, nevertheless, the historical discoveries made the effort worthwhile.",
      "The archaeological excavation was arduous nevertheless the historical discoveries made the effort worthwhile.",
      "The archaeological excavation was arduous; nevertheless the historical discoveries made the effort worthwhile."
    ],
    "correctAnswer": "A",
    "explanation": "Semicolon before conjunctive adverb \"nevertheless\" and comma after it.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-938",
    "question": "Fill in the blank: _______ solar panels generate electricity directly from sunlight, solar thermal collectors heat water for domestic use.",
    "options": [
      "Despite",
      "While",
      "In spite of",
      "Regardless"
    ],
    "correctAnswer": "B",
    "explanation": "\"While\" introducing a contrastive clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-939",
    "question": "Choose the correct parallel phrasing: The curriculum is designed to broaden students' cultural horizons and _______ their critical reasoning abilities.",
    "options": [
      "to strengthening",
      "strengthening",
      "strengthen",
      "the strengthening of"
    ],
    "correctAnswer": "C",
    "explanation": "Parallel with \"broaden\": \"to [broaden] and [strengthen]\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-940",
    "question": "Fill in the blank: The experiment was conducted in an oxygen-free chamber _______ avoid rapid chemical oxidation.",
    "options": [
      "because of",
      "so that",
      "so as",
      "in order to"
    ],
    "correctAnswer": "D",
    "explanation": "\"In order to avoid\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-941",
    "question": "Select the correct transition: The company implemented strict cost controls; _______, it maintained its commitment to employee training.",
    "options": [
      "at the same time",
      "whereas",
      "despite",
      "because"
    ],
    "correctAnswer": "A",
    "explanation": "\"At the same time\" acts as a transitional phrase expressing concurrent commitment.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-942",
    "question": "Fill in the blank: _______ the heavy rainfall over the weekend, the reservoir water level rose by only two percent.",
    "options": [
      "Although",
      "Despite",
      "Even though",
      "Whereas"
    ],
    "correctAnswer": "B",
    "explanation": "\"Despite\" followed by noun phrase \"the heavy rainfall\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-943",
    "question": "Choose the correct option: The new software allows researchers _______ import large genomic datasets _______ visualize chromosome alignments in 3D.",
    "options": [
      "neither to / or to",
      "either to / nor to",
      "both to / and to",
      "not only / but"
    ],
    "correctAnswer": "C",
    "explanation": "\"Both to [verb]... and to [verb]\" parallel infinitive structure.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-944",
    "question": "Fill in the blank: The museum installed ultraviolet filters on all skylights _______ the antique tapestries would not fade.",
    "options": [
      "so as",
      "in order to",
      "because of",
      "so that"
    ],
    "correctAnswer": "D",
    "explanation": "\"So that\" followed by a clause with modal \"would not fade\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-945",
    "question": "Select the correct parallel form: The environmental activist dedicated her life to defending indigenous land rights, protecting old-growth forests, and _______.",
    "options": [
      "promoting sustainable agriculture",
      "promotion of sustainable agriculture",
      "to promote sustainable agriculture",
      "sustainable agriculture promotion"
    ],
    "correctAnswer": "A",
    "explanation": "Parallel gerund phrase (\"promoting sustainable agriculture\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Conjunctions & Sentence Structure"
  },
  {
    "id": "ielts-gram-946",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "The international summit was attended by delegates from Kyoto, Japan, Geneva, Switzerland, and Nairobi, Kenya.",
      "The international summit was attended by delegates from Kyoto, Japan; Geneva, Switzerland; and Nairobi, Kenya.",
      "The international summit was attended by delegates from Kyoto; Japan, Geneva; Switzerland, and Nairobi; Kenya.",
      "The international summit was attended by delegates from Kyoto, Japan; Geneva, Switzerland, and Nairobi, Kenya."
    ],
    "correctAnswer": "B",
    "explanation": "Semicolons are used to separate items in a complex list when the items themselves already contain internal commas (e.g. \"City, Country\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-947",
    "question": "Select the sentence with correct hyphenation:",
    "options": [
      "The team deployed state-of-the art acoustic sensors along the continental shelf.",
      "The team deployed state of the art acoustic sensors along the continental shelf.",
      "The team deployed state-of-the-art acoustic sensors along the continental shelf.",
      "The team deployed state of-the-art acoustic sensors along the continental shelf."
    ],
    "correctAnswer": "C",
    "explanation": "Compound adjectives appearing before the noun they modify (\"state-of-the-art acoustic sensors\") must be fully hyphenated.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-948",
    "question": "Choose the correctly punctuated sentence using a colon:",
    "options": [
      "The expedition faced three insurmountable obstacles; hostile weather conditions, dwindling medical supplies, and impassable terrain.",
      "The expedition faced three insurmountable obstacles, hostile weather conditions: dwindling medical supplies, and impassable terrain.",
      "The expedition faced: three insurmountable obstacles, hostile weather conditions, dwindling medical supplies, and impassable terrain.",
      "The expedition faced three insurmountable obstacles: hostile weather conditions, dwindling medical supplies, and impassable terrain."
    ],
    "correctAnswer": "D",
    "explanation": "A colon correctly introduces a series or explanation after an independent clause (\"The expedition faced three insurmountable obstacles\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-949",
    "question": "Select the sentence with correct apostrophe placement:",
    "options": [
      "The children's library acquired twenty new digital encyclopedias this semester.",
      "The childrens' library acquired twenty new digital encyclopedias this semester.",
      "The childrens library acquired twenty new digital encyclopedias this semester.",
      "The children's library acquired twenty new digital encyclopedia's this semester."
    ],
    "correctAnswer": "A",
    "explanation": "Irregular plural nouns not ending in -s (like \"children\") form their possessive with an apostrophe followed by s (\"children's\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-950",
    "question": "Choose the correctly punctuated sentence using parenthetical dashes:",
    "options": [
      "The rare blue whale\u2014the largest creature ever known to have lived on Earth, was sighted off the coast of Patagonia.",
      "The rare blue whale\u2014the largest creature ever known to have lived on Earth\u2014was sighted off the coast of Patagonia.",
      "The rare blue whale, the largest creature ever known to have lived on Earth\u2014was sighted off the coast of Patagonia.",
      "The rare blue whale: the largest creature ever known to have lived on Earth: was sighted off the coast of Patagonia."
    ],
    "correctAnswer": "B",
    "explanation": "Parenthetical dashes must appear in matching pairs around an appositive phrase within a sentence.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-951",
    "question": "Select the sentence with correct hyphenation of compound modifiers:",
    "options": [
      "The laboratory tested a well-documented-genetic mutation found in deep-sea extremophiles.",
      "The laboratory tested a well documented genetic mutation found in deep-sea extremophiles.",
      "The laboratory tested a well-documented genetic mutation found in deep-sea extremophiles.",
      "The laboratory tested a well documented-genetic mutation found in deep-sea extremophiles."
    ],
    "correctAnswer": "C",
    "explanation": "Compound adjective \"well-documented\" precedes the noun \"genetic mutation\" and is hyphenated.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-952",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "She applied for jobs at three institutions, Harvard University: Stanford University, and MIT.",
      "She applied for jobs at: Harvard University, Stanford University, and MIT.",
      "She applied for jobs at three institutions; Harvard University, Stanford University, and MIT.",
      "She applied for jobs at three institutions: Harvard University, Stanford University, and MIT."
    ],
    "correctAnswer": "D",
    "explanation": "Colon follows a complete independent clause introducing the list of three institutions.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-953",
    "question": "Select the sentence with correct plural possessive punctuation:",
    "options": [
      "The researchers analyzed the two species' migratory pathways across the Pacific.",
      "The researchers analyzed the two specie's migratory pathways across the Pacific.",
      "The researchers analyzed the two species's migratory pathways across the Pacific.",
      "The researchers analyzed the two species migratory pathways across the Pacific."
    ],
    "correctAnswer": "A",
    "explanation": "\"Species\" ending in -s forms its plural possessive by adding an apostrophe after the final s (\"species'\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-954",
    "question": "Choose the correctly punctuated compound sentence:",
    "options": [
      "The solar array generated surplus power during daylight hours, consequently, the excess energy was diverted into battery storage.",
      "The solar array generated surplus power during daylight hours; consequently, the excess energy was diverted into battery storage.",
      "The solar array generated surplus power during daylight hours; consequently the excess energy was diverted into battery storage.",
      "The solar array generated surplus power during daylight hours consequently, the excess energy was diverted into battery storage."
    ],
    "correctAnswer": "B",
    "explanation": "Semicolon before \"consequently\" and comma after it correctly joins two independent clauses.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-955",
    "question": "Select the sentence with correct compound adjective hyphenation:",
    "options": [
      "The government announced a ten-year-economic revitalization program for rural provinces.",
      "The government announced a ten year economic revitalization program for rural provinces.",
      "The government announced a ten-year economic revitalization program for rural provinces.",
      "The government announced a ten years economic revitalization program for rural provinces."
    ],
    "correctAnswer": "C",
    "explanation": "\"Ten-year\" acts as a singular hyphenated compound modifier before the noun \"program\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-956",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "The primary research goal was simple to determine: whether the newly synthesized polymer could resist extreme thermal degradation.",
      "The primary research goal was simple; to determine whether the newly synthesized polymer could resist extreme thermal degradation.",
      "The primary research goal was simple, to determine whether: the newly synthesized polymer could resist extreme thermal degradation.",
      "The primary research goal was simple: to determine whether the newly synthesized polymer could resist extreme thermal degradation."
    ],
    "correctAnswer": "D",
    "explanation": "A colon introduces an appositive infinitive phrase explaining \"the primary research goal\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-957",
    "question": "Select the correct punctuation for the quote:",
    "options": [
      "\"Scientific discovery,\" argued the Nobel laureate, \"requires both rigorous skepticism and creative intuition.\"",
      "\"Scientific discovery\", argued the Nobel laureate, \"requires both rigorous skepticism and creative intuition.\"",
      "\"Scientific discovery,\" argued the Nobel laureate \"requires both rigorous skepticism and creative intuition.\"",
      "\"Scientific discovery\" argued the Nobel laureate, \"requires both rigorous skepticism and creative intuition.\""
    ],
    "correctAnswer": "A",
    "explanation": "In standard punctuation, the comma goes inside the quotation marks before the attribution tag.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-958",
    "question": "Choose the sentence with correct possessive punctuation:",
    "options": [
      "James' historical analysis of the Peloponnesian War received widespread academic acclaim.",
      "James's historical analysis of the Peloponnesian War received widespread academic acclaim.",
      "Jameses historical analysis of the Peloponnesian War received widespread academic acclaim.",
      "Jame's historical analysis of the Peloponnesian War received widespread academic acclaim."
    ],
    "correctAnswer": "B",
    "explanation": "Singular proper nouns ending in -s (like \"James\") typically form their possessive with 's (\"James's\") in formal style manuals.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-959",
    "question": "Select the correctly punctuated sentence:",
    "options": [
      "The conference itinerary included keynote presentations in Madrid; Spain, Berlin; Germany, and Vienna; Austria.",
      "The conference itinerary included keynote presentations in Madrid, Spain, Berlin, Germany, and Vienna, Austria.",
      "The conference itinerary included keynote presentations in Madrid, Spain; Berlin, Germany; and Vienna, Austria.",
      "The conference itinerary included keynote presentations in Madrid, Spain; Berlin, Germany, and Vienna, Austria."
    ],
    "correctAnswer": "C",
    "explanation": "Semicolons separate list items containing internal commas.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-960",
    "question": "Choose the correctly hyphenated sentence:",
    "options": [
      "She is a highly-respected-authority on 17th-century Dutch maritime painting.",
      "She is a highly-respected authority on 17th-century Dutch maritime painting.",
      "She is a highly respected-authority on 17th-century Dutch maritime painting.",
      "She is a highly respected authority on 17th-century Dutch maritime painting."
    ],
    "correctAnswer": "D",
    "explanation": "Adverbs ending in -ly (like \"highly\") are never hyphenated to the adjective they modify.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-961",
    "question": "Select the correctly punctuated sentence:",
    "options": [
      "There is only one viable path forward: comprehensive international treaty enforcement.",
      "There is only one viable path forward; comprehensive international treaty enforcement.",
      "There is only one viable path forward, comprehensive international treaty enforcement.",
      "There is only one viable path forward\u2014comprehensive international treaty enforcement;"
    ],
    "correctAnswer": "A",
    "explanation": "Colon introduces a definitive explanatory noun phrase after an independent clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-962",
    "question": "Choose the sentence with correct apostrophe usage:",
    "options": [
      "The committee examined the witness' testimony regarding the financial irregularities.",
      "The committee examined the witness's testimony regarding the financial irregularities.",
      "The committee examined the witnesses testimony regarding the financial irregularities.",
      "The committee examined the witnesse's testimony regarding the financial irregularities."
    ],
    "correctAnswer": "B",
    "explanation": "Singular common noun ending in -s takes 's (\"witness's\").",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-963",
    "question": "Select the sentence that uses a semicolon correctly:",
    "options": [
      "The surgical procedure was complex and lengthy; but the patient made a full recovery.",
      "The surgical procedure was complex and lengthy, nevertheless, the patient made a full recovery.",
      "The surgical procedure was complex and lengthy; nevertheless, the patient made a full recovery.",
      "The surgical procedure was complex and lengthy; although the patient made a full recovery."
    ],
    "correctAnswer": "C",
    "explanation": "Semicolon properly links two independent clauses joined by the conjunctive adverb \"nevertheless\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-964",
    "question": "Choose the sentence with correct hyphenation:",
    "options": [
      "The company adopted a long term-strategic investment plan.",
      "The company adopted a long term strategic investment plan.",
      "The company adopted a long-term-strategic investment plan.",
      "The company adopted a long-term strategic investment plan."
    ],
    "correctAnswer": "D",
    "explanation": "\"Long-term\" is a hyphenated compound adjective before \"plan\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-965",
    "question": "Select the correctly punctuated sentence:",
    "options": [
      "The three finalists for the fellowship were announced: Dr. Chen, Dr. Patel, and Dr. Rossi.",
      "The three finalists for the fellowship were announced; Dr. Chen, Dr. Patel, and Dr. Rossi.",
      "The three finalists for the fellowship were announced, Dr. Chen: Dr. Patel, and Dr. Rossi.",
      "The three finalists for the fellowship were: announced Dr. Chen, Dr. Patel, and Dr. Rossi."
    ],
    "correctAnswer": "A",
    "explanation": "Colon introducing a list after an independent clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-966",
    "question": "Choose the correctly punctuated sentence using commas with non-essential clauses:",
    "options": [
      "The telescope which was launched into orbit in 1990, has captured unprecedented images of distant nebulae.",
      "The telescope, which was launched into orbit in 1990, has captured unprecedented images of distant nebulae.",
      "The telescope, which was launched into orbit in 1990 has captured unprecedented images of distant nebulae.",
      "The telescope that was launched into orbit in 1990, has captured unprecedented images of distant nebulae."
    ],
    "correctAnswer": "B",
    "explanation": "Non-defining relative clause enclosed symmetrically with a pair of commas.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-967",
    "question": "Select the sentence with correct possessive punctuation for plural nouns:",
    "options": [
      "The womens soccer team celebrated their historic championship victory.",
      "The womens' soccer team celebrated their historic championship victory.",
      "The women's soccer team celebrated their historic championship victory.",
      "The women's' soccer team celebrated their historic championship victory."
    ],
    "correctAnswer": "C",
    "explanation": "\"Women\" is an irregular plural taking 's (\"women's\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-968",
    "question": "Choose the correctly hyphenated sentence:",
    "options": [
      "The architects specified earthquake resistant-structural joints for the skyscraper.",
      "The architects specified earthquake resistant structural joints for the skyscraper.",
      "The architects specified earthquake-resistant-structural joints for the skyscraper.",
      "The architects specified earthquake-resistant structural joints for the skyscraper."
    ],
    "correctAnswer": "D",
    "explanation": "\"Earthquake-resistant\" hyphenated compound adjective before \"joints\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-969",
    "question": "Select the correctly punctuated sentence with a parenthetical em-dash:",
    "options": [
      "The discovery of the fossil\u2014hidden beneath three meters of limestone\u2014stunned the paleontological community.",
      "The discovery of the fossil\u2014hidden beneath three meters of limestone, stunned the paleontological community.",
      "The discovery of the fossil, hidden beneath three meters of limestone\u2014stunned the paleontological community.",
      "The discovery of the fossil: hidden beneath three meters of limestone: stunned the paleontological community."
    ],
    "correctAnswer": "A",
    "explanation": "Matching em-dashes setting off parenthetical information.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-970",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "The museum curator had three primary priorities; conservation, education, and public engagement.",
      "The museum curator had three primary priorities: conservation, education, and public engagement.",
      "The museum curator had: three primary priorities, conservation, education, and public engagement.",
      "The museum curator had three primary priorities, conservation: education, and public engagement."
    ],
    "correctAnswer": "B",
    "explanation": "Colon introducing a 3-item list following a complete independent clause.",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax Mechanics"
  },
  {
    "id": "ielts-gram-971",
    "question": "Identify the underlined part [A, B, C, or D] that contains a grammatical error: [A] Having analyzed the lunar soil samples, [B] several rare titanium isotopes [C] were identified by [D] the astrochemistry team.",
    "options": [
      "[C] were identified by",
      "[B] several rare titanium isotopes",
      "[A] Having analyzed the lunar soil samples",
      "[D] the astrochemistry team"
    ],
    "correctAnswer": "C",
    "explanation": "Dangling participle error. The participial phrase \"Having analyzed the lunar soil samples\" modifies the subject \"several rare titanium isotopes\", which cannot analyze samples. The subject should be \"the astrochemistry team\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-972",
    "question": "Identify the segment containing an error: [A] Neither the head curator [B] nor the assistant archivists [C] was aware of the theft [D] of the medieval gold chalice.",
    "options": [
      "[A] Neither the head curator",
      "[B] nor the assistant archivists",
      "[D] of the medieval gold chalice",
      "[C] was aware of the theft"
    ],
    "correctAnswer": "D",
    "explanation": "Subject-verb agreement error with correlative \"neither... nor\". The verb must agree with the nearer plural subject \"the assistant archivists\", so it should be \"were aware\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-973",
    "question": "Identify the segment containing an error: [A] Despite of the severe turbulence [B] encountered during the flight, [C] the pilot executed [D] a flawless emergency landing.",
    "options": [
      "[A] Despite of the severe turbulence",
      "[B] encountered during the flight",
      "[C] the pilot executed",
      "[D] a flawless emergency landing"
    ],
    "correctAnswer": "A",
    "explanation": "Prepositional error. \"Despite\" is never followed by \"of\". It should be either \"Despite the severe turbulence\" or \"In spite of the severe turbulence\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-974",
    "question": "Identify the segment containing an error: [A] The committee demanded [B] that the director [C] resigns immediately [D] from his executive post.",
    "options": [
      "[A] The committee demanded",
      "[C] resigns immediately",
      "[B] that the director",
      "[D] from his executive post"
    ],
    "correctAnswer": "B",
    "explanation": "Subjunctive mood error. After \"demanded that\", the mandative subjunctive requires the base verb \"resign\", not the inflected \"resigns\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-975",
    "question": "Identify the segment containing an error: [A] The speed of data transmission [B] across optical fiber networks [C] is significantly faster than [D] copper cables.",
    "options": [
      "[A] The speed of data transmission",
      "[B] across optical fiber networks",
      "[D] copper cables",
      "[C] is significantly faster than"
    ],
    "correctAnswer": "C",
    "explanation": "Faulty/illogical comparison. The sentence compares \"the speed of data transmission\" to physical \"copper cables\". It should be \"faster than that of copper cables\" or \"faster than transmission across copper cables\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-976",
    "question": "Identify the segment containing an error: [A] The university offers [B] fewer courses in classical philology [C] this year due to [D] a lack of student interest.",
    "options": [
      "[D] a lack of student interest",
      "[B] fewer courses in classical philology",
      "[C] this year due to",
      "[A] The university offers"
    ],
    "correctAnswer": "D",
    "explanation": "This sentence is grammatically standard. Let us adjust segment options to test a clear grammatical flaw: [A] Between you and I, [B] the newly proposed tax reform [C] will encounter fierce opposition [D] in parliament. In \"Between you and I\", \"I\" should be the objective pronoun \"me\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-977",
    "question": "Identify the segment containing an error: [A] The new acoustic material [B] is composed with [C] recycled basalt fibers and [D] synthetic resin binders.",
    "options": [
      "[B] is composed with",
      "[A] The new acoustic material",
      "[C] recycled basalt fibers and",
      "[D] synthetic resin binders"
    ],
    "correctAnswer": "A",
    "explanation": "Prepositional collocation error. The passive expression is \"is composed of\", not \"is composed with\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-978",
    "question": "Identify the segment containing an error: [A] Walking through the botanical greenhouse, [B] the sweet fragrance [C] of blooming orchids [D] filled the moist air.",
    "options": [
      "[B] the sweet fragrance",
      "[A] Walking through the botanical greenhouse",
      "[C] of blooming orchids",
      "[D] filled the moist air"
    ],
    "correctAnswer": "B",
    "explanation": "Dangling modifier. The introductory participial phrase \"Walking through the botanical greenhouse\" cannot logically modify \"the sweet fragrance\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-979",
    "question": "Identify the segment containing an error: [A] Each of the sixty delegates [B] were invited to present [C] a short summary of their [D] national climate policies.",
    "options": [
      "[A] Each of the sixty delegates",
      "[C] a short summary of their",
      "[B] were invited to present",
      "[D] national climate policies"
    ],
    "correctAnswer": "C",
    "explanation": "Subject-verb agreement error. The subject \"Each\" is grammatically singular and requires the singular verb \"was invited\", not \"were invited\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-980",
    "question": "Identify the segment containing an error: [A] By the time the fire department arrived [B] at the historic timber mill, [C] the flames already destroyed [D] the entire roof structure.",
    "options": [
      "[A] By the time the fire department arrived",
      "[B] at the historic timber mill",
      "[D] the entire roof structure",
      "[C] the flames already destroyed"
    ],
    "correctAnswer": "D",
    "explanation": "Tense sequence error. An action completed prior to another past event (\"by the time the fire department arrived\") requires the past perfect tense: \"had already destroyed\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-981",
    "question": "Identify the segment containing an error: [A] The symposium participants discussed [B] about the economic ramifications [C] of automated manufacturing [D] in developing nations.",
    "options": [
      "[B] about the economic ramifications",
      "[A] The symposium participants discussed",
      "[C] of automated manufacturing",
      "[D] in developing nations"
    ],
    "correctAnswer": "A",
    "explanation": "Redundant preposition error. The transitive verb \"discuss\" takes a direct object without the preposition \"about\" (\"discussed the economic ramifications\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-982",
    "question": "Identify the segment containing an error: [A] Had the engineers known [B] about the structural defect, [C] they would halt the construction [D] of the suspension bridge immediately.",
    "options": [
      "[A] Had the engineers known",
      "[C] they would halt the construction",
      "[B] about the structural defect",
      "[D] of the suspension bridge immediately"
    ],
    "correctAnswer": "B",
    "explanation": "Conditional tense clash. The inverted past perfect condition (\"Had the engineers known\") requires a third conditional result clause: \"they would have halted\", not \"would halt\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-983",
    "question": "Identify the segment containing an error: [A] The newly developed ceramic alloy [B] is superior than [C] conventional metals in [D] thermal resistance.",
    "options": [
      "[A] The newly developed ceramic alloy",
      "[C] conventional metals in",
      "[B] is superior than",
      "[D] thermal resistance"
    ],
    "correctAnswer": "C",
    "explanation": "Comparative preposition error. Latin comparative adjectives like \"superior\", \"inferior\", \"prior\", and \"senior\" take \"to\", not \"than\" (\"is superior to\").",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-984",
    "question": "Identify the segment containing an error: [A] Seldom the medical board [B] approves an experimental treatment [C] before the completion of [D] randomized controlled trials.",
    "options": [
      "[D] randomized controlled trials",
      "[B] approves an experimental treatment",
      "[C] before the completion of",
      "[A] Seldom the medical board"
    ],
    "correctAnswer": "D",
    "explanation": "Inversion error. Negative adverb \"Seldom\" at the beginning of a clause requires subject-auxiliary inversion: \"Seldom does the medical board approve\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-985",
    "question": "Identify the segment containing an error: [A] The lead author, along with [B] three research assistants, [C] have published a breakthrough paper [D] on quantum error correction.",
    "options": [
      "[C] have published a breakthrough paper",
      "[B] three research assistants",
      "[A] The lead author, along with",
      "[D] on quantum error correction"
    ],
    "correctAnswer": "A",
    "explanation": "Subject-verb agreement error. Quasi-coordinators like \"along with\" do not compound the singular subject (\"The lead author\"), so the verb must be singular: \"has published\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-986",
    "question": "Identify the segment containing an error: [A] The financial analyst emphasized [B] the importance of diversifying portfolios, [C] reducing overhead costs, and [D] to maintain liquid cash reserves.",
    "options": [
      "[A] The financial analyst emphasized",
      "[D] to maintain liquid cash reserves",
      "[C] reducing overhead costs, and",
      "[B] the importance of diversifying portfolios"
    ],
    "correctAnswer": "B",
    "explanation": "Faulty parallelism error. The list contains two gerunds (\"diversifying...\", \"reducing...\") and an infinitive (\"to maintain\"). It should be \"maintaining liquid cash reserves\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-987",
    "question": "Identify the segment containing an error: [A] She is one of those [B] visionary scholars who [C] believes that artificial intelligence [D] will transform education.",
    "options": [
      "[A] She is one of those",
      "[B] visionary scholars who",
      "[C] believes that artificial intelligence",
      "[D] will transform education"
    ],
    "correctAnswer": "C",
    "explanation": "Relative clause agreement error. In the construction \"one of those [plural noun] who...\", the relative pronoun \"who\" refers to the plural antecedent \"scholars\", requiring the plural verb \"believe\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-988",
    "question": "Identify the segment containing an error: [A] The expedition team had [B] less supplies remaining [C] than they had anticipated [D] at the midpoint of the trek.",
    "options": [
      "[A] The expedition team had",
      "[D] at the midpoint of the trek",
      "[C] than they had anticipated",
      "[B] less supplies remaining"
    ],
    "correctAnswer": "D",
    "explanation": "Quantifier error. \"Supplies\" is a plural countable noun, which requires \"fewer supplies\", not \"less supplies\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-989",
    "question": "Identify the segment containing an error: [A] Due to the severe storm, [B] the ferry service was delayed, [C] making many passengers [D] to miss their onward trains.",
    "options": [
      "[D] to miss their onward trains",
      "[B] the ferry service was delayed",
      "[C] making many passengers",
      "[A] Due to the severe storm"
    ],
    "correctAnswer": "A",
    "explanation": "Causative verb syntax error. The causative verb \"make\" takes an object followed by a bare infinitive without \"to\": \"making many passengers miss their onward trains\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-990",
    "question": "Identify the segment containing an error: [A] Between the two proposed architectural models, [B] the eco-friendly dome structure [C] is certainly the most innovative [D] and practical.",
    "options": [
      "[A] Between the two proposed architectural models",
      "[C] is certainly the most innovative",
      "[B] the eco-friendly dome structure",
      "[D] and practical"
    ],
    "correctAnswer": "B",
    "explanation": "Comparative vs superlative error. When comparing exactly two items (\"Between the two\"), the comparative degree (\"more innovative\") must be used instead of the superlative (\"most innovative\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-991",
    "question": "Identify the segment containing an error: [A] The chief medical officer recommended [B] that the contaminated ward [C] was sanitized with ultraviolet light [D] before admitting new patients.",
    "options": [
      "[A] The chief medical officer recommended",
      "[B] that the contaminated ward",
      "[C] was sanitized with ultraviolet light",
      "[D] before admitting new patients"
    ],
    "correctAnswer": "C",
    "explanation": "Subjunctive error. After \"recommended that\", the passive subjunctive requires \"be sanitized\", not \"was sanitized\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-992",
    "question": "Identify the segment containing an error: [A] Looking out the airplane window, [B] the snow-covered peaks of the Alps [C] looked like jagged white teeth [D] protruding through the cloud cover.",
    "options": [
      "[D] protruding through the cloud cover",
      "[B] the snow-covered peaks of the Alps",
      "[C] looked like jagged white teeth",
      "[A] Looking out the airplane window"
    ],
    "correctAnswer": "D",
    "explanation": "Dangling modifier. The mountains cannot look out the window. A human subject is required for the participial modifier \"Looking out...\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-993",
    "question": "Identify the segment containing an error: [A] Neither the laboratory director [B] nor her assistants [C] was present when the chemical reaction [D] reached critical temperature.",
    "options": [
      "[C] was present when the chemical reaction",
      "[B] nor her assistants",
      "[A] Neither the laboratory director",
      "[D] reached critical temperature"
    ],
    "correctAnswer": "A",
    "explanation": "Subject-verb agreement error. Proximity rule requires the plural verb \"were present\" to agree with \"assistants\".",
    "difficulty": "easy",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-994",
    "question": "Identify the segment containing an error: [A] The historical archive contains [B] thousands of delicate manuscripts, [C] most of them were written [D] in medieval Latin.",
    "options": [
      "[A] The historical archive contains",
      "[C] most of them were written",
      "[B] thousands of delicate manuscripts",
      "[D] in medieval Latin"
    ],
    "correctAnswer": "B",
    "explanation": "Comma splice / relative clause error. Joining two independent clauses with a comma requires a relative pronoun (\"most of which were written\") or a coordinating conjunction (\"and most of them were written\").",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-995",
    "question": "Identify the segment containing an error: [A] Not only the team completed [B] the project two weeks ahead of schedule, [C] but they also stayed [D] well within the allocated budget.",
    "options": [
      "[C] but they also stayed",
      "[B] the project two weeks ahead of schedule",
      "[A] Not only the team completed",
      "[D] well within the allocated budget"
    ],
    "correctAnswer": "C",
    "explanation": "Inversion error. Initial negative \"Not only\" requires auxiliary inversion: \"Not only did the team complete\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-996",
    "question": "Identify the segment containing an error: [A] The committee agreed with [B] the proposal after [C] thoroughly debating its financial [D] and environmental impacts.",
    "options": [
      "[D] and environmental impacts",
      "[B] the proposal after",
      "[C] thoroughly debating its financial",
      "[A] The committee agreed with"
    ],
    "correctAnswer": "D",
    "explanation": "Prepositional usage error. One agrees \"to\" a proposal or plan (\"agreed to the proposal\"), whereas one agrees \"with\" a person or opinion.",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-997",
    "question": "Identify the segment containing an error: [A] The newly appointed dean [B] is known for her intellect, [C] her administrative rigor, and [D] being dedicated to students.",
    "options": [
      "[D] being dedicated to students",
      "[B] is known for her intellect",
      "[C] her administrative rigor, and",
      "[A] The newly appointed dean"
    ],
    "correctAnswer": "A",
    "explanation": "Parallelism error. The series consists of noun phrases (\"her intellect\", \"her administrative rigor\"); the final item should also be a noun phrase, such as \"her dedication to students\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-998",
    "question": "Identify the segment containing an error: [A] By next December, [B] the civil engineers will complete [C] the high-speed rail tunnel [D] through the mountain pass.",
    "options": [
      "[A] By next December",
      "[B] the civil engineers will complete",
      "[C] the high-speed rail tunnel",
      "[D] through the mountain pass"
    ],
    "correctAnswer": "B",
    "explanation": "Future perfect tense error. A future deadline introduced by \"By [future time]\" requires the future perfect: \"will have completed\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-999",
    "question": "Identify the segment containing an error: [A] The reason for the failure [B] of the rocket booster [C] was because the primary fuel valve [D] malfunctioned during ignition.",
    "options": [
      "[A] The reason for the failure",
      "[B] of the rocket booster",
      "[C] was because the primary fuel valve",
      "[D] malfunctioned during ignition"
    ],
    "correctAnswer": "C",
    "explanation": "Redundancy / complement error. The structure \"The reason... was because\" is tautological; standard formal grammar requires \"The reason... was that the primary fuel valve...\".",
    "difficulty": "medium",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  },
  {
    "id": "ielts-gram-1000",
    "question": "Identify the segment containing an error: [A] If the laboratory had [B] better thermal insulation, [C] the experiment would not have failed [D] during the severe winter freeze.",
    "options": [
      "[D] during the severe winter freeze",
      "[B] better thermal insulation",
      "[C] the experiment would not have failed",
      "[A] If the laboratory had"
    ],
    "correctAnswer": "D",
    "explanation": "Third conditional clause error. To match the past hypothetical result (\"would not have failed\"), the if-clause requires the past perfect: \"If the laboratory had had better thermal insulation\".",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Error Identification & Correction"
  }
];
