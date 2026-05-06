const API_KEY = "fe6ad3d5";
const BASE_URL = "https://www.omdbapi.com/";

// DOM elements
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const errorMsg    = document.getElementById("errorMsg");
const loading     = document.getElementById("loading");
const movieResult = document.getElementById("movieResult");
const movieList   = document.getElementById("movieList");
const yearInput   = document.getElementById("yearInput");
const yearSelect  = document.getElementById("yearSelect");

const moviePoster   = document.getElementById("moviePoster");
const movieTitle    = document.getElementById("movieTitle");
const movieYear     = document.getElementById("movieYear");
const movieGenre    = document.getElementById("movieGenre");
const movieRated    = document.getElementById("movieRated");
const moviePlot     = document.getElementById("moviePlot");
const movieDirector = document.getElementById("movieDirector");
const movieActors   = document.getElementById("movieActors");
const movieRuntime  = document.getElementById("movieRuntime");
const movieRating   = document.getElementById("movieRating");

// Active filter values
let selectedType  = "";
let selectedGenre = "";

// Returns the selected year from input or dropdown
function getSelectedYear() {
  if (yearInput.value) return yearInput.value;
  return yearSelect.value;
}

// Fill year dropdown from 2026 to 1900
(function fillYears() {
  for (let y = 2026; y >= 1900; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
})();

// Sync year input and dropdown so they don't conflict
yearInput.addEventListener("input", () => { yearSelect.value = ""; });
yearSelect.addEventListener("change", () => { yearInput.value = ""; });

// Handle chip button selection
function setupChips(groupId, onSelect) {
  const group = document.getElementById(groupId);
  group.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      group.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      onSelect(chip.dataset.value);
    });
  });
}

setupChips("typeChips",  (val) => { selectedType  = val; });
setupChips("genreChips", (val) => { selectedGenre = val; });

// Restore last search on page load
window.addEventListener("load", () => {
  const lastQuery = localStorage.getItem("cinefill_lastQuery");
  if (lastQuery) {
    searchInput.value = lastQuery;
    search(lastQuery);
  }
});

// Search triggers
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) search(query);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) search(query);
  }
});

// Main search function
async function search(query) {
  localStorage.setItem("cinefill_lastQuery", query);
  hideAll();
  showLoading(true);

  const year = getSelectedYear();
  const searchQuery = selectedGenre ? `${query} ${selectedGenre}` : query;

  try {
    // Try exact title match first
    const exactData = await fetchOMDB({ t: query, type: selectedType, y: year });

    if (exactData.Response === "True") {
      showMovieCard(exactData);
    } else {
      // Fall back to search results
      const searchData = await fetchOMDB({ s: searchQuery, type: selectedType, y: year });

      if (searchData.Response === "True") {
        showMovieList(searchData.Search);
      } else {
        showError("No results found. Try a different title or adjust your filters.");
      }
    }
  } catch (err) {
    showError("Something went wrong. Please check your internet connection.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Send request to OMDB API
async function fetchOMDB(params) {
  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
}

// Display single movie details
function showMovieCard(movie) {
  moviePoster.src = movie.Poster !== "N/A"
    ? movie.Poster
    : "https://via.placeholder.com/240x356/130f0b/8a7a65?text=No+Poster";

  movieTitle.textContent    = movie.Title;
  movieYear.textContent     = movie.Year;
  movieGenre.textContent    = movie.Genre !== "N/A" ? movie.Genre : "—";
  movieRated.textContent    = movie.Rated !== "N/A" ? movie.Rated : "—";
  moviePlot.textContent     = movie.Plot  !== "N/A" ? movie.Plot  : "No plot available.";
  movieDirector.textContent = movie.Director !== "N/A" ? movie.Director : "—";
  movieActors.textContent   = movie.Actors   !== "N/A" ? movie.Actors   : "—";
  movieRuntime.textContent  = movie.Runtime  !== "N/A" ? movie.Runtime  : "—";
  movieRating.textContent   = movie.imdbRating !== "N/A"
    ? `⭐ ${movie.imdbRating} / 10`
    : "N/A";

  movieResult.classList.remove("hidden");
}

// Display multiple search results as cards
function showMovieList(movies) {
  movieList.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "list-card";

    const poster = movie.Poster !== "N/A"
      ? movie.Poster
      : "https://via.placeholder.com/158x237/130f0b/8a7a65?text=No+Poster";

    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}" loading="lazy" />
      <div class="list-card-info">
        <div class="list-card-title">${movie.Title}</div>
        <div class="list-card-year">${movie.Year}</div>
      </div>
    `;

    card.addEventListener("click", () => fetchByIMDBId(movie.imdbID));
    movieList.appendChild(card);
  });

  movieList.classList.remove("hidden");
}

// Fetch full details by IMDB ID
async function fetchByIMDBId(imdbID) {
  hideAll();
  showLoading(true);

  try {
    const data = await fetchOMDB({ i: imdbID });
    if (data.Response === "True") {
      showMovieCard(data);
    } else {
      showError(data.Error || "Could not load movie details.");
    }
  } catch (err) {
    showError("Something went wrong while loading movie details.");
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Show error message
function showError(message) {
  errorMsg.textContent = `✦  ${message}`;
  errorMsg.classList.remove("hidden");
}

// Toggle loading indicator
function showLoading(visible) {
  loading.classList.toggle("hidden", !visible);
}

// Hide all result sections
function hideAll() {
  errorMsg.classList.add("hidden");
  movieResult.classList.add("hidden");
  movieList.classList.add("hidden");
}