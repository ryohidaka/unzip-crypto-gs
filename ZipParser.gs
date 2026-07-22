/**
 * ZipParser.gs
 *
 * Static helpers for reading zip/gzip byte structures (namespaced as a class; no instance state).
 */

class ZipParser {
  // -----------------------------------------------------------------------
  // Byte-level helpers
  //
  // Reading/writing the little-endian integer fields of a zip header,
  // and normalizing Apps Script's signed byte arrays, are needed
  // throughout this file and Code.gs, so they are added first.
  // -----------------------------------------------------------------------

  /**
   * Reads an unsigned 32-bit little-endian integer from a byte array.
   *
   * @param {number[]} bytes Byte array.
   * @param {number} offset Read offset.
   * @return {number} Unsigned 32-bit integer.
   */
  static readUInt32LE(bytes, offset) {
    return (
      ((bytes[offset] & 0xff) |
        ((bytes[offset + 1] & 0xff) << 8) |
        ((bytes[offset + 2] & 0xff) << 16) |
        ((bytes[offset + 3] & 0xff) << 24)) >>>
      0
    );
  }

  /**
   * Reads an unsigned 16-bit little-endian integer from a byte array.
   *
   * @param {number[]} bytes Byte array.
   * @param {number} offset Read offset.
   * @return {number} Unsigned 16-bit integer.
   */
  static readUInt16LE(bytes, offset) {
    return ((bytes[offset] & 0xff) | ((bytes[offset + 1] & 0xff) << 8)) & 0xffff;
  }

  /**
   * Converts an unsigned integer into a little-endian byte array of a
   * given length.
   *
   * @param {number} value Value to encode.
   * @param {number} numBytes Number of bytes to emit.
   * @return {number[]} Little-endian byte array.
   */
  static toLEBytes(value, numBytes) {
    return Array.from({ length: numBytes }, (_, i) => (value >>> (8 * i)) & 0xff);
  }

  /**
   * Normalizes Apps Script's signed byte values (as returned by
   * `Blob.getBytes()`) to the unsigned 0-255 range.
   *
   * @param {number[]} signedBytes Signed byte array.
   * @return {number[]} Unsigned byte array.
   */
  static toUnsignedBytes(signedBytes) {
    return signedBytes.map((byteValue) => (byteValue < 0 ? byteValue + 256 : byteValue));
  }
}
