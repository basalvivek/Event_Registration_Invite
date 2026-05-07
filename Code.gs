// ═══════════════════════════════════════════════════════════
//  Registration Form – Google Apps Script Backend
// ═══════════════════════════════════════════════════════════

// STEP 1: Paste your Google Sheet ID here
// (Open your Sheet → look at the URL → copy the long ID between /d/ and /edit)
const SPREADSHEET_ID = '1uO3NtSsmpJC7p1QbQ9nfM5HILuBHYH-t03RVzXU1WnE';

const SHEET_NAME = 'Registrations';

const HEADERS = [
  'Timestamp',
  'Purpose',
  'First Name',
  'Last Name',
  'Age',
  'Sex',
  'Email',
  'Address',
  'Post Code',
  'Remark',
];

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      new Date(),
      data.purpose   ?? '',
      data.firstName ?? '',
      data.lastName  ?? '',
      data.age       ?? '',
      data.sex       ?? '',
      data.email     ?? '',
      data.address   ?? '',
      data.postCode  ?? '',
      data.remark    ?? '',
    ]);

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  // If form data is present, save it
  if (e.parameter && e.parameter.firstName) {
    try {
      const p     = e.parameter;
      const sheet = getOrCreateSheet();
      sheet.appendRow([
        new Date(),
        p.purpose   || '',
        p.firstName || '',
        p.lastName  || '',
        p.age       || '',
        p.sex       || '',
        p.email     || '',
        p.address   || '',
        p.postCode  || '',
        p.remark    || '',
      ]);
      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ success: false, error: err.toString() });
    }
  }
  return jsonResponse({ status: 'Registration API is running' });
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headerRow = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRow.setValues([HEADERS]);
    headerRow.setFontWeight('bold');
    headerRow.setBackground('#4F46E5');
    headerRow.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(7, 200);
    sheet.setColumnWidth(8, 280);
  }

  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
