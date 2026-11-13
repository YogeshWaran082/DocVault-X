# DocVault X — Explicit Security Limitations & Disclosures

DocVault X adheres strictly to transparent, honest security engineering. Under no circumstances should marketing or interface text mislead users regarding cryptographic and physical limitations.

## 1. The Analog Hole & Screen Extraction
No operating system or software viewer can prevent a user from taking an external physical photograph of the screen displaying confidential content. Dynamic forensic watermarking (embedding recipient email, IP hash, and timestamp across the viewport) acts as a deterrent and provenance tracker, but does not physically block visual capture.

## 2. Host Root & Administrative Compromise
When a document is opened on an endpoint where the user possesses root/administrative privileges, kernel debuggers, or hypervisor control:
- An attacker can read decrypted pages directly from process memory.
- An attacker can inspect graphics framebuffers or hook GPU render pipelines.
- An attacker can freeze execution state and clone VM snapshots.
DocVault X's native client provides best-effort anti-debugging, memory zeroization, and OS keystore integration, but cryptographic security cannot mathematically survive a fully compromised host kernel.

## 3. Unprotected File Export (Mode A)
Exporting a document as a standard PDF or Office document completely and irrevocably strips all DocVault X access controls, lease limits, and encryption. Standard desktop software (Adobe Acrobat, Microsoft Word, Chrome) has no built-in mechanism to honor server revocations or self-destruction. The system mandates an explicit warning dialog before enabling this mode.

## 4. Offline Revocation Latency
Revoking a document or recipient grant on the DocVault X server takes immediate effect for online clients. However, an offline client that holds a valid, pre-issued cryptographic lease will continue to have access until its lease duration (e.g. 24 hours) expires or the device reconnects to synchronize licenses.
