const { ethers } = require('ethers');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { ethProvider } = require('../shared');

const networkId = config.networkId;
const abi = getContractAbi(ContractNames.ERC1155);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const erc721Address = getContractAddress(ContractNames.ERC721, networkId);
const erc1155Address = getContractAddress(ContractNames.ERC1155, networkId);

const contract = new ethers.Contract(
  erc1155Address,
  abi,
  ethProvider
);

async function main() {
  console.info('ERC1155 dispenser stats');
  const packedParams = ethers.utils.solidityPack(['address', 'uint256'], [erc721Address, process.env.id])
  const hash = ethers.utils.keccak256(packedParams);
  const depositOf = await contract.dispensedOf(hash);

  console.info('HASH', hash);
  console.info('DISPENSED: ', depositOf.toString());
  console.info('-------------------------------------');

  const ownerBalance = await contract.balanceOf(config.ownerAddress, hash);
  const ownerRouterAllowance = await contract.isApprovedForAll(config.ownerAddress, uniswapRouter);

  console.info('wallet (owner): ', config.ownerAddress);
  console.info('BALANCE: ', ownerBalance.toString());
  console.info('ROUTER ALLOWANCE: ', ownerRouterAllowance.toString());
  console.info('-------------------------------------');

  const traderBalance = await contract.balanceOf(config.traderAddress, hash);
  const traderRouterAllowance = await contract.isApprovedForAll(config.traderAddress, uniswapRouter);

  console.info('wallet (trader): ', config.traderAddress);
  console.info('BALANCE: ', traderBalance.toString());
  console.info('ROUTER ALLOWANCE: ', traderRouterAllowance.toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
