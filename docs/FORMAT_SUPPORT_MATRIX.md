# DocVault X — Document Format Support Matrix

DocVault X treats every file as an arbitrary encrypted binary container. Previewing, rendering, and interaction capabilities are categorized strictly below.

| Category | Extensions / MIME Types | Encrypted Storage (`.dvx`) | In-Client Preview | Offline Viewing | Export (Unprotected) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Portable Documents** | `.pdf` (`application/pdf`) | Yes (Full AES-GCM) | Yes (Sandboxed PDF.js / Native) | Yes (Within lease) | Yes (With Warning) |
| **Office Documents** | `.docx`, `.doc`, `.odt` | Yes (Full AES-GCM) | Yes (Sandboxed Preview Conversion) | Yes (Cached Preview) | Yes (With Warning) |
| **Spreadsheets** | `.xlsx`, `.xls`, `.csv` | Yes (Full AES-GCM) | Yes (Safe Grid Render / Preview) | Yes (Cached Preview) | Yes (With Warning) |
| **Presentations** | `.pptx`, `.ppt`, `.odp` | Yes (Full AES-GCM) | Yes (Slide Deck Preview) | Yes (Cached Preview) | Yes (With Warning) |
| **Images** | `.png`, `.jpg`, `.webp`, `.svg` | Yes (Full AES-GCM) | Yes (Native Canvas / Decoded) | Yes (Within lease) | Yes (With Warning) |
| **Plain Text / Code**| `.txt`, `.md`, `.json`, `.csv` | Yes (Full AES-GCM) | Yes (Sanitized Text Viewer) | Yes (Within lease) | Yes (With Warning) |
| **Audio / Video** | `.mp4`, `.webm`, `.mp3` | Yes (Full AES-GCM) | Yes (Encrypted Media Source) | Yes (Within lease) | Yes (With Warning) |
| **Archives** | `.zip`, `.tar`, `.gz`, `.7z` | Yes (Full AES-GCM) | Manifest Only (No Execution) | No Direct Preview | Yes (With Warning) |
| **Other Binaries** | Any file extension | Yes (Full AES-GCM) | Metadata Only | No Direct Preview | Yes (With Warning) |
