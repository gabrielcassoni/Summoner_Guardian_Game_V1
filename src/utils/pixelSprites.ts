/**
 * Custom Pixel Art Sprites Engine for Summoner Guardian.
 * Renders hand-crafted, high-contrast pixel art for each Nature Summon and Corrupted Monster
 * matching their official color palettes and proportional bounding boxes.
 */

export type SpriteId =
  // Nature Summons
  | 'thorn_sprout'
  | 'spirit_wolf'
  | 'bloom_pixie'
  | 'storm_hawk'
  | 'ancient_treant'
  | 'moss_colossus'
  | 'emerald_viper'
  | 'verdant_wyrm'
  // Corrupted Mobs
  | 'mob_crawler'
  | 'mob_hound'
  | 'mob_spider'
  | 'mob_fiend'
  | 'mob_boss';

// Palette definitions matching the game's exact artwork tones
const PALETTES = {
  // Sprout: bright lime, forest green, thorn brown, glowing yellow eye
  sprout: {
    '.': 'transparent',
    'b': '#1e3a12', // dark bark/stem
    'g': '#4d7c0f', // forest green
    'l': '#84cc16', // bright lime leaf
    'y': '#fef08a', // glowing eye
    't': '#a16207', // wood thorn
    'w': '#ffffff', // eye glint
  },
  // Spirit Wolf: emerald, jade, mint glow, leaves
  wolf: {
    '.': 'transparent',
    'd': '#064e3b', // dark forest outline
    'e': '#059669', // deep emerald
    'j': '#10b981', // vibrant jade
    'm': '#6ee7b7', // mint energy glow
    'y': '#fef08a', // spirit eye
    'w': '#ffffff',
  },
  // Bloom Pixie: fairy skin, petal emerald dress, translucent wing cyan/mint
  pixie: {
    '.': 'transparent',
    's': '#fde047', // fairy glow hair
    'f': '#fbcfe8', // petal pink
    'g': '#10b981', // leafy dress
    'l': '#34d399', // mint
    'w': '#a7f3d0', // translucent wing
    'c': '#38bdf8', // wing spark
    'e': '#064e3b',
  },
  // Storm Hawk: emerald feather tones, gold beak, white wingtips
  hawk: {
    '.': 'transparent',
    'd': '#064e3b',
    'e': '#047857',
    'g': '#10b981',
    'l': '#34d399',
    'b': '#f59e0b', // gold beak
    'w': '#ffffff',
  },
  // Ancient Treant: ancient bark, lush moss, emerald rune eyes
  treant: {
    '.': 'transparent',
    'k': '#1c1917', // dark bark shadow
    'b': '#451a03', // rich wood bark
    't': '#78350f', // light bark
    'm': '#15803d', // deep moss
    'l': '#22c55e', // bright foliage
    'e': '#6ee7b7', // glowing green eye
    'w': '#ffffff',
  },
  // Moss Colossus: stone slate, jade moss cracks, glowing core
  colossus: {
    '.': 'transparent',
    'k': '#0f172a', // shadow stone
    's': '#334155', // rock gray
    'l': '#64748b', // light stone
    'm': '#059669', // moss
    'j': '#34d399', // bright jade rune
    'c': '#6ee7b7', // radiant core
  },
  // Emerald Viper: emerald scales, gold belly, red tongue
  viper: {
    '.': 'transparent',
    'd': '#064e3b',
    'e': '#059669',
    'g': '#10b981',
    'y': '#facc15', // gold scale
    'r': '#ef4444', // forked tongue
    'w': '#ffffff',
  },
  // Verdant Wyrm: dragon scales, horns, breath embers
  wyrm: {
    '.': 'transparent',
    'd': '#064e3b',
    'e': '#047857',
    'g': '#10b981',
    'h': '#f59e0b', // dragon horn
    'f': '#34d399', // wing membrane
    'y': '#fef08a', // dragon eye
  },
  // Corrupted Crawler: obsidian carapace, toxic purple, crimson eye
  crawler: {
    '.': 'transparent',
    'k': '#0f051d', // dark obsidian
    'p': '#581c87', // deep blight purple
    'm': '#9333ea', // neon toxic purple
    'r': '#ef4444', // crimson eye
    'w': '#fca5a5',
  },
  // Corrupted Hound: jagged spikes, burning red jaws
  hound: {
    '.': 'transparent',
    'k': '#0a0214',
    'p': '#4c1d95',
    'v': '#7c3aed',
    'r': '#dc2626',
    'f': '#f87171',
    'w': '#ffffff',
  },
  // Toxic Spider: poison skull mark, web spinner
  spider: {
    '.': 'transparent',
    'k': '#090514',
    'p': '#3b0764',
    't': '#a855f7',
    'g': '#22c55e', // green toxic venom
    'r': '#ef4444',
  },
  // Corrupted Fiend: shadow horns, heavy brute silhouette
  fiend: {
    '.': 'transparent',
    'k': '#08020f',
    'p': '#2e1065',
    'v': '#6b21a8',
    't': '#c084fc',
    'r': '#b91c1c',
    'y': '#f87171',
  },
  // Corrupted Boss Behemoth: obsidian armor, burning furnace core, demonic horns
  boss: {
    '.': 'transparent',
    'k': '#05010a',
    'b': '#1e0538',
    'p': '#581c87',
    'm': '#9333ea',
    'c': '#e11d48', // crimson plate
    'r': '#ef4444', // burning eye
    'o': '#f97316', // molten flame
    'y': '#fef08a', // core reactor
    'w': '#ffffff',
  },
};

