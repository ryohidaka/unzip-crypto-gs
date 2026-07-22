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

/**
 * Thrown when the ZipCrypto verification check fails, meaning the password is likely incorrect.
 */
class IncorrectPasswordError extends Error {
  /**
   * @param {string} fileName Name of the zip entry that failed verification.
   */
  constructor(fileName) {
    super(`The password appears to be incorrect for entry: ${fileName}`);
    this.name = "IncorrectPasswordError";
    this.fileName = fileName;
  }
}
