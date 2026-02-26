import type {
  CEFRLevel,
  GrammarTopic,
  LevelBoundary,
} from "@/shared/types/grammar";

// ──────────────────────────────────────────────
// A1 — Breakthrough / Acceso (24 topics)
// ──────────────────────────────────────────────

const A1_TOPICS: GrammarTopic[] = [
  {
    id: "a1-01",
    level: "A1",
    order: 1,
    title: "Noun gender and number",
    description:
      "Masculine/feminine patterns (-o/-a, -e, -ión, -dad, -ista), regular plural formation (-s, -es), invariable nouns",
  },
  {
    id: "a1-02",
    level: "A1",
    order: 2,
    title: "Definite and indefinite articles",
    description:
      "el, la, los, las / un, una, unos, unas; contractions al, del; distribution rules",
  },
  {
    id: "a1-03",
    level: "A1",
    order: 3,
    title: "Subject pronouns and tú/usted distinction",
    description:
      "yo, tú, él/ella, nosotros/as, vosotros/as, ellos/as; usted/ustedes formal vs tú/vosotros informal (Spain-specific)",
  },
  {
    id: "a1-04",
    level: "A1",
    order: 4,
    title: "Present indicative: regular verbs",
    description:
      "-ar (hablar), -er (comer), -ir (vivir) full paradigms; vosotros forms (-áis, -éis, -ís)",
  },
  {
    id: "a1-05",
    level: "A1",
    order: 5,
    title: "Present indicative: core irregular verbs",
    description:
      "ser, estar, ir, tener, hacer, poder, querer, saber, decir, venir, salir, poner; stem-changing verbs (e>ie, o>ue, e>i)",
  },
  {
    id: "a1-06",
    level: "A1",
    order: 6,
    title: "Ser vs. estar",
    description:
      "ser: identity, profession, origin, time; estar: location, temporary states; adjectives changing meaning (ser listo vs estar listo)",
  },
  {
    id: "a1-07",
    level: "A1",
    order: 7,
    title: "Hay vs. estar",
    description:
      "hay + indefinite (hay un banco); estar + definite (el banco está en la calle Mayor)",
  },
  {
    id: "a1-08",
    level: "A1",
    order: 8,
    title: "Demonstratives",
    description:
      "este/ese/aquel three-way spatial deixis (Spain-specific: aquel actively used); gender/number agreement",
  },
  {
    id: "a1-09",
    level: "A1",
    order: 9,
    title: "Possessives (unstressed)",
    description: "mi, tu, su, nuestro/a, vuestro/a (Spain-specific), su",
  },
  {
    id: "a1-10",
    level: "A1",
    order: 10,
    title: "Basic adjective agreement and position",
    description:
      "Gender/number concord, default postnominal position, apocopation (buen, mal, gran)",
  },
  {
    id: "a1-11",
    level: "A1",
    order: 11,
    title: "Cardinal and ordinal numbers",
    description:
      "Cardinals 0-1000, ordinals 1st-10th, apocopation (primer, tercer)",
  },
  {
    id: "a1-12",
    level: "A1",
    order: 12,
    title: "Basic quantifiers",
    description:
      "mucho/poco/bastante/demasiado; todo + article; algo, nada, alguien, nadie, algún, ningún",
  },
  {
    id: "a1-13",
    level: "A1",
    order: 13,
    title: "Question words (interrogativos)",
    description:
      "qué, quién/quiénes, cuál/cuáles, dónde, cómo, cuándo, cuánto/a/os/as, por qué",
  },
  {
    id: "a1-14",
    level: "A1",
    order: 14,
    title: "Basic prepositions",
    description:
      "a, de, en, con, por, para, sin, entre, hasta, desde, hacia; core uses and por/para basic distinction",
  },
  {
    id: "a1-15",
    level: "A1",
    order: 15,
    title: "Negation",
    description:
      "no before verb; double negation: no...nada, no...nadie, no...nunca, no...tampoco",
  },
  {
    id: "a1-16",
    level: "A1",
    order: 16,
    title: "Estar + gerund (present progressive)",
    description:
      "Regular gerund (-ando, -iendo), irregular gerunds (leyendo, durmiendo), ongoing actions",
  },
  {
    id: "a1-17",
    level: "A1",
    order: 17,
    title: "Ir a + infinitive (near future)",
    description: "Future intention and plans",
  },
  {
    id: "a1-18",
    level: "A1",
    order: 18,
    title: "Basic verbal periphrases",
    description:
      "tener que, hay que, poder, querer, acabar de, empezar a, volver a + infinitive",
  },
  {
    id: "a1-19",
    level: "A1",
    order: 19,
    title: "Gustar-type verbs",
    description:
      "gustar, encantar, interesar, molestar, doler; OI + verb in 3rd person",
  },
  {
    id: "a1-20",
    level: "A1",
    order: 20,
    title: "Reflexive verbs (basic)",
    description:
      "llamarse, levantarse, acostarse, ducharse; reflexive pronoun placement",
  },
  {
    id: "a1-21",
    level: "A1",
    order: 21,
    title: "Imperative (affirmative tú and vosotros)",
    description:
      "Regular forms, core irregulars (ven, pon, sal, haz); vosotros imperative (-ad, -ed, -id) Spain-specific",
  },
  {
    id: "a1-22",
    level: "A1",
    order: 22,
    title: "Basic sentence structure",
    description:
      "SVO word order; declarative, interrogative, exclamative; optional inversion in questions",
  },
  {
    id: "a1-23",
    level: "A1",
    order: 23,
    title: "Basic connectors",
    description: "y/e, o/u, pero, porque, también, tampoco, entonces",
  },
  {
    id: "a1-24",
    level: "A1",
    order: 24,
    title: "Pretérito perfecto (present perfect)",
    description:
      "haber + past participle; regular and irregular participles; Spain-specific usage for 'today' timeframe",
  },
];

