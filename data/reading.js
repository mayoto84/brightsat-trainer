// data/reading.js  — Information & Ideas + Craft & Structure
// All questions must have: id, section:'rw', domain, skill, type:'mc', passage(opt), stem, choices[], answer(index), explanation

window.READING_QUESTIONS = [

/* ═══════════════════════════════════════════
   INFORMATION & IDEAS
═══════════════════════════════════════════ */

// ── Central Ideas & Details ──────────────────────────────────

{id:"rw_ii_01",section:"rw",domain:"Information and Ideas",skill:"Central Ideas and Details",type:"mc",
passage:"The octopus has demonstrated remarkable problem-solving abilities. In laboratory settings, octopuses have opened jars to reach food, navigated mazes, and even learned to recognize individual human caretakers, approaching some and avoiding others.",
stem:"Which choice best states the main idea of the text?",
choices:["Octopuses are difficult to keep in laboratories.","Octopuses display notable intelligence in several ways.","Octopuses prefer certain foods over others.","Octopuses are dangerous to human caretakers."],
answer:1,
explanation:"The first sentence states the main idea (problem-solving abilities), and the rest gives examples. The best summary is that octopuses display notable intelligence."},

{id:"rw_ii_06",section:"rw",domain:"Information and Ideas",skill:"Central Ideas and Details",type:"mc",
passage:"Volunteer firefighters make up the majority of fire departments in rural areas. Without them, many small towns could not afford professional crews. Yet recruitment has declined sharply in recent decades, leaving some departments unable to respond quickly to emergencies.",
stem:"According to the text, why is the decline in volunteer firefighters a serious problem for small towns?",
choices:["Professional firefighters refuse to work in rural areas.","Small towns often rely on volunteers because they cannot afford professional crews.","Volunteers are better trained than professional firefighters.","Rural areas have more fires than cities do."],
answer:1,
explanation:"The text states that without volunteers many small towns 'could not afford professional crews,' so losing volunteers leaves them without affordable coverage."},

{id:"rw_ii_09",section:"rw",domain:"Information and Ideas",skill:"Central Ideas and Details",type:"mc",
passage:"Coral reefs cover less than one percent of the ocean floor, but they support roughly a quarter of all marine species. They provide shelter, breeding grounds, and feeding areas for an enormous variety of fish and invertebrates.",
stem:"Which choice best states the main idea of the text?",
choices:["Coral reefs are found only in shallow water.","Despite their small area, coral reefs support a large share of ocean life.","Most marine species live on the open ocean floor.","Coral reefs are shrinking rapidly worldwide."],
answer:1,
explanation:"The contrast between 'less than one percent' of area and 'a quarter of all marine species' is the central point: small reefs support disproportionately large biodiversity."},

{id:"rw_ii_11",section:"rw",domain:"Information and Ideas",skill:"Central Ideas and Details",type:"mc",
passage:"Tidal energy harnesses the rise and fall of sea levels to generate electricity. Unlike solar or wind power, tides follow a predictable schedule determined by lunar cycles, meaning tidal turbines can generate power at consistent, foreseeable intervals regardless of weather conditions.",
stem:"Which choice best states the main idea of the text?",
choices:["Tidal energy requires more turbines than solar energy does.","Tidal energy is more expensive to install than wind power.","A key advantage of tidal energy over other renewables is its predictability.","Lunar cycles are the primary driver of most ocean phenomena."],
answer:2,
explanation:"The passage highlights predictability—driven by lunar cycles—as what sets tidal energy apart from solar and wind. That distinction is the main point."},

{id:"rw_ii_15",section:"rw",domain:"Information and Ideas",skill:"Central Ideas and Details",type:"mc",
passage:"The printing press, introduced to Europe around 1440, dramatically lowered the cost of producing books. Within decades, texts that had taken scribes months to copy could be reproduced in hours. Literacy rates rose across social classes as books became affordable to people who had previously been excluded from written culture.",
stem:"According to the text, what was the most significant effect of the printing press on European society?",
choices:["It ended the work of professional scribes entirely.","It made books affordable, which expanded access to written culture.","It caused literacy rates in Europe to reach 100 percent.","It led to conflicts between printers and the Catholic Church."],
answer:1,
explanation:"The passage links lower book costs to rising literacy across social classes — broader access to written culture is the key effect described."},

{id:"rw_ii_19",section:"rw",domain:"Information and Ideas",skill:"Central Ideas and Details",type:"mc",
passage:"Dark matter makes up roughly 27 percent of the universe by mass-energy content, yet it has never been directly detected. Scientists infer its existence because galaxies rotate faster than visible matter alone can account for, and light bends around galaxy clusters more than expected if only visible matter were present.",
stem:"Which choice best states the main idea of the text?",
choices:["Dark matter is made of undiscovered subatomic particles.","Scientists believe dark matter exists because of indirect gravitational evidence.","Galaxies rotate faster than they should, which disproves standard physics.","Most of the universe consists of visible matter and energy."],
answer:1,
explanation:"The passage explains that dark matter is inferred—never directly seen—from gravitational effects on galaxy rotation and light bending. Indirect evidence is the core point."},

// ── Inferences ──────────────────────────────────────────────

{id:"rw_ii_02",section:"rw",domain:"Information and Ideas",skill:"Inferences",type:"mc",
passage:"Researchers found that students who took handwritten notes scored higher on conceptual questions than those who typed their notes. Typing allowed students to record words faster, but the researchers suggested that the slower pace of handwriting forced students to summarize ideas in their own words. This suggests that, for deep understanding, the act of note-taking matters less than _____",
stem:"Which choice most logically completes the text?",
choices:["the speed at which notes are recorded.","how much information is captured word for word.","the mental processing that occurs while taking notes.","whether a computer or pen is more comfortable to use."],
answer:2,
explanation:"The passage credits handwriting's benefit to students summarizing 'in their own words' — that is, mental processing — rather than speed or completeness. The logical completion points to that processing."},

{id:"rw_ii_05",section:"rw",domain:"Information and Ideas",skill:"Inferences",type:"mc",
passage:"The desert plant stores water in its thick stems during rare rainfalls. Months can pass without additional rain, yet the plant continues to grow and even flower. This ability allows the plant to survive in conditions where most species would _____",
stem:"Which choice most logically completes the text?",
choices:["thrive without difficulty.","quickly wither and die.","grow more rapidly.","produce more flowers."],
answer:1,
explanation:"The plant's water storage lets it survive long droughts. The logical contrast is that most other species, lacking this ability, would not survive — they would wither and die."},

{id:"rw_ii_08",section:"rw",domain:"Information and Ideas",skill:"Inferences",type:"mc",
passage:"A company replaced its annual performance reviews with brief weekly check-ins between managers and employees. Within a year, employees reported feeling more supported, and fewer left the company. The results suggest that frequent, informal feedback may be _____ than infrequent, formal evaluation.",
stem:"Which choice most logically completes the text?",
choices:["more time-consuming","more effective at retaining employees","less expensive to administer","less popular with managers"],
answer:1,
explanation:"The measured outcomes were higher reported support and lower turnover. The logical conclusion is that frequent informal feedback was more effective at retaining employees."},

{id:"rw_ii_12",section:"rw",domain:"Information and Ideas",skill:"Inferences",type:"mc",
passage:"Migratory monarch butterflies travel thousands of miles each year between Canada and Mexico. Scientists once assumed the butterflies navigated entirely by the position of the sun. Recent research, however, has revealed that monarchs also use Earth's magnetic field as a backup compass when skies are overcast. This suggests that monarch navigation is _____",
stem:"Which choice most logically completes the text?",
choices:["entirely dependent on magnetic fields.","less accurate on sunny days than on cloudy ones.","more sophisticated than a single-cue system.","unique among insect species worldwide."],
answer:2,
explanation:"The passage shows monarchs use both the sun and, when that's unavailable, magnetic fields — multiple cues, not just one. 'More sophisticated than a single-cue system' is the logical inference."},

{id:"rw_ii_16",section:"rw",domain:"Information and Ideas",skill:"Inferences",type:"mc",
passage:"Studies on sleep deprivation show that adults who sleep fewer than six hours per night perform significantly worse on memory consolidation tasks than those who sleep seven or more hours. The researchers note that sleep is when the brain transfers short-term memories into long-term storage. If this process is interrupted, newly learned information may be _____",
stem:"Which choice most logically completes the text?",
choices:["stored more efficiently for later use.","more likely to be consolidated permanently.","difficult to retain over time.","strengthened without the need for review."],
answer:2,
explanation:"The passage says sleep transfers short-term memory to long-term storage; interrupting this process means new information loses that transfer window — making it difficult to retain."},

{id:"rw_ii_20",section:"rw",domain:"Information and Ideas",skill:"Inferences",type:"mc",
passage:"In a study of antibiotic resistance, researchers found that bacteria exposed to sub-lethal doses of antibiotics — doses too low to kill them — were far more likely to develop resistance than bacteria exposed to full therapeutic doses. The researchers concluded that completing a full antibiotic course matters because _____",
stem:"Which choice most logically completes the text?",
choices:["partial doses are as effective as full ones at killing bacteria.","incomplete treatment may allow survivors to adapt and become resistant.","antibiotic resistance is caused by overuse, not underdose.","bacteria cannot survive any exposure to antibiotics."],
answer:1,
explanation:"The study shows sub-lethal exposure — what happens when a course is stopped early — leads to resistance. Completing the course prevents bacteria from surviving at a dose that lets them adapt."},

// ── Command of Evidence (Textual) ────────────────────────────

{id:"rw_ii_03",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Textual)",type:"mc",
passage:"A student hypothesizes that a local songbird species sings more frequently at dawn than at any other time of day.",
stem:"Which finding, if true, would most directly support the student's hypothesis?",
choices:["The birds build nests in tall trees near open fields.","Recordings show the birds produce far more songs in the hour after sunrise than in any other hour.","The birds eat insects that are most active in the afternoon.","The species is found across a wide geographic range."],
answer:1,
explanation:"The hypothesis is specifically about singing more at dawn. Only the choice comparing song counts by hour, with the post-sunrise hour highest, directly supports it."},

