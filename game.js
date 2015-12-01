/*jslint nomen: true, white: true */
/*global PS */
"use strict";

var selectedPiece = null,
	availableMoves = [],
	boardState = [],
	whitesTurn = true,
	unicodePieces = {
		// Unicode chess pieces.
		black: {
			king: 0x265A,
			queen: 0x265B,
			rook: 0x265C,
			bishop: 0x265D,
			knight: 0x265E,
			pawn: 0x265F
		},
		white: {
			king: 0x2654,
			queen: 0x2655,
			rook: 0x2656,
			bishop: 0x2657,
			knight: 0x2658,
			pawn: 0x2659
		}
	};

function validCoordinate(x, y) { return (x >= 0 && x < 8 && y >= 0 && y < 8); }

function makePiece(color, piece) {
	return {
		piece: piece,
		color: color,
		hasMoved: false
	};
}

function makeBoard() {
	var i, board = [];

	for (i = 0; i < 8; i++) {
		board[i] = [0, 0, 0, 0, 0, 0, 0, 0];
	}

	board[0][0] = makePiece('black', 'rook');
	board[1][0] = makePiece('black', 'knight');
	board[2][0] = makePiece('black', 'bishop');
	board[3][0] = makePiece('black', 'queen');
	board[4][0] = makePiece('black', 'king');
	board[5][0] = makePiece('black', 'bishop');
	board[6][0] = makePiece('black', 'knight');
	board[7][0] = makePiece('black', 'rook');

	for (i = 0; i < 8; i++) {
		board[i][1] = makePiece('black', 'pawn');
	}

	board[0][7] = makePiece('white', 'rook');
	board[1][7] = makePiece('white', 'knight');
	board[2][7] = makePiece('white', 'bishop');
	board[3][7] = makePiece('white', 'queen');
	board[4][7] = makePiece('white', 'king');
	board[5][7] = makePiece('white', 'bishop');
	board[6][7] = makePiece('white', 'knight');
	board[7][7] = makePiece('white', 'rook');

	for (i = 0; i < 8; i++) {
		board[i][6] = makePiece('white', 'pawn');
	}

	return board;
}

function move(board, x, y, newX, newY) {
	var data = board[x][y],
		otherData = board[newX][newY];

	if (data !== 0 && (otherData === 0 || otherData.color !== data.color)) {
		data.hasMoved = true;

		// Are we castling?
		if (data.piece === "king" && Math.abs(newX - x) > 1) {
			if (newX > x) {
				// castling right, move the rook
				move(7, y, 5, y);
			} else {
				// castling left, move the rook
				move(0, y, 3, y);
			}
		}

		board[newX][newY] = data;
		board[x][y] = 0;
	}
}

function addIfValidMove(board, newX, newY, pieceData, moves) {
	if (!validCoordinate(newX, newY)) {
		return true;
	}

	// Piece of the same color at the destination.
	if (board[newX][newY] !== 0 && board[newX][newY].color === pieceData.color) {
		return true;
	}

	moves.push([newX, newY]);
	if (board[newX][newY] !== 0) {
		// Capturing move.
		return true;
	}
	return false;
}

