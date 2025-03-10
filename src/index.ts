/**
 * thanos.snap
 * 
 * A lightweight library that creates a Thanos snap disintegration effect
 * for HTML elements, turning them into particles that float away.
 * 
 * Usage:
 * ```
 * import { Thanos } from 'thanos.snap';
 * 
 * // Basic usage
 * Thanos.snap(element);
 * 
 * // With options
 * Thanos.snap(element, {
 *   direction: 'up',
 *   duration: 1.0,
 *   particleDensity: 1.5,
 *   randomness: 0.7
 * });
 * 
 * // With vector direction (more flexible)
 * Thanos.snap(element, {
 *   vectorX: 0.7,  // Right-upward diagonal
 *   vectorY: -0.7, // Right-upward diagonal
 *   duration: 1.0,
 *   particleDensity: 1.5
 * });
 * 
 * // In browser environments (via CDN or script tag)
 * // The Thanos class is available globally
 * Thanos.snap(element, options);
 * ```
 */

import html2canvas from 'html2canvas';

/**
 * Wrapper for html2canvas that suppresses the document.write warning
 * 
 * IMPORTANT: html2canvas internally uses document.write() in its iframe-based
 * rendering approach, which triggers warnings in modern browsers:
 * "[Violation] Avoid using document.write()"
 * 
 * This wrapper doesn't fix the underlying issue but prevents the warning from 
 * appearing in the console by temporarily overriding console.warn/error during
 * the html2canvas operation.
 * 
 * Alternative solutions:
 * 1. Use a different library like dom-to-image
 * 2. Use a custom fork of html2canvas that doesn't use document.write
 * 3. Wait for html2canvas to update their implementation
 */
function captureElement(element: HTMLElement, options: Parameters<typeof html2canvas>[1]): Promise<HTMLCanvasElement> {
  // Store the original console functions
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Helper to check if a message is about document.write
  const isDocWriteMessage = (msg: any) => {
    return typeof msg === 'string' && 
      (msg.includes('document.write') || 
       msg.includes('Avoid using document.write') ||
       msg.includes('Violation'));
  };
  
  // Replace console.warn with a filtered version
  console.warn = function(...args: any[]) {
    // Filter out the document.write warning
    if (args.length > 0 && isDocWriteMessage(args[0])) {
      return; // Suppress this specific warning
    }
    // Pass through all other warnings
    originalWarn.apply(console, args);
  };
  
  // Replace console.error with a filtered version
  console.error = function(...args: any[]) {
    // Filter out the document.write error
    if (args.length > 0 && isDocWriteMessage(args[0])) {
      return; // Suppress this specific error
    }
    // Pass through all other errors
    originalError.apply(console, args);
  };
  
  // Call html2canvas with the provided options
  return html2canvas(element, options)
    .finally(() => {
      // Restore the original console functions when done
      console.warn = originalWarn;
      console.error = originalError;
    });
}

interface Pixel {
  x: number;
  y: number;
  color: string;
  velocity: {
    x: number;
    y: number;
  };
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  delayFactor?: number;
}

// Simplify to just the four cardinal directions
type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Options for the Thanos snap effect
 */
interface ThanosSnapOptions {
  /** Duration of the animation in seconds. Default: 0.8 */
  duration?: number;
  /** Direction in which particles will move. Default: 'up' */
  direction?: Direction;
  /** X-axis vector for particle movement (-1.0 to 1.0). Negative is left, positive is right. Default: 0 */
  vectorX?: number;
  /** Y-axis vector for particle movement (-1.0 to 1.0). Negative is up, positive is down. Default: -1 (up) */
  vectorY?: number;
  /** Callback function to execute when animation completes */
  onComplete?: () => void;
  /** Callback function to execute when animation starts */
  onStart?: () => void;
  /** Controls the density of particles (1.0 is normal, higher values create more particles). Default: 1.0 */
  particleDensity?: number;
  /** Controls the randomness of angles within a direction (0-1). Default: 0.5 */
  angleVariation?: number;
  /** Whether to remove the element from DOM or just hide it. Default: false */
  removeFromDOM?: boolean;
  /** Controls the randomness of particle movement (0-1). At 0, particles follow exact direction. At 1, particles go completely random/ballistic. Default: 0.5 */
  randomness?: number;
  /** Whether to animate the element's height collapsing. Particle animations will ALWAYS run regardless of this setting. Default: true */
  animated?: boolean;
}

