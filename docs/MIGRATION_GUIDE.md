# Guía de Migración a Claude Code

## Paso 1: Setup del entorno local

```bash
# 1. Instalar Node.js 18+ si no lo tienes
# Descargar de: https://nodejs.org/

# 2. Instalar Claude Code
npm install -g @anthropic-ai/claude-code

# 3. Configurar tu API key de Anthropic (se configura al correr claude por primera vez)
```

## Paso 2: Inicializar el proyecto

```bash
# 1. Crear carpeta del proyecto y descomprimir el repo base
mkdir ~/kyora
# Copia todo el contenido del repo descargado aquí

# 2. Entrar al directorio
cd ~/kyora

# 3. Instalar dependencias
npm install

# 4. Crear tu archivo .env
cp .env.example .env
# Edita .env y agrega tu ANTHROPIC_API_KEY

# 5. Verificar que corre
npm run dev
# Debería abrir en http://localhost:5173
```

## Paso 3: Inicializar Git

```bash
git init
git add .
git commit -m "Initial setup: KYŌRA project structure"

# Opcional: conectar a GitHub
# gh repo create kyora --private --source=. --push
```

## Paso 4: Arrancar Claude Code

```bash
# Desde la raíz del proyecto
claude

# Claude Code lee automáticamente CLAUDE.md
# Ya tiene todo el contexto del proyecto
```

## Paso 5: Migrar componentes existentes

El orden recomendado de migración:

### 5a. Design tokens y estilos (✅ ya incluidos)
Los archivos `tokens.css`, `global.css`, y `animations.css` ya están en el repo.

### 5b. Componentes compartidos
Pedirle a Claude Code:
> "Crea los componentes shared: Button, Input, Modal, y Card siguiendo los design tokens"

### 5c. Landing page
Pedirle a Claude Code:
> "Migra la landing page de KYŌRA desde el artifact. Las secciones son: Hero, Servicios, Cómo Funciona, Precios, y Footer"

### 5d. Agente nutricional
Pedirle a Claude Code:
> "Migra el agente nutricional: onboarding de 5 pasos + interfaz de chat + renderizado de mensajes estilizado"

### 5e. Sistema Mi Despensa
Pedirle a Claude Code:
> "Migra el sistema Mi Despensa con las 4 categorías de ubicación"

## Paso 6: Construir lo nuevo

Una vez migrado lo existente:

1. **Sistema de onboarding de usuario** (próximo pendiente)
2. **Dashboard principal**
3. **Backend + autenticación**

---

## Tips para trabajar con Claude Code

- **Sé específico** con lo que necesitas: "Crea el componente Button con variantes primary, secondary, y ghost"
- **Referencia el CLAUDE.md** cuando necesites que recuerde el contexto: "Revisa CLAUDE.md para la paleta de colores"
- **Trabaja en incrementos**: un componente o feature a la vez
- **Usa Git frecuentemente**: commit después de cada componente funcional
- **Claude Code puede correr comandos**: puede ejecutar `npm run dev`, verificar errores, y arreglarlos