// ──────────────────────────────────────────────
// A2 — Waystage / Plataforma (20 topics)
// ──────────────────────────────────────────────

const A2_TOPICS: GrammarTopic[] = [
  {
    id: "a2-01",
    level: "A2",
    order: 1,
    title: "Pretérito indefinido (simple past)",
    description:
      "Regular forms (-ar, -er/-ir), vosotros forms (-asteis, -isteis), key irregulars, temporal markers",
  },
  {
    id: "a2-02",
    level: "A2",
    order: 2,
    title: "Pretérito perfecto vs. pretérito indefinido",
    description:
      "Spain-specific contrast: perfecto = open time period, indefinido = closed time period",
  },
  {
    id: "a2-03",
    level: "A2",
    order: 3,
    title: "Pretérito imperfecto (imperfect)",
    description:
      "Regular forms (-aba, -ía), three irregulars (ser, ir, ver); habitual past, descriptions, background actions",
  },
  {
    id: "a2-04",
    level: "A2",
    order: 4,
    title: "Combining past tenses",
    description:
      "Imperfecto (setting) + indefinido (event); habitual vs one-time; three-way contrast with perfecto",
  },
  {
    id: "a2-05",
    level: "A2",
    order: 5,
    title: "Future simple (futuro simple)",
    description:
      "Regular formation (infinitive + endings), vosotros form (-éis), irregular stems; predictions, promises, plans",
  },
  {
    id: "a2-06",
    level: "A2",
    order: 6,
    title: "Conditional simple (condicional simple)",
    description:
      "Formation (infinitive + -ía endings), same irregular stems as future; polite requests, wishes, advice",
  },
  {
    id: "a2-07",
    level: "A2",
    order: 7,
    title: "Direct and indirect object pronouns",
    description:
      "OD: me, te, lo/la, nos, os, los/las; OI: me, te, le, nos, os, les; leísmo de persona (Spain-specific)",
  },
  {
    id: "a2-08",
    level: "A2",
    order: 8,
    title: "Combining OD + OI pronouns",
    description:
      "Order: OI + OD; se lo/se la replacement; enclitic combinations (dámelo, díselo)",
  },
  {
    id: "a2-09",
    level: "A2",
    order: 9,
    title: "Imperative: negative forms",
    description:
      "Negative imperative uses subjunctive forms; vosotros negative imperative (Spain-specific); pronoun placement",
  },
  {
    id: "a2-10",
    level: "A2",
    order: 10,
    title: "Imperative: usted/ustedes",
    description:
      "Uses subjunctive forms; irregulars follow subjunctive patterns",
  },
  {
    id: "a2-11",
    level: "A2",
    order: 11,
    title: "Possessives (stressed / tonic)",
    description:
      "mío/a, tuyo/a, suyo/a, nuestro/a, vuestro/a (Spain-specific); postnominal and with article",
  },
  {
    id: "a2-12",
    level: "A2",
    order: 12,
    title: "Comparatives and superlatives",
    description:
      "más/menos...que, tan...como, tanto...como; irregular comparatives (mejor, peor); -ísimo/a",
  },
  {
    id: "a2-13",
    level: "A2",
    order: 13,
    title: "Relative pronoun que",
    description:
      'Restrictive relative clauses; prepositional: "La persona con la que hablé"',
  },
  {
    id: "a2-14",
    level: "A2",
    order: 14,
    title: "Preposition refinement",
    description:
      "por vs para expanded (cause vs purpose, duration vs deadline); verbs with fixed prepositions",
  },
  {
    id: "a2-15",
    level: "A2",
    order: 15,
    title: "Adverbs of manner, time, frequency",
    description:
      "Formation with -mente; ya, todavía, aún, siempre, nunca, a veces, a menudo",
  },
  {
    id: "a2-16",
    level: "A2",
    order: 16,
    title: "Conditional sentences type 1 (real/possible)",
    description: "si + presente indicativo + presente/futuro/imperativo",
  },
  {
    id: "a2-17",
    level: "A2",
    order: 17,
    title: "Basic uses of the subjunctive (introduction)",
    description:
      "Present subjunctive formation, key irregulars, vosotros forms; limited to querer/esperar/es necesario que",
  },
  {
    id: "a2-18",
    level: "A2",
    order: 18,
    title: "Estar + participle (resultative states)",
    description:
      "La puerta está abierta, estoy cansado; distinction from passive",
  },
  {
    id: "a2-19",
    level: "A2",
    order: 19,
    title: "Impersonal constructions",
    description:
      "se + 3rd person (se habla español); hay que, es necesario, es posible",
  },
  {
    id: "a2-20",
    level: "A2",
    order: 20,
    title: "Connectors (expanded)",
    description:
      "Cause: porque, como; contrast: pero, sin embargo, aunque + indicative; consequence: por eso, así que; time: cuando, mientras",
  },
];

