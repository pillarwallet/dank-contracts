const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { ethProvider } = require('../../shared');

const networkId = config.networkId;
const abi = getContractAbi(ContractNames.UniswapV2Factory);
const uniswapFactory = getContractAddress(ContractNames.UniswapV2Factory, networkId);

const contract = new ethers.Contract(
  uniswapFactory,
  abi,
  ethProvider
);

async function main() {
  const pair = await contract.getPair(process.env.tokenHash || config.tokenHash);
  console.info('Pair', pair);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
