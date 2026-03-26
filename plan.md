# Cosmetic AI — Kompletan Plan Razvoja

## 1. Pregled Projekta

**Ime:** Cosmetic AI
**Tip:** SaaS web aplikacija
**Opis:** Aplikacija koja pomaže biznisima u kozmetičkoj industriji i industriji kućne hemije da kreiraju sadržaj za društvene mreže koristeći AI tehnologiju.

**Dva profitna centra (vertikale):**
- **Kozmetika** — kreme, maske za lice, šminke, itd.
- **Kućna hemija** — deterdženti, odmašćivači, praškovi, itd.

**Tri glavne AI funkcije:**
1. Generisanje teksta za društvene mreže (sa ili bez fotografije)
2. Generisanje slike na osnovu uploadovane slike + prompt
3. Generisanje slike samo na osnovu prompta (bez input slike)

---

## 2. Tech Stack

| Tehnologija | Namena |
|---|---|
| **Next.js 14+** (App Router) | Frontend + API rute |
| **TypeScript** | Tipiziran kod |
| **Tailwind CSS** | Stilizovanje |
| **Supabase** | Baza podataka (PostgreSQL) + Auth + Storage |
| **Stripe** | Plaćanje i pretplate |
| **Vercel** | Hosting i deploy |
| **GitHub** | Verzionisanje koda |
| **OpenAI GPT-5.4** | Generisanje teksta |
| **Google Gemini-3-Pro-Image-Preview** | Generisanje slika |

> **VAŽNO:** AI modeli se NE menjaju osim na eksplicitan zahtev vlasnika.

---

## 3. Dizajn

**Stil:** Minimalistički
**Boje:** Sivo-belo sa crnim i plavim akcentima. Alternativa: crno-belo-sivo.
**Inspiracija:** https://cosmetic-ai-pilot.lovable.app
**Emotikoni:** Minimalna upotreba
**Responsive:** Da (mobilni + desktop)

---

## 4. Jezici (i18n)

Aplikacija podržava tri jezika:
- **Srpski (sr)** — podrazumevano
- **Hrvatski (hr)**
- **Engleski (en)**

Korisnik bira jezik u podešavanjima. Čuva se u profilu.

---

## 5. Šema Baze Podataka

### 5.1 Tabela: `profiles`

Proširuje Supabase `auth.users` tabelu.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK, FK → auth.users.id) | ID korisnika |
| `full_name` | text NOT NULL | Puno ime |
| `email` | text NOT NULL | Email adresa |
| `role` | text NOT NULL DEFAULT 'user' | Uloga: 'user' ili 'admin' |
| `credits` | integer NOT NULL DEFAULT 0 | Trenutni broj kredita |
| `language` | text NOT NULL DEFAULT 'sr' | Jezik: 'sr', 'hr', 'en' |
| `onboarding_completed` | boolean NOT NULL DEFAULT false | Da li je završio onboarding |
| `avatar_url` | text | URL avatara |
| `created_at` | timestamptz DEFAULT now() | Datum kreiranja |
| `updated_at` | timestamptz DEFAULT now() | Datum poslednje izmene |

### 5.2 Tabela: `businesses`

Podaci o brendu/biznisu korisnika (popunjava se tokom onboardinga).

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK) DEFAULT gen_random_uuid() | ID biznisa |
| `user_id` | uuid NOT NULL (FK → profiles.id) ON DELETE CASCADE | Vlasnik |
| `name` | text | Ime brenda |
| `industry` | text | 'cosmetics' ili 'home_chemistry' |
| `logo_url` | text | URL logotipa |
| `description` | text | Opis brenda |
| `target_audience` | text | Ciljna grupa |
| `communication_tone` | text | Ton komunikacije |
| `social_networks` | text[] | Društvene mreže (instagram, facebook, tiktok...) |
| `created_at` | timestamptz DEFAULT now() | Datum kreiranja |
| `updated_at` | timestamptz DEFAULT now() | Datum poslednje izmene |

> **Napomena:** Sva polja osim `user_id` su opciona (korisnik može preskočiti tokom onboardinga).

### 5.3 Tabela: `subscriptions`

