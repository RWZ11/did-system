// DID文档结构
export interface DIDDocument {
  id: string;
  public_keys: PublicKeyInfo[];
  authentication: string[];
  services: Service[];
  created: number;
  updated: number;
}

// 公钥信息
export interface PublicKeyInfo {
  id: string;
  type_: string;
  controller: string;
  public_key_base58: string;
}

// 服务端点
export interface Service {
  id: string;
  type_: string;
  endpoint: string;
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

// 创建DID请求
export interface CreateDIDRequest {
  signing_key: string;
}

// 更新DID请求
export interface UpdateDIDRequest {
  signing_key: string;
  document: DIDDocument;
}

// 停用DID请求
export interface DeactivateDIDRequest {
  signing_key: string;
}