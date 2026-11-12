import { describe, expect, it } from "vitest";
import { PROFILE_KEYS, addProfile, fromEarlier, initProfiles, removeProfile, switchProfile, syncActive } from "../../src/profiles";

const base = { font: "A", size: 32, ls: 0.04, lh: 1.9, mode: "farbe", sylWords: "alle", highlight: "an", guide: "aus", practice: "aus", phrases: "aus", wordPlayback: "word", colors: "#00f,#f00", bg: "#fff", lines: "normal", rate: "normal", turn: "an", ui: "da", lang: "da", view: "side" };

describe("profiles", () => {
  it("keeps single-word playback for older readers instead of copying another reader's syllable choice", () => {
    const { wordPlayback: _wordPlayback, ...old } = base;
    const S = { ...base, wordPlayback: "syllables" };
    let store = initProfiles(JSON.stringify({ active: "a", list: [
      { id: "a", name: "A", settings: { ...base, wordPlayback: "syllables" } },
      { id: "b", name: "B", settings: old },
    ] }), S, "A");
    store = switchProfile(store, "b", S); expect(S.wordPlayback).toBe("word");
    switchProfile(store, "a", S); expect(S.wordPlayback).toBe("syllables");
  });
  it("keeps optional word practice off for older readers after switching", () => {
    const S = { ...base, practice: "an" };
    const { practice: _practice, ...old } = base;
    const store = initProfiles(JSON.stringify({ active: "a", list: [
      { id: "a", name: "A", settings: { ...base, practice: "an" } },
      { id: "b", name: "B", settings: old },
    ] }), S, "A");
    switchProfile(store, "b", S);
    expect(S.practice).toBe("aus");
  });
  it("Keeps an older reader's new line guide off after switching from a reader who enabled it", () => {
    const { guide: _guide, ...old } = base;
    const S = { ...base, guide: "ruler" };
    const saved = { active: "ida", list: [
      { id: "ida", name: "Ida", settings: { ...base, guide: "ruler" } },
      { id: "bo", name: "Bo", settings: old },
    ] };
    const st = initProfiles(JSON.stringify(saved), S, "Ida");
    switchProfile(st, "bo", S);
    expect(S.guide).toBe("aus");
  });
  it("Creates a profile with the current settings on first launch", () => {
    const st = initProfiles(null, base, "Læser 1");
    expect(st.list).toHaveLength(1);
    expect(st.list[0].name).toBe("Læser 1");
    expect(st.list[0].settings.size).toBe(32);
    expect(st.active).toBe(st.list[0].id);
  });
  it("Stores only reading settings in a profile, excluding language and view", () => {
    const st = initProfiles(null, base, "Læser 1");
    expect(Object.keys(st.list[0].settings).sort()).toEqual([...PROFILE_KEYS].sort());
  });
  it("Switches between profiles and applies their settings", () => {
    let st = initProfiles(null, base, "Ida");
    const S = { ...base };
    st = addProfile(st, "Bo", S);            // The new profile starts with the current values.
    S.size = 48; S.mode = "aus";
    st = syncActive(st, S);                  // Bo receives size 48 and mode aus.
    const ida = st.list[0].id, bo = st.list[1].id;
    st = switchProfile(st, ida, S);
    expect(S.size).toBe(32); expect(S.mode).toBe("farbe");
    expect(S.ui).toBe("da");                 // Global values remain unchanged.
    st = switchProfile(st, bo, S);
    expect(S.size).toBe(48); expect(S.mode).toBe("aus");
    expect(st.active).toBe(bo);
  });
  it("Starts a new reader with given settings, such as syllable colours off, and copies the rest", () => {
    let st = initProfiles(null, base, "Ida");
    const S = { ...base, size: 44 };
    st = addProfile(st, "Bo", S, { mode: "aus" });
    expect(S.mode).toBe("aus");              // The new reader is active and shows its own setting.
    const [ida, bo] = st.list;
    expect(bo.settings.mode).toBe("aus");
    expect(bo.settings.size).toBe(44);
    expect(ida.settings.mode).toBe("farbe"); // The earlier reader keeps its colours.
    st = switchProfile(st, ida.id, S);
    expect(S.mode).toBe("farbe");
  });
  it("Deletes profiles while keeping at least one", () => {
    let st = initProfiles(null, base, "Ida");
    const S = { ...base };
    st = addProfile(st, "Bo", S);
    const bo = st.active;
    st = removeProfile(st, bo, S);
    expect(st.list).toHaveLength(1);
    expect(st.active).toBe(st.list[0].id);
    expect(removeProfile(st, st.active, S).list).toHaveLength(1);
  });
  it("Loads saved profiles and ignores invalid data", () => {
    const st = addProfile(initProfiles(null, base, "Ida"), "Bo", { ...base });
    expect(initProfiles(JSON.stringify(st), base, "x")).toEqual(st);
    expect(initProfiles("{kaputt", base, "Læser 1").list[0].name).toBe("Læser 1");
  });
  it("Completes settings saved by an earlier version with the behaviour readers had then", () => {
    // Word highlighting during read-aloud was always on before it became a setting.
    expect(fromEarlier({ size: 40 })).toEqual({ size: 40, highlight: "an", sylWords: "alle", guide: "aus", practice: "aus", phrases: "aus", wordPlayback: "word" });
    expect(fromEarlier({ highlight: "aus", sylWords: "lange" })).toEqual({ highlight: "aus", sylWords: "lange", guide: "aus", practice: "aus", phrases: "aus", wordPlayback: "word" });
    const { highlight: _, ...old } = base;
    const saved = { active: "a", list: [{ id: "a", name: "Ida", settings: old }] };
    expect(initProfiles(JSON.stringify(saved), base, "x").list[0].settings.highlight).toBe("an");
  });
  it("Keeps older readers' syllable-word choices independent when switching profiles", () => {
    const { sylWords: _sylWords, highlight: _highlight, ...old } = base;
    const saved = { active: "ida", list: [
      { id: "ida", name: "Ida", settings: old },
      { id: "bo", name: "Bo", settings: old },
    ] };
    const S = { ...base };
    let st = initProfiles(JSON.stringify(saved), S, "Ida");
    S.sylWords = "lange";
    st = switchProfile(st, "bo", S);
    expect(S.sylWords).toBe("alle");
    switchProfile(st, "ida", S);
    expect(S.sylWords).toBe("lange");
  });
});
