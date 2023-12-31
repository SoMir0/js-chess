"use strict";

let bKnightImg = "../assets/128px/knight_black_shadow.png";
let bKingImg = "../assets/128px/king_black_shadow.png";
let bPawnImg = "../assets/128px/pawn_black_shadow.png";
let bRookImg = "../assets/128px/rook_black_shadow.png";
let bQueenImg = "../assets/128px/queen_black_shadow.png";
let bBishopImg = "../assets/128px/bishop_black_shadow.png";

let wKnightImg = "../assets/128px/knight_white_shadow.png";
let wKingImg = "../assets/128px/king_white_shadow.png";
let wPawnImg = "../assets/128px/pawn_white_shadow.png";
let wRookImg = "../assets/128px/rook_white_shadow.png";
let wQueenImg = "../assets/128px/queen_white_shadow.png";
let wBishopImg = "../assets/128px/bishop_white_shadow.png";

let images = [
  wPawnImg,
  wKnightImg,
  wBishopImg,
  wRookImg,
  wQueenImg,
  wKingImg,
  bPawnImg,
  bKnightImg,
  bBishopImg,
  bRookImg,
  bQueenImg,
  bKingImg,
];
let pieceNames = ["P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"];

class Piece {
  constructor(type) {
    this.type = type;
    this.color = type == type.toUpperCase() ? "w" : "b";
    this.img = images[pieceNames.indexOf(this.type)];
    this.element = null;
    this.pieceMoved = false;
    this.kingCastled = false;
  }
}

const socket = io("http://localhost:3000");

let squares = [];
let squaresFlat = [];
let pieces = [];
let legalMoves = [];
let specialMoves = [];
let prevPositions = [];

let currentPiece;
let swapPiece;
let reservePiece = null;

let oldPos;

let whiteKing, blackKing;

let countDownTimer;
let playerOneTime = 10 * 60 * 1000;
let playerTwoTime = 10 * 60 * 1000;

let playerColor = "";
let lastPlayed = "b";
let checked = null;

let pause = true;

let fiftyMoveRule = 0;

function reverseChildren(parent) {
  for (var i = 1; i < parent.childNodes.length; i++) {
    parent.insertBefore(parent.childNodes[i], parent.firstChild);
  }
}

socket.on("color", function (clr) {
  playerColor = clr;

  if (clr == "b") reverseChildren(document.getElementById("board"));
});

socket.on("startGame", () => {
  pause = false;
  startTimer();
});

