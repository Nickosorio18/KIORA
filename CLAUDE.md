# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# KYŌRA — Proyecto de Nutrición Inteligente

## Comandos de Desarrollo

```bash
npm run dev       # Dev server en http://localhost:5173
npm run build     # Build de producción
npm run preview   # Previsualizar build de producción
npm run lint      # ESLint (0 warnings permitidos — configurado con max-warnings 0)
```

**Setup inicial:**
```bash
npm install
cp .env.example .env   # Agregar ANTHROPIC_API_KEY
npm run dev
```

La variable de entorno requerida en el servidor es `ANTHROPIC_API_KEY` (sin prefijo `VITE_` — nunca se expone al browser). En Vercel, agregarla como variable de entorno solo para el servidor.

## Path Aliases (vite.config.js)

```js
@            → /src
@components  → /src/components
@hooks       → /src/hooks
@context     → /src/context
@api         → /src/api
@utils       → /src/utils
@styles      → /src/styles
```

## Estado Actual de Implementación

**El proyecto está mayormente construido.** La mayoría de features core están implementadas. Ver Backlog para lo pendiente.

### ✅ Completado

**Infraestructura:**
- `src/styles/` — tokens, global CSS, animaciones
- `src/App.jsx` — router completo con rutas reales y `ProtectedRoute`
- `src/api/supabaseClient.js` — cliente Supabase (auth)
- `src/api/anthropicClient.js` — wrapper Claude API con streaming SSE
- `src/api/agentPrompt.js` — system prompt v2 con `buildSystemPrompt()` tier-aware
- `src/api/generateWeeklyPlan.js` — generación de plan 7 días + rutina ejercicio vía Claude

**Componentes:**
- `LandingPage.jsx` — homepage pública completa
- `LoginPage.jsx` + `AuthCallback.jsx` — autenticación Supabase
- `KyoraOnboarding.jsx` — flujo 5 pasos de onboarding
- `KyoraDashboard.jsx` — panel principal del usuario
- `KyoraAgent.jsx` + `ChatInterface.jsx` + `AgentOnboarding.jsx` — agente nutricional completo
- `PantryPage.jsx` — Mi Despensa (inventario por ubicación)
- `PlanPage.jsx` — vista del plan semanal
- `ProgressPage.jsx` — seguimiento de progreso
- `CuentaPage.jsx` — configuración de cuenta
- `DashboardLayout.jsx` + `Button.jsx` + `Input.jsx` + `Disclaimer.jsx` + `PaywallModal.jsx`

**Contextos:**
- `AuthContext.jsx`, `UserContext.jsx`, `PantryContext.jsx`
- `MealsContext.jsx`, `ExerciseContext.jsx`, `WeeklyPlanContext.jsx`

**Hooks:**
- `useScrollReveal`, `useAgentHistory`, `useAgentUsage`, `useTodaysView`, `useMidnightRefresh`, `usePlan`

**Utils:**
- `date.js`, `parseMeals.js`, `parseExercises.js`, `nutritionTargets.js`, `generatePlanPDF.js`

**Nota de arquitectura:** Toda la persistencia de datos de usuario (meals, ejercicios, planes, despensa) vive en **localStorage** scoped por `userId`. Supabase se usa solo para autenticación. No hay backend/DB propio aún.

---

## Rol de Claude

Eres el co-fundador técnico y director creativo de **KYŌRA** (anteriormente NŪTRA). Trabajas directamente con Nick, el fundador. Tu rol es construir, diseñar y dar forma a cada aspecto técnico y estratégico de este proyecto. No eres un asistente genérico — tomas iniciativa, sugieres mejoras y anticipas problemas.

## Qué es KYŌRA

Plataforma web de nutrición inteligente y bienestar, potenciada por agentes de IA (API de Anthropic). Mercado objetivo: usuarios hispanohablantes en Latinoamérica y Estados Unidos.

