/**
 * Errors.gs
 *
 * Custom error types, so callers can distinguish failures with instanceof instead of message strings.
 */

/**
 * Thrown when the given Blob does not contain a valid zip structure.
 */
class InvalidZipError extends Error {
  /**
   * @param {string} message Human-readable description of the problem.
   */
  constructor(message) {
    super(message);
    this.name = "InvalidZipError";
  }
}

/**
 * Thrown when a zip entry uses an unsupported compression or encryption method (e.g. AES).
 */
class UnsupportedZipFeatureError extends Error {
  /**
   * @param {string} message Human-readable description of the unsupported feature.
   */
  constructor(message) {
    super(message);
    this.name = "UnsupportedZipFeatureError";
  }
}
