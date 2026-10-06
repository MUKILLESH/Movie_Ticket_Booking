import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchMovies } from '../services/api';
import { getMoviePosterUrl } from '../utils/helpers';

gsap.registerPlugin(ScrollTrigger);

RectAreaLightUniformsLib.init();

// ============================================================
// PROGRAMMATIC TEXTURES
// ============================================================

// Fine anodized grain + horizontal brushing (used as roughness/clearcoat variation)
function createAnodizedRoughnessMap() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
        const streak = Math.sin(y * 0.9) * 4 + (Math.random() - 0.5) * 6;
        for (let x = 0; x < size; x++) {
            const v = 222 + streak + (Math.random() - 0.5) * 22;
            const i = (y * size + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.6, 0.6);
    return tex;
}

// Concentric "wound film" normal map. Extrude caps use shape-space UVs,
// so repeat/offset map [-R, R] onto [0, 1].
function createConcentricFilmNormalMap(outerR) {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const half = size / 2;
    const ringHash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - half, dy = y - half;
            const r = Math.sqrt(dx * dx + dy * dy) + 1e-4;
            const period = 2.6;
            const ring = Math.floor(r / period);
            const amp = 0.35 + 0.65 * ringHash(ring);
            const slope = Math.cos((r / period) * Math.PI * 2) * 0.55 * amp;
            let nx = (dx / r) * slope, ny = (dy / r) * slope, nz = 1;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= len; ny /= len; nz /= len;
            const i = (y * size + x) * 4;
            img.data[i] = (nx * 0.5 + 0.5) * 255;
            img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
            img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
            img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / (outerR * 2), 1 / (outerR * 2));
    tex.offset.set(0.5, 0.5);
    return tex;
}

// Soft radial glow used for the lens bloom / haze sprites
function createGlowTexture() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.15, 'rgba(255,246,228,0.85)');
    g.addColorStop(0.4, 'rgba(255,226,180,0.32)');
    g.addColorStop(0.7, 'rgba(255,214,160,0.08)');
    g.addColorStop(1.0, 'rgba(255,214,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// ============================================================
// SHARED PBR MATERIALS (created once, reused by projector + reels)
// ============================================================

let _projectorMaterials = null;
function getProjectorMaterials() {
    if (_projectorMaterials) return _projectorMaterials;
    const anodized = createAnodizedRoughnessMap();
    const glowTex = createGlowTexture();
    _projectorMaterials = {
        // Dark graphite anodized aluminium: fully metallic, satin, with a thin clearcoat
        // so studio softboxes leave permanent crisp highlights on edges and bevels.
        graphite: new THREE.MeshPhysicalMaterial({
            color: '#1a1a1c', metalness: 1.0, roughness: 0.28, roughnessMap: anodized,
            clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 2.2,
        }),
        // Recesses, vent slots, gaps
        recess: new THREE.MeshStandardMaterial({ color: '#050506', metalness: 0.6, roughness: 0.65 }),
        // Polished champagne brass
        brass: new THREE.MeshPhysicalMaterial({
            color: '#f4ce90', metalness: 1.0, roughness: 0.15,
            clearcoat: 0.4, clearcoatRoughness: 0.1, envMapIntensity: 2.2,
        }),
        // Satin smoked bronze for reel plates/spokes
        bronzeSatin: new THREE.MeshPhysicalMaterial({
            color: '#7a6a58', metalness: 1.0, roughness: 0.28, envMapIntensity: 1.8,
        }),
        // Black anodized optics rings
        blackAnodized: new THREE.MeshPhysicalMaterial({
            color: '#08080a', metalness: 0.9, roughness: 0.25,
            clearcoat: 0.7, clearcoatRoughness: 0.12, side: THREE.DoubleSide,
        }),
        // Wound film faces: dark acetate with fine concentric layers
        filmFace: new THREE.MeshPhysicalMaterial({
            color: '#070605', metalness: 0.15, roughness: 0.38,
            clearcoat: 0.6, clearcoatRoughness: 0.22, envMapIntensity: 1.2,
            normalMap: createConcentricFilmNormalMap(2.55), normalScale: new THREE.Vector2(0.6, 0.6),
        }),
        filmEdge: new THREE.MeshPhysicalMaterial({
            color: '#0a0806', metalness: 0.2, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.2,
        }),
        // Optical glass: mostly reflection, faint body
        glass: new THREE.MeshPhysicalMaterial({
            color: '#ffffff', metalness: 0.0, roughness: 0.03, transparent: true, opacity: 0.22,
            clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: 2.4, depthWrite: false,
            specularIntensity: 1.0, ior: 1.52,
        }),
        glassTint: new THREE.MeshPhysicalMaterial({
            color: '#5a4328', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35,
            clearcoat: 1.0, envMapIntensity: 1.8, depthWrite: false,
        }),
        glowTex,
    };
    return _projectorMaterials;
}

// ============================================================
// GEOMETRY SHAPE GENERATORS
// ============================================================

function createPlateShape() {
    const s = new THREE.Shape();
    const outerR = 2.83, hubR = 0.88;
    s.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    const ch = new THREE.Path();
    ch.absarc(0, 0, hubR, 0, Math.PI * 2, true);
    s.holes.push(ch);
    const spokeHalf = 0.30;
    const cutInner = 1.38, cutOuter = 2.62;
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

function createArcBandShape(innerR, outerR, a0, a1) {
    const s = new THREE.Shape();
    s.moveTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
    s.absarc(0, 0, outerR, a0, a1, false);
    s.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    s.absarc(0, 0, innerR, a1, a0, true);
    s.closePath();
    return s;
}

function createRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w/2 + r, -h/2);
    s.lineTo(w/2 - r, -h/2);
    s.absarc(w/2 - r, -h/2 + r, r, -Math.PI/2, 0, false);
    s.lineTo(w/2, h/2 - r);
    s.absarc(w/2 - r, h/2 - r, r, 0, Math.PI/2, false);
    s.lineTo(-w/2 + r, h/2);
    s.absarc(-w/2 + r, h/2 - r, r, Math.PI/2, Math.PI, false);
    s.lineTo(-w/2, -h/2 + r);
    s.absarc(-w/2 + r, -h/2 + r, r, Math.PI, Math.PI*1.5, false);
    return s;
}

