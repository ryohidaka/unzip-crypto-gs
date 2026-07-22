/**
 * ZipParser.gs
 *
 * Static helpers for parsing a zip's Local File Headers and for reading/writing zip/gzip byte structures.
 */

/** 4-byte signature that marks the start of every Local File Header. */
const ZipParser_LOCAL_FILE_HEADER_SIGNATURE_ = 0x04034b50;

/** Fixed size, in bytes, of a Local File Header before the variable-length
 *  file name and extra field. */
const ZipParser_LOCAL_FILE_HEADER_FIXED_SIZE_ = 30;

/** Compression method code for "Stored" (no compression). */
const ZipParser_METHOD_STORED_ = 0;

/** Compression method code for "Deflate". */
const ZipParser_METHOD_DEFLATE_ = 8;

/** General purpose flag bit indicating the entry is encrypted. */
const ZipParser_FLAG_ENCRYPTED_ = 0x1;

/** General purpose flag bit indicating "strong encryption" (e.g. AES)
 *  is used instead of classic ZipCrypto. */
const ZipParser_FLAG_STRONG_ENCRYPTION_ = 0x40;

/**
 * A single zip entry, as read from its Local File Header.
 * @typedef {{
 *   fileName: string,
 *   dataOffset: number,
 *   compressedSize: number,
 *   uncompressedSize: number,
 *   flags: number,
 *   method: number,
 *   crc32: number
 * }} ZipEntry
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

  // -----------------------------------------------------------------------
  // Entry parsing
  // -----------------------------------------------------------------------

  /**
   * Parses every Local File Header entry in a zip byte array.
   *
   * @param {number[]} bytes Unsigned byte array of the whole zip file.
   * @return {!Array<ZipEntry>} Parsed entry descriptors, in archive order.
   * @throws {InvalidZipError} If no Local File Header entries are found.
   */
  static parseEntries(bytes) {
    const entries = [];
    let offset = 0;

    while (offset + 4 <= bytes.length) {
      const signature = ZipParser.readUInt32LE(bytes, offset);
      if (signature !== ZipParser_LOCAL_FILE_HEADER_SIGNATURE_) {
        break; // reached the Central Directory (or end of file)
      }

      const entry = ZipParser.parseSingleEntry_(bytes, offset);
      entries.push(entry);

      offset = entry.dataOffset + entry.compressedSize;
    }

    if (entries.length === 0) {
      throw new InvalidZipError(
        "No Local File Header entries were found. The Blob may not be a valid zip file.",
      );
    }

    return entries;
  }

  /**
   * Parses a single Local File Header starting at the given offset.
   *
   * @param {number[]} bytes Unsigned byte array of the whole zip file.
   * @param {number} headerOffset Offset of the Local File Header's signature.
   * @return {ZipEntry} The parsed entry descriptor.
   */
  static parseSingleEntry_(bytes, headerOffset) {
    const flags = ZipParser.readUInt16LE(bytes, headerOffset + 6);
    const method = ZipParser.readUInt16LE(bytes, headerOffset + 8);
    const crc32 = ZipParser.readUInt32LE(bytes, headerOffset + 14);
    const compressedSize = ZipParser.readUInt32LE(bytes, headerOffset + 18);
    const uncompressedSize = ZipParser.readUInt32LE(bytes, headerOffset + 22);
    const fileNameLength = ZipParser.readUInt16LE(bytes, headerOffset + 26);
    const extraFieldLength = ZipParser.readUInt16LE(bytes, headerOffset + 28);

    const fileNameStart = headerOffset + ZipParser_LOCAL_FILE_HEADER_FIXED_SIZE_;
    const fileNameBytes = bytes.slice(fileNameStart, fileNameStart + fileNameLength);
    const fileName = Utilities.newBlob(fileNameBytes).getDataAsString("UTF-8");

    const dataOffset = fileNameStart + fileNameLength + extraFieldLength;

    return { fileName, dataOffset, compressedSize, uncompressedSize, flags, method, crc32 };
  }

  // -----------------------------------------------------------------------
  // Feature support checks
  // -----------------------------------------------------------------------

  /**
   * Checks that an entry's compression method is supported (Stored or
   * Deflate) and that it doesn't use an out-of-scope feature like AES.
   *
   * @param {ZipEntry} entry An entry descriptor from `parseEntries`.
   * @throws {UnsupportedZipFeatureError} If the entry uses an unsupported
   *     compression or encryption method.
   */
  static assertSupportedEntry(entry) {
    const isSupportedMethod =
      entry.method === ZipParser_METHOD_STORED_ || entry.method === ZipParser_METHOD_DEFLATE_;

    if (!isSupportedMethod) {
      throw new UnsupportedZipFeatureError(
        `Entry "${entry.fileName}" uses compression method ${entry.method}, ` +
          "which is not supported (only Stored and Deflate are supported).",
      );
    }

    const usesStrongEncryption = (entry.flags & ZipParser_FLAG_STRONG_ENCRYPTION_) !== 0;
    if (usesStrongEncryption) {
      throw new UnsupportedZipFeatureError(
        `Entry "${entry.fileName}" appears to use strong encryption (e.g. AES), ` +
          "which is not supported. Only ZipCrypto (Traditional PKWARE Encryption) is supported.",
      );
    }
  }

  /**
   * Returns whether an entry is protected with ZipCrypto.
   *
   * @param {ZipEntry} entry An entry descriptor from `parseEntries`.
   * @return {boolean} `true` if the entry is encrypted.
   */
  static isEncrypted(entry) {
    return (entry.flags & ZipParser_FLAG_ENCRYPTED_) !== 0;
  }
}
