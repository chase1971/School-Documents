// Exam 2 "Review vs live pools" comparison tab — loaded by exam2-review-map.html
// Depends on EXAM2_OBJECTIVES, HOMEWORK, PROBLEMS from exam2-review-map-data.js,
// and on esc, activeReview, addedToReview, removedFromReview, nativeReviewSet,
// sectionOf, sectionLabel, examGroups, saveExamGroups, setSyncStatus from
// exam2-review-map-app.js (all loaded before this file).

let selectedExamId = null;

function examBaseId(id) {
  const m = String(id).match(/^\d+\.\d+\.\d+/);
  return m ? m[0] : id;
}

function activeReviewIds() {
  const ids = new Set(activeReview().map((r) => r.questionId));
  for (const id of addedToReview) {
    if (!removedFromReview.has(id)) ids.add(id);
  }
  return ids;
}

function findGroupIndex(id) {
  return examGroups.findIndex((g) => g.includes(id));
}

function sectionRank(sec) {
  const idx = HOMEWORK.findIndex((h) => h.section === sec);
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

function selectExamId(id) {
  selectedExamId = selectedExamId === id ? null : id;
  renderExamComparison();
}

function moveToGroup(id, targetIndex) {
  const srcIndex = findGroupIndex(id);
  if (srcIndex === -1 || srcIndex === targetIndex) return;
  examGroups[srcIndex] = examGroups[srcIndex].filter((x) => x !== id);
  examGroups[targetIndex].push(id);
  if (examGroups[srcIndex].length === 0) examGroups.splice(srcIndex, 1);
  saveExamGroups();
  selectedExamId = null;
  setSyncStatus("Local change saved in this browser. Download state for GitHub when ready.");
  renderExamComparison();
}

function removeFromGroup(id) {
  const srcIndex = findGroupIndex(id);
  if (srcIndex === -1 || examGroups[srcIndex].length <= 1) return;
  examGroups[srcIndex] = examGroups[srcIndex].filter((x) => x !== id);
  if (examGroups[srcIndex].length === 0) examGroups.splice(srcIndex, 1);
  examGroups.splice(insertIndexForPool([id]), 0, [id]);
  saveExamGroups();
  selectedExamId = null;
  setSyncStatus("Local change saved in this browser. Download state for GitHub when ready.");
  renderExamComparison();
}

function addReviewIdToExam(id) {
  if (findGroupIndex(id) !== -1) return;
  examGroups.splice(insertIndexForPool([id]), 0, [id]);
  saveExamGroups();
  setSyncStatus("Added to exam. Saved in this browser — download state for GitHub when ready.");
  renderExamComparison();
}

function removeReviewIdFromExam(reviewId) {
  let changed = false;
  for (let i = 0; i < examGroups.length; i++) {
    if (examGroups[i].some((eid) => examBaseId(eid) === reviewId)) {
      examGroups[i] = examGroups[i].filter((eid) => examBaseId(eid) !== reviewId);
      changed = true;
    }
  }
  if (!changed) return;
  examGroups = examGroups.filter((g) => g.length > 0);
  saveExamGroups();
  setSyncStatus("Removed from exam. Saved in this browser — download state for GitHub when ready.");
  renderExamComparison();
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

function makeSelectIdBtn(qid) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qid-select" + (selectedExamId === qid ? " selected" : "");
  btn.textContent = qid;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectExamId(qid);
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
    addBtn.textContent = "Add to pool";
    addBtn.addEventListener("click", () => moveToGroup(selectedExamId, groupIndex));
    wrap.appendChild(addBtn);
  }
  if (selectedExamId && groupIds.includes(selectedExamId) && groupIds.length > 1) {
    const remBtn = document.createElement("button");
    remBtn.type = "button";
    remBtn.className = "btn-remove";
    remBtn.textContent = "Remove from pool";
    remBtn.addEventListener("click", () => removeFromGroup(selectedExamId));
    wrap.appendChild(remBtn);
  }
  return wrap;
}

