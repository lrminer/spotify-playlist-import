function requestAuthorization() {
  const scopes = "playlist-modify-private playlist-modify-public";
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirect_uri)}`;

  window.location = url;
}

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

function loginToSpotify() {
  console.log("Redirecting to Spotify...");
  try {
    window.location.replace("/login"); // This method removes the URL of the current document from the document history
  } catch (e) {
    console.error("Redirection failed", e);
  }
}
function removeTimestamps(songList) {
  // Regular expression to match timestamps at the beginning of each line
  const timestampRegex = /^\d{1,2}:\d{2}(?::\d{2})? /;
  // Split the input string by newline, remove timestamps, and join back into a single string
  return songList
    .split("\n")
    .map((line) => line.replace(timestampRegex, ""))
    .join("\n");
}

function importPlaylist() {
  let playlistName = document.getElementById("playlistName").value.trim();
  let setList = document.getElementById("setList").value.trim();
  if (!setList || !playlistName) {
    alert(
      "Please enter a playlist name and some track names into the textarea."
    );
    return;
  }

  // Split the track list into an array, remove empty lines, and reverse the order
  let songList = setList.split("\n").filter(Boolean).reverse();

  fetch("/import-songs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ songs: songList, playlistName: playlistName }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("There was a problem with your request: " + error.message);
    });
}

// Assuming you'd add these tokens to session storage in your callback handler
// This part needs to be handled securely and possibly moved to server-side logic in a production environment
