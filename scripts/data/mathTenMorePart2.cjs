/**
 * mathTenMorePart2.cjs
 * 
 * 50 Additional Verified Grade 9 FBISE Mathematics MCQs (Chapters 7 to 11, 10 each)
 * Strict append batch (Questions 11 to 20 for each chapter)
 * 
 * Chapters covered:
 * 7. Coordinate Geometry (10 MCQs: 11-20)
 * 8. Geometry of Straight Lines (10 MCQs: 11-20)
 * 9. Geometry and Polygons (10 MCQs: 11-20)
 * 10. Practical Geometry (10 MCQs: 11-20)
 * 11. Basic Statistics (10 MCQs: 11-20)
 */

module.exports = {
  "Coordinate Geometry": [
    {
      id: "fbise9_math_ch7_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Cartesian plane and Coordinates",
      question: "The point $P(-5, -7)$ lies in which quadrant of the Cartesian plane?",
      options: {
        A: "III quadrant",
        B: "II quadrant",
        C: "IV quadrant",
        D: "I quadrant"
      },
      correctAnswer: "A",
      explanation: "In Quadrant III, both the abscissa (x-coordinate) and ordinate (y-coordinate) are negative ($x < 0, y < 0$).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Mid-point Formula",
      question: "What are the coordinates of the midpoint of the line segment joining points $A(2, -4)$ and $B(6, 8)$?",
      options: {
        A: "$(4, 2)$",
        B: "$(8, 4)$",
        C: "$(2, 6)$",
        D: "$(4, -2)$"
      },
      correctAnswer: "A",
      explanation: "Using the midpoint formula $M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right) = \\left(\\frac{2 + 6}{2}, \\frac{-4 + 8}{2}\\right) = (4, 2)$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Cartesian plane and Coordinates",
      question: "The distance of any point $P(x, y)$ from the y-axis is given by:",
      options: {
        A: "$|x|$",
        B: "$|y|$",
        C: "$\\sqrt{x^2 + y^2}$",
        D: "$x + y$"
      },
      correctAnswer: "A",
      explanation: "The perpendicular distance of a point from the y-axis is the absolute value of its x-coordinate (abscissa), $|x|$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance Formula",
      question: "Calculate the distance between points $A(-1, 3)$ and $B(2, -1)$.",
      options: {
        A: "$5$",
        B: "$7$",
        C: "$\\sqrt{17}$",
        D: "$\\sqrt{5}$"
      },
      correctAnswer: "A",
      explanation: "$d = \\sqrt{(2 - (-1))^2 + (-1 - 3)^2} = \\sqrt{3^2 + (-4)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Mid-point Formula",
      question: "If point $M(3, 4)$ is the midpoint of segment $AB$ with endpoint $A(1, 2)$, what are the coordinates of endpoint $B$?",
      options: {
        A: "$(5, 6)$",
        B: "$(2, 3)$",
        C: "$(4, 5)$",
        D: "$(7, 8)$"
      },
      correctAnswer: "A",
      explanation: "Using $\\frac{1 + x_B}{2} = 3 \\implies x_B = 6 - 1 = 5$ and $\\frac{2 + y_B}{2} = 4 \\implies y_B = 8 - 2 = 6$. So $B = (5, 6)$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Collinear and non-collinear points",
      question: "Points $A(1, 2)$, $B(2, 4)$, and $C(k, 6)$ are collinear. Find the value of $k$.",
      options: {
        A: "$3$",
        B: "$4$",
        C: "$5$",
        D: "$2$"
      },
      correctAnswer: "A",
      explanation: "Slope of $AB = \\frac{4 - 2}{2 - 1} = 2$. Slope of $BC = \\frac{6 - 4}{k - 2} = \\frac{2}{k - 2}$. Equating slopes: $\\frac{2}{k - 2} = 2 \\implies k - 2 = 1 \\implies k = 3$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance Formula",
      question: "A circle with center at $C(2, -3)$ passes through the origin $(0, 0)$. What is the radius of the circle?",
      options: {
        A: "$\\sqrt{13}$",
        B: "$5$",
        C: "$\\sqrt{5}$",
        D: "$13$"
      },
      correctAnswer: "A",
      explanation: "Radius $r = \\sqrt{(2 - 0)^2 + (-3 - 0)^2} = \\sqrt{4 + 9} = \\sqrt{13}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance Formula",
      question: "A triangle having vertices $A(0, 0)$, $B(4, 0)$, and $C(0, 3)$ is:",
      options: {
        A: "A right-angled scalene triangle with hypotenuse of length $5$",
        B: "An equilateral triangle with side $4$",
        C: "An isosceles triangle with sides $3, 3, 4$",
        D: "An obtuse-angled triangle"
      },
      correctAnswer: "A",
      explanation: "$AB = 4$, $AC = 3$, $BC = \\sqrt{(4-0)^2 + (0-3)^2} = \\sqrt{16 + 9} = 5$. Since $3^2 + 4^2 = 5^2$ ($9 + 16 = 25$), it is a right triangle with hypotenuse $BC = 5$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Cartesian plane and Coordinates",
      question: "The point of concurrency of the medians of a triangle with vertices $(x_1, y_1)$, $(x_2, y_2)$, and $(x_3, y_3)$ is the Centroid $G$, given by:",
      options: {
        A: "$\\left(\\frac{x_1 + x_2 + x_3}{3}, \\frac{y_1 + y_2 + y_3}{3}\\right)$",
        B: "$\\left(\\frac{x_1 + x_2 + x_3}{2}, \\frac{y_1 + y_2 + y_3}{2}\\right)$",
        C: "$\\left(\\frac{x_1 x_2 x_3}{3}, \\frac{y_1 y_2 y_3}{3}\\right)$",
        D: "$\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$"
      },
      correctAnswer: "A",
      explanation: "The centroid of a triangle is the arithmetic average of the coordinates of its three vertices: $G = \\left(\\frac{x_1 + x_2 + x_3}{3}, \\frac{y_1 + y_2 + y_3}{3}\\right)$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch7_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Coordinate Geometry",
      chapterNumber: 7,
      topic: "Distance Formula",
      question: "If the distance between $P(x, 2)$ and $Q(3, -6)$ is $10$ units, find the possible values of $x$.",
      options: {
        A: "$x = 9$ or $x = -3$",
        B: "$x = 6$ or $x = -6$",
        C: "$x = 5$ or $x = -1$",
        D: "$x = 10$ or $x = -4$"
      },
      correctAnswer: "A",
      explanation: "$d^2 = (x - 3)^2 + (2 - (-6))^2 = 10^2 \\implies (x - 3)^2 + 8^2 = 100 \\implies (x - 3)^2 + 64 = 100 \\implies (x - 3)^2 = 36 \\implies x - 3 = \\pm 6 \\implies x = 3 + 6 = 9$ or $x = 3 - 6 = -3$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Geometry of Straight Lines": [
    {
      id: "fbise9_math_ch8_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Parallel lines and Transversal lines",
      question: "If two parallel lines are cut by a transversal, alternate interior angles are always:",
      options: {
        A: "Equal in measure",
        B: "Supplementary ($180^\\circ$)",
        C: "Complementary ($90^\\circ$)",
        D: "Unequal"
      },
      correctAnswer: "A",
      explanation: "By the alternate interior angle theorem, when two parallel lines are intersected by a transversal, each pair of alternate interior angles has equal measure.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Alternate interior angles, Corresponding angles, Consecutive angles",
      question: "Two adjacent angles that form a straight line (linear pair) add up to:",
      options: {
        A: "$180^\\circ$",
        B: "$90^\\circ$",
        C: "$360^\\circ$",
        D: "$270^\\circ$"
      },
      correctAnswer: "A",
      explanation: "The angles forming a linear pair lie on a straight line and are therefore supplementary, adding up to $180^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Congruence of triangles",
      question: "If all three corresponding sides of two triangles are equal, the triangles are congruent by which criterion?",
      options: {
        A: "SSS postulate",
        B: "SAS postulate",
        C: "ASA postulate",
        D: "RHS theorem"
      },
      correctAnswer: "A",
      explanation: "The Side-Side-Side (SSS) congruence postulate states that if three sides of one triangle are congruent to three sides of another triangle, then the two triangles are congruent.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Alternate interior angles, Corresponding angles, Consecutive angles",
      question: "Two consecutive interior angles on the same side of a transversal intersecting two parallel lines have measures $(3x + 10)^\\circ$ and $(2x + 20)^\\circ$. Find $x$.",
      options: {
        A: "$30$",
        B: "$25$",
        C: "$36$",
        D: "$20$"
      },
      correctAnswer: "A",
      explanation: "Consecutive interior angles are supplementary: $(3x + 10) + (2x + 20) = 180 \\implies 5x + 30 = 180 \\implies 5x = 150 \\implies x = 30$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Congruence of triangles",
      question: "In two right-angled triangles, if the hypotenuse and one side of one triangle are equal to the hypotenuse and one side of the other, the congruence criterion used is:",
      options: {
        A: "RHS theorem",
        B: "SAS postulate",
        C: "AAS theorem",
        D: "SSS postulate"
      },
      correctAnswer: "A",
      explanation: "RHS (Right angle - Hypotenuse - Side) theorem establishes congruence between two right triangles when their hypotenuses and one corresponding leg are equal.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Parallel lines and Transversal lines",
      question: "If two straight lines intersect, the vertically opposite angles are:",
      options: {
        A: "Always equal in measure",
        B: "Always supplementary",
        C: "Always complementary",
        D: "Unequal unless lines are perpendicular"
      },
      correctAnswer: "A",
      explanation: "When two straight lines intersect, the vertically opposite angles formed are always congruent (equal in measure).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Congruence of triangles",
      question: "In $\\triangle ABC$, $AB = AC$ (isosceles triangle). If $\\angle A = 50^\\circ$, what is the measure of base angle $\\angle B$?",
      options: {
        A: "$65^\\circ$",
        B: "$50^\\circ$",
        C: "$75^\\circ$",
        D: "$130^\\circ$"
      },
      correctAnswer: "A",
      explanation: "In an isosceles triangle, angles opposite to equal sides are equal: $\\angle B = \\angle C$. The sum of angles is $180^\\circ$: $50^\\circ + 2\\angle B = 180^\\circ \\implies 2\\angle B = 130^\\circ \\implies \\angle B = 65^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Alternate interior angles, Corresponding angles, Consecutive angles",
      question: "An exterior angle of a triangle is equal to $110^\\circ$. If one of the interior opposite angles is $45^\\circ$, find the other interior opposite angle.",
      options: {
        A: "$65^\\circ$",
        B: "$70^\\circ$",
        C: "$55^\\circ$",
        D: "$45^\\circ$"
      },
      correctAnswer: "A",
      explanation: "By the Exterior Angle Theorem, an exterior angle of a triangle equals the sum of its two interior opposite angles: $110^\\circ = 45^\\circ + x \\implies x = 110^\\circ - 45^\\circ = 65^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Congruence of triangles",
      question: "Which of the following conditions is NOT a sufficient criterion to prove congruence of two general triangles?",
      options: {
        A: "AAA (Angle-Angle-Angle)",
        B: "SAS (Side-Angle-Side)",
        C: "ASA (Angle-Side-Angle)",
        D: "SSS (Side-Side-Side)"
      },
      correctAnswer: "A",
      explanation: "AAA proves similarity (same shape) but not congruence (same size), because triangles can have identical angles while having different side lengths.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch8_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry of Straight Lines",
      chapterNumber: 8,
      topic: "Parallel lines and Transversal lines",
      question: "In $\\triangle ABC$, the segment joining the midpoints of sides $AB$ and $AC$ is:",
      options: {
        A: "Parallel to third side $BC$ and equal to half its length (Midpoint Theorem)",
        B: "Perpendicular to third side $BC$",
        C: "Equal in length to third side $BC$",
        D: "Twice the length of side $BC$"
      },
      correctAnswer: "A",
      explanation: "The Midpoint Theorem states that the line segment connecting the midpoints of two sides of a triangle is parallel to the third side and is half as long as that side.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Geometry and Polygons": [
    {
      id: "fbise9_math_ch9_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Properties of Parallelograms",
      question: "In a parallelogram $ABCD$, if adjacent angle $\\angle A = 70^\\circ$, what is the measure of consecutive angle $\\angle B$?",
      options: {
        A: "$110^\\circ$",
        B: "$70^\\circ$",
        C: "$90^\\circ$",
        D: "$140^\\circ$"
      },
      correctAnswer: "A",
      explanation: "In any parallelogram, consecutive adjacent angles are supplementary: $\\angle A + \\angle B = 180^\\circ \\implies \\angle B = 180^\\circ - 70^\\circ = 110^\\circ$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Interior and Exterior angles of polygons",
      question: "What is the sum of the exterior angles of ANY convex polygon with $n$ sides?",
      options: {
        A: "$360^\\circ$",
        B: "$180^\\circ$",
        C: "$(n - 2) \\times 180^\\circ$",
        D: "$n \\times 180^\\circ$"
      },
      correctAnswer: "A",
      explanation: "The sum of the exterior angles (taken one at each vertex) of any convex polygon is constant and equals $360^\\circ$ (or $4$ right angles).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Properties of Parallelograms",
      question: "A quadrilateral whose all four sides are equal and diagonals bisect each other at right angles is a:",
      options: {
        A: "Rhombus",
        B: "Trapezium",
        C: "Rectangle",
        D: "Kite"
      },
      correctAnswer: "A",
      explanation: "A rhombus is an equilateral parallelogram where all four sides are of equal length and diagonals are perpendicular bisectors of each other.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Interior and Exterior angles of polygons",
      question: "Find the measure of each interior angle of a regular octagon ($n = 8$).",
      options: {
        A: "$135^\\circ$",
        B: "$120^\\circ$",
        C: "$140^\\circ$",
        D: "$108^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Interior angle $= \\frac{(n - 2) \\times 180^\\circ}{n} = \\frac{(8 - 2) \\times 180^\\circ}{8} = \\frac{6 \\times 180^\\circ}{8} = \\frac{1080^\\circ}{8} = 135^\\circ$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Circle theorems",
      question: "The angle subtended by a diameter at any point on the circumference of a circle is:",
      options: {
        A: "A right angle ($90^\\circ$)",
        B: "An acute angle ($60^\\circ$)",
        C: "An obtuse angle ($120^\\circ$)",
        D: "A straight angle ($180^\\circ$)"
      },
      correctAnswer: "A",
      explanation: "By Thales' theorem, the angle inscribed in a semicircle (subtended by the diameter) is always a right angle ($90^\\circ$).",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Properties of Parallelograms",
      question: "In a cyclic quadrilateral $ABCD$, if $\\angle A = 85^\\circ$, what is the measure of opposite angle $\\angle C$?",
      options: {
        A: "$95^\\circ$",
        B: "$85^\\circ$",
        C: "$105^\\circ$",
        D: "$115^\\circ$"
      },
      correctAnswer: "A",
      explanation: "Opposite angles of a cyclic quadrilateral are supplementary: $\\angle A + \\angle C = 180^\\circ \\implies \\angle C = 180^\\circ - 85^\\circ = 95^\\circ$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Circle theorems",
      question: "A chord of length $16\\text{ cm}$ is at a distance of $6\\text{ cm}$ from the center of a circle. What is the radius of the circle?",
      options: {
        A: "$10\\text{ cm}$",
        B: "$12\\text{ cm}$",
        C: "$8\\text{ cm}$",
        D: "$14\\text{ cm}$"
      },
      correctAnswer: "A",
      explanation: "The perpendicular from the center bisects the chord: half-length $= \\frac{16}{2} = 8\\text{ cm}$. In the right triangle formed with the radius: $r^2 = 6^2 + 8^2 = 36 + 64 = 100 \\implies r = 10\\text{ cm}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Circle theorems",
      question: "A tangent at any point on a circle and the radius drawn to the point of contact are:",
      options: {
        A: "Perpendicular to each other ($90^\\circ$)",
        B: "Parallel to each other",
        C: "Inclined at $45^\\circ$",
        D: "Coincident"
      },
      correctAnswer: "A",
      explanation: "The radius to the point of contact of a tangent to a circle is always perpendicular to the tangent line at that point.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Interior and Exterior angles of polygons",
      question: "How many sides does a regular polygon have if each exterior angle measures $24^\\circ$?",
      options: {
        A: "$15$",
        B: "$12$",
        C: "$18$",
        D: "$20$"
      },
      correctAnswer: "A",
      explanation: "Number of sides $n = \\frac{360^\\circ}{\\text{Exterior angle}} = \\frac{360^\\circ}{24^\\circ} = 15$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch9_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Geometry and Polygons",
      chapterNumber: 9,
      topic: "Circle theorems",
      question: "If two tangents $PA$ and $PB$ are drawn from an external point $P$ to a circle with center $O$, and $\\angle APB = 70^\\circ$, find $\\angle AOB$.",
      options: {
        A: "$110^\\circ$",
        B: "$70^\\circ$",
        C: "$140^\\circ$",
        D: "$125^\\circ$"
      },
      correctAnswer: "A",
      explanation: "In quadrilateral $OAPB$, $\\angle OAP = 90^\\circ$ and $\\angle OBP = 90^\\circ$. The sum of angles is $360^\\circ$: $\\angle AOB + \\angle APB + 90^\\circ + 90^\\circ = 360^\\circ \\implies \\angle AOB + 70^\\circ = 180^\\circ \\implies \\angle AOB = 110^\\circ$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Practical Geometry": [
    {
      id: "fbise9_math_ch10_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Triangles",
      question: "How many independent measurements (elements) are required to construct a unique triangle?",
      options: {
        A: "$3$",
        B: "$4$",
        C: "$2$",
        D: "$5$"
      },
      correctAnswer: "A",
      explanation: "To construct a unique triangle, at least $3$ independent elements (e.g., three sides, two sides and included angle, or two angles and a side) must be specified.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Altitudes, Angle Bisectors, Perpendicular Bisectors, and Medians",
      question: "The point of intersection of the three angle bisectors of a triangle is the center of the:",
      options: {
        A: "Inscribed circle (Incenter)",
        B: "Circumscribed circle (Circumcenter)",
        C: "Escribed circle",
        D: "Centroid"
      },
      correctAnswer: "A",
      explanation: "The angle bisectors of the internal angles of a triangle are concurrent at the Incenter ($I$), which is equidistant from all three sides and forms the center of the inscribed circle (incircle).",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Altitudes, Angle Bisectors, Perpendicular Bisectors, and Medians",
      question: "The perpendicular bisectors of the three sides of a triangle intersect at the:",
      options: {
        A: "Circumcenter",
        B: "Orthocenter",
        C: "Incenter",
        D: "Centroid"
      },
      correctAnswer: "A",
      explanation: "The right bisectors (perpendicular bisectors) of the three sides of a triangle are concurrent at the Circumcenter, which is equidistant from the three vertices.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Triangles",
      question: "In an obtuse-angled triangle, the Orthocenter (point of concurrency of altitudes) lies:",
      options: {
        A: "Outside the triangle",
        B: "Inside the triangle",
        C: "At the vertex of the obtuse angle",
        D: "On the midpoint of the longest side"
      },
      correctAnswer: "A",
      explanation: "For an obtuse-angled triangle, the altitudes meet outside the triangle; for an acute triangle, inside; and for a right triangle, at the right-angled vertex.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Tangents to circles",
      question: "How many common tangents can be drawn to two circles that touch each other externally?",
      options: {
        A: "$3$",
        B: "$2$",
        C: "$4$",
        D: "$1$"
      },
      correctAnswer: "A",
      explanation: "When two circles touch externally, they have $2$ direct common tangents and $1$ transverse common tangent passing through the point of contact, giving a total of $3$ common tangents.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Altitudes, Angle Bisectors, Perpendicular Bisectors, and Medians",
      question: "The medians of a triangle divide each other in what ratio starting from the vertex?",
      options: {
        A: "$2 : 1$",
        B: "$1 : 1$",
        C: "$3 : 1$",
        D: "$1 : 2$"
      },
      correctAnswer: "A",
      explanation: "The centroid divides each median in a $2 : 1$ ratio, with the longer segment being between the vertex and the centroid.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Triangles",
      question: "Which of the following sets of side lengths can form a valid triangle?",
      options: {
        A: "$5\\text{ cm}, 7\\text{ cm}, 10\\text{ cm}$",
        B: "$2\\text{ cm}, 3\\text{ cm}, 6\\text{ cm}$",
        C: "$4\\text{ cm}, 4\\text{ cm}, 9\\text{ cm}$",
        D: "$1\\text{ cm}, 2\\text{ cm}, 3\\text{ cm}$"
      },
      correctAnswer: "A",
      explanation: "By the Triangle Inequality Theorem, the sum of any two sides must exceed the third side. For $5, 7, 10$: $5 + 7 = 12 > 10$, $5 + 10 = 15 > 7$, and $7 + 10 = 17 > 5$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Tangents to circles",
      question: "The length of two tangent segments drawn from an external point to a circle are:",
      options: {
        A: "Equal in length",
        B: "Inversely proportional to radius",
        C: "Unequal",
        D: "Equal to the diameter"
      },
      correctAnswer: "A",
      explanation: "By standard circle geometry, the lengths of two tangents drawn from a single external point to a circle are strictly equal.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Altitudes, Angle Bisectors, Perpendicular Bisectors, and Medians",
      question: "In a right-angled triangle with hypotenuse of length $10\\text{ cm}$, what is the radius of its circumscribed circle?",
      options: {
        A: "$5\\text{ cm}$",
        B: "$10\\text{ cm}$",
        C: "$2.5\\text{ cm}$",
        D: "$7.5\\text{ cm}$"
      },
      correctAnswer: "A",
      explanation: "The circumcenter of a right triangle is the midpoint of the hypotenuse, and the circumradius is half the hypotenuse: $R = \\frac{10}{2} = 5\\text{ cm}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch10_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Practical Geometry",
      chapterNumber: 10,
      topic: "Construction of Triangles",
      question: "If the base of an isosceles triangle is $8\\text{ cm}$ and its altitude is $3\\text{ cm}$, what is the length of each of its two equal sides?",
      options: {
        A: "$5\\text{ cm}$",
        B: "$6\\text{ cm}$",
        C: "$7\\text{ cm}$",
        D: "$\\sqrt{73}\\text{ cm}$"
      },
      correctAnswer: "A",
      explanation: "The altitude bisects the base into two segments of $4\\text{ cm}$. In the right triangle formed: $\\text{side}^2 = 3^2 + 4^2 = 9 + 16 = 25 \\implies \\text{side} = 5\\text{ cm}$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ],

  "Basic Statistics": [
    {
      id: "fbise9_math_ch11_11",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Central Tendency",
      question: "Find the Mode of the data set: $4, 7, 2, 7, 5, 9, 7, 3, 2$.",
      options: {
        A: "$7$",
        B: "$2$",
        C: "$5$",
        D: "$9$"
      },
      correctAnswer: "A",
      explanation: "The mode is the value that occurs with greatest frequency. Here $7$ occurs 3 times, which is more than any other value.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_12",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Dispersion",
      question: "What is the Range of the data values: $14, 28, 9, 45, 21, 33$?",
      options: {
        A: "$36$",
        B: "$45$",
        C: "$9$",
        D: "$26$"
      },
      correctAnswer: "A",
      explanation: "$\\text{Range} = X_{\\max} - X_{\\min} = 45 - 9 = 36$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_13",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Central Tendency",
      question: "The sum of the deviations of all values in a dataset from their Arithmetic Mean ($\\sum (x_i - \\bar{x})$) is always equal to:",
      options: {
        A: "$0$",
        B: "$1$",
        C: "$\\text{Variance}$",
        D: "$N$"
      },
      correctAnswer: "A",
      explanation: "A fundamental algebraic property of the arithmetic mean is that the algebraic sum of deviations from the mean is always zero: $\\sum(x - \\bar{x}) = 0$.",
      difficulty: "easy",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_14",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Central Tendency",
      question: "Find the Median of the observations: $12, 5, 8, 19, 21, 15$.",
      options: {
        A: "$13.5$",
        B: "$12$",
        C: "$15$",
        D: "$14$"
      },
      correctAnswer: "A",
      explanation: "Arrange in ascending order: $5, 8, 12, 15, 19, 21$. Since $n = 6$ (even), median is the mean of the 3rd and 4th values: $\\frac{12 + 15}{2} = \\frac{27}{2} = 13.5$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_15",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Frequency distribution and Cumulative frequency",
      question: "In a grouped frequency distribution, the class mark (midpoint $x_i$) of class interval $20 - 29$ is:",
      options: {
        A: "$24.5$",
        B: "$25$",
        C: "$24$",
        D: "$9$"
      },
      correctAnswer: "A",
      explanation: "$\\text{Class Mark} = \\frac{\\text{Lower limit} + \\text{Upper limit}}{2} = \\frac{20 + 29}{2} = \\frac{49}{2} = 24.5$.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_16",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Histograms and Frequency polygons",
      question: "A Histogram is a graphical display composed of adjacent rectangles whose areas are proportional to:",
      options: {
        A: "Class frequencies",
        B: "Cumulative frequencies",
        C: "Class marks",
        D: "Relative percentages"
      },
      correctAnswer: "A",
      explanation: "A histogram is constructed with continuous class boundaries on the horizontal axis and frequencies on the vertical axis; the area of each adjacent rectangle represents the frequency of that class.",
      difficulty: "medium",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_17",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Dispersion",
      question: "If the variance of a dataset is $36$, what is its Standard Deviation ($S$)?",
      options: {
        A: "$6$",
        B: "$18$",
        C: "$1296$",
        D: "$\\sqrt{6}$"
      },
      correctAnswer: "A",
      explanation: "Standard deviation is the positive square root of the variance: $S = \\sqrt{\\text{Variance}} = \\sqrt{36} = 6$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_18",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Central Tendency",
      question: "The mean of $5$ numbers is $18$. If one number is excluded, the mean becomes $16$. What was the excluded number?",
      options: {
        A: "$26$",
        B: "$24$",
        C: "$20$",
        D: "$28$"
      },
      correctAnswer: "A",
      explanation: "Sum of 5 numbers $= 5 \\times 18 = 90$. Sum of remaining 4 numbers $= 4 \\times 16 = 64$. Excluded number $= 90 - 64 = 26$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_19",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Central Tendency",
      question: "Which measure of central tendency is uniquely suited for qualitative/categorical data?",
      options: {
        A: "Mode",
        B: "Arithmetic Mean",
        C: "Geometric Mean",
        D: "Harmonic Mean"
      },
      correctAnswer: "A",
      explanation: "The mode can be determined for non-numerical (nominal/categorical) data by identifying the most frequently occurring category, whereas means require arithmetic computation on numerical values.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    },
    {
      id: "fbise9_math_ch11_20",
      board: "fbise",
      grade: "9",
      subject: "Mathematics",
      chapter: "Basic Statistics",
      chapterNumber: 11,
      topic: "Measures of Dispersion",
      question: "If a constant value $k = 5$ is added to every observation in a dataset with variance $S^2 = 16$, the new variance will be:",
      options: {
        A: "$16$",
        B: "$21$",
        C: "$80$",
        D: "$25$"
      },
      correctAnswer: "A",
      explanation: "Adding a constant to every observation shifts the distribution but does not change its spread (dispersion). Hence, variance remains invariant under change of origin: $\\text{New Variance} = 16$.",
      difficulty: "hard",
      verified: true,
      source: "curriculum-bank",
      createdAt: "2026-08-25T21:35:00.000Z"
    }
  ]
};
