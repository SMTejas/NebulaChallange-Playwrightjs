const { chromium } = require('playwright');

/**
 * Calculate the difference between two dates in days
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Absolute difference in days
 */
function calculateDateDifference(date1, date2) {
  try {
    // Calculate difference in milliseconds
    const diffInMs = Math.abs(date2 - date1);
    // Convert milliseconds to days
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
  } catch (error) {
    console.error('Error calculating date difference:', error.message);
    return 0;
  }
}

/**
 * Parse date string to Date object
 * Handles various date formats
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseDate(dateString) {
  try {
    if (!dateString || dateString.trim() === '') {
      return null;
    }
    
    // Remove any extra whitespace
    dateString = dateString.trim();
    
    // Try to parse the date
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error.message);
    return null;
  }
}

/**
 * Format date to YYYY-MM-DD format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  try {
    if (!date) return 'N/A';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error.message);
    return 'N/A';
  }
}

/**
 * Extract dates from a table/section on the page
 * @param {Object} page - Playwright page object
 * @param {string} sectionSelector - Selector for the section/table to search
 * @returns {Object} Object containing filing, publication, and grant dates
 */
async function extractDatesFromSection(page, sectionSelector) {
  try {
    const dates = {
      filingDate: null,
      publicationDate: null,
      grantDate: null
    };

    // Wait a bit for content to load
    await page.waitForTimeout(1000);

    // Get the section content
    const sectionContent = await page.textContent(sectionSelector).catch(() => '');
    
    if (!sectionContent) {
      return dates;
    }

    // Search for filing date keywords
    const filingKeywords = ['filing date', 'filed', 'application date'];
    // Search for publication date keywords
    const publicationKeywords = ['publication date', 'published', 'pub. date'];
    // Search for grant date keywords
    const grantKeywords = ['grant date', 'granted', 'patent grant'];

    // Extract dates from the section
    const rows = await page.locator(`${sectionSelector} tr, ${sectionSelector} div`).all();
    
    for (const row of rows) {
      const rowText = await row.textContent().catch(() => '');
      const lowerRowText = rowText.toLowerCase();
      
      // Check for filing date
      if (!dates.filingDate && filingKeywords.some(keyword => lowerRowText.includes(keyword))) {
        const dateMatch = rowText.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
        if (dateMatch) {
          dates.filingDate = dateMatch[1].replace(/\//g, '-');
        }
      }
      
      // Check for publication date
      if (!dates.publicationDate && publicationKeywords.some(keyword => lowerRowText.includes(keyword))) {
        const dateMatch = rowText.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
        if (dateMatch) {
          dates.publicationDate = dateMatch[1].replace(/\//g, '-');
        }
      }
      
      // Check for grant date
      if (!dates.grantDate && grantKeywords.some(keyword => lowerRowText.includes(keyword))) {
        const dateMatch = rowText.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
        if (dateMatch) {
          dates.grantDate = dateMatch[1].replace(/\//g, '-');
        }
      }
    }

    return dates;
  } catch (error) {
    console.error(`Error extracting dates from section:`, error.message);
    return {
      filingDate: null,
      publicationDate: null,
      grantDate: null
    };
  }
}

/**
 * Main function to automate the patent date calculation
 */
async function automatePatentDateCalculation() {
  let browser;
  
  try {
    console.log('Starting automation...\n');
    
    // Launch browser in incognito mode
    browser = await chromium.launch({
      headless: false,
      args: ['--incognito']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Navigating to patent website...');
    await page.goto('https://patinformed.wipo.int/', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    console.log('Page loaded\n');
    
    // Perform search
    try {
      const searchBoxSelectors = [
        'input.searchField',
        'input[class="searchField"]',
        'input[placeholder*="Search"]',
        'input[type="text"]'
      ];
      
      let searchBox = null;
      
      for (const selector of searchBoxSelectors) {
        try {
          searchBox = page.locator(selector).first();
          if (await searchBox.isVisible({ timeout: 3000 })) {
            console.log(`Search box found: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (searchBox && await searchBox.isVisible()) {
        let searchTerm = process.argv[2];
        
        // If no search term provided, extract from placeholder
        if (!searchTerm) {
          const placeholder = await searchBox.getAttribute('placeholder');
          if (placeholder) {
            // Extract example term from placeholder like "Search pharmaceutical patents by INN - Ex: zavegepant"
            const match = placeholder.match(/Ex:\s*(\w+)/i);
            if (match) {
              searchTerm = match[1];
              console.log(`No search term provided, using example from placeholder: "${searchTerm}"`);
            } else {
              console.log('No search term provided and could not extract from placeholder');
              return;
            }
          } else {
            console.log('No search term provided');
            return;
          }
        }
        
        console.log(`Searching for: "${searchTerm}"`);
        
        await searchBox.fill(searchTerm);
        await page.waitForTimeout(1000);
        await searchBox.press('Enter');
        
        console.log('Waiting for search results...');
        await page.waitForTimeout(3000);
      } else {
        console.log('Search box not found\n');
      }
      
    } catch (error) {
      console.log('Error with search:', error.message);
    }
    
    // Handle disclaimer popup that appears after search
    try {
      await page.waitForTimeout(2000);
      
      const consentSelectors = [
        'button:has-text("I have read and agree to the terms")',
        'button:has-text("agree to the terms")',
        'button:has-text("Accept")',
        'button:has-text("Accept all")',
        'button:has-text("I agree")',
        'button:has-text("OK")',
        'button:has-text("Agree")',
        '[id*="accept"]',
        '[class*="accept"]',
        '.cookie-accept',
        '#cookie-accept'
      ];
      
      for (const selector of consentSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            console.log('Disclaimer accepted\n');
            await page.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    } catch (error) {
      // No disclaimer popup found, continue
    }
    
    // Find and click first patent result
    console.log('Looking for patent results...');
    
    try {
      // Results appear as <li> elements with class "medNum card titlePreview"
      const patentResultSelectors = [
        'li.medNum.card.titlePreview',
        'li.titlePreview',
        'li.medNum',
        '.titlePreview',
        'li.card',
        'a:has-text("Patents")',
        'tr:has-text("Patents") a',
        '.result-title:has-text("Patents")',
        'td:has-text("Patents") a',
        '[data-testid*="result"] a',
        'table tr td a',
        '.result a',
        'a[href*="patent"]'
      ];
      
      let clicked = false;
      
      for (const selector of patentResultSelectors) {
        try {
          const firstResult = page.locator(selector).first();
          if (await firstResult.isVisible({ timeout: 3000 })) {
            await firstResult.click();
            console.log('Clicked first patent result\n');
            clicked = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!clicked) {
        const firstLink = page.locator('table a, .results a, .result a').first();
        await firstLink.click();
        console.log('Clicked first result\n');
      }
      
      await page.waitForTimeout(3000);
      
    } catch (error) {
      console.error('Error clicking result:', error.message);
      throw error;
    }
    
    console.log('Extracting patent dates...\n');
    
    // Initialize date variables
    let filingDate = null;
    let publicationDate = null;
    let grantDate = null;
    
    // Try to find dates in multiple tables/sections
    const tableSelectors = [
      'table:first-of-type',
      '.patent-details table',
      '.details-section',
      '[class*="patent"] table',
      'table',
      '.info-box',
      '.patent-info'
    ];
    
    // Try each table/section until we find all dates
    for (let i = 0; i < tableSelectors.length && (!filingDate || !publicationDate || !grantDate); i++) {
      try {
        const selector = tableSelectors[i];
        console.log(`Searching section ${i + 1}...`);
        
        const tables = page.locator(selector);
        const count = await tables.count();
        
        for (let j = 0; j < count && (!filingDate || !publicationDate || !grantDate); j++) {
          const dates = await extractDatesFromSection(page, `${selector}:nth-of-type(${j + 1})`);
          
          // Update dates if found and not already set
          if (dates.filingDate && !filingDate) {
            filingDate = dates.filingDate;
            console.log(`  Found filing date: ${filingDate}`);
          }
          if (dates.publicationDate && !publicationDate) {
            publicationDate = dates.publicationDate;
            console.log(`  Found publication date: ${publicationDate}`);
          }
          if (dates.grantDate && !grantDate) {
            grantDate = dates.grantDate;
            console.log(`  Found grant date: ${grantDate}`);
          }
        }
      } catch (error) {
        // Continue to next table
      }
    }
    
    console.log('\nExtracted Dates:');
    console.log('─────────────────────────────────────');
    
    // Parse dates
    const filingDateObj = filingDate ? parseDate(filingDate) : null;
    const publicationDateObj = publicationDate ? parseDate(publicationDate) : null;
    const grantDateObj = grantDate ? parseDate(grantDate) : null;
    
    // Format and display dates
    if (publicationDateObj) {
      console.log(`Publication date: ${formatDate(publicationDateObj)}`);
    }
    if (grantDateObj) {
      console.log(`Grant date: ${formatDate(grantDateObj)}`);
    }
    if (filingDateObj) {
      console.log(`Filing date: ${formatDate(filingDateObj)}`);
    }
    
    console.log('\nDate Differences:');
    console.log('─────────────────────────────────────');
    
    // Calculate and display differences
    if (publicationDateObj && grantDateObj) {
      const diff = calculateDateDifference(publicationDateObj, grantDateObj);
      console.log(`Difference between Publication date and Grant date are ${diff} days.`);
    } else {
      console.log('Cannot calculate difference between Publication date and Grant date (one or both dates missing).');
    }
    
    if (publicationDateObj && filingDateObj) {
      const diff = calculateDateDifference(publicationDateObj, filingDateObj);
      console.log(`Difference between Publication date and Filing date are ${diff} days.`);
    } else {
      console.log('Cannot calculate difference between Publication date and Filing date (one or both dates missing).');
    }
    
    if (grantDateObj && filingDateObj) {
      const diff = calculateDateDifference(grantDateObj, filingDateObj);
      console.log(`Difference between Grant date and Filing date are ${diff} days.`);
    } else {
      console.log('Cannot calculate difference between Grant date and Filing date (one or both dates missing).');
    }
    
    console.log('\nAutomation completed');
    
    // Keep browser open for a few seconds
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\nError during automation:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nBrowser closed');
    }
  }
}

// Run the automation
automatePatentDateCalculation();
