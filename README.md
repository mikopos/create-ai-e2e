# create-ai-e2e Quick Start

![Quick Start Demo](https://asciinema.org/a/123456.svg)

> **Get from zero to green E2E tests in under 60 seconds.**

---

## Prerequisites

- **Node.js ≥ 16** installed
- **NPM** or **Yarn**
- (Optional) **Anthropic API key** for AI assertions
  ```bash
  export ANTHROPIC_API_KEY=sk-...  
  ```

## 1. Install the CLI

Install directly via npx (no global install needed):

```bash
npx create-ai-e2e init
```

This will:

- Install Playwright and download browser binaries
- Create a `playwright.config.ts` in your project root

---

## 2. Scan your codebase

Detect routes/components in your `src/` folder:

```bash
npx create-ai-e2e scan src/ [--vue] [--json]
```

- `--vue`: scan as a Vue project (default is React)
- `--json`: output raw JSON for automation

You should see:

```
🔍 Found routes:
  • /
  • /about
  • /products
```

---

## 3. Generate tests

Generate Playwright smoke specs for each route:

```bash
# Basic smoke tests:
npx create-ai-e2e gen

# With Claude 3.7 AI assertions:
npx create-ai-e2e gen --ai
```  

Your `tests/` folder will now contain files like `home.spec.ts`, `about.spec.ts`, etc.

---

## 4. Run your tests

Kick off Playwright:

```bash
npx playwright test
```

All tests should pass (💚) on first run.

---

## Recording a GIF demo (Optional)

```bash
# Start recording
asciinema rec demo.cast --command="npx create-ai-e2e init && npx create-ai-e2e scan src/ && npx create-ai-e2e gen --ai && npx playwright test"

# Upload and generate SVG/GIF
asciinema upload demo.cast
```

Embed the resulting link above.

---

## Tips & Troubleshooting

- If you hit permission errors on global linking, skip linking and run via:
  ```bash
  node ./dist/cli.js <command>
  ```
- For projects with custom router paths, add a quick `.e2eignore` file to exclude files.
- To disable AI mode by default, unset the `ANTHROPIC_API_KEY` env var.

---

Ready to ship reliable E2E tests in minutes? Give it a spin and watch your CI badge go green! 🚀

[![E2E Tests Badge](https://github.com/mikopos/create-ai-e2e/actions/workflows/e2e.yml/badge.svg)](https://github.com/mikopos/create-ai-e2e/actions/workflows/e2e.yml)


