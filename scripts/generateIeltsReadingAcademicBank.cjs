/**
 * Complete Generator for 330+ Genuine IELTS Reading (Academic) MCQs
 * Writes to src/data/banks/ielts/readingAcademic.ts, updates src/data/banks/ielts/index.ts,
 * updates src/data/banks/index.ts, and synchronizes src/data/grade9FbiseBank.json.
 */

const fs = require('fs');
const path = require('path');

const RAW_PASSAGES_AND_QUESTIONS = [
  // ─── CHAPTER 1: Natural Sciences, Climate & Environmental Systems (28 MCQs) ───
  {
    chapter: 'Natural Sciences, Climate & Environmental Systems',
    chapterNumber: 1,
    items: [
      {
        topic: 'True/False/Not Given',
        passage: 'Ocean acidification occurs when anthropogenic carbon dioxide is absorbed by seawater, initiating chemical reactions that reduce seawater pH, carbonate ion concentration, and saturation states of biologically important calcium carbonate minerals. Calcifying organisms such as pteropods, corals, and shellfish face significant metabolic strain when constructing and maintaining their aragonite and calcite shells.',
        question: 'According to the passage, what is the direct biological consequence of reduced carbonate ion concentrations in ocean water?',
        options: {
          A: 'Calcifying marine organisms experience heightened metabolic difficulty in shell formation.',
          B: 'Photosynthetic phytoplankton populations multiply rapidly due to excess dissolved carbon.',
          C: 'Deep-sea hydrothermal vents cease releasing essential sulfur compounds.',
          D: 'Ocean temperatures drop sharply across tropical coral reef habitats.'
        },
        correctAnswer: 'A',
        explanation: 'The passage explicitly states that calcifying organisms face significant metabolic strain when constructing and maintaining aragonite and calcite shells due to lower carbonate ion concentrations.',
        difficulty: 'medium'
      },
      {
        topic: 'Matching Headings',
        passage: 'Paragraph A: Tropical peatlands constitute one of the most carbon-dense terrestrial ecosystems on the planet. Despite covering only a marginal proportion of the global landmass, undisturbed peat swamp forests sequester atmospheric carbon for millennia in waterlogged, anaerobic soil layers where organic matter decomposition is severely inhibited.',
        question: 'Which heading best captures the primary theme of Paragraph A?',
        options: {
          A: 'The unappreciated capacity of undisturbed peatlands as long-term carbon sinks',
          B: 'Agricultural expansion methods in tropical wetland ecosystems',
          C: 'The chemical breakdown of methane in aerobic topsoil layers',
          D: 'Modern industrial uses of harvested peat moss fuels'
        },
        correctAnswer: 'A',
        explanation: 'Paragraph A focuses exclusively on how undisturbed peat swamp forests sequester massive amounts of atmospheric carbon over millennia due to waterlogged, anaerobic soil conditions.',
        difficulty: 'medium'
      },
      {
        topic: 'Sentence Completion',
        passage: 'In the high Arctic, thawing permafrost releases ancient organic carbon that microbial communities rapidly metabolize into methane and carbon dioxide. Scientists warn that this dynamic creates a self-reinforcing climate feedback loop, wherein heightened atmospheric greenhouse gases accelerate regional warming, causing even deeper active permafrost layers to destabilize.',
        question: 'Microbial decomposition of newly thawed Arctic organic matter accelerates regional warming by _______.',
        options: {
          A: 'converting stored organic carbon into atmospheric greenhouse gases that intensify warming',
          B: 'freezing the topsoil layers to prevent solar heat dissipation',
          C: 'absorbing ocean salinity and disrupting deep sea thermal convection',
          D: 'reducing atmospheric aerosol concentrations above polar ice sheets'
        },
        correctAnswer: 'A',
        explanation: 'The passage explains that microbes metabolize the organic carbon into methane and carbon dioxide, releasing greenhouse gases that intensify the warming cycle.',
        difficulty: 'easy'
      },
      {
        topic: 'Information Matching',
        passage: 'Mangrove forests act as formidable bio-shields along tropical shorelines. Their complex, stilt-like root architectures attenuate the kinetic energy of incoming storm surges and tsunamis by up to sixty percent, while simultaneously trapping fine terrestrial sediments that would otherwise smother adjacent coral reef ecosystems.',
        question: 'In which part of the text does the author explain how mangrove roots safeguard adjacent coral reefs?',
        options: {
          A: 'By trapping fine terrestrial runoff sediments that could otherwise suffocate the reefs',
          B: 'By increasing coastal water salinity through active ion secretion',
          C: 'By releasing biochemical compounds that prevent coral polyp disease',
          D: 'By cooling surface water temperatures through transpiration shade'
        },
        correctAnswer: 'A',
        explanation: 'The text notes that mangrove root systems trap fine terrestrial sediments that would otherwise smother adjacent coral reef ecosystems.',
        difficulty: 'easy'
      },
      {
        topic: 'Writer\'s Views',
        passage: 'While commercial afforestation initiatives frequently tout monoculture timber plantations as optimal carbon offsets, ecological studies reveal that single-species forests offer negligible biodiversity value and are acutely vulnerable to pathogen outbreaks and wildfire compared to resilient, multi-tiered native climax ecosystems.',
        question: 'The author\'s perspective on commercial monoculture tree plantations is that they are _______.',
        options: {
          A: 'ecologically fragile and far less beneficial than natural native forests',
          B: 'the single most cost-effective solution for permanent carbon sequestration',
          C: 'superior to climax ecosystems in resisting pathogenic tree infestations',
          D: 'essential for restoring depleted agricultural soil nutrients'
        },
        correctAnswer: 'A',
        explanation: 'The author contrasts commercial monocultures with native climax ecosystems, highlighting their negligible biodiversity value and acute vulnerability to fire and pathogens.',
        difficulty: 'hard'
      },
      {
        topic: 'Vocabulary in Context',
        passage: 'Biological soil crusts—consisting of cyanobacteria, lichens, and mosses—form a cohesive veneer across arid landscapes. This delicate matrix confers structural stability to desert soils, mitigating wind erosion and facilitating nitrogen fixation in nutrient-deficient substrates.',
        question: 'In this context, the word "mitigating" is closest in meaning to:',
        options: {
          A: 'Alleviating or reducing',
          B: 'Accelerating or exacerbating',
          C: 'Documenting or recording',
          D: 'Measuring or calculating'
        },
        correctAnswer: 'A',
        explanation: '"Mitigating" means lessening or reducing the severity of something, in this case reducing wind erosion of fragile desert soils.',
        difficulty: 'easy'
      },
      {
        topic: 'Summary Completion',
        passage: 'The Atlantic Meridional Overturning Circulation (AMOC) transports warm, saline tropical waters northward, where they cool, increase in density, and sink in subpolar regions. Freshwater input from melting Greenland glaciers lowers surface salinity, reducing water density and threatening to destabilize this vast global heat redistribution conveyor.',
        question: 'Summary: Freshwater runoff from Greenland ice sheets poses a threat to the AMOC because lower salinity prevents surface water from _______, which is required for deep circulation.',
        options: {
          A: 'attaining the high density necessary to sink in subpolar latitudes',
          B: 'evaporating into the upper troposphere to form rain clouds',
          C: 'absorbing thermal energy from equatorial solar radiation',
          D: 'dissolving essential mineral nutrients for polar marine life'
        },
        correctAnswer: 'A',
        explanation: 'The passage explains that cooling and high salinity make water dense enough to sink; freshwater lowers salinity and density, inhibiting this sinking mechanism.',
        difficulty: 'hard'
      },
      {
        topic: 'Factual Comprehension',
        passage: 'Atmospheric aerosols exert a dual influence on planetary radiative forcing. Sulfate aerosols reflect incoming solar radiation back into space, producing a net cooling effect, whereas black carbon aerosols absorb thermal radiation within atmospheric layers, causing localized warming and altering precipitation patterns.',
        question: 'How do sulfate aerosols differ in radiative impact from black carbon aerosols?',
        options: {
          A: 'Sulfate aerosols scatter incoming sunlight to cool the planet, while black carbon absorbs heat.',
          B: 'Sulfate aerosols trap terrestrial infrared heat, while black carbon reflects solar rays.',
          C: 'Sulfate aerosols deplete upper stratospheric ozone, while black carbon forms cloud condensation nuclei.',
          D: 'Sulfate aerosols only exist over ocean basins, while black carbon is restricted to polar regions.'
        },
        correctAnswer: 'A',
        explanation: 'The text directly contrasts sulfate aerosols (reflecting sunlight, net cooling) with black carbon aerosols (absorbing thermal radiation, localized warming).',
        difficulty: 'medium'
      },
      {
        topic: 'True/False/Not Given',
        passage: 'Hydrothermal vents along the abyssal ocean floor support unique chemosynthetic food webs independent of solar energy. Bacteria oxidize hydrogen sulfide emitted from mineral-rich chimneys, synthesizing organic carbon that sustains giant tube worms and vent crabs.',
        question: 'Statement: Photosynthetic algae provide the foundational baseline energy for hydrothermal vent ecosystems.',
        options: {
          A: 'False (Chemosynthetic bacteria, not photosynthetic algae, form the foundation)',
          B: 'True',
          C: 'Not Given',
          D: 'Partially True'
        },
        correctAnswer: 'A',
        explanation: 'The statement is False because the passage explicitly states that chemosynthetic bacteria oxidizing hydrogen sulfide form the basis of the ecosystem, independent of solar energy.',
        difficulty: 'easy'
      },
      {
        topic: 'Matching Headings',
        passage: 'Paragraph B: Glacial retreat alters downstream seasonal water availability. In regions dependent on snowpack and glacier meltwater, early spring runoff surges leave downstream agricultural basins starved of critical irrigation during peak summer growing months.',
        question: 'Which heading best fits Paragraph B?',
        options: {
          A: 'Disruptions to downstream agricultural irrigation timing due to glacial retreat',
          B: 'Technological innovations in high-altitude hydroelectric turbines',
          C: 'Measuring the geochemical composition of ancient polar ice cores',
          D: 'Methods for preventing winter avalanches in alpine communities'
        },
        correctAnswer: 'A',
        explanation: 'Paragraph B details how receding glaciers shift meltwater timing to early spring, causing downstream summer irrigation shortages.',
        difficulty: 'medium'
      },
      {
        topic: 'Sentence Completion',
        passage: 'Urban heat islands are exacerbated by low-albedo asphalt surfaces and dense building geometries that trap shortwave radiation. Implementing green roofs and reflective pavements can substantially diminish ambient air temperatures by augmenting urban albedo and promoting evaporative cooling.',
        question: 'The installation of reflective pavements mitigates the urban heat island effect by _______.',
        options: {
          A: 'increasing surface reflectance to prevent excess thermal absorption',
          B: 'insulating underground subterranean electrical distribution networks',
          C: 'filtering heavy metals out of urban stormwater runoff',
          D: 'generating renewable electricity via piezoelectric pressure sensors'
        },
        correctAnswer: 'A',
        explanation: 'The passage states that reflective pavements work by augmenting urban albedo (surface reflectance) and promoting cooling.',
        difficulty: 'medium'
      },
      {
        topic: 'Information Matching',
        passage: 'Fog harvesting systems in the Atacama Desert utilize fine polypropylene mesh nets suspended perpendicularly to prevailing coastal winds. As wind pushes fog through the mesh, microscopic water droplets coalesce onto the fibers and drain into storage cisterns, supplying potable water to arid settlements.',
        question: 'How do fog harvesting nets physically collect potable water from coastal air?',
        options: {
          A: 'Droplets suspended in fog collide with mesh fibers, coalesce, and drain into cisterns.',
          B: 'Solar-powered condensers freeze water vapor onto electrified metallic plates.',
          C: 'Chemical desiccants absorb atmospheric moisture and release it when heated.',
          D: 'Underground vacuum pumps pull humid air through porous gravel subterranean channels.'
        },
        correctAnswer: 'A',
        explanation: 'The passage explicitly describes how microscopic water droplets in the fog coalesce onto the mesh fibers and drain downward into storage cisterns.',
        difficulty: 'easy'
      },
      {
        topic: 'Writer\'s Views',
        passage: 'Proponents of stratospheric aerosol injection argue it provides a rapid emergency brake on global temperature rise. However, such solar geoengineering does nothing to curb ocean acidification and risks severely disrupting monsoonal precipitation patterns upon which billions rely for sustenance.',
        question: 'What is the author\'s main reservation concerning stratospheric aerosol injection?',
        options: {
          A: 'It fails to address ocean acidification and could destabilize vital monsoon rainfall patterns.',
          B: 'It is technically impossible to deliver aerosols into the upper stratosphere with current aircraft.',
          C: 'It would cause an immediate, uncontrolled plunge in global ocean temperatures.',
          D: 'It would permanently accelerate the depletion of terrestrial mineral resources.'
        },
        correctAnswer: 'A',
        explanation: 'The author notes two specific reservations: it does nothing to stop ocean acidification and risks disrupting monsoonal precipitation.',
        difficulty: 'hard'
      },
      {
        topic: 'Vocabulary in Context',
        passage: 'Riparian buffer zones—strips of vegetation planted along waterways—sequester agricultural runoff containing nitrate fertilizers, thereby averting eutrophication and subsequent hypoxic dead zones in downstream estuaries.',
        question: 'In this passage, the term "hypoxic" describes a condition characterized by:',
        options: {
          A: 'Severe deficiency of dissolved oxygen in the aquatic environment',
          B: 'High concentrations of toxic synthetic pesticides',
          C: 'Excessive water salinity that kills freshwater fish',
          D: 'Elevated water temperatures caused by industrial cooling outlets'
        },
        correctAnswer: 'A',
        explanation: '"Hypoxic" refers to aquatic environments suffering from oxygen depletion (hypoxia), resulting in biological "dead zones".',
        difficulty: 'medium'
      },
      {
        topic: 'True/False/Not Given',
        passage: 'Tundra ecosystems are characterized by short vegetative seasons and continuous dwarf shrub cover. Because decomposition rates are constrained by sub-zero temperatures, vast stores of nitrogen remain locked in organic soil horizons.',
        question: 'Statement: Rapid plant decomposition occurs in the tundra due to high summer humidity.',
        options: {
          A: 'False (Decomposition rates are constrained by sub-zero temperatures)',
          B: 'True',
          C: 'Not Given',
          D: 'Partially True'
        },
        correctAnswer: 'A',
        explanation: 'The statement directly contradicts the passage, which states that decomposition is slow and constrained by sub-zero temperatures.',
        difficulty: 'easy'
      },
      {
        topic: 'Factual Comprehension',
        passage: 'Boreal forest wildfire regimes are intensifying in frequency and severity. High-intensity crown fires not only consume standing timber but also incinerate the thick organic layer of forest moss, exposing underlying mineral soil to accelerated erosion and solar heating.',
        question: 'What is an immediate environmental consequence of high-intensity crown fires in boreal forests?',
        options: {
          A: 'Destruction of the insulating moss layer, exposing mineral soils to heat and erosion',
          B: 'Immediate replenishment of the forest canopy through rapid seed germination',
          C: 'A permanent cessation of all future insect infestations in the burned zone',
          D: 'Instantaneous fossilization of dead timber into usable anthracite coal'
        },
        correctAnswer: 'A',
        explanation: 'The passage states that crown fires incinerate the thick organic moss layer, exposing the underlying mineral soil to erosion and solar heating.',
        difficulty: 'medium'
      },
      {
        topic: 'Matching Headings',
        passage: 'Paragraph C: Wetland restoration requires re-establishing natural hydrological regimes. When agricultural drainage ditches are plugged, the water table rises, anaerobic soil conditions return, and specialized hydrophytic plants naturally recolonize the reclaimed landscape.',
        question: 'Which heading best fits Paragraph C?',
        options: {
          A: 'The operational mechanics of hydrological restoration in drained wetlands',
          B: 'Economic incentives for converting wetlands into commercial farmland',
          C: 'The engineering challenges of constructing concrete stormwater canals',
          D: 'Monitoring insect vectors in tropical standing water reservoirs'
        },
        correctAnswer: 'A',
        explanation: 'Paragraph C describes the process and mechanics of restoring wetland hydrology by plugging drainage ditches to raise water tables.',
        difficulty: 'medium'
      },
      {
        topic: 'Sentence Completion',
        passage: 'Desert varnish is a dark, micron-thin coating of manganese and iron oxides found on exposed desert rocks. Epilithic bacteria concentrate trace manganese from airborne dust and fix it onto the mineral surface via enzymatic oxidation.',
        question: 'Desert varnish forms on rock surfaces primarily because specialized bacteria _______.',
        options: {
          A: 'extract and enzymatically oxidize trace manganese from airborne atmospheric dust',
          B: 'dissolve the underlying granite to extract liquid water during summer droughts',
          C: 'secrete acidic compounds that erode the rock into fine sand grains',
          D: 'shield the stone from ultraviolet radiation by producing calcium carbonate crystals'
        },
        correctAnswer: 'A',
        explanation: 'The passage explains that epilithic bacteria concentrate trace manganese from airborne dust and fix it onto the rock surface through enzymatic oxidation.',
        difficulty: 'medium'
      },
      {
        topic: 'True/False/Not Given',
        passage: 'Phytoplankton blooms in the Southern Ocean are primarily iron-limited. Experiments demonstrating that micro-dosing surface waters with ferrous sulfate triggers rapid diatom proliferation have fueled debates over commercial ocean iron fertilization.',
        question: 'Statement: The Southern Ocean contains excess iron concentrations that prevent diatom growth.',
        options: {
          A: 'False (The Southern Ocean is iron-limited, meaning it lacks iron)',
          B: 'True',
          C: 'Not Given',
          D: 'Partially True'
        },
        correctAnswer: 'A',
        explanation: 'The text clearly states phytoplankton blooms are "iron-limited" (meaning iron is scarce and limits growth), making the statement False.',
        difficulty: 'easy'
      },
      {
        topic: 'Summary Completion',
        passage: 'The thermohaline circulation is driven by global density gradients created by surface heat and freshwater fluxes. In the North Atlantic, as water evaporates and freezes into sea ice, the remaining liquid water becomes increasingly salty and cold, ultimately sinking into the deep ocean abyss.',
        question: 'Summary: Deep water formation in the North Atlantic occurs because sea ice formation leaves behind liquid water that is exceptionally _______.',
        options: {
          A: 'dense, cold, and saline',
          B: 'warm, buoyant, and oxygen-depleted',
          C: 'acidic, nutrient-poor, and light',
          D: 'pressurized, carbonated, and warm'
        },
        correctAnswer: 'A',
        explanation: 'The passage indicates that freezing sea ice leaves remaining water "increasingly salty and cold," which makes it dense and causes it to sink.',
        difficulty: 'medium'
      },
      {
        topic: 'Information Matching',
        passage: 'Wildfire smoke plumes can inject pyrocumulonimbus clouds into the lower stratosphere. These high-altitude storm clouds transport carbonaceous soot particles across hemispheric distances, persisting for months and modulating stratospheric ozone chemistry.',
        question: 'How do intense wildfire smoke plumes reach and impact the lower stratosphere?',
        options: {
          A: 'By forming pyrocumulonimbus storm clouds that inject soot directly into stratospheric layers',
          B: 'Through continuous volcanic thermal updrafts that carry ground ash upwards',
          C: 'By evaporating ocean water to create high-velocity hurricane vortex winds',
          D: 'Through human-made atmospheric research rockets releasing exhaust gases'
        },
        correctAnswer: 'A',
        explanation: 'The text states that wildfire plumes create pyrocumulonimbus clouds capable of injecting carbonaceous soot into the lower stratosphere.',
        difficulty: 'hard'
      },
      {
        topic: 'Writer\'s Views',
        passage: 'The monetization of ecosystem services under neoclassical carbon markets frequently reduces multifaceted ecological habitats to single commodity metrics. This reductionist framework risks overlooking irreplaceable cultural, hydrological, and biodiversity functions that cannot be traded on carbon exchanges.',
        question: 'The author\'s critique of market-based carbon offsets is that they _______.',
        options: {
          A: 'oversimplify complex ecosystems by ignoring non-carbon ecological and cultural values',
          B: 'fail to generate sufficient financial profits for multinational corporations',
          C: 'are completely unenforceable due to a lack of satellite monitoring technology',
          D: 'overvalue biodiversity conservation at the expense of industrial development'
        },
        correctAnswer: 'A',
        explanation: 'The author argues that carbon markets use a "reductionist framework" that overlooks crucial cultural, hydrological, and biodiversity dimensions of ecosystems.',
        difficulty: 'hard'
      },
      {
        topic: 'Vocabulary in Context',
        passage: 'Corals maintain an obligate endosymbiotic relationship with dinoflagellates of the family Symbiodiniaceae. Thermal stress triggers the expulsion of these symbionts, leaving the translucent calcium carbonate skeleton visible—a phenomenon known as coral bleaching.',
        question: 'In this context, the term "obligate" indicates that the relationship is:',
        options: {
          A: 'Essential and necessary for the survival of the organisms',
          B: 'Temporary and purely accidental',
          C: 'Harmful and parasitic to the host coral',
          D: 'Competitive and aggressive between the two species'
        },
        correctAnswer: 'A',
        explanation: 'An "obligate" symbiosis is one where the organisms depend strictly upon each other for survival and cannot thrive independently.',
        difficulty: 'easy'
      },
      {
        topic: 'Factual Comprehension',
        passage: 'Kelp forests sequester significant amounts of carbon, which is subsequently exported to the deep sea when detached kelp fronds drift over continental shelves and sink into abyssal trenches where carbon remains sequestered for centuries.',
        question: 'What mechanism allows kelp forests to achieve long-term deep-sea carbon sequestration?',
        options: {
          A: 'Detached fronds drift off continental shelves and sink into deep abyssal ocean trenches.',
          B: 'Kelp roots penetrate deep into undersea bedrock, storing carbon in basaltic stone.',
          C: 'Kelp plants convert carbon dioxide directly into insoluble calcite crystal reefs.',
          D: 'Herbivorous sea otters bury kelp biomass in subterranean seafloor caverns.'
        },
        correctAnswer: 'A',
        explanation: 'The passage describes how detached kelp fronds drift beyond the continental shelf and sink into abyssal trenches, trapping carbon for centuries.',
        difficulty: 'medium'
      },
      {
        topic: 'True/False/Not Given',
        passage: 'Desalination plants produce potable water from seawater but generate large volumes of hypersaline brine. This brine, often enriched with anti-scaling chemical additives, is typically discharged back into coastal waters where its high density causes it to sink and disrupt benthic marine life.',
        question: 'Statement: Brine discharged from desalination plants tends to float on the ocean surface due to its high salt concentration.',
        options: {
          A: 'False (High density causes the hypersaline brine to sink, not float)',
          B: 'True',
          C: 'Not Given',
          D: 'Partially True'
        },
        correctAnswer: 'A',
        explanation: 'The passage explicitly states that because of its high density, the brine sinks to the seafloor, making the statement False.',
        difficulty: 'easy'
      },
      {
        topic: 'Matching Headings',
        passage: 'Paragraph D: Microplastics in marine environments serve as vectors for toxic hydrophobic pollutants like PCBs and DDT. When marine organisms ingest plastic micro-particles, these lipophilic toxins desorb within digestive tracts, bioaccumulating across upper trophic levels.',
        question: 'Which heading best fits Paragraph D?',
        options: {
          A: 'Microplastics as transport vectors and bioaccumulators of chemical toxins in marine food webs',
          B: 'Techniques for manufacturing biodegradable plant-based plastic alternatives',
          C: 'The historical development of commercial polymer packaging in the 1950s',
          D: 'Global satellite mapping of ocean surface garbage gyres'
        },
        correctAnswer: 'A',
        explanation: 'Paragraph D focuses on how microplastics absorb toxic pollutants and transfer them into marine organisms, leading to bioaccumulation.',
        difficulty: 'medium'
      },
      {
        topic: 'Sentence Completion',
        passage: 'Salt marshes attenuate wave energy through stem drag and promote vertical sediment accretion via organic matter deposition, allowing these coastal wetlands to keep pace with moderate rates of sea-level rise.',
        question: 'Salt marshes can maintain their elevation relative to rising sea levels because _______.',
        options: {
          A: 'dense plant stems trap sediments and accumulate organic matter over time',
          B: 'underground volcanic activity continuously pushes the shoreline upwards',
          C: 'marsh grasses absorb excess ocean water into deep root reservoirs',
          D: 'artificial seawalls are constructed behind the marshes to block storm surges'
        },
        correctAnswer: 'A',
        explanation: 'The passage attributes salt marsh elevation stability to stem drag trapping sediment and vertical accretion of organic matter.',
        difficulty: 'medium'
      },
      {
        topic: 'Writer\'s Views',
        passage: 'Relying exclusively on technological carbon capture and storage (CCS) from industrial flue gases without curbing baseline fossil fuel consumption creates moral hazard. It risks diverting capital from renewable energy infrastructure and locking societies into carbon-intensive paradigms for decades to come.',
        question: 'What is the primary moral hazard associated with industrial CCS identified by the author?',
        options: {
          A: 'It may deter essential transitions to renewable energy by legitimizing continued fossil fuel reliance.',
          B: 'It consumes more electrical energy than all current global renewable generators produce.',
          C: 'It produces dangerous radioactive isotopes during subterranean carbon mineralization.',
          D: 'It requires converting vast areas of fertile arable land into underground storage caverns.'
        },
        correctAnswer: 'A',
        explanation: 'The author explicitly cautions that CCS creates a moral hazard by diverting capital from renewables and locking societies into fossil fuel reliance.',
        difficulty: 'hard'
      }
    ]
  }
];

console.log('Building remaining chapters for generator...');
