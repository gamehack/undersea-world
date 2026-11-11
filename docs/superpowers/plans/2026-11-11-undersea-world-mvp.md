# Undersea World MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-and-desktop browser MVP where visitors can enter and freely explore a believable lightweight tropical reef with autonomous fish and a sea turtle, without tasks or survival mechanics.

**Architecture:** A static TypeScript/Vite/Three.js app organizes controls, navigation, marine life, world rendering, quality, and lifecycle as separable units. Deterministic logic modules are tested without a GPU, while browser smoke tests cover actual WebGL startup, controls, pause and fallback. Deploy-ready static output targets Cloudflare Pages; deployment requires an approved repository/domain integration.

**Tech Stack:** TypeScript, Vite, Three.js WebGLRenderer (WebGL 2), Vitest, Playwright or equivalent browser checks, Cloudflare Pages static build.

**Spec:** `docs/superpowers/specs/2026-11-11-undersea-world-design.md`

## Global Constraints

- Direction A: real marine ecology, not a fantasy ocean.
- Visual standard B: lightweight ecological realism; believable forms, behaviors, water light; mobile smoothness takes precedence over photo realism.
- Scheme 2: Three.js + WebGL 2 browser 3D; initial version requires no back-end, accounts, payment, chat, AI, multiplayer, quest, levels, oxygen, or hazard system.
- One continuous shallow reef with coral, 3 types of reef fish, and at least 1 autonomously swimming sea turtle.
- PC and mobile browsers, keyboard/mouse and touch; audio muted by default.
- WebGL unsupported, asset load failure, and context loss require user-visible recovery/fallback.
- All resource licenses verified before public deployment; no unlicensed production asset.
- Every task changes implementation, tests, and directly affected docs together; `README.md` must distinguish planned, implemented, verified, and deployed.

## Review Focus

1. Device lacks WebGL 2 → friendly static preview; test Task 1 capability rejection.
2. Touch produces large or NaN input → bounded movement/view, never camera explosion; test Task 3.
3. Creature starts at edge or large time delta occurs after resume → stays in habitat; test Task 4.
4. Auto quality receives invalid FPS/size → safe low tier; test Task 5.
5. Page hidden and resumed or GPU context lost → no runaway updates, sound muted and recoverable UI; test Task 6.

---

## Proposed file map

```text
index.html
package.json, tsconfig.json, vite.config.ts, vitest.config.ts
src/main.ts
src/app/{app.ts,capabilities.ts,experience.ts,ui.ts}
src/scene/{world.ts,water.ts,coral.ts,assets.ts}
src/navigation/{motion.ts,controls.ts}
src/life/{species.ts,steering.ts,creatures.ts}
src/performance/{quality.ts,metrics.ts}
src/platform/{audio.ts,telemetry.ts,lifecycle.ts}
src/styles.css
tests/{capabilities,motion,world,steering,quality,lifecycle,telemetry}.test.ts
docs/{PRD,ARCHITECTURE,SCENE_AND_BIOLOGY,ASSETS_AND_LICENSES,PERFORMANCE,ANALYTICS,CHANGELOG}.md
docs/superpowers/specs/2026-11-11-undersea-world-design.md
public/{fallback.svg,audio/*}
```

## Task 1: Static app shell, capability check and documentation baseline

**Files:** `package.json`, `index.html`, `src/main.ts`, `src/app/capabilities.ts`, `src/app/ui.ts`, `src/styles.css`, `public/fallback.svg`, `tests/capabilities.test.ts`, `README.md`, `docs/PRD.md`, `docs/CHANGELOG.md`.

**Interfaces:**
- Produces `getWebGL2Status(createContext: () => unknown): 'supported' | 'unsupported'` and `renderFallback(root: HTMLElement, reason: string): void`.
- Later tasks consume the mounted `.experience-root` element and `getWebGL2Status`.

