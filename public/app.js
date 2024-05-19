// Global variables
let selectedTracks = [];
let currentBatchIndex = 0;

// Load initial data from local storage

// Functions

// Search for tracks based on the set list
function searchTracks() {
  const setList = document.getElementById("setList").value.trim();
  const arraySetList = removeTimestamps(setList);

  fetch("/search-songs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ songs: arraySetList }),
  })
    .then((response) => response.json())
    .then(storeResultsInLocalStorage)
    .then((data) => {
      console.log(data);

      // store the query string (i.e. setlist) in localStorage
      localStorage.setItem("setList", $("#setList").val());

      // Store the search results in localStorage
      localStorage.setItem("searchResults", JSON.stringify(data));
      localStorage.setItem("currentIndex", "0");

      // Show the carousel and selected tracks list
      document.getElementById("searchResultsCarousel").style.display = "block";
      document.getElementById("selectedTracksList").style.display = "block";

      loadNextBatch(); // Load the first batch after search
    })
    .catch((error) => console.error("Error searching tracks:", error));
}

// Load the next batch of search results
function loadNextBatch() {
  const currentIndex = parseInt(localStorage.getItem("currentIndex") || "0");
  const carousel = $("#searchResultsCarousel");
  const allBatches = JSON.parse(localStorage.getItem("searchResults")) || [];
  const setList = localStorage.getItem("setList");

  if (carousel.hasClass("slick-initialized")) {
    carousel.slick("unslick");
  }
  carousel.html("");

  console.log(currentIndex);
  console.log(setList);
  // let searchTerm = "";
  searchTerm = setList.split("\n")[currentIndex];

  if (currentIndex < allBatches.length) {
    displaySearchResults(allBatches[currentIndex], searchTerm);
    localStorage.setItem("currentIndex", (currentIndex + 1).toString());
  } else {
    console.log("No more batches to display.");
  }
}

// Select a track and update UI
function selectTrack(trackId) {
  const allTracks = JSON.parse(
    localStorage.getItem("searchResults") || "[]"
  ).flat();
  const track = allTracks.find((t) => t.id === trackId);

  if (track && !selectedTracks.some((t) => t.id === track.id)) {
    selectedTracks.push(track);
    localStorage.setItem("selectedTracks", JSON.stringify(selectedTracks));
    console.log("Selected track:", track);
    updateSelectedTracksUI();
    loadNextBatch();
  }
}

// Skip to the next batch of search results
function skipBatch() {
  loadNextBatch();
}

// Clear local storage
function clearLocalStorage() {
  localStorage.removeItem("selectedTracks");
  localStorage.removeItem("searchResults");
  console.log("Local storage cleared.");
}

