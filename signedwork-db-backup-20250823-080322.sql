--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    admin_id character varying NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.certifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    name text NOT NULL,
    issuing_organization text NOT NULL,
    issue_date text NOT NULL,
    expiration_date text,
    credential_id text,
    credential_url text,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.certifications OWNER TO neondb_owner;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    registration_type text,
    registration_number text,
    industry text NOT NULL,
    email text NOT NULL,
    size text NOT NULL,
    establishment_year integer NOT NULL,
    password text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    email_verified boolean DEFAULT false,
    verification_status text DEFAULT 'unverified'::text,
    verification_method text,
    verification_date timestamp without time zone,
    verification_notes text,
    verification_documents text[] DEFAULT '{}'::text[],
    rejection_reason text,
    cin text,
    cin_verification_status text DEFAULT 'pending'::text,
    cin_verified_at timestamp without time zone,
    cin_verified_by character varying,
    is_basic_details_locked boolean DEFAULT false,
    pan_number text,
    pan_verification_status text DEFAULT 'pending'::text,
    pan_verified_at timestamp without time zone,
    pan_verified_by character varying
);


ALTER TABLE public.companies OWNER TO neondb_owner;

--
-- Name: company_employees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_employees (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    employee_id character varying NOT NULL,
    "position" text,
    department text,
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone,
    status character varying(20) DEFAULT 'employed'::character varying NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.company_employees OWNER TO neondb_owner;

--
-- Name: company_invitation_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_invitation_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    code character varying(8) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_by_employee_id character varying,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.company_invitation_codes OWNER TO neondb_owner;

--
-- Name: educations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.educations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    institution text NOT NULL,
    degree text NOT NULL,
    field_of_study text,
    start_year integer NOT NULL,
    end_year integer,
    grade text,
    activities text,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    category text
);


ALTER TABLE public.educations OWNER TO neondb_owner;

--
-- Name: email_change_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_change_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    old_email text NOT NULL,
    new_email text NOT NULL,
    change_type text NOT NULL,
    ip_address text,
    user_agent text,
    two_factor_used boolean DEFAULT false,
    verification_token text,
    status text DEFAULT 'pending'::text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_change_logs OWNER TO neondb_owner;

--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_verifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    otp_code character varying(6) NOT NULL,
    purpose character varying(20) NOT NULL,
    user_type character varying(10) NOT NULL,
    user_id character varying,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.email_verifications OWNER TO neondb_owner;

--
-- Name: emails; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.emails (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    email text NOT NULL,
    status text NOT NULL,
    verification_token text,
    verification_expires_at timestamp without time zone,
    verified_at timestamp without time zone,
    detached_at timestamp without time zone,
    grace_expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.emails OWNER TO neondb_owner;

--
-- Name: employee_companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employee_companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    company_name text NOT NULL,
    "position" text,
    start_date text,
    end_date text,
    is_current boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_companies OWNER TO neondb_owner;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employees (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    country_code text DEFAULT '+1'::text NOT NULL,
    password text NOT NULL,
    profile_photo text,
    headline text,
    summary text,
    location text,
    website text,
    current_position text,
    current_company text,
    industry text,
    experience_level text,
    salary_expectation text,
    availability_status text DEFAULT 'open'::text,
    notice_period text,
    preferred_work_type text,
    skills text[],
    languages text[],
    specializations text[],
    address text,
    city text,
    state text,
    zip_code text,
    country text,
    date_of_birth text,
    nationality text,
    marital_status text,
    hobbies text[],
    certifications text[],
    achievements text[],
    portfolio_url text,
    github_url text,
    linkedin_url text,
    twitter_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    email_verified boolean DEFAULT false,
    gender text
);


ALTER TABLE public.employees OWNER TO neondb_owner;

--
-- Name: endorsements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.endorsements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    endorser_name text NOT NULL,
    endorser_position text,
    endorser_company text,
    relationship text NOT NULL,
    endorsement_text text NOT NULL,
    endorsement_date text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.endorsements OWNER TO neondb_owner;

--
-- Name: experiences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.experiences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    title text NOT NULL,
    company text NOT NULL,
    location text,
    start_date text NOT NULL,
    end_date text,
    is_current boolean DEFAULT false,
    description text,
    achievements text[],
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.experiences OWNER TO neondb_owner;

--
-- Name: job_alerts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.job_alerts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    alert_name text NOT NULL,
    keywords text[] DEFAULT '{}'::text[],
    locations text[] DEFAULT '{}'::text[],
    employment_types text[] DEFAULT '{}'::text[],
    experience_levels text[] DEFAULT '{}'::text[],
    salary_min integer,
    industries text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    frequency text DEFAULT 'daily'::text,
    last_sent timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_alerts OWNER TO neondb_owner;

--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.job_applications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    employee_id character varying NOT NULL,
    status text DEFAULT 'applied'::text NOT NULL,
    cover_letter text,
    resume_url text,
    attachment_url text,
    attachment_name text,
    include_profile boolean DEFAULT true,
    include_work_diary boolean DEFAULT true,
    applied_at timestamp without time zone DEFAULT now(),
    status_updated_at timestamp without time zone DEFAULT now(),
    company_notes text,
    interview_notes text,
    salary_expectation text,
    rejection_reason text
);


ALTER TABLE public.job_applications OWNER TO neondb_owner;

--
-- Name: job_listings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.job_listings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    requirements text NOT NULL,
    location text NOT NULL,
    remote_type text DEFAULT 'office'::text NOT NULL,
    employment_type text NOT NULL,
    experience_level text NOT NULL,
    salary_range text,
    benefits text[] DEFAULT '{}'::text[],
    skills text[] DEFAULT '{}'::text[],
    application_deadline timestamp without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    views integer DEFAULT 0,
    applications_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_listings OWNER TO neondb_owner;

--
-- Name: login_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.login_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_type character varying(10) NOT NULL,
    user_id character varying NOT NULL,
    session_id character varying NOT NULL,
    login_at timestamp without time zone DEFAULT now(),
    logout_at timestamp without time zone,
    ip_address text,
    user_agent text,
    browser_info text,
    device_type text,
    location text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.login_sessions OWNER TO neondb_owner;

--
-- Name: pending_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pending_users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    hashed_password text NOT NULL,
    user_type text NOT NULL,
    user_data jsonb NOT NULL,
    verification_token character varying NOT NULL,
    token_expiry timestamp without time zone NOT NULL,
    resend_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pending_users OWNER TO neondb_owner;

--
-- Name: profile_views; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.profile_views (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    viewer_company_id character varying NOT NULL,
    viewed_employee_id character varying NOT NULL,
    viewed_at timestamp without time zone DEFAULT now(),
    view_context character varying
);


ALTER TABLE public.profile_views OWNER TO neondb_owner;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    start_date text NOT NULL,
    end_date text,
    project_url text,
    repository_url text,
    technologies text[],
    team_size integer,
    role text,
    achievements text[],
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: saved_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saved_jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_id character varying NOT NULL,
    employee_id character varying NOT NULL,
    saved_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saved_jobs OWNER TO neondb_owner;

