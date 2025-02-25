use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

use crate::structs::Candidate;

#[derive(Accounts)]
pub struct Initalize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
    init,
    payer = authority,
    space = Candidate::SIZE,
  )]
    pub candidate: Account<'info, Candidate>,

    #[account(seeds = [b"treasurer".as_ref(), &candidate.key().to_bytes()], bump)]
    /// CHECK: This is an authority PDA, no further checks needed
    pub treasurer: AccountInfo<'info>,
    pub mint: Box<Account<'info, token::Mint>>,

    #[account(
    init,
    payer = authority,
    associated_token::mint = mint,
    associated_token::authority = treasurer
  )]
    pub candidate_token_account: Account<'info, token::TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec_initialize(ctx: Context<Initalize>, start_date: i64, end_date: i64) -> Result<()> {
    let candidate: &mut Account<'_, Candidate> = &mut ctx.accounts.candidate;

    candidate.start_date = start_date;
    candidate.end_date = end_date;
    candidate.amount = 0;
    candidate.mint = ctx.accounts.mint.key();
    Ok(())
}
