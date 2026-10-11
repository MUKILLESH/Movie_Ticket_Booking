import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { fetchSeatsForShow, recommendSeats, createBooking } from '../services/api';
import { ArrowLeft, Ticket, RotateCcw, Sparkles, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// =============================================================================
// SHARED GEOMETRY & MATERIALS — created once, reused by every seat instance
// =============================================================================

// Cushion profile: a rounded box shape for upholstery feel
function createCushionGeometry(width, height, depth, radius) {
    const shape = new THREE.Shape();
    const w = width / 2, h = height / 2, r = Math.min(radius, w, h);
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);

    const extrudeSettings = { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 8 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
}

// Armrest — thicker, contoured armrest
function createArmrestGeometry() {
    const shape = new THREE.Shape();
    const w = 0.05, h = 0.035, r = 0.015;
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);

    const extrudeSettings = { depth: 0.50, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 6 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
}

// Create shared geometries once at module level
const seatCushionGeo = createCushionGeometry(0.50, 0.12, 0.44, 0.08);
const seatBackGeo = createCushionGeometry(0.50, 0.65, 0.10, 0.08);
const armrestGeo = createArmrestGeometry();
const armrestSupportGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.35, 8);
// Solid box base connecting the floor to the cushion
const seatBaseGeo = new THREE.BoxGeometry(0.38, 0.22, 0.32);
// Small pedestal foot at the very bottom for grounding
const seatFootGeo = new THREE.BoxGeometry(0.44, 0.025, 0.36);

// Shared materials — keyed by status
const SEAT_COLORS = {
    available:   { cushion: '#711A29', frame: '#181614', armTop: '#25211E' },
    booked:      { cushion: '#3F3D3A', frame: '#181614', armTop: '#25211E' },
    selected:    { cushion: '#B09346', frame: '#181614', armTop: '#75612F' },
    recommended: { cushion: '#B09346', frame: '#181614', armTop: '#75612F' },
};

function createSeatMaterials() {
    const mats = {};
    for (const [status, colors] of Object.entries(SEAT_COLORS)) {
        mats[status] = {
            cushion: new THREE.MeshStandardMaterial({
                color: colors.cushion,
                roughness: status === 'booked' ? 0.98 : 0.94,
                metalness: status === 'booked' ? 0.0 : 0.02,
                envMapIntensity: 0.5,
            }),
            frame: new THREE.MeshStandardMaterial({
                color: colors.frame,
                roughness: 0.7,
                metalness: 0.7,
                envMapIntensity: 0.8,
            }),
            armTop: new THREE.MeshStandardMaterial({
                color: colors.armTop,
                roughness: 0.6,
                metalness: 0.15,
                envMapIntensity: 0.6,
            }),
        };
    }
    // Hover material variant — brighter and warmer
    mats.hover = {
        cushion: new THREE.MeshStandardMaterial({ color: '#8F2133', roughness: 0.85, metalness: 0.05, envMapIntensity: 0.8 }),
        frame: mats.available.frame,
        armTop: mats.available.armTop,
    };
    return mats;
}

const seatMaterials = createSeatMaterials();

// Gold emissive outline for selected seats
const goldOutlineMat = new THREE.MeshStandardMaterial({
    color: '#D4B054',
    emissive: '#D4B054',
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.65,
    roughness: 0.3,
    metalness: 0.6,
});

