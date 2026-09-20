/**
 * ============================================================
 * SKILL SWAP PLATFORM - GOOGLE APPS SCRIPT BACKEND
 * File: Code.gs
 * ============================================================
 * 
 * Database: Google Sheets (stored in Google Drive)
 * Hosting: Google Apps Script Web App
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/ and create a "New Project".
 * 2. Paste this entire file into `Code.gs`.
 * 3. (Optional) If you already have a Google Sheet created, paste its ID
 *    into SPREADSHEET_ID below. If left empty "", this script will
 *    automatically create "Skill Swap Database" in your Google Drive!
 * 4. In the function dropdown at the top, select `setupDatabase` and click "Run".
 * 5. Grant permissions when prompted (Advanced -> Go to Skill Swap Database -> Allow).
 * 6. Click "Deploy" -> "New deployment":
 *    - Select type: "Web app"
 *    - Description: "Skill Swap API v1"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (CRITICAL: must be "Anyone")
 * 7. Copy the Web App URL (ends with `/exec`) and paste it into `js/db.js` in your project!
 */

// ================= CONFIGURATION =================
// Leave empty to auto-create and find in Google Drive, or paste an existing Sheet ID:
var SPREADSHEET_ID = ''; 
var DB_SHEET_NAME = 'Skill Swap Database';

// ================= WEB APP ENTRY POINTS =================

/**
 * Handles HTTP GET requests - useful for verifying the API is alive.
 */
function doGet(e) {
  return respondJSON({
    success: true,
    message: 'Skill Swap API is live and operational.',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handles HTTP POST requests from frontend (login, signup, sessions, resources).
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respondJSON({ success: false, error: 'Empty request body.' });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return respondJSON({ success: false, error: 'Malformed JSON payload: ' + parseErr.message });
    }

    var action = data.action;
    if (!action) {
      return respondJSON({ success: false, error: 'Missing action parameter.' });
    }

    // Route to appropriate handler
    var result;
    switch (action) {
      case 'signup':
        result = handleSignup(data);
        break;
      case 'login':
        result = handleLogin(data);
        break;
      case 'getUser':
        result = handleGetUser(data);
        break;
      case 'getAllUsers':
        result = handleGetAllUsers(data);
        break;
      case 'updateUser':
        result = handleUpdateUser(data);
        break;
      case 'addResource':
        result = handleAddResource(data);
        break;
      case 'getResources':
        result = handleGetResources(data);
        break;
      case 'deleteResource':
        result = handleDeleteResource(data);
        break;
      case 'addSession':
        result = handleAddSession(data);
        break;
      case 'getSessions':
        result = handleGetSessions(data);
        break;
      case 'updateSession':
        result = handleUpdateSession(data);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return respondJSON(result);

  } catch (globalErr) {
    return respondJSON({
      success: false,
      error: 'Server error: ' + globalErr.toString()
    });
  }
}

// ================= ACTION HANDLERS =================

/**
 * User Registration
 */
function handleSignup(data) {
  var name = (data.name || '').trim();
  var email = (data.email || '').trim().toLowerCase();
  var password = data.password || '';
  var skillsOffered = Array.isArray(data.skills_offered) ? data.skills_offered : [];
  var skillsWanted = Array.isArray(data.skills_wanted) ? data.skills_wanted : [];

  if (!name || !email || !password) {
    return { success: false, error: 'Name, email, and password are required.' };
  }

  var sheet = getOrCreateSheet('Users', [
    'uid', 'name', 'email', 'password', 'skills_offered', 'skills_wanted',
    'bio', 'rank', 'exp', 'coins', 'total_sessions', 'rating', 'created_at'
  ]);

  var users = getSheetData(sheet);
  for (var i = 0; i < users.length; i++) {
    if ((users[i].email || '').toLowerCase() === email) {
      return { success: false, error: 'An account with this email already exists.' };
    }
  }

  var uid = 'user_' + Utilities.getUuid().substring(0, 8);
  var newUser = {
    uid: uid,
    name: name,
    email: email,
    password: password,
    skills_offered: JSON.stringify(skillsOffered),
    skills_wanted: JSON.stringify(skillsWanted),
    bio: '',
    rank: 'IRON II',
    exp: 0,
    coins: 100, // starting welcome bonus
    total_sessions: 0,
    rating: 5.0,
    created_at: new Date().toISOString()
  };

  appendRow(sheet, newUser);

  // Return formatted user profile
  return {
    success: true,
    user: formatUserRecord(newUser)
  };
}

/**
 * User Login
 */
function handleLogin(data) {
  var email = (data.email || '').trim().toLowerCase();
  var password = data.password || '';

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  var sheet = getOrCreateSheet('Users');
  var users = getSheetData(sheet);

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if ((u.email || '').toLowerCase() === email) {
      if (String(u.password) === String(password)) {
        return {
          success: true,
          user: formatUserRecord(u)
        };
      } else {
        return { success: false, error: 'Invalid email or access code.' };
      }
    }
  }

  return { success: false, error: 'No account registered with this email.' };
}

