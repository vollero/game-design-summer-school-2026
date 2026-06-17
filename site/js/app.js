const lessonList = document.querySelector("#lessonList");
const lessonStep = document.querySelector("#lessonStep");
const lessonTitle = document.querySelector("#lessonTitle");
const lessonGoal = document.querySelector("#lessonGoal");
const editor = document.querySelector("#codeEditor");
const frame = document.querySelector("#previewFrame");
const runButton = document.querySelector("#runButton");
const resetButton = document.querySelector("#resetButton");
const copyButton = document.querySelector("#copyButton");

const state = {
  lessons: [],
  lesson: null,
  originalCode: "",
  engineCode: "",
};

init();

async function init() {
  const [lessonsResponse, engineResponse] = await Promise.all([
    fetch("./lessons/index.json"),
    fetch("./js/edu-game.js"),
  ]);

  state.lessons = await lessonsResponse.json();
  state.engineCode = await engineResponse.text();
  renderLessonList();
  await selectLesson(state.lessons[0].id);
}

function renderLessonList() {
  lessonList.innerHTML = "";

  state.lessons.forEach((lesson, index) => {
    const button = document.createElement("button");
    button.className = "lesson-button";
    button.type = "button";
    button.dataset.lessonId = lesson.id;
    button.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")}</span>
      <span>
        <strong>${escapeHtml(lesson.title)}</strong>
        <small>${escapeHtml(lesson.short)}</small>
      </span>
    `;
    button.addEventListener("click", () => selectLesson(lesson.id));
    lessonList.append(button);
  });
}

async function selectLesson(id) {
  const lesson = state.lessons.find((item) => item.id === id);
  if (!lesson) return;

  const response = await fetch(`./lessons/${lesson.file}`);
  const code = await response.text();

  state.lesson = lesson;
  state.originalCode = code;
  editor.value = code;

  lessonStep.textContent = `Step ${String(state.lessons.indexOf(lesson) + 1).padStart(2, "0")}`;
  lessonTitle.textContent = lesson.title;
  lessonGoal.textContent = lesson.goal;

  document.querySelectorAll(".lesson-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lessonId === id);
  });

  runCode();
}

function runCode() {
  const userCode = editor.value;
  const safeUserCode = userCode.replace(/<\/script/gi, "<\\/script");
  const safeEngineCode = state.engineCode.replace(/<\/script/gi, "<\\/script");

  frame.srcdoc = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      background: #172033;
      color: #e5e7eb;
      font-family: Inter, system-ui, sans-serif;
    }
    body {
      display: grid;
      place-items: center;
      padding: 16px;
    }
    #stageWrap {
      display: grid;
      gap: 10px;
      width: min(100%, 760px);
    }
    canvas {
      width: 100%;
      max-height: 70vh;
      aspect-ratio: 3 / 2;
      border: 2px solid rgba(255,255,255,0.14);
      border-radius: 8px;
      background: #0f172a;
      image-rendering: pixelated;
    }
    #console {
      min-height: 88px;
      max-height: 160px;
      overflow: auto;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 8px;
      padding: 10px;
      background: rgba(15, 23, 42, 0.78);
      font: 13px/1.45 "SFMono-Regular", Consolas, monospace;
      white-space: pre-wrap;
    }
    #console:empty::before {
      content: "Console pronta";
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div id="stageWrap">
    <canvas id="gameCanvas" width="720" height="480" tabindex="0"></canvas>
    <div id="console" aria-live="polite"></div>
  </div>
  <script>${safeEngineCode}</script>
  <script>
    window.onerror = function (message, source, line, column) {
      log("Errore riga " + line + ": " + message);
    };
  </script>
  <script>${safeUserCode}</script>
  <script>EduGame.start();</script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

runButton.addEventListener("click", runCode);

resetButton.addEventListener("click", () => {
  editor.value = state.originalCode;
  runCode();
});

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(editor.value);
  copyButton.textContent = "Copiato";
  setTimeout(() => {
    copyButton.textContent = "Copia";
  }, 900);
});

editor.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = `${editor.value.slice(0, start)}  ${editor.value.slice(end)}`;
    editor.selectionStart = editor.selectionEnd = start + 2;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    runCode();
  }
});

