// ===============================
// THEME
// ===============================

const themeButton = document.getElementById("themeButton");

// Load saved theme
const savedTheme = localStorage.getItem("studypro-theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");

  themeButton.textContent = "Light Mode";
} else {
  document.body.classList.remove("dark-mode");

  themeButton.textContent = "Dark Mode";
}

// Change theme
themeButton.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    themeButton.textContent = "Light Mode";

    localStorage.setItem("studypro-theme", "dark");
  } else {
    themeButton.textContent = "Dark Mode";

    localStorage.setItem("studypro-theme", "light");
  }
});

// ===============================
// TIME-BASED GREETING
// ===============================

const greetingText = document.getElementById("greetingText");

const currentHour = new Date().getHours();

if (currentHour >= 5 && currentHour < 12) {
  greetingText.textContent = "Good morning!";
} else if (currentHour >= 12 && currentHour < 17) {
  greetingText.textContent = "Good afternoon!";
} else if (currentHour >= 17 && currentHour < 21) {
  greetingText.textContent = "Good Evening!";
} else {
  greetingText.textContent = "NIGHT OWL!";
}

// ===============================
// PAGE SECTIONS
// ===============================

const dashboardSection = document.getElementById("dashboardSection");
const subjectsSection = document.getElementById("subjectsSection");
const chaptersSection = document.getElementById("chaptersSection");
const chapterDetailSection = document.getElementById("chapterDetailSection");

const dashboardLink = document.getElementById("dashboardLink");
const subjectsLink = document.getElementById("subjectsLink");
const plannerLink = document.getElementById("plannerLink");

const plannerSection = document.getElementById("plannerSection");

const backToSubjectsBtn = document.getElementById("backToSubjectsBtn");
const backToChaptersBtn = document.getElementById("backToChaptersBtn");
let currentSubjectId = null;

// ===============================
// FUNCTION TO SHOW A PAGE
// ===============================

function showPage(pageSection) {
  // Hide all sections
  document.querySelectorAll(".page-section").forEach(function (section) {
    section.style.display = "none";
  });

  // Show selected section
  pageSection.style.display = "block";
}

// ===============================
// UPDATE ACTIVE NAVIGATION
// ===============================

function updateActiveNav(activeLink) {
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.classList.remove("active");
  });

  activeLink.classList.add("active");
}

// ===============================
// DASHBOARD NAVIGATION
// ===============================

dashboardLink.addEventListener("click", function (event) {
  event.preventDefault();

  showPage(dashboardSection);

  updateActiveNav(dashboardLink);

  loadDashboard();
});

// ===============================
// SUBJECTS NAVIGATION
// ===============================

subjectsLink.addEventListener("click", function (event) {
  event.preventDefault();

  showPage(subjectsSection);

  updateActiveNav(subjectsLink);

  loadSubjects();
});

// ===============================
// PLANNER NAVIGATION
// ===============================

plannerLink.addEventListener("click", function (event) {
  event.preventDefault();

  showPage(plannerSection);

  updateActiveNav(plannerLink);

  loadPlanner();
});

// ===============================
// LOAD DASHBOARD
// ===============================

