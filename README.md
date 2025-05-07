# create-ai-e2e

> **Get from zero to green E2E tests in under 60 seconds.**

[![E2E Tests Badge](https://github.com/mikopos/create-ai-e2e/actions/workflows/e2e.yml/badge.svg)](https://github.com/mikopos/create-ai-e2e/actions/workflows/e2e.yml)

## Features

- 🚀 Quick setup with zero configuration
- 🔍 Automatic route detection for Vue.js and React
- 🤖 AI-powered test generation (optional)
- 📊 GitHub Actions integration
- 🎯 Framework-specific support

## Quick Start

### Prerequisites

- **Node.js ≥ 20**
- **NPM** or **Yarn**
- **API Keys** (optional, for AI assertions):
  ```bash
  export OPENAI_API_KEY=sk-...      # OpenAI API key
  export ANTHROPIC_API_KEY=sk-...   # Anthropic API key
  export HUGGINGFACE_API_KEY=hf_... # Hugging Face API key
  export HF_MODEL=google/flan-t5-small # Optional Hugging Face model
  ```

### Installation

```bash
# Install via npm
npm install create-ai-e2e --save-dev

# Or via yarn
yarn add create-ai-e2e --dev
```

### Basic Usage

1. **Initialize**:
   ```bash
   npx create-ai-e2e init
   ```

2. **Scan your codebase**:
   ```bash
   # For React (default)
   npx create-ai-e2e scan src/
   
   # For Vue.js
   npx create-ai-e2e scan src/ --vue
   ```

3. **Generate tests**:
   ```bash
   # Basic tests
   npx create-ai-e2e gen
   
   # With AI assertions
   npx create-ai-e2e gen --ai
   ```

4. **Run tests**:
   ```bash
   npx playwright test
   ```

## Advanced Usage

### GitHub Actions Integration

1. **Add workflow file**:
   ```bash
   mkdir -p .github/workflows
   curl -o .github/workflows/e2e.yml https://raw.githubusercontent.com/mikopos/create-ai-e2e/main/.github/workflows/e2e.yml
   ```

2. **Configure secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add required API keys (optional):
     - `OPENAI_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `HUGGINGFACE_API_KEY`

3. **Add status badge**:
   ```markdown
   [![E2E Tests](https://github.com/your-username/your-repo/actions/workflows/e2e.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/e2e.yml)
   ```

### Custom Configuration

Create `.e2eignore` to exclude files:
```
# Example .e2eignore
src/components/legacy/
src/utils/internal/
```

### Package Scripts

Add these to your `package.json`:
```json
{
  "scripts": {
    "e2e:init": "create-ai-e2e init",
    "e2e:scan": "create-ai-e2e scan src/",
    "e2e:gen": "create-ai-e2e gen",
    "e2e:test": "playwright test"
  }
}
```

## Route Tagging

The scanner automatically detects routes in your React and Vue applications. You can enhance route detection by adding special comments above your route definitions:

```jsx
// @tags public,main
<Route path="/home" element={<Home />} />

// @tags private,admin
<Route path="/admin" element={<Admin />} />
```

### Available Tags

- **Access Level**:
  - `public` - Publicly accessible routes
  - `private` - Routes requiring authentication
  - `admin` - Admin-only routes

- **Route Type**:
  - `main` - Main application routes
  - `info` - Information pages (about, contact, etc.)
  - `dashboard` - Dashboard-related routes
  - `user` - User-specific routes

### Usage Examples

```jsx
// Public main route
// @tags public,main
<Route path="/" element={<Home />} />

// Private dashboard route
// @tags private,dashboard
<Route path="/dashboard" element={<Dashboard />} />

// Admin-only route with metadata
// @tags private,admin
<Route 
  path="/admin" 
  element={<Admin />}
  meta={{ requiresAuth: true, roles: ['admin'] }}
/>
```

These tags help the scanner generate more meaningful test cases and assertions based on the route's purpose and access level.

## Troubleshooting

- **Permission errors**: Run via `node ./dist/cli.js <command>`
- **Custom router paths**: Use `.e2eignore` to exclude files
- **Disable AI mode**: Unset API key environment variables
- **CI failures**: Check uploaded artifacts for detailed reports

## Publishing

For your own fork:
1. Create npm account
2. Generate npm access token with publish permissions
3. Add token as `NPM_TOKEN` repository secret

## License

MIT © [Marios Gavriil](https://github.com/mikopos)