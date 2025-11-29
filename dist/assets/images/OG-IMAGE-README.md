# Open Graph Image Generation

This directory contains files for generating the social media preview image (og-image.png) used when sharing songscribe.io on social platforms.

## Files

- `og-image-generator.html` - HTML file that renders the OG image design (1200x630px)
- `og-image.svg` - SVG version (can be converted to PNG)

## How to Generate og-image.png

### Option 1: Using the HTML Generator (Recommended)

1. Open `og-image-generator.html` in a browser
2. Take a screenshot at exactly 1200x630 pixels
3. Save as `og-image.png` in this directory

**Browser Tools:**
- Chrome DevTools: Set viewport to 1200x630, then screenshot
- Firefox: Use Responsive Design Mode (1200x630), then screenshot
- Safari: Use Responsive Design Mode, then screenshot

### Option 2: Using Online Tools

1. Open `og-image-generator.html` in a browser
2. Use an online tool like:
   - [htmlcsstoimage.com](https://htmlcsstoimage.com)
   - [screenshotapi.net](https://screenshotapi.net)
   - [urlbox.io](https://urlbox.io)

### Option 3: Convert SVG to PNG

Use a tool like:
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Inkscape](https://inkscape.org) (command line: `inkscape og-image.svg --export-filename=og-image.png --export-width=1200 --export-height=630`)

## Important Notes

- The final image must be exactly **1200x630 pixels**
- File size should be under 1MB for best performance
- The image should match your brand colors and include your logo
- Test the image using:
  - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
  - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Current Status

⚠️ **Action Required**: Generate `og-image.png` from the provided generator files before deploying to production.

