import { request } from './http'

function cleanObject(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
  )
}

export function sendEmailVerify(email) {
  return request({
    url: '/auth/emailvarify',
    method: 'get',
    params: { email }
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

export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

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

export function getImagePresign(payload) {
  return request({
    url: '/image/presign',
    method: 'post',
    data: payload
  })
}