// Request Spotify authorization
function requestAuthorization() {
  const scopes = "playlist-modify-private playlist-modify-public";
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirect_uri)}`;

  window.location = url;
}

// Get Spotify access token
async function getAccessToken(code) {
  const authOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    }),
  };

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    authOptions
  );
  const data = await response.json();
  return data.access_token;
}

// Redirect to Spotify login
function loginToSpotify() {
  console.log("Redirecting to Spotify...");
  window.location.href = "/login";
}

// Logout from Spotify
function logout() {
  window.location.href = "/logout";
}

// Remove timestamps from the set list
function removeTimestamps(songList) {
  const timestampRegex = /^\d{1,2}:\d{2}(?::\d{2})? /;
  return songList.split("\n").map((line) => line.replace(timestampRegex, ""));
}

// Import playlist to Spotify
function importPlaylist() {
  let playlistName = document.getElementById("playlistName").value.trim();
  const selectedTracks = JSON.parse(
    localStorage.getItem("selectedTracks") || "[]"
  );

  if (selectedTracks.length === 0 || !playlistName) {
    alert("Please enter a playlist name and select some tracks.");
    return;
  }

  const trackIds = selectedTracks.map((track) => track.id);

  fetch("/import-songs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ songs: trackIds, playlistName: playlistName }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message);
      localStorage.removeItem("selectedTracks");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("There was a problem with your request: " + error.message);
    });
}

// Store search results and search term in local storage
// this should probably be refactored
function storeResultsInLocalStorage(results, searchTerm = "") {
  localStorage.setItem("searchResults", JSON.stringify(results));
  localStorage.setItem("searchTerm", searchTerm);
  return results;
}

// Display search results in the carousel
function displaySearchResults(tracks, searchTerm) {
  const carousel = $("#searchResultsCarousel");
  if (carousel.hasClass("slick-initialized")) {
    carousel.slick("unslick");
  }
  carousel.html("");

  console.log({ tracks });
  if (tracks.length) {
  }

  tracks.forEach((track) => {
    const highlightedName = highlightMatchingText(track.name, searchTerm);
    const highlightedArtists = highlightMatchingText(track.artists, searchTerm);
    const highlightedAlbum = highlightMatchingText(track.album, searchTerm);

    const trackDiv = `
        <div class="track d-flex align-items-center">
            <div class="track-info">
                <h4>${highlightedName}</h4>
                <p>Artist: ${highlightedArtists}</p>
                <p>Album: ${highlightedAlbum}</p>
                <img src="${track.albumCover}" alt="Album Cover" height="200" width="200" class="ms-3" />
                <div class="d-flex">
                  <button class="btn btn-outline-primary select-track-btn" onclick='selectTrack("${track.id}")'>Select</button>
                  <button id="skipButton" class="btn btn-outline-warning" onclick="skipBatch()">Skip</button>
                </div>
            </div>
        </div>

    `;
    carousel.append(trackDiv);
  });

  carousel.slick({
    dots: false,
    arrows: true,
    infinite: false,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  });
}

// Update selected tracks UI
function updateSelectedTracksUI() {
  const selectedTracksList = document.getElementById("selectedTracksList");
  selectedTracksList.innerHTML = "";

  selectedTracks.forEach((track) => {
    const trackElement = document.createElement("li");
    trackElement.className = "list-group-item";
    trackElement.textContent = `${track.name} by ${track.artists} - ${track.album}`;
    selectedTracksList.appendChild(trackElement);
  });
}

// Confirm track selection
function confirmSelection() {
  selectedTracks.forEach((track) => {
    addTrackToPlaylist(track);
  });
  selectedTracks = [];
  updateSelectedTracksUI();
  alert("Tracks have been added to your playlist.");
}

// Add track to playlist
function addTrackToPlaylist(track) {
  const accessToken = sessionStorage.getItem("accessToken");
  const playlistId = sessionStorage.getItem("playlistId");

  fetch(`/add-track-to-playlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ playlistId, trackId: track.id }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Track added:", data);
    })
    .catch((error) => {
      console.error("Error adding track:", error);
      alert("Failed to add track: " + error.message);
    });
}

// Function to highlight matching text
function highlightMatchingText(text, searchTerm = "") {
  if (!searchTerm) return text; // Return original text if searchTerm is empty

  // Function to clean text by removing special characters
  function cleanText(text) {
    return text.replace(/[^a-zA-Z0-9\s]/g, " ");
  }
  // Clean the search term
  const cleanedSearchTerm = cleanText(searchTerm);
  const words = cleanedSearchTerm.split(" ").filter((word) => word);
  console.log(words);

  // Create regex pattern for words, only including alphabetical or numerical characters
  const escapedWords = words.map((word) =>
    word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escapedWords.join("|")})`, "gi");

  // Clean the text for comparison
  const cleanedText = cleanText(text);

  // Highlight matching words in the original text
  return text.replace(pattern, '<span class="highlight">$1</span>');
}

$(document).ready(function () {
  const storedIndex = localStorage.getItem("currentIndex");
  console.log(storedIndex);
});

window.onload = async function () {
  const response = await fetch("/check-login");
  const result = await response.json();
  updateUI(result.isLoggedIn);
};

function updateUI(isLoggedIn) {
  const loginBtn = document.getElementById("loginButton");
  const logoutBtn = document.getElementById("logoutButton");
  const playlistName = document.getElementById("playlistName");
  const setList = document.getElementById("setList");
  const importBtn = document.getElementById("importButton");
  const searchBtn = document.getElementById("searchButton");
  const skipBtn = document.getElementById("skipButton");

  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
    if (playlistName) playlistName.style.display = "block";
    if (setList) setList.style.display = "block";
    if (importBtn) importBtn.style.display = "block";
    if (searchBtn) searchBtn.style.display = "block";
    if (skipBtn) skipBtn.style.display = "block";
  } else {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (playlistName) playlistName.style.display = "none";
    if (setList) setList.style.display = "none";
    if (importBtn) importBtn.style.display = "none";
    if (searchBtn) searchBtn.style.display = "none";
    if (skipBtn) skipBtn.style.display = "none";
  }
}