Praćenje pretplata korisnika putem Stripe-a.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK) DEFAULT gen_random_uuid() | ID pretplate |
| `user_id` | uuid NOT NULL UNIQUE (FK → profiles.id) ON DELETE CASCADE | Korisnik |
| `stripe_customer_id` | text NOT NULL | Stripe Customer ID |
| `stripe_subscription_id` | text UNIQUE | Stripe Subscription ID |
| `plan_type` | text NOT NULL | 'starter', 'pro', 'pro_plus' |
| `billing_cycle` | text NOT NULL | 'monthly' ili 'yearly' |
| `status` | text NOT NULL DEFAULT 'active' | 'active', 'canceled', 'past_due', 'incomplete' |
| `monthly_credits` | integer NOT NULL | Broj kredita mesečno po planu |
| `current_period_start` | timestamptz | Početak tekućeg perioda |
| `current_period_end` | timestamptz | Kraj tekućeg perioda |
| `cancel_at_period_end` | boolean DEFAULT false | Da li se otkazuje na kraju perioda |
| `created_at` | timestamptz DEFAULT now() | Datum kreiranja |
| `updated_at` | timestamptz DEFAULT now() | Datum poslednje izmene |

### 5.4 Tabela: `credit_transactions`

Log svih promena kredita (dodavanje, trošenje, admin korekcije).

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK) DEFAULT gen_random_uuid() | ID transakcije |
| `user_id` | uuid NOT NULL (FK → profiles.id) ON DELETE CASCADE | Korisnik |
| `amount` | integer NOT NULL | Promena (+pozitivna za dodavanje, -negativna za trošenje) |
| `type` | text NOT NULL | 'subscription_renewal', 'usage', 'admin_adjustment', 'initial_free', 'refund' |
| `description` | text | Opis transakcije |
| `generation_id` | uuid (FK → generations.id) ON DELETE SET NULL | Povezana generacija (ako je usage) |
| `created_at` | timestamptz DEFAULT now() | Datum transakcije |

### 5.5 Tabela: `generations`

Istorija svih AI generisanja.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK) DEFAULT gen_random_uuid() | ID generacije |
| `user_id` | uuid NOT NULL (FK → profiles.id) ON DELETE CASCADE | Korisnik |
| `business_id` | uuid (FK → businesses.id) ON DELETE SET NULL | Povezani biznis |
| `type` | text NOT NULL | 'text', 'image_from_prompt', 'image_from_upload' |
| `prompt` | text NOT NULL | Korisnički prompt |
| `input_image_url` | text | URL uploadovane slike (za image_from_upload) |
| `result_text` | text | Generisani tekst (za text tip) |
| `result_image_url` | text | URL generisane slike (za image tipove) |
| `credits_used` | integer NOT NULL | Broj utrošenih kredita |
| `tokens_used` | integer | Broj AI tokena (za analitiku) |
| `status` | text NOT NULL DEFAULT 'pending' | 'pending', 'completed', 'failed' |
| `error_message` | text | Poruka greške (ako je failed) |
| `ai_model` | text NOT NULL | Naziv korišćenog AI modela |
| `created_at` | timestamptz DEFAULT now() | Datum generisanja |

### 5.6 Tabela: `stripe_events`

Idempotentnost — sprečava dvostruku obradu istog Stripe eventa.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK) DEFAULT gen_random_uuid() | ID zapisa |
| `stripe_event_id` | text NOT NULL UNIQUE | Stripe Event ID |
| `event_type` | text NOT NULL | Tip eventa (invoice.paid, customer.subscription.updated...) |
| `processed` | boolean DEFAULT false | Da li je obrađen |
| `data` | jsonb | Sirovi podaci eventa |
| `created_at` | timestamptz DEFAULT now() | Datum prijema |

### 5.7 Tabela: `admin_logs`

Revizijski trag svih admin akcija.

| Kolona | Tip | Opis |
|---|---|---|
| `id` | uuid (PK) DEFAULT gen_random_uuid() | ID loga |
| `admin_id` | uuid NOT NULL (FK → profiles.id) | Admin koji je izvršio akciju |
| `action` | text NOT NULL | Opis akcije (npr. 'credit_adjustment', 'impersonate', 'user_update') |
| `target_user_id` | uuid (FK → profiles.id) | Korisnik nad kojim je izvršena akcija |
| `details` | jsonb | Dodatni detalji (stara/nova vrednost, itd.) |
| `created_at` | timestamptz DEFAULT now() | Datum akcije |

### 5.8 Dijagram Relacija

