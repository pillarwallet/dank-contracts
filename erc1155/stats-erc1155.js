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
  const json = fs.readFileSync(path.join(appRootPath.path, './erc1155/build/_ERC1155_sol_ERC1155.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();

const contract = new ethers.Contract(
  config.erc1155Address,
  abi,
  ethProvider
);

async function main () {
  const packedParams = ethers.utils.solidityPack(['address', 'uint256'], [config.erc721Address, process.env.id])
  const hash = ethers.utils.keccak256(packedParams);
  console.info('computed has', hash);
  const depositOf = await contract.dispensedOf(hash);
  console.info(`dispensedOf ${hash}`, depositOf.toString());
  const balanceOf = await contract.balanceOf(config.ownerAddress, hash);
  console.info(`balanceOf ${config.ownerAddress}`, balanceOf.toString());
}

main();