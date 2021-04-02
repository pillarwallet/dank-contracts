const abiCoder = require('web3-eth-abi');
const config = require('../../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../../build/');
const { sendOwnerEncodedFunction } = require('../../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.UniswapV2Factory);
const uniswapFactory = getContractAddress(ContractNames.UniswapV2Factory, networkId);
const method = abi.filter((m) => m.name === 'createPair')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(method, [process.env.tokenHash || config.tokenHash]);

  const result = await sendOwnerEncodedFunction(encodedContractFunction, uniswapFactory);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
