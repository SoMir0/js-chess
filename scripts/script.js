let bKnightImg = '/assets/128px/knight_black_shadow.png';
let bKingImg = '/assets/128px/king_black_shadow.png';
let bPawnImg = '/assets/128px/pawn_black_shadow.png';
let bRookImg = '/assets/128px/rook_black_shadow.png';
let bQueenImg = '/assets/128px/queen_black_shadow.png';
let bBishopImg = '/assets/128px/bishop_black_shadow.png';

let wKnightImg = '/assets/128px/knight_white_shadow.png';
let wKingImg = '/assets/128px/king_white_shadow.png';
let wPawnImg = '/assets/128px/pawn_white_shadow.png';
let wRookImg = '/assets/128px/rook_white_shadow.png';
let wQueenImg = '/assets/128px/queen_white_shadow.png';
let wBishopImg = '/assets/128px/bishop_white_shadow.png';

let images = [wPawnImg, wKnightImg, wBishopImg, wRookImg, wQueenImg, wKingImg, bPawnImg, bKnightImg, bBishopImg, bRookImg, bQueenImg, bKingImg];
let pieceNames = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];

class Piece {
    constructor(type) {
        this.type = type;
        this.color = ((type == type.toUpperCase()) ? 'w' : 'b');
        this.img = images[pieceNames.indexOf(this.type)]
        this.element = null;
    }
}

let squares = [];
let squaresFlat = [];
let pieces = [];
let legalMoves = [];

let currentPiece;

let lastPlayed = 'b';

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
    if(pieces[ev.target.dataset.objIndex].color == lastPlayed)
        return;
  currentPiece = ev.target;
  setCurrentFilteredSquare(ev.target.parentElement);
  checkLegalMoves();
}

function setCurrentFilteredSquare(square)
{
    for(let i in squares)
        for(let j in squares[i])
            squares[i][j].style.filter = 'none';
    square.style.filter = 'hue-rotate(260deg)';
}

function drop(ev) {
  ev.preventDefault();
  colorSquares(legalMoves, true);
  if(ev.target == currentPiece || ev.target == currentPiece.parentElement)
  {
    currentPiece = null;
    legalMoves = [];
    return;
  }

  let player = document.getElementById('pieceSound');

  lastPlayed = (lastPlayed == 'b') ? 'w' : 'b';

  if(ev.target.draggable == true)
  {
    if(!legalMoves.includes(ev.target.parentElement))
    {
        legalMoves = [];
        return;
    }
    let par = ev.target.parentElement;
    ev.target.remove();
    par.appendChild(currentPiece);
    setCurrentFilteredSquare(currentPiece.parentElement);
    currentPiece = null;
    player = document.getElementById('takeSound');
  }
  else if(ev.target.classList.contains('center'))
  {
    if(!legalMoves.includes(ev.target))
    {
        legalMoves = [];
        return;
    }
    if(ev.target.children.length > 0)
    {
        ev.target.children[0].remove()
        player = document.getElementById('takeSound');
    }
    
    legalMoves = [];
    ev.target.appendChild(currentPiece);
    currentPiece.parentElement.style.filter = 'hue-rotate(280deg) brightness(1.1)';
    currentFilteredSquare = ev.target.parentElement;
    currentPiece = null;
  }
  player.currentTime = 0;
  player.play();
}

function generateBoard() {
    let board = document.getElementById('board');

    for(let i = 0; i < 8; i++)
    {
        squares[i] = [];
        for(let j = 0; j < 8; j++)
        {
            let el = document.createElement('div');
            if((i + j) % 2 == 0)
                el.classList.add('light');
            else
                el.classList.add('dark');
            el.classList.add('center');
            el.ondrop = drop;
            el.ondragover = allowDrop;
            board.appendChild(el);
            squares[i].push(el);
            squaresFlat.push(el);
        }
    }

    decodeFEN();
}

function decodeFEN(fenString = '') {
    if(fenString === '')
        fenString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let positions = fenString.split(' ')[0];
    let ranks = positions.split('/');

    for(let i = 0; i < 8; i++)
    {
        for(let j = 0; j < 8; j++)
        {
            if(!isNaN(ranks[i][j]))
            {
                j += ranks[i][j] - '1';
                continue;
            }

            let newPiece = new Piece(ranks[i][j]);
            let pie = document.createElement('img');
            pie.alt = 'piece';
            pie.src = newPiece.img;
            pie.draggable = true;
            pie.ondragstart = drag;
            pie.style.maxWidth = '80%';
            newPiece.element = pie;
            pie.dataset.objIndex = pieces.length;
            squares[i][j].appendChild(pie);
            pieces.push(newPiece);
        }
    }
}

