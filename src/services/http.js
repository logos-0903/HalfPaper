/**
 * HTTP 客户端封装
 * 基于 Axios，统一处理接口响应、错误码和登录过期重定向
 */
import axios from 'axios'
import { API_BASE_URL } from '@/constants/app'

export class ApiError extends Error {
  constructor(message, code = -1, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.payload = payload
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export async function request(config) {
  try {
    const response = await http.request(config)
    const payload = response.data

    if (!payload || typeof payload !== 'object') {
      throw new ApiError('服务端返回格式异常')
    }

    if (payload.code !== 0) {
      throw new ApiError(payload.message || '请求失败', payload.code, payload)
    }

    return payload.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    const message = error.response?.data?.message || error.message || '网络请求失败'
    const code = error.response?.data?.code ?? error.response?.status ?? -1
    const apiError = new ApiError(message, code, error.response?.data ?? null)
    apiError.isNetworkError = !error.response
    throw apiError
  }
}

export default http