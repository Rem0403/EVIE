// "Start here" guide: programs and groups to ask about at each stage. US-wide; names vary by state.
// Every claim was checked on 2026-09-28 against the linked source (or the source noted beside it).
// Keep it to what the sources say; this is a map to real help, not legal or medical advice.

export const GUIDE_NOTE =
  'US programs. Names and rules vary by state, so ask each program what applies to you. This is general information, not legal, financial or medical advice.';

export const GUIDE = [
  {
    id: 'diagnosed',
    title: 'Just diagnosed',
    items: [
      {
        id: 'early_intervention',
        name: 'Early intervention (under age 3)',
        text: 'Help for babies and toddlers who have a developmental delay or a condition likely to cause one. It comes from federal special-education law, and each state runs its own program.',
        url: 'https://ectacenter.org/contact/ptccoord.asp', // 20 U.S.C. § 1432; ECTA list of state contacts
        category: 'services',
      },
      {
        id: 'waiver',
        name: 'Medicaid waiver programs',
        text: 'State programs that can pay for care at home, such as personal care, respite and support coordination, for people with autism, epilepsy and other disabilities. Places are capped, and most states have waiting lists. People with developmental disabilities waited about 4 years on average in 2023, so ask how to get on the list early.',
        url: 'https://www.medicaid.gov/', // medicaid.gov 1915(c) page; KFF waiting lists 2016–2023
        category: 'services',
      },
      {
        id: 'dd_agency',
        name: 'Your state’s developmental disabilities agency',
        text: 'The state office for developmental disability services. Find yours by state, with its phone number.',
        url: 'https://www.nasddds.org/state-agencies/',
        category: 'services',
      },
      {
        id: 'parent_center',
        name: 'Parent Training and Information Center',
        text: 'Nearly 100 centers across the US and territories help families of children and young people with disabilities, from birth to 26, take part in their education.',
        url: 'https://www.parentcenterhub.org/find-your-center/',
        category: 'parent',
      },
      {
        id: 'call_211',
        name: 'Call or text 211',
        text: 'Connects you with local services, including caregiver resources and mental health support. More than 200 local 211 agencies cover the US.',
        url: 'https://www.211.org/',
        category: 'services',
      },
    ],
  },
  {
    id: 'school',
    title: 'School years',
    items: [
      {
        id: 'iep',
        name: 'Special-education evaluation and IEP',
        text: 'You can ask the school to evaluate your child for special education. If they qualify, an Individualized Education Program (IEP) sets out their goals and services. Your parent center can help you prepare.',
        url: 'https://www.parentcenterhub.org/find-your-center/', // 34 CFR 300.301(b): a parent may request an initial evaluation
        category: 'school',
      },
      {
        id: 'transition_plan',
        name: 'Transition plan by age 16',
        text: 'The IEP must include goals for life after school, and the services to reach them, starting no later than the first IEP in effect when your child turns 16 (earlier if the team agrees). At least a year before the age of majority, it must also say which rights will pass to your child.',
        url: 'https://www.law.cornell.edu/cfr/text/34/300.320',
        category: 'school',
      },
    ],
  },
  {
    id: 'adult',
    title: 'Turning 18 and adult life',
    items: [
      {
        id: 'vr',
        name: 'Vocational rehabilitation',
        text: 'State agencies that help people with disabilities prepare for and get a job, including supported employment. Students with disabilities may also get pre-employment transition services.',
        url: 'https://rsa.ed.gov/about/states',
        category: 'jobs',
      },
      {
        id: 'ssi_18',
        name: 'SSI at 18',
        text: 'If they get SSI (Supplemental Security Income) as a child, Social Security reviews their eligibility again at 18, using the rules for adults.',
        url: 'https://www.ssa.gov/', // 20 CFR 416.987
        category: 'legal',
      },
      {
        id: 'decisions',
        name: 'Decision-making after 18',
        text: 'At the age of majority (18 in most states) your child makes their own legal decisions. If they need help, options range from supported decision-making, where they decide with a team they choose, to guardianship, where a court appoints someone to decide for them. Plan before they turn 18.',
        url: 'https://supporteddecisions.org/about-supported-decision-making/',
        category: 'legal',
      },
      {
        id: 'able',
        name: 'ABLE savings account',
        text: 'Lets people whose disability began before age 46 save money without losing benefits. Up to $100,000 doesn’t count against SSI, and it doesn’t affect Medicaid.',
        url: 'https://www.ablenrc.org/',
        category: 'legal',
      },
      {
        id: 'protection_advocacy',
        name: 'Protection and Advocacy agency',
        text: 'Every state and territory has one. They give legal advocacy for problems with school, work, community living and more.',
        url: 'https://www.ndrn.org/about/ndrn-member-agencies/',
        category: 'legal',
      },
    ],
  },
  {
    id: 'support',
    title: 'Friends and support',
    items: [
      {
        id: 'parent_to_parent',
        name: 'Parent to Parent',
        text: 'Connects you with parent support near you, so you aren’t figuring this out alone.',
        url: 'https://www.p2pusa.org/',
        category: 'parent',
      },
      {
        id: 'autism_society',
        name: 'Autism Society local affiliates',
        text: 'Local support groups, education and events in many states.',
        url: 'https://autismsociety.org/local-support/',
        category: 'community',
      },
      {
        id: 'the_arc',
        name: 'The Arc',
        text: 'A national organization for people with intellectual and developmental disabilities, with local chapters.',
        url: 'https://thearc.org/',
        category: 'community',
      },
      {
        id: 'epilepsy_foundation',
        name: 'Epilepsy Foundation',
        text: 'Information and support for people with epilepsy and their families.',
        url: 'https://www.epilepsy.com/',
        category: 'medical',
      },
      {
        id: 'special_olympics',
        name: 'Special Olympics',
        text: 'Sports, and the friendships that come with them, for people with intellectual disabilities.',
        url: 'https://www.specialolympics.org/',
        category: 'community',
      },
      {
        id: 'social_groups',
        name: 'Social groups near you',
        text: 'Ask your parent center, school or local Autism Society about friendship and social groups for people with disabilities.',
        category: 'community',
      },
    ],
  },
];
