const { ethers, providers } = require('ethers');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getERC721Abi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc721/build/_ERC721_sol_ERC721.abi'));
  return JSON.parse(json.toString());
};

const abi = getERC721Abi();
const method = abi.filter(m => m.name === 'safeTransferFrom')[0];

async function main () {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    method,
    [config.owner, config.erc1155Address, process.env.id]
  );

  const wallet = new ethers.Wallet(config.privateKey, ethProvider);
  const transactionCountPromise = await wallet.getTransactionCount();

  const result = await wallet.sendTransaction({
    to: config.erc721Address,
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