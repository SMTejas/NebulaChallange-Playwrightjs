# Patent Date Calculator

Playwright automation script to extract and calculate date differences from patent information.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Chromium browser:
```bash
npx playwright install chromium
```

## Usage

Run without arguments (uses example from search box placeholder):
```bash
npm test
```

Or run directly:
```bash
node patentDateCalculator.js
```

Run with custom search term:
```bash
node patentDateCalculator.js "ropivacaine"
node patentDateCalculator.js "paracetamol"
```

**Note:** If no search term is provided, the script will automatically use the example term from the search box placeholder on the website.

## Configuration

### Headless Mode

Edit `patentDateCalculator.js` line 156:
```javascript
browser = await chromium.launch({
  headless: true,  // Change to true for headless mode
  args: ['--incognito']
});
```

### Timeout Settings

Edit `patentDateCalculator.js` line 167:
```javascript
await page.goto('https://patinformed.wipo.int/', {
  waitUntil: 'networkidle',
  timeout: 60000  // Adjust timeout in milliseconds
});
```
