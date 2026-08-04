// Exam 2 review map app — loaded by exam2-review-map.html
// Depends on REVIEW, HOMEWORK, PROBLEMS from exam2-review-map-data.js

const STATE_FILE = "exam2-review-map-state.json";
const ADDED_STORAGE_KEY = "exam2-review-map-added";
const REMOVED_STORAGE_KEY = "exam2-review-map-removed";

let selectedId = "3.3";
let viewMode = "section";
let addedToReview = new Set(JSON.parse(localStorage.getItem(ADDED_STORAGE_KEY) || "[]"));
let removedFromReview = new Set(JSON.parse(localStorage.getItem(REMOVED_STORAGE_KEY) || "[]"));

function setSyncStatus(msg) {
  const el = document.getElementById("sync-status");
  if (el) el.textContent = msg;
}

function saveAddedToReview() {
  localStorage.setItem(ADDED_STORAGE_KEY, JSON.stringify([...addedToReview]));
}
function saveRemovedFromReview() {
  localStorage.setItem(REMOVED_STORAGE_KEY, JSON.stringify([...removedFromReview]));
}

function currentState() {
  return {
    added: [...addedToReview].sort(),
    removed: [...removedFromReview].sort(),
  };
}

function applyState(state, sourceLabel) {
  const added = Array.isArray(state.added) ? state.added : [];
  const removed = Array.isArray(state.removed) ? state.removed : [];
  addedToReview = new Set(added);
  removedFromReview = new Set(removed);
  saveAddedToReview();
  saveRemovedFromReview();
  setSyncStatus(
    "Loaded " + added.length + " added · " + removed.length + " removed from " + sourceLabel + "."
  );
  renderAll();
}

function downloadState() {
  const blob = new Blob([JSON.stringify(currentState(), null, 2) + "\n"], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = STATE_FILE;
  a.click();
  URL.revokeObjectURL(a.href);
  setSyncStatus(
    "Downloaded " + STATE_FILE + " — replace the file in School documents, then commit & push."
  );
}

async function loadStateFromRepo() {
  const res = await fetch(STATE_FILE + "?t=" + Date.now());
  if (!res.ok) throw new Error("HTTP " + res.status);
  applyState(await res.json(), "GitHub file");
}

function hasLocalStateKeys() {
  return (
    localStorage.getItem(ADDED_STORAGE_KEY) !== null ||
    localStorage.getItem(REMOVED_STORAGE_KEY) !== null
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
  renderAll();
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
  renderAll();
}

function restoreRemoved() {
  removedFromReview.clear();
  saveRemovedFromReview();
  setSyncStatus("Restored removed questions locally. Download state for GitHub when ready.");
  renderAll();
}

function isOnReview(id, reviewSet) {
  return (reviewSet.has(id) || addedToReview.has(id)) && !removedFromReview.has(id);
}

function isPlannedAdd(id, reviewSet) {
  return addedToReview.has(id) && !reviewSet.has(id) && !removedFromReview.has(id);
}

function activeReview() {
  return REVIEW.filter((r) => !removedFromReview.has(r.questionId));
}

function reviewForSection(section) {
  return activeReview().filter((r) => r.questionId.startsWith(section + "."));
}

function nativeReviewSet() {
  return new Set(REVIEW.map((r) => r.questionId));
}

function computeComparison(hw) {
  const reviewRows = reviewForSection(hw.section);
  const hwSet = new Set(hw.ids);
  const reviewSet = new Set(reviewRows.map((r) => r.questionId));
  const matched = hw.ids.filter((id) => reviewSet.has(id));
  const planned = hw.ids.filter((id) => isPlannedAdd(id, reviewSet));
  const hwOnly = hw.ids.filter((id) => !isOnReview(id, reviewSet));
  const reviewOnly = reviewRows.filter(
    (r) => !hwSet.has(r.questionId) && !addedToReview.has(r.questionId)
  );
  return { reviewRows, matched, planned, hwOnly, reviewOnly, hwSet, reviewSet };
}

function makeRemoveBtn(id) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-remove";
  btn.textContent = "Remove";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFromReview(id);
  });
  return btn;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function qidMarkup(id) {
  const problem = PROBLEMS[id];
  if (!problem) {
    return '<span class="qid">' + esc(id) + "</span>";
  }
  return (
    '<span class="qid-wrap has-problem" tabindex="0">' +
    '<span class="qid">' +
    esc(id) +
    "</span>" +
    '<span class="problem-tip" role="tooltip">' +
    '<span class="tip-expr">' +
    esc(problem.expr) +
    "</span>" +
    (problem.prompt
      ? '<span class="tip-prompt">' + esc(problem.prompt) + "</span>"
      : "") +
    "</span>" +
    "</span>"
  );
}