/**
 * Internal options for the fade in effect
 * @private
 */
interface InternalFadeInOptions {
  /** Duration of the animation in seconds. Default: 0.8 */
  duration?: number;
  /** Delay before starting the animation in seconds. Default: 0 */
  delay?: number;
  /** Callback function to execute when animation completes */
  onComplete?: () => void;
  /** Callback function to execute when animation starts */
  onStart?: () => void;
  /** Whether to animate the element's height expanding. Default: true */
  animated?: boolean;
  /** Initial scale of the element (0-1). Default: 0.95 */
  initialScale?: number;
  /** Easing function to use for the animation. Default: 'ease-out' */
  easing?: string;
}

declare global {
  interface Window {
    Motion: {
      animate: typeof import('motion').animate;
    };
    Thanos: {
      snap: (element: HTMLElement, options?: ThanosSnapOptions) => Promise<void>;
    };
    thanossnap: {
      snap: (element: HTMLElement, options?: ThanosSnapOptions) => Promise<void>;
    };
  }
}

export class Thanos {
  private static defaultOptions: ThanosSnapOptions = {
    duration: 0.8,
    direction: 'up',
    vectorX: 0,
    vectorY: -1, // Default to upward movement
    animated: true,
    particleDensity: 1.0,
    angleVariation: 0.5, // Default angle variation (0-1, where 1 is maximum variation)
    removeFromDOM: false, // Default to just hiding the element, not removing it
    randomness: 0.5, // Default to medium randomness
  };

  private static defaultInternalFadeInOptions: InternalFadeInOptions = {
    duration: 0.8,
    delay: 0,
    animated: true,
    initialScale: 0.95,
    easing: 'ease-out',
  };

  private static getVectorAngle(
    vectorX: number = 0,
    vectorY: number = -1,
    variation: number = 0.5,
    randomness: number = 0.5
  ): { baseAngle: number; spread: number } {
    // Normalize the vector
    const length = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    
    // If the vector is zero length, default to upward
    let normalizedX = length > 0 ? vectorX / length : 0;
    let normalizedY = length > 0 ? vectorY / length : -1;
    
    // Calculate the base angle from the vector
    // atan2 takes y first, then x, and returns angle in radians
    // Note: atan2 uses a different coordinate system where y-down is positive
    // so we negate y to match our coordinate system where y-up is negative
    const baseAngle = Math.atan2(normalizedY, normalizedX);
    
    // When randomness is at maximum (1.0), allow for full 360° explosion effect
    if (randomness >= 0.95) {
      return { baseAngle: 0, spread: Math.PI * 2 }; // Full circle explosion
    }
    
    // If randomness is very low, return the exact direction with minimal spread
    if (randomness < 0.1) {
      return { baseAngle, spread: 0.1 * variation }; // Minimal spread for visual interest
    }
    
    // For normal cases, calculate the spread based on both parameters
    const maxSpread = Math.PI * variation; // Maximum possible spread based on variation
    const actualSpread = maxSpread * randomness; // Actual spread used based on randomness
    
    return { baseAngle, spread: actualSpread };
  }

