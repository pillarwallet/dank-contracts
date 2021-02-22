/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('Bridge', {
    args: [],
    from: deployer,
    log: true,
  });
};
module.exports = func;
module.exports.tags = ['Bridge'];
module.exports.skip = async ({ network: { name: networkName } }) => networkName === 'mainnet';
