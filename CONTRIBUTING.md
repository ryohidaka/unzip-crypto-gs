# Contributing to UnzipCryptoGs

## Project structure

```
UnzipCryptoGs/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── appsscript.json
├── Errors.gs       Custom error types
├── ZipCrypto.gs    ZipCrypto decryption (no Apps Script service dependency)
├── ZipParser.gs    Zip structure parsing + gzip wrapping
├── Unzip.gs        Internal helpers used by unzip()
└── Code.gs         Public API only: unzip(), getFilenames()
```

Managed directly in the Apps Script editor as `.gs` files (not via
`clasp`/TypeScript-style tooling).

## Code style

> [!IMPORTANT]
> Keep `ZipCrypto.gs` free of Apps Script service calls (no `Utilities`, `DriveApp`, etc.) so it stays reusable standalone.

- Keep `Code.gs` limited to the two public entry points; add new internal helpers to `Unzip.gs` or the relevant class instead.
- Use modern V8 syntax: `const`/`let`, classes, template literals, array spread, arrow functions in short callbacks.
- Document public and shared functions following [Apps Script's JSDoc conventions](https://developers.google.com/apps-script/concepts/jsdoc) (`@param`, `@return`, `@throws`), kept concise.

## Ideas for contributions

> [!NOTE]
> AES support (WinZip AES) would be a welcome contribution, but is a materially larger scope than the current ZipCrypto path. Please open an issue to discuss the approach before starting.

- Bug reports with a minimal reproduction (a small password-protected zip that fails to extract, plus the error) are very helpful.
