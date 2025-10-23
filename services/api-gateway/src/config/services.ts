import { Application } from "express";
import { IncomingMessage, ServerResponse } from "http";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Socket } from "net";
import { config } from ".";
import { ProxyErrorResponse, ServiceConfig } from "../types";
import logger from "./logger";

class ServiceProxy {
  private static readonly serviceConfigs: ServiceConfig[] = [
    {
      path: "/api/v1/auth/",
      url: config.AUTH_SERVICE_URL,
      pathRewrite: { "^/": "/api/v1/auth/" },
      name: "auth-service",
      timeout: 5000,
    },
    {
      path: "/api/v1/ws/",
      url: config.WS_SERVICE_URL,
      pathRewrite: { "^/": "/api/v1/ws/" },
      name: "ws-service",
      ws: true,
      timeout: 5000,
    },
  ];

  private static createProxyOptions(service: ServiceConfig): Options {
    return {
      target: service.url,
      changeOrigin: true,
      pathRewrite: service.pathRewrite,
      timeout: service.timeout || config.DEFAULT_TIMEOUT,
      logger: logger,
      ws: service.ws ?? false,
      on: {
        error: ServiceProxy.handleProxyError,
        proxyReq: ServiceProxy.handleProxyRequest,
        proxyRes: ServiceProxy.handleProxyResponse,
      },
    };
  }

  private static handleProxyError(
    err: Error,
    req: IncomingMessage,
    res: ServerResponse | Socket,
  ): void {
    logger.error(`Proxy error for ${req.url}:`, err);

    // Only handle HTTP responses, not WebSocket connections
    if (res instanceof ServerResponse) {
      const errorResponse: ProxyErrorResponse = {
        message: "Service unavailable",
        status: 503,
        timestamp: new Date().toISOString(),
      };

      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(errorResponse));
    }
  }

  private static handleProxyRequest(proxyReq: any, req: IncomingMessage): void {
    logger.debug(`Proxying request to ${req.url}`);
  }

  private static handleProxyResponse(
    proxyRes: IncomingMessage,
    req: IncomingMessage,
    res: ServerResponse | Socket,
  ): void {
    logger.debug(`Received response for ${req.url}`);
  }

  public static setupProxy(app: Application): void {
    ServiceProxy.serviceConfigs.forEach((service) => {
      const proxyOptions = ServiceProxy.createProxyOptions(service);
      app.use(service.path, createProxyMiddleware(proxyOptions));
      logger.info(`Configured proxy for ${service.name} at ${service.path}`);
    });
  }
}

export const proxyServices = (app: Application): void => {
  ServiceProxy.setupProxy(app);
};
