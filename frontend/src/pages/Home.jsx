import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchMovies } from '../services/api';
import { getMoviePosterUrl } from '../utils/helpers';

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// ============================================================
// PROGRAMMATIC TEXTURES
// ============================================================

function createBrassRoughnessMap() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    // Base medium roughness
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, 0, size, size);
    // Circular machining marks
    const cx = size / 2, cy = size / 2;
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 0.6;
    for (let r = 4; r < size / 2; r += 2.5) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Fine random scratches
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const len = Math.random() * 15 + 3;
        const angle = Math.random() * Math.PI * 2;
        ctx.strokeStyle = `rgba(80,80,80,${Math.random() * 0.35 + 0.05})`;
        ctx.lineWidth = Math.random() * 0.7 + 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

function createFilmLayerNormalMap() {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 512;
    const ctx = c.getContext('2d');
    for (let y = 0; y < 512; y++) {
        const phase = y % 5;
        const g = phase < 2 ? 155 : phase < 4 ? 100 : 128;
        ctx.fillStyle = `rgb(128,${g},255)`;
        ctx.fillRect(0, y, 8, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 6);
    return tex;
}

function createFilmStripAlphaMap() {
    const w = 128, h = 1024;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    // Perforations on both edges
    ctx.fillStyle = '#000000';
    const pw = 7, ph = 10, sp = 18;
    for (let y = 0; y < h; y += sp) {
        ctx.fillRect(5, y + 4, pw, ph);
        ctx.fillRect(w - 5 - pw, y + 4, pw, ph);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 22);
    return tex;
}

function createFilmStripColorMap() {
    const w = 128, h = 1024;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // Dark amber-brown base
    ctx.fillStyle = '#16120c';
    ctx.fillRect(0, 0, w, h);
    // Edge bands
    ctx.fillStyle = '#1e1a12';
    ctx.fillRect(0, 0, 15, h);
    ctx.fillRect(w - 15, 0, 15, h);
    // Frame dividers
    ctx.strokeStyle = '#282018';
    ctx.lineWidth = 1;
    const fh = 30;
    for (let y = 0; y < h; y += fh) {
        ctx.beginPath(); ctx.moveTo(15, y); ctx.lineTo(w - 15, y); ctx.stroke();
    }
    // Subtle frame content rectangles
    for (let y = 0; y < h; y += fh) {
        ctx.fillStyle = `rgba(28,24,18,${Math.random() * 0.25 + 0.1})`;
        ctx.fillRect(18, y + 3, w - 36, fh - 6);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 22);
    return tex;
}

// ============================================================
// GEOMETRY SHAPE GENERATORS
// ============================================================

function createPlateShape() {
    const s = new THREE.Shape();
    const outerR = 2.83, hubR = 0.88;
    s.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    // Center hub opening
    const ch = new THREE.Path();
    ch.absarc(0, 0, hubR, 0, Math.PI * 2, true);
    s.holes.push(ch);
    // 5 cutout openings between spokes
    const spokeHalf = 0.30; // Wide spokes matching the reference
    const cutInner = 1.38, cutOuter = 2.68;
    for (let i = 0; i < 5; i++) {
        const center = (i * Math.PI * 2) / 5;
        const gapStart = center + spokeHalf;
        const gapEnd = center + (Math.PI * 2 / 5) - spokeHalf;
        const h = new THREE.Path();
        h.moveTo(Math.cos(gapStart) * cutInner, Math.sin(gapStart) * cutInner);
        h.absarc(0, 0, cutInner, gapStart, gapEnd, false);
        h.lineTo(Math.cos(gapEnd) * cutOuter, Math.sin(gapEnd) * cutOuter);
        h.absarc(0, 0, cutOuter, gapEnd, gapStart, true);
        h.closePath();
        s.holes.push(h);
    }
    return s;
}

function createRingShape(outerR, innerR) {
    const s = new THREE.Shape();
    s.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    const h = new THREE.Path();
    h.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    s.holes.push(h);
    return s;
}

function createFilmStripCurve() {
    const R = 2.35;
    const theta = -Math.PI / 3; // 5 o'clock position
    const p0 = new THREE.Vector3(R * Math.cos(theta), R * Math.sin(theta), 0);

    // Tangent direction for CCW unwinding (points right and up)
    const t0 = new THREE.Vector3(-Math.sin(theta), Math.cos(theta), 0).normalize();

    // Control points for a natural, gravity-affected physical curve
    const p1 = p0.clone().add(t0.clone().multiplyScalar(1.8));
    const p2 = new THREE.Vector3(5.5, -3.5, 0.5);
    const p3 = new THREE.Vector3(9.5, -4.5, 1.2);

    return new THREE.CubicBezierCurve3(p0, p1, p2, p3);
}

function createFilmStripShape() {
    const s = new THREE.Shape();
    // Width must exactly match the wound film depth (0.75 total)
    const hw = 0.375;
    const ht = 0.005; // physical thickness

    // Draw along Y to align with the Z binormal, keeping texture UV sequence intact
    s.moveTo(ht, -hw);
    s.lineTo(ht, hw);
    s.lineTo(-ht, hw);
    s.lineTo(-ht, -hw);
    s.closePath();

    return s;
}

// ============================================================
// FILM REEL ASSEMBLY
// ============================================================

function FilmReelAssembly() {
    // --- MATERIALS ---
    const polishedBrass = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f0c459'), metalness: 1.0, roughness: 0.12,
        clearcoat: 0.4, clearcoatRoughness: 0.1,
    }), []);

    const agedBrass = useMemo(() => {
        const rMap = createBrassRoughnessMap();
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#d4a849'), metalness: 1.0, roughness: 0.22,
            roughnessMap: rMap, clearcoat: 0.2,
        });
    }, []);

    const darkBrass = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#b38a36'), metalness: 1.0, roughness: 0.35,
    }), []);

    const darkMetal = useMemo(() => new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2e2518'), metalness: 1.0, roughness: 0.3,
    }), []);

    const filmMat = useMemo(() => {
        const nMap = createFilmLayerNormalMap();
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#111111'), roughness: 0.25, metalness: 0.8,
            normalMap: nMap, normalScale: new THREE.Vector2(0.3, 0.3), clearcoat: 0.3, clearcoatRoughness: 0.1,
        });
    }, []);

    const filmEndMat = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#151515'), roughness: 0.3, metalness: 0.6,
    }), []);

    // --- SHAPES (memoized) ---
    const plateShape = useMemo(() => createPlateShape(), []);
    const rimShape = useMemo(() => createRingShape(3.05, 2.82), []);
    const outerHubShape = useMemo(() => createRingShape(1.28, 0.92), []);
    const innerHubShape = useMemo(() => createRingShape(0.68, 0.48), []);
    const woundFilmShape = useMemo(() => createRingShape(2.35, 1.42), []);

    // --- EXTRUDE SETTINGS ---
    const HD = 0.45; // half-depth
    const PT = 0.08; // plate thickness

    const plateExt = useMemo(() => ({
        depth: PT, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02,
        bevelSegments: 4, curveSegments: 128,
    }), []);

    const rimExt = useMemo(() => ({
        depth: HD * 2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03,
        bevelSegments: 5, curveSegments: 128,
    }), []);

    const hubExt = useMemo(() => ({
        depth: 0.055, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014,
        bevelSegments: 3, curveSegments: 64,
    }), []);

    const filmExt = useMemo(() => ({
        depth: HD * 2 - 0.16, bevelEnabled: false, curveSegments: 96,
    }), []);

    // Mounting holes + screws positions
    const mountAngles = useMemo(() =>
        Array.from({ length: 5 }, (_, i) => (i * Math.PI * 2) / 5), []);
    const screwAngles = useMemo(() =>
        Array.from({ length: 5 }, (_, i) => (i * Math.PI * 2) / 5 + Math.PI / 5), []);

    const spinRef = useRef();

    useFrame((state) => {
        if (spinRef.current) {
            // Subtle rotation based on mouse cursor instead of constant spin
            const targetZ = state.pointer.x * 0.5;
            spinRef.current.rotation.z = THREE.MathUtils.lerp(spinRef.current.rotation.z, targetZ, 0.02);
        }
    });

    return (
        <group rotation={[0.12, -0.25, 0.02]} scale={0.95}>
            <group ref={spinRef}>
                {/* ======= OUTER RIM (structural ring connecting both plates) ======= */}
                <mesh position={[0, 0, -HD]} material={polishedBrass} castShadow receiveShadow>
                    <extrudeGeometry args={[rimShape, rimExt]} />
                </mesh>

                {/* ======= FRONT PLATE ======= */}
                <mesh position={[0, 0, HD - PT]} material={agedBrass} castShadow receiveShadow>
                    <extrudeGeometry args={[plateShape, plateExt]} />
                </mesh>

                {/* ======= BACK PLATE ======= */}
                <mesh position={[0, 0, -HD]} material={agedBrass} castShadow receiveShadow>
                    <extrudeGeometry args={[plateShape, plateExt]} />
                </mesh>

                {/* ======= FRONT HUB ASSEMBLY ======= */}
                <group position={[0, 0, HD]}>
                    {/* Outer hub ring (raised, polished) */}
                    <mesh material={polishedBrass} castShadow>
                        <extrudeGeometry args={[outerHubShape, hubExt]} />
                    </mesh>
                    {/* Inner hub ring */}
                    <mesh position={[0, 0, 0.015]} material={polishedBrass} castShadow>
                        <extrudeGeometry args={[innerHubShape, hubExt]} />
                    </mesh>
                    {/* Concentric recessed ring (visual detail) */}
                    <mesh position={[0, 0, 0.005]} material={darkBrass}>
                        <ringGeometry args={[0.90, 0.95, 64]} />
                    </mesh>

                    {/* Mounting holes (dark cylinders simulating depth) */}
                    {mountAngles.map((a, i) => (
                        <mesh key={`mh-${i}`}
                            position={[Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0.028]}
                            rotation={[Math.PI / 2, 0, 0]} material={darkMetal}>
                            <cylinderGeometry args={[0.055, 0.055, 0.12, 16]} />
                        </mesh>
                    ))}

                    {/* Screws (small raised cylinders) */}
                    {screwAngles.map((a, i) => (
                        <mesh key={`sc-${i}`}
                            position={[Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.055]}
                            rotation={[Math.PI / 2, 0, 0]} material={polishedBrass}>
                            <cylinderGeometry args={[0.05, 0.05, 0.025, 12]} />
                        </mesh>
                    ))}
                </group>

                {/* ======= BACK HUB (simpler, partially hidden) ======= */}
                <mesh position={[0, 0, -HD - 0.04]} material={darkBrass} receiveShadow>
                    <extrudeGeometry args={[outerHubShape, { ...hubExt, depth: 0.035 }]} />
                </mesh>

                {/* ======= CENTER AXLE (deep dark opening) ======= */}
                <mesh rotation={[Math.PI / 2, 0, 0]} material={darkMetal}>
                    <cylinderGeometry args={[0.48, 0.48, HD * 2 + 0.2, 48, 1, true]} />
                </mesh>
                {/* Deep inner axle */}
                <mesh rotation={[Math.PI / 2, 0, 0]} material={darkMetal}>
                    <cylinderGeometry args={[0.35, 0.35, HD * 2 + 0.3, 32, 1, true]} />
                </mesh>

                {/* ======= WOUND PHOTOGRAPHIC FILM ======= */}
                {/* Main body (ring extrusion) */}
                <mesh position={[0, 0, -(HD - 0.08)]} material={filmMat} receiveShadow>
                    <extrudeGeometry args={[woundFilmShape, filmExt]} />
                </mesh>
                {/* Outer cylindrical edge (visible through cutouts) */}
                <mesh rotation={[Math.PI / 2, 0, 0]} material={filmMat} receiveShadow>
                    <cylinderGeometry args={[2.35, 2.35, HD * 2 - 0.15, 96, 1, true]} />
                </mesh>
                {/* Inner cylindrical surface */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.42, 1.42, HD * 2 - 0.15, 48, 1, true]} />
                    <meshPhysicalMaterial color="#0c0a06" roughness={0.15} metalness={0.03} side={THREE.DoubleSide} />
                </mesh>
                {/* Front film edge face (visible through cutouts) */}
                <mesh position={[0, 0, HD - 0.07]} material={filmEndMat}>
                    <ringGeometry args={[1.42, 2.35, 96]} />
                </mesh>
                {/* Back film edge face */}
                <mesh position={[0, 0, -(HD - 0.07)]} rotation={[0, Math.PI, 0]} material={filmEndMat}>
                    <ringGeometry args={[1.42, 2.35, 96]} />
                </mesh>
            </group>

            {/* ======= FILM STRIP (Attached to Reel, but not spinning with it) ======= */}
            <FilmStrip35mm />
        </group>
    );
}

