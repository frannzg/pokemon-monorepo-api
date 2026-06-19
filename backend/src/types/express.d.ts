import 'express';

declare module 'express' {
  interface Request {
    // Custom properties can be added here
  }
}
