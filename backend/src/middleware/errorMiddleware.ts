
import { ErrorRequestHandler, RequestHandler, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose'; 

export interface AppError extends Error { 
  statusCode?: number;
  kind?: string; 
  code?: number; 
  keyValue?: any; 
  errors?: any; 
  status?: number; 
}

export const notFound: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler: ErrorRequestHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
  
  if (err.status) { // if error object has a status property (e.g. from http-errors library)
    statusCode = err.status;
  } else if (err.statusCode) { // if error object has a statusCode property
    statusCode = err.statusCode;
  }

  let message = err.message;

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found (Invalid ID format)';
  } else if (err.code === 11000) { 
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    message = `Duplicate field value entered for ${field}. Please use another value.`;
  } else if (err.name === 'ValidationError') { 
    statusCode = 400;
    const messages = err.errors ? Object.values(err.errors).map((val: any) => val.message) : [err.message];
    message = messages.join(', ');
  } else if (err instanceof mongoose.Error) { 
    // For other Mongoose errors not specifically handled, ensure status isn't 200
    statusCode = statusCode === 200 ? 400 : statusCode; 
  }

  // Ensure statusCode is a valid HTTP error code
  if (statusCode >= 200 && statusCode < 300) {
    // If somehow a success code slips through, default to 500
    console.warn(`errorHandler received an error with a success-range statusCode ${statusCode}. Overriding to 500. Error: ${err.message}`);
    statusCode = 500;
  }

  if (res.headersSent) {
    console.error("[errorHandler] Headers already sent, cannot send error response. Original error:", err.message);
    return next(err); 
  }

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
