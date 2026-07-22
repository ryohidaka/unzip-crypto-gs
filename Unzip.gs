/**
 * Unzip.gs
 *
 * Internal helpers used by unzip() in Code.gs. Not part of the public API.
 */

/**
 * Extracts and decompresses a single zip entry.
 *
 * @param {number[]} bytes Unsigned byte array of the whole zip file.
 * @param {ZipEntry} entry Entry descriptor from `ZipParser.parseEntries`.
 * @param {string} password The archive password.
 * @return {Blob} The extracted file, as a Blob.
 * @throws {IncorrectPasswordError} If the password fails verification.
 * @throws {UnsupportedZipFeatureError} If the entry uses an unsupported
 *     compression or encryption method.
 */
function Unzip_extractEntry_(bytes, entry, password) {
  ZipParser.assertSupportedEntry(entry);

  const compressedData = Unzip_decryptIfNeeded_(bytes, entry, password);

  if (entry.method === ZipParser_METHOD_STORED_) {
    return Utilities.newBlob(compressedData, MimeType.PLAIN_TEXT, entry.fileName);
  }

  return Unzip_inflateAsGzip_(compressedData, entry);
}

/**
 * Returns the entry's raw Deflate data, decrypting it first if the entry is ZipCrypto-protected.
 *
 * @param {number[]} bytes Unsigned byte array of the whole zip file.
 * @param {ZipEntry} entry Entry descriptor from `ZipParser.parseEntries`.
 * @param {string} password The archive password.
 * @return {number[]} Raw Deflate-compressed bytes (or raw Stored bytes,
 *     for uncompressed entries).
 * @throws {IncorrectPasswordError} If the password fails verification.
 */
function Unzip_decryptIfNeeded_(bytes, entry, password) {
  const dataStart = entry.dataOffset;
  const dataEnd = dataStart + entry.compressedSize;
  const entryBytes = bytes.slice(dataStart, dataEnd);

  if (!ZipParser.isEncrypted(entry)) {
    return entryBytes;
  }

  const cipher = new ZipCryptoCipher(password);
  const decryptedBytes = cipher.decrypt(entryBytes);

  if (!ZipCryptoCipher.verifyDecryptedHeader(decryptedBytes, entry.crc32)) {
    throw new IncorrectPasswordError(entry.fileName);
  }

  return decryptedBytes.slice(ZipCrypto_VERIFICATION_HEADER_SIZE_);
}

/**
 * Decompresses raw Deflate data via Apps Script's built-in gzip support.
 *
 * @param {number[]} deflateData Raw Deflate-compressed bytes (unsigned).
 * @param {{fileName: string, crc32: number, uncompressedSize: number}} entry
 *     Entry descriptor from `ZipParser.parseEntries`.
 * @return {Blob} The decompressed file, as a Blob.
 */
function Unzip_inflateAsGzip_(deflateData, entry) {
  const gzipBytes = ZipParser.wrapAsGzip(deflateData, entry.crc32, entry.uncompressedSize);
  const gzipBlob = Utilities.newBlob(gzipBytes, "application/x-gzip", `${entry.fileName}.gz`);

  const decompressedBlob = Utilities.ungzip(gzipBlob);
  decompressedBlob.setName(entry.fileName);
  return decompressedBlob;
}
