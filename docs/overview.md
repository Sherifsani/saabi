# Overview

The goal of this idea is to meet three targets:

1. Distributed payment systems for informal traders with zero install.

2. Service discovery in an instant, powered by natural language processing.

3. A state-wide dashboard where institutions like the Internal Revenue Service can view trader activity, cashflow, search frequencies, heat maps, timeseries data and more.

## Distributed Payments

### Plan

We intend to use WhatsApp as our primary communication interface. A registered and authorized user may initiate payments via the automated WhatsApp messenger bot.

All payments must be initiated from the user's registered phone number. Before any payment may be completed, the user is presented with a summary the recipient's details then prompted for their Access Confirmation Code.

Once valid, the backend runs its own internal fraud prevention protocols which may proceed to either reject or approve the transaction.

Finally, the user is presented with details of the transaction and any further instructions.

### Flow

1. A user registers with their mobile phone number, full name, BVN, geo-location, and any further necessary information.

2. A One Time Passcode (OTP) is sent to the user as phone number proof of ownership.

3. The API verifies that their bank details are valid and match what was provided.

4. Once verified, the API creates a squad virtual account wallet for this user. They are directed to create a Payment Confirmation Token which is used for payment confirmation.

5. For the demo/mvp, they are also provided with the Twillio join code and phone number.

6. Payment requests are initiated on WhatsApp. The user converses in natural language such as "send 2500 naira to 8112233445 GTBank".

7. Our models parse this intent to ensure that the message makes sense. However, we use regex for account number and amount.

8. Then our API runs sanity checks such as account balance checks, account number checks using Squad's API, then returns a structured response of the recipients details, prompting the user for a confirmation code.

9. Any message which isn't a valid Payment Confirmation Code after 10 minutes automatically cancels the transaction.

10. Once a payment has been completed or denied, the bot responds appropriately with the transaction status.

## Service Discovery

### Method

Service discovery is the second pillar our solution addresses. We intend to make it easy for informal traders or service workers to be discovered by potential clients.

For instance, say you were looking for hair dressers near you. The application uses Artificial Intelligence to match against our user base of skilled workers who fit the description and are available to work in the area. In this way, our service connects workers and employers seamlessly.

### Process

1. On the same web application, users can register as service providers. They provide personally identifiable information such as their email address, phone number, full names, geo-location, service rate etc.

2. In the future, we plan to have a verification period for any service worker.

3. On WhatsApp, a user may request for workers or traders in Natural Language such as "I'm looking for a generator repair person around Yaba".

4. Our models parse this intent, then search our worker database for description that fit this description.

5. Once successful matches are found, the API responds with likely candidates who have high credibility ratings.

6. From there onward, the user may decide to contact any of the listed profiles.

## State-wide Activity Network

### Approach

The State-wide Activity Network is a separate web application distinct from both the WhatsApp interface and the registration portal that exposes aggregated platform activity to authorised institutional consumers. The intended consumers are State Internal Revenue Services (such as the Lagos State Internal Revenue Service) etc.

Each institution sees the data through views relevant to its mandate: a tax authority sees cashflow by Local Government Area, a commerce ministry sees sector concentration, a labour ministry sees supply and demand for skilled work, and the central bank sees inclusion metrics.

The network is strictly aggregative. Individual trader transactions, identities, and locations are never exposed to institutional consumers. Every visualisation enforces a minimum cohort size of five distinct contributing users before any figure is rendered; below that threshold, the cell is suppressed.

This is both an ethical requirement and a precondition for institutional partnership, given the obligations imposed on government data handlers under the Nigeria Data Protection Act 2023.

### Procedure

1. Every event on the platform including user registrations, completed transactions, discovery queries, provider contacts, and ratings, is logged with a structured schema including Local Government Area, sector category (where applicable), timestamp, and a hashed user identifier that cannot be reversed to a phone number or BVN.

2. A background job rolls these events into time-bucketed aggregates (hourly, daily, weekly) sliced by LGA, state, sector, and user role. Aggregates are stored separately from operational transaction data, and raw event data is never directly queryable by institutional tenants.

3. Authorised institutional users access the network through a dedicated web dashboard, authenticated and scoped to their jurisdiction. A state revenue officer sees data only for their state; a federal user sees national rollups.

4. The dashboard presents five primary views:
   - **Cashflow Heatmap**: a geographic map of the state shaded by transaction volume per Local Government Area over a selected time window.
   - **Sector Activity**: a breakdown of discovery search volume, registered provider count, and transaction value (where the recipient is a registered provider) by service category.
   - **Time Series**: daily and weekly trend lines for total transaction volume, new registrations, and search query volume.
   - **Demand and Supply Index**: for each service category in each LGA, the ratio of discovery searches to registered providers, surfacing underserved sectors and geographies.
   - **Inclusion Metrics**: count and growth rate of newly registered traders by LGA, share of registered users transacting weekly, and median transaction size.

5. Each view enforces the minimum cohort policy at query time. If a slice contains fewer than five distinct contributing users, the cell is suppressed and the dashboard displays "insufficient data" rather than the underlying figure.

6. Institutional tenants may export aggregated views as CSV or PDF for incorporation into their own reporting. Raw event data cannot be exported under any circumstance.

7. The minimum temporal granularity of all visualisations is the hourly aggregate; most views default to daily. The dashboard does not provide real-time individual transaction streams.

8. For the demonstration, the dashboard runs against a seeded dataset of approximately 200 transactions, 80 discovery queries, and 50 registered providers distributed across five Local Government Areas of Lagos State, sized to populate every view with defensible activity.
