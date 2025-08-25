import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  url?: string;
}

const tracks: Track[] = [
  { id: 1, title: "I Love to Praise Him", artist: "DJ Lee & Voices of Judah", duration: "4:32" },
  { id: 2, title: "Starting Point", artist: "DJ Lee & Voices of Judah", duration: "3:45" },
  { id: 3, title: "Celebrate (feat. Christina Chelley Lindsey)", artist: "DJ Lee & Voices of Judah", duration: "4:47" },
  { id: 4, title: "Great & Mighty (feat. Larry Jones)", artist: "DJ Lee & Voices of Judah", duration: "4:15" },
  { id: 5, title: "King's Motorcade", artist: "DJ Lee & Voices of Judah", duration: "5:21" },
];

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setProgress(0);
  };

  const handlePrevious = () => {
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
    setProgress(0);
  };

  const handleTrackClick = (index: number) => {
    setCurrentTrack(index);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <motion.div 
      className="music-player"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="player-container">
        <div className="now-playing">
          <motion.div 
            className="album-art"
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="album-inner">
              <span>🎵</span>
            </div>
          </motion.div>
          <div className="track-info">
            <h3>{tracks[currentTrack].title}</h3>
            <p>{tracks[currentTrack].artist}</p>
          </div>
        </div>

        <div className="player-controls">
          <button 
            className="control-btn" 
            onClick={handlePrevious}
            aria-label="Previous track"
          >
            <SkipBack size={20} />
          </button>
          <button 
            className="control-btn play-btn" 
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button 
            className="control-btn" 
            onClick={handleNext}
            aria-label="Next track"
          >
            <SkipForward size={20} />
          </button>
          <button 
            className="control-btn volume-btn" 
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="playlist">
          <h4>Playlist</h4>
          <ul>
            {tracks.map((track, index) => (
              <li 
                key={track.id}
                className={index === currentTrack ? 'active' : ''}
                onClick={() => handleTrackClick(index)}
              >
                <span className="track-number">{index + 1}</span>
                <div className="track-details">
                  <span className="track-title">{track.title}</span>
                  <span className="track-duration">{track.duration}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default MusicPlayer;
