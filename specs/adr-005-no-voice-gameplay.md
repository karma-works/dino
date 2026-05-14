# ADR-005: No Web Speech Recognition for Real-Time Gameplay Actions

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Christian Haegele

---

## Context

Web Speech API has two components:
- **SpeechSynthesis** — text-to-speech, used for menu narration (accepted, see implementation plan)
- **SpeechRecognition** — voice-to-text, which was evaluated for gameplay control input

The proposal was: let players say "jump", "fire", "left", "right" instead of (or in addition to) pressing keys. This appears to benefit players with limited hand mobility or who find keyboards difficult.

## Decision

Web Speech Recognition is **not used for real-time gameplay actions**. It may be used for menu navigation and status queries only.

## Rationale

**Latency is incompatible with the game's timing requirements:**  
Web Speech Recognition (both browser-native and cloud-backed implementations) has a processing latency of 100–500ms from utterance end to result delivery. A jump window in DINO at normal difficulty is approximately 80–150ms. A fire input needs to register within a frame or two (~16ms at 60fps). Voice recognition cannot meet these timing requirements regardless of implementation quality.

**Recognition accuracy degrades precisely when it matters most:**  
Players in tense situations (boss fight, debris rain) speak faster, with more stress, and at inconsistent volumes. These are exactly the conditions that increase Speech Recognition error rates — typically 10–20% under ideal conditions, higher under stress. A misrecognized "jump" as "dump" or no-recognition during a boss fight is not an inconvenience; it's a death.

**Browser support and permission friction:**  
SpeechRecognition requires microphone permission. The permission prompt interrupts game flow and may be denied by default in some browser configurations. On iOS Safari, SpeechRecognition requires a user gesture per recognition session, making continuous listening impossible without workarounds.

**Alternative exists and is superior:**  
The game already has keyboard controls. For players with limited hand mobility who cannot use a standard keyboard, the correct solution is browser-level accessibility tools (switch access, head tracking, eye gaze input) that translate their preferred physical input into key events — which DINO's existing `Input.ts` already handles correctly. DINO does not need to solve motor accessibility at the application layer.

## Allowed Uses of SpeechRecognition

If SpeechRecognition is added in the future, it is permitted for:
- **Menu commands:** "start game", "open shop", "restart" — no timing pressure
- **Status query:** "health" reads current HP, "score" reads current score — informational, no action
- **Settings navigation:** "high contrast on", "mute" — preference changes

These use cases are low-latency-tolerant and can absorb recognition errors gracefully (misrecognized "mute" does nothing, player repeats).

## Consequences

**Positive:**
- No false confidence in a control mechanism that will fail players at critical moments
- No microphone permission friction
- No latency bugs or platform-specific SpeechRecognition quirks to maintain

**Negative:**
- Players with motor disabilities who cannot use keyboards are not directly served by this plan
- Voice control is a genuine accessibility feature for motor-impaired players; declining to implement it here means it requires external tooling (Switch Access, Voice Control OS-level tools)

## Revisit Condition

If a player with a motor disability reports that OS-level voice control tools (e.g., macOS Voice Control, Windows Voice Access) do not interact correctly with DINO's keyboard input handling, that is a bug to fix — not a reason to implement in-game SpeechRecognition.
