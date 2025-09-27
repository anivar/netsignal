/**
 * Custom error types for NetSignal
 */

/**
 * Base error class for all NetSignal errors
 */
export class NetSignalError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'NetSignalError';
    Object.setPrototypeOf(this, NetSignalError.prototype);
  }
}

/**
 * Thrown when an invalid URL is provided
 */
export class InvalidURLError extends NetSignalError {
  constructor(url: string, reason?: string) {
    const message = reason ? `Invalid URL "${url}": ${reason}` : `Invalid URL format: "${url}"`;
    super(message, 'INVALID_URL');
    this.name = 'InvalidURLError';
    Object.setPrototypeOf(this, InvalidURLError.prototype);
  }
}

/**
 * Thrown when an invalid timeout value is provided
 */
export class InvalidTimeoutError extends NetSignalError {
  constructor(timeout: number) {
    super(
      `Invalid timeout value: ${timeout}ms. Must be between 1ms and 60000ms`,
      'INVALID_TIMEOUT',
    );
    this.name = 'InvalidTimeoutError';
    Object.setPrototypeOf(this, InvalidTimeoutError.prototype);
  }
}

/**
 * Thrown when a network request times out
 */
export class NetworkTimeoutError extends NetSignalError {
  constructor(url: string, timeout: number) {
    super(`Network request to "${url}" timed out after ${timeout}ms`, 'NETWORK_TIMEOUT');
    this.name = 'NetworkTimeoutError';
    Object.setPrototypeOf(this, NetworkTimeoutError.prototype);
  }
}

/**
 * Thrown when a network request fails
 */
export class NetworkRequestError extends NetSignalError {
  constructor(url: string, originalError: Error) {
    super(`Network request to "${url}" failed: ${originalError.message}`, 'NETWORK_REQUEST_FAILED');
    this.name = 'NetworkRequestError';
    Object.setPrototypeOf(this, NetworkRequestError.prototype);
  }
}

/**
 * Thrown when the native module is not available
 */
export class NativeModuleError extends NetSignalError {
  constructor(platform: string) {
    super(
      `NetSignal native module is not available on ${platform}. Please ensure the native module is properly installed and linked.`,
      'NATIVE_MODULE_UNAVAILABLE',
    );
    this.name = 'NativeModuleError';
    Object.setPrototypeOf(this, NativeModuleError.prototype);
  }
}
