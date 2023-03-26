const fs = require('fs');

const secp = require('ethereum-cryptography/secp256k1');
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");
const argv = require('minimist')(process.argv.slice(2));

console.log(`argv: ${JSON.stringify(argv)}`);

const ACCOUNT_FILE_PATH = '../accounts.json';

const accounts = [];
const numberOfAccounts = argv.n || 1;

for (let i = 0; i < numberOfAccounts; i++) {
  const privateKey = secp.utils.randomPrivateKey();
  const publicKey = secp.getPublicKey(privateKey);
  const address = keccak256(publicKey.slice(1)).slice(-20);

  accounts.push({
    privateKey: toHex(privateKey),
    publicKey: toHex(publicKey),
    address: toHex(address),
  });

  console.log(accounts);
  try {
    fs.writeFileSync(ACCOUNT_FILE_PATH, JSON.stringify(accounts));
  } catch (err) {
    console.error(err);
  }
}