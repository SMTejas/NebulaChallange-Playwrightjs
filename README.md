# Patent Date Calculator

A Playwright automation script that searches patent information on WIPO PatInformed, extracts key dates, and calculates the differences between them.

## What It Does

The script automates the following workflow:
1. Opens the WIPO PatInformed website (https://patinformed.wipo.int/)
2. Searches for a pharmaceutical patent by INN (International Nonproprietary Name)
3. Clicks on the first search result
4. Extracts three key dates: Filing Date, Publication Date, and Grant Date
5. Calculates and displays the differences between these dates in days

## How Search Works Without Hardcoding

The script is smart about search terms:
- **With argument:** Run `node patentDateCalculator.js "ropivacaine"` - uses your term
- **Without argument:** Automatically reads the example from the search box placeholder (like "zavegepant") and uses it
- This means you can run it without any arguments and it will still work!

## Approach

1. **Browser Automation:** Uses Playwright to control Chrome in incognito mode
2. **Flexible Element Detection:** Tries multiple CSS selectors to find elements (handles website changes)
3. **Smart Date Extraction:** Searches page content for keywords like "filing date", "publication date", "grant date"
4. **Pattern Matching:** Uses regex to extract dates in YYYY-MM-DD format
5. **Error Handling:** Gracefully handles missing elements or dates

## Installation & Testing

```bash
npm install && npx playwright install chromium
npm test
```

## Usage

Run with any pharmaceutical INN:
```bash
node patentDateCalculator.js "ropivacaine"
node patentDateCalculator.js "paracetamol"
```

Or run without arguments (uses example from website):
```bash
node patentDateCalculator.js
```

## Configuration

**Headless Mode** (line 157):
```javascript
headless: false,  // Change to true to hide browser
```

**Timeout** (line 167):
```javascript
timeout: 60000  // Adjust in milliseconds
```
