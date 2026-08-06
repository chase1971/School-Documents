// Exam 3 map app — homework vs review side-by-side + review tab
// Depends on exam3-homework-map-data.js and exam3-map-state.js

let viewMode = "homework";
let selectedId = null;
let expandedHw = null;
let expandedRv = null;
let expandedExam = null;
let selectedExamId = null;
let examProblems = {};

async function loadExamProblems() {
  try {
    const res = await fetch("exam3-exam-harvest.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const entry = Array.isArray(data) ? data.find((item) => item.requested === "Exam 3") : data;
    examProblems = Object.fromEntries((entry?.problems || []).map((p) => [p.questionId, p]));
  } catch {
    examProblems = {};
  }
}

function examProblemFor(id) {
  return examProblems[id] || REVIEW_PROBLEMS[id] || PROBLEMS[id] || null;
}

function renderProblemBody(container, problem) {
  container.innerHTML = "";
  if (!problem) {
    container.innerHTML = '<div class="empty-msg">Problem text not harvested.</div>';
    return;
  }
  if (problem.parts && problem.parts.length) {
    for (const part of problem.parts) {
      if (part.label && part.label !== "Problem") {
        const lbl = document.createElement("div");
        lbl.className = "detail-part-label";
        lbl.textContent = part.label;
        container.appendChild(lbl);
      }
      const div = document.createElement("div");
      div.className = "detail-full";
      div.textContent = part.text || "";
      container.appendChild(div);
    }
  } else if (problem.fullText) {
    const div = document.createElement("div");
    div.className = "detail-full";
    div.textContent = problem.fullText;
    container.appendChild(div);
  } else {
    const div = document.createElement("div");
    div.className = "detail-full";
    div.textContent = (problem.expr ? problem.expr + "\n" : "") + (problem.prompt || "");
    container.appendChild(div);
  }
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

function buildQBlock(id, side, rowClass, noteText, extraButtons) {
  const block = document.createElement("div");
  block.className = "q-block";

  const head = document.createElement("div");
  head.className = "q-row " + rowClass;
  const isExpanded =
    side === "hw" ? expandedHw === id : side === "exam" ? expandedExam === id : expandedRv === id;
  if (isExpanded) head.classList.add("expanded-head");

  const qid = document.createElement("span");
  qid.className = "qid";
  qid.textContent = displayId(id);
  if (displayId(id) !== id) qid.title = "Raw harvested ID: " + id;
  head.appendChild(qid);

  const note = document.createElement("span");
  note.className = "q-note";
  note.textContent = noteText;
  head.appendChild(note);

  if (extraButtons) {
    for (const btn of extraButtons) head.appendChild(btn);
  }

  head.addEventListener("click", () => {
    if (side === "hw") {
      expandedHw = expandedHw === id ? null : id;
    } else if (side === "exam") {
      expandedExam = expandedExam === id ? null : id;
    } else {
      expandedRv = expandedRv === id ? null : id;
    }
    renderAll();
  });
  head.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    head.click();
  });

  block.appendChild(head);

  const detail = document.createElement("div");
  detail.className = "q-detail" + (isExpanded ? " open" : "");
  if (isExpanded) renderProblemBody(detail, side === "exam" ? examProblemFor(id) : problemFor(id, side));
  block.appendChild(detail);

  return block;
}

