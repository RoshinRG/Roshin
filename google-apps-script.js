/**
 * Google Apps Script — Contact Form → Google Sheets
 * ──────────────────────────────────────────────────
 * SETUP INSTRUCTIONS:
 *
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1n1GpO6Wj8EEKGKaYCv8H2WBk3KDnIAEYyb7Qkpcx-QM/edit
 *
 * 2. Click Extensions → Apps Script
 *
 * 3. Delete any existing code and paste THIS ENTIRE FILE's contents
 *
 * 4. Click the 💾 Save button (Ctrl + S)
 *
 * 5. Click "Deploy" → "New deployment"
 *
 * 6. Click the ⚙️ gear icon next to "Select type" → choose "Web app"
 *
 * 7. Set these options:
 *    - Description: "Portfolio Contact Form"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 *
 * 8. Click "Deploy"
 *
 * 9. Click "Authorize access" → choose your Google account → Allow
 *
 * 10. COPY the Web App URL (looks like:
 *     https://script.google.com/macros/s/AKfycb.../exec)
 *
 * 11. Paste that URL in script.js where it says:
 *     const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
 *
 * That's it! Your contact form will now save to Google Sheets.
 * ──────────────────────────────────────────────────
 */

// Spreadsheet URL
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n1GpO6Wj8EEKGKaYCv8H2WBk3KDnIAEYyb7Qkpcx-QM/edit';

/**
 * Handles POST requests from the contact form.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.openByUrl(SHEET_URL).getActiveSheet();

    // Add headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message']);

      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#d4af37');
      headerRange.setFontColor('#000000');
    }

    // Append the form data
    sheet.appendRow([
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      data.name    || '',
      data.email   || '',
      data.phone   || '',
      data.subject || '',
      data.message || ''
    ]);

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: 'Message saved to Google Sheets!' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for testing the deployment).
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'active',
      message: 'Roshin RG Portfolio Contact Form endpoint is live!'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
