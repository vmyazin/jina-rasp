# Open Props Setup Guide

This project uses [Open Props](https://open-props.style/) for consistent design tokens and CSS variables.

## Current Setup

### Installation
- Open Props is installed via npm: `npm install open-props`
- Current version: 1.7.16 (latest)

### File Structure
- **Source**: `node_modules/open-props/open-props.min.css`
- **Public**: `public/open-props.min.css` (copied for serving)
- **HTML Import**: `<link rel="stylesheet" href="open-props.min.css">`

### Automatic Updates
- `npm run update-open-props` - Manually copy latest Open Props CSS
- `npm run postinstall` - Automatically runs after `npm install`

## Available Variables

Open Props provides hundreds of CSS custom properties organized into categories:

### Colors
```css
var(--gray-0) to var(--gray-12)    /* Grayscale */
var(--blue-0) to var(--blue-12)    /* Blue palette */
var(--red-0) to var(--red-12)      /* Red palette */
/* + many more color palettes */
```

### Typography
```css
var(--font-sans)                   /* System font stack */
var(--font-serif)                  /* Serif font stack */
var(--font-mono)                   /* Monospace font stack */
var(--font-size-0) to var(--font-size-8)  /* Font sizes */
var(--font-weight-1) to var(--font-weight-9)  /* Font weights */
var(--font-lineheight-0) to var(--font-lineheight-5)  /* Line heights */
```

### Spacing & Sizing
```css
var(--size-1) to var(--size-15)    /* Spacing scale */
var(--size-fluid-1) to var(--size-fluid-10)  /* Responsive spacing */
```

### Border Radius
```css
var(--radius-1) to var(--radius-6)  /* Border radius scale */
var(--radius-round)                 /* Fully rounded */
```

### Animations & Easing
```css
var(--ease-1) to var(--ease-5)      /* Easing curves */
var(--ease-in-1) to var(--ease-in-5)  /* Ease-in curves */
var(--ease-out-1) to var(--ease-out-5)  /* Ease-out curves */
```

## Custom Extensions

We've added custom variables to supplement Open Props:

```css
:root {
    /* Brand Colors */
    --brand-primary: #667eea;
    --brand-secondary: #764ba2;
    --brand-gradient: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    
    /* Animation Speeds */
    --animation-speed-fast: 0.15s;
    --animation-speed-normal: 0.3s;
    --animation-speed-slow: 0.5s;
}
```

## Usage Examples

### Using Open Props Variables
```css
.button {
    padding: var(--size-3) var(--size-5);
    font-size: var(--font-size-1);
    border-radius: var(--radius-2);
    background: var(--blue-6);
    color: var(--gray-0);
    transition: all var(--animation-speed-normal) var(--ease-2);
}

.button:hover {
    background: var(--blue-7);
    transform: translateY(-2px);
}
```

### Responsive Design
```css
.container {
    padding: var(--size-fluid-2);  /* Responsive padding */
    max-width: var(--size-lg);     /* 1024px breakpoint */
}
```

## Benefits

1. **Consistency**: Standardized design tokens across the entire project
2. **Maintainability**: Easy to update design system by changing variables
3. **Performance**: Optimized CSS with minimal bundle size
4. **Accessibility**: Built-in support for reduced motion and color schemes
5. **Developer Experience**: Comprehensive set of well-named variables

## Updating Open Props

To update to a newer version:

1. Update the package: `npm update open-props`
2. Copy the new CSS: `npm run update-open-props`
3. Test the application for any breaking changes

## Resources

- [Open Props Documentation](https://open-props.style/)
- [Open Props GitHub](https://github.com/argyleink/open-props)
- [CSS Custom Properties Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)