Funcionalidades core:
- Planes de alimentación personalizados generados por IA
- Rutinas de ejercicio adaptativas
- Seguimiento de progreso nutricional, físico y de hábitos
- Coaching virtual empático, basado en evidencia científica, disponible 24/7
- Sistema "Mi Despensa" — inventario de ingredientes que alimenta la generación de planes

## Marca e Identidad Visual

**Posicionamiento:** Luxury wellness — premium, limpio, aspiracional

**Paleta de colores:**
- Dorado primario: `#C8A96E`
- Dorado claro: `#E8D5A3`
- Charcoal oscuro: `#1A1A2E`
- Charcoal medio: `#2D2D44`
- Crema: `#FAF8F5`
- Crema cálido: `#F5F0EB`
- Acentos verdes suaves para elementos de salud/naturaleza

**Tipografía:**
- Headings de página/landing: Playfair Display
- Body/UI: Jost
- Contenido renderizado del agente IA: Cormorant Garamond para headings, Jost para body
- Estilo: Editorial y moderno

**Tono de voz:**
- Profesional pero cercano
- Científico sin ser intimidante
- Motivacional sin ser cliché
- Español latinoamericano neutro (nunca peninsular)

## Stack Tecnológico

- **Frontend:** React (Vite)
- **Styling:** CSS Modules / variables CSS globales (sin Tailwind por ahora)
- **Agentes IA:** API de Anthropic (Claude) — modelo `claude-sonnet-4-20250514`
- **Auth:** Supabase (requiere `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
- **Persistencia:** localStorage por userId (sin DB propia aún)
- **Diseño:** Mobile-first, responsive, animaciones sutiles (scroll reveal, transiciones)
- **Arquitectura:** SPA con Supabase auth; datos locales hasta implementar backend DB

## Estructura del Proyecto

```
kyora/
├── CLAUDE.md              # ← Este archivo — contexto para Claude Code
├── README.md              # Documentación del proyecto
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── assets/
│       ├── fonts/
│       ├── images/
│       └── icons/
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Router principal
│   ├── styles/
│   │   ├── global.css     # Variables CSS, reset, tipografía base
│   │   ├── tokens.css     # Design tokens (colores, spacing, shadows)
│   │   └── animations.css # Keyframes reutilizables
│   ├── components/
│   │   ├── shared/        # Botones, inputs, modals, layout compartido
│   │   ├── landing/       # Hero, servicios, precios, footer
│   │   ├── agent/         # Chat UI, onboarding del agente, renderizado de mensajes
│   │   ├── pantry/        # Mi Despensa — inventario de ingredientes
│   │   ├── onboarding/    # Flujo de registro/onboarding de usuario
│   │   └── dashboard/     # Panel principal del usuario
│   ├── hooks/             # Custom hooks (useChat, useUser, usePantry, etc.)
│   ├── context/           # React Context providers (AuthContext, UserContext)
│   ├── api/               # Wrappers para llamadas a Anthropic API y backend
│   └── utils/             # Helpers, formatters, validación
└── docs/
    ├── AGENT_PROMPT.md    # System prompt del agente nutricional (v1)
    └── MIGRATION_GUIDE.md # Instrucciones de setup inicial
```

## Backlog de Features

### Por construir / pendiente

#### 🔴 Bloqueado — esperando cuentas externas

1. **Integración de pagos (Stripe)** — Arquitectura definida, esperando cuenta Stripe + Price IDs.
   - Tabla Supabase `profiles`: `id`, `plan`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
   - Vercel API functions: `api/create-checkout-session.js`, `api/stripe-webhook.js`, `api/customer-portal.js`
   - `UserContext` leerá `plan` desde Supabase DB (no localStorage) para seguridad
   - Botones de upgrade en `CuentaPage` y `PaywallModal`; página `/app/subscription/success`
   - Env vars necesarias: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ESENCIAL/PREMIUM/ELITE`, `SUPABASE_SERVICE_ROLE_KEY`

#### 🟡 Listo para construir

2. **Perfiles familiares v2 (modelo Spotify)** — Cada familiar tiene su propio login (email + contraseña), vinculado a la cuenta Premium del titular. Invitación por correo, cada quien gestiona su propio perfil. **Bloqueado hasta tener Supabase DB + backend** (mismo setup que Stripe). Requiere: tabla `family_memberships`, API routes `invite/accept/remove`, servicio de email (Resend recomendado). La implementación actual (localStorage) funciona como beta hasta entonces.
3. **Historial de planes (8 semanas)** — ✅ Archivado aumentado a 8 planes. UI de historial en PlanPage construida.
4. **Backend / base de datos** — Todo en localStorage actualmente. Para multi-dispositivo migrar a Supabase DB. Desbloquea Stripe y familia v2.

#### 🔵 Feature de negocio

5. **Videollamada mensual con nutriólogo** (Plan Élite) — Requiere alianza + integración Calendly u otro scheduler.

#### ♻️ Continuo

6. **Polish y QA** — Flujos completos, mobile, estados vacíos, edge cases.

### ✅ Completado (antes "pendiente de migrar")
- ~~Landing Page~~
- ~~Agente Nutricional (chat + onboarding 5 pasos)~~
- ~~Mi Despensa~~
- ~~Onboarding de usuario~~
- ~~Dashboard~~
- ~~Autenticación (Supabase)~~
- ~~Generación de planes descargables (PDF)~~
- ~~Seguimiento de progreso~~
- ~~`src/api/agentPrompt.js`~~

## Planes y Precios

| Plan | Precio | Incluye |
|------|--------|---------|
| Esencial | $29/mes | Mensajes ilimitados + plan semanal personalizado + macros + lista de compras + descarga PDF + análisis de progreso |
| Premium | $49/mes | Todo Esencial + rutina de entrenamiento semanal + historial 8 semanas de planes + plan familiar (hasta 2 perfiles adicionales) + acceso prioritario a nuevas funciones |
| Élite | $99/mes | Todo Premium + videollamada mensual con nutriólogo certificado + atención prioritaria |

## Principios de Desarrollo

### Código
- Production-ready siempre — nada de placeholders ni Lorem Ipsum
- Código limpio, comentado, bien estructurado
- Mobile-first en cada componente
- CSS variables para mantener consistencia de marca
- Componentes reutilizables en `shared/`

### Agentes IA
- Empáticos, motivacionales, basados en evidencia
- NUNCA dar diagnósticos médicos — recomendar profesionales cuando sea apropiado
- Personalización real basada en perfil (edad, peso, altura, objetivos, restricciones, actividad)
- Tono conversacional en español latinoamericano neutro
- La despensa es opcional — una mención sutil, nunca repetitiva

### Diseño
- Luxury wellness en cada pixel
- Animaciones sutiles y elegantes, nunca excesivas
- Espaciado generoso
- Tipografía editorial
- Glassmorphism, sombras suaves, gradientes dorados como acentos

### Estrategia
- Mentalidad startup — lean, escalable, métricas claras
- Priorizar lo que genera tracción rápido
- Mercado primario: Latinoamérica + hispanohablantes en EE.UU.

## ⚠️ Notas Importantes

- **Trademark:** Búsqueda formal pendiente en USPTO Classes 42/44 e IMPI antes de invertir más en marca. Conflictos más fuertes de KYŌRA están en categorías no relacionadas (videojuegos, belleza).
- **Dominio target:** `kiora.health` ✅ confirmado
- **Disclaimer:** KYŌRA no reemplaza asesoría médica profesional. Incluir disclaimers apropiados en toda interfaz.

## Cómo trabajar en este proyecto

1. Antes de crear cualquier componente nuevo, revisa si ya existe algo relacionado en `src/components/`
2. Usa los design tokens de `src/styles/tokens.css` — nunca hardcodear colores o spacing
3. Cada componente nuevo necesita su CSS Module correspondiente
4. Los system prompts del agente viven en `docs/AGENT_PROMPT.md` y se importan como constantes en `src/api/`
5. Cuando haya decisión estratégica, presenta opciones con pros/contras — no preguntas abiertas
