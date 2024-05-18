// export createSpotifyPlaylist, searchSpotify, addTrackToPlaylist
import fetch from "node-fetch";
import { gunzipSync } from "zlib";

export const createSpotifyPlaylist = async function (
  accessToken,
  playlistName = "New Playlist"
) {
  // First, get the current user's Spotify ID
  const userProfileUrl = "https://api.spotify.com/v1/me";
  const profileResponse = await fetch(userProfileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    const error = await profileResponse.json();
    throw new Error("Failed to fetch Spotify user profile: " + error.message);
  }
  const userData = await profileResponse.json();
  const userId = userData.id;

  // Now, create the playlist using the fetched user ID
  const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: playlistName,
      public: true, // Adjust based on your need
    }),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error("Spotify API error: " + errorResponse.error.message);
  }

  const data = await response.json();
  // console.log("40 " + data.id + "\n Playlist Successfully Created ");
  return data.id; // Returns the newly created playlist ID
};

export const searchSpotify = async function (songTitle, accessToken) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
    songTitle
  )}&type=track&limit=5`;
  console.log({ url });
  try {
    const data = await fetchData(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log({ album: data.tracks.items[0].album.images[0] });
    return data.tracks.items.map((item) => ({
      id: item.id,
      name: item.name,
      artists: item.artists.map((artist) => artist.name).join(", "),
      album: item.album.name,
      albumCover: item.album.images[0].url,
    }));
  } catch (error) {
    console.error("Failed to search Spotify:", error);
    throw error;
  }
};

export const addTrackToPlaylist = async function (
  playlistId,
  trackId,
  accessToken
) {
  // Ensure playlistId is just the ID, not the full URL
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  console.log(
    `Adding track ${trackId} to playlist ${playlistId} with URL ${url}`
  );

  const response = await fetchData(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      position: 0,
      uris: [`spotify:track:${trackId}`],
    }),
  });

  return response; // Returns the response from the API
};

export const removeTimeStamps = function (songList) {
  // Regular expression to match timestamps at the beginning of each line
  const timestampRegex = /^\d{1,2}:\d{2}(?::\d{2})? /;
  // Split the input string by newline, remove timestamps, and join back into a single string
  return songList
    .split("\n")
    .map((line) => line.replace(timestampRegex, ""))
    .join("\n");
};

export const fetchData = async function (url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    console.error("Fetch error:", error);
    throw new Error("Network error occurred: " + error.message);
  }

  if (!response.ok) {
    const responseBody = await response.text(); // Read response to show detailed error
    // console.log(responseBody);
    // console.error("API Error Response:", responseBody);
    throw new Error(
      `API request failed with status ${response.status}: ${responseBody}`
    );
  }

  const contentType = response.headers.get("content-type");
  let responseData = await response.text(); // Directly read response as text

  if (contentType && contentType.includes("application/json")) {
    try {
      const json = JSON.parse(responseData);
      // console.log("JSON Data:", json); // Log the JSON data to verify its integrity
      return json;
    } catch (error) {
      console.error("JSON Parsing error:", error);
      console.error("Raw Response Data:", responseData); // Log the raw response data
      throw new Error("Failed to parse JSON response: " + error.message);
    }
  }

  return responseData; // Return as is if not JSON
};
