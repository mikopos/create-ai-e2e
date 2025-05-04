# create-ai-e2e Quick Start

![Quick Start Demo](https://asciinema.org/a/123456.svg)

> **Get from zero to green E2E tests in under 60 seconds.**

---

## Prerequisites

- **Node.js ≥ 20** installed
- **NPM** or **Yarn**
- **API Keys** (optional, for AI assertions):
  ```bash
  # OpenAI API key
  export OPENAI_API_KEY=sk-...
  
  # Anthropic API key
  export ANTHROPIC_API_KEY=sk-...
  
  # Hugging Face API key
  export HUGGINGFACE_API_KEY=hf_...
  
  # Hugging Face model (optional)
  export HF_MODEL=google/flan-t5-small
  ```

## Setting up GitHub Repository Secrets

To use AI features in GitHub Actions, you need to add your API keys as repository secrets:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"
4. Click on "New repository secret" button
5. Add each API key as a separate secret:

   | Secret Name | Description |
   |------------|-------------|
   | `OPENAI_API_KEY` | Your OpenAI API key |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
   | `HUGGINGFACE_API_KEY` | Your Hugging Face API key |

6. For each secret:
   - Enter the name exactly as shown above
   - Paste the corresponding API key value
   - Click "Add secret"

> **Note**: These secrets are encrypted and can only be used in GitHub Actions workflows. They are not visible in logs or accessible to anyone else.

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

# With AI assertions (requires API keys):
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

## GitHub Actions Integration

The project includes a GitHub Actions workflow for automated E2E testing. The workflow:

1. Runs on push to main branch and pull requests
2. Uses Node.js 20
3. Installs dependencies and Playwright browsers
4. Runs tests with HTML reporter
5. Uploads test results as artifacts

To use the workflow in your project:

1. Copy the `.github/workflows/e2e.yml` file to your project
2. Add required secrets in your repository settings (see "Setting up GitHub Repository Secrets" above)
3. Update the working directory if needed
4. Push to trigger the workflow

Example workflow status badge:
```markdown
[![E2E Tests](https://github.com/your-username/your-repo/actions/workflows/e2e.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/e2e.yml)
```

---

## Tips & Troubleshooting

- If you hit permission errors on global linking, skip linking and run via:
  ```bash
  node ./dist/cli.js <command>
  ```
- For projects with custom router paths, add a quick `.e2eignore` file to exclude files.
- To disable AI mode by default, unset the API key environment variables.
- If tests fail in CI, check the uploaded artifacts for detailed reports.
- Make sure to set up your API keys as GitHub repository secrets for CI/CD.

---

Ready to ship reliable E2E tests in minutes? Give it a spin and watch your CI badge go green! 🚀

[![E2E Tests Badge](https://github.com/mikopos/create-ai-e2e/actions/workflows/e2e.yml/badge.svg)](https://github.com/mikopos/create-ai-e2e/actions/workflows/e2e.yml)


