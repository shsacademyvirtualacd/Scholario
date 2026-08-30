import type { StoredLongQuestion } from '../../types/questionBank';

/**
 * Authoritative Curated Long Question Bank
 * Comprehensive multi-part long questions, theoretical derivations,
 * and numerical problems for Grade 9, 10, 11, 12 FBISE & Sindh Board.
 */
export const longQuestionsBank: Record<string, Record<string, StoredLongQuestion[]>> = {
  Physics: {
    'Physical Quantities and Measurement': [
      {
        id: 'lq_phy9_ch1_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Physical Quantities and Measurement',
        chapterNumber: 1,
        question: 'Explain the construction and working of a Vernier Calipers. Describe how positive and negative zero errors are calculated and corrected.',
        parts: [
          {
            label: '(a)',
            text: 'Describe the main components of Vernier Calipers and derive the formula for its Least Count.',
            marks: 4
          },
          {
            label: '(b)',
            text: 'Explain with diagrammatic reasoning the difference between Positive and Negative Zero Error and write down the formula for Zero Correction.',
            marks: 4
          }
        ],
        modelAnswer: '(a) Main components include Main Scale (graduated in mm/cm) and Vernier Scale (10 sliding divisions = 9 mm on main scale). Least Count = Value of 1 smallest main scale division (1 mm) / Total number of vernier divisions (10) = 0.1 mm = 0.01 cm.\n\n(b) Positive Zero Error: Vernier zero lies to the right of main scale zero when jaws are closed (observed reading is greater than true value; zero error is positive, correction is subtracted). Negative Zero Error: Vernier zero lies to the left of main scale zero (observed reading is smaller than true value; zero error is negative, correction is added). Correct Reading = Observed Reading - Zero Error.',
        markingScheme: [
          '2 marks for construction & components',
          '2 marks for least count derivation and formula',
          '2 marks for positive zero error definition & correction',
          '2 marks for negative zero error definition & correction'
        ],
        marks: 8,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    Kinematics: [
      {
        id: 'lq_phy9_ch2_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Kinematics',
        chapterNumber: 2,
        question: 'Derive the equations of motion for uniformly accelerated rectilinear motion using a speed-time graph.',
        parts: [
          {
            label: '(a)',
            text: 'Using a speed-time graph with initial velocity v_i, final velocity v_f, acceleration a, and time t, derive the second equation of motion: S = v_i*t + (1/2)*a*t².',
            marks: 5
          },
          {
            label: '(b)',
            text: 'A train starts from rest with an acceleration of 0.5 m/s². Find its speed in km/h when it has moved through 100 meters.',
            marks: 3
          }
        ],
        modelAnswer: '(a) In a speed-time graph, the total distance S is equal to the total area of trapezium OABD under the slope line AB. Area of OABD = Area of rectangle OACD + Area of triangle ABC. Area of rectangle = OA * OD = v_i * t. Area of triangle = 1/2 * Base * Height = 1/2 * t * (v_f - v_i). Since (v_f - v_i) = a*t, Area of triangle = 1/2 * a * t². Total distance S = v_i*t + 1/2*a*t².\n\n(b) Given: v_i = 0 m/s, a = 0.5 m/s², S = 100 m. Using 3rd equation of motion: 2aS = v_f² - v_i² => 2(0.5)(100) = v_f² - 0 => 100 = v_f² => v_f = 10 m/s. Speed in km/h = 10 * (3600/1000) = 36 km/h.',
        markingScheme: [
          '2 marks for speed-time graph description and geometric area breakdown',
          '3 marks for mathematical derivation of S = v_i*t + 1/2*a*t²',
          '3 marks for numerical solution with proper units (10 m/s = 36 km/h)'
        ],
        marks: 8,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Dynamics – I': [
      {
        id: 'lq_phy9_ch3_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Dynamics – I',
        chapterNumber: 3,
        question: "State and prove Newton's Second Law of Motion. Derive the relation between force, mass, and acceleration.",
        parts: [
          {
            label: '(a)',
            text: 'State Newton’s Second Law of Motion and derive the mathematical expression F = ma. Define 1 Newton force.',
            marks: 5
          },
          {
            label: '(b)',
            text: 'A force of 20 N acts on a body of mass 5 kg. What is the acceleration produced? If the same force acts on a 10 kg mass, compare the accelerations.',
            marks: 3
          }
        ],
        modelAnswer: '(a) Statement: When a net force acts on a body, it produces acceleration in the direction of the force. This acceleration is directly proportional to the force (a ∝ F) and inversely proportional to the mass of the body (a ∝ 1/m). Combining both: a ∝ F/m => F ∝ ma => F = k*ma. In SI units, constant k = 1, hence F = ma. 1 Newton is defined as the force which produces an acceleration of 1 m/s² in a body of mass 1 kg.\n\n(b) For body 1: a₁ = F / m₁ = 20 / 5 = 4 m/s². For body 2: a₂ = F / m₂ = 20 / 10 = 2 m/s². Acceleration of body 1 is double that of body 2 (a₁ = 2 * a₂).',
        markingScheme: [
          '2 marks for statement & proportionalities',
          '2 marks for mathematical derivation F = ma',
          '1 mark for definition of 1 Newton',
          '3 marks for numerical comparison and working'
        ],
        marks: 8,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ],
    'Work and Energy': [
      {
        id: 'lq_phy9_ch6_01',
        board: 'fbise',
        grade: '9',
        subject: 'Physics',
        chapter: 'Work and Energy',
        chapterNumber: 6,
        question: 'Define Kinetic Energy and Potential Energy. Derive the mathematical formulas for both.',
        parts: [
          {
            label: '(a)',
            text: 'Derive the formula for Kinetic Energy: E_k = (1/2)mv² of a body of mass m moving with velocity v.',
            marks: 4
          },
          {
            label: '(b)',
            text: 'Derive the formula for Gravitational Potential Energy: E_p = mgh for a body lifted to height h against gravity.',
            marks: 4
          }
        ],
        modelAnswer: '(a) Consider a body of mass m moving with initial velocity v. It comes to rest (v_f = 0) after covering distance S against retarding force F. Work done = F * S. By 3rd equation of motion: 2aS = v_f² - v_i² => 2(-a)S = 0 - v² => S = v² / (2a). Since F = ma, Work = (ma) * (v² / 2a) = (1/2) m v². This work done equals the kinetic energy: E_k = 1/2 m v².\n\n(b) Consider a body of mass m lifted vertically to a height h. Force required to lift the body with uniform velocity is equal to its weight: F = w = mg. Work done in lifting = Force * Height = mg * h = mgh. This work is stored as Gravitational Potential Energy: E_p = mgh.',
        markingScheme: [
          '4 marks for kinetic energy derivation step-by-step',
          '4 marks for gravitational potential energy derivation step-by-step'
        ],
        marks: 8,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  },
  Chemistry: {
    'Atomic Structure': [
      {
        id: 'lq_chem9_ch3_01',
        board: 'fbise',
        grade: '9',
        subject: 'Chemistry',
        chapter: 'Atomic Structure',
        chapterNumber: 3,
        question: 'Compare Rutherford’s Atomic Model and Bohr’s Atomic Theory in detail.',
        parts: [
          {
            label: '(a)',
            text: 'Describe Rutherford’s gold foil experiment, observations, and key conclusions regarding the atomic nucleus.',
            marks: 4
          },
          {
            label: '(b)',
            text: 'State the main postulates of Bohr’s Atomic Theory and explain how it resolved the defects of Rutherford’s model.',
            marks: 4
          }
        ],
        modelAnswer: '(a) Rutherford bombarded a 0.00004 cm thick gold foil with alpha particles. Observations: Most particles passed straight undeflected; few were deflected at large angles; very few bounced back. Conclusions: Most of the atom is empty space; positive charge and nearly all mass is concentrated in a tiny dense region called the nucleus; electrons revolve around the nucleus.\n\n(b) Postulates of Bohr’s Theory: (1) Electrons revolve only in certain fixed circular orbits called energy levels or shells without radiating energy. (2) Each orbit has a fixed quantized energy. (3) Energy is emitted or absorbed only when an electron jumps from one orbit to another: ΔE = E₂ - E₁ = hν. (4) Angular momentum of revolving electron is quantized: mvr = nh / (2π). This resolved the continuous radiation collapse defect of Rutherford.',
        markingScheme: [
          '2 marks for experiment description & observations',
          '2 marks for Rutherford conclusions',
          '3 marks for Bohr postulates (quantized orbits, photon emission/absorption, mvr = nh/2π)',
          '1 mark for resolution of Rutherford defects'
        ],
        marks: 8,
        difficulty: 'hard',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  },
  Biology: {
    'The Cell': [
      {
        id: 'lq_bio9_ch3_01',
        board: 'fbise',
        grade: '9',
        subject: 'Biology',
        chapter: 'The Cell',
        chapterNumber: 3,
        question: 'Describe the structure and function of the Cell Membrane with the help of the Fluid Mosaic Model.',
        parts: [
          {
            label: '(a)',
            text: 'Explain the Fluid Mosaic Model of Singer and Nicolson, detailing the lipid bilayer, intrinsic and extrinsic proteins, and carbohydrates.',
            marks: 5
          },
          {
            label: '(b)',
            text: 'Differentiate between Passive Transport (Diffusion, Osmosis, Facilitated Diffusion) and Active Transport across cell membranes.',
            marks: 3
          }
        ],
        modelAnswer: '(a) Proposed by Singer & Nicolson (1972). Phospholipids are arranged in a continuous fluid bilayer with hydrophilic polar phosphate heads facing outward and hydrophobic fatty acid tails facing inward. Proteins float in or traverse the bilayer like icebergs in a sea (integral transmembrane proteins serve as channels/carriers; peripheral proteins act as receptors/enzymes). Glycoproteins and glycolipids on the outer surface function in cell-to-cell recognition.\n\n(b) Passive transport moves molecules down a concentration gradient (high to low concentration) without requiring cellular ATP energy (e.g. simple diffusion of O₂/CO₂, osmosis of water, facilitated diffusion via permeases). Active transport moves solute particles against the concentration gradient (low to high concentration) utilizing metabolic ATP energy via protein pumps (e.g. Na⁺/K⁺ ATPase pump).',
        markingScheme: [
          '3 marks for fluid mosaic model structure and lipid bilayer description',
          '2 marks for protein & carbohydrate membrane roles',
          '3 marks for active vs passive transport comparison with examples'
        ],
        marks: 8,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  },
  Mathematics: {
    'Quadratic Equations': [
      {
        id: 'lq_math10_ch1_01',
        board: 'fbise',
        grade: '10',
        subject: 'Mathematics',
        chapter: 'Quadratic Equations',
        chapterNumber: 1,
        question: 'Solve radical and reducible quadratic equations.',
        parts: [
          {
            label: '(a)',
            text: 'Solve the equation by method of completing the square: 7x² + 2x - 1 = 0.',
            marks: 4
          },
          {
            label: '(b)',
            text: 'Solve the reducible equation: 2x⁴ - 11x² + 5 = 0.',
            marks: 4
          }
        ],
        modelAnswer: '(a) 7x² + 2x - 1 = 0 => x² + (2/7)x - 1/7 = 0 => x² + 2(x)(1/7) = 1/7. Adding (1/7)² = 1/49 to both sides: (x + 1/7)² = 1/7 + 1/49 = (7 + 1)/49 = 8/49. Taking square root: x + 1/7 = ±√(8/49) = ±(2√2)/7 => x = (-1 ± 2√2) / 7. Solution set: {(-1 ± 2√2) / 7}.\n\n(b) Let y = x². The equation becomes: 2y² - 11y + 5 = 0 => 2y² - 10y - y + 5 = 0 => 2y(y - 5) - 1(y - 5) = 0 => (2y - 1)(y - 5) = 0 => y = 1/2 or y = 5. Since y = x²: x² = 1/2 => x = ±1/√2. And x² = 5 => x = ±√5. Solution set: {±1/√2, ±√5}.',
        markingScheme: [
          '4 marks for completing square steps, square root, and solution set',
          '4 marks for substitution y = x², factorization of y, back-substitution, and four roots'
        ],
        marks: 8,
        difficulty: 'medium',
        verified: true,
        source: 'curriculum-bank'
      }
    ]
  }
};

export default longQuestionsBank;
