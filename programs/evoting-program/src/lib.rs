use anchor_lang::prelude::*;

declare_id!("8FRU7VFhWedVur3jnDeNUVf1pLgaZY7ykH1UxMrYSVEe");

pub mod errors;
pub mod instructions;
pub mod structs;

pub use instructions::*;

#[program]
pub mod evoting_program {

    use super::*;

    pub fn initialize_program(
        ctx: Context<Initalize>,
        start_date: i64,
        end_date: i64,
    ) -> Result<()> {
        initalize::exec(ctx, start_date, end_date)
    }

    pub fn vote(ctx: Context<Vote>, amount: u64) -> Result<()> {
        vote::exec(ctx, amount)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::exec(ctx)
    }
}
