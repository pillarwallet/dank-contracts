/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const {
  deployments,
  ethers,
  ethers: {
    BigNumber,
    constants: { MaxUint256 },
    utils: { hexlify },
  },
  getNamedAccounts,
  getUnnamedAccounts,
  waffle: { provider },
} = require('hardhat');
const { expect } = require('chai');
const { getMemeTokenHash, processTx, setDeadline, toWei } = require('./utils');

const memeId = 1;

const setup = deployments.createFixture(async () => {
  await deployments.fixture();
  const { account } = await getNamedAccounts();
  const accounts = await getUnnamedAccounts();

  // create meme
  const ERC721 = await ethers.getContract('ERC721');
  const ERC1155 = await ethers.getContract('ERC1155');
  const UniswapV2Factory = await ethers.getContract('UniswapV2Factory');
  const UniswapV2Router = await ethers.getContract('UniswapV2Router');

  const tokenHash = getMemeTokenHash(ERC721.address, memeId);
  await ERC721.publicMint(account, memeId);
  await ERC721['safeTransferFrom(address,address,uint256)'](account, ERC1155.address, memeId);
  await UniswapV2Factory.createPair(tokenHash);

  const pair = await UniswapV2Factory.getPair(tokenHash);
  const UniswapV2Pair = await ethers.getContractAt('UniswapV2Pair', pair);

  // set allowance
  await ERC1155.setApprovalForAll(UniswapV2Router.address, true);

  return {
    tokenHash,
    pair,
    ERC721,
    ERC1155,
    UniswapV2Factory,
    UniswapV2Pair,
    UniswapV2Router,
    WrappedERC20: await ethers.getContract('WrappedERC20'),
    accounts: [account, ...accounts],
  };
});