// 14x14 matrix definitions for each character
const SPRITE_MATRICES: Record<SpriteId, string[]> = {
  thorn_sprout: [
    '....ll..ll....',
    '....ll..ll....',
    '...lllllllll..',
    '..lllggbgglll.',
    '..llgyygyygll.',
    '..llgyygyygll.',
    '...llgggggll..',
    '..t..lgggl..t.',
    '.tt...bbb...tt',
    'tt...bbbbb...t',
    '....bbg.gbb...',
    '...bbb...bbb..',
    '..bbbb...bbbb.',
    '.bbb.......bbb',
  ],

  spirit_wolf: [
    '..d....d......',
    '.dee..eed.....',
    '.deeeeed..mm..',
    'deeeeyeejmmmm.',
    'deeeeyeejmmmm.',
    '.deeeeeeemmmm.',
    '..deeeeeeeee..',
    '..deeeeeeeed..',
    '...deeeeeeed..',
    '...deedddeed..',
    '..jde..jde....',
    '..jde..jde....',
    '.jjde..jjde...',
    '.mm....mm.....',
  ],

  bloom_pixie: [
    '.....ssss.....',
    '...ssswwss....',
    '..wwsswwssww..',
    '.wwwwffffwwww.',
    '.wwweffeeeww..',
    '..wffffffffw..',
    '....fggggf....',
    '...gggggggg...',
    '..lggggggggl..',
    '..llggggggll..',
    '...llg..gll...',
    '....l....l....',
    '....c....c....',
    '..............',
  ],

  storm_hawk: [
    '...d..........',
    '..ded...d.....',
    '.deged.ded....',
    '.deggebdegd...',
    '.degggbdegd...',
    '..deggbbeggd..',
    '..ddeggggggd..',
    '..dleggggggld.',
    '.dlleeggeelld.',
    '.wll......llw.',
    '..w........w..',
    '....bb..bb....',
    '....bb..bb....',
    '..............',
  ],

  ancient_treant: [
    '...k.mm..mm.k.',
    '..kkllm..mllkk',
    '..kkllb..bllkk',
    '..kkkbb..bbkkk',
    '.kklbbe..eblkk',
    '.kklbbe..eblkk',
    '..kbbbbbbbbk..',
    '..kbtmmmmtbk..',
    '.kkbttmmttbkk.',
    'kkkbttmmttbkkk',
    '.kkkb....bkkk.',
    '.kkbb....bbkk.',
    '.kbbk....kbbk.',
    'kbbb......bbbk',
  ],

  moss_colossus: [
    '....ssssss....',
    '..ssksssskss..',
    '.sskksssskkss.',
    '.ssjjeccjjeess',
    '.ssjjeccjjeess',
    '..ssssssssss..',
    '.sssmssssmss..',
    'ssssmmmmmmssss',
    'sssssmmmmsssss',
    's.ssskkkksss.s',
    '..ssk....kss..',
    '..sss....sss..',
    '.ssss....ssss.',
    '.kkkk....kkkk.',
  ],

  emerald_viper: [
    '......dddd....',
    '....ddeegged..',
    '...deeyggeyed.',
    '..deegyygyyed.',
    '..rdeegggged..',
    '...ddeegged...',
    '....ddged.....',
    '....dgyed.....',
    '...dgyeed.....',
    '..dgyyeedd....',
    '.dgyyeed......',
    '.ddgeedd......',
    '..ddeed.......',
    '....dd........',
  ],

  verdant_wyrm: [
    '..hd......dh..',
    '..hdd....ddh..',
    '..hddeeeddh...',
    '..deegyygfed..',
    '.deegyyygffed.',
    '.deegggfgffed.',
    '.ddeeeffffedd.',
    '..ddeeeffeed..',
    '..deeggggeed..',
    '.deeggffgged..',
    '.deeg....ged..',
    '.deg......ged.',
    'ddg........gdd',
    '..............',
  ],

  mob_crawler: [
    '..k........k..',
    '..kp......pk..',
    '...kpp..ppk...',
    '....kppppk....',
    '...kprrrpk....',
    '..kkprrrpkk...',
    '.k..kppppk..k.',
    'kk.kkppppkk.kk',
    '.k.kkppppkk.k.',
    '...kkppppkk...',
    '..k..k..k..k..',
    '.kk..k..k..kk.',
    '.k..........k.',
    '..............',
  ],

  mob_hound: [
    '..k..........k',
    '.kp..........p',
    '.kpp...k....kp',
    'kppprrkpp..kpp',
    'kppprrkpp..kpp',
    'kppvppkpppkkpp',
    '.kppppkppppppp',
    '.kpppppppppppp',
    '..kpppppppppp.',
    '..kpppk..kppk.',
    '..kppk....kppk',
    '..kpk......kpk',
    '..kk........kk',
    '..............',
  ],

  mob_spider: [
    'k............k',
    '.k...kppk...k.',
    '..k.kppppk.k..',
    '..kkprrrrpkk..',
    '..kkprrrrpkk..',
    'k.kkkppppkkk.k',
    '.k..kppppk..k.',
    '..kkpttgtpkk..',
    '..kpttgttgpk..',
    '.k.kpttttpk.k.',
    'k...kppppk...k',
    '.....kppk.....',
    '....k....k....',
    '..............',
  ],

  mob_fiend: [
    '..k........k..',
    '.kp........pk.',
    '.kpk..pp..kpk.',
    '..kpppppppk...',
    '..kprrrpppk...',
    '..kppyyyppk...',
    '..kpppppppk...',
    '.kkpvvvvvpkk..',
    'kkkpvvvvvpkkk.',
    '.kkpvvvvvpkk..',
    '..kkp....pkk..',
    '..kkp....pkk..',
    '.kkkp....pkkk.',
    '.kk........kk.',
  ],

  mob_boss: [
    '..k...kk..kk...k..',
    '.kp..kpp..ppk..pk.',
    '.kppkppk..kppkppk.',
    '..kppppk..kppppk..',
    '..kpprroccorppk...',
    '..kpprroccorppk...',
    '..kppppcyycpppk...',
    '..kkpppcwwcppkk...',
    '.kkkppppppppkkk...',
    '.kkkpvvmmvvpkkk...',
    '..kkpvvmmvvpkk....',
    '...kpvvmmvvpk.....',
    '..kkpvv..vvpkk....',
    '..kkp......pkk....',
  ],
};

