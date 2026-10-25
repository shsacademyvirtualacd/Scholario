import { SageCharacterId } from './useSageAvatarState';

export type ThoughtCategory =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'timetable'
  | 'attendance'
  | 'announcements'
  | 'fees'
  | 'greeting'
  | 'urdu'
  | 'question'
  | 'long'
  | 'general';

export interface CharacterPersonaLines {
  /** Accent color used for thought bubble border, glow, and badges */
  accentColor: string;
  accentBg: string;
  accentText: string;
  role: string;
  personality: string;
  /** Categorized reaction lines while user is typing */
  typingReactions: Record<ThoughtCategory, string[]>;
  /** Lines displayed while waiting for the AI response to begin */
  thinkingLines: string[];
  /** Short snippets while writing/streaming */
  writingLines: string[];
  /** Lines displayed right after the answer finishes */
  doneLines: string[];
  /** Rare calm thought-bubble lines shown when completely idle */
  idleLines: string[];
}

export const SAGE_THOUGHT_DATA: Record<SageCharacterId, CharacterPersonaLines> = {
  'sage-classic': {
    accentColor: '#F4C430',
    accentBg: '#FFFDF0',
    accentText: '#854D0E',
    role: 'Classic Scholar',
    personality: 'Erudite, encouraging, and classic academy wisdom',
    typingReactions: {
      math: [
        'Ooh, is this a maths question? 🤔',
        'Formula derivation in progress...',
        'Checking the FBISE math syllabus...',
        'Algebraic steps formulating 📐',
        'Ah, let us solve this step-by-step!',
        'Setting up quadratic logic...',
        'Ready to crunch the numbers ✍️',
        'Geometry or calculus? Let us see!',
      ],
      physics: [
        'Physics laws coming to mind ⚡',
        'Calculating force and vectors...',
        'Newtonian mechanics ready 🍎',
        'Reviewing SI units and formulas...',
        'Speed, velocity, acceleration...',
        'Electromagnetism or optics? 🔬',
        'Checking the physics syllabus note vault...',
        'Deriving the physical principles...',
      ],
      chemistry: [
        'Balancing chemical equations 🧪',
        'Scanning the periodic table...',
        'Molecular bonds and mole concepts...',
        'Organic or inorganic chemistry?',
        'Acids, bases, or redox reaction...',
        'Checking FBISE 9th chemistry notes...',
        'Formulating the chemical balance...',
        'Atomic numbers lined up!',
      ],
      biology: [
        'Cellular diagrams and biology notes 🌿',
        'Recalling biological definitions...',
        'Organ systems and functions ready...',
        'Mitosis or respiration concepts?',
        'Reviewing 9th grade biology chapters...',
        'Anatomical diagrams at the ready!',
        'Checking photosynthesis pathways...',
        'Ready to explain biological systems 🧬',
      ],
      timetable: [
        'Looking up today\'s class timetable 📅',
        'Checking upcoming lecture slots...',
        'Reviewing daily schedule periods...',
        'Checking your enrolled classes...',
        'Timetable roster ready to display!',
        'Verifying morning and evening slots...',
        'Consulting the academy schedule...',
        'Let us see what class is next!',
      ],
      attendance: [
        'Let me check your attendance records 📊',
        'Calculating attendance percentage...',
        'Reviewing your present and absent logs...',
        'Checking monthly lecture tallies...',
        'Attendance summary ready to compile...',
        'Verifying your classroom presence...',
        'Checking FBISE eligibility ratio...',
        'Ready to pull your attendance stats!',
      ],
      announcements: [
        'Drafting ideas for that notice ✍️',
        'Reviewing official announcement guidelines...',
        'Formatting academic notification...',
        'Checking site announcement boards...',
        'Structuring the official memo...',
        'Refining announcement copy...',
        'Preparing clear bulletin bullet points...',
        'Ready to post to the academy bulletin!',
      ],
      fees: [
        'Consulting fee structures and challans 💳',
        'Checking scholarship deductions...',
        'Reviewing monthly tuition pricing...',
        'Checking fee receipts and vouchers...',
        'Calculating fee balances...',
        'Verifying scholarship tiers...',
        'Checking payment guidelines...',
        'Ready with fee and scholarship info!',
      ],
      greeting: [
        'Assalam-o-Alaikum! Welcome back 🌟',
        'Greetings! How may I assist you today?',
        'Wonderful to see you here today!',
        'Hello there! Ready to study?',
        'Peace be upon you! What shall we learn?',
        'Delighted to help you today 📚',
        'Welcome! What topic is on your mind?',
        'Hello! Sage is at your service!',
      ],
      urdu: [
        'اردو قواعد اور سوالات کے لیے تیار ہوں ✍️',
        'اردو ادب اور تشریح پر غور کر رہا ہوں...',
        'شاعری، اشعار اور خلاصے کا مطالعہ...',
        'اردو مضامین اور گرامر چیک کر رہا ہوں...',
        'سبق کا خلاصہ اور تفہیم تیار ہے...',
        'اردو لغت اور الفاظ کے معانی حاضر ہیں...',
        'اردو نصاب کی نوٹس بک ملاحظہ ہو رہی ہے...',
        'بہترین! اردو میں جواب تیار کیا جا رہا ہے...',
      ],
      question: [
        'Curious question! Analyzing details...',
        'Formulating a clear comprehensive answer...',
        'Consulting curriculum reference books...',
        'Breaking this down into easy steps...',
        'Connecting the foundational concepts...',
        'Preparing an insightful explanation...',
        'Checking textbook definitions...',
        'Gathering the key insights for you!',
      ],
      long: [
        'Detailed question! Reading carefully 📖',
        'Absorbing all your points thoroughly...',
        'Organizing a comprehensive answer...',
        'Parsing your question paragraph by paragraph...',
        'Drafting a deep step-by-step breakdown...',
        'Covering every detail you mentioned...',
        'Structure forming nicely...',
        'Ready to deliver a thorough answer!',
      ],
      general: [
        'Reading what you are typing...',
        'Formulating helpful study thoughts...',
        'Ready to answer your query...',
        'Listening attentively to your prompt...',
        'Connecting ideas together 💡',
        'Checking my knowledge vault...',
        'Preparing a helpful response...',
        'Always here to help you excel!',
      ],
    },
    thinkingLines: [
      'Checking the notes vault...',
      'Reviewing FBISE textbook references...',
      'Formulating the step-by-step answer...',
      'Organizing the clearest explanation...',
      'Cross-referencing past exam questions...',
      'Writing it up beautifully...',
    ],
    writingLines: [
      'Penning down the core steps...',
      'Writing clear explanations...',
      'Formatting formulas and definitions...',
      'Adding helpful exam tips...',
      'Polishing the final answer...',
    ],
    doneLines: [
      'Done! Anything else I can explain? ✨',
      'Completed! Hope this helps your study session!',
      'Finished! Ask any follow-up questions anytime!',
      'All set! Let me know if you need more details.',
    ],
    idleLines: [
      'Ready when you are! Ask me anything 📚',
      'Did you know? Revising within 24 hours boosts memory retention by 80%!',
      'Taking a breather? Stay hydrated while studying!',
      'Whenever you\'re ready, let\'s tackle your next topic!',
    ],
  },

  'ayan-scholar': {
    accentColor: '#2563EB',
    accentBg: '#EFF6FF',
    accentText: '#1E40AF',
    role: 'Head Boy Scholar',
    personality: 'Sharp, disciplined, methodical, and high-achieving',
    typingReactions: {
      math: [
        'Methodical math approach loading 📐',
        'Checking step-by-step proof structure...',
        'FBISE top-grade formulas aligned...',
        'Solving with maximum precision!',
        'Double-checking algebraic signs...',
        'Theorem verification ready ✏️',
        'Every step will be documented clearly!',
        'No shortcuts — proper academic method!',
      ],
      physics: [
        'Free body diagrams and vectors ready ⚡',
        'Checking textbook definitions and units...',
        'Physics precision is essential...',
        'Deriving laws with clean steps...',
        'Reviewing numerical formulas...',
        'Checking FBISE board paper patterns...',
        'Force, energy, and power mapped out!',
        'Rigorous physics analysis in progress...',
      ],
      chemistry: [
        'Balancing equation stoichiometrics 🧪',
        'Ensuring IUPAC naming accuracy...',
        'Valencies and oxidation states checked...',
        'Clear chemistry explanations ready...',
        'Analyzing reaction conditions...',
        'FBISE paper-style chemistry answers...',
        'Precision in chemical formulas is key!',
        'Reviewing lab concepts and equations...',
      ],
      biology: [
        'Organizing biology points with headings 🌿',
        'Clear biological terminology ready...',
        'Exam-focused diagram descriptions...',
        'Checking textbook taxonomy...',
        'Cell organelles and physiological steps...',
        'Top-scorer answer format ready 🧬',
        'Reviewing biological processes...',
        'Clean, bulleted biology notes ready!',
      ],
      timetable: [
        'Reviewing class periods systematically 📅',
        'Class attendance timetable loaded...',
        'Checking lecture time allocations...',
        'Optimizing your study schedule...',
        'Punctuality is the key to success!',
        'Slot verification complete...',
        'Checking next scheduled period...',
        'Academic timetable verified!',
      ],
      attendance: [
        'Auditing attendance percentage 📊',
        'Targeting 95%+ attendance metric...',
        'Reviewing present and absent tallies...',
        'Checking lecture attendance logs...',
        'Compiling exact attendance breakdown...',
        'Consistency builds excellence!',
        'Verification against roster rules...',
        'Attendance record analysis ready!',
      ],
      announcements: [
        'Drafting formal, concise notice ✍️',
        'Reviewing administrative wording...',
        'Ensuring professional notice structure...',
        'Checking policy compliance...',
        'Polishing announcement tone...',
        'Clarity and precision are paramount...',
        'Drafting executive academy bulletin...',
        'Official notice draft ready!',
      ],
      fees: [
        'Auditing tuition ledger details 💳',
        'Verifying scholarship percentages...',
        'Checking challan reconciliation...',
        'Transparent fee accounting review...',
        'Checking payment receipt status...',
        'Merit scholarship tier validated...',
        'Calculating net semester fee...',
        'Ledger details ready for review!',
      ],
      greeting: [
        'Good day! Ayan here, ready to work 📚',
        'Greetings! What are our academic goals today?',
        'Welcome! Let\'s make this session productive.',
        'Assalam-o-Alaikum! Ready for serious study.',
        'Hello! Let\'s achieve top marks together.',
        'Good to see you! What subject is next?',
        'Ready to tackle any challenging problem!',
        'Disciplined effort always pays off. What\'s up?',
      ],
      urdu: [
        'اردو کے قواعد اور اصطلاحات کا معائنہ ✍️',
        'اردو کے پرچے کے لیے معیاری جواب تیار ہے...',
        'اشعار کی تشریح اور حوالہ متن و سیاق...',
        'قواعد و انشا کے درست اصولوں پر عمل...',
        'امتحانی نقطہ نظر سے مکمل تیاری...',
        'اردو خطاطی اور تحریر کے اصول...',
        'ادبی اور معنوی باریکیاں ملاحظہ ہوں...',
        'بہترین امتحانی جواب کے لیے تیار!',
      ],
      question: [
        'Analytical breakdown starting...',
        'Structuring a comprehensive top-tier answer...',
        'Checking marking schemes and criteria...',
        'Clear headings and logical flow planned...',
        'Synthesizing the core principles...',
        'Preparing an exemplary explanation...',
        'Addressing every facet of your question...',
        'Precision analysis in progress!',
      ],
      long: [
        'Complex query! Breaking into sub-sections 📑',
        'Systematic decomposition in progress...',
        'Mapping out multi-part response...',
        'Analyzing all constraints and details...',
        'Ensuring no detail is left unexplained...',
        'Structuring with high academic rigor...',
        'Comprehensive synthesis underway...',
        'Ready to deliver an exhaustive answer!',
      ],
      general: [
        'Analyzing your input methodically...',
        'Formulating high-precision response...',
        'Checking reference notes...',
        'Ready to structure your answer...',
        'Focus and discipline applied 🎯',
        'Consulting study guidelines...',
        'Preparing structured breakdown...',
        'Ready to help you excel at the highest level!',
      ],
    },
    thinkingLines: [
      'Pushing up my glasses & checking notes...',
      'Analyzing curriculum marking schemes...',
      'Structuring with proper academic headings...',
      'Cross-referencing textbook chapters...',
      'Synthesizing a top-scorer response...',
    ],
    writingLines: [
      'Documenting key formulas with precision...',
      'Writing structured bullet points...',
      'Formatting exam-ready steps...',
      'Adding board exam pointers...',
      'Finalizing top-tier breakdown...',
    ],
    doneLines: [
      'Done! Every step verified and complete. 🎓',
      'Completed to top academic standards!',
      'All points addressed clearly. What\'s our next topic?',
      'Finished! Review the steps and let me know your thoughts.',
    ],
    idleLines: [
      'Staying sharp and focused. Ready when you are! 📝',
      'Study tip: Active recall tests your memory 3x better than rereading.',
      'Organized minds accomplish great things. What shall we study?',
      'Whenever you\'re ready to resume, let\'s push for full marks!',
    ],
  },

  'zain-explorer': {
    accentColor: '#F97316',
    accentBg: '#FFF7ED',
    accentText: '#C2410C',
    role: 'Campus Explorer',
    personality: 'Bouncy, enthusiastic, curious, and full of energy',
    typingReactions: {
      math: [
        'Whoa, math puzzles! Let\'s crack this! 🚀',
        'Numbers incoming! This is gonna be fun!',
        'Watch me solve this equation fast! ⚡',
        'Math adventure time! Grab your pencil!',
        'Setting up formula boosters...',
        'Cracking the code on this problem 🔍',
        'Boom! Math puzzle detected!',
        'Let\'s make this math problem easy-peasy!',
      ],
      physics: [
        'Physics in action! Forces and speed! 🏎️',
        'Rocket science or rollercoaster physics?',
        'Energy transfers are so cool! ⚡',
        'Gravity, friction, momentum — let\'s go!',
        'Testing out the physical experiments...',
        'Physics adventure unlocked!',
        'Whoa, calculating lightning speeds...',
        'Let\'s see how the universe works!',
      ],
      chemistry: [
        'Sparks and reactions! Chemistry time 💥',
        'Mixing elements and watching magic happen!',
        'Periodic table explorer on duty!',
        'Molecules, atoms, and cool reactions 🧪',
        'Let\'s balance this equation like a pro!',
        'Explosive knowledge incoming!',
        'Acid or base? Let\'s test the pH!',
        'Chemistry is pure fun! Solving now!',
      ],
      biology: [
        'Into the wild world of biology! 🐾',
        'Living cells are tiny power plants!',
        'Ecosystems, DNA, and wildlife wonders 🌿',
        'Zooming into microscopic wonders!',
        'How does the body work? Let\'s check!',
        'Biology exploration underway 🧬',
        'Photosynthesis: plants making superpowers!',
        'Ready to explore the living world!',
      ],
      timetable: [
        'Checking the daily mission schedule! 🗺️',
        'What adventure class is next on the list?',
        'Checking your timetable radar...',
        'Schedule scan complete! Let\'s go!',
        'Class bell ready to ring! 🔔',
        'Timetable explorer checking slots...',
        'Ready for the next lesson challenge!',
        'Got your schedule mapped out!',
      ],
      attendance: [
        'Counting your attendance streaks! 🏆',
        'Show up every day to win! Checking stats...',
        'Awesome attendance streak check!',
        'Tracking your daily presence streak...',
        'Attendance leaderboard stats loading 📊',
        'Keep that high percentage going!',
        'You\'re doing great! Checking the count...',
        'Attendance badge tracker ready!',
      ],
      announcements: [
        'Big news incoming! Drafting alert 📢',
        'Making this notice super catchy!',
        'Campus buzz and announcement ideas...',
        'Spreading the word across the academy!',
        'Drafting high-energy bulletin...',
        'Headlines that grab everyone\'s eyes!',
        'Campus announcement in the works 📣',
        'Ready to broadcast to everyone!',
      ],
      fees: [
        'Checking the treasure chest fees! 🪙',
        'Scholarship discount unlock incoming!',
        'Making fees super simple to understand...',
        'Checking vouchers and fee discounts...',
        'Budget numbers sorted out 💰',
        'Scholarship savings calculating...',
        'Fee info simplified and clear!',
        'Ready with all the financial details!',
      ],
      greeting: [
        'Hey hey! Zain is pumped and ready! 🎉',
        'What\'s up! Ready for an awesome study sprint?',
        'Assalam-o-Alaikum! Let\'s explore something new!',
        'Yooo! Great to see you! What are we learning?',
        'Welcome to the adventure! Let\'s jump in!',
        'High five! Ready to conquer this topic! ✋',
        'Hey there! Got my backpack ready to roll!',
        'Super excited to solve this with you!',
      ],
      urdu: [
        'اردو کی دنیا میں خوش آمدید! زبردست 🌟',
        'چلیے مل کر اردو کا معمہ حل کرتے ہیں!',
        'اشعار اور کہانیاں سننے کے لیے تیار...',
        'اردو گرامر اب بالکل آسان ہوگی!',
        'شاندار الفاظ کا ذخیرہ تلاش کر رہا ہوں...',
        'اردو کا سفر بہت دلچسپ ہے!',
        'سبق کے اہم نکات سامنے لا رہا ہوں...',
        'چلیے شروع کرتے ہیں، مزہ آئے گا!',
      ],
      question: [
        'Ooh exciting question! Let\'s investigate! 🔎',
        'Brainstorming the coolest explanation!',
        'Diving deep into the answer vault...',
        'Connecting the puzzle pieces...',
        'Figuring out the smartest way to show this!',
        'On the trail of the right answer!',
        'Got my curiosity engines fired up!',
        'Let\'s unlock the secret behind this!',
      ],
      long: [
        'Epic long question! Challenge accepted! 🧗',
        'Reading every single awesome word...',
        'Packing my study backpack for this big one!',
        'Breaking down this mega question...',
        'Step 1, Step 2, Step 3 — let\'s conquer it!',
        'Big questions mean big discoveries!',
        'Digging through the whole story...',
        'Ready with a giant, awesome answer!',
      ],
      general: [
        'I see you typing! Thinking fast! ⚡',
        'Curiosity meter maxing out!',
        'Brain buzzing with ideas...',
        'Ready to roll on your question!',
        'Exploring the quickest solution 🚀',
        'Locked in and pumped to answer!',
        'Adventure begins in 3... 2... 1...',
        'Always ready for the next fun challenge!',
      ],
    },
    thinkingLines: [
      'Bouncing ideas around & checking notes!',
      'Cracking the code on this problem...',
      'Digging into the study vault backpack...',
      'Connecting all the puzzle pieces...',
      'Putting together an awesome answer!',
    ],
    writingLines: [
      'Typing it up lightning fast! ⚡',
      'Putting all the coolest steps in order...',
      'Making this super clear and fun!',
      'Adding tips to help you remember...',
      'Almost there! Finishing the sprint!',
    ],
    doneLines: [
      'Boom! Done! Wasn\'t that awesome? 🚀',
      'Nailed it! What\'s our next big challenge?',
      'All finished! You\'re gonna ace this!',
      'Done and dusted! Ask me anything else anytime!',
    ],
    idleLines: [
      'Ready to explore anytime! Give me a challenge! 🎒',
      'Fun fact: Your brain uses 20% of your body\'s energy while studying!',
      'Did a little stretch! Now I\'m even more energized!',
      'Whenever you\'re ready, let\'s crush another topic!',
    ],
  },

  'hamza-kurta': {
    accentColor: '#10B981',
    accentBg: '#ECFDF5',
    accentText: '#047857',
    role: 'Traditional Scholar',
    personality: 'Courteous, humble, gentle, and culturally grounded',
    typingReactions: {
      math: [
        'Bismillah, let us examine these numbers 📐',
        'Patience and care in mathematical steps...',
        'A lovely mathematical question to ponder...',
        'Formulating the solution with clarity...',
        'Step-by-step arithmetic harmony...',
        'Algebraic balance with gentle care ✍️',
        'Checking the formulas with deep thought...',
        'May this solution bring clarity and ease.',
      ],
      physics: [
        'Reflecting on the natural physical laws 🌌',
        'The balance and beauty of the physical world...',
        'Formulating forces and motion calmly...',
        'Checking foundational physics principles...',
        'Clear and thoughtful physics explanation...',
        'Units, formulas, and derivations prepared...',
        'Observing the orderly laws of science...',
        'Ready to explain with utmost patience.',
      ],
      chemistry: [
        'Observing molecular balance with care 🧪',
        'Chemical reactions in steady balance...',
        'Reflecting on atomic harmony and bonds...',
        'Preparing clear, respectful chemistry notes...',
        'Balancing every single atom methodically...',
        'Gentle and thorough chemistry guidance...',
        'Science reflects orderly design...',
        'Chemical formulas ready to explain!',
      ],
      biology: [
        'Contemplating the wonders of life 🌿',
        'How beautifully living organisms function...',
        'Cellular wisdom and biological processes...',
        'Preparing respectful biology notes...',
        'Clear definitions of life science...',
        'Biological systems explained simply 🧬',
        'Wonders of human and plant biology...',
        'Patience and clarity in every concept.',
      ],
      timetable: [
        'Time is a precious blessing ⏳',
        'Reviewing your scheduled class hours...',
        'Punctual and blessed study routines...',
        'Checking lecture times for today...',
        'May your time be fruitful and blessed...',
        'Consulting daily timetable slots 📅',
        'Organizing classes with peace of mind...',
        'Timetable details ready for you.',
      ],
      attendance: [
        'Diligence and presence are virtues 📊',
        'Checking your faithful attendance records...',
        'Consistency in learning brings great barakah...',
        'Reviewing your class presence with care...',
        'Every day of learning counts...',
        'Attendance records examined calmly...',
        'Steadfast dedication brings success...',
        'Your attendance summary is ready.',
      ],
      announcements: [
        'Drafting thoughtful and polite words ✍️',
        'A graceful and respectful announcement...',
        'Ensuring kindness and clarity in notices...',
        'Preparing official words for the community...',
        'Drafting with warmth and professionalism...',
        'Words chosen with care and dignity...',
        'May this message be received well...',
        'Academy bulletin draft prepared.',
      ],
      fees: [
        'Transparency and fairness in every transaction 💳',
        'Checking tuition and scholarship assistance...',
        'Relief and scholarship calculations with care...',
        'Reviewing fee details with complete honesty...',
        'May this bring ease to your family...',
        'Examining voucher and discount records...',
        'Fairness and clarity in financial matters...',
        'Fee details ready with complete clarity.',
      ],
      greeting: [
        'Assalam-o-Alaikum wa Rahmatullah 🌸',
        'May peace and blessings accompany your day.',
        'A warm welcome to you, dear student.',
        'Welcome! It is an honor to assist you.',
        'Peace be upon you! How may I be of service?',
        'Welcome back to your quiet learning sanctuary.',
        'May your seeking of knowledge be rewarded.',
        'Hello! With kindness and care, I am here.',
      ],
      urdu: [
        'السلام علیکم! اردو زبان و ادب میں خوش آمدید 🌺',
        'اردو کی خوبصورتی اور شائستگی کے ساتھ حاضر...',
        'اشعار کا حسن اور باوقار تشریح...',
        'سبق کی روح اور اخلاقی پہلو کا جائزہ...',
        'سلیس اور باادب اردو میں رہنمائی...',
        'الفاظ کی مٹھاس اور گرامر کی درستی...',
        'ادب و انشا کی روایات کے مطابق جواب...',
        'اللہ آپ کے علم میں برکت عطا فرمائے...',
      ],
      question: [
        'A thoughtful inquiry deserves a patient answer...',
        'Pondering the wisdom behind this topic...',
        'Crafting a serene and thorough explanation...',
        'Reflecting on the core essence of your question...',
        'Taking time to explain every gentle nuance...',
        'Knowledge grows when shared with kindness...',
        'Preparing a clear, dignified answer...',
        'May this answer illuminate your path.',
      ],
      long: [
        'A comprehensive question, read with sincere care 📜',
        'Reflecting deeply on all you have shared...',
        'Structuring with patience, step by step...',
        'Giving full attention to every word...',
        'Preparing a thorough and peaceful guide...',
        'Every question carries great value...',
        'Organizing a rich and detailed reply...',
        'Ready to provide heartfelt academic help.',
      ],
      general: [
        'Reading your words with quiet attention...',
        'Formulating thoughts with warmth and care...',
        'Ready to assist you with gentle patience...',
        'May your studies be easy and blessed 🤲',
        'Reflecting quietly on your thoughts...',
        'Preparing an honest and helpful answer...',
        'Always here to support your journey...',
        'Knowledge is light — preparing to share it.',
      ],
    },
    thinkingLines: [
      'Reflecting calmly on the textbook notes...',
      'Pondering the clearest way to explain...',
      'Structuring with patience and gentle care...',
      'Reviewing the lesson with full attention...',
      'Writing a blessed and clear response...',
    ],
    writingLines: [
      'Penning each step with care and dignity...',
      'Explaining the concepts with simplicity...',
      'Formulating with warmth and clarity...',
      'Adding thoughtful tips for your exams...',
      'Finalizing a peaceful, thorough answer...',
    ],
    doneLines: [
      'Alhamdulillah, all done! May it be of benefit. 🌸',
      'Completed with care. Please let me know if you need more help.',
      'Finished! May your studies bring you peace and success.',
      'All clear! Take your time reading through, and ask freely.',
    ],
    idleLines: [
      'At peace and ready whenever you need me. 🌿',
      'Gentle reminder: Taking a calm breath clears the mind for learning.',
      'Patience in learning turns challenges into wisdom.',
      'Whenever you wish to continue, I am humbly here.',
    ],
  },

  'nova-bot': {
    accentColor: '#06B6D4',
    accentBg: '#ECFEFF',
    accentText: '#0891B2',
    role: 'Cyber Companion',
    personality: 'Futuristic, visor-displaying, witty, and ultra-fast',
    typingReactions: {
      math: [
        'Query parsed: Math algorithms engaged! 🤖',
        'Calculating numeric solutions at 100 GFLOPS...',
        'Algebraic syntax recognized and verified 📐',
        'Deriving equation matrices in parallel...',
        'Formula database indexed: solution compiled!',
        'Zero error tolerance: calculating exact steps...',
        'Math coprocessor humming at peak efficiency!',
        'Vector spaces and geometric proofs mapped!',
      ],
      physics: [
        'Telemetry confirmed: Physics laws processing ⚡',
        'Simulating gravitational field vectors...',
        'Kinematic calculations running in real-time...',
        'Electromagnetic spectrum analysis ready...',
        'Physics module v2.0 online and responding!',
        'Checking physical constants to 8 decimal places...',
        'Quantum to classical physics translation active...',
        'Simulation engines primed for output!',
      ],
      chemistry: [
        'Molecular bonds and electron shells mapped 🧪',
        'Balancing reaction thermodynamics...',
        'Stoichiometric balance calculated to precision!',
        'Scanning periodic table telemetry...',
        'Chemical reaction pathway synthesized...',
        'pH gradients and redox potentials verified...',
        'Atomic lattice structures ready to render!',
        'Chemical formula syntax 100% validated!',
      ],
      biology: [
        'Biometric scan: Biology modules loaded 🧬',
        'DNA sequencer and cellular logic primed...',
        'Mapping physiological pathways...',
        'Microscopic cellular telemetry active...',
        'Photosynthesis energy cycles computed...',
        'Organ system diagrams cached in buffer...',
        'Biological taxonomy indexed...',
        'Life sciences protocol initiated!',
      ],
      timetable: [
        'Syncing chronological class schedule 🛰️',
        'Temporal timetable coordinates mapped...',
        'Accessing live academy timetable registry...',
        'Checking lecture time stamps and rooms...',
        'Schedule optimization vectors aligned...',
        'Next class coordinates ready to transmit ⏰',
        'Timetable database pinged: 0ms latency!',
        'Your daily agenda is locked and loaded!',
      ],
      attendance: [
        'Parsing attendance telemetry logs 📊',
        'Attendance ratio computed: accuracy 100%!',
        'Auditing attendance timestamps...',
        'Biometric roll call verification active...',
        'Presence data normalized against calendar...',
        'Attendance percentage analytics ready...',
        'Log registry verified against policy...',
        'Status report compiled and ready to display!',
      ],
      announcements: [
        'Synthesizing broadcast transmission 📡',
        'Formatting high-impact bulletin parameters...',
        'Announcement data packets structured...',
        'Optimizing text readability index...',
        'Transmission frequency set to academy wide!',
        'Drafting bulletin with cryptographic clarity...',
        'System broadcast drafted and queued...',
        'Broadcast template ready to deploy!',
      ],
      fees: [
        'Decrypting tuition fee ledger data 💳',
        'Scholarship percentage algorithms applied...',
        'Calculating net voucher balances...',
        'Financial logic gates cleared...',
        'Scholarship matrix validated...',
        'Verifying payment tokens and receipts...',
        'Numeric fee totals calculated without discrepancy...',
        'Ledger summary ready for transmission!',
      ],
      greeting: [
        'Beep-boop! Nova online & fully operational! 🤖',
        'Greetings, user! Systems primed to assist you!',
        'Telemetry locked: Nova ready for study protocols!',
        'Assalam-o-Alaikum! Cyber companion standing by!',
        'System status: 100% operational! What\'s our task?',
        'Hello! My processors are dedicated to your success!',
        'Visor displays set to happy mode! Let\'s go! ✨',
        'Nova online! How can my circuits help you today?',
      ],
      urdu: [
        'اردو زبان کا الگورتھم چالو ہو گیا ہے 🤖',
        'ڈیٹا بیس سے اردو کے مستند جوابات تلاش کر رہا ہوں...',
        'اردو قواعد اور اعراب کی درست جانچ...',
        'اشعار کی مکمل اور جدید ترین تشریح...',
        'الفاظ کے معانی ہائی اسپیڈ سے سرچ ہو رہے ہیں...',
        'اردو ٹرانسمیشن کامیابی سے تیار ہے!',
        'نصاب کے مطابق پوائنٹس مرتب ہو چکے ہیں...',
        'نوا روبوٹ اردو میں مدد کے لیے مکمل تیار!',
      ],
      question: [
        'Input query logged! Running neural search... 🔍',
        'Deconstructing inquiry into logical components...',
        'Query processing: generating optimal output...',
        'Traversing educational knowledge graphs...',
        'Syntax analyzed: calculating solution vectors...',
        'Filtering noise: isolating core solution facts...',
        'Logical deduction tree branching...',
        'Solution packet assembled and verified!',
      ],
      long: [
        'Multi-megabyte query detected! Parsing buffer 💾',
        'Segmenting prompt into parallel processing threads...',
        'Deep semantic indexing in progress...',
        'Handling high-density information query...',
        'Multi-factor analysis running smoothly...',
        'Synthesizing comprehensive master response...',
        'All constraints parsed and factored in...',
        'Full spectrum breakdown ready for transmission!',
      ],
      general: [
        'Keystroke telemetry detected! Processing... ⚡',
        'Nova\'s visor antenna blinking with ideas...',
        'Running background diagnostic checks...',
        'Stand by: formulating smart solution...',
        'Logic circuits fully engaged! 💡',
        'Processing data packets...',
        'Cyber assistant ready to fire!',
        'Always powered up to help you achieve 100%!',
      ],
    },
    thinkingLines: [
      'Visor glowing: scanning knowledge database...',
      'Computing step-by-step algorithms...',
      'Synthesizing educational data vectors...',
      'Running parallel neural queries...',
      'Finalizing formatted response packet...',
    ],
    writingLines: [
      'Streaming data packets to display... ⚡',
      'Rendering logical steps and formulas...',
      'Compiling clear diagnostic points...',
      'Formatting bullet points in buffer...',
      'Output generation at 99.8% completion...',
    ],
    doneLines: [
      'Transmission complete! All systems green! 🚀',
      'Solution compiled and delivered! Anything else?',
      'Mission success! Nova is ready for next input.',
      'Data streamed! Hope this boosts your performance score!',
    ],
    idleLines: [
      'Hovering quietly in low-power standby mode. 🔋',
      'Fact: Flash memory stores data using floating-gate transistors!',
      'All diagnostic sensors nominal. Ready whenever you are!',
      'Processing queues clear: input your next study query anytime!',
    ],
  },

  'milo-owl': {
    accentColor: '#D97706',
    accentBg: '#FEF3C7',
    accentText: '#B45309',
    role: 'Library Owl',
    personality: 'Wise, cozy, book-loving, and gently hooting',
    typingReactions: {
      math: [
        'Hoot! Flipping to the math chapter 📖',
        'Math wisdom gathered through the centuries...',
        'Peering through my glasses at those numbers 🦉',
        'Equations look so neat on parchment!',
        'Hoot-hoot! Calculation steps unfolding...',
        'Checking ancient and modern geometry proofs...',
        'Let us solve this puzzle together quietly...',
        'Wise math solutions ready to transcribe!',
      ],
      physics: [
        'Adjusting my reading spectacles for physics 👓',
        'The timeless principles of nature and motion...',
        'Hoot! Checking the physics treatise on the shelf...',
        'From Galileo to Newton, physics is magnificent...',
        'Calculating forces with patient owl eyes...',
        'Flipping through the physics reference tome...',
        'Energy, light, and optics reviewed with care...',
        'Wise physics notes ready to unfold!',
      ],
      chemistry: [
        'Dusting off the ancient chemistry parchment 🧪',
        'The mysteries of atoms and alchemy unveiled...',
        'Balancing reactions like a seasoned scholar...',
        'Hoot! Periodic table scrolls unrolled!',
        'Molecular bonds and atomic numbers noted...',
        'Reading through the chemistry laboratory notes...',
        'Careful and precise chemistry wisdom...',
        'Let us unveil the chemical reactions!',
      ],
      biology: [
        'Ah, the grand forest of biological wonders! 🌲',
        'Hoot! Wing feathers rustling through biology texts...',
        'Living nature holds the deepest secrets 🦉',
        'Microscopic cells to mighty ecosystems...',
        'Examining the biology diagrams on page 42...',
        'Biological taxonomy and kingdom classifications...',
        'Nature\'s wisdom ready to share with you 🌿',
        'A wonderful life sciences question to explore!',
      ],
      timetable: [
        'Checking the great academy timetable scroll 📜',
        'Hoot! Every hour has its dedicated purpose...',
        'Flipping the parchment to today\'s schedule...',
        'Checking your lecture calendar with care...',
        'Morning and evening slots clearly marked...',
        'Orderly timetables make for tranquil minds ⏰',
        'Reviewing class times from the library tower...',
        'Your academic timetable is mapped out!',
      ],
      attendance: [
        'Examining the academy roll call register 📖',
        'Hoot! Punctual attendance is true scholarship...',
        'Checking your presence marks with a quill...',
        'Consistently attending brings deep knowledge...',
        'Attendance tallies recorded in the library ledger 📊',
        'A steady student builds a great future...',
        'Reviewing attendance logs from my perch...',
        'Your attendance summary is ready!',
      ],
      announcements: [
        'Inscribing an official academy proclamation 🖋️',
        'Hoot! Words of wisdom for the student body...',
        'Dusting off the town-crier bulletin scroll...',
        'Drafting clear announcements for all to see...',
        'Selecting dignified and clear words...',
        'Ruffling feathers and polishing the notice...',
        'Proclamation ready for the academy gates!',
        'Library bulletin draft complete!',
      ],
      fees: [
        'Reviewing the bursar\'s fee ledger with care 🪙',
        'Scholarships rewarded to earnest learners...',
        'Checking vouchers and tuition balance scrolls...',
        'Hoot! Clear accounts make peaceful minds...',
        'Examining financial assistance guidelines...',
        'Transparent fee and scholarship records...',
        'Fair tuition bookkeeping ready to inspect...',
        'Ledger details compiled for you!',
      ],
      greeting: [
        'Hoot-hoot! Welcome to our cozy library corner! 🦉',
        'Assalam-o-Alaikum! A warm hoot of welcome!',
        'Greetings, fellow seeker of knowledge! 📚',
        'Welcome! What dusty tome shall we open today?',
        'Hoot! Milo is thrilled to read with you today!',
        'Adjusting my spectacles — welcome, dear student!',
        'Peace and wisdom be upon your learning path.',
        'A cup of study warmth and wise answers await!',
      ],
      urdu: [
        'ہُو ہُو! اردو ادب کی لائبریری میں خوش آمدید 📖',
        'قدیم و جدید اردو لغت کے صفحات کھل رہے ہیں...',
        'شاعری، غزلیں اور سبق آموز کہانیاں...',
        'اشعار کی گہری اور دلنشین تشریح...',
        'اردو املا اور خوبصورت عبارت کی تیاری...',
        'بڑے بوڑھوں اور اساتذہ کی حکمت ملاحظہ ہو...',
        'علم و ادب کا حسین سنگم تیار ہو رہا ہے...',
        'اردو کے پرچے میں کامیابی کی کنجی حاضر ہے!',
      ],
      question: [
        'A scholarly question! Ruffling through my book 📖',
        'Checking the indexed references in my library...',
        'Hoot! Connecting ideas across chapters...',
        'Pondering the wisdom behind this puzzle...',
        'Consulting the grand library archives...',
        'Flipping through pages of proven knowledge...',
        'Gathering the golden nuggets of insight for you...',
        'The answer is unfolding like a fine parchment!',
      ],
      long: [
        'A grand manuscript of a question! How delightful 📜',
        'Reading every single sentence with rapt attention...',
        'Hoot! Setting my bookmark on this rich query...',
        'Weaving together a masterwork explanation...',
        'Consulting several volumes to do this justice...',
        'A deep inquiry deserves an enlightened reply...',
        'Flipping through multiple chapters with care...',
        'Ready to present a beautifully comprehensive answer!',
      ],
      general: [
        'Watching your quill move across the page... ✒️',
        'Pondering wisely from my library perch...',
        'Ready to share bookish insights with you...',
        'Hoot! Knowledge is the greatest treasure 🌟',
        'Flipping pages in anticipation...',
        'Wisdom brewing in my little owl book...',
        'Adjusting reading glasses to inspect your thoughts...',
        'Always here in your study nook to guide you!',
      ],
    },
    thinkingLines: [
      'Flipping through the library tome pages...',
      'Ruffling feathers and cross-referencing chapters...',
      'Formulating the most insightful explanation...',
      'Checking ancient & modern curriculum archives...',
      'Writing it down with a golden quill...',
    ],
    writingLines: [
      'Inscribing wise words with my quill... 🖋️',
      'Turning to the key references in my book...',
      'Formatting clear points on the parchment...',
      'Adding scholarly tips for your revision...',
      'Polishing the final sentences with care...',
    ],
    doneLines: [
      'Hoot! All done and inscribed on parchment! 📖✨',
      'Completed! May this wisdom serve you well!',
      'Finished! Come back for more whenever curiosity calls.',
      'All set! Let me know if you wish to read further.',
    ],
    idleLines: [
      'Perched quietly with my book, ready when you are. 🦉',
      'Wise owl tip: Reading notes aloud activates auditory memory pathways!',
      'Taking a quiet moment among the library bookshelves...',
      'Whenever curiosity strikes, I will be right here with my book.',
    ],
  },

  'tango-cat': {
    accentColor: '#F59E0B',
    accentBg: '#FFFBEB',
    accentText: '#B45309',
    role: 'Campus Cat Guide',
    personality: 'Playful orange tabby with a gold scarf, pencil behind ear, and swishing tail',
    typingReactions: {
      math: [
        'Purr-fect! A maths puzzle to pounce on! 🐾',
        'Sharpening my pencil for these numbers ✏️',
        'Tail swishing... calculating the formula!',
        'Counting on my soft paws... step by step!',
        'Algebraic yarn untangling nicely 🐱',
        'Pouncing on that quadratic equation!',
        'Checking the FBISE math notes with a purr...',
        'No math problem can hide from these cat eyes!',
      ],
      physics: [
        'Cats always land on their feet — pure physics! ⚡',
        'Tracking velocity and momentum like a laser dot!',
        'Ears twitching at those physics formulas 🐾',
        'Newton\'s laws? I test gravity every day!',
        'Calculating forces and vectors with a purr...',
        'Optics and light beams — my favorite chase!',
        'Checking the physics syllabus vault...',
        'Pouncing on the exact physical derivation!',
      ],
      chemistry: [
        'Curiosity never hurt this cat — chemistry time! 🧪',
        'Sniffing out the periodic table elements...',
        'Balancing equations with a flick of my tail!',
        'Molecules and bonds lining up purr-fectly!',
        'Checking covalent and ionic reactions...',
        'Whiskers twitching over this chemical formula!',
        'Reviewing the chemistry note vault...',
        'Let\'s mix up a clear, top-marks answer!',
      ],
      biology: [
        'Feline instincts activated for biology! 🌿',
        'From tiny cells to big ecosystems — fascinating!',
        'Purring over these biological diagrams 🧬',
        'Checking how living organisms thrive...',
        'Flipping through the biology chapter notes...',
        'Mitosis, genetics, and life science ready!',
        'Ears perked up for this biology topic!',
        'Ready to explain nature\'s wonders!',
      ],
      timetable: [
        'Checking class times between my catnaps! 📅',
        'When is the next live lecture? Let\'s check!',
        'Scanning your daily study schedule 🐾',
        'Keeping track of every period on the dot!',
        'Paws on the timetable — checking your classes...',
        'Making sure you never miss a session!',
        'Schedule lined up neat and tidy!',
        'Let\'s see which subject is up next!',
      ],
      attendance: [
        'Paws present and accounted for! Checking stats 📊',
        'Tallying your daily attendance streak...',
        'High attendance means happy exam clearance!',
        'Checking your present and absent logs...',
        'Keeping your attendance purr-fectly on track!',
        'Reviewing classroom roll-call numbers...',
        'Counting up your lecture presence...',
        'Your attendance summary is ready!',
      ],
      announcements: [
        'Meow-velous news incoming! Drafting notice ✍️',
        'Grabbing the pencil behind my ear to write...',
        'Making this academy notice crisp and clear!',
        'Polishing the bulletin for everyone on campus...',
        'Structuring the official announcement...',
        'Tail swishing while I draft the headline...',
        'Preparing a clean, friendly campus memo...',
        'Announcement draft ready to pounce!',
      ],
      fees: [
        'Checking the tuition fee & scholarship vault 💳',
        'Purr-using your fee challan and discount info...',
        'Making fee rates super clear and simple...',
        'Checking term billing and multi-subject discounts...',
        'Verifying payment and receipt guidelines...',
        'Sorting out the numbers neatly for you...',
        'Checking scholarship tiers with care...',
        'All fee details lined up clearly!',
      ],
      greeting: [
        'Meow & Assalam-o-Alaikum! Tango here! 🐱🐾',
        'Purr-fect timing! What are we studying today?',
        'Hello friend! *happy ear twitch* Ready to learn?',
        'Welcome back! My pencil is sharpened and ready!',
        'Hey there! Tail swishing and ready to help!',
        'Assalam-o-Alaikum! Let\'s pounce on your questions!',
        'So happy to see you! What topic is on your mind?',
        'Paws on the desk — let\'s ace this together!',
      ],
      urdu: [
        'اردو کے سوالات کے لیے میرا پینسل تیار ہے! 🐾',
        'اردو ادب اور اشعار کی تشریح دیکھ رہا ہوں...',
        'نصاب کے مطابق بہترین اردو جواب تیار ہو رہا ہے...',
        'اردو گرامر اور خلاصے پر غور جاری ہے...',
        'خوبصورت الفاظ اور معانی جمع کر رہا ہوں...',
        'اردو کی کتاب سے اہم نکات تلاش کر لیے ہیں...',
        'آئیے مل کر اردو کا یہ سوال حل کریں!',
        'بہترین امتحانی تیاری کے لیے حاضر ہوں!',
      ],
      question: [
        'Ears perked up! That\'s a great question! 🐱',
        'Chasing down the clearest explanation for you...',
        'Grabbing my pencil to sketch out the steps...',
        'Paws tapping while I connect the concepts...',
        'Looking into the Subject Note Vault...',
        'Breaking this down into bite-sized pieces...',
        'Tail swishing with a clever solution...',
        'Got the answer locked in my sights!',
      ],
      long: [
        'Whoa, a big yarn of a question! Unraveling it 🧶',
        'Reading every single line with curious cat eyes...',
        'Breaking this big question into neat steps...',
        'No detail escapes my whiskers!',
        'Organizing a complete, thorough breakdown...',
        'Paws working overtime on this detailed prompt...',
        'Mapping out every part of your question...',
        'Ready to deliver a purr-fect full answer!',
      ],
      general: [
        'Watching your cursor with curious cat eyes... 👀',
        'Pencil ready behind my ear! Keep typing!',
        'Tail swishing gently while I read along...',
        'Purring and thinking of helpful study tips...',
        'Ready to pounce on your question anytime! 🐾',
        'Checking my notes pad for the best explanation...',
        'Listening closely with perked-up ears...',
        'Always here to make studying fun and easy!',
      ],
    },
    thinkingLines: [
      'Swishing my tail & checking the notes vault...',
      'Grabbing the pencil behind my ear to work it out...',
      'Paws tapping through the syllabus chapters...',
      'Untangling the steps for a purr-fect answer...',
      'Writing it up neatly on my pad...',
    ],
    writingLines: [
      'Paws tapping fast on the notepad... 🐾',
      'Jotting down the clearest steps with my pencil...',
      'Formatting formulas and neat bullet points...',
      'Adding a clever exam tip for you...',
      'Finishing up with a happy purr...',
    ],
    doneLines: [
      'Purr-fect! All done! Anything else to explore? 🐱🐾',
      'Finished! *happy slow blink* Hope that helps!',
      'There you go! Pounce on another question anytime!',
      'All wrapped up neatly! What shall we tackle next?',
    ],
    idleLines: [
      'Swishing my tail quietly — ask me anything anytime! 🐾',
      'Cat study tip: Short 25-minute focus sprints keep your mind super sharp!',
      '*Slow friendly blink* Ready whenever you want to start!',
      'Doodling little paw prints on my pad while you think...',
    ],
  },

  'gigi-giraffe': {
    accentColor: '#EAB308',
    accentBg: '#FEFCE8',
    accentText: '#A16207',
    role: 'Gentle Giraffe',
    personality: 'Tall, graceful giraffe with a gold bow tie who bends down kindly as you type',
    typingReactions: {
      math: [
        'Bending down to take a closer look at those numbers 🦒',
        'High-level math overview with step-by-step care...',
        'Adjusting my golden bow tie for some algebra 📐',
        'Looking over the whole equation from up here!',
        'Gentle, clear mathematical steps forming...',
        'Checking the FBISE math formulas in my little book...',
        'From big-picture theorems to tiny decimals!',
        'Let us solve this math problem gracefully!',
      ],
      physics: [
        'Seeing the big picture of physics and motion ⚡',
        'Gravity and potential energy ($mgh$) are my specialty!',
        'Bending my neck down to check the vectors...',
        'Reviewing formulas and SI units in my study book...',
        'Calm, clear physics derivations on the way...',
        'Checking optics, waves, and mechanics...',
        'Looking across the physics syllabus vault...',
        'Preparing a tall, well-structured physics answer!',
      ],
      chemistry: [
        'Peering closely at those chemical equations 🧪',
        'Balancing atoms with gentle precision...',
        'Checking the periodic table from top to bottom!',
        'Organic and inorganic concepts clearly explained...',
        'Flipping through my chemistry notes...',
        'Making molecular bonds easy to visualize...',
        'Careful stoichiometry steps coming right up...',
        'Ready with a warm, clear chemistry breakdown!',
      ],
      biology: [
        'Ah, biology and the wonderful natural world! 🌿',
        'From tall acacia trees to tiny living cells...',
        'Checking physiology and genetics in my book 🧬',
        'Bending down to sketch clear biology notes...',
        'Organizing life science points with neat headings...',
        'Photosynthesis and cellular pathways ready...',
        'Reviewing the biology chapter vault...',
        'So happy to explore biology with you!',
      ],
      timetable: [
        'Spotting your upcoming classes from way up high! 📅',
        'Checking your daily schedule horizon...',
        'Reviewing today\'s lecture slots kindly...',
        'Making sure your study week flows smoothly...',
        'Checking morning and afternoon class timings...',
        'Your timetable overview is clear and ready!',
        'Keeping an eye on your next class bell...',
        'Let\'s see what class is coming up next!',
      ],
      attendance: [
        'Looking over your attendance records with care 📊',
        'Steady presence helps you stand tall in exams!',
        'Checking your present and absent percentages...',
        'Reviewing your monthly attendance tallies...',
        'Compiling a clear view of your class presence...',
        'Every lecture brings you closer to your goals!',
        'Verifying your attendance summary...',
        'Your attendance overview is ready!',
      ],
      announcements: [
        'Drafting a warm, graceful announcement ✍️',
        'Helping your message stand tall and clear...',
        'Choosing polite, well-structured wording...',
        'Formatting the academy notice neatly...',
        'Reviewing bulletin points from top to bottom...',
        'Polishing the tone with kindness and clarity...',
        'Preparing an official campus update...',
        'Your announcement draft is ready!',
      ],
      fees: [
        'Looking over the tuition & scholarship details 💳',
        'Clear, transparent fee information from above...',
        'Checking term rates and multi-subject discounts...',
        'Reviewing voucher and verification guidelines...',
        'Gathering accurate fee numbers for you...',
        'Making financial plans easy to understand...',
        'Checking scholarship options with care...',
        'Fee summary ready for you!',
      ],
      greeting: [
        'Hello from up here! *bends down warmly* 🦒✨',
        'Assalam-o-Alaikum! Gigi is delighted to see you!',
        'Welcome! Adjusting my bow tie and ready to help!',
        'Hi there! What big ideas shall we explore today?',
        'Peace and warm greetings! Ready for a lovely study session?',
        'So glad you\'re here! I\'ve got my little book open!',
        'Hello friend! Let\'s reach new academic heights together!',
        'Bending down to listen — what are we learning today?',
      ],
      urdu: [
        'السلام علیکم! اردو کے اسباق کے لیے حاضر ہوں 🦒',
        'اردو ادب اور اشعار کی سلیس تشریح تیار ہے...',
        'نصاب کی کتاب سے اہم نکات دیکھ رہا ہوں...',
        'اردو قواعد اور مضامین میں مکمل رہنمائی...',
        'خوبصورت اور واضح انداز میں جواب لکھا جا رہا ہے...',
        'سبق کا خلاصہ اور مرکزی خیال حاضر ہے...',
        'آئیے سکون اور توجہ سے اردو پڑھتے ہیں...',
        'آپ کے سوال کا بہترین جواب تیار ہے!',
      ],
      question: [
        'Bending down closer to read your question... 📖',
        'Looking at this topic from every angle!',
        'Connecting the big picture with clear steps...',
        'Flipping through my little golden-trimmed book...',
        'Preparing a gentle, easy-to-follow explanation...',
        'Spotting the key exam points for you...',
        'Organizing a thoughtful, step-by-step guide...',
        'Ready to share a clear answer!',
      ],
      long: [
        'A tall question! Right up a giraffe\'s alley! 🦒',
        'Bending all the way down to read every detail...',
        'Taking a calm, bird\'s-eye view of your prompt...',
        'Organizing each section neatly from top to bottom...',
        'Making sure every single question point is covered...',
        'Structuring a thorough, graceful breakdown...',
        'Reading carefully through your whole paragraph...',
        'Ready to provide a complete, clear response!',
      ],
      general: [
        'Bending my neck down kindly as you type... 🦒',
        'Listening with gentle attention...',
        'Checking my little study book for helpful notes...',
        'Ready to help you stand tall in your studies! 🌟',
        'Following along calmly with your thoughts...',
        'Putting together a clear, friendly explanation...',
        'Always happy to look over any topic with you!',
        'Take your time typing — I\'m right here!',
      ],
    },
    thinkingLines: [
      'Looking over the notes vault from up high...',
      'Flipping through my little study book...',
      'Connecting the big picture and the step-by-step details...',
      'Organizing a calm, clear explanation for you...',
      'Writing it down with gentle care...',
    ],
    writingLines: [
      'Bending down to write out each step clearly... ✍️',
      'Formatting neat headings and formulas...',
      'Adding helpful big-picture revision tips...',
      'Checking my little book to make sure nothing is missed...',
      'Polishing the final lines for you...',
    ],
    doneLines: [
      'All done! *gentle nod* Hope that gives a clear view! 🦒✨',
      'Finished! Let me know if you\'d like to explore further!',
      'There we go! Stand tall — you\'re doing wonderfully!',
      'Completed with care! Ask another question anytime!',
    ],
    idleLines: [
      'Standing calmly by — bend my ear with a question anytime! 🦒',
      'Giraffe study tip: Seeing the big picture first makes details 2x easier to remember!',
      'Adjusting my gold bow tie and keeping your study nook cozy...',
      'Whenever you\'re ready, let\'s reach new heights together!',
    ],
  },

  'lumi-lamp': {
    accentColor: '#10B981',
    accentBg: '#ECFDF5',
    accentText: '#047857',
    role: 'Idea Desk Lamp',
    personality: 'Bright emerald desk lamp whose warm bulb glows whenever a great idea sparks',
    typingReactions: {
      math: [
        'Bulb flickering with a bright math solution! 💡',
        'Shining a warm light on these equations 📐',
        'Illuminating every step of the formula...',
        'Sparking an algebraic breakthrough!',
        'No dark corners in math — making it crystal clear!',
        'Warming up my filament for these calculations...',
        'Beaming onto the FBISE math syllabus...',
        'Bright math steps coming right up!',
      ],
      physics: [
        'Optics, electricity, and watts — that\'s my world! ⚡',
        'Shining 100 lumens of clarity on physics!',
        'Calculating power ($P = VI$) and forces...',
        'Light speed thinking on this physics problem 💡',
        'Focusing my emerald shade on the formulas...',
        'Illuminating Newton\'s laws and circuits...',
        'Checking the physics note vault...',
        'Brightening up these physical derivations!',
      ],
      chemistry: [
        'Glowing over the periodic table! 🧪',
        'Shining light on chemical bonds and reactions...',
        'Activation energy sparked! Balancing the equation...',
        'Illuminating molecular structures clearly...',
        'Focusing my warm beam on your chemistry notes...',
        'Making stoichiometry bright and simple!',
        'Checking reaction pathways in the vault...',
        'A brilliant chemistry explanation is ready!',
      ],
      biology: [
        'Photosynthesis loves light — and so do I! 🌿',
        'Shining a spotlight on cellular biology 🧬',
        'Illuminating diagrams and biological processes...',
        'Warming up the biology revision notes...',
        'Focusing on genetics, enzymes, and ecosystems...',
        'Making every biology definition shine clearly!',
        'Checking the biology syllabus vault...',
        'Ready to brighten your biology prep!',
      ],
      timetable: [
        'Spotlighting your daily class schedule! 📅',
        'Shining a beam on your upcoming lectures...',
        'Checking your study hours day and night 💡',
        'Keeping your timetable bright and organized...',
        'Focusing on your next scheduled class slot...',
        'Late-night study or morning class? Let\'s check!',
        'Your schedule is lit up and ready!',
        'Let\'s see what class is shining next!',
      ],
      attendance: [
        'Shining a light on your attendance stats! 📊',
        'Your presence brightens every class! Checking logs...',
        'Calculating your attendance percentage...',
        'Spotlighting your present and absent tallies...',
        'Keeping your attendance record glowing bright...',
        'Verifying exam clearance eligibility...',
        'Reviewing your lecture check-ins...',
        'Your attendance summary is illuminated!',
      ],
      announcements: [
        'Spotlighting big news! Drafting announcement ✍️',
        'Making this notice shine with clarity...',
        'Focusing the message so everyone reads it clearly...',
        'Polishing a bright, professional academy bulletin...',
        'Structuring the key highlights...',
        'Warm, clear words for the campus board...',
        'Drafting an eye-catching official notice...',
        'Bulletin draft is glowing and ready!',
      ],
      fees: [
        'Shining transparent light on fee details 💳',
        'Spotlighting tuition rates and scholarship discounts...',
        'Making fee calculations crystal clear...',
        'Checking term billing and voucher steps...',
        'Illuminating multi-subject discount savings...',
        'Reviewing payment verification guidelines...',
        'Clear financial info with zero hidden shadows...',
        'All fee details lit up clearly for you!',
      ],
      greeting: [
        '*Happy hop & warm glow* Hi there! I\'m Lumi! 💡✨',
        'Assalam-o-Alaikum! Ready to spark some bright ideas?',
        'Hello! My desk lamp bulb is warmed up for studying!',
        'Welcome back! Let\'s shine a light on your questions!',
        'Hey friend! *tilts emerald shade happily* What\'s up?',
        'Peace and bright ideas be with you today!',
        'So excited to light up your study desk!',
        'Bulb at 100% brightness — what shall we learn?',
      ],
      urdu: [
        'روشنی اور علم کے ساتھ اردو سوالات کے لیے حاضر! 💡',
        'اردو ادب اور اشعار کی روشن تشریح تیار ہو رہی ہے...',
        'نصاب کے اہم نکات پر روشنی ڈالی جا رہی ہے...',
        'اردو قواعد اور خلاصے کو آسان بنا رہا ہوں...',
        'علم کی شمع سے ہر مشکل سوال آسان ہوگا...',
        'اردو کے پرچے کے لیے بہترین تیاری...',
        'آئیے اس موضوع کو اچھی طرح سمجھتے ہیں!',
        'واضح اور خوبصورت اردو جواب حاضر ہے!',
      ],
      question: [
        'Ooh, an idea is sparking! *bulb glows brighter* 💡',
        'Focusing my light beam right on your question...',
        'Illuminating the simplest step-by-step answer...',
        'Searching the Note Vault at the speed of light...',
        'Turning a tricky question into a lightbulb moment!',
        'Tilting my shade to inspect every detail...',
        'Connecting the wires for a brilliant explanation...',
        'Got a bright solution ready for you!',
      ],
      long: [
        'Switching to high-beam mode for this detailed question! 🔦',
        'Illuminating every paragraph you wrote...',
        'Breaking this big topic into bright, clear steps...',
        'Shining light on every single part of your prompt...',
        'No detail left in the dark!',
        'Warming up a comprehensive, glowing breakdown...',
        'Structuring a crystal-clear master answer...',
        'Ready to light up the whole solution!',
      ],
      general: [
        'Bulb glowing warmly as I read your typing... 💡',
        'Tilting my emerald shade toward your words...',
        'Sparking helpful study thoughts...',
        'Ready to create a lightbulb moment for you! ✨',
        'Keeping your study desk warm and well-lit...',
        'Focusing on your prompt with bright energy...',
        'Hop-hop! Excited to help you solve this!',
        'Always here to brighten your learning journey!',
      ],
    },
    thinkingLines: [
      'Bulb glowing brighter — scanning the notes vault... 💡',
      'Sparking a lightbulb moment for this question...',
      'Focusing my emerald shade on the key formulas...',
      'Illuminating the clearest step-by-step path...',
      'Warming up the final explanation...',
    ],
    writingLines: [
      'Beaming the solution onto your screen... ✨',
      'Highlighting the key formulas and steps...',
      'Shining clarity on every bullet point...',
      'Adding bright exam revision tips...',
      'Polishing the final glow of the answer...',
    ],
    doneLines: [
      'Ding! 💡 Lightbulb moment complete! Anything else?',
      'All lit up and finished! *happy little hop* ✨',
      'There you go! Hope that made everything crystal clear!',
      'Done! Keep shining bright — ask another question anytime!',
    ],
    idleLines: [
      'Glowing softly on your study desk — ready when you are! 💡',
      'Lumi tip: Studying in warm, good lighting reduces eye strain and boosts focus!',
      '*Tiny happy hop* Waiting to spark our next big idea!',
      'Keeping the study lamp warm for your next question...',
    ],
  },
};

