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
        this.img = images[pieceNames.indexOf(this.type)];
        this.element = null;
        this.pieceMoved = false;
        this.kingCastled = false;
    }
}

let squares = [];
let squaresFlat = [];
let pieces = [];
let legalMoves = [];
let specialMoves = [];

let currentPiece;

let lastPlayed = 'b';

let enPassant = null;
let enPassantPiece = null;

const getPiece = (el) => pieces[el.dataset.objIndex];

function clearMoves() {
    legalMoves = [];
    specialMoves = [];
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    if(getPiece(ev.target).color == lastPlayed)
        return;
    currentPiece = ev.target;
    setCurrentFilteredSquare(ev.target.parentElement);
    checkLegalMoves();
}

function setCurrentFilteredSquare(square)
{
    for(let i in squaresFlat)
    {
        squaresFlat[i].classList.remove('playing');
        squaresFlat[i].classList.remove('played');
    }
    square.classList.add('played');
}

function drop(ev) {
    ev.preventDefault();
    colorSquares(legalMoves, true);
    if(currentPiece == null || ev.target == currentPiece || ev.target == currentPiece.parentElement)
    {
        currentPiece = null;
        clearMoves();
        return;
    }

    let player = document.getElementById('pieceSound');
    let piece = getPiece(currentPiece);

    if(ev.target.draggable == true)
    {
        // enPassant == null;
        // enPassantPiece == null;
        if(!legalMoves.includes(ev.target.parentElement))
        {
            clearMoves();
            return;
        }
        let par = ev.target.parentElement;
        ev.target.remove();
        par.appendChild(currentPiece);
        setCurrentFilteredSquare(currentPiece.parentElement);
        piece.pieceMoved = true;
        currentPiece = null;
        lastPlayed = (lastPlayed == 'b') ? 'w' : 'b';
        player = document.getElementById('takeSound');
    }
    else if(ev.target.classList.contains('center'))
    {
        if(!legalMoves.includes(ev.target))
        {
            // enPassant == null;
            // enPassantPiece == null;
            clearMoves();
            return;
        }
        // if(ev.target == enPassant)
        // {
        //     enPassant == null;
        //     enPassantPiece.remove();
        //     enPassantPiece == null;
        // }
        // else if(enPassant != null)
        // {
        //     enPassant == null;
        //     enPassantPiece == null;
        // }
        if(ev.target.children.length > 0)
        {
            // enPassant == null;
            // enPassantPiece == null;
            ev.target.children[0].remove()
            player = document.getElementById('takeSound');
        }
        // else if(ev.target.children.length == 0 && piece.type.toLowerCase() == 'p' && Math.abs(squaresFlat.indexOf(currentPiece.parentElement) - squaresFlat.indexOf(ev.target)) == 16)
        // {
        //     enPassant = squaresFlat[squaresFlat.indexOf(currentPiece.parentElement) - (squaresFlat.indexOf(currentPiece.parentElement) - squaresFlat.indexOf(ev.target))/2];
        //     enPassantPiece = currentPiece;
        // }
        else if(ev.target.children.length == 0)
        {
            // enPassant == null;
            // enPassantPiece == null;
            if(specialMoves.includes(ev.target))
            {
                if(piece.type.toLowerCase() == 'k')
                {
                    switch(squaresFlat.indexOf(ev.target))
                    {
                        case 62:
                            squaresFlat[61].appendChild(squaresFlat[63].children[0]);
                            squaresFlat[61].classList.add('playing');
                            break;
                        case 58:
                            squaresFlat[59].appendChild(squaresFlat[56].children[0]);
                            squaresFlat[59].classList.add('playing');
                            break;
                        case 2:
                            squaresFlat[3].appendChild(squaresFlat[0].children[0]);
                            squaresFlat[3].classList.add('playing');
                            break;
                        case 6:
                            squaresFlat[5].appendChild(squaresFlat[7].children[0]);
                            squaresFlat[5].classList.add('playing');
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        
        // enPassant == null;
        // enPassantPiece == null;
        clearMoves();
        ev.target.appendChild(currentPiece);
        currentPiece.parentElement.classList.add('playing');
        currentFilteredSquare = ev.target.parentElement;
        piece.pieceMoved = true;
        currentPiece = null;
        lastPlayed = (lastPlayed == 'b') ? 'w' : 'b';
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
    clearMoves();

    let positionIndex = squaresFlat.indexOf(currentPiece.parentElement);

    let n = squaresFlat[positionIndex + 8], e = squaresFlat[positionIndex + 1], w = squaresFlat[positionIndex - 1], s = squaresFlat[positionIndex - 8];
    let ne = squaresFlat[positionIndex - 7], nw = squaresFlat[positionIndex - 9], se = squaresFlat[positionIndex + 9], sw = squaresFlat[positionIndex + 7];

    let directions = [n, e, w, s, ne, nw, se, sw];

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
                    let clr = getPiece(squaresFlat[nextSquare].children[0]).color;
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

    const kingMoves = (p) => {
        if((positionIndex + 1) % 8 == 0)
            directions[1] = undefined, directions[4] = undefined, directions[6] = undefined;
        if(positionIndex % 8 == 0)
            directions[2] = undefined, directions[5] = undefined, directions[7] = undefined;
        for(let i in directions)
        {
            if(checkKingMoves(directions[i]))
                legalMoves.push(directions[i]);
        }
        if(!p.pieceMoved)
        {
            if(p.color == 'w')
            {
                if(squaresFlat[57].children.length == 0 && squaresFlat[58].children.length == 0 && squaresFlat[59].children.length == 0 && squaresFlat[56].children.length > 0 && getPiece(squaresFlat[56].children[0]).type.toLowerCase() == 'r' && getPiece(squaresFlat[56].children[0]).pieceMoved == false)
                {
                    legalMoves.push(squaresFlat[58]);
                    specialMoves.push(squaresFlat[58]);
                }
                if(squaresFlat[61].children.length == 0 && squaresFlat[62].children.length == 0 && squaresFlat[63].children.length > 0 && getPiece(squaresFlat[63].children[0]).type.toLowerCase() == 'r' && getPiece(squaresFlat[63].children[0]).pieceMoved == false)
                {
                    legalMoves.push(squaresFlat[62]);
                    specialMoves.push(squaresFlat[62]);
                }
            }
            else {
                if(squaresFlat[1].children.length == 0 && squaresFlat[2].children.length == 0 && squaresFlat[3].children.length == 0 && squaresFlat[0].children.length > 0 && getPiece(squaresFlat[0].children[0]).type.toLowerCase() == 'r' && getPiece(squaresFlat[0].children[0]).pieceMoved == false)
                {
                    legalMoves.push(squaresFlat[2]);
                    specialMoves.push(squaresFlat[2]);
                }
                if(squaresFlat[5].children.length == 0 && squaresFlat[6].children.length == 0 && squaresFlat[7].children.length > 0 && getPiece(squaresFlat[7].children[0]).type.toLowerCase() == 'r' && getPiece(squaresFlat[7].children[0]).pieceMoved == false)
                {
                    legalMoves.push(squaresFlat[6]);
                    specialMoves.push(squaresFlat[6]);
                }
            }
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
                let clr = getPiece(squaresFlat[positionIndex + indices[i]].children[0]).color;
                if(c != clr)
                    legalMoves.push(squaresFlat[positionIndex + indices[i]]);
            }
        }
    }

    const pawnMoves = (p) => {
        let indices;
        if(p.color == 'w')
        {
            indices = [-9, -8, -7];
            if((positionIndex + 1) % 8 == 0)
                indices = [-9, -8];
            if(positionIndex % 8 == 0)
                indices = [-8, -7];
            if(!p.pieceMoved)
                indices.push(-16);
        }
        else
        {
            indices = [9, 8, 7];
            if((positionIndex + 1) % 8 == 0)
                indices = [9, 8];
            if(positionIndex % 8 == 0)
                indices = [8, 7];
            if(!p.pieceMoved)
                indices.push(16);
        }
        // if(enPassant != null)
        // {
        //     let enIndex = squaresFlat.indexOf(enPassant);
        //     let diff = positionIndex - enIndex;
        //     if((diff == -7 || diff == -9) && p.color == 'w')
        //         legalMoves.push(enPassant);
        //     else if((diff == 7 || diff == 9) && p.color == 'b')
        //         legalMoves.push(enPassant);
        // }
        
        for(let i in indices)
        {
            let pos = positionIndex + indices[i];
            if(pos < 0 || pos > 63)
                continue;

            if(indices[i] == -7 || indices[i] == -9 || indices[i] == 7 || indices[i] == 9)
            {
                if(squaresFlat[positionIndex + indices[i]].children.length == 0 || p.color == getPiece(squaresFlat[positionIndex + indices[i]].children[0]).color)
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
            kingMoves(piece);
            break;
        case 'n':
            knightMoves(color);
            break;
        case 'p':
            pawnMoves(piece);
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
            arr[i].classList.remove('legal');
        else
            arr[i].classList.add('legal');
    }
}

generateBoard();