// ──────────────────────────────────────────────
// B1 — Threshold / Umbral (19 topics)
// ──────────────────────────────────────────────

const B1_TOPICS: GrammarTopic[] = [
  {
    id: "b1-01",
    level: "B1",
    order: 1,
    title: "Present subjunctive: systematic treatment",
    description:
      "Complete conjugation including vosotros; irregular stems; stem-changing patterns",
  },
  {
    id: "b1-02",
    level: "B1",
    order: 2,
    title: "Subjunctive in noun clauses",
    description:
      "Desire/will, emotion/reaction, doubt/denial, impersonal expressions; indicative vs subjunctive contrast",
  },
  {
    id: "b1-03",
    level: "B1",
    order: 3,
    title: "Subjunctive in relative clauses",
    description:
      'Indefinite/unknown antecedent: "Busco un piso que tenga terraza"; negative antecedent',
  },
  {
    id: "b1-04",
    level: "B1",
    order: 4,
    title: "Subjunctive in adverbial clauses",
    description:
      "Purpose (para que), time with future reference (cuando + subjuntivo), concession (aunque + mood contrast)",
  },
  {
    id: "b1-05",
    level: "B1",
    order: 5,
    title: "Ojalá (que) + subjunctive",
    description:
      "Present subjunctive for achievable wish; imperfect subjunctive preview for unrealizable wish",
  },
  {
    id: "b1-06",
    level: "B1",
    order: 6,
    title: "Conditional sentences type 2 (unreal present/future)",
    description:
      "si + pretérito imperfecto de subjuntivo + condicional simple; both -ra and -se forms (Spain-specific)",
  },
  {
    id: "b1-07",
    level: "B1",
    order: 7,
    title: "Pretérito imperfecto de subjuntivo",
    description:
      "Formation from 3rd person plural indefinido stem + -ra/-se; uses beyond conditionals: past desire, past emotion, polite requests",
  },
  {
    id: "b1-08",
    level: "B1",
    order: 8,
    title: "Pretérito pluscuamperfecto de indicativo",
    description:
      'había + past participle; anteriority in past: "Cuando llegué, ya se había ido"',
  },
  {
    id: "b1-09",
    level: "B1",
    order: 9,
    title: "Futuro perfecto (future perfect)",
    description:
      "habré + past participle; anteriority to future; probability in past (Spain-specific emphasis)",
  },
  {
    id: "b1-10",
    level: "B1",
    order: 10,
    title: "Future and conditional for probability/conjecture",
    description:
      'Future: probability in present ("Serán las tres"); conditional: probability in past; productive in Peninsular Spanish',
  },
  {
    id: "b1-11",
    level: "B1",
    order: 11,
    title: "Reported speech (estilo indirecto)",
    description:
      "Tense backshifting: present>imperfect, perfecto>pluscuamperfecto, future>conditional, imperative>imperfect subjunctive",
  },
  {
    id: "b1-12",
    level: "B1",
    order: 12,
    title: "Passive voice",
    description:
      "ser + participle (periphrastic); passive reflexive (pasiva refleja); contrast between constructions",
  },
  {
    id: "b1-13",
    level: "B1",
    order: 13,
    title: "Verbal periphrases (expanded)",
    description:
      "Modal: deber/deber de/soler; aspectual: seguir/dejar de/ponerse a/llevar + gerund; resultative: llevar + participle",
  },
  {
    id: "b1-14",
    level: "B1",
    order: 14,
    title: "Expanded relative pronouns",
    description:
      "el/la/los/las que, quien/quienes, donde/cuando/como as relative adverbs, lo que",
  },
  {
    id: "b1-15",
    level: "B1",
    order: 15,
    title: "Ser and estar with adjectives (expanded)",
    description:
      "Systematic contrast: inherent quality vs state/change/result; adjectives changing meaning",
  },
  {
    id: "b1-16",
    level: "B1",
    order: 16,
    title: "Connectors and discourse markers (expanded)",
    description:
      "Cause: ya que, puesto que; concession: a pesar de que; condition: siempre que; consequence: por lo tanto",
  },
  {
    id: "b1-17",
    level: "B1",
    order: 17,
    title: "Impersonal se vs. passive se",
    description:
      "se + 3rd singular (impersonal) vs se + 3rd singular/plural (passive); agreement patterns",
  },
  {
    id: "b1-18",
    level: "B1",
    order: 18,
    title: "Verbs of change (pseudocopulativos)",
    description:
      "ponerse, quedarse, hacerse, volverse, convertirse en, llegar a ser — each with specific usage patterns",
  },
  {
    id: "b1-19",
    level: "B1",
    order: 19,
    title: "Indicative mood: expanded uses",
    description:
      "Imperfecto of politeness, imperfecto of interrupted action, present for future certainty, narrative present",
  },
];