// ============================================================
// FILM REEL (Standalone)
// ============================================================

function FilmReel({ baseSpeed = 1, speedRef, reducedMotion }) {
    const M = getProjectorMaterials();

    const plateShape = useMemo(() => createPlateShape(), []);
    const rimShape = useMemo(() => createRingShape(3.05, 2.8), []);
    const outerHubShape = useMemo(() => createRingShape(1.28, 0.92), []);
    const innerHubShape = useMemo(() => createRingShape(0.68, 0.34), []);
    const woundFilmShape = useMemo(() => createRingShape(2.55, 1.0), []);

    const HD = 0.45; const PT = 0.07;
    const plateExt = useMemo(() => ({ depth: PT, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 64 }), []);
    const rimExt = useMemo(() => ({ depth: 0.09, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4, curveSegments: 72 }), []);
    const hubExt = useMemo(() => ({ depth: 0.06, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 3, curveSegments: 48 }), []);
    const filmExt = useMemo(() => ({ depth: (HD - PT) * 2, bevelEnabled: false, curveSegments: 72 }), []);

    const boltAngles = useMemo(() => Array.from({ length: 6 }, (_, i) => (i * Math.PI * 2) / 6), []);
    const reelRef = useRef();

    useFrame((state, delta) => {
        if (!reelRef.current || (reducedMotion && reducedMotion.current)) return;
        const mult = speedRef ? speedRef.current.value : 1.0;
        // Very slow continuous rotation
        reelRef.current.rotation.z += delta * 0.10 * baseSpeed * mult;
    });

    return (
        <group ref={reelRef}>
            {/* Spoked side plates (satin bronze) */}
            <mesh position={[0, 0, HD - PT]} material={M.bronzeSatin}>
                <extrudeGeometry args={[plateShape, plateExt]} />
            </mesh>
            <mesh position={[0, 0, -HD]} material={M.bronzeSatin}>
                <extrudeGeometry args={[plateShape, plateExt]} />
            </mesh>

            {/* Polished brass flange rims on both plates */}
            <mesh position={[0, 0, HD - 0.07]} material={M.brass}>
                <extrudeGeometry args={[rimShape, rimExt]} />
            </mesh>
            <mesh position={[0, 0, -HD - 0.02]} material={M.brass}>
                <extrudeGeometry args={[rimShape, rimExt]} />
            </mesh>

            {/* Wound film: layered faces + glossy outer edge */}
            <mesh position={[0, 0, -(HD - PT)]} material={M.filmFace}>
                <extrudeGeometry args={[woundFilmShape, filmExt]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={M.filmEdge}>
                <cylinderGeometry args={[2.551, 2.551, (HD - PT) * 2, 96, 1, true]} />
            </mesh>

            {/* Core */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={M.graphite}>
                <cylinderGeometry args={[1.0, 1.0, HD * 2 + 0.02, 48]} />
            </mesh>

            {/* Front hub assembly */}
            <group position={[0, 0, HD]}>
                <mesh material={M.brass}><extrudeGeometry args={[outerHubShape, hubExt]} /></mesh>
                <mesh position={[0, 0, 0.03]} material={M.brass}><extrudeGeometry args={[innerHubShape, hubExt]} /></mesh>
                <mesh position={[0, 0, 0.012]} material={M.recess}><ringGeometry args={[0.68, 0.92, 64]} /></mesh>
                {/* Spindle */}
                <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
                    <cylinderGeometry args={[0.3, 0.32, 0.24, 32]} />
                </mesh>
                <mesh position={[0, 0, 0.245]} rotation={[Math.PI / 2, 0, 0]} material={M.graphite}>
                    <cylinderGeometry args={[0.16, 0.2, 0.04, 32]} />
                </mesh>
                {/* Bolts */}
                {boltAngles.map((a, i) => (
                    <mesh key={`b-${i}`} position={[Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
                        <cylinderGeometry args={[0.065, 0.065, 0.05, 16]} />
                    </mesh>
                ))}
            </group>
            {/* Rear hub */}
            <mesh position={[0, 0, -HD - 0.08]} material={M.brass}>
                <extrudeGeometry args={[outerHubShape, hubExt]} />
            </mesh>
        </group>
    );
}

// ============================================================
// CINEMA PROJECTOR 
// ============================================================

function Screw({ position, rotation = [Math.PI / 2, 0, 0], r = 0.045 }) {
    const M = getProjectorMaterials();
    return (
        <group position={position} rotation={rotation}>
            <mesh material={M.brass}><cylinderGeometry args={[r, r, 0.03, 20]} /></mesh>
            <mesh position={[0, 0.016, 0]} material={M.recess}><boxGeometry args={[r * 1.5, 0.004, r * 0.25]} /></mesh>
        </group>
    );
}

function CinemaProjector({ isDragging, dragDeltaX, reducedMotion }) {
    const M = getProjectorMaterials();
    const projectorGroup = useRef();
    const glowMatRef = useRef();
    const bloomRef = useRef();
    const coreRef = useRef();
    const lensLightRef = useRef();
    const reelSpeedRef = useRef({ value: 0 });
    const powerRef = useRef({ value: 0 });
    
    const dragRotY = useRef(0);
    const dragRotZ = useRef(0);
    const idlePhase = useRef(0);
    
    const bodyShape = useMemo(() => createRoundedRectShape(4, 2.6, 0.4), []);
    const bodyExt = useMemo(() => ({
        depth: 2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 32
    }), []);
    const panelShape = useMemo(() => createRoundedRectShape(3.5, 2.05, 0.22), []);
    const panelExt = useMemo(() => ({ depth: 0.03, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 4, curveSegments: 24 }), []);
    const bandHole = useMemo(() => {
        const s = createRoundedRectShape(4.24, 2.84, 0.5);
        s.holes.push(createRoundedRectShape(4.1, 2.7, 0.44));
        return s;
    }, []);

    const baseShape = useMemo(() => createRoundedRectShape(3.5, 1.8, 0.12), []);
    const baseExt = useMemo(() => ({ depth: 0.4, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4 }), []);
    const baseTrimShape = useMemo(() => createRoundedRectShape(3.6, 1.9, 0.14), []);
    const mountPlateShape = useMemo(() => createRoundedRectShape(1.95, 1.95, 0.18), []);

    // Corner guards: brass quarter bands wrapping each rounded edge near both side faces
    const cornerGuards = useMemo(() => {
        // body corner arc centres: x = -0.2 ± 1.6, y = ±0.9
        const defs = [
            { x: 1.4, y: 0.9, a0: 0, a1: Math.PI / 2 },
            { x: -1.8, y: 0.9, a0: Math.PI / 2, a1: Math.PI },
            { x: -1.8, y: -0.9, a0: Math.PI, a1: Math.PI * 1.5 },
            { x: 1.4, y: -0.9, a0: Math.PI * 1.5, a1: Math.PI * 2 },
        ];
        return defs.map(d => ({ ...d, shape: createArcBandShape(0.47, 0.52, d.a0 - 0.05, d.a1 + 0.05) }));
    }, []);
    const guardExt = useMemo(() => ({ depth: 0.2, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 16 }), []);

    const ventXs = useMemo(() => Array.from({ length: 14 }, (_, i) => -0.05 + i * 0.1), []);
    const knurlAngles = useMemo(() => Array.from({ length: 40 }, (_, i) => (i * Math.PI * 2) / 40), []);
    const panelScrews = useMemo(() => [[-1.85, 0.88], [1.45, 0.88], [-1.85, -0.88], [1.45, -0.88]], []);

    const beamMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            colorNear: { value: new THREE.Color('#ffebb8') },
            colorFar: { value: new THREE.Color('#ffdd99') },
            opacity: { value: 0.0 },
            softness: { value: 3.5 },
            time: { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vN;
            varying vec3 vV;
            void main() {
                vUv = uv;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vN = normalize(normalMatrix * normal);
                vV = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            uniform vec3 colorNear;
            uniform vec3 colorFar;
            uniform float opacity;
            uniform float softness;
            uniform float time;
            varying vec2 vUv;
            varying vec3 vN;
            varying vec3 vV;

            float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
            float noise(vec2 p) {
                vec2 i = floor(p); vec2 f = fract(p);
                vec2 u = f*f*(3.0-2.0*f);
                return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
                           mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
            }

            void main() {
                // vUv.y = 0 at the lens, 1 at the far end
                float along = vUv.y;
                // View-dependent falloff: the silhouette of the cone dissolves, the core stays dense
                float facing = abs(dot(normalize(vN), normalize(vV)));
                float edge = pow(facing, softness);
                float lengthFade = pow(1.0 - along, 4.0) * smoothstep(0.0, 0.05, along);
                float n1 = noise(vec2(vUv.x * 9.0 + time * 0.03, along * 4.0 - time * 0.10));
                float n2 = noise(vec2(vUv.x * 21.0 - time * 0.02, along * 10.0 - time * 0.18));
                float haze = 0.68 + 0.22 * n1 + 0.10 * n2;
                vec3 col = mix(colorNear, colorFar, smoothstep(0.0, 0.8, along));
                gl_FragColor = vec4(col, edge * lengthFade * haze * opacity);
                #include <colorspace_fragment>
            }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    }), []);
    const hazeMaterial = useMemo(() => {
        const m = beamMaterial.clone();
        m.uniforms.softness.value = 2.0;
        return m;
    }, [beamMaterial]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            gsap.set(projectorGroup.current.position, { z: -3, y: -0.6 });
            gsap.set(projectorGroup.current.scale, { x: 0.94, y: 0.94, z: 0.94 });
            
            // 1.0 - 2.5s: Gently move forward
            tl.to(projectorGroup.current.position, { z: 0, y: 0, duration: 1.5, ease: 'power2.out' }, 1.0);
            tl.to(projectorGroup.current.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power2.out' }, 1.0);
            // 1.5 - 3.0s: Lamp warms up
            tl.to(powerRef.current, { value: 1, duration: 1.6, ease: 'power1.inOut' }, 1.5);
            // 2.0 - 3.5s: Reels start
            tl.to(reelSpeedRef.current, { value: 1.0, duration: 1.5, ease: 'power2.inOut' }, 2.0);
        });
        return () => ctx.revert();
    }, []);

    useFrame((state, delta) => {
        if (!projectorGroup.current) return;
        const reduced = reducedMotion.current;

        // ±1° mouse response with frame-rate independent damping
        const DEG1 = 0.01745;
        const targetRotY = isDragging.current
            ? THREE.MathUtils.clamp(dragDeltaX.current * 0.002, -DEG1 * 1.5, DEG1 * 1.5)
            : state.pointer.x * DEG1 * 1.0;
        const targetRotZ = isDragging.current ? 0 : state.pointer.y * DEG1 * 1.0;
        const k = 1 - Math.exp(-delta * 2.2);
        dragRotY.current += (targetRotY - dragRotY.current) * k;
        dragRotZ.current += (targetRotZ - dragRotZ.current) * k;

        if (!reduced) {
            idlePhase.current += delta;
            beamMaterial.uniforms.time.value += delta;
            hazeMaterial.uniforms.time.value += delta * 0.7;
        }

        // ±1.5px float, ~10s period
        const p = idlePhase.current * 0.628;
        const idleY = Math.sin(p) * 0.015;
        const idleRotY = Math.sin(p + 1) * 0.003;
        const idleRotZ = Math.sin(p + 2) * 0.003;

        // Lamp: steady, barely perceptible breathing (±3%)
        const power = powerRef.current.value;
        const breath = 1.0 + Math.sin(idlePhase.current * 0.7) * 0.03;
        beamMaterial.uniforms.opacity.value = 0.12 * power * breath;
        hazeMaterial.uniforms.opacity.value = 0.05 * power * breath;
        if (glowMatRef.current) glowMatRef.current.opacity = 0.4 * power;
        if (bloomRef.current) bloomRef.current.material.opacity = 0.3 * power * breath;
        if (coreRef.current) coreRef.current.material.opacity = 0.4 * power;
        if (lensLightRef.current) lensLightRef.current.intensity = 2 * power * breath;

        projectorGroup.current.rotation.y = dragRotY.current + idleRotY;
        projectorGroup.current.rotation.z = dragRotZ.current + idleRotZ;
        projectorGroup.current.position.x = 0;
        projectorGroup.current.position.y = idleY;
    });

    return (
        <group ref={projectorGroup} scale={1.0} rotation={[0.1, 0.35, 0]}>
            {/* Main Body (bevelled graphite) */}
            <mesh position={[-0.2, 0, -1]} material={M.graphite}>
                <extrudeGeometry args={[bodyShape, bodyExt]} />
            </mesh>
            
            {/* Thin anodized seam band (sits proud of the bevelled body, catches edge light) */}
            <mesh position={[-0.2, 0, -0.03]} material={M.blackAnodized}>
                <extrudeGeometry args={[bandHole, { depth: 0.06, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 32 }]} />
            </mesh>

            {/* Side panels (raised, bevelled) + vents + screws, both sides */}
            {[1, -1].map((side) => (
                <group key={`side-${side}`} rotation={[0, side === 1 ? 0 : Math.PI, 0]} position={[side === 1 ? 0 : -0.4, 0, 0]}>
                    <mesh position={[-0.2, 0, 1.08]} material={M.graphite}>
                        <extrudeGeometry args={[panelShape, panelExt]} />
                    </mesh>
                    {/* Recessed vent slots */}
                    {ventXs.map((x, i) => (
                        <group key={`v-${i}`} position={[x, 0.05, 1.131]}>
                            <mesh material={M.recess}><boxGeometry args={[0.038, 1.15, 0.006]} /></mesh>
                            <mesh position={[0, 0, 0.002]} rotation={[0, 0, 0]} material={M.graphite}>
                                <boxGeometry args={[0.012, 1.15, 0.004]} />
                            </mesh>
                        </group>
                    ))}
                    {panelScrews.map(([x, y], i) => (
                        <Screw key={`ps-${i}`} position={[x, y, 1.145]} />
                    ))}
                    {/* Brass corner guards on this side */}
                    {cornerGuards.map((g, i) => (
                        <mesh key={`cg-${i}`} position={[g.x, g.y, 0.9]} material={M.brass}>
                            <extrudeGeometry args={[g.shape, guardExt]} />
                        </mesh>
                    ))}
                </group>
            ))}
            
            {/* Brass knurled adjustment knob (front side) */}
            <group position={[1.3, -0.62, 1.16]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh material={M.recess} position={[0, -0.01, 0]}><cylinderGeometry args={[0.2, 0.2, 0.02, 32]} /></mesh>
                <mesh material={M.brass} position={[0, 0.07, 0]}><cylinderGeometry args={[0.17, 0.18, 0.14, 40]} /></mesh>
                <mesh material={M.brass} position={[0, 0.15, 0]}><cylinderGeometry args={[0.12, 0.16, 0.03, 40]} /></mesh>
            </group>
            {/* Rear knobs */}
            <group position={[1.9, 0.35, 0.45]} rotation={[0, 0, -Math.PI / 2]}>
                <mesh material={M.brass} position={[0, 0.05, 0]}><cylinderGeometry args={[0.13, 0.14, 0.12, 32]} /></mesh>
            </group>
            <group position={[1.9, -0.45, -0.4]} rotation={[0, 0, -Math.PI / 2]}>
                <mesh material={M.brass} position={[0, 0.04, 0]}><cylinderGeometry args={[0.09, 0.1, 0.09, 24]} /></mesh>
            </group>

            {/* Lower neck between body and base */}
            <mesh position={[-0.2, -1.43, -0.2]} material={M.recess}>
                <boxGeometry args={[3.3, 0.16, 1.6]} />
            </mesh>
            {/* Base / Pedestal */}
            <mesh position={[-0.2, -1.5, -0.2]} rotation={[Math.PI/2, 0, 0]} material={M.graphite}>
                 <extrudeGeometry args={[baseShape, baseExt]} />
            </mesh>
            {/* Base trim */}
            <mesh position={[-0.2, -1.53, -0.2]} rotation={[Math.PI/2, 0, 0]} material={M.brass}>
                 <extrudeGeometry args={[baseTrimShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }]} />
            </mesh>
            
            {/* Feet */}
            {[[1.2, 0.5], [1.2, -0.9], [-1.6, 0.5], [-1.6, -0.9]].map(([x, z], i) => (
                <mesh key={`f-${i}`} position={[x, -1.92, z]} material={M.recess}>
                    <cylinderGeometry args={[0.14, 0.15, 0.06, 24]} />
                </mesh>
            ))}

            {/* Lens mount plate on front face */}
            <mesh position={[-2.28, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.graphite}>
                <extrudeGeometry args={[mountPlateShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 }]} />
            </mesh>
            {[[0.78, 0.78], [-0.78, 0.78], [0.78, -0.78], [-0.78, -0.78]].map(([y, z], i) => (
                <Screw key={`ms-${i}`} position={[-2.37, y, z]} rotation={[0, 0, Math.PI / 2]} r={0.04} />
            ))}

            {/* Lens Barrel (local +Y = projection direction) */}
            <group position={[-2.3, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                {/* Brass mount flange */}
                <mesh position={[0, 0.06, 0]} material={M.brass}>
                    <cylinderGeometry args={[0.92, 0.95, 0.06, 64]} />
                </mesh>
                {/* Graphite barrel */}
                <mesh position={[0, 0.32, 0]} material={M.graphite}>
                    <cylinderGeometry args={[0.76, 0.78, 0.46, 64]} />
                </mesh>
                <mesh position={[0, 0.57, 0]} material={M.brass}>
                    <cylinderGeometry args={[0.81, 0.81, 0.05, 64, 1, true]} />
                </mesh>
                {/* Knurled black focus ring */}
                <mesh position={[0, 0.76, 0]} material={M.blackAnodized}>
                    <cylinderGeometry args={[0.83, 0.83, 0.32, 64, 1, true]} />
                </mesh>
                {knurlAngles.map((a, i) => (
                    <mesh key={`k-${i}`} position={[Math.cos(a) * 0.835, 0.76, Math.sin(a) * 0.835]} rotation={[0, -a, 0]} material={M.blackAnodized}>
                        <boxGeometry args={[0.025, 0.28, 0.035]} />
                    </mesh>
                ))}
                <mesh position={[0, 0.945, 0]} material={M.brass}>
                    <cylinderGeometry args={[0.86, 0.86, 0.05, 64, 1, true]} />
                </mesh>
                {/* Front bezel */}
                <mesh position={[0, 1.05, 0]} material={M.blackAnodized}>
                    <cylinderGeometry args={[0.9, 0.87, 0.16, 64, 1, true]} />
                </mesh>
                {/* Bezel front face (annulus) */}
                <mesh position={[0, 1.125, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.blackAnodized}>
                    <ringGeometry args={[0.74, 0.9, 64]} />
                </mesh>
                {/* Polished brass front lip */}
                <mesh position={[0, 1.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
                    <torusGeometry args={[0.84, 0.04, 20, 96]} />
                </mesh>
                {/* Inner recessed tube */}
                <mesh position={[0, 0.92, 0]} material={M.blackAnodized}>
                    <cylinderGeometry args={[0.76, 0.76, 0.42, 64, 1, true]} />
                </mesh>
                {/* Inner retaining ring */}
                <mesh position={[0, 0.86, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
                    <torusGeometry args={[0.64, 0.022, 12, 72]} />
                </mesh>
                {/* Rear element: lamp-lit glow */}
                <mesh position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.66, 48]} />
                    <meshBasicMaterial ref={glowMatRef} map={M.glowTex} color="#ffe6bf" transparent opacity={0} toneMapped={false} depthWrite={false} />
                </mesh>
                {/* Middle tinted element */}
                <mesh position={[0, 0.92 + 0.19 - 1.1, 0]} material={M.glassTint}>
                    <sphereGeometry args={[1.1, 48, 12, 0, Math.PI * 2, 0, 0.6]} />
                </mesh>
                {/* Front element */}
                <mesh position={[0, 1.06 + 0.207 - 1.4, 0]} material={M.glass}>
                    <sphereGeometry args={[1.4, 64, 16, 0, Math.PI * 2, 0, 0.55]} />
                </mesh>

                {/* Warm light spilling onto lens rings */}
                <pointLight ref={lensLightRef} position={[0, 1.4, 0]} intensity={0} distance={5} decay={2} color="#ffd9a6" />

                {/* Lens bloom (soft, camera-facing) */}
                <sprite ref={bloomRef} position={[0, 1.2, 0]} scale={[2.6, 2.6, 1]}>
                    <spriteMaterial map={M.glowTex} color="#fff0d6" transparent opacity={0} depthWrite={false} toneMapped={false} />
                </sprite>
                <sprite ref={coreRef} position={[0, 1.18, 0]} scale={[0.9, 0.9, 1]}>
                    <spriteMaterial map={M.glowTex} color="#fffaf0" transparent opacity={0} depthWrite={false} toneMapped={false} />
                </sprite>

                {/* Atmospheric projection beam: dense core cone + wide haze cone */}
                <mesh position={[0, 1.15 + 7, 0]} material={beamMaterial} renderOrder={2}>
                    <cylinderGeometry args={[3.0, 0.6, 14, 64, 1, true]} />
                </mesh>
                <mesh position={[0, 1.15 + 6, 0]} material={hazeMaterial} renderOrder={1}>
                    <cylinderGeometry args={[4.6, 0.8, 12, 64, 1, true]} />
                </mesh>
            </group>

            {/* Reel Mounts & Film Reels */}
            <group position={[-0.5, 1.3, 0]}>
                {/* Left Arm */}
                <group position={[-1.2, 0.6, 0.8]} scale={0.4}>
                    <mesh position={[0, -1.0, 0]} material={M.graphite}>
                        <cylinderGeometry args={[0.3, 0.4, 2.5, 32]} />
                    </mesh>
                    <mesh position={[0, -2.1, 0]} material={M.brass}>
                        <cylinderGeometry args={[0.5, 0.55, 0.15, 32]} />
                    </mesh>
                    <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]} material={M.brass}>
                        <cylinderGeometry args={[0.5, 0.5, 0.8, 32]} />
                    </mesh>
                    <FilmReel baseSpeed={1.0} speedRef={reelSpeedRef} reducedMotion={reducedMotion} />
                </group>

                {/* Right Arm */}
                <group position={[0.8, 0.8, -0.8]} scale={0.4}>
                    <mesh position={[0, -1.2, 0]} material={M.graphite}>
                        <cylinderGeometry args={[0.3, 0.4, 3.0, 32]} />
                    </mesh>
                    <mesh position={[0, -2.55, 0]} material={M.brass}>
                        <cylinderGeometry args={[0.5, 0.55, 0.15, 32]} />
                    </mesh>
                    <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]} material={M.brass}>
                        <cylinderGeometry args={[0.5, 0.5, 0.8, 32]} />
                    </mesh>
                    <FilmReel baseSpeed={1.25} speedRef={reelSpeedRef} reducedMotion={reducedMotion} />
                </group>
            </group>
        </group>
    );
}

// ============================================================
// STUDIO ENVIRONMENT (local, no network) — this is what makes the
// metal look metallic while idle: permanent softbox reflections.
// ============================================================

function StudioEnvironment() {
    return (
        <Environment resolution={256} frames={1} environmentIntensity={1.0}>
            {/* Dark studio so graphite stays dark between highlights */}
            <color attach="background" args={['#17130f']} />
            {/* Warm key softbox, upper-front-left */}
            <Lightformer form="rect" intensity={5.0} color="#ffe5c2" position={[-4, 5, 5]} scale={[7, 4, 1]} target={[0, 0, 0]} />
            {/* Long top strip: crisp line across top edges, rims, lens */}
            <Lightformer form="rect" intensity={8.0} color="#fff3e2" position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 1.4, 1]} />
            {/* Left vertical warm strip (front face / bevels) */}
            <Lightformer form="rect" intensity={4.5} color="#ffd8a6" position={[-7, 1, 1]} scale={[1.2, 9, 1]} target={[0, 0, 0]} />
            {/* Warm rim from behind-right */}
            <Lightformer form="rect" intensity={6.0} color="#ffc489" position={[6, 2, -5]} scale={[1.6, 9, 1]} target={[0, 0, 0]} />
            {/* Neutral front fill, offset upper-left so large flat panels get a soft gradient */}
            <Lightformer form="rect" intensity={2.0} color="#eef1f6" position={[-5, 4, 9]} scale={[6, 4, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.5} color="#f4ece0" position={[2, -1, 9]} scale={[8, 4, 1]} target={[0, 0, 0]} />
            {/* Cream floor bounce, matches page background */}
            <Lightformer form="rect" intensity={1.2} color="#f2e4cf" position={[0, -6, 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[16, 8, 1]} />
            {/* Small round practical for a sparkle on brass */}
            <Lightformer form="circle" intensity={8.0} color="#fff6e8" position={[3, 4, 6]} scale={[1.2, 1.2, 1]} target={[0, 0, 0]} />
        </Environment>
    );
}

// ============================================================
// HERO 3D SCENE
// ============================================================

function HeroScene({ isDragging, dragDeltaX, reducedMotion }) {
    const { camera, gl, viewport } = useThree();
    const sceneGroupRef = useRef();
    const sweepLightRef = useRef();

    useEffect(() => {
        if (gl) {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
        }
    }, [camera, gl]);

    useFrame((state) => {
        if (!reducedMotion.current) {
            // Very subtle camera parallax
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.pointer.x * 0.08, 0.02);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.3 + state.pointer.y * 0.05, 0.02);
            camera.lookAt(0, 0, 0);
        }
        // Slow 12s studio-light reflection sweep across the metal (always on, eased)
        if (sweepLightRef.current) {
            const t = reducedMotion.current ? 0.5 : (state.clock.getElapsedTime() % 12) / 12;
            const e = t * t * (3 - 2 * t);
            sweepLightRef.current.position.set(THREE.MathUtils.lerp(-7, 7, e), 4.5, 5);
            sweepLightRef.current.intensity = 1.0 + Math.sin(t * Math.PI) * 4.0;
            sweepLightRef.current.lookAt(0, 0, 0);
        }
    });

    const projX = viewport.width > 10 ? 5.5 : viewport.width > 6 ? 3.5 : 0;
    const projScale = viewport.width > 10 ? 1.05 : viewport.width > 6 ? 0.8 : 0.55;

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (!sceneGroupRef.current) return;
            // Scroll Trigger transition
            ScrollTrigger.create({
                trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1.2,
                animation: gsap.timeline()
                    .to(sceneGroupRef.current.position, { x: projX + 2, y: -0.5, z: -8, ease: 'power1.inOut' }, 0)
                    .to(sceneGroupRef.current.rotation, { y: 0.3, x: -0.1, ease: 'power1.inOut' }, 0)
            });
        });
        return () => ctx.revert();
    }, [viewport.width, projX]); // Rebind on viewport changes if projX changes

    return (
        <>
            <StudioEnvironment />
            <group ref={sceneGroupRef} position={[projX, -0.5, -1]} scale={projScale}>
                <ambientLight intensity={0.04} color="#fff4e6" />
                {/* Warm key */}
                <directionalLight position={[-4, 6, 5]} intensity={1.1} color="#ffe6c8" />
                {/* Warm rim */}
                <directionalLight position={[5, 3, -6]} intensity={1.6} color="#ffc48a" />
                {/* Neutral fill */}
                <rectAreaLight position={[0, -1, 7]} width={10} height={6} intensity={1.2} color="#eef2f8" onUpdate={(self) => self.lookAt(0, 0, 0)} />
                {/* Slow moving studio reflection */}
                <rectAreaLight ref={sweepLightRef} position={[-7, 4.5, 5]} width={1.4} height={9} intensity={1.5} color="#fff1dc" />
                
                <CinemaProjector isDragging={isDragging} dragDeltaX={dragDeltaX} reducedMotion={reducedMotion} />

                {/* Contact shadows: wide soft falloff + tight contact */}
                <ContactShadows position={[-0.2, -1.95, -0.2]} opacity={0.5} scale={10} blur={3.0} far={4} resolution={512} color="#1a1108" />
                <ContactShadows position={[-0.2, -1.945, -0.2]} opacity={0.7} scale={7} blur={1.2} far={1} resolution={512} color="#0d0804" />
            </group>
        </>
    );
}