  // For backward compatibility, convert direction to vector
  private static directionToVector(direction: Direction): { x: number; y: number } {
    switch (direction) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      default: return { x: 0, y: -1 }; // Default to up
    }
  }

  private static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  public static snap(
    element: HTMLElement,
    options: ThanosSnapOptions = {}
  ): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    let { 
      duration = 0.8, 
      direction = 'up', 
      vectorX = 0,
      vectorY = -1,
      onComplete, 
      onStart,
      particleDensity = 1.0,
      angleVariation = 0.5,
      removeFromDOM = false,
      randomness = 0.5,
      animated = true,
    } = mergedOptions;

    // For backward compatibility, if direction is provided but vectors aren't explicitly set,
    // convert the direction to vectors
    if (options.direction && options.vectorX === undefined && options.vectorY === undefined) {
      const vector = this.directionToVector(direction);
      vectorX = vector.x;
      vectorY = vector.y;
    }

    // Note: The 'animated' option controls whether the element's height collapses smoothly.
    // When animated=false, the element is immediately hidden but particles still animate.
    // The actual implementation of this behavior is handled in the code below.

    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      
      if (!ctx) {
        console.error('Could not get canvas context');
        resolve();
        return;
      }
      
      // Call onStart callback if provided
      if (onStart) onStart();
      
      const rect = element.getBoundingClientRect();
      
      // Store original dimensions and styles
      const originalHeight = rect.height;
      const originalWidth = rect.width;
      const originalMarginTop = window.getComputedStyle(element).marginTop;
      const originalMarginBottom = window.getComputedStyle(element).marginBottom;
      const originalTransition = element.style.transition;
      const originalOverflow = element.style.overflow;
      const originalDisplay = window.getComputedStyle(element).display;
      const originalPosition = window.getComputedStyle(element).position;
      const originalPointerEvents = window.getComputedStyle(element).pointerEvents;
      
      // Add padding to allow particles to move outside the element's boundaries
      const padding = 300;
      canvas.width = rect.width + padding * 2;
      canvas.height = rect.height + padding * 2;
      
      // Create a container for the canvas that will move
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = (rect.left - padding) + 'px';
      container.style.top = (rect.top - padding) + 'px';
      container.style.width = canvas.width + 'px';
      container.style.height = canvas.height + 'px';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '10000';
      container.style.overflow = 'visible';
      container.style.willChange = 'transform';
      
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.overflow = 'visible';
      canvas.style.willChange = 'transform';
      
      container.appendChild(canvas);
      document.body.appendChild(container);
      
      // Create a placeholder element for height animation
      let heightPlaceholder: HTMLElement | null = null;
      
      if (animated) {
        // Create a placeholder div that will animate the height
        heightPlaceholder = document.createElement('div');
        
        // Copy the element's dimensions and margins
        heightPlaceholder.style.height = `${originalHeight}px`;
        heightPlaceholder.style.width = `${originalWidth}px`;
        heightPlaceholder.style.marginTop = originalMarginTop;
        heightPlaceholder.style.marginBottom = originalMarginBottom;
        heightPlaceholder.style.transition = `height ${duration}s cubic-bezier(0.25, 1, 0.5, 1), margin ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`;
        heightPlaceholder.style.overflow = 'hidden';
        heightPlaceholder.style.display = originalDisplay === 'inline' ? 'inline-block' : originalDisplay;
        
        // Insert the placeholder right before the element to maintain layout
        element.parentNode?.insertBefore(heightPlaceholder, element);
        
        // Force a reflow
        heightPlaceholder.offsetHeight;
        
        // Start the height animation on the placeholder
        heightPlaceholder.style.height = '0px';
        heightPlaceholder.style.marginTop = '0px';
        heightPlaceholder.style.marginBottom = '0px';
      } else {
        // If height animation is disabled, immediately hide the element
        // Use position absolute to remove it from the flow without affecting layout
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
        element.style.pointerEvents = 'none';
      }
      
      captureElement(element, {
        backgroundColor: null,
        scale: 1,
        logging: false,
        useCORS: true
      }).then((elementCanvas: HTMLCanvasElement) => {
        // Hide the original element after capturing it, if not already hidden
        if (animated) {
          // Use position absolute to remove it from the flow without affecting layout
          // since the placeholder is now taking its place
          element.style.position = 'absolute';
          element.style.visibility = 'hidden';
          element.style.pointerEvents = 'none';
        }
        // If animated is false, the element is already hidden in the setup code
        
        // IMPORTANT: Particle animation always runs regardless of animated setting
        // The animated option only affects layout animations (height)
        
        const elementCtx = elementCanvas.getContext('2d')!;
        const imageData = elementCtx.getImageData(0, 0, elementCanvas.width, elementCanvas.height);
        const pixelData = imageData.data;
        
        const { baseAngle, spread } = this.getVectorAngle(vectorX, vectorY, angleVariation, randomness);
        const baseSpeed = 350;
        
        // Debug log to verify direction and angles
        console.log(`Vector: (${vectorX}, ${vectorY}), Base Angle: ${baseAngle}, Spread: ${spread}, AngleVariation: ${angleVariation}, Randomness: ${randomness}`);
        
        // Draw the initial image to the canvas (centered with padding)
        ctx.drawImage(elementCanvas, padding, padding);
        
        // Calculate maximum number of particles based on element size and density
        // This helps prevent excessive particles on large elements
        const maxArea = 100000; // Roughly a 300x300 element
        const elementArea = elementCanvas.width * elementCanvas.height;
        const areaSizeRatio = Math.min(1, maxArea / elementArea);
        
        // Special case for small elements - increase particle density
        const isSmallElement = elementArea < 40000; // Roughly a 200x200 element
        
        // Performance optimization: Limit maximum particles based on device performance
        // Use a more aggressive step size to reduce particle count on slower devices
        const maxParticles = 10000; // Dramatically increased for more visible dust
        
        // Adjust step size based on particle density and element size - smaller step size for more particles
        let stepSize = isSmallElement 
          ? Math.max(1, Math.round(1 / (particleDensity * areaSizeRatio * 4.0))) // Much more particles for small elements
          : Math.max(1, Math.round(1 / (particleDensity * areaSizeRatio * 3.0))); // Much more particles for larger elements
        
        // Estimate particle count and adjust step size if needed to stay under max
        const estimatedPixels = Math.ceil((elementCanvas.width / stepSize) * (elementCanvas.height / stepSize) * particleDensity * 0.8);
        if (estimatedPixels > maxParticles) {
          // Increase step size to reduce particle count
          const scaleFactor = Math.sqrt(estimatedPixels / maxParticles);
          stepSize = Math.max(1, Math.ceil(stepSize * scaleFactor));
        }
        
        // Performance optimization: Pre-allocate array with estimated size
        // Estimate the number of particles based on element size and density
        const estimatedParticleCount = Math.min(maxParticles, Math.ceil((elementCanvas.width / stepSize) * (elementCanvas.height / stepSize) * particleDensity * 0.8));
        const pixels: Pixel[] = new Array(estimatedParticleCount);
        let pixelCount = 0;
        
        // Create dust particles with optimized sampling
        for (let y = 0; y < elementCanvas.height; y += stepSize) {
          for (let x = 0; x < elementCanvas.width; x += stepSize) {
            const i = (y * elementCanvas.width + x) * 4;
            
            // Skip fully transparent pixels
            if (pixelData[i + 3] < 5) continue;
            
            // Skip random pixels for performance while maintaining visual quality
            if (Math.random() > particleDensity * 0.98) continue;
            
            // Create 1-3 particles per pixel for more density
            const particleCount = Math.random() < 0.7 ? (Math.random() < 0.5 ? 3 : 2) : 1;
            
            for (let p = 0; p < particleCount; p++) {
              // Add some randomness to position
              const offsetX = (Math.random() - 0.5) * 4;
              const offsetY = (Math.random() - 0.5) * 4;
              
              // Randomize angle within the spread range
              // Use a more varied distribution for better randomization
              let angle;
              
              // When randomness is at maximum, create a true explosion effect
              if (randomness >= 0.95) {
                // Full 360° explosion regardless of direction
                angle = Math.random() * Math.PI * 2;
              } else if (randomness > 0.1) {
                // Apply directional randomness based on the randomness parameter
                // First, get the base angle for the direction
                const directionBaseAngle = baseAngle;
                
                // Then apply randomness based on the direction and angleVariation
                // Use a balanced distribution around the base angle
                // This ensures particles go in both directions from the base angle
                const spreadAmount = Math.PI * angleVariation * randomness;
                
                // Use a more balanced random distribution to avoid bias
                // Instead of Math.random() * 2 - 1, use a more controlled approach
                // that ensures a more even distribution around the center
                let randomFactor;
                
                if (direction === 'up' || direction === 'down') {
                  // For vertical directions, ensure we have a balanced horizontal distribution
                  // This helps prevent the right-leaning bias in the 'up' direction
                  
                  // Use a triangular distribution for more particles in the center
                  // and fewer at the extremes
                  const r1 = Math.random();
                  const r2 = Math.random();
                  randomFactor = (r1 - r2); // Triangular distribution centered at 0
                } else {
                  // For horizontal directions, use the standard distribution
                  randomFactor = Math.random() * 2 - 1;
                }
                
                angle = directionBaseAngle + randomFactor * spreadAmount;
              } else {
                // If randomness is very low, use a very small random variation for visual interest
                // Still apply the angleVariation to determine the maximum possible deviation
                const smallRandomFactor = (Math.random() - 0.5) * 0.2 * angleVariation;
                angle = baseAngle + smallRandomFactor;
              }
              
              // Calculate delay factor based on position within the element
              // This creates a wave-like disintegration effect
              const normalizedX = x / elementCanvas.width;
              const normalizedY = y / elementCanvas.height;
              
              // Adjust delay based on direction to create a wave effect
              let delayFactor;
              
              // Calculate delay based on normalized position and vector direction
              // This creates a wave-like disintegration effect
              // For upward movement (negative Y), start from bottom (high Y)
              // For downward movement (positive Y), start from top (low Y)
              // For leftward movement (negative X), start from right (high X)
              // For rightward movement (positive X), start from left (low X)
              
              if (Math.abs(vectorY) > Math.abs(vectorX)) {
                // Primarily vertical movement
                delayFactor = vectorY < 0 ? normalizedY : 1 - normalizedY;
              } else if (Math.abs(vectorX) > Math.abs(vectorY)) {
                // Primarily horizontal movement
                delayFactor = vectorX < 0 ? normalizedX : 1 - normalizedX;
              } else {
                // Diagonal or balanced movement
                delayFactor = (normalizedX + normalizedY) / 2;
              }
              
              // Add some randomness to the delay
              delayFactor = delayFactor * 0.7 + Math.random() * 0.3;
              
              // Vary speed significantly for splash effect - more randomness
              // When randomness is at maximum, increase speed variation for more dramatic effect
              const speedVariationBase = randomness >= 0.95 ? 0.6 : 0.4;
              const speedVariationRange = randomness >= 0.95 ? 2.0 : 1.5;
              const speedVariation = speedVariationBase + Math.random() * speedVariationRange;
              const speed = baseSpeed * speedVariation;
              
              // Random size for each particle - smaller size for more grain-like appearance
              // Increased size range for more visible particles
              // When randomness is at maximum, create more varied particle sizes
              const sizeVariationMin = randomness >= 0.95 ? 0.3 : 0.5;
              const sizeVariationMax = randomness >= 0.95 ? 3.0 : 2.0;
              const sizeVariation = sizeVariationMin + Math.random() * (sizeVariationMax - sizeVariationMin);
              const size = sizeVariation;
              
              // Add rotation for more dynamic movement - more extreme rotation
              const rotation = Math.random() * Math.PI * 2;
              // When randomness is at maximum, increase rotation speed for more chaotic movement
              const rotationSpeedBase = randomness >= 0.95 ? 30 : 20;
              const rotationSpeed = (Math.random() - 0.5) * rotationSpeedBase;
              
              // Performance optimization: Direct array assignment instead of push
              pixels[pixelCount++] = {
                // Add padding to initial position so particles start at the element's position
                x: x + offsetX + padding,
                y: y + offsetY + padding,
                color: `rgba(${pixelData[i]},${pixelData[i + 1]},${pixelData[i + 2]},${pixelData[i + 3] / 255})`,
                velocity: {
                  x: Math.cos(angle) * speed,
                  y: Math.sin(angle) * speed
                },
                size,
                rotation,
                rotationSpeed,
                opacity: 1.0,
                delayFactor // Add delay factor to create wave effect
              };
            }
          }
        }
        
        // Trim the array to the actual number of particles
        pixels.length = pixelCount;

        let lastTimestamp = performance.now();
        let frameCount = 0;
        let lastFpsUpdate = performance.now();
        let fps = 60;
        
        const animate = (timestamp: number) => {
          // Update FPS counter every 500ms
          frameCount++;
          if (timestamp - lastFpsUpdate > 500) {
            fps = Math.round((frameCount / (timestamp - lastFpsUpdate)) * 1000);
            frameCount = 0;
            lastFpsUpdate = timestamp;
          }
          
          const deltaTime = Math.min(0.05, (timestamp - lastTimestamp) / 1000); // Cap delta time to prevent large jumps
          const elapsed = (timestamp - startTime) / 1000;
          const progress = Math.min(1, elapsed / duration);
          
          // Use a smoother easing function
          const easeProgress = this.easeOutQuad(progress);
          
          // Move the container in the direction
          const containerDistance = randomness >= 0.95 ? 200 : 150;
          const containerX = Math.cos(baseAngle) * containerDistance * easeProgress;
          const containerY = Math.sin(baseAngle) * containerDistance * easeProgress;
          
          // Add a slight random offset to the container movement for more natural effect
          // This helps prevent the bias toward one side
          const randomOffsetX = (Math.random() * 2 - 1) * 10 * easeProgress;
          const randomOffsetY = (Math.random() * 2 - 1) * 10 * easeProgress;
          
          // Performance optimization: Use transform3d for hardware acceleration
          container.style.transform = `translate3d(${containerX + randomOffsetX}px, ${containerY + randomOffsetY}px, 0)`;
          
          // Performance optimization: Skip frames if needed to maintain performance
          // Only process every other frame if we're running below target FPS
          if (fps < 40 && timestamp % 2 !== 0) { // Target at least 40fps
            // Even when skipping frames, still update positions to maintain animation smoothness
            for (let i = 0; i < pixels.length; i++) {
              const pixel = pixels[i];
              // Update physics
              // When randomness is at maximum, increase gravity for more dramatic arcs
              const gravityForce = randomness >= 0.95 ? 120 : 80;
              
              // Apply gravity based on vector direction
              // We want gravity to generally work downward, but adjust based on the vector
              let gravityX = 0;
              let gravityY = 0;
              
              // Apply stronger gravity for upward movement to create arcs
              if (vectorY < -0.5) {
                // For primarily upward movement, apply stronger downward gravity
                gravityY = gravityForce;
              } else if (vectorY > 0.5) {
                // For primarily downward movement, enhance downward acceleration
                gravityY = gravityForce * 0.5;
              } else {
                // For horizontal or diagonal movement, apply a moderate downward gravity
                gravityY = gravityForce * 0.7;
              }
              
              // For horizontal movement, add a small gravity component in the opposite direction
              if (Math.abs(vectorX) > 0.7) {
                gravityX = -vectorX * gravityForce * 0.2;
              }
              
              // Apply gravity to velocity
              pixel.velocity.y += gravityY * deltaTime;
              pixel.velocity.x += gravityX * deltaTime;
              
              // Update position
              pixel.x += pixel.velocity.x * deltaTime;
              pixel.y += pixel.velocity.y * deltaTime;
              pixel.rotation += pixel.rotationSpeed * deltaTime;
            }
            requestAnimationFrame(animate);
            return;
          }
          
          // Clear with proper alpha - use a more efficient clearing method
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Only draw the original image at the very beginning of the animation
          // and fade it out quickly to avoid the dark veil effect
          if (progress < 0.05) {
            // Draw original image with decreasing opacity at the start
            ctx.globalAlpha = 1 - progress * 20; // Fade out very quickly (gone by 5% of animation)
            ctx.drawImage(elementCanvas, padding, padding);
            ctx.globalAlpha = 1;
          }
          
          // Performance optimization: Pre-calculate fadeProgress outside the loop
          const fadeStart = 0.1;
          const fadeProgress = Math.max(0, (progress - fadeStart) / (1 - fadeStart));
          
          // Performance optimization: Use fewer opacity groups and limit total particles rendered
          const opacityGroups: {[key: string]: {[color: string]: Pixel[]}} = {};
          const opacityLevels = 2; // Reduce from 3 to 2 for better performance
          let totalParticlesToRender = 0;
          const maxParticlesPerFrame = fps < 50 ? 3000 : 5000; // Dramatically increased for more visible dust
          
          // Update physics and group particles in a single pass
          for (let i = 0; i < pixels.length; i++) {
            const pixel = pixels[i];
            
            // Apply delay factor to create wave-like disintegration
            // If the animation hasn't reached this particle's delay point, keep it in place
            const pixelDelayThreshold = pixel.delayFactor || 0;
            const adjustedProgress = Math.max(0, (progress - pixelDelayThreshold * 0.4) / (1 - pixelDelayThreshold * 0.4));
            
            if (adjustedProgress <= 0) {
              // Particle hasn't started moving yet, keep it in its original position
              continue;
            }
            
            // Update physics
            // When randomness is at maximum, increase gravity for more dramatic arcs
            const gravityForce = randomness >= 0.95 ? 120 : 80;
            
            // Apply gravity based on vector direction
            // We want gravity to generally work downward, but adjust based on the vector
            let gravityX = 0;
            let gravityY = 0;
            
            // Apply stronger gravity for upward movement to create arcs
            if (vectorY < -0.5) {
              // For primarily upward movement, apply stronger downward gravity
              gravityY = gravityForce;
            } else if (vectorY > 0.5) {
              // For primarily downward movement, enhance downward acceleration
              gravityY = gravityForce * 0.5;
            } else {
              // For horizontal or diagonal movement, apply a moderate downward gravity
              gravityY = gravityForce * 0.7;
            }
            
            // For horizontal movement, add a small gravity component in the opposite direction
            if (Math.abs(vectorX) > 0.7) {
              gravityX = -vectorX * gravityForce * 0.2;
            }
            
            // Apply gravity to velocity
            pixel.velocity.y += gravityY * deltaTime;
            pixel.velocity.x += gravityX * deltaTime;
            
            // Update position
            pixel.x += pixel.velocity.x * deltaTime;
            pixel.y += pixel.velocity.y * deltaTime;
            pixel.rotation += pixel.rotationSpeed * deltaTime;
            
            // Fade out gradually but more slowly
            pixel.opacity = Math.max(0, 1 - (adjustedProgress * 0.8)); // Slowed down fade-out by 20%
            
            // Skip nearly transparent particles
            if (pixel.opacity < 0.01) continue; // Reduced from 0.03 to show more faint particles
            
            // Performance optimization: Skip more particles when FPS is low
            const skipThreshold = fps < 50 ? (0.2 + adjustedProgress * 0.3) : (0.05 + adjustedProgress * 0.2);
            if (pixels.length > maxParticlesPerFrame && Math.random() > (1 - skipThreshold)) continue;
            
            // Group by rounded opacity to reduce context changes
            // Use fewer opacity levels for better performance
            const roundedOpacity = Math.floor(pixel.opacity * opacityLevels) / opacityLevels;
            
            if (!opacityGroups[roundedOpacity]) {
              opacityGroups[roundedOpacity] = {};
            }
            
            // Further group by color to reduce fillStyle changes
            if (!opacityGroups[roundedOpacity][pixel.color]) {
              opacityGroups[roundedOpacity][pixel.color] = [];
            }
            
            opacityGroups[roundedOpacity][pixel.color].push(pixel);
            totalParticlesToRender++;
            
            // Performance optimization: Limit total particles rendered
            if (totalParticlesToRender >= maxParticlesPerFrame) break;
          }
          
          // Performance optimization: Render in batches by opacity and color
          const opacityKeys = Object.keys(opacityGroups);
          for (let k = 0; k < opacityKeys.length; k++) {
            const opacity = parseFloat(opacityKeys[k]);
            const colorGroups = opacityGroups[opacity];
            
            // Set opacity once for the whole opacity group
            ctx.globalAlpha = opacity;
            
            // Render each color group
            const colorKeys = Object.keys(colorGroups);
            for (let c = 0; c < colorKeys.length; c++) {
              const color = colorKeys[c];
              const particles = colorGroups[color];
              
              // Set color once for the whole color group
              ctx.fillStyle = color;
              
              // Batch rendering for small particles, individual rendering for larger ones
              const smallParticles: Pixel[] = [];
              const largeParticles: Pixel[] = [];
              
              // Separate particles by size
              for (let i = 0; i < particles.length; i++) {
                const pixel = particles[i];
                if (pixel.size < 1.2) {
                  smallParticles.push(pixel);
                } else {
                  largeParticles.push(pixel);
                }
              }
              
              // Batch render small particles without rotation for performance
              if (smallParticles.length > 0) {
                // For small particles, use a more efficient drawing approach
                // Draw each particle individually but without context save/restore
                for (let i = 0; i < smallParticles.length; i++) {
                  const pixel = smallParticles[i];
                  const renderSize = pixel.size * 1.2;
                  
                  // Use fillRect directly for better performance
                  ctx.fillRect(
                    pixel.x - renderSize/2, 
                    pixel.y - renderSize/2, 
                    renderSize, 
                    renderSize
                  );
                }
              }
              
              // Render larger particles individually with rotation
              for (let i = 0; i < largeParticles.length; i++) {
                const pixel = largeParticles[i];
                
                ctx.save();
                ctx.translate(pixel.x, pixel.y);
                ctx.rotate(pixel.rotation);
                
                // Draw the particle with slightly increased size for better visibility
                const renderSize = pixel.size * 1.3;
                ctx.fillRect(-renderSize/2, -renderSize/2, renderSize, renderSize);
                
                ctx.restore();
              }
            }
          }
          
          lastTimestamp = timestamp;
          
          if (progress < 1) {
            // Performance optimization: Use requestAnimationFrame more efficiently
            requestAnimationFrame(animate);
          } else {
            container.remove();
            
            // Remove the height placeholder if it exists
            if (heightPlaceholder && heightPlaceholder.parentNode) {
              heightPlaceholder.parentNode.removeChild(heightPlaceholder);
            }
            
            // Handle the element based on removeFromDOM option
            if (removeFromDOM) {
              // Remove the element from the DOM
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            } else {
              // Just hide the element but keep it in the DOM
              // Restore original styles except for display
              element.style.display = 'none';
              element.style.visibility = '';
              element.style.overflow = originalOverflow;
              element.style.position = originalPosition;
              element.style.pointerEvents = originalPointerEvents;
            }
            
            if (onComplete) onComplete();
            resolve();
          }
        };
        
        // Start the animation loop
        requestAnimationFrame(animate);
      });
    });
  }

  /**
   * Internal method to fade in an element
   * @param element The HTML element to animate
   * @param options Animation options
   * @returns Promise that resolves when animation completes
   * @private
   */
  private static _fadeIn(
    element: HTMLElement,
    options: InternalFadeInOptions = {}
  ): Promise<void> {
    const mergedOptions = { ...this.defaultInternalFadeInOptions, ...options };
    const { 
      duration = 0.8, 
      delay = 0, 
      onComplete, 
      onStart,
      animated = true,
      initialScale = 0.95,
      easing = 'ease-out'
    } = mergedOptions;

    return new Promise((resolve) => {
      // Store original styles
      const originalDisplay = element.style.display || '';
      const originalVisibility = element.style.visibility || '';
      const originalOpacity = element.style.opacity || '';
      const originalTransform = element.style.transform || '';
      const originalHeight = element.style.height || '';
      const originalOverflow = element.style.overflow || '';
      const originalTransition = element.style.transition || '';

      // Get computed height before hiding
      const computedHeight = window.getComputedStyle(element).height;
      
      // Set initial state
      element.style.opacity = '0';
      element.style.transform = `scale(${initialScale})`;
      element.style.display = originalDisplay === 'none' ? 'block' : originalDisplay;
      element.style.visibility = 'visible';
      
      // If animated is false, just show the element immediately
      if (!animated) {
        element.style.opacity = originalOpacity || '1';
        element.style.transform = originalTransform;
        
        // Call onStart callback if provided
        if (onStart) onStart();
        
        // Call onComplete callback if provided
        if (onComplete) onComplete();
        resolve();
        return;
      }
      
      // For height animation
      if (animated) {
        // Set initial height to 0 if it was previously hidden
        if (originalDisplay === 'none' || originalVisibility === 'hidden') {
          element.style.height = '0';
          element.style.overflow = 'hidden';
        }
      }
      
      // Force a reflow
      element.offsetHeight;
      
      // Call onStart callback if provided
      if (onStart) onStart();
      
      // Set transition
      element.style.transition = `opacity ${duration}s ${easing} ${delay}s, transform ${duration}s ${easing} ${delay}s${animated ? `, height ${duration}s ${easing} ${delay}s` : ''}`;
      
      // Start animation
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
        
        if (animated && element.style.height === '0px') {
          element.style.height = computedHeight;
        }
      }, 20); // Small delay to ensure transition works
      
      // Clean up after animation
      const totalDuration = (duration + delay) * 1000;
      setTimeout(() => {
        // Restore original styles except display and visibility
        element.style.transition = originalTransition;
        element.style.overflow = originalOverflow;
        
        // If height was animated, reset it
        if (animated && element.style.height !== originalHeight) {
          element.style.height = originalHeight;
        }
        
        // Call onComplete callback if provided
        if (onComplete) onComplete();
        resolve();
      }, totalDuration + 50); // Add a small buffer
    });
  }
}

// Make Thanos available globally in browser environments
if (typeof window !== 'undefined') {
  // Create a global object with the snap method properly bound
  const thanosGlobal = {
    snap: Thanos.snap.bind(Thanos)
  };
  
  // Assign to window.Thanos directly
  window.Thanos = thanosGlobal;
  

  
  // Debug log
  console.log('thanossnap library loaded, Thanos.snap is available');
}