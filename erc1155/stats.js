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
  console.info('ERC1155 dispenser stats');
  const packedParams = ethers.utils.solidityPack(['address', 'uint256'], [config.erc721Address, process.env.id])
  const hash = ethers.utils.keccak256(packedParams);
  const depositOf = await contract.dispensedOf(hash);

  console.info('HASH', hash);
  console.info('DISPENSED: ', depositOf.toString());
  console.info('-------------------------------------');

  const ownerBalance = await contract.balanceOf(config.ownerAddress, hash);
  const ownerRouterAllowance = await contract.isApprovedForAll(config.ownerAddress, config.uniswapRouter);
  
  console.info('wallet (owner): ', config.ownerAddress);
  console.info('BALANCE: ', ownerBalance.toString());
  console.info('ROUTER ALLOWANCE: ', ownerRouterAllowance.toString());
  console.info('-------------------------------------');

  const traderBalance = await contract.balanceOf(config.traderAddress, hash);
  const traderRouterAllowance = await contract.isApprovedForAll(config.traderAddress, config.uniswapRouter);

  console.info('wallet (trader): ', config.traderAddress);
  console.info('BALANCE: ', traderBalance.toString());
  console.info('ROUTER ALLOWANCE: ', traderRouterAllowance.toString());
}

main();