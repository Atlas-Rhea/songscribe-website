# SongScribe Legal Pages - Website Implementation Instructions

## Background

SongScribe's iOS app was rejected by Apple App Store Review (January 10, 2026) for missing required legal links. The app code has been updated to link to these URLs:

- **Terms of Use**: `https://songscribe.io/terms`
- **Privacy Policy**: `https://songscribe.io/privacy`

These pages **must be live** before resubmitting to the App Store.

---

## What Needs to Be Done

Create two public web pages on songscribe.io:

### 1. Terms of Use Page
- **URL**: `https://songscribe.io/terms`
- **Content**: Use `TERMS_OF_USE.md` in this folder
- **Purpose**: Required by Apple for apps with auto-renewable subscriptions

### 2. Privacy Policy Page
- **URL**: `https://songscribe.io/privacy`
- **Content**: Use `PRIVACY_POLICY.md` in this folder
- **Purpose**: Required by Apple and standard for any app collecting data

---

## Apple's Requirements (from rejection notice)

Apple specifically requires that apps offering auto-renewable subscriptions include:

1. ✅ Title of auto-renewing subscription
2. ✅ Length of subscription
3. ✅ Price of subscription
4. ❌ **Functional link to Terms of Use (EULA)** ← This page
5. ❌ **Functional link to Privacy Policy** ← This page

The app binary now includes links to these pages, but the pages don't exist yet.

---

## Design Guidelines

### Match SongScribe Branding
- Use the same visual style as songscribe.io
- Orange accent color: `#FBBF24`
- Clean, readable typography
- Mobile-responsive (many users will view from the app)

### Page Structure
Each legal page should include:
1. **Header** with SongScribe logo/branding
2. **Last Updated date** prominently displayed
3. **Table of contents** (optional but helpful for long documents)
4. **The legal content** from the markdown files
5. **Footer** with contact info and link back to main site

### Accessibility
- Proper heading hierarchy (h1, h2, h3)
- Sufficient color contrast
- Works without JavaScript
- Readable on mobile devices

---

## Content Files in This Folder

| File | Purpose |
|------|---------|
| `TERMS_OF_USE.md` | Full Terms of Use content - convert to HTML |
| `PRIVACY_POLICY.md` | Full Privacy Policy content - convert to HTML |
| `WEBSITE_INSTRUCTIONS.md` | This file - instructions for you |

---

## Key Subscription Details to Highlight

The Terms of Use includes subscription information that Apple specifically looks for:

### Subscription Tiers
- **Free**: Up to 10 songs, 5 recordings/song
- **Lifetime**: $19.95 one-time purchase, unlimited songs/recordings
- **Pro Monthly**: $4.95/month
- **Pro Yearly**: $14.95/year (best value)

### Auto-Renewal Disclosure
This text MUST be clearly visible on the Terms page:
> "Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period."

### Cancellation Instructions
This text MUST be included:
> "You may cancel your subscription at any time through your Apple ID account settings."

---

## After Deployment

Once the pages are live:

1. **Verify the URLs work**:
   - `https://songscribe.io/terms` → Shows Terms of Use
   - `https://songscribe.io/privacy` → Shows Privacy Policy

2. **Test from mobile** - The app opens these in Safari/browser

3. **Update App Store Connect**:
   - Add Privacy Policy URL to the "Privacy Policy URL" field
   - Add Terms link to App Description OR set custom EULA

4. **Resubmit app** to App Store Review

---

## Contact Information for Pages

Use these contact details on the legal pages:

- **Support Email**: support@songscribe.io
- **Privacy Email**: privacy@songscribe.io
- **Website**: https://songscribe.io

---

## Timeline

These pages are **blocking the App Store submission**. Please prioritize deployment.

---

## Questions?

If anything in the legal content needs clarification or adjustment, flag it before publishing. The content was drafted to meet Apple's requirements but may need review by the team.
