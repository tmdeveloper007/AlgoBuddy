# Issue Candidates

1. Title: fix : escape HTML in contact API route email body
   Type: fix
   Files: app/api/contact/route.js
   Summary: The message field from the contact form is interpolated directly into an HTML email without escaping, allowing email header injection and script execution in mail clients that render HTML.
   Verification: npm run lint && node --test security-tests/contactEscaping.test.cjs
   Conflict risk: low

2. Title: fix : escape HTML in send-review API route email body
   Type: fix
   Files: app/api/send-review/route.js
   Summary: The review field is rendered as raw HTML in the email body without escaping, permitting XSS via crafted review text that includes HTML tags.
   Verification: npm run lint
   Conflict risk: low

3. Title: fix : read GA_MEASUREMENT_ID from environment variable
   Type: fix
   Files: lib/gtag.js
   Summary: GA_MEASUREMENT_ID is hardcoded as G-N8XGEXJXEM. It should read from process.env.NEXT_PUBLIC_GA_ID or process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID to support per-environment configuration.
   Verification: npm run lint
   Conflict risk: low

4. Title: fix : replace emoji character with SVG icon in blogPage no-results state
   Type: fix
   Files: app/blogs/blogPage.jsx
   Summary: A raw unicode emoji character is used as a visual placeholder in the no-results empty state div. Using a proper SVG icon improves accessibility and consistency.
   Verification: npm run lint
   Conflict risk: low

5. Title: fix : correct image path case for whatIsDS blog featured image
   Type: fix
   Files: app/blogs/Content/whatIsDS/content.jsx
   Summary: The featured image src points to /blog/whatIsDs.png (lowercase s) but the actual file is named whatIsDS.png (capital DS), causing a broken image on case-sensitive filesystems.
   Verification: npm run lint
   Conflict risk: low
