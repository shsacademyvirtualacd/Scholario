import fs from 'fs';
import path from 'path';

export interface StoredMCQ {
  id: string;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  chapterNumber?: number;
  topic?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  verified: boolean;
  source: string;
  createdAt: string;
}

const NOW = new Date().toISOString();

export const PHYSICS_GRADE_9_CHAPTERS: Record<string, { chapterNumber: number; questions: Omit<StoredMCQ, 'id' | 'board' | 'grade' | 'subject' | 'chapter' | 'chapterNumber' | 'topic' | 'verified' | 'source' | 'createdAt'>[] }> = {
  'Physical Quantities and Measurement': {
    chapterNumber: 1,
    questions: [
      {
        question: 'Which of the following is an SI base unit?',
        options: {
          A: 'Kelvin (K)',
          B: 'Newton (N)',
          C: 'Joule (J)',
          D: 'Pascal (Pa)',
        },
        correctAnswer: 'A',
        explanation: 'Kelvin (K) is the SI fundamental base unit for thermodynamic temperature. Newton, Joule, and Pascal are derived units.',
        difficulty: 'easy',
      },
      {
        question: 'A Vernier Calipers has a smallest main scale division of $1\\text{ mm}$ and $20$ divisions on its vernier scale. What is its least count?',
        options: {
          A: '$0.05\\text{ mm}$ ($0.005\\text{ cm}$)',
          B: '$0.02\\text{ mm}$',
          C: '$0.5\\text{ mm}$',
          D: '$0.1\\text{ mm}$',
        },
        correctAnswer: 'A',
        explanation: 'Least Count = $\\frac{\\text{Smallest Main Scale Division}}{\\text{Total Vernier Divisions}} = \\frac{1\\text{ mm}}{20} = 0.05\\text{ mm} = 0.005\\text{ cm}$.',
        difficulty: 'medium',
      },
      {
        question: 'How many significant figures are present in the measurement $0.005080\\text{ kg}$?',
        options: {
          A: '4',
          B: '3',
          C: '6',
          D: '7',
        },
        correctAnswer: 'A',
        explanation: 'Leading zeros are not significant. The significant digits are 5, 0, 8, and the trailing zero after the decimal (4 significant figures).',
        difficulty: 'easy',
      },
      {
        question: 'Express the mean distance from Earth to the Moon, approximately $384,400,000\\text{ meters}$, in standard scientific notation:',
        options: {
          A: '$3.844 \\times 10^8\\text{ m}$',
          B: '$38.44 \\times 10^7\\text{ m}$',
          C: '$3.844 \\times 10^6\\text{ m}$',
          D: '$0.3844 \\times 10^9\\text{ m}$',
        },
        correctAnswer: 'A',
        explanation: 'Standard scientific notation requires exactly one non-zero digit before the decimal point: $3.844 \\times 10^8\\text{ m}$.',
        difficulty: 'medium',
      },
      {
        question: 'A micrometer screw gauge has a pitch of $0.5\\text{ mm}$ and $50$ divisions on its circular scale. What is its least count?',
        options: {
          A: '$0.01\\text{ mm}$ ($0.001\\text{ cm}$)',
          B: '$0.1\\text{ mm}$',
          C: '$0.001\\text{ mm}$',
          D: '$0.05\\text{ mm}$',
        },
        correctAnswer: 'A',
        explanation: 'Least Count = $\\frac{\\text{Pitch}}{\\text{Total Circular Divisions}} = \\frac{0.5\\text{ mm}}{50} = 0.01\\text{ mm} = 0.001\\text{ cm}$.',
        difficulty: 'hard',
      },
      {
        question: 'When the jaws of a vernier calipers are closed and the zero line of the vernier scale lies to the right of the zero of the main scale, the zero error is:',
        options: {
          A: 'Positive, and the correction must be subtracted from the observed reading',
          B: 'Negative, and the correction must be added to the observed reading',
          C: 'Positive, and the correction must be added to the observed reading',
          D: 'Negative, and the correction must be subtracted from the observed reading',
        },
        correctAnswer: 'A',
        explanation: 'When the vernier zero lies to the right of the main scale zero, the instrument over-reads (positive zero error), so the zero correction is subtracted.',
        difficulty: 'medium',
      },
      {
        question: 'The SI prefix "nano" ($\\text{n}$) corresponds to a multiplying factor of:',
        options: {
          A: '$10^{-9}$',
          B: '$10^{-6}$',
          C: '$10^{-12}$',
          D: '$10^{-3}$',
        },
        correctAnswer: 'A',
        explanation: 'Nano ($\\text{n}$) represents $10^{-9}$, micro ($\\mu$) is $10^{-6}$, and pico ($\\text{p}$) is $10^{-12}$.',
        difficulty: 'easy',
      },
      {
        question: 'When measuring the volume of water with a measuring cylinder, the correct reading is obtained by keeping the line of sight level with the:',
        options: {
          A: 'Lowest point of the concave meniscus',
          B: 'Highest point of the concave meniscus',
          C: 'Middle plane between the curved edges',
          D: 'Top rim of the cylinder',
        },
        correctAnswer: 'A',
        explanation: 'For water (a wetting liquid), surface tension forms a concave meniscus; parallax error is avoided by aligning the eye with the bottom of the curve.',
        difficulty: 'medium',
      },
      {
        question: 'In adding $12.5\\text{ cm}$ and $1.25\\text{ cm}$, the correct answer expressed to the appropriate precision is:',
        options: {
          A: '$13.8\\text{ cm}$',
          B: '$13.75\\text{ cm}$',
          C: '$13.750\\text{ cm}$',
          D: '$14\\text{ cm}$',
        },
        correctAnswer: 'A',
        explanation: 'In addition, the final result is rounded to the fewest decimal places of the terms ($12.5$ has 1 decimal place, so $13.75$ rounds to $13.8\\text{ cm}$).',
        difficulty: 'hard',
      },
      {
        question: 'Which of the following is a derived physical quantity?',
        options: {
          A: 'Electric charge ($Q$)',
          B: 'Length ($L$)',
          C: 'Mass ($m$)',
          D: 'Electric current ($I$)',
        },
        correctAnswer: 'A',
        explanation: 'Electric charge ($Q = I \\times t$, measured in Coulombs = $\\text{A}\\cdot\\text{s}$) is a derived quantity, while length, mass, and current are base quantities.',
        difficulty: 'easy',
      },
    ],
  },

  'Kinematics': {
    chapterNumber: 2,
    questions: [
      {
        question: 'The motion of the rider on a Ferris wheel or the motion of Earth revolving around the Sun in an orbit is classified as:',
        options: {
          A: 'Circular motion (Translatory)',
          B: 'Rotatory motion',
          C: 'Vibratory motion',
          D: 'Random motion',
        },
        correctAnswer: 'A',
        explanation: 'In circular motion, every point on the body moves along a circular path about an external axis, which is a type of translatory motion.',
        difficulty: 'easy',
      },
      {
        question: 'A car travels with a uniform velocity of $90\\text{ km/h}$. What is its speed in meters per second ($\\text{m/s}$)?',
        options: {
          A: '$25\\text{ m/s}$',
          B: '$30\\text{ m/s}$',
          C: '$20\\text{ m/s}$',
          D: '$15\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'To convert $\\text{km/h}$ to $\\text{m/s}$, multiply by $\\frac{5}{18}$: $90 \\times \\frac{5}{18} = 25\\text{ m/s}$.',
        difficulty: 'medium',
      },
      {
        question: 'Which of the following physical quantities is a vector quantity requiring both magnitude and direction?',
        options: {
          A: 'Displacement',
          B: 'Distance',
          C: 'Speed',
          D: 'Time',
        },
        correctAnswer: 'A',
        explanation: 'Displacement is the shortest directed vector distance between initial and final points. Distance, speed, and time are scalars.',
        difficulty: 'easy',
      },
      {
        question: 'A train starts from rest and accelerates uniformly at $1.5\\text{ m/s}^2$. What distance does it travel in $20\\text{ seconds}$?',
        options: {
          A: '$300\\text{ m}$',
          B: '$150\\text{ m}$',
          C: '$600\\text{ m}$',
          D: '$30\\text{ m}$',
        },
        correctAnswer: 'A',
        explanation: 'Using the 2nd equation of motion: $S = v_i t + \\frac{1}{2}at^2 = 0 + \\frac{1}{2}(1.5)(20^2) = 0.5 \\times 1.5 \\times 400 = 300\\text{ m}$.',
        difficulty: 'hard',
      },
      {
        question: 'The area under a Speed-Time graph represents which physical quantity?',
        options: {
          A: 'Total distance traveled',
          B: 'Acceleration',
          C: 'Instantaneous speed',
          D: 'Force applied',
        },
        correctAnswer: 'A',
        explanation: 'The area bounded by a speed-time curve and the time axis is the product of speed and time, giving total distance traveled ($S = v \\times t$).',
        difficulty: 'medium',
      },
      {
        question: 'A ball is thrown vertically upward with an initial velocity of $30\\text{ m/s}$. Taking $g = 10\\text{ m/s}^2$, what is the maximum height attained by the ball?',
        options: {
          A: '$45\\text{ m}$',
          B: '$90\\text{ m}$',
          C: '$30\\text{ m}$',
          D: '$60\\text{ m}$',
        },
        correctAnswer: 'A',
        explanation: 'At maximum height $v_f = 0$. Using $2(-g)h = v_f^2 - v_i^2 \\implies 2(-10)h = 0 - 30^2 \\implies -20h = -900 \\implies h = 45\\text{ m}$.',
        difficulty: 'hard',
      },
      {
        question: 'A car moving at $24\\text{ m/s}$ applies brakes that produce a uniform deceleration (retardation) of $3\\text{ m/s}^2$. How long does it take to come to a complete stop?',
        options: {
          A: '$8\\text{ s}$',
          B: '$6\\text{ s}$',
          C: '$12\\text{ s}$',
          D: '$72\\text{ s}$',
        },
        correctAnswer: 'A',
        explanation: 'Using $v_f = v_i + at \\implies 0 = 24 + (-3)t \\implies 3t = 24 \\implies t = 8\\text{ s}$.',
        difficulty: 'medium',
      },
      {
        question: 'The slope (gradient) of a Distance-Time graph gives the:',
        options: {
          A: 'Speed of the object',
          B: 'Acceleration of the object',
          C: 'Distance traveled',
          D: 'Inertia',
        },
        correctAnswer: 'A',
        explanation: 'The gradient of distance against time is $\\frac{\\Delta S}{\\Delta t} = \\text{Speed}$.',
        difficulty: 'easy',
      },
      {
        question: 'An object starting from rest accelerates uniformly at $4\\text{ m/s}^2$ over a distance of $50\\text{ m}$. What is its final velocity?',
        options: {
          A: '$20\\text{ m/s}$',
          B: '$10\\text{ m/s}$',
          C: '$200\\text{ m/s}$',
          D: '$40\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'Using $2aS = v_f^2 - v_i^2 \\implies 2(4)(50) = v_f^2 - 0 \\implies 400 = v_f^2 \\implies v_f = 20\\text{ m/s}$.',
        difficulty: 'hard',
      },
      {
        question: 'When a stone and a feather are dropped simultaneously in a vacuum tube where air resistance is zero:',
        options: {
          A: 'Both fall with the same constant acceleration $g$ and reach the bottom together',
          B: 'The stone falls faster because it has greater mass',
          C: 'The feather floats indefinitely',
          D: 'The stone accelerates while the feather moves at constant speed',
        },
        correctAnswer: 'A',
        explanation: 'In a vacuum, gravitational acceleration ($g$) is independent of mass or surface area, so all free-falling objects accelerate at the identical rate $g$.',
        difficulty: 'medium',
      },
    ],
  },

  'Dynamics-I': {
    chapterNumber: 3,
    questions: [
      {
        question: 'Newton’s First Law of Motion is also known as the Law of:',
        options: {
          A: 'Inertia',
          B: 'Conservation of Momentum',
          C: 'Action and Reaction',
          D: 'Gravitation',
        },
        correctAnswer: 'A',
        explanation: 'Newton’s First Law defines inertia — the property of a body to resist changes in its state of rest or uniform motion in a straight line.',
        difficulty: 'easy',
      },
      {
        question: 'What net force is required to produce an acceleration of $3.5\\text{ m/s}^2$ in a body of mass $6\\text{ kg}$?',
        options: {
          A: '$21\\text{ N}$',
          B: '$17.5\\text{ N}$',
          C: '$1.71\\text{ N}$',
          D: '$9.5\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: 'From Newton’s Second Law: $F = ma = 6\\text{ kg} \\times 3.5\\text{ m/s}^2 = 21\\text{ N}$.',
        difficulty: 'medium',
      },
      {
        question: 'The quantity of matter in a body is its mass (constant everywhere), whereas its weight:',
        options: {
          A: 'Is the gravitational pull on it ($W=mg$) and varies with location',
          B: 'Is a scalar quantity measured in kilograms',
          C: 'Remains identical on all planets',
          D: 'Is measured using a physical beam balance',
        },
        correctAnswer: 'A',
        explanation: 'Weight is a downward vector force ($W=mg$) dependent on the local acceleration due to gravity $g$.',
        difficulty: 'easy',
      },
      {
        question: 'An astronaut has a mass of $60\\text{ kg}$. If the acceleration due to gravity on the Moon is $g_m = 1.6\\text{ m/s}^2$, what is the astronaut\'s weight on the Moon?',
        options: {
          A: '$96\\text{ N}$',
          B: '$600\\text{ N}$',
          C: '$37.5\\text{ N}$',
          D: '$60\\text{ kg}$',
        },
        correctAnswer: 'A',
        explanation: '$W = m \\times g_m = 60\\text{ kg} \\times 1.6\\text{ m/s}^2 = 96\\text{ N}$.',
        difficulty: 'hard',
      },
      {
        question: 'According to Newton’s Third Law of Motion, action and reaction forces:',
        options: {
          A: 'Act on two different interacting bodies in opposite directions simultaneously',
          B: 'Act on the same body and cancel each other out',
          C: 'Occur with a time delay after action',
          D: 'Have different magnitudes depending on the mass of the bodies',
        },
        correctAnswer: 'A',
        explanation: 'Action and reaction act on separate bodies simultaneously with equal magnitude and opposite direction, so they never cancel each other.',
        difficulty: 'medium',
      },
      {
        question: 'Two masses $m_1 = 6\\text{ kg}$ and $m_2 = 4\\text{ kg}$ are attached to the ends of a string passing over a frictionless pulley and move vertically ($g = 10\\text{ m/s}^2$). What is the acceleration of the system?',
        options: {
          A: '$2\\text{ m/s}^2$',
          B: '$4\\text{ m/s}^2$',
          C: '$1\\text{ m/s}^2$',
          D: '$5\\text{ m/s}^2$',
        },
        correctAnswer: 'A',
        explanation: 'For vertical Atwood motion: $a = \\frac{m_1 - m_2}{m_1 + m_2} g = \\frac{6 - 4}{6 + 4} \\times 10 = \\frac{2}{10} \\times 10 = 2\\text{ m/s}^2$.',
        difficulty: 'hard',
      },
      {
        question: 'One Newton ($\\text{N}$) is defined as the force that produces an acceleration of:',
        options: {
          A: '$1\\text{ m/s}^2$ in a body of mass $1\\text{ kg}$',
          B: '$1\\text{ cm/s}^2$ in a body of mass $1\\text{ g}$',
          C: '$10\\text{ m/s}^2$ in a body of mass $1\\text{ kg}$',
          D: '$1\\text{ m/s}^2$ in a body of mass $10\\text{ kg}$',
        },
        correctAnswer: 'A',
        explanation: 'By definition of Newton ($F = ma$): $1\\text{ N} = 1\\text{ kg} \\times 1\\text{ m/s}^2 = 1\\text{ kg}\\cdot\\text{m/s}^2$.',
        difficulty: 'easy',
      },
      {
        question: 'When a fast-moving bus suddenly applies brakes, the passengers jerk forward. This phenomenon is explained by:',
        options: {
          A: 'Inertia of motion resisting the sudden stop',
          B: 'Gravitational force acting forward',
          C: 'Centripetal force of the tires',
          D: 'Friction between passengers and seats',
        },
        correctAnswer: 'A',
        explanation: 'Due to inertia of motion, the upper body of passengers tends to continue forward in its straight-line state of motion when the bus decelerates.',
        difficulty: 'medium',
      },
      {
        question: 'For two masses $m_1 = 3\\text{ kg}$ and $m_2 = 2\\text{ kg}$ hanging vertically from a string passing over a frictionless pulley ($g = 10\\text{ m/s}^2$), what is the tension $T$ in the string?',
        options: {
          A: '$24\\text{ N}$',
          B: '$50\\text{ N}$',
          C: '$12\\text{ N}$',
          D: '$30\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: '$T = \\frac{2 m_1 m_2}{m_1 + m_2} g = \\frac{2(3)(2)}{3 + 2} \\times 10 = \\frac{12}{5} \\times 10 = 24\\text{ N}$.',
        difficulty: 'hard',
      },
      {
        question: 'If the net force acting on an accelerating body is doubled while its mass is halved, the new acceleration becomes:',
        options: {
          A: '4 times the initial acceleration',
          B: '2 times the initial acceleration',
          C: 'Unchanged',
          D: 'Half of the initial acceleration',
        },
        correctAnswer: 'A',
        explanation: 'Since $a = \\frac{F}{m}$, new acceleration $a\' = \\frac{2F}{m/2} = 4\\left(\\frac{F}{m}\\right) = 4a$.',
        difficulty: 'medium',
      },
    ],
  },

  'Dynamics-II': {
    chapterNumber: 4,
    questions: [
      {
        question: 'What is the SI unit of linear momentum ($p = mv$)?',
        options: {
          A: '$\\text{kg}\\cdot\\text{m/s}$ (equivalent to $\\text{N}\\cdot\\text{s}$)',
          B: '$\\text{kg}\\cdot\\text{m/s}^2$',
          C: '$\\text{Joule}\\cdot\\text{s}$',
          D: '$\\text{Newton/meter}$',
        },
        correctAnswer: 'A',
        explanation: '$\\text{Momentum} = \\text{mass} \\times \\text{velocity} = \\text{kg}\\cdot\\text{m/s} = \\text{N}\\cdot\\text{s}$.',
        difficulty: 'easy',
      },
      {
        question: 'A bullet of mass $0.02\\text{ kg}$ is fired from a gun of mass $4\\text{ kg}$ with a muzzle velocity of $400\\text{ m/s}$. What is the recoil velocity of the gun?',
        options: {
          A: '$-2\\text{ m/s}$ (backward)',
          B: '$-4\\text{ m/s}$',
          C: '$-0.5\\text{ m/s}$',
          D: '$-8\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'By conservation of momentum: $m_g v_g + m_b v_b = 0 \\implies v_g = -\\frac{m_b v_b}{m_g} = -\\frac{0.02 \\times 400}{4} = -2\\text{ m/s}$.',
        difficulty: 'hard',
      },
      {
        question: 'A stone of mass $0.5\\text{ kg}$ is tied to a string of length $0.8\\text{ m}$ and rotated in a horizontal circle with a constant speed of $4\\text{ m/s}$. Find the centripetal force:',
        options: {
          A: '$10\\text{ N}$',
          B: '$20\\text{ N}$',
          C: '$5\\text{ N}$',
          D: '$8\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: '$F_c = \\frac{m v^2}{r} = \\frac{0.5 \\times (4)^2}{0.8} = \\frac{0.5 \\times 16}{0.8} = \\frac{8}{0.8} = 10\\text{ N}$.',
        difficulty: 'medium',
      },
      {
        question: 'Rolling friction is roughly 100 to 1000 times less than sliding friction because:',
        options: {
          A: 'The points of contact touch momentarily without continuous sliding and cold welds do not rupture violently',
          B: 'Rolling objects experience zero gravity',
          C: 'Friction vanishes completely during rotational movement',
          D: 'Rolling objects have smaller masses',
        },
        correctAnswer: 'A',
        explanation: 'In rolling motion, contact surfaces touch and peel away momentarily with minimal interlocking cold-weld shearing compared to sliding.',
        difficulty: 'easy',
      },
      {
        question: 'Outer edges of curved curved roads are raised higher than inner edges (banking of roads) in order to:',
        options: {
          A: 'Provide the necessary centripetal force component to prevent skidding without relying purely on friction',
          B: 'Increase the speed limit arbitrarily',
          C: 'Stop rainwater from collecting on the road',
          D: 'Decrease the normal reaction force',
        },
        correctAnswer: 'A',
        explanation: 'Banking resolves the normal reaction into a horizontal component ($N\\sin\\theta$) that supplies the necessary centripetal force for safe turning.',
        difficulty: 'medium',
      },
      {
        question: 'A block of mass $5\\text{ kg}$ rests on a horizontal wooden table ($g = 10\\text{ m/s}^2$). If the coefficient of static friction $\\mu_s = 0.4$, what is the maximum limiting friction force $F_s$?',
        options: {
          A: '$20\\text{ N}$',
          B: '$50\\text{ N}$',
          C: '$12.5\\text{ N}$',
          D: '$2\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: 'Normal reaction $R = mg = 5 \\times 10 = 50\\text{ N}$. Maximum static friction $F_s = \\mu_s R = 0.4 \\times 50 = 20\\text{ N}$.',
        difficulty: 'hard',
      },
      {
        question: 'If the speed of a car moving around a circular curve of radius $r$ is doubled, the required centripetal force becomes:',
        options: {
          A: '4 times greater',
          B: '2 times greater',
          C: '8 times greater',
          D: 'Half as much',
        },
        correctAnswer: 'A',
        explanation: 'Because $F_c = \\frac{mv^2}{r}$, centripetal force is proportional to $v^2$. Doubling the velocity ($2v$) increases $F_c$ by $2^2 = 4$ times.',
        difficulty: 'easy',
      },
      {
        question: 'In a centrifuge cream separator machine, the heavier milk components are separated from lighter butter-fat cream because:',
        options: {
          A: 'Denser skimmed milk particles require larger centripetal force and are thrown outwards toward the walls, while lighter cream gathers near the axis',
          B: 'Cream is magnetic and adheres to the spindle',
          C: 'Denser particles evaporate under high rotational speed',
          D: 'Gravitational pull separates them by boiling point',
        },
        correctAnswer: 'A',
        explanation: 'Denser skimmed milk requires more centripetal force ($F_c \\propto m$) and moves outward to the periphery, while lighter cream collects at the center.',
        difficulty: 'medium',
      },
      {
        question: 'A force of $15\\text{ N}$ acts on a body and changes its momentum by $60\\text{ kg}\\cdot\\text{m/s}$. How long was the force applied?',
        options: {
          A: '$4\\text{ s}$',
          B: '$0.25\\text{ s}$',
          C: '$900\\text{ s}$',
          D: '$45\\text{ s}$',
        },
        correctAnswer: 'A',
        explanation: 'From Newton\'s second law in terms of momentum: $F = \\frac{\\Delta p}{\\Delta t} \\implies \\Delta t = \\frac{\\Delta p}{F} = \\frac{60}{15} = 4\\text{ s}$.',
        difficulty: 'hard',
      },
      {
        question: 'Which of the following is NOT a standard method used to reduce friction in machinery?',
        options: {
          A: 'Making contact surfaces rougher with coarse sand',
          B: 'Using lubricants like oil and grease',
          C: 'Installing ball bearings or roller bearings',
          D: 'Streamlining vehicle shapes',
        },
        correctAnswer: 'A',
        explanation: 'Roughening surfaces increases microscopic cold-weld points and friction. Lubricants, ball bearings, and streamlining reduce friction.',
        difficulty: 'easy',
      },
    ],
  },

  'Pressure and Deformation in Solids': {
    chapterNumber: 5,
    questions: [
      {
        question: 'What is the SI unit of pressure ($P = F/A$)?',
        options: {
          A: '$\\text{Pascal (Pa)}$ or $\\text{N/m}^2$',
          B: '$\\text{Joule (J)}$',
          C: '$\\text{Newton (N)}$',
          D: '$\\text{Watt (W)}$',
        },
        correctAnswer: 'A',
        explanation: 'Pressure is force per unit area ($P = F/A$), with SI unit $\\text{N/m}^2$, defined as the Pascal ($\\text{Pa}$).',
        difficulty: 'easy',
      },
      {
        question: 'In a hydraulic lift, a force $F_1 = 100\\text{ N}$ is applied to a small piston of cross-sectional area $A_1 = 0.02\\text{ m}^2$. What load force $F_2$ can be lifted by the larger piston of area $A_2 = 0.8\\text{ m}^2$?',
        options: {
          A: '$4000\\text{ N}$',
          B: '$2000\\text{ N}$',
          C: '$160\\text{ N}$',
          D: '$800\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: 'By Pascal\'s Principle: $\\frac{F_2}{A_2} = \\frac{F_1}{A_1} \\implies F_2 = 100 \\times \\frac{0.8}{0.02} = 100 \\times 40 = 4000\\text{ N}$.',
        difficulty: 'hard',
      },
      {
        question: 'Calculate the liquid pressure at a depth of $8\\text{ m}$ below the surface in a lake of water ($\\rho = 1000\\text{ kg/m}^3, g = 10\\text{ m/s}^2$):',
        options: {
          A: '$80,000\\text{ Pa}$ ($80\\text{ kPa}$)',
          B: '$8,000\\text{ Pa}$',
          C: '$800\\text{ Pa}$',
          D: '$125\\text{ Pa}$',
        },
        correctAnswer: 'A',
        explanation: '$P = \\rho g h = 1000\\text{ kg/m}^3 \\times 10\\text{ m/s}^2 \\times 8\\text{ m} = 80,000\\text{ Pa} = 80\\text{ kPa}$.',
        difficulty: 'medium',
      },
      {
        question: 'In a standard mercury barometer at sea level, the vertical height of the mercury column supported by atmospheric pressure is approximately:',
        options: {
          A: '$760\\text{ mm}$ ($76\\text{ cm}$ or $1.013 \\times 10^5\\text{ Pa}$)',
          B: '$1000\\text{ mm}$',
          C: '$76\\text{ mm}$',
          D: '$10\\text{ m}$',
        },
        correctAnswer: 'A',
        explanation: 'Standard atmospheric pressure at sea level supports a mercury column of $760\\text{ mm}$ ($76\\text{ cm}$ of $\\text{Hg}$), equivalent to $101.3\\text{ kPa}$.',
        difficulty: 'easy',
      },
      {
        question: 'A solid metal block of volume $0.003\\text{ m}^3$ is completely submerged in water ($\\rho = 1000\\text{ kg/m}^3, g = 10\\text{ m/s}^2$). What is the buoyant upthrust force exerted on the block?',
        options: {
          A: '$30\\text{ N}$',
          B: '$300\\text{ N}$',
          C: '$3\\text{ N}$',
          D: '$0.3\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: 'By Archimedes’ Principle, Upthrust $F_B = \\rho_{\\text{liquid}} g V_{\\text{displaced}} = 1000 \\times 10 \\times 0.003 = 30\\text{ N}$.',
        difficulty: 'hard',
      },
      {
        question: 'Hooke’s Law states that within the elastic limit of a material:',
        options: {
          A: 'Stress is directly proportional to Strain ($\\text{Stress} \\propto \\text{Strain}$)',
          B: 'Stress is inversely proportional to Strain',
          C: 'Extension is independent of the stretching force',
          D: 'Stress equals Young\'s modulus times force',
        },
        correctAnswer: 'A',
        explanation: 'Hooke\'s Law states that within the elastic limit, strain is directly proportional to applied stress ($\\frac{\\text{Stress}}{\\text{Strain}} = \\text{Constant}$).',
        difficulty: 'medium',
      },
      {
        question: 'A force of $12\\text{ N}$ produces an extension of $0.04\\text{ m}$ in a helical spring within its elastic limit. What is the spring constant $k$?',
        options: {
          A: '$300\\text{ N/m}$',
          B: '$0.48\\text{ N/m}$',
          C: '$48\\text{ N/m}$',
          D: '$0.0033\\text{ N/m}$',
        },
        correctAnswer: 'A',
        explanation: '$k = \\frac{F}{x} = \\frac{12\\text{ N}}{0.04\\text{ m}} = 300\\text{ N/m}$.',
        difficulty: 'hard',
      },
      {
        question: 'Tensile strain is defined as the ratio of change in length to the original length ($\\frac{\\Delta L}{L_0}$). Its SI unit is:',
        options: {
          A: 'Dimensionless (has no unit)',
          B: '$\\text{N/m}^2$',
          C: '$\\text{meter (m)}$',
          D: '$\\text{Pascal (Pa)}$',
        },
        correctAnswer: 'A',
        explanation: 'Strain is a ratio of two lengths ($\\text{m}/\\text{m}$), which cancel out, making strain a dimensionless quantity.',
        difficulty: 'easy',
      },
      {
        question: 'An object will float partially submerged in a liquid if the average density of the object is:',
        options: {
          A: 'Less than the density of the liquid',
          B: 'Greater than the density of the liquid',
          C: 'Equal to twice the density of the liquid',
          D: 'Infinite',
        },
        correctAnswer: 'A',
        explanation: 'A body floats when its weight is balanced by upthrust before complete submergence, which requires its density to be less than the liquid density.',
        difficulty: 'medium',
      },
      {
        question: 'A wire of original length $2\\text{ m}$ and cross-sectional area $1 \\times 10^{-6}\\text{ m}^2$ is stretched by $0.001\\text{ m}$ under a tensile load of $100\\text{ N}$. What is the Young\'s Modulus of the wire?',
        options: {
          A: '$2 \\times 10^{11}\\text{ N/m}^2$',
          B: '$2 \\times 10^8\\text{ N/m}^2$',
          C: '$1 \\times 10^{11}\\text{ N/m}^2$',
          D: '$5 \\times 10^9\\text{ N/m}^2$',
        },
        correctAnswer: 'A',
        explanation: '$Y = \\frac{F L_0}{A \\Delta L} = \\frac{100 \\times 2}{(1 \\times 10^{-6}) \\times 0.001} = \\frac{200}{10^{-9}} = 2 \\times 10^{11}\\text{ Pa}$.',
        difficulty: 'hard',
      },
    ],
  },

  'Work and Energy': {
    chapterNumber: 6,
    questions: [
      {
        question: 'Work done is defined as $W = F s \\cos\\theta$. If the force is applied perpendicular to the direction of displacement ($\\theta = 90^\\circ$), the work done is:',
        options: {
          A: 'Zero ($0\\text{ J}$)',
          B: 'Maximum',
          C: 'Negative',
          D: 'Infinite',
        },
        correctAnswer: 'A',
        explanation: 'Since $\\cos 90^\\circ = 0$, $W = F s \\cos 90^\\circ = 0\\text{ Joules}$ (e.g. centripetal force does zero work).',
        difficulty: 'easy',
      },
      {
        question: 'A car of mass $1200\\text{ kg}$ is traveling at a speed of $20\\text{ m/s}$. What is its kinetic energy?',
        options: {
          A: '$240,000\\text{ J}$ ($240\\text{ kJ}$)',
          B: '$120,000\\text{ J}$',
          C: '$480,000\\text{ J}$',
          D: '$24,000\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$E_k = \\frac{1}{2} m v^2 = \\frac{1}{2}(1200)(20^2) = 600 \\times 400 = 240,000\\text{ J} = 240\\text{ kJ}$.',
        difficulty: 'hard',
      },
      {
        question: 'An object of mass $5\\text{ kg}$ is raised to a vertical height of $12\\text{ m}$ above the ground ($g = 10\\text{ m/s}^2$). What is its gravitational potential energy?',
        options: {
          A: '$600\\text{ J}$',
          B: '$60\\text{ J}$',
          C: '$120\\text{ J}$',
          D: '$300\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$E_p = mgh = 5\\text{ kg} \\times 10\\text{ m/s}^2 \\times 12\\text{ m} = 600\\text{ J}$.',
        difficulty: 'medium',
      },
      {
        question: 'An electric crane lifts a load of $5000\\text{ N}$ through a vertical height of $18\\text{ m}$ in $30\\text{ seconds}$. What is the useful power output of the crane?',
        options: {
          A: '$3000\\text{ W}$ ($3\\text{ kW}$)',
          B: '$1500\\text{ W}$',
          C: '$90,000\\text{ W}$',
          D: '$600\\text{ W}$',
        },
        correctAnswer: 'A',
        explanation: '$P = \\frac{W}{t} = \\frac{F \\times h}{t} = \\frac{5000 \\times 18}{30} = \\frac{90000}{30} = 3000\\text{ W} = 3\\text{ kW}$.',
        difficulty: 'hard',
      },
      {
        question: 'A generator consumes $800\\text{ J}$ of chemical fuel energy and produces $600\\text{ J}$ of useful electrical energy. What is its percentage efficiency?',
        options: {
          A: '$75\\%$',
          B: '$80\\%$',
          C: '$25\\%$',
          D: '$133\\%$',
        },
        correctAnswer: 'A',
        explanation: '$\\text{Efficiency} = \\frac{\\text{Useful Output}}{\\text{Total Input}} \\times 100 = \\frac{600}{800} \\times 100 = 75\\%$.',
        difficulty: 'medium',
      },
      {
        question: 'One commercial unit of electrical energy, 1 kilowatt-hour ($1\\text{ kWh}$), is equal to:',
        options: {
          A: '$3.6 \\times 10^6\\text{ J}$ ($3.6\\text{ MJ}$)',
          B: '$3.6 \\times 10^3\\text{ J}$',
          C: '$1000\\text{ J}$',
          D: '$3600\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$1\\text{ kWh} = 1000\\text{ W} \\times 3600\\text{ s} = 3.6 \\times 10^6\\text{ Joules} = 3.6\\text{ MJ}$.',
        difficulty: 'easy',
      },
      {
        question: 'One horsepower ($1\\text{ hp}$) in standard British engineering units equals how many Watts?',
        options: {
          A: '$746\\text{ Watts}$',
          B: '$1000\\text{ Watts}$',
          C: '$500\\text{ Watts}$',
          D: '$3600\\text{ Watts}$',
        },
        correctAnswer: 'A',
        explanation: '$1\\text{ hp} = 746\\text{ W}$.',
        difficulty: 'easy',
      },
      {
        question: 'A $2\\text{ kg}$ ball drops from rest from a height of $20\\text{ m}$ ($g = 10\\text{ m/s}^2$). Ignoring air resistance, what is its velocity just before striking the ground?',
        options: {
          A: '$20\\text{ m/s}$',
          B: '$10\\text{ m/s}$',
          C: '$40\\text{ m/s}$',
          D: '$200\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'By conservation of mechanical energy: $mgh = \\frac{1}{2}mv^2 \\implies v = \\sqrt{2gh} = \\sqrt{2(10)(20)} = \\sqrt{400} = 20\\text{ m/s}$.',
        difficulty: 'hard',
      },
      {
        question: 'Which of the following is a renewable energy resource that does not emit greenhouse gases during operation?',
        options: {
          A: 'Geothermal and Hydroelectric energy',
          B: 'Coal',
          C: 'Natural Gas',
          D: 'Petroleum',
        },
        correctAnswer: 'A',
        explanation: 'Hydroelectric and geothermal sources naturally replenish without burning fossil hydrocarbons.',
        difficulty: 'medium',
      },
      {
        question: 'According to the Work-Energy Theorem, the net work done on an object equals the change in its:',
        options: {
          A: 'Kinetic Energy ($\\Delta E_k$)',
          B: 'Momentum only',
          C: 'Rest Mass',
          D: 'Temperature only',
        },
        correctAnswer: 'A',
        explanation: '$W_{\\text{net}} = \\Delta E_k = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$.',
        difficulty: 'easy',
      },
    ],
  },

  'Density and Temperature': {
    chapterNumber: 7,
    questions: [
      {
        question: 'Convert a room temperature of $37^\\circ\\text{C}$ (human body temperature) into the absolute Kelvin scale:',
        options: {
          A: '$310\\text{ K}$',
          B: '$236\\text{ K}$',
          C: '$373\\text{ K}$',
          D: '$273\\text{ K}$',
        },
        correctAnswer: 'A',
        explanation: '$T(\\text{K}) = \\theta(^\\circ\\text{C}) + 273 = 37 + 273 = 310\\text{ K}$.',
        difficulty: 'easy',
      },
      {
        question: 'How much heat energy ($Q$) is required to raise the temperature of $3\\text{ kg}$ of water from $25^\\circ\\text{C}$ to $45^\\circ\\text{C}$ (given specific heat of water $c = 4200\\text{ J/(kg}\\cdot\\text{K)}$)?',
        options: {
          A: '$252,000\\text{ J}$ ($252\\text{ kJ}$)',
          B: '$126,000\\text{ J}$',
          C: '$84,000\\text{ J}$',
          D: '$504,000\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$Q = mc\\Delta T = 3\\text{ kg} \\times 4200\\text{ J/(kg}\\cdot\\text{K)} \\times (45 - 25)\\text{ K} = 3 \\times 4200 \\times 20 = 252,000\\text{ J} = 252\\text{ kJ}$.',
        difficulty: 'hard',
      },
      {
        question: 'A block of copper has a mass of $890\\text{ g}$ and a volume of $100\\text{ cm}^3$. What is its density in SI units ($\\text{kg/m}^3$)?',
        options: {
          A: '$8900\\text{ kg/m}^3$ ($8.9\\text{ g/cm}^3$)',
          B: '$890\\text{ kg/m}^3$',
          C: '$89\\text{ kg/m}^3$',
          D: '$0.89\\text{ kg/m}^3$',
        },
        correctAnswer: 'A',
        explanation: '$\\rho = \\frac{m}{V} = \\frac{890\\text{ g}}{100\\text{ cm}^3} = 8.9\\text{ g/cm}^3 = 8.9 \\times 1000 = 8900\\text{ kg/m}^3$.',
        difficulty: 'medium',
      },
      {
        question: 'Due to anomalous expansion, water contracts on heating from $0^\\circ\\text{C}$ to $4^\\circ\\text{C}$. At what temperature is the density of water at its maximum ($1000\\text{ kg/m}^3$)?',
        options: {
          A: '$4^\\circ\\text{C}$',
          B: '$0^\\circ\\text{C}$',
          C: '$100^\\circ\\text{C}$',
          D: '$-4^\\circ\\text{C}$',
        },
        correctAnswer: 'A',
        explanation: 'Water reaches minimum volume and maximum density at $4^\\circ\\text{C}$, enabling aquatic organisms to survive beneath frozen lake ice.',
        difficulty: 'easy',
      },
      {
        question: 'How much heat energy is required to melt $0.5\\text{ kg}$ of ice at $0^\\circ\\text{C}$ into water at $0^\\circ\\text{C}$ without change in temperature ($L_f = 3.36 \\times 10^5\\text{ J/kg}$)?',
        options: {
          A: '$168,000\\text{ J}$ ($1.68 \\times 10^5\\text{ J}$)',
          B: '$336,000\\text{ J}$',
          C: '$672,000\\text{ J}$',
          D: '$84,000\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$Q = m L_f = 0.5\\text{ kg} \\times 3.36 \\times 10^5\\text{ J/kg} = 168,000\\text{ J} = 168\\text{ kJ}$.',
        difficulty: 'hard',
      },
      {
        question: 'Water is widely utilized as an effective coolant in automobile car engines because of its exceptionally:',
        options: {
          A: 'High specific heat capacity ($4200\\text{ J/(kg}\\cdot\\text{K)}$)',
          B: 'Low boiling point',
          C: 'High density',
          D: 'Low thermal conductivity',
        },
        correctAnswer: 'A',
        explanation: 'Water absorbs substantial amounts of heat with only a modest rise in temperature due to its high specific heat capacity.',
        difficulty: 'medium',
      },
      {
        question: 'An aluminum rod of initial length $2\\text{ m}$ is heated so its temperature increases by $50^\\circ\\text{C}$. If the coefficient of linear expansion $\\alpha = 2.4 \\times 10^{-5}\\text{ K}^{-1}$, what is the increase in length $\\Delta L$?',
        options: {
          A: '$2.4\\text{ mm}$ ($0.0024\\text{ m}$)',
          B: '$1.2\\text{ mm}$',
          C: '$4.8\\text{ mm}$',
          D: '$0.24\\text{ mm}$',
        },
        correctAnswer: 'A',
        explanation: '$\\Delta L = L_0 \\alpha \\Delta T = 2 \\times (2.4 \\times 10^{-5}) \\times 50 = 240 \\times 10^{-5} = 2.4 \\times 10^{-3}\\text{ m} = 2.4\\text{ mm}$.',
        difficulty: 'hard',
      },
      {
        question: 'Mercury is preferred over water as a thermometric liquid in laboratory thermometers because mercury:',
        options: {
          A: 'Does not wet glass, is opaque with a uniform coefficient of thermal expansion, and has a wide liquid range',
          B: 'Has a higher specific heat capacity than water',
          C: 'Is transparent and colorless',
          D: 'Freezes at $0^\\circ\\text{C}$',
        },
        correctAnswer: 'A',
        explanation: 'Mercury expands uniformly, does not wet glass walls, has a high boiling point ($357^\\circ\\text{C}$), and is easily visible.',
        difficulty: 'easy',
      },
      {
        question: 'At what temperature do the Celsius and Fahrenheit scales indicate the exact same numerical value?',
        options: {
          A: '$-40^\\circ$',
          B: '$0^\\circ$',
          C: '$100^\\circ$',
          D: '$-273^\\circ$',
        },
        correctAnswer: 'A',
        explanation: 'Setting $C = F = x \\implies x = \\frac{9}{5}x + 32 \\implies -\\frac{4}{5}x = 32 \\implies x = -40^\\circ$ (where $-40^\\circ\\text{C} = -40^\\circ\\text{F}$).',
        difficulty: 'medium',
      },
      {
        question: 'For an isotropic solid material, the relationship between its coefficient of volume expansion ($\\beta$) and coefficient of linear expansion ($\\alpha$) is:',
        options: {
          A: '$\\beta = 3\\alpha$',
          B: '$\\beta = \\alpha / 3$',
          C: '$\\beta = 2\\alpha$',
          D: '$\\beta = \\alpha^3$',
        },
        correctAnswer: 'A',
        explanation: 'Volume expansion occurs in three dimensions: $\\beta \\approx 3\\alpha$.',
        difficulty: 'easy',
      },
    ],
  },

  'Magnetism': {
    chapterNumber: 8,
    questions: [
      {
        question: 'Which of the following elements is ferromagnetic and strongly attracted by a permanent magnet?',
        options: {
          A: 'Iron (and Cobalt, Nickel)',
          B: 'Copper',
          C: 'Aluminum',
          D: 'Lead',
        },
        correctAnswer: 'A',
        explanation: 'Iron, cobalt, and nickel have magnetic domains that align strongly with external magnetic fields, making them ferromagnetic.',
        difficulty: 'easy',
      },
      {
        question: 'Outside a permanent bar magnet, the magnetic field lines always emerge from the:',
        options: {
          A: 'North pole and enter the South pole',
          B: 'South pole and enter the North pole',
          C: 'Center toward both poles',
          D: 'Positive pole to negative pole',
        },
        correctAnswer: 'A',
        explanation: 'By convention, external magnetic field lines travel from the North pole to the South pole, forming continuous closed loops.',
        difficulty: 'easy',
      },
      {
        question: 'Why can two magnetic field lines NEVER intersect or cross each other?',
        options: {
          A: 'A compass needle at the point of intersection cannot point in two different directions at the same instant',
          B: 'Magnetic lines are electrostatic charges that repel',
          C: 'Field lines have infinite thickness',
          D: 'Poles always cancel each other',
        },
        correctAnswer: 'A',
        explanation: 'If field lines crossed, the resultant magnetic field at the intersection would have two directions simultaneously, which is impossible.',
        difficulty: 'medium',
      },
      {
        question: 'The magnetic field strength of an electromagnet (solenoid) can be increased by:',
        options: {
          A: 'Increasing the current and increasing the number of turns in the coil',
          B: 'Decreasing the number of turns and reducing current',
          C: 'Using a plastic core instead of soft iron',
          D: 'Reversing the battery polarity only',
        },
        correctAnswer: 'A',
        explanation: 'Magnetic field $B \\propto n I$, so increasing current ($I$), increasing turns per unit length ($n$), or adding a soft iron core boosts electromagnet strength.',
        difficulty: 'hard',
      },
      {
        question: 'Sensitive electronic instruments and mechanical watches are shielded from external stray magnetic fields by enclosing them in a box made of:',
        options: {
          A: 'Soft iron',
          B: 'Copper',
          C: 'Aluminum',
          D: 'Plastic',
        },
        correctAnswer: 'A',
        explanation: 'Soft iron has high magnetic permeability, channeling external field lines through its walls and shielding the interior cavity.',
        difficulty: 'medium',
      },
      {
        question: 'A permanent magnet can be demagnetized most effectively by:',
        options: {
          A: 'Heating it to a high temperature (Curie point) or hammering it while aligned East-West',
          B: 'Cooling it to freezing temperatures',
          C: 'Placing it in a vacuum',
          D: 'Immersing it in pure water',
        },
        correctAnswer: 'A',
        explanation: 'Heating or mechanical hammering agitates magnetic domains, destroying their alignment and demagnetizing the material.',
        difficulty: 'easy',
      },
      {
        question: 'Soft iron is used for making temporary electromagnet cores rather than steel because soft iron:',
        options: {
          A: 'Magnetizes easily and loses its magnetism rapidly when current is switched off (low retentivity)',
          B: 'Retains its magnetism permanently forever',
          C: 'Has higher electrical resistance than steel',
          D: 'Is a non-magnetic insulator',
        },
        correctAnswer: 'A',
        explanation: 'Soft iron has high magnetic permeability and low retentivity, demagnetizing immediately when the magnetizing current ceases.',
        difficulty: 'medium',
      },
      {
        question: 'When viewing the end of a solenoid carrying an electric current, if the current flows in a CLOCKWISE direction, that end acts as a:',
        options: {
          A: 'South magnetic pole',
          B: 'North magnetic pole',
          C: 'Neutral pole',
          D: 'Positive electric terminal',
        },
        correctAnswer: 'A',
        explanation: 'By the Clock Rule (right-hand rule), a clockwise current loop generates a South magnetic pole facing the observer.',
        difficulty: 'hard',
      },
      {
        question: 'If a permanent bar magnet with North and South poles is broken into two equal halves:',
        options: {
          A: 'Each broken piece becomes a complete magnet having both North and South poles',
          B: 'One piece becomes an isolated North pole and the other an isolated South pole',
          C: 'Both pieces lose their magnetism completely',
          D: 'The pieces attract each other only at the break point',
        },
        correctAnswer: 'A',
        explanation: 'Isolated magnetic monopoles do not exist; breaking a magnet produces two smaller complete dipole magnets.',
        difficulty: 'easy',
      },
      {
        question: 'In an electric bell mechanism, when the striker hits the gong, the electrical circuit is broken at the:',
        options: {
          A: 'Contact adjustment screw',
          B: 'Battery terminal',
          C: 'Electromagnet coil',
          D: 'Push switch',
        },
        correctAnswer: 'A',
        explanation: 'The movement of the soft iron armature pulls it away from the contact screw, opening the circuit, demagnetizing the core, and allowing the spring to reset the armature.',
        difficulty: 'medium',
      },
    ],
  },

  'Nature of Science and Physics': {
    chapterNumber: 9,
    questions: [
      {
        question: 'Ibn al-Haytham (Alhazen) is celebrated as the "Father of Modern Optics" for authoring the monumental treatise:',
        options: {
          A: '*Kitab al-Manazir* (Book of Optics)',
          B: '*Al-Qanun fi al-Tibb*',
          C: '*Kitab al-Jabr*',
          D: '*Zij al-Sindhind*',
        },
        correctAnswer: 'A',
        explanation: 'Ibn al-Haytham\'s *Kitab al-Manazir* established the modern ray theory of vision, laws of reflection and refraction, and the pinhole camera (camera obscura).',
        difficulty: 'easy',
      },
      {
        question: 'Abu Rayhan Al-Biruni determined the radius and circumference of the Earth with remarkable precision at Nandana (Punjab) using:',
        options: {
          A: 'Trigonometric dip-angle measurement from the top of a mountain',
          B: 'Astronomical satellite telemetry',
          C: 'Measuring the speed of sound in air',
          D: 'Submerged liquid displacement',
        },
        correctAnswer: 'A',
        explanation: 'Al-Biruni calculated the radius of Earth ($R \\approx 6338\\text{ km}$) by measuring the angle of dip of the horizon from the summit of a hill using trigonometry.',
        difficulty: 'medium',
      },
      {
        question: 'Physics is fundamentally defined as the branch of science that deals with the study of:',
        options: {
          A: 'Matter, energy, and the mutual interaction between them',
          B: 'Living organisms and their anatomical structures',
          C: 'Chemical reactions of organic polymers',
          D: 'Rocks and fossil records only',
        },
        correctAnswer: 'A',
        explanation: 'Physics is the foundational natural science investigating matter, energy, space, time, and fundamental forces.',
        difficulty: 'easy',
      },
      {
        question: 'The branch of physics that deals with the study of ionized states of matter containing ions and free electrons at high temperatures is called:',
        options: {
          A: 'Plasma Physics',
          B: 'Solid State Physics',
          C: 'Nuclear Physics',
          D: 'Mechanics',
        },
        correctAnswer: 'A',
        explanation: 'Plasma is the fourth state of matter consisting of ionized gas, studied in Plasma Physics.',
        difficulty: 'medium',
      },
      {
        question: 'In the empirical scientific method, a tentative, testable explanation formulated from preliminary observations is called a:',
        options: {
          A: 'Hypothesis',
          B: 'Scientific Law',
          C: 'Universal Constant',
          D: 'Conclusion',
        },
        correctAnswer: 'A',
        explanation: 'A hypothesis is a proposed, testable explanation formulated prior to experimental verification.',
        difficulty: 'hard',
      },
      {
        question: 'An error in measurement that occurs consistently in one direction due to faulty calibration or zero error of a measuring instrument is classified as a:',
        options: {
          A: 'Systematic error',
          B: 'Random error',
          C: 'Human error',
          D: 'Statistical variance',
        },
        correctAnswer: 'A',
        explanation: 'Systematic errors arise from known identifiable causes (like instrument zero error) and bias readings consistently.',
        difficulty: 'medium',
      },
      {
        question: 'The branch of physics concerned with the structure, properties, and reactions occurring inside the atomic nucleus is:',
        options: {
          A: 'Nuclear Physics',
          B: 'Atomic Physics',
          C: 'Thermodynamics',
          D: 'Electromagnetism',
        },
        correctAnswer: 'A',
        explanation: 'Nuclear physics specifically studies the atomic nucleus, nuclear forces, radioactivity, fission, and fusion.',
        difficulty: 'easy',
      },
      {
        question: 'Ibn al-Haytham demonstrated that light travels in straight lines and formed inverted images on a screen using the:',
        options: {
          A: 'Pinhole camera (*Al-Bayt al-Muthlim* / Camera Obscura)',
          B: 'Compound microscope',
          C: 'Astronomical refracting telescope',
          D: 'Cathode ray tube',
        },
        correctAnswer: 'A',
        explanation: 'Ibn al-Haytham invented the camera obscura (*Al-Bayt al-Muthlim*), demonstrating rectilinear propagation of light.',
        difficulty: 'hard',
      },
      {
        question: 'While conducting experiments involving high voltage electrical power supplies or laser sources in a physics laboratory, a student MUST:',
        options: {
          A: 'Never look directly into the laser beam and ensure circuits are de-energized before making adjustments',
          B: 'Work with wet hands to increase conductivity',
          C: 'Bypass safety fuses to increase current',
          D: 'Disconnect grounding earth wires',
        },
        correctAnswer: 'A',
        explanation: 'Laser radiation causes permanent retinal damage and high voltage poses lethal shock risk unless strict safety procedures are maintained.',
        difficulty: 'medium',
      },
      {
        question: 'In physical measurements, the degree of closeness of a measured value to the true/accepted standard value is known as:',
        options: {
          A: 'Accuracy',
          B: 'Precision',
          C: 'Least count',
          D: 'Zero error',
        },
        correctAnswer: 'A',
        explanation: 'Accuracy measures closeness to the true standard value, whereas precision refers to the reproducibility and resolution of measurements.',
        difficulty: 'easy',
      },
    ],
  },
};

async function execute() {
  console.log('Populating Grade 9 Physics Question Bank (10 MCQs per chapter)...');

  // Load existing grade9FbiseBank.json
  const jsonPath = path.join(process.cwd(), 'src/data/grade9FbiseBank.json');
  let bank: Record<string, Record<string, StoredMCQ[]>> = {};
  if (fs.existsSync(jsonPath)) {
    bank = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  if (!bank['Physics']) {
    bank['Physics'] = {};
  }

  const physicsBankForTs: Record<string, any[]> = {};

  for (const [chapName, chapData] of Object.entries(PHYSICS_GRADE_9_CHAPTERS)) {
    const list: StoredMCQ[] = [];
    const chNum = chapData.chapterNumber;

    chapData.questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const id = `fbise9_phy_${chNum}_${qNum}`;
      const item: StoredMCQ = {
        id,
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: chapName,
        chapterNumber: chNum,
        topic: chapName,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        verified: true,
        source: 'curriculum-bank',
        createdAt: NOW,
      };
      list.push(item);
    });

    bank['Physics'][chapName] = list;

    // Handle hyphen aliases if needed (e.g. Dynamics – I and Dynamics-I)
    if (chapName === 'Dynamics-I') {
      bank['Physics']['Dynamics – I'] = list;
    }
    if (chapName === 'Dynamics-II') {
      bank['Physics']['Dynamics – II'] = list;
    }

    console.log(`✓ Chapter ${chNum}: "${chapName}" — ${list.length} verified MCQs`);
  }

  // Save to src/data/grade9FbiseBank.json
  fs.writeFileSync(jsonPath, JSON.stringify(bank, null, 2), 'utf-8');
  console.log(`Saved updated JSON to ${jsonPath}`);
}

execute().catch(console.error);
