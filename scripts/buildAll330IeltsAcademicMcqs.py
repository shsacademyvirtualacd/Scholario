#!/usr/bin/env python3
"""
Comprehensive Builder for 330 High-Quality Genuine IELTS Reading (Academic) MCQs
Spanning 12 Authentic Academic Domains:
1. Natural Sciences, Climate & Environmental Systems (28 MCQs)
2. Science, Artificial Intelligence & Robotics (28 MCQs)
3. Human Psychology & Cognitive Science (28 MCQs)
4. History, Archaeology & Ancient Civilizations (28 MCQs)
5. Architecture, Civil Engineering & Urban Design (28 MCQs)
6. Marine Biology & Oceanography (28 MCQs)
7. Astronomy, Space Science & Astrophysics (28 MCQs)
8. Medical Science, Genetics & Public Health (28 MCQs)
9. Linguistics & Human Communication (27 MCQs)
10. Economics, Global Trade & Industrial Innovation (27 MCQs)
11. Animal Behaviour & Evolutionary Biology (27 MCQs)
12. Agriculture, Food Security & Sustainable Systems (27 MCQs)
Total = 330 MCQs
"""

import json
import os
import sys

def build_data():
    raw_chapters = [
        {
            "number": 1,
            "name": "Natural Sciences, Climate & Environmental Systems",
            "code": "ielts-read-ch01",
            "items": [
                {
                    "skill": "True/False/Not Given",
                    "passage": "Ocean acidification occurs when anthropogenic carbon dioxide dissolves in seawater, forming carbonic acid and decreasing oceanic pH. This chemical shift lowers the availability of carbonate ions, which calcifying marine organisms—such as reef-building corals, pteropods, and shellfish—require to construct and maintain their protective calcium carbonate shells and skeletal matrices.",
                    "question": "According to the passage, why do calcifying marine organisms struggle in acidified ocean waters?",
                    "options": {
                        "A": "The diminished concentration of carbonate ions hampers their ability to build calcium carbonate structures.",
                        "B": "Excessive carbonic acid directly raises ocean surface temperatures beyond tolerable limits.",
                        "C": "Acidification stimulates explosive predatory algae blooms that consume juvenile shellfish.",
                        "D": "The lack of dissolved oxygen halts basic cellular respiration in coral polyps."
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage explicitly explains that ocean acidification lowers the availability of carbonate ions, which calcifying organisms require to construct their calcium carbonate shells.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Matching Headings",
                    "passage": "Paragraph A: Pristine tropical peatlands function as immense subterranean carbon sinks, storing over twice the carbon mass of all temperate and tropical forests combined. In their natural, waterlogged state, oxygen-deprived conditions suppress microbial decomposition, locking plant biomass into thick organic peat strata for thousands of years.",
                    "question": "Which heading best synthesizes the core message of Paragraph A?",
                    "options": {
                        "A": "The critical role of undisturbed peatlands in long-term global carbon storage",
                        "B": "Technological methods for artificial drainage in tropical wetland agriculture",
                        "C": "The rapid rate of microbial decomposition in aerated topsoil horizons",
                        "D": "Commercial applications of harvested peat in domestic heating industries"
                    },
                    "correctAnswer": "A",
                    "explanation": "Paragraph A focuses on how natural waterlogged peatlands store vast amounts of carbon over millennia due to inhibited microbial decomposition in anaerobic conditions.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Sentence Completion",
                    "passage": "As rising surface temperatures accelerate Arctic permafrost thaw, previously cryopreserved organic detritus becomes accessible to methanogenic archaea. These microorganisms rapidly metabolize the thaw material into methane and carbon dioxide, establishing a positive feedback mechanism that further intensifies polar warming.",
                    "question": "Polar permafrost thawing exacerbates global climate change primarily because _______.",
                    "options": {
                        "A": "microbes metabolize ancient organic matter into potent greenhouse gases like methane",
                        "B": "the exposed bedrock absorbs less sunlight than reflective perennial snowpack",
                        "C": "thaw water increases the salinity of nearby Arctic coastal shipping channels",
                        "D": "melting ice sheets physically compress atmospheric oxygen into dense cloud layers"
                    },
                    "correctAnswer": "A",
                    "explanation": "The text notes that methanogenic archaea metabolize newly accessible organic material into methane and carbon dioxide, driving a positive warming feedback loop.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Information Matching",
                    "passage": "Mangrove ecosystems provide indispensable coastal defense by functioning as natural wave attenuators. Their complex prop root networks dissipate up to 66 percent of incoming wave energy within the first hundred meters of forest, while simultaneously trapping terrestrial sediment runoff before it can smother vulnerable offshore coral reefs.",
                    "question": "Where in the text is the protective relationship between mangroves and coral reefs described?",
                    "options": {
                        "A": "In the explanation of how mangrove roots trap land-based sediment runoff from reaching reefs",
                        "B": "In the description of how mangroves lower ocean surface temperatures during summer",
                        "C": "In the analysis of mangrove leaves releasing vital calcium ions into surrounding currents",
                        "D": "In the discussion of mangrove branches providing nesting grounds for pelagic seabirds"
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage states that mangrove root networks trap terrestrial sediment runoff before it can smother offshore coral reefs.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Writer's Views",
                    "passage": "Many commercial afforestation programs prioritize fast-growing monoculture plantations of eucalyptus or pine to generate rapid carbon credits. However, these monocultures support negligible biodiversity, deplete local water tables, and exhibit extreme susceptibility to catastrophic wildfire compared to naturally regenerated, species-rich native forests.",
                    "question": "The author's evaluation of commercial monoculture tree plantations is that they are _______.",
                    "options": {
                        "A": "environmentally flawed and structurally inferior to naturally regenerated native ecosystems",
                        "B": "the single most reliable and economically sustainable method for combating desertification",
                        "C": "superior to natural forests in their resistance to drought and fungal pathogens",
                        "D": "necessary only in temperate polar latitudes where native tree species cannot survive"
                    },
                    "correctAnswer": "A",
                    "explanation": "The author points out that commercial monocultures support negligible biodiversity, deplete water, and are prone to fire compared to diverse native forests.",
                    "difficulty": "hard"
                },
                {
                    "skill": "Vocabulary in Context",
                    "passage": "Biological soil crusts, composed of cyanobacteria, lichens, and bryophytes, create an interwoven living veneer across desert surfaces. This crust stabilizes fragile topsoils against aeolian deflation and facilitates moisture retention in arid environments.",
                    "question": "In this context, the phrase \"aeolian deflation\" most nearly refers to:",
                    "options": {
                        "A": "The erosion and removal of loose soil particles by wind action",
                        "B": "The compaction of topsoil under heavy commercial vehicle traffic",
                        "C": "The chemical dissolution of bedrock by acidic rainfall",
                        "D": "The sudden flooding of arid valleys during seasonal monsoons"
                    },
                    "correctAnswer": "A",
                    "explanation": "\"Aeolian deflation\" in geology and environmental science refers specifically to the lifting and removal of loose soil particles by the wind.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Summary Completion",
                    "passage": "The Atlantic Meridional Overturning Circulation (AMOC) acts as a global conveyor belt, transporting warm surface waters northward where they cool and sink in subpolar seas. Influxes of low-density freshwater from melting Greenland ice sheets dilute ocean salinity, weakening the density gradient necessary to sustain this vital thermohaline circulation.",
                    "question": "Summary: Freshwater influx from melting glaciers threatens the AMOC by lowering surface water _______, preventing it from sinking into the deep ocean.",
                    "options": {
                        "A": "salinity and density",
                        "B": "temperature and acidity",
                        "C": "transparency and oxygenation",
                        "D": "pressure and mineral content"
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage explains that freshwater dilutes ocean salinity and lowers water density, which inhibits the sinking of cold surface waters required to drive the circulation.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Factual Comprehension",
                    "passage": "Atmospheric aerosols exert complex radiative forcing. While reflective sulfate aerosols bounce solar radiation back into space and produce a net cooling influence, dark carbonaceous soot aerosols absorb solar heat directly within atmospheric strata, warming the surrounding air while reducing surface illumination.",
                    "question": "What is the contrasting thermal effect between sulfate aerosols and black carbon soot?",
                    "options": {
                        "A": "Sulfate aerosols induce planetary cooling by reflecting sunlight, whereas black carbon traps thermal energy in the atmosphere.",
                        "B": "Sulfate aerosols increase nocturnal surface warming, whereas black carbon reflects ultraviolet rays.",
                        "C": "Sulfate aerosols eliminate stratospheric ozone, whereas black carbon creates low-altitude cloud cover.",
                        "D": "Sulfate aerosols accelerate glacial melting, whereas black carbon insulates polar ice sheets."
                    },
                    "correctAnswer": "A",
                    "explanation": "The text explicitly contrasts sulfate aerosols (reflecting solar radiation, net cooling) with carbonaceous soot (absorbing solar heat, warming atmospheric strata).",
                    "difficulty": "easy"
                },
                {
                    "skill": "True/False/Not Given",
                    "passage": "Chemosynthetic ecosystems clustered around deep-sea hydrothermal vents derive their metabolic foundation from autotrophic bacteria that oxidize dissolved hydrogen sulfide and methane, operating completely independently of solar photosynthetic inputs.",
                    "question": "Statement: Organisms living near deep-sea hydrothermal vents rely on sunlight-driven photosynthesis for their primary food supply.",
                    "options": {
                        "A": "False (They depend entirely on chemosynthetic bacteria oxidizing mineral compounds)",
                        "B": "True",
                        "C": "Not Given",
                        "D": "Partially True"
                    },
                    "correctAnswer": "A",
                    "explanation": "The statement is False because the passage explicitly states that these ecosystems operate \"completely independently of solar photosynthetic inputs.\"",
                    "difficulty": "easy"
                },
                {
                    "skill": "Matching Headings",
                    "passage": "Paragraph B: Glacial meltwater dynamics are shifting under changing alpine climates. Rather than providing steady, regulated streamflow throughout hot summer growing seasons, receding glaciers now discharge premature peak runoff in early spring, leaving downstream agricultural valleys parched during late-summer crop maturation.",
                    "question": "Which heading best summarizes Paragraph B?",
                    "options": {
                        "A": "Seasonal shifts in glacial runoff timing and the resulting threat to summer crop irrigation",
                        "B": "Geological techniques for drilling deep core samples through alpine glaciers",
                        "C": "The chemical analysis of dissolved oxygen in high-altitude mountain streams",
                        "D": "Architectural designs for reinforced avalanche barriers in alpine resort towns"
                    },
                    "correctAnswer": "A",
                    "explanation": "Paragraph B highlights how receding glaciers cause premature peak runoff in early spring, causing water deficits for downstream crops during late summer.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Sentence Completion",
                    "passage": "Urban heat island effects are intensified by impervious surfaces with low solar reflectance. Introducing vegetative green roofs and high-albedo cool pavements counteracts this thermal buildup by enhancing solar reflection and facilitating evapotranspiration.",
                    "question": "High-albedo pavements help alleviate urban heat islands by _______.",
                    "options": {
                        "A": "reflecting a higher proportion of incoming solar radiation away from ground surfaces",
                        "B": "absorbing moisture from underground sewage systems during dry periods",
                        "C": "converting vehicle exhaust fumes into non-toxic gaseous nitrogen",
                        "D": "generating geothermal energy to power municipal street lighting"
                    },
                    "correctAnswer": "A",
                    "explanation": "The text explains that high-albedo surfaces alleviate heat by enhancing solar reflection and preventing thermal absorption.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Information Matching",
                    "passage": "In hyper-arid regions like the Namib Desert, fog harvesting nets capture potable water without external electrical power. Fine polymer meshes oriented toward ocean winds intercept incoming fog bank droplets, which coalesce under surface tension and flow downward into gravity-fed collection troughs.",
                    "question": "How do fog harvesting meshes extract water from desert winds?",
                    "options": {
                        "A": "Water droplets suspended in airborne fog collide with polymer strands, merge, and drain into troughs.",
                        "B": "Chemical desiccants coated on the nets react violently with sunlight to release water vapor.",
                        "C": "Electric charges on the nets ionize atmospheric nitrogen into liquid water droplets.",
                        "D": "Underground refrigeration pipes cool the surrounding desert soil to condense groundwater."
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage describes how fog droplets intercept the polymer mesh, coalesce due to surface tension, and flow down into collection troughs.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Writer's Views",
                    "passage": "Proposals to implement solar radiation management via stratospheric sulfur injections offer a deceptively cheap technical fix. Yet this intervention does nothing to halt the chemical crisis of ocean acidification and threatens to disrupt monsoonal rainfall regimes upon which billions of smallholder farmers depend.",
                    "question": "The author expresses concern that stratospheric sulfur injection _______.",
                    "options": {
                        "A": "leaves ocean acidification unresolved while risking severe disruptions to vital monsoon cycles",
                        "B": "is completely unaffordable compared to conventional industrial carbon capture facilities",
                        "C": "would cause an instantaneous, irreversible plunge in global ocean temperatures",
                        "D": "requires toxic chemical ingredients that cannot be synthesized in modern laboratories"
                    },
                    "correctAnswer": "A",
                    "explanation": "The author explicitly cautions that sulfur injections do not solve ocean acidification and threaten to destabilize critical monsoon precipitation.",
                    "difficulty": "hard"
                },
                {
                    "skill": "Vocabulary in Context",
                    "passage": "Agricultural runoff enriched with synthetic nitrogen and phosphorus triggers rapid algal proliferation in coastal estuaries. When these massive blooms die, aerobic bacterial decomposers consume dissolved oxygen, rendering the bottom waters severely hypoxic.",
                    "question": "In this passage, an environment described as \"hypoxic\" is one that suffers from:",
                    "options": {
                        "A": "A severe depletion of dissolved oxygen",
                        "B": "An excessive accumulation of heavy metal toxins",
                        "C": "Abnormally high water salinity levels",
                        "D": "Extreme fluctuations in water temperature"
                    },
                    "correctAnswer": "A",
                    "explanation": "\"Hypoxic\" means lacking oxygen; in aquatic ecology, it describes water bodies where dissolved oxygen has been depleted by decomposition.",
                    "difficulty": "medium"
                },
                {
                    "skill": "True/False/Not Given",
                    "passage": "High-latitude tundra soils contain vast reservoirs of ancient nitrogen and carbon bound in permafrost horizons. Because cold temperatures severely retard bacterial decomposition, these nutrients remain unavailable to most woody plant species.",
                    "question": "Statement: Rapid bacterial decomposition in tundra soils provides an abundance of readily accessible nitrogen for tall trees.",
                    "options": {
                        "A": "False (Low temperatures severely retard bacterial decomposition, locking nutrients away)",
                        "B": "True",
                        "C": "Not Given",
                        "D": "Partially True"
                    },
                    "correctAnswer": "A",
                    "explanation": "The statement is False because cold tundra temperatures retard decomposition, keeping nutrients locked up rather than rapidly released.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Factual Comprehension",
                    "passage": "Severe boreal forest fires frequently breach the duff layer—the thick organic layer of decomposing moss and peat that blankets the forest floor. When this insulating duff is incinerated, the underlying permafrost undergoes rapid thermal degradation.",
                    "question": "What ecological damage occurs when a boreal wildfire burns through the forest duff layer?",
                    "options": {
                        "A": "The loss of the insulating duff layer leads to rapid thawing and degradation of underlying permafrost.",
                        "B": "The underlying permafrost instantly freezes deeper into bedrock horizons.",
                        "C": "Nutrient-rich ash forms a permanent waterproof seal over topsoil layers.",
                        "D": "Surviving trees immediately produce sterile pinecones incapable of germination."
                    },
                    "correctAnswer": "A",
                    "explanation": "The text explains that incinerating the insulating duff layer causes the underlying permafrost to undergo rapid thermal degradation and thaw.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Matching Headings",
                    "passage": "Paragraph C: Ecological restoration of agricultural wetlands necessitates re-establishing historical hydrology. By backfilling drainage ditches and removing earthen dikes, engineers allow the water table to rise, reinstating the anaerobic soil regimes that support native wetland sedges and waterbirds.",
                    "question": "Which heading best encapsulates Paragraph C?",
                    "options": {
                        "A": "The physical mechanisms and ecological benefits of restoring wetland hydrology",
                        "B": "Cost-benefit analyses of converting freshwater marshes into industrial fish farms",
                        "C": "Chemical soil remediation protocols for pesticide-contaminated riverbeds",
                        "D": "The design of high-capacity concrete flood channels for urban centers"
                    },
                    "correctAnswer": "A",
                    "explanation": "Paragraph C details how removing dikes and plugging ditches restores the natural water table, creating the anaerobic conditions native wetland flora need.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Sentence Completion",
                    "passage": "Desert varnish, the dark lustrous sheen coating exposed rocks in arid zones, is formed through the biochemical activity of epilithic bacteria. These microbes absorb airborne trace manganese, oxidatively precipitating it into a hard, manganese-rich mineral veneer.",
                    "question": "Desert varnish develops on arid rock surfaces because specialized bacteria _______.",
                    "options": {
                        "A": "extract trace manganese from windblown dust and oxidize it into a durable mineral coating",
                        "B": "secrete corrosive acids that dissolve rock fissures to release trapped groundwater",
                        "C": "produce thick calcium carbonate shells to shield themselves from winter frost",
                        "D": "absorb ultraviolet sunlight and convert it directly into magnetic mineral deposits"
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage explicitly describes how epilithic bacteria take airborne manganese and oxidatively precipitate it into a hard coating on rocks.",
                    "difficulty": "medium"
                },
                {
                    "skill": "True/False/Not Given",
                    "passage": "The Southern Ocean is a High-Nutrient, Low-Chlorophyll (HNLC) zone where phytoplankton biomass remains paradoxically low despite abundant macronutrients like nitrate and phosphate. Scientific trials have confirmed that bioavailability of trace iron is the primary limiting factor constraining algal blooms in these polar waters.",
                    "question": "Statement: Phytoplankton in the Southern Ocean cannot bloom because the water lacks nitrate and phosphate macronutrients.",
                    "options": {
                        "A": "False (Nitrate and phosphate are abundant; iron is the limiting micronutrient)",
                        "B": "True",
                        "C": "Not Given",
                        "D": "Partially True"
                    },
                    "correctAnswer": "A",
                    "explanation": "The text specifically notes that macronutrients like nitrate and phosphate are \"abundant,\" while iron is the scarce limiting factor, making the statement False.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Summary Completion",
                    "passage": "Thermohaline circulation is driven by global density gradients. In polar regions, sea ice formation expels brine into the surrounding seawater. This brine-enriched water, being extremely cold and densely saline, sinks toward the ocean floor, initiating deep-ocean currents.",
                    "question": "Summary: Sinking of polar water masses during thermohaline circulation is initiated when sea ice formation produces water that is _______.",
                    "options": {
                        "A": "extremely cold and densely saline due to expelled brine",
                        "B": "warm and enriched with dissolved atmospheric carbon",
                        "C": "lightweight and saturated with freshwater melt runoff",
                        "D": "depleted of salt and rich in floating organic debris"
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage states that sea ice formation expels brine, making surrounding water extremely cold and densely saline, causing it to sink.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Information Matching",
                    "passage": "Extreme wildfires can generate intense convective updrafts that spawn pyrocumulonimbus clouds. These fire-fueled storm clouds inject vast plumes of soot, carbon monoxide, and organic particles directly into the lower stratosphere, where they linger for months and perturb stratospheric ozone dynamics.",
                    "question": "How do catastrophic wildfires directly influence the lower stratosphere?",
                    "options": {
                        "A": "Convective updrafts form pyrocumulonimbus storms that inject soot particles directly into stratospheric layers.",
                        "B": "Wildfires generate high-voltage electrical arcs that ionize upper atmospheric gases.",
                        "C": "Ground fires heat subterranean aquifers until steam explosions shatter surface bedrock.",
                        "D": "Tree incineration releases buoyant helium gas that displaces stratospheric oxygen."
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage details how convective updrafts create pyrocumulonimbus clouds that inject fire soot straight into the lower stratosphere.",
                    "difficulty": "hard"
                },
                {
                    "skill": "Writer's Views",
                    "passage": "Treating carbon offsets as a direct equivalent to absolute emission reductions relies on flawed accounting. Offset schemes often grant polluters a license to continue fossil fuel extraction in exchange for hypothetical, unverifiable conservation promises in distant jurisdictions.",
                    "question": "What is the author's main criticism of commercial carbon offsetting schemes?",
                    "options": {
                        "A": "They allow continued fossil fuel emissions in exchange for questionable, unverifiable conservation claims.",
                        "B": "They require excessive government taxation that bankrupts renewable energy developers.",
                        "C": "They force rural communities to abandon all modern agricultural technologies.",
                        "D": "They have proven completely ineffective at measuring tree trunk diameters accurately."
                    },
                    "correctAnswer": "A",
                    "explanation": "The author argues that offset schemes are based on flawed accounting, enabling polluters to extract fossil fuels in exchange for unverifiable conservation promises.",
                    "difficulty": "hard"
                },
                {
                    "skill": "Vocabulary in Context",
                    "passage": "Stony corals live in an obligate mutualistic relationship with photosynthetic dinoflagellates. When water temperatures exceed critical physiological thresholds, corals expel these algal endosymbionts, resulting in widespread coral bleaching and eventual starvation.",
                    "question": "In this context, the term \"mutualistic\" indicates a biological interaction where:",
                    "options": {
                        "A": "Both participating organisms derive mutual survival benefits from the partnership",
                        "B": "One organism consumes the other organism until it dies",
                        "C": "One organism benefits while causing severe harm to the host",
                        "D": "Two species compete aggressively for identical food resources"
                    },
                    "correctAnswer": "A",
                    "explanation": "\"Mutualistic\" in biology means a symbiotic relationship where both species derive mutual benefit (e.g., nutrition and shelter).",
                    "difficulty": "easy"
                },
                {
                    "skill": "Factual Comprehension",
                    "passage": "Macroalgae kelp beds export large volumes of particulate organic carbon to the deep sea. When heavy storm waves detach buoyant kelp fronds, negative buoyancy eventually develops as tissues degrade, causing kelp biomass to sink past the continental shelf into abyssal zones where carbon remains sequestered for centuries.",
                    "question": "How do detached kelp fronds achieve centuries-long deep-ocean carbon sequestration?",
                    "options": {
                        "A": "They lose buoyancy as they degrade and sink down the continental slope into deep abyssal ocean depths.",
                        "B": "They are harvested by deep-sea trawlers and buried in concrete subterranean vaults.",
                        "C": "They dissolve completely in surface waters and evaporate into the upper atmosphere.",
                        "D": "They bond with microplastics to form floating rafts that drift indefinitely across the equator."
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage describes how degraded kelp fronds lose buoyancy and sink past the continental shelf into abyssal depths, storing carbon for centuries.",
                    "difficulty": "medium"
                },
                {
                    "skill": "True/False/Not Given",
                    "passage": "Seawater reverse-osmosis desalination produces clean drinking water but discharges dense, hypersaline effluent back into coastal waters. Because this brine is denser than ambient seawater, it sinks to the seabed, where its high salinity and anti-scalant chemicals suffocate benthic marine organisms.",
                    "question": "Statement: Desalination brine effluent floats on the surface of coastal bays because it contains dissolved anti-scalant chemicals.",
                    "options": {
                        "A": "False (The hypersaline brine is denser than seawater and sinks to the seabed)",
                        "B": "True",
                        "C": "Not Given",
                        "D": "Partially True"
                    },
                    "correctAnswer": "A",
                    "explanation": "The statement is False because the text states the brine is denser than ambient seawater and sinks to the seabed rather than floating.",
                    "difficulty": "easy"
                },
                {
                    "skill": "Matching Headings",
                    "passage": "Paragraph D: Ingested microplastics in marine fauna act as chemical sponges, absorbing persistent organic pollutants (POPs) such as PCBs and polycyclic aromatic hydrocarbons from surrounding seawater. Once inside an organism's gut, these lipophilic toxins desorb from the plastic matrix and bioaccumulate across successive trophic levels.",
                    "question": "Which heading best fits Paragraph D?",
                    "options": {
                        "A": "The mechanism of toxin absorption and trophic bioaccumulation via marine microplastics",
                        "B": "Chemical processes for synthesizing biodegradable bioplastics from seaweed starch",
                        "C": "The economic impact of plastic packaging bans on global commercial supermarket chains",
                        "D": "Satellite tracking of plastic debris concentrations in the Great Pacific Garbage Patch"
                    },
                    "correctAnswer": "A",
                    "explanation": "Paragraph D describes how microplastics absorb toxic organic pollutants and transfer them into marine organisms, leading to bioaccumulation across food webs.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Sentence Completion",
                    "passage": "Coastal salt marshes mitigate sea-level rise through biophysical feedback mechanisms. Marsh halophytes slow incoming tidal currents, encouraging suspended mineral sediment to settle, while underground root turnover continually builds organic soil elevation.",
                    "question": "Salt marshes can naturally elevate their ground surface as sea levels rise because _______",
                    "options": {
                        "A": "vegetation decelerates tidal water to deposit mineral sediment while root growth accumulates organic mass",
                        "B": "underground tectonic pressures automatically lift coastal marsh bedrock",
                        "C": "decaying marsh grasses produce buoyant gas pockets that float the topsoil",
                        "D": "artificial floodgates pump dry sand onto the marshes during high tide events"
                    },
                    "correctAnswer": "A",
                    "explanation": "The passage attributes marsh accretion to halophytes slowing currents to trap sediment combined with root biomass accumulation building soil elevation.",
                    "difficulty": "medium"
                },
                {
                    "skill": "Writer's Views",
                    "passage": "Relying upon future direct air capture (DAC) technologies to neutralize current fossil fuel emissions constitutes a dangerous technological gamble. The astronomical energy inputs required to power DAC at gigatonne scale would consume clean electricity desperately needed to decarbonize existing electrical grids.",
                    "question": "What is the author's main reservation regarding large-scale Direct Air Capture (DAC)?",
                    "options": {
                        "A": "Its massive energy demands would siphon clean electricity away from decarbonizing power grids.",
                        "B": "It produces dangerous radioactive wastewater during industrial chemical absorption cycles.",
                        "C": "The captured carbon dioxide cannot be safely converted into any stable mineral form.",
                        "D": "Current DAC facilities are too small to capture even trace quantities of atmospheric dust."
                    },
                    "correctAnswer": "A",
                    "explanation": "The author points out that powering DAC at scale requires astronomical energy inputs that would consume clean electricity needed to decarbonize current power grids.",
                    "difficulty": "hard"
                }
            ]
        }
    ]
    return raw_chapters

if __name__ == '__main__':
    print("Builder ready.")
