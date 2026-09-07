# Character content

`assets/data/talesofargosa.json` is the supplied export, retained without changes. Hugo reads it directly; editing a background or skill there updates its table on the next build. No ability pages are generated.

## Templates and pages

- `layouts/shortcodes/class-profile.html` defines the common class structure: overview, specialities, statistics, a collapsed skill table, progression, and ability details for levels 1–9 with dividers between levels. Each `content/class/*.md` page invokes `{{< class-profile >}}` and provides its editorial specialities in front matter. The page title matches a Class entry in the JSON; use `name="Source name"` on the shortcode if the display title differs. The shortcode stores its resolved mechanics on the page; `layouts/wiki/single.html` renders the content before the infobox and uses those mechanics for the key attribute and HP multiplier rows.
- `layouts/shortcodes/race-profile.html` defines the separate race structure. Race pages supply flavour text, `strengths`, `benefit_condition`, and optional `benefit_labels`; mechanics come from the matching Race entry.
- `layouts/shortcodes/backgrounds-table.html` produces the alphabetical background table, with attribute, skill links, and starting item/effect columns.
- `layouts/shortcodes/skills-table.html` produces the alphabetical skill table, preserving all 21 entries, including attribute variants. Stable base-skill anchors let backgrounds and classes link to skills without choosing an attribute variant.
- `layouts/_partials/character/ability.html` resolves abilities and their nested option tables. The same ability can appear inside multiple class pages without needing a separate article.

Use `hugo new content --kind class class/example.md` or `--kind race race/example.md` to start a page using the matching archetype. Add its source entry to the JSON before publishing. The character archetype uses the same introduction/reading guide/reference-table structure as Backgrounds and Skills; switch its shortcode to `skills-table` when appropriate.

The JSON is the rules source. Class specialities and Human's opening paragraph are editorial descriptions, not additional mechanical benefits. Keep the six class pages and the class portal's cards in sync if the source roster changes.

## Replacing the JSON

Replace `assets/data/talesofargosa.json` with an export using the same schema, then rebuild with `npm run build`. Existing pages will render the updated class descriptions, infobox mechanics, equipment, skill options, progression, ability descriptions and technique tables, race description and benefits, and all background and skill rows. Added or removed backgrounds and skills appear or disappear automatically from their tables.

The JSON does **not** create or delete Markdown pages. A new class or race needs a matching page (the archetypes provide the style); a removed or renamed class/race requires updating its existing page and category links. An existing page whose source name no longer matches fails the build instead of silently rendering empty rules.

Editorial specialities, Human's flavour paragraph and strengths, page summaries, images, navigation, and the explanatory text around tables live outside the JSON. Shared advancement explanations, ability-name aliases, duplicate Second Attack assignments, and Sharpshooter's starting-roll/retirement text also contain interpretations or text written from this particular export. Review those when changing rules or source structure; they are not automatically rewritten by a new export.

## Source interpretation

- Progression and ability sections show only levels 1–9. Empty `Beyond` rows with attack bonus `0` are export placeholders, not a reset of attack bonus. Sharpshooter's actual retirement text is retained after level 9.
- `New Skill`, `Unique Feature`, `+1 AC`, and `Backstab Boost` occur in progression without separate ability entries. Their sections explain the stated gain. Unique Feature options are marked unspecified; the Backstab improvement comes from the Backstab description.
- `Tricks` resolves to `Tricks & Techniques`; `Rear Guard` resolves to `Rearguard`.
- Three entries share the name `Second Attack`, without class identifiers. The first (including a critical range of 19–20) is assigned to Barbarian; the second to Fighter, whose Deadly Strikes already grants that range; the third to Sharpshooter, whose Ranged Mastery grants that range at level 7. This is an interpretation from the surrounding progression, not an explicit association in the export.
- Sharpshooter's key attribute is `none` in the source, so the infobox says “None specified”; Skirmish Archery still uses Perception as stated in its own rules.
- The background attribute boost amount and most classes' starting skill roll counts are absent. No amounts or counts have been supplied. Sharpshooter's explicit three rolls are retained.
- Human's benefits are conditional on the GM allowing non-human player characters. The attribute cap and exclusion of Luck/Initiative remain in the benefit table.
- Skilled modifiers are shown as the exported +1. A skill's general usefulness is not presented as automatic mechanical advantage.
- The original source's book page references remain part of ability descriptions; they are not links to nonexistent wiki pages.

## Validation

Run `npm run build` to build Hugo and regenerate Pagefind search. Confirm that the Class category lists only Barbarian, Bard, Fighter, Monk, Rogue, and Sharpshooter; that progression and option links reach their headings; and that Backgrounds and Skills contain 36 and 21 alphabetically sorted rows respectively.
