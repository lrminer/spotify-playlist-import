# Spotify Playlist Import

A tool to import setlists from YouTube comments directly into Spotify playlists.

## Features

- Extracts song titles from long set list strings that can be copied from YouTube comments.
- Searches a collection of songs and returns 5 results for each search in a stepwise manner.
- Highlights song text that matches input string.
- Adds selected songs to a Spotify playlist via import button.
- Automated process using Node.js.

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/lrminer/spotify-playlist-import.git
   cd spotify-playlist-import
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

## Usage

1. **Set up environment variables:**

   Create a `.env` file in the root directory and add the following variables:

   ```plaintext
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

2. **Run the server:**

   ```sh
   node server.js
   ```

3. **Access the tool:**

   Open your web browser and navigate to `http://localhost:8888`.

## Contribution

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## Contact

For any issues or questions, please open an issue on this repository.
