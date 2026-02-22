---
description: Translates texts to all supported locales
---

1. Scan the `res/i18n/` directory to identify all sub-folders (e.g., `storylines`, `merchant`, `modules`).
2. For each sub-folder found, identify its main source file. The main file always matches the folder name (e.g., `res/i18n/storylines/storylines.md`, `res/i18n/merchant/merchant.md`).
3. Use the explicit list of target locales: `de` (German), `fr` (French), and `es` (Spanish). 
4. For each of these target locales:
    a. Translate the contents of the main source file (e.g., `storylines.md`) into the target language.
    b. Keep the markdown structure (headers `##`, `###`) exactly identical to the source file. Only translate the content below the headers.
    c. Do NOT translate planet names, galaxy names, or other proper nouns (e.g., "The Belt" should stay "THE BELT" or "The Belt", "Halo" stays "Halo").
    d. Write the newly translated content to an output file named `<folder-name>_{locale}.md` (e.g., `res/i18n/storylines/storylines_de.md`).
5. Repeat steps 2-4 for all sub-folders within `res/i18n/`.
6. Inform the user of all files that were successfully updated or created across the different folders.