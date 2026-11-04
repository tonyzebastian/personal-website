'use client'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'motion/react'
import Fit from '../Fit'

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const SPHERE_MATH = {
  degreesToRadians: (degrees) => degrees * (Math.PI / 180),
  radiansToDegrees: (radians) => radians * (180 / Math.PI),

  sphericalToCartesian: (radius, theta, phi) => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }),

  calculateDistance: (pos, center = { x: 0, y: 0, z: 0 }) => {
    const dx = pos.x - center.x
    const dy = pos.y - center.y
    const dz = pos.z - center.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  },

  normalizeAngle: (angle) => {
    while (angle > 180) angle -= 360
    while (angle < -180) angle += 360
    return angle
  }
}

const ANIMATION_CONFIG = {
  modal: {
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    content: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
      transition: { ease: "easeOut", duration: 0.3 }
    }
  }
}

// Motion is tuned per frame at 120 frames a second; each step is scaled by
// the time that passed, so the spin is the same on any screen or load.
const FRAME = 1000 / 120

// Fibonacci-sphere spread of `count` points, nudged toward the poles and
// jittered a little so the pattern doesn't look mechanical.
function generateSpherePositions(count, radius) {
  const positions = []
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const angleIncrement = 2 * Math.PI / goldenRatio

  for (let i = 0; i < count; i++) {
    const t = i / count
    const inclination = Math.acos(1 - 2 * t)
    const azimuth = angleIncrement * i

    let phi = inclination * (180 / Math.PI)
    let theta = (azimuth * (180 / Math.PI)) % 360

    const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35
    phi = phi < 90 ? Math.max(5, phi - poleBonus) : Math.min(175, phi + poleBonus)
    phi = 15 + (phi / 180) * 150

    theta = (theta + Math.random() * 20) % 360
    phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10))

    positions.push({ theta, phi, radius })
  }
  return positions
}

// Where each image sits on screen for the current rotation: position, scale
// (smaller toward the edges and the back, and shrunk where neighbours would
// overlap), stacking order and fade near the back.
function calculateWorldPositions(imagePositions, rotation, radius, baseImageSize) {
  const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x)
  const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y)

  const positions = imagePositions.map((pos) => {
    const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta)
    const phiRad = SPHERE_MATH.degreesToRadians(pos.phi)

    let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad)
    let y = pos.radius * Math.cos(phiRad)
    let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad)

    // Y-axis rotation (horizontal drag), then X-axis (vertical drag).
    const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad)
    const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad)
    x = x1
    z = z1
    const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad)
    const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad)
    y = y2
    z = z2

    const fadeZoneStart = -10
    const fadeZoneEnd = -30
    const isVisible = z > fadeZoneEnd
    const fadeOpacity = z <= fadeZoneStart ? Math.max(0, (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd)) : 1

    const isPoleImage = pos.phi < 30 || pos.phi > 150
    const distanceRatio = Math.min(Math.sqrt(x * x + y * y) / radius, 1)
    const centerScale = Math.max(0.3, 1 - distanceRatio * (isPoleImage ? 0.4 : 0.7))
    const depthScale = (z + radius) / (2 * radius)
    const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3)

    return { x, y, z, scale, zIndex: Math.round(1000 + z), isVisible, fadeOpacity }
  })

  // Shrink images that would overlap a visible neighbour.
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    if (!pos.isVisible) continue
    let adjustedScale = pos.scale
    const imageSize = baseImageSize * adjustedScale
    for (let j = 0; j < positions.length; j++) {
      const other = positions[j]
      if (i === j || !other.isVisible) continue
      const dx = pos.x - other.x
      const dy = pos.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minDistance = (imageSize + baseImageSize * other.scale) / 2 + 25
      if (distance < minDistance && distance > 0) {
        const overlap = minDistance - distance
        adjustedScale *= Math.max(0.4, 1 - (overlap / minDistance) * 0.6)
      }
    }
    pos.scale = Math.max(0.25, adjustedScale)
  }

  return positions
}

// ==========================================
// MAIN COMPONENT
// ==========================================

