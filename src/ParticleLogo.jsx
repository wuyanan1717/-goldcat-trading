import React, { useEffect, useRef, useState } from 'react';

const ParticleLogo = () => {
    const canvasRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                setDimensions({
                    width: parent.clientWidth,
                    height: parent.clientHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (dimensions.width === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        let particles = [];
        const mouse = { x: null, y: null, radius: 100 };

        // Load Image
        const image = new Image();
        image.src = '/goldcat_logo_transparent.png';
        image.crossOrigin = 'Anonymous';

        image.onload = () => {
            // Draw image to offscreen canvas to get data
            const offscreenCanvas = document.createElement('canvas');
            const offCtx = offscreenCanvas.getContext('2d');

            // Scale image to fit nicely
            const scale = Math.min(canvas.width / image.width, canvas.height / image.height) * 0.6; // 60% of container
            const imgW = image.width * scale;
            const imgH = image.height * scale;

            offscreenCanvas.width = canvas.width;
            offscreenCanvas.height = canvas.height;

            const startX = (canvas.width - imgW) / 2;
            const startY = (canvas.height - imgH) / 2;

            offCtx.drawImage(image, startX, startY, imgW, imgH);

            const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Create particles
            // Skip pixels for performance (density)
            const density = 4;

            for (let y = 0; y < canvas.height; y += density) {
                for (let x = 0; x < canvas.width; x += density) {
                    const index = (y * canvas.width + x) * 4;
                    const alpha = data[index + 3];

                    if (alpha > 128) {
                        const red = data[index];
                        const green = data[index + 1];
                        const blue = data[index + 2];
                        const color = `rgb(${red}, ${green}, ${blue})`;
                        const rgb = { r: red, g: green, b: blue };

                        particles.push(new Particle(x, y, color, rgb));
                    }
                }
            }
            setIsLoaded(true);
            animate();
        };

        class Particle {
            constructor(x, y, color, rgb) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.originX = x;
                this.originY = y;
                this.color = color;
                this.rgb = rgb; // Store {r,g,b} for alpha manipulation
                this.size = Math.random() * 1.2 + 0.3; // Smaller: 0.3px - 1.5px
                this.vx = 0;
                this.vy = 0;
                this.friction = 0.90; // More friction = slower stop
                this.ease = 0.03; // Slower return
                this.alpha = Math.random();
                this.alphaSpeed = Math.random() * 0.005 + 0.002; // Slow blink
                this.alphaDir = 1;
            }

            draw() {
                // Twinkle effect
                this.alpha += this.alphaSpeed * this.alphaDir;
                if (this.alpha > 1) {
                    this.alpha = 1;
                    this.alphaDir = -1;
                } else if (this.alpha < 0.6) {
                    this.alpha = 0.6;
                    this.alphaDir = 1;
                }

                ctx.fillStyle = `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                // Mouse interaction
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = mouse.radius;
                const force = (maxDistance - distance) / maxDistance;
                const directionX = forceDirectionX * force * 2; // Reduced push force
                const directionY = forceDirectionY * force * 2;

                if (distance < mouse.radius) {
                    this.vx -= directionX;
                    this.vy -= directionY;
                } else {
                    if (this.x !== this.originX) {
                        const dx = this.x - this.originX;
                        this.vx -= dx * this.ease;
                    }
                    if (this.y !== this.originY) {
                        const dy = this.y - this.originY;
                        this.vy -= dy * this.ease;
                    }
                }

                this.x += this.vx;
                this.y += this.vy;
                this.vx *= this.friction;
                this.vy *= this.friction;

                this.draw();
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'screen'; // Brighter blending
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            requestAnimationFrame(animate);
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        }

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [dimensions]);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};

export default ParticleLogo;
