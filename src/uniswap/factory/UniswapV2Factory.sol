// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "./interfaces/IUniswapV2Factory.sol";
import "./UniswapV2Pair.sol";

contract UniswapV2Factory is IUniswapV2Factory {
    address private _feeTo;
    address private _feeToSetter;
    address private _stonkToken;
    address private _dispenser;

    mapping(bytes32 => address) private _getPair; // all pairs are token/stonk (stonk is not used in mapping)
    address[] private _allPairs;

    event PairCreated(bytes32 indexed tokenHash, address indexed stonkToken, address pair, uint);

    constructor(address feeToSetter, address stonkToken, address dispenser) public {
        _feeToSetter = feeToSetter;
        _stonkToken = stonkToken;
        _dispenser = dispenser;
    }

    function getPair(bytes32 tokenHash) public view override returns (address) {
        return _getPair[tokenHash];
    }

    function allPairs(uint i) public view override returns (address) {
        return _allPairs[i];
    }

    function allPairsLength() external virtual override view returns (uint) {
        return _allPairs.length;
    }

    function createPair(bytes32 tokenHash) external virtual override returns (address pair) {
        require(_getPair[tokenHash] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(tokenHash));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(tokenHash, _dispenser, _stonkToken);
        _getPair[tokenHash] = pair;
        _allPairs.push(pair);
        emit PairCreated(tokenHash, _stonkToken, pair, _allPairs.length);
    }

    function setFeeTo(address feeTo) external virtual override {
        require(msg.sender == _feeToSetter, 'UniswapV2: FORBIDDEN');
        _feeTo = feeTo;
    }

    function setFeeToSetter(address feeToSetter) external virtual override {
        require(msg.sender == _feeToSetter, 'UniswapV2: FORBIDDEN');
        _feeToSetter = feeToSetter;
    }

    function dispenser() public view override returns (address) {
        return _dispenser;
    }

    function stonkToken() public view override returns (address) {
        return _stonkToken;
    }

    function feeTo() public view override returns (address) {
        return _feeTo;
    }

    function feeToSetter() public view override returns (address) {
        return _feeToSetter;
    }
}
