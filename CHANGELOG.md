# Frank Change Log

## 2026-07-20

### Replaced the generic rank scale with the 21-tier FRANK ranking system
- Replaced the old 6-rank ELO-style scale (Initiate → Untouchable) with the new 7-rank × 3-tier structure (Stone/Iron/Bronze/Silver/Gold/Platinum/Diamond, each with I/II/III sub-tiers), using per-exercise score cutoffs and rank colors.
- `RankingService.getRankData` is now per-exercise: each exercise's 6 cutoff values become contiguous rank-band floors, split into equal-width sub-tiers; Diamond's open-ended top tier reuses the width of the Platinum band below it.
- Added `RankingService.getOverallRankData` to combine every placed exercise's % progress toward its own Diamond-I cutoff into one cumulative/overall rank for the dashboard header, using the spec's generic percentage bands.
- Recalibrated the three accessory-lift baseline constants (Shoulder, Lat Pulldown, Bicep Curl) so the new, lower per-exercise Diamond cutoffs are still meaningfully hard to reach; all other scoring formulas (DOTS calculation, world-record normalization, RPE intensity map) are unchanged.
- Added `GET /sets/dashboard` (per-exercise rank/tier/color/progress plus the overall rank) and `GET /sets/history` (filterable log list) — both routes the frontend already called but which previously didn't exist, so they silently 404'd.
- Rebuilt the dashboard UI in `public/index.html` with colored rank/tier badges, a progress-to-next-tier bar per exercise, and the overall rank in the header.

### Centralized exercise configuration into a single registry
- Added `src/ranking/exercise-config.ts`: one array of exercise configs (key, display name, category, score cutoffs, and whichever of DOTS/world-record/population-distribution or accessory-baseline data applies). Previously this was scattered across ~7 places in `ranking.service.ts`, 1 in `sets.service.ts`, and ~5 hardcoded spots in the frontend.
- `public/index.html` now renders the exercise grid, the log form's exercise selector, and the history tabs from a new `GET /sets/exercises` endpoint instead of static markup — adding a new exercise to the backend registry no longer requires any frontend changes.

### Added warm-up vs. working set tracking
- Added `setType` (`working`/`warmup`, default `working`) to `SetLog`. Warm-up sets are still saved (visible in history, tagged accordingly) but are excluded from scoring, placement-session counting, and PR tracking — only working sets advance placement or move the needle on rank.
- Added a Working/Warm-up toggle to the log form.

### Added per-user badge visibility preferences
- Added `hiddenExercises` (string array, default empty) to `User`. New `PATCH /auth/hidden-exercises` endpoint lets a user hide dashboard cards for exercises they don't train; hiding is display-only and doesn't affect the overall/cumulative rank calculation.
- Added a visibility checklist to the Profile screen.

### Added plateau detection and break-through tips
- `GET /sets/dashboard` now flags an exercise as plateaued when the last 3 working sessions all failed to beat the personal-best score set before them (requires at least 4 historical sessions to evaluate).
- Plateaued exercises show an expandable tips list on their dashboard card (add weight/reps, raise RPE, add a set, or deload), pulled from the spec's plateau-breaking guidance.

## 2026-07-16

### Added JWT-based authentication
- Added `AuthModule`, `AuthController`, and `AuthService` implementing register and login flows.
- Registration hashes passwords with bcrypt and rejects duplicate emails; login verifies credentials and issues a signed JWT.
- Added `JwtStrategy` (Passport) and a `GetUser` decorator for pulling the authenticated user out of the request in protected routes.
- Added `RegisterDto` and `LoginDto` for request validation.
- Added `bcrypt`, `passport`, `passport-jwt`, `passport-local`, `@nestjs/jwt`, and `@nestjs/passport` dependencies (plus their type packages).

### Added User model and linked it to existing data
- Added a `User` table (id, email, name, hashed password, createdAt) to the Prisma schema.
- Added foreign keys so `SetLog` and `RatingHistory` rows belong to a `User`, with cascade delete.
- Added migration `20260716174156_frank` to apply the new table and relations.
- Bumped the `prisma` dependency from ^5.4.1 to ^5.22.0.

### Reorganized the backend into a `src/` layout
- Moved all application source files (`app.module.ts`, `errors.ts`, `main.ts`, `validation.filter.ts`, and the `prisma/`, `ranking/`, `rm-calc/`, and `sets/` modules) under a new `src/` directory.
- Updated `tsconfig.json` (`rootDir`/`include`) to build from `src/`.
- Wired the new `AuthModule` into `AppModule` alongside the existing `SetsModule`.
- Removed committed `dist/` build output from version control and added `dist` to `.gitignore`.
- Moved `strength_ranking_agent_pipeline.svg` into `docs/`.

## 2026-07-15

### Added FRANK-based scoring system
- Replaced the previous tier model with a FRANK 0–10,000 score.
- Introduced FRANK tier names: FRANK-Initiate, FRANK-Capable, FRANK-Solid, FRANK-Formidable, FRANK-Elite, and FRANK-Untouchable.
- Added a peak/current split so the badge reflects best historical performance while the current form reflects recent performance.

### Added FRANK UI summary
- The browser page now displays FRANK Score, Peak, and Current values.
- The summary card shows the badge and current-form rank separately.

### Added client-side form validation
- The browser form now validates required fields and range constraints before submitting to the API.
- This reduces avoidable 400 responses from invalid payloads.

## 2026-07-14

### Added mobile-friendly browser UI
- Created a simple web page so the app could be triggered from a browser.
- Added a mobile-first layout, manifest, and touch-friendly form controls.

### Added root route for browser access
- Wired the app to serve the browser UI at the root URL.
- Added static asset hosting for the HTML page and manifest.

### Added set logging endpoint and DTO validation
- Implemented POST /sets for logging a lift.
- Added DTO validation for user input and request shape.

### Added Prisma persistence and database wiring
- Added Prisma schema and persistence layer for set logs and rating history.
- Connected the app to a PostgreSQL-backed flow.

### Added ranking and 1RM calculation services
- Implemented deterministic 1RM estimation logic.
- Implemented ranking logic for strength progression and score output.

### Added automated tests
- Added unit and service tests for the 1RM calculator, ranking service, and set logging flow.
- Verified the core scoring and request handling logic.

## Earlier milestones

### Initial project scaffold
- Created the initial NestJS-based backend structure for the strength ranking app.
- Added the first service files for 1RM calculation, ranking, and set logging.
- Established the core folder layout for ranking, RM calculation, sets, and Prisma integration.

### Early backend logic implementation
- Implemented the first version of the 1RM estimation flow.
- Implemented the first rank-scoring model for translating lift performance into a strength metric.
- Added placeholder persistence and API wiring so the core flow could be tested end to end.

### Early API and validation setup
- Added the initial HTTP route for logging sets.
- Added DTO validation so invalid requests would be rejected early.
- Added the first error-handling layer for clearer API responses.

### Early persistence and local runtime setup
- Added the initial Prisma schema and service layer for saving lift history.
- Added environment and local database configuration so the app could run outside the initial scaffold.
- Prepared the app for local startup and testing against a real database.