```
auth.users (Supabase)
    │
    └──→ profiles (1:1)
              │
              ├──→ businesses (1:N, ali u praksi 1:1 za sada)
              │
              ├──→ subscriptions (1:1)
              │
              ├──→ credit_transactions (1:N)
              │
              ├──→ generations (1:N)
              │         │
              │         └──← credit_transactions.generation_id
              │
              └──→ admin_logs (1:N, kao admin_id ili target_user_id)
```

---

## 6. Row-Level Security (RLS) Politike

### profiles
- SELECT: Korisnik vidi samo svoj profil (`auth.uid() = id`)
- UPDATE: Korisnik može menjati samo svoj profil (`auth.uid() = id`)
- Admin: Vidi sve profile

### businesses
- SELECT/INSERT/UPDATE/DELETE: Samo vlasnik (`auth.uid() = user_id`)
- Admin: Vidi sve biznise

### subscriptions
- SELECT: Samo vlasnik (`auth.uid() = user_id`)
- INSERT/UPDATE: Samo server (service role)
- Admin: Vidi sve pretplate

### credit_transactions
- SELECT: Samo vlasnik (`auth.uid() = user_id`)
- INSERT: Samo server (service role)
- Admin: Vidi sve transakcije

### generations
- SELECT: Samo vlasnik (`auth.uid() = user_id`)
- INSERT: Samo server (service role)
- Admin: Vidi sve generacije

### stripe_events
- Pristup: Samo server (service role)

### admin_logs
- SELECT: Samo admini
- INSERT: Samo server (service role)

---

## 7. Storage Buckets

| Bucket | Opis | Pristup |
|---|---|---|
| `uploads` | Slike koje korisnik uploaduje za AI generisanje | Privatno (samo vlasnik) |
| `generated` | AI generisane slike | Privatno (samo vlasnik) |
| `logos` | Logotipi brendova | Privatno (samo vlasnik) |
| `avatars` | Avatari korisnika | Privatno (samo vlasnik) |

**Ograničenja uploadovanja:**
- Maksimalna veličina fajla: 10 MB
- Dozvoljeni formati: jpg, jpeg, png, webp
- Imenovanje: `{user_id}/{timestamp}_{random}.{ext}`

---

## 8. API Rute

### 8.1 Autentifikacija

| Metod | Ruta | Opis |
|---|---|---|
| POST | `/api/auth/register` | Registracija (ime, email, lozinka) → kreira profil |
| POST | `/api/auth/login` | Prijava (email + lozinka) |
| POST | `/api/auth/logout` | Odjava |
| POST | `/api/auth/reset-password` | Slanje emaila za reset lozinke |
| POST | `/api/auth/update-password` | Postavljanje nove lozinke |

### 8.2 Onboarding

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/onboarding/status` | Provera da li je onboarding završen |
| POST | `/api/onboarding` | Čuvanje podataka o biznisu (svi koraci) |

### 8.3 Generisanje (AI)

Svaka ruta OBAVEZNO prati ovaj redosled:
1. Proveri da li je korisnik ulogovan
2. Proveri da li ima dovoljno kredita
3. Pozovi AI servis (retry max 3x)
4. Sačuvaj rezultat u bazu
5. Oduzmi kredite
6. Vrati rezultat

| Metod | Ruta | Krediti | AI Model | Opis |
|---|---|---|---|---|
| POST | `/api/generate/text` | 1 | GPT-5.4 | Generiši tekst za post (opciono sa slikom) |
| POST | `/api/generate/image-from-prompt` | 14 | Gemini-3-Pro-Image-Preview | Generiši sliku samo na osnovu prompta |
| POST | `/api/generate/image-from-upload` | 14 | Gemini-3-Pro-Image-Preview | Generiši sliku na osnovu uploadovane slike + prompt |

### 8.4 Krediti

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/credits` | Trenutni broj kredita korisnika |
| GET | `/api/credits/history` | Istorija transakcija kredita |

### 8.5 Stripe / Plaćanje

| Metod | Ruta | Opis |
|---|---|---|
| POST | `/api/stripe/create-checkout` | Kreiranje Stripe Checkout sesije za odabrani plan |
| POST | `/api/stripe/webhook` | Prijem i obrada Stripe webhook-ova |
| POST | `/api/stripe/create-portal` | Kreiranje Stripe Customer Portal sesije |
| GET | `/api/subscription` | Podaci o trenutnoj pretplati korisnika |

