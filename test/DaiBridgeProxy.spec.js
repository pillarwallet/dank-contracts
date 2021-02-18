/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const {
  deployments,
  ethers: { utils },
  getNamedAccounts,
  getUnnamedAccounts,
} = require('hardhat');
const { expect } = require('chai');
const { createTypedDataFactory, deployContract, toWei } = require('./utils');

const setup = deployments.createFixture(async () => {
  const daiToken = await deployContract('ERC20PermitMock', ['test', 'DAI']);
  const daiBridge = await deployContract('DaiBridgeMock', [daiToken.address]);
  const daiBridgeProxy = await deployContract('DaiBridgeProxy', [daiToken.address, daiBridge.address]);
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  const daiTokenTypedDataFactory = createTypedDataFactory(daiToken, 'Permit', [
    {
      name: 'holder',
      type: 'address',
    },
    {
      name: 'spender',
      type: 'address',
    },
    {
      name: 'nonce',
      type: 'uint256',
    },
    {
      name: 'expiry',
      type: 'uint256',
    },
    {
      name: 'allowed',
      type: 'bool',
    },
  ]);

  return {
    daiToken,
    daiBridge,
    daiBridgeProxy,
    daiTokenTypedDataFactory,
    accounts: [account, ...accounts],
  };
});

describe('DaiBridgeProxy', () => {
  it('daiToken()', async function () {
    const { daiToken, daiBridgeProxy } = await setup();

    const daiTokenRealAddress = daiToken.address;
    const daiTokenSetUpAddress = await daiBridgeProxy.daiToken();

    expect(daiTokenRealAddress).to.equal(daiTokenSetUpAddress);
  });

  it('daiBridge()', async function () {
    const { daiBridge, daiBridgeProxy } = await setup();

    const daiBridgeRealAddress = daiBridge.address;
    const daiBridgeSetUpAddress = await daiBridgeProxy.daiBridge();

    expect(daiBridgeSetUpAddress).to.equal(daiBridgeRealAddress);
  });

  it('depositFor()', async function () {
    const {
      accounts: [account],
      daiToken,
      daiBridge,
      daiBridgeProxy,
      daiTokenTypedDataFactory,
    } = await setup();

    // mint Dai tokens
    const ethAmount = toWei(5);

    await daiToken.deposit({
      value: ethAmount,
    });

    expect(await daiToken.balanceOf(account)).to.equal(ethAmount);
    expect(await daiToken.balanceOf(daiBridge.address)).to.equal(0);

    const nonce = (await daiToken.nonces(account)).toNumber();
    const nextNonce = nonce + 1;
    const expiry = 0;

    const senderSignature = await daiTokenTypedDataFactory.signTypeData(account, {
      holder: account,
      spender: daiBridgeProxy.address,
      nonce: nextNonce,
      expiry,
      allowed: true,
    });

    const sig = utils.splitSignature(senderSignature);
    await daiBridgeProxy.depositFor(ethAmount, account, nextNonce, expiry, sig.v, sig.r, sig.s);

    expect(await daiToken.balanceOf(account)).to.equal(0);
    expect(await daiToken.balanceOf(daiBridge.address)).to.equal(ethAmount);
  });
});