function renderTimer() {
  var minutes = Math.floor((playerOneTime % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((playerOneTime % (1000 * 60)) / 1000);

  var minutestwo = Math.floor((playerTwoTime % (1000 * 60 * 60)) / (1000 * 60));
  var secondstwo = Math.floor((playerTwoTime % (1000 * 60)) / 1000);
  if (playerColor == "b") {
    document.getElementById("clock1").innerHTML =
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");
    document.getElementById("clock2").innerHTML =
      minutestwo.toString().padStart(2, "0") +
      ":" +
      secondstwo.toString().padStart(2, "0");
  } else {
    document.getElementById("clock1").innerHTML =
      minutestwo.toString().padStart(2, "0") +
      ":" +
      secondstwo.toString().padStart(2, "0");
    document.getElementById("clock2").innerHTML =
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");
  }
}

function startTimer() {
  if (countDownTimer != null) return;
  countDownTimer = setInterval(function () {
    if (!pause) {
      if (lastPlayed == "b") playerOneTime -= 1000;
      else playerTwoTime -= 1000;
    }

    renderTimer();

    if (playerOneTime < 0 || playerTwoTime < 0) {
      gameOver();
    }
  }, 1000);
}

function gameOver() {
  if (pause) return;
  clearInterval(countDownTimer);
  countDownTimer = null;
  pause = true;

  let text = document.getElementById("winText");
  text.style.display = "inline-block";
  if (playerOneTime <= 0) text.innerHTML = "Black wins! (timeout)";
  if (playerTwoTime <= 0) text.innerHTML = "White wins! (timeout)";

  pause = true;
  document.getElementById("againButton").disabled = false;
}

function lose(l) {
  if (pause) return;
  clearInterval(countDownTimer);
  countDownTimer = null;
  pause = true;

  let text = document.getElementById("winText");
  text.style.display = "inline-block";
  if (l == "w") text.innerHTML = "Black wins! (white resigns)";
  else text.innerHTML = "White wins! (black resigns)";

  pause = true;
  document.getElementById("againButton").disabled = false;
}

function startAgain() {
  if (!pause) return;
  clearInterval(countDownTimer);
  countDownTimer = null;

  colorSquares(squaresFlat, "legal", true);
  colorSquares(squaresFlat, "inCheck", true);
  colorSquares(squaresFlat, "playing", true);
  colorSquares(squaresFlat, "played", true);

  pause = false;

  let text = document.getElementById("winText");
  text.style.display = "none";

  clearMoves();

  for (let i in pieces) {
    pieces[i].element.remove();
    delete pieces[i];
  }

  pieces = [];

  decodeFEN();

  playerColor = playerColor == "b" ? "w" : "b";

  reverseChildren(document.getElementById("board"));

  playerOneTime = 10 * 60 * 1000;
  playerTwoTime = 10 * 60 * 1000;

  startTimer();

  document.getElementById("againButton").disabled = true;

  socket.emit("startAgain");
}

socket.on("resign", (c) => lose(c));
socket.on("startAgain", () => startAgain());

function resign() {
  if (playerColor == "") return;
  lose(playerColor);
  socket.emit("resign", playerColor);
}

const getPiece = (el) => pieces[el.dataset.objIndex];

function elementCount(arr, element) {
  return arr.reduce(
    (currentElement, arrElement) =>
      arrElement == element ? currentElement + 1 : currentElement,
    0
  );
}

function clearMoves() {
  legalMoves = [];
  specialMoves = [];
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  if (
    pause ||
    playerColor != getPiece(ev.target).color ||
    getPiece(ev.target).color == lastPlayed
  )
    return;
  currentPiece = ev.target;
  setCurrentFilteredSquare(ev.target.parentElement);
  checkLegalMoves();
}

function setCurrentFilteredSquare(square) {
  for (let i in squaresFlat) {
    squaresFlat[i].classList.remove("playing");
    squaresFlat[i].classList.remove("played");
  }
  square.classList.add("played");
}

function drop(ev) {
  ev.preventDefault();
  dropPiece(ev.target);
}

socket.on("movePiece", function ([curr, loc, spec]) {
  currentPiece = squaresFlat[curr].children[0];
  squaresFlat[curr].classList.add("played");
  if (spec) specialMoves.push(squaresFlat[loc]);
  dropPiece(squaresFlat[loc], true);
});

function dropPiece(loc, override = false) {
  colorSquares(legalMoves, "legal", true);
  if (
    currentPiece == null ||
    loc == currentPiece ||
    loc == currentPiece.parentElement
  ) {
    currentPiece = null;
    clearMoves();
    return;
  }

  let player = document.getElementById("pieceSound");
  let piece = getPiece(currentPiece);

  let square;

  if (loc.draggable) square = loc.parentElement;
  else if (loc.classList.contains("center")) square = loc;
  else {
    clearMoves();
    return;
  }

  if (!override)
    if (!legalMoves.includes(square)) {
      clearMoves();
      return;
    }

  colorSquares(squaresFlat, "inCheck", true);
  checked = null;

  fiftyMoveRule += 1;

  socket.emit("movePiece", [
    squaresFlat.indexOf(currentPiece.parentElement),
    squaresFlat.indexOf(square),
    specialMoves.includes(square),
  ]);

  if (square.children.length > 0) {
    square.children[0].remove();
    player = document.getElementById("takeSound");
    fiftyMoveRule = 0;
  } else if (square.children.length == 0) {
    let squareIndex = squaresFlat.indexOf(square);
    if (piece.type.toLowerCase() == "p") fiftyMoveRule = 0;
    if (specialMoves.includes(square)) {
      if (piece.type.toLowerCase() == "k" && checkCheck() == "") {
        const moveRook = (square, pi) => {
          squaresFlat[square].appendChild(squaresFlat[pi].children[0]);
          squaresFlat[square].classList.add("playing");
        };
        switch (squareIndex) {
          case 62:
            moveRook(61, 63);
            currentPiece = pieces[whiteKing].element;
            break;
          case 58:
            moveRook(59, 56);
            currentPiece = pieces[whiteKing].element;
            break;
          case 2:
            moveRook(3, 0);
            currentPiece = pieces[blackKing].element;
            break;
          case 6:
            moveRook(5, 7);
            currentPiece = pieces[blackKing].element;
            break;
          default:
            break;
        }
        clearMoves();
        player = document.getElementById("castleSound");
      } else if (
        piece.type.toLowerCase() == "p" ||
        squaresFlat[squareIndex - 8].children.length > 0
      ) {
        if (piece.color == "b")
          squaresFlat[squareIndex - 8].children[0].remove();
        else squaresFlat[squareIndex + 8].children[0].remove();
        clearMoves();
        player = document.getElementById("takeSound");
      }
    }
  }

  clearMoves();
  if (square.children.length == 0) {
    let squareIndex = squaresFlat.indexOf(square);
    if (piece.type.toLowerCase() == "p") {
      if (
        Math.abs(
          squaresFlat.indexOf(currentPiece.parentElement) - squareIndex
        ) == 16
      ) {
        specialMoves.push(
          squaresFlat[
            squaresFlat.indexOf(currentPiece.parentElement) -
              (squaresFlat.indexOf(currentPiece.parentElement) - squareIndex) /
                2
          ]
        );
      }
    }
  }

  if (
    squaresFlat.indexOf(square) >= 0 &&
    squaresFlat.indexOf(square) < 8 &&
    piece.color == "w" &&
    piece.type.toLowerCase() == "p"
  ) {
    if (lastPlayed != playerColor)
      document.getElementById("chooser").style.display = "flex";
    pause = true;
  } else if (
    squaresFlat.indexOf(square) >= 56 &&
    squaresFlat.indexOf(square) < 64 &&
    piece.color == "b" &&
    piece.type.toLowerCase() == "p"
  ) {
    if (lastPlayed != playerColor)
      document.getElementById("chooser").style.display = "flex";
    pause = true;
  }

  square.appendChild(currentPiece);
  swapPiece = currentPiece;
  currentPiece.parentElement.classList.add("playing");
  piece.pieceMoved = true;
  currentPiece = null;
  lastPlayed = lastPlayed == "b" ? "w" : "b";

  currentPiece = null;
  legalMoves = [];

  player.currentTime = 0;
  player.play();

  let fString = encodeFEN();
  prevPositions.push(fString);
  if (elementCount(prevPositions, fString) >= 3) {
    document.getElementById("winText").innerHTML =
      "Draw! (threefold repetition)";
    document.getElementById("winText").style.display = "inline-block";
    pause = true;
  }

  let ch = checkCheck();

  if (ch.includes("w"))
    colorSquares([pieces[whiteKing].element.parentElement], "inCheck");
  else if (ch.includes("b"))
    colorSquares([pieces[blackKing].element.parentElement], "inCheck");

  checkCheckmate("w", ch);
  checkCheckmate("b", ch);

  if (fiftyMoveRule >= 50) {
    document.getElementById("winText").innerHTML = "Draw! (fifty move rule)";
    document.getElementById("winText").style.display = "inline-block";
    pause = true;
  }
}

function checkCheck() {
  let isInCheck = "";

  for (let i in squaresFlat) {
    if (squaresFlat[i].children.length == 0) continue;
    let thisPiece = getPiece(squaresFlat[i].children[0]);
    currentPiece = thisPiece.element;
    checkLegalMoves(true);
    if (legalMoves.includes(pieces[whiteKing].element.parentElement))
      isInCheck += "w";
    if (legalMoves.includes(pieces[blackKing].element.parentElement))
      isInCheck += "b";
  }

  legalMoves = [];
  currentPiece = null;

  return isInCheck;
}

function checkCheckmate(color, isInCheck) {
  let isInCheckmate = true;

  for (let i in squaresFlat) {
    if (squaresFlat[i].children.length == 0) continue;
    let thisPiece = getPiece(squaresFlat[i].children[0]);
    currentPiece = thisPiece.element;
    checkLegalMoves(true);
    if (thisPiece.color != color) {
      legalMoves = [];
      continue;
    }
    if (legalMoves.length != 0) {
      isInCheckmate = false;
    }
  }

  if (isInCheckmate) {
    if (pause) return;
    let text = document.getElementById("winText");
    text.style.display = "inline-block";
    if (isInCheck.includes("b")) text.innerHTML = "White wins!";
    else if (isInCheck.includes("w")) text.innerHTML = "Black wins!";
    else text.innerHTML = "Stalemate!";

    pause = true;
    document.getElementById("againButton").disabled = false;
  }

  legalMoves = [];
  currentPiece = null;
}

function generateBoard() {
  let board = document.getElementById("board");

  for (let i = 0; i < 8; i++) {
    squares[i] = [];
    for (let j = 0; j < 8; j++) {
      let el = document.createElement("div");
      if ((i + j) % 2 == 0) el.classList.add("light");
      else el.classList.add("dark");
      el.classList.add("center");
      el.ondrop = drop;
      el.ondragover = allowDrop;
      board.appendChild(el);
      squares[i].push(el);
      squaresFlat.push(el);
    }
  }

  decodeFEN();
}

function createPiece(parent, type) {
  let newPiece = new Piece(type);
  let pie = document.createElement("img");
  pie.alt = "piece";
  pie.src = newPiece.img;
  pie.draggable = true;
  pie.ondragstart = drag;
  pie.style.maxWidth = "80%";
  newPiece.element = pie;
  pie.dataset.objIndex = pieces.length;
  parent.appendChild(pie);
  pieces.push(newPiece);
  return [newPiece, pie];
}

function encodeFEN() {
  let fenString = "";

  for (let i = 0; i < 8; i++) {
    let counter = 0;
    for (let j = 0; j < 8; j++) {
      if (squares[i][j].children.length == 0) {
        counter++;
        if (j == 7) {
          fenString += counter;
          counter = 0;
        }
      } else {
        if (counter != 0) {
          fenString += counter;
          counter = 0;
        }
        fenString += getPiece(squares[i][j].children[0]).type;
      }
    }
    if (i != 7) fenString += "/";
  }

  return fenString;
}

function decodeFEN(fenString = "") {
  if (fenString === "")
    fenString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let fenParts = fenString.split(" ");
  let positions = fenParts[0];
  let ranks = positions.split("/");

  lastPlayed = fenParts[1] == "w" ? "b" : "w";

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (!isNaN(ranks[i][j])) {
        j += ranks[i][j] - "1";
        continue;
      }

      if (ranks[i][j] == "K") whiteKing = pieces.length;
      else if (ranks[i][j] == "k") blackKing = pieces.length;

      createPiece(squares[i][j], ranks[i][j]);
    }
  }
}

