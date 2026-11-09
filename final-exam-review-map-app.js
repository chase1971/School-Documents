(() => {
  let activeExamId = "exam1";
  let sortMode = "skill";

  function renderMath(root) {
    if (!root || typeof renderMathInElement !== "function") return;
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }

  function exams() {
    return typeof FINAL_EXAMS !== "undefined" ? FINAL_EXAMS : [];
  }

  function findExam(id) {
    return exams().find((e) => e.id === id) || null;
  }

  function problem(id) {
    return (typeof FINAL_PROBLEMS !== "undefined" && FINAL_PROBLEMS[id]) || {};
  }

  function skillsFor(examId) {
    return (typeof FINAL_SKILLS !== "undefined" && FINAL_SKILLS[examId]) || [];
  }

  function flatIds(exam) {
    if (!exam || !exam.pools) return [];
    return exam.pools.flatMap((p) => p.ids || []);
  }

  function isOnFinal(id) {
    return finalGroups.some((g) => g.includes(id));
  }

  function compareIds(a, b) {
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  }

  function insertIndexForPool(ids) {
    const key = ids.slice().sort(compareIds)[0] || "";
    for (let i = 0; i < finalGroups.length; i++) {
      const gKey = finalGroups[i].slice().sort(compareIds)[0] || "";
      if (compareIds(key, gKey) < 0) return i;
    }
    return finalGroups.length;
  }

  function addIdToFinal(id) {
    if (isOnFinal(id)) return;
    finalGroups.splice(insertIndexForPool([id]), 0, [id]);
    saveFinalGroups();
    render();
  }

  function removeIdFromFinal(id) {
    finalGroups = finalGroups
      .map((g) => g.filter((qid) => qid !== id))
      .filter((g) => g.length);
    finalExamIds = finalExamIds.filter((qid) => qid !== id);
    if (selectedFinalId === id) selectedFinalId = null;
    saveFinalGroups();
    saveFinalExamIds();
    render();
  }

  function isOnFinalExam(id) {
    return finalExamIds.includes(id);
  }

  function addIdToFinalExam(id) {
    if (isOnFinalExam(id)) return;
    finalExamIds.push(id);
    saveFinalExamIds();
    render();
  }

  function removeIdFromFinalExam(id) {
    finalExamIds = finalExamIds.filter((qid) => qid !== id);
    saveFinalExamIds();
    render();
  }

  function selectForPool(id) {
    selectedFinalId = selectedFinalId === id ? null : id;
    render();
  }

  function addSelectedToPool(targetIndex) {
    if (!selectedFinalId) return;
    let srcIndex = finalGroups.findIndex((g) => g.includes(selectedFinalId));
    if (srcIndex === -1) {
      finalGroups.splice(insertIndexForPool([selectedFinalId]), 0, [selectedFinalId]);
      srcIndex = finalGroups.findIndex((g) => g.includes(selectedFinalId));
    }
    if (srcIndex === targetIndex) return;
    finalGroups[srcIndex] = finalGroups[srcIndex].filter((qid) => qid !== selectedFinalId);
    if (finalGroups[srcIndex].length === 0) finalGroups.splice(srcIndex, 1);
    const adjusted = srcIndex < targetIndex ? targetIndex - 1 : targetIndex;
    if (!finalGroups[adjusted].includes(selectedFinalId)) {
      finalGroups[adjusted].push(selectedFinalId);
      finalGroups[adjusted].sort(compareIds);
    }
    selectedFinalId = null;
    saveFinalGroups();
    render();
  }

  function splitSelectedFromPool() {
    if (!selectedFinalId) return;
    const srcIndex = finalGroups.findIndex((g) => g.includes(selectedFinalId));
    if (srcIndex === -1 || finalGroups[srcIndex].length <= 1) return;
    finalGroups[srcIndex] = finalGroups[srcIndex].filter((qid) => qid !== selectedFinalId);
    finalGroups.splice(insertIndexForPool([selectedFinalId]), 0, [selectedFinalId]);
    selectedFinalId = null;
    saveFinalGroups();
    render();
  }

  function makeActionBtn(label, className, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-exam-action" + (className ? " " + className : "");
    btn.textContent = label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function makePoolButtons(groupIndex, groupIds) {
    const wrap = document.createElement("div");
    wrap.className = "pool-actions";
    if (selectedFinalId && !groupIds.includes(selectedFinalId)) {
      wrap.appendChild(makeActionBtn("Add here", "", () => addSelectedToPool(groupIndex)));
    }
    if (selectedFinalId && groupIds.includes(selectedFinalId) && groupIds.length > 1) {
      wrap.appendChild(makeActionBtn("Split out", "is-on-exam", splitSelectedFromPool));
    }
    return wrap;
  }

  function makeProblemRow(id, opts) {
    const p = problem(id);
    const onFinal = isOnFinal(id);
    const onFinalExam = isOnFinalExam(id);
    const row = document.createElement("div");
    row.className =
      "q-row" +
      (onFinal || (opts && opts.examOnly && onFinalExam) ? " on-exam" : "") +
      (selectedFinalId === id ? " is-pool-target" : "");

    const qBtn = document.createElement("button");
    qBtn.type = "button";
    qBtn.className = "q-toggle";
    const qid = document.createElement("span");
    qid.className = "qid";
    qid.textContent = id;
    const summary = document.createElement("span");
    summary.className = "q-summary";
    summary.textContent = p.summary || "";
    qBtn.append(qid, summary);
    if (p.objective) {
      const obj = document.createElement("div");
      obj.className = "q-obj";
      obj.textContent = p.objective;
      qBtn.appendChild(obj);
    }
    qBtn.addEventListener("click", () => row.classList.toggle("open"));

    const actions = document.createElement("div");
    actions.className = "q-actions";
    if (opts && opts.examOnly) {
      actions.appendChild(
        makeActionBtn("Remove from Final Exam", "is-on-exam", () => removeIdFromFinalExam(id))
      );
    } else if (!opts || opts.finalActions !== false) {
      if (onFinal) {
        actions.appendChild(makeActionBtn("Remove from Final", "is-on-exam", () => removeIdFromFinal(id)));
      } else {
        actions.appendChild(makeActionBtn("Add to Final Review", "", () => addIdToFinal(id)));
      }
      actions.appendChild(
        makeActionBtn(
          selectedFinalId === id ? "Pool target" : "Add to Pool",
          selectedFinalId === id ? "is-selected" : "",
          () => selectForPool(id)
        )
      );
      if (opts && opts.examPick) {
        if (onFinalExam) {
          actions.appendChild(
            makeActionBtn("Remove from Final Exam", "is-on-exam", () => removeIdFromFinalExam(id))
          );
        } else {
          actions.appendChild(
            makeActionBtn("Add to Final Exam", "", () => addIdToFinalExam(id))
          );
        }
      }
    }

    const qBody = document.createElement("div");
    qBody.className = "q-body";
    qBody.textContent = p.fullText || p.summary || "(no problem text)";

    row.append(qBtn, actions, qBody);
    return row;
  }

  function makeSection(title, countLabel, ids, openByDefault, hint, groupIndex, rowOpts) {
    const section = document.createElement("div");
    section.className = openByDefault ? "section open" : "section";
    const headRow = document.createElement("div");
    headRow.className = "section-head-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "section-toggle";
    const label = document.createElement("span");
    label.textContent = title;
    const count = document.createElement("span");
    count.className = "section-count";
    count.textContent = countLabel;
    btn.append(label, count);
    btn.addEventListener("click", () => section.classList.toggle("open"));
    headRow.appendChild(btn);
    if (typeof groupIndex === "number") {
      headRow.appendChild(makePoolButtons(groupIndex, ids));
    }
    const body = document.createElement("div");
    body.className = "section-body";
    if (hint) {
      const hintEl = document.createElement("div");
      hintEl.className = "skill-hint";
      hintEl.textContent = hint;
      body.appendChild(hintEl);
    }
    for (const id of ids) body.appendChild(makeProblemRow(id, rowOpts));
    section.append(headRow, body);
    return section;
  }

  function renderFinalExam(root) {
    root.replaceChildren();
    if (!finalExamIds.length) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent =
        "No Final Exam problems yet. Open the Final Review tab and use Add to Final Exam.";
      root.appendChild(empty);
      return;
    }
    root.appendChild(
      makeSection(
        "Final Exam",
        finalExamIds.length + (finalExamIds.length === 1 ? " problem" : " problems"),
        finalExamIds,
        true,
        "",
        undefined,
        { examOnly: true }
      )
    );
  }

  function renderFinalGroups(root, openAll, examPick) {
    root.replaceChildren();
    if (!finalGroups.length) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent =
        "No Final Review problems yet. Use Add to Final Review on an exam tab.";
      root.appendChild(empty);
      return;
    }
    finalGroups.forEach((ids, index) => {
      root.appendChild(
        makeSection(
          "Pool " + (index + 1),
          ids.length + (ids.length === 1 ? " problem" : " problems"),
          ids,
          openAll !== false,
          "",
          index,
          examPick ? { examPick: true } : undefined
        )
      );
    });
  }

  function renderExamBank(root, exam) {
    root.replaceChildren();
    if (!exam || !exam.ready) {
      const empty = document.createElement("div");
      empty.className = "empty-msg";
      empty.textContent = "No problems for this exam yet.";
      root.appendChild(empty);
      return;
    }
    if (sortMode === "pool") {
      for (const pool of exam.pools) {
        root.appendChild(
          makeSection(
            "Pearson pool " + pool.pool,
            pool.ids.length + (pool.ids.length === 1 ? " alternate" : " alternates"),
            pool.ids,
            false
          )
        );
      }
      return;
    }
    if (sortMode === "all") {
      const ids = flatIds(exam).slice().sort(compareIds);
      root.appendChild(makeSection("All problems", ids.length + " problems", ids, true));
      return;
    }
    const skillGroups = skillsFor(exam.id);
    if (!skillGroups.length) {
      const ids = flatIds(exam);
      root.appendChild(makeSection("All problems", ids.length + " problems", ids, true));
      return;
    }
    for (const g of skillGroups) {
      root.appendChild(
        makeSection(
          g.label,
          g.ids.length + (g.ids.length === 1 ? " problem" : " problems"),
          g.ids,
          false,
          g.hint || ""
        )
      );
    }
  }

  function renderTabs() {
    const root = document.getElementById("exam-tabs");
    root.replaceChildren();
    for (const exam of exams()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "view-tab" + (exam.id === activeExamId ? " active" : "");
      btn.textContent = exam.label + (exam.ready ? "" : " (empty)");
      btn.addEventListener("click", () => {
        activeExamId = exam.id;
        render();
      });
      root.appendChild(btn);
    }
    const finalBtn = document.createElement("button");
    finalBtn.type = "button";
    finalBtn.className = "view-tab" + (activeExamId === "final" ? " active" : "");
    const n = finalGroups.reduce((sum, g) => sum + g.length, 0);
    finalBtn.textContent = "Final Review (" + n + ")";
    finalBtn.addEventListener("click", () => {
      activeExamId = "final";
      render();
    });
    root.appendChild(finalBtn);

    const examBtn = document.createElement("button");
    examBtn.type = "button";
    examBtn.className = "view-tab" + (activeExamId === "finalexam" ? " active" : "");
    examBtn.textContent = "Final Exam (" + finalExamIds.length + ")";
    examBtn.addEventListener("click", () => {
      activeExamId = "finalexam";
      render();
    });
    root.appendChild(examBtn);

    const idsBtn = document.createElement("button");
    idsBtn.type = "button";
    idsBtn.className = "view-tab" + (activeExamId === "ids" ? " active" : "");
    idsBtn.textContent = "Question IDs";
    idsBtn.addEventListener("click", () => {
      activeExamId = "ids";
      render();
    });
    root.appendChild(idsBtn);
  }

  function fillIdList(root, ids) {
    root.replaceChildren();
    for (const id of ids) {
      const li = document.createElement("li");
      li.textContent = id;
      root.appendChild(li);
    }
  }

  function renderIdLists() {
    const reviewIds = finalGroups.flat();
    fillIdList(document.getElementById("ids-review-root"), reviewIds);
    fillIdList(document.getElementById("ids-exam-root"), finalExamIds);
    document.querySelector("#ids-review-head span").textContent = "— " + reviewIds.length;
    document.querySelector("#ids-exam-head span").textContent = "— " + finalExamIds.length;
  }

  function renderSortTabs() {
    const root = document.getElementById("sort-tabs");
    const show = !["final", "finalexam", "ids"].includes(activeExamId);
    root.classList.toggle("hidden", !show);
    if (!show) return;
    for (const btn of root.querySelectorAll(".sort-tab")) {
      btn.classList.toggle("active", btn.getAttribute("data-sort") === sortMode);
    }
  }

  function render() {
    renderTabs();
    renderSortTabs();
    const examLayout = document.getElementById("exam-layout");
    const finalOnly = document.getElementById("final-only-layout");
    const poolCount = finalGroups.length;
    const problemCount = finalGroups.reduce((sum, g) => sum + g.length, 0);
    const sideCount = document.getElementById("side-count");
    sideCount.textContent =
      "— " + problemCount + " problem" + (problemCount === 1 ? "" : "s") +
      " in " + poolCount + " pool" + (poolCount === 1 ? "" : "s");

    const idsLayout = document.getElementById("ids-layout");
    idsLayout.classList.toggle("hidden", activeExamId !== "ids");
    if (activeExamId === "ids") {
      examLayout.classList.add("hidden");
      finalOnly.classList.add("hidden");
      renderIdLists();
      return;
    }

    if (activeExamId === "final" || activeExamId === "finalexam") {
      examLayout.classList.add("hidden");
      finalOnly.classList.remove("hidden");
      const finalRoot = document.getElementById("final-root");
      const finalHead = document.getElementById("final-panel-head");
      const finalCount = document.getElementById("final-head-count");
      if (activeExamId === "final") {
        finalHead.firstChild.textContent = "Final Review ";
        finalCount.textContent = sideCount.textContent;
        renderFinalGroups(finalRoot, true, true);
      } else {
        finalHead.firstChild.textContent = "Final Exam ";
        finalCount.textContent =
          "— " + finalExamIds.length + " problem" + (finalExamIds.length === 1 ? "" : "s");
        renderFinalExam(finalRoot);
      }
      renderMath(finalRoot);
      return;
    }

    examLayout.classList.remove("hidden");
    finalOnly.classList.add("hidden");
    const exam = findExam(activeExamId);
    const head = document.getElementById("panel-head");
    const countEl = document.getElementById("head-count");
    head.firstChild.textContent = (exam ? exam.label : "Exam") + " ";
    if (!exam || !exam.ready) {
      countEl.textContent = "— not ready";
    } else {
      countEl.textContent =
        "— " + exam.count + " questions · sort: " +
        (sortMode === "skill" ? "skill" : sortMode === "pool" ? "Pearson pool" : "flat");
    }
    renderExamBank(document.getElementById("bank-root"), exam);
    renderFinalGroups(document.getElementById("side-root"), true);
    renderMath(document.getElementById("bank-root"));
    renderMath(document.getElementById("side-root"));
  }

  window.renderFinalReviewBank = render;

  function wireSortTabs() {
    const root = document.getElementById("sort-tabs");
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".sort-tab");
      if (!btn) return;
      sortMode = btn.getAttribute("data-sort") || "skill";
      render();
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    wireFinalSyncBar();
    wireSortTabs();
    bootstrapFinalReviewState().finally(render);
  });
})();