// ──────────────────────────────────────────────
// B2 — Vantage / Avanzado (18 topics)
// ──────────────────────────────────────────────

const B2_TOPICS: GrammarTopic[] = [
  {
    id: "b2-01",
    level: "B2",
    order: 1,
    title: "Pretérito perfecto de subjuntivo",
    description:
      'haya + past participle; subjunctive contexts for completed actions: "Espero que haya llegado bien"',
  },
  {
    id: "b2-02",
    level: "B2",
    order: 2,
    title: "Pretérito pluscuamperfecto de subjuntivo",
    description:
      'hubiera/hubiese + past participle; past unreal conditions, regrets: "Si hubiera sabido, no habría venido"',
  },
  {
    id: "b2-03",
    level: "B2",
    order: 3,
    title: "Conditional sentences type 3 (unreal past)",
    description:
      "si + pluscuamperfecto de subjuntivo + condicional compuesto; mixed conditionals; colloquial substitution",
  },
  {
    id: "b2-04",
    level: "B2",
    order: 4,
    title: "Condicional compuesto (conditional perfect)",
    description:
      "habría + past participle; past probability; unfulfilled past actions",
  },
  {
    id: "b2-05",
    level: "B2",
    order: 5,
    title: "Complete subjunctive system — consolidation",
    description:
      "Four subjunctive tenses in full paradigm; temporal concordance (consecutio temporum)",
  },
  {
    id: "b2-06",
    level: "B2",
    order: 6,
    title: "Subjunctive in concessive clauses (advanced)",
    description:
      "aunque + subjunctive (hypothetical); por mucho/más/muy que; a pesar de que mood contrast; aun cuando",
  },
  {
    id: "b2-07",
    level: "B2",
    order: 7,
    title: "Subjunctive in adverbial clauses (advanced)",
    description:
      "Temporal, manner, condition (a condición de que), exception (a no ser que), negative condition with como",
  },
  {
    id: "b2-08",
    level: "B2",
    order: 8,
    title: "Indicative vs. subjunctive: nuanced contrasts",
    description:
      "Communication verbs (reporting vs ordering), negation effect, perception verbs, same-subject infinitive",
  },
  {
    id: "b2-09",
    level: "B2",
    order: 9,
    title: "Advanced relative clauses",
    description:
      "el cual/la cual (formal), cuyo/a/os/as (possessive relative), lo que/lo cual, non-restrictive clauses",
  },
  {
    id: "b2-10",
    level: "B2",
    order: 10,
    title: "Clitic pronoun sequences and advanced placement",
    description:
      "Full hierarchy, redundant OI, OD topicalization, dative of interest, involuntary events with se",
  },
  {
    id: "b2-11",
    level: "B2",
    order: 11,
    title: "Passive voice (advanced)",
    description:
      "Full passive with agent, resultative estar + participle, passive reflexive constraints, register-based choice",
  },
  {
    id: "b2-12",
    level: "B2",
    order: 12,
    title: "Reported speech (advanced)",
    description:
      "Complex backshifting with subjunctive, reporting questions/suggestions, maintaining vs shifting tenses",
  },
  {
    id: "b2-13",
    level: "B2",
    order: 13,
    title: "Verbal periphrases (expanded)",
    description:
      "ir/venir/andar + gerund, tener + participle, quedar + participle, dar por + participle, llevar sin + infinitive",
  },
  {
    id: "b2-14",
    level: "B2",
    order: 14,
    title: "Advanced connector usage",
    description:
      "Formal cause/consequence/purpose/concession connectors; de + infinitive conditions; reformulation markers",
  },
  {
    id: "b2-15",
    level: "B2",
    order: 15,
    title: "Ser and estar: advanced and borderline cases",
    description:
      "Moral judgments with estar, episodic vs characterizing, recategorization, fixed expressions",
  },
  {
    id: "b2-16",
    level: "B2",
    order: 16,
    title: "Nominalization and word formation",
    description:
      "Infinitive as noun, lo + adjective, suffixes (-ción, -miento), diminutives/augmentatives with register",
  },
  {
    id: "b2-17",
    level: "B2",
    order: 17,
    title: "Advanced question structures",
    description:
      "qué vs cuál distinction, indirect questions, rhetorical questions, echo questions",
  },
  {
    id: "b2-18",
    level: "B2",
    order: 18,
    title: "Advanced negation",
    description:
      "ni...ni, ni siquiera, expletive no (hasta que no), negative polarity items",
  },
];

