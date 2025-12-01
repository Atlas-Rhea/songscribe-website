# SongScribe Subagents Configuration

## 🎵 Available Subagents for SongScribe

This directory contains specialized AI subagents optimized for the SongScribe marketing website development.

### 🚀 **Core Development Subagents**

#### `/js-expert` - JavaScript Specialist
- **Purpose**: Modern JavaScript development and optimization
- **Use Cases**: 
  - Optimize `assets/js/main.js` for performance
  - Implement modern ES6+ features
  - Enhance PWA functionality
- **Example**: `/js-expert "Optimize the main.js file for better performance and modern JavaScript practices"`

#### `/ts-expert` - TypeScript Specialist  
- **Purpose**: Type-safe development and interfaces
- **Use Cases**:
  - Add TypeScript definitions for better development
  - Create type-safe configurations
  - Enhance IDE support
- **Example**: `/ts-expert "Create TypeScript definitions for the SongScribe website configuration"`

#### `/react-expert` - React Specialist
- **Purpose**: React component development and architecture
- **Use Cases**:
  - Convert static HTML to React components (if needed)
  - Optimize component performance
  - Implement modern React patterns
- **Example**: `/react-expert "Convert the SongScribe homepage to React components for better maintainability"`

### 🔧 **Quality & Performance Subagents**

#### `/perf-expert` - Performance Engineer
- **Purpose**: Performance optimization and Core Web Vitals
- **Use Cases**:
  - Optimize CSS and JavaScript for speed
  - Improve Core Web Vitals scores
  - Bundle size optimization
  - Image optimization strategies
- **Example**: `/perf-expert "Analyze and optimize the SongScribe website for Core Web Vitals"`

#### `/security-expert` - Security Auditor
- **Purpose**: Security auditing and vulnerability assessment
- **Use Cases**:
  - Review PWA security implementation
  - Audit service worker security
  - Check for security vulnerabilities
  - Privacy compliance review
- **Example**: `/security-expert "Audit the SongScribe PWA implementation for security best practices"`

#### `/a11y-expert` - Accessibility Tester
- **Purpose**: WCAG compliance and inclusive design
- **Use Cases**:
  - Ensure WCAG AA compliance
  - Test with screen readers
  - Keyboard navigation optimization
  - Color contrast validation
- **Example**: `/a11y-expert "Review the SongScribe website for WCAG AA compliance"`

### 📚 **Documentation & Maintenance Subagents**

#### `/docs-expert` - Documentation Engineer
- **Purpose**: Technical documentation and developer experience
- **Use Cases**:
  - Improve README.md and project documentation
  - Create API documentation
  - Write user guides and tutorials
  - Enhance developer onboarding
- **Example**: `/docs-expert "Create comprehensive documentation for the SongScribe website"`

#### `/refactor-expert` - Refactoring Specialist
- **Purpose**: Code refactoring and legacy modernization
- **Use Cases**:
  - Refactor CSS for better maintainability
  - Modernize JavaScript code
  - Improve code organization
  - Legacy code modernization
- **Example**: `/refactor-expert "Refactor the main.css file for better maintainability and organization"`

## 🎯 **SongScribe-Specific Workflows**

### **1. Performance Optimization Workflow**
```bash
# Step 1: Performance Analysis
/perf-expert "Analyze the SongScribe website performance and identify bottlenecks"

# Step 2: CSS Optimization
/refactor-expert "Refactor assets/css/main.css for better performance and maintainability"

# Step 3: JavaScript Optimization
/js-expert "Optimize assets/js/main.js for better performance and modern practices"
```

### **2. Security & Accessibility Review**
```bash
# Step 1: Security Audit
/security-expert "Audit the SongScribe PWA implementation for security best practices"

# Step 2: Accessibility Testing
/a11y-expert "Review the SongScribe website for WCAG AA compliance and accessibility"

# Step 3: Performance Validation
/perf-expert "Validate that security and accessibility changes don't impact performance"
```

### **3. Documentation Enhancement**
```bash
# Step 1: Technical Documentation
/docs-expert "Create comprehensive technical documentation for the SongScribe website"

# Step 2: Code Documentation
/js-expert "Add comprehensive JSDoc comments to all JavaScript functions"

# Step 3: User Documentation
/docs-expert "Create user-friendly documentation for website maintenance and updates"
```

## 🚀 **Quick Start Examples**

### **Immediate Tasks for SongScribe:**

1. **CSS Performance Optimization:**
   ```bash
   /perf-expert "Analyze and optimize assets/css/main.css for better performance and Core Web Vitals"
   ```

2. **JavaScript Modernization:**
   ```bash
   /js-expert "Review and modernize assets/js/main.js with ES6+ features and performance optimizations"
   ```

3. **Security Review:**
   ```bash
   /security-expert "Audit the SongScribe PWA implementation, service worker, and manifest.json for security best practices"
   ```

4. **Accessibility Compliance:**
   ```bash
   /a11y-expert "Review the SongScribe website for WCAG AA compliance and provide improvement recommendations"
   ```

5. **Documentation Enhancement:**
   ```bash
   /docs-expert "Improve the README.md and create comprehensive documentation for the SongScribe website project"
   ```

## 📋 **Best Practices**

### **Using Subagents Effectively:**

1. **Be Specific**: Provide clear, detailed instructions
2. **Context Matters**: Include relevant file paths and project context
3. **Iterative Approach**: Use multiple subagents in sequence for complex tasks
4. **Review Results**: Always review and validate subagent recommendations

### **Example Commands:**

```bash
# Specific file optimization
/perf-expert "Optimize the assets/css/main.css file for better performance, focusing on the design system variables and responsive breakpoints"

# Security audit with context
/security-expert "Audit the SongScribe PWA implementation, specifically reviewing the service worker (sw.js) and manifest.json for security vulnerabilities"

# Accessibility with specific focus
/a11y-expert "Review the SongScribe website homepage (index.html) for WCAG AA compliance, focusing on color contrast, keyboard navigation, and screen reader compatibility"
```

## 🔄 **Integration with Development Workflow**

### **Pre-commit Checks:**
- Use `/perf-expert` for performance validation
- Use `/a11y-expert` for accessibility checks
- Use `/security-expert` for security review

### **Feature Development:**
- Use `/js-expert` for JavaScript implementation
- Use `/docs-expert` for documentation updates
- Use `/refactor-expert` for code cleanup

### **Maintenance Tasks:**
- Use `/perf-expert` for regular performance audits
- Use `/security-expert` for security updates
- Use `/docs-expert` for documentation updates

---

**Ready to enhance your SongScribe development workflow with specialized AI subagents!** 🎵✨