- [ ] Write `tests/capabilities.test.ts`: callback returns object => supported; callback returns null or throws => unsupported.
- [ ] Run `npm test -- tests/capabilities.test.ts` and watch it fail from missing module.
- [ ] Add pinned dev dependencies, page shell with Enter, Loading, Retry, Sound, Quality buttons, semantically labeled controls, browser capability gate and fallback SVG.
- [ ] Run targeted test, then `npm test` and `npm run build`; expect zero errors.
- [ ] Update README/PRD/CHANGELOG with exact implemented/remaining features; commit `feat: initialize ocean experience shell`.

## Task 2: Continuous reef world and lightweight water atmosphere

**Files:** `src/scene/world.ts`, `src/scene/water.ts`, `src/scene/coral.ts`, `tests/world.test.ts`, `docs/SCENE_AND_BIOLOGY.md`, `docs/ARCHITECTURE.md`, `docs/ASSETS_AND_LICENSES.md`.

**Interfaces:**
- Produces `createWorld(seed: number): { group: THREE.Group; bounds: WorldBounds; dispose(): void }` with `WorldBounds={width:number; depth:number; minY:number; maxY:number}`.
- Produces `createWaterAtmosphere(scene: THREE.Scene, quality: QualityTier): () => void` and `createCoralCluster(seed:number): THREE.Group`.

- [ ] Write `tests/world.test.ts`: seeded world includes `reef-terrain`, `coral-clusters`, and finite bounds with minY < maxY; same seed yields same cluster placements; dispose releases resources.
- [ ] Run targeted test; expect missing export failure.
- [ ] Implement seeded primitive reef geom, mesh terrain, rocks, procedural coral forms, fog, surface caustic approximation and restrained particles; no remote assets.
- [ ] Run targeted and full tests plus build; expect pass.
- [ ] Record procedural-assets ownership in license doc and environment rules in scene spec; commit `feat: render explorable reef world`.

## Task 3: Keyboard/mouse/touch navigation with comfort constraints

**Files:** `src/navigation/motion.ts`, `src/navigation/controls.ts`, `tests/motion.test.ts`, `src/app/experience.ts`, `docs/PRD.md`, `docs/ARCHITECTURE.md`.

**Interfaces:**
- Produces `advanceMotion(state: MotionState, input: MotionInput, seconds: number, bounds: WorldBounds): MotionState`; `MotionInput={forward:number; strafe:number; vertical:number; yaw:number; pitch:number}`.
- `Controls` exposes `getInput(): MotionInput` and `dispose():void` for keyboard pointer and touch; values clamped to [-1,1].

- [ ] Write motion tests: neutral input decays velocity, extreme/NaN input remains finite, high delta is clamped, floor/surface/edge bounds never crossed.
- [ ] Run targeted test RED.
- [ ] Implement damped navigation and touch joystick/right-look region, up/down buttons, pointer interactions and focus cleanup; connect first-person camera to app.
- [ ] Run targeted/full tests and build; expect pass; perform a brief manual phone-layout check.
- [ ] Update PRD interaction mappings and architecture; commit `feat: add comfortable cross-device diving`.

## Task 4: Autonomous reef fish and sea turtle

**Files:** `src/life/species.ts`, `src/life/steering.ts`, `src/life/creatures.ts`, `tests/steering.test.ts`, `docs/SCENE_AND_BIOLOGY.md`, `docs/ASSETS_AND_LICENSES.md`.

**Interfaces:**
- Produces `updateSteering(agent: AgentState, neighbors: AgentState[], habitat: HabitatBounds, dt: number): AgentState`; finite-position guarantee.
- Produces `createMarineLife(world: THREE.Group, seed:number): { update(dt:number):void; dispose():void; countBySpecies():Record<string,number> }`.

- [ ] Write tests: separation, bounded habitat, reproducible seeded startup, dt <= 0 harmless, dt after background capped, no invalid rotations/positions.
- [ ] Run targeted test RED.
- [ ] Implement 3 visually distinct procedural fish body/tail variants, group swimming/solo cruising, autonomous turtle with flipper animation, distant LOD/updates; no sharks/attacks.
- [ ] Run targeted/full tests/build and inspect scene in browser if available.
- [ ] Update species and habitat rule table, asset manifest; commit `feat: simulate reef wildlife`.

