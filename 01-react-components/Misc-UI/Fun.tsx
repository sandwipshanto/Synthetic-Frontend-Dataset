import React, { useState, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Add this effect to set meta viewport tag for mobile
const ViewportMetaTag: React.FC = () => {
  useEffect(() => {
    // Create or update viewport meta tag
    let viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    // Add touch-action css to body to prevent unwanted gestures but allow scrolling
    document.body.style.touchAction = 'pan-y';
    document.body.style.overflowX = 'hidden';
    document.body.style.width = '100%';
    
    // Only restrict scrolling on mobile devices
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Allow scrolling on desktop
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
    
    // Prevent zoom on double tap but still allow scrolling
    document.addEventListener('touchend', e => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - (window as any).lastTouchEnd < DOUBLE_TAP_DELAY) {
        e.preventDefault();
      }
      (window as any).lastTouchEnd = now;
    });
  }, []);
  
  return null;
};

// Mobile detection utility
const isMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768;
  }
  return false;
};

// Get mobile grid configuration - 3x4 grid for mobile regardless of difficulty
const getMobileGridConfig = (difficulty: Difficulty) => {
  // Always return a 3x4 grid for mobile (3 columns, 4 rows), regardless of difficulty level
  return { rows: 4, cols: 3 };
};

type Card = { id: number; content: string; isFlipped: boolean; isMatched: boolean };
type Difficulty = 'easy' | 'medium' | 'hard';
type Theme = 'animals' | 'fruits' | 'shapes' | 'colors';

// Game configuration settings
const themes: Record<Theme, string[]> = {
  animals: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦉'],
  fruits: ['🍎', '🍌', '🍓', '🍇', '🍉', '🍍', '🥝', '🍒', '🍑', '🍊', '🍋', '🍐', '🥭', '🍈', '🥥', '🍏'],
  shapes: ['▲', '●', '■', '◆', '★', '♥', '♣', '♠', '⚫', '⚪', '🔶', '🔷', '🔸', '🔹', '⬆️', '🔻'],
  colors: ['#FF5733', '#33FFF5', '#3369FF', '#F033FF', '#F3FF33', '#33FF39', '#FF3384', '#33FFBD', '#8033FF', '#FF8033', '#BCFF33', '#33BCFF', '#FF33BC', '#33FF81', '#8133FF', '#FFA533'],
};

const difficulties: Record<Difficulty, { rows: number; cols: number; time: number }> = {
  easy: { rows: 4, cols: 4, time: 60 },
  medium: { rows: 5, cols: 4, time: 90 },
  hard: { rows: 6, cols: 4, time: 120 },
};

// Performance tracking
type Performance = {
  date: string;
  theme: Theme;
  difficulty: Difficulty;
  moves: number;
  timeSpent: number;
  matches: number;
  totalPairs: number;
  completed: boolean;
};

type GameState = {
  cards: Card[];
  flippedCards: number[];
  moves: number;
  timeLeft: number;
  isGameOver: boolean;
  matches: number;
  isPaused: boolean;
  gameStartedAt: number;
  friendInviteLink?: string;
  gameHistory: Performance[];
  bestTime: number | null;
  bestMoves: number | null;
};

const initialGameState = (theme: Theme, difficulty: Difficulty, savedHistory: Performance[] = []): GameState => ({
  cards: generateCards(theme, difficulty),
  flippedCards: [],
  moves: 0,
  timeLeft: difficulties[difficulty].time,
  isGameOver: false,
  matches: 0,
  isPaused: false,
  gameStartedAt: Date.now(),
  gameHistory: savedHistory,
  bestTime: null,
  bestMoves: null,
});