// ============================================================
// 35mm FILM STRIP
// ============================================================

function FilmStrip35mm() {
    const curve = useMemo(() => createFilmStripCurve(), []);
    const shape = useMemo(() => createFilmStripShape(), []);
    const alphaMap = useMemo(() => createFilmStripAlphaMap(), []);
    const colorMap = useMemo(() => createFilmStripColorMap(), []);

    const material = useMemo(() => new THREE.MeshPhysicalMaterial({
        map: colorMap, alphaMap, transparent: true, alphaTest: 0.4,
        side: THREE.DoubleSide, roughness: 0.10, metalness: 0.03,
        clearcoat: 0.5, clearcoatRoughness: 0.18,
    }), [alphaMap, colorMap]);

    return (
        <mesh material={material} castShadow receiveShadow>
            <extrudeGeometry args={[shape, { extrudePath: curve, steps: 250, bevelEnabled: false }]} />
        </mesh>
    );
}

// ============================================================
// HERO 3D SCENE
// ============================================================

function HeroScene({ isDragging, dragDeltaX, reducedMotion }) {
    const { camera, gl, viewport } = useThree();
    const sceneGroupRef = useRef();
    const reelGroupRef = useRef();
    const dragRotY = useRef(0);
    const idlePhase = useRef(0);

    // Camera & renderer setup
    useEffect(() => {
        if (gl) {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }
    }, [camera, gl]);

    // Per-frame animation
    useFrame((state) => {
        if (!sceneGroupRef.current || !reelGroupRef.current) return;
        const t = state.clock.elapsedTime;

        // Mouse parallax (disabled during drag)
        if (!isDragging.current) {
            const px = (state.pointer.x * Math.PI) / 70;
            const py = (state.pointer.y * Math.PI) / 90;
            sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
                sceneGroupRef.current.rotation.y, px, 0.012
            );
            sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
                sceneGroupRef.current.rotation.x, -py * 0.4, 0.012
            );
        }

        // Drag rotation (spring-damped return when released)
        const dragTarget = isDragging.current
            ? THREE.MathUtils.clamp(dragDeltaX.current * 0.006, -Math.PI / 4, Math.PI / 4)
            : 0;
        dragRotY.current = THREE.MathUtils.lerp(
            dragRotY.current, dragTarget, isDragging.current ? 0.08 : 0.02
        );

        // Idle animation (floating and extremely slow rotation)
        if (!reducedMotion.current) {
            idlePhase.current = t;
            reelGroupRef.current.position.y = Math.sin(t * 0.4) * 0.04;
        }

        // Combine drag and subtle idle rotation (around 4-5 degrees = ~0.08 radians)
        reelGroupRef.current.rotation.y = dragRotY.current + Math.sin(idlePhase.current * 0.25) * 0.08;
        reelGroupRef.current.rotation.x = Math.sin(idlePhase.current * 0.2) * 0.03;
    });

    // ScrollTrigger choreography
    useEffect(() => {
        const ctx = gsap.context(() => {
            if (!sceneGroupRef.current || !reelGroupRef.current) return;
            ScrollTrigger.create({
                trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1.2,
                animation: gsap.to(sceneGroupRef.current.position, { y: 2.5, z: -5, ease: 'power1.inOut' })
            });
            ScrollTrigger.create({
                trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1.2,
                animation: gsap.to(reelGroupRef.current.rotation, { z: -Math.PI / 10, x: -0.12, ease: 'power1.inOut' })
            });
        });
        return () => ctx.revert();
    }, []);

    // Responsive reel position - make it smaller and position it better
    const reelX = viewport.width > 10 ? 4.0 : viewport.width > 6 ? 2.8 : 0;
    const reelScale = viewport.width > 10 ? 0.75 : viewport.width > 6 ? 0.6 : 0.5;

    return (
        <>
            <Environment preset="studio" environmentIntensity={2.5} />
            <group ref={sceneGroupRef} position={[reelX, 0.0, 0]} scale={reelScale}>
                <ambientLight intensity={0.5} color="#ffffff" />
                
                {/* LARGE SOFTBOX: front-left key light */}
                <rectAreaLight position={[-8, 8, 10]} width={15} height={15} intensity={15} color="#ffffff" onUpdate={(self) => self.lookAt(0,0,0)} />
                
                {/* FRONT BROAD SOFTBOX: create gradient across flat face */}
                <rectAreaLight position={[2, 2, 12]} width={25} height={25} intensity={10} color="#ffffff" onUpdate={(self) => self.lookAt(0,0,0)} />
                
                {/* VERTICAL SOFTBOX: right side for long specular reflection */}
                <rectAreaLight position={[10, 0, 8]} width={2} height={16} intensity={12} color="#fff2e0" onUpdate={(self) => self.lookAt(0,0,0)} />
                
                {/* TOP SOFTBOX: upper rim highlight */}
                <rectAreaLight position={[0, 12, 2]} width={16} height={4} intensity={8} color="#ffffff" onUpdate={(self) => self.lookAt(0,0,0)} />
                
                {/* SUBTLE RIM LIGHT: from behind/right */}
                <rectAreaLight position={[6, -4, -8]} width={8} height={8} intensity={5} color="#ffe5c2" onUpdate={(self) => self.lookAt(0,0,0)} />

                <group ref={reelGroupRef}>
                    <FilmReelAssembly />
                </group>

                <ContactShadows position={[0, -4.0, 0]} opacity={0.18} scale={18}
                    blur={4.0} far={10} resolution={256} color="#1a1208" />
            </group>
        </>
    );
}