{id:"rw_ii_07",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Textual)",type:"mc",
passage:"An archaeologist argues that an ancient settlement engaged in long-distance trade rather than producing all of its own goods.",
stem:"Which finding from the excavation would most strongly support this argument?",
choices:["The settlement contained pottery made from clay found only hundreds of miles away.","The settlement had a large central fire pit.","The houses were built close together.","The site showed signs of seasonal flooding."],
answer:0,
explanation:"Goods made from materials available only far away indicate the items were obtained through trade, directly supporting the long-distance trade argument."},

{id:"rw_ii_13",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Textual)",type:"mc",
passage:"A marine biologist claims that a particular species of deep-sea fish communicates with members of its own species using bioluminescent light patterns.",
stem:"Which finding would most directly support the biologist's claim?",
choices:["The fish are found at depths where sunlight cannot penetrate.","Observations show that fish produce distinct light patterns only when other members of the same species are nearby.","The fish's bioluminescent organs are larger than those of related species.","Deep-sea fish that produce light are found across all ocean basins."],
answer:1,
explanation:"The claim is specifically about using light to communicate with others of the same species. Light patterns produced specifically when same-species members are present is the most direct evidence."},

{id:"rw_ii_17",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Textual)",type:"mc",
passage:"A historian argues that trade, not military conquest, was the primary driver of cultural exchange along the ancient Silk Road.",
stem:"Which evidence would most strongly support the historian's argument?",
choices:["Archaeological records show that military campaigns were frequent along the route.","Analysis of artifacts found along the route reveals the presence of goods — spices, textiles, glassware — originating thousands of miles away, with no evidence of conquest at those origin sites.","Ancient texts describe wars fought by merchants defending their caravans.","The Silk Road connected regions that spoke the same languages."],
answer:1,
explanation:"Long-distance trade goods at sites with no evidence of military conquest directly supports trade, not warfare, as the driver of cultural exchange along the route."},

