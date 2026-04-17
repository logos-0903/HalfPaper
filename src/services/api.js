/**
 * 业务 API 统一出口
 * 按功能分区：Auth / Diary / Comment / Favorite / Firefly / Admin / Settings
 */
import { request } from './http'

function cleanObject(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
  )
}

// ── Auth ──────────────────────────────────────────────

export function sendEmailVerify(email, purpose = 'register') {
  return request({
    url: '/auth/emailverify',
    method: 'get',
    params: cleanObject({ email, purpose })
  })
}

export function register(payload) {
  return request({
    url: '/auth/register',
    method: 'post',
    data: payload
  })
}

export function login(payload) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: payload
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function forgetPassword(payload) {
  return request({
    url: '/auth/password/forget',
    method: 'post',
    data: payload
  })
}

// ── Session ──────────────────────────────────────────

export function getSessionList() {
  return request({
    url: '/session/list',
    method: 'get'
  })
}

export function revokeSession(sessionId) {
  return request({
    url: '/session/revoke',
    method: 'post',
    data: { session_id: sessionId }
  })
}

export function revokeAllSessions() {
  return request({
    url: '/session/revoke-all',
    method: 'post'
  })
}

// ── Message ──────────────────────────────────────────

export function listMessages(params = {}) {
  return request({
    url: '/message/list',
    method: 'get',
    params: cleanObject(params)
  })
}

export function getUnreadMessageCount() {
  return request({
    url: '/message/unread',
    method: 'get'
  })
}

export function markMessageRead(messageId) {
  return request({
    url: '/message/read',
    method: 'post',
    data: { message_id: messageId }
  })
}

export function markAllMessagesRead(category) {
  return request({
    url: '/message/read-all',
    method: 'post',
    data: cleanObject({ category })
  })
}

// ── User ─────────────────────────────────────────────

export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

export function getUserDetail(userUuid) {
  return request({
    url: '/user/detail',
    method: 'get',
    params: { user_uuid: userUuid }
  })
}

export function listSchools(params = {}) {
  return request({
    url: '/user/school/list',
    method: 'get',
    params: cleanObject(params)
  })
}

export function changeEmail(payload) {
  return request({
    url: '/user/email',
    method: 'post',
    data: payload
  })
}

export function changePassword(payload) {
  return request({
    url: '/user/password',
    method: 'post',
    data: payload
  })
}

export function deleteAccount(payload) {
  return request({
    url: '/user/delete',
    method: 'post',
    data: payload
  })
}

export function updateUserProfile(payload) {
  return request({
    url: '/user/profile',
    method: 'post',
    data: payload
  })
}

// ── Diary ────────────────────────────────────────────

export function listDiaries(params = {}) {
  return request({
    url: '/diary/list',
    method: 'get',
    params: cleanObject(params)
  })
}

export function getDiaryDetail(diaryId) {
  return request({
    url: '/diary/detail',
    method: 'get',
    params: { diary_id: diaryId }
  })
}

export function createDiary(payload) {
  return request({
    url: '/diary/create',
    method: 'post',
    data: payload
  })
}

export function updateDiary(payload) {
  return request({
    url: '/diary/update',
    method: 'post',
    data: payload
  })
}

export function deleteDiary(diaryId) {
  return request({
    url: '/diary/delete',
    method: 'post',
    data: { diary_id: diaryId }
  })
}

export function likeDiary(diaryId) {
  return request({
    url: '/diary/like',
    method: 'post',
    data: { diary_id: diaryId }
  })
}

export function unlikeDiary(diaryId) {
  return request({
    url: '/diary/unlike',
    method: 'post',
    data: { diary_id: diaryId }
  })
}

// ── Image ────────────────────────────────────────────

export function getImagePresign(payload) {
  return request({
    url: '/image/presign',
    method: 'post',
    data: payload
  })
}

// ── Comment ──────────────────────────────────────────

export function listComments(params = {}) {
  return request({
    url: '/comment/list',
    method: 'get',
    params: cleanObject(params)
  })
}

export function listCommentReplies(params = {}) {
  return request({
    url: '/comment/reply',
    method: 'get',
    params: cleanObject(params)
  })
}

export function createComment(payload) {
  return request({
    url: '/comment/create',
    method: 'post',
    data: payload
  })
}

export function likeComment(commentId) {
  return request({
    url: '/comment/like',
    method: 'post',
    data: { comment_id: commentId }
  })
}

export function unlikeComment(commentId) {
  return request({
    url: '/comment/unlike',
    method: 'post',
    data: { comment_id: commentId }
  })
}

export function deleteComment(commentId) {
  return request({
    url: '/comment/delete',
    method: 'post',
    data: { comment_id: commentId }
  })
}

// ── Favorite ─────────────────────────────────────────

export function favoriteDiary(diaryId) {
  return request({
    url: '/diary/favorite',
    method: 'post',
    data: { diary_id: diaryId }
  })
}

export function unfavoriteDiary(diaryId) {
  return request({
    url: '/diary/unfavorite',
    method: 'post',
    data: { diary_id: diaryId }
  })
}

export function listFavorites(params = {}) {
  return request({
    url: '/diary/favorite/list',
    method: 'get',
    params: cleanObject(params)
  })
}

// ── Fireflies ───────────────────────────────────────

export function listFireflies(params = {}) {
  return request({
    url: '/fireflies/list',
    method: 'get',
    params: cleanObject(params)
  })
}

export function searchFireflies(params = {}) {
  return request({
    url: '/fireflies/search',
    method: 'get',
    params: cleanObject(params)
  })
}

export function getFireflyTopicList() {
  return request({
    url: '/fireflies/topic/list',
    method: 'get'
  })
}

export function getFireflyHotTopics(params = {}) {
  return request({
    url: '/fireflies/topic/hot',
    method: 'get',
    params: cleanObject(params)
  })
}

// ── Admin ────────────────────────────────────────────

export function sendSystemMessage(payload) {
  return request({
    url: '/admin/message/system',
    method: 'post',
    data: payload
  })
}

export function hideDiaryByAdmin(payload) {
  return request({
    url: '/admin/diary/hide',
    method: 'post',
    data: payload
  })
}

export function hideCommentByAdmin(payload) {
  return request({
    url: '/admin/comment/hide',
    method: 'post',
    data: payload
  })
}