// ============================================================
// HOVER POSTER (3D Physical Interaction)
// ============================================================

function HoverPoster({ movie, index }) {
    const navigate = useNavigate();
    const ref = useRef();
    
    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        
        gsap.to(ref.current, {
            rotateX, rotateY, scale: 1.03, z: 10,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            duration: 0.4, ease: 'power2.out', transformPerspective: 800
        });
        
        const highlight = ref.current.querySelector('.poster-highlight');
        if (highlight) gsap.to(highlight, { opacity: 1, duration: 0.3 });
    };
    
    const handleMouseLeave = () => {
        if (!ref.current) return;
        gsap.to(ref.current, {
            rotateX: 0, rotateY: 0, scale: 1, z: 0,
            boxShadow: 'none',
            duration: 0.7, ease: 'power3.out'
        });
        
        const highlight = ref.current.querySelector('.poster-highlight');
        if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.3 });
    };
    
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '0px 0px -100px 0px' }}
            transition={{ delay: (index % 4) * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(`/movies/${movie.MovieID}`)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                display: 'flex', flexDirection: 'column', cursor: 'pointer',
                position: 'relative', transformStyle: 'preserve-3d'
            }}
        >
            <div style={{
                width: '100%', aspectRatio: '2/3', backgroundColor: 'var(--c-surface)',
                marginBottom: '1.25rem', position: 'relative', borderRadius: '8px',
                overflow: 'hidden', border: '1px solid rgba(176,138,62,0.15)',
                transform: 'translateZ(0)' // Hardware acceleration
            }}>
                <img className="movie-poster" src={getMoviePosterUrl(movie, index)} alt={movie.Title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <div className="poster-highlight" style={{
                    position: 'absolute', inset: 0, border: '1px solid rgba(176,138,62,0.6)',
                    boxShadow: 'inset 0 0 20px rgba(176,138,62,0.2)',
                    borderRadius: '8px', opacity: 0, pointerEvents: 'none'
                }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 0.5rem', transform: 'translateZ(5px)' }}>
                <h3 className="font-serif" style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--c-text-primary)', lineHeight: 1.2 }}>{movie.Title}</h3>

                <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span>{movie.Genre}</span>
                    <span>·</span>
                    <span>{movie.Language}</span>
                    <span>·</span>
                    <span>{movie.Duration}M</span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex' }}>
                    <button className="book-now-btn font-sans" style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.6rem 1.25rem', backgroundColor: 'var(--c-surface)',
                        color: 'var(--c-text-primary)', border: '1px solid rgba(176,138,62,0.3)',
                        borderRadius: '2px', fontSize: '0.7rem', letterSpacing: '0.15em',
                        textTransform: 'uppercase', fontWeight: 600, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { 
                        e.currentTarget.style.backgroundColor = 'var(--c-gold)'; 
                        e.currentTarget.style.color = 'var(--c-surface)';
                        e.currentTarget.style.borderColor = 'var(--c-gold)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(176,138,62,0.15)';
                        const arrow = e.currentTarget.querySelector('.arrow');
                        if(arrow) arrow.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.backgroundColor = 'var(--c-surface)'; 
                        e.currentTarget.style.color = 'var(--c-text-primary)';
                        e.currentTarget.style.borderColor = 'rgba(176,138,62,0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
                        const arrow = e.currentTarget.querySelector('.arrow');
                        if(arrow) arrow.style.transform = 'translateX(0)';
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateY(1px)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(176,138,62,0.1)';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(176,138,62,0.15)';
                    }}
                    >
                        BOOK TICKET <span className="arrow" style={{ transition: 'transform 0.3s ease', display: 'inline-block' }}>→</span>
                    </button>
                </div>
            </div>
        </motion.div>
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
            
            // 0.2 - 0.8s Eyebrow
            tl.fromTo('.eyebrow', 
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.6 }, 0.2);
                
            // 0.5 - 1.2s Headline masking
            tl.fromTo('.headline-line',
                { yPercent: 110 },
                { yPercent: 0, duration: 0.8, stagger: 0.1, ease: 'power4.out' }, 0.5);
                
            // 1.0 - 1.6s Description
            tl.fromTo('.description',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6 }, 1.0);
                
            // 1.2 - 1.8s Buttons
            tl.fromTo('.buttons-container',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6 }, 1.2);
                
            // Canvas wrapper fades in smoothly
            tl.to(canvasWrapperRef.current, { opacity: 1, duration: 1.0 }, 0);
            
            if (dragHintRef.current) {
                tl.fromTo(dragHintRef.current, { opacity: 0, x: 15 }, { opacity: 1, x: 0, duration: 1.2 }, 1.5);
            }
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
                    <div style={{ width: '50%', padding: '4rem 0 4rem 4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: 'auto' }}>

                        <div style={{ overflow: 'hidden', paddingBottom: '2px', marginBottom: '1.5rem' }}>
                            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--c-gold)' }} />
                                <span className="font-sans" style={{ color: 'var(--c-gold)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Premium Cinema Platform
                                </span>
                            </div>
                        </div>

                        <h1 className="font-serif" style={{
                            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: 'var(--c-text-primary)',
                            lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: '1.5rem', fontWeight: 600
                        }}>
                            <div style={{ overflow: 'hidden' }}><span className="headline-line" style={{ display: 'block' }}>Experience Cinema</span></div>
                            <div style={{ overflow: 'hidden' }}><span className="headline-line" style={{ display: 'block' }}>Like Never Before.</span></div>
                        </h1>

                        <p className="description font-sans" style={{
                            color: 'var(--c-text-secondary)', fontSize: '1.1rem', lineHeight: 1.6,
                            maxWidth: '450px', marginBottom: '3rem'
                        }}>
                            Book tickets for the latest movies in our state-of-the-art theatres. A seamless booking experience powered by a robust database architecture.
                        </p>

                        <div className="buttons-container" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                            <HoverPoster key={movie.MovieID} movie={movie} index={i} />
                        ))}
                </div>
            </section>
        </div>
    );
}
