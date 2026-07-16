# Frank Change Log

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
