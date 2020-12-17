// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "../common/math/SafeMath.sol";

contract Bridge {
    using SafeMath for uint256;

    event Deposit(address indexed recipient, uint value);
    event DepositFor(address indexed sender, uint value, address indexed recipient);
    event Withdrawal(address indexed src, uint value);

    mapping (address => uint256) internal _balances;
    address owner;

    constructor () public {
        owner = msg.sender;
    }

    receive() external payable {
        deposit();
    }

    function deposit() virtual public payable {
        _balances[msg.sender] = _balances[msg.sender].add(msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function depositFor(address recipient) virtual public payable {
        _balances[owner] = _balances[owner].add(msg.value);
        emit DepositFor(msg.sender, msg.value, recipient);
    }

    function withdraw(uint value) virtual external {
        _balances[msg.sender] = _balances[msg.sender].sub(value, "Bridge: withdrawal amount exceeds balance");

        require(
            // solhint-disable-next-line check-send-result
            payable(msg.sender).send(value)
        );

        emit Withdrawal(msg.sender, value);
    }
}
