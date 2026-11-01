// Alles, was die Seite aus src/ braucht, als ein Bündel für den Browser.
import { silben } from "./silben.js";
import { cleanOcr, parasFromOcr } from "./layout.js";
import { detectPage, warpPage, orderCorners } from "./pagedetect.js";

window.Silben = { silben };
window.Layout = { cleanOcr, parasFromOcr };
window.Lib = { detectPage, warpPage, orderCorners };
