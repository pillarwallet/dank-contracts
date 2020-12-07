// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

interface IUniswapV2Router {
    function factory() external view returns (address);

    function addLiquidity(
        bytes32 tokenHash,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function removeLiquidity(
        bytes32 tokenHash,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    function removeLiquidityWithPermit(
        bytes32 tokenHash,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);

    function swapExactBaseTokensForTokens(
        uint baseTokenAmountIn,
        uint tokenAmountOutMin,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint tokenAmountOut);

    function swapBaseTokensForExactTokens(
        uint tokenAmountOut,
        uint baseTokenAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint baseTokenAmountIn);

    function swapExactTokensForBaseTokens(
        uint tokenAmountIn,
        uint baseTokenAmountOutMin,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint baseTokenAmountOut);

    function swapTokensForExactBaseTokens(
        uint baseTokenAmountOut,
        uint tokenAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint tokenAmountIn);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getTokenAmountOut(uint baseTokenAmountIn, bytes32 tokenHash) external view returns (uint amountOut);
    function getBaseTokenAmountOut(uint tokenAmountIn, bytes32 tokenHash) external view returns (uint amountOut);
    function getTokenAmountIn(uint baseTokenAmountIn, bytes32 tokenHash) external view returns (uint amountOut);
    function getBaseTokenAmountIn(uint tokenAmountIn, bytes32 tokenHash) external view returns (uint amountOut);
}
