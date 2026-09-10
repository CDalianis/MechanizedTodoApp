import random
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from starlette.requests import Request

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Mechanized Todo")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

todos: dict[str, dict] = {}


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class TodoResponse(BaseModel):
    id: str
    title: str
    status: str


class SpinResponse(BaseModel):
    todo: TodoResponse | None
    remaining: int


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/todos")
async def list_todos():
    active = [t for t in todos.values() if t["status"] == "active"]
    finished = [t for t in todos.values() if t["status"] == "finished"]
    return {
        "active": [_serialize(t) for t in active],
        "finished": [_serialize(t) for t in finished],
    }


@app.post("/api/todos", status_code=201)
async def create_todo(payload: TodoCreate):
    todo_id = str(uuid.uuid4())
    todos[todo_id] = {"id": todo_id, "title": payload.title.strip(), "status": "active"}
    return _serialize(todos[todo_id])


@app.post("/api/todos/spin")
async def spin():
    active = [t for t in todos.values() if t["status"] == "active"]
    if not active:
        return SpinResponse(todo=None, remaining=0)
    chosen = random.choice(active)
    return SpinResponse(todo=_serialize(chosen), remaining=len(active))


@app.post("/api/todos/{todo_id}/complete")
async def complete_todo(todo_id: str):
    todo = todos.get(todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo["status"] == "finished":
        raise HTTPException(status_code=400, detail="Todo already finished")
    todo["status"] = "finished"
    remaining = sum(1 for t in todos.values() if t["status"] == "active")
    return {"todo": _serialize(todo), "remaining": remaining}


@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: str):
    if todo_id not in todos:
        raise HTTPException(status_code=404, detail="Todo not found")
    del todos[todo_id]
    return {"ok": True}


def _serialize(todo: dict) -> TodoResponse:
    return TodoResponse(id=todo["id"], title=todo["title"], status=todo["status"])
