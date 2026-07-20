![Tests](https://github.com/jadaily/FRANK/actions/workflows/tests.yml/badge.svg)

# FRANK

FRANK is a strength-training ranking app. Users log working sets for tracked
lifts and accessories, and the backend converts each log into an estimated
one-rep max, a FRANK score, and a rank/tier badge (Stone through Diamond),
with plateau detection and progress tracking toward the next tier.

## Tech stack

- [NestJS](https://nestjs.com/) (TypeScript) backend
- [Prisma](https://www.prisma.io/) + PostgreSQL
- Static HTML/CSS/JS frontend served from `public/`
- [Jest](https://jestjs.io/) for testing

## Getting started

```bash
# start the database
docker compose up -d

# install dependencies
npm install

# apply database migrations
npx prisma migrate deploy

# run the app
npm start
```

Copy `.env.example` to `.env` and adjust `DATABASE_URL` / `JWT_SECRET` as
needed before starting the app.

## Testing

```bash
npm test
```

Tests run automatically on every push via GitHub Actions (see
`.github/workflows/tests.yml`), which spins up the Postgres container defined
in `docker-compose.yml` before running the Jest suite.