function renderLeft() {
  const root = document.getElementById("homework-sections");
  root.innerHTML = "";
  for (const hw of HOMEWORK) {
    const cmp = computeComparison(hw);
    const isActive = hw.id === selectedId;
    const wrap = document.createElement("div");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "section-btn" + (isActive ? " active" : "") + (hw.noHw ? " no-hw" : "");
    btn.innerHTML =
      '<span class="chev">' +
      (isActive ? "▼" : "▶") +
      "</span>" +
      '<span class="label">' +
      esc(hw.label) +
      "</span>" +
      '<span class="counts">' +
      (hw.noHw
        ? "review only"
        : hw.ids.length +
          " hw · " +
          cmp.matched.length +
          " match" +
          (cmp.planned.length ? " · " + cmp.planned.length + " planned" : "")) +
      "</span>";
    btn.addEventListener("click", () => {
      selectedId = selectedId === hw.id ? null : hw.id;
      renderAll();
    });

    const body = document.createElement("div");
    body.className = "section-body" + (isActive ? " open" : "");

    if (hw.noHw) {
      body.innerHTML =
        '<div class="empty-msg">No homework captured for this section.</div>';
    } else if (!isActive) {
      body.innerHTML = "";
    } else {
      for (const id of hw.ids) {
        const nativeMatch = cmp.reviewSet.has(id);
        const planned = isPlannedAdd(id, cmp.reviewSet);
        const row = document.createElement("div");
        row.className =
          "q-row " + (nativeMatch ? "match" : planned ? "added-planned" : "hw-only");

        const qidSlot = document.createElement("div");
        qidSlot.innerHTML = qidMarkup(id);
        row.appendChild(qidSlot.firstElementChild);

        const note = document.createElement("span");
        note.className = "q-note";
        note.textContent = nativeMatch
          ? "Also on Exam 2 Review"
          : planned
            ? "Marked to add to review"
            : "Homework only";
        row.appendChild(note);

        if (!nativeMatch) {
          const addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className = "btn-add-review" + (planned ? " is-added" : "");
          addBtn.textContent = planned ? "Added ✓" : "Add to Review";
          addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleAddToReview(id);
          });
          row.appendChild(addBtn);
        }

        const badge = document.createElement("span");
        badge.className =
          "badge " +
          (nativeMatch ? "badge-match" : planned ? "badge-added" : "badge-hw");
        badge.textContent = nativeMatch ? "match" : planned ? "planned" : "hw only";
        row.appendChild(badge);

        body.appendChild(row);
      }
    }

    wrap.appendChild(btn);
    wrap.appendChild(body);
    root.appendChild(wrap);
  }
}

function renderRight() {
  const hw = HOMEWORK.find((h) => h.id === selectedId);
  if (!hw) {
    document.getElementById("review-summary").textContent =
      "Select a section on the left.";
    document.getElementById("review-list").innerHTML = "";
    return;
  }

  const cmp = computeComparison(hw);
  const summary = document.getElementById("review-summary");
  summary.innerHTML =
    "<strong>Section " +
    esc(hw.section) +
    "</strong> — " +
    '<span style="color:var(--accent2)">' +
    cmp.matched.length +
    " matched</span>" +
    (cmp.planned.length
      ? ' · <span style="color:var(--accent)">' +
        cmp.planned.length +
        " planned</span>"
      : "") +
    " · " +
    cmp.hwOnly.length +
    " homework only · " +
    '<span style="color:var(--warn)">' +
    cmp.reviewOnly.length +
    " review only</span>";

  const list = document.getElementById("review-list");
  list.innerHTML = "";

  const plannedRows = cmp.planned.map((id) => ({
    questionId: id,
    objective: PROBLEMS[id]
      ? PROBLEMS[id].expr + " — " + PROBLEMS[id].prompt
      : "Homework question (marked to add)",
    planned: true,
  }));

  const allRows = [
    ...cmp.reviewRows.filter((r) => cmp.hwSet.has(r.questionId)),
    ...plannedRows,
    ...cmp.reviewOnly,
  ];

  if (allRows.length === 0) {
    list.innerHTML =
      '<div class="empty-msg">No Exam 2 Review questions for section ' +
      esc(hw.section) +
      ".</div>";
    return;
  }

  for (const r of allRows) {
    const isNativeMatch =
      cmp.hwSet.has(r.questionId) && cmp.reviewSet.has(r.questionId) && !r.planned;
    const isPlanned = !!r.planned;
    const row = document.createElement("div");
    row.className =
      "q-row " +
      (isNativeMatch ? "match" : isPlanned ? "added-planned" : "review-only");
    row.innerHTML =
      qidMarkup(r.questionId) +
      '<span class="q-note">' +
      esc(r.objective) +
      "</span>";
    row.appendChild(makeRemoveBtn(r.questionId));
    const badge = document.createElement("span");
    badge.className =
      "badge " +
      (isNativeMatch ? "badge-match" : isPlanned ? "badge-added" : "badge-review");
    badge.textContent = isNativeMatch
      ? "match"
      : isPlanned
        ? "planned"
        : "review only";
    row.appendChild(badge);
    list.appendChild(row);
  }
}

function sectionOf(id) {
  const m = String(id).match(/^(\d+\.\d+)/);
  return m ? m[1] : "other";
}

function sectionLabel(sec) {
  const hw = HOMEWORK.find((h) => h.section === sec);
  return hw ? hw.label : "Section " + sec;
}

