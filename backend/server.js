const { Buffer } = require("buffer");
const { COSESign1, COSEKey, BigNum, Label, Int } = require("@emurgo/cardano-message-signing-nodejs");
const { Ed25519Signature, RewardAddress, PublicKey, Address } = require("@emurgo/cardano-serialization-lib-nodejs");
const express = require("express");
const cors = require("cors");

const app = express();

const registeredUsers = [
    "stake1uyzu7upg082rqajwasmwgam09fe7yj2cm3fkdfecqgptg8cwuze7s",
    "stake1u8k7mwu8gdqyvgved89996cy6g8d9vw36w7j05qy2etanxgmgl5s7",
    "stake1uynpv0vlulhufm8txwry0da9qq6tn9wn42mxltq65pw403qvdcveh",
    "stake1uxa2x4andawqtcqxw9gy4mamdx6extq5g5grqq6pf7zpxxge4aa7l",
    "stake1ux8yttnhy6qm9lkehvnmlhufnx38ef2q8vl6xyu8gyk0zwc83nvxh",
    "stake1uykkptznwz0jd3flwa442a0cdmfrpwhg8pa9ypytf4cwacqw2085c"
]

app.use(express.json());
app.options("*", cors());
app.use(cors({
    origin: "*"
}));

app.post("/login", authenticate);
app.listen(8081, () =>
  console.log("Backend component listening on port 8081!"),
);


async function authenticate(req, res) {
    const sigData = req.body;
    const decoded = COSESign1.from_bytes( Buffer.from(sigData.signature, "hex") );
    const headermap = decoded.headers().protected().deserialized_headers();
    const addressHex = Buffer.from( headermap.header( Label.new_text("address") ).to_bytes() )
        .toString("hex")
        .substring(4);
    const address = Address.from_bytes( Buffer.from(addressHex, "hex") );

    const key = COSEKey.from_bytes( Buffer.from(sigData.key, "hex") );
    const pubKeyBytes = key.header( Label.new_int( Int.new_negative(BigNum.from_str("2")) ) ).as_bytes();
    const publicKey = PublicKey.from_bytes(pubKeyBytes);

    const payload = decoded.payload();
    const signature = Ed25519Signature.from_bytes(decoded.signature());
    const receivedData = decoded.signed_data().to_bytes();

    const signerStakeAddrBech32 = RewardAddress.from_address(address).to_address().to_bech32();
    const utf8Payload = Buffer.from(payload).toString("utf8");
    const expectedPayload = `account: ${signerStakeAddrBech32}`; // reconstructed message

    // verify:
    const isVerified = publicKey.verify(receivedData, signature);
    const payloadAsExpected = utf8Payload == expectedPayload;
    const signerIsRegistered = registeredUsers.includes(signerStakeAddrBech32);

    const isAuthSuccess = isVerified && payloadAsExpected && signerIsRegistered;

    res.send({
        success: isAuthSuccess,
        message: isAuthSuccess ? "✅ Authentication success!" : "❌ Authentication failed."
    })
}