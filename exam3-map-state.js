// Exam 3 map — review add/remove state and derived review lists
// Depends on HOMEWORK, REVIEW, PROBLEMS, REVIEW_PROBLEMS from exam3-homework-map-data.js

const EXAM3_STATE_FILE = "exam3-review-map-state.json";
const EXAM3_ADDED_KEY = "exam3-review-map-added";
const EXAM3_REMOVED_KEY = "exam3-review-map-removed";

let addedToReview = new Set(JSON.parse(localStorage.getItem(EXAM3_ADDED_KEY) || "[]"));
let removedFromReview = new Set(JSON.parse(localStorage.getItem(EXAM3_REMOVED_KEY) || "[]"));

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sectionOf(id) {
  const m = String(id).match(/^(\d+\.\d+)/);
  return m ? m[1] : "other";
}

function sectionLabel(sec) {
  const hw = HOMEWORK.find((h) => h.id === sec);
  if (hw) return hw.label;
  const rv = REVIEW.find((r) => r.id === sec);
  return rv ? rv.label : "Section " + sec;
}

function setSyncStatus(msg) {
  const el = document.getElementById("sync-status");
  if (el) el.textContent = msg;
}

function saveAddedToReview() {
  localStorage.setItem(EXAM3_ADDED_KEY, JSON.stringify([...addedToReview]));
}

function saveRemovedFromReview() {
  localStorage.setItem(EXAM3_REMOVED_KEY, JSON.stringify([...removedFromReview]));
}

function currentState() {
  return {
    added: [...addedToReview].sort(),
    removed: [...removedFromReview].sort(),
  };
}

function notifyStateChange() {
  if (typeof renderAll === "function") renderAll();
}

function applyState(state, sourceLabel) {
  addedToReview = new Set(Array.isArray(state.added) ? state.added : []);
  removedFromReview = new Set(Array.isArray(state.removed) ? state.removed : []);
  saveAddedToReview();
  saveRemovedFromReview();
  setSyncStatus(
    "Loaded " + addedToReview.size + " added · " + removedFromReview.size + " removed from " + sourceLabel + "."
  );
  notifyStateChange();
}

