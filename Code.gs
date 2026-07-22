/**
 * Code.gs
 *
 * Public entry point: unzip().
 */

/**
 * Extracts all entries from a zip file, decrypting ZipCrypto-protected entries with the given password.
 *
 * @param {Blob} zipBlob The zip file, as a Blob.
 * @param {string} password The archive password.
 * @return {Blob[]} One Blob per extracted file, in archive order.
 * @throws {InvalidZipError} If the Blob does not contain a valid zip
 *     structure.
 */
function unzip(zipBlob, password) {
  throw new Error("Not implemented yet.");
}
