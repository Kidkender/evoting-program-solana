import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as fs from "fs";
import { EvotingProgram } from "../target/types/evoting_program";
import { initializeAccount, initlizeMint } from "./preTest";
import { mintTo } from "@solana/spl-token";
require("dotenv").config();

const totalToken = 1_000_000_000_000;

const loadKeypairFromFile = (filePath: string): anchor.web3.Keypair => {
  const keypairData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypairData));
};

const connection = new anchor.web3.Connection(
  "http://127.0.0.1:8899",
  "confirmed"
);

const aidropToken = async (wallet: anchor.web3.PublicKey) => {
  const airdropSignature = await connection.requestAirdrop(
    wallet,
    anchor.web3.LAMPORTS_PER_SOL
  );

  const latestBlockHash = await connection.getLatestBlockhash();

  const confirmationStrategy = {
    signature: airdropSignature,
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  };
  await connection.confirmTransaction(confirmationStrategy, "confirmed");
};

describe("evoting-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.EvotingProgram as Program<EvotingProgram>;

  const candidate = new anchor.web3.Keypair();
  let treasurer: anchor.web3.PublicKey;
  const mintKeypair = new anchor.web3.Keypair();

  let candidateTokenAccount: anchor.web3.PublicKey;
  let walletTokenAccount: anchor.web3.PublicKey;
  let ballot: anchor.web3.PublicKey;
  const provider = anchor.AnchorProvider.local();

  before(async () => {
    const payer = anchor.web3.Keypair.generate();

    await aidropToken(payer.publicKey);

    const mint = await initlizeMint(9, mintKeypair, provider, payer);

    const [treasurerPublicKey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasurer"), candidate.publicKey.toBuffer()],
      program.programId
    );
    treasurer = treasurerPublicKey;

    const [ballotPublicKey] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("ballot"),
        candidate.publicKey.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    ballot = ballotPublicKey;

    walletTokenAccount = anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: provider.wallet.publicKey,
    });

    candidateTokenAccount = anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: treasurerPublicKey,
    });

    const associatedTokenAccount = await initializeAccount(
      mint.publicKey,
      walletTokenAccount,
      provider,
      payer
    );
    mintTo(
      connection,
      payer,
      mintKeypair.publicKey,
      walletTokenAccount,
      provider.wallet.publicKey,
      totalToken
    );
  });

  it("Is initialized candidate !", async () => {
    const now = Math.floor(new Date().getTime() / 1000);
    const startTime = new anchor.BN(now);
    const endTime = new anchor.BN(now + 5);
  });
});
