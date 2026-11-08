# DaVinci Flora & Living: website prototype

A static site (HTML, CSS and JavaScript). No build step, no server.

## Folders
- index.html: the page shell
- css/site.css: all styles (design tokens at the top)
- js/data.js: example products, workshops, projects
- js/photos.js: every image slot, its focal points, and the `ready` list
- js/art.js: the placeholder illustrations
- js/app.js: pages, basket, forms, animations
- tools/prepare_photos.py: turns your photos into the site's image files (not deployed)

## Adding photos
1. Name each photo by its slot, for example `projects-hero.jpg`, and put them in one folder.
2. Run: `python3 tools/prepare_photos.py <photo folder> .` (needs Pillow: `pip install pillow`)
3. This creates `img/` and switches those slots on in `js/photos.js`. Deploy again.

## Search engines
`vercel.json` tells search engines not to index the site while it is a prototype
(example products and prices). Delete the X-Robots-Tag block before launch.
