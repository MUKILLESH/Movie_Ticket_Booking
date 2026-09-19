import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, SpotLight, Text } from '@react-three/drei';
import * as THREE from 'three';
import { fetchSeatsForShow, recommendSeats, createBooking } from '../services/api';
import { ArrowLeft, Ticket } from 'lucide-react';

// --- Detailed 3D Seat Component ---
function Seat3D({ position, seatData, status, onClick, isAnalyzing }) {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);

    // Light Theme Colors
    const colors = {
        available: '#7C1F2A',     // Burgundy
        booked: '#292622',        // Dark charcoal
        selected: '#5D111A',      // Darker Burgundy
        recommended: '#B08A3E',   // Gold
    };

    const isAvailable = status !== 'booked';
    const isRecommended = status === 'recommended';
    const isSelected = status === 'selected';
    
    // Elevate and move forward selected/recommended seats slightly
    const targetY = (hovered && isAvailable && !isAnalyzing) || isRecommended || isSelected ? position[1] + 0.2 : position[1];
    const targetZ = (hovered && isAvailable && !isAnalyzing) || isRecommended || isSelected ? position[2] + 0.1 : position[2];
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);
            
            if (hovered && isAvailable && !isAnalyzing) {
                // Subtle scale up on hover
                groupRef.current.scale.lerp(new THREE.Vector3(1.02, 1.02, 1.02), 0.15);
            } else {
                groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
            }
        }
    });

    const cushionMat = new THREE.MeshStandardMaterial({
        color: colors[status],
        roughness: 0.9,
        metalness: 0.1,
    });

    const frameMat = new THREE.MeshStandardMaterial({
        color: '#171615',
        roughness: 0.7,
        metalness: 0.5,
    });

    return (
        <group position={position} ref={groupRef}>
            <group
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={() => setHovered(false)}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
                {/* Seat Cushion */}
                <mesh position={[0, 0.2, 0]} material={cushionMat}>
                    <boxGeometry args={[0.55, 0.15, 0.6]} />
                </mesh>
                
                {/* Seat Backrest (Curved/Tilted) */}
                <mesh position={[0, 0.6, -0.25]} rotation={[-0.1, 0, 0]} material={cushionMat}>
                    <boxGeometry args={[0.55, 0.7, 0.15]} />
                </mesh>

                {/* Left Armrest */}
                <mesh position={[-0.35, 0.45, 0]} material={frameMat}>
                    <boxGeometry args={[0.1, 0.1, 0.6]} />
                </mesh>

                {/* Right Armrest */}
                <mesh position={[0.35, 0.45, 0]} material={frameMat}>
                    <boxGeometry args={[0.1, 0.1, 0.6]} />
                </mesh>
                
                {/* Cupholders (subtle indent/metal ring on armrests) */}
                <mesh position={[-0.35, 0.5, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
                    <meshStandardMaterial color="#000" />
                </mesh>
                <mesh position={[0.35, 0.5, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
                    <meshStandardMaterial color="#000" />
                </mesh>

                {/* Frame Base/Legs */}
                <mesh position={[0, 0.05, -0.1]} material={frameMat}>
                    <boxGeometry args={[0.4, 0.1, 0.3]} />
                </mesh>

                {/* Brass Edge Outline for Selected/Recommended */}
                {(isRecommended || isSelected) && (
                    <mesh position={[0, 0.6, -0.17]} rotation={[-0.1, 0, 0]}>
                        <boxGeometry args={[0.58, 0.73, 0.02]} />
                        <meshBasicMaterial color="#B08A3E" />
                    </mesh>
                )}
                
                {/* Warm highlight on hover */}
                {hovered && isAvailable && !isAnalyzing && (
                    <pointLight color="#F5F1E8" intensity={1} distance={1.5} position={[0, 1, 0.5]} />
                )}
            </group>
        </group>
    );
}

// --- Bright Luxury Theatre Environment ---
function TheatreScene({ seats, selectedSeats, recommendedSeats, onSeatClick, algorithmState }) {
    const groupRef = useRef();
    const { camera } = useThree();
    const scanRef = useRef();
    
    const rowGroups = {};
    seats.forEach(seat => {
        const rowChar = seat.SeatNumber.match(/^[A-Za-z]+/)[0];
        if (!rowGroups[rowChar]) rowGroups[rowChar] = [];
        rowGroups[rowChar].push(seat);
    });
    const sortedRows = Object.keys(rowGroups).sort();
    
    // Calculate center of recommended seats for Phase 4 focus
    const recommendedCenter = new THREE.Vector3(0, 0, 0);
    if (recommendedSeats.size > 0 && algorithmState === 'done') {
        let xSum = 0, zSum = 0;
        let count = 0;
        sortedRows.forEach((rowChar, rIdx) => {
            const rowSeats = rowGroups[rowChar].sort((a,b) => parseInt(a.SeatNumber.substring(1)) - parseInt(b.SeatNumber.substring(1)));
            const zPos = -2 + rIdx * 1.5;
            rowSeats.forEach((seat, cIdx) => {
                if (recommendedSeats.has(seat.SeatID)) {
                    const xPos = (cIdx - (rowSeats.length - 1) / 2) * 1.1;
                    xSum += xPos;
                    zSum += zPos;
                    count++;
                }
            });
        });
        if (count > 0) {
            recommendedCenter.set(xSum / count, 0, zSum / count);
        }
    }

    useFrame((state, delta) => {
        if (algorithmState === 'idle') {
            // Subtle parallax mouse movement (2-4 degrees)
            const targetX = state.pointer.x * 0.5;
            const targetY = 8 + state.pointer.y * 0.5;
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.02);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.02);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 11, 0.02);
            
            // Look slightly below center to ground the perspective
            camera.lookAt(targetX * 0.2, 2, -2);
        } else if (algorithmState === 'analyzing' || algorithmState === 'finding') {
            // Phase 1/2: Camera moves slightly forward
            camera.position.lerp(new THREE.Vector3(0, 7, 8), 0.02);
            camera.lookAt(0, 2, 0);
            
            // Phase 2: Warm sweep scan light across the rows sequentially
            if (scanRef.current) {
                const scanZ = Math.sin(state.clock.elapsedTime * 2.5) * 4;
                scanRef.current.position.z = scanZ;
            }
        } else if (algorithmState === 'done') {
            // Phase 4: Focus tightly on recommended row
            const targetCamPos = recommendedCenter.clone().add(new THREE.Vector3(0, 4, 5));
            camera.position.lerp(targetCamPos, 0.03);
            camera.lookAt(recommendedCenter);
        }
    });

    const getSeatStatus = (seat) => {
        if (seat.Status === 'BOOKED') return 'booked';
        if (selectedSeats.has(seat.SeatID)) return 'selected';
        if (recommendedSeats.has(seat.SeatID)) return 'recommended';
        return 'available';
    };

    return (
        <group ref={groupRef}>
            {/* Cinematic Emissive Screen */}
            <mesh position={[0, 4.5, -7]}>
                <cylinderGeometry args={[18, 18, 7, 32, 1, false, Math.PI * 0.8, Math.PI * 0.4]} />
                <meshStandardMaterial color="#FFFFFF" emissive="#FFE5C4" emissiveIntensity={0.6} side={THREE.DoubleSide} />
            </mesh>
            
            <Text position={[0, 4.5, -6.5]} fontSize={0.4} color="#B08A3E" letterSpacing={0.4} opacity={0.8} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                SCREEN
            </Text>

            {/* Architecture / Walls & Floor */}
            {/* Floor/Carpet */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[40, 30]} />
                <meshStandardMaterial color="#2E2822" roughness={0.9} />
            </mesh>
            
            {/* Left Wall */}
            <mesh position={[-12, 5, -2]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[20, 10]} />
                <meshStandardMaterial color="#EFE9DD" roughness={0.8} />
            </mesh>
            
            {/* Right Wall */}
            <mesh position={[12, 5, -2]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[20, 10]} />
                <meshStandardMaterial color="#EFE9DD" roughness={0.8} />
            </mesh>
            
            {/* Ceiling */}
            <mesh position={[0, 10, -2]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[24, 20]} />
                <meshStandardMaterial color="#EFE9DD" roughness={1} />
            </mesh>

            {/* Curtains */}
            {/* Left Curtain */}
            <mesh position={[-10, 4, -6]} rotation={[0, Math.PI / 8, 0]}>
                <cylinderGeometry args={[1, 1, 8, 16, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#7C1F2A" roughness={0.9} />
            </mesh>
            <mesh position={[-11, 4, -6.5]} rotation={[0, Math.PI / 8, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 8, 16, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#7C1F2A" roughness={0.9} />
            </mesh>
            
            {/* Right Curtain */}
            <mesh position={[10, 4, -6]} rotation={[0, -Math.PI / 8, 0]}>
                <cylinderGeometry args={[1, 1, 8, 16, 1, false, Math.PI, Math.PI]} />
                <meshStandardMaterial color="#7C1F2A" roughness={0.9} />
            </mesh>
            <mesh position={[11, 4, -6.5]} rotation={[0, -Math.PI / 8, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 8, 16, 1, false, Math.PI, Math.PI]} />
                <meshStandardMaterial color="#7C1F2A" roughness={0.9} />
            </mesh>

            {/* Seats Layout */}
            <group position={[0, 0, 0]}>
                {sortedRows.map((rowChar, rIdx) => {
                    const rowSeats = rowGroups[rowChar].sort((a,b) => parseInt(a.SeatNumber.substring(1)) - parseInt(b.SeatNumber.substring(1)));
                    const zPos = -2 + rIdx * 1.5; // Cinematic rake depth
                    const yPos = rIdx * 0.35; // Raked height
                    
                    return rowSeats.map((seat, cIdx) => {
                        const xPos = (cIdx - (rowSeats.length - 1) / 2) * 1.1;
                        const status = getSeatStatus(seat);
                        
                        return (
                            <Seat3D 
                                key={seat.SeatID}
                                position={[xPos, yPos, zPos]}
                                seatData={seat}
                                status={status}
                                isAnalyzing={algorithmState === 'analyzing' || algorithmState === 'finding'}
                                onClick={() => {
                                    if (status !== 'booked') onSeatClick(seat);
                                }}
                            />
                        );
                    });
                })}
            </group>

            {/* Warm Architectural Lighting */}
            <ambientLight intensity={0.6} color="#FFE5C4" />
            
            {/* Screen Primary Bounce Light */}
            <pointLight position={[0, 4, -4]} intensity={1.5} color="#FFE5C4" distance={15} />
            
            {/* Ceiling Warm Lights */}
            <pointLight position={[-5, 9, 2]} intensity={0.8} color="#FFDCA8" distance={10} />
            <pointLight position={[5, 9, 2]} intensity={0.8} color="#FFDCA8" distance={10} />
            
            {/* Wall Sconces (Left/Right) */}
            <pointLight position={[-11.5, 3, 0]} intensity={1.2} color="#B08A3E" distance={5} />
            <mesh position={[-11.9, 3, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.2, 0.6, 0.4]} />
                <meshStandardMaterial color="#B08A3E" />
            </mesh>
            
            <pointLight position={[11.5, 3, 0]} intensity={1.2} color="#B08A3E" distance={5} />
            <mesh position={[11.9, 3, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.2, 0.6, 0.4]} />
                <meshStandardMaterial color="#B08A3E" />
            </mesh>

            {/* Scanner Light representing algorithm */}
            {(algorithmState === 'analyzing' || algorithmState === 'finding') && (
                <SpotLight
                    ref={scanRef}
                    position={[0, 9, 0]}
                    target-position={[0, 0, 0]}
                    angle={0.6}
                    penumbra={0.5}
                    intensity={6}
                    color="#B08A3E"
                />
            )}
            
            {/* Recommended Hero Light */}
            {algorithmState === 'done' && (
                <SpotLight
                    position={[recommendedCenter.x, recommendedCenter.y + 7, recommendedCenter.z + 1]}
                    target-position={[recommendedCenter.x, recommendedCenter.y, recommendedCenter.z]}
                    angle={0.5}
                    penumbra={0.4}
                    intensity={8}
                    color="#C79A46"
                />
            )}
        </group>
    );
}

// Main Component
export default function SeatSelection() {
    const { showId } = useParams();
    const navigate = useNavigate();
    
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState(new Set());
    const [recommendedSeats, setRecommendedSeats] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState(null);
    const [groupSize, setGroupSize] = useState(2);
    const [algorithmState, setAlgorithmState] = useState('idle');

    useEffect(() => {
        setLoading(true);
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

    const handleSeatClick = (seat) => {
        if (algorithmState === 'analyzing' || algorithmState === 'finding') return;
        
        const newSelected = new Set(selectedSeats);
        if (newSelected.has(seat.SeatID)) {
            newSelected.delete(seat.SeatID);
        } else {
            newSelected.add(seat.SeatID);
        }
        setSelectedSeats(newSelected);
        setRecommendedSeats(new Set());
        setAlgorithmState('idle');
    };

    const handleFindBestSeats = async () => {
        if (algorithmState === 'analyzing' || algorithmState === 'finding') return;
        
        setError(null);
        setRecommendedSeats(new Set());
        setSelectedSeats(new Set());
        
        // Phase 1: Analyzing...
        setAlgorithmState('analyzing');
        await new Promise(r => setTimeout(r, 1200));
        
        // Phase 2: Scanning...
        setAlgorithmState('finding');
        await new Promise(r => setTimeout(r, 1500));

        try {
            // Phase 3: Backend returns
            const result = await recommendSeats(showId, groupSize);
            const recSeatIds = result.recommendedSeats.map(s => s.SeatID);
            
            setRecommendedSeats(new Set(recSeatIds));
            setSelectedSeats(new Set(recSeatIds));
            
            // Phase 4: Focus and elevate
            setAlgorithmState('done');
        } catch (err) {
            setError(err.message);
            setAlgorithmState('idle');
        }
    };

    const handleBook = async () => {
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
    };

    if (loading) return null;

    const totalPrice = Array.from(selectedSeats).reduce((total, id) => {
        const seat = seats.find(s => s.SeatID === id);
        return total + parseFloat(seat.Price || 0);
    }, 0);

    const selectedSeatNames = Array.from(selectedSeats).map(id => seats.find(s => s.SeatID === id)?.SeatNumber).sort().join(' · ');

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ 
                width: '100vw', 
                height: '100vh', 
                display: 'flex', 
                overflow: 'hidden',
                backgroundColor: 'var(--c-bg-main)'
            }}
        >
            {/* Top Navigation Overlay */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                display: 'flex',
                height: '80px',
                zIndex: 50,
                pointerEvents: 'none' // Let clicks pass through except on nav items
            }}>
                {/* Left side (72%) Nav */}
                <div style={{ width: '72%', padding: '0 4rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.75rem', 
                            color: 'var(--c-text-primary)', pointerEvents: 'auto'
                        }}
                    >
                        <ArrowLeft size={20} /> 
                        <span className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 600 }}>CineTicket</span>
                    </button>
                </div>
                {/* Right side (28%) Nav */}
                <div style={{ width: '28%', padding: '0 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '2rem', pointerEvents: 'auto' }}>
                        <span className="font-sans" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', color: 'var(--c-text-primary)' }}>MOVIES</span>
                        <span className="font-sans" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', color: 'var(--c-text-primary)' }}>MY BOOKINGS</span>
                    </div>
                    <span className="font-sans" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--c-gold)' }} /> DBMS LAB
                    </span>
                </div>
            </div>

            {/* Left: 72% 3D Theatre Viewport */}
            <div style={{ width: '72%', position: 'relative', backgroundColor: 'var(--c-bg-main)' }}>
                <Canvas dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
                    <color attach="background" args={['#F7F4EC']} />
                    <fog attach="fog" args={['#F7F4EC', 12, 35]} />
                    <TheatreScene 
                        seats={seats} 
                        selectedSeats={selectedSeats}
                        recommendedSeats={recommendedSeats}
                        onSeatClick={handleSeatClick}
                        algorithmState={algorithmState}
                    />
                </Canvas>
                
                {/* Visualizer Status Overlay */}
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
                                bottom: '4rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                pointerEvents: 'none'
                            }}
                        >
                            <span className="font-sans" style={{ 
                                fontSize: '1rem', 
                                letterSpacing: '0.2em', 
                                textTransform: 'uppercase',
                                color: algorithmState === 'done' ? 'var(--c-gold)' : 'var(--c-text-primary)', 
                                marginBottom: '0.5rem',
                                fontWeight: 600
                            }}>
                                {algorithmState === 'analyzing' && 'ANALYZING SEATING...'}
                                {algorithmState === 'finding' && 'LOCATING OPTIMAL BLOCK...'}
                                {algorithmState === 'done' && 'RECOMMENDED POSITION'}
                            </span>
                            {algorithmState === 'done' && (
                                <span className="font-serif" style={{ fontSize: '2rem', color: 'var(--c-text-primary)' }}>
                                    {selectedSeatNames}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: '1px', backgroundColor: 'rgba(176,138,62,0.15)', height: '100%', zIndex: 20 }} />

            {/* Right: 28% Booking Summary Ticket & Panel */}
            <div style={{ 
                width: '28%', 
                backgroundColor: 'var(--c-bg-main)', 
                padding: '8rem 3rem 4rem 3rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                zIndex: 20,
                position: 'relative'
            }}>
                {/* Subtle Cinematic Background Motifs */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

                {error && (
                    <div className="font-mono" style={{ color: '#5D111A', fontSize: '0.75rem', marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--c-burgundy)', backgroundColor: 'rgba(124, 31, 42, 0.05)' }}>
                        {error}
                    </div>
                )}
                
                <div style={{ marginBottom: '4rem', zIndex: 2 }}>
                    <h3 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--c-text-primary)' }}>
                        SEAT SELECTION
                    </h3>
                    
                    <label className="font-sans" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--c-text-muted)', letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        Group Size
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input 
                            type="number" 
                            min="1" max="10" 
                            value={groupSize} 
                            onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                            className="font-sans"
                            style={{ 
                                width: '80px', 
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(23, 22, 21, 0.1)',
                                color: 'var(--c-text-primary)',
                                textAlign: 'center',
                                padding: '0.75rem',
                                fontSize: '1.25rem',
                                outline: 'none'
                            }}
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
                                letterSpacing: '0.15em',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                opacity: (algorithmState === 'analyzing' || algorithmState === 'finding') ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (algorithmState === 'analyzing' || algorithmState === 'finding') return;
                                e.currentTarget.style.backgroundColor = 'var(--c-surface)';
                                e.currentTarget.style.borderColor = 'var(--c-gold-light)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'var(--c-gold)';
                            }}
                        >
                            Find Best Seats
                        </button>
                    </div>
                </div>

                {/* Physical Ticket Stub Summary */}
                <div style={{
                    backgroundColor: 'var(--c-surface)', // Crisp white
                    color: 'var(--c-text-primary)',
                    padding: '2.5rem',
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    zIndex: 2,
                    border: '1px solid rgba(176,138,62,0.1)'
                }}>
                    <div style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)', marginBottom: '2rem', paddingBottom: '1.5rem' }}>
                        <div className="font-sans" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-muted)', marginBottom: '0.75rem' }}>
                            SELECTED SEATS
                        </div>
                        <div className="font-serif" style={{ fontSize: '2.2rem', minHeight: '3rem', color: 'var(--c-burgundy)' }}>
                            {selectedSeats.size > 0 ? selectedSeatNames : '---'}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                        <div className="font-sans" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-muted)' }}>
                            TOTAL
                        </div>
                        <div className="font-sans" style={{ fontSize: '2.2rem', lineHeight: 1, fontWeight: 700, color: 'var(--c-text-primary)' }}>
                            ₹{totalPrice}
                        </div>
                    </div>

                    <button 
                        onClick={handleBook}
                        disabled={booking || selectedSeats.size === 0}
                        style={{
                            width: '100%',
                            backgroundColor: selectedSeats.size > 0 ? 'var(--c-burgundy)' : '#D3CCC1',
                            color: selectedSeats.size > 0 ? 'var(--c-surface)' : '#8A857D',
                            padding: '1.25rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedSeats.size > 0 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s',
                            boxShadow: selectedSeats.size > 0 ? '0 10px 20px rgba(124, 31, 42, 0.15)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedSeats.size > 0 && !booking) {
                                e.currentTarget.style.backgroundColor = '#5D111A';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedSeats.size > 0 && !booking) {
                                e.currentTarget.style.backgroundColor = 'var(--c-burgundy)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <Ticket size={16} />
                        {booking ? 'PROCESSING...' : 'CONFIRM BOOKING'}
                    </button>
                    
                    {/* Ticket Perforations (Cutouts) */}
                    <div style={{ position: 'absolute', top: '45%', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--c-bg-main)', borderRight: '1px solid rgba(176,138,62,0.1)' }} />
                    <div style={{ position: 'absolute', top: '45%', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--c-bg-main)', borderLeft: '1px solid rgba(176,138,62,0.1)' }} />
                </div>
            </div>
        </motion.div>
    );
}
