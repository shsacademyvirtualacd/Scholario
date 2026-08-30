import fs from 'fs';
import path from 'path';
import { serializeQuestionBankToJson } from '../src/lib/questionBankSerializer';

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

export const PHYSICS_GRADE_9_CHAPTERS: Record<
  string,
  {
    chapterNumber: number;
    questions: Omit<StoredMCQ, 'id' | 'board' | 'grade' | 'subject' | 'chapter' | 'chapterNumber' | 'topic' | 'verified' | 'source' | 'createdAt'>[];
  }
> = {
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
      // New 10 MCQs (11 to 20)
      {
        question: 'Which of the following physical quantities is an SI base quantity?',
        options: {
          A: 'Luminous intensity',
          B: 'Speed',
          C: 'Density',
          D: 'Force',
        },
        correctAnswer: 'A',
        explanation: 'The seven SI base quantities are length, mass, time, electric current, thermodynamic temperature, amount of substance, and luminous intensity (measured in candela, cd). Speed, density, and force are derived quantities.',
        difficulty: 'easy',
      },
      {
        question: 'How many microseconds ($\\mu\\text{s}$) are there in $0.02\\text{ seconds}$?',
        options: {
          A: '$20,000\\;\\mu\\text{s}$ ($2 \\times 10^4\\;\\mu\\text{s}$)',
          B: '$200\\;\\mu\\text{s}$',
          C: '$2,000\\;\\mu\\text{s}$',
          D: '$0.00002\\;\\mu\\text{s}$',
        },
        correctAnswer: 'A',
        explanation: '$1\\text{ s} = 10^6\\;\\mu\\text{s}$. Therefore, $0.02\\text{ s} = 0.02 \\times 10^6\\;\\mu\\text{s} = 2 \\times 10^4\\;\\mu\\text{s} = 20,000\\;\\mu\\text{s}$.',
        difficulty: 'medium',
      },
      {
        question: 'If the zero mark of the circular scale of a screw gauge has not reached the index line (lies above the datum line) when the jaws are closed, the zero error is:',
        options: {
          A: 'Negative, and the zero correction must be added to the observed reading',
          B: 'Positive, and the zero correction must be subtracted from the observed reading',
          C: 'Zero, because circular error does not affect measurements',
          D: 'Negative, and the zero correction must be subtracted from the observed reading',
        },
        correctAnswer: 'A',
        explanation: 'When the circular scale zero remains above the reference datum line, the instrument under-reads. The zero error is negative, so the zero correction is positive (added to the reading).',
        difficulty: 'medium',
      },
      {
        question: 'A measuring cylinder contains $40\\text{ cm}^3$ of water. When an irregular solid stone of mass $81\\text{ g}$ is immersed completely, the water level rises to $70\\text{ cm}^3$. What is the density of the stone?',
        options: {
          A: '$2.7\\text{ g/cm}^3$ ($2700\\text{ kg/m}^3$)',
          B: '$1.16\\text{ g/cm}^3$',
          C: '$2.02\\text{ g/cm}^3$',
          D: '$3.24\\text{ g/cm}^3$',
        },
        correctAnswer: 'A',
        explanation: 'Volume of displaced water = $V_{\\text{stone}} = 70\\text{ cm}^3 - 40\\text{ cm}^3 = 30\\text{ cm}^3$. Density $\\rho = \\frac{m}{V} = \\frac{81\\text{ g}}{30\\text{ cm}^3} = 2.7\\text{ g/cm}^3 = 2700\\text{ kg/m}^3$.',
        difficulty: 'medium',
      },
      {
        question: 'Which of the following laboratory balances provides the highest sensitivity and precision for measuring tiny masses?',
        options: {
          A: 'Digital electronic balance (least count $0.001\\text{ g}$ / $1\\text{ mg}$)',
          B: 'Physical beam balance (least count $0.1\\text{ g}$)',
          C: 'Lever balance (least count $0.1\\text{ g}$)',
          D: 'Spring balance (least count $1\\text{ g}$)',
        },
        correctAnswer: 'A',
        explanation: 'A digital electronic balance measures with a resolution of $0.001\\text{ g}$ ($1\\text{ mg}$), offering significantly higher precision than mechanical beam or lever balances.',
        difficulty: 'easy',
      },
      {
        question: 'A rectangular block has a measured length of $3.2\\text{ cm}$ (2 significant figures) and a width of $4.15\\text{ cm}$ (3 significant figures). What is its surface area expressed to the correct number of significant figures?',
        options: {
          A: '$13\\text{ cm}^2$',
          B: '$13.28\\text{ cm}^2$',
          C: '$13.3\\text{ cm}^2$',
          D: '$13.280\\text{ cm}^2$',
        },
        correctAnswer: 'A',
        explanation: 'In multiplication, the product must retain only as many significant figures as the least precise factor ($3.2$ has 2 significant figures). Calculated area $= 3.2 \\times 4.15 = 13.28\\text{ cm}^2$, which rounds to 2 significant figures as $13\\text{ cm}^2$.',
        difficulty: 'hard',
      },
      {
        question: 'A mechanical stopwatch has a least count of $0.1\\text{ s}$, while a digital stopwatch has a least count of $0.01\\text{ s}$. The human reaction time error in manually starting and stopping either watch is typically around:',
        options: {
          A: '$0.1\\text{ s}$ to $0.2\\text{ s}$',
          B: '$0.001\\text{ s}$',
          C: '$1.0\\text{ s}$ to $2.0\\text{ s}$',
          D: '$0.0001\\text{ s}$',
        },
        correctAnswer: 'A',
        explanation: 'Human eye-hand reaction time creates an inherent uncertainty of roughly $0.1\\text{ s}$ to $0.2\\text{ s}$, which often dominates over the precision of digital timing devices.',
        difficulty: 'medium',
      },
      {
        question: 'The SI unit of force is the Newton ($\\text{N}$). As a derived unit expressed in terms of SI base units ($\\text{kg}$, $\\text{m}$, $\\text{s}$), $1\\text{ Newton}$ is equivalent to:',
        options: {
          A: '$\\text{kg}\\cdot\\text{m}\\cdot\\text{s}^{-2}$',
          B: '$\\text{kg}\\cdot\\text{m}^2\\cdot\\text{s}^{-2}$',
          C: '$\\text{kg}\\cdot\\text{m}\\cdot\\text{s}^{-1}$',
          D: '$\\text{kg}^{-1}\\cdot\\text{m}\\cdot\\text{s}^{-2}$',
        },
        correctAnswer: 'A',
        explanation: 'Force is a derived quantity equal to mass multiplied by acceleration, giving SI base units of $(\\text{kg}) \\times (\\text{m/s}^2) = \\text{kg}\\cdot\\text{m}\\cdot\\text{s}^{-2}$.',
        difficulty: 'easy',
      },
      {
        question: 'On a Vernier Calipers with least count $0.01\\text{ cm}$, the main scale reading is $3.4\\text{ cm}$ and the 6th vernier scale division coincides with a main scale line. If there is no zero error, the measured reading is:',
        options: {
          A: '$3.46\\text{ cm}$',
          B: '$3.406\\text{ cm}$',
          C: '$4.00\\text{ cm}$',
          D: '$3.50\\text{ cm}$',
        },
        correctAnswer: 'A',
        explanation: 'Measured reading $= \\text{Main Scale Reading} + (\\text{Vernier Division} \\times \\text{Least Count}) = 3.4\\text{ cm} + (6 \\times 0.01\\text{ cm}) = 3.46\\text{ cm}$.',
        difficulty: 'medium',
      },
      {
        question: 'An electrical power station generates $2.5\\text{ Megawatts (MW)}$ of electric power. What is this value expressed in kilowatts ($\\text{kW}$)?',
        options: {
          A: '$2500\\text{ kW}$ ($2.5 \\times 10^3\\text{ kW}$)',
          B: '$250\\text{ kW}$',
          C: '$25,000\\text{ kW}$',
          D: '$0.0025\\text{ kW}$',
        },
        correctAnswer: 'A',
        explanation: '$1\\text{ MW} = 10^6\\text{ W} = 1000\\text{ kW}$. Therefore, $2.5\\text{ MW} = 2.5 \\times 1000\\text{ kW} = 2500\\text{ kW}$.',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
      },
      // New 10 MCQs (11 to 20)
      {
        question: 'Which of the following groups consists ONLY of vector quantities?',
        options: {
          A: 'Velocity, acceleration, force, and weight',
          B: 'Speed, velocity, distance, and mass',
          C: 'Displacement, speed, acceleration, and time',
          D: 'Force, momentum, temperature, and work',
        },
        correctAnswer: 'A',
        explanation: 'Velocity, acceleration, force, and weight all possess both magnitude and a specific direction in space. Speed, distance, mass, temperature, and work are scalars.',
        difficulty: 'easy',
      },
      {
        question: 'A runner completes one full round of a circular track of radius $70\\text{ m}$ in $44\\text{ seconds}$. What is the magnitude of the runner\'s average velocity?',
        options: {
          A: '$0\\text{ m/s}$',
          B: '$10\\text{ m/s}$',
          C: '$5\\text{ m/s}$',
          D: '$20\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'Because the runner returns to the exact starting point after one complete round, net displacement $\\Delta \\vec{s} = 0$. Hence, $\\text{Average Velocity} = \\frac{\\text{Net Displacement}}{\\text{Total Time}} = \\frac{0}{44} = 0\\text{ m/s}$.',
        difficulty: 'medium',
      },
      {
        question: 'A motorcycle travelling initially at $10\\text{ m/s}$ accelerates uniformly at $2.5\\text{ m/s}^2$ for $6\\text{ seconds}$. What is its final velocity?',
        options: {
          A: '$25\\text{ m/s}$',
          B: '$15\\text{ m/s}$',
          C: '$30\\text{ m/s}$',
          D: '$22.5\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'Using the 1st equation of motion: $v_f = v_i + at = 10 + (2.5 \\times 6) = 10 + 15 = 25\\text{ m/s}$.',
        difficulty: 'easy',
      },
      {
        question: 'The slope (gradient) of a Speed-Time graph represents which physical quantity?',
        options: {
          A: 'Acceleration',
          B: 'Total distance',
          C: 'Speed',
          D: 'Displacement',
        },
        correctAnswer: 'A',
        explanation: 'Gradient of a speed-time graph $= \\frac{\\Delta v}{\\Delta t} = \\text{Acceleration}$. A positive slope denotes acceleration, a horizontal line denotes constant speed, and a negative slope denotes deceleration.',
        difficulty: 'easy',
      },
      {
        question: 'A ball is thrown vertically upwards with a velocity of $20\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). How much total time elapses before it returns to the thrower\'s hand?',
        options: {
          A: '$4\\text{ s}$ ($2\\text{ s}$ up $+ 2\\text{ s}$ down)',
          B: '$2\\text{ s}$',
          C: '$8\\text{ s}$',
          D: '$1\\text{ s}$',
        },
        correctAnswer: 'A',
        explanation: 'Time to reach highest point: $t_{\\text{up}} = \\frac{v_i}{g} = \\frac{20}{10} = 2\\text{ s}$. Total time of flight $= 2 \\times t_{\\text{up}} = 4\\text{ s}$.',
        difficulty: 'medium',
      },
      {
        question: 'The erratic, zig-zag Brownian motion of smoke particles or dust specks suspended in air is an example of:',
        options: {
          A: 'Random motion',
          B: 'Rotatory motion',
          C: 'Vibratory / oscillatory motion',
          D: 'Uniform circular motion',
        },
        correctAnswer: 'A',
        explanation: 'The disordered, irregular, zig-zag movement of particles in gases or liquids is classified as random motion.',
        difficulty: 'easy',
      },
      {
        question: 'A bullet moving at $150\\text{ m/s}$ strikes a wooden plank and penetrates $0.05\\text{ m}$ ($5\\text{ cm}$) before coming to rest. What is the average deceleration experienced by the bullet?',
        options: {
          A: '$2.25 \\times 10^5\\text{ m/s}^2$',
          B: '$1.5 \\times 10^4\\text{ m/s}^2$',
          C: '$4.5 \\times 10^5\\text{ m/s}^2$',
          D: '$2.25 \\times 10^3\\text{ m/s}^2$',
        },
        correctAnswer: 'A',
        explanation: '$2aS = v_f^2 - v_i^2 \\implies 2a(0.05) = 0 - (150)^2 \\implies 0.1a = -22,500 \\implies a = -225,000\\text{ m/s}^2 = -2.25 \\times 10^5\\text{ m/s}^2$. The deceleration is $2.25 \\times 10^5\\text{ m/s}^2$.',
        difficulty: 'hard',
      },
      {
        question: 'The back-and-forth (to-and-fro) motion of a simple pendulum or the prongs of a tuning fork about its mean position is termed:',
        options: {
          A: 'Vibratory (oscillatory) motion',
          B: 'Rotatory motion',
          C: 'Linear translatory motion',
          D: 'Random motion',
        },
        correctAnswer: 'A',
        explanation: 'To-and-fro motion of a body about a fixed central mean equilibrium position is vibratory or oscillatory motion.',
        difficulty: 'easy',
      },
      {
        question: 'A stone is dropped freely from the top of a cliff ($v_i = 0, g = 9.8\\text{ m/s}^2$). What vertical distance does it fall in the first $3\\text{ seconds}$?',
        options: {
          A: '$44.1\\text{ m}$',
          B: '$29.4\\text{ m}$',
          C: '$88.2\\text{ m}$',
          D: '$14.7\\text{ m}$',
        },
        correctAnswer: 'A',
        explanation: '$S = v_i t + \\frac{1}{2}gt^2 = 0 + \\frac{1}{2}(9.8)(3^2) = 4.9 \\times 9 = 44.1\\text{ m}$.',
        difficulty: 'medium',
      },
      {
        question: 'If the distance-time graph of a moving object is a curve bending upwards with increasing gradient, the object is moving with:',
        options: {
          A: 'Increasing speed (accelerating motion)',
          B: 'Uniform constant velocity',
          C: 'Decreasing speed (decelerating)',
          D: 'State of rest',
        },
        correctAnswer: 'A',
        explanation: 'Because the gradient of a distance-time graph represents speed, a curve whose slope increases over time indicates increasing speed (positive acceleration).',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
      // New 10 MCQs (11 to 20)
      {
        question: 'The inertia of a body depends directly upon its:',
        options: {
          A: 'Mass',
          B: 'Volume',
          C: 'Velocity',
          D: 'Surface area',
        },
        correctAnswer: 'A',
        explanation: 'Mass is the quantitative measure of an object\'s inertia. Greater mass means greater resistance to changes in its state of rest or uniform motion.',
        difficulty: 'easy',
      },
      {
        question: 'A mass $m_1 = 4\\text{ kg}$ hangs vertically while mass $m_2 = 6\\text{ kg}$ slides on a smooth frictionless horizontal table, connected by a light string over a pulley ($g = 10\\text{ m/s}^2$). What is the acceleration of the system?',
        options: {
          A: '$4\\text{ m/s}^2$',
          B: '$2.4\\text{ m/s}^2$',
          C: '$6.67\\text{ m/s}^2$',
          D: '$10\\text{ m/s}^2$',
        },
        correctAnswer: 'A',
        explanation: 'For a horizontal-vertical Atwood machine: $a = \\frac{m_1}{m_1 + m_2} g = \\frac{4}{4 + 6} \\times 10 = \\frac{4}{10} \\times 10 = 4\\text{ m/s}^2$.',
        difficulty: 'medium',
      },
      {
        question: 'In the horizontal-vertical system with hanging mass $m_1 = 4\\text{ kg}$ and horizontal mass $m_2 = 6\\text{ kg}$ on a frictionless surface ($g = 10\\text{ m/s}^2$), what is the tension $T$ in the string?',
        options: {
          A: '$24\\text{ N}$',
          B: '$40\\text{ N}$',
          C: '$60\\text{ N}$',
          D: '$16\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: '$T = \\frac{m_1 m_2}{m_1 + m_2} g = \\frac{4 \\times 6}{4 + 6} \\times 10 = \\frac{24}{10} \\times 10 = 24\\text{ N}$ (or $T = m_2 a = 6 \\times 4 = 24\\text{ N}$).',
        difficulty: 'medium',
      },
      {
        question: 'A rocket accelerates upward into space because:',
        options: {
          A: 'The backward reaction force exerted by escaping high-velocity exhaust gases pushes the rocket forward',
          B: 'The exhaust gases push against the atmospheric air',
          C: 'Gravity stops acting at high altitudes',
          D: 'The rocket\'s mass increases as fuel burns',
        },
        correctAnswer: 'A',
        explanation: 'In accordance with Newton\'s Third Law (and conservation of momentum), the downward action force expelling hot gas creates an equal and opposite upward reaction thrust on the rocket.',
        difficulty: 'easy',
      },
      {
        question: 'An airplane flies in a straight horizontal line at a constant speed of $800\\text{ km/h}$. What is the net resultant force acting on the airplane?',
        options: {
          A: '$0\\text{ N}$',
          B: 'Equal to its weight',
          C: 'Equal to engine thrust',
          D: 'Infinite',
        },
        correctAnswer: 'A',
        explanation: 'According to Newton\'s First Law, when velocity is constant (speed and direction do not change), acceleration $a = 0$, so the net resultant force $F = ma = 0\\text{ N}$.',
        difficulty: 'medium',
      },
      {
        question: 'A man of mass $70\\text{ kg}$ stands on a weighing scale inside an elevator moving downward with an acceleration of $2\\text{ m/s}^2$ ($g = 10\\text{ m/s}^2$). What apparent weight does the scale read?',
        options: {
          A: '$560\\text{ N}$',
          B: '$700\\text{ N}$',
          C: '$840\\text{ N}$',
          D: '$140\\text{ N}$',
        },
        correctAnswer: 'A',
        explanation: 'When accelerating downward: $W_{\\text{apparent}} = m(g - a) = 70(10 - 2) = 70 \\times 8 = 560\\text{ N}$.',
        difficulty: 'hard',
      },
      {
        question: 'Newton\'s Second Law of Motion can be mathematically formulated in terms of momentum as:',
        options: {
          A: '$F = \\frac{\\Delta p}{\\Delta t}$ (Net force equals time rate of change of momentum)',
          B: '$F = p \\times t$',
          C: '$F = \\frac{\\Delta t}{\\Delta p}$',
          D: '$F = \\Delta p \\times a$',
        },
        correctAnswer: 'A',
        explanation: '$\\frac{\\Delta p}{\\Delta t} = \\frac{m(v_f - v_i)}{\\Delta t} = m a = F$. Thus, applied net force equals the time rate of change of momentum.',
        difficulty: 'medium',
      },
      {
        question: 'The gravitational field strength ($g$) near the surface of Earth is approximately $10\\text{ N/kg}$ (or $10\\text{ m/s}^2$). This means that:',
        options: {
          A: 'Earth exerts a gravitational attractive force of $10\\text{ N}$ on every $1\\text{ kg}$ of mass',
          B: 'An object travels $10\\text{ meters}$ in every second',
          C: 'Mass of an object increases by $10\\text{ kg}$ each second',
          D: 'Force of gravity is zero in vacuum',
        },
        correctAnswer: 'A',
        explanation: 'Gravitational field strength $g = F/m = 10\\text{ N/kg}$, meaning Earth pulls with $10\\text{ N}$ of force on each kilogram of mass.',
        difficulty: 'easy',
      },
      {
        question: 'A force of $48\\text{ N}$ produces an acceleration of $6\\text{ m/s}^2$ in a wooden block. What is the mass of the block?',
        options: {
          A: '$8\\text{ kg}$',
          B: '$288\\text{ kg}$',
          C: '$0.125\\text{ kg}$',
          D: '$42\\text{ kg}$',
        },
        correctAnswer: 'A',
        explanation: 'From $F = ma \\implies m = \\frac{F}{a} = \\frac{48\\text{ N}}{6\\text{ m/s}^2} = 8\\text{ kg}$.',
        difficulty: 'easy',
      },
      {
        question: 'When two equal forces of $15\\text{ N}$ act on an object in exactly opposite directions along the same line:',
        options: {
          A: 'The forces are balanced, the net force is $0\\text{ N}$, and the object\'s acceleration is zero',
          B: 'The object accelerates in the direction of the first force',
          C: 'The net force is $30\\text{ N}$',
          D: 'The object rotates rapidly',
        },
        correctAnswer: 'A',
        explanation: 'Forces in opposite directions cancel out ($15\\text{ N} - 15\\text{ N} = 0\\text{ N}$), producing a zero net force with zero linear acceleration.',
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        difficulty: 'medium',
      },
      {
        question: 'Outer edges of curved roads are raised higher than inner edges (banking of roads) in order to:',
        options: {
          A: 'Provide the necessary centripetal force component to prevent skidding without relying purely on friction',
          B: 'Increase the speed limit arbitrarily',
          C: 'Stop rainwater from collecting on the road',
          D: 'Decrease the normal reaction force',
        },
        correctAnswer: 'A',
        explanation: 'Banking resolves the normal reaction into a horizontal component ($N\\sin\\theta$) that supplies the necessary centripetal force for safe turning.',
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        explanation: 'Because $F_c = \\frac{mv^2}{r}$, centripetal force is proportional to $v^2$. Doubling velocity ($2v$) increases $F_c$ by $2^2 = 4$ times.',
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
        difficulty: 'medium',
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
      // New 10 MCQs (11 to 20)
      {
        question: 'A car of mass $1000\\text{ kg}$ moves at $15\\text{ m/s}$ and a truck of mass $3000\\text{ kg}$ moves at $5\\text{ m/s}$. How do their linear momentums compare?',
        options: {
          A: 'Both vehicles have the exact same momentum ($15,000\\text{ kg}\\cdot\\text{m/s}$)',
          B: 'The truck has 3 times greater momentum',
          C: 'The car has 3 times greater momentum',
          D: 'The truck has 9 times greater momentum',
        },
        correctAnswer: 'A',
        explanation: '$p_{\\text{car}} = 1000 \\times 15 = 15,000\\text{ kg}\\cdot\\text{m/s}$. $p_{\\text{truck}} = 3000 \\times 5 = 15,000\\text{ kg}\\cdot\\text{m/s}$. Both possess equal momentum.',
        difficulty: 'easy',
      },
      {
        question: 'A horizontal pulling force of $18\\text{ N}$ moves a $6\\text{ kg}$ box at constant velocity across a rough horizontal floor ($g = 10\\text{ m/s}^2$). What is the coefficient of kinetic friction $\\mu_k$?',
        options: {
          A: '$0.30$',
          B: '$0.18$',
          C: '$0.03$',
          D: '$3.33$',
        },
        correctAnswer: 'A',
        explanation: 'At constant velocity, applied force equals kinetic friction ($F_k = 18\\text{ N}$). Normal force $R = mg = 6 \\times 10 = 60\\text{ N}$. $\\mu_k = \\frac{F_k}{R} = \\frac{18}{60} = 0.30$.',
        difficulty: 'medium',
      },
      {
        question: 'A toy car moves around a circular track of radius $2.5\\text{ m}$ at a constant speed of $5\\text{ m/s}$. What is its centripetal acceleration?',
        options: {
          A: '$10\\text{ m/s}^2$',
          B: '$2\\text{ m/s}^2$',
          C: '$25\\text{ m/s}^2$',
          D: '$5\\text{ m/s}^2$',
        },
        correctAnswer: 'A',
        explanation: '$a_c = \\frac{v^2}{r} = \\frac{5^2}{2.5} = \\frac{25}{2.5} = 10\\text{ m/s}^2$.',
        difficulty: 'medium',
      },
      {
        question: 'An isolated system is defined in physics as a system in which:',
        options: {
          A: 'No external unbalanced force acts on the interacting bodies',
          B: 'Gravitational force is completely absent',
          C: 'All colliding bodies must come to rest',
          D: 'Thermal energy is strictly zero',
        },
        correctAnswer: 'A',
        explanation: 'An isolated system has zero net external force acting upon it, which is the necessary prerequisite for total momentum conservation.',
        difficulty: 'easy',
      },
      {
        question: 'A trolley of mass $2\\text{ kg}$ moving at $6\\text{ m/s}$ collides with and sticks to a stationary trolley of mass $4\\text{ kg}$. What is their combined velocity after the collision?',
        options: {
          A: '$2\\text{ m/s}$',
          B: '$3\\text{ m/s}$',
          C: '$1\\text{ m/s}$',
          D: '$4\\text{ m/s}$',
        },
        correctAnswer: 'A',
        explanation: 'Total initial momentum $= (2)(6) + (4)(0) = 12\\text{ kg}\\cdot\\text{m/s}$. Total mass after collision $= 2 + 4 = 6\\text{ kg}$. Final velocity $v = \\frac{12}{6} = 2\\text{ m/s}$.',
        difficulty: 'hard',
      },
      {
        question: 'The direction of the centripetal force acting on a body in uniform circular motion is always:',
        options: {
          A: 'Directed radially inwards towards the center of the circular path',
          B: 'Directed tangent to the circular trajectory',
          C: 'Directed radially outwards away from the center',
          D: 'Opposite to the direction of gravity',
        },
        correctAnswer: 'A',
        explanation: 'Centripetal means "center-seeking". Centripetal force acts perpendicular to the velocity vector, directed inwards toward the center of the circle.',
        difficulty: 'easy',
      },
      {
        question: 'Which of the following everyday phenomena is an ESSENTIAL ADVANTAGE of friction?',
        options: {
          A: 'Enabling humans to walk without slipping and vehicles to brake safely',
          B: 'Causing wear and tear in machine gear teeth',
          C: 'Generating waste heat in engines',
          D: 'Reducing maximum speed of ships and airplanes',
        },
        correctAnswer: 'A',
        explanation: 'Friction provides the necessary grip for footwear on the ground to push forward and allows vehicle brake pads to stop rotating wheels.',
        difficulty: 'easy',
      },
      {
        question: 'In a washing machine spin dryer, wet clothes are dried quickly because:',
        options: {
          A: 'At high rotational speeds, the required centripetal force exceeds the adhesive attraction of water droplets to fabric, so water escapes through the drum perforations',
          B: 'Air suction evaporates water instantly',
          C: 'Centrifugal force pushes the heat from the motor',
          D: 'Friction heats the clothes to boiling point',
        },
        correctAnswer: 'A',
        explanation: 'As the drum spins rapidly, adhesive force between water and cloth cannot provide the necessary centripetal force, allowing water droplets to fly off tangentially through drum holes.',
        difficulty: 'medium',
      },
      {
        question: 'For any given pair of contact surfaces, the coefficient of static friction ($\\mu_s$) is always:',
        options: {
          A: 'Greater than the coefficient of kinetic friction ($\\mu_k$)',
          B: 'Equal to the coefficient of kinetic friction ($\\mu_k$)',
          C: 'Less than the coefficient of kinetic friction ($\\mu_k$)',
          D: 'Zero when the object starts moving',
        },
        correctAnswer: 'A',
        explanation: 'Once relative motion begins, microscopic contact cold-welds do not have time to fully establish, so kinetic friction is always less than maximum limiting static friction ($\\mu_s > \\mu_k$).',
        difficulty: 'medium',
      },
      {
        question: 'If the radius of a circular turn is doubled while a vehicle maintains the same speed $v$, the centripetal force required to negotiate the curve becomes:',
        options: {
          A: 'Half of the original force ($F_c / 2$)',
          B: 'Doubled ($2F_c$)',
          C: 'Quadrupled ($4F_c$)',
          D: 'One-fourth ($F_c / 4$)',
        },
        correctAnswer: 'A',
        explanation: '$F_c = \\frac{mv^2}{r}$. When radius is doubled to $2r$ with constant speed, $F_c\' = \\frac{mv^2}{2r} = \\frac{1}{2}F_c$.',
        difficulty: 'medium',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
      },
      {
        question: 'Tensile strain is defined as the ratio of change in length to original length ($\\frac{\\Delta L}{L_0}$). Its SI unit is:',
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
        difficulty: 'easy',
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
      // New 10 MCQs (11 to 20)
      {
        question: 'Why do sharp sewing needles and surgical knives penetrate materials much more easily than blunt ones under the same applied force?',
        options: {
          A: 'The tiny tip contact area concentrates force, producing an extremely large pressure ($P = F/A$)',
          B: 'Sharp objects have greater gravitational mass',
          C: 'Sharp objects decrease the density of the target material',
          D: 'Sharp edges eliminate atmospheric pressure',
        },
        correctAnswer: 'A',
        explanation: 'Since $P = F/A$, reducing contact area $A$ to a tiny point tremendously magnifies pressure $P$ for a given applied force $F$.',
        difficulty: 'easy',
      },
      {
        question: 'Pascal\'s Law states that external pressure applied to an enclosed fluid is:',
        options: {
          A: 'Transmitted equally and undiminished in all directions throughout the liquid',
          B: 'Transmitted only in the downward vertical direction',
          C: 'Absorbed completely by the container walls',
          D: 'Decreased proportionally to fluid volume',
        },
        correctAnswer: 'A',
        explanation: 'Pascal\'s Principle states that pressure applied to an enclosed fluid is transmitted undiminished in all directions to all portions of the fluid and container walls.',
        difficulty: 'easy',
      },
      {
        question: 'As an altitude climber ascends higher up a mountain, the atmospheric pressure:',
        options: {
          A: 'Decreases steadily because the height and density of the overlying air column decrease',
          B: 'Increases because temperature drops',
          C: 'Remains constantly at $101.3\\text{ kPa}$',
          D: 'Becomes negative',
        },
        correctAnswer: 'A',
        explanation: 'As altitude increases, there is less air above you and the air becomes less dense, resulting in a continuous decrease in atmospheric pressure.',
        difficulty: 'easy',
      },
      {
        question: 'Automobile hydraulic brakes operate based on which fundamental physical law?',
        options: {
          A: 'Pascal\'s Principle',
          B: 'Archimedes\' Principle',
          C: 'Hooke\'s Law',
          D: 'Newton\'s Law of Universal Gravitation',
        },
        correctAnswer: 'A',
        explanation: 'Hydraulic braking systems use Pascal\'s Principle to transmit pressure uniformly through brake fluid from master cylinder to wheel cylinders.',
        difficulty: 'easy',
      },
      {
        question: 'A submarine dives underwater and ascends back to the surface by controlling its:',
        options: {
          A: 'Ballast tanks by taking in or pumping out seawater to adjust its average density',
          B: 'Engine speed exclusively',
          C: 'Propeller pitch angle only',
          D: 'Magnetic shielding',
        },
        correctAnswer: 'A',
        explanation: 'Filling ballast tanks with water increases submarine weight and average density causing it to submerge; blowing compressed air into tanks expels water, reducing density so it floats.',
        difficulty: 'medium',
      },
      {
        question: 'Tensile stress is defined as the deforming force acting per unit cross-sectional area of a solid rod ($\\sigma = F/A$). What is its SI unit?',
        options: {
          A: '$\\text{N/m}^2$ (or $\\text{Pascal, Pa}$)',
          B: '$\\text{N}\\cdot\\text{m}$',
          C: '$\\text{N/m}$',
          D: 'Dimensionless',
        },
        correctAnswer: 'A',
        explanation: '$\\text{Stress} = \\frac{\\text{Force}}{\\text{Area}} = \\frac{\\text{N}}{\\text{m}^2} = \\text{Pascal (Pa)}$.',
        difficulty: 'easy',
      },
      {
        question: 'The maximum stress or deforming force a solid material can withstand and still fully return to its original shape upon removing the force is called its:',
        options: {
          A: 'Elastic limit',
          B: 'Breaking stress',
          C: 'Plastic deformation point',
          D: 'Young\'s constant',
        },
        correctAnswer: 'A',
        explanation: 'The elastic limit is the upper boundary of stress beyond which a body experiences permanent plastic deformation and no longer regains its original shape.',
        difficulty: 'easy',
      },
      {
        question: 'A U-tube manometer containing mercury ($\\rho = 13,600\\text{ kg/m}^3, g = 10\\text{ m/s}^2$) shows a height difference of $0.05\\text{ m}$ between its two limbs when connected to a gas cylinder. What is the excess gauge pressure of the gas?',
        options: {
          A: '$6,800\\text{ Pa}$ ($6.8\\text{ kPa}$)',
          B: '$1,360\\text{ Pa}$',
          C: '$136\\text{ Pa}$',
          D: '$68,000\\text{ Pa}$',
        },
        correctAnswer: 'A',
        explanation: '$P = \\rho g h = 13,600 \\times 10 \\times 0.05 = 6,800\\text{ Pa} = 6.8\\text{ kPa}$.',
        difficulty: 'medium',
      },
      {
        question: 'An instrument specifically designed to measure the relative density (specific gravity) of liquids such as milk (lactometer) or battery acid is called a:',
        options: {
          A: 'Hydrometer',
          B: 'Barometer',
          C: 'Manometer',
          D: 'Hygrometer',
        },
        correctAnswer: 'A',
        explanation: 'A hydrometer floats upright in liquids; based on Archimedes\' Principle, it sinks deeper in less dense liquids, measuring liquid relative density directly.',
        difficulty: 'easy',
      },
      {
        question: 'Young\'s Modulus ($Y$) of a material is mathematically expressed as the ratio of:',
        options: {
          A: 'Tensile Stress to Tensile Strain ($Y = \\frac{\\text{Stress}}{\\text{Strain}} = \\frac{F L_0}{A \\Delta L}$)',
          B: 'Tensile Strain to Tensile Stress',
          C: 'Force to Extension ($F / x$)',
          D: 'Applied Pressure to Volume',
        },
        correctAnswer: 'A',
        explanation: 'Young\'s Modulus $Y = \\frac{\\text{Tensile Stress}}{\\text{Tensile Strain}} = \\frac{F/A}{\\Delta L / L_0} = \\frac{F L_0}{A \\Delta L}$.',
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
      },
      // New 10 MCQs (11 to 20)
      {
        question: 'A porter pushes a cart with a horizontal force of $120\\text{ N}$ across a platform over a distance of $15\\text{ m}$. What is the total work done?',
        options: {
          A: '$1800\\text{ J}$ ($1.8\\text{ kJ}$)',
          B: '$8\\text{ J}$',
          C: '$135\\text{ J}$',
          D: '$18,000\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$W = F \\times s = 120\\text{ N} \\times 15\\text{ m} = 1800\\text{ Joules} = 1.8\\text{ kJ}$.',
        difficulty: 'easy',
      },
      {
        question: 'If the speed of a moving sports car is tripled ($3v$), its kinetic energy will:',
        options: {
          A: 'Increase by 9 times ($9 E_k$)',
          B: 'Increase by 3 times ($3 E_k$)',
          C: 'Increase by 6 times',
          D: 'Remain unchanged',
        },
        correctAnswer: 'A',
        explanation: '$E_k = \\frac{1}{2}mv^2$. Since $E_k \\propto v^2$, tripling speed yields $(3v)^2 = 9v^2$, so kinetic energy increases by 9 times.',
        difficulty: 'easy',
      },
      {
        question: 'The mechanical energy stored in a compressed archery bow or a stretched catapult rubber band is:',
        options: {
          A: 'Elastic potential energy',
          B: 'Gravitational potential energy',
          C: 'Thermal kinetic energy',
          D: 'Chemical energy',
        },
        correctAnswer: 'A',
        explanation: 'Work done against restoring elastic forces stores elastic potential energy ($E_p = \\frac{1}{2}kx^2$) in the deformed spring or rubber band.',
        difficulty: 'easy',
      },
      {
        question: 'A student of mass $50\\text{ kg}$ climbs a staircase of vertical height $6\\text{ m}$ in $10\\text{ seconds}$ ($g = 10\\text{ m/s}^2$). What is the student\'s power output?',
        options: {
          A: '$300\\text{ W}$',
          B: '$3000\\text{ W}$',
          C: '$50\\text{ W}$',
          D: '$500\\text{ W}$',
        },
        correctAnswer: 'A',
        explanation: 'Work done $W = mgh = 50 \\times 10 \\times 6 = 3000\\text{ J}$. Power $P = \\frac{W}{t} = \\frac{3000\\text{ J}}{10\\text{ s}} = 300\\text{ W}$.',
        difficulty: 'medium',
      },
      {
        question: 'A solar photovoltaic (PV) cell directly converts radiant solar light energy into:',
        options: {
          A: 'Electrical energy',
          B: 'Chemical energy',
          C: 'Nuclear energy',
          D: 'Mechanical kinetic energy',
        },
        correctAnswer: 'A',
        explanation: 'Solar photovoltaic cells utilize semiconductor p-n junctions to convert photons of sunlight directly into direct-current (DC) electricity.',
        difficulty: 'easy',
      },
      {
        question: 'According to Einstein\'s mass-energy equation $E = mc^2$, how much energy is released if $0.001\\text{ kg}$ ($1\\text{ g}$) of mass is completely converted into energy ($c = 3 \\times 10^8\\text{ m/s}$)?',
        options: {
          A: '$9 \\times 10^{13}\\text{ J}$ ($90\\text{ Terajoules}$)',
          B: '$3 \\times 10^5\\text{ J}$',
          C: '$9 \\times 10^8\\text{ J}$',
          D: '$3 \\times 10^{11}\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$E = mc^2 = (0.001\\text{ kg}) \\times (3 \\times 10^8\\text{ m/s})^2 = 10^{-3} \\times (9 \\times 10^{16}) = 9 \\times 10^{13}\\text{ J}$.',
        difficulty: 'hard',
      },
      {
        question: 'The fundamental Law of Conservation of Energy states that energy:',
        options: {
          A: 'Can neither be created nor destroyed, but can be transformed from one form into another',
          B: 'Is continuously being lost from the universe',
          C: 'Can be created out of nothing by high-power machines',
          D: 'Always increases in every closed system',
        },
        correctAnswer: 'A',
        explanation: 'Energy is universally conserved; total quantity in an isolated system remains constant, transforming between potential, kinetic, thermal, and other forms.',
        difficulty: 'easy',
      },
      {
        question: 'When a car skids to a stop on a road, the work done by the force of friction on the car is:',
        options: {
          A: 'Negative, because friction acts in the direction opposite to displacement ($\\theta = 180^\\circ$)',
          B: 'Positive, because it slows the car down',
          C: 'Zero, because friction is a contact force',
          D: 'Infinite',
        },
        correctAnswer: 'A',
        explanation: 'Work $W = F s \\cos(180^\\circ) = -F s$. When force and displacement are in opposite directions, the work done is negative.',
        difficulty: 'medium',
      },
      {
        question: 'Biogas generated from animal dung, organic waste, and sewage in an anaerobic digester mainly consists of which combustible gas?',
        options: {
          A: 'Methane ($\\text{CH}_4$)',
          B: 'Oxygen ($\\text{O}_2$)',
          C: 'Sulfur dioxide ($\\text{SO}_2$)',
          D: 'Nitrogen dioxide ($\\text{NO}_2$)',
        },
        correctAnswer: 'A',
        explanation: 'Anaerobic bacterial fermentation of organic matter generates biogas, which consists of roughly 60–70% methane ($\\text{CH}_4$) and carbon dioxide.',
        difficulty: 'medium',
      },
      {
        question: 'An electric motor has an efficiency of $80\\%$ and delivers $1600\\text{ J}$ of useful mechanical work. What is the total electrical energy input supplied to the motor?',
        options: {
          A: '$2000\\text{ J}$',
          B: '$1280\\text{ J}$',
          C: '$1600\\text{ J}$',
          D: '$2400\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$\\text{Efficiency} = \\frac{\\text{Output}}{\\text{Input}} \\times 100 \\implies 80 = \\frac{1600}{\\text{Input}} \\times 100 \\implies \\text{Input} = \\frac{1600 \\times 100}{80} = 2000\\text{ J}$.',
        difficulty: 'medium',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
      // New 10 MCQs (11 to 20)
      {
        question: 'How much thermal energy is needed to convert $0.2\\text{ kg}$ of boiling water at $100^\\circ\\text{C}$ into steam at $100^\\circ\\text{C}$ (given $L_v = 2.26 \\times 10^6\\text{ J/kg}$)?',
        options: {
          A: '$452,000\\text{ J}$ ($452\\text{ kJ}$)',
          B: '$226,000\\text{ J}$',
          C: '$1,130,000\\text{ J}$',
          D: '$904,000\\text{ J}$',
        },
        correctAnswer: 'A',
        explanation: '$Q = m L_v = 0.2\\text{ kg} \\times 2.26 \\times 10^6\\text{ J/kg} = 452,000\\text{ J} = 452\\text{ kJ}$.',
        difficulty: 'medium',
      },
      {
        question: 'The lowest possible theoretical temperature, known as Absolute Zero ($0\\text{ K}$ or $-273.15^\\circ\\text{C}$), is the temperature at which:',
        options: {
          A: 'All molecular translational kinetic motion of matter ceases and gas pressure theoretically becomes zero',
          B: 'Water freezes into ice at sea level',
          C: 'Liquid nitrogen boils',
          D: 'All liquids solidify into gas',
        },
        correctAnswer: 'A',
        explanation: 'Absolute zero ($0\\text{ K} = -273.15^\\circ\\text{C}$) is the thermodynamic limit where internal kinetic energy and molecular motion reach their theoretical minimum.',
        difficulty: 'easy',
      },
      {
        question: 'A bimetallic strip consists of brass (higher expansion coefficient) and iron (lower expansion coefficient) welded together. When heated, the strip:',
        options: {
          A: 'Bends into a curve with the brass on the outer convex side',
          B: 'Bends with the iron on the outer convex side',
          C: 'Remains completely straight',
          D: 'Expands only in thickness',
        },
        correctAnswer: 'A',
        explanation: 'Because brass expands more than iron for the same temperature rise, it forces the strip to bend into an arc with brass on the longer outer convex curve.',
        difficulty: 'medium',
      },
      {
        question: 'Land breezes and sea breezes near coastal regions are caused primarily by:',
        options: {
          A: 'Convection currents created because land has a much lower specific heat capacity than sea water and heats/cools faster',
          B: 'Earth\'s magnetic field variations',
          C: 'Tidal gravitational forces of the Moon',
          D: 'Evaporation of salt',
        },
        correctAnswer: 'A',
        explanation: 'Land heats up faster than water by day, creating rising warm air and incoming sea breezes; by night, land cools faster, driving land breezes seaward.',
        difficulty: 'medium',
      },
      {
        question: 'Two bodies placed in thermal contact are said to be in Thermal Equilibrium when:',
        options: {
          A: 'Both bodies reach the exact same temperature and net heat transfer between them is zero',
          B: 'Both bodies contain identical total thermal heat energy',
          C: 'Both bodies have identical mass and volume',
          D: 'One body has zero temperature',
        },
        correctAnswer: 'A',
        explanation: 'Thermal equilibrium occurs when temperatures equalize, so that the net rate of heat transfer between interacting objects is zero.',
        difficulty: 'easy',
      },
      {
        question: 'Small gaps are intentionally left between adjacent lengths of steel railway tracks during construction in order to:',
        options: {
          A: 'Allow space for linear thermal expansion of steel in hot summer seasons to prevent buckling',
          B: 'Let rainwater drain away from the rails',
          C: 'Reduce the weight of the railway track',
          D: 'Increase the speed of the train',
        },
        correctAnswer: 'A',
        explanation: 'Steel expands significantly with summer heat ($\\Delta L = L_0 \\alpha \\Delta T$). Expansion gaps accommodate this length increase without track distortion or buckling.',
        difficulty: 'easy',
      },
      {
        question: 'A patient\'s fever temperature is measured as $104^\\circ\\text{F}$. What is this temperature in the Celsius scale?',
        options: {
          A: '$40^\\circ\\text{C}$',
          B: '$38.5^\\circ\\text{C}$',
          C: '$42^\\circ\\text{C}$',
          D: '$37^\\circ\\text{C}$',
        },
        correctAnswer: 'A',
        explanation: '$C = \\frac{5}{9}(F - 32) = \\frac{5}{9}(104 - 32) = \\frac{5}{9}(72) = 5 \\times 8 = 40^\\circ\\text{C}$.',
        difficulty: 'medium',
      },
      {
        question: 'A solid gold ornament has a mass of $386\\text{ g}$. If the density of pure gold is $19.3\\text{ g/cm}^3$, what is the volume of the ornament?',
        options: {
          A: '$20\\text{ cm}^3$',
          B: '$200\\text{ cm}^3$',
          C: '$7.45\\text{ cm}^3$',
          D: '$2\\text{ cm}^3$',
        },
        correctAnswer: 'A',
        explanation: '$V = \\frac{m}{\\rho} = \\frac{386\\text{ g}}{19.3\\text{ g/cm}^3} = 20\\text{ cm}^3$.',
        difficulty: 'easy',
      },
      {
        question: 'The SI unit of specific heat capacity ($c = \\frac{Q}{m \\Delta T}$) is:',
        options: {
          A: '$\\text{J/(kg}\\cdot\\text{K)}$ or $\\text{J/(kg}\\cdot^\\circ\\text{C)}$',
          B: '$\\text{J/kg}$',
          C: '$\\text{J/K}$',
          D: '$\\text{J}\\cdot\\text{kg}\\cdot\\text{K}$',
        },
        correctAnswer: 'A',
        explanation: 'Specific heat capacity is energy per unit mass per unit temperature change, giving units of $\\text{Joules per kilogram per Kelvin} = \\text{J/(kg}\\cdot\\text{K)}$.',
        difficulty: 'easy',
      },
      {
        question: 'Why does sweating or water evaporation produce a cooling sensation on the skin?',
        options: {
          A: 'High-energy water molecules escape into vapor, carrying away latent heat of vaporization from the skin',
          B: 'Water cools the air by condensing',
          C: 'Water reacts chemically with skin proteins',
          D: 'Atmospheric pressure increases on wet surfaces',
        },
        correctAnswer: 'A',
        explanation: 'Fast-moving molecules with higher kinetic energy escape during evaporation, reducing the average kinetic energy (and temperature) of remaining liquid on the skin.',
        difficulty: 'medium',
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
        difficulty: 'easy',
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
        difficulty: 'medium',
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
      // New 10 MCQs (11 to 20)
      {
        question: 'According to the domain theory of magnetism, in an unmagnetized piece of iron:',
        options: {
          A: 'Magnetic domains are randomly oriented, so their magnetic fields cancel each other out',
          B: 'All magnetic domains point in the same direction',
          C: 'Atoms possess zero net spin or magnetic dipole moments',
          D: 'All electrons have escaped from the iron lattice',
        },
        correctAnswer: 'A',
        explanation: 'In an unmagnetized iron bar, individual microscopic domains (clusters of aligned dipoles) point in random directions, producing a net zero external magnetic field.',
        difficulty: 'medium',
      },
      {
        question: 'When grasping a straight current-carrying conductor with the right hand so the thumb points in the direction of conventional electric current, the curled fingers indicate:',
        options: {
          A: 'The direction of the circular magnetic field lines around the wire',
          B: 'The direction of electrostatic force',
          C: 'The direction of electron drift',
          D: 'The gravitational pull',
        },
        correctAnswer: 'A',
        explanation: 'By the Right-Hand Grip Rule, the curled fingers encircle the wire in the direction of the concentric magnetic field lines.',
        difficulty: 'easy',
      },
      {
        question: 'Soft iron pieces called "magnetic keepers" are placed across the ends of bar magnets during storage in order to:',
        options: {
          A: 'Form closed continuous magnetic loops and prevent self-demagnetization from free poles',
          B: 'Make the magnets lighter in weight',
          C: 'Conduct electric current through the magnets',
          D: 'Prevent magnets from rusting',
        },
        correctAnswer: 'A',
        explanation: 'Unshielded end poles produce demagnetizing fields. Soft iron keepers complete closed magnetic loops, preserving domain alignment indefinitely.',
        difficulty: 'medium',
      },
      {
        question: 'A freely suspended magnetic needle aligns itself approximately in the North-South direction because:',
        options: {
          A: 'Earth acts like a giant bar magnet with its magnetic South pole situated near the geographic North pole',
          B: 'Earth rotates from East to West',
          C: 'The Sun pulls the North pole with solar gravity',
          D: 'Atmospheric pressure pushes the needle North',
        },
        correctAnswer: 'A',
        explanation: 'The North-seeking pole of a compass is attracted towards Earth\'s northern geographic region because the magnetic South pole of Earth resides near the geographic North pole.',
        difficulty: 'medium',
      },
      {
        question: 'The temporary magnetization of a soft iron nail when brought close to or in contact with a permanent magnet is known as:',
        options: {
          A: 'Magnetic induction',
          B: 'Electromagnetic radiation',
          C: 'Electrostatic friction',
          D: 'Thermal ionization',
        },
        correctAnswer: 'A',
        explanation: 'Magnetic induction is the process by which an unmagnetized magnetic material acquires magnetic properties when placed within a magnetic field.',
        difficulty: 'easy',
      },
      {
        question: 'The magnetic field inside a long, tightly wound current-carrying solenoid is:',
        options: {
          A: 'Uniform and parallel along the axis of the solenoid',
          B: 'Zero everywhere inside',
          C: 'Strongest at the outer surface and zero at the center',
          D: 'Radially outward',
        },
        correctAnswer: 'A',
        explanation: 'Inside a long solenoid, magnetic field lines are straight, parallel, and evenly spaced, indicating a uniform and strong magnetic field.',
        difficulty: 'medium',
      },
      {
        question: 'An electromagnetic relay switch is an electrical device designed to:',
        options: {
          A: 'Control a high-voltage, high-current circuit safely using a low-voltage, low-current control signal',
          B: 'Store permanent electrostatic charges',
          C: 'Convert alternating current into direct current',
          D: 'Generate mechanical power like an engine',
        },
        correctAnswer: 'A',
        explanation: 'An electromagnetic relay uses a small current in an electromagnet coil to attract an armature, closing contacts in a separate high-power circuit.',
        difficulty: 'medium',
      },
      {
        question: 'A steel needle can be magnetized most strongly and uniformly by:',
        options: {
          A: 'Placing it inside a solenoid carrying a direct current (DC)',
          B: 'Placing it inside a coil carrying alternating current (AC)',
          C: 'Heating it red hot in a furnace',
          D: 'Rubbing it with plastic wrap',
        },
        correctAnswer: 'A',
        explanation: 'Direct current in a solenoid establishes a strong, steady, unidirectional magnetic field that permanently aligns magnetic domains in steel.',
        difficulty: 'easy',
      },
      {
        question: 'Which of the following substances is completely non-magnetic and cannot be magnetized or attracted by a magnet?',
        options: {
          A: 'Copper (as well as Brass, Wood, and Glass)',
          B: 'Steel',
          C: 'Nickel',
          D: 'Cobalt',
        },
        correctAnswer: 'A',
        explanation: 'Copper, brass, aluminum, wood, and glass are non-magnetic materials with no net ferromagnetism and are unaffected by ordinary magnetic fields.',
        difficulty: 'easy',
      },
      {
        question: 'Magnetic levitation (Maglev) bullet trains achieve ultra-high speeds with minimal friction because:',
        options: {
          A: 'Electromagnets produce magnetic repulsion that lifts the train above the guideway track, eliminating mechanical rolling friction',
          B: 'Trains run in a vacuum tube without motors',
          C: 'Permanent magnets pull the train using gravitational force',
          D: 'Air resistance is converted into electricity',
        },
        correctAnswer: 'A',
        explanation: 'Maglev trains employ magnetic repulsion between onboard superconducting magnets and track coils to hover 10–15 mm above the track, eliminating surface friction.',
        difficulty: 'easy',
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
        difficulty: 'easy',
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
        difficulty: 'easy',
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
        difficulty: 'easy',
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
        difficulty: 'easy',
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
      // New 10 MCQs (11 to 20)
      {
        question: 'Muhammad ibn Musa al-Khwarizmi made groundbreaking contributions to scientific calculation and mathematics through his seminal book:',
        options: {
          A: '*Kitab al-Jabr wa-l-Muqabala* (The Compendious Book on Calculation by Completion and Balancing)',
          B: '*Al-Hawi*',
          C: '*Canon of Medicine*',
          D: '*Tahqiq ma li-l-Hind*',
        },
        correctAnswer: 'A',
        explanation: 'Al-Khwarizmi\'s *Kitab al-Jabr* founded algebra, introduced decimal positional algorithms, and provided mathematical tools fundamental to physics.',
        difficulty: 'easy',
      },
      {
        question: 'The branch of physics that studies heat and temperature, and their relation to energy, work, and properties of matter is:',
        options: {
          A: 'Thermodynamics',
          B: 'Electrodynamics',
          C: 'Astrophysics',
          D: 'Acoustics',
        },
        correctAnswer: 'A',
        explanation: 'Thermodynamics is the branch of physics dealing with heat, temperature, thermal processes, heat engines, and energy transformations.',
        difficulty: 'easy',
      },
      {
        question: 'Pakistani theoretical physicist Professor Dr. Abdus Salam was awarded the Nobel Prize in Physics (1979) for:',
        options: {
          A: 'The Electroweak Unification Theory unifying electromagnetic and weak nuclear forces',
          B: 'The invention of the scanning electron microscope',
          C: 'The discovery of the neutron',
          D: 'The invention of the transistor',
        },
        correctAnswer: 'A',
        explanation: 'Dr. Abdus Salam shared the 1979 Nobel Prize in Physics with Sheldon Glashow and Steven Weinberg for unifying the electromagnetic and weak nuclear forces into the Electroweak Force.',
        difficulty: 'easy',
      },
      {
        question: 'Random errors in laboratory measurements arise from unpredictable ambient fluctuations or human reading variations. Random error is best minimized by:',
        options: {
          A: 'Taking multiple independent readings and calculating their arithmetic average (mean)',
          B: 'Adding a constant zero correction to every reading',
          C: 'Using only mechanical spring balances',
          D: 'Ignoring all decimal fractions',
        },
        correctAnswer: 'A',
        explanation: 'Because random errors scatter symmetrically above and below the true value, computing the mean of repeated measurements cancels out statistical deviations.',
        difficulty: 'medium',
      },
      {
        question: 'In physics, a concise verbal statement or mathematical equation describing an established, universal pattern of nature under specified conditions is called a:',
        options: {
          A: 'Scientific Law (e.g. Newton\'s Law of Gravitation, $F = G\\frac{m_1 m_2}{r^2}$)',
          B: 'Hypothesis',
          C: 'Speculation',
          D: 'Laboratory guideline',
        },
        correctAnswer: 'A',
        explanation: 'A scientific law summarizes an observed regular phenomenon or universal relationship (often mathematically) supported by extensive empirical validation.',
        difficulty: 'easy',
      },
      {
        question: 'The interdisciplinary branch of science that applies the principles and methods of physics to understand biological phenomena and molecular living systems is:',
        options: {
          A: 'Biophysics',
          B: 'Geophysics',
          C: 'Astrophysics',
          D: 'Solid State Physics',
        },
        correctAnswer: 'A',
        explanation: 'Biophysics applies physical principles (optics, thermodynamics, mechanics, electricity) to biological structures such as nerve impulses, DNA, and cell membranes.',
        difficulty: 'easy',
      },
      {
        question: 'Parallax error in measuring instruments with needle pointers or graduated scales occurs when:',
        options: {
          A: 'The observer\'s eye is positioned at an oblique angle rather than perpendicular to the scale',
          B: 'The room temperature changes during the experiment',
          C: 'The scale has an incorrect zero marking',
          D: 'The battery voltage is low',
        },
        correctAnswer: 'A',
        explanation: 'Parallax error is an optical error caused by viewing a scale and pointer from an inclined angle instead of looking perpendicularly directly above the marking.',
        difficulty: 'easy',
      },
      {
        question: 'Magnetic Resonance Imaging (MRI) scanners utilized in hospital diagnostics rely primarily on principles from which subfields of physics?',
        options: {
          A: 'Strong magnetic fields and radiofrequency electromagnetic resonance of hydrogen nuclei',
          B: 'X-ray ionizing radiation only',
          C: 'Ultrasound mechanical waves only',
          D: 'Electrostatic friction between tissues',
        },
        correctAnswer: 'A',
        explanation: 'MRI utilizes strong superconducting magnetic fields and radiofrequency electromagnetic pulses to image proton spins in body tissues without ionizing radiation.',
        difficulty: 'medium',
      },
      {
        question: 'The branch of physics that applies physical laws (seismology, magnetism, gravity) to study the interior structure and dynamics of the Earth is called:',
        options: {
          A: 'Geophysics',
          B: 'Astrophysics',
          C: 'Plasma Physics',
          D: 'Atomic Physics',
        },
        correctAnswer: 'A',
        explanation: 'Geophysics investigates Earth\'s internal core, tectonic plate movements, earthquakes, volcanic activity, and geomagnetic fields.',
        difficulty: 'easy',
      },
      {
        question: 'In the event of an electrical fire breaking out in a physics laboratory equipment rack, the appropriate fire extinguisher to use is:',
        options: {
          A: 'Carbon Dioxide ($\\text{CO}_2$) or Dry Powder extinguisher (never water)',
          B: 'A bucket of tap water',
          C: 'A stream of oxygen gas',
          D: 'Covering the rack with a wet towel',
        },
        correctAnswer: 'A',
        explanation: 'Water conducts electricity and presents severe electrocution hazards on live electrical fires. Non-conducting $\\text{CO}_2$ or dry chemical powder extinguishers are mandatory.',
        difficulty: 'easy',
      },
    ],
  },
};

async function execute() {
  console.log('Populating Grade 9 Physics Question Bank (20 MCQs per chapter)...');

  // Load existing grade9FbiseBank.json
  const jsonPath = path.join(process.cwd(), 'src/data/grade9FbiseBank.json');
  let bank: Record<string, Record<string, StoredMCQ[]>> = {};
  if (fs.existsSync(jsonPath)) {
    try {
      bank = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch {
      bank = {};
    }
  }

  if (!bank['Physics']) {
    bank['Physics'] = {};
  }

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

    // Handle hyphen aliases (e.g. Dynamics – I and Dynamics-I)
    if (chapName === 'Dynamics-I') {
      bank['Physics']['Dynamics – I'] = list;
    }
    if (chapName === 'Dynamics-II') {
      bank['Physics']['Dynamics – II'] = list;
    }

    console.log(`✓ Chapter ${chNum}: "${chapName}" — ${list.length} verified MCQs`);
  }

  // Save to src/data/grade9FbiseBank.json
  fs.writeFileSync(jsonPath, serializeQuestionBankToJson(bank, 2), 'utf-8');
  console.log(`Saved updated JSON to ${jsonPath}`);
}

execute().catch(console.error);
