use anchor_lang::prelude::*;
use anchor_spl::token;

use crate::{accounts, structs::Candidate};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, has_one = mint)]
    pub candidate: Account<'info, Candidate>,

    #[account(seeds = [b"treasurer", &candidate.key().to_bytes()] ,bump)]
    pub treasurer: AccountInfo<'info>,

    pub mint: Box<Account<'info, token::Mint>>,

    #[account(mut, associated_token::mint = mint, associated_token::authority = treasurer)]
    pub candidate_token_account: Account<'info, token::TokenAccount>,
}
