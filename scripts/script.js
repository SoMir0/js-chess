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

class Piece {
    constructor(type) {
        this.type = type;
        this.color = ((type == type.toUpperCase()) ? 'w' : 'b');
        this.img = '';
        switch(this.color) {
            case 'w':
                switch(type.toLowerCase()) {
                    case 'p':
                        this.img = wPawnImg;
                        break;
                    case 'n':
                        this.img = wKnightImg;
                        break
                    case 'b':
                        this.img = wBishopImg;
                        break;
                    case 'r':
                        this.img = wRookImg;
                        break
                    case 'q':
                        this.img = wQueenImg;
                        break;
                    case 'k':
                        this.img = wKingImg;
                        break;
                    default:
                        this.img = wPawnImg;
                }
                break;
             case 'b':
                switch(type.toLowerCase()) {
                    case 'p':
                        this.img = bPawnImg;
                        break;
                    case 'n':
                        this.img = bKnightImg;
                        break
                    case 'b':
                        this.img = bBishopImg;
                        break;
                    case 'r':
                        this.img = bRookImg;
                        break
                    case 'q':
                        this.img = bQueenImg;
                        break;
                    case 'k':
                        this.img = bKingImg;
                        break;
                    default:
                        this.img = bPawnImg;
                }
                break;
      }
      this.element = null;
    }
}

let squares = [];
let squaresFlat = [];
let pieces = [];
let legalMoves = [];

let currentPiece;

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
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

    const getPiece = (el) => pieces[el.dataset.objIndex];

    const checkKingMoves = (dir) => {
        if(dir == undefined) return false;
        if(dir.children.length == 0 || dir.children.length > 0 && getPiece(dir.children[0]).color != getPiece(currentPiece).color)
            return true;
        return false;
    }

    let positionIndex = squaresFlat.indexOf(currentPiece.parentElement);

    let n = squaresFlat[positionIndex + 8], e = squaresFlat[positionIndex + 1], w = squaresFlat[positionIndex - 1], s = squaresFlat[positionIndex - 8];
    let ne = squaresFlat[positionIndex - 7], nw = squaresFlat[positionIndex - 9], se = squaresFlat[positionIndex + 9], sw = squaresFlat[positionIndex + 7];
    if(checkKingMoves(n))
        legalMoves.push(n);
    if(checkKingMoves(e))
        legalMoves.push(e);
    if(checkKingMoves(w))
        legalMoves.push(w);
    if(checkKingMoves(s))
        legalMoves.push(s);
    if(checkKingMoves(ne))
        legalMoves.push(ne);
    if(checkKingMoves(nw))
        legalMoves.push(nw);
    if(checkKingMoves(se))
        legalMoves.push(se);
    if(checkKingMoves(sw))
        legalMoves.push(sw);

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