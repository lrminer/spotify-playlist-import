import express from "express";
import path from "path";
import fetch from "node-fetch";
import session from "express-session";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import {
  createSpotifyPlaylist,
  searchSpotify,
  addTrackToPlaylist,
  // removeTimeStamps,Failed to import
  fetchData,
} from "./helper_functions.js";

config(); // This replaces require("dotenv").config();

const app = express();
const port = 8888;

app.use(express.static("public")); // This replaces serveStatic, just use express.static
app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: "secret", // You should use a more secure secret in production
    resave: false,
    saveUninitialized: true,
  })
);

// Redirect to Spotify's authorization page
app.get("/login", (req, res) => {
  const scopes = "playlist-modify-private playlist-modify-public";
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${
    process.env.CLIENT_ID
  }&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
    process.env.REDIRECT_URI
  )}`;
  console.log("Redirecting to Spotify login URL:", url);
  res.redirect(url);
});

app.get("/check-login", (req, res) => {
  const isLoggedIn = req.session.accessToken ? true : false;
  res.json({ isLoggedIn });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.clearCookie("connect.sid", { path: "/" });
    res.redirect("/"); // Optionally, pass a flag indicating logout was successful
  });
});

// Callback service parsing the authorization token and asking for the access token
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  };

  try {
    // fetchData already parses the JSON, so just use the returned data directly
    const data = await fetchData(
      "https://accounts.spotify.com/api/token",
      authOptions
    );
    if (data.access_token) {
      req.session.accessToken = data.access_token;
      req.session.refreshToken = data.refresh_token;
      res.cookie("isLoggedIn", "true", { httpOnly: true }); // Set cookie for session tracking
      res.redirect("/"); // Redirect to home page with login status
    } else {
      res.cookie("isLoggedIn", "false", { httpOnly: true });
      res.redirect("/#error=authentication_failed");
    }
  } catch (error) {
    console.error("Error getting token:", error);
    res.cookie("isLoggedIn", "false", { httpOnly: true });
    res.redirect("/#error=" + error.message);
  }
});

app.post("/import-songs", async (req, res) => {
  console.log("import-songs");
  const { songs, playlistName } = req.body; // Capture the playlist name

  if (!req.session.accessToken) {
    return res
      .status(403)
      .json({ message: "No Spotify access token available." });
  }

  try {
    const accessToken = req.session.accessToken;
    const playlistId = await createSpotifyPlaylist(accessToken, playlistName); // Use the custom playlist name

    for (const trackId of songs) {
      if (trackId) {
        await addTrackToPlaylist(playlistId, trackId, accessToken);
      }
    }
    res.json({ message: `"${playlistName}" created and songs added!` });
  } catch (error) {
    console.error("Failed to import songs:", error);
    res
      .status(500)
      .json({ message: "Failed to import songs", error: error.message });
  }
});

app.post("/search-songs", async (req, res) => {
  console.log("search-songs");

  const { songs } = req.body;
  console.log({ songs });
  if (!req.session.accessToken) {
    return res.status(403).json({ message: "Not authenticated" });
  }
  const { accessToken } = req.session;
  try {
    const results = [];
    for (const songTitle of songs) {
      results.push(await searchSpotify(songTitle, accessToken));
    }
    // console.log({ results });
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
