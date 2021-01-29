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

    uint public override constant MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant BASE_TOKEN_SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    bytes4 private constant TOKEN_SELECTOR = 0x7fe68381;

    address public override factory;
    address public override dispenser;
    address public override baseToken;
    bytes32 public override tokenHash;

    uint112 public tokenReserve;           // uses single storage slot, accessible via getReserves
    uint112 public baseTokenReserve;           // uses single storage slot, accessible via getReserves
    uint32  public blockTimestampLast;     // uses single storage slot, accessible via getReserves

    uint public override tokenCumulativeLast;
    uint public override baseTokenCumulativeLast;
    uint public override kLast; // tokenReserve * baseTokenReserve, as of immediately after the most recent liquidity event

    uint private unlocked = 1;

    modifier lock() {
        require(unlocked == 1, 'UniswapV2: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    event Mint(address indexed sender, uint tokenAmount, uint baseTokenAmount);
    event Burn(address indexed sender, uint tokenAmount, uint baseTokenAmount, address indexed to);
    event Swap(
        address indexed sender,
        uint tokenAmountIn,
        uint baseTokenAmountIn,
        uint tokenAmountOut,
        uint baseTokenAmountOut,
        address indexed to
    );
    event Sync(uint112 tokenReserve, uint112 baseTokenReserve);

    constructor() public {
        factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(bytes32 _tokenHash, address _dispenser, address _baseToken) external virtual override {
        require(msg.sender == factory, 'UniswapV2: FORBIDDEN'); // sufficient check
        tokenHash = _tokenHash;
        dispenser = _dispenser;
        baseToken = _baseToken;
    }

    function getReserves() public view override returns (uint112 _tokenReserve, uint112 _baseTokenReserve, uint32 _blockTimestampLast) {
        _tokenReserve = tokenReserve;
        _baseTokenReserve = baseTokenReserve;
        _blockTimestampLast = blockTimestampLast;
    }

    function _safeBaseTokenTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(BASE_TOKEN_SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: BASE_TOKEN_TRANSFER_FAILED');
    }

    function _safeTokenTransfer(bytes32 _tokenHash, address to, uint value) private {
        (bool success, bytes memory data) = dispenser.call(abi.encodeWithSelector(TOKEN_SELECTOR, address(this), to, _tokenHash, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: TOKEN_TRANSFER_FAILED');
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(uint tokenBalance, uint baseTokenBalance, uint112 _tokenReserve, uint112 _baseTokenReserve) private {
        require(tokenBalance <= uint112(-1) && baseTokenBalance <= uint112(-1), 'UniswapV2: OVERFLOW');
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        if (timeElapsed > 0 && _tokenReserve != 0 && _baseTokenReserve != 0) {
            // * never overflows, and + overflow is desired
            tokenCumulativeLast += uint(UQ112x112.encode(_baseTokenReserve).uqdiv(_tokenReserve)) * timeElapsed;
            baseTokenCumulativeLast += uint(UQ112x112.encode(_tokenReserve).uqdiv(_baseTokenReserve)) * timeElapsed;
        }
        tokenReserve = uint112(tokenBalance);
        baseTokenReserve = uint112(baseTokenBalance);
        blockTimestampLast = blockTimestamp;
        emit Sync(tokenReserve, baseTokenReserve);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(uint112 _tokenReserve, uint112 _baseTokenReserve) private returns (bool feeOn) {
        address feeTo = IUniswapV2Factory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint _kLast = kLast; // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint rootK = Math.sqrt(uint(_tokenReserve).mul(_baseTokenReserve));
                uint rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint numerator = totalSupply.mul(rootK.sub(rootKLast));
                    uint denominator = rootK.mul(5).add(rootKLast);
                    uint liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external virtual override lock returns (uint liquidity) {
        // address dispenser = IUniswapV2Factory(factory).dispenser();
        // address baseToken = IUniswapV2Factory(factory).baseToken();
        (uint112 _tokenReserve, uint112 _baseTokenReserve,) = getReserves(); // gas savings
        uint tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
        uint baseTokenBalance = IERC20(baseToken).balanceOf(address(this));
        uint tokenAmount = tokenBalance.sub(_tokenReserve);
        uint baseTokenAmount = baseTokenBalance.sub(_baseTokenReserve);

        bool feeOn = _mintFee(_tokenReserve, _baseTokenReserve);
        uint _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(tokenAmount.mul(baseTokenAmount)).sub(MINIMUM_LIQUIDITY);
           _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(tokenAmount.mul(_totalSupply) / _tokenReserve, baseTokenAmount.mul(_totalSupply) / _baseTokenReserve);
        }
        require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);

        _update(tokenBalance, baseTokenBalance, _tokenReserve, _baseTokenReserve);
        if (feeOn) kLast = uint(tokenReserve).mul(baseTokenReserve); // tokenReserve and baseTokenReserve are up-to-date
        emit Mint(msg.sender, tokenAmount, baseTokenAmount);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to, uint exactTokenAmountOut, uint exactBaseTokenAmountOut) external virtual override lock returns (uint tokenAmount, uint baseTokenAmount) {
        (uint112 _tokenReserve, uint112 _baseTokenReserve,) = getReserves(); // gas savings
        bytes32 _tokenHash = tokenHash;                                // gas savings

        uint tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
        uint baseTokenBalance = IERC20(baseToken).balanceOf(address(this));
        uint liquidityBalance = balanceOf[address(this)]; // the amount was asked to burn

        bool feeOn = _mintFee(_tokenReserve, _baseTokenReserve);
        uint _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can be updated in _mintFee

        uint liquidity;
        if (exactTokenAmountOut > 0) {
            liquidity = _totalSupply.sub(MINIMUM_LIQUIDITY).mul(exactTokenAmountOut).div(tokenBalance);
            require(liquidity == liquidityBalance, 'UniswapV2: INSUFFICIENT_LIQUIDITY_PROVIDED');

            tokenAmount = exactTokenAmountOut;
            baseTokenAmount = tokenAmount == tokenBalance
                ? baseTokenBalance
                : liquidity.mul(baseTokenBalance).div(_totalSupply);

        } else if (exactBaseTokenAmountOut > 0) {
            liquidity = _totalSupply.sub(MINIMUM_LIQUIDITY).mul(exactBaseTokenAmountOut).div(baseTokenBalance);
            require(liquidity == liquidityBalance, 'UniswapV2: INSUFFICIENT_LIQUIDITY_PROVIDED');

            baseTokenAmount = exactBaseTokenAmountOut;
            tokenAmount = baseTokenAmount == baseTokenBalance
                ? tokenBalance
                : liquidity.mul(tokenBalance).div(_totalSupply);

        } else {
            liquidity = liquidityBalance;
            tokenAmount = liquidity.mul(tokenBalance).div(_totalSupply);
            baseTokenAmount = liquidity.mul(baseTokenBalance).div(_totalSupply); // using balances ensures pro-rata distribution
        }

        // we're removing the whole liquidity
        if (tokenAmount == tokenBalance && baseTokenAmount == baseTokenBalance) {
            liquidity = _totalSupply.sub(MINIMUM_LIQUIDITY);
            _burn(address(0), MINIMUM_LIQUIDITY);
        }

        require(tokenAmount > 0 && baseTokenAmount > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED');
        _burn(address(this), liquidity);

        _safeTokenTransfer(_tokenHash, to, tokenAmount);
        _safeBaseTokenTransfer(baseToken, to, baseTokenAmount);
        tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
        baseTokenBalance = IERC20(baseToken).balanceOf(address(this));

        _update(tokenBalance, baseTokenBalance, _tokenReserve, _baseTokenReserve);
        if (feeOn) kLast = uint(tokenReserve).mul(baseTokenReserve); // tokenReserve and baseTokenReserve are up-to-date
        emit Burn(msg.sender, tokenAmount, baseTokenAmount, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint tokenAmountOut, uint baseTokenAmountOut, address to, bytes calldata data) external virtual override lock {
        require(tokenAmountOut > 0 || baseTokenAmountOut > 0, 'UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint112 _tokenReserve, uint112 _baseTokenReserve,) = getReserves(); // gas savings
        require(tokenAmountOut < _tokenReserve && baseTokenAmountOut < _baseTokenReserve, 'UniswapV2: INSUFFICIENT_LIQUIDITY');

        uint tokenBalance;
        uint baseTokenBalance;
        { // scope for _token{0,1}, avoids stack too deep errors
        bytes32 _tokenHash = tokenHash;
        require(to != baseToken, 'UniswapV2: INVALID_TO');
        // TODO: rewrite transfer
        if (tokenAmountOut > 0) _safeTokenTransfer(_tokenHash, to, tokenAmountOut); // optimistically transfer tokens
        if (baseTokenAmountOut > 0) _safeBaseTokenTransfer(baseToken, to, baseTokenAmountOut); // optimistically transfer tokens
        if (data.length > 0) IUniswapV2Callee(to).uniswapV2Call(msg.sender, tokenAmountOut, baseTokenAmountOut, data);
        tokenBalance = IERC1155(dispenser).balanceOf(address(this), _tokenHash);
        baseTokenBalance = IERC20(baseToken).balanceOf(address(this));
        }
        uint tokenAmountIn = tokenBalance > _tokenReserve - tokenAmountOut ? tokenBalance - (_tokenReserve - tokenAmountOut) : 0;
        uint baseTokenAmountIn = baseTokenBalance > _baseTokenReserve - baseTokenAmountOut ? baseTokenBalance - (_baseTokenReserve - baseTokenAmountOut) : 0;
        require(tokenAmountIn > 0 || baseTokenAmountIn > 0, 'UniswapV2: INSUFFICIENT_INPUT_AMOUNT');
        { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
        uint tokenBalanceAdjusted = tokenBalance.mul(1000).sub(tokenAmountIn.mul(3));
        uint baseTokenBalanceAdjusted = baseTokenBalance.mul(1000).sub(baseTokenAmountIn.mul(3));
        require(tokenBalanceAdjusted.mul(baseTokenBalanceAdjusted) >= uint(_tokenReserve).mul(_baseTokenReserve).mul(1000**2), 'UniswapV2: K');
        }

        _update(tokenBalance, baseTokenBalance, _tokenReserve, _baseTokenReserve);
        emit Swap(msg.sender, tokenAmountIn, baseTokenAmountIn, tokenAmountOut, baseTokenAmountOut, to);
    }

    // force balances to match reserves
    function skim(address to) external virtual override lock {
        bytes32 _tokenHash = tokenHash; // gas savings
        _safeTokenTransfer(_tokenHash, to, IERC1155(dispenser).balanceOf(address(this), _tokenHash).sub(tokenReserve));
        _safeBaseTokenTransfer(baseToken, to, IERC20(baseToken).balanceOf(address(this)).sub(baseTokenReserve));
    }

    // force reserves to match balances
    function sync() external virtual override lock {
        _update(IERC1155(dispenser).balanceOf(address(this), tokenHash), IERC20(baseToken).balanceOf(address(this)), tokenReserve, baseTokenReserve);
    }
}
