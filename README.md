# DANK COnTrACtS

## Latest xDai contract addresses:

- ERC1155 (dispender/memeId fractionalizer): 0x5434D6b137Ae5e5541f99Df8A55c689aD744EEec
- ERC20 (stonk): 0x8d7bc38024ed7D8d17200c6F4102F3b249e2821B
- ERC721 (memeId issuer): 0x031fD5aD214Ec34e6D94f7a0a56341d9cFc7f823
- Migrations: 0x456E6A5734Ac11eE856e703e583B3fC67FD3b8dD
- UniswapV2Factory: 0xc9b9c9ad34C7FABda7A5408E4AaDE0e16DDC7579
- UniswapV2Router: 0x34E5298F19872868aE173d63FC93d1f1493D485f

## Contract deployment (step by step)

- Contracts ERC1155/ERC20/ERC721 can be deployed independently in any order
- Uniswap factory -> its constructor needs ERC1155(dispenser)/ERC20(ston) addresses
- Uniswap router -> its constructor needs factory address