function simulateMove(move) {
  oldPos = currentPiece.parentElement;
  if (move.children.length > 0) {
    reservePiece = move.children[0];
    move.removeChild(reservePiece);
  }
  move.appendChild(currentPiece);
}

function unsimulateMove(reserveLoc) {
  if (reservePiece != null) {
    reserveLoc.appendChild(reservePiece);
    reservePiece = null;
  }
  oldPos.appendChild(currentPiece);
}

function checkLegalMoves(noColor = false) {
  colorSquares(squaresFlat, "legal", true);

  let pseudoLegalMoves = checkPseudoLegalMoves();

  for (let i in pseudoLegalMoves) {
    simulateMove(pseudoLegalMoves[i]);

    let addMove = true;

    // Check if it's check
    for (let j in squaresFlat) {
      if (squaresFlat[j].children.length == 0) continue;
      let newArray = checkPseudoLegalMoves(squaresFlat[j].children[0]);
      if (
        (newArray.includes(pieces[whiteKing].element.parentElement) &&
          lastPlayed == "b") ||
        (newArray.includes(pieces[blackKing].element.parentElement) &&
          lastPlayed == "w")
      ) {
        addMove = false;
        break;
      }
    }

    if (addMove) legalMoves.push(pseudoLegalMoves[i]);

    unsimulateMove(pseudoLegalMoves[i]);
  }

  colorSquares(legalMoves, "legal", noColor);
}

