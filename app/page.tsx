"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const ballRef = useRef<Ball>({
    x: 400,
    y: 300,
    vx: 5,
    vy: 5,
    radius: 10,
  });
  const paddleRef = useRef<Paddle>({
    x: 50,
    y: 250,
    width: 15,
    height: 100,
  });
  const computerPaddleRef = useRef<Paddle>({
    x: 735,
    y: 250,
    width: 15,
    height: 100,
  });
  const animationRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_SPEED = 8;
  const COMPUTER_SPEED = 4;

  const resetBall = useCallback(() => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 5,
      vy: (Math.random() > 0.5 ? 1 : -1) * 5,
      radius: 10,
    };
  }, []);

  const resetGame = useCallback(() => {
    setScore({ player: 0, computer: 0 });
    setGameOver(false);
    resetBall();
    paddleRef.current = { x: 50, y: 250, width: 15, height: 100 };
    computerPaddleRef.current = { x: 735, y: 250, width: 15, height: 100 };
  }, [resetBall]);

  const updateGame = useCallback(() => {
    const ball = ballRef.current;
    const paddle = paddleRef.current;
    const computerPaddle = computerPaddleRef.current;

    // Player paddle movement
    if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) {
      paddle.y = Math.max(0, paddle.y - PADDLE_SPEED);
    }
    if (keysPressed.current["ArrowDown"] || keysPressed.current["s"]) {
      paddle.y = Math.min(CANVAS_HEIGHT - paddle.height, paddle.y + PADDLE_SPEED);
    }

    // Computer paddle AI
    const computerTargetY = ball.y - computerPaddle.height / 2;
    if (computerPaddle.y < computerTargetY - 10) {
      computerPaddle.y = Math.min(CANVAS_HEIGHT - computerPaddle.height, computerPaddle.y + COMPUTER_SPEED);
    } else if (computerPaddle.y > computerTargetY + 10) {
      computerPaddle.y = Math.max(0, computerPaddle.y - COMPUTER_SPEED);
    }

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collision (top/bottom)
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= CANVAS_HEIGHT) {
      ball.vy = -ball.vy;
    }

    // Paddle collision
    // Player paddle
    if (
      ball.x - ball.radius <= paddle.x + paddle.width &&
      ball.x + ball.radius >= paddle.x &&
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height
    ) {
      ball.vx = Math.abs(ball.vx) * 1.05;
      const hitPos = (ball.y - paddle.y) / paddle.height;
      ball.vy = (hitPos - 0.5) * 10;
    }

    // Computer paddle
    if (
      ball.x + ball.radius >= computerPaddle.x &&
      ball.x - ball.radius <= computerPaddle.x + computerPaddle.width &&
      ball.y + ball.radius >= computerPaddle.y &&
      ball.y - ball.radius <= computerPaddle.y + computerPaddle.height
    ) {
      ball.vx = -Math.abs(ball.vx) * 1.05;
      const hitPos = (ball.y - computerPaddle.y) / computerPaddle.height;
      ball.vy = (hitPos - 0.5) * 10;
    }

    // Score
    if (ball.x < 0) {
      setScore((prev) => ({ ...prev, computer: prev.computer + 1 }));
      resetBall();
    }
    if (ball.x > CANVAS_WIDTH) {
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
      resetBall();
    }

    // Game over check
    if (score.player >= 5) {
      setGameOver(true);
      setGameStarted(false);
    }
    if (score.computer >= 5) {
      setGameOver(true);
      setGameStarted(false);
    }
  }, [resetBall, score]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = "#16213e";
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw ball
    const ball = ballRef.current;
    ctx.fillStyle = "#e94560";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw player paddle
    const paddle = paddleRef.current;
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw computer paddle
    const computerPaddle = computerPaddleRef.current;
    ctx.fillStyle = "#0f3460";
    ctx.fillRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;
    updateGame();
    drawGame();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, updateGame, drawGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, gameLoop]);

  useEffect(() => {
    if (!gameStarted) {
      drawGame();
    }
  }, [gameStarted, drawGame]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
      <h1 className="mb-4 text-4xl font-bold text-white">Pimbal Žaidimukas</h1>
      
      <div className="mb-4 flex gap-8 text-2xl font-semibold text-white">
        <div>Žaidėjas: {score.player}</div>
        <div>Kompiuteris: {score.computer}</div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg border-4 border-[#0f3460]"
      />

      <div className="mt-4 flex gap-4">
        {!gameStarted && !gameOver && (
          <button
            onClick={() => {
              setGameStarted(true);
              resetGame();
            }}
            className="rounded bg-[#e94560] px-6 py-3 text-lg font-bold text-white hover:bg-[#d63850]"
          >
            Pradėti žaidimą
          </button>
        )}
        
        {gameStarted && !gameOver && (
          <button
            onClick={() => setGameStarted(false)}
            className="rounded bg-[#0f3460] px-6 py-3 text-lg font-bold text-white hover:bg-[#0a2540]"
          >
            Pauzė
          </button>
        )}

        {!gameStarted && gameOver && (
          <button
            onClick={() => {
              setGameStarted(true);
              resetGame();
            }}
            className="rounded bg-[#e94560] px-6 py-3 text-lg font-bold text-white hover:bg-[#d63850]"
          >
            Žaisti iš naujo
          </button>
        )}
      </div>

      {gameOver && (
        <div className="mt-4 text-2xl font-bold text-white">
          {score.player >= 5 ? "Laimėjai! 🎉" : "Kompiuteris laimėjo! 🤖"}
        </div>
      )}

      <div className="mt-4 text-zinc-400">
        Valdymas: W/S arba ↑/↓ rodyklės
      </div>
    </div>
  );
}
