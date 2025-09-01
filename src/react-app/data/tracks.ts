// Track data used by MusicHub. Replace placeholder IDs/URLs with real links.
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
    appleMusicUrl: 'https://music.apple.com/us/song/i-love-to-praise-him/1540816228',
    releaseDate: '2022-01-01',
    albumArt: '/images/covers/i-love-to-praise-him.jpg'
  },
  {
    id: 'kings-motorcade',
    title: "King's Motorcade",
    artist: 'DJ Lee & Voices of Judah',
    spotifyUri: 'spotify:track:4vlipJtap5vgkfhuYXHTzA',
    appleMusicUrl: 'https://music.apple.com/us/song/kings-motorcade/1540816226',
    releaseDate: '2020-01-01',
    albumArt: '/images/covers/kings-motorcade.jpg'
  },
  {
    id: 'celebrate',
    title: 'Celebrate (feat. Christina Chelley Lindsey)',
    artist: 'DJ Lee & Voices of Judah',
    spotifyUri: 'spotify:track:3xQZ7uX9vNngNXBgEQWVd7',
    appleMusicUrl: 'https://music.apple.com/tr/song/celebrate-feat-christina-chelley-lindsey/1540816227',
    releaseDate: '2020-01-01',
    albumArt: '/images/covers/celebrate.jpg'
  }
];

