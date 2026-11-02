# Token Contrast

A Figma plugin that checks the contrast of a layer’s color token against the fill behind it.

Select one layer. Token Contrast reads its solid fill, follows variable aliases back to the primitive in the mode that is actually applied, and measures that color against the nearest parent fill. Semi-transparent tokens are composited over the background first, which is what WCAG requires.

It reports the contrast ratio and whether the pair passes WCAG AA and AAA for normal text and large text.

## Install

Install the published plugin from Figma Community:

**[Token Contrast on Figma Community](https://www.figma.com/community/plugin/1691903395331204623/token-contrast)**

Open that page and choose **Open in Figma**. The plugin is then available in any Design file. The full steps, including how to run it, how to read the result, and how to run this repository, are in the [install guide](INSTALL.md).

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
| `INSTALL.md` | Install and usage guide |

## Author

Token Contrast is made by [Jake Patrick](https://www.jakepatrick.me), a product and system designer in London.

- [jakepatrick.me](https://www.jakepatrick.me)
- [hello@jakepatrick.me](mailto:hello@jakepatrick.me)
- [LinkedIn](https://www.linkedin.com/in/jake-patrick-)
- [Bluesky](https://bsky.app/profile/jakep3212.bsky.social)
- [X](https://x.com/jakepatrickkk)

Issues and pull requests are welcome.

## License

[MIT](LICENSE)