async function loadDashboard() {
  try {
    const response = await fetch("http://127.0.0.1:5000/users/1/dashboard");

    if (!response.ok) {
      throw new Error("Failed to load dashboard");
    }

    const data = await response.json();
    // ===============================
    // SUBJECT-WISE PROGRESS
    // ===============================

    const subjectProgressContainer = document.getElementById(
      "subjectProgressContainer",
    );

    subjectProgressContainer.innerHTML = "";

    data.subjects.forEach(function (subject, index) {
      const progress = Number(subject.progress_percentage) || 0;

      const progressColors = [
        "#2563eb",
        "#16a34a",
        "#7c3aed",
        "#f59e0b",
        "#e11d48",
        "#0891b2",
      ];

      const progressColor = progressColors[index % progressColors.length];

      const row = document.createElement("div");

      row.className = "subject-progress-row";

      row.innerHTML = `
        <div class="subject-progress-header">

            <span>
                ${subject.subject_name}
            </span>

            <span>
                ${subject.completed_chapters}/${subject.total_chapters}
            </span>

        </div>

        <div class="subject-progress-bar">

            <div
                class="subject-progress-fill"
                style="width: ${progress}%; background: ${progressColor};"
            ></div>

        </div>

        <div class="subject-progress-percentage">
            ${progress}%
        </div>
    `;

      subjectProgressContainer.appendChild(row);
    });
    const progress = Number(data.overall.progress_percentage) || 0;

    const progressCircle = document.getElementById("progressCircle");

    const progressCircleText = document.getElementById("progressCircleText");

    const circumference = 2 * Math.PI * 70;

    const offset = circumference - (progress / 100) * circumference;

    progressCircle.style.strokeDasharray = circumference;

    progressCircle.style.strokeDashoffset = offset;

    progressCircleText.textContent = progress + "%";

    document.getElementById("completedChapters").textContent =
      data.overall.completed_chapters;

    document.getElementById("pendingChapters").textContent =
      data.overall.pending_chapters;

    document.getElementById("totalRevisions").textContent =
      data.overall.total_revisions;
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

function getSubjectIcon(subjectName) {
  const name = subjectName.toLowerCase();

  if (name.includes("physics")) {
    return "⚛";
  }

  if (name.includes("chem")) {
    return "🧪";
  }

  if (name.includes("math") || name.includes("mathematics")) {
    return "📐";
  }

  if (name.includes("computer") || name.includes("program")) {
    return "💻";
  }

  if (name.includes("english")) {
    return "📚";
  }

  return "📘";
}

// ===============================
// LOAD SUBJECTS
// ===============================

async function loadSubjects() {
  const container = document.getElementById("subjectsContainer");

  container.innerHTML = "<p>Loading subjects...</p>";

  try {
    const response = await fetch("http://127.0.0.1:5000/subjects");

    if (!response.ok) {
      throw new Error("Failed to load subjects");
    }

    const subjects = await response.json();

    container.innerHTML = "";

    const progressColors = [
      "#2563eb",
      "#16a34a",
      "#7c3aed",
      "#f59e0b",
      "#e11d48",
      "#0891b2",
    ];

    subjects.forEach(function (subject, index) {
      const totalChapters = Number(subject.total_chapters) || 0;

      const completedChapters = Number(subject.completed_chapters) || 0;

      const progress =
        totalChapters === 0
          ? 0
          : Math.round((completedChapters / totalChapters) * 100);

      const progressColor = progressColors[index % progressColors.length];

      const radius = 42;

      const circumference = 2 * Math.PI * radius;

      const offset = circumference - (progress / 100) * circumference;

      const subjectCard = document.createElement("div");

      subjectCard.className = "subject-card";

      subjectCard.addEventListener("click", function () {
        subjectCard.classList.add("subject-card-pop");

        setTimeout(function () {
          viewChapters(subject.id, subject.name);
        }, 150);
      });

      subjectCard.innerHTML = `

                <!-- TOP -->

                <div class="subject-card-top">

                    <div
                        class="subject-icon-large"
                        style="
                            color: ${progressColor};
                            background: ${progressColor}18;
                        "
                    >
                        ${subject.symbol || "📘"}
                    </div>


                    <!-- PROGRESS CIRCLE -->

                    <div
                        class="subject-mini-progress"
                        style="
                            --progress-color: ${progressColor};
                        "
                    >

                        <svg viewBox="0 0 100 100">

                            <circle
                                class="mini-progress-bg"
                                cx="50"
                                cy="50"
                                r="${radius}"
                            ></circle>

                            <circle
                                class="mini-progress-fill"
                                cx="50"
                                cy="50"
                                r="${radius}"
                                style="
                                    stroke-dasharray: ${circumference};
                                    stroke-dashoffset: ${offset};
                                "
                            ></circle>

                        </svg>

                        <span>
                            ${progress}%
                        </span>

                    </div>

                </div>


                <!-- NAME -->

                <h3 class="subject-card-title">
                    ${subject.name}
                </h3>


                <!-- CHAPTER COUNT -->

                <p class="subject-card-count">
                    ${completedChapters} of
                    ${totalChapters} chapters
                </p>


                <!-- PROGRESS BAR -->

                <div class="subject-card-progress">

                    <div
                        class="subject-card-progress-fill"
                        style="
                            width: ${progress}%;
                            background: ${progressColor};
                        "
                    ></div>

                </div>


                <!-- VIEW -->

                


                <!-- EDIT -->

                <button
    class="icon-btn edit-btn"
    onclick="event.stopPropagation(); openEditSubjectModal(
        ${subject.id},
        '${subject.name.replace(/'/g, "\\'")}'
    )"
                    title="Edit Subject"
                    onclick="openEditSubjectModal(
                        ${subject.id},
                        '${subject.name.replace(/'/g, "\\'")}'
                    )"
                >
                    ✎
                </button>


                <!-- DELETE -->

                <button
    class="icon-btn delete-btn"
    onclick="event.stopPropagation(); openDeleteSubjectModal(
        ${subject.id},
        '${subject.name.replace(/'/g, "\\'")}'
    )"
                    title="Delete Subject"
                    onclick="openDeleteSubjectModal(
                        ${subject.id},
                        '${subject.name.replace(/'/g, "\\'")}'
                    )"
                >

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <path
                            d="M4 7h16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />

                        <path
                            d="M9 7V4h6v3"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />

                        <path
                            d="M6 7l1 13h10l1-13"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linejoin="round"
                        />

                        <path
                            d="M10 11v5M14 11v5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />

                    </svg>

                </button>

            `;

      container.appendChild(subjectCard);
    });
  } catch (error) {
    console.error("Error loading subjects:", error);

    container.innerHTML = "<p>Could not load subjects.</p>";
  }
}

// ===============================
// VIEW CHAPTERS
// ===============================

async function viewChapters(subjectId, subjectName) {
  console.log("Opening chapters for subject:", subjectId);

  currentSubjectId = subjectId;

  showPage(chaptersSection);

  document.getElementById("chaptersTitle").textContent =
    subjectName + " - Chapters";

  // Get containers FIRST
  const hardContainer = document.getElementById("hardChaptersContainer");

  const mediumContainer = document.getElementById("mediumChaptersContainer");

  const easyContainer = document.getElementById("easyChaptersContainer");

  // Clear old content
  hardContainer.innerHTML = "";
  mediumContainer.innerHTML = "";
  easyContainer.innerHTML = "";

  try {
    const response = await fetch(
      `http://127.0.0.1:5000/subjects/${subjectId}/chapters`,
    );

    if (!response.ok) {
      throw new Error("Failed to load chapters");
    }

    const chapters = await response.json();

    //Update Subject Overview
    updateSubjectOverview(chapters);

    // No chapters
    if (chapters.length === 0) {
      updateSubjectOverview(chapters);

      hardContainer.innerHTML = "<p>No chapters found for this subject.</p>";

      document.getElementById("hardChapterCount").textContent = "(0)";

      document.getElementById("mediumChapterCount").textContent = "(0)";

      document.getElementById("easyChapterCount").textContent = "(0)";

      return;
    }

    let hardCount = 0;
    let mediumCount = 0;
    let easyCount = 0;

    chapters.forEach(function (chapter) {
      const chapterRow = document.createElement("div");

      const completedClass = chapter.completed ? "chapter-completed" : "";

      chapterRow.className = `chapter-row ${completedClass}`;

      // Store chapter data on the row
      chapterRow._chapterData = chapter;

      chapterRow.dataset.chapterId = chapter.chapter_id;

      const confidence = Math.min(
        5,
        Math.max(0, Number(chapter.confidence) || 0),
      );

      chapterRow.innerHTML = `

        <div class="chapter-main">

          <label class="chapter-check">

            <input
              type="checkbox"
              ${chapter.completed ? "checked" : ""}
              onchange="completeChapter(${chapter.chapter_id})"
            >

            <span class="custom-checkbox"></span>

          </label>


          <div class="chapter-info">

            <div class="chapter-title">

              ${chapter.chapter_name}

              <span
                class="difficulty-badge ${chapter.difficulty.toLowerCase()}"
              >
                ${chapter.difficulty}
              </span>

            </div>


            <div class="chapter-meta">

              <span class="chapter-revision-text">
                ↻ ${chapter.revision_count} revisions
              </span>

              <div
                class="chapter-confidence"
                data-chapter-id="${chapter.chapter_id}"
                data-confidence="${confidence}"
              >

                <div class="chapter-stars">

                  <span
                    class="confidence-star ${confidence >= 1 ? "selected" : ""}"
                    data-value="1"
                  >★</span>

                  <span
                    class="confidence-star ${confidence >= 2 ? "selected" : ""}"
                    data-value="2"
                  >★</span>

                  <span
                    class="confidence-star ${confidence >= 3 ? "selected" : ""}"
                    data-value="3"
                  >★</span>

                  <span
                    class="confidence-star ${confidence >= 4 ? "selected" : ""}"
                    data-value="4"
                  >★</span>

                  <span
                    class="confidence-star ${confidence >= 5 ? "selected" : ""}"
                    data-value="5"
                  >★</span>

                </div>

                <div class="chapter-confidence-label">
                  ${confidence > 0 ? getConfidenceLabel(confidence) : ""}
                </div>

              </div>

            </div>

          </div>

        </div>


        <div class="chapter-actions-right">

          <button
            class="revise-btn"
            onclick="reviseChapter(${chapter.chapter_id})"
            title="Record Revision"
          >
            ↻ Revise
          </button>


          <button
            class="chapter-more-btn"
            onclick="toggleChapterDetails(
              ${chapter.chapter_id},
              this
            )"
            title="View Chapter Details"
          >
            ⌄
          </button>


          <button
            class="icon-btn chapter-delete-btn"
            onclick="openDeleteChapterModal(
              ${chapter.chapter_id},
              '${chapter.chapter_name.replace(/'/g, "\\'")}'
            )"
            title="Delete Chapter"
          >

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M5 7h14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />

              <path
                d="M9 7V4h6v3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />

              <path
                d="M7 7l1 13h8l1-13"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />

              <path
                d="M10 11v5M14 11v5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />

            </svg>

          </button>

        </div>

      `;

      // Enable confidence stars
      setupChapterConfidence(chapterRow.querySelector(".chapter-confidence"));

      // Put chapter in correct group
      if (chapter.difficulty.toLowerCase() === "hard") {
        hardContainer.appendChild(chapterRow);
        hardCount++;
      } else if (chapter.difficulty.toLowerCase() === "medium") {
        mediumContainer.appendChild(chapterRow);
        mediumCount++;
      } else {
        easyContainer.appendChild(chapterRow);
        easyCount++;
      }
    });

    document.getElementById("hardChapterCount").textContent = `(${hardCount})`;

    document.getElementById("mediumChapterCount").textContent =
      `(${mediumCount})`;

    document.getElementById("easyChapterCount").textContent = `(${easyCount})`;
  } catch (error) {
    console.error("Error loading chapters:", error);

    hardContainer.innerHTML = "<p>Could not load chapters.</p>";

    mediumContainer.innerHTML = "";
    easyContainer.innerHTML = "";
  }
}

function getConfidenceLabel(value) {
  const labels = {
    1: "Very Low",
    2: "Low",
    3: "Average",
    4: "Good",
    5: "Very Good",
  };

  return labels[value] || "";
}

function updateSubjectOverview(chapters) {
  const total = chapters.length;

  const completed = chapters.filter(function (chapter) {
    return Boolean(chapter.completed);
  }).length;

  const revisions = chapters.reduce(function (sum, chapter) {
    return sum + (Number(chapter.revision_count) || 0);
  }, 0);

  const confidenceTotal = chapters.reduce(function (sum, chapter) {
    return sum + (Number(chapter.confidence) || 0);
  }, 0);

  const averageConfidence =
    total === 0 ? 0 : Math.round((confidenceTotal / total) * 10) / 10;

  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // ===============================
  // TEXT
  // ===============================

  document.getElementById("subjectChapterSubtitle").textContent =
    `${total} chapters • Track your progress`;

  document.getElementById("subjectTotal").textContent = total;

  document.getElementById("subjectCompleted").textContent = completed;

  document.getElementById("subjectRevisions").textContent = revisions;

  document.getElementById("subjectAvgConfidence").textContent =
    averageConfidence;

  // ===============================
  // PROGRESS CIRCLE
  // ===============================

  const circle = document.getElementById("subjectProgressCircle");

  const progressText = document.getElementById("subjectProgressText");

  if (circle) {
    const radius = 52;

    const circumference = 2 * Math.PI * radius;

    const offset = circumference - (progress / 100) * circumference;

    circle.style.strokeDasharray = circumference;

    circle.style.strokeDashoffset = offset;
  }

  if (progressText) {
    progressText.textContent = `${progress}%`;
  }
}

function setupChapterConfidence(rating) {
  if (!rating) return;

  const stars = rating.querySelectorAll(".confidence-star");

  const label = rating.querySelector(".chapter-confidence-label");

  const chapterId = rating.dataset.chapterId;

  let selectedValue = Math.min(
    5,
    Math.max(0, Number(rating.dataset.confidence) || 0),
  );

  function updateStars(value) {
    stars.forEach(function (star) {
      const starValue = Number(star.dataset.value);

      star.classList.toggle("selected", starValue <= value);
    });

    if (label) {
      label.textContent = value > 0 ? getConfidenceLabel(value) : "";
    }
  }

  updateStars(selectedValue);

  stars.forEach(function (star) {
    star.addEventListener("mouseenter", function () {
      const value = Number(this.dataset.value);

      stars.forEach(function (item) {
        const itemValue = Number(item.dataset.value);

        item.classList.toggle("hovered", itemValue <= value);
      });

      if (label) {
        label.textContent = getConfidenceLabel(value);
      }
    });

    star.addEventListener("click", async function (event) {
      event.stopPropagation();

      const value = Number(this.dataset.value);

      selectedValue = value;

      rating.dataset.confidence = value;

      updateStars(value);

      await saveChapterConfidence(chapterId, value);
    });
  });

  rating.addEventListener("mouseleave", function () {
    stars.forEach(function (star) {
      star.classList.remove("hovered");
    });

    updateStars(selectedValue);
  });
}

async function saveChapterConfidence(chapterId, value) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/chapters/${chapterId}/confidence`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          confidence: value,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update confidence");
    }

    // Update stored chapter data
    const row = document.querySelector(
      `.chapter-row[data-chapter-id="${chapterId}"]`,
    );

    if (!row) return;

    if (row._chapterData) {
      row._chapterData.confidence = value;
    }

    // Update main stars
    const rating = row.querySelector(".chapter-confidence");

    if (rating) {
      rating.dataset.confidence = value;

      rating.querySelectorAll(".confidence-star").forEach(function (star) {
        star.classList.toggle("selected", Number(star.dataset.value) <= value);
      });

      const label = rating.querySelector(".chapter-confidence-label");

      if (label) {
        label.textContent = getConfidenceLabel(value);
      }
    }

    // Update expanded details too
    const details = row.querySelector(".inline-chapter-details");

    if (details) {
      const valueElement = details.querySelector(".inline-confidence-value");

      const labelElement = details.querySelector(".inline-confidence-label");

      if (valueElement) {
        valueElement.textContent = `${value}/5`;
      }

      if (labelElement) {
        labelElement.textContent = getConfidenceLabel(value);
      }

      details
        .querySelectorAll(".inline-confidence-star")
        .forEach(function (star) {
          star.classList.toggle(
            "selected",
            Number(star.dataset.value) <= value,
          );
        });
    }
  } catch (error) {
    console.error("Error updating confidence:", error);

    alert("Could not update confidence.");
  }
}

async function toggleChapterDetails(chapterId, button) {
  const chapterRow = button.closest(".chapter-row");

  if (!chapterRow) return;

  const existingDetails = chapterRow.querySelector(".inline-chapter-details");

  // CLOSE
  if (existingDetails) {
    existingDetails.classList.toggle("open");

    button.classList.toggle("active");

    button.textContent = existingDetails.classList.contains("open") ? "⌃" : "⌄";

    return;
  }

  const chapter = chapterRow._chapterData;

  if (!chapter) {
    console.error("Chapter data not found");

    return;
  }

  const confidence = Number(chapter.confidence) || 0;

  const details = document.createElement("div");

  details.className = "inline-chapter-details";

  details.innerHTML = `

    <div class="inline-detail-grid">

      <div class="inline-detail-item">

        <span>Status</span>

        <strong class="inline-status">

          ${chapter.completed ? "Completed" : "Not Completed"}

        </strong>

      </div>


      <div class="inline-detail-item">

        <span>Difficulty</span>

        <strong>
          ${chapter.difficulty}
        </strong>

      </div>


      <div class="inline-detail-item">

        <span>Confidence</span>

        <div class="inline-confidence-stars">

          ${[1, 2, 3, 4, 5]
            .map(function (value) {
              return `

                <span
                  class="inline-confidence-star ${
                    value <= confidence ? "selected" : ""
                  }"
                  data-value="${value}"
                >
                  ★
                </span>

              `;
            })
            .join("")}

        </div>


        <strong
          class="inline-confidence-value"
        >
          ${confidence}/5
        </strong>


        <small
          class="inline-confidence-label"
        >
          ${
            confidence > 0
              ? getConfidenceLabel(confidence)
              : "Select your confidence"
          }
        </small>

      </div>


      <div class="inline-detail-item">

        <span>Revisions</span>

        <strong class="inline-revision-count">
          ${chapter.revision_count || 0}
        </strong>

      </div>


      <div class="inline-detail-item">

        <span>Last Revised</span>

        <strong class="inline-last-revised">
          ${chapter.last_revised || "Never"}
        </strong>

      </div>

    </div>

  `;

  chapterRow.appendChild(details);

  // INLINE CONFIDENCE
  const stars = details.querySelectorAll(".inline-confidence-star");

  let selectedValue = confidence;

  stars.forEach(function (star) {
    star.addEventListener("mouseenter", function () {
      const value = Number(this.dataset.value);

      stars.forEach(function (item) {
        item.classList.toggle("hovered", Number(item.dataset.value) <= value);
      });

      details.querySelector(".inline-confidence-label").textContent =
        getConfidenceLabel(value);
    });

    star.addEventListener("click", async function (event) {
      event.stopPropagation();

      const value = Number(this.dataset.value);

      selectedValue = value;

      details.querySelector(".inline-confidence-value").textContent =
        `${value}/5`;

      details.querySelector(".inline-confidence-label").textContent =
        getConfidenceLabel(value);

      stars.forEach(function (item) {
        item.classList.toggle("selected", Number(item.dataset.value) <= value);
      });

      await saveChapterConfidence(chapterId, value);
    });
  });

  details
    .querySelector(".inline-confidence-stars")
    .addEventListener("mouseleave", function () {
      stars.forEach(function (star) {
        star.classList.remove("hovered");
      });

      details.querySelector(".inline-confidence-label").textContent =
        selectedValue > 0
          ? getConfidenceLabel(selectedValue)
          : "Select your confidence";
    });

  // Smooth opening
  requestAnimationFrame(function () {
    details.classList.add("open");

    button.classList.add("active");

    button.textContent = "⌃";
  });
}

// ===============================
// BACK TO SUBJECTS
// ===============================

backToSubjectsBtn.addEventListener("click", function () {
  showPage(subjectsSection);

  updateActiveNav(subjectsLink);

  loadSubjects();
});

// ===============================
// VIEW CHAPTER DETAIL
// ===============================

async function completeChapter(chapterId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/chapters/${chapterId}/complete`,
      {
        method: "PUT",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to complete chapter");
    }

    const row = document.querySelector(
      `.chapter-row[data-chapter-id="${chapterId}"]`,
    );

    if (!row) return;

    const chapter = row._chapterData;

    // Toggle completion
    chapter.completed = !chapter.completed;

    row.classList.toggle("chapter-completed", chapter.completed);

    // Update expanded status
    const status = row.querySelector(".inline-status");

    if (status) {
      status.textContent = chapter.completed ? "Completed" : "Not Completed";
    }
  } catch (error) {
    console.error("Error completing chapter:", error);

    alert("Could not update chapter status.");
  }
}

