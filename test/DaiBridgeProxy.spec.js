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
const { createDaiTokenTypedDataFactory, deployContract, toWei } = require('./utils');

const setup = deployments.createFixture(async () => {
  const daiToken = await deployContract('ERC20PermitMock', ['DAI', 'DAI']);
  const daiBridge = await deployContract('DaiBridgeMock', [daiToken.address]);
  const daiBridgeProxy = await deployContract('DaiBridgeProxy', [daiToken.address, daiBridge.address]);
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  const daiTokenTypedDataFactory = createDaiTokenTypedDataFactory(daiToken);

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

  it('depositWithPermit()', async function () {
    const {
      accounts: [account],
      daiToken,
      daiBridge,
      daiBridgeProxy,
      daiTokenTypedDataFactory,
    } = await setup();

    const amount = toWei(5);

    // mint tokens
    await daiToken.deposit({
      value: amount,
    });

    expect(await daiToken.balanceOf(account)).to.equal(amount);
    expect(await daiToken.balanceOf(daiBridge.address)).to.equal(0);

    const nonce = (await daiToken.nonces(account)).toNumber();
    const expiry = 0;

    const senderSignature = await daiTokenTypedDataFactory.signTypeData(account, {
      holder: account,
      spender: daiBridgeProxy.address,
      nonce,
      expiry,
      allowed: true,
    });

    const sig = utils.splitSignature(senderSignature);
    const depositFor = daiBridgeProxy.depositWithPermit(amount, account, nonce, expiry, sig.v, sig.r, sig.s);

    await expect(depositFor) //
      .to.emit(daiBridge, 'UserRequestForAffirmation')
      .withArgs(account, amount);

    expect(await daiToken.balanceOf(account)).to.equal(0);
    expect(await daiToken.balanceOf(daiBridge.address)).to.equal(amount);
  });
});
