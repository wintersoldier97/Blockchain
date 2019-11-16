import React from 'react';
import Board from './Board';
import Swal from "sweetalert2";

class Game extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      squares: Array(9).fill(''),
      hostScore: 0,
      joinerScore: 0,
      isMyTurn: false,
    }
  }

  async componentDidMount()
  {
    // End the game if state is 0
    // var game = await this.props.tictactoeInstance.state();
    // if (state == 0)
    // {
    //   Swal.close();
    //   this.props.endGame();
    //   return;
    // }

    // Need to get the updated board, check if it is current instance's turn to play
    // If so, then the opponent has moved and the board needs to be updated
    var player = await this.props.tictactoeInstance.currentPlayerAddress(this.props.roomId);
    if (player == this.props.account)
    {
      // Update the board
      var boardString = await this.props.tictactoeInstance.stateToString(this.props.roomId);
      for (var i = 0; i < boardString.length; i += 2)
        if (boardString[i] != ' ')
          this.state.squares[i / 2] = boardString[i];
      // If the board is new, announce the winner of the previous round, do Swal.close(), and create new board
    }
  }

  onMakeMove = async (index) =>
  {
    // Index is between 0 and 9. Send it appropriately to blockchain
    await this.props.tictactoeInstance.makeMove(this.props.roomId, index / 3, index % 3);
  }

  render()
  {
    let status;
    // Change to current player's turn
    status = `${this.state.isMyTurn ? "Your turn" : "Opponent's turn"}`;

    return (
      <div className="game">
        <div className="board">
          <Board
            squares={this.state.squares}
            onClick={index => this.onMakeMove(index)}
          />
          <p className="status-info">{status}</p>
        </div>

        <div className="scores-container">
          <div>
            <p>Host score: {this.state.hostScore} </p>
          </div>

          <div>
            <p>Joiner score: {this.state.joinerScore} </p>
          </div>
        </div>
      </div>
    );
  }
}

export default Game;
