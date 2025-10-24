# SongScribe Website

Official promotional website for SongScribe - the ultimate offline-first songwriting companion for musicians.

## 🚀 Quick Start

### Local Development
```bash
# Install Jekyll (if not already installed)
gem install jekyll bundler

# Install dependencies
bundle install

# Start development server
jekyll serve --livereload

# Visit http://localhost:4000
```

### Build for Production
```bash
# Build static files
jekyll build

# Optimize assets (optional)
npm run optimize

# Deploy to GitHub Pages
git add .
git commit -m "Update website"
git push origin main
```

## 📁 Project Structure

```
docs/
├── index.html                    # Homepage
├── features.html                 # Features page
├── pricing.html                  # Pricing page
├── download.html                 # Download page
├── about.html                    # About page
├── support.html                  # Support page
├── 404.html                      # Custom 404 page
├── assets/                       # Static assets
│   ├── css/
│   │   ├── main.css             # Main stylesheet (responsive, accessible)
│   │   └── critical.css         # Above-the-fold CSS
│   ├── js/
│   │   ├── main.js              # Core functionality
│   │   └── analytics.js         # GA4 tracking
│   └── images/                   # Optimized images
├── _includes/                    # Jekyll includes
│   ├── header.html
│   ├── footer.html
│   └── analytics.html
├── _layouts/                     # Page layouts
│   ├── default.html
│   ├── page.html
│   └── blog.html
├── _posts/                       # Blog posts
├── _config.yml                   # Jekyll configuration
├── robots.txt                    # SEO robots file
├── sitemap.xml                   # SEO sitemap
├── manifest.json                 # PWA manifest
└── sw.js                         # Service worker
```

## 🎨 Design System

### Colors
- **Primary Orange**: `#FBBF24` - CTAs, highlights, energy
- **Secondary Teal**: `#5F8484` - Trust, secondary actions, metadata
- **Surface White**: `#FFFFFF` - Backgrounds, cards
- **Text Dark**: `#333333` - All text content

### Typography
- **Font**: Inter (system-ui fallback)
- **Scale**: 8px grid-based spacing
- **Hierarchy**: H1 (48px) → H2 (36px) → H3 (24px) → Body (16px)

### Components
- **Buttons**: Primary (orange), Secondary (teal outline), Tertiary (text)
- **Cards**: Feature cards, testimonial cards with consistent spacing
- **Navigation**: Sticky header, mobile hamburger menu
- **Grid**: 3-column responsive layout

## 🔧 Development Guidelines

### HTML Structure
- Semantic HTML5 elements
- Accessible markup (ARIA labels, alt text)
- Clean, readable code structure
- Progressive enhancement

### CSS Architecture
- CSS custom properties for design tokens
- Mobile-first responsive design
- Performance optimized (critical CSS, lazy loading)
- Accessible focus states and interactions

### JavaScript Principles
- Vanilla JavaScript (no frameworks)
- Progressive enhancement
- Error handling and graceful degradation
- Performance-conscious (throttling, debouncing)

### SEO & Performance
- Lighthouse score 90+ target
- Core Web Vitals optimized
- Semantic HTML structure
- Fast loading (< 2 seconds)

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 640px (1 column, touch targets 44px+)
- **Tablet**: 641px - 1024px (2 columns)
- **Desktop**: 1024px+ (3 columns, hover states)

### Mobile Optimizations
- Touch-friendly interface
- Hamburger navigation
- Optimized typography scaling
- Performance considerations

## 🎯 Content Strategy

### Page Types
- **Homepage**: Hero → Features → How It Works → Social Proof → CTA
- **Feature Pages**: Hero → Detailed breakdown → Demo → FAQ
- **Blog Posts**: Title → Date/Author → Content → Social Share

### Content Guidelines
- **Headlines**: Benefit-focused, action-oriented
- **Copy**: Scannable, benefit-driven, jargon-free
- **CTAs**: Clear verbs, consistent styling
- **Images**: Optimized WebP, meaningful alt text

## 📊 Analytics & Tracking

### Google Analytics 4
- Page views and user journeys
- Conversion tracking (downloads, signups)
- Performance monitoring
- A/B testing capabilities

### Privacy-First
- No tracking without consent
- GDPR compliant
- Cookie consent banner
- Respects Do Not Track

## 🔄 Deployment & Maintenance

### GitHub Pages
- Automatic deployment from `docs/` folder
- Jekyll builds static files
- CDN delivery through GitHub's network
- HTTPS enforced

### Maintenance Schedule
- **Daily**: Analytics monitoring, error checking
- **Weekly**: Link verification, content updates
- **Monthly**: SEO audit, performance optimization
- **Quarterly**: Design updates, feature additions

## 🛠️ Development Tools

### Build Tools
```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build

# Optimization
npm run optimize     # Optimize assets
npm run test         # Run tests
npm run lighthouse   # Performance audit
```

### Quality Assurance
- **HTML**: W3C validation
- **CSS**: Stylelint
- **JS**: ESLint
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core

## 📋 Contributing

### Content Updates
1. Update appropriate HTML/Markdown files
2. Test locally with `jekyll serve`
3. Optimize images if added
4. Test responsive design
5. Commit with descriptive message

### Design Changes
1. Update CSS custom properties if needed
2. Test across all breakpoints
3. Verify accessibility compliance
4. Check performance impact
5. Update design documentation

### Feature Additions
1. Follow existing component patterns
2. Ensure responsive design
3. Add appropriate analytics tracking
4. Test accessibility
5. Update documentation

## 🚨 Quality Gates

### Before Commit
- [ ] Code follows style guidelines
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Accessibility verified
- [ ] Performance not degraded

### Before Deploy
- [ ] Lighthouse score 90+
- [ ] HTML/CSS validation passes
- [ ] All links functional
- [ ] Images optimized
- [ ] Analytics configured

## 📞 Support

### For Website Issues
- Check browser console for errors
- Verify local Jekyll setup
- Test on multiple devices/browsers
- Check GitHub Pages deployment status

### For Content Issues
- Verify against brand guidelines
- Check factual accuracy
- Ensure accessibility compliance
- Test on mobile devices

---

## 🎵 About SongScribe

SongScribe is the ultimate offline-first songwriting companion designed for musicians who want complete creative freedom. Built with privacy, performance, and musicality in mind.

**Key Features:**
- Rich lyric editor with chord alignment
- Audio recording with waveform visualization
- Offline-first architecture
- 1000+ chord variations
- Cross-platform compatibility

**Website Goals:**
- Convert visitors to app downloads (2% target)
- Build musician community
- Demonstrate offline-first value proposition
- Showcase musical creativity tools

---

*This website represents the perfect blend of technical excellence, musical creativity, and user-centered design.*
