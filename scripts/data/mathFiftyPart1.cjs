/**
 * mathFiftyPart1.cjs
 * 
 * 60 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 1 to 6, 10 each)
 * Strict append batch (Questions 41 to 50 for each chapter)
 * 
 * Chapters covered:
 * 1. Real Numbers (10 MCQs: 41-50)
 * 2. Logarithms (10 MCQs: 41-50)
 * 3. Sets and Relations (10 MCQs: 41-50)
 * 4. Factorization and Algebraic Manipulation (10 MCQs: 41-50)
 * 5. Linear Equations and Inequalities (10 MCQs: 41-50)
 * 6. Trigonometry and Bearing (10 MCQs: 41-50)
 */

module.exports = {
  "Real Numbers": [
    {
      id: "fbise9_math_ch1_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Properties of Real Numbers",
      question: "Which property of real numbers is illustrated by $a(b + c) = ab + ac$?",
      options: {
        A: "Distributive property of multiplication over addition",
        B: "Associative property of multiplication",
        C: "Commutative property of addition",
        D: "Additive identity property"
      },
      correctAnswer: "A",
      explanation: "The identity $a(b + c) = ab + ac$ states that multiplying a sum by a number gives the same result as multiplying each addend by the number and adding the products. This is the distributive property of multiplication over addition.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Types of Numbers",
      question: "Which of the following numbers is a pure imaginary number?",
      options: {
        A: "$5i$",
        B: "$3 + 4i$",
        C: "$\\sqrt{7}$",
        D: "$0$"
      },
      correctAnswer: "A",
      explanation: "A complex number $z = a + bi$ is called a pure imaginary number if its real part is zero ($a = 0$) and its imaginary part is non-zero ($b \\neq 0$). Thus, $5i$ is pure imaginary.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Radicals and Exponents",
      question: "What is the exponential form of the radical expression $\\sqrt[5]{x^3}$?",
      options: {
        A: "$x^{3/5}$",
        B: "$x^{5/3}$",
        C: "$x^{15}$",
        D: "$x^{-2/5}$"
      },
      correctAnswer: "A",
      explanation: "The radical $\\sqrt[n]{a^m}$ is written in exponential form as $a^{m/n}$. Therefore, $\\sqrt[5]{x^3} = x^{3/5}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Powers of iota",
      question: "What is the simplified value of $i^{29} + i^{31}$?",
      options: {
        A: "$0$",
        B: "$2i$",
        C: "$-2i$",
        D: "$2$"
      },
      correctAnswer: "A",
      explanation: "$i^{29} = (i^4)^7 \\cdot i^1 = (1)^7 \\cdot i = i$. $i^{31} = (i^4)^7 \\cdot i^3 = (1)^7 \\cdot (-i) = -i$. Therefore, $i^{29} + i^{31} = i + (-i) = 0$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Modulus of Complex Number",
      question: "What is the absolute value (modulus) of the complex number $z = -6 + 8i$?",
      options: {
        A: "$10$",
        B: "$14$",
        C: "$2$",
        D: "$\\sqrt{28}$"
      },
      correctAnswer: "A",
      explanation: "The modulus $|z| = \\sqrt{a^2 + b^2} = \\sqrt{(-6)^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Division of Complex Numbers",
      question: "What is the result of dividing $\\frac{4 + 2i}{1 - i}$ in standard form $a + bi$?",
      options: {
        A: "$1 + 3i$",
        B: "$3 + i$",
        C: "$2 + 3i$",
        D: "$1 - 3i$"
      },
      correctAnswer: "A",
      explanation: "Multiply numerator and denominator by the conjugate $(1 + i)$: $\\frac{(4 + 2i)(1 + i)}{(1 - i)(1 + i)} = \\frac{4 + 4i + 2i + 2i^2}{1 - i^2} = \\frac{4 + 6i - 2}{1 - (-1)} = \\frac{2 + 6i}{2} = 1 + 3i$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Simplification of Surds",
      question: "What is the rationalized value of $\\frac{1}{3 - 2\\sqrt{2}}$?",
      options: {
        A: "$3 + 2\\sqrt{2}$",
        B: "$3 - 2\\sqrt{2}$",
        C: "$\\frac{3 + 2\\sqrt{2}}{17}$",
        D: "$\\frac{3 - 2\\sqrt{2}}{7}$"
      },
      correctAnswer: "A",
      explanation: "Multiply numerator and denominator by the conjugate $(3 + 2\\sqrt{2})$: $\\frac{3 + 2\\sqrt{2}}{(3 - 2\\sqrt{2})(3 + 2\\sqrt{2})} = \\frac{3 + 2\\sqrt{2}}{3^2 - (2\\sqrt{2})^2} = \\frac{3 + 2\\sqrt{2}}{9 - 8} = 3 + 2\\sqrt{2}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Equality of Complex Numbers",
      question: "If $(2x - 3) + (y + 4)i = 7 - 2i$, where $x, y \\in \\mathbb{R}$, find the value of $x + y$.",
      options: {
        A: "$-1$",
        B: "$11$",
        C: "$5$",
        D: "$-6$"
      },
      correctAnswer: "A",
      explanation: "Equating real parts: $2x - 3 = 7 \\implies 2x = 10 \\implies x = 5$. Equating imaginary parts: $y + 4 = -2 \\implies y = -6$. Thus, $x + y = 5 + (-6) = -1$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Conjugate Product Property",
      question: "For any complex number $z = a + bi$, what is the product $z \\cdot \\bar{z}$?",
      options: {
        A: "$a^2 + b^2$",
        B: "$a^2 - b^2$",
        C: "$a^2 + 2abi - b^2$",
        D: "$2a$"
      },
      correctAnswer: "A",
      explanation: "The conjugate is $\\bar{z} = a - bi$. The product $z \\cdot \\bar{z} = (a + bi)(a - bi) = a^2 - (bi)^2 = a^2 - b^2(-1) = a^2 + b^2 = |z|^2$, which is always a non-negative real number.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch1_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Real Numbers",
      chapterNumber: 1,
      topic: "Exponent Laws and Simplification",
      question: "What is the simplified value of $\\left(\\frac{x^{-2} y^3}{x^3 y^{-2}}\\right)^{-1}$?",
      options: {
        A: "$\\frac{x^5}{y^5}$",
        B: "$\\frac{y^5}{x^5}$",
        C: "$x^5 y^5$",
        D: "$\\frac{x}{y}$"
      },
      correctAnswer: "A",
      explanation: "Inside the brackets: $\\frac{x^{-2} y^3}{x^3 y^{-2}} = x^{-2-3} y^{3-(-2)} = x^{-5} y^5$. Taking the power $-1$: $(x^{-5} y^5)^{-1} = x^{(-5)(-1)} y^{(5)(-1)} = x^5 y^{-5} = \\frac{x^5}{y^5}$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Logarithms": [
    {
      id: "fbise9_math_ch2_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Definition of Logarithm",
      question: "If $b^0 = 1$ for any non-zero base $b > 0$ ($b \\neq 1$), what is the value of $\\log_b 1$?",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$b$",
        D: "Undefined"
      },
      correctAnswer: "A",
      explanation: "By definition, $\\log_b y = x \\iff b^x = y$. Since $b^0 = 1$, it follows that $\\log_b 1 = 0$ for all valid bases $b$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Scientific Notation",
      question: "Express the decimal number $0.000407$ in standard scientific notation.",
      options: {
        A: "$4.07 \\times 10^{-4}$",
        B: "$4.07 \\times 10^{-3}$",
        C: "$40.7 \\times 10^{-5}$",
        D: "$4.07 \\times 10^4$"
      },
      correctAnswer: "A",
      explanation: "Moving the decimal point 4 places to the right to place it after the first non-zero digit gives $4.07 \\times 10^{-4}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Logarithm Base Identity",
      question: "What is the value of $\\log_7 7$?",
      options: {
        A: "$1$",
        B: "$0$",
        C: "$7$",
        D: "$49$"
      },
      correctAnswer: "A",
      explanation: "Since $7^1 = 7$, $\\log_7 7 = 1$. In general, $\\log_a a = 1$ for any base $a > 0, a \\neq 1$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Logarithmic Equation",
      question: "Find $x$ if $\\log_3 (2x - 1) = 3$.",
      options: {
        A: "$14$",
        B: "$13$",
        C: "$5$",
        D: "$10$"
      },
      correctAnswer: "A",
      explanation: "Converting to exponential form: $2x - 1 = 3^3 = 27 \\implies 2x = 27 + 1 = 28 \\implies x = 14$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Change of Base Formula",
      question: "What is the value of the product $(\\log_2 3)(\\log_3 4)(\\log_4 8)$?",
      options: {
        A: "$3$",
        B: "$2$",
        C: "$4$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Using change of base: $\\frac{\\log 3}{\\log 2} \\times \\frac{\\log 4}{\\log 3} \\times \\frac{\\log 8}{\\log 4} = \\frac{\\log 8}{\\log 2} = \\log_2 8 = \\log_2 (2^3) = 3$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Characteristic of Common Logarithm",
      question: "What is the characteristic of $\\log_{10} 0.0035$?",
      options: {
        A: "$\\bar{3}$ (or $-3$)",
        B: "$\\bar{2}$ (or $-2$)",
        C: "$-4$",
        D: "$3$"
      },
      correctAnswer: "A",
      explanation: "For a number less than $1$, the characteristic is negative and equals the number of zeros immediately following the decimal point plus one, written as $\\bar{n}$. Here, two zeros follow the decimal point, so the characteristic is $\\bar{3}$ (or $-3$).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Laws of Logarithms",
      question: "If $\\log 2 = 0.3010$ and $\\log 3 = 0.4771$, what is the value of $\\log 72$?",
      options: {
        A: "$1.8572$",
        B: "$1.7781$",
        C: "$2.1583$",
        D: "$1.5562$"
      },
      correctAnswer: "A",
      explanation: "$72 = 2^3 \\times 3^2$. $\\log 72 = \\log (2^3 \\times 3^2) = 3\\log 2 + 2\\log 3 = 3(0.3010) + 2(0.4771) = 0.9030 + 0.9542 = 1.8572$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Logarithmic Simplification",
      question: "Simplify into a single logarithm: $3\\log x - 2\\log y + \\frac{1}{2}\\log z$.",
      options: {
        A: "$\\log\\left(\\frac{x^3 \\sqrt{z}}{y^2}\\right)$",
        B: "$\\log\\left(\\frac{x^3 y^2}{\\sqrt{z}}\\right)$",
        C: "$\\log(x^3 - y^2 + \\sqrt{z})$",
        D: "$\\log\\left(\\frac{3x \\sqrt{z}}{2y}\\right)$"
      },
      correctAnswer: "A",
      explanation: "$3\\log x = \\log(x^3)$, $2\\log y = \\log(y^2)$, $\\frac{1}{2}\\log z = \\log(z^{1/2}) = \\log(\\sqrt{z})$. Combining terms: $\\log(x^3) - \\log(y^2) + \\log(\\sqrt{z}) = \\log\\left(\\frac{x^3 \\sqrt{z}}{y^2}\\right)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "Exponential-Logarithmic Identity",
      question: "What is the exact value of $a^{\\log_a x}$ for any $a > 0, a \\neq 1$ and $x > 0$?",
      options: {
        A: "$x$",
        B: "$a$",
        C: "$\\log_a x$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "By the fundamental inverse relationship between exponential and logarithmic functions, $a^{\\log_a x} = x$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch2_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Logarithms",
      chapterNumber: 2,
      topic: "System of Logarithmic Equations",
      question: "If $\\log_x 64 = \\frac{3}{2}$, what is the value of $x$?",
      options: {
        A: "$16$",
        B: "$8$",
        C: "$32$",
        D: "$64$"
      },
      correctAnswer: "A",
      explanation: "$x^{3/2} = 64$. Raise both sides to the power $\\frac{2}{3}$: $x = (64)^{2/3} = (4^3)^{2/3} = 4^2 = 16$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Sets and Relations": [
    {
      id: "fbise9_math_ch3_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Complement of Universal Set",
      question: "If $U$ is the universal set, what is $U'$ (the complement of $U$)?",
      options: {
        A: "$\\phi$ (Empty set)",
        B: "$U$",
        C: "$\\{0\\}$",
        D: "$\\{\\phi\\}$"
      },
      correctAnswer: "A",
      explanation: "The complement of the universal set $U$ is $U' = U \\setminus U = \\phi$ (the empty set).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Number of Subsets",
      question: "How many subsets does a set with $5$ distinct elements have?",
      options: {
        A: "$32$",
        B: "$25$",
        C: "$10$",
        D: "$64$"
      },
      correctAnswer: "A",
      explanation: "The total number of subsets of a set with $n$ elements is given by $2^n$. For $n = 5$, $2^5 = 32$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Identity Law of Sets",
      question: "For any set $A$, what is $A \\cap \\phi$?",
      options: {
        A: "$\\phi$",
        B: "$A$",
        C: "$U$",
        D: "$A'$"
      },
      correctAnswer: "A",
      explanation: "The intersection of any set $A$ with the empty set $\\phi$ contains no elements, so $A \\cap \\phi = \\phi$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "De Morgan's Second Law",
      question: "According to De Morgan's laws, $(A \\cap B)'$ is identically equal to:",
      options: {
        A: "$A' \\cup B'$",
        B: "$A' \\cap B'$",
        C: "$(A \\cup B)'$",
        D: "$A \\setminus B$"
      },
      correctAnswer: "A",
      explanation: "De Morgan's laws state: $(A \\cap B)' = A' \\cup B'$ and $(A \\cup B)' = A' \\cap B'$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Cartesian Product Cardinality",
      question: "If $n(A) = 4$ and $n(B) = 3$, how many binary relations can be formed on $A \\times B$?",
      options: {
        A: "$2^{12}$",
        B: "$12$",
        C: "$2^7$",
        D: "$24$"
      },
      correctAnswer: "A",
      explanation: "$n(A \\times B) = n(A) \\times n(B) = 4 \\times 3 = 12$. A binary relation is any subset of $A \\times B$. Since a set with $12$ elements has $2^{12}$ subsets, there are $2^{12} = 4096$ binary relations.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Domain and Range of Relation",
      question: "For the relation $R = \\{(1, 4), (2, 5), (3, 6), (4, 7)\\}$, what is the Range of $R$?",
      options: {
        A: "$\\{4, 5, 6, 7\\}$",
        B: "$\\{1, 2, 3, 4\\}$",
        C: "$\\{1, 4, 2, 5\\}$",
        D: "$\\{1, 2, 3, 4, 5, 6, 7\\}$"
      },
      correctAnswer: "A",
      explanation: "The Range of a binary relation is the set of all second elements of the ordered pairs: $\\text{Range}(R) = \\{4, 5, 6, 7\\}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Types of Functions",
      question: "A function $f: A \\to B$ is called a bijective function (one-to-one correspondence) if it is:",
      options: {
        A: "Both injective (one-to-one) and surjective (onto)",
        B: "Injective only",
        C: "Surjective only",
        D: "An into function"
      },
      correctAnswer: "A",
      explanation: "By definition, a bijective function is a mapping that is simultaneously one-to-one (injective) and onto (surjective), establishing a perfect pair-wise correspondence between sets $A$ and $B$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Symmetric Difference of Sets",
      question: "If $A = \\{1, 2, 3, 4\\}$ and $B = \\{3, 4, 5, 6\\}$, what is the symmetric difference $A \\Delta B$ (defined as $(A \\setminus B) \\cup (B \\setminus A)$)?",
      options: {
        A: "$\\{1, 2, 5, 6\\}$",
        B: "$\\{3, 4\\}$",
        C: "$\\{1, 2, 3, 4, 5, 6\\}$",
        D: "$\\{1, 2\\}$"
      },
      correctAnswer: "A",
      explanation: "$A \\setminus B = \\{1, 2\\}$ and $B \\setminus A = \\{5, 6\\}$. Their union is $A \\Delta B = \\{1, 2, 5, 6\\}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Disjoint Sets Property",
      question: "If $A$ and $B$ are two disjoint sets, what is $n(A \\cup B)$ in terms of $n(A)$ and $n(B)$?",
      options: {
        A: "$n(A) + n(B)$",
        B: "$n(A) + n(B) - n(A \\cap B)$",
        C: "$n(A) \\times n(B)$",
        D: "$0$"
      },
      correctAnswer: "A",
      explanation: "For any two sets, $n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$. When $A$ and $B$ are disjoint, $A \\cap B = \\phi \\implies n(A \\cap B) = 0$, so $n(A \\cup B) = n(A) + n(B)$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch3_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Sets and Relations",
      chapterNumber: 3,
      topic: "Inverse Relation",
      question: "If $R = \\{(x, y) \\in \\mathbb{N} \\times \\mathbb{N} : 2x + y = 10\\}$, what is $R^{-1}$?",
      options: {
        A: "$\\{(8, 1), (6, 2), (4, 3), (2, 4)\\}$",
        B: "$\\{(1, 8), (2, 6), (3, 4), (4, 2)\\}$",
        C: "$\\{(10, 0), (8, 1), (6, 2)\\}$",
        D: "$\\{(2, 1), (4, 2), (6, 3)\\}$"
      },
      correctAnswer: "A",
      explanation: "In $\\mathbb{N}$ ($x, y \\ge 1$): for $x=1, y=8$; $x=2, y=6$; $x=3, y=4$; $x=4, y=2$. So $R = \\{(1, 8), (2, 6), (3, 4), (4, 2)\\}$. The inverse relation $R^{-1}$ reverses each pair: $R^{-1} = \\{(8, 1), (6, 2), (4, 3), (2, 4)\\}$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Factorization and Algebraic Manipulation": [
    {
      id: "fbise9_math_ch4_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Difference of Squares Formula",
      question: "What are the factors of $49x^2 - 64y^2$?",
      options: {
        A: "$(7x - 8y)(7x + 8y)$",
        B: "$(7x - 8y)^2$",
        C: "$(49x - 64y)(x + y)$",
        D: "$(7x + 8y)^2$"
      },
      correctAnswer: "A",
      explanation: "Using the formula $a^2 - b^2 = (a - b)(a + b)$ with $a = 7x$ and $b = 8y$: $(7x)^2 - (8y)^2 = (7x - 8y)(7x + 8y)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Sum of Cubes Formula",
      question: "What is the factorized form of $a^3 + 8$?",
      options: {
        A: "$(a + 2)(a^2 - 2a + 4)$",
        B: "$(a + 2)(a^2 + 2a + 4)$",
        C: "$(a - 2)(a^2 + 2a + 4)$",
        D: "$(a + 2)^3$"
      },
      correctAnswer: "A",
      explanation: "Using $a^3 + b^3 = (a + b)(a^2 - ab + b^2)$ where $b = 2$: $a^3 + 2^3 = (a + 2)(a^2 - 2a + 4)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Algebraic Identity",
      question: "If $x + \\frac{1}{x} = 4$, what is the value of $x^2 + \\frac{1}{x^2}$?",
      options: {
        A: "$14$",
        B: "$16$",
        C: "$18$",
        D: "$12$"
      },
      correctAnswer: "A",
      explanation: "Squaring both sides: $\\left(x + \\frac{1}{x}\\right)^2 = x^2 + 2 + \\frac{1}{x^2} = 4^2 = 16 \\implies x^2 + \\frac{1}{x^2} = 16 - 2 = 14$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Remainder Theorem",
      question: "What is the remainder when $P(x) = 2x^3 - 3x^2 + 4x - 5$ is divided by $(x - 2)$?",
      options: {
        A: "$7$",
        B: "$3$",
        C: "$-1$",
        D: "$11$"
      },
      correctAnswer: "A",
      explanation: "By the Remainder Theorem, $R = P(2) = 2(2)^3 - 3(2)^2 + 4(2) - 5 = 2(8) - 3(4) + 8 - 5 = 16 - 12 + 8 - 5 = 7$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF of Algebraic Expressions",
      question: "What is the HCF of $12x^2 y^3 z$ and $18x^3 y z^2$?",
      options: {
        A: "$6x^2 y z$",
        B: "$36x^3 y^3 z^2$",
        C: "$6x^3 y^3 z^2$",
        D: "$12x^2 y z$"
      },
      correctAnswer: "A",
      explanation: "$\\gcd(12, 18) = 6$. For variable powers, take the minimum exponents: $x^{\\min(2, 3)} = x^2$, $y^{\\min(3, 1)} = y$, $z^{\\min(1, 2)} = z$. Hence $\\text{HCF} = 6x^2 y z$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Trinomial Factorization",
      question: "Factorize completely: $6x^2 + 7x - 5$.",
      options: {
        A: "$(2x - 1)(3x + 5)$",
        B: "$(2x + 1)(3x - 5)$",
        C: "$(6x - 5)(x + 1)$",
        D: "$(3x - 1)(2x + 5)$"
      },
      correctAnswer: "A",
      explanation: "Product $= 6 \\times (-5) = -30$, Sum $= 7$. Splitting middle term as $10x - 3x$: $6x^2 + 10x - 3x - 5 = 2x(3x + 5) - 1(3x + 5) = (2x - 1)(3x + 5)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Factor Theorem Application",
      question: "If $(x + 3)$ is a factor of $x^3 + kx^2 - x + 6$, what is the value of $k$?",
      options: {
        A: "$2$",
        B: "$-2$",
        C: "$3$",
        D: "$-3$"
      },
      correctAnswer: "A",
      explanation: "Since $(x + 3)$ is a factor, $P(-3) = 0$: $(-3)^3 + k(-3)^2 - (-3) + 6 = 0 \\implies -27 + 9k + 3 + 6 = 0 \\implies 9k - 18 = 0 \\implies 9k = 18 \\implies k = 2$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Square Root of Algebraic Expression",
      question: "What is the square root of the perfect square trinomial $4x^2 - 12xy + 9y^2$?",
      options: {
        A: "$\\pm(2x - 3y)$",
        B: "$2x + 3y$",
        C: "$4x - 9y$",
        D: "$\\pm(4x - 3y)$"
      },
      correctAnswer: "A",
      explanation: "$4x^2 - 12xy + 9y^2 = (2x)^2 - 2(2x)(3y) + (3y)^2 = (2x - 3y)^2$. The square root is $\\pm(2x - 3y)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "HCF-LCM Relationship",
      question: "The HCF and LCM of two polynomials are $(x + 2)$ and $(x^3 - 4x)$ respectively. If one polynomial is $(x^2 + 2x)$, what is the other polynomial?",
      options: {
        A: "$x^2 - 4$",
        B: "$x^2 - 2x$",
        C: "$x^2 + 4$",
        D: "$x - 2$"
      },
      correctAnswer: "A",
      explanation: "Using $P(x) \\times Q(x) = \\text{HCF} \\times \\text{LCM}$: $Q(x) = \\frac{\\text{HCF} \\times \\text{LCM}}{P(x)} = \\frac{(x + 2) \\cdot x(x^2 - 4)}{x(x + 2)} = x^2 - 4$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch4_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Factorization and Algebraic Manipulation",
      chapterNumber: 4,
      topic: "Conditional Identity",
      question: "If $a + b + c = 0$, what is the simplified value of $a^3 + b^3 + c^3$?",
      options: {
        A: "$3abc$",
        B: "$0$",
        C: "$-3abc$",
        D: "$a^2 + b^2 + c^2$"
      },
      correctAnswer: "A",
      explanation: "From the identity $a^3 + b^3 + c^3 - 3abc = (a + b + c)(a^2 + b^2 + c^2 - ab - bc - ca)$, when $a + b + c = 0$, the right-hand side vanishes, giving $a^3 + b^3 + c^3 = 3abc$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Linear Equations and Inequalities": [
    {
      id: "fbise9_math_ch5_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Degree of Linear Equation",
      question: "A linear equation in one variable has a degree of:",
      options: {
        A: "$1$",
        B: "$0$",
        C: "$2$",
        D: "Any integer"
      },
      correctAnswer: "A",
      explanation: "A linear equation is defined as an algebraic equation in which the highest exponent of the variable is $1$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Solving Simple Linear Equation",
      question: "Solve for $x$: $3(x - 2) = 15$.",
      options: {
        A: "$7$",
        B: "$5$",
        C: "$3$",
        D: "$9$"
      },
      correctAnswer: "A",
      explanation: "$x - 2 = \\frac{15}{3} = 5 \\implies x = 5 + 2 = 7$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Absolute Value Property",
      question: "What is the solution set of the equation $|x - 5| = -3$?",
      options: {
        A: "$\\phi$ (No solution)",
        B: "$\\{2, 8\\}$",
        C: "$\\{2\\}$",
        D: "$\\{8\\}$"
      },
      correctAnswer: "A",
      explanation: "The absolute value of any real number is always non-negative ($|u| \\ge 0$). It can never equal a negative number ($-3$). Thus, the solution set is empty, $\\phi$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Solving Linear Inequality",
      question: "Solve the inequality: $5 - 3x \\le 14$.",
      options: {
        A: "$x \\ge -3$",
        B: "$x \\le -3$",
        C: "$x \\ge 3$",
        D: "$x \\le 3$"
      },
      correctAnswer: "A",
      explanation: "Subtract $5$: $-3x \\le 14 - 5 \\implies -3x \\le 9$. Dividing by negative $3$ reverses the inequality: $x \\ge \\frac{9}{-3} \\implies x \\ge -3$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Solving Absolute Value Equation",
      question: "Find the solution set of $|2x + 3| = 9$.",
      options: {
        A: "$\\{3, -6\\}$",
        B: "$\\{3, 6\\}$",
        C: "$\\{-3, -6\\}$",
        D: "$\\{6, -9\\}$"
      },
      correctAnswer: "A",
      explanation: "Case 1: $2x + 3 = 9 \\implies 2x = 6 \\implies x = 3$. Case 2: $2x + 3 = -9 \\implies 2x = -12 \\implies x = -6$. Solution set is $\\{3, -6\\}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Fractional Linear Equation",
      question: "Solve for $x$: $\\frac{x}{2} - \\frac{x}{3} = 4$.",
      options: {
        A: "$24$",
        B: "$12$",
        C: "$6$",
        D: "$18$"
      },
      correctAnswer: "A",
      explanation: "Multiply the entire equation by $\\text{LCM}(2, 3) = 6$: $6\\left(\\frac{x}{2}\\right) - 6\\left(\\frac{x}{3}\\right) = 6(4) \\implies 3x - 2x = 24 \\implies x = 24$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Double Inequality",
      question: "What is the solution set of the compound inequality $-5 < 2x + 1 \\le 7$?",
      options: {
        A: "$-3 < x \\le 3$",
        B: "$-2 < x \\le 4$",
        C: "$-3 \\le x < 3$",
        D: "$-4 < x \\le 3$"
      },
      correctAnswer: "A",
      explanation: "Subtract $1$ from all parts: $-5 - 1 < 2x \\le 7 - 1 \\implies -6 < 2x \\le 6$. Divide by $2$: $-3 < x \\le 3$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Extraneous Roots in Radical Equations",
      question: "When solving $\\sqrt{2x + 7} = x - 4$, what is the genuine solution for $x$?",
      options: {
        A: "$9$ only",
        B: "$1$ and $9$",
        C: "$1$ only",
        D: "No real solution"
      },
      correctAnswer: "A",
      explanation: "Squaring both sides: $2x + 7 = (x - 4)^2 = x^2 - 8x + 16 \\implies x^2 - 10x + 9 = 0 \\implies (x - 9)(x - 1) = 0 \\implies x = 9$ or $x = 1$. Checking $x=1$: $\\sqrt{2(1)+7} = 3$, but $1 - 4 = -3 \\neq 3$ (extraneous). Checking $x=9$: $\\sqrt{18+7} = 5$ and $9 - 4 = 5$ (valid). Thus $x = 9$ only.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Absolute Value Inequality",
      question: "What is the solution set of $|3x - 2| < 7$?",
      options: {
        A: "$-\\frac{5}{3} < x < 3$",
        B: "$x < 3$",
        C: "$x > -\\frac{5}{3}$",
        D: "$x < -\\frac{5}{3} \\text{ or } x > 3$"
      },
      correctAnswer: "A",
      explanation: "$|3x - 2| < 7 \\iff -7 < 3x - 2 < 7$. Add $2$: $-5 < 3x < 9$. Divide by $3$: $-\\frac{5}{3} < x < 3$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch5_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Linear Equations and Inequalities",
      chapterNumber: 5,
      topic: "Linear Inequality Properties",
      question: "If $a < b$ and $c < 0$, which of the following statements is mathematically TRUE?",
      options: {
        A: "$ac > bc$",
        B: "$ac < bc$",
        C: "$\\frac{a}{c} < \\frac{b}{c}$",
        D: "$a + c > b + c$"
      },
      correctAnswer: "A",
      explanation: "Multiplying (or dividing) both sides of an inequality by a strictly negative number ($c < 0$) reverses the inequality sign: $a < b \\implies ac > bc$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Trigonometry and Bearing": [
    {
      id: "fbise9_math_ch6_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Reciprocal Trigonometric Ratio",
      question: "Which trigonometric function is the exact reciprocal of $\\cos \\theta$?",
      options: {
        A: "$\\sec \\theta$",
        B: "$\\csc \\theta$",
        C: "$\\tan \\theta$",
        D: "$\\cot \\theta$"
      },
      correctAnswer: "A",
      explanation: "By definition of reciprocal trigonometric ratios, $\\sec \\theta = \\frac{1}{\\cos \\theta}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Special Angle Evaluation",
      question: "What is the value of $\\sin 45^\\circ$?",
      options: {
        A: "$\\frac{1}{\\sqrt{2}}$",
        B: "$\\frac{\\sqrt{3}}{2}$",
        C: "$\\frac{1}{2}$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "In an isosceles right-angled triangle with sides $1, 1, \\sqrt{2}$, $\\sin 45^\\circ = \\frac{\\text{opposite}}{\\text{hypotenuse}} = \\frac{1}{\\sqrt{2}}$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Three-figure Bearing Definition",
      question: "What is the three-figure bearing of due South?",
      options: {
        A: "$180^\\circ$",
        B: "$090^\\circ$",
        C: "$270^\\circ$",
        D: "$360^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Bearings are measured clockwise from North ($000^\\circ$). East is $090^\\circ$, South is $180^\\circ$, and West is $270^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Fundamental Identity Evaluation",
      question: "What is the simplified value of $\\sec^2 \\theta - \\tan^2 \\theta$?",
      options: {
        A: "$1$",
        B: "$0$",
        C: "$-1$",
        D: "$\\sin^2 \\theta$"
      },
      correctAnswer: "A",
      explanation: "From the fundamental Pythagorean identity $1 + \\tan^2 \\theta = \\sec^2 \\theta$, rearranging gives $\\sec^2 \\theta - \\tan^2 \\theta = 1$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Right-Angled Triangle Solving",
      question: "In right $\\triangle ABC$ with $\\angle C = 90^\\circ$, if $\\tan A = \\frac{3}{4}$, what is the value of $\\sin A + \\cos A$?",
      options: {
        A: "$\\frac{7}{5}$",
        B: "$\\frac{5}{7}$",
        C: "$\\frac{1}{5}$",
        D: "$\\frac{12}{25}$"
      },
      correctAnswer: "A",
      explanation: "$\\tan A = \\frac{3}{4} \\implies \\text{opp} = 3, \\text{adj} = 4, \\text{hyp} = \\sqrt{3^2 + 4^2} = 5$. Thus $\\sin A = \\frac{3}{5}$ and $\\cos A = \\frac{4}{5}$. Their sum is $\\frac{3}{5} + \\frac{4}{5} = \\frac{7}{5}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Angle of Elevation Application",
      question: "A vertical pole casts a shadow of length $10\\sqrt{3}\\text{ m}$ on the ground when the sun's angle of elevation is $30^\\circ$. What is the height of the pole?",
      options: {
        A: "$10\\text{ m}$",
        B: "$30\\text{ m}$",
        C: "$20\\text{ m}$",
        D: "$15\\text{ m}$"
      },
      correctAnswer: "A",
      explanation: "$\\tan 30^\\circ = \\frac{\\text{Height}}{\\text{Shadow}} \\implies \\frac{1}{\\sqrt{3}} = \\frac{h}{10\\sqrt{3}} \\implies h = \\frac{10\\sqrt{3}}{\\sqrt{3}} = 10\\text{ m}$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Back Bearing Calculation",
      question: "If the forward bearing of point $B$ from point $A$ is $240^\\circ$, what is the back bearing of point $A$ from point $B$?",
      options: {
        A: "$060^\\circ$",
        B: "$120^\\circ$",
        C: "$300^\\circ$",
        D: "$080^\\circ$"
      },
      correctAnswer: "A",
      explanation: "When forward bearing $\\theta > 180^\\circ$, the back bearing is $\\theta - 180^\\circ = 240^\\circ - 180^\\circ = 060^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric Identity Proof",
      question: "What is the simplified form of $\\frac{1}{1 + \\sin \\theta} + \\frac{1}{1 - \\sin \\theta}$?",
      options: {
        A: "$2\\sec^2 \\theta$",
        B: "$2\\csc^2 \\theta$",
        C: "$2\\tan^2 \\theta$",
        D: "$2\\cos^2 \\theta$"
      },
      correctAnswer: "A",
      explanation: "Combining over common denominator: $\\frac{(1 - \\sin \\theta) + (1 + \\sin \\theta)}{(1 + \\sin \\theta)(1 - \\sin \\theta)} = \\frac{2}{1 - \\sin^2 \\theta} = \\frac{2}{\\cos^2 \\theta} = 2\\sec^2 \\theta$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Special Angle Arithmetic",
      question: "What is the exact value of $2\\sin 30^\\circ \\cos 30^\\circ$?",
      options: {
        A: "$\\frac{\\sqrt{3}}{2}$",
        B: "$\\frac{1}{2}$",
        C: "$1$",
        D: "$\\frac{\\sqrt{3}}{4}$"
      },
      correctAnswer: "A",
      explanation: "$2\\sin 30^\\circ \\cos 30^\\circ = 2\\left(\\frac{1}{2}\\right)\\left(\\frac{\\sqrt{3}}{2}\\right) = \\frac{\\sqrt{3}}{2}$ (which is also equal to $\\sin 60^\\circ$).",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch6_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Trigonometry and Bearing",
      chapterNumber: 6,
      topic: "Trigonometric Product Simplification",
      question: "What is the value of $(1 - \\cos \\theta)(1 + \\cos \\theta)(1 + \\cot^2 \\theta)$?",
      options: {
        A: "$1$",
        B: "$\\sin^2 \\theta$",
        C: "$\\cos^2 \\theta$",
        D: "$\\tan^2 \\theta$"
      },
      correctAnswer: "A",
      explanation: "$(1 - \\cos \\theta)(1 + \\cos \\theta) = 1 - \\cos^2 \\theta = \\sin^2 \\theta$. Also, $1 + \\cot^2 \\theta = \\csc^2 \\theta = \\frac{1}{\\sin^2 \\theta}$. Multiplying: $\\sin^2 \\theta \\times \\frac{1}{\\sin^2 \\theta} = 1$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ]
};
