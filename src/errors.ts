export class SonarError extends Error {
  constructor(message: string, public operationName: string) {
    super(message);
  }
}

export class AssertionError extends SonarError {
  constructor(message: string, operationName: string) {
    super(message, operationName);
  }
}

export class RequestError extends SonarError {
  constructor(message: string, operationName: string) {
    super(message, operationName);
  }
}
