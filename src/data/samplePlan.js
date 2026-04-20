/* ═══════════════════════════════════════════════════════
   KYŌRA — Sample Weekly Plan
   Plan pre-construido, estático, que se muestra a los
   usuarios Free/Starter en la sección "Mi Semana" para
   que conozcan el producto hands-on. CERO llamadas a la
   API — este plan nunca cambia.

   Perfil representativo:
   - Objetivo: Recomposición corporal
   - Nivel: Activo moderado
   - 2,100 kcal / 140g proteína / 230g carbos / 70g grasas
   - Cocina latinoamericana contemporánea, sin restricciones
   ═══════════════════════════════════════════════════════ */

import { localDateISO } from "@utils/date";

function mondayISO(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset);
  return localDateISO(d);
}

const DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const sampleMeals = [
  // ─── LUNES ────────────────────────────────────────
  [
    { label: "Desayuno", time: "07:30", name: "Tazón de avena dorada con frutos rojos",
      description: "Avena cremosa con canela, almendras tostadas y moras frescas.",
      calories: 420, protein: 16, carbs: 58, fats: 14,
      ingredients: ["50 g de avena en hojuelas", "250 ml de leche de almendras", "15 g de almendras fileteadas", "80 g de moras azules", "1 cda de miel", "Pizca de canela"],
      recipe: "1. Calienta la leche con la canela a fuego medio.\n2. Agrega la avena y cocina 4-5 minutos removiendo.\n3. Sirve en un tazón, decora con moras, almendras tostadas y un hilo de miel."
    },
    { label: "Snack", time: "11:00", name: "Yogur griego con granola casera",
      description: "Cremoso, con crunch de nueces y toque de cardamomo.",
      calories: 280, protein: 18, carbs: 28, fats: 10,
      ingredients: ["180 g de yogur griego natural", "25 g de granola", "1 cda de miel", "10 g de pistaches"],
      recipe: "1. Sirve el yogur en un frasco.\n2. Cubre con granola y pistaches.\n3. Termina con un hilo de miel."
    },
    { label: "Comida", time: "14:00", name: "Pechuga de pollo al limón con quinoa",
      description: "Pollo marinado en hierbas, quinoa esponjosa y verduras salteadas.",
      calories: 580, protein: 48, carbs: 52, fats: 18,
      ingredients: ["180 g de pechuga de pollo", "80 g de quinoa seca", "1 calabacita", "1 zanahoria", "1 diente de ajo", "Jugo de 1 limón", "Romero, sal y pimienta", "1 cda de aceite de oliva"],
      recipe: "1. Marina el pollo con limón, ajo, romero, sal y pimienta 15 min.\n2. Cocina la quinoa en agua con sal (15 min a fuego bajo).\n3. Asa el pollo en sartén 5 min por lado.\n4. Saltea las verduras con aceite de oliva.\n5. Sirve todo junto."
    },
    { label: "Cena", time: "20:00", name: "Salmón al horno con espárragos",
      description: "Salmón glaseado con miel y mostaza, acompañado de espárragos al grill.",
      calories: 520, protein: 42, carbs: 18, fats: 28,
      ingredients: ["150 g de salmón fresco", "200 g de espárragos", "1 cda de miel", "1 cdita de mostaza Dijon", "Jugo de 1/2 limón", "Sal, pimienta, aceite de oliva"],
      recipe: "1. Precalienta el horno a 200°C.\n2. Mezcla miel, mostaza y limón. Barniza el salmón.\n3. Acomoda salmón y espárragos en una bandeja con aceite.\n4. Hornea 14-16 minutos.\n5. Sirve con más limón al gusto."
    },
  ],
  // ─── MARTES ───────────────────────────────────────
  [
    { label: "Desayuno", time: "07:30", name: "Huevos pochados sobre aguacate",
      description: "Pan integral, aguacate cremoso, huevos perfectos y chile en hojuelas.",
      calories: 440, protein: 22, carbs: 32, fats: 24,
      ingredients: ["2 rebanadas de pan integral", "1 aguacate mediano", "2 huevos", "Chile en hojuelas", "Sal, pimienta", "Jugo de 1/2 limón"],
      recipe: "1. Tuesta el pan.\n2. Aplasta el aguacate con limón, sal y pimienta.\n3. Pocha los huevos en agua caliente con vinagre (3 min).\n4. Unta el aguacate, coloca los huevos encima.\n5. Termina con chile en hojuelas."
    },
    { label: "Snack", time: "11:00", name: "Manzana con mantequilla de almendra",
      description: "Clásico balanceado, dulce y proteico.",
      calories: 230, protein: 6, carbs: 28, fats: 12,
      ingredients: ["1 manzana verde", "2 cdas de mantequilla de almendra natural"],
      recipe: "1. Corta la manzana en gajos.\n2. Sirve con la mantequilla de almendra para dip."
    },
    { label: "Comida", time: "14:00", name: "Tazón poke de atún con arroz integral",
      description: "Atún fresco marinado, arroz, edamame, pepino y aguacate.",
      calories: 620, protein: 42, carbs: 68, fats: 22,
      ingredients: ["150 g de atún fresco", "120 g de arroz integral cocido", "60 g de edamame", "1/2 pepino", "1/2 aguacate", "2 cdas de salsa de soya baja en sodio", "1 cdita de aceite de sésamo", "Semillas de sésamo"],
      recipe: "1. Corta el atún en cubos y marina con soya y aceite de sésamo (10 min).\n2. Arma el tazón con arroz de base.\n3. Acomoda atún, edamame, pepino en rodajas y aguacate.\n4. Termina con sésamo."
    },
    { label: "Cena", time: "20:00", name: "Sopa de lentejas con espinacas",
      description: "Reconfortante, ligera, cargada de proteína vegetal y hierro.",
      calories: 380, protein: 22, carbs: 52, fats: 8,
      ingredients: ["150 g de lentejas", "80 g de espinacas frescas", "1 zanahoria", "1 rama de apio", "1/2 cebolla", "2 dientes de ajo", "1 hoja de laurel", "1 l de caldo de verduras"],
      recipe: "1. Sofríe cebolla, ajo, apio y zanahoria en una olla 5 min.\n2. Añade las lentejas, el laurel y el caldo.\n3. Cocina 30 minutos a fuego bajo.\n4. Agrega las espinacas al final, cocina 2 min más.\n5. Ajusta sal y sirve caliente."
    },
  ],
  // ─── MIÉRCOLES ────────────────────────────────────
  [
    { label: "Desayuno", time: "07:30", name: "Smoothie verde con proteína",
      description: "Espinaca, plátano, mantequilla de cacahuate y proteína en polvo.",
      calories: 380, protein: 28, carbs: 42, fats: 12,
      ingredients: ["1 plátano maduro", "1 taza de espinaca fresca", "1 cda de mantequilla de cacahuate", "1 scoop de proteína vainilla", "250 ml de leche de almendras", "Hielo"],
      recipe: "1. Agrega todos los ingredientes a la licuadora.\n2. Licua 60 segundos hasta que quede cremoso.\n3. Sirve de inmediato."
    },
    { label: "Snack", time: "11:00", name: "Hummus con crudités",
      description: "Zanahoria, apio y pepino crujientes con hummus de garbanzo.",
      calories: 220, protein: 8, carbs: 24, fats: 10,
      ingredients: ["80 g de hummus", "1 zanahoria en palitos", "2 ramas de apio", "1/2 pepino"],
      recipe: "1. Corta los vegetales en bastones.\n2. Sirve con hummus al centro para dip."
    },
    { label: "Comida", time: "14:00", name: "Tacos de pescado con ensalada de col",
      description: "Pescado blanco a la plancha en tortillas de maíz con slaw fresco.",
      calories: 540, protein: 38, carbs: 48, fats: 20,
      ingredients: ["180 g de filete de pescado blanco", "3 tortillas de maíz", "100 g de col morada rallada", "1/2 aguacate", "Cilantro fresco", "Jugo de 2 limones", "Sal, pimienta, chile en polvo"],
      recipe: "1. Sazona el pescado con sal, pimienta y chile.\n2. Cocina en sartén 3 min por lado.\n3. Mezcla la col con limón y cilantro.\n4. Calienta las tortillas.\n5. Arma los tacos con pescado, slaw y aguacate."
    },
    { label: "Cena", time: "20:00", name: "Pasta integral con pollo y brócoli",
      description: "Pasta al dente con pollo salteado, brócoli y queso parmesano.",
      calories: 560, protein: 42, carbs: 62, fats: 16,
      ingredients: ["80 g de pasta integral", "150 g de pollo en cubos", "150 g de brócoli", "2 dientes de ajo", "1 cda de aceite de oliva", "20 g de parmesano", "Sal, pimienta, hojuelas de chile"],
      recipe: "1. Cocina la pasta al dente.\n2. Saltea el ajo y el pollo en aceite 5 min.\n3. Agrega brócoli y cocina 4 min más.\n4. Mezcla con la pasta.\n5. Termina con parmesano y pimienta."
    },
  ],
  // ─── JUEVES ───────────────────────────────────────
  [
    { label: "Desayuno", time: "07:30", name: "Omelette de espinaca y queso feta",
      description: "Tres huevos batidos, espinaca salteada y feta desmoronado.",
      calories: 410, protein: 28, carbs: 8, fats: 28,
      ingredients: ["3 huevos", "50 g de espinaca fresca", "30 g de queso feta", "1 cdita de aceite de oliva", "Sal, pimienta"],
      recipe: "1. Saltea la espinaca 1 min.\n2. Bate los huevos con sal y pimienta.\n3. Vierte en el sartén caliente.\n4. Cuando cuaje la base, agrega espinaca y feta en una mitad.\n5. Dobla y sirve."
    },
    { label: "Snack", time: "11:00", name: "Pudín de chía con mango",
      description: "Preparado la noche anterior, cremoso y refrescante.",
      calories: 260, protein: 8, carbs: 32, fats: 10,
      ingredients: ["3 cdas de semillas de chía", "200 ml de leche de coco ligera", "1/2 mango en cubos", "1 cdita de miel"],
      recipe: "1. Mezcla chía, leche y miel en un frasco.\n2. Refrigera mínimo 4 horas (o toda la noche).\n3. Sirve con mango encima."
    },
    { label: "Comida", time: "14:00", name: "Bowl mediterráneo con falafel",
      description: "Falafel horneado, tabule, hummus y vegetales frescos.",
      calories: 600, protein: 24, carbs: 72, fats: 22,
      ingredients: ["120 g de falafel horneado (5-6 bolas)", "80 g de tabule", "50 g de hummus", "1 tomate", "1/2 pepino", "Aceitunas kalamata", "Aceite de oliva, jugo de limón"],
      recipe: "1. Hornea el falafel 15 min a 200°C.\n2. Arma el bowl: tabule, hummus, vegetales, falafel.\n3. Termina con aceitunas, aceite de oliva y limón."
    },
    { label: "Cena", time: "20:00", name: "Fajitas de res con pimientos",
      description: "Arrachera marinada con tres colores de pimiento y cebolla morada.",
      calories: 490, protein: 38, carbs: 38, fats: 18,
      ingredients: ["150 g de arrachera en tiras", "1 pimiento rojo", "1 pimiento amarillo", "1/2 cebolla morada", "2 tortillas de maíz", "Jugo de limón, comino, sal", "1 cdita de aceite"],
      recipe: "1. Marina la arrachera con limón, comino y sal (10 min).\n2. Cocina en sartén caliente 4 min.\n3. Retira y saltea pimientos y cebolla 5 min.\n4. Calienta las tortillas.\n5. Arma las fajitas."
    },
  ],
  // ─── VIERNES ──────────────────────────────────────
  [
    { label: "Desayuno", time: "07:30", name: "Pan francés proteico de canela",
      description: "Pan integral, huevo, canela y fruta fresca — indulgente y balanceado.",
      calories: 430, protein: 22, carbs: 48, fats: 16,
      ingredients: ["2 rebanadas de pan integral", "2 huevos", "60 ml de leche", "1/2 cdita de canela", "1 cdita de vainilla", "1 plátano", "1 cda de jarabe de maple", "Mantequilla"],
      recipe: "1. Bate huevos con leche, canela y vainilla.\n2. Sumerge el pan 10 seg por lado.\n3. Cocina en sartén con mantequilla 2 min por lado.\n4. Sirve con plátano en rodajas y maple."
    },
    { label: "Snack", time: "11:00", name: "Mix de frutos secos y fruta deshidratada",
      description: "Energía portátil para la tarde.",
      calories: 230, protein: 6, carbs: 20, fats: 14,
      ingredients: ["20 g de almendras", "15 g de nueces", "20 g de arándanos deshidratados"],
      recipe: "1. Mezcla todo en un frasco o bolsa.\n2. Porciones de 50 g por tanda."
    },
    { label: "Comida", time: "14:00", name: "Ensalada tibia de atún con papas",
      description: "Atún sellado, papas cambray, ejotes y aderezo de mostaza.",
      calories: 540, protein: 40, carbs: 44, fats: 22,
      ingredients: ["150 g de atún fresco", "200 g de papas cambray", "100 g de ejotes", "Hojas verdes mixtas", "2 cdas de aceite de oliva", "1 cdita de mostaza Dijon", "1 cda de vinagre de vino", "Sal, pimienta"],
      recipe: "1. Cuece papas y ejotes al vapor 10 min.\n2. Sella el atún 1 min por lado (que quede rojo al centro).\n3. Haz el aderezo con aceite, mostaza y vinagre.\n4. Mezcla todo tibio sobre las hojas.\n5. Rebana el atún y coloca encima."
    },
    { label: "Cena", time: "20:00", name: "Tacos de camarón al chipotle",
      description: "Camarones marinados, salsa chipotle cremosa y tortillas calientes.",
      calories: 470, protein: 34, carbs: 42, fats: 16,
      ingredients: ["180 g de camarones pelados", "3 tortillas de maíz", "2 cdas de crema", "1 chile chipotle en adobo", "Cilantro, cebolla morada", "Jugo de limón, aceite"],
      recipe: "1. Marina los camarones con chipotle picado, limón y sal.\n2. Cocina en sartén caliente 3 min.\n3. Mezcla la crema con un poco de chipotle.\n4. Arma los tacos con camarones, crema, cebolla y cilantro."
    },
  ],
  // ─── SÁBADO ───────────────────────────────────────
  [
    { label: "Desayuno", time: "09:00", name: "Chilaquiles verdes con pollo",
      description: "Clásico fin de semana, salsa verde fresca y pollo deshebrado.",
      calories: 510, protein: 32, carbs: 46, fats: 22,
      ingredients: ["60 g de totopos", "120 g de pollo deshebrado", "200 ml de salsa verde", "1 huevo estrellado", "Crema, queso fresco", "Cebolla morada, cilantro"],
      recipe: "1. Calienta la salsa verde en un sartén.\n2. Agrega los totopos y mezcla 1 min.\n3. Sirve con el pollo encima.\n4. Termina con huevo estrellado, crema, queso y cebolla."
    },
    { label: "Snack", time: "12:00", name: "Queso cottage con duraznos",
      description: "Fresco, alto en proteína, ideal pre-entreno.",
      calories: 220, protein: 22, carbs: 22, fats: 4,
      ingredients: ["150 g de queso cottage", "1 durazno fresco", "1 cdita de miel", "Pizca de canela"],
      recipe: "1. Sirve el cottage en un tazón.\n2. Cubre con el durazno rebanado.\n3. Termina con miel y canela."
    },
    { label: "Comida", time: "15:00", name: "Paella de vegetales y mariscos",
      description: "Arroz azafranado con camarones, mejillones y pimientos.",
      calories: 620, protein: 36, carbs: 72, fats: 18,
      ingredients: ["120 g de arroz bomba", "100 g de camarones", "80 g de mejillones", "1 pimiento rojo", "1/2 cebolla", "2 dientes de ajo", "Pizca de azafrán", "500 ml de caldo de pescado", "Limón"],
      recipe: "1. Sofríe cebolla y ajo en aceite.\n2. Agrega el arroz y tuesta 1 min.\n3. Añade pimiento, azafrán y caldo.\n4. Cocina 15 min sin remover.\n5. Agrega los mariscos los últimos 5 min.\n6. Sirve con limón."
    },
    { label: "Cena", time: "20:30", name: "Tabla de antipasto ligero",
      description: "Plato compartido: jamón serrano, quesos, aceitunas y pan.",
      calories: 420, protein: 24, carbs: 28, fats: 22,
      ingredients: ["60 g de jamón serrano", "40 g de queso manchego", "Aceitunas mixtas", "80 g de pan rústico", "Higos frescos", "1 cda de miel"],
      recipe: "1. Arma la tabla con todos los ingredientes.\n2. Sirve con miel aparte para untar con queso."
    },
  ],
  // ─── DOMINGO ──────────────────────────────────────
  [
    { label: "Desayuno", time: "09:30", name: "Panqueques de avena y plátano",
      description: "Sin harina, con proteína, dulces y fluffy.",
      calories: 420, protein: 24, carbs: 52, fats: 12,
      ingredients: ["60 g de avena", "1 plátano", "2 huevos", "1 scoop de proteína", "1 cdita de polvo para hornear", "Arándanos frescos", "1 cda de jarabe de maple"],
      recipe: "1. Licua todos los ingredientes (excepto arándanos y maple).\n2. Cocina en sartén antiadherente 2 min por lado.\n3. Apila, corona con arándanos y maple."
    },
    { label: "Snack", time: "13:00", name: "Guacamole con totopos de batata",
      description: "Totopos horneados caseros y guacamole fresco.",
      calories: 290, protein: 5, carbs: 28, fats: 18,
      ingredients: ["1 aguacate maduro", "1/2 tomate", "Cilantro, cebolla blanca", "Jugo de 1 limón", "1 batata mediana horneada en láminas", "Sal, chile"],
      recipe: "1. Rebana la batata muy fina y hornea a 200°C 20 min con aceite y sal.\n2. Aplasta el aguacate con tomate, cilantro, cebolla y limón.\n3. Sirve juntos."
    },
    { label: "Comida", time: "15:30", name: "Pollo rostizado con vegetales asados",
      description: "Clásico dominguero: muslos dorados, papas, zanahorias y romero.",
      calories: 640, protein: 48, carbs: 48, fats: 26,
      ingredients: ["2 muslos de pollo", "300 g de papas cambray", "2 zanahorias", "1 cebolla morada", "2 ramas de romero", "4 dientes de ajo", "Aceite de oliva, sal, pimienta"],
      recipe: "1. Precalienta el horno a 200°C.\n2. Acomoda todo en una bandeja con aceite, romero y ajo.\n3. Sazona el pollo y coloca encima.\n4. Hornea 40-45 minutos.\n5. Deja reposar 5 min antes de servir."
    },
    { label: "Cena", time: "20:30", name: "Sopa de tortilla tradicional",
      description: "Ligera para terminar la semana, con sabor profundo de chile pasilla.",
      calories: 380, protein: 18, carbs: 42, fats: 16,
      ingredients: ["1 tomate", "1/4 cebolla", "1 diente de ajo", "1 chile pasilla seco", "500 ml de caldo de pollo", "60 g de tortillas fritas", "1/2 aguacate", "Queso fresco, crema, cilantro"],
      recipe: "1. Asa tomate, cebolla, ajo y chile pasilla.\n2. Licua con el caldo.\n3. Cuela y regresa a la olla, hierve 10 min.\n4. Sirve con tortillas fritas, aguacate, queso, crema y cilantro."
    },
  ],
];

