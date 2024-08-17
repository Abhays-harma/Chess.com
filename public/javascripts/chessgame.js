const socket = io(); // Initialize socket.io for real-time communication
const chess = new Chess(); // Create a new chess game instance

const boardElement = document.querySelector(".chessboard"); // Select the chessboard element

let draggedPiece = null; // Variable to store the currently dragged piece
let sourceSquare = null; // Variable to store the source square of the dragged piece
let playerRole = 'w'; // Player role, 'w' for white and 'b' for black (can be dynamically set)

const renderBoard = () => {
    const board = chess.board(); // Get the current state of the board
    boardElement.innerHTML = ""; // Clear the board before rendering

    // Loop through each row and column to create the board squares
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div"); // Create a new div for the square
            squareElement.classList.add("square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark" // Add light or dark class based on position
            );

            squareElement.dataset.row = rowIndex; // Set row data attribute
            squareElement.dataset.col = squareIndex; // Set column data attribute

            if (square) { // If there is a piece on the square
                const pieceElement = document.createElement("div"); // Create a new div for the piece
                pieceElement.classList.add("piece",
                    (square.color === "w") ? "white" : "black" // Add white or black class based on piece color
                );
                pieceElement.innerText = getPieceUnicode(square.type); // Set the piece unicode character
                pieceElement.draggable = playerRole === square.color; // Make the piece draggable if it belongs to the player

                // Event listener for when the drag starts
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement; // Set the dragged piece
                        sourceSquare = { row: rowIndex, col: squareIndex }; // Set the source square
                        e.dataTransfer.setData("text/plain", ""); // Required for Firefox compatibility
                    }
                });

                // Event listener for when the drag ends
                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null; // Clear the dragged piece
                    sourceSquare = null; // Clear the source square
                });

                squareElement.append(pieceElement); // Append the piece to the square
            }

            // Allow dropping on the square
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault(); // Prevent default behavior to allow drop
            });

            // Handle dropping on the square
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault(); // Prevent default behavior
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row), // Get the row of the target square
                        col: parseInt(squareElement.dataset.col) // Get the column of the target square
                    };

                    handleMove(sourceSquare, targetSquare); // Handle the move
                }
            });

            boardElement.appendChild(squareElement); // Append the square to the board
        });
    });

    // Flip the board if player is black
    if (playerRole === 'b') {
        boardElement.classList.add("flipped"); // Add flipped class for black player
    } else {
        boardElement.classList.remove("flipped"); // Remove flipped class for white player
    }
}

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`, // Convert source position to algebraic notation
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`, // Convert target position to algebraic notation
        promotion: 'q' // Promote to queen
    }

    socket.emit("move", move); // Send the move to the server
}

// Function to get the Unicode character for a chess piece
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: '♟', // Pawn
        r: '♜', // Rook
        n: '♞', // Knight
        b: '♝', // Bishop
        q: '♛', // Queen
        k: '♚', // King
        P: '♙', // White Pawn
        R: '♖', // White Rook
        N: '♘', // White Knight
        B: '♗', // White Bishop
        Q: '♕', // White Queen
        K: '♔'  // White King
    };

    return unicodePieces[piece] || ""; // Return the Unicode character or an empty string if not found
};

socket.on("playerRole", (role) => {
    playerRole = role; // Set the player's role based on the server message
    renderBoard(); // Render the board to reflect the role
})

socket.on("spectatorRole", () => {
    playerRole = null; // Clear the player's role if they are a spectator
    renderBoard(); // Render the board without player-specific features
})

socket.on("boardState", (fen) => {
    chess.load(fen); // Load the board state from FEN string
    renderBoard(); // Render the board with the new state
})

socket.on("move", (move) => {
    chess.move(move); // Apply the move to the chess game
    renderBoard(); // Render the board after the move
})

renderBoard(); // Initial rendering of the board
