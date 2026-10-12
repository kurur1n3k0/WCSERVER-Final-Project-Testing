# Angeles Discovery

A MEVN-style local travel discovery app for Angeles City and nearby Pampanga. Visitors can discover destinations, filter by category and budget, save places, post and like reviews, and create an itinerary that opens in Google Maps. Administrators can manage destinations, review suggestions, and moderate visitor reviews.

## Tech stack

- **MongoDB** — destinations, accounts, saved places, reviews, and suggestions
- **Express + Node.js** — REST API and authentication
- **Vue 3 + Vite** — responsive client-side application
- **Google Maps links** — destination lookup and itinerary directions

## What is improved in this version

- Kept the homepage slideshow, hero text, and search layout unchanged and minimal.
- Focused richer features on Discover: category search, budget and visitor-rating filters, sorting, editorial picks, saved destinations, and a browser-persisted trip planner.
- Added an illustrative image fallback when an external destination photo fails.
- Distinguished curated scores from ratings based on actual visitor reviews, and clarified that the popularity list is editorial rather than live traffic.
- Added visible reminders to verify opening hours and prices when the team has not recorded a verification date.
- Improved review editing/removal from the profile, image/contact/website details, and branded feedback flows.
- Preserved admin-edited destination images between server restarts.

## Requirements

- Node.js 20.19+ or a compatible current LTS release
- npm
- A MongoDB connection (local MongoDB or a hosted cluster)

## Setup

1. Open a terminal in `backend/` and install dependencies:

   ```bash
   npm install
   ```

2. Copy `backend/.env.example` to `backend/.env` and edit the values. Use your own MongoDB URI and a private random `JWT_SECRET` of at least 32 characters. To provision an administrator, set `ADMIN_EMAIL` and a private `ADMIN_PASSWORD` (12–72 bytes). Never commit `.env` to GitHub.

3. Start the API from `backend/`:

   ```bash
   npm start
   ```

4. In a second terminal, open `frontend/`, install its dependencies, and start Vite:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`). The frontend uses `http://localhost:5000` for the API by default. To use a different API host, set `VITE_API_URL` in a frontend `.env` file.

## Main pages

- `/` — minimal slideshow homepage with hero text and search
- `/discover` — destination search, filters, editorial sections, saved places, reviews, and the day planner
- `/about` and `/contact` — project information and place suggestions
- `/profile` — saved places, reviews, and liked notes (sign-in required)
- `/admin` — destination management, suggestion status workflow, and review moderation (admin required)

The day planner is stored in the current browser's local storage. Saved places and reviews are stored in MongoDB. Opening a route in Google Maps requires an internet connection.

## Before publishing

- Keep `backend/.env`, database credentials, tokens, and secrets private.
- Replace or verify destination photos and update the **Details last checked** field only after checking current hours, prices, and venue information. The UI clearly marks place details that have not been verified.
- Create a GitHub team/repository and add the repository URL to the course report once available.
- Do not commit `node_modules/`, generated `dist/` folders, or private environment files.