// ──────────────────────────────────────────────
// C1 — Effective Operational Proficiency (15 topics)
// ──────────────────────────────────────────────

const C1_TOPICS: GrammarTopic[] = [
  {
    id: "c1-01",
    level: "C1",
    order: 1,
    title: "Subjunctive future and future perfect",
    description:
      "Restricted to legal/admin/literary registers; fixed expressions (sea como fuere); recognition essential, production in formal writing only",
  },
  {
    id: "c1-02",
    level: "C1",
    order: 2,
    title: "Pretérito anterior (hubo + participle)",
    description:
      "Almost extinct in spoken Spanish; literary/formal narrative; recognition-level knowledge",
  },
  {
    id: "c1-03",
    level: "C1",
    order: 3,
    title: "Advanced subjunctive uses",
    description:
      "Causals with negation, superlative relatives, indefinite pronouns (quienquiera), como si, independent subjunctive, exclamative with quién",
  },
  {
    id: "c1-04",
    level: "C1",
    order: 4,
    title: "Indicative/subjunctive alternation — subtle shifts",
    description:
      "Semantic consequences of mood choice: empathy, emphasis, denial; perception and communication verbs; siento que contrast",
  },
  {
    id: "c1-05",
    level: "C1",
    order: 5,
    title: "Complex conditional structures",
    description:
      "De + infinitive, gerund as condition, imperative as condition, como + subjunctive threat, suspended conditionals",
  },
  {
    id: "c1-06",
    level: "C1",
    order: 6,
    title: "Topicalization and emphatic structures",
    description:
      "Left/right dislocation, cleft sentences, focus with menudo/vaya, subject inversion for focus",
  },
  {
    id: "c1-07",
    level: "C1",
    order: 7,
    title: "Advanced verbal periphrases",
    description:
      "tener/llevar/dejar + participle, venir a + infinitive (approximative), imminence (estar para/al + infinitive)",
  },
  {
    id: "c1-08",
    level: "C1",
    order: 8,
    title: "Discourse markers and connectors (C1 level)",
    description:
      "Structuring, reformulation, exemplification, argumentation, conclusion markers; oral contact markers",
  },
  {
    id: "c1-09",
    level: "C1",
    order: 9,
    title: "Register and style variation",
    description:
      "Formal vs informal register markers in grammar; passive voice as formality; usted in business/academic",
  },
  {
    id: "c1-10",
    level: "C1",
    order: 10,
    title: "Noun phrase complexity",
    description:
      "Multiple modifiers, restrictive/non-restrictive apposition, nominalized adjectives, partitive structures, ad sensum agreement",
  },
  {
    id: "c1-11",
    level: "C1",
    order: 11,
    title: "Advanced prepositional usage",
    description:
      "Personal a expanded, al + infinitive, de (causal/material/superlative), por/para in all contexts, prepositional regime",
  },
  {
    id: "c1-12",
    level: "C1",
    order: 12,
    title: "Gerund: advanced uses and restrictions",
    description:
      "Temporal, modal, causal, predicative uses; restriction: gerund cannot modify nouns as adjective",
  },
  {
    id: "c1-13",
    level: "C1",
    order: 13,
    title: "Infinitive: advanced constructions",
    description:
      "al + infinitive (temporal), de + infinitive (conditional), con + infinitive (concessive), perfect infinitive",
  },
  {
    id: "c1-14",
    level: "C1",
    order: 14,
    title: "Se constructions: complete system",
    description:
      "Reflexive, reciprocal, middle voice, impersonal, passive reflexive, dative of interest, aspectual, ethic dative",
  },
  {
    id: "c1-15",
    level: "C1",
    order: 15,
    title: "Advanced agreement patterns",
    description:
      "Collective noun agreement, inclusive person, copular inversion, relative clause agreement",
  },
];

