import { menuButtonKey, menuKey } from "./menu";

interface MenuOptions {
  /** Items whose tap keeps the menu open, such as a delete that asks to be tapped again. */
  keepOpen?: (item: HTMLElement) => boolean;
  /** Called whenever the menu closes. */
  closed?: () => void;
}

/**
 * A button that opens a menu of actions, for touch, mouse and keyboard (WAI-ARIA menu button,
 * keys in src/menu.ts). A tap on an item closes the menu before the item's own action runs, with
 * focus back on the button, so a dialog the action opens returns focus there when it closes.
 */
export class MenuButton {
  constructor(private button: HTMLButtonElement, private menu: HTMLElement, private options: MenuOptions = {}) {
    button.addEventListener("click", () => { if (this.isOpen) this.close(true); else this.open("first"); });
    button.addEventListener("keydown", e => {
      const at = menuButtonKey(e.key);
      if (at) { e.preventDefault(); this.open(at); }
    });
    menu.addEventListener("keydown", e => {
      const items = this.items(), move = menuKey(e.key, items.indexOf(document.activeElement as HTMLButtonElement), items.length);
      if (!move) return;
      if ("focus" in move) { e.preventDefault(); items[move.focus].focus(); return; }
      // Escape stays on the button; Tab then moves on from it.
      if (move.close === "button") e.preventDefault();
      this.close(true);
    });
    menu.addEventListener("click", e => {
      const item = (e.target as Element).closest<HTMLElement>('[role="menuitem"]');
      if (item && !options.keepOpen?.(item)) this.close(true);
    }, true);
    document.addEventListener("pointerdown", e => {
      const target = e.target as Node;
      if (this.isOpen && !menu.contains(target) && !button.contains(target)) this.close(false);
    });
  }

  get isOpen() { return !this.menu.hidden; }

  /** Items that can be chosen now, in menu order. */
  private items() {
    return [...this.menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].filter(b => !b.hidden && !b.disabled);
  }

  open(at: "first" | "last" = "first") {
    this.menu.hidden = false;
    this.button.setAttribute("aria-expanded", "true");
    const items = this.items();
    items[at === "first" ? 0 : items.length - 1]?.focus();
  }

  close(focusButton = false) {
    if (!this.isOpen) return;
    this.menu.hidden = true;
    this.button.setAttribute("aria-expanded", "false");
    if (focusButton) this.button.focus();
    this.options.closed?.();
  }
}
