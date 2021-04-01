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
    utils: { hexlify, solidityKeccak256 },
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
    WrappedERC20: await ethers.getContract('WrappedERC20'),
    DaiToken,
    accounts: [account, ...accounts],
  };
});

describe('Bridge', () => {
  it('deposit()', async function () {
    const {
      Bridge,
      accounts: [bridgeOwner],
    } = await setup();

    const ethAmount = toWei(5);
    const ethBalanceBefore = await provider.getBalance(bridgeOwner);
    const deposit = Bridge.deposit({ value: ethAmount });

    await expect(deposit) //
      .to.emit(Bridge, 'Deposit')
      .withArgs(bridgeOwner, ethAmount);

    const ethBalanceAfter = await provider.getBalance(bridgeOwner);
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
      accounts: [bridgeOwner],
    } = await setup();

    const ethAmount = toWei(5);
    const ethBalanceBefore = await provider.getBalance(bridgeOwner);
    const deposit = Bridge.deposit({ value: ethAmount });
    const { totalCost: depositCost } = await processTx(deposit);

    expect(await Bridge.balanceOf(bridgeOwner)).to.equal(ethAmount);

    const withdrawal = Bridge.withdraw(ethAmount);
    const { totalCost: withdrawalCost } = await processTx(withdrawal);
    const ethBalanceAfter = await provider.getBalance(bridgeOwner);

    expect(await Bridge.balanceOf(bridgeOwner)).to.equal(0);
    expect(
      ethBalanceBefore //
        .sub(depositCost)
        .sub(withdrawalCost),
    ).to.equal(ethBalanceAfter);
  });

  it('withdrawTo()', async function () {
    const {
      Bridge,
      accounts: [bridgeOwner, Alice],
    } = await setup();

    const ethAmount = toWei(5);
    const ethBalanceBefore = await provider.getBalance(Alice);
    Bridge.deposit({ value: ethAmount });

    const withdrawal = Bridge.withdrawTo(Alice, ethAmount);
    const ethBalanceAfter = await provider.getBalance(Alice);

    expect(await Bridge.balanceOf(bridgeOwner)).to.equal(0);

    expect(
      ethBalanceBefore //
        .add(ethAmount),
    ).to.equal(ethBalanceAfter);

    await expect(withdrawal) //
      .to.emit(Bridge, 'WithdrawalTo')
      .withArgs(bridgeOwner, ethAmount, Alice);
  });

  it('depositFor()', async function () {
    const {
      Bridge: BridgeSrc,
      accounts: [bridgeOwner, Alice],
    } = await setup();

    const ethAmount = toWei(5);
    const signer = await getSigner(Alice);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const depositFor = Bridge.depositFor(Alice, { value: ethAmount });

    await expect(depositFor) //
      .to.emit(Bridge, 'DepositFor')
      .withArgs(Alice, ethAmount, Alice);

    expect(await Bridge.balanceOf(Alice)).to.equal(0);
    expect(await Bridge.balanceOf(bridgeOwner)).to.equal(ethAmount);
  });

  it('depositWithPermit()', async function () {
    const {
      DaiToken,
      Bridge,
      accounts: [bridgeOwner, Alice],
      daiTokenTypedDataFactory,
    } = await setup();

    const amount = toWei(5);

    // mint tokens
    await DaiToken.deposit({ value: amount });

    expect(await DaiToken.balanceOf(bridgeOwner)).to.equal(amount);
    expect(await DaiToken.balanceOf(Bridge.address)).to.equal(0);

    const nonce = (await DaiToken.nonces(bridgeOwner)).toNumber();
    const expiry = 0;

    const senderSignature = await daiTokenTypedDataFactory.signTypeData(bridgeOwner, {
      holder: bridgeOwner,
      spender: Bridge.address,
      nonce,
      expiry,
      allowed: true,
    });

    const sig = utils.splitSignature(senderSignature);
    const depositFor = Bridge.depositWithPermit(DaiToken.address, amount, Alice, nonce, expiry, sig.v, sig.r, sig.s);

    await expect(depositFor) //
      .to.emit(Bridge, 'DepositTokenFor')
      .withArgs(bridgeOwner, amount, Alice, DaiToken.address);

    expect(await DaiToken.balanceOf(bridgeOwner)).to.equal(0);
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

  it('withdrawToken()', async function () {
    const {
      DaiToken: DaiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [bridgeOwner, Alice, Bob],
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

    const balance = await Bridge.balanceOfToken(DaiToken.address);
    expect(balance).to.equal(daiAmount);

    const withdrawToken = BridgeSrc.withdrawToken(DaiToken.address, balance, Bob);

    await expect(withdrawToken) //
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(bridgeOwner, DaiToken.address, balance, Bob);

    expect(await DaiToken.balanceOf(Bob)).to.equal(balance);
    expect(await Bridge.balanceOfToken(DaiToken.address)).to.equal(0);
  });

  it('withdrawTokens()', async function () {
    const {
      DaiToken: DaiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [bridgeOwner, Alice, Bob],
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
    await expect(Bridge.withdrawTokens([ZERO_ADDRESS, DaiToken.address], balances, [Bob])) //
      .to.be.revertedWith('Ownable: caller is not the owner');

    const tokensToWithdraw = [ZERO_ADDRESS, DaiToken.address];
    const withdrawTokens = BridgeSrc.withdrawTokens(tokensToWithdraw, balances, [Bob]);

    await expect(withdrawTokens) //
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(bridgeOwner, tokensToWithdraw[0], balances[0], Bob)
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(bridgeOwner, tokensToWithdraw[1], balances[1], Bob);

    expect(await provider.getBalance(Bob)).to.equal(BobEthBalanceBefore.add(balances[0]));
    expect(await DaiToken.balanceOf(Bob)).to.equal(balances[1]);

    expect(await Bridge.balanceOfBatch(tokensToWithdraw)) //
      .to.deep.equal([BigNumber.from(0), BigNumber.from(0)]);
  });

  it('withdrawTokens to different accounts', async function () {
    const {
      DaiToken: DaiTokenSrc,
      Bridge: BridgeSrc,
      accounts: [bridgeOwner, Alice, Bob, John],
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

    const tokens = [ZERO_ADDRESS, DaiToken.address];
    const balances = await Bridge.balanceOfBatch(tokens);
    const BobEthBalanceBefore = await provider.getBalance(Bob);

    const withdrawTokens = BridgeSrc.withdrawTokens(tokens, balances, [Bob, John]);

    await expect(withdrawTokens) //
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(bridgeOwner, tokens[0], balances[0], Bob)
      .to.emit(BridgeSrc, 'TokenWithdrawal')
      .withArgs(bridgeOwner, tokens[1], balances[1], John);

    expect(await provider.getBalance(Bob)).to.equal(BobEthBalanceBefore.add(balances[0]));
    expect(await DaiToken.balanceOf(John)).to.equal(balances[1]);
  });

  it('withdrawDeposit()', async function () {
    const {
      Bridge,
      accounts: [bridgeOwner, Alice],
    } = await setup();

    const ethAmount = toWei(5);
    const fee = toWei(0.1);
    const ethBalanceBefore = await provider.getBalance(Alice);
    const tx = await processTx(Bridge.depositFor(Alice, { value: ethAmount }));

    const withdrawal = Bridge.withdrawDeposit(ZERO_ADDRESS, ethAmount, fee, tx.transactionHash, Alice);
    const ethBalanceAfter = await provider.getBalance(Alice);
    const shouldBeWithdrawn = ethAmount.sub(fee);
    const depositId = solidityKeccak256(
      ['address', 'uint256', 'bytes32'],
      [ZERO_ADDRESS, ethAmount, tx.transactionHash],
    );

    expect(await Bridge.balanceOf(bridgeOwner)).to.equal(fee);
    expect(
      ethBalanceBefore //
        .add(shouldBeWithdrawn),
    ).to.equal(ethBalanceAfter);

    await expect(withdrawal) //
      .to.emit(Bridge, 'DepositWithdrawn')
      .withArgs(ZERO_ADDRESS, ethAmount, fee, shouldBeWithdrawn, tx.transactionHash, Alice, depositId);

    // try to process the same deposit again
    await expect(
      Bridge.withdrawDeposit(ZERO_ADDRESS, ethAmount, fee, tx.transactionHash, Alice), //
    ).to.be.revertedWith('Bridge#withdrawDeposit: DEPOSIT_ALREADY_WITHDRAWN');

    expect(await Bridge.withdrawnDepositStatus(depositId)).to.equal(true);
  });

  it('withdrawDepositsBatch()', async function () {
    const {
      Bridge: BridgeSrc,
      DaiToken: DaiTokenSrc,
      WrappedERC20: RandErc20Src,
      accounts: [, Alice, Bob],
    } = await setup();

    const ethAmount = toWei(5);
    const daiAmount = toWei(15);
    const randErc20Amount = toWei(20);
    const ethFee = toWei(0.1);
    const daiFee = toWei(0.2);
    const randErc20Fee = toWei(0.3);

    const signer = await getSigner(Alice);
    const Bridge = await getContractAt('Bridge', BridgeSrc.address, signer);
    const DaiToken = await getContractAt('PermittableERC20', DaiTokenSrc.address, signer);
    const RandErc20 = await getContractAt('WrappedERC20', RandErc20Src.address, signer);

    // mint tokens
    await DaiToken.deposit({ value: daiAmount });
    await RandErc20.deposit({ value: randErc20Amount });

    // deposit eth to bridge
    const { transactionHash: ethDepositTxHash } = await processTx(Bridge.depositFor(Alice, { value: ethAmount }));

    // deposit dai token to bridge
    await DaiToken.approve(Bridge.address, hexlify(MaxUint256));
    const { transactionHash: daiDepositTxHash } = await processTx(
      Bridge.depositTokenFor(DaiToken.address, daiAmount, Alice),
    );

    // deposit rand erc20 token to bridge
    const { transactionHash: randErc20DepositTxHash } = await processTx(
      RandErc20.transfer(Bridge.address, randErc20Amount),
    );

    const balances = await Bridge.balanceOfBatch([ZERO_ADDRESS, DaiToken.address, RandErc20.address]);
    expect(balances[0]).to.equal(ethAmount);
    expect(balances[1]).to.equal(daiAmount);
    expect(balances[2]).to.equal(randErc20Amount);

    // withdraw all deposits to Bob
    const ethBalanceBefore = await provider.getBalance(Bob);
    await BridgeSrc.withdrawDepositsBatch(
      [ZERO_ADDRESS, DaiToken.address, RandErc20.address],
      [ethAmount, daiAmount, randErc20Amount],
      [ethFee, daiFee, randErc20Fee],
      [ethDepositTxHash, daiDepositTxHash, randErc20DepositTxHash],
      [Bob, Bob, Bob],
    );

    const ethBalanceAfter = await provider.getBalance(Bob);

    expect(
      ethBalanceBefore //
        .add(ethAmount)
        .sub(ethFee),
    ).to.equal(ethBalanceAfter);
    expect(await DaiToken.balanceOf(Bob)).to.equal(daiAmount.sub(daiFee));
    expect(await RandErc20.balanceOf(Bob)).to.equal(randErc20Amount.sub(randErc20Fee));

    const balancesAfter = await Bridge.balanceOfBatch([ZERO_ADDRESS, DaiToken.address, RandErc20.address]);
    expect(balancesAfter[0]).to.equal(ethFee);
    expect(balancesAfter[1]).to.equal(daiFee);
    expect(balancesAfter[2]).to.equal(randErc20Fee);
  });

  it('withdraw deposit when receiver is regular acc', async function () {
    const {
      Bridge,
      WrappedERC20: WrappedERC20Src,
      accounts: [bridgeOwner, Alice, Bob],
    } = await setup();

    // then send another amount to owner
    const mintAmount = toWei(20);
    const depositAmount = toWei(10);
    const fee = toWei(1);

    const signer = await getSigner(Alice);
    const WrappedERC20 = await getContractAt('WrappedERC20', WrappedERC20Src.address, signer);

    // mint tokens
    await WrappedERC20.deposit({ value: mintAmount });

    // send tokens to bridge owner
    const { transactionHash: depositTxHash } = await processTx(WrappedERC20.transfer(bridgeOwner, depositAmount));

    // we keep tokens on a separate account
    // before the withdrawal we need to transfer those tokens to the bridge
    await WrappedERC20Src.transfer(Bridge.address, depositAmount);

    await Bridge.withdrawDeposit(WrappedERC20.address, depositAmount, fee, depositTxHash, Bob);

    expect(await Bridge.balanceOfToken(WrappedERC20.address)).to.equal(fee);
    expect(await WrappedERC20.balanceOf(Alice)).to.equal(mintAmount.sub(depositAmount));
    expect(await WrappedERC20.balanceOf(Bob)).to.equal(depositAmount.sub(fee));
  });
});
