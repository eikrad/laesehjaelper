// Reading mode on the whole screen (Fullscreen API), so browser bars take no space while a child
// reads on a tablet. iPhone Safari offers no fullscreen for pages, and the installed app has no
// browser bars: both keep the reading mode they have. Leaving fullscreen with the system gesture
// (a swipe, Escape) also ends reading mode. Only a fullscreen that reading mode asked for is left.

/** The browser parts used here, passed in so the rules can be tested without a browser. */
export interface FullscreenHost {
  /** `document.fullscreenEnabled` */
  enabled(): boolean;
  /** Running as the installed app, which shows no browser bars. */
  installed(): boolean;
  /** `document.fullscreenElement` */
  element(): Element | null;
  /** `document.documentElement.requestFullscreen()` */
  request(): Promise<void>;
  /** `document.exitFullscreen()` */
  exit(): Promise<void>;
}

export function readingFullscreen(host: FullscreenHost, onLeft: () => void) {
  let ours = false;     // Reading mode asked for the fullscreen that is, or will be, shown.
  let pending = false;  // That request has not been answered yet.
  return {
    /** Reading mode starts. Call it from the tap that starts it: browsers require a user action. */
    enter() {
      if (ours || !host.enabled() || host.installed() || host.element()) return;
      ours = pending = true;
      host.request().then(
        () => { pending = false; if (!ours) host.exit().catch(() => {}); }, // Reading mode ended meanwhile.
        () => { pending = ours = false; }, // Refused: reading mode stays, without fullscreen.
      );
    },
    /** Reading mode ends in the app. */
    leave() {
      if (!ours) return;
      ours = false;
      if (host.element()) host.exit().catch(() => {});
    },
    /** `fullscreenchange`: if the system gesture left fullscreen, reading mode ends too. */
    changed() {
      if (ours && !pending && !host.element()) {
        ours = false;
        onLeft();
      }
    },
  };
}