### 8.6 Biznis

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/business` | Podaci o biznisu korisnika |
| PUT | `/api/business` | Izmena podataka o biznisu |
| POST | `/api/business/logo` | Upload logotipa |

### 8.7 Istorija

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/history` | Lista svih generisanja (paginacija) |
| GET | `/api/history/[id]` | Detalji jednog generisanja |

### 8.8 Analitika

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/analytics` | Statistika korisnika (ukupno generisanja po tipu, utrošeni krediti, itd.) |

### 8.9 Podešavanja

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/settings` | Podaci profila korisnika |
| PUT | `/api/settings` | Izmena podešavanja (ime, jezik, itd.) |

### 8.10 Admin

| Metod | Ruta | Opis |
|---|---|---|
| GET | `/api/admin/users` | Lista svih korisnika (pretraga, paginacija) |
| GET | `/api/admin/users/[id]` | Detalji korisnika |
| PUT | `/api/admin/users/[id]/credits` | Ručna korekcija kredita |
| POST | `/api/admin/users/[id]/impersonate` | Prijava kao korisnik (impersonation) |
| GET | `/api/admin/stats` | Globalna statistika (korisnici, prihod, pretplate) |
| GET | `/api/admin/logs` | Lista admin akcija |

---

## 9. Monetizacija i Krediti

### 9.1 Kurs Kredita

| Funkcija | Cena u kreditima |
|---|---|
| Generisanje teksta | 1 kredit |
| Generisanje slike (prompt ili upload) | 14 kredita |

### 9.2 Krediti pri Registraciji

Novi korisnik dobija **0 kredita** pri registraciji.
Ne postoji besplatan plan — samo plaćeni planovi. Korisnik mora da se pretplati da bi dobio kredite.

### 9.3 Mesečni Planovi

| Plan | Mesečna cena | Krediti mesečno |
|---|---|---|
| **Starter** | $19.90/mesec | 800 |
| **Pro** | $39.90/mesec | 1,800 |
| **Pro+** | $59.90/mesec | 3,000 |

### 9.4 Godišnji Planovi (20% popusta)

| Plan | Godišnja cena | Krediti mesečno |
|---|---|---|
| **Starter** | $199.00/godišnje | 800 |
| **Pro** | $383.00/godišnje | 1,800 |
| **Pro+** | $575.00/godišnje | 3,000 |

### 9.5 Pravila Kredita

- Krediti se **resetuju mesečno** (neiskorišćeni krediti se gube)
- Reset se dešava na dan obnove pretplate (`current_period_start`)
- Ako korisnik **nema dovoljno kredita**, akcija se NE izvršava i prikazuje se obaveštenje
- Admin može ručno dodati/oduzeti kredite

### 9.6 Tok Plaćanja (Stripe)

```
1. Korisnik bira plan na Pricing stranici
2. Klik na "Pretplati se" → POST /api/stripe/create-checkout
3. Redirect na Stripe Checkout stranicu
4. Korisnik unosi karticu i plaća
5. Stripe šalje webhook (invoice.paid) → POST /api/stripe/webhook
6. Webhook handler:
   a. Proveri idempotentnost (stripe_events tabela)
   b. Kreiraj/ažuriraj subscription zapis
   c. Resetuj kredite korisnika na mesečni iznos plana
   d. Kreiraj credit_transaction zapis
7. Korisnik se vraća na success stranicu
```

**Stripe Webhook Eventi koje obrađujemo:**
- `checkout.session.completed` — nova pretplata
- `invoice.paid` — uspešno plaćanje (mesečna obnova)
- `invoice.payment_failed` — neuspešno plaćanje
- `customer.subscription.updated` — promena plana
- `customer.subscription.deleted` — otkazivanje pretplate

---

## 10. Stranice Aplikacije

### 10.1 Javne Stranice (bez autentifikacije)

| Stranica | Ruta | Opis |
|---|---|---|
| Landing | `/` | Prodajna stranica sa opisom, cenama, CTA |
| Prijava | `/login` | Email + lozinka |
| Registracija | `/register` | Ime, email, lozinka |
| Reset Lozinke | `/reset-password` | Unos emaila za reset |
| Nova Lozinka | `/update-password` | Postavljanje nove lozinke (iz email linka) |
| Cene | `/pricing` | Pregled planova i cena |

### 10.2 Zaštićene Stranice (zahtevaju autentifikaciju)

