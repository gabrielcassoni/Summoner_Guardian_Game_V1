/**
 * High-performance 16-bit Retro Pixel Art Environment Engine for Summoner Guardian.
 * Pre-renders crisp pixel-art terrain, cobblestones, boardwalks, and lane dividers onto
 * cached off-screen canvases using integer coordinates and imageSmoothingEnabled = false.
 */

const biomeCanvasCache: Record<number, HTMLCanvasElement> = {};

export const ARENA_WIDTH = 840;
export const ARENA_HEIGHT = 450;
export const LANE_HEIGHT = 150; // Exactly 450 / 3

export function drawPixelEnvironment(
  ctx: CanvasRenderingContext2D,
  level: number,
  width: number,
  height: number,
  time: number
) {
  // 1. Get or create pre-rendered crisp terrain canvas
  let bgCanvas = biomeCanvasCache[level];
  if (!bgCanvas || bgCanvas.width !== width || bgCanvas.height !== height) {
    bgCanvas = createBiomeTerrainCanvas(level, width, height);
    biomeCanvasCache[level] = bgCanvas;
  }

  // Draw solid pre-rendered pixel background instantly
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bgCanvas, 0, 0);

  // 2. Draw Dynamic Animated Pixel Overlays per Biome
  if (level === 1) {
    // Forest: Drifting magical pollen glints
    const glint = Math.sin(time * 4) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(167, 243, 208, ${0.4 * glint})`;
    for (let i = 0; i < 6; i++) {
      const gx = 130 + ((i * 97 + Math.floor(time * 20)) % (width - 250));
      const gy = 40 + ((i * 67) % (height - 80));
      ctx.fillRect(gx, gy, 3, 3);
      ctx.fillRect(gx - 1, gy + 1, 5, 1);
    }
  } else if (level === 2) {
    // Cave: Glowing crystal gleams
    const gleam = Math.sin(time * 5) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(192, 132, 252, ${0.6 * gleam})`;
    const crystals = [
      [140, 60], [240, 210], [380, 130], [520, 280], [640, 90], [420, 390], [190, 360]
    ];
    crystals.forEach(([cx, cy]) => {
      ctx.fillRect(cx, cy, 3, 3);
      ctx.fillRect(cx - 1, cy + 1, 5, 1);
    });
  } else if (level === 3) {
    // Lake/River: Animated pixel water ripples & foam around wooden boardwalks
    const waveShift = Math.floor((time * 20) % 24);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    for (let y = 8; y < height; y += 28) {
      for (let x = 115; x < width - 100; x += 36) {
        const ox = ((x + waveShift * 2) % (width - 230)) + 115;
        ctx.fillRect(ox, y, 8, 2);
        ctx.fillRect(ox + 1, y + 2, 4, 1);
      }
    }
  } else if (level === 4) {
    // Mountain: Snow glints on peak stones
    const snowGlint = Math.sin(time * 3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(248, 250, 252, ${0.5 * snowGlint})`;
    for (let i = 0; i < 8; i++) {
      const sx = 120 + ((i * 83) % (width - 240));
      const sy = 20 + ((i * 53 + Math.floor(time * 15)) % (height - 40));
      ctx.fillRect(sx, sy, 2, 2);
    }
  } else if (level === 5) {
    // Volcano: Bubbling pixel magma blisters in lava rivers
    const magmaPulse = Math.floor(time * 14);
    for (let i = 1; i < 3; i++) {
      const by = Math.floor(i * LANE_HEIGHT);
      for (let x = 115; x < width - 100; x += 40) {
        const bubble = (x + magmaPulse * 3) % 40;
        if (bubble < 12) {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(x, by - 5, 8, 8);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 1, by - 4, 6, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 2, by - 3, 3, 3);
        }
      }
    }
  }

  // 3. Draw Pixel Sanctuary (Left Gate) & Pixel Portal (Right Gate)
  drawPixelSanctuary(ctx, level, 110, height, time);
  drawPixelPortal(ctx, level, width - 90, width, height, time);

  ctx.restore();
}

/**
 * Pre-renders the full pixel art terrain, pathways, cobblestones, and lane borders
 * onto a dedicated offscreen canvas with strictly pixel-aligned coordinates.
 */
function createBiomeTerrainCanvas(level: number, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;
  const TILE = 16;
  const laneHeight = LANE_HEIGHT; // 150px exact

  if (level === 1) {
    // =========================================================================
    // LEVEL 1: FLORESTA SERENA (Ancient Sacred Forest)
    // =========================================================================
    // Base rich fertile earth
    ctx.fillStyle = '#062014';
    ctx.fillRect(0, 0, width, height);

    // Lush variegated grass carpet with dithered texture
    for (let y = 0; y < height; y += TILE) {
      const laneIdx = Math.floor(y / laneHeight);
      for (let x = 0; x < width; x += TILE) {
        const seed = (x * 13 + y * 17) % 7;
        let grassColor = '#0b3924';
        if (seed === 0) grassColor = '#0d432b';
        else if (seed === 1) grassColor = '#09311f';
        else if (seed === 2) grassColor = '#0f4d32';
        else if (seed === 3) grassColor = '#072719';

        ctx.fillStyle = grassColor;
        ctx.fillRect(x, y, TILE, TILE);

        // Pixel grass blades
        if (((x * 7 + y * 19) % 11) === 0) {
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(x + 3, y + 4, 3, 6);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(x + 4, y + 2, 2, 4);
        }

        // Wildflowers: Buttercups (yellow) and Bluebells (cyan)
        if (((x * 23 + y * 31) % 47) === 0 && x > 110 && x < width - 110) {
          const isYellow = ((x + y) % 2) === 0;
          ctx.fillStyle = isYellow ? '#facc15' : '#38bdf8';
          ctx.fillRect(x + 5, y + 5, 4, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 6, y + 6, 2, 2);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(x + 6, y + 9, 2, 3);
        }
      }
    }

    // Walking path in the middle of each lane (Ancient Mossy Flagstones)
    for (let lane = 0; lane < 3; lane++) {
      const cy = lane * laneHeight + Math.floor(laneHeight / 2);

      // Path ground shading
      ctx.fillStyle = '#062719';
      ctx.fillRect(110, cy - 24, width - 200, 48);

      // Cobblestone slabs
      for (let x = 114; x < width - 100; x += 32) {
        const offset = ((x / 32) % 2 === 0) ? -2 : 2;
        // Stone shadow
        ctx.fillStyle = '#0f2918';
        ctx.fillRect(x, cy - 14 + offset, 26, 28);
        // Stone body
        ctx.fillStyle = '#1c4a2a';
        ctx.fillRect(x + 2, cy - 12 + offset, 22, 24);
        // Stone highlight
        ctx.fillStyle = '#2d6d3d';
        ctx.fillRect(x + 3, cy - 11 + offset, 18, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(x + 5, cy - 9 + offset, 6, 2);
        // Moss in cracks
        ctx.fillStyle = '#86efac';
        ctx.fillRect(x + 16, cy + 4 + offset, 4, 3);
      }
    }

    // Crisp Lane Dividers: Ancient Living Vine-wrapped Stone Curbs
    for (let i = 1; i < 3; i++) {
      const by = i * laneHeight;

      // Divider base shadow
      ctx.fillStyle = '#03140c';
      ctx.fillRect(100, by - 6, width - 190, 12);

      // Stone kerb
      ctx.fillStyle = '#143d25';
      ctx.fillRect(100, by - 3, width - 190, 6);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(100, by - 1, width - 190, 2);

      // Carved rune stones along divider
      for (let x = 120; x < width - 110; x += 48) {
        ctx.fillStyle = '#0d2818';
        ctx.fillRect(x, by - 7, 10, 14);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x + 1, by - 6, 8, 12);
        ctx.fillStyle = '#86efac';
        ctx.fillRect(x + 3, by - 4, 4, 4);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 4, by - 3, 2, 2);
      }
    }
  } else if (level === 2) {
    // =========================================================================
    // LEVEL 2: CAVERNA DOS CRISTAIS (Deepslate & Amethyst Cave)
    // =========================================================================
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, width, height);

    // Deepslate brick patterns
    for (let y = 0; y < height; y += TILE) {
      const isStagger = (Math.floor(y / TILE) % 2) === 1;
      for (let x = 0; x < width; x += TILE) {
        const sx = isStagger ? x + 8 : x;
        const seed = (x * 11 + y * 23) % 5;
        let slateCol = '#0d1322';
        if (seed === 0) slateCol = '#11182c';
        else if (seed === 1) slateCol = '#0a0f1b';
        else if (seed === 2) slateCol = '#151e36';

        ctx.fillStyle = slateCol;
        ctx.fillRect(x, y, TILE, TILE);

        // Brick grout lines
        ctx.fillStyle = '#04070d';
        ctx.fillRect(x, y + TILE - 1, TILE, 1);
        ctx.fillRect(x + TILE - 1, y, 1, TILE);

        // Glowing Amethyst Geodes & Cyan Crystals embedded in cave rock
        if (((x * 19 + y * 7) % 37) === 0 && x > 110 && x < width - 110) {
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(x + 4, y + 4, 6, 6);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(x + 5, y + 3, 4, 4);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(x + 6, y + 2, 2, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 7, y + 3, 1, 1);
        } else if (((x * 29 + y * 13) % 41) === 0 && x > 110 && x < width - 110) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x + 4, y + 5, 5, 5);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 5, y + 4, 3, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 6, y + 4, 1, 1);
        }
      }
    }

    // Walking path: Polished Obsidian Pavers with runic engravings
    for (let lane = 0; lane < 3; lane++) {
      const cy = lane * laneHeight + Math.floor(laneHeight / 2);

      ctx.fillStyle = '#080d1a';
      ctx.fillRect(110, cy - 26, width - 200, 52);

      for (let x = 115; x < width - 100; x += 36) {
        ctx.fillStyle = '#101728';
        ctx.fillRect(x, cy - 16, 28, 32);
        ctx.fillStyle = '#18233d';
        ctx.fillRect(x + 2, cy - 14, 24, 28);
        ctx.fillStyle = '#26375c';
        ctx.fillRect(x + 3, cy - 13, 20, 6);
        // Cyan floor rune
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 10, cy - 2, 8, 4);
        ctx.fillRect(x + 12, cy - 6, 4, 12);
      }
    }

    // Lane Dividers: Glowing Stalagmite Crystal Ridges
    for (let i = 1; i < 3; i++) {
      const by = i * laneHeight;

      ctx.fillStyle = '#03050a';
      ctx.fillRect(100, by - 6, width - 190, 12);

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(100, by - 2, width - 190, 4);

      for (let x = 115; x < width - 105; x += 32) {
        // Stalagmite spikes
        ctx.fillStyle = '#312e81';
        ctx.fillRect(x, by - 8, 8, 16);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x + 1, by - 6, 6, 12);
        ctx.fillStyle = '#a5b4fc';
        ctx.fillRect(x + 2, by - 4, 4, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 3, by - 2, 2, 4);
      }
    }
  } else if (level === 3) {
    // =========================================================================
    // LEVEL 3: RIO & LAGO MÍSTICO (Sacred River & Wooden Boardwalks)
    // =========================================================================
    // Deep mystical water base
    ctx.fillStyle = '#021e2d';
    ctx.fillRect(0, 0, width, height);

    // Flowing water bands
    for (let y = 0; y < height; y += 4) {
      const deep = (y % 16 < 8);
      ctx.fillStyle = deep ? '#03293d' : '#05344d';
      ctx.fillRect(0, y, width, 4);
    }

    // Water lilies & lotus blossoms floating in water gaps
    for (let y = 10; y < height; y += 40) {
      for (let x = 130; x < width - 110; x += 70) {
        if (((x * 7 + y * 13) % 23) === 0) {
          // Lily pad
          ctx.fillStyle = '#15803d';
          ctx.fillRect(x, y, 14, 10);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(x + 2, y + 2, 10, 6);
          // Lotus flower
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(x + 4, y + 3, 5, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 5, y + 4, 3, 2);
        }
      }
    }

    // Massive, High-Detail Wooden Boardwalk Bridge for each lane
    for (let lane = 0; lane < 3; lane++) {
      const laneY = lane * laneHeight + 12;
      const bHeight = laneHeight - 24; // 126px height boardwalk!

      // Bridge dark under-shadow over water
      ctx.fillStyle = '#01121c';
      ctx.fillRect(105, laneY - 4, width - 190, bHeight + 8);

      // Side supporting wooden beams
      ctx.fillStyle = '#271207';
      ctx.fillRect(108, laneY - 2, width - 196, 4);
      ctx.fillRect(108, laneY + bHeight - 2, width - 196, 4);

      // Vertical bridge timber planks
      for (let x = 112; x < width - 95; x += 16) {
        // Plank separation gap
        ctx.fillStyle = '#1a0c04';
        ctx.fillRect(x, laneY, 2, bHeight);

        // Plank face
        const seed = (x / 16) % 3;
        ctx.fillStyle = seed === 0 ? '#5a2d12' : seed === 1 ? '#683416' : '#4d250e';
        ctx.fillRect(x + 2, laneY, 14, bHeight);

        // Wood grain streaks
        ctx.fillStyle = '#7a3e1a';
        ctx.fillRect(x + 4, laneY + 4, 3, bHeight - 8);
        ctx.fillStyle = '#3c1c09';
        ctx.fillRect(x + 10, laneY + 8, 2, bHeight - 16);

        // Iron nails on top and bottom of each plank
        ctx.fillStyle = '#0f0703';
        ctx.fillRect(x + 4, laneY + 3, 3, 3);
        ctx.fillRect(x + 4, laneY + bHeight - 6, 3, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 5, laneY + 4, 1, 1);
        ctx.fillRect(x + 5, laneY + bHeight - 5, 1, 1);
      }

      // Middle walking path wear on the wood
      ctx.fillStyle = 'rgba(180, 83, 9, 0.15)';
      ctx.fillRect(112, laneY + Math.floor(bHeight / 2) - 18, width - 200, 36);
    }

    // Lane Dividers: Wooden Post & Rope Railings
    for (let i = 1; i < 3; i++) {
      const by = i * laneHeight;

      // Water canal between boardwalks
      ctx.fillStyle = '#021824';
      ctx.fillRect(100, by - 10, width - 190, 20);

      // Rope line
      ctx.fillStyle = '#92400e';
      ctx.fillRect(105, by - 2, width - 200, 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(105, by - 1, width - 200, 1);

      // Wooden fence posts
      for (let x = 112; x < width - 100; x += 28) {
        ctx.fillStyle = '#1e0c04';
        ctx.fillRect(x, by - 8, 6, 16);
        ctx.fillStyle = '#5c2b0e';
        ctx.fillRect(x + 1, by - 7, 4, 14);
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(x + 1, by - 7, 4, 3);
        // Post rope knot
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x - 1, by - 2, 8, 3);
      }
    }
  } else if (level === 4) {
    // =========================================================================
    // LEVEL 4: PICO DAS TEMPESTADES (Glacial Mountain & Frozen Flagstones)
    // =========================================================================
    ctx.fillStyle = '#111215';
    ctx.fillRect(0, 0, width, height);

    // Frost-cracked granite stone tiles
    for (let y = 0; y < height; y += TILE) {
      for (let x = 0; x < width; x += TILE) {
        const seed = (x * 17 + y * 29) % 6;
        let rockColor = '#1f2025';
        if (seed === 0) rockColor = '#27282f';
        else if (seed === 1) rockColor = '#19191d';
        else if (seed === 2) rockColor = '#2e3039';

        ctx.fillStyle = rockColor;
        ctx.fillRect(x, y, TILE, TILE);

        // Snow patches & frost crystals
        if (((x * 13 + y * 19) % 23) === 0 && x > 110 && x < width - 110) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x + 2, y + 2, 10, 6);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(x + 3, y + 3, 8, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 5, y + 4, 4, 2);
        }
      }
    }

    // Walking path: Glacial Ice Pathway
    for (let lane = 0; lane < 3; lane++) {
      const cy = lane * laneHeight + Math.floor(laneHeight / 2);

      ctx.fillStyle = '#141820';
      ctx.fillRect(110, cy - 24, width - 200, 48);

      for (let x = 115; x < width - 100; x += 36) {
        // Blue glacial flagstones
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, cy - 14, 28, 28);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 2, cy - 12, 24, 24);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 3, cy - 11, 20, 5);
        // Frost frost glint
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(x + 6, cy - 2, 12, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 8, cy - 1, 6, 1);
      }
    }

    // Lane Dividers: Frozen Rock Slabs & Ice Spikes
    for (let i = 1; i < 3; i++) {
      const by = i * laneHeight;

      ctx.fillStyle = '#08090c';
      ctx.fillRect(100, by - 6, width - 190, 12);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(100, by - 2, width - 190, 4);

      for (let x = 115; x < width - 105; x += 36) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, by - 8, 12, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 1, by - 7, 10, 14);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + 3, by - 6, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, by - 5, 4, 3);
      }
    }
  } else {
    // =========================================================================
    // LEVEL 5: VULCÃO & MAGMA (Caldera of the Corrupted Titan)
    // =========================================================================
    // Scorched obsidian bedrock
    ctx.fillStyle = '#0e0304';
    ctx.fillRect(0, 0, width, height);

    // Cracked basalt pavers with glowing incandescent lava fissures
    for (let y = 0; y < height; y += TILE) {
      for (let x = 0; x < width; x += TILE) {
        const seed = (x * 19 + y * 23) % 7;
        let basaltColor = '#170607';
        if (seed === 0) basaltColor = '#21080a';
        else if (seed === 1) basaltColor = '#120405';
        else if (seed === 2) basaltColor = '#2a0a0d';

        ctx.fillStyle = basaltColor;
        ctx.fillRect(x, y, TILE, TILE);

        // Magma cracks through stone
        if (((x * 29 + y * 17) % 31) === 0 && x > 110 && x < width - 110) {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(x + 2, y + 4, 10, 4);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(x + 4, y + 5, 7, 2);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(x + 5, y + 5, 4, 2);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 6, y + 5, 2, 1);
        }
      }
    }

    // Walking path: Dark Basalt Causeway
    for (let lane = 0; lane < 3; lane++) {
      const cy = lane * laneHeight + Math.floor(laneHeight / 2);

      ctx.fillStyle = '#100304';
      ctx.fillRect(110, cy - 26, width - 200, 52);

      for (let x = 115; x < width - 100; x += 36) {
        ctx.fillStyle = '#1b0507';
        ctx.fillRect(x, cy - 16, 28, 32);
        ctx.fillStyle = '#31090d';
        ctx.fillRect(x + 2, cy - 14, 24, 28);
        ctx.fillStyle = '#4c0d13';
        ctx.fillRect(x + 3, cy - 13, 20, 6);
        // Orange heat vein
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(x + 8, cy, 12, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 10, cy + 1, 8, 1);
      }
    }

    // Lane Dividers: Boiling Molten Magma Canals
    for (let i = 1; i < 3; i++) {
      const by = i * laneHeight;

      // Canal ditch
      ctx.fillStyle = '#050101';
      ctx.fillRect(100, by - 8, width - 190, 16);

      // Deep red lava bed
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(100, by - 6, width - 190, 12);

      // Bright fiery orange lava river
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(100, by - 4, width - 190, 8);

      // Yellow-hot magma core
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(100, by - 1, width - 190, 2);

      // Hardened obsidian borders
      for (let x = 115; x < width - 105; x += 40) {
        ctx.fillStyle = '#180406';
        ctx.fillRect(x, by - 9, 8, 3);
        ctx.fillRect(x, by + 6, 8, 3);
      }
    }
  }

  // Draw Lane Number Emblems on Left Edge (Pixel P1, P2, P3 Badges)
  for (let lane = 0; lane < 3; lane++) {
    const ly = lane * laneHeight + 10;
    ctx.fillStyle = '#020b08';
    ctx.fillRect(114, ly, 28, 18);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(116, ly + 2, 24, 14);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${lane + 1}`, 128, ly + 13);
  }

  return canvas;
}

