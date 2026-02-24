/* ============================================
   PORTFOLIO - JAVASCRIPT ENGINE
   Smooth Scrolling, Animations & Interactions
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    animationDuration: 800,
    scrollThreshold: 0.1,
    easingFunctions: {
        easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
    }
};

// ============================================
// QUOTE CAROUSEL
// ============================================

function initQuoteCarousel() {
    const carousel = document.querySelector('.quote-carousel-container');
    const cards = document.querySelectorAll('.quote-card');
    const dots = document.querySelectorAll('.quote-dot');

    if (!carousel || cards.length === 0) return;

    let currentIndex = 0;
    let autoplayInterval = null;
    let isTransitioning = false;

    function goToSlide(index) {
        if (isTransitioning || index === currentIndex) return;
        isTransitioning = true;

        // Set previous state for animation on current card
        cards[currentIndex].classList.remove('active');
        cards[currentIndex].classList.add('prev');

        // Remove active from dots
        dots.forEach(dot => dot.classList.remove('active'));

        // Update current index
        currentIndex = index;

        // Add active class to new slide after previous animation starts
        requestAnimationFrame(() => {
            cards[currentIndex].classList.remove('prev');
            cards[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');

            // Allow new transitions after animation completes
            setTimeout(() => {
                isTransitioning = false;
            }, 800);
        });

        // Reset autoplay
        resetAutoplay();
    }

    function nextSlide() {
        goToSlide((currentIndex + 1) % cards.length);
    }

    function prevSlide() {
        goToSlide((currentIndex - 1 + cards.length) % cards.length);
    }

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 9000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Scroll wheel navigation
    let scrollTimeout;
    carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        clearTimeout(scrollTimeout);

        if (e.deltaY > 0) {
            nextSlide();
        } else if (e.deltaY < 0) {
            prevSlide();
        }

        scrollTimeout = setTimeout(() => {
            // Allow scroll after a delay
        }, 800);
    }, { passive: false });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const carousel = document.querySelector('.about-quote-carousel');
        if (!carousel) return;

        const rect = carousel.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isInView) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                prevSlide();
            }
        }
    });

    // Start autoplay
    startAutoplay();

    // Pause autoplay on hover
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoplayInterval);
    });

    carousel.addEventListener('mouseleave', () => {
        startAutoplay();
    });
}


// ============================================
// IMAGE TILT EFFECT
// ============================================

function setupImageTiltEffect() {
    const photoFrame = document.querySelector('.about-photo');

    if (!photoFrame) return;

    let isHovering = false;

    photoFrame.addEventListener('mouseenter', () => {
        isHovering = true;
    });

    photoFrame.addEventListener('mouseleave', () => {
        isHovering = false;
        // Reset tilt
        photoFrame.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });

    photoFrame.addEventListener('mousemove', (e) => {
        if (!isHovering) return;

        const rect = photoFrame.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation angles (inverted)
        const invert = -1;
        const rotateY = invert * ((x - centerX) / centerX) * 15; // Max 15 degrees
        const rotateX = invert * ((y - centerY) / centerY) * 15; // Max 15 degrees

        photoFrame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
}


// ============================================
// HERO SCROLL-SYNCED FRAME ANIMATION (Apple-style)
// ============================================

function initHeroFrameAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    // Disabled on mobile devices for performance
    if (window.innerWidth <= 768) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const TOTAL_FRAMES = 232;
    const FRAME_PATH = 'Assets/Scroll-frame/ezgif-frame-';
    const bitmaps = new Array(TOTAL_FRAMES); // GPU-ready ImageBitmaps
    let currentFrame = 0;
    let targetFrame = 0;
    let rafId = null;
    let imagesReady = false;
    let lastDrawnIndex = -1;

    // Cached cover-fit dimensions (recalculated on resize)
    let coverX = 0, coverY = 0, coverW = 0, coverH = 0;

    // --- Canvas sizing (quality-optimized) ---
    function resizeCanvas() {
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        canvas.width = cssW;
        canvas.height = cssH;
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Pre-calculate cover-fit dimensions (all frames are same size)
        if (bitmaps[0]) {
            const iw = bitmaps[0].width;
            const ih = bitmaps[0].height;
            const scale = Math.max(cssW / iw, cssH / ih);
            coverW = iw * scale;
            coverH = ih * scale;
            coverX = (cssW - coverW) / 2;
            coverY = (cssH - coverH) / 2;
        }

        lastDrawnIndex = -1; // force redraw
        drawFrame(Math.round(currentFrame));
    }

    // --- Draw a frame on canvas (ultra-fast with ImageBitmap) ---
    function drawFrame(index) {
        if (index === lastDrawnIndex) return;
        const bmp = bitmaps[index];
        if (!bmp) return;

        ctx.drawImage(bmp, coverX, coverY, coverW, coverH);
        lastDrawnIndex = index;
    }

    // --- Preload & pre-decode all frames into ImageBitmaps ---
    function preloadFrames() {
        let loadedCount = 0;

        // Load in batches to avoid overwhelming the browser memory
        // Reduced batch size and increased delay for low-end device stability
        const BATCH_SIZE = 5;
        let nextToLoad = 0;

        function loadBatch() {
            const end = Math.min(nextToLoad + BATCH_SIZE, TOTAL_FRAMES);
            for (let i = nextToLoad; i < end; i++) {
                const idx = i;
                const num = String(idx + 1).padStart(3, '0');

                fetch(`${FRAME_PATH}${num}.png`)
                    .then(res => res.blob())
                    .then(blob => createImageBitmap(blob))
                    .then(bmp => {
                        bitmaps[idx] = bmp;
                        loadedCount++;

                        // Draw first frame immediately
                        if (idx === 0) {
                            const iw = bmp.width;
                            const ih = bmp.height;
                            const scale = Math.max(canvas.width / iw, canvas.height / ih);
                            coverW = iw * scale;
                            coverH = ih * scale;
                            coverX = (canvas.width - coverW) / 2;
                            coverY = (canvas.height - coverH) / 2;
                            lastDrawnIndex = -1;
                            drawFrame(0);
                        }

                        if (loadedCount === TOTAL_FRAMES) {
                            imagesReady = true;
                            resizeCanvas();
                        }
                    });
            }
            nextToLoad = end;
            if (nextToLoad < TOTAL_FRAMES) {
                // Increased delay to allow memory garbage collection between chunks
                setTimeout(loadBatch, 150);
            }
        }
        loadBatch();
    }

    // --- Map scroll position to frame index ---
    function getScrollFrame() {
        const spacer = document.getElementById('heroSpacer');
        if (!spacer) return 0;

        const scrollTop = window.scrollY || window.pageYOffset;
        const spacerHeight = spacer.offsetHeight;
        const viewportH = window.innerHeight;
        const fullMaxScroll = spacerHeight - viewportH;

        // Frame animation completes by the 2nd-to-last frame's scroll position,
        // so the about section starts scrolling in during the last ~2 frames.
        // We shorten the effective scroll range to finish frames earlier.
        const transitionRatio = (TOTAL_FRAMES - 2) / (TOTAL_FRAMES - 1);
        const frameMaxScroll = fullMaxScroll * transitionRatio;

        // Frame progress (0-1) — frames finish before full scroll
        const frameProgress = Math.min(Math.max(scrollTop / frameMaxScroll, 0), 1);

        // Overall scroll progress (0-1) — tracks full spacer scroll
        const overallProgress = Math.min(Math.max(scrollTop / fullMaxScroll, 0), 1);

        // Start fading out the hero from the 2nd-to-last frame onward
        // so the about section is revealed underneath
        const hero = document.getElementById('hero');
        if (hero) {
            if (frameProgress >= 1) {
                // Fade hero out as we scroll past the 2nd-to-last frame
                const fadeRange = fullMaxScroll - frameMaxScroll; // scroll distance for fade
                const fadeScroll = scrollTop - frameMaxScroll;
                const fadeOut = Math.min(Math.max(fadeScroll / fadeRange, 0), 1);
                hero.style.opacity = String(1 - fadeOut);
                hero.style.pointerEvents = fadeOut >= 1 ? 'none' : '';
            } else {
                hero.style.opacity = '1';
                hero.style.pointerEvents = '';
            }
        }

        // Fade out hero content in the last 20% of the frame animation
        const heroContent = document.getElementById('heroContent');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (heroContent) {
            if (frameProgress > 0.8) {
                const fadeProgress = (frameProgress - 0.8) / 0.2; // 0 to 1 in last 20%
                heroContent.style.opacity = 1 - fadeProgress;
                heroContent.style.transform = `translateY(${-fadeProgress * 60}px)`;
            } else if (frameProgress > 0) {
                heroContent.style.opacity = 1;
                heroContent.style.transform = 'translateY(0)';
            }
        }
        if (scrollIndicator) {
            scrollIndicator.style.opacity = frameProgress > 0.1 ? '0' : '1';
        }

        return Math.min(Math.floor(frameProgress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
    }

    // --- Smooth interpolation render loop ---
    function renderLoop() {
        const diff = targetFrame - currentFrame;
        if (Math.abs(diff) > 0.3) {
            // During idle: track tightly for smooth video-like playback
            // During scroll: ease smoothly
            // During programmatic full-page jumps: ease VERY smoothly to avoid flashing frames
            let lerpFactor = idleActive ? 0.5 : 0.2;
            if (window.__isProgrammaticStaging) {
                lerpFactor = 0.04; // Extremely slow interpolation to smooth out lightning fast frame updates
            }
            currentFrame += diff * lerpFactor;
        } else {
            currentFrame = targetFrame;
        }

        const frameIndex = Math.round(currentFrame);
        drawFrame(frameIndex);

        rafId = requestAnimationFrame(renderLoop);
    }

    // --- Scroll handler ---
    function onScroll() {
        targetFrame = getScrollFrame();
    }

    // --- Idle ping-pong when not scrolling (auto-play at top) ---
    let idleDirection = 1;
    let idleFrame = 0;
    let idleRaf = null;
    let idleActive = false;
    let scrollTimeout = null;
    let lastIdleTime = 0;

    function startIdleAnimation() {
        if (idleActive) return;
        idleActive = true;
        idleFrame = currentFrame;
        lastIdleTime = performance.now();

        function idleLoop(now) {
            if (!idleActive) return;

            // Delta-time based for consistent speed regardless of refresh rate
            const delta = Math.min((now - lastIdleTime) / 1000, 0.05); // cap to avoid jumps
            lastIdleTime = now;

            // ~24 frames per second for video-like playback
            idleFrame += idleDirection * 24 * delta;

            // Ping-pong within full range
            if (idleFrame >= TOTAL_FRAMES - 1) {
                idleFrame = TOTAL_FRAMES - 1;
                idleDirection = -1;
            } else if (idleFrame <= 0) {
                idleFrame = 0;
                idleDirection = 1;
            }

            targetFrame = idleFrame;
            idleRaf = requestAnimationFrame(idleLoop);
        }
        idleRaf = requestAnimationFrame(idleLoop);
    }

    function stopIdleAnimation() {
        idleActive = false;
        if (idleRaf) {
            cancelAnimationFrame(idleRaf);
            idleRaf = null;
        }
    }

    function handleScrollActivity() {
        stopIdleAnimation();
        clearTimeout(scrollTimeout);
        // Restart idle after 2s of no scroll at any frame position
        scrollTimeout = setTimeout(() => {
            startIdleAnimation();
        }, 2000);
    }

    // --- Initialize ---
    preloadFrames();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', () => {
        onScroll();
        handleScrollActivity();
    }, { passive: true });

    // Start render loop
    renderLoop();

    // Start idle animation initially (user hasn't scrolled yet)
    setTimeout(() => {
        startIdleAnimation();
    }, 500);
}

// ============================================
// TYPEWRITER ANIMATION
// ============================================

function initTypewriter() {
    const words = ['Shubh...', 'Coder...', 'Developer...'];
    const typewriterText = document.getElementById('typewriterText');
    const typewriterCursor = document.getElementById('typewriterCursor');

    if (!typewriterText) return;

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 100; // Speed of typing
    const deletingSpeed = 50; // Speed of deleting
    const wordPause = 2000; // Pause before starting to delete

    function typeWord() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            // Delete characters
            if (charIndex > 0) {
                charIndex--;
                typewriterText.textContent = currentWord.substring(0, charIndex);
                setTimeout(typeWord, deletingSpeed);
            } else {
                // Word fully deleted, move to next word
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(typeWord, 100); // Small delay before typing next word
            }
        } else {
            // Type characters
            if (charIndex < currentWord.length) {
                charIndex++;
                typewriterText.textContent = currentWord.substring(0, charIndex);
                setTimeout(typeWord, typingSpeed);
            } else {
                // Word fully typed, pause then delete
                isDeleting = true;
                setTimeout(typeWord, wordPause);
            }
        }
    }

    // Start the typewriter animation
    setTimeout(typeWord, 500); // Initial delay before starting
}

// ============================================
// HERO PARTICLES ANIMATION
// ============================================

function initHeroParticles() {
    const particlesContainer = document.getElementById('heroParticles');
    if (!particlesContainer) return;

    const particleCount = 25;
    const colors = ['#b52723', '#e09689', '#ff6b5b', '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random properties
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const duration = Math.random() * 4 + 6;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: ${color};
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
            box-shadow: 0 0 ${size * 2}px ${color};
        `;

        particlesContainer.appendChild(particle);
    }
}

// ============================================
// SMOOTH SCROLLING & SCROLL EFFECTS
// ============================================

class SmoothScrollManager {
    constructor() {
        this.scrolling = false;
        this.scrollY = 0;
        this.setupScrollListeners();
    }

    setupScrollListeners() {
        const handler = () => {
            this.scrollY = window.scrollY;
            this.handleScrollAnimations();
            this.updateScrollToTopButton();
        };

        // Use Lenis scroll event if available for frame-perfect sync
        if (lenis) {
            lenis.on('scroll', handler);
        } else {
            window.addEventListener('scroll', handler, { passive: true });
        }
    }

    handleScrollAnimations() {
        // Show/hide bottom navbar only after hero animation completes (past the spacer)
        const bottomNavbar = document.querySelector('.bottom-navbar');
        const heroSpacer = document.getElementById('heroSpacer');
        const showAfter = heroSpacer ? heroSpacer.offsetTop + heroSpacer.offsetHeight - 100 : 300;
        if (this.scrollY > showAfter) {
            bottomNavbar.classList.add('visible');
        } else {
            bottomNavbar.classList.remove('visible');
        }

        // Animate elements on scroll
        const elements = document.querySelectorAll('.fade-in, .section');

        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            const isVisible = elementTop < window.innerHeight && elementBottom > 0;

            if (isVisible && !element.classList.contains('animated')) {
                this.animateElement(element);
                element.classList.add('animated');
            }
        });
    }

    animateElement(element) {
        const delay = element.dataset.delay || 0;
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }

    updateScrollToTopButton() {
        const button = document.querySelector('.scroll-to-top');
        if (!button) return;
        const heroSpacer = document.getElementById('heroSpacer');
        const showAfter = heroSpacer ? heroSpacer.offsetTop + heroSpacer.offsetHeight - 100 : 300;
        if (this.scrollY > showAfter) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    }
}

// ============================================
// INTERSECTION OBSERVER FOR LAZY ANIMATIONS
// ============================================

class AnimationObserver {
    constructor() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateEntry(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        this.observeElements();
    }

    observeElements() {
        const animatableElements = document.querySelectorAll(
            '.about, .skills-showcase, .education, .projects, .certificates, .hobbies, .mega-footer, .stat-card, .project-card, .cert-card, .hobby-card, .timeline-item, .exp-timeline-item'
        );

        animatableElements.forEach(el => {
            this.observer.observe(el);
        });
    }

    animateEntry(element) {
        if (element.classList.contains('is-animated')) return;

        element.classList.add('is-animated');
        element.style.animation = 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }
}

// ============================================
// LENIS SMOOTH SCROLL ENGINE
// Physics-based inertia, 60+ FPS, accessible
// ============================================

/** @type {Lenis|null} */
let lenis = null;

function initLenis() {
    // Respect prefers-reduced-motion — skip Lenis entirely
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof Lenis === 'undefined') {
        // Fallback: native smooth scroll
        document.documentElement.style.scrollBehavior = 'smooth';
        return;
    }

    lenis = new Lenis({
        duration: 1.2,           // scroll duration (seconds)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,      // responsive mobile touch
        infinite: false,
    });

    // RAF loop — drives Lenis at monitor refresh rate
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Expose globally for scrollToTop onclick
    window.__lenis = lenis;
}

// ============================================
// NAVIGATION & SMOOTH SCROLL ANCHOR
// ============================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.bottom-nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            smoothScrollToSection(href);
        });
    });

    // Also handle hero CTA anchors and any other in-page links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        // Skip if already handled by bottom-nav
        if (link.classList.contains('bottom-nav-link')) return;

        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.length > 1) {
                e.preventDefault();
                if (href === '#hero') {
                    scrollToTop();
                } else {
                    smoothScrollToSection(href);
                }
            }
        });
    });
}

window.__isProgrammaticStaging = false;

function triggerStagedScroll(selectorOrY) {
    let targetElement = null;
    let targetY = 0;

    if (typeof selectorOrY === 'string') {
        targetElement = document.querySelector(selectorOrY);
        if (!targetElement) return;
        targetY = targetElement.getBoundingClientRect().top + window.scrollY - 80;
    } else {
        targetY = selectorOrY;
    }

    if (!lenis) {
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
        return;
    }

    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const projectsSection = document.querySelector('#projects');

    if (!projectsSection || !window.__projectsScroll) {
        lenis.scrollTo(selectorOrY === 0 ? 0 : targetElement, {
            duration: 1.5,
            offset: typeof selectorOrY === 'string' ? -80 : 0,
            easing: easeInOutCubic
        });
        if (targetElement) {
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus({ preventScroll: true });
        }
        return;
    }

    const currentY = window.scrollY;
    const projRect = projectsSection.getBoundingClientRect();
    const projTop = projRect.top + window.scrollY;
    const projBottom = projTop + projectsSection.offsetHeight;

    // We consider it "crossing" if current is above/below and target is entirely past it
    const isCrossingDown = currentY < projTop - 100 && targetY > projBottom;
    const isCrossingUp = currentY > projBottom - 10 && targetY < projTop - 50;

    if (isCrossingDown || isCrossingUp) {
        window.__isProgrammaticStaging = true;
        window.__projectsScroll.unlock();

        let toEnd = isCrossingDown;
        let startPos = toEnd ? 0 : window.__projectsScroll.getMaxScroll();

        // 1. Navigate to 'Projects' section exactly
        lenis.scrollTo(projTop, {
            duration: 1.5,
            easing: easeInOutCubic,
            onComplete: () => {
                // 2. Animate the horizontal reel
                window.__projectsScroll.resetFlags(!toEnd, toEnd, false);
                window.__projectsScroll.setPos(startPos);

                window.__projectsScroll.animateTo(toEnd, () => {
                    // 3. Navigate to target
                    window.__projectsScroll.resetFlags(toEnd, !toEnd, toEnd);
                    lenis.scrollTo(targetY, {
                        duration: 1.5,
                        easing: easeInOutCubic,
                        onComplete: () => { window.__isProgrammaticStaging = false; }
                    });
                });
            }
        });
    } else if (window.__projectsScroll && window.__projectsScroll.isLocked()) {
        window.__isProgrammaticStaging = true;
        let toEnd = targetY > projBottom;

        window.__projectsScroll.animateTo(toEnd, () => {
            window.__projectsScroll.unlock();

            // Set flags so that if they scroll back into projects, it behaves cleanly
            if (toEnd) {
                window.__projectsScroll.resetFlags(true, false, true); // Exited bottom
            } else {
                window.__projectsScroll.resetFlags(false, true, false); // Exited top
            }

            lenis.scrollTo(targetY, {
                duration: 1.5,
                easing: easeInOutCubic,
                onComplete: () => { window.__isProgrammaticStaging = false; }
            });
        });
    } else {
        if (typeof selectorOrY === 'string' && selectorOrY === '#projects') {
            if (currentY < projTop) {
                window.__projectsScroll.resetFlags(false, true, false);
                window.__projectsScroll.setPos(0);
            } else if (currentY > projBottom) {
                window.__projectsScroll.resetFlags(true, false, false);
                window.__projectsScroll.setPos(window.__projectsScroll.getMaxScroll());
            }
        }

        lenis.scrollTo(targetY, {
            duration: 1.5,
            easing: easeInOutCubic,
            onComplete: () => { window.__isProgrammaticStaging = false; }
        });
    }

    if (targetElement) {
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
    }
}

function smoothScrollToSection(selector) {
    triggerStagedScroll(selector);
}

function scrollToSection(selector) {
    triggerStagedScroll(selector);
}

function scrollToTop() {
    triggerStagedScroll(0);
}

// ============================================
// PROJECT CARD INTERACTIONS
// ============================================

function setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            // Add interaction feedback
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });

        // Parallax effect on hover
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const rotateX = (y - 0.5) * 5;
            const rotateY = (x - 0.5) * -5;

            card.style.perspective = '1000px';
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0) rotateY(0)';
        });
    });
}

// ============================================
// STAT COUNTER ANIMATION
// ============================================

function setupStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(element => {
        const target = parseInt(element.textContent);
        let current = 0;
        const increment = target / 30; // Animate over ~30 frames

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && current === 0) {
                    const counter = () => {
                        current += increment;
                        if (current < target) {
                            element.textContent = Math.floor(current) + '+';
                            requestAnimationFrame(counter);
                        } else {
                            element.textContent = target + '+';
                        }
                    };
                    counter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(element);
    });
}

// ============================================
// SCROLL INDICATOR EFFECT
// ============================================

function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (!scrollIndicator) return;

    window.addEventListener('scroll', () => {
        const heroHeight = document.querySelector('.hero').offsetHeight;
        const scrolled = window.scrollY / heroHeight;

        if (scrolled > 0.5) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.pointerEvents = 'none';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.pointerEvents = 'auto';
        }
    });

    // Click to scroll down
    scrollIndicator.addEventListener('click', () => {
        smoothScrollToSection('#about');
    });
}

// (Contact form removed — mega-footer replaces it)

// ============================================
// PARALLAX SCROLLING
// ============================================

function setupParallaxEffects() {
    window.addEventListener('scroll', () => {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 0.5;
            const rect = element.getBoundingClientRect();
            const scrolled = window.scrollY + rect.top;

            element.style.transform = `translateY(${(window.scrollY - scrolled) * speed}px)`;
        });
    });
}

// ============================================
// PERFORMANCE: LAZY LOAD IMAGES
// ============================================

function setupLazyLoadImages() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Home key
        if (e.key === 'Home') {
            e.preventDefault();
            scrollToTop();
        }

        // End key
        if (e.key === 'End') {
            e.preventDefault();
            smoothScrollToSection('#mega-footer');
        }
    });
}

// ============================================
// THEME TOGGLE (Optional - for future enhancement)
// ============================================

function setupThemeToggle() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    prefersDark.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }

    mark(name) {
        performance.mark(name);
    }

    measure(name, startMark, endMark) {
        try {
            performance.measure(name, startMark, endMark);
            const measure = performance.getEntriesByName(name)[0];
            this.metrics[name] = measure.duration;
        } catch (e) {
            console.warn('Performance measurement failed:', e);
        }
    }

    log() {
        console.log('Performance Metrics:', this.metrics);
    }
}

const perfMonitor = new PerformanceMonitor();

// ============================================
// SWORD CURSOR CLICK EFFECT
// ============================================

function setupSwordClickEffect() {
    document.addEventListener('click', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = (x - 5) + 'px';
        ripple.style.top = (y - 5) + 'px';
        document.body.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => ripple.remove(), 800);

        // Create single elegant slash effect
        const slash = document.createElement('div');
        slash.className = 'sword-slash';
        slash.textContent = '✧';
        slash.style.left = x + 'px';
        slash.style.top = y + 'px';
        slash.style.color = '#ffffff';
        slash.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)';
        slash.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(slash);

        // Remove slash after animation
        setTimeout(() => slash.remove(), 800);
    });
}


// Play hero entrance animation with GSAP
function playHeroEntranceAnimation() {
    const heroContent = document.getElementById('heroContent');
    if (!heroContent) return;

    // Ensure content is visible (pointer events etc)
    heroContent.classList.add('show');

    // IMPORTANT: Do NOT split gradient text elements (.hey-text, .there-text, .intro-text)
    // into individual char <span>s. CSS background-clip + -webkit-text-fill-color only
    // works on direct text nodes — wrapping in <span>s makes the gradient disappear.
    // Only split the plain-text tagline for the letter-by-letter effect.
    const tagline = document.querySelector('.hero-tagline');
    if (tagline && !tagline.classList.contains('split-done')) {
        const textContent = tagline.textContent;
        tagline.innerHTML = '';
        textContent.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.className = 'char-anim';
            tagline.appendChild(span);
        });
        tagline.classList.add('split-done');
    }

    if (typeof gsap === 'undefined') return;

    // Set initial hidden states explicitly first (prevents flash of content)
    gsap.set('.hey-text', { y: 60, opacity: 0 });
    gsap.set('.there-text', { y: 60, opacity: 0 });
    gsap.set('.hero-intro-line', { y: 50, opacity: 0 });
    gsap.set('.hero-tagline', { opacity: 0 });
    gsap.set('.hero-tagline .char-anim', { y: 18, opacity: 0 });
    gsap.set('.hero-cta', { y: 20, opacity: 0 });
    gsap.set('.hero-social .social-link', { y: 20, opacity: 0 });

    const tl = gsap.timeline();

    // Step 1: "Hey," slides up
    tl.to('.hey-text', {
        y: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'power3.out'
    })
        // Step 2: "there" slides in slightly after
        .to('.there-text', {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out'
        }, '-=0.5')
        // Step 3: "I'm [typewriter]" line
        .to('.hero-intro-line', {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out'
        }, '-=0.45')
        // Step 4: reveal tagline container then char-by-char
        .to('.hero-tagline', { opacity: 1, duration: 0.01 }, '-=0.15')
        .to('.hero-tagline .char-anim', {
            y: 0,
            opacity: 1,
            duration: 0.35,
            stagger: 0.022,
            ease: 'power2.out'
        }, '-=0.1')
        // Step 5: CTA buttons
        .to('.hero-cta', {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.18,
            ease: 'back.out(1.7)'
        }, '-=0.15')
        // Step 6: social icons slide up to match text animation
        .to('.hero-social .social-link', {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.14,
            ease: 'power3.out'
        }, '-=0.35')
        // After entry completes, wire up smooth GSAP hover on each icon
        .call(() => {
            document.querySelectorAll('.hero-social .social-link').forEach(link => {
                link.addEventListener('mouseenter', () => {
                    gsap.to(link, { y: -6, scale: 1.12, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
                });
                link.addEventListener('mouseleave', () => {
                    gsap.to(link, { y: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
                });
            });
        });
}

// Entry overlay: detect arrival from splash and play reveal
function initEntryOverlay() {
    const wrap = document.getElementById('sliceContainerWrap');
    if (!wrap) return;

    const url = new URL(window.location.href);
    const fromSplash = url.searchParams.get('entry') === '1';

    if (fromSplash) {
        // Clean up URL
        history.replaceState({}, document.title, url.pathname + url.hash);

        // Prepare content state and show overlay
        document.body.classList.add('entry-start');

        // Short pause to let everything render, then play sequence
        setTimeout(() => {
            document.body.classList.add('entry-revealed');

            // GSAP Multi-Layer Staggered Slice Wipe Out
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline({
                    onComplete: () => {
                        wrap.remove();
                        document.body.classList.remove('entry-start');
                    }
                });

                // Top Black Layer off to top
                tl.to(".layer-3-slice", {
                    y: "-100%",
                    duration: 1.0,
                    stagger: 0.12,
                    ease: "power3.inOut"
                })
                    // Middle Red Layer off to top
                    .to(".layer-2-slice", {
                        y: "-100%",
                        duration: 1.0,
                        stagger: 0.12,
                        ease: "power3.inOut"
                    }, "-=0.6")
                    // Bottom Black Layer off to top
                    .to(".layer-1-slice", {
                        y: "-100%",
                        duration: 1.2,
                        stagger: 0.15,
                        ease: "power3.inOut",
                        onStart: () => {
                            playHeroEntranceAnimation();
                        }
                    }, "-=0.6");

            } else {
                wrap.remove();
                document.body.classList.remove('entry-start');
            }

        }, 100);
    } else {
        // If not from splash screen, show hero content immediately
        wrap.remove();
        playHeroEntranceAnimation();
    }
}

// ============================================
// SKILLS SECTION - INTERACTIVE CONSTELLATION CANVAS
// ============================================

function initSkillsCanvas() {
    const canvas = document.getElementById('skillsCanvas');
    if (!canvas) return;

    // Disable canvas animation on mobile devices for performance
    if (window.innerWidth <= 768) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let ambientParticles = [];
    let sphereParticles = [];
    let mouse = { x: -9999, y: -9999, radius: 180 };
    let animationId;

    const AMBIENT_COUNT = 50;
    const SPHERE_COUNT = 90;
    const SPHERE_RADIUS = 160;
    const CONNECTION_DISTANCE = 120;
    const MOUSE_CONNECTION_DISTANCE = 200;
    const MOUSE_REPEL_RADIUS = 100;   // how close mouse needs to be to push particles
    const MOUSE_REPEL_FORCE = 2.5;     // how hard particles get pushed
    const RETURN_SPEED = 0.06;        // how fast particles spring back (0-1)
    let frameCount = 0;
    let sortedSphereCache = [];

    // Colors matching the warm red/coral theme
    const COLORS = [
        { r: 181, g: 39, b: 35 },
        { r: 224, g: 150, b: 137 },
        { r: 255, g: 107, b: 91 },
        { r: 255, g: 255, b: 255 },
        { r: 255, g: 180, b: 170 },
    ];

    // ========== AMBIENT (background floating) PARTICLES ==========
    class AmbientParticle {
        constructor() { this.reset(); }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 0.5;
            this.baseSize = this.size;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.alpha = Math.random() * 0.4 + 0.15;
            this.baseAlpha = this.alpha;
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.isGlowing = false;
        }

        update(time) {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.1;

            if (this.x < -20) this.x = width + 20;
            if (this.x > width + 20) this.x = -20;
            if (this.y < -20) this.y = height + 20;
            if (this.y > height + 20) this.y = -20;

            // Mouse interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius) {
                this.isGlowing = true;
                const force = (mouse.radius - dist) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                const orbitAngle = angle + Math.PI / 2;
                this.x += Math.cos(orbitAngle) * force * 0.8;
                this.y += Math.sin(orbitAngle) * force * 0.8;
                this.x -= Math.cos(angle) * force * 0.3;
                this.y -= Math.sin(angle) * force * 0.3;
                this.size = this.baseSize + force * 2.5;
                this.alpha = Math.min(this.baseAlpha + force * 0.5, 1);
            } else {
                this.isGlowing = false;
                this.size += (this.baseSize - this.size) * 0.05;
            }
        }

        draw() {
            if (this.isGlowing) {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
                gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha * 0.25})`);
                gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
            ctx.fill();
        }
    }

    // ========== SPHERE PARTICLES ==========
    class SphereParticle {
        constructor(index, total) {
            this.index = index;
            this.total = total;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.size = Math.random() * 2 + 1;
            this.baseSize = this.size;
            this.alpha = Math.random() * 0.6 + 0.4;
            this.baseAlpha = this.alpha;
            this.pulseSpeed = Math.random() * 0.015 + 0.003;
            this.pulseOffset = Math.random() * Math.PI * 2;

            // Displacement from home (for localized scatter)
            this.dx = 0;
            this.dy = 0;
            this.vx = 0;
            this.vy = 0;
            this.friction = 0.88 + Math.random() * 0.04;

            // 3D sphere position (Fibonacci sphere distribution)
            this.phi = Math.acos(1 - 2 * (index + 0.5) / total);
            this.theta = Math.PI * (1 + Math.sqrt(5)) * index;

            // Rotation speed
            this.rotationSpeed = 0.0003 + Math.random() * 0.0001;

            // Current position
            this.x = 0;
            this.y = 0;
            // Target (home) position on sphere
            this.homeX = 0;
            this.homeY = 0;
        }

        computeHome(time, cx, cy, radius) {
            // Slowly rotate the sphere
            const rotAngle = time * this.rotationSpeed;
            const cosR = Math.cos(rotAngle);
            const sinR = Math.sin(rotAngle);

            // 3D to 2D projection with rotation
            const x3d = radius * Math.sin(this.phi) * Math.cos(this.theta);
            const y3d = radius * Math.sin(this.phi) * Math.sin(this.theta);
            const z3d = radius * Math.cos(this.phi);

            // Rotate around Y axis
            const rx = x3d * cosR - z3d * sinR;
            const rz = x3d * sinR + z3d * cosR;

            // Simple perspective projection
            const perspective = 500;
            const scale = perspective / (perspective + rz);

            this.homeX = cx + rx * scale;
            this.homeY = cy + y3d * scale;
            this.depthScale = scale; // for size variation
            this.depth = rz;         // for draw ordering
        }

        update(time, cx, cy, radius) {
            this.computeHome(time, cx, cy, radius);

            // Pulse alpha
            this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.1;

            // --- Localized mouse repulsion ---
            // Check distance from mouse to this particle's HOME position
            const mxToHome = mouse.x - this.homeX;
            const myToHome = mouse.y - this.homeY;
            const distToMouse = Math.sqrt(mxToHome * mxToHome + myToHome * myToHome);

            if (distToMouse < MOUSE_REPEL_RADIUS && mouse.x > 0 && mouse.y > 0) {
                // Push particle away from mouse cursor
                const force = (MOUSE_REPEL_RADIUS - distToMouse) / MOUSE_REPEL_RADIUS;
                const angle = Math.atan2(this.homeY - mouse.y, this.homeX - mouse.x);
                const pushStrength = force * force * MOUSE_REPEL_FORCE; // quadratic for snappy feel

                this.vx += Math.cos(angle) * pushStrength;
                this.vy += Math.sin(angle) * pushStrength;
            }

            // Apply velocity with friction
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.dx += this.vx;
            this.dy += this.vy;

            // Spring back toward home (displacement → 0)
            this.dx *= (1 - RETURN_SPEED);
            this.dy *= (1 - RETURN_SPEED);

            // Final position = home + displacement
            this.x = this.homeX + this.dx;
            this.y = this.homeY + this.dy;

            // Size based on depth + enlarge when displaced
            const displacement = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            const displaceFactor = Math.min(displacement / 50, 1);
            this.size = this.baseSize * (this.depthScale || 1) + displaceFactor * 1.5;
            this.alpha = this.baseAlpha + displaceFactor * 0.3;
        }

        draw() {
            const a = Math.max(0, Math.min(this.alpha * (0.5 + (this.depthScale || 1) * 0.5), 1));
            const displacement = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

            // Glow — stronger when displaced or front-facing
            if (displacement > 5 || ((this.depth || 0) < 50 && this.size > 1.2)) {
                const glowIntensity = Math.min(displacement / 40, 1) * 0.25 + 0.1;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
                gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${a * glowIntensity})`);
                gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Core
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${a})`;
            ctx.fill();

            // Bright center for larger particles
            if (this.size > 1.5) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.7})`;
                ctx.fill();
            }
        }
    }

    // ========== CONNECTIONS ==========
    function drawAmbientConnections() {
        for (let i = 0; i < ambientParticles.length; i++) {
            for (let j = i + 1; j < ambientParticles.length; j++) {
                const dx = ambientParticles[i].x - ambientParticles[j].x;
                const dy = ambientParticles[i].y - ambientParticles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DISTANCE) {
                    const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(ambientParticles[i].x, ambientParticles[i].y);
                    ctx.lineTo(ambientParticles[j].x, ambientParticles[j].y);
                    ctx.strokeStyle = `rgba(181, 39, 35, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // Mouse connections
            if (mouse.x > 0 && mouse.y > 0) {
                const mdx = mouse.x - ambientParticles[i].x;
                const mdy = mouse.y - ambientParticles[i].y;
                const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mDist < MOUSE_CONNECTION_DISTANCE) {
                    const opacity = (1 - mDist / MOUSE_CONNECTION_DISTANCE) * 0.45;
                    const gradient = ctx.createLinearGradient(
                        ambientParticles[i].x, ambientParticles[i].y, mouse.x, mouse.y
                    );
                    gradient.addColorStop(0, `rgba(${ambientParticles[i].color.r}, ${ambientParticles[i].color.g}, ${ambientParticles[i].color.b}, ${opacity})`);
                    gradient.addColorStop(1, `rgba(255, 107, 91, ${opacity * 0.3})`);
                    ctx.beginPath();
                    ctx.moveTo(ambientParticles[i].x, ambientParticles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = opacity * 1.8;
                    ctx.stroke();
                }
            }
        }
    }

    function drawSphereConnections() {
        // Draw connections between nearby sphere particles (only front-facing)
        const frontParticles = sphereParticles.filter(p => (p.depth || 0) < 80);
        for (let i = 0; i < frontParticles.length; i++) {
            for (let j = i + 1; j < frontParticles.length; j++) {
                const dx = frontParticles[i].x - frontParticles[j].x;
                const dy = frontParticles[i].y - frontParticles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 45) {
                    const opacity = (1 - dist / 45) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(frontParticles[i].x, frontParticles[i].y);
                    ctx.lineTo(frontParticles[j].x, frontParticles[j].y);
                    ctx.strokeStyle = `rgba(255, 107, 91, ${opacity})`;
                    ctx.lineWidth = 0.4;
                    ctx.stroke();
                }
            }
        }
    }

    // ========== MOUSE GLOW ==========
    function drawMouseGlow() {
        if (mouse.x < 0 || mouse.y < 0) return;
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
        gradient.addColorStop(0, 'rgba(181, 39, 35, 0.06)');
        gradient.addColorStop(0.5, 'rgba(255, 107, 91, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // ========== SPHERE CENTER GLOW ==========
    function drawSphereGlow(cx, cy) {
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, SPHERE_RADIUS * 1.3);
        gradient.addColorStop(0, 'rgba(181, 39, 35, 0.1)');
        gradient.addColorStop(0.4, 'rgba(255, 107, 91, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, SPHERE_RADIUS * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // ========== MAIN ANIMATION LOOP ==========
    function animate(time) {
        ctx.clearRect(0, 0, width, height);
        frameCount++;

        const cx = width / 2;
        const cy = height / 2;

        // Draw sphere background glow
        drawSphereGlow(cx, cy);

        // Draw mouse glow
        drawMouseGlow();

        // Update & draw ambient particles
        // Only draw connections every 3rd frame to reduce O(n²) work
        if (frameCount % 3 === 0) {
            drawAmbientConnections();
        }
        for (const p of ambientParticles) {
            p.update(time);
            p.draw();
        }

        // Update sphere particles
        for (const p of sphereParticles) {
            p.update(time, cx, cy, SPHERE_RADIUS);
        }

        // Draw sphere connections only every 3rd frame
        if (frameCount % 3 === 0) {
            drawSphereConnections();
        }

        // Sort sphere particles by depth only every 10th frame
        if (frameCount % 10 === 0 || sortedSphereCache.length === 0) {
            sortedSphereCache = [...sphereParticles].sort((a, b) => (b.depth || 0) - (a.depth || 0));
        }
        for (const p of sortedSphereCache) {
            p.draw();
        }

        animationId = requestAnimationFrame(animate);
    }

    // ========== SETUP ==========
    function resize() {
        const section = document.querySelector('.skills-showcase');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width;
        canvas.height = height;
    }

    function initParticles() {
        ambientParticles = [];
        for (let i = 0; i < AMBIENT_COUNT; i++) {
            ambientParticles.push(new AmbientParticle());
        }
        sphereParticles = [];
        for (let i = 0; i < SPHERE_COUNT; i++) {
            const sp = new SphereParticle(i, SPHERE_COUNT);
            const cx = width / 2;
            const cy = height / 2;
            sp.computeHome(0, cx, cy, SPHERE_RADIUS);
            sp.x = sp.homeX;
            sp.y = sp.homeY;
            sphereParticles.push(sp);
        }
    }

    // Mouse tracking
    function onMouseMove(e) {
        const section = document.querySelector('.skills-showcase');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }

    function onMouseLeave() {
        mouse.x = -9999;
        mouse.y = -9999;
    }

    function onTouchMove(e) {
        if (e.touches.length > 0) {
            const section = document.querySelector('.skills-showcase');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            mouse.x = e.touches[0].clientX - rect.left;
            mouse.y = e.touches[0].clientY - rect.top;
        }
    }

    function onTouchEnd() {
        mouse.x = -9999;
        mouse.y = -9999;
    }

    // Bind events
    const section = document.querySelector('.skills-showcase');
    if (section) {
        section.addEventListener('mousemove', onMouseMove);
        section.addEventListener('mouseleave', onMouseLeave);
        section.addEventListener('touchmove', onTouchMove, { passive: true });
        section.addEventListener('touchend', onTouchEnd);
    }

    // Initialize
    resize();
    initParticles();
    animate(0);

    window.addEventListener('resize', () => {
        resize();
        initParticles();
        sortedSphereCache = [];
    });

    // Pause when not visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) animate(0);
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0.05 });

    if (section) observer.observe(section);
}

// ============================================
// SKILLS CARDS SCROLL ANIMATION
// ============================================

function initSkillsCardAnimations() {
    const cards = document.querySelectorAll('.skill-card-tile');
    if (!cards.length) return;

    // Hover effect for tiles
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.05)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ============================================
// SKILLS SECTION SCROLL ANIMATION
// ============================================

function initSkillsScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const section = document.querySelector('#skills');
    if (!section) return;

    // Track scroll direction
    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px -8% 0px' });
        io.observe(el);
    }

    function splitToWords(el, extraClass = '') {
        const text = el.textContent.trim();
        const words = text.split(/\s+/);
        el.innerHTML = words.map(w =>
            `<span class="abt-word${extraClass ? ' ' + extraClass : ''}" style="display:inline-block;overflow:hidden;line-height:1.3"><span class="abt-word-inner" style="display:inline-block">${w}</span></span>`
        ).join(' ');
        return Array.from(el.querySelectorAll('.abt-word-inner'));
    }

    // SECTION TITLE ("Tech Stack") — word-by-word stagger + underline
    const sectionTitle = section.querySelector('.section-title');
    const titleUnderline = section.querySelector('.title-underline');
    let sectionTitleWords = [];
    if (sectionTitle) {
        sectionTitleWords = splitToWords(sectionTitle, 'title-word');
        gsap.set(sectionTitleWords, { y: '120%', opacity: 0 });
        observe(sectionTitle,
            () => gsap.to(sectionTitleWords, {
                y: '0%', opacity: 1,
                duration: 0.9, stagger: 0.08, ease: 'power3.out'
            }),
            () => {
                if (scrollDir === 'up') gsap.set(sectionTitleWords, { y: '120%', opacity: 0 });
                else gsap.to(sectionTitleWords, { y: '-120%', opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }
    if (titleUnderline) {
        gsap.set(titleUnderline, { scaleX: 0, opacity: 0 });
        observe(titleUnderline,
            (el) => gsap.to(el, {
                scaleX: 1, opacity: 1,
                duration: 0.8, ease: 'power3.out', delay: 0.35
            }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { scaleX: 0, opacity: 0 });
                else gsap.to(el, { scaleX: 0, opacity: 0, duration: 0.35, ease: 'power2.in' });
            },
            { threshold: 0.1 }
        );
    }

    // SKILL CARD TILES — Scatter / Gather Animation
    const tiles = section.querySelectorAll('.skill-card-tile');
    if (tiles.length) {
        // Generate smoother, slightly offset starting positions (not too far)
        const tileStates = Array.from(tiles).map(tile => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 200; // Much closer: 150 to 350 px away
            const startX = Math.cos(angle) * distance;
            const startY = Math.sin(angle) * distance + 100; // Bias towards coming from slightly below
            const startRotation = (Math.random() - 0.5) * 45; // Gentle rotation only

            return { el: tile, startX, startY, startRotation };
        });

        // Set initial state out of view softly
        tileStates.forEach(state => {
            state.el.style.transition = 'none'; // disable CSS transition during setup
            gsap.set(state.el, { x: state.startX, y: state.startY, rotation: state.startRotation, autoAlpha: 0, scale: 0.85 });
        });

        const gridShowcase = section.querySelector('.skills-grid-showcase');
        observe(gridShowcase || section,
            () => {
                // Smooth gather in
                tileStates.forEach((state, i) => {
                    gsap.to(state.el, {
                        x: 0, y: 0, rotation: 0, autoAlpha: 1, scale: 1,
                        duration: 1.0,
                        ease: 'power3.out', // Much smoother ease, no harsh bounce
                        delay: 0.1 + (i * 0.04), // Staggered reveal based on index, not random chaos
                        onComplete: () => {
                            state.el.style.transition = '';
                            gsap.set(state.el, { clearProps: 'transform' });
                        }
                    });
                });
            },
            () => {
                if (scrollDir === 'up') {
                    // Reset smoothly when scrolling UP
                    tileStates.forEach(state => {
                        state.el.style.transition = 'none';
                        gsap.set(state.el, { x: state.startX, y: state.startY, rotation: state.startRotation, autoAlpha: 0, scale: 0.85 });
                    });
                } else {
                    // Animate out gently upwards
                    tileStates.forEach((state, i) => {
                        state.el.style.transition = 'none';
                        gsap.to(state.el, {
                            x: state.startX * 0.5, y: -150 - Math.random() * 50, rotation: state.startRotation * 0.5, autoAlpha: 0, scale: 0.9,
                            duration: 0.5,
                            ease: 'power2.in',
                            delay: i * 0.02
                        });
                    });
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
        );
    }
}

// ============================================
// ABOUT ME — AWARD-WINNING SCROLL ANIMATIONS
// Complete GSAP-driven bidirectional reveal for
// every element in the About section.
// ============================================

function initAboutScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const section = document.querySelector('#about');
    if (!section) return;

    // Disabled on mobile for performance
    if (window.innerWidth <= 768) return;

    // ── Track scroll direction ─────────────────────────────────────────────
    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    // ── Helper: create IntersectionObserver for a single element ──────────
    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px -8% 0px' });
        io.observe(el);
    }

    // ── Helper: split element text into word spans for stagger ────────────
    function splitToWords(el, extraClass = '') {
        const text = el.textContent.trim();
        const words = text.split(/\s+/);
        el.innerHTML = words.map(w =>
            `<span class="abt-word${extraClass ? ' ' + extraClass : ''}" style="display:inline-block;overflow:hidden;line-height:1.3"><span class="abt-word-inner" style="display:inline-block">${w}</span></span>`
        ).join(' ');
        return Array.from(el.querySelectorAll('.abt-word-inner'));
    }

    // ── Helper: split paragraph into sentence chunks (by period or comma) ─
    function splitToSentences(el) {
        const full = el.textContent.trim();
        // Split on sentence boundaries, keeping punctuation with each chunk
        const chunks = full.match(/[^.!?]+[.!?]?/g)?.map(s => s.trim()).filter(Boolean) || [full];
        el.innerHTML = chunks.map(chunk =>
            `<span class="abt-sent" style="display:block;overflow:hidden"><span class="abt-sent-inner" style="display:block">${chunk}</span></span>`
        ).join(' ');
        return Array.from(el.querySelectorAll('.abt-sent-inner'));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 0. SECTION TITLE ("About Me") — word-by-word stagger + underline
    // ══════════════════════════════════════════════════════════════════════
    const sectionTitle = section.querySelector('.section-title');
    const titleUnderline = section.querySelector('.title-underline');
    let sectionTitleWords = [];
    if (sectionTitle) {
        sectionTitleWords = splitToWords(sectionTitle, 'title-word');
        gsap.set(sectionTitleWords, { y: '120%', opacity: 0 });
        observe(sectionTitle,
            () => gsap.to(sectionTitleWords, {
                y: '0%', opacity: 1,
                duration: 0.9, stagger: 0.08, ease: 'power3.out'
            }),
            () => {
                if (scrollDir === 'up') gsap.set(sectionTitleWords, { y: '120%', opacity: 0 });
                else gsap.to(sectionTitleWords, { y: '-120%', opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }
    if (titleUnderline) {
        gsap.set(titleUnderline, { scaleX: 0, opacity: 0 });
        observe(titleUnderline,
            (el) => gsap.to(el, {
                scaleX: 1, opacity: 1,
                duration: 0.8, ease: 'power3.out', delay: 0.35
            }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { scaleX: 0, opacity: 0 });
                else gsap.to(el, { scaleX: 0, opacity: 0, duration: 0.35, ease: 'power2.in' });
            },
            { threshold: 0.1 }
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. ABOUT PHOTO — slide in from left with depth effect
    // ══════════════════════════════════════════════════════════════════════
    const photoWrapper = section.querySelector('.about-photo-wrapper');
    if (photoWrapper) {
        gsap.set(photoWrapper, { opacity: 0, x: -80, rotateY: 8, scale: 0.94 });
        observe(photoWrapper,
            (el) => gsap.to(el, {
                opacity: 1, x: 0, rotateY: 0, scale: 1,
                duration: 1.1, ease: 'power3.out', clearProps: 'rotateY'
            }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { opacity: 0, x: -80, rotateY: 8, scale: 0.94 });
                else gsap.to(el, { opacity: 0, x: -60, duration: 0.5, ease: 'power2.in' });
            },
            { threshold: 0.1 }
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. ABOUT NAME — word-by-word stagger reveal
    // ══════════════════════════════════════════════════════════════════════
    const nameEl = section.querySelector('.about-name');
    let nameWords = [];
    if (nameEl) {
        nameWords = splitToWords(nameEl, 'name-word');
        gsap.set(nameWords, { y: '110%', opacity: 0 });
        observe(nameEl,
            () => gsap.to(nameWords, {
                y: '0%', opacity: 1,
                duration: 0.8, stagger: 0.07, ease: 'power3.out',
                delay: 0.1
            }),
            () => {
                if (scrollDir === 'up') gsap.set(nameWords, { y: '110%', opacity: 0 });
                else gsap.to(nameWords, { y: '-110%', opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. ABOUT TITLE — slide up as a unit, delayed after name
    // ══════════════════════════════════════════════════════════════════════
    const titleEl = section.querySelector('.about-title');
    if (titleEl) {
        gsap.set(titleEl, { opacity: 0, y: 30 });
        observe(titleEl,
            (el) => gsap.to(el, {
                opacity: 1, y: 0,
                duration: 0.75, ease: 'power3.out', delay: 0.4
            }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { opacity: 0, y: 30 });
                else gsap.to(el, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' });
            }
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. TEXT BLOCK — sentence-by-sentence stagger
    // ══════════════════════════════════════════════════════════════════════
    const textParagraphs = section.querySelectorAll('.text-block p');
    textParagraphs.forEach(p => {
        const sentences = splitToSentences(p);
        gsap.set(sentences, { y: '100%', opacity: 0 });
        observe(p,
            () => gsap.to(sentences, {
                y: '0%', opacity: 1,
                duration: 0.85, stagger: 0.18, ease: 'power3.out',
                delay: 0.65
            }),
            () => {
                if (scrollDir === 'up') gsap.set(sentences, { y: '100%', opacity: 0 });
                else gsap.to(sentences, { y: '-100%', opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.in' });
            },
            { threshold: 0.1 }
        );
    });

    // ══════════════════════════════════════════════════════════════════════
    // 5. CONTACT INFO — items slide from right with stagger
    // ══════════════════════════════════════════════════════════════════════
    const contactInfo = section.querySelector('.about-contact-info');
    const contactItems = contactInfo ? contactInfo.querySelectorAll('.contact-item') : [];
    if (contactInfo) {
        gsap.set(contactInfo, { opacity: 0 });
        gsap.set(contactItems, { x: 50, opacity: 0 });
        observe(contactInfo,
            () => {
                gsap.to(contactInfo, { opacity: 1, duration: 0.4, delay: 0.8 });
                gsap.to(contactItems, {
                    x: 0, opacity: 1,
                    duration: 0.7, stagger: 0.18, ease: 'power3.out',
                    delay: 0.9
                });
            },
            () => {
                if (scrollDir === 'up') {
                    gsap.set(contactInfo, { opacity: 0 });
                    gsap.set(contactItems, { x: 50, opacity: 0 });
                } else {
                    gsap.to(contactItems, { x: -30, opacity: 0, duration: 0.35, stagger: 0.06, ease: 'power2.in' });
                    gsap.to(contactInfo, { opacity: 0, duration: 0.4, delay: 0.2 });
                }
            },
            { threshold: 0.15 }
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. RESUME BUTTON — bouncy pop-in
    // ══════════════════════════════════════════════════════════════════════
    const resumeBtn = section.querySelector('.btn-resume');
    if (resumeBtn) {
        gsap.set(resumeBtn, { opacity: 0, scale: 0.7, y: 20 });
        observe(resumeBtn,
            (el) => gsap.to(el, {
                opacity: 1, scale: 1, y: 0,
                duration: 0.75, ease: 'back.out(2)', delay: 1.0
            }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { opacity: 0, scale: 0.7, y: 20 });
                else gsap.to(el, { opacity: 0, scale: 0.85, y: -15, duration: 0.35, ease: 'power2.in' });
            }
        );
    }

    // ══════════════════════════════════════════════════════════════════════
    // 7. QUOTE CAROUSEL — fade + scale from below
    // ══════════════════════════════════════════════════════════════════════
    const quoteCarousel = section.querySelector('.about-quote-carousel');
    if (quoteCarousel) {
        gsap.set(quoteCarousel, { opacity: 0, y: 50, scale: 0.97 });
        observe(quoteCarousel,
            (el) => gsap.to(el, {
                opacity: 1, y: 0, scale: 1,
                duration: 1.0, ease: 'power3.out'
            }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { opacity: 0, y: 50, scale: 0.97 });
                else gsap.to(el, { opacity: 0, y: -30, scale: 0.96, duration: 0.5, ease: 'power2.in' });
            },
            { threshold: 0.12, rootMargin: '0px 0px -4% 0px' }
        );
    }
}


function initializePortfolio() {
    perfMonitor.mark('portfolio-init-start');

    // Hide placeholder when image loads
    const aboutPhoto = document.getElementById('aboutPhoto');
    const photoPlaceholder = document.getElementById('photoPlaceholder');
    if (aboutPhoto && photoPlaceholder) {
        aboutPhoto.addEventListener('load', () => {
            photoPlaceholder.style.display = 'none';
        });
        // Also hide on error
        aboutPhoto.addEventListener('error', () => {
            photoPlaceholder.style.display = 'block';
        });
        // If image is already loaded (cached), hide placeholder immediately
        if (aboutPhoto.complete && aboutPhoto.naturalHeight !== 0) {
            photoPlaceholder.style.display = 'none';
        }
    }

    // Setup image tilt effect
    setupImageTiltEffect();

    // Setup sword cursor click effects
    setupSwordClickEffect();

    // Run entry overlay first so content is ready under the curtain
    initEntryOverlay();

    // Initialize hero scroll-synced frame animation
    initHeroFrameAnimation();

    // Initialize typewriter animation
    initTypewriter();

    // Initialize hero particles
    initHeroParticles();

    // Initialize quote carousel
    initQuoteCarousel();
    // Initialize Lenis smooth scroll FIRST — before any scroll listeners
    initLenis();

    // Initialize skills section interactive canvas & card animations
    initSkillsCanvas();
    initSkillsCardAnimations();
    initSkillsScrollAnimation();

    // Setup all interactions
    setupNavigation();
    setupScrollIndicator();
    setupProjectCards();
    setupStatCounters();
    // setupFormHandling(); // removed — contact form no longer exists
    setupKeyboardShortcuts();
    setupThemeToggle();
    setupLazyLoadImages();

    // Initialize managers
    new SmoothScrollManager();
    new AnimationObserver();

    // Experience timeline scroll-tracking
    initExpTimelineScroll();

    // Career & Experience overall bidirectional scroll reveal
    initEducationScrollAnimation();

    // Projects / My Work section title scroll reveal
    initProjectScrollAnimation();

    // About Me bidirectional scroll + line-by-line reveal
    initAboutScrollAnimation();

    // Beyond Work (hobbies) scroll reveal
    initHobbiesScrollAnimation();

    // CTA Section scroll reveal
    initCTAScrollAnimation();

    // Mega Footer scroll reveal
    initMegaFooterScrollAnimation();

    perfMonitor.mark('portfolio-init-end');
    perfMonitor.measure('portfolio-init', 'portfolio-init-start', 'portfolio-init-end');
    perfMonitor.log();

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('portfolioReady'));
}

// ============================================
// PROJECTS/WORK SECTION SCROLL ANIMATION
// ============================================

function initProjectScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const section = document.querySelector('#projects');
    if (!section) return;

    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px -8% 0px' });
        io.observe(el);
    }

    const projectsHeader = section.querySelector('.projects-header');
    if (projectsHeader) {
        const label = projectsHeader.querySelector('.projects-label');
        const title = projectsHeader.querySelector('.projects-title');
        const headerRight = projectsHeader.querySelector('.projects-header-right');

        const slideElements = [label, title, headerRight].filter(Boolean);

        if (slideElements.length) gsap.set(slideElements, { y: 60, opacity: 0 });

        observe(projectsHeader,
            () => {
                if (slideElements.length) {
                    // Stagger reveal of the label, title, and right counter
                    gsap.to(slideElements, { y: 0, opacity: 1, duration: 0.85, stagger: 0.15, ease: 'power3.out' });
                }
            },
            () => {
                if (scrollDir === 'up') {
                    if (slideElements.length) gsap.set(slideElements, { y: 60, opacity: 0 });
                } else {
                    if (slideElements.length) {
                        gsap.to(slideElements, { y: -30, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.in' });
                    }
                }
            },
            { threshold: 0.2 }
        );
    }
}

// ============================================
// CAREER & EXPERIENCE SCROLL ANIMATION
// ============================================

function initEducationScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const section = document.querySelector('#education');
    if (!section) return;

    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px -8% 0px' });
        io.observe(el);
    }

    // Split text into words but preserve <br> tags
    function splitToWordsHTML(el, extraClass = '') {
        const html = el.innerHTML.trim();
        const tokens = html.replace(/<br\s*\/?>/gi, ' <br> ').split(/\s+/).filter(Boolean);
        el.innerHTML = tokens.map(t => {
            if (t.toLowerCase() === '<br>') return '<br>';
            return `<span class="abt-word${extraClass ? ' ' + extraClass : ''}" style="display:inline-block;overflow:hidden;line-height:1.3"><span class="abt-word-inner" style="display:inline-block">${t}</span></span>`;
        }).join(' ');
        return Array.from(el.querySelectorAll('.abt-word-inner'));
    }

    // 1. SECTION TITLE & UNDERLINE
    const sectionTitle = section.querySelector('.section-title');
    const titleUnderline = section.querySelector('.title-underline');
    let sectionTitleWords = [];
    if (sectionTitle) {
        sectionTitleWords = splitToWordsHTML(sectionTitle, 'title-word');
        gsap.set(sectionTitleWords, { y: '120%', opacity: 0 });
        observe(sectionTitle,
            () => gsap.to(sectionTitleWords, { y: '0%', opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' }),
            () => {
                if (scrollDir === 'up') gsap.set(sectionTitleWords, { y: '120%', opacity: 0 });
                else gsap.to(sectionTitleWords, { y: '-120%', opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }
    if (titleUnderline) {
        gsap.set(titleUnderline, { scaleX: 0, opacity: 0 });
        observe(titleUnderline,
            (el) => gsap.to(el, { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.35 }),
            (el) => {
                if (scrollDir === 'up') gsap.set(el, { scaleX: 0, opacity: 0 });
                else gsap.to(el, { scaleX: 0, opacity: 0, duration: 0.35, ease: 'power2.in' });
            },
            { threshold: 0.1 }
        );
    }

    // 2. TIMELINE ITEMS
    const timelineItems = section.querySelectorAll('.exp-timeline-item');
    timelineItems.forEach((item, index) => {
        const yearCol = item.querySelector('.exp-year-col');
        const role = item.querySelector('.exp-role');
        const category = item.querySelector('.exp-category');
        const rightText = item.querySelector('.exp-right');

        // Group all elements inside the item to animate them in perfectly synced
        const slideElements = [yearCol, role, category, rightText].filter(Boolean);

        // Set initial states (slide down)
        if (slideElements.length) gsap.set(slideElements, { y: 40, opacity: 0 });

        observe(item,
            () => {
                // Animate all at the exact same time in the same way
                if (slideElements.length) {
                    gsap.to(slideElements, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
                }
            },
            () => {
                if (scrollDir === 'up') {
                    if (slideElements.length) gsap.set(slideElements, { y: 40, opacity: 0 });
                } else {
                    if (slideElements.length) {
                        gsap.to(slideElements, { y: -20, opacity: 0, duration: 0.4, ease: 'power2.in' });
                    }
                }
            },
            { threshold: 0.25 }
        );
    });
}

// ============================================
// EXPERIENCE TIMELINE SCROLL TRACKING
// ============================================

// ============================================
// BEYOND WORK (HOBBIES) SCROLL ANIMATION
// ============================================

function initHobbiesScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const section = document.querySelector('#hobbies');
    if (!section) return;

    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px -8% 0px' });
        io.observe(el);
    }

    // Split text into letters but preserve <br> and span tags if needed
    function splitToLettersHTML(el, extraClass = '') {
        const text = el.textContent.trim();
        const letters = text.split('');
        el.innerHTML = letters.map(char => {
            if (char === ' ') return ' ';
            return `<span class="letter${extraClass ? ' ' + extraClass : ''}" style="display:inline-block;opacity:0;transform:translateX(-20px)">${char}</span>`;
        }).join('');
        return Array.from(el.querySelectorAll('.letter'));
    }

    // 1. Title/Header Reveal (Letter by Letter from Left to Right)
    const heading = section.querySelector('.content h1');
    let titleLetters = [];
    if (heading) {
        // Save the outline span before splitting
        const outlineSpan = heading.querySelector('.outline');
        let outlineText = '';
        if (outlineSpan) {
            outlineText = outlineSpan.textContent;
            // Temporarily remove to split the main text
            outlineSpan.remove();
        }

        const mainText = heading.textContent.trim();
        heading.innerHTML = ''; // clear

        // Rebuild with letter spans
        const mainLetters = mainText.split('').map(char =>
            char === ' ' ? ' ' : `<span class="letter" style="display:inline-block;opacity:0;transform:translateX(-30px)">${char}</span>`
        ).join('');

        let outlineHtml = '';
        if (outlineText) {
            const outLetters = outlineText.split('').map(char =>
                char === ' ' ? ' ' : `<span class="letter" style="display:inline-block;opacity:0;transform:translateX(-30px)">${char}</span>`
            ).join('');
            outlineHtml = ` <span class="outline">${outLetters}</span>`;
        }

        heading.innerHTML = mainLetters + outlineHtml;
        titleLetters = Array.from(heading.querySelectorAll('.letter'));

        observe(heading,
            () => gsap.to(titleLetters, { x: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }),
            () => {
                if (scrollDir === 'up') gsap.set(titleLetters, { x: -30, opacity: 0 });
                else gsap.to(titleLetters, { x: -20, opacity: 0, duration: 0.3, stagger: 0.02, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }

    // 2. Author/Description Reveal (Line by Line from Right to Left)
    const authorSection = section.querySelector('.content .author');
    if (authorSection) {
        const authorLines = Array.from(authorSection.children);

        gsap.set(authorLines, { x: 50, opacity: 0 }); // Start from right

        observe(authorSection,
            () => gsap.to(authorLines, { x: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.2 }),
            () => {
                if (scrollDir === 'up') gsap.set(authorLines, { x: 50, opacity: 0 });
                else gsap.to(authorLines, { x: 30, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }

    // 3. Model Decorator Character (Keep this sliding in)
    const model = section.querySelector('.content .model');
    if (model) {
        gsap.set(model, { opacity: 0, x: 100 });
        observe(model,
            () => gsap.to(model, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.3 }),
            () => {
                if (scrollDir === 'up') gsap.set(model, { opacity: 0, x: 100 });
                else gsap.to(model, { opacity: 0, x: 50, duration: 0.5, ease: 'power2.in' });
            },
            { threshold: 0.2 }
        );
    }
}

// ============================================
// CTA SECTION SCROLL ANIMATION
// ============================================

function initCTAScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const section = document.querySelector('.cta-banner-section');
    if (!section) return;

    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px 0% 0px' });
        io.observe(el);
    }

    const avatarLine = section.querySelector('.cta-avatar-line');
    const gradientLine = section.querySelector('.cta-line-gradient');
    const circleWrapper = section.querySelector('.cta-circle-wrapper');

    const slideElements = [avatarLine, gradientLine, circleWrapper].filter(Boolean);

    if (slideElements.length) {
        gsap.set(slideElements, { y: 60, opacity: 0, scale: 0.95 });

        observe(section,
            () => gsap.to(slideElements, { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out' }),
            () => {
                if (scrollDir === 'up') gsap.set(slideElements, { y: 60, opacity: 0, scale: 0.95 });
                else gsap.to(slideElements, { y: -40, opacity: 0, scale: 0.95, duration: 0.4, stagger: 0.05, ease: 'power2.in' });
            },
            { threshold: 0.6 } // Triggers only when 60% of the section is visible
        );
    }
}

// ============================================
// MEGA FOOTER SCROLL ANIMATION
// ============================================

function initMegaFooterScrollAnimation() {
    if (typeof gsap === 'undefined') return;

    const footer = document.querySelector('#mega-footer');
    if (!footer) return;

    let lastScrollY = window.scrollY;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
        const cur = window.scrollY;
        if (cur > lastScrollY + 1) scrollDir = 'down';
        else if (cur < lastScrollY - 1) scrollDir = 'up';
        lastScrollY = cur;
    }, { passive: true });

    function observe(el, onEnter, onExit, opts = {}) {
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    onEnter(e.target);
                } else if (!e.isIntersecting && seen) {
                    seen = false;
                    if (onExit) onExit(e.target);
                }
            });
        }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px 0% 0px' });
        io.observe(el);
    }

    // 1. Upper Footer Columns Reveal
    const footerCols = footer.querySelectorAll('.mega-footer-col');
    if (footerCols.length) {
        gsap.set(footerCols, { y: 40, opacity: 0 });
        observe(footer,
            () => gsap.to(footerCols, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }),
            () => {
                if (scrollDir === 'up') gsap.set(footerCols, { y: 40, opacity: 0 });
                else gsap.to(footerCols, { y: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.in' });
            },
            { threshold: 0.1 }
        );
    }

    // 2. Big Name & Floating Badge Reveal
    const bigName = footer.querySelector('.mega-footer-bigname-wrap');
    if (bigName) {
        gsap.set(bigName, { y: 100, opacity: 0, scale: 0.9 });
        observe(footer,
            () => gsap.to(bigName, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(1.5)', delay: 0.3 }),
            () => {
                if (scrollDir === 'up') gsap.set(bigName, { y: 100, opacity: 0, scale: 0.9 });
                else gsap.to(bigName, { y: -50, opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in' });
            },
            { threshold: 0.3 }
        );
    }

    // 3. Lower Footer (Copyright & Icons) Reveal
    const bottomFooter = footer.querySelector('.mega-footer-bottom');
    if (bottomFooter) {
        gsap.set(bottomFooter, { y: 30, opacity: 0 });
        observe(footer,
            () => gsap.to(bottomFooter, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.6 }),
            () => {
                // Not resetting bottom on scroll up naturally to avoid flashing at the very bottom, but setting mostly
                if (scrollDir === 'up') gsap.set(bottomFooter, { y: 30, opacity: 0 });
            },
            { threshold: 0.1 }
        );
    }
}

function initExpTimelineScroll() {
    const timeline = document.getElementById('expTimeline');
    const progress = document.getElementById('expTrackProgress');
    const orb = document.getElementById('expTrackOrb');
    if (!timeline || !progress || !orb) return;

    function updateTrack() {
        const rect = timeline.getBoundingClientRect();
        const viewH = window.innerHeight;
        const sectionTop = rect.top;
        const sectionH = rect.height;
        const totalTravel = sectionH + viewH;
        const traveled = viewH - sectionTop;

        let pct = traveled / totalTravel;
        pct = Math.max(0, Math.min(1, pct));

        progress.style.height = (pct * 100) + '%';
        orb.style.top = (pct * 100) + '%';
    }

    // Use Lenis scroll event if available, otherwise fallback to scroll listener
    if (lenis) {
        lenis.on('scroll', updateTrack);
    } else {
        window.addEventListener('scroll', updateTrack, { passive: true });
    }
    // Initial call
    updateTrack();
}

// ============================================
// INTERACTIVE CAROUSEL MODAL
// ============================================

function initCarouselModal() {
    const carouselItems = document.querySelectorAll('#hobbies.banner .slider .item');
    const modal = document.getElementById('carouselModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');

    if (!carouselItems.length) return;

    // Add click listeners to each carousel item
    carouselItems.forEach((item, index) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const title = this.dataset.title;
            const description = this.dataset.description;
            const imgSrc = this.querySelector('img').src;

            openCarouselModal(title, description, imgSrc, index);
        });
    });

    // Close modal on overlay click
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeCarouselModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCarouselModal();
        }
    });
}

function openCarouselModal(title, description, imageSrc, itemIndex) {
    const modal = document.getElementById('carouselModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const carouselItem = document.querySelectorAll('#hobbies.banner .slider .item')[itemIndex];
    const slider = document.querySelector('#hobbies.banner .slider');

    // Set content
    modalImage.src = imageSrc;
    modalTitle.textContent = title;
    modalDescription.textContent = description;

    // Pause the carousel rotation
    if (slider) {
        slider.style.animationPlayState = 'paused';
    }

    // Fade out the carousel item smoothly
    carouselItem.style.opacity = '0';
    carouselItem.style.transition = 'opacity 0.4s ease-out';

    // Show modal with a slight delay for better UX
    setTimeout(() => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 100);
}

function closeCarouselModal() {
    const modal = document.getElementById('carouselModal');
    const slider = document.querySelector('#hobbies.banner .slider');

    // Reset carousel item opacity
    const carouselItems = document.querySelectorAll('#hobbies.banner .slider .item');
    carouselItems.forEach(item => {
        item.style.opacity = '1';
        item.style.transition = '';
        item.style.animation = '';
    });

    // Resume carousel animation
    if (slider) {
        slider.style.animationPlayState = 'running';
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// ENTRY POINT
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePortfolio);
} else {
    initializePortfolio();
}

// Initialize carousel modal
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarouselModal);
} else {
    initCarouselModal();
}

// ============================================
// HORIZONTAL SCROLL FOR PROJECTS SECTION
// ============================================

function initHorizontalScroll() {
    const projectsSection = document.querySelector('#projects');
    const projectsGridWrapper = document.querySelector('.projects-grid-wrapper');
    const projectsGrid = document.querySelector('.projects-grid');

    if (!projectsSection || !projectsGridWrapper || !projectsGrid) return;

    // Disabled horizontally on mobile devices
    if (window.innerWidth <= 768) return;

    let scrollPos = 0;
    let locked = false;
    let hasReachedEnd = false;
    let hasReachedStart = true;
    let lastScrollY = window.scrollY;
    let exitedFromBottom = false; // true if user scrolled past section downward

    function getMaxScroll() {
        return Math.max(0, projectsGrid.scrollWidth - projectsGridWrapper.clientWidth);
    }

    function lockScroll() {
        if (locked) return;
        locked = true;
        if (lenis) lenis.stop();
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        if (!locked) return;
        locked = false;
        if (lenis) lenis.start();
        document.body.style.overflow = '';
    }

    function updateScroll() {
        const maxScroll = getMaxScroll();
        scrollPos = Math.max(0, Math.min(scrollPos, maxScroll));
        projectsGrid.style.transform = `translateX(-${scrollPos}px)`;
        hasReachedEnd = scrollPos >= maxScroll - 5;
        hasReachedStart = scrollPos <= 5;

        // Update progress bar
        const progressEl = document.getElementById('scrollProgress');
        if (progressEl && maxScroll > 0) {
            const pct = (scrollPos / maxScroll) * 100;
            progressEl.style.width = pct + '%';
            progressEl.parentElement.style.background = 'var(--glass-border)';
        }

        // Update counter
        const counterEl = document.getElementById('projectCounter');
        if (counterEl) {
            // Count only primary project cards, not the "see more" card
            const items = projectsGrid.querySelectorAll('.project-item[data-index]');
            if (!items.length) {
                counterEl.textContent = '00';
                return;
            }
            const itemWidth = items[0]?.offsetWidth || 1;
            // Use scrollPos + itemWidth/2 for smoother transition
            let idx = Math.floor((scrollPos + itemWidth / 2) / itemWidth) + 1;
            idx = Math.max(1, Math.min(idx, items.length));
            // If at or past the end, always show last card
            if (scrollPos >= (itemWidth * (items.length - 1))) {
                idx = items.length;
            }
            counterEl.textContent = String(idx).padStart(2, '0');
        }
    }

    // Track when user scrolls past the section downward
    const bottomObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                const rect = projectsSection.getBoundingClientRect();
                if (rect.bottom < 0) {
                    // Section is above viewport — user scrolled past it downward
                    exitedFromBottom = true;
                }
            }
        });
    }, { threshold: 0 });
    bottomObserver.observe(projectsSection);

    // Safety: unlock if section fully leaves viewport while locked
    const safetyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && locked) {
                unlockScroll();
            }
        });
    }, { threshold: 0 });
    safetyObserver.observe(projectsSection);

    // Track scroll direction and lock appropriately
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        const scrollingUp = currentScrollY < lastScrollY;
        const rect = projectsSection.getBoundingClientRect();

        if (window.__isProgrammaticStaging) {
            lastScrollY = currentScrollY;
            return;
        }

        if (!locked) {
            // SCROLLING DOWN from above — lock when section top reaches viewport top
            if (scrollingDown && rect.top <= 5 && rect.top >= -50 && rect.bottom > window.innerHeight * 0.3) {
                if (!hasReachedEnd) {
                    exitedFromBottom = false;
                    lockScroll();
                }
            }

            // SCROLLING UP from below — lock ONLY when section top is at viewport top
            // This means the section is fully in view, not just partially
            if (scrollingUp && exitedFromBottom && rect.top >= -10 && rect.top <= 30) {
                exitedFromBottom = false;
                hasReachedEnd = true;
                hasReachedStart = false;
                scrollPos = getMaxScroll(); // Start at last card
                updateScroll();
                lockScroll();
            }
        }

        lastScrollY = currentScrollY;
    }, { passive: true });

    // Main wheel handler — runs while locked
    window.addEventListener('wheel', (event) => {
        // Ignore horizontal trackpad swipes — only vertical scroll triggers horizontal
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            if (locked) event.preventDefault();
            return;
        }

        if (!locked) return;

        event.preventDefault();
        event.stopPropagation();

        const maxScroll = getMaxScroll();
        if (maxScroll <= 0) { unlockScroll(); return; }

        let delta = event.deltaY * 1.5;

        // Scrolling down and reached last card → unlock downward
        if (delta > 0 && hasReachedEnd) {
            exitedFromBottom = true;
            unlockScroll();
            return;
        }

        // Scrolling up and reached first card → unlock upward
        if (delta < 0 && hasReachedStart) {
            hasReachedEnd = false;
            exitedFromBottom = false;
            unlockScroll();
            return;
        }

        scrollPos = Math.max(0, Math.min(scrollPos + delta, maxScroll));
        updateScroll();
    }, { passive: false });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!locked) return;

        const maxScroll = getMaxScroll();
        if (maxScroll <= 0) return;

        let scrollAmount = 300;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollPos = Math.min(scrollPos + scrollAmount, maxScroll);
            updateScroll();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollPos = Math.max(scrollPos - scrollAmount, 0);
            updateScroll();
        }
    });

    projectsGrid.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    // Expose programmatic controls for GSAP routing animation
    window.__projectsScroll = {
        animateTo: function (toEnd, callback) {
            const maxScroll = getMaxScroll();
            const targetPos = toEnd ? maxScroll : 0;

            projectsGrid.style.transition = 'none';

            const proxy = { val: scrollPos };
            if (typeof gsap !== 'undefined') {
                gsap.to(proxy, {
                    val: targetPos,
                    duration: 1.5,
                    ease: 'power3.inOut',
                    onUpdate: () => {
                        scrollPos = proxy.val;
                        updateScroll();
                    },
                    onComplete: () => {
                        hasReachedEnd = toEnd;
                        hasReachedStart = !toEnd;
                        projectsGrid.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        if (callback) callback();
                    }
                });
            } else {
                scrollPos = targetPos;
                updateScroll();
                hasReachedEnd = toEnd;
                hasReachedStart = !toEnd;
                projectsGrid.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                if (callback) callback();
            }
        },
        setPos: function (pos) {
            scrollPos = typeof pos === 'number' ? pos : pos;
            if (projectsGrid) projectsGrid.style.transition = 'none';
            updateScroll();
            if (projectsGrid) setTimeout(() => projectsGrid.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 50);
        },
        getMaxScroll: getMaxScroll,
        resetFlags: function (end, start, exited) {
            hasReachedEnd = end;
            hasReachedStart = start;
            exitedFromBottom = exited;
        },
        unlock: unlockScroll,
        lock: lockScroll,
        isLocked: () => locked
    };
}

// ============================================
// MOBILE NAVIGATION TOGGLE
// ============================================

function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const mobileMenu = document.querySelector('.mobile-dropdown-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (!toggleBtn || !mobileMenu) return;

    toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('open');
        mobileMenu.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            toggleBtn.classList.remove('open');
            mobileMenu.classList.remove('active');

            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                if (typeof smoothScrollToSection === 'function') {
                    smoothScrollToSection(href);
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!toggleBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            toggleBtn.classList.remove('open');
            mobileMenu.classList.remove('active');
        }
    });

    window.addEventListener('scroll', () => {
        if (mobileMenu.classList.contains('active')) {
            toggleBtn.classList.remove('open');
            mobileMenu.classList.remove('active');
        }
    }, { passive: true });
}

// Initialize components
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initHorizontalScroll();
        initMobileNav();
    });
} else {
    initHorizontalScroll();
    initMobileNav();
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    // Graceful cleanup
});
