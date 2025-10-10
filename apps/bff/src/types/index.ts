export interface ServiceConfig {
  path: string;
  url: string;
  pathRewrite: Record<string, string>;
  name: string;
  timeout?: number;
  ws?: boolean;
}

export interface ProxyErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}
