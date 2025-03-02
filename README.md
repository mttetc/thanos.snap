# Vanish Effect

A lightweight JavaScript library that creates a Thanos-inspired disintegration effect for HTML elements, turning them into particles that float away. Works with vanilla JavaScript, React, and Next.js.

<!-- Add a real demo GIF here when available -->

## Installation

```bash
npm install vanish-effect
```

Or use it directly via CDN:

```html
<script src="https://unpkg.com/vanish-effect@1.0.0/dist/index.global.js"></script>
```

## Usage

### ES Modules

```javascript
import { Thanos } from 'vanish-effect';

// Basic usage
const element = document.getElementById('my-element');
Thanos.snap(element);

// With options
Thanos.snap(element, {
  direction: 'up',
  duration: 1.0,
  particleDensity: 1.5,
  randomness: 0.7
});
```

### Browser

```html
<script src="https://unpkg.com/vanish-effect@1.0.0/dist/index.global.js"></script>
<script>
  // The library exposes a global Thanos object
  const element = document.getElementById('my-element');
  Thanos.snap(element);
</script>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | 0.8 | Duration of the animation in seconds |
| `direction` | string | 'up' | Direction in which particles will move ('up', 'down', 'left', 'right') |
| `vectorX` | number | 0 | X-axis vector for particle movement (-1.0 to 1.0). Negative is left, positive is right |
| `vectorY` | number | -1 | Y-axis vector for particle movement (-1.0 to 1.0). Negative is up, positive is down |
| `onComplete` | function | undefined | Callback function to execute when animation completes |
| `onStart` | function | undefined | Callback function to execute when animation starts |
| `particleDensity` | number | 1.0 | Controls the density of particles (1.0 is normal, higher values create more particles) |
| `angleVariation` | number | 0.5 | Controls the randomness of angles within a direction (0-1) |
| `removeFromDOM` | boolean | false | Whether to remove the element from DOM or just hide it |
| `randomness` | number | 0.5 | Controls the randomness of particle movement (0-1). At 0, particles follow exact direction. At 1, particles go completely random |
| `animated` | boolean | true | Whether to animate the element's height collapsing |

## Examples

### Basic Example

```javascript
// Make an element disappear with the default upward animation
const element = document.getElementById('my-element');
Thanos.snap(element);
```

### Custom Direction

```javascript
// Make particles move to the right
Thanos.snap(element, { direction: 'right' });

// Or use vectors for more precise control
Thanos.snap(element, { vectorX: 0.7, vectorY: -0.7 }); // Diagonal up-right
```

### Explosion Effect

```javascript
// Create an explosion-like effect where particles go in all directions
Thanos.snap(element, { randomness: 1.0 });
```

### Remove Element After Animation

```javascript
// Remove the element from the DOM after the animation completes
Thanos.snap(element, { removeFromDOM: true });
```

### Callback Functions

```javascript
Thanos.snap(element, {
  onStart: () => console.log('Animation started'),
  onComplete: () => console.log('Animation completed')
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

This library has the following peer dependencies:

- html2canvas: ^1.4.1
- motion: ^10.17.0

## License

MIT 