async function reviseChapter(chapterId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/chapters/${chapterId}/revise`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to record revision");
    }

    const result = await response.json();

    const data = Array.isArray(result) ? result[0] : result;

    const row = document.querySelector(
      `.chapter-row[data-chapter-id="${chapterId}"]`,
    );

    if (!row) return;

    const revisionCount = Number(data.revision_count) || 0;

    const lastRevised = data.last_revised || "Never";

    // Store updated values
    if (row._chapterData) {
      row._chapterData.revision_count = revisionCount;

      row._chapterData.last_revised = lastRevised;
    }

    // Update visible revision count
    const revisionText = row.querySelector(".chapter-revision-text");

    if (revisionText) {
      revisionText.textContent = `↻ ${revisionCount} revisions`;
    }

    // Update expanded details
    const details = row.querySelector(".inline-chapter-details");

    if (details) {
      const revisionElement = details.querySelector(".inline-revision-count");

      const lastRevisedElement = details.querySelector(".inline-last-revised");

      if (revisionElement) {
        revisionElement.textContent = revisionCount;
      }

      if (lastRevisedElement) {
        lastRevisedElement.textContent = lastRevised;
      }
    }

    // Yellow success effect
    const reviseButton = row.querySelector(".revise-btn");

    if (reviseButton) {
      reviseButton.classList.add("revision-success");

      setTimeout(function () {
        reviseButton.classList.remove("revision-success");
      }, 500);
    }
  } catch (error) {
    console.error("Error recording revision:", error);

    alert("Could not record revision.");
  }
}

// ===============================
// MARK CHAPTER COMPLETE
// ===============================

async function completeChapter(chapterId, checkbox) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/chapters/${chapterId}/complete`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: checkbox.checked,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update chapter completion");
    }

    const chapterRow = checkbox.closest(".chapter-row");

    if (checkbox.checked) {
      chapterRow.classList.add("chapter-completed");
    } else {
      chapterRow.classList.remove("chapter-completed");
    }
  } catch (error) {
    console.error("Error updating chapter:", error);

    // Restore the checkbox if the request failed
    checkbox.checked = !checkbox.checked;

    const chapterRow = checkbox.closest(".chapter-row");

    if (checkbox.checked) {
      chapterRow.classList.add("chapter-completed");
    } else {
      chapterRow.classList.remove("chapter-completed");
    }

    alert("Could not update chapter completion.");
  }
}