/**
 * Fetch a single user by UID
 */
function handleGetUser(data) {
  var uid = data.uid;
  if (!uid) return { success: false, error: 'Missing UID.' };

  var sheet = getOrCreateSheet('Users');
  var users = getSheetData(sheet);

  for (var i = 0; i < users.length; i++) {
    if (users[i].uid === uid) {
      return {
        success: true,
        user: formatUserRecord(users[i])
      };
    }
  }

  return { success: false, error: 'User not found.' };
}

/**
 * Fetch all users (keyed by UID as expected by dashboard.html)
 */
function handleGetAllUsers(data) {
  var sheet = getOrCreateSheet('Users');
  var users = getSheetData(sheet);
  var usersMap = {};

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (u.uid) {
      var formatted = formatUserRecord(u);
      delete formatted.password; // Never leak passwords
      usersMap[u.uid] = formatted;
    }
  }

  return {
    success: true,
    users: usersMap
  };
}

/**
 * Update user fields (bio, name, skills, rank, exp, coins, etc.)
 */
function handleUpdateUser(data) {
  var uid = data.uid;
  var updates = data.updates || {};

  if (!uid) return { success: false, error: 'Missing UID for update.' };

  var sheet = getOrCreateSheet('Users');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getDataRange().getValues();

  var uidColIndex = headers.indexOf('uid');
  if (uidColIndex === -1) return { success: false, error: 'Invalid table structure: uid missing.' };

  var targetRowIndex = -1;
  for (var r = 1; r < values.length; r++) {
    if (values[r][uidColIndex] === uid) {
      targetRowIndex = r + 1; // 1-indexed for Sheets
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'User with UID ' + uid + ' not found.' };
  }

  // Apply updates to columns
  for (var key in updates) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      var val = updates[key];
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        val = JSON.stringify(val);
      }
      sheet.getRange(targetRowIndex, colIdx + 1).setValue(val);
    }
  }

  // Return updated user
  return handleGetUser({ uid: uid });
}

/**
 * Add a shared resource link
 */
function handleAddResource(data) {
  var userId = data.user_id;
  var title = (data.title || '').trim();
  var desc = (data.description || '').trim();
  var fileUrl = (data.file_url || '').trim();
  var category = data.category || 'General';

  if (!userId || !title || !fileUrl) {
    return { success: false, error: 'User ID, title, and link are required.' };
  }

  var sheet = getOrCreateSheet('Resources', [
    'id', 'user_id', 'title', 'description', 'file_url', 'category', 'created_at'
  ]);

  var newRes = {
    id: 'res_' + Utilities.getUuid().substring(0, 8),
    user_id: userId,
    title: title,
    description: desc,
    file_url: fileUrl,
    category: category,
    created_at: new Date().toISOString()
  };

  appendRow(sheet, newRes);

  return {
    success: true,
    resource: newRes
  };
}

