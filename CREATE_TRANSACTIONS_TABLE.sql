-- Create transactions table to track all payment transactions
create table if not exists public.transactions (
  id uuid not null default gen_random_uuid (),
  order_id uuid null,
  user_id uuid null,
  amount numeric(10, 2) not null,
  payment_status text null default 'pending'::text,
  payment_method text null,
  payment_id text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_order_id_fkey foreign key (order_id) references orders (id) on delete cascade,
  constraint transactions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint transactions_payment_method_check check (
    (
      payment_method = any (
        array[
          'wallet'::text,
          'razorpay'::text,
          'cash'::text,
          'upi'::text,
          'card'::text
        ]
      )
    )
  ),
  constraint transactions_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'completed'::text,
          'failed'::text,
          'refunded'::text
        ]
      )
    )
  )
) tablespace pg_default;

-- Create indexes for better query performance
create index if not exists idx_transactions_user_id on public.transactions using btree (user_id) tablespace pg_default;

create index if not exists idx_transactions_order_id on public.transactions using btree (order_id) tablespace pg_default;

create index if not exists idx_transactions_payment_status on public.transactions using btree (payment_status) tablespace pg_default;

create index if not exists idx_transactions_created_at on public.transactions using btree (created_at desc) tablespace pg_default;

-- Enable RLS (Row Level Security)
alter table public.transactions enable row level security;

-- Allow users to view their own transactions
create policy "Users can view their own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

-- Allow authenticated users to insert transactions (app creates them)
create policy "Authenticated users can create transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

-- Admin can view all transactions
create policy "Admin can view all transactions"
  on public.transactions
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Admin can update transaction status (for refunds, etc.)
create policy "Admin can update transactions"
  on public.transactions
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