// ── Command of Evidence (Quantitative) ──────────────────────

{id:"rw_ii_04",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Quantitative)",type:"mc",
passage:"A study measured average daily water use per person in four cities: City A used 80 gallons, City B used 110 gallons, City C used 95 gallons, and City D used 130 gallons. A researcher claims that the city with the highest population density used the least water per person. City A has the highest population density.",
stem:"Which choice best uses the data to support the researcher's claim?",
choices:["City D used 130 gallons, the most of any city.","City A used 80 gallons, less than any other listed city.","City B and City C used similar amounts of water.","The four cities together averaged over 100 gallons."],
answer:1,
explanation:"The claim links highest density (City A) to least water use. The supporting data point is that City A's 80 gallons is the lowest of the four."},

{id:"rw_ii_10",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Quantitative)",type:"mc",
passage:"A survey asked commuters how they traveled to work. Of 500 respondents, 220 drove alone, 130 used public transit, 90 carpooled, and 60 biked or walked. A transit planner concludes that most commuters in the survey did not drive alone.",
stem:"Which choice best uses the data to support the planner's conclusion?",
choices:["220 respondents drove alone, the largest single group.","Only 60 respondents biked or walked.","The 280 respondents who did not drive alone outnumber the 220 who did.","130 respondents used public transit."],
answer:2,
explanation:"'Most did not drive alone' requires comparing drive-alone (220) to everyone else (130+90+60 = 280). Since 280 > 220, the majority did not drive alone."},