| Stranica | Ruta | Opis |
|---|---|---|
| Onboarding | `/onboarding` | 2-3 koraka: industrijа, podaci o brendu |
| Dashboard | `/dashboard` | Početna sa prečicama + prikaz kredita |
| Kreiraj Tekst | `/create/text` | Generisanje teksta za društvene mreže |
| Kreiraj Sliku | `/create/image` | Generisanje slike iz prompta |
| Kreiraj Post | `/create/image-from-upload` | Generisanje slike na osnovu upload-a |
| Istorija | `/history` | Lista svih prethodnih generisanja |
| Detalji | `/history/[id]` | Detalji jednog generisanja |
| Analitika | `/analytics` | Statistika korišćenja |
| Podešavanja | `/settings` | Izmena ličnih podataka |
| Pretplata | `/settings/subscription` | Upravljanje pretplatom |
| Brend | `/settings/brand` | Podaci o brendu |

### 10.3 Admin Stranice (zahtevaju admin ulogu)

| Stranica | Ruta | Opis |
|---|---|---|
| Admin Dashboard | `/admin` | Pregled statistika |
| Korisnici | `/admin/users` | Lista korisnika sa pretragom |
| Detalji Korisnika | `/admin/users/[id]` | Upravljanje korisnikom |
| Admin Logovi | `/admin/logs` | Istorija admin akcija |

---

## 11. Stanja Svake Stranice

Svaka frontend stranica MORA imati sva 4 stanja:

1. **Loading** — Skeleton ili spinner dok se podaci učitavaju
2. **Success** — Prikazani podaci / uspešna akcija
3. **Error** — Razumljiva poruka greške (nikad prazna stranica)
4. **Empty** — Poruka kada nema podataka (npr. "Još niste generisali sadržaj")

---

## 12. Middleware i Zaštita Ruta

```
Middleware logika:

1. Javne rute (/, /login, /register, /reset-password, /pricing) → propusti
2. Sve ostale rute → proveri auth token
   a. Nema tokena → redirect na /login
   b. Token validan:
      - Ako je /onboarding → propusti
      - Ako onboarding NIJE završen → redirect na /onboarding
      - Ako je /admin/* ruta → proveri role === 'admin', inače 403
      - Inače → propusti
```

---

## 13. Rate Limiting

Implementacija u memoriji (ili Upstash Redis za produkciju):

| Akcija | Limit |
|---|---|
| Generisanje teksta | 20 zahteva / minut po korisniku |
| Generisanje slike | 5 zahteva / minut po korisniku |
| Login pokušaji | 5 pokušaja / minut po IP-u |
| API pozivi (generalno) | 60 zahteva / minut po korisniku |

---

## 14. Error Handling i Edge Case-ovi

### 14.1 AI Servis
- **Retry logika:** Ako AI servis ne odgovori → pokušaj ponovo, max 3 puta sa exponential backoff (1s, 2s, 4s)
- **Fallback:** Ako posle 3 pokušaja ne uspe → NE oduzimaj kredite, vrati razumljivu poruku greške
- **Timeout:** Maksimalno vreme čekanja odgovora: 60 sekundi

### 14.2 Korisničke Akcije
- **Dupli klik:** Disable dugme nakon klika, re-enable po završetku
- **Prevelik fajl:** Maksimalno 10 MB, poruka greške pre upload-a
- **Pogrešan format:** Samo jpg, jpeg, png, webp, validacija na frontendu i backendu
- **Prazan prompt:** Validacija da prompt ima min 3 karaktera
- **Nedovoljno kredita:** Jasna poruka sa linkom ka pricing stranici

### 14.3 Plaćanje
- **Idempotentnost webhook-a:** Svaki Stripe event se obradi samo jednom (stripe_events tabela)
- **Neuspelo plaćanje:** Status pretplate se menja na 'past_due', korisnik dobija obaveštenje
- **Dvostruka pretplata:** Sprečena UNIQUE constraint na user_id u subscriptions tabeli

### 14.4 Autentifikacija
- **Istekla sesija:** Automatski redirect na login sa porukom
- **Neovlašćen pristup:** 403 stranica sa porukom
- **Nevalidni podaci:** Validacija svih polja (email format, lozinka min 8 karaktera, itd.)

---

## 15. Struktura Projekta

