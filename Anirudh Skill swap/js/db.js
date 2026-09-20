// ============================================================
// SKILL SWAP PLATFORM - Frontend API Wrapper Client
// File path: js/db.js
// ============================================================
// Live Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbwyMNF32yy0-7wDGzELj76dayUcPOHXmZ11SKZsc7P2Yqniv04VIbumCJuhOim_1yv-/exec';
class SkillSwapDB {
// Sends an HTTP POST request to Google Apps Script and handles server errors.
static async _callAPI(action, data) {
try {
const response = await fetch(API_URL, {
method: 'POST',
// Using text/plain prevents browser CORS preflight (OPTIONS) failure when hosted on GitHub Pages
headers: { 'Content-Type': 'text/plain;charset=utf-8' },
body: JSON.stringify({ action, ...data }) // Merges action name and data arguments
});
const result = await response.json();
if (!result.success) {
throw new Error(result.error || 'Server error occurred during API request.');
}
return result; // Returns successful JSON payload
} catch (error) {
console.error(`API Error on action [${action}]:`, error);
throw error; // Propagate the error so UI forms can display it in alert red boxes
}
}
// Registers a new classmate's credentials
static async signup(name, email, password, skillsOffered = [], skillsWanted = []) {
return this._callAPI('signup', {
name, email, password,
skills_offered: skillsOffered,
skills_wanted: skillsWanted
});
}
// Verifies email and password credentials
static async login(email, password) {
return this._callAPI('login', { email, password });
}
// Returns user profile data matching a UID
static async getUser(uid) {
return this._callAPI('getUser', { uid });
}
// Retrieves all profiles for the discover directory
static async getAllUsers() {
return this._callAPI('getAllUsers', {});
}
// Updates fields (bio, name, EXP, coins) on the user record in database
static async updateUser(uid, updates) {
return this._callAPI('updateUser', { uid, updates });
}
// Uploads metadata of shared resource details
static async addResource(userId, title, description, fileUrl, category = 'General') {
return this._callAPI('addResource', {
user_id: userId,
title,
description,
file_url: fileUrl,
category
});
}
// Lists shared learning links from the database
static async getResources(userId = null) {
return this._callAPI('getResources', { user_id: userId });
}
// Deletes an uploaded resource link
static async deleteResource(id) {
return this._callAPI('deleteResource', { id });
}
// Creates a teaching session booking between classmates
static async addSession(teacherId, studentId, skillTaught, date, notes = '') {
return this._callAPI('addSession', {
teacher_id: teacherId,
student_id: studentId,
skill_taught: skillTaught,
date,
notes
});
}
// Lists scheduled sessions involving the current student
static async getSessions(userId = null, status = null) {
return this._callAPI('getSessions', { user_id: userId, status });
}
// Updates session record (complete, cancel, feedback score)
static async updateSession(id, updates) {
return this._callAPI('updateSession', { id, updates });
}
}