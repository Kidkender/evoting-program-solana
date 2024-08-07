import { AnchorProvider, web3 } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const initlizeMint = async (
  decimal: number,
  token: web3.Keypair,
  provider: AnchorProvider,
  payer: web3.Keypair
): Promise<web3.Keypair> => {
  const lamport = await getMinimumBalanceForRentExemptMint(provider.connection);
  const ix = web3.SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    newAccountPubkey: token.publicKey,
    space: MINT_SIZE,
    lamports: lamport,
    programId: TOKEN_PROGRAM_ID,
  });

  const tx = new web3.Transaction().add(ix);

  await provider.sendAndConfirm(tx, [token]);

  await createMint(
    provider.connection,
    payer,
    provider.wallet.publicKey,
    null,
    decimal,
    token,
    null,
    TOKEN_PROGRAM_ID
  );

  console.log("Mint created:", token.publicKey.toBase58());
  return token;
};

export const initializeAccount = async (
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  provider: AnchorProvider,
  payer: web3.Keypair
) => {
  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    mint,
    owner,
    true,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log(
    "Associated Token account created: ",
    associatedTokenAccount.address.toBase58()
  );
  return associatedTokenAccount.address;
};