function renderHomeworkLeft() {
  const root = document.getElementById("hw-sections");
  root.innerHTML = "";

  for (const hw of effectiveHomeworkSections()) {
    const cmp = computeComparison(hw);
    const isActive = hw.id === selectedId;
    const wrap = document.createElement("div");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "section-btn" + (isActive ? " active" : "");
    btn.innerHTML =
      '<span class="chev">' + (isActive ? "▼" : "▶") + "</span>" +
      '<span class="label">' + esc(hw.label) + "</span>" +
      '<span class="counts">' +
      hw.ids.length +
      " hw · " +
      cmp.matched.length +
      " match" +
      (cmp.planned.length ? " · " + cmp.planned.length + " planned" : "") +
      "</span>";
    btn.addEventListener("click", () => {
      selectedId = selectedId === hw.id ? null : hw.id;
      expandedHw = null;
      expandedRv = null;
      renderAll();
    });

    const body = document.createElement("div");
    body.className = "section-body" + (isActive ? " open" : "");

    if (isActive) {
      for (const id of hw.ids) {
        const planned = isPlannedAdd(id, cmp.nativeSet);
        const nativeMatch = cmp.matched.includes(id);
        const rowClass = nativeMatch ? "match" : planned ? "added-planned" : "hw-only";
        const note = nativeMatch
          ? "Also on Exam 3 Review"
          : planned
            ? "Marked to add to review"
            : summaryFor(id, "hw");

        const extras = [];
        if (!nativeMatch) {
          const addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className = "btn-add-review" + (planned ? " is-added" : "");
          addBtn.textContent = planned ? "Added ✓" : "Add to Review";
          addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleAddToReview(id);
          });
          extras.push(addBtn);
        }
        const removeHwBtn = Object.assign(document.createElement("button"), {
          type: "button", className: "btn-remove", textContent: "Remove HW", title: "Remove from Homework",
        });
        removeHwBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeFromHomework(id);
        });
        extras.push(removeHwBtn);
        const badge = document.createElement("span");
        badge.className =
          "badge " + (nativeMatch ? "badge-match" : planned ? "badge-added" : "badge-hw");
        badge.textContent = nativeMatch ? "match" : planned ? "planned" : "hw only";
        extras.push(badge);

        body.appendChild(buildQBlock(id, "hw", rowClass, note, extras));
      }
    }

    wrap.appendChild(btn);
    wrap.appendChild(body);
    root.appendChild(wrap);
  }
}

function renderHomeworkRight() {
  const summaryEl = document.getElementById("review-summary-hw");
  const list = document.getElementById("review-list-hw");
  list.innerHTML = "";

  const hw = effectiveHomeworkSections().find((h) => h.id === selectedId);
  if (!hw) {
    summaryEl.textContent = "Select a homework section on the left.";
    return;
  }

  const cmp = computeComparison(hw);
  summaryEl.innerHTML =
    "<strong>Section " +
    esc(hw.section) +
    "</strong> — " +
    '<span style="color:var(--accent2)">' +
    cmp.matched.length +
    " matched</span>" +
    (cmp.planned.length
      ? ' · <span style="color:var(--accent)">' + cmp.planned.length + " planned</span>"
      : "") +
    " · " +
    cmp.reviewOnly.length +
    ' <span style="color:var(--warn)">review only</span>';

  const allIds = [...cmp.matched, ...cmp.planned, ...cmp.reviewOnly];
  if (!allIds.length) {
    list.innerHTML =
      '<div class="empty-msg">No Exam 3 Review questions for section ' +
      esc(hw.section) +
      " yet. Add homework problems with Add to Review.</div>";
    return;
  }

  for (const id of allIds) {
    const isNativeMatch = cmp.matched.includes(id);
    const isPlanned = cmp.planned.includes(id);
    const rowClass = isNativeMatch ? "match" : isPlanned ? "added-planned" : "review-only";
    const note = summaryFor(id, "rv");

    const extras = [makeRemoveBtn(id)];
    const badge = document.createElement("span");
    badge.className =
      "badge " + (isNativeMatch ? "badge-match" : isPlanned ? "badge-added" : "badge-review");
    badge.textContent = isNativeMatch ? "match" : isPlanned ? "planned" : "review only";
    extras.push(badge);

    list.appendChild(buildQBlock(id, "rv", rowClass, note, extras));
  }
}

function effectiveReviewIds() {
  const ids = new Set();
  for (const sec of effectiveReviewSections()) {
    for (const id of sec.ids) ids.add(id);
  }
  return ids;
}

function examFlatIds() {
  return examGroups.flat();
}

function examBaseSet() {
  return new Set(examFlatIds().map(examBaseId));
}

function findGroupIndex(id) {
  return examGroups.findIndex((group) => group.includes(id));
}

function findGroupIndexByBase(id) {
  const base = examBaseId(id);
  return examGroups.findIndex((group) => group.some((qid) => examBaseId(qid) === base));
}

function sectionRank(sec) {
  const idx = effectiveHomeworkSections().findIndex((h) => h.section === sec);
  return idx === -1 ? 999 : idx;
}

function numericIdParts(id) {
  return examBaseId(id)
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

function compareQuestionIds(a, b) {
  const ra = sectionRank(sectionOf(a));
  const rb = sectionRank(sectionOf(b));
  if (ra !== rb) return ra - rb;
  const pa = numericIdParts(a);
  const pb = numericIdParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va - vb;
  }
  return String(a).localeCompare(String(b));
}

