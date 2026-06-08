# Door Knock Tracker

A simple mobile-first field tracker for door knocking. It stores data in your browser, so there is no login, backend, install step, or package manager needed.

## Run locally

Open `index.html` directly in your browser.

On Windows, you can double-click `index.html`.

## Open on Phone Anywhere

Use GitHub Pages to publish this as a static website. After publishing, the app will open from mobile data without your computer staying on.

### Publish with the included GitHub Pages workflow

1. Create a GitHub repository.
2. Add these project files to the repository root.
3. Commit and push to the `main` branch.
4. In GitHub, open the repository `Settings`.
5. Go to `Pages`.
6. Under `Build and deployment`, set `Source` to `GitHub Actions`.
7. Open the `Actions` tab.
8. Run or wait for `Deploy static site to GitHub Pages`.
9. When it finishes, open the published Pages URL shown by GitHub.

The URL usually looks like:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

### Open it on your phone

1. Open the GitHub Pages URL in your phone browser.
2. Optional: use your browser's `Add to Home Screen` option so it feels like a phone app.
3. Use the app normally while door knocking.

### Move existing data from PC to phone

Data is stored separately per device and browser. Your PC saved houses will not automatically appear on your phone.

To move data safely:

1. On your PC, open the app where your current data exists.
2. Go to `Settings`.
3. Choose `Export CSV`.
4. Send that CSV to your phone.
5. On your phone, open the hosted GitHub Pages app link.
6. Go to `Settings`.
7. Choose `Import CSV`.
8. Select the CSV file on your phone.

Use `Import CSV` for normal device transfer. It adds missing houses and skips houses already saved on that phone. Use `Replace from CSV` only if you intentionally want the CSV to become the full saved list on that device.

## What it does

- Add, edit, delete, search, and filter doors.
- Track statuses: A, B, C, D1, D2, D3, Booked, Completed.
- Upgrade no-answer houses with one tap: D1 to D2 to D3.
- Convert D1/D2/D3 houses to answered outcomes.
- See dashboard stats, follow-ups, and today's route.
- Export and import CSV backups.
- Demo data is included from the Settings page.

## Safe backups

Use `Settings` -> `Export CSV` to download a backup file. The CSV includes every saved house field, including the internal house ID and timeline history.

Use `Import CSV` when you want to add missing houses from a backup without overwriting anything already saved in this browser. If a house is already present, it is skipped so you do not accidentally duplicate or replace newer local notes.

Use `Replace from CSV` only when you want the CSV to become the full saved list on this browser. The app asks for confirmation before replacing current saved data.

Data is saved in `localStorage` on the device/browser you use.