// ===============================
// BACK TO CHAPTERS
// ===============================

backToChaptersBtn.addEventListener("click", function () {
  showPage(chaptersSection);
});

// ===============================
// START APP
// ===============================

// ===============================
// ADD SUBJECT MODAL
// ===============================

const addSubjectBtn = document.getElementById("addSubjectBtn");

const subjectModal = document.getElementById("subjectModal");

const closeSubjectModal = document.getElementById("closeSubjectModal");

const cancelSubjectBtn = document.getElementById("cancelSubjectBtn");

const saveSubjectBtn = document.getElementById("saveSubjectBtn");

const subjectNameInput = document.getElementById("subjectNameInput");

// ===============================
// SUBJECT SYMBOL PICKER
// ===============================

const symbolOptions = document.querySelectorAll(".symbol-option");

let selectedSubjectSymbol = "⚛";

symbolOptions.forEach(function (option) {
  option.addEventListener("click", function () {
    // Remove selection from all symbols
    symbolOptions.forEach(function (item) {
      item.classList.remove("selected");
    });

    // Select clicked symbol
    this.classList.add("selected");

    // Remember selected symbol
    selectedSubjectSymbol = this.dataset.symbol;
  });
});

// ===============================
// OPEN MODAL
// ===============================

addSubjectBtn.addEventListener("click", function () {
  subjectModal.style.display = "flex";

  subjectNameInput.value = "";

  // Reset symbol to first option
  selectedSubjectSymbol = "⚛";

  symbolOptions.forEach(function (item) {
    item.classList.remove("selected");
  });

  const firstSymbol = document.querySelector('.symbol-option[data-symbol="⚛"]');

  if (firstSymbol) {
    firstSymbol.classList.add("selected");
  }

  subjectNameInput.focus();
});

