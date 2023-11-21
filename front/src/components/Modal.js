import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import caver from './Caver_react.js';
import axios from 'axios';
import useInput from './useInput';
import { ethers } from 'ethers';

import closeIcon from '../image/icon/close.svg';
import confirmIcon from '../image/icon/confirm.svg';
import errorIcon from '../image/icon/error.svg';

import KIP13abi from '../contract/IKIP13.json';
import KIP7abi from '../contract/KIP7.json';
import KIP17abi from '../contract/KIP17Enumerable.json';

function Modal({ address, setModalOn, getCapsules, capsules }) {
    const [mode, setMode] = useState(0);

    const [token, onChangeToken] = useInput('');
    const [valid, setValid] = useState(0);

    const [name, setName] = useState('-')
    const [balance, setBalance] = useState('-')

    const getNFT = async (_con, account) => {

        const balance = await _con.call("balanceOf", account);
        const dividend = 10;
        const q = parseInt(balance / dividend);
        const r = balance % dividend;

        const getSplitNFT = async (from, num) => {
            const _list = [];
            let id;
            for (let i = from; i < from + num; i++) {
                id = await _con.call("tokenOfOwnerByIndex", account, i);
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
    }

    const checkInterface = async (_token, _mode) => {
        try {
            setValid(1)
            const token_ = new caver.klay.Contract(KIP13abi.abi, _token);
            let bool = false;
            if (_mode === 1) {
                bool = await token_.call('supportsInterface', '0x65787371')
            } else if (_mode === 2) {
                bool = await token_.call('supportsInterface', '0x80ac58cd')
            }

            bool ? setValid(3) : setValid(2);

        } catch (err) {
            console.error(err)
            setValid(2)
        }
    }

    const getMetadata = async (_token, _valid, _mode, _address) => {
        try {
            if (_mode === 1) {
                const token_ = new caver.klay.Contract(KIP7abi.abi, _token);
                const _name = await token_.call('name');
                const _balance = await token_.call('balanceOf', _address);
                setName(_name);
                setBalance(caver.utils.convertFromPeb(_balance, 'KLAY').toString());
            } else if (_mode === 2) {
                const token_ = new caver.klay.Contract(KIP17abi.abi, _token);
                const _name = await token_.call('name');
                const __balance = await getNFT(token_, _address);
                let _balance;
                if (__balance.length === 0) {
                    _balance = 'x'
                } else {
                    _balance = `#${__balance.join(', #')}`;
                }
                setName(_name);
                setBalance(_balance);
            }

        } catch (err) {
            console.error(err)
            setName('-')
            setBalance('-')
        }
    }

    useEffect(() => {
        if (token.length !== 42) {
            setValid(0)
            return
        }
        checkInterface(token, mode)
    }, [token, mode])

    useEffect(() => {
        if (valid === 3) {
            getMetadata(token, valid, mode, address)
        } else {
            setName('-')
            setBalance('-')
        }
    }, [token, valid, mode, address])

    const sign_approve = async () => {
        if (valid !== 3) return
        if (name === '-') return

        for (let i = 0; i < capsules.length; i++) {
            if ((capsules[i].asset).toUpperCase() === token.toUpperCase()) {
                alert('A capsule of the same asset already exists.');
                setMode(4)
                return
            }
        }

        try {
            if (mode === 1) {
                const token_ = new caver.klay.Contract(KIP7abi.abi, token);
                const res = await token_.send({ from: address, gas: 1500000 }, 'approve', "0x930F95C882c041820d67C562Cb29C878a49215C5", (ethers.constants.MaxUint256).toString())
                if (res.status) {
                    const result = await axios.post('/api/makeCapsule', { user: address, name: name, asset: token, kind: 0 })
                    if (result.data.msg !== 'done') {
                        setMode(4)
                        return
                    }
                    await getCapsules(address)
                    setMode(3)
                } else {
                    setMode(4)
                }
            } else if (mode === 2) {
                const token_ = new caver.klay.Contract(KIP17abi.abi, token);
                const res = await token_.send({ from: address, gas: 1500000 }, 'setApprovalForAll', "0x930F95C882c041820d67C562Cb29C878a49215C5", true)
                if (res.status) {
                    const result = await axios.post('/api/makeCapsule', { user: address, name: name, asset: token, kind: 1 })
                    if (result.data.msg !== 'done') {
                        setMode(4)
                        return
                    }
                    await getCapsules(address)
                    setMode(3)
                } else {
                    setMode(4)
                }

            }
            setMode(3)
        } catch (err) {
            console.error(err);
            setMode(4)
        }
    }

    return (
        <>
            <div className="modal">
                <img className='modal_close' src={closeIcon} alt='close' onClick={() => setModalOn(false)} />
                {
                    {
                        0:
                            <>
                                <span className='modal_title'>
                                    Select your asset.
                                </span>
                                <div className='modal_assets'>
                                    <span className='modal_asset' onClick={() => setMode(1)}>
                                        Token (KIP-7)
                                    </span>
                                    <span className='modal_asset' onClick={() => setMode(2)}>
                                        NFT (KIP-17)
                                    </span>
                                </div>
                                <div />
                            </>,
                        1:
                            <>
                                <span className='modal_title'>
                                    Enter token address
                                </span>
                                <div className='modal_body'>
                                    <div className='modal_body_semi'>
                                        <span className='modal_semi'>
                                            Token (KIP-7) address
                                        </span>
                                        <input className='how_to_input' placeholder='Enter token address' onChange={onChangeToken} value={token} />
                                    </div>
                                    {
                                        {
                                            0:
                                                <div className='modal_body_caution'>
                                                    Enter token address (ex. 0x1234...)
                                                </div>,
                                            1:
                                                <div className='modal_body_caution'>
                                                    Checking ...
                                                </div>,
                                            2:
                                                <div className='modal_body_caution modal_body_caution_error'>
                                                    <img className='modal_body_caution_icon' src={errorIcon} alt='invalid' /> Invalid address
                                                </div>,
                                            3:
                                                <div className='modal_body_caution modal_body_caution_confirm'>
                                                    <img className='modal_body_caution_icon' src={confirmIcon} alt='valid' /> Valid address
                                                </div>
                                        }[valid]
                                    }
                                    <div className='modal_body_semi_info_box'>
                                        <div className='modal_body_semi_info'>
                                            <span>
                                                Name
                                            </span>
                                            <span>
                                                {name}
                                            </span>
                                        </div>
                                        <div className='modal_body_semi_info'>
                                            <span>
                                                Your Balance
                                            </span>
                                            <span>
                                                {balance}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className='modal_button_box'>
                                    <button className='modal_button' onClick={() => setMode(0)}>
                                        &lt; prev
                                    </button>
                                    <button className={valid === 3 ? 'modal_button' : 'modal_button button_dead'} onClick={sign_approve}>
                                        submit
                                    </button>
                                </div>
                            </>,
                        2:
                            <>
                                <span className='modal_title'>
                                    Enter NFT address
                                </span>
                                <div className='modal_body'>
                                    <div className='modal_body_semi'>
                                        <span className='modal_semi'>
                                            NFT (KIP-17) address
                                        </span>
                                        <input className='how_to_input' placeholder='Enter NFT address' onChange={onChangeToken} value={token} />
                                    </div>
                                    {
                                        {
                                            0:
                                                <div className='modal_body_caution'>
                                                    Enter token address (ex. 0x1234...)
                                                </div>,
                                            1:
                                                <div className='modal_body_caution'>
                                                    Checking ...
                                                </div>,
                                            2:
                                                <div className='modal_body_caution modal_body_caution_error'>
                                                    <img className='modal_body_caution_icon' src={errorIcon} alt='invalid' /> Invalid address
                                                </div>,
                                            3:
                                                <div className='modal_body_caution modal_body_caution_confirm'>
                                                    <img className='modal_body_caution_icon' src={confirmIcon} alt='valid' /> Valid address
                                                </div>
                                        }[valid]
                                    }
                                    <div className='modal_body_semi_info_box'>
                                        <div className='modal_body_semi_info'>
                                            <span>
                                                Name
                                            </span>
                                            <span>
                                                {name}
                                            </span>
                                        </div>
                                        <div className='modal_body_semi_info'>
                                            <span>
                                                Your Balance
                                            </span>
                                            <span>
                                                {balance}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className='modal_button_box'>
                                    <button className='modal_button' onClick={() => setMode(0)}>
                                        &lt; prev
                                    </button>
                                    <button className={valid === 3 && name !== '-' ? 'modal_button' : 'modal_button button_dead'} onClick={sign_approve}>
                                        submit
                                    </button>
                                </div>
                            </>,
                        3:
                            <>
                                <span className='modal_end_body'>
                                    <img className='modal_end_icon' src={confirmIcon} alt='valid' /> Capsule created
                                </span>
                                <button className='how_to_button' onClick={() => setModalOn(false)}>
                                    OK
                                </button>
                            </>,
                        4:
                            <>
                                <span className='modal_end_body'>
                                    <img className='modal_end_icon' src={errorIcon} alt='valid' /> Error occured
                                </span>
                                <button className='how_to_button' onClick={() => setModalOn(false)}>
                                    OK
                                </button>
                            </>
                    }[mode]
                }
            </div>
            <div className="modal_mock" onClick={() => setModalOn(false)}>
            </div>
        </>
    )
}


export default Modal;