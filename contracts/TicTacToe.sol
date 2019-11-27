pragma solidity >= 0.4.21 < 0.6.0;

contract TicTacToe
{
    // Address of the two players and the owner
    address payable public owner;
    enum states {E, X, O}

    struct Game
    {
        address payable host;
        address payable joiner;
        uint8 state;
        uint8 current_move;
        uint balance;
        uint8 match_count;
        uint8 host_win;
        uint8 joiner_win;
        states[3][3] board;
    }

    mapping(uint8 => Game) public games;

    constructor()
        public
    {
        owner = msg.sender;
    }

    // Simple State Machine
    // State 0: Game is not initialise
    // State 1: Host has joined
    // State 2: Challenger has joined
    // State 3: Game Over

    function create(uint8 id)
        public
        payable
    {
        require(games[id].state == 0, "Game ID already exists");
        require(msg.value >= 1, "Send a minimum of 1 Wei");
        require(msg.sender != owner, "Owner of contract can't take part in the game");

        games[id].host = msg.sender;
        games[id].balance = msg.value;
        games[id].state = 1;
    }

    function join(uint8 id)
        public
        payable
    {
        require(games[id].state == 1, "Player can only join an existing game. Wrong ID");
        require(msg.value >= 1, "Send a minimum of 1 Wei");
        require(owner != msg.sender, "Owner of contract can't take part in the game");
        require(games[id].host != msg.sender, "Making sure that host is not trying to play with himself");

        games[id].joiner = msg.sender;
        games[id].balance += msg.value;
        games[id].state = 2;
    }

    // Checks to be performed before the transaction is allowed to make a change to the board
    // - Make sure the host and Challenger have joined the game
    // - The sender is a player of the game
    // - The game is not over and it is their turn
    // - The arguments are within bounds of the board
    // - If the specified block on the board is empty
    function makeMove(uint8 id, uint8 y, uint8 x)
        public
    {
        require (games[id].state == 2, "Player has not joined the game");
        require (msg.sender == games[id].host || msg.sender == games[id].joiner, "Only the host and joiner can play this game");
        require (!isMatchOver(id), "Won't come here");
        require (msg.sender == currentPlayerAddress(id), "Please wait for your turn");
        require (positionCheck(x, y), "Ensure that position is inside the board");
        require (games[id].board[x][y] == states.E, "This board position is already filled");

        if(currentPlayerAddress(id) == games[id].joiner)
        {
            if (games[id].match_count % 2 == 1)
                games[id].board[x][y] = states.O;
            else
                games[id].board[x][y] = states.X;
        }
        else
        {
            if (games[id].match_count % 2 == 0)
                games[id].board[x][y] = states.O;
            else
                games[id].board[x][y] = states.X;
        }

        games[id].current_move = games[id].current_move + 1;

        if(isMatchOver(id))
        {
            games[id].state = 3;
            endGame(id);
        }
    }

    // Utility function to make sure we never check positions outside the board
    function positionCheck(uint8 xpos, uint8 ypos)
        private
        pure
        returns (bool)
    {
        return (xpos >= 0 && xpos < 3 && ypos >= 0 && ypos < 3);
    }

    // Match 1 & 3: Joiner plays first
    // Match 2 & 4: Host plays first
    function currentPlayerAddress(uint8 id)
        public
        view
        returns (address)
    {
        if ((games[id].current_move + games[id].match_count) % 2 == 0)
            return games[id].joiner;
        else
            return games[id].host;
    }

    // Game is over when 9 moves have been made or when one of the player wins
    function isMatchOver(uint8 id)
        public
        view
        returns (bool)
    {
        require(games[id].state == 2, "Ensure that match has completed");
        return (games[id].current_move > 8 || winningPlayerShape(id) != states.E);
    }

    // After the game is over, send the money to the winner
    function endGame(uint8 id)
        private
    {
        require(games[id].state == 3, "Ensure that the game ended");
        require(games[id].balance > 0, "Balance should be greater than 0. Won't come here");

        if (winner(id) == games[id].host)
            games[id].host_win = games[id].host_win + 1;
        else if(winner(id) == games[id].joiner)
            games[id].joiner_win = games[id].joiner_win + 1;

        games[id].match_count = games[id].match_count + 1;

        if(games[id].match_count == 1)
        {
            if( games[id].joiner_win == games[id].host_win)
                owner.transfer(games[id].balance);
            else if(games[id].joiner_win > games[id].host_win)
                games[id].joiner.transfer(games[id].balance);
            else if(games[id].host_win > games[id].joiner_win)
                games[id].host.transfer(games[id].balance);
            reset(id);
        }
        else
        {
            games[id].state = 2;
            games[id].current_move = 0;
            for(uint8 r = 0; r < 3; r++)
            {
                for(uint8 s = 0; s < 3; s++)
                {
                    games[id].board[r][s] = states.E;
                }
            }
        }
    }

    // We have to make sure that the money has been transferred to the winner or the owner
    function reset(uint8 id)
        private
    {
        require(games[id].state == 3, "Ensure that game has ended");
        delete games[id];
    }

    // Utility function
    function check(uint8 id, uint8 r1, uint8 c1, uint8 r2, uint8 c2, uint8 r3, uint8 c3)
        private
        view
        returns (states)
    {
        if(games[id].board[r1][c1] != states.E &&
            games[id].board[r1][c1] == games[id].board[r2][c2] &&
            games[id].board[r2][c2] == games[id].board[r3][c3])
            return games[id].board[r1][c1];
        else
            return states.E;
    }

    // Function to check if the board has a winner and returns the winning shape
    function winningPlayerShape(uint8 id)
        private
        view
        returns (states)
    {
        // Check rows
        for(uint8 r = 0; r < 3; r++) {
            if(check(id, r, 0, r, 1, r, 2) != states.E)
                return check(id, r, 0, r, 1, r, 2);
        }

        // Check coloumns
        for(uint8 r = 0; r < 3; r++) {
            if(check(id, 0, r, 1, r, 2, r) != states.E)
                return check(id, 0, r, 1, r, 2, r);
        }

        // Check diagonals

        if(check(id, 0, 0, 1, 1, 2, 2) != states.E)
            return check(id, 0, 0, 1, 1, 2, 2);
        if(check(id, 0, 2, 1, 1, 2, 0) != states.E)
            return check(id, 0, 2, 1, 1, 2, 0);

        return states.E;
    }

    // Function to get winner of current game
    function winner(uint8 id)
        private
        view
        returns (address payable)
    {
        states winning_shape = winningPlayerShape(id);
        if (games[id].match_count % 2 == 0)
        {
            if(winning_shape == states.X)
                return games[id].joiner;
            else if(winning_shape == states.O)
                return games[id].host;
        }
        else
        {
            if(winning_shape == states.O)
                return games[id].joiner;
            else if(winning_shape == states.X)
                return games[id].host;
        }
        return address(0);
    }

    // Drawing the board
    function stateToString(uint8 id)
        public
        view
        returns (string memory)
    {
        return string(
            abi.encodePacked(
            colToString(id, 0), "|",
            colToString(id, 1), "|",
            colToString(id, 2)
        ));
    }

    function colToString(uint8 id, uint8 pos)
        private
        view
        returns (string memory)
    {
        return string(abi.encodePacked(squareToString(id, 0, pos), "|", squareToString(id, 1, pos), "|", squareToString(id, 2, pos)));
    }

    function squareToString(uint8 id, uint8 xpos, uint8 ypos)
        private
        view
        returns (string memory)
    {
        if (games[id].board[xpos][ypos] == states.X)
            return "X";
        else if (games[id].board[xpos][ypos] == states.O)
            return "O";
        return " ";
    }
}