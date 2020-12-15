/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const { deployments, ethers, getNamedAccounts, getUnnamedAccounts } = require('hardhat');
const { expect } = require('chai');
const { ZERO_ADDRESS, processTx } = require('./utils');

const setup = deployments.createFixture(async () => {
  await deployments.fixture();
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  return {
    ERC721: await ethers.getContract('ERC721'),
    accounts: [account, ...accounts],
  };
});

describe('ERC721', () => {
  it('publicMint()', async function () {
    const {
      accounts: [account],
      ERC721,
    } = await setup();
    const memeId = 1;
    const mint = ERC721.publicMint(account, memeId);

    await expect(mint) //
      .to.emit(ERC721, 'Transfer')
      .withArgs(ZERO_ADDRESS, account, memeId)
      .and.to.emit(ERC721, 'Mint')
      .withArgs(account, memeId);

    const mintedTokens = await ERC721.balanceOf(account);
    expect(mintedTokens).to.equal(1);

    const ownerOf = await ERC721.ownerOf(memeId);
    expect(ownerOf).to.equal(account);
  });

  it('safeTransferFrom()', async function () {
    const {
      accounts: [AliceAccount, BobAccount],
      ERC721,
    } = await setup();
    const memeId = 1;

    await processTx(ERC721.publicMint(AliceAccount, memeId));
    expect(await ERC721.ownerOf(memeId)).to.equal(AliceAccount);

    const safeTransferFrom = 'safeTransferFrom(address,address,uint256)';
    await processTx(ERC721[safeTransferFrom](AliceAccount, BobAccount, memeId));
    expect(await ERC721.ownerOf(memeId)).to.equal(BobAccount);

    expect(await ERC721.balanceOf(AliceAccount)).to.equal(0);
    expect(await ERC721.balanceOf(BobAccount)).to.equal(1);
  });
});