// ===============================
// CLOSE MODAL - X
// ===============================

closeSubjectModal.addEventListener("click", function () {
  subjectModal.style.display = "none";
});

// ===============================
// CLOSE MODAL - CANCEL
// ===============================

cancelSubjectBtn.addEventListener("click", function () {
  subjectModal.style.display = "none";
});

// ===============================
// CLOSE MODAL - OUTSIDE
// ===============================

subjectModal.addEventListener("click", function (event) {
  if (event.target === subjectModal) {
    subjectModal.style.display = "none";
  }
});

// ===============================
// SAVE SUBJECT
// ===============================

saveSubjectBtn.addEventListener("click", async function () {
  const subjectName = subjectNameInput.value.trim();

  if (!subjectName) {
    alert("Please enter a subject name.");

    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/subjects", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        user_id: 1,
        name: subjectName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add subject");
    }

    // Close modal
    subjectModal.style.display = "none";

    // Refresh subject list
    loadSubjects();
  } catch (error) {
    console.error("Error adding subject:", error);

    alert("Could not add subject.");
  }
});

function setupConfidenceStars(currentConfidence) {
  const stars = document.querySelectorAll(".star");
  const confidenceText = document.getElementById("confidenceText");
  const confidenceSelect = document.getElementById("confidenceSelect");

  const labels = {
    1: "Very Low",
    2: "Low",
    3: "Average",
    4: "Good",
    5: "Very Good",
  };

  let selectedValue = Number(currentConfidence) || 1;

  function showStars(value) {
    stars.forEach((star) => {
      const starValue = Number(star.dataset.value);

      if (starValue <= value) {
        star.classList.add("selected");
      } else {
        star.classList.remove("selected");
      }
    });

    confidenceText.textContent = labels[value];
  }

  stars.forEach((star) => {
    // When mouse moves over a star
    star.addEventListener("mouseenter", function () {
      const value = Number(this.dataset.value);

      showStars(value);
    });

    // When user clicks a star
    star.addEventListener("click", function () {
      const value = Number(this.dataset.value);

      selectedValue = value;

      confidenceSelect.value = value;

      showStars(value);
    });
  });

  // When mouse leaves the whole star area,
  // return to the actually selected confidence
  const starRating = document.getElementById("starRating");

  starRating.addEventListener("mouseleave", function () {
    showStars(selectedValue);
  });

  // Show existing confidence when chapter opens
  confidenceSelect.value = selectedValue;

  showStars(selectedValue);
}

