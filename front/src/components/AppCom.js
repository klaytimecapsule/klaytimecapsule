import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import caver from './Caver_react.js';
import Modal from './Modal.js';

import optionIcon from '../image/icon/option_black.svg'
import deleteIcon from '../image/icon/delete_black.svg'
import logo from '../image/Logo.svg';

import useInput from './useInput';
import Loading from './Loading';

import KTCabi from '../contract/KlayTimeCapsule.json';
import KIP7abi from '../contract/KIP7.json';
import KIP17abi from '../contract/KIP17Enumerable.json';

import axios from 'axios';

function AppCom() {
    const { klaytn } = window;
    const [mode, setMode] = useState(0)
    const [address, setAddress] = useState(null);
    const [network, setNetwork] = useState(null);
    const [modalOn, setModalOn] = useState(false);
    const [target, setTarget] = useState(null);
    const [target_, onChangeTarget_] = useInput('');
    const [capsules, setCapusules] = useState([]);
    const [balances, setBalances] = useState([]);

    const connect_kaikas = async () => {
        if (klaytn) {
            const accounts = await klaytn?.enable()
            setAddress(accounts[0])
            if (Number(klaytn.networkVersion) !== 1001) alert('Baobab available only. Change your network to Baobab please.')
            setNetwork(Number(klaytn.networkVersion))
        }
    }

    const disconnect = () => {
        setAddress(null)
        setNetwork(null)
        window.location.reload()
    }

    const register_target = async () => {
        if (!(target_.length === 42 && caver.utils.checkAddressChecksum(target_))) {
            alert('The address is in an invalid format.')
            return
        }
        try {
            const KTC = new caver.klay.Contract(KTCabi.abi, '0x930F95C882c041820d67C562Cb29C878a49215C5');
            const res = await KTC.send({ from: address, gas: 1500000 }, 'setTarget', target_)
            if (res.status) {
                getTarget(address)
            }
        } catch (err) {
            console.error(err);
        }

    }

    const getTarget = async (adr) => {
        const KTC = new caver.klay.Contract(KTCabi.abi, '0x930F95C882c041820d67C562Cb29C878a49215C5');
        const _target = await KTC.call('target', adr)
        setTarget(_target);
        if (_target === '0x0000000000000000000000000000000000000000') {
            setMode(1)
        } else {
            setMode(2)
        }
    }

    const getCapsules = async (adr) => {
        const res = await axios.post('/api/getCapsules', { user: adr })
        setCapusules(res.data.capsules)
    }

    const deleteCapsule = async (_id) => {
        if (window.confirm("Do you really want to delete this capsule?")) {
            await axios.post('/api/deleteCapsule', { id: _id })
            getCapsules(address);
        }
    }

    useEffect(() => {
        if (network !== 1001) return
        getTarget(address)
        getCapsules(address)
    }, [address, network])

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

    const getBalance = async (_token, _kind, _address) => {
        try {
            if (_kind === 0) {
                const token_ = new caver.klay.Contract(KIP7abi.abi, _token);
                const _balance = caver.utils.convertFromPeb(await token_.call('balanceOf', _address), 'KLAY').toString();
                return _balance;
            } else if (_kind === 1) {
                const token_ = new caver.klay.Contract(KIP17abi.abi, _token);
                const __balance = await getNFT(token_, _address);
                let _balance;
                if (__balance.length === 0) {
                    _balance = 'x'
                } else {
                    _balance = `#${__balance.join(', #')}`;
                }
                return _balance;
            }

        } catch (err) {
            console.error(err)
            return '-'
        }
    }

    const getBalances = async (_capsules) => {
        const arr = [];
        for (let i = 0; i < _capsules.length; i++) {
            arr.push(await getBalance(_capsules[i].asset, Number(_capsules[i].kind), _capsules[i].user))
        }
        setBalances(arr)
    }

    useEffect(() => {
        getBalances(capsules)
    }, [capsules])

    return (
        <>
            <div className="app_com">
                <header className='header'>
                    <Link to='/app'>
                        <div className='header_logo_box'>
                            <img className='header_logo_image' src={logo} alt='Klay Time Capsule' />
                            <span className='header_logo'>
                                Klay Time Capsule
                            </span>

                        </div>
                    </Link>
                    {
                        address === null
                            ?
                            <button className='connect_button' onClick={connect_kaikas}>
                                Connect Wallet
                            </button>
                            :
                            <button className='connect_button' onClick={disconnect}>
                                Disconnect Wallet
                            </button>
                    }
                </header>
                {
                    address !== null && network === 1001
                        ?
                        {
                            0:
                                <div className='exception_body'>
                                    <div className='main_loading'>
                                        <Loading />
                                    </div>
                                    <span className='main_loading_span'>
                                        Checking your wallet...
                                    </span>
                                </div>
                            ,
                            1:
                                <div className='exception_body'>
                                    <div className='how_to'>
                                        <span className='how_to_title'>
                                            Register your target wallet address.
                                        </span>
                                        <div className='how_to_step_box'>
                                            <input className='how_to_input' placeholder='Enter target address' onChange={onChangeTarget_} value={target_} />
                                            <div className='how_to_caution_box'>
                                                <span className='how_to_caution'>
                                                    · The target wallet address is where your assets will be transferred.
                                                </span>
                                                <span className='how_to_caution'>
                                                    · The Expiry Date to kick-start your time capsule is 6 months.
                                                </span>
                                                <span className='how_to_caution'>
                                                    · Make sure the address is valid with no infiltration.
                                                </span>
                                                <span className='how_to_caution'>
                                                    · Revise the address at the ‘My Info’ section.
                                                </span>
                                            </div>
                                        </div>
                                        <button className='how_to_button' onClick={register_target}>
                                            Register
                                        </button>
                                    </div>
                                </div>,
                            2:
                                <div className='body_container'>
                                    <div className='body_header'>
                                        <span className='header_title'>
                                            My Info
                                        </span>
                                    </div>
                                    <div className='target_container'>
                                        <div className='target_header'>
                                            <span>
                                                your address
                                            </span>
                                            <span>
                                                target address
                                            </span>
                                            <span>
                                                revise
                                            </span>
                                        </div>
                                        <div className='target_content'>
                                            <span>
                                                {address}
                                            </span>
                                            <span>
                                                {target}
                                            </span>
                                            <span>
                                                <div className='capsule_icon_box'>
                                                    <img className='capsule_icon' src={optionIcon} alt='renew' onClick={() => setMode(3)} />
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                    <div className='body_header'>
                                        <span className='header_title'>
                                            My Capsules
                                        </span>
                                        <button className='header_button' onClick={() => setModalOn(true)}>
                                            Add new capsule +
                                        </button>
                                    </div>
                                    <div className='capsule_container'>
                                        <div className='capsule_header'>
                                            <span>
                                                kind
                                            </span>
                                            <span>
                                                name
                                            </span>
                                            <span>
                                                token address
                                            </span>
                                            <span>
                                                your balance
                                            </span>
                                            <span>
                                                delete
                                            </span>
                                        </div>
                                        {
                                            capsules.length === 0
                                                ?
                                                <span className='no_capsule'>
                                                    No Capsules
                                                </span>
                                                :
                                                null
                                        }
                                        {
                                            capsules.map((x, i) => {
                                                return (
                                                    <div className='capsule_content' key={i} >
                                                        <span>
                                                            {Number(x.kind) === 0 ? 'Token (KIP-7)' : 'NFT (KIP-17)'}
                                                        </span>
                                                        <span>
                                                            {x.name}
                                                        </span>
                                                        <span>
                                                            {x.asset}
                                                        </span>
                                                        <span>
                                                            {balances[i] === undefined ? <div className='small_loading'><Loading /></div> : balances[i]}
                                                        </span>
                                                        <span>
                                                            <div className='capsule_icon_box' onClick={() => deleteCapsule(x.id)}>
                                                                <img className='capsule_icon' src={deleteIcon} alt='delete' />
                                                            </div>
                                                        </span>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>,
                            3:
                                <div className='exception_body'>
                                    <div className='how_to'>
                                        <span className='how_to_title'>
                                            Register your target wallet address.
                                        </span>
                                        <div className='how_to_step_box'>
                                            <input className='how_to_input' placeholder='Enter target address' onChange={onChangeTarget_} value={target_} />
                                            <div className='how_to_caution_box'>
                                                <span className='how_to_caution'>
                                                    · The target wallet address is where your assets will be transferred.
                                                </span>
                                                <span className='how_to_caution'>
                                                    · The Expiry Date to kick-start your time capsule is 6 months.
                                                </span>
                                                <span className='how_to_caution'>
                                                    · Make sure the address is valid with no infiltration.
                                                </span>
                                                <span className='how_to_caution'>
                                                    · Revise the address at the ‘My Info’ section.
                                                </span>
                                            </div>
                                        </div>
                                        <div className='modal_button_box'>
                                            <button className='modal_button' onClick={() => setMode(2)}>
                                                &lt; prev
                                            </button>
                                            <button className='modal_button' onClick={register_target}>
                                                submit
                                            </button>
                                        </div>
                                    </div>
                                </div>,
                        }[mode]
                        :
                        address === null
                            ?
                            <div className='exception_body'>
                                <div className='how_to'>
                                    <span className='how_to_title'>
                                        Easiest way to keep assets safe.
                                    </span>
                                    <div className='how_to_step_box'>
                                        <span className='how_to_step'>
                                            <span className='how_to_tag'>Step 0.</span> Connect Wallet
                                        </span>
                                        <span className='how_to_step'>
                                            <span className='how_to_tag'>Step 1.</span> Register Target Wallet
                                        </span>
                                        <span className='how_to_step'>
                                            <span className='how_to_tag'>Step 2.</span> Add Time Capsule
                                        </span>
                                        <span className='how_to_step'>
                                            <span className='how_to_tag'>Step 3.</span> Submit
                                        </span>
                                    </div>
                                    <button className='how_to_button' onClick={connect_kaikas}>
                                        Connect Wallet
                                    </button>
                                </div>
                            </div>
                            :
                            <div className='exception_body'>
                                Change your network to Baobab and reconnect please.
                            </div>
                }
            </div>
            {
                modalOn
                    ?
                    <Modal address={address} setModalOn={setModalOn} getCapsules={getCapsules} capsules={capsules} />
                    :
                    null
            }
        </>
    )
}


export default AppCom;