// logger.ts
import dotenv from 'dotenv';
import winston from 'winston';
import 'winston-mongodb';
import morgan from 'morgan';
import { Request, Response } from 'express';

// Load environment variables
dotenv.config();

const { MongoDB } = winston.transports;

// MongoDB Atlas URI from environment variables
const MONGO_ATLAS_URI = process.env.MONGODB_URI;

if (!MONGO_ATLAS_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, operation, fileName, functionName, lineNumber, reqParams, reqBody, resBody, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    
    if (operation) log += ` | Operation: ${operation}`;
    if (fileName) log += ` | File: ${fileName}`;
    if (functionName) log += ` | Function: ${functionName}`;
    if (lineNumber) log += ` | Line: ${lineNumber}`;
    if (reqParams) log += ` | Params: ${JSON.stringify(reqParams)}`;
    if (reqBody) log += ` | Body: ${JSON.stringify(reqBody)}`;
    if (resBody) log += ` | Response: ${JSON.stringify(resBody)}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport (I/O output) - logs all levels
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // MongoDB Atlas transport - only stores error and warn logs
    new MongoDB({
      db: MONGO_ATLAS_URI as string,
      collection: 'application_logs',
      level: 'warn', // Only log 'warn' and 'error' levels (error has higher priority than warn)
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '1'),
      },
      metaKey: 'metadata',
      expireAfterSeconds: 2592000, // 30 days - optional: auto-delete old logs
      capped: false,
      tryReconnect: true,
      decolorize: true // Remove color codes before storing in DB
    })
  ],
  exitOnError: false
});

// Handle MongoDB transport errors
logger.on('error', (error: Error) => {
  console.error('❌ Logger Error:', error);
});

// Interface for caller info
interface CallerInfo {
  functionName: string;
  fileName: string;
  lineNumber: string;
}

// Interface for additional log data
interface LogData {
  [key: string]: any;
}

// Helper function to get caller info
function getCallerInfo(): CallerInfo {
  const err = new Error();
  const stack = err.stack?.split('\n') || [];
  
  const callerLine = stack[3] || stack[2] || '';
  
  const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);
  const match2 = callerLine.match(/at\s+(.*):(\d+):(\d+)/);
  
  if (match) {
    return {
      functionName: match[1].trim(),
      fileName: match[2].split('/').pop() || 'unknown',
      lineNumber: match[3]
    };
  } else if (match2) {
    return {
      functionName: 'anonymous',
      fileName: match2[1].split('/').pop() || 'unknown',
      lineNumber: match2[2]
    };
  }
  
  return {
    functionName: 'unknown',
    fileName: 'unknown',
    lineNumber: 'unknown'
  };
}

// Enhanced logging methods
export const log = {
  info: (message: string, operation: string = '', additionalData: LogData = {}): void => {
    const callerInfo = getCallerInfo();
    logger.info(message, { operation, ...callerInfo, ...additionalData });
  },
  
  error: (message: string, operation: string = '', additionalData: LogData = {}): void => {
    const callerInfo = getCallerInfo();
    logger.error(message, { operation, ...callerInfo, ...additionalData });
  },
  
  warn: (message: string, operation: string = '', additionalData: LogData = {}): void => {
    const callerInfo = getCallerInfo();
    logger.warn(message, { operation, ...callerInfo, ...additionalData });
  },
  
  debug: (message: string, operation: string = '', additionalData: LogData = {}): void => {
    const callerInfo = getCallerInfo();
    logger.debug(message, { operation, ...callerInfo, ...additionalData });
  },
  
  // Special method for HTTP requests
  httpLog: (req: Request, res: Response, operation: string = ''): void => {
    const callerInfo = getCallerInfo();
    logger.info('HTTP Request', {
      operation: operation || `${req.method} ${req.path}`,
      method: req.method,
      url: req.url,
      reqParams: req.params,
      reqQuery: req.query,
      reqBody: req.body,
      ip: req.ip,
      ...callerInfo
    });
  },
  
  // Method to log with response body
  httpResponse: (req: Request, res: Response, resBody: any, operation: string = ''): void => {
    const callerInfo = getCallerInfo();
    logger.info('HTTP Response', {
      operation: operation || `${req.method} ${req.path}`,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      reqParams: req.params,
      reqQuery: req.query,
      reqBody: req.body,
      resBody: resBody,
      ...callerInfo
    });
  }
};

// Morgan middleware configuration
export const morganMiddleware = morgan(
  (tokens, req: Request, res: Response) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: `${tokens['response-time'](req, res)} ms`,
      ip: tokens['remote-addr'](req, res),
      userAgent: tokens['user-agent'](req, res)
    });
  },
  {
    stream: {
      write: (message: string) => {
        const data = JSON.parse(message);
        logger.http('HTTP Request', data);
      }
    }
  }
);

export { logger };
export default log;