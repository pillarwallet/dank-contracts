// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IWrappedERC20 {
    function deposit() external payable;
    function withdraw(uint value) external;
    function transfer(address to, uint value) external returns (bool);
}
