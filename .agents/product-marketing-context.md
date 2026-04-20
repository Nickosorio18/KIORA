# Product Marketing Context — KYŌRA

*Last updated: 2026-04-18 — planes confirmados y landing actualizada*

---

## Product Overview

**One-liner:** KYŌRA es el nutriólogo de IA que habla tu idioma — planes de alimentación personalizados, basados en lo que tienes en tu cocina, en español.

**What it does:** Plataforma web de nutrición inteligente que combina un agente de IA conversacional con un inventario personal de ingredientes ("Mi Despensa") para generar planes de alimentación, rutinas de ejercicio y seguimiento de progreso totalmente personalizados. El agente KYŌRA actúa como un nutriólogo empático disponible 24/7.

**Product category:** AI health & wellness coach / plataforma de nutrición personalizada

**Product type:** SaaS web — acceso por suscripción mensual

**Business model:**
| Plan | Precio | Propuesta de valor |
|------|--------|-------------------|
| Gratis / Trial | 7 días sin tarjeta | Acceso completo al plan Esencial. Sin costo, sin riesgo. |
| Esencial | $29/mes | Coach 24/7 · plan semanal · macros · lista de compras · PDF · análisis de progreso · Mi Despensa |
| Premium | $49/mes | Todo Esencial + rutina de entrenamiento semanal adaptada + historial 8 semanas + plan familiar (hasta 2 perfiles) + acceso prioritario a nuevas funciones |
| Élite | $99/mes | Todo Premium + videollamada mensual con nutriólogo certificado + atención prioritaria *(lanzar en V2 cuando esté operativo el modelo de nutriólogos)* |

**Notas de pricing:**
- Free trial es la palanca principal de conversión — reduce la objeción "¿lo voy a usar?"
- Premium es el tier target (más popular, mejor margen). Su diferenciador más fuerte es el **plan familiar** — mayor WTP y menor churn.
- Élite aplazar hasta tener red de nutriólogos certificados definida. No lanzar con el modelo operativo sin resolver.
- Pricing en USD. Evaluar pricing regional para LATAM en V2 (MXN/COP/PEN).

---

## Target Audience

**Target users:** Adultos de 25-45 años hispanohablantes, en Latinoamérica y EE.UU., con interés en salud y bienestar, que tienen disposición a pagar por soluciones premium digitales.

**Perfil de usuario primario:**
- Vive en ciudad (CDMX, Bogotá, Lima, Miami, Los Ángeles, Houston)
- Tiene smartphone y usa apps cotidianamente
- Ya intentó dietas o apps de nutrición sin resultados duraderos
- Busca algo que se sienta *personalizado*, no genérico
- Presupuesto mensual para suscripciones: $20-$100 USD

**Primary use case:** Obtener un plan de alimentación realista y personalizado que tome en cuenta lo que *ya tiene* en su cocina, sus objetivos (perder peso, ganar músculo, comer mejor) y sus restricciones (vegano, intolerante al gluten, etc.).

**Jobs to be done:**
- "Dime qué comer esta semana sin salir de mi presupuesto ni tirar comida"
- "Necesito bajar de peso pero no quiero seguir una dieta de revista genérica"
- "Quiero alguien que me explique nutrición sin hacerme sentir mal"

**Use cases:**
- Usuario con refrigerador lleno que no sabe qué cocinar → genera recetas con lo que tiene
- Persona que quiere bajar 10 kg antes de un evento → plan semana a semana con seguimiento
- Mamá que quiere comer mejor junto a su familia → planes familiares adaptables
- Migrante latinoamericano en EE.UU. buscando opciones con ingredientes conocidos

---

## Problems & Pain Points

**Core problem:** Las apps de nutrición genéricas (MyFitnessPal, Noom) están en inglés, no entienden la gastronomía latinoamericana, dan consejos genéricos que no consideran lo que el usuario tiene disponible, y se sienten frías y poco empáticas.

**Why alternatives fall short:**
- **MyFitnessPal / Cronometer:** Solo cuentan calorías, no generan planes, están en inglés
- **Noom:** Caro ($60+/mes), en inglés, enfocado en psicología de hábitos pero sin asistente conversacional real
- **ChatGPT / Claude.ai:** Dan consejos de nutrición, pero sin memoria persistente, sin perfil de usuario, sin despensa, sin experiencia diseñada para esto
- **Nutriólogos humanos:** $80-$200/consulta, no disponibles 24/7, inaccesibles económicamente

**What it costs them:**
- Tiempo: horas buscando recetas, planificando, leyendo etiquetas
- Dinero: desperdiciar ingredientes, gastar en consultas esporádicas
- Motivación: frustración por resultados inconsistentes y falta de acompañamiento

**Emotional tension:** Saben lo que *deberían* comer pero no saben *cómo* hacerlo en su vida real. Sienten culpa cuando "fallan" y necesitan alguien que los entienda sin juzgarlos.

---

## Competitive Landscape