```
cosmetic-ai/
├── .env.local                          # Lokalne env varijable (NE commitovati)
├── .env.example                        # Primer env varijabli
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                        # Auth + route protection middleware
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Sve tabele, RLS, funkcije
│
├── public/
│   └── images/                         # Statičke slike (logo, ikone)
│
└── src/
    ├── app/
    │   ├── layout.tsx                  # Root layout
    │   ├── page.tsx                    # Landing stranica
    │   │
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── reset-password/page.tsx
    │   │   └── update-password/page.tsx
    │   │
    │   ├── (protected)/
    │   │   ├── layout.tsx              # Layout sa sidebarom
    │   │   ├── onboarding/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── create/
    │   │   │   ├── text/page.tsx
    │   │   │   ├── image/page.tsx
    │   │   │   └── image-from-upload/page.tsx
    │   │   ├── history/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── analytics/page.tsx
    │   │   └── settings/
    │   │       ├── page.tsx
    │   │       ├── subscription/page.tsx
    │   │       └── brand/page.tsx
    │   │
    │   ├── (admin)/
    │   │   └── admin/
    │   │       ├── page.tsx
    │   │       ├── users/
    │   │       │   ├── page.tsx
    │   │       │   └── [id]/page.tsx
    │   │       └── logs/page.tsx
    │   │
    │   └── api/
    │       ├── auth/
    │       │   ├── register/route.ts
    │       │   ├── login/route.ts
    │       │   ├── logout/route.ts
    │       │   ├── reset-password/route.ts
    │       │   └── update-password/route.ts
    │       ├── onboarding/
    │       │   ├── route.ts
    │       │   └── status/route.ts
    │       ├── generate/
    │       │   ├── text/route.ts
    │       │   ├── image-from-prompt/route.ts
    │       │   └── image-from-upload/route.ts
    │       ├── credits/
    │       │   ├── route.ts
    │       │   └── history/route.ts
    │       ├── stripe/
    │       │   ├── create-checkout/route.ts
    │       │   ├── webhook/route.ts
    │       │   └── create-portal/route.ts
    │       ├── subscription/route.ts
    │       ├── business/
    │       │   ├── route.ts
    │       │   └── logo/route.ts
    │       ├── history/
    │       │   ├── route.ts
    │       │   └── [id]/route.ts
    │       ├── analytics/route.ts
    │       ├── settings/route.ts
    │       └── admin/
    │           ├── users/
    │           │   ├── route.ts
    │           │   └── [id]/
    │           │       ├── route.ts
    │           │       ├── credits/route.ts
    │           │       └── impersonate/route.ts
    │           ├── stats/route.ts
    │           └── logs/route.ts
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts               # Browser Supabase klijent
    │   │   ├── server.ts               # Server-side Supabase klijent
    │   │   └── admin.ts                # Admin (service_role) klijent
    │   ├── stripe.ts                   # Stripe konfiguracija
    │   ├── openai.ts                   # OpenAI (GPT-5.4) klijent
    │   ├── gemini.ts                   # Google Gemini klijent
    │   ├── credits.ts                  # Logika za kredite (provera, oduzimanje)
    │   ├── rate-limit.ts               # Rate limiting implementacija
    │   ├── validation.ts               # Validacija ulaznih podataka
    │   └── i18n/
    │       ├── index.ts                # Helper funkcije za prevode
    │       ├── sr.ts                   # Srpski prevodi
    │       ├── hr.ts                   # Hrvatski prevodi
    │       └── en.ts                   # Engleski prevodi
    │
    ├── hooks/
    │   ├── useUser.ts                  # Hook za korisničke podatke
    │   ├── useCredits.ts               # Hook za kredite
    │   ├── useSubscription.ts          # Hook za pretplatu
    │   └── useBusiness.ts              # Hook za podatke o biznisu
    │
    ├── components/
    │   ├── ui/                         # Reusable UI komponente (Button, Input, Card, Modal...)
    │   ├── layout/                     # Layout komponente (Sidebar, Header, Footer)
    │   └── forms/                      # Form komponente
    │
    ├── types/
    │   ├── database.ts                 # TypeScript tipovi za bazu
    │   ├── api.ts                      # Tipovi za API request/response
    │   └── stripe.ts                   # Tipovi za Stripe
    │
    └── config/
        ├── plans.ts                    # Definicija planova i cena
        └── credits.ts                  # Konfiguracija kredita
```

---

## 16. Environment Varijable

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_YEARLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_PRO_PLUS_MONTHLY=
STRIPE_PRICE_PRO_PLUS_YEARLY=

# OpenAI
OPENAI_API_KEY=

# Google Gemini
GOOGLE_GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

---

## 17. Faze Razvoja

### Trenutno stanje (Mart 2026)

