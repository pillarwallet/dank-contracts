/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const {
    deployments,
    deployments: { deploy },
    getNamedAccounts,
    network: { name: networkName },
  } = hre;
  const { deployer } = await getNamedAccounts();

  const WrappedERC20 = await deployments.get('WrappedERC20');
  const ERC1155 = await deployments.get('ERC1155');

  let baseTokenAddress;
  switch (networkName) {
    case 'bsc':
      baseTokenAddress = '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3'; // DAI
      break;
    default:
      baseTokenAddress = WrappedERC20.address;
  }

  const UniswapV2Pair = await deploy('UniswapV2Pair', {
    args: [],
    from: deployer,
    log: true,
  });

  const UniswapV2Factory = await deploy('UniswapV2Factory', {
    args: [deployer, baseTokenAddress, ERC1155.address],
    from: deployer,
    log: true,
    libraries: {
      UniswapV2Pair: UniswapV2Pair.address,
    },
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