/**
 * Pixel Sanctuary (Left Gate) - Hand-crafted Ancient Tree Shrine
 */
function drawPixelSanctuary(
  ctx: CanvasRenderingContext2D,
  level: number,
  gateX: number,
  height: number,
  time: number
) {
  // Border wall line (Runestone barrier)
  ctx.fillStyle = '#021a12';
  ctx.fillRect(gateX - 10, 0, 10, height);
  ctx.fillStyle = '#065f46';
  ctx.fillRect(gateX - 6, 0, 6, height);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(gateX - 2, 0, 2, height);

  // Left Sanctuary Grounds: Ancient Grass & Roots
  ctx.fillStyle = '#031f15';
  ctx.fillRect(0, 0, gateX - 10, height);

  const cy = Math.floor(height / 2);
  const pulse = Math.sin(time * 3) * 3;

  // Ancient Sacred Oak Tree Trunk & Roots spanning behind shrine
  ctx.fillStyle = '#1c0f06';
  ctx.fillRect(4, cy - 90, 64, 180);
  ctx.fillStyle = '#3a1e0d';
  ctx.fillRect(10, cy - 80, 52, 160);
  ctx.fillStyle = '#592e15';
  ctx.fillRect(16, cy - 70, 40, 140);

  // Living moss & leafy foliage on the sanctuary branches
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(2, cy - 110, 80, 28);
  ctx.fillStyle = '#047857';
  ctx.fillRect(6, cy - 104, 72, 18);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(14, cy - 98, 56, 10);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(24, cy - 94, 32, 4);

  // Sanctuary Base Pedestal (Sacred Altar Stone)
  ctx.fillStyle = '#022c22';
  ctx.fillRect(18, cy - 44, 76, 88);
  ctx.fillStyle = '#065f46';
  ctx.fillRect(22, cy - 40, 68, 80);
  ctx.fillStyle = '#047857';
  ctx.fillRect(26, cy - 36, 60, 72);

  // Sacred Emerald Heart Crystal (Pulsing Mana Core)
  ctx.fillStyle = '#059669';
  ctx.fillRect(36, cy - 24, 40, 48);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(
    Math.floor(40 - pulse * 0.5),
    Math.floor(cy - 20 - pulse * 0.5),
    Math.floor(32 + pulse),
    Math.floor(40 + pulse)
  );

  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(46, cy - 14, 20, 28);

  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(52, cy - 8, 10, 16);

  // Plaque: "SANTUÁRIO"
  ctx.fillStyle = '#011912';
  ctx.fillRect(14, cy + 46, 84, 16);
  ctx.fillStyle = '#10b981';
  ctx.strokeRect(14, cy + 46, 84, 16);
  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SANTUÁRIO', 56, cy + 58);
}

