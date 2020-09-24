const abiCoder = require('web3-eth-abi');
const config = require('../../config');
const { ContractNames, getContractAddress, getContractAbi } = require('../../build/');
const { sendOwnerEncodedFunction } = require('../shared');

const { networkId } = config;
const abi = getContractAbi(ContractNames.ERC721);
const erc721Address = getContractAddress(ContractNames.ERC721, networkId);
const mintMethod = abi.filter(m => m.name === 'publicMint')[0];

async function main() {
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    mintMethod,
    [config.ownerAddress, process.env.id]
  );

  const result = await sendOwnerEncodedFunction(encodedContractFunction, erc721Address);
  console.info(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
