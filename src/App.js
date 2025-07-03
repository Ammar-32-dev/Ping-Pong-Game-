import React, { useState, useEffect, useRef, useCallback } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const BALL_SIZE = 20;
const PLAYER_PADDLE_SPEED = 12; // Increased speed for player's paddle
const AI_PADDLE_SPEED = 4; // AI paddle speed
const INITIAL_BALL_SPEED = 5;
const MAX_SCORE = 5;

function App() {
  const [ballPos, setBallPos] = useState({ x: GAME_WIDTH / 2 - BALL_SIZE / 2, y: GAME_HEIGHT / 2 - BALL_SIZE / 2 });
  const [ballSpeed, setBallSpeed] = useState({ x: INITIAL_BALL_SPEED, y: INITIAL_BALL_SPEED });
  const [paddleLeftY, setPaddleLeftY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [paddleRightY, setPaddleRightY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [scoreLeft, setScoreLeft] = useState(0);
  const [scoreRight, setScoreRight] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');

  const gameLoopRef = useRef();

  const resetGame = useCallback(() => {
    setBallPos({ x: GAME_WIDTH / 2 - BALL_SIZE / 2, y: GAME_HEIGHT / 2 - BALL_SIZE / 2 });
    setBallSpeed({ x: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), y: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1) });
    setPaddleLeftY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    setPaddleRightY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    setScoreLeft(0);
    setScoreRight(0);
    setGameOver(false);
    setWinner('');
  }, []);

  const updateGame = useCallback(() => {
    if (gameOver) return;

    let currentBallX = ballPos.x;
    let currentBallY = ballPos.y;
    let currentBallSpeedX = ballSpeed.x;
    let currentBallSpeedY = ballSpeed.y;

    let newBallX = currentBallX + currentBallSpeedX;
    let newBallY = currentBallY + currentBallSpeedY;
    let newBallSpeedX = currentBallSpeedX;
    let newBallSpeedY = currentBallSpeedY;

    let scored = false;

    // Ball collision with top/bottom walls
    if (newBallY <= 0 || newBallY + BALL_SIZE >= GAME_HEIGHT) {
      newBallSpeedY = -currentBallSpeedY;
      newBallY = newBallY <= 0 ? 0 : GAME_HEIGHT - BALL_SIZE;
    }

    // Ball collision with paddles
    // Left paddle
    if (
      newBallX <= PADDLE_WIDTH &&
      newBallY + BALL_SIZE > paddleLeftY &&
      newBallY < paddleLeftY + PADDLE_HEIGHT &&
      newBallSpeedX < 0
    ) {
      newBallSpeedX = -currentBallSpeedX;
      newBallX = PADDLE_WIDTH;
    }

    // Right paddle
    if (
      newBallX + BALL_SIZE >= GAME_WIDTH - PADDLE_WIDTH &&
      newBallY + BALL_SIZE > paddleRightY &&
      newBallY < paddleRightY + PADDLE_HEIGHT &&
      newBallSpeedX > 0
    ) {
      newBallSpeedX = -currentBallSpeedX;
      newBallX = GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE;
    }

    // Scoring
    if (newBallX < 0) {
      setScoreRight(prev => prev + 1);
      scored = true;
    } else if (newBallX + BALL_SIZE > GAME_WIDTH) {
      setScoreLeft(prev => prev + 1);
      scored = true;
    }

    if (scored) {
      newBallX = GAME_WIDTH / 2 - BALL_SIZE / 2;
      newBallY = GAME_HEIGHT / 2 - BALL_SIZE / 2;
      newBallSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
      newBallSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    }

    setBallPos({ x: newBallX, y: newBallY });
    setBallSpeed({ x: newBallSpeedX, y: newBallSpeedY });

    // Simple AI for right paddle
    setPaddleRightY(prev => {
      const centerPaddle = prev + PADDLE_HEIGHT / 2;
      if (centerPaddle < ballPos.y) {
        return Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + AI_PADDLE_SPEED);
      } else if (centerPaddle > ballPos.y) {
        return Math.max(0, prev - AI_PADDLE_SPEED);
      }
      return prev;
    });

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [gameOver, paddleLeftY, paddleRightY, ballPos.x, ballPos.y, ballSpeed.x, ballSpeed.y, setScoreLeft, setScoreRight, setBallPos, setBallSpeed, setPaddleRightY]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (scoreLeft >= MAX_SCORE) {
      setWinner('Player 1');
      setGameOver(true);
    } else if (scoreRight >= MAX_SCORE) {
      setWinner('Player 2');
      setGameOver(true);
    }
  }, [scoreLeft, scoreRight]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [updateGame]);

  // Keyboard controls for left paddle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if (e.key === 'ArrowUp') {
        setPaddleLeftY(prev => Math.max(0, prev - PLAYER_PADDLE_SPEED));
      } else if (e.key === 'ArrowDown') {
        setPaddleLeftY(prev => Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + PLAYER_PADDLE_SPEED));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  return (
    <div className="game-container">
      <div
        className="paddle paddle-left"
        style={{ top: paddleLeftY + 'px' }}
      ></div>
      <div
        className="paddle paddle-right"
        style={{ top: paddleRightY + 'px' }}
      ></div>
      <div
        className="ball"
        style={{ left: ballPos.x + 'px', top: ballPos.y + 'px' }}
      ></div>
      <div className="score score-left">{scoreLeft}</div>
      <div className="score score-right">{scoreRight}</div>

      {gameOver && (
        <div className="game-over-screen">
          <h2>Game Over!</h2>
          <p>{winner} wins!</p>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default App;
