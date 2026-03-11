import { useEffect, useRef } from 'react';

/**
 * Custom hook that uses IntersectionObserver to add a `.revealed` class
 * to child elements with the `.reveal` class when they enter the viewport.
 * Provides staggered reveal animations for homepage sections.
 */
export function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const revealNow = () => {
            if (node.classList.contains('reveal')) {
                node.classList.add('revealed');
            }
            const revealElements = node.querySelectorAll('.reveal');
            revealElements.forEach((el) => el.classList.add('revealed'));
        };

        if (typeof IntersectionObserver === 'undefined') {
            revealNow();
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        // Observe the container itself
        if (node.classList.contains('reveal')) {
            observer.observe(node);
        }

        // Observe all children with `.reveal` class
        const revealElements = node.querySelectorAll('.reveal');
        revealElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return ref;
}
