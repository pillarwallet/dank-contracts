/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('PermittableERC20', {
    args: ['Permittable DAI', 'PDAI'],
    from: deployer,
    log: true,
  });
};
module.exports = func;
module.exports.tags = ['PermittableERC20'];
module.exports.skip = async ({ network: { name: networkName } }) => {
  return !['localhost', 'localB', 'hardhat'].includes(networkName);
};
