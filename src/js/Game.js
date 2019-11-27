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
      matchNo: 0,
      isMyTurn: false,
    }
  }

  componentWillMount()
  {
    // Need to get the updated board, check if it is current instance's turn to play
    // If so, then the opponent has moved and the board needs to be updated
    this.updateApp = setInterval(
      () => this.checkTurn(),
      1000
    );
  }

  async updateBoard()
  {
    var boardString = await this.props.tictactoeInstance.stateToString(this.props.roomId);
    var squares = Array(9).fill('');
    for (var i = 0; i < boardString.length; i += 2)
      if (boardString[i] != ' ')
        squares[i / 2] = boardString[i];
    this.setState({ squares: squares });
  }

  async checkTurn()
  {
    var player = await this.props.tictactoeInstance.currentPlayerAddress(this.props.roomId);
    player = player.toLowerCase();
    // Update the board
    this.checkWin();
    this.updateBoard();
    if (player == this.props.account)
    {
      this.setState({ isMyTurn: true });
      // If the board is new, announce the winner of the previous round, do Swal.close(), and create new board
    }
    else
    {
      this.setState({ isMyTurn: false });
    }
  }

  fireAlert(msg)
  {
    Swal.fire({
      position: 'top',
      allowOutsideClick: false,
      title: msg,
      text: '',
      width: 275,
      padding: '0.7em',
      // Custom CSS
      customClass: {
        heightAuto: false,
        title: 'title-class',
        popup: 'popup-class',
        confirmButton: 'button-class'
      }
    })
  }

  async checkWin()
  {
    var curr_game = await this.props.tictactoeInstance.games(this.props.roomId);
    if (curr_game.state.toNumber() == 0)
    {
      this.fireAlert("Thank you for playing!");
      clearInterval(this.updateApp);
      this.props.endGame();
      return;
    }
    if (curr_game.match_count.toNumber() != this.state.matchNo)
    {
      if (curr_game.host_win.toNumber() != this.state.hostScore)
      {
        if (curr_game.host.toLowerCase() == this.props.account)
          this.fireAlert('You won :)');
        else
          this.fireAlert('You lost :(')
      }
      else if (curr_game.joiner_win.toNumber() != this.state.joinerScore)
      {
        if (curr_game.joiner.toLowerCase() == this.props.account)
          this.fireAlert('You won :)');
        else
          this.fireAlert('You lost :(')
      }
      else
      {
        console.log("Shouldn't enter here");
      }
      this.setState({
        hostScore: curr_game.host_win.toNumber(),
        joinerScore: curr_game.joiner_win.toNumber(),
        matchNo: curr_game.match_count.toNumber(),
      });
    }
  }

  onMakeMove = async (index) =>
  {
    // Index is between 0 and 9. Send it appropriately to blockchain
    if (!this.state.isMyTurn)
    {
      this.fireAlert('Please wait for your turn');
      return;
    }
    let x = Math.floor(index / 3);
    let y = index % 3;
    console.log(x, y);
    await this.props.tictactoeInstance.makeMove(this.props.roomId, x, y, { from: this.props.account });
  }

  render()
  {
    let status, my_score, opp_score;
    // Change to current player's turn
    // console.log(this.state.isMyTurn);
    status = `${this.state.isMyTurn ? "Your turn" : "Opponent's turn"}`;
    my_score = `${this.props.isHost ? this.state.hostScore : this.state.joinerScore}`;
    opp_score = `${this.props.isHost ? this.state.joinerScore : this.state.hostScore}`;

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
            <p>Your score: {my_score} </p>
          </div>

          <div>
            <p>Opponent's score: {opp_score} </p>
          </div>
        </div>
      </div>
    );
  }
}

export default Game;
