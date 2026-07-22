/**
 * ZipCrypto.gs
 *
 * ZipCrypto ("Traditional PKWARE Encryption") decryption. No dependency on any Apps Script service.
 * Reference: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT (Appendix E)
 */

// -----------------------------------------------------------------------
// CRC-32 helpers
//
// ZipCrypto's key schedule folds in a CRC-32 update at every step, so a
// fast CRC-32 implementation is the first building block needed here.
// Kept as free functions (rather than static class members) since the
// V8 runtime doesn't support in-class static field initializers, and a
// lazily-built cache reads more naturally as a closure-backed function.
// -----------------------------------------------------------------------

/** CRC-32 polynomial (reversed representation), as defined by the
 *  PKWARE spec and used throughout the standard zip format. */
const ZipCrypto_CRC32_POLYNOMIAL_ = 0xedb88320;

/** Lazily-built, memoized CRC-32 lookup table. See `ZipCrypto_buildCrc32Table_`. */
let ZipCrypto_crc32TableCache_ = null;

/**
 * Builds (and caches) the CRC-32 lookup table used by the key update step.
 *
 * @return {number[]} A 256-entry CRC-32 table.
 */
function ZipCrypto_buildCrc32Table_() {
  if (ZipCrypto_crc32TableCache_) return ZipCrypto_crc32TableCache_;

  const table = [];
  for (let byteValue = 0; byteValue < 256; byteValue++) {
    let crc = byteValue;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? ZipCrypto_CRC32_POLYNOMIAL_ ^ (crc >>> 1) : crc >>> 1;
    }
    table[byteValue] = crc >>> 0;
  }

  ZipCrypto_crc32TableCache_ = table;
  return table;
}

/**
 * Updates a running CRC-32 value with a single byte.
 *
 * @param {number} crc Current CRC-32 accumulator.
 * @param {number} byteValue Byte to fold in (0-255).
 * @return {number} Updated CRC-32 accumulator.
 */
function ZipCrypto_updateCrc32_(crc, byteValue) {
  const table = ZipCrypto_buildCrc32Table_();
  return (table[(crc ^ byteValue) & 0xff] ^ (crc >>> 8)) >>> 0;
}

// -----------------------------------------------------------------------
// ZipCryptoCipher
//
// Owns the three 32-bit keys ZipCrypto updates after every plaintext
// byte. key2 is turned into a keystream byte, XORed with the
// ciphertext to recover the plaintext byte, which then feeds back into
// the keys for the next byte. Each decryption needs its own key
// schedule, so this state belongs on an instance.
// -----------------------------------------------------------------------

/** Initial value of key0, as defined by the PKWARE spec. */
const ZipCrypto_INITIAL_KEY0_ = 0x12345678;

/** Initial value of key1, as defined by the PKWARE spec. */
const ZipCrypto_INITIAL_KEY1_ = 0x23456789;

/** Initial value of key2, as defined by the PKWARE spec. */
const ZipCrypto_INITIAL_KEY2_ = 0x34567890;

/** Multiplier used by the PKWARE spec's linear congruential generator
 *  when updating key1. */
const ZipCrypto_LCG_MULTIPLIER_ = 134775813;

/**
 * A ZipCrypto key schedule, seeded from a password and advanced one byte at a time as data is decrypted.
 */
class ZipCryptoCipher {
  /**
   * @param {string} password The archive password.
   */
  constructor(password) {
    this.key0 = ZipCrypto_INITIAL_KEY0_;
    this.key1 = ZipCrypto_INITIAL_KEY1_;
    this.key2 = ZipCrypto_INITIAL_KEY2_;

    for (let i = 0; i < password.length; i++) {
      this.updateKeysWithPlainByte_(password.charCodeAt(i) & 0xff);
    }
  }

  /**
   * Advances the three keys by one step, based on a single plaintext byte.
   *
   * @param {number} plainByte The plaintext byte (0-255).
   */
  updateKeysWithPlainByte_(plainByte) {
    this.key0 = ZipCrypto_updateCrc32_(this.key0, plainByte);
    this.key1 = (this.key1 + (this.key0 & 0xff)) >>> 0;
    this.key1 = (Math.imul(this.key1, ZipCrypto_LCG_MULTIPLIER_) + 1) >>> 0;
    this.key2 = ZipCrypto_updateCrc32_(this.key2, (this.key1 >>> 24) & 0xff);
  }
}
