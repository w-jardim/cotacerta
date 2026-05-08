--
-- PostgreSQL database dump
--

\restrict 2kG6ovYTZvzijWLN9tI0M3aeP4eaZqONI1AWZUfWUJlz79TqetGj6AZM9innQ04

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AnnualClosingStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."AnnualClosingStatus" AS ENUM (
    'SIMULATED',
    'CONFIRMED',
    'CANCELED'
);


ALTER TYPE public."AnnualClosingStatus" OWNER TO cotacerta;

--
-- Name: CashGroupStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."CashGroupStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'CLOSED',
    'ARCHIVED'
);


ALTER TYPE public."CashGroupStatus" OWNER TO cotacerta;

--
-- Name: LoanPaymentMethod; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."LoanPaymentMethod" AS ENUM (
    'PIX',
    'CASH',
    'OTHER'
);


ALTER TYPE public."LoanPaymentMethod" OWNER TO cotacerta;

--
-- Name: LoanPaymentStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."LoanPaymentStatus" AS ENUM (
    'CONFIRMED',
    'CANCELED'
);


ALTER TYPE public."LoanPaymentStatus" OWNER TO cotacerta;

--
-- Name: LoanStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."LoanStatus" AS ENUM (
    'OPEN',
    'PARTIAL',
    'PAID',
    'CANCELED'
);


ALTER TYPE public."LoanStatus" OWNER TO cotacerta;

--
-- Name: MemberStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."MemberStatus" AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'INACTIVE'
);


ALTER TYPE public."MemberStatus" OWNER TO cotacerta;

--
-- Name: MonthlyChargeStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."MonthlyChargeStatus" AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'PARTIAL',
    'CANCELED'
);


ALTER TYPE public."MonthlyChargeStatus" OWNER TO cotacerta;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'PIX'
);


ALTER TYPE public."PaymentMethod" OWNER TO cotacerta;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN_PLATFORM',
    'GESTOR_MASTER',
    'COTISTA'
);


ALTER TYPE public."UserRole" OWNER TO cotacerta;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: cotacerta
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'INACTIVE'
);


ALTER TYPE public."UserStatus" OWNER TO cotacerta;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO cotacerta;