const gameReducer = (state: GameState, action: any): GameState => {
  switch (action.type) {
    case 'FLIP_CARD':
      return { 
        ...state, 
        cards: state.cards.map(card => card.id === action.id ? { ...card, isFlipped: true } : card), 
        flippedCards: [...state.flippedCards, action.id], 
        moves: state.moves + 1 
      };
    case 'MATCH_CARDS':
      return { 
        ...state, 
        cards: state.cards.map(card => state.flippedCards.includes(card.id) ? { ...card, isMatched: true } : card), 
        flippedCards: [], 
        matches: state.matches + 1 
      };
    case 'RESET_FLIPPED':
      return { 
        ...state, 
        cards: state.cards.map(card => !card.isMatched ? { ...card, isFlipped: false } : card), 
        flippedCards: [] 
      };
    case 'TICK':
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'GAME_OVER':
      const newPerformance: Performance = {
        date: new Date().toLocaleString(),
        theme: action.theme,
        difficulty: action.difficulty,
        moves: state.moves,
        timeSpent: difficulties[action.difficulty].time - state.timeLeft,
        matches: state.matches,
        totalPairs: state.cards.length / 2,
        completed: state.matches === state.cards.length / 2
      };
      
      let bestTime = state.bestTime;
      let bestMoves = state.bestMoves;
      
      // Update best records if this game was completed
      if (newPerformance.completed) {
        if (bestTime === null || newPerformance.timeSpent < bestTime) {
          bestTime = newPerformance.timeSpent;
        }
        if (bestMoves === null || newPerformance.moves < bestMoves) {
          bestMoves = newPerformance.moves;
        }
      }
      
      return { 
        ...state, 
        isGameOver: true,
        gameHistory: [...state.gameHistory, newPerformance],
        bestTime,
        bestMoves
      };
    case 'PAUSE':
      return { ...state, isPaused: !state.isPaused };
    case 'CREATE_INVITE':
      return { ...state, friendInviteLink: `${window.location.origin}?challenge=${action.theme}-${action.difficulty}` };
    case 'RESET':
      return { 
        ...action.payload, 
        isGameOver: false, 
        isPaused: false,
        gameHistory: state.gameHistory,
        bestTime: state.bestTime,
        bestMoves: state.bestMoves
      };
    default:
      return state;
  }
};

const generateCards = (theme: Theme, difficulty: Difficulty): Card[] => {
  // Use mobile grid configuration if on mobile device
  const gridConfig = isMobile() ? getMobileGridConfig(difficulty) : difficulties[difficulty];
  const { rows, cols } = gridConfig;
  const totalCards = rows * cols;
  const cardCount = totalCards / 2;
  
  // Make sure we only use the exact number of icons needed
  const themeCards = themes[theme].slice(0, cardCount);
  
  // Create pairs of cards with unique IDs
  const cards = [...themeCards, ...themeCards].map((content, index) => ({
    id: index,
    content,
    isFlipped: false,
    isMatched: false
  }));
  
  // Return shuffled cards
  return cards.sort(() => Math.random() - 0.5);
};

