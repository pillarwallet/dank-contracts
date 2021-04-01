/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const {
    deployments: { deploy, execute },
    getNamedAccounts,
    network: { name: networkName },
  } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy('Bridge', {
    args: [],
    from: deployer,
    log: true,
  });

  let owner;
  switch (networkName) {
    case 'goerli':
    case 'rinkeby':
      owner = '0xaDb2Ce8343Ea0cEB3828AD1C7788BCbE2dfcb76D';
      break;
    case 'mainnet':
    case 'bsc':
      owner = '0x426435a8452733858771dB2E674b613813BA70CA';
      break;
    default:
      owner = '0x5cCA0E658c05482a4569c12487E3D6e51Fe28b28';
  }

  await execute('Bridge', { from: deployer }, 'transferOwnership', owner);
};
module.exports = func;
module.exports.tags = ['Bridge'];
module.exports.skip = async ({ network: { name: networkName } }) => networkName === 'mainnet';
