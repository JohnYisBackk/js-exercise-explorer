"use strict";

/* ========================================== */
/* SELECT ELEMENTS */
/* ========================================== */

// NAVIGATION
const navLinks = document.querySelectorAll(".nav-link");

// THEME
const themeBtn = document.getElementById("themeBtn");

// SEARCH & FILTERS
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

// EXERCISES
const exercisesGrid = document.getElementById("exercisesGrid");
const exerciseFoundValue = document.getElementById("exerciseFoundValue");

// MODAL
const exerciseModalOverlay = document.getElementById("exerciseModalOverlay");

// SHOW MORE BUTTON
const showMoreBtn = document.getElementById("showMoreBtn");

/* ========================================== */
/* DATA / STATE */
/* ========================================== */

let exercises = [];
let favorites = [];

let searchQuery = "";
let activeMuscle = "all";
let showFavorites = false;

let visibleCount = 4;

/* ========================================== */
/* API - FETCH EXERCISES */
/* ========================================== */

async function fetchExercises() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json",
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exercises");
    }

    const data = await response.json();

    exercises = data;

    renderExercises();
  } catch (error) {
    console.error("Failed to fetch exercises", error);
  }
}

/* ========================================== */
/* SAVE / LOAD DATA */
/* ========================================== */

function saveData() {
  localStorage.setItem("exerciseExplorer", JSON.stringify(favorites));
}

function loadData() {
  try {
    const storedData = localStorage.getItem("exerciseExplorer");

    if (!storedData) return;

    const parsedData = JSON.parse(storedData);

    if (Array.isArray(parsedData)) {
      favorites = parsedData;
    }
  } catch (error) {
    console.error("Failed to load data...", error);
  }
}

/* ========================================== */
/* THEME */
/* ========================================== */

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");

  localStorage.setItem("exerciseTheme", isLight ? "light" : "dark");
}

function loadTheme() {
  const savedTheme = localStorage.getItem("exerciseTheme");

  document.body.classList.toggle("light-theme", savedTheme === "light");
}

/* ========================================== */
/* NAVIGATION */
/* ========================================== */

function changeNavigation(clickedLink) {
  visibleCount = 4;

  navLinks.forEach((link) => {
    link.classList.remove("active");
  });

  clickedLink.classList.add("active");

  showFavorites = clickedLink.textContent.trim().toLowerCase() === "favorites";

  renderExercises();
}

/* ========================================== */
/* SEARCH & FILTERS */
/* ========================================== */

function filterExercises() {
  const muscleGroups = {
    chest: ["chest"],
    back: ["lats", "middle back", "lower back", "traps"],
    legs: [
      "quadriceps",
      "hamstrings",
      "calves",
      "glutes",
      "adductors",
      "abductors",
    ],
    arms: ["biceps", "triceps", "forearms"],
    shoulders: ["shoulders"],
    abs: ["abdominals"],
  };

  return exercises.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesMuscle = exercise.primaryMuscles.some((muscle) =>
      muscle.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const matchesLevel = exercise.level
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeMuscle === "all" ||
      exercise.primaryMuscles.some((muscle) =>
        muscleGroups[activeMuscle]?.includes(muscle.toLowerCase()),
      );

    const matchesFavorites = !showFavorites || favorites.includes(exercise.id);

    return (
      (matchesSearch || matchesMuscle || matchesLevel) &&
      matchesCategory &&
      matchesFavorites
    );
  });
}

function changeMuscle(muscle) {
  activeMuscle = muscle;

  visibleCount = 4;

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.muscle === activeMuscle);
  });

  renderExercises();
}

/* ========================================== */
/* FAVORITES */
/* ========================================== */

function toggleFavorites(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((favoriteId) => favoriteId !== id);
  } else {
    favorites.push(id);
  }

  saveData();
  renderExercises();
}

/* ========================================== */
/* RENDER EXERCISES */
/* ========================================== */

