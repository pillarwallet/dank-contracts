const config = require('../config');
const ERC20 = artifacts.require('ERC20');
const ERC1155 = artifacts.require('ERC1155');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router = artifacts.require('UniswapV2Router');

module.exports = async (deployer, network) => {
  if (network === 'test') {
    return;
  }

  await deployer.deploy(UniswapV2Factory, config.ownerAddress, ERC20.address, ERC1155.address);
  await deployer.deploy(UniswapV2Router, UniswapV2Factory.address);
};
