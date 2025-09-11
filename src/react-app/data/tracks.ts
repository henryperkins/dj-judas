// Track data used by music components. Replace placeholder IDs/URLs with real links.
export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  spotifyUri?: string; // e.g., "spotify:track:6rqhFgbbKwnb9MLmUQDhG6"
  appleMusicUrl?: string; // e.g., "https://music.apple.com/..."
  releaseDate?: string; // YYYY-MM-DD
  albumArt?: string;
}

export const tracks: TrackItem[] = [
  {
    id: 'i-love-to-praise-him',
    title: 'I Love to Praise Him',
    artist: 'DJ Lee & Voices of Judah',
    spotifyUri: 'spotify:track:2VTudgmPqyqO9lJ1FMULc7',
    appleMusicUrl: 'https://music.apple.com/us/album/i-love-to-praise-him/1612314848',
    releaseDate: '2022-01-01',
    albumArt: '/images/covers/i-love-to-praise-him.jpg'
  },
  {
    id: 'starting-point',
    title: "Starting Point",
    artist: 'DJ Lee',
    spotifyUri: 'spotify:track:4vlipJtap5vgkfhuYXHTzA', // Update this if you have the correct Spotify URI
    appleMusicUrl: 'https://music.apple.com/us/album/starting-point-single/1540816225',
    releaseDate: '2020-01-01',
    albumArt: '/images/covers/starting-point.jpg'
  },
  {
    id: 'trust-in-god',
    title: 'Trust in God',
    artist: 'DJ Lee',
    spotifyUri: 'spotify:track:3xQZ7uX9vNngNXBgEQWVd7', // Update this if you have the correct Spotify URI
    appleMusicUrl: 'https://music.apple.com/us/album/trust-in-god-single/1815332243',
    releaseDate: '2025-01-01',
    albumArt: '/images/covers/trust-in-god.jpg'
  }
];

