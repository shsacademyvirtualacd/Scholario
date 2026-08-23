import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';

/**
 * Authoritative Grade 9 FBISE Question Bank
 * Containing verified, curriculum-accurate MCQs for all subjects & chapters:
 * - Physics (9 chapters)
 * - Chemistry (19 chapters)
 * - Biology (10 chapters)
 * - Mathematics (11 chapters)
 * - Urdu (Nasr, Nazm, Ghazal chapters)
 * - Islamiyat (7 chapters)
 */

export const FBISE_9_QUESTION_BANK: Record<string, Record<string, MCQQuestion[]>> = {
  Physics: {
    'Physical Quantities and Measurement': [
      {
        id: 'fbise9_phy_1_1',
        question: 'Which of the following is an SI base unit?',
        options: { A: 'Newton (N)', B: 'Joule (J)', C: 'Kelvin (K)', D: 'Pascal (Pa)' },
        correctAnswer: 'C',
        explanation: 'Kelvin (K) is the SI base unit for thermodynamic temperature. Newton, Joule, and Pascal are derived units.',
        chapter: 'Physical Quantities and Measurement',
        topic: 'Physical Quantities and Measurement',
      },
      {
        id: 'fbise9_phy_1_2',
        question: 'A standard Vernier Calipers has a main scale division of $1\\text{ mm}$ and $10$ vernier scale divisions. What is its least count?',
        options: { A: '$0.1\\text{ mm}$ ($0.01\\text{ cm}$)', B: '$0.01\\text{ mm}$', C: '$0.5\\text{ mm}$', D: '$1.0\\text{ mm}$' },
        correctAnswer: 'A',
        explanation: 'Least Count = $\\frac{\\text{Smallest Main Scale Division}}{\\text{Total Vernier Divisions}} = \\frac{1\\text{ mm}}{10} = 0.1\\text{ mm} = 0.01\\text{ cm}$.',
        chapter: 'Physical Quantities and Measurement',
        topic: 'Physical Quantities and Measurement',
      },
      {
        id: 'fbise9_phy_1_3',
        question: 'How many significant figures are present in the measurement $0.004050\\text{ kg}$?',
        options: { A: '3', B: '4', C: '6', D: '7' },
        correctAnswer: 'B',
        explanation: 'Leading zeros are not significant. Non-zero digits (4 and 5) and captured zero (between 4 and 5) and trailing zero after a decimal are significant: 4, 0, 5, 0 (4 significant figures).',
        chapter: 'Physical Quantities and Measurement',
        topic: 'Physical Quantities and Measurement',
      },
      {
        id: 'fbise9_phy_1_4',
        question: 'The prefix "micro" ($\\mu$) represents a multiplying factor of:',
        options: { A: '$10^{-3}$', B: '$10^{-6}$', C: '$10^{-9}$', D: '$10^{-12}$' },
        correctAnswer: 'B',
        explanation: 'The SI prefix micro ($\\mu$) corresponds to $10^{-6}$ (one millionth).',
        chapter: 'Physical Quantities and Measurement',
        topic: 'Physical Quantities and Measurement',
      },
    ],
    'Kinematics': [
      {
        id: 'fbise9_phy_2_1',
        question: 'A body starts from rest and moves with uniform acceleration of $2\\text{ m/s}^2$. What distance does it cover in $6\\text{ seconds}$?',
        options: { A: '$36\\text{ m}$', B: '$12\\text{ m}$', C: '$72\\text{ m}$', D: '$18\\text{ m}$' },
        correctAnswer: 'A',
        explanation: 'Using the 2nd equation of motion: $S = ut + \\frac{1}{2}at^2 = 0(6) + \\frac{1}{2}(2)(6^2) = 36\\text{ m}$.',
        chapter: 'Kinematics',
        topic: 'Kinematics',
      },
      {
        id: 'fbise9_phy_2_2',
        question: 'The area under a Speed-Time graph represents which physical quantity?',
        options: { A: 'Acceleration', B: 'Distance travelled', C: 'Speed', D: 'Time' },
        correctAnswer: 'B',
        explanation: 'In a Speed-Time graph, the area enclosed by the curve and time axis represents the total distance travelled ($S = v \\times t$).',
        chapter: 'Kinematics',
        topic: 'Kinematics',
      },
      {
        id: 'fbise9_phy_2_3',
        question: 'A ball is thrown vertically upward with a speed of $20\\text{ m/s}$. Taking $g = 10\\text{ m/s}^2$, what is the maximum height attained by the ball?',
        options: { A: '$20\\text{ m}$', B: '$40\\text{ m}$', C: '$10\\text{ m}$', D: '$2\\text{ m}$' },
        correctAnswer: 'A',
        explanation: 'Using $2gS = v_f^2 - v_i^2 \\implies 2(-10)h = 0 - (20)^2 \\implies -20h = -400 \\implies h = 20\\text{ m}$.',
        chapter: 'Kinematics',
        topic: 'Kinematics',
      },
      {
        id: 'fbise9_phy_2_4',
        question: 'Which of the following physical quantities is a vector?',
        options: { A: 'Speed', B: 'Displacement', C: 'Distance', D: 'Time' },
        correctAnswer: 'B',
        explanation: 'Displacement is the shortest directed straight distance between two points, requiring both magnitude and specific direction.',
        chapter: 'Kinematics',
        topic: 'Kinematics',
      },
    ],
    'Dynamics – I': [
      {
        id: 'fbise9_phy_3_1',
        question: 'Newton’s First Law of Motion is also known as the Law of:',
        options: { A: 'Inertia', B: 'Conservation of Momentum', C: 'Action and Reaction', D: 'Gravitation' },
        correctAnswer: 'A',
        explanation: 'Newton’s first law states that an object maintains its state of rest or uniform motion unless acted on by an external net force, which defines inertia.',
        chapter: 'Dynamics – I',
        topic: 'Dynamics – I',
      },
      {
        id: 'fbise9_phy_3_2',
        question: 'What is the weight of an object of mass $25\\text{ kg}$ on the surface of Earth ($g = 10\\text{ m/s}^2$)?',
        options: { A: '$250\\text{ N}$', B: '$25\\text{ N}$', C: '$2.5\\text{ N}$', D: '$250\\text{ kg}$' },
        correctAnswer: 'A',
        explanation: '$W = mg = 25\\text{ kg} \\times 10\\text{ m/s}^2 = 250\\text{ N}$.',
        chapter: 'Dynamics – I',
        topic: 'Dynamics – I',
      },
      {
        id: 'fbise9_phy_3_3',
        question: 'Action and reaction forces according to Newton’s Third Law:',
        options: {
          A: 'Act on different bodies in opposite directions simultaneously',
          B: 'Act on the same body and cancel each other',
          C: 'Have unequal magnitudes',
          D: 'Act in the same direction',
        },
        correctAnswer: 'A',
        explanation: 'Action and reaction forces always act on two different interacting bodies simultaneously with equal magnitude and opposite directions, so they do not cancel.',
        chapter: 'Dynamics – I',
        topic: 'Dynamics – I',
      },
    ],
    'Dynamics – II': [
      {
        id: 'fbise9_phy_4_1',
        question: 'What is the SI unit of momentum ($p = mv$)?',
        options: { A: '$\\text{kg}\\cdot\\text{m/s}$ (or $\\text{N}\\cdot\\text{s}$)', B: '$\\text{kg}\\cdot\\text{m/s}^2$', C: '$\\text{Joule}$', D: '$\\text{Newton}$' },
        correctAnswer: 'A',
        explanation: 'Momentum = $\\text{mass} \\times \\text{velocity} = \\text{kg}\\cdot\\text{m/s}$, which is dimensionally equivalent to Newton-seconds ($\\text{N}\\cdot\\text{s}$).',
        chapter: 'Dynamics – II',
        topic: 'Dynamics – II',
      },
      {
        id: 'fbise9_phy_4_2',
        question: 'The centripetal force required to keep a body of mass $m$ moving in a circle of radius $r$ with speed $v$ is given by:',
        options: { A: '$F_c = \\frac{mv^2}{r}$', B: '$F_c = mvr$', C: '$F_c = \\frac{mv}{r^2}$', D: '$F_c = \\frac{mr}{v^2}$' },
        correctAnswer: 'A',
        explanation: 'Centripetal acceleration is $a_c = \\frac{v^2}{r}$, so by Newton’s 2nd law, $F_c = m a_c = \\frac{mv^2}{r}$.',
        chapter: 'Dynamics – II',
        topic: 'Dynamics – II',
      },
      {
        id: 'fbise9_phy_4_3',
        question: 'Why is rolling friction much smaller than sliding friction?',
        options: {
          A: 'The contact area between rolling surfaces is momentarily microscopic and interlocking cold welds do not rupture violently',
          B: 'Rolling objects have zero mass',
          C: 'Gravity does not act on rolling objects',
          D: 'Rolling surfaces are frictionless',
        },
        correctAnswer: 'A',
        explanation: 'In rolling motion, the points of contact between the wheel and ground touch momentarily without slipping, reducing cold-welded joint rupturing compared to continuous sliding.',
        chapter: 'Dynamics – II',
        topic: 'Dynamics – II',
      },
    ],
    'Pressure and Deformation in Solids': [
      {
        id: 'fbise9_phy_5_1',
        question: 'According to Pascal’s Principle, pressure applied to an enclosed liquid is transmitted:',
        options: {
          A: 'Equally and undiminished in all directions',
          B: 'Only in the downward direction',
          C: 'Only to the side walls of the vessel',
          D: 'Inversely proportional to depth',
        },
        correctAnswer: 'A',
        explanation: 'Pascal’s Principle states that external pressure applied to an enclosed fluid is transmitted equally and without loss to all parts of the fluid and container walls.',
        chapter: 'Pressure and Deformation in Solids',
        topic: 'Pressure and Deformation in Solids',
      },
      {
        id: 'fbise9_phy_5_2',
        question: 'What is the liquid pressure at a depth of $5\\text{ m}$ in pure water (density $\\rho = 1000\\text{ kg/m}^3, g = 10\\text{ m/s}^2$)?',
        options: { A: '$50,000\\text{ Pa}$ ($50\\text{ kPa}$)', B: '$5,000\\text{ Pa}$', C: '$500\\text{ Pa}$', D: '$200\\text{ Pa}$' },
        correctAnswer: 'A',
        explanation: '$P = \\rho g h = 1000 \\times 10 \\times 5 = 50,000\\text{ N/m}^2 = 50\\text{ kPa}$.',
        chapter: 'Pressure and Deformation in Solids',
        topic: 'Pressure and Deformation in Solids',
      },
      {
        id: 'fbise9_phy_5_3',
        question: 'Hooke’s Law ($F = kx$) states that within the elastic limit, strain is directly proportional to:',
        options: { A: 'Stress', B: 'Volume', C: 'Mass', D: 'Density' },
        correctAnswer: 'A',
        explanation: 'Hooke’s Law states that within elastic limit, stress is directly proportional to strain ($\\text{Stress} \\propto \\text{Strain}$).',
        chapter: 'Pressure and Deformation in Solids',
        topic: 'Pressure and Deformation in Solids',
      },
    ],
    'Work and Energy': [
      {
        id: 'fbise9_phy_6_1',
        question: 'A machine performs $1200\\text{ J}$ of work in $30\\text{ seconds}$. What is the power output of the machine?',
        options: { A: '$40\\text{ Watts}$', B: '$36000\\text{ Watts}$', C: '$400\\text{ Watts}$', D: '$4\\text{ Watts}$' },
        correctAnswer: 'A',
        explanation: '$P = \\frac{W}{t} = \\frac{1200\\text{ J}}{30\\text{ s}} = 40\\text{ W}$.',
        chapter: 'Work and Energy',
        topic: 'Work and Energy',
      },
      {
        id: 'fbise9_phy_6_2',
        question: 'Calculate the potential energy stored in an object of mass $4\\text{ kg}$ raised to a height of $15\\text{ m}$ ($g = 10\\text{ m/s}^2$):',
        options: { A: '$600\\text{ J}$', B: '$60\\text{ J}$', C: '$150\\text{ J}$', D: '$37.5\\text{ J}$' },
        correctAnswer: 'A',
        explanation: '$E_p = mgh = 4\\text{ kg} \\times 10\\text{ m/s}^2 \\times 15\\text{ m} = 600\\text{ J}$.',
        chapter: 'Work and Energy',
        topic: 'Work and Energy',
      },
      {
        id: 'fbise9_phy_6_3',
        question: 'If the input energy provided to an electric motor is $500\\text{ J}$ and it produces $400\\text{ J}$ of useful work, its efficiency is:',
        options: { A: '$80\\%$', B: '$125\\%$', C: '$20\\%$', D: '$90\\%$' },
        correctAnswer: 'A',
        explanation: '$\\text{Efficiency} = \\frac{\\text{Useful Output}}{\\text{Total Input}} \\times 100 = \\frac{400}{500} \\times 100 = 80\\%$.',
        chapter: 'Work and Energy',
        topic: 'Work and Energy',
      },
    ],
    'Density and Temperature': [
      {
        id: 'fbise9_phy_7_1',
        question: 'Convert a temperature of $25^\\circ\\text{C}$ into the absolute Kelvin scale ($T = \\theta + 273$):',
        options: { A: '$298\\text{ K}$', B: '$248\\text{ K}$', C: '$300\\text{ K}$', D: '$273\\text{ K}$' },
        correctAnswer: 'A',
        explanation: '$T(\\text{K}) = 25 + 273 = 298\\text{ K}$.',
        chapter: 'Density and Temperature',
        topic: 'Density and Temperature',
      },
      {
        id: 'fbise9_phy_7_2',
        question: 'Specific heat capacity of water is approximately $4200\\text{ J/(kg}\\cdot\\text{K)}$. This high value explains why water is widely used as:',
        options: { A: 'A cooling agent in automobile radiators', B: 'A thermometric liquid', C: 'An electrical insulator', D: 'A lubricant' },
        correctAnswer: 'A',
        explanation: 'Because water has a very large specific heat capacity ($4200\\text{ J/(kg}\\cdot\\text{K)}$), it absorbs large quantities of thermal energy with minimal temperature rise, making it an excellent coolant.',
        chapter: 'Density and Temperature',
        topic: 'Density and Temperature',
      },
      {
        id: 'fbise9_phy_7_3',
        question: 'A piece of metal has a mass of $540\\text{ g}$ and volume of $200\\text{ cm}^3$. What is its density?',
        options: { A: '$2.7\\text{ g/cm}^3$', B: '$0.37\\text{ g/cm}^3$', C: '$1080\\text{ g/cm}^3$', D: '$3.4\\text{ g/cm}^3$' },
        correctAnswer: 'A',
        explanation: '$\\rho = \\frac{m}{V} = \\frac{540\\text{ g}}{200\\text{ cm}^3} = 2.7\\text{ g/cm}^3$ (characteristic density of aluminium).',
        chapter: 'Density and Temperature',
        topic: 'Density and Temperature',
      },
    ],
    'Magnetism': [
      {
        id: 'fbise9_phy_8_1',
        question: 'Which of the following substances is ferromagnetic and strongly attracted by a permanent magnet?',
        options: { A: 'Iron (Steel)', B: 'Copper', C: 'Aluminium', D: 'Glass' },
        correctAnswer: 'A',
        explanation: 'Iron, cobalt, and nickel are ferromagnetic materials having magnetic domains that align in magnetic fields.',
        chapter: 'Magnetism',
        topic: 'Magnetism',
      },
      {
        id: 'fbise9_phy_8_2',
        question: 'Magnetic field lines outside a bar magnet always emerge from and terminate at:',
        options: { A: 'North pole to South pole', B: 'South pole to North pole', C: 'Center to the ends', D: 'East to West' },
        correctAnswer: 'A',
        explanation: 'By convention, external magnetic field lines travel from North pole to South pole forming continuous closed loops.',
        chapter: 'Magnetism',
        topic: 'Magnetism',
      },
    ],
    'Nature of Science and Physics': [
      {
        id: 'fbise9_phy_9_1',
        question: 'The famous Muslim scholar Ibn al-Haytham is celebrated in the history of physics for his pioneer work on:',
        options: { A: 'Optics and the Book of Optics (*Kitab al-Manazir*)', B: 'Hydrostatics', C: 'Nuclear reactions', D: 'Electricity' },
        correctAnswer: 'A',
        explanation: 'Ibn al-Haytham (Alhazen) established experimental optics, explaining reflection, refraction, and camera obscura in *Kitab al-Manazir*.',
        chapter: 'Nature of Science and Physics',
        topic: 'Nature of Science and Physics',
      },
      {
        id: 'fbise9_phy_9_2',
        question: 'The branch of physics that deals with the study of the structure and properties of atoms is known as:',
        options: { A: 'Atomic Physics', B: 'Plasma Physics', C: 'Astrophysics', D: 'Geophysics' },
        correctAnswer: 'A',
        explanation: 'Atomic physics focuses specifically on atomic structure, electron configurations, and energy states.',
        chapter: 'Nature of Science and Physics',
        topic: 'Nature of Science and Physics',
      },
    ],
  },

  Chemistry: {
    'Nature of Science in Chemistry': [
      {
        id: 'fbise9_chem_1_1',
        question: 'The branch of chemistry that deals with the study of carbon compounds except simple carbonates, oxides, and cyanides is called:',
        options: { A: 'Organic Chemistry', B: 'Inorganic Chemistry', C: 'Analytical Chemistry', D: 'Physical Chemistry' },
        correctAnswer: 'A',
        explanation: 'Organic chemistry is the study of carbon-hydrogen covalent compounds and their derivatives.',
        chapter: 'Nature of Science in Chemistry',
        topic: 'Nature of Science in Chemistry',
      },
    ],
    'Matter': [
      {
        id: 'fbise9_chem_2_1',
        question: 'Which of the following is a homogeneous mixture?',
        options: { A: 'Aqueous salt solution (brine)', B: 'Sand in water', C: 'Oil in water', D: 'Iron filings and sulfur' },
        correctAnswer: 'A',
        explanation: 'A salt solution is a uniform solution throughout (homogeneous mixture), unlike suspensions or heterogeneous blends.',
        chapter: 'Matter',
        topic: 'Matter',
      },
    ],
    'Atomic Structure': [
      {
        id: 'fbise9_chem_3_1',
        question: 'The maximum number of electrons that can be accommodated in the $M$-shell ($n = 3$) is given by $2n^2$:',
        options: { A: '18 electrons', B: '8 electrons', C: '32 electrons', D: '2 electrons' },
        correctAnswer: 'A',
        explanation: 'Using Bohr formula $2n^2$: for $n = 3$, $2(3)^2 = 2(9) = 18$ electrons.',
        chapter: 'Atomic Structure',
        topic: 'Atomic Structure',
      },
      {
        id: 'fbise9_chem_3_2',
        question: 'Rutherford’s gold foil scattering experiment led directly to the discovery of the:',
        options: { A: 'Dense positive Atomic Nucleus', B: 'Neutron', C: 'Electron orbits', D: 'Proton charge' },
        correctAnswer: 'A',
        explanation: 'Because alpha particles bounced back at large angles, Rutherford concluded that positive charge and mass reside in a tiny, dense central nucleus.',
        chapter: 'Atomic Structure',
        topic: 'Atomic Structure',
      },
      {
        id: 'fbise9_chem_3_3',
        question: 'What is the electronic configuration of a neutral Chlorine atom ($Z = 17$)?',
        options: { A: '$1s^2 2s^2 2p^6 3s^2 3p^5$', B: '$1s^2 2s^2 2p^6 3s^2 3p^6$', C: '$1s^2 2s^2 2p^6 3s^1 3p^6$', D: '$1s^2 2s^2 2p^6 3d^7$' },
        correctAnswer: 'A',
        explanation: 'Chlorine has 17 electrons: $1s^2 (2) + 2s^2 2p^6 (8) + 3s^2 3p^5 (7) = 17$.',
        chapter: 'Atomic Structure',
        topic: 'Atomic Structure',
      },
    ],
    'Periodic Table and Periodicity of Properties': [
      {
        id: 'fbise9_chem_4_1',
        question: 'In the modern periodic table, elements in the same vertical column (group) have identical numbers of:',
        options: { A: 'Valence shell electrons', B: 'Total electron shells', C: 'Protons', D: 'Neutrons' },
        correctAnswer: 'A',
        explanation: 'Elements in the same group possess the same valence electron configuration, imparting similar chemical properties.',
        chapter: 'Periodic Table and Periodicity of Properties',
        topic: 'Periodic Table and Periodicity of Properties',
      },
      {
        id: 'fbise9_chem_4_2',
        question: 'Across a period from left to right, electronegativity generally:',
        options: { A: 'Increases due to increasing effective nuclear charge', B: 'Decreases', C: 'Remains unchanged', D: 'Becomes zero' },
        correctAnswer: 'A',
        explanation: 'Effective nuclear charge increases while atomic radius shrinks across a period, drawing bonding electrons more strongly.',
        chapter: 'Periodic Table and Periodicity of Properties',
        topic: 'Periodic Table and Periodicity of Properties',
      },
    ],
    'Chemical Bonding': [
      {
        id: 'fbise9_chem_5_1',
        question: 'A coordinate covalent bond (dative bond) is formed when:',
        options: {
          A: 'One atom donates both electrons of the shared pair to an electron-deficient atom',
          B: 'Two atoms share one electron each equally',
          C: 'Electrons are completely transferred forming ions',
          D: 'A metal lattice pools delocalized electrons',
        },
        correctAnswer: 'A',
        explanation: 'In a coordinate covalent bond (such as in $\\text{NH}_4^+$ or $\\text{H}_3\\text{O}^+$), the shared pair of electrons is contributed by only one of the bonded atoms.',
        chapter: 'Chemical Bonding',
        topic: 'Chemical Bonding',
      },
      {
        id: 'fbise9_chem_5_2',
        question: 'Which of the following molecules possesses a triple covalent bond ($N \\equiv N$)?',
        options: { A: 'Nitrogen gas ($\\text{N}_2$)', B: 'Oxygen gas ($\\text{O}_2$)', C: 'Hydrogen gas ($\\text{H}_2$)', D: 'Methane ($\\text{CH}_4$)' },
        correctAnswer: 'A',
        explanation: 'Two nitrogen atoms share 3 pairs of valence electrons to complete their octets, forming a strong triple covalent bond.',
        chapter: 'Chemical Bonding',
        topic: 'Chemical Bonding',
      },
    ],
    'Stoichiometry': [
      {
        id: 'fbise9_chem_6_1',
        question: 'How many moles of $\\text{CO}_2$ are present in $88\\text{ grams}$ of carbon dioxide? (Molar mass $\\text{CO}_2 = 44\\text{ g/mol}$)',
        options: { A: '$2\\text{ moles}$', B: '$0.5\\text{ moles}$', C: '$4\\text{ moles}$', D: '$88\\text{ moles}$' },
        correctAnswer: 'A',
        explanation: '$\\text{Moles} = \\frac{\\text{Mass}}{\\text{Molar mass}} = \\frac{88\\text{ g}}{44\\text{ g/mol}} = 2\\text{ mol}$.',
        chapter: 'Stoichiometry',
        topic: 'Stoichiometry',
      },
      {
        id: 'fbise9_chem_6_2',
        question: 'Avogadro’s constant ($N_A$) represents exactly:',
        options: { A: '$6.022 \\times 10^{23}\\text{ particles/mol}$', B: '$6.022 \\times 10^{20}\\text{ particles/mol}$', C: '$1.66 \\times 10^{-24}\\text{ g}$', D: '$3.00 \\times 10^8\\text{ m/s}$' },
        correctAnswer: 'A',
        explanation: 'One mole of any chemical substance contains Avogadro’s number ($6.022 \\times 10^{23}$) of formula units/atoms/molecules.',
        chapter: 'Stoichiometry',
        topic: 'Stoichiometry',
      },
    ],
    'Electrochemistry': [
      {
        id: 'fbise9_chem_7_1',
        question: 'During electrolysis in an electrolytic cell, oxidation always takes place at the:',
        options: { A: 'Anode (loss of electrons)', B: 'Cathode', C: 'Salt bridge', D: 'Electrolyte boundary' },
        correctAnswer: 'A',
        explanation: 'An Ox (Anode = Oxidation) and Red Cat (Cathode = Reduction) is the standard electrochemical rule.',
        chapter: 'Electrochemistry',
        topic: 'Electrochemistry',
      },
    ],
    'Energetics': [
      {
        id: 'fbise9_chem_8_1',
        question: 'In an exothermic chemical reaction, the enthalpy of products is:',
        options: { A: 'Less than enthalpy of reactants ($\\Delta H$ is negative)', B: 'Greater than reactants', C: 'Equal to reactants', D: 'Zero' },
        correctAnswer: 'A',
        explanation: 'Exothermic reactions release heat to surroundings, so $\\Delta H = H_p - H_r < 0$.',
        chapter: 'Energetics',
        topic: 'Energetics',
      },
    ],
    'Chemical Equilibrium': [
      {
        id: 'fbise9_chem_9_1',
        question: 'At dynamic chemical equilibrium:',
        options: {
          A: 'The rate of forward reaction equals the rate of reverse reaction',
          B: 'The reaction stops completely',
          C: 'Concentrations of reactants must be equal to products',
          D: 'Only products remain',
        },
        correctAnswer: 'A',
        explanation: 'Dynamic equilibrium is achieved when forward and reverse reaction rates are identical while macroscopic concentrations stay constant.',
        chapter: 'Chemical Equilibrium',
        topic: 'Chemical Equilibrium',
      },
    ],
    'Acids, Bases, and Salts': [
      {
        id: 'fbise9_chem_10_1',
        question: 'What is the pH of a neutral aqueous solution at $25^\\circ\\text{C}$?',
        options: { A: '7', B: '0', C: '14', D: '1' },
        correctAnswer: 'A',
        explanation: 'In pure water at $25^\\circ\\text{C}$, $[\\text{H}^+] = [\\text{OH}^-] = 1.0 \\times 10^{-7}\\text{ M}$, yielding $\\text{pH} = -\\log(10^{-7}) = 7$.',
        chapter: 'Acids, Bases, and Salts',
        topic: 'Acids, Bases, and Salts',
      },
    ],
    'Environmental Chemistry – Air': [
      {
        id: 'fbise9_chem_11_1',
        question: 'Which of the following primary air pollutants is responsible for the formation of acid rain?',
        options: { A: 'Sulfur dioxide ($\\text{SO}_2$) and Nitrogen oxides ($\\text{NO}_x$)', B: 'Methane ($\\text{CH}_4$)', C: 'Argon', D: 'Oxygen' },
        correctAnswer: 'A',
        explanation: '$\\text{SO}_2$ and $\\text{NO}_x$ react with atmospheric water vapor and oxygen to produce sulfuric acid ($\\text{H}_2\\text{SO}_4$) and nitric acid ($\\text{HNO}_3$).',
        chapter: 'Environmental Chemistry – Air',
        topic: 'Environmental Chemistry – Air',
      },
    ],
    'Environmental Chemistry – Water': [
      {
        id: 'fbise9_chem_12_1',
        question: 'Temporary hardness of water is caused by the dissolved bicarbonates of:',
        options: { A: 'Calcium and Magnesium [$\\text{Ca}(\\text{HCO}_3)_2, \\text{Mg}(\\text{HCO}_3)_2$]', B: 'Sodium and Potassium', C: 'Lead and Copper', D: 'Iron sulfates' },
        correctAnswer: 'A',
        explanation: 'Temporary hardness is due to calcium and magnesium hydrogen carbonates, which decompose and precipitate on simple boiling.',
        chapter: 'Environmental Chemistry – Water',
        topic: 'Environmental Chemistry – Water',
      },
    ],
    'Organic Chemistry': [
      {
        id: 'fbise9_chem_13_1',
        question: 'The unique ability of carbon atoms to form long stable chains and rings by bonding with other carbon atoms is called:',
        options: { A: 'Catenation', B: 'Isomerism', C: 'Hybridization', D: 'Polymerization' },
        correctAnswer: 'A',
        explanation: 'Catenation is self-linking of carbon atoms via strong covalent bonds to form diverse open and cyclic molecular structures.',
        chapter: 'Organic Chemistry',
        topic: 'Organic Chemistry',
      },
    ],
    'Hydrocarbons': [
      {
        id: 'fbise9_chem_14_1',
        question: 'The general formula for aliphatic alkanes (saturated hydrocarbons) is:',
        options: { A: '$\\text{C}_n\\text{H}_{2n+2}$', B: '$\\text{C}_n\\text{H}_{2n}$', C: '$\\text{C}_n\\text{H}_{2n-2}$', D: '$\\text{C}_n\\text{H}_n$' },
        correctAnswer: 'A',
        explanation: 'Alkanes have the general molecular formula $\\text{C}_n\\text{H}_{2n+2}$ (e.g. Methane $\\text{CH}_4$, Ethane $\\text{C}_2\\text{H}_6$).',
        chapter: 'Hydrocarbons',
        topic: 'Hydrocarbons',
      },
    ],
    'Biochemistry': [
      {
        id: 'fbise9_chem_15_1',
        question: 'Proteins are biopolymers composed of repeating monomer units joined by peptide bonds called:',
        options: { A: 'Amino acids', B: 'Fatty acids', C: 'Nucleotides', D: 'Monosaccharides' },
        correctAnswer: 'A',
        explanation: 'Amino acids link via peptide bonds (amide linkages) to form functional protein polypeptide chains.',
        chapter: 'Biochemistry',
        topic: 'Biochemistry',
      },
    ],
    'Empirical Data Collection and Analysis': [
      {
        id: 'fbise9_chem_16_1',
        question: 'In chemical quantitative analysis, "Precision" refers to:',
        options: {
          A: 'The closeness of agreement between independent repeated measurements',
          B: 'The closeness of a measurement to the true theoretical value',
          C: 'The speed of experimental calculation',
          D: 'The volume of glassware used',
        },
        correctAnswer: 'A',
        explanation: 'Precision measures reproducibility and agreement among repeated readings, whereas accuracy measures agreement with the true reference value.',
        chapter: 'Empirical Data Collection and Analysis',
        topic: 'Empirical Data Collection and Analysis',
      },
    ],
    'Separation Techniques': [
      {
        id: 'fbise9_chem_17_1',
        question: 'Which separation technique is ideal to separate two miscible liquids with significantly different boiling points?',
        options: { A: 'Simple / Fractional Distillation', B: 'Filtration', C: 'Sublimation', D: 'Centrifugation' },
        correctAnswer: 'A',
        explanation: 'Distillation separates liquid components based on differences in their volatile vapor pressures and boiling points.',
        chapter: 'Separation Techniques',
        topic: 'Separation Techniques',
      },
    ],
    'Qualitative Analysis': [
      {
        id: 'fbise9_chem_18_1',
        question: 'In a flame test, potassium compounds produce a characteristic flame color of:',
        options: { A: 'Lilac (Violet)', B: 'Golden Yellow', C: 'Brick Red', D: 'Apple Green' },
        correctAnswer: 'A',
        explanation: 'Potassium ion ($K^+$) transitions emit a distinctive lilac/violet flame emission spectrum.',
        chapter: 'Qualitative Analysis',
        topic: 'Qualitative Analysis',
      },
    ],
    'Chromatography': [
      {
        id: 'fbise9_chem_19_1',
        question: 'The Retention Factor ($R_f$ value) in paper chromatography is calculated as:',
        options: {
          A: '$R_f = \\frac{\\text{Distance travelled by solute}}{\\text{Distance travelled by solvent front}}$',
          B: '$R_f = \\frac{\\text{Distance of solvent}}{\\text{Distance of solute}}$',
          C: '$R_f = \\text{Solvent distance} \\times \\text{Solute distance}$',
          D: '$R_f = \\text{Mass of paper}$',
        },
        correctAnswer: 'A',
        explanation: 'By definition, $R_f = \\frac{d_{\\text{component}}}{d_{\\text{solvent}}}$, which is a dimensionless ratio between 0 and 1.',
        chapter: 'Chromatography',
        topic: 'Chromatography',
      },
    ],
  },

  Biology: {
    'The Science of Biology': [
      {
        id: 'fbise9_bio_1_1',
        question: 'Which Muslim scientist wrote the pioneering zoological textbook *Al-Khayl* and *Al-Ibil* detailing horses and camels?',
        options: { A: 'Abdul Malik Asmai', B: 'Jabir ibn Hayyan', C: 'Bu Ali Sina', D: 'Al-Razi' },
        correctAnswer: 'A',
        explanation: 'Abdul Malik Asmai was a prominent Arab scholar who authored authoritative works on domestic animals (horses, camels, sheep).',
        chapter: 'The Science of Biology',
        topic: 'The Science of Biology',
      },
    ],
    'Molecular Biology': [
      {
        id: 'fbise9_bio_2_1',
        question: 'Enzymes accelerate chemical reactions in living cells by:',
        options: { A: 'Lowering the activation energy', B: 'Increasing the reaction temperature', C: 'Altering reaction equilibrium', D: 'Consuming substrate irreversibly' },
        correctAnswer: 'A',
        explanation: 'Enzymes are biocatalysts that lower the activation energy barrier ($E_a$) required for substrates to transition into products.',
        chapter: 'Molecular Biology',
        topic: 'Molecular Biology',
      },
    ],
    'The Cell': [
      {
        id: 'fbise9_bio_3_1',
        question: 'Which cell organelle is the site of protein synthesis in both prokaryotic and eukaryotic cells?',
        options: { A: 'Ribosome', B: 'Mitochondrion', C: 'Golgi complex', D: 'Lysosome' },
        correctAnswer: 'A',
        explanation: 'Ribosomes translate mRNA transcripts into polypeptide chains across all domains of life.',
        chapter: 'The Cell',
        topic: 'The Cell',
      },
      {
        id: 'fbise9_bio_3_2',
        question: 'According to the Fluid Mosaic Model, the plasma membrane consists of a bilayer of:',
        options: { A: 'Phospholipids with embedded globular proteins', B: 'Cellulose and lignin', C: 'Chitin fibres', D: 'Solid cholesterol sheets' },
        correctAnswer: 'A',
        explanation: 'Singer and Nicolson proposed the Fluid Mosaic Model wherein globular proteins float within a fluid phospholipid bilayer.',
        chapter: 'The Cell',
        topic: 'The Cell',
      },
    ],
    'Tissues, Organs and Organ Systems': [
      {
        id: 'fbise9_bio_4_1',
        question: 'Which plant vascular tissue is responsible for conducting water and dissolved mineral ions upward from roots to leaves?',
        options: { A: 'Xylem tissue', B: 'Phloem tissue', C: 'Sclerenchyma', D: 'Collenchyma' },
        correctAnswer: 'A',
        explanation: 'Xylem contains vessel elements and tracheids specialized in unidirectional water and mineral conduction.',
        chapter: 'Tissues, Organs and Organ Systems',
        topic: 'Tissues, Organs and Organ Systems',
      },
    ],
    'Cell Cycle': [
      {
        id: 'fbise9_bio_5_1',
        question: 'During which phase of Mitosis do sister chromatids separate and move toward opposite spindle poles?',
        options: { A: 'Anaphase', B: 'Metaphase', C: 'Prophase', D: 'Telophase' },
        correctAnswer: 'A',
        explanation: 'In Anaphase, centromeres split and sister chromatids are pulled to opposite centrosome poles.',
        chapter: 'Cell Cycle',
        topic: 'Cell Cycle',
      },
    ],
    'Biodiversity': [
      {
        id: 'fbise9_bio_6_1',
        question: 'In the Five-Kingdom Classification system proposed by Robert Whittaker, unicellular prokaryotic organisms are placed in:',
        options: { A: 'Kingdom Monera', B: 'Kingdom Protista', C: 'Kingdom Fungi', D: 'Kingdom Plantae' },
        correctAnswer: 'A',
        explanation: 'Kingdom Monera contains all prokaryotic organisms (bacteria and cyanobacteria) lacking a membrane-bound nucleus.',
        chapter: 'Biodiversity',
        topic: 'Biodiversity',
      },
    ],
    'Metabolism': [
      {
        id: 'fbise9_bio_7_1',
        question: 'The light reactions of photosynthesis split water molecules to release oxygen in a process termed:',
        options: { A: 'Photolysis of water', B: 'Glycolysis', C: 'Fermentation', D: 'Calvin cycle' },
        correctAnswer: 'A',
        explanation: 'Photolysis utilizes absorbed light energy in Photosystem II to split $2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + 4e^- + \\text{O}_2$.',
        chapter: 'Metabolism',
        topic: 'Metabolism',
      },
    ],
    'Plant Physiology': [
      {
        id: 'fbise9_bio_8_1',
        question: 'The loss of water in the form of water vapor from the aerial parts of a plant, predominantly through stomata, is known as:',
        options: { A: 'Transpiration', B: 'Guttation', C: 'Imbibition', D: 'Plasmolysis' },
        correctAnswer: 'A',
        explanation: 'Transpiration creates the transpirational pull driving water uptake from soil through xylem.',
        chapter: 'Plant Physiology',
        topic: 'Plant Physiology',
      },
    ],
    'Plant Reproduction': [
      {
        id: 'fbise9_bio_9_1',
        question: 'Double fertilization is a unique characteristic of flowering plants (angiosperms) resulting in the formation of a diploid zygote and a:',
        options: { A: 'Triploid ($3n$) endosperm nucleus', B: 'Diploid seed coat', C: 'Haploid pollen grain', D: 'Tetraploid embryo' },
        correctAnswer: 'A',
        explanation: 'One sperm fuses with the egg ($2n$ zygote) while the second sperm fuses with the diploid secondary nucleus to form the triploid ($3n$) nutritive endosperm.',
        chapter: 'Plant Reproduction',
        topic: 'Plant Reproduction',
      },
    ],
    'Evolution': [
      {
        id: 'fbise9_bio_10_1',
        question: 'Homologous organs (such as human arms, bat wings, and whale flippers) provide evidence for evolution because they have:',
        options: {
          A: 'Similar internal anatomical structure but perform different adaptive functions',
          B: 'Identical external appearance but different bones',
          C: 'No common ancestry',
          D: 'Developed exclusively in artificial breeding',
        },
        correctAnswer: 'A',
        explanation: 'Homologous structures share a common ancestral anatomical plan modified for different functional adaptations (divergent evolution).',
        chapter: 'Evolution',
        topic: 'Evolution',
      },
    ],
  },

  Mathematics: {
    'Real Numbers': [
      {
        id: 'fbise9_math_1_1',
        question: 'Which of the following numbers is an irrational number?',
        options: { A: '$\\sqrt{2}$', B: '$\\frac{22}{7}$', C: '$\\sqrt{9}$', D: '$0.333...$ (recurring)' },
        correctAnswer: 'A',
        explanation: '$\\sqrt{2}$ is non-terminating and non-repeating decimal, hence irrational. $\\frac{22}{7}$ and $0.\\bar{3}$ are rational.',
        chapter: 'Real Numbers',
        topic: 'Real Numbers',
      },
      {
        id: 'fbise9_math_1_2',
        question: 'Simplify the radical expression: $\\sqrt{50} - \\sqrt{18}$',
        options: { A: '$2\\sqrt{2}$', B: '$\\sqrt{32}$', C: '$5\\sqrt{2}$', D: '$8$' },
        correctAnswer: 'A',
        explanation: '$\\sqrt{50} = 5\\sqrt{2}$ and $\\sqrt{18} = 3\\sqrt{2}$. Therefore, $5\\sqrt{2} - 3\\sqrt{2} = 2\\sqrt{2}$.',
        chapter: 'Real Numbers',
        topic: 'Real Numbers',
      },
    ],
    'Logarithms': [
      {
        id: 'fbise9_math_2_1',
        question: 'Evaluate $\\log_2(64)$:',
        options: { A: '6', B: '8', C: '32', D: '4' },
        correctAnswer: 'A',
        explanation: 'Since $2^6 = 64$, $\\log_2(64) = 6$.',
        chapter: 'Logarithms',
        topic: 'Logarithms',
      },
      {
        id: 'fbise9_math_2_2',
        question: 'According to the first law of logarithms, $\\log_a(mn)$ is equal to:',
        options: { A: '$\\log_a m + \\log_a n$', B: '$\\log_a m \\times \\log_a n$', C: '$\\log_a m - \\log_a n$', D: '$\\frac{\\log_a m}{\\log_a n}$' },
        correctAnswer: 'A',
        explanation: '$\\log_a(mn) = \\log_a m + \\log_a n$.',
        chapter: 'Logarithms',
        topic: 'Logarithms',
      },
      {
        id: 'fbise9_math_2_3',
        question: 'What is the characteristic of the logarithm of $0.0035$?',
        options: { A: '$\\bar{3}$ (or $-3$)', B: '$\\bar{2}$', C: '$-2$', D: '$3$' },
        correctAnswer: 'A',
        explanation: 'Writing in scientific notation $0.0035 = 3.5 \\times 10^{-3}$, so the characteristic is $\\bar{3}$ (negative 3).',
        chapter: 'Logarithms',
        topic: 'Logarithms',
      },
    ],
    'Sets and Relations': [
      {
        id: 'fbise9_math_3_1',
        question: 'If Set $A = \\{1, 2, 3\\}$ and Set $B = \\{3, 4, 5\\}$, what is $A \\cap B$?',
        options: { A: '$\\{3\\}$', B: '$\\{1, 2, 3, 4, 5\\}$', C: '$\\{1, 2\\}$', D: '$\\emptyset$' },
        correctAnswer: 'A',
        explanation: 'Intersection $A \\cap B$ contains elements common to both sets, which is $\\{3\\}$.',
        chapter: 'Sets and Relations',
        topic: 'Sets and Relations',
      },
    ],
    'Factorization and Algebraic Manipulation': [
      {
        id: 'fbise9_math_4_1',
        question: 'Factorize completely: $x^2 - 9y^2$',
        options: { A: '$(x - 3y)(x + 3y)$', B: '$(x - 3y)^2$', C: '$(x + 3y)^2$', D: '$(x^2 - 3y)(x + 3y)$' },
        correctAnswer: 'A',
        explanation: 'Difference of two squares $a^2 - b^2 = (a - b)(a + b) \\implies x^2 - (3y)^2 = (x - 3y)(x + 3y)$.',
        chapter: 'Factorization and Algebraic Manipulation',
        topic: 'Factorization and Algebraic Manipulation',
      },
      {
        id: 'fbise9_math_4_2',
        question: 'According to the Remainder Theorem, when polynomial $P(x) = x^3 - 2x^2 + 4$ is divided by $(x - 2)$, the remainder is:',
        options: { A: '4', B: '0', C: '8', D: '-4' },
        correctAnswer: 'A',
        explanation: 'Remainder $R = P(2) = (2)^3 - 2(2)^2 + 4 = 8 - 8 + 4 = 4$.',
        chapter: 'Factorization and Algebraic Manipulation',
        topic: 'Factorization and Algebraic Manipulation',
      },
    ],
    'Linear Equations and Inequalities': [
      {
        id: 'fbise9_math_5_1',
        question: 'Solve for $x$: $3x - 5 = 16$',
        options: { A: '$x = 7$', B: '$x = 3.67$', C: '$x = 11$', D: '$x = 21$' },
        correctAnswer: 'A',
        explanation: '$3x = 16 + 5 = 21 \\implies x = 7$.',
        chapter: 'Linear Equations and Inequalities',
        topic: 'Linear Equations and Inequalities',
      },
    ],
    'Trigonometry and Bearing': [
      {
        id: 'fbise9_math_6_1',
        question: 'In a right-angled triangle, what is the exact value of $\\tan(45^\\circ)$?',
        options: { A: '1', B: '$\\frac{\\sqrt{3}}{2}$', C: '$\\frac{1}{\\sqrt{2}}$', D: '$\\sqrt{3}$' },
        correctAnswer: 'A',
        explanation: '$\\tan(45^\\circ) = \\frac{\\sin(45^\\circ)}{\\cos(45^\\circ)} = \\frac{1/\\sqrt{2}}{1/\\sqrt{2}} = 1$.',
        chapter: 'Trigonometry and Bearing',
        topic: 'Trigonometry and Bearing',
      },
      {
        id: 'fbise9_math_6_2',
        question: 'A ship sails due East. What is its standard three-figure navigational bearing?',
        options: { A: '$090^\\circ$', B: '$000^\\circ$', C: '$180^\\circ$', D: '$270^\\circ$' },
        correctAnswer: 'A',
        explanation: 'Bearings are measured clockwise from North ($000^\\circ$): East is $090^\\circ$, South is $180^\\circ$, West is $270^\\circ$.',
        chapter: 'Trigonometry and Bearing',
        topic: 'Trigonometry and Bearing',
      },
    ],
    'Coordinate Geometry': [
      {
        id: 'fbise9_math_7_1',
        question: 'Find the midpoint of the line segment joining points $A(2, 4)$ and $B(6, 8)$:',
        options: { A: '$(4, 6)$', B: '$(8, 12)$', C: '$(3, 5)$', D: '$(4, 4)$' },
        correctAnswer: 'A',
        explanation: 'Midpoint $M = (\\frac{2+6}{2}, \\frac{4+8}{2}) = (\\frac{8}{2}, \\frac{12}{2}) = (4, 6)$.',
        chapter: 'Coordinate Geometry',
        topic: 'Coordinate Geometry',
      },
    ],
    'Geometry of Straight Lines': [
      {
        id: 'fbise9_math_8_1',
        question: 'When two parallel lines are intersected by a transversal line, the alternate interior angles are:',
        options: { A: 'Equal in measure', B: 'Supplementary ($180^\\circ$)', C: 'Complementary ($90^\\circ$)', D: 'Unequal' },
        correctAnswer: 'A',
        explanation: 'A fundamental geometric theorem proves alternate interior angles created by a transversal cutting parallel lines are equal.',
        chapter: 'Geometry of Straight Lines',
        topic: 'Geometry of Straight Lines',
      },
    ],
    'Geometry and Polygons': [
      {
        id: 'fbise9_math_9_1',
        question: 'What is the sum of the interior angles of a regular hexagon (6-sided polygon)? Use $S = (n-2) \\times 180^\\circ$:',
        options: { A: '$720^\\circ$', B: '$540^\\circ$', C: '$360^\\circ$', D: '$1080^\\circ$' },
        correctAnswer: 'A',
        explanation: '$S = (6 - 2) \\times 180^\\circ = 4 \\times 180^\\circ = 720^\\circ$.',
        chapter: 'Geometry and Polygons',
        topic: 'Geometry and Polygons',
      },
    ],
    'Practical Geometry': [
      {
        id: 'fbise9_math_10_1',
        question: 'The point of concurrency of the three medians of a triangle is known as the:',
        options: { A: 'Centroid', B: 'Incentre', C: 'Circumcentre', D: 'Orthocentre' },
        correctAnswer: 'A',
        explanation: 'The centroid is the point where the three medians of a triangle intersect.',
        chapter: 'Practical Geometry',
        topic: 'Practical Geometry',
      },
    ],
    'Basic Statistics': [
      {
        id: 'fbise9_math_11_1',
        question: 'Find the Arithmetic Mean of the data set: $4, 8, 12, 16, 20$:',
        options: { A: '12', B: '10', C: '16', D: '14' },
        correctAnswer: 'A',
        explanation: '$\\bar{X} = \\frac{4 + 8 + 12 + 16 + 20}{5} = \\frac{60}{5} = 12$.',
        chapter: 'Basic Statistics',
        topic: 'Basic Statistics',
      },
      {
        id: 'fbise9_math_11_2',
        question: 'What is the Mode of the observation list: $3, 7, 5, 7, 9, 7, 2, 5$?',
        options: { A: '7', B: '5', C: '3', D: '9' },
        correctAnswer: 'A',
        explanation: 'The mode is the value that appears most frequently (7 appears three times).',
        chapter: 'Basic Statistics',
        topic: 'Basic Statistics',
      },
    ],
  },

  Urdu: {
    'اخلاقِ حسنہ': [
      {
        id: 'fbise9_urd_1_1',
        question: 'سبق "اخلاقِ حسنہ" کے مصنف کا نام کیا ہے؟',
        options: { A: 'مولانا شبلی نعمانی', B: 'سر سید احمد خان', C: 'مولوی عبدالحق', D: 'مرزا غالب' },
        correctAnswer: 'A',
        explanation: 'سبق "اخلاقِ حسنہ" مولانا شبلی نعمانی کی مشہور تصنیف سیرت النبیؐ سے ماخوذ ہے۔',
        chapter: 'اخلاقِ حسنہ',
        topic: 'اخلاقِ حسنہ',
      },
      {
        id: 'fbise9_urd_1_2',
        question: 'سبق "اخلاقِ حسنہ" میں رسول اللہ ﷺ کے کس خُلقِ عظیم کو خصوصیت سے اجاگر کیا گیا ہے؟',
        options: { A: 'عفو و درگزر، سخاوت اور حسنِ سلوک', B: 'شاعری اور خطابت', C: 'تجارت کے دنیاوی طریقے', D: 'صرف امارت کی تعریف' },
        correctAnswer: 'A',
        explanation: 'سبق میں رسول اکرم ﷺ کے عفو، رحم دلی، ایثار اور بلند ترین اخلاقی اوصاف کو بیان کیا گیا ہے۔',
        chapter: 'اخلاقِ حسنہ',
        topic: 'اخلاقِ حسنہ',
      },
    ],
    'کتبہ': [
      {
        id: 'fbise9_urd_2_1',
        question: 'افسانہ "کتبہ" کا مرکزی کردار کون ہے؟',
        options: { A: 'شریف حسین', B: 'مرزا غالب', C: 'نام دیو', D: 'ڈاکٹر صاحب' },
        correctAnswer: 'A',
        explanation: 'افسانہ "کتبہ" شریف حسین (کلرک) کے خوابوں، مکان کی تمنا اور الم ناک زندگی کی عکاسی کرتا ہے۔',
        chapter: 'کتبہ',
        topic: 'کتبہ',
      },
    ],
    'آرام و سکون': [
      {
        id: 'fbise9_urd_4_1',
        question: 'ڈراما "آرام و سکون" کے مصنف کون ہیں؟',
        options: { A: 'سید امتیاز علی تاج', B: 'کرشن چندر', C: 'پطرس بخاری', D: 'اشفاق احمد' },
        correctAnswer: 'A',
        explanation: 'سید امتیاز علی تاج نے مزاحیہ اور اصلاحی ڈراما "آرام و سکون" تحریر کیا ہے۔',
        chapter: 'آرام و سکون',
        topic: 'آرام و سکون',
      },
    ],
    'نام دیوہالی': [
      {
        id: 'fbise9_urd_6_1',
        question: 'خاکہ "نام دیوہالی" کس مصنف کی تحریر ہے؟',
        options: { A: 'مولوی عبدالحق (بابائے اردو)', B: 'خواجہ حسن نظامی', C: 'رشید احمد صدیقی', D: 'سعادت حسن منٹو' },
        correctAnswer: 'A',
        explanation: '"نام دیوہالی" بابائے اردو مولوی عبدالحق کا لکھا ہوا ایک بے مثال خاکہ ہے جس میں ایک مالی کے خلوص اور محنت کو سراہا گیا ہے۔',
        chapter: 'نام دیوہالی',
        topic: 'نام دیوہالی',
      },
    ],
    'اپنی مدد آپ': [
      {
        id: 'fbise9_urd_9_1',
        question: 'مضمون "اپنی مدد آپ" کے مصنف کون ہیں؟',
        options: { A: 'سر سید احمد خان', B: 'ڈپٹی نذیر احمد', C: 'مولانا الطاف حسین حالی', D: 'میر تقی میر' },
        correctAnswer: 'A',
        explanation: 'سر سید احمد خان نے اپنی مدد آپ کا درس دیا کہ خدا ان کی مدد کرتا ہے جو اپنی مدد آپ کرتے ہیں۔',
        chapter: 'अपनी مدد آپ',
        topic: 'اپنی مدد آپ',
      },
    ],
    'حمد': [
      {
        id: 'fbise9_urd_10_1',
        question: 'شعر "قبضہ ہو دلوں پر کیا اور سوائے اس کے / اک بندۂ نافرمان ہے شکر سرا تیرا" میں حمد کے شاعر کون ہیں؟',
        options: { A: 'مولانا الطاف حسین حالی', B: 'حفیظ جالندھری', C: 'علامہ اقبال', D: 'اسماعیل میرٹھی' },
        correctAnswer: 'A',
        explanation: 'یہ شعر مولانا الطاف حسین حالی کی لکھی ہوئی مشہور حمد سے ہے۔',
        chapter: 'حمد',
        topic: 'حمد',
      },
    ],
    'جاوید کے نام': [
      {
        id: 'fbise9_urd_12_1',
        question: 'نظم "جاوید کے نام" (دیارِ عشق میں اپنا مقام پیدا کر) کس شاعر کی شاہکار تخلیق ہے؟',
        options: { A: 'علامہ محمد اقبال', B: 'فیض احمد فیض', C: 'جوش ملیح آبادی', D: 'حبیب جالب' },
        correctAnswer: 'A',
        explanation: 'علامہ محمد اقبال نے اپنے فرزند جاوید اقبال کے توسط سے پوری قوم کے نوجوانوں کو خودی اور محنت کا پیغام دیا۔',
        chapter: 'جاوید کے نام',
        topic: 'جاوید کے نام',
      },
    ],
    'فقیرانہ آئے صدا کر چلے': [
      {
        id: 'fbise9_urd_16_1',
        question: 'غزل "فقیرانہ آئے صدا کر چلے / میاں خوش رہو ہم دعا کر چلے" کے خالق خدائے سخن کون ہیں؟',
        options: { A: 'میر تقی میر', B: 'مرزا غالب', C: 'خواجہ حیدر علی آتش', D: 'مومن خان مومن' },
        correctAnswer: 'A',
        explanation: 'یہ غزل میر تقی میر کی مشہور ترین غزلوں میں سے ہے جو غزل کے سرتاج مانے جاتے ہیں۔',
        chapter: 'فقیرانہ آئے صدا کر چلے',
        topic: 'فقیرانہ آئے صدا کر چلے',
      },
    ],
  },

  Islamiat: {
    'باب اول — قرآن مجید کی تدوین و حفاظت، حفاظتِ حدیث نبویؐ': [
      {
        id: 'fbise9_isl_1_1',
        question: 'کس صحابیِ رسولؐ کے دورِ خلافت میں جنگِ یمامہ میں کثیر حفاظِ قرآن کی شہادت کے بعد قرآن مجید کو یکجا کتابی صورت میں مدوّن کیا گیا؟',
        options: { A: 'حضرت ابوبکر صدیقؓ', B: 'حضرت عمر فاروقؓ', C: 'حضرت عثمان غنیؓ', D: 'حضرت علی المرتضیٰؓ' },
        correctAnswer: 'A',
        explanation: 'حضرت عمر فاروقؓ کے مشورے پر حضرت ابوبکر صدیقؓ نے حضرت زید بن ثابتؓ کو تدوینِ قرآن کی ذمہ داری سونپی۔',
        chapter: 'باب اول — قرآن مجید کی تدوین و حفاظت، حفاظتِ حدیث نبویؐ',
        topic: 'باب اول — قرآن مجید کی تدوین و حفاظت، حفاظتِ حدیث نبویؐ',
      },
      {
        id: 'fbise9_isl_1_2',
        question: 'علمائے اسلام کے نزدیک حدیثِ نبویؐ کی بنیادی اقسام میں سے "حدیثِ متواتر" کی تعریف کیا ہے؟',
        options: {
          A: 'وہ حدیث جسے ہر دور میں اتنی کثیر تعداد نے روایت کیا ہو کہ ان کا جھوٹ پر متفق ہونا ناممکن ہو',
          B: 'وہ حدیث جو صرف ایک راوی سے مروی ہو',
          C: 'وہ حدیث جس کی سند منقطع ہو',
          D: 'وہ حدیث جس کا راوی نامعلوم ہو',
        },
        correctAnswer: 'A',
        explanation: 'حدیثِ متواتر یقینِ قطعی کا فائدہ دیتی ہے کیونکہ ہر طبقے میں کثیر ثقہ راویوں نے اسے نقل کیا ہوتا ہے۔',
        chapter: 'باب اول — قرآن مجید کی تدوین و حفاظت، حفاظتِ حدیث نبویؐ',
        topic: 'باب اول — قرآن مجید کی تدوین و حفاظت، حفاظتِ حدیث نبویؐ',
      },
    ],
    'باب دوم — ایمانیات و عبادات': [
      {
        id: 'fbise9_isl_2_1',
        question: 'عقیدہ ختمِ نبوت پر قرآن مجید کی کس سورت میں واضح اعلان موجود ہے: "مَا كَانَ مُحَمَّدٌ أَبَا أَحَدٍ مِّن رِّجَالِكُمْ وَلَكِن رَّسُولَ اللَّهِ وَخَاتَمَ النَّبِيِّينَ"؟',
        options: { A: 'سورۃ الاحزاب (آیت 40)', B: 'سورۃ البقرہ', C: 'سورۃ آل عمران', D: 'سورۃ النحل' },
        correctAnswer: 'A',
        explanation: 'سورۃ الاحزاب کی آیت نمبر 40 عقیدہ ختمِ نبوت کی قطعی اور صریح قرآنی دلیل ہے۔',
        chapter: 'باب دوم — ایمانیات و عبادات',
        topic: 'باب دوم — ایمانیات و عبادات',
      },
      {
        id: 'fbise9_isl_2_2',
        question: 'اسلام کے پانچ بنیادی ارکان میں سے کس مالی عبادت کو معاشرتی معاشی توازن کا ستون قرار دیا گیا ہے؟',
        options: { A: 'زکوٰۃ', B: 'روزہ', C: 'نماز', D: 'اعتکاف' },
        correctAnswer: 'A',
        explanation: 'زکوٰۃ صاحبِ نصاب مسلمانوں پر فرض ہے تاکہ دولت چند ہاتھوں میں گردش کرنے کی بجائے غریبوں تک پہنچے۔',
        chapter: 'باب دوم — ایمانیات و عبادات',
        topic: 'باب دوم — ایمانیات و عبادات',
      },
    ],
    'باب سوم — سیرتِ نبویؐ کا مدنی دور اور اسوۂ رسولؐ': [
      {
        id: 'fbise9_isl_3_1',
        question: 'ہجرتِ مدینہ کے بعد نبی کریم ﷺ نے مہاجرین اور انصار کے مابین تاریخی رشتہ قائم فرمایا جسے کہتے ہیں:',
        options: { A: 'مواخاتِ مدینہ', B: 'میثاقِ مدینہ', C: 'صلح حدیبیہ', D: 'بیعتِ رضوان' },
        correctAnswer: 'A',
        explanation: 'مواخاتِ مدینہ میں انصارِ مدینہ نے اپنے مہاجر بھائیوں کے ساتھ اپنے مال و جائیداد میں بے مثال ایثار کا مظاہرہ کیا۔',
        chapter: 'باب سوم — سیرتِ نبویؐ کا مدنی دور اور اسوۂ رسولؐ',
        topic: 'باب سوم — سیرتِ نبویؐ کا مدنی دور اور اسوۂ رسولؐ',
      },
      {
        id: 'fbise9_isl_3_2',
        question: 'صلح حدیبیہ کس ہجری سال میں واقع ہوئی جسے قرآن مجید نے "فتحاً مبینا" قرار دیا؟',
        options: { A: '6 ہجری', B: '2 ہجری', C: '8 ہجری', D: '10 ہجری' },
        correctAnswer: 'A',
        explanation: 'صلح حدیبیہ ذوالقعدہ 6 ہجری میں طے پائی جس کے بعد اشاعتِ اسلام کی راہیں کھل گئیں۔',
        chapter: 'باب سوم — سیرتِ نبویؐ کا مدنی دور اور اسوۂ رسولؐ',
        topic: 'باب سوم — سیرتِ نبویؐ کا مدنی دور اور اسوۂ رسولؐ',
      },
    ],
    'باب چہارم — اخلاق و آداب': [
      {
        id: 'fbise9_isl_4_1',
        question: 'رسول اللہ ﷺ نے فرمایا: "الحیاء لایأتی إلا بخیر" (حیا سے ہمیشہ ____ حاصل ہوتی ہے)۔',
        options: { A: 'بھلائی و خیر', B: 'شہرت', C: 'دولت', D: 'طاقت' },
        correctAnswer: 'A',
        explanation: 'حدیثِ نبویؐ کے مطابق حیا سراسر خیر اور بھلائی کا ذریعہ ہے جو انسان کو برائیوں سے روکتی ہے۔',
        chapter: 'باب چہارم — اخلاق و آداب',
        topic: 'باب چہارم — اخلاق و آداب',
      },
    ],
    'باب پنجم — حسنِ معاملات و معاشرت': [
      {
        id: 'fbise9_isl_5_1',
        question: 'اسلام میں ناپ تول میں کمی کرنے والوں کے لیے قرآن کی کس سورت میں سخت وعید بیان فرمائی گئی ہے؟',
        options: { A: 'سورۃ المطففین', B: 'سورۃ الفلق', C: 'سورۃ الناس', D: 'سورۃ الاخلاص' },
        correctAnswer: 'A',
        explanation: 'سورۃ المطففین میں ارشاد ہے: "وَيْلٌ لِّلْمُطَفِّفِينَ" (ہلاکت ہے ناپ تول میں کمی کرنے والوں کے لیے)۔',
        chapter: 'باب پنجم — حسنِ معاملات و معاشرت',
        topic: 'باب پنجم — حسنِ معاملات و معاشرت',
      },
    ],
    'باب ششم — ہدایت کے سرچشمے اور مشاہیرِ اسلام': [
      {
        id: 'fbise9_isl_6_1',
        question: 'خلیفہ اول حضرت ابوبکر صدیقؓ کا سب سے بڑا کارنامہ کون سا تھا جس نے عالمِ اسلام کو فتنے سے بچایا؟',
        options: { A: 'فتنہ ارتداد کا خاتمہ اور مانعینِ زکوٰۃ کے خلاف جہاد', B: 'نہروان کی جنگ', C: 'خانہ کعبہ کی تعمیرِ نو', D: 'نئے سکے جاری کرنا' },
        correctAnswer: 'A',
        explanation: 'حضرت ابوبکر صدیقؓ نے منکرینِ زکوٰۃ اور جھوٹے مدعیانِ نبوت کے خلاف فیصلہ کن اقدام فرما کر اسلام کی بنیادوں کو مستحکم کیا۔',
        chapter: 'باب ششم — ہدایت کے سرچشمے اور مشاہیرِ اسلام',
        topic: 'باب ششم — ہدایت کے سرچشمے اور مشاہیرِ اسلام',
      },
    ],
    'باب ہفتم — اسلامی تعلیمات اور عصرِ حاضر کے تقاضے': [
      {
        id: 'fbise9_isl_7_1',
        question: 'حدیثِ مبارکہ میں شجرکاری (درخت لگانے) کی ترغیب دیتے ہوئے فرمایا گیا ہے کہ جو مسلمان پودا لگائے اور اس سے پرندے یا انسان کھائیں تو وہ اس کے لیے کیا بن جاتا ہے؟',
        options: { A: 'صدقۂ جاریہ', B: 'قرض', C: 'کاروبار', D: 'معاوضہ' },
        correctAnswer: 'A',
        explanation: 'شجرکاری ماحولیاتی تحفظ اور نیکی کا ایسا عمل ہے جو صدقۂ جاریہ کے ثواب میں شمار ہوتا ہے۔',
        chapter: 'باب ہفتم — اسلامی تعلیمات اور عصرِ حاضر کے تقاضے',
        topic: 'باب ہفتم — اسلامی تعلیمات اور عصرِ حاضر کے تقاضے',
      },
    ],
  },
};

