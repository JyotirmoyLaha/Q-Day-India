# Target verification — 2026-10-22

489 hosts in the target list; **487 verified**, 2 unverified.

## Method

`scripts/verify-targets.mjs` made one HTTPS request to each homepage (redirects followed) and recorded the page title,
site name, description, first heading and the TLS certificate's subject organisation and SANs (raw data:
`targets/verification-evidence.json`). Sites that block automated clients were fetched again with a browser
User-Agent (`verification-evidence.browser-ua.json`), and candidate replacement hostnames were checked the same way
(`verification-evidence.partial.json`). A host was marked `verified: true` when at least one of these ties it to the
organisation shown:

1. the page title / site name / heading names the organisation;
2. the certificate's `O=` field is the organisation or its parent company;
3. the name sits in a restricted registry (`.bank.in` — RBI-regulated banks only; `.gov.in`/`.nic.in` — government
   bodies only; `.ac.in`/`.edu.in` — academic institutions only) and the label is the organisation's known name;
4. Wikidata lists the host as the organisation's official website (property P856).

Each host's evidence is stored in its `notes` field in `targets/india.yaml`.

## Changes made during verification

Most changes come from RBI's mandatory move of bank websites to `.bank.in` domains: the old domains now redirect, so
the index tracks the host visitors actually reach.

| Change | Host | Organisation | Evidence / reason |
|---|---|---|---|
| moved | `www.onlinesbi.sbi` → `onlinesbi.sbi.bank.in` | State Bank of India | page title "State Bank of India"; certificate O="STATE BANK OF INDIA"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.bankofbaroda.in` → `bankofbaroda.bank.in` | Bank of Baroda | certificate O="Bank of Baroda"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.pnbindia.in` → `pnb.bank.in` | Punjab National Bank | page title "Personal Banking | Corporate Banking | Netbanking Services| Bank | PNB"; certificate O="Punjab National Bank"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `canarabank.com` → `www.canarabank.bank.in` | Canara Bank | page title "Canara Bank - Personal & Corporate Banking Services"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.unionbankofindia.co.in` → `www.unionbankofindia.bank.in` | Union Bank of India | page title "Union Bank of India - Personal, Corporate & NRI Banking Online"; certificate O="Union Bank of India"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `indianbank.in` → `indianbank.bank.in` | Indian Bank | page title "Personal & Home Loan - Digital Banking Services - Indian Bank"; certificate O="INDIAN BANK"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.centralbankofindia.co.in` → `centralbank.bank.in` | Central Bank of India | page title "Welcome to Central Bank of India | Central Bank of India"; certificate O="Central Bank of India"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.iob.in` → `www.iob.bank.in` | Indian Overseas Bank | page title "Indian Overseas Bank: Personal Banking | One Stop Banking Solution - IOB"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `bankofmaharashtra.in` → `bankofmaharashtra.bank.in` | Bank of Maharashtra | .bank.in registry (restricted to RBI-regulated banks) |
| moved | `punjabandsindbank.co.in` → `www.punjabandsind.bank.in` | Punjab & Sind Bank | page title "Punjab & Sind Bank | Saving Accounts | Loan Schemes"; certificate O="PUNJAB & SIND BANK"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.idbibank.in` → `www.idbi.bank.in` | IDBI Bank | page title "Personal & Corporate Banking | MSME & Agri banking - IDBI Bank"; certificate O="IDBI BANK LIMITED"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.hdfcbank.com` → `www.hdfc.bank.in` | HDFC Bank | page title "Personal Banking & Netbanking Services | HDFC Bank"; certificate O="Hdfc Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `netbanking.hdfcbank.com` → `now.hdfc.bank.in` | HDFC Bank | page title "Welcome to HDFC Bank NetBanking"; certificate O="Hdfc Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.icicibank.com` → `www.icici.bank.in` | ICICI Bank | page title "ICICI Bank - Personal, Business, Corporate and NRI Banking Online"; certificate O="ICICI Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.axisbank.com` → `www.axis.bank.in` | Axis Bank | page title "Personal Banking | Internet Banking | Corporate, NRI Banking Services Online - Axis Bank"; certificate O="Axis Bank Ltd"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `omni.axisbank.co.in` → `omni.axis.bank.in` | Axis Bank | certificate O="Axis Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.kotak.com` → `www.kotak.bank.in` | Kotak Mahindra Bank | page title "Savings Accounts, Personal Loans and Credit Cards - Kotak Mahindra Bank"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.indusind.com` → `www.indusind.bank.in` | IndusInd Bank | page title "IndusInd Bank - Cards, Loans, Accounts, Personal & NRI Banking Online"; certificate O="IndusInd Bank Ltd"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.yesbank.in` → `www.yes.bank.in` | Yes Bank | certificate O="YES BANK LIMITED"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.idfcfirstbank.com` → `www.idfcfirst.bank.in` | IDFC FIRST Bank | page title "IDFC FIRST Bank - Personal Banking, Loans, Accounts, Cards, Investment | IDFC FIRST Bank"; certificate O="IDFC First Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `karnatakabank.com` → `www.karnatakabank.bank.in` | Karnataka Bank | page title "Karnataka Bank: Personal Banking, Agri Banking, NRI Banking & Business Banking Services"; certificate O="THE KARNATAKA BANK LIMITED"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.kvb.co.in` → `www.kvb.bank.in` | Karur Vysya Bank | page title "Karur Vysya Bank - KVB"; certificate O="THE KARUR VYSYA BANK LIMITED"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.rblbank.com` → `www.rbl.bank.in` | RBL Bank | page title "Savings & Current Accounts, Loans, Credit Cards, NRI Services, Investments | RBL Bank"; certificate O="RBL Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `bandhanbank.com` → `bandhan.bank.in` | Bandhan Bank | page title "Bandhan Bank | Home Page"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.dcbbank.com` → `www.dcb.bank.in` | DCB Bank | page title "Online Internet Banking and Personal Banking Services - DCB Bank"; certificate O="DCB Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.csb.co.in` → `www.csb.bank.in` | CSB Bank | page title "Experience Heritage, Trust & Innovation in Banking | CSB Bank"; certificate O="CSB Bank Ltd"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.dhanbank.com` → `www.dhan.bank.in` | Dhanlaxmi Bank | page title "Welcome To Dhanlaxmi Bank | Dhanlaxmi Bank"; certificate O="Dhanlaxmi Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.jkbank.com` → `jkb.bank.in` | Jammu & Kashmir Bank | page title "Home | Official Website of Jammu and Kashmir Bank"; certificate O="JAMMU AND KASHMIR BANK LIMITED"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.tmb.in` → `www.tmb.bank.in` | Tamilnad Mercantile Bank | page title "Home Page | TMB"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.aubank.in` → `www.au.bank.in` | AU Small Finance Bank | page title "Personal, Business, Corporate, and NRI Banking | AU Small Finance Bank"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.equitasbank.com` → `equitas.bank.in` | Equitas Small Finance Bank | certificate O="EQUITAS SMALL FINANCE BANK LIMITED"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.ujjivansfb.in` → `www.ujjivansfb.bank.in` | Ujjivan Small Finance Bank | page title "Ujjivan SFB: Personal, Business and NRI Banking"; certificate O="Ujjivan Small Finance Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.janabank.com` → `www.jana.bank.in` | Jana Small Finance Bank | page title "Jana Small Finance Bank | Online Banking and Financial Services"; certificate O="Jana Small Finance Bank Ltd"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.suryodaybank.com` → `www.suryoday.bank.in` | Suryoday Small Finance Bank | .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.esafbank.com` → `www.esaf.bank.in` | ESAF Small Finance Bank | .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.utkarsh.bank` → `www.utkarsh.bank.in` | Utkarsh Small Finance Bank | page title "Utkarsh Small Finance Bank - Online Personal, Business & NRI Banking Services"; certificate O="Utkarsh Small Finance Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.ippbonline.com` → `ippbonline.bank.in` | India Post Payments Bank | page title "Personal - India Post Payments Bank"; certificate O="India Post Payments Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.finobank.com` → `www.fino.bank.in` | Fino Payments Bank | page title "Individual"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.jiopaymentsbank.com` → `www.jiopayments.bank.in` | Jio Payments Bank | page title "Jio Payments Bank – Seamless 24/7 digital banking"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.hsbc.co.in` → `www.hsbc.bank.in` | HSBC India | page title "HSBC India - Credit Cards, NRI Services, Saving and Deposit"; certificate O="HSBC Group Management Services Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| removed | `www.online.citibank.co.in` | Citibank India | redirects to citigroup.com; Citi's Indian consumer business moved to Axis Bank |
| moved | `www.deutschebank.co.in` → `www.deutsche.bank.in` | Deutsche Bank India | page title "Banking, Loans & Investments for Individuals & Businesses &ndash; Deutsche Bank India"; certificate O="DEUTSCHE BANK AG"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `nhb.org.in` → `www.nhb.org.in` | National Housing Bank | page title "National Housing Bank" |
| moved | `www.saraswatbank.com` → `www.saraswat.bank.in` | Saraswat Co-operative Bank | page title "Home | Saraswat Cooperative Bank Ltd."; certificate O="Saraswat Co-Operative Bank Limited"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.svcbank.com` → `www.svc.bank.in` | SVC Co-operative Bank | page title "Home | SVC CO-OPERATIVE BANK LTD"; certificate O="SVC Co-operative Bank Ltd"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.cosmosbank.com` → `www.cosmos.bank.in` | Cosmos Co-operative Bank | page title "Home | Cosmos Bank"; .bank.in registry (restricted to RBI-regulated banks) |
| removed | `www.hdfc.com` | HDFC (housing finance) | HDFC Ltd merged into HDFC Bank; redirects to homeloans.hdfc.bank.in |
| moved | `juspay.in` → `juspay.io` | Juspay | page title "Juspay | Global Payments Operating System" |
| moved | `www.sliceit.com` → `slice.bank.in` | slice Small Finance Bank | page title "slice - A new bank, for a new India"; .bank.in registry (restricted to RBI-regulated banks) |
| moved | `www.paynearby.in` → `paynearby.in` | PayNearby | page title "Bharat Gateway to the next 500 million"; homepage text names PayNearby throughout (200+ mentions) |
| moved | `www.onlineservices.nsdl.com` → `onlineservices.proteantech.in` | Protean (PAN services) | page title "Login Manager"; certificate O="Protean eGov Technologies Limited" |
| removed | `vahan.parivahan.gov.in` | Vahan (vehicle registration) | redirects to parivahan.gov.in (duplicate) |
| moved | `www.epfindia.gov.in` → `www.epfo.gov.in` | EPFO | page title "Employees' Provident Fund Organisation"; certificate O="EMPLOYEES PROVIDENT FUND ORGANISATION"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `www.esic.gov.in` → `esic.gov.in` | ESIC | page title "Employees' State Insurance Corporation | Ministry of Labour & Employment, Government of India"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `enps.nsdl.com` → `www.npscra.proteantech.in` | NPS CRA (Protean) | page title "Welcome"; page names "Protean eGov Technologies Ltd" and the National Pension System |
| moved | `dst.gov.in` → `www.dst.gov.in` | Department of Science & Technology | .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `pib.gov.in` → `www.pib.gov.in` | Press Information Bureau | certificate O="Press Information Bureau\"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `www.negd.gov.in` → `negd.gov.in` | National e-Governance Division | page title "NeGD – National e-Governance Division – Your Gateway to e-Governance and Digital Empowerment"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `www.indiannavy.gov.in` → `indiannavy.gov.in` | Indian Navy | page title "Home | Indian Navy"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `dot.gov.in` → `www.dot.gov.in` | Department of Telecommunications | .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `haryana.gov.in` → `www.haryana.gov.in` | Government of Haryana | page title "Homepage | Haryana Government | Birth Place of the Gita | India"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `edistricts.up.gov.in` → `edistrict.up.gov.in` | e-District (Uttar Pradesh) | page title "eDistrict Uttar Pradesh"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `www.kotaksecurities.com` → `www.kotakneo.com` | Kotak Neo (Kotak Securities) | page title "Online Stock Trading & Investment Platform - Kotak Neo"; certificate O="Kotak Securities Ltd." |
| moved | `www.bajajallianzlife.com` → `www.bajajlifeinsurance.com` | Bajaj Life Insurance (formerly Bajaj Allianz Life) | page title "Life Insurance : Buy Best Life Insurance Policy Online at Bajaj Life Insurance (Bajaj Allianz)"; certificate O="Bajaj Life Insurance Ltd." |
| moved | `www.bajajallianz.com` → `www.bajajgeneralinsurance.com` | Bajaj General Insurance (formerly Bajaj Allianz) | page title "Bajaj General Insurance (Formerly Bajaj Allianz)"; certificate O="Bajaj General Insurance Limited" |
| moved | `www.reliancegeneral.co.in` → `www.indusindinsurance.com` | IndusInd General Insurance (formerly Reliance General) | page title "IndusInd General Insurance: Health, Motor & Travel Insurance - IndusInd General Insurance" |
| moved | `www.futuregenerali.in` → `www.generalicentralinsurance.com` | Generali Central Insurance (formerly Future Generali) | page title "General Insurance: Buy & Renew Health & Car Insurance Online| Generali Central Insurance"; certificate O="Generali Central Insurance Company Limited" |
| moved | `www.aiimsbhubaneswar.nic.in` → `aiimsbhubaneswar.nic.in` | AIIMS Bhubaneswar | page title "AIIMS Bhubaneswar"; .gov.in/.nic.in registry (restricted to Indian government bodies) |
| moved | `www.aiimsjodhpur.edu.in` → `aiimsjodhpur.edu.in` | AIIMS Jodhpur | page title "AIIMS Jodhpur"; certificate O="All India Institute of Medical Sciences\"; .ac.in/.edu.in registry (restricted to Indian academic institutions) |
| moved | `nimhans.ac.in` → `www.nimhans.ac.in` | NIMHANS | page title "Specialized Patient Care Services | NIMHANS Bangalore"; .ac.in/.edu.in registry (restricted to Indian academic institutions) |
| removed | `www.vodafoneidea.com` | Vodafone Idea (corporate) | redirects to www.myvi.in (duplicate) |
| moved | `www.bsnl.co.in` → `bsnl.co.in` | BSNL | page title "BSNL Portal — India&#x27;s Trusted Telecom Network"; certificate O="Bharat Sanchar Nigam Limited" |
| removed | `www.airtel.com` | Bharti Airtel (corporate) | redirects to www.airtel.in (duplicate) |
| removed | `www.jiofiber.com` | JioFiber | no ownership evidence; JioFiber is served from www.jio.com (already tracked) |
| moved | `www.iitmandi.ac.in` → `iitmandi.ac.in` | IIT Mandi | page title "Indian Institute of Technology Mandi"; .ac.in/.edu.in registry (restricted to Indian academic institutions) |
| moved | `www.iitgoa.ac.in` → `iitgoa.ac.in` | IIT Goa | page title "Indian Institute Of Technology Goa"; .ac.in/.edu.in registry (restricted to Indian academic institutions) |
| moved | `www.mnnit.ac.in` → `mnnit.ac.in` | MNNIT Allahabad | page title "MNNIT Allahabad | Motilal Nehru National Institute of Technology Allahabad Prayagraj"; .ac.in/.edu.in registry (restricted to Indian academic institutions) |
| moved | `iisc.ac.in` → `www.iisc.ac.in` | Indian Institute of Science | page title "Indian Institute of Science"; .ac.in/.edu.in registry (restricted to Indian academic institutions) |
| moved | `manipal.edu` → `www.manipal.edu` | Manipal Academy of Higher Education | Wikidata Q4095278 official website manipal.edu |
| moved | `www.byjus.com` → `byjus.com` | BYJU'S | page title "BYJU'S Online learning Programs For K3, K10, K12, NEET, JEE, UPSC & Bank Exams" |
| moved | `www.newsonair.gov.in` → `newsonair.gov.in` | All India Radio News | page title "Home | Akashvani News"; .gov.in/.nic.in registry (restricted to Indian government bodies) |

## Still unverified

- `www.metropolisindia.com` (Metropolis Healthcare): homepage blocked by the CDN (403) and no organisation in the certificate
- `www.zeptonow.com` (Zepto): homepage serves only a bot challenge and no organisation in the certificate