// ──────────────────────────────────────────────
// C2 — Mastery / Maestría (15 topics)
// ──────────────────────────────────────────────

const C2_TOPICS: GrammarTopic[] = [
  {
    id: "c2-01",
    level: "C2",
    order: 1,
    title: "Complete mastery of the subjunctive system",
    description:
      "All tenses productive, nuanced mood selection with every verb type, metalinguistic awareness",
  },
  {
    id: "c2-02",
    level: "C2",
    order: 2,
    title: "Stylistic and literary grammar",
    description:
      "Historical present, imperfect with future in narrative, journalistic imperfect, future of surprise, emphatic future",
  },
  {
    id: "c2-03",
    level: "C2",
    order: 3,
    title: "Advanced conditional structures",
    description:
      "Implicit condition, conditional perfect for past conjecture, multiple layers, periodistic conditional",
  },
  {
    id: "c2-04",
    level: "C2",
    order: 4,
    title: "Cleft and pseudo-cleft constructions",
    description:
      "Lo que pasa es que..., fue...donde/cuando/como/quien, es por eso por lo que..., focus/rheme manipulation",
  },
  {
    id: "c2-05",
    level: "C2",
    order: 5,
    title: "Advanced relative constructions",
    description:
      "Free relatives, generalized relatives (sea quien sea), cuyo natural production, complex prepositional, consecutive relatives",
  },
  {
    id: "c2-06",
    level: "C2",
    order: 6,
    title: "Absolute constructions",
    description:
      "Participial absolute (terminada la reunión), temporal value (una vez resuelta), concessive value",
  },
  {
    id: "c2-07",
    level: "C2",
    order: 7,
    title: "Advanced word order for pragmatic effect",
    description:
      "V-S for new information, fronting for contrast, right-dislocation, obligatory inversion in citation",
  },
  {
    id: "c2-08",
    level: "C2",
    order: 8,
    title: "Superlative and intensification (advanced)",
    description:
      "Irregular absolutes (óptimo, pésimo), cultured forms (-érrimo), prefix intensifiers, emphatic repetition, evaluative ironic structures",
  },
  {
    id: "c2-09",
    level: "C2",
    order: 9,
    title: "Advanced copular and pseudo-copular patterns",
    description:
      "ser distributive/existential, estar para/por, pseudo-copulars (mantenerse, mostrarse, resultar), recategorization",
  },
  {
    id: "c2-10",
    level: "C2",
    order: 10,
    title: "Complete prepositional system mastery",
    description:
      "All subtle distinctions, archaic forms (cabe, so), complex prepositional phrases, comprehensive verb regime",
  },
  {
    id: "c2-11",
    level: "C2",
    order: 11,
    title: "Discourse coherence and cohesion",
    description:
      "Anaphoric/cataphoric reference, ellipsis strategies, thematic progression, connector chains, metadiscursive commentary",
  },
  {
    id: "c2-12",
    level: "C2",
    order: 12,
    title: "Punctuation-grammar interface",
    description:
      "Comma and meaning (restrictive vs non-restrictive), semicolon in complex sentences, dash for emphasis",
  },
  {
    id: "c2-13",
    level: "C2",
    order: 13,
    title: "Colloquial grammar of Peninsular Spanish",
    description:
      "Ethic dative, emphatic que, pues as filler, pragmatic diminutives, tío/tía, colloquial verbs (molar, flipar)",
  },
  {
    id: "c2-14",
    level: "C2",
    order: 14,
    title: "Queísmo and dequeísmo",
    description:
      "Queísmo: omission of required de; dequeísmo: insertion of unneeded de; diagnostic test with eso substitution",
  },
  {
    id: "c2-15",
    level: "C2",
    order: 15,
    title: "Advanced impersonal and passive constructions",
    description:
      "Impersonal se with personal a, double interpretation avoidance, impersonal haber/hacer",
  },
];

