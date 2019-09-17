pragma solidity >=0.4.21 <0.6.0;

contract TicTacToe {
    // Address of the two players and the owner
    address payable public owner;
    
    address payable public host;
    address payable public joiner;
    uint public state=0;
    uint public current_move = 0; 
    uint public balance=0;
    uint public match_count=0;
    uint public host_win=0;
    uint public joiner_win=0;
    enum states {E, X, O}
    states[3][3] public board;
    

    constructor() public {
        owner = msg.sender;
    }
    
    // Simple State Machine,
    // State 0: Game is not initialise
    // State 1: Host has joined
    // State 2: Challenger has joined 
    // State 3: Game Over

    function start() public payable {
        require(state==0);
        require(msg.value >= 1);
        require(balance==0);
        
        host = msg.sender;
        balance += msg.value;
        state = 1;
    }
    
    function join(address _host) public payable {
        require(_host==host);
        require(msg.value >= 1);
        require(state==1);
        require(_host!=msg.sender);  // Making sure that host is not trying to play with himself
        
        joiner = msg.sender;
        balance += msg.value;
        state = 2;
    }
    
    // constructor(address _joiner) public {
    //     require(_joiner != address(0));

    //     host = msg.sender;
    //     joiner = _joiner;
    // }
    
    // Checks to be performed before the transaction is allowed to make a change to the board
    // - Make sure the host and Challenger have joined the game
    // - The sender is a player of the game
    // - The game is not over and it is their turn 
    // - The arguments are within bounds of the board
    // - If the specified block on the board is empty 
    function MakeMove(uint y, uint x) public {
        require (state==2);
        require (msg.sender == host || msg.sender == joiner);
        require (!isGameOver() && msg.sender == currentPlayerAddress());
        require (positionCheck(x, y));
        require (board[x][y] == states.E);

        // TODO 
        if(currentPlayerAddress() == joiner) {
            board[x][y] = states.X;
        }
        else {
            board[x][y] = states.O;
        }

        current_move = current_move+1;
        
        if(isGameOver()){
            state=3;
            EndGame();
        }
    }

    // Utility function to make sure we never check positions outside the board
    function positionCheck(uint xpos, uint ypos) private pure returns (bool) {
        return (xpos >= 0 && xpos < 3 && ypos >= 0 && ypos < 3);
    }

    // Match 1 & 3: Joiner plays first
    // Match 2 & 4: Host plays first
    function currentPlayerAddress() public view returns (address) {
        if ((current_move+match_count) % 2 == 0) {
            return joiner;
        }
        else {
            return host;
        }
    }

    // Game is over when 9 moves have been made or when one of the player wins
    function isGameOver() public view returns (bool) {
        require(state==2);
        return (current_move > 8 || winningPlayerShape() != states.E); 
    }

    // After the game is over sendin the money to the winner
    function EndGame() private {
        require(state==3);
        require(balance>0);
        
        if(winner() == host){
            host_win = host_win+1;
        }
        else if(winner() == joiner){
            joiner_win = joiner_win+1;
        }
        match_count=match_count+1;
        
        if(match_count==4){
            if( joiner_win == host_win){
                owner.transfer(balance);
            }
            else if(joiner_win > host_win){
                joiner.transfer(balance);
            }
            else if(host_win > joiner_win){
                host.transfer(balance);
            }
            reset();
        }
        else{
            state=2;
            // balance=0;
            current_move=0;
            // host_win=0;
            // joiner_win=0;
            // match_count=0;
            reset_board();
        }
    }
    
    // We have to make sure that the money has been transferred to the winner or the owner
    function reset() private {
        require(state==3);
        
        state=0;
        balance=0;
        current_move=0;
        host_win=0;
        joiner_win=0;
        match_count=0;
        reset_board();
    }
    
    //resets board to default values
    function reset_board() private {
        for(uint r=0; r<3; r++){
            for(uint s=0; s<3; s++){
                board[r][s]=states.E;
            }
        }
    }
    
    // Utility function 
    function check(uint r1, uint c1, uint r2, uint c2, uint r3, uint c3)
    private view returns (states) {
        if(board[r1][c1]!=states.E && board[r1][c1]==board[r2][c2] && board[r2][c2]==board[r3][c3])
            return board[r1][c1];
        else
            return states.E;
    }

    // Function to check if the board has a winner and returns the winning shape
    function winningPlayerShape() private view returns (states) {
        // Check rows
        for(uint r=0; r<3; r++){
            if(check(r,0,r,1,r,2) != states.E)
                return check(r,0,r,1,r,2);
        }

        // Check coloumns
        for(uint r=0; r<3; r++){
            if(check(0,r,1,r,2,r)!=states.E)
                return check(0,r,1,r,2,r);
        }

        // Check diagonals

        if(check(0,0,1,1,2,2) != states.E)
            return check(0,0,1,1,2,2);
        if(check(0,2,1,1,2,0) != states.E)
            return check(0,2,1,1,2,0);

        return states.E;
    }

    // Function for the outside world to see who the winner is 
    function winner() public view returns (address payable) {
        states winning_shape = winningPlayerShape();
        if(winning_shape == states.X){
            return joiner;
        }
        else if(winning_shape == states.O) {
            return host;
        }
        
        return address(0);
    }
    
    // Drawing the board
    
    function stateToString() public view returns (string memory) {
        return string(abi.encodePacked("\n",
            colToString(0), "\n",
            colToString(1), "\n",
            colToString(2), "\n"
        ));
    }
    
    function colToString(uint pos) private view returns (string memory) {
        return string(abi.encodePacked(squareToString(0, pos), "|", squareToString(1, pos), "|", squareToString(2, pos)));
    }
    
    function squareToString(uint xpos, uint ypos) private view returns (string memory){
        require (positionCheck(xpos, ypos));
        
        if(board[xpos][ypos] == states.E){
            return " ";
        }
        else if(board[xpos][ypos] == states.X){
            return "X";
        }
        else if(board[xpos][ypos] == states.O){
            return "O";
        }
        return " ";
    }

    function sendToOwner() public {
        require(msg.sender==owner);
        if(balance > 0){
            owner.transfer(balance);
        }
    }
}