// A sphere of photos you can spin. Rotation, momentum, dragging and hover live
// in refs and one animation loop writes each image's size, position and
// opacity straight to its element, so React renders only when a photo is
// opened, not every frame. Images facing away are hidden, not unmounted.
const SphereImageGrid = ({
  images = [],
  containerSize = 400,
  sphereRadius = 200,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3
}) => {
  const radius = sphereRadius || containerSize * 0.5
  const baseImageSize = containerSize * baseImageScale

  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePositions] = useState(() => generateSpherePositions(images.length, radius))
  const nodeRefs = useRef([])
  // hovered: index of the image under the pointer (-1 for none); the sphere
  // holds still while it is set, so the image can be clicked.
  const motionState = useRef({
    rotation: { x: 15, y: 15 },
    velocity: { x: 0, y: 0 },
    dragging: false,
    hovered: -1,
    last: { x: 0, y: 0 }
  })

  const clamp = useCallback(
    (speed) => Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed)),
    [maxRotationSpeed]
  )

  // The loop: momentum and auto-rotation, then draw. Drawn once before the
  // first paint so images never flash at the top left.
  useLayoutEffect(() => {
    const state = motionState.current

    const draw = () => {
      const positions = calculateWorldPositions(imagePositions, state.rotation, radius, baseImageSize)
      positions.forEach((pos, index) => {
        const node = nodeRefs.current[index]
        if (!node) return
        if (!pos.isVisible) {
          node.style.display = 'none'
          if (state.hovered === index) state.hovered = -1
          return
        }
        const size = baseImageSize * pos.scale
        const style = node.style
        style.display = ''
        style.width = `${size}px`
        style.height = `${size}px`
        style.left = `${containerSize / 2 + pos.x}px`
        style.top = `${containerSize / 2 + pos.y}px`
        style.opacity = String(pos.fadeOpacity)
        style.zIndex = String(pos.zIndex)
      })
    }

    draw()
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const k = Math.min(now - last, 100) / FRAME
      last = now
      if (!state.dragging) {
        const decay = momentumDecay ** k
        state.velocity.x *= decay
        state.velocity.y *= decay
        let y = state.rotation.y + clamp(state.velocity.y) * k
        if (autoRotate && state.hovered === -1) y += autoRotateSpeed * k
        state.rotation = {
          x: SPHERE_MATH.normalizeAngle(state.rotation.x + clamp(state.velocity.x) * k),
          y: SPHERE_MATH.normalizeAngle(y)
        }
      }
      draw()
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [imagePositions, radius, baseImageSize, containerSize, momentumDecay, autoRotate, autoRotateSpeed, clamp])

  // Dragging: started on the sphere, followed on the window so it keeps
  // going if the pointer leaves the sphere mid-drag.
  useEffect(() => {
    const state = motionState.current
    const onMove = (event) => {
      if (!state.dragging) return
      const delta = {
        x: clamp(-(event.clientY - state.last.y) * dragSensitivity),
        y: clamp((event.clientX - state.last.x) * dragSensitivity)
      }
      state.rotation = {
        x: SPHERE_MATH.normalizeAngle(state.rotation.x + delta.x),
        y: SPHERE_MATH.normalizeAngle(state.rotation.y + delta.y)
      }
      state.velocity = delta
      state.last = { x: event.clientX, y: event.clientY }
    }
    const onUp = () => {
      state.dragging = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [clamp, dragSensitivity])

  const onPointerDown = (event) => {
    if (event.button !== 0) return
    const state = motionState.current
    state.dragging = true
    state.hovered = -1
    state.velocity = { x: 0, y: 0 }
    state.last = { x: event.clientX, y: event.clientY }
  }

  const renderSpotlightModal = () => {
    return (
      createPortal(<AnimatePresence>
        {selectedImage && (
          <m.div
            className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
            {...ANIMATION_CONFIG.modal.backdrop}
          >
            <m.div
              className="bg-white rounded-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              {...ANIMATION_CONFIG.modal.content}
            >
              <div className="relative aspect-square">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Close photo"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{selectedImage.title}</h3>
                <p className="text-gray-600">{selectedImage.description}</p>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>, document.body)
    )
  }

  if (!images.length) return null

  return (
    <>
      <m.div
        className="relative select-none cursor-grab active:cursor-grabbing"
        style={{
          width: containerSize,
          height: containerSize,
          perspective: `${perspective}px`,
          // The drag owns touch here (the page doesn't scroll under it).
          touchAction: 'none'
        }}
        onPointerDown={onPointerDown}
        /* One fade for the whole sphere: a per-image stagger left images
           that rotate into view later stuck at scale 0. */
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }}
      >
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => (
            <m.div
              key={image.id}
              ref={(node) => {
                nodeRefs.current[index] = node
              }}
              className="absolute cursor-pointer select-none"
              // Centred with Motion's x/y rather than a transform string, so
              // the hover scale adds to the centring instead of replacing it.
              style={{ x: '-50%', y: '-50%' }}
              whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              onHoverStart={() => {
                motionState.current.hovered = index
              }}
              onHoverEnd={() => {
                if (motionState.current.hovered === index) motionState.current.hovered = -1
              }}
              onClick={() => setSelectedImage(image)}
            >
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white/20">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {renderSpotlightModal()}
    </>
  )
}

export default SphereImageGrid

// ==========================================
// PLAYGROUND PIECE (from the playground repo's img-sphere page)
// ==========================================

const BASE_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1758178309498-036c3d7d73b3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 1",
    title: "Mountain Landscape",
    description: "A beautiful landscape captured at golden hour with mountains in the background."
  },
  {
    src: "https://images.unsplash.com/photo-1757647016230-d6b42abc6cc9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2072",
    alt: "Image 2",
    title: "Portrait Photography",
    description: "Stunning portrait photography showcasing natural lighting and composition."
  },
  {
    src: "https://images.unsplash.com/photo-1757906447358-f2b2cb23d5d8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 3",
    title: "Urban Architecture",
    description: "Modern architectural design featuring clean lines and geometric patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1742201877377-03d18a323c18?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1064",
    alt: "Image 4",
    title: "Nature Scene",
    description: "Peaceful nature scene with vibrant colors and natural beauty."
  },
  {
    src: "https://images.unsplash.com/photo-1757081791153-3f48cd8c67ac?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 5",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1757626961383-be254afee9a0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 6",
    title: "Mountain Landscape",
    description: "A beautiful landscape captured at golden hour with mountains in the background."
  },
  {
    src: "https://images.unsplash.com/photo-1756748371390-099e4e6683ae?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 7",
    title: "Portrait Photography",
    description: "Stunning portrait photography showcasing natural lighting and composition."
  },
  {
    src: "https://images.unsplash.com/photo-1755884405235-5c0213aa3374?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 8",
    title: "Urban Architecture",
    description: "Modern architectural design featuring clean lines and geometric patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1757495404191-e94ed7e70046?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 9",
    title: "Nature Scene",
    description: "Peaceful nature scene with vibrant colors and natural beauty."
  },
  {
    src: "https://images.unsplash.com/photo-1756197256528-f9e6fcb82b04?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1064",
    alt: "Image 10",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1534083220759-4c3c00112ea0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987",
    alt: "Image 11",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  },
  {
    src: "https://images.unsplash.com/photo-1755278338891-e8d8481ff087?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1674",
    alt: "Image 12",
    title: "Abstract Art",
    description: "Creative abstract composition with bold colors and unique patterns."
  }
]

const IMAGES = Array.from({ length: 60 }, (_, i) => {
  const baseImage = BASE_IMAGES[i % BASE_IMAGES.length]
  return { id: `img-${i + 1}`, ...baseImage, alt: `${baseImage.alt} (${Math.floor(i / BASE_IMAGES.length) + 1})` }
})

const CONFIG = {
  containerSize: 600,
  sphereRadius: 200,
  dragSensitivity: 0.8,
  momentumDecay: 0.96,
  maxRotationSpeed: 6,
  baseImageScale: 0.15,
  perspective: 1000,
  autoRotate: true,
  autoRotateSpeed: 0.2,
}

export function Piece() {
  return (
    <Fit width={600} height={600}>
      <SphereImageGrid images={IMAGES} {...CONFIG} />
    </Fit>
  )
}
