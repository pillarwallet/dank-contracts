const ERC20 = artifacts.require('ERC20');

module.exports = async (deployer, network) => {
  if (network === 'test') {
    return;
  }

  await deployer.deploy(ERC20, 'Stonk', 'STNK');
};
