// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "./IUniswapV2Router.sol";
import "../factory/interfaces/IUniswapV2Factory.sol";
import "../factory/interfaces/IUniswapV2Pair.sol";
import "../factory/interfaces/IUniswapV2ERC20.sol";
import "../factory/lib/UniswapV2Library.sol";

import "../../common/utils/TransferHelper.sol";
import "../../common/math/SafeMath.sol";
import "../../erc20/IERC20.sol";

contract UniswapV2Router is IUniswapV2Router {
    using SafeMath for uint256;

    address private immutable _factory;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
        _;
    }

    event LiquidityAdded(uint liquidity, uint stonkAmount, uint tokenAmount);
    event LiquidityRemoved(uint liquidity, uint stonkAmount, uint tokenAmount);
    event Swap(uint stonkAmount, uint tokenAmount);

    constructor(address factory) public {
        _factory = factory;
    }

    function factory() public view override returns (address) {
        return _factory;
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        bytes32 tokenHash,
        uint tokenAmountDesired,
        uint stonkAmountDesired,
        uint tokenAmountMin,
        uint stonkAmountMin
    ) internal virtual returns (uint tokenAmount, uint stonkAmount) {
        // create the pair if it doesn't exist yet
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        if (pair == address(0)) {
            IUniswapV2Factory(_factory).createPair(tokenHash);
        }
        (uint tokenReserve, uint stonkReserve) = UniswapV2Library.getReserves(pair);
        if (tokenReserve == 0 && stonkReserve == 0) {
            (tokenAmount, stonkAmount) = (tokenAmountDesired, stonkAmountDesired);
        } else {
            uint stonkAmountOptimal = UniswapV2Library.quote(tokenAmountDesired, tokenReserve, stonkReserve);
            if (stonkAmountOptimal <= stonkAmountDesired) {
                require(stonkAmountOptimal >= stonkAmountMin, 'UniswapV2Router: INSUFFICIENT_STONK_AMOUNT');
                (tokenAmount, stonkAmount) = (tokenAmountDesired, stonkAmountOptimal);
            } else {
                uint tokenAmountOptimal = UniswapV2Library.quote(stonkAmountDesired, stonkReserve, tokenReserve);
                assert(tokenAmountOptimal <= tokenAmountDesired);
                require(tokenAmountOptimal >= tokenAmountMin, 'UniswapV2Router: INSUFFICIENT_TOKEN_AMOUNT');
                (tokenAmount, stonkAmount) = (tokenAmountOptimal, stonkAmountDesired);
            }
        }
    }
    function addLiquidity(
        bytes32 tokenHash,
        uint tokenAmountDesired,
        uint stonkAmountDesired,
        uint tokenAmountMin,
        uint stonkAmountMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint tokenAmount, uint stonkAmount, uint liquidity) {
        address stonkToken = IUniswapV2Factory(_factory).stonkToken();
        address dispenser = IUniswapV2Factory(_factory).dispenser();
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        (tokenAmount, stonkAmount) = _addLiquidity(tokenHash, tokenAmountDesired, stonkAmountDesired, tokenAmountMin, stonkAmountMin);
        TransferHelper.safeTransferFromERC1155(dispenser, tokenHash, msg.sender, pair, tokenAmount);
        TransferHelper.safeTransferFrom(stonkToken, msg.sender, pair, stonkAmount);
        liquidity = IUniswapV2Pair(pair).mint(to);
        emit LiquidityAdded(liquidity, stonkAmount, tokenAmount);
    }


    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        bytes32 tokenHash,
        uint liquidity,
        uint tokenAmountMin,
        uint stonkAmountMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint tokenAmount, uint stonkAmount) {
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        IUniswapV2ERC20(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (tokenAmount, stonkAmount) = IUniswapV2Pair(pair).burn(to);
        require(tokenAmount >= tokenAmountMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(stonkAmount >= stonkAmountMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
        emit LiquidityRemoved(liquidity, stonkAmount, tokenAmount);
    }

    function removeLiquidityWithPermit(
        bytes32 tokenHash,
        uint liquidity,
        uint tokenAmountMin,
        uint stonkAmountMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint tokenAmount, uint stonkAmount) {
        address pair = UniswapV2Library.pairFor(_factory, tokenHash);
        uint value = approveMax ? uint(-1) : liquidity;
        IUniswapV2ERC20(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (tokenAmount, stonkAmount) = removeLiquidity(tokenHash, liquidity, tokenAmountMin, stonkAmountMin, to, deadline);
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swapToTokens(uint _tokenAmountOut, bytes32 tokenHash, address _to) internal virtual {
      address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
      (uint tokenAmountOut, uint stonkAmountOut) = (_tokenAmountOut, uint(0));
      IUniswapV2Pair(pair).swap(
          tokenAmountOut, stonkAmountOut, _to, new bytes(0)
      );
    }

    function _swapToStonks(uint _stonkAmountOut, bytes32 tokenHash, address _to) internal virtual {
      (uint tokenAmountOut, uint stonkAmountOut) = (uint(0), _stonkAmountOut);
      address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
      IUniswapV2Pair(pair).swap(
          tokenAmountOut, stonkAmountOut, _to, new bytes(0)
      );
    }

    function swapExactStonksForTokens(
      uint stonkAmountIn,
      uint tokenAmountOutMin,
      bytes32 tokenHash,
      address to,
      uint deadline
    ) external virtual override ensure(deadline) returns (uint tokenAmountOut) {
      address stonkToken = IUniswapV2Factory(_factory).stonkToken();
      address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
      tokenAmountOut = UniswapV2Library.getTokenAmountOut(pair, stonkAmountIn);
      require(tokenAmountOut >= tokenAmountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT_TOKEN');
      TransferHelper.safeTransferFrom(
        stonkToken, msg.sender, pair, stonkAmountIn
      );
      _swapToTokens(tokenAmountOut, tokenHash, to);
      emit Swap(stonkAmountIn, tokenAmountOut);
    }

    function swapStonksForExactTokens(
        uint tokenAmountOut,
        uint stonkAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint stonkAmountIn) {
        address stonkToken = IUniswapV2Factory(_factory).stonkToken();
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        stonkAmountIn = UniswapV2Library.getStonkAmountIn(pair, tokenAmountOut);
        require(stonkAmountIn <= stonkAmountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT_STONK');
        TransferHelper.safeTransferFrom(
            stonkToken, msg.sender, pair, stonkAmountIn
        );
        _swapToTokens(tokenAmountOut, tokenHash, to);
        emit Swap(stonkAmountIn, tokenAmountOut);
    }

    function swapExactTokensForStonks(
      uint tokenAmountIn,
      uint stonkAmountOutMin,
      bytes32 tokenHash,
      address to,
      uint deadline
    ) external virtual override ensure(deadline) returns (uint stonkAmountOut) {
      address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
      stonkAmountOut = UniswapV2Library.getStonkAmountOut(pair, tokenAmountIn);
      require(stonkAmountOut >= stonkAmountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT_STONK');
      address dispenser = IUniswapV2Factory(_factory).dispenser();
      TransferHelper.safeTransferFromERC1155(
        dispenser, tokenHash, msg.sender, pair, tokenAmountIn
      );
      _swapToStonks(stonkAmountOut, tokenHash, to);
      emit Swap(stonkAmountOut, tokenAmountIn);
    }

    function swapTokensForExactStonks(
        uint stonkAmountOut,
        uint tokenAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint tokenAmountIn) {
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        tokenAmountIn = UniswapV2Library.getTokenAmountIn(pair, stonkAmountOut);
        require(tokenAmountIn <= tokenAmountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT_TOKEN');
        address dispenser = IUniswapV2Factory(_factory).dispenser();
        TransferHelper.safeTransferFromERC1155(
          dispenser, tokenHash, msg.sender, pair, tokenAmountIn
        );
        _swapToStonks(stonkAmountOut, tokenHash, to);
        emit Swap(stonkAmountOut, tokenAmountIn);
    }

    // // **** SWAP (supporting fee-on-transfer tokens) ****
    // // requires the initial amount to have already been sent to the first pair
    // function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
    //     for (uint i; i < path.length - 1; i++) {
    //         (address input, address output) = (path[i], path[i + 1]);
    //         (address token0,) = UniswapV2Library.sortTokens(input, output);
    //         IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(_factory, input, output));
    //         uint amountInput;
    //         uint amountOutput;
    //         { // scope to avoid stack too deep errors
    //         (uint reserve0, uint reserve1,) = pair.getReserves();
    //         (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    //         amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
    //         amountOutput = UniswapV2Library.getAmountOut(amountInput, reserveInput, reserveOutput);
    //         }
    //         (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
    //         address to = i < path.length - 2 ? UniswapV2Library.pairFor(_factory, output, path[i + 2]) : _to;
    //         pair.swap(amount0Out, amount1Out, to, new bytes(0));
    //     }
    // }
    // function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    //     uint amountIn,
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // ) external virtual override ensure(deadline) {
    //     TransferHelper.safeTransferFrom(
    //         path[0], msg.sender, UniswapV2Library.pairFor(_factory, path[0], path[1]), amountIn
    //     );
    //     uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    //     _swapSupportingFeeOnTransferTokens(path, to);
    //     require(
    //         IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
    //         'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
    //     );
    // }

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

    function getTokenAmountOut(uint stonkAmountIn, bytes32 tokenHash)
        public
        view
        virtual
        override
        returns (uint amountOut)
    {
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        return UniswapV2Library.getTokenAmountOut(pair, stonkAmountIn);
    }

    function getStonkAmountOut(uint tokenAmountIn, bytes32 tokenHash)
        public
        view
        virtual
        override
        returns (uint amountOut)
    {
        address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
        return UniswapV2Library.getStonkAmountOut(pair, tokenAmountIn);
    }

    // TODO currently unnecessary until initial working trade is made
    function getStonkAmountIn(uint tokenAmountOut, bytes32 tokenHash)
      public
      view
      virtual
      override
      returns (uint amountOut)
    {
      address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
      return UniswapV2Library.getStonkAmountIn(pair, tokenAmountOut);
    }

    function getTokenAmountIn(uint stonkAmountOut, bytes32 tokenHash)
      public
      view
      virtual
      override
      returns (uint amountOut)
    {
      address pair = IUniswapV2Factory(_factory).getPair(tokenHash);
      return UniswapV2Library.getTokenAmountIn(pair, stonkAmountOut);
    }
}
