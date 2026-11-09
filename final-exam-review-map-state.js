// Final Review bank — selected pools (Add from exam tabs)
const FINAL_REVIEW_STATE_FILE = "final-exam-review-map-state.json";
const FINAL_REVIEW_GROUPS_KEY = "final-exam-review-map-groups";

const FINAL_EXAM_IDS_KEY = "final-exam-review-map-final-exam";

let finalGroups = loadFinalGroups();
let finalExamIds = loadFinalExamIds();
let selectedFinalId = null;

function normalizeFinalExamIds(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(String).filter(Boolean);
}

function hasLocalFinalExamIds() {
  return localStorage.getItem(FINAL_EXAM_IDS_KEY) != null;
}

function loadFinalExamIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(FINAL_EXAM_IDS_KEY) || "null");
    if (raw != null) return normalizeFinalExamIds(raw);
  } catch (_) {
    /* ignore */
  }
  return [];
}

function saveFinalExamIds() {
  localStorage.setItem(FINAL_EXAM_IDS_KEY, JSON.stringify(finalExamIds));
}

function normalizeFinalGroups(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((group) => (Array.isArray(group) ? group.map(String).filter(Boolean) : []))
    .filter((group) => group.length);
}

function hasLocalFinalGroups() {
  return localStorage.getItem(FINAL_REVIEW_GROUPS_KEY) != null;
}

function loadFinalGroups() {
  try {
    const raw = JSON.parse(localStorage.getItem(FINAL_REVIEW_GROUPS_KEY) || "null");
    if (raw != null) return normalizeFinalGroups(raw);
  } catch (_) {
    /* ignore */
  }
  return [];
}

function saveFinalGroups() {
  localStorage.setItem(FINAL_REVIEW_GROUPS_KEY, JSON.stringify(finalGroups));
}

function currentFinalState() {
  return { examGroups: finalGroups, finalExam: finalExamIds };
}

function setSyncStatus(msg) {
  const el = document.getElementById("sync-status");
  if (el) el.textContent = msg;
}

function notifyFinalStateChange() {
  if (typeof window.renderFinalReviewBank === "function") window.renderFinalReviewBank();
}

function applyFinalState(state, sourceLabel) {
  finalGroups = normalizeFinalGroups(state && state.examGroups);
  finalExamIds = normalizeFinalExamIds(state && state.finalExam);
  saveFinalGroups();
  saveFinalExamIds();
  const n = finalGroups.length;
  setSyncStatus(
    "Loaded " + n + " final-review pool" + (n === 1 ? "" : "s") + " and " +
      finalExamIds.length + " final-exam problem" + (finalExamIds.length === 1 ? "" : "s") +
      " from " + sourceLabel + "."
  );
  notifyFinalStateChange();
}

function downloadFinalState() {
  const blob = new Blob([JSON.stringify(currentFinalState(), null, 2) + "\n"], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = FINAL_REVIEW_STATE_FILE;
  a.click();
  URL.revokeObjectURL(a.href);
  setSyncStatus(
    "Downloaded " +
      FINAL_REVIEW_STATE_FILE +
      " — replace the file in School documents, then commit & push."
  );
}

async function fetchFinalStateFromRepo() {
  const res = await fetch(FINAL_REVIEW_STATE_FILE + "?t=" + Date.now());
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function loadFinalStateFromRepo() {
  const state = await fetchFinalStateFromRepo();
  applyFinalState(state, "repo file");
}

function importFinalStateFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyFinalState(JSON.parse(String(reader.result || "{}")), "imported file");
    } catch (err) {
      setSyncStatus("Import failed: " + (err && err.message ? err.message : String(err)));
    }
  };
  reader.readAsText(file);
}

async function bootstrapFinalReviewState() {
  let repoState = null;
  try {
    repoState = await fetchFinalStateFromRepo();
  } catch (_) {
    repoState = { examGroups: [], finalExam: [] };
  }
  if (!hasLocalFinalGroups() || !finalGroups.length) {
    applyFinalState(repoState, "repo file");
    return;
  }
  if (!hasLocalFinalExamIds() && repoState.finalExam) {
    finalExamIds = normalizeFinalExamIds(repoState.finalExam);
    saveFinalExamIds();
  }
  setSyncStatus(
    "Using browser Final Review pools (" +
      finalGroups.length +
      "). Load from repo to replace."
  );
}

function wireFinalSyncBar() {
  const loadBtn = document.getElementById("btn-load-repo");
  const dlBtn = document.getElementById("btn-download-state");
  const importInput = document.getElementById("import-state-file");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      loadFinalStateFromRepo().catch((err) => {
        setSyncStatus("Load failed: " + (err && err.message ? err.message : String(err)));
      });
    });
  }
  if (dlBtn) dlBtn.addEventListener("click", downloadFinalState);
  if (importInput) {
    importInput.addEventListener("change", () => {
      const file = importInput.files && importInput.files[0];
      if (file) importFinalStateFile(file);
      importInput.value = "";
    });
  }
}
