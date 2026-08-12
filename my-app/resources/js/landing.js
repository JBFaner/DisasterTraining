import { animate, inView, stagger } from 'motion';
import lottie from 'lottie-web';
import '../css/landing.css';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initMobileMenu() {
    const button = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!button || !menu) {
        return;
    }

    button.addEventListener('click', () => menu.classList.toggle('hidden'));
    menu.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') {
                return;
            }

            const target = document.querySelector(href);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });
}

function initNavScroll() {
    const nav = document.getElementById('landing-nav');
    const hero = document.getElementById('home');
    if (!nav || !hero) {
        return;
    }

    const update = () => {
        const heroBottom = hero.getBoundingClientRect().bottom;
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
        nav.classList.toggle('is-over-hero', heroBottom > 72);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
}

function initHeroVideo() {
    const video = document.getElementById('landing-hero-video');
    const fallback = document.getElementById('landing-hero-fallback');
    if (!video) {
        return;
    }

    const showFallback = () => {
        video.classList.add('hidden');
        fallback?.classList.remove('hidden');
    };

    video.addEventListener('error', showFallback, { once: true });

    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        showFallback();
        return;
    }

    const tryPlay = () => {
        if (video.error || video.readyState === 0) {
            showFallback();
            return;
        }

        video.play().catch(showFallback);
    };

    if (video.readyState >= 2) {
        tryPlay();
    } else {
        video.addEventListener('loadeddata', tryPlay, { once: true });
        setTimeout(() => {
            if (video.error || video.readyState < 2) {
                showFallback();
            }
        }, 2500);
    }
}

function initHeroTilt() {
    if (prefersReducedMotion || window.matchMedia('(max-width: 1023px)').matches) {
        return;
    }

    const card = document.getElementById('hero-preview');
    if (!card) {
        return;
    }

    const maxTilt = 10;

    card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = `perspective(1000px) rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
}

function initLottie() {
    const container = document.getElementById('lottie-shield');
    if (!container) {
        return;
    }

    lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: !prefersReducedMotion,
        path: '/lottie/shield.json',
    });
}

function initCert3D() {
    const scene = document.getElementById('landing-cert-scene');
    const flipper = document.getElementById('landing-cert-flipper');
    const tilt = document.getElementById('landing-cert-tilt');
    const shine = document.getElementById('landing-cert-shine');
    if (!scene || !flipper || !tilt) {
        return;
    }

    const maxTilt = 14;

    const toggleFlip = () => {
        flipper.classList.toggle('is-flipped');
    };

    scene.addEventListener('click', toggleFlip);
    scene.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleFlip();
        }
    });

    if (prefersReducedMotion || window.matchMedia('(max-width: 1023px)').matches) {
        return;
    }

    scene.addEventListener('mousemove', (event) => {
        const rect = scene.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        tilt.style.transform = `rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg)`;

        if (shine) {
            const px = ((x + 0.5) * 100).toFixed(1);
            const py = ((y + 0.5) * 100).toFixed(1);
            shine.style.background = `radial-gradient(circle at ${px}% ${py}%, rgb(255 255 255 / 0.65), transparent 58%)`;
        }
    });

    scene.addEventListener('mouseleave', () => {
        tilt.style.transform = 'rotateX(0deg) rotateY(0deg)';
        if (shine) {
            shine.style.background = 'radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.55), transparent 55%)';
        }
    });
}

function initScrollAnimations() {
    if (prefersReducedMotion) {
        document.querySelectorAll('.landing-reveal').forEach((el) => el.classList.add('is-visible'));
        return;
    }

    document.querySelectorAll('[data-landing-hero]').forEach((el, index) => {
        animate(
            el,
            { opacity: [0, 1], y: [32, 0] },
            { duration: 0.7, delay: index * 0.08, easing: [0.22, 1, 0.36, 1] },
        );
    });

    inView('.landing-reveal', (element) => {
        animate(
            element,
            { opacity: [0, 1], y: [28, 0] },
            { duration: 0.65, easing: [0.22, 1, 0.36, 1] },
        );
        element.classList.add('is-visible');
    }, { margin: '-80px 0px -80px 0px' });

    inView('.landing-card', (element) => {
        animate(
            element,
            { opacity: [0, 1], y: [24, 0] },
            { duration: 0.55, easing: [0.22, 1, 0.36, 1] },
        );
    }, { margin: '-60px 0px -60px 0px' });

    inView('.landing-step', (element) => {
        animate(
            element,
            { opacity: [0, 1], y: [20, 0], scale: [0.96, 1] },
            { duration: 0.5, easing: [0.22, 1, 0.36, 1] },
        );
        element.classList.add('is-active');
    }, { margin: '-40px 0px -40px 0px' });

    const steps = document.querySelectorAll('.landing-step');
    const progress = document.getElementById('landing-timeline-progress');
    if (steps.length && progress) {
        inView('#how-it-works', () => {
            animate(progress, { width: ['0%', '100%'] }, { duration: 1.2, easing: [0.22, 1, 0.36, 1] });
        }, { amount: 0.35 });
    }
}

function initStatCounters() {
    // Reserved for future stat blocks on the landing page.
}

function initAboutCards() {
    if (prefersReducedMotion) {
        return;
    }

    const cards = document.querySelectorAll('.landing-about-card');
    if (!cards.length) {
        return;
    }

    inView('.landing-about-card', () => {
        animate(
            cards,
            { opacity: [0, 1], y: [24, 0] },
            { duration: 0.55, delay: stagger(0.1), easing: [0.22, 1, 0.36, 1] },
        );
    }, { amount: 0.3, once: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initNavScroll();
    initHeroVideo();
    initHeroTilt();
    initLottie();
    initCert3D();
    initScrollAnimations();
    initAboutCards();
});
