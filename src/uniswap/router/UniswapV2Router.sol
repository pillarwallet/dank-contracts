// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "./IUniswapV2Router.sol";
import "../factory/interfaces/IUniswapV2Factory.sol";
import "../factory/interfaces/IUniswapV2Pair.sol";
import "../factory/interfaces/IUniswapV2ERC20.sol";
import "../factory/lib/UniswapV2Library.sol";

import "../../common/utils/TransferHelper.sol";
import "../../common/math/SafeMath.sol";

contract UniswapV2Router is IUniswapV2Router {
    using SafeMath for uint256;

    address public immutable override factory;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
        _;
    }

    event LiquidityAdded(address sender, bytes32 tokenHash, uint liquidity, uint amountB, uint amountA);
    event LiquidityRemoved(address sender, bytes32 tokenHash, uint liquidity, uint amountB, uint amountA);
    event SwapBaseTokensForExactTokens(address sender, bytes32 tokenHash, uint baseTokenmountIn, uint tokenAmount);
    event SwapTokensForExactBaseTokens(address sender, bytes32 tokenHash, uint baseTokenAmount, uint tokenAmount);
    event SwapExactTokensForBaseTokens(address sender, bytes32 tokenHash, uint baseTokenAmount, uint tokenAmount);
    event SwapExactBaseTokensForTokens(address sender, bytes32 tokenHash, uint baseTokenAmountIn, uint tokenAmount);

    constructor(address _factory) public {
        factory = _factory;
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        bytes32 tokenHash,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        if (pair == address(0)) {
            IUniswapV2Factory(factory).createPair(tokenHash);
        }
        (uint reserveA, uint reserveB) = UniswapV2Library.getReserves(pair);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        bytes32 tokenHash,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        address tokenB = IUniswapV2Factory(factory).baseToken();
        address dispenser = IUniswapV2Factory(factory).dispenser();
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        (amountA, amountB) = _addLiquidity(tokenHash, amountADesired, amountBDesired, amountAMin, amountBMin);
        TransferHelper.safeTransferFromERC1155(dispenser, tokenHash, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IUniswapV2Pair(pair).mint(to);
        emit LiquidityAdded(msg.sender, tokenHash, liquidity, amountB, amountA);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        bytes32 tokenHash,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        IUniswapV2ERC20(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (amountA, amountB) = IUniswapV2Pair(pair).burn(to);
        require(amountA >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
        emit LiquidityRemoved(msg.sender, tokenHash, liquidity, amountB, amountA);
    }

    function removeLiquidityWithPermit(
        bytes32 tokenHash,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2ERC20(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenHash, liquidity, amountAMin, amountBMin, to, deadline);
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swapToTokens(uint _tokenAmountOut, bytes32 tokenHash, address _to) internal virtual {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        (uint tokenAmountOut, uint baseTokenAmountOut) = (_tokenAmountOut, uint(0));
        IUniswapV2Pair(pair).swap(
            tokenAmountOut, baseTokenAmountOut, _to, new bytes(0)
        );
    }

    function _swapToBase(uint _baseTokenAmountOut, bytes32 tokenHash, address _to) internal virtual {
        (uint tokenAmountOut, uint baseTokenAmountOut) = (uint(0), _baseTokenAmountOut);
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        IUniswapV2Pair(pair).swap(
            tokenAmountOut, baseTokenAmountOut, _to, new bytes(0)
        );
    }

    function swapExactBaseTokensForTokens(
        uint baseTokenAmountIn,
        uint tokenAmountOutMin,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint tokenAmountOut) {
        address baseToken = IUniswapV2Factory(factory).baseToken();
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        tokenAmountOut = UniswapV2Library.getTokenAmountOut(pair, baseTokenAmountIn);
        require(tokenAmountOut >= tokenAmountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT_TOKEN');
        TransferHelper.safeTransferFrom(
            baseToken, msg.sender, pair, baseTokenAmountIn
        );
        _swapToTokens(tokenAmountOut, tokenHash, to);
        emit SwapExactBaseTokensForTokens(msg.sender, tokenHash, baseTokenAmountIn, tokenAmountOut);
    }

    function swapBaseTokensForExactTokens(
        uint tokenAmountOut,
        uint baseTokenAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint baseTokenAmountIn) {
        address baseToken = IUniswapV2Factory(factory).baseToken();
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        baseTokenAmountIn = UniswapV2Library.getBaseTokenAmountIn(pair, tokenAmountOut);
        require(baseTokenAmountIn <= baseTokenAmountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT_BASE_TOKEN');
        TransferHelper.safeTransferFrom(
            baseToken, msg.sender, pair, baseTokenAmountIn
        );
        _swapToTokens(tokenAmountOut, tokenHash, to);
        emit SwapBaseTokensForExactTokens(msg.sender, tokenHash, baseTokenAmountIn, tokenAmountOut);
    }

    function swapExactTokensForBaseTokens(
        uint tokenAmountIn,
        uint baseTokenAmountOutMin,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint baseTokenAmountOut) {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        baseTokenAmountOut = UniswapV2Library.getBaseTokenAmountOut(pair, tokenAmountIn);
        require(baseTokenAmountOut >= baseTokenAmountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT_BASE_TOKEN');
        address dispenser = IUniswapV2Factory(factory).dispenser();
        TransferHelper.safeTransferFromERC1155(
            dispenser, tokenHash, msg.sender, pair, tokenAmountIn
        );
        _swapToBase(baseTokenAmountOut, tokenHash, to);
        emit SwapExactTokensForBaseTokens(msg.sender, tokenHash, baseTokenAmountOut, tokenAmountIn);
    }

    // swapTokensForExactTokens
    function swapTokensForExactBaseTokens(
        uint baseTokenAmountOut,
        uint tokenAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint tokenAmountIn) {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        tokenAmountIn = UniswapV2Library.getTokenAmountIn(pair, baseTokenAmountOut);
        require(tokenAmountIn <= tokenAmountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT_TOKEN');
        address dispenser = IUniswapV2Factory(factory).dispenser();
        TransferHelper.safeTransferFromERC1155(
          dispenser, tokenHash, msg.sender, pair, tokenAmountIn
        );
        _swapToBase(baseTokenAmountOut, tokenHash, to);
        emit SwapTokensForExactBaseTokens(msg.sender, tokenHash, baseTokenAmountOut, tokenAmountIn);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return UniswapV2Library.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountIn)
    {
        return UniswapV2Library.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getTokenAmountOut(uint baseTokenAmountIn, bytes32 tokenHash)
        public
        view
        virtual
        override
        returns (uint amountOut)
    {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        return UniswapV2Library.getTokenAmountOut(pair, baseTokenAmountIn);
    }

    function getBaseTokenAmountOut(uint tokenAmountIn, bytes32 tokenHash)
        public
        view
        virtual
        override
        returns (uint amountOut)
    {
        address pair = IUniswapV2Factory(factory).getPair(tokenHash);
        return UniswapV2Library.getBaseTokenAmountOut(pair, tokenAmountIn);
    }

    // TODO currently unnecessary until initial working trade is made
    function getBaseTokenAmountIn(uint tokenAmountOut, bytes32 tokenHash)
      public
      view
      virtual
      override
      returns (uint amountOut)
    {
      address pair = IUniswapV2Factory(factory).getPair(tokenHash);
      return UniswapV2Library.getBaseTokenAmountIn(pair, tokenAmountOut);
    }

    function getTokenAmountIn(uint baseTokenAmountOut, bytes32 tokenHash)
      public
      view
      virtual
      override
      returns (uint amountOut)
    {
      address pair = IUniswapV2Factory(factory).getPair(tokenHash);
      return UniswapV2Library.getTokenAmountIn(pair, baseTokenAmountOut);
    }
}