const sampleExercises = [
  // Lunes — Pecho y tríceps
  [
    { type: "strength", name: "Press de banca con mancuernas", sets: 4, reps: 10, weight: 0, duration: 0, notes: "Controla el descenso 2 seg" },
    { type: "strength", name: "Press inclinado", sets: 3, reps: 12, weight: 0, duration: 0, notes: "" },
    { type: "strength", name: "Fondos en banco", sets: 3, reps: 12, weight: 0, duration: 0, notes: "Manos cerca del cuerpo" },
    { type: "strength", name: "Extensiones de tríceps con polea", sets: 3, reps: 15, weight: 0, duration: 0, notes: "" },
  ],
  // Martes — Cardio + core
  [
    { type: "cardio", name: "Trote suave", sets: 1, reps: 0, weight: 0, duration: 30, notes: "Zona 2, ritmo conversacional" },
    { type: "strength", name: "Plancha", sets: 3, reps: 1, weight: 0, duration: 1, notes: "60 segundos cada set" },
    { type: "strength", name: "Abdominales en bicicleta", sets: 3, reps: 20, weight: 0, duration: 0, notes: "Contacto codo-rodilla" },
  ],
  // Miércoles — Espalda y bíceps
  [
    { type: "strength", name: "Remo con barra", sets: 4, reps: 10, weight: 0, duration: 0, notes: "Espalda neutra" },
    { type: "strength", name: "Jalón al pecho", sets: 3, reps: 12, weight: 0, duration: 0, notes: "" },
    { type: "strength", name: "Curl de bíceps con mancuernas", sets: 3, reps: 12, weight: 0, duration: 0, notes: "Sin balancear" },
    { type: "strength", name: "Martillo alterno", sets: 3, reps: 10, weight: 0, duration: 0, notes: "" },
  ],
  // Jueves — Movilidad + yoga
  [
    { type: "flexibility", name: "Flujo de yoga suave", sets: 1, reps: 0, weight: 0, duration: 40, notes: "Enfoca caderas y espalda baja" },
    { type: "flexibility", name: "Estiramientos estáticos", sets: 1, reps: 0, weight: 0, duration: 15, notes: "30 seg por músculo" },
  ],
  // Viernes — Piernas
  [
    { type: "strength", name: "Sentadilla con barra", sets: 4, reps: 10, weight: 0, duration: 0, notes: "Baja hasta paralelo" },
    { type: "strength", name: "Peso muerto rumano", sets: 3, reps: 12, weight: 0, duration: 0, notes: "Cadera atrás, rodillas suaves" },
    { type: "strength", name: "Zancadas caminando", sets: 3, reps: 12, weight: 0, duration: 0, notes: "12 por pierna" },
    { type: "strength", name: "Elevación de pantorrillas", sets: 3, reps: 20, weight: 0, duration: 0, notes: "" },
  ],
  // Sábado — HIIT corto
  [
    { type: "hiit", name: "HIIT de 20 minutos", sets: 1, reps: 0, weight: 0, duration: 20, notes: "40 seg trabajo / 20 seg descanso. Burpees, mountain climbers, jumping jacks, saltos de caja." },
  ],
  // Domingo — Descanso activo
  [
    { type: "cardio", name: "Caminata al aire libre", sets: 1, reps: 0, weight: 0, duration: 45, notes: "Paso cómodo, idealmente en parque o naturaleza" },
  ],
];

