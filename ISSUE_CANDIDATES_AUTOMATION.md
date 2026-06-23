# Issue Candidates

1. Title: test : add unit tests for apiErrors class hierarchy
   Type: test
   Files: security-tests/apiErrors.test.cjs (new)
   Summary: Add Node test suite for src/lib/apiErrors.js — covers ApiError, AuthError, RateLimitError, ValidationError, ConfigError: status codes, error codes, instanceof chains, message propagation.
   Verification: node --experimental-detect-module --test security-tests/apiErrors.test.cjs
   Conflict risk: low

2. Title: test : add unit tests for storage utility functions
   Type: test
   Files: __tests__/storage.test.js (new)
   Summary: Add Jest test suite for src/utils/storage.js covering saveToStorage, loadFromStorage (including JSON.parse fallback), removeFromStorage, and the window-undefined guard paths.
   Verification: npx jest __tests__/storage.test.js --colors=false
   Conflict risk: low

3. Title: test : add unit tests for getClientIp header parsing
   Type: test
   Files: security-tests/getClientIp.test.cjs (new)
   Summary: Add Node test suite for src/lib/getClientIp.js covering x-real-ip priority, rightmost X-Forwarded-For hop selection, RFC-1918/private IP stripping, and the "unknown" fallback.
   Verification: node --experimental-detect-module --test security-tests/getClientIp.test.cjs
   Conflict risk: low

4. Title: test : add unit tests for modulesMap constant lookups
   Type: test
   Files: security-tests/modulesMap.test.cjs (new)
   Summary: Add Node test suite for src/lib/modulesMap.js covering key existence, UUID format validation, unknown key handling, and exported MODULE_MAPS shape.
   Verification: node --experimental-detect-module --test security-tests/modulesMap.test.cjs
   Conflict risk: low

5. Title: test : add unit tests for visualizerSections static data structure
   Type: test
   Files: security-tests/visualizerSections.test.cjs (new)
   Summary: Add Node test suite for src/lib/visualizerSections.js covering section count, required fields (title, slug, desc), subsections existence, and item path format validation.
   Verification: node --experimental-detect-module --test security-tests/visualizerSections.test.cjs
   Conflict risk: low
