# Accessibility

DINO supports low-vision players who use browser zoom, high-contrast preferences, and screen readers as a supplement to functional vision.

## Supported

- Browser zoom is allowed and should work up to at least 200%.
- Main menu, shop, pause, and game-over screens are semantic HTML overlays.
- Canvas gameplay is marked decorative for assistive technology.
- Game events such as damage, treasure, checkpoints, level transitions, and death are announced through ARIA live regions.
- Pause menu settings include mute, high contrast, reduced motion, and larger HUD text.
- `prefers-contrast: more` and `prefers-reduced-motion: reduce` are respected on first load.

## Known Limits

- Real-time gameplay is still visual canvas gameplay. It is not designed to be fully playable by someone with no functional vision.
- The HUD is drawn on canvas during play. Important changes are announced, but the full HUD is not yet mirrored as HTML.
- Screen reader behavior must be validated manually with VoiceOver, NVDA, JAWS, and TalkBack.

## Feedback

Reports from visually impaired players are especially useful. Please include your browser, operating system, assistive technology, zoom level, and the part of the game where you got stuck or confused.
