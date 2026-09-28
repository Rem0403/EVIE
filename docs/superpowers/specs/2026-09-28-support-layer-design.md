# EVIE: Support layer

**Date:** 2026-09-28
**Author:** Remy Jacob

## 1. Why

A parent interview (2026-09-28) described needs beyond daily care: *"They tell you that your child is handicapped then provide you with no support… you are just thrown into the deep end."* They talked about finding services (a caregiver paid for with public funding), education for parents, social groups for friendship, and the lack of jobs for autistic young adults.

We decided to extend EVIE rather than pivot. EVIE stays the family's coordination hub, and now also coordinates the services and groups around the person.

## 2. Features

**Our resources.** A list shared across the circle, stored at `circles/{id}/resources`.
- Fields: `name`, `category`, `status`, `phone`, `url`, `email`, `nextStep`, `nextDate` (local `YYYY-MM-DD`), `note`, `createdBy`, `createdByName`, `updatedAt`, `updatedByName`.
- Categories: services & funding, medical & therapy, school, friends & community, jobs & adult life, money & legal, parent support, other.
- Statuses: want to try, applied or waitlisted, using now, not a fit.
- Ordering: follow-ups first, then by status, then by name.
- Links: only `http`/`https` URLs are stored, so a saved link can never run code.
- Any member may add, edit or remove a resource. `createdBy` must be the writer and can't change.

**Follow up card** on the timeline for next steps due today or overdue.

**Start here guide** (`src/lib/supportGuide.js`), grouped by stage: just diagnosed, school years, turning 18 and adult life, friends and support. Each item has **Save to our resources**, which pre-fills the form.

## 3. Sources for the guide (checked 2026-09-28)

| Claim | Source |
|---|---|
| Early intervention is for under-3s with a delay or a condition likely to cause one | 20 U.S.C. § 1432; ECTA Part C coordinators list |
| HCBS waivers cover personal care, respite and case management for autism, epilepsy and more; states cap enrollment | medicaid.gov, 1915(c) page |
| Waiting lists in 38 states; average wait of 50 months for I/DD (2023) | KFF, waiting lists 2016–2023 |
| Nearly 100 parent centers, birth to 26 | parentcenterhub.org |
| 211: more than 200 local agencies; call, text or chat | 211.org |
| A parent may request an initial special-education evaluation | 34 CFR 300.301(b) |
| Transition plan in the IEP by 16; rights-transfer notice a year before the age of majority | 34 CFR 300.320(b)–(c) |
| VR helps with employment, including supported employment; Pre-ETS for students | rsa.ed.gov |
| SSI is redetermined at 18 under the adult rules | 20 CFR 416.987 |
| Supported decision-making as an alternative to guardianship | supporteddecisions.org |
| ABLE: onset before 46; up to $100,000 excluded for SSI; no effect on Medicaid | ablenrc.org |
| A P&A agency in every state and territory | ndrn.org |
| State developmental disabilities agency directory | nasddds.org |

Links to sites that block automated checks (ssa.gov, medicaid.gov, thearc.org, epilepsy.com) point to the home page.

## 4. Out of scope

- A built-in local directory (goes stale; 211 and state agencies do this).
- Social matching or a job board (needs moderation and safety work).
- Real names from the interview.
