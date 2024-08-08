import { AnchorProvider, web3 } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const initlizeMint = async (
  decimal: number,
  token: web3.Keypair,
  provider: AnchorProvider,
  payer: web3.Keypair
): Promise<web3.Keypair> => {
  const connection = provider.connection;

  const accountInfo = await connection.getAccountInfo(token.publicKey);

  if (accountInfo !== null) {
    throw new Error(
      `Token address ${token.publicKey.toBase58()} already exists.`
    );
  }

  const mint = await createMint(
    provider.connection,
    payer,
    provider.wallet.publicKey,
    null,
    decimal,
    token,
    null,
    TOKEN_PROGRAM_ID
  );
  return token;
};

export const initializeAccount = async (
  owner: web3.PublicKey,
  token: web3.PublicKey,
  provider: AnchorProvider,
  payer: web3.Keypair
) => {
  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    token,
    owner,
    true,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log("Associated Token account created: ", associatedTokenAccount);
  return associatedTokenAccount.address;
};
