const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendOwnerEncodedFunction } = require('../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.ERC20);
const erc20Address = getContractAddress(ContractNames.ERC20, networkId);
const mintMethod = abi.filter(m => m.name === 'mint')[0];

async function main() {
  const amount = ethers.BigNumber.from(10).pow(18);
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    mintMethod,
    [config.traderAddress, ethers.utils.hexlify(amount)] // 1 token of decimal 18
  );

  const result = await sendOwnerEncodedFunction(encodedContractFunction, erc20Address);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
