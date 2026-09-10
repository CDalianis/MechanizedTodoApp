# Mechanized Todo

A playful, mechanical todo list inspired by [Simone Giertz](https://simonegiertz.com/)'s delightfully over-engineered contraptions. Instead of staring at a plain checklist, you add chores to a spinning wheel, pull a lever to randomly pick one, and watch finished tasks stack up on a rack like a tiny factory line.

The app pairs a **FastAPI** backend with a **vanilla JavaScript** frontend styled to look like a physical machine: helical pole, chore wheel, lever, and finished-task rack.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Frontend Behavior](#frontend-behavior)
- [Styling & Design](#styling--design)
- [Limitations & Notes](#limitations--notes)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Future Ideas](#future-ideas)

---

## Features

- **Add chores** — Create tasks with titles up to 120 characters.
- **Random selection** — Pull the lever to spin the wheel and pick a random active chore.
- **Mark finished** — Complete the selected task; it moves from the wheel to the finished rack.
- **Delete chores** — Remove active tasks you no longer need (with a × button in the list).
- **Live stats** — Header counters show remaining and finished task counts.
- **Mechanical UI** — Animated wheel spin, traveling pin on the helical column, and slat-drop animation on the finished rack.
- **Responsive layout** — Two-column desktop layout collapses to a single column on smaller screens.

---

## How It Works

1. **Add** one or more chores in the control panel.
2. Each active chore appears as a card on the **spinning wheel**.
3. Click **Pull lever to spin** — the wheel rotates (purely visual animation) while the server randomly selects one active todo.
4. The selected chore is highlighted on the wheel and shown in the **Selected chore** card.
5. Click **Mark finished** — the chore is marked complete, removed from the wheel, and added to the **FINISHED** rack (and the finished list).
6. Repeat until every chore is done.

The wheel animation is client-side for delight; the actual random pick happens on the server via `POST /api/todos/spin`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | [FastAPI](https://fastapi.tiangolo.com/) 0.115 |
| ASGI server | [Uvicorn](https://www.uvicorn.org/) 0.34 |
| Templating | [Jinja2](https://jinja.palletsprojects.com/) 3.1 |
| Validation | [Pydantic](https://docs.pydantic.dev/) (via FastAPI) |
| Frontend | Vanilla HTML, CSS, JavaScript (no build step) |
| Fonts | [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (Google Fonts) |

---

## Project Structure

```
MechanizedTodoApp/
├── main.py                 # FastAPI app, routes, in-memory todo store
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main page (machine UI + control panel)
└── static/
    ├── app.js              # Client state, API calls, rendering, animations
    └── style.css           # Mechanical aesthetic, layout, animations
```

---

## Prerequisites

- **Python 3.10+** (3.11 or 3.12 recommended; uses `str | None` union syntax in type hints)
- **pip** for installing dependencies
- A modern web browser (Chrome, Firefox, Safari, Edge)

---

## Installation

### 1. Clone or download the project

```bash
git clone <your-repo-url>
cd MechanizedTodoApp
```

### 2. Create a virtual environment (recommended)

**Windows (PowerShell):**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**Windows (Git Bash / cmd):**

```bash
python -m venv .venv
source .venv/Scripts/activate
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs:

- `fastapi` — web framework and API
- `uvicorn[standard]` — ASGI server with performance extras
- `jinja2` — HTML template rendering
- `python-multipart` — form/multipart support (FastAPI ecosystem dependency)

---

## Running the App

From the project root (with your virtual environment activated):

```bash
uvicorn main:app --reload
```

| Flag | Purpose |
|------|---------|
| `main:app` | Import the `app` object from `main.py` |
| `--reload` | Auto-restart on code changes (development only) |

Open your browser to:

**http://127.0.0.1:8000**

### Production-style run (no auto-reload)

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Interactive API docs

FastAPI generates OpenAPI documentation automatically:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

---

## Usage Guide

### Adding a chore

1. Type a task in the **Add a chore** input (e.g. "Do the dishes").
2. Press **Add** or Enter.
3. The chore appears in **Active chores** and as a card on the wheel.

### Spinning for a random chore

1. Ensure at least one active chore exists (the lever is disabled when the list is empty).
2. Click **Pull lever to spin**.
3. Wait for the ~2.2 second animation to finish.
4. The selected task appears under **Selected chore**.

### Completing a chore

1. After a spin, click **Mark finished** on the selected task.
2. The card animates off the wheel; the task moves to **Finished** and the rack on the machine.

### Removing a chore

- Click the **×** next to any item in **Active chores** to delete it without completing.

### Empty states

- No active chores → lever disabled; wheel empty.
- No selection yet → "Pull the lever to pick a random task."
- No finished chores → "Nothing finished yet." on the finished list and rack.

---

## API Reference

Base URL: `http://127.0.0.1:8000`

All JSON request bodies use `Content-Type: application/json`.

### `GET /`

Serves the main HTML page (`templates/index.html`).

---

### `GET /api/todos`

List all todos, split by status.

**Response `200`:**

```json
{
  "active": [
    { "id": "uuid-string", "title": "Do the dishes", "status": "active" }
  ],
  "finished": [
    { "id": "uuid-string", "title": "Take out trash", "status": "finished" }
  ]
}
```

---

### `POST /api/todos`

Create a new active todo.

**Request body:**

```json
{
  "title": "Vacuum the living room"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | Required, 1–120 characters (whitespace trimmed server-side) |

**Response `201`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Vacuum the living room",
  "status": "active"
}
```

**Errors:**

- `422` — Validation error (empty title, too long, etc.)

---

### `POST /api/todos/spin`

Randomly select one **active** todo. Does not change todo status.

**Request body:** none

**Response `200` (chores available):**

```json
{
  "todo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Do the dishes",
    "status": "active"
  },
  "remaining": 3
}
```

**Response `200` (no active chores):**

```json
{
  "todo": null,
  "remaining": 0
}
```

Selection uses Python's `random.choice()` over the active list — uniform distribution among active items.

---

### `POST /api/todos/{todo_id}/complete`

Mark an active todo as finished.

**Path parameter:** `todo_id` — UUID string

**Response `200`:**

```json
{
  "todo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Do the dishes",
    "status": "finished"
  },
  "remaining": 2
}
```

**Errors:**

- `404` — Todo not found
- `400` — Todo already finished

---

### `DELETE /api/todos/{todo_id}`

Permanently delete a todo (active or finished).

**Response `200`:**

```json
{
  "ok": true
}
```

**Errors:**

- `404` — Todo not found

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  index.html  +  style.css  +  app.js                        │
│       │              │            │                         │
│       │              │            └── fetch() → REST API    │
│       └──────────────┴── static files via /static           │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────┐
│                     FastAPI (main.py)                       │
│  GET  /              → Jinja2 template                      │
│  GET  /api/todos     → list active + finished               │
│  POST /api/todos     → create                               │
│  POST /api/todos/spin → random active pick                  │
│  POST /api/.../complete → status → finished                 │
│  DELETE /api/...     → remove from store                     │
│                                                             │
│  In-memory dict: todos[id] = { id, title, status }          │
└─────────────────────────────────────────────────────────────┘
```

### Data model

Each todo is stored as:

| Field | Type | Values |
|-------|------|--------|
| `id` | string | UUID v4 |
| `title` | string | User-provided, trimmed |
| `status` | string | `"active"` or `"finished"` |

Storage is a module-level Python dictionary (`todos: dict[str, dict]`). **Data is lost when the server restarts.**

### Pydantic models

- `TodoCreate` — input validation for new todos
- `TodoResponse` — serialized todo in API responses
- `SpinResponse` — spin result with optional todo and remaining count

---

## Frontend Behavior

`static/app.js` maintains client state:

```javascript
{
  active: [],      // active todos from API
  finished: [],    // finished todos from API
  selected: null,  // last spun todo (if still active)
  spinning: false  // lock during animation
}
```

### Key flows

| Action | Client | Server |
|--------|--------|--------|
| Page load | `loadTodos()` | `GET /api/todos` |
| Add chore | `POST` then reload | `POST /api/todos` |
| Spin | Animate wheel, then show result | `POST /api/todos/spin` |
| Complete | Animate card removal, reset wheel rotation | `POST .../complete` |
| Delete | Clear selection if needed, reload | `DELETE /api/todos/{id}` |

### Wheel rendering

Active todos are placed evenly around a circle (`360 / count` degrees apart). Each card is rotated and translated outward from the wheel hub. The selected todo gets a `.highlight` class (red border glow).

### Spin animation

- Wheel rotates `4–7` full turns plus a random offset over **2.2 seconds**.
- Helical pin animates from top to bottom (CSS `@keyframes pin-travel`).
- Server pick is requested at spin start; UI waits for both API response and animation timing.

### Complete animation

- Selected card gets `.removing` (fade + scale down).
- After 400ms, wheel rotation resets to `0deg` and lists reload.

---

## Styling & Design

The UI uses a dark, workshop-inspired palette defined in CSS custom properties (`:root` in `style.css`):

- Warm wood and plastic tones for the machine
- Red accent (`#c0392b`) for the lever, pointer, and highlights
- Green tones for finished items

**Layout:**

- Desktop: machine panel (left) + control panel (right), max width 1200px
- Mobile (`max-width: 900px`): single column stack

**Accessibility notes:**

- Machine section has `aria-label="Mechanical chore wheel"`
- Decorative SVG/elements use `aria-hidden="true"`
- Form inputs use standard labels and `required` validation

---

## Limitations & Notes

| Topic | Detail |
|-------|--------|
| **Persistence** | Todos live in memory only. Restarting Uvicorn clears all data. |
| **Concurrency** | Single-process in-memory store; not safe for multi-worker production without external storage. |
| **Authentication** | None — local toy app, no users or sessions. |
| **Spin vs. animation** | The visual wheel landing position is not synced to the server-chosen item; the highlight shows the true selection after the spin. |
| **Finished todos** | Cannot be re-activated or deleted from the UI (delete API exists but no UI button for finished items). |

---

## Development

### Auto-reload

Use `uvicorn main:app --reload` while editing `main.py`. Changes to `static/` and `templates/` are picked up on browser refresh (templates may require server reload depending on caching).

### Adding persistence

To keep todos across restarts, replace the in-memory `todos` dict with:

- SQLite via SQLAlchemy or `aiosqlite`
- JSON file read/write on each mutation
- Redis or any external store

The API shape can stay the same; only the storage layer in `main.py` would change.

### Running on a different port

```bash
uvicorn main:app --reload --port 3000
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'fastapi'` | Activate venv and run `pip install -r requirements.txt` |
| Port 8000 already in use | Use `--port 8001` (or another free port) |
| Page loads but styles/scripts 404 | Ensure you run Uvicorn from the project root where `main.py` lives |
| Lever stays disabled | Add at least one chore to the active list |
| Todos disappeared | Server was restarted — data is in-memory only |
| `422` on create | Title empty or longer than 120 characters |

---

## Future Ideas

- Persist todos to SQLite or a JSON file
- Undo / restore finished chores
- Sound effects on lever pull and completion
- Sync wheel stop position with the selected chore index
- Export/import chore lists
- Docker image for one-command deployment
- Unit tests for API routes and spin logic

---

## License

No license file is included in this repository. Add one if you plan to distribute or open-source the project.

---

**Built for people who prefer their productivity tools to look like questionable robotics experiments.**
