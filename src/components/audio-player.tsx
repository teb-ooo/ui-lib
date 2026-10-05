import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Slider } from "./slider";

export interface AudioPlayerProps {
  /** The audio file's address. */
  src: string;
  /** What is playing, as the accessible name of the player ("Recording: 7.2 MHz AM"). */
  label: string;
  /** Called when the audio reaches its end (play the next part, for example). */
  onEnded?: () => void;
  /** Start playing as soon as the audio loads, including each time `src` changes (continue into the next part). Browsers refuse it before the person has interacted with the page. @default false */
  autoPlay?: boolean;
  className?: string;
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * A player in the design system's own controls instead of the browser's native audio bar: play or pause, a seek slider,
 * the time as `0:12 / 0:45` and a mute toggle. It keeps the same keyboard reach as its parts (Space on the button,
 * arrows on the slider). Use it for a recording or a clip; a live stream is not a file.
 */
export function AudioPlayer({ src, label, onEnded, autoPlay = false, className }: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setLength(0);
  }, [src]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };

  return (
    <div role="group" aria-label={label} className={cn("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a recording has no transcript to caption */}
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        autoPlay={autoPlay}
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
        onDurationChange={(e) => setLength(e.currentTarget.duration)}
      />
      <Button
        icon={playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
        aria-label={playing ? "Pause" : "Play"}
        tip={playing ? "Pause" : "Play"}
        active={playing}
        onClick={toggle}
      />
      <Slider
        label="Position"
        hideValue
        className="min-w-0 flex-1 [&>div:first-child]:sr-only"
        min={0}
        max={length > 0 ? length : 1}
        step={0.1}
        largeStep={5}
        value={Math.min(time, length > 0 ? length : 1)}
        disabled={length === 0}
        format={clock}
        onValueChange={(v) => {
          setTime(v);
          if (audio.current) audio.current.currentTime = v;
        }}
      />
      <span className="shrink-0 tabular-nums text-ink-muted">
        {clock(time)} / {clock(length)}
      </span>
      <Button
        icon={muted ? <VolumeX aria-hidden="true" className="size-4" /> : <Volume2 aria-hidden="true" className="size-4" />}
        aria-label={muted ? "Unmute" : "Mute"}
        tip={muted ? "Unmute" : "Mute"}
        active={muted}
        className="border-transparent"
        onClick={() => setMuted(!muted)}
      />
    </div>
  );
}