// ===============================
// DELETE CHAPTER
// ===============================

function openDeleteChapterModal(chapterId, chapterName) {
  const appModal = document.getElementById("appModal");

  const modalTitle = document.getElementById("modalTitle");

  const modalMessage = document.getElementById("modalMessage");

  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  const modalCancelBtn = document.getElementById("modalCancelBtn");

  const closeModal = document.getElementById("closeModal");

  modalTitle.textContent = "Delete Chapter";

  modalMessage.textContent = `Are you sure you want to delete "${chapterName}"? This cannot be undone.`;

  modalConfirmBtn.textContent = "Delete";

  modalCancelBtn.textContent = "Cancel";

  appModal.style.display = "flex";

  // Close buttons
  closeModal.onclick = function () {
    appModal.style.display = "none";
  };

  modalCancelBtn.onclick = function () {
    appModal.style.display = "none";
  };

  // Confirm delete
  modalConfirmBtn.onclick = async function () {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/chapters/${chapterId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete chapter");
      }

      appModal.style.display = "none";

      // Go back to chapters page
      showPage(chaptersSection);

      // Reload the current chapter list
      loadChaptersAfterDelete();
    } catch (error) {
      console.error("Error deleting chapter:", error);

      modalMessage.textContent = "Could not delete the chapter.";
    }
  };
}

