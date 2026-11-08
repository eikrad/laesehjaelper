// Load the PDF libraries only when a book is exported; reading needs no PDF runtime.
import { buildPdf } from "./pdf";

window.LaesePdf = { buildPdf };
