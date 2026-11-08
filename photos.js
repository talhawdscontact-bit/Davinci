/* DaVinci Flora & Living: photo slots (Version 1.2).
   Every image on the site has a slot here. A slot shows a labelled illustration until its photo files exist
   in img/ and its name is listed in `ready`.
   Files per slot: img/<slot>-<width>.webp (heroes: 800, 1600, 2400; others: 600, 1200).
   Heroes also have a mobile crop: img/<slot>-m-600.webp and img/<slot>-m-1200.webp.
   fx = focal point on desktop, fxm = focal point on phones (CSS object-position). */
window.DV_PHOTOS = {
  ready: {},
  slots: {
    'home-hero': { hero: 1, fx: '62% 55%', fxm: '60% 60%', alt: 'A Mediterranean courtyard with a mature olive tree in a terracotta pot against limewashed stone walls' },
    'flora-hero': { hero: 1, fx: '65% 55%', fxm: '58% 60%', alt: 'Olive and lemon trees in terracotta pots on a sunlit terrace' },
    'living-hero': { hero: 1, fx: '35% 50%', fxm: '40% 50%', alt: 'A lime-plastered interior with arches and a stone floor in raking daylight' },
    'workshops-hero': { hero: 1, fx: '68% 50%', fxm: '60% 50%', alt: 'Hands at a workshop table with plaster samples, colour swatches and olive cuttings' },

    'home-door-flora': { fx: '50% 40%', alt: 'Silver olive leaves against a warm stone wall' },
    'home-door-living': { fx: '50% 45%', alt: 'A plastered arch and niche in soft daylight' },
    'home-bridge': { fx: '50% 50%', alt: 'Colour swatches, plaster samples and cuttings on a workshop table' },
    'home-flora-feature': { fx: '50% 45%', alt: 'A lemon tree with ripe fruit in a terracotta pot' },
    'home-living-feature': { fx: '50% 50%', alt: 'Plaster samples, tiles and paint swatches laid out together' },
    'home-flora-detail': { alt: 'Olive leaves and fruit, close up' },
    'home-living-detail': { alt: 'A lime plaster sample, close up' },
    'home-nextstep': { fx: '50% 50%', alt: 'A styled corner with an olive tree and plastered wall' },
    'flora-care': { alt: 'Pruning an olive tree in winter light' },

    'projects-hero': { hero: 1, fx: '50% 55%', fxm: '50% 60%', alt: 'A stone loggia opening onto a garden of olive trees' },
    'projects-cta': { fx: '50% 45%', alt: 'An olive tree in a courtyard in late light' },
    'project-p1-b': { alt: 'Lime plaster wall, detail' }, 'project-p2-b': { alt: 'Aged terracotta pots, detail' },
    'project-p3-b': { alt: 'Microcement surface, detail' },

    'showroom-hero': { hero: 1, fx: '45% 50%', fxm: '35% 55%', alt: 'Inside the DaVinci showroom: material samples, a long table and olive trees', label: 'Illustration · showroom photo to come' },
    'showroom-flora': { alt: 'Olive and citrus trees in the showroom', label: 'Illustration · showroom photo to come' },
    'showroom-living': { alt: 'The material wall with plaster and tile samples', label: 'Illustration · showroom photo to come' },
    'showroom-table': { alt: 'The workshop table in the showroom', label: 'Illustration · showroom photo to come' },
    'advice-plants': { alt: 'Choosing an olive tree' }, 'advice-materials': { alt: 'Tile and plaster samples' },
    'advice-colour': { alt: 'Paint colour swatches' }, 'advice-finishes': { alt: 'A decorative lime plaster finish' },
    'advice-projects': { alt: 'A finished interior with a plant' },

    'cat-flora-olive': { alt: 'Olive trees' }, 'cat-flora-citrus': { alt: 'Citrus and fruit trees' },
    'cat-flora-mediterranean': { alt: 'Mediterranean plants' }, 'cat-flora-pots': { alt: 'Terracotta pots and planters' },
    'cat-flora-combos': { alt: 'Plants paired with pots' },
    'cat-living-paint': { alt: 'Mineral paint colours' }, 'cat-living-finishes': { alt: 'Decorative plaster wall finishes' },
    'cat-living-tiles': { alt: 'Tiles and microcement' }, 'cat-living-tools': { alt: 'Trowels and application tools' },
    'cat-living-other': { alt: 'Interior objects in stone' },

    'project-p1': { fx: '50% 50%', alt: 'A lime-washed living room with a terracotta floor and an olive tree by the window' },
    'project-p2': { fx: '50% 50%', alt: 'A courtyard with three olive trees in aged terracotta' },
    'project-p3': { fx: '50% 50%', alt: 'A seamless microcement bathroom with a travertine shelf' },
    'project-p4': { fx: '50% 50%', alt: 'A garden room with lemon trees against a warm mineral wall' },

    'workshop-w-olive': { alt: 'Pruning an olive tree in a workshop' },
    'workshop-w-plaster': { alt: 'Trowelling lime plaster onto a sample board' },
    'workshop-w-colour': { alt: 'Comparing paint colour samples in daylight' },
    'workshop-w-styling': { alt: 'Styling a room with plants and pots' },
    'workshop-w-micro': { alt: 'Applying microcement with a steel trowel' },
    'workshop-w-terrace': { alt: 'Planting a terrace with Mediterranean plants' }
  }
};
