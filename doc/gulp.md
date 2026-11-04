# Gulp 설치 및 실행 절차

## 1. 필요한 패키지 설치

```bash
npm install --save-dev gulp gulp-sass sass gulp-sourcemaps gulp-clean-css
```

- `gulp`: 태스크 러너 본체
- `gulp-sass` + `sass`: SCSS → CSS 변환 (Dart Sass 사용)
- `gulp-sourcemaps`: 소스맵 생성
- `gulp-clean-css`: CSS 압축(minify)

> `gulpfile.js`에서 `require`하는 패키지는 반드시 `package.json`의
> `devDependencies`에도 등록되어 있어야 한다. 코드에서만 쓰고 설치를
> 빠뜨리면 실행 시 `Cannot find module '패키지명'` 에러가 발생한다.

## 2. gulpfile.js 작성

```js
const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const cleanCSS = require("gulp-clean-css");

// SCSS → CSS 변환
function scssTask() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("css"));
}

// SCSS 변경 감시
function watchTask() {
  gulp.watch("src/scss/**/*.scss", scssTask);
}

exports.default = gulp.series(scssTask, watchTask);
```

## 3. 실행

```bash
npx gulp
```

- `scssTask` 실행 후 `watchTask`가 시작되어 `src/scss/**/*.scss` 변경을 감시한다.
- 종료하려면 터미널에서 `Ctrl + C`.
- 정상 동작 시 `css/style.css`, `css/style.css.map`이 생성/갱신된다.

## 4. 겪었던 에러 & 원인

```
Error: Cannot find module 'gulp-clean-css'
```

- **원인**: gulpfile.js에서 `gulp-clean-css`를 사용하지만 `package.json`에
  devDependency로 등록되어 있지 않아 `node_modules`에 설치되지 않은 상태였음.
- **해결**: `npm install --save-dev gulp-clean-css` 실행 후 재시도하면 정상 동작.

## 5. 체크리스트 (다음에 비슷한 에러 만나면)

1. 에러 메시지의 `Cannot find module '...'` 패키지명을 확인한다.
2. `package.json`의 `devDependencies`에 있는지 확인한다.
3. 없으면 `npm install --save-dev <패키지명>`으로 설치한다.
4. `npx gulp`로 재실행해 정상 동작(콘솔 로그 + `css/` 폴더 산출물)을 확인한다.

## 6. Gulp + Prettier 연동

```bash
npm install --save-dev gulp-prettier prettier
```

> `gulp-prettier`(v6 이상)는 ESM 전용 패키지라서 `gulpfile.js`(CommonJS)에서
> `require("gulp-prettier")`로 바로 불러오면 에러가 난다. 태스크 함수를
> `async`로 만들고 동적 `import()`로 불러와야 한다.

```js
const PRETTIER_GLOBS = ["src/scss/**/*.scss", "*.html", "gulpfile.js"];

async function prettierTask() {
  const { default: prettier } = await import("gulp-prettier");
  return gulp
    .src(PRETTIER_GLOBS, { base: "." })
    .pipe(prettier())
    .on("error", function (err) {
      console.error("[prettier]", err.message);
      this.emit("end"); // 포맷 오류가 있어도 watch가 죽지 않도록
    })
    .pipe(gulp.dest(".")); // 원본 위치에 덮어쓰기
}

exports.prettier = prettierTask;
exports.default = gulp.series(prettierTask, scssTask, watchTask);
```

- 프로젝트 루트에 `.prettierrc.json`을 두어 규칙을 고정한다 (예: `{ "singleQuote": true }`).
- `package.json`에 `"format": "gulp prettier"` 스크립트를 추가해 `npm run format`으로 실행 가능하게 한다.
- `gulp.dest(".")`로 원본 파일에 덮어쓰기 때문에, 실행 전 반드시 변경사항을 커밋해두고 결과를 diff로 확인하는 습관이 필요하다.

### 겪었던 에러: 잘못된 HTML로 인한 크래시

```
PluginError [SyntaxError]: Unexpected closing tag "p"...
```

- **원인**: `index.html`에 짝이 맞지 않는 `</p>` 태그가 있었음(마크업 오류).
  Prettier의 HTML 파서는 엄격해서 깨진 마크업을 만나면 예외를 던지고,
  `.on("error", ...)` 핸들러가 없으면 `gulp.series`로 묶인 `scssTask`,
  `watchTask`까지 전부 중단된다.
- **해결**: 1) `index.html`의 마크업 오류를 수정, 2) `prettierTask`에
  `.on("error", ...)` 핸들러를 추가해 이후에 또 깨진 파일이 들어와도
  watch 프로세스 전체가 죽지 않도록 방어.