export const SAMPLE_PLAN_ID = "sample_plan_v1";

export function buildSamplePlan() {
  const dates = Array.from({ length: 7 }, (_, i) => mondayISO(i));

  const days = DAYS.map((day, i) => {
    const meals = sampleMeals[i].map((m, j) => ({
      id: `sample_m_${i}_${j}`,
      ...m,
    }));
    const totals = meals.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fats: acc.fats + m.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return { day, date: dates[i], meals, totals };
  });

  const exerciseRoutine = DAYS.map((day, i) => ({
    day,
    date: dates[i],
    exercises: sampleExercises[i].map((e, j) => ({ id: `sample_e_${i}_${j}`, ...e })),
  }));

  return {
    id: SAMPLE_PLAN_ID,
    isSample: true,
    createdAt: new Date().toISOString(),
    weekStartDate: dates[0],
    title: "Plan de muestra · Recomposición corporal",
    profileSnapshot: {
      objetivo: "Recomposición corporal · actividad moderada",
      caloriesTarget: 2100,
      proteinTarget: 140,
      carbsTarget: 230,
      fatsTarget: 70,
    },
    days,
    exerciseRoutine,
    shoppingList: [
      { category: "Frutas y verduras", items: [
        { name: "Plátanos", quantity: "3 unidades" },
        { name: "Manzana verde", quantity: "1 unidad" },
        { name: "Moras azules", quantity: "200 g" },
        { name: "Limones", quantity: "6 unidades" },
        { name: "Aguacates", quantity: "3 unidades" },
        { name: "Espinaca fresca", quantity: "300 g" },
        { name: "Espárragos", quantity: "200 g" },
        { name: "Brócoli", quantity: "150 g" },
        { name: "Calabacita", quantity: "1 unidad" },
        { name: "Zanahorias", quantity: "4 unidades" },
        { name: "Pimiento rojo", quantity: "2 unidades" },
        { name: "Pimiento amarillo", quantity: "1 unidad" },
        { name: "Cebolla blanca", quantity: "2 unidades" },
        { name: "Cebolla morada", quantity: "2 unidades" },
        { name: "Tomates", quantity: "3 unidades" },
        { name: "Pepino", quantity: "2 unidades" },
        { name: "Col morada", quantity: "1/4 pieza" },
        { name: "Mango", quantity: "1 unidad" },
        { name: "Durazno", quantity: "1 unidad" },
        { name: "Higos frescos", quantity: "4 unidades" },
      ]},
      { category: "Proteínas", items: [
        { name: "Pechuga de pollo", quantity: "500 g" },
        { name: "Muslos de pollo", quantity: "2 unidades" },
        { name: "Arrachera", quantity: "150 g" },
        { name: "Salmón fresco", quantity: "150 g" },
        { name: "Atún fresco", quantity: "300 g" },
        { name: "Camarones pelados", quantity: "280 g" },
        { name: "Mejillones", quantity: "80 g" },
        { name: "Pescado blanco", quantity: "180 g" },
        { name: "Huevos", quantity: "12 unidades" },
      ]},
      { category: "Lácteos y derivados", items: [
        { name: "Leche de almendras", quantity: "1 L" },
        { name: "Leche entera", quantity: "250 ml" },
        { name: "Leche de coco ligera", quantity: "200 ml" },
        { name: "Yogur griego natural", quantity: "500 g" },
        { name: "Queso feta", quantity: "50 g" },
        { name: "Queso parmesano", quantity: "30 g" },
        { name: "Queso manchego", quantity: "40 g" },
        { name: "Queso fresco", quantity: "50 g" },
        { name: "Cottage", quantity: "150 g" },
        { name: "Crema", quantity: "100 ml" },
      ]},
      { category: "Granos, legumbres y cereales", items: [
        { name: "Avena en hojuelas", quantity: "250 g" },
        { name: "Quinoa", quantity: "100 g" },
        { name: "Arroz integral", quantity: "150 g" },
        { name: "Arroz bomba (paella)", quantity: "120 g" },
        { name: "Pasta integral", quantity: "80 g" },
        { name: "Lentejas", quantity: "150 g" },
        { name: "Edamame", quantity: "60 g" },
        { name: "Pan integral", quantity: "1 pieza" },
        { name: "Pan rústico", quantity: "80 g" },
        { name: "Tortillas de maíz", quantity: "12 unidades" },
      ]},
      { category: "Otros esenciales", items: [
        { name: "Almendras", quantity: "80 g" },
        { name: "Nueces", quantity: "50 g" },
        { name: "Pistaches", quantity: "20 g" },
        { name: "Mantequilla de almendra", quantity: "60 g" },
        { name: "Mantequilla de cacahuate", quantity: "15 g" },
        { name: "Semillas de chía", quantity: "30 g" },
        { name: "Granola", quantity: "50 g" },
        { name: "Miel", quantity: "100 ml" },
        { name: "Jarabe de maple", quantity: "30 ml" },
        { name: "Hummus", quantity: "130 g" },
        { name: "Falafel", quantity: "120 g" },
        { name: "Tabule", quantity: "80 g" },
        { name: "Jamón serrano", quantity: "60 g" },
        { name: "Aceitunas mixtas", quantity: "100 g" },
      ]},
    ],
    notes: "Este plan representa una semana balanceada para recomposición corporal con actividad moderada. Prioriza proteína en cada comida, varía carbohidratos complejos y mantén grasas saludables. Hidrátate con 2.5-3 L de agua al día. En Esencial, KYŌRA construye este plan personalizado a TU perfil, tus gustos y tu despensa.",
    doneMealIds: [],
  };
}
