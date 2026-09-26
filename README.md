# Frontend Mentor - Frontend quiz app solution

This project is a solution to the [Frontend quiz app challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/frontend-quiz-app-BE7xkzXQnU). It includes subject selection, question, and results pages with responsive layouts and light and dark themes.

This README focuses on the project's HTML and CSS structure.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [Source structure](#source-structure)
  - [What I learned](#what-i-learned)
  - [Review findings and improvements](#review-findings-and-improvements)
  - [Continued development](#continued-development)
  - [Useful project references](#useful-project-references)
  - [AI collaboration](#ai-collaboration)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## Overview

### The challenge

The interface supports the following quiz flow:

- Choose HTML, CSS, JavaScript, or Accessibility as a subject.
- Select one of four answers using native radio inputs.
- Receive validation feedback when submitting without an answer.
- See correct and incorrect answer states before continuing.
- Track question progress and view the final score.
- Return to subject selection to play again.
- Use layouts that adapt to mobile, tablet, and desktop widths.
- Identify keyboard focus on answer cards, subject links, and the theme switch.
- View the interface in light or dark mode.

### Links

- Solution URL: [Repository](https://github.com/jonghwascript/frontend-quiz-app.git)

- Live Site URL: [Live site](https://jonghwascript.github.io/frontend-quiz-app/)

## My process

### Built with

The markup and styling use:

- Semantic HTML landmarks and native form controls
- Reusable HTML partials with page-specific titles
- Sass modules, shared design tokens, and breakpoint mixins
- CSS custom properties for themes and component configuration
- Flexbox composition with reusable Stack, Cluster, Center, and Switcher layouts
- Fluid spacing and sizing with `clamp()`
- Logical properties such as `inline-size` and `padding-inline`
- State selectors including `:checked`, `:disabled`, `:focus-visible`, and `:has()`
- CSS style container queries for theme-specific component styles
- Locally hosted Rubik variable fonts with `font-display: swap`

### Source structure

| Location | Responsibility |
| --- | --- |
| `src/pages/` | Source markup for the subject, question, and results pages |
| `src/partials/head.html` | Shared metadata, stylesheet reference, favicon, and title placeholder |
| `src/partials/header.html` | Current subject and theme controls |
| `src/partials/footer.html` | Shared attribution |
| `src/scss/style.scss` | Sass entry point, theme tokens, and page styles |
| `src/scss/_layout.scss` | Reusable layout primitives |
| `src/scss/_quiz-options.scss` | Subject links and answer card states |
| `src/scss/_utilities.scss` | Visually hidden text, theme switch, progress bar, and hidden-state rules |
| `src/scss/_variables.scss` | Shared colors, typography presets, and breakpoints |
| `src/js/` | Browser scripts copied into the production build |
| `src/images/`, `src/fonts/`, `src/data.json` | Static assets copied into the production build |
| `dist/` | Generated, ignored production site deployed by GitHub Actions |
| `.github/workflows/deploy-pages.yml` | Build and deployment workflow for GitHub Pages |

Edit the source templates, Sass, scripts, and static assets rather than files in `dist/`. Run `npm run build` to recreate the production site. The build expands HTML includes, compiles Sass, and copies the runtime files into `dist/`. Partials reduce duplication in the source; their markup is still included in each generated page.

GitHub Pages is deployed through GitHub Actions whenever `main` is updated. The workflow installs the locked dependencies, builds the site, and publishes only `dist/`. In the repository Pages settings, the publishing source must be set to **GitHub Actions**.

### What I learned

The most useful lessons came from translating the design into reusable markup and styles: deciding which native elements to preserve, separating layout rules from component appearance, and making selection, focus, loading, and theme states explicit. The examples below describe those decisions. Some snippets are shortened to focus on a single technique.

#### Share page structure while keeping page-specific content explicit

The three pages originally repeated their head, header, and footer markup. Moving these into partials gives each shared element one source of truth. Page titles and the current-subject placeholder remain configurable:

```html
@@include('../partials/head.html', {
  "title": "Question | Frontend quiz app"
})

@@include('../partials/header.html', {
  "showTopic": true,
  "topicName": "",
  "topicKey": ""
})
```

The head partial uses `<title>@@title</title>`. These directives are expanded during the build; they are not browser-native HTML. A nested include is resolved relative to its source template, while an image or stylesheet URL in the generated page must work relative to that output page. Keeping those two path rules separate avoids broken resources when moving markup into partials.

#### Choose elements by their purpose

Subject cards are links because they navigate to another page. Submitting an answer is a button inside a form, and theme controls use `type="button"` because they do not submit that form. Their visual similarity does not make their semantics interchangeable.

| Element | Use in this project |
| --- | --- |
| `header`, `main`, `footer` | Identify the major page regions |
| `h1` | Name the current page or question |
| `fieldset` and `legend` | Group and describe the answer choices |
| `progress` | Represent the current question position |
| `output` | Present the calculated score |

In particular, `output` is appropriate for the score; it is not a dedicated error-message element. Input errors have their own text and announcement region.

#### Keep native controls inside custom answer cards

A styled label can provide a large clickable surface while the radio input preserves native single-choice behavior. The surrounding `fieldset` and `legend` describe the answer group.

```html
<fieldset class="answer-options stack">
  <legend class="sr-only">Select the correct answer.</legend>
  <label class="answer-option" data-text="A">
    <input
      type="radio"
      class="answer-option__input sr-only"
      name="answer"
      value="A"
    />
    <span class="answer-option__text">An answer option</span>
  </label>
</fieldset>
```

The input stays focusable even though it is visually hidden. A parent selector makes that focus visible on the card:

```css
.answer-option:has(input:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 4px;
}
```

Selection and keyboard focus are separate states. A card can be selected without being focused, so the focus outline should remain distinguishable from its selected border. The selected style also excludes disabled inputs:

```css
.answer-option:has(input[name='answer']:checked:not(:disabled)) {
  border-color: #a729f5;
}
```

This prevents the purple selection rule from competing with the green or red result styles after grading. A transparent border on the default card reserves the same border space before selection, avoiding a size change when the border becomes visible.

#### Compose layouts and scale spacing gradually

Shared layout classes handle alignment and flow, while page styles supply the spacing. Stack controls vertical rhythm, Cluster aligns wrapping rows, Center constrains the content width, and Switcher changes the main content arrangement according to available space.

The core Switcher calculation is:

```css
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter, 1rem);
}

.switcher > * {
  flex-grow: 1;
  flex-basis: calc((var(--threshold, 48rem) - 100%) * 999);
}
```

When the container is narrower than the threshold, the large positive basis encourages each child onto its own line. Above the threshold, the calculated basis is clamped to zero and the items can share the available space through `flex-grow`. The percentage refers to the container width, not the viewport. Content minimum sizes, padding, and gaps still affect wrapping, so the threshold is not a guarantee of a particular viewport breakpoint.

The main content gap grows within defined limits:

```css
#main {
  gap: clamp(2.5rem, calc(-0.137rem + 11.253vw), 8rem);
}
```

This keeps spacing fluid between viewport sizes without requiring a separate rule for every intermediate width. `clamp()` sets a minimum, a preferred value, and a maximum.

However, not every design value changes in one direction. The topic-list gap is `1rem` on mobile, `1.5rem` on tablet, and `1rem` again on desktop. A single linear viewport-based `clamp()` does not express that increase followed by a decrease. The project uses a bounded Sass media-query mixin for that case:

```scss
.topic-list {
  gap: 1rem;

  @include mq('tablet', 'desktop') {
    gap: 1.5rem;
  }
}
```

The mixin reads named breakpoints from a shared map and emits CSS media rules. It is included with `@include`; it is not a function that returns a property value.

#### Account for padding, flexible children, and decorative elements

The reset uses `box-sizing: border-box`, so declared widths include padding and borders. The main wrapper combines a maximum inline size with responsive `padding-inline`, keeping page gutters separate from the gap between columns.

Inside an answer card, `flex-shrink: 0` protects the letter badge and result icon from collapsing when the answer is long. The result icon uses `margin-inline-start: auto` to move to the end of the row without inserting an empty spacer element.

Logical properties such as `inline-size`, `padding-inline`, and `margin-block-start` describe dimensions and spacing relative to the writing direction. They make the intent of these layout rules clearer than a mixture of unrelated physical offsets.

#### Separate Sass tokens from CSS theme values

Sass variables define build-time tokens, while CSS custom properties remain available in the generated stylesheet and inherit through the document. The project connects them through interpolation:

```scss
html {
  --theme: light;
  --color-bg: #{$Grey-50};
  --color-text: #{$Blue-900};
  --color-focus: #{$Blue-500};

  &[data-theme='dark'] {
    --theme: dark;
    --color-bg: #{$Blue-900};
    --color-text: #{$White};
    --color-focus: #{$White};
  }
}

body {
  color: var(--color-text);
  background-color: var(--color-bg);
}
```

For some component styles, a style container query tests the inherited theme value on an eligible ancestor:

```css
@container style(--theme: dark) {
  .answer-option {
    background-color: #3b4d66;
    color: #fff;
  }
}
```

This is a style query, not a container-width query. Keeping global colors in custom properties and component details close to their selectors makes the theme rules easier to follow. The use of style queries also creates a browser-support consideration that should be checked against the intended audience.

#### Understand typography shorthand and font loading

The Sass typography presets combine style, weight, fluid size, line height, and font family. A simplified declaration follows this order:

```css
.quiz-counter {
  font: italic 400 1rem/1.5 'Rubik', sans-serif;
}
```

The size and family are required in this form, and the line height follows the size after `/`. Omitted shorthand components reset to their initial values. For example, using `font: 1rem sans-serif` after setting a bold weight also resets that weight. When changing only the size, `font-size` avoids that unintended reset.

The local variable font declares its supported weight range explicitly:

```css
@font-face {
  font-family: 'Rubik';
  src: url('../fonts/Rubik-VariableFont_wght.ttf') format('truetype-variations');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}
```

The italic face is registered separately. Font URLs are resolved from the generated CSS file, which is why the path starts with `../fonts/`. `font-display: swap` allows fallback text while the font loads, but differences in font metrics can still cause movement when the final face appears.

#### Keep decorative icons separate from accessible names

Subject cards contain visible text, so their background icons can remain decorative. The header marks its subject icon with `aria-hidden="true"`, while icon-only theme buttons receive explicit `aria-label` values.

```html
<button type="button" class="light-button"
        aria-label="Switch to light mode" aria-pressed="true">
  <!-- Inline sun SVG -->
</button>
```

An icon's appearance alone does not provide a dependable accessible name. CSS background images and generated content are best used for decoration when the meaningful label already exists in HTML.

The subject icon box uses `aspect-ratio: 1`, and its pseudo-element fills that box with `inset: 0`. A proportional `background-size` keeps the illustration scaled within the tile. Inline theme SVGs can have their paths styled directly; an SVG loaded as a CSS background does not expose its internal paths to the page's selectors.

#### Translate design layers into CSS backgrounds

The lighter hover treatment for Submit Answer, Next Question, and Play Again uses a translucent white layer over their solid purple backgrounds:

```css
.quiz-form .quiz-submit,
.question-result .again-button {
  background-color: #a729f5;
}

@media (hover: hover) and (pointer: fine) {
  .quiz-form .quiz-submit:hover:not(:disabled),
  .question-result .again-button:hover:not(:disabled) {
    background-image: linear-gradient(#ffffff80, #ffffff80);
  }
}
```

The background image is painted above the background color. This recreates the layered surface without reducing the opacity of the button's text and all of its descendants. The overlay appears only while an enabled button is hovered with a hover-capable, precise primary pointer.

For responsive page backgrounds, the project changes the image variable at explicit breakpoints. The mobile, tablet, and desktop patterns have distinct compositions, so viewport breakpoints remain appropriate even though the Switcher layout responds intrinsically to available space.

#### Treat hidden content as an explicit state

Loading panels and content panels use the HTML `hidden` attribute. Since layout classes also declare `display`, the stylesheet explicitly preserves the hidden state:

```css
[hidden] {
  display: none !important;
}
```

This serves a different purpose from `.sr-only`, which keeps content available to assistive technology.

Error text uses a separate alert region, while grading feedback uses a status region:

```html
<p id="quiz-error-announcement" class="sr-only"
   role="alert" aria-atomic="true"></p>
<p class="quiz-feedback sr-only" role="status"></p>
```

`aria-describedby` associates an input with its error explanation, and `aria-invalid` identifies an invalid state. These declarations describe relationships and announcement behavior; their presence alone does not verify the complete screen-reader experience. The visible error block also uses `visibility: hidden` while inactive, reserving its layout space. That differs from the loading panels' `hidden` state, which removes their layout boxes.

#### Style native progress and switch controls

The progress bar represents the current question position rather than the number of submitted answers:

```html
<progress class="quiz-progress" max="10" value="3"
          aria-label="Current question">3 of 10</progress>
```

Its CSS uses `appearance: none` and separate engine-specific pseudo-elements: `::-webkit-progress-bar` for the track, `::-webkit-progress-value` for its filled portion, and `::-moz-progress-bar` for the Firefox fill. Keeping the native element preserves the value and maximum in the markup while allowing a custom surface.

The theme switch similarly keeps a checkbox inside its label. The checked input styles the adjacent track, and `:focus-visible` draws an outline on that visible track. Its thumb travel is calculated from the switch width and height instead of a fixed translation. A `prefers-reduced-motion: reduce` rule removes the track and thumb transitions for that preference.

#### Style the selected theme control through its state

The active theme button uses `aria-pressed="true"`. Its cursor returns to the default arrow, and the nested SVG inherits the button's cursor. This keeps the icon and button consistent without duplicating separate rules for each icon.

```css
.theme-control .light-button[aria-pressed='true'],
.theme-control .dark-button[aria-pressed='true'] {
  cursor: default;
}

.theme-control button svg {
  cursor: inherit;
}
```

Changing the cursor is a visual cue; it does not disable the button. Selection state, keyboard focus, and whether a control can be activated must be considered separately.

### Review findings and improvements

#### Make footer links and focus rings follow the theme

The attribution links used the same fixed blue in both themes, making them difficult to read against the dark background. They now use `color: inherit` to follow the page text color while retaining their default underline.

Subject links and answer cards now share `--color-focus`: blue (`#306aff`) in light mode and white (`#ffffff`) in dark mode. The header's toggle configuration sets `--toggle-focus: var(--color-focus)` so the switch uses the same theme-aware color instead of the utility's mint fallback. Both answer-card and subject-link focus rules use `outline: 2px solid var(--color-focus)` and retain their existing outline offset.

#### Restore hover feedback on action buttons

The submit button had a permanent `active` class whose rule removed the white overlay, and no hover rule restored it. The class was an ordinary CSS class, not the `:active` pseudo-class. Removing it, its styling block, and the base overlay lets the hover rule above control the effect directly. Submit Answer and Next Question share the same button; Play Again now receives the same treatment. Disabled buttons are excluded.

#### Share a description across all pages

The shared head partial now includes a meta description summarizing the quiz topics and flow. Building the HTML includes it in the subject, question, and results pages, addressing the missing-description issue from one source file.

The HTML and Sass builds passed, and the generated descriptions, theme tokens, and hover selectors were checked. Browser interaction checks, measured contrast checks, and a Lighthouse rerun remain separate validation steps.

#### Add hover feedback without overriding answer states

Answer cards already had a pointer cursor and keyboard focus styles, but lacked a visual response before a mouse click. Hover now changes an unanswered card's letter badge to a pale purple background with purple text. Subject links receive a purple border.

The answer-card selector excludes checked and disabled inputs as well as the explicit selected, correct, and incorrect classes. This keeps hover feedback from replacing selection or grading feedback. The rules apply within `@media (hover: hover) and (pointer: fine)` to target devices with a hover-capable, precise primary pointer. Existing focus outlines remain available to keyboard users.

#### Match the switch label to the document language

The document declares `lang="en"`, but the visually hidden theme-switch label was written in Korean. The shared header now uses an English accessible label:

```html
<span class="toggle-label sr-only">Dark mode</span>
```

Updating the shared partial and rebuilding applies the correction to all three pages. Visually hidden labels need the same language consistency as visible text.

#### Remove duplicate spacing declarations

The submit-button rule declared the same `padding` twice. Removing the duplicate preserves the computed spacing and leaves one declaration to maintain:

```scss
padding: clamp(1rem, calc(0.046rem + 4.071vw), 2rem);
font: $TextPreset-4-m;
border-radius: clamp(0.75rem, calc(0.034rem + 3.053vw), 1.5rem);
```

#### Fix the invisible progress fill caused by double padding

The progress element had a height of `16px` with `border-box` sizing and `4px` of padding on every side. Its `::-webkit-progress-bar` also had `4px` of padding. Together, the two vertical padding layers consumed the available height, leaving the purple fill with no visible height in Chrome.

The fix keeps padding on the progress element only. The internal track inherits its background color so that it follows both the light and dark themes:

```css
.quiz-progress {
  box-sizing: border-box;
  height: 16px;
  padding: 4px;
}

.quiz-progress::-webkit-progress-bar {
  background-color: inherit;
  border-radius: 104px;
}
```

This leaves `8px` of vertical space for the fill. The existing question-position updates did not need to change. The issue was reproduced in a standalone Chrome test using the generated stylesheet, then the corrected fill was visually checked at 10%, 50%, and 100% in both themes. The Sass build and Git whitespace checks also passed. Firefox and Safari were not tested in this check.

The lesson was to inspect the combined box model of a native control and its internal pseudo-elements when valid progress values do not produce a visible bar.

#### Verify the initial disabled state before changing it

A review also questioned the submit button's initial `disabled` attribute. Checking its initialization flow confirmed that the button becomes enabled when a question is rendered, both after loading data and after restoring progress. The initial attribute was retained because it prevents submission before initialization. Once ready, an unanswered submission can still trigger the existing missing-answer feedback.

The lesson was to distinguish initial HTML state from the state presented after initialization, rather than removing a protective attribute based on the template alone.

The HTML and Sass builds completed successfully, and the generated markup and CSS were inspected. These checks do not replace browser-based hover, keyboard, and screen-reader testing.

### Continued development

- Check keyboard focus visibility and color contrast across both themes.
- Test long answer text, zoomed text, and narrow viewport layouts.
- Review fallbacks for browsers that do not support the style container queries used by the components.
- Compare progress bar rendering across browser engines.
- Review font delivery and measure layout shifts before making further styling optimizations.

### Useful project references

- [Layout primitives](./src/scss/_layout.scss): reusable patterns for spacing, alignment, and wrapping.
- [Answer card styles](./src/scss/_quiz-options.scss): selected, focused, correct, and incorrect states.
- [Shared utilities](./src/scss/_utilities.scss): native-control styling and visibility helpers.

### AI collaboration

I used Codex to help extract shared HTML partials, review theme-button cursor states, and document the markup and styling patterns. Small, specific requests made the changes easier to review. Generated examples and documentation were checked against the source files; browser-based visual and accessibility checks remain a separate step.

## Author

- Frontend Mentor - [@jonghwascript](https://www.frontendmentor.io/profile/jonghwascript)
- GitHub - [@jonghwascript](https://github.com/jonghwascript)

## Acknowledgments

Thanks to Frontend Mentor for the challenge and design assets. The layout utilities in this project also acknowledge the Every Layout patterns in their source comments.
