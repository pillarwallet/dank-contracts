const ERC721 = artifacts.require('ERC721');

module.exports = async (deployer, network) => {
  if (network === 'test') {
    return;
  }

  await deployer.deploy(ERC721, 'SAILOR_MOON_WAND', 'SMW');
};
