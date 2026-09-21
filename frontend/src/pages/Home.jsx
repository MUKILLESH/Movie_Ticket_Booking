import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, SpotLight, Float } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchMovies } from '../services/api';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_POSTERS = [
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80'
];

function getPosterUrl(movie) {
    if (movie.PosterURL && !movie.PosterURL.includes('source.unsplash.com')) {
        return movie.PosterURL;
    }
    const idx = (movie.Title || '').length % FALLBACK_POSTERS.length;
    return FALLBACK_POSTERS[idx];
}

// --- Minimalist Luxury 3D Film Reel ---
function FilmReel({ position = [0, 0, 0] }) {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    const brassMaterial = new THREE.MeshStandardMaterial({
        color: '#B08A3E',
        roughness: 0.3,
        metalness: 0.8
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: '#171717',
        roughness: 0.8,
        metalness: 0.2
    });

    return (
        <group position={position} ref={groupRef}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <group rotation={[Math.PI / 6, Math.PI / 4, 0]}>
                    {/* Top Plate */}
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[2, 2, 0.05, 32]} />
                        <meshStandardMaterial {...brassMaterial} />
                    </mesh>

                    {/* Film Core (Dark) */}
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 0.4, 32]} />
                        <meshStandardMaterial {...darkMaterial} />
                    </mesh>

                    {/* Bottom Plate */}
                    <mesh position={[0, -0.2, 0]}>
                        <cylinderGeometry args={[2, 2, 0.05, 32]} />
                        <meshStandardMaterial {...brassMaterial} />
                    </mesh>

                    {/* Cutouts to make it look like a reel (simplified via 3 smaller cylinders) */}
                    {/* Note: In a real app we'd use CSG or a custom model, this is an elegant approximation */}
                </group>
            </Float>
        </group>
    );
}

