export class InvalidCursorError extends Error {
  constructor(message = 'Invalid pagination cursor') {
    super(message);
    this.name = 'InvalidCursorError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Item was modified by another request') {
    super(message);
    this.name = 'ConflictError';
  }
}
