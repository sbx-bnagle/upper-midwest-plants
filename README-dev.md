# Plant Picker — development

## Structure
```
data/                 plants.json (enriched, incl. Flower Shape) + tkeys.json
src/
  index.html          shell; @@include pulls in components
  components/         one markup file per component
  scss/
    _tokens.scss      DESIGN TOKENS as CSS custom properties (single source;
                      private Sass vars inside derive alpha variants only)
    _base.scss        resets, page shell, footer, floating buttons
    _controls.scss    sticky search/filter bar
    _query-pane.scss  filter overlay (pills, month selectors, sliders)
    _plant-list.scss  main plant listing (CSS-grid <ul>)
    _detail.scss      row detail + inline edit mode
    _inventory.scss   dark slide-out inventory pane
    main.scss         import order (tokens first)
  js/                 sitewide, concatenated in filename order 01→07
dist/                 build output
```

## Commands
- `npm install` once
- `npm run dev` — compiles on every save (Gulp watch); open `dist/index.html`.
  Output is minified with sourcemaps: the web inspector traces every CSS rule
  to its `src/scss` partial + line, and JS to its `src/js` file.
- `npm run package` — production single-file `dist/index.html` (CSS, JS, data inlined),
  same self-contained artifact as before; safe to copy anywhere or open via file://

## Data pipeline
`data/plants.json` is the build input. Regenerate it from `Plants_v4_master.csv`
upstream as usual; the Flower Shape column was derived genus-level (see
METHODOLOGY). Gulp turns it into `dist/js/data.js` / inlines it on package.

The old `build_html*.py` scripts are retired by this setup.
