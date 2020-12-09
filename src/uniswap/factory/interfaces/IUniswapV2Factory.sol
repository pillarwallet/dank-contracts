// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

interface IUniswapV2Factory {
    event PairCreated(address indexed sender, bytes32 tokenHash, address indexed baseToken, address pair, uint allPairsLength);

    function dispenser() external view returns (address);
    function baseToken() external view returns (address);
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);

    function getPair(bytes32 tokenHash) external view returns (address pair);
    function allPairs(uint i) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function createPair(bytes32 tokenHash) external returns (address pair);

    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
}
