require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

let accessToken = "";

// 🔑 Get Spotify Access Token
async function getAccessToken() {
  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
          ).toString("base64"),
      },
    }
  );

  accessToken = res.data.access_token;
}

// 🔄 Refresh token every 50 mins
setInterval(getAccessToken, 50 * 60 * 1000);
getAccessToken();

// 🔍 Search API
app.get("/search", async (req, res) => {
  const query = req.query.q;

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tracks = response.data.tracks.items.map((track) => ({
      name: track.name,
      artist: track.artists[0].name,
      image: track.album.images[0]?.url,
      preview: track.preview_url,
    }));

    res.json(tracks);
  } catch (err) {
    res.status(500).json({ error: "Error fetching songs" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
