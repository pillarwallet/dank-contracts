/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('ERC721', {
    args: ['MemeSwap Meme', 'MSM'],
    from: deployer,
    log: true,
  });
};

module.exports = func;
module.exports.tags = ['ERC721'];
module.exports.skip = async ({ network: { name: networkName } }) => networkName === 'mainnet';
