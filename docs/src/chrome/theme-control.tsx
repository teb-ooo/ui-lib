import { Button } from "@teb-ooo/ui";
import { THEME_MODES, useTheme } from "../gallery-theme";

/** The one theme control: system, light or dark for the whole gallery, chrome and previews together. */
export function ThemeControl() {
  const [mode, setMode] = useTheme();
  return (
    <div role="group" aria-label="Theme" className="flex gap-1">
      {THEME_MODES.map((m) => (
        <Button key={m} active={mode === m} onClick={() => setMode(m)}>
          {m}
        </Button>
      ))}
    </div>
  );
}
