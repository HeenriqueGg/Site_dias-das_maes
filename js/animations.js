// ============================================================
// animations.js — Animações visuais do site
// Partículas, parallax, fade-in ao scroll,
// glow effects, brilhos e transições cinematográficas
// ============================================================

/* ========== CANVAS DE PARTÍCULAS DOURADAS ========== */
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    let particles = [];
    const maxParticles = 80;
    const particleColors = [
        'rgba(201, 169, 110, 0.5)',   // dourado
        'rgba(212, 184, 122, 0.4)',   // dourado claro
        'rgba(232, 213, 176, 0.35)',  // dourado suave
        'rgba(255, 255, 255, 0.2)',   // branco translúcido
    ];

    class Particle {
        constructor() {
            this.reset();
            // Posição inicial aleatória para distribuição imediata
            this.y = Math.random() * height;
        }
        reset() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 100;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedY = -(Math.random() * 0.6 + 0.2);
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = (Math.random() - 0.5) * 0.015;
            this.wobbleAmplitude = Math.random() * 0.8;
        }
        update() {
            this.wobble += this.wobbleSpeed;
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.wobble) * this.wobbleAmplitude;
            this.opacity += (Math.random() - 0.5) * 0.008;
            this.opacity = Math.max(0.08, Math.min(0.7, this.opacity));

            // Reposiciona se sair da tela
            if (this.y < -20 || this.x < -20 || this.x > width + 20) {
                this.reset();
                this.y = height + Math.random() * 40;
            }
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Brilho radial suave
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fill();
            // Núcleo brilhante
            ctx.fillStyle = this.color.replace('0.5', '0.9').replace('0.4', '0.8').replace('0.35', '0.7').replace('0.2', '0.5');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });
        requestAnimationFrame(animate);
    }

    // Inicialização
    resizeCanvas();
    createParticles();
    animate();

    // Redimensionamento responsivo
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            createParticles();
        }, 300);
    });
})();

/* ========== FADE-IN AO SCROLL (Intersection Observer) ========== */
(function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');

    if (animatedElements.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.12
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.getAttribute('data-delay') || 0;

                // Aplica delay se especificado
                if (delay) {
                    setTimeout(() => {
                        el.classList.add('is-visible');
                    }, parseInt(delay));
                } else {
                    el.classList.add('is-visible');
                }

                // Para de observar após animar (one-time animation)
                observer.unobserve(el);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));

    // Função pública para re-verificar (útil após popular dinamicamente)
    window.triggerScrollCheck = function() {
        const newElements = document.querySelectorAll('[data-animate]:not(.is-visible)');
        newElements.forEach(el => observer.observe(el));
    };
})();

/* ========== PARALLAX SUAVE NO HERO ========== */
(function initParallax() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroHeight = heroSection.offsetHeight;

                if (scrollY < heroHeight) {
                    // Efeito parallax sutil no conteúdo da hero
                    const heroContent = heroSection.querySelector('.hero-content');
                    const heroOverlay = heroSection.querySelector('.hero-overlay');

                    if (heroContent) {
                        const translateY = scrollY * 0.25;
                        const opacity = 1 - (scrollY / heroHeight) * 0.8;
                        heroContent.style.transform = `translateY(${translateY}px)`;
                        heroContent.style.opacity = Math.max(0, opacity);
                    }
                    if (heroOverlay) {
                        heroOverlay.style.opacity = 1 + (scrollY / heroHeight) * 0.5;
                    }
                }

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();

/* ========== EFEITO DE BRILHO NOS CARDS AO PASSAR O MOUSE ========== */
(function initGlowEffect() {
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.emotional-card, .gallery-item');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Verifica se o mouse está próximo ao card
            const isNearX = x > -30 && x < rect.width + 30;
            const isNearY = y > -30 && y < rect.height + 30;

            if (isNearX && isNearY) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;

                // Brilho sutil que segue o mouse
                const glowIntensity = Math.max(0, 1 - Math.abs(deltaX) - Math.abs(deltaY) * 0.7);
                const glowColor = `rgba(201, 169, 110, ${glowIntensity * 0.15})`;
                card.style.boxShadow = `0 4px 24px ${glowColor}, 0 8px 32px rgba(0,0,0,0.1)`;
            } else {
                card.style.boxShadow = '';
            }
        });
    }, { passive: true });
})();

/* ========== EFEITO DE BRILHO NOS TÍTULOS PRINCIPAIS ========== */
(function initTitleGlow() {
    const titles = document.querySelectorAll('.section-title, .hero-title-line--gold, .closing-title');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.textShadow = '0 0 40px rgba(201, 169, 110, 0.3), 0 0 80px rgba(201, 169, 110, 0.1)';
            }
        });
    }, { threshold: 0.5 });

    titles.forEach(title => observer.observe(title));
})();

/* ========== SCROLL INDICATOR (esconde após scroll) ========== */
(function initScrollIndicator() {
    const indicator = document.querySelector('.hero-scroll-indicator');
    if (!indicator) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.6s ease';
        } else {
            indicator.style.opacity = '1';
        }
    }, { passive: true });
})();

/* ========== TIMELINE ITEMS — Animação ao scroll ========== */
(function initTimelineObserver() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('timeline-item--visible');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.2 });

    timelineItems.forEach(item => observer.observe(item));

    // Re-observar novos itens (útil após população dinâmica)
    const origTrigger = window.triggerScrollCheck;
    window.triggerScrollCheck = function() {
        if (origTrigger) origTrigger();
        document.querySelectorAll('.timeline-item:not(.timeline-item--visible)').forEach(item => {
            observer.observe(item);
        });
    };
})();

/* ========== EFEITO DE TRANSIÇÃO CINEMATOGRÁFICA NA CARTA ========== */
(function initLetterReveal() {
    const letterPaper = document.getElementById('letter-paper');
    if (!letterPaper) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                letterPaper.style.transform = 'rotateY(0deg) rotateX(0deg)';
                letterPaper.style.transition = 'transform 1.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
                observer.unobserve(letterPaper);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(letterPaper);
})();

/* ========== LOG NO CONSOLE (Easter egg emocional) ========== */
console.log(`
    🌸  Este site foi feito com amor verdadeiro.
        Para aquela que foi abrigo, cuidado e família.
        Feliz Dia das Mães.  🌸
`);