// =============================================================================
// SEAT 3D COMPONENT
// =============================================================================
function Seat3D({ position, seatData, status, onClick, isAnalyzing, onHover, onUnhover }) {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);

    const isAvailable = status !== 'booked';
    const isHighlighted = status === 'recommended' || status === 'selected';

    useFrame(() => {
        if (groupRef.current) {
            // Scale up slightly on hover, but never detach from the floor
            const s = (hovered && isAvailable && !isAnalyzing) ? 1.03 : 1;
            groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, s, 0.12);
            groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, s, 0.12);
            groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, s, 0.12);
        }
    });

    const matSet = hovered && isAvailable && !isAnalyzing ? seatMaterials.hover : seatMaterials[status];

    const handlePointerOver = useCallback((e) => {
        e.stopPropagation();
        if (isAvailable && !isAnalyzing) {
            setHovered(true);
            onHover?.(seatData, e);
            document.body.style.cursor = 'pointer';
        }
    }, [isAvailable, isAnalyzing, seatData, onHover]);

    const handlePointerOut = useCallback(() => {
        setHovered(false);
        onUnhover?.();
        document.body.style.cursor = 'default';
    }, [onUnhover]);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isAvailable) onClick();
    }, [isAvailable, onClick]);

    return (
        <group position={position} ref={groupRef}>
            <group
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                {/* Seat Cushion */}
                <mesh position={[0, 0.21, 0]} geometry={seatCushionGeo} material={matSet.cushion} castShadow />

                {/* Backrest — slightly tilted */}
                <mesh position={[0, 0.62, -0.24]} rotation={[-0.12, 0, 0]} geometry={seatBackGeo} material={matSet.cushion} castShadow />

                {/* Left Armrest */}
                <mesh position={[-0.32, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={armrestGeo} material={matSet.armTop} castShadow />
                <mesh position={[-0.32, 0.225, 0.06]} geometry={armrestSupportGeo} material={matSet.frame} castShadow />

                {/* Right Armrest */}
                <mesh position={[0.32, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={armrestGeo} material={matSet.armTop} castShadow />
                <mesh position={[0.32, 0.225, 0.06]} geometry={armrestSupportGeo} material={matSet.frame} castShadow />

                {/* Solid Base - reaches from floor to cushion */}
                <mesh position={[0, 0.10, -0.05]} geometry={seatBaseGeo} material={matSet.frame} castShadow />

                {/* Pedestal foot - wide plate at the very bottom for visual grounding */}
                <mesh position={[0, 0.002, -0.03]} geometry={seatFootGeo} material={matSet.frame} castShadow />

                {/* Gold emissive highlight for selected/recommended — backrest ring */}
                {isHighlighted && (
                    <mesh position={[0, 0.62, -0.19]} rotation={[-0.12, 0, 0]}>
                        <boxGeometry args={[0.58, 0.66, 0.008]} />
                        <primitive object={goldOutlineMat} attach="material" />
                    </mesh>
                )}
            </group>
        </group>
    );
}

// =============================================================================
// CAMERA CONTROLLER
// =============================================================================
function CameraController({ algorithmState, recommendedCenter, resetTrigger }) {
    const { camera } = useThree();
    const defaultPos = useMemo(() => new THREE.Vector3(0, 6.2, 12.5), []);
    const defaultTarget = useMemo(() => new THREE.Vector3(0, 2.5, -1), []);
    const currentTarget = useRef(new THREE.Vector3(0, 2.5, -1));
    const introProgress = useRef(0);

    useFrame((state) => {
        if (algorithmState === 'idle') {
            // Smooth intro animation
            introProgress.current = Math.min(introProgress.current + 0.008, 1);
            const ease = 1 - Math.pow(1 - introProgress.current, 3);

            // Subtle parallax from mouse
            const mouseX = state.pointer.x * 0.6 * ease;
            const mouseY = state.pointer.y * 0.3 * ease;

            // Start from further back, sweep into position
            const startPos = new THREE.Vector3(0, 7.5, 14.5);
            const targetPos = new THREE.Vector3(
                defaultPos.x + mouseX,
                defaultPos.y + mouseY,
                defaultPos.z
            );

            const lerpedPos = startPos.clone().lerp(targetPos, ease);
            camera.position.lerp(lerpedPos, 0.04);

            const lookTarget = new THREE.Vector3(mouseX * 0.15, 2.5, -1);
            currentTarget.current.lerp(lookTarget, 0.03);
            camera.lookAt(currentTarget.current);

        } else if (algorithmState === 'analyzing' || algorithmState === 'finding') {
            const targetPos = new THREE.Vector3(0, 5, 9);
            camera.position.lerp(targetPos, 0.025);
            currentTarget.current.lerp(new THREE.Vector3(0, 1.5, -1), 0.025);
            camera.lookAt(currentTarget.current);

        } else if (algorithmState === 'done' && recommendedCenter) {
            const targetCamPos = recommendedCenter.clone().add(new THREE.Vector3(0, 4, 5.5));
            camera.position.lerp(targetCamPos, 0.03);
            currentTarget.current.lerp(recommendedCenter, 0.03);
            camera.lookAt(currentTarget.current);
        }
    });

    // Reset trigger — snap back to intro
    useEffect(() => {
        if (resetTrigger > 0) {
            introProgress.current = 0.7; // Skip most of intro on reset
        }
    }, [resetTrigger]);

    return null;
}

// =============================================================================
// STEPPED FLOOR — Continuous, gap-free stadium-raked floor for the auditorium
// =============================================================================
function SteppedFloor({ totalRows }) {
    const stepMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#D4C8BA',
        roughness: 0.95,
        metalness: 0.02,
    }), []);

    // Main floor foundation sits at y = -0.10.
    // Each row's seating surface (tread top) = i * 0.3 - 0.01.
    // Each tier box extends solid from FLOOR_Y up to treadTop.
    const FLOOR_Y = -0.10;

    const risers = [];
    for (let i = 0; i < totalRows; i++) {
        const zPos = -2 + i * 1.5;
        const treadTop = i * 0.3 - 0.01;     // world-space top surface of this step
        const fullH = treadTop - FLOOR_Y;    // solid height from foundation to tread top
        const centerY = FLOOR_Y + fullH / 2; // box center

        // Solid tier box — spans full room width (22) and full depth of this row (1.5)
        risers.push(
            <mesh key={`tread-${i}`} position={[0, centerY, zPos]} receiveShadow castShadow>
                <boxGeometry args={[22, fullH, 1.5]} />
                <primitive object={stepMat} attach="material" />
            </mesh>
        );
    }

    // Rear upper terrace/concourse — extends from the last row (z = 3.25) to the back wall (z = 9.0)
    // at the highest tier level (0.89) so the raked floor is completely continuous without any cliff
    const lastRowTop = (totalRows - 1) * 0.3 - 0.01;
    const rearStart = -2 + (totalRows - 1) * 1.5 + 0.75;
    const backWallZ = totalRows * 1.5 + 3.0;
    const rearDepth = backWallZ - rearStart;
    const rearH = lastRowTop - FLOOR_Y;
    risers.push(
        <mesh
            key="rear-terrace"
            position={[0, FLOOR_Y + rearH / 2, rearStart + rearDepth / 2]}
            receiveShadow
            castShadow
        >
            <boxGeometry args={[22, rearH, rearDepth]} />
            <primitive object={stepMat} attach="material" />
        </mesh>
    );

    return <>{risers}</>;
}

