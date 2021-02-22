// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "../erc20/IERC20.sol";

contract DaiBridgeMock {
    address private _daiToken;

    event UserRequestForAffirmation(address recipient, uint256 value);

    constructor(address daiToken_) public {
        _daiToken = daiToken_;
    }

    function daiToken() public view returns (address) {
        return _daiToken;
    }

    function _relayTokens(address _sender, address _receiver, uint256 _amount) internal {
        require(_receiver != address(0));
        require(_receiver != address(this));
        require(_amount > 0);

        IERC20(_daiToken).transferFrom(_sender, address(this), _amount);
        emit UserRequestForAffirmation(_receiver, _amount);
    }

    function relayTokens(address _from, address _receiver, uint256 _amount) external {
        require(_from == msg.sender || _from == _receiver);
        _relayTokens(_from, _receiver, _amount);
    }

    function relayTokens(address _receiver, uint256 _amount) external {
        _relayTokens(msg.sender, _receiver, _amount);
    }
}
