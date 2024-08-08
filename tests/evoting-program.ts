import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import { EvotingProgram } from "../target/types/evoting_program";
import { initializeAccount, initlizeMint } from "./preTest";
require("dotenv").config();

const totalToken = 1_000_000_000_000;

const loadKeypairFromFile = (filePath: string): anchor.web3.Keypair => {
  const keypairData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypairData));
};

const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

const airdropToken = async (wallet: anchor.web3.PublicKey) => {
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
  console.log(`Airdrop successful for wallet: ${wallet.toBase58()}`);
};

describe("evoting-program", async () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.local("http://127.0.0.1:8899"));
  process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";

  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.EvotingProgram as Program<EvotingProgram>;

  const candidate = new anchor.web3.Keypair();
  let treasurer: anchor.web3.PublicKey;
  const mintKeypair = new anchor.web3.Keypair();

  let candidateTokenAccount: anchor.web3.PublicKey;
  let walletTokenAccount: anchor.web3.PublicKey;
  let ballot: anchor.web3.PublicKey;
  const provider = anchor.AnchorProvider.local("https://api.devnet.solana.com");

  before(async () => {
    const payer = loadKeypairFromFile(process.env.ANCHOR_WALLET);

    // Uncomment when insufu balance
    // await airdropToken(payer.publicKey);

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

    try {
      const account = await getAccount(provider.connection, walletTokenAccount);
      console.log("Wallet token account already exists:", account);
    } catch (error) {
      console.log("Wallet token account does not exist, creating...");
      await initializeAccount(
        provider.wallet.publicKey,
        mintKeypair.publicKey,
        provider,
        payer
      );
    }

    const accountInfo = await provider.connection.getAccountInfo(
      walletTokenAccount
    );

    if (!accountInfo) {
      throw new Error("Token account does not exist or is not initialized");
    }

    await mintTo(
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
    const endTime = new anchor.BN(now + 10);

    await program.rpc.initializeProgram(startTime, endTime, {
      accounts: {
        authority: provider.wallet.publicKey,
        candidate: candidate.publicKey,
        treasurer,
        mint: mintKeypair.publicKey,
        candidateTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [candidate],
    });
  });

  it("vote", async () => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await program.rpc.vote(new anchor.BN(10), {
            accounts: {
              authority: provider.wallet.publicKey,
              candidate: candidate.publicKey,
              treasurer,
              mint: mintKeypair.publicKey,
              candidateTokenAccount,
              ballot,
              voterTokenAccount: walletTokenAccount,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [],
          });

          const weigthBallot = await program.account.ballot.fetch(ballot);
          assert.equal(10, weigthBallot.amount.toNumber());
        } catch (error) {
          console.error(error);
        }

        resolve();
      }, 2000);
    });
  });

  it("close", async () => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await program.rpc.close({
            accounts: {
              authority: provider.wallet.publicKey,
              candidate: candidate.publicKey,
              treasurer,
              mint: mintKeypair.publicKey,
              candidateTokenAccount,
              ballot,
              voterTokenAccount: walletTokenAccount,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
          });
        } catch (error) {
          console.error(error);
        }

        resolve();
      }, 10000);
    });
  });
});