{id:"rw_ii_14",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Quantitative)",type:"mc",
passage:"A researcher studying exercise and sleep quality surveyed 400 adults. Those who exercised 3 or more days per week: 68% reported good sleep quality, 32% reported poor sleep quality. Those who exercised fewer than 3 days per week: 41% reported good sleep quality, 59% reported poor sleep quality. The researcher claims that frequent exercise is associated with better sleep.",
stem:"Which choice best uses the data to support the researcher's claim?",
choices:["32% of frequent exercisers reported poor sleep quality.","68% of frequent exercisers reported good sleep quality, compared to only 41% of infrequent exercisers.","59% of infrequent exercisers reported poor sleep quality.","The survey included 400 adults total."],
answer:1,
explanation:"To support the claim that frequent exercise links to better sleep, the relevant comparison is good-sleep rates: 68% (frequent) vs. 41% (infrequent). That direct comparison supports the claim."},

{id:"rw_ii_18",section:"rw",domain:"Information and Ideas",skill:"Command of Evidence (Quantitative)",type:"mc",
passage:"A city tracked library card registrations from 2018 to 2022: 2018: 12,400 cards, 2019: 13,100 cards, 2020: 11,200 cards, 2021: 14,800 cards, 2022: 16,500 cards. A librarian claims that library card registrations in 2022 were at their highest point in this five-year period.",
stem:"Which choice best uses the data to support the librarian's claim?",
choices:["Library registrations fell sharply in 2020.","Registrations rose each year from 2021 to 2022.","The 2022 total of 16,500 exceeds every other year in the dataset.","2021 had the second-highest registration count."],
answer:2,
explanation:"'Highest in the five-year period' is most directly supported by showing 2022's number (16,500) is greater than every other year listed — a direct comparison to all data points."},

/* ═══════════════════════════════════════════
   CRAFT & STRUCTURE
═══════════════════════════════════════════ */

// ── Words in Context ─────────────────────────────────────────

{id:"rw_cs_01",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"Marine biologist Dr. Lena Ruiz was known among her colleagues for her _____ approach: rather than relying on a single method, she combined satellite tracking, genetic sampling, and direct observation to study whale migration.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["narrow","comprehensive","hesitant","secretive"],
answer:1,
explanation:"The clue is that she 'combined' multiple methods rather than relying on one. 'Comprehensive' means covering all or many parts, which fits. 'Narrow' is the opposite; 'hesitant' and 'secretive' are unsupported."},

{id:"rw_cs_02",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"The novel's plot is anything but _____; subplots branch off in unexpected directions, timelines fold back on themselves, and minor characters reappear with surprising importance.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["complicated","engaging","straightforward","memorable"],
answer:2,
explanation:"'Anything but' signals the opposite of what the details describe. The details (branching subplots, folding timelines) show complexity, so the blank must be a contrast: 'straightforward.'"},

{id:"rw_cs_05",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"Although the committee expected fierce debate, the proposal met with near-universal approval; even members who usually _____ found nothing to object to.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["agreed","dissented","abstained","presided"],
answer:1,
explanation:"'Even members who usually ___ found nothing to object to' implies these members normally disagree. 'Dissented' means to disagree, which fits the contrast with near-universal approval."},

{id:"rw_cs_07",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"The senator's speech was praised for its _____: in just five minutes she conveyed an argument that others took an hour to make.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["volume","concision","repetition","ambiguity"],
answer:1,
explanation:"Saying much in little time describes concision (expressing something clearly in few words). The detail 'in just five minutes' supports this."},

{id:"rw_cs_10",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"Critics initially dismissed the artist's work as _____, but decades later museums competed to display the very paintings that had once been ignored.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["inconsequential","celebrated","expensive","ancient"],
answer:0,
explanation:"The contrast is between early dismissal and later acclaim. 'Inconsequential' (unimportant) matches 'dismissed,' setting up the reversal that museums later competed for the work."},