// =============================================================================
// AISLE RUNNER — Continuous central burgundy carpet descending all tiers
// =============================================================================
function AisleRunner({ totalRows }) {
    const carpetMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#5A1520',
        roughness: 0.98,
        metalness: 0.0,
        side: THREE.DoubleSide,
    }), []);

    const aisleW = 1.4;
    const FLOOR_Y = -0.10;
    const EPS = 0.002;

    const runnerMeshes = [];

    // 1. Front walkway section leading to the screen
    const frontStart = -6.8;
    const frontEnd = -2.75;
    const frontLen = frontEnd - frontStart;
    runnerMeshes.push(
        <mesh
            key="runner-front"
            position={[0, FLOOR_Y + EPS, frontStart + frontLen / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
        >
            <planeGeometry args={[aisleW, frontLen]} />
            <primitive object={carpetMat} attach="material" />
        </mesh>
    );

    // 2. Front riser carpet (at z = -2.75, connecting front floor to Row 0)
    const row0Top = -0.01;
    const frontRiserH = row0Top - FLOOR_Y;
    runnerMeshes.push(
        <mesh
            key="runner-riser-front"
            position={[0, FLOOR_Y + frontRiserH / 2, -2.75 - EPS]}
            receiveShadow
        >
            <planeGeometry args={[aisleW, frontRiserH]} />
            <primitive object={carpetMat} attach="material" />
        </mesh>
    );

    // 3. Tiers and intermediate risers
    for (let i = 0; i < totalRows; i++) {
        const zPos = -2 + i * 1.5;
        const treadTop = i * 0.3 - 0.01;
        const prevTop = i === 0 ? FLOOR_Y : (i - 1) * 0.3 - 0.01;

        // Tread carpet
        runnerMeshes.push(
            <mesh
                key={`runner-tread-${i}`}
                position={[0, treadTop + EPS, zPos]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[aisleW, 1.5]} />
                <primitive object={carpetMat} attach="material" />
            </mesh>
        );

        // Vertical riser face between tiers
        if (i > 0) {
            const riserH = treadTop - prevTop;
            const riserY = prevTop + riserH / 2;
            runnerMeshes.push(
                <mesh
                    key={`runner-riser-${i}`}
                    position={[0, riserY, zPos - 0.75 - EPS]}
                    receiveShadow
                >
                    <planeGeometry args={[aisleW, riserH]} />
                    <primitive object={carpetMat} attach="material" />
                </mesh>
            );
        }
    }

    // 4. Rear upper walkway carpet to back wall
    const lastRowTop = (totalRows - 1) * 0.3 - 0.01;
    const rearStart = -2 + (totalRows - 1) * 1.5 + 0.75;
    const backWallZ = totalRows * 1.5 + 3.0;
    const rearLen = backWallZ - rearStart;
    runnerMeshes.push(
        <mesh
            key="runner-rear"
            position={[0, lastRowTop + EPS, rearStart + rearLen / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
        >
            <planeGeometry args={[aisleW, rearLen]} />
            <primitive object={carpetMat} attach="material" />
        </mesh>
    );

    return <>{runnerMeshes}</>;
}

// =============================================================================
// THEATRE SCENE
// =============================================================================
function TheatreScene({ seats, selectedSeats, recommendedSeats, onSeatClick, algorithmState, onSeatHover, onSeatUnhover, resetTrigger }) {
    // Parse rows from seat data
    const { sortedRows, rowGroups } = useMemo(() => {
        const groups = {};
        seats.forEach(seat => {
            const rowChar = seat.SeatNumber.match(/^[A-Za-z]+/)[0];
            if (!groups[rowChar]) groups[rowChar] = [];
            groups[rowChar].push(seat);
        });
        const sorted = Object.keys(groups).sort();
        return { sortedRows: sorted, rowGroups: groups };
    }, [seats]);

    // Calculate recommended center for camera
    const recommendedCenter = useMemo(() => {
        if (recommendedSeats.size === 0) return null;
        let xSum = 0, zSum = 0, count = 0;
        sortedRows.forEach((rowChar, rIdx) => {
            const rowSeats = [...rowGroups[rowChar]].sort((a, b) =>
                parseInt(a.SeatNumber.substring(rowChar.length)) - parseInt(b.SeatNumber.substring(rowChar.length))
            );
            const zPos = -2 + rIdx * 1.5;
            const yPos = rIdx * 0.3;
            rowSeats.forEach((seat, cIdx) => {
                if (recommendedSeats.has(seat.SeatID)) {
                    const xPos = (cIdx - (rowSeats.length - 1) / 2) * 1.0;
                    xSum += xPos;
                    zSum += zPos;
                    count++;
                }
            });
        });
        return count > 0 ? new THREE.Vector3(xSum / count, 1, zSum / count) : null;
    }, [recommendedSeats, sortedRows, rowGroups]);

    const getSeatStatus = useCallback((seat) => {
        if (seat.Status === 'BOOKED') return 'booked';
        if (selectedSeats.has(seat.SeatID)) return 'selected';
        if (recommendedSeats.has(seat.SeatID)) return 'recommended';
        return 'available';
    }, [selectedSeats, recommendedSeats]);

    // Scanner light for algorithm visualization
    const scanLightRef = useRef();
    useFrame((state) => {
        if (scanLightRef.current && (algorithmState === 'analyzing' || algorithmState === 'finding')) {
            scanLightRef.current.position.z = Math.sin(state.clock.elapsedTime * 2.0) * 5;
        }
    });

    const totalRows = sortedRows.length;

    return (
        <>
            {/* Camera */}
            <CameraController
                algorithmState={algorithmState}
                recommendedCenter={recommendedCenter}
                resetTrigger={resetTrigger}
            />

            {/* ===== LIGHTING ===== */}
            {/* Soft, low-intensity ambient fill */}
            <ambientLight intensity={0.4} color="#FFF5E0" />

            {/* Main key light from above-front — cinematic directional shadow caster */}
            <directionalLight
                position={[4, 14, 8]}
                intensity={1.4}
                color="#FFF8E8"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-16}
                shadow-camera-right={16}
                shadow-camera-top={20}
                shadow-camera-bottom={-10}
                shadow-bias={-0.001}
                shadow-normalBias={0.03}
                shadow-radius={6}
            />

            {/* Fill light from front-left — softer */}
            <directionalLight position={[-8, 10, 8]} intensity={0.8} color="#FFE8C8" />

            {/* Fill light from front-right — balance */}
            <directionalLight position={[8, 8, 6]} intensity={0.4} color="#FFE8C8" />

            {/* Ceiling warm wash — distributed along the auditorium */}
            <pointLight position={[0, 11, -2]} intensity={1.2} color="#FFDCA8" distance={25} />
            <pointLight position={[-6, 10, 2]} intensity={0.8} color="#FFD89E" distance={16} />
            <pointLight position={[6, 10, 2]} intensity={0.8} color="#FFD89E" distance={16} />
            <pointLight position={[0, 10, 8]} intensity={0.6} color="#FFDCA8" distance={18} />

            {/* Screen bounce — subtle warm fill from screen direction */}
            <pointLight position={[0, 3.5, -5.5]} intensity={0.8} color="#FFF5E8" distance={16} />

            {/* Wall sconce lights — warm brass tint */}
            <pointLight position={[-10, 4, 1]} intensity={0.8} color="#D4B054" distance={8} />
            <pointLight position={[10, 4, 1]} intensity={0.8} color="#D4B054" distance={8} />
            <pointLight position={[-10, 4, 6]} intensity={0.6} color="#D4B054" distance={7} />
            <pointLight position={[10, 4, 6]} intensity={0.6} color="#D4B054" distance={7} />

            {/* Back fill from behind the camera — illuminates rear rows */}
            <pointLight position={[0, 7, 18]} intensity={0.6} color="#FFF5E8" distance={22} />
            <pointLight position={[-5, 6, 14]} intensity={0.3} color="#FFE8D0" distance={14} />
            <pointLight position={[5, 6, 14]} intensity={0.3} color="#FFE8D0" distance={14} />

            {/* HDRI Environment for reflections */}
            <Environment preset="city" environmentIntensity={0.2} />

            {/* Algorithm scan light */}
            {(algorithmState === 'analyzing' || algorithmState === 'finding') && (
                <spotLight
                    ref={scanLightRef}
                    position={[0, 10, 0]}
                    angle={0.5}
                    penumbra={0.6}
                    intensity={5}
                    color="#C9A84C"
                    castShadow={false}
                />
            )}

            {/* Recommended hero spotlight */}
            {algorithmState === 'done' && recommendedCenter && (
                <spotLight
                    position={[recommendedCenter.x, recommendedCenter.y + 8, recommendedCenter.z + 2]}
                    target-position={[recommendedCenter.x, recommendedCenter.y, recommendedCenter.z]}
                    angle={0.4}
                    penumbra={0.5}
                    intensity={6}
                    color="#D4B054"
                    castShadow={false}
                />
            )}

            {/* ===== CINEMA SCREEN ===== */}
            <group position={[0, 3.8, -7.2]}>
                {/* Screen backing/frame — dark charcoal surround */}
                <mesh position={[0, 0, -0.18]}>
                    <boxGeometry args={[11.6, 5.2, 0.25]} />
                    <meshStandardMaterial color="#1A1816" roughness={0.92} metalness={0.08} />
                </mesh>
                {/* Gold frame trim top */}
                <mesh position={[0, 2.35, -0.05]}>
                    <boxGeometry args={[11.6, 0.03, 0.1]} />
                    <meshStandardMaterial color="#B08A3E" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Gold frame trim bottom */}
                <mesh position={[0, -2.35, -0.05]}>
                    <boxGeometry args={[11.6, 0.03, 0.1]} />
                    <meshStandardMaterial color="#B08A3E" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Gold frame trim left */}
                <mesh position={[-5.785, 0, -0.05]}>
                    <boxGeometry args={[0.03, 4.67, 0.1]} />
                    <meshStandardMaterial color="#B08A3E" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Gold frame trim right */}
                <mesh position={[5.785, 0, -0.05]}>
                    <boxGeometry args={[0.03, 4.67, 0.1]} />
                    <meshStandardMaterial color="#B08A3E" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Screen surface — soft emissive glow */}
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[11.3, 4.5]} />
                    <meshStandardMaterial
                        color="#D4D2CD"
                        emissive="#E5E2DC"
                        emissiveIntensity={0.12}
                        roughness={0.98}
                        metalness={0}
                    />
                </mesh>
                {/* Screen label */}
                <Text
                    position={[0, -2.9, 0.1]}
                    fontSize={0.22}
                    color="#B08A3E"
                    letterSpacing={0.35}
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                >
                    S C R E E N
                </Text>
            </group>

            {/* ===== ARCHITECTURE ===== */}
            {/* Main floor — warm neutral floor */}
            <mesh position={[0, -0.10, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#D4C8BA" roughness={0.95} metalness={0.02} />
            </mesh>

            {/* Stepped floor for stadium seating */}
            <SteppedFloor totalRows={totalRows} />

            {/* Continuous burgundy aisle carpet runner */}
            <AisleRunner totalRows={totalRows} />

            {/* Left Wall — dark burgundy panel */}
            <mesh position={[-11, 5.5, -1]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[24, 13]} />
                <meshStandardMaterial color="#4A1520" roughness={0.88} metalness={0.03} />
            </mesh>
            {/* Left Wall Paneling Lines */}
            {[-8, -3, 2, 7].map((z, i) => (
                <group key={`ltrim-${i}`} position={[-10.95, 5.5, z]}>
                    <mesh>
                        <boxGeometry args={[0.15, 13, 0.6]} />
                        <meshStandardMaterial color="#3A0E18" roughness={0.95} metalness={0.0} />
                    </mesh>
                    <mesh position={[0.08, 0, 0]}>
                        <boxGeometry args={[0.02, 13, 0.02]} />
                        <meshStandardMaterial color="#B08A3E" roughness={0.4} metalness={0.6} />
                    </mesh>
                </group>
            ))}

            {/* Right Wall */}
            <mesh position={[11, 5.5, -1]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[24, 13]} />
                <meshStandardMaterial color="#4A1520" roughness={0.88} metalness={0.03} />
            </mesh>
            {/* Right Wall Paneling Lines */}
            {[-8, -3, 2, 7].map((z, i) => (
                <group key={`rtrim-${i}`} position={[10.95, 5.5, z]}>
                    <mesh>
                        <boxGeometry args={[0.15, 13, 0.6]} />
                        <meshStandardMaterial color="#3A0E18" roughness={0.95} metalness={0.0} />
                    </mesh>
                    <mesh position={[-0.08, 0, 0]}>
                        <boxGeometry args={[0.02, 13, 0.02]} />
                        <meshStandardMaterial color="#B08A3E" roughness={0.4} metalness={0.6} />
                    </mesh>
                </group>
            ))}

            {/* Ceiling */}
            <mesh position={[0, 12, -1]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[22, 24]} />
                <meshStandardMaterial color="#22201E" roughness={0.94} metalness={0} />
            </mesh>

            {/* Back Wall */}
            <mesh position={[0, 5.5, totalRows * 1.5 + 3]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[22, 13]} />
                <meshStandardMaterial color="#3A1218" roughness={0.9} metalness={0.02} />
            </mesh>

            {/* Wall sconce fixtures — left side */}
            {[0, 5, 10].map((zOff, i) => (
                <group key={`sconce-l-${i}`} position={[-10.85, 4, -1 + zOff]}>
                    <mesh>
                        <boxGeometry args={[0.15, 0.5, 0.25]} />
                        <meshStandardMaterial color="#C9A84C" roughness={0.3} metalness={0.7} />
                    </mesh>
                    <mesh position={[0.12, 0.15, 0]}>
                        <boxGeometry args={[0.08, 0.15, 0.08]} />
                        <meshStandardMaterial color="#B08A3E" roughness={0.35} metalness={0.65} />
                    </mesh>
                </group>
            ))}

            {/* Wall sconce fixtures — right side */}
            {[0, 5, 10].map((zOff, i) => (
                <group key={`sconce-r-${i}`} position={[10.85, 4, -1 + zOff]}>
                    <mesh>
                        <boxGeometry args={[0.15, 0.5, 0.25]} />
                        <meshStandardMaterial color="#C9A84C" roughness={0.3} metalness={0.7} />
                    </mesh>
                    <mesh position={[-0.12, 0.15, 0]}>
                        <boxGeometry args={[0.08, 0.15, 0.08]} />
                        <meshStandardMaterial color="#B08A3E" roughness={0.35} metalness={0.65} />
                    </mesh>
                </group>
            ))}

            {/* Subtle brass trim at screen base */}
            <mesh position={[0, 1.2, -6.9]}>
                <boxGeometry args={[14.5, 0.06, 0.06]} />
                <meshStandardMaterial color="#B08A3E" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* ===== SEATS LAYOUT ===== */}
            <group>
                {sortedRows.map((rowChar, rIdx) => {
                    const rowSeats = [...rowGroups[rowChar]].sort((a, b) =>
                        parseInt(a.SeatNumber.substring(rowChar.length)) - parseInt(b.SeatNumber.substring(rowChar.length))
                    );
                    const zPos = -2 + rIdx * 1.5;
                    const yPos = rIdx * 0.3;

                    return (
                        <group key={rowChar}>
                            {/* Row label on the left side */}
                            <Text
                                position={[-(rowSeats.length / 2) * 1.0 - 1.2, yPos + 0.5, zPos]}
                                fontSize={0.25}
                                color="#B08A3E"
                                anchorX="center"
                                anchorY="middle"
                                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                            >
                                {rowChar}
                            </Text>

                            {/* Row label on the right side */}
                            <Text
                                position={[(rowSeats.length / 2) * 1.0 + 1.2, yPos + 0.5, zPos]}
                                fontSize={0.25}
                                color="#B08A3E"
                                anchorX="center"
                                anchorY="middle"
                                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                            >
                                {rowChar}
                            </Text>

                            {rowSeats.map((seat, cIdx) => {
                                const xPos = (cIdx - (rowSeats.length - 1) / 2) * 1.0;
                                const seatStatus = getSeatStatus(seat);

                                return (
                                    <Seat3D
                                        key={seat.SeatID}
                                        position={[xPos, yPos, zPos]}
                                        seatData={seat}
                                        status={seatStatus}
                                        isAnalyzing={algorithmState === 'analyzing' || algorithmState === 'finding'}
                                        onClick={() => {
                                            if (seatStatus !== 'booked') onSeatClick(seat);
                                        }}
                                        onHover={onSeatHover}
                                        onUnhover={onSeatUnhover}
                                    />
                                );
                            })}
                        </group>
                    );
                })}
            </group>
        </>
    );
}

