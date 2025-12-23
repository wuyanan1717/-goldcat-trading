import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';

const HolographicPlanet = () => {
    const planetRef = useRef();

    // Rotate planet slowly
    useFrame((state, delta) => {
        if (planetRef.current) {
            planetRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group>
            {/* Core Planet - Dark Glassy Sphere */}
            <mesh ref={planetRef}>
                <sphereGeometry args={[4, 64, 64]} />
                <meshPhysicalMaterial
                    color="#000020" // Dark Blue-Black
                    roughness={0.2}
                    metalness={0.8}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    emissive="#001133"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Atmosphere Glow (Fake via slightly larger back-side mesh) */}
            <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[4, 32, 32]} />
                <meshBasicMaterial color="#0044aa" transparent opacity={0.1} side={THREE.BackSide} />
            </mesh>

            {/* Orbiting K-Line Rings */}
            <OrbitingCandles radius={5.5} count={40} speed={0.2} colorUp="#f59e0b" colorDown="#ef4444" tilt={[0.5, 0, 0]} />
            <OrbitingCandles radius={7} count={50} speed={0.15} colorUp="#10b981" colorDown="#3b82f6" tilt={[0, 0, 0.5]} />
            <OrbitingCandles radius={8.5} count={30} speed={0.1} colorUp="#8b5cf6" colorDown="#ec4899" tilt={[0.3, 0.3, 0]} />
        </group>
    );
};

const OrbitingCandles = ({ radius, count, speed, colorUp, colorDown, tilt }) => {
    const groupRef = useRef();

    const candles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            // Random variation in candle height
            const height = Math.random() * 1.5 + 0.2;
            const isUp = Math.random() > 0.5;
            temp.push({ angle, height, isUp });
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * speed;
        }
    });

    return (
        <group ref={groupRef} rotation={tilt}>
            {candles.map((c, i) => (
                <group key={i} position={[Math.cos(c.angle) * radius, 0, Math.sin(c.angle) * radius]} rotation={[0, -c.angle, 0]}>
                    {/* The Candle Body */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[0.2, c.height, 0.2]} />
                        <meshStandardMaterial
                            color={c.isUp ? colorUp : colorDown}
                            emissive={c.isUp ? colorUp : colorDown}
                            emissiveIntensity={0.8}
                            toneMapped={false}
                        />
                    </mesh>
                    {/* The Wick (Lines) */}
                    <mesh position={[0, c.height / 2 + 0.2, 0]}>
                        <boxGeometry args={[0.05, 0.4, 0.05]} />
                        <meshBasicMaterial color={c.isUp ? colorUp : colorDown} />
                    </mesh>
                    <mesh position={[0, -c.height / 2 - 0.2, 0]}>
                        <boxGeometry args={[0.05, 0.4, 0.05]} />
                        <meshBasicMaterial color={c.isUp ? colorUp : colorDown} />
                    </mesh>
                </group>
            ))}
            {/* Orbital Ring Guide Line */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
                <meshBasicMaterial color="#ffffff" opacity={0.1} transparent side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}


const Constellation3D = () => {
    return (
        <div className="absolute inset-0 z-0 bg-black">
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none z-10 opacity-60"></div>

            <Canvas camera={{ position: [0, 0, 18], fov: 40 }}>
                {/* Cinematic Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[15, 15, 15]} intensity={1} color="#ffffff" />
                <pointLight position={[-15, -10, -10]} intensity={1} color="#0044aa" />

                {/* Starfield */}
                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

                {/* Floating Animation */}
                <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
                    <HolographicPlanet />
                </Float>
            </Canvas>
        </div>
    );
};

export default Constellation3D;