function downloadState() {
  const blob = new Blob([JSON.stringify(currentState(), null, 2) + "\n"], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = EXAM3_STATE_FILE;
  a.click();
  URL.revokeObjectURL(a.href);
  setSyncStatus(
    "Downloaded " + EXAM3_STATE_FILE + " — replace the file in School documents, then commit & push."
  );
}

async function loadStateFromRepo() {
  const res = await fetch(EXAM3_STATE_FILE + "?t=" + Date.now());
  if (!res.ok) throw new Error("HTTP " + res.status);
  applyState(await res.json(), "GitHub file");
}

function hasLocalStateKeys() {
  return (
    localStorage.getItem(EXAM3_ADDED_KEY) !== null ||
    localStorage.getItem(EXAM3_REMOVED_KEY) !== null
  );
}

function toggleAddToReview(id) {
  if (addedToReview.has(id)) addedToReview.delete(id);
  else {
    addedToReview.add(id);
    removedFromReview.delete(id);
    saveRemovedFromReview();
  }
  saveAddedToReview();
  setSyncStatus("Local change saved in this browser. Download state for GitHub when ready.");
  notifyStateChange();
}

function removeFromReview(id) {
  if (addedToReview.has(id)) {
    addedToReview.delete(id);
    saveAddedToReview();
  } else {
    removedFromReview.add(id);
    saveRemovedFromReview();
  }
  setSyncStatus("Local change saved in this browser. Download state for GitHub when ready.");
  notifyStateChange();
}

function restoreRemoved() {
  removedFromReview.clear();
  saveRemovedFromReview();
  setSyncStatus("Restored removed questions locally. Download state for GitHub when ready.");
  notifyStateChange();
}

function nativeReviewSet() {
  const set = new Set();
  for (const sec of REVIEW) {
    for (const id of sec.ids) set.add(id);
  }
  return set;
}

function isOnReview(id, nativeSet) {
  return (nativeSet.has(id) || addedToReview.has(id)) && !removedFromReview.has(id);
}

function isPlannedAdd(id, nativeSet) {
  return addedToReview.has(id) && !nativeSet.has(id) && !removedFromReview.has(id);
}

function effectiveReviewSections() {
  const bySection = new Map();

  for (const sec of REVIEW) {
    const ids = sec.ids.filter((id) => !removedFromReview.has(id));
    if (ids.length) {
      bySection.set(sec.id, {
        id: sec.id,
        label: sec.label,
        section: sec.section,
        ids: [...ids],
      });
    }
  }

  for (const id of addedToReview) {
    if (removedFromReview.has(id)) continue;
    const sid = sectionOf(id);
    if (!bySection.has(sid)) {
      bySection.set(sid, {
        id: sid,
        label: sectionLabel(sid),
        section: sid,
        ids: [],
      });
    }
    const sec = bySection.get(sid);
    if (!sec.ids.includes(id)) sec.ids.push(id);
  }

  const order = HOMEWORK.map((h) => h.id);
  const result = [];
  for (const id of order) {
    if (bySection.has(id)) result.push(bySection.get(id));
  }
  for (const [id, sec] of bySection) {
    if (!order.includes(id)) result.push(sec);
  }
  return result;
}

function reviewIdsForSection(sectionId) {
  const sec = effectiveReviewSections().find((s) => s.id === sectionId);
  return sec ? sec.ids : [];
}

function computeComparison(hw) {
  const nativeSet = nativeReviewSet();
  const effectiveIds = reviewIdsForSection(hw.section);
  const reviewSet = new Set(effectiveIds);
  const hwSet = new Set(hw.ids);

  const matched = hw.ids.filter(
    (id) => nativeSet.has(id) && reviewSet.has(id) && !removedFromReview.has(id)
  );
  const planned = hw.ids.filter((id) => isPlannedAdd(id, nativeSet));
  const hwOnly = hw.ids.filter((id) => !isOnReview(id, nativeSet));
  const reviewOnly = effectiveIds.filter(
    (id) => !hwSet.has(id) && !addedToReview.has(id)
  );

  return { effectiveIds, matched, planned, hwOnly, reviewOnly, hwSet, reviewSet, nativeSet };
}

function problemFor(id, side) {
  if (side === "rv") {
    return REVIEW_PROBLEMS[id] || PROBLEMS[id] || null;
  }
  return PROBLEMS[id] || null;
}

function summaryFor(id, side) {
  const p = problemFor(id, side);
  if (!p) return "not harvested yet";
  return p.summary || p.prompt || p.expr || "—";
}

function wireSyncControls() {
  const downloadBtn = document.getElementById("btn-download-state");
  const loadBtn = document.getElementById("btn-load-repo");
  const importBtn = document.getElementById("btn-import-state");
  const input = document.getElementById("import-state-input");
  if (!downloadBtn || !loadBtn || !importBtn || !input) return;

  downloadBtn.addEventListener("click", downloadState);
  loadBtn.addEventListener("click", () => {
    loadStateFromRepo().catch((err) => {
      setSyncStatus("Could not load " + EXAM3_STATE_FILE + ": " + err.message);
    });
  });
  importBtn.addEventListener("click", () => {
    input.value = "";
    input.click();
  });
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      applyState(JSON.parse(await file.text()), file.name);
    } catch (err) {
      setSyncStatus("Import failed: " + err.message);
    }
  });
}

async function bootState() {
  wireSyncControls();
  if (!hasLocalStateKeys()) {
    try {
      await loadStateFromRepo();
      return;
    } catch (_) {
      setSyncStatus(
        "No saved browser state and no " +
          EXAM3_STATE_FILE +
          " yet. Edits stay local until you download state."
      );
    }
  } else {
    const s = currentState();
    setSyncStatus(
      "Using this browser: " +
        s.added.length +
        " added · " +
        s.removed.length +
        " removed. Download state for GitHub when ready."
    );
  }
}
