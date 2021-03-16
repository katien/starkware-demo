import Portis from '@portis/web3/es';
import Web3 from 'web3';

export const portis = new Portis('8f55ab97-f6cf-48fd-b933-e198907ac427', 'ropsten');
export const web3 = new Web3(portis.provider);
// @ts-ignore

window.web3 = web3