var moves = {
	lateral: function(board, x, y) {
		var data = board[x][y],
			moves = [],
			i;

		for (i = x + 1; i < 8; i++) {
			if (addIfValidMove(board, i, y, data, moves)) {
				break;
			}
		}
		for (i = x - 1; i >= 0; i--) {
			if (addIfValidMove(board, i, y, data, moves)) {
				break;
			}
		}
		for (i = y + 1; i < 8; i++) {
			if (addIfValidMove(board, x, i, data, moves)) {
				break;
			}
		}
		for (i = y - 1; i >= 0; i--) {
			if (addIfValidMove(board, x, i, data, moves)) {
				break;
			}
		}

		return moves;
	},

	diagonal: function(board, x, y) {
		var i,
			moves = [],
			pieceData = board[x][y];

		for (i = 1; i < 8; i++) {
			if (addIfValidMove(board, x + i, y + i, pieceData, moves)) {
				break;
			}
		}

		for (i = 1; i < 8; i++) {
			if (addIfValidMove(board, x + i, y - i, pieceData, moves)) {
				break;
			}
		}

		for (i = 1; i < 8; i++) {
			if (addIfValidMove(board, x - i, y + i, pieceData, moves)) {
				break;
			}
		}

		for (i = 1; i < 8; i++) {
			if (addIfValidMove(board, x - i, y - i, pieceData, moves)) {
				break;
			}
		}

		return moves;
	},

	king: function(board, x, y) {
		var data = board[x][y],
			moves = [];

		[ // Possible king moves
			[-1, 1],
			[0, 1],
			[1, 1],
			[-1, 0],
			[1, 0],
			[-1, -1],
			[0, -1],
			[1, -1]
		].forEach(function(coords) {
			addIfValidMove(board, x + coords[0], y + coords[1], data, moves);
		});

		// Castling
		if (!data.hasMoved) {
			[0, 7].forEach(function(rookX) {
				var rook = board[rookX][y],
					i;
				if (rook !== 0 && !rook.hasMoved) {
					// Make sure there are no pieces in-between the rook and the king.
					for (i = Math.min(rookX, x) + 1; i < Math.max(rookX, x); i++) {
						if (board[i][y] !== 0) {
							return;
						}
					}
					moves.push([rookX === 0 ? 2 : 6, y]);
				}
			});
		}

		return moves;
	},

	knight: function(board, x, y) {
		var pieceData = board[x][y],
			moves = [];

		[ // Possible offsets
			[2, 1],
			[2, -1],
			[-2, 1],
			[-2, -1],
			[1, 2],
			[-1, 2],
			[1, -2],
			[-1, -2]
		].forEach(function(coords) {
			addIfValidMove(board, coords[0] + x, coords[1] + y, pieceData, moves);
		});
		return moves;
	},

	pawn: function(board, x, y) {
		var data = board[x][y],
			moves = [],
			direction = data.color === "white" ? -1 : 1; // direction of movement.

		if (board[x][y + direction] === 0) {
			addIfValidMove(board, x, y + direction, data, moves);
			if (!data.hasMoved && board[x][y + direction * 2] === 0) {
				// Double move
				addIfValidMove(board, x, y + direction * 2, data, moves);
			}
		}

		// Capturing
		[-1, 1].forEach(function(offset) {
			if (!validCoordinate(x + offset, y + direction)) {
				return;
			}
			if (board[x + offset][y + direction] === 0) {
				return;
			}
			if (board[x + offset][y + direction].color !== data.color) {
				addIfValidMove(board, x + offset, y + direction, data, moves);
			}
		});

		// TODO en passant

		return moves;
	}
};

function possibleMoves(board, x, y) {
	switch (board[x][y].piece) {
		case 'pawn':
			return moves.pawn(board, x, y);
		case 'rook':
			return moves.lateral(board, x, y);
		case 'bishop':
			return moves.diagonal(board, x, y);
		case 'queen':
			return moves.diagonal(board, x, y).concat(moves.lateral(board, x, y));
		case 'king':
			return moves.king(board, x, y);
		case 'knight':
			return moves.knight(board, x, y);
		default:
			return [];
	}
}

function renderBoard(board) {
	var x,
		y,
		data,
		i;

	for (x = 0; x < 8; x++) {
		for (y = 0; y < 8; y++) {
			PS.color(x, y, ((x + y) % 2 === 0) ? 0xC0C0C0 : 0xFFFFFF);
			data = board[x][y];
			PS.glyph(x, y, data === 0 ? PS.DEFAULT : unicodePieces[data.color][data.piece]);
		}
	}

	for (i = 0; i < availableMoves.length; i++) {
		PS.color(availableMoves[i][0], availableMoves[i][1], 0xfaaa40);
	}
}

PS.init = function() {
	boardState = makeBoard();

	PS.gridSize(8, 8);
	renderBoard(boardState);
};

// Returns a move given the current board state.
function AI(board) {
	var x,
		y,
		m = [],
		moves = [],
		makeMove = function(move) { return [[x, y], move]; };

	for (x = 0; x < 8; x++) {
		for (y = 0; y < 8; y++) {
			if (board[x][y].color === "black") {
				m = possibleMoves(board, x, y);
				m = m.map(makeMove);
				moves = moves.concat(m);
			}
		}
	}

	return moves[PS.random(moves.length) - 1];
}

PS.touch = function(x, y) {
	var i,
		data = boardState[x][y],
		aiMove;

	for (i = 0; i < availableMoves.length; i++) {
		if (availableMoves[i][0] === x && availableMoves[i][1] === y) {
			move(boardState, selectedPiece[0], selectedPiece[1], x, y); 

			selectedPiece = [];
			availableMoves = [];

			aiMove = AI(boardState);

			move(boardState, aiMove[0][0], aiMove[0][1], aiMove[1][0], aiMove[1][1]);

			renderBoard(boardState);
			return;
		}
	}

	selectedPiece = [];
	availableMoves = [];

	if (data !== 0) {
		if (whitesTurn) {
			if (data.color === "white") {
				selectedPiece = [x, y];
				availableMoves = possibleMoves(boardState, x, y);
			}
		} else {
			if (data.color === "black") {
				selectedPiece = [x, y];
				availableMoves = possibleMoves(boardState, x, y);
			}
		}
	}

	renderBoard(boardState);


};

// This quiets PS and jslint about missing/empty functions.
PS.release  = function() { return; };
PS.enter    = function() { return; };
PS.exit     = function() { return; };
PS.exitGrid = function() { return; };
PS.keyDown  = function() { return; };
PS.keyUp    = function() { return; };
PS.swipe    = function() { return; };
PS.input    = function() { return; };