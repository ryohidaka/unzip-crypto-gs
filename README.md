# UnzipCryptoGs

A Google Apps Script library for extracting password-protected zip files using the ZipCrypto scheme.

## Script ID

```text
1otMuBn_dAPv3rJ659njDV03KzWas35Cz75KJ1CkEjtVUPZKJ4omeu06_
```

## API

### `unzip(zipBlob, password)`

Extracts all entries from a zip file, decrypting ZipCrypto-protected
entries with the given password. Entries that are not encrypted are
extracted as-is (the password is ignored for those).

| Parameter  | Type     | Description              |
| ---------- | -------- | ------------------------ |
| `zipBlob`  | `Blob`   | The zip file to extract. |
| `password` | `string` | The archive password.    |

**Returns:** `Blob[]` — one Blob per extracted file, in archive order.

**Throws:**

| Error type        | When                                             |
| ----------------- | ------------------------------------------------ |
| `InvalidZipError` | The Blob does not contain a valid zip structure. |
