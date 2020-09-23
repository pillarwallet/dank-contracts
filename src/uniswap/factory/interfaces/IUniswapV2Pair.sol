// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

interface IUniswapV2Pair {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    event Mint(address indexed sender, uint tokenAmount, uint stonkAmount);
    event Burn(address indexed sender, uint tokenAmount, uint stonkAmount, address indexed to);
    event Swap(
        address indexed sender,
        uint tokenAmountIn,
        uint stonkAmountIn,
        uint tokenAmountOut,
        uint stonkAmountOut,
        address indexed to
    );
    event Sync(uint112 tokenReserve, uint112 stonkReserve);

    function MINIMUM_LIQUIDITY() external view returns (uint);
    function factory() external view returns (address);
    function dispenser() external view returns (address);
    function stonkToken() external view returns (address);
    function tokenHash() external view returns (bytes32);
    function getReserves() external view returns (uint112 tokenReserve, uint112 stonkReserve, uint32 blockTimestampLast);
    function tokenCumulativeLast() external view returns (uint);
    function stonkCumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint tokenAmount, uint stonkAmount);
    function swap(uint tokenAmountOut, uint stonkAmountOut, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;

    function initialize(bytes32, address, address) external;
}
