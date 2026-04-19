require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

let accessToken = "";

// 🔑 Get Spotify Token
async function getToken() {
  try {
    const res = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = res.data.access_token;
    console.log("Spotify token updated:", accessToken.slice(0, 10) + "...");
  } catch (err) {
  console.error("Spotify error:", err.response?.data || err.message);

  res.status(500).json(
    err.response?.data || { error: err.message }
  );
}

// Refresh token every 50 min
setInterval(getToken, 50 * 60 * 1000);
getToken();

// 🔍 Search route
app.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json([]);
  }

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const songs = response.data.tracks.items.map((track) => ({
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      image: track.album.images[0]?.url,
      preview: track.preview_url,
    }));

    res.json(songs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
