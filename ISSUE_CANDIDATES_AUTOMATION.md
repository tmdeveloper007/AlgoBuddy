# Issue Candidates

1. Title: test : add unit tests for ApiError class hierarchy
   Type: test
   Files: src/lib/apiErrors.js, __tests__/apiErrors.test.js
   Summary: Add unit tests covering ApiError, AuthError, RateLimitError, ValidationError, and ConfigError class instantiation, inheritance, and property correctness.
   Verification: npx jest __tests__/apiErrors.test.js --colors=false
   Conflict risk: low

2. Title: test : add unit tests for generateSecureCode in random.js
   Type: test
   Files: src/lib/random.js, __tests__/random.test.js
   Summary: Add unit tests verifying generateSecureCode produces correct length, alphanumeric charset, cryptographic randomness bias handling, and edge cases like length=0.
   Verification: npx jest __tests__/random.test.js --colors=false
   Conflict risk: low

3. Title: test : add unit tests for getClientIp header parsing
   Type: test
   Files: src/lib/getClientIp.js, __tests__/getClientIp.test.js
   Summary: Add unit tests covering x-real-ip header extraction, missing header fallback, whitespace trimming, and multiple header values.
   Verification: npx jest __tests__/getClientIp.test.js --colors=false
   Conflict risk: low

4. Title: test : add unit tests for shared-utils URL and HTML helpers
   Type: test
   Files: src/lib/shared-utils.js, __tests__/sharedUtils.test.js
   Summary: Add unit tests for isValidHttpUrl URL validation, escapeHtml entity encoding, and getSupabaseConfig environment variable handling with missing/invalid inputs.
   Verification: npx jest __tests__/sharedUtils.test.js --colors=false
   Conflict risk: low

5. Title: test : add unit tests for cookieConsent localStorage utilities
   Type: test
   Files: src/lib/cookieConsent.js, __tests__/cookieConsent.test.js
   Summary: Add unit tests for getStoredPreferences, saveStoredPreferences, and hasAnalyticsConsent/hasMarketingConsent/hasFunctionalConsent with valid, missing, and corrupted localStorage data.
   Verification: npx jest __tests__/cookieConsent.test.js --colors=false
   Conflict risk: low
