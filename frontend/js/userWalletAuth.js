import { Buffer } from "buffer";
let csl, wallet;

window.addEventListener("load", () => {
    const loginBtn = document.querySelector("#login-btn");
    loginBtn.addEventListener("click", authenticate);
})

async function authenticate(){
    if (!csl) await loadCsl(); // make sure CSL is loaded before doing anything else.

    wallet = await window.cardano.typhoncip30.enable();

    const [stakeAddrHex, stakeAddrBech32] = await getStakeAddress();
    const messageUtf = `account: ${stakeAddrBech32}`;
    const messageHex = Buffer.from(messageUtf).toString("hex");    
    const sigData = await wallet.signData(stakeAddrHex, messageHex);
    const result = await submitToBackend(sigData);
    alert(result.message);
}

async function loadCsl(){
    csl = await import("@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib");
};
loadCsl();

async function getStakeAddress(){
    const networkId = await wallet.getNetworkId();
    const changeAddrHex = await wallet.getChangeAddress();
    
    // derive the stakeAddress from the change address to be sure we are getting
    // the stake address of the currently active account.
    const changeAddress = csl.Address.from_bytes( Buffer.from(changeAddrHex, 'hex') );
    const stakeCredential = csl.BaseAddress.from_address(changeAddress).stake_cred();
    const stakeAddress = csl.RewardAddress.new(networkId, stakeCredential).to_address();

    return [stakeAddress.to_hex(), stakeAddress.to_bech32()];
}

async function submitToBackend(sigData){
    const result = await fetch(`http://localhost:8081/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(sigData),
    });
    return result.json();
}