/**
 * Draws a pixel art character centered at (0, 0) inside its bounding box.
 * Automatically mirrors if facing left (e.g. mobs).
 */
export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  spriteId: SpriteId,
  boxWidth: number,
  boxHeight: number,
  isFacingRight: boolean = true,
  bobOffset: number = 0
) {
  const matrix = SPRITE_MATRICES[spriteId];
  if (!matrix) return;

  const rows = matrix.length;
  const cols = matrix[0].length;

  // Derive palette key
  let paletteKey: keyof typeof PALETTES = 'wolf';
  if (spriteId.startsWith('mob_')) {
    const mobType = spriteId.replace('mob_', '') as keyof typeof PALETTES;
    paletteKey = PALETTES[mobType] ? mobType : 'crawler';
  } else {
    const summonType = spriteId.replace('thorn_', '').replace('spirit_', '').replace('bloom_', '').replace('storm_', '').replace('ancient_', '').replace('moss_', '').replace('emerald_', '').replace('verdant_', '') as keyof typeof PALETTES;
    paletteKey = PALETTES[summonType] ? summonType : 'sprout';
  }

  const palette = (PALETTES as Record<string, Record<string, string>>)[paletteKey] || PALETTES.wolf;

  // Pixel scaling so the sprite neatly fills the box
  const pixelSize = Math.min(boxWidth / cols, boxHeight / rows);
  const startX = -(cols * pixelSize) / 2;
  const startY = -(rows * pixelSize) / 2 + bobOffset;

  ctx.save();

  // Face left or right
  if (!isFacingRight) {
    ctx.scale(-1, 1);
  }

  // Draw pixel matrix
  for (let r = 0; r < rows; r++) {
    const rowStr = matrix[r];
    for (let c = 0; c < cols; c++) {
      const char = rowStr[c];
      const color = palette[char];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(startX + c * pixelSize),
          Math.floor(startY + r * pixelSize),
          Math.ceil(pixelSize),
          Math.ceil(pixelSize)
        );
      }
    }
  }

  ctx.restore();
}

/**
 * Maps cardId or mob type to its corresponding SpriteId.
 */
export function getSpriteId(cardOrMobId: string, isAlly: boolean, role?: string, maxHp?: number): SpriteId {
  if (isAlly) {
    switch (cardOrMobId) {
      case 'thorn_sprout': return 'thorn_sprout';
      case 'spirit_wolf': return 'spirit_wolf';
      case 'bloom_pixie': return 'bloom_pixie';
      case 'storm_hawk': return 'storm_hawk';
      case 'ancient_treant': return 'ancient_treant';
      case 'moss_colossus': return 'moss_colossus';
      case 'emerald_viper': return 'emerald_viper';
      case 'verdant_wyrm': return 'verdant_wyrm';
      default: return 'spirit_wolf';
    }
  } else {
    // Mob determination
    if (maxHp && maxHp >= 1500) return 'mob_boss';
    if (role === 'ranged') return 'mob_spider';
    if (role === 'tank') return 'mob_fiend';
    if (cardOrMobId.includes('hound') || role === 'dps') return 'mob_hound';
    return 'mob_crawler';
  }
}
