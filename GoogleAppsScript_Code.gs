/**
 * Gunash Padmawati Bibha Bhaban - Booking Enquiry to Google Sheet
 * 
 * SETUP (do once):
 * 1. Create a Google Sheet. In the first row (headers), add exactly these column names:
 *    Name | Phone | Duration | Date | Details | Timestamp | WhatsApp Reply Link
 *    (You can reorder; script matches by header name.)
 * 2. In Apps Script: Run setup() once (with the spreadsheet open) to save the sheet ID.
 * 3. Deploy as Web app: Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone (or Anyone, even anonymous)
 * 4. Copy the Web app URL into index.html as scriptURL.
 */

var sheetName = 'Sheet1'; // Tab name in your spreadsheet (e.g. Sheet1)
var scriptProp = PropertiesService.getScriptProperties();

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', doc.getId());
}

/** Called when someone opens the script URL in a browser (GET). Prevents "doGet not found" error. */
function doGet(e) {
  return ContentService.createTextOutput(
    'Gunash Padmawati Bibha Bhaban – Enquiry form. Submissions are sent via POST from the website.'
  ).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Could not get lock' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
    var sheet = doc.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" not found. Check the tab name.');
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;

    var newRow = headers.map(function(header) {
      var h = String(header).trim();
      if (h === 'Timestamp') {
        return new Date();
      }
      if (h === 'WhatsApp Reply Link') {
        var phone = (e.parameter['Phone'] || '').toString().replace(/\D/g, '');
        var name = e.parameter['Name'] || '';
        var date = e.parameter['Date'] || '';
        if (phone && name) {
          if (phone.length === 10) phone = '91' + phone;
          var msg = "Hello " + name + ", thank you for enquiring at Gunash Padmawati Bibha Bhaban for " + date + ". We have reviewed your request...";
          return "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg);
        }
        return '';
      }
      return e.parameter[h] != null ? e.parameter[h] : '';
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    var ownerEmail = "axomiyaonline@gmail.com";
    try {
      MailApp.sendEmail(ownerEmail, "New Enquiry: " + (e.parameter['Name'] || 'Unknown'),
        "New booking enquiry received.\n\nCheck the Google Sheet for the WhatsApp Reply Link.");
    } catch (mailErr) {
      // Log but don't fail the submission
      console.warn('Email failed: ' + mailErr);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      lock.releaseLock();
    } catch (releaseErr) {}
  }
}