function checkPseudoLegalMoves(currPiece = currentPiece) {
  let piece = getPiece(currPiece);
  let type = piece.type;
  let color = piece.color;

  let movesArray = [];

  let positionIndex = squaresFlat.indexOf(currPiece.parentElement);

  let n = squaresFlat[positionIndex + 8],
    e = squaresFlat[positionIndex + 1],
    w = squaresFlat[positionIndex - 1],
    s = squaresFlat[positionIndex - 8];
  let ne = squaresFlat[positionIndex - 7],
    nw = squaresFlat[positionIndex - 9],
    se = squaresFlat[positionIndex + 9],
    sw = squaresFlat[positionIndex + 7];

  let directions = [n, e, w, s, ne, nw, se, sw];

  const addToLegalMoves = (move) => {
    // TODO: implement me
    if (checked) {
      movesArray.push(move);
    } else {
      movesArray.push(move);
    }
  };

  const checkKingMoves = (dir) => {
    if (dir == undefined) return false;
    if (
      dir.children.length == 0 ||
      (dir.children.length > 0 &&
        getPiece(dir.children[0]).color != getPiece(currPiece).color)
    )
      return true;
    return false;
  };

  const slidingMoves = (t, c) => {
    let indices = [8, 1, -1, -8, -7, -9, 9, 7];
    let startingPos = 0;
    let endingPos = directions.length;
    if (t == "b") startingPos = 4;
    if (t == "r") endingPos = 4;
    for (let i = startingPos; i < endingPos; i++) {
      if ((positionIndex + 1) % 8 == 0) {
        if ([1, 9, -7].includes(indices[i])) continue;
      }
      if (positionIndex % 8 == 0) {
        if ([-1, -9, 7].includes(indices[i])) continue;
      }
      let nextSquare = positionIndex + indices[i];

      while (nextSquare < 64 && nextSquare > -1) {
        if (squaresFlat[nextSquare].children.length > 0) {
          let clr = getPiece(squaresFlat[nextSquare].children[0]).color;
          if (clr != c) addToLegalMoves(squaresFlat[nextSquare]);
          break;
        }
        addToLegalMoves(squaresFlat[nextSquare]);
        if ((nextSquare + 1) % 8 == 0) {
          if ([1, 9, -7].includes(indices[i])) break;
        }
        if (nextSquare % 8 == 0) {
          if ([-1, -9, 7].includes(indices[i])) break;
        }
        nextSquare += indices[i];
      }
    }
  };

  const kingMoves = (p) => {
    if ((positionIndex + 1) % 8 == 0)
      (directions[1] = undefined),
        (directions[4] = undefined),
        (directions[6] = undefined);
    if (positionIndex % 8 == 0)
      (directions[2] = undefined),
        (directions[5] = undefined),
        (directions[7] = undefined);
    for (let i in directions) {
      if (checkKingMoves(directions[i])) addToLegalMoves(directions[i]);
    }
    if (!p.pieceMoved) {
      if (p.color == "w") {
        if (
          squaresFlat[57].children.length == 0 &&
          squaresFlat[58].children.length == 0 &&
          squaresFlat[59].children.length == 0 &&
          squaresFlat[56].children.length > 0 &&
          getPiece(squaresFlat[56].children[0]).type.toLowerCase() == "r" &&
          getPiece(squaresFlat[56].children[0]).pieceMoved == false
        ) {
          addToLegalMoves(squaresFlat[58]);
          specialMoves.push(squaresFlat[58]);
        }
        if (
          squaresFlat[61].children.length == 0 &&
          squaresFlat[62].children.length == 0 &&
          squaresFlat[63].children.length > 0 &&
          getPiece(squaresFlat[63].children[0]).type.toLowerCase() == "r" &&
          getPiece(squaresFlat[63].children[0]).pieceMoved == false
        ) {
          addToLegalMoves(squaresFlat[62]);
          specialMoves.push(squaresFlat[62]);
        }
      } else {
        if (
          squaresFlat[1].children.length == 0 &&
          squaresFlat[2].children.length == 0 &&
          squaresFlat[3].children.length == 0 &&
          squaresFlat[0].children.length > 0 &&
          getPiece(squaresFlat[0].children[0]).type.toLowerCase() == "r" &&
          getPiece(squaresFlat[0].children[0]).pieceMoved == false
        ) {
          addToLegalMoves(squaresFlat[2]);
          specialMoves.push(squaresFlat[2]);
        }
        if (
          squaresFlat[5].children.length == 0 &&
          squaresFlat[6].children.length == 0 &&
          squaresFlat[7].children.length > 0 &&
          getPiece(squaresFlat[7].children[0]).type.toLowerCase() == "r" &&
          getPiece(squaresFlat[7].children[0]).pieceMoved == false
        ) {
          addToLegalMoves(squaresFlat[6]);
          specialMoves.push(squaresFlat[6]);
        }
      }
    }
  };

  const knightMoves = (c) => {
    let indices = [-17, -15, -10, -6, 6, 10, 15, 17];
    if ((positionIndex + 1) % 8 == 0) indices = [-17, -10, 6, 15];
    if ((positionIndex + 2) % 8 == 0) indices = [-17, -15, -10, 6, 15, 17];
    if (positionIndex % 8 == 0) indices = [-15, -6, 10, 17];
    if ((positionIndex - 1) % 8 == 0) indices = [-17, -15, -6, 10, 15, 17];
    for (let i in indices) {
      let pos = positionIndex + indices[i];
      if (pos < 0 || pos > 63) continue;

      if (squaresFlat[positionIndex + indices[i]].children.length == 0)
        addToLegalMoves(squaresFlat[positionIndex + indices[i]]);
      else {
        let clr = getPiece(
          squaresFlat[positionIndex + indices[i]].children[0]
        ).color;
        if (c != clr) addToLegalMoves(squaresFlat[positionIndex + indices[i]]);
      }
    }
  };

  const pawnMoves = (p) => {
    let indices;
    if (p.color == "w") {
      indices = [-9, -8, -7];
      if ((positionIndex + 1) % 8 == 0) indices = [-9, -8];
      if (positionIndex % 8 == 0) indices = [-8, -7];
      if (!p.pieceMoved && squaresFlat[positionIndex - 8].children.length == 0)
        indices.push(-16);
    } else {
      indices = [9, 8, 7];
      if ((positionIndex + 1) % 8 == 0) indices = [8, 7];
      if (positionIndex % 8 == 0) indices = [9, 8];
      if (!p.pieceMoved && squaresFlat[positionIndex + 8].children.length == 0)
        indices.push(16);
    }

    for (let i in indices) {
      let pos = positionIndex + indices[i];
      if (pos < 0 || pos > 63) continue;

      if (
        indices[i] == -7 ||
        indices[i] == -9 ||
        indices[i] == 7 ||
        indices[i] == 9
      ) {
        if (
          squaresFlat[positionIndex + indices[i]].children.length == 0 ||
          p.color ==
            getPiece(squaresFlat[positionIndex + indices[i]].children[0]).color
        )
          continue;
        addToLegalMoves(squaresFlat[positionIndex + indices[i]]);
      } else {
        if (squaresFlat[positionIndex + indices[i]].children.length != 0)
          continue;
        addToLegalMoves(squaresFlat[positionIndex + indices[i]]);
      }
    }

    for (let i in specialMoves) {
      let diff = positionIndex - squaresFlat.indexOf(specialMoves[i]);
      if (p.color == "w") {
        if (diff == 7 || diff == 9) addToLegalMoves(specialMoves[i]);
      } else {
        if (diff == -7 || diff == -9) addToLegalMoves(specialMoves[i]);
      }
    }
  };

  switch (type.toLowerCase()) {
    case "q":
      slidingMoves("q", color);
      break;
    case "r":
      slidingMoves("r", color);
      break;
    case "b":
      slidingMoves("b", color);
      break;
    case "k":
      kingMoves(piece);
      break;
    case "n":
      knightMoves(color);
      break;
    case "p":
      pawnMoves(piece);
      break;
    default:
      kingMoves();
      break;
  }
  return movesArray;
}

function colorSquares(arr, cls, uncolor = false) {
  for (let i in arr) {
    if (uncolor) arr[i].classList.remove(cls);
    else arr[i].classList.add(cls);
  }
}

socket.on("draw", (t) => drawPiece(t));

function drawPiece(type) {
  document.getElementById("chooser").style.display = "none";
  var p = swapPiece.parentElement;
  var c = getPiece(swapPiece).color;
  if (c == "w") type = type.toUpperCase();
  swapPiece.remove();
  createPiece(p, type);
  socket.emit("draw", type);
  pause = false;
}

generateBoard();
