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

## Planning workflow

- Squad creation has three steps: project and dates together, members, then review.
- Scheduling an Unassigned project automatically sets it to **To Do**. On or after a squad's start date, it becomes **In Progress**. Statuses are synchronized on app load, on data changes, every minute, and when returning to the app.
- Projects stay In Progress after their squad dates end. Mark them **Completed** manually when the work is finished; automatic scheduling never changes a Completed project.
- The squad timeline and all-person availability calendar scroll horizontally and vertically within their panels, keeping date headers and row names visible.
- Use **Mark unavailable** to choose a person, dates, and reason. Click a recorded period in the calendar to edit or remove it. Squad reservations (including architect kickoff-only days) are shown separately from manual unavailability and prevent conflicting time-away entries.
