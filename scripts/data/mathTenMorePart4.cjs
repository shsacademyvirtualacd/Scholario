/**
 * mathTenMorePart4.cjs
 * 
 * 50 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 7 to 11, 10 each)
 * Strict append batch (Questions 21 to 30 for each chapter)
 * 
 * Chapters covered:
 * 7. Coordinate Geometry (10 MCQs: 21-30)
 * 8. Geometry of Straight Lines (10 MCQs: 21-30)
 * 9. Geometry and Polygons (10 MCQs: 21-30)
 * 10. Practical Geometry (10 MCQs: 21-30)
 * 11. Basic Statistics (10 MCQs: 21-30)
 */

module.exports = {
  "Coordinate Geometry": [
    {
      id: "fbise9_math_ch7_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Cartesian plane and quadrants",
      question: "In which quadrant does the point $(-6, 7)$ lie?",
      options: {
        A: "Quadrant II",
        B: "Quadrant I",
        C: "Quadrant III",
        D: "Quadrant IV"
      },
      correctAnswer: "A",
      explanation: "A point $(x, y)$ with $x < 0$ and $y > 0$ lies strictly in Quadrant II.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance formula",
      question: "What is the distance between points $A(0, 0)$ and $B(6, 8)$?",
      options: {
        A: "$10$",
        B: "$14$",
        C: "$12$",
        D: "$\\sqrt{14}$"
      },
      correctAnswer: "A",
      explanation: "$d = \\sqrt{(6 - 0)^2 + (8 - 0)^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Midpoint formula",
      question: "Find the midpoint of the line segment joining $P(-2, 4)$ and $Q(6, -8)$.",
      options: {
        A: "$(2, -2)$",
        B: "$(4, -4)$",
        C: "$(2, 2)$",
        D: "$(4, 2)$"
      },
      correctAnswer: "A",
      explanation: "$M = \\left(\\frac{-2 + 6}{2}, \\frac{4 + (-8)}{2}\\right) = \\left(\\frac{4}{2}, \\frac{-4}{2}\\right) = (2, -2)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Collinear points",
      question: "Three points $P, Q, R$ are collinear if and only if:",
      options: {
        A: "They all lie on the same straight line (Slope $PQ = \\text{Slope } QR$)",
        B: "They form a right-angled triangle",
        C: "Their x-coordinates are equal to their y-coordinates",
        D: "They form an equilateral triangle"
      },
      correctAnswer: "A",
      explanation: "Points are defined as collinear when they lie along the exact same straight line, meaning the slope between any two pairs of points is equal.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Slope of a line",
      question: "What is the slope of the line passing through $(3, 5)$ and $(7, 13)$?",
      options: {
        A: "$2$",
        B: "$\\frac{1}{2}$",
        C: "$4$",
        D: "$8$"
      },
      correctAnswer: "A",
      explanation: "$m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{13 - 5}{7 - 3} = \\frac{8}{4} = 2$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Cartesian plane and quadrants",
      question: "Any point lying on the x-axis has a y-coordinate (ordinate) equal to:",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$-1$",
        D: "Any real number"
      },
      correctAnswer: "A",
      explanation: "Every point located on the x-axis has ordinate $y = 0$, giving coordinates of the general form $(x, 0)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Slope of a line",
      question: "If line $L_1$ with slope $m_1$ is perpendicular to line $L_2$ with slope $m_2$, what is the mathematical relation between them?",
      options: {
        A: "$m_1 \\cdot m_2 = -1$",
        B: "$m_1 = m_2$",
        C: "$m_1 + m_2 = 0$",
        D: "$m_1 \\cdot m_2 = 1$"
      },
      correctAnswer: "A",
      explanation: "Two non-vertical lines are perpendicular if and only if the product of their slopes is $-1$ ($m_1 \\cdot m_2 = -1$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance formula",
      question: "If the distance between $A(2, 3)$ and $B(x, -1)$ is $5$ units, find the positive value of $x$.",
      options: {
        A: "$5$",
        B: "$6$",
        C: "$7$",
        D: "$4$"
      },
      correctAnswer: "A",
      explanation: "$d^2 = (x - 2)^2 + (-1 - 3)^2 \\implies 5^2 = (x - 2)^2 + (-4)^2 \\implies 25 = (x - 2)^2 + 16 \\implies (x - 2)^2 = 9 \\implies x - 2 = \\pm 3 \\implies x = 2 + 3 = 5$ or $x = 2 - 3 = -1$. The positive value is $5$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Midpoint formula",
      question: "If $M(3, 4)$ is the midpoint of segment $AB$ and $A$ has coordinates $(1, 2)$, what are the coordinates of point $B$?",
      options: {
        A: "$(5, 6)$",
        B: "$(4, 6)$",
        C: "$(2, 3)$",
        D: "$(6, 8)$"
      },
      correctAnswer: "A",
      explanation: "Let $B = (x_2, y_2)$. Then $\\frac{1 + x_2}{2} = 3 \\implies 1 + x_2 = 6 \\implies x_2 = 5$. And $\\frac{2 + y_2}{2} = 4 \\implies 2 + y_2 = 8 \\implies y_2 = 6$. So $B = (5, 6)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch7_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Cartesian plane and quadrants",
      question: "The vertices $A(0, 0)$, $B(4, 0)$, and $C(0, 3)$ form which type of geometric figure?",
      options: {
        A: "A right-angled triangle with area $6\\text{ sq units}$",
        B: "An equilateral triangle with area $12\\text{ sq units}$",
        C: "An obtuse triangle",
        D: "A straight line segment"
      },
      correctAnswer: "A",
      explanation: "Sides along coordinate axes are perpendicular ($AB$ on x-axis length 4, $AC$ on y-axis length 3). Angle at $A$ is $90^\\circ$, and $\\text{Area} = \\frac{1}{2} \\times 4 \\times 3 = 6\\text{ sq units}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Geometry of Straight Lines": [
    {
      id: "fbise9_math_ch8_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Angles formed by intersecting and parallel lines",
      question: "When two straight lines intersect, the vertically opposite angles are always:",
      options: {
        A: "Equal in measure",
        B: "Supplementary ($180^\\circ$)",
        C: "Complementary ($90^\\circ$)",
        D: "Reflex angles"
      },
      correctAnswer: "A",
      explanation: "A fundamental theorem of plane geometry states that vertically opposite angles formed by intersecting lines are congruent (equal).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Supplementary and Complementary angles",
      question: "If two angles are complementary and one angle measures $38^\\circ$, find the measure of the other angle.",
      options: {
        A: "$52^\\circ$",
        B: "$142^\\circ$",
        C: "$62^\\circ$",
        D: "$42^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Complementary angles sum to $90^\\circ$. The other angle is $90^\\circ - 38^\\circ = 52^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Linear pair of angles",
      question: "Two adjacent angles that form a straight line are known as a linear pair, and their sum is:",
      options: {
        A: "$180^\\circ$",
        B: "$90^\\circ$",
        C: "$360^\\circ$",
        D: "$270^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Angles in a linear pair lie on a straight line, hence they are supplementary and their sum equals $180^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Transversal line properties",
      question: "When a transversal intersects two parallel lines, interior alternate angles are:",
      options: {
        A: "Equal",
        B: "Complementary",
        C: "Supplementary",
        D: "Unequal"
      },
      correctAnswer: "A",
      explanation: "By the alternate interior angles theorem, when parallel lines are cut by a transversal, the alternate interior angles are equal in measure.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Transversal line properties",
      question: "The consecutive interior angles on the same side of a transversal intersecting two parallel lines are always:",
      options: {
        A: "Supplementary (sum to $180^\\circ$)",
        B: "Equal",
        C: "Complementary (sum to $90^\\circ$)",
        D: "Reflex angles"
      },
      correctAnswer: "A",
      explanation: "Consecutive (co-interior) angles on the same side of a transversal cutting two parallel lines add up to $180^\\circ$ (supplementary).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Perpendicular and angle bisectors",
      question: "Any point lying on the perpendicular bisector of a line segment is:",
      options: {
        A: "Equidistant from both endpoints of the segment",
        B: "Closer to the left endpoint",
        C: "At a distance equal to the length of the segment",
        D: "Collinear with the segment"
      },
      correctAnswer: "A",
      explanation: "By the Perpendicular Bisector Theorem, any point on the perpendicular bisector of a line segment is equidistant from its endpoints.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Angles formed by intersecting and parallel lines",
      question: "In the figure where $L_1 \\parallel L_2$, one co-interior angle is $(3x + 10)^\\circ$ and the other is $(2x + 20)^\\circ$. Find the value of $x$.",
      options: {
        A: "$30^\\circ$",
        B: "$25^\\circ$",
        C: "$35^\\circ$",
        D: "$20^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Co-interior angles are supplementary: $(3x + 10) + (2x + 20) = 180 \\implies 5x + 30 = 180 \\implies 5x = 150 \\implies x = 30$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Perpendicular and angle bisectors",
      question: "Any point on the bisector of an angle is equidistant from:",
      options: {
        A: "Both arms (sides) of the angle",
        B: "The vertex of the angle",
        C: "The exterior of the angle",
        D: "The opposite ray"
      },
      correctAnswer: "A",
      explanation: "By the Angle Bisector Theorem, any point on the bisector of an angle is equidistant from the arms of the angle.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Linear pair of angles",
      question: "Two angles forming a linear pair are in the ratio $4:5$. What is the measure of the smaller angle?",
      options: {
        A: "$80^\\circ$",
        B: "$100^\\circ$",
        C: "$60^\\circ$",
        D: "$45^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Let angles be $4x$ and $5x$. $4x + 5x = 180^\\circ \\implies 9x = 180^\\circ \\implies x = 20^\\circ$. Smaller angle $= 4(20^\\circ) = 80^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch8_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Transversal line properties",
      question: "If two parallel lines are intersected by a transversal, how many distinct angle measurements exist among the 8 formed angles?",
      options: {
        A: "At most $2$ distinct angle values",
        B: "$4$ distinct angle values",
        C: "$8$ distinct angle values",
        D: "$1$ distinct angle value always"
      },
      correctAnswer: "A",
      explanation: "The 8 angles formed consist of 4 equal acute (or right) angles and 4 equal obtuse (or right) angles that are supplementary to each other, giving at most 2 distinct angle values (or 1 if all are $90^\\circ$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Geometry and Polygons": [
    {
      id: "fbise9_math_ch9_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Sum of interior angles of a polygon",
      question: "What is the sum of interior angles of an octagon (8-sided polygon)?",
      options: {
        A: "$1080^\\circ$",
        B: "$900^\\circ$",
        C: "$1260^\\circ$",
        D: "$720^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Sum of interior angles $= (n - 2) \\times 180^\\circ = (8 - 2) \\times 180^\\circ = 6 \\times 180^\\circ = 1080^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Sum of exterior angles of convex polygons",
      question: "The sum of all exterior angles of any convex polygon (one per vertex) is always:",
      options: {
        A: "$360^\\circ$",
        B: "$180^\\circ$",
        C: "$540^\\circ$",
        D: "$720^\\circ$"
      },
      correctAnswer: "A",
      explanation: "For any convex $n$-sided polygon, the sum of exterior angles is constant and equal to $360^\\circ$ ($4$ right angles).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Properties of Parallelogram",
      question: "In any parallelogram, the diagonals:",
      options: {
        A: "Bisect each other",
        B: "Are always equal in length",
        C: "Are always perpendicular",
        D: "Are parallel to each other"
      },
      correctAnswer: "A",
      explanation: "A key property of all parallelograms is that their diagonals bisect each other.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Regular polygons",
      question: "Each interior angle of a regular decagon (10-sided polygon) measures:",
      options: {
        A: "$144^\\circ$",
        B: "$135^\\circ$",
        C: "$120^\\circ$",
        D: "$150^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Each exterior angle $= \\frac{360^\\circ}{10} = 36^\\circ$. Each interior angle $= 180^\\circ - 36^\\circ = 144^\\circ$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Congruency and similarity of triangles",
      question: "Which of the following is NOT a valid test for congruence of two triangles?",
      options: {
        A: "AAA (Angle-Angle-Angle)",
        B: "SSS (Side-Side-Side)",
        C: "SAS (Side-Angle-Side)",
        D: "RHS (Right-angle-Hypotenuse-Side)"
      },
      correctAnswer: "A",
      explanation: "AAA guarantees that two triangles are similar (same shape), but not necessarily congruent (same size).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Properties of Rhombus and Rectangle",
      question: "A quadrilateral whose all four sides are equal and diagonals intersect at right angles ($90^\\circ$) is a:",
      options: {
        A: "Rhombus",
        B: "Rectangle",
        C: "Trapezium",
        D: "Kite"
      },
      correctAnswer: "A",
      explanation: "By definition, a rhombus is an equilateral parallelogram whose diagonals are perpendicular bisectors of each other.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Midpoint Theorem of Triangles",
      question: "The line segment joining the midpoints of any two sides of a triangle is:",
      options: {
        A: "Parallel to the third side and equal to half its length",
        B: "Perpendicular to the third side",
        C: "Equal in length to the third side",
        D: "Twice as long as the third side"
      },
      correctAnswer: "A",
      explanation: "The Midpoint Theorem states that the segment joining the midpoints of two sides of a triangle is parallel to the third side and half as long ($DE \\parallel BC$ and $DE = \\frac{1}{2}BC$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Sum of interior angles of a polygon",
      question: "If each interior angle of a regular polygon is $160^\\circ$, how many sides does the polygon have?",
      options: {
        A: "$18$",
        B: "$15$",
        C: "$20$",
        D: "$12$"
      },
      correctAnswer: "A",
      explanation: "Each exterior angle $= 180^\\circ - 160^\\circ = 20^\\circ$. Number of sides $n = \\frac{360^\\circ}{20^\\circ} = 18$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Properties of Parallelogram",
      question: "In a parallelogram $ABCD$, if $\\angle A = (2x + 15)^\\circ$ and consecutive angle $\\angle B = (3x - 10)^\\circ$, find the measure of $\\angle A$.",
      options: {
        A: "$85^\\circ$",
        B: "$95^\\circ$",
        C: "$75^\\circ$",
        D: "$105^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Adjacent angles in a parallelogram are supplementary: $(2x + 15) + (3x - 10) = 180 \\implies 5x + 5 = 180 \\implies 5x = 175 \\implies x = 35^\\circ$. Thus $\\angle A = 2(35) + 15 = 70 + 15 = 85^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch9_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Congruency and similarity of triangles",
      question: "The ratio of corresponding sides of two similar triangles is $3:4$. What is the ratio of their areas?",
      options: {
        A: "$9:16$",
        B: "$3:4$",
        C: "$27:64$",
        D: "$6:8$"
      },
      correctAnswer: "A",
      explanation: "The ratio of areas of two similar triangles is equal to the square of the ratio of their corresponding side lengths: $(\\frac{3}{4})^2 = \\frac{9}{16}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Practical Geometry": [
    {
      id: "fbise9_math_ch10_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of triangles",
      question: "To construct a unique triangle, what is the minimum number of independent measurements required?",
      options: {
        A: "$3$",
        B: "$2$",
        C: "$4$",
        D: "$5$"
      },
      correctAnswer: "A",
      explanation: "A minimum of 3 independent elements (such as 3 sides, 2 sides and included angle, or 2 angles and 1 side) are required to construct a unique triangle.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Altitudes of a triangle",
      question: "The point of concurrency of the three altitudes of a triangle is known as the:",
      options: {
        A: "Orthocentre",
        B: "Centroid",
        C: "Incentre",
        D: "Circumcentre"
      },
      correctAnswer: "A",
      explanation: "The orthocentre is the single common intersection point of the three perpendicular altitudes drawn from the vertices to the opposite sides of a triangle.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Incentre of a triangle",
      question: "The point of concurrency of the internal angle bisectors of a triangle is called the:",
      options: {
        A: "Incentre",
        B: "Centroid",
        C: "Orthocentre",
        D: "Circumcentre"
      },
      correctAnswer: "A",
      explanation: "The incentre is the point of concurrency of the angle bisectors of a triangle and is equidistant from all three sides.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Medians and centroid of a triangle",
      question: "The medians of a triangle intersect at the centroid, which divides each median in the ratio:",
      options: {
        A: "$2:1$ from the vertex to the base",
        B: "$1:1$",
        C: "$3:1$",
        D: "$1:2$ from the vertex"
      },
      correctAnswer: "A",
      explanation: "The centroid divides every median in the ratio $2:1$, with the longer segment being between the vertex and the centroid.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Perpendicular bisectors and circumcentre",
      question: "The point of concurrency of the perpendicular bisectors of the sides of a triangle is the:",
      options: {
        A: "Circumcentre",
        B: "Incentre",
        C: "Orthocentre",
        D: "Centroid"
      },
      correctAnswer: "A",
      explanation: "The circumcentre is the point where the right (perpendicular) bisectors of the sides of a triangle concur; it is equidistant from all three vertices.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Circumcentre of right-angled triangles",
      question: "For a right-angled triangle, where does the circumcentre lie?",
      options: {
        A: "At the midpoint of the hypotenuse",
        B: "Inside the triangle",
        C: "At the vertex containing the $90^\\circ$ angle",
        D: "Outside the triangle"
      },
      correctAnswer: "A",
      explanation: "In any right-angled triangle, the circumcentre is always located exactly at the midpoint of the hypotenuse.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Orthocentre of obtuse-angled triangles",
      question: "In an obtuse-angled triangle, the orthocentre lies:",
      options: {
        A: "Outside the triangle",
        B: "Inside the triangle",
        C: "On the longest side",
        D: "At the obtuse vertex"
      },
      correctAnswer: "A",
      explanation: "For an obtuse-angled triangle, the lines containing the altitudes extend and meet outside the boundary of the triangle.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of quadrilaterals",
      question: "How many independent measurements are required to uniquely construct a quadrilateral?",
      options: {
        A: "$5$",
        B: "$4$",
        C: "$3$",
        D: "$6$"
      },
      correctAnswer: "A",
      explanation: "A quadrilateral has 8 components (4 sides, 4 angles) plus 2 diagonals. Exactly 5 independent measurements are necessary and sufficient to construct a unique quadrilateral.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of triangles",
      question: "Which set of side lengths can successfully form a triangle according to the Triangle Inequality theorem?",
      options: {
        A: "$5\\text{ cm}, 6\\text{ cm}, 10\\text{ cm}$",
        B: "$3\\text{ cm}, 4\\text{ cm}, 8\\text{ cm}$",
        C: "$2\\text{ cm}, 3\\text{ cm}, 5\\text{ cm}$",
        D: "$1\\text{ cm}, 2\\text{ cm}, 4\\text{ cm}$"
      },
      correctAnswer: "A",
      explanation: "By the Triangle Inequality Theorem, the sum of any two sides must be strictly greater than the third side: $5 + 6 = 11 > 10$, $5 + 10 = 15 > 6$, $6 + 10 = 16 > 5$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch10_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Altitudes of a triangle",
      question: "In an equilateral triangle of side length $a$, the altitude $h$ is given by:",
      options: {
        A: "$h = \\frac{\\sqrt{3}}{2}a$",
        B: "$h = \\frac{\\sqrt{3}}{4}a$",
        C: "$h = \\frac{a}{2}$",
        D: "$h = \\sqrt{3}a$"
      },
      correctAnswer: "A",
      explanation: "Using Pythagoras theorem on half the equilateral triangle: $h^2 + (\\frac{a}{2})^2 = a^2 \\implies h^2 = a^2 - \\frac{a^2}{4} = \\frac{3a^2}{4} \\implies h = \\frac{\\sqrt{3}}{2}a$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ],

  "Basic Statistics": [
    {
      id: "fbise9_math_ch11_21",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of central tendency (Mean)",
      question: "Find the arithmetic mean of the data set: $4, 8, 12, 16, 20$.",
      options: {
        A: "$12$",
        B: "$10$",
        C: "$14$",
        D: "$16$"
      },
      correctAnswer: "A",
      explanation: "$\\bar{x} = \\frac{4 + 8 + 12 + 16 + 20}{5} = \\frac{60}{5} = 12$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_22",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Mode",
      question: "What is the mode of the values: $3, 7, 5, 7, 9, 7, 2, 5$?",
      options: {
        A: "$7$",
        B: "$5$",
        C: "$3$",
        D: "No mode"
      },
      correctAnswer: "A",
      explanation: "The mode is the value that occurs with highest frequency. Number $7$ occurs 3 times, which is more than any other number.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_23",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Range as a measure of dispersion",
      question: "Find the range of the test scores: $42, 88, 55, 96, 73, 61$.",
      options: {
        A: "$54$",
        B: "$96$",
        C: "$42$",
        D: "$48$"
      },
      correctAnswer: "A",
      explanation: "$\\text{Range} = X_{\\max} - X_{\\min} = 96 - 42 = 54$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_24",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Median",
      question: "Find the median of the data: $14, 8, 22, 19, 11, 25$.",
      options: {
        A: "$16.5$",
        B: "$15$",
        C: "$19$",
        D: "$14$"
      },
      correctAnswer: "A",
      explanation: "Arrange in ascending order: $8, 11, 14, 19, 22, 25$. Since $n = 6$ (even), the median is the average of the two middle values: $\\frac{14 + 19}{2} = \\frac{33}{2} = 16.5$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_25",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Cumulative frequency distribution",
      question: "In a grouped frequency table, the cumulative frequency of the last class interval is always equal to:",
      options: {
        A: "The total frequency $\\sum f$",
        B: "The class width $h$",
        C: "The mean of the data",
        D: "The upper limit of the last class"
      },
      correctAnswer: "A",
      explanation: "Cumulative frequency sums all class frequencies up to that point. The final class cumulative frequency equals the total number of observations $\\sum f = N$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_26",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Graphic representation (Histogram/Pie chart)",
      question: "In a pie chart, a sector representing a category with frequency $f$ out of total $N$ has central angle:",
      options: {
        A: "$\\theta = \\frac{f}{N} \\times 360^\\circ$",
        B: "$\\theta = \\frac{f}{N} \\times 100^\\circ$",
        C: "$\\theta = \\frac{f}{N} \\times 180^\\circ$",
        D: "$\\theta = \\frac{N}{f} \\times 360^\\circ$"
      },
      correctAnswer: "A",
      explanation: "A full circle is $360^\\circ$. The sector angle for frequency $f$ is proportional to its fraction of total $N$: $\\theta = \\frac{f}{N} \\times 360^\\circ$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_27",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of central tendency (Mean)",
      question: "If the mean of $5$ observations $x, x+2, x+4, x+6, x+8$ is $15$, what is the value of $x$?",
      options: {
        A: "$11$",
        B: "$13$",
        C: "$9$",
        D: "$15$"
      },
      correctAnswer: "A",
      explanation: "Sum $= 5x + 20$. Mean $= \\frac{5x + 20}{5} = x + 4$. Given $x + 4 = 15 \\implies x = 11$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_28",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Harmonic Mean and Geometric Mean",
      question: "The Geometric Mean ($G.M.$) of two positive values $4$ and $16$ is:",
      options: {
        A: "$8$",
        B: "$10$",
        C: "$6.4$",
        D: "$64$"
      },
      correctAnswer: "A",
      explanation: "For two values $a$ and $b$, $G.M. = \\sqrt{ab} = \\sqrt{4 \\times 16} = \\sqrt{64} = 8$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_29",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of central tendency (Mean)",
      question: "The sum of deviations of all observations from their arithmetic mean (i.e., $\\sum (x_i - \\bar{x})$) is always equal to:",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$\\bar{x}$",
        D: "Positive value"
      },
      correctAnswer: "A",
      explanation: "A fundamental mathematical property of arithmetic mean is that the algebraic sum of deviations from the mean is identically zero: $\\sum (x_i - \\bar{x}) = \\sum x_i - n\\bar{x} = n\\bar{x} - n\\bar{x} = 0$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    },
    {
      id: "fbise9_math_ch11_30",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Variance and Standard Deviation",
      question: "Standard deviation ($S$) is defined as:",
      options: {
        A: "The positive square root of the variance",
        B: "The square of the variance",
        C: "The range divided by $2$",
        D: "The mean absolute deviation"
      },
      correctAnswer: "A",
      explanation: "Standard deviation $S$ is mathematically defined as the positive square root of the variance ($S = \\sqrt{\\text{Var}(X)}$).",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:40:00.000Z"
    }
  ]
};
