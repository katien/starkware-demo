const starkwareCrypto  = require('./signature');
const assert  = require('assert');
const testData  = require('./signature_test_data.json');

//=================================================================================================
// Example: StarkEx Transfer:
//=================================================================================================
function transfer() {
    // retrieve private key from test data, drop 0x prefix
    const privateKey = testData.meta_data.transfer_order.private_key.substring(2);
    // derive keypair from private key
    const keyPair = starkwareCrypto.ec.keyFromPrivate(privateKey, 'hex');
    // get public key from keypair
    const publicKey = starkwareCrypto.ec.keyFromPublic(keyPair.getPublic(true, 'hex'), 'hex');
    // get x coordinate of public key
    const publicKeyX = publicKey.pub.getX();
    // verify the calculated public key x coordinate matches the public key in the test data
    assert(publicKeyX.toString(16) === testData.transfer_order.public_key.substring(2),
        `Got: ${publicKeyX.toString(16)}.
        Expected: ${testData.transfer_order.public_key.substring(2)}`);

    // generate a message hash for the transfer order
    const transfer = testData.transfer_order;
    const msgHash = starkwareCrypto.getTransferMsgHash(
        transfer.amount, // - amount (uint63 decimal str)
        transfer.nonce, // - nonce (uint31)
        transfer.sender_vault_id, // - sender_vault_id (uint31)
        transfer.token, // - token (hex str with 0x prefix < prime)
        transfer.target_vault_id, // - target_vault_id (uint31)
        transfer.target_public_key, // - target_public_key (hex str with 0x prefix < prime)
        transfer.expiration_timestamp // - expiration_timestamp (uint22)
    );

    // verify message hash is correct
    assert(msgHash === testData.meta_data.transfer_order.message_hash.substring(2),
        `Got: ${msgHash}. Expected: ` +
        testData.meta_data.transfer_order.message_hash.substring(2));

    // The following is the JSON representation of a transfer:
    console.log('Transfer JSON representation: ', transfer);
    console.log('Transfer hash: ', msgHash);
}


//=================================================================================================
// Example: Signing a StarkEx Order:
//=================================================================================================
function sign(){
    // retrieve private key from test data, drop 0x prefix
    const privateKey = testData.meta_data.party_a_order.private_key.substring(2);
    // derive keypair from private key
    const keyPair = starkwareCrypto.ec.keyFromPrivate(privateKey, 'hex');
    // get public key from keypair
    const publicKey = starkwareCrypto.ec.keyFromPublic(keyPair.getPublic(true, 'hex'), 'hex');
    // get x coordinate of public key
    const publicKeyX = publicKey.pub.getX();

    // verify the calculated public key x coordinate matches the public key in the test data
    assert(
        publicKeyX.toString(16) === testData.settlement.party_a_order.public_key.substring(2),
        `Got: ${publicKeyX.toString(16)}.
        Expected: ${testData.settlement.party_a_order.public_key.substring(2)}`
    );

    // generate message hash for limit order
    const { party_a_order: partyAOrder } = testData.settlement;
    const msgHash = starkwareCrypto.getLimitOrderMsgHash(
        partyAOrder.vault_id_sell, // - vault_sell (uint31)
        partyAOrder.vault_id_buy, // - vault_buy (uint31)
        partyAOrder.amount_sell, // - amount_sell (uint63 decimal str)
        partyAOrder.amount_buy, // - amount_buy (uint63 decimal str)
        partyAOrder.token_sell, // - token_sell (hex str with 0x prefix < prime)
        partyAOrder.token_buy, // - token_buy (hex str with 0x prefix < prime)
        partyAOrder.nonce, // - nonce (uint31)
        partyAOrder.expiration_timestamp // - expiration_timestamp (uint22)
    );

    // verify message hash is correct
    assert(msgHash === testData.meta_data.party_a_order.message_hash.substring(2),
        `Got: ${msgHash}. Expected: ` + testData.meta_data.party_a_order.message_hash.substring(2));

    // sign message hash with keypair
    const msgSignature = starkwareCrypto.sign(keyPair, msgHash);
    const { r, s } = msgSignature;

    // verify the signature on the message hash against the public key
    assert(starkwareCrypto.verify(publicKey, msgHash, msgSignature));

    // verify r and s values on EDCSA sig are what was expected
    assert(r.toString(16) === partyAOrder.signature.r.substring(2),
        `Got: ${r.toString(16)}. Expected: ${partyAOrder.signature.r.substring(2)}`);
    assert(s.toString(16) === partyAOrder.signature.s.substring(2),
        `Got: ${s.toString(16)}. Expected: ${partyAOrder.signature.s.substring(2)}`);

    // The following is the JSON representation of an order:
    console.log('Order JSON representation: ', partyAOrder);
    console.log('Order hash: ', msgHash);
    console.log('Order signature: ', msgSignature);


    //=============================================================================================
    // Example: StarkEx key serialization:
    //=============================================================================================

    const pubXStr = publicKey.pub.getX().toString('hex');
    const pubYStr = publicKey.pub.getY().toString('hex');

    // Verify Deserialization.
    const pubKeyDeserialized = starkwareCrypto.ec.keyFromPublic({ x: pubXStr, y: pubYStr }, 'hex');
    assert(starkwareCrypto.verify(pubKeyDeserialized, msgHash, msgSignature));
}


transfer()
