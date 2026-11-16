/**
 * Keys of a menu button and its menu, as in the WAI-ARIA menu button pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/). Touch and mouse simply tap the items;
 * the DOM side is src/menu-view.ts.
 */

/** Item to focus when a key opens the closed menu from its button, or null for the key's usual meaning. */
export function menuButtonKey(key: string): "first" | "last" | null {
  if (key === "ArrowDown") return "first";
  if (key === "ArrowUp") return "last";
  return null;
}

/** What to do after a focused item is left by moving to another item or by closing the menu. */
export type MenuMove = { focus: number } | { close: "button" | "stay" };

/**
 * What a key does in an open menu with `count` items while item `current` has focus (-1: none).
 * Arrows wrap around; Escape returns focus to the menu button; Tab lets focus move on.
 * Null: the key keeps its usual meaning (Enter and Space activate the item).
 */
export function menuKey(key: string, current: number, count: number): MenuMove | null {
  if (key === "Escape") return { close: "button" };
  if (key === "Tab") return { close: "stay" };
  if (!count) return null;
  switch (key) {
    case "ArrowDown": return { focus: (current + 1) % count };
    case "ArrowUp": return { focus: current < 0 ? count - 1 : (current - 1 + count) % count };
    case "Home": return { focus: 0 };
    case "End": return { focus: count - 1 };
    default: return null;
  }
}
