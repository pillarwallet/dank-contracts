/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const { deployments, ethers, getNamedAccounts, getUnnamedAccounts } = require('hardhat');
const { expect } = require('chai');
const { getMemeTokenHash } = require('./utils');

const setup = deployments.createFixture(async () => {
  await deployments.fixture();
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  return {
    ERC721: await ethers.getContract('ERC721'),
    UniswapV2Factory: await ethers.getContract('UniswapV2Factory'),
    WrappedERC20: await ethers.getContract('WrappedERC20'),
    accounts: [account, ...accounts],
  };
});

describe('UniswapV2Factory', () => {
  it('createPair()', async function () {
    const {
      accounts: [account],
      UniswapV2Factory,
      ERC721,
      WrappedERC20,
    } = await setup();
    const memeId = 1;
    const tokenHash = getMemeTokenHash(ERC721.address, memeId);
    const createPair = await UniswapV2Factory.createPair(tokenHash);
    const pair = await UniswapV2Factory.getPair(tokenHash);

    await expect(Promise.resolve(createPair)) //
      .to.emit(UniswapV2Factory, 'PairCreated')
      .withArgs(account, tokenHash, WrappedERC20.address, pair, 1);
  });
});