function renderExamReviewSide(examBaseSet) {
  const nativeSet = nativeReviewSet();
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
  const sectionOrder = HOMEWORK.map((h) => h.section);
  const sections = [
    ...sectionOrder.filter((s) => bySection.has(s)),
    ...[...bySection.keys()].filter((s) => !sectionOrder.includes(s)).sort(),
  ];

  const matchCount = rows.filter((r) => examBaseSet.has(r.questionId)).length;
  const toolbar = document.getElementById("exam-review-toolbar");
  toolbar.innerHTML =
    "<strong>" +
    rows.length +
    " review questions</strong>" +
    " · " +
    '<span style="color:var(--accent2)">' +
    matchCount +
    " also on Exam 2</span>";

  const list = document.getElementById("exam-review-list");
  list.innerHTML = "";
  if (!rows.length) {
    list.innerHTML = '<div class="empty-msg">No review questions left.</div>';
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
      const onExam = examBaseSet.has(r.questionId);
      const p = PROBLEMS[r.questionId];
      const note = p
        ? p.expr + (p.prompt ? " — " + p.prompt : "")
        : r.objective || "Problem text not harvested";
      const row = document.createElement("div");
      row.className =
        "q-row " + (onExam ? "match" : r.planned ? "added-planned" : "review-only");
      row.innerHTML =
        '<span class="qid">' +
        esc(r.questionId) +
        "</span>" +
        '<span class="q-note">' +
        esc(note) +
        "</span>";
      row.appendChild(onExam ? makeRemoveFromExamBtn(r.questionId) : makeAddToExamBtn(r.questionId));
      const badge = document.createElement("span");
      badge.className =
        "badge " + (onExam ? "badge-match" : r.planned ? "badge-added" : "badge-review");
      badge.textContent = onExam ? "on exam" : r.planned ? "planned" : "not on exam";
      row.appendChild(badge);
      list.appendChild(row);
    }
  }
}

function renderExamPoolSide(reviewIds) {
  const flatIds = examGroups.flat();
  const matchedGroups = examGroups.filter((g) => g.some((q) => reviewIds.has(examBaseId(q))));
  const toolbar = document.getElementById("exam-pool-toolbar");
  toolbar.innerHTML =
    "<strong>" +
    examGroups.length +
    " pools</strong>" +
    " · " +
    flatIds.length +
    " possible questions" +
    " · " +
    '<span style="color:var(--accent2)">' +
    matchedGroups.length +
    " pools have a review match</span>";

  const hint = document.getElementById("pool-hint");
  hint.textContent = selectedExamId
    ? "Selected " +
      selectedExamId +
      " — click \u201cAdd to pool\u201d on the target pool, or \u201cRemove from pool\u201d to pull it out on its own."
    : "Click a question ID below to select it, then use a pool's buttons to merge or split pools.";

  const list = document.getElementById("exam-pool-list");
  list.innerHTML = "";
  examGroups.forEach((group, groupIndex) => {
    const head = document.createElement("div");
    head.className = "pool-head";
    const title = document.createElement("span");
    title.className = "pool-title";
    title.innerHTML =
      "Pool " +
      (groupIndex + 1) +
      " <span>— " +
      (group.length > 1 ? "1 of " + group.length + " assigned" : "always assigned") +
      "</span>";
    head.appendChild(title);
    head.appendChild(makePoolButtons(groupIndex, group));
    list.appendChild(head);

    for (const qid of group) {
      const onReview = reviewIds.has(examBaseId(qid));
      const p = PROBLEMS[qid];
      const objective = EXAM2_OBJECTIVES[qid]
        ? EXAM2_OBJECTIVES[qid]
        : p
          ? p.expr + (p.prompt ? " — " + p.prompt : "")
          : "Added from review — no objective on file";
      const row = document.createElement("div");
      row.className = "q-row" + (onReview ? " match" : "");
      row.appendChild(makeSelectIdBtn(qid));
      const note = document.createElement("span");
      note.className = "q-note";
      note.textContent = objective;
      row.appendChild(note);
      const badge = document.createElement("span");
      badge.className = "badge " + (onReview ? "badge-match" : "badge-hw");
      badge.textContent = onReview ? "also on review" : "exam only";
      row.appendChild(badge);
      list.appendChild(row);
    }
  });
}

function renderExamComparison() {
  if (selectedExamId !== null && findGroupIndex(selectedExamId) === -1) {
    selectedExamId = null;
  }
  const reviewIds = activeReviewIds();
  const examBaseSet = new Set(examGroups.flat().map(examBaseId));
  renderExamReviewSide(examBaseSet);
  renderExamPoolSide(reviewIds);
}

function renderExamList() {
  const flatIds = examGroups.flat();
  const toolbar = document.getElementById("exam-list-toolbar");
  toolbar.innerHTML =
    "<strong>" +
    examGroups.length +
    " pools</strong>" +
    " · " +
    flatIds.length +
    " possible questions";

  const list = document.getElementById("exam-list-body");
  list.innerHTML = "";
  if (!examGroups.length) {
    list.innerHTML = '<div class="empty-msg">No exam pools.</div>';
    return;
  }
  examGroups.forEach((group, groupIndex) => {
    const sortedIds = group.slice().sort(compareQuestionIds);
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
    ids.textContent = sortedIds.join(" · ");
    row.appendChild(ids);
    if (group.length > 1) {
      const badge = document.createElement("span");
      badge.className = "badge badge-hw";
      badge.textContent = "1 of " + group.length;
      row.appendChild(badge);
    }
    list.appendChild(row);
  });
}
