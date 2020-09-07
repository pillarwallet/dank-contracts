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
  const json = fs.readFileSync(path.join(appRootPath.path, './erc721/build/_ERC721_sol_ERC721.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();

const contract = new ethers.Contract(
  config.erc20Address,
  abi,
  ethProvider
);

async function main () {
  const balance = await contract.balanceOf(config.ownerAddress);
  console.info(`Balance ${config.ownerAddress}`, balance.toString());

  const supply = await contract.totalSupply();
  console.info(`Supply`, supply.toString());

  const owner = await contract.ownerOf(7);
  console.info(`Owner of tokenID ${process.env.id}`, owner.toString());
}

main();