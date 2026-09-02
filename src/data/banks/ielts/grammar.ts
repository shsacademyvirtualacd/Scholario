/**
 * IELTS 500-Question Authoritative Grammar MCQ Bank
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
// 500 GRAMMAR MCQS (SYLLABUS & IELTS ACCURATE)
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
    "explanation": "\"Honest\" begins with a silent 'h' and a vowel sound /ɒ/, requiring the indefinite article \"an\".",
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
    "explanation": "\"Hour\" begins with a silent 'h' and vowel sound /aʊə/, taking \"an\".",
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
    "explanation": "\"MBA\" is pronounced /ɛm.biː.eɪ/ starting with a vowel sound, requiring \"an\".",
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
  },
  {
    "id": "ielts-gram-456",
    "question": "Identify the sentence with correct dash usage for emphatic appositives:",
    "options": [
      "The core objective; reducing greenhouse gas emissions; remains the central goal of the treaty.",
      "The core objective-reducing greenhouse gas emissions-remains the central goal of the treaty.",
      "The core objective, reducing greenhouse gas emissions—remains the central goal of the treaty.",
      "The core objective—reducing greenhouse gas emissions—remains the central goal of the treaty."
    ],
    "correctAnswer": "D",
    "explanation": "Em-dashes (—) can enclose parenthetical or emphatic explanations cleanly.",
    "difficulty": "hard",
    "chapter": "Grammar",
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
    "topic": "Punctuation & Syntax"
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
  }
];
