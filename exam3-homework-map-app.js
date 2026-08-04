// Exam 3 map app — homework vs review side-by-side + review tab
// Depends on exam3-homework-map-data.js and exam3-map-state.js

let viewMode = "homework";
let selectedId = null;
let expandedHw = null;
let expandedRv = null;

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

  const head = document.createElement("button");
  head.type = "button";
  head.className = "q-row " + rowClass;
  const isExpanded = side === "hw" ? expandedHw === id : expandedRv === id;
  if (isExpanded) head.classList.add("expanded-head");

  const qid = document.createElement("span");
  qid.className = "qid";
  qid.textContent = id;
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
    } else {
      expandedRv = expandedRv === id ? null : id;
    }
    renderAll();
  });

  block.appendChild(head);

  const detail = document.createElement("div");
  detail.className = "q-detail" + (isExpanded ? " open" : "");
  if (isExpanded) renderProblemBody(detail, problemFor(id, side));
  block.appendChild(detail);

  return block;
}

function renderHomeworkLeft() {
  const root = document.getElementById("hw-sections");
  root.innerHTML = "";

  for (const hw of HOMEWORK) {
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

  const hw = HOMEWORK.find((h) => h.id === selectedId);
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

function renderReviewTabLeft() {
  const root = document.getElementById("review-sections");
  root.innerHTML = "";
  const sections = effectiveReviewSections();

  if (!sections.length) {
    root.innerHTML =
      '<div class="empty-msg">No review questions left. Use Restore on the summary panel or Load from GitHub.</div>';
    return;
  }

  for (const sec of sections) {
    const isActive = sec.id === selectedId;
    const wrap = document.createElement("div");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "section-btn" + (isActive ? " active" : "");
    btn.innerHTML =
      '<span class="chev">' + (isActive ? "▼" : "▶") + "</span>" +
      '<span class="label">' + esc(sec.label) + "</span>" +
      '<span class="counts">' + sec.ids.length + " Q</span>";
    btn.addEventListener("click", () => {
      selectedId = selectedId === sec.id ? null : sec.id;
      expandedRv = null;
      renderAll();
    });

    const body = document.createElement("div");
    body.className = "section-body" + (isActive ? " open" : "");

    if (isActive) {
      const hw = HOMEWORK.find((h) => h.id === sec.id);
      const cmp = hw ? computeComparison(hw) : null;
      const nativeSet = nativeReviewSet();

      for (const id of sec.ids) {
        const planned = isPlannedAdd(id, nativeSet);
        const nativeMatch = cmp ? cmp.matched.includes(id) : false;
        const rowClass = nativeMatch ? "match" : planned ? "added-planned" : "review-only";

        const extras = [makeRemoveBtn(id)];
        const badge = document.createElement("span");
        badge.className =
          "badge " + (nativeMatch ? "badge-match" : planned ? "badge-added" : "badge-review");
        badge.textContent = nativeMatch ? "match" : planned ? "planned" : "review only";
        extras.push(badge);

        body.appendChild(buildQBlock(id, "rv", rowClass, summaryFor(id, "rv"), extras));
      }
    }

    wrap.appendChild(btn);
    wrap.appendChild(body);
    root.appendChild(wrap);
  }
}

function renderReviewTabRight() {
  const summaryBar = document.getElementById("review-summary-panel");
  const detail = document.getElementById("review-summary-detail");
  detail.innerHTML = "";

  const sec = effectiveReviewSections().find((s) => s.id === selectedId);
  if (!sec) {
    summaryBar.textContent = "Select a review section on the left.";
    return;
  }

  const hw = HOMEWORK.find((h) => h.id === sec.id);
  const cmp = hw ? computeComparison(hw) : null;
  const nativeSet = nativeReviewSet();

  let matched = 0;
  let planned = 0;
  let reviewOnly = 0;
  for (const id of sec.ids) {
    if (cmp && cmp.matched.includes(id)) matched++;
    else if (isPlannedAdd(id, nativeSet)) planned++;
    else reviewOnly++;
  }

  summaryBar.innerHTML = "<strong>" + esc(sec.label) + "</strong>";

  const ul = document.createElement("ul");
  ul.innerHTML =
    "<li><span style=\"color:var(--accent2)\">" +
    matched +
    " matched</span> with homework</li>" +
    (planned ? "<li><span style=\"color:var(--accent)\">" + planned + " planned</span> adds from homework</li>" : "") +
    "<li><span style=\"color:var(--warn)\">" +
    reviewOnly +
    " review only</span></li>" +
    "<li>" +
    sec.ids.length +
    " total on review</li>" +
    (hw ? "<li>" + hw.ids.length + " on homework</li>" : "<li>No homework section (review adds only)</li>");

  detail.appendChild(ul);

  if (removedFromReview.size) {
    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "btn-restore";
    restoreBtn.textContent = "Restore all removed (" + removedFromReview.size + ")";
    restoreBtn.addEventListener("click", restoreRemoved);
    detail.appendChild(restoreBtn);
  }
}

function setViewMode(mode) {
  if (viewMode === mode) return;
  viewMode = mode;
  selectedId = null;
  expandedHw = null;
  expandedRv = null;
  renderAll();
}

function renderAll() {
  document.querySelectorAll(".view-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewMode);
  });

  const homeworkView = document.getElementById("homework-view");
  const reviewView = document.getElementById("review-view");
  const legend = document.getElementById("homework-legend");
  const subtitle = document.getElementById("subtitle");

  homeworkView.classList.toggle("hidden", viewMode !== "homework");
  reviewView.classList.toggle("hidden", viewMode !== "review");
  legend.classList.toggle("hidden", viewMode !== "homework");

  if (viewMode === "homework") {
    subtitle.textContent =
      "Click a homework section — homework on the left, matching Exam 3 Review on the right. Click a question to expand full text inline.";
    renderHomeworkLeft();
    renderHomeworkRight();
  } else {
    subtitle.textContent =
      "Browse the effective Exam 3 Review (including your adds). Click a question to expand full text inline.";
    renderReviewTabLeft();
    renderReviewTabRight();
  }
}

document.querySelectorAll(".view-tab").forEach((btn) => {
  btn.addEventListener("click", () => setViewMode(btn.dataset.view));
});

async function boot() {
  await bootState();
  renderAll();
}

boot();
