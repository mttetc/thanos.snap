# thanos.snap

A lightweight package that makes elements disappear with a Thanos snap effect, similar to Telegram's deletion animation. The effect creates a particle disintegration animation when removing elements from the DOM.

## Features

- 🎯 Zero external dependencies (Motion and html2canvas are bundled)
- 🎨 Customizable particle colors, sizes, and counts
- ⚡ Smooth animations powered by Motion
- 📱 Works on all modern browsers
- 🎮 Simple API

## Installation

```bash
npm install thanos.snap motion html2canvas
```

or

```bash
yarn add thanos.snap motion html2canvas
```

For browser usage via CDN:
```html
<script src="https://unpkg.com/motion@10.17.0/dist/motion.min.js"></script>
<script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://unpkg.com/thanos.snap@latest/dist/index.iife.js"></script>
```

## Usage

### Snap Effect (Disappear)

```typescript
import { Thanos } from 'thanos.snap';

// Basic usage
const element = document.querySelector('.my-element');
if (element) {
  Thanos.snap(element);
}

// With options
const element = document.querySelector('.my-element');
if (element) {
  Thanos.snap(element, {
    duration: 1.2,           // Animation duration in seconds
    particleDensity: 1.5,    // More particles for denser effect
    randomness: 0.7,         // More random particle movement
    vectorX: 0.5,            // Particles move right and up
    vectorY: -0.5,           // Particles move right and up
    onComplete: () => {
      console.log('Element has been snapped!');
    }
  });
}
```

## Options

### Snap Options

The `snap` method accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| duration | number | 0.8 | Duration of the animation in seconds |
| direction | string | 'up' | Direction in which particles will move ('up', 'down', 'left', 'right'). Legacy option, prefer using vectorX/vectorY instead. |
| vectorX | number | 0 | X-axis vector for particle movement (-1.0 to 1.0). Negative is left, positive is right. |
| vectorY | number | -1 | Y-axis vector for particle movement (-1.0 to 1.0). Negative is up, positive is down. |
| particleDensity | number | 1.0 | Controls the density of particles (higher values create more particles) |
| angleVariation | number | 0.5 | Controls the randomness of angles within the direction (0-1) |
| randomness | number | 0.5 | Controls the randomness of particle movement (0-1). At 0, particles follow exact direction. At 1, particles go completely random. |
| removeFromDOM | boolean | false | Whether to remove the element from DOM or just hide it |
| animated | boolean | true | Whether to animate the element's height collapsing |
| onComplete | function | undefined | Callback function to execute when animation completes |
| onStart | function | undefined | Callback function to execute when animation starts |

## Examples

### Snap Effect Examples

```javascript
// Simple upward disintegration
Thanos.snap(document.querySelector('.my-element'));

// Custom direction using vectors (45-degree angle up-right)
Thanos.snap(document.querySelector('.my-element'), {
  vectorX: 0.7,
  vectorY: -0.7
});

// Downward disintegration
Thanos.snap(document.querySelector('.my-element'), {
  vectorY: 1
});

// Explosion effect (particles go in all directions)
Thanos.snap(document.querySelector('.my-element'), {
  randomness: 1
});
```

Check out the [demo page](demo/index.html) for various examples including:
- Basic text elements
- Images
- Fast/slow animations
- Different particle colors and sizes
- Sequential animations

## How it works

1. Takes a snapshot of the target element
2. Creates a canvas overlay positioned exactly over the element
3. Generates particles with random positions and velocities
4. Animates the particles flying away while fading out
5. Applies a pixelation effect to the element as it fades
6. Smoothly scales and fades out the original element
7. Cleans up after animation completes

## Browser Support

This package works in all modern browsers that support:
- Canvas API
- CSS transforms
- requestAnimationFrame

## Dependencies

- [Motion](https://motion.dev/) - For smooth animations
- [html2canvas](https://html2canvas.hertzen.com/) - For element capture

## Development

To set up the project for development:

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Build the library and copy to demo folder
npm run build:all

# Run the demo server
npm run demo

# Build and run the demo in one command
npm run start:all

# Watch for changes and rebuild
npm run dev
```

## License

MIT 