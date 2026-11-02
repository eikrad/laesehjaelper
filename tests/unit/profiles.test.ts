import { describe, expect, it } from "vitest";
import { PROFILE_KEYS, addProfile, initProfiles, removeProfile, switchProfile, syncActive } from "../../src/profiles";

const base = { font: "A", size: 32, ls: 0.04, lh: 1.9, mode: "farbe", colors: "#00f,#f00", bg: "#fff", lines: "normal", rate: "normal", turn: "an", ui: "da", lang: "da", view: "side" };

describe("profiles", () => {
  it("legt beim ersten Start ein Profil mit den aktuellen Einstellungen an", () => {
    const st = initProfiles(null, base, "Læser 1");
    expect(st.list).toHaveLength(1);
    expect(st.list[0].name).toBe("Læser 1");
    expect(st.list[0].settings.size).toBe(32);
    expect(st.active).toBe(st.list[0].id);
  });
  it("speichert nur Leseeinstellungen im Profil, nicht Sprache oder Ansicht", () => {
    const st = initProfiles(null, base, "Læser 1");
    expect(Object.keys(st.list[0].settings).sort()).toEqual([...PROFILE_KEYS].sort());
  });
  it("wechselt zwischen Profilen und übernimmt deren Einstellungen", () => {
    let st = initProfiles(null, base, "Ida");
    const S = { ...base };
    st = addProfile(st, "Bo", S);            // neues Profil startet mit den aktuellen Werten
    S.size = 48; S.mode = "aus";
    st = syncActive(st, S);                  // Bo bekommt 48 / aus
    const ida = st.list[0].id, bo = st.list[1].id;
    st = switchProfile(st, ida, S);
    expect(S.size).toBe(32); expect(S.mode).toBe("farbe");
    expect(S.ui).toBe("da");                 // globale Werte bleiben
    st = switchProfile(st, bo, S);
    expect(S.size).toBe(48); expect(S.mode).toBe("aus");
    expect(st.active).toBe(bo);
  });
  it("löscht ein Profil, aber nie das letzte", () => {
    let st = initProfiles(null, base, "Ida");
    const S = { ...base };
    st = addProfile(st, "Bo", S);
    const bo = st.active;
    st = removeProfile(st, bo, S);
    expect(st.list).toHaveLength(1);
    expect(st.active).toBe(st.list[0].id);
    expect(removeProfile(st, st.active, S).list).toHaveLength(1);
  });
  it("liest gespeicherte Profile wieder ein und ignoriert kaputte Daten", () => {
    const st = addProfile(initProfiles(null, base, "Ida"), "Bo", { ...base });
    expect(initProfiles(JSON.stringify(st), base, "x")).toEqual(st);
    expect(initProfiles("{kaputt", base, "Læser 1").list[0].name).toBe("Læser 1");
  });
});
