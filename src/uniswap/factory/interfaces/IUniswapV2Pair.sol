// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

interface IUniswapV2Pair {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    event Mint(address indexed sender, uint tokenAmount, uint baseTokenAmount);
    event Burn(address indexed sender, uint tokenAmount, uint baseTokenAmount, address indexed to);
    event Swap(
        address indexed sender,
        uint tokenAmountIn,
        uint baseTokenAmountIn,
        uint tokenAmountOut,
        uint baseTokenAmountOut,
        address indexed to
    );
    event Sync(uint112 tokenReserve, uint112 baseTokenReserve);

    function MINIMUM_LIQUIDITY() external view returns (uint);
    function factory() external view returns (address);
    function dispenser() external view returns (address);
    function baseToken() external view returns (address);
    function tokenHash() external view returns (bytes32);
    function getReserves() external view returns (uint112 tokenReserve, uint112 baseTokenReserve, uint32 blockTimestampLast);
    function tokenCumulativeLast() external view returns (uint);
    function baseTokenCumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint tokenAmount, uint baseTokenAmount);
    function swap(uint tokenAmountOut, uint baseTokenAmountOut, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;

    function initialize(bytes32, address, address) external;
}
