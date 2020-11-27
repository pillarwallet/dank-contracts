# DANK Contracts

## Main contracts

| name                               | standard   |
|----------------------------------- | ---------- |
| `Dispenser/memeId fractionalizer`  | `ERC1155`  |
| `Stonk token` 	                 | `ERC20`    |
| `MemeId issuer` 	                 | `ERC721`   |
| `UniswapV2Factory`                 |            |
| `UniswapV2Router`                  |            |

## Latest deployed contract addresses

#### xDai

| contract                              | address                                       |
|-------------------------------------- |---------------------------------------------- |
| `Dispenser/memeId fractionalizer` 	| `0x5434D6b137Ae5e5541f99Df8A55c689aD744EEec`  |
| `Stonk token` 	                    | `0x8d7bc38024ed7D8d17200c6F4102F3b249e2821B`  |
| `MemeId issuer` 	                    | `0x031fD5aD214Ec34e6D94f7a0a56341d9cFc7f823`  |
| `UniswapV2Factory`                    | `0xc9b9c9ad34C7FABda7A5408E4AaDE0e16DDC7579`  |
| `UniswapV2Router`                     | `0x34E5298F19872868aE173d63FC93d1f1493D485f`  |


## Contract deployment (step by step)

- Contracts ERC1155/ERC20/ERC721 can be deployed independently in any order
- Uniswap factory -> its constructor needs ERC1155(dispenser)/ERC20(stonk) addresses
- Uniswap router -> its constructor needs factory address
