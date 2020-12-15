const { ethers } = require('ethers');
const config = require('../../../config');
const { ContractNames, getContractAbi } = require('../../build/');
const { ethProvider } = require('../../shared');

const abi = getContractAbi(ContractNames.UniswapV2Pair);
const contract = new ethers.Contract(
  process.env.pair || config.pair,
  abi,
  ethProvider
);

async function main() {
  console.info('Pair reserves');
  const reserves = await contract.getReserves();
  console.info('Token: ', reserves[0].toString());
  console.info('Stonk: ', reserves[1].toString());
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