--
-- Name: annual_closing_member_results; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.annual_closing_member_results (
    id text NOT NULL,
    closing_id text NOT NULL,
    member_id text NOT NULL,
    quota_quantity integer NOT NULL,
    gross_amount numeric(10,2) NOT NULL,
    quota_debt_amount numeric(10,2) DEFAULT 0 NOT NULL,
    loan_debt_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_debt_amount numeric(10,2) DEFAULT 0 NOT NULL,
    net_amount numeric(10,2) DEFAULT 0 NOT NULL,
    remaining_debt_amount numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.annual_closing_member_results OWNER TO cotacerta;

--
-- Name: annual_closings; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.annual_closings (
    id text NOT NULL,
    group_id text NOT NULL,
    cycle_year integer NOT NULL,
    status public."AnnualClosingStatus" DEFAULT 'SIMULATED'::public."AnnualClosingStatus" NOT NULL,
    total_quota_received numeric(10,2) DEFAULT 0 NOT NULL,
    total_loan_received numeric(10,2) DEFAULT 0 NOT NULL,
    total_available numeric(10,2) DEFAULT 0 NOT NULL,
    total_quota_pending numeric(10,2) DEFAULT 0 NOT NULL,
    total_loan_pending numeric(10,2) DEFAULT 0 NOT NULL,
    total_pending numeric(10,2) DEFAULT 0 NOT NULL,
    total_quotas integer DEFAULT 0 NOT NULL,
    value_per_quota numeric(10,2) DEFAULT 0 NOT NULL,
    confirmed_at timestamp(3) without time zone,
    canceled_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.annual_closings OWNER TO cotacerta;

--
-- Name: cash_groups; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.cash_groups (
    id text NOT NULL,
    owner_user_id text NOT NULL,
    name text NOT NULL,
    description text,
    cycle_year integer NOT NULL,
    quota_value numeric(10,2) NOT NULL,
    due_day integer NOT NULL,
    max_quotas_per_member integer DEFAULT 2 NOT NULL,
    default_loan_interest_rate numeric(5,2) DEFAULT 30.00 NOT NULL,
    status public."CashGroupStatus" DEFAULT 'ACTIVE'::public."CashGroupStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cash_groups OWNER TO cotacerta;

--
-- Name: charge_payments; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.charge_payments (
    id text NOT NULL,
    monthly_charge_id text NOT NULL,
    cash_group_id text NOT NULL,
    member_id text NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    paid_at timestamp(3) without time zone NOT NULL,
    payment_method public."PaymentMethod" DEFAULT 'PIX'::public."PaymentMethod" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.charge_payments OWNER TO cotacerta;

--
-- Name: loan_payments; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.loan_payments (
    id text NOT NULL,
    loan_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public."LoanPaymentMethod" DEFAULT 'PIX'::public."LoanPaymentMethod" NOT NULL,
    status public."LoanPaymentStatus" DEFAULT 'CONFIRMED'::public."LoanPaymentStatus" NOT NULL,
    paid_at timestamp(3) without time zone NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.loan_payments OWNER TO cotacerta;

--
-- Name: loans; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.loans (
    id text NOT NULL,
    cash_group_id text NOT NULL,
    member_id text NOT NULL,
    principal_amount numeric(10,2) NOT NULL,
    interest_rate numeric(5,2) NOT NULL,
    total_due numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0 NOT NULL,
    granted_at timestamp(3) without time zone NOT NULL,
    due_date timestamp(3) without time zone,
    paid_at timestamp(3) without time zone,
    status public."LoanStatus" DEFAULT 'OPEN'::public."LoanStatus" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.loans OWNER TO cotacerta;

--
-- Name: members; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.members (
    id text NOT NULL,
    cash_group_id text NOT NULL,
    name text NOT NULL,
    phone text,
    pix_key text,
    quotas_count integer NOT NULL,
    status public."MemberStatus" DEFAULT 'ACTIVE'::public."MemberStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id text
);


ALTER TABLE public.members OWNER TO cotacerta;

--
-- Name: monthly_charges; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.monthly_charges (
    id text NOT NULL,
    cash_group_id text NOT NULL,
    member_id text NOT NULL,
    reference_month integer NOT NULL,
    reference_year integer NOT NULL,
    quotas_count integer NOT NULL,
    amount_due numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0 NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    paid_at timestamp(3) without time zone,
    status public."MonthlyChargeStatus" DEFAULT 'PENDING'::public."MonthlyChargeStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    base_amount numeric(10,2) NOT NULL
);


ALTER TABLE public.monthly_charges OWNER TO cotacerta;

--
-- Name: payment_receipts; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.payment_receipts (
    id text NOT NULL,
    payment_id text NOT NULL,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes integer NOT NULL,
    data_url text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_receipts OWNER TO cotacerta;

--
-- Name: users; Type: TABLE; Schema: public; Owner: cotacerta
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public."UserRole" DEFAULT 'GESTOR_MASTER'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO cotacerta;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e09b9f89-c9b7-4668-b83e-42e089158758	af407e824fff2004be7d382de4e85d6b55b13a82ddb26f83efc1271663bc42e4	2026-05-04 19:56:50.279331+00	20260504195650_init	\N	\N	2026-05-04 19:56:50.263352+00	1
9e05985e-ef91-4362-959c-a5061efd643a	520098d8ac0b91a9210e8425caf08809d3a00ede716d4876e3568cd1ecbb9890	2026-05-04 21:02:29.831363+00	20260504210229_add_cash_groups	\N	\N	2026-05-04 21:02:29.797142+00	1
8bc2c6d7-8b11-4d09-90d6-71224283e624	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-05-06 12:44:07.856898+00	20260506124356_add_members	\N	\N	2026-05-06 12:44:07.850859+00	1
e8749edb-2453-4b65-aac6-abb17f4afb94	a9641159194ce6396d0a5d89b33d0e1b4cb780e21980f11106342164abcf56cd	2026-05-06 16:42:53.365241+00	20260506152000_add_charge_payments	\N	\N	2026-05-06 16:42:53.249083+00	1
99d2862f-1725-4a09-a5f1-78b17c7763ce	fcb165b17e467f3a2e92d5f515845b507ccd19d101e95e5bde1fc06a60c9dc92	2026-05-06 17:07:04.052378+00	20260506173000_add_monthly_charge_base_amount	\N	\N	2026-05-06 17:07:04.040256+00	1
05cbd843-0dc6-40b7-9346-65361af1424b	6570925f43c6db90ab1a8187b420216b049e44c163773bdabd4f01c40f96da77	2026-05-06 17:34:30.279664+00	20260506193000_add_loans	\N	\N	2026-05-06 17:34:30.236136+00	1
0cbb2469-c7e5-4b08-80c3-a97dc5532e7b	c893023c8c4ca49547d2a3b3ce0331c5475dbe1abb70e03cecb1a6559fb1afc4	2026-05-07 21:02:52.667863+00	20260509180000_add_member_user_link	\N	\N	2026-05-07 21:02:52.629849+00	1
58bad724-a961-4366-8a06-410ca6c51f7e	07244d47f5fc5203936af292004e60dbc8a0c74afbe54f0ea428449ffc73ffd6	2026-05-07 21:47:26.386539+00	20260510000000_add_annual_closing	\N	\N	2026-05-07 21:47:26.307861+00	1
\.


--
-- Data for Name: annual_closing_member_results; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.annual_closing_member_results (id, closing_id, member_id, quota_quantity, gross_amount, quota_debt_amount, loan_debt_amount, total_debt_amount, net_amount, remaining_debt_amount, created_at) FROM stdin;
cmow0po8u0003qm0i5osgm23a	cmow0po8u0001qm0ijksofgo7	cmouca77f0002mp0iggc7ijw9	1	130.00	0.00	159.90	159.90	0.00	29.90	2026-05-07 21:48:21.63
\.


--
-- Data for Name: annual_closings; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.annual_closings (id, group_id, cycle_year, status, total_quota_received, total_loan_received, total_available, total_quota_pending, total_loan_pending, total_pending, total_quotas, value_per_quota, confirmed_at, canceled_at, created_at, updated_at) FROM stdin;
cmow0po8u0001qm0ijksofgo7	cmouca6840000mp0iwiu7rvt2	2026	CONFIRMED	0.00	130.00	130.00	0.00	159.90	159.90	1	130.00	2026-05-07 21:48:23.001	\N	2026-05-07 21:48:21.63	2026-05-07 21:48:23.002
\.


--
-- Data for Name: cash_groups; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.cash_groups (id, owner_user_id, name, description, cycle_year, quota_value, due_day, max_quotas_per_member, default_loan_interest_rate, status, created_at, updated_at) FROM stdin;
cmorp8jcx0001n30iznc616ym	cmorogfs50001o20ie0c7prfk	2026	2026	2026	100.00	10	1	30.00	ACTIVE	2026-05-04 21:16:01.665	2026-05-04 21:16:01.665
cmorp8dhc0000n30iq9u892bt	cmorogfs50001o20ie0c7prfk	Caixinha Teste 2026	Primeira caixinha de teste	2026	100.00	10	2	30.00	ACTIVE	2026-05-04 21:15:54.049	2026-05-04 21:16:18.777
cmou24rhz0000p90is55io64l	cmorogfs50001o20ie0c7prfk	teste0002	teste	2026	200.00	10	2	30.00	ACTIVE	2026-05-06 12:52:32.951	2026-05-06 12:52:32.951
cmou2mqcv0001p90ii9ufa6pz	cmou2mkg40000p90ioo3pnjbk	Caixinha Teste	Para testar members	2026	100.00	10	3	30.00	ACTIVE	2026-05-06 13:06:31.279	2026-05-06 13:06:31.279
cmou91gam0008qq0izc3qneeh	cmorogfs50001o20ie0c7prfk	teste 2026		2026	100.00	5	3	30.00	ACTIVE	2026-05-06 16:05:55.774	2026-05-06 16:12:33.711
cmouafcjn0000p90ioa5w8udx	cmorogfs50001o20ie0c7prfk	Teste Pagamentos 	Fluxo automatizado da fase 6	2026	100.00	10	2	30.00	ACTIVE	2026-05-06 16:44:43.715	2026-05-06 16:44:43.715
cmouage9t0001p90ikn2r253d	cmorogfs50001o20ie0c7prfk	Teste Pagamentos 1778085932	Fluxo automatizado da fase 6	2026	100.00	10	2	30.00	ACTIVE	2026-05-06 16:45:32.609	2026-05-06 16:45:32.609
cmouba3je0000n80htd16s3ur	cmorogfs50001o20ie0c7prfk	Teste Atraso 1778087318	Valida vencimento e juros	2026	100.00	10	2	30.00	ACTIVE	2026-05-06 17:08:38.378	2026-05-06 17:08:38.378
cmouca6840000mp0iwiu7rvt2	cmorogfs50001o20ie0c7prfk	Teste Emprestimos Fase 7	Grupo para validar modulo de emprestimos	2026	100.00	10	2	30.00	ARCHIVED	2026-05-06 17:36:41.476	2026-05-06 18:20:07.127
\.


--
-- Data for Name: charge_payments; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.charge_payments (id, monthly_charge_id, cash_group_id, member_id, amount_paid, paid_at, payment_method, created_at, updated_at) FROM stdin;
cmouagehb0007p90i9tpzkfzo	cmouageef0005p90i61im5tu2	cmouage9t0001p90ikn2r253d	cmouageby0003p90i33grkgl2	40.00	2026-05-06 12:00:00	PIX	2026-05-06 16:45:32.88	2026-05-06 16:45:32.88
\.


--
-- Data for Name: loan_payments; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.loan_payments (id, loan_id, amount, method, status, paid_at, notes, created_at, updated_at) FROM stdin;
cmouca7b80006mp0ilalq1mjo	cmouca79c0004mp0ir4ewf5xz	50.00	PIX	CONFIRMED	2026-05-10 10:00:00	Pagamento parcial teste	2026-05-06 17:36:42.884	2026-05-06 17:36:42.884
cmouca7j00008mp0iq04lnio8	cmouca79c0004mp0ir4ewf5xz	80.00	PIX	CONFIRMED	2026-05-15 10:00:00	Quitacao teste	2026-05-06 17:36:43.164	2026-05-06 17:36:43.164
cmoucuvs4000gmp0i5b5buy8o	cmoucmu18000emp0ip32xpfnl	60.00	PIX	CONFIRMED	2026-05-06 15:00:00	\N	2026-05-06 17:52:47.716	2026-05-06 17:52:47.716
\.


--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.loans (id, cash_group_id, member_id, principal_amount, interest_rate, total_due, amount_paid, granted_at, due_date, paid_at, status, notes, created_at, updated_at) FROM stdin;
cmouca79c0004mp0ir4ewf5xz	cmouca6840000mp0iwiu7rvt2	cmouca77f0002mp0iggc7ijw9	100.00	30.00	130.00	130.00	2026-05-06 10:00:00	2026-06-06 10:00:00	2026-05-10 10:00:00	PAID	Emprestimo teste principal	2026-05-06 17:36:42.816	2026-05-06 17:36:43.17
cmouca7lv000amp0ijl2mr1z2	cmouca6840000mp0iwiu7rvt2	cmouca77f0002mp0iggc7ijw9	200.00	30.00	260.00	0.00	2026-05-07 10:00:00	\N	\N	CANCELED	Emprestimo para cancelamento	2026-05-06 17:36:43.267	2026-05-06 17:36:43.339
cmouceejh000cmp0idxmtl3hl	cmorp8dhc0000n30iq9u892bt	cmou8tofv0001qq0ioax8j2fo	150.00	30.00	195.00	0.00	2026-05-06 15:00:00	2026-12-10 15:00:00	\N	OPEN	\N	2026-05-06 17:39:58.877	2026-05-06 17:39:58.877
cmoud350f0001qk0i1pgh67jl	cmou24rhz0000p90is55io64l	cmou5btgm0001q90ieqed05ev	300.00	30.00	390.00	0.00	2026-05-06 15:00:00	2026-12-31 12:00:00	\N	OPEN	\N	2026-05-06 17:59:12.927	2026-05-06 17:59:12.927
cmoucmu18000emp0ip32xpfnl	cmou24rhz0000p90is55io64l	cmou5btgm0001q90ieqed05ev	200.00	30.00	260.00	60.00	2026-05-06 15:00:00	2026-06-06 15:00:00	\N	CANCELED	\N	2026-05-06 17:46:32.204	2026-05-06 17:59:23.48
cmouduid30003qk0i8wyxrbcq	cmouca6840000mp0iwiu7rvt2	cmouca77f0002mp0iggc7ijw9	123.00	30.00	159.90	0.00	2026-05-06 15:00:00	2026-12-31 12:00:00	\N	OPEN	\N	2026-05-06 18:20:29.943	2026-05-06 18:20:29.943
cmovzp7to0005ph0ie3h0zyfy	cmorp8jcx0001n30iznc616ym	cmou5cqs00003q90itbvogyr1	200.00	30.00	260.00	0.00	2026-05-07 15:00:00	2026-12-31 12:00:00	\N	OPEN	empréstimo deve ser quitado ate um dia antes do fechamento do ano ou o valor a receber será retido para quitar a divida e o devedor só recebe a diferença 	2026-05-07 21:20:00.731	2026-05-07 21:20:00.731
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.members (id, cash_group_id, name, phone, pix_key, quotas_count, status, created_at, updated_at, user_id) FROM stdin;
cmou2n3o90003p90ien5dt5ga	cmou2mqcv0001p90ii9ufa6pz	João Silva	11999999999	joao@email.com	2	ACTIVE	2026-05-06 13:06:48.538	2026-05-06 13:06:48.538	\N
cmou2neog0005p90ivi6l0x4t	cmou2mqcv0001p90ii9ufa6pz	Maria Santos	11988888888	maria@pix.com	1	ACTIVE	2026-05-06 13:07:02.8	2026-05-06 13:07:02.8	\N
cmou2q66t0007p90ie72i2uuy	cmou24rhz0000p90is55io64l	wallace jardim	21966119069	08851571710	1	ACTIVE	2026-05-06 13:09:11.765	2026-05-06 13:09:11.765	\N
cmou2ynvm0001p90isfkzy5l8	cmou2mqcv0001p90ii9ufa6pz	Teste Validação	12345678901234567890	teste@pix.com	1	ACTIVE	2026-05-06 13:15:47.938	2026-05-06 13:15:47.938	\N
cmou2yomy0003p90ih6qz22e3	cmou2mqcv0001p90ii9ufa6pz	Teste OK	11999887766	ok@pix.com	1	ACTIVE	2026-05-06 13:15:48.922	2026-05-06 13:15:48.922	\N
cmou2zqet0001nw0ircx7f37k	cmou2mqcv0001p90ii9ufa6pz	Teste 15 chars	(11)98765-4321	15chars@pix.com	1	ACTIVE	2026-05-06 13:16:37.877	2026-05-06 13:16:37.877	\N
cmou5btgm0001q90ieqed05ev	cmou24rhz0000p90is55io64l	glauber cachaça	111111111111111	teste@teste.com	1	ACTIVE	2026-05-06 14:22:00.931	2026-05-06 14:22:00.931	\N
cmou8tofv0001qq0ioax8j2fo	cmorp8dhc0000n30iq9u892bt	pagliacci	212465654654	323213546465354	2	ACTIVE	2026-05-06 15:59:53.083	2026-05-06 15:59:53.083	\N
cmou8umbv0003qq0ic05vmn47	cmorp8dhc0000n30iq9u892bt	tiago	32132132135654	16546546879	2	BLOCKED	2026-05-06 16:00:37.003	2026-05-06 16:01:27.405	\N
cmou92o4m000aqq0i66u6jgiw	cmou91gam0008qq0izc3qneeh	pedro	218787984	65465651689879	1	ACTIVE	2026-05-06 16:06:52.583	2026-05-06 16:06:52.583	\N
cmou92ywc000cqq0izbotjrt4	cmou91gam0008qq0izc3qneeh	lucas	321654654651	35656565	2	ACTIVE	2026-05-06 16:07:06.54	2026-05-06 16:07:06.54	\N
cmou93b29000eqq0ijzq7hzwq	cmou91gam0008qq0izc3qneeh	carlos	32165465651	654651654984651	3	ACTIVE	2026-05-06 16:07:22.305	2026-05-06 16:07:22.305	\N
cmouageby0003p90i33grkgl2	cmouage9t0001p90ikn2r253d	Cotista Teste Pix	11999990000	cotista.teste@example.com	1	ACTIVE	2026-05-06 16:45:32.687	2026-05-06 16:45:32.687	\N
cmouba3lz0002n80hn866t3xg	cmouba3je0000n80htd16s3ur	Cotista Vencido	11999990001	vencido@example.com	1	ACTIVE	2026-05-06 17:08:38.471	2026-05-06 17:08:38.471	\N
cmouca77f0002mp0iggc7ijw9	cmouca6840000mp0iwiu7rvt2	Cotista Emprestimo	11999999999	cotista-emprestimo@example.com	1	ACTIVE	2026-05-06 17:36:42.747	2026-05-07 21:07:45.742	cmovz9gp30000ph0idelvv07k
cmou5cqs00003q90itbvogyr1	cmorp8jcx0001n30iznc616ym	binho bahia	210000000000000	teste@teste.com	1	ACTIVE	2026-05-06 14:22:44.113	2026-05-07 21:11:51.383	cmovzeq8j0001ph0iwpin1gkf
\.


--
-- Data for Name: monthly_charges; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.monthly_charges (id, cash_group_id, member_id, reference_month, reference_year, quotas_count, amount_due, amount_paid, due_date, paid_at, status, created_at, updated_at, base_amount) FROM stdin;
cmou6hdx80003mk0ib271xzh4	cmou24rhz0000p90is55io64l	cmou5btgm0001q90ieqed05ev	5	2026	1	200.00	200.00	2026-05-10 00:00:00	2026-05-06 16:03:21.826	PAID	2026-05-06 14:54:20.348	2026-05-06 16:03:21.827	200.00
cmou6hdx10001mk0iu0812qi3	cmou24rhz0000p90is55io64l	cmou2q66t0007p90ie72i2uuy	5	2026	1	200.00	200.00	2026-05-10 00:00:00	2026-05-06 16:03:38.247	PAID	2026-05-06 14:54:20.342	2026-05-06 16:03:38.248	200.00
cmou8z0kj0005qq0iajt2a9t9	cmou24rhz0000p90is55io64l	cmou2q66t0007p90ie72i2uuy	6	2026	1	200.00	0.00	2026-06-10 00:00:00	\N	PENDING	2026-05-06 16:04:02.083	2026-05-06 16:04:02.083	200.00
cmou8z0kw0007qq0ih67zqju2	cmou24rhz0000p90is55io64l	cmou5btgm0001q90ieqed05ev	6	2026	1	200.00	0.00	2026-06-10 00:00:00	\N	PENDING	2026-05-06 16:04:02.097	2026-05-06 16:04:02.097	200.00
cmou93m6o000kqq0i5jrge11g	cmou91gam0008qq0izc3qneeh	cmou93b29000eqq0ijzq7hzwq	4	2026	3	300.00	300.00	2026-04-05 00:00:00	2026-05-06 16:07:56.766	PAID	2026-05-06 16:07:36.721	2026-05-06 16:07:56.768	300.00
cmouageef0005p90i61im5tu2	cmouage9t0001p90ikn2r253d	cmouageby0003p90i33grkgl2	5	2026	1	100.00	40.00	2026-05-10 00:00:00	2026-05-06 12:00:00	PARTIAL	2026-05-06 16:45:32.775	2026-05-06 16:45:32.893	100.00
cmou93m6k000iqq0ibhl1eenw	cmou91gam0008qq0izc3qneeh	cmou92ywc000cqq0izbotjrt4	4	2026	2	320.00	0.00	2026-04-05 00:00:00	\N	OVERDUE	2026-05-06 16:07:36.716	2026-05-06 17:14:48.106	200.00
cmou93m6d000gqq0idn0u5v5m	cmou91gam0008qq0izc3qneeh	cmou92o4m000aqq0i66u6jgiw	4	2026	1	160.00	0.00	2026-04-05 00:00:00	\N	OVERDUE	2026-05-06 16:07:36.709	2026-05-06 17:14:48.107	100.00
cmouba3mu0004n80hde2eptyy	cmouba3je0000n80htd16s3ur	cmouba3lz0002n80hn866t3xg	4	2026	1	160.00	0.00	2026-04-10 12:00:00	\N	OVERDUE	2026-05-06 17:08:38.502	2026-05-06 17:24:06.285	100.00
cmoubwie40001r20iaj2azpua	cmou91gam0008qq0izc3qneeh	cmou92o4m000aqq0i66u6jgiw	5	2026	1	130.00	0.00	2026-05-05 12:00:00	\N	OVERDUE	2026-05-06 17:26:04.06	2026-05-06 17:26:04.125	100.00
cmoubwied0003r20i6e1hvrxs	cmou91gam0008qq0izc3qneeh	cmou92ywc000cqq0izbotjrt4	5	2026	2	260.00	0.00	2026-05-05 12:00:00	\N	OVERDUE	2026-05-06 17:26:04.069	2026-05-06 17:26:04.126	200.00
cmoubwiei0005r20i5yeku0wk	cmou91gam0008qq0izc3qneeh	cmou93b29000eqq0ijzq7hzwq	5	2026	3	390.00	0.00	2026-05-05 12:00:00	\N	OVERDUE	2026-05-06 17:26:04.074	2026-05-06 17:26:04.125	300.00
cmoubxl6l0007r20i1j7zcwrp	cmou91gam0008qq0izc3qneeh	cmou92o4m000aqq0i66u6jgiw	6	2026	1	100.00	0.00	2026-06-05 12:00:00	\N	PENDING	2026-05-06 17:26:54.333	2026-05-06 17:26:54.333	100.00
cmoubxl6r0009r20itl3hzzs7	cmou91gam0008qq0izc3qneeh	cmou92ywc000cqq0izbotjrt4	6	2026	2	200.00	0.00	2026-06-05 12:00:00	\N	PENDING	2026-05-06 17:26:54.339	2026-05-06 17:26:54.339	200.00
cmoubxl71000br20iz2xoa3d7	cmou91gam0008qq0izc3qneeh	cmou93b29000eqq0ijzq7hzwq	6	2026	3	300.00	0.00	2026-06-05 12:00:00	\N	PENDING	2026-05-06 17:26:54.349	2026-05-06 17:26:54.349	300.00
cmovzjrbr0003ph0is62aatax	cmorp8jcx0001n30iznc616ym	cmou5cqs00003q90itbvogyr1	5	2026	1	100.00	0.00	2026-05-10 12:00:00	\N	PENDING	2026-05-07 21:15:46.071	2026-05-07 21:15:46.071	100.00
\.


--
-- Data for Name: payment_receipts; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.payment_receipts (id, payment_id, file_name, mime_type, size_bytes, data_url, created_at) FROM stdin;
cmouagehb0008p90iryscwdtc	cmouagehb0007p90i9tpzkfzo	comprovante.png	image/png	128	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0l7sAAAAASUVORK5CYII=	2026-05-06 16:45:32.88
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cotacerta
--

COPY public.users (id, name, email, password_hash, role, status, created_at, updated_at) FROM stdin;
cmormne230000o20i180kkf26	Teste Gestor	gestor@cotacerta.com	$2b$10$zjJFKmk0TxGB4zXHy.kKJ.6HbxZJba4DKAP.7rnBMAc2SO9oe.802	GESTOR_MASTER	ACTIVE	2026-05-04 20:03:35.788	2026-05-04 20:03:35.788
cmorogfs50001o20ie0c7prfk	Admin CotaCerta	admin@cotacerta.com	$2b$10$0h71GMZXGcR9FaLRGCLzCuRcN7QtcQJwrf9NN7nheoNeh49wX5rc.	GESTOR_MASTER	ACTIVE	2026-05-04 20:54:10.66	2026-05-04 20:54:10.66
cmou2mkg40000p90ioo3pnjbk	Teste User	teste@teste.com	$2b$10$VKzxu1IVdsoZraeEHjF48OJ758ZQPo.jhd8GnVujYuCd6UzGk9nbS	GESTOR_MASTER	ACTIVE	2026-05-06 13:06:23.62	2026-05-06 13:06:23.62
cmouagpm10009p90ilazuvov7	Teste Bloqueio	fase6-bloqueio-1778085947@example.com	$2b$10$1mDRopaAhcnaVRQ3HYosc.HQrfhlmRdd2Fs3t4Gr.MvHlmVg/O1jy	GESTOR_MASTER	ACTIVE	2026-05-06 16:45:47.306	2026-05-06 16:45:47.306
cmovz9gp30000ph0idelvv07k	Cotista Emprestimo	cotista.teste@example.com	$2b$10$3LSsEVJuHPRUbtwf38JfYOPknqy.lfxDVfydJV9hOxdAUCdEJnIbW	COTISTA	ACTIVE	2026-05-07 21:07:45.735	2026-05-07 21:09:49.175
cmovzeq8j0001ph0iwpin1gkf	binho bahia	binho@cotacerta.com	$2b$10$T3vIh0srRv4xAgluqhzhfe2xhYbrNz6.bLcuaDMPIABeui6ewmSwS	COTISTA	ACTIVE	2026-05-07 21:11:51.38	2026-05-07 21:11:51.38
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: annual_closing_member_results annual_closing_member_results_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.annual_closing_member_results
    ADD CONSTRAINT annual_closing_member_results_pkey PRIMARY KEY (id);


--
-- Name: annual_closings annual_closings_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.annual_closings
    ADD CONSTRAINT annual_closings_pkey PRIMARY KEY (id);


--
-- Name: cash_groups cash_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.cash_groups
    ADD CONSTRAINT cash_groups_pkey PRIMARY KEY (id);


--
-- Name: charge_payments charge_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.charge_payments
    ADD CONSTRAINT charge_payments_pkey PRIMARY KEY (id);


--
-- Name: loan_payments loan_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.loan_payments
    ADD CONSTRAINT loan_payments_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: members members_user_id_key; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_key UNIQUE (user_id);


--
-- Name: monthly_charges monthly_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.monthly_charges
    ADD CONSTRAINT monthly_charges_pkey PRIMARY KEY (id);


--
-- Name: payment_receipts payment_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: annual_closing_member_results_closing_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX annual_closing_member_results_closing_id_idx ON public.annual_closing_member_results USING btree (closing_id);


--
-- Name: annual_closing_member_results_member_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX annual_closing_member_results_member_id_idx ON public.annual_closing_member_results USING btree (member_id);


--
-- Name: annual_closings_group_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX annual_closings_group_id_idx ON public.annual_closings USING btree (group_id);


--
-- Name: cash_groups_owner_user_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX cash_groups_owner_user_id_idx ON public.cash_groups USING btree (owner_user_id);


--
-- Name: charge_payments_cash_group_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX charge_payments_cash_group_id_idx ON public.charge_payments USING btree (cash_group_id);


--
-- Name: charge_payments_member_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX charge_payments_member_id_idx ON public.charge_payments USING btree (member_id);


--
-- Name: charge_payments_monthly_charge_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX charge_payments_monthly_charge_id_idx ON public.charge_payments USING btree (monthly_charge_id);


--
-- Name: charge_payments_paid_at_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX charge_payments_paid_at_idx ON public.charge_payments USING btree (paid_at);


--
-- Name: loan_payments_loan_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX loan_payments_loan_id_idx ON public.loan_payments USING btree (loan_id);


--
-- Name: loan_payments_paid_at_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX loan_payments_paid_at_idx ON public.loan_payments USING btree (paid_at);


--
-- Name: loans_cash_group_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX loans_cash_group_id_idx ON public.loans USING btree (cash_group_id);


--
-- Name: loans_member_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX loans_member_id_idx ON public.loans USING btree (member_id);


--
-- Name: members_cash_group_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX members_cash_group_id_idx ON public.members USING btree (cash_group_id);


--
-- Name: monthly_charges_cash_group_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX monthly_charges_cash_group_id_idx ON public.monthly_charges USING btree (cash_group_id);


--
-- Name: monthly_charges_cash_group_id_member_id_reference_month_re_key; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE UNIQUE INDEX monthly_charges_cash_group_id_member_id_reference_month_re_key ON public.monthly_charges USING btree (cash_group_id, member_id, reference_month, reference_year);


--
-- Name: monthly_charges_cash_group_id_member_id_reference_month_referen; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE UNIQUE INDEX monthly_charges_cash_group_id_member_id_reference_month_referen ON public.monthly_charges USING btree (cash_group_id, member_id, reference_month, reference_year);


--
-- Name: monthly_charges_member_id_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX monthly_charges_member_id_idx ON public.monthly_charges USING btree (member_id);


--
-- Name: monthly_charges_reference_month_reference_year_idx; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE INDEX monthly_charges_reference_month_reference_year_idx ON public.monthly_charges USING btree (reference_month, reference_year);


--
-- Name: payment_receipts_payment_id_key; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE UNIQUE INDEX payment_receipts_payment_id_key ON public.payment_receipts USING btree (payment_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: cotacerta
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: annual_closing_member_results annual_closing_member_results_closing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.annual_closing_member_results
    ADD CONSTRAINT annual_closing_member_results_closing_id_fkey FOREIGN KEY (closing_id) REFERENCES public.annual_closings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: annual_closing_member_results annual_closing_member_results_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.annual_closing_member_results
    ADD CONSTRAINT annual_closing_member_results_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: annual_closings annual_closings_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.annual_closings
    ADD CONSTRAINT annual_closings_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.cash_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cash_groups cash_groups_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.cash_groups
    ADD CONSTRAINT cash_groups_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: charge_payments charge_payments_cash_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.charge_payments
    ADD CONSTRAINT charge_payments_cash_group_id_fkey FOREIGN KEY (cash_group_id) REFERENCES public.cash_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: charge_payments charge_payments_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.charge_payments
    ADD CONSTRAINT charge_payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: charge_payments charge_payments_monthly_charge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.charge_payments
    ADD CONSTRAINT charge_payments_monthly_charge_id_fkey FOREIGN KEY (monthly_charge_id) REFERENCES public.monthly_charges(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: loan_payments loan_payments_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.loan_payments
    ADD CONSTRAINT loan_payments_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: loans loans_cash_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_cash_group_id_fkey FOREIGN KEY (cash_group_id) REFERENCES public.cash_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: loans loans_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: members members_cash_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_cash_group_id_fkey FOREIGN KEY (cash_group_id) REFERENCES public.cash_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: members members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: monthly_charges monthly_charges_cash_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.monthly_charges
    ADD CONSTRAINT monthly_charges_cash_group_id_fkey FOREIGN KEY (cash_group_id) REFERENCES public.cash_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: monthly_charges monthly_charges_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.monthly_charges
    ADD CONSTRAINT monthly_charges_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_receipts payment_receipts_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cotacerta
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.charge_payments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 2kG6ovYTZvzijWLN9tI0M3aeP4eaZqONI1AWZUfWUJlz79TqetGj6AZM9innQ04