function renderFull() {
  const nativeSet = nativeReviewSet();
  const hwIds = new Set(HOMEWORK.flatMap((h) => h.ids));
  const rows = [
    ...activeReview().map((r) => ({
      questionId: r.questionId,
      objective: r.objective,
      planned: false,
      order: r.order,
      section: sectionOf(r.questionId),
    })),
    ...[...addedToReview]
      .filter((id) => !nativeSet.has(id) && !removedFromReview.has(id))
      .map((id) => ({
        questionId: id,
        objective: "",
        planned: true,
        order: 1000,
        section: sectionOf(id),
      })),
  ];

  const sectionOrder = HOMEWORK.map((h) => h.section);
  const bySection = new Map();
  for (const r of rows) {
    if (!bySection.has(r.section)) bySection.set(r.section, []);
    bySection.get(r.section).push(r);
  }
  for (const list of bySection.values()) {
    list.sort(
      (a, b) => a.order - b.order || a.questionId.localeCompare(b.questionId)
    );
  }
  const sections = [
    ...sectionOrder.filter((s) => bySection.has(s)),
    ...[...bySection.keys()].filter((s) => !sectionOrder.includes(s)).sort(),
  ];

  const toolbar = document.getElementById("full-toolbar");
  toolbar.innerHTML =
    "<strong>" +
    rows.length +
    " questions</strong>" +
    " · " +
    sections.length +
    " sections" +
    " · " +
    removedFromReview.size +
    " removed (saved in browser)";
  if (removedFromReview.size) {
    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "btn-restore";
    restoreBtn.textContent = "Restore removed";
    restoreBtn.addEventListener("click", restoreRemoved);
    toolbar.appendChild(restoreBtn);
  }

  const list = document.getElementById("full-list");
  list.innerHTML = "";
  if (!rows.length) {
    list.innerHTML =
      '<div class="empty-msg">No review questions left. Use Restore removed to bring them back.</div>';
    return;
  }
  for (const sec of sections) {
    const group = bySection.get(sec);
    const head = document.createElement("div");
    head.className = "full-section-head";
    head.innerHTML =
      esc(sectionLabel(sec)) +
      " <span>— " +
      group.length +
      " question" +
      (group.length === 1 ? "" : "s") +
      "</span>";
    list.appendChild(head);
    for (const r of group) {
      const onHw = hwIds.has(r.questionId);
      const p = PROBLEMS[r.questionId];
      const note = p
        ? p.expr + (p.prompt ? " — " + p.prompt : "")
        : r.objective || "Problem text not harvested";
      const row = document.createElement("div");
      row.className =
        "q-row " +
        (r.planned ? "added-planned" : onHw ? "match" : "review-only");
      row.innerHTML =
        '<span class="qid">' +
        esc(r.questionId) +
        "</span>" +
        '<span class="q-note">' +
        esc(note) +
        "</span>";
      row.appendChild(makeRemoveBtn(r.questionId));
      const badge = document.createElement("span");
      badge.className =
        "badge " +
        (r.planned ? "badge-added" : onHw ? "badge-match" : "badge-review");
      badge.textContent = r.planned
        ? "planned"
        : onHw
          ? "on homework"
          : "review only";
      row.appendChild(badge);
      list.appendChild(row);
    }
  }
}

function setViewMode(mode) {
  viewMode = mode;
  renderAll();
}

function renderAll() {
  const sectionView = document.getElementById("section-view");
  const fullView = document.getElementById("full-view");
  const tabSection = document.getElementById("tab-section");
  const tabFull = document.getElementById("tab-full");
  const subtitle = document.getElementById("subtitle");
  const isFull = viewMode === "full";

  tabSection.classList.toggle("active", !isFull);
  tabFull.classList.toggle("active", isFull);
  sectionView.classList.toggle("hidden", isFull);
  fullView.classList.toggle("hidden", !isFull);
  subtitle.textContent = isFull
    ? "Full review by section with problem text shown. Remove saves in this browser; download state for GitHub sync."
    : "Click a homework section on the left — the right shows matching Exam 2 Review questions for that section number.";

  if (isFull) renderFull();
  else {
    renderLeft();
    renderRight();
  }
}

function wireSyncControls() {
  document
    .getElementById("btn-download-state")
    .addEventListener("click", downloadState);
  document.getElementById("btn-load-repo").addEventListener("click", () => {
    loadStateFromRepo().catch((err) => {
      setSyncStatus("Could not load " + STATE_FILE + ": " + err.message);
    });
  });
  const input = document.getElementById("import-state-input");
  document.getElementById("btn-import-state").addEventListener("click", () => {
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

async function boot() {
  wireSyncControls();
  document
    .getElementById("tab-section")
    .addEventListener("click", () => setViewMode("section"));
  document
    .getElementById("tab-full")
    .addEventListener("click", () => setViewMode("full"));

  if (!hasLocalStateKeys()) {
    try {
      await loadStateFromRepo();
      return;
    } catch (_) {
      setSyncStatus(
        "No saved browser state and no " +
          STATE_FILE +
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
  renderAll();
}

boot();
