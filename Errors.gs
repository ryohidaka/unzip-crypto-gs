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
