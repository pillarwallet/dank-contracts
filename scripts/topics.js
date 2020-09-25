const { ethers } = require('ethers');

const convertToKeccak = (s) => {
	const byteArr = ethers.utils.toUtf8Bytes(s)
	return ethers.utils.keccak256(byteArr);
}

async function main() {
	console.info('calculated topics');
	
	// router
	console.info('Uniswap Router--------');
	const swapStonksToExactTokens = convertToKeccak('SwapStonksToExactTokens(address,bytes32,uint256,uint256)')
	console.info('SwapStonksToExactTokens: ', swapStonksToExactTokens);
	const swapTokensToExactStonks = convertToKeccak('SwapTokensToExactStonks(address,bytes32,uint256,uint256)')
	console.info('SwapTokensToExactStonks: ', swapTokensToExactStonks);

	const swapExactTokensToStonks = convertToKeccak('SwapExactTokensToStonks(address,bytes32,uint256,uint256)')
	console.info('SwapExactTokensToStonks: ', swapExactTokensToStonks);
	const swapExactStonksToTokens = convertToKeccak('SwapExactStonksToTokens(address,bytes32,uint256,uint256)')
	console.info('SwapExactStonksToTokens: ', swapExactStonksToTokens);

	const liquidityAdded = convertToKeccak('LiquidityAdded(address,bytes32,uint256,uint256,uint256)');
	console.info('Liquidity added: ', liquidityAdded);
	const liquidityRemoved = convertToKeccak('LiquidityRemoved(address,bytes32,uint256,uint256,uint256)');
	console.info('Liquidity removed: ', liquidityRemoved);

	// erc20 (stonk)
	console.info('ERC20 stonk--------');
	const mint = convertToKeccak('Mint(address,uint256)')
	console.info('Mint: ', mint);

	// erc721 (memeMinter)
	console.info('ERC721 memeMinter--------');
	const erc721Mint = convertToKeccak('Mint(address,uint256)')
	console.info('Mint: ', erc721Mint);
	const transfer = convertToKeccak('Transfer(address,address,uint256)')
	console.info('Transfer: ', transfer);

	// factory
	console.info('Uniswap Factory--------');
	const createPair = convertToKeccak('PairCreated(address,bytes32,address,address,uint256)')
	console.info('CreatePair', createPair);

}

main();