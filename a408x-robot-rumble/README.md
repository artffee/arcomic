# A408X Robot Rumble

An original colorful pixel robot fighting game: BEEP, GLITCH, BOLT and NOVA battle in Miami Sunset, Jungle Circuit or Moon Scrap. Play against a computer with three difficulty settings, or with two people on a shared keyboard/touch screen. Movement, jumping, punching, kicking, blocking, four distinct energy specials, animated reactions, round health, wins/draws, pause and rematches are included. Sound is optional. Reduced motion and calm effects are supported.

Production route (owner-private): https://a408x-gang.captainnemo007.chatgpt.site/games/robot-rumble/index.html

This standalone directory mirrors the game integrated into A408X Sqwad. It preserves the existing ARComic application and the separate A408X Face Lab work. The game files match the Site source; only this directory’s small launch page is standalone. Publishing this GitHub branch does not automatically deploy Sites.

## Run locally

```bash
cd a408x-robot-rumble
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080/games/robot-rumble/index.html . The game has no build step, runtime dependencies, camera access or server data. The local server is for development; the existing private Site is published separately through Sites.

## Verify

```bash
npm install --ignore-scripts
npm run check
npm test
```

Node 22 or later is required. The only development dependency, `@napi-rs/canvas` 0.1.100, renders the original artwork in tests; it is not shipped to players. In Codex the existing primary runtime dependency is reused. There are 51 standalone combat/application/Canvas tests, including 24 seeded full-match simulations. The integrated Site has three additional route/navigation checks. Face Lab’s 41 checks and original AR’s 55 checks also passed in the parent Site.

Application input tests use DOM mocks. Real-browser CSS layout, phone multi-touch/audio/fullscreen and physical-device performance remain unverified because browser QA was unavailable. See [INTEGRATION.md](INTEGRATION.md) for architecture, controls, Site integration and physical-device acceptance checks.

## Keyboard

- P1: A/D move, W or Space jump, S block, J punch, K kick, L special.
- P2 in local mode: arrows move/jump/block, U/I/O or numpad 1/2/3 attacks.
- P or Escape pauses. Against the computer, arrows also control P1.

Both players have independent touch controls. Multiple simultaneous keyboard keys depend on hardware key rollover. Preferences and single-player records are optional and stay in local storage; no game data is uploaded. The existing Site retains its owner sign-in restriction.
