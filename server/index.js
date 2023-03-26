const express = require('express');
const cors = require('cors');
const _ = require('lodash');
const secp = require('ethereum-cryptography/secp256k1');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { utf8ToBytes } = require('ethereum-cryptography/utils');
const accounts  = require('../accounts.json');

const app = express();
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = _.transform(accounts, (result, account, i) => {
  result[account.address] = {
    balance: 1000 - i,
    publicKey: account.publicKey,
  };
}, {});
console.log(balances);

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const balance = _.get(balances, `${address}.balance`, 0);
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount, signature } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const senderBalance = getBalance(sender);
  if (senderBalance < amount) {
    res.status(400).send({ message: 'Not enough funds!' });
    return;
  }

  const message = `${recipient}:${amount}`;
  const isValid = validateSignature(sender, signature, message);
  if (!isValid) {
    res.status(400).send({ message: 'Wrong signature!' });
    return;
  }

  subtractBalance(sender, amount);
  addBalance(recipient, amount);
  res.send({ balance: getBalance(sender) });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = {
      balance: 0,
    };
  }
}

function getBalance(address) {
  return _.get(balances, `${address}.balance`, 0);
}

function addBalance(address, amount) {
  balances[address].balance += amount;
}

function subtractBalance(address, amount) {
  balances[address].balance -= amount;
}

function validateSignature(senderAddress, signature, message) {
  const publicKey = _.get(balances, `${senderAddress}.publicKey`);
  if (publicKey === undefined) {
    return false;
  }
  const messageHash = keccak256(utf8ToBytes(message));
  const _signature = Buffer.from(signature, 'hex');
  const _publicKey = Buffer.from(publicKey, 'hex');
  return secp.verify(_signature, messageHash, _publicKey);
}
