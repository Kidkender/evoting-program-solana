use anchor_lang::prelude::*;

declare_id!("8FRU7VFhWedVur3jnDeNUVf1pLgaZY7ykH1UxMrYSVEe");

pub mod instructions;
pub mod structs;

#[program]
pub mod evoting_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
