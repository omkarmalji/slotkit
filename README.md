# slotkit

Accessible scheduling components (date, time slot, timezone) built on
[Base UI](https://base-ui.com).

**Live docs and demos:** https://slotkit-dev.vercel.app

Work in progress.

## Run locally

Requires Node 22 (see `.nvmrc`).

```bash
git clone https://github.com/omkarmalji/slotkit.git
cd slotkit
npm install

npm run dev                     # docs site with hot reload at http://localhost:3000
npm run build && npm start      # production build at http://localhost:3000
```

## Checks

```bash
npm run verify     # lint, typecheck, hardcoded-value check, unit tests, build
npm run test:e2e   # Playwright + axe against the production build
```

`npm run test:e2e` builds the app and serves it with `next start`. Install a browser first with
`npx playwright install chromium`, or point at an existing one with
`PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome`.

## License

[MIT](./LICENSE)
