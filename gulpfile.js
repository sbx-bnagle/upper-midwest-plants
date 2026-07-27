/* Plant Picker build
   gulp / gulp watch  → dev build: dist/ with linked, minified css + js and
                        sourcemaps back to src/ (inspector shows scss/js lines)
   gulp package       → production: single self-contained dist/index.html      */
const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const fileInclude = require('gulp-file-include');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const { minify: minifyHtml } = require('html-minifier-terser');
const fs = require('fs');

const HTML_MIN_OPTS = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
};

function styles() {
  // sourcemaps:true → dist/css/style.css.map traces every rule to its
  // src/scss partial + line in the web inspector
  return src('src/scss/main.scss', { sourcemaps: true })
    .pipe(sass({ style: 'compressed' }).on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(dest('dist/css', { sourcemaps: '.' }));
}

function scripts() {
  // 01-…07 ordered by filename; uglified, with a map back to src/js
  return src('src/js/*.js', { sourcemaps: true })
    .pipe(concat('app.js'))
    .pipe(terser())
    .pipe(dest('dist/js', { sourcemaps: '.' }));
}

function data(cb) {
  // PLANTS + K + MAINT from /data → dist/js/data.js (compact JSON)
  const plants = JSON.stringify(JSON.parse(fs.readFileSync('data/plants.json', 'utf8')));
  const k = JSON.stringify(JSON.parse(fs.readFileSync('data/tkeys.json', 'utf8')));
  const maint = JSON.stringify(JSON.parse(fs.readFileSync('data/maintenance-rules.json', 'utf8')));
  fs.mkdirSync('dist/js', { recursive: true });
  fs.writeFileSync('dist/js/data.js', `const PLANTS=${plants};const K=${k};const MAINT=${maint};`);
  cb();
}

function html() {
  return src('src/index.html')
    .pipe(fileInclude({ prefix: '@@', basepath: 'src/' }))
    .pipe(dest('dist'));
}

function mapRoots(cb) {
  // point map sources at the real files on disk (relative to each map);
  // sourcesContent is also embedded, so maps work even without the files
  const fix = (file, root) => {
    if (!fs.existsSync(file)) return;
    const m = JSON.parse(fs.readFileSync(file, 'utf8'));
    m.sourceRoot = root;
    fs.writeFileSync(file, JSON.stringify(m));
  };
  fix('dist/css/style.css.map', '../../src/scss/');
  fix('dist/js/app.js.map', '../../src/js/');
  cb();
}

async function linkAssets() {
  // dev: link the compiled files, then minify the page
  let h = fs.readFileSync('dist/index.html', 'utf8');
  h = h.replace('<!-- build:css -->', '<link rel="stylesheet" href="css/style.css">');
  h = h.replace(
    '<!-- build:js -->',
    '<script src="js/data.js"></script>\n<script src="js/app.js"></script>',
  );
  h = await minifyHtml(h, HTML_MIN_OPTS);
  fs.writeFileSync('dist/index.html', h);
}

async function inlineAssets() {
  // production: inline everything; strip sourcemap pointers since the maps
  // are not carried into the single-file artifact
  let h = fs.readFileSync('dist/index.html', 'utf8');
  const css = fs
    .readFileSync('dist/css/style.css', 'utf8')
    .replace(/\/\*# sourceMappingURL=.*?\*\/\s*$/s, '');
  const js = (
    fs.readFileSync('dist/js/data.js', 'utf8') + fs.readFileSync('dist/js/app.js', 'utf8')
  ).replace(/\/\/# sourceMappingURL=\S*\s*$/, '');
  h = h.replace('<!-- build:css -->', `<style>${css}</style>`);
  h = h.replace('<!-- build:js -->', `<script>${js}</script>`);
  h = await minifyHtml(h, HTML_MIN_OPTS);
  fs.writeFileSync('dist/index.html', h);
}

const assets = series(parallel(styles, scripts, data), mapRoots);
const build = series(assets, html, linkAssets);
const pkg = series(assets, html, inlineAssets);

function watcher() {
  watch('src/scss/**/*.scss', styles);
  watch('src/js/*.js', scripts);
  watch('data/*.json', data);
  watch(['src/index.html', 'src/components/*.html'], series(html, linkAssets));
}

exports.build = build;
exports.package = pkg;
exports.watch = series(build, watcher);
exports.default = exports.watch;
