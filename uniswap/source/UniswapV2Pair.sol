pragma solidity =0.5.16;

import './interfaces/IUniswapV2Pair.sol';
import './UniswapV2ERC20.sol';
import './libraries/Math.sol';
import './libraries/UQ112x112.sol';
import './interfaces/IERC20.sol';
import './interfaces/IERC1155.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IUniswapV2Callee.sol';

contract UniswapV2Pair is IUniswapV2Pair, UniswapV2ERC20 {
    using SafeMath  for uint;
    using UQ112x112 for uint224;

    uint public constant MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant STONK_SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    bytes4 private constant TOKEN_SELECTOR = bytes4(keccak256(bytes('safeTransferFrom(address,address,bytes32,uint256,bytes)')));

    address public factory;
    bytes32 public tokenHash;

    uint112 private tokenReserve;           // uses single storage slot, accessible via getReserves
    uint112 private stonkReserve;           // uses single storage slot, accessible via getReserves
    uint32  private blockTimestampLast;     // uses single storage slot, accessible via getReserves

    uint public tokenCumulativeLast;
    uint public stonkCumulativeLast;
    uint public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event

    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, 'UniswapV2: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function getReserves() public view returns (uint112 _tokenReserve, uint112 _stonkReserve, uint32 _blockTimestampLast) {
        _tokenReserve = tokenReserve;
        _stonkReserve = stonkReserve;
        _blockTimestampLast = blockTimestampLast;
    }

    function _safeStonkTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(STONK_SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: STONK_TRANSFER_FAILED');
    }

    function _safeTokenTransfer(bytes32 tokenHash, address to, uint value) private {
        address dispenser = IUniswapV2Factory(factory).dispenser();
        (bool success, bytes memory data) = dispenser.call(abi.encodeWithSelector(TOKEN_SELECTOR, address(this), to, tokenHash, value, ''));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: TOKEN_TRANSFER_FAILED');
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
        factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(bytes32 _tokenHash) external {
        require(msg.sender == factory, 'UniswapV2: FORBIDDEN'); // sufficient check
        tokenHash = _tokenHash;
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(uint tokenBalance, uint stonkBalance, uint112 _tokenReserve, uint112 _stonkReserve) private {
        require(tokenBalance <= uint112(-1) && stonkBalance <= uint112(-1), 'UniswapV2: OVERFLOW');
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        if (timeElapsed > 0 && _tokenReserve != 0 && _stonkReserve != 0) {
            // * never overflows, and + overflow is desired
            tokenCumulativeLast += uint(UQ112x112.encode(_stonkReserve).uqdiv(_tokenReserve)) * timeElapsed;
            stonkCumulativeLast += uint(UQ112x112.encode(_tokenReserve).uqdiv(_stonkReserve)) * timeElapsed;
        }
        tokenReserve = uint112(tokenBalance);
        stonkReserve = uint112(stonkBalance);
        blockTimestampLast = blockTimestamp;
        emit Sync(tokenReserve, stonkReserve);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(uint112 _tokenReserve, uint112 _stonkReserve) private returns (bool feeOn) {
        address feeTo = IUniswapV2Factory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint _kLast = kLast; // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint rootK = Math.sqrt(uint(_tokenReserve).mul(_stonkReserve));
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
    function mint(address to) external lock returns (uint liquidity) {
        address dispenser = IUniswapV2Factory(factory).dispenser();
        (uint112 _tokenReserve, uint112 _stonkReserve,) = getReserves(); // gas savings
        uint tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
        uint stonkBalance = IERC20(stonkBalance).balanceOf(address(this));
        uint tokenAmount = tokenBalance.sub(_tokenReserve);
        uint stonkAmount = stonkBalance.sub(_stonkReserve);

        bool feeOn = _mintFee(_tokenReserve, _stonkReserve);
        uint _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(tokenAmount.mul(stonkAmount)).sub(MINIMUM_LIQUIDITY);
           _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(tokenAmount.mul(_totalSupply) / _tokenReserve, stonkAmount.mul(_totalSupply) / _stonkReserve);
        }
        require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);

        _update(tokenBalance, stonkBalance, _tokenReserve, _stonkReserve);
        if (feeOn) kLast = uint(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Mint(msg.sender, tokenAmount, stonkAmount);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to) external lock returns (uint tokenAmount, uint stonkAmount) {
        address dispenser = IUniswapV2Factory(factory).dispenser();
        (uint112 _tokenReserve, uint112 _stonkReserve,) = getReserves(); // gas savings
        address _tokenHash = tokenHash;                                // gas savings
        address _stonkToken = IUniswapV2Factory(factory).stonkToken();
        uint tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
        uint stonkBalance = IERC20(stonkToken).balanceOf(address(this));
        uint liquidity = balanceOf[address(this)];

        bool feeOn = _mintFee(_tokenReserve, _stonkReserve);
        uint _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        tokenAmount = liquidity.mul(tokenBalance) / _totalSupply; // using balances ensures pro-rata distribution
        stonkAmount = liquidity.mul(stonkBalance) / _totalSupply; // using balances ensures pro-rata distribution
        require(tokenAmount > 0 && stonkAmount > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED');
        _burn(address(this), liquidity);

        _safeTokenTransfer(_tokenHash, to, tokenAmount);
        _safeStonkTransfer(_stonkToken, to, stonkAmount);
        tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
        stonkBalance = IERC20(stonkToken).balanceOf(address(this));

        _update(tokenBalance, stonkBalance, _tokenReserve, _stonkReserve);
        if (feeOn) kLast = uint(tokenReserve).mul(stonkReserve); // reserve0 and reserve1 are up-to-date
        emit Burn(msg.sender, tokenAmount, stonkAmount, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(uint tokenAmountOut, uint stonkAmountOut, address to, bytes calldata data) external lock {
        require(tokenAmountOut > 0 || stonkAmountOut > 0, 'UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT');
        (uint112 _tokenReserve, uint112 _stonkReserve,) = getReserves(); // gas savings
        require(tokenAmountOut < _tokenReserve && stonkAmountOut < _stonkReserve, 'UniswapV2: INSUFFICIENT_LIQUIDITY');
        address dispenser = IUniswapV2Factory(factory).dispenser();

        uint tokenBalance;
        uint stonkBalance;
        { // scope for _token{0,1}, avoids stack too deep errors
        address _tokenHash = tokenHash;
        address _stonkToken = IUniswapV2Factory(factory).stonkToken();
        require(to != _stonkToken, 'UniswapV2: INVALID_TO');
        // TODO: rewrite transfer
        if (tokenAmountOut > 0) _safeTokenTransfer(_tokenHash, to, tokenAmount); // optimistically transfer tokens
        if (stonkAmountOut > 0) _safeStonkTransfer(_stonkToken, to, stonkAmount); // optimistically transfer tokens
        if (data.length > 0) IUniswapV2Callee(to).uniswapV2Call(msg.sender, tokenAmountOut, stonkAmountOut, data);
        tokenBalance = IERC1155(dispenser).balanceOf(address(this), tokenHash);
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
    function skim(address to) external lock {
        address _tokenHash = tokenHash; // gas savings
        address _stonkToken = IUniswapV2Factory(factory).stonkToken();
        _safeTokenTransfer(_tokenHash, to, IERC1155(dispenser).balanceOf(address(this), tokenHash).sub(tokenReserve));
        _safeStonkTransfer(_stonkToken, to, IERC20(_stonkToken).balanceOf(address(this)).sub(stonkReserve));
    }

    // force reserves to match balances
    function sync() external lock {
        address dispenser = IUniswapV2Factory(factory).dispenser();
        address stonkToken = IUniswapV2Factory(factory).stonkToken();
        _update(IERC1155(dispenser).balanceOf(address(this), tokenHash)), IERC20(stonkToken).balanceOf(address(this)), tokenReserve, stonkReserve);
    }
}
