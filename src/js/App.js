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
      isRoomCreator: false,
      isDisabled: false,
      isPlaying: false,
    };
    // let web3 = window.web3;

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
    this.roomId = null;

  }

  componentWillUnmount()
  {
    // Reset the game or something
  }

  async componentDidUpdate()
  {
    // Check that the player has created or joined the game
    if (this.roomId != null)
    {
      var curr_game = await this.tictactoeInstance.games(this.roomId);
      if (curr_game.state == 2)
      {
        this.setState({ isPlaying: true });
        Swal.close();
      }
    }
  }

  // Create a room channel
  onPressCreate = async (e) =>
  {
    this.tictactoeInstance = await this.tictactoe.deployed();
    var account = await this.web3.eth.getCoinbase();
    this.setState({ account: account });
    var val = this.web3.utils.toWei("0.0001", "ether");
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
      isRoomCreator: true,
      isDisabled: true, // Disable the 'Create' button
      isPlaying: true,
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
        var account = await this.web3.eth.getCoinbase();
        this.tictactoeInstance = await this.tictactoe.deployed();
        this.setState({ account: account });
        // TODO Add an option to change the amount of ether
        var val = this.web3.utils.toWei("0.0001", "ether");
        await this.tictactoeInstance.join(this.roomId, { from: this.state.account, value: val });

        this.setState({
          isRoomCreator: false,
          isDisabled: true,
          isPlaying: true,
        });
      }
    })
  }

  // Reset everything
  endGame = () =>
  {
    this.setState({
      account: 0x0,
      isRoomCreator: false,
      isDisabled: false,
      isPlaying: false,
    });
    this.roomId = null;
  }

  render()
  {
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
                  className="create-button "
                  disabled={this.state.isDisabled}
                  onClick={(e) => this.onPressCreate()}
                > Create
                  </button>
                <button
                  className="join-button"
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
            tictactoeInstance={this.tictactoeInstance}
            isRoomCreator={this.state.isRoomCreator}
            endGame={this.endGame}
          />
        }
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.querySelector('#root')
)
