// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "./interfaces/IUniswapV2Factory.sol";
import "./UniswapV2Pair.sol";

contract UniswapV2Factory is IUniswapV2Factory {
    address public override feeTo;
    address public override feeToSetter;
    address public immutable override baseToken;
    address public immutable override dispenser;

    mapping(bytes32 => address) public override getPair; // all pairs are token/baseToken (baseToken is not used in mapping)
    address[] public override allPairs;

    event PairCreated(address sender, bytes32 tokenHash, address baseToken, address pair, uint allPairsLength);

    constructor(address _feeToSetter, address _baseToken, address _dispenser) public {
        feeToSetter = _feeToSetter;
        baseToken = _baseToken;
        dispenser = _dispenser;
    }

    function allPairsLength() external virtual override view returns (uint) {
        return allPairs.length;
    }

    function createPair(bytes32 tokenHash) external virtual override returns (address pair) {
        require(getPair[tokenHash] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(tokenHash));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(tokenHash, dispenser, baseToken);
        getPair[tokenHash] = pair;
        allPairs.push(pair);
        emit PairCreated(msg.sender, tokenHash, baseToken, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external virtual override {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external virtual override {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
