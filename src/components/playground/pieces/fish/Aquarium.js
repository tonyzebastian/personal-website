'use client';

import { useEffect, useRef } from 'react';
import './fish.css';

// A School of Fish (from the playground repo): twenty fish follow the cursor
// and scatter when you click; ten more drift behind the water's surface. The
// swimming is the original's, but measured inside this box instead of the
// window, and everything stops when the piece unmounts. The original moves a
// fixed step per frame, so it slowed down whenever the page drew fewer
// frames; here each step is scaled by the time that passed, tuned to how the
// original looks at 120 frames a second.

const FOREGROUND = 20;
const BACKGROUND = 10;
const FRAME = 1000 / 120;

// One school: `follow` fish chase the cursor, the others wander between
// random points every five seconds.
function createSchool(root, nodes, { follow }) {
  const size = () => root.getBoundingClientRect();
  let { width, height } = size();

  const fishData = nodes.map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    velocityX: 0,
    velocityY: 0,
    speed: follow ? 0.5 + Math.random() * 0.3 : 0.2 + Math.random() * 0.2,
    maxSpeed: follow ? 2 + Math.random() * 1 : 1 + Math.random() * 0.5,
    acceleration: follow ? 0.05 + Math.random() * 0.05 : 0.02 + Math.random() * 0.02,
    currentAngle: 0,
    personalSpace: follow ? 30 + Math.random() * 50 : 100 + Math.random() * 100,
    targetX: follow ? width / 2 : Math.random() * width,
    targetY: follow ? height / 2 : Math.random() * height,
  }));

  // k: how many 120fps frames this step stands for.
  const update = (fish, data, index, k) => {
    const dx = data.targetX - data.x;
    const dy = data.targetY - data.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget > 5) {
      const accelerationFactor = Math.min(1, distToTarget / 200);
      let accX = (dx / distToTarget) * data.acceleration * accelerationFactor * k;
      let accY = (dy / distToTarget) * data.acceleration * accelerationFactor * k;

      // Keep some distance from the others.
      fishData.forEach((other, otherIndex) => {
        if (index === otherIndex) return;
        const offsetX = data.x - other.x;
        const offsetY = data.y - other.y;
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        const space = data.personalSpace * (1 + distToTarget / 1000);
        if (distance < space && distance > 0) {
          const repulsion = (space - distance) / space;
          accX += (offsetX / distance) * repulsion * 0.3 * k;
          accY += (offsetY / distance) * repulsion * 0.3 * k;
        }
      });

      data.velocityX += accX;
      data.velocityY += accY;
      const currentSpeed = Math.sqrt(data.velocityX ** 2 + data.velocityY ** 2);
      if (currentSpeed > data.maxSpeed) {
        data.velocityX = (data.velocityX / currentSpeed) * data.maxSpeed;
        data.velocityY = (data.velocityY / currentSpeed) * data.maxSpeed;
      }
    } else {
      data.velocityX *= 0.98 ** k;
      data.velocityY *= 0.98 ** k;
    }

    data.x += data.velocityX * data.speed * k;
    data.y += data.velocityY * data.speed * k;

    // Swim off one edge, come back on the other.
    const margin = 50;
    if (data.x < -margin) data.x = width + margin;
    if (data.x > width + margin) data.x = -margin;
    if (data.y < -margin) data.y = height + margin;
    if (data.y > height + margin) data.y = -margin;

    if (Math.sqrt(data.velocityX ** 2 + data.velocityY ** 2) > 0.1) {
      const targetAngle = Math.atan2(data.velocityY, data.velocityX);
      const diff = Math.atan2(Math.sin(targetAngle - data.currentAngle), Math.cos(targetAngle - data.currentAngle));
      data.currentAngle += diff * (1 - 0.9 ** k);
    }

    fish.style.transform = `translate(${data.x}px, ${data.y}px) rotate(${data.currentAngle}rad)`;
  };

  return {
    step(k) {
      nodes.forEach((fish, index) => update(fish, fishData[index], index, k));
    },
    resize() {
      ({ width, height } = size());
    },
    target(x, y) {
      fishData.forEach((data) => {
        data.targetX = x;
        data.targetY = y;
      });
    },
    wander() {
      fishData.forEach((data) => {
        data.targetX = Math.random() * width;
        data.targetY = Math.random() * height;
      });
    },
    scatter(x, y) {
      fishData.forEach((data) => {
        const dx = data.x - x;
        const dy = data.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / distance;
        const dirY = dy / distance;
        data.velocityX = dirX * 10;
        data.velocityY = dirY * 10;
        data.targetX = data.x + dirX * 200;
        data.targetY = data.y + dirY * 200;
      });
    },
  };
}

export default function Aquarium() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const front = createSchool(root, [...root.querySelectorAll('.fish')], { follow: true });
    const back = createSchool(root, [...root.querySelectorAll('.background-fish')], { follow: false });

    const local = (event) => {
      const rect = root.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    };
    const onMove = (event) => front.target(...local(event));
    const onClick = (event) => front.scatter(...local(event));
    root.addEventListener('pointermove', onMove);
    root.addEventListener('click', onClick);

    const resizeObserver = new ResizeObserver(() => {
      front.resize();
      back.resize();
    });
    resizeObserver.observe(root);
    const wander = setInterval(back.wander, 5000);

    // Capped, so a long pause (a hidden tab) doesn't send them leaping.
    let last = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const k = Math.min(now - last, 100) / FRAME;
      last = now;
      front.step(k);
      back.step(k);
      raf = requestAnimationFrame(frame);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(wander);
      resizeObserver.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div ref={rootRef} className="aquarium" role="img" aria-label="Fish swimming after the cursor">
      <div className="background-layer sub-bg" />
      <div className="background-fish-container">
        {Array.from({ length: BACKGROUND }, (_, index) => (
          <div key={index} className="background-fish">
            <img src={`/playground/fish/fish${(index % 10) + 1}.webp`} alt="" />
          </div>
        ))}
      </div>
      <div className="background-layer main-bg" />
      <div className="fish-container">
        {Array.from({ length: FOREGROUND }, (_, index) => (
          <div key={index} className="fish">
            <img src={`/playground/fish/fish${(index % 20) + 1}.webp`} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { Aquarium as Piece };