// Function to load game history from local storage
const loadGameHistory = (): Performance[] => {
  try {
    const savedHistory = localStorage.getItem('matchingGameHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch {
    return [];
  }
};

// Function to save game history to local storage
const saveGameHistory = (history: Performance[]) => {
  try {
    localStorage.setItem('matchingGameHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving game history:', error);
  }
};

const MatchingGame: React.FC = () => {
  // Try to parse challenge from URL if it exists
  const getInitialSettings = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const challenge = urlParams.get('challenge');
      if (challenge) {
        const [theme, difficulty] = challenge.split('-') as [Theme, Difficulty];
        if (themes[theme] && difficulties[difficulty]) {
          return { theme, difficulty };
        }
      }
    } catch {}
    
    return { theme: 'animals' as Theme, difficulty: 'easy' as Difficulty };
  };

  const { theme: initialTheme, difficulty: initialDifficulty } = getInitialSettings();
  
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Force update layout when window resizes
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
    };
    
    // Run once on mount
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Load saved history
  const savedHistory = loadGameHistory();
  
  const [state, dispatch] = useReducer(gameReducer, initialGameState(theme, difficulty, savedHistory));

  useEffect(() => {
    if (!state.isGameOver && state.timeLeft > 0 && !state.isPaused && state.matches < state.cards.length / 2) {
      const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000);
      return () => clearInterval(timer);
    }
    if (state.timeLeft <= 0) dispatch({ type: 'GAME_OVER', theme, difficulty });
  }, [state.timeLeft, state.isGameOver, state.isPaused, state.matches]);

  useEffect(() => {
    if (state.flippedCards.length === 2) {
      const [first, second] = state.flippedCards;
      const firstCard = state.cards.find(c => c.id === first)!;
      const secondCard = state.cards.find(c => c.id === second)!;
      if (firstCard.content === secondCard.content) dispatch({ type: 'MATCH_CARDS' });
      else setTimeout(() => dispatch({ type: 'RESET_FLIPPED' }), 1000);
    }
  }, [state.flippedCards]);

  useEffect(() => {
    // Check if game is completed
    if (state.matches === state.cards.length / 2 && state.matches > 0 && !state.isGameOver) {
      dispatch({ type: 'GAME_OVER', theme, difficulty });
    }
  }, [state.matches]);
  
  // Save history when it changes
  useEffect(() => {
    if (state.gameHistory.length > 0) {
      saveGameHistory(state.gameHistory);
    }
  }, [state.gameHistory]);

  useEffect(() => {
    if (gameStarted) {
      dispatch({ type: 'RESET', payload: initialGameStateInComponent(theme, difficulty, state.gameHistory) });
    }
  }, [difficulty, theme]);

  const handleCardClick = (id: number) => {
    if (state.flippedCards.length >= 2 || state.isGameOver || state.isPaused || state.cards.find(c => c.id === id)!.isFlipped) return;
    dispatch({ type: 'FLIP_CARD', id });
  };

  // This function needs to be moved inside the component to access the isMobileView state
  const generateMobileCards = (theme: Theme, difficulty: Difficulty): Card[] => {
    // Use mobile grid configuration if on mobile device
    const gridConfig = isMobileView ? getMobileGridConfig(difficulty) : difficulties[difficulty];
    const { rows, cols } = gridConfig;
    const totalCards = rows * cols;
    const cardCount = totalCards / 2;
    
    // Make sure we only use the exact number of icons needed for the current difficulty
    const themeCards = themes[theme].slice(0, cardCount);
    
    // Create pairs of cards
    const cards = [...themeCards, ...themeCards].map((content, index) => ({
      id: index,
      content,
      isFlipped: false,
      isMatched: false
    }));
    
    // Return shuffled cards
    return cards.sort(() => Math.random() - 0.5);
  };

  // initialGameState moved inside the component to access isMobileView
  const initialGameStateInComponent = (theme: Theme, difficulty: Difficulty, savedHistory: Performance[] = []): GameState => ({
    cards: generateMobileCards(theme, difficulty),
    flippedCards: [],
    moves: 0,
    timeLeft: difficulties[difficulty].time,
    isGameOver: false,
    matches: 0,
    isPaused: false,
    gameStartedAt: Date.now(),
    gameHistory: savedHistory,
    bestTime: null,
    bestMoves: null,
  });

  const startGame = () => {
    dispatch({ type: 'RESET', payload: initialGameStateInComponent(theme, difficulty, state.gameHistory) });
    setGameStarted(true);
  };

  const resetGame = () => {
    dispatch({ type: 'RESET', payload: initialGameStateInComponent(theme, difficulty, state.gameHistory) });
  };

  const shareGame = () => {
    dispatch({ type: 'CREATE_INVITE', theme, difficulty });
    setShowShareModal(true);
  };

  const copyInviteLink = () => {
    if (state.friendInviteLink) {
      navigator.clipboard.writeText(state.friendInviteLink);
      alert('Challenge link copied to clipboard!');
    }
  };

  const themeStyles = isDarkMode
    ? { 
        bg: 'bg-gray-900', 
        text: 'text-white', 
        card: 'bg-gray-700', 
        cardMatched: 'bg-green-600', 
        header: 'bg-gray-800', 
        button: 'bg-gray-600 hover:bg-gray-500', 
        gradient: 'bg-gradient-to-r from-gray-600 to-gray-700',
        difficulty: 'bg-gray-700',
        progressBg: 'bg-gray-700',
        progressFill: 'bg-blue-500'
      }
    : { 
        bg: 'bg-white', 
        text: 'text-gray-800', 
        card: 'bg-blue-100', 
        cardMatched: 'bg-[#106BDA]', 
        header: 'bg-gradient-to-r from-blue-50 to-blue-100', 
        button: 'bg-[#106BDA] hover:bg-blue-600', 
        gradient: 'bg-gradient-to-r from-[#106BDA] to-blue-600',
        difficulty: 'bg-blue-100',
        progressBg: 'bg-gray-200',
        progressFill: 'bg-blue-500'
      };

  // Calculate progress percentage
  const progressPercentage = Math.round((state.matches / (state.cards.length / 2)) * 100);

  if (!gameStarted) {
    return (
      <div className={`${themeStyles.bg} ${themeStyles.text} min-h-screen flex items-center justify-center p-4 font-sans`}>
        <ViewportMetaTag />
        <div className={`${themeStyles.header} bg-opacity-90 p-6 md:p-8 rounded-xl w-full max-w-lg shadow-xl`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Matching Game</h2>
          
          <div className="mb-8">
            <label className="block mb-3 font-medium text-lg">Difficulty</label>
            <select 
              value={difficulty} 
              onChange={e => setDifficulty(e.target.value as Difficulty)} 
              className={`${themeStyles.header} p-4 rounded-lg w-full border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {Object.keys(difficulties).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          
          <div className="mb-8">
            <label className="block mb-3 font-medium text-lg">Theme</label>
            <select 
              value={theme} 
              onChange={e => setTheme(e.target.value as Theme)} 
              className={`${themeStyles.header} p-4 rounded-lg w-full border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {Object.keys(themes).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            
            {theme !== 'colors' && (
              <div className="mt-4 text-2xl text-center p-4 rounded-lg bg-opacity-50 ${themeStyles.difficulty}">{themes[theme].slice(0, 8).join(' ')}</div>
            )}
            
            {theme === 'colors' && (
              <div className="mt-4 grid grid-cols-8 gap-2 rounded-lg p-4 bg-opacity-50 ${themeStyles.difficulty}">
                {themes.colors.slice(0, 8).map((color, index) => (
                  <div key={index} className="w-full aspect-square rounded-full" style={{ backgroundColor: color }}></div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={startGame} 
            className={`${themeStyles.gradient} px-6 py-5 rounded-lg w-full text-white shadow-lg hover:shadow-xl transition-all duration-300 uppercase text-xl font-medium`}
          >
            Start Game
          </button>
          
          {state.gameHistory.length > 0 && (
            <button 
              onClick={() => setShowStats(!showStats)} 
              className={`mt-5 ${themeStyles.gradient} px-6 py-4 rounded-lg w-full text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-lg font-medium`}
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
          )}
          
          {showStats && state.gameHistory.length > 0 && (
            <div className="mt-6 p-5 rounded-lg bg-opacity-50 ${themeStyles.card}">
              <h3 className="text-xl font-bold mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 gap-3 text-base">
                <div>Games Played:</div>
                <div className="text-right font-medium">{state.gameHistory.length}</div>
                
                <div>Games Completed:</div>
                <div className="text-right font-medium">
                  {state.gameHistory.filter(game => game.completed).length}
                </div>
                
                <div>Best Time:</div>
                <div className="text-right font-medium">
                  {state.bestTime ? `${state.bestTime}s` : 'N/A'}
                </div>
                
                <div>Best Moves:</div>
                <div className="text-right font-medium">
                  {state.bestMoves || 'N/A'}
                </div>
              </div>
              
              <h4 className="text-lg font-bold mt-5 mb-3">Recent Games</h4>
              <div className="max-h-60 overflow-y-auto">
                {state.gameHistory.slice(-5).reverse().map((game, idx) => (
                  <div key={idx} className={`text-base p-3 mb-3 rounded ${idx % 2 === 0 ? themeStyles.card : ''}`}>
                    <div className="flex justify-between">
                      <span>{game.theme} ({game.difficulty})</span>
                      <span>{game.completed ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>{game.moves} moves in {game.timeSpent}s</span>
                      <span>{game.date.split(',')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Special rendering for the colors theme
  const renderCardContent = (card: Card) => {
    if (theme === 'colors') {
      return (
        <div 
          className="absolute w-[85%] h-[85%] rounded-full" 
          style={{ backgroundColor: card.content }}
        ></div>
      );
    }
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute w-[80%] h-[80%] flex items-center justify-center"
        style={{
          fontSize: isMobileView ? '4.5rem' : '1.875rem', // Extremely large font on mobile for better visibility
          lineHeight: 1
        }}
      >
        {card.content}
      </motion.span>
    );
  };

  return (
    <div className={`${themeStyles.bg} ${themeStyles.text} min-h-screen flex flex-col items-center p-2 sm:p-4 font-sans text-sm`}>
      <ViewportMetaTag />
      <header className="w-full max-w-3xl mb-3 sm:mb-6">
        <div className={`${themeStyles.header} p-3 sm:p-6 rounded-xl shadow-lg`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="flex flex-col items-center">
              <span className="text-xs opacity-75">Moves</span>
              <span className="font-bold text-lg">{state.moves}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs opacity-75">Time</span>
              <span className="font-bold text-lg">{state.timeLeft}s</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs opacity-75">Matches</span>
              <span className="font-bold text-lg">{state.matches}/{state.cards.length / 2}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs opacity-75">Difficulty</span>
              <span className="font-bold text-lg">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className={`w-full h-2 ${themeStyles.progressBg} rounded mb-4`}>
            <div 
              className={`h-full ${themeStyles.progressFill} rounded transition-all duration-300`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => dispatch({ type: 'PAUSE' })} 
              className={`${themeStyles.gradient} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-1`}
            >
              {state.isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button 
              onClick={resetGame} 
              className={`${themeStyles.gradient} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-1`}
            >
              🔄 Reset
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`${themeStyles.gradient} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-1`}
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              onClick={() => setGameStarted(false)} 
              className={`${themeStyles.gradient} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-1`}
            >
              🏠 Menu
            </button>
            <button 
              onClick={shareGame} 
              className={`${themeStyles.gradient} px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-1`}
            >
              👥 Challenge
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl flex items-center justify-center overflow-visible">
        {/* Unified grid for both mobile and desktop - always 3x4 with scrolling on desktop */}
        <div 
          className="grid w-full overflow-y-auto"
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: isMobileView ? '0.75rem' : '1rem',
            width: '100%', 
            maxWidth: '100%',
            minHeight: isMobileView ? '60vh' : 'auto',
            maxHeight: isMobileView ? '70vh' : '75vh',
            margin: '0 auto',
            padding: isMobileView ? '0 0.75rem' : '1rem',
            touchAction: 'manipulation',
            boxSizing: 'border-box',
            perspective: '1000px',
            overflowY: isMobileView ? 'hidden' : 'auto',
            alignItems: 'start'
          }}
        >
          {state.cards.slice(0, 12).map(card => (
            <motion.div
              key={card.id}
              className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center shadow-lg relative ${card.isMatched ? themeStyles.cardMatched : themeStyles.card} ${!card.isFlipped && !card.isMatched ? 'hover:shadow-xl hover:scale-105' : ''}`}
              style={{ 
                transformStyle: 'preserve-3d',
                minHeight: '120px'
              }}
              onClick={() => handleCardClick(card.id)}
              animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
              transition={{ duration: isMobileView ? 0.3 : 0.5 }}
              role="button"
              aria-label={`Card ${card.id} ${card.isFlipped ? 'flipped' : 'face down'}`}
            >
              <AnimatePresence>
                {(card.isFlipped || card.isMatched) && renderCardContent(card)}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </main>

      {(state.isGameOver || state.matches === state.cards.length / 2 || state.isPaused) && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10"
        >
          <div className={`${themeStyles.header} p-5 sm:p-8 rounded-xl text-center shadow-lg max-w-md w-full`}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-6">
              {state.isPaused ? '⏸️ Paused' : state.isGameOver ? '🎮 Game Over!' : '🎉 Congratulations!'}
            </h2>
            {!state.isPaused && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-75">Moves</span>
                    <span className="font-bold text-lg">{state.moves}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-75">Time Used</span>
                    <span className="font-bold text-lg">{difficulties[difficulty].time - state.timeLeft}s</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-75">Matches</span>
                    <span className="font-bold text-lg">{state.matches}/{state.cards.length / 2}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-75">Accuracy</span>
                    <span className="font-bold text-lg">
                      {state.matches > 0 ? Math.round((state.matches / (state.moves / 2)) * 100) : 0}%
                    </span>
                  </div>
                </div>
              
                <div className="mb-6">
                  {state.matches === state.cards.length / 2 && (
                    <div className="mb-3 py-2 px-4 rounded bg-green-500 bg-opacity-20 text-green-300">
                      <p className="font-medium">
                        {state.bestMoves !== null && state.moves <= state.bestMoves 
                          ? '🏆 New Record! Lowest number of moves!' 
                          : ''}
                      </p>
                      <p className="font-medium">
                        {state.bestTime !== null && difficulties[difficulty].time - state.timeLeft <= state.bestTime 
                          ? '⚡ New Record! Fastest completion time!' 
                          : ''}
                      </p>
                    </div>
                  )}
                  
                  <div className={`p-3 text-sm rounded ${themeStyles.card} text-left`}>
                    <p className="mb-2">
                      {state.matches === state.cards.length / 2 
                        ? `You completed the ${difficulty} level with the "${theme}" theme in ${difficulties[difficulty].time - state.timeLeft} seconds!` 
                        : `You matched ${state.matches} out of ${state.cards.length / 2} pairs.`}
                    </p>
                    <p>
                      {state.matches === state.cards.length / 2 
                        ? 'Try a higher difficulty or challenge a friend!' 
                        : 'You can do better! Try again.'}
                    </p>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={resetGame} 
                className={`${themeStyles.gradient} px-6 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-2`}
              >
                🎮 New Game
              </button>
              {!state.isPaused && (
                <>
                  <button 
                    onClick={() => setGameStarted(false)} 
                    className={`${themeStyles.gradient} px-6 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-2`}
                  >
                    🏠 Main Menu
                  </button>
                  <button 
                    onClick={shareGame} 
                    className={`${themeStyles.gradient} px-6 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-2`}
                  >
                    👥 Challenge
                  </button>
                </>
              )}
              {state.isPaused && (
                <button 
                  onClick={() => dispatch({ type: 'PAUSE' })} 
                  className={`${themeStyles.gradient} px-6 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-xs sm:text-sm font-medium flex items-center gap-2`}
                >
                  ▶️ Resume
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {showShareModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-20"
        >
          <div className={`${themeStyles.header} p-6 rounded-xl text-center shadow-lg max-w-md w-full`}>
            <h3 className="text-xl font-bold mb-4">Challenge a Friend</h3>
            <p className="mb-4">Share this link with a friend to challenge them to beat your score:</p>
            <div className={`p-3 rounded ${themeStyles.card} flex items-center mb-6`}>
              <input 
                type="text" 
                readOnly 
                value={state.friendInviteLink || ''} 
                className="bg-transparent border-none outline-none flex-grow mr-2 text-sm overflow-ellipsis"
              />
              <button 
                onClick={copyInviteLink} 
                className={`${themeStyles.gradient} p-2 rounded-lg text-white shadow-md hover:shadow-lg transition-all`}
              >
                Copy
              </button>
            </div>
            <button 
              onClick={() => setShowShareModal(false)} 
              className={`${themeStyles.gradient} px-6 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-300 uppercase text-sm font-medium w-full`}
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MatchingGame;