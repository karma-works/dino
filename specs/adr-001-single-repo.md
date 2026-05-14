# ADR-001: Keep Accessibility Changes in the Main Repository

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Christian Haegele

---

## Context

During design discussions about accessibility, a fork named `descend-into-darkness` was initially proposed. The rationale was that totally blind users would need fundamentally different game mechanics — different level design, audio-first interaction model, echolocation mechanic, slower pacing — making it effectively a different game that shared a codebase origin.

The target audience was subsequently revised from totally blind users to **low-vision users who retain functional sight** and rely on assistive tools like browser zoom and screen readers as supplements rather than replacements for vision.

## Decision

All accessibility changes ship in the main `dino` repository. No fork is created.

## Rationale

The revised target audience does not require game mechanic changes. They want to play the same game — same levels, same enemies, same shop — with a UI layer that doesn't fight their tools.

The changes required are:
- Removing zoom-blocking viewport attributes
- Moving menus from canvas to semantic HTML
- Adding ARIA live regions
- Adding high-contrast and reduced-motion options

These are presentation-layer changes that integrate cleanly into the existing codebase without forking. Shipping them in the same repo means:

- Every future gameplay improvement automatically benefits accessible users
- Bug fixes don't need to be ported across repos
- The accessibility work is visible to all contributors, not siloed
- The README's accessibility section invites the visually impaired community into the same project that sighted contributors use

## Consequences

**Positive:**
- Single source of truth
- No maintenance split
- Accessibility is a first-class part of the project, not a separate concern

**Negative:**
- If the target audience expands to include totally blind users in the future, more invasive changes (parallel game mode, audio-first mechanics) would need to be made to this same repo, potentially complicating the codebase

## Revisit Condition

If the project decides to build a genuinely audio-first mode targeting totally blind users, that work should be evaluated as a separate feature branch or a true fork at that time. This ADR does not preclude that decision.
