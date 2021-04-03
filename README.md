# DANK Contracts

## Main contracts

| name                               | standard   |
|----------------------------------- | ---------- |
| `Dispenser/memeId fractionalizer`  | `ERC1155`  |
| `Wrapped ERC20` 	                 | `ERC20`    |
| `MemeId issuer` 	                 | `ERC721`   |
| `UniswapV2Factory`                 |            |
| `UniswapV2Router`                  |            |
| `Bridge`                           |            |
| `DaiBridgeProxy` mainnet only      |            |

## Latest deployed contract addresses

#### Mainnet

| contract                              | address                                       |
|-------------------------------------- |---------------------------------------------- |
| `DaiBridgeProxy`                      | `0xc6c9274d415Cba866022cD5AB2CA29C4b964c372`  |
| `Bridge`                              | `0xcbbfc1ed73160fc2677dab2e78fd1672d92cddbb`  |

#### xDai

| contract                              | address                                       |
|-------------------------------------- |---------------------------------------------- |
| `Dispenser/memeId fractionalizer` 	| `0xcBbFc1Ed73160fc2677DaB2E78fD1672D92cDdbb`  |
| `Wrapped ERC20` 	                    | `0xA63187dFD32B24315e4b898CfC22a9aD45a89943`  |
| `MemeId issuer` 	                    | `0xc6c9274d415Cba866022cD5AB2CA29C4b964c372`  |
| `UniswapV2Factory`                    | `0x3bBaf22dE1F54944943E3E66d410B6441530f240`  |
| `UniswapV2Router`                     | `0xe818acE57A0241244BcF7D8a1aba43C957853588`  |
| `UniswapV2Pair`                       | `0x951Ea0bb76D7b8AdDa84EcA53928559368037020`  |
| `Bridge`                              | `0xbE274bE0e6F23A0cb3b803975DC4A14f96191a84`  |

#### BSC

| contract                              | address                                       |
|-------------------------------------- |---------------------------------------------- |
| `Dispenser/memeId fractionalizer` 	| `0xcBbFc1Ed73160fc2677DaB2E78fD1672D92cDdbb`  |
| `Wrapped ERC20` 	                    | `0xA63187dFD32B24315e4b898CfC22a9aD45a89943`  |
| `MemeId issuer` 	                    | `0xbE274bE0e6F23A0cb3b803975DC4A14f96191a84`  |
| `UniswapV2Factory`                    | `0x1d7FE3520dae0C11D361922D0b51e8B5951bA5a4`  |
| `UniswapV2Router`                     | `0xC96D41bd8b02e64FEebE65391E64A85A76e0721d`  |
| `UniswapV2Pair`                       | `0x09bBa41Ef24ed3f6F0cB92C6065AB68191741f7d`  |
| `Bridge`                              | `0x25dA0A7422EFC9C2e13A32ED3C30BEae6263e2E1`  |


#### Rinkeby

| contract                              | address                                       |
|-------------------------------------- |---------------------------------------------- |
| `Dispenser/memeId fractionalizer` 	| `0x4F12D00Ce3AD7Ad15429782640E76585a8491bb8`  |
| `Wrapped ERC20` 	                    | `0x6792FB8C067D7cDF965F3e249cDC1de1eD768766`  |
| `MemeId issuer` 	                    | `0xbdcf56A1E20E84174B2C23cB64a86686f19E988c`  |
| `UniswapV2Factory`                    | `0xB8f3e44801383CC169df73FDE77c5eE9d58e2E70`  |
| `UniswapV2Router`                     | `0x203E758A4EF4d8f6C2dC7C5a286921B14A5eeD95`  |
| `UniswapV2Pair`                       | `0x00Be3296dE34F54AFC0F0E650706471f19bB5b23`  |
| `Bridge`                              | `0xc6ace67Fc1231d3f786d9c59F1261E3c4b44dC72`  |

#### Goerli

| contract                              | address                                       |
|-------------------------------------- |---------------------------------------------- |
| `Dispenser/memeId fractionalizer` 	| `0x4F12D00Ce3AD7Ad15429782640E76585a8491bb8`  |
| `Wrapped ERC20` 	                    | `0x6792FB8C067D7cDF965F3e249cDC1de1eD768766`  |
| `MemeId issuer` 	                    | `0x2dC0d93Db39D13f92e7FcCeE04800CAE8599F8e0`  |
| `UniswapV2Factory`                    | `0xB37807F1aA8159fe5371fE07Fd7eE4A0Ad9D39DA`  |
| `UniswapV2Router`                     | `0x27DDb045dEC8e22B0C7b6d97621B5C0B5116bd67`  |
| `UniswapV2Pair`                       | `0x796c92bA99A0c0C80CcE7Cffa28968ab538AA014`  |
| `Bridge`                              | `0x3F09e28Fd6eF7Ede975376AFc8aB7DDA588f1723`  |


## Contracts deployment

Run `npm run hardhat:deploy:local` to deploy contracts locally.\
For the real network deployment you'll need to set the `PK_RINKEBY` and `INFURA_TOKEN` environment variables and run `npm run hardhat:deploy:rinkeby`\
Where `PK_RINKEBY` is a private key you will use for deployment.

As an alternative you can run the command above in this format: `cross-env PK_RINKEBY= INFURA_TOKEN= npm run hardhat:deploy:rinkeby`

## Contracts verification

### BSC network
For BSC network verification please fill the `etherscan.apiKey` in `hardhat.config.js` and run `npm run hardhat:verify:bsc`

### Other networks (except xdai)
Please run this command `cross-env INFURA_TOKEN=[infura_token] npx hardhat --network goerli etherscan-verify --api-key [etherscan_api_key]`
