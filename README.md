# Token Contrast

A Figma plugin that checks the contrast of a layer’s color token against the fill behind it.

Select one layer. Token Contrast reads its solid fill, follows variable aliases back to the primitive in the mode that is actually applied, and measures that color against the nearest parent fill. Semi-transparent tokens are composited over the background first, which is what WCAG requires.

It reports the contrast ratio and whether the pair passes WCAG AA and AAA for normal text and large text.

## Run it in Figma

Development plugins run in the Figma desktop app.

1. Plugins → Development → **Import plugin from manifest…**
2. Choose `manifest.json` in this folder.
3. Select a layer and run **Token Contrast** from Plugins → Development.

There is no build step. `code.js` and `ui.html` are what Figma loads.

### If import says the plugin id is already in use

`manifest.json` includes the id of the published Token Contrast plugin. That id is what links this folder to the existing plugin so updates publish to the same listing.

If you are not the publisher, delete the `"id"` line and import again. Figma assigns a new development id.

## What it checks

- One selected layer with a solid fill. A raw hex fill works, as does a variable.
- Alias chains, from the semantic token back to the primitive.
- The mode on the layer, including modes set on a parent.
- The nearest parent with a solid fill, variable-bound or raw.
- Alpha. A translucent foreground is composited over the background before the ratio is calculated.
- WCAG thresholds: AA 4.5:1 and AAA 7:1 for normal text, AA 3:1 and AAA 4.5:1 for large text.

Changing the selection recalculates the result.

## Project

| File | Role |
| --- | --- |
| `manifest.json` | Plugin manifest |
| `code.js` | Reads the selection, resolves variables, calculates contrast |
| `ui.html` | Plugin interface. Styles are inlined because Figma loads the UI as one HTML document |
| `icon.svg` | Logomark |

## License

[MIT](LICENSE)
