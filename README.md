# Blockchain

## Installation

Install Ganache
npm install -g truffle
npm install (Installs the app dependencies)
Create a Ganache workspace (Will mostly be localhost:7545)
Install Metamask on Chrome as well as Firefox (metamask.io)
Connect Metamask to the Ganache server and import accounts 1 & 2 for Firefox and 8 & 9 for Chrome
In Metamask settings for both, go to connections and add localhost as a site to allow connection to Ganache
truffle migrate --reset
npm start

## Play

Open localhost:8080 on both
To play, just create a game on Firefox and remember the room id
Then, on Chrome, Join the game by putting in the room id