{id:"rw_cs_11",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"The engineer described the new bridge design as _____, noting that it incorporated load-bearing innovations not attempted in any previous construction.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["derivative","conventional","precedent-setting","impractical"],
answer:2,
explanation:"'Innovations not attempted in any previous construction' means the design broke new ground — 'precedent-setting' captures that exactly. 'Derivative' and 'conventional' are opposites; 'impractical' is unsupported."},

{id:"rw_cs_14",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"Despite publishing dozens of articles, the professor remained _____ within her field, known only to a small circle of specialists who followed her highly technical work.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["prominent","prolific","obscure","influential"],
answer:2,
explanation:"'Known only to a small circle' signals limited recognition. 'Obscure' means unknown to most people, fitting the contrast with her output. 'Prominent' and 'influential' contradict the passage; 'prolific' means productive, which is already established."},

{id:"rw_cs_17",section:"rw",domain:"Craft and Structure",skill:"Words in Context",type:"mc",
passage:"The CEO's remarks were intentionally _____, avoiding any firm commitment so that she could adjust strategy depending on how the market developed.",
stem:"Which choice completes the text with the most logical and precise word or phrase?",
choices:["decisive","transparent","vague","succinct"],
answer:2,
explanation:"Avoiding firm commitment so as to stay flexible describes speech that is 'vague.' 'Decisive' and 'transparent' are opposites; 'succinct' relates to brevity, not intentional non-commitment."},

// ── Text Structure and Purpose ───────────────────────────────

{id:"rw_cs_03",section:"rw",domain:"Craft and Structure",skill:"Text Structure and Purpose",type:"mc",
passage:"Many people assume that bats are blind. In fact, all bat species can see, and some have vision as sharp as a human's. What sets bats apart is not an absence of sight but an additional sense: echolocation, which lets them navigate in total darkness.",
stem:"Which choice best describes the main purpose of the text?",
choices:["To argue that bats see better than humans do","To correct a common misconception about bats","To explain how echolocation evolved in bats","To compare different species of bats"],
answer:1,
explanation:"The text opens with a common assumption ('bats are blind') and then refutes it ('In fact, all bat species can see'). Its purpose is to correct a misconception."},

{id:"rw_cs_04",section:"rw",domain:"Craft and Structure",skill:"Text Structure and Purpose",type:"mc",
passage:"The first paragraph of the report lists the symptoms patients described. The second explains the biological cause behind those symptoms. The third proposes a treatment.",
stem:"Which choice best describes the overall structure of the report as summarized?",
choices:["It moves from a problem to its cause to a solution.","It presents two opposing viewpoints and a compromise.","It lists events in the order they happened over time.","It defines a term and then gives several examples."],
answer:0,
explanation:"Symptoms (the problem) → biological cause → proposed treatment (the solution). This is a problem-cause-solution structure."},

{id:"rw_cs_08",section:"rw",domain:"Craft and Structure",skill:"Text Structure and Purpose",type:"mc",
passage:"\"I had walked that trail a hundred times,\" the hiker wrote, \"but that morning, with frost outlining every leaf and my breath hanging in the air, it was as if I were seeing it for the first time.\"",
stem:"Which choice best states the function of the detail about frost and breath in the text?",
choices:["It explains why the hiker chose the trail.","It provides sensory detail that conveys the trail's transformed appearance.","It argues that the trail is dangerous in winter.","It compares two different trails."],
answer:1,
explanation:"The frost and visible breath are concrete sensory details that show how familiar surroundings looked new, supporting 'seeing it for the first time.'"},

{id:"rw_cs_12",section:"rw",domain:"Craft and Structure",skill:"Text Structure and Purpose",type:"mc",
passage:"The essay opens with a striking statistic about food waste. It then describes the causes of waste at each stage of the supply chain. It concludes by proposing policy changes that could reduce waste at the source.",
stem:"Which choice best describes the overall structure of the essay as summarized?",
choices:["It challenges a widely held belief and then defends that belief.","It introduces a problem, traces its origins, and recommends solutions.","It defines a term and provides contrasting examples.","It presents two scientists' views and evaluates their methods."],
answer:1,
explanation:"The structure moves from problem (food waste statistic) → causes (supply chain stages) → solutions (policy changes). This is a classic problem-cause-solution arc."},

