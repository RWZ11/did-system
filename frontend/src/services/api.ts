import axios from 'axios';
import { ApiResponse, CreateDIDRequest, DIDDocument, UpdateDIDRequest, DeactivateDIDRequest } from '../types/did';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// DID相关API
export const didApi = {
  // 创建DID
  create: async (request: CreateDIDRequest): Promise<ApiResponse<DIDDocument>> => {
    try {
      console.debug('正在发送创建DID请求:', { signingKey: request.signing_key });
      const response = await api.post<ApiResponse<DIDDocument>>('/did', request);
      console.debug('创建DID响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('创建DID失败:', error);
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<DIDDocument>;
      }
      throw error;
    }
  },

  // 解析DID
  resolve: async (did: string): Promise<ApiResponse<DIDDocument>> => {
    const response = await api.get<ApiResponse<DIDDocument>>(`/did/${did}`);
    return response.data;
  },

  // 更新DID
  update: async (did: string, request: UpdateDIDRequest): Promise<ApiResponse<DIDDocument>> => {
    const response = await api.put<ApiResponse<DIDDocument>>(`/did/${did}`, request);
    return response.data;
  },

  // 停用DID
  deactivate: async (did: string, request: DeactivateDIDRequest): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/did/${did}`, { data: request });
    return response.data;
  },
};

// 添加响应拦截器统一处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response?.data as ApiResponse<any>;
    if (response?.error) {
      // 可以在这里统一处理错误，比如显示错误消息
      console.error('API Error:', response.error.message);
    }
    return Promise.reject(error);
  }
);