// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "../interfaces/IUniswapV2Pair.sol";

import "../../../common/math/SafeMath.sol";

library UniswapV2Library {
    using SafeMath for uint;

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, bytes32 tokenHash) internal pure returns (address pair) {
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(tokenHash)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
            ))));
    }

    // fetches and sorts the reserves for a pair
    function getReserves(address pair) internal view returns (uint reserveA, uint reserveB) {
        (reserveA, reserveB,) = IUniswapV2Pair(pair).getReserves();
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, 'UniswapV2Library: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint numerator = reserveIn.mul(amountOut).mul(1000);
        uint denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getBaseTokenAmountOut(address pair, uint otherTokenAmountIn) internal view returns (uint amountOut) {
        (uint reserveA, uint reserveB) = getReserves(pair);
        amountOut = getAmountOut(otherTokenAmountIn, reserveA, reserveB);
    }

    function getTokenAmountOut(address pair, uint baseTokenAmountIn) internal view returns (uint tokenAmountOut) {
        (uint reserveA, uint reserveB) = getReserves(pair);
        tokenAmountOut = getAmountOut(baseTokenAmountIn, reserveB, reserveA);
    }

    function getBaseTokenAmountIn(address pair, uint otherTokenAmountOut) internal view returns (uint baseTokenAmountIn) {
        (uint reserveA, uint reserveB) = getReserves(pair);
        baseTokenAmountIn = getAmountIn(otherTokenAmountOut, reserveB, reserveA);
    }

    function getTokenAmountIn(address pair, uint baseTokenAmountOut) internal view returns (uint tokenAmountIn) {
        (uint reserveA, uint reserveB) = getReserves(pair);
        tokenAmountIn = getAmountIn(baseTokenAmountOut, reserveA, reserveB);
    }
}
