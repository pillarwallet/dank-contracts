/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const { deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('ERC20', {
    args: ['Stonk', 'STNK'],
    from: deployer,
    log: true,
  });
};
module.exports = func;
module.exports.tags = ['ERC20'];
