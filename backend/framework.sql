--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Postgres.app)
-- Dumped by pg_dump version 16.3 (Postgres.app)

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
-- Name: account_emailaddress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_emailaddress (
    id integer NOT NULL,
    email character varying(254) NOT NULL,
    verified boolean NOT NULL,
    "primary" boolean NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.account_emailaddress OWNER TO postgres;

--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_emailaddress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_emailaddress_id_seq OWNER TO postgres;

--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_emailaddress_id_seq OWNED BY public.account_emailaddress.id;


--
-- Name: account_emailconfirmation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_emailconfirmation (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    sent timestamp with time zone,
    key character varying(64) NOT NULL,
    email_address_id integer NOT NULL
);


ALTER TABLE public.account_emailconfirmation OWNER TO postgres;

--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_emailconfirmation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_emailconfirmation_id_seq OWNER TO postgres;

--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_emailconfirmation_id_seq OWNED BY public.account_emailconfirmation.id;


--
-- Name: actstream_action; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actstream_action (
    id integer NOT NULL,
    actor_object_id character varying(255) NOT NULL,
    verb character varying(255) NOT NULL,
    description text,
    target_object_id character varying(255),
    action_object_object_id character varying(255),
    "timestamp" timestamp with time zone NOT NULL,
    public boolean NOT NULL,
    action_object_content_type_id integer,
    actor_content_type_id integer NOT NULL,
    target_content_type_id integer
);


ALTER TABLE public.actstream_action OWNER TO postgres;

--
-- Name: actstream_action_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actstream_action_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actstream_action_id_seq OWNER TO postgres;

--
-- Name: actstream_action_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actstream_action_id_seq OWNED BY public.actstream_action.id;


--
-- Name: actstream_follow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actstream_follow (
    id integer NOT NULL,
    object_id character varying(255) NOT NULL,
    actor_only boolean NOT NULL,
    started timestamp with time zone NOT NULL,
    content_type_id integer NOT NULL,
    user_id integer NOT NULL,
    flag character varying(255) NOT NULL
);


ALTER TABLE public.actstream_follow OWNER TO postgres;

--
-- Name: actstream_follow_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actstream_follow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actstream_follow_id_seq OWNER TO postgres;

--
-- Name: actstream_follow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actstream_follow_id_seq OWNED BY public.actstream_follow.id;


--
-- Name: assessment_planning_assessmentplan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_planning_assessmentplan (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    assurance_process_id integer NOT NULL,
    completed_assessment_plan_id integer,
    draft_assessment_report_deadline date NOT NULL,
    planned_site_assessment_end_date date NOT NULL,
    planned_site_assessment_start_date date NOT NULL
);


ALTER TABLE public.assessment_planning_assessmentplan OWNER TO postgres;

--
-- Name: assessment_planning_assessmentplan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_planning_assessmentplan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_planning_assessmentplan_id_seq OWNER TO postgres;

--
-- Name: assessment_planning_assessmentplan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_planning_assessmentplan_id_seq OWNED BY public.assessment_planning_assessmentplan.id;


--
-- Name: assessment_report_additional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_additional (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_additional OWNER TO postgres;

--
-- Name: assessment_report_additional_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_additional_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_additional_id_seq OWNER TO postgres;

--
-- Name: assessment_report_additional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_additional_id_seq OWNED BY public.assessment_report_additional.id;


--
-- Name: assessment_report_assessmentlimitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_assessmentlimitations (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_assessmentlimitations OWNER TO postgres;

--
-- Name: assessment_report_assessmentlimitations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_assessmentlimitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_assessmentlimitations_id_seq OWNER TO postgres;

--
-- Name: assessment_report_assessmentlimitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_assessmentlimitations_id_seq OWNED BY public.assessment_report_assessmentlimitations.id;


--
-- Name: assessment_report_assessmentmethodology; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_assessmentmethodology (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_assessmentmethodology OWNER TO postgres;

--
-- Name: assessment_report_assessmentmethodology_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_assessmentmethodology_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_assessmentmethodology_id_seq OWNER TO postgres;

--
-- Name: assessment_report_assessmentmethodology_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_assessmentmethodology_id_seq OWNED BY public.assessment_report_assessmentmethodology.id;


--
-- Name: assessment_report_assessmentpurposeandscope; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_assessmentpurposeandscope (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_assessmentpurposeandscope OWNER TO postgres;

--
-- Name: assessment_report_assessmentpurposeandscope_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_assessmentpurposeandscope_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_assessmentpurposeandscope_id_seq OWNER TO postgres;

--
-- Name: assessment_report_assessmentpurposeandscope_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_assessmentpurposeandscope_id_seq OWNED BY public.assessment_report_assessmentpurposeandscope.id;


--
-- Name: assessment_report_assessmentreport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_assessmentreport (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    assurance_process_id integer NOT NULL
);


ALTER TABLE public.assessment_report_assessmentreport OWNER TO postgres;

--
-- Name: assessment_report_assessmentreport_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_assessmentreport_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_assessmentreport_id_seq OWNER TO postgres;

--
-- Name: assessment_report_assessmentreport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_assessmentreport_id_seq OWNED BY public.assessment_report_assessmentreport.id;


--
-- Name: assessment_report_conclusionandnextsteps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_conclusionandnextsteps (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_conclusionandnextsteps OWNER TO postgres;

--
-- Name: assessment_report_conclusionandnextsteps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_conclusionandnextsteps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_conclusionandnextsteps_id_seq OWNER TO postgres;

--
-- Name: assessment_report_conclusionandnextsteps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_conclusionandnextsteps_id_seq OWNED BY public.assessment_report_conclusionandnextsteps.id;


--
-- Name: assessment_report_countrycontext; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_countrycontext (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    general text,
    regulation text,
    occupation_health_and_safety text,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_countrycontext OWNER TO postgres;

--
-- Name: assessment_report_countrycontext_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_countrycontext_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_countrycontext_id_seq OWNER TO postgres;

--
-- Name: assessment_report_countrycontext_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_countrycontext_id_seq OWNED BY public.assessment_report_countrycontext.id;


--
-- Name: assessment_report_disclaimer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_disclaimer (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    text text,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_disclaimer OWNER TO postgres;

--
-- Name: assessment_report_disclaimer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_disclaimer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_disclaimer_id_seq OWNER TO postgres;

--
-- Name: assessment_report_disclaimer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_disclaimer_id_seq OWNED BY public.assessment_report_disclaimer.id;


--
-- Name: assessment_report_executivesummary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_executivesummary (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_executivesummary OWNER TO postgres;

--
-- Name: assessment_report_executivesummary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_executivesummary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_executivesummary_id_seq OWNER TO postgres;

--
-- Name: assessment_report_executivesummary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_executivesummary_id_seq OWNED BY public.assessment_report_executivesummary.id;


--
-- Name: assessment_report_finding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_finding (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    topic character varying(255),
    summary text,
    recommended_actions text,
    marked_as_completed boolean NOT NULL,
    provision_id integer NOT NULL,
    assessment_report_id integer NOT NULL,
    public_id character varying(255) NOT NULL
);


ALTER TABLE public.assessment_report_finding OWNER TO postgres;

--
-- Name: assessment_report_finding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_finding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_finding_id_seq OWNER TO postgres;

--
-- Name: assessment_report_finding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_finding_id_seq OWNED BY public.assessment_report_finding.id;


--
-- Name: assessment_report_goodpractices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_goodpractices (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_goodpractices OWNER TO postgres;

--
-- Name: assessment_report_goodpractices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_goodpractices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_goodpractices_id_seq OWNER TO postgres;

--
-- Name: assessment_report_goodpractices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_goodpractices_id_seq OWNED BY public.assessment_report_goodpractices.id;


--
-- Name: assessment_report_immediateresolutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_immediateresolutions (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_immediateresolutions OWNER TO postgres;

--
-- Name: assessment_report_immediateresolutions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_immediateresolutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_immediateresolutions_id_seq OWNER TO postgres;

--
-- Name: assessment_report_immediateresolutions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_immediateresolutions_id_seq OWNED BY public.assessment_report_immediateresolutions.id;


--
-- Name: assessment_report_observer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_observer (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    name character varying(255),
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_observer OWNER TO postgres;

--
-- Name: assessment_report_observer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_observer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_observer_id_seq OWNER TO postgres;

--
-- Name: assessment_report_observer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_observer_id_seq OWNED BY public.assessment_report_observer.id;


--
-- Name: assessment_report_openingandclosingmeetingparticipants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_openingandclosingmeetingparticipants (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_openingandclosingmeetingparticipants OWNER TO postgres;

--
-- Name: assessment_report_openingandclosingmeetingparticipants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_openingandclosingmeetingparticipants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_openingandclosingmeetingparticipants_id_seq OWNER TO postgres;

--
-- Name: assessment_report_openingandclosingmeetingparticipants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_openingandclosingmeetingparticipants_id_seq OWNED BY public.assessment_report_openingandclosingmeetingparticipants.id;


--
-- Name: assessment_report_performancegaps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_performancegaps (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_performancegaps OWNER TO postgres;

--
-- Name: assessment_report_performancegaps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_performancegaps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_performancegaps_id_seq OWNER TO postgres;

--
-- Name: assessment_report_performancegaps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_performancegaps_id_seq OWNED BY public.assessment_report_performancegaps.id;


--
-- Name: assessment_report_provisionresponse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_provisionresponse (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    rating numeric(2,1),
    objective_evidence text,
    key_findings text,
    marked_as_completed boolean NOT NULL,
    provision_id integer NOT NULL,
    not_applicable boolean NOT NULL,
    assessment_report_id integer NOT NULL,
    analysis text,
    reason_for_not_applicable text
);


ALTER TABLE public.assessment_report_provisionresponse OWNER TO postgres;

--
-- Name: assessment_report_provisionresponse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_provisionresponse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_provisionresponse_id_seq OWNER TO postgres;

--
-- Name: assessment_report_provisionresponse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_provisionresponse_id_seq OWNED BY public.assessment_report_provisionresponse.id;


--
-- Name: assessment_report_sitesandfacilitiesassessed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_sitesandfacilitiesassessed (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_sitesandfacilitiesassessed OWNER TO postgres;

--
-- Name: assessment_report_sitesandfacilitiesassessed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_sitesandfacilitiesassessed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_sitesandfacilitiesassessed_id_seq OWNER TO postgres;

--
-- Name: assessment_report_sitesandfacilitiesassessed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_sitesandfacilitiesassessed_id_seq OWNED BY public.assessment_report_sitesandfacilitiesassessed.id;


--
-- Name: assessment_report_sitevisitagenda; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_sitevisitagenda (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_sitevisitagenda OWNER TO postgres;

--
-- Name: assessment_report_sitevisitagenda_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_sitevisitagenda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_sitevisitagenda_id_seq OWNER TO postgres;

--
-- Name: assessment_report_sitevisitagenda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_sitevisitagenda_id_seq OWNED BY public.assessment_report_sitevisitagenda.id;


--
-- Name: assessment_report_stakeholdermeetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_stakeholdermeetings (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    text text,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_stakeholdermeetings OWNER TO postgres;

--
-- Name: assessment_report_stakeholdermeetings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_stakeholdermeetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_stakeholdermeetings_id_seq OWNER TO postgres;

--
-- Name: assessment_report_stakeholdermeetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_stakeholdermeetings_id_seq OWNED BY public.assessment_report_stakeholdermeetings.id;


--
-- Name: assessment_report_stakeholdermeetingssummaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_stakeholdermeetingssummaries (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_stakeholdermeetingssummaries OWNER TO postgres;

--
-- Name: assessment_report_stakeholdermeetingssummaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_stakeholdermeetingssummaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_stakeholdermeetingssummaries_id_seq OWNER TO postgres;

--
-- Name: assessment_report_stakeholdermeetingssummaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_stakeholdermeetingssummaries_id_seq OWNED BY public.assessment_report_stakeholdermeetingssummaries.id;


--
-- Name: assessment_report_suppliersoverview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_report_suppliersoverview (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    text text,
    marked_as_completed boolean NOT NULL,
    assessment_report_id integer NOT NULL
);


ALTER TABLE public.assessment_report_suppliersoverview OWNER TO postgres;

--
-- Name: assessment_report_suppliersoverview_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_report_suppliersoverview_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_report_suppliersoverview_id_seq OWNER TO postgres;

--
-- Name: assessment_report_suppliersoverview_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_report_suppliersoverview_id_seq OWNED BY public.assessment_report_suppliersoverview.id;


--
-- Name: assurance_process_assuranceprocess; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_assuranceprocess (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    supplier_organisation_id integer,
    lead_assessor_id integer,
    public_id character varying(255) NOT NULL,
    signed_ca_id integer,
    signed_loc_id integer,
    bettercoal_claim character varying(200) NOT NULL,
    has_regional_offices boolean,
    has_port_storage_facilities boolean,
    has_transportation_infrastructure boolean
);


ALTER TABLE public.assurance_process_assuranceprocess OWNER TO postgres;

--
-- Name: assurance_process_assuranceprocess_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_assuranceprocess_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_assuranceprocess_id_seq OWNER TO postgres;

--
-- Name: assurance_process_assuranceprocess_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_assuranceprocess_id_seq OWNED BY public.assurance_process_assuranceprocess.id;


--
-- Name: assurance_process_assuranceprocess_team_assessors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_assuranceprocess_team_assessors (
    id integer NOT NULL,
    assuranceprocess_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.assurance_process_assuranceprocess_team_assessors OWNER TO postgres;

--
-- Name: assurance_process_assuranceprocess_team_assessors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_assuranceprocess_team_assessors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_assuranceprocess_team_assessors_id_seq OWNER TO postgres;

--
-- Name: assurance_process_assuranceprocess_team_assessors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_assuranceprocess_team_assessors_id_seq OWNED BY public.assurance_process_assuranceprocess_team_assessors.id;


--
-- Name: assurance_process_invitationtoken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_invitationtoken (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    token character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    is_used boolean NOT NULL
);


ALTER TABLE public.assurance_process_invitationtoken OWNER TO postgres;

--
-- Name: assurance_process_minesite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_minesite (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    address character varying(1023),
    assurance_process_id integer NOT NULL,
    public_id character varying(255) NOT NULL,
    type_of_coal character varying(44) NOT NULL,
    country character varying(2),
    type_of_mine character varying(255) NOT NULL,
    latitude numeric(16,10) NOT NULL,
    longitude numeric(16,10) NOT NULL,
    certifications character varying(179) NOT NULL,
    estimated_years_mine_lifetime integer NOT NULL,
    has_expansion_plan_within_5_years character varying(255) NOT NULL,
    mine_start_date integer NOT NULL,
    other_certifications character varying(255) NOT NULL,
    is_coal_washing_undertaken character varying(255) NOT NULL,
    is_located_in_or_near_indigenous_peoples_territories character varying(255) NOT NULL,
    is_located_inside_cahra character varying(255) NOT NULL,
    nearby_local_communities text NOT NULL,
    number_of_contractors integer NOT NULL,
    number_of_fatalities_in_the_last_12_months integer NOT NULL,
    number_of_female_employees integer NOT NULL,
    number_of_male_employees integer NOT NULL,
    number_of_migrant_workers integer NOT NULL,
    number_of_severe_injuries_in_the_last_12_months integer NOT NULL,
    other_waste_disposal_methods character varying(255),
    production_per_year integer NOT NULL,
    proved_reserves text NOT NULL,
    shift_pattern character varying(255) NOT NULL,
    waste_disposal_methods character varying(99) NOT NULL,
    activities_performed_by_contractors character varying(113) NOT NULL,
    countries_of_origin_migrant_workers text,
    expansion_plan_resettlement_risk character varying(255) NOT NULL,
    exports_to_bettercoal_members character varying(255) NOT NULL,
    has_conservation_species_identified character varying(255) NOT NULL,
    has_conservation_species_identified_comments text,
    has_had_emergency_incidents_past_three_years character varying(255) NOT NULL,
    has_had_emergency_incidents_past_three_years_comments text,
    number_of_fatalities_in_the_last_12_months_comments text,
    number_of_severe_injuries_in_the_last_12_months_comments text,
    provides_worker_housing character varying(255) NOT NULL,
    within_or_near_high_conservation_areas character varying(255) NOT NULL,
    within_or_near_high_conservation_areas_comments text,
    is_within_site_assessment_scope boolean,
    CONSTRAINT assurance_process_mines_estimated_years_mine_li_47e4dd95_check CHECK ((estimated_years_mine_lifetime >= 0)),
    CONSTRAINT assurance_process_minesite_mine_start_date_dd21d7ab_check CHECK ((mine_start_date >= 0)),
    CONSTRAINT assurance_process_minesite_number_of_contractors_check CHECK ((number_of_contractors >= 0)),
    CONSTRAINT assurance_process_minesite_number_of_fatalities_in_the_la_check CHECK ((number_of_fatalities_in_the_last_12_months >= 0)),
    CONSTRAINT assurance_process_minesite_number_of_female_employees_check CHECK ((number_of_female_employees >= 0)),
    CONSTRAINT assurance_process_minesite_number_of_male_employees_check CHECK ((number_of_male_employees >= 0)),
    CONSTRAINT assurance_process_minesite_number_of_migrant_workers_check CHECK ((number_of_migrant_workers >= 0)),
    CONSTRAINT assurance_process_minesite_number_of_severe_injuries_in_t_check CHECK ((number_of_severe_injuries_in_the_last_12_months >= 0)),
    CONSTRAINT assurance_process_minesite_production_per_year_check CHECK ((production_per_year >= 0))
);


ALTER TABLE public.assurance_process_minesite OWNER TO postgres;

--
-- Name: assurance_process_minesite_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_minesite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_minesite_id_seq OWNER TO postgres;

--
-- Name: assurance_process_minesite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_minesite_id_seq OWNED BY public.assurance_process_minesite.id;


--
-- Name: assurance_process_portstoragefacility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_portstoragefacility (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    address character varying(1023),
    country character varying(2),
    number_of_fatalities_in_the_last_12_months integer NOT NULL,
    number_of_severe_injuries_in_the_last_12_months integer NOT NULL,
    number_of_male_employees integer NOT NULL,
    number_of_female_employees integer NOT NULL,
    number_of_contractors integer NOT NULL,
    number_of_migrant_workers integer NOT NULL,
    assurance_process_id integer NOT NULL,
    public_id character varying(255) NOT NULL,
    relation_to_mine_sites text,
    certifications character varying(179) NOT NULL,
    countries_of_origin_migrant_workers text,
    expansion_plan_resettlement_risk character varying(255) NOT NULL,
    has_conservation_species_identified character varying(255) NOT NULL,
    has_conservation_species_identified_comments text,
    has_expansion_plan_within_5_years character varying(255) NOT NULL,
    is_located_in_or_near_indigenous_peoples_territories character varying(255) NOT NULL,
    is_located_inside_cahra character varying(255) NOT NULL,
    nearby_local_communities text NOT NULL,
    number_of_fatalities_in_the_last_12_months_comments text,
    number_of_severe_injuries_in_the_last_12_months_comments text,
    other_certifications character varying(255) NOT NULL,
    within_or_near_high_conservation_areas character varying(255) NOT NULL,
    within_or_near_high_conservation_areas_comments text,
    is_within_site_assessment_scope boolean,
    CONSTRAINT assurance_process_stora_number_of_contractors_44897a8b_check CHECK ((number_of_contractors >= 0)),
    CONSTRAINT assurance_process_stora_number_of_fatalities_in_771145ad_check CHECK ((number_of_fatalities_in_the_last_12_months >= 0)),
    CONSTRAINT assurance_process_stora_number_of_female_employ_5fbfcfd6_check CHECK ((number_of_female_employees >= 0)),
    CONSTRAINT assurance_process_stora_number_of_male_employee_e6d8e5db_check CHECK ((number_of_male_employees >= 0)),
    CONSTRAINT assurance_process_stora_number_of_migrant_worke_5a74b22a_check CHECK ((number_of_migrant_workers >= 0)),
    CONSTRAINT assurance_process_stora_number_of_severe_injuri_df2788c3_check CHECK ((number_of_severe_injuries_in_the_last_12_months >= 0))
);


ALTER TABLE public.assurance_process_portstoragefacility OWNER TO postgres;

--
-- Name: assurance_process_portandstorage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_portandstorage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_portandstorage_id_seq OWNER TO postgres;

--
-- Name: assurance_process_portandstorage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_portandstorage_id_seq OWNED BY public.assurance_process_portstoragefacility.id;


--
-- Name: assurance_process_regionaloffice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_regionaloffice (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    phone_number character varying(255) NOT NULL,
    address character varying(1023),
    region character varying(255) NOT NULL,
    country character varying(2),
    timezone character varying(63) NOT NULL,
    assurance_process_id integer NOT NULL,
    public_id character varying(255) NOT NULL,
    website character varying(255),
    is_within_site_assessment_scope boolean
);


ALTER TABLE public.assurance_process_regionaloffice OWNER TO postgres;

--
-- Name: assurance_process_regionaloffice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_regionaloffice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_regionaloffice_id_seq OWNER TO postgres;

--
-- Name: assurance_process_regionaloffice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_regionaloffice_id_seq OWNED BY public.assurance_process_regionaloffice.id;


--
-- Name: assurance_process_supplierinvitationtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_supplierinvitationtoken_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_supplierinvitationtoken_id_seq OWNER TO postgres;

--
-- Name: assurance_process_supplierinvitationtoken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_supplierinvitationtoken_id_seq OWNED BY public.assurance_process_invitationtoken.id;


--
-- Name: assurance_process_transportationinfrastructure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assurance_process_transportationinfrastructure (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    type_of_transportation character varying(255),
    other_type_of_transportation character varying(255),
    name character varying(255) NOT NULL,
    address character varying(1023),
    country character varying(2),
    number_of_fatalities_in_the_last_12_months integer NOT NULL,
    number_of_severe_injuries_in_the_last_12_months integer NOT NULL,
    number_of_male_employees integer NOT NULL,
    number_of_female_employees integer NOT NULL,
    number_of_contractors integer NOT NULL,
    number_of_migrant_workers integer NOT NULL,
    assurance_process_id integer NOT NULL,
    public_id character varying(255) NOT NULL,
    relation_to_mine_sites text,
    certifications character varying(179) NOT NULL,
    countries_of_origin_migrant_workers text,
    expansion_plan_resettlement_risk character varying(255) NOT NULL,
    has_conservation_species_identified character varying(255) NOT NULL,
    has_conservation_species_identified_comments text,
    has_expansion_plan_within_5_years character varying(255) NOT NULL,
    is_located_in_or_near_indigenous_peoples_territories character varying(255) NOT NULL,
    is_located_inside_cahra character varying(255) NOT NULL,
    nearby_local_communities text NOT NULL,
    number_of_fatalities_in_the_last_12_months_comments text,
    number_of_severe_injuries_in_the_last_12_months_comments text,
    other_certifications character varying(255) NOT NULL,
    within_or_near_high_conservation_areas character varying(255) NOT NULL,
    within_or_near_high_conservation_areas_comments text,
    is_within_site_assessment_scope boolean,
    CONSTRAINT assurance_process_trans_number_of_contractors_13d40d31_check CHECK ((number_of_contractors >= 0)),
    CONSTRAINT assurance_process_trans_number_of_fatalities_in_e203b76e_check CHECK ((number_of_fatalities_in_the_last_12_months >= 0)),
    CONSTRAINT assurance_process_trans_number_of_female_employ_0a6c619f_check CHECK ((number_of_female_employees >= 0)),
    CONSTRAINT assurance_process_trans_number_of_male_employee_33179de3_check CHECK ((number_of_male_employees >= 0)),
    CONSTRAINT assurance_process_trans_number_of_migrant_worke_3fa68438_check CHECK ((number_of_migrant_workers >= 0)),
    CONSTRAINT assurance_process_trans_number_of_severe_injuri_d9bacb5f_check CHECK ((number_of_severe_injuries_in_the_last_12_months >= 0))
);


ALTER TABLE public.assurance_process_transportationinfrastructure OWNER TO postgres;

--
-- Name: assurance_process_transportationfacility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assurance_process_transportationfacility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assurance_process_transportationfacility_id_seq OWNER TO postgres;

--
-- Name: assurance_process_transportationfacility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assurance_process_transportationfacility_id_seq OWNED BY public.assurance_process_transportationinfrastructure.id;


--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_group_id_seq OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_group_id_seq OWNED BY public.auth_group.id;


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id integer NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_group_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_group_permissions_id_seq OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_group_permissions_id_seq OWNED BY public.auth_group_permissions.id;


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_permission_id_seq OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_permission_id_seq OWNED BY public.auth_permission.id;


--
-- Name: cip_cip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_cip (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    assurance_process_id integer NOT NULL
);


ALTER TABLE public.cip_cip OWNER TO postgres;

--
-- Name: cip_cip_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_cip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_cip_id_seq OWNER TO postgres;

--
-- Name: cip_cip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_cip_id_seq OWNED BY public.cip_cip.id;


--
-- Name: cip_cipfinding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_cipfinding (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    cip_id integer NOT NULL,
    finding_id integer NOT NULL,
    assessor_comments text,
    marked_as_completed boolean NOT NULL,
    responsible_party character varying(1023),
    supplier_response text,
    verification_method character varying(255),
    cip_monitoring_cycle_id integer,
    document_verification_deadline_period integer
);


ALTER TABLE public.cip_cipfinding OWNER TO postgres;

--
-- Name: cip_cipfinding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_cipfinding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_cipfinding_id_seq OWNER TO postgres;

--
-- Name: cip_cipfinding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_cipfinding_id_seq OWNED BY public.cip_cipfinding.id;


--
-- Name: cip_cipfindingstatushistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_cipfindingstatushistory (
    id integer NOT NULL,
    status character varying(255),
    reason character varying(1023),
    cip_finding_id integer NOT NULL,
    cip_monitoring_cycle_id integer NOT NULL,
    move_to_cycle_id integer,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL
);


ALTER TABLE public.cip_cipfindingstatushistory OWNER TO postgres;

--
-- Name: cip_cipfindingstatushistory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_cipfindingstatushistory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_cipfindingstatushistory_id_seq OWNER TO postgres;

--
-- Name: cip_cipfindingstatushistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_cipfindingstatushistory_id_seq OWNED BY public.cip_cipfindingstatushistory.id;


--
-- Name: cip_cipmonitoringcycle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_cipmonitoringcycle (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    cip_id integer NOT NULL,
    deadline_period_in_months integer
);


ALTER TABLE public.cip_cipmonitoringcycle OWNER TO postgres;

--
-- Name: cip_cipmonitoringcycle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_cipmonitoringcycle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_cipmonitoringcycle_id_seq OWNER TO postgres;

--
-- Name: cip_cipmonitoringcycle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_cipmonitoringcycle_id_seq OWNED BY public.cip_cipmonitoringcycle.id;


--
-- Name: cip_code_cipcategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_code_cipcategory (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    sequence_number integer,
    principle_id integer NOT NULL
);


ALTER TABLE public.cip_code_cipcategory OWNER TO postgres;

--
-- Name: cip_code_cipcodeversion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_code_cipcodeversion (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public.cip_code_cipcodeversion OWNER TO postgres;

--
-- Name: cip_code_cipcodeversion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_code_cipcodeversion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_code_cipcodeversion_id_seq OWNER TO postgres;

--
-- Name: cip_code_cipcodeversion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_code_cipcodeversion_id_seq OWNED BY public.cip_code_cipcodeversion.id;


--
-- Name: cip_code_cipprinciple; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_code_cipprinciple (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    sequence_number integer,
    code_version_id integer NOT NULL
);


ALTER TABLE public.cip_code_cipprinciple OWNER TO postgres;

--
-- Name: cip_code_cipprinciple_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_code_cipprinciple_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_code_cipprinciple_id_seq OWNER TO postgres;

--
-- Name: cip_code_cipprinciple_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_code_cipprinciple_id_seq OWNED BY public.cip_code_cipprinciple.id;


--
-- Name: cip_code_cipprovision; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cip_code_cipprovision (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    sequence_number integer,
    category_id integer NOT NULL,
    description text,
    rating_choices character varying(15) NOT NULL
);


ALTER TABLE public.cip_code_cipprovision OWNER TO postgres;

--
-- Name: cip_code_cipprovision_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_code_cipprovision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_code_cipprovision_id_seq OWNER TO postgres;

--
-- Name: cip_code_cipprovision_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_code_cipprovision_id_seq OWNED BY public.cip_code_cipprovision.id;


--
-- Name: cip_code_cipsection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cip_code_cipsection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cip_code_cipsection_id_seq OWNER TO postgres;

--
-- Name: cip_code_cipsection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cip_code_cipsection_id_seq OWNED BY public.cip_code_cipcategory.id;


--
-- Name: comment_comment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_comment (
    id integer NOT NULL,
    object_id integer NOT NULL,
    content text NOT NULL,
    posted timestamp with time zone NOT NULL,
    content_type_id integer NOT NULL,
    parent_id integer,
    user_id integer,
    edited timestamp with time zone NOT NULL,
    urlhash character varying(50) NOT NULL,
    email character varying(254) NOT NULL,
    CONSTRAINT comment_comment_object_id_check CHECK ((object_id >= 0))
);


ALTER TABLE public.comment_comment OWNER TO postgres;

--
-- Name: comment_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_comment_id_seq OWNER TO postgres;

--
-- Name: comment_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_comment_id_seq OWNED BY public.comment_comment.id;


--
-- Name: comment_flag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_flag (
    id integer NOT NULL,
    count integer NOT NULL,
    state smallint NOT NULL,
    comment_id integer NOT NULL,
    moderator_id integer,
    CONSTRAINT comment_flag_count_check CHECK ((count >= 0))
);


ALTER TABLE public.comment_flag OWNER TO postgres;

--
-- Name: comment_flag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_flag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_flag_id_seq OWNER TO postgres;

--
-- Name: comment_flag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_flag_id_seq OWNED BY public.comment_flag.id;


--
-- Name: comment_flaginstance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_flaginstance (
    id integer NOT NULL,
    info text,
    date_flagged timestamp with time zone NOT NULL,
    reason smallint NOT NULL,
    flag_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.comment_flaginstance OWNER TO postgres;

--
-- Name: comment_flaginstance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_flaginstance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_flaginstance_id_seq OWNER TO postgres;

--
-- Name: comment_flaginstance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_flaginstance_id_seq OWNED BY public.comment_flaginstance.id;


--
-- Name: comment_follower; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_follower (
    id integer NOT NULL,
    email character varying(254) NOT NULL,
    username character varying(50) NOT NULL,
    object_id integer NOT NULL,
    content_type_id integer NOT NULL,
    CONSTRAINT comment_follower_object_id_check CHECK ((object_id >= 0))
);


ALTER TABLE public.comment_follower OWNER TO postgres;

--
-- Name: comment_follower_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_follower_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_follower_id_seq OWNER TO postgres;

--
-- Name: comment_follower_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_follower_id_seq OWNED BY public.comment_follower.id;


--
-- Name: comment_reaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_reaction (
    id integer NOT NULL,
    likes integer NOT NULL,
    dislikes integer NOT NULL,
    comment_id integer NOT NULL,
    CONSTRAINT comment_reaction_dislikes_check CHECK ((dislikes >= 0)),
    CONSTRAINT comment_reaction_likes_check CHECK ((likes >= 0))
);


ALTER TABLE public.comment_reaction OWNER TO postgres;

--
-- Name: comment_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_reaction_id_seq OWNER TO postgres;

--
-- Name: comment_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_reaction_id_seq OWNED BY public.comment_reaction.id;


--
-- Name: comment_reactioninstance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_reactioninstance (
    id integer NOT NULL,
    reaction_type smallint NOT NULL,
    date_reacted timestamp with time zone NOT NULL,
    reaction_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.comment_reactioninstance OWNER TO postgres;

--
-- Name: comment_reactioninstance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_reactioninstance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_reactioninstance_id_seq OWNER TO postgres;

--
-- Name: comment_reactioninstance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_reactioninstance_id_seq OWNED BY public.comment_reactioninstance.id;


--
-- Name: common_document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.common_document (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    file character varying(100) NOT NULL,
    uploaded_by_id integer,
    public_id character varying(255),
    content_type_id integer,
    object_id integer,
    original_file_name character varying(255),
    assurance_process_id integer,
    document_type character varying(50) NOT NULL,
    CONSTRAINT common_document_object_id_check CHECK ((object_id >= 0))
);


ALTER TABLE public.common_document OWNER TO postgres;

--
-- Name: common_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.common_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.common_document_id_seq OWNER TO postgres;

--
-- Name: common_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.common_document_id_seq OWNED BY public.common_document.id;


--
-- Name: deadlines_actiondeadline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deadlines_actiondeadline (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    object_id integer NOT NULL,
    action_identifier character varying(255) NOT NULL,
    deadline_at date NOT NULL,
    content_type_id integer NOT NULL,
    CONSTRAINT deadlines_actiondeadline_object_id_check CHECK ((object_id >= 0))
);


ALTER TABLE public.deadlines_actiondeadline OWNER TO postgres;

--
-- Name: deadlines_actiondeadline_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deadlines_actiondeadline_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deadlines_actiondeadline_id_seq OWNER TO postgres;

--
-- Name: deadlines_actiondeadline_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deadlines_actiondeadline_id_seq OWNED BY public.deadlines_actiondeadline.id;


--
-- Name: deadlines_actiondeadlinereminder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deadlines_actiondeadlinereminder (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    status character varying(255),
    remind_at date NOT NULL,
    deadline_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.deadlines_actiondeadlinereminder OWNER TO postgres;

--
-- Name: deadlines_actiondeadlinereminder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deadlines_actiondeadlinereminder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deadlines_actiondeadlinereminder_id_seq OWNER TO postgres;

--
-- Name: deadlines_actiondeadlinereminder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deadlines_actiondeadlinereminder_id_seq OWNED BY public.deadlines_actiondeadlinereminder.id;


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.django_admin_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.django_admin_log_id_seq OWNER TO postgres;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.django_admin_log_id_seq OWNED BY public.django_admin_log.id;


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.django_content_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.django_content_type_id_seq OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.django_content_type_id_seq OWNED BY public.django_content_type.id;


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id integer NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.django_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.django_migrations_id_seq OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.django_migrations_id_seq OWNED BY public.django_migrations.id;


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- Name: django_site; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_site (
    id integer NOT NULL,
    domain character varying(100) NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.django_site OWNER TO postgres;

--
-- Name: django_site_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.django_site_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.django_site_id_seq OWNER TO postgres;

--
-- Name: django_site_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.django_site_id_seq OWNED BY public.django_site.id;


--
-- Name: otp_static_staticdevice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_static_staticdevice (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    confirmed boolean NOT NULL,
    user_id integer NOT NULL,
    throttling_failure_count integer NOT NULL,
    throttling_failure_timestamp timestamp with time zone,
    CONSTRAINT otp_static_staticdevice_throttling_failure_count_check CHECK ((throttling_failure_count >= 0))
);


ALTER TABLE public.otp_static_staticdevice OWNER TO postgres;

--
-- Name: otp_static_staticdevice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_static_staticdevice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_static_staticdevice_id_seq OWNER TO postgres;

--
-- Name: otp_static_staticdevice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_static_staticdevice_id_seq OWNED BY public.otp_static_staticdevice.id;


--
-- Name: otp_static_statictoken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_static_statictoken (
    id integer NOT NULL,
    token character varying(16) NOT NULL,
    device_id integer NOT NULL
);


ALTER TABLE public.otp_static_statictoken OWNER TO postgres;

--
-- Name: otp_static_statictoken_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_static_statictoken_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_static_statictoken_id_seq OWNER TO postgres;

--
-- Name: otp_static_statictoken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_static_statictoken_id_seq OWNED BY public.otp_static_statictoken.id;


--
-- Name: otp_totp_totpdevice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_totp_totpdevice (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    confirmed boolean NOT NULL,
    key character varying(80) NOT NULL,
    step smallint NOT NULL,
    t0 bigint NOT NULL,
    digits smallint NOT NULL,
    tolerance smallint NOT NULL,
    drift smallint NOT NULL,
    last_t bigint NOT NULL,
    user_id integer NOT NULL,
    throttling_failure_count integer NOT NULL,
    throttling_failure_timestamp timestamp with time zone,
    CONSTRAINT otp_totp_totpdevice_digits_check CHECK ((digits >= 0)),
    CONSTRAINT otp_totp_totpdevice_step_check CHECK ((step >= 0)),
    CONSTRAINT otp_totp_totpdevice_throttling_failure_count_check CHECK ((throttling_failure_count >= 0)),
    CONSTRAINT otp_totp_totpdevice_tolerance_check CHECK ((tolerance >= 0))
);


ALTER TABLE public.otp_totp_totpdevice OWNER TO postgres;

--
-- Name: otp_totp_totpdevice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_totp_totpdevice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_totp_totpdevice_id_seq OWNER TO postgres;

--
-- Name: otp_totp_totpdevice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_totp_totpdevice_id_seq OWNED BY public.otp_totp_totpdevice.id;


--
-- Name: socialaccount_socialaccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.socialaccount_socialaccount (
    id integer NOT NULL,
    provider character varying(30) NOT NULL,
    uid character varying(191) NOT NULL,
    last_login timestamp with time zone NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    extra_data text NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.socialaccount_socialaccount OWNER TO postgres;

--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.socialaccount_socialaccount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.socialaccount_socialaccount_id_seq OWNER TO postgres;

--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.socialaccount_socialaccount_id_seq OWNED BY public.socialaccount_socialaccount.id;


--
-- Name: socialaccount_socialapp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.socialaccount_socialapp (
    id integer NOT NULL,
    provider character varying(30) NOT NULL,
    name character varying(40) NOT NULL,
    client_id character varying(191) NOT NULL,
    secret character varying(191) NOT NULL,
    key character varying(191) NOT NULL
);


ALTER TABLE public.socialaccount_socialapp OWNER TO postgres;

--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.socialaccount_socialapp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.socialaccount_socialapp_id_seq OWNER TO postgres;

--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.socialaccount_socialapp_id_seq OWNED BY public.socialaccount_socialapp.id;


--
-- Name: socialaccount_socialapp_sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.socialaccount_socialapp_sites (
    id integer NOT NULL,
    socialapp_id integer NOT NULL,
    site_id integer NOT NULL
);


ALTER TABLE public.socialaccount_socialapp_sites OWNER TO postgres;

--
-- Name: socialaccount_socialapp_sites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.socialaccount_socialapp_sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.socialaccount_socialapp_sites_id_seq OWNER TO postgres;

--
-- Name: socialaccount_socialapp_sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.socialaccount_socialapp_sites_id_seq OWNED BY public.socialaccount_socialapp_sites.id;


--
-- Name: socialaccount_socialtoken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.socialaccount_socialtoken (
    id integer NOT NULL,
    token text NOT NULL,
    token_secret text NOT NULL,
    expires_at timestamp with time zone,
    account_id integer NOT NULL,
    app_id integer NOT NULL
);


ALTER TABLE public.socialaccount_socialtoken OWNER TO postgres;

--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.socialaccount_socialtoken_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.socialaccount_socialtoken_id_seq OWNER TO postgres;

--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.socialaccount_socialtoken_id_seq OWNED BY public.socialaccount_socialtoken.id;


--
-- Name: supplier_questionnaire_sqquestion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_questionnaire_sqquestion (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    text text NOT NULL,
    sq_category_id integer NOT NULL
);


ALTER TABLE public.supplier_questionnaire_sqquestion OWNER TO postgres;

--
-- Name: supplier_questionnaire_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_questionnaire_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_questionnaire_question_id_seq OWNER TO postgres;

--
-- Name: supplier_questionnaire_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_questionnaire_question_id_seq OWNED BY public.supplier_questionnaire_sqquestion.id;


--
-- Name: supplier_questionnaire_sqanswer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_questionnaire_sqanswer (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    value character varying(255) NOT NULL,
    sq_question_id integer NOT NULL,
    sq_category_response_id integer NOT NULL
);


ALTER TABLE public.supplier_questionnaire_sqanswer OWNER TO postgres;

--
-- Name: supplier_questionnaire_sqanswer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_questionnaire_sqanswer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_questionnaire_sqanswer_id_seq OWNER TO postgres;

--
-- Name: supplier_questionnaire_sqanswer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_questionnaire_sqanswer_id_seq OWNED BY public.supplier_questionnaire_sqanswer.id;


--
-- Name: supplier_questionnaire_sqcategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_questionnaire_sqcategory (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    desktop_evidence text NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.supplier_questionnaire_sqcategory OWNER TO postgres;

--
-- Name: supplier_questionnaire_sqcategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_questionnaire_sqcategory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_questionnaire_sqcategory_id_seq OWNER TO postgres;

--
-- Name: supplier_questionnaire_sqcategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_questionnaire_sqcategory_id_seq OWNED BY public.supplier_questionnaire_sqcategory.id;


--
-- Name: supplier_questionnaire_sqcategoryresponse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_questionnaire_sqcategoryresponse (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    comments text NOT NULL,
    marked_as_completed boolean NOT NULL,
    sq_category_id integer NOT NULL,
    last_submitted_by_id integer NOT NULL,
    mine_site_id integer NOT NULL
);


ALTER TABLE public.supplier_questionnaire_sqcategoryresponse OWNER TO postgres;

--
-- Name: supplier_questionnaire_sqcategoryresponse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_questionnaire_sqcategoryresponse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_questionnaire_sqcategoryresponse_id_seq OWNER TO postgres;

--
-- Name: supplier_questionnaire_sqcategoryresponse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_questionnaire_sqcategoryresponse_id_seq OWNED BY public.supplier_questionnaire_sqcategoryresponse.id;


--
-- Name: two_factor_phonedevice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.two_factor_phonedevice (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    confirmed boolean NOT NULL,
    number character varying(128) NOT NULL,
    key character varying(40) NOT NULL,
    method character varying(4) NOT NULL,
    user_id integer NOT NULL,
    throttling_failure_count integer NOT NULL,
    throttling_failure_timestamp timestamp with time zone,
    CONSTRAINT two_factor_phonedevice_throttling_failure_count_check CHECK ((throttling_failure_count >= 0))
);


ALTER TABLE public.two_factor_phonedevice OWNER TO postgres;

--
-- Name: two_factor_phonedevice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.two_factor_phonedevice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.two_factor_phonedevice_id_seq OWNER TO postgres;

--
-- Name: two_factor_phonedevice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.two_factor_phonedevice_id_seq OWNED BY public.two_factor_phonedevice.id;


--
-- Name: users_assessorprofile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_assessorprofile (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    can_be_lead_assessor boolean NOT NULL,
    user_id integer NOT NULL,
    biography text,
    direct_phone_number character varying(255),
    office_address character varying(255),
    office_address_country character varying(2),
    office_address_region character varying(255),
    timezone character varying(63),
    cv_id integer,
    current_organisation character varying(255),
    is_registration_completed boolean NOT NULL,
    signed_nda_id integer
);


ALTER TABLE public.users_assessorprofile OWNER TO postgres;

--
-- Name: users_assessorprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_assessorprofile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_assessorprofile_id_seq OWNER TO postgres;

--
-- Name: users_assessorprofile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_assessorprofile_id_seq OWNED BY public.users_assessorprofile.id;


--
-- Name: users_company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_company (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    company_name character varying(255) NOT NULL
);


ALTER TABLE public.users_company OWNER TO postgres;

--
-- Name: users_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_company_id_seq OWNER TO postgres;

--
-- Name: users_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_company_id_seq OWNED BY public.users_company.id;


--
-- Name: users_memberprofile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_memberprofile (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    is_registration_completed boolean NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.users_memberprofile OWNER TO postgres;

--
-- Name: users_memberprofile_assurance_processes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_memberprofile_assurance_processes (
    id integer NOT NULL,
    memberprofile_id integer NOT NULL,
    assuranceprocess_id integer NOT NULL
);


ALTER TABLE public.users_memberprofile_assurance_processes OWNER TO postgres;

--
-- Name: users_memberprofile_assurance_processes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_memberprofile_assurance_processes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_memberprofile_assurance_processes_id_seq OWNER TO postgres;

--
-- Name: users_memberprofile_assurance_processes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_memberprofile_assurance_processes_id_seq OWNED BY public.users_memberprofile_assurance_processes.id;


--
-- Name: users_memberprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_memberprofile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_memberprofile_id_seq OWNER TO postgres;

--
-- Name: users_memberprofile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_memberprofile_id_seq OWNED BY public.users_memberprofile.id;


--
-- Name: users_supplierorganisation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_supplierorganisation (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    coordinator_id integer,
    head_office_address character varying(255),
    head_office_address_region character varying(255),
    logo character varying(100),
    has_parent_company character varying(255),
    parent_company_address character varying(255),
    parent_company_address_region character varying(255),
    head_office_address_country character varying(2),
    parent_company_address_country character varying(2),
    head_office_timezone character varying(63),
    parent_company_timezone character varying(63),
    public_id character varying(255) NOT NULL,
    parent_company_name character varying(255)
);


ALTER TABLE public.users_supplierorganisation OWNER TO postgres;

--
-- Name: users_supplierorganisation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_supplierorganisation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_supplierorganisation_id_seq OWNER TO postgres;

--
-- Name: users_supplierorganisation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_supplierorganisation_id_seq OWNED BY public.users_supplierorganisation.id;


--
-- Name: users_supplierprofile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_supplierprofile (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    organisation_id integer NOT NULL,
    user_id integer NOT NULL,
    direct_phone_number character varying(255),
    role_or_position character varying(255),
    office_address character varying(255),
    office_address_region character varying(255),
    is_registration_completed boolean NOT NULL,
    timezone character varying(63),
    office_address_country character varying(2)
);


ALTER TABLE public.users_supplierprofile OWNER TO postgres;

--
-- Name: users_supplierprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_supplierprofile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_supplierprofile_id_seq OWNER TO postgres;

--
-- Name: users_supplierprofile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_supplierprofile_id_seq OWNED BY public.users_supplierprofile.id;


--
-- Name: users_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255),
    needs_to_set_password boolean NOT NULL,
    public_id character varying(255) NOT NULL,
    notifications_last_viewed_at timestamp with time zone,
    company_id integer
);


ALTER TABLE public.users_user OWNER TO postgres;

--
-- Name: users_user_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_user_groups (
    id integer NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.users_user_groups OWNER TO postgres;

--
-- Name: users_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_groups_id_seq OWNER TO postgres;

--
-- Name: users_user_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_groups_id_seq OWNED BY public.users_user_groups.id;


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users_user.id;


--
-- Name: users_user_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_user_user_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.users_user_user_permissions OWNER TO postgres;

--
-- Name: users_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_user_permissions_id_seq OWNER TO postgres;

--
-- Name: users_user_user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_user_permissions_id_seq OWNED BY public.users_user_user_permissions.id;


--
-- Name: account_emailaddress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailaddress ALTER COLUMN id SET DEFAULT nextval('public.account_emailaddress_id_seq'::regclass);


--
-- Name: account_emailconfirmation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailconfirmation ALTER COLUMN id SET DEFAULT nextval('public.account_emailconfirmation_id_seq'::regclass);


--
-- Name: actstream_action id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_action ALTER COLUMN id SET DEFAULT nextval('public.actstream_action_id_seq'::regclass);


--
-- Name: actstream_follow id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_follow ALTER COLUMN id SET DEFAULT nextval('public.actstream_follow_id_seq'::regclass);


--
-- Name: assessment_planning_assessmentplan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_planning_assessmentplan ALTER COLUMN id SET DEFAULT nextval('public.assessment_planning_assessmentplan_id_seq'::regclass);


--
-- Name: assessment_report_additional id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_additional ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_additional_id_seq'::regclass);


--
-- Name: assessment_report_assessmentlimitations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentlimitations ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_assessmentlimitations_id_seq'::regclass);


--
-- Name: assessment_report_assessmentmethodology id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentmethodology ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_assessmentmethodology_id_seq'::regclass);


--
-- Name: assessment_report_assessmentpurposeandscope id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentpurposeandscope ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_assessmentpurposeandscope_id_seq'::regclass);


--
-- Name: assessment_report_assessmentreport id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentreport ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_assessmentreport_id_seq'::regclass);


--
-- Name: assessment_report_conclusionandnextsteps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_conclusionandnextsteps ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_conclusionandnextsteps_id_seq'::regclass);


--
-- Name: assessment_report_countrycontext id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_countrycontext ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_countrycontext_id_seq'::regclass);


--
-- Name: assessment_report_disclaimer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_disclaimer ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_disclaimer_id_seq'::regclass);


--
-- Name: assessment_report_executivesummary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_executivesummary ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_executivesummary_id_seq'::regclass);


--
-- Name: assessment_report_finding id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_finding ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_finding_id_seq'::regclass);


--
-- Name: assessment_report_goodpractices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_goodpractices ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_goodpractices_id_seq'::regclass);


--
-- Name: assessment_report_immediateresolutions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_immediateresolutions ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_immediateresolutions_id_seq'::regclass);


--
-- Name: assessment_report_observer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_observer ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_observer_id_seq'::regclass);


--
-- Name: assessment_report_openingandclosingmeetingparticipants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_openingandclosingmeetingparticipants ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_openingandclosingmeetingparticipants_id_seq'::regclass);


--
-- Name: assessment_report_performancegaps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_performancegaps ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_performancegaps_id_seq'::regclass);


--
-- Name: assessment_report_provisionresponse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_provisionresponse ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_provisionresponse_id_seq'::regclass);


--
-- Name: assessment_report_sitesandfacilitiesassessed id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitesandfacilitiesassessed ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_sitesandfacilitiesassessed_id_seq'::regclass);


--
-- Name: assessment_report_sitevisitagenda id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitevisitagenda ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_sitevisitagenda_id_seq'::regclass);


--
-- Name: assessment_report_stakeholdermeetings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetings ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_stakeholdermeetings_id_seq'::regclass);


--
-- Name: assessment_report_stakeholdermeetingssummaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetingssummaries ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_stakeholdermeetingssummaries_id_seq'::regclass);


--
-- Name: assessment_report_suppliersoverview id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_suppliersoverview ALTER COLUMN id SET DEFAULT nextval('public.assessment_report_suppliersoverview_id_seq'::regclass);


--
-- Name: assurance_process_assuranceprocess id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_assuranceprocess_id_seq'::regclass);


--
-- Name: assurance_process_assuranceprocess_team_assessors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess_team_assessors ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_assuranceprocess_team_assessors_id_seq'::regclass);


--
-- Name: assurance_process_invitationtoken id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_invitationtoken ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_supplierinvitationtoken_id_seq'::regclass);


--
-- Name: assurance_process_minesite id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_minesite ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_minesite_id_seq'::regclass);


--
-- Name: assurance_process_portstoragefacility id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_portstoragefacility ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_portandstorage_id_seq'::regclass);


--
-- Name: assurance_process_regionaloffice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_regionaloffice ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_regionaloffice_id_seq'::regclass);


--
-- Name: assurance_process_transportationinfrastructure id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_transportationinfrastructure ALTER COLUMN id SET DEFAULT nextval('public.assurance_process_transportationfacility_id_seq'::regclass);


--
-- Name: auth_group id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group ALTER COLUMN id SET DEFAULT nextval('public.auth_group_id_seq'::regclass);


--
-- Name: auth_group_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions ALTER COLUMN id SET DEFAULT nextval('public.auth_group_permissions_id_seq'::regclass);


--
-- Name: auth_permission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission ALTER COLUMN id SET DEFAULT nextval('public.auth_permission_id_seq'::regclass);


--
-- Name: cip_cip id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cip ALTER COLUMN id SET DEFAULT nextval('public.cip_cip_id_seq'::regclass);


--
-- Name: cip_cipfinding id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding ALTER COLUMN id SET DEFAULT nextval('public.cip_cipfinding_id_seq'::regclass);


--
-- Name: cip_cipfindingstatushistory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfindingstatushistory ALTER COLUMN id SET DEFAULT nextval('public.cip_cipfindingstatushistory_id_seq'::regclass);


--
-- Name: cip_cipmonitoringcycle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipmonitoringcycle ALTER COLUMN id SET DEFAULT nextval('public.cip_cipmonitoringcycle_id_seq'::regclass);


--
-- Name: cip_code_cipcategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipcategory ALTER COLUMN id SET DEFAULT nextval('public.cip_code_cipsection_id_seq'::regclass);


--
-- Name: cip_code_cipcodeversion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipcodeversion ALTER COLUMN id SET DEFAULT nextval('public.cip_code_cipcodeversion_id_seq'::regclass);


--
-- Name: cip_code_cipprinciple id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipprinciple ALTER COLUMN id SET DEFAULT nextval('public.cip_code_cipprinciple_id_seq'::regclass);


--
-- Name: cip_code_cipprovision id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipprovision ALTER COLUMN id SET DEFAULT nextval('public.cip_code_cipprovision_id_seq'::regclass);


--
-- Name: comment_comment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_comment ALTER COLUMN id SET DEFAULT nextval('public.comment_comment_id_seq'::regclass);


--
-- Name: comment_flag id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flag ALTER COLUMN id SET DEFAULT nextval('public.comment_flag_id_seq'::regclass);


--
-- Name: comment_flaginstance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flaginstance ALTER COLUMN id SET DEFAULT nextval('public.comment_flaginstance_id_seq'::regclass);


--
-- Name: comment_follower id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_follower ALTER COLUMN id SET DEFAULT nextval('public.comment_follower_id_seq'::regclass);


--
-- Name: comment_reaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reaction ALTER COLUMN id SET DEFAULT nextval('public.comment_reaction_id_seq'::regclass);


--
-- Name: comment_reactioninstance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactioninstance ALTER COLUMN id SET DEFAULT nextval('public.comment_reactioninstance_id_seq'::regclass);


--
-- Name: common_document id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.common_document ALTER COLUMN id SET DEFAULT nextval('public.common_document_id_seq'::regclass);


--
-- Name: deadlines_actiondeadline id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadline ALTER COLUMN id SET DEFAULT nextval('public.deadlines_actiondeadline_id_seq'::regclass);


--
-- Name: deadlines_actiondeadlinereminder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadlinereminder ALTER COLUMN id SET DEFAULT nextval('public.deadlines_actiondeadlinereminder_id_seq'::regclass);


--
-- Name: django_admin_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log ALTER COLUMN id SET DEFAULT nextval('public.django_admin_log_id_seq'::regclass);


--
-- Name: django_content_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type ALTER COLUMN id SET DEFAULT nextval('public.django_content_type_id_seq'::regclass);


--
-- Name: django_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations ALTER COLUMN id SET DEFAULT nextval('public.django_migrations_id_seq'::regclass);


--
-- Name: django_site id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_site ALTER COLUMN id SET DEFAULT nextval('public.django_site_id_seq'::regclass);


--
-- Name: otp_static_staticdevice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_static_staticdevice ALTER COLUMN id SET DEFAULT nextval('public.otp_static_staticdevice_id_seq'::regclass);


--
-- Name: otp_static_statictoken id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_static_statictoken ALTER COLUMN id SET DEFAULT nextval('public.otp_static_statictoken_id_seq'::regclass);


--
-- Name: otp_totp_totpdevice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_totp_totpdevice ALTER COLUMN id SET DEFAULT nextval('public.otp_totp_totpdevice_id_seq'::regclass);


--
-- Name: socialaccount_socialaccount id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialaccount ALTER COLUMN id SET DEFAULT nextval('public.socialaccount_socialaccount_id_seq'::regclass);


--
-- Name: socialaccount_socialapp id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp ALTER COLUMN id SET DEFAULT nextval('public.socialaccount_socialapp_id_seq'::regclass);


--
-- Name: socialaccount_socialapp_sites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp_sites ALTER COLUMN id SET DEFAULT nextval('public.socialaccount_socialapp_sites_id_seq'::regclass);


--
-- Name: socialaccount_socialtoken id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialtoken ALTER COLUMN id SET DEFAULT nextval('public.socialaccount_socialtoken_id_seq'::regclass);


--
-- Name: supplier_questionnaire_sqanswer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqanswer ALTER COLUMN id SET DEFAULT nextval('public.supplier_questionnaire_sqanswer_id_seq'::regclass);


--
-- Name: supplier_questionnaire_sqcategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategory ALTER COLUMN id SET DEFAULT nextval('public.supplier_questionnaire_sqcategory_id_seq'::regclass);


--
-- Name: supplier_questionnaire_sqcategoryresponse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategoryresponse ALTER COLUMN id SET DEFAULT nextval('public.supplier_questionnaire_sqcategoryresponse_id_seq'::regclass);


--
-- Name: supplier_questionnaire_sqquestion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqquestion ALTER COLUMN id SET DEFAULT nextval('public.supplier_questionnaire_question_id_seq'::regclass);


--
-- Name: two_factor_phonedevice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.two_factor_phonedevice ALTER COLUMN id SET DEFAULT nextval('public.two_factor_phonedevice_id_seq'::regclass);


--
-- Name: users_assessorprofile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_assessorprofile ALTER COLUMN id SET DEFAULT nextval('public.users_assessorprofile_id_seq'::regclass);


--
-- Name: users_company id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_company ALTER COLUMN id SET DEFAULT nextval('public.users_company_id_seq'::regclass);


--
-- Name: users_memberprofile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile ALTER COLUMN id SET DEFAULT nextval('public.users_memberprofile_id_seq'::regclass);


--
-- Name: users_memberprofile_assurance_processes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile_assurance_processes ALTER COLUMN id SET DEFAULT nextval('public.users_memberprofile_assurance_processes_id_seq'::regclass);


--
-- Name: users_supplierorganisation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierorganisation ALTER COLUMN id SET DEFAULT nextval('public.users_supplierorganisation_id_seq'::regclass);


--
-- Name: users_supplierprofile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierprofile ALTER COLUMN id SET DEFAULT nextval('public.users_supplierprofile_id_seq'::regclass);


--
-- Name: users_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user ALTER COLUMN id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: users_user_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_groups ALTER COLUMN id SET DEFAULT nextval('public.users_user_groups_id_seq'::regclass);


--
-- Name: users_user_user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_user_permissions ALTER COLUMN id SET DEFAULT nextval('public.users_user_user_permissions_id_seq'::regclass);


--
-- Data for Name: account_emailaddress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_emailaddress (id, email, verified, "primary", user_id) FROM stdin;
\.


--
-- Data for Name: account_emailconfirmation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_emailconfirmation (id, created, sent, key, email_address_id) FROM stdin;
\.


--
-- Data for Name: actstream_action; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actstream_action (id, actor_object_id, verb, description, target_object_id, action_object_object_id, "timestamp", public, action_object_content_type_id, actor_content_type_id, target_content_type_id) FROM stdin;
1	1	SUPPLIER_INVITED	\N	1	2	2024-07-17 12:12:25.3018+00	t	24	24	31
2	2	SIGNED_LOC_CA_UPLOADED	\N	1	\N	2024-07-17 12:21:50.457203+00	t	\N	24	31
3	2	OPERATIONS_INFORMATION_SUBMITTED	\N	1	\N	2024-07-17 12:23:38.769405+00	t	\N	24	31
5	1	ASSESSOR_INVITED	\N	\N	4	2024-07-17 12:44:51.227068+00	t	24	24	\N
6	1	ASSESSOR_ASSIGNED	\N	1	4	2024-07-17 12:47:12.948882+00	t	24	24	31
7	4	SITE_ASSESSMENT_SCOPE_SUBMITTED	\N	1	\N	2024-07-17 12:56:37.335962+00	t	\N	24	31
8	2	SUPPLIER_QUESTIONNAIRE_SUBMITTED	\N	1	\N	2024-07-17 13:08:28.082529+00	t	\N	24	31
9	4	ASSESSMENT_PLAN_UPLOADED	\N	1	\N	2024-07-17 13:11:03.436781+00	t	\N	24	31
10	1	SUPPLIER_INVITED	\N	2	5	2024-07-18 08:44:23.259835+00	t	24	24	31
11	5	SIGNED_LOC_CA_UPLOADED	\N	2	\N	2024-07-18 08:46:57.425927+00	t	\N	24	31
12	5	OPERATIONS_INFORMATION_SUBMITTED	\N	2	\N	2024-07-18 08:49:42.060095+00	t	\N	24	31
13	1	ASSESSOR_ASSIGNED	\N	2	4	2024-07-18 08:50:10.597595+00	t	24	24	31
14	4	SITE_ASSESSMENT_SCOPE_SUBMITTED	\N	2	\N	2024-07-18 09:40:34.918714+00	t	\N	24	31
15	5	SUPPLIER_QUESTIONNAIRE_SUBMITTED	\N	2	\N	2024-07-18 10:48:48.086615+00	t	\N	24	31
16	4	ASSESSMENT_PLAN_UPLOADED	\N	2	\N	2024-07-18 10:50:19.906258+00	t	\N	24	31
\.


--
-- Data for Name: actstream_follow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actstream_follow (id, object_id, actor_only, started, content_type_id, user_id, flag) FROM stdin;
\.


--
-- Data for Name: assessment_planning_assessmentplan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_planning_assessmentplan (id, created, modified, assurance_process_id, completed_assessment_plan_id, draft_assessment_report_deadline, planned_site_assessment_end_date, planned_site_assessment_start_date) FROM stdin;
1	2024-07-17 13:11:03.361811+00	2024-07-17 13:11:03.376977+00	1	7	2024-09-04	2024-07-24	2024-07-17
2	2024-07-18 10:50:19.84449+00	2024-07-18 10:50:19.854736+00	2	16	2024-09-05	2024-07-25	2024-07-18
\.


--
-- Data for Name: assessment_report_additional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_additional (id, created, modified, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.278357+00	2024-07-17 12:12:25.27837+00	f	1
2	2024-07-18 08:44:23.237498+00	2024-07-18 08:44:23.237502+00	f	2
\.


--
-- Data for Name: assessment_report_assessmentlimitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_assessmentlimitations (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.23845+00	2024-07-17 12:12:25.238461+00	f	\N	1
2	2024-07-18 08:44:23.212959+00	2024-07-18 08:44:23.212963+00	f	\N	2
\.


--
-- Data for Name: assessment_report_assessmentmethodology; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_assessmentmethodology (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.226277+00	2024-07-17 12:12:25.226286+00	f	\N	1
2	2024-07-18 08:44:23.202614+00	2024-07-18 08:44:23.202618+00	f	\N	2
\.


--
-- Data for Name: assessment_report_assessmentpurposeandscope; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_assessmentpurposeandscope (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.217788+00	2024-07-17 12:12:25.217793+00	f	\N	1
2	2024-07-18 08:44:23.197196+00	2024-07-18 08:44:23.1972+00	f	\N	2
\.


--
-- Data for Name: assessment_report_assessmentreport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_assessmentreport (id, created, modified, assurance_process_id) FROM stdin;
1	2024-07-17 12:12:25.170131+00	2024-07-17 12:12:25.170143+00	1
2	2024-07-18 08:44:23.155001+00	2024-07-18 08:44:23.155006+00	2
\.


--
-- Data for Name: assessment_report_conclusionandnextsteps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_conclusionandnextsteps (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.247341+00	2024-07-17 12:12:25.247353+00	f	\N	1
2	2024-07-18 08:44:23.218214+00	2024-07-18 08:44:23.218218+00	f	\N	2
\.


--
-- Data for Name: assessment_report_countrycontext; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_countrycontext (id, created, modified, general, regulation, occupation_health_and_safety, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.19566+00	2024-07-17 12:12:25.195669+00	\N	\N	\N	f	1
2	2024-07-18 08:44:23.175997+00	2024-07-18 08:44:23.176001+00	\N	\N	\N	f	2
\.


--
-- Data for Name: assessment_report_disclaimer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_disclaimer (id, created, modified, text, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.17838+00	2024-07-17 13:49:50.226246+00	<h3 style="color:#ffffff; font-style:normal; text-align:start">Windows</h3>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:start">To use WeasyPrint on Windows, the easiest way is to use the&nbsp;executable&nbsp;of the latest release.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:start">If you want to use WeasyPrint as a Python library, you&rsquo;ll have to follow a few extra steps. Please read this chapter carefully.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:start">The first step is to install the latest version of Python from the&nbsp;Microsoft Store.</p>	t	1
2	2024-07-18 08:44:23.160238+00	2024-07-18 10:52:35.858872+00	<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><strong><strong>views.py:&nbsp;</strong></strong><span style="font-size:18px">This code is a part of a Django web application. It defines two view functions:</span></p>\r\n\r\n<ul style="margin-left:0px; margin-right:0px">\r\n\t<li style="text-align:left" value="1"><strong><strong>register</strong></strong><span style="font-size:18px">: This function handles user registration. It checks if the HTTP request method is POST, validates a user registration form, creates a new user account, and then redirects to the login page if the registration is successful.</span></li>\r\n\t<li style="text-align:left" value="2"><strong><strong>profile</strong></strong><span style="font-size:18px">: This function is a protected route that requires users to be logged in. It allows users to update their profile information. It handles both GET and POST requests, rendering a profile update form and processing the form data if the request method is POST. If the form data is valid, it updates the user&rsquo;s information and redirects back to the profile page with a success message.</span></li>\r\n</ul>	t	2
\.


--
-- Data for Name: assessment_report_executivesummary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_executivesummary (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
\.


--
-- Data for Name: assessment_report_finding; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_finding (id, created, modified, topic, summary, recommended_actions, marked_as_completed, provision_id, assessment_report_id, public_id) FROM stdin;
3	2024-07-19 10:45:14.68879+00	2024-07-19 10:45:14.688826+00	New Finding	\N	\N	f	1	2	KRJK88
1	2024-07-18 11:59:16.50828+00	2024-07-18 11:59:27.365558+00	New Finding	<h2 style="font-style:normal; margin-left:0px; margin-right:0px; text-align:center">What&rsquo;s Docker Desktop?</h2>\r\n\r\n<h3 style="color:#000000 !important; font-style:normal; margin-left:0px; margin-right:0px; text-align:center">The fastest way to containerize applications</h3>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Docker Desktop is secure, out-of-the-box containerization software offering developers and teams a robust, hybrid toolkit to build, share, and run applications anywhere.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Why developers love Docker</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Download the Total Economic Impact&trade; of Docker Business</p>	<h2 style="font-style:normal; margin-left:0px; margin-right:0px; text-align:center">What&rsquo;s Docker Desktop?</h2>\r\n\r\n<h3 style="color:#000000 !important; font-style:normal; margin-left:0px; margin-right:0px; text-align:center">The fastest way to containerize applications</h3>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Docker Desktop is secure, out-of-the-box containerization software offering developers and teams a robust, hybrid toolkit to build, share, and run applications anywhere.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Why developers love Docker</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Download the Total Economic Impact&trade; of Docker Business</p>	t	1	2	MD2NZB
2	2024-07-19 10:44:20.352992+00	2024-07-19 10:44:55.068993+00	New Finding	<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><span style="font-size:18px">Now let&rsquo;s understand the arguments&nbsp;</span></p>\r\n\r\n<ul style="margin-left:0px; margin-right:0px">\r\n\t<li style="text-align:left" value="1"><strong><strong>receiver&nbsp;</strong></strong><span style="font-size:18px">&ndash; The function who receives the signal and does something.</span></li>\r\n\t<li style="text-align:left" value="2"><strong><strong>sender&nbsp;</strong></strong><span style="font-size:18px">&ndash; Sends the signal</span></li>\r\n\t<li style="text-align:left" value="3"><strong><strong>created&nbsp;</strong></strong><span style="font-size:18px">&mdash; Checks whether the model is created or not</span></li>\r\n\t<li style="text-align:left" value="4"><strong><strong>instance&nbsp;</strong></strong><span style="font-size:18px">&mdash; created model instance</span></li>\r\n\t<li style="text-align:left" value="5"><strong><strong>**kwargs&nbsp;</strong></strong><span style="font-size:18px">&ndash;wildcard keyword arguments</span></li>\r\n</ul>\r\n\r\n<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><span style="font-size:18px">Another way to connect the signal with the function:</span></p>\r\n\r\n<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><span style="font-size:18px">You need to connect the signals file with the app.py file ready function in order to use them.&nbsp;</span></p>	<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><span style="font-size:18px">Now let&rsquo;s understand the arguments&nbsp;</span></p>\r\n\r\n<ul style="margin-left:0px; margin-right:0px">\r\n\t<li style="text-align:left" value="1"><strong><strong>receiver&nbsp;</strong></strong><span style="font-size:18px">&ndash; The function who receives the signal and does something.</span></li>\r\n\t<li style="text-align:left" value="2"><strong><strong>sender&nbsp;</strong></strong><span style="font-size:18px">&ndash; Sends the signal</span></li>\r\n\t<li style="text-align:left" value="3"><strong><strong>created&nbsp;</strong></strong><span style="font-size:18px">&mdash; Checks whether the model is created or not</span></li>\r\n\t<li style="text-align:left" value="4"><strong><strong>instance&nbsp;</strong></strong><span style="font-size:18px">&mdash; created model instance</span></li>\r\n\t<li style="text-align:left" value="5"><strong><strong>**kwargs&nbsp;</strong></strong><span style="font-size:18px">&ndash;wildcard keyword arguments</span></li>\r\n</ul>\r\n\r\n<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><span style="font-size:18px">Another way to connect the signal with the function:</span></p>\r\n\r\n<p dir="ltr" style="margin-left:0px; margin-right:0px; text-align:left"><span style="font-size:18px">You need to connect the signals file with the app.py file ready function in order to use them.&nbsp;</span></p>	t	1	2	CYHGY2
\.


--
-- Data for Name: assessment_report_goodpractices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_goodpractices (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.20072+00	2024-07-17 12:12:25.200725+00	f	\N	1
2	2024-07-18 08:44:23.181308+00	2024-07-18 08:44:23.181312+00	f	\N	2
\.


--
-- Data for Name: assessment_report_immediateresolutions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_immediateresolutions (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.206697+00	2024-07-17 12:12:25.206701+00	f	\N	1
2	2024-07-18 08:44:23.186777+00	2024-07-18 08:44:23.186781+00	f	\N	2
\.


--
-- Data for Name: assessment_report_observer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_observer (id, created, modified, marked_as_completed, name, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.184036+00	2024-07-17 12:12:25.184043+00	f	\N	1
2	2024-07-18 08:44:23.165886+00	2024-07-18 08:44:23.16589+00	f	\N	2
\.


--
-- Data for Name: assessment_report_openingandclosingmeetingparticipants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_openingandclosingmeetingparticipants (id, created, modified, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.272173+00	2024-07-17 12:12:25.272187+00	f	1
2	2024-07-18 08:44:23.23237+00	2024-07-18 08:44:23.232374+00	f	2
\.


--
-- Data for Name: assessment_report_performancegaps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_performancegaps (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
\.


--
-- Data for Name: assessment_report_provisionresponse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_provisionresponse (id, created, modified, rating, objective_evidence, key_findings, marked_as_completed, provision_id, not_applicable, assessment_report_id, analysis, reason_for_not_applicable) FROM stdin;
1	2024-07-18 11:58:14.988834+00	2024-07-19 10:45:32.735913+00	2.0	<h2 style="font-style:normal; margin-left:0px; margin-right:0px; text-align:center">What&rsquo;s Docker Desktop?</h2>\r\n\r\n<h3 style="color:#000000 !important; font-style:normal; margin-left:0px; margin-right:0px; text-align:center">The fastest way to containerize applications</h3>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Docker Desktop is secure, out-of-the-box containerization software offering developers and teams a robust, hybrid toolkit to build, share, and run applications anywhere.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Why developers love Docker</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Download the Total Economic Impact&trade; of Docker Business</p>	\N	t	1	f	2	<h2 style="font-style:normal; margin-left:0px; margin-right:0px; text-align:center">What&rsquo;s Docker Desktop?</h2>\r\n\r\n<h3 style="color:#000000 !important; font-style:normal; margin-left:0px; margin-right:0px; text-align:center">The fastest way to containerize applications</h3>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Docker Desktop is secure, out-of-the-box containerization software offering developers and teams a robust, hybrid toolkit to build, share, and run applications anywhere.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Why developers love Docker</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:center">Download the Total Economic Impact&trade; of Docker Business</p>	\N
\.


--
-- Data for Name: assessment_report_sitesandfacilitiesassessed; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_sitesandfacilitiesassessed (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.212342+00	2024-07-17 12:12:25.212347+00	f	\N	1
2	2024-07-18 08:44:23.191929+00	2024-07-18 08:44:23.191934+00	f	\N	2
\.


--
-- Data for Name: assessment_report_sitevisitagenda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_sitevisitagenda (id, created, modified, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.25427+00	2024-07-17 12:12:25.254279+00	f	1
2	2024-07-18 08:44:23.222975+00	2024-07-18 08:44:23.222979+00	f	2
\.


--
-- Data for Name: assessment_report_stakeholdermeetings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_stakeholdermeetings (id, created, modified, marked_as_completed, text, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.231878+00	2024-07-17 12:12:25.231888+00	f	\N	1
2	2024-07-18 08:44:23.207816+00	2024-07-18 08:44:23.207821+00	f	\N	2
\.


--
-- Data for Name: assessment_report_stakeholdermeetingssummaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_stakeholdermeetingssummaries (id, created, modified, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.261743+00	2024-07-17 12:12:25.261754+00	f	1
2	2024-07-18 08:44:23.227754+00	2024-07-18 08:44:23.227759+00	f	2
\.


--
-- Data for Name: assessment_report_suppliersoverview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_report_suppliersoverview (id, created, modified, text, marked_as_completed, assessment_report_id) FROM stdin;
1	2024-07-17 12:12:25.189479+00	2024-07-17 13:50:36.228859+00	<h3 style="color:#ffffff; font-style:normal; text-align:start">Windows</h3>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:start">To use WeasyPrint on Windows, the easiest way is to use the&nbsp;executable&nbsp;of the latest release.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:start">If you want to use WeasyPrint as a Python library, you&rsquo;ll have to follow a few extra steps. Please read this chapter carefully.</p>\r\n\r\n<p style="margin-left:0px; margin-right:0px; text-align:start">The first step is to install the latest version of Python from the&nbsp;Microsoft Store.</p>	f	1
2	2024-07-18 08:44:23.170607+00	2024-07-18 11:50:33.653767+00	<p>def _get_title_from_info_section_slug(self, info_section_slug: str) -&gt; str:<br />\r\n&nbsp;&nbsp;&nbsp; # Retrieve the verbose name from the model class<br />\r\n&nbsp;&nbsp;&nbsp; verbose_name = INFO_SECTION_FORM_LOOKUP[info_section_slug]._meta.model._meta.verbose_name.title()<br />\r\n&nbsp;&nbsp; &nbsp;<br />\r\n&nbsp;&nbsp;&nbsp; # Check if the verbose name is &#39;Suppliers Overview&#39; and return the appropriate title<br />\r\n&nbsp;&nbsp;&nbsp; if verbose_name == &#39;Suppliers Overview&#39;:<br />\r\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; return &#39;Producers Overview&#39;<br />\r\n&nbsp;&nbsp;&nbsp; return verbose_name</p>\r\n\r\n<p>&nbsp;</p>	t	2
\.


--
-- Data for Name: assurance_process_assuranceprocess; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_assuranceprocess (id, created, modified, supplier_organisation_id, lead_assessor_id, public_id, signed_ca_id, signed_loc_id, bettercoal_claim, has_regional_offices, has_port_storage_facilities, has_transportation_infrastructure) FROM stdin;
1	2024-07-17 12:12:25.161024+00	2024-07-17 12:47:12.933532+00	1	4	8MYW7J	\N	\N	Mine Site Level	f	f	f
2	2024-07-18 08:44:23.149254+00	2024-07-18 08:50:10.583986+00	2	4	GCN9MA	\N	\N	Organisation Level	f	f	f
\.


--
-- Data for Name: assurance_process_assuranceprocess_team_assessors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_assuranceprocess_team_assessors (id, assuranceprocess_id, user_id) FROM stdin;
\.


--
-- Data for Name: assurance_process_invitationtoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_invitationtoken (id, created, modified, token, email, is_used) FROM stdin;
1	2024-07-17 12:12:25.337+00	2024-07-17 12:12:58.06155+00	DHU8GXB9JXDB2D4B7W82	parolovo@mailinator.com	t
2	2024-07-17 12:25:52.762312+00	2024-07-17 12:30:33.708468+00	DSEGEF3AVQ6JN8C743BT	topoma@mailinator.com	t
3	2024-07-17 12:44:51.243258+00	2024-07-17 12:46:12.779787+00	3UV6JGWT8DKRZ4YTXCQ7	teja@mailinator.com	t
4	2024-07-18 08:44:23.278612+00	2024-07-18 08:45:37.695035+00	SR2ZGJGTVZU8KAQM7M5Q	nujo@mailinator.com	t
\.


--
-- Data for Name: assurance_process_minesite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_minesite (id, created, modified, name, address, assurance_process_id, public_id, type_of_coal, country, type_of_mine, latitude, longitude, certifications, estimated_years_mine_lifetime, has_expansion_plan_within_5_years, mine_start_date, other_certifications, is_coal_washing_undertaken, is_located_in_or_near_indigenous_peoples_territories, is_located_inside_cahra, nearby_local_communities, number_of_contractors, number_of_fatalities_in_the_last_12_months, number_of_female_employees, number_of_male_employees, number_of_migrant_workers, number_of_severe_injuries_in_the_last_12_months, other_waste_disposal_methods, production_per_year, proved_reserves, shift_pattern, waste_disposal_methods, activities_performed_by_contractors, countries_of_origin_migrant_workers, expansion_plan_resettlement_risk, exports_to_bettercoal_members, has_conservation_species_identified, has_conservation_species_identified_comments, has_had_emergency_incidents_past_three_years, has_had_emergency_incidents_past_three_years_comments, number_of_fatalities_in_the_last_12_months_comments, number_of_severe_injuries_in_the_last_12_months_comments, provides_worker_housing, within_or_near_high_conservation_areas, within_or_near_high_conservation_areas_comments, is_within_site_assessment_scope) FROM stdin;
1	2024-07-17 12:23:10.625352+00	2024-07-17 12:23:10.62537+00	Liberty Warner	Sunt sequi anim alias eaque culpa rerum ab qui id	1	8YNN2G	Sub-bituminous,Bituminous,Anthracite	MT	Open Cast	51.0000000000	79.0000000000	Health & Safety Management System - OSHAS 18001 - ISO 45 001,Quality Management System - ISO 9001,Energy Management System - ISO 50001	1983	No	1949	Est omnis sapiente aspernatur eum ad ut duis doloremque consequatur Sunt	Yes	No	No	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	332	456	545	160	676	98	Aut eum deserunt ea quasi officia labore deleniti excepteur velit incidunt	2014	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	Veniam ducimus et est quod assumenda ipsa do pariatur Doloremque numquam	Waste Rock Dumps,On-site waste burning	Security services	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	No	Not Sure	Other internationally or nationally protected/listed species (e.g. those protected under                 EU legislation, listed on national Red Lists, etc.),Migratory species,Not Applicable	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	Yes	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	No	IUCN protected area,UNESCO biosphere reserves,Ramsar (wetland) sites,Other internationally or nationally recognised protected areas,Not applicable	<h2 dir="auto">Define the project components</h2>\r\n\r\n<p>&nbsp;</p>\r\n\r\n<p dir="auto">For this project, you need to create a Dockerfile, a Python dependencies file, and a&nbsp;<code>docker-compose.yml</code>&nbsp;file. (You can use either a&nbsp;<code>.yml</code>&nbsp;or&nbsp;<code>.yaml</code>&nbsp;extension for this file.)</p>\r\n\r\n<ol dir="auto">\r\n\t<li>\r\n\t<p dir="auto">Create an empty project directory.</p>\r\n\r\n\t<p dir="auto">You can name the directory something easy for you to remember. This directory is the context for your application image. The directory should only contain resources to build that image.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Create a new file called&nbsp;<code>Dockerfile</code>&nbsp;in your project directory.</p>\r\n\r\n\t<p dir="auto">The Dockerfile defines an application&#39;s image content via one or more build commands that configure that image. Once built, you can run the image in a container. For more information on&nbsp;<code>Dockerfile</code>, see the&nbsp;Docker user guide&nbsp;and the&nbsp;Dockerfile reference.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p dir="auto">Add the following content to the&nbsp;<code>Dockerfile</code>.</p>\r\n\t</li>\r\n</ol>	t
3	2024-07-18 08:49:33.302348+00	2024-07-18 08:49:33.302369+00	Iris Lloyd	Aliquam et pariatur Recusandae Amet enim et pariatur Eius velit molestias rem	2	TX9JBK	Bituminous	YT	Underground	99.0000000000	89.0000000000	Environmental Management Systems - ISO 14001,Health & Safety Management System - OSHAS 18001 - ISO 45 001,Quality Management System - ISO 9001	2001	To Be Decided	1933	Asperiores fugiat reiciendis neque ducimus et ratione incididunt veniam quia doloremque aut adipisci distinctio Quis eaque	No	Yes	No	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	589	531	739	726	714	143	Occaecat consequatur Veniam maxime sequi quasi nihil anim	2005	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	Ipsa sint et inventore fuga Dolorem in sunt quaerat aperiam	On-site waste burning	Equipment and other repair services,Canteen,Other	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	Not Applicable	Not Sure	Other internationally or nationally protected/listed species (e.g. those protected under                 EU legislation, listed on national Red Lists, etc.)	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	No	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	Yes	IUCN protected area,Key Biodiversity Areas,Not applicable	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	t
2	2024-07-18 08:48:25.682831+00	2024-07-18 08:48:25.682861+00	Aquila Weber	Ea iste harum rerum alias saepe labore odio non ea odit repellendus Eos voluptatibus dolor aliquip dolores	2	FZ89S4	Sub-bituminous,Anthracite	LB	Underground	21.0000000000	21.0000000000	Quality Management System - ISO 9001	1985	To Be Decided	2006	Accusamus dolores laboris praesentium non quae error at do delectus vel	No	Yes	Yes	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	221	186	681	903	233	228	Culpa dolore tenetur esse ex accusamus	1994	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	Autem deserunt quis nesciunt labore illo itaque aut voluptatem dolor	On-site disposal by landfill,Off-site disposal	Mining activities,Equipment and other repair services,Security services,Logistics,Other	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	Not Applicable	Not Sure	Species listed as threatened by IUCN,Range-restricted/ endemic species	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	No	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	Yes	IUCN protected area,Ramsar (wetland) sites	<p>When Python is installed, you have to install Pango and its dependencies. The easiest way to install these libraries is to use MSYS2. Here are the steps you have to follow:</p>\r\n\r\n<ul>\r\n\t<li>\r\n\t<p>Install&nbsp;MSYS2&nbsp;keeping the default options.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>After installation, in MSYS2&rsquo;s shell, execute&nbsp;<code>pacman&nbsp;-S&nbsp;mingw-w64-x86_64-pango</code>.</p>\r\n\t</li>\r\n\t<li>\r\n\t<p>Close MSYS2&rsquo;s shell.</p>\r\n\t</li>\r\n</ul>	t
\.


--
-- Data for Name: assurance_process_portstoragefacility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_portstoragefacility (id, created, modified, name, address, country, number_of_fatalities_in_the_last_12_months, number_of_severe_injuries_in_the_last_12_months, number_of_male_employees, number_of_female_employees, number_of_contractors, number_of_migrant_workers, assurance_process_id, public_id, relation_to_mine_sites, certifications, countries_of_origin_migrant_workers, expansion_plan_resettlement_risk, has_conservation_species_identified, has_conservation_species_identified_comments, has_expansion_plan_within_5_years, is_located_in_or_near_indigenous_peoples_territories, is_located_inside_cahra, nearby_local_communities, number_of_fatalities_in_the_last_12_months_comments, number_of_severe_injuries_in_the_last_12_months_comments, other_certifications, within_or_near_high_conservation_areas, within_or_near_high_conservation_areas_comments, is_within_site_assessment_scope) FROM stdin;
\.


--
-- Data for Name: assurance_process_regionaloffice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_regionaloffice (id, created, modified, name, phone_number, address, region, country, timezone, assurance_process_id, public_id, website, is_within_site_assessment_scope) FROM stdin;
\.


--
-- Data for Name: assurance_process_transportationinfrastructure; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assurance_process_transportationinfrastructure (id, created, modified, type_of_transportation, other_type_of_transportation, name, address, country, number_of_fatalities_in_the_last_12_months, number_of_severe_injuries_in_the_last_12_months, number_of_male_employees, number_of_female_employees, number_of_contractors, number_of_migrant_workers, assurance_process_id, public_id, relation_to_mine_sites, certifications, countries_of_origin_migrant_workers, expansion_plan_resettlement_risk, has_conservation_species_identified, has_conservation_species_identified_comments, has_expansion_plan_within_5_years, is_located_in_or_near_indigenous_peoples_territories, is_located_inside_cahra, nearby_local_communities, number_of_fatalities_in_the_last_12_months_comments, number_of_severe_injuries_in_the_last_12_months_comments, other_certifications, within_or_near_high_conservation_areas, within_or_near_high_conservation_areas_comments, is_within_site_assessment_scope) FROM stdin;
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add permission	1	add_permission
2	Can change permission	1	change_permission
3	Can delete permission	1	delete_permission
4	Can view permission	1	view_permission
5	Can add group	2	add_group
6	Can change group	2	change_group
7	Can delete group	2	delete_group
8	Can view group	2	view_group
9	Can add content type	3	add_contenttype
10	Can change content type	3	change_contenttype
11	Can delete content type	3	delete_contenttype
12	Can view content type	3	view_contenttype
13	Can add session	4	add_session
14	Can change session	4	change_session
15	Can delete session	4	delete_session
16	Can view session	4	view_session
17	Can add site	5	add_site
18	Can change site	5	change_site
19	Can delete site	5	delete_site
20	Can view site	5	view_site
21	Can add log entry	6	add_logentry
22	Can change log entry	6	change_logentry
23	Can delete log entry	6	delete_logentry
24	Can view log entry	6	view_logentry
25	Can add comment	7	add_comment
26	Can change comment	7	change_comment
27	Can delete comment	7	delete_comment
28	Can view comment	7	view_comment
29	Can add reaction	8	add_reaction
30	Can change reaction	8	change_reaction
31	Can delete reaction	8	delete_reaction
32	Can view reaction	8	view_reaction
33	Can add reaction instance	9	add_reactioninstance
34	Can change reaction instance	9	change_reactioninstance
35	Can delete reaction instance	9	delete_reactioninstance
36	Can view reaction instance	9	view_reactioninstance
37	Can add flag	10	add_flag
38	Can change flag	10	change_flag
39	Can delete flag	10	delete_flag
40	Can view flag	10	view_flag
41	Can add flag instance	11	add_flaginstance
42	Can change flag instance	11	change_flaginstance
43	Can delete flag instance	11	delete_flaginstance
44	Can view flag instance	11	view_flaginstance
45	Can add follower	12	add_follower
46	Can change follower	12	change_follower
47	Can delete follower	12	delete_follower
48	Can view follower	12	view_follower
49	Can add email address	13	add_emailaddress
50	Can change email address	13	change_emailaddress
51	Can delete email address	13	delete_emailaddress
52	Can view email address	13	view_emailaddress
53	Can add email confirmation	14	add_emailconfirmation
54	Can change email confirmation	14	change_emailconfirmation
55	Can delete email confirmation	14	delete_emailconfirmation
56	Can view email confirmation	14	view_emailconfirmation
57	Can add social account	15	add_socialaccount
58	Can change social account	15	change_socialaccount
59	Can delete social account	15	delete_socialaccount
60	Can view social account	15	view_socialaccount
61	Can add social application	16	add_socialapp
62	Can change social application	16	change_socialapp
63	Can delete social application	16	delete_socialapp
64	Can view social application	16	view_socialapp
65	Can add social application token	17	add_socialtoken
66	Can change social application token	17	change_socialtoken
67	Can delete social application token	17	delete_socialtoken
68	Can view social application token	17	view_socialtoken
69	Can add action	18	add_action
70	Can change action	18	change_action
71	Can delete action	18	delete_action
72	Can view action	18	view_action
73	Can add follow	19	add_follow
74	Can change follow	19	change_follow
75	Can delete follow	19	delete_follow
76	Can view follow	19	view_follow
77	Can add static device	20	add_staticdevice
78	Can change static device	20	change_staticdevice
79	Can delete static device	20	delete_staticdevice
80	Can view static device	20	view_staticdevice
81	Can add static token	21	add_statictoken
82	Can change static token	21	change_statictoken
83	Can delete static token	21	delete_statictoken
84	Can view static token	21	view_statictoken
85	Can add TOTP device	22	add_totpdevice
86	Can change TOTP device	22	change_totpdevice
87	Can delete TOTP device	22	delete_totpdevice
88	Can view TOTP device	22	view_totpdevice
89	Can add phone device	23	add_phonedevice
90	Can change phone device	23	change_phonedevice
91	Can delete phone device	23	delete_phonedevice
92	Can view phone device	23	view_phonedevice
93	Can add user	24	add_user
94	Can change user	24	change_user
95	Can delete user	24	delete_user
96	Can view user	24	view_user
97	Can add supplier organisation	25	add_supplierorganisation
98	Can change supplier organisation	25	change_supplierorganisation
99	Can delete supplier organisation	25	delete_supplierorganisation
100	Can view supplier organisation	25	view_supplierorganisation
101	Can add supplier profile	26	add_supplierprofile
102	Can change supplier profile	26	change_supplierprofile
103	Can delete supplier profile	26	delete_supplierprofile
104	Can view supplier profile	26	view_supplierprofile
105	Can add assessor profile	27	add_assessorprofile
106	Can change assessor profile	27	change_assessorprofile
107	Can delete assessor profile	27	delete_assessorprofile
108	Can view assessor profile	27	view_assessorprofile
109	Can add company	28	add_company
110	Can change company	28	change_company
111	Can delete company	28	delete_company
112	Can view company	28	view_company
113	Can add member profile	29	add_memberprofile
114	Can change member profile	29	change_memberprofile
115	Can delete member profile	29	delete_memberprofile
116	Can view member profile	29	view_memberprofile
117	Can add document	30	add_document
118	Can change document	30	change_document
119	Can delete document	30	delete_document
120	Can view document	30	view_document
121	Can add assurance process	31	add_assuranceprocess
122	Can change assurance process	31	change_assuranceprocess
123	Can delete assurance process	31	delete_assuranceprocess
124	Can view assurance process	31	view_assuranceprocess
125	Can add mine site	32	add_minesite
126	Can change mine site	32	change_minesite
127	Can delete mine site	32	delete_minesite
128	Can view mine site	32	view_minesite
129	Can add invitation token	33	add_invitationtoken
130	Can change invitation token	33	change_invitationtoken
131	Can delete invitation token	33	delete_invitationtoken
132	Can view invitation token	33	view_invitationtoken
133	Can add transportation infrastructure	34	add_transportationinfrastructure
134	Can change transportation infrastructure	34	change_transportationinfrastructure
135	Can delete transportation infrastructure	34	delete_transportationinfrastructure
136	Can view transportation infrastructure	34	view_transportationinfrastructure
137	Can add regional office	35	add_regionaloffice
138	Can change regional office	35	change_regionaloffice
139	Can delete regional office	35	delete_regionaloffice
140	Can view regional office	35	view_regionaloffice
141	Can add port storage facility	36	add_portstoragefacility
142	Can change port storage facility	36	change_portstoragefacility
143	Can delete port storage facility	36	delete_portstoragefacility
144	Can view port storage facility	36	view_portstoragefacility
145	Can add assessment plan	37	add_assessmentplan
146	Can change assessment plan	37	change_assessmentplan
147	Can delete assessment plan	37	delete_assessmentplan
148	Can view assessment plan	37	view_assessmentplan
149	Can add assessment report	38	add_assessmentreport
150	Can change assessment report	38	change_assessmentreport
151	Can delete assessment report	38	delete_assessmentreport
152	Can view assessment report	38	view_assessmentreport
153	Can add provision response	39	add_provisionresponse
154	Can change provision response	39	change_provisionresponse
155	Can delete provision response	39	delete_provisionresponse
156	Can view provision response	39	view_provisionresponse
157	Can add finding	40	add_finding
158	Can change finding	40	change_finding
159	Can delete finding	40	delete_finding
160	Can view finding	40	view_finding
161	Can add suppliers overview	41	add_suppliersoverview
162	Can change suppliers overview	41	change_suppliersoverview
163	Can delete suppliers overview	41	delete_suppliersoverview
164	Can view suppliers overview	41	view_suppliersoverview
165	Can add disclaimer	42	add_disclaimer
166	Can change disclaimer	42	change_disclaimer
167	Can delete disclaimer	42	delete_disclaimer
168	Can view disclaimer	42	view_disclaimer
169	Can add country context	43	add_countrycontext
170	Can change country context	43	change_countrycontext
171	Can delete country context	43	delete_countrycontext
172	Can view country context	43	view_countrycontext
173	Can add observer	44	add_observer
174	Can change observer	44	change_observer
175	Can delete observer	44	delete_observer
176	Can view observer	44	view_observer
177	Can add stakeholder meetings	45	add_stakeholdermeetings
178	Can change stakeholder meetings	45	change_stakeholdermeetings
179	Can delete stakeholder meetings	45	delete_stakeholdermeetings
180	Can view stakeholder meetings	45	view_stakeholdermeetings
181	Can add sites and facilities assessed	46	add_sitesandfacilitiesassessed
182	Can change sites and facilities assessed	46	change_sitesandfacilitiesassessed
183	Can delete sites and facilities assessed	46	delete_sitesandfacilitiesassessed
184	Can view sites and facilities assessed	46	view_sitesandfacilitiesassessed
185	Can add performance gaps	47	add_performancegaps
186	Can change performance gaps	47	change_performancegaps
187	Can delete performance gaps	47	delete_performancegaps
188	Can view performance gaps	47	view_performancegaps
189	Can add immediate resolutions	48	add_immediateresolutions
190	Can change immediate resolutions	48	change_immediateresolutions
191	Can delete immediate resolutions	48	delete_immediateresolutions
192	Can view immediate resolutions	48	view_immediateresolutions
193	Can add good practices	49	add_goodpractices
194	Can change good practices	49	change_goodpractices
195	Can delete good practices	49	delete_goodpractices
196	Can view good practices	49	view_goodpractices
197	Can add executive summary	50	add_executivesummary
198	Can change executive summary	50	change_executivesummary
199	Can delete executive summary	50	delete_executivesummary
200	Can view executive summary	50	view_executivesummary
201	Can add conclusion and next steps	51	add_conclusionandnextsteps
202	Can change conclusion and next steps	51	change_conclusionandnextsteps
203	Can delete conclusion and next steps	51	delete_conclusionandnextsteps
204	Can view conclusion and next steps	51	view_conclusionandnextsteps
205	Can add assessment purpose and scope	52	add_assessmentpurposeandscope
206	Can change assessment purpose and scope	52	change_assessmentpurposeandscope
207	Can delete assessment purpose and scope	52	delete_assessmentpurposeandscope
208	Can view assessment purpose and scope	52	view_assessmentpurposeandscope
209	Can add assessment methodology	53	add_assessmentmethodology
210	Can change assessment methodology	53	change_assessmentmethodology
211	Can delete assessment methodology	53	delete_assessmentmethodology
212	Can view assessment methodology	53	view_assessmentmethodology
213	Can add assessment limitations	54	add_assessmentlimitations
214	Can change assessment limitations	54	change_assessmentlimitations
215	Can delete assessment limitations	54	delete_assessmentlimitations
216	Can view assessment limitations	54	view_assessmentlimitations
217	Can add site visit agenda	55	add_sitevisitagenda
218	Can change site visit agenda	55	change_sitevisitagenda
219	Can delete site visit agenda	55	delete_sitevisitagenda
220	Can view site visit agenda	55	view_sitevisitagenda
221	Can add stakeholder meetings summaries	56	add_stakeholdermeetingssummaries
222	Can change stakeholder meetings summaries	56	change_stakeholdermeetingssummaries
223	Can delete stakeholder meetings summaries	56	delete_stakeholdermeetingssummaries
224	Can view stakeholder meetings summaries	56	view_stakeholdermeetingssummaries
225	Can add opening and closing meeting participants	57	add_openingandclosingmeetingparticipants
226	Can change opening and closing meeting participants	57	change_openingandclosingmeetingparticipants
227	Can delete opening and closing meeting participants	57	delete_openingandclosingmeetingparticipants
228	Can view opening and closing meeting participants	57	view_openingandclosingmeetingparticipants
229	Can add additional	58	add_additional
230	Can change additional	58	change_additional
231	Can delete additional	58	delete_additional
232	Can view additional	58	view_additional
233	Can add cip code version	59	add_cipcodeversion
234	Can change cip code version	59	change_cipcodeversion
235	Can delete cip code version	59	delete_cipcodeversion
236	Can view cip code version	59	view_cipcodeversion
237	Can add cip principle	60	add_cipprinciple
238	Can change cip principle	60	change_cipprinciple
239	Can delete cip principle	60	delete_cipprinciple
240	Can view cip principle	60	view_cipprinciple
241	Can add cip provision	61	add_cipprovision
242	Can change cip provision	61	change_cipprovision
243	Can delete cip provision	61	delete_cipprovision
244	Can view cip provision	61	view_cipprovision
245	Can add cip category	62	add_cipcategory
246	Can change cip category	62	change_cipcategory
247	Can delete cip category	62	delete_cipcategory
248	Can view cip category	62	view_cipcategory
249	Can add cip	63	add_cip
250	Can change cip	63	change_cip
251	Can delete cip	63	delete_cip
252	Can view cip	63	view_cip
253	Can add cip finding	64	add_cipfinding
254	Can change cip finding	64	change_cipfinding
255	Can delete cip finding	64	delete_cipfinding
256	Can view cip finding	64	view_cipfinding
257	Can add cip monitoring cycle	65	add_cipmonitoringcycle
258	Can change cip monitoring cycle	65	change_cipmonitoringcycle
259	Can delete cip monitoring cycle	65	delete_cipmonitoringcycle
260	Can view cip monitoring cycle	65	view_cipmonitoringcycle
261	Can add cip finding status history	66	add_cipfindingstatushistory
262	Can change cip finding status history	66	change_cipfindingstatushistory
263	Can delete cip finding status history	66	delete_cipfindingstatushistory
264	Can view cip finding status history	66	view_cipfindingstatushistory
265	Can add sq category	67	add_sqcategory
266	Can change sq category	67	change_sqcategory
267	Can delete sq category	67	delete_sqcategory
268	Can view sq category	67	view_sqcategory
269	Can add sq answer	68	add_sqanswer
270	Can change sq answer	68	change_sqanswer
271	Can delete sq answer	68	delete_sqanswer
272	Can view sq answer	68	view_sqanswer
273	Can add sq category response	69	add_sqcategoryresponse
274	Can change sq category response	69	change_sqcategoryresponse
275	Can delete sq category response	69	delete_sqcategoryresponse
276	Can view sq category response	69	view_sqcategoryresponse
277	Can add sq question	70	add_sqquestion
278	Can change sq question	70	change_sqquestion
279	Can delete sq question	70	delete_sqquestion
280	Can view sq question	70	view_sqquestion
281	Can add action deadline	71	add_actiondeadline
282	Can change action deadline	71	change_actiondeadline
283	Can delete action deadline	71	delete_actiondeadline
284	Can view action deadline	71	view_actiondeadline
285	Can add action deadline reminder	72	add_actiondeadlinereminder
286	Can change action deadline reminder	72	change_actiondeadlinereminder
287	Can delete action deadline reminder	72	delete_actiondeadlinereminder
288	Can view action deadline reminder	72	view_actiondeadlinereminder
\.


--
-- Data for Name: cip_cip; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_cip (id, created, modified, assurance_process_id) FROM stdin;
1	2024-07-17 12:12:25.292576+00	2024-07-17 12:12:25.292587+00	1
2	2024-07-18 08:44:23.251162+00	2024-07-18 08:44:23.251167+00	2
\.


--
-- Data for Name: cip_cipfinding; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_cipfinding (id, created, modified, cip_id, finding_id, assessor_comments, marked_as_completed, responsible_party, supplier_response, verification_method, cip_monitoring_cycle_id, document_verification_deadline_period) FROM stdin;
1	2024-07-18 11:59:16.541194+00	2024-07-18 11:59:16.541204+00	2	1	\N	f	\N	\N	\N	\N	\N
2	2024-07-19 10:44:20.405359+00	2024-07-19 10:44:20.405377+00	2	2	\N	f	\N	\N	\N	\N	\N
3	2024-07-19 10:45:14.713072+00	2024-07-19 10:45:14.713082+00	2	3	\N	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: cip_cipfindingstatushistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_cipfindingstatushistory (id, status, reason, cip_finding_id, cip_monitoring_cycle_id, move_to_cycle_id, created, modified) FROM stdin;
\.


--
-- Data for Name: cip_cipmonitoringcycle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_cipmonitoringcycle (id, created, modified, cip_id, deadline_period_in_months) FROM stdin;
\.


--
-- Data for Name: cip_code_cipcategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_code_cipcategory (id, created, modified, name, sequence_number, principle_id) FROM stdin;
1	2024-07-17 13:00:27.843776+00	2024-07-17 13:00:27.843783+00	Legal Compliance	1	1
2	2024-07-17 13:00:27.849707+00	2024-07-17 13:00:27.849712+00	Anti-Corruption and Anti-Money Laundering	2	1
3	2024-07-17 13:00:27.851279+00	2024-07-17 13:00:27.851284+00	Whistle-Blowing Mechanism	3	1
4	2024-07-17 13:00:27.853006+00	2024-07-17 13:00:27.85301+00	Management Systems	1	2
5	2024-07-17 13:00:27.855165+00	2024-07-17 13:00:27.855169+00	Risk and Impact Assessments	2	2
6	2024-07-17 13:00:27.856544+00	2024-07-17 13:00:27.856548+00	Business Partners	3	2
7	2024-07-17 13:00:27.858814+00	2024-07-17 13:00:27.858818+00	Sustainability Reporting	1	3
8	2024-07-17 13:00:27.860191+00	2024-07-17 13:00:27.860195+00	Company Ownership and Payment Transparency	2	3
9	2024-07-17 13:00:27.862756+00	2024-07-17 13:00:27.86276+00	Mine Rehabilitation and Closure	1	4
10	2024-07-17 13:00:27.864464+00	2024-07-17 13:00:27.864468+00	Human Rights Due Diligence	1	5
11	2024-07-17 13:00:27.867242+00	2024-07-17 13:00:27.867252+00	Indigenous and Tribal Peoples	2	5
12	2024-07-17 13:00:27.869605+00	2024-07-17 13:00:27.86961+00	Women's Rights	3	5
13	2024-07-17 13:00:27.870928+00	2024-07-17 13:00:27.870932+00	Security Personnel	4	5
14	2024-07-17 13:00:27.872861+00	2024-07-17 13:00:27.872865+00	Conflict-Affected and High-Risk Areas	5	5
15	2024-07-17 13:00:27.876616+00	2024-07-17 13:00:27.87662+00	Employment Terms	1	6
16	2024-07-17 13:00:27.878034+00	2024-07-17 13:00:27.878038+00	Child Labour	2	6
17	2024-07-17 13:00:27.879553+00	2024-07-17 13:00:27.879557+00	Forced Labour	3	6
18	2024-07-17 13:00:27.881113+00	2024-07-17 13:00:27.881118+00	Freedom of Association and Collective Bargaining	4	6
19	2024-07-17 13:00:27.882679+00	2024-07-17 13:00:27.882683+00	Non-Discrimination	5	6
20	2024-07-17 13:00:27.884752+00	2024-07-17 13:00:27.884761+00	Disciplinary Practices and Harassment	6	6
21	2024-07-17 13:00:27.887196+00	2024-07-17 13:00:27.8872+00	Working Hours	7	6
22	2024-07-17 13:00:27.888538+00	2024-07-17 13:00:27.888542+00	Remuneration	8	6
23	2024-07-17 13:00:27.89047+00	2024-07-17 13:00:27.890474+00	Worker Grievance Mechanism	9	6
24	2024-07-17 13:00:27.892085+00	2024-07-17 13:00:27.892089+00	Management Systems	1	7
25	2024-07-17 13:00:27.894292+00	2024-07-17 13:00:27.894295+00	Workplace Hazards	2	7
26	2024-07-17 13:00:27.8964+00	2024-07-17 13:00:27.896404+00	Emergency Preparedness	3	7
27	2024-07-17 13:00:27.898424+00	2024-07-17 13:00:27.898428+00	Occupational Health and Safety Training and Communication	4	7
28	2024-07-17 13:00:27.901052+00	2024-07-17 13:00:27.901058+00	Accident and Incident Reporting	5	7
29	2024-07-17 13:00:27.903233+00	2024-07-17 13:00:27.903237+00	Worker Health and Wellbeing	6	7
30	2024-07-17 13:00:27.905933+00	2024-07-17 13:00:27.905938+00	Worker Housing	7	7
31	2024-07-17 13:00:27.908467+00	2024-07-17 13:00:27.908471+00	Stakeholder Engagement	1	8
32	2024-07-17 13:00:27.91125+00	2024-07-17 13:00:27.911254+00	Resettlement	2	8
33	2024-07-17 13:00:27.913757+00	2024-07-17 13:00:27.913761+00	Community Health and Safety	3	8
34	2024-07-17 13:00:27.916743+00	2024-07-17 13:00:27.916752+00	Sustainable Development	4	8
35	2024-07-17 13:00:27.919332+00	2024-07-17 13:00:27.919336+00	Operational-Level Grievance Mechanism	5	8
36	2024-07-17 13:00:27.920861+00	2024-07-17 13:00:27.920865+00	Cultural Heritage	6	8
37	2024-07-17 13:00:27.922657+00	2024-07-17 13:00:27.922661+00	Water Assessment	1	9
38	2024-07-17 13:00:27.924294+00	2024-07-17 13:00:27.924298+00	Water Management	2	9
39	2024-07-17 13:00:27.931858+00	2024-07-17 13:00:27.93187+00	Assessment	1	10
40	2024-07-17 13:00:27.949168+00	2024-07-17 13:00:27.949177+00	Management	2	10
41	2024-07-17 13:00:27.994508+00	2024-07-17 13:00:27.994514+00	Tailings Management	3	10
42	2024-07-17 13:00:27.997573+00	2024-07-17 13:00:27.997578+00	Greenhouse Gas Emissions Assessment	1	11
43	2024-07-17 13:00:28.003355+00	2024-07-17 13:00:28.003384+00	Greenhouse Gas Emissions Management	2	11
44	2024-07-17 13:00:28.011613+00	2024-07-17 13:00:28.011621+00	Biodiversity and Land Use Assessment	1	12
45	2024-07-17 13:00:28.014518+00	2024-07-17 13:00:28.014524+00	Biodiversity and Land Use Management	2	12
46	2024-07-17 13:00:28.017184+00	2024-07-17 13:00:28.017191+00	Designated and High Conservation Value Areas, Natural Habitats and Threatened Species	3	12
47	2024-07-17 13:00:28.021424+00	2024-07-17 13:00:28.021428+00	Invasive Alien Species	4	12
\.


--
-- Data for Name: cip_code_cipcodeversion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_code_cipcodeversion (id, created, modified, version) FROM stdin;
1	2024-07-17 13:00:27.827461+00	2024-07-17 13:00:27.827475+00	1
\.


--
-- Data for Name: cip_code_cipprinciple; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_code_cipprinciple (id, created, modified, name, sequence_number, code_version_id) FROM stdin;
1	2024-07-17 13:00:27.841382+00	2024-07-17 13:00:27.841393+00	Business Integrity	1	1
2	2024-07-17 13:00:27.852431+00	2024-07-17 13:00:27.852435+00	Policy & Management	2	1
3	2024-07-17 13:00:27.85828+00	2024-07-17 13:00:27.858285+00	Transparency	3	1
4	2024-07-17 13:00:27.862174+00	2024-07-17 13:00:27.862178+00	Mine Rehabilitation & Closure	4	1
5	2024-07-17 13:00:27.863915+00	2024-07-17 13:00:27.863919+00	Human Rights	5	1
6	2024-07-17 13:00:27.876089+00	2024-07-17 13:00:27.876093+00	Labour Rights	6	1
7	2024-07-17 13:00:27.891589+00	2024-07-17 13:00:27.891594+00	H&S	7	1
8	2024-07-17 13:00:27.907698+00	2024-07-17 13:00:27.907703+00	Communities and Stakeholders	8	1
9	2024-07-17 13:00:27.922083+00	2024-07-17 13:00:27.922086+00	Water Management	9	1
10	2024-07-17 13:00:27.926574+00	2024-07-17 13:00:27.926579+00	Management of Emissions and Waste	10	1
11	2024-07-17 13:00:27.996888+00	2024-07-17 13:00:27.996893+00	Greenhouse Gas Emissions	11	1
12	2024-07-17 13:00:28.010829+00	2024-07-17 13:00:28.010834+00	Biodiversity and Land Use	12	1
\.


--
-- Data for Name: cip_code_cipprovision; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cip_code_cipprovision (id, created, modified, sequence_number, category_id, description, rating_choices) FROM stdin;
1	2024-07-18 11:56:48.014449+00	2024-07-18 11:56:48.01446+00	1	1	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to maintain awareness of, and ensure compliance with, applicable standards, laws and regulations.	2.0,1.5,1.0,0.0
2	2024-07-18 11:56:48.0195+00	2024-07-18 11:56:48.019506+00	2	2	Companies will develop, document, and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code, to prohibit and prevent all forms of corruption, including bribery, bribe solicitation, facilitation payments and extortion, as well as money laundering, by employees, contractors, and business partners.	2.0,1.5,1.0,0.0
3	2024-07-18 11:56:48.020524+00	2024-07-18 11:56:48.02053+00	3	2	Companies will publicly disclose measures taken to prevent and fight all forms of corruption, including bribery, bribe solicitation, facilitation payments and extortion, as well as money laundering.	2.0,1.5,1.0,0.0
4	2024-07-18 11:56:48.021414+00	2024-07-18 11:56:48.021419+00	4	3	Companies will provide to employees and other stakeholders access to an effective ‘whistle-blowing’ mechanism for reporting concerns about actual or alleged malpractice, wrongdoing, or unethical, unsafe, illegal, or improper behaviour. Companies will ensure effective whistle-blower protection, including the right to keep whistle-blower identity confidential and will not tolerate any harassment, retaliation, victimisation, or discrimination of whistle-blowers.	2.0,1.5,1.0,0.0
5	2024-07-18 11:56:48.022445+00	2024-07-18 11:56:48.022452+00	1	4	Companies will develop, document and implement integrated and/or stand-alone management systems to effectively manage the Principles of the Bettercoal Code. The systems will incorporate, at a minimum, policies, procedures, clearly defined roles and responsibilities, financial and human resources, controls, monitoring protocols, training programmes, internal and external communication, and reporting requirements.	2.0,1.5,1.0,0.0
6	2024-07-18 11:56:48.023433+00	2024-07-18 11:56:48.023439+00	2	4	Companies' senior management will publicly endorse the policies relevant for the implementation of the Bettercoal Code and ensure they are reviewed and amended regularly, communicated to employees and other stakeholders, and made publicly available.	2.0,1.5,1.0,0.0
7	2024-07-18 11:56:48.024326+00	2024-07-18 11:56:48.024332+00	3	5	Companies will conduct and publicly disclose environmental, social and human rights risk and impact assessments in cases of new mining operations and significant changes to existing operations, that are:\na)\tcomprehensive;\nb)\tappropriate to the nature and scale of the mining operations; and\nc)\tcommensurate with the level of their environmental, social and human rights risks and impacts.	2.0,1.5,1.0,0.0
8	2024-07-18 11:56:48.025243+00	2024-07-18 11:56:48.025249+00	4	5	Companies will take into consideration the risks and impacts associated with their business partners’ operations and the liability arising from such business relationships when conducting their environmental, social and human rights risk and impact assessments.	2.0,1.5,1.0,0.0
9	2024-07-18 11:56:48.026054+00	2024-07-18 11:56:48.026061+00	5	5	Companies will engage affected communities and other stakeholders, including disadvantaged and vulnerable groups, in their environmental, social and human rights risk and impact assessments.	2.0,1.5,1.0,0.0
10	2024-07-18 11:56:48.026905+00	2024-07-18 11:56:48.02691+00	6	5	Companies will integrate gender considerations in their environmental, social, and human rights risk and impact assessments.	2.0,1.0,0.0
11	2024-07-18 11:56:48.027661+00	2024-07-18 11:56:48.027666+00	7	5	Companies will take appropriate action to avoid or minimise adverse impacts identified in their environmental, social and human rights risk and impact assessments and will prioritise those impacts that are, or would be, most severe, or where a delayed response would render them irremediable.	2.0,1.0,0.0
12	2024-07-18 11:56:48.028431+00	2024-07-18 11:56:48.028436+00	8	6	Companies will conduct Know Your Counterparty (KYC) checks on all of their business partners.	2.0,1.5,1.0,0.0
13	2024-07-18 11:56:48.029251+00	2024-07-18 11:56:48.029256+00	9	6	Companies will communicate to their business partners their environmental, social and governance commitments, including the Principles and Provisions covered in the Bettercoal Code.	2.0,1.5,1.0,0.0
14	2024-07-18 11:56:48.030036+00	2024-07-18 11:56:48.03004+00	10	6	Companies will require their contractors to develop, document and implement management systems that are aligned with the requirements of Provisions 2.1 and 2.2 of this Code and that cover the Principles of the Bettercoal Code.	2.0,1.5,1.0,0.0
15	2024-07-18 11:56:48.030804+00	2024-07-18 11:56:48.030809+00	11	6	Companies will communicate publicly and to their business partners their responsible supply chain policy with respect to sourcing from conflict-affected and high-risk areas as required by Provision 5.11.	2.0,1.5,1.0,0.0
16	2024-07-18 11:56:48.031564+00	2024-07-18 11:56:48.031568+00	12	6	Companies will conduct risk-based due diligence on their business partners to ensure responsible business practices and adherence to the Bettercoal Code.	2.0,1.5,1.0,0.0
17	2024-07-18 11:56:48.032315+00	2024-07-18 11:56:48.032319+00	1	7	Companies will publicly report annually on their environmental, social and governance performance for all material topics in alignment with internationally recognised reporting standards.	2.0,1.5,1.0,0.0
18	2024-07-18 11:56:48.033071+00	2024-07-18 11:56:48.033075+00	2	8	Companies will publicly disclose their ownership, including their beneficial ownership, according to internationally recognised disclosure standards.	2.0,1.0,0.0
19	2024-07-18 11:56:48.033893+00	2024-07-18 11:56:48.033897+00	3	8	Companies will publicly disclose annually all material payments, including taxes, made to the government of the countries in which they operate, in accordance with internationally recognised disclosure standards.	2.0,1.5,1.0,0.0
20	2024-07-18 11:56:48.034984+00	2024-07-18 11:56:48.034988+00	1	9	Companies will develop, regularly review and implement an integrated and comprehensive mine closure and rehabilitation plan for each mining operation covering environmental, social, economic and governance aspects including both progressive closure and final closure activities.	2.0,1.5,1.0,0.0
21	2024-07-18 11:56:48.035839+00	2024-07-18 11:56:48.035845+00	2	9	Companies will, in coordination with stakeholders, include in their mine closure and rehabilitation plan, activities to prepare workers and affected communities for the post-mining transition that help reduce the adverse impacts of social change.	2.0,1.5,1.0,0.0
22	2024-07-18 11:56:48.036687+00	2024-07-18 11:56:48.036693+00	3	9	Companies will include in their mine closure and rehabilitation plan specific closure objectives and success criteria, and will monitor and evaluate the effectiveness of the closure activities at meeting these objectives and criteria.	2.0,1.5,1.0,0.0
23	2024-07-18 11:56:48.037517+00	2024-07-18 11:56:48.037522+00	4	9	Companies will estimate and regularly review the costs associated with implementing their closure and rehabilitation plan, as required by Provision 4.1 of this Code, and will provide adequate financial, human, and other resources to meet the needs and requirements of the plan.	2.0,1.5,1.0,0.0
24	2024-07-18 11:56:48.038296+00	2024-07-18 11:56:48.038301+00	5	9	Companies will regularly engage affected stakeholders, including Indigenous and Tribal Peoples, farmers, landowners, businesses, artisanal and small-scale miners, workers, worker organisations, and regulators, regarding the mine closure and rehabilitation plan, in order to establish support for the mine closure plan as required by Provision 4.1 of this Code, and will, together with stakeholders, define the criteria for the successful implementation of the plan.	2.0,1.5,1.0,0.0
25	2024-07-18 11:56:48.039089+00	2024-07-18 11:56:48.039094+00	6	9	Companies will adopt best practice techniques to rehabilitate environments disturbed or occupied by mining activities in order to ensure continued access to water, and to avoid the need for long-term post-closure water treatment, especially for the treatment of acid rock drainage.	2.0,1.5,1.0,0.0
26	2024-07-18 11:56:48.040867+00	2024-07-18 11:56:48.040873+00	1	10	Companies will implement the UN Guiding Principles on Business and Human Rights in ways appropriate to their size and circumstances including at a minimum:\na)\tincorporating a policy commitment to respect human rights;\nb)\tconducting human rights due diligence, including identifying impacts arising from new mining operations or significant changes to existing operations as required by Provision 2.4 of this Code;\nc)\tdeveloping and implementing plans to prevent or mitigate human rights impacts;\nd)\taccounting for how they address their actual and potential impacts on human rights; \ne)\tproviding for or cooperating in timely remediation and compensation through legitimate processes where they have caused or contributed to adverse human rights impacts; and\nf)\tadopting a zero-tolerance policy against any threats, intimidation, violence, retaliation or reprisals against Human Rights Defenders or trade unions.	2.0,1.5,1.0,0.0
27	2024-07-18 11:56:48.042+00	2024-07-18 11:56:48.042006+00	2	10	Companies will engage with diverse stakeholders and participate in multi-sectoral initiatives addressing common issues on human rights where they exist, and will document and publicly report on their participation and progress.	2.0,1.0,0.0
28	2024-07-18 11:56:48.042758+00	2024-07-18 11:56:48.042762+00	3	11	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to ensure respect for the rights and interests of Indigenous and Tribal Peoples as articulated and defined in the ILO’s Indigenous and Tribal Peoples Convention, 1989 (No. 169) and the UN Declaration on the Rights of Indigenous Peoples.	2.0,1.5,1.0,0.0
29	2024-07-18 11:56:48.043509+00	2024-07-18 11:56:48.043515+00	4	11	Companies will identify actual and potential impacts on Indigenous and Tribal Peoples and their lands, territories and resources. Where their activities potentially impact Indigenous and Tribal Peoples, companies will develop and implement an Indigenous and Tribal Peoples engagement plan throughout the lifecycle of the mine.	2.0,1.5,1.0,0.0
30	2024-07-18 11:56:48.044338+00	2024-07-18 11:56:48.044342+00	5	11	Companies will respect the principles of Free, Prior and Informed Consent (FPIC) where new mining operations or major changes to existing operations affect Indigenous and Tribal Peoples’ lands, territories or resources, including:\na)\tsignificant impacts to lands, territories and natural resources subject to traditional, ancestral or customary ownership irrespective of recognition by the relevant state;\nb)\tthe physical or economic displacement of indigenous communities; \nc)\timpacts on places of indigenous cultural and spiritual significance or critical cultural heritage;\nd)\tthe use of cultural heritage or traditional knowledge for commercial purposes; and\ne)\tstorage or disposal of hazardous materials.	2.0,1.0,0.0
31	2024-07-18 11:56:48.04509+00	2024-07-18 11:56:48.045095+00	6	12	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code that ensure the rights and interests of women are respected in line with international standards including the UN Convention on the Elimination of All Forms of Discrimination against Women.	2.0,1.5,1.0,0.0
32	2024-07-18 11:56:48.045817+00	2024-07-18 11:56:48.045822+00	7	13	Companies will implement the Voluntary Principles on Security and Human Rights when they engage with public and private security providers.	2.0,1.5,1.0,0.0
33	2024-07-18 11:56:48.04652+00	2024-07-18 11:56:48.046525+00	8	13	Companies will regularly assess security risks and potential human rights impacts that may arise from security arrangements, and document the results.	2.0,1.5,1.0,0.0
34	2024-07-18 11:56:48.0472+00	2024-07-18 11:56:48.047204+00	9	13	Companies will ensure that security personnel receive regular training on human rights and operate in accordance with the Voluntary Principles on Security and Human Rights.	2.0,1.5,1.0,0.0
35	2024-07-18 11:56:48.047895+00	2024-07-18 11:56:48.0479+00	10	13	Companies will ensure that on-site security measures are gender-sensitive and non-intrusive, such that the dignity of employees is respected.	2.0,1.5,1.0,0.0
36	2024-07-18 11:56:48.048662+00	2024-07-18 11:56:48.048666+00	11	14	Companies will adopt and implement a responsible supply chain policy with respect to sourcing from conflict-affected and high-risk areas. The policy will be consistent at a minimum with Annex II of the OECD Due Diligence Guidance for Responsible Supply Chains of Minerals from Conflict-Affected and High-Risk Areas (OECD Guidance), and will be implemented through a due diligence system aligned with the OECD Guidance Annex I and with the requirements of Provisions 2.1 and 2.2 of this Code.	2.0,1.5,1.0,0.0
37	2024-07-18 11:56:48.049482+00	2024-07-18 11:56:48.049486+00	12	14	Companies will, in accordance with their responsible supply chain policy as required by Provision 5.11 of this Code, identify potential risks associated with the extracting, trading, handling, and exporting of minerals from conflict-affected and high-risk areas, through the identification of red flag locations of mineral origin and transit and supplier red flags listed in the OECD Guidance.	2.0,1.5,1.0,0.0
38	2024-07-18 11:56:48.050291+00	2024-07-18 11:56:48.050295+00	13	14	Companies will undertake enhanced due diligence measures if they identify the presence of any red flag locations of mineral origin and transit and/or supplier red flags as required by Provision 5.12 of this Code.	2.0,1.5,1.0,0.0
39	2024-07-18 11:56:48.051066+00	2024-07-18 11:56:48.05107+00	14	14	Companies will, if they assess the presence of risks of adverse impacts during the enhanced due diligence process as required by Provision 5.13, design and implement a strategy to respond to such risks.	2.0,1.5,1.0,0.0
40	2024-07-18 11:56:48.051844+00	2024-07-18 11:56:48.051848+00	15	14	Companies will publicly report annually on due diligence undertaken to ensure responsible mineral supply chains from conflict-affected and high-risk areas.	2.0,1.5,1.0,0.0
41	2024-07-18 11:56:48.052612+00	2024-07-18 11:56:48.052616+00	1	15	Companies will provide employees with clear information, including in writing and in their language, regarding their employment rights under national and local labour and employment law, and any applicable collective agreements, including information on their rights relating to working hours, wages, overtime, compensation, and benefits. Companies will provide employees with such information upon the beginning of the working relationship, when any material changes occur, and at any time on request.	2.0,1.5,1.0,0.0
42	2024-07-18 11:56:48.053382+00	2024-07-18 11:56:48.053386+00	2	15	Companies will fulfil their labour and social security obligations, and will not avoid doing so by using contracted labour or through the excessive use of fixed-term contracts instead of regular employment relationships.	2.0,1.5,1.0,0.0
43	2024-07-18 11:56:48.054132+00	2024-07-18 11:56:48.054136+00	3	15	Companies will develop a retrenchment plan to reduce the impacts of retrenchment on employees and ensure a just transition for employees affected by mine closure planning and/or prior to implementing any collective dismissals. The plan will:\na)\tbe developed in consultation with employees, workers’ organisations, and, where appropriate, the government;\nb)\tbe based on the principle of non-discrimination; and\nc)\tseek alternatives to retrenchment.	2.0,1.0,0.0
44	2024-07-18 11:56:48.054916+00	2024-07-18 11:56:48.05492+00	4	15	Companies will maintain employee records related to their employment conditions as allowed and required by applicable laws and industry good practice.	2.0,1.0,0.0
45	2024-07-18 11:56:48.055768+00	2024-07-18 11:56:48.055772+00	5	16	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to ensure they comply with minimum age standards and do not employ or allow children to work who are under the age of 15, the age for completing compulsory education, or the legal minimum age for employment in the country, whichever age is greatest in adherence to the ILO Minimum Age Convention, 1973 (No. 138).	2.0,1.0,0.0
46	2024-07-18 11:56:48.057049+00	2024-07-18 11:56:48.057053+00	6	16	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to prevent the Worst Forms of Child Labour including the exposure of employees under the age of 18 to hazardous work that is likely to compromise their health, safety and/or morals in adherence to the ILO Worst Forms of Child Labour Convention, 1999 (No. 182).	2.0,1.0,0.0
47	2024-07-18 11:56:48.057808+00	2024-07-18 11:56:48.057813+00	7	16	Companies will, if they discover that a child under the minimum age as required by Provision 6.5 of this Code, is performing work on their premises or on the premises of their business partners, undertake to:\na)\tremove the child immediately from his or her job; and\nb)\tdevelop and implement remediation procedures that provide the child with support in his or her transition to legal work or schooling, and take into consideration the welfare of the child and the financial situation of the child’s family.	2.0,1.5,1.0,0.0
48	2024-07-18 11:56:48.058558+00	2024-07-18 11:56:48.058562+00	8	17	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to not employ or in any way support or benefit from the use of any form of forced labour or modern slavery including prison, indentured, bonded, slave or other forms of forced labour, or participate in acts of human trafficking and/or sexual exploitation in adherence to the ILO Forced Labour Convention, 1930 (No. 29) and the ILO Abolition of Forced Labour Convention, 1957 (No. 105).	2.0,1.0,0.0
49	2024-07-18 11:56:48.059608+00	2024-07-18 11:56:48.059612+00	9	18	Companies will respect the right to freedom of association and will not prevent or discourage employees from electing employee representatives, or forming or joining workers’ organisations of their choosing in line with the ILO Freedom of Association and Protection of the Right to Organise Convention, 1948 (No. 87) and the ILO Right to Organise and Collective Bargaining Convention, 1949 (No. 98).	2.0,1.5,1.0,0.0
50	2024-07-18 11:56:48.060322+00	2024-07-18 11:56:48.060326+00	10	18	Companies will not discriminate or retaliate against employees who participate or seek to participate in workers’ organisations.	2.0,1.5,1.0,0.0
51	2024-07-18 11:56:48.061034+00	2024-07-18 11:56:48.061038+00	11	18	Companies will respect and support the right of employees to collective bargaining in line with the ILO Right to Organise and Collective Bargaining Convention, 1949 (No. 98) and adhere to collective bargaining agreements where such agreements exist. Companies will engage with their workers’ representatives and workers’ organisations and provide them with information necessary for meaningful negotiation in a timely manner.	2.0,1.5,1.0,0.0
52	2024-07-18 11:56:48.061746+00	2024-07-18 11:56:48.06175+00	12	18	Companies that operate in countries where the right to freedom of association and collective bargaining is restricted under law will support alternative means for independent free association and bargaining for employees.	2.0,1.5,1.0,0.0
53	2024-07-18 11:56:48.062452+00	2024-07-18 11:56:48.062456+00	13	19	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to provide equal opportunities for all employees, and will take measures to prevent discrimination in hiring, remuneration, access to promotion or training, termination or retirement based on personal characteristics unrelated to inherent job requirements at the workplace such as gender, ethnicity, race, religion, sexual orientation, age or any other condition that could give rise to discrimination in line with the ILO Equal Remuneration Convention, 1951 (No. 100) and ILO Discrimination (Employment and Occupation) Convention, 1958 (No. 111).	2.0,1.5,1.0,0.0
54	2024-07-18 11:56:48.063158+00	2024-07-18 11:56:48.063162+00	14	20	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to prevent and address harassment, intimidation, and/or exploitation in the workplace.	2.0,1.5,1.0,0.0
55	2024-07-18 11:56:48.063913+00	2024-07-18 11:56:48.06392+00	15	20	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to ensure employees are not subjected to any form or threat of corporal punishment, harsh or degrading treatment, sexual or physical harassment, mental, physical or verbal abuse, coercion or intimidation, or monetary fines as disciplinary measures.	2.0,1.5,1.0,0.0
56	2024-07-18 11:56:48.064793+00	2024-07-18 11:56:48.064798+00	16	21	Companies will apply normal working hours that comply with applicable laws. Where specific laws and regulations do not exist, working hours will not exceed, on a regular basis, a maximum of 48 hours per working week, in accordance with the ILO Hours of Work (Industry) Convention, 1919 (No.1).	2.0,1.5,1.0,0.0
57	2024-07-18 11:56:48.065632+00	2024-07-18 11:56:48.065637+00	17	21	Companies will ensure that overtime is voluntary and that the sum of regular and overtime hours will not exceed 60 hours per week or the maximum allowed by national or local law, whichever is less. Exceptions may be allowed in line with Provision 6.20 of this Code.	2.0,1.5,1.0,0.0
58	2024-07-18 11:56:48.066372+00	2024-07-18 11:56:48.066376+00	18	21	Companies will provide employees with all legally mandated leave, including maternity and paternity leave, compassionate leave, and paid annual leave. Where no applicable law exists, paid annual leave will be provided in accordance with the ILO Holidays with Pay Convention, 1970 (No. 132).	2.0,1.5,1.0,0.0
59	2024-07-18 11:56:48.067057+00	2024-07-18 11:56:48.067061+00	19	21	Companies will provide all employees with at least one rest day in seven consecutive working days in accordance with the ILO Weekly Rest (Industry) Convention, 1921 (No. 14). Exceptions may be allowed in line with Provision 6.20 of this Code.	2.0,1.5,1.0,0.0
60	2024-07-18 11:56:48.067739+00	2024-07-18 11:56:48.067743+00	2	21	Exceptions to the number of regular and overtime hours and provision of rest days are allowed in special circumstances, such as employees on a fly-in fly-out roster, and when there is a national law and freely negotiated collective bargaining agreement allowing higher limits and averaging of working time.	2.0,1.5,1.0,0.0
61	2024-07-18 11:56:48.068418+00	2024-07-18 11:56:48.068421+00	21	22	Companies will pay employees’ wages that meet or exceed whichever is the higher of applicable legal minimum wages, agreed through collective wage agreements or the prevailing industry standard.	2.0,1.5,1.0,0.0
62	2024-07-18 11:56:48.069141+00	2024-07-18 11:56:48.069145+00	22	22	Companies will determine the living wage in their country of operation in cooperation with stakeholders, and will develop, and where possible, implement a plan on payment of the living wage to all employees over time.	2.0,1.5,1.0,0.0
63	2024-07-18 11:56:48.069864+00	2024-07-18 11:56:48.069868+00	23	22	Companies will pay wages by a method that is reasonable for employees and in a timely manner.	2.0,1.5,1.0,0.0
64	2024-07-18 11:56:48.070616+00	2024-07-18 11:56:48.07062+00	24	22	Companies will provide equal pay for work of equal value.	2.0,1.5,1.0,0.0
65	2024-07-18 11:56:48.071347+00	2024-07-18 11:56:48.071351+00	25	22	Companies will pay employees a premium rate for work performed beyond the normal working hours in accordance with applicable laws.	2.0,1.5,1.0,0.0
66	2024-07-18 11:56:48.072075+00	2024-07-18 11:56:48.072079+00	26	23	Companies will develop and implement a gender-sensitive worker grievance mechanism that enables employees and their representative organisations, where they exist, to raise workplace concerns, including anonymously, via an accessible and transparent process covering all Principles of this Code and that is readily available to the most vulnerable persons, groups and organisations. Companies will ensure effective protection of workers who submit a grievance.	2.0,1.5,1.0,0.0
67	2024-07-18 11:56:48.073032+00	2024-07-18 11:56:48.073036+00	27	23	Companies will ensure that contracted workers are aware of and have access to the worker grievance mechanism described in Provision 6.26 of this Code.	2.0,1.5,1.0,0.0
68	2024-07-18 11:56:48.073922+00	2024-07-18 11:56:48.073926+00	1	24	Companies will:\na)\tdevelop, document and implement OHS systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code and applicable international standards, including the ILO’s occupational health and safety conventions, protocols and recommendations;\nb)\tappoint a senior management representative to be responsible for ensuring a safe and healthy workplace environment for all workers, and for implementing the health and safety requirements of the Bettercoal Code;\nc)\tadopt, implement and communicate an OHS policy endorsed and supported by appointed senior management representatives through designation of responsibility and allocation of resources; and\nd)\tregularly audit, review and monitor the OHS management systems.	2.0,1.5,1.0,0.0
69	2024-07-18 11:56:48.074779+00	2024-07-18 11:56:48.074783+00	2	25	Companies will, as part of the OHS systems described in Provision 7.1 of this Code, undertake and document an assessment to identify and assess the risks to the health and safety of all workers associated with their operations.	2.0,1.0,0.0
70	2024-07-18 11:56:48.075624+00	2024-07-18 11:56:48.075628+00	3	25	Companies will develop and implement a risk management plan that prioritises measures to eliminate significant hazards, and that outlines additional controls to minimise adverse impacts and to protect workers, visitors and others from remaining hazards.	2.0,1.0,0.0
71	2024-07-18 11:56:48.076491+00	2024-07-18 11:56:48.076495+00	4	25	Companies will ensure effective worker consultation and participation in matters relating to occupational health and safety, including health and safety risk identification and assessment.	2.0,1.0,0.0
72	2024-07-18 11:56:48.07736+00	2024-07-18 11:56:48.077364+00	5	25	Companies will identify the need for and provide appropriate personal protective equipment free of charge and ensure that it is current, in good condition, and worn correctly when required.	2.0,1.0,0.0
73	2024-07-18 11:56:48.078189+00	2024-07-18 11:56:48.078193+00	6	25	Companies will ensure workplaces and facilities are adequately constructed and maintained, and meet local building regulations.	2.0,1.0,0.0
74	2024-07-18 11:56:48.079073+00	2024-07-18 11:56:48.079079+00	7	25	Companies will provide appropriate safeguards to protect workers from all machinery including mobile equipment.	2.0,1.5,1.0,0.0
75	2024-07-18 11:56:48.079989+00	2024-07-18 11:56:48.079994+00	8	25	Companies will provide adequate lighting and ventilation, and ensure that workplace air quality and minimum and maximum temperatures meet industry-approved standards.	2.0,1.5,1.0,0.0
76	2024-07-18 11:56:48.080924+00	2024-07-18 11:56:48.08093+00	9	25	Companies will ensure safe noise levels through source reduction and minimisation and the provision of adequate personal protective equipment.	2.0,1.0,0.0
77	2024-07-18 11:56:48.081812+00	2024-07-18 11:56:48.081817+00	10	25	Companies will provide appropriate and functioning monitoring systems for emissions and accumulations of methane and other dangerous gases inside mines.	2.0,1.0,0.0
78	2024-07-18 11:56:48.082594+00	2024-07-18 11:56:48.082598+00	11	25	Companies will ensure adequate workplace hygiene at all times by providing safe and accessible potable drinking water, sanitary facilities for food consumption and storage, and clean and hygienic washing and toilet facilities commensurate with the number and gender of staff working on-site.	2.0,1.5,1.0,0.0
79	2024-07-18 11:56:48.083397+00	2024-07-18 11:56:48.083402+00	12	25	Companies will ensure adequate and appropriate labelling and storage of all chemicals and cleaning materials, training for all workers handling chemicals, and measures to protect workers from exposure to airborne particles and chemical fumes.	2.0,1.0,0.0
80	2024-07-18 11:56:48.084202+00	2024-07-18 11:56:48.084206+00	13	26	Companies will:\na)\testablish emergency procedures and evacuation plans for emergencies, including pandemics described in Provision 7.26;\nb)\tensure that the procedures and plans are accessible and clearly displayed throughout their facilities;\nc)\tmaintain and regularly test emergency procedures by holding evacuation drills;\nd)\tupdate emergency procedures periodically; and\ne)\tdevelop and maintain emergency response plans in collaboration with all relevant stakeholders, including local communities.	2.0,1.5,1.0,0.0
81	2024-07-18 11:56:48.08497+00	2024-07-18 11:56:48.084974+00	14	26	Companies will develop and implement plans to detect, prevent and combat the outbreak and spreading of fires, explosions and flooding in operational and abandoned mines.	2.0,1.0,0.0
82	2024-07-18 11:56:48.085687+00	2024-07-18 11:56:48.085691+00	15	26	Companies will install appropriate alarms, warning devices and fire safety mechanisms in all facilities including fire-fighting equipment, clearly marked and unblocked emergency exits and escape routes, and emergency lighting.	2.0,1.5,1.0,0.0
83	2024-07-18 11:56:48.086446+00	2024-07-18 11:56:48.08645+00	16	27	Companies will provide regular education and training so that workers are aware of:\na)\tspecific role-related health and safety risks and hazards; \nb)\tmethods for appropriate protection from such hazards including proper use of personal protective equipment; and\nc)\tappropriate action to take in the event of an accident or emergency. \nCompanies will make information about health and safety available to workers in an understandable form and in an appropriate language.	2.0,1.5,1.0,0.0
84	2024-07-18 11:56:48.087376+00	2024-07-18 11:56:48.08738+00	17	27	Companies will provide workers with a mechanism such as a joint health and safety committee through which they are able to raise and discuss health and safety issues with management.	2.0,1.5,1.0,0.0
85	2024-07-18 11:56:48.088216+00	2024-07-18 11:56:48.08822+00	18	27	Companies will ensure that workers understand that they have the right and responsibility to stop or refuse work in situations that have uncontrolled hazards, and that they must immediately bring these situations to the attention of those at imminent risk and to management. Companies will ensure that workers do not face reprisals including disciplinary measures, discharge or other negative consequences as a result of attempting to exercise these rights in good faith.	2.0,1.0,0.0
86	2024-07-18 11:56:48.089105+00	2024-07-18 11:56:48.089109+00	19	28	Companies will ensure that all health and safety incidents as well as their response to and outcome from such incidents are formally documented and investigated, and that the results of any investigations are fed into regular health and safety reviews and improvement plans, and, except for data subject to medical confidentiality, are available to workers.	2.0,1.5,1.0,0.0
87	2024-07-18 11:56:48.089992+00	2024-07-18 11:56:48.089997+00	2	28	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to ensure that workers’ health and safety representatives are able to participate in and receive outcomes of inspections and investigations conducted at the workplace by the company and/or by the competent authority, and will receive timely notice of accidents and dangerous occurrences.	2.0,1.0,0.0
88	2024-07-18 11:56:48.090746+00	2024-07-18 11:56:48.090751+00	21	29	Companies will provide access to adequate on-site health and medical facilities and clearly marked first-aid provisions, and will develop procedures for transportation of workers with more serious health concerns to local hospitals or medical facilities.	2.0,1.0,0.0
89	2024-07-18 11:56:48.091558+00	2024-07-18 11:56:48.091562+00	22	29	Companies will ensure that workers have periodic medical examinations and medical coverage. Companies will identify and monitor long-term health risks to workers.	2.0,1.0,0.0
90	2024-07-18 11:56:48.092273+00	2024-07-18 11:56:48.092277+00	23	29	Companies will prevent the exposure of pregnant and breastfeeding women to hazards and provide safe and appropriate working conditions for them.	2.0,1.0,0.0
91	2024-07-18 11:56:48.092979+00	2024-07-18 11:56:48.092983+00	24	29	Companies will take measures to ensure the physical, mental and social wellbeing of workers.	2.0,1.0,0.0
92	2024-07-18 11:56:48.093695+00	2024-07-18 11:56:48.0937+00	25	29	Companies will provide employees with timely compensation for the loss of earnings due to a work-related injury or occupational illness, unless that injury or illness is already covered by public or private disability insurance, until the employee can:\na)\treturn to work and be employed in an identical or similar position; or\nb)\tqualify for a disability pension if they are not able to return to work due to the severity of the work-related injury or occupational illness.\nCompensation will be in line with local regulations, where applicable.	2.0,1.5,1.0,0.0
93	2024-07-18 11:56:48.094445+00	2024-07-18 11:56:48.09445+00	26	29	Companies will protect workers and visitors in case of pandemics and global health emergencies by working in partnership with public health agencies, workers’ organisations and other relevant stakeholders.	2.0,1.5,1.0,0.0
94	2024-07-18 11:56:48.095224+00	2024-07-18 11:56:48.095228+00	27	30	Companies will ensure that housing provided to employees and contractors is maintained to a reasonable standard of safety, repair and hygiene.	2.0,1.5,1.0,0.0
95	2024-07-18 11:56:48.095963+00	2024-07-18 11:56:48.095968+00	1	31	Companies will identify groups and individuals including community members, Indigenous and Tribal Peoples, rights’ holders and other stakeholders who may be affected by or interested in their activities.	2.0,1.5,1.0,0.0
96	2024-07-18 11:56:48.096933+00	2024-07-18 11:56:48.096938+00	2	31	Companies will develop and implement a stakeholder engagement plan that is scaled to the operation’s risks, impacts and development stage, and tailored to the characteristics and interests of its various stakeholders including host governments, civil society, the private sector and the affected communities.	2.0,1.5,1.0,0.0
97	2024-07-18 11:56:48.097861+00	2024-07-18 11:56:48.097867+00	3	31	Companies will develop engagement processes in consultation with affected stakeholders that are accessible, inclusive, equitable, culturally appropriate, gender-sensitive and rights-compatible, and will demonstrate that efforts have been or are being taken to identify and remove barriers to engagement for affected stakeholders, especially the most vulnerable persons, groups and organisations.	2.0,1.5,1.0,0.0
98	2024-07-18 11:56:48.09866+00	2024-07-18 11:56:48.098665+00	4	31	Companies will begin engaging with stakeholders prior to or during the mine planning stage, and will continue stakeholder engagement throughout the lifecycle of the mine.	2.0,1.5,1.0,0.0
99	2024-07-18 11:56:48.09939+00	2024-07-18 11:56:48.099394+00	5	31	Companies will seek broad community support for their operations from affected local communities, and will demonstrate that this support is being maintained throughout the lifecycle of the mine.	2.0,1.5,1.0,0.0
100	2024-07-18 11:56:48.100221+00	2024-07-18 11:56:48.100225+00	6	32	Companies will avoid resettlement to the greatest extent possible. Where resettlement is being considered, companies will invest in a thorough search for alternative designs and locations for the mining operation. Companies will consult with stakeholders before irrevocable planning decisions are made and when the impact on affected communities may be mitigated.	2.0,1.0,0.0
101	2024-07-18 11:56:48.101066+00	2024-07-18 11:56:48.10107+00	7	32	Companies will, in the event of unavoidable resettlement, minimise the need for resettlement, implement appropriate measures to mitigate impacts on displaced persons and affected communities, provide compensation upon consultation with affected communities, and provide the option of return, where possible. Where there is to be any resettlement, companies will consult with those who may be affected at the individual household level.	2.0,1.5,1.0,0.0
102	2024-07-18 11:56:48.101897+00	2024-07-18 11:56:48.101901+00	8	32	Companies will develop and implement a resettlement action plan for physical displacement and a livelihood restoration plan for economic displacement. At a minimum, the plans will:\na)\tdescribe how affected communities will be involved in an ongoing process of consultation, including at the household level, throughout the resettlement/livelihood restoration planning, implementation and monitoring phases;\nb)\tdescribe the strategies to be undertaken to mitigate the impacts of displacement, to improve or restore livelihoods and standards of living of displaced people, paying particular attention to the needs of women, the poor, and vulnerable groups, and to improve living conditions among physically displaced persons through the provision of adequate housing with security of tenure at resettlement sites;\nc)\tdescribe development-related opportunities and benefits for affected people and communities;\nd)\tdescribe the methods used for the independent and professional valuation of land and other assets;\ne)\testablish the compensation framework in a transparent, consistent, and equitable manner; and\nf)\tbe publicly available.	2.0,1.5,1.0,0.0
103	2024-07-18 11:56:48.102745+00	2024-07-18 11:56:48.102749+00	9	33	Companies will identify the risks and impacts of their activities and operations on community health and safety, aligned with the requirements of Provisions 2.3 to 2.8 and Provision 7.26 of this Code, and will establish and monitor indicators of community health and safety in consultation with affected communities.	2.0,1.5,1.0,0.0
104	2024-07-18 11:56:48.103612+00	2024-07-18 11:56:48.103616+00	10	33	Companies will develop, document and implement measures to prevent and mitigate adverse impacts of their activities and operations on community health and safety, in consultation with affected communities.	2.0,1.5,1.0,0.0
105	2024-07-18 11:56:48.104459+00	2024-07-18 11:56:48.104463+00	11	34	Companies will integrate the UN Sustainable Development Goals into their risk and impact assessments, community development plans and continuous improvement work.	2.0,1.5,1.0,0.0
106	2024-07-18 11:56:48.105293+00	2024-07-18 11:56:48.105297+00	12	34	Companies will support the social, economic and institutional development of the communities in which they operate, including through participation and support in multi-stakeholder and community initiatives.	2.0,1.5,1.0,0.0
107	2024-07-18 11:56:48.106318+00	2024-07-18 11:56:48.106323+00	13	34	Companies will commit to promoting access to employment for local communities at all employment levels, and will provide training and professional education to enable access to these employment opportunities.	2.0,1.5,1.0,0.0
108	2024-07-18 11:56:48.10743+00	2024-07-18 11:56:48.107435+00	14	34	Companies will monitor and report on the effectiveness of their contributions, activities and initiatives, and evaluate if changes need to be made to them to ensure a positive impact on the social and economic wellbeing of local communities.	2.0,1.5,1.0,0.0
109	2024-07-18 11:56:48.108854+00	2024-07-18 11:56:48.108858+00	15	34	Companies will develop and implement a local procurement plan that:\na)\tsupports local businesses and communities to build capacity;\nb)\tprioritises sourcing goods and services from local suppliers on a competitive basis; and\nc)\treports on sourcing from local suppliers on an annual basis.	2.0,1.5,1.0,0.0
110	2024-07-18 11:56:48.11001+00	2024-07-18 11:56:48.110014+00	16	35	Companies will develop and implement an operational-level grievance mechanism for affected communities and other stakeholders that is culture- and gender-sensitive and that allows them to raise concerns, including anonymously, via an understandable, accessible and transparent process that is readily available to the most vulnerable persons, groups and organisations.	2.0,1.5,1.0,0.0
111	2024-07-18 11:56:48.111096+00	2024-07-18 11:56:48.111101+00	17	35	Companies will develop a grievance mechanism described in Provision 8.16 of this Code in consultation with the stakeholder groups for whose use the mechanism is intended, and will focus on dialogue as the means to address and resolve grievances.	2.0,1.0,0.0
112	2024-07-18 11:56:48.11248+00	2024-07-18 11:56:48.112485+00	18	35	Companies will respect the right of affected communities and other stakeholders to seek recourse for complaints related to the Company through mechanisms that include administrative, non-judicial or judicial remedies.	2.0,0.0
113	2024-07-18 11:56:48.11458+00	2024-07-18 11:56:48.114588+00	19	36	Companies will identify, document and protect cultural heritage within their area of influence and take action to avoid or remedy adverse impacts associated with their activities.	2.0,1.5,1.0,0.0
114	2024-07-18 11:56:48.115767+00	2024-07-18 11:56:48.115772+00	1	37	Companies will undertake and document a water assessment that: \na)\tidentifies and records their water withdrawal and use by source and type;\nb)\tdetermines the water-related risks in watersheds in their area of operation that takes into account at a minimum:  \ni.\tthe effect of their activities on the sustained functioning of the water catchment; \nii.\tthe implications of water withdrawal for other directly affected stakeholders’ access to and use of water;\niii.\tthe potential adverse impacts of water and effluent discharges on the ecological functioning and biodiversity in the area; and\niv.\twater quality, water stress and other shared water-related challenges in the catchment and public-private initiatives to address them. \nc)\tincludes consultation on the determination of risk with government, civil society, community groups and, where present, Indigenous Peoples groups.	2.0,1.0,0.0
115	2024-07-18 11:56:48.116664+00	2024-07-18 11:56:48.116668+00	2	37	Companies will combine the findings of their water assessments with other stakeholders and relevant water stewardship initiatives where present, to better understand and manage cumulative impacts in their area of influence.	2.0,1.5,1.0,0.0
116	2024-07-18 11:56:48.117535+00	2024-07-18 11:56:48.117539+00	3	38	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to manage the water-related risks identified in the assessment referred to in Provision 9.1 of this Code. The systems will: \na)\tensure controlled discharge of, and protect the quality of water in surrounding water courses, lakes and other bodies of water and access to these by local communities;\nb)\tbe developed in consultation with affected communities and stakeholders;\nc)\tapply to the full lifecycle of the mine;\nd)\tset, monitor and disclose targets to guide implementation activities and management objectives; \ne)\twhere appropriate, include communities in water monitoring programmes; and \nf)\tbe adjusted where necessary following regular review of the assessment referred to in Provision 9.1.	2.0,1.5,1.0,0.0
117	2024-07-18 11:56:48.118406+00	2024-07-18 11:56:48.11841+00	4	38	Companies will maintain a water balance at their operation and set and monitor targets for the efficient use of water.	2.0,1.5,1.0,0.0
118	2024-07-18 11:56:48.119414+00	2024-07-18 11:56:48.119418+00	5	38	Companies will implement a plan to prevent spills and leakage and the potential for contamination of water in the watershed. The plan will: \na)\tidentify all applicable structures, equipment and operating systems; \nb)\trequire regular inspections and testing of identified structures, equipment and operating systems; \nc)\tinclude requirements to document and implement corrective and preventive actions to ensure structures, equipment and operating systems are in working order; and \nd)\tmaintain records of incidents and preventive and corrective actions.	2.0,1.5,1.0,0.0
119	2024-07-18 11:56:48.120346+00	2024-07-18 11:56:48.12035+00	6	38	Companies will, as required by Provision 3.1 of this Code, report on the progress of their systems for managing water and to address the risks identified in the water assessment in Provision 9.1.	2.0,1.5,1.0,0.0
120	2024-07-18 11:56:48.121438+00	2024-07-18 11:56:48.121442+00	1	39	Companies will undertake and document an assessment to identify and assess the risks to communities and impacts on the environment associated with their operations’ generation of emissions and waste.	2.0,1.0,0.0
121	2024-07-18 11:56:48.122519+00	2024-07-18 11:56:48.122524+00	2	40	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to minimise and control mining-related pollutants to air and land in communities, and to the built and natural environment as identified in the assessment referred to in Provision 10.1 of this Code. The systems will: \na) \tbe developed in consultation with affected communities and stakeholders;\nb)\tapply to the full lifecycle of the mine;\nc) \tset targets to be monitored and disclosed; and\nd)\tbe adjusted where necessary following regular review of the assessment referred to in Provision 10.1.	2.0,1.0,0.0
122	2024-07-18 11:56:48.123684+00	2024-07-18 11:56:48.123688+00	3	40	Companies will ensure that existing and projected impoundments and containment facilities for the storage and management of mine-related waste and non-hazardous materials are planned, designed and operated in ways that the risks of environmental, health and safety impacts are appropriately assessed and managed throughout the lifecycle of the mine and after its closure.	2.0,1.5,1.0,0.0
123	2024-07-18 11:56:48.124706+00	2024-07-18 11:56:48.12471+00	4	40	Companies will develop and implement a plan to fully integrate dust control measures into operating procedures.	2.0,1.5,1.0,0.0
124	2024-07-18 11:56:48.1256+00	2024-07-18 11:56:48.125604+00	5	40	Companies will apply international standards, including, where applicable, prohibiting the manufacture, trade, transport and use of chemicals and hazardous substances that are subject to the terms and conditions of international treaties.	2.0,1.5,1.0,0.0
125	2024-07-18 11:56:48.126456+00	2024-07-18 11:56:48.12646+00	6	40	Companies will adopt alternatives to hazardous substances used in production processes wherever technically and economically viable, and will use the least environmentally harmful products available.	2.0,1.5,1.0,0.0
126	2024-07-18 11:56:48.127378+00	2024-07-18 11:56:48.127383+00	7	40	Companies will follow the waste management hierarchy.	2.0,1.5,1.0,0.0
127	2024-07-18 11:56:48.12825+00	2024-07-18 11:56:48.128255+00	8	40	Companies will identify historically accumulated contaminants associated with their operations, determine whether they are responsible for mitigation measures, and will take action to resolve their liabilities, including rehabilitation, in compliance with applicable law and industry best practices.	2.0,1.5,1.0,0.0
128	2024-07-18 11:56:48.129127+00	2024-07-18 11:56:48.129132+00	9	40	Companies will develop and implement a plan to reduce and manage the impacts of noise vibration and light from operating procedures on nearby communities.	2.0,1.5,1.0,0.0
129	2024-07-18 11:56:48.130114+00	2024-07-18 11:56:48.130121+00	10	40	Companies will implement a plan to prevent spills and leakage and the potential for contamination of air and/or soil. The plan will:\na) \tidentify all applicable structures, equipment and operating systems;\nb)\trequire regular inspections and testing of identified structures, equipment and operating systems;\nc) \tinclude requirements to document and implement corrective and preventive actions to ensure structures, equipment and operating systems are in working order; and\nd)\tmaintain records of incidents and preventive and corrective actions.	2.0,1.5,1.0,0.0
130	2024-07-18 11:56:48.131333+00	2024-07-18 11:56:48.131339+00	11	41	Companies will ensure that existing and projected tailings impoundments, dams and containment facilities are planned, designed and operated in alignment with international standards in ways that geotechnical risks and environmental, health and safety impacts are appropriately assessed and managed throughout the lifecycle of the mine and after its closure, by:\na)\testablishing structural stability;\nb)\tintroducing measures to prevent catastrophic failures;\nc)\tensuring controlled discharge and protection of the surrounding environment and local communities; and\nd)\timplementing appropriate mitigation or treatment if impacts are identified.	2.0,1.5,1.0,0.0
131	2024-07-18 11:56:48.132355+00	2024-07-18 11:56:48.13236+00	12	41	Companies will develop a tailings emergency response plan in consultation with stakeholders.	2.0,1.5,1.0,0.0
132	2024-07-18 11:56:48.133239+00	2024-07-18 11:56:48.133244+00	13	41	Companies will apply a policy that prohibits the discharge of production residues, tailings and waste rock to riverine, submarine and lake environments.	2.0,1.0,0.0
133	2024-07-18 11:56:48.134051+00	2024-07-18 11:56:48.134055+00	1	42	Companies will undertake and document an assessment that identifies and quantifies at least the Scope 1 and Scope 2 GHG emissions associated with their operations.	2.0,1.5,1.0,0.0
134	2024-07-18 11:56:48.134882+00	2024-07-18 11:56:48.134886+00	2	43	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to minimise and control the GHG emissions identified and quantified in the assessment referred to in Provision 11.1. The systems will: \na) \tapply to the full lifecycle of the mine;\nb)\tset, monitor and disclose energy efficiency and GHG emissions intensity reduction targets based on the mitigation hierarchy for Scope 1 and Scope 2 GHG emissions; and\nc) \tbe adjusted where necessary following regular review of the assessment referred to in Provision 11.1.	2.0,1.0,0.0
135	2024-07-18 11:56:48.135654+00	2024-07-18 11:56:48.135659+00	1	44	Companies will undertake and document a comprehensive assessment of the actual and potential direct and indirect risks and impacts of their activities on biodiversity, ecological functioning, ecosystem services and land use.	2.0,1.0,0.0
136	2024-07-18 11:56:48.136429+00	2024-07-18 11:56:48.136434+00	2	45	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to address the biodiversity, ecosystem services and land use impacts and risks identified in the assessment referred to in Provision 12.1. The systems will:\na)\tfollow the mitigation hierarchy;\nb)\tminimise the risk of subsidence from underground coal mining;\nc)\tbe developed in consultation with affected communities and stakeholders;\nd)\tapply to the full lifecycle of the mine; \ne)\tset targets to monitor performance; and\nf)\tbe adjusted where necessary following regular review of the assessment referred to in Provision 12.1.	2.0,1.5,1.0,0.0
137	2024-07-18 11:56:48.137264+00	2024-07-18 11:56:48.137268+00	3	45	Companies will publicly commit to achieve no net loss of biodiversity and strive to achieve a net gain of biodiversity.	2.0,1.5,1.0,0.0
138	2024-07-18 11:56:48.138173+00	2024-07-18 11:56:48.138178+00	4	46	Are you situated within or in close proximity of any officically designated High Conservation Value Area?	2.0,0.0
139	2024-07-18 11:56:48.139277+00	2024-07-18 11:56:48.139282+00	5	46	Are you situated near a World Heritage Site?	2.0,1.5,1.0,0.0
140	2024-07-18 11:56:48.140312+00	2024-07-18 11:56:48.140317+00	6	46	Have any threatened species been identified within the mine boundary?	2.0,1.0,0.0
141	2024-07-18 11:56:48.141332+00	2024-07-18 11:56:48.141336+00	7	46	Are there any wetlands within the mine boundary and/or area of influence?	2.0,1.0,0.0
142	2024-07-18 11:56:48.142323+00	2024-07-18 11:56:48.142328+00	8	46	Companies will not undertake any activity that will lead to, or is likely to lead to, the extinction of a species listed by the IUCN or on relevant national data lists as being threatened with extinction.	2.0,1.0,0.0
143	2024-07-18 11:56:48.143262+00	2024-07-18 11:56:48.143267+00	9	47	Companies will include in the scope of Provision 12.1 a documented assessment to:\na)\tidentify the potential of their business activities to deliberately or accidentally introduce alien invasive species; and\nb)\tevaluate the risks to biodiversity of any alien invasive species present or with the potential to be introduced to the areas where they operate.	2.0,1.5,1.0,0.0
144	2024-07-18 11:56:48.144153+00	2024-07-18 11:56:48.144158+00	10	47	Companies will develop, document and implement systems aligned with the requirements of Provisions 2.1 and 2.2 of this Code to prevent the introduction and/or the further spread of alien invasive species, and for the elimination of invasive alien species that have adverse impacts on biodiversity as identified in the assessment referred to in Provision 12.1 of this Code. The systems will:\na)\tset targets to monitor performance; and\nb)\tbe adjusted where necessary following regular review of the conclusions of the assessment referred to in Provision 12.1 of this Code.	2.0,1.5,1.0,0.0
\.


--
-- Data for Name: comment_comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_comment (id, object_id, content, posted, content_type_id, parent_id, user_id, edited, urlhash, email) FROM stdin;
\.


--
-- Data for Name: comment_flag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_flag (id, count, state, comment_id, moderator_id) FROM stdin;
\.


--
-- Data for Name: comment_flaginstance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_flaginstance (id, info, date_flagged, reason, flag_id, user_id) FROM stdin;
\.


--
-- Data for Name: comment_follower; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_follower (id, email, username, object_id, content_type_id) FROM stdin;
\.


--
-- Data for Name: comment_reaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_reaction (id, likes, dislikes, comment_id) FROM stdin;
\.


--
-- Data for Name: comment_reactioninstance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_reactioninstance (id, reaction_type, date_reacted, reaction_id, user_id) FROM stdin;
\.


--
-- Data for Name: common_document; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.common_document (id, created, modified, file, uploaded_by_id, public_id, content_type_id, object_id, original_file_name, assurance_process_id, document_type) FROM stdin;
1	2024-07-17 12:18:47.815708+00	2024-07-17 12:18:47.815729+00	Bettercoal_Letter_of_Commitment_EN2022_uSDxJ8v.docx	2	NT3A459DC6	\N	\N	Bettercoal_Letter_of Commitment_EN(2022).docx	\N	other
2	2024-07-17 12:18:55.069003+00	2024-07-17 12:18:55.069022+00	Bettercoal_Confidentiality_Agreement_2022_8AJTt7o.docx	2	Y92DVH7C7P	\N	\N	Bettercoal_Confidentiality_Agreement_2022.docx	\N	other
5	2024-07-17 12:46:24.442727+00	2024-07-17 12:46:24.442742+00	Bettercoal_Confidentiality_Agreement_for_Assessors_NDxZNgQ.pdf	4	ZCPKQYXNDP	\N	\N	Bettercoal_Confidentiality_Agreement_for_Assessors.pdf	\N	other
6	2024-07-17 13:02:27.464509+00	2024-07-17 13:02:30.093694+00	Bettercoal_Confidentiality_Agreement_for_Assessors_JWmKwQH.pdf	2	SPCA22D4HJ	69	2	Bettercoal_Confidentiality_Agreement_for_Assessors.pdf	1	other
7	2024-07-17 13:09:26.814028+00	2024-07-17 13:09:26.814071+00	assessment_plan_template_jfvOYfG.docx	4	WTVVNGR7VF	\N	\N	assessment_plan_template.docx	\N	other
8	2024-07-18 08:46:37.594305+00	2024-07-18 08:46:37.594335+00	Bettercoal_Letter_of_Commitment_EN2022_enpIWqp.docx	5	T7JCVMK5F4	\N	\N	Bettercoal_Letter_of Commitment_EN(2022).docx	\N	other
9	2024-07-18 08:46:46.069046+00	2024-07-18 08:46:46.069077+00	Bettercoal_Confidentiality_Agreement_2022_jxAcHEE.docx	5	36XTKZ2FFG	\N	\N	Bettercoal_Confidentiality_Agreement_2022.docx	\N	other
11	2024-07-18 09:45:59.589001+00	2024-07-18 09:46:04.48252+00	report_eDwJXHO.pdf	5	G2AE7P8YV2	69	56	report.pdf	2	other
12	2024-07-18 10:18:30.397259+00	2024-07-18 10:18:32.964319+00	report_qOFs7wi.pdf	5	PNGCCRSYG9	69	62	report.pdf	2	other
10	2024-07-18 09:43:26.016573+00	2024-07-18 10:34:12.416795+00	assessment_plan_template_PpQA1HS.docx	5	2ZWJ3SU25X	69	55	assessment_plan_template.docx	2	other
16	2024-07-18 10:49:48.469702+00	2024-07-18 10:49:48.469722+00	assessment_plan_template_7rPWzf8.docx	4	86HMSGQJ6Z	\N	\N	assessment_plan_template.docx	\N	other
17	2024-07-18 11:58:51.061216+00	2024-07-18 11:58:51.061234+00	report_lxI9Sf2.pdf	4	WN7ZZ47CSB	\N	\N	report.pdf	\N	other
18	2024-07-18 11:59:42.569115+00	2024-07-18 11:59:42.569134+00	report_cFbfRpY.pdf	4	C9PMM7WDSM	\N	\N	report.pdf	\N	other
19	2024-07-18 12:38:28.433256+00	2024-07-18 12:38:28.43334+00	assessment_plan_template_HbMZ8jx.docx	4	DRV4N3C8QT	\N	\N	assessment_plan_template.docx	\N	other
20	2024-07-18 12:59:14.754472+00	2024-07-18 12:59:14.75464+00	assessment_plan_template_MfvETtS.docx	4	7JDG65UFMW	\N	\N	assessment_plan_template.docx	\N	other
21	2024-07-18 13:05:40.725519+00	2024-07-18 13:05:40.725655+00	assessment_plan_template_godtu5w.docx	4	ED2TCB6WR8	\N	\N	assessment_plan_template.docx	\N	other
22	2024-07-18 13:08:37.148677+00	2024-07-18 13:08:37.149327+00	assessment_plan_template_gtXbcq3.docx	4	92WP9YDUP5	\N	\N	assessment_plan_template.docx	\N	objective_evidence
24	2024-07-19 10:44:16.952612+00	2024-07-19 10:44:16.952639+00	report-1_UwBW4u8.pdf	4	24Q72KBG5X	\N	\N	report-1.pdf	\N	objective_evidence
25	2024-07-19 10:45:12.384816+00	2024-07-19 10:45:12.384866+00	report-1_HqZHHtw.pdf	4	4DD4WT8XTH	\N	\N	report-1.pdf	\N	objective_evidence
23	2024-07-18 13:14:26.224865+00	2024-07-19 10:45:32.396922+00	assessment_plan_template_QOIxTND.docx	4	SEUFJ4WH4V	39	1	assessment_plan_template.docx	2	objective_evidence
26	2024-07-19 10:45:26.779505+00	2024-07-19 10:45:32.460201+00	report-1_1ddy0a4.pdf	4	FYZ8A5YFHW	39	1	report-1.pdf	2	objective_evidence
\.


--
-- Data for Name: deadlines_actiondeadline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deadlines_actiondeadline (id, created, modified, object_id, action_identifier, deadline_at, content_type_id) FROM stdin;
1	2024-07-17 13:11:03.38354+00	2024-07-17 13:11:03.38354+00	1	SITE_ASSESSMENT_REPORT_DRAFTING	2024-09-04	31
2	2024-07-18 10:50:19.859696+00	2024-07-18 10:50:19.859696+00	2	SITE_ASSESSMENT_REPORT_DRAFTING	2024-09-05	31
\.


--
-- Data for Name: deadlines_actiondeadlinereminder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deadlines_actiondeadlinereminder (id, created, modified, status, remind_at, deadline_id, user_id) FROM stdin;
1	2024-07-17 13:11:03.416471+00	2024-07-17 13:11:03.416471+00	ACTIVE	2024-08-28	1	4
2	2024-07-18 10:50:19.883733+00	2024-07-18 10:50:19.883733+00	ACTIVE	2024-08-29	2	4
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
1	2024-07-17 12:11:31.492541+00	1	Allan Imire	2	[{"changed": {"fields": ["Role"]}}]	24	1
2	2024-07-17 12:44:04.852552+00	3	Samuel Christian-Assessor	3		24	1
3	2024-07-17 12:46:08.453619+00	4	Bettercoal_Confidentiality_Agreement_for_Assessors.pdf	3		30	1
4	2024-07-17 12:46:08.458627+00	3	Bettercoal_Confidentiality_Agreement_for_Assessors.pdf	3		30	1
5	2024-07-18 11:52:46.669779+00	329	SQAnswer object (329)	2	[{"changed": {"fields": ["Value"]}}]	68	1
6	2024-07-18 11:53:08.425946+00	328	SQAnswer object (328)	2	[{"changed": {"fields": ["Value"]}}]	68	1
7	2024-07-18 11:53:16.038277+00	327	SQAnswer object (327)	2	[{"changed": {"fields": ["Value"]}}]	68	1
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	auth	permission
2	auth	group
3	contenttypes	contenttype
4	sessions	session
5	sites	site
6	admin	logentry
7	comment	comment
8	comment	reaction
9	comment	reactioninstance
10	comment	flag
11	comment	flaginstance
12	comment	follower
13	account	emailaddress
14	account	emailconfirmation
15	socialaccount	socialaccount
16	socialaccount	socialapp
17	socialaccount	socialtoken
18	actstream	action
19	actstream	follow
20	otp_static	staticdevice
21	otp_static	statictoken
22	otp_totp	totpdevice
23	two_factor	phonedevice
24	users	user
25	users	supplierorganisation
26	users	supplierprofile
27	users	assessorprofile
28	users	company
29	users	memberprofile
30	common	document
31	assurance_process	assuranceprocess
32	assurance_process	minesite
33	assurance_process	invitationtoken
34	assurance_process	transportationinfrastructure
35	assurance_process	regionaloffice
36	assurance_process	portstoragefacility
37	assessment_planning	assessmentplan
38	assessment_report	assessmentreport
39	assessment_report	provisionresponse
40	assessment_report	finding
41	assessment_report	suppliersoverview
42	assessment_report	disclaimer
43	assessment_report	countrycontext
44	assessment_report	observer
45	assessment_report	stakeholdermeetings
46	assessment_report	sitesandfacilitiesassessed
47	assessment_report	performancegaps
48	assessment_report	immediateresolutions
49	assessment_report	goodpractices
50	assessment_report	executivesummary
51	assessment_report	conclusionandnextsteps
52	assessment_report	assessmentpurposeandscope
53	assessment_report	assessmentmethodology
54	assessment_report	assessmentlimitations
55	assessment_report	sitevisitagenda
56	assessment_report	stakeholdermeetingssummaries
57	assessment_report	openingandclosingmeetingparticipants
58	assessment_report	additional
59	cip_code	cipcodeversion
60	cip_code	cipprinciple
61	cip_code	cipprovision
62	cip_code	cipcategory
63	cip	cip
64	cip	cipfinding
65	cip	cipmonitoringcycle
66	cip	cipfindingstatushistory
67	supplier_questionnaire	sqcategory
68	supplier_questionnaire	sqanswer
69	supplier_questionnaire	sqcategoryresponse
70	supplier_questionnaire	sqquestion
71	deadlines	actiondeadline
72	deadlines	actiondeadlinereminder
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2024-07-17 09:15:16.619606+00
2	contenttypes	0002_remove_content_type_name	2024-07-17 09:15:16.627909+00
3	auth	0001_initial	2024-07-17 09:15:16.640723+00
4	auth	0002_alter_permission_name_max_length	2024-07-17 09:15:16.651508+00
5	auth	0003_alter_user_email_max_length	2024-07-17 09:15:16.655422+00
6	auth	0004_alter_user_username_opts	2024-07-17 09:15:16.659914+00
7	auth	0005_alter_user_last_login_null	2024-07-17 09:15:16.665131+00
8	auth	0006_require_contenttypes_0002	2024-07-17 09:15:16.666083+00
9	auth	0007_alter_validators_add_error_messages	2024-07-17 09:15:16.669429+00
10	auth	0008_alter_user_username_max_length	2024-07-17 09:15:16.672665+00
11	users	0001_initial	2024-07-17 09:15:16.681512+00
12	account	0001_initial	2024-07-17 09:15:16.699977+00
13	account	0002_email_max_length	2024-07-17 09:15:16.710214+00
14	actstream	0001_initial	2024-07-17 09:15:16.73241+00
15	actstream	0002_remove_action_data	2024-07-17 09:15:16.745625+00
16	actstream	0003_add_follow_flag	2024-07-17 09:15:16.759136+00
17	admin	0001_initial	2024-07-17 09:15:16.767969+00
18	admin	0002_logentry_remove_auto_add	2024-07-17 09:15:16.776491+00
19	admin	0003_logentry_add_action_flag_choices	2024-07-17 09:15:16.781565+00
20	common	0001_initial	2024-07-17 09:15:16.794129+00
21	common	0002_auto_20210205_0612	2024-07-17 09:15:16.818063+00
22	common	0003_comment_comment_thread	2024-07-17 09:15:16.831105+00
23	common	0004_document_public_id	2024-07-17 09:15:16.837925+00
24	common	0005_auto_20210412_1308	2024-07-17 09:15:16.846166+00
25	common	0006_auto_20210412_1858	2024-07-17 09:15:16.857434+00
26	common	0007_document_original_file_name	2024-07-17 09:15:16.866122+00
27	common	0008_remove_comment_created_by	2024-07-17 09:15:16.877571+00
28	users	0002_auto_20210204_0914	2024-07-17 09:15:16.885618+00
29	users	0003_auto_20210204_1019	2024-07-17 09:15:16.921241+00
30	users	0004_user_needs_to_set_password	2024-07-17 09:15:16.936185+00
31	users	0005_auto_20210205_0455	2024-07-17 09:15:16.967972+00
32	users	0006_auto_20210205_0537	2024-07-17 09:15:17.050238+00
33	users	0007_auto_20210212_1033	2024-07-17 09:15:17.063591+00
34	users	0008_auto_20210217_1756	2024-07-17 09:15:17.093939+00
35	users	0009_auto_20210218_0233	2024-07-17 09:15:17.127871+00
36	users	0010_user_public_id	2024-07-17 09:15:17.135667+00
37	users	0011_remove_user_public_id	2024-07-17 09:15:17.141911+00
38	users	0012_user_public_id	2024-07-17 09:15:17.149927+00
39	users	0013_remove_user_public_id	2024-07-17 09:15:17.156883+00
40	users	0014_user_public_id	2024-07-17 09:15:17.163972+00
41	users	0015_auto_20210218_0317	2024-07-17 09:15:17.17324+00
42	users	0016_auto_20210218_0322	2024-07-17 09:15:17.181615+00
43	users	0017_auto_20210218_0619	2024-07-17 09:15:17.189918+00
44	users	0018_supplierprofile_registration_completed	2024-07-17 09:15:17.197014+00
45	users	0019_auto_20210218_1609	2024-07-17 09:15:17.211309+00
46	users	0020_supplierorganisation_logo	2024-07-17 09:15:17.219118+00
47	users	0021_supplierorganisation_has_parent_company	2024-07-17 09:15:17.226192+00
48	users	0022_auto_20210219_0657	2024-07-17 09:15:17.244007+00
49	users	0023_auto_20210222_0611	2024-07-17 09:15:17.251471+00
50	users	0024_supplierprofile_timezone	2024-07-17 09:15:17.258732+00
51	users	0025_remove_supplierprofile_office_address_country	2024-07-17 09:15:17.266927+00
52	users	0026_supplierprofile_office_address_country	2024-07-17 09:15:17.275023+00
53	users	0027_auto_20210223_1228	2024-07-17 09:15:17.319541+00
54	users	0028_auto_20210223_1230	2024-07-17 09:15:17.347841+00
55	users	0029_auto_20210225_0643	2024-07-17 09:15:17.369338+00
56	users	0030_auto_20210302_0619	2024-07-17 09:15:17.391632+00
57	users	0031_auto_20210302_1534	2024-07-17 09:15:17.423725+00
58	users	0032_delete_supplierminesite	2024-07-17 09:15:17.428115+00
59	assurance_process	0001_initial	2024-07-17 09:15:17.444443+00
60	assurance_process	0002_auto_20210205_0335	2024-07-17 09:15:17.475352+00
61	assurance_process	0003_assuranceprocess_name	2024-07-17 09:15:17.537572+00
62	assurance_process	0004_auto_20210217_1758	2024-07-17 09:15:17.556312+00
63	assurance_process	0005_assuranceprocess_public_id	2024-07-17 09:15:17.573118+00
64	assurance_process	0006_supplierinvitationtoken	2024-07-17 09:15:17.581289+00
65	assurance_process	0007_auto_20210218_1737	2024-07-17 09:15:17.584917+00
66	assurance_process	0008_assuranceprocess_status	2024-07-17 09:15:17.598126+00
67	assurance_process	0009_auto_20210302_1608	2024-07-17 09:15:17.623478+00
68	assurance_process	0010_minesite	2024-07-17 09:15:17.64636+00
69	assurance_process	0011_remove_minesite_organisation	2024-07-17 09:15:17.668185+00
70	assurance_process	0012_minesite_public_id	2024-07-17 09:15:17.678819+00
71	assurance_process	0013_auto_20210303_1509	2024-07-17 09:15:17.691658+00
72	assurance_process	0014_auto_20210304_1250	2024-07-17 09:15:17.708336+00
73	assurance_process	0015_minesite_is_draft	2024-07-17 09:15:17.720354+00
74	assurance_process	0016_minesite_type_of_coal	2024-07-17 09:15:17.729982+00
75	assurance_process	0017_auto_20210304_1334	2024-07-17 09:15:17.749642+00
76	assurance_process	0018_minesite_type_of_mine	2024-07-17 09:15:17.759379+00
77	assurance_process	0019_auto_20210304_1412	2024-07-17 09:15:17.785118+00
78	assurance_process	0020_auto_20210304_1414	2024-07-17 09:15:17.814755+00
79	assurance_process	0021_auto_20210304_1438	2024-07-17 09:15:17.877479+00
80	assurance_process	0022_auto_20210304_1743	2024-07-17 09:15:18.277834+00
81	assurance_process	0023_remove_minesite_region	2024-07-17 09:15:18.290558+00
82	assurance_process	0024_assuranceprocess_has_supplier_submitted_mine_sites	2024-07-17 09:15:18.30439+00
83	assurance_process	0025_auto_20210310_0551	2024-07-17 09:15:18.386653+00
84	assurance_process	0026_remove_assuranceprocess_status	2024-07-17 09:15:18.400602+00
85	assurance_process	0027_remove_assuranceprocess_has_supplier_submitted_mine_sites	2024-07-17 09:15:18.414758+00
86	assurance_process	0027_auto_20210324_0816	2024-07-17 09:15:18.435053+00
87	assurance_process	0028_merge_20210325_0824	2024-07-17 09:15:18.437314+00
88	assurance_process	0029_auto_20210325_0905	2024-07-17 09:15:18.481668+00
89	assurance_process	0030_auto_20210412_0801	2024-07-17 09:15:18.495959+00
90	assurance_process	0031_auto_20210412_1050	2024-07-17 09:15:18.509664+00
91	assurance_process	0032_auto_20210412_1054	2024-07-17 09:15:18.522296+00
92	assurance_process	0033_remove_ap_name	2024-07-17 09:15:18.537073+00
93	assurance_process	0030_add_activities_performed_by_contractors	2024-07-17 09:15:18.574312+00
94	assurance_process	0033_merge_20210415_0824	2024-07-17 09:15:18.575735+00
95	assurance_process	0034_merge_20210415_1207	2024-07-17 09:15:18.576721+00
96	assessment_planning	0001_initial	2024-07-17 09:15:18.594211+00
97	assessment_planning	0002_assessmentplanning_document	2024-07-17 09:15:18.617474+00
98	assessment_planning	0003_auto_20210503_1021	2024-07-17 09:15:18.642824+00
99	assessment_planning	0004_auto_20210527_0946	2024-07-17 09:15:18.705427+00
100	assessment_planning	0005_auto_20210527_0949	2024-07-17 09:15:18.741582+00
101	assessment_planning	0006_auto_20210604_1144	2024-07-17 09:15:18.804501+00
102	assessment_planning	0007_auto_20210608_1630	2024-07-17 09:15:18.826641+00
103	assessment_planning	0008_auto_20210624_0540	2024-07-17 09:15:18.841036+00
104	cip_code	0001_initial	2024-07-17 09:15:18.870577+00
105	cip_code	0002_cipprovision_description	2024-07-17 09:15:18.885793+00
106	supplier_questionnaire	0001_initial	2024-07-17 09:15:18.947027+00
107	cip_code	0003_auto_20210407_1307	2024-07-17 09:15:19.008145+00
108	cip_code	0004_auto_20210408_1347	2024-07-17 09:15:19.018193+00
109	cip_code	0005_auto_20210409_0728	2024-07-17 09:15:19.028063+00
110	cip_code	0006_auto_20210428_1604	2024-07-17 09:15:19.032254+00
111	cip_code	0006_auto_20210426_1108	2024-07-17 09:15:19.035936+00
112	cip_code	0007_merge_20210430_0818	2024-07-17 09:15:19.037013+00
113	cip_code	0008_auto_20210601_1044	2024-07-17 09:15:19.040419+00
114	assessment_report	0001_initial	2024-07-17 09:15:19.06176+00
115	assessment_report	0002_finding_provisionresponse	2024-07-17 09:15:19.111438+00
116	assessment_report	0003_auto_20210602_1245	2024-07-17 09:15:19.153562+00
117	assessment_report	0004_auto_20210602_1248	2024-07-17 09:15:19.177792+00
118	assessment_report	0005_auto_20210602_1412	2024-07-17 09:15:19.207617+00
119	assessment_report	0006_countrycontext_disclaimer_suppliersoverview	2024-07-17 09:15:19.312428+00
120	assessment_report	0006_auto_20210603_0702	2024-07-17 09:15:19.37442+00
121	assessment_report	0007_merge_20210604_0419	2024-07-17 09:15:19.376865+00
122	assessment_report	0008_auto_20210604_1028	2024-07-17 09:15:19.552686+00
123	assessment_report	0009_provisionresponse_not_applicable_explanation	2024-07-17 09:15:19.562478+00
124	assessment_report	0010_auto_20210608_0503	2024-07-17 09:15:19.575364+00
125	assessment_report	0011_auto_20210608_0518	2024-07-17 09:15:19.58084+00
126	assessment_report	0012_auto_20210608_0527	2024-07-17 09:15:19.607659+00
127	assessment_report	0013_auto_20210608_1700	2024-07-17 09:15:19.613118+00
128	assessment_report	0014_auto_20210608_1815	2024-07-17 09:15:19.728813+00
129	assessment_report	0015_finding_public_id	2024-07-17 09:15:19.741743+00
130	assessment_report	0016_auto_20210609_0919	2024-07-17 09:15:19.758845+00
131	assessment_report	0017_auto_20210610_0619	2024-07-17 09:15:19.801107+00
132	assessment_report	0018_auto_20210610_0848	2024-07-17 09:15:19.815072+00
133	assessment_report	0019_assessmentlimitations_assessmentmethodology_assessmentpurposeandscope_conclusionandnextsteps_executi	2024-07-17 09:15:19.989059+00
134	assessment_report	0020_remove_provisionresponse_not_applicable_explanation	2024-07-17 09:15:20.073088+00
135	assessment_report	0021_sitevisitagenda	2024-07-17 09:15:20.091797+00
136	assessment_report	0022_additional_openingandclosingmeetingparticipants_stakeholdermeetingssummaries	2024-07-17 09:15:20.144519+00
137	assessment_report	0023_auto_20210624_0819	2024-07-17 09:15:20.667458+00
138	assessment_report	0024_provisionresponse_analysis	2024-07-17 09:15:20.681533+00
139	assessment_report	0025_provisionresponse_reason_for_not_applicable	2024-07-17 09:15:20.69253+00
140	assessment_report	0026_auto_20220114_1516	2024-07-17 09:15:20.73782+00
141	assessment_report	0027_auto_20240704_1049	2024-07-17 09:15:20.781739+00
142	assessment_report	0028_auto_20240704_2008	2024-07-17 09:15:20.928738+00
143	assurance_process	0035_assuranceprocess_claim	2024-07-17 09:15:20.93813+00
144	assurance_process	0036_auto_20210702_1144	2024-07-17 09:15:21.259905+00
145	assurance_process	0037_auto_20210705_0627	2024-07-17 09:15:21.345421+00
146	assurance_process	0038_auto_20210705_0630	2024-07-17 09:15:21.37151+00
147	assurance_process	0039_auto_20210705_0632	2024-07-17 09:15:21.580106+00
148	assurance_process	0040_auto_20210705_0633	2024-07-17 09:15:21.747642+00
149	assurance_process	0041_auto_20210705_0639	2024-07-17 09:15:21.81592+00
150	assurance_process	0042_auto_20210705_1121	2024-07-17 09:15:21.884681+00
151	assurance_process	0043_auto_20210708_0527	2024-07-17 09:15:21.966827+00
152	assurance_process	0044_auto_20210708_0536	2024-07-17 09:15:21.984273+00
153	assurance_process	0045_auto_20210708_0726	2024-07-17 09:15:22.027478+00
154	assurance_process	0046_auto_20210708_0822	2024-07-17 09:15:22.045588+00
155	assurance_process	0047_auto_20210708_0822	2024-07-17 09:15:22.063047+00
156	assurance_process	0048_auto_20210708_0841	2024-07-17 09:15:22.169869+00
157	assurance_process	0049_auto_20210708_0948	2024-07-17 09:15:22.827756+00
158	assurance_process	0050_auto_20210708_1526	2024-07-17 09:15:23.72922+00
159	assurance_process	0051_auto_20210708_1539	2024-07-17 09:15:23.787192+00
160	assurance_process	0052_auto_20210708_1542	2024-07-17 09:15:23.877345+00
161	assurance_process	0053_auto_20210708_1601	2024-07-17 09:15:23.95717+00
162	assurance_process	0054_auto_20210713_1021	2024-07-17 09:15:24.015584+00
163	assurance_process	0049_auto_20210718_1433	2024-07-17 09:15:24.03211+00
164	assurance_process	0055_merge_20210802_0830	2024-07-17 09:15:24.034049+00
165	assurance_process	0056_auto_20210912_2004	2024-07-17 09:15:24.050203+00
166	assurance_process	0057_auto_20210927_1536	2024-07-17 09:15:24.065328+00
167	assurance_process	0058_auto_20220114_1516	2024-07-17 09:15:24.081029+00
168	assurance_process	0059_auto_20231018_1313	2024-07-17 09:15:24.097066+00
169	assurance_process	0060_auto_20231027_0918	2024-07-17 09:15:24.11299+00
170	assurance_process	0061_auto_20231122_1442	2024-07-17 09:15:24.178378+00
171	assurance_process	0062_auto_20240201_1343	2024-07-17 09:15:24.194098+00
172	assurance_process	0063_auto_20240704_1119	2024-07-17 09:15:24.209815+00
173	assurance_process	0064_auto_20240704_2030	2024-07-17 09:15:24.527292+00
174	assurance_process	0065_auto_20240704_2042	2024-07-17 09:15:24.54381+00
175	auth	0009_alter_user_last_name_max_length	2024-07-17 09:15:24.548976+00
176	auth	0010_alter_group_name_max_length	2024-07-17 09:15:24.555925+00
177	auth	0011_update_proxy_permissions	2024-07-17 09:15:24.585213+00
178	cip	0001_initial	2024-07-17 09:15:24.689959+00
179	cip	0002_auto_20210616_0819	2024-07-17 09:15:24.817262+00
180	cip	0003_auto_20210802_0831	2024-07-17 09:15:24.970154+00
181	cip	0004_auto_20210802_0921	2024-07-17 09:15:25.0058+00
182	cip	0005_auto_20210803_0807	2024-07-17 09:15:25.022056+00
183	cip	0006_auto_20210803_0807	2024-07-17 09:15:25.052746+00
184	cip	0007_auto_20210804_1016	2024-07-17 09:15:25.062904+00
185	cip	0008_auto_20210804_1042	2024-07-17 09:15:25.068482+00
186	cip	0009_auto_20210805_0208	2024-07-17 09:15:25.077025+00
187	cip	0010_auto_20210805_0539	2024-07-17 09:15:25.087172+00
188	cip	0011_auto_20210805_0832	2024-07-17 09:15:25.099129+00
189	cip	0012_auto_20210805_0840	2024-07-17 09:15:25.107039+00
190	cip	0013_auto_20210805_0848	2024-07-17 09:15:25.185199+00
191	cip	0014_auto_20210805_1244	2024-07-17 09:15:25.197486+00
192	cip	0015_auto_20210805_1253	2024-07-17 09:15:25.208265+00
193	cip	0016_auto_20210816_0641	2024-07-17 09:15:25.23862+00
194	cip	0017_auto_20210816_1611	2024-07-17 09:15:25.257411+00
195	cip	0018_auto_20210816_1638	2024-07-17 09:15:25.269401+00
196	cip	0019_auto_20210817_0455	2024-07-17 09:15:25.291066+00
197	cip	0016_auto_20210805_1406	2024-07-17 09:15:25.297028+00
198	cip	0020_merge_20210817_0632	2024-07-17 09:15:25.29832+00
199	cip	0021_auto_20210818_1023	2024-07-17 09:15:25.311763+00
200	cip	0022_auto_20210818_1810	2024-07-17 09:15:25.316923+00
201	cip	0023_cipfindingstatushistory	2024-07-17 09:15:25.336137+00
202	cip	0024_auto_20210819_1142	2024-07-17 09:15:25.351004+00
203	cip	0025_auto_20210819_1218	2024-07-17 09:15:25.360535+00
204	cip	0026_auto_20210819_2028	2024-07-17 09:15:25.37935+00
205	cip	0027_auto_20210819_2046	2024-07-17 09:15:25.394846+00
206	cip	0028_auto_20210820_0927	2024-07-17 09:15:25.413682+00
207	cip	0029_auto_20210827_1013	2024-07-17 09:15:25.425936+00
208	cip	0030_auto_20211108_1940	2024-07-17 09:15:25.431422+00
209	cip	0030_trigger_post_save_and_create_cip_findings	2024-07-17 09:15:25.465079+00
210	cip_code	0009_remove_cipprovision_name	2024-07-17 09:15:25.470328+00
211	cip_code	0010_auto_20210609_0903	2024-07-17 09:15:25.489858+00
212	cip_code	0011_cipprovision_rating_choices	2024-07-17 09:15:25.494885+00
213	comment	0001_initial	2024-07-17 09:15:25.512189+00
214	comment	0002_comment_edit_date	2024-07-17 09:15:25.533517+00
215	comment	0003_auto_20200419_1423	2024-07-17 09:15:25.562198+00
216	comment	0004_reaction_reactioninstance	2024-07-17 09:15:25.58887+00
217	comment	0005_auto_20200521_1301	2024-07-17 09:15:25.620204+00
218	comment	0006_flag_flaginstance	2024-07-17 09:15:25.65131+00
219	comment	0007_auto_20200620_1259	2024-07-17 09:15:25.738719+00
220	comment	0008_comment_urlhash	2024-07-17 09:15:25.793465+00
221	comment	0009_auto_20200811_1945	2024-07-17 09:15:25.866912+00
222	comment	0010_auto_20201023_1442	2024-07-17 09:15:25.886489+00
223	comment	0011_follower	2024-07-17 09:15:25.903486+00
224	common	0009_auto_20210616_0819	2024-07-17 09:15:25.956678+00
225	common	0010_document_assurance_process	2024-07-17 09:15:25.979787+00
226	common	0011_auto_20240712_0825	2024-07-17 09:15:26.014698+00
227	common	0012_auto_20240712_0926	2024-07-17 09:15:26.052486+00
228	common	0013_document_document_type	2024-07-17 09:15:26.125368+00
229	deadlines	0001_initial	2024-07-17 09:15:26.164802+00
230	deadlines	0002_auto_20210802_0831	2024-07-17 09:15:26.228751+00
231	deadlines	0003_auto_20210804_1016	2024-07-17 09:15:26.236185+00
232	otp_static	0001_initial	2024-07-17 09:15:26.272158+00
233	otp_static	0002_throttling	2024-07-17 09:15:26.304735+00
234	otp_totp	0001_initial	2024-07-17 09:15:26.32478+00
235	otp_totp	0002_auto_20190420_0723	2024-07-17 09:15:26.352461+00
236	sessions	0001_initial	2024-07-17 09:15:26.359426+00
237	sites	0001_initial	2024-07-17 09:15:26.366549+00
238	sites	0002_alter_domain_unique	2024-07-17 09:15:26.373389+00
239	sites	0003_set_site_domain_and_name	2024-07-17 09:15:26.410597+00
240	socialaccount	0001_initial	2024-07-17 09:15:26.520639+00
241	socialaccount	0002_token_max_lengths	2024-07-17 09:15:26.553025+00
242	socialaccount	0003_extra_data_default_dict	2024-07-17 09:15:26.558949+00
243	supplier_questionnaire	0002_auto_20210409_0728	2024-07-17 09:15:26.683256+00
244	supplier_questionnaire	0003_auto_20210409_0729	2024-07-17 09:15:26.716323+00
245	supplier_questionnaire	0004_auto_20210409_0805	2024-07-17 09:15:26.741232+00
246	supplier_questionnaire	0005_auto_20210412_1858	2024-07-17 09:15:26.779596+00
247	supplier_questionnaire	0006_auto_20210412_1917	2024-07-17 09:15:26.809233+00
248	supplier_questionnaire	0007_auto_20210413_0311	2024-07-17 09:15:26.825466+00
249	supplier_questionnaire	0008_auto_20210413_0312	2024-07-17 09:15:26.902306+00
250	supplier_questionnaire	0009_auto_20210413_0312	2024-07-17 09:15:26.908513+00
251	supplier_questionnaire	0010_auto_20210413_0312	2024-07-17 09:15:26.927984+00
252	supplier_questionnaire	0011_auto_20210413_1726	2024-07-17 09:15:26.951982+00
253	supplier_questionnaire	0012_auto_20210413_1727	2024-07-17 09:15:26.988924+00
254	supplier_questionnaire	0013_auto_20210413_1947	2024-07-17 09:15:27.007144+00
255	supplier_questionnaire	0014_auto_20210414_1135	2024-07-17 09:15:27.0246+00
256	supplier_questionnaire	0015_auto_20210414_1136	2024-07-17 09:15:27.047253+00
257	supplier_questionnaire	0016_auto_20210414_1137	2024-07-17 09:15:27.07195+00
258	supplier_questionnaire	0017_auto_20210719_0739	2024-07-17 09:15:27.112257+00
259	supplier_questionnaire	0018_auto_20210719_0742	2024-07-17 09:15:27.15071+00
260	supplier_questionnaire	0019_sqcategoryresponse_mine_site	2024-07-17 09:15:27.172315+00
261	supplier_questionnaire	0020_auto_20210719_0825	2024-07-17 09:15:27.194819+00
262	two_factor	0001_initial	2024-07-17 09:15:27.216388+00
263	two_factor	0002_auto_20150110_0810	2024-07-17 09:15:27.234968+00
264	two_factor	0003_auto_20150817_1733	2024-07-17 09:15:27.336798+00
265	two_factor	0004_auto_20160205_1827	2024-07-17 09:15:27.350873+00
266	two_factor	0005_auto_20160224_0450	2024-07-17 09:15:27.414578+00
267	two_factor	0006_phonedevice_key_default	2024-07-17 09:15:27.42796+00
268	two_factor	0007_auto_20201201_1019	2024-07-17 09:15:27.453502+00
269	users	0033_auto_20210316_0216	2024-07-17 09:15:27.489073+00
270	users	0034_user_notifcations_last_viewed_at	2024-07-17 09:15:27.505529+00
271	users	0035_remove_user_notifcations_last_viewed_at	2024-07-17 09:15:27.521797+00
272	users	0036_user_notifcations_last_viewed_at	2024-07-17 09:15:27.538296+00
273	users	0037_auto_20210318_0826	2024-07-17 09:15:27.558565+00
274	users	0038_auto_20210324_0745	2024-07-17 09:15:27.654044+00
275	users	0039_auto_20210324_0835	2024-07-17 09:15:27.699723+00
276	users	0040_delete_assessororganisation	2024-07-17 09:15:27.704993+00
277	users	0041_auto_20210325_0905	2024-07-17 09:15:27.795028+00
278	users	0042_assessorprofile_cv	2024-07-17 09:15:27.818399+00
279	users	0043_assessorprofile_current_organisation	2024-07-17 09:15:27.83887+00
280	users	0044_auto_20210330_0831	2024-07-17 09:15:27.970779+00
281	users	0038_auto_20210406_1159	2024-07-17 09:15:28.017025+00
282	users	0045_merge_20210409_1025	2024-07-17 09:15:28.019446+00
283	users	0046_auto_20210412_1307	2024-07-17 09:15:28.07878+00
284	users	0047_supplierorganisation_public_id	2024-07-17 09:15:28.097035+00
285	users	0048_auto_20210429_1241	2024-07-17 09:15:28.132492+00
286	users	0049_auto_20210429_1242	2024-07-17 09:15:28.154072+00
287	users	0047_auto_20210428_1604	2024-07-17 09:15:28.186269+00
288	users	0050_merge_20210430_0818	2024-07-17 09:15:28.188722+00
289	users	0051_auto_20210527_0946	2024-07-17 09:15:28.305185+00
290	users	0052_supplierorganisation_parent_company_name	2024-07-17 09:15:28.322776+00
291	users	0053_auto_20210708_0726	2024-07-17 09:15:28.383597+00
292	users	0054_assessorprofile_signed_nda	2024-07-17 09:15:28.40671+00
293	users	0055_auto_20210912_2004	2024-07-17 09:15:28.468738+00
294	users	0056_auto_20210927_1536	2024-07-17 09:15:28.60825+00
295	users	0057_auto_20211015_0423	2024-07-17 09:15:28.670511+00
296	users	0058_auto_20220114_1517	2024-07-17 09:15:28.737636+00
297	users	0059_auto_20231018_1313	2024-07-17 09:15:28.79554+00
298	users	0060_auto_20231027_0918	2024-07-17 09:15:28.900558+00
299	users	0061_auto_20231122_1442	2024-07-17 09:15:28.949314+00
300	users	0062_auto_20240201_1343	2024-07-17 09:15:28.997963+00
301	users	0063_auto_20240704_1119	2024-07-17 09:15:29.046484+00
302	supplier_questionnaire	0021_auto_20240718_1025	2024-07-18 10:25:49.163894+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
6v5njw2otdlifsxevqqu0ft1nxpeuh0e	NjA3MThjMGFiMWNiYjc2NjAxNmUzYmIwOGE1YTkwYzUyM2Y4ODBiNjp7Il9hdXRoX3VzZXJfaWQiOiI0IiwiX2F1dGhfdXNlcl9iYWNrZW5kIjoiYWxsYXV0aC5hY2NvdW50LmF1dGhfYmFja2VuZHMuQXV0aGVudGljYXRpb25CYWNrZW5kIiwiX2F1dGhfdXNlcl9oYXNoIjoiZWJjZTU5NWUxMTIzZTFlNzdkM2NjZTE3ZjkwMzk3NzNlNWFlMmQ5YSJ9	2024-07-31 12:46:12.832488+00
e5yvjns838q0htjufys0696z0c08ama8	ZDJlMzc1YjFjYzI0ZjdlMTJkYzk3MzEzODU4MWU2NWRjYzhlZWE5Njp7IndpemFyZF9sb2dpbl92aWV3Ijp7InN0ZXAiOiJhdXRoIiwic3RlcF9kYXRhIjp7fSwic3RlcF9maWxlcyI6e30sImV4dHJhX2RhdGEiOnt9LCJ2YWxpZGF0ZWRfc3RlcF9kYXRhIjp7fX0sIl9hdXRoX3VzZXJfaWQiOiIxIiwiX2F1dGhfdXNlcl9iYWNrZW5kIjoiZGphbmdvLmNvbnRyaWIuYXV0aC5iYWNrZW5kcy5Nb2RlbEJhY2tlbmQiLCJfYXV0aF91c2VyX2hhc2giOiI3NmYwYmZhNmFjOTA4YmRlYzg5YTJiNTFmZDFjYWZlZGM0NDQxNjUyIn0=	2024-08-01 10:01:18.24092+00
2jteu5f9w33k8bmjyukx4lt1m1k1ccse	YjkyOWM1ODliZTg4NDE5MWZlYjA3ZTgxMzM2MjAwZDYxYTM1YzcwODp7IndpemFyZF9sb2dpbl92aWV3Ijp7InN0ZXAiOiJhdXRoIiwic3RlcF9kYXRhIjp7fSwic3RlcF9maWxlcyI6e30sImV4dHJhX2RhdGEiOnt9LCJ2YWxpZGF0ZWRfc3RlcF9kYXRhIjp7fX0sIl9hdXRoX3VzZXJfaWQiOiI1IiwiX2F1dGhfdXNlcl9iYWNrZW5kIjoiYWxsYXV0aC5hY2NvdW50LmF1dGhfYmFja2VuZHMuQXV0aGVudGljYXRpb25CYWNrZW5kIiwiX2F1dGhfdXNlcl9oYXNoIjoiOTFhNTMzYzY3Y2NlZjFmMTk2NDViNGRhNzIwZDMwY2JiNTU2YTkwYiJ9	2024-08-01 10:39:45.209694+00
\.


--
-- Data for Name: django_site; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_site (id, domain, name) FROM stdin;
1	bettercoal-staging.tdi-sustainabilty.com	Bettercoal Platform
\.


--
-- Data for Name: otp_static_staticdevice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_static_staticdevice (id, name, confirmed, user_id, throttling_failure_count, throttling_failure_timestamp) FROM stdin;
\.


--
-- Data for Name: otp_static_statictoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_static_statictoken (id, token, device_id) FROM stdin;
\.


--
-- Data for Name: otp_totp_totpdevice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_totp_totpdevice (id, name, confirmed, key, step, t0, digits, tolerance, drift, last_t, user_id, throttling_failure_count, throttling_failure_timestamp) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialaccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.socialaccount_socialaccount (id, provider, uid, last_login, date_joined, extra_data, user_id) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialapp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.socialaccount_socialapp (id, provider, name, client_id, secret, key) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialapp_sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.socialaccount_socialapp_sites (id, socialapp_id, site_id) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialtoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.socialaccount_socialtoken (id, token, token_secret, expires_at, account_id, app_id) FROM stdin;
\.


--
-- Data for Name: supplier_questionnaire_sqanswer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_questionnaire_sqanswer (id, created, modified, value, sq_question_id, sq_category_response_id) FROM stdin;
1	2024-07-17 13:02:09.827983+00	2024-07-17 13:02:09.827992+00	No	1	1
2	2024-07-17 13:02:09.833065+00	2024-07-17 13:02:09.833071+00	No	2	1
3	2024-07-17 13:02:09.837239+00	2024-07-17 13:02:09.837243+00	Yes	3	1
4	2024-07-17 13:02:30.066696+00	2024-07-17 13:02:30.066702+00	Yes	4	2
5	2024-07-17 13:02:38.003456+00	2024-07-17 13:02:38.003463+00	Yes	5	3
6	2024-07-17 13:02:44.016965+00	2024-07-17 13:02:44.016972+00	Yes	6	4
7	2024-07-17 13:02:44.023954+00	2024-07-17 13:02:44.02396+00	No	7	4
8	2024-07-17 13:02:52.867415+00	2024-07-17 13:02:52.867426+00	N/A	8	5
9	2024-07-17 13:03:01.074291+00	2024-07-17 13:03:01.074298+00	N/A	9	6
10	2024-07-17 13:03:01.07849+00	2024-07-17 13:03:01.078495+00	Yes	10	6
11	2024-07-17 13:03:09.937217+00	2024-07-17 13:03:09.937223+00	Yes	11	7
12	2024-07-17 13:03:16.308731+00	2024-07-17 13:03:16.308737+00	N/A	12	8
13	2024-07-17 13:03:16.313257+00	2024-07-17 13:03:16.313264+00	N/A	13	8
14	2024-07-17 13:03:21.804949+00	2024-07-17 13:03:21.804956+00	Yes	14	9
15	2024-07-17 13:03:31.514513+00	2024-07-17 13:03:31.514519+00	N/A	15	10
16	2024-07-17 13:03:31.518707+00	2024-07-17 13:03:31.518712+00	No	16	10
17	2024-07-17 13:03:37.609077+00	2024-07-17 13:03:37.609083+00	N/A	17	11
18	2024-07-17 13:03:37.612903+00	2024-07-17 13:03:37.612907+00	Yes	18	11
19	2024-07-17 13:03:47.101398+00	2024-07-17 13:03:47.101406+00	No	19	12
20	2024-07-17 13:03:52.104316+00	2024-07-17 13:03:52.104323+00	Yes	20	13
21	2024-07-17 13:03:52.108473+00	2024-07-17 13:03:52.108478+00	No	21	13
22	2024-07-17 13:03:58.682441+00	2024-07-17 13:03:58.682447+00	N/A	22	14
23	2024-07-17 13:03:58.686664+00	2024-07-17 13:03:58.686669+00	N/A	23	14
24	2024-07-17 13:03:58.690637+00	2024-07-17 13:03:58.690642+00	No	24	14
25	2024-07-17 13:04:06.633314+00	2024-07-17 13:04:06.633321+00	No	25	15
26	2024-07-17 13:04:19.032235+00	2024-07-17 13:04:19.032247+00	N/A	26	16
27	2024-07-17 13:04:24.391761+00	2024-07-17 13:04:24.391768+00	N/A	27	17
28	2024-07-17 13:04:30.573211+00	2024-07-17 13:04:30.573218+00	No	28	18
29	2024-07-17 13:04:37.751266+00	2024-07-17 13:04:37.751273+00	N/A	29	19
30	2024-07-17 13:04:43.218811+00	2024-07-17 13:04:43.218817+00	N/A	30	20
31	2024-07-17 13:04:43.222938+00	2024-07-17 13:04:43.222943+00	N/A	31	20
32	2024-07-17 13:04:48.634615+00	2024-07-17 13:04:48.634622+00	Yes	32	21
33	2024-07-17 13:04:56.373282+00	2024-07-17 13:04:56.373289+00	Yes	33	22
34	2024-07-17 13:04:56.377522+00	2024-07-17 13:04:56.377527+00	N/A	34	22
35	2024-07-17 13:05:08.269298+00	2024-07-17 13:05:08.269304+00	Yes	35	23
36	2024-07-17 13:05:13.874425+00	2024-07-17 13:05:13.874432+00	No	36	24
37	2024-07-17 13:05:38.634086+00	2024-07-17 13:05:38.634093+00	N/A	37	25
38	2024-07-17 13:05:38.638303+00	2024-07-17 13:05:38.638308+00	N/A	38	25
39	2024-07-17 13:05:47.142657+00	2024-07-17 13:05:47.142663+00	N/A	39	26
40	2024-07-17 13:05:47.148154+00	2024-07-17 13:05:47.148159+00	Yes	40	26
41	2024-07-17 13:05:54.468266+00	2024-07-17 13:05:54.468273+00	No	41	27
42	2024-07-17 13:05:54.472497+00	2024-07-17 13:05:54.472502+00	Yes	42	27
43	2024-07-17 13:06:00.993812+00	2024-07-17 13:06:00.993818+00	No	43	28
44	2024-07-17 13:06:00.998045+00	2024-07-17 13:06:00.998049+00	No	44	28
45	2024-07-17 13:06:13.934683+00	2024-07-17 13:06:13.934689+00	N/A	45	29
46	2024-07-17 13:06:13.938862+00	2024-07-17 13:06:13.938868+00	No	46	29
47	2024-07-17 13:06:19.15263+00	2024-07-17 13:06:19.152637+00	No	47	30
48	2024-07-17 13:06:23.146519+00	2024-07-17 13:06:23.146526+00	No	48	31
49	2024-07-17 13:06:23.152242+00	2024-07-17 13:06:23.152247+00	N/A	49	31
50	2024-07-17 13:06:27.152019+00	2024-07-17 13:06:27.152025+00	N/A	50	32
51	2024-07-17 13:06:27.156302+00	2024-07-17 13:06:27.156307+00	N/A	51	32
52	2024-07-17 13:06:35.493479+00	2024-07-17 13:06:35.493485+00	No	52	33
53	2024-07-17 13:06:35.497761+00	2024-07-17 13:06:35.497766+00	No	53	33
54	2024-07-17 13:06:39.967955+00	2024-07-17 13:06:39.967964+00	Yes	54	34
55	2024-07-17 13:06:39.972681+00	2024-07-17 13:06:39.97269+00	Yes	55	34
56	2024-07-17 13:06:45.503594+00	2024-07-17 13:06:45.503601+00	N/A	56	35
57	2024-07-17 13:06:49.619997+00	2024-07-17 13:06:49.620003+00	N/A	57	36
58	2024-07-17 13:06:53.660642+00	2024-07-17 13:06:53.660649+00	Yes	58	37
59	2024-07-17 13:06:58.750324+00	2024-07-17 13:06:58.750332+00	N/A	59	38
60	2024-07-17 13:06:58.754548+00	2024-07-17 13:06:58.754554+00	No	60	38
61	2024-07-17 13:07:02.463799+00	2024-07-17 13:07:02.463805+00	N/A	61	39
62	2024-07-17 13:07:07.376775+00	2024-07-17 13:07:07.376782+00	No	62	40
63	2024-07-17 13:07:07.381+00	2024-07-17 13:07:07.381005+00	No	63	40
64	2024-07-17 13:07:07.385069+00	2024-07-17 13:07:07.385073+00	Yes	64	40
65	2024-07-17 13:07:11.578679+00	2024-07-17 13:07:11.578685+00	Yes	65	41
66	2024-07-17 13:07:11.582372+00	2024-07-17 13:07:11.582376+00	Yes	66	41
67	2024-07-17 13:07:16.885016+00	2024-07-17 13:07:16.885022+00	N/A	67	42
68	2024-07-17 13:07:24.814196+00	2024-07-17 13:07:24.814206+00	No	68	43
69	2024-07-17 13:07:24.820691+00	2024-07-17 13:07:24.820696+00	Yes	69	43
70	2024-07-17 13:07:29.679645+00	2024-07-17 13:07:29.679652+00	N/A	70	44
71	2024-07-17 13:07:29.683974+00	2024-07-17 13:07:29.683979+00	Yes	71	44
72	2024-07-17 13:07:36.727156+00	2024-07-17 13:07:36.727162+00	N/A	72	45
73	2024-07-17 13:07:36.731378+00	2024-07-17 13:07:36.731383+00	No	73	45
74	2024-07-17 13:07:43.03365+00	2024-07-17 13:07:43.033658+00	No	74	46
75	2024-07-17 13:07:43.037886+00	2024-07-17 13:07:43.037891+00	Yes	75	46
76	2024-07-17 13:07:43.041916+00	2024-07-17 13:07:43.04192+00	No	76	46
77	2024-07-17 13:07:43.045783+00	2024-07-17 13:07:43.045787+00	Yes	77	46
78	2024-07-17 13:07:49.019738+00	2024-07-17 13:07:49.019744+00	Yes	78	47
79	2024-07-18 09:41:37.074308+00	2024-07-18 09:41:37.074314+00	Yes	1	48
80	2024-07-18 09:41:37.07966+00	2024-07-18 09:41:37.079665+00	Yes	2	48
81	2024-07-18 09:41:37.083661+00	2024-07-18 09:41:37.083666+00	Yes	3	48
82	2024-07-18 09:41:58.753348+00	2024-07-18 09:41:58.753354+00	Yes	4	49
83	2024-07-18 09:42:09.121968+00	2024-07-18 09:42:09.121976+00	Yes	5	50
86	2024-07-18 09:42:28.384693+00	2024-07-18 09:42:28.384705+00	Yes	8	52
89	2024-07-18 09:43:02.556673+00	2024-07-18 09:43:02.556683+00	Yes	11	54
92	2024-07-18 09:46:04.457729+00	2024-07-18 09:46:04.45774+00	Yes	14	56
93	2024-07-18 10:17:27.268108+00	2024-07-18 10:17:27.268117+00	Yes	15	57
94	2024-07-18 10:17:27.272079+00	2024-07-18 10:17:27.272085+00	Yes	16	57
97	2024-07-18 10:17:47.762121+00	2024-07-18 10:17:47.762127+00	Yes	19	59
98	2024-07-18 10:18:00.24094+00	2024-07-18 10:18:00.240946+00	Yes	20	60
99	2024-07-18 10:18:00.245265+00	2024-07-18 10:18:00.24527+00	Yes	21	60
103	2024-07-18 10:18:32.937683+00	2024-07-18 10:18:32.93769+00	Yes	25	62
105	2024-07-18 10:18:55.208795+00	2024-07-18 10:18:55.208802+00	Yes	27	64
106	2024-07-18 10:19:08.511701+00	2024-07-18 10:19:08.511707+00	Yes	28	65
107	2024-07-18 10:19:18.204728+00	2024-07-18 10:19:18.204734+00	Yes	29	66
108	2024-07-18 10:19:28.396684+00	2024-07-18 10:19:28.39669+00	Yes	30	67
109	2024-07-18 10:19:28.40115+00	2024-07-18 10:19:28.401155+00	Yes	31	67
110	2024-07-18 10:19:41.040383+00	2024-07-18 10:19:41.040389+00	Yes	32	68
111	2024-07-18 10:19:51.085008+00	2024-07-18 10:19:51.085014+00	Yes	33	69
112	2024-07-18 10:19:51.089253+00	2024-07-18 10:19:51.089258+00	Yes	34	69
113	2024-07-18 10:20:03.539729+00	2024-07-18 10:20:03.539735+00	No	35	70
115	2024-07-18 10:20:22.393454+00	2024-07-18 10:20:22.393464+00	Yes	37	72
116	2024-07-18 10:20:22.398061+00	2024-07-18 10:20:22.398066+00	Yes	38	72
121	2024-07-18 10:20:51.678663+00	2024-07-18 10:20:51.67867+00	Yes	43	75
122	2024-07-18 10:20:51.686308+00	2024-07-18 10:20:51.686313+00	Yes	44	75
123	2024-07-18 10:21:08.696187+00	2024-07-18 10:21:08.696193+00	Yes	45	76
124	2024-07-18 10:21:08.700436+00	2024-07-18 10:21:08.70044+00	Yes	46	76
125	2024-07-18 10:21:27.435594+00	2024-07-18 10:21:27.4356+00	Yes	47	77
126	2024-07-18 10:21:42.072744+00	2024-07-18 10:21:42.072752+00	Yes	48	78
127	2024-07-18 10:21:42.076955+00	2024-07-18 10:21:42.076959+00	Yes	49	78
128	2024-07-18 10:21:52.040783+00	2024-07-18 10:21:52.04079+00	Yes	50	79
129	2024-07-18 10:21:52.045065+00	2024-07-18 10:21:52.04507+00	Yes	51	79
130	2024-07-18 10:22:06.752422+00	2024-07-18 10:22:06.752429+00	Yes	52	80
131	2024-07-18 10:22:06.759542+00	2024-07-18 10:22:06.759548+00	Yes	53	80
132	2024-07-18 10:22:17.858249+00	2024-07-18 10:22:17.858255+00	Yes	54	81
133	2024-07-18 10:22:17.86231+00	2024-07-18 10:22:17.862314+00	Yes	55	81
134	2024-07-18 10:22:28.654336+00	2024-07-18 10:22:28.654344+00	Yes	56	82
135	2024-07-18 10:27:54.021073+00	2024-07-18 10:27:54.02108+00	Yes	57	83
136	2024-07-18 10:28:04.951814+00	2024-07-18 10:28:04.95182+00	Yes	58	84
137	2024-07-18 10:28:20.766448+00	2024-07-18 10:28:20.766459+00	Yes	59	85
138	2024-07-18 10:28:20.773433+00	2024-07-18 10:28:20.773438+00	Yes	60	85
139	2024-07-18 10:29:01.458173+00	2024-07-18 10:29:01.458181+00	Yes	61	86
140	2024-07-18 10:29:19.862548+00	2024-07-18 10:29:19.862559+00	Yes	62	87
141	2024-07-18 10:29:19.86716+00	2024-07-18 10:29:19.867166+00	Yes	63	87
142	2024-07-18 10:29:19.871517+00	2024-07-18 10:29:19.871522+00	Yes	64	87
143	2024-07-18 10:29:34.449848+00	2024-07-18 10:29:34.449858+00	Yes	65	88
144	2024-07-18 10:29:34.453849+00	2024-07-18 10:29:34.453854+00	Yes	66	88
145	2024-07-18 10:29:51.508955+00	2024-07-18 10:29:51.508961+00	Yes	67	89
146	2024-07-18 10:30:06.376466+00	2024-07-18 10:30:06.376472+00	Yes	68	90
147	2024-07-18 10:30:06.380944+00	2024-07-18 10:30:06.380949+00	Yes	69	90
148	2024-07-18 10:30:19.249356+00	2024-07-18 10:30:19.249363+00	Yes	70	91
149	2024-07-18 10:30:19.255384+00	2024-07-18 10:30:19.255392+00	Yes	71	91
150	2024-07-18 10:30:44.67899+00	2024-07-18 10:30:44.678996+00	Yes	72	92
151	2024-07-18 10:30:44.683041+00	2024-07-18 10:30:44.683046+00	Yes	73	92
152	2024-07-18 10:31:06.35684+00	2024-07-18 10:31:06.356848+00	Yes	74	93
153	2024-07-18 10:31:06.363439+00	2024-07-18 10:31:06.363444+00	Yes	75	93
154	2024-07-18 10:31:06.370112+00	2024-07-18 10:31:06.370118+00	Yes	76	93
155	2024-07-18 10:31:06.376846+00	2024-07-18 10:31:06.376851+00	Yes	77	93
156	2024-07-18 10:31:18.557123+00	2024-07-18 10:31:18.557131+00	Yes	78	94
157	2024-07-18 10:31:37.213371+00	2024-07-18 10:31:37.213381+00	Yes	6	51
158	2024-07-18 10:31:37.217474+00	2024-07-18 10:31:37.217479+00	No	7	51
159	2024-07-18 10:33:47.91167+00	2024-07-18 10:33:47.911691+00	Yes	9	53
160	2024-07-18 10:33:47.91851+00	2024-07-18 10:33:47.918516+00	Yes	10	53
161	2024-07-18 10:34:12.363948+00	2024-07-18 10:34:12.363963+00	Yes	12	55
162	2024-07-18 10:34:12.37226+00	2024-07-18 10:34:12.372267+00	Yes	13	55
163	2024-07-18 10:34:58.82306+00	2024-07-18 10:34:58.823071+00	Yes	22	61
164	2024-07-18 10:34:58.828571+00	2024-07-18 10:34:58.828579+00	Yes	23	61
165	2024-07-18 10:34:58.832999+00	2024-07-18 10:34:58.833003+00	Yes	24	61
166	2024-07-18 10:35:20.573974+00	2024-07-18 10:35:20.573984+00	Yes	17	58
167	2024-07-18 10:35:20.580495+00	2024-07-18 10:35:20.580499+00	No	18	58
168	2024-07-18 10:35:40.307122+00	2024-07-18 10:35:40.307141+00	Yes	26	63
169	2024-07-18 10:36:08.455728+00	2024-07-18 10:36:08.455742+00	Yes	36	71
170	2024-07-18 10:36:30.654372+00	2024-07-18 10:36:30.654386+00	Yes	39	73
171	2024-07-18 10:36:30.658919+00	2024-07-18 10:36:30.658924+00	Yes	40	73
172	2024-07-18 10:36:37.885649+00	2024-07-18 10:36:37.88566+00	Yes	41	74
173	2024-07-18 10:36:37.889993+00	2024-07-18 10:36:37.889998+00	Yes	42	74
329	2024-07-18 10:48:36.197994+00	2024-07-18 11:52:46.660868+00	No	78	135
328	2024-07-18 10:48:30.651184+00	2024-07-18 11:53:08.418503+00	No	77	134
327	2024-07-18 10:48:30.647583+00	2024-07-18 11:53:16.031185+00	No	76	134
252	2024-07-18 10:40:09.869889+00	2024-07-18 10:40:09.869901+00	Yes	1	95
253	2024-07-18 10:40:09.874322+00	2024-07-18 10:40:09.874327+00	Yes	2	95
254	2024-07-18 10:40:09.878034+00	2024-07-18 10:40:09.878038+00	Yes	3	95
255	2024-07-18 10:40:21.013851+00	2024-07-18 10:40:21.013862+00	Yes	4	96
256	2024-07-18 10:40:26.274087+00	2024-07-18 10:40:26.274096+00	Yes	5	97
257	2024-07-18 10:40:33.022569+00	2024-07-18 10:40:33.022579+00	Yes	6	136
258	2024-07-18 10:40:33.026924+00	2024-07-18 10:40:33.026929+00	No	7	136
259	2024-07-18 10:40:38.157371+00	2024-07-18 10:40:38.157381+00	Yes	8	99
260	2024-07-18 10:40:44.36653+00	2024-07-18 10:40:44.366541+00	Yes	9	137
261	2024-07-18 10:40:44.370451+00	2024-07-18 10:40:44.370455+00	Yes	10	137
262	2024-07-18 10:40:49.910026+00	2024-07-18 10:40:49.910036+00	Yes	11	101
263	2024-07-18 10:40:55.947903+00	2024-07-18 10:40:55.947914+00	Yes	12	138
264	2024-07-18 10:40:55.952325+00	2024-07-18 10:40:55.95233+00	Yes	13	138
265	2024-07-18 10:44:04.013461+00	2024-07-18 10:44:04.013478+00	Yes	14	103
266	2024-07-18 10:44:10.389168+00	2024-07-18 10:44:10.389178+00	Yes	15	104
267	2024-07-18 10:44:10.393432+00	2024-07-18 10:44:10.393438+00	Yes	16	104
268	2024-07-18 10:44:20.267751+00	2024-07-18 10:44:20.267762+00	Yes	17	140
269	2024-07-18 10:44:20.272156+00	2024-07-18 10:44:20.27216+00	No	18	140
270	2024-07-18 10:44:33.186619+00	2024-07-18 10:44:33.186629+00	Yes	19	105
271	2024-07-18 10:44:40.227608+00	2024-07-18 10:44:40.227618+00	Yes	20	106
272	2024-07-18 10:44:40.232018+00	2024-07-18 10:44:40.232023+00	Yes	21	106
273	2024-07-18 10:44:47.018244+00	2024-07-18 10:44:47.018255+00	Yes	22	139
274	2024-07-18 10:44:47.022771+00	2024-07-18 10:44:47.022776+00	Yes	23	139
275	2024-07-18 10:44:47.026722+00	2024-07-18 10:44:47.026727+00	Yes	24	139
276	2024-07-18 10:44:57.201257+00	2024-07-18 10:44:57.201266+00	Yes	25	107
277	2024-07-18 10:45:02.986809+00	2024-07-18 10:45:02.986817+00	Yes	26	141
278	2024-07-18 10:45:08.387007+00	2024-07-18 10:45:08.387016+00	Yes	27	108
279	2024-07-18 10:45:14.113122+00	2024-07-18 10:45:14.113131+00	Yes	28	109
280	2024-07-18 10:45:20.875099+00	2024-07-18 10:45:20.87511+00	Yes	29	110
281	2024-07-18 10:45:29.193912+00	2024-07-18 10:45:29.193922+00	Yes	30	111
282	2024-07-18 10:45:29.198288+00	2024-07-18 10:45:29.198293+00	Yes	31	111
283	2024-07-18 10:45:37.734457+00	2024-07-18 10:45:37.734467+00	Yes	32	112
284	2024-07-18 10:45:43.972138+00	2024-07-18 10:45:43.97215+00	Yes	33	113
285	2024-07-18 10:45:43.976707+00	2024-07-18 10:45:43.976712+00	Yes	34	113
286	2024-07-18 10:45:49.715466+00	2024-07-18 10:45:49.715476+00	No	35	114
287	2024-07-18 10:45:55.486103+00	2024-07-18 10:45:55.486115+00	Yes	36	98
288	2024-07-18 10:46:01.179901+00	2024-07-18 10:46:01.179912+00	Yes	37	115
289	2024-07-18 10:46:01.184083+00	2024-07-18 10:46:01.184087+00	Yes	38	115
290	2024-07-18 10:46:07.379679+00	2024-07-18 10:46:07.379691+00	Yes	39	100
291	2024-07-18 10:46:07.384672+00	2024-07-18 10:46:07.384677+00	Yes	40	100
292	2024-07-18 10:46:13.592846+00	2024-07-18 10:46:13.592856+00	Yes	41	102
293	2024-07-18 10:46:13.597231+00	2024-07-18 10:46:13.597236+00	Yes	42	102
294	2024-07-18 10:46:24.134306+00	2024-07-18 10:46:24.13432+00	Yes	43	116
295	2024-07-18 10:46:24.138403+00	2024-07-18 10:46:24.138407+00	Yes	44	116
296	2024-07-18 10:46:29.65387+00	2024-07-18 10:46:29.653878+00	Yes	45	117
297	2024-07-18 10:46:29.657674+00	2024-07-18 10:46:29.657679+00	Yes	46	117
298	2024-07-18 10:46:35.481163+00	2024-07-18 10:46:35.481173+00	Yes	47	118
299	2024-07-18 10:46:40.445844+00	2024-07-18 10:46:40.445862+00	Yes	48	119
300	2024-07-18 10:46:40.449858+00	2024-07-18 10:46:40.449863+00	Yes	49	119
301	2024-07-18 10:46:46.822145+00	2024-07-18 10:46:46.822158+00	Yes	50	120
302	2024-07-18 10:46:46.826385+00	2024-07-18 10:46:46.82639+00	Yes	51	120
303	2024-07-18 10:46:52.691736+00	2024-07-18 10:46:52.691746+00	Yes	52	121
304	2024-07-18 10:46:52.696217+00	2024-07-18 10:46:52.696222+00	Yes	53	121
305	2024-07-18 10:47:03.319254+00	2024-07-18 10:47:03.319264+00	Yes	54	122
306	2024-07-18 10:47:03.323624+00	2024-07-18 10:47:03.323628+00	Yes	55	122
307	2024-07-18 10:47:10.813333+00	2024-07-18 10:47:10.813344+00	Yes	56	123
308	2024-07-18 10:47:16.490672+00	2024-07-18 10:47:16.490682+00	Yes	57	124
309	2024-07-18 10:47:22.1318+00	2024-07-18 10:47:22.131811+00	Yes	58	125
310	2024-07-18 10:47:29.345278+00	2024-07-18 10:47:29.345297+00	Yes	59	126
311	2024-07-18 10:47:29.349437+00	2024-07-18 10:47:29.349442+00	Yes	60	126
312	2024-07-18 10:47:34.534094+00	2024-07-18 10:47:34.534104+00	Yes	61	127
313	2024-07-18 10:47:40.814984+00	2024-07-18 10:47:40.815008+00	Yes	62	128
314	2024-07-18 10:47:40.819447+00	2024-07-18 10:47:40.819458+00	Yes	63	128
315	2024-07-18 10:47:40.823263+00	2024-07-18 10:47:40.823269+00	Yes	64	128
316	2024-07-18 10:47:46.857973+00	2024-07-18 10:47:46.857983+00	Yes	65	129
317	2024-07-18 10:47:46.862107+00	2024-07-18 10:47:46.862111+00	Yes	66	129
318	2024-07-18 10:47:53.168394+00	2024-07-18 10:47:53.168405+00	Yes	67	130
319	2024-07-18 10:48:01.501387+00	2024-07-18 10:48:01.501405+00	Yes	68	131
320	2024-07-18 10:48:01.505935+00	2024-07-18 10:48:01.50594+00	Yes	69	131
321	2024-07-18 10:48:07.06121+00	2024-07-18 10:48:07.061222+00	Yes	70	132
322	2024-07-18 10:48:07.065586+00	2024-07-18 10:48:07.065591+00	Yes	71	132
323	2024-07-18 10:48:13.174874+00	2024-07-18 10:48:13.174885+00	Yes	72	133
324	2024-07-18 10:48:13.178987+00	2024-07-18 10:48:13.178992+00	Yes	73	133
325	2024-07-18 10:48:30.639925+00	2024-07-18 10:48:30.639942+00	Yes	74	134
326	2024-07-18 10:48:30.644076+00	2024-07-18 10:48:30.64408+00	Yes	75	134
\.


--
-- Data for Name: supplier_questionnaire_sqcategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_questionnaire_sqcategory (id, created, modified, desktop_evidence, category_id) FROM stdin;
1	2024-07-17 13:00:27.845534+00	2024-07-17 13:00:27.84554+00	Mining license\nLegal register of applicable standards, laws and regulations\nProcedures defining the roles, responsibilities and processes for regularly evaluating compliance with applicable standards, laws and regulations, as part of the legal system and/or relevant management systems (e.g. environmental system for environmental compliance)\nRecord of all permits and licenses needed, as well as the timeline and requirements for reapplication	1
2	2024-07-17 13:00:27.850462+00	2024-07-17 13:00:27.850467+00	Corporate or site-level anti-corruption policy and anti-money laundering policy \n\tAnti-corruption and anti-money laundering management system documentation, including procedures for reporting instances of corruption and suspicious transactions\n\tThird-party certificate or validation document of the anti-corruption and anti-money laundering system\nWeblink to public disclosure on measures taken for anti-corruption and anti-money laundering	2
3	2024-07-17 13:00:27.851998+00	2024-07-17 13:00:27.852003+00	\tWhistle-blowing mechanism documentation, including policies, procedures and evidence of how whistle-blowing complaints are handled \n\tThird-party certificate or validation document of the whistle-blowing mechanism	3
4	2024-07-17 13:00:27.853672+00	2024-07-17 13:00:27.853676+00	Company organisational chart\n\tCorporate or site-level policies covering the Principles of the Bettercoal Code \n\tManagement systems documentation, including management systems procedures \n\tOrganisational charts or other documentation of the management structure \n\tThird-party certificates or validation documents of the management systems covering one or more of the environmental, social and governance areas of the Bettercoal Code\n\tSite-level internal audit report(s) of implementation of the management systems from the past 12 months	4
5	2024-07-17 13:00:27.855849+00	2024-07-17 13:00:27.855854+00	\tEnvironmental, social and human rights impact assessments 	5
6	2024-07-17 13:00:27.857173+00	2024-07-17 13:00:27.857177+00	\tKnow Your Counterparty (KYC) procedure documents \n\tDocumented policies, stipulated practices or commitments on responsible business practices formally used to engage significant business partners, including a Code of Conduct for business partners or equivalent \n\tExamples of contractual agreements incorporating provisions on expectations for adherence to the Bettercoal Code or equivalent environmental, social and governance requirements \n\tResponsible sourcing or responsible supply chain policy  	6
7	2024-07-17 13:00:27.859467+00	2024-07-17 13:00:27.859472+00	\tAnnual Sustainability Report or equivalent, publicly disclosed on the website from the last reporting period	7
8	2024-07-17 13:00:27.860939+00	2024-07-17 13:00:27.860944+00	Evidence of public disclosure of your company and beneficial ownership (or Extractive Industries Transparency Initiative (EITI) public statement and publication of EITI report if applicable to country context) from the last reporting period\n\tDisclosure of payments to governments from the last reporting period	8
9	2024-07-17 13:00:27.863491+00	2024-07-17 13:00:27.863496+00	\tMine closure and rehabilitation plan documentation	9
10	2024-07-17 13:00:27.865144+00	2024-07-17 13:00:27.865148+00	\tHuman rights policy, corporate responsibility policy, or other policy or policies documenting respect for human rights \n\tDocumentation of measures taken to avoid and/or mitigate, remediate and compensate impacts	10
11	2024-07-17 13:00:27.868187+00	2024-07-17 13:00:27.868192+00	\tCorporate or site-level policy including a commitment to respect the rights of Indigenous and Tribal Peoples, including the right to Free, Prior and Informed Consent (FPIC)\n\tDocumentation of consultation and engagement activities \n\tProcedure outlining the Free, Prior and Informed Consent (FPIC) process\n\tSigned agreements with Indigenous Peoples’ community leaders, with evidence of appropriate Free, Prior and Informed Consent (FPIC) processes \n\tAssessments of actual and potential adverse impacts on Indigenous Peoples’ lands, livelihoods, resources, and cultural heritage and/or incorporation of Indigenous Peoples’ rights and interests in the environmental, social and human rights risk and impact assessments	11
12	2024-07-17 13:00:27.870238+00	2024-07-17 13:00:27.870242+00	 Corporate or site-level  policy including a commitment on women’s rights and gender equality, or policy statement included in other relevant policies, including, but not limited to, recruitment and human resources policies, codes of conduct etc. \n\tResults of assessments or monitoring reports on women’s rights as part of a Human Rights Impact Assessment or a standalone gender impact assessment \n\tProcedures for the implementation of the company commitment on women’s rights and gender equality	12
13	2024-07-17 13:00:27.871537+00	2024-07-17 13:00:27.871541+00	Corporate or site-level  policy that commits the company to implement the Voluntary Principles on Security and Human Rights \nPolicy and procedures on use of force/rules of engagement \nSecurity risk assessment methodology, reports and findings \nRecords of security incidents 	13
14	2024-07-17 13:00:27.874277+00	2024-07-17 13:00:27.874282+00	\tCorporate or site-level  responsible supply chains policy with respect to sourcing from Conflict-Affected and High-Risk Areas (CAHRAs)\n\tDocumented procedure and/or methodology for Conflict-Affected and High-Risk Area (CAHRA) determination\n\tDocumented procedure for red flags identification and enhanced due diligence\n\tRed flags identification report, risk assessment reports and risk mitigation plan(s) \n\tReports from on-the-ground risk assessments\n\tWeblink to the publicly available due diligence report from previous reporting period	14
15	2024-07-17 13:00:27.877263+00	2024-07-17 13:00:27.877267+00	\tHuman Resources (HR) Manual \nEmployee Handbook \n\tEmployment contract template	15
16	2024-07-17 13:00:27.878777+00	2024-07-17 13:00:27.878782+00	\tCorporate or site-level  policy on child labour\n\tRecruitment policy and age verification procedure for new hires\n\tProcedure to identify risks of child labour and hazardous work \n\tChild labour risk assessment reports	16
17	2024-07-17 13:00:27.880208+00	2024-07-17 13:00:27.880212+00	\tCorporate or site-level  policy covering forced labour\n\tForced labour risk assessment reports\n\tModern Slavery Report, if required by national law\n\tProcedure to identify risks of forced labour\n\tForced Labour government inspection reports from the latest inspections	17
18	2024-07-17 13:00:27.881922+00	2024-07-17 13:00:27.881927+00	\tCorporate or site-level  policy committing to freedom of association and collective bargaining\n\tExistence of functioning workers’ organisations or an alternative mechanism \n\tValid collective bargaining agreement 	18
19	2024-07-17 13:00:27.883592+00	2024-07-17 13:00:27.883599+00	\tCorporate or site-level non-discrimination policy\n\tRecruitment, new employee selection, promotion and dismissal procedures	19
20	2024-07-17 13:00:27.885598+00	2024-07-17 13:00:27.885604+00	\tCorporate or site-level anti harassment policy \n\tProcedures on anti-harassment and disciplinary practices 	20
21	2024-07-17 13:00:27.887846+00	2024-07-17 13:00:27.88785+00	\tCorporate or site-level policy and procedures regulating working hours and leave\n\tVoluntary overtime policy\n\tCorporate or site-level policy or procedures regulating exceptions to working hours and weekly rest if applicable\n\tWorking time schedule	21
22	2024-07-17 13:00:27.889152+00	2024-07-17 13:00:27.889156+00	\tCorporate or site-level policy and procedures covering remuneration practices\n\tWage rates matrix\n\tAnalyses of industry wages and agreements in the area of mining operations\n\tLiving wage calculation study	22
23	2024-07-17 13:00:27.891111+00	2024-07-17 13:00:27.891117+00	\tGrievance mechanism procedures \n\tGrievances logs or reports from the past five years	23
24	2024-07-17 13:00:27.892753+00	2024-07-17 13:00:27.892757+00	\tCorporate or site-level policy on Occupational Health and Safety (OHS)\n\tOccupational Health and Safety (OHS) management system manual \n\tJob descriptions and procedures identifying roles and responsibilities in relation to implementing Occupational Health and Safety (OHS) systems\n\tAllocation of budgetary resources to Occupational Health and Safety (OHS) management 	24
25	2024-07-17 13:00:27.894955+00	2024-07-17 13:00:27.894959+00	\tA risk register that includes the significance or severity, probability and consequences (level of risk of injury or illness) of the full range of potential hazards associated with the mining operation \n\tArea-specific and task-specific hazard risk assessments \n\tAn inventory of chemicals used in the operation 	25
26	2024-07-17 13:00:27.897052+00	2024-07-17 13:00:27.897057+00	\tEmergency procedures \n\tEmergency evacuation plans \n\tPlan to detect, prevent and combat the outbreak and spreading of fires, explosions and flooding that covers operational and abandoned mines \n\tProcedure for mine rescue teams \n\tDescription and frequency of firefighting training and fire and emergency evacuation drills	26
27	2024-07-17 13:00:27.899043+00	2024-07-17 13:00:27.899047+00	Occupational Health and Safety (OHS) training programme and communication materials \nEvidence of existence of a health and safety committee or similar mechanism	27
28	2024-07-17 13:00:27.901854+00	2024-07-17 13:00:27.901858+00	Procedure for the investigation of health and safety incidents\n\tDocumentation of health and safety incidents from the last three years	28
29	2024-07-17 13:00:27.903832+00	2024-07-17 13:00:27.903837+00	\tPolicy and procedures regarding on-site medical facilities and first-aid provisions \n\tPlan to ensure safety of workers and other visitors to the site during a pandemic or other global health emergency	29
30	2024-07-17 13:00:27.907026+00	2024-07-17 13:00:27.90703+00	 Assessments or inspection reports of the conditions of the housing for the last 12 months\n\tInventory of facilities, including safety measures, provided in the accommodation areas\n\tA procedure for regular safety drills for workers in worker housing\nPermit(s) issued by the relevant authority providing approval to use the worker housing facilities as residential areas	30
31	2024-07-17 13:00:27.909439+00	2024-07-17 13:00:27.909443+00	\tCorporate or site-level stakeholder engagement policy\n\tResults of a stakeholder identification or mapping exercise\n\tA Stakeholder Engagement Plan, including implementation schedule and register of completed stakeholder engagement activities	31
32	2024-07-17 13:00:27.911989+00	2024-07-17 13:00:27.911992+00	Risk and impact assessments related to resettlement\n\tResettlement action plan and/or livelihood restoration plan\n\tResettlement monitoring and evaluation reports\n\tDocumentation demonstrating effective engagement, consultation and negotiations with affected stakeholders\nMine expansion plans	32
33	2024-07-17 13:00:27.914554+00	2024-07-17 13:00:27.914561+00	\tCorporate or site-level policy formalising the company’s commitment to community health and safety\n\tCommunity health and safety risk and impact assessments\n\tRecords of lodged grievances relating to community health and safety and records of grievance resolutions from the past five years	33
34	2024-07-17 13:00:27.917574+00	2024-07-17 13:00:27.91758+00	\tSustainable Development Goal (SDG) benchmark or assessment\n\tCorporate or site-level community development policy\n\tLocal procurement policy and evidence of its implementation (i.e. through reporting against performance indicators)	34
35	2024-07-17 13:00:27.920073+00	2024-07-17 13:00:27.920077+00	\tOperational-level grievance mechanism procedures \nRecords of grievances received in the past five years	35
36	2024-07-17 13:00:27.921604+00	2024-07-17 13:00:27.921608+00	\tCorporate or site-level policy articulating the company’s commitment to the protection of cultural heritage \n\tMapping of intangible or tangible cultural heritage in the area of influence \n\tCultural heritage risk and impact assessments \n\tCultural heritage management procedures\n\tChance find procedures 	36
37	2024-07-17 13:00:27.923435+00	2024-07-17 13:00:27.923439+00	\tWater assessment	37
38	2024-07-17 13:00:27.925112+00	2024-07-17 13:00:27.925116+00	\tWater balance, including the calculation used to generate information, analysis of that information and examples of how that is used in the water management system \n\tWater abstraction / water use license \n\tAn assessment of and a post-closure strategy to mitigate the residual risks associated with access to water by local stakeholders and for water quality management, including and especially Acid Rock Drainage (ARD) \n\tAnnual water report to employees, local community and/or shareholders from the latest reporting period	38
39	2024-07-17 13:00:27.94409+00	2024-07-17 13:00:27.944104+00	\tEmissions and waste assessment	39
40	2024-07-17 13:00:27.950202+00	2024-07-17 13:00:27.950207+00	Procedures for the management of emissions and waste\n\tEmissions monitoring protocols \n\tProcedures for the management of spills and leakage with the potential to impact air and soil	40
41	2024-07-17 13:00:27.995393+00	2024-07-17 13:00:27.995399+00	Assessment of tailings impact including assessments of structural stability \n\tDetailed plans of tailings impoundments or dams showing operation options and alternative structures, how catastrophic events can be avoided, and how the structure and management conforms with leading industry standards\n\tEmissions monitoring protocols for tailings management \n\tInventory of tailings structures and operating processes that have the potential to impact employees and communities \n\tProcedures to prevent spills and leakage from tailings structures with the potential to impact air and soil \n\tTailings emergency response plan and evidence that the plan has been written in consultation with stakeholders and employees 	41
42	2024-07-17 13:00:27.998534+00	2024-07-17 13:00:27.998545+00	\tScope 1 and Scope 2 emissions calculation files and reports	42
43	2024-07-17 13:00:28.008047+00	2024-07-17 13:00:28.008075+00	\tClimate change policy\n\tClimate change strategy\n\tCompany reports on greenhouse (GHG) emissions and targets using an internationally reporting protocol, including, Intergovernmental Panel on Climate Change (IPCC) or greehnouse gas (GHG) Protocol, or standard e.g. the Global Reporting Initiative (GRI) Standard \n\tProcedures for monitoring greenhouse gas (GHG) emission trends and setting targets\n\tGreenhouse gas (GHG) emissions disclosure in annual report or corporate sustainability report, website, regulatory submissions, filings, etc.	43
44	2024-07-17 13:00:28.012574+00	2024-07-17 13:00:28.012585+00	Biodiversity Impact Assessment	44
45	2024-07-17 13:00:28.015354+00	2024-07-17 13:00:28.015359+00	Biodiversity and land use policy\nBiodiversity and Land Use Management Plan\nProcedures for the prevention and management of impacts on biodiversity and land use	45
46	2024-07-17 13:00:28.017987+00	2024-07-17 13:00:28.017992+00	Map showing company's location in relation to areas protected or designated for their conservation values \n\tA register of protected areas and other designated areas that are in company's area of operation\n\tA register of protected areas and other designated areas that are in the company's area of operation\n\tLegal documentation or agreement from a government agent, such as a permit or license, authorising company's operations in a protected area and the conditions associated with that operation\n\tA record of consultations with Indigenous or Tribal Peoples’ groups demonstrating their involvement in decisions regarding operating in or near their territory or community where that area is recognised for its conservation values	46
47	2024-07-17 13:00:28.022489+00	2024-07-17 13:00:28.022498+00	\tAssessment of the presence and the risk of alien invasive species associated with the company's operations\n\tProcedures for the prevention of the introduction and accidental spread of invasive alien species and the implementation of management actions in cases where invasive alien species are introduced into the company's area of operation	47
\.


--
-- Data for Name: supplier_questionnaire_sqcategoryresponse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_questionnaire_sqcategoryresponse (id, created, modified, comments, marked_as_completed, sq_category_id, last_submitted_by_id, mine_site_id) FROM stdin;
1	2024-07-17 13:02:09.810916+00	2024-07-17 13:02:09.851379+00	Dicta atque veniam 	t	1	2	1
2	2024-07-17 13:02:30.053501+00	2024-07-17 13:02:30.102077+00	Voluptas aliquip ali	t	2	2	1
3	2024-07-17 13:02:37.989723+00	2024-07-17 13:02:38.01241+00	Ea dolorem laboris s	t	3	2	1
4	2024-07-17 13:02:43.996634+00	2024-07-17 13:02:44.037929+00	Ut quibusdam est ip	t	4	2	1
5	2024-07-17 13:02:52.848781+00	2024-07-17 13:02:52.87651+00	Qui lorem error et a	t	5	2	1
6	2024-07-17 13:03:01.060778+00	2024-07-17 13:03:01.088187+00	Qui voluptas a et de	t	6	2	1
7	2024-07-17 13:03:09.923468+00	2024-07-17 13:03:09.946403+00	Consequatur qui eos	t	7	2	1
8	2024-07-17 13:03:16.295787+00	2024-07-17 13:03:16.322037+00	Alias voluptas labor	t	8	2	1
9	2024-07-17 13:03:21.791144+00	2024-07-17 13:03:21.814187+00	Accusamus ad aut lab	t	9	2	1
10	2024-07-17 13:03:31.501164+00	2024-07-17 13:03:31.527904+00	Corrupti sequi dolo	t	10	2	1
11	2024-07-17 13:03:37.597166+00	2024-07-17 13:03:37.621077+00	Consequatur molesti	t	11	2	1
12	2024-07-17 13:03:47.087717+00	2024-07-17 13:03:47.110087+00	Praesentium est vol	t	12	2	1
13	2024-07-17 13:03:52.091274+00	2024-07-17 13:03:52.117363+00	Labore tempora ipsum	t	13	2	1
14	2024-07-17 13:03:58.669417+00	2024-07-17 13:03:58.69943+00	Facilis harum adipis	t	14	2	1
15	2024-07-17 13:04:06.619669+00	2024-07-17 13:04:06.64232+00	Neque exercitationem	t	15	2	1
16	2024-07-17 13:04:19.009283+00	2024-07-17 13:04:19.045295+00	Consequatur vel aut	t	16	2	1
17	2024-07-17 13:04:24.378125+00	2024-07-17 13:04:24.400792+00	Dolore veniam eum d	t	17	2	1
18	2024-07-17 13:04:30.559775+00	2024-07-17 13:04:30.581973+00	Sequi sed magna ut e	t	18	2	1
19	2024-07-17 13:04:37.737616+00	2024-07-17 13:04:37.760267+00	Laboriosam delectus	t	19	2	1
20	2024-07-17 13:04:43.205261+00	2024-07-17 13:04:43.231789+00	Suscipit nulla dicta	t	20	2	1
21	2024-07-17 13:04:48.620968+00	2024-07-17 13:04:48.646975+00	Corrupti iure et pe	t	21	2	1
22	2024-07-17 13:04:56.358805+00	2024-07-17 13:04:56.386544+00	Id sunt modi sapie	t	22	2	1
23	2024-07-17 13:05:08.255474+00	2024-07-17 13:05:08.278617+00	Et sunt elit conseq	t	23	2	1
24	2024-07-17 13:05:13.860999+00	2024-07-17 13:05:13.883269+00	Cupidatat occaecat s	t	24	2	1
25	2024-07-17 13:05:38.620749+00	2024-07-17 13:05:38.647546+00	Excepturi incididunt	t	25	2	1
26	2024-07-17 13:05:47.125885+00	2024-07-17 13:05:47.159145+00	Nihil velit itaque n	t	26	2	1
27	2024-07-17 13:05:54.455035+00	2024-07-17 13:05:54.481176+00	Facilis consequatur 	t	27	2	1
28	2024-07-17 13:06:00.980144+00	2024-07-17 13:06:01.006971+00	Et enim aspernatur i	t	28	2	1
29	2024-07-17 13:06:13.921396+00	2024-07-17 13:06:13.947916+00	Ipsa tempora ducimu	t	29	2	1
30	2024-07-17 13:06:19.138992+00	2024-07-17 13:06:19.161519+00	Ut consectetur eiusm	t	30	2	1
31	2024-07-17 13:06:23.126804+00	2024-07-17 13:06:23.164511+00	Eaque velit excepte	t	31	2	1
32	2024-07-17 13:06:27.138127+00	2024-07-17 13:06:27.165124+00	Ipsam nihil architec	t	32	2	1
33	2024-07-17 13:06:35.479833+00	2024-07-17 13:06:35.506387+00	Consectetur ut corpo	t	33	2	1
34	2024-07-17 13:06:39.953801+00	2024-07-17 13:06:39.981522+00	Qui perferendis itaq	t	34	2	1
35	2024-07-17 13:06:45.489543+00	2024-07-17 13:06:45.512716+00	Excepteur non nisi p	t	35	2	1
36	2024-07-17 13:06:49.607625+00	2024-07-17 13:06:49.628505+00	Fugiat nisi voluptat	t	36	2	1
37	2024-07-17 13:06:53.646641+00	2024-07-17 13:06:53.671555+00	Consectetur praesen	t	37	2	1
38	2024-07-17 13:06:58.736477+00	2024-07-17 13:06:58.763156+00	Aut qui et dolore ut	t	38	2	1
39	2024-07-17 13:07:02.449871+00	2024-07-17 13:07:02.473031+00	Placeat nisi dolore	t	39	2	1
40	2024-07-17 13:07:07.36336+00	2024-07-17 13:07:07.393951+00	Quia maiores et ut a	t	40	2	1
41	2024-07-17 13:07:11.566904+00	2024-07-17 13:07:11.590847+00	Commodo iusto nemo e	t	41	2	1
42	2024-07-17 13:07:16.87183+00	2024-07-17 13:07:16.894108+00	Non aut sit dolor no	t	42	2	1
43	2024-07-17 13:07:24.794073+00	2024-07-17 13:07:24.834329+00	Cum suscipit eos vit	t	43	2	1
44	2024-07-17 13:07:29.665978+00	2024-07-17 13:07:29.692615+00	Voluptate reprehende	t	44	2	1
45	2024-07-17 13:07:36.713147+00	2024-07-17 13:07:36.740041+00	Libero quia quo sed 	t	45	2	1
46	2024-07-17 13:07:43.020061+00	2024-07-17 13:07:43.054036+00	Porro do quisquam la	t	46	2	1
47	2024-07-17 13:07:49.007532+00	2024-07-17 13:07:49.028089+00	Elit sequi velit q	t	47	2	1
48	2024-07-18 09:41:37.057235+00	2024-07-18 09:41:37.092576+00	Molestias ut dolorem	t	1	5	2
49	2024-07-18 09:41:58.739721+00	2024-07-18 09:41:58.762285+00	Voluptates incidunt	t	2	5	2
50	2024-07-18 09:42:09.109554+00	2024-07-18 09:42:09.130462+00	Quia sint non animi	t	3	5	2
71	2024-07-18 10:20:12.374113+00	2024-07-18 10:36:08.465186+00	<p>Voluptatem ipsum ni</p>\r\n	t	24	5	2
52	2024-07-18 09:42:28.369267+00	2024-07-18 09:42:28.393979+00	Omnis ea lorem volup	t	5	5	2
73	2024-07-18 10:20:29.817845+00	2024-07-18 10:36:30.667091+00	<p>Voluptas tempore nu</p>\r\n	t	26	5	2
54	2024-07-18 09:43:02.542811+00	2024-07-18 09:43:02.565946+00	Tempora occaecat sun	t	7	5	2
74	2024-07-18 10:20:41.763218+00	2024-07-18 10:36:37.898876+00	<p>Consequatur Dolorem</p>\r\n	t	27	5	2
56	2024-07-18 09:46:04.443273+00	2024-07-18 09:46:04.490537+00	Minima quis quae mol	t	9	5	2
57	2024-07-18 10:17:27.253486+00	2024-07-18 10:17:27.281483+00	Expedita nostrud vit	t	10	5	2
59	2024-07-18 10:17:47.74987+00	2024-07-18 10:17:47.770741+00	Labore placeat mole	t	12	5	2
60	2024-07-18 10:18:00.227183+00	2024-07-18 10:18:00.254739+00	Temporibus laboriosa	t	13	5	2
62	2024-07-18 10:18:32.923805+00	2024-07-18 10:18:32.972239+00	Itaque do veritatis 	t	15	5	2
64	2024-07-18 10:18:55.195559+00	2024-07-18 10:18:55.217746+00	Quaerat voluptate au	t	17	5	2
65	2024-07-18 10:19:08.497657+00	2024-07-18 10:19:08.520881+00	Accusantium dolorem 	t	18	5	2
66	2024-07-18 10:19:18.191383+00	2024-07-18 10:19:18.213717+00	Et impedit consequa	t	19	5	2
67	2024-07-18 10:19:28.383528+00	2024-07-18 10:19:28.409838+00	Cupiditate occaecat 	t	20	5	2
68	2024-07-18 10:19:41.027191+00	2024-07-18 10:19:41.049282+00	Perferendis possimus	t	21	5	2
69	2024-07-18 10:19:51.07162+00	2024-07-18 10:19:51.098158+00	Non reprehenderit as	t	22	5	2
70	2024-07-18 10:20:03.526249+00	2024-07-18 10:20:03.548497+00	Temporibus esse vit	t	23	5	2
72	2024-07-18 10:20:22.377935+00	2024-07-18 10:20:22.407978+00	Quae commodi odit et	t	25	5	2
75	2024-07-18 10:20:51.664414+00	2024-07-18 10:20:51.696223+00	Inventore provident	t	28	5	2
76	2024-07-18 10:21:08.681762+00	2024-07-18 10:21:08.709222+00	Quia ut officiis vol	t	29	5	2
77	2024-07-18 10:21:27.421834+00	2024-07-18 10:21:27.444842+00	Eos tempore eos se	t	30	5	2
78	2024-07-18 10:21:42.058569+00	2024-07-18 10:21:42.085943+00	Assumenda quia perfe	t	31	5	2
79	2024-07-18 10:21:52.026915+00	2024-07-18 10:21:52.053771+00	Ex voluptas cupidata	t	32	5	2
80	2024-07-18 10:22:06.732252+00	2024-07-18 10:22:06.770457+00	Ratione sequi conseq	t	33	5	2
81	2024-07-18 10:22:17.845614+00	2024-07-18 10:22:17.87075+00	Ut eu incidunt dese	t	34	5	2
82	2024-07-18 10:22:28.633152+00	2024-07-18 10:22:28.663825+00	Qui consectetur dol	t	35	5	2
83	2024-07-18 10:27:54.003401+00	2024-07-18 10:27:54.035717+00	<h2>Signals in Django</h2>\r\n\r\n<p dir="ltr">Signals are used to perform any action on modification of a model instance. The signals are utilities that help us to connect events with actions. We can develop a function that will run when a signal calls it. In other words, Signals are used to perform some action on the modification/creation of a particular entry in the Database. For example, One would want to create a profile instance, as soon as a new user instance is created in Database</p>\r\n	t	36	5	2
84	2024-07-18 10:28:04.938285+00	2024-07-18 10:28:04.961277+00	<h2>Signals in Django</h2>\r\n\r\n<p dir="ltr">Signals are used to perform any action on modification of a model instance. The signals are utilities that help us to connect events with actions. We can develop a function that will run when a signal calls it. In other words, Signals are used to perform some action on the modification/creation of a particular entry in the Database. For example, One would want to create a profile instance, as soon as a new user instance is created in Database</p>\r\n	t	37	5	2
85	2024-07-18 10:28:20.745312+00	2024-07-18 10:28:20.787266+00	<h2>Signals in Django</h2>\r\n\r\n<p dir="ltr">Signals are used to perform any action on modification of a model instance. The signals are utilities that help us to connect events with actions. We can develop a function that will run when a signal calls it. In other words, Signals are used to perform some action on the modification/creation of a particular entry in the Database. For example, One would want to create a profile instance, as soon as a new user instance is created in Database</p>\r\n	t	38	5	2
86	2024-07-18 10:29:01.438239+00	2024-07-18 10:29:01.468667+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	39	5	2
87	2024-07-18 10:29:19.835377+00	2024-07-18 10:29:19.880377+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	40	5	2
88	2024-07-18 10:29:34.436954+00	2024-07-18 10:29:34.463389+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	41	5	2
89	2024-07-18 10:29:51.495573+00	2024-07-18 10:29:51.518257+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	42	5	2
90	2024-07-18 10:30:06.362552+00	2024-07-18 10:30:06.390244+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	43	5	2
91	2024-07-18 10:30:19.230216+00	2024-07-18 10:30:19.268256+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	44	5	2
92	2024-07-18 10:30:44.666182+00	2024-07-18 10:30:44.691752+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	45	5	2
93	2024-07-18 10:31:06.336168+00	2024-07-18 10:31:06.390638+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	46	5	2
94	2024-07-18 10:31:18.544291+00	2024-07-18 10:31:18.565556+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	47	5	2
51	2024-07-18 09:42:18.133148+00	2024-07-18 10:31:37.226191+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	4	5	2
53	2024-07-18 09:42:36.118986+00	2024-07-18 10:33:47.927309+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	6	5	2
55	2024-07-18 09:43:28.806195+00	2024-07-18 10:34:12.429534+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	8	5	2
61	2024-07-18 10:18:13.576243+00	2024-07-18 10:34:58.841717+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	14	5	2
58	2024-07-18 10:17:37.289667+00	2024-07-18 10:35:20.593949+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	11	5	2
63	2024-07-18 10:18:46.678482+00	2024-07-18 10:35:40.321411+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	16	5	2
95	2024-07-18 10:39:42.898153+00	2024-07-18 10:40:09.88619+00	<p>Molestias ut dolorem</p>\r\n	t	1	5	3
96	2024-07-18 10:39:42.951338+00	2024-07-18 10:40:21.023548+00	<p>Voluptates incidunt</p>\r\n	t	2	5	3
97	2024-07-18 10:39:42.983803+00	2024-07-18 10:40:26.283158+00	<p>Quia sint non animi</p>\r\n	t	3	5	3
99	2024-07-18 10:39:43.0328+00	2024-07-18 10:40:38.167142+00	<p>Omnis ea lorem volup</p>\r\n	t	5	5	3
101	2024-07-18 10:39:43.072162+00	2024-07-18 10:40:49.918986+00	<p>Tempora occaecat sun</p>\r\n	t	7	5	3
103	2024-07-18 10:39:43.112046+00	2024-07-18 10:44:04.05748+00	<p>Minima quis quae mol</p>\r\n	t	9	5	3
104	2024-07-18 10:39:43.13566+00	2024-07-18 10:44:10.40161+00	<p>Expedita nostrud vit</p>\r\n	t	10	5	3
105	2024-07-18 10:39:43.157734+00	2024-07-18 10:44:33.195692+00	<p>Labore placeat mole</p>\r\n	t	12	5	3
106	2024-07-18 10:39:43.176491+00	2024-07-18 10:44:40.2413+00	<p>Temporibus laboriosa</p>\r\n	t	13	5	3
107	2024-07-18 10:39:43.198602+00	2024-07-18 10:44:57.242484+00	<p>Itaque do veritatis</p>\r\n	t	15	5	3
108	2024-07-18 10:39:43.220498+00	2024-07-18 10:45:08.395845+00	<p>Quaerat voluptate au</p>\r\n	t	17	5	3
109	2024-07-18 10:39:43.239033+00	2024-07-18 10:45:14.122195+00	<p>Accusantium dolorem</p>\r\n	t	18	5	3
111	2024-07-18 10:39:43.274918+00	2024-07-18 10:45:29.207769+00	<p>Cupiditate occaecat</p>\r\n	t	20	5	3
112	2024-07-18 10:39:43.296147+00	2024-07-18 10:45:37.742806+00	<p>Perferendis possimus</p>\r\n	t	21	5	3
113	2024-07-18 10:39:43.314523+00	2024-07-18 10:45:43.985601+00	<p>Non reprehenderit as</p>\r\n	t	22	5	3
114	2024-07-18 10:39:43.336389+00	2024-07-18 10:45:49.725493+00	<p>Temporibus esse vit</p>\r\n	t	23	5	3
98	2024-07-18 10:39:43.014829+00	2024-07-18 10:45:55.500684+00	<p>Voluptatem ipsum ni</p>\r\n	t	24	5	3
115	2024-07-18 10:39:43.354478+00	2024-07-18 10:46:01.192637+00	<p>Quae commodi odit et</p>\r\n	t	25	5	3
100	2024-07-18 10:39:43.050697+00	2024-07-18 10:46:07.393693+00	<p>Voluptas tempore nu</p>\r\n	t	26	5	3
102	2024-07-18 10:39:43.090246+00	2024-07-18 10:46:13.60599+00	<p>Consequatur Dolorem</p>\r\n	t	27	5	3
116	2024-07-18 10:39:43.376137+00	2024-07-18 10:46:24.146553+00	<p>Inventore provident</p>\r\n	t	28	5	3
117	2024-07-18 10:39:43.39764+00	2024-07-18 10:46:29.665889+00	<p>Quia ut officiis vol</p>\r\n	t	29	5	3
119	2024-07-18 10:39:43.436964+00	2024-07-18 10:46:40.457945+00	<p>Assumenda quia perfe</p>\r\n	t	31	5	3
120	2024-07-18 10:39:43.458923+00	2024-07-18 10:46:46.835223+00	<p>Ex voluptas cupidata</p>\r\n	t	32	5	3
121	2024-07-18 10:39:43.480616+00	2024-07-18 10:46:52.705114+00	<p>Ratione sequi conseq</p>\r\n	t	33	5	3
122	2024-07-18 10:39:43.502069+00	2024-07-18 10:47:03.332345+00	<p>Ut eu incidunt dese</p>\r\n	t	34	5	3
123	2024-07-18 10:39:43.523276+00	2024-07-18 10:47:10.822986+00	<p>Qui consectetur dol</p>\r\n	t	35	5	3
125	2024-07-18 10:39:43.55969+00	2024-07-18 10:47:22.141023+00	<h2>Signals in Django</h2>\r\n\r\n<p dir="ltr">Signals are used to perform any action on modification of a model instance. The signals are utilities that help us to connect events with actions. We can develop a function that will run when a signal calls it. In other words, Signals are used to perform some action on the modification/creation of a particular entry in the Database. For example, One would want to create a profile instance, as soon as a new user instance is created in Database</p>\r\n	t	37	5	3
137	2024-07-18 10:39:43.829207+00	2024-07-18 10:40:44.378713+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	6	5	3
126	2024-07-18 10:39:43.577716+00	2024-07-18 10:47:29.3577+00	<h2>Signals in Django</h2>\r\n\r\n<p dir="ltr">Signals are used to perform any action on modification of a model instance. The signals are utilities that help us to connect events with actions. We can develop a function that will run when a signal calls it. In other words, Signals are used to perform some action on the modification/creation of a particular entry in the Database. For example, One would want to create a profile instance, as soon as a new user instance is created in Database</p>\r\n	t	38	5	3
127	2024-07-18 10:39:43.600558+00	2024-07-18 10:47:34.549088+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	39	5	3
128	2024-07-18 10:39:43.618947+00	2024-07-18 10:47:40.831953+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	40	5	3
129	2024-07-18 10:39:43.64448+00	2024-07-18 10:47:46.870114+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	41	5	3
130	2024-07-18 10:39:43.674409+00	2024-07-18 10:47:53.177384+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	42	5	3
131	2024-07-18 10:39:43.694193+00	2024-07-18 10:48:01.514797+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	43	5	3
132	2024-07-18 10:39:43.71673+00	2024-07-18 10:48:07.074568+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	44	5	3
133	2024-07-18 10:39:43.738549+00	2024-07-18 10:48:13.187215+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	45	5	3
134	2024-07-18 10:39:43.760193+00	2024-07-18 10:48:30.659103+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	46	5	3
135	2024-07-18 10:39:43.789079+00	2024-07-18 10:48:36.206297+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	47	5	3
136	2024-07-18 10:39:43.80708+00	2024-07-18 10:40:33.035605+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	4	5	3
138	2024-07-18 10:39:43.850855+00	2024-07-18 10:40:56.001573+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	8	5	3
140	2024-07-18 10:39:43.901675+00	2024-07-18 10:44:20.281594+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	11	5	3
139	2024-07-18 10:39:43.876849+00	2024-07-18 10:44:47.03552+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	14	5	3
141	2024-07-18 10:39:43.923148+00	2024-07-18 10:45:02.996147+00	<p dir="ltr"><strong><strong>There are 3 types of signals:</strong></strong></p>\r\n\r\n<ol>\r\n\t<li value="1"><strong><strong>pre_save/post_save</strong></strong>: This signal works before/after the method save().</li>\r\n\t<li value="2"><strong><strong>pre_delete/post_delete</strong></strong>: This signal works before after deleting a model&rsquo;s instance (method delete()) this signal is thrown.</li>\r\n\t<li value="3"><strong><strong>pre_init/post_init</strong></strong>: This signal is thrown before/after instantiating a model (__init__() method).</li>\r\n</ol>\r\n	t	16	5	3
110	2024-07-18 10:39:43.257218+00	2024-07-18 10:45:20.884298+00	<p>Et impedit consequa</p>\r\n	t	19	5	3
118	2024-07-18 10:39:43.418919+00	2024-07-18 10:46:35.490483+00	<p>Eos tempore eos se</p>\r\n	t	30	5	3
124	2024-07-18 10:39:43.541592+00	2024-07-18 10:47:16.499806+00	<h2>Signals in Django</h2>\r\n\r\n<p dir="ltr">Signals are used to perform any action on modification of a model instance. The signals are utilities that help us to connect events with actions. We can develop a function that will run when a signal calls it. In other words, Signals are used to perform some action on the modification/creation of a particular entry in the Database. For example, One would want to create a profile instance, as soon as a new user instance is created in Database</p>\r\n	t	36	5	3
\.


--
-- Data for Name: supplier_questionnaire_sqquestion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_questionnaire_sqquestion (id, created, modified, text, sq_category_id) FROM stdin;
1	2024-07-17 13:00:27.846485+00	2024-07-17 13:00:27.84649+00	Do you have a system for ensuring compliance with all applicable laws and regulations, including those covering environmental, social and governance areas?	1
2	2024-07-17 13:00:27.848259+00	2024-07-17 13:00:27.848266+00	Do you have all relevant permits and licenses needed to operate?	1
3	2024-07-17 13:00:27.849018+00	2024-07-17 13:00:27.849023+00	Have you received any regulatory notices or fines due to legal non-compliance of your operations?	1
4	2024-07-17 13:00:27.850708+00	2024-07-17 13:00:27.850712+00	Do you have a system to prevent corruption (including bribery, bribe solicitation, facilitation payment and extortion) and money laundering?	2
5	2024-07-17 13:00:27.852221+00	2024-07-17 13:00:27.852225+00	Do you have a whistle-blowing mechanism and procedure for ensuring its effective implementation?	3
6	2024-07-17 13:00:27.853887+00	2024-07-17 13:00:27.853891+00	Do you have and publicly disclose policies covering one or more of the Principles of the Bettercoal Code (e.g. environmental policy, health and safety policy etc.)?	4
7	2024-07-17 13:00:27.85463+00	2024-07-17 13:00:27.854635+00	Do you have an integrated and/or standalone management system, covering one or more of the areas of the Bettercoal Code (e.g. environmental management system, health and safety management system etc.)?	4
8	2024-07-17 13:00:27.856044+00	2024-07-17 13:00:27.856048+00	Do you conduct environmental, social and human rights risk and impact assessments?	5
9	2024-07-17 13:00:27.857387+00	2024-07-17 13:00:27.857391+00	Do you conduct Know Your Counterparty (KYC) checks on all of your business partners?	6
10	2024-07-17 13:00:27.858066+00	2024-07-17 13:00:27.858071+00	Do you communicate your environmental, social and governance (ESG) commitments to your business partners including through contractual agreements?	6
11	2024-07-17 13:00:27.859678+00	2024-07-17 13:00:27.859682+00	Do you publish an annual sustainability report or equivalent?	7
12	2024-07-17 13:00:27.861187+00	2024-07-17 13:00:27.861192+00	Do you publicly disclose your company ownership, including beneficial ownership?	8
13	2024-07-17 13:00:27.861937+00	2024-07-17 13:00:27.861941+00	Do you publicly disclose annually all material payments, including taxes, made to the government where you operate?	8
14	2024-07-17 13:00:27.863714+00	2024-07-17 13:00:27.863718+00	Have you developed a mine closure and rehabilitation plan?	9
15	2024-07-17 13:00:27.865365+00	2024-07-17 13:00:27.865369+00	Do you have a human rights policy?	10
16	2024-07-17 13:00:27.866356+00	2024-07-17 13:00:27.866362+00	Have you assessed your actual and/or potential human rights impacts?	10
17	2024-07-17 13:00:27.868413+00	2024-07-17 13:00:27.868417+00	Have you assessed the actual and potential impacts on Indigenous and Tribal Peoples and their lands, territories and resources?	11
18	2024-07-17 13:00:27.869095+00	2024-07-17 13:00:27.869099+00	Do you commit to respecting the principles of Free, Prior and Informed Consent (FPIC) and do you have systems in place to implement this commitment?	11
19	2024-07-17 13:00:27.870445+00	2024-07-17 13:00:27.870449+00	Do you have a system to implement a policy on women’s rights and gender equality?	12
20	2024-07-17 13:00:27.871732+00	2024-07-17 13:00:27.871736+00	Do you have a system to ensure that the company operates in accordance with the Voluntary Principles on Security and Human Rights, including, for example, training of security forces?	13
21	2024-07-17 13:00:27.872358+00	2024-07-17 13:00:27.872362+00	Have you assessed security risks and potential human rights impacts that may arise from security arrangements?	13
22	2024-07-17 13:00:27.874538+00	2024-07-17 13:00:27.874544+00	Do you have a responsible supply chains policy with respect to sourcing from Conflict-Affected and High-Risk Areas (CAHRAs)?	14
23	2024-07-17 13:00:27.875229+00	2024-07-17 13:00:27.875233+00	Do you have a methodology to determine Conflict-Affected and High-Risk Areas (CAHRAs)?	14
24	2024-07-17 13:00:27.875886+00	2024-07-17 13:00:27.875891+00	Do you have a due diligence system aligned with the Organisation for Economic Co-operation and Development (OECD) Due Diligence Guidance for Responsible Supply Chains of Minerals from Conflict-Affected and High-Risk Areas (CAHRAs)?	14
25	2024-07-17 13:00:27.877494+00	2024-07-17 13:00:27.877498+00	Do you communicate to your employees information regarding their employment rights under national and local labour and employment law, and any applicable collective agreements?	15
26	2024-07-17 13:00:27.879007+00	2024-07-17 13:00:27.87901+00	Do you have a system in place to prevent and manage risks of child labour and, in particular, the Worst Forms of Child Labour?	16
27	2024-07-17 13:00:27.880469+00	2024-07-17 13:00:27.880475+00	Do you have a system in place to prevent and manage risks of forced labour?	17
28	2024-07-17 13:00:27.882151+00	2024-07-17 13:00:27.882155+00	Do you have a system in place to ensure freedom of association and collective bargaining?	18
29	2024-07-17 13:00:27.883896+00	2024-07-17 13:00:27.883902+00	Do you have a system in place to ensure the implementation of the non-discrimination policy?	19
30	2024-07-17 13:00:27.885845+00	2024-07-17 13:00:27.88585+00	Do you have a system to prevent harassment, intimidation, and/or exploitation in the workplace?	20
31	2024-07-17 13:00:27.886646+00	2024-07-17 13:00:27.886651+00	Do you have a procedure covering disciplinary practices?	20
32	2024-07-17 13:00:27.888061+00	2024-07-17 13:00:27.888065+00	Do you apply exceptions to the number of regular and overtime hours, and provision of rest days due to special circumstances, such as employees on a fly-in fly-out roster, or due to freely negotiated collective bargaining agreement allowing higher limits and averaging of working time?	21
33	2024-07-17 13:00:27.889347+00	2024-07-17 13:00:27.889351+00	What is the remuneration system adopted by your company?	22
34	2024-07-17 13:00:27.889965+00	2024-07-17 13:00:27.889969+00	Have you determined the living wage relevant for the country where you operate?	22
35	2024-07-17 13:00:27.891358+00	2024-07-17 13:00:27.891362+00	Do you have a worker grievance mechanism?	23
36	2024-07-17 13:00:27.893748+00	2024-07-17 13:00:27.893752+00	Do you have a formal Occupational Health and Safety (OHS) system?	24
37	2024-07-17 13:00:27.895183+00	2024-07-17 13:00:27.895187+00	Do you have a system for identifying and controlling workplace risks and hazards?	25
38	2024-07-17 13:00:27.895872+00	2024-07-17 13:00:27.895876+00	What type of Occupational Health and Safety (OHS) risks and hazards have you identified?	25
39	2024-07-17 13:00:27.897269+00	2024-07-17 13:00:27.897273+00	Do you have emergency procedures and evacuation plans?	26
40	2024-07-17 13:00:27.897928+00	2024-07-17 13:00:27.897933+00	Do you conduct regular drills to test your procedures?	26
41	2024-07-17 13:00:27.899342+00	2024-07-17 13:00:27.899347+00	Do you provide workers with regular education and training?	27
42	2024-07-17 13:00:27.900324+00	2024-07-17 13:00:27.900332+00	Do you have a mechanism such as a joint health and safety committee to enable workers to raise and discuss health and safety issues with management?	27
43	2024-07-17 13:00:27.90207+00	2024-07-17 13:00:27.902075+00	Do you have a system to investigate all health and safety incidents?	28
44	2024-07-17 13:00:27.902736+00	2024-07-17 13:00:27.90274+00	Do you record near misses?	28
45	2024-07-17 13:00:27.904037+00	2024-07-17 13:00:27.904041+00	Do you have on-site clinic facilities?	29
46	2024-07-17 13:00:27.905203+00	2024-07-17 13:00:27.905207+00	Do you provide on-site health and medical facilities and first-aid?	29
47	2024-07-17 13:00:27.907414+00	2024-07-17 13:00:27.907418+00	Do you provide worker housing?	30
48	2024-07-17 13:00:27.90971+00	2024-07-17 13:00:27.909714+00	Have you undertaken a stakeholder mapping exercise?	31
49	2024-07-17 13:00:27.910656+00	2024-07-17 13:00:27.910661+00	Do you have a system for stakeholder engagement?	31
50	2024-07-17 13:00:27.912227+00	2024-07-17 13:00:27.912231+00	Has there ever been a need for involuntary resettlement at your company site?	32
51	2024-07-17 13:00:27.913125+00	2024-07-17 13:00:27.913129+00	Do you have mining expansion plans, that may lead to risks of involuntary resettlement in the future?	32
52	2024-07-17 13:00:27.914807+00	2024-07-17 13:00:27.914811+00	Have you undertaken an assessment of the risks and impacts of your operations on community health and safety?	33
53	2024-07-17 13:00:27.916013+00	2024-07-17 13:00:27.916018+00	Do you have a system to monitor community health and safety and to prevent and mitigate potential impacts?	33
54	2024-07-17 13:00:27.917824+00	2024-07-17 13:00:27.917829+00	Have you conducted a company benchmark to the Sustainable Development Goals (SDGs)?	34
55	2024-07-17 13:00:27.918702+00	2024-07-17 13:00:27.918706+00	Do you have a community development policy?	34
56	2024-07-17 13:00:27.920304+00	2024-07-17 13:00:27.920308+00	Do you have an operational-level grievance mechanism for stakeholders?	35
57	2024-07-17 13:00:27.921838+00	2024-07-17 13:00:27.921842+00	Have you identified cultural heritage within your area of influence?	36
58	2024-07-17 13:00:27.923702+00	2024-07-17 13:00:27.923706+00	Have you undertaken a water assessment?	37
59	2024-07-17 13:00:27.925356+00	2024-07-17 13:00:27.92536+00	Do you have a water management system?	38
60	2024-07-17 13:00:27.926188+00	2024-07-17 13:00:27.926193+00	Do you have water consumption reduction targets?	38
61	2024-07-17 13:00:27.947434+00	2024-07-17 13:00:27.947448+00	Have you undertaken an assessment of the emissions and waste generated by your operations?	39
62	2024-07-17 13:00:27.954252+00	2024-07-17 13:00:27.954265+00	Do you have a system to manage waste?	40
63	2024-07-17 13:00:27.988998+00	2024-07-17 13:00:27.989031+00	Do you have a system to manage emissions?	40
64	2024-07-17 13:00:27.993684+00	2024-07-17 13:00:27.993695+00	Do you have a system to manage Acid Rock Drainage (ARD)?	40
65	2024-07-17 13:00:27.995703+00	2024-07-17 13:00:27.995708+00	Do you assess the environmental, social and health and safety impacts of tailings?	41
66	2024-07-17 13:00:27.996608+00	2024-07-17 13:00:27.996614+00	Do you have a tailings emergency response plan?	41
67	2024-07-17 13:00:27.999876+00	2024-07-17 13:00:27.999909+00	Do you assess and quantify Scope 1 and Scope 2 greenhouse gas (GHG) emissions ?	42
68	2024-07-17 13:00:28.008978+00	2024-07-17 13:00:28.008991+00	Have you set greenhouse gas (GHG) emissions reduction targets?	43
69	2024-07-17 13:00:28.010496+00	2024-07-17 13:00:28.010507+00	Do you have a system to monitor greenhouse gas (GHG) emissions and ensure the implementation of greenhouse gas (GHG) emission reduction activities?	43
70	2024-07-17 13:00:28.012905+00	2024-07-17 13:00:28.012913+00	Have you undertaken an assessment of the potential and actual impacts of your operations on biodiversity?	44
71	2024-07-17 13:00:28.013865+00	2024-07-17 13:00:28.01387+00	Are there plans to expand the mine which will require land acquisition?	44
72	2024-07-17 13:00:28.015616+00	2024-07-17 13:00:28.015621+00	Do you have a system in place to manage impacts on biodiversity and land use?	45
73	2024-07-17 13:00:28.016454+00	2024-07-17 13:00:28.016459+00	Do you have a public commitment to achieve no net loss of biodiversity and strive to achieve a net gain of biodiversity?	45
74	2024-07-17 13:00:28.018253+00	2024-07-17 13:00:28.018258+00	Have any IUCN categorised threatened species been identified within the mine boundary and Project Area of Influence?	46
75	2024-07-17 13:00:28.019118+00	2024-07-17 13:00:28.019123+00	Are you situated near a World Heritage Site?	46
76	2024-07-17 13:00:28.019931+00	2024-07-17 13:00:28.019935+00	Have any threatened species been identified within the mine boundary?	46
77	2024-07-17 13:00:28.020807+00	2024-07-17 13:00:28.020811+00	Are there any wetlands within the mine boundary and/or area of influence?	46
78	2024-07-17 13:00:28.022816+00	2024-07-17 13:00:28.022822+00	Have you undertaken an assessment to identify the potential or actual risk of deliberately or accidentally introducing alien invasive species and their consequent risks to biodiversity?	47
\.


--
-- Data for Name: two_factor_phonedevice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.two_factor_phonedevice (id, name, confirmed, number, key, method, user_id, throttling_failure_count, throttling_failure_timestamp) FROM stdin;
\.


--
-- Data for Name: users_assessorprofile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_assessorprofile (id, created, modified, can_be_lead_assessor, user_id, biography, direct_phone_number, office_address, office_address_country, office_address_region, timezone, cv_id, current_organisation, is_registration_completed, signed_nda_id) FROM stdin;
2	2024-07-17 12:44:51.178692+00	2024-07-17 12:46:26.13327+00	t	4	Nobis laboriosam vo	+1 (587) 705-7582	Necessitatibus debitis itaque error id	GI	Cupiditate reiciendis modi illum qui voluptatem quia et qui totam omnis vel sunt repudiandae natus fuga Et amet	Asia/Thimphu	\N	Berg Lewis Trading-Assessors	t	5
\.


--
-- Data for Name: users_company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_company (id, created, modified, company_name) FROM stdin;
\.


--
-- Data for Name: users_memberprofile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_memberprofile (id, created, modified, is_registration_completed, user_id) FROM stdin;
\.


--
-- Data for Name: users_memberprofile_assurance_processes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_memberprofile_assurance_processes (id, memberprofile_id, assuranceprocess_id) FROM stdin;
\.


--
-- Data for Name: users_supplierorganisation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_supplierorganisation (id, created, modified, name, coordinator_id, head_office_address, head_office_address_region, logo, has_parent_company, parent_company_address, parent_company_address_region, head_office_address_country, parent_company_address_country, head_office_timezone, parent_company_timezone, public_id, parent_company_name) FROM stdin;
1	2024-07-17 12:12:25.099837+00	2024-07-17 12:13:13.169272+00	Bradshaw Reid LLC-Producer	2	Omnis saepe velit blanditiis voluptatem quasi sint velit	Aut reprehenderit modi quod assumenda aliquip eiusmod qui quod dolor cupidatat aut ea recusandae Non		No	\N	\N	GR	\N	Antarctica/Palmer		7T8DH7	\N
2	2024-07-18 08:44:23.081416+00	2024-07-18 08:46:10.273394+00	Glenn and Joseph Co-Producer	5	Rem dolorem officia omnis ut asperiores illo eu porro voluptas omnis deserunt atque vel elit vel voluptatibus enim omnis	Ea sequi doloremque aperiam cupiditate commodo magni numquam et a tempor nostrud		No	\N	\N	BS	\N	Australia/Adelaide		U4BPFP	\N
\.


--
-- Data for Name: users_supplierprofile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_supplierprofile (id, created, modified, organisation_id, user_id, direct_phone_number, role_or_position, office_address, office_address_region, is_registration_completed, timezone, office_address_country) FROM stdin;
2	2024-07-18 08:44:23.106794+00	2024-07-18 08:46:10.281598+00	2	5	+1 (221) 908-6181	Vitae eveniet qui consectetur temporibus aliquam dolore ipsum nostrud sapiente cupiditate nulla et	Rem dolorem officia omnis ut asperiores illo eu porro voluptas omnis deserunt atque vel elit vel voluptatibus enim omnis	Ea sequi doloremque aperiam cupiditate commodo magni numquam et a tempor nostrud	t	Australia/Adelaide	BS
1	2024-07-17 12:12:25.117724+00	2024-07-17 12:13:13.177814+00	1	2	+1 (798) 305-7087	CEO	Omnis saepe velit blanditiis voluptatem quasi sint velit	Aut reprehenderit modi quod assumenda aliquip eiusmod qui quod dolor cupidatat aut ea recusandae Non	t	Antarctica/Palmer	GR
\.


--
-- Data for Name: users_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_user (id, password, last_login, is_superuser, username, email, is_staff, is_active, date_joined, name, role, needs_to_set_password, public_id, notifications_last_viewed_at, company_id) FROM stdin;
1	argon2$argon2i$v=19$m=512,t=2,p=2$R09vUElFVTlIZk9D$PXrgDVGvbuLRvZb1o4p+3A	2024-07-17 11:38:22+00	t	imireallan	imireallan@gmail.com	t	t	2024-07-17 11:36:07+00	Allan Imire	Secretariat	f	49Q5PY	2024-07-17 11:36:08.685868+00	\N
2	argon2$argon2i$v=19$m=512,t=2,p=2$VUlEbnNDaE9URWo0$wmfvZq82s3YyqCc80fmCTg	2024-07-17 12:12:58.041014+00	f	parolovo@mailinator.com	parolovo@mailinator.com	f	t	2024-07-17 12:12:25.107625+00	Melodie Odonnell-Producer	Supplier	f	PA9CN4	2024-07-17 12:12:25.107862+00	\N
4	argon2$argon2i$v=19$m=512,t=2,p=2$ODlLT0w0WmtHQmVi$5jsDJCKFkagcgrKIHwaqRQ	2024-07-17 12:46:12.763584+00	f	teja@mailinator.com	teja@mailinator.com	f	t	2024-07-17 12:44:51.165082+00	Melissa Mcknight-Assessor	Assessor	f	MMHKDB	2024-07-17 12:44:51.16542+00	\N
5	argon2$argon2i$v=19$m=512,t=2,p=2$THg4bW9yZXpJc1dC$ZelRlvWxn0kLOO7+XJ4ePQ	2024-07-18 08:45:37.683447+00	f	nujo@mailinator.com	nujo@mailinator.com	f	t	2024-07-18 08:44:23.09037+00	Zahir Rosales-Producer	Supplier	f	N2SYW7	2024-07-18 08:44:23.090581+00	\N
\.


--
-- Data for Name: users_user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: users_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_emailaddress_id_seq', 1, false);


--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_emailconfirmation_id_seq', 1, false);


--
-- Name: actstream_action_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actstream_action_id_seq', 16, true);


--
-- Name: actstream_follow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actstream_follow_id_seq', 1, false);


--
-- Name: assessment_planning_assessmentplan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_planning_assessmentplan_id_seq', 2, true);


--
-- Name: assessment_report_additional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_additional_id_seq', 2, true);


--
-- Name: assessment_report_assessmentlimitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_assessmentlimitations_id_seq', 2, true);


--
-- Name: assessment_report_assessmentmethodology_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_assessmentmethodology_id_seq', 2, true);


--
-- Name: assessment_report_assessmentpurposeandscope_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_assessmentpurposeandscope_id_seq', 2, true);


--
-- Name: assessment_report_assessmentreport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_assessmentreport_id_seq', 2, true);


--
-- Name: assessment_report_conclusionandnextsteps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_conclusionandnextsteps_id_seq', 2, true);


--
-- Name: assessment_report_countrycontext_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_countrycontext_id_seq', 2, true);


--
-- Name: assessment_report_disclaimer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_disclaimer_id_seq', 2, true);


--
-- Name: assessment_report_executivesummary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_executivesummary_id_seq', 1, false);


--
-- Name: assessment_report_finding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_finding_id_seq', 3, true);


--
-- Name: assessment_report_goodpractices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_goodpractices_id_seq', 2, true);


--
-- Name: assessment_report_immediateresolutions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_immediateresolutions_id_seq', 2, true);


--
-- Name: assessment_report_observer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_observer_id_seq', 2, true);


--
-- Name: assessment_report_openingandclosingmeetingparticipants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_openingandclosingmeetingparticipants_id_seq', 2, true);


--
-- Name: assessment_report_performancegaps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_performancegaps_id_seq', 1, false);


--
-- Name: assessment_report_provisionresponse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_provisionresponse_id_seq', 1, true);


--
-- Name: assessment_report_sitesandfacilitiesassessed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_sitesandfacilitiesassessed_id_seq', 2, true);


--
-- Name: assessment_report_sitevisitagenda_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_sitevisitagenda_id_seq', 2, true);


--
-- Name: assessment_report_stakeholdermeetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_stakeholdermeetings_id_seq', 2, true);


--
-- Name: assessment_report_stakeholdermeetingssummaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_stakeholdermeetingssummaries_id_seq', 2, true);


--
-- Name: assessment_report_suppliersoverview_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_report_suppliersoverview_id_seq', 2, true);


--
-- Name: assurance_process_assuranceprocess_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_assuranceprocess_id_seq', 2, true);


--
-- Name: assurance_process_assuranceprocess_team_assessors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_assuranceprocess_team_assessors_id_seq', 1, false);


--
-- Name: assurance_process_minesite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_minesite_id_seq', 3, true);


--
-- Name: assurance_process_portandstorage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_portandstorage_id_seq', 1, false);


--
-- Name: assurance_process_regionaloffice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_regionaloffice_id_seq', 1, false);


--
-- Name: assurance_process_supplierinvitationtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_supplierinvitationtoken_id_seq', 4, true);


--
-- Name: assurance_process_transportationfacility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assurance_process_transportationfacility_id_seq', 1, false);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 288, true);


--
-- Name: cip_cip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_cip_id_seq', 2, true);


--
-- Name: cip_cipfinding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_cipfinding_id_seq', 3, true);


--
-- Name: cip_cipfindingstatushistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_cipfindingstatushistory_id_seq', 1, false);


--
-- Name: cip_cipmonitoringcycle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_cipmonitoringcycle_id_seq', 1, false);


--
-- Name: cip_code_cipcodeversion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_code_cipcodeversion_id_seq', 2, true);


--
-- Name: cip_code_cipprinciple_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_code_cipprinciple_id_seq', 12, true);


--
-- Name: cip_code_cipprovision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_code_cipprovision_id_seq', 144, true);


--
-- Name: cip_code_cipsection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cip_code_cipsection_id_seq', 47, true);


--
-- Name: comment_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_comment_id_seq', 1, false);


--
-- Name: comment_flag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_flag_id_seq', 1, false);


--
-- Name: comment_flaginstance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_flaginstance_id_seq', 1, false);


--
-- Name: comment_follower_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_follower_id_seq', 1, false);


--
-- Name: comment_reaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_reaction_id_seq', 1, false);


--
-- Name: comment_reactioninstance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_reactioninstance_id_seq', 1, false);


--
-- Name: common_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.common_document_id_seq', 26, true);


--
-- Name: deadlines_actiondeadline_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deadlines_actiondeadline_id_seq', 2, true);


--
-- Name: deadlines_actiondeadlinereminder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deadlines_actiondeadlinereminder_id_seq', 2, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 7, true);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 72, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 302, true);


--
-- Name: django_site_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_site_id_seq', 1, false);


--
-- Name: otp_static_staticdevice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_static_staticdevice_id_seq', 1, false);


--
-- Name: otp_static_statictoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_static_statictoken_id_seq', 1, false);


--
-- Name: otp_totp_totpdevice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_totp_totpdevice_id_seq', 1, false);


--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.socialaccount_socialaccount_id_seq', 1, false);


--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.socialaccount_socialapp_id_seq', 1, false);


--
-- Name: socialaccount_socialapp_sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.socialaccount_socialapp_sites_id_seq', 1, false);


--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.socialaccount_socialtoken_id_seq', 1, false);


--
-- Name: supplier_questionnaire_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_questionnaire_question_id_seq', 78, true);


--
-- Name: supplier_questionnaire_sqanswer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_questionnaire_sqanswer_id_seq', 329, true);


--
-- Name: supplier_questionnaire_sqcategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_questionnaire_sqcategory_id_seq', 47, true);


--
-- Name: supplier_questionnaire_sqcategoryresponse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_questionnaire_sqcategoryresponse_id_seq', 141, true);


--
-- Name: two_factor_phonedevice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.two_factor_phonedevice_id_seq', 1, false);


--
-- Name: users_assessorprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_assessorprofile_id_seq', 2, true);


--
-- Name: users_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_company_id_seq', 1, false);


--
-- Name: users_memberprofile_assurance_processes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_memberprofile_assurance_processes_id_seq', 1, false);


--
-- Name: users_memberprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_memberprofile_id_seq', 1, false);


--
-- Name: users_supplierorganisation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_supplierorganisation_id_seq', 2, true);


--
-- Name: users_supplierprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_supplierprofile_id_seq', 2, true);


--
-- Name: users_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_groups_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- Name: users_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_user_permissions_id_seq', 1, false);


--
-- Name: account_emailaddress account_emailaddress_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_email_key UNIQUE (email);


--
-- Name: account_emailaddress account_emailaddress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_pkey PRIMARY KEY (id);


--
-- Name: account_emailconfirmation account_emailconfirmation_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirmation_key_key UNIQUE (key);


--
-- Name: account_emailconfirmation account_emailconfirmation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirmation_pkey PRIMARY KEY (id);


--
-- Name: actstream_action actstream_action_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_action
    ADD CONSTRAINT actstream_action_pkey PRIMARY KEY (id);


--
-- Name: actstream_follow actstream_follow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_follow
    ADD CONSTRAINT actstream_follow_pkey PRIMARY KEY (id);


--
-- Name: actstream_follow actstream_follow_user_id_content_type_id__b3632d76_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_follow
    ADD CONSTRAINT actstream_follow_user_id_content_type_id__b3632d76_uniq UNIQUE (user_id, content_type_id, object_id, flag);


--
-- Name: assessment_planning_assessmentplan assessment_planning_assessmentplan_assurance_process_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_planning_assessmentplan
    ADD CONSTRAINT assessment_planning_assessmentplan_assurance_process_id_key UNIQUE (assurance_process_id);


--
-- Name: assessment_planning_assessmentplan assessment_planning_assessmentplan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_planning_assessmentplan
    ADD CONSTRAINT assessment_planning_assessmentplan_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_additional assessment_report_additional_assessment_report_id_2da4be30_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_additional
    ADD CONSTRAINT assessment_report_additional_assessment_report_id_2da4be30_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_additional assessment_report_additional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_additional
    ADD CONSTRAINT assessment_report_additional_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_assessmentlimitations assessment_report_assess_assessment_report_id_27926df3_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentlimitations
    ADD CONSTRAINT assessment_report_assess_assessment_report_id_27926df3_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_assessmentmethodology assessment_report_assess_assessment_report_id_4e14ea99_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentmethodology
    ADD CONSTRAINT assessment_report_assess_assessment_report_id_4e14ea99_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_assessmentpurposeandscope assessment_report_assess_assessment_report_id_9720eb1d_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentpurposeandscope
    ADD CONSTRAINT assessment_report_assess_assessment_report_id_9720eb1d_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_assessmentlimitations assessment_report_assessmentlimitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentlimitations
    ADD CONSTRAINT assessment_report_assessmentlimitations_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_assessmentmethodology assessment_report_assessmentmethodology_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentmethodology
    ADD CONSTRAINT assessment_report_assessmentmethodology_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_assessmentpurposeandscope assessment_report_assessmentpurposeandscope_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentpurposeandscope
    ADD CONSTRAINT assessment_report_assessmentpurposeandscope_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_assessmentreport assessment_report_assessmentreport_assurance_process_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentreport
    ADD CONSTRAINT assessment_report_assessmentreport_assurance_process_id_key UNIQUE (assurance_process_id);


--
-- Name: assessment_report_assessmentreport assessment_report_assessmentreport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentreport
    ADD CONSTRAINT assessment_report_assessmentreport_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_conclusionandnextsteps assessment_report_conclu_assessment_report_id_5cc6475c_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_conclusionandnextsteps
    ADD CONSTRAINT assessment_report_conclu_assessment_report_id_5cc6475c_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_conclusionandnextsteps assessment_report_conclusionandnextsteps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_conclusionandnextsteps
    ADD CONSTRAINT assessment_report_conclusionandnextsteps_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_countrycontext assessment_report_countr_assessment_report_id_1b0cf3c0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_countrycontext
    ADD CONSTRAINT assessment_report_countr_assessment_report_id_1b0cf3c0_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_countrycontext assessment_report_countrycontext_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_countrycontext
    ADD CONSTRAINT assessment_report_countrycontext_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_disclaimer assessment_report_disclaimer_assessment_report_id_569ec340_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_disclaimer
    ADD CONSTRAINT assessment_report_disclaimer_assessment_report_id_569ec340_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_disclaimer assessment_report_disclaimer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_disclaimer
    ADD CONSTRAINT assessment_report_disclaimer_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_executivesummary assessment_report_execut_assessment_report_id_bd286317_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_executivesummary
    ADD CONSTRAINT assessment_report_execut_assessment_report_id_bd286317_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_executivesummary assessment_report_executivesummary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_executivesummary
    ADD CONSTRAINT assessment_report_executivesummary_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_finding assessment_report_finding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_finding
    ADD CONSTRAINT assessment_report_finding_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_finding assessment_report_finding_public_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_finding
    ADD CONSTRAINT assessment_report_finding_public_id_key UNIQUE (public_id);


--
-- Name: assessment_report_goodpractices assessment_report_goodpr_assessment_report_id_3fb1ec57_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_goodpractices
    ADD CONSTRAINT assessment_report_goodpr_assessment_report_id_3fb1ec57_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_goodpractices assessment_report_goodpractices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_goodpractices
    ADD CONSTRAINT assessment_report_goodpractices_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_immediateresolutions assessment_report_immedi_assessment_report_id_71f28df6_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_immediateresolutions
    ADD CONSTRAINT assessment_report_immedi_assessment_report_id_71f28df6_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_immediateresolutions assessment_report_immediateresolutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_immediateresolutions
    ADD CONSTRAINT assessment_report_immediateresolutions_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_observer assessment_report_observer_assessment_report_id_9025b5a3_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_observer
    ADD CONSTRAINT assessment_report_observer_assessment_report_id_9025b5a3_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_observer assessment_report_observer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_observer
    ADD CONSTRAINT assessment_report_observer_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_openingandclosingmeetingparticipants assessment_report_openin_assessment_report_id_faa8e51a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_openingandclosingmeetingparticipants
    ADD CONSTRAINT assessment_report_openin_assessment_report_id_faa8e51a_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_openingandclosingmeetingparticipants assessment_report_openingandclosingmeetingparticipants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_openingandclosingmeetingparticipants
    ADD CONSTRAINT assessment_report_openingandclosingmeetingparticipants_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_performancegaps assessment_report_perfor_assessment_report_id_7a8f7d5a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_performancegaps
    ADD CONSTRAINT assessment_report_perfor_assessment_report_id_7a8f7d5a_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_performancegaps assessment_report_performancegaps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_performancegaps
    ADD CONSTRAINT assessment_report_performancegaps_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_provisionresponse assessment_report_provis_assessment_report_id_pro_947c9315_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_provisionresponse
    ADD CONSTRAINT assessment_report_provis_assessment_report_id_pro_947c9315_uniq UNIQUE (assessment_report_id, provision_id);


--
-- Name: assessment_report_provisionresponse assessment_report_provisionresponse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_provisionresponse
    ADD CONSTRAINT assessment_report_provisionresponse_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_sitesandfacilitiesassessed assessment_report_sitesa_assessment_report_id_09a00da0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitesandfacilitiesassessed
    ADD CONSTRAINT assessment_report_sitesa_assessment_report_id_09a00da0_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_sitesandfacilitiesassessed assessment_report_sitesandfacilitiesassessed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitesandfacilitiesassessed
    ADD CONSTRAINT assessment_report_sitesandfacilitiesassessed_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_sitevisitagenda assessment_report_sitevi_assessment_report_id_dadeeb92_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitevisitagenda
    ADD CONSTRAINT assessment_report_sitevi_assessment_report_id_dadeeb92_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_sitevisitagenda assessment_report_sitevisitagenda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitevisitagenda
    ADD CONSTRAINT assessment_report_sitevisitagenda_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_stakeholdermeetingssummaries assessment_report_stakeh_assessment_report_id_5e9eafc7_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetingssummaries
    ADD CONSTRAINT assessment_report_stakeh_assessment_report_id_5e9eafc7_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_stakeholdermeetings assessment_report_stakeh_assessment_report_id_71e2844b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetings
    ADD CONSTRAINT assessment_report_stakeh_assessment_report_id_71e2844b_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_stakeholdermeetings assessment_report_stakeholdermeetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetings
    ADD CONSTRAINT assessment_report_stakeholdermeetings_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_stakeholdermeetingssummaries assessment_report_stakeholdermeetingssummaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetingssummaries
    ADD CONSTRAINT assessment_report_stakeholdermeetingssummaries_pkey PRIMARY KEY (id);


--
-- Name: assessment_report_suppliersoverview assessment_report_suppli_assessment_report_id_75f0ccb8_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_suppliersoverview
    ADD CONSTRAINT assessment_report_suppli_assessment_report_id_75f0ccb8_uniq UNIQUE (assessment_report_id);


--
-- Name: assessment_report_suppliersoverview assessment_report_suppliersoverview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_suppliersoverview
    ADD CONSTRAINT assessment_report_suppliersoverview_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_assuranceprocess_team_assessors assurance_process_assura_assuranceprocess_id_user_fcf8fcff_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess_team_assessors
    ADD CONSTRAINT assurance_process_assura_assuranceprocess_id_user_fcf8fcff_uniq UNIQUE (assuranceprocess_id, user_id);


--
-- Name: assurance_process_assuranceprocess assurance_process_assuranceprocess_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess
    ADD CONSTRAINT assurance_process_assuranceprocess_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_assuranceprocess assurance_process_assuranceprocess_public_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess
    ADD CONSTRAINT assurance_process_assuranceprocess_public_id_key UNIQUE (public_id);


--
-- Name: assurance_process_assuranceprocess_team_assessors assurance_process_assuranceprocess_team_assessors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess_team_assessors
    ADD CONSTRAINT assurance_process_assuranceprocess_team_assessors_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_minesite assurance_process_minesite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_minesite
    ADD CONSTRAINT assurance_process_minesite_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_minesite assurance_process_minesite_public_id_e015cfc9_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_minesite
    ADD CONSTRAINT assurance_process_minesite_public_id_e015cfc9_uniq UNIQUE (public_id);


--
-- Name: assurance_process_portstoragefacility assurance_process_portandstorage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_portstoragefacility
    ADD CONSTRAINT assurance_process_portandstorage_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_regionaloffice assurance_process_regionaloffice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_regionaloffice
    ADD CONSTRAINT assurance_process_regionaloffice_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_regionaloffice assurance_process_regionaloffice_public_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_regionaloffice
    ADD CONSTRAINT assurance_process_regionaloffice_public_id_key UNIQUE (public_id);


--
-- Name: assurance_process_portstoragefacility assurance_process_storageatports_public_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_portstoragefacility
    ADD CONSTRAINT assurance_process_storageatports_public_id_key UNIQUE (public_id);


--
-- Name: assurance_process_invitationtoken assurance_process_supplierinvitationtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_invitationtoken
    ADD CONSTRAINT assurance_process_supplierinvitationtoken_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_transportationinfrastructure assurance_process_transportationfacility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_transportationinfrastructure
    ADD CONSTRAINT assurance_process_transportationfacility_pkey PRIMARY KEY (id);


--
-- Name: assurance_process_transportationinfrastructure assurance_process_transportationinfrastructure_public_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_transportationinfrastructure
    ADD CONSTRAINT assurance_process_transportationinfrastructure_public_id_key UNIQUE (public_id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: cip_cip cip_cip_assurance_process_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cip
    ADD CONSTRAINT cip_cip_assurance_process_id_key UNIQUE (assurance_process_id);


--
-- Name: cip_cip cip_cip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cip
    ADD CONSTRAINT cip_cip_pkey PRIMARY KEY (id);


--
-- Name: cip_cipfinding cip_cipfinding_finding_id_cip_id_771eea70_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding
    ADD CONSTRAINT cip_cipfinding_finding_id_cip_id_771eea70_uniq UNIQUE (finding_id, cip_id);


--
-- Name: cip_cipfinding cip_cipfinding_finding_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding
    ADD CONSTRAINT cip_cipfinding_finding_id_key UNIQUE (finding_id);


--
-- Name: cip_cipfinding cip_cipfinding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding
    ADD CONSTRAINT cip_cipfinding_pkey PRIMARY KEY (id);


--
-- Name: cip_cipfindingstatushistory cip_cipfindingstatushist_cip_finding_id_cip_monit_5436ae12_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfindingstatushistory
    ADD CONSTRAINT cip_cipfindingstatushist_cip_finding_id_cip_monit_5436ae12_uniq UNIQUE (cip_finding_id, cip_monitoring_cycle_id, status);


--
-- Name: cip_cipfindingstatushistory cip_cipfindingstatushistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfindingstatushistory
    ADD CONSTRAINT cip_cipfindingstatushistory_pkey PRIMARY KEY (id);


--
-- Name: cip_cipmonitoringcycle cip_cipmonitoringcycle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipmonitoringcycle
    ADD CONSTRAINT cip_cipmonitoringcycle_pkey PRIMARY KEY (id);


--
-- Name: cip_code_cipcodeversion cip_code_cipcodeversion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipcodeversion
    ADD CONSTRAINT cip_code_cipcodeversion_pkey PRIMARY KEY (id);


--
-- Name: cip_code_cipcodeversion cip_code_cipcodeversion_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipcodeversion
    ADD CONSTRAINT cip_code_cipcodeversion_version_key UNIQUE (version);


--
-- Name: cip_code_cipprinciple cip_code_cipprinciple_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipprinciple
    ADD CONSTRAINT cip_code_cipprinciple_pkey PRIMARY KEY (id);


--
-- Name: cip_code_cipprovision cip_code_cipprovision_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipprovision
    ADD CONSTRAINT cip_code_cipprovision_pkey PRIMARY KEY (id);


--
-- Name: cip_code_cipcategory cip_code_cipsection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipcategory
    ADD CONSTRAINT cip_code_cipsection_pkey PRIMARY KEY (id);


--
-- Name: comment_comment comment_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_comment
    ADD CONSTRAINT comment_comment_pkey PRIMARY KEY (id);


--
-- Name: comment_comment comment_comment_urlhash_1f2a37f4_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_comment
    ADD CONSTRAINT comment_comment_urlhash_1f2a37f4_uniq UNIQUE (urlhash);


--
-- Name: comment_flag comment_flag_comment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flag
    ADD CONSTRAINT comment_flag_comment_id_key UNIQUE (comment_id);


--
-- Name: comment_flag comment_flag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flag
    ADD CONSTRAINT comment_flag_pkey PRIMARY KEY (id);


--
-- Name: comment_flaginstance comment_flaginstance_flag_id_user_id_45354216_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flaginstance
    ADD CONSTRAINT comment_flaginstance_flag_id_user_id_45354216_uniq UNIQUE (flag_id, user_id);


--
-- Name: comment_flaginstance comment_flaginstance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flaginstance
    ADD CONSTRAINT comment_flaginstance_pkey PRIMARY KEY (id);


--
-- Name: comment_follower comment_follower_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_follower
    ADD CONSTRAINT comment_follower_pkey PRIMARY KEY (id);


--
-- Name: comment_reaction comment_reaction_comment_id_66a7fc70_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT comment_reaction_comment_id_66a7fc70_uniq UNIQUE (comment_id);


--
-- Name: comment_reaction comment_reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT comment_reaction_pkey PRIMARY KEY (id);


--
-- Name: comment_reactioninstance comment_reactioninstance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactioninstance
    ADD CONSTRAINT comment_reactioninstance_pkey PRIMARY KEY (id);


--
-- Name: comment_reactioninstance comment_reactioninstance_user_id_reaction_id_0e26e650_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactioninstance
    ADD CONSTRAINT comment_reactioninstance_user_id_reaction_id_0e26e650_uniq UNIQUE (user_id, reaction_id);


--
-- Name: common_document common_document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.common_document
    ADD CONSTRAINT common_document_pkey PRIMARY KEY (id);


--
-- Name: common_document common_document_public_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.common_document
    ADD CONSTRAINT common_document_public_id_key UNIQUE (public_id);


--
-- Name: deadlines_actiondeadline deadlines_actiondeadline_content_type_id_object_i_ed2d3149_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadline
    ADD CONSTRAINT deadlines_actiondeadline_content_type_id_object_i_ed2d3149_uniq UNIQUE (content_type_id, object_id, action_identifier);


--
-- Name: deadlines_actiondeadline deadlines_actiondeadline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadline
    ADD CONSTRAINT deadlines_actiondeadline_pkey PRIMARY KEY (id);


--
-- Name: deadlines_actiondeadlinereminder deadlines_actiondeadlinereminder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadlinereminder
    ADD CONSTRAINT deadlines_actiondeadlinereminder_pkey PRIMARY KEY (id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: django_site django_site_domain_a2e37b91_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_site
    ADD CONSTRAINT django_site_domain_a2e37b91_uniq UNIQUE (domain);


--
-- Name: django_site django_site_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_site
    ADD CONSTRAINT django_site_pkey PRIMARY KEY (id);


--
-- Name: otp_static_staticdevice otp_static_staticdevice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_static_staticdevice
    ADD CONSTRAINT otp_static_staticdevice_pkey PRIMARY KEY (id);


--
-- Name: otp_static_statictoken otp_static_statictoken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_static_statictoken
    ADD CONSTRAINT otp_static_statictoken_pkey PRIMARY KEY (id);


--
-- Name: otp_totp_totpdevice otp_totp_totpdevice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_totp_totpdevice
    ADD CONSTRAINT otp_totp_totpdevice_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_provider_uid_fc810c6e_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_provider_uid_fc810c6e_uniq UNIQUE (provider, uid);


--
-- Name: socialaccount_socialapp_sites socialaccount_socialapp__socialapp_id_site_id_71a9a768_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp_sites
    ADD CONSTRAINT socialaccount_socialapp__socialapp_id_site_id_71a9a768_uniq UNIQUE (socialapp_id, site_id);


--
-- Name: socialaccount_socialapp socialaccount_socialapp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp
    ADD CONSTRAINT socialaccount_socialapp_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialapp_sites socialaccount_socialapp_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp_sites
    ADD CONSTRAINT socialaccount_socialapp_sites_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialtoken socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq UNIQUE (app_id, account_id);


--
-- Name: socialaccount_socialtoken socialaccount_socialtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_socialtoken_pkey PRIMARY KEY (id);


--
-- Name: supplier_questionnaire_sqquestion supplier_questionnaire_question_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqquestion
    ADD CONSTRAINT supplier_questionnaire_question_pkey PRIMARY KEY (id);


--
-- Name: supplier_questionnaire_sqcategoryresponse supplier_questionnaire_s_sq_category_id_mine_site_4b1e9007_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategoryresponse
    ADD CONSTRAINT supplier_questionnaire_s_sq_category_id_mine_site_4b1e9007_uniq UNIQUE (sq_category_id, mine_site_id);


--
-- Name: supplier_questionnaire_sqanswer supplier_questionnaire_sqanswer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqanswer
    ADD CONSTRAINT supplier_questionnaire_sqanswer_pkey PRIMARY KEY (id);


--
-- Name: supplier_questionnaire_sqcategory supplier_questionnaire_sqcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategory
    ADD CONSTRAINT supplier_questionnaire_sqcategory_pkey PRIMARY KEY (id);


--
-- Name: supplier_questionnaire_sqcategoryresponse supplier_questionnaire_sqcategoryresponse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategoryresponse
    ADD CONSTRAINT supplier_questionnaire_sqcategoryresponse_pkey PRIMARY KEY (id);


--
-- Name: two_factor_phonedevice two_factor_phonedevice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.two_factor_phonedevice
    ADD CONSTRAINT two_factor_phonedevice_pkey PRIMARY KEY (id);


--
-- Name: users_assessorprofile users_assessorprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_assessorprofile
    ADD CONSTRAINT users_assessorprofile_pkey PRIMARY KEY (id);


--
-- Name: users_assessorprofile users_assessorprofile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_assessorprofile
    ADD CONSTRAINT users_assessorprofile_user_id_key UNIQUE (user_id);


--
-- Name: users_company users_company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_company
    ADD CONSTRAINT users_company_pkey PRIMARY KEY (id);


--
-- Name: users_memberprofile_assurance_processes users_memberprofile_assu_memberprofile_id_assuran_986fb8fb_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile_assurance_processes
    ADD CONSTRAINT users_memberprofile_assu_memberprofile_id_assuran_986fb8fb_uniq UNIQUE (memberprofile_id, assuranceprocess_id);


--
-- Name: users_memberprofile_assurance_processes users_memberprofile_assurance_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile_assurance_processes
    ADD CONSTRAINT users_memberprofile_assurance_processes_pkey PRIMARY KEY (id);


--
-- Name: users_memberprofile users_memberprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile
    ADD CONSTRAINT users_memberprofile_pkey PRIMARY KEY (id);


--
-- Name: users_memberprofile users_memberprofile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile
    ADD CONSTRAINT users_memberprofile_user_id_key UNIQUE (user_id);


--
-- Name: users_supplierorganisation users_supplierorganisation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierorganisation
    ADD CONSTRAINT users_supplierorganisation_pkey PRIMARY KEY (id);


--
-- Name: users_supplierorganisation users_supplierorganisation_public_id_b290ae31_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierorganisation
    ADD CONSTRAINT users_supplierorganisation_public_id_b290ae31_uniq UNIQUE (public_id);


--
-- Name: users_supplierprofile users_supplierprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierprofile
    ADD CONSTRAINT users_supplierprofile_pkey PRIMARY KEY (id);


--
-- Name: users_supplierprofile users_supplierprofile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierprofile
    ADD CONSTRAINT users_supplierprofile_user_id_key UNIQUE (user_id);


--
-- Name: users_user users_user_email_243f6e77_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_email_243f6e77_uniq UNIQUE (email);


--
-- Name: users_user_groups users_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_groups
    ADD CONSTRAINT users_user_groups_pkey PRIMARY KEY (id);


--
-- Name: users_user_groups users_user_groups_user_id_group_id_b88eab82_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_groups
    ADD CONSTRAINT users_user_groups_user_id_group_id_b88eab82_uniq UNIQUE (user_id, group_id);


--
-- Name: users_user users_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_pkey PRIMARY KEY (id);


--
-- Name: users_user users_user_public_id_e5393015_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_public_id_e5393015_uniq UNIQUE (public_id);


--
-- Name: users_user_user_permissions users_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_user_permissions
    ADD CONSTRAINT users_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: users_user_user_permissions users_user_user_permissions_user_id_permission_id_43338c45_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_user_permissions
    ADD CONSTRAINT users_user_user_permissions_user_id_permission_id_43338c45_uniq UNIQUE (user_id, permission_id);


--
-- Name: users_user users_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_username_key UNIQUE (username);


--
-- Name: account_emailaddress_email_03be32b2_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX account_emailaddress_email_03be32b2_like ON public.account_emailaddress USING btree (email varchar_pattern_ops);


--
-- Name: account_emailaddress_user_id_2c513194; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX account_emailaddress_user_id_2c513194 ON public.account_emailaddress USING btree (user_id);


--
-- Name: account_emailconfirmation_email_address_id_5b7f8c58; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX account_emailconfirmation_email_address_id_5b7f8c58 ON public.account_emailconfirmation USING btree (email_address_id);


--
-- Name: account_emailconfirmation_key_f43612bd_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX account_emailconfirmation_key_f43612bd_like ON public.account_emailconfirmation USING btree (key varchar_pattern_ops);


--
-- Name: actstream_action_action_object_content_type_id_ee623c15; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_action_object_content_type_id_ee623c15 ON public.actstream_action USING btree (action_object_content_type_id);


--
-- Name: actstream_action_action_object_object_id_6433bdf7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_action_object_object_id_6433bdf7 ON public.actstream_action USING btree (action_object_object_id);


--
-- Name: actstream_action_action_object_object_id_6433bdf7_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_action_object_object_id_6433bdf7_like ON public.actstream_action USING btree (action_object_object_id varchar_pattern_ops);


--
-- Name: actstream_action_actor_content_type_id_d5e5ec2a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_actor_content_type_id_d5e5ec2a ON public.actstream_action USING btree (actor_content_type_id);


--
-- Name: actstream_action_actor_object_id_72ef0cfa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_actor_object_id_72ef0cfa ON public.actstream_action USING btree (actor_object_id);


--
-- Name: actstream_action_actor_object_id_72ef0cfa_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_actor_object_id_72ef0cfa_like ON public.actstream_action USING btree (actor_object_id varchar_pattern_ops);


--
-- Name: actstream_action_public_ac0653e9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_public_ac0653e9 ON public.actstream_action USING btree (public);


--
-- Name: actstream_action_target_content_type_id_187fa164; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_target_content_type_id_187fa164 ON public.actstream_action USING btree (target_content_type_id);


--
-- Name: actstream_action_target_object_id_e080d801; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_target_object_id_e080d801 ON public.actstream_action USING btree (target_object_id);


--
-- Name: actstream_action_target_object_id_e080d801_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_target_object_id_e080d801_like ON public.actstream_action USING btree (target_object_id varchar_pattern_ops);


--
-- Name: actstream_action_timestamp_a23fe3ae; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_timestamp_a23fe3ae ON public.actstream_action USING btree ("timestamp");


--
-- Name: actstream_action_verb_83f768b7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_verb_83f768b7 ON public.actstream_action USING btree (verb);


--
-- Name: actstream_action_verb_83f768b7_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_action_verb_83f768b7_like ON public.actstream_action USING btree (verb varchar_pattern_ops);


--
-- Name: actstream_follow_content_type_id_ba287eb9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_content_type_id_ba287eb9 ON public.actstream_follow USING btree (content_type_id);


--
-- Name: actstream_follow_flag_0e741c24; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_flag_0e741c24 ON public.actstream_follow USING btree (flag);


--
-- Name: actstream_follow_flag_0e741c24_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_flag_0e741c24_like ON public.actstream_follow USING btree (flag varchar_pattern_ops);


--
-- Name: actstream_follow_object_id_d790e00d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_object_id_d790e00d ON public.actstream_follow USING btree (object_id);


--
-- Name: actstream_follow_object_id_d790e00d_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_object_id_d790e00d_like ON public.actstream_follow USING btree (object_id varchar_pattern_ops);


--
-- Name: actstream_follow_started_254c63bd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_started_254c63bd ON public.actstream_follow USING btree (started);


--
-- Name: actstream_follow_user_id_e9d4e1ff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX actstream_follow_user_id_e9d4e1ff ON public.actstream_follow USING btree (user_id);


--
-- Name: assessment_planning_assess_completed_assessment_plan__3fb0ec5d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_planning_assess_completed_assessment_plan__3fb0ec5d ON public.assessment_planning_assessmentplan USING btree (completed_assessment_plan_id);


--
-- Name: assessment_report_finding_assessment_report_id_e18b7329; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_report_finding_assessment_report_id_e18b7329 ON public.assessment_report_finding USING btree (assessment_report_id);


--
-- Name: assessment_report_finding_provision_id_2444bf33; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_report_finding_provision_id_2444bf33 ON public.assessment_report_finding USING btree (provision_id);


--
-- Name: assessment_report_finding_public_id_4b3451fe_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_report_finding_public_id_4b3451fe_like ON public.assessment_report_finding USING btree (public_id varchar_pattern_ops);


--
-- Name: assessment_report_provisio_assessment_report_id_d72b248c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_report_provisio_assessment_report_id_d72b248c ON public.assessment_report_provisionresponse USING btree (assessment_report_id);


--
-- Name: assessment_report_provisionresponse_provision_id_b5e70deb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_report_provisionresponse_provision_id_b5e70deb ON public.assessment_report_provisionresponse USING btree (provision_id);


--
-- Name: assurance_process_assuranc_assuranceprocess_id_bdd8993b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranc_assuranceprocess_id_bdd8993b ON public.assurance_process_assuranceprocess_team_assessors USING btree (assuranceprocess_id);


--
-- Name: assurance_process_assuranc_supplier_organisation_id_0480854a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranc_supplier_organisation_id_0480854a ON public.assurance_process_assuranceprocess USING btree (supplier_organisation_id);


--
-- Name: assurance_process_assuranc_user_id_7d5f6c32; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranc_user_id_7d5f6c32 ON public.assurance_process_assuranceprocess_team_assessors USING btree (user_id);


--
-- Name: assurance_process_assuranceprocess_lead_assessor_id_3283d4f2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranceprocess_lead_assessor_id_3283d4f2 ON public.assurance_process_assuranceprocess USING btree (lead_assessor_id);


--
-- Name: assurance_process_assuranceprocess_public_id_bee5cd33_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranceprocess_public_id_bee5cd33_like ON public.assurance_process_assuranceprocess USING btree (public_id varchar_pattern_ops);


--
-- Name: assurance_process_assuranceprocess_signed_ca_id_afa70527; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranceprocess_signed_ca_id_afa70527 ON public.assurance_process_assuranceprocess USING btree (signed_ca_id);


--
-- Name: assurance_process_assuranceprocess_signed_loc_id_5eef67de; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_assuranceprocess_signed_loc_id_5eef67de ON public.assurance_process_assuranceprocess USING btree (signed_loc_id);


--
-- Name: assurance_process_minesite_assurance_process_id_3a0c5957; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_minesite_assurance_process_id_3a0c5957 ON public.assurance_process_minesite USING btree (assurance_process_id);


--
-- Name: assurance_process_minesite_public_id_e015cfc9_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_minesite_public_id_e015cfc9_like ON public.assurance_process_minesite USING btree (public_id varchar_pattern_ops);


--
-- Name: assurance_process_portandstorage_assurance_process_id_632c12bd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_portandstorage_assurance_process_id_632c12bd ON public.assurance_process_portstoragefacility USING btree (assurance_process_id);


--
-- Name: assurance_process_regionaloffice_assurance_process_id_828ca704; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_regionaloffice_assurance_process_id_828ca704 ON public.assurance_process_regionaloffice USING btree (assurance_process_id);


--
-- Name: assurance_process_regionaloffice_public_id_85950123_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_regionaloffice_public_id_85950123_like ON public.assurance_process_regionaloffice USING btree (public_id varchar_pattern_ops);


--
-- Name: assurance_process_storageatports_public_id_5cbb1e83_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_storageatports_public_id_5cbb1e83_like ON public.assurance_process_portstoragefacility USING btree (public_id varchar_pattern_ops);


--
-- Name: assurance_process_transp_public_id_51eb8ef4_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_transp_public_id_51eb8ef4_like ON public.assurance_process_transportationinfrastructure USING btree (public_id varchar_pattern_ops);


--
-- Name: assurance_process_transpor_assurance_process_id_585a5f30; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assurance_process_transpor_assurance_process_id_585a5f30 ON public.assurance_process_transportationinfrastructure USING btree (assurance_process_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: cip_cipfinding_cip_id_37f7774c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_cipfinding_cip_id_37f7774c ON public.cip_cipfinding USING btree (cip_id);


--
-- Name: cip_cipfinding_cip_monitoring_cycle_id_31dc6646; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_cipfinding_cip_monitoring_cycle_id_31dc6646 ON public.cip_cipfinding USING btree (cip_monitoring_cycle_id);


--
-- Name: cip_cipfindingstatushistory_cip_finding_id_aa67011f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_cipfindingstatushistory_cip_finding_id_aa67011f ON public.cip_cipfindingstatushistory USING btree (cip_finding_id);


--
-- Name: cip_cipfindingstatushistory_cip_monitoring_cycle_id_d39ef993; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_cipfindingstatushistory_cip_monitoring_cycle_id_d39ef993 ON public.cip_cipfindingstatushistory USING btree (cip_monitoring_cycle_id);


--
-- Name: cip_cipfindingstatushistory_move_to_cycle_id_5d9c778b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_cipfindingstatushistory_move_to_cycle_id_5d9c778b ON public.cip_cipfindingstatushistory USING btree (move_to_cycle_id);


--
-- Name: cip_cipmonitoringcycle_cip_id_8f185e12; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_cipmonitoringcycle_cip_id_8f185e12 ON public.cip_cipmonitoringcycle USING btree (cip_id);


--
-- Name: cip_code_cipprinciple_code_version_id_874df234; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_code_cipprinciple_code_version_id_874df234 ON public.cip_code_cipprinciple USING btree (code_version_id);


--
-- Name: cip_code_cipprovision_section_id_342dd9a4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_code_cipprovision_section_id_342dd9a4 ON public.cip_code_cipprovision USING btree (category_id);


--
-- Name: cip_code_cipsection_principle_id_dc872f4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cip_code_cipsection_principle_id_dc872f4b ON public.cip_code_cipcategory USING btree (principle_id);


--
-- Name: comment_comment_content_type_id_fbfb9793; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_comment_content_type_id_fbfb9793 ON public.comment_comment USING btree (content_type_id);


--
-- Name: comment_comment_parent_id_b612524c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_comment_parent_id_b612524c ON public.comment_comment USING btree (parent_id);


--
-- Name: comment_comment_urlhash_1f2a37f4_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_comment_urlhash_1f2a37f4_like ON public.comment_comment USING btree (urlhash varchar_pattern_ops);


--
-- Name: comment_comment_user_id_6078e57b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_comment_user_id_6078e57b ON public.comment_comment USING btree (user_id);


--
-- Name: comment_flag_moderator_id_e2ccaf81; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_flag_moderator_id_e2ccaf81 ON public.comment_flag USING btree (moderator_id);


--
-- Name: comment_flaginstance_flag_id_5f0100d0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_flaginstance_flag_id_5f0100d0 ON public.comment_flaginstance USING btree (flag_id);


--
-- Name: comment_flaginstance_user_id_9aa1aa0c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_flaginstance_user_id_9aa1aa0c ON public.comment_flaginstance USING btree (user_id);


--
-- Name: comment_follower_content_type_id_c9480b27; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_follower_content_type_id_c9480b27 ON public.comment_follower USING btree (content_type_id);


--
-- Name: comment_reactioninstance_reaction_id_68fbb2eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_reactioninstance_reaction_id_68fbb2eb ON public.comment_reactioninstance USING btree (reaction_id);


--
-- Name: comment_reactioninstance_user_id_f813deaf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comment_reactioninstance_user_id_f813deaf ON public.comment_reactioninstance USING btree (user_id);


--
-- Name: common_document_assurance_process_id_a17f5bbb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX common_document_assurance_process_id_a17f5bbb ON public.common_document USING btree (assurance_process_id);


--
-- Name: common_document_content_type_id_e8fed8c9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX common_document_content_type_id_e8fed8c9 ON public.common_document USING btree (content_type_id);


--
-- Name: common_document_public_id_e5b06ef9_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX common_document_public_id_e5b06ef9_like ON public.common_document USING btree (public_id varchar_pattern_ops);


--
-- Name: common_document_uploaded_by_id_ee0164cb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX common_document_uploaded_by_id_ee0164cb ON public.common_document USING btree (uploaded_by_id);


--
-- Name: deadlines_actiondeadline_content_type_id_7d0a59af; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX deadlines_actiondeadline_content_type_id_7d0a59af ON public.deadlines_actiondeadline USING btree (content_type_id);


--
-- Name: deadlines_actiondeadlinereminder_deadline_id_fce9d790; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX deadlines_actiondeadlinereminder_deadline_id_fce9d790 ON public.deadlines_actiondeadlinereminder USING btree (deadline_id);


--
-- Name: deadlines_actiondeadlinereminder_user_id_e0d38cfb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX deadlines_actiondeadlinereminder_user_id_e0d38cfb ON public.deadlines_actiondeadlinereminder USING btree (user_id);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: django_site_domain_a2e37b91_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_site_domain_a2e37b91_like ON public.django_site USING btree (domain varchar_pattern_ops);


--
-- Name: otp_static_staticdevice_user_id_7f9cff2b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_static_staticdevice_user_id_7f9cff2b ON public.otp_static_staticdevice USING btree (user_id);


--
-- Name: otp_static_statictoken_device_id_74b7c7d1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_static_statictoken_device_id_74b7c7d1 ON public.otp_static_statictoken USING btree (device_id);


--
-- Name: otp_static_statictoken_token_d0a51866; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_static_statictoken_token_d0a51866 ON public.otp_static_statictoken USING btree (token);


--
-- Name: otp_static_statictoken_token_d0a51866_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_static_statictoken_token_d0a51866_like ON public.otp_static_statictoken USING btree (token varchar_pattern_ops);


--
-- Name: otp_totp_totpdevice_user_id_0fb18292; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otp_totp_totpdevice_user_id_0fb18292 ON public.otp_totp_totpdevice USING btree (user_id);


--
-- Name: socialaccount_socialaccount_user_id_8146e70c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX socialaccount_socialaccount_user_id_8146e70c ON public.socialaccount_socialaccount USING btree (user_id);


--
-- Name: socialaccount_socialapp_sites_site_id_2579dee5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX socialaccount_socialapp_sites_site_id_2579dee5 ON public.socialaccount_socialapp_sites USING btree (site_id);


--
-- Name: socialaccount_socialapp_sites_socialapp_id_97fb6e7d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX socialaccount_socialapp_sites_socialapp_id_97fb6e7d ON public.socialaccount_socialapp_sites USING btree (socialapp_id);


--
-- Name: socialaccount_socialtoken_account_id_951f210e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX socialaccount_socialtoken_account_id_951f210e ON public.socialaccount_socialtoken USING btree (account_id);


--
-- Name: socialaccount_socialtoken_app_id_636a42d7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX socialaccount_socialtoken_app_id_636a42d7 ON public.socialaccount_socialtoken USING btree (app_id);


--
-- Name: supplier_questionnaire_que_questionnaire_category_inf_1fc0a76a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_que_questionnaire_category_inf_1fc0a76a ON public.supplier_questionnaire_sqquestion USING btree (sq_category_id);


--
-- Name: supplier_questionnaire_sqanswer_question_id_0590e0ca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_sqanswer_question_id_0590e0ca ON public.supplier_questionnaire_sqanswer USING btree (sq_question_id);


--
-- Name: supplier_questionnaire_sqanswer_response_id_6058dad1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_sqanswer_response_id_6058dad1 ON public.supplier_questionnaire_sqanswer USING btree (sq_category_response_id);


--
-- Name: supplier_questionnaire_sqc_last_submitted_by_id_dd568b67; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_sqc_last_submitted_by_id_dd568b67 ON public.supplier_questionnaire_sqcategoryresponse USING btree (last_submitted_by_id);


--
-- Name: supplier_questionnaire_sqcategory_category_id_6c117175; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_sqcategory_category_id_6c117175 ON public.supplier_questionnaire_sqcategory USING btree (category_id);


--
-- Name: supplier_questionnaire_sqcategoryresponse_category_id_6895a66c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_sqcategoryresponse_category_id_6895a66c ON public.supplier_questionnaire_sqcategoryresponse USING btree (sq_category_id);


--
-- Name: supplier_questionnaire_sqcategoryresponse_mine_site_id_6696ea40; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supplier_questionnaire_sqcategoryresponse_mine_site_id_6696ea40 ON public.supplier_questionnaire_sqcategoryresponse USING btree (mine_site_id);


--
-- Name: two_factor_phonedevice_user_id_54718003; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX two_factor_phonedevice_user_id_54718003 ON public.two_factor_phonedevice USING btree (user_id);


--
-- Name: users_assessorprofile_cv_id_948bc2a5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_assessorprofile_cv_id_948bc2a5 ON public.users_assessorprofile USING btree (cv_id);


--
-- Name: users_assessorprofile_signed_nda_id_ae19c2f5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_assessorprofile_signed_nda_id_ae19c2f5 ON public.users_assessorprofile USING btree (signed_nda_id);


--
-- Name: users_memberprofile_assura_assuranceprocess_id_069370ac; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_memberprofile_assura_assuranceprocess_id_069370ac ON public.users_memberprofile_assurance_processes USING btree (assuranceprocess_id);


--
-- Name: users_memberprofile_assura_memberprofile_id_27bbd06c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_memberprofile_assura_memberprofile_id_27bbd06c ON public.users_memberprofile_assurance_processes USING btree (memberprofile_id);


--
-- Name: users_supplierorganisation_lead_supplier_id_66dd3212; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_supplierorganisation_lead_supplier_id_66dd3212 ON public.users_supplierorganisation USING btree (coordinator_id);


--
-- Name: users_supplierorganisation_public_id_b290ae31_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_supplierorganisation_public_id_b290ae31_like ON public.users_supplierorganisation USING btree (public_id varchar_pattern_ops);


--
-- Name: users_supplierprofile_organisation_id_386f780a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_supplierprofile_organisation_id_386f780a ON public.users_supplierprofile USING btree (organisation_id);


--
-- Name: users_user_company_id_14799323; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_company_id_14799323 ON public.users_user USING btree (company_id);


--
-- Name: users_user_email_243f6e77_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_email_243f6e77_like ON public.users_user USING btree (email varchar_pattern_ops);


--
-- Name: users_user_groups_group_id_9afc8d0e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_groups_group_id_9afc8d0e ON public.users_user_groups USING btree (group_id);


--
-- Name: users_user_groups_user_id_5f6f5a90; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_groups_user_id_5f6f5a90 ON public.users_user_groups USING btree (user_id);


--
-- Name: users_user_public_id_e5393015_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_public_id_e5393015_like ON public.users_user USING btree (public_id varchar_pattern_ops);


--
-- Name: users_user_user_permissions_permission_id_0b93982e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_user_permissions_permission_id_0b93982e ON public.users_user_user_permissions USING btree (permission_id);


--
-- Name: users_user_user_permissions_user_id_20aca447; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_user_permissions_user_id_20aca447 ON public.users_user_user_permissions USING btree (user_id);


--
-- Name: users_user_username_06e46fe6_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_username_06e46fe6_like ON public.users_user USING btree (username varchar_pattern_ops);


--
-- Name: account_emailaddress account_emailaddress_user_id_2c513194_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_user_id_2c513194_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: account_emailconfirmation account_emailconfirm_email_address_id_5b7f8c58_fk_account_e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirm_email_address_id_5b7f8c58_fk_account_e FOREIGN KEY (email_address_id) REFERENCES public.account_emailaddress(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: actstream_action actstream_action_action_object_conten_ee623c15_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_action
    ADD CONSTRAINT actstream_action_action_object_conten_ee623c15_fk_django_co FOREIGN KEY (action_object_content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: actstream_action actstream_action_actor_content_type_i_d5e5ec2a_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_action
    ADD CONSTRAINT actstream_action_actor_content_type_i_d5e5ec2a_fk_django_co FOREIGN KEY (actor_content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: actstream_action actstream_action_target_content_type__187fa164_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_action
    ADD CONSTRAINT actstream_action_target_content_type__187fa164_fk_django_co FOREIGN KEY (target_content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: actstream_follow actstream_follow_content_type_id_ba287eb9_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_follow
    ADD CONSTRAINT actstream_follow_content_type_id_ba287eb9_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: actstream_follow actstream_follow_user_id_e9d4e1ff_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actstream_follow
    ADD CONSTRAINT actstream_follow_user_id_e9d4e1ff_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_planning_assessmentplan assessment_planning__assurance_process_id_7a9787e4_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_planning_assessmentplan
    ADD CONSTRAINT assessment_planning__assurance_process_id_7a9787e4_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_planning_assessmentplan assessment_planning__completed_assessment_3fb0ec5d_fk_common_do; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_planning_assessmentplan
    ADD CONSTRAINT assessment_planning__completed_assessment_3fb0ec5d_fk_common_do FOREIGN KEY (completed_assessment_plan_id) REFERENCES public.common_document(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_additional assessment_report_ad_assessment_report_id_2da4be30_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_additional
    ADD CONSTRAINT assessment_report_ad_assessment_report_id_2da4be30_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_assessmentlimitations assessment_report_as_assessment_report_id_27926df3_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentlimitations
    ADD CONSTRAINT assessment_report_as_assessment_report_id_27926df3_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_assessmentmethodology assessment_report_as_assessment_report_id_4e14ea99_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentmethodology
    ADD CONSTRAINT assessment_report_as_assessment_report_id_4e14ea99_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_assessmentpurposeandscope assessment_report_as_assessment_report_id_9720eb1d_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentpurposeandscope
    ADD CONSTRAINT assessment_report_as_assessment_report_id_9720eb1d_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_assessmentreport assessment_report_as_assurance_process_id_88048fba_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_assessmentreport
    ADD CONSTRAINT assessment_report_as_assurance_process_id_88048fba_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_countrycontext assessment_report_co_assessment_report_id_1b0cf3c0_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_countrycontext
    ADD CONSTRAINT assessment_report_co_assessment_report_id_1b0cf3c0_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_conclusionandnextsteps assessment_report_co_assessment_report_id_5cc6475c_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_conclusionandnextsteps
    ADD CONSTRAINT assessment_report_co_assessment_report_id_5cc6475c_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_disclaimer assessment_report_di_assessment_report_id_569ec340_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_disclaimer
    ADD CONSTRAINT assessment_report_di_assessment_report_id_569ec340_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_executivesummary assessment_report_ex_assessment_report_id_bd286317_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_executivesummary
    ADD CONSTRAINT assessment_report_ex_assessment_report_id_bd286317_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_finding assessment_report_fi_assessment_report_id_e18b7329_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_finding
    ADD CONSTRAINT assessment_report_fi_assessment_report_id_e18b7329_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_finding assessment_report_fi_provision_id_2444bf33_fk_cip_code_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_finding
    ADD CONSTRAINT assessment_report_fi_provision_id_2444bf33_fk_cip_code_ FOREIGN KEY (provision_id) REFERENCES public.cip_code_cipprovision(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_goodpractices assessment_report_go_assessment_report_id_3fb1ec57_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_goodpractices
    ADD CONSTRAINT assessment_report_go_assessment_report_id_3fb1ec57_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_immediateresolutions assessment_report_im_assessment_report_id_71f28df6_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_immediateresolutions
    ADD CONSTRAINT assessment_report_im_assessment_report_id_71f28df6_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_observer assessment_report_ob_assessment_report_id_9025b5a3_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_observer
    ADD CONSTRAINT assessment_report_ob_assessment_report_id_9025b5a3_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_openingandclosingmeetingparticipants assessment_report_op_assessment_report_id_faa8e51a_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_openingandclosingmeetingparticipants
    ADD CONSTRAINT assessment_report_op_assessment_report_id_faa8e51a_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_performancegaps assessment_report_pe_assessment_report_id_7a8f7d5a_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_performancegaps
    ADD CONSTRAINT assessment_report_pe_assessment_report_id_7a8f7d5a_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_provisionresponse assessment_report_pr_assessment_report_id_d72b248c_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_provisionresponse
    ADD CONSTRAINT assessment_report_pr_assessment_report_id_d72b248c_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_provisionresponse assessment_report_pr_provision_id_b5e70deb_fk_cip_code_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_provisionresponse
    ADD CONSTRAINT assessment_report_pr_provision_id_b5e70deb_fk_cip_code_ FOREIGN KEY (provision_id) REFERENCES public.cip_code_cipprovision(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_sitesandfacilitiesassessed assessment_report_si_assessment_report_id_09a00da0_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitesandfacilitiesassessed
    ADD CONSTRAINT assessment_report_si_assessment_report_id_09a00da0_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_sitevisitagenda assessment_report_si_assessment_report_id_dadeeb92_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_sitevisitagenda
    ADD CONSTRAINT assessment_report_si_assessment_report_id_dadeeb92_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_stakeholdermeetingssummaries assessment_report_st_assessment_report_id_5e9eafc7_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetingssummaries
    ADD CONSTRAINT assessment_report_st_assessment_report_id_5e9eafc7_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_stakeholdermeetings assessment_report_st_assessment_report_id_71e2844b_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_stakeholdermeetings
    ADD CONSTRAINT assessment_report_st_assessment_report_id_71e2844b_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assessment_report_suppliersoverview assessment_report_su_assessment_report_id_75f0ccb8_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_report_suppliersoverview
    ADD CONSTRAINT assessment_report_su_assessment_report_id_75f0ccb8_fk_assessmen FOREIGN KEY (assessment_report_id) REFERENCES public.assessment_report_assessmentreport(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_assuranceprocess_team_assessors assurance_process_as_assuranceprocess_id_bdd8993b_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess_team_assessors
    ADD CONSTRAINT assurance_process_as_assuranceprocess_id_bdd8993b_fk_assurance FOREIGN KEY (assuranceprocess_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_assuranceprocess assurance_process_as_lead_assessor_id_3283d4f2_fk_users_use; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess
    ADD CONSTRAINT assurance_process_as_lead_assessor_id_3283d4f2_fk_users_use FOREIGN KEY (lead_assessor_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_assuranceprocess assurance_process_as_signed_ca_id_afa70527_fk_common_do; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess
    ADD CONSTRAINT assurance_process_as_signed_ca_id_afa70527_fk_common_do FOREIGN KEY (signed_ca_id) REFERENCES public.common_document(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_assuranceprocess assurance_process_as_signed_loc_id_5eef67de_fk_common_do; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess
    ADD CONSTRAINT assurance_process_as_signed_loc_id_5eef67de_fk_common_do FOREIGN KEY (signed_loc_id) REFERENCES public.common_document(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_assuranceprocess assurance_process_as_supplier_organisatio_0480854a_fk_users_sup; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess
    ADD CONSTRAINT assurance_process_as_supplier_organisatio_0480854a_fk_users_sup FOREIGN KEY (supplier_organisation_id) REFERENCES public.users_supplierorganisation(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_assuranceprocess_team_assessors assurance_process_as_user_id_7d5f6c32_fk_users_use; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_assuranceprocess_team_assessors
    ADD CONSTRAINT assurance_process_as_user_id_7d5f6c32_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_minesite assurance_process_mi_assurance_process_id_3a0c5957_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_minesite
    ADD CONSTRAINT assurance_process_mi_assurance_process_id_3a0c5957_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_portstoragefacility assurance_process_po_assurance_process_id_632c12bd_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_portstoragefacility
    ADD CONSTRAINT assurance_process_po_assurance_process_id_632c12bd_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_regionaloffice assurance_process_re_assurance_process_id_828ca704_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_regionaloffice
    ADD CONSTRAINT assurance_process_re_assurance_process_id_828ca704_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: assurance_process_transportationinfrastructure assurance_process_tr_assurance_process_id_585a5f30_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assurance_process_transportationinfrastructure
    ADD CONSTRAINT assurance_process_tr_assurance_process_id_585a5f30_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cip cip_cip_assurance_process_id_58aa5fde_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cip
    ADD CONSTRAINT cip_cip_assurance_process_id_58aa5fde_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipfinding cip_cipfinding_cip_id_37f7774c_fk_cip_cip_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding
    ADD CONSTRAINT cip_cipfinding_cip_id_37f7774c_fk_cip_cip_id FOREIGN KEY (cip_id) REFERENCES public.cip_cip(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipfinding cip_cipfinding_cip_monitoring_cycle_31dc6646_fk_cip_cipmo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding
    ADD CONSTRAINT cip_cipfinding_cip_monitoring_cycle_31dc6646_fk_cip_cipmo FOREIGN KEY (cip_monitoring_cycle_id) REFERENCES public.cip_cipmonitoringcycle(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipfinding cip_cipfinding_finding_id_f8077e83_fk_assessmen; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfinding
    ADD CONSTRAINT cip_cipfinding_finding_id_f8077e83_fk_assessmen FOREIGN KEY (finding_id) REFERENCES public.assessment_report_finding(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipfindingstatushistory cip_cipfindingstatus_cip_finding_id_aa67011f_fk_cip_cipfi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfindingstatushistory
    ADD CONSTRAINT cip_cipfindingstatus_cip_finding_id_aa67011f_fk_cip_cipfi FOREIGN KEY (cip_finding_id) REFERENCES public.cip_cipfinding(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipfindingstatushistory cip_cipfindingstatus_cip_monitoring_cycle_d39ef993_fk_cip_cipmo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfindingstatushistory
    ADD CONSTRAINT cip_cipfindingstatus_cip_monitoring_cycle_d39ef993_fk_cip_cipmo FOREIGN KEY (cip_monitoring_cycle_id) REFERENCES public.cip_cipmonitoringcycle(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipfindingstatushistory cip_cipfindingstatus_move_to_cycle_id_5d9c778b_fk_cip_cipmo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipfindingstatushistory
    ADD CONSTRAINT cip_cipfindingstatus_move_to_cycle_id_5d9c778b_fk_cip_cipmo FOREIGN KEY (move_to_cycle_id) REFERENCES public.cip_cipmonitoringcycle(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_cipmonitoringcycle cip_cipmonitoringcycle_cip_id_8f185e12_fk_cip_cip_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_cipmonitoringcycle
    ADD CONSTRAINT cip_cipmonitoringcycle_cip_id_8f185e12_fk_cip_cip_id FOREIGN KEY (cip_id) REFERENCES public.cip_cip(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_code_cipcategory cip_code_cipcategory_principle_id_8477128c_fk_cip_code_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipcategory
    ADD CONSTRAINT cip_code_cipcategory_principle_id_8477128c_fk_cip_code_ FOREIGN KEY (principle_id) REFERENCES public.cip_code_cipprinciple(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_code_cipprinciple cip_code_cipprincipl_code_version_id_874df234_fk_cip_code_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipprinciple
    ADD CONSTRAINT cip_code_cipprincipl_code_version_id_874df234_fk_cip_code_ FOREIGN KEY (code_version_id) REFERENCES public.cip_code_cipcodeversion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: cip_code_cipprovision cip_code_cipprovisio_category_id_5bd271f0_fk_cip_code_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cip_code_cipprovision
    ADD CONSTRAINT cip_code_cipprovisio_category_id_5bd271f0_fk_cip_code_ FOREIGN KEY (category_id) REFERENCES public.cip_code_cipcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_comment comment_comment_content_type_id_fbfb9793_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_comment
    ADD CONSTRAINT comment_comment_content_type_id_fbfb9793_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_comment comment_comment_parent_id_b612524c_fk_comment_comment_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_comment
    ADD CONSTRAINT comment_comment_parent_id_b612524c_fk_comment_comment_id FOREIGN KEY (parent_id) REFERENCES public.comment_comment(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_comment comment_comment_user_id_6078e57b_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_comment
    ADD CONSTRAINT comment_comment_user_id_6078e57b_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_flag comment_flag_comment_id_41d5e873_fk_comment_comment_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flag
    ADD CONSTRAINT comment_flag_comment_id_41d5e873_fk_comment_comment_id FOREIGN KEY (comment_id) REFERENCES public.comment_comment(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_flag comment_flag_moderator_id_e2ccaf81_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flag
    ADD CONSTRAINT comment_flag_moderator_id_e2ccaf81_fk_users_user_id FOREIGN KEY (moderator_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_flaginstance comment_flaginstance_flag_id_5f0100d0_fk_comment_flag_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flaginstance
    ADD CONSTRAINT comment_flaginstance_flag_id_5f0100d0_fk_comment_flag_id FOREIGN KEY (flag_id) REFERENCES public.comment_flag(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_flaginstance comment_flaginstance_user_id_9aa1aa0c_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_flaginstance
    ADD CONSTRAINT comment_flaginstance_user_id_9aa1aa0c_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_follower comment_follower_content_type_id_c9480b27_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_follower
    ADD CONSTRAINT comment_follower_content_type_id_c9480b27_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_reaction comment_reaction_comment_id_66a7fc70_fk_comment_comment_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT comment_reaction_comment_id_66a7fc70_fk_comment_comment_id FOREIGN KEY (comment_id) REFERENCES public.comment_comment(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_reactioninstance comment_reactioninst_reaction_id_68fbb2eb_fk_comment_r; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactioninstance
    ADD CONSTRAINT comment_reactioninst_reaction_id_68fbb2eb_fk_comment_r FOREIGN KEY (reaction_id) REFERENCES public.comment_reaction(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comment_reactioninstance comment_reactioninstance_user_id_f813deaf_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactioninstance
    ADD CONSTRAINT comment_reactioninstance_user_id_f813deaf_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: common_document common_document_assurance_process_id_a17f5bbb_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.common_document
    ADD CONSTRAINT common_document_assurance_process_id_a17f5bbb_fk_assurance FOREIGN KEY (assurance_process_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: common_document common_document_content_type_id_e8fed8c9_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.common_document
    ADD CONSTRAINT common_document_content_type_id_e8fed8c9_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: common_document common_document_uploaded_by_id_ee0164cb_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.common_document
    ADD CONSTRAINT common_document_uploaded_by_id_ee0164cb_fk_users_user_id FOREIGN KEY (uploaded_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: deadlines_actiondeadline deadlines_actiondead_content_type_id_7d0a59af_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadline
    ADD CONSTRAINT deadlines_actiondead_content_type_id_7d0a59af_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: deadlines_actiondeadlinereminder deadlines_actiondead_deadline_id_fce9d790_fk_deadlines; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadlinereminder
    ADD CONSTRAINT deadlines_actiondead_deadline_id_fce9d790_fk_deadlines FOREIGN KEY (deadline_id) REFERENCES public.deadlines_actiondeadline(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: deadlines_actiondeadlinereminder deadlines_actiondead_user_id_e0d38cfb_fk_users_use; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deadlines_actiondeadlinereminder
    ADD CONSTRAINT deadlines_actiondead_user_id_e0d38cfb_fk_users_use FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: otp_static_staticdevice otp_static_staticdevice_user_id_7f9cff2b_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_static_staticdevice
    ADD CONSTRAINT otp_static_staticdevice_user_id_7f9cff2b_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: otp_static_statictoken otp_static_statictok_device_id_74b7c7d1_fk_otp_stati; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_static_statictoken
    ADD CONSTRAINT otp_static_statictok_device_id_74b7c7d1_fk_otp_stati FOREIGN KEY (device_id) REFERENCES public.otp_static_staticdevice(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: otp_totp_totpdevice otp_totp_totpdevice_user_id_0fb18292_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_totp_totpdevice
    ADD CONSTRAINT otp_totp_totpdevice_user_id_0fb18292_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialtoken socialaccount_social_account_id_951f210e_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_social_account_id_951f210e_fk_socialacc FOREIGN KEY (account_id) REFERENCES public.socialaccount_socialaccount(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialtoken socialaccount_social_app_id_636a42d7_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_social_app_id_636a42d7_fk_socialacc FOREIGN KEY (app_id) REFERENCES public.socialaccount_socialapp(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialapp_sites socialaccount_social_site_id_2579dee5_fk_django_si; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp_sites
    ADD CONSTRAINT socialaccount_social_site_id_2579dee5_fk_django_si FOREIGN KEY (site_id) REFERENCES public.django_site(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialapp_sites socialaccount_social_socialapp_id_97fb6e7d_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialapp_sites
    ADD CONSTRAINT socialaccount_social_socialapp_id_97fb6e7d_fk_socialacc FOREIGN KEY (socialapp_id) REFERENCES public.socialaccount_socialapp(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_user_id_8146e70c_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_user_id_8146e70c_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqcategory supplier_questionnai_category_id_6c117175_fk_cip_code_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategory
    ADD CONSTRAINT supplier_questionnai_category_id_6c117175_fk_cip_code_ FOREIGN KEY (category_id) REFERENCES public.cip_code_cipcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqcategoryresponse supplier_questionnai_last_submitted_by_id_dd568b67_fk_users_use; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategoryresponse
    ADD CONSTRAINT supplier_questionnai_last_submitted_by_id_dd568b67_fk_users_use FOREIGN KEY (last_submitted_by_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqcategoryresponse supplier_questionnai_mine_site_id_6696ea40_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategoryresponse
    ADD CONSTRAINT supplier_questionnai_mine_site_id_6696ea40_fk_assurance FOREIGN KEY (mine_site_id) REFERENCES public.assurance_process_minesite(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqquestion supplier_questionnai_sq_category_id_2ebb3706_fk_supplier_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqquestion
    ADD CONSTRAINT supplier_questionnai_sq_category_id_2ebb3706_fk_supplier_ FOREIGN KEY (sq_category_id) REFERENCES public.supplier_questionnaire_sqcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqcategoryresponse supplier_questionnai_sq_category_id_9482c5d7_fk_supplier_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqcategoryresponse
    ADD CONSTRAINT supplier_questionnai_sq_category_id_9482c5d7_fk_supplier_ FOREIGN KEY (sq_category_id) REFERENCES public.supplier_questionnaire_sqcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqanswer supplier_questionnai_sq_category_response_0a549cdf_fk_supplier_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqanswer
    ADD CONSTRAINT supplier_questionnai_sq_category_response_0a549cdf_fk_supplier_ FOREIGN KEY (sq_category_response_id) REFERENCES public.supplier_questionnaire_sqcategoryresponse(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: supplier_questionnaire_sqanswer supplier_questionnai_sq_question_id_eefa5ef0_fk_supplier_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_questionnaire_sqanswer
    ADD CONSTRAINT supplier_questionnai_sq_question_id_eefa5ef0_fk_supplier_ FOREIGN KEY (sq_question_id) REFERENCES public.supplier_questionnaire_sqquestion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: two_factor_phonedevice two_factor_phonedevice_user_id_54718003_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.two_factor_phonedevice
    ADD CONSTRAINT two_factor_phonedevice_user_id_54718003_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_assessorprofile users_assessorprofil_signed_nda_id_ae19c2f5_fk_common_do; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_assessorprofile
    ADD CONSTRAINT users_assessorprofil_signed_nda_id_ae19c2f5_fk_common_do FOREIGN KEY (signed_nda_id) REFERENCES public.common_document(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_assessorprofile users_assessorprofile_cv_id_948bc2a5_fk_common_document_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_assessorprofile
    ADD CONSTRAINT users_assessorprofile_cv_id_948bc2a5_fk_common_document_id FOREIGN KEY (cv_id) REFERENCES public.common_document(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_assessorprofile users_assessorprofile_user_id_c2e6778c_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_assessorprofile
    ADD CONSTRAINT users_assessorprofile_user_id_c2e6778c_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_memberprofile_assurance_processes users_memberprofile__assuranceprocess_id_069370ac_fk_assurance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile_assurance_processes
    ADD CONSTRAINT users_memberprofile__assuranceprocess_id_069370ac_fk_assurance FOREIGN KEY (assuranceprocess_id) REFERENCES public.assurance_process_assuranceprocess(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_memberprofile_assurance_processes users_memberprofile__memberprofile_id_27bbd06c_fk_users_mem; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile_assurance_processes
    ADD CONSTRAINT users_memberprofile__memberprofile_id_27bbd06c_fk_users_mem FOREIGN KEY (memberprofile_id) REFERENCES public.users_memberprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_memberprofile users_memberprofile_user_id_364427be_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_memberprofile
    ADD CONSTRAINT users_memberprofile_user_id_364427be_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_supplierorganisation users_supplierorgani_coordinator_id_9f50961c_fk_users_use; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierorganisation
    ADD CONSTRAINT users_supplierorgani_coordinator_id_9f50961c_fk_users_use FOREIGN KEY (coordinator_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_supplierprofile users_supplierprofil_organisation_id_386f780a_fk_users_sup; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierprofile
    ADD CONSTRAINT users_supplierprofil_organisation_id_386f780a_fk_users_sup FOREIGN KEY (organisation_id) REFERENCES public.users_supplierorganisation(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_supplierprofile users_supplierprofile_user_id_5a230cd1_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_supplierprofile
    ADD CONSTRAINT users_supplierprofile_user_id_5a230cd1_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user users_user_company_id_14799323_fk_users_company_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user
    ADD CONSTRAINT users_user_company_id_14799323_fk_users_company_id FOREIGN KEY (company_id) REFERENCES public.users_company(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user_groups users_user_groups_group_id_9afc8d0e_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_groups
    ADD CONSTRAINT users_user_groups_group_id_9afc8d0e_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user_groups users_user_groups_user_id_5f6f5a90_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_groups
    ADD CONSTRAINT users_user_groups_user_id_5f6f5a90_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user_user_permissions users_user_user_perm_permission_id_0b93982e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_user_permissions
    ADD CONSTRAINT users_user_user_perm_permission_id_0b93982e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user_user_permissions users_user_user_permissions_user_id_20aca447_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_user_permissions
    ADD CONSTRAINT users_user_user_permissions_user_id_20aca447_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

