"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const PALETTE = ["#0f172a", "#334155", "#64748b", "#92400e"];
const FISH_SOURCES = [
  "/images/home-experiment/fish-1.png",
  "/images/home-experiment/fish-3.png",
  "/images/home-experiment/fish-5.png",
];
const GROUPS = [
  { x: 0.92, y: -0.03, delay: 0, size: 42, speed: 3.2, vertical: 0.52, spread: 136 },
  { x: 1.03, y: 0.08, delay: 100, size: 18, speed: 4.5, vertical: 0.45, spread: 72 },
  { x: 0.72, y: -0.03, delay: 200, size: 8, speed: 1.8, vertical: 0.62, spread: 44 },
  { x: 1.03, y: 0.2, delay: 300, size: 54, speed: 2.7, vertical: 0.55, spread: 164 },
  { x: 0.82, y: -0.03, delay: 400, size: 1, speed: 4.8, vertical: 0.35, spread: 0 },
  { x: 1.03, y: 0.34, delay: 500, size: 20, speed: 2.1, vertical: 0.62, spread: 72 },
  { x: 0.55, y: -0.03, delay: 600, size: 34, speed: 3.7, vertical: 0.66, spread: 112 },
  { x: 1.02, y: 0.48, delay: 700, size: 1, speed: 1.9, vertical: 0.58, spread: 0 },
  { x: 0.38, y: -0.03, delay: 800, size: 30, speed: 2.4, vertical: 0.48, spread: 96 },
  { x: 1.03, y: 0.62, delay: 900, size: 12, speed: 4.2, vertical: 0.34, spread: 54 },
  { x: 0.65, y: -0.03, delay: 1000, size: 6, speed: 2.9, vertical: 0.58, spread: 38 },
  { x: 1.03, y: 0.76, delay: 1100, size: 1, speed: 3.9, vertical: 0.24, spread: 0 },
  { x: 0.25, y: -0.03, delay: 1200, size: 38, speed: 1.7, vertical: 0.6, spread: 128 },
  { x: 1.03, y: 0.5, delay: 1300, size: 14, speed: 3.4, vertical: 0.46, spread: 58 },
];
const BASE_AGENT_COUNT = GROUPS.reduce((total, group) => total + group.size, 0);

function getFishSize(groupSize) {
  if (groupSize === 1) return 72 + Math.random() * 22;
  if (groupSize <= 8) return 36 + Math.random() * 16;
  if (groupSize <= 20) return 24 + Math.random() * 12;
  return 15 + Math.random() * 10;
}

export default function BoidsIntroCanvas({
  count = BASE_AGENT_COUNT,
  runId = 0,
  onComplete,
  className,
}) {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const agents = [];
    const sprites = FISH_SOURCES.map((source) => {
      const image = new Image();
      image.src = source;
      return image;
    });
    let raf = 0;
    let startTime = 0;
    let completed = false;

    const width = () => canvas.width / dpr;
    const height = () => canvas.height / dpr;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current?.();
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const W = width();
    const H = height();
    const countScale = count / BASE_AGENT_COUNT;

    GROUPS.forEach((group, groupIndex) => {
      const groupSize =
        group.size === 1
          ? 1
          : Math.max(3, Math.round(group.size * countScale));

      for (let index = 0; index < groupSize; index++) {
        const speed = group.speed * (0.88 + Math.random() * 0.24);
        agents.push({
          x: group.x * W + (Math.random() - 0.5) * group.spread,
          y: group.y * H + (Math.random() - 0.5) * group.spread * 0.68,
          vx: -speed * (0.88 + Math.random() * 0.08),
          vy: speed * (group.vertical + (Math.random() - 0.5) * 0.1),
          cruiseSpeed: speed,
          vertical: group.vertical,
          color: PALETTE[(groupIndex + index) % PALETTE.length],
          size: getFishSize(group.size),
          spriteIndex: (groupIndex + index) % sprites.length,
          group: groupIndex,
          activeAt: group.delay + Math.random() * 180,
          exited: false,
        });
      }
    });

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(finish);

      return () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
      };
    }

    const perception = 40;
    const step = (time) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const currentWidth = width();
      const currentHeight = height();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      let remaining = 0;

      for (const agent of agents) {
        if (agent.exited || elapsed < agent.activeAt) continue;

        let alignmentX = 0;
        let alignmentY = 0;
        let separationX = 0;
        let separationY = 0;
        let cohesionX = 0;
        let cohesionY = 0;
        let neighbours = 0;

        for (const neighbour of agents) {
          if (
            agent === neighbour ||
            neighbour.exited ||
            elapsed < neighbour.activeAt ||
            agent.group !== neighbour.group
          ) {
            continue;
          }

          const dx = neighbour.x - agent.x;
          const dy = neighbour.y - agent.y;
          const distanceSquared = dx * dx + dy * dy;
          const personalSpace = Math.max(
            18,
            (agent.size + neighbour.size) * 0.32,
          );
          const perceptionDistance = Math.max(
            perception,
            personalSpace * 2.3,
          );

          if (distanceSquared < perceptionDistance * perceptionDistance) {
            alignmentX += neighbour.vx;
            alignmentY += neighbour.vy;
            cohesionX += neighbour.x;
            cohesionY += neighbour.y;

            if (
              distanceSquared < personalSpace * personalSpace &&
              distanceSquared > 0.0001
            ) {
              const distance = Math.sqrt(distanceSquared);
              separationX -= dx / distance;
              separationY -= dy / distance;
            }

            neighbours++;
          }
        }

        if (neighbours > 0) {
          agent.vx += (alignmentX / neighbours - agent.vx) * 0.035;
          agent.vy += (alignmentY / neighbours - agent.vy) * 0.035;
          agent.vx += (cohesionX / neighbours - agent.x) * 0.00055;
          agent.vy += (cohesionY / neighbours - agent.y) * 0.00055;
          agent.vx += separationX * 0.055;
          agent.vy += separationY * 0.055;
        }

        agent.vx += (-agent.cruiseSpeed * 0.88 - agent.vx) * 0.014;
        agent.vy +=
          (agent.cruiseSpeed * agent.vertical - agent.vy) * 0.014;

        const speed = Math.hypot(agent.vx, agent.vy);
        const maxSpeed = agent.cruiseSpeed * 1.22;
        if (speed > maxSpeed) {
          agent.vx = (agent.vx / speed) * maxSpeed;
          agent.vy = (agent.vy / speed) * maxSpeed;
        }

        agent.x += agent.vx;
        agent.y += agent.vy;

        if (
          agent.x < -agent.size ||
          agent.y > currentHeight + agent.size
        ) {
          agent.exited = true;
          continue;
        }

        remaining++;

        const angle = Math.atan2(agent.vy, agent.vx);
        ctx.save();
        ctx.translate(agent.x, agent.y);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.94;

        const sprite = sprites[agent.spriteIndex];
        if (sprite.complete && sprite.naturalWidth > 0) {
          const renderHeight =
            agent.size * (sprite.naturalHeight / sprite.naturalWidth);
          ctx.drawImage(
            sprite,
            -agent.size / 2,
            -renderHeight / 2,
            agent.size,
            renderHeight,
          );
        } else {
          ctx.fillStyle = agent.color;
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(-4, 3);
          ctx.lineTo(-4, -3);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if ((remaining === 0 && elapsed > 3000) || elapsed > 16500) {
        finish();
        return;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [count, runId]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full bg-white",
        className,
      )}
      aria-hidden="true"
    />
  );
}