| Faza | Status | Napomena |
|------|--------|----------|
| **1** Plan i arhitektura | ✅ Završeno | `plan.md` |
| **2** Setup projekta | ✅ Završeno | Next.js 16, Git, dependency-ji |
| **3** Baza podataka | ✅ Završeno | Migracija pokrenuta u Supabase SQL Editor-u |
| **4** Autentifikacija | ✅ Završeno | Login, register, reset, onboarding, dashboard, middleware |
| **5** Glavne funkcije (backend AI) | ⏳ **Sledeća** | API rute za tekst i slike |
| **6–11** | ⏳ U planu | — |

**Sledeća faza:** **Faza 5** — implementacija `POST /api/generate/*` ruta (OpenAI + Gemini), krediti, čuvanje u `generations`, Storage za upload.

**Admin nalog:** još nije seed-ovan. Uloga `admin` u `profiles` se može ručno postaviti u Supabase (SQL) ili kroz Admin panel u Fazi 8. Middleware već štiti `/admin` rute.

---

### Faza 1: Plan i Arhitektura ✅ (OVAJ DOKUMENT)
- [x] Kompletna arhitektura aplikacije
- [x] Definisane sve tabele sa kolonama i relacijama
- [x] Definisane bezbednosne politike (RLS)
- [x] Definisane sve API rute
- [x] Definisana struktura projekta
- [x] Uključene tabele za plaćanje
- [x] Definisani edge case-ovi

### Faza 2: Setup Projekta ✅
- [x] Inicijalizacija Next.js projekta sa TypeScript-om
- [x] Instalacija svih dependency-ja
- [x] Konfiguracija Tailwind CSS-a
- [x] Kreiranje strukture foldera
- [x] Kreiranje .env.example
- [x] Inicijalizacija Git repozitorijuma (Git instaliran, prvi commit)
- [x] Lib sloj: Supabase klijenti, Stripe/OpenAI/Gemini stubovi, krediti, rate-limit, validacija, i18n (sr/hr/en)

### Faza 3: Baza Podataka ✅
- [x] SQL migracija za sve tabele (`supabase/migrations/001_initial_schema.sql` — pokrenuta u Dashboard-u)
- [x] RLS politike za svaku tabelu
- [x] Storage bucket-i (uploads, generated, logos, avatars) + politike u migraciji
- [x] Trigger za automatski updated_at
- [x] Trigger za kreiranje profila pri registraciji (0 kredita, bez `initial_free` transakcije)
- [ ] Seed admin korisnika (ručno: `UPDATE profiles SET role = 'admin' WHERE email = '...'` ili u Fazi 8)
- [x] Supabase setup: URL + anon + service_role u `.env.local`; email potvrda isključena za dev test

### Faza 4: Autentifikacija ✅
- [x] Supabase Auth setup (server + client + `@supabase/ssr`)
- [x] Registracija → kreiranje profila preko DB triggera (0 kredita)
- [x] Login (email + lozinka)
- [x] Logout (dashboard dugme)
- [x] Reset lozinke (email link → `/update-password`)
- [x] Middleware za zaštitu ruta + osvežavanje sesije
- [x] Role-based pristup (`/admin/*` samo za `role = admin`; nema seed admina dok ga ne dodaš)
- [x] Redirect logika (neautentifikovan → login, bez onboardinga → onboarding)
- [x] Onboarding UI (3 koraka) + upis u `businesses` + `onboarding_completed`
- [x] Dashboard (osnovni): krediti, prečice, link ka planovima, odjava
- [x] Ispravljen `NEXT_PUBLIC_SUPABASE_URL` (mora biti `https://<ref>.supabase.co`, ne JWT)

### Faza 5: Glavne Funkcije — Samo Backend
- [ ] POST /api/generate/text (OpenAI GPT-5.4)
- [ ] POST /api/generate/image-from-prompt (Gemini-3-Pro-Image-Preview)
- [ ] POST /api/generate/image-from-upload (Gemini-3-Pro-Image-Preview)
- [ ] Provera autentifikacije u svakoj ruti
- [ ] Provera kredita pre generisanja
- [ ] Čuvanje rezultata u bazu (generations tabela)
- [ ] Oduzimanje kredita posle uspešnog generisanja
- [ ] Retry logika (max 3 pokušaja)
- [ ] Fallback poruke pri greški AI servisa
- [ ] Upload fajlova u Supabase Storage

