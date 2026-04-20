# KYŌRA — Nutrición Inteligente Potenciada por IA

<p align="center">
  <strong>Planes personalizados · Coaching 24/7 · Bienestar real</strong>
</p>

---

## Sobre el Proyecto

KYŌRA es una plataforma de nutrición y bienestar que combina inteligencia artificial con fundamentos de nutrición clínica para ofrecer atención personalizada y continua a escala. Dirigida al mercado hispanohablante en Latinoamérica y Estados Unidos.

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Styling | CSS Modules + CSS Variables |
| IA | Anthropic API (Claude) |
| Diseño | Mobile-first, luxury wellness |

## Quick Start

### Requisitos
- Node.js 18+
- npm o yarn
- API key de Anthropic

### Instalación

```bash
# Clonar el repo
git clone https://github.com/[tu-usuario]/kyora.git
cd kyora

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu ANTHROPIC_API_KEY

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

```env
VITE_ANTHROPIC_API_KEY=tu_api_key_aqui
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── shared/        # Componentes reutilizables (botones, inputs, modals)
│   ├── landing/       # Página principal de marketing
│   ├── agent/         # Agente nutricional de IA + chat
│   ├── pantry/        # Sistema "Mi Despensa"
│   ├── onboarding/    # Flujo de registro
│   └── dashboard/     # Panel del usuario
├── hooks/             # Custom React hooks
├── context/           # Providers de estado global
├── api/               # Integración con Anthropic API
├── utils/             # Funciones helper
└── styles/            # Tokens de diseño y estilos globales
```

## Desarrollo con Claude Code

Este proyecto está diseñado para desarrollo asistido con [Claude Code](https://docs.anthropic.com/en/docs/claude-code). El archivo `CLAUDE.md` en la raíz contiene todo el contexto del proyecto — marca, arquitectura, componentes existentes, y principios de desarrollo.

```bash
# Iniciar Claude Code en el directorio del proyecto
claude

# Claude Code lee automáticamente CLAUDE.md para contexto
```

## Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo (Vite)
npm run build     # Build de producción
npm run preview   # Preview del build
npm run lint      # Linting
```

## Roadmap

- [x] Landing page
- [x] Agente nutricional de IA
- [x] Sistema "Mi Despensa"
- [ ] Onboarding de usuario
- [ ] Dashboard principal
- [ ] Generación de planes descargables
- [ ] Backend + autenticación
- [ ] Despliegue

## Disclaimer

KYŌRA no reemplaza asesoría médica profesional. Los agentes de IA ofrecen orientación nutricional general y seguimiento. Siempre consulte a un profesional de salud certificado para condiciones médicas específicas.

---

<p align="center">
  <sub>Construido con ❤️ y IA · © 2026 KYŌRA</sub>
</p>