// ============================================================
// HOME PAGE
// ============================================================

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const typographyRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const dragHintRef = useRef(null);
    const { user } = useAuth();

    // Drag interaction refs (shared with HeroScene via props)
    const isDragging = useRef(false);
    const dragDeltaX = useRef(0);
    const dragStartX = useRef(0);
    const reducedMotion = useRef(false);

    // Check prefers-reduced-motion
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotion.current = mq.matches;
        const handler = (e) => { reducedMotion.current = e.matches; };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Fetch movies
    useEffect(() => {
        fetchMovies()
            .then(data => { setMovies(data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, []);

    // GSAP entrance choreography
    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo(typographyRef.current,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 1.6 }, 0);
            tl.fromTo(canvasWrapperRef.current,
                { opacity: 0, x: 60 },
                { opacity: 1, x: 0, duration: 2.0 }, 0.25);
            tl.fromTo(dragHintRef.current,
                { opacity: 0, x: 15 },
                { opacity: 1, x: 0, duration: 1.2 }, 1.0);
        }, heroRef);
        return () => ctx.revert();
    }, [loading]);

    // Drag event handlers
    const onPointerDown = useCallback((e) => {
        isDragging.current = true;
        dragStartX.current = e.clientX;
        dragDeltaX.current = 0;
        if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grabbing';
    }, []);
    const onPointerMove = useCallback((e) => {
        if (!isDragging.current) return;
        dragDeltaX.current = e.clientX - dragStartX.current;
    }, []);
    const onPointerUp = useCallback(() => {
        isDragging.current = false;
        dragDeltaX.current = 0;
        if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grab';
    }, []);

    if (loading) return null;

    return (
        <div style={{ paddingBottom: '8rem', backgroundColor: 'var(--c-bg-main)' }}>
            {/* ======= HERO ======= */}
            <section id="hero-section" ref={heroRef}
                style={{ position: 'relative', height: '100vh', width: '100%', display: 'flex', paddingTop: '80px', overflow: 'hidden' }}>

                {/* 3D Canvas Layer */}
                <div ref={canvasWrapperRef}
                    style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0, cursor: 'grab' }}
                    onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                    <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}
                        style={{ background: 'transparent' }}>
                        <PerspectiveCamera makeDefault fov={38} position={[0, 0.3, 14]} />
                        <HeroScene isDragging={isDragging} dragDeltaX={dragDeltaX} reducedMotion={reducedMotion} />
                    </Canvas>
                </div>

                {/* Editorial Typography (left) */}
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', maxWidth: '1440px', margin: '0 auto', pointerEvents: 'none' }}>
                    <div ref={typographyRef}
                        style={{ width: '50%', padding: '4rem 0 4rem 4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: 'auto', opacity: 0 }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--c-gold)' }} />
                            <span className="font-sans" style={{ color: 'var(--c-gold)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                                Premium Cinema Platform
                            </span>
                        </div>

                        <h1 className="font-serif" style={{
                            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: 'var(--c-text-primary)',
                            lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: '1.5rem', fontWeight: 600
                        }}>
                            Experience Cinema<br />Like Never Before.
                        </h1>
                        
                        <p className="font-sans" style={{
                            color: 'var(--c-text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, 
                            maxWidth: '450px', marginBottom: '3rem'
                        }}>
                            Book tickets for the latest movies in our state-of-the-art theatres. A seamless booking experience powered by a robust database architecture.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <motion.button
                                whileHover={{ y: -2, backgroundColor: 'var(--c-gold)', color: '#fff', boxShadow: '0 10px 20px rgba(176,138,62,0.2)' }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                onClick={() => document.getElementById('now-showing')?.scrollIntoView({ behavior: 'smooth' })}
                                style={{
                                    padding: '1.1rem 2.5rem', backgroundColor: 'var(--c-gold)',
                                    color: '#fff', fontSize: '0.85rem', letterSpacing: '0.1em',
                                    fontWeight: 600, textTransform: 'uppercase', border: 'none',
                                    cursor: 'pointer', borderRadius: '4px'
                                }}>
                                EXPLORE MOVIES
                            </motion.button>

                            {user && (
                                <motion.button
                                    whileHover={{ y: -2, backgroundColor: 'rgba(176,138,62,0.05)' }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => navigate('/my-bookings')}
                                    style={{
                                        padding: '1.1rem 2.5rem', backgroundColor: 'transparent',
                                        color: 'var(--c-text-primary)', fontSize: '0.85rem', letterSpacing: '0.1em',
                                        fontWeight: 600, textTransform: 'uppercase', border: '1px solid var(--c-text-primary)',
                                        cursor: 'pointer', borderRadius: '4px'
                                    }}>
                                    VIEW BOOKINGS
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>


                {/* Bottom footer bar */}
                <div style={{
                    position: 'absolute', bottom: '2rem', left: '4rem', right: '4rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    zIndex: 15, pointerEvents: 'none',
                }}>
                    <div className="font-sans" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>
                        <span>Films</span><span>·</span><span>Data</span><span>·</span><span>Experience</span>
                    </div>
                    <div style={{ width: '100px', height: '1px', backgroundColor: 'var(--c-text-muted)', opacity: 0.3 }} />
                    <span className="font-sans" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>
                        CineTicket © 2024
                    </span>
                </div>
            </section>

            {/* ======= MOVIES CATALOGUE ======= */}
            <section id="now-showing" style={{ padding: '6rem 4rem 4rem 4rem', position: 'relative', zIndex: 20, maxWidth: '1440px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                    <h2 className="font-serif" style={{ fontSize: '2.5rem', color: 'var(--c-text-primary)', margin: 0 }}>
                        NOW SHOWING
                    </h2>
                    
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {['ALL', 'ENGLISH', 'TAMIL', 'HINDI', 'TELUGU', 'ACTION', 'SCI-FI', 'THRILLER', 'DRAMA'].map(f => {
                            const isActive = filter === f;
                            // Check if filter has matching movies
                            const hasMovies = f === 'ALL' || movies.some(m => m.Language.toUpperCase() === f || m.Genre.toUpperCase().includes(f));
                            if (!hasMovies && f !== 'ALL') return null;
                            
                            return (
                                <button key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: isActive ? 'var(--c-gold)' : 'transparent',
                                        color: isActive ? '#fff' : 'var(--c-text-secondary)',
                                        border: `1px solid ${isActive ? 'var(--c-gold)' : 'var(--c-border)'}`,
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}>
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '2.5rem' 
                }}>
                    {movies
                        .filter(m => {
                            if (filter === 'ALL') return true;
                            if (['ENGLISH', 'TAMIL', 'HINDI', 'TELUGU'].includes(filter)) return m.Language.toUpperCase() === filter;
                            return m.Genre.toUpperCase().includes(filter);
                        })
                        .map((movie, i) => (
                        <motion.div key={movie.MovieID}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '0px 0px -50px 0px' }}
                            transition={{ delay: (i % 4) * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            onClick={() => navigate(`/movies/${movie.MovieID}`)}
                            style={{ 
                                display: 'flex', flexDirection: 'column',
                                cursor: 'pointer', position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                const poster = e.currentTarget.querySelector('.movie-poster');
                                const btn = e.currentTarget.querySelector('.book-now-btn');
                                if (poster) poster.style.transform = 'scale(1.03)';
                                if (btn) {
                                    btn.style.backgroundColor = 'var(--c-gold)';
                                    btn.style.color = '#fff';
                                }
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                const poster = e.currentTarget.querySelector('.movie-poster');
                                const btn = e.currentTarget.querySelector('.book-now-btn');
                                if (poster) poster.style.transform = 'scale(1)';
                                if (btn) {
                                    btn.style.backgroundColor = 'transparent';
                                    btn.style.color = 'var(--c-text-primary)';
                                }
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '100%', aspectRatio: '2/3', backgroundColor: 'var(--c-surface)',
                                marginBottom: '1.25rem', position: 'relative', borderRadius: '8px', 
                                overflow: 'hidden', border: '1px solid rgba(176,138,62,0.15)',
                                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)'
                            }}>
                                <img className="movie-poster" src={getMoviePosterUrl(movie, i)} alt={movie.Title} 
                                     style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease-out' }} />
                                
                                {/* Inner gold highlight overlay */}
                                <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(176,138,62,0.3)', borderRadius: '8px', pointerEvents: 'none', transition: 'border-color 0.4s', zIndex: 2 }} className="poster-border" />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 0.5rem' }}>
                                <h3 className="font-serif" style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--c-text-primary)', lineHeight: 1.2 }}>{movie.Title}</h3>
                                
                                <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>{movie.Genre}</span>
                                    <span>·</span>
                                    <span>{movie.Language}</span>
                                    <span>·</span>
                                    <span>{movie.Duration}M</span>
                                </div>
                                
                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <button className="book-now-btn font-sans" style={{
                                        width: '100%', padding: '0.75rem', backgroundColor: 'transparent',
                                        color: 'var(--c-text-primary)', border: '1px solid var(--c-gold)',
                                        borderRadius: '4px', fontSize: '0.75rem', letterSpacing: '0.1em',
                                        textTransform: 'uppercase', fontWeight: 600, transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}>
                                        BOOK NOW
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}
