# UnzipCryptoGs

A Google Apps Script library for extracting password-protected zip files using the ZipCrypto scheme.

## Script ID

```text
1otMuBn_dAPv3rJ659njDV03KzWas35Cz75KJ1CkEjtVUPZKJ4omeu06_
```

## Limitations

- Supports ZipCrypto only. AES-encrypted zips (WinZip AES) are not supported and will throw `UnsupportedZipFeatureError`.
- Supports the Stored and Deflate compression methods. Other methods throw `UnsupportedZipFeatureError`.
- Designed for archives read via `Blob.getBytes()` (e.g. Gmail attachments, Drive files).

## Installation

1. Open your Apps Script project's editor.
2. Click **Libraries** (+) in the left sidebar.
3. Enter the Script ID:

```text
1otMuBn_dAPv3rJ659njDV03KzWas35Cz75KJ1CkEjtVUPZKJ4omeu06_
```

4. Select the latest version and click **Add**.
5. (Optional) Change the identifier — defaults to `UnzipCryptoGs`.

## Usage

```javascript
function sample() {
  const file = DriveApp.getFileById("###"); // your encrypted zip file
  const password = "###";

  const files = UnzipCryptoGs.unzip(file.getBlob(), password);

  files.forEach((f) => {
    Logger.log(`name: ${f.getName()}, size: ${f.getBytes().length}`);
  });
}
```

### Listing entry names without extracting

```javascript
function sampleListNames() {
  const file = DriveApp.getFileById("###");
  const names = UnzipCryptoGs.getFilenames(file.getBlob());
  Logger.log(names.join(", "));
}
```

### Extracting a Gmail attachment

```javascript
function extractFromGmail() {
  const threads = GmailApp.search("from:example.com subject:Invoice");
  const message = threads[0].getMessages()[0];
  const attachment = message
    .getAttachments()
    .find((a) => a.getName().toLowerCase().endsWith(".zip"));

  const files = UnzipCryptoGs.unzip(attachment.copyBlob(), "your-password");

  files.forEach((f) => DriveApp.getFolderById("###").createFile(f));
}
```

### Handling errors

```javascript
function sampleWithErrorHandling() {
  try {
    const files = UnzipCryptoGs.unzip(blob, password);
    // ... use files
  } catch (e) {
    if (e instanceof UnzipCryptoGs.IncorrectPasswordError) {
      Logger.log(`Wrong password for: ${e.fileName}`);
    } else if (e instanceof UnzipCryptoGs.InvalidZipError) {
      Logger.log(`Not a valid zip file: ${e.message}`);
    } else if (e instanceof UnzipCryptoGs.UnsupportedZipFeatureError) {
      Logger.log(`Unsupported zip feature: ${e.message}`);
    } else {
      throw e; // unexpected error, let it propagate
    }
  }
}
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

| Error type                   | When                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `InvalidZipError`            | The Blob does not contain a valid zip structure.                                     |
| `IncorrectPasswordError`     | The password fails ZipCrypto's verification check for an entry. Exposes `.fileName`. |
| `UnsupportedZipFeatureError` | An entry uses AES encryption or a compression method other than Stored/Deflate.      |

### `getFilenames(zipBlob)`

Lists the file names of every entry in a zip file, without decrypting
or decompressing anything.

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| `zipBlob` | `Blob` | The zip file to inspect. |

**Returns:** `string[]` — the file names of every entry, in archive order.

**Throws:**

| Error type        | When                                             |
| ----------------- | ------------------------------------------------ |
| `InvalidZipError` | The Blob does not contain a valid zip structure. |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
