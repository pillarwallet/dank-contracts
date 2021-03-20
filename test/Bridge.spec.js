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
const { createDaiTokenTypedDataFactory, toWei, processTx, ZERO_ADDRESS } = require('./utils');

const setup = deployments.createFixture(async () => {
  await deployments.fixture();
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  const DaiToken = await ethers.getContract('PermittableERC20');
  const daiTokenTypedDataFactory = createDaiTokenTypedDataFactory(DaiToken);

  return {
    daiTokenTypedDataFactory,
    Bridge: await ethers.getContract('Bridge'),
    DaiToken,
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
      DaiToken,
      Bridge,
      accounts: [account, Alice],
      daiTokenTypedDataFactory,
    } = await setup();

    const amount = toWei(5);

    // mint tokens
    await DaiToken.deposit({ value: amount });

    expect(await DaiToken.balanceOf(account)).to.equal(amount);
    expect(await DaiToken.balanceOf(Bridge.address)).to.equal(0);

    const nonce = (await DaiToken.nonces(account)).toNumber();
    const expiry = 0;

    const senderSignature = await daiTokenTypedDataFactory.signTypeData(account, {
      holder: account,
      spender: Bridge.address,
      nonce,
      expiry,
      allowed: true,
    });

    const sig = utils.splitSignature(senderSignature);
    const depositFor = Bridge.depositWithPermit(DaiToken.address, amount, Alice, nonce, expiry, sig.v, sig.r, sig.s);

    await expect(depositFor) //
      .to.emit(Bridge, 'DepositTokenFor')
      .withArgs(account, amount, Alice, DaiToken.address);

    expect(await DaiToken.balanceOf(account)).to.equal(0);
    expect(await DaiToken.balanceOf(Bridge.address)).to.equal(amount);
  });

  it('depositTokenFor()', async function () {
    const {
      DaiToken: DaiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [, Alice],
    } = await setup();

    const amount = toWei(5);
    const signer = await getSigner(Alice);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const DaiToken = await getContractAt('PermittableERC20', DaiTokenSrc.address, signer);

    await DaiToken.deposit({ value: amount }); // will mint dai tokens

    // it should fail without pre-approval
    await expect(Bridge.depositTokenFor(DaiToken.address, amount, Alice)) //
      .to.be.revertedWith('ERC20: transfer amount exceeds allowance');

    await DaiToken.approve(Bridge.address, hexlify(MaxUint256));
    const depositTokenFor = Bridge.depositTokenFor(DaiToken.address, amount, Alice);

    await expect(depositTokenFor) //
      .to.emit(Bridge, 'DepositTokenFor')
      .withArgs(Alice, amount, Alice, DaiToken.address);

    expect(await DaiToken.balanceOf(Alice)).to.equal(0);
    expect(await DaiToken.balanceOf(Bridge.address)).to.equal(amount);
  });

  it('withdrawTokens()', async function () {
    const {
      DaiToken: DaiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [deployer, Alice, Bob],
    } = await setup();

    const ethAmount = toWei(5);
    const daiAmount = toWei(6);
    const signer = await getSigner(Alice);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const DaiToken = await getContractAt('PermittableERC20', DaiTokenSrc.address, signer);

    await Bridge.depositFor(Alice, { value: ethAmount });
    await DaiToken.deposit({ value: daiAmount }); // will mint dai tokens
    await DaiToken.approve(Bridge.address, hexlify(MaxUint256));
    await Bridge.depositTokenFor(DaiToken.address, daiAmount, Alice);

    const balances = await Bridge.balanceOfBatch([ZERO_ADDRESS, DaiToken.address]);
    expect(balances[0]).to.equal(ethAmount);
    expect(balances[1]).to.equal(daiAmount);

    const BobEthBalanceBefore = await provider.getBalance(Bob);

    // try to withdraw from the wrong account
    await expect(Bridge.withdrawTokens([ZERO_ADDRESS, DaiToken.address], balances, Bob)) //
      .to.be.revertedWith('Ownable: caller is not the owner');

    const tokensToWithdraw = [ZERO_ADDRESS, DaiToken.address];
    const withdrawTokens = BridgeSrc.withdrawTokens(tokensToWithdraw, balances, Bob);

    await expect(withdrawTokens) //
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(deployer, tokensToWithdraw[0], balances[0], Bob)
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(deployer, tokensToWithdraw[1], balances[1], Bob);

    expect(await provider.getBalance(Bob)).to.equal(BobEthBalanceBefore.add(balances[0]));
    expect(await DaiToken.balanceOf(Bob)).to.equal(balances[1]);

    expect(await Bridge.balanceOfBatch(tokensToWithdraw)) //
      .to.deep.equal([BigNumber.from(0), BigNumber.from(0)]);
  });
});