/**
 * Lightweight local heuristic to detect category from user's live typing text.
 * Never requires an API call.
 */
export function detectThoughtCategory(rawText: string): ThoughtCategory {
  const text = (rawText || '').trim().toLowerCase();
  if (!text) return 'general';

  // 1. Urdu / Arabic characters
  if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(rawText)) {
    return 'urdu';
  }

  // 2. Greetings
  if (
    /^(hi|hello|hey|salam|assalam|aao|adab|hola|yo\b|good morning|good afternoon|good evening)/i.test(
      text
    )
  ) {
    return 'greeting';
  }

  // 3. Timetable / Schedule
  if (
    /\b(timetable|time table|schedule|class slot|period|lecture time|timing|monday|tuesday|wednesday|thursday|friday|saturday|sunday|what time|when is my class)\b/i.test(
      text
    )
  ) {
    return 'timetable';
  }

  // 4. Attendance
  if (
    /\b(attendance|absent|present|leave|percentage|attendance rate|clock in|clock out|check in|presence|bunk)\b/i.test(
      text
    )
  ) {
    return 'attendance';
  }

  // 5. Fees & Scholarships
  if (
    /\b(fee|fees|tuition|challan|voucher|payment|scholarship|concession|discount|pkr|rupees|bank account|receipt|due date|unpaid|paid)\b/i.test(
      text
    )
  ) {
    return 'fees';
  }

  // 6. Announcements
  if (
    /\b(announcement|announcements|notice|circular|circulars|memo|broadcast|news|bulletin|post notice|draft notice)\b/i.test(
      text
    )
  ) {
    return 'announcements';
  }

  // 7. Mathematics
  if (
    /\b(math|maths|mathematics|algebra|geometry|calculus|derivative|integral|equation|matrix|matrices|quadrat|polynomial|logarithm|trigonometry|hypotenuse|angle|fraction|solve for x|factoriz|arithmetic)\b/i.test(
      text
    ) ||
    /(\d+[\+\-\*\/=]\d+|\bx\^2\b|\bsin\(|\bcos\(|\btan\()/i.test(text)
  ) {
    return 'math';
  }

  // 8. Physics
  if (
    /\b(physics|velocity|acceleration|gravity|newton|joule|friction|force|momentum|torque|optics|lens|mirror|refraction|reflection|circuit|ohm|resistor|current|voltage|magnetic|wavelength|frequency)\b/i.test(
      text
    )
  ) {
    return 'physics';
  }

  // 9. Chemistry
  if (
    /\b(chemistry|chemical|reaction|mole|moles|molar|periodic table|element|bonding|covalent|ionic|acid|base|ph|oxidation|reduction|compound|atom|atomic|isotope|valency|electron|hydrocarbon)\b/i.test(
      text
    )
  ) {
    return 'chemistry';
  }

  // 10. Biology
  if (
    /\b(biology|biological|cell|organelle|mitosis|meiosis|dna|rna|gene|genetics|photosynthesis|respiration|heart|kidney|brain|enzyme|bacteria|virus|plant|animal|species|taxonomy)\b/i.test(
      text
    )
  ) {
    return 'biology';
  }

  // 11. Very long question (> 85 characters)
  if (text.length > 85) {
    return 'long';
  }

  // 12. Question mark or inquiry words
  if (
    text.includes('?') ||
    /\b(what|why|how|when|who|where|which|can you|explain|define|describe|difference between|summarize|list)\b/i.test(
      text
    )
  ) {
    return 'question';
  }

  return 'general';
}

// Track last returned line per persona & category to ensure no repetition
const lastUsedLine = new Map<string, string>();

const STAR_CHAR_RE = /[\u2726\u2727\u2605\u2606\u2728\u2B50\u{1F31F}\u{1F4AB}\u22C6\u2729-\u2730][\uFE0E\uFE0F]?/gu;

function stripStarChars(text: string): string {
  return text.replace(STAR_CHAR_RE, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Retrieves a non-repeating reaction line for the active character and category.
 */
export function getThoughtReactionLine(
  characterId: SageCharacterId,
  category: ThoughtCategory
): string {
  const persona = SAGE_THOUGHT_DATA[characterId] || SAGE_THOUGHT_DATA['sage-classic'];
  const pool = persona.typingReactions[category] || persona.typingReactions.general;
  const key = `${characterId}_${category}`;
  const prev = lastUsedLine.get(key);

  const available = pool.filter((line) => line !== prev);
  const choice =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[0];

  lastUsedLine.set(key, choice);
  return stripStarChars(choice);
}

/**
 * Retrieves a thinking line while the model is preparing an answer.
 */
export function getThinkingThoughtLine(
  characterId: SageCharacterId,
  category?: ThoughtCategory
): string {
  const persona = SAGE_THOUGHT_DATA[characterId] || SAGE_THOUGHT_DATA['sage-classic'];
  const pool = persona.thinkingLines;
  const key = `${characterId}_thinking`;
  const prev = lastUsedLine.get(key);

  const available = pool.filter((line) => line !== prev);
  const choice =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[0];

  lastUsedLine.set(key, choice);
  return stripStarChars(choice);
}

/**
 * Retrieves a completion line right when an answer finishes streaming.
 */
export function getCompletionThoughtLine(characterId: SageCharacterId): string {
  const persona = SAGE_THOUGHT_DATA[characterId] || SAGE_THOUGHT_DATA['sage-classic'];
  const pool = persona.doneLines;
  const key = `${characterId}_done`;
  const prev = lastUsedLine.get(key);

  const available = pool.filter((line) => line !== prev);
  const choice =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[0];

  lastUsedLine.set(key, choice);
  return stripStarChars(choice);
}

/**
 * Retrieves a rare idle study tip line.
 */
export function getIdleThoughtLine(characterId: SageCharacterId): string {
  const persona = SAGE_THOUGHT_DATA[characterId] || SAGE_THOUGHT_DATA['sage-classic'];
  const pool = persona.idleLines;
  const key = `${characterId}_idle`;
  const prev = lastUsedLine.get(key);

  const available = pool.filter((line) => line !== prev);
  const choice =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[0];

  lastUsedLine.set(key, choice);
  return stripStarChars(choice);
}
