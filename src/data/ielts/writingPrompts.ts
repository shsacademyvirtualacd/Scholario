/**
 * IELTS Writing Prompts Bank
 * Academic Task 1, Academic Task 2, GT Task 1 (Letters), GT Task 2, and Paragraph Writing prompts.
 */

export interface WritingPrompt {
  id: string;
  category: 'Academic Task 1' | 'Academic Task 2' | 'GT Task 1' | 'GT Task 2' | 'Paragraph Writing';
  title: string;
  minWords: number;
  recommendedMinutes: number;
  promptText: string;
  visualDataDescription?: string;
  keyInstructions: string[];
  sampleBandGuidance: string;
}

export const IELTS_WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'ielts-write-acad-t1-01',
    category: 'Academic Task 1',
    title: 'Renewable Electricity Generation by Source (2010–2025)',
    minWords: 150,
    recommendedMinutes: 20,
    promptText: 'The line graph illustrates the proportion of electricity generated from three distinct renewable sources—Hydroelectric, Wind, and Solar Photovoltaic—in a European nation between 2010 and 2025, with projections up to 2030.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    visualDataDescription: 'Hydroelectric remained steady at 25-28%; Wind increased steadily from 10% in 2010 to 35% in 2025; Solar surged dramatically from 2% in 2010 to overtake hydro at 38% in 2025.',
    keyInstructions: [
      'Write at least 150 words.',
      'Include a clear overview paragraph highlighting major overall trends.',
      'Do not include personal opinions or external explanations.',
      'Group data logically into two body paragraphs.',
    ],
    sampleBandGuidance: 'High-scoring responses (Band 7+) accurately present the general overview first, compare convergence points between solar and wind, and use precise trend vocabulary (e.g., "exponential growth", "plateaued", "marginal fluctuation").',
  },
  {
    id: 'ielts-write-acad-t1-02',
    category: 'Academic Task 1',
    title: 'Industrial Glass Recycling Process Flow',
    minWords: 150,
    recommendedMinutes: 20,
    promptText: 'The diagram shows the sequential stages involved in the collection, mechanical sorting, crushing, smelting, and remanufacturing of recycled consumer glass into new commercial bottles.\n\nSummarise the information by describing the stages of the manufacturing process in logical sequence.',
    visualDataDescription: 'Five-stage linear cycle: 1. Collection from bottle banks; 2. Optical color sorting (green, clear, brown); 3. Crushing into cullet; 4. High-temperature furnace melting at 1500°C; 5. Mold blowing and quality inspection.',
    keyInstructions: [
      'Write at least 150 words.',
      'Use passive voice appropriately to describe industrial processes.',
      'Employ sequential cohesive linkers (e.g., "Initially", "Following this", "Subsequently", "In the final phase").',
    ],
    sampleBandGuidance: 'Band 8 responses consistently employ accurate passive constructions (e.g., "cullet is melted", "impurities are extracted") and clearly demarcate initial collection from thermal smelting.',
  },
  {
    id: 'ielts-write-acad-t2-01',
    category: 'Academic Task 2',
    title: 'Artificial Intelligence and the Future of Classroom Education',
    minWords: 250,
    recommendedMinutes: 40,
    promptText: 'Some educators believe that generative artificial intelligence will completely replace human classroom teachers in the near future, while others maintain that the empathetic and social role of human educators remains indispensable.\n\nDiscuss both views and give your own opinion. Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
    keyInstructions: [
      'Write at least 250 words.',
      'Discuss both perspectives equitably before articulating your clear personal thesis.',
      'Develop each main body paragraph with an explanatory topic sentence, supporting logic, and a concrete example.',
      'Maintain formal academic register throughout.',
    ],
    sampleBandGuidance: 'Band 7.5+ requires addressing both AI automated personalization and socio-emotional mentorship, demonstrating nuanced paragraph transitions and advanced cohesive devices.',
  },
  {
    id: 'ielts-write-acad-t2-02',
    category: 'Academic Task 2',
    title: 'Urban High-Density Vertical Expansion vs Greenfield Sprawl',
    minWords: 250,
    recommendedMinutes: 40,
    promptText: 'To accommodate rapidly expanding metropolitan populations, some city planners advocate constructing tall residential skyscrapers in urban centers, whereas others argue that cities should expand horizontally into surrounding suburban and rural countryside.\n\nTo what extent do you agree or disagree with the vertical densification of cities? Support your argument with logical evidence.',
    keyInstructions: [
      'Write at least 250 words.',
      'Present a clear position throughout the essay.',
      'Analyze environmental, economic, and infrastructure implications.',
    ],
    sampleBandGuidance: 'Top band essays balance infrastructure efficiency (reduced transit commutes, preservation of agricultural land) against challenges of congestion and construction costs.',
  },
  {
    id: 'ielts-write-gt-t1-01',
    category: 'GT Task 1',
    title: 'Formal Letter of Complaint to Municipal Transport Authority',
    minWords: 150,
    recommendedMinutes: 20,
    promptText: 'You frequently take a local bus route to work, but over the past month the service has become severely delayed and overcrowded, causing you to arrive late to your workplace.\n\nWrite a formal letter to the Director of the Municipal Transport Authority. In your letter:\n- Describe the specific bus route and schedule problems you have experienced\n- Explain the impact this has had on your professional work\n- Suggest at least two practical measures the authority should take to resolve the situation.',
    keyInstructions: [
      'Write at least 150 words.',
      'Use formal letter salutations and sign-offs (e.g., "Dear Sir or Madam", "Yours faithfully").',
      'Address all three bullet points thoroughly and realistically.',
    ],
    sampleBandGuidance: 'Band 8 letters maintain an objective, respectful, yet assertive tone with sophisticated formal vocabulary (e.g., "chronic unreliability", "punctuality", "fleet frequency").',
  },
  {
    id: 'ielts-write-gt-t1-02',
    category: 'GT Task 1',
    title: 'Semi-Formal Letter Requesting Urgent Rental Repairs',
    minWords: 150,
    recommendedMinutes: 20,
    promptText: 'You are renting a flat and the heating system stopped functioning properly during a period of cold weather. You have already called the property manager once, but no technician has visited.\n\nWrite a semi-formal letter to your landlord. In your letter:\n- Remind them of your tenancy and the original notification\n- Detail the current heating failure and health discomfort caused\n- State the urgent action you expect them to take immediately.',
    keyInstructions: [
      'Write at least 150 words.',
      'Maintain polite but urgent semi-formal tone.',
      'Include realistic dates, room details, and clear expectations.',
    ],
    sampleBandGuidance: 'Cohesive, clear sequence of events with appropriate modal language ("I would be grateful if you could arrange...").',
  },
  {
    id: 'ielts-write-gt-t2-01',
    category: 'GT Task 2',
    title: 'The Shift Towards Remote Teleworking and Family Life',
    minWords: 250,
    recommendedMinutes: 40,
    promptText: 'In many countries, an increasing number of employees now work remotely from home rather than traveling to a physical office. Some people consider this a positive development for family cohesion, while others argue it blurs the boundary between professional and personal life.\n\nDo the advantages of remote working outweigh the disadvantages? Discuss and state your conclusion with clear supporting reasons.',
    keyInstructions: [
      'Write at least 250 words.',
      'Clearly weigh advantages against disadvantages.',
      'Provide a definitive concluding stance.',
    ],
    sampleBandGuidance: 'Band 7+ essays examine flexibility and reduced commuting against isolation and overtime encroachment with coherent paragraphing.',
  },
  {
    id: 'ielts-write-para-01',
    category: 'Paragraph Writing',
    title: 'Targeted Academic Paragraph: Causes of Global Biodiversity Loss',
    minWords: 90,
    recommendedMinutes: 12,
    promptText: 'Write a single well-structured academic paragraph (90–130 words) explaining the primary anthropogenic causes of global biodiversity loss. You MUST include:\n1. A clear topic sentence\n2. At least two supporting causes (e.g., habitat fragmentation, chemical pollution)\n3. Two sophisticated cohesive linkers (e.g., "Furthermore", "Consequently", "In particular")\n4. One complex sentence with a subordinate clause.',
    keyInstructions: [
      'Target: 90–130 words.',
      'Focus on strict grammatical precision, cohesive flow, and academic lexis.',
    ],
    sampleBandGuidance: 'Evaluated heavily on Grammatical Range & Accuracy and Coherence within a compact paragraph structure.',
  },
];
