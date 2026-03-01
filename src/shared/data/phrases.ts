/**
 * Spanish idioms and phrases from Spain (Castellano).
 * Used for the "Phrase of the Day" gamification feature.
 */

export interface SpanishPhrase {
  phrase: string;
  translation: string;
  literal?: string;
  example?: string;
}

const PHRASES: SpanishPhrase[] = [
  // ── Common expressions ──
  {
    phrase: "No hay mal que por bien no venga",
    translation: "Every cloud has a silver lining",
    literal: "There is no evil that doesn't come for good",
  },
  {
    phrase: "Más vale tarde que nunca",
    translation: "Better late than never",
  },
  {
    phrase: "En boca cerrada no entran moscas",
    translation: "Silence is golden",
    literal: "Flies don't enter a closed mouth",
  },
  {
    phrase: "Quien mucho abarca, poco aprieta",
    translation: "Jack of all trades, master of none",
    literal: "He who grasps much, squeezes little",
  },
  {
    phrase: "A buen entendedor, pocas palabras bastan",
    translation: "A word to the wise is enough",
    literal: "For a good listener, few words suffice",
  },
  {
    phrase: "No es oro todo lo que reluce",
    translation: "All that glitters is not gold",
  },
  {
    phrase: "Dime con quién andas y te diré quién eres",
    translation: "Tell me who your friends are, and I'll tell you who you are",
    literal: "Tell me who you walk with and I'll tell you who you are",
  },
  {
    phrase: "Al mal tiempo, buena cara",
    translation: "Keep your chin up in hard times",
    literal: "In bad weather, a good face",
  },
  {
    phrase: "Más vale prevenir que curar",
    translation: "Prevention is better than cure",
  },
  {
    phrase: "El que no arriesga, no gana",
    translation: "Nothing ventured, nothing gained",
    literal: "He who doesn't risk, doesn't win",
  },
  // ── Food & drink ──
  {
    phrase: "Estar como una cabra",
    translation: "To be crazy",
    literal: "To be like a goat",
    example: "Mi vecino está como una cabra.",
  },
  {
    phrase: "Dar en el clavo",
    translation: "To hit the nail on the head",
    literal: "To hit the nail",
  },
  {
    phrase: "Ser pan comido",
    translation: "To be a piece of cake",
    literal: "To be eaten bread",
    example: "El examen fue pan comido.",
  },
  {
    phrase: "Ponerse las pilas",
    translation: "To get one's act together",
    literal: "To put in the batteries",
    example: "Tengo que ponerme las pilas con el español.",
  },
  {
    phrase: "Tomar el pelo",
    translation: "To pull someone's leg",
    literal: "To take the hair",
    example: "¿Me estás tomando el pelo?",
  },
  // ── Weather & nature ──
  {
    phrase: "Llover a cántaros",
    translation: "To rain cats and dogs",
    literal: "To rain by the jugful",
  },
  {
    phrase: "Estar en las nubes",
    translation: "To have one's head in the clouds",
    literal: "To be in the clouds",
  },
  {
    phrase: "Hacer buenas migas",
    translation: "To get along well",
    literal: "To make good crumbs",
  },
  {
    phrase: "No tener pelos en la lengua",
    translation: "To not mince words",
    literal: "To not have hairs on the tongue",
  },
  {
    phrase: "Ir viento en popa",
    translation: "To go very well / smoothly",
    literal: "To go wind in the stern",
  },
  // ── Animals ──
  {
    phrase: "Ser un buitre",
    translation: "To be a vulture / opportunist",
    literal: "To be a vulture",
  },
  {
    phrase: "Tener la mosca detrás de la oreja",
    translation: "To be suspicious",
    literal: "To have the fly behind the ear",
  },
  {
    phrase: "A caballo regalado no le mires el diente",
    translation: "Don't look a gift horse in the mouth",
  },
  {
    phrase: "Matar dos pájaros de un tiro",
    translation: "To kill two birds with one stone",
    literal: "To kill two birds with one shot",
  },
  {
    phrase: "Llevarse como el perro y el gato",
    translation: "To fight like cats and dogs",
    literal: "To get along like the dog and the cat",
  },
  // ── Body parts ──
  {
    phrase: "Echar una mano",
    translation: "To lend a hand",
    literal: "To throw a hand",
    example: "¿Me echas una mano con esto?",
  },
  {
    phrase: "No dar pie con bola",
    translation: "To not get anything right",
    literal: "To not hit a ball with a foot",
  },
  {
    phrase: "Meter la pata",
    translation: "To put one's foot in it / mess up",
    literal: "To put the paw in",
    example: "He metido la pata con mi jefe.",
  },
  {
    phrase: "Costar un ojo de la cara",
    translation: "To cost an arm and a leg",
    literal: "To cost an eye from the face",
  },
  {
    phrase: "Tener mala leche",
    translation: "To be in a bad mood / mean-spirited",
    literal: "To have bad milk",
  },
  // ── Everyday expressions ──
  {
    phrase: "Ir al grano",
    translation: "To get to the point",
    literal: "To go to the grain",
  },
  {
    phrase: "Estar hasta las narices",
    translation: "To be fed up",
    literal: "To be up to the nostrils",
    example: "Estoy hasta las narices de esperar.",
  },
  {
    phrase: "Quedarse de piedra",
    translation: "To be stunned / speechless",
    literal: "To remain as stone",
  },
  {
    phrase: "Tirar la toalla",
    translation: "To throw in the towel / give up",
  },
  {
    phrase: "Estar de capa caída",
    translation: "To be feeling down",
    literal: "To be with fallen cape",
  },
  {
    phrase: "No pegar ojo",
    translation: "To not sleep a wink",
    literal: "To not glue an eye",
  },
  {
    phrase: "Pasarlo bomba",
    translation: "To have a blast",
    literal: "To pass it bomb",
    example: "Ayer lo pasamos bomba en la fiesta.",
  },
  {
    phrase: "Flipar en colores",
    translation: "To be amazed / blown away",
    literal: "To freak out in colors",
    example: "Cuando vi el precio, flipé en colores.",
  },
  {
    phrase: "Mola mucho",
    translation: "It's really cool (Spain slang)",
    example: "¡Tu camiseta mola mucho!",
  },
  {
    phrase: "Tener ganas de",
    translation: "To feel like / to want to",
    example: "Tengo ganas de ir a la playa.",
  },
  // ── Wisdom ──
  {
    phrase: "Del dicho al hecho hay un buen trecho",
    translation: "Easier said than done",
    literal: "From the saying to the fact, there's a long stretch",
  },
  {
    phrase: "Cada maestrillo tiene su librillo",
    translation: "Each to their own",
    literal: "Every little teacher has their little book",
  },
  {
    phrase: "A quien madruga, Dios le ayuda",
    translation: "The early bird catches the worm",
    literal: "God helps those who wake up early",
  },
  {
    phrase: "Ojos que no ven, corazón que no siente",
    translation: "Out of sight, out of mind",
    literal: "Eyes that don't see, heart that doesn't feel",
  },
  {
    phrase: "Más vale maña que fuerza",
    translation: "Brains over brawn",
    literal: "Skill is worth more than strength",
  },
  {
    phrase: "El saber no ocupa lugar",
    translation: "Knowledge takes up no space",
    literal: "Knowledge doesn't take up space",
  },
  {
    phrase: "A falta de pan, buenas son tortas",
    translation: "Half a loaf is better than none",
    literal: "In the absence of bread, cakes are good",
  },
  {
    phrase: "Quien la sigue la consigue",
    translation: "If at first you don't succeed, try again",
    literal: "He who keeps at it, gets it",
  },
  {
    phrase: "No hay que ahogarse en un vaso de agua",
    translation: "Don't make a mountain out of a molehill",
    literal: "You shouldn't drown in a glass of water",
  },
  {
    phrase: "De tal palo, tal astilla",
    translation: "Like father, like son",
    literal: "From such stick, such splinter",
  },
  // ── Spain-specific ──
  {
    phrase: "Irse de cañas",
    translation: "To go out for beers (small draught beers)",
    example: "¿Nos vamos de cañas después del trabajo?",
  },
  {
    phrase: "Ir de culo",
    translation: "To be overwhelmed / stressed out",
    literal: "To go on one's backside",
    example: "Voy de culo con el trabajo esta semana.",
  },
  {
    phrase: "Hacer pellas / hacer novillos",
    translation: "To skip class / play hooky",
    example: "De joven hacía pellas constantemente.",
  },
  {
    phrase: "Quedarse frito",
    translation: "To fall asleep instantly",
    literal: "To become fried",
    example: "Me quedé frito en el sofá.",
  },
  {
    phrase: "Estar pez",
    translation: "To know nothing about a subject",
    literal: "To be a fish",
    example: "Estoy pez en matemáticas.",
  },
  {
    phrase: "Pillar un resfriado",
    translation: "To catch a cold",
    example: "He pillado un resfriado tremendo.",
  },
  {
    phrase: "Currar mucho",
    translation: "To work a lot (informal, Spain)",
    example: "Hoy he currado un montón.",
  },
  {
    phrase: "Echar de menos",
    translation: "To miss someone or something",
    example: "Echo de menos a mi familia.",
  },
  {
    phrase: "Dar la lata",
    translation: "To be annoying / to pester",
    literal: "To give the tin can",
    example: "Deja de darme la lata.",
  },
  {
    phrase: "Quedarse en blanco",
    translation: "To go blank / to draw a blank",
    literal: "To remain in white",
    example: "Me quedé en blanco durante el examen.",
  },
];

/**
 * Get the phrase of the day — deterministic by day of year.
 * Same phrase for all users on the same day.
 */
export function getPhraseOfTheDay(date: Date = new Date()): SpanishPhrase {
  const dayOfYear = getDayOfYear(date);
  return PHRASES[dayOfYear % PHRASES.length];
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export { PHRASES };
