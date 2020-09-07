const { ethers, providers } = require('ethers');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const config = require('../config');


const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc1155/build/_ERC1155_sol_ERC1155.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const method = abi.filter(m => m.name === 'setApprovalForAll')[0];

async function main () {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [config.uniswapRouter, true]
  );
  const wallet = new ethers.Wallet(config.ownerPrivateKey, ethProvider);
  const transactionCountPromise = await wallet.getTransactionCount();

  const result = await wallet.sendTransaction({
    to: config.erc1155Address,
    nonce: transactionCountPromise,
    gasLimit: '0x5F5E10',
    gasPrice: '0xa',
    data: encodedContractFunction,
    value: 0,
    chainId: config.networkId,
  });
  console.info(result);
}

main();