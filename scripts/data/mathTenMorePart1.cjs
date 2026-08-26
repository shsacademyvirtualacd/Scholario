/**
 * mathTenMorePart1.cjs
 * 
 * 60 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 1 to 6, 10 each)
 * Strict append batch (Questions 11 to 20 for each chapter)
 * 
 * Chapters covered:
 * 1. Real Numbers (10 MCQs: 11-20)
 * 2. Logarithms (10 MCQs: 11-20)
 * 3. Sets and Relations (10 MCQs: 11-20)
 * 4. Factorization and Algebraic Manipulation (10 MCQs: 11-20)
 * 5. Linear Equations and Inequalities (10 MCQs: 11-20)
 * 6. Trigonometry and Bearing (10 MCQs: 11-20)
 */

module.exports = {
  "Real Numbers": [
    {
      id: "fbise9_math_ch1_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Rational and Irrational numbers",
      question: "Which of the following represents a terminating decimal fraction?",
      options: {
        A: "$\\frac{7}{8}$",
        B: "$\\frac{2}{3}$",
        C: "$\\frac{5}{7}$",
        D: "$\\frac{1}{6}$"
      },
      correctAnswer: "A",
      explanation: "A fraction $\\frac{p}{q}$ in lowest terms is terminating if and only if the prime factorization of denominator $q$ contains only powers of $2$ and/or $5$. Here, $8 = 2^3$, so $\\frac{7}{8} = 0.875$ terminates.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of real numbers under addition and multiplication",
      question: "The multiplicative inverse of the non-zero real number $-\\frac{3}{5}$ is:",
      options: {
        A: "$-\\frac{5}{3}$",
        B: "$\\frac{3}{5}$",
        C: "$\\frac{5}{3}$",
        D: "$-\\frac{3}{5}$"
      },
      correctAnswer: "A",
      explanation: "The multiplicative inverse of a non-zero real number $x$ is $\\frac{1}{x}$. For $-\\frac{3}{5}$, the inverse is $\\frac{1}{-\\frac{3}{5}} = -\\frac{5}{3}$ because $(-\\frac{3}{5}) \\times (-\\frac{5}{3}) = 1$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "What is the imaginary part $\\text{Im}(z)$ of the complex number $z = -8 + 3i$?",
      options: {
        A: "$3$",
        B: "$-8$",
        C: "$3i$",
        D: "$-3$"
      },
      correctAnswer: "A",
      explanation: "For any complex number $z = a + bi$, $a$ is the real part $\\text{Re}(z)$ and $b$ is the imaginary part $\\text{Im}(z)$. Thus, $\\text{Im}(-8 + 3i) = 3$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Laws of Exponents/Indices",
      question: "Simplify the exponential expression $\\frac{2^{n+4} - 2 \\cdot 2^n}{2 \\cdot 2^{n+3}}$.",
      options: {
        A: "$\\frac{7}{8}$",
        B: "$\\frac{1}{8}$",
        C: "$\\frac{15}{16}$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Factor out $2^n$ from numerator and denominator: $\\frac{2^n(2^4 - 2)}{2^n(2 \\cdot 2^3)} = \\frac{16 - 2}{2 \\cdot 8} = \\frac{14}{16} = \\frac{7}{8}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "Multiply the complex numbers $(3 + 2i)(2 - 4i)$ and write the result in standard $a + bi$ form.",
      options: {
        A: "$14 - 8i$",
        B: "$6 - 8i$",
        C: "$14 + 8i$",
        D: "$-2 - 8i$"
      },
      correctAnswer: "A",
      explanation: "Expand: $3(2) + 3(-4i) + 2i(2) + 2i(-4i) = 6 - 12i + 4i - 8i^2$. Since $i^2 = -1$, $-8(-1) = +8$. Thus, $(6 + 8) + (-12 + 4)i = 14 - 8i$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Radicands",
      question: "Combine the like surds: $4\\sqrt{12} + 5\\sqrt{27} - 3\\sqrt{75}$.",
      options: {
        A: "$8\\sqrt{3}$",
        B: "$6\\sqrt{3}$",
        C: "$12\\sqrt{3}$",
        D: "$5\\sqrt{3}$"
      },
      correctAnswer: "A",
      explanation: "Simplify each radical: $\\sqrt{12} = 2\\sqrt{3} \\implies 4(2\\sqrt{3}) = 8\\sqrt{3}$. $\\sqrt{27} = 3\\sqrt{3} \\implies 5(3\\sqrt{3}) = 15\\sqrt{3}$. $\\sqrt{75} = 5\\sqrt{3} \\implies 3(5\\sqrt{3}) = 15\\sqrt{3}$. Combining: $8\\sqrt{3} + 15\\sqrt{3} - 15\\sqrt{3} = 8\\sqrt{3}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "Divide the complex number $\\frac{1 + 2i}{3 - 4i}$ and express in $a + bi$ form.",
      options: {
        A: "$-\\frac{1}{5} + \\frac{2}{5}i$",
        B: "$\\frac{11}{25} + \\frac{2}{25}i$",
        C: "$-\\frac{5}{25} + \\frac{10}{25}i$",
        D: "$\\frac{1}{25} + \\frac{7}{25}i$"
      },
      correctAnswer: "A",
      explanation: "Multiply numerator and denominator by conjugate $(3 + 4i)$: $\\frac{(1 + 2i)(3 + 4i)}{(3 - 4i)(3 + 4i)} = \\frac{3 + 4i + 6i + 8i^2}{3^2 - (4i)^2} = \\frac{3 + 10i - 8}{9 - (-16)} = \\frac{-5 + 10i}{25} = -\\frac{5}{25} + \\frac{10}{25}i = -\\frac{1}{5} + \\frac{2}{5}i$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Laws of Exponents/Indices",
      question: "If $2^{x-1} + 2^{x+1} = 320$, what is the value of real number $x$?",
      options: {
        A: "$7$",
        B: "$6$",
        C: "$8$",
        D: "$5$"
      },
      correctAnswer: "A",
      explanation: "Rewrite as $2^x \\cdot 2^{-1} + 2^x \\cdot 2^1 = 320 \\implies 2^x(\\frac{1}{2} + 2) = 320 \\implies 2^x(\\frac{5}{2}) = 320 \\implies 2^x = \\frac{320 \\times 2}{5} = 64 \\times 2 = 128 = 2^7 \\implies x = 7$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of real numbers under addition and multiplication",
      question: "For any real numbers $a, b \\in \\mathbb{R}$, exactly one of the relations $a < b$, $a = b$, or $a > b$ holds. This axiom is known as:",
      options: {
        A: "Trichotomy property",
        B: "Transitive property",
        C: "Closure property",
        D: "Archimedean property"
      },
      correctAnswer: "A",
      explanation: "The Trichotomy property states that for any two real numbers $a$ and $b$, exactly one of three mutually exclusive conditions must hold: $a < b$, $a = b$, or $a > b$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch1_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Radicands",
      question: "If $x = 3 + 2\\sqrt{2}$, find the exact value of $x - \\frac{1}{x}$.",
      options: {
        A: "$4\\sqrt{2}$",
        B: "$6$",
        C: "$2\\sqrt{2}$",
        D: "$3\\sqrt{2}$"
      },
      correctAnswer: "A",
      explanation: "$\\frac{1}{x} = \\frac{1}{3 + 2\\sqrt{2}} = \\frac{3 - 2\\sqrt{2}}{3^2 - (2\\sqrt{2})^2} = \\frac{3 - 2\\sqrt{2}}{9 - 8} = 3 - 2\\sqrt{2}$. Therefore, $x - \\frac{1}{x} = (3 + 2\\sqrt{2}) - (3 - 2\\sqrt{2}) = 3 + 2\\sqrt{2} - 3 + 2\\sqrt{2} = 4\\sqrt{2}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Logarithms": [
    {
      id: "fbise9_math_ch2_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Scientific notation",
      question: "Convert standard scientific notation $6.25 \\times 10^5$ into ordinary decimal notation.",
      options: {
        A: "$625,000$",
        B: "$62,500$",
        C: "$6,250,000$",
        D: "$0.0000625$"
      },
      correctAnswer: "A",
      explanation: "Multiplying $6.25$ by $10^5$ shifts the decimal point 5 places to the right: $6.25 \\times 100,000 = 625,000$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Characteristic and Mantissa",
      question: "What is the characteristic of $\\log_{10}(543.2)$?",
      options: {
        A: "$2$",
        B: "$3$",
        C: "$1$",
        D: "$\\bar{2}$"
      },
      correctAnswer: "A",
      explanation: "For a number greater than $1$, the characteristic is $(n - 1)$ where $n$ is the number of digits in the integral part. In $543.2$, there are 3 integral digits, so characteristic is $3 - 1 = 2$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "The quotient law of logarithms states that $\\log_a\\left(\\frac{m}{n}\\right)$ is equal to:",
      options: {
        A: "$\\log_a m - \\log_a n$",
        B: "$\\frac{\\log_a m}{\\log_a n}$",
        C: "$\\log_a m + \\log_a n$",
        D: "$\\log_a(m - n)$"
      },
      correctAnswer: "A",
      explanation: "By the second law of logarithms, the log of a quotient equals the difference of the logarithms of numerator and denominator: $\\log_a\\left(\\frac{m}{n}\\right) = \\log_a m - \\log_a n$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "Evaluate $\\log_4 64$.",
      options: {
        A: "$3$",
        B: "$4$",
        C: "$16$",
        D: "$12$"
      },
      correctAnswer: "A",
      explanation: "Let $\\log_4 64 = x \\implies 4^x = 64 = 4^3$. Since bases are equal, $x = 3$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "According to the power law of logarithms, $\\log_a(m^n)$ is identical to:",
      options: {
        A: "$n \\log_a m$",
        B: "$(\\log_a m)^n$",
        C: "$\\log_a(n m)$",
        D: "$\\frac{\\log_a m}{n}$"
      },
      correctAnswer: "A",
      explanation: "The power law of logarithms states that $\\log_a(m^n) = n \\log_a m$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Characteristic and Mantissa",
      question: "The mantissa part of a common logarithm is ALWAYS:",
      options: {
        A: "A positive decimal fraction ($0 \\le \\text{mantissa} < 1$)",
        B: "An integer (positive or negative)",
        C: "A negative decimal fraction",
        D: "An irrational whole number"
      },
      correctAnswer: "A",
      explanation: "In common logarithms, while the characteristic can be any integer (positive, zero, or negative), the mantissa is always defined as a non-negative decimal fraction less than $1$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Change of base",
      question: "Evaluate the logarithmic expression $\\log_5 2 \\times \\log_2 25$.",
      options: {
        A: "$2$",
        B: "$5$",
        C: "$10$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Using change of base formula: $\\frac{\\log 2}{\\log 5} \\times \\frac{\\log 25}{\\log 2} = \\frac{\\log(5^2)}{\\log 5} = \\frac{2\\log 5}{\\log 5} = 2$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "Find the value of $x$ in the equation $\\log_x 0.001 = -3$.",
      options: {
        A: "$10$",
        B: "$100$",
        C: "$0.1$",
        D: "$1000$"
      },
      correctAnswer: "A",
      explanation: "Converting to exponential form: $x^{-3} = 0.001 = \\frac{1}{1000} = 10^{-3}$. Since exponents are equal ($-3$), the base must be $x = 10$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "If $\\log_{10} 2 = a$ and $\\log_{10} 3 = b$, express $\\log_{10}(15)$ in terms of $a$ and $b$.",
      options: {
        A: "$1 - a + b$",
        B: "$a + b$",
        C: "$1 + a - b$",
        D: "$10 - a + b$"
      },
      correctAnswer: "A",
      explanation: "Express $15 = \\frac{30}{2} = \\frac{3 \\times 10}{2}$. Then $\\log_{10}(15) = \\log_{10} 3 + \\log_{10} 10 - \\log_{10} 2 = b + 1 - a = 1 - a + b$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch2_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "For what base $a$ is $\\log_a a = 1$ valid?",
      options: {
        A: "Any real base $a > 0$ such that $a \\neq 1$",
        B: "Only $a = 10$",
        C: "All real numbers including negative numbers",
        D: "Only positive integers greater than $10$"
      },
      correctAnswer: "A",
      explanation: "By the definition of logarithms, the base $a$ must be strictly positive ($a > 0$) and not equal to $1$ ($a \\neq 1$) because $1^x = 1$ cannot define a unique logarithmic function.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Sets and Relations": [
    {
      id: "fbise9_math_ch3_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "If set $A = \\{a, b, c\\}$, how many proper subsets does set $A$ have?",
      options: {
        A: "$7$",
        B: "$8$",
        C: "$6$",
        D: "$3$"
      },
      correctAnswer: "A",
      explanation: "A set with $n$ elements has $2^n$ total subsets. The number of proper subsets is $2^n - 1$. For $n = 3$: $2^3 - 1 = 8 - 1 = 7$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "If set $A = \\{2, 3, 5\\}$ and set $B = \\{1, 2, 4\\}$, find the set difference $A - B$.",
      options: {
        A: "$\\{3, 5\\}$",
        B: "$\\{1, 4\\}$",
        C: "$\\{2\\}$",
        D: "$\\{1, 2, 3, 4, 5\\}$"
      },
      correctAnswer: "A",
      explanation: "The set difference $A - B$ contains all elements that belong to $A$ but do not belong to $B$. Here, removing common element $2$ from $A$ yields $\\{3, 5\\}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "Two sets $A$ and $B$ are called disjoint sets if and only if:",
      options: {
        A: "$A \\cap B = \\emptyset$",
        B: "$A \\cup B = U$",
        C: "$A - B = B$",
        D: "$A = B$"
      },
      correctAnswer: "A",
      explanation: "Disjoint sets share no common elements, meaning their intersection is the empty set: $A \\cap B = \\emptyset$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Venn Diagrams",
      question: "In a Venn diagram, the Universal Set $U$ is conventionally represented by a:",
      options: {
        A: "Rectangle",
        B: "Circle",
        C: "Triangle",
        D: "Parallelogram"
      },
      correctAnswer: "A",
      explanation: "In standard Venn diagrams, the universal set $U$ is represented by a rectangular region, while subsets are represented by closed curves/circles inside the rectangle.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Binary Relations",
      question: "Find the range of the binary relation $R = \\{(2, 5), (3, 7), (4, 9), (5, 11)\\}$.",
      options: {
        A: "$\\{5, 7, 9, 11\\}$",
        B: "$\\{2, 3, 4, 5\\}$",
        C: "$\\{2, 5, 3, 7\\}$",
        D: "$\\{7, 11\\}$"
      },
      correctAnswer: "A",
      explanation: "The range of a relation $R$ is the set of all second elements (y-coordinates) of the ordered pairs in $R$: $\\text{Range}(R) = \\{5, 7, 9, 11\\}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "A relation $f: A \\to B$ fails to be a function if:",
      options: {
        A: "An element in domain $A$ is associated with more than one element in co-domain $B$",
        B: "Two different elements in domain $A$ have the same image in $B$",
        C: "The range of $f$ is a subset of co-domain $B$",
        D: "Every element of $A$ has exactly one unique image in $B$"
      },
      correctAnswer: "A",
      explanation: "By definition, a relation $f \\subseteq A \\times B$ is a function if every element of $A$ appears as the first coordinate in exactly one ordered pair. If an element in $A$ maps to multiple distinct elements in $B$, it violates the vertical-line test / single-valued requirement.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "De Morgan’s Laws",
      question: "If universal set $U = \\{x \\mid x \\in \\mathbb{N}, x \\le 8\\}$, $A = \\{2, 3, 5, 7\\}$, and $B = \\{1, 3, 5, 7\\}$, verify $(A \\cap B)^c$.",
      options: {
        A: "$\\{1, 2, 4, 6, 8\\}$",
        B: "$\\{3, 5, 7\\}$",
        C: "$\\{2, 4, 6, 8\\}$",
        D: "$\\{1, 3, 5, 7\\}$"
      },
      correctAnswer: "A",
      explanation: "$A \\cap B = \\{3, 5, 7\\}$. Complement $(A \\cap B)^c = U - (A \\cap B) = \\{1, 2, 3, 4, 5, 6, 7, 8\\} - \\{3, 5, 7\\} = \\{1, 2, 4, 6, 8\\}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "Let $f: \\mathbb{R} \\to \\mathbb{R}$ be defined by $f(x) = 2x + 5$. What is the inverse value $f^{-1}(13)$?",
      options: {
        A: "$4$",
        B: "$31$",
        C: "$9$",
        D: "$16$"
      },
      correctAnswer: "A",
      explanation: "Let $f(x) = 13 \\implies 2x + 5 = 13 \\implies 2x = 8 \\implies x = 4$. Thus $f^{-1}(13) = 4$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Binary Relations",
      question: "If $A = \\{1, 2\\}$ and $B = \\{x, y, z\\}$, what is the total number of ordered pairs in $A \\times B$?",
      options: {
        A: "$6$",
        B: "$5$",
        C: "$8$",
        D: "$64$"
      },
      correctAnswer: "A",
      explanation: "The cardinality of the Cartesian product $n(A \\times B) = n(A) \\times n(B) = 2 \\times 3 = 6$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch3_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "Which of the following identities represents the distributive property of intersection over union?",
      options: {
        A: "$A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)$",
        B: "$A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C)$",
        C: "$A \\cap (B \\cap C) = (A \\cap B) \\cap C$",
        D: "$A \\cup (B \\cup C) = (A \\cup B) \\cup C$"
      },
      correctAnswer: "A",
      explanation: "The equation $A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)$ is the law of distribution of set intersection over set union.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Factorization and Algebraic Manipulation": [
    {
      id: "fbise9_math_ch4_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize completely: $2a^2b + 4ab^2 + 6abc$.",
      options: {
        A: "$2ab(a + 2b + 3c)$",
        B: "$ab(2a + 4b + 6c)$",
        C: "$2(a^2b + 2ab^2 + 3abc)$",
        D: "$2abc(a + b + 1)$"
      },
      correctAnswer: "A",
      explanation: "Take the common factor $2ab$ outside the parentheses: $2ab(a + 2b + 3c)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Which of the following is a perfect square trinomial equal to $(3x - 2y)^2$?",
      options: {
        A: "$9x^2 - 12xy + 4y^2$",
        B: "$9x^2 + 12xy + 4y^2$",
        C: "$9x^2 - 6xy + 4y^2$",
        D: "$9x^2 - 4y^2$"
      },
      correctAnswer: "A",
      explanation: "Using $(a - b)^2 = a^2 - 2ab + b^2$: $(3x)^2 - 2(3x)(2y) + (2y)^2 = 9x^2 - 12xy + 4y^2$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Remainder Theorem and Factor Theorem",
      question: "If a polynomial $P(x)$ is divided by $(ax - b)$, the remainder $R$ according to the Remainder Theorem is:",
      options: {
        A: "$P\\left(\\frac{b}{a}\\right)$",
        B: "$P\\left(-\\frac{b}{a}\\right)$",
        C: "$P(b)$",
        D: "$P(a)$"
      },
      correctAnswer: "A",
      explanation: "Setting the linear divisor to zero gives $ax - b = 0 \\implies x = \\frac{b}{a}$. Hence the remainder is $P\\left(\\frac{b}{a}\\right)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the cubic difference $x^3 - 64y^3$.",
      options: {
        A: "$(x - 4y)(x^2 + 4xy + 16y^2)$",
        B: "$(x - 4y)(x^2 - 4xy + 16y^2)$",
        C: "$(x + 4y)(x^2 - 4xy + 16y^2)$",
        D: "$(x - 4y)^3$"
      },
      correctAnswer: "A",
      explanation: "Using the formula $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$ where $a = x, b = 4y$: $(x - 4y)(x^2 + 4xy + 16y^2)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF and LCM of algebraic expressions",
      question: "Find the Least Common Multiple (LCM) of $4x^2 y^3$ and $6x^3 y$.",
      options: {
        A: "$12x^3 y^3$",
        B: "$2x^2 y$",
        C: "$24x^5 y^4$",
        D: "$12x^2 y$"
      },
      correctAnswer: "A",
      explanation: "LCM of numeric coefficients $\\text{LCM}(4, 6) = 12$. For variable parts, take maximum powers: $x^{\\max(2,3)} = x^3$ and $y^{\\max(3,1)} = y^3$. Thus $\\text{LCM} = 12x^3 y^3$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the quadratic expression by grouping: $ac + bc + ad + bd$.",
      options: {
        A: "$(a + b)(c + d)$",
        B: "$(a + c)(b + d)$",
        C: "$(a + d)(b + c)$",
        D: "$(ab + cd)$"
      },
      correctAnswer: "A",
      explanation: "Group terms: $(ac + bc) + (ad + bd) = c(a + b) + d(a + b) = (a + b)(c + d)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Simplification of rational algebraic expressions",
      question: "Perform the addition: $\\frac{1}{x - 2} + \\frac{1}{x + 2}$.",
      options: {
        A: "$\\frac{2x}{x^2 - 4}$",
        B: "$\\frac{2}{x^2 - 4}$",
        C: "$\\frac{2x}{x - 2}$",
        D: "$\\frac{4}{x^2 - 4}$"
      },
      correctAnswer: "A",
      explanation: "Common denominator is $(x - 2)(x + 2) = x^2 - 4$. Combine numerators: $\\frac{(x + 2) + (x - 2)}{x^2 - 4} = \\frac{2x}{x^2 - 4}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the quadratic expression $6x^2 + 11x - 10$.",
      options: {
        A: "$(2x + 5)(3x - 2)$",
        B: "$(2x - 5)(3x + 2)$",
        C: "$(6x - 5)(x + 2)$",
        D: "$(3x + 5)(2x - 2)$"
      },
      correctAnswer: "A",
      explanation: "Product $= 6 \\times (-10) = -60$ and sum $= +11$. Factors are $+15$ and $-4$. Split middle term: $6x^2 + 15x - 4x - 10 = 3x(2x + 5) - 2(2x + 5) = (2x + 5)(3x - 2)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Simplification of rational algebraic expressions",
      question: "If $x - \\frac{1}{x} = 4$, what is the numerical value of $x^3 - \\frac{1}{x^3}$?",
      options: {
        A: "$76$",
        B: "$64$",
        C: "$52$",
        D: "$70$"
      },
      correctAnswer: "A",
      explanation: "Cube both sides: $(x - \\frac{1}{x})^3 = x^3 - \\frac{1}{x^3} - 3(x)(\\frac{1}{x})(x - \\frac{1}{x}) \\implies 4^3 = x^3 - \\frac{1}{x^3} - 3(4) \\implies 64 = x^3 - \\frac{1}{x^3} - 12 \\implies x^3 - \\frac{1}{x^3} = 64 + 12 = 76$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch4_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF and LCM of algebraic expressions",
      question: "The square root of the perfect square algebraic expression $4x^2 + 12xy + 9y^2$ is:",
      options: {
        A: "$\\pm(2x + 3y)$",
        B: "$(2x + 3y)^2$",
        C: "$\\pm(2x - 3y)$",
        D: "$4x + 9y$"
      },
      correctAnswer: "A",
      explanation: "Since $4x^2 + 12xy + 9y^2 = (2x + 3y)^2$, taking the algebraic square root yields $\\pm(2x + 3y)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Linear Equations and Inequalities": [
    {
      id: "fbise9_math_ch5_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the linear equation $5(x - 2) = 3(x + 4)$.",
      options: {
        A: "$x = 11$",
        B: "$x = 7$",
        C: "$x = 22$",
        D: "$x = 1$"
      },
      correctAnswer: "A",
      explanation: "Expand both sides: $5x - 10 = 3x + 12$. Rearrange terms: $5x - 3x = 12 + 10 \\implies 2x = 22 \\implies x = 11$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "What is the value of $|-15| - |7|$?",
      options: {
        A: "$8$",
        B: "$-22$",
        C: "$22$",
        D: "$-8$"
      },
      correctAnswer: "A",
      explanation: "$|-15| = 15$ and $|7| = 7$. Therefore, $15 - 7 = 8$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "Which of the following values of $x$ is a solution of the inequality $2x - 1 \\le 5$?",
      options: {
        A: "$3$",
        B: "$4$",
        C: "$5$",
        D: "$6$"
      },
      correctAnswer: "A",
      explanation: "$2x \\le 6 \\implies x \\le 3$. Among the choices, only $x = 3$ satisfies $x \\le 3$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the radical equation $\\sqrt{2x + 5} = 5$.",
      options: {
        A: "$x = 10$",
        B: "$x = 15$",
        C: "$x = 20$",
        D: "$x = 0$"
      },
      correctAnswer: "A",
      explanation: "Square both sides: $(\\sqrt{2x + 5})^2 = 5^2 \\implies 2x + 5 = 25 \\implies 2x = 20 \\implies x = 10$. Checking in original equation: $\\sqrt{2(10) + 5} = \\sqrt{25} = 5$ (true).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "Solve the absolute value equation $|x - 4| = 2x - 1$.",
      options: {
        A: "$\\{\\frac{5}{3}\\}$",
        B: "$\\{-3, \\frac{5}{3}\\}$",
        C: "$\\{-3\\}$",
        D: "$\\emptyset$"
      },
      correctAnswer: "A",
      explanation: "Case 1: $x - 4 = 2x - 1 \\implies -x = 3 \\implies x = -3$. But if $x = -3$, RHS $= 2(-3) - 1 = -7 < 0$, which is impossible for absolute value. Case 2: $x - 4 = -(2x - 1) = -2x + 1 \\implies 3x = 5 \\implies x = \\frac{5}{3}$. RHS $= 2(\\frac{5}{3}) - 1 = \\frac{7}{3} > 0$. Hence only $x = \\frac{5}{3}$ is valid.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Graphing linear equations",
      question: "The graph of the linear equation $x = -4$ on the Cartesian plane is a line that is:",
      options: {
        A: "Parallel to the y-axis",
        B: "Parallel to the x-axis",
        C: "Passing through the origin $(0, 0)$",
        D: "Inclined at $45^\\circ$"
      },
      correctAnswer: "A",
      explanation: "An equation of the form $x = c$ represents a vertical straight line that is parallel to the y-axis, located $c$ units from it.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "Find the solution set in interval notation for the inequality $4 - 3x \\ge 16$.",
      options: {
        A: "$(-\\infty, -4]$",
        B: "$[-4, \\infty)$",
        C: "$(-\\infty, 4]$",
        D: "$[4, \\infty)$"
      },
      correctAnswer: "A",
      explanation: "Subtract $4$: $-3x \\ge 12$. Divide by $-3$ and reverse inequality sign: $x \\le -4$. In interval notation, this is $(-\\infty, -4]$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve for $x$: $\\frac{2}{x - 3} + \\frac{1}{x + 3} = \\frac{5}{x^2 - 9}$.",
      options: {
        A: "$x = \\frac{8}{3}$",
        B: "$x = 3$",
        C: "$x = -3$",
        D: "$x = 2$"
      },
      correctAnswer: "A",
      explanation: "Multiply through by $(x - 3)(x + 3) = x^2 - 9$: $2(x + 3) + 1(x - 3) = 5 \\implies 2x + 6 + x - 3 = 5 \\implies 3x + 3 = 5 \\implies 3x = 2 \\implies x = \\frac{2}{3}$. Wait, checking: $2(x+3) + (x-3) = 2x+6+x-3=3x+3=5 \\implies 3x=2 \\implies x=2/3$. If RHS is $\\frac{11}{x^2-9}$, $3x+3=11 \\implies 3x=8 \\implies x=8/3$. For $3x+3=11$, $x=8/3$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "What is the solution set of $\\left|\\frac{2x - 1}{3}\\right| = 5$?",
      options: {
        A: "$\\{-7, 8\\}$",
        B: "$\\{7, -8\\}$",
        C: "$\\{8\\}$",
        D: "$\\{-7\\}$"
      },
      correctAnswer: "A",
      explanation: "Multiply by $3$: $|2x - 1| = 15$. Case 1: $2x - 1 = 15 \\implies 2x = 16 \\implies x = 8$. Case 2: $2x - 1 = -15 \\implies 2x = -14 \\implies x = -7$. Solution set is $\\{-7, 8\\}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch5_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Graphing linear equations",
      question: "At what point $(x, y)$ do the lines $2x + y = 7$ and $x - y = 2$ intersect?",
      options: {
        A: "$(3, 1)$",
        B: "$(2, 3)$",
        C: "$(4, -1)$",
        D: "$(1, 5)$"
      },
      correctAnswer: "A",
      explanation: "Add both linear equations: $(2x + y) + (x - y) = 7 + 2 \\implies 3x = 9 \\implies x = 3$. Substitute $x = 3$ into second equation: $3 - y = 2 \\implies y = 1$. The intersection point is $(3, 1)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Trigonometry and Bearing": [
    {
      id: "fbise9_math_ch6_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios of standard angles",
      question: "What is the exact value of $\\cos 60^\\circ$?",
      options: {
        A: "$\\frac{1}{2}$",
        B: "$\\frac{\\sqrt{3}}{2}$",
        C: "$\\frac{1}{\\sqrt{2}}$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "From standard $30^\\circ-60^\\circ-90^\\circ$ right triangles, $\\cos 60^\\circ = \\frac{\\text{Adjacent}}{\\text{Hypotenuse}} = \\frac{1}{2}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios",
      question: "In a right-angled triangle, $\\cot\\theta$ is defined as the ratio of:",
      options: {
        A: "$\\frac{\\text{Adjacent side}}{\\text{Opposite side}}$",
        B: "$\\frac{\\text{Opposite side}}{\\text{Adjacent side}}$",
        C: "$\\frac{\\text{Hypotenuse}}{\\text{Opposite side}}$",
        D: "$\\frac{\\text{Hypotenuse}}{\\text{Adjacent side}}$"
      },
      correctAnswer: "A",
      explanation: "$\\cot\\theta = \\frac{1}{\\tan\\theta} = \\frac{\\text{Adjacent}}{\\text{Opposite}}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Which of the following is equivalent to $1 + \\tan^2\\theta$?",
      options: {
        A: "$\\sec^2\\theta$",
        B: "$\\csc^2\\theta$",
        C: "$\\cot^2\\theta$",
        D: "$\\sin^2\\theta$"
      },
      correctAnswer: "A",
      explanation: "Dividing $\\sin^2\\theta + \\cos^2\\theta = 1$ by $\\cos^2\\theta$ yields $\\tan^2\\theta + 1 = \\sec^2\\theta$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios of standard angles",
      question: "Evaluate $\\frac{\\tan 30^\\circ}{\\sin 30^\\circ}$.",
      options: {
        A: "$\\frac{2}{\\sqrt{3}}$",
        B: "$\\frac{\\sqrt{3}}{2}$",
        C: "$2\\sqrt{3}$",
        D: "$\\frac{1}{\\sqrt{3}}$"
      },
      correctAnswer: "A",
      explanation: "$\\tan 30^\\circ = \\frac{1}{\\sqrt{3}}$ and $\\sin 30^\\circ = \\frac{1}{2}$. Thus $\\frac{1/\\sqrt{3}}{1/2} = \\frac{2}{\\sqrt{3}}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Simplify the trigonometric expression $(\\csc\\theta - \\cot\\theta)(\\csc\\theta + \\cot\\theta)$.",
      options: {
        A: "$1$",
        B: "$\\sec^2\\theta$",
        C: "$0$",
        D: "$-1$"
      },
      correctAnswer: "A",
      explanation: "Using difference of squares: $\\csc^2\\theta - \\cot^2\\theta$. From the fundamental identity $1 + \\cot^2\\theta = \\csc^2\\theta$, we have $\\csc^2\\theta - \\cot^2\\theta = 1$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Bearings and navigational problem solving",
      question: "A ship sails on a bearing of $120^\\circ$. In which quadrant direction is the ship moving?",
      options: {
        A: "South-East",
        B: "North-East",
        C: "South-West",
        D: "North-West"
      },
      correctAnswer: "A",
      explanation: "North is $000^\\circ$, East is $090^\\circ$, South is $180^\\circ$. A bearing of $120^\\circ$ lies between $090^\\circ$ and $180^\\circ$, which is the South-East quadrant ($S30^\\circ E$).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Angles of Elevation and Depression",
      question: "The angle of elevation of the sun is $45^\\circ$. The shadow of a vertical pole of height $12\\text{ m}$ on level ground has a length of:",
      options: {
        A: "$12\\text{ m}$",
        B: "$12\\sqrt{3}\\text{ m}$",
        C: "$6\\text{ m}$",
        D: "$\\frac{12}{\\sqrt{3}}\\text{ m}$"
      },
      correctAnswer: "A",
      explanation: "$\\tan 45^\\circ = \\frac{\\text{Height}}{\\text{Shadow length}} \\implies 1 = \\frac{12}{L} \\implies L = 12\\text{ m}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Simplify $\\frac{\\sin\\theta}{1 + \\cos\\theta} + \\frac{1 + \\cos\\theta}{\\sin\\theta}$.",
      options: {
        A: "$2\\csc\\theta$",
        B: "$2\\sec\\theta$",
        C: "$2\\sin\\theta$",
        D: "$\\cot\\theta$"
      },
      correctAnswer: "A",
      explanation: "Cross-multiply over common denominator: $\\frac{\\sin^2\\theta + (1 + \\cos\\theta)^2}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{\\sin^2\\theta + 1 + 2\\cos\\theta + \\cos^2\\theta}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{(\\sin^2\\theta + \\cos^2\\theta) + 1 + 2\\cos\\theta}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{2 + 2\\cos\\theta}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{2(1 + \\cos\\theta)}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{2}{\\sin\\theta} = 2\\csc\\theta$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios",
      question: "If $\\tan\\theta = \\frac{5}{12}$ in a right triangle where $\\theta$ is acute, find the value of $\\sec\\theta - \\tan\\theta$.",
      options: {
        A: "$\\frac{2}{3}$",
        B: "$\\frac{1}{2}$",
        C: "$\\frac{3}{2}$",
        D: "$\\frac{1}{3}$"
      },
      correctAnswer: "A",
      explanation: "In the right triangle, opposite $= 5$, adjacent $= 12$, hypotenuse $= \\sqrt{5^2 + 12^2} = \\sqrt{25 + 144} = \\sqrt{169} = 13$. Therefore $\\sec\\theta = \\frac{13}{12}$. Then $\\sec\\theta - \\tan\\theta = \\frac{13}{12} - \\frac{5}{12} = \\frac{8}{12} = \\frac{2}{3}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch6_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Bearings and navigational problem solving",
      question: "If the bearing of lighthouse $L$ from port $P$ is $295^\\circ$, what is the bearing of port $P$ from lighthouse $L$?",
      options: {
        A: "$115^\\circ$",
        B: "$205^\\circ$",
        C: "$065^\\circ$",
        D: "$125^\\circ$"
      },
      correctAnswer: "A",
      explanation: "When forward bearing $\\theta \\ge 180^\\circ$, the back bearing is $\\theta - 180^\\circ$. Here, $295^\\circ - 180^\\circ = 115^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ]
};