**Directo (misma solución, mismo problema):**
- **Noom** — caro, en inglés, sin IA conversacional real, sin despensa
- **MyFitnessPal** — contador de calorías, no planificador; no conversacional
- **Lifesum** — tracking básico, sin IA generativa, sin español profundo

**Secundario (diferente solución, mismo problema):**
- **ChatGPT Plus / Claude.ai** — dan consejos de nutrición ad hoc, sin perfil, sin memoria, sin UX especializada
- **YouTube / TikTok nutricionistas** — gratuito pero sin personalización
- **Blogs y apps de recetas** — pasivo, sin IA, sin plan

**Indirecto (enfoque diferente):**
- **Nutriólogos humanos** — máxima personalización, pero caro e inaccesible
- **Meal kits (HelloFresh, Green Chef)** — resuelven "qué cocinar" pero no "qué comer según mis objetivos"

**Ventaja competitiva clave:** KYŌRA es la única plataforma que combina IA conversacional en español + inventario de ingredientes + planes basados en lo que el usuario *ya tiene* + identidad visual premium diseñada para el mercado hispano.

---

## Differentiation

**Key differentiators:**
- **"Mi Despensa":** El agente genera planes con los ingredientes que el usuario *ya tiene*, reduciendo desperdicio y fricciones
- **Español de primera clase:** Diseñado desde el inicio para hispanohablantes, no traducido
- **Identidad luxury wellness:** Posicionamiento premium en un mercado lleno de apps utilitarias
- **IA conversacional real:** Claude como motor, con system prompt especializado en nutrición y guardrails médicos

**How we do it differently:** En lugar de pedir al usuario que registre todo lo que come (tedioso), KYŌRA trabaja desde lo que tiene disponible y genera planes accionables hacia adelante.

**Why that's better:** Reduce la fricción de adopción, hace que el consejo se sienta personalizado de verdad, y crea un hábito de uso natural (actualizar despensa → recibir plan).

**Why customers choose us:** "Es como tener un nutriólogo amigo que conoce mi cocina y habla como yo."

---

## Objections

| Objeción | Respuesta |
|----------|-----------|
| "¿No puede ChatGPT hacer lo mismo gratis?" | ChatGPT no tiene tu perfil, no recuerda tu despensa, no tiene una interfaz diseñada para nutrición, y no ofrece seguimiento de progreso. KYŌRA es una experiencia completa, no un chat genérico. |
| "No confío en IA para consejos de salud" | KYŌRA no reemplaza a tu médico — es un acompañante educado que siempre te refiere a un profesional cuando es necesario. Como tener un amigo nutriólogo, no un diagnóstico. |
| "Es caro para una app" | $29/mes es menos que una sola consulta con nutriólogo. Y KYŌRA está disponible 24/7 todos los días del mes. |
| "No sé si lo voy a usar" | Por eso existe el plan Esencial sin compromiso. Pruébalo un mes y si no ves valor, cancelás sin penalidad. |

**Anti-persona:** Persona que busca soluciones médicas para condiciones crónicas (diabetes, obesidad severa, trastornos alimenticios). KYŌRA siempre derivará a profesionales — no es el producto adecuado como tratamiento médico principal.

---

## Switching Dynamics (JTBD Four Forces)

**Push (qué los aleja de lo actual):**
- Frustración con apps en inglés que no entienden la gastronomía latina
- Cansancio de planes genéricos que no consideran su realidad
- Sentirse juzgados o solos en el proceso

**Pull (qué los atrae a KYŌRA):**
- IA que habla su idioma y entiende su cocina
- Planes basados en lo que tienen, no en lo que deberían comprar
- Diseño premium que se siente aspiracional, no médico

**Habit (qué los retiene en lo actual):**
- Ya tienen MyFitnessPal con su historial de alimentos
- Ven nutricionistas en YouTube gratis
- Usan grupos de WhatsApp para recetas

**Anxiety (qué les preocupa del cambio):**
- "¿Vale la pena pagar si no lo voy a usar?"
- "¿Mis datos médicos están seguros?"
- "¿Qué tan diferente es de ChatGPT?"

---

## Customer Language

**How they describe the problem:**
- "No sé qué cocinar con lo que tengo en el refri"
- "Todas las dietas son para gente que come diferente a como como yo"
- "Necesito que alguien me diga exactamente qué comer, no solo calorías"
- "Los nutriólogos son muy caros y solo los veo una vez al mes"

**How they'd describe KYŌRA (ideal):**
- "Es como un nutriólogo que vive en mi teléfono"
- "Por fin una app en español que entiende lo que como"
- "Me dice qué hacer con lo que tengo, no me pide comprar cosas raras"

**Words to use:** plan, personalizado, tus ingredientes, tu cocina, acompañamiento, evidencia científica, sin juzgar, para ti, accesible, latinoamericano

**Words to avoid:** dieta (connotación negativa), restricción, calorías (como única métrica), régimen, adelgazar (usar "alcanzar tus objetivos"), caro/barato