async function loadChaptersAfterDelete() {
  location.reload();
}

// ===============================
// EDIT SUBJECT
// ===============================

function openEditSubjectModal(subjectId, subjectName) {
  const appModal = document.getElementById("appModal");

  const modalTitle = document.getElementById("modalTitle");

  const modalMessage = document.getElementById("modalMessage");

  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  const modalCancelBtn = document.getElementById("modalCancelBtn");

  const closeModal = document.getElementById("closeModal");

  modalTitle.textContent = "Edit Subject";

  modalMessage.innerHTML = `
        <input
            type="text"
            id="editSubjectInput"
            value="${subjectName}"
            style="width:100%; padding:10px; margin-top:10px;"
        >
    `;

  modalConfirmBtn.textContent = "Save";
  modalCancelBtn.textContent = "Cancel";

  appModal.style.display = "flex";

  closeModal.onclick = function () {
    appModal.style.display = "none";
  };

  modalCancelBtn.onclick = function () {
    appModal.style.display = "none";
  };

  modalConfirmBtn.onclick = async function () {
    const newName = document.getElementById("editSubjectInput").value.trim();

    if (!newName) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/subjects/${subjectId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update subject");
      }

      appModal.style.display = "none";

      loadSubjects();
    } catch (error) {
      console.error("Error updating subject:", error);

      modalMessage.textContent = "Could not update subject.";
    }
  };
}

// ===============================
// DELETE SUBJECT
// ===============================

function openDeleteSubjectModal(subjectId, subjectName) {
  const appModal = document.getElementById("appModal");

  const modalTitle = document.getElementById("modalTitle");

  const modalMessage = document.getElementById("modalMessage");

  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  const modalCancelBtn = document.getElementById("modalCancelBtn");

  const closeModal = document.getElementById("closeModal");

  modalTitle.textContent = "Delete Subject";

  modalMessage.textContent = `Are you sure you want to delete "${subjectName}"?`;

  modalConfirmBtn.textContent = "Delete";
  modalCancelBtn.textContent = "Cancel";

  appModal.style.display = "flex";

  closeModal.onclick = function () {
    appModal.style.display = "none";
  };

  modalCancelBtn.onclick = function () {
    appModal.style.display = "none";
  };

  modalConfirmBtn.onclick = async function () {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/subjects/${subjectId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete subject");
      }

      appModal.style.display = "none";

      loadSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);

      modalMessage.textContent = "Could not delete subject.";
    }
  };
}

// ===============================
// ADD CHAPTER MODAL
// ===============================

const addChapterBtn = document.getElementById("addChapterBtn");

const addChapterModal = document.getElementById("addChapterModal");

const closeAddChapterModal = document.getElementById("closeAddChapterModal");

const cancelAddChapterBtn = document.getElementById("cancelAddChapterBtn");

const saveAddChapterBtn = document.getElementById("saveAddChapterBtn");

const chapterNoInput = document.getElementById("chapterNoInput");

const chapterNameInput = document.getElementById("chapterNameInput");

const chapterDifficultyInput = document.getElementById(
  "chapterDifficultyInput",
);

// ===============================
// OPEN MODAL
// ===============================

addChapterBtn.addEventListener("click", function () {
  if (!currentSubjectId) {
    alert("Please open a subject first.");

    return;
  }

  addChapterModal.style.display = "flex";

  chapterNoInput.value = "";

  chapterNameInput.value = "";

  chapterDifficultyInput.value = "Medium";

  chapterNoInput.focus();
});

// ===============================
// CLOSE MODAL - X
// ===============================

closeAddChapterModal.addEventListener("click", function () {
  addChapterModal.style.display = "none";
});

// ===============================
// CLOSE MODAL - CANCEL
// ===============================

cancelAddChapterBtn.addEventListener("click", function () {
  addChapterModal.style.display = "none";
});

// ===============================
// CLOSE MODAL - OUTSIDE
// ===============================

addChapterModal.addEventListener("click", function (event) {
  if (event.target === addChapterModal) {
    addChapterModal.style.display = "none";
  }
});

// ===============================
// SAVE CHAPTER
// ===============================

