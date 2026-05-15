// ═══════════════════════════════════════════════════════════
//  Registration Form – Google Apps Script Backend
// ═══════════════════════════════════════════════════════════

const SPREADSHEET_ID = '1uO3NtSsmpJC7p1QbQ9nfM5HILuBHYH-t03RVzXU1WnE';
const SHEET_NAME     = 'Registrations';

const HEADERS = [
  'Timestamp',
  'Purpose',
  'First Name',
  'Last Name',
  'Age',
  'Sex',
  'Phone',
  'Email',
  'Address',
  'Post Code',
  'Remark',
  'Adults (18+)',
  'Youth (8-17)',
  'Under 8',
];

// Column indices (0-based) for duplicate check
const COL_PURPOSE = 1;
const COL_EMAIL   = 7;

function doPost(e) {
  try {
    return saveRegistration(JSON.parse(e.postData.contents));
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.firstName) {
      return saveRegistration(e.parameter);
    }
    if (e.parameter.action === 'shorten' && e.parameter.url) {
      return shortenUrl(e.parameter.url);
    }
  }
  return jsonResponse({ status: 'Registration API is running' });
}

function shortenUrl(longUrl) {
  try {
    const res   = UrlFetchApp.fetch('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(longUrl));
    const short = res.getContentText().trim();
    return jsonResponse({ short: short });
  } catch (err) {
    return jsonResponse({ short: null, error: err.toString() });
  }
}

// ── Run once to authorize UrlFetchApp (needed for URL shortening) ─
function testShorten() {
  const result = shortenUrl('https://asvdj.netlify.app/');
  Logger.log(JSON.stringify(result));
}

// ── Run once to fix column headers in existing sheet ──────────────
function updateHeaders() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('Sheet not found!'); return; }
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setValues([HEADERS]);
  range.setFontWeight('bold');
  range.setBackground('#4F46E5');
  range.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  Logger.log('Headers updated: ' + HEADERS.join(', '));
}

// ── Run to test email (sends to your own Gmail) ────────────────────
function testEmail() {
  const myEmail = Session.getActiveUser().getEmail();
  MailApp.sendEmail({
    to      : myEmail,
    subject : 'Test — Registration Script Email Working',
    body    : 'If you received this, the email confirmation is working correctly.',
  });
  Logger.log('Test email sent to: ' + myEmail);
}

// ── Run to test sheet saving ───────────────────────────────────────
function testSave() {
  saveRegistration({
    purpose  : 'Test Event',
    firstName: 'Test',
    lastName : 'User',
    age      : '30',
    sex      : 'Male',
    phone    : '9999999999',
    email    : 'test@example.com',
    address  : 'Test Address, Mumbai',
    postCode : '400001',
    remark   : '',
    adults   : '2',
    youth    : '1',
    under8   : '0',
  });
  Logger.log('testSave completed — check your sheet!');
}

