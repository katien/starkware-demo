import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {portis, web3} from "./services/web3";
import {solidityKeccak} from "@authereum/starkware-crypto";
import {ecsign} from "ethereumjs-util";

interface AppState {
    address: string,
    starkKey: string
}

function App() {
    let [state, setState] = useState<AppState>({starkKey: "", address: ""});

    // @ts-ignore
    window['portis'] = portis;

    async function register() {
        let ethAddress = (await web3.eth.getAccounts())[0];
        let starkKey = portis.starkwareProvider.getStarkKey();
        setState({starkKey, address: ethAddress});

        let userAdminKey = "<userAdmin private key>";
        // hash the stark key to ethereum address pairing
        const pairingHash = solidityKeccak(
            ['string', 'address', 'uint256'],
            ["UserRegistration:", ethAddress, starkKey]).toString('hex')

        // generate ECDSA signature of hash using userAdmin private key
        const signedOperatorSig = ecsign(Buffer.from(pairingHash, 'hex'), Buffer.from(userAdminKey, 'hex'))

        // encode the signature as hex
        const hexOperatorSignature = "0x" +
            signedOperatorSig.r.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '') +
            signedOperatorSig.s.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '') +
            signedOperatorSig.v.toString(16);

        console.log(`operatorSig: ${hexOperatorSignature}`)

        // request the on chain register tx data from the SDK
        let data = await portis.starkwareProvider.register(ethAddress, starkKey, hexOperatorSignature);
        console.log(`Register tx data: ${data}`);

        // send the register tx on chain
        let result = await web3.eth.sendTransaction({
            from: ethAddress,
            to: "<live starkex contract address>",
            data
        });

        console.log("Register tx result: ", result);
        return data;
    }

    async function transferEth() {
        const transferParams = {
            vaultId: "34",
            to: {
                starkKey: "0x5fa3383597691ea9d827a79e1a4f0f7949435ced18ca9619de8ab97e661020",
                vaultId: "21",
            },
            quantum: "1",
            amount: "2154549703648910716",
            nonce: "1",
            expirationTimestamp: "438953",
            // condition: "",
        };
        const signedTransfer = await portis.starkwareProvider.transferEth( transferParams);
        console.log(`signedTransfer: ${signedTransfer}`);
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>Ethereum Address: {state.address}</p>
                <p>Stark Key: {state.starkKey}</p>
                <a onClick={portis.showPortis}>Show Portis</a>
                <a onClick={register}>Register</a>
                <a onClick={transferEth}>Transfer Ethereum</a>
            </header>
        </div>
    );
}

export default App;