/**
 * Get all shared resources (optionally filtered by user_id)
 */
function handleGetResources(data) {
  var sheet = getOrCreateSheet('Resources', [
    'id', 'user_id', 'title', 'description', 'file_url', 'category', 'created_at'
  ]);
  var list = getSheetData(sheet);

  var userId = data.user_id;
  if (userId) {
    list = list.filter(function(r) { return r.user_id === userId; });
  }

  // Newest first
  list.sort(function(a, b) {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return {
    success: true,
    resources: list
  };
}

/**
 * Delete a resource by ID
 */
function handleDeleteResource(data) {
  var id = data.id;
  if (!id) return { success: false, error: 'Missing resource ID.' };

  var sheet = getOrCreateSheet('Resources');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getDataRange().getValues();

  var idColIdx = headers.indexOf('id');
  if (idColIdx === -1) return { success: false, error: 'Invalid Resources table.' };

  for (var r = 1; r < values.length; r++) {
    if (values[r][idColIdx] === id) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Resource not found.' };
}

/**
 * Schedule a new swap session
 */
function handleAddSession(data) {
  var teacherId = data.teacher_id;
  var studentId = data.student_id;
  var skillTaught = (data.skill_taught || '').trim();
  var date = data.date;
  var notes = (data.notes || '').trim();

  if (!teacherId || !studentId || !skillTaught || !date) {
    return { success: false, error: 'Teacher, student, skill, and date are required.' };
  }

  var sheet = getOrCreateSheet('Sessions', [
    'id', 'teacher_id', 'student_id', 'skill_taught', 'date', 'notes', 'status', 'rating', 'created_at'
  ]);

  var newSession = {
    id: 'sess_' + Utilities.getUuid().substring(0, 8),
    teacher_id: teacherId,
    student_id: studentId,
    skill_taught: skillTaught,
    date: date,
    notes: notes,
    status: 'pending',
    rating: null,
    created_at: new Date().toISOString()
  };

  appendRow(sheet, newSession);

  return {
    success: true,
    session: newSession
  };
}

/**
 * Fetch sessions involving a user (as teacher or student)
 */
function handleGetSessions(data) {
  var sheet = getOrCreateSheet('Sessions', [
    'id', 'teacher_id', 'student_id', 'skill_taught', 'date', 'notes', 'status', 'rating', 'created_at'
  ]);
  var list = getSheetData(sheet);

  var userId = data.user_id;
  var status = data.status;

  if (userId) {
    list = list.filter(function(s) {
      return s.teacher_id === userId || s.student_id === userId;
    });
  }

  if (status) {
    list = list.filter(function(s) {
      return s.status === status;
    });
  }

  // Sort by date descending
  list.sort(function(a, b) {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  return {
    success: true,
    sessions: list
  };
}

/**
 * Update session (complete swap, add rating)
 */
function handleUpdateSession(data) {
  var id = data.id;
  var updates = data.updates || {};

  if (!id) return { success: false, error: 'Missing session ID.' };

  var sheet = getOrCreateSheet('Sessions');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getDataRange().getValues();

  var idColIdx = headers.indexOf('id');
  if (idColIdx === -1) return { success: false, error: 'Invalid Sessions table.' };

  var targetRowIndex = -1;
  for (var r = 1; r < values.length; r++) {
    if (values[r][idColIdx] === id) {
      targetRowIndex = r + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'Session with ID ' + id + ' not found.' };
  }

  for (var key in updates) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(targetRowIndex, colIdx + 1).setValue(updates[key]);
    }
  }

  return { success: true };
}

// ================= DATABASE / SPREADSHEET HELPERS =================

/**
 * Gets or creates the main Google Spreadsheet database in Google Drive.
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }

  // Search Drive for existing database file
  var files = DriveApp.getFilesByName(DB_SHEET_NAME);
  while (files.hasNext()) {
    var file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(file.getId());
    }
  }

  // If not found, create new Spreadsheet
  var newSS = SpreadsheetApp.create(DB_SHEET_NAME);
  Logger.log('Created new Database Spreadsheet: ' + newSS.getUrl() + ' (ID: ' + newSS.getId() + ')');
  return newSS;
}

/**
 * Gets or creates a specific sheet tab with standard column headers.
 */
function getOrCreateSheet(sheetName, defaultHeaders) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Delete default Sheet1 if present and unused
    var defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
      try { ss.deleteSheet(defaultSheet); } catch(e) {}
    }
  }

  if (defaultHeaders && sheet.getLastRow() === 0) {
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight('bold').setBackground('#4361ee').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Reads all rows from a sheet as an array of JavaScript objects.
 */
function getSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return rows.map(function(row) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var header = headers[c];
      var cellVal = row[c];
      obj[header] = cellVal;
    }
    return obj;
  });
}

