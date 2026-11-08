# Squad Planner

A React + TypeScript workforce planning application for managing projects, squads, team members, and availability. All workspace data is stored in browser `localStorage`; the initial workspace is populated with fictional demo data.

## Run locally

```sh
npm install
npm run dev
```

## Checks

```sh
npm test
npm run lint
npm run build
```

Use **Reset demo data** in the development sidebar to restore the initial sample workspace.

## GitHub Pages

The production build uses `/squad-planner/` as its asset base. Hash routing supports direct links and refreshes without server-side routing, for example `https://tito-paris-olisa.github.io/squad-planner/#/availability`. Development still runs at the local root URL, with hash routes such as `http://localhost:5173/#/availability`.

To enable hosting:

1. In the repository on GitHub, open **Settings → Pages** and select **GitHub Actions** as the source.
2. Commit and push the deployment configuration to `main`.
3. Watch **Actions → Deploy GitHub Pages**. After it succeeds, open `https://tito-paris-olisa.github.io/squad-planner/`.

The workflow tests, lints, builds, and publishes the app on each push to `main`. You can also launch it manually using **Actions → Deploy GitHub Pages → Run workflow**. A workflow is not mandatory for Pages, but publishing from a branch would require building and publishing the compiled output separately; Pages cannot run the TypeScript source directly.

To check the production build locally, run `npm run build` followed by `npm run preview`, then open `http://localhost:4173/squad-planner/`.

Hosting does not add shared storage or authentication. Workspace data remains specific to each browser and origin, so localhost data will not automatically appear on the hosted site. Treat the published app as publicly accessible; do not commit real workforce data or secrets.

## Planning workflow

- Squad creation has three steps: project and dates together, members, then review.
- Scheduling an Unassigned project automatically sets it to **To Do**. On or after a squad's start date, it becomes **In Progress**. Statuses are synchronized on app load, on data changes, every minute, and when returning to the app.
- Projects stay In Progress after their squad dates end. Mark them **Completed** manually when the work is finished; automatic scheduling never changes a Completed project.
- The squad timeline and all-person availability calendar scroll horizontally and vertically within their panels, keeping date headers and row names visible.
- Both calendars display Monday–Friday only, grouped by ISO week number (W41, W42, etc.) with week separators. Weekend dates remain stored and included in scheduling/conflict checks; hiding them only changes the calendar display.
- Scroll horizontally in either direction to move continuously through weeks and months. The range label follows the first visible date, and off-screen weeks are recycled to keep the calendar bounded. Today and previous/next buttons remain available for quick jumps.
- Use **Mark unavailable** to choose a person, dates, and reason. Click a recorded period in the calendar to edit or remove it. Squad reservations (including architect kickoff-only days) are shown separately from manual unavailability and prevent conflicting time-away entries.
