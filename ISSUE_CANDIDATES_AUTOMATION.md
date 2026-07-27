# Issue Candidates

1. Title: test : add unit tests for storage.js
   Type: test
   Files: src/utils/storage.js, __tests__/storage.test.js
   Summary: Add unit tests for saveToStorage, loadFromStorage, and removeFromStorage utilities which handle localStorage serialization and error handling.
   Verification: npx jest __tests__/storage.test.js
   Conflict risk: low

2. Title: test : add unit tests for apiErrors.js
   Type: test
   Files: src/lib/apiErrors.js, __tests__/apiErrors.test.js
   Summary: Add unit tests for ApiError, AuthError, RateLimitError, ValidationError, and ConfigError class constructors and property assignments.
   Verification: npx jest __tests__/apiErrors.test.js
   Conflict risk: low

3. Title: test : add unit tests for sortingGenerators.js
   Type: test
   Files: src/utils/sortingGenerators.js, __tests__/sortingGenerators.test.js
   Summary: Add unit tests for all six generator-based sorting algorithm implementations (bubble, selection, insertion, merge, quick, heap) to verify correct step yield behavior.
   Verification: npx jest __tests__/sortingGenerators.test.js
   Conflict risk: low

4. Title: test : add unit tests for cookieConsent.js
   Type: test
   Files: src/lib/cookieConsent.js, __tests__/cookieConsent.test.js
   Summary: Add unit tests for getStoredPreferences, saveStoredPreferences, hasAnalyticsConsent, hasMarketingConsent, and hasFunctionalConsent utilities.
   Verification: npx jest __tests__/cookieConsent.test.js
   Conflict risk: low

5. Title: test : add unit tests for shared-utils.js
   Type: test
   Files: src/lib/shared-utils.js, __tests__/sharedUtils.test.js
   Summary: Add unit tests for isValidHttpUrl, escapeHtml, and getSupabaseConfig utilities including edge cases for URL validation and HTML escaping.
   Verification: npx jest __tests__/sharedUtils.test.js
   Conflict risk: low
