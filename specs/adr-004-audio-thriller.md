# ADR-004: Lean Into Thriller Audio Aesthetic

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Christian Haegele

---

## Context

DINO's theme is *Descend Into Darkness* — an endlessly deepening cave, no safe ground, hostile things in the dark. The existing audio design (procedural ambient drone, debris warning sounds, companion death scream) already gestures toward dread. It does not fully exploit it.

When designing for low-vision players, two tonal approaches were considered:

**Option A: Neutral, informational audio**  
Every event gets a clean, distinct audio cue designed for maximum recognizability. Checkpoint = ascending chime. Damage = descending tone. Enemy = a click. Clear, functional, sterile. The game sounds like a training exercise.

**Option B: Thriller atmosphere (accepted)**  
Audio design choices lean into fear, tension, and relief. The cave breathes. Enemies have unsettling textures. The companion's proximity has warmth — their absence has a specific silence. A checkpoint doesn't ping reassuringly; it exhales. This is the same information, delivered through the emotional register of the game's theme.

The argument for Option B is not just aesthetic. For low-vision players who rely partially on audio, a more textured, emotionally differentiated audio space is *easier to read* than a neutral one. Dread sounds different from calm. A sound that makes you uncomfortable is conveying something. The game's existing atmosphere becomes an accessibility feature.

## Decision

Audio design for accessibility cues follows the thriller aesthetic. Informational clarity is non-negotiable, but the delivery is atmospheric.

## Specific Implications

**ARIA live region copy:**  
Messages are written in the voice of the game, not a status readout.
- Not: `"Damage received. Health: 2 of 3."`
- Yes: `"Hit. 2 hearts left."`
- Not: `"Checkpoint reached. Progress saved."`
- Yes: `"Checkpoint. You're safe — for now."`

**Web Speech TTS settings:**  
- Normal events: rate 1.0, pitch 1.0
- Danger (boss, low HP, companion death): rate 1.1, pitch 0.85 (lower, slightly faster — urgency without panic)
- Relief (checkpoint, level complete): rate 0.9, pitch 1.1 (slower, slightly brighter)

**Companion as presence, not utility:**  
The companion's audio is a warmth signal — nearby and alive = subtle breathing sound. Dead = that sound stops. This is not announced; it's felt. The player notices the silence before the game tells them. The `"Your companion has fallen"` ARIA announcement confirms what the audio already communicated. This is how thrillers work: the audience knows before the protagonist says it.

**Debris warning sound:**  
The existing `playDebrisWarn()` is a threat sound. In high-stakes moments, multiple debris warnings overlapping create a wash of danger that is both informative (multiple rocks incoming) and viscerally threatening. This is intentional — don't normalize or quiet it.

**Silence as communication:**  
Between threats, the cave is quiet except for ambient drip. Low-vision players learn to use silence as information: if it's quiet, there's a window to move. This is the same as a sighted player scanning the screen — the medium is different, the information content is equivalent.

## Consequences

**Positive:**
- Audio cues are emotionally differentiated — easier to distinguish in a stressed state
- Accessibility layer contributes to the game's atmosphere rather than breaking it
- A game that sounds good is more likely to attract players who rely on audio

**Negative:**
- Thriller tone in ARIA messages may feel inappropriate to users who expect neutral screen reader output. This should be validated with actual low-vision users. If feedback indicates the tone is unwelcome, message copy can be revised without changing this architectural decision.
- Procedural audio that conveys danger (heavily saturated debris sound) may be perceived as purely aesthetic by a player who doesn't understand its informational role. Onboarding must explain the audio grammar explicitly.

## Revisit Condition

If user feedback from the visually impaired community indicates the atmospheric copy and audio choices cause confusion or discomfort, the tone of ARIA messages specifically should be made configurable (atmospheric vs. plain). The underlying audio design stays.