**Glossary:**
| Término | Significado en KYŌRA |
|---------|---------------------|
| Mi Despensa | Inventario personal de ingredientes por ubicación (alacena, refrigerador, congelador, frutas/verduras) |
| Plan semanal | Menú de 7 días generado por el agente según perfil y despensa |
| Macros | Distribución de macronutrientes (proteína, carbohidratos, grasas) del plan |
| Agente KYŌRA | El asistente de IA conversacional powered by Claude |

---

## Brand Voice

**Tone:** Cálido y profesional — como un nutriólogo amigo que sabe mucho pero nunca te hace sentir menos

**Style:** Conversacional pero informado. Directo sin ser frío. Motivacional sin ser cliché. Español latinoamericano neutro.

**Personality:** Empático · Editorial · Aspiracional · Cercano · Confiable

---

## Proof Points

**Métricas (por validar — targets para lanzamiento):**
- Reducción de tiempo de planificación semanal: de ~3 horas a <10 minutos
- Ahorro estimado vs. nutriólogo: $600-$2,400/año
- Disponibilidad: 24/7 vs. 1 consulta/mes con profesional

**Value themes:**
| Tema | Prueba |
|------|--------|
| Personalización real | Planes basados en perfil + despensa, no templates genéricos |
| Accesibilidad | 24/7, sin citas, en tu idioma |
| Ahorro | Menos desperdicio de alimentos, planes con lo que tienes |
| Respaldo científico | Powered by Claude (Anthropic), guardrails médicos integrados |

---

## Goals

**Business goal:** Validar product-market fit en el segmento hispano con 100 usuarios pagos en el primer trimestre post-lanzamiento.

**Conversion action primaria:** Sign up → completar onboarding de 5 pasos → generar primer plan semanal

**Conversion action secundaria:** Plan Esencial → upgrade a Premium

**Current metrics:** Pre-lanzamiento. Producto en desarrollo activo.

---

## Análisis de Viabilidad (2026-04-18)

### ✅ Señales positivas de viabilidad

1. **Mercado masivo desatendido:** 60M+ hispanos en EE.UU. + 650M en LATAM. El segmento de salud digital latinoamericano crece a ~20% anual. No hay un líder claro en nutrición IA en español.

2. **Diferenciador genuino:** "Mi Despensa" no existe en ningún competidor conocido. Es un moat técnico y de hábito — crea lock-in natural porque el usuario invierte tiempo en mantener su inventario.

3. **Timing correcto:** 2024-2026 es la ventana de adopción masiva de IA conversacional. Estar primero con un producto especializado es ventaja real.

4. **Unit economics potencialmente sólidas:** CAC puede ser bajo con contenido en redes (TikTok/Instagram en español tiene alta engagement en salud). LTV de $348-$1,188/año (Esencial-Élite).

5. **Stack lean:** React + Anthropic API permite lanzar rápido sin infraestructura pesada.

### ⚠️ Riesgos a mitigar

1. **API key expuesta client-side:** Si `VITE_ANTHROPIC_API_KEY` es accesible en el browser, cualquier usuario puede extraerla. **Requiere backend proxy urgente antes de producción.**

2. **Barrera de imitación baja:** Un competidor con recursos puede replicar el concepto en meses. El moat real debe ser comunidad, datos de usuario y marca.

3. **Regulación médica:** FDA (EE.UU.) y equivalentes LATAM tienen reglas sobre consejos nutricionales. Los disclaimers actuales son correctos pero hay que estar preparados legalmente.

4. **Churn en apps de salud:** La industria tiene tasas de abandono del 70%+ en los primeros 30 días. La retención depende de crear un hábito real — la despensa ayuda, pero hay que diseñar notificaciones y seguimiento inteligente.

5. **Precio en LATAM:** $29/mes es accesible en EE.UU. pero caro en muchos mercados LATAM (México, Perú, Colombia). Considerar tier local o precios por región.

### 🚀 Áreas de oportunidad prioritarias

1. **WhatsApp integration (high impact):** Latinoamérica vive en WhatsApp. Un bot que permita actualizar la despensa y recibir sugerencias por WhatsApp multiplicaría la retención sin cambiar el core product.

2. **Localización culinaria profunda:** Ir más allá del "español neutro" — cocina mexicana, peruana, colombiana, caribeña. Diferenciador defensible que requiere conocimiento local.

3. **B2B wellness:** Empresas medianas que quieren ofrecer beneficios de bienestar a empleados. Ticket promedio mucho mayor ($5-$15/usuario/mes × 100 empleados = $500-$1,500/mes por empresa).

4. **Integración con delivery:** Conectar la lista de compras generada por el agente con Rappi, Mercado Fresco, Instacart (EE.UU. hispano). Revenue share o comisión de afiliado.

5. **Contenido educativo escalable:** Blog/TikTok/Reels en español sobre nutrición, generado asistido por IA. Bajo costo, alto impacto en SEO y awareness orgánico.

6. **Plan familiar:** Un plan que sirva a toda la familia (2-4 personas, diferentes restricciones). Willingness to pay más alta y churn más bajo.
