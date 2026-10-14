# A408X Robot Rumble

## Site integration

Route: `https://a408x-gang.captainnemo007.chatgpt.site/games/robot-rumble/index.html`

The editable Site source is `/workspace/sites/a408x-gang`, project `appgprj_6ab9adb20b3c8191ac4de283d7a65202`. Its existing owner-only audience must be preserved. The homepage navigation, hero and Games section open the arena. The game links back to A408X Games.

The existing Face Lab at `/ar/face.html`, original poster/body camera studio at `/ar/index.html`, Lost Parts Lab, Scrap Circuit, Find Glitch, Merch and custom robot pages remain in place. The fighting game does not use or alter the camera features.

## Game and original artwork

Four original Canvas pixel robots interpret the A408X palette, spring limbs, mismatched eyes and heart details: BEEP, GLITCH, BOLT and NOVA. GLITCH’s one eye echoes the collection artwork already used on the homepage. There are three arenas: Miami Sunset, Jungle Circuit and Moon Scrap. All game assets are local to the Site. No new external runtime or artwork downloads are required.

| Robot | Special | Power cost | Base damage | Shot speed |
| --- | --- | ---: | ---: | ---: |
| BEEP | Heartbeat | 35 | 14 | 535 |
| GLITCH | Short Circuit | 30 | 10 | 740 |
| BOLT | Heavy Metal | 45 | 20 | 380 |
| NOVA | Stardust | 40 | 16 | 575 |

Robot strength modifies damage; NOVA has an additional projectile multiplier. Each special has its own drawing. Punches and kicks have windup, active frames, recovery, cooldowns and different reach. Hits cause recoil, sparks and a brief damage lockout. Blocking reduces damage to a small amount and drains the shield; releasing it recharges the shield. Energy recharges and hits add power. Jumping can avoid a projectile. Robot speeds and strength vary.

Matches have up to three 60-second rounds. The healthier fighter wins a timeout; equal batteries draw. Two wins end the match early; otherwise the highest round score wins after three rounds. Drawn matches finish cleanly. Result overlays name the winner and final score, with a rematch button.

## Controls

| Action | Player one | Player two in local mode |
| --- | --- | --- |
| Move | A / D | Left / Right arrows |
| Jump | W / Space | Up arrow |
| Block | S | Down arrow |
| Punch | J | U or numpad 1 |
| Kick | K | I or numpad 2 |
| Special | L | O or numpad 3 |
| Pause | P / Escape | P / Escape |

Against the computer, arrow keys also control player one. Local mode disables the computer brain, allows player two to choose any robot, and displays a second independent touch deck. Multiple touches and keyboard aliases have separate lifetimes. Pointer cancellation, focus loss and backgrounding release inputs; backgrounding also pauses the game. Keyboard focus moves into the arena when a match starts, and to the visible resume/rematch button when appropriate. Toolbar buttons retain native Space/Enter behavior.

The Canvas backing resolution remains 960 × 600 on small screens, avoiding the previous camera crop at extreme robot positions. CSS scales the arena. Touch actions, menu controls and toolbar controls have at least 44px targets. Buttons have accessible labels and focus indicators; health uses progressbar semantics and round/match results use a polite status region. This is a visual action game; it does not provide equivalent nonvisual combat gameplay.

Optional synthesized audio starts only after a visitor action. Calm effects remove decorative motion, screen shake and particles; the operating system’s reduced-motion setting is also honored. Game preferences and single-player scores use optional browser-local storage. Local two-player matches do not affect the single-player record. No game data is uploaded and no camera is requested. Existing Site hosting still requires the authorized owner’s sign-in.

## Source organization

- `dist/games/robot-rumble/engine.js`: combat, deterministic AI, match lifecycle, input state.
- `game.js`: DOM, keyboard/touch handling, preferences, optional sound and accessible status.
- `render.js`: original robots, arena drawing, reactions and special effects.
- `index.html`, `style.css`, `favicon.svg`: accessible interface and responsive styling.
- `tests/robot-rumble/`: engine, real application code with DOM mocks, actual Canvas rendering and Site integration checks.

A standalone GitHub mirror belongs in `artffee/arcomic/a408x-robot-rumble/` on branch `codex/a408x-robot-rumble`. It is separate from the existing ARComic app and Face Lab pull request #1. The mirror contains the exact game files, portable tests, a launch page and this guide. GitHub source publication and Sites production deployment are separate operations; a GitHub PR alone does not deploy this private Site.

## Verification on 2026-10-14

- `node --test tests/robot-rumble/*.test.mjs`: 54 passing tests, including 24 seeded full-match simulations, local keyboard/touch isolation, attacks and blocking, special thresholds, pause/resume, wins, real Canvas drawing, calm effects, extreme-position visibility and integration paths.
- `node tests/verify-face.cjs`: all 41 Face Lab regression checks passed.
- `node tests/verify-ar.cjs`: all 55 existing poster/body AR checks passed.
- Syntax checks and `git diff --check` passed before packaging.
- Canvas contact sheet inspected for the four characters, three arenas and both robots at extreme positions.

Application event tests use DOM mocks. Canvas artwork tests use @napi-rs/canvas 0.1.100. These checks do not establish browser CSS layout, real multi-touch behavior, browser audio/fullscreen support or physical-device performance. Browser QA was unavailable in this managed environment, so no local browser preview was started and no device pass is claimed. Successful native Sites deployment verifies production publication; it does not replace the device checks below.

## Physical-device acceptance

1. On Android Chrome and iOS Safari, check 320/390px portrait and landscape: no horizontal scrolling, readable winner overlays, both fighters visible, no controls covered or clipped. Check desktop and tablet widths too.
2. Start an Easy computer match; move and jump, land both attack types, block, exhaust/recharge the shield and fire each special. Win and lose a round, finish a match and rematch.
3. Hold two or more touch buttons together, slide off one, cancel a touch and switch apps. Return to a paused game with no stuck movement. Repeat with each touch deck in local mode.
4. On a keyboard, check both players simultaneously, aliases and numpad attacks. Hardware key rollover may vary; touch buttons are an alternative. Tab through controls and verify Space/Enter still activate toolbar buttons.
5. Verify local P1 and P2 wins, a draw, timeout and the score. Restart to change mode, robot or arena. CPU behavior must be absent in local mode.
6. Confirm sound begins only when enabled, mute works, calm effects and OS reduced motion remove ambient motion, and unsupported fullscreen still leaves the game usable. Check actual sustained responsiveness on a slower phone.
7. Return home and open Face Lab, the original studio and existing games to check the unchanged experiences. Confirm the Site remains owner-private.
