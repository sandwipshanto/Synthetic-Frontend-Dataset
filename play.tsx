"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, Tooltip as RechartsTooltip } from 'recharts';

// Mobile Viewport Component using vanilla JavaScript
const MobileViewport: React.FC = () => {
    useEffect(() => {
        // Add viewport meta tag
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');

        // Add mobile-specific styles
        const styleElement = document.createElement('style');
        styleElement.textContent = `
      @media (max-width: 767px) {
        body {
          font-size: 16px;
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
          position: relative;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
        }
        
        #game-container {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        
        .card {
          width: 28vw !important;
          height: 28vw !important;
          font-size: 12vw !important;
          margin: 2px !important;
        }
        
        .grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          justify-content: center;
          padding: 8px;
        }

        /* Adjust modals for mobile */
        .modal-content {
          width: 90% !important;
          max-width: 90vw !important;
          margin: 0 auto;
        }
        
        /* Fix charts responsiveness */
        .recharts-responsive-container {
          width: 100% !important;
          height: auto !important;
        }
      }
    `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    return null;
};

// Design System
const theme = {
    colors: {
        primary: '#6B7280', // Soft gray
        secondary: '#10B981', // Gentle emerald
        accent: '#3B82F6', // Soft blue
        background: '#F3F4F6', // Light gray
        cardBack: '#9CA3AF', // Muted gray
        cardFront: '#FFFFFF', // White
        text: '#1F2937', // Dark gray
        toast: '#D1FAE5', // Light emerald for toast
        chartSuccess: '#34D399', // Emerald for success
        chartFailure: '#F87171', // Red for failure
    },
    spacing: {
        sm: '0.5rem', // 8px
        md: '1rem', // 16px
        lg: '1.5rem', // 24px
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
        h1: 'text-2xl sm:text-3xl font-bold',
        h2: 'text-xl sm:text-2xl font-semibold',
        body: 'text-base sm:text-lg',
    },
    shadows: 'shadow-md',
    borderRadius: 'rounded-lg',
};

// Game Data
const themes = {
    animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻'],
    colors: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
    shapes: ['▲', '■', '●', '◆', '★', '♥'],
    fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉'],
    vehicles: ['🚗', '🚲', '🚂', '🚁', '🚢', '🏍️'],
    sports: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐'],
    weather: ['☀️', '🌧️', '❄️', '🌈', '⚡', '🌪️'],
};

type Card = {
    id: number;
    content: string;
    isFlipped: boolean;
    isMatched: boolean;
};

// Reusable Components
const Header: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col items-center mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-emerald-500/10 blur-xl rounded-full"></div>
        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600 relative z-10">
            {title}
        </h1>
        <div className="h-1 w-24 mt-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
    </div>
);

const StatusBar: React.FC<{
    timeLeft: number;
    score: number;
    matches: number;
    totalPairs: number;
    progress: number;
}> = ({ timeLeft, score, matches, totalPairs, progress }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
            <div className="flex items-center space-x-8 mb-3 sm:mb-0">
                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">Time</span>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                        {timeLeft}s
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">Score</span>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                        {score}
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500">Matches</span>
                    <span className="text-xl font-bold text-gray-700">
                        {matches}/{totalPairs}
                    </span>
                </div>
            </div>
        </div>

        {/* Enhanced Progress Tracker */}
        <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
                <span>{Math.round(progress)}% Complete</span>
                <span>{totalPairs - matches} pairs left</span>
            </div>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
                
                {/* Progress Markers */}
                <div className="absolute inset-0 flex items-center justify-between px-1">
                    {Array.from({ length: totalPairs }).map((_, idx) => (
                        <motion.div
                            key={idx}
                            className={`h-2 w-2 rounded-full ${
                                idx < matches ? 'bg-white' : 'bg-gray-300/30'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ 
                                scale: idx < matches ? [1, 1.5, 1] : 1,
                                opacity: idx < matches ? 1 : 0.5 
                            }}
                            transition={{ 
                                duration: 0.3,
                                delay: idx * 0.05,
                                repeat: idx < matches && idx === matches - 1 ? 1 : 0,
                                repeatDelay: 0.2
                            }}
                        />
                    ))}
                </div>
                
                {/* Animated Glow Effect */}
                {progress > 0 && (
                    <motion.div
                        className="absolute top-0 left-0 h-full w-20 bg-white/30 blur-sm"
                        animate={{
                            x: ["0%", "100%"]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear"
                        }}
                        style={{ width: `${progress/4}%`, transform: "skewX(-15deg)" }}
                    />
                )}
            </div>
        </div>
    </div>
);

const CardGrid: React.FC<{
    cards: Card[];
    onCardClick: (id: number) => void;
}> = ({ cards, onCardClick }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
        {cards.map((card) => (
            <motion.div
                key={card.id}
                onClick={() => onCardClick(card.id)}
                className="card-container relative"
            >
                <motion.div
                    className={`w-[28vw] h-[28vw] sm:w-24 sm:h-24 flex items-center justify-center cursor-pointer rounded-xl`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <motion.div
                        className="w-full h-full relative"
                        animate={{
                            rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Card Back */}
                        <motion.div
                            className={`absolute w-full h-full rounded-xl shadow-lg ${card.isMatched ? 'opacity-70' : 'opacity-100'
                                }`}
                            style={{
                                backfaceVisibility: 'hidden',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                backdropFilter: 'blur(5px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-1/2 h-1/2 rounded-full bg-gradient-to-br from-indigo-400/50 to-emerald-400/50 blur-sm"></div>
                            </div>
                        </motion.div>

                        {/* Card Front */}
                        <motion.div
                            className="absolute w-full h-full flex items-center justify-center rounded-xl"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                background: 'rgba(255, 255, 255, 0.7)',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                backdropFilter: 'blur(5px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            <span className="text-4xl sm:text-5xl">{card.content}</span>

                            {/* Success indicator */}
                            {card.isMatched && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-xl flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-xl"></div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        ))}
    </div>
);

const InviteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
}> = ({ isOpen, onClose, inviteLink }) => {
    const [toast, setToast] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setToast(true);
        setTimeout(() => setToast(false), 2000);
    };

    const shareOnTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(inviteLink)}&text=Join me in a card matching challenge!`);
    const shareOnWhatsApp = () => window.open(`https://wa.me/?text=Join me in a card matching challenge: ${encodeURIComponent(inviteLink)}`);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl max-w-md w-full mx-4"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                    >
                        {/* Header */}
                        <div className="relative mb-6">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
                                Invite a Friend
                            </h2>
                            <div className="h-0.5 w-16 mt-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-md">
                                <QRCode value={inviteLink} size={150} />
                            </div>
                            <div className="w-full bg-white/70 rounded-lg p-2 flex items-center border border-gray-100">
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="w-full bg-transparent text-gray-700 text-sm border-none focus:outline-none"
                                />
                                <motion.button
                                    onClick={handleCopy}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="ml-2 p-1.5 rounded-md bg-gray-100 hover:bg-gray-200"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Share buttons */}
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <motion.button
                                    onClick={shareOnTwitter}
                                    className="px-4 py-2.5 bg-[#1DA1F2] text-white rounded-lg shadow-md flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <TwitterIcon /> Twitter
                                </motion.button>
                                <motion.button
                                    onClick={shareOnWhatsApp}
                                    className="px-4 py-2.5 bg-[#25D366] text-white rounded-lg shadow-md flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <WhatsAppIcon /> WhatsApp
                                </motion.button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end">
                            <motion.button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Close
                            </motion.button>
                        </div>

                        {/* Toast notification */}
                        <AnimatePresence>
                            {toast && (
                                <motion.div
                                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-emerald-500 text-white rounded-full shadow-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    Link copied!
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const SummaryDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    summary: { time: number; score: number; matches: number; totalPairs: number; accuracy: number };
    scoreHistory: { time: number; score: number }[];
}> = ({ isOpen, onClose, summary, scoreHistory }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const [animateStats, setAnimateStats] = useState(false);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
            // Delay animation slightly for better entrance effect
            setTimeout(() => setAnimateStats(true), 500);
        } else {
            setAnimateStats(false);
        }
    }, [isOpen]);

    // Ensure accuracy is within valid range and handle edge cases
    const safeAccuracy = isNaN(summary.accuracy) || !isFinite(summary.accuracy)
        ? 0
        : Math.min(Math.max(summary.accuracy, 0), 100);

    const accuracyData = [
        { name: 'Correct', value: safeAccuracy },
        { name: 'Incorrect', value: 100 - safeAccuracy },
    ];

    const shareLink = `${window.location.origin}/?challenge=${Date.now()}&score=${summary.score}`;
    const shareOnTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=I scored ${summary.score} in the Memory Match Game!`);
    const shareOnWhatsApp = () => window.open(`https://wa.me/?text=I scored ${summary.score} in the Memory Match Game: ${encodeURIComponent(shareLink)}`);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className="relative bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto scrollbar-thin"
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                        style={{ overflowY: 'auto' }}
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
                        
                        {/* Header with confetti animation */}
                        <div className="relative pt-10 px-8 pb-6 overflow-hidden">
                            <motion.div
                                className="absolute top-0 inset-x-0 h-24 pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`absolute w-2 h-2 rounded-full`}
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            backgroundColor: 
                                                i % 3 === 0 ? '#6366F1' : 
                                                i % 3 === 1 ? '#10B981' : 
                                                '#EC4899'
                                        }}
                                        initial={{ 
                                            top: -10,
                                            rotate: 0,
                                            opacity: 1,
                                            scale: Math.random() * 0.5 + 1
                                        }}
                                        animate={{ 
                                            top: 60 + (Math.random() * 20),
                                            rotate: Math.random() * 360,
                                            opacity: 0,
                                            scale: 0
                                        }}
                                        transition={{ 
                                            duration: Math.random() * 1 + 1, 
                                            repeat: Infinity, 
                                            delay: Math.random() * 2,
                                            repeatType: "loop"
                                        }}
                                    />
                                ))}
                            </motion.div>

                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600 text-center">
                                Game Complete!
                            </h2>
                            
                            <div className="mt-2 text-center space-y-2">
                                <motion.div
                                    className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-emerald-100 text-indigo-800 text-lg font-medium"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.span 
                                        initial={{ scale: 1 }}
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ delay: 1, duration: 0.5, repeat: 3, repeatDelay: 5 }}
                                        className="mr-2"
                                    >
                                        🏆
                                    </motion.span> 
                                    Your score: {summary.score}
                                </motion.div>
                                <motion.div 
                                    className="text-gray-600"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    Time taken: {summary.time} seconds
                                </motion.div>
                            </div>
                        </div>

                        <div className="px-8 pb-6">
                            {/* Stats cards with animation */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[
                                    { label: "Time", value: `${summary.time}s`, color: "from-indigo-600 to-blue-600", 
                                      icon: "⏱️", animate: { y: [-20, 0], opacity: [0, 1], delay: 0.2 } },
                                    { label: "Score", value: summary.score, color: "from-emerald-500 to-teal-600", 
                                      icon: "🎯", animate: { y: [-20, 0], opacity: [0, 1], delay: 0.3 } },
                                    { label: "Matches", value: `${summary.matches}/${summary.totalPairs}`, color: "from-violet-600 to-purple-600", 
                                      icon: "🔍", animate: { y: [-20, 0], opacity: [0, 1], delay: 0.4 } },
                                    { label: "Accuracy", value: `${safeAccuracy.toFixed(1)}%`, color: "from-pink-600 to-rose-600", 
                                      icon: "🎯", animate: { y: [-20, 0], opacity: [0, 1], delay: 0.5 } },
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={animateStats ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                                        transition={{ delay: stat.animate.delay, duration: 0.5 }}
                                    >
                                        <div className="h-1 bg-gradient-to-r w-full" style={{backgroundImage: `linear-gradient(to right, ${stat.color.split(' ')[0].replace('from-', '')}, ${stat.color.split(' ')[1].replace('to-', '')})`}}></div>
                                        <div className="p-4 flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl mr-3">
                                                {stat.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                                                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r" style={{backgroundImage: `linear-gradient(to right, ${stat.color.split(' ')[0].replace('from-', '')}, ${stat.color.split(' ')[1].replace('to-', '')})`}}>
                                                    {stat.value}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Charts with better styling */}
                            <div className="space-y-6 mb-8">
                                {/* Accuracy chart */}
                                <motion.div
                                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={animateStats ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                >
                                    <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 w-full"></div>
                                    <div className="p-5">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs mr-2">📊</span>
                                            Accuracy Breakdown
                                        </h3>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={accuracyData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={60}
                                                    cornerRadius={6}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    startAngle={90}
                                                    endAngle={-270}
                                                >
                                                    <Cell fill="#34D399" />
                                                    <Cell fill="#F87171" />
                                                </Pie>
                                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold">
                                                    <tspan x="50%" dy="-5" fontSize="14" fill="#6B7280">{safeAccuracy.toFixed(0)}%</tspan>
                                                    <tspan x="50%" dy="20" fontSize="12" fill="#9CA3AF">Accuracy</tspan>
                                                </text>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex justify-center gap-6 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                                                <span className="text-xs text-gray-600">Correct</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-red-400"></div>
                                                <span className="text-xs text-gray-600">Incorrect</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Score progression chart */}
                                <motion.div
                                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={animateStats ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                    transition={{ delay: 0.7, duration: 0.5 }}
                                >
                                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 w-full"></div>
                                    <div className="p-5">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs mr-2">📈</span>
                                            Score Progression
                                        </h3>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <LineChart data={scoreHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                                <defs>
                                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time" hide />
                                                <RechartsTooltip 
                                                    contentStyle={{ 
                                                        borderRadius: '8px', 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                        border: 'none',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(value) => [`Score: ${value}`, 'Score']}
                                                    labelFormatter={(time) => `Time: ${time}s`}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#10B981"
                                                    strokeWidth={3}
                                                    dot={{ stroke: '#10B981', strokeWidth: 2, fill: 'white', r: 4 }}
                                                    activeDot={{ r: 6, stroke: '#047857', strokeWidth: 2, fill: 'white' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                                <motion.button
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 font-medium"
                                    whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Play Again
                                </motion.button>

                                <div className="relative w-full sm:w-auto">
                                    <motion.button
                                        onClick={() => setShowTooltip(!showTooltip)}
                                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 font-medium"
                                        whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Share Results
                                    </motion.button>

                                    <AnimatePresence>
                                        {showTooltip && (
                                            <motion.div
                                                className="absolute right-0 left-0 sm:left-auto mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 flex gap-3 z-10 justify-center"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <motion.button 
                                                    onClick={shareOnTwitter} 
                                                    whileHover={{ scale: 1.1 }} 
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-[#1DA1F2]/10 p-3 rounded-xl"
                                                >
                                                    <TwitterIcon />
                                                </motion.button>
                                                <motion.button 
                                                    onClick={shareOnWhatsApp} 
                                                    whileHover={{ scale: 1.1 }} 
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-[#25D366]/10 p-3 rounded-xl"
                                                >
                                                    <WhatsAppIcon />
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Simple SVG Icons
const TwitterIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M23 3.00005C22.0424 3.67552 20.9821 4.19216 19.86 4.53005C19.2577 3.83756 18.4573 3.34674 17.567 3.12397C16.6767 2.90121 15.7395 2.95724 14.8821 3.2845C14.0247 3.61176 13.2884 4.19445 12.773 4.95376C12.2575 5.71308 11.9877 6.61238 12 7.53005V8.53005C10.2426 8.57561 8.50127 8.18586 6.93101 7.39549C5.36074 6.60513 4.01032 5.43868 3 4.00005C3 4.00005 -1 13 8 17C5.94053 18.398 3.48716 19.099 1 19C10 24 21 19 21 7.50005C20.9991 7.2215 20.9723 6.94364 20.92 6.67005C21.9406 5.66354 22.6608 4.39276 23 3.00005Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="fill-[#1DA1F2] stroke-white stroke-[0.5]"
    />
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 0a12 12 0 00-3.8.6 12 12 0 00-8 11.2 12 12 0 001.6 6L0 24l6.3-1.6a12 12 0 005.7 1.5 12 12 0 0012-12A12 12 0 0012 0zm0 22a10 10 0 01-5-1.3l-.4-.2-3.7 1 1-3.6-.2-.4a10 10 0 01-1.5-5.3 10 10 0 018-9.2 10 10 0 019.2 8 10 10 0 01-8 10zm5.5-6.5l-1-.3a1 1 0 00-1 .3l-.5.5a1 1 0 01-1 0c-1-.5-2-1.6-2.6-2.6a1 1 0 010-1l.5-.5a1 1 0 00.3-1l-.3-1a1 1 0 00-1-.7h-1a1 1 0 00-1 1c0 2.6 2 5 2.6 5.6 2 2 4.5 2.6 5.6 2.6a1 1 0 001-1v-1a1 1 0 00-.6-1z" 
      className="fill-[#25D366] stroke-white stroke-[0.3]"
    />
  </svg>
);
const PlayIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// Welcome Modal Component
const WelcomeModal: React.FC<{
    isOpen: boolean;
    onClose: (themeKey: keyof typeof themes, difficulty: string) => void;
    challengeData?: { score: number; theme?: keyof typeof themes };
}> = ({ isOpen, onClose, challengeData }) => {
    const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>(challengeData?.theme || 'animals');
    const [difficulty, setDifficulty] = useState('medium');
    const [currentAnimation, setCurrentAnimation] = useState(0);
    const animationClasses = ['rotate-0', 'rotate-12', '-rotate-12', 'scale-110', 'scale-90'];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAnimation((prev) => (prev + 1) % animationClasses.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Sample cards for theme preview
    const getThemePreview = (theme: keyof typeof themes) => (
        <div className="flex justify-center gap-2">
            {themes[theme].slice(0, 3).map((emoji, idx) => (
                <motion.div
                    key={idx}
                    className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center 
                    bg-white text-2xl sm:text-3xl rounded-lg shadow-md`}
                    animate={{
                        rotate: theme === selectedTheme && idx === 0 ? [0, 5, -5, 0] : 0,
                        scale: theme === selectedTheme && idx === 1 ? [1, 1.1, 1] : 1,
                        y: theme === selectedTheme && idx === 2 ? [0, -5, 0] : 0
                    }}
                    transition={{
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 2,
                        ease: "easeInOut"
                    }}
                >
                    {emoji}
                </motion.div>
            ))}
        </div>
    );

    // Difficulty options and their descriptions
    const difficultyOptions = {
        easy: { label: 'Easy', description: 'More time, fewer cards' },
        medium: { label: 'Medium', description: 'Standard game' },
        hard: { label: 'Hard', description: 'Less time, more cards' },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-800/70 to-purple-900/70 backdrop-blur-sm z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                        {/* Header with animated cards */}
                        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-6 relative overflow-hidden">
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                            <motion.h1
                                className="text-white text-3xl sm:text-4xl font-bold relative z-10 text-center"
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Memory Match
                            </motion.h1>
                            <div className="flex justify-center mt-4 relative z-10">
                                <div className="relative">
                                    {Object.keys(themes).map((theme, index) => (
                                        <motion.div
                                            key={theme}
                                            className="absolute left-1/2 -translate-x-1/2"
                                            initial={{ scale: 0, rotate: 10 * index }}
                                            animate={{
                                                rotate: theme === selectedTheme ? animationClasses[currentAnimation].includes('rotate') ? parseInt(animationClasses[currentAnimation].replace('rotate-', '').replace('-', '-')) : 0 : 10 * index,
                                                scale: theme === selectedTheme ? animationClasses[currentAnimation].includes('scale') ? parseFloat(animationClasses[currentAnimation].replace('scale-', '')) / 100 : 1 : 0
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            {getThemePreview(theme as keyof typeof themes)}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {challengeData && (
                                <motion.div
                                    className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    Challenge Score: {challengeData.score}
                                </motion.div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {challengeData && (
                                <motion.div 
                                    className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p className="text-indigo-700 text-sm">
                                        <span className="font-semibold">Challenge Accepted!</span> You've been invited to beat a score of <span className="font-semibold">{challengeData.score}</span>. Good luck!
                                    </p>
                                </motion.div>
                            )}

                            <motion.p
                                className="text-gray-600 text-center mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Match pairs of cards with the same symbol to win! How fast can you match them all?
                            </motion.p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose Theme</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.keys(themes).map((theme) => (
                                            <motion.button
                                                key={theme}
                                                onClick={() => setSelectedTheme(theme as keyof typeof themes)}
                                                className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                                                    selectedTheme === theme
                                                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                                                        : 'bg-white border border-gray-200 hover:border-blue-300 text-gray-700'
                                                }`}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span className="text-sm capitalize">{theme}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Difficulty</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {Object.entries(difficultyOptions).map(([key, { label, description }]) => (
                                            <motion.button
                                                key={key}
                                                onClick={() => setDifficulty(key)}
                                                className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                                                    difficulty === key
                                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                                        : 'bg-white border border-gray-200 hover:border-indigo-300 text-gray-700'
                                                }`}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span className="text-sm font-medium">{label}</span>
                                                <span className="text-xs mt-1 opacity-80">{description}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    onClick={() => onClose(selectedTheme, difficulty)}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white py-3 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium"
                                    whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <PlayIcon /> Start Game
                                </motion.button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
                            <p>© 2025 Memory Match Game • Challenge your friends!</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Sound Effects Component
const useSoundEffects = () => {
    const [audioReady, setAudioReady] = useState(false);
    const flipSound = useRef<HTMLAudioElement | null>(null);
    const matchSound = useRef<HTMLAudioElement | null>(null);
    const victorySound = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        // Create audio elements
        flipSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3');
        matchSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
        victorySound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1010/1010-preview.mp3');
        
        // Set volume
        if (flipSound.current) flipSound.current.volume = 0.3;
        if (matchSound.current) matchSound.current.volume = 0.5;
        if (victorySound.current) victorySound.current.volume = 0.6;
        
        // Preload sounds to reduce latency
        Promise.all([
            flipSound.current.play().then(() => flipSound.current?.pause()).catch(() => null),
            matchSound.current.play().then(() => matchSound.current?.pause()).catch(() => null),
            victorySound.current.play().then(() => victorySound.current?.pause()).catch(() => null)
        ]).then(() => {
            setAudioReady(true);
        });
        
        return () => {
            // Cleanup
            if (flipSound.current) {
                flipSound.current.pause();
                flipSound.current = null;
            }
            if (matchSound.current) {
                matchSound.current.pause();
                matchSound.current = null;
            }
            if (victorySound.current) {
                victorySound.current.pause();
                victorySound.current = null;
            }
        };
    }, []);
    
    const playFlipSound = () => {
        if (audioReady && flipSound.current) {
            flipSound.current.currentTime = 0;
            flipSound.current.play().catch(() => null);
        }
    };
    
    const playMatchSound = () => {
        if (audioReady && matchSound.current) {
            matchSound.current.currentTime = 0;
            matchSound.current.play().catch(() => null);
        }
    };
    
    const playVictorySound = () => {
        if (audioReady && victorySound.current) {
            victorySound.current.currentTime = 0;
            victorySound.current.play().catch(() => null);
        }
    };
    
    return { playFlipSound, playMatchSound, playVictorySound };
};

const CardMatchingGame: React.FC = () => {
    const [cards, setCards] = useState<Card[]>([]);
    const [themeKey, setThemeKey] = useState<keyof typeof themes>('animals');
    const [difficulty, setDifficulty] = useState('medium');
    const [firstCard, setFirstCard] = useState<number | null>(null);
    const [secondCard, setSecondCard] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [matches, setMatches] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [inviteLink, setInviteLink] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [scoreHistory, setScoreHistory] = useState<{ time: number; score: number }[]>([]);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
    const [isPreviewPhase, setIsPreviewPhase] = useState(false);
    const [challengeData, setChallengeData] = useState<{ score: number; theme?: keyof typeof themes; difficulty?: string } | undefined>(undefined);
    const { playFlipSound, playMatchSound, playVictorySound } = useSoundEffects();

    const initializeGame = useCallback((selectedTheme: keyof typeof themes, selectedDifficulty: string) => {
        setDifficulty(selectedDifficulty);
        const selectedThemeData = themes[selectedTheme];
        
        // Adjust number of cards based on difficulty
        let gamePairs = [...selectedThemeData];
        if (selectedDifficulty === 'easy') {
            gamePairs = gamePairs.slice(0, 4); // Fewer cards for easy mode
        } else if (selectedDifficulty === 'hard') {
            // Use all pairs and potentially add more in the future
        }
        
        const shuffled = [...gamePairs, ...gamePairs]
            .sort(() => Math.random() - 0.5)
            .map((content, index) => ({
                id: index,
                content,
                isFlipped: true, // Initially flipped for preview phase
                isMatched: false,
            }));
            
        setCards(shuffled);
        
        // Set time based on difficulty
        setTimeLeft(selectedDifficulty === 'easy' ? 90 : selectedDifficulty === 'hard' ? 45 : 60);
        
        setScore(0);
        setMatches(0);
        setWrongAttempts(0);
        setGameStarted(false); // Game starts after preview phase
        setGameOver(false);
        setFirstCard(null);
        setSecondCard(null);
        setIsPreviewPhase(true); // Enable preview phase
        
        // Create challenge link with both score, theme and difficulty
        setInviteLink(`${window.location.origin}/?challenge=${Date.now()}&theme=${selectedTheme}&difficulty=${selectedDifficulty}`);
        
        setScoreHistory([{ time: 0, score: 0 }]);
        setThemeKey(selectedTheme);
        setIsWelcomeOpen(false);

        // End preview phase after 5 seconds
        setTimeout(() => {
            setCards((prev) =>
                prev.map((card) => ({ ...card, isFlipped: false }))
            );
            setIsPreviewPhase(false);
            setGameStarted(true);
        }, 5000);
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameStarted && timeLeft > 0 && !gameOver) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setGameOver(true);
        }
        return () => clearInterval(timer);
    }, [gameStarted, timeLeft, gameOver]);

    useEffect(() => {
        if (firstCard !== null && secondCard !== null) {
            const card1 = cards[firstCard];
            const card2 = cards[secondCard];
            if (card1.content === card2.content) {
                setCards((prev) =>
                    prev.map((card) =>
                        card.id === firstCard || card.id === secondCard
                            ? { ...card, isMatched: true }
                            : card
                    )
                );
                setScore((prev) => {
                    const newScore = prev + 10;
                    setScoreHistory((prevHistory) => [...prevHistory, { time: 60 - timeLeft, score: newScore }]);
                    return newScore;
                });
                setMatches((prev) => prev + 1);
                playMatchSound();
            } else {
                setWrongAttempts((prev) => prev + 1);
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((card) =>
                            card.id === firstCard || card.id === secondCard
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                }, 1000);
            }
            setFirstCard(null);
            setSecondCard(null);
        }
    }, [firstCard, secondCard, cards, timeLeft, playMatchSound]);

    useEffect(() => {
        if (matches === cards.length / 2 && gameStarted && cards.length > 0) {
            setGameOver(true);
            playVictorySound();
        }
    }, [matches, cards.length, gameStarted, playVictorySound]);

    const handleCardClick = (id: number) => {
        if (!gameStarted || gameOver || firstCard === id || isPreviewPhase) return;
        const card = cards.find((c) => c.id === id);
        if (!card || card.isFlipped || card.isMatched) return;

        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
        );

        playFlipSound();

        if (firstCard === null) {
            setFirstCard(id);
        } else if (secondCard === null) {
            setSecondCard(id);
        }
    };

    // Parse URL parameters for challenges
    useEffect(() => {
        const parseUrlParams = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const challengeParam = urlParams.get('challenge');
            
            if (challengeParam) {
                const challengeScore = urlParams.get('score');
                const challengeTheme = urlParams.get('theme') as keyof typeof themes | null;
                const challengeDifficulty = urlParams.get('difficulty');
                
                // Validate theme
                const validTheme = challengeTheme && Object.keys(themes).includes(challengeTheme) 
                    ? challengeTheme as keyof typeof themes 
                    : undefined;
                
                // Validate difficulty
                const validDifficulty = challengeDifficulty && 
                    ['easy', 'medium', 'hard'].includes(challengeDifficulty)
                    ? challengeDifficulty
                    : undefined;
                
                if (challengeScore) {
                    setChallengeData({ 
                        score: parseInt(challengeScore, 10), 
                        theme: validTheme,
                        difficulty: validDifficulty
                    });
                    
                    // Set the initial state based on challenge parameters
                    if (validTheme) {
                        setThemeKey(validTheme);
                    }
                    
                    if (validDifficulty) {
                        setDifficulty(validDifficulty);
                    }
                    
                    setIsWelcomeOpen(true);
                    
                    // Clean URL without reloading the page
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        };
        
        parseUrlParams();
    }, []);

    const summaryData = {
        time: 60 - timeLeft,
        score,
        matches,
        totalPairs: cards.length / 2,
        accuracy: cards.length > 0 ? (matches / (matches + wrongAttempts)) * 100 : 0,
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4 sm:p-6"
            style={{ fontFamily: theme.typography.fontFamily }}
            id="game-container"
        >
            <MobileViewport />

            {/* Decorative background elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-indigo-200/20 blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl"></div>
                <div className="absolute top-1/4 right-1/4 w-40 h-40 rounded-full bg-blue-200/20 blur-2xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <Header title="Memory Match" />

                {/* Preview phase message */}
                {isPreviewPhase && (
                    <motion.div 
                        className="bg-indigo-600/80 backdrop-blur-sm text-white p-4 mb-6 rounded-lg shadow-lg text-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <h2 className="text-xl font-bold mb-1">Memorize the cards!</h2>
                        <p>Cards will flip in a few seconds. Remember their positions!</p>
                    </motion.div>
                )}

                {(gameStarted || isPreviewPhase) && (
                    <>
                        <StatusBar
                            timeLeft={timeLeft}
                            score={score}
                            matches={matches}
                            totalPairs={cards.length / 2}
                            progress={cards.length > 0 ? (matches / (cards.length / 2)) * 100 : 0}
                        />
                        <CardGrid cards={cards} onCardClick={handleCardClick} />
                        <div className="mt-6 flex justify-center">
                            <motion.button
                                onClick={() => setIsInviteOpen(true)}
                                className="px-6 py-3 text-white font-medium bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 flex items-center gap-2 group"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isPreviewPhase}
                                style={{ opacity: isPreviewPhase ? 0.7 : 1 }}
                            >
                                <motion.div
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                    className="relative w-5 h-5 rounded-full bg-white/20"
                                >
                                    <motion.div className="absolute inset-0.5 rounded-full bg-white/80"></motion.div>
                                </motion.div>
                                <span>Challenge Friends</span>
                                <motion.svg 
                                    className="w-5 h-5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    initial={{ x: 0 }}
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </motion.svg>
                            </motion.button>
                        </div>
                        <InviteModal
                            isOpen={isInviteOpen}
                            onClose={() => setIsInviteOpen(false)}
                            inviteLink={inviteLink}
                        />
                    </>
                )}

                <SummaryDialog
                    isOpen={gameOver}
                    onClose={() => {
                        setGameOver(false);
                        setIsWelcomeOpen(true);
                    }}
                    summary={summaryData}
                    scoreHistory={scoreHistory}
                />

                <WelcomeModal
                    isOpen={isWelcomeOpen}
                    onClose={initializeGame}
                    challengeData={challengeData}
                />
            </div>
        </div>
    );
};

export default CardMatchingGame;