### Faza 6: Error Handling i Edge Case-ovi
- [ ] Rate limiting na svim generisanje rutama
- [ ] Validacija ulaznih podataka (prompt, fajl veličina, format)
- [ ] Zaštita od duplog klika
- [ ] Obuhvatne poruke grešaka na sva 3 jezika
- [ ] Fallback za AI servis kvarove
- [ ] Timeout zaštita (60s)
- [ ] Validacija na frontendu i backendu

### Faza 7: Plaćanje (Stripe)
- [ ] Kreiranje Stripe proizvoda i cena (6 price-ova: 3 plana × 2 ciklusa)
- [ ] POST /api/stripe/create-checkout
- [ ] POST /api/stripe/webhook (idempotentna obrada)
- [ ] POST /api/stripe/create-portal
- [ ] Obrada webhook evenata (invoice.paid, subscription.updated, itd.)
- [ ] Mesečni reset kredita pri obnovi pretplate
- [ ] Upravljanje statusima pretplate
- [ ] Success/cancel redirect stranice

### Faza 8: Admin Panel — Samo Funkcionalnost
- [ ] GET /api/admin/users (lista + pretraga)
- [ ] GET /api/admin/users/[id] (detalji)
- [ ] PUT /api/admin/users/[id]/credits (korekcija kredita)
- [ ] POST /api/admin/users/[id]/impersonate (prijava kao korisnik)
- [ ] GET /api/admin/stats (globalna statistika)
- [ ] GET /api/admin/logs (logovi admin akcija)
- [ ] Logovanje svake admin akcije

### Faza 9: Frontend Dizajn (delimično — funkcionalno pre finalnog dizajna)
- [x] Landing stranica (osnovni CTA: registruj / prijavi / cene — nije finalni prodajni dizajn)
- [x] Auth stranice (login, register, reset, update-password) — funkcionalno, minimalistički
- [x] Onboarding (višekoračni) — funkcionalno
- [x] Dashboard sa prečicama i prikazom kredita — osnovni layout
- [ ] Stranice za generisanje (trenutno placeholder stranice — dolazi posle Faze 5)
- [ ] Istorija generisanja
- [ ] Analitika
- [ ] Podešavanja (profil, brend, pretplata)
- [ ] Pricing stranica/modal
- [ ] Admin stranice (dashboard, korisnici, logovi)
- [ ] i18n u UI (rečnici `sr` / `hr` / `en` već postoje u `src/lib/i18n/`)
- [ ] Responsive: potpuna provera svih ekrana (osnovni Tailwind na auth/onboarding/dashboard)
- [ ] Loading / Success / Error / Empty stanja na svakoj stranici (strogo po planu)
- [x] Toast: `sonner` u root `layout.tsx` (spremno za upotrebu u formama)
- [ ] Finalni minimalistički vizuelni polish (sivo-belo, crno-plavo) kao na prototipu

### Faza 10: Testiranje
- [x] Ručno: registracija → onboarding → dashboard → odjava (potvrđeno, mart 2026)
- [ ] Kompletan tok: registracija → onboarding → generisanje → plaćanje
- [ ] Edge case testovi (nedovoljno kredita, prevelik fajl, itd.)
- [ ] Stripe webhook testiranje (idempotentnost, razni eventi)
- [ ] Multi-language testiranje
- [ ] Responsive testiranje
- [ ] Admin funkcionalnosti testiranje

### Faza 11: Deploy
- [ ] Vercel setup
- [ ] Environment varijable u Vercel-u
- [ ] Konfiguracija domena
- [ ] Produkciona Supabase baza (odvojena od dev)
- [ ] Produkcioni Stripe ključevi (odvojeni od dev)
- [ ] Finalno testiranje na produkciji

---

## 18. Ključne Napomene

1. **Backend prvo, frontend poslednji** — Sve mora da radi iznutra pre nego što se pravi lep dizajn
2. **Jedna faza, pa potvrda** — Svaka faza se završi, testira, potvrdi, pa se ide na sledeću
3. **Nikad prazna stranica** — Uvek razumljiva poruka korisniku
4. **DEV i PROD odvojeni** — Različite baze, različiti ključevi
5. **AI modeli se NE menjaju** — GPT-5.4 za tekst, Gemini-3-Pro-Image-Preview za slike
6. **Krediti se resetuju mesečno** — Neiskorišćeni se gube
7. **Nema besplatnog plana** — Samo plaćeni planovi, bez besplatnih kredita
