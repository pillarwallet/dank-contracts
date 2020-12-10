/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const { deployments, deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  const ERC20 = await deployments.get('ERC20');
  const ERC1155 = await deployments.get('ERC1155');

  const UniswapV2Factory = await deploy('UniswapV2Factory', {
    args: [deployer, ERC20.address, ERC1155.address],
    from: deployer,
    log: true,
  });

  await deploy('UniswapV2Router', {
    args: [UniswapV2Factory.address],
    from: deployer,
    log: true,
  });
};
module.exports = func;
module.exports.tags = ['UNISWAP'];
module.exports.dependencies = ['ERC20', 'ERC1155'];