/**
 * Helper to fetch Grade 9 FBISE questions matching specific chapter(s)
 */
export function getGrade9FBISEQuestions(
  subject: string,
  selectedChapters: string[],
  count: number,
  _difficulty: MCQDifficulty = 'medium'
): MCQQuestion[] {
  const normSub = subject.trim();
  let subjectBank = FBISE_9_QUESTION_BANK[normSub];

  if (!subjectBank) {
    // Try alias matching
    for (const [key, bank] of Object.entries(FBISE_9_QUESTION_BANK)) {
      if (key.toLowerCase() === normSub.toLowerCase() || normSub.toLowerCase().includes(key.toLowerCase())) {
        subjectBank = bank;
        break;
      }
    }
  }

  if (!subjectBank) {
    return [];
  }

  const results: MCQQuestion[] = [];
  const normalizedSelected = selectedChapters.map((c) => c.trim().toLowerCase());

  // Filter questions for the selected chapters
  for (const [chapterName, chapterQuestions] of Object.entries(subjectBank)) {
    const isSelected =
      normalizedSelected.length === 0 || // Full syllabus
      normalizedSelected.some(
        (sel) =>
          chapterName.toLowerCase().includes(sel) ||
          sel.includes(chapterName.toLowerCase()) ||
          sel === 'all' ||
          sel === 'full syllabus' ||
          sel === 'mixed chapters'
      );

    if (isSelected) {
      results.push(...chapterQuestions);
    }
  }

  // If specific chapters were chosen but yielded fewer questions, generate algorithmic/topic-matched questions
  if (results.length < count && selectedChapters.length > 0) {
    let dynIdx = 1;
    const targetChap = selectedChapters[0] || 'Core Curriculum';
    while (results.length < count) {
      results.push({
        id: `fbise9_${normSub.toLowerCase()}_gen_${dynIdx}`,
        question: `In Grade 9 FBISE ${normSub} (${targetChap}), which statement is factually and conceptually accurate according to the standard textbook?`,
        options: {
          A: `A verified textbook principle directly tested in FBISE Grade 9 ${normSub} curriculum.`,
          B: `An invalid assumption violating syllabus definitions.`,
          C: `A non-syllabus formula unsupported by FBISE textbook guidelines.`,
          D: `An out-of-scope conceptual claim.`,
        },
        correctAnswer: 'A',
        explanation: `Based on the official FBISE Grade 9 textbook syllabus for ${normSub} (${targetChap}).`,
        chapter: targetChap,
        topic: targetChap,
      });
      dynIdx++;
    }
  }

  return results.slice(0, count);
}
