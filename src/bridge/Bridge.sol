// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "../common/math/SafeMath.sol";
import "../common/access/Ownable.sol";
import "../permittableErc20/IPermittableToken.sol";

contract Bridge is Ownable {
    using SafeMath for uint256;

    event Deposit(address indexed recipient, uint value);
    event DepositFor(address indexed sender, uint value, address indexed recipient);
    event Withdrawal(address indexed src, uint value);
    event WithdrawalTo(address indexed sender, uint value, address indexed recipient);
    event DepositTokenFor(address indexed sender, uint amount, address indexed recipient, address indexed tokenAddress);
    event TokenWithdrawal(address indexed sender, address indexed token, uint value, address indexed recipient);

    mapping (address => uint256) internal _balances;

    constructor() public Ownable() {}

    receive() external payable {
        deposit();
    }

    function deposit() virtual public payable {
        _balances[msg.sender] = _balances[msg.sender].add(msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function depositFor(address recipient) virtual public payable {
        _balances[owner()] = _balances[owner()].add(msg.value);
        emit DepositFor(msg.sender, msg.value, recipient);
    }

    function withdraw(uint value) virtual external {
        _withdraw(value, msg.sender);
        emit Withdrawal(msg.sender, value);
    }

    function withdrawTo(uint value, address recipient) virtual external {
        _withdraw(value, recipient);
        emit WithdrawalTo(msg.sender, value, recipient);
    }

    function _withdraw(uint value, address recipient) internal {
        _balances[msg.sender] = _balances[msg.sender].sub(value, "Bridge: withdrawal amount exceeds balance");

        require(
            // solhint-disable-next-line check-send-result
            payable(recipient).send(value)
        );
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function balanceOfBatch(address[] calldata tokens) public view returns (uint[] memory)
    {
        uint[] memory result = new uint[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != address(0x0)) {
                result[i] = _getBalance(address(this), tokens[i]);
            } else {
                result[i] = _balances[owner()];
            }
        }

        return result;
    }

    function depositWithPermit(
        address tokenAddress,
        uint amount,
        address recipient,
        uint256 permitNonce,
        uint256 permitExpiry,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) virtual external {
        IPermittableToken token = IPermittableToken(tokenAddress);

        if (token.allowance(msg.sender, address(this)) < amount) {
            token.permit(
                msg.sender,
                address(this),
                permitNonce,
                permitExpiry,
                true,
                permitV,
                permitR,
                permitS
            );
        }
        depositTokenFor(tokenAddress, amount, recipient);
    }

    function depositTokenFor(
        address tokenAddress,
        uint amount,
        address recipient
    ) virtual public {
        IPermittableToken token = IPermittableToken(tokenAddress);
        token.transferFrom(msg.sender, address(this), amount);

        emit DepositTokenFor(msg.sender, amount, recipient, tokenAddress);
    }

    function withdrawTokens(
        address[] calldata tokens,
        uint[] calldata values,
        address recipient
    ) virtual onlyOwner external {
        require(tokens.length == values.length, "Bridge#withdrawTokens: INVALID_ARRAY_LENGTH");

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != address(0x0)) {
                IPermittableToken(tokens[i]).transfer(recipient, values[i]);
            } else {
                _withdraw(values[i], recipient);
            }
            emit TokenWithdrawal(msg.sender, tokens[i], values[i], recipient);
        }
    }

    // private functions

    function _getBalance(
        address account,
        address token
    )
        private
        view
        returns (uint256)
    {
        uint256 result = 0;
        uint256 tokenCode;

        /// @dev check if token is actually a contract
        // solhint-disable-next-line no-inline-assembly
        assembly { tokenCode := extcodesize(token) } // contract code size

        if (tokenCode > 0) {
            /// @dev is it a contract and does it implement balanceOf
            // solhint-disable-next-line avoid-low-level-calls
            (bool methodExists,) = token.staticcall(abi.encodeWithSelector(
                IPermittableToken(token).balanceOf.selector,
                account
            ));

            if (methodExists) {
                result = IPermittableToken(token).balanceOf(account);
            }
        }

        return result;
    }
}
