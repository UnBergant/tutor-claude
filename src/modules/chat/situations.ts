import type { Situation } from "./types";

/**
 * Predefined conversation scenarios for guided practice.
 *
 * Each situation provides:
 * - A system prompt addition to set the scene for Celestia
 * - A starter message (Celestia's first message in the scenario)
 * - Target vocabulary the student should encounter
 * - Minimum CEFR level (situations below student level are always shown)
 */
export const SITUATIONS: Situation[] = [
  {
    id: "free",
    title: "Free Conversation",
    description: "Talk about anything you want with Celestia",
    icon: "💬",
    systemPromptAddition: "",
    starterMessage:
      "¡Hola! ¿Qué tal? Soy Celestia. Podemos hablar de lo que quieras. ¿De qué te apetece charlar hoy?",
    targetVocabulary: [],
    minLevel: "A1",
  },
  {
    id: "restaurant",
    title: "At a Restaurant",
    description: "Order food and drinks at a Spanish tapas bar",
    icon: "🍽️",
    systemPromptAddition:
      "You are role-playing as a friendly waiter at a tapas restaurant in Madrid called 'La Tasca de Celestia'. Guide the student through ordering: greeting, asking what they'd like to drink, recommending tapas, taking the food order, and offering dessert. Use typical restaurant vocabulary: la carta, la cuenta, de primero/segundo, ¿qué va a tomar?, ¿algo más?",
    starterMessage:
      "¡Buenas tardes! Bienvenido a La Tasca de Celestia. ¿Tiene reserva o prefiere sentarse en la terraza?",
    targetVocabulary: [
      "la carta",
      "la cuenta",
      "de primero",
      "de segundo",
      "la terraza",
      "las tapas",
      "la caña",
      "el postre",
    ],
    minLevel: "A1",
  },
  {
    id: "meeting",
    title: "Meeting Someone",
    description: "Introduce yourself and make small talk",
    icon: "👋",
    systemPromptAddition:
      "You are role-playing as a friendly Spanish person the student has just met at a language exchange event in Barcelona. Start with introductions, ask about their country, what they do, why they're learning Spanish, and their hobbies. Use common small talk expressions: ¿de dónde eres?, ¿a qué te dedicas?, ¿cuánto tiempo llevas en España?, ¡qué guay!",
    starterMessage:
      "¡Hola! Me llamo Celestia. ¿Eres nuevo en el intercambio de idiomas? ¿Cómo te llamas?",
    targetVocabulary: [
      "encantado/a",
      "¿a qué te dedicas?",
      "¿de dónde eres?",
      "el intercambio",
      "las aficiones",
      "¡qué guay!",
    ],
    minLevel: "A1",
  },
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice a formal job interview in Spanish",
    icon: "💼",
    systemPromptAddition:
      "You are role-playing as an HR interviewer at a Spanish tech company in Madrid. Conduct a professional job interview: ask about their experience, skills, why they want this position, and where they see themselves in 5 years. Use formal register (usted when appropriate, though vosotros for group contexts). Key vocabulary: el puesto, la experiencia laboral, el currículum, las competencias, ¿por qué le interesa este puesto?",
    starterMessage:
      "Buenos días, gracias por venir. Siéntese, por favor. Vamos a empezar la entrevista. ¿Podría presentarse brevemente?",
    targetVocabulary: [
      "el puesto",
      "la experiencia laboral",
      "el currículum",
      "las competencias",
      "los puntos fuertes",
      "el sueldo",
    ],
    minLevel: "B1",
  },
  {
    id: "doctor",
    title: "At the Doctor",
    description: "Describe symptoms and understand medical advice",
    icon: "🏥",
    systemPromptAddition:
      "You are role-playing as a doctor at a health center (centro de salud) in Spain. The student is a patient. Ask about their symptoms, how long they've had them, any allergies, and provide advice/treatment. Use medical vocabulary: ¿qué le pasa?, ¿desde cuándo?, la receta, el medicamento, la consulta, ¿es alérgico a algo?",
    starterMessage:
      "Buenos días. Soy la doctora Celestia. Pase y siéntese. ¿Qué le ocurre? ¿Cómo se encuentra?",
    targetVocabulary: [
      "la consulta",
      "la receta",
      "el medicamento",
      "los síntomas",
      "me duele",
      "la fiebre",
    ],
    minLevel: "A2",
  },
  {
    id: "shopping",
    title: "Shopping",
    description: "Buy clothes or groceries at a Spanish shop",
    icon: "🛍️",
    systemPromptAddition:
      "You are role-playing as a friendly shop assistant at a clothing store on Gran Vía in Madrid. Help the student find what they need: ask what they're looking for, suggest sizes and colors, let them try things on, discuss prices. Key vocabulary: la talla, ¿en qué puedo ayudarle?, el probador, ¿cómo le queda?, la rebaja, ¿paga en efectivo o con tarjeta?",
    starterMessage:
      "¡Hola, buenas tardes! Bienvenido a nuestra tienda. ¿En qué puedo ayudarle? ¿Busca algo en particular?",
    targetVocabulary: [
      "la talla",
      "el probador",
      "la rebaja",
      "en efectivo",
      "con tarjeta",
      "¿cómo le queda?",
    ],
    minLevel: "A2",
  },
];
