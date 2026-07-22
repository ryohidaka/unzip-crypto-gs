/**
 * Code.gs
 *
 * Public entry points: unzip() and getFilenames().
 */

/**
 * Extracts all entries from a zip file, decrypting ZipCrypto-protected entries with the given password.
 *
 * @param {Blob} zipBlob The zip file, as a Blob.
 * @param {string} password The archive password.
 * @return {Blob[]} One Blob per extracted file, in archive order.
 * @throws {InvalidZipError} If the Blob does not contain a valid zip
 *     structure.
 * @throws {UnsupportedZipFeatureError} If an entry uses a compression
 *     or encryption method this library does not support (e.g. AES).
 */
function unzip(zipBlob, password) {
  throw new Error("Not implemented yet.");
}

/**
 * Lists the file names of every entry in a zip file, without decrypting or decompressing anything.
 *
 * @param {Blob} zipBlob The zip file, as a Blob.
 * @return {string[]} The file names of every entry, in archive order.
 * @throws {InvalidZipError} If the Blob does not contain a valid zip
 *     structure.
 */
function getFilenames(zipBlob) {
  const bytes = ZipParser.toUnsignedBytes(zipBlob.getBytes());
  const entries = ZipParser.parseEntries(bytes);
  return entries.map((entry) => entry.fileName);
}
