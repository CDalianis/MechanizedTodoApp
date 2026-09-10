const SPIN_DURATION_MS = 2200;

const state = {
  active: [],
  finished: [],
  selected: null,
  spinning: false,
  pointerIndex: -1,
};

const els = {
  taskColumn: document.getElementById("task-column"),
  taskColumnViewport: document.querySelector(".task-column-viewport"),
  taskColumnEmpty: document.getElementById("task-column-empty"),
  taskPointer: document.getElementById("task-pointer"),
  finishedRack: document.getElementById("finished-rack"),
  machineBody: document.querySelector(".machine-body"),
  spinBtn: document.getElementById("spin-btn"),
  addForm: document.getElementById("add-form"),
  todoInput: document.getElementById("todo-input"),
  activeList: document.getElementById("active-list"),
  finishedList: document.getElementById("finished-list"),
  activeEmpty: document.getElementById("active-empty"),
  finishedEmpty: document.getElementById("finished-empty"),
  activeCount: document.getElementById("active-count"),
  finishedCount: document.getElementById("finished-count"),
  selectedEmpty: document.getElementById("selected-empty"),
  selectedTask: document.getElementById("selected-task"),
  selectedTitle: document.getElementById("selected-title"),
  completeBtn: document.getElementById("complete-btn"),
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

async function loadTodos() {
  const data = await api("/api/todos");
  state.active = data.active;
  state.finished = data.finished;
  render();
}

function render() {
  els.activeCount.textContent = state.active.length;
  els.finishedCount.textContent = state.finished.length;

  renderTaskColumn();
  renderRack();
  renderLists();
  updateSpinButton();
  updateSelected();
  positionPointer(state.pointerIndex, false);
}

function renderTaskColumn() {
  els.taskColumn.innerHTML = "";
  const count = state.active.length;
  els.taskColumnEmpty.classList.toggle("hidden", count > 0);

  state.active.forEach((todo, i) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.textContent = todo.title;
    card.dataset.id = todo.id;
    card.dataset.index = String(i);
    if (state.selected?.id === todo.id) {
      card.classList.add("highlight");
    }
    els.taskColumn.appendChild(card);
  });
}

function renderRack() {
  els.finishedRack.innerHTML = "";
  state.finished.forEach((todo) => {
    const slat = document.createElement("div");
    slat.className = "rack-slat";
    const label = document.createElement("span");
    label.textContent = todo.title;
    slat.appendChild(label);
    els.finishedRack.appendChild(slat);
  });
}

function renderLists() {
  els.activeList.innerHTML = "";
  els.finishedList.innerHTML = "";

  state.active.forEach((todo) => {
    els.activeList.appendChild(makeListItem(todo, false));
  });
  state.finished.forEach((todo) => {
    els.finishedList.appendChild(makeListItem(todo, true));
  });

  els.activeEmpty.classList.toggle("hidden", state.active.length > 0);
  els.finishedEmpty.classList.toggle("hidden", state.finished.length > 0);
}

function makeListItem(todo, finished) {
  const li = document.createElement("li");
  li.textContent = todo.title;
  if (!finished) {
    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.type = "button";
    btn.title = "Remove";
    btn.textContent = "×";
    btn.addEventListener("click", () => deleteTodo(todo.id));
    li.appendChild(btn);
  }
  return li;
}

function getCardCenterY(index) {
  const cards = els.taskColumn.querySelectorAll(".task-card");
  const card = cards[index];
  if (!card || !els.taskColumnViewport) return 0;

  const cardRect = card.getBoundingClientRect();
  const viewportRect = els.taskColumnViewport.getBoundingClientRect();
  return cardRect.top - viewportRect.top + cardRect.height / 2;
}

function positionPointer(index, animate) {
  if (index < 0 || state.active.length === 0) {
    els.taskPointer.style.transform = "translateY(24px) translateY(-50%)";
    els.taskPointer.classList.remove("animating");
    return;
  }

  const y = getCardCenterY(index);
  els.taskPointer.classList.toggle("animating", animate);
  els.taskPointer.style.transform = `translateY(${y}px) translateY(-50%)`;

  const cards = els.taskColumn.querySelectorAll(".task-card");
  const card = cards[index];
  if (card) {
    card.scrollIntoView({ block: "nearest", behavior: animate ? "smooth" : "instant" });
  }
}

function highlightIndex(index) {
  els.taskColumn.querySelectorAll(".task-card").forEach((card, i) => {
    card.classList.toggle("highlight", i === index);
  });
}

function buildPointerPath(count, targetIndex) {
  const steps = Math.min(18 + Math.floor(Math.random() * 8), Math.max(count * 4, 12));
  const path = [];
  let current = 0;
  let direction = 1;

  for (let i = 0; i < steps - 1; i++) {
    path.push(current);
    if (current === count - 1) direction = -1;
    else if (current === 0) direction = 1;
    else if (Math.random() < 0.15) direction *= -1;
    current = Math.max(0, Math.min(count - 1, current + direction));
  }

  path.push(targetIndex);
  return path;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animatePointer(path) {
  const stepMs = SPIN_DURATION_MS / path.length;
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    state.pointerIndex = index;
    const isLast = i === path.length - 1;
    positionPointer(index, !isLast);
    highlightIndex(isLast ? index : -1);
    await wait(stepMs);
  }
}

function updateSpinButton() {
  els.spinBtn.disabled = state.spinning || state.active.length === 0;
}

function updateSelected() {
  const hasSelection = state.selected && state.active.some((t) => t.id === state.selected.id);
  if (!hasSelection) {
    state.selected = null;
  }
  els.selectedEmpty.classList.toggle("hidden", !!state.selected);
  els.selectedTask.classList.toggle("hidden", !state.selected);
  if (state.selected) {
    els.selectedTitle.textContent = state.selected.title;
  }
}

async function addTodo(title) {
  await api("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  await loadTodos();
}

async function deleteTodo(id) {
  await api(`/api/todos/${id}`, { method: "DELETE" });
  if (state.selected?.id === id) state.selected = null;
  state.pointerIndex = -1;
  await loadTodos();
}

async function spin() {
  if (state.spinning || state.active.length === 0) return;

  state.spinning = true;
  updateSpinButton();
  els.spinBtn.classList.add("pulling");
  els.machineBody.classList.add("spinning");
  els.taskPointer.classList.add("scanning");

  try {
    const result = await api("/api/todos/spin", { method: "POST" });
    if (!result.todo) return;

    const targetIndex = state.active.findIndex((t) => t.id === result.todo.id);
    if (targetIndex === -1) return;

    const path = buildPointerPath(state.active.length, targetIndex);
    await animatePointer(path);

    state.selected = result.todo;
    state.pointerIndex = targetIndex;
    highlightIndex(targetIndex);
    updateSelected();
  } finally {
    els.spinBtn.classList.remove("pulling");
    els.machineBody.classList.remove("spinning");
    els.taskPointer.classList.remove("scanning");
    state.spinning = false;
    updateSpinButton();
  }
}

async function completeSelected() {
  if (!state.selected) return;
  const id = state.selected.id;
  const card = els.taskColumn.querySelector(`[data-id="${id}"]`);
  if (card) card.classList.add("removing");

  await api(`/api/todos/${id}/complete`, { method: "POST" });
  state.selected = null;
  state.pointerIndex = -1;

  await wait(400);
  await loadTodos();
}

els.addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.todoInput.value.trim();
  if (!title) return;
  await addTodo(title);
  els.todoInput.value = "";
  els.todoInput.focus();
});

els.spinBtn.addEventListener("click", spin);
els.completeBtn.addEventListener("click", completeSelected);

loadTodos();
