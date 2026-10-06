import { Component, lazy, Suspense, type ReactNode } from "react";
import { loadCloud } from "./mist-load";
import { cn } from "../lib/cn";

// The picture is loaded after the page is usable; the button never waits for it, and a browser without WebGL
// simply has no picture.
const Swingset = lazy(() => import("./swingset"));

/** The picture is only decoration: if it fails to load or to draw, the page carries on without it. */
class PictureBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface EntrancePageProps {
  /** The page's heading for assistive technology and tests. It is not drawn. */
  title: string;
  /** The page is waiting for the server: the swing keeps moving. @default false */
  busy?: boolean;
  /**
   * For a page that scrolls or has other content (a gallery): the scene stays in its box and leaves the page's touch
   * gestures alone, and only a drag that starts on it swirls the mist. @default false
   */
  contained?: boolean;
  /** Classes of the scene's box. @default "size-24" (96px) */
  sceneClassName?: string;
  /** What sits under the scene: the app's button and, when something went wrong, one line. */
  children: ReactNode;
}

/**
 * The page a signed-out visitor sees first (an app's `/enter`, its invitation page): one centred column with a small
 * swingset in a cloud of mist over the app's own content, a single button and, when something went wrong, one line. The
 * scene is only decoration: it loads after the page is usable (three.js in its own chunk), draws nothing without WebGL,
 * IndexedDB (it only keeps the cloud for next time), shows one still frame for a person who asks for reduced motion, and is hidden from assistive
 * technology. It takes its colour from the theme's ink, so light and dark follow by themselves. While it is on the page the
 * browser's own touch gestures are switched off (a finger swirls the mist), so the page must fit one screen.
 */
export function EntrancePage({ title, busy = false, contained = false, sceneClassName, children }: EntrancePageProps) {
  // Start working the cloud of points out now, while the scene's own code is still being fetched; it is the same work, once.
  if (typeof window !== "undefined") loadCloud().catch(() => undefined);
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-6 px-4">
      <h1 className="sr-only">{title}</h1>
      <div className={cn("relative", sceneClassName ?? "size-24")}>
        <PictureBoundary>
          <Suspense fallback={null}>
            <Swingset excited={busy} contained={contained} />
          </Suspense>
        </PictureBoundary>
      </div>
      <div className="relative flex flex-col items-center gap-6">{children}</div>
    </div>
  );
}
