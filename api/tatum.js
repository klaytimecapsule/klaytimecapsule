const axios = require('axios');
require("dotenv").config();

const getBalance = async (user) => {
    try {
        const res = await axios.get(
            `https://api-eu1.tatum.io/v3/klaytn/account/balance/${user}`,
            {
                headers: {
                    'x-api-key': process.env.TATUM_API_KEY
                }
            }
        );
        return res.data.balance;
    } catch (err) {
        console.error(err)
        return '0';
    }
}

const execute_kip7 = async (user, asset) => {
    try {
        const res = await axios.post(
            `https://api-eu1.tatum.io/v3/klaytn/smartcontract`,
            JSON.stringify({
                contractAddress: '0x930F95C882c041820d67C562Cb29C878a49215C5',
                methodName: 'executeCapsule_kip7',
                methodABI: {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "asset",
                            "type": "address"
                        }
                    ],
                    "name": "executeCapsule_kip7",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                params: [user, asset],
                fromPrivateKey: process.env.OWNER_PRIVATE_KEY
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.TATUM_API_KEY
                }
            }
        )
    } catch (err) {
        console.error(err);
    }
}


const getNFT = async (user, nft) => {
    try {
        const res = await axios.post(
            `https://api-eu1.tatum.io/v3/klaytn/smartcontract`,
            JSON.stringify({
                contractAddress: nft,
                methodName: 'balanceOf',
                methodABI: {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "owner",
                            "type": "address"
                        }
                    ],
                    "name": "balanceOf",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                params: [user]
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.TATUM_API_KEY
                }
            }
        )

        const balance = Number(res.data.data);

        const dividend = 10;
        const q = parseInt(balance / dividend);
        const r = balance % dividend;

        const getSplitNFT = async (from, num) => {
            const _list = [];
            let id;
            for (let i = from; i < from + num; i++) {
                const res2 = await axios.post(
                    `https://api-eu1.tatum.io/v3/klaytn/smartcontract`,
                    JSON.stringify({
                        contractAddress: nft,
                        methodName: 'tokenOfOwnerByIndex',
                        methodABI: {
                            "inputs": [
                                {
                                    "internalType": "address",
                                    "name": "owner",
                                    "type": "address"
                                },
                                {
                                    "internalType": "uint256",
                                    "name": "index",
                                    "type": "uint256"
                                }
                            ],
                            "name": "tokenOfOwnerByIndex",
                            "outputs": [
                                {
                                    "internalType": "uint256",
                                    "name": "",
                                    "type": "uint256"
                                }
                            ],
                            "stateMutability": "view",
                            "type": "function"
                        },
                        params: [account, i]
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.TATUM_API_KEY
                        }
                    }
                )
                id = Number(res2.data.data);
                _list.push(id);
            }
            return _list;
        }


        const promises = [];

        for (let j = 0; j < q; j++) {
            promises.push(getSplitNFT(j * dividend, dividend));
        }
        promises.push(getSplitNFT(q * dividend, r));

        const _result = await Promise.all(promises);
        const result = _result.reduce((before, a) => before.concat(a), []);
        const resultSorted = result.sort((a, b) => a - b);

        return resultSorted

    } catch (err) {
        console.error(err)
    }
}

const execute_kip17 = async (user, asset) => {
    try {
        const ids = await getNFT(user, asset)
        const res2 = await axios.post(
            `https://api-eu1.tatum.io/v3/klaytn/smartcontract`,
            JSON.stringify({
                contractAddress: '0x930F95C882c041820d67C562Cb29C878a49215C5',
                methodName: 'executeCapsule_kip17',
                methodABI: {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "asset",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256[]",
                            "name": "ids",
                            "type": "uint256[]"
                        }
                    ],
                    "name": "executeCapsule_kip17",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                params: [user, asset, ids],
                fromPrivateKey: process.env.OWNER_PRIVATE_KEY
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.TATUM_API_KEY
                }
            }
        )
    } catch (err) {
        console.error(err);
    }
}

const tatum = { getBalance: getBalance, execute_kip7: execute_kip7, execute_kip17: execute_kip17 }

module.exports = tatum;