function HeroScene() {
    const { camera } = useThree();

    useEffect(() => {
        camera.position.set(0, 0, 8);
    }, [camera]);

    useFrame((state) => {
        // Subtle mouse parallax
        const targetX = (state.pointer.x * Math.PI) / 60;
        const targetY = (state.pointer.y * Math.PI) / 60;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX * 5, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY * 5, 0.05);
        camera.lookAt(0, 0, 0);
    });

    return (
        <group>
            {/* Elegant lighting */}
            <ambientLight intensity={0.8} color="#FFFFFF" />
            <SpotLight
                position={[5, 10, 5]}
                angle={0.5}
                penumbra={1}
                intensity={1.5}
                color="#FFFFFF"
                castShadow
            />
            <pointLight position={[-5, 5, -5]} intensity={1} color="#B08A3E" />

            <FilmReel position={[3, 0, 0]} />
        </group>
    );
}

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const railRef = useRef(null);
    const [railProgress, setRailProgress] = useState(0);

    useEffect(() => {
        fetchMovies()
            .then(data => {
                setMovies(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleRailScroll = () => {
        if (railRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
            const maxScroll = scrollWidth - clientWidth;
            if (maxScroll > 0) {
                setRailProgress(scrollLeft / maxScroll);
            }
        }
    };

    useEffect(() => {
        if (railRef.current) {
            railRef.current.addEventListener('scroll', handleRailScroll);
        }
        return () => {
            if (railRef.current) railRef.current.removeEventListener('scroll', handleRailScroll);
        }
    }, [loading]);

    if (loading) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, backgroundColor: 'var(--c-bg-main)' }}
            transition={{ duration: 0.8 }}
            style={{ paddingBottom: '8rem', backgroundColor: 'var(--c-bg-main)' }}
        >
            {/* Hero Section */}
            <section style={{ position: 'relative', height: '100vh', width: '100%', display: 'flex', paddingTop: '80px' }}>

                {/* 3D Background Layer */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none' }}>
                    <Canvas dpr={[1, 2]}>
                        <PerspectiveCamera makeDefault />
                        <HeroScene />
                    </Canvas>
                </div>

                <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
                    {/* Left: Editorial Content */}
                    <div style={{ width: '50%', padding: '4rem 0 4rem 4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h1 className="font-serif" style={{
                            fontSize: 'clamp(4rem, 6vw, 7rem)',
                            color: 'var(--c-text-primary)',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            marginBottom: '2rem'
                        }}>
                            NOVELTY<br />CINEMA EXPERIENCE.
                        </h1>

                        <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--c-gold)', marginBottom: '2rem' }} />

                        <p className="font-sans" style={{
                            color: 'var(--c-text-secondary)',
                            fontSize: '1rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            marginBottom: '4rem',
                            fontWeight: 500
                        }}>
                            Labs Project<br />Database Management
                        </p>

                        <div>
                            <button
                                onClick={() => document.getElementById('now-showing').scrollIntoView({ behavior: 'smooth' })}
                                style={{
                                    padding: '1.25rem 3rem',
                                    backgroundColor: 'var(--c-surface)',
                                    color: 'var(--c-text-primary)',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.15em',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    border: '1px solid var(--c-gold)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.02)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.backgroundColor = 'var(--c-gold)';
                                    e.currentTarget.style.color = 'var(--c-surface)';
                                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(176,138,62,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.backgroundColor = 'var(--c-surface)';
                                    e.currentTarget.style.color = 'var(--c-text-primary)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.02)';
                                }}
                            >
                                EXPLORE SHOWTIMES
                            </button>
                        </div>
                    </div>

                    {/* Right: Premium Imagery */}
                    <div style={{ width: '50%', padding: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%',
                            aspectRatio: '3/4',
                            position: 'relative',
                            borderRadius: '16px',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05)',
                            backgroundColor: 'var(--c-surface)',
                            padding: '1rem',
                            border: '1px solid rgba(176,138,62,0.1)'
                        }}>
                            <img
                                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&q=80"
                                alt="Cinema Interior"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                            />
                            {/* Inner gold frame */}
                            <div style={{ position: 'absolute', inset: '2rem', border: '1px solid rgba(176,138,62,0.4)', pointerEvents: 'none', borderRadius: '4px' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Movies Rail */}
            <section id="now-showing" style={{ padding: '6rem 0 4rem 0', position: 'relative', zIndex: 20, maxWidth: '1440px', margin: '0 auto' }}>
                <div style={{ padding: '0 4rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <h2 className="font-serif" style={{ fontSize: '2.5rem', color: 'var(--c-text-primary)', margin: 0 }}>
                        NOW SHOWING
                    </h2>

                    {/* Progress Indicator */}
                    <div style={{ width: '200px', height: '1px', backgroundColor: 'rgba(23,23,23,0.1)', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, height: '100%', width: '100%',
                            backgroundColor: 'var(--c-gold)',
                            transformOrigin: 'left',
                            transform: `scaleX(${railProgress})`,
                            transition: 'transform 0.1s linear'
                        }} />
                    </div>
                </div>

                <div
                    ref={railRef}
                    className="hide-scrollbar"
                    style={{
                        display: 'flex',
                        gap: '2.5rem',
                        overflowX: 'auto',
                        paddingBottom: '4rem',
                        paddingTop: '2rem',
                        paddingLeft: '4rem',
                        paddingRight: '4rem',
                        scrollSnapType: 'x mandatory'
                    }}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .hide-scrollbar::-webkit-scrollbar { display: none; }
                        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}} />

                    {movies.map((movie, i) => (
                        <motion.div
                            key={movie.MovieID}
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "0px 100px 0px 0px" }}
                            transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                minWidth: '320px',
                                width: '320px',
                                cursor: 'pointer',
                                scrollSnapAlign: 'start',
                                position: 'relative'
                            }}
                            onClick={() => navigate(`/movies/${movie.MovieID}`)}
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;

                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;

                                const rotateX = ((y - centerY) / centerY) * -5;
                                const rotateY = ((x - centerX) / centerX) * 5;

                                const imgWrapper = e.currentTarget.querySelector('.poster-wrapper');
                                imgWrapper.style.transition = 'none';
                                imgWrapper.style.transform = `perspective(1000px) translateZ(20px) scale(1.04) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

                                const shadowX = ((x - centerX) / centerX) * -10;
                                const shadowY = ((y - centerY) / centerY) * -10;
                                imgWrapper.style.boxShadow = `${shadowX}px ${shadowY + 30}px 50px rgba(0,0,0,0.15)`;
                            }}
                            onMouseEnter={(e) => {
                                const imgWrapper = e.currentTarget.querySelector('.poster-wrapper');
                                const goldBorder = e.currentTarget.querySelector('.gold-border');
                                const meta = e.currentTarget.querySelector('.poster-meta');

                                imgWrapper.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                                goldBorder.style.opacity = '1';
                                meta.style.transform = 'translateY(-5px)';
                            }}
                            onMouseLeave={(e) => {
                                const imgWrapper = e.currentTarget.querySelector('.poster-wrapper');
                                const goldBorder = e.currentTarget.querySelector('.gold-border');
                                const meta = e.currentTarget.querySelector('.poster-meta');

                                imgWrapper.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                                imgWrapper.style.transform = 'perspective(1000px) translateZ(0) scale(1) rotateX(0) rotateY(0)';
                                imgWrapper.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';

                                goldBorder.style.opacity = '0';
                                meta.style.transform = 'translateY(0)';
                            }}
                        >
                            <div
                                className="poster-wrapper"
                                style={{
                                    width: '100%',
                                    aspectRatio: '2/3',
                                    backgroundColor: 'var(--c-surface)',
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                    position: 'relative',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    border: '1px solid rgba(176,138,62,0.15)',
                                    transformStyle: 'preserve-3d',
                                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <img
                                    src={getPosterUrl(movie)}
                                    alt={movie.Title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                />

                                <div
                                    className="gold-border"
                                    style={{
                                        position: 'absolute',
                                        inset: '0.5rem',
                                        border: '2px solid var(--c-gold)',
                                        opacity: 0,
                                        transition: 'opacity 0.4s',
                                        borderRadius: '4px',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>

                            <div
                                className="poster-meta"
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--c-gold)', marginTop: '0.3rem' }}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--c-text-primary)', lineHeight: 1.2 }}>
                                        {movie.Title}
                                    </h3>
                                    <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        {movie.Genre} · {movie.Language} · {movie.Duration}M
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <div style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="font-sans" style={{ color: 'var(--c-text-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            END OF LIST
                        </span>
                    </div>
                </div>
            </section>
        </motion.div>
    );
}
