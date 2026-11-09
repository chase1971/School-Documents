// Exam 4 map — exam pool state (Add to Exam from review)
const EXAM4_STATE_FILE = "exam4-review-map-state.json";
const EXAM4_EXAM_GROUPS_KEY = "exam4-review-map-exam-groups";

let examGroups = loadExamGroups();

function normalizeExamGroups(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((group) => (Array.isArray(group) ? group.map(String).filter(Boolean) : []))
    .filter((group) => group.length);
}

function hasLocalExamGroups() {
  return localStorage.getItem(EXAM4_EXAM_GROUPS_KEY) != null;
}

function loadExamGroups() {
  try {
    const raw = JSON.parse(localStorage.getItem(EXAM4_EXAM_GROUPS_KEY) || "null");
    if (raw != null) return normalizeExamGroups(raw);
  } catch (_) {
    /* ignore */
  }
  return [];
}

function saveExamGroups() {
  localStorage.setItem(EXAM4_EXAM_GROUPS_KEY, JSON.stringify(examGroups));
}

function currentState() {
  return { examGroups: examGroups };
}

function setSyncStatus(msg) {
  const el = document.getElementById("sync-status");
  if (el) el.textContent = msg;
}

function notifyStateChange() {
  if (typeof window.renderExam4 === "function") window.renderExam4();
}

function applyState(state, sourceLabel) {
  examGroups = normalizeExamGroups(state && state.examGroups);
  saveExamGroups();
  const n = examGroups.length;
  setSyncStatus("Loaded " + n + " exam pool" + (n === 1 ? "" : "s") + " from " + sourceLabel + ".");
  notifyStateChange();
}

function downloadState() {
  const blob = new Blob([JSON.stringify(currentState(), null, 2) + "\n"], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = EXAM4_STATE_FILE;
  a.click();
  URL.revokeObjectURL(a.href);
  setSyncStatus(
    "Downloaded " + EXAM4_STATE_FILE + " — replace the file in School documents, then commit & push."
  );
}

async function fetchStateFromRepo() {
  const res = await fetch(EXAM4_STATE_FILE + "?t=" + Date.now());
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function loadStateFromRepo() {
  const state = await fetchStateFromRepo();
  applyState(state, "GitHub file");
}

function importStateFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyState(JSON.parse(String(reader.result || "{}")), "imported file");
    } catch (err) {
      setSyncStatus("Import failed: " + (err && err.message ? err.message : String(err)));
    }
  };
  reader.readAsText(file);
}

async function bootstrapExam4State() {
  let repoState = null;
  try {
    repoState = await fetchStateFromRepo();
  } catch (_) {
    repoState = { examGroups: [] };
  }
  if (!hasLocalExamGroups()) {
    applyState(repoState, "GitHub file");
    return;
  }
  // Keep browser examGroups (ordered edits); only fill if empty and repo has pools
  if (!examGroups.length && repoState.examGroups && repoState.examGroups.length) {
    applyState(repoState, "GitHub file");
  }
}

function wireExam4StateButtons() {
  const dl = document.getElementById("btn-download-state");
  const load = document.getElementById("btn-load-repo");
  const imp = document.getElementById("btn-import-state");
  const file = document.getElementById("import-state-file");
  if (dl) dl.addEventListener("click", downloadState);
  if (load) {
    load.addEventListener("click", () => {
      loadStateFromRepo().catch((err) => {
        setSyncStatus("Load failed: " + (err && err.message ? err.message : String(err)));
      });
    });
  }
  if (imp && file) {
    imp.addEventListener("click", () => file.click());
    file.addEventListener("change", () => {
      if (file.files && file.files[0]) importStateFile(file.files[0]);
      file.value = "";
    });
  }
}
