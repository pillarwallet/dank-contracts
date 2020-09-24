const ERC1155 = artifacts.require('ERC1155');

module.exports = async (deployer, network) => {
  if (network === 'test') {
    return;
  }

  await deployer.deploy(ERC1155);
};