/**
 * Appends an object as a new row based on the sheet's header row.
 */
function appendRow(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    var val = obj[h];
    if (val === undefined || val === null) return '';
    return val;
  });
  sheet.appendRow(row);
}

/**
 * Parses user fields from raw sheet format to proper JS types.
 */
function formatUserRecord(raw) {
  var skillsOffered = [];
  var skillsWanted = [];

  try {
    skillsOffered = typeof raw.skills_offered === 'string' && raw.skills_offered.startsWith('[')
      ? JSON.parse(raw.skills_offered)
      : (raw.skills_offered ? String(raw.skills_offered).split(',').map(function(s){return s.trim();}) : []);
  } catch(e) {
    skillsOffered = raw.skills_offered ? [String(raw.skills_offered)] : [];
  }

  try {
    skillsWanted = typeof raw.skills_wanted === 'string' && raw.skills_wanted.startsWith('[')
      ? JSON.parse(raw.skills_wanted)
      : (raw.skills_wanted ? String(raw.skills_wanted).split(',').map(function(s){return s.trim();}) : []);
  } catch(e) {
    skillsWanted = raw.skills_wanted ? [String(raw.skills_wanted)] : [];
  }

  return {
    uid: String(raw.uid || ''),
    name: String(raw.name || ''),
    email: String(raw.email || ''),
    skills_offered: skillsOffered,
    skills_wanted: skillsWanted,
    bio: String(raw.bio || ''),
    rank: String(raw.rank || 'IRON II'),
    exp: Number(raw.exp) || 0,
    coins: Number(raw.coins) || 0,
    total_sessions: Number(raw.total_sessions) || 0,
    rating: Number(raw.rating) || 5.0,
    created_at: raw.created_at || new Date().toISOString()
  };
}

/**
 * Formats JSON response with proper ContentService mime type
 */
function respondJSON(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= TEST & SETUP RUNNER =================

/**
 * Run this function inside Google Apps Script Editor to:
 * 1. Prompt Google to show authorization dialog ("Review permissions").
 * 2. Automatically create the "Skill Swap Database" Google Sheet in Google Drive.
 * 3. Initialize all 3 sheets: Users, Resources, Sessions.
 */
function setupDatabase() {
  Logger.log('Initializing Skill Swap database in Google Drive...');
  var ss = getSpreadsheet();
  
  getOrCreateSheet('Users', [
    'uid', 'name', 'email', 'password', 'skills_offered', 'skills_wanted',
    'bio', 'rank', 'exp', 'coins', 'total_sessions', 'rating', 'created_at'
  ]);
  
  getOrCreateSheet('Resources', [
    'id', 'user_id', 'title', 'description', 'file_url', 'category', 'created_at'
  ]);
  
  getOrCreateSheet('Sessions', [
    'id', 'teacher_id', 'student_id', 'skill_taught', 'date', 'notes', 'status', 'rating', 'created_at'
  ]);

  Logger.log('SUCCESS! Database initialized.');
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('You can now click Deploy -> New deployment -> Web app to publish your API.');
}
