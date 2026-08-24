import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type { HeroShape } from "@/lib/avengers/heroes";

interface HeroSceneProps {
  shape: HeroShape;
  colorA: string;
  colorB: string;
  className?: string;
  interactive?: boolean;
}

function buildCoreGeometry(shape: HeroShape): THREE.BufferGeometry {
  switch (shape) {
    case "reactor":
      return new THREE.TorusGeometry(1, 0.34, 24, 80);
    case "shield":
      return new THREE.CylinderGeometry(1.25, 1.25, 0.18, 64);
    case "hammer":
      return new THREE.BoxGeometry(1.4, 0.9, 0.9);
    case "arrow":
      return new THREE.ConeGeometry(0.75, 2.2, 6);
    case "gamma":
      return new THREE.IcosahedronGeometry(1.25, 1);
    case "web":
      return new THREE.OctahedronGeometry(1.3, 2);
    case "cloak":
      return new THREE.DodecahedronGeometry(1.2, 0);
    case "wing":
      return new THREE.TorusKnotGeometry(0.8, 0.22, 128, 16, 2, 5);
    case "star":
      return new THREE.TetrahedronGeometry(1.5, 0);
    default:
      return new THREE.SphereGeometry(1.15, 48, 48);
  }
}

const HeroScene: React.FC<HeroSceneProps> = ({ shape, colorA, colorB, className, interactive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.6, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const keyLight = new THREE.PointLight(cA.getHex(), 40, 40);
    keyLight.position.set(3, 3, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(cB.getHex(), 30, 40);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    const coreGeo = buildCoreGeometry(shape);
    const coreMat = new THREE.MeshStandardMaterial({
      color: cA,
      emissive: cA.clone().multiplyScalar(0.35),
      metalness: 0.9,
      roughness: 0.22,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const wireGeo = new THREE.IcosahedronGeometry(1.95, 1);
    const wireMat = new THREE.MeshBasicMaterial({ color: cB, wireframe: true, transparent: true, opacity: 0.28 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    group.add(wire);

    const ringGeo = new THREE.RingGeometry(2.3, 2.36, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: cA, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.4;
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 3;
    group.add(ring1, ring2);

    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 2.6 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.035, color: cB, transparent: true, opacity: 0.75 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    let targetX = 0;
    let targetY = 0;
    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetY = ((e.clientX - rect.left) / rect.width - 0.5) * 1.6;
      targetX = ((e.clientY - rect.top) / rect.height - 0.5) * 1.0;
    };
    if (interactive) container.addEventListener("pointermove", onPointer);

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      group.rotation.y += (targetY - group.rotation.y) * 0.05 + 0.004;
      group.rotation.x += (targetX - group.rotation.x) * 0.05;
      core.rotation.z = t * 0.35;
      wire.rotation.y = -t * 0.18;
      ring1.rotation.z = t * 0.5;
      ring2.rotation.z = -t * 0.35;
      points.rotation.y = t * 0.05;
      group.position.y = Math.sin(t * 0.9) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container.clientWidth) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      if (interactive) container.removeEventListener("pointermove", onPointer);
      renderer.domElement.remove();
      renderer.dispose();
      [coreGeo, wireGeo, ringGeo, pGeo].forEach((g) => g.dispose());
      [coreMat, wireMat, ringMat, pMat].forEach((m) => m.dispose());
    };
  }, [shape, colorA, colorB, interactive]);

  return <div ref={containerRef} className={className} />;
};

export default HeroScene;
