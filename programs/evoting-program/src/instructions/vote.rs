use crate::errors::ErrorCode;
use crate::structs::{Ballot, Candidate};
use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, has_one = mint)]
    pub candidate: Account<'info, Candidate>,

    #[account(seeds = [b"treasurer".as_ref(), &candidate.key().to_bytes()], bump)]
    /// CHECK: This is an authority PDA, no further checks needed
    pub treasurer: AccountInfo<'info>,

    pub mint: Box<Account<'info, token::Mint>>,

    #[account(mut, associated_token::mint = mint, associated_token::authority = treasurer)]
    pub candidate_token_account: Account<'info, token::TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        space = Ballot::SIZE,
        seeds = [b"ballot".as_ref(), &candidate.key().to_bytes(), &authority.key().to_bytes()],
        bump
    )]
    pub ballot: Account<'info, Ballot>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub voter_token_account: Account<'info, token::TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec_vote(ctx: Context<Vote>, amount: u64) -> Result<()> {
    let candidate: &mut Account<'_, Candidate> = &mut ctx.accounts.candidate;
    let ballot: &mut Account<'_, Ballot> = &mut ctx.accounts.ballot;

    let now: i64 = Clock::get().unwrap().unix_timestamp;
    if now < candidate.start_date || now > candidate.end_date {
        return err!(ErrorCode::NotActiveCandidate);
    }

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.voter_token_account.to_account_info(),
            to: ctx.accounts.candidate_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );

    token::transfer(transfer_ctx, amount)?;

    candidate.amount += amount;

    ballot.authority = ctx.accounts.authority.key();
    ballot.candidate = candidate.key();
    ballot.amount += amount;

    Ok(())
}
