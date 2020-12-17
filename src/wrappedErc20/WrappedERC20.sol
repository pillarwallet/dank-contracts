// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "../erc20/ERC20.sol";
import "./IWrappedERC20.sol";

contract WrappedERC20 is ERC20, IWrappedERC20 {
    event Deposit(address indexed recipient, uint value);
    event Withdrawal(address indexed src, uint value);

    constructor (string memory name, string memory symbol) ERC20(name, symbol) public { }

    receive() external payable {
        deposit();
    }

    function deposit() virtual override public payable {
        _balances[_msgSender()] = _balances[_msgSender()].add(msg.value);
        emit Deposit(_msgSender(), msg.value);
    }

    function withdraw(uint value) virtual override external {
        _balances[_msgSender()] = _balances[_msgSender()].sub(value, "ERC20: withdrawal amount exceeds balance");

        require(
            // solhint-disable-next-line check-send-result
            payable(_msgSender()).send(value)
        );

        emit Withdrawal(_msgSender(), value);
    }

    function transfer(address recipient, uint256 amount) public virtual override(ERC20, IWrappedERC20) returns (bool) {
        return ERC20.transfer(recipient, amount);
    }
}