saveAddChapterBtn.addEventListener("click", async function () {
  const chapterNo = Number(chapterNoInput.value);

  const chapterName = chapterNameInput.value.trim();

  const difficulty = chapterDifficultyInput.value;

  if (!chapterNo || !chapterName) {
    alert("Please enter the chapter number and name.");

    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/chapters", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        subject_id: currentSubjectId,
        chapter_no: chapterNo,
        chapter_name: chapterName,
        difficulty: difficulty,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add chapter");
    }

    addChapterModal.style.display = "none";

    // Reload the current subject's chapters
    const title = document.getElementById("chaptersTitle");

    const subjectName = title.textContent.replace(" - Chapters", "");

    viewChapters(currentSubjectId, subjectName);
  } catch (error) {
    console.error("Error adding chapter:", error);

    alert("Could not add chapter.");
  }
});

// ===============================
// LOAD PLANNER
// ===============================

function loadPlanner() {
  async function loadPlanner() {
    const examsContainer = document.getElementById("examsContainer");

    const tasksContainer = document.getElementById("tasksContainer");

    examsContainer.innerHTML = "<p>Loading exams...</p>";

    tasksContainer.innerHTML = "<p>Loading study tasks...</p>";

    try {
      // ===============================
      // LOAD EXAMS
      // ===============================

      const examsResponse = await fetch("http://127.0.0.1:5000/users/1/exams");

      if (!examsResponse.ok) {
        throw new Error("Failed to load exams");
      }

      const exams = await examsResponse.json();

      if (exams.length === 0) {
        examsContainer.innerHTML = "<p>No upcoming exams.</p>";
      } else {
        examsContainer.innerHTML = "";

        exams.forEach(function (exam) {
          const examCard = document.createElement("div");

          examCard.className = "planner-item";

          examCard.innerHTML = `
                    <div>

                        <strong>
                            ${exam.exam_name}
                        </strong>

                        <p>
                            ${exam.subject_name || "No subject"}
                        </p>

                    </div>

                    <div class="planner-date">

                        <strong>
                            ${exam.exam_date}
                        </strong>

                        <span>
                            ${exam.days_remaining} days remaining
                        </span>

                    </div>
                `;

          examsContainer.appendChild(examCard);
        });
      }

      // ===============================
      // LOAD STUDY TASKS
      // ===============================

      const tasksResponse = await fetch("http://127.0.0.1:5000/users/1/tasks");

      if (!tasksResponse.ok) {
        throw new Error("Failed to load tasks");
      }

      const tasks = await tasksResponse.json();

      if (tasks.length === 0) {
        tasksContainer.innerHTML = "<p>No study tasks yet.</p>";
      } else {
        tasksContainer.innerHTML = "";

        tasks.forEach(function (task) {
          const taskCard = document.createElement("div");

          taskCard.className = "planner-item";

          taskCard.innerHTML = `
                    <div>

                        <strong>
                            ${task.task_title}
                        </strong>

                        <p>
                            ${task.subject_name || "General study"}

                            ${
                              task.chapter_name ? " • " + task.chapter_name : ""
                            }
                        </p>

                    </div>

                    <div class="planner-date">

                        <strong>
                            ${task.task_date}
                        </strong>

                        <span>
                            ${task.duration_minutes} min
                        </span>

                    </div>
                `;

          tasksContainer.appendChild(taskCard);
        });
      }
    } catch (error) {
      console.error("Error loading planner:", error);

      examsContainer.innerHTML = "<p>Could not load exams.</p>";

      tasksContainer.innerHTML = "<p>Could not load study tasks.</p>";
    }
  }
}

// ===============================
// INLINE CHAPTER DETAILS
// ===============================

async function toggleChapterDetails(chapterId, button) {
  const chapterRow = button.closest(".chapter-row");

  const existingDetails = chapterRow.querySelector(".inline-chapter-details");

  // If details already exist
  if (existingDetails) {
    // If currently open → CLOSE
    if (existingDetails.classList.contains("open")) {
      existingDetails.classList.remove("open");
      button.classList.remove("active");
      button.textContent = "⌄";
    }

    // If currently closed → OPEN AGAIN
    else {
      existingDetails.classList.add("open");
      button.classList.add("active");
      button.textContent = "⌃";
    }

    return;
  }

  // ===============================
  // LOAD DETAILS FOR FIRST OPEN
  // ===============================

  try {
    const response = await fetch(`http://127.0.0.1:5000/chapters/${chapterId}`);

    if (!response.ok) {
      throw new Error("Failed to load chapter details");
    }

    const chapter = await response.json();

    const details = document.createElement("div");

    details.className = "inline-chapter-details";

    details.innerHTML = `
      <div class="inline-detail-grid">

        <div class="inline-detail-item">
          <span>Status</span>
          <strong>
            ${chapter.completed ? "Completed" : "Not Completed"}
          </strong>
        </div>

        <div class="inline-detail-item">
          <span>Difficulty</span>
          <strong>${chapter.difficulty}</strong>
        </div>

        <div class="inline-detail-item">
          <span>Confidence</span>
          <strong>${chapter.confidence || 1}/5</strong>
        </div>

        <div class="inline-detail-item">
          <span>Revisions</span>
          <strong>${chapter.revision_count}</strong>
        </div>

        <div class="inline-detail-item">
          <span>Last Revised</span>
          <strong>${chapter.last_revised || "Never"}</strong>
        </div>

      </div>
    `;

    chapterRow.appendChild(details);

    // Start closed, then animate open
    requestAnimationFrame(function () {
      details.classList.add("open");

      button.classList.add("active");

      button.textContent = "⌃";
    });
  } catch (error) {
    console.error("Error loading chapter details:", error);
  }
}

loadDashboard();
