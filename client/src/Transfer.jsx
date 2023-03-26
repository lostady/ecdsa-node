import { useState } from 'react';
import server from './server';
import * as secp from 'ethereum-cryptography/secp256k1';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { utf8ToBytes, toHex } from 'ethereum-cryptography/utils';
import accounts from '../../accounts.json';
import _ from 'lodash';
import { Buffer } from 'buffer';

function sign(sender, recipient, amount) {
  const senderAccount = _.find(accounts, { address: sender });
  if (!senderAccount) {
    throw new Error('Invalid sender');
  }

  const message = `${recipient}:${amount}`;
  const messageHash = keccak256(utf8ToBytes(message));
  const privateKey = Buffer.from(senderAccount.privateKey, 'hex');
  return secp.sign(messageHash, privateKey);
}

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    let signature;
    try {
      signature = await sign(address, recipient, sendAmount);
      console.log(toHex(signature));
    } catch (error) {
      alert('Failed to sign!');
      return;
    }

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
        signature: toHex(signature),
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className='container transfer' onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder='Type an address'
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type='submit' className='button' value='Transfer' />
    </form>
  );
}

export default Transfer;
