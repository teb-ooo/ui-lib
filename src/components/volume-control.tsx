import { forwardRef, useState } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { usePortalContainer } from "../lib/theme-scope";
import { Button } from "./button";
import { Slider } from "./slider";

export interface VolumeControlProps {
  /** The volume from 0 to 1. */
  value: number;
  onValueChange: (value: number) => void;
  /** Called once when the person lets go of the slider or finishes a key press. */
  onValueCommit?: (value: number) => void;
  /** The sound is switched off whatever the volume is: the icon shows it, and the panel's icon button toggles it. */
  muted?: boolean;
  /** Called when the icon button in the panel is pressed, and with `false` when the slider is raised from the bottom while muted. */
  onMutedChange?: (muted: boolean) => void;
  /** Accessible name of the slider and the panel. @default "Volume" */
  label?: string;
  /** Name of the icon button while the sound is on and while it is muted. @default "Mute" and "Unmute" */
  muteLabel?: string;
  unmuteLabel?: string;
  /** What the slider moves by. @default 0.01 */
  step?: number;
  disabled?: boolean;
  /** Height of the slider in the panel. @default "h-32" */
  sliderClassName?: string;
  className?: string;
}

/** The icon for a level: nothing, low, high. */
function levelIcon(muted: boolean, value: number) {
  if (muted || value <= 0) return <VolumeX aria-hidden="true" className="size-4" />;
  return value < 0.5 ? <Volume1 aria-hidden="true" className="size-4" /> : <Volume2 aria-hidden="true" className="size-4" />;
}

/**
 * A speaker button that opens a vertical volume slider over itself: the icon stays where it is and the panel hangs from it as
 * one surface, the icon at the top and a vertical `Slider` below (the top is loudest, the bottom is silent). The icon follows
 * the level (muted, low, high), and the icon in the panel is a button that toggles mute. It closes on Escape or a press outside,
 * and is the same small column on a phone, not a bottom panel. The app owns the volume and the muted state.
 */
export const VolumeControl = forwardRef<HTMLButtonElement, VolumeControlProps>(function VolumeControl(
  { value, onValueChange, onValueCommit, muted = false, onMutedChange, label = "Volume", muteLabel = "Mute", unmuteLabel = "Unmute", step = 0.01, disabled, sliderClassName = "h-32", className },
  ref,
) {
  const container = usePortalContainer();
  const [open, setOpen] = useState(false);
  const off = muted || value <= 0;
  const icon = levelIcon(muted, value);
  const openLabel = `${label}${off ? ", muted" : `, ${Math.round(value * 100)} percent`}`;
  return (
    <BasePopover.Root open={open} onOpenChange={setOpen} modal={false}>
      <BasePopover.Trigger
        ref={ref}
        nativeButton
        disabled={disabled}
        aria-label={openLabel}
        {...(className ? { className } : {})}
        render={<Button icon={icon} />}
      />
      <BasePopover.Portal container={container}>
        {/* The panel's top is the trigger's top, the same width: it covers the button and draws its own icon in the same place. */}
        <BasePopover.Positioner
          side="bottom"
          align="center"
          sideOffset={({ anchor }: { anchor: { height: number } }) => -anchor.height}
          collisionAvoidance={{ side: "none", align: "shift" }}
          className="z-50 outline-none"
        >
          <BasePopover.Popup
            aria-label={label}
            className="anim-fade panel-inverse panel-float flex w-[var(--anchor-width)] min-w-[var(--control-h)] flex-col items-center gap-2 pb-3 text-ink outline-none"
          >
            <Button
              icon={icon}
              aria-label={off ? unmuteLabel : muteLabel}
              aria-pressed={off}
              onClick={() => onMutedChange?.(!off)}
              className="w-full shrink-0 border-transparent"
            />
            <Slider
              orientation="vertical"
              label={label}
              hideLabel
              hideValue
              value={Math.round((muted ? 0 : value) * 100) / 100}
              min={0}
              max={1}
              step={step}
              {...(disabled ? { disabled } : {})}
              format={(v) => `${Math.round(v * 100)}%`}
              onValueChange={(v) => {
                if (muted && v > 0) onMutedChange?.(false);
                onValueChange(v);
              }}
              {...(onValueCommit ? { onValueCommit } : {})}
              className={sliderClassName}
            />
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
});