function poolSortKey(group) {
  return group.slice().sort(compareQuestionIds)[0];
}

function insertIndexForPool(group) {
  const key = poolSortKey(group);
  for (let i = 0; i < examGroups.length; i++) {
    if (compareQuestionIds(key, poolSortKey(examGroups[i])) < 0) return i;
  }
  return examGroups.length;
}

function saveExamChange(message) {
  saveExamGroups();
  selectedExamId = null;
  setSyncStatus(message + " Saved in this browser. Download state for GitHub when ready.");
  renderAll();
}

function addReviewIdToExam(id) {
  if (findGroupIndexByBase(id) !== -1) return;
  examGroups.splice(insertIndexForPool([id]), 0, [id]);
  saveExamChange("Added to Exam 3.");
}

function selectReviewIdForPool(id) {
  selectedExamId = selectedExamId === id ? null : id;
  renderAll();
}

function addSelectedToPool(targetIndex) {
  if (!selectedExamId) return;
  const srcIndex = findGroupIndex(selectedExamId);
  let adjustedTarget = targetIndex;
  if (srcIndex !== -1) {
    if (srcIndex === targetIndex) return;
    examGroups[srcIndex] = examGroups[srcIndex].filter((id) => id !== selectedExamId);
    if (examGroups[srcIndex].length === 0) {
      examGroups.splice(srcIndex, 1);
      if (srcIndex < targetIndex) adjustedTarget--;
    }
  }
  const target = examGroups[adjustedTarget];
  if (target && !target.includes(selectedExamId)) target.push(selectedExamId);
  saveExamChange("Added to pool.");
}

function removeReviewIdFromExam(id) {
  const base = examBaseId(id);
  let changed = false;
  for (let i = 0; i < examGroups.length; i++) {
    const next = examGroups[i].filter((qid) => examBaseId(qid) !== base);
    if (next.length !== examGroups[i].length) changed = true;
    examGroups[i] = next;
  }
  if (!changed) return;
  examGroups = examGroups.filter((group) => group.length);
  saveExamChange("Removed from Exam 3.");
}

function splitSelectedFromPool() {
  if (!selectedExamId) return;
  const srcIndex = findGroupIndex(selectedExamId);
  if (srcIndex === -1 || examGroups[srcIndex].length <= 1) return;
  examGroups[srcIndex] = examGroups[srcIndex].filter((id) => id !== selectedExamId);
  examGroups.splice(insertIndexForPool([selectedExamId]), 0, [selectedExamId]);
  saveExamChange("Split into its own pool.");
}

function makeAddToExamBtn(id) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-add-review";
  btn.textContent = "Add to Exam";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    addReviewIdToExam(id);
  });
  return btn;
}

function makeAddToPoolBtn(id) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-add-review" + (selectedExamId === id ? " is-added" : "");
  btn.textContent = selectedExamId === id ? "Pool target" : "Add to Pool";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectReviewIdForPool(id);
  });
  return btn;
}

function makeRemoveFromExamBtn(id) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-remove";
  btn.textContent = "Remove from Exam";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeReviewIdFromExam(id);
  });
  return btn;
}

function makeSelectExamIdBtn(qid) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qid-select" + (selectedExamId === qid ? " selected" : "");
  btn.textContent = selectedExamId === qid ? "Selected" : "Select";
  if (displayId(qid) !== qid) btn.title = "Raw harvested ID: " + qid;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectReviewIdForPool(qid);
  });
  return btn;
}

function makePoolButtons(groupIndex, groupIds) {
  const wrap = document.createElement("span");
  wrap.className = "pool-actions";
  if (selectedExamId && !groupIds.includes(selectedExamId)) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-add-review";
    addBtn.textContent = "Add here";
    addBtn.addEventListener("click", () => addSelectedToPool(groupIndex));
    wrap.appendChild(addBtn);
  }
  if (selectedExamId && groupIds.includes(selectedExamId) && groupIds.length > 1) {
    const splitBtn = document.createElement("button");
    splitBtn.type = "button";
    splitBtn.className = "btn-remove";
    splitBtn.textContent = "Split out";
    splitBtn.addEventListener("click", splitSelectedFromPool);
    wrap.appendChild(splitBtn);
  }
  return wrap;
}

