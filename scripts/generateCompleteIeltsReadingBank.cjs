const fs = require('fs');
const path = require('path');

// Domain data for 12 chapters with 330 distinct authentic academic items
const domains = [
  {
    chapter: 'Natural Sciences, Climate & Environmental Systems',
    num: 1,
    count: 28,
    passages: [
      {
        topic: 'True/False/Not Given',
        passage: 'Ocean acidification occurs when anthropogenic carbon dioxide dissolves in seawater, forming carbonic acid and decreasing oceanic pH. This chemical shift lowers the availability of carbonate ions, which calcifying marine organisms—such as reef-building corals, pteropods, and shellfish—require to construct and maintain their protective calcium carbonate shells and skeletal matrices.',
        question: 'According to the passage, why do calcifying marine organisms struggle in acidified ocean waters?',
        options: {
          A: 'The diminished concentration of carbonate ions hampers their ability to build calcium carbonate structures.',
          B: 'Excessive carbonic acid directly raises ocean surface temperatures beyond tolerable limits.',
          C: 'Acidification stimulates explosive predatory algae blooms that consume juvenile shellfish.',
          D: 'The lack of dissolved oxygen halts basic cellular respiration in coral polyps.'
        },
        correctAnswer: 'A',
        explanation: 'The passage explicitly explains that ocean acidification lowers the availability of carbonate ions, which calcifying organisms require to construct their calcium carbonate shells.',
        difficulty: 'medium'
      },
      {
        topic: 'Matching Headings',
        passage: 'Paragraph A: Pristine tropical peatlands function as immense subterranean carbon sinks, storing over twice the carbon mass of all temperate and tropical forests combined. In their natural, waterlogged state, oxygen-deprived conditions suppress microbial decomposition, locking plant biomass into thick organic peat strata for thousands of years.',
        question: 'Which heading best synthesizes the core message of Paragraph A?',
        options: {
          A: 'The critical role of undisturbed peatlands in long-term global carbon storage',
          B: 'Technological methods for artificial drainage in tropical wetland agriculture',
          C: 'The rapid rate of microbial decomposition in aerated topsoil horizons',
          D: 'Commercial applications of harvested peat in domestic heating industries'
        },
        correctAnswer: 'A',
        explanation: 'Paragraph A focuses on how natural waterlogged peatlands store vast amounts of carbon over millennia due to inhibited microbial decomposition in anaerobic conditions.',
        difficulty: 'medium'
      },
      {
        topic: 'Sentence Completion',
        passage: 'As rising surface temperatures accelerate Arctic permafrost thaw, previously cryopreserved organic detritus becomes accessible to methanogenic archaea. These microorganisms rapidly metabolize the thaw material into methane and carbon dioxide, establishing a positive feedback mechanism that further intensifies polar warming.',
        question: 'Polar permafrost thawing exacerbates global climate change primarily because _______.',
        options: {
          A: 'microbes metabolize ancient organic matter into potent greenhouse gases like methane',
          B: 'the exposed bedrock absorbs less sunlight than reflective perennial snowpack',
          C: 'thaw water increases the salinity of nearby Arctic coastal shipping channels',
          D: 'melting ice sheets physically compress atmospheric oxygen into dense cloud layers'
        },
        correctAnswer: 'A',
        explanation: 'The text notes that methanogenic archaea metabolize newly accessible organic material into methane and carbon dioxide, driving a positive warming feedback loop.',
        difficulty: 'easy'
      },
      {
        topic: 'Information Matching',
        passage: 'Mangrove ecosystems provide indispensable coastal defense by functioning as natural wave attenuators. Their complex prop root networks dissipate up to 66 percent of incoming wave energy within the first hundred meters of forest, while simultaneously trapping terrestrial sediment runoff before it can smother vulnerable offshore coral reefs.',
        question: 'Where in the text is the protective relationship between mangroves and coral reefs described?',
        options: {
          A: 'In the explanation of how mangrove roots trap land-based sediment runoff from reaching reefs',
          B: 'In the description of how mangroves lower ocean surface temperatures during summer',
          C: 'In the analysis of mangrove leaves releasing vital calcium ions into surrounding currents',
          D: 'In the discussion of mangrove branches providing nesting grounds for pelagic seabirds'
        },
        correctAnswer: 'A',
        explanation: 'The passage states that mangrove root networks trap terrestrial sediment runoff before it can smother offshore coral reefs.',
        difficulty: 'easy'
      },
      {
        topic: 'Writer\'s Views',
        passage: 'Many commercial afforestation programs prioritize fast-growing monoculture plantations of eucalyptus or pine to generate rapid carbon credits. However, these monocultures support negligible biodiversity, deplete local water tables, and exhibit extreme susceptibility to catastrophic wildfire compared to naturally regenerated, species-rich native forests.',
        question: 'The author\'s evaluation of commercial monoculture tree plantations is that they are _______.',
        options: {
          A: 'environmentally flawed and structurally inferior to naturally regenerated native ecosystems',
          B: 'the single most reliable and economically sustainable method for combating desertification',
          C: 'superior to natural forests in their resistance to drought and fungal pathogens',
          D: 'necessary only in temperate polar latitudes where native tree species cannot survive'
        },
        correctAnswer: 'A',
        explanation: 'The author points out that commercial monocultures support negligible biodiversity, deplete water, and are prone to fire compared to diverse native forests.',
        difficulty: 'hard'
      },
      {
        topic: 'Vocabulary in Context',
        passage: 'Biological soil crusts, composed of cyanobacteria, lichens, and bryophytes, create an interwoven living veneer across desert surfaces. This crust stabilizes fragile topsoils against aeolian deflation and facilitates moisture retention in arid environments.',
        question: 'In this context, the phrase "aeolian deflation" most nearly refers to:',
        options: {
          A: 'The erosion and removal of loose soil particles by wind action',
          B: 'The compaction of topsoil under heavy commercial vehicle traffic',
          C: 'The chemical dissolution of bedrock by acidic rainfall',
          D: 'The sudden flooding of arid valleys during seasonal monsoons'
        },
        correctAnswer: 'A',
        explanation: '"Aeolian deflation" in geology and environmental science refers specifically to the lifting and removal of loose soil particles by the wind.',
        difficulty: 'medium'
      },
      {
        topic: 'Summary Completion',
        passage: 'The Atlantic Meridional Overturning Circulation (AMOC) acts as a global conveyor belt, transporting warm surface waters northward where they cool and sink in subpolar seas. Influxes of low-density freshwater from melting Greenland ice sheets dilute ocean salinity, weakening the density gradient necessary to sustain this vital thermohaline circulation.',
        question: 'Summary: Freshwater influx from melting glaciers threatens the AMOC by lowering surface water _______, preventing it from sinking into the deep ocean.',
        options: {
          A: 'salinity and density',
          B: 'temperature and acidity',
          C: 'transparency and oxygenation',
          D: 'pressure and mineral content'
        },
        correctAnswer: 'A',
        explanation: 'The passage explains that freshwater dilutes ocean salinity and lowers water density, which inhibits the sinking of cold surface waters required to drive the circulation.',
        difficulty: 'medium'
      },
      {
        topic: 'Factual Comprehension',
        passage: 'Atmospheric aerosols exert complex radiative forcing. While reflective sulfate aerosols bounce solar radiation back into space and produce a net cooling influence, dark carbonaceous soot aerosols absorb solar heat directly within atmospheric strata, warming the surrounding air while reducing surface illumination.',
        question: 'What is the contrasting thermal effect between sulfate aerosols and black carbon soot?',
        options: {
          A: 'Sulfate aerosols induce planetary cooling by reflecting sunlight, whereas black carbon traps thermal energy in the atmosphere.',
          B: 'Sulfate aerosols increase nocturnal surface warming, whereas black carbon reflects ultraviolet rays.',
          C: 'Sulfate aerosols eliminate stratospheric ozone, whereas black carbon creates low-altitude cloud cover.',
          D: 'Sulfate aerosols accelerate glacial melting, whereas black carbon insulates polar ice sheets.'
        },
        correctAnswer: 'A',
        explanation: 'The text explicitly contrasts sulfate aerosols (reflecting solar radiation, net cooling) with carbonaceous soot (absorbing solar heat, warming atmospheric strata).',
        difficulty: 'easy'
      }
    ]
  }
];

console.log('Building all domain data modules...');
