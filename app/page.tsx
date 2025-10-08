"use client";

import { useState, useEffect, useCallback } from 'react';

type Player = 'X' | 'O' | null;
type BoardState = Player[];
type GameStatus = 'playing' | 'won' | 'draw';

interface GameStats {
  xWins: number;
  oWins: number;
  draws: number;
  gamesPlayed: number;
}

interface GameMove {
  player: 'X' | 'O';
  position: number;
  timestamp: number;
}

export default function AutoTicTacToe() {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [stats, setStats] = useState<GameStats>({ xWins: 0, oWins: 0, draws: 0, gamesPlayed: 0 });
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [moveHistory, setMoveHistory] = useState<GameMove[]>([]);

  // Winning combinations
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  // Check for winner
  const checkWinner = useCallback((board: BoardState): { winner: Player; line: number[] } => {
    for (const [a, b, c] of winningCombinations) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: [a, b, c] };
      }
    }
    return { winner: null, line: [] };
  }, []);

  // Check for draw
  const checkDraw = useCallback((board: BoardState): boolean => {
    return board.every(cell => cell !== null) && !checkWinner(board).winner;
  }, [checkWinner]);

  // Get available moves
  const getAvailableMoves = useCallback((board: BoardState): number[] => {
    return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
  }, []);

  // AI Move with different strategies for X and O
  const makeAIMove = useCallback((board: BoardState, player: 'X' | 'O'): number => {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;

    // Try to win
    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = player;
      if (checkWinner(newBoard).winner === player) return move;
    }

    // Block opponent
    const opponent = player === 'X' ? 'O' : 'X';
    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = opponent;
      if (checkWinner(newBoard).winner === opponent) return move;
    }

    // Strategic moves based on player
    if (player === 'X') {
      // X is more aggressive - prefers center and corners
      if (availableMoves.includes(4)) return 4; // Center
      const corners = [0, 2, 6, 8].filter(corner => availableMoves.includes(corner));
      if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    } else {
      // O is more defensive - prefers edges if center taken
      const edges = [1, 3, 5, 7].filter(edge => availableMoves.includes(edge));
      if (edges.length > 0) return edges[Math.floor(Math.random() * edges.length)];
    }

    // Random move from available
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }, [checkWinner, getAvailableMoves]);

  // Make a move
  const makeMove = useCallback((player: 'X' | 'O') => {
    const moveIndex = makeAIMove(board, player);
    if (moveIndex === -1) return;

    const newBoard = [...board];
    newBoard[moveIndex] = player;
    setBoard(newBoard);

    // Add to move history
    setMoveHistory(prev => [...prev, {
      player,
      position: moveIndex,
      timestamp: Date.now()
    }]);

    const { winner: newWinner, line } = checkWinner(newBoard);
    
    if (newWinner) {
      setWinner(newWinner);
      setStatus('won');
      setWinningLine(line);
      setStats(prev => ({
        ...prev,
        [`${newWinner}Wins`]: prev[`${newWinner}Wins` as keyof GameStats] as number + 1,
        gamesPlayed: prev.gamesPlayed + 1
      }));
    } else if (checkDraw(newBoard)) {
      setStatus('draw');
      setStats(prev => ({ 
        ...prev, 
        draws: prev.draws + 1,
        gamesPlayed: prev.gamesPlayed + 1
      }));
    } else {
      setCurrentPlayer(player === 'X' ? 'O' : 'X');
    }
  }, [board, makeAIMove, checkWinner, checkDraw]);

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine([]);
    setMoveHistory([]);
  };

  // Reset stats
  const resetStats = () => {
    setStats({ xWins: 0, oWins: 0, draws: 0, gamesPlayed: 0 });
  };

  // Auto play effect
  useEffect(() => {
    if (isAutoPlaying && status === 'playing') {
      const timer = setTimeout(() => {
        makeMove(currentPlayer);
      }, gameSpeed);

      return () => clearTimeout(timer);
    }
  }, [isAutoPlaying, status, currentPlayer, makeMove, gameSpeed]);

  // Auto restart effect
  useEffect(() => {
    if (isAutoPlaying && status !== 'playing') {
      const timer = setTimeout(() => {
        resetGame();
      }, 2000); // Wait 2 seconds before restarting

      return () => clearTimeout(timer);
    }
  }, [isAutoPlaying, status]);

  // Get status message
  const getStatusMessage = () => {
    if (status === 'won') {
      return (
        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          {winner} Wins! 🎉
        </span>
      );
    }
    if (status === 'draw') {
      return (
        <span className="text-2xl font-bold text-gray-600">
          It's a Draw! 🤝
        </span>
      );
    }
    return (
      <span className="text-2xl font-bold text-gray-800">
        Current Player: 
        <span className={currentPlayer === 'X' ? 'text-blue-600 ml-2' : 'text-red-600 ml-2'}>
          {currentPlayer}
        </span>
        <span className="text-sm text-gray-500 ml-2">(Thinking...)</span>
      </span>
    );
  };

  // Render cell with animation
  const renderCell = (index: number) => {
    const isWinningCell = winningLine.includes(index);
    const value = board[index];
    const isLatestMove = moveHistory.length > 0 && moveHistory[moveHistory.length - 1].position === index;
    
    let cellClass = `
      w-20 h-20 md:w-24 md:h-24 flex items-center justify-center 
      text-3xl md:text-4xl font-bold rounded-xl transition-all duration-300 
      border-3 relative
    `;

    if (isWinningCell) {
      cellClass += ' bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-500 text-white shadow-2xl scale-105';
    } else if (isLatestMove) {
      cellClass += ' bg-gradient-to-br from-purple-100 to-blue-100 border-purple-300 shadow-lg scale-102';
    } else {
      cellClass += ' bg-white border-gray-200 shadow-md';
    }

    return (
      <div className={cellClass}>
        {value && (
          <span className={value === 'X' ? 'text-blue-600' : 'text-red-600'}>
            {value}
          </span>
        )}
        {isLatestMove && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Auto Tic Tac Toe
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Watch AI players battle it out in an endless Tic Tac Toe tournament!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Game Board */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Status */}
            <div className="text-center mb-8 h-12 flex items-center justify-center">
              {getStatusMessage()}
            </div>

            {/* Board */}
            <div className="grid grid-cols-3 gap-3 justify-center mb-8 max-w-md mx-auto">
              {Array(9).fill(null).map((_, index) => renderCell(index))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-6 py-3 font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isAutoPlaying 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white hover:from-gray-600 hover:to-slate-600'
                }`}
              >
                {isAutoPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🔄 Restart Game
              </button>

              <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2">
                <span className="text-sm font-medium text-gray-700">Speed:</span>
                <select 
                  value={gameSpeed}
                  onChange={(e) => setGameSpeed(Number(e.target.value))}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  <option value={2000}>Slow</option>
                  <option value={1000}>Normal</option>
                  <option value={500}>Fast</option>
                  <option value={200}>Very Fast</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats & Info */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Tournament Stats</h2>
              <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-blue-600">{stats.xWins}</div>
                  <div className="text-sm text-gray-600 font-medium">X Wins</div>
                </div>
                <div className="bg-red-50 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-red-600">{stats.oWins}</div>
                  <div className="text-sm text-gray-600 font-medium">O Wins</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-gray-600">{stats.draws}</div>
                  <div className="text-sm text-gray-600 font-medium">Draws</div>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-purple-600">{stats.gamesPlayed}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Games</div>
                </div>
              </div>
              <button
                onClick={resetStats}
                className="w-full mt-4 px-4 py-2 bg-gray-500 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors duration-200"
              >
                Reset Stats
              </button>
            </div>

            {/* Move History */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Recent Moves</h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {moveHistory.slice(-6).reverse().map((move, index) => (
                  <div key={move.timestamp} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        move.player === 'X' ? 'bg-blue-500' : 'bg-red-500'
                      }`}>
                        {move.player}
                      </div>
                      <span className="text-gray-700">Position {move.position + 1}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {moveHistory.length - index}
                    </span>
                  </div>
                ))}
                {moveHistory.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No moves yet
                  </div>
                )}
              </div>
            </div>

            {/* Player Strategies */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">AI Strategies</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="font-bold text-blue-700 mb-2">Player X (Blue)</div>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Aggressive playstyle</li>
                    <li>• Prefers center control</li>
                    <li>• Goes for corners first</li>
                  </ul>
                </div>
                <div className="bg-red-50 rounded-2xl p-4">
                  <div className="font-bold text-red-700 mb-2">Player O (Red)</div>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>• Defensive playstyle</li>
                    <li>• Prefers edge positions</li>
                    <li>• Focuses on blocking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}