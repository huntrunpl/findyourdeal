--
-- PostgreSQL database dump
--

\restrict lQlWigjrsT9tc2tI0sL5tVfQyugaOPrJenZJCggMYEZp3XnzBbA0cSQ6xc3jZ52

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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
-- Name: links; Type: TABLE; Schema: public; Owner: fyd
--

CREATE TABLE public.links (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    name text NOT NULL,
    url text,
    source text,
    active boolean DEFAULT true,
    chat_id bigint,
    thread_id integer,
    last_key text,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    filters jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.links OWNER TO fyd;

--
-- Name: links_id_seq; Type: SEQUENCE; Schema: public; Owner: fyd
--

CREATE SEQUENCE public.links_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.links_id_seq OWNER TO fyd;

--
-- Name: links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fyd
--

ALTER SEQUENCE public.links_id_seq OWNED BY public.links.id;


--
-- Name: links id; Type: DEFAULT; Schema: public; Owner: fyd
--

ALTER TABLE ONLY public.links ALTER COLUMN id SET DEFAULT nextval('public.links_id_seq'::regclass);


--
-- Data for Name: links; Type: TABLE DATA; Schema: public; Owner: fyd
--

COPY public.links (id, user_id, name, url, source, active, chat_id, thread_id, last_key, last_seen_at, created_at, filters) FROM stdin;
52	1	Monitorowanie OLX	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	ID18qZ9m	2025-12-01 16:38:52.855499+00	2025-12-01 16:13:16.896054+00	{}
41	1	Monitorowanie OLX	https://www.olx.pl/krakow/q-laptop/?search%5Bdist%5D=15		f	\N	\N	ID14XL30	2025-11-30 18:49:45.332369+00	2025-11-30 18:33:11.62983+00	{}
20	1	Audi A6	https://www.olx.pl/oferty/?q=audi+a6		f	\N	\N	910504354	2025-11-30 07:26:53.529225+00	2025-11-29 22:21:08.199113+00	{}
21	1	iPhone 15	https://www.olx.pl/oferty/?q=iphone+15		f	\N	\N	1041570793	2025-11-30 07:24:20.601743+00	2025-11-29 22:21:28.018318+00	{}
42	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661108650	2025-11-30 19:02:55.547185+00	2025-11-30 18:53:13.825631+00	{}
24	1	Monitorowanie OLX	https://m.olx.pl/elektronika/gry-konsole/konsole/q-ps5/?search%5Border%5D=relevance:desc		f	\N	\N	ID99-ID18tu9C	2025-11-30 12:45:34.094565+00	2025-11-30 12:29:44.481711+00	{}
110	768	Monitorowanie	https://www.olx.pl/d/oferta/test-ID12345.html	olx	f	\N	\N	\N	\N	2025-12-14 21:46:30.1198+00	{}
85	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_text=&catalog[]=1206&brand_ids[]=362&brand_ids[]=872289&search_id=29347391553&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7715060525-meska-kurtka-zimowa-carhartt-nimbus-pullover-anorak-rozmiar-m-ocieplana-polarem	2025-12-10 16:57:32.306643+00	2025-12-10 16:54:18.947+00	{}
22	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone+15		f	\N	\N	ID99-ID180DvC	2025-11-30 12:52:27.620843+00	2025-11-30 12:23:06.610057+00	{}
11	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	829146940	2025-11-29 22:20:58.117467+00	2025-11-27 16:14:42.187425+00	{}
10	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/986997621	2025-11-29 20:32:54.187548+00	2025-11-27 15:43:44.15999+00	{}
79	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29345908565&page=1&time=1765361967&search_by_image_uuid=&order=newest_first&size_ids[]=209&brand_ids[]=73306	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736722987-kurtka-stone-island-shadow-project	2025-12-10 10:59:28.706681+00	2025-12-10 10:20:04.537+00	{}
36	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=bluza%20adidas&catalog[]=5&page=1&time=1764525344&brand_ids[]=14&price_from=100&currency=PLN&price_to=1000		f	\N	\N	7671726499	2025-11-30 17:56:54.953034+00	2025-11-30 17:56:01.76995+00	{}
25	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=ps5		f	\N	\N	ID16OA5I	2025-11-30 16:51:14.244947+00	2025-11-30 12:30:43.38962+00	{}
15	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=test	\N	f	\N	\N	https://www.olx.pl/d/oferta/1041180798	2025-11-29 20:33:39.973088+00	2025-11-29 16:20:13.195025+00	{}
26	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=ps2		f	\N	\N	ID18m70P	2025-11-30 16:49:52.420684+00	2025-11-30 12:50:07.848536+00	{}
35	1	Monitorowanie OLX	https://www.olx.pl/krakow/q-laptop/?search%5Bdist%5D=15		f	\N	\N	ID16V3I6	2025-11-30 18:29:55.949037+00	2025-11-30 17:54:02.768676+00	{}
17	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/986997621	2025-11-29 20:34:03.077564+00	2025-11-29 16:31:00.181996+00	{}
16	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/1041180798	2025-11-29 20:34:02.723047+00	2025-11-29 16:30:26.032053+00	{}
14	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/1041180798	2025-11-29 20:33:39.603919+00	2025-11-29 16:04:19.073183+00	{}
18	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/986997621	2025-11-29 20:29:55.90725+00	2025-11-29 16:35:52.454494+00	{}
13	1	Monitorowanie OLX	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/1041180798	2025-11-29 20:34:01.947453+00	2025-11-29 15:52:19.77578+00	{}
27	1	PS5 tanie	https://www.olx.pl/oferty/?q=ps5		f	\N	\N	ID18o5Px	2025-11-30 17:00:06.324297+00	2025-11-30 16:55:03.121522+00	{}
34	1	Monitorowanie OLX	https://www.olx.pl/czestochowa/q-telewizor-lg-65-cali/?search%5Bdist%5D=10		t	6098313815	\N	https://www.olx.pl/oferta/lg-65-cali-gwarancja-CID99-ID18zPnv.html	2025-12-15 10:26:30.419557+00	2025-11-30 17:53:05.260587+00	{}
31	1	PS5 tanie	https://www.olx.pl/oferty/?q=ps5		f	\N	\N	ID18sV8T	2025-11-30 17:56:11.930142+00	2025-11-30 17:32:54.250447+00	{}
29	1	PS5 tanie	https://www.olx.pl/oferty/?q=ps5		f	\N	\N	ID17OOf3	2025-11-30 17:19:46.024845+00	2025-11-30 17:01:56.737421+00	{}
32	1	PS2 kolekcja	https://www.olx.pl/oferty/?q=ps2		f	\N	\N	IDZ8h87	2025-11-30 17:56:19.979389+00	2025-11-30 17:33:17.416762+00	{}
12	1	test	https://www.olx.pl/oferty/?q=iphone14	\N	f	\N	\N	https://www.olx.pl/d/oferta/1038809887	2025-11-29 21:23:15.315656+00	2025-11-27 17:44:06.134958+00	{}
19	1	iPhone 15 OLX	https://www.olx.pl/oferty/?q=iphone15		f	\N	\N	https://www.olx.pl/d/oferta/1038809887	2025-11-29 21:23:16.819502+00	2025-11-29 20:41:03.425117+00	{}
30	1	PS5 tanie	https://www.olx.pl/oferty/?q=ps5		f	\N	\N	ID18lJzT	2025-11-30 17:31:33.69159+00	2025-11-30 17:19:38.692134+00	{}
28	1	PS2 kolekcja	https://www.olx.pl/oferty/?q=ps2		f	\N	\N	ID18uBZ4	2025-11-30 17:21:28.277716+00	2025-11-30 16:55:19.879708+00	{}
48	1	Monitorowanie OLX	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	IDUFtET	2025-11-30 22:02:31.820539+00	2025-11-30 21:30:01.524832+00	{}
57	1	Lenovo Kraków test	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	ID180ANf	2025-12-01 20:59:22.97009+00	2025-12-01 20:39:17.893592+00	{}
56	1	Monitorowanie OLX	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	ID180ANf	2025-12-01 21:00:43.079862+00	2025-12-01 18:58:30.56175+00	{}
55	1	Monitorowanie OLX	https://m.olx.pl/elektronika/telefony/smartfony-telefony-komorkowe/?search%5Bprivate_business%5D=private&search%5Border%5D=created_at:desc&search%5Bfilter_float_price:to%5D=300&search%5Bfilter_enum_state%5D%5B0%5D=used&search%5Bfilter_enum_state%5D%5B1%5D=damaged	olx	f	\N	\N	ID18ubU9	2025-12-01 18:52:11.426889+00	2025-12-01 16:50:01.981599+00	{}
63	1	iPhone 14 OLX	https://www.olx.pl/oferty/?q=iphone%2014	olx	f	-5046473847	\N	https://www.olx.pl/d/oferta/iphone-14-pro-128gb-86-CID99-ID18yakj.html	2025-12-08 05:52:37.809224+00	2025-12-06 14:57:01.351+00	{}
101	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?catalog[]=1206&brand_ids[]=362&brand_ids[]=872289&page=1&time=1765574735&order=newest_first&size_ids[]=208&size_ids[]=209	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7752646070-czekoladowa-brazowa-kurtka-meska-carhartt-detroit-jacket-m	2025-12-12 21:26:55.058705+00	2025-12-12 21:25:49.841+00	{}
111	768	Monitorowanie	https://www.vinted.pl/items/123456789-test	vinted	f	\N	\N	https://www.vinted.pl/items/7766731468	2025-12-15 01:04:40.996424+00	2025-12-14 21:47:04.890625+00	{}
87	216	OLX wyszukiwanie	https://www.olx.pl/elektronika/gry-konsole/konsole/q-nintendo/?search%5Border%5D=created_at:desc	olx	f	-5046473847	\N	https://www.olx.pl/oferta/nintendo-switch-lite-2-gry-oryginalne-etui-CID99-ID18xI89.html	2025-12-10 17:13:34.647411+00	2025-12-10 17:07:11.348+00	{}
83	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29347391553&catalog[]=1206&brand_ids[]=362&brand_ids[]=872289&page=1&time=1765366139&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7739229255-carhartt-wbrooks-xs-kurtka-ocieplana-z-kapturem	2025-12-10 16:49:03.261201+00	2025-12-10 11:29:07.799+00	{}
75	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29295515902&catalog[]=2050&page=1&time=1765223488&order=newest_first&brand_ids[]=6539	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7724740348-bluza-moncler-3xl	2025-12-10 10:07:50.432956+00	2025-12-08 19:51:46.286+00	{}
91	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?catalog[]=1206&brand_ids[]=362&page=1&time=1765552095&size_ids[]=208&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7716188151-meska-kurtka-zimowa-ciepla-ocieplana-carhartt-anorak-nimbus-pullover-l	2025-12-12 15:41:09.047902+00	2025-12-12 15:08:29.767+00	{}
89	1	OLX wyszukiwanie	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	-5046473847	\N	https://www.olx.pl/oferta/laaptoop-lenovoo-CID99-ID17IJtQ.html	2025-12-11 11:23:31.369859+00	2025-12-11 09:53:29.139+00	{"notificationsOffChats": ["-5046473847"]}
66	216	OLX wyszukiwanie	https://www.olx.pl/elektronika/gry-konsole/konsole/nintendo/q-nintendo-switch/?search%5Border%5D=created_at:desc	olx	f	-5046473847	\N	https://www.olx.pl/d/oferta/nintendo-switch-uzywane-CID99-ID18BtVW.html	2025-12-08 17:46:43.86466+00	2025-12-08 16:40:38.792+00	{}
112	768	Monitorowanie	https://www.olx.pl/d/oferta/test-ID12345-1.html	olx	f	\N	\N	\N	\N	2025-12-14 21:48:52.134898+00	{}
113	768	Monitorowanie	https://www.olx.pl/d/oferta/test-ID12345-2.html	olx	f	\N	\N	\N	\N	2025-12-14 21:48:52.168522+00	{}
58	1	Lenovo Kraków	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	ID18oy15	2025-12-01 21:18:29.709138+00	2025-12-01 21:04:24.166269+00	{}
114	768	Monitorowanie	https://www.olx.pl/d/oferta/test-ID12345-3.html	olx	f	\N	\N	\N	\N	2025-12-14 21:48:52.194061+00	{}
70	216	OLX wyszukiwanie	https://www.olx.pl/elektronika/gry-konsole/konsole/nintendo/q-nintendo-switch/?search%5Border%5D=created_at:desc&search%5Bfilter_enum_state%5D%5B0%5D=used&search%5Bfilter_enum_state%5D%5B1%5D=new	olx	f	-5046473847	\N	https://www.olx.pl/oferta/mega-zestaw-konsola-nintendo-switch-oled-1-5-tb-cfw-tona-dodatkow-CID99-ID182vhJ.html	2025-12-08 18:19:42.822998+00	2025-12-08 17:46:32.277+00	{}
46	1	Monitorowanie Vinted	https://www.vinted.pl/catalog?search_text=ps5	vinted	f	\N	\N	7661357788	2025-11-30 21:28:30.111881+00	2025-11-30 21:28:09.508546+00	{}
98	216	OLX wyszukiwanie	https://www.olx.pl/zdrowie-i-uroda/perfumy/?search%5Border%5D=created_at:desc&search%5Bfilter_float_price:to%5D=250	olx	f	-5046473847	\N	https://www.olx.pl/oferta/mgielka-vs-zapach-pure-CID3647-ID18FJyo.html	2025-12-12 21:23:45.726653+00	2025-12-12 19:03:47.547+00	{"notificationsOffChats": ["-5046473847"]}
105	216	OLX wyszukiwanie	https://www.olx.pl/elektronika/gry-konsole/konsole/?search%5Bfilter_float_price:to%5D=2000	olx	f	-5046473847	\N	https://www.olx.pl/oferta/ps5-konsola-idealny-stan-CID99-ID18GIjF.html	2025-12-15 01:32:33.520719+00	2025-12-12 23:00:39.139+00	{}
62	1	iPhone 14 OLX	https://www.olx.pl/oferty/?q=iphone%2014	olx	f	-5046473847	\N	https://www.olx.pl/oferta/iphone-14-pro-128gb-86-bateria-CID99-ID18CyXo.html	2025-12-10 10:07:28.164329+00	2025-12-05 10:58:18.485+00	{}
96	216	OLX wyszukiwanie	https://www.olx.pl/elektronika/gry-konsole/konsole/nintendo/q-nintendo/?search%5Border%5D=created_at:desc&search%5Bfilter_float_price:to%5D=900	olx	f	-5046473847	\N	https://www.olx.pl/oferta/szybka-oslona-ekranu-game-boy-gameboy-advance-CID99-IDVqsCk.html	2025-12-12 19:06:07.125879+00	2025-12-12 16:11:20.835+00	{"notificationsOffChats": ["-5046473847"]}
93	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?page=1&time=1765552242&order=newest_first&brand_ids[]=639289&brand_ids[]=450765&brand_ids[]=145654	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7750660108-maison-margiela	2025-12-12 15:40:18.789217+00	2025-12-12 15:10:54.049+00	{}
97	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?brand_ids[]=14969&page=1&time=1765566151&size_ids[]=208&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7752657280-supreme-on-god-hoodie	2025-12-12 21:23:27.595564+00	2025-12-12 19:02:40.671+00	{}
99	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?page=1&time=1765566295&order=newest_first&brand_ids[]=53&size_ids[]=786&size_ids[]=788&price_to=350&currency=PLN&status_ids[]=2	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7750892434-buty-joya-dynamo-classic-m-swiss-technology-size-44-28-cm	2025-12-12 19:17:31.803487+00	2025-12-12 19:05:17.933+00	{}
43	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661108650	2025-11-30 19:15:44.249168+00	2025-11-30 19:15:16.888448+00	{}
95	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?page=1&time=1765554161&order=newest_first&brand_ids[]=14969&size_ids[]=208	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7751871590-supreme-hoodie	2025-12-12 19:01:47.495461+00	2025-12-12 15:42:57.268+00	{"notificationsOffChats": ["-5046473847"]}
33	1	PS5 Vinted	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661357788	2025-11-30 18:16:06.599515+00	2025-11-30 17:37:12.037973+00	{}
68	216	l.facebook.com	https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.vinted.pl%2Fcatalog%3Fsearch_id%3D28802938466%26catalog[0]%3D2050%26brand_ids[0]%3D3745671%26page%3D1%26time%3D1765211617%26order%3Dnewest_first%26fbclid%3DIwZXh0bgNhZW0CMTAAc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHo6yPZbDQ3ksd-MjmC9j1LCinPZZKUw8ZgNvvSD0weU0ZgOcoyGroJG2EBS4_aem_Rflw7go1IOgIFt4znUdOWg&h=AT0VLgPaALuzmJusUtTEd4n6z63ZJkAyVJEP-uYiCuCW4GhEK4pmghzCN4ptzKK1qN4d_NGQwGAK4e79QVD_JD1RZ0r_wOA4hYzR2GwtdJZAJtD0NBnsQExbj5T6xqkG1kgo6y5rSvDokCJZ-8dfIA	vinted	f	-5046473847	\N	\N	\N	2025-12-08 17:44:48.185+00	{}
74	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29296685189&catalog[]=2050&brand_ids[]=14969&page=1&time=1765218016&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736294513-stribet-striktroje	2025-12-10 09:55:22.561202+00	2025-12-08 19:15:46.533+00	{}
59	1	Lenovo Kraków	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	https://www.olx.pl/d/oferta/laptop-lenovo-g580-CID99-ID18ywk5.html	2025-12-04 19:18:11.591687+00	2025-12-01 21:18:45.339094+00	{}
37	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=spodnie&catalog[]=5&page=1&time=1764526233&brand_ids[]=14&price_from=100&currency=PLN&price_to=1000&search_by_image_uuid=		f	\N	\N	7232474216	2025-11-30 18:12:08.127289+00	2025-11-30 18:11:01.550928+00	{}
38	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661357788	2025-11-30 18:18:25.77174+00	2025-11-30 18:17:54.246429+00	{}
23	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ralph%20lauren&catalog[]=2050&currency=PLN&page=1&time=1764505695&price_from=0&price_to=60&brand_ids[]=88&brand_ids[]=4273		f	\N	\N	893079443	2025-11-30 12:38:24.900724+00	2025-11-30 12:28:37.483586+00	{}
47	1	PS5 Vinted	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661357788	2025-11-30 21:29:39.291077+00	2025-11-30 21:28:56.050909+00	{}
44	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661108650	2025-11-30 19:31:31.647828+00	2025-11-30 19:31:04.537067+00	{}
45	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661357788	2025-11-30 20:09:30.923503+00	2025-11-30 19:40:06.194067+00	{}
39	1	Monitorowanie OLX	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661357788	2025-11-30 18:30:37.879347+00	2025-11-30 18:30:22.861223+00	{}
40	1	PS5 Vinted	https://www.vinted.pl/catalog?search_text=ps5		f	\N	\N	7661357788	2025-11-30 18:31:19.219007+00	2025-11-30 18:30:44.857087+00	{}
51	1	iPhone 14 Vinted test	https://www.vinted.pl/catalog?search_text=iphone14	vinted	f	\N	\N	7652376825	2025-12-01 16:11:18.686385+00	2025-12-01 15:37:14.077887+00	{}
49	1	PS5 test Vinted	https://www.vinted.pl/catalog?search_text=ps5	vinted	f	\N	\N	7661357788	2025-12-01 16:38:46.893961+00	2025-11-30 21:37:35.563286+00	{}
81	1	Vinted: bluza z kapturem	https://www.vinted.pl/catalog?search_text=bluza%20z%20kapturem&page=1&time=1765357953&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7731460458-bluza-wassyl	2025-12-10 10:46:49.014285+00	2025-12-10 10:45:44.734+00	{}
108	1	Monitorowanie OLX	https://www.olx.pl/krakow/q-laptop-lenovo/?search%5Bdist%5D=15	olx	f	\N	\N	https://www.olx.pl/oferta/jak-nowy-laptop-lenovo-v14-ada-250gb-ssd-4gb-ram-CID99-IDZFa6V.html	2025-12-14 21:03:01.36383+00	2025-12-14 18:19:39.297488+00	{}
104	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?catalog[]=1231&page=1&time=1765575633&size_ids[]=788&status_ids[]=2&status_ids[]=1&status_ids[]=6&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7759238734	2025-12-14 00:02:45.892122+00	2025-12-12 22:54:36.666+00	{}
67	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=28802938466&catalog[]=2050&brand_ids[]=3745671&page=1&time=1765211617&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7726839471-granatowe-ciemne-dresy-enrage-bubble-s-bubble-sweatpants-night-enrage	2025-12-08 17:42:00.635245+00	2025-12-08 16:41:03.658+00	{}
102	216	OLX wyszukiwanie	https://www.olx.pl/elektronika/gry-konsole/konsole/?search%5Bfilter_float_price:to%5D=2000	olx	f	-5046473847	\N	https://www.olx.pl/oferta/nintendo-switch-v1-v2-chip-picofly-cfw-przerobka-modowanie-atmosphere-CID99-ID16e1ke.html	2025-12-12 22:59:32.042421+00	2025-12-12 21:26:52.392+00	{"notificationsOffChats": ["-5046473847"]}
115	1	Monitorowanie	https://www.vinted.pl/catalog?page=1&time=1765612892&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300&size_ids[]=207&size_ids[]=208&size_ids[]=209&size_ids[]=210&size_ids[]=206&size_ids[]=211&catalog[]=5&search_text=bluza	vinted	f	6098313815	\N	https://www.vinted.pl/items/7766730487	2025-12-15 01:04:44.878294+00	2025-12-15 00:35:39.217872+00	{}
103	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?catalog[]=1231&page=1&time=1765575633&size_ids[]=788&status_ids[]=2&status_ids[]=1&status_ids[]=6&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7752972508-buty-timberland-waterproof-44	2025-12-12 22:55:19.309665+00	2025-12-12 21:40:49.904+00	{}
73	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29295515902&catalog[]=2050&brand_ids[]=3745671&page=1&time=1765215933&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7692732197-koszulka-hanes	2025-12-08 19:51:19.866491+00	2025-12-08 19:15:35.884+00	{}
107	1	Vinted: bluza	https://www.vinted.pl/catalog?page=1&time=1765612892&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300&size_ids[]=207&size_ids[]=208&size_ids[]=209&size_ids[]=210&size_ids[]=206&size_ids[]=211&catalog[]=5&search_text=bluza	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7759244140	2025-12-14 00:06:33.701678+00	2025-12-13 08:28:18.46+00	{"notificationsOffChats": ["-5046473847"]}
90	1	Vinted: bluza z kapturem	https://www.vinted.pl/catalog?search_text=bluza%20z%20kapturem&page=1&time=1765536152&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300&size_ids[]=207&size_ids[]=208&size_ids[]=209&size_ids[]=210&size_ids[]=206&size_ids[]=211	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7757783339	2025-12-14 00:02:00.384005+00	2025-12-12 10:42:46.914+00	{"notificationsOffChats": ["-5046473847"]}
53	1	ralph lauren test	https://www.vinted.pl/catalog?search_text=ralph%20lauren&catalog[]=2050&currency=PLN&page=1&time=1764606866&price_from=0&price_to=80&order=newest_first	vinted	f	\N	\N	7679019235	2025-12-01 16:45:41.448586+00	2025-12-01 16:35:12.758005+00	{}
50	1	PS5 test Vinted	https://www.vinted.pl/catalog?search_text=ps5	vinted	f	\N	\N	7677244654	2025-12-01 16:12:54.620721+00	2025-11-30 21:44:01.204188+00	{}
54	1	Monitorowanie Vinted	https://www.vinted.pl/catalog?search_text=ralph%20lauren&catalog[]=2050&currency=PLN&page=1&time=1764607682&price_from=0&price_to=80&order=newest_first&size_ids[]=207&size_ids[]=208&color_ids[]=12&color_ids[]=1&color_ids[]=9&color_ids[]=26	vinted	f	\N	\N	7680751641	2025-12-01 18:50:53.521167+00	2025-12-01 16:49:29.81976+00	{}
84	1	Vinted: bluza z kapturem	https://www.vinted.pl/catalog?search_text=bluza%20z%20kapturem&page=1&time=1765357953&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7753004181-essentials-pulover	2025-12-13 02:07:51.325418+00	2025-12-10 16:30:20.834+00	{"notificationsOffChats": ["-5046473847"]}
77	1	Vinted: bluza z kapturem	https://www.vinted.pl/catalog?search_text=bluza%20z%20kapturem&page=1&time=1765357953&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736402841-bluza-pequs	2025-12-10 10:12:22.072561+00	2025-12-10 09:12:53.371+00	{}
60	1	Monitorowanie Vinted	https://www.vinted.pl/catalog?search_text=spodnie&catalog[]=5&page=1&time=1764526233&brand_ids[]=14&price_from=100&currency=PLN&price_to=1000&search_by_image_uuid=	vinted	f	\N	\N	https://www.vinted.pl/items/7244024601-adidas-spodnie-dresowe	2025-12-10 09:20:51.009286+00	2025-12-01 21:44:26.83835+00	{"maxPrice": 200, "minPrice": 150}
106	1	Vinted: bluza	https://www.vinted.pl/catalog?page=1&time=1765612892&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300&size_ids[]=207&size_ids[]=208&size_ids[]=209&size_ids[]=210&size_ids[]=206&size_ids[]=211&catalog[]=5&search_text=bluza	vinted	f	-5046473847	\N	\N	\N	2025-12-13 08:12:32.757+00	{}
61	1	ralph lauren	https://www.vinted.pl/catalog?search_text=ralph%20lauren&search_id=29108983529&size_ids[]=207&size_ids[]=208&page=1&time=1764703729&order=newest_first	vinted	f	\N	\N	https://www.vinted.pl/items/7688561781-mork-gron-polo-ralph-lauren-skjorta	2025-12-02 21:39:20.76106+00	2025-12-02 19:29:00.878465+00	{"sizes": ["M", "L"], "maxPrice": 400, "minPrice": 50, "conditions": ["Nowy", "Bardzo dobry"]}
64	1	Vinted: spodnie	https://www.vinted.pl/catalog?search_text=spodnie&page=1&time=1765143572&currency=PLN&price_to=1000&search_by_image_uuid=	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736390751-spodnie	2025-12-10 10:12:11.10026+00	2025-12-07 21:40:17.877+00	{}
92	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?catalog[]=77&page=1&time=1765552146&size_ids[]=208&order=newest_first&brand_ids[]=14969&brand_ids[]=139960&brand_ids[]=222038	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7278522788-supreme-box-logo-sterling-ruby-tee	2025-12-12 15:41:33.183979+00	2025-12-12 15:09:31.131+00	{}
100	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?catalog[]=1231&brand_ids[]=53&page=1&time=1765570746&size_ids[]=788&status_ids[]=2&status_ids[]=1&status_ids[]=6	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7752658538-2021-nike-air-max-plus-tuned-air-tn-dracula	2025-12-12 21:24:15.424376+00	2025-12-12 20:19:22.892+00	{}
109	1	Monitorowanie Vinted	https://www.vinted.pl/catalog?page=1&time=1765612892&currency=PLN&search_by_image_uuid=&price_from=100&price_to=300&size_ids[]=207&size_ids[]=208&size_ids[]=209&size_ids[]=210&size_ids[]=206&size_ids[]=211&catalog[]=5&search_text=bluza	vinted	f	\N	\N	https://www.vinted.pl/items/7765944461	2025-12-14 20:40:38.432099+00	2025-12-14 18:19:54.089068+00	{}
65	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=28802938466&catalog[]=2050&brand_ids[]=3745671&page=1&time=1765211617&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/5557240777-spodnie-off-white-body-scan-runway-denim-over-carpe-black-no-color	2025-12-08 16:37:56.066607+00	2025-12-08 16:33:54.849+00	{}
69	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29295515902&catalog[]=2050&brand_ids[]=3745671&page=1&time=1765215933&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7664595007-set-dresowy-nike-90s-premier-boxy	2025-12-08 18:01:26.644093+00	2025-12-08 17:45:53.147+00	{}
71	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29295515902&catalog[]=2050&brand_ids[]=3745671&page=1&time=1765215933&order=newest_first	vinted	f	-5046473847	\N	\N	\N	2025-12-08 18:06:57.143+00	{}
82	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29345908565&brand_ids[]=3036449&page=1&time=1765361918&search_by_image_uuid=&order=newest_first&size_ids[]=208	vinted	f	-5046473847	\N	https://www.vinted.pl/items/6228622970-aape-polo	2025-12-10 16:48:51.263403+00	2025-12-10 11:26:57.167+00	{}
88	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29355788737&catalog[]=2050&brand_ids[]=88&page=1&time=1765386691&size_ids[]=208&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7742926414-ralph-lauren-ferfi-ing	2025-12-11 10:53:18.570047+00	2025-12-10 17:11:42.178+00	{}
72	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29296685189&catalog[]=2050&brand_ids[]=14969&page=1&time=1765218016&order=newest_first	vinted	f	-5046473847	\N	\N	\N	2025-12-08 18:20:40.076+00	{}
76	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29331199850&brand_ids[]=73306&page=1&time=1765310170&search_by_image_uuid=&order=newest_first&size_ids[]=208	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736285106-bluza-crewneck-stone-island	2025-12-10 09:54:01.751384+00	2025-12-09 19:56:35.97+00	{}
78	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29345908565&brand_ids[]=3036449&page=1&time=1765361918&search_by_image_uuid=&order=newest_first&size_ids[]=208	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736889372-predam-tricko	2025-12-10 11:24:31.720314+00	2025-12-10 10:19:04.901+00	{}
80	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_id=29345908565&page=1&time=1765362035&search_by_image_uuid=&order=newest_first&brand_ids[]=3745671&size_ids[]=207&size_ids[]=208	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7736731540-kurtka-enrage	2025-12-10 11:01:10.394132+00	2025-12-10 10:20:46.576+00	{}
86	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?search_text=&catalog[]=1206&brand_ids[]=362&brand_ids[]=872289&search_id=29347391553&order=newest_first	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7742919763-carhartt-vintage-cordura-men-jacket	2025-12-11 10:52:04.975222+00	2025-12-10 16:59:16.756+00	{}
94	216	Vinted wyszukiwanie	https://www.vinted.pl/catalog?page=1&time=1765552242&order=newest_first&brand_ids[]=639289&brand_ids[]=450765&brand_ids[]=145654	vinted	f	-5046473847	\N	https://www.vinted.pl/items/7751898559-maison-martin-margiela-vintage-glove-bag	2025-12-12 19:01:37.386211+00	2025-12-12 15:42:14.013+00	{"notificationsOffChats": ["-5046473847"]}
\.


--
-- Name: links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fyd
--

SELECT pg_catalog.setval('public.links_id_seq', 115, true);


--
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: fyd
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- Name: idx_links_user; Type: INDEX; Schema: public; Owner: fyd
--

CREATE INDEX idx_links_user ON public.links USING btree (user_id) WHERE (active = true);


--
-- Name: links links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fyd
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lQlWigjrsT9tc2tI0sL5tVfQyugaOPrJenZJCggMYEZp3XnzBbA0cSQ6xc3jZ52

