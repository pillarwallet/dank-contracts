const { ethers, providers } = require('ethers');
const config = require('./../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc1155/build/ERC1155.abi.json'));
  return JSON.parse(json.toString());
};

const getBin = () => {
  return fs.readFileSync(path.join(appRootPath.path, './erc1155/build/_ERC1155_sol_ERC1155.bin'));
};

const getRemixBin = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc1155/build/ERC1155.json'));
  return JSON.parse(json.toString());
};

async function main () {
  const abi = getAbi();
  const bin = getBin();
  const remixBin = getRemixBin();
  let wallet = new ethers.Wallet(config.privateKey, ethProvider);
  const contractFactory = new ethers.ContractFactory(abi, remixBin.object, wallet);
  const result = await contractFactory.deploy();
}

main();