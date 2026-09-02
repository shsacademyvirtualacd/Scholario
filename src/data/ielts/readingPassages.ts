/**
 * IELTS 3 Comprehensive Reading Passages & Tied Comprehension Questions Bank
 * Realistic IELTS Academic and General Training reading passages with paragraph labels,
 * paired with auto-graded passage-specific multiple choice questions and detailed paragraph citations.
 */

export interface ReadingQuestion {
  id: string;
  questionNumber: number;
  type: 'multiple-choice' | 'true-false-notgiven' | 'heading-match' | 'detail-inference';
  question: string;
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  paragraphRef: string; // e.g., 'Paragraph B'
  explanation: string;
}

export interface ReadingPassage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  moduleType: 'Academic' | 'General Training';
  wordCount: number;
  estimatedReadingMinutes: number;
  summary: string;
  paragraphs: {
    label: string; // 'A', 'B', 'C', 'D', 'E', 'F'
    heading?: string;
    text: string;
  }[];
  questions: ReadingQuestion[];
}

export const IELTS_READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'ielts-reading-01',
    number: 1,
    title: 'The Architecture of Biomimicry: Nature-Inspired Structural Engineering',
    subtitle: 'How evolutionary biological adaptations are transforming sustainable building design and thermodynamic efficiency.',
    moduleType: 'Academic',
    wordCount: 680,
    estimatedReadingMinutes: 8,
    summary: 'An exploration of biomimicry in modern civil architecture, focusing on passive ventilation inspired by termite mounds and self-cleaning surfaces derived from the lotus leaf.',
    paragraphs: [
      {
        label: 'A',
        heading: 'Origins of Bio-Inspired Design',
        text: 'Biomimicry—the practice of emulating models, systems, and elements of nature for the purpose of solving complex human engineering challenges—has transitioned from a niche architectural curiosity into a cornerstone of sustainable structural engineering. For billions of years, biological organisms have undergone relentless evolutionary refinement, yielding organisms that achieve maximal structural resilience and thermodynamic efficiency with minimal material expenditure. Modern architects are increasingly turning away from carbon-intensive mechanical climate control systems in favor of morphological lessons extracted from natural organisms.',
      },
      {
        label: 'B',
        heading: 'The Termite Mound Paradigm in Zimbabwe',
        text: 'Perhaps the most celebrated architectural application of biomimicry is the Eastgate Centre, a mid-rise shopping and commercial office complex situated in Harare, Zimbabwe. Designed by architect Mick Pearce in collaboration with Arup engineers, the edifice possesses no conventional mechanical heating or air-conditioning plant. Instead, the building\'s climate regulation system replicates the passive ventilation chimneys found in indigenous African termite mounds (Macrotermes bellicosus). By utilizing high thermal mass concrete and strategically arranged convective flues, cool nocturnal air is drawn into the building\'s lower chambers and stored in structural slabs, while rising diurnal heat is vented through thirty-five rooftop chimneys.',
      },
      {
        label: 'C',
        heading: 'Energy Savings and Thermal Stability',
        text: 'Empirical monitoring over three decades confirms that the Eastgate Centre consumes approximately thirty-five percent less energy than six conventionally air-conditioned commercial buildings of comparable volume in downtown Harare. During scorching summer days where external ambient temperatures exceed thirty-four degrees Celsius, internal temperatures remain consistently between twenty-one and twenty-five degrees Celsius. In addition to dramatic operational carbon reductions, the passive ventilation paradigm saved the property developers an estimated three point five million United States dollars in upfront refrigeration equipment procurement costs.',
      },
      {
        label: 'D',
        heading: 'Micro-Topographical Surface Mechanics',
        text: 'Beyond passive thermal control, biomimicry has revolutionized facade materials through the discovery of the "Lotus Effect." In the late 1970s, botanist Wilhelm Barthlott investigated why the leaves of the sacred lotus (Nelumbo nucifera) remain pristine despite emerging from turbid, muddy waters. Electron microscopy demonstrated that the leaf\'s surface is not smooth, but coated in micro-scale papillae overlaid with hydrophobic epicuticular wax crystals. Raindrops falling on the surface cannot spread; instead, they remain spherical droplets that roll off effortlessly, picking up dust particulates and fungal spores in a continuous self-cleaning cycle.',
      },
      {
        label: 'E',
        heading: 'Commercial Facade Applications',
        text: 'Material scientists successfully synthesized this micro-topographical phenomenon into exterior silicone-based facade coatings, most notably StoLotusan. When applied to high-rise skyscrapers, these hydrophobic coatings drastically diminish the need for frequent chemical washing and abrasive maintenance scaffolding. Furthermore, the absence of standing water films eliminates the moisture necessary for atmospheric airborne pollutants, moss, and algae to adhere to concrete facades, extending the exterior lifespan of architectural structures by decades.',
      },
      {
        label: 'F',
        heading: 'Future Frontiers in Resilient Urbanism',
        text: 'As metropolitan centers confront accelerating climate volatility, architects are expanding biomimetic inquiries into dynamic responsive skins. Prototypes inspired by pinecones—which open and close their scales in direct response to atmospheric relative humidity without requiring electrical actuators—are currently being tested for solar shading louvers. By substituting mechanical automation with intrinsic material intelligence, the next generation of urban architecture promises to function as living, self-regulating ecosystems that harmonize with surrounding biological habitats.',
      },
    ],
    questions: [
      {
        id: 'r1-q1',
        questionNumber: 1,
        type: 'multiple-choice',
        question: 'According to Paragraph B, what inspired the cooling architecture of the Eastgate Centre in Harare?',
        options: [
          'The cellular porous structure of marine sponges in coral reefs.',
          'The convective passive chimney network found in African termite mounds.',
          'Subterranean river channels that flow beneath Zimbabwe.',
          'The reflective pigmentation of desert beetle shells.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph B',
        explanation: 'Paragraph B states that the building\'s climate regulation system replicates the passive ventilation chimneys found in indigenous African termite mounds (Macrotermes bellicosus).',
      },
      {
        id: 'r1-q2',
        questionNumber: 2,
        type: 'multiple-choice',
        question: 'What financial benefit did the builders of the Eastgate Centre achieve during initial construction?',
        options: [
          'They received an international environmental research grant.',
          'They saved $3.5 million by avoiding the purchase of conventional mechanical refrigeration plants.',
          'Local construction labor costs were subsidized by thirty-five percent.',
          'They sold generated solar electricity back to the municipal power grid.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph C',
        explanation: 'Paragraph C explains that the passive ventilation paradigm saved property developers an estimated 3.5 million US dollars in upfront refrigeration equipment procurement costs.',
      },
      {
        id: 'r1-q3',
        questionNumber: 3,
        type: 'multiple-choice',
        question: 'What physical feature produces the self-cleaning property of the lotus leaf described in Paragraph D?',
        options: [
          'A perfectly flat, mirror-like membrane that repels ultraviolet radiation.',
          'Micro-scale papillae combined with hydrophobic epicuticular wax crystals.',
          'A chemical enzyme secreted by the leaf that dissolves organic dust.',
          'Rapid thermal vibrations produced by photosynthetic chloroplasts.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph D',
        explanation: 'Paragraph D clarifies that electron microscopy revealed the leaf\'s surface is coated in micro-scale papillae overlaid with hydrophobic epicuticular wax crystals.',
      },
      {
        id: 'r1-q4',
        questionNumber: 4,
        type: 'multiple-choice',
        question: 'How do pinecone-inspired architectural prototypes operate without electricity (Paragraph F)?',
        options: [
          'They utilize internal battery reservoirs charged by piezoelectric foot traffic.',
          'Their physical scales open and close naturally in response to ambient humidity levels.',
          'They rely on miniature wind turbines embedded in exterior window frames.',
          'They use magnetic repulsion generated by urban electromagnetic fields.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph F',
        explanation: 'Paragraph F highlights prototypes inspired by pinecones, which open and close their scales in direct response to atmospheric relative humidity without requiring electrical actuators.',
      },
      {
        id: 'r1-q5',
        questionNumber: 5,
        type: 'multiple-choice',
        question: 'Which of the following is the most suitable alternative title for the entire passage?',
        options: [
          'The History of Mechanical Refrigeration in Developing Nations',
          'Biomimicry: Engineering Lessons from Biological Evolution for Modern Architecture',
          'Why Lotus Flowers Are Extensively Cultivated in Africa',
          'The Structural Limitations of High-Rise Urban Concrete Buildings',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph A & F',
        explanation: 'The entire passage synthesizes how biological principles (termites, lotus leaves, pinecones) provide solutions for structural, cooling, and facade engineering in architecture.',
      },
    ],
  },
  {
    id: 'ielts-reading-02',
    number: 2,
    title: 'Cognitive Plasticity, Synaptic Pruning, and the Aging Brain',
    subtitle: 'Challenging historical assumptions of cognitive decline through the lens of modern neuroimaging and cognitive reserve.',
    moduleType: 'Academic',
    wordCount: 720,
    estimatedReadingMinutes: 9,
    summary: 'A neuroscientific investigation into lifelong neuroplasticity, showing how cognitive reserve and bilingualism can mitigate the symptoms of neurodegenerative pathology.',
    paragraphs: [
      {
        label: 'A',
        heading: 'The Static Brain Dogma Disproven',
        text: 'Throughout much of the twentieth century, conventional neuroscience adhered to the rigid doctrine that the adult mammalian brain was fundamentally immutable. It was widely believed that following the critical developmental windows of early childhood and adolescence, neural circuitry became fixed, and any subsequent neuronal loss due to aging or cerebrovascular trauma resulted in permanent, irrecoverable functional deficits. However, the advent of high-resolution functional magnetic resonance imaging (fMRI) and positron emission tomography (PET) in the 1990s overturned this dogma, unveiling the profound, lifelong phenomenon known as neuroplasticity.',
      },
      {
        label: 'B',
        heading: 'Mechanisms of Synaptic Reorganization',
        text: 'Neuroplasticity manifests through two primary cellular mechanisms: functional plasticity, wherein the brain reassigns specific cognitive tasks from damaged or declining neural regions to undamaged homologous cortical networks; and structural plasticity, in which physical gray matter density and dendritic arborization increase in response to sustained cognitive acquisition or motor training. Landmark neuroimaging investigations involving London licensed taxi drivers demonstrated significant volumetric expansion in the posterior hippocampus—the cerebral nucleus responsible for spatial navigation and cognitive spatial mapping—directly proportional to their years of navigational navigation experience.',
      },
      {
        label: 'C',
        heading: 'The Concept of Cognitive Reserve',
        text: 'Crucially, neuroscientists have differentiated between brain reserve (the physical, biological hardware of the brain, including total neuron count and synaptic density) and cognitive reserve (the brain\'s software efficiency, or its capacity to recruit alternate neural pathways to accomplish tasks). Formulated by neuropsychologist Yaakov Stern, the cognitive reserve hypothesis elucidates why individuals with identical degrees of Alzheimer\'s neuropathological lesions—such as amyloid-beta plaques and neurofibrillary tau tangles—frequently exhibit vastly disparate clinical symptoms.',
      },
      {
        label: 'D',
        heading: 'The Protective Role of Lifelong Bilingualism',
        text: 'Epidemiological studies indicate that higher educational attainment, complex occupational engagement, and lifelong bilingualism construct robust cognitive scaffolding. For instance, psycholinguistic studies across diverse demographic cohorts reveal that bilingual individuals exhibit clinical onset of Alzheimer\'s dementia symptoms approximately four to five years later than monolingual peers, despite harboring equivalent anatomical burden of disease. Managing two competing linguistic lexicons demands continuous executive attentional control, strengthening frontal-striatal executive loops.',
      },
      {
        label: 'E',
        heading: 'Physical Aerobic Exercise and BDNF',
        text: 'Parallel research in neuroendocrinology underscores the powerful neuroprotective efficacy of sustained aerobic exercise. Cardiovascular training induces the systemic secretion of brain-derived neurotrophic factor (BDNF), a vital protein that stimulates adult neurogenesis in the subgranular zone of the dentate gyrus. Far from being an inevitable downward trajectory, cognitive vitality in senescence can be actively preserved and fortified through targeted cognitive enrichment, cardiovascular conditioning, and social connectedness.',
      },
    ],
    questions: [
      {
        id: 'r2-q1',
        questionNumber: 1,
        type: 'multiple-choice',
        question: 'What historical scientific belief was overturned by modern neuroimaging in the 1990s (Paragraph A)?',
        options: [
          'That brain scans were dangerous to pediatric patients.',
          'That the adult brain was fixed and incapable of forming new neural pathways.',
          'That childhood learning had no impact on adult intelligence.',
          'That the human hippocampus was responsible for language processing.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph A',
        explanation: 'Paragraph A explains that the rigid dogma that the adult brain was immutable and circuitry fixed was disproven by modern fMRI and PET scans.',
      },
      {
        id: 'r2-q2',
        questionNumber: 2,
        type: 'multiple-choice',
        question: 'What did studies of London taxi drivers demonstrate regarding structural plasticity (Paragraph B)?',
        options: [
          'Their reaction times deteriorated faster than other drivers.',
          'Their posterior hippocampus grew in volume in direct proportion to their navigational experience.',
          'They possessed smaller overall brain volumes due to urban pollution.',
          'Their visual cortex took over auditory functions.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph B',
        explanation: 'Paragraph B states that studies demonstrated significant volumetric expansion in the posterior hippocampus directly proportional to years of navigational experience.',
      },
      {
        id: 'r2-q3',
        questionNumber: 3,
        type: 'multiple-choice',
        question: 'According to Yaakov Stern\'s cognitive reserve hypothesis (Paragraph C), why do some patients with severe Alzheimer\'s pathology show few clinical symptoms?',
        options: [
          'Their immune systems destroy amyloid plaques faster.',
          'Their brains recruit alternative, efficient neural pathways to bypass damaged tissue.',
          'They possess genetic immunity to neurodegenerative diseases.',
          'They sleep longer hours during slow-wave sleep phases.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph C',
        explanation: 'Cognitive reserve describes the brain\'s capacity to recruit alternate neural pathways and software efficiency to accomplish tasks despite physical brain lesions.',
      },
      {
        id: 'r2-q4',
        questionNumber: 4,
        type: 'multiple-choice',
        question: 'What specific advantage do lifelong bilinguals demonstrate regarding dementia onset (Paragraph D)?',
        options: [
          'They completely avoid developing tau tangles in the cortex.',
          'They develop dementia symptoms four to five years later than monolinguals despite having equivalent pathology.',
          'They achieve perfect photographic memory throughout their nineties.',
          'They recover from traumatic brain injuries in half the average clinical duration.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph D',
        explanation: 'Paragraph D mentions that bilingual individuals exhibit clinical onset of Alzheimer\'s dementia symptoms approximately four to five years later than monolinguals despite harboring equivalent disease burden.',
      },
      {
        id: 'r2-q5',
        questionNumber: 5,
        type: 'multiple-choice',
        question: 'How does aerobic cardiovascular exercise stimulate adult neurogenesis in the brain (Paragraph E)?',
        options: [
          'By reducing the total oxygen consumption of neurons.',
          'By triggering the release of brain-derived neurotrophic factor (BDNF) which fosters new neuron growth.',
          'By permanently increasing cranial blood pressure.',
          'By replacing gray matter with fibrous connective tissue.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph E',
        explanation: 'Paragraph E notes that cardiovascular training induces secretion of brain-derived neurotrophic factor (BDNF), stimulating adult neurogenesis in the dentate gyrus.',
      },
    ],
  },
  {
    id: 'ielts-reading-03',
    number: 3,
    title: 'The Evolution and Future Trajectory of Urban Mass Transit Systems',
    subtitle: 'From nineteenth-century steam railways to AI-orchestrated micro-mobility and multi-modal transit networks.',
    moduleType: 'General Training',
    wordCount: 650,
    estimatedReadingMinutes: 7,
    summary: 'A comprehensive study of urban transport development, examining subterranean subways, bus rapid transit (BRT), and the integration of first-and-last-mile shared micro-mobility.',
    paragraphs: [
      {
        label: 'A',
        heading: 'The Dawn of Subterranean Transit',
        text: 'The opening of the London Metropolitan Railway in January 1863 marked the inception of modern subterranean mass transit. Designed to relieve the gridlocked horse-drawn carriages clogging Victorian London\'s thoroughfares, the four-mile line carried nearly forty thousand passengers on its inaugural day despite using smoky, coal-fired steam locomotives in enclosed tunnels. By the early twentieth century, electric traction and deep-level "tube" boring techniques transformed subways into the indispensable circulatory arteries of global megacities like New York, Paris, and Tokyo.',
      },
      {
        label: 'B',
        heading: 'Bus Rapid Transit (BRT) Innovations',
        text: 'While underground heavy rail remains unparalleled in carrying capacity—transporting upwards of sixty thousand passengers per hour per direction on dedicated lines—the astronomical capital expenditure required for subterranean tunneling presents a prohibitive barrier for developing metropolises. In 1974, the Brazilian city of Curitiba pioneered Bus Rapid Transit (BRT). By allocating dedicated center-road busways, pre-board fare collection tubes, and level-platform boarding, Curitiba achieved rail-like transit velocities and throughput at less than ten percent of the capital cost of a subway.',
      },
      {
        label: 'C',
        heading: 'The First-and-Last-Mile Conundrum',
        text: 'Despite the high carrying capacity of trunk subway and BRT lines, municipal planners have long grappled with the "first-and-last-mile" barrier: the geographical gap between a passenger\'s origin or destination and the nearest transit station. If walking distances exceed eight hundred meters (roughly a ten-minute walk), suburban commuters frequently default to private automobile usage. In recent years, app-based micro-mobility fleets—such as docked bike-sharing networks and shared electric scooters—have closed this gap, expanding public transit catchment zones by up to three hundred percent.',
      },
      {
        label: 'D',
        heading: 'Dynamic Transit Orchestration and AI',
        text: 'The contemporary frontier in urban mobility lies in Mobility-as-a-Service (MaaS) platforms integrated with predictive artificial intelligence. Rather than relying solely on rigid, fixed-schedule routes, progressive transport authorities in cities like Singapore and Helsinki deploy real-time passenger demand algorithms to dynamically dispatch autonomous feeder shuttles, adjust traffic signal priority for high-occupancy buses, and offer unified digital ticketing spanning trains, ferries, and micro-mobility.',
      },
      {
        label: 'E',
        heading: 'Environmental and Economic Imperatives',
        text: 'Decarbonizing metropolitan transit is pivotal to meeting global net-zero emissions targets. Transportation currently accounts for approximately twenty-four percent of direct global carbon dioxide emissions from fuel combustion. Transitioning suburban commuters from single-occupancy gasoline vehicles to electrified multi-modal transit networks not only mitigates urban greenhouse gas footprints, but also curtails productivity losses resulting from traffic congestion, which cost world economies hundreds of billions annually.',
      },
    ],
    questions: [
      {
        id: 'r3-q1',
        questionNumber: 1,
        type: 'multiple-choice',
        question: 'What initial challenge did the London Metropolitan Railway face upon opening in 1863 (Paragraph A)?',
        options: [
          'It lacked ticket collectors to monitor passenger boarding.',
          'It operated using smoky, coal-burning steam locomotives inside enclosed tunnels.',
          'Severe earthquakes destroyed the first mile of subterranean tracks.',
          'Passenger ridership was initially limited to only ten people per day.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph A',
        explanation: 'Paragraph A mentions that the line carried nearly 40,000 passengers on its inaugural day despite using smoky, coal-fired steam locomotives in enclosed tunnels.',
      },
      {
        id: 'r3-q2',
        questionNumber: 2,
        type: 'multiple-choice',
        question: 'Why did the city of Curitiba opt for Bus Rapid Transit (BRT) rather than a subway system (Paragraph B)?',
        options: [
          'Buses were manufactured locally using renewable biofuel.',
          'BRT provided rail-like velocities and throughput at less than 10% of the capital cost of a subway.',
          'Curitiba had no paved roads suitable for heavy railway construction.',
          'Subways were legally banned in Brazilian municipal law.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph B',
        explanation: 'Paragraph B explains that BRT achieved rail-like transit velocities and throughput at less than ten percent of the capital cost of a subway.',
      },
      {
        id: 'r3-q3',
        questionNumber: 3,
        type: 'multiple-choice',
        question: 'What is the "first-and-last-mile" problem described in Paragraph C?',
        options: [
          'The mechanical breakdown of trains on the first mile of a journey.',
          'The difficulty commuters face in reaching a transit station when the distance from home or work exceeds walking tolerance.',
          'The high cost of purchasing single-trip tickets on commuter buses.',
          'The restriction of bicycles on underground platforms during rush hours.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph C',
        explanation: 'Paragraph C describes the first-and-last-mile barrier as the geographical gap between a passenger\'s home/destination and the nearest station.',
      },
      {
        id: 'r3-q4',
        questionNumber: 4,
        type: 'multiple-choice',
        question: 'How are cities like Singapore and Helsinki utilizing AI in urban transit (Paragraph D)?',
        options: [
          'To replace all human drivers with supersonic flying vehicles.',
          'To dynamically dispatch autonomous shuttles and optimize real-time multi-modal routes based on passenger demand.',
          'To monitor passenger conversations for advertising purposes.',
          'To enforce mandatory curfew hours across downtown districts.',
        ],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph D',
        explanation: 'Paragraph D notes that predictive AI algorithms dynamically dispatch autonomous feeder shuttles, adjust traffic signal priority, and unify digital ticketing.',
      },
      {
        id: 'r3-q5',
        questionNumber: 5,
        type: 'multiple-choice',
        question: 'According to Paragraph E, transportation accounts for what percentage of direct global CO2 emissions from fuel combustion?',
        options: ['Approximately 5%', 'Approximately 24%', 'Approximately 50%', 'Approximately 85%'],
        correctAnswer: 'B',
        paragraphRef: 'Paragraph E',
        explanation: 'Paragraph E explicitly states that transportation accounts for approximately twenty-four percent of direct global carbon dioxide emissions from fuel combustion.',
      },
    ],
  },
];