describe('Meme actions', () => {
  it('Add Liquidity', async function () {
    const {
      accounts: [account],
      pair,
      tokenHash,
      UniswapV2Pair,
      UniswapV2Router,
      WrappedERC20,
    } = await setup();

    const deadline = setDeadline(15); // 15min
    const memeTokens = toWei(1);
    const ethAmount = toWei(5);
    const liquidityTokens = '2236067977499788696';

    const addLiquidityETH = UniswapV2Router.addLiquidityETH(
      tokenHash, //
      memeTokens,
      0,
      0,
      account,
      deadline,
      {
        value: ethAmount,
      },
    );

    await expect(addLiquidityETH) //
      .to.emit(UniswapV2Router, 'LiquidityAdded')
      .withArgs(account, tokenHash, liquidityTokens, memeTokens, ethAmount);

    // validate reserves
    const [tokenReserve, ethReserve] = await UniswapV2Pair.getReserves();
    expect(tokenReserve).to.equal(memeTokens);
    expect(ethReserve).to.equal(ethAmount);

    expect(await WrappedERC20.balanceOf(pair)).to.equal(ethAmount);
    expect(await UniswapV2Pair.balanceOf(account)).to.equal(liquidityTokens);
  });

  it('Remove Liquidity', async function () {
    const {
      accounts: [account],
      tokenHash,
      UniswapV2Pair,
      UniswapV2Router,
      ERC1155,
    } = await setup();

    // add liquidity
    const deadline = setDeadline(15); // 15min
    const memeTokens = toWei(1);
    const ethAmount = toWei(5);

    UniswapV2Router.addLiquidityETH(tokenHash, memeTokens, 0, 0, account, deadline, {
      value: ethAmount,
    });

    // set allowance
    await UniswapV2Pair.approve(UniswapV2Router.address, hexlify(MaxUint256));

    // remove liquidity
    const liquidityBalanceBefore = await UniswapV2Pair.balanceOf(account);
    const ethBalanceBefore = await provider.getBalance(account);
    const withdrawLiquidity = '10000';
    const expectTokenAmount = '4472';
    const expectEthAmount = '22360';

    const removeLiquidityETH = UniswapV2Router.removeLiquidityETH(
      tokenHash,
      withdrawLiquidity,
      0,
      0,
      account,
      deadline,
    );

    await expect(removeLiquidityETH) //
      .to.emit(UniswapV2Router, 'LiquidityRemoved')
      .withArgs(account, tokenHash, withdrawLiquidity, expectEthAmount, expectTokenAmount);

    // validate pair balance
    expect(await UniswapV2Pair.balanceOf(account)).to.equal(
      liquidityBalanceBefore.sub(BigNumber.from(withdrawLiquidity)),
    );

    // validate reserves
    const [tokenReserve, ethReserve] = await UniswapV2Pair.getReserves();
    expect(memeTokens.sub(tokenReserve)).to.equal(expectTokenAmount);
    expect(ethAmount.sub(ethReserve)).to.equal(expectEthAmount);

    // validate account balances
    expect(await ERC1155.balanceOf(account, tokenHash)).to.equal(expectTokenAmount);

    const { totalCost } = await processTx(removeLiquidityETH);
    const ethBalanceAfter = await provider.getBalance(account);

    expect(
      ethBalanceBefore //
        .sub(totalCost)
        .add(BigNumber.from(expectEthAmount)),
    ).to.equal(ethBalanceAfter);
  });

  it('Buy Meme', async function () {
    const {
      accounts: [account],
      tokenHash,
      UniswapV2Pair,
      UniswapV2Router,
      ERC1155,
    } = await setup();

    // add liquidity
    const deadline = setDeadline(15); // 15min
    const memeTokens = toWei(1);
    const ethAmount = toWei(5);

    UniswapV2Router.addLiquidityETH(tokenHash, memeTokens, 0, 0, account, deadline, {
      value: ethAmount,
    });

    // set allowance
    await ERC1155.setApprovalForAll(UniswapV2Router.address, true);

    const [tokenReserveBefore, ethReserveBefore] = await UniswapV2Pair.getReserves();
    const ethBalanceBefore = await provider.getBalance(account);
    const buyTokens = toWei(0.1);
    const payEth = await UniswapV2Router.getBaseTokenAmountIn(buyTokens, tokenHash);

    const swapETHForExactTokens = UniswapV2Router.swapETHForExactTokens(
      buyTokens, //
      tokenHash,
      account,
      deadline,
      {
        value: payEth,
      },
    );

    await expect(swapETHForExactTokens) //
      .to.emit(UniswapV2Router, 'SwapETHForExactTokens')
      .withArgs(account, tokenHash, payEth, buyTokens);

    // validate reserves
    const [tokenReserveAfter, ethReserveAfter] = await UniswapV2Pair.getReserves();
    expect(tokenReserveBefore.sub(buyTokens)).to.equal(tokenReserveAfter);
    expect(ethReserveBefore.add(payEth)).to.equal(ethReserveAfter);

    // validate eth balance on account
    const ethBalanceAfter = await provider.getBalance(account);
    const { totalCost } = await processTx(swapETHForExactTokens);
    expect(ethBalanceBefore.sub(totalCost).sub(payEth)).to.equal(ethBalanceAfter);

    // validate token balance
    expect(await ERC1155.balanceOf(account, tokenHash)).to.equal(buyTokens);
  });

  it('Sell Meme', async function () {
    const {
      accounts: [account],
      tokenHash,
      UniswapV2Pair,
      UniswapV2Router,
      ERC1155,
    } = await setup();

    // add liquidity
    const deadline = setDeadline(15); // 15min
    const memeTokens = toWei(1);
    const ethAmount = toWei(5);

    UniswapV2Router.addLiquidityETH(tokenHash, memeTokens, 0, 0, account, deadline, {
      value: ethAmount,
    });

    // buy tokens
    const buyTokens = toWei(0.2);
    const payEth = await UniswapV2Router.getBaseTokenAmountIn(buyTokens, tokenHash);
    await ERC1155.setApprovalForAll(UniswapV2Router.address, true);
    await UniswapV2Router.swapETHForExactTokens(buyTokens, tokenHash, account, deadline, {
      value: payEth,
    });

    // sell tokens
    const sellTokens = toWei(0.15);
    const receiveEth = await UniswapV2Router.getBaseTokenAmountOut(sellTokens, tokenHash);
    await ERC1155.setApprovalForAll(UniswapV2Router.address, true);

    const [tokenReserveBefore, ethReserveBefore] = await UniswapV2Pair.getReserves();
    const ethBalanceBefore = await provider.getBalance(account);
    const tokenBalanceBefore = await ERC1155.balanceOf(account, tokenHash);

    const swapExactTokensForETH = UniswapV2Router.swapExactTokensForETH(
      sellTokens, //
      0,
      tokenHash,
      account,
      deadline,
    );

    await expect(swapExactTokensForETH) //
      .to.emit(UniswapV2Router, 'SwapExactTokensForETH')
      .withArgs(account, tokenHash, receiveEth, sellTokens);

    // validate reserves
    const [tokenReserveAfter, ethReserveAfter] = await UniswapV2Pair.getReserves();
    expect(tokenReserveBefore.add(sellTokens)).to.equal(tokenReserveAfter);
    expect(ethReserveBefore.sub(receiveEth)).to.equal(ethReserveAfter);

    // validate eth balance on account
    const ethBalanceAfter = await provider.getBalance(account);
    const { totalCost } = await processTx(swapExactTokensForETH);
    expect(ethBalanceBefore.sub(totalCost).add(receiveEth)).to.equal(ethBalanceAfter);

    // validate token balance
    expect(await ERC1155.balanceOf(account, tokenHash)).to.equal(tokenBalanceBefore.sub(sellTokens));
  });
});
