/**
 * Latin American Spanish → Peninsular Spanish blocklist.
 *
 * Used by the validation pipeline to reject AI-generated exercises
 * that contain Latin American vocabulary instead of Castellano.
 *
 * Format: Map<blockedTerm, preferredCastellanoTerm>
 * All terms are lowercase for case-insensitive matching.
 */
export const LATAM_BLOCKLIST = new Map<string, string>([
  // ── Technology ──
  ["computadora", "ordenador"],
  ["computador", "ordenador"],
  ["laptop", "portátil"],
  ["celular", "móvil"],
  ["teléfono celular", "teléfono móvil"],

  // ── Transportation ──
  ["carro", "coche"],
  ["caro", "coche"], // common typo of carro — context-dependent, but flagged
  ["manejar", "conducir"],
  ["camioneta", "furgoneta"],
  ["autobús", "autobús"], // same in both, but "camión" means bus in Mexico
  ["camión", "autobús"], // Mexican usage for bus
  ["colectivo", "autobús"],
  ["guagua", "autobús"], // Caribbean
  ["micro", "autobús"], // Chile
  ["estacionar", "aparcar"],
  ["estacionamiento", "aparcamiento"],
  ["parquear", "aparcar"],
  ["parqueadero", "aparcamiento"],
  ["banqueta", "acera"],
  ["vereda", "acera"],
  ["cuadra", "manzana"],
  ["carnet", "carné"], // spelling variant
  ["licencia de manejar", "carné de conducir"],
  ["licencia de conducir", "carné de conducir"],

  // ── Housing & Daily Life ──
  ["departamento", "piso"],
  ["recámara", "habitación"],
  ["clóset", "armario"],
  ["closet", "armario"],
  ["ropero", "armario"],
  ["refrigerador", "frigorífico"],
  ["refrigeradora", "frigorífico"],
  ["heladera", "frigorífico"],
  ["nevera", "frigorífico"],
  ["estufa", "cocina"], // Mexican usage: estufa = stove
  ["frazada", "manta"],
  ["cobija", "manta"],
  ["regadera", "ducha"],
  ["grifo", "grifo"], // same in Spain — but "llave" = tap in LatAm
  ["llave de agua", "grifo"],
  ["lavaplatos", "lavavajillas"],
  ["mesada", "encimera"],

  // ── Clothing ──
  ["saco", "chaqueta"], // LatAm: saco = jacket
  ["chompa", "jersey"],
  ["suéter", "jersey"],
  ["sweater", "jersey"],
  ["pollera", "falda"],
  ["remera", "camiseta"],
  ["playera", "camiseta"],
  ["franela", "camiseta"], // Venezuela
  ["polera", "camiseta"], // Chile
  ["zapatillas", "deportivas"],
  ["tenis", "zapatillas de deporte"],
  ["lentes", "gafas"],
  ["anteojos", "gafas"],
  ["cartera", "bolso"],

  // ── Food & Drink ──
  ["jugo", "zumo"],
  ["frijol", "judía"],
  ["frijoles", "judías"],
  ["poroto", "judía"], // Argentina
  ["chícharo", "guisante"],
  ["arveja", "guisante"],
  ["papa", "patata"],
  ["papas", "patatas"],
  ["papas fritas", "patatas fritas"],
  ["durazno", "melocotón"],
  ["damasco", "albaricoque"],
  ["banana", "plátano"],
  ["frutilla", "fresa"],
  ["maní", "cacahuete"],
  ["cacahuate", "cacahuete"],
  ["choclo", "mazorca"],
  ["elote", "mazorca"],
  ["ejote", "judía verde"],
  ["palta", "aguacate"], // Argentina/Chile
  ["jitomate", "tomate"],
  ["mesero", "camarero"],
  ["mesera", "camarera"],
  ["mozo", "camarero"],
  ["propina", "propina"], // same, but "tip" usage differs

  // ── Communication & Office ──
  ["platicar", "charlar"],
  ["plática", "charla"],
  ["bolígrafo", "bolígrafo"], // same — but "lapicero" is LatAm
  ["lapicero", "bolígrafo"],
  ["lapicera", "bolígrafo"],
  ["folder", "carpeta"],
  ["fólder", "carpeta"],
  ["engrapadora", "grapadora"],
  ["cinta adhesiva", "celo"],
  ["timbrar", "sellar"],

  // ── Money & Shopping ──
  ["plata", "dinero"], // LatAm colloquial for money
  ["lana", "dinero"], // Mexican slang
  ["feria", "cambio"], // Mexican: loose change
  ["tienda de abarrotes", "tienda de comestibles"],
  ["almacén", "tienda"], // Argentine usage
  ["mandado", "recado"],

  // ── Verbs (LatAm preferences) ──
  ["agarrar", "coger"], // LatAm avoids "coger" due to taboo meaning
  ["tomar", "coger"], // when meaning "to take/grab"
  ["enojarse", "enfadarse"],
  ["enojar", "enfadar"],
  ["enojado", "enfadado"],
  ["enojada", "enfadada"],
  ["voltear", "girar"],
  ["rentar", "alquilar"],
  ["renta", "alquiler"],
  ["extrañar", "echar de menos"],
  ["demorar", "tardar"],
  ["pararse", "ponerse de pie"],
  ["lastimar", "hacer daño"],
  ["lastimarse", "hacerse daño"],
  ["aplicar", "solicitar"], // false friend: apply for job

  // ── Pronouns & Grammar ──
  ["ustedes", "vosotros/as"], // informal plural context
  // Note: "ustedes" IS correct in formal contexts in Spain
  // The validation pipeline should only flag "ustedes" when used informally

  // ── Interjections & Colloquial ──
  ["órale", "vale"],
  ["andale", "venga"],
  ["ándale", "venga"],
  ["sale", "vale"], // Mexican: "ok"
  ["chido", "guay"],
  ["chévere", "guay"],
  ["bacán", "guay"],
  ["buena onda", "majo/a"],
  ["padre", "genial"], // Mexican: "cool"
  ["pana", "colega"],
  ["cuate", "colega"],
  ["parcero", "colega"],

  // ── Places & Services ──
  ["alberca", "piscina"],
  ["pileta", "piscina"],
  ["cancha", "pista"], // sports court
  ["cuarto", "habitación"],
  ["recibo", "factura"], // bill/receipt
  ["boleto", "billete"], // ticket
  ["tiquete", "billete"],
  ["pasaje", "billete"], // travel ticket
]);

/**
 * Check if text contains any Latin American terms from the blocklist.
 * Returns array of found violations: { term, replacement, position }.
 */
export function checkLatamTerms(text: string): LatamViolation[] {
  const lower = text.toLowerCase();
  const violations: LatamViolation[] = [];

  for (const [blocked, replacement] of LATAM_BLOCKLIST) {
    // Word boundary check to avoid partial matches (e.g. "papa" in "papá")
    const regex = new RegExp(`\\b${escapeRegex(blocked)}\\b`, "gi");
    let match: RegExpExecArray | null = regex.exec(lower);
    while (match !== null) {
      violations.push({
        term: blocked,
        replacement,
        position: match.index,
      });
      match = regex.exec(lower);
    }
  }

  return violations;
}

export interface LatamViolation {
  term: string;
  replacement: string;
  position: number;
}

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
