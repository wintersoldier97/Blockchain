pragma solidity >=0.4.21 <0.6.0;

contract TicTacToe {
    // Address of the two players
    address host;
    address joiner;

    // Number of moves
    uint8 current_move = 0;

    enum states {E, X, O};
    states[3][3] board;

    constructor(address _joiner) public {
        require(_joiner != 0x0);

        host = msg.sender;
        joiner = _joiner;
    }

    // Checks to be performed before the transaction is allowed to make a change to the board
    // - The sender is a player of the game
    // - The game is not over and it is their turn 
    // - The arguments are within bounds of the board
    // - If the specified block on the board is empty 
    function MakeMove(uint8 x, uint8 y) public {
        // Check address
        require (msg.sender == host || msg.sender == joiner);
        require (!isGameOver() && msg.sender == currentPlayerAddress);
        require (positionCheck(x, y));
        require (board[x][y] == states.E);

        // TODO 
        if(current_move%2==0) {
            board[x][y] = state.X;
        }
        else {
            board[x][y] = state.O;
        }

        current_move = current_move+1;
    }

    // Utility function to make sure we never check positions outside the board
    function positionCheck(uint8 xpos, uint8 ypos) public pure returns (bool) {
        return (xpos >= 0 && xpos < 3 && ypos >= 0 && ypos < 3);
    }

    // The joiner always plays first 
    function currentPlayerAddress() public view returns (address) {
        if (curren_move % 2 == 0) {
            return joiner;
        }
        else {
            return host;
        }
    }

    // Game is over when 9 moves have been made or when one of the player wins
    function isGameOver() public view returns (bool) {
        return (current_move > 8 || winningPlayerShape() != state.E); 
    }

    // Utility function 
    function check(uint8 r1, uint8 c1, uint8 r2, uint8 c2, uint8 r3, uint8 c3)
    private view returns (state) {
        if(board[r1][c1]!=state.E && board[r1][c1]==board[r2][c2] && board[r2][c2]==board[r3][c3])
            return board[r1][c1];
        else
            return state.E;
    }

    // Function to check if the board has a winner and returns the winning shape
    function winningPlayerShape() public view returns (state) {
        // Check rows
        for(uint r=0; r<3; r++){
            if(check(r,0,r,1,r,2)!=state.E)
                return check(r,0,r,1,r,2);
        }

        // Check coloumns
        for(uint r=0; r<3; r++){
            if(check(0,r,1,r,2,r)!=state.E)
                return check(0,r,1,r,2,r);
        }

        // Check diagonals

        if(check(0,0,1,1,2,2) != state.E)
            return check(0,0,1,1,2,2);
        if(check(0,2,1,1,2,0) != state.E)
            return check(0,2,1,1,2,0);

        return state.E;
    }

    // Function for the outside world to see who the winner is 
    function winner() public view return (address) {
        state winning_shape = winningPlayerShape();
        if(winning_shape == state.X){
            return joiner;
        }
        else if(winning_shape == state.O) {
            return host;
        }
        
        return 0x0;
    }
}