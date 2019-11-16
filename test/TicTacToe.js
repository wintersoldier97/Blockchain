var TicTacToe = artifacts.require("../contracts/TicTacToe.sol");

contract("TicTacToe", function (accounts)
{
  console.log(accounts);
  // it("initializes with right owner address", function() {
  //     return TicTacToe.deployed({from:accounts[0]}).then(function(instance) {
  //       return instance.owner();
  //     }).then(function(owner) {
  //       assert.equal(owner, accounts[0]);
  //     });
  // });

  let instance;

  before(async () =>
  {
    instance = await TicTacToe.new();
  })

  it('initialises with initial contract balance as 0 ETH', async () =>
  {
    let balance = await web3.eth.getBalance(instance.address);
    assert.equal(balance, 0);
  })

  it('initialises with right owner address', async () =>
  {
    let owner_add = await instance.owner();
    assert.equal(owner_add, accounts[0]);
  })

  it('initialises with right starting parameters', async () =>
  {
    let state = await instance.state();
    let game_num = await instance.match_count();
    let match_count = await instance.match_count();
    let balance = await instance.balance();

    assert.equal(state, 0);
    assert.equal(game_num, 0);
    assert.equal(match_count, 0);
    assert.equal(balance, 0);
  })

  it('initialises with right host address and updates contract balance', async () =>
  {
    let two_eth = web3.utils.toWei("0.01", "ether");
    // await web3.eth.sendTransaction({from: accounts[1], to: instance.address, value: one_eth});
    await instance.start({ from: accounts[1], value: two_eth });
    let host_addr = await instance.host();
    let balance_wei = await web3.eth.getBalance(instance.address);
    let balance_ether = web3.utils.fromWei(balance_wei, "ether");
    assert.equal(balance_ether, 0.01);
    assert.equal(host_addr, accounts[1]);
  })

  it('Does not let multiple accounts to call join', async () =>
  {
    let two_eth = web3.utils.toWei("0.01", "ether");
    let old_state = await instance.state();
    await instance.start({ from: accounts[4], value: two_eth }).catch(function (e) { });
    let new_state = await instance.state();
    assert.equal(old_state.toNumber(), new_state.toNumber());
    // assert.equal(join_addr, accounts[2]);
  })

  it('initialises with right joiner address and updates contract balance', async () =>
  {
    let two_eth = web3.utils.toWei("0.01", "ether");
    // await web3.eth.sendTransaction({from: accounts[1], to: instance.address, value: one_eth});
    await instance.join(accounts[1], { from: accounts[2], value: two_eth });
    let join_addr = await instance.joiner();
    let balance_wei = await web3.eth.getBalance(instance.address);
    let balance_ether = web3.utils.fromWei(balance_wei, "ether");
    assert.equal(balance_ether, 0.02);
    assert.equal(join_addr, accounts[2]);
  })

  it("Should abort with an error: Multiple Join requests", async function ()
  {
    let two_eth = web3.utils.toWei("0.01", "ether");
    let old_state = await instance.state();
    await instance.join(accounts[1], { from: accounts[4], value: two_eth }).catch(function (e) { assert.equal(1, 1); });
  });


  // Owner is Accounts[0], Host is Accounts[1], Joiner is Accounts[2]

  // Turn Logic:

  // Test Case to check that it shows the right player's address for playing
  it('shows the right player to make a move', async () =>
  {
    let addr = await instance.currentPlayerAddress();
    let match_count = await instance.match_count();
    let turn = await instance.current_move();
    assert.equal(addr, accounts[2]);
    assert.equal(match_count, 0);
    assert.equal(turn, 0);
  })

  // Test Case to check if non player tries to make a move
  it('Should abort with an error: Non Players makes a move', async () =>
  {
    await instance.MakeMove(0, 0, { from: accounts[3] }).catch(function (e) { assert("Returned error: VM Exception while processing transaction: revert", e.message) });
  })

  // State check
  it('Current state should be 2', async () =>
  {
    let state = await instance.state();
    assert(state, 2);
  })


  // Game Logic Tests

  it('Joiner is assigned the X symbol', async () =>
  {
    await instance.MakeMove(0, 1, { from: accounts[2] });
    let temp = await instance.stateToString();
    // console.log(temp.substring(1,6));
    assert("O|", temp.substring(1, 3));
  })

  it('Host is assigned the O symbol', async () =>
  {
    await instance.MakeMove(0, 0, { from: accounts[1] });
    let temp = await instance.stateToString();
    // console.log(temp.substring(1,6));
    assert("O|X", temp.substring(1, 4));
  })

  it('Moves are registered and Board is updated', async () =>
  {
    await instance.MakeMove(0, 2, { from: accounts[2] });

    let temp = await instance.stateToString();
    // console.log(temp.substring(1,6));
    assert("O|X|X", temp.substring(1, 6));
  })

  // Check Next Turn : Host aka Accounts[1]

  it('shows the right player to make a move', async () =>
  {
    let addr = await instance.currentPlayerAddress();
    assert.equal(addr, accounts[1]);
  })

  // Check to make out of range 

  it('Should abort with an error: Non Players makes a move', async () =>
  {
    await instance.MakeMove(4, 2, { from: accounts[1] }).catch(function (e) { assert("Returned error: VM Exception while processing transaction: revert", e.message); });
  })

  // Win - Condition for Host

  it('GameOver Condition is working: Host win condition and New match in bo4', async () =>
  {
    await instance.MakeMove(1, 0, { from: accounts[1] });
    await instance.MakeMove(1, 2, { from: accounts[2] });
    await instance.MakeMove(2, 0, { from: accounts[1] });

    let host_win = await instance.host_win();
    let match_count = await instance.match_count();
    let state = await instance.state();
    let current_move = await instance.current_move();
    let temp = await instance.stateToString();

    assert(host_win, 1);
    assert(match_count, 1);
    assert(state, 2);
    assert(current_move, 0);
    assert(" | | ", temp.substring(1, 6));
    // console.log(temp);
  })

  // Check Next Turn : Host aka Accounts[1]

  it('After match1: shows the right player to make a move', async () =>
  {
    let addr = await instance.currentPlayerAddress();
    assert.equal(addr, accounts[1]);
  })

  // Win - Condition for Joiner 
  it('GameOver Condition is working: Joiner win condition and New match in bo4', async () =>
  {
    await instance.MakeMove(0, 0, { from: accounts[1] });
    await instance.MakeMove(1, 1, { from: accounts[2] });
    await instance.MakeMove(0, 1, { from: accounts[1] });
    await instance.MakeMove(0, 2, { from: accounts[2] });
    await instance.MakeMove(1, 0, { from: accounts[1] });
    await instance.MakeMove(2, 0, { from: accounts[2] });

    let host_win = await instance.host_win();
    let joiner_win = await instance.joiner_win();
    let match_count = await instance.match_count();
    let state = await instance.state();
    let current_move = await instance.current_move();
    let temp = await instance.stateToString();

    assert(host_win, 1);
    assert(joiner_win, 1);
    assert(match_count, 2);
    assert(state, 2);
    assert(current_move, 0);
    assert(" | | ", temp.substring(1, 6));
  })

  it('After match2: shows the right player to make a move', async () =>
  {
    let addr = await instance.currentPlayerAddress();
    assert.equal(addr, accounts[2]);
  })

  // Draw - Condition

  it('GameOver Condition is working: Draw condition and New match in bo4', async () =>
  {
    await instance.MakeMove(1, 1, { from: accounts[2] });
    await instance.MakeMove(0, 0, { from: accounts[1] });
    await instance.MakeMove(0, 2, { from: accounts[2] });
    await instance.MakeMove(0, 1, { from: accounts[1] });
    await instance.MakeMove(2, 1, { from: accounts[2] });
    await instance.MakeMove(2, 0, { from: accounts[1] });
    await instance.MakeMove(1, 0, { from: accounts[2] });
    await instance.MakeMove(1, 2, { from: accounts[1] });
    await instance.MakeMove(2, 2, { from: accounts[2] });

    let host_win = await instance.host_win();
    let joiner_win = await instance.joiner_win();
    let match_count = await instance.match_count();
    let state = await instance.state();
    let current_move = await instance.current_move();
    let temp = await instance.stateToString();

    assert(host_win, 1);
    assert(joiner_win, 1);
    assert(match_count, 3);
    assert(state, 2);
    assert(current_move, 0);
    assert(" | | ", temp.substring(1, 6));
  })

  // Final Joiner - win condition 

  it('GameOver Condition is working: Joiner win condition and End of bo4', async () =>
  {

    let old_balance = await web3.eth.getBalance(accounts[2]);

    await instance.MakeMove(0, 0, { from: accounts[1] });
    await instance.MakeMove(1, 1, { from: accounts[2] });
    await instance.MakeMove(0, 1, { from: accounts[1] });
    await instance.MakeMove(0, 2, { from: accounts[2] });
    await instance.MakeMove(1, 0, { from: accounts[1] });
    await instance.MakeMove(2, 0, { from: accounts[2] });

    let new_balance = await web3.eth.getBalance(accounts[2]);
    assert(new_balance > old_balance);

    let host_win = await instance.host_win();
    let joiner_win = await instance.joiner_win();
    let match_count = await instance.match_count();
    let state = await instance.state();
    let bal = await instance.balance();
    let current_move = await instance.current_move();
    let temp = await instance.stateToString();

    assert(host_win, 0);
    assert(joiner_win, 0);
    assert(match_count, 0);
    assert(state, 0);
    assert(bal, 0);
    assert(current_move, 0);
    assert(" | | ", temp.substring(1, 6));
    assert(" | | ", temp.substring(7, 12));
    assert(" | | ", temp.substring(13, 18));
  })

});