{id:"rw_cs_15",section:"rw",domain:"Craft and Structure",skill:"Text Structure and Purpose",type:"mc",
passage:"Urban gardens have appeared in cities across the world, transforming vacant lots and rooftops into productive green spaces. Proponents note the gardens' environmental benefits, including reduced urban heat and improved air quality. Critics, however, argue that the land could be used more efficiently for housing in space-constrained cities.",
stem:"Which choice best describes the overall structure of the text?",
choices:["It defines urban gardens and then provides step-by-step instructions for starting one.","It presents a trend, describes a benefit of that trend, and then introduces a counterargument.","It argues that urban gardens cause more harm than good.","It compares the environmental records of two different cities."],
answer:1,
explanation:"The passage introduces urban gardens (trend), notes environmental benefits (support), then presents critics' housing argument (counterargument). That three-part structure — trend, benefit, counterargument — matches choice B."},

// ── Cross-Text Connections ───────────────────────────────────

{id:"rw_cs_06",section:"rw",domain:"Craft and Structure",skill:"Cross-Text Connections",type:"mc",
passage:"Text 1: Economist Hark argues that remote work lowers company costs because firms can reduce expensive office space.\n\nText 2: Economist Vance counters that those savings are often offset by new spending on home-office stipends, cybersecurity, and the productivity losses of harder collaboration.",
stem:"Based on the texts, how would Vance (Text 2) most likely respond to the claim made in Text 1?",
choices:["By agreeing that office space is a firm's largest expense","By arguing that the cost savings may be cancelled out by other expenses","By denying that remote work has any effect on company costs","By suggesting that companies should expand their office space"],
answer:1,
explanation:"Vance does not deny savings exist; he argues they are 'offset' by new costs. The best paraphrase is that the savings may be cancelled out by other expenses."},

{id:"rw_cs_09",section:"rw",domain:"Craft and Structure",skill:"Cross-Text Connections",type:"mc",
passage:"Text 1: Historian Park claims the invention of the printing press was the single most important driver of rising literacy in Europe.\n\nText 2: Historian Owens notes that literacy rose fastest in regions that also passed laws requiring schooling, regardless of how many printing presses operated there.",
stem:"Based on the texts, Owens's argument suggests that Park's claim is",
choices:["entirely correct","incomplete, because other factors also drove literacy","irrelevant to the history of literacy","impossible to evaluate with evidence"],
answer:1,
explanation:"Owens points to schooling laws as another factor, implying the press alone does not fully explain rising literacy. This makes Park's single-cause claim incomplete, not wrong."},

{id:"rw_cs_13",section:"rw",domain:"Craft and Structure",skill:"Cross-Text Connections",type:"mc",
passage:"Text 1: Nutritionist Ahern argues that intermittent fasting is the most effective dietary intervention for weight management because it reduces overall caloric intake without requiring calorie counting.\n\nText 2: Nutritionist Bello contends that intermittent fasting shows no meaningful advantage over a standard calorie-restricted diet when total caloric intake is equalized between groups.",
stem:"Based on the texts, how would Bello most likely respond to Ahern's argument?",
choices:["By agreeing that reducing caloric intake is the key mechanism","By arguing that fasting's apparent benefits disappear when total calories are controlled","By claiming that calorie counting is always necessary for weight loss","By suggesting that fasting leads to greater weight gain than other diets"],
answer:1,
explanation:"Bello's argument is that when total calories are equalized, intermittent fasting has no advantage — implying the benefit Ahern describes comes from calorie reduction, not fasting itself."},

{id:"rw_cs_16",section:"rw",domain:"Craft and Structure",skill:"Cross-Text Connections",type:"mc",
passage:"Text 1: Ecologist Mora argues that rainforest deforestation is primarily driven by agricultural expansion, citing data showing that over 70% of cleared land is converted to pasture or cropland.\n\nText 2: Policy researcher Shin notes that in regions where land tenure is unclear, small-scale illegal logging — not large agriculture — accounts for the majority of forest loss.",
stem:"Shin's findings, if accurate, most directly suggest that Mora's claim is",
choices:["supported by Shin's focus on illegal logging","incomplete because it does not account for contexts where illegal logging dominates","the result of flawed data collection methods","entirely consistent with Shin's regional data"],
answer:1,
explanation:"Mora's claim covers the primary driver globally; Shin shows regions where a different driver (illegal logging) dominates. This makes Mora's claim incomplete for those contexts — it doesn't account for all cases."},

]; // end READING_QUESTIONS
