// ── Token Contrast — code.js ─────────────────────────────────────────────────

figma.showUI(__html__, {
  width: 380,
  height: 560,
  title: 'Token Contrast',
  themeColors: true
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHex(r, g, b) {
  var rr = Math.round(r * 255).toString(16).padStart(2, '0');
  var gg = Math.round(g * 255).toString(16).padStart(2, '0');
  var bb = Math.round(b * 255).toString(16).padStart(2, '0');
  return '#' + rr + gg + bb;
}

function relativeLuminance(r, g, b) {
  function linearise(c) {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

function contrastRatio(l1, l2) {
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Alpha compositing ─────────────────────────────────────────────────────────
// Composites a semi-transparent fg over an opaque bg per channel.
// result = fg * a + bg * (1 - a). Returns opaque {r,g,b} for luminance calc.

function compositeOverBackground(fg, bg) {
  var a = fg.a !== undefined ? fg.a : 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a)
  };
}

function hasAlpha(color) {
  return color && color.a !== undefined && color.a < 0.999;
}

// ── Get resolved modes for a node ────────────────────────────────────────────
// resolvedVariableModes accounts for all ancestor overrides — this is the
// mode Figma is actually rendering, regardless of how far up the tree it's set.

function getResolvedModes(node) {
  var modes = {};

  // Primary source: resolvedVariableModes is inherited and definitive
  if (node.resolvedVariableModes) {
    Object.keys(node.resolvedVariableModes).forEach(function(colId) {
      modes[colId] = node.resolvedVariableModes[colId];
    });
  }

  // Belt-and-braces: walk parents for explicit overrides not already captured
  var current = node.parent;
  while (current && current.type !== 'DOCUMENT') {
    if (current.explicitVariableModes) {
      Object.keys(current.explicitVariableModes).forEach(function(colId) {
        if (!modes[colId]) {
          modes[colId] = current.explicitVariableModes[colId];
        }
      });
    }
    current = current.parent;
  }

  return modes;
}

// ── Variable resolution ───────────────────────────────────────────────────────
// resolvedModes: map of collectionId -> modeId from the selected node.
// We pass this through so every step in the chain uses the correct brand/mode.

async function resolveVariableChain(variableId, resolvedModes) {
  var chain = [];
  var currentId = variableId;
  var visited = {};

  while (currentId) {
    if (visited[currentId]) break;
    visited[currentId] = true;

    var variable = await figma.variables.getVariableByIdAsync(currentId);
    if (!variable) break;

    var collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    var modeNames = collection ? collection.modes.map(function(m) { return m.name; }) : [];

    // Determine which modeId to use — in priority order:
    // 1. The mode actively applied to the node's tree for this collection
    // 2. The collection's explicit defaultModeId
    // 3. First mode as last resort
    var modeId = null;
    var modeName = 'Default';

    if (resolvedModes && resolvedModes[variable.variableCollectionId]) {
      modeId = resolvedModes[variable.variableCollectionId];
      var matchingMode = collection ? collection.modes.find(function(m) { return m.modeId === modeId; }) : null;
      modeName = matchingMode ? matchingMode.name : modeId;
    } else if (collection && collection.defaultModeId) {
      modeId = collection.defaultModeId;
      var defaultMode = collection.modes.find(function(m) { return m.modeId === modeId; });
      modeName = defaultMode ? defaultMode.name : 'Default';
    } else if (collection && collection.modes.length > 0) {
      modeId = collection.modes[0].modeId;
      modeName = collection.modes[0].name;
    }

    var value = modeId ? variable.valuesByMode[modeId] : null;

    chain.push({
      id: variable.id,
      name: variable.name,
      collectionName: collection ? collection.name : 'Unknown',
      collectionId: variable.variableCollectionId,
      modeId: modeId,
      modeName: modeName,
      modeNames: modeNames,
      resolvedType: variable.resolvedType,
      rawValue: value
    });

    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      currentId = value.id;
    } else {
      break;
    }
  }

  var lastStep = chain[chain.length - 1];
  var resolvedColor = null;
  if (lastStep && lastStep.rawValue && lastStep.resolvedType === 'COLOR') {
    var v = lastStep.rawValue;
    if (typeof v === 'object' && 'r' in v) {
      resolvedColor = { r: v.r, g: v.g, b: v.b, a: v.a !== undefined ? v.a : 1 };
    }
  }

  return { chain: chain, resolvedColor: resolvedColor };
}

// ── Extract bound variable id from a paint ───────────────────────────────────

function getBoundVariableFromFill(fill) {
  if (!fill || fill.type !== 'SOLID') return null;
  if (!fill.boundVariables || !fill.boundVariables.color) return null;
  return fill.boundVariables.color.id;
}

// ── Get first visible solid fill from a node ─────────────────────────────────

function getFirstSolidFill(node) {
  if (!('fills' in node)) return null;
  var fills = node.fills;
  if (!fills || fills === figma.mixed || fills.length === 0) return null;
  for (var i = 0; i < fills.length; i++) {
    if (fills[i].type === 'SOLID' && fills[i].visible !== false) {
      return fills[i];
    }
  }
  return null;
}

// ── Walk up parents to find background ───────────────────────────────────────

async function findBackground(node, resolvedModes) {
  var current = node.parent;

  while (current && current.type !== 'DOCUMENT') {
    var fill = getFirstSolidFill(current);
    if (fill) {
      var varId = getBoundVariableFromFill(fill);
      if (varId) {
        // Use the same resolvedModes from the selected node — the background
        // frame is in the same brand context
        var resolved = await resolveVariableChain(varId, resolvedModes);
        return {
          source: 'variable',
          fill: fill,
          chain: resolved.chain,
          resolvedColor: resolved.resolvedColor,
          parentName: current.name,
          parentType: current.type
        };
      } else {
        return {
          source: 'raw',
          fill: fill,
          chain: [],
          resolvedColor: { r: fill.color.r, g: fill.color.g, b: fill.color.b, a: fill.opacity !== undefined ? fill.opacity : 1 },
          parentName: current.name,
          parentType: current.type
        };
      }
    }
    current = current.parent;
  }

  return null;
}

// ── Get foreground from node ──────────────────────────────────────────────────

async function getForeground(node, resolvedModes) {
  var fill = getFirstSolidFill(node);
  if (!fill) return null;

  var varId = getBoundVariableFromFill(fill);
  if (varId) {
    var resolved = await resolveVariableChain(varId, resolvedModes);
    return {
      source: 'variable',
      fill: fill,
      chain: resolved.chain,
      resolvedColor: resolved.resolvedColor
    };
  } else {
    var fillOpacity = fill.opacity !== undefined ? fill.opacity : 1;
    return {
      source: 'raw',
      fill: fill,
      chain: [],
      resolvedColor: { r: fill.color.r, g: fill.color.g, b: fill.color.b, a: fillOpacity }
    };
  }
}

// ── Main analysis ─────────────────────────────────────────────────────────────

async function analyse() {
  var selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Select a layer to check.' });
    return;
  }
  if (selection.length > 1) {
    figma.ui.postMessage({ type: 'error', message: 'Select a single layer to check.' });
    return;
  }

  var node = selection[0];
  figma.ui.postMessage({ type: 'loading' });

  try {
    // Get the effective brand/mode context for this node
    var resolvedModes = getResolvedModes(node);

    var fg = await getForeground(node, resolvedModes);
    if (!fg) {
      figma.ui.postMessage({ type: 'error', message: 'No solid fill found on selected layer.' });
      return;
    }

    var bg = await findBackground(node, resolvedModes);

    function chainToSteps(chain) {
      return chain.map(function(step) {
        var colorHex = null;
        if (step.rawValue && typeof step.rawValue === 'object' && 'r' in step.rawValue) {
          colorHex = toHex(step.rawValue.r, step.rawValue.g, step.rawValue.b);
        }
        return {
          name: step.name,
          collectionName: step.collectionName,
          modeName: step.modeName,
          modeNames: step.modeNames,
          colorHex: colorHex,
          isAlias: step.rawValue && typeof step.rawValue === 'object' && step.rawValue.type === 'VARIABLE_ALIAS'
        };
      });
    }

    var fgResolved = fg.resolvedColor;
    var fgAlphaValue = fgResolved && fgResolved.a !== undefined ? fgResolved.a : 1;
    var fgHasAlpha = hasAlpha(fgResolved);
    // Show the raw token hex in the UI swatch — composited hex shown separately
    var fgHex = fgResolved ? toHex(fgResolved.r, fgResolved.g, fgResolved.b) : null;

    var result = {
      type: 'result',
      nodeName: node.name,
      nodeType: node.type,
      fg: {
        source: fg.source,
        hex: fgHex,
        alpha: fgAlphaValue,
        hasAlpha: fgHasAlpha,
        steps: chainToSteps(fg.chain),
        collectionName: fg.chain.length > 0 ? fg.chain[0].collectionName : null,
        modeName: fg.chain.length > 0 ? fg.chain[0].modeName : null,
        modeNames: fg.chain.length > 0 ? fg.chain[0].modeNames : []
      },
      bg: null,
      contrast: null,
      noBackground: bg === null,
      alphaNoBackground: fgHasAlpha && bg === null
    };

    if (bg && bg.resolvedColor) {
      var bgResolved = bg.resolvedColor;
      var bgHex = toHex(bgResolved.r, bgResolved.g, bgResolved.b);

      result.bg = {
        source: bg.source,
        hex: bgHex,
        steps: chainToSteps(bg.chain),
        parentName: bg.parentName,
        parentType: bg.parentType,
        collectionName: bg.chain.length > 0 ? bg.chain[0].collectionName : null,
        modeName: bg.chain.length > 0 ? bg.chain[0].modeName : null,
        modeNames: bg.chain.length > 0 ? bg.chain[0].modeNames : []
      };

      // If fg has alpha, composite it over bg before calculating contrast.
      // WCAG requires contrast on the rendered colour, not the raw value.
      var fgAlpha = hasAlpha(fgResolved);
      var effectiveFg = fgAlpha ? compositeOverBackground(fgResolved, bgResolved) : fgResolved;

      var fgLum = relativeLuminance(effectiveFg.r, effectiveFg.g, effectiveFg.b);
      var bgLum = relativeLuminance(bgResolved.r, bgResolved.g, bgResolved.b);
      var ratio = contrastRatio(fgLum, bgLum);

      result.contrast = {
        ratio: Math.round(ratio * 100) / 100,
        normalAA: ratio >= 4.5,
        normalAAA: ratio >= 7,
        largeAA: ratio >= 3,
        largeAAA: ratio >= 4.5,
        wasComposited: fgAlpha,
        compositedHex: fgAlpha ? toHex(effectiveFg.r, effectiveFg.g, effectiveFg.b) : null
      };
    }

    figma.ui.postMessage(result);

  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: 'Error: ' + e.message });
  }
}

// ── Listeners ─────────────────────────────────────────────────────────────────

figma.ui.onmessage = async function(msg) {
  if (msg.type === 'analyse') await analyse();
  if (msg.type === 'close') figma.closePlugin();
};

figma.on('selectionchange', function() { analyse(); });

analyse();
