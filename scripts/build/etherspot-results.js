const { networkId } = require('../../config');
const contracts = require('../../build/contracts');

const template = (contractName, contractAddress) => {
  const names = {
    ERC1155: 'dispenser',
    ERC20: 'stonk',
    ERC721: 'memeMinter',
    UniswapV2Factory: 'factory',
    UniswapV2Router: 'router',
  };
  const after = {
    ERC1155: ' // erc1155',
    ERC20: ' // erc20',
    ERC721: ' // erc721',
  };
  return `  ${names[contractName] || contractName}: '${contractAddress}',${after[contractName] || ''}`;
};

console.log('{');
Object.entries(contracts).forEach(([contractName, contractData]) => {
  if (!Object.keys(contractData.addresses).length) return;
  console.log(template(contractName, contractData.addresses[networkId] || ''));
});
console.log('}');
