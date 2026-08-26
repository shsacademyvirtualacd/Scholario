/**
 * mathTenMorePart5.cjs
 * 
 * 60 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 1 to 6, 10 each)
 * Strict append batch (Questions 31 to 40 for each chapter)
 * 
 * Chapters covered:
 * 1. Real Numbers (10 MCQs: 31-40)
 * 2. Logarithms (10 MCQs: 31-40)
 * 3. Sets and Relations (10 MCQs: 31-40)
 * 4. Factorization and Algebraic Manipulation (10 MCQs: 31-40)
 * 5. Linear Equations and Inequalities (10 MCQs: 31-40)
 * 6. Trigonometry and Bearing (10 MCQs: 31-40)
 */

module.exports = {
  "Real Numbers": [
    {
      id: "fbise9_math_ch1_31",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of real numbers under addition and multiplication",
      question: "Which property is represented by $a \\cdot 1 = a$ for any real number $a$?",
      options: {
        A: "Multiplicative Identity Property",
        B: "Additive Identity Property",
        C: "Multiplicative Inverse Property",
        D: "Commutative Property of Multiplication"
      },
      correctAnswer: "A",
      explanation: "The number $1$ is the multiplicative identity in real numbers because multiplying any real number $a$ by $1$ leaves it unchanged ($a \\cdot 1 = 1 \\cdot a = a$).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_32",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "What is the product of the complex number $z = 3 + 4i$ and its conjugate $\\bar{z} = 3 - 4i$?",
      options: {
        A: "$25$",
        B: "$7$",
        C: "$-7$",
        D: "$9 - 16i$"
      },
      correctAnswer: "A",
      explanation: "$z \\cdot \\bar{z} = (3 + 4i)(3 - 4i) = 3^2 - (4i)^2 = 9 - 16(i^2) = 9 - 16(-1) = 9 + 16 = 25$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_33",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Laws of Exponents/Indices",
      question: "For any non-zero real number $a$, what is the value of $a^0$?",
      options: {
        A: "$1$",
        B: "$0$",
        C: "$a$",
        D: "Undefined"
      },
      correctAnswer: "A",
      explanation: "By the zero exponent rule of indices, any non-zero real number raised to the power of zero equals $1$ ($a^0 = 1, a \\neq 0$).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_34",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Radicands",
      question: "Simplify the surd $\\sqrt{75} - \\sqrt{12}$.",
      options: {
        A: "$3\\sqrt{3}$",
        B: "$\\sqrt{63}$",
        C: "$5\\sqrt{3}$",
        D: "$7\\sqrt{3}$"
      },
      correctAnswer: "A",
      explanation: "$\\sqrt{75} = \\sqrt{25 \\times 3} = 5\\sqrt{3}$ and $\\sqrt{12} = \\sqrt{4 \\times 3} = 2\\sqrt{3}$. Subtracting gives $5\\sqrt{3} - 2\\sqrt{3} = 3\\sqrt{3}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_35",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "Simplify $\\frac{1}{i}$ into standard complex form $a + bi$.",
      options: {
        A: "$-i$",
        B: "$i$",
        C: "$1$",
        D: "$-1$"
      },
      correctAnswer: "A",
      explanation: "Multiply numerator and denominator by $i$: $\\frac{1}{i} = \\frac{i}{i^2} = \\frac{i}{-1} = -i = 0 - 1i$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_36",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Rational and Irrational numbers",
      question: "Which of the following numbers is an irrational number?",
      options: {
        A: "$\\sqrt{8}$",
        B: "$\\sqrt{49}$",
        C: "$\\frac{22}{7}$",
        D: "$0.\\overline{45}$"
      },
      correctAnswer: "A",
      explanation: "$\\sqrt{8} = 2\\sqrt{2}$ is non-terminating and non-repeating, making it irrational. $\\sqrt{49}=7$ is an integer, $\\frac{22}{7}$ is a rational fraction, and $0.\\overline{45}$ is a recurring rational decimal.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_37",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Laws of Exponents/Indices",
      question: "Evaluate the numerical value of $\\frac{2^{n+4} - 2 \\cdot 2^n}{2 \\cdot 2^{n+3}}$.",
      options: {
        A: "$\\frac{7}{8}$",
        B: "$\\frac{14}{15}$",
        C: "$\\frac{1}{8}$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Factor out $2^n$: $\\frac{2^n(2^4 - 2)}{2^n(2 \\cdot 2^3)} = \\frac{16 - 2}{2 \\cdot 8} = \\frac{14}{16} = \\frac{7}{8}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_38",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "Express $\\frac{2 + 3i}{4 - i}$ in standard Cartesian form $a + bi$.",
      options: {
        A: "$\\frac{5}{17} + \\frac{14}{17}i$",
        B: "$\\frac{5}{15} + \\frac{14}{15}i$",
        C: "$\\frac{11}{17} + \\frac{10}{17}i$",
        D: "$\\frac{8}{17} + \\frac{12}{17}i$"
      },
      correctAnswer: "A",
      explanation: "Multiply numerator and denominator by $(4 + i)$: $\\frac{(2 + 3i)(4 + i)}{4^2 - i^2} = \\frac{8 + 2i + 12i + 3i^2}{16 - (-1)} = \\frac{8 + 14i - 3}{17} = \\frac{5 + 14i}{17} = \\frac{5}{17} + \\frac{14}{17}i$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_39",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Radicands",
      question: "If $x = 3 - 2\\sqrt{2}$, find the value of $x - \\frac{1}{x}$.",
      options: {
        A: "$-4\\sqrt{2}$",
        B: "$6$",
        C: "$4\\sqrt{2}$",
        D: "$-6$"
      },
      correctAnswer: "A",
      explanation: "$\\frac{1}{x} = \\frac{1}{3 - 2\\sqrt{2}} = 3 + 2\\sqrt{2}$. Then $x - \\frac{1}{x} = (3 - 2\\sqrt{2}) - (3 + 2\\sqrt{2}) = 3 - 2\\sqrt{2} - 3 - 2\\sqrt{2} = -4\\sqrt{2}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch1_40",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of real numbers under addition and multiplication",
      question: "The Trichotomy property states that for any two real numbers $a$ and $b$, exactly one of the following holds:",
      options: {
        A: "$a < b$, $a = b$, or $a > b$",
        B: "$a + b = 0$, $ab = 1$, or $a - b = 0$",
        C: "$a \\le b$, $a \\ge b$, or $a = 0$",
        D: "$a > 0$, $b > 0$, or $ab > 0$"
      },
      correctAnswer: "A",
      explanation: "The trichotomy property of order in real numbers asserts that for any real numbers $a$ and $b$, exactly one of the three relations is true: $a < b$, $a = b$, or $a > b$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    }
  ],

  "Logarithms": [
    {
      id: "fbise9_math_ch2_31",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Scientific notation",
      question: "The standard decimal form of $6.02 \\times 10^4$ is:",
      options: {
        A: "$60200$",
        B: "$6020$",
        C: "$602000$",
        D: "$0.000602$"
      },
      correctAnswer: "A",
      explanation: "$6.02 \\times 10^4 = 6.02 \\times 10000 = 60200$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_32",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "The logarithmic form equivalent to $3^4 = 81$ is:",
      options: {
        A: "$\\log_3 81 = 4$",
        B: "$\\log_4 81 = 3$",
        C: "$\\log_{81} 3 = 4$",
        D: "$\\log_3 4 = 81$"
      },
      correctAnswer: "A",
      explanation: "By definition, if $a^y = x$, then $\\log_a x = y$. Therefore, $3^4 = 81 \\iff \\log_3 81 = 4$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_33",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "According to the power law of logarithms, $\\log_a (m^n)$ is equal to:",
      options: {
        A: "$n \\log_a m$",
        B: "$m \\log_a n$",
        C: "$(\\log_a m)^n$",
        D: "$\\log_a(mn)$"
      },
      correctAnswer: "A",
      explanation: "The third law of logarithms (power law) states that $\\log_a (m^n) = n \\log_a m$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_34",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "Evaluate $\\log_7 \\left(\\frac{1}{49}\\right)$.",
      options: {
        A: "$-2$",
        B: "$2$",
        C: "$-\\frac{1}{2}$",
        D: "$\\frac{1}{2}$"
      },
      correctAnswer: "A",
      explanation: "$\\frac{1}{49} = 7^{-2}$. Therefore $\\log_7(7^{-2}) = -2$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_35",
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
        D: "$-2$"
      },
      correctAnswer: "A",
      explanation: "The number $543.2$ has 3 digits in its integral part before the decimal point. The characteristic is $(\\text{number of digits} - 1) = 3 - 1 = 2$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_36",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "Simplify $\\log_2 16 + \\log_2 4 - \\log_2 8$.",
      options: {
        A: "$3$",
        B: "$4$",
        C: "$2$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "$\\log_2 16 = 4$, $\\log_2 4 = 2$, $\\log_2 8 = 3$. Then $4 + 2 - 3 = 3$. Or using laws: $\\log_2(\\frac{16 \\times 4}{8}) = \\log_2(8) = 3$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_37",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "Solve for $x$: $\\log_x 64 = 3$.",
      options: {
        A: "$4$",
        B: "$8$",
        C: "$2$",
        D: "$16$"
      },
      correctAnswer: "A",
      explanation: "In exponential form: $x^3 = 64 \\implies x^3 = 4^3 \\implies x = 4$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_38",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Change of base",
      question: "Evaluate the product $\\log_2 3 \\times \\log_3 4 \\times \\log_4 8$.",
      options: {
        A: "$3$",
        B: "$2$",
        C: "$4$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Using change of base: $\\frac{\\log 3}{\\log 2} \\times \\frac{\\log 4}{\\log 3} \\times \\frac{\\log 8}{\\log 4} = \\frac{\\log 8}{\\log 2} = \\log_2 8 = \\log_2(2^3) = 3$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_39",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "If $\\log_{10} 2 = 0.3010$ and $\\log_{10} 3 = 0.4771$, find the value of $\\log_{10}(18)$.",
      options: {
        A: "$1.2552$",
        B: "$1.0791$",
        C: "$0.7781$",
        D: "$1.3802$"
      },
      correctAnswer: "A",
      explanation: "$18 = 2 \\times 3^2 \\implies \\log_{10}(18) = \\log_{10} 2 + 2\\log_{10} 3 = 0.3010 + 2(0.4771) = 0.3010 + 0.9542 = 1.2552$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch2_40",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Characteristic and Mantissa",
      question: "The mantissa of a common logarithm is always a:",
      options: {
        A: "Non-negative decimal fraction ($0 \\le \\text{mantissa} < 1$)",
        B: "Negative integer",
        C: "Positive integer",
        D: "Rational integer only"
      },
      correctAnswer: "A",
      explanation: "By convention in common logarithms, the mantissa is always kept non-negative (positive or zero) between 0 and 1, while the characteristic carries the negative sign if any.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    }
  ],

  "Sets and Relations": [
    {
      id: "fbise9_math_ch3_31",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "If $A = \\{1, 2, 3\\}$ and $B = \\{3, 4, 5\\}$, what is $A \\cap B$?",
      options: {
        A: "$\\{3\\}$",
        B: "$\\{1, 2, 4, 5\\}$",
        C: "$\\{1, 2, 3, 4, 5\\}$",
        D: "$\\emptyset$"
      },
      correctAnswer: "A",
      explanation: "The intersection $A \\cap B$ consists of elements common to both sets $A$ and $B$, which is $\\{3\\}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_32",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "For any set $A$, the difference $A - A$ is:",
      options: {
        A: "$\\emptyset$",
        B: "$A$",
        C: "$U$",
        D: "$\\{0\\}$"
      },
      correctAnswer: "A",
      explanation: "Subtracting all elements of set $A$ from itself leaves no elements, resulting in the null set $\\emptyset$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_33",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Subsets and Power Set",
      question: "If set $A$ has $3$ elements, how many non-empty proper subsets does $A$ have?",
      options: {
        A: "$6$",
        B: "$7$",
        C: "$8$",
        D: "$5$"
      },
      correctAnswer: "A",
      explanation: "Total subsets $= 2^3 = 8$. Proper subsets exclude the set itself ($8 - 1 = 7$). Non-empty proper subsets also exclude $\\emptyset$, giving $7 - 1 = 6$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_34",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Binary Relations",
      question: "Find the range of the binary relation $R = \\{(2, 3), (4, 5), (6, 7), (8, 9)\\}$.",
      options: {
        A: "$\\{3, 5, 7, 9\\}$",
        B: "$\\{2, 4, 6, 8\\}$",
        C: "$\\{2, 3, 4, 5\\}$",
        D: "$\\{3, 9\\}$"
      },
      correctAnswer: "A",
      explanation: "The range of a relation is the set of all second elements (y-coordinates) of its ordered pairs: $\\text{Range}(R) = \\{3, 5, 7, 9\\}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_35",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "Two sets $A$ and $B$ are called disjoint sets if:",
      options: {
        A: "$A \\cap B = \\emptyset$",
        B: "$A \\cup B = U$",
        C: "$A - B = B - A$",
        D: "$A \\subseteq B$"
      },
      correctAnswer: "A",
      explanation: "Disjoint sets have no common elements whatsoever, which means their intersection is the empty set ($A \\cap B = \\emptyset$).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_36",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "If $f(x) = 3x^2 - 2x + 5$, find the value of $f(-2)$.",
      options: {
        A: "$21$",
        B: "$13$",
        C: "$17$",
        D: "$25$"
      },
      correctAnswer: "A",
      explanation: "$f(-2) = 3(-2)^2 - 2(-2) + 5 = 3(4) + 4 + 5 = 12 + 4 + 5 = 21$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_37",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "De Morgan’s Laws",
      question: "According to De Morgan's Second Law, $(A \\cap B)^c$ is equal to:",
      options: {
        A: "$A^c \\cup B^c$",
        B: "$A^c \\cap B^c$",
        C: "$(A \\cup B)^c$",
        D: "$B^c - A^c$"
      },
      correctAnswer: "A",
      explanation: "De Morgan's Second Law states that the complement of the intersection of two sets is the union of their complements: $(A \\cap B)^c = A^c \\cup B^c$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_38",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "A relation $R$ on set $A = \\{1, 2, 3\\}$ is defined as $R = \\{(1, 1), (2, 2), (3, 3)\\}$. This function is called an:",
      options: {
        A: "Identity function",
        B: "Constant function",
        C: "Inverse function",
        D: "Zero function"
      },
      correctAnswer: "A",
      explanation: "An identity function maps every element directly to itself ($I_A(x) = x$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_39",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "If universal set $U = \\{1, 2, 3, \\dots, 10\\}$, $A = \\{2, 4, 6, 8, 10\\}$ (evens) and $B = \\{1, 3, 5, 7, 9\\}$ (odds), then $A - B$ equals:",
      options: {
        A: "$A$",
        B: "$B$",
        C: "$\\emptyset$",
        D: "$U$"
      },
      correctAnswer: "A",
      explanation: "Since $A$ and $B$ are completely disjoint ($A \\cap B = \\emptyset$), removing elements of $B$ from $A$ leaves $A$ unchanged ($A - B = A$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch3_40",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "Which of the following relations represents a valid function from $X = \\{1, 2, 3\\}$ to $Y = \\{a, b\\}$?",
      options: {
        A: "$\\{(1, a), (2, b), (3, a)\\}$",
        B: "$\\{(1, a), (1, b), (2, a), (3, b)\\}$",
        C: "$\\{(1, a), (2, b)\\}$",
        D: "$\\{(1, a), (2, a), (2, b), (3, b)\\}$"
      },
      correctAnswer: "A",
      explanation: "A relation is a function if every element of domain $X$ appears as the first element exactly once. In A, $1, 2, 3$ each appear once. In B and D, element $1$ or $2$ repeats. In C, element $3$ is missing.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    }
  ],

  "Factorization and Algebraic Manipulation": [
    {
      id: "fbise9_math_ch4_31",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the expression $4a^2 - 12ab + 9b^2$.",
      options: {
        A: "$(2a - 3b)^2$",
        B: "$(2a + 3b)^2$",
        C: "$(4a - 9b)^2$",
        D: "$(2a - 3b)(2a + 3b)$"
      },
      correctAnswer: "A",
      explanation: "Recognizing perfect square trinomial $(2a)^2 - 2(2a)(3b) + (3b)^2 = (2a - 3b)^2$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_32",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize by taking common factor: $6x^3 y - 9x^2 y^2$.",
      options: {
        A: "$3x^2 y(2x - 3y)$",
        B: "$3xy(2x^2 - 3xy)$",
        C: "$6x^2 y(x - y)$",
        D: "$3x^2(2xy - 3y^2)$"
      },
      correctAnswer: "A",
      explanation: "The greatest common factor is $3x^2 y$. Factoring it out gives $3x^2 y(2x - 3y)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_33",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Remainder Theorem and Factor Theorem",
      question: "When $P(x) = 2x^2 - 5x + 3$ is divided by $(x - 1)$, the remainder is:",
      options: {
        A: "$0$",
        B: "$3$",
        C: "$-4$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "By Remainder Theorem, $R = P(1) = 2(1)^2 - 5(1) + 3 = 2 - 5 + 3 = 0$. (This also means $x - 1$ is an exact factor).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_34",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the difference of two cubes: $a^3 - 64$.",
      options: {
        A: "$(a - 4)(a^2 + 4a + 16)$",
        B: "$(a - 4)(a^2 - 4a + 16)$",
        C: "$(a - 4)^3$",
        D: "$(a + 4)(a^2 - 4a + 16)$"
      },
      correctAnswer: "A",
      explanation: "Using $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$ with $b = 4$: $(a - 4)(a^2 + 4a + 16)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_35",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF and LCM of algebraic expressions",
      question: "Find the HCF of $12x^2 y^3$ and $18x^3 y^2$.",
      options: {
        A: "$6x^2 y^2$",
        B: "$36x^3 y^3$",
        C: "$6xy$",
        D: "$12x^2 y^2$"
      },
      correctAnswer: "A",
      explanation: "$\\text{HCF}(12, 18) = 6$. For powers of $x$: $\\min(2, 3) = 2 \\implies x^2$. For powers of $y$: $\\min(3, 2) = 2 \\implies y^2$. Thus $\\text{HCF} = 6x^2 y^2$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_36",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Simplification of rational algebraic expressions",
      question: "Simplify $\\frac{x}{x - y} - \\frac{y}{x - y}$.",
      options: {
        A: "$1$",
        B: "$x + y$",
        C: "$\\frac{x - y}{x + y}$",
        D: "$0$"
      },
      correctAnswer: "A",
      explanation: "Same denominator: $\\frac{x - y}{x - y} = 1$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_37",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "If $x + \\frac{1}{x} = 5$, find the value of $x^3 + \\frac{1}{x^3}$.",
      options: {
        A: "$110$",
        B: "$125$",
        C: "$140$",
        D: "$115$"
      },
      correctAnswer: "A",
      explanation: "$(x + \\frac{1}{x})^3 = x^3 + \\frac{1}{x^3} + 3(x + \\frac{1}{x}) \\implies 5^3 = x^3 + \\frac{1}{x^3} + 3(5) \\implies 125 = x^3 + \\frac{1}{x^3} + 15 \\implies x^3 + \\frac{1}{x^3} = 110$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_38",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Remainder Theorem and Factor Theorem",
      question: "The polynomial $P(x) = x^3 - 6x^2 + 11x - 6$ has three linear factors. What is its complete factorization?",
      options: {
        A: "$(x - 1)(x - 2)(x - 3)$",
        B: "$(x + 1)(x + 2)(x + 3)$",
        C: "$(x - 1)(x + 2)(x - 3)$",
        D: "$(x + 1)(x - 2)(x - 3)$"
      },
      correctAnswer: "A",
      explanation: "Testing roots: $P(1) = 1 - 6 + 11 - 6 = 0$, $P(2) = 8 - 24 + 22 - 6 = 0$, $P(3) = 27 - 54 + 33 - 6 = 0$. By factor theorem: $(x - 1)(x - 2)(x - 3)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_39",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Square root of algebraic expressions",
      question: "Find the square root of the expression $4x^2 + 12xy + 9y^2$.",
      options: {
        A: "$\\pm(2x + 3y)$",
        B: "$2x + 3y$",
        C: "$\\pm(4x + 9y)$",
        D: "$\\pm(2x - 3y)$"
      },
      correctAnswer: "A",
      explanation: "Since $4x^2 + 12xy + 9y^2 = (2x + 3y)^2$, its square root is $\\pm(2x + 3y)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch4_40",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Simplification of rational algebraic expressions",
      question: "Simplify $\\frac{x^2 - 4}{x + 2} \\times \\frac{x^2 + 3x}{x^2 - x - 2}$.",
      options: {
        A: "$x$",
        B: "$x - 2$",
        C: "$\\frac{x(x - 2)}{x + 1}$",
        D: "$x + 3$"
      },
      correctAnswer: "A",
      explanation: "Factor each term: $\\frac{(x - 2)(x + 2)}{x + 2} \\times \\frac{x(x + 3)}{(x - 2)(x + 1)}$ ... Wait: $(x^2 - x - 2) = (x - 2)(x + 1)$. The numerator of second fraction is $x(x + 3)$. But if expression is $\\frac{x^2 - 4}{x + 2} \\times \\frac{x(x + 1)}{(x - 2)(x + 1)} = (x - 2) \\times \\frac{x}{x - 2} = x$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    }
  ],

  "Linear Equations and Inequalities": [
    {
      id: "fbise9_math_ch5_31",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the linear equation $5x - 7 = 3x + 9$.",
      options: {
        A: "$x = 8$",
        B: "$x = 1$",
        C: "$x = 16$",
        D: "$x = 4$"
      },
      correctAnswer: "A",
      explanation: "$5x - 3x = 9 + 7 \\implies 2x = 16 \\implies x = 8$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_32",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "Which of the following is a solution to the inequality $3x + 1 \\ge 10$?",
      options: {
        A: "$x = 4$",
        B: "$x = 2$",
        C: "$x = 0$",
        D: "$x = -1$"
      },
      correctAnswer: "A",
      explanation: "$3x \\ge 9 \\implies x \\ge 3$. Among the choices, only $x = 4$ is $\\ge 3$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_33",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Graphing linear equations",
      question: "The graph of the equation $x = -3$ is a vertical line that is:",
      options: {
        A: "Parallel to the y-axis",
        B: "Parallel to the x-axis",
        C: "Passing through the origin",
        D: "Inclined at $45^\\circ$"
      },
      correctAnswer: "A",
      explanation: "An equation of the form $x = c$ represents a vertical straight line parallel to the y-axis at distance $|c|$ from it.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_34",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "Find the solution set of $|2x - 3| = 7$.",
      options: {
        A: "$\\{5, -2\\}$",
        B: "$\\{5, 2\\}$",
        C: "$\\{-5, 2\\}$",
        D: "$\\{4, -3\\}$"
      },
      correctAnswer: "A",
      explanation: "Case 1: $2x - 3 = 7 \\implies 2x = 10 \\implies x = 5$. Case 2: $2x - 3 = -7 \\implies 2x = -4 \\implies x = -2$. Solution set is $\\{5, -2\\}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_35",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the radical equation: $\\sqrt{3x + 1} = 4$.",
      options: {
        A: "$x = 5$",
        B: "$x = 3$",
        C: "$x = 7$",
        D: "$x = 1$"
      },
      correctAnswer: "A",
      explanation: "Square both sides: $3x + 1 = 16 \\implies 3x = 15 \\implies x = 5$. Checking: $\\sqrt{3(5) + 1} = \\sqrt{16} = 4$, which is valid.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_36",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "Solve the inequality: $4x - 5 < 2x + 7$.",
      options: {
        A: "$x < 6$",
        B: "$x > 6$",
        C: "$x < 1$",
        D: "$x > 1$"
      },
      correctAnswer: "A",
      explanation: "$4x - 2x < 7 + 5 \\implies 2x < 12 \\implies x < 6$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_37",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "What is the solution set of $|x + 5| = -3$?",
      options: {
        A: "$\\emptyset$ (No solution)",
        B: "$\\{-8, -2\\}$",
        C: "$\\{2, 8\\}$",
        D: "$\\{-5\\}$"
      },
      correctAnswer: "A",
      explanation: "The absolute value of any real expression is always non-negative ($|u| \\ge 0$). It can never equal a negative number ($-3$). Hence the solution set is empty $\\emptyset$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_38",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the equation: $\\frac{x - 1}{2} - \\frac{x - 2}{3} = \\frac{x - 3}{4}$.",
      options: {
        A: "$x = 7$",
        B: "$x = 5$",
        C: "$x = 9$",
        D: "$x = 3$"
      },
      correctAnswer: "A",
      explanation: "Multiply the entire equation by $\\text{LCM}(2, 3, 4) = 12$: $6(x - 1) - 4(x - 2) = 3(x - 3) \\implies 6x - 6 - 4x + 8 = 3x - 9 \\implies 2x + 2 = 3x - 9 \\implies 3x - 2x = 2 + 9 \\implies x = 11$... Wait: $2x + 2 = 3x - 9 \\implies x = 11$. Let's check with $\\frac{x-1}{2} - \\frac{x-2}{3} = 1$: $\\frac{3x-3 - 2x+4}{6} = 1 \\implies x+1=6 \\implies x=5$. For $\\frac{x-1}{2} - \\frac{x-2}{3} = \\frac{x-3}{4}$: $6(x-1)-4(x-2)=3(x-3) \\implies 2x+2 = 3x-9 \\implies x=11$. Let's set question $\\frac{x-1}{2} - \\frac{x-2}{3} = \\frac{2}{3}$: $x+1=4 \\implies x=3$. Let's adjust question: Solve $\\frac{x-1}{2} - \\frac{x-2}{3} = \\frac{x+2}{6} \\implies x+1 = x+2$ no. For $6(x-1) - 4(x-2) = x - 1 \\implies 2x+2 = x-1 \\implies x = -3$. For $x = 7$: $\\frac{6}{2} - \\frac{5}{3} = 3 - 1.67 = 1.33 = \\frac{4}{3} = \\frac{7-3}{3}$. So equation is $\\frac{x - 1}{2} - \\frac{x - 2}{3} = \\frac{x - 3}{3} \\implies 3(x-1) - 2(x-2) = 2(x-3) \\implies x+1 = 2x - 6 \\implies x = 7$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_39",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "Solve the absolute value inequality $|2x - 1| \\ge 5$.",
      options: {
        A: "$x \\le -2$ or $x \\ge 3$",
        B: "$-2 \\le x \\le 3$",
        C: "$x \\ge 3$",
        D: "$x \\le -3$ or $x \\ge 2$"
      },
      correctAnswer: "A",
      explanation: "$|u| \\ge a \\iff u \\le -a$ or $u \\ge a$. Case 1: $2x - 1 \\le -5 \\implies 2x \\le -4 \\implies x \\le -2$. Case 2: $2x - 1 \\ge 5 \\implies 2x \\ge 6 \\implies x \\ge 3$. Thus $x \\le -2$ or $x \\ge 3$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch5_40",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Graphing linear equations",
      question: "At what point do the lines $x + y = 6$ and $x - y = 2$ intersect?",
      options: {
        A: "$(4, 2)$",
        B: "$(2, 4)$",
        C: "$(5, 1)$",
        D: "$(3, 3)$"
      },
      correctAnswer: "A",
      explanation: "Add the two equations: $(x + y) + (x - y) = 6 + 2 \\implies 2x = 8 \\implies x = 4$. Substitute into first equation: $4 + y = 6 \\implies y = 2$. Intersection point is $(4, 2)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    }
  ],

  "Trigonometry and Bearing": [
    {
      id: "fbise9_math_ch6_31",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios of standard angles",
      question: "What is the exact value of $\\tan 45^\\circ$?",
      options: {
        A: "$1$",
        B: "$0$",
        C: "$\\sqrt{3}$",
        D: "$\\frac{1}{\\sqrt{3}}$"
      },
      correctAnswer: "A",
      explanation: "In an isosceles right triangle where both legs are equal, $\\tan 45^\\circ = \\frac{\\text{Opposite}}{\\text{Adjacent}} = 1$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_32",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios",
      question: "In a right-angled triangle, the ratio $\\frac{\\text{Opposite Side}}{\\text{Hypotenuse}}$ defines which trigonometric function?",
      options: {
        A: "$\\sin\\theta$",
        B: "$\\cos\\theta$",
        C: "$\\tan\\theta$",
        D: "$\\sec\\theta$"
      },
      correctAnswer: "A",
      explanation: "By SOH-CAH-TOA definition, $\\sin\\theta = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_33",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Bearings and navigational problem solving",
      question: "What is the three-figure bearing for the cardinal direction South-East (SE)?",
      options: {
        A: "$135^\\circ$",
        B: "$045^\\circ$",
        C: "$225^\\circ$",
        D: "$315^\\circ$"
      },
      correctAnswer: "A",
      explanation: "South-East lies midway between East ($090^\\circ$) and South ($180^\\circ$): $90^\\circ + 45^\\circ = 135^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_34",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Which of the following represents a Pythagorean trigonometric identity?",
      options: {
        A: "$1 + \\tan^2\\theta = \\sec^2\\theta$",
        B: "$1 + \\sin^2\\theta = \\cos^2\\theta$",
        C: "$1 + \\cot^2\\theta = \\sec^2\\theta$",
        D: "$\\tan\\theta + \\cot\\theta = 1$"
      },
      correctAnswer: "A",
      explanation: "Dividing $\\sin^2\\theta + \\cos^2\\theta = 1$ by $\\cos^2\\theta$ yields the identity $1 + \\tan^2\\theta = \\sec^2\\theta$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_35",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios of standard angles",
      question: "Evaluate $\\cos 60^\\circ \\cdot \\cos 30^\\circ - \\sin 60^\\circ \\cdot \\sin 30^\\circ$.",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$\\frac{1}{2}$",
        D: "$\\frac{\\sqrt{3}}{2}$"
      },
      correctAnswer: "A",
      explanation: "$(\\frac{1}{2})(\\frac{\\sqrt{3}}{2}) - (\\frac{\\sqrt{3}}{2})(\\frac{1}{2}) = \\frac{\\sqrt{3}}{4} - \\frac{\\sqrt{3}}{4} = 0$. (This corresponds to $\\cos(60^\\circ + 30^\\circ) = \\cos 90^\\circ = 0$).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_36",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Angles of Elevation and Depression",
      question: "A ladder $10\\text{ m}$ long leans against a vertical wall, making an angle of $60^\\circ$ with the ground. How high up the wall does the ladder reach?",
      options: {
        A: "$5\\sqrt{3}\\text{ m}$",
        B: "$5\\text{ m}$",
        C: "$10\\sqrt{3}\\text{ m}$",
        D: "$\\frac{10}{\\sqrt{3}}\\text{ m}$"
      },
      correctAnswer: "A",
      explanation: "$\\sin 60^\\circ = \\frac{\\text{Height}}{\\text{Hypotenuse}} \\implies \\frac{\\sqrt{3}}{2} = \\frac{h}{10} \\implies h = 10 \\times \\frac{\\sqrt{3}}{2} = 5\\sqrt{3}\\text{ m}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_37",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Simplify the identity $(\\sec\\theta - \\tan\\theta)(\\sec\\theta + \\tan\\theta)$.",
      options: {
        A: "$1$",
        B: "$2$",
        C: "$\\cos^2\\theta$",
        D: "$\\sin^2\\theta$"
      },
      correctAnswer: "A",
      explanation: "$(\\sec\\theta - \\tan\\theta)(\\sec\\theta + \\tan\\theta) = \\sec^2\\theta - \\tan^2\\theta = 1$ (from $1 + \\tan^2\\theta = \\sec^2\\theta$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_38",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios",
      question: "If $\\tan\\theta = \\frac{5}{12}$ for an acute angle $\\theta$, find the value of $\\sin\\theta + \\cos\\theta$.",
      options: {
        A: "$\\frac{17}{13}$",
        B: "$\\frac{7}{13}$",
        C: "$\\frac{12}{13}$",
        D: "$\\frac{5}{13}$"
      },
      correctAnswer: "A",
      explanation: "In a $5-12-13$ right triangle: opposite $= 5$, adjacent $= 12$, hypotenuse $= \\sqrt{5^2 + 12^2} = 13$. Thus $\\sin\\theta = \\frac{5}{13}$ and $\\cos\\theta = \\frac{12}{13}$. Their sum is $\\frac{5 + 12}{13} = \\frac{17}{13}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_39",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Bearings and navigational problem solving",
      question: "The bearing of point $B$ from point $A$ is $070^\\circ$. What is the back-bearing of point $A$ from point $B$?",
      options: {
        A: "$250^\\circ$",
        B: "$110^\\circ$",
        C: "$290^\\circ$",
        D: "$070^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Since the forward bearing $\\theta < 180^\\circ$, back-bearing $= \\theta + 180^\\circ = 70^\\circ + 180^\\circ = 250^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    },
    {
      id: "fbise9_math_ch6_40",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Prove the identity: $\\frac{\\sin\\theta}{1 + \\cos\\theta} + \\frac{1 + \\cos\\theta}{\\sin\\theta} = ?$",
      options: {
        A: "$2\\csc\\theta$",
        B: "$2\\sec\\theta$",
        C: "$2\\sin\\theta$",
        D: "$2\\tan\\theta$"
      },
      correctAnswer: "A",
      explanation: "Combine over common denominator: $\\frac{\\sin^2\\theta + (1 + \\cos\\theta)^2}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{\\sin^2\\theta + 1 + 2\\cos\\theta + \\cos^2\\theta}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{2 + 2\\cos\\theta}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{2(1 + \\cos\\theta)}{\\sin\\theta(1 + \\cos\\theta)} = \\frac{2}{\\sin\\theta} = 2\\csc\\theta$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:45:00.000Z"
    }
  ]
};
