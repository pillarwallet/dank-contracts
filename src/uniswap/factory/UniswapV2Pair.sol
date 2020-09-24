// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Callee.sol";
import "./UniswapV2ERC20.sol";
import "../../erc20/IERC20.sol";
import "../../erc1155/interfaces/IERC1155.sol";
import "../../common/math/Math.sol";
import "../../common/math/SafeMath.sol";
import "../../common/math/UQ112x112.sol";

contract UniswapV2Pair is IUniswapV2Pair, UniswapV2ERC20 {
    using SafeMath  for uint;
    using UQ112x112 for uint224;

    uint private constant _MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant STONK_SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    bytes4 private constant TOKEN_SELECTOR = 0x7fe68381;

    address private _factory;
    address private _dispenser;
    address private _stonkToken;
    bytes32 private _tokenHash;

    uint112 private tokenReserve;           // uses single storage slot, accessible via getReserves
    uint112 private stonkReserve;           // uses single storage slot, accessible via getReserves
    uint32  private blockTimestampLast;     // uses single storage slot, accessible via getReserves

    uint private _tokenCumulativeLast;
    uint private _stonkCumulativeLast;
    uint private _kLast; // tokenReserve * stonkReserve, as of immediately after the most recent liquidity event

    uint private unlocked = 1;

    modifier lock() {
        require(unlocked == 1, 'UniswapV2: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    event Mint(address indexed sender, uint tokenAmount, uint stonkAmount);
    event Burn(address indexed sender, uint tokenAmount, uint stonkAmount, address indexed to);
    event Swap(
        address indexed sender,
        uint tokenAmountIn,
        uint stonkAmountIn,
        uint tokenAmountOut,
        uint stonkAmountOut,
        address indexed to
    );
    event Sync(uint112 tokenReserve, uint112 stonkReserve);

    constructor() public {
        _factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(bytes32 tokenHash, address dispenser, address stonkToken) external virtual override {
        require(msg.sender == _factory, 'UniswapV2: FORBIDDEN'); // sufficient check
        _tokenHash = tokenHash;
        _dispenser = dispenser;
        _stonkToken = stonkToken;
    }

    function MINIMUM_LIQUIDITY() public view override returns (uint) {
        return _MINIMUM_LIQUIDITY;
    }

    function factory() public view override returns (address) {
        return _factory;
    }

    function dispenser() public view override returns (address) {
        return _dispenser;
    }

    function stonkToken() public view override returns (address) {
        return _stonkToken;
    }

    function tokenHash() public view override returns (bytes32) {
        return _tokenHash;
    }

    function tokenCumulativeLast() public view override returns (uint) {
        return _tokenCumulativeLast;
    }

    function stonkCumulativeLast() public view override returns (uint) {
        return _stonkCumulativeLast;
    }

    function kLast() public view override returns (uint) {
        return _kLast;
    }

    function getReserves() public view override returns (uint112 _tokenReserve, uint112 _stonkReserve, uint32 _blockTimestampLast) {
        _tokenReserve = tokenReserve;
        _stonkReserve = stonkReserve;
        _blockTimestampLast = blockTimestampLast;
    }

    function _safeStonkTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(STONK_SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: STONK_TRANSFER_FAILED');
    }

    function _safeTokenTransfer(bytes32 __tokenHash, address to, uint value) private {
        (bool success, bytes memory data) = _dispenser.call(abi.encodeWithSelector(TOKEN_SELECTOR, address(this), to, __tokenHash, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: TOKEN_TRANSFER_FAILED');
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(uint tokenBalance, uint stonkBalance, uint112 _tokenReserve, uint112 _stonkReserve) private {
        require(tokenBalance <= uint112(-1) && stonkBalance <= uint112(-1), 'UniswapV2: OVERFLOW');
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        if (timeElapsed > 0 && _tokenReserve != 0 && _stonkReserve != 0) {
            // * never overflows, and + overflow is desired
            _tokenCumulativeLast += uint(UQ112x112.encode(_stonkReserve).uqdiv(_tokenReserve)) * timeElapsed;
            _stonkCumulativeLast += uint(UQ112x112.encode(_tokenReserve).uqdiv(_stonkReserve)) * timeElapsed;
        }
        tokenReserve = uint112(tokenBalance);
        stonkReserve = uint112(stonkBalance);
        blockTimestampLast = blockTimestamp;
        emit Sync(tokenReserve, stonkReserve);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(uint112 _tokenReserve, uint112 _stonkReserve) private returns (bool feeOn) {
        address feeTo = IUniswapV2Factory(_factory).feeTo();
        feeOn = feeTo != address(0);
        uint __kLast = _kLast; // gas savings
        if (feeOn) {
            if (__kLast != 0) {
                uint rootK = Math.sqrt(uint(_tokenReserve).mul(_stonkReserve));
                uint rootKLast = Math.sqrt(__kLast);
                if (rootK > rootKLast) {
                    uint numerator = totalSupply().mul(rootK.sub(rootKLast));
                    uint denominator = rootK.mul(5).add(rootKLast);
                    uint liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (__kLast != 0) {
            _kLast = 0;
        }
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external virtual override lock returns (uint liquidity) {
        // address dispenser = IUniswapV2Factory(_factory).dispenser();
        // address stonkToken = IUniswapV2Factory(_factory).stonkToken();
        (uint112 _tokenReserve, uint112 _stonkReserve,) = getReserves(); // gas savings
        uint tokenBalance = IERC1155(_dispenser).balanceOf(address(this), _tokenHash);
        uint stonkBalance = IERC20(_stonkToken).balanceOf(address(this));
        uint tokenAmount = tokenBalance.sub(_tokenReserve);
        uint stonkAmount = stonkBalance.sub(_stonkReserve);

        bool feeOn = _mintFee(_tokenReserve, _stonkReserve);
        uint _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(tokenAmount.mul(stonkAmount)).sub(_MINIMUM_LIQUIDITY);
           _mint(address(0), _MINIMUM_LIQUIDITY); // permanently lock the first _MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(tokenAmount.mul(_totalSupply) / _tokenReserve, stonkAmount.mul(_totalSupply) / _stonkReserve);
        }
        require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);

        _update(tokenBalance, stonkBalance, _tokenReserve, _stonkReserve);
        if (feeOn) _kLast = uint(tokenReserve).mul(stonkReserve); // tokenReserve and stonkReserve are up-to-date
        emit Mint(msg.sender, tokenAmount, stonkAmount);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to) external virtual override lock returns (uint tokenAmount, uint stonkAmount) {
        // address dispenser = IUniswapV2Factory(_factory).dispenser();
        (uint112 _tokenReserve, uint112 _stonkReserve,) = getReserves(); // gas savings
        bytes32 __tokenHash = _tokenHash;                                // gas savings
        // address stonkToken = IUniswapV2Factory(_factory).stonkToken();
        uint tokenBalance = IERC1155(_dispenser).balanceOf(address(this), _tokenHash);
        uint stonkBalance = IERC20(_stonkToken).balanceOf(address(this));
        uint liquidity = balanceOf(address(this));

        bool feeOn = _mintFee(_tokenReserve, _stonkReserve);
        uint _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        tokenAmount = liquidity.mul(tokenBalance) / _totalSupply; // using balances ensures pro-rata distribution
        stonkAmount = liquidity.mul(stonkBalance) / _totalSupply; // using balances ensures pro-rata distribution
        require(tokenAmount > 0 && stonkAmount > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED');
        _burn(address(this), liquidity);

        _safeTokenTransfer(__tokenHash, to, tokenAmount);
        _safeStonkTransfer(_stonkToken, to, stonkAmount);
        tokenBalance = IERC1155(_dispenser).balanceOf(address(this), _tokenHash);
        stonkBalance = IERC20(_stonkToken).balanceOf(address(this));

        _update(tokenBalance, stonkBalance, _tokenReserve, _stonkReserve);
        if (feeOn) _kLast = uint(tokenReserve).mul(stonkReserve); // tokenReserve and stonkReserve are up-to-date
        emit Burn(msg.sender, tokenAmount, stonkAmount, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint tokenAmountOut, uint stonkAmountOut, address to, bytes calldata data) external virtual override lock {
        require(tokenAmountOut > 0 || stonkAmountOut > 0, 'UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint112 _tokenReserve, uint112 _stonkReserve,) = getReserves(); // gas savings
        require(tokenAmountOut < _tokenReserve && stonkAmountOut < _stonkReserve, 'UniswapV2: INSUFFICIENT_LIQUIDITY');

        uint tokenBalance;
        uint stonkBalance;
        { // scope for _token{0,1}, avoids stack too deep errors
        bytes32 __tokenHash = _tokenHash;
        require(to != _stonkToken, 'UniswapV2: INVALID_TO');
        // TODO: rewrite transfer
        if (tokenAmountOut > 0) _safeTokenTransfer(__tokenHash, to, tokenAmountOut); // optimistically transfer tokens
        if (stonkAmountOut > 0) _safeStonkTransfer(_stonkToken, to, stonkAmountOut); // optimistically transfer tokens
        if (data.length > 0) IUniswapV2Callee(to).uniswapV2Call(msg.sender, tokenAmountOut, stonkAmountOut, data);
        tokenBalance = IERC1155(_dispenser).balanceOf(address(this), __tokenHash);
        stonkBalance = IERC20(_stonkToken).balanceOf(address(this));
        }
        uint tokenAmountIn = tokenBalance > _tokenReserve - tokenAmountOut ? tokenBalance - (_tokenReserve - tokenAmountOut) : 0;
        uint stonkAmountIn = stonkBalance > _stonkReserve - stonkAmountOut ? stonkBalance - (_stonkReserve - stonkAmountOut) : 0;
        require(tokenAmountIn > 0 || stonkAmountIn > 0, 'UniswapV2: INSUFFICIENT_INPUT_AMOUNT');
        { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
        uint tokenBalanceAdjusted = tokenBalance.mul(1000).sub(tokenAmountIn.mul(3));
        uint stonkBalanceAdjusted = stonkBalance.mul(1000).sub(stonkAmountIn.mul(3));
        require(tokenBalanceAdjusted.mul(stonkBalanceAdjusted) >= uint(_tokenReserve).mul(_stonkReserve).mul(1000**2), 'UniswapV2: K');
        }

        _update(tokenBalance, stonkBalance, _tokenReserve, _stonkReserve);
        emit Swap(msg.sender, tokenAmountIn, stonkAmountIn, tokenAmountOut, stonkAmountOut, to);
    }

    // force balances to match reserves
    function skim(address to) external virtual override lock {
        bytes32 __tokenHash = _tokenHash; // gas savings
        _safeTokenTransfer(__tokenHash, to, IERC1155(_dispenser).balanceOf(address(this), __tokenHash).sub(tokenReserve));
        _safeStonkTransfer(_stonkToken, to, IERC20(_stonkToken).balanceOf(address(this)).sub(stonkReserve));
    }

    // force reserves to match balances
    function sync() external virtual override lock {
        _update(IERC1155(_dispenser).balanceOf(address(this), _tokenHash), IERC20(_stonkToken).balanceOf(address(this)), tokenReserve, stonkReserve);
    }
}
