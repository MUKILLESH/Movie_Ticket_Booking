import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
        color: new THREE.Color('#d4aa55'), metalness: 1.0, roughness: 0.20,
        clearcoat: 0.18, clearcoatRoughness: 0.10,
    }), []);

    const agedBrass = useMemo(() => {
        const rMap = createBrassRoughnessMap();
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#cda860'), metalness: 1.0, roughness: 0.28,
            roughnessMap: rMap, clearcoat: 0.12,
        });
    }, []);

    const darkBrass = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#9a8050'), metalness: 0.95, roughness: 0.45,
    }), []);

    const darkMetal = useMemo(() => new THREE.MeshStandardMaterial({
        color: new THREE.Color('#111111'), metalness: 0.85, roughness: 0.65,
    }), []);

    const filmMat = useMemo(() => {
        const nMap = createFilmLayerNormalMap();
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#0c0a06'), roughness: 0.12, metalness: 0.05,
            normalMap: nMap, normalScale: new THREE.Vector2(0.25, 0.25), clearcoat: 0.3,
        });
    }, []);

    const filmEndMat = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#080604'), roughness: 0.20, metalness: 0.03,
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
        depth: PT, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018,
        bevelSegments: 3, curveSegments: 128,
    }), []);

    const rimExt = useMemo(() => ({
        depth: HD * 2, bevelEnabled: true, bevelSize: 0.028, bevelThickness: 0.028,
        bevelSegments: 4, curveSegments: 128,
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

    return (
        <group rotation={[0.12, -0.25, 0.02]} scale={0.95}>
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

            {/* ======= FILM STRIP (Attached to Reel) ======= */}
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

        // Idle animation (imperceptible breathing)
        if (!reducedMotion.current) {
            idlePhase.current = t;
            reelGroupRef.current.position.y = Math.sin(t * 0.5) * 0.012;
        }

        reelGroupRef.current.rotation.y = dragRotY.current + Math.sin(idlePhase.current * 0.35) * 0.004;
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

    // Responsive reel position
    const reelX = viewport.width > 10 ? 4.8 : viewport.width > 6 ? 3.2 : 0;

    return (
        <>
            <Environment preset="studio" environmentIntensity={0.72} />
            <group ref={sceneGroupRef} position={[reelX, 0.0, 0]}>
                <ambientLight intensity={0.35} color="#fff8f0" />
                <spotLight position={[14, 20, 14]} angle={0.4} penumbra={1}
                    intensity={110} color="#fff0d8" castShadow
                    shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0001} />
                {/* FILL: cooler, softer */}
                <pointLight position={[-10, 5, -10]} intensity={25} color="#e5eeff" />
                {/* RIM: warm champagne accent from below-right */}
                <pointLight position={[8, -3, 6]} intensity={15} color="#ffe0a0" />
                {/* BACK RIM: highlight spoke edges from behind */}
                <pointLight position={[-4, 2, -10]} intensity={18} color="#fff5e0" />

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
    const navigate = useNavigate();
    const railRef = useRef(null);
    const heroRef = useRef(null);
    const typographyRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const dragHintRef = useRef(null);
    const [railProgress, setRailProgress] = useState(0);

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

    // Rail scroll progress
    const handleRailScroll = useCallback(() => {
        if (railRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
            const max = scrollWidth - clientWidth;
            if (max > 0) setRailProgress(scrollLeft / max);
        }
    }, []);

    useEffect(() => {
        const el = railRef.current;
        if (el) el.addEventListener('scroll', handleRailScroll);
        return () => { if (el) el.removeEventListener('scroll', handleRailScroll); };
    }, [loading, handleRailScroll]);

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
                        <h1 className="font-serif" style={{
                            fontSize: 'clamp(3.5rem, 6vw, 7rem)', color: 'var(--c-text-primary)',
                            lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '2rem'
                        }}>
                            NOVELTY<br />CINEMA<br />EXPERIENCE.
                        </h1>
                        <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--c-gold)', marginBottom: '2rem' }} />
                        <p className="font-sans" style={{
                            color: 'var(--c-text-secondary)', fontSize: '0.85rem', letterSpacing: '0.15em',
                            textTransform: 'uppercase', marginBottom: '3.5rem', fontWeight: 500
                        }}>
                            Labs Project<br />Database Management
                        </p>
                        <div>
                            <motion.button
                                whileHover={{ y: -2, backgroundColor: 'var(--c-gold)', color: '#fff', boxShadow: '0 15px 30px rgba(176,138,62,0.2)' }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                onClick={() => document.getElementById('now-showing')?.scrollIntoView({ behavior: 'smooth' })}
                                style={{
                                    padding: '1.15rem 2.8rem', backgroundColor: 'var(--c-surface)',
                                    color: 'var(--c-text-primary)', fontSize: '0.72rem', letterSpacing: '0.15em',
                                    fontWeight: 600, textTransform: 'uppercase', border: '1px solid var(--c-gold)',
                                    cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.02)'
                                }}>
                                EXPLORE SHOWTIMES
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* DRAG TO EXPLORE indicator */}
                <div ref={dragHintRef} style={{
                    position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.6rem', opacity: 0, pointerEvents: 'none',
                }}>
                    {/* Cursor icon (circle with arrow) */}
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--c-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-muted)" strokeWidth="1.5">
                            <path d="M5 9l-3 3 3 3" /><path d="M19 9l3 3-3 3" /><line x1="2" y1="12" x2="22" y2="12" />
                        </svg>
                    </div>
                    <span className="font-sans" style={{
                        fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: 'var(--c-text-muted)', textAlign: 'center', lineHeight: 1.6,
                    }}>
                        DRAG<br />TO EXPLORE
                    </span>
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

            {/* ======= MOVIES RAIL ======= */}
            <section id="now-showing" style={{ padding: '6rem 0 4rem 0', position: 'relative', zIndex: 20, maxWidth: '1440px', margin: '0 auto' }}>
                <div style={{ padding: '0 4rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <h2 className="font-serif" style={{ fontSize: '2.5rem', color: 'var(--c-text-primary)', margin: 0 }}>
                        NOW SHOWING
                    </h2>
                    <div style={{ width: '200px', height: '1px', backgroundColor: 'rgba(23,23,23,0.1)', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, height: '100%', width: '100%',
                            backgroundColor: 'var(--c-gold)', transformOrigin: 'left',
                            transform: `scaleX(${railProgress})`, transition: 'transform 0.1s linear'
                        }} />
                    </div>
                </div>
                <div ref={railRef} className="hide-scrollbar"
                    style={{ display: 'flex', gap: '2.5rem', overflowX: 'auto', paddingBottom: '4rem', paddingTop: '2rem', paddingLeft: '4rem', paddingRight: '4rem', scrollSnapType: 'x mandatory' }}>
                    <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}` }} />
                    {movies.map((movie, i) => (
                        <motion.div key={movie.MovieID}
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '0px 100px 0px 0px' }}
                            transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ minWidth: '320px', width: '320px', cursor: 'pointer', scrollSnapAlign: 'start', position: 'relative' }}
                            onClick={() => navigate(`/movies/${movie.MovieID}`)}
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
                                const ry = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
                                const w = e.currentTarget.querySelector('.poster-wrapper');
                                w.style.transition = 'none';
                                w.style.transform = `perspective(1000px) translateZ(20px) scale(1.04) rotateX(${ry}deg) rotateY(${rx}deg)`;
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.querySelector('.poster-wrapper').style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
                                e.currentTarget.querySelector('.gold-border').style.opacity = '1';
                                e.currentTarget.querySelector('.poster-meta').style.transform = 'translateY(-5px)';
                            }}
                            onMouseLeave={(e) => {
                                const w = e.currentTarget.querySelector('.poster-wrapper');
                                w.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
                                w.style.transform = 'perspective(1000px) translateZ(0) scale(1) rotateX(0) rotateY(0)';
                                e.currentTarget.querySelector('.gold-border').style.opacity = '0';
                                e.currentTarget.querySelector('.poster-meta').style.transform = 'translateY(0)';
                            }}>
                            <div className="poster-wrapper" style={{
                                width: '100%', aspectRatio: '2/3', backgroundColor: 'var(--c-surface)',
                                marginBottom: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                position: 'relative', borderRadius: '8px', padding: '0.5rem',
                                border: '1px solid rgba(176,138,62,0.15)', transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)'
                            }}>
                                <img src={getMoviePosterUrl(movie, i)} alt={movie.Title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                <div className="gold-border" style={{ position: 'absolute', inset: '0.5rem', border: '2px solid var(--c-gold)', opacity: 0, transition: 'opacity 0.4s', borderRadius: '4px', pointerEvents: 'none' }} />
                            </div>
                            <div className="poster-meta" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--c-gold)', marginTop: '0.3rem' }}>{String(i + 1).padStart(2, '0')}</span>
                                <div>
                                    <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--c-text-primary)', lineHeight: 1.2 }}>{movie.Title}</h3>
                                    <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{movie.Genre} · {movie.Language} · {movie.Duration}M</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    <div style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="font-sans" style={{ color: 'var(--c-text-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>END OF LIST</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
