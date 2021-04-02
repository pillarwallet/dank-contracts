// here are the settings for scripts to debug locally deployed contracts
module.exports = {
  artifactsPath: 'artifacts',
  networkId: 9999,
  eth_provider: 'http://127.0.0.1:8545',

  // default accounts from Etherspot-infra
  ownerPrivateKey: '0x5504956d5f39cbe19c7303d5df78dc43599ba661afe67fec14eafd044e162bd6', // LocalA faucet 1000000000 ETH
  ownerAddress: '0xae32631bdbb2474CC11594268427A2da3D6aBd6B',
  traderPrivateKey: '0xfea4ffe8fbacd3d9ee44868a2bf55c6c1c4944afac91afff5dfbdc9415c18893', // 1000 ETH on LocalA
  traderAddress: '0xeeFc7bfBC3F3d384Ab6Ee53b7fA7ab182cc23DCA',
  tokenHash: '', // fractionized erc721 token hash
  pair: '', // uniswap pair
};
