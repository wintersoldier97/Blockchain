import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import Web3 from 'web3'
import TruffleContract from 'truffle-contract'
import TicTacToe from '../../build/contracts/TicTacToe.json'
import Game from './Game';
import Board from './Board';
import Swal from "sweetalert2";
import './Game.css';
import BigNumber from 'bignumber.js';

class App extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      account: 0x0,
      isHost: false,
      isDisabled: false,
      isPlaying: false,
    };
    this.roomId = null;
  }

  async componentDidMount()
  {
    // Load the blockchain
    if (typeof web3 !== 'undefined')
    {
      this.web3Provider = web3.currentProvider;
      this.web3 = new Web3(web3.currentProvider);
    } else
    {
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      this.web3 = new Web3(this.web3Provider);
    }

    this.tictactoe = TruffleContract(TicTacToe);
    this.tictactoe.setProvider(this.web3Provider);
    this.tictactoeInstance = await this.tictactoe.deployed();
    var account = await this.web3.eth.getCoinbase();
    account = account.toLowerCase();
    this.setState({ account: account });

    // Set a timer to check whether someone has joined the game or not
    this.updateApp = setInterval(
      () => this.checkRoom(),
      1000
    );
  }

  async checkRoom()
  {
    if (this.roomId != null)
    {
      var curr_game = await this.tictactoeInstance.games(this.roomId);
      if (curr_game.state.toNumber() == 2)
      {
        this.setState({ isPlaying: true });
        clearInterval(this.updateApp);
      }
    }
  }

  componentWillUnmount()
  {
    // Reset the game
  }

  // Create a room channel
  onPressCreate = async (e) =>
  {
    var val = this.web3.utils.toWei("2", "ether");
    this.roomId = Math.floor(Math.random() * 52);
    await this.tictactoeInstance.create(this.roomId, { from: this.state.account, value: val });

    // Open the modal
    // @ts-ignore
    Swal.fire({
      position: 'top',
      allowOutsideClick: false,
      title: 'Share this room ID with your friend',
      text: this.roomId,
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
    this.setState({
      isDisabled: true,
      isHost: true
    });
  }

  // The 'Join' button was pressed
  onPressJoin = (e) =>
  {
    // @ts-ignore
    Swal.fire({
      position: 'top',
      input: 'text',
      allowOutsideClick: false,
      inputPlaceholder: 'Enter the room id',
      showCancelButton: true,
      confirmButtonColor: 'rgb(208,33,41)',
      confirmButtonText: 'OK',
      width: 275,
      padding: '0.7em',
      customClass: {
        heightAuto: false,
        popup: 'popup-class',
        confirmButton: 'join-button-class ',
        cancelButton: 'join-button-class'
      }
    }).then(async (result) =>
    {
      // Check if the user typed a value in the input field
      if (result.value)
      {
        this.roomId = result.value;
        console.log(this.roomId);
        // TODO Add an option to change the amount of ether
        var val = this.web3.utils.toWei("2", "ether");
        await this.tictactoeInstance.join(this.roomId, { from: this.state.account, value: val });

        this.setState({
          isPlaying: true,
        });
      }
    })
  }

  // Reset everything
  endGame = () =>
  {
    this.roomId = null;
    this.setState({
      account: 0x0,
      isDisabled: false,
      isPlaying: false,
    });
  }

  render()
  {
    console.log("Rendered");
    return (
      <div>
        <div className="title">
          <p>React Tic Tac Toe Dapp</p>
        </div>

        {
          !this.state.isPlaying &&
          <div className="game">
            <div className="board">
              <Board
                squares={0}
                onClick={index => null}
              />

              <div className="button-container">
                <button
                  className="create-button"
                  disabled={this.state.isDisabled}
                  onClick={(e) => this.onPressCreate()}
                > Create
                  </button>
                <button
                  className="join-button"
                  disabled={this.state.isDisabled}
                  onClick={(e) => this.onPressJoin()}
                > Join
                  </button>
              </div>

            </div>
          </div>
        }

        {
          this.state.isPlaying &&
          <Game
            account={this.state.account}
            roomId={this.roomId}
            isHost={this.state.isHost}
            tictactoeInstance={this.tictactoeInstance}
            endGame={this.endGame}
          />
        }
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
)