function examSummaryFor(id) {
  const p = examProblemFor(id);
  if (p) return p.summary || p.prompt || p.expr || "Problem text harvested";
  return EXAM3_OBJECTIVES[id] || EXAM3_OBJECTIVES[examBaseId(id)] || "Exam problem";
}

function renderReviewTabLeft() {
  const root = document.getElementById("review-sections");
  root.innerHTML = "";
  const sections = effectiveReviewSections();

  if (!sections.length) {
    root.innerHTML =
      '<div class="empty-msg">No review questions left. Load from GitHub or import a saved state file.</div>';
    return;
  }

  for (const sec of sections) {
    const isActive = sec.id === selectedId;
    const wrap = document.createElement("div");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "section-btn" + (isActive ? " active" : "");
    btn.innerHTML =
      '<span class="chev">▼</span>' +
      '<span class="label">' + esc(sec.label) + "</span>" +
      '<span class="counts">' + sec.ids.length + " Q</span>";
    btn.addEventListener("click", () => {
      selectedId = sec.id;
      expandedRv = null;
      renderAll();
    });

    const body = document.createElement("div");
    body.className = "section-body open";

    const hw = effectiveHomeworkSections().find((h) => h.id === sec.id);
    const cmp = hw ? computeComparison(hw) : null;
    const nativeSet = nativeReviewSet();

    for (const id of sec.ids) {
      const planned = isPlannedAdd(id, nativeSet);
      const nativeMatch = cmp ? cmp.matched.includes(id) : false;
      const onExam = examBaseSet().has(examBaseId(id));
      const rowClass = onExam ? "match" : planned ? "added-planned" : "review-only";

      const extras = onExam
        ? [makeRemoveFromExamBtn(id)]
        : [makeAddToExamBtn(id), makeAddToPoolBtn(id)];
      const badge = document.createElement("span");
      badge.className =
        "badge " + (onExam ? "badge-match" : planned ? "badge-added" : "badge-review");
      badge.textContent = onExam ? "on exam" : planned ? "planned" : nativeMatch ? "review" : "not on exam";
      extras.push(badge);

      body.appendChild(buildQBlock(id, "rv", rowClass, summaryFor(id, "rv"), extras));
    }

    wrap.appendChild(btn);
    wrap.appendChild(body);
    root.appendChild(wrap);
  }
}

function renderReviewTabRight() {
  renderExamPoolSide(effectiveReviewIds());
}

function renderExamPoolSide(reviewIds) {
  const flatIds = examFlatIds();
  const matchedGroups = examGroups.filter((group) =>
    group.some((qid) => reviewIds.has(examBaseId(qid)))
  );
  const toolbar = document.getElementById("exam-pool-toolbar");
  toolbar.innerHTML =
    "<strong>" +
    examGroups.length +
    " pools</strong> | " +
    flatIds.length +
    " possible questions | " +
    '<span style="color:var(--accent2)">' +
    matchedGroups.length +
    " pools have a review match</span>";

  const hint = document.getElementById("pool-hint");
  hint.textContent = selectedExamId
    ? "Selected " + displayId(selectedExamId) + " - click Add here on a target pool, or Split out if it is already pooled."
    : "Use Add to Exam for a new pool, or Add to Pool on a review question and then Add here on the target pool.";

  const list = document.getElementById("exam-pool-list");
  list.innerHTML = "";
  if (!examGroups.length) {
    list.innerHTML = '<div class="empty-msg">No Exam 3 pools yet.</div>';
    return;
  }

  examGroups.forEach((group, groupIndex) => {
    const head = document.createElement("div");
    head.className = "pool-head";

    const title = document.createElement("span");
    title.className = "pool-title";
    title.innerHTML =
      "Pool " +
      (groupIndex + 1) +
      " <span>" +
      (group.length > 1 ? "1 of " + group.length + " assigned" : "always assigned") +
      "</span>";
    head.appendChild(title);
    head.appendChild(makePoolButtons(groupIndex, group));
    list.appendChild(head);

    for (const qid of group.slice().sort(compareQuestionIds)) {
      const onReview = reviewIds.has(examBaseId(qid));
      const badge = document.createElement("span");
      badge.className = "badge " + (onReview ? "badge-match" : "badge-hw");
      badge.textContent = onReview ? "also on review" : "exam only";
      list.appendChild(
        buildQBlock(qid, "exam", onReview ? "match" : "", examSummaryFor(qid), [
          makeSelectExamIdBtn(qid),
          makeRemoveFromExamBtn(qid),
          badge,
        ])
      );
    }
  });
}

function renderExamList() {
  const flatIds = examFlatIds();
  const toolbar = document.getElementById("exam-list-toolbar");
  toolbar.innerHTML =
    "<strong>" +
    examGroups.length +
    " pools</strong> | " +
    flatIds.length +
    " possible questions";

  const list = document.getElementById("exam-list-body");
  list.innerHTML = "";
  if (!examGroups.length) {
    list.innerHTML = '<div class="empty-msg">No Exam 3 pools.</div>';
    return;
  }

  examGroups.forEach((group, groupIndex) => {
    const row = document.createElement("div");
    row.className = "q-row";

    const label = document.createElement("span");
    label.className = "qid";
    label.style.minWidth = "6.5rem";
    label.textContent = "Pool " + (groupIndex + 1);
    row.appendChild(label);

    const ids = document.createElement("span");
    ids.className = "q-note";
    ids.style.fontFamily = 'Consolas, "Courier New", monospace';
    ids.style.color = "var(--purple)";
    ids.textContent = group.slice().sort(compareQuestionIds).map(displayId).join(" | ");
    row.appendChild(ids);

    if (group.length > 1) {
      const badge = document.createElement("span");
      badge.className = "badge badge-hw";
      badge.textContent = "1 of " + group.length;
      row.appendChild(badge);
    }

    list.appendChild(row);
    for (const qid of group.slice().sort(compareQuestionIds)) {
      const badge = document.createElement("span");
      badge.className = "badge badge-hw";
      badge.textContent = examProblems[qid] ? "printed" : "harvested";
      list.appendChild(buildQBlock(qid, "exam", "", examSummaryFor(qid), [badge]));
    }
  });
}

function updateFooterCount() {
  const hwEl = document.getElementById("homework-count-footer");
  if (hwEl) {
    const hwTotal = effectiveHomeworkSections().reduce((sum, sec) => sum + sec.ids.length, 0);
    hwEl.textContent = "Homework: " + hwTotal + " Q";
  }

  const rvEl = document.getElementById("review-count-footer");
  if (rvEl) {
    const rvTotal = effectiveReviewSections().reduce((sum, sec) => sum + sec.ids.length, 0);
    rvEl.textContent = "Exam 3 Review: " + rvTotal + " Q";
  }

  const examEl = document.getElementById("exam-count-footer");
  if (examEl) {
    examEl.textContent = "Exam 3: " + examGroups.length + " pools";
  }
}

function setViewMode(mode) {
  if (viewMode === mode) return;
  viewMode = mode;
  selectedId = null;
  expandedHw = null;
  expandedRv = null;
  expandedExam = null;
  selectedExamId = null;
  renderAll();
}

function renderAll() {
  document.querySelectorAll(".view-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewMode);
  });

  const homeworkView = document.getElementById("homework-view");
  const reviewView = document.getElementById("review-view");
  const examView = document.getElementById("exam-view");
  const legend = document.getElementById("homework-legend");
  const subtitle = document.getElementById("subtitle");

  homeworkView.classList.toggle("hidden", viewMode !== "homework");
  reviewView.classList.toggle("hidden", viewMode !== "review");
  examView.classList.toggle("hidden", viewMode !== "exam");
  legend.classList.toggle("hidden", viewMode !== "homework");

  if (viewMode === "homework") {
    subtitle.textContent =
      "Click a homework section — homework on the left, matching Exam 3 Review on the right. Click a question to expand full text inline.";
    renderHomeworkLeft();
    renderHomeworkRight();
  } else if (viewMode === "review") {
    subtitle.textContent =
      "Use Add to Exam to create a new pool, or Add to Pool to place a review question into an existing Exam 3 pool.";
    renderReviewTabLeft();
    renderReviewTabRight();
  } else {
    subtitle.textContent = "All Exam 3 pools in order. Multi-question pools randomly assign one question per student.";
    renderExamList();
  }
  updateFooterCount();
}

document.querySelectorAll(".view-tab").forEach((btn) => {
  btn.addEventListener("click", () => setViewMode(btn.dataset.view));
});

async function boot() {
  await loadExamProblems();
  await bootState();
  renderAll();
}

boot();
