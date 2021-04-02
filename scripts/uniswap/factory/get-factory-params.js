const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../../build/');
const { ethProvider } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Factory);
const uniswapFactory = getContractAddress(ContractNames.UniswapV2Factory, networkId);

const contract = new ethers.Contract(uniswapFactory, abi, ethProvider);

async function main() {
  const stonkToken = await contract.stonkToken();
  console.info('Stonk token address: ', stonkToken);
  const dispenser = await contract.dispenser();
  console.info('Dispenser address: ', dispenser);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
