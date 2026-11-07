import { describe, expect, it } from "vitest";
import { PROFILE_KEYS, addProfile, initProfiles, removeProfile, switchProfile, syncActive } from "../../src/profiles";

const base = { font: "A", size: 32, ls: 0.04, lh: 1.9, mode: "farbe", sylWords: "alle", colors: "#00f,#f00", bg: "#fff", lines: "normal", rate: "normal", turn: "an", ui: "da", lang: "da", view: "side" };

describe("profiles", () => {
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
});
