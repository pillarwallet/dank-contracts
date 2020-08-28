pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;
    address public stonkToken;
    address public dispenser;

    mapping(bytes32 => address) public getPair; // all pairs are token/stonk (stonk is not used in mapping)
    address[] public allPairs;

    event PairCreated(bytes32 indexed tokenHash, address indexed stonkToken, address pair, uint);

    constructor(address _feeToSetter, address _stonkToken, address _dispenser) public {
        feeToSetter = _feeToSetter;
        stonkToken = _stonkToken
        dispenser = _dispenser
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(bytes32 tokenHash) external returns (address pair) {
        require(getPair[tokenHash] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(tokenHash));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(tokenHash, stonkToken, dispenser);
        getPair[tokenHash] = pair;
        allPairs.push(pair);
        emit PairCreated(tokenHash, stonkToken, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
