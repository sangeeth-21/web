"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  gameOver: boolean;
  score: number;
  isPaused: boolean;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 150;

export default function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 5, y: 5 },
    direction: 'RIGHT',
    gameOver: false,
    score: 0,
    isPaused: false,
  });

  // Initialize useRef with proper initial values
  const directionRef = useRef<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    return { x, y };
  }, []);

  // Check collision
  const checkCollision = useCallback((head: Position, snake: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Self collision
    for (let i = 0; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    
    return false;
  }, []);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameState.gameOver || gameState.isPaused) return;

    setGameState(prevState => {
      const newSnake = [...prevState.snake];
      const head = { ...newSnake[0] };

      // Move head based on direction
      switch (directionRef.current) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check for collision
      if (checkCollision(head, newSnake)) {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
        return { ...prevState, gameOver: true };
      }

      newSnake.unshift(head);

      // Check if food is eaten
      let newFood = prevState.food;
      let newScore = prevState.score;
      
      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        newFood = generateFood();
        newScore += 10;
        
        // Make sure food doesn't spawn on snake
        while (newSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
          newFood = generateFood();
        }
      } else {
        newSnake.pop();
      }

      return {
        ...prevState,
        snake: newSnake,
        food: newFood,
        score: newScore,
      };
    });
  }, [gameState.gameOver, gameState.isPaused, checkCollision, generateFood]);

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Prevent default behavior for arrow keys and space to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'r'].includes(event.key)) {
      event.preventDefault();
    }

    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'arrowup':
      case 'w':
        if (directionRef.current !== 'DOWN') {
          directionRef.current = 'UP';
        }
        break;
      case 'arrowdown':
      case 's':
        if (directionRef.current !== 'UP') {
          directionRef.current = 'DOWN';
        }
        break;
      case 'arrowleft':
      case 'a':
        if (directionRef.current !== 'RIGHT') {
          directionRef.current = 'LEFT';
        }
        break;
      case 'arrowright':
      case 'd':
        if (directionRef.current !== 'LEFT') {
          directionRef.current = 'RIGHT';
        }
        break;
      case ' ':
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        break;
      case 'r':
        if (gameState.gameOver) {
          resetGame();
        }
        break;
    }
  }, [gameState.gameOver]);

  // Reset game
  const resetGame = useCallback(() => {
    directionRef.current = 'RIGHT';
    setGameState({
      snake: [{ x: 10, y: 10 }],
      food: generateFood(),
      direction: 'RIGHT',
      gameOver: false,
      score: 0,
      isPaused: false,
    });
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
  }, [generateFood, moveSnake]);

  // Initialize game
  useEffect(() => {
    const gameContainer = document.getElementById('game-container');
    
    // Add event listener with options to make it non-passive
    window.addEventListener('keydown', handleKeyPress, { passive: false });
    
    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [handleKeyPress, moveSnake]);

  // Focus management to ensure keyboard events work properly
  useEffect(() => {
    // Focus the game container when component mounts
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.focus();
    }
  }, []);

  // Render game grid
  const renderGrid = () => {
    const grid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnake = gameState.snake.some(segment => segment.x === x && segment.y === y);
        const isHead = gameState.snake[0].x === x && gameState.snake[0].y === y;
        const isFood = gameState.food.x === x && gameState.food.y === y;
        
        let cellClass = 'border border-gray-200';
        
        if (isHead) {
          cellClass += ' bg-green-600';
        } else if (isSnake) {
          cellClass += ' bg-green-400';
        } else if (isFood) {
          cellClass += ' bg-red-500 rounded-full';
        } else {
          cellClass += ' bg-gray-100';
        }
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        );
      }
    }
    
    return grid;
  };

  return (
    <div 
      id="game-container"
      className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center p-4"
      tabIndex={0} // Make the container focusable
      style={{ outline: 'none' }} // Remove focus outline
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-green-600 mb-2">
          Snake Game
        </h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-semibold text-gray-800">
            Score: <span className="text-green-600">{gameState.score}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              {gameState.isPaused ? 'Resume' : 'Pause'}
            </button>
            
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Restart
            </button>
          </div>
        </div>

        {/* Game Status */}
        {gameState.gameOver && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-center">
            <p className="text-red-600 font-semibold text-xl">Game Over!</p>
            <p className="text-red-500">Final Score: {gameState.score}</p>
            <p className="text-sm text-gray-600 mt-2">Press R or click Restart to play again</p>
          </div>
        )}

        {gameState.isPaused && !gameState.gameOver && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
            <p className="text-yellow-600 font-semibold text-xl">Game Paused</p>
          </div>
        )}

        {/* Game Grid */}
        <div 
          className="grid border-4 border-green-800 rounded-lg mx-auto mb-6 bg-green-800"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {renderGrid()}
        </div>

        {/* Controls Info */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Controls:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>↑ W / Arrow Up</div>
            <div>Move Up</div>
            <div>↓ S / Arrow Down</div>
            <div>Move Down</div>
            <div>← A / Arrow Left</div>
            <div>Move Left</div>
            <div>→ D / Arrow Right</div>
            <div>Move Right</div>
            <div>Space</div>
            <div>Pause/Resume</div>
            <div>R</div>
            <div>Restart</div>
          </div>
        </div>

        {/* Game Instructions */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Eat the red food to grow and earn points!</p>
          <p>Avoid hitting walls and yourself.</p>
          <p className="mt-2 text-blue-600 font-medium">Click anywhere on the game to focus for keyboard controls</p>
        </div>
      </div>
    </div>
  );
}