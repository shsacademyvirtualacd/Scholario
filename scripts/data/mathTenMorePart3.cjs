/**
 * mathTenMorePart3.cjs
 * 
 * 60 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 1 to 6, 10 each)
 * Strict append batch (Questions 21 to 30 for each chapter)
 * 
 * Chapters covered:
 * 1. Real Numbers (10 MCQs: 21-30)
 * 2. Logarithms (10 MCQs: 21-30)
 * 3. Sets and Relations (10 MCQs: 21-30)
 * 4. Factorization and Algebraic Manipulation (10 MCQs: 21-30)
 * 5. Linear Equations and Inequalities (10 MCQs: 21-30)
 * 6. Trigonometry and Bearing (10 MCQs: 21-30)
 */

module.exports = {
  "Real Numbers": [
    {
      id: "fbise9_math_ch1_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of real numbers under addition and multiplication",
      question: "Which of the following demonstrates the associative property of addition for real numbers?",
      options: {
        A: "$(a + b) + c = a + (b + c)$",
        B: "$a + b = b + a$",
        C: "$a(b + c) = ab + ac$",
        D: "$a + 0 = a$"
      },
      correctAnswer: "A",
      explanation: "The associative property of addition states that the grouping of numbers does not affect their sum: $(a + b) + c = a + (b + c)$ for all real numbers $a, b, c$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "What is the additive inverse of the complex number $z = 6 - 5i$?",
      options: {
        A: "$-6 + 5i$",
        B: "$6 + 5i$",
        C: "$-6 - 5i$",
        D: "$\\frac{1}{6 - 5i}$"
      },
      correctAnswer: "A",
      explanation: "The additive inverse of a complex number $z = a + bi$ is $-z = -a - bi$. For $z = 6 - 5i$, the additive inverse is $-(6 - 5i) = -6 + 5i$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Rational and Irrational numbers",
      question: "The recurring decimal $0.\\overline{3} = 0.3333\\dots$ expressed as a rational fraction $\\frac{p}{q}$ in lowest terms is:",
      options: {
        A: "$\\frac{1}{3}$",
        B: "$\\frac{3}{10}$",
        C: "$\\frac{3}{100}$",
        D: "$\\frac{1}{9}$"
      },
      correctAnswer: "A",
      explanation: "Let $x = 0.333\\dots \\implies 10x = 3.333\\dots$. Subtracting gives $9x = 3 \\implies x = \\frac{3}{9} = \\frac{1}{3}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "Evaluate the power of the imaginary unit: $i^{50}$.",
      options: {
        A: "$-1$",
        B: "$1$",
        C: "$i$",
        D: "$-i$"
      },
      correctAnswer: "A",
      explanation: "$i^{50} = i^{4 \\times 12 + 2} = (i^4)^{12} \\cdot i^2 = (1)^{12} \\cdot (-1) = -1$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Laws of Exponents/Indices",
      question: "Simplify $\\sqrt[3]{\\frac{x^6 y^9}{z^{12}}}$.",
      options: {
        A: "$\\frac{x^2 y^3}{z^4}$",
        B: "$\\frac{x^3 y^6}{z^9}$",
        C: "$\\frac{x y^2}{z^3}$",
        D: "$\\frac{x^2 y^2}{z^4}$"
      },
      correctAnswer: "A",
      explanation: "Using the index law $(\\frac{a}{b})^k = \\frac{a^k}{b^k}$ with fractional exponent $\\frac{1}{3}$: $(x^6)^{1/3} = x^2$, $(y^9)^{1/3} = y^3$, $(z^{12})^{1/3} = z^4$. Thus $\\frac{x^2 y^3}{z^4}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Radicands",
      question: "Rationalize the denominator of $\\frac{1}{4 - \\sqrt{15}}$.",
      options: {
        A: "$4 + \\sqrt{15}$",
        B: "$4 - \\sqrt{15}$",
        C: "$\\frac{4 + \\sqrt{15}}{31}$",
        D: "$15 + \\sqrt{4}$"
      },
      correctAnswer: "A",
      explanation: "Multiply numerator and denominator by conjugate $(4 + \\sqrt{15})$: $\\frac{4 + \\sqrt{15}}{4^2 - (\\sqrt{15})^2} = \\frac{4 + \\sqrt{15}}{16 - 15} = \\frac{4 + \\sqrt{15}}{1} = 4 + \\sqrt{15}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Complex numbers basics ($i = \\sqrt{-1}$)",
      question: "Find the real values of $x$ and $y$ if $(2x - 3y) + (x + y)i = 7 + 6i$.",
      options: {
        A: "$x = 5, y = 1$",
        B: "$x = 1, y = 5$",
        C: "$x = 4, y = 2$",
        D: "$x = 3, y = 3$"
      },
      correctAnswer: "A",
      explanation: "Equating real and imaginary parts gives: (1) $2x - 3y = 7$ and (2) $x + y = 6 \\implies x = 6 - y$. Substitute into (1): $2(6 - y) - 3y = 7 \\implies 12 - 5y = 7 \\implies -5y = -5 \\implies y = 1$. Then $x = 6 - 1 = 5$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Laws of Exponents/Indices",
      question: "Evaluate the expression $\\left(\\frac{81 x^{-4}}{16 y^{-8}}\\right)^{-\\frac{3}{4}}$.",
      options: {
        A: "$\\frac{8 x^3}{27 y^6}$",
        B: "$\\frac{27 x^3}{8 y^6}$",
        C: "$\\frac{8 y^6}{27 x^3}$",
        D: "$\\frac{27 y^6}{8 x^3}$"
      },
      correctAnswer: "A",
      explanation: "Inside the brackets: $\\frac{81 y^8}{16 x^4} = \\left(\\frac{3 y^2}{2 x}\\right)^4$. Raising to power $-\\frac{3}{4}$: $\\left(\\left(\\frac{3 y^2}{2 x}\\right)^4\\right)^{-\\frac{3}{4}} = \\left(\\frac{3 y^2}{2 x}\\right)^{-3} = \\left(\\frac{2 x}{3 y^2}\\right)^3 = \\frac{8 x^3}{27 y^6}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Radicands",
      question: "If $x = 2 + \\sqrt{3}$, what is the value of $x^2 + \\frac{1}{x^2}$?",
      options: {
        A: "$14$",
        B: "$16$",
        C: "$12$",
        D: "$10$"
      },
      correctAnswer: "A",
      explanation: "$\\frac{1}{x} = \\frac{1}{2 + \\sqrt{3}} = 2 - \\sqrt{3}$. Then $x + \\frac{1}{x} = (2 + \\sqrt{3}) + (2 - \\sqrt{3}) = 4$. Squaring both sides: $(x + \\frac{1}{x})^2 = x^2 + \\frac{1}{x^2} + 2 = 4^2 = 16 \\implies x^2 + \\frac{1}{x^2} = 16 - 2 = 14$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch1_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of real numbers under addition and multiplication",
      question: "If $a, b, c \\in \\mathbb{R}$ such that $a < b$ and $c < 0$, then according to the multiplicative property of inequality:",
      options: {
        A: "$ac > bc$",
        B: "$ac < bc$",
        C: "$ac = bc$",
        D: "$a + c > b + c$"
      },
      correctAnswer: "A",
      explanation: "Multiplying both sides of an inequality by a negative real number reverses the direction of the inequality sign: if $a < b$ and $c < 0$, then $ac > bc$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Logarithms": [
    {
      id: "fbise9_math_ch2_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Scientific notation",
      question: "Express the decimal number $0.0000458$ in scientific notation.",
      options: {
        A: "$4.58 \\times 10^{-5}$",
        B: "$45.8 \\times 10^{-6}$",
        C: "$4.58 \\times 10^5$",
        D: "$0.458 \\times 10^{-4}$"
      },
      correctAnswer: "A",
      explanation: "Shifting the decimal point 5 places to the right to place it after the first non-zero digit gives $4.58 \\times 10^{-5}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "What is the value of $\\log_{10}(1)$?",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$10$",
        D: "Undefined"
      },
      correctAnswer: "A",
      explanation: "Since $10^0 = 1$, the logarithm of $1$ to any valid positive base $a \\neq 1$ is always $0$ (i.e. $\\log_a 1 = 0$).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "Rewrite $\\log_a x + \\log_a y - \\log_a z$ as a single logarithm.",
      options: {
        A: "$\\log_a\\left(\\frac{xy}{z}\\right)$",
        B: "$\\log_a(x + y - z)$",
        C: "$\\log_a\\left(\\frac{x}{yz}\\right)$",
        D: "$\\frac{\\log_a(xy)}{\\log_a z}$"
      },
      correctAnswer: "A",
      explanation: "Using the product law $\\log_a x + \\log_a y = \\log_a(xy)$ and quotient law $\\log_a(xy) - \\log_a z = \\log_a\\left(\\frac{xy}{z}\\right)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Characteristic and Mantissa",
      question: "What is the characteristic of $\\log_{10}(0.0034)$?",
      options: {
        A: "$\\bar{3}$ (or $-3$)",
        B: "$\\bar{2}$",
        C: "$-4$",
        D: "$3$"
      },
      correctAnswer: "A",
      explanation: "For a decimal number less than 1, the characteristic is negative, given by $-(m + 1)$ where $m$ is the number of consecutive zeros immediately after the decimal point. Here there are 2 zeros, so characteristic is $-(2 + 1) = -3 = \\bar{3}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "If $\\log_2 x = 5$, find the value of $x$.",
      options: {
        A: "$32$",
        B: "$10$",
        C: "$25$",
        D: "$64$"
      },
      correctAnswer: "A",
      explanation: "Converting to exponential form gives $x = 2^5 = 32$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "Simplify $\\log_a(\\sqrt[3]{x^2})$ using laws of logarithms.",
      options: {
        A: "$\\frac{2}{3}\\log_a x$",
        B: "$\\frac{3}{2}\\log_a x$",
        C: "$3\\log_a(x^2)$",
        D: "$\\frac{1}{3}\\log_a(x^2)$"
      },
      correctAnswer: "A",
      explanation: "$\\sqrt[3]{x^2} = x^{2/3}$. By the power law of logarithms $\\log_a(x^{2/3}) = \\frac{2}{3}\\log_a x$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Change of base",
      question: "Change of base formula expresses $\\log_b a$ in terms of base $c$ as:",
      options: {
        A: "$\\frac{\\log_c a}{\\log_c b}$",
        B: "$\\frac{\\log_c b}{\\log_c a}$",
        C: "$\\log_c a \\cdot \\log_c b$",
        D: "$\\log_c(a - b)$"
      },
      correctAnswer: "A",
      explanation: "The standard change of base rule states that $\\log_b a = \\frac{\\log_c a}{\\log_c b}$ for any positive real base $c \\neq 1$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Concept of Logarithm",
      question: "Solve for $x$: $\\log_{3\\sqrt{2}}(324) = x$.",
      options: {
        A: "$4$",
        B: "$6$",
        C: "$2$",
        D: "$8$"
      },
      correctAnswer: "A",
      explanation: "Notice $(3\\sqrt{2})^2 = 9 \\times 2 = 18$. Then $(18)^2 = 324$. Thus $(3\\sqrt{2})^4 = ((3\\sqrt{2})^2)^2 = 18^2 = 324$. Hence $x = 4$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "If $\\log_{10} 2 = 0.3010$, find the value of $\\log_{10}(5)$.",
      options: {
        A: "$0.6990$",
        B: "$0.7010$",
        C: "$0.5000$",
        D: "$0.3980$"
      },
      correctAnswer: "A",
      explanation: "$\\log_{10}(5) = \\log_{10}\\left(\\frac{10}{2}\\right) = \\log_{10} 10 - \\log_{10} 2 = 1 - 0.3010 = 0.6990$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch2_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Application of logarithms in numerical calculations",
      question: "Natural logarithms (ln) use which base?",
      options: {
        A: "Euler’s constant $e \\approx 2.71828$",
        B: "Base $10$",
        C: "Base $2$",
        D: "Base $\\pi \\approx 3.14159$"
      },
      correctAnswer: "A",
      explanation: "Natural logarithms are logarithms with base $e$ (Euler's number, irrational constant approximately $2.71828$), denoted as $\\ln x = \\log_e x$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Sets and Relations": [
    {
      id: "fbise9_math_ch3_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "If $A \\subseteq B$, then the union $A \\cup B$ is equal to:",
      options: {
        A: "$B$",
        B: "$A$",
        C: "$\\emptyset$",
        D: "$A - B$"
      },
      correctAnswer: "A",
      explanation: "If $A$ is a subset of $B$, every element in $A$ is already in $B$. Therefore, their union contains all elements of $B$, which is set $B$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "The complement of the universal set $U$ (i.e. $U^c$) is:",
      options: {
        A: "The empty set $\\emptyset$",
        B: "$U$",
        C: "$\\{0\\}$",
        D: "Undefined"
      },
      correctAnswer: "A",
      explanation: "By definition, $U^c = U - U = \\emptyset$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Binary Relations",
      question: "If set $A$ has $m$ elements and set $B$ has $n$ elements, the total number of binary relations from $A$ to $B$ is:",
      options: {
        A: "$2^{mn}$",
        B: "$mn$",
        C: "$2^m + 2^n$",
        D: "$2^{m+n}$"
      },
      correctAnswer: "A",
      explanation: "A binary relation from $A$ to $B$ is any subset of Cartesian product $A \\times B$. Since $n(A \\times B) = mn$, the total number of subsets is $2^{mn}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "A function $f: A \\to B$ is called an Injective (one-to-one) function if:",
      options: {
        A: "Distinct elements in $A$ have distinct images in $B$ ($x_1 \\neq x_2 \\implies f(x_1) \\neq f(x_2)$)",
        B: "Range of $f = B$",
        C: "Every element of $B$ has at least two pre-images in $A$",
        D: "Domain of $f \\neq A$"
      },
      correctAnswer: "A",
      explanation: "An injective (one-to-one) function maps distinct elements of the domain to distinct elements of the codomain: no two different domain elements have the same output.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "A function $f: A \\to B$ is called a Surjective (onto) function if:",
      options: {
        A: "$\\text{Range}(f) = B$ (the codomain)",
        B: "$\\text{Range}(f) \\subset B$ and $\\text{Range}(f) \\neq B$",
        C: "$f$ is one-to-one",
        D: "Domain of $f = \\emptyset$"
      },
      correctAnswer: "A",
      explanation: "A surjective (onto) function has the property that its range is equal to the entire co-domain set $B$; every element of $B$ is the image of at least one element in $A$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Binary Relations",
      question: "Find the domain of the binary relation $R = \\{(1, 4), (2, 5), (3, 6), (4, 7)\\}$.",
      options: {
        A: "$\\{1, 2, 3, 4\\}$",
        B: "$\\{4, 5, 6, 7\\}$",
        C: "$\\{1, 4, 2, 5\\}$",
        D: "$\\{1, 7\\}$"
      },
      correctAnswer: "A",
      explanation: "The domain of a relation is the set of all first elements (x-coordinates) of its ordered pairs: $\\text{Dom}(R) = \\{1, 2, 3, 4\\}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Functions/Mappings",
      question: "A function that is simultaneously injective (one-to-one) and surjective (onto) is called a:",
      options: {
        A: "Bijective function",
        B: "Constant function",
        C: "Into function",
        D: "Identity function"
      },
      correctAnswer: "A",
      explanation: "A bijective function (or one-to-one correspondence) is a mapping that is both one-to-one (injective) and onto (surjective).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "The symmetric difference between two sets $A$ and $B$, denoted $A \\Delta B$, is defined as:",
      options: {
        A: "$(A - B) \\cup (B - A)$",
        B: "$(A - B) \\cap (B - A)$",
        C: "$A \\cap B$",
        D: "$U - (A \\cup B)$"
      },
      correctAnswer: "A",
      explanation: "The symmetric difference of sets $A$ and $B$ contains elements in either $A$ or $B$ but not in their intersection: $A \\Delta B = (A - B) \\cup (B - A) = (A \\cup B) - (A \\cap B)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "De Morgan’s Laws",
      question: "According to De Morgan's Law, the complement of the union $(A \\cup B)^c$ is identical to:",
      options: {
        A: "$A^c \\cap B^c$",
        B: "$A^c \\cup B^c$",
        C: "$(A \\cap B)^c$",
        D: "$A - B^c$"
      },
      correctAnswer: "A",
      explanation: "De Morgan's First Law states that the complement of the union of two sets equals the intersection of their individual complements: $(A \\cup B)^c = A^c \\cap B^c$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch3_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Operations on sets",
      question: "If $n(A) = 15$, $n(B) = 20$, and $n(A \\cup B) = 30$, find $n(A \\cap B)$.",
      options: {
        A: "$5$",
        B: "$10$",
        C: "$35$",
        D: "$15$"
      },
      correctAnswer: "A",
      explanation: "Using the inclusion-exclusion principle: $n(A \\cup B) = n(A) + n(B) - n(A \\cap B) \\implies 30 = 15 + 20 - n(A \\cap B) \\implies n(A \\cap B) = 35 - 30 = 5$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Factorization and Algebraic Manipulation": [
    {
      id: "fbise9_math_ch4_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the difference of two squares: $25x^2 - 49y^2$.",
      options: {
        A: "$(5x - 7y)(5x + 7y)$",
        B: "$(5x - 7y)^2$",
        C: "$(25x - 49y)(x + y)$",
        D: "$(5x + 7y)^2$"
      },
      correctAnswer: "A",
      explanation: "Using $a^2 - b^2 = (a - b)(a + b)$ with $a = 5x$ and $b = 7y$: $(5x)^2 - (7y)^2 = (5x - 7y)(5x + 7y)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the quadratic expression $x^2 - 7x + 12$.",
      options: {
        A: "$(x - 3)(x - 4)$",
        B: "$(x - 2)(x - 6)$",
        C: "$(x + 3)(x + 4)$",
        D: "$(x - 1)(x - 12)$"
      },
      correctAnswer: "A",
      explanation: "Find two numbers whose product is $+12$ and sum is $-7$: $-3$ and $-4$. Thus $(x - 3)(x - 4)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF and LCM of algebraic expressions",
      question: "The product of HCF and LCM of two polynomials $P(x)$ and $Q(x)$ is always equal to:",
      options: {
        A: "$P(x) \\times Q(x)$",
        B: "$P(x) + Q(x)$",
        C: "$\\frac{P(x)}{Q(x)}$",
        D: "$P(x) - Q(x)$"
      },
      correctAnswer: "A",
      explanation: "A fundamental algebraic theorem states that for any two polynomial expressions $P(x)$ and $Q(x)$, $\\text{HCF} \\times \\text{LCM} = P(x) \\times Q(x)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize the cubic sum $8x^3 + 27y^3$.",
      options: {
        A: "$(2x + 3y)(4x^2 - 6xy + 9y^2)$",
        B: "$(2x + 3y)(4x^2 + 6xy + 9y^2)$",
        C: "$(2x - 3y)(4x^2 + 6xy + 9y^2)$",
        D: "$(2x + 3y)^3$"
      },
      correctAnswer: "A",
      explanation: "Using $a^3 + b^3 = (a + b)(a^2 - ab + b^2)$ where $a = 2x, b = 3y$: $(2x + 3y)((2x)^2 - (2x)(3y) + (3y)^2) = (2x + 3y)(4x^2 - 6xy + 9y^2)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Remainder Theorem and Factor Theorem",
      question: "What value of $k$ makes $(x - 2)$ an exact factor of $P(x) = x^3 - 3x^2 + kx - 4$?",
      options: {
        A: "$4$",
        B: "$2$",
        C: "$-4$",
        D: "$6$"
      },
      correctAnswer: "A",
      explanation: "By Factor Theorem, $P(2) = 0 \\implies 2^3 - 3(2^2) + k(2) - 4 = 0 \\implies 8 - 12 + 2k - 4 = 0 \\implies 2k - 8 = 0 \\implies 2k = 8 \\implies k = 4$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Simplification of rational algebraic expressions",
      question: "Simplify $\\frac{x^2 - 9}{x^2 + 5x + 6}$ to lowest rational form.",
      options: {
        A: "$\\frac{x - 3}{x + 2}$",
        B: "$\\frac{x + 3}{x + 2}$",
        C: "$\\frac{x - 3}{x + 3}$",
        D: "$\\frac{1}{5x}$"
      },
      correctAnswer: "A",
      explanation: "Factorize numerator and denominator: $\\frac{(x - 3)(x + 3)}{(x + 2)(x + 3)} = \\frac{x - 3}{x + 2}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "Factorize completely: $x^4 + 4y^4$.",
      options: {
        A: "$(x^2 + 2xy + 2y^2)(x^2 - 2xy + 2y^2)$",
        B: "$(x^2 + 2y^2)^2$",
        C: "$(x^2 - 2y^2)^2$",
        D: "$(x^2 + 4y^2)(x^2 - 4y^2)$"
      },
      correctAnswer: "A",
      explanation: "Complete the square: $x^4 + 4y^4 = (x^2)^2 + 2(x^2)(2y^2) + (2y^2)^2 - 4x^2 y^2 = (x^2 + 2y^2)^2 - (2xy)^2 = (x^2 + 2y^2 - 2xy)(x^2 + 2y^2 + 2xy) = (x^2 + 2xy + 2y^2)(x^2 - 2xy + 2y^2)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF and LCM of algebraic expressions",
      question: "If HCF of two expressions is $(x + 3)$, their LCM is $(x^2 - 9)(x + 2)$, and one expression is $x^2 + 5x + 6$, find the other expression.",
      options: {
        A: "$x^2 - 9$",
        B: "$x^2 + 9$",
        C: "$(x - 3)^2$",
        D: "$x^2 - 5x + 6$"
      },
      correctAnswer: "A",
      explanation: "Using $\\text{Expression}_2 = \\frac{\\text{HCF} \\times \\text{LCM}}{\\text{Expression}_1}$: $\\frac{(x + 3)(x^2 - 9)(x + 2)}{(x + 2)(x + 3)} = x^2 - 9$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factorization of formulas",
      question: "If $a + b + c = 6$ and $a^2 + b^2 + c^2 = 20$, find the value of $ab + bc + ca$.",
      options: {
        A: "$8$",
        B: "$16$",
        C: "$4$",
        D: "$12$"
      },
      correctAnswer: "A",
      explanation: "Using formula $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca)$: $6^2 = 20 + 2(ab + bc + ca) \\implies 36 = 20 + 2(ab + bc + ca) \\implies 2(ab + bc + ca) = 16 \\implies ab + bc + ca = 8$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch4_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Simplification of rational algebraic expressions",
      question: "Simplify the compound fraction $\\frac{1 - \\frac{1}{x}}{1 - \\frac{1}{x^2}}$.",
      options: {
        A: "$\\frac{x}{x + 1}$",
        B: "$\\frac{x - 1}{x + 1}$",
        C: "$\\frac{x + 1}{x}$",
        D: "$\\frac{1}{x}$"
      },
      correctAnswer: "A",
      explanation: "Numerator $= \\frac{x - 1}{x}$. Denominator $= \\frac{x^2 - 1}{x^2} = \\frac{(x - 1)(x + 1)}{x^2}$. Dividing: $\\frac{x - 1}{x} \\times \\frac{x^2}{(x - 1)(x + 1)} = \\frac{x}{x + 1}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Linear Equations and Inequalities": [
    {
      id: "fbise9_math_ch5_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the linear equation: $\\frac{x}{3} + 4 = 10$.",
      options: {
        A: "$x = 18$",
        B: "$x = 6$",
        C: "$x = 42$",
        D: "$x = 2$"
      },
      correctAnswer: "A",
      explanation: "Subtract $4$: $\\frac{x}{3} = 6$. Multiply by $3$: $x = 18$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "If $-2x < 8$, then dividing both sides by $-2$ yields:",
      options: {
        A: "$x > -4$",
        B: "$x < -4$",
        C: "$x > 4$",
        D: "$x \\le -4$"
      },
      correctAnswer: "A",
      explanation: "Dividing or multiplying an inequality by a negative real number reverses the inequality symbol. Hence $-2x < 8 \\implies x > \\frac{8}{-2} \\implies x > -4$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Graphing linear equations",
      question: "The graph of the equation $y = 5$ is a horizontal straight line that is:",
      options: {
        A: "Parallel to the x-axis",
        B: "Parallel to the y-axis",
        C: "Passing through the origin",
        D: "Perpendicular to the x-axis"
      },
      correctAnswer: "A",
      explanation: "An equation of the form $y = c$ represents a horizontal line parallel to the x-axis at distance $c$ from it.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the linear equation: $\\frac{2x - 3}{4} = \\frac{x + 1}{3}$.",
      options: {
        A: "$x = 6.5$ (or $\\frac{13}{2}$)",
        B: "$x = 5$",
        C: "$x = 7$",
        D: "$x = 4$"
      },
      correctAnswer: "A",
      explanation: "Cross-multiply: $3(2x - 3) = 4(x + 1) \\implies 6x - 9 = 4x + 4 \\implies 2x = 13 \\implies x = \\frac{13}{2} = 6.5$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "Solve the absolute value inequality $|x - 2| < 3$.",
      options: {
        A: "$-1 < x < 5$",
        B: "$x < 5$",
        C: "$x > -1$",
        D: "$x < -1$ or $x > 5$"
      },
      correctAnswer: "A",
      explanation: "The inequality $|u| < a$ is equivalent to $-a < u < a$. Thus $-3 < x - 2 < 3$. Adding $2$ across the inequality: $-1 < x < 5$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "A root that does not satisfy the original radical equation after squaring both sides is called an:",
      options: {
        A: "Extraneous root",
        B: "Irrational root",
        C: "Imaginary root",
        D: "Identity root"
      },
      correctAnswer: "A",
      explanation: "An extraneous root is a solution introduced by algebraic manipulations (such as squaring both sides) that is not a valid solution of the original equation.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear inequalities",
      question: "Solve the double linear inequality: $-5 \\le \\frac{4 - 3x}{2} < 8$.",
      options: {
        A: "$-4 < x \\le \\frac{14}{3}$",
        B: "$-4 \\le x < \\frac{14}{3}$",
        C: "$\\frac{-14}{3} < x \\le 4$",
        D: "$x \\le 4$"
      },
      correctAnswer: "A",
      explanation: "Multiply by $2$: $-10 \\le 4 - 3x < 16$. Subtract $4$: $-14 \\le -3x < 12$. Divide by $-3$ (reversing signs): $\\frac{14}{3} \\ge x > -4$, which is $-4 < x \\le \\frac{14}{3}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Equations involving absolute value",
      question: "Solve the absolute value equation: $|3x + 4| = |x - 8|$.",
      options: {
        A: "$\\{-6, 1\\}$",
        B: "$\\{6, -1\\}$",
        C: "$\\{-3, 4\\}$",
        D: "$\\{2, -8\\}$"
      },
      correctAnswer: "A",
      explanation: "Case 1: $3x + 4 = x - 8 \\implies 2x = -12 \\implies x = -6$. Case 2: $3x + 4 = -(x - 8) = -x + 8 \\implies 4x = 4 \\implies x = 1$. Solution set is $\\{-6, 1\\}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Graphing linear equations",
      question: "What is the slope ($m$) and y-intercept ($c$) of the line $3x + 2y = 8$?",
      options: {
        A: "$m = -\\frac{3}{2}, c = 4$",
        B: "$m = \\frac{3}{2}, c = 4$",
        C: "$m = -3, c = 8$",
        D: "$m = -\\frac{2}{3}, c = \\frac{8}{3}$"
      },
      correctAnswer: "A",
      explanation: "Rewrite in slope-intercept form $y = mx + c$: $2y = -3x + 8 \\implies y = -\\frac{3}{2}x + 4$. Hence $m = -\\frac{3}{2}$ and $c = 4$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch5_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear equations in one variable",
      question: "Solve the radical equation: $\\sqrt[3]{2x - 5} = 3$.",
      options: {
        A: "$x = 16$",
        B: "$x = 11$",
        C: "$x = 7$",
        D: "$x = 32$"
      },
      correctAnswer: "A",
      explanation: "Cube both sides: $(\\sqrt[3]{2x - 5})^3 = 3^3 \\implies 2x - 5 = 27 \\implies 2x = 32 \\implies x = 16$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Trigonometry and Bearing": [
    {
      id: "fbise9_math_ch6_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios of standard angles",
      question: "What is the exact value of $\\sin 45^\\circ$?",
      options: {
        A: "$\\frac{1}{\\sqrt{2}}$",
        B: "$\\frac{1}{2}$",
        C: "$\\frac{\\sqrt{3}}{2}$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "In an isosceles right triangle with angles $45^\\circ-45^\\circ-90^\\circ$, $\\sin 45^\\circ = \\frac{1}{\\sqrt{2}} = \\frac{\\sqrt{2}}{2}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios",
      question: "The reciprocal of $\\cos\\theta$ is:",
      options: {
        A: "$\\sec\\theta$",
        B: "$\\csc\\theta$",
        C: "$\\cot\\theta$",
        D: "$\\tan\\theta$"
      },
      correctAnswer: "A",
      explanation: "By definition, $\\sec\\theta = \\frac{1}{\\cos\\theta}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Bearings and navigational problem solving",
      question: "A three-figure bearing is always measured in which direction starting from North?",
      options: {
        A: "Clockwise direction",
        B: "Anticlockwise direction",
        C: "Due South",
        D: "Due West"
      },
      correctAnswer: "A",
      explanation: "Standard three-figure bearings are measured clockwise from true North ($000^\\circ$) from $000^\\circ$ to $360^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Simplify $\\cos\\theta \\cdot \\tan\\theta$.",
      options: {
        A: "$\\sin\\theta$",
        B: "$\\sec\\theta$",
        C: "$\\cot\\theta$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Since $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$, multiplying gives $\\cos\\theta \\cdot \\frac{\\sin\\theta}{\\cos\\theta} = \\sin\\theta$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios of standard angles",
      question: "Evaluate $\\sin^2 30^\\circ + \\cos^2 30^\\circ$.",
      options: {
        A: "$1$",
        B: "$\\frac{1}{2}$",
        C: "$\\frac{\\sqrt{3}}{2}$",
        D: "$2$"
      },
      correctAnswer: "A",
      explanation: "By the fundamental identity $\\sin^2\\theta + \\cos^2\\theta = 1$ for any angle $\\theta$, or calculating directly: $(\\frac{1}{2})^2 + (\\frac{\\sqrt{3}}{2})^2 = \\frac{1}{4} + \\frac{3}{4} = 1$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Angles of Elevation and Depression",
      question: "When an observer looks at an object situated lower than their eye level, the angle between the horizontal line of sight and the line to the object is the:",
      options: {
        A: "Angle of Depression",
        B: "Angle of Elevation",
        C: "Bearing angle",
        D: "Reflex angle"
      },
      correctAnswer: "A",
      explanation: "The angle of depression is the angle formed by the horizontal line of sight and the line of sight downwards towards an object below.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Angles of Elevation and Depression",
      question: "From the top of a cliff of height $30\\sqrt{3}\\text{ m}$, the angle of depression of a boat on the water is $60^\\circ$. How far is the boat from the base of the cliff?",
      options: {
        A: "$30\\text{ m}$",
        B: "$60\\text{ m}$",
        C: "$90\\text{ m}$",
        D: "$15\\sqrt{3}\\text{ m}$"
      },
      correctAnswer: "A",
      explanation: "$\\tan 60^\\circ = \\frac{\\text{Height}}{\\text{Distance}} \\implies \\sqrt{3} = \\frac{30\\sqrt{3}}{d} \\implies d = 30\\text{ m}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Trigonometric Identities",
      question: "Simplify $\\frac{1}{1 - \\sin\\theta} + \\frac{1}{1 + \\sin\\theta}$.",
      options: {
        A: "$2\\sec^2\\theta$",
        B: "$2\\csc^2\\theta$",
        C: "$2\\tan^2\\theta$",
        D: "$2\\cos^2\\theta$"
      },
      correctAnswer: "A",
      explanation: "Combine over common denominator $(1 - \\sin\\theta)(1 + \\sin\\theta) = 1 - \\sin^2\\theta = \\cos^2\\theta$: $\\frac{(1 + \\sin\\theta) + (1 - \\sin\\theta)}{\\cos^2\\theta} = \\frac{2}{\\cos^2\\theta} = 2\\sec^2\\theta$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric ratios",
      question: "If $\\sin\\theta = \\frac{3}{5}$ where $\\theta$ is an acute angle, calculate the value of $\\frac{\\cos\\theta}{1 - \\tan\\theta}$.",
      options: {
        A: "$\\frac{16}{5}$",
        B: "$\\frac{4}{5}$",
        C: "$\\frac{12}{5}$",
        D: "$\\frac{5}{16}$"
      },
      correctAnswer: "A",
      explanation: "In a $3-4-5$ right triangle with acute $\\theta$: opposite $= 3$, hypotenuse $= 5$, adjacent $= 4$. Thus $\\cos\\theta = \\frac{4}{5}$ and $\\tan\\theta = \\frac{3}{4}$. Then $\\frac{\\cos\\theta}{1 - \\tan\\theta} = \\frac{4/5}{1 - 3/4} = \\frac{4/5}{1/4} = \\frac{4}{5} \\times 4 = \\frac{16}{5}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch6_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Bearings and navigational problem solving",
      question: "A hiker walks $8\\text{ km}$ due East, then $6\\text{ km}$ due North. What is the direct straight-line distance from the starting position?",
      options: {
        A: "$10\\text{ km}$",
        B: "$14\\text{ km}$",
        C: "$12\\text{ km}$",
        D: "$\\sqrt{28}\\text{ km}$"
      },
      correctAnswer: "A",
      explanation: "East and North form a right angle ($90^\\circ$). By Pythagoras theorem: $d = \\sqrt{8^2 + 6^2} = \\sqrt{64 + 36} = \\sqrt{100} = 10\\text{ km}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ]
};