/**
 * Pixel Portal (Right Gate) - Hand-crafted Demonic Void Rift
 */
function drawPixelPortal(
  ctx: CanvasRenderingContext2D,
  level: number,
  gateX: number,
  width: number,
  height: number,
  time: number
) {
  const isVolcano = level === 5;
  const edgeColor = isVolcano ? '#f97316' : '#a855f7';
  const innerColor = isVolcano ? '#dc2626' : '#7e22ce';
  const coreColor = isVolcano ? '#fef08a' : '#f0abfc';

  // Border wall line (Shadow Rift Threshold)
  ctx.fillStyle = isVolcano ? '#450a0a' : '#2e1065';
  ctx.fillRect(gateX, 0, 10, height);
  ctx.fillStyle = edgeColor;
  ctx.fillRect(gateX, 0, 3, height);

  // Right Abyss Background
  ctx.fillStyle = isVolcano ? '#160204' : '#090214';
  ctx.fillRect(gateX + 10, 0, width - gateX, height);

  const cy = Math.floor(height / 2);
  const pulse = Math.sin(time * 4) * 3;

  // Dark obsidian portal monoliths
  ctx.fillStyle = '#03010a';
  ctx.fillRect(gateX + 12, cy - 54, 66, 108);

  ctx.fillStyle = isVolcano ? '#7f1d1d' : '#3b0764';
  ctx.fillRect(gateX + 18, cy - 48, 54, 96);

  // Demonic horn crown
  ctx.fillStyle = '#1a052b';
  ctx.fillRect(gateX + 14, cy - 64, 12, 14);
  ctx.fillRect(gateX + 56, cy - 64, 12, 14);

  // Swirling Void Rift Core
  ctx.fillStyle = innerColor;
  ctx.fillRect(
    Math.floor(gateX + 24 - pulse * 0.5),
    Math.floor(cy - 34 - pulse * 0.5),
    Math.floor(42 + pulse),
    Math.floor(68 + pulse)
  );

  ctx.fillStyle = coreColor;
  ctx.fillRect(gateX + 32, cy - 22, 26, 44);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gateX + 38, cy - 14, 14, 28);

  // Plaque: "PORTAL"
  ctx.fillStyle = '#05010c';
  ctx.fillRect(gateX + 12, cy + 56, 68, 16);
  ctx.fillStyle = edgeColor;
  ctx.strokeRect(gateX + 12, cy + 56, 68, 16);
  ctx.fillStyle = isVolcano ? '#fca5a5' : '#e9d5ff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PORTAL', gateX + 46, cy + 68);
}
