# AGENTS.md

## Project
ahlia-wedplan-server - Express.js backend for Ahalia WedPlan.

## Structure
```
index.js
src/
  config/db.js
  middleware/errorHandler.js
  modules/
    users/routes.js
    services/routes.js
    bookings/routes.js
```

## Scripts
- `npm start` - start server
- `npm run dev` - start with watch mode

## Environment
See `.env.example`. Required: PORT, DB_URI, DB_NAME, CORS_ORIGIN, NODE_ENV. Never commit `.env`.

## Completed Work
- Basic Express.js foundation (JS, MongoDB, CORS, JSON parsing, error handling, standard API response shape).
- MongoDB connection via MongoClient; verified connected.
- Simple modular folder structure (config, middleware, modules).
- `.env.example` and `.gitignore` added.

## Next Recommended Step
Implement user/service/booking CRUD endpoints and validation.