function checkLegalMoves()
{
    legalMoves = [];

    let positionIndex = squaresFlat.indexOf(currentPiece.parentElement);

    let n = squaresFlat[positionIndex + 8], e = squaresFlat[positionIndex + 1], w = squaresFlat[positionIndex - 1], s = squaresFlat[positionIndex - 8];
    let ne = squaresFlat[positionIndex - 7], nw = squaresFlat[positionIndex - 9], se = squaresFlat[positionIndex + 9], sw = squaresFlat[positionIndex + 7];

    let directions = [n, e, w, s, ne, nw, se, sw];

    const getPiece = (el) => pieces[el.dataset.objIndex];

    const checkKingMoves = (dir) => {
        if(dir == undefined) return false;
        if(dir.children.length == 0 || dir.children.length > 0 && getPiece(dir.children[0]).color != getPiece(currentPiece).color)
            return true;
        return false;
    }

    const slidingMoves = (t, c) => {
        let indices = [8, 1, -1, -8, -7, -9, 9, 7];
        let startingPos = 0;
        let endingPos = directions.length;
        if(t == 'b')
            startingPos = 4;
        if(t == 'r')
            endingPos = 4;
        for(let i = startingPos; i < endingPos; i++)
        {
            if ((positionIndex + 1) % 8 == 0)
            {
                if([1, 9, -7].includes(indices[i]))
                    continue;
            }
            if (positionIndex % 8 == 0)
            {
                if([-1, -9, 7].includes(indices[i]))
                    continue;
            }
            let nextSquare = positionIndex + indices[i];

            while(nextSquare < 64 && nextSquare > -1)
            {
                if(squaresFlat[nextSquare].children.length > 0)
                {
                    let clr = pieces[squaresFlat[nextSquare].children[0].dataset.objIndex].color;
                    if(clr != c)
                        legalMoves.push(squaresFlat[nextSquare]);
                    break;
                }
                legalMoves.push(squaresFlat[nextSquare]);
                if ((nextSquare + 1) % 8 == 0)
                {
                    if([1, 9, -7].includes(indices[i]))
                        break;
                }
                if (nextSquare % 8 == 0)
                {
                    if([-1, -9, 7].includes(indices[i]))
                        break;
                }
                nextSquare += indices[i];
            }
        }
    }

    const kingMoves = () => {
        if((positionIndex + 1) % 8 == 0)
            directions[1] = undefined, directions[4] = undefined, directions[6] = undefined;
        if(positionIndex % 8 == 0)
            directions[2] = undefined, directions[5] = undefined, directions[7] = undefined;
        for(let i in directions)
        {
            if(checkKingMoves(directions[i]))
                legalMoves.push(directions[i]);
        }
    }

    const knightMoves = (c) => {
        let indices = [-17, -15, -10, -6, 6, 10, 15, 17];
        if((positionIndex + 1) % 8 == 0)
            indices = [-17, -10, 6, 15];
        if((positionIndex + 2) % 8 == 0)
            indices = [-17, -15, -10, 6, 15, 17];
        if((positionIndex) % 8 == 0)
            indices = [-15, -6, 10, 17];
        if((positionIndex - 1) % 8 == 0)
            indices = [-17, -15, -6, 10, 15, 17];
        for(let i in indices)
        {
            let pos = positionIndex + indices[i];
            if(pos < 0 || pos > 63)
                continue;

            if(squaresFlat[positionIndex + indices[i]].children.length == 0)
                legalMoves.push(squaresFlat[positionIndex + indices[i]]);
            else {
                let clr = pieces[squaresFlat[positionIndex + indices[i]].children[0].dataset.objIndex].color;
                if(c != clr)
                    legalMoves.push(squaresFlat[positionIndex + indices[i]]);
            }
        }
    }

    const pawnMoves = (c) => {
        let indices;
        if(c == 'w')
        {
            indices = [-9, -8, -7];
            if((positionIndex + 1) % 8 == 0)
                indices = [-9, -8];
            if(positionIndex % 8 == 0)
                indices = [-8, -7];
        }
        else
        {
            indices = [9, 8, 7];
            if((positionIndex + 1) % 8 == 0)
                indices = [9, 8];
            if(positionIndex % 8 == 0)
                indices = [8, 7];
        }
        
        for(let i in indices)
        {
            let pos = positionIndex + indices[i];
            if(pos < 0 || pos > 63)
                continue;

            if(indices[i] == -7 || indices[i] == -9 || indices[i] == 7 || indices[i] == 9)
            {
                if(squaresFlat[positionIndex + indices[i]].children.length == 0 || c == pieces[squaresFlat[positionIndex + indices[i]].children[0].dataset.objIndex].color)
                    continue;
                legalMoves.push(squaresFlat[positionIndex + indices[i]]);
            }
            else {
                if(squaresFlat[positionIndex + indices[i]].children.length != 0)
                    continue;
                legalMoves.push(squaresFlat[positionIndex + indices[i]]);
            }
        }
    }

    let piece = getPiece(currentPiece);
    let type = piece.type;
    let color = piece.color;

    switch(type.toLowerCase()) {
        case 'q':
            slidingMoves('q', color);
            break;
        case 'r':
            slidingMoves('r', color);
            break;
        case 'b':
            slidingMoves('b', color);
            break;
        case 'k':
            kingMoves();
            break;
        case 'n':
            knightMoves(color);
            break;
        case 'p':
            pawnMoves(color);
            break;
        default:
            kingMoves();
            break;
    }
    colorSquares(legalMoves, false);
}

function colorSquares(arr, uncolor) {
    for(let i in arr)
    {
        if(uncolor)
            arr[i].style.filter = 'none';
        else
            arr[i].style.filter = 'hue-rotate(90deg)';
    }
}

generateBoard();