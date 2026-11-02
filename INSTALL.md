# Install Token Contrast

Token Contrast checks a layer’s fill against the fill behind it, and follows color tokens through their alias chain to do it.

The Figma Community version is pending review. Until that listing is approved, install the plugin from this repository with the steps in [Run this repository](#run-this-repository).

## Install from Figma Community

**Pending review.** This listing is submitted to Figma and is not available to install yet. The steps below are the ones to use once Figma approves it. The published plugin runs in the Figma desktop app and in the browser.

1. Open **[Token Contrast](https://www.figma.com/community/plugin/1691903395331204623/token-contrast)** on Figma Community.
2. Sign in, if Figma asks you to.
3. Click **Open in Figma**. Figma saves the plugin to your account.
4. Open a Design file.
5. Run it. Right-click the canvas and choose **Plugins → Token Contrast**. You can also search for Token Contrast in Quick actions (⌘K on Mac, Ctrl+K on Windows) or in the Resources panel.

You can reach the same listing from inside Figma. Open Community, search for Token Contrast, and open it from there.

Once it is saved, it stays in your plugins list. You do not need to install it again for each file.

## Use it

1. Select a single layer. A text layer with a token-bound fill, inside a frame that also has a fill, is the case it is built for. A raw hex fill works too.
2. Run Token Contrast. The first screen explains the check. Click **Get started**.
3. Read the three parts of the result:
   - **Foreground** is the selected layer: its hex, the token name, the collection, and each step of the alias chain down to the primitive.
   - **Background** is the nearest parent with a solid fill. The parent’s name is shown next to the colour.
   - **Contrast** is the ratio, plus AA and AAA for normal text and for large text.
4. Select another layer. The footer notes that the result updates as the selection changes. **Refresh** runs the check again. **Close** quits the plugin.

The mode it uses is the mode Figma is actually rendering, including a mode set on a parent frame. Switch that mode and run the check again to see the other value.

### How to read the ratio

| | AA | AAA |
| --- | --- | --- |
| Normal text | 4.5:1 | 7:1 |
| Large text | 3:1 | 4.5:1 |

A passing level is marked with a tick. A failing level is marked with a cross.

If the foreground token is semi-transparent, the ratio is calculated on the colour you actually see. The plugin composites the token over the background and shows that rendered hex as **Effective rendered colour**. WCAG measures the rendered colour, so a translucent token with no background behind it cannot be scored. Give a parent frame a solid fill and check again.

### Messages

| Message | What to do |
| --- | --- |
| Select a layer to check. | Nothing is selected. Click one layer. |
| Select a single layer to check. | More than one layer is selected. Select one. |
| No solid fill found on selected layer. | The layer has no visible solid fill. Gradients, images, and empty fills are skipped. |
| No parent with a solid fill found. | Walk up until a frame or other parent has a solid fill, or add one. |
| This token has alpha… no parent fill was found. | The foreground is translucent and there is nothing to composite it against. Add a solid fill to a parent. |

## Run this repository

This is how to install Token Contrast while the Community version is pending review, and how to work on the plugin after that. Development plugins run in the **Figma desktop app**. They do not run in the browser.

1. Clone the repository.

   ```bash
   git clone https://github.com/jakep321212/token-contrast.git
   cd token-contrast
   ```

2. In the desktop app, go to **Plugins → Development → Import plugin from manifest…**
3. Choose `manifest.json` in the cloned folder.
4. Open a file, select a layer, and run **Token Contrast** from **Plugins → Development**.

There is no build step. Figma loads `code.js` and `ui.html` directly. Save a file, then run the plugin again to see the change. You do not need to import the manifest a second time.

`manifest.json` includes the id of the published plugin. That id is what links this folder to the Community listing, so the publisher can ship updates to the same plugin.

If Figma tells you the plugin id is already in use, delete the `"id"` line from `manifest.json` and import again. Figma assigns a new development id. Leave that generated id out of any pull request.

## Questions

Jake Patrick builds Token Contrast. The project site and the rest of the work are at [jakepatrick.me](https://www.jakepatrick.me). Email [hello@jakepatrick.me](mailto:hello@jakepatrick.me), or open an issue on [GitHub](https://github.com/jakep321212/token-contrast/issues).