function saveRegistration(p) {
  try {
    const sheet   = getOrCreateSheet();
    const email   = (p.email   || '').trim().toLowerCase();
    const purpose = (p.purpose || '').trim();

    // Duplicate check: same email + same event
    if (email) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        const rowEmail   = String(rows[i][COL_EMAIL]   || '').trim().toLowerCase();
        const rowPurpose = String(rows[i][COL_PURPOSE] || '').trim();
        if (rowEmail === email && rowPurpose === purpose) {
          return jsonResponse({ success: false, duplicate: true, error: 'Email already registered for this event.' });
        }
      }
    }

    sheet.appendRow([
      new Date(),
      p.purpose   || '',
      p.firstName || '',
      p.lastName  || '',
      p.age       || '',
      p.sex       || '',
      p.phone     || '',
      p.email     || '',
      p.address   || '',
      p.postCode  || '',
      p.remark    || '',
      p.adults    || '0',
      p.youth     || '0',
      p.under8    || '0',
    ]);

    // Email is in its own try-catch so a mail error never blocks the sheet save
    if (email) {
      try { sendConfirmationEmail(p); } catch (mailErr) { Logger.log('Email error: ' + mailErr); }
    }

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function sendConfirmationEmail(p) {
  const name      = ((p.firstName || '') + ' ' + (p.lastName || '')).trim();
  const purpose   = p.purpose    || 'the event';
  const eventDate = p.eventDate  || '';
  const eventTime = p.eventTime  || '';
  const eventVenue= p.eventVenue || '';
  const subject   = `Registration Confirmed – ${purpose}`;

  const detailLines = [
    eventDate  ? `Date:  ${eventDate}`  : '',
    eventTime  ? `Time:  ${eventTime}`  : '',
    eventVenue ? `Venue: ${eventVenue}` : '',
  ].filter(Boolean).join('\n');

  const plainBody = [
    `Dear ${name},`,
    '',
    `Thank you for registering for ${purpose}!`,
    'Your registration has been successfully recorded.',
    '',
    detailLines,
    '',
    'We look forward to seeing you. If you have any questions, please reply to this email.',
    '',
    'Best regards,',
    'The Organising Team',
  ].filter(l => l !== undefined).join('\n');

  const detailCards = [
    eventDate  ? `<div style="flex:1;min-width:120px;background:#F9FAFB;border-radius:8px;padding:0.75rem 1rem;"><div style="font-size:0.65rem;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.2rem;">Date</div><div style="font-size:0.9rem;font-weight:700;color:#111827;">${eventDate}</div></div>` : '',
    eventTime  ? `<div style="flex:1;min-width:120px;background:#F9FAFB;border-radius:8px;padding:0.75rem 1rem;"><div style="font-size:0.65rem;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.2rem;">Time</div><div style="font-size:0.9rem;font-weight:700;color:#111827;">${eventTime}</div></div>` : '',
    eventVenue ? `<div style="flex:1;min-width:120px;background:#F9FAFB;border-radius:8px;padding:0.75rem 1rem;"><div style="font-size:0.65rem;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.2rem;">Venue</div><div style="font-size:0.9rem;font-weight:700;color:#111827;">${eventVenue}</div></div>` : '',
  ].filter(Boolean).join('');

  const htmlBody = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
  <div style="background:linear-gradient(135deg,#4338CA 0%,#7C3AED 100%);padding:2rem 1.5rem;text-align:center;">
    <p style="color:rgba(255,255,255,0.7);font-size:0.68rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 0.5rem;">Registration Confirmed</p>
    <h1 style="color:#fff;font-size:1.25rem;font-weight:800;margin:0;line-height:1.3;">${purpose}</h1>
  </div>
  <div style="padding:1.75rem 1.5rem;">
    <p style="color:#374151;line-height:1.7;margin:0 0 0.75rem;">Dear <strong>${name}</strong>,</p>
    <p style="color:#374151;line-height:1.7;margin:0 0 1.25rem;">
      Thank you for registering! Your spot has been confirmed. Here are your event details:
    </p>
    ${detailCards ? `<div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.25rem;">${detailCards}</div>` : ''}
    <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:8px;padding:0.875rem 1.25rem;margin-bottom:1.25rem;">
      <p style="color:#15803D;font-weight:600;margin:0;">✅ &nbsp;You are registered</p>
    </div>
    <p style="color:#374151;line-height:1.7;margin:0 0 1.5rem;">
      We look forward to seeing you at the event. If you have any questions, simply reply to this email.
    </p>
    <p style="color:#6B7280;font-size:0.875rem;margin:0;">
      Best regards,<br>
      <strong>The Organising Team</strong>
    </p>
  </div>
</div>`.trim();

  MailApp.sendEmail({
    to      : p.email,
    subject : subject,
    body    : plainBody,
    htmlBody: htmlBody,
  });
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4F46E5');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 165);  // Timestamp
    sheet.setColumnWidth(7, 145);  // Phone
    sheet.setColumnWidth(8, 210);  // Email
    sheet.setColumnWidth(9, 290);  // Address
  }

  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
