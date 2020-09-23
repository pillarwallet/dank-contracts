const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const config = require('../config');
const {
  sendOwnerEncodedFunction,
  sendTraderEncodedFunction
} = require('../utils');

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

  await sendOwnerEncodedFunction(encodedContractFunction, config.erc1155Address);
  await sendTraderEncodedFunction(encodedContractFunction, config.erc1155Address);
}

main();