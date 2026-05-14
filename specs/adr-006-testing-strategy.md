# ADR-006: Accessibility Testing Strategy

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Christian Haegele

---

## Context

Standard accessibility testing tools (axe-core, WAVE, Lighthouse) audit the HTML/DOM. DINO's gameplay runs entirely on a `<canvas>` element, which is opaque to all of these tools. The HTML overlay architecture (ADR-003) creates a testable surface for menus and ARIA live regions, but gameplay visuals remain untestable by conventional accessibility scanners.

Additionally, screen readers (NVDA, JAWS, VoiceOver) are OS-level software with no CI-compatible testing interface. There is no reliable way to automatically assert "what the screen reader said." This is a fundamental constraint of the platform, not a tooling gap.

The testing strategy must therefore be layered: cheap automated checks for what can be checked, AI-assisted review for semantic quality that rules cannot catch, and structured real-user testing for what automation cannot reach.

## Decision

Four testing tiers are adopted, each targeting a different class of failure:

1. **Unit tests** — color contrast ratios in source code
2. **Playwright E2E** — axe-core audits, ARIA snapshots, keyboard navigation flows
3. **AI accessibility reviewer** — Claude API in CI, semantic quality review per PR
4. **Structured community testing** — real users, structured protocol, GitHub Issue template

No single tier is sufficient alone. All four run together.

---

## Tier 1 — Contrast Ratio Unit Tests

**Tool:** Bun test (already in the project)  
**Cost:** Free  
**When it runs:** Every commit, pre-build  
**What it catches:** WCAG contrast failures in `constants.ts` color tokens

Every color pair that appears together in the game (text on background, UI element on surface) is tested programmatically using the WCAG relative luminance formula. Tests assert minimum ratios:

- WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI components
- WCAG AAA: 7:1 for normal text (target for text-heavy UI like the shop)

Example structure:

```typescript
// src/__tests__/contrast.test.ts
import { COLORS } from "../constants";

const relativeLuminance = (hex: string): number => { /* WCAG formula */ };
const contrastRatio = (a: string, b: string): number => {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

describe("WCAG contrast ratios", () => {
  test("textMain on bg0 meets AAA (7:1)", () => {
    expect(contrastRatio(COLORS.textMain, COLORS.bg0)).toBeGreaterThanOrEqual(7);
  });
  test("textDim on bg0 meets AA (4.5:1)", () => {
    expect(contrastRatio(COLORS.textDim, COLORS.bg0)).toBeGreaterThanOrEqual(4.5);
  });
  test("hpColor on bg0 meets AA (4.5:1)", () => {
    expect(contrastRatio(COLORS.hpColor, COLORS.bg0)).toBeGreaterThanOrEqual(4.5);
  });
  // ... all color pairs
});
```

**Known current failures** (document them as failing tests until fixed, do not skip):
- `textDim` (`#666688`) on `bg0` (`#030308`): ~3.7:1 — fails AA
- `hpColor` (`#cc2200`) on `bg0` (`#030308`): ~4.2:1 — fails AA

These tests fail today by design. Failing tests that document real problems are more valuable than passing tests that hide them.

---

## Tier 2 — Playwright E2E Tests

**Tool:** Playwright + `@axe-core/playwright`  
**Cost:** Free (open source, runs in GitHub Actions)  
**When it runs:** Every PR  
**What it catches:** ARIA violations in HTML overlays, focus order bugs, keyboard navigation failures, zoom layout breaks, ARIA tree regressions

### 2a — axe-core Audit Per Game State

For each HTML overlay (menu, shop, pause, game over), Playwright navigates to that state and runs an axe audit:

```typescript
// e2e/accessibility.spec.ts
import AxeBuilder from "@axe-core/playwright";

for (const state of ["menu", "shop", "pause", "gameover"]) {
  test(`${state} overlay has no axe violations`, async ({ page }) => {
    await page.goto("http://localhost:3000");
    await navigateToState(page, state);
    const results = await new AxeBuilder({ page })
      .include(`#overlay-${state}`)
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

axe catches: missing accessible names, invalid ARIA role combinations, broken label associations, contrast failures in HTML elements, missing landmark regions.

**Explicit limitation:** axe cannot see canvas content. This is documented in the test suite with a comment so future contributors understand the gap rather than assuming full coverage.

### 2b — ARIA Snapshot Regression Tests

Once a game state's accessibility tree is validated by a real screen reader user and confirmed correct, it is snapshotted. Any subsequent change that silently alters the tree — a renamed label, a removed role, a reordered item — fails the snapshot test immediately, before code review.

```typescript
test("shop accessibility tree is stable", async ({ page }) => {
  await navigateToState(page, "shop");
  await expect(page.locator("#overlay-shop")).toMatchAriaSnapshot(`
    - dialog "The Merchant":
      - heading "The Merchant" [level=2]
      - text: /Treasures: \\d+/
      - listbox "Shop items":
        - option /Shield.+Cost: 5/
        - option /Fire\\+.+Cost: 8/
        - option /Speed\\+.+Cost: 6/
        - option /Double Jump.+Cost: 10/
        - option /Extra Heart.+Cost: 12/
        - option /Revive Companion.+Cost: 7/
      - text: /Navigate|Buy|Leave/
  `);
});
```

Snapshots are committed to the repository and updated deliberately (with a PR comment explaining the change) — never auto-updated by CI.

### 2c — Keyboard Navigation Flow Tests

Tests that verify the complete keyboard journey through each interactive state:

```typescript
test("shop is fully navigable by keyboard", async ({ page }) => {
  await navigateToState(page, "shop");
  // First item receives focus on open
  await expect(page.locator("#shop-list [role=option]").first()).toBeFocused();
  // Arrow keys navigate
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#shop-list [role=option]").nth(1)).toBeFocused();
  // Escape closes and returns focus to game wrapper
  await page.keyboard.press("Escape");
  await expect(page.locator("#game-wrapper")).toBeFocused();
});

test("focus does not escape active shop dialog", async ({ page }) => {
  await navigateToState(page, "shop");
  const itemCount = await page.locator("#shop-list [role=option]").count();
  for (let i = 0; i < itemCount + 4; i++) {
    await page.keyboard.press("Tab");
    const escapedFocus = await page.evaluate(
      () => !document.activeElement?.closest("#overlay-shop")
    );
    expect(escapedFocus).toBe(false);
  }
});
```

### 2d — Zoom Layout Test

Simulates a 200% zoom user and asserts no horizontal scrollbar appears:

```typescript
test("game is usable at 200% zoom (no horizontal scroll)", async ({ browser }) => {
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto("http://localhost:3000");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
```

---

## Tier 3 — AI Accessibility Reviewer in CI

**Tool:** Claude API (claude-haiku-4-5 for cost efficiency) + GitHub Actions  
**Cost:** ~$0.005 per PR (5 game states × screenshot + ARIA tree analysis)  
**When it runs:** Every PR targeting `main`  
**What it catches:** Semantic quality issues axe-core cannot detect by rule

### The Problem axe Cannot Solve

axe validates structure. It cannot reason about whether a structurally valid accessibility tree actually communicates useful information to a visually impaired user. Examples of things axe passes that still fail users:

- A shop item whose accessible name is `"option-2"` — valid ARIA, communicates nothing
- An ARIA live region announcement that says `"Event: 3"` — valid, meaningless
- A dialog that opens with focus on a decorative heading instead of the first interactive element — not an axe rule violation, but breaks keyboard users

### Architecture

```
PR opened / pushed
  → GitHub Action: playwright takes screenshot + ARIA tree per game state
  → Node script: sends screenshot + tree to Claude API with structured prompt
  → Claude returns: JSON array of issues with severity (warning / info)
  → Action posts formatted review as PR comment
  → Review is advisory — does NOT block merge
```

### The Prompt

The prompt is the most important part. It is stored as a file in the repo (`scripts/ai-review-prompt.md`) so it can be reviewed and improved like any other code:

```
You are an accessibility expert reviewing a browser game called DINO.

Target user: A person with low vision who uses browser zoom at 200–300%
and may also use a screen reader (NVDA, VoiceOver, JAWS) as a supplement.
They can see the screen but need high contrast, large text, and screen
reader support for menus and game events.

You are given:
1. A screenshot of the game in state: {{STATE}}
2. The Playwright accessibility tree for that state

Your task:
A) Compare what is VISIBLE in the screenshot to what EXISTS in the
   accessibility tree. List anything a sighted user can see that a
   screen reader user cannot access.
B) Evaluate the quality of accessible names and descriptions — not just
   whether they exist (axe checks that), but whether they are useful and
   contextually meaningful.
C) Identify any focus order or dialog management issues that structural
   rules would not catch.
D) Note whether the game's "thriller" atmosphere is preserved in
   accessible text, or if the accessible layer is neutral/clinical in a
   way that feels disconnected from the game.

Return a JSON array: [{ severity: "warning"|"info", location: string,
issue: string, suggestion: string }]
Severity "warning" = a real user would be confused or blocked.
Severity "info" = suboptimal but navigable.
```

### Output

The PR comment renders as a structured table:

```
🤖 AI Accessibility Review — 2 warnings, 1 info

| Severity | Location | Issue | Suggestion |
|----------|----------|-------|------------|
| ⚠️ warning | Shop overlay | Item cost is visible in screenshot but not in accessible name | Add cost to aria-label: "Shield — Block one hit — Cost: 5 gems" |
| ℹ️ info | Game Over overlay | "Press Space to restart" visible on canvas, not in HTML overlay | Add equivalent text to #overlay-gameover |
```

### Why Not Block Merges

AI output has false positive rates. Blocking a merge on an AI hallucination is worse than missing a real issue. The review is advisory — it surfaces issues for the human reviewer, who decides. Over time, patterns in the AI feedback should inform new axe rules or snapshot test cases, converting advisory warnings into hard assertions.

---

## Tier 4 — Structured Community Testing

**Tool:** GitHub Issue template + `TESTING.md`  
**Cost:** Free  
**When it runs:** On major releases and as ongoing community contribution  
**What it catches:** Everything automated testing cannot — real user experience, edge cases in specific AT combinations, usability issues that pass all technical checks

### Testing Protocol (`TESTING.md`)

A document in the repo root giving visually impaired players a 15-minute structured test they can run with their normal tools:

```markdown
1. Open the game at [URL]
2. Without touching the mouse, try to start a game
3. Try to navigate the shop using only your keyboard
4. During play, try to understand your current HP and depth without looking closely
5. Die or complete a level and try to restart

For each step: did it work? What went wrong? What was confusing?
```

### GitHub Issue Template

`.github/ISSUE_TEMPLATE/accessibility-feedback.yml`:

```yaml
name: Accessibility Feedback
labels: ["accessibility"]
body:
  - id: tools
    label: "What assistive tools do you use?"
    placeholder: "e.g. NVDA 2024.1 + Firefox 124 + Windows 11 + 200% zoom"
  - id: what-broke
    label: "What broke or felt wrong?"
  - id: what-worked
    label: "What worked better than you expected?"
  - id: suggestion
    label: "One thing that would make this genuinely enjoyable for you"
```

---

## What This Strategy Explicitly Does Not Cover

- **Real screen reader output:** No test asserts what NVDA, JAWS, or VoiceOver actually speaks. This is a known gap and cannot be bridged in CI without proprietary testing infrastructure.
- **Canvas gameplay accessibility:** The canvas renders real-time physics and entity positions. This is not auditable by any automated tool. ARIA live region announcements (tested by snapshot) are the only automated coverage for gameplay events.
- **OS-level magnification tools (ZoomText, Windows Magnifier):** These operate below the browser layer. No browser-based test can simulate their behaviour accurately.

---

## GitHub Actions Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [pull_request]

jobs:
  contrast-unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bun install
      - run: bun test src/__tests__/contrast.test.ts

  playwright-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bun install && bun run build
      - run: bunx playwright install --with-deps chromium
      - run: bunx playwright test e2e/accessibility.spec.ts
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  ai-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - run: bun install && bun run build
      - run: node scripts/ai-accessibility-review.js
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          PR_NUMBER: ${{ github.event.number }}
      - uses: actions/github-script@v7
        with:
          script: | # post review as PR comment
```

---

## Success Condition

The test suite is considered adequate when:

1. A color contrast failure introduced in `constants.ts` is caught before the PR merges
2. A removed `aria-label` on a shop item is caught before the PR merges  
3. An AI review catches at least one real issue per quarter that axe-core missed
4. At least two visually impaired community members have submitted structured feedback and those issues are tracked in GitHub

Automated tests are not the goal. Accessible gameplay is. The tests exist to prevent regressions in what was already made right.