## Task 5: Quality tiers, responsive UI and performance diagnostics

**Files:** `src/performance/quality.ts`, `src/performance/metrics.ts`, `tests/quality.test.ts`, `src/app/ui.ts`, `src/styles.css`, `docs/PERFORMANCE.md`.

**Interfaces:**
- Produces `selectQuality(deviceMemoryGiB?:number, pixelRatio?:number): QualityTier` and `qualitySettings(tier: QualityTier): QualitySettings`; tiers `'low'|'medium'|'high'`.
- Produces `FrameStats.pushFrame(ms:number):void` and `FrameStats.summary():{fps:number;slowFrameRate:number}`.

- [ ] Write tests for missing, invalid and extreme hardware values => safe low/medium; settings monotonic quality, bounded render pixel ratio; frame stats ignore invalid numbers.
- [ ] Run targeted test RED.
- [ ] Implement three tiers, auto default and manual override, responsive menu and simplified low-tier rendering.
- [ ] Run targeted/full tests/build and record real-device figures as TBD until measured.
- [ ] Update PERFORMANCE with actual test matrix status; commit `feat: adapt rendering to device capability`.

## Task 6: Experience lifecycle, sound, errors, telemetry and privacy

**Files:** `src/platform/lifecycle.ts`, `src/platform/audio.ts`, `src/platform/telemetry.ts`, `src/app/app.ts`, `src/app/experience.ts`, `tests/lifecycle.test.ts`, `tests/telemetry.test.ts`, `docs/ANALYTICS.md`, `docs/ARCHITECTURE.md`, `README.md`.

**Interfaces:**
- `Lifecycle` exposes `onVisibility(hidden:boolean): 'pause'|'resume'` and `onContextLost(): 'recover'`.
- `Telemetry` exposes `emit(name: EventName, fields: Record<string,string|number|boolean>): void`; no stable fingerprint identifiers.

- [ ] Write tests: visibility toggles render state, context failure gives recovery, event names/fields respect schema, invalid telemetry payload does not throw or block experience.
- [ ] Run targeted tests RED.
- [ ] Implement explicit Enter/pause/resume/retry/exit, muted-by-default Web Audio ambient tone or licensed local audio, context restore/dispose, 3/10 minute active-duration thresholds, failure events.
- [ ] Run targeted/full tests/build and interactively inspect failure UI and audio toggle.
- [ ] Update ANALYTICS/ARCHITECTURE/README; commit `feat: complete resilient ocean experience`.

## Task 7: E2E acceptance, packaging, deployment readiness and documentation synchronization

**Files:** `tests/e2e/ocean.spec.ts`, `.github/workflows/ci.yml`, `docs/QA.md`, `docs/CHANGELOG.md`, `docs/ASSETS_AND_LICENSES.md`, `README.md`, `package-lock.json`.

**Interfaces:** Builds on all earlier task outputs; no new production runtime interface.

- [ ] Write E2E tests for Enter scene, float/dive UI, help, sound disabled by default, low-quality mode, fallback when WebGL blocked, and visibility recovery. Test required event semantics where feasible.
- [ ] Run tests RED (with missing integration or selector), then finish test integration and run GREEN.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build` and browser smoke with Chrome where available. Record device gaps rather than claim tested.
- [ ] Add CI test/typecheck/build, document asset-license audit, performance targets vs measurements, known limitations and deployment steps (not credentials).
- [ ] Confirm every implemented feature has up-to-date README and matching `docs/*` sections; commit `chore: verify ocean MVP release candidate`.

## Final self-review gates

- Each P0 feature maps to Tasks 1–7; no P1/P2 scope is necessary for MVP.
- Real asset quality and device FPS cannot be honestly certified without viewing the render on actual supported devices; mark as validation blockers, not complete.
- Public release needs a GitHub repository/branch and Cloudflare Pages integration choice from the founder. No external repository creation, push, production publish or domain binding is implicitly authorized by this plan.
- Code and docs are one change unit for every task. If any task leaves documentation stale, that task is incomplete.
