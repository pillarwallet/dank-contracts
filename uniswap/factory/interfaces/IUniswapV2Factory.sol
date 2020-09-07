pragma solidity >=0.5.0;

interface IUniswapV2Factory {
    event PairCreated(bytes32 indexed tokenHash, address indexed stonkToken, address pair, uint);

    function dispenser() external view returns (address);
    function stonkToken() external view returns (address);
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);

    function getPair(bytes32 tokenHash) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function createPair(bytes32 tokenHash) external returns (address pair);

    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
}
