/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const { deployments, deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  const WrappedERC20 = await deployments.get('WrappedERC20');
  const ERC1155 = await deployments.get('ERC1155');

  const UniswapV2Factory = await deploy('UniswapV2Factory', {
    args: [deployer, WrappedERC20.address, ERC1155.address],
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
module.exports.dependencies = ['WrappedERC20', 'ERC1155'];