// =============================================================================
// SEAT TOOLTIP OVERLAY
// =============================================================================
function SeatTooltip({ seatInfo }) {
    if (!seatInfo) return null;

    return (
        <div style={{
            position: 'fixed',
            left: seatInfo.x + 12,
            top: seatInfo.y - 48,
            backgroundColor: 'rgba(26, 24, 22, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#F7F4EC',
            padding: '0.5rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            letterSpacing: '0.04em',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            transform: 'translateY(-4px)',
        }}>
            <span style={{ color: '#C9A84C', fontWeight: 700 }}>{seatInfo.seat.SeatNumber}</span>
            <span style={{ margin: '0 0.5rem', opacity: 0.4 }}>·</span>
            <span>₹{seatInfo.seat.Price}</span>
        </div>
    );
}

// =============================================================================
// LEGEND COMPONENT
// =============================================================================
function SeatLegend() {
    const items = [
        { color: '#9B3040', label: 'Available' },
        { color: '#D4B054', label: 'Selected' },
        { color: '#5A5550', label: 'Booked' },
    ];

    return (
        <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
            display: 'flex',
            gap: '1.2rem',
            padding: '0.6rem 1rem',
            backgroundColor: 'rgba(247, 244, 236, 0.88)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: '1px solid rgba(176, 138, 62, 0.15)',
            zIndex: 10,
        }}>
            {items.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{
                        width: 12, height: 12,
                        borderRadius: 3,
                        backgroundColor: item.color,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }} />
                    <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        color: '#68645D',
                        textTransform: 'uppercase',
                    }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
}


// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function SeatSelection() {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState(new Set());
    const [recommendedSeats, setRecommendedSeats] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState(null);
    const [groupSize, setGroupSize] = useState(2);
    const [algorithmState, setAlgorithmState] = useState('idle');
    const [hoveredSeat, setHoveredSeat] = useState(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Check reduced motion preference
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    }, []);

    // Responsive breakpoint
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 900);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setLoading(true);
        setSelectedSeats(new Set());
        setRecommendedSeats(new Set());
        setAlgorithmState('idle');
        setError(null);
        fetchSeatsForShow(showId)
            .then(data => {
                setSeats(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [showId]);

    const handleSeatClick = useCallback((seat) => {
        if (algorithmState === 'analyzing' || algorithmState === 'finding') return;

        setSelectedSeats(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(seat.SeatID)) {
                newSelected.delete(seat.SeatID);
            } else {
                newSelected.add(seat.SeatID);
            }
            return newSelected;
        });
        setRecommendedSeats(new Set());
        setAlgorithmState('idle');
    }, [algorithmState]);

    const handleFindBestSeats = useCallback(async () => {
        if (algorithmState === 'analyzing' || algorithmState === 'finding') return;

        setError(null);
        setRecommendedSeats(new Set());
        setSelectedSeats(new Set());

        setAlgorithmState('analyzing');
        await new Promise(r => setTimeout(r, prefersReducedMotion ? 200 : 1200));

        setAlgorithmState('finding');
        await new Promise(r => setTimeout(r, prefersReducedMotion ? 200 : 1500));

        try {
            const result = await recommendSeats(showId, groupSize);
            const recSeatIds = result.recommendedSeats.map(s => s.SeatID);

            setRecommendedSeats(new Set(recSeatIds));
            setSelectedSeats(new Set(recSeatIds));
            setAlgorithmState('done');
        } catch (err) {
            setError(err.message);
            setAlgorithmState('idle');
        }
    }, [algorithmState, showId, groupSize, prefersReducedMotion]);

    const handleBook = useCallback(async () => {
        if (selectedSeats.size === 0) return;
        setBooking(true);
        setError(null);
        try {
            const result = await createBooking(showId, Array.from(selectedSeats), 'UPI');
            setTimeout(() => navigate(`/booking/${result.booking.bookingId}`), 500);
        } catch (err) {
            setError(err.message);
            fetchSeatsForShow(showId).then(setSeats);
            setSelectedSeats(new Set());
            setBooking(false);
        }
    }, [selectedSeats, showId, navigate]);

    const handleResetView = useCallback(() => {
        setAlgorithmState('idle');
        setResetTrigger(prev => prev + 1);
    }, []);

    const handleSeatHover = useCallback((seat, event) => {
        setHoveredSeat({
            seat,
            x: event?.clientX ?? 0,
            y: event?.clientY ?? 0,
        });
    }, []);

    const handleSeatUnhover = useCallback(() => {
        setHoveredSeat(null);
    }, []);

    // Loading state
    if (loading) {
        return (
            <div style={{
                width: '100vw', height: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--c-bg-main)',
                flexDirection: 'column', gap: '1rem',
            }}>
                <div className="spin" style={{
                    width: 28, height: 28,
                    border: '2px solid rgba(176,138,62,0.2)',
                    borderTopColor: 'var(--c-gold)',
                    borderRadius: '50%',
                }} />
                <div className="font-sans" style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 500 }}>
                    LOADING AUDITORIUM
                </div>
            </div>
        );
    }

    // Error state (no seats loaded)
    if (error && seats.length === 0) {
        return (
            <div style={{
                width: '100vw', height: '100vh',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--c-bg-main)', color: 'var(--c-burgundy)',
                gap: '1rem',
            }}>
                <h2 className="font-serif">Something went wrong</h2>
                <p className="font-sans" style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>{error}</p>
                <Link to="/" className="font-sans" style={{
                    marginTop: '1rem', color: 'var(--c-gold)',
                    textDecoration: 'none', fontSize: '0.85rem',
                    letterSpacing: '0.1em', fontWeight: 600,
                }}>
                    ← RETURN HOME
                </Link>
            </div>
        );
    }

    // Computed values
    const totalPrice = Array.from(selectedSeats).reduce((total, id) => {
        const seat = seats.find(s => s.SeatID === id);
        return total + parseFloat(seat?.Price || 0);
    }, 0);

    const selectedSeatNames = Array.from(selectedSeats)
        .map(id => seats.find(s => s.SeatID === id)?.SeatNumber)
        .filter(Boolean)
        .sort()
        .join(' · ');

    const selectedSeatsList = Array.from(selectedSeats).map(id => seats.find(s => s.SeatID === id)).filter(Boolean);

    // Layout dimensions based on viewport
    const viewportStyle = isMobile ? { width: '100%', height: '55vh' } : { flex: 1, minWidth: 0, height: '100vh' };
    const panelStyle = isMobile ? { width: '100%', height: 'auto' } : { flex: '0 0 380px', width: '380px', height: '100vh' };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.8 }}
            style={{
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                overflow: isMobile ? 'auto' : 'hidden',
                backgroundColor: 'var(--c-bg-main)',
            }}
        >
            {/* ===== TOP NAVIGATION OVERLAY ===== */}
            <div style={{
                position: isMobile ? 'sticky' : 'absolute',
                top: 0, left: 0, right: 0,
                display: 'flex',
                height: '70px',
                zIndex: 50,
                pointerEvents: 'none',
                backgroundColor: isMobile ? 'var(--c-bg-main)' : 'transparent',
                flexDirection: isMobile ? 'row' : 'row',
            }}>
                {/* Left side nav */}
                <div style={{ width: isMobile ? '100%' : 'calc(100% - 380px)', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            color: 'var(--c-text-primary)', pointerEvents: 'auto',
                            background: 'rgba(247,244,236,0.7)', backdropFilter: 'blur(8px)',
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            border: '1px solid rgba(176,138,62,0.12)',
                            cursor: 'pointer',
                        }}
                    >
                        <ArrowLeft size={18} />
                        <span className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 600 }}>CineTicket</span>
                    </button>
                </div>
                {/* Right side nav — hidden on mobile */}
                {!isMobile && (
                    <div style={{
                        width: '380px', flex: '0 0 380px', padding: '0 2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                    }}>
                        <div style={{ display: 'flex', gap: '1.5rem', pointerEvents: 'auto' }}>
                            <Link to="/" className="font-sans" style={{
                                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
                                color: 'var(--c-text-primary)', textDecoration: 'none',
                            }}>MOVIES</Link>
                            <Link to="/my-bookings" className="font-sans" style={{
                                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
                                color: 'var(--c-text-primary)', textDecoration: 'none',
                            }}>MY BOOKINGS</Link>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <Link to="/demo" className="font-sans" style={{
                                textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
                                letterSpacing: '0.1em', color: 'var(--c-gold)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                pointerEvents: 'auto',
                            }}>
                                <span style={{
                                    width: '5px', height: '5px', borderRadius: '50%',
                                    backgroundColor: 'var(--c-gold)',
                                }} />
                                DBMS LAB
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* ===== LEFT: 3D THEATRE VIEWPORT ===== */}
            <div style={{
                ...viewportStyle,
                position: 'relative',
                backgroundColor: '#1C1917',
                flexShrink: 0,
            }}>
                <Canvas
                    camera={{ position: [0, 7, 10], fov: 50 }}
                    dpr={[1, 1.5]}
                    shadows
                    gl={{
                        antialias: true,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.0,
                        outputColorSpace: THREE.SRGBColorSpace,
                    }}
                    onCreated={({ gl }) => {
                        gl.shadowMap.enabled = true;
                        gl.shadowMap.type = THREE.PCFSoftShadowMap;
                    }}
                >
                    <color attach="background" args={['#1C1917']} />
                    <fog attach="fog" args={['#1C1917', 28, 55]} />

                    <TheatreScene
                        seats={seats}
                        selectedSeats={selectedSeats}
                        recommendedSeats={recommendedSeats}
                        onSeatClick={handleSeatClick}
                        algorithmState={algorithmState}
                        onSeatHover={handleSeatHover}
                        onSeatUnhover={handleSeatUnhover}
                        resetTrigger={resetTrigger}
                    />
                </Canvas>

                {/* Seat tooltip */}
                <SeatTooltip seatInfo={hoveredSeat} />

                {/* Legend */}
                <SeatLegend />

                {/* Reset view button */}
                <button
                    onClick={handleResetView}
                    title="Reset Camera View"
                    style={{
                        position: 'absolute',
                        bottom: '1.5rem', right: '1.5rem',
                        width: 40, height: 40,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(247, 244, 236, 0.88)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(176, 138, 62, 0.15)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        zIndex: 10,
                        color: 'var(--c-text-muted)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(247, 244, 236, 0.95)';
                        e.currentTarget.style.color = 'var(--c-gold)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(247, 244, 236, 0.88)';
                        e.currentTarget.style.color = 'var(--c-text-muted)';
                    }}
                >
                    <RotateCcw size={16} />
                </button>

                {/* Algorithm status overlay */}
                <AnimatePresence mode="wait">
                    {algorithmState !== 'idle' && (
                        <motion.div
                            key={algorithmState}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: 'absolute',
                                bottom: '5rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            <span className="font-sans" style={{
                                fontSize: '0.85rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: algorithmState === 'done' ? 'var(--c-gold)' : 'var(--c-text-secondary)',
                                marginBottom: '0.4rem',
                                fontWeight: 600,
                                padding: '0.5rem 1.2rem',
                                backgroundColor: 'rgba(247,244,236,0.88)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '6px',
                                border: '1px solid rgba(176,138,62,0.15)',
                            }}>
                                {algorithmState === 'analyzing' && '⟳ Analyzing Seating...'}
                                {algorithmState === 'finding' && '⟳ Locating Optimal Block...'}
                                {algorithmState === 'done' && '✦ Recommended Position'}
                            </span>
                            {algorithmState === 'done' && (
                                <span className="font-serif" style={{
                                    fontSize: '1.6rem', color: 'var(--c-text-primary)',
                                    marginTop: '0.4rem',
                                }}>
                                    {selectedSeatNames}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ===== VERTICAL DIVIDER ===== */}
            {!isMobile && (
                <div style={{
                    width: '1px',
                    backgroundColor: 'rgba(176,138,62,0.12)',
                    height: '100%',
                    zIndex: 20,
                }} />
            )}

            {/* ===== RIGHT: BOOKING PANEL ===== */}
            <div style={{
                ...panelStyle,
                boxSizing: 'border-box',
                backgroundColor: 'var(--c-bg-main)',
                padding: isMobile ? '1.5rem 1.5rem 2rem 1.5rem' : '6rem 2.5rem 2rem 2.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                zIndex: 20,
                position: 'relative',
                overflowY: 'auto',
                ...(isMobile ? { borderTop: '1px solid rgba(176,138,62,0.12)' } : {}),
            }}>
                {/* Subtle noise texture */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                }} />

                {/* Error banner */}
                {error && (
                    <div className="font-sans" style={{
                        color: '#5D111A', fontSize: '0.75rem',
                        marginBottom: '1rem', padding: '0.75rem',
                        border: '1px solid rgba(124, 31, 42, 0.2)',
                        backgroundColor: 'rgba(124, 31, 42, 0.05)',
                        borderRadius: '6px',
                        zIndex: 2,
                    }}>
                        {error}
                    </div>
                )}

                {/* Header + Group controls */}
                <div style={{ marginBottom: '2rem', zIndex: 2 }}>
                    <h3 className="font-serif" style={{
                        fontSize: isMobile ? '1.6rem' : '2rem', marginBottom: '1.5rem',
                        color: 'var(--c-text-primary)', lineHeight: 1.1,
                    }}>
                        Select Your Seats
                    </h3>

                    <label className="font-sans" style={{
                        display: 'block', fontSize: '0.7rem',
                        color: 'var(--c-text-muted)', letterSpacing: '0.12em',
                        marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600,
                    }}>
                        Group Size
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <input
                            type="number" min="1" max="10"
                            value={groupSize}
                            onChange={(e) => setGroupSize(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            className="font-sans"
                            style={{
                                width: '70px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(23, 22, 21, 0.1)',
                                color: 'var(--c-text-primary)',
                                textAlign: 'center',
                                padding: '0.65rem',
                                fontSize: '1.1rem',
                                outline: 'none',
                                borderRadius: '6px',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--c-gold)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(23, 22, 21, 0.1)'}
                        />
                        <button
                            onClick={handleFindBestSeats}
                            disabled={algorithmState === 'analyzing' || algorithmState === 'finding'}
                            className="font-sans"
                            style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--c-gold)',
                                color: 'var(--c-gold)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                cursor: (algorithmState === 'analyzing' || algorithmState === 'finding') ? 'not-allowed' : 'pointer',
                                opacity: (algorithmState === 'analyzing' || algorithmState === 'finding') ? 0.5 : 1,
                                borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            }}
                            onMouseEnter={(e) => {
                                if (algorithmState !== 'analyzing' && algorithmState !== 'finding') {
                                    e.currentTarget.style.backgroundColor = 'rgba(176,138,62,0.08)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <Sparkles size={13} />
                            Find Best Seats
                        </button>
                    </div>
                </div>

                {/* Ticket Summary Card */}
                <div style={{
                    backgroundColor: 'var(--c-surface)',
                    color: 'var(--c-text-primary)',
                    padding: isMobile ? '1.5rem' : '2rem',
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
                    borderRadius: '10px',
                    zIndex: 2,
                    border: '1px solid rgba(176,138,62,0.08)',
                    flex: '0 0 auto',
                }}>
                    {/* Selected seats section */}
                    <div style={{
                        borderBottom: '1px dashed rgba(0,0,0,0.1)',
                        marginBottom: '1.5rem', paddingBottom: '1.2rem',
                    }}>
                        <div className="font-sans" style={{
                            fontSize: '0.62rem', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                            color: 'var(--c-text-muted)', marginBottom: '0.6rem',
                        }}>
                            SELECTED SEATS
                        </div>
                        <div className="font-serif" style={{
                            fontSize: '1.6rem', minHeight: '2.2rem',
                            color: selectedSeats.size > 0 ? 'var(--c-burgundy)' : 'var(--c-text-muted)',
                            lineHeight: 1.3,
                        }}>
                            {selectedSeats.size > 0 ? selectedSeatNames : '—'}
                        </div>
                    </div>

                    {/* Per-seat breakdown */}
                    {selectedSeatsList.length > 0 && (
                        <div style={{
                            marginBottom: '1.2rem',
                            maxHeight: '120px',
                            overflowY: 'auto',
                        }}>
                            {selectedSeatsList.map(seat => (
                                <div key={seat.SeatID} className="font-sans" style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '0.75rem', color: 'var(--c-text-secondary)',
                                    padding: '0.25rem 0',
                                }}>
                                    <span>{seat.SeatNumber}</span>
                                    <span>₹{seat.Price}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-end', marginBottom: '1.8rem',
                        paddingTop: selectedSeatsList.length > 0 ? '0.8rem' : 0,
                        borderTop: selectedSeatsList.length > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    }}>
                        <div className="font-sans" style={{
                            fontSize: '0.62rem', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                            color: 'var(--c-text-muted)',
                        }}>
                            TOTAL
                        </div>
                        <div className="font-sans" style={{
                            fontSize: '1.8rem', lineHeight: 1,
                            fontWeight: 700, color: 'var(--c-text-primary)',
                        }}>
                            ₹{totalPrice}
                        </div>
                    </div>

                    {/* Confirm button */}
                    <button
                        onClick={handleBook}
                        disabled={booking || selectedSeats.size === 0}
                        style={{
                            width: '100%',
                            backgroundColor: selectedSeats.size > 0 ? 'var(--c-burgundy)' : '#D3CCC1',
                            color: selectedSeats.size > 0 ? '#FFFFFF' : '#8A857D',
                            padding: '1.1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: selectedSeats.size > 0 && !booking ? 'pointer' : 'not-allowed',
                            transition: 'all 0.25s',
                            boxShadow: selectedSeats.size > 0
                                ? '0 6px 16px rgba(124, 31, 42, 0.2)'
                                : 'none',
                            fontFamily: 'var(--font-sans)',
                        }}
                        onMouseEnter={(e) => {
                            if (selectedSeats.size > 0 && !booking) {
                                e.currentTarget.style.backgroundColor = '#5D111A';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 31, 42, 0.25)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedSeats.size > 0 && !booking) {
                                e.currentTarget.style.backgroundColor = 'var(--c-burgundy)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 31, 42, 0.2)';
                            }
                        }}
                    >
                        <Ticket size={15} />
                        {booking ? 'PROCESSING...' : 'CONFIRM BOOKING'}
                    </button>

                    {/* Ticket perforation cutouts */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '-10px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: 'var(--c-bg-main)',
                        transform: 'translateY(-50%)',
                    }} />
                    <div style={{
                        position: 'absolute', top: '50%', right: '-10px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: 'var(--c-bg-main)',
                        transform: 'translateY(-50%)',
                    }} />
                </div>

                {/* Subtle info note */}
                <div className="font-sans" style={{
                    marginTop: '1.2rem',
                    fontSize: '0.65rem',
                    color: 'var(--c-text-muted)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    lineHeight: 1.5,
                    zIndex: 2,
                }}>
                    <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Click seats in the 3D view to select. Use "Find Best Seats" for optimal adjacent seating.</span>
                </div>
            </div>
        </motion.div>
    );
}
