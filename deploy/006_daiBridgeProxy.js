/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('DaiBridgeProxy', {
    args: ['0x6b175474e89094c44da98b954eedeac495271d0f', '0x4aa42145aa6ebf72e164c9bbc74fbd3788045016'],
    from: deployer,
    log: true,
  });
};
module.exports = func;
module.exports.tags = ['DaiBridgeProxy'];
module.exports.skip = async ({ network: { name: networkName } }) => !['mainnet', 'localhost'].includes(networkName);
