# Licence notices shipped with the app

These files retain the upstream licence texts and copyright notices for the reading fonts,
PDF libraries and primary existing runtime components. Each file records its source.
`fontkit-*.txt` includes notices for components embedded by the upstream fontkit browser bundle;
these components are not all listed as runtime dependencies in our package lock.

`build.ts` combines `THIRD_PARTY_NOTICES.md` and the `.txt` files into `dist/licenses.html`.
The start page links to this document, and the service worker caches it for offline reading.
Do not remove these files from deployed or downloaded site distributions.

When updating a font or PDF dependency, refresh the corresponding notices from that release,
including the dependencies already embedded in its published bundles. Check the upstream
copyright statements as well as the SPDX licence name.
