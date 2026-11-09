// Exam 4 map UI — REVIEW / REVIEW_PROBLEMS / SKILL_GROUPS / examGroups + KaTeX
(() => {
  const KATEX_OPTS = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
  };

  let selectedExamId = null;

  const subtitles = {
    homework: "Homework harvest not run yet — use Exam 4 Review for captured problem text.",
    review:
      "Add to Exam makes a new pool. Add to Pool, then Add here on a pool to combine.",
    skills:
      "Same pool actions, grouped by antiderivative skill. 5.5 is its own block.",
    exam: "Final Exam 4 pool list — expand a problem for LaTeX text.",
    "exam-changes": "Added vs empty baseline (no Pearson exam harvest yet).",
  };

  const views = {
    homework: document.getElementById("homework-view"),
    review: document.getElementById("review-view"),
    skills: document.getElementById("skills-view"),
    exam: document.getElementById("exam-view"),
    "exam-changes": document.getElementById("exam-changes-view"),
  };

  const subtitle = document.getElementById("subtitle");
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view;
      document.querySelectorAll(".view-tab").forEach((t) => t.classList.toggle("active", t === tab));
      Object.entries(views).forEach(([key, el]) => {
        if (el) el.classList.toggle("hidden", key !== view);
      });
      subtitle.textContent = subtitles[view] || "";
    });
  });

  function problemsMap() {
    return typeof REVIEW_PROBLEMS !== "undefined" ? REVIEW_PROBLEMS : {};
  }

  function renderMath(el) {
    if (window.renderMathInElement) window.renderMathInElement(el, KATEX_OPTS);
  }

  function examBaseId(id) {
    const m = String(id).match(/^\d+\.\d+\.\d+/);
    return m ? m[0] : id;
  }

  function examFlatIds() {
    return examGroups.flat();
  }

  function findGroupIndex(id) {
    return examGroups.findIndex((group) => group.includes(id));
  }

  function findGroupIndexByBase(id) {
    const base = examBaseId(id);
    return examGroups.findIndex((group) => group.some((qid) => examBaseId(qid) === base));
  }

  function isOnExam(id) {
    return findGroupIndexByBase(id) !== -1;
  }

  function numericIdParts(id) {
    return examBaseId(id)
      .split(".")
      .map((n) => parseInt(n, 10) || 0);
  }

  function compareQuestionIds(a, b) {
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
    window.renderExam4();
  }

  function addReviewIdToExam(id) {
    if (findGroupIndexByBase(id) !== -1) return;
    examGroups.splice(insertIndexForPool([id]), 0, [id]);
    saveExamChange("Added " + id + " to Exam 4.");
  }

  function selectReviewIdForPool(id) {
    selectedExamId = selectedExamId === id ? null : id;
    window.renderExam4();
  }

  function addSelectedToPool(targetIndex) {
    if (!selectedExamId) return;
    const srcIndex = findGroupIndex(selectedExamId);
    let adjustedTarget = targetIndex;
    if (srcIndex !== -1) {
      if (srcIndex === targetIndex) return;
      examGroups[srcIndex] = examGroups[srcIndex].filter((qid) => qid !== selectedExamId);
      if (examGroups[srcIndex].length === 0) {
        examGroups.splice(srcIndex, 1);
        if (srcIndex < targetIndex) adjustedTarget--;
      }
    }
    const target = examGroups[adjustedTarget];
    if (target && !target.includes(selectedExamId)) target.push(selectedExamId);
    saveExamChange("Added " + selectedExamId + " to pool " + (adjustedTarget + 1) + ".");
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
    saveExamChange("Removed " + id + " from Exam 4.");
  }

  function splitSelectedFromPool() {
    if (!selectedExamId) return;
    const srcIndex = findGroupIndex(selectedExamId);
    if (srcIndex === -1 || examGroups[srcIndex].length <= 1) return;
    examGroups[srcIndex] = examGroups[srcIndex].filter((qid) => qid !== selectedExamId);
    examGroups.splice(insertIndexForPool([selectedExamId]), 0, [selectedExamId]);
    saveExamChange("Split " + selectedExamId + " into its own pool.");
  }

  function makeAddToExamBtn(id) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-exam-action";
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
    btn.className = "btn-exam-action is-on-exam";
    btn.textContent = "Remove from Exam";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeReviewIdFromExam(id);
    });
    return btn;
  }

  function makeAddToPoolBtn(id) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-exam-action" + (selectedExamId === id ? " is-selected" : "");
    btn.textContent = selectedExamId === id ? "Pool target" : "Add to Pool";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectReviewIdForPool(id);
    });
    return btn;
  }

  function makePoolButtons(groupIndex, groupIds) {
    const wrap = document.createElement("div");
    wrap.className = "pool-actions";
    if (selectedExamId && !groupIds.includes(selectedExamId)) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn-exam-action";
      addBtn.textContent = "Add here";
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addSelectedToPool(groupIndex);
      });
      wrap.appendChild(addBtn);
    }
    if (selectedExamId && groupIds.includes(selectedExamId) && groupIds.length > 1) {
      const splitBtn = document.createElement("button");
      splitBtn.type = "button";
      splitBtn.className = "btn-exam-action is-on-exam";
      splitBtn.textContent = "Split out";
      splitBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        splitSelectedFromPool();
      });
      wrap.appendChild(splitBtn);
    }
    return wrap;
  }

  function makeProblemRow(id, opts) {
    const problems = problemsMap();
    const p = problems[id] || {};
    const onExam = isOnExam(id);
    const row = document.createElement("div");
    row.className =
      "q-row" +
      (onExam ? " on-exam" : "") +
      (selectedExamId === id ? " is-pool-target" : "");

    const qBtn = document.createElement("button");
    qBtn.type = "button";
    qBtn.className = "q-toggle";
    const qid = document.createElement("span");
    qid.className = "qid";
    qid.textContent = id;
    const summary = document.createElement("span");
    summary.className = "q-summary";
    summary.textContent = p.summary || "";
    qBtn.append(qid, summary, makeProblemLoadBadge(id));
    if (p.objective) {
      const obj = document.createElement("div");
      obj.className = "q-obj";
      obj.textContent = p.objective;
      qBtn.appendChild(obj);
    }
    qBtn.addEventListener("click", () => row.classList.toggle("open"));

    const actions = document.createElement("div");
    actions.className = "q-actions";
    if (!opts || opts.examActions !== false) {
      if (onExam) actions.appendChild(makeRemoveFromExamBtn(id));
      else actions.appendChild(makeAddToExamBtn(id));
      actions.appendChild(makeAddToPoolBtn(id));
    }

    const qBody = document.createElement("div");
    qBody.className = "q-body";
    qBody.textContent = p.fullText || p.summary || "(no problem text)";

    row.append(qBtn, actions, qBody);
    return row;
  }

  function makeCollapsibleSection(title, countLabel, openByDefault, headerExtra) {
    const section = document.createElement("div");
    section.className = openByDefault ? "section open" : "section";
    const headRow = document.createElement("div");
    headRow.className = "section-head-row";
    const secBtn = document.createElement("button");
    secBtn.type = "button";
    secBtn.className = "section-toggle";
    const secLabel = document.createElement("span");
    secLabel.textContent = title;
    const secCount = document.createElement("span");
    secCount.className = "section-count";
    secCount.textContent = countLabel;
    secBtn.append(secLabel, secCount);
    secBtn.addEventListener("click", () => section.classList.toggle("open"));
    headRow.appendChild(secBtn);
    if (headerExtra) headRow.appendChild(headerExtra);
    const body = document.createElement("div");
    body.className = "section-body";
    section.append(headRow, body);
    return { section, body };
  }

  function renderExamSide(root) {
    if (!root) return;
    root.replaceChildren();
    const head = document.createElement("div");
    head.className = "exam-side-meta";
    head.textContent = selectedExamId
      ? "Selected " +
        selectedExamId +
        " — click Add here on a pool, or Split out if it is already in a multi-question pool."
      : examGroups.length +
        " pool" +
        (examGroups.length === 1 ? "" : "s") +
        " · " +
        examFlatIds().length +
        " question" +
        (examFlatIds().length === 1 ? "" : "s") +
        ". Add to Pool on a problem, then Add here on a pool.";
    root.appendChild(head);

    if (!examGroups.length) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent = "No Exam 4 pools yet. Click Add to Exam on a review problem.";
      root.appendChild(empty);
      return;
    }

    examGroups.forEach((group, index) => {
      const poolActions = makePoolButtons(index, group);
      const label =
        "Pool " +
        (index + 1) +
        (group.length > 1 ? " (1 of " + group.length + " assigned)" : "");
      const load = exam4PoolLoadSummary(group);
      const { section, body } = makeCollapsibleSection(
        label,
        group.length + " Q" + (load.text ? " · " + load.text : ""),
        true,
        poolActions
      );
      if (load.uneven) section.querySelector(".section-count").classList.add("is-uneven");
      for (const id of group.slice().sort(compareQuestionIds)) {
        body.appendChild(makeProblemRow(id));
      }
      root.appendChild(section);
    });
    renderMath(root);
  }

  function renderReview() {
    const root = document.getElementById("review-root");
    const sections = typeof REVIEW !== "undefined" ? REVIEW : [];
    const total = sections.reduce((n, s) => n + (s.ids || []).length, 0);
    document.getElementById("review-head-count").textContent =
      "— " + total + " questions in " + sections.length + " sections";
    root.replaceChildren();
    if (!sections.length) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent = "No review questions harvested.";
      root.appendChild(empty);
      return;
    }
    for (const sec of sections) {
      const { section, body } = makeCollapsibleSection(
        sec.label || sec.id,
        (sec.ids || []).length + " Q",
        true
      );
      for (const id of sec.ids || []) {
        body.appendChild(makeProblemRow(id));
      }
      root.appendChild(section);
    }
    renderMath(root);
  }

  function renderSkills() {
    const root = document.getElementById("skills-root");
    const head = document.getElementById("skills-head-count");
    const data = typeof SKILL_GROUPS !== "undefined" ? SKILL_GROUPS : null;
    root.replaceChildren();
    if (!data) {
      head.textContent = "— missing skill groups";
      return;
    }
    const included = data.blocks.reduce(
      (n, b) => n + b.groups.reduce((m, g) => m + g.ids.length, 0),
      0
    );
    head.textContent =
      "— " + included + " antiderivative problems · " + data.excludedIds.length + " left out";

    const note = document.createElement("p");
    note.className = "skills-note";
    note.textContent = data.excludedNote;
    root.appendChild(note);

    for (const block of data.blocks) {
      const blockEl = document.createElement("div");
      blockEl.className = "skill-block" + (block.id === "usub" ? " skill-block-usub" : "");
      const title = document.createElement("h2");
      title.className = "skill-block-title";
      title.textContent = block.title;
      const blurb = document.createElement("p");
      blurb.className = "skill-block-blurb";
      blurb.textContent = block.blurb;
      blockEl.append(title, blurb);
      for (const group of block.groups) {
        const { section, body } = makeCollapsibleSection(
          group.label,
          group.ids.length + " Q",
          true
        );
        if (group.hint) {
          const hint = document.createElement("p");
          hint.className = "skill-hint";
          hint.textContent = group.hint;
          body.appendChild(hint);
        }
        for (const id of group.ids) {
          body.appendChild(makeProblemRow(id));
        }
        blockEl.appendChild(section);
      }
      root.appendChild(blockEl);
    }
    renderMath(root);
  }

  function renderExamTab() {
    const root = document.getElementById("exam-root");
    const head = document.getElementById("exam-head-count");
    if (!root || !head) return;
    head.textContent =
      "— " + examGroups.length + " pools · " + examFlatIds().length + " questions";
    root.replaceChildren();
    renderExam4SectionSummary(root, examFlatIds());
    if (!examGroups.length) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent = "No pools yet. Add problems from Exam 4 Review or By skill.";
      root.appendChild(empty);
      return;
    }
    examGroups.forEach((group, index) => {
      const load = exam4PoolLoadSummary(group);
      const { section, body } = makeCollapsibleSection(
        "Pool " + (index + 1),
        group.length + " Q" + (load.text ? " · " + load.text : ""),
        true
      );
      if (load.uneven) section.querySelector(".section-count").classList.add("is-uneven");
      for (const id of group) {
        body.appendChild(makeProblemRow(id));
      }
      root.appendChild(section);
    });
    renderMath(root);
  }

  function renderExamChanges() {
    const root = document.getElementById("exam-changes-root");
    if (!root) return;
    root.replaceChildren();
    const note = document.createElement("p");
    note.className = "skills-note";
    note.textContent =
      "No Pearson Exam 4 harvest baseline yet. This lists every ID currently on the exam (all count as added from review).";
    root.appendChild(note);
    if (!examGroups.length) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent = "Nothing on the exam yet.";
      root.appendChild(empty);
      return;
    }
    const { section, body } = makeCollapsibleSection(
      "On Exam 4 (from review)",
      examFlatIds().length + " Q",
      true
    );
    for (const id of examFlatIds().slice().sort(compareQuestionIds)) {
      body.appendChild(makeProblemRow(id));
    }
    root.appendChild(section);
    renderMath(root);
  }

  function updateExamBadge() {
    const el = document.getElementById("status-notice");
    if (!el) return;
    el.innerHTML =
      "Exam IV Review: 42 questions. " +
      "<strong>By skill</strong> for coverage. " +
      "<strong>Add to Exam</strong> builds pools (" +
      examGroups.length +
      " pool" +
      (examGroups.length === 1 ? "" : "s") +
      " so far).";
  }

  window.renderExam4 = function renderExam4() {
    renderReview();
    renderSkills();
    renderExamSide(document.getElementById("exam-side-review"));
    renderExamSide(document.getElementById("exam-side-skills"));
    renderExamTab();
    renderExamChanges();
    updateExamBadge();
  };

  function boot() {
    if (!window.renderMathInElement) {
      setTimeout(boot, 50);
      return;
    }
    wireExam4StateButtons();
    bootstrapExam4State().finally(() => {
      window.renderExam4();
    });
  }
  boot();
})();
