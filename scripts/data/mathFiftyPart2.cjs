/**
 * mathFiftyPart2.cjs
 * 
 * 50 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 7 to 11, 10 each)
 * Strict append batch (Questions 41 to 50 for each chapter)
 * 
 * Chapters covered:
 * 7. Coordinate Geometry (10 MCQs: 41-50)
 * 8. Geometry of Straight Lines (10 MCQs: 41-50)
 * 9. Geometry and Polygons (10 MCQs: 41-50)
 * 10. Practical Geometry (10 MCQs: 41-50)
 * 11. Basic Statistics (10 MCQs: 41-50)
 */

module.exports = {
  "Coordinate Geometry": [
    {
      id: "fbise9_math_ch7_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Point on Axis",
      question: "Any point lying on the $y$-axis has an abscissa ($x$-coordinate) of:",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$-1$",
        D: "Any real number"
      },
      correctAnswer: "A",
      explanation: "Every point on the $y$-axis has an $x$-coordinate (abscissa) equal to $0$, taking the general form $(0, y)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance from Origin",
      question: "What is the distance of the point $P(-6, 8)$ from the origin $(0, 0)$?",
      options: {
        A: "$10$ units",
        B: "$14$ units",
        C: "$2$ units",
        D: "$\\sqrt{28}$ units"
      },
      correctAnswer: "A",
      explanation: "Distance from origin is $d = \\sqrt{x^2 + y^2} = \\sqrt{(-6)^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$ units.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Quadrants of Cartesian Plane",
      question: "In which quadrant does the point $K(4, -9)$ lie?",
      options: {
        A: "Quadrant IV",
        B: "Quadrant II",
        C: "Quadrant III",
        D: "Quadrant I"
      },
      correctAnswer: "A",
      explanation: "In Quadrant IV, the abscissa is positive ($x > 0$) and the ordinate is negative ($y < 0$).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Midpoint Endpoint Finding",
      question: "If the midpoint of segment $AB$ is $M(3, 4)$ and $A$ is $(1, 2)$, what are the coordinates of point $B$?",
      options: {
        A: "$(5, 6)$",
        B: "$(2, 3)$",
        C: "$(4, 6)$",
        D: "$(5, 8)$"
      },
      correctAnswer: "A",
      explanation: "$\\frac{1 + x_B}{2} = 3 \\implies 1 + x_B = 6 \\implies x_B = 5$. $\\frac{2 + y_B}{2} = 4 \\implies 2 + y_B = 8 \\implies y_B = 6$. So $B = (5, 6)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance Formula Application",
      question: "If the distance between points $(x, 2)$ and $(3, 6)$ is $5$ units, what are the possible values of $x$?",
      options: {
        A: "$6$ or $0$",
        B: "$8$ or $-2$",
        C: "$7$ or $-1$",
        D: "$5$ or $1$"
      },
      correctAnswer: "A",
      explanation: "$(x - 3)^2 + (2 - 6)^2 = 5^2 \\implies (x - 3)^2 + 16 = 25 \\implies (x - 3)^2 = 9 \\implies x - 3 = \\pm 3 \\implies x = 6$ or $x = 0$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Right-Angled Triangle Verification",
      question: "The vertices $A(0, 0)$, $B(3, 0)$, and $C(0, 4)$ form a triangle. What is the length of its hypotenuse?",
      options: {
        A: "$5$ units",
        B: "$7$ units",
        C: "$25$ units",
        D: "$\\sqrt{7}$ units"
      },
      correctAnswer: "A",
      explanation: "$AB = 3$ along the $x$-axis, $AC = 4$ along the $y$-axis. The hypotenuse $BC = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = 5$ units.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Centroid of a Triangle",
      question: "What are the coordinates of the centroid of $\\triangle ABC$ with vertices $A(2, 4)$, $B(5, -2)$, and $C(-1, 7)$?",
      options: {
        A: "$(2, 3)$",
        B: "$(3, 3)$",
        C: "$(2, 4.5)$",
        D: "$(6, 9)$"
      },
      correctAnswer: "A",
      explanation: "Centroid $G = \\left(\\frac{x_1 + x_2 + x_3}{3}, \\frac{y_1 + y_2 + y_3}{3}\\right) = \\left(\\frac{2 + 5 + (-1)}{3}, \\frac{4 + (-2) + 7}{3}\\right) = \\left(\\frac{6}{3}, \\frac{9}{3}\\right) = (2, 3)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Square in Coordinate Plane",
      question: "The diagonal of a square with vertices $(0, 0)$, $(a, 0)$, $(a, a)$, and $(0, a)$ has a length of:",
      options: {
        A: "$\\sqrt{2}a$",
        B: "$2a$",
        C: "$a^2$",
        D: "$\\frac{a}{\\sqrt{2}}$"
      },
      correctAnswer: "A",
      explanation: "The diagonal connects $(0, 0)$ to $(a, a)$: $d = \\sqrt{(a - 0)^2 + (a - 0)^2} = \\sqrt{a^2 + a^2} = \\sqrt{2a^2} = \\sqrt{2}a$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Collinearity Condition",
      question: "Three points $P(x_1, y_1)$, $Q(x_2, y_2)$, and $R(x_3, y_3)$ are collinear if the distance between the two farthest points is:",
      options: {
        A: "Exactly equal to the sum of the distances to the intermediate point",
        B: "Strictly greater than the sum of the two smaller distances",
        C: "Equal to the product of the two smaller distances",
        D: "Zero"
      },
      correctAnswer: "A",
      explanation: "By the Triangle Inequality, three distinct points lie on a single straight line (collinear) if and only if $PQ + QR = PR$ (where $Q$ lies between $P$ and $R$).",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch7_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Perpendicular Bisector Equation Concept",
      question: "The locus of points equidistant from $A(2, 0)$ and $B(6, 0)$ is a vertical line with the equation:",
      options: {
        A: "$x = 4$",
        B: "$y = 4$",
        C: "$x = 3$",
        D: "$x + y = 4$"
      },
      correctAnswer: "A",
      explanation: "The locus of points equidistant from two points is their perpendicular bisector. The midpoint of $AB$ is $\\left(\\frac{2+6}{2}, 0\\right) = (4, 0)$. Since $AB$ lies on the horizontal $x$-axis, the perpendicular bisector is the vertical line $x = 4$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Geometry of Straight Lines": [
    {
      id: "fbise9_math_ch8_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Straight Angle Measure",
      question: "What is the measure of a straight angle?",
      options: {
        A: "$180^\\circ$",
        B: "$90^\\circ$",
        C: "$360^\\circ$",
        D: "$270^\\circ$"
      },
      correctAnswer: "A",
      explanation: "A straight angle is an angle whose rays point in exact opposite directions, forming a straight line of measure $180^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Supplementary Angles",
      question: "If an angle is $112^\\circ$, what is the measure of its supplement?",
      options: {
        A: "$68^\\circ$",
        B: "$78^\\circ$",
        C: "$22^\\circ$",
        D: "$168^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Supplementary angles sum to $180^\\circ$. The supplement of $112^\\circ$ is $180^\\circ - 112^\\circ = 68^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Reflex Angle Definition",
      question: "An angle measuring $215^\\circ$ is classified as a:",
      options: {
        A: "Reflex angle",
        B: "Obtuse angle",
        C: "Acute angle",
        D: "Straight angle"
      },
      correctAnswer: "A",
      explanation: "A reflex angle is any angle whose measure is strictly greater than $180^\\circ$ and less than $360^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Parallel Lines and Corresponding Angles",
      question: "If two parallel lines are cut by a transversal, corresponding angles are:",
      options: {
        A: "Equal in measure",
        B: "Supplementary",
        C: "Complementary",
        D: "Reflex angles"
      },
      correctAnswer: "A",
      explanation: "By the Corresponding Angles Postulate, when two parallel lines are cut by a transversal, each pair of corresponding angles is equal.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Isosceles Triangle Base Angles",
      question: "In $\\triangle ABC$, $AB = AC$. If the vertex angle $\\angle A = 50^\\circ$, what is the measure of base angle $\\angle B$?",
      options: {
        A: "$65^\\circ$",
        B: "$130^\\circ$",
        C: "$50^\\circ$",
        D: "$60^\\circ$"
      },
      correctAnswer: "A",
      explanation: "The base angles of an isosceles triangle are equal: $\\angle B = \\angle C = \\frac{180^\\circ - 50^\\circ}{2} = \\frac{130^\\circ}{2} = 65^\\circ$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Angle Relationships around a Point",
      question: "Four angles around a single point are $x^\\circ$, $(2x)^\\circ$, $(3x)^\\circ$, and $120^\\circ$. What is the value of $x$?",
      options: {
        A: "$40$",
        B: "$30$",
        C: "$60$",
        D: "$45$"
      },
      correctAnswer: "A",
      explanation: "The sum of all angles meeting at a single point is $360^\\circ$: $x + 2x + 3x + 120 = 360 \\implies 6x = 240 \\implies x = 40$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Triangle Angle Ratio",
      question: "The interior angles of a triangle are in the ratio $2 : 3 : 4$. What is the measure of the smallest angle?",
      options: {
        A: "$40^\\circ$",
        B: "$20^\\circ$",
        C: "$60^\\circ$",
        D: "$80^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Let the angles be $2k, 3k, 4k$. Then $2k + 3k + 4k = 180^\\circ \\implies 9k = 180^\\circ \\implies k = 20^\\circ$. The smallest angle is $2k = 2(20^\\circ) = 40^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Perpendicular Bisector Theorem",
      question: "Any point on the right bisector of a line segment is:",
      options: {
        A: "Equidistant from the end points of the line segment",
        B: "Twice as far from one endpoint as the other",
        C: "Equidistant from the midpoint only",
        D: "Collinear with the line segment"
      },
      correctAnswer: "A",
      explanation: "By fundamental geometric theorem, any point lying on the perpendicular (right) bisector of a line segment is equidistant from its two endpoints.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Exterior Angle Inequality",
      question: "An exterior angle of a triangle is always strictly greater than:",
      options: {
        A: "Either of its interior opposite angles",
        B: "The sum of its interior opposite angles",
        C: "Its adjacent interior angle",
        D: "$180^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Since the exterior angle equals the sum of both non-adjacent interior angles, it is strictly greater in measure than either individual interior opposite angle.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch8_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Parallel Line Angle Bisectors",
      question: "If two parallel lines are cut by a transversal, the bisectors of the interior angles on the same side of the transversal intersect at an angle of:",
      options: {
        A: "$90^\\circ$",
        B: "$180^\\circ$",
        C: "$60^\\circ$",
        D: "$45^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Consecutive interior angles $\\alpha + \\beta = 180^\\circ$. The angle between their bisectors is $180^\\circ - (\\frac{\\alpha}{2} + \\frac{\\beta}{2}) = 180^\\circ - 90^\\circ = 90^\\circ$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Geometry and Polygons": [
    {
      id: "fbise9_math_ch9_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Interior Angle Sum of Pentagon",
      question: "What is the sum of the interior angles of a pentagon (5 sides)?",
      options: {
        A: "$540^\\circ$",
        B: "$360^\\circ$",
        C: "$720^\\circ$",
        D: "$900^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Sum of interior angles $= (n - 2) \\times 180^\\circ = (5 - 2) \\times 180^\\circ = 3 \\times 180^\\circ = 540^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Exterior Angle of Regular Hexagon",
      question: "What is the measure of each exterior angle of a regular hexagon (6 sides)?",
      options: {
        A: "$60^\\circ$",
        B: "$120^\\circ$",
        C: "$45^\\circ$",
        D: "$72^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Each exterior angle of a regular $n$-gon is $\\frac{360^\\circ}{n} = \\frac{360^\\circ}{6} = 60^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Quadrilateral Angles Sum",
      question: "Three angles of a quadrilateral are $85^\\circ$, $95^\\circ$, and $110^\\circ$. What is the fourth angle?",
      options: {
        A: "$70^\\circ$",
        B: "$80^\\circ$",
        C: "$60^\\circ$",
        D: "$75^\\circ$"
      },
      correctAnswer: "A",
      explanation: "The angles of a quadrilateral sum to $360^\\circ$: $360^\\circ - (85^\\circ + 95^\\circ + 110^\\circ) = 360^\\circ - 290^\\circ = 70^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Number of Sides from Exterior Angle",
      question: "If each exterior angle of a regular polygon is $24^\\circ$, how many sides does the polygon have?",
      options: {
        A: "$15$",
        B: "$12$",
        C: "$18$",
        D: "$20$"
      },
      correctAnswer: "A",
      explanation: "$n = \\frac{360^\\circ}{\\text{exterior angle}} = \\frac{360^\\circ}{24^\\circ} = 15$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Diagonals of a Hexagon",
      question: "How many diagonals does a regular hexagon have?",
      options: {
        A: "$9$",
        B: "$6$",
        C: "$12$",
        D: "$15$"
      },
      correctAnswer: "A",
      explanation: "Number of diagonals in an $n$-gon is $\\frac{n(n - 3)}{2}$. For $n = 6$: $\\frac{6(6 - 3)}{2} = \\frac{6 \\times 3}{2} = 9$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Rectangle Diagonals Property",
      question: "In any rectangle, the diagonals are always:",
      options: {
        A: "Equal in length and bisect each other",
        B: "Perpendicular and unequal",
        C: "Perpendicular bisectors of each other",
        D: "Unequal and parallel"
      },
      correctAnswer: "A",
      explanation: "By geometric properties, the diagonals of a rectangle are congruent (equal in length) and mutually bisect each other.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Kite Properties",
      question: "In a kite, which of the following is TRUE regarding its diagonals?",
      options: {
        A: "The diagonals are perpendicular, and one diagonal bisects the other",
        B: "Both diagonals are equal in length",
        C: "Both diagonals bisect each other",
        D: "The diagonals are parallel"
      },
      correctAnswer: "A",
      explanation: "In a kite, the diagonals intersect at right angles ($90^\\circ$), and the main axis of symmetry bisects the other diagonal.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Interior Angle to Exterior Angle Ratio",
      question: "In a regular polygon, the ratio of an interior angle to an exterior angle is $7 : 2$. How many sides does it have?",
      options: {
        A: "$9$",
        B: "$8$",
        C: "$10$",
        D: "$12$"
      },
      correctAnswer: "A",
      explanation: "Interior angle $I = 7k$, exterior angle $E = 2k$. Since $I + E = 180^\\circ$, $9k = 180^\\circ \\implies k = 20^\\circ$. Thus $E = 2(20^\\circ) = 40^\\circ$. Number of sides $n = \\frac{360^\\circ}{40^\\circ} = 9$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Varignon's Theorem",
      question: "Joining the midpoints of the consecutive sides of any arbitrary quadrilateral always forms a:",
      options: {
        A: "Parallelogram",
        B: "Rhombus",
        C: "Rectangle",
        D: "Square"
      },
      correctAnswer: "A",
      explanation: "By Varignon's Theorem, the figure formed by connecting the midpoints of the sides of any quadrilateral in order is always a parallelogram.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch9_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Rhombus Area from Diagonals",
      question: "If the diagonals of a rhombus have lengths $d_1 = 14\\text{ cm}$ and $d_2 = 10\\text{ cm}$, what is its area?",
      options: {
        A: "$70\\text{ cm}^2$",
        B: "$140\\text{ cm}^2$",
        C: "$35\\text{ cm}^2$",
        D: "$48\\text{ cm}^2$"
      },
      correctAnswer: "A",
      explanation: "Area of a rhombus $= \\frac{1}{2} \\times d_1 \\times d_2 = \\frac{1}{2} \\times 14 \\times 10 = 70\\text{ cm}^2$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Practical Geometry": [
    {
      id: "fbise9_math_ch10_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Definition of Altitude",
      question: "The perpendicular segment dropped from a vertex of a triangle to its opposite side is called an:",
      options: {
        A: "Altitude",
        B: "Median",
        C: "Angle bisector",
        D: "Right bisector"
      },
      correctAnswer: "A",
      explanation: "An altitude of a triangle is the perpendicular line segment drawn from a vertex to the line containing the opposite side.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Definition of Median",
      question: "A line segment joining a vertex of a triangle to the midpoint of the opposite side is called a:",
      options: {
        A: "Median",
        B: "Altitude",
        C: "Perpendicular bisector",
        D: "Secant"
      },
      correctAnswer: "A",
      explanation: "A median of a triangle is a line segment connecting any vertex to the midpoint of the opposite side.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Circumscribed Circle Definition",
      question: "A circle passing through all three vertices of a triangle is called its:",
      options: {
        A: "Circumcircle",
        B: "Incircle",
        C: "Excircle",
        D: "Concentric circle"
      },
      correctAnswer: "A",
      explanation: "A circumscribed circle (circumcircle) is the unique circle that passes through all three vertices of a triangle.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Centroid Properties",
      question: "The centroid of a triangle divides each median internally in the ratio:",
      options: {
        A: "$2 : 1$ from the vertex",
        B: "$1 : 1$",
        C: "$3 : 1$ from the vertex",
        D: "$1 : 2$ from the vertex"
      },
      correctAnswer: "A",
      explanation: "The centroid ($G$) divides every median into two segments such that the segment from the vertex to the centroid is twice the length of the segment from the centroid to the midpoint ($2 : 1$).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Orthocenter of Right Triangle",
      question: "Where is the orthocenter of a right-angled triangle located?",
      options: {
        A: "At the vertex containing the right angle ($90^\\circ$)",
        B: "At the midpoint of the hypotenuse",
        C: "Inside the triangle",
        D: "Outside the triangle"
      },
      correctAnswer: "A",
      explanation: "In a right triangle, the legs serve as two of the altitudes, meeting at the right-angled vertex. Hence the orthocenter coincides with the right-angled vertex.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Triangle Construction Data",
      question: "To construct a unique triangle, how many independent geometric measures (sides/angles) are minimally required?",
      options: {
        A: "$3$",
        B: "$2$",
        C: "$4$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "A triangle is uniquely determined by $3$ independent elements (such as SSS, SAS, ASA, or RHS criteria).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Incenter Equidistance Property",
      question: "The incenter of a triangle is always equidistant from its:",
      options: {
        A: "Three sides",
        B: "Three vertices",
        C: "Three medians",
        D: "Three altitudes"
      },
      correctAnswer: "A",
      explanation: "Because the incenter is the intersection of angle bisectors, its perpendicular distance to all three sides is equal to the inradius $r$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Circumradius of Right Triangle",
      question: "In a right-angled triangle with legs $6\\text{ cm}$ and $8\\text{ cm}$, what is the circumradius $R$?",
      options: {
        A: "$5\\text{ cm}$",
        B: "$10\\text{ cm}$",
        C: "$4.8\\text{ cm}$",
        D: "$2.5\\text{ cm}$"
      },
      correctAnswer: "A",
      explanation: "The hypotenuse is $\\sqrt{6^2 + 8^2} = 10\\text{ cm}$. The circumcenter is at the midpoint of the hypotenuse, so $R = \\frac{\\text{hypotenuse}}{2} = \\frac{10}{2} = 5\\text{ cm}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Excenter Construction",
      question: "An excenter of a triangle is formed by the intersection of:",
      options: {
        A: "One internal angle bisector and two external angle bisectors",
        B: "Three external angle bisectors",
        C: "Three internal angle bisectors",
        D: "Two altitudes and one median"
      },
      correctAnswer: "A",
      explanation: "Each excenter of a triangle is the concurrency point of the internal bisector of one angle and the external bisectors of the other two angles.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch10_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Medians Dividing Area",
      question: "The three medians of a triangle divide its total area into:",
      options: {
        A: "$6$ smaller triangles of equal area",
        B: "$3$ triangles of unequal areas",
        C: "$4$ congruent triangles",
        D: "$6$ triangles with completely different areas"
      },
      correctAnswer: "A",
      explanation: "By theorem, the three medians of any triangle divide the entire triangle into $6$ smaller triangles, each having exactly $\\frac{1}{6}$ of the total area.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ],
  "Basic Statistics": [
    {
      id: "fbise9_math_ch11_41",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measure of Central Tendency Definition",
      question: "Which of the following is NOT a measure of central tendency?",
      options: {
        A: "Standard Deviation",
        B: "Arithmetic Mean",
        C: "Median",
        D: "Mode"
      },
      correctAnswer: "A",
      explanation: "Mean, median, and mode measure central tendency (location). Standard deviation is a measure of dispersion (spread).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_42",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Class Interval Size (Width)",
      question: "What is the class width (size) of the class interval $20 - 29$?",
      options: {
        A: "$10$",
        B: "$9$",
        C: "$9.5$",
        D: "$20$"
      },
      correctAnswer: "A",
      explanation: "Class boundaries are $19.5$ to $29.5$. The class size $h = 29.5 - 19.5 = 10$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_43",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Mean of Constant Set",
      question: "What is the arithmetic mean of the set $\\{7, 7, 7, 7, 7\\}$?",
      options: {
        A: "$7$",
        B: "$0$",
        C: "$35$",
        D: "$1.4$"
      },
      correctAnswer: "A",
      explanation: "If all $n$ observations in a data set have a constant value $c$, their arithmetic mean is also $c$. Here $\\frac{7 \\times 5}{5} = 7$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_44",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Effect of Adding Constant on Mean",
      question: "If a constant value $5$ is added to every observation in a data set with mean $\\bar{x} = 22$, what is the new mean?",
      options: {
        A: "$27$",
        B: "$22$",
        C: "$110$",
        D: "$17$"
      },
      correctAnswer: "A",
      explanation: "By the shift of origin property, if a constant $k$ is added to every observation, the new mean increases by $k$: $\\text{New Mean} = 22 + 5 = 27$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_45",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Median of Odd Number of Values",
      question: "Find the median of the data: $24, 15, 38, 12, 45, 19, 31$.",
      options: {
        A: "$24$",
        B: "$19$",
        C: "$31$",
        D: "$26.3$"
      },
      correctAnswer: "A",
      explanation: "Sorting in ascending order: $12, 15, 19, 24, 31, 38, 45$. With $n = 7$ observations, the median is the 4th value: $24$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_46",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Cumulative Frequency",
      question: "The total of all frequencies up to and including a given class interval is known as:",
      options: {
        A: "Cumulative frequency",
        B: "Relative frequency",
        C: "Frequency density",
        D: "Class mark"
      },
      correctAnswer: "A",
      explanation: "Cumulative frequency is the running sum of class frequencies accumulated up to the upper boundary of each class.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_47",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Empirical Relationship Calculation",
      question: "In a frequency distribution, if $\\text{Mean} = 30$ and $\\text{Median} = 28$, what is the estimated $\\text{Mode}$?",
      options: {
        A: "$24$",
        B: "$26$",
        C: "$32$",
        D: "$28$"
      },
      correctAnswer: "A",
      explanation: "Using $\\text{Mode} = 3(\\text{Median}) - 2(\\text{Mean}) = 3(28) - 2(30) = 84 - 60 = 24$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_48",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Geometric Mean Definition",
      question: "The geometric mean of two positive numbers $4$ and $16$ is:",
      options: {
        A: "$8$",
        B: "$10$",
        C: "$64$",
        D: "$6.4$"
      },
      correctAnswer: "A",
      explanation: "Geometric Mean $GM = \\sqrt{x_1 \\times x_2} = \\sqrt{4 \\times 16} = \\sqrt{64} = 8$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_49",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Variance of a Constant Set",
      question: "What is the variance of the set $\\{5, 5, 5, 5, 5\\}$?",
      options: {
        A: "$0$",
        B: "$5$",
        C: "$25$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "Since there is no variation or spread among identical observations, the deviation $(x_i - \\bar{x}) = 0$ for all items, giving a variance of $0$.",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    },
    {
      id: "fbise9_math_ch11_50",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Ogive / Cumulative Frequency Curve",
      question: "From an ogive (cumulative frequency polygon), which measure of central tendency can be graphically determined?",
      options: {
        A: "Median",
        B: "Arithmetic Mean",
        C: "Mode",
        D: "Geometric Mean"
      },
      correctAnswer: "A",
      explanation: "The median corresponds to the 50th percentile (or $\\frac{N}{2}$ value) on the vertical axis and can be directly read off the horizontal axis of a cumulative frequency polygon (ogive).",
      difficulty: "board_exam",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:44:00.000Z"
    }
  ]
};
