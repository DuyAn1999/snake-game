'use client'
import Image from 'next/image'
import { type } from 'os'
import { useEffect, useRef, useState } from 'react';
import { rand } from './utils';

type Position = {
  x: number;
  y: number;
}

type Velocity = {
  vX: number;
  vY: number;
}

type Dimension = {
  width: number;
  height: number;
}

type Snake = {
  head: Position
  parts: Array<Position>
}

type Food = {
  position: Position
}

export default function Home() {
  /// this will be the size in rect 
  /// EX: width: 40 rect with 1 rect (10x10px)
  const boardDimension: Dimension = {
    width: 40,
    height: 40
  }
  
  const rectDimension: Dimension = {
    width: 15,
    height: 15,
  }
  
  const initialSnakePosition: Position = {
    x: 0,
    y: 0
  }
  
  const initialSnakeVelocity: Velocity = {
    vX: 1,
    vY: 0
  }

  const gameUpdateInterval = 200;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Snake>({
    parts: [{x: 0, y: 0}],
    head: initialSnakePosition
  });
  const [snakeVelocity, setSnakeVelocity] = useState<Velocity>(initialSnakeVelocity)
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [food, setFood] = useState<Food>();
  const updateGameCallback = useRef<() => void>();

  // #region draw logic
  
  const drawSnake = () => {
    const canvas = canvasRef.current;
    if(canvas){
      const ctx = canvas.getContext('2d');
      if(ctx){
        ctx.fillStyle = "blue";
        snake.parts.forEach(part => {
          ctx.fillRect(part.x * rectDimension.width, part.y * rectDimension.height, rectDimension.width, rectDimension.height);
        })

        ctx.stroke();
      }
    }
  }

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if(canvas){
      const ctx = canvas.getContext('2d');
      if(ctx){
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, boardDimension.width * rectDimension.width, boardDimension.height * rectDimension.height);
        ctx.fillStyle = 'red';
        for(let xPos = 0; xPos < boardDimension.width; xPos++){
          for(let yPos = 0; yPos < boardDimension.height; yPos++){
            ctx.strokeRect(xPos * rectDimension.width, yPos * rectDimension.height, rectDimension.width, rectDimension.height);          
          } 
        }
      }
    }
  }

  const drawFood = () => {
    const canvas = canvasRef.current;
    if(food && canvas){
      const ctx = canvas.getContext('2d');
      if(ctx){
        ctx.fillStyle = "red";
        ctx.fillRect(food.position.x * rectDimension.width, 
          food.position.y * rectDimension.height, 
          rectDimension.width, 
          rectDimension.height);
        ctx.stroke();
      }
    }
  }

  const drawGame = () => {
    drawBoard();
    drawSnake();
    drawFood();
  }

  // #endregion

  // #region game update logic
  
  // update game logic
  const updateGame = () => {
    if(!gameOver && gameStarted){
      updateSnake();
      if(!food){
        generateFood()
      }
    }
  }

  // update the snake moving and eating logic
  const updateSnake = () => {
    let currentSnake = JSON.parse(JSON.stringify(snake))
    let nextHeadPosition = currentSnake.head;
    let parts = currentSnake.parts;
    nextHeadPosition.x += snakeVelocity.vX;
    nextHeadPosition.y += snakeVelocity.vY;
    if(nextHeadPosition.x > boardDimension.width || nextHeadPosition.x < 0){
      updateGameOver();
    }
    if(nextHeadPosition.y > boardDimension.height || nextHeadPosition.y < 0){
      updateGameOver();
    }
    if (nextHeadPosition.x !== food?.position.x || nextHeadPosition.y !== food?.position.y){
      parts.splice(-1, 1);
    }
    else{
      // eat food
      generateFood();
    }
    parts = [nextHeadPosition].concat(parts);
    setSnake({
      head: nextHeadPosition,
      parts: parts
    });
  }

  // generate food. it will not overlap with the snale body part
  const generateFood = () => {
    var x = rand(0, boardDimension.width);
    var y = rand(0, boardDimension.height);
    while (snake.parts.find(part => part.x == x && part.y == y) != null){
      var x = rand(0, boardDimension.width);
      var y = rand(0, boardDimension.height);
    }
    setFood({
      position: {x, y}
    })
  }

  // update the direction of the snakebased on the user input
  const updateGameInput = (e: KeyboardEvent) => {
    let newVelocityX = snakeVelocity.vX;
    let newVelocityY = snakeVelocity.vY;
    
    switch(e.code){
      case 'ArrowUp': {
        newVelocityX = 0;
        newVelocityY = -1;
        break;
      }
      case 'ArrowDown': {
        newVelocityX = 0;
        newVelocityY = 1;
        break;
      }
      case 'ArrowLeft': {
        newVelocityX = -1;
        newVelocityY = 0;
        break;
      }
      case 'ArrowRight': {
        newVelocityX = 1;
        newVelocityY = 0;
        break;
      }
      default: {
        break;
      }
    }
    setSnakeVelocity({
      vX: newVelocityX,
      vY: newVelocityY
    });
  }

  // update gameover event
  const updateGameOver = () => {
    setGameOver(true);
  }

  // #endregion

  // #region use-effect
  
  useEffect(() => {
    drawGame()
  }, [snake])

  useEffect(() => {
    const updateGame = () => {
      if(updateGameCallback.current)
        updateGameCallback.current();
    }
    drawGame();
    window.addEventListener('keyup', updateGameInput);
    const timer = setInterval(updateGame, gameUpdateInterval);
    return () => clearInterval(timer);
  }, [])

  useEffect(() => {
    updateGameCallback.current = updateGame;
  });

  // #endregion

  // #region UI logic

  const renderGame = () => {
    return (gameStarted && <div className='flex game-canvas'>
      {!gameOver && (<canvas ref={canvasRef} width={800} height={800}>
        </canvas>)}
      {gameOver && (
        <div>
          Game over
        </div>
      )}
    </div>);
  }

  const startGame = () => {
    setGameStarted(true);
  }

  // #endregion

  return (
    <main className="flex max-h-screen flex-col items-center justify-between p-24">
      {!gameStarted && (
      <div className='flex menu-screen'>
        <div className='buttons'>
          <button onClick={startGame}>Start</button>
          <button>Settings</button>
          <button>Helps</button>
          <button>Leaderboard</button>
        </div>
      </div>)}
      {renderGame()}
    </main>
  )
}
