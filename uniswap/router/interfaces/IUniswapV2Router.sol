pragma solidity >=0.6.2;

interface IUniswapV2Router {
    function factory() external pure returns (address);

    function addLiquidity(
       bytes32 tokenHash,
        uint tokenAmountDesired,
        uint stonkAmountDesired,
        uint tokenAmountMin,
        uint stonkAmountMin,
        address to,
        uint deadline
    ) external returns (uint tokenAmount, uint stonkAmount, uint liquidity);
    function removeLiquidity(
        bytes32 tokenHash,
        uint liquidity,
        uint tokenAmountMin,
        uint stonkAmountMin,
        address to,
        uint deadline
    ) external returns (uint tokenAmount, uint stonkAmount);
    function removeLiquidityWithPermit(
         bytes32 tokenHash,
        uint liquidity,
        uint tokenAmountMin,
        uint stonkAmountMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint tokenAmount, uint stonkAmount);
    function swapExactStonksForTokens(
        uint stonkAmountIn,
        uint tokenAmountOutMin,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint tokenAmountOut);
    function swapStonksForExactTokens(
        uint tokenAmountOut,
        uint stonkAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint stonkAmountIn);
    function swapExactTokensForStonks(
        uint tokenAmountIn,
        uint stonkAmountOutMin,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint stonkAmountOut);
    function swapTokensForExactStonks(
        uint stonkAmountOut,
        uint tokenAmountInMax,
        bytes32 tokenHash,
        address to,
        uint deadline
    ) external returns (uint tokenAmountIn);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getTokenAmountOut(uint amountIn, bytes32 tokenHash) external view returns (uint amountOut);
    // function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);

    // Uniswap 02 TEMPORARILY DISABLED as is unnecessary functionality
    // function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    //     uint amountIn,
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // ) external;
    // function swapExactETHForTokensSupportingFeeOnTransferTokens(
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // ) external payable;
    // function swapExactTokensForETHSupportingFeeOnTransferTokens(
    //     uint amountIn,
    //     uint amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint deadline
    // ) external;
}