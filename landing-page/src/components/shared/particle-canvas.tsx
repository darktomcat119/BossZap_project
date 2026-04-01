"use client";

import { useEffect, useRef } from "react";

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface ParticleCanvasProps {
  className?: string;
  particleCount?: number;
  color?: string;
  maxDistance?: number;
  speed?: number;
  orbColors?: string[];
}

export function ParticleCanvas({
  className = "",
  particleCount = 50,
  color = "0, 212, 170",
  maxDistance = 120,
  speed = 0.3,
  orbColors,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const defaultOrbColors = [
      `rgba(0, 212, 170, 0.08)`,
      `rgba(108, 92, 231, 0.06)`,
      `rgba(9, 132, 227, 0.05)`,
    ];
    const colors = orbColors
      ? orbColors.map((c) => `rgba(${c}, 0.07)`)
      : defaultOrbColors;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    };

    const initOrbs = () => {
      const { w, h } = sizeRef.current;
      orbsRef.current = colors.map((c, i) => ({
        x: w * (0.2 + i * 0.3) + (Math.random() - 0.5) * 100,
        y: h * (0.3 + (i % 2) * 0.4) + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.min(w, h) * (0.25 + Math.random() * 0.15),
        color: c,
      }));
    };

    const initParticles = () => {
      const { w, h } = sizeRef.current;
      particlesRef.current = Array.from(
        { length: particleCount },
        () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          radius: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.6 + 0.15,
        }),
      );
    };

    const animate = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Draw floating gradient orbs
      for (const orb of orbsRef.current) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius || orb.x > w + orb.radius) orb.vx *= -1;
        if (orb.y < -orb.radius || orb.y > h + orb.radius) orb.vy *= -1;

        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius,
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update and draw particles
      for (const p of particles) {
        // Mouse repulsion
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const dm = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dm < 100 && dm > 0) {
          const force = (100 - dm) / 100 * 0.8;
          p.vx += (dmx / dm) * force;
          p.vy += (dmy / dm) * force;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Minimum speed
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd < speed * 0.3) {
          p.vx += (Math.random() - 0.5) * speed * 0.1;
          p.vy += (Math.random() - 0.5) * speed * 0.1;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > h) { p.y = h; p.vy *= -1; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections with gradient opacity
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const op = (1 - dist / maxDistance) * 0.2;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color}, ${op})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    resize();
    initOrbs();
    initParticles();
    if (!prefersReduced) animate();

    const handleResize = () => {
      resize();
      initOrbs();
      initParticles();
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount, color, maxDistance, speed, orbColors]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}