// ──────────────────────────────────────────────
// Aggregated exports
// ──────────────────────────────────────────────

/** All 111 grammar topics, ordered by level then position */
export const ALL_TOPICS: GrammarTopic[] = [
  ...A1_TOPICS,
  ...A2_TOPICS,
  ...B1_TOPICS,
  ...B2_TOPICS,
  ...C1_TOPICS,
  ...C2_TOPICS,
];

/** Topics grouped by CEFR level */
export const TOPICS_BY_LEVEL: Record<CEFRLevel, GrammarTopic[]> = {
  A1: A1_TOPICS,
  A2: A2_TOPICS,
  B1: B1_TOPICS,
  B2: B2_TOPICS,
  C1: C1_TOPICS,
  C2: C2_TOPICS,
};

/** Total topic count per level */
export const TOPIC_COUNT_BY_LEVEL: Record<CEFRLevel, number> = {
  A1: A1_TOPICS.length,
  A2: A2_TOPICS.length,
  B1: B1_TOPICS.length,
  B2: B2_TOPICS.length,
  C1: C1_TOPICS.length,
  C2: C2_TOPICS.length,
};

/** Fast lookup: topicId → GrammarTopic */
export const TOPIC_BY_ID: Map<string, GrammarTopic> = new Map(
  ALL_TOPICS.map((t) => [t.id, t]),
);

/**
 * Gateway topics per level boundary — used by the adaptive algorithm
 * to probe the most uncertain boundary between adjacent CEFR levels.
 *
 * Each boundary maps to topic IDs that best discriminate between the two levels.
 */
export const GATEWAY_TOPICS: Record<LevelBoundary, string[]> = {
  "A1/A2": ["a2-01", "a2-03"], // Pretérito indefinido + imperfecto
  "A2/B1": ["b1-02", "b1-04"], // Subjunctive in noun clauses + adverbial clauses
  "B1/B2": ["b2-02", "b2-09"], // Pluscuamperfecto de subjuntivo + advanced relative clauses
  "B2/C1": ["c1-06", "c1-14", "c1-01"], // Topicalization + complete se system + futuro de subjuntivo
  "C1/C2": ["c2-02", "c2-14"], // Stylistic grammar + queísmo/dequeísmo
};

/**
 * Floor-test topics for complete beginners (θ ≈ -2.0).
 * If a student fails these, they are firmly A1.
 */
export const PRE_A1_GATEWAY: string[] = ["a1-01", "a1-04"]; // Noun gender + present regular verbs
