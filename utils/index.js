const { ethers, providers } = require('ethers');
const config = require('../config');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const transactionParams = {
  gasLimit: '0x5F5E10',
  gasPrice: '0xa',
  value: 0,
  chainId: config.networkId,
}

async function sendOwnerEncodedFunction(encodedFunction, to) {
  console.info('Making owner transaction')
  const result = await sendEncodedFunction(encodedFunction, to, config.ownerPrivateKey);
  console.info(result);
}

async function sendTraderEncodedFunction (encodedFunction, to) {
  console.info('Making trader transaction')
  const result = await sendEncodedFunction(encodedFunction, to, config.traderPrivateKey);
  console.info(result);
}

async function sendEncodedFunction(encodedFunction, to, privateKey) {
  const wallet = new ethers.Wallet(privateKey, ethProvider);
  const nonce = await wallet.getTransactionCount();

  const result = await wallet.sendTransaction({
    ...transactionParams,
    nonce,
    to,
    data: encodedFunction,
  });
  return result;
}

module.exports = {
  transactionParams,
  sendOwnerEncodedFunction,
  sendTraderEncodedFunction,
  sendEncodedFunction
};