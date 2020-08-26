const { ethers, providers } = require('ethers');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc1155/build/ERC1155.abi.json'));
  return JSON.parse(json.toString());
};

const abi = getAbi();

const contract = new ethers.Contract(
  config.erc1155Address,
  abi,
  ethProvider
);

async function main () {
  const depositOf = await contract.dispensedOf(process.env.id);
  console.info(`dispensedOf ${process.env.id}`, depositOf.toString());
  const balanceOf = await contract.balanceOf(config.owner, process.env.id);
  console.info(`balanceOf ${config.owner}`, balanceOf.toString());
}

main();