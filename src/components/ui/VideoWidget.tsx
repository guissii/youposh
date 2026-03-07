import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Play, ExternalLink } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   VideoCard — Premium in-flow card (non-floating)
   Used inside the page layout, typically below the hero.
   ═══════════════════════════════════════════════════════ */

interface VideoCardProps {
    /** Poster / thumbnail image */
    posterSrc: string;
    /** Short title displayed on the card */
    title?: string;
    /** Callback when the user clicks play */
    onPlay: () => void;
}

export function VideoCard({ posterSrc, title = 'Visitez notre boutique', onPlay }: VideoCardProps) {
    return (
        <section className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-4">
                <button
                    onClick={onPlay}
                    className="group relative w-full rounded-2xl overflow-hidden shadow-lg border border-[var(--yp-gray-300)] hover:shadow-xl transition-all duration-500 bg-black"
                    aria-label="Lire la vidéo de présentation"
                >
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9]">
                        <img
                            src={posterSrc}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Centered play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/95 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                <Play className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--yp-dark)] ml-1" fill="currentColor" />
                            </div>
                        </div>

                        {/* Title badge bottom-left */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <Play className="w-3.5 h-3.5 text-white" fill="white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm sm:text-base text-left">{title}</p>
                                    <p className="text-white/60 text-xs text-left">Cliquez pour voir</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-lg">
                                <ExternalLink className="w-3 h-3" />
                                Voir la vidéo
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   VideoModal — Fullscreen / bottom-sheet modal player
   ═══════════════════════════════════════════════════════ */

interface VideoModalProps {
    videoSrc: string;
    posterSrc?: string;
    ctaText?: string;
    ctaLink?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function VideoModal({
    videoSrc,
    posterSrc,
    ctaText = 'Voir le produit',
    ctaLink,
    isOpen,
    onClose,
}: VideoModalProps) {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // Auto-play when opened, pause when closed
    useEffect(() => {
        if (!videoRef.current) return;
        if (isOpen) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
            setIsMuted(true);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCtaClick = () => {
        if (ctaLink) window.location.href = ctaLink;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-modal-overlay">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

            {/* Video container */}
            <div className="relative w-[90vw] max-w-[420px] sm:max-w-[520px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl animate-modal-in">
                <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={posterSrc}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Top controls */}
                <div className="absolute top-3 right-3 flex gap-2">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        aria-label="Fermer la vidéo"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Bottom CTA */}
                {ctaLink && (
                    <div className="absolute bottom-4 left-4 right-4">
                        <button
                            onClick={handleCtaClick}
                            className="w-full bg-white/95 backdrop-blur-sm text-[var(--yp-dark)] py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-white transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {ctaText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   DesktopVideoWidget — Floating mini-player (desktop only)
   Kept for desktop; completely hidden on mobile.
   ═══════════════════════════════════════════════════════ */

interface DesktopVideoWidgetProps {
    videoSrc: string;
    posterSrc?: string;
    ctaText?: string;
    ctaLink?: string;
    showDelay?: number;
}

export default function DesktopVideoWidget({
    videoSrc,
    posterSrc,
    ctaText = 'Voir le produit',
    ctaLink,
    showDelay = 4000,
}: DesktopVideoWidgetProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const dismissed = sessionStorage.getItem('yp-video-dismissed');
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        // Only show on desktop
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setIsDismissed(true);
            return;
        }

        const timer = setTimeout(() => setIsVisible(true), showDelay);
        return () => clearTimeout(timer);
    }, [showDelay]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('yp-video-dismissed', 'true');
    };

    const handleCtaClick = () => {
        if (ctaLink) window.location.href = ctaLink;
    };

    if (isDismissed || !isVisible) return null;

    return (
        <div className="fixed bottom-6 right-20 z-40 animate-slide-up hidden md:block">
            <div className="relative w-[240px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--yp-gray-300)] bg-black">
                {/* Close */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                    <X className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Mute */}
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-2.5 left-2.5 z-10 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                </button>

                {/* Video */}
                <div className="aspect-[9/16]">
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        poster={posterSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* CTA */}
                {ctaLink && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                        <button
                            onClick={handleCtaClick}
                            className="w-full bg-white text-[var(--yp-dark)] py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors shadow-md"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {ctaText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
