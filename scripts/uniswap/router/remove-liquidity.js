const { ethers } = require('ethers');
const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../../build/');
const { sendOwnerEncodedFunction } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Router);
const uniswapRouter = getContractAddress(ContractNames.UniswapV2Router, networkId);
const method = abi.filter((m) => m.name === 'removeLiquidity')[0];

async function main() {
  const allLiquidity = ethers.BigNumber.from(141421355237);
  const encodedContractFunction = abiCoder.encodeFunctionCall(method, [
    process.env.tokenHash || config.tokenHash,
    ethers.utils.hexlify(allLiquidity),
    0x0,
    0x0,
    config.ownerAddress,
    new Date().valueOf() + 1000 * 60 * 60 * 10, // 10 hours
  ]);

  const result = await sendOwnerEncodedFunction(encodedContractFunction, uniswapRouter);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
