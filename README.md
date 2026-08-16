# kan-mcp

[English](#english) | [Español](#español)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%23339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Test Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen?style=for-the-badge)

---

## English

A Model Context Protocol (MCP) server that exposes the [Kan.bn](https://kan.bn) REST API as tools for AI assistants. Built with Node.js + TypeScript.

### Overview

kan-mcp exposes 40+ tools across 7 domains for managing Kan.bn workspaces, plus MCP Resources for efficient read operations:

| Domain     | Tools | Description                              |
|------------|-------|------------------------------------------|
| workspace  | 9     | List, find, create, get, update, delete, search workspaces |
| board      | 8     | Manage boards with slug availability checking |
| list       | 3     | Create, update, delete lists             |
| card       | 10    | Full card management with labels, members, activities |
| label      | 4     | Create and manage colored labels         |
| checklist  | 6     | Checklist management with items          |
| comment    | 3     | Card comments                            |
| **Resources** | **3** | **Read-only URIs for efficient context loading** |

### Quick Start

```bash
# Install (for development)
npm install

# Run tests
npm test

# Build for distribution
npm run build
```

### Configuration

kan-mcp requires a Kan.bn API key:

```bash
export KAN_API_KEY=your_api_key_here
npm run build && node dist/index.js
```

Optional: Set a custom API base URL:

```bash
export KAN_API_BASE_URL=https://kan.tools.pugcasa.com/api/v1
```

### Installation

Install once with npx (no cloning required):

```bash
npx kanbn-mcp
```

Or install globally:

```bash
npm install -g kanbn-mcp
```

### MCP Server Configuration

> **Note:** The configuration format is the same for all agents/IDEs. Check your agent/IDE documentation for where to add this JSON.

Add this to your agent/IDE's MCP server configuration:

```json
{
  "mcpServers": {
    "kan": {
      "command": "npx",
      "args": ["-y", "kanbn-mcp"],
      "env": {
        "KAN_API_KEY": "kan_your_api_key_here"
      }
    }
  }
}
```

#### Where to add the configuration

| Agent/IDE | Location |
|-----------|----------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | Settings → MCP → Add new server |
| VS Code with Copilot | `.vscode/mcp.json` |
| Roo (CLINE) | Your global MCP settings |

### Available Tools

#### Workspace Tools

```
workspace.list                    # List all workspaces
workspace.findByName              # Find workspace by name (case-insensitive)
workspace.create                  # Create a new workspace
workspace.getById                 # Get workspace by ID
workspace.getBySlug               # Get workspace by slug
workspace.update                  # Update workspace properties
workspace.delete                  # Delete a workspace
workspace.search                  # Search boards and cards
workspace.checkSlugAvailability   # Check if slug is available
```

#### Board Tools

```
board.list                       # List boards (with filters)
board.create                     # Create a new board
board.getById                    # Get board by ID (with card filters)
board.getBySlug                  # Get board by slug (with card filters)
board.findByName                 # Find board by workspace + board name
board.update                     # Update board properties
board.delete                     # Delete a board
board.checkSlugAvailability      # Check if slug is available
```

##### Board Filtering
`board.getById` and `board.getBySlug` support filtering cards within the board:

| Parameter | Description |
|-----------|-------------|
| `members` | Filter cards by assigned member IDs |
| `labels` | Filter cards by label IDs |
| `lists` | Filter cards by list IDs |
| `dueDateFilters` | Filter by due date status: `overdue`, `today`, `tomorrow`, `next-week`, `next-month`, `no-due-date` |
| `type` | Filter by board type: `regular`, `template` |

#### List Tools

```
list.create                      # Create a new list
list.update                      # Update list properties
list.delete                      # Delete a list
```

#### Card Tools

```
card.create                      # Create a new card
card.getById                     # Get card by ID
card.duplicate                   # Duplicate a card to same or different list
card.update                      # Update card properties
card.delete                      # Delete a card
card.addLabel                    # Add label to card
card.removeLabel                 # Remove label from card
card.addMember                   # Add member to card
card.removeMember                # Remove member from card
card.listActivities              # List card activities (with cursor pagination)
```

#### Label Tools

```
label.create                     # Create a new label
label.getById                    # Get label by ID
label.update                     # Update label properties
label.delete                     # Delete a label
```

#### Checklist Tools

```
checklist.create                 # Create checklist on card
checklist.update                 # Update checklist properties
checklist.delete                 # Delete a checklist
checklist.addItem                # Add item to checklist
checklist.updateItem             # Update checklist item
checklist.deleteItem             # Delete checklist item
```

#### Comment Tools

```
comment.add                      # Add comment to card
comment.update                   # Update comment
comment.delete                   # Delete a comment
```

#### Server Tools

```
server.health                    # Check MCP server and dependency health
```

#### MCP Resources

MCP Resources provide read-only data URIs for efficient LLM context loading. Unlike tools (which require an action), resources allow the LLM to read data directly via URI.

```
kan://stats                                    # Application statistics
kan://board/{boardPublicId}                   # Board by public ID
kan://workspace/{workspaceSlug}/board/{boardSlug}  # Board by slug
```

##### Card Activities Pagination
`card.listActivities` supports cursor-based pagination:

| Parameter | Description |
|-----------|-------------|
| `limit` | Number of activities (1-100, default 10) |
| `cursor` | ISO timestamp cursor for next page |

Response includes `hasMore` and `nextCursor` for easy iteration.

### Rich Text / HTML Support

Card descriptions and comment content support HTML formatting. The API automatically sanitizes HTML to prevent XSS attacks, allowing only safe tags and attributes.

#### Supported HTML Tags

- `<p>...</p>` - Paragraphs
- `<br>` - Line breaks
- `<strong>`, `<em>`, `<b>`, `<i>`, `<u>` - Text formatting
- `<a href="...">...</a>` - Links (javascript: and data: URLs are blocked)
- `<ul>`, `<ol>`, `<li>` - Lists
- `<h1>` through `<h6>` - Headings

#### Example

```html
<p>Salary: $156,400 - $225,000</p>
<p>Location: Washington, DC area (Hybrid)</p>
<p>Tech Stack: Python, Java, Spark, BigQuery, Kafka, AWS</p>
<p><a href="https://linkedin.com/jobs/123">View on LinkedIn</a></p>
```

#### Important

- **Plain text with `\n` will NOT render correctly** - Use `<br>` or `<p>` tags for line breaks
- Dangerous tags like `<script>`, `<iframe>`, `<form>` are automatically removed
- Event handler attributes (onclick, onmouseover, etc.) are stripped

### Usage Examples

#### Create a workspace and board

```
AI: Create a workspace called "Project Alpha" with slug "project-alpha"

Tool: workspace.create
Input: { "name": "Project Alpha", "slug": "project-alpha" }
Output: { "publicId": "ws_xxx", "name": "Project Alpha", "slug": "project-alpha", ... }

AI: Now create a board called "Sprint 1" in that workspace

Tool: board.create
Input: { "workspacePublicId": "ws_xxx", "name": "Sprint 1", "slug": "sprint-1", "visibility": "private" }
Output: { "publicId": "brd_xxx", "name": "Sprint 1", ... }
```

#### Manage cards with labels and checklists

```
AI: Add a card called "Implement login" to the Sprint 1 board, add the "backend" label, and create a checklist with "Design DB schema" and "Write auth middleware"

Tool: card.create
Input: { "listPublicId": "lst_xxx", "title": "Implement login" }

Tool: card.addLabel
Input: { "cardPublicId": "card_xxx", "labelPublicId": "lbl_backend" }

Tool: checklist.create
Input: { "cardPublicId": "card_xxx", "name": "Tasks" }

Tool: checklist.addItem
Input: { "checklistPublicId": "chk_xxx", "title": "Design DB schema" }

Tool: checklist.addItem
Input: { "checklistPublicId": "chk_xxx", "title": "Write auth middleware" }
```

#### Search and update

```
AI: Find all cards with "login" in the title and update their priority to high

Tool: workspace.search
Input: { "query": "login" }
Output: { "boards": [...], "cards": [{ "publicId": "card_xxx", "title": "Implement login", ... }] }

Tool: card.update
Input: { "publicId": "card_xxx", "priority": "high" }
```

### Test Coverage

```
------------------------|---------|---------|-------------------
File                    | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|---------|-------------------
All files               |   86.50 |   89.09 |
 src/client.ts          |   87.50 |  100.00 |
 src/errors.ts          |   40.00 |   48.78 | 1-7,11-12,17-29
 src/tools/board.ts     |  100.00 |  100.00 |
 src/tools/card.ts      |  100.00 |  100.00 |
 src/tools/checklist.ts |  100.00 |  100.00 |
 src/tools/comment.ts   |  100.00 |  100.00 |
 src/tools/label.ts     |  100.00 |  100.00 |
 src/tools/list.ts      |  100.00 |  100.00 |
 src/tools/server.ts    |  100.00 |   97.73 |
 src/tools/workspace.ts |  100.00 |  100.00 |
 src/types.ts           |  100.00 |  100.00 |
------------------------|---------|---------|-------------------
```

### Architecture

```
kan-mcp/
├── src/
│   ├── index.ts           # MCP server entry, tool & resource registration
│   ├── client.ts          # Kan API client with error mapping
│   ├── types.ts           # Branded IDs, discriminated unions
│   ├── errors.ts          # KanApiError, McpError, error mapping
│   ├── utils.ts           # Type guards, builders
│   └── tools/
│       ├── server.ts      # Server-level tools (health check)
│       ├── resources.ts   # MCP resource handlers
│       ├── workspace.ts   # Workspace tools
│       ├── board.ts       # Board tools
│       ├── list.ts        # List tools
│       ├── card.ts        # Card tools
│       ├── label.ts       # Label tools
│       ├── checklist.ts   # Checklist tools
│       └── comment.ts     # Comment tools
└── tests/
    ├── setup.ts
    └── tools/             # Unit tests per domain
```

### Type Safety

kan-mcp uses TypeScript strict mode with:

- **Branded types** for IDs (WorkspaceId, BoardId, CardId, etc.) to prevent mixing
- **Discriminated unions** for API responses and tool results
- **Const assertions** for routes and enums

### License

MIT

---

## Español

Un servidor de Model Context Protocol (MCP) que expone la API REST de [Kan.bn](https://kan.bn) como herramientas para asistentes de IA. Construido con Node.js + TypeScript.

### Resumen

kan-mcp expone más de 40 herramientas en 7 dominios para gestionar workspaces de Kan.bn, además de Recursos MCP para operaciones de lectura eficientes:

| Dominio    | Herramientas | Descripción                              |
|------------|--------------|------------------------------------------|
| workspace  | 9            | Listar, buscar, crear, obtener, actualizar, eliminar workspaces |
| board      | 8            | Gestionar boards con verificación de disponibilidad de slug |
| list       | 3            | Crear, actualizar, eliminar listas       |
| card       | 10           | Gestión completa de cards con labels, miembros y actividades |
| label      | 4            | Crear y gestionar labels de colores      |
| checklist  | 6            | Gestión de checklists con ítems          |
| comment    | 3            | Comentarios de cards                     |
| **Recursos** | **3**       | **URIs de solo lectura para carga eficiente de contexto** |

### Inicio Rápido

```bash
# Instalar (para desarrollo)
npm install

# Ejecutar tests
npm test

# Compilar para distribución
npm run build
```

### Configuración

kan-mcp requiere una API key de Kan.bn:

```bash
export KAN_API_KEY=tu_api_key_aqui
npm run build && node dist/index.js
```

Opcional: Configurar una URL base personalizada:

```bash
export KAN_API_BASE_URL=https://kan.tools.pugcasa.com/api/v1
```

### Instalación

Instalar una vez con npx (sin necesidad de clonar):

```bash
npx kanbn-mcp
```

O instalar globalmente:

```bash
npm install -g kanbn-mcp
```

### Configuración del Servidor MCP

> **Nota:** El formato de configuración es el mismo para todos los agentes/IDEs. Revisa la documentación de tu agente/IDE para saber dónde añadir este JSON.

Añade esto a la configuración del servidor MCP de tu agente/IDE:

```json
{
  "mcpServers": {
    "kan": {
      "command": "npx",
      "args": ["-y", "kanbn-mcp"],
      "env": {
        "KAN_API_KEY": "kan_tu_api_key_aqui"
      }
    }
  }
}
```

#### Dónde añadir la configuración

| Agente/IDE | Ubicación |
|------------|-----------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | Settings → MCP → Add new server |
| VS Code con Copilot | `.vscode/mcp.json` |
| Roo (CLINE) | Tus ajustes globales de MCP |

### Herramientas Disponibles

#### Herramientas de Workspace

```
workspace.list                    # Listar todos los workspaces
workspace.findByName              # Buscar workspace por nombre (sin distinguir mayúsculas)
workspace.create                  # Crear un nuevo workspace
workspace.getById                 # Obtener workspace por ID
workspace.getBySlug               # Obtener workspace por slug
workspace.update                  # Actualizar propiedades del workspace
workspace.delete                  # Eliminar un workspace
workspace.search                  # Buscar boards y cards
workspace.checkSlugAvailability   # Comprobar si un slug está disponible
```

#### Herramientas de Board

```
board.list                       # Listar boards (con filtros)
board.create                     # Crear un nuevo board
board.getById                    # Obtener board por ID (con filtros de cards)
board.getBySlug                  # Obtener board por slug (con filtros de cards)
board.findByName                 # Buscar board por workspace + nombre del board
board.update                     # Actualizar propiedades del board
board.delete                     # Eliminar un board
board.checkSlugAvailability      # Comprobar si un slug está disponible
```

##### Filtrado de Boards
`board.getById` y `board.getBySlug` permiten filtrar las cards dentro del board:

| Parámetro | Descripción |
|-----------|-------------|
| `members` | Filtrar cards por IDs de miembros asignados |
| `labels` | Filtrar cards por IDs de labels |
| `lists` | Filtrar cards por IDs de listas |
| `dueDateFilters` | Filtrar por estado de fecha de vencimiento: `overdue`, `today`, `tomorrow`, `next-week`, `next-month`, `no-due-date` |
| `type` | Filtrar por tipo de board: `regular`, `template` |

#### Herramientas de Lista

```
list.create                      # Crear una nueva lista
list.update                      # Actualizar propiedades de la lista
list.delete                      # Eliminar una lista
```

#### Herramientas de Card

```
card.create                      # Crear una nueva card
card.getById                     # Obtener card por ID
card.duplicate                   # Duplicar una card a la misma u otra lista
card.update                      # Actualizar propiedades de la card
card.delete                      # Eliminar una card
card.addLabel                    # Añadir label a la card
card.removeLabel                 # Quitar label de la card
card.addMember                   # Añadir miembro a la card
card.removeMember                # Quitar miembro de la card
card.listActivities              # Listar actividades de la card (con paginación por cursor)
```

#### Herramientas de Label

```
label.create                     # Crear un nuevo label
label.getById                    # Obtener label por ID
label.update                     # Actualizar propiedades del label
label.delete                     # Eliminar un label
```

#### Herramientas de Checklist

```
checklist.create                 # Crear checklist en una card
checklist.update                 # Actualizar propiedades del checklist
checklist.delete                 # Eliminar un checklist
checklist.addItem                # Añadir ítem al checklist
checklist.updateItem             # Actualizar ítem del checklist
checklist.deleteItem             # Eliminar ítem del checklist
```

#### Herramientas de Comentarios

```
comment.add                      # Añadir comentario a una card
comment.update                   # Actualizar comentario
comment.delete                   # Eliminar un comentario
```

#### Herramientas de Servidor

```
server.health                    # Comprobar la salud del servidor MCP y sus dependencias
```

#### Recursos MCP

Los Recursos MCP proporcionan URIs de datos de solo lectura para cargar contexto de forma eficiente. A diferencia de las herramientas (que requieren una acción), los recursos permiten al LLM leer datos directamente vía URI.

```
kan://stats                                    # Estadísticas de la aplicación
kan://board/{boardPublicId}                   # Board por ID público
kan://workspace/{workspaceSlug}/board/{boardSlug}  # Board por slug
```

##### Paginación de Actividades de Card
`card.listActivities` soporta paginación basada en cursor:

| Parámetro | Descripción |
|-----------|-------------|
| `limit` | Número de actividades (1-100, por defecto 10) |
| `cursor` | Cursor de marca de tiempo ISO para la siguiente página |

La respuesta incluye `hasMore` y `nextCursor` para iterar fácilmente.

### Soporte de Texto Enriquecido / HTML

Las descripciones de cards y el contenido de comentarios soportan formato HTML. La API sanitiza automáticamente el HTML para prevenir ataques XSS, permitiendo solo etiquetas y atributos seguros.

#### Etiquetas HTML Soportadas

- `<p>...</p>` - Párrafos
- `<br>` - Saltos de línea
- `<strong>`, `<em>`, `<b>`, `<i>`, `<u>` - Formato de texto
- `<a href="...">...</a>` - Enlaces (las URLs javascript: y data: están bloqueadas)
- `<ul>`, `<ol>`, `<li>` - Listas
- `<h1>` hasta `<h6>` - Encabezados

#### Ejemplo

```html
<p>Salary: $156,400 - $225,000</p>
<p>Location: Washington, DC area (Hybrid)</p>
<p>Tech Stack: Python, Java, Spark, BigQuery, Kafka, AWS</p>
<p><a href="https://linkedin.com/jobs/123">View on LinkedIn</a></p>
```

#### Importante

- **El texto plano con `\n` NO se renderizará correctamente** - Usa etiquetas `<br>` o `<p>` para los saltos de línea
- Las etiquetas peligrosas como `<script>`, `<iframe>`, `<form>` se eliminan automáticamente
- Los atributos de manejadores de eventos (onclick, onmouseover, etc.) se eliminan

### Ejemplos de Uso

#### Crear un workspace y un board

```
AI: Crea un workspace llamado "Project Alpha" con slug "project-alpha"

Tool: workspace.create
Input: { "name": "Project Alpha", "slug": "project-alpha" }
Output: { "publicId": "ws_xxx", "name": "Project Alpha", "slug": "project-alpha", ... }

AI: Ahora crea un board llamado "Sprint 1" en ese workspace

Tool: board.create
Input: { "workspacePublicId": "ws_xxx", "name": "Sprint 1", "slug": "sprint-1", "visibility": "private" }
Output: { "publicId": "brd_xxx", "name": "Sprint 1", ... }
```

#### Gestionar cards con labels y checklists

```
AI: Añade una card llamada "Implement login" al board Sprint 1, añade el label "backend" y crea un checklist con "Design DB schema" y "Write auth middleware"

Tool: card.create
Input: { "listPublicId": "lst_xxx", "title": "Implement login" }

Tool: card.addLabel
Input: { "cardPublicId": "card_xxx", "labelPublicId": "lbl_backend" }

Tool: checklist.create
Input: { "cardPublicId": "card_xxx", "name": "Tasks" }

Tool: checklist.addItem
Input: { "checklistPublicId": "chk_xxx", "title": "Design DB schema" }

Tool: checklist.addItem
Input: { "checklistPublicId": "chk_xxx", "title": "Write auth middleware" }
```

#### Buscar y actualizar

```
AI: Encuentra todas las cards con "login" en el título y actualiza su prioridad a alta

Tool: workspace.search
Input: { "query": "login" }
Output: { "boards": [...], "cards": [{ "publicId": "card_xxx", "title": "Implement login", ... }] }

Tool: card.update
Input: { "publicId": "card_xxx", "priority": "high" }
```

### Cobertura de Tests

```
------------------------|---------|---------|-------------------
File                    | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|---------|-------------------
All files               |   86.50 |   89.09 |
 src/client.ts          |   87.50 |  100.00 |
 src/errors.ts          |   40.00 |   48.78 | 1-7,11-12,17-29
 src/tools/board.ts     |  100.00 |  100.00 |
 src/tools/card.ts      |  100.00 |  100.00 |
 src/tools/checklist.ts |  100.00 |  100.00 |
 src/tools/comment.ts   |  100.00 |  100.00 |
 src/tools/label.ts     |  100.00 |  100.00 |
 src/tools/list.ts      |  100.00 |  100.00 |
 src/tools/server.ts    |  100.00 |   97.73 |
 src/tools/workspace.ts |  100.00 |  100.00 |
 src/types.ts           |  100.00 |  100.00 |
------------------------|---------|---------|-------------------
```

### Arquitectura

```
kan-mcp/
├── src/
│   ├── index.ts           # Entrada del servidor MCP, registro de tools y recursos
│   ├── client.ts          # Cliente de la API Kan con mapeo de errores
│   ├── types.ts           # IDs con marca, uniones discriminadas
│   ├── errors.ts          # KanApiError, McpError, mapeo de errores
│   ├── utils.ts           # Type guards, builders
│   └── tools/
│       ├── server.ts      # Tools de nivel servidor (health check)
│       ├── resources.ts   # Manejadores de recursos MCP
│       ├── workspace.ts   # Tools de workspace
│       ├── board.ts       # Tools de board
│       ├── list.ts        # Tools de lista
│       ├── card.ts        # Tools de card
│       ├── label.ts       # Tools de label
│       ├── checklist.ts   # Tools de checklist
│       └── comment.ts     # Tools de comentarios
└── tests/
    ├── setup.ts
    └── tools/             # Tests unitarios por dominio
```

### Seguridad de Tipos

kan-mcp usa el modo estricto de TypeScript con:

- **Tipos con marca** para IDs (WorkspaceId, BoardId, CardId, etc.) para evitar mezclarlos
- **Uniones discriminadas** para respuestas de API y resultados de tools
- **Aserciones const** para rutas y enums

### Licencia

MIT