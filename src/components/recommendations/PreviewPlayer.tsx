// src/components/recommendations/PreviewPlayer.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPlayerProps {
  previewUrl: string | null | undefined;
  trackTitle: string;
  artist: string;
  platform?: 'spotify' | 'youtube';
  videoId?: string; // For YouTube embeds
}

export default function PreviewPlayer({
  previewUrl,
  trackTitle,
  artist,
  platform = 'spotify',
  videoId
}: PreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current && previewUrl) {
      const audio = new Audio(previewUrl);
      audio.volume = volume;
      audio.muted = isMuted;
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        audioRef.current = null;
      });

      audio.addEventListener('error', () => {
        console.error('Error playing preview');
        setIsPlaying(false);
        audioRef.current = null;
      });
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // For YouTube, show embed option
  if (platform === 'youtube' && videoId) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Watch on YouTube
        </a>
      </div>
    );
  }

  // For Spotify with preview URL
  if (previewUrl) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePlayPause}
          className="h-8 w-8 p-0"
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleMuteToggle}
            className="h-8 w-8 p-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            aria-label="Volume"
          />
        </div>

        <span className="text-xs text-gray-500">30s preview</span>
      </div>
    );
  }

  return (
    <span className="text-xs text-gray-400 italic">Preview not available</span>
  );
}