--
-- Name: skill_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.skill_analytics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    skill_id character varying,
    event_type character varying NOT NULL,
    context jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.skill_analytics OWNER TO neondb_owner;

--
-- Name: skill_trends; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.skill_trends (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    skill_id character varying NOT NULL,
    job_count_7d integer DEFAULT 0,
    job_count_30d integer DEFAULT 0,
    job_count_total integer DEFAULT 0,
    growth_pct numeric(5,2) DEFAULT 0,
    click_thru_rate numeric(5,4) DEFAULT 0,
    apply_rate_from_skill numeric(5,4) DEFAULT 0,
    trending_score numeric(5,4) DEFAULT 0,
    region character varying,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.skill_trends OWNER TO neondb_owner;

--
-- Name: skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.skills (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    category character varying NOT NULL,
    aliases text[] DEFAULT '{}'::text[],
    related_skill_ids text[] DEFAULT '{}'::text[],
    is_technical boolean DEFAULT true,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.skills OWNER TO neondb_owner;

--
-- Name: user_feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_feedback (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_type character varying(10) NOT NULL,
    user_id character varying,
    user_email text,
    user_name text,
    feedback_type character varying(20) NOT NULL,
    category character varying(30) NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority character varying(10) DEFAULT 'medium'::character varying,
    status character varying(15) DEFAULT 'new'::character varying,
    browser_info text,
    page_url text,
    attachments text[] DEFAULT '{}'::text[],
    admin_notes text,
    admin_response text,
    responded_at timestamp without time zone,
    responded_by character varying,
    rating integer,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_feedback OWNER TO neondb_owner;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO neondb_owner;

--
-- Name: user_skill_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_skill_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    skill_id character varying NOT NULL,
    is_pinned boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_skill_preferences OWNER TO neondb_owner;

--
-- Name: work_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.work_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    company_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    start_date text NOT NULL,
    end_date text,
    priority text DEFAULT 'medium'::text NOT NULL,
    hours integer,
    estimated_hours integer,
    actual_hours integer,
    status text DEFAULT 'pending'::text NOT NULL,
    work_type text DEFAULT 'task'::text NOT NULL,
    category text,
    project text,
    client text,
    billable boolean DEFAULT false,
    billable_rate integer,
    tags text[] DEFAULT '{}'::text[],
    achievements text[] DEFAULT '{}'::text[],
    challenges text,
    learnings text,
    company_feedback text,
    company_rating integer,
    attachments text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    approval_status text DEFAULT 'pending_review'::text NOT NULL
);


ALTER TABLE public.work_entries OWNER TO neondb_owner;

--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, admin_id, username, email, password, role, permissions, is_active, last_login, created_at, updated_at) FROM stdin;
1e38866c-093f-46cf-855c-d314d7e1bcec	ADM-LIM432	may_nevil1	nevilpatel2001@gmail.com	$2b$10$yo8y.pb8g7yAIJxhTGVGTeAPGcw3Xr0xEbpI4r1m0ha/OIxu0ZXFu	super_admin	{}	t	2025-08-21 11:10:10.648	2025-08-14 10:57:45.136083	2025-08-14 10:57:45.136083
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.certifications (id, employee_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url, description, created_at) FROM stdin;
982a191d-80f5-4165-9770-8f10413fae82	12d27bda-863f-4fd0-8d35-aba23a6139e9	AWS	AWS	2025-01-01		123456789			2025-08-06 10:46:58.427744
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.companies (id, company_id, name, description, address, city, state, pincode, registration_type, registration_number, industry, email, size, establishment_year, password, is_active, created_at, updated_at, email_verified, verification_status, verification_method, verification_date, verification_notes, verification_documents, rejection_reason, cin, cin_verification_status, cin_verified_at, cin_verified_by, is_basic_details_locked, pan_number, pan_verification_status, pan_verified_at, pan_verified_by) FROM stdin;
8f392d4a-2259-44f6-b79d-ad9d6ff249f1	CMP-NZX062	Arham share	broking	surat city	surat	Gujarat	395017	\N		Finance	arham@gmail.com	11-50	2015	$2b$10$eTHHWkzmC9tevxcxySl9r.BAwmjl0MI60TvR.haNc7toZOfm9t.SW	t	2025-08-09 04:48:28.138103	2025-08-09 04:48:28.138103	f	unverified	\N	\N	\N	{}	\N	\N	pending	\N	\N	f	\N	pending	\N	\N
150d4c2e-ba26-477a-ad84-543e94a7ae4d	CMP-SMC458	alpha	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and economic 	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and economic 	surat	Gujarat	395017	\N		Finance	alpha@gmail.com	11-50	2025	$2b$10$mCN5FSDucF37x9sFken9g.qvlPTxgYgvHLQWGBswSUFIpDGfAPcDC	t	2025-08-13 07:50:16.86843	2025-08-16 13:42:05.891	f	unverified	\N	\N	\N	{}	\N	\N	verified	2025-08-16 13:42:05.891	1e38866c-093f-46cf-855c-d314d7e1bcec	t	\N	pending	\N	\N
4ebef9ff-1805-4b52-a4b7-36069ca36749	CMP-ZJX296	Jainam	Have a strong pitch deck (Problem, Solution, Market, MVP Demo, Vision, Team, Ask)\n\nShow demo or walk-through of MVP\n\nIf possible, add testimonials, waitlist signups, or anything that shows market interest\n\nExplain your growth plan post-funding	Have a strong pitch deck (Problem, Solution, Market, MVP Demo, Vision, Team, Ask)\n\nShow demo or walk-through of MVP\n\nIf possible, add testimonials, waitlist signups, or anything that shows market interest\n\nExplain your growth plan post-funding	surat	Gujarat	234567	PAN	GNMOO8907B	Finance	jainam1@gmail.com	11-50	2025	$2b$10$cetVtqNkMe6ehFgBMtXbZOrPcCbGem/DglnWyG7ybTBOLfTWslUbm	t	2025-08-06 04:53:50.930195	2025-08-21 10:57:46.738	f	verified	manual	2025-08-21 10:57:46.738	\N	{}	\N	U12345MH2023PTC012345	verified	2025-08-16 05:31:09.802	1e38866c-093f-46cf-855c-d314d7e1bcec	t	GNHJJ7890P	verified	2025-08-16 05:31:17.714	1e38866c-093f-46cf-855c-d314d7e1bcec
\.


--
-- Data for Name: company_employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_employees (id, company_id, employee_id, "position", department, joined_at, left_at, status, is_active) FROM stdin;
f69f0f52-b8aa-47c3-a06f-8e4f2b7d9e1b	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	12d27bda-863f-4fd0-8d35-aba23a6139e9	\N	\N	2025-08-09 04:49:31.568552	\N	employed	t
fb3395a9-b7ae-403c-a407-e7b3c4f401e8	4ebef9ff-1805-4b52-a4b7-36069ca36749	12d27bda-863f-4fd0-8d35-aba23a6139e9	\N	\N	2025-08-06 04:56:18.018439	2025-08-09 05:39:56.03	ex-employee	f
a2b061eb-e491-47b8-b95c-f46b630a0458	150d4c2e-ba26-477a-ad84-543e94a7ae4d	12d27bda-863f-4fd0-8d35-aba23a6139e9	\N	\N	2025-08-13 07:51:22.488785	\N	employed	t
1dfb77e2-53f0-4056-9c54-e2661c344aa1	4ebef9ff-1805-4b52-a4b7-36069ca36749	4ddd99e4-2ac4-4463-8142-3feb64f9d296	\N	\N	2025-08-18 11:25:06.499763	\N	employed	t
\.


--
-- Data for Name: company_invitation_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_invitation_codes (id, company_id, code, expires_at, used_by_employee_id, used_at, created_at) FROM stdin;
5a2b71cd-1c39-4fd1-aea6-367cdc2c68b7	4ebef9ff-1805-4b52-a4b7-36069ca36749	ZBBWTLBR	2025-08-06 05:10:44.315	12d27bda-863f-4fd0-8d35-aba23a6139e9	2025-08-06 04:56:17.962	2025-08-06 04:55:44.32781
df081460-794d-425c-abef-197905e86c11	4ebef9ff-1805-4b52-a4b7-36069ca36749	ZP7LX0KN	2025-08-07 13:51:55.331	\N	\N	2025-08-07 13:36:55.343016
40cadac3-6dce-4fd7-987a-bef33685f0df	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	VOMASP2P	2025-08-09 05:03:55.483	12d27bda-863f-4fd0-8d35-aba23a6139e9	2025-08-09 04:49:31.499	2025-08-09 04:48:55.494988
e58c464c-f01a-4207-85e2-3142f49e3839	150d4c2e-ba26-477a-ad84-543e94a7ae4d	QSZYPFT4	2025-08-13 08:05:50.396	12d27bda-863f-4fd0-8d35-aba23a6139e9	2025-08-13 07:51:22.432	2025-08-13 07:50:50.408193
6e85e057-d425-43ab-bc74-a07350981cda	4ebef9ff-1805-4b52-a4b7-36069ca36749	11PVMUM7	2025-08-18 11:39:11.962	4ddd99e4-2ac4-4463-8142-3feb64f9d296	2025-08-18 11:25:06.49	2025-08-18 11:24:11.925711
320ce34a-d75e-4ae6-a404-d510a505ca56	4ebef9ff-1805-4b52-a4b7-36069ca36749	QI47YKDG	2025-08-20 13:37:16.027	\N	\N	2025-08-20 13:22:16.040897
\.


--
-- Data for Name: educations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.educations (id, employee_id, institution, degree, field_of_study, start_year, end_year, grade, activities, description, created_at, category) FROM stdin;
9e3aa27e-290e-4e4e-8b20-fb8762754bee	12d27bda-863f-4fd0-8d35-aba23a6139e9	BMU	BE	computer engineering 	2018	2022	7.2			2025-08-06 10:44:04.537358	graduate
\.


--
-- Data for Name: email_change_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_change_logs (id, user_id, old_email, new_email, change_type, ip_address, user_agent, two_factor_used, verification_token, status, "timestamp") FROM stdin;
86bae720-1d72-4010-940e-773da32f49e6	463c30e6-2f06-407c-ad03-198646578055		avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	968667	pending	2025-08-17 09:19:09.214232
d0c76cee-296a-458d-b2ce-a0caaf458c33	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	717828	pending	2025-08-17 11:07:16.468761
4cad41de-5b0f-45c5-af99-ef1e34499ac0	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	695359	pending	2025-08-17 11:17:17.663834
e6a56094-a451-47c5-b67c-09681769a114	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	561057	pending	2025-08-17 11:20:41.013658
c1ff2560-0d95-4839-88be-556409c0fe9a	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	529967	pending	2025-08-17 11:34:53.763863
c3b3ed59-061a-4270-922b-a413e4599237	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	314850	pending	2025-08-17 11:44:59.715251
385a0d1c-6fc4-4165-bdea-3cfcedc485fe	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	170952	pending	2025-08-17 12:06:01.367872
1af6035c-23ed-48aa-be58-9564af06b296	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	avnimodi39@gmail.com	otp_verification_sent	\N	\N	f	858941	pending	2025-08-17 12:26:09.196535
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_verifications (id, email, otp_code, purpose, user_type, user_id, is_used, created_at, expires_at) FROM stdin;
f6e37faa-588c-4da0-ad82-1b6f932a5f8a	mansii.2501@gmail.com	205726	password_reset	employee	35925bfd-3ed7-482f-9dca-b94e94e0dbed	f	2025-08-19 13:28:22.514468	2025-08-19 13:43:22.503
0118cc88-7306-4c2d-953e-552ea5ce5bc3	mansii.2501@gmail.com	343715	password_reset	employee	35925bfd-3ed7-482f-9dca-b94e94e0dbed	t	2025-08-19 13:30:06.886714	2025-08-19 13:45:06.875
\.


--
-- Data for Name: emails; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.emails (id, user_id, email, status, verification_token, verification_expires_at, verified_at, detached_at, grace_expires_at, created_at, updated_at) FROM stdin;
639f1c82-135e-4cd6-9f5f-4521a94f6305	463c30e6-2f06-407c-ad03-198646578055	avnimodi39@gmail.com	pending_verification	858941	2025-08-17 12:36:08.614	\N	\N	\N	2025-08-17 09:19:08.389733	2025-08-17 12:26:08.639
\.


--
-- Data for Name: employee_companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employee_companies (id, employee_id, company_name, "position", start_date, end_date, is_current, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employees (id, employee_id, first_name, last_name, email, phone, country_code, password, profile_photo, headline, summary, location, website, current_position, current_company, industry, experience_level, salary_expectation, availability_status, notice_period, preferred_work_type, skills, languages, specializations, address, city, state, zip_code, country, date_of_birth, nationality, marital_status, hobbies, certifications, achievements, portfolio_url, github_url, linkedin_url, twitter_url, is_active, created_at, updated_at, email_verified, gender) FROM stdin;
6eb3b8d7-cfcb-4940-99f5-73cc502098d0	EMP-LAT629	nevil	patel	avni04250@gmail.com	1234567890	+1	$2b$10$JdRnco9b468aaqhWtfMyu.5O6B7kauFe3nb5WBJs09Jc9HCVPKbVS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	open	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-08-17 12:47:33.099353	2025-08-17 12:47:33.099353	t	\N
4ddd99e4-2ac4-4463-8142-3feb64f9d296	EMP-YOM895	yash	patel	1911yashpatel1911@gmail.com	1234567890	+1	$2b$10$Lq.i7hV0KZzzACAWaRQ3j.QpFh5zmFckequPyZcBodkmLmJwo8Xxu	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	open	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-08-18 11:11:29.492527	2025-08-18 11:13:57.208	t	\N
12d27bda-863f-4fd0-8d35-aba23a6139e9	EMP-BCZ704	Nevil	Patel	nevilpatel328@gmail.com	8849827104	+1	$2b$10$CUZ1ppLXi2V0gUUJxNDI9eC2FnFsSYNZqfV1lvXN2S.ROmC1dyGEG	/objects/uploads/3e9bf403-d0ad-4612-b5ff-911798c94396	Trader	awesome work			manager	jainam		mid		open	1_month	hybrid	{trader,quant,maths}	{}	{}	\N	\N	\N	\N	\N	2001-05-09	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-08-06 04:40:13.550927	2025-08-19 05:31:40.815	t	male
\.


--
-- Data for Name: endorsements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.endorsements (id, employee_id, endorser_name, endorser_position, endorser_company, relationship, endorsement_text, endorsement_date, created_at) FROM stdin;
\.


--
-- Data for Name: experiences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.experiences (id, employee_id, title, company, location, start_date, end_date, is_current, description, achievements, created_at) FROM stdin;
f778b115-6aa0-4a4d-92d1-0a089a71f256	12d27bda-863f-4fd0-8d35-aba23a6139e9	trader	jainam	surat	2023-02	2025-05	f	ss	{}	2025-08-06 05:28:17.869958
\.


--
-- Data for Name: job_alerts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.job_alerts (id, employee_id, alert_name, keywords, locations, employment_types, experience_levels, salary_min, industries, is_active, email_notifications, frequency, last_sent, created_at) FROM stdin;
\.


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.job_applications (id, job_id, employee_id, status, cover_letter, resume_url, attachment_url, attachment_name, include_profile, include_work_diary, applied_at, status_updated_at, company_notes, interview_notes, salary_expectation, rejection_reason) FROM stdin;
d4145478-fe70-49e6-89a4-a16f3b0f58ba	65b84a34-95b5-4c0f-b073-74821b6c42ee	12d27bda-863f-4fd0-8d35-aba23a6139e9	hired		\N			t	t	2025-08-17 08:25:30.781979	2025-08-18 11:31:18.462	\N	\N	\N	\N
b69972f5-33a8-4f18-8e9e-a105501e6e7e	65b84a34-95b5-4c0f-b073-74821b6c42ee	12d27bda-863f-4fd0-8d35-aba23a6139e9	applied		\N			t	t	2025-08-19 06:00:23.283862	2025-08-19 06:00:23.283862	\N	\N	\N	\N
bd9c7832-483d-4a6f-946b-50a0177fad87	65b84a34-95b5-4c0f-b073-74821b6c42ee	12d27bda-863f-4fd0-8d35-aba23a6139e9	viewed		\N			t	t	2025-08-19 06:00:27.447263	2025-08-19 06:30:39.879	\N	\N	\N	\N
\.


--
-- Data for Name: job_listings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.job_listings (id, company_id, title, description, requirements, location, remote_type, employment_type, experience_level, salary_range, benefits, skills, application_deadline, status, views, applications_count, created_at, updated_at) FROM stdin;
65b84a34-95b5-4c0f-b073-74821b6c42ee	4ebef9ff-1805-4b52-a4b7-36069ca36749	Trader	Each tab should update counts in real-time (total, shortlisted, interviewed, etc.) and provide smooth navigation. Ensure consistent UI, proper state management, and database updates when a candidate’s status changes.	Each tab should update counts in real-time (total, shortlisted, interviewed, etc.) and provide smooth navigation. Ensure consistent UI, proper state management, and database updates when a candidate’s status changes.	surat	office	full-time	mid	100000	{}	{any}	2026-01-01 00:00:00	active	0	0	2025-08-17 07:35:15.862589	2025-08-17 07:35:15.862589
6c590e7b-554c-4476-a51a-f1911e8c8f60	4ebef9ff-1805-4b52-a4b7-36069ca36749	quant	Would you like me to also write the database + backend logic (SQL + API structure) for this flow so your AI/dev team can directly implement it, or just keep it as a natural-language promp	When the user taps Sign Up, do not immediately create the account.\n\nInstead, send a 6-digit OTP to the email entered by the user.\n\nRedirect the user to the OTP Verification page.\n\nPage should ask: “Enter the OTP sent to your email”\n\nInput field for OTP + Verify button\n\nIf OTP is correct → create the employee account in the database and complete the signup.\n\nIf OTP is incorrect → show error and allow retry.\n\nOTP should expire after a set time (e.g., 5 minutes).	surat	office	full-time	mid		{}	{"trading skills"}	\N	active	0	0	2025-08-19 07:53:18.047743	2025-08-19 07:53:18.047743
\.


--
-- Data for Name: login_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.login_sessions (id, user_type, user_id, session_id, login_at, logout_at, ip_address, user_agent, browser_info, device_type, location, is_active, created_at) FROM stdin;
963d0501-a480-49b3-bed2-581d3bdf6a49	employee	12d27bda-863f-4fd0-8d35-aba23a6139e9	peBUce5nTFJr2uQzQNKL7KQaKoxUIqCc	2025-08-21 10:51:38.841272	\N	127.0.0.1	Mozilla/5.0 Browser	\N	Desktop	Unknown	t	2025-08-21 10:51:38.841272
\.


--
-- Data for Name: pending_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pending_users (id, email, hashed_password, user_type, user_data, verification_token, token_expiry, resend_count, created_at) FROM stdin;
27d7bb08-020c-4779-a092-2aaf94ebee0b	test@example.com	$2b$10$oO54xlSjRVoDoo721ci5eO62E79i.RAqH1TLH4bWbbtdbTz.E/D/m	employee	"{\\"firstName\\":\\"Test\\",\\"lastName\\":\\"User\\",\\"phoneNumber\\":\\"+1234567890\\"}"	BsqVa86pq69-C51Bw_kjbwCaHuiDmZNU	2025-08-17 12:11:11.321	0	2025-08-17 11:56:11.33471
bfa67d73-7241-4445-a759-4ac0359f8777	john.doe@example.com	$2b$10$duRWjcAPJJePK.RhmpRK0emCRyLot5MW2/bR5rl4VEdhdIluGv.I6	employee	"{\\"firstName\\":\\"John\\",\\"lastName\\":\\"Doe\\",\\"phoneNumber\\":\\"+1234567890\\"}"	FJnndd20EFZhjuaIUH8gsI9ckVnrbR9Z	2025-08-17 12:11:44.673	0	2025-08-17 11:56:44.68659
d47e5ad7-26de-47b2-b17a-38b1010dd70f	jane.smith@example.com	$2b$10$n/ZCIlU0tBteP2q8Zx871.fVSK4GNm2ucD487FAntmtml4AJU0yj6	employee	"{\\"firstName\\":\\"Jane\\",\\"lastName\\":\\"Smith\\",\\"phoneNumber\\":\\"+1234567890\\"}"	--6812zh8F4D3M2XtOgKWjYeri03Q3kB	2025-08-17 12:12:21.833	0	2025-08-17 11:57:21.845592
6ee08747-b831-45db-8c46-bc37c60d1336	nevilpatel1196@gmail.com	$2b$10$59PsLw7A4v4XJ76XpNlmJ.1cUu1XWgos63ed6Va/.L8EcMHCdEpkq	employee	{"lastName": "patel", "password": "Nevil@786", "firstName": "nevil", "phoneNumber": "1234567890"}	723967	2025-08-17 12:51:29.005	2	2025-08-17 12:43:06.650225
f352d8a3-22c9-436e-ac3d-f13a027fd109	1911yashpatel11911@gmail.com	$2b$10$P6QyJki38EETcSuJTskCtOVSYjY.lOOplYZVCu74npdZQF5xEMHKu	employee	{"lastName": "Patel", "password": "Yash1919", "firstName": "Yash ", "phoneNumber": "9723418337"}	795569	2025-08-18 11:10:29.113	0	2025-08-18 11:05:29.126689
\.


--
-- Data for Name: profile_views; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.profile_views (id, viewer_company_id, viewed_employee_id, viewed_at, view_context) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, employee_id, name, description, start_date, end_date, project_url, repository_url, technologies, team_size, role, achievements, created_at) FROM stdin;
\.


--
-- Data for Name: saved_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.saved_jobs (id, job_id, employee_id, saved_at) FROM stdin;
6350ba85-ae18-4ed5-b807-cf2fae23dfcc	65b84a34-95b5-4c0f-b073-74821b6c42ee	12d27bda-863f-4fd0-8d35-aba23a6139e9	2025-08-21 04:59:34.238281
\.


--
-- Data for Name: skill_analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.skill_analytics (id, user_id, skill_id, event_type, context, created_at) FROM stdin;
\.


--
-- Data for Name: skill_trends; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.skill_trends (id, skill_id, job_count_7d, job_count_30d, job_count_total, growth_pct, click_thru_rate, apply_rate_from_skill, trending_score, region, updated_at) FROM stdin;
c9a5ebe9-0a78-4daa-a0fd-f15cad856f63	5c4af46c-49b4-4a04-b606-24a30eb20caf	150	520	2100	15.80	0.0000	0.0000	0.8900	\N	2025-08-17 08:04:31.63934
9ac109a8-6fe4-462c-a74a-6fddc26966bf	bc40705e-0b40-45dd-8fad-21b143370457	180	600	2500	12.50	0.0000	0.0000	0.9200	\N	2025-08-17 08:04:31.63934
6e531f68-9fc6-4dfc-9566-d987babe3e37	4f81848d-1d3d-43f8-b962-ca31b4ceac8f	200	650	2800	18.20	0.0000	0.0000	0.9500	\N	2025-08-17 08:04:31.63934
4c4a38d4-9200-4866-b2c7-b717958a1951	d7675c6f-0710-4e38-b7b8-0ec32fb92a23	120	380	1600	22.10	0.0000	0.0000	0.8500	\N	2025-08-17 08:04:31.63934
f30a9e8b-d688-4cec-a957-3eeb61c605e0	90f1d92d-ea34-4bf5-84ef-8c8a9e812219	110	350	1400	16.70	0.0000	0.0000	0.8200	\N	2025-08-17 08:04:31.63934
398d9784-0a49-4e3c-943b-3cfb20d2d746	cff224d0-b783-4d33-9f3c-dc9701faf107	90	320	1300	8.90	0.0000	0.0000	0.7800	\N	2025-08-17 08:04:31.63934
e3f1fa67-15d3-4976-aede-321935161d55	7a80b360-ae12-4384-b2a4-9d36befa31c7	75	280	950	25.30	0.0000	0.0000	0.8800	\N	2025-08-17 08:04:31.63934
7b06668e-b775-4252-984e-8990ff1802ad	69f6cf0d-13a4-4fd8-9caa-5c6b1fffa3d2	65	220	890	19.40	0.0000	0.0000	0.7600	\N	2025-08-17 08:04:31.63934
82b02e3b-385b-4448-90a8-a0279199a6b2	aae284ef-a705-4df4-b56a-6fe741ddce5c	55	190	720	21.20	0.0000	0.0000	0.7400	\N	2025-08-17 08:04:31.63934
2302b3d1-7e00-4eb2-b219-3b7f2400328a	0ced9ae0-141e-44df-8934-33f0ed86027d	140	480	2200	11.20	0.0000	0.0000	0.8700	\N	2025-08-17 08:04:31.63934
06a325f6-e2cb-4265-a873-718cbc0c6da2	64853d40-44a7-418a-becc-3c303eb9353a	80	270	1100	14.60	0.0000	0.0000	0.7900	\N	2025-08-17 08:04:31.63934
39d31611-ee8a-41d5-a11e-745df552d137	7ef3ccde-019a-48a3-a5aa-46529ff0edc8	70	240	980	13.80	0.0000	0.0000	0.7700	\N	2025-08-17 08:04:31.63934
cfd79457-f903-4cbd-9a0c-9769b4ae1c48	8ad3a93d-056e-4efa-9d05-9701e508008d	85	300	1150	17.90	0.0000	0.0000	0.8300	\N	2025-08-17 08:04:31.63934
95d39f48-1235-4cc5-983d-eb5063417e6d	291ecdac-296a-4e39-b4c7-69f777fa1760	95	340	1350	9.70	0.0000	0.0000	0.8100	\N	2025-08-17 08:04:31.63934
d4b56428-e26b-4af5-a734-60cc319fcb87	c5023f33-6371-42ba-ad49-33d51a29b6c0	60	210	850	7.40	0.0000	0.0000	0.7200	\N	2025-08-17 08:04:31.63934
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.skills (id, name, slug, category, aliases, related_skill_ids, is_technical, description, created_at, updated_at) FROM stdin;
5c4af46c-49b4-4a04-b606-24a30eb20caf	React	react	technical	{ReactJS,React.js}	{}	t	A JavaScript library for building user interfaces	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
bc40705e-0b40-45dd-8fad-21b143370457	Python	python	technical	{Python3,"Python 3"}	{}	t	A high-level programming language	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
4f81848d-1d3d-43f8-b962-ca31b4ceac8f	JavaScript	javascript	technical	{JS,ECMAScript}	{}	t	A programming language for web development	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
d7675c6f-0710-4e38-b7b8-0ec32fb92a23	TypeScript	typescript	technical	{TS}	{}	t	A typed superset of JavaScript	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
90f1d92d-ea34-4bf5-84ef-8c8a9e812219	Node.js	nodejs	technical	{Node,NodeJS}	{}	t	JavaScript runtime built on V8	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
cff224d0-b783-4d33-9f3c-dc9701faf107	AWS	aws	technical	{"Amazon Web Services","Amazon AWS"}	{}	t	Cloud computing platform	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
7a80b360-ae12-4384-b2a4-9d36befa31c7	Machine Learning	machine-learning	technical	{ML,AI/ML}	{}	t	Artificial intelligence and data science	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
69f6cf0d-13a4-4fd8-9caa-5c6b1fffa3d2	Docker	docker	technical	{Containerization}	{}	t	Container platform	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
aae284ef-a705-4df4-b56a-6fe741ddce5c	Kubernetes	kubernetes	technical	{K8s}	{}	t	Container orchestration	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
0ced9ae0-141e-44df-8934-33f0ed86027d	SQL	sql	technical	{MySQL,PostgreSQL,Database}	{}	t	Structured Query Language	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
64853d40-44a7-418a-becc-3c303eb9353a	UI/UX Design	ui-ux-design	design	{"User Experience","User Interface",Design}	{}	f	User interface and experience design	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
7ef3ccde-019a-48a3-a5aa-46529ff0edc8	Product Management	product-management	soft	{PM,"Product Manager"}	{}	f	Product strategy and management	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
8ad3a93d-056e-4efa-9d05-9701e508008d	Data Science	data-science	technical	{"Data Analysis",Analytics}	{}	t	Data analysis and insights	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
291ecdac-296a-4e39-b4c7-69f777fa1760	DevOps	devops	technical	{"Development Operations"}	{}	t	Development and operations practices	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
c5023f33-6371-42ba-ad49-33d51a29b6c0	Agile	agile	soft	{Scrum,"Agile Methodology"}	{}	f	Agile project management methodology	2025-08-17 08:04:31.63934	2025-08-17 08:04:31.63934
\.


--
-- Data for Name: user_feedback; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_feedback (id, user_type, user_id, user_email, user_name, feedback_type, category, title, description, priority, status, browser_info, page_url, attachments, admin_notes, admin_response, responded_at, responded_by, rating, is_public, created_at, updated_at) FROM stdin;
d4c0ffa4-2722-445e-bb3c-35ce587cc8a1	employee	12d27bda-863f-4fd0-8d35-aba23a6139e9	nevilpatel328@gmail.com	Nevil Patel	bug_report	other	bug	big bug, solve it as soon as possible 	urgent	in_review	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Replit/1.0.14 Chrome/124.0.6367.119 Electron/30.0.3 Safari/537.36	https://a8e25821-8eed-450f-9d50-5ca4929f4242-00-ks1dbum0ifnq.riker.replit.dev/feedback	{}	\N	\N	\N	\N	\N	f	2025-08-21 11:06:40.995896	2025-08-21 11:17:59.803
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
3U6n8GRWy-fibtSE2fSIpsr8r4pscUoO	{"cookie":{"originalMaxAge":86400000,"expires":"2025-08-23T06:49:02.512Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"8f392d4a-2259-44f6-b79d-ad9d6ff249f1","email":"arham@gmail.com","type":"company"}}	2025-08-23 16:49:39
X-od0PCKbDqc71kd7NWg7E6mB2zyr3o2	{"cookie":{"originalMaxAge":86400000,"expires":"2025-08-24T05:35:51.201Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"8f392d4a-2259-44f6-b79d-ad9d6ff249f1","email":"arham@gmail.com","type":"company"}}	2025-08-24 07:55:07
\.


--
-- Data for Name: user_skill_preferences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_skill_preferences (id, user_id, skill_id, is_pinned, is_hidden, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: work_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.work_entries (id, employee_id, company_id, title, description, start_date, end_date, priority, hours, estimated_hours, actual_hours, status, work_type, category, project, client, billable, billable_rate, tags, achievements, challenges, learnings, company_feedback, company_rating, attachments, created_at, updated_at, approval_status) FROM stdin;
9e5646dd-7471-4f7a-8b98-ce17176d74b8	12d27bda-863f-4fd0-8d35-aba23a6139e9	4ebef9ff-1805-4b52-a4b7-36069ca36749	trader	Install open-source packages (also called modules or libraries)\n\nPublish their own packages\n\n	2025-01-07	2025-03-01	medium	\N	0	0	approved	task	nice	nice	nice	f	0	{}	{}	Install open-source packages (also called modules or libraries)\n\nPublish their own packages\n\n	Install open-source packages (also called modules or libraries)\n\nPublish their own packages\n\n	Great work! Well organized and completed on time.	5	{}	2025-08-07 03:59:44.090419	2025-08-07 04:14:22.656	pending_review
0a6eada5-89fb-48c6-ada9-e1f6b41f81b8	12d27bda-863f-4fd0-8d35-aba23a6139e9	4ebef9ff-1805-4b52-a4b7-36069ca36749	945	If you’re building a project using JavaScript or Node.js, npm helps you install and manage tools and libraries easily, just like an app store for code.\n\nWant help installing or using it in a project?If you’re building a project using JavaScript or Node.js, npm helps you install and manage tools and libraries easily, just like an app store for code.\n\nWant help installing or using it in a project?	2020-01-01	2020-03-01	medium	\N	0	0	completed	task	nice	nice	nice	f	0	{}	{}	If you’re building a project using JavaScript or Node.js, npm helps you install and manage tools and libraries easily, just like an app store for code.\n\nWant help installing or using it in a project?	If you’re building a project using JavaScript or Node.js, npm helps you install and manage tools and libraries easily, just like an app store for code.\n\nWant help installing or using it in a project?	\N	\N	{}	2025-08-07 04:16:18.029454	2025-08-07 07:25:50.09	pending_review
88440fa4-81d1-443e-b3db-6cb4f2b3b6f1	12d27bda-863f-4fd0-8d35-aba23a6139e9	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	trader	I added the missing button to the CardHeader area of the company selection screen. The button now appears in the top-right when you have existing companies, allowing you to join additional companies.	2022-01-01	2022-02-01	medium	\N	0	0	approved	task	nice	nice	nice	f	0	{}	{}	I added the missing button to the CardHeader area of the company selection screen. The button now appears in the top-right when you have existing companies, allowing you to join additional companies.	I added the missing button to the CardHeader area of the company selection screen. The button now appears in the top-right when you have existing companies, allowing you to join additional companies.	\N	4	{}	2025-08-09 04:50:03.848479	2025-08-09 04:50:57.441	pending_review
ff05e559-06dc-4944-bf19-80db99010227	12d27bda-863f-4fd0-8d35-aba23a6139e9	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	quant trader	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and econom	2025-01-01	2025-02-01	high	\N	0	0	approved	task	trading	basket		f	0	{}	{}	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and econom	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and econom	\N	5	{}	2025-08-11 05:51:38.791232	2025-08-13 05:32:50.716	pending_review
final-test-entry	12d27bda-863f-4fd0-8d35-aba23a6139e9	4ebef9ff-1805-4b52-a4b7-36069ca36749	FINAL FIX TEST ENTRY	Testing with the correct company ID after the critical fix	2025-08-07	\N	high	\N	\N	\N	approved	task	\N	\N	\N	t	\N	{}	{}	\N	\N	\N	\N	{}	2025-08-07 03:58:09.354854	2025-08-19 04:44:16.387	approved
1cc25ca0-2388-42e2-9b86-e9a81072bd43	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	nice 2	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-02-01	2025-03-01	medium	\N	0	0	pending	task	nice 2	nice2	nice 2 	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 12:06:21.199227	2025-08-18 12:06:21.199227	pending_review
8f4b4c32-5c5a-438e-a824-8526785646ab	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	A1	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-01-01	2025-02-01	medium	\N	0	0	pending	task	nice	nice	nice	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 12:21:18.105103	2025-08-18 12:21:18.105103	pending_review
ab13fa37-3b98-40ff-9474-2d05c9cacdc0	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	A2	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-01-01	2025-02-01	medium	\N	0	0	in_progress	task	nice	nice	nice	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 12:21:42.483223	2025-08-18 12:21:42.483223	pending_review
863453b6-8b1a-4f4d-bd7e-ca26882d07f5	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	A3	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-01-01	2025-02-01	medium	\N	0	0	completed	task	nice	nice	nice	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 12:22:08.33886	2025-08-18 12:22:08.33886	pending_review
4e6b0273-9978-498d-aa04-f2aa8f61354f	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	A4	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-01-01	2025-02-01	medium	\N	0	0	on_hold	task	nice	nice	nice	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 12:22:34.601743	2025-08-18 12:22:34.601743	pending_review
a27d57e6-136d-4b04-b427-7a685b62b90a	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	nice	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-01-01	2025-02-01	medium	\N	0	0	approved	task	nice	nice	nice	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 11:27:30.210363	2025-08-18 18:37:46.507	approved
4def2003-056e-4994-923f-9db74f37402e	12d27bda-863f-4fd0-8d35-aba23a6139e9	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	excellent work 	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and economic 	2025-01-01	2025-02-01	high	\N	0	0	approved	task	yes	yes	yes	f	0	{}	{}	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and economic 	It's important to note that the majority of businesses worldwide are small and medium-sized enterprises (SMEs). SMEs account for about 90% of all companies globally and contribute significantly to employment and economic 	\N	\N	{}	2025-08-13 05:22:52.953803	2025-08-19 04:45:34.531	approved
bd9fab49-734e-45d1-ba9c-586af3046a32	4ddd99e4-2ac4-4463-8142-3feb64f9d296	4ebef9ff-1805-4b52-a4b7-36069ca36749	A5	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	2025-01-01	2025-02-01	medium	\N	0	0	cancelled	task	nice	nice	nice	f	0	{}	{}	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	Ensure email is unique before sending OTP (don’t allow duplicate employee emails).\n\nStore OTP securely (temporary, not in plain text).\n\nAfter successful verification, mark email as verified.	\N	\N	{}	2025-08-18 12:23:03.214417	2025-08-18 12:42:53.062	approved
4abb66aa-cdc8-48b8-b212-a1fa9dbb7e21	12d27bda-863f-4fd0-8d35-aba23a6139e9	4ebef9ff-1805-4b52-a4b7-36069ca36749	1010	What does it create?\npackage.json: Lists your project’s dependencies and metadata.\n\nnode_modules/: Contains all the installed packages.\n\n🔗 Where does it pull packages from?\nFrom the npm registry: https://www.npmjs.com\n\nThis registry hosts thousands of JavaScript libraries you can use in your projects.\n\n	2029-01-01	2020-01-01	medium	\N	0	0	approved	task	nice	nice	nice	f	0	{}	{}	What does it create?\npackage.json: Lists your project’s dependencies and metadata.\n\nnode_modules/: Contains all the installed packages.\n\n🔗 Where does it pull packages from?\nFrom the npm registry: https://www.npmjs.com\n\nThis registry hosts thousands of JavaScript libraries you can use in your projects.\n\n	What does it create?\npackage.json: Lists your project’s dependencies and metadata.\n\nnode_modules/: Contains all the installed packages.\n\n🔗 Where does it pull packages from?\nFrom the npm registry: https://www.npmjs.com\n\nThis registry hosts thousands of JavaScript libraries you can use in your projects.\n\n	\N	\N	{}	2025-08-07 04:41:36.297713	2025-08-19 04:44:20.97	approved
2d565d55-42e9-4f1e-87ec-cb1a98154cab	12d27bda-863f-4fd0-8d35-aba23a6139e9	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	test arham	description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_description_ 	2025-01-19	2025-03-01	medium	\N	0	0	approved	task	nice	nice	nice	f	0	{}	{}	Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_Challenges Faced_	Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_Key Learnings_	\N	\N	{}	2025-08-19 04:56:40.342136	2025-08-19 05:09:58.586	approved
7b1d3ef8-cf82-4705-8b87-360bd10f6067	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	fyv		2025-08-21		medium	\N	0	0	pending	task				f	0	{}	{}			\N	\N	{}	2025-08-21 11:40:31.894596	2025-08-21 11:51:44.626	pending_review
56a57075-3448-4203-8faf-fbd1a53ebae7	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	test		2025-08-21	2025-08-13	medium	\N	0	0	pending	meeting				f	0	{}	{}			\N	\N	{}	2025-08-21 11:42:39.667083	2025-08-21 11:51:54.925	pending_review
84f38b42-8ef2-4615-b2aa-0f1938eb521c	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	qwertyui		2025-08-21	2020-01-01	medium	\N	0	0	pending	task				f	0	{}	{}			\N	\N	{}	2025-08-21 12:03:23.717242	2025-08-21 12:03:23.717242	pending_review
a03bad14-a43f-48ad-b133-42bac6a8d9e4	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	Test API Direct	Testing direct API	21/08/2025	\N	medium	\N	8	0	in-progress	task	\N	\N	\N	f	50	{testing}	{}	\N	\N	\N	\N	{}	2025-08-21 13:30:00.40284	2025-08-21 13:30:00.40284	pending_review
1e9d89b9-d4fd-44e7-a3e4-7556a6f2a922	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	test5		01/08/2025		medium	\N	0	0	pending	task				f	0	{}	{}			\N	\N	{}	2025-08-21 13:35:46.738401	2025-08-21 13:35:46.738401	pending_review
652408be-900c-4eef-9479-3d9b4dee7396	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	Quick Test Entry	Emergency test	21/08/2025		medium	\N	1	0	in-progress	task				f	0	{}	{}			\N	\N	{}	2025-08-21 13:36:00.825785	2025-08-21 13:36:00.825785	pending_review
bf602b66-a278-4d10-b9c1-fd03dc7bc565	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	test 6		01/08/2025		medium	\N	0	0	pending	task				f	0	{}	{}			\N	\N	{}	2025-08-21 13:38:00.879555	2025-08-21 13:38:00.879555	pending_review
a1e48559-0ded-4b09-8eea-5f3fa829ce1e	12d27bda-863f-4fd0-8d35-aba23a6139e9	150d4c2e-ba26-477a-ad84-543e94a7ae4d	test entry 10		10/07/2025	21/08/2025	medium	\N	0	0	approved	task				f	0	{}	{}			\N	\N	{}	2025-08-22 04:43:13.755708	2025-08-22 04:44:09.848	approved
82ba43f6-7512-4184-8778-e08759e2418b	12d27bda-863f-4fd0-8d35-aba23a6139e9	8f392d4a-2259-44f6-b79d-ad9d6ff249f1	basket buit	Want help constructing that iSAFE cap structure with cap, discount, raise amount, and pitch deck points tailored to your SaaS metrics? I can build it out next—just say the word!	01/08/2025	21/08/2025	high	\N	0	0	approved	task	trading		company	f	0	{}	{}	Want help constructing that iSAFE cap structure with cap, discount, raise amount, and pitch deck points tailored to your SaaS metrics? I can build it out next—just say the word!	Want help constructing that iSAFE cap structure with cap, discount, raise amount, and pitch deck points tailored to your SaaS metrics? I can build it out next—just say the word!	\N	\N	{}	2025-08-22 06:32:12.900861	2025-08-22 06:50:04.818	approved
\.


--
-- Name: admins admins_admin_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_admin_id_unique UNIQUE (admin_id);


--
-- Name: admins admins_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_unique UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_unique UNIQUE (username);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: companies companies_company_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_company_id_unique UNIQUE (company_id);


--
-- Name: companies companies_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_email_unique UNIQUE (email);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_employees company_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_pkey PRIMARY KEY (id);


--
-- Name: company_invitation_codes company_invitation_codes_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_invitation_codes
    ADD CONSTRAINT company_invitation_codes_code_unique UNIQUE (code);


--
-- Name: company_invitation_codes company_invitation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_invitation_codes
    ADD CONSTRAINT company_invitation_codes_pkey PRIMARY KEY (id);


--
-- Name: educations educations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.educations
    ADD CONSTRAINT educations_pkey PRIMARY KEY (id);


--
-- Name: email_change_logs email_change_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_change_logs
    ADD CONSTRAINT email_change_logs_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: emails emails_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_email_key UNIQUE (email);


--
-- Name: emails emails_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_pkey PRIMARY KEY (id);


--
-- Name: employee_companies employee_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_companies
    ADD CONSTRAINT employee_companies_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_unique UNIQUE (email);


--
-- Name: employees employees_employee_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_unique UNIQUE (employee_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: endorsements endorsements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: job_alerts job_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_alerts
    ADD CONSTRAINT job_alerts_pkey PRIMARY KEY (id);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: job_listings job_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_listings
    ADD CONSTRAINT job_listings_pkey PRIMARY KEY (id);


--
-- Name: login_sessions login_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_pkey PRIMARY KEY (id);


--
-- Name: pending_users pending_users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_users
    ADD CONSTRAINT pending_users_email_key UNIQUE (email);


--
-- Name: pending_users pending_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_users
    ADD CONSTRAINT pending_users_pkey PRIMARY KEY (id);


--
-- Name: pending_users pending_users_verification_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_users
    ADD CONSTRAINT pending_users_verification_token_key UNIQUE (verification_token);


--
-- Name: profile_views profile_views_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: saved_jobs saved_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_pkey PRIMARY KEY (id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: skill_analytics skill_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skill_analytics
    ADD CONSTRAINT skill_analytics_pkey PRIMARY KEY (id);


--
-- Name: skill_trends skill_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skill_trends
    ADD CONSTRAINT skill_trends_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: skills skills_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_slug_key UNIQUE (slug);


--
-- Name: user_feedback user_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_pkey PRIMARY KEY (id);


--
-- Name: user_skill_preferences user_skill_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_skill_preferences
    ADD CONSTRAINT user_skill_preferences_pkey PRIMARY KEY (id);


--
-- Name: work_entries work_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT work_entries_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: companies_cin_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX companies_cin_unique ON public.companies USING btree (cin) WHERE (cin IS NOT NULL);


--
-- Name: companies_pan_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX companies_pan_unique ON public.companies USING btree (pan_number) WHERE (pan_number IS NOT NULL);


--
-- Name: pending_users_email_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX pending_users_email_idx ON public.pending_users USING btree (email);


--
-- Name: pending_users_token_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX pending_users_token_idx ON public.pending_users USING btree (verification_token);


--
-- Name: skill_analytics_event_type_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX skill_analytics_event_type_idx ON public.skill_analytics USING btree (event_type);


--
-- Name: skill_analytics_skill_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX skill_analytics_skill_id_idx ON public.skill_analytics USING btree (skill_id);


--
-- Name: skill_analytics_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX skill_analytics_user_id_idx ON public.skill_analytics USING btree (user_id);


--
-- Name: skill_trends_skill_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX skill_trends_skill_id_idx ON public.skill_trends USING btree (skill_id);


--
-- Name: skill_trends_trending_score_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX skill_trends_trending_score_idx ON public.skill_trends USING btree (trending_score);


--
-- Name: user_skill_prefs_skill_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX user_skill_prefs_skill_id_idx ON public.user_skill_preferences USING btree (skill_id);


--
-- Name: user_skill_prefs_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX user_skill_prefs_user_id_idx ON public.user_skill_preferences USING btree (user_id);


--
-- Name: certifications certifications_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: company_employees company_employees_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_employees company_employees_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: company_invitation_codes company_invitation_codes_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_invitation_codes
    ADD CONSTRAINT company_invitation_codes_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_invitation_codes company_invitation_codes_used_by_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_invitation_codes
    ADD CONSTRAINT company_invitation_codes_used_by_employee_id_employees_id_fk FOREIGN KEY (used_by_employee_id) REFERENCES public.employees(id);


--
-- Name: educations educations_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.educations
    ADD CONSTRAINT educations_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_companies employee_companies_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_companies
    ADD CONSTRAINT employee_companies_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: endorsements endorsements_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: experiences experiences_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: job_alerts job_alerts_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_alerts
    ADD CONSTRAINT job_alerts_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: job_applications job_applications_job_id_job_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_job_id_job_listings_id_fk FOREIGN KEY (job_id) REFERENCES public.job_listings(id) ON DELETE CASCADE;


--
-- Name: job_listings job_listings_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_listings
    ADD CONSTRAINT job_listings_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: profile_views profile_views_viewed_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_viewed_employee_id_employees_id_fk FOREIGN KEY (viewed_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: profile_views profile_views_viewer_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_viewer_company_id_companies_id_fk FOREIGN KEY (viewer_company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: projects projects_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: saved_jobs saved_jobs_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: saved_jobs saved_jobs_job_id_job_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_job_id_job_listings_id_fk FOREIGN KEY (job_id) REFERENCES public.job_listings(id) ON DELETE CASCADE;


--
-- Name: skill_analytics skill_analytics_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skill_analytics
    ADD CONSTRAINT skill_analytics_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: skill_analytics skill_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skill_analytics
    ADD CONSTRAINT skill_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: skill_trends skill_trends_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skill_trends
    ADD CONSTRAINT skill_trends_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: user_skill_preferences user_skill_preferences_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_skill_preferences
    ADD CONSTRAINT user_skill_preferences_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: user_skill_preferences user_skill_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_skill_preferences
    ADD CONSTRAINT user_skill_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: work_entries work_entries_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT work_entries_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: work_entries work_entries_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT work_entries_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

