const { ethers } = require('ethers');
const { contracts } = require('../../build/contracts-localhost.json');
const { ethProvider } = require('../shared');

const abi = contracts.ERC721.abi;
const erc721Address = contracts.ERC721.address;

async function main() {
  const erc721Contract = new ethers.Contract(erc721Address, abi, ethProvider);

  const numTokens = await erc721Contract.balanceOf(process.env.owner);
  console.info('numTokens', numTokens.toNumber());

  let nextId = 1;
  if (numTokens.toNumber() > 0) {
    const lastId = await erc721Contract.tokenOfOwnerByIndex(process.env.owner, numTokens.toNumber() - 1);
    console.info('last id', lastId.toNumber());

    nextId = lastId.toNumber() + 1;
  }
  console.info('next id', nextId);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