function renderExercises() {
  exercisesGrid.innerHTML = "";

  const filteredExercises = filterExercises();
  const visibleExercises = filteredExercises.slice(0, visibleCount);

  exerciseFoundValue.textContent = filteredExercises.length;

  showMoreBtn.hidden = visibleCount >= filteredExercises.length;

  visibleExercises.forEach((exercise) => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const imageUrl = exercise.images?.[0]
      ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exercise.images[0]}`
      : "";

    const isFavorite = favorites.includes(exercise.id);

    card.innerHTML = `
     <div class="exercise-card-image">
  <img 
    src="${imageUrl}"
    alt="${exercise.name}"
    loading="lazy"
    />

  <span class="exercise-level">
  ${exercise.level || "Unknown"}
    </span>

  <button
    type="button"
    class="exercise-favorite-btn ${isFavorite ? "active" : ""}"
    data-id="${exercise.id}"
    aria-label="Toggle favorite"
  >
    <i data-lucide="heart"></i>
  </button>
</div>

<div class="exercise-card-content">
  <span class="exercise-muscle">
  ${exercise.primaryMuscles?.join(", ") || "Unknown"}
  </span>

  <h3>${exercise.name}</h3>

  <div class="exercise-equipment">
    <i data-lucide="dumbbell"></i>
    <span>
    ${exercise.equipment || "No equipment"}
    </span>
  </div>

  <button
    type="button"
    class="exercise-details-btn"
    data-id="${exercise.id}"
  >
    View Details
    <i data-lucide="arrow-up-right"></i>
  </button>
</div> 
    `;

    exercisesGrid.appendChild(card);
  });

  lucide.createIcons();
}

/* ========================================== */
/* EXERCISE DETAILS MODAL */
/* ========================================== */

function openExerciseModal(id) {
  const exercise = exercises.find((item) => item.id === id);

  if (!exercise) return;

  const imageBase =
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

  const images = exercise.images || [];

  exerciseModalOverlay.innerHTML = `
    <div class="exercise-modal" role="dialog" aria-modal="true" aria-labelledby="modalExerciseTitle">
      <div class="modal-header">
        <div>
          <span class="modal-label">EXERCISE DETAILS</span>
          <h2 id="modalExerciseTitle">${exercise.name}</h2>
        </div>

        <button type="button" class="modal-close-btn" aria-label="Close modal">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="modal-images">
          ${images
            .map(
              (image, index) => `
                <div class="modal-image">
                  <img
                    src="${imageBase + image}"
                    alt="${exercise.name} - Step ${index + 1}"
                  />
                  <span>Position ${index + 1}</span>
                </div>
              `,
            )
            .join("")}
        </div>

        <div class="modal-info">
          <div class="modal-info-item">
            <span>Primary Muscles</span>
            <strong>${exercise.primaryMuscles.join(", ")}</strong>
          </div>

          <div class="modal-info-item">
            <span>Secondary Muscles</span>
            <strong>${exercise.secondaryMuscles?.join(", ") || "None"}</strong>
          </div>

          <div class="modal-info-item">
            <span>Equipment</span>
            <strong>${exercise.equipment || "None"}</strong>
          </div>

          <div class="modal-info-item">
            <span>Difficulty</span>
            <strong>${exercise.level || "Unknown"}</strong>
          </div>
        </div>

        <div class="modal-instructions">
          <h3>
            <i data-lucide="list-checks"></i>
            How to Perform
          </h3>

          <ol>
            ${(exercise.instructions || [])
              .map((instruction) => `<li>${instruction}</li>`)
              .join("")}
          </ol>
        </div>
      </div>
    </div>
  `;

  exerciseModalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";

  lucide.createIcons();
}

function closeExerciseModal() {
  exerciseModalOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

/* ========================================== */
/* EVENT LISTENERS */
/* ========================================== */

themeBtn.addEventListener("click", toggleTheme);

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    changeNavigation(link);
  });
});

searchInput.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim();

  visibleCount = 4;

  renderExercises();
});

exercisesGrid.addEventListener("click", (event) => {
  const favoriteBtn = event.target.closest(".exercise-favorite-btn");

  if (!favoriteBtn) return;

  toggleFavorites(favoriteBtn.dataset.id);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeMuscle(button.dataset.muscle);
  });
});

exercisesGrid.addEventListener("click", (event) => {
  const detailsBtn = event.target.closest(".exercise-details-btn");

  if (!detailsBtn) return;

  openExerciseModal(detailsBtn.dataset.id);
});

exerciseModalOverlay.addEventListener("click", (e) => {
  if (
    e.target === exerciseModalOverlay ||
    e.target.closest(".modal-close-btn")
  ) {
    closeExerciseModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeExerciseModal();
  }
});

showMoreBtn.addEventListener("click", () => {
  visibleCount += 4;

  renderExercises();
});

/* ========================================== */
/* INITIALIZE APP */
/* ========================================== */

function initApp() {
  loadTheme();
  loadData();
  fetchExercises();
}

initApp();

lucide.createIcons();
