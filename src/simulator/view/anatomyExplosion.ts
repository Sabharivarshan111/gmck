import { Part, SYSTEMS } from '../data/atlasTypes';

export interface ExplosionLayout {
  targets: Float32Array;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Precompute each source mesh center once. Keeping this in a flat Float32Array
 * avoids allocating thousands of THREE.Vector3 objects while the mobile slider
 * is moving.
 */
export function buildPartCenters(parts: Part[]): Float32Array {
  const centers = new Float32Array(parts.length * 3);
  parts.forEach((part, index) => {
    const min = part.bounds[0];
    const max = part.bounds[1];
    centers[index * 3] = (min[0] + max[0]) * 0.5;
    centers[index * 3 + 1] = (min[1] + max[1]) * 0.5;
    centers[index * 3 + 2] = (min[2] + max[2]) * 0.5;
  });
  return centers;
}

/**
 * Each system gets a stable radial direction for the first half of the spread
 * gesture. This keeps the body recognizable before the view transitions into
 * the high-explosion inventory.
 */
export function buildSystemAngles(parts: Part[]): Float32Array {
  const systemIndex = new Map(SYSTEMS.map((system, index) => [system.id, index]));
  const result = new Float32Array(parts.length);
  parts.forEach((part, index) => {
    const group = systemIndex.get(part.system) ?? 0;
    result[index] = (group / Math.max(1, SYSTEMS.length)) * Math.PI * 2;
  });
  return result;
}

/**
 * Pack the real source-mesh bounding rectangles into a compact front-facing
 * inventory. Unlike a fixed grid this respects large bones/organs, so the
 * pieces do not pile on top of each other at 100% spread.
 */
export function buildExplodedInventoryTargets(
  parts: Part[],
  aspect: number
): ExplosionLayout {
  if (!parts.length) {
    return { targets: new Float32Array(), width: 1, height: 1 };
  }

  const safeAspect = clamp(aspect || 1, 0.42, 1.8);
  const padding = safeAspect < 0.75 ? 0.010 : 0.014;
  const systemIndex = new Map(SYSTEMS.map((system, index) => [system.id, index]));

  const cards = parts.map((part, index) => {
    const min = part.bounds[0];
    const max = part.bounds[1];
    const width = Math.max(0.018, max[0] - min[0]) + padding;
    const height = Math.max(0.018, max[1] - min[1]) + padding;
    const centerY = (min[1] + max[1]) * 0.5;
    return {
      index,
      width,
      height,
      centerY,
      system: systemIndex.get(part.system) ?? 0,
    };
  });

  const totalArea = cards.reduce((sum, card) => sum + card.width * card.height, 0);
  const maxCardWidth = Math.max(...cards.map((card) => card.width));
  const desiredWidth = Math.max(
    maxCardWidth * 1.08,
    Math.sqrt(totalArea * safeAspect) * (safeAspect < 0.75 ? 0.98 : 1.10)
  );

  // Grouping by system keeps the inventory visually learnable; descending
  // cranio-caudal order inside each system gives the rows anatomical rhythm.
  cards.sort((a, b) => a.system - b.system || b.centerY - a.centerY || a.index - b.index);

  const placements = new Array<{ x: number; y: number }>(parts.length);
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  let usedWidth = 0;

  for (const card of cards) {
    if (cursorX > 0 && cursorX + card.width > desiredWidth) {
      cursorY += rowHeight;
      cursorX = 0;
      rowHeight = 0;
    }

    placements[card.index] = {
      x: cursorX + card.width * 0.5,
      y: cursorY + card.height * 0.5,
    };
    cursorX += card.width;
    rowHeight = Math.max(rowHeight, card.height);
    usedWidth = Math.max(usedWidth, cursorX);
  }

  const totalHeight = Math.max(0.1, cursorY + rowHeight);
  const width = Math.max(0.1, usedWidth);
  const targets = new Float32Array(parts.length * 3);
  const centerY = 0.92;

  parts.forEach((_, index) => {
    const placement = placements[index] || { x: width * 0.5, y: totalHeight * 0.5 };
    targets[index * 3] = placement.x - width * 0.5;
    targets[index * 3 + 1] = centerY + totalHeight * 0.5 - placement.y;
    targets[index * 3 + 2] = 0;
  });

  return { targets, width, height: totalHeight };
}
