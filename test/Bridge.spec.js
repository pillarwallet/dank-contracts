/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const {
  deployments,
  ethers,
  ethers: {
    BigNumber,
    constants: { MaxUint256 },
    getSigner,
    getContractAt,
    utils,
    utils: { hexlify },
  },
  getNamedAccounts,
  getUnnamedAccounts,
  waffle: { provider },
} = require('hardhat');
const { expect } = require('chai');
const { createDaiTokenTypedDataFactory, deployContract, toWei, processTx, ZERO_ADDRESS } = require('./utils');

const setup = deployments.createFixture(async () => {
  await deployments.fixture();
  const daiToken = await deployContract('ERC20PermitMock', ['DAI', 'DAI']);
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  const daiTokenTypedDataFactory = createDaiTokenTypedDataFactory(daiToken);

  return {
    daiToken,
    daiTokenTypedDataFactory,
    Bridge: await ethers.getContract('Bridge'),
    accounts: [account, ...accounts],
  };
});

describe('Bridge', () => {
  it('deposit()', async function () {
    const {
      Bridge,
      accounts: [account],
    } = await setup();

    const ethAmount = toWei(5);
    const ethBalanceBefore = await provider.getBalance(account);
    const deposit = Bridge.deposit({ value: ethAmount });

    await expect(deposit) //
      .to.emit(Bridge, 'Deposit')
      .withArgs(account, ethAmount);

    const ethBalanceAfter = await provider.getBalance(account);
    const { totalCost } = await processTx(deposit);
    expect(
      ethBalanceBefore //
        .sub(totalCost)
        .sub(ethBalanceAfter),
    ).to.equal(ethAmount);
  });

  it('withdraw deposited amount', async function () {
    const {
      Bridge,
      accounts: [account],
    } = await setup();

    const ethAmount = toWei(5);
    const ethBalanceBefore = await provider.getBalance(account);
    const deposit = Bridge.deposit({ value: ethAmount });
    const { totalCost: depositCost } = await processTx(deposit);

    expect(await Bridge.balanceOf(account)).to.equal(ethAmount);

    const withdrawal = Bridge.withdraw(ethAmount);
    const { totalCost: withdrawalCost } = await processTx(withdrawal);
    const ethBalanceAfter = await provider.getBalance(account);

    expect(await Bridge.balanceOf(account)).to.equal(0);
    expect(
      ethBalanceBefore //
        .sub(depositCost)
        .sub(withdrawalCost),
    ).to.equal(ethBalanceAfter);
  });

  it('withdrawTo()', async function () {
    const {
      Bridge,
      accounts: [account, Alice],
    } = await setup();

    const ethAmount = toWei(5);
    const ethBalanceBefore = await provider.getBalance(Alice);
    Bridge.deposit({ value: ethAmount });

    const withdrawal = Bridge.withdrawTo(ethAmount, Alice);
    const ethBalanceAfter = await provider.getBalance(Alice);

    expect(await Bridge.balanceOf(account)).to.equal(0);

    expect(
      ethBalanceBefore //
        .add(ethAmount),
    ).to.equal(ethBalanceAfter);

    await expect(withdrawal) //
      .to.emit(Bridge, 'WithdrawalTo')
      .withArgs(account, ethAmount, Alice);
  });

  it('depositFor()', async function () {
    const {
      Bridge: BridgeSrc,
      accounts: [deployer, randAccount],
    } = await setup();

    const ethAmount = toWei(5);
    const signer = await getSigner(randAccount);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const depositFor = Bridge.depositFor(randAccount, { value: ethAmount });

    await expect(depositFor) //
      .to.emit(Bridge, 'DepositFor')
      .withArgs(randAccount, ethAmount, randAccount);

    expect(await Bridge.balanceOf(randAccount)).to.equal(0);
    expect(await Bridge.balanceOf(deployer)).to.equal(ethAmount);
  });

  it('depositWithPermit()', async function () {
    const {
      daiToken,
      Bridge,
      accounts: [account, Alice],
      daiTokenTypedDataFactory,
    } = await setup();

    const amount = toWei(5);

    // mint tokens
    await daiToken.deposit({ value: amount });

    expect(await daiToken.balanceOf(account)).to.equal(amount);
    expect(await daiToken.balanceOf(Bridge.address)).to.equal(0);

    const nonce = (await daiToken.nonces(account)).toNumber();
    const expiry = 0;

    const senderSignature = await daiTokenTypedDataFactory.signTypeData(account, {
      holder: account,
      spender: Bridge.address,
      nonce,
      expiry,
      allowed: true,
    });

    const sig = utils.splitSignature(senderSignature);
    const depositFor = Bridge.depositWithPermit(daiToken.address, amount, Alice, nonce, expiry, sig.v, sig.r, sig.s);

    await expect(depositFor) //
      .to.emit(Bridge, 'DepositTokenFor')
      .withArgs(account, amount, Alice, daiToken.address);

    expect(await daiToken.balanceOf(account)).to.equal(0);
    expect(await daiToken.balanceOf(Bridge.address)).to.equal(amount);
  });

  it('depositTokenFor()', async function () {
    const {
      daiToken: daiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [, Alice],
    } = await setup();

    const amount = toWei(5);
    const signer = await getSigner(Alice);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const daiToken = await getContractAt('ERC20PermitMock', daiTokenSrc.address, signer);

    await daiToken.deposit({ value: amount }); // will mint dai tokens

    // it should fail without pre-approval
    await expect(Bridge.depositTokenFor(daiToken.address, amount, Alice)) //
      .to.be.revertedWith('ERC20: transfer amount exceeds allowance');

    await daiToken.approve(Bridge.address, hexlify(MaxUint256));
    const depositTokenFor = Bridge.depositTokenFor(daiToken.address, amount, Alice);

    await expect(depositTokenFor) //
      .to.emit(Bridge, 'DepositTokenFor')
      .withArgs(Alice, amount, Alice, daiToken.address);

    expect(await daiToken.balanceOf(Alice)).to.equal(0);
    expect(await daiToken.balanceOf(Bridge.address)).to.equal(amount);
  });

  it('withdrawTokens()', async function () {
    const {
      daiToken: daiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [deployer, Alice, Bob],
    } = await setup();

    const ethAmount = toWei(5);
    const daiAmount = toWei(6);
    const signer = await getSigner(Alice);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const daiToken = await getContractAt('ERC20PermitMock', daiTokenSrc.address, signer);

    await Bridge.depositFor(Alice, { value: ethAmount });
    await daiToken.deposit({ value: daiAmount }); // will mint dai tokens
    await daiToken.approve(Bridge.address, hexlify(MaxUint256));
    await Bridge.depositTokenFor(daiToken.address, daiAmount, Alice);

    const balances = await Bridge.balanceOfBatch([ZERO_ADDRESS, daiToken.address]);
    expect(balances[0]).to.equal(ethAmount);
    expect(balances[1]).to.equal(daiAmount);

    const BobEthBalanceBefore = await provider.getBalance(Bob);

    // try to withdraw from the wrong account
    await expect(Bridge.withdrawTokens([ZERO_ADDRESS, daiToken.address], balances, Bob)) //
      .to.be.revertedWith('Ownable: caller is not the owner');

    const tokensToWithdraw = [ZERO_ADDRESS, daiToken.address];
    const withdrawTokens = BridgeSrc.withdrawTokens(tokensToWithdraw, balances, Bob);

    await expect(withdrawTokens) //
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(deployer, tokensToWithdraw[0], balances[0], Bob)
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(deployer, tokensToWithdraw[1], balances[1], Bob);

    expect(await provider.getBalance(Bob)).to.equal(BobEthBalanceBefore.add(balances[0]));
    expect(await daiToken.balanceOf(Bob)).to.equal(balances[1]);

    expect(await Bridge.balanceOfBatch(tokensToWithdraw)) //
      .to.deep.equal([BigNumber.from(0), BigNumber.from(0)]);
  });
});
