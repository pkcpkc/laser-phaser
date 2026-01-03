---
description: Translate storylines to all supported locales
---

1. Read the default storyline file at `res/storylines/storylines.md`.
2. List the files in `res/storylines/` to find existing locale files (e.g., `storylines_de.md`).
3. For each non-English locale file found (or if you want to add a new one, ask the user or just create it if implied):
    a. Translate the content of the default `storylines.md` into the target language.
    b. Keep the markdown structure (headers `##`, `###`) exactly the same.
    c. Do NOT translate planet names, galaxy names or other proper nouns (e.g. "The Belt" should stay "THE BELT" or "The Belt", "Halo" stays "Halo").
    d. Write the translated content to `res/storylines/storylines_{locale}.md` (e.g., `storylines_de.md`).
4. Notify the user which files were updated.