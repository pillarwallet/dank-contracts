/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const { deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('ERC721', {
    args: ['SAILOR_MOON_WAND', 'SMW'],
    from: deployer,
    log: true,
  });
};
module.exports = func;
module.exports.tags = ['ERC721'];