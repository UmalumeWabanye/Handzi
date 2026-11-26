// Demo content for `npm run seed:demo`. Everything here is fictional.
// Places are real South African suburbs ([longitude, latitude]); most are in Cape Town.

const PLACES = {
  khayelitsha: { coordinates: [18.6857, -34.0494], suburb: 'Mandela Park', city: 'Khayelitsha', province: 'Western Cape' },
  mitchellsPlain: { coordinates: [18.617, -34.048], suburb: 'Westridge', city: 'Mitchells Plain', province: 'Western Cape' },
  gugulethu: { coordinates: [18.573, -33.979], suburb: 'Gugulethu', city: 'Cape Town', province: 'Western Cape' },
  bellville: { coordinates: [18.629, -33.9], suburb: 'Bellville', city: 'Cape Town', province: 'Western Cape' },
  somersetWest: { coordinates: [18.843, -34.084], suburb: 'Somerset West', city: 'Cape Town', province: 'Western Cape' },
  claremont: { coordinates: [18.465, -33.98], suburb: 'Claremont', city: 'Cape Town', province: 'Western Cape' },
  cbd: { coordinates: [18.4241, -33.9249], suburb: 'City Bowl', city: 'Cape Town', province: 'Western Cape' },
  strand: { coordinates: [18.827, -34.115], suburb: 'Strand', city: 'Cape Town', province: 'Western Cape' },
  delft: { coordinates: [18.644, -33.967], suburb: 'Delft', city: 'Cape Town', province: 'Western Cape' },
  soweto: { coordinates: [27.8546, -26.2485], suburb: 'Orlando West', city: 'Soweto', province: 'Gauteng' },
  randburg: { coordinates: [27.994, -26.094], suburb: 'Randburg', city: 'Johannesburg', province: 'Gauteng' },
  sandton: { coordinates: [28.0567, -26.1076], suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng' },
  centurion: { coordinates: [28.1881, -25.8603], suburb: 'Centurion', city: 'Pretoria', province: 'Gauteng' },
  mamelodi: { coordinates: [28.394, -25.718], suburb: 'Mamelodi', city: 'Pretoria', province: 'Gauteng' },
  umlazi: { coordinates: [30.88, -29.97], suburb: 'Umlazi', city: 'Durban', province: 'KwaZulu-Natal' },
  glenwood: { coordinates: [30.99, -29.877], suburb: 'Glenwood', city: 'Durban', province: 'KwaZulu-Natal' },
};

// key, first, last, place, trades (category slugs), headline, years, rate, callOut, radius, verification, languages, bio, skills, work, portfolio, certs
const HANDYMEN = [
  {
    key: 'sipho', firstName: 'Sipho', lastName: 'Ndlovu', place: 'khayelitsha', trades: ['plumbing'],
    headline: 'Plumber · geysers, leaks and drains', years: 12, rate: 380, callOut: 250, radius: 40, verification: 'verified',
    languages: ['isiXhosa', 'English', 'Afrikaans'], skills: ['Geysers', 'Leaks & burst pipes', 'Drains & blockages', 'Solar geysers'],
    bio: "I've been fixing geysers and leaks across the Cape Flats for twelve years. I explain what's wrong before I start, quote a fixed price and leave your place clean.",
    work: [
      { title: 'Plumber', company: 'Ndlovu Plumbing', employmentType: 'self_employed', location: 'Khayelitsha', start: '2016-03', current: true, description: 'Geyser installs and repairs, burst pipes and blocked drains for homes in the southern suburbs and Cape Flats.' },
      { title: 'Apprentice plumber', company: 'Cape Plumbing Co.', employmentType: 'apprenticeship', location: 'Bellville', start: '2012-01', end: '2016-02' },
    ],
    portfolio: [
      { title: '150 L geyser replacement in Mandela Park', photos: ['geyser-before', 'geyser-after'], category: 'plumbing', months: 2, location: 'Khayelitsha', description: 'Old geyser burst into the ceiling. Replaced it with a 150 L unit, new drip tray and vacuum breakers, and got the COC sorted.' },
      { title: 'Burst pipe under the kitchen', photos: ['pipe-repair'], category: 'plumbing', months: 6, location: 'Gugulethu' },
    ],
    certs: [{ name: 'PIRB Licensed Plumber', issuer: 'PIRB', number: 'L-DEMO-1024', issued: '2017-05', verified: true }],
  },
  {
    key: 'thandiwe', firstName: 'Thandiwe', lastName: 'Mahlangu', place: 'mitchellsPlain', trades: ['electrical'],
    headline: 'Electrician · COC certificates and DB boards', years: 9, rate: 420, callOut: 300, radius: 35, verification: 'verified',
    languages: ['English', 'isiZulu', 'Afrikaans'], skills: ['COC certificates', 'DB boards', 'Faults & trips', 'Lights & plugs'],
    bio: 'Registered electrician doing compliance certificates, DB board upgrades and fault finding. I test everything twice and give you the paperwork you need for a sale.',
    work: [
      { title: 'Electrician', company: 'Self-employed', employmentType: 'self_employed', location: 'Mitchells Plain', start: '2019-06', current: true },
      { title: 'Electrician', company: 'Lumen Electrical (Pty) Ltd', employmentType: 'employed', location: 'Cape Town', start: '2015-02', end: '2019-05', description: 'Commercial and residential installations, maintenance contracts.' },
    ],
    portfolio: [
      { title: 'DB board upgrade with earth leakage', photos: ['db-board'], category: 'electrical', months: 1, location: 'Mitchells Plain' },
      { title: 'LED downlights in an open-plan lounge', photos: ['lights'], category: 'electrical', months: 4, location: 'Strandfontein' },
    ],
    certs: [{ name: "Wireman's Licence (Installation Electrician)", issuer: 'Department of Employment and Labour', number: 'IE-DEMO-5521', issued: '2016-08', verified: true }],
  },
  {
    key: 'johan', firstName: 'Johan', lastName: 'van der Merwe', place: 'bellville', trades: ['roofing'],
    headline: 'Roofer · waterproofing and gutters', years: 20, rate: 350, callOut: 0, radius: 50, verification: 'verified',
    languages: ['Afrikaans', 'English'], skills: ['Leak repairs', 'Waterproofing', 'Gutters', 'Tiles & sheeting'],
    bio: "Twenty years on roofs from Durbanville to Kuils River. I'll find the actual leak, not just paint over it, and every waterproofing job comes with a written guarantee.",
    work: [{ title: 'Owner', company: 'Dak Doctor Roofing', employmentType: 'self_employed', location: 'Bellville', start: '2005-01', current: true }],
    portfolio: [
      { title: 'IBR roof waterproofed before winter', photos: ['roof-before', 'roof-after'], category: 'roofing', months: 3, location: 'Parow' },
      { title: 'Seamless gutters on a double storey', photos: ['gutters'], category: 'roofing', months: 8, location: 'Durbanville' },
    ],
    certs: [],
  },
  {
    key: 'ayesha', firstName: 'Ayesha', lastName: 'Davids', place: 'claremont', trades: ['painting'],
    headline: 'Painter · interiors and exteriors', years: 7, rate: 300, callOut: 0, radius: 30, verification: 'verified',
    languages: ['English', 'Afrikaans'], skills: ['Interior', 'Exterior', 'Damp proofing'],
    bio: 'Neat, careful painting for homes and flats. I cover your furniture, fix the cracks properly first and finish on the day I said I would.',
    work: [{ title: 'Painting contractor', company: 'Davids & Daughters Painting', employmentType: 'self_employed', location: 'Claremont', start: '2018-02', current: true }],
    portfolio: [
      { title: 'Lounge and passage repaint', photos: ['paint-interior'], category: 'painting', months: 1, location: 'Rondebosch' },
      { title: 'Exterior walls after damp treatment', photos: ['paint-exterior'], category: 'painting', months: 5, location: 'Wynberg' },
    ],
    certs: [],
  },
  {
    key: 'lwazi', firstName: 'Lwazi', lastName: 'Mthembu', place: 'gugulethu', trades: ['carpentry'],
    headline: 'Carpenter · kitchens, cupboards and decks', years: 11, rate: 360, callOut: 200, radius: 30, verification: 'verified',
    languages: ['isiXhosa', 'English'], skills: ['Cupboards', 'Doors & windows', 'Decking'],
    bio: "Custom kitchen cupboards, built-ins and decks made to measure. I'll show you the board and hinges before we start so there are no surprises.",
    work: [{ title: 'Carpenter', company: 'Mthembu Joinery', employmentType: 'self_employed', location: 'Gugulethu', start: '2014-04', current: true }],
    portfolio: [
      { title: 'Kitchen cupboards in white melamine', photos: ['cupboards'], category: 'carpentry', months: 2, location: 'Athlone' },
      { title: 'Pine deck with built-in bench', photos: ['decking'], category: 'carpentry', months: 7, location: 'Pinelands' },
    ],
    certs: [],
  },
  {
    key: 'nomvula', firstName: 'Nomvula', lastName: 'Khumalo', place: 'delft', trades: ['tiling'],
    headline: 'Tiler · bathrooms and floors', years: 6, rate: 320, callOut: 150, radius: 35, verification: 'verified',
    languages: ['isiZulu', 'English', 'isiXhosa'], skills: ['Floors', 'Walls & splashbacks', 'Regrouting'],
    bio: 'Bathrooms and floors tiled straight and level. I waterproof showers properly underneath, which is where most leaks start.',
    work: [{ title: 'Tiler', company: 'Self-employed', employmentType: 'self_employed', location: 'Delft', start: '2019-09', current: true }],
    portfolio: [{ title: 'Bathroom floor and shower retiled', photos: ['tiling-before', 'tiling-after'], category: 'tiling', months: 3, location: 'Bellville South' }],
    certs: [],
  },
  {
    key: 'pieter', firstName: 'Pieter', lastName: 'Botha', place: 'somersetWest', trades: ['building'],
    headline: 'Builder · paving and boundary walls', years: 15, rate: 400, callOut: 0, radius: 45, verification: 'verified',
    languages: ['Afrikaans', 'English'], skills: ['Paving', 'Boundary walls', 'Brickwork', 'Plastering'],
    bio: 'Driveways, boundary walls and small extensions in the Helderberg. Proper foundations, proper drainage, and a site you can walk through at the end of each day.',
    work: [
      { title: 'Building contractor', company: 'Botha Bouwerke', employmentType: 'self_employed', location: 'Somerset West', start: '2012-01', current: true },
      { title: 'Site foreman', company: 'Helderberg Construction', employmentType: 'employed', location: 'Strand', start: '2008-03', end: '2011-12' },
    ],
    portfolio: [
      { title: 'Cobble paving for a double driveway', photos: ['paving'], category: 'building', months: 1, location: 'Somerset West' },
      { title: 'Plastered boundary wall with pillars', photos: ['wall'], category: 'building', months: 6, location: 'Gordon’s Bay' },
    ],
    certs: [{ name: 'NHBRC Registered Home Builder', issuer: 'NHBRC', number: 'NH-DEMO-0915', issued: '2013-02', verified: true }],
  },
  {
    key: 'kagiso', firstName: 'Kagiso', lastName: 'Molefe', place: 'cbd', trades: ['gates-security'],
    headline: 'Gate motors and security installs', years: 8, rate: 390, callOut: 250, radius: 30, verification: 'pending',
    languages: ['Setswana', 'English'], skills: ['Gate motors', 'Electric fencing', 'Burglar bars'],
    bio: 'Gate motors, electric fencing and burglar bars installed and repaired. Most gate motor faults I can fix on the first visit.',
    work: [{ title: 'Security technician', company: 'Self-employed', employmentType: 'self_employed', location: 'Cape Town', start: '2017-05', current: true }],
    portfolio: [{ title: 'Sliding gate motor with battery backup', photos: ['gate-motor'], category: 'gates-security', months: 2, location: 'Vredehoek' }],
    certs: [],
  },
  {
    key: 'fatima', firstName: 'Fatima', lastName: 'Isaacs', place: 'strand', trades: ['appliances'],
    headline: 'Appliance repairs · washers and fridges', years: 10, rate: 330, callOut: 200, radius: 40, verification: 'verified',
    languages: ['English', 'Afrikaans'], skills: ['Washing machines', 'Fridges', 'Stoves & ovens'],
    bio: "Washing machines, fridges and stoves repaired at your home. If it isn't worth fixing, I'll tell you straight away and you only pay the call-out.",
    work: [{ title: 'Appliance technician', company: 'Isaacs Appliance Repairs', employmentType: 'self_employed', location: 'Strand', start: '2015-01', current: true }],
    portfolio: [{ title: 'Front loader that would not drain', photos: ['washing-machine'], category: 'appliances', months: 1, location: 'Strand' }],
    certs: [],
  },
  {
    key: 'bongani', firstName: 'Bongani', lastName: 'Zulu', place: 'khayelitsha', trades: ['general'],
    headline: 'General handyman · small jobs done right', years: 5, rate: 250, callOut: 100, radius: 25, verification: 'pending',
    languages: ['isiZulu', 'isiXhosa', 'English'], skills: ['Mounting & assembly', 'Small repairs', 'Odd jobs'],
    bio: 'TV mounting, shelves, flat-pack furniture and the small jobs on your list. Quick, tidy and fairly priced.',
    work: [{ title: 'Handyman', company: 'Self-employed', employmentType: 'self_employed', location: 'Khayelitsha', start: '2020-02', current: true }],
    portfolio: [{ title: '65 inch TV mounted with hidden cables', photos: ['tv-mount'], category: 'general', months: 1, location: 'Site C' }],
    certs: [],
  },
  {
    key: 'tumelo', firstName: 'Tumelo', lastName: 'Sithole', place: 'soweto', trades: ['plumbing', 'general'],
    headline: 'Plumber and handyman in Soweto', years: 8, rate: 350, callOut: 200, radius: 30, verification: 'verified',
    languages: ['Sesotho', 'isiZulu', 'English'], skills: ['Leaks & burst pipes', 'Toilets & taps', 'Small repairs'],
    bio: 'Plumbing and general repairs across Soweto and Joburg South. Fair prices and I always pitch when I say I will.',
    work: [{ title: 'Plumber', company: 'Self-employed', employmentType: 'self_employed', location: 'Soweto', start: '2017-01', current: true }],
    portfolio: [{ title: 'New toilet and basin installed', photos: ['pipe-repair'], category: 'plumbing', months: 3, location: 'Orlando West' }],
    certs: [],
  },
  {
    key: 'lerato', firstName: 'Lerato', lastName: 'Mokoena', place: 'randburg', trades: ['electrical'],
    headline: 'Electrician · solar backup and DB boards', years: 10, rate: 450, callOut: 350, radius: 40, verification: 'verified',
    languages: ['English', 'Sesotho', 'isiZulu'], skills: ['Solar & inverters', 'DB boards', 'COC certificates'],
    bio: 'Inverter and battery installs for load-shedding, DB upgrades and COCs in Randburg and surrounds.',
    work: [{ title: 'Electrician', company: 'Mokoena Electrical', employmentType: 'self_employed', location: 'Randburg', start: '2016-07', current: true }],
    portfolio: [{ title: 'Inverter-ready DB board', photos: ['db-board'], category: 'electrical', months: 2, location: 'Ferndale' }],
    certs: [{ name: "Wireman's Licence", issuer: 'Department of Employment and Labour', number: 'IE-DEMO-7730', issued: '2015-03', verified: true }],
  },
  {
    key: 'neo', firstName: 'Neo', lastName: 'Mabaso', place: 'centurion', trades: ['roofing', 'painting'],
    headline: 'Roof painting and waterproofing', years: 6, rate: 340, callOut: 0, radius: 40, verification: 'verified',
    languages: ['Sepedi', 'English'], skills: ['Roof painting', 'Waterproofing', 'Exterior'],
    bio: 'Roof restoration, waterproofing and exterior painting in Centurion and Pretoria East.',
    work: [{ title: 'Painter and roofer', company: 'Self-employed', employmentType: 'self_employed', location: 'Centurion', start: '2019-01', current: true }],
    portfolio: [{ title: 'Tiled roof cleaned and painted', photos: ['roof-after', 'paint-exterior'], category: 'roofing', months: 4, location: 'Lyttelton' }],
    certs: [],
  },
  {
    key: 'sanele', firstName: 'Sanele', lastName: 'Dlamini', place: 'umlazi', trades: ['building'],
    headline: 'Builder · braai areas and paving', years: 9, rate: 330, callOut: 0, radius: 40, verification: 'verified',
    languages: ['isiZulu', 'English'], skills: ['Brickwork', 'Paving', 'Plastering'],
    bio: 'Brickwork, paving and outdoor braai areas in Durban South. Solid work, cleaned up properly.',
    work: [{ title: 'Builder', company: 'Self-employed', employmentType: 'self_employed', location: 'Umlazi', start: '2016-05', current: true }],
    portfolio: [{ title: 'Paved patio with built-in braai', photos: ['paving'], category: 'building', months: 2, location: 'Umlazi' }],
    certs: [],
  },
];

const CLIENTS = [
  { key: 'zanele', firstName: 'Zanele', lastName: 'Mbeki', place: 'khayelitsha', interests: ['plumbing', 'carpentry'] },
  { key: 'riaan', firstName: 'Riaan', lastName: 'Pretorius', place: 'bellville', interests: ['roofing', 'gates-security'] },
  { key: 'chantal', firstName: 'Chantal', lastName: 'Adams', place: 'mitchellsPlain', interests: ['electrical', 'tiling'] },
  { key: 'michael', firstName: 'Michael', lastName: 'Okafor', place: 'claremont', interests: ['painting', 'tiling'] },
  { key: 'busisiwe', firstName: 'Busisiwe', lastName: 'Ntuli', place: 'somersetWest', interests: ['building', 'electrical'] },
  { key: 'priya', firstName: 'Priya', lastName: 'Naidoo', place: 'sandton', interests: ['electrical'] },
  { key: 'david', firstName: 'David', lastName: 'Nkosi', place: 'mamelodi', interests: ['roofing'] },
  { key: 'grace', firstName: 'Grace', lastName: 'Govender', place: 'glenwood', interests: ['building'] },
];

// Open jobs taking quotes. quotes: [handymanKey, amount, message, duration]
const OPEN_JOBS = [
  {
    client: 'zanele', category: 'plumbing', sub: 'Geysers', title: 'Geyser leaking into the ceiling', urgency: 'urgent', budget: [2000, 5000], photos: ['ceiling-leak'], daysAgo: 1,
    description: 'Water has been dripping through the ceiling in the passage since this morning. The geyser is about 10 years old. I have switched it off at the DB.',
    quotes: [['sipho', 3200, 'I can come this afternoon. If the geyser has burst I will replace it with a 150 L unit including the drip tray and valves. Price includes labour.', '1 day']],
  },
  {
    client: 'riaan', category: 'roofing', sub: 'Leak repairs', title: 'Roof leaks over the garage when it rains', urgency: 'this_week', budget: [3000, 8000], daysAgo: 3,
    description: 'Corrugated iron roof over a double garage. Leaks in two places when it rains hard. Would like it fixed before the next front comes through.',
    quotes: [['johan', 5800, 'Sounds like the screws and overlaps have rusted. I will replace the screws, seal the laps and waterproof the flashings. Written guarantee included.', '2–3 days']],
  },
  {
    client: 'chantal', category: 'electrical', sub: 'Faults & trips', title: 'Kitchen plugs keep tripping the DB', urgency: 'urgent', budget: [null, 1500], daysAgo: 0,
    description: 'Every time we switch on the kettle and the microwave together, the earth leakage trips. It started last week.',
    quotes: [['thandiwe', 950, 'Likely a faulty appliance or a damp plug point. I will test the circuit and each appliance and fix the fault. Call-out included.', 'A few hours']],
  },
  {
    client: 'michael', category: 'painting', sub: 'Interior', title: 'Repaint a 3-bedroom house inside', urgency: 'flexible', budget: [8000, 15000], daysAgo: 2,
    description: 'Walls and ceilings in three bedrooms, lounge and passage. Some small cracks to fill. We supply nothing, so please include paint.',
    quotes: [],
  },
  {
    client: 'busisiwe', category: 'building', sub: 'Boundary walls', title: 'Crack in the boundary wall', urgency: 'flexible', budget: [2000, 6000], photos: ['cracked-wall'], daysAgo: 4,
    description: 'A long crack has opened in the front boundary wall near the gate. About 3 m of wall. Worried it will get worse in winter.',
    quotes: [['pieter', 4200, 'I will check the foundation first. If it is only the wall, I will cut out the cracked section, rebuild it with reinforcing and replaster to match.', '2–3 days']],
  },
  {
    client: 'zanele', category: 'plumbing', sub: 'Drains & blockages', title: 'Blocked drain outside the kitchen', urgency: 'urgent', budget: [500, 1200], photos: ['blocked-drain'], daysAgo: 0,
    description: 'The outside drain by the kitchen is overflowing. Water is pooling near the back door.',
    quotes: [],
  },
  {
    client: 'chantal', category: 'tiling', sub: 'Floors', title: 'Retile a small bathroom floor', urgency: 'flexible', budget: [4000, 7000], daysAgo: 6,
    description: 'Bathroom is about 4 m². Old tiles are cracked. We have bought the new tiles already.',
    quotes: [['nomvula', 5500, 'I will lift the old tiles, level the floor and lay your new tiles with a waterproof grout. Includes adhesive and grout.', '2–3 days']],
  },
  {
    client: 'riaan', category: 'gates-security', sub: 'Gate motors', title: 'Gate motor not opening', urgency: 'urgent', budget: [null, null], daysAgo: 1,
    description: 'Sliding gate motor beeps but will not open. Remote batteries are new.',
    quotes: [],
  },
  {
    client: 'priya', category: 'electrical', sub: 'Lights & plugs', title: 'Install 6 downlights in the lounge', urgency: 'this_week', budget: [1500, 3000], daysAgo: 2,
    description: 'Replace the old ceiling light with six LED downlights on one switch.',
    quotes: [['lerato', 2400, 'Six warm-white LED downlights with fittings, on the existing switch. I will patch the old rose hole.', '1 day']],
  },
];

// Hired jobs at every stage. state: awaiting_payment | funded | in_progress | completed | confirmed | disputed | cancelled
const BOOKINGS = [
  { client: 'zanele', handyman: 'sipho', category: 'plumbing', title: 'Replace a 100 L geyser', amount: 4800, state: 'confirmed', daysAgo: 40,
    review: [5, 'Sipho came the same day, explained everything and left the ceiling space cleaner than he found it.'], back: [5, 'Easy to work with and paid on time.'],
    chat: [['handyman', 'Hi Zanele, I am on my way. About 20 minutes.'], ['client', 'Perfect, the gate code is 1234.'], ['handyman', 'All done. Geyser is heating, check the hot water in an hour.']] },
  { client: 'michael', handyman: 'ayesha', category: 'painting', title: 'Paint the kitchen and passage', amount: 6500, state: 'confirmed', daysAgo: 30, review: [5, 'Very neat work. Covered everything and finished a day early.'] },
  { client: 'busisiwe', handyman: 'pieter', category: 'building', title: 'Pave the front driveway (40 m²)', amount: 18500, state: 'confirmed', daysAgo: 25, review: [4, 'Great driveway. Took a day longer than planned because of rain, but he kept me updated.'] },
  { client: 'riaan', handyman: 'johan', category: 'roofing', title: 'Waterproof the flat roof over the stoep', amount: 9200, state: 'confirmed', daysAgo: 20, review: [5, 'No more leaks after two big storms. Highly recommend Johan.'] },
  { client: 'priya', handyman: 'lerato', category: 'electrical', title: 'Upgrade the DB board for an inverter', amount: 7800, state: 'confirmed', daysAgo: 18, review: [5, 'Professional, tidy and she explained the inverter setup clearly.'] },
  { client: 'chantal', handyman: 'fatima', category: 'appliances', title: 'Washing machine not draining', amount: 850, state: 'confirmed', daysAgo: 15, review: [4, 'Fixed on the first visit. Pump was blocked with a sock!'] },
  { client: 'grace', handyman: 'sanele', category: 'building', title: 'Build a braai area on the patio', amount: 12000, state: 'confirmed', daysAgo: 22, review: [5, 'Beautiful brickwork. We had our first braai on Sunday.'] },
  { client: 'zanele', handyman: 'lwazi', category: 'carpentry', title: 'Fit new kitchen cupboard doors', amount: 3600, state: 'completed', daysAgo: 6,
    chat: [['handyman', 'Hi Zanele, the doors are all hung and adjusted. Please check the soft-close hinges and confirm in the app when you are happy.']] },
  { client: 'michael', handyman: 'nomvula', category: 'tiling', title: 'Retile the shower walls', amount: 6900, state: 'in_progress', daysAgo: 3,
    chat: [['client', 'Morning Nomvula, the tiles are in the garage.'], ['handyman', 'Thanks Michael, starting with the waterproofing today. Tiling tomorrow.']] },
  { client: 'busisiwe', handyman: 'thandiwe', category: 'electrical', title: 'COC certificate for house sale', amount: 1800, state: 'funded', daysAgo: 2, scheduledInDays: 3 },
  { client: 'chantal', handyman: 'sipho', category: 'plumbing', title: 'Fix a dripping bath mixer', amount: 650, state: 'awaiting_payment', daysAgo: 1 },
  { client: 'riaan', handyman: 'bongani', category: 'general', title: 'Mount the TV and hang two shelves', amount: 1200, state: 'disputed', daysAgo: 8,
    dispute: 'One of the shelves came loose the next day and fell. The TV is fine but the wall needs repairing.',
    chat: [['handyman', 'Done! Shelves are up and the TV is mounted.'], ['client', 'One shelf has fallen down. Can you come back?'], ['handyman', 'I can come next week. Or WhatsApp me on 072 555 0199 and pay cash for the extra plugs.']],
    report: 'Asked me to pay cash outside the app.' },
  { client: 'david', handyman: 'neo', category: 'roofing', title: 'Paint the tiled roof', amount: 5000, state: 'cancelled', daysAgo: 12, cancelReason: 'Rain all week. Happy to quote again in spring.' },
];


// Service packages: handymanKey → [title, trade slug, subcategory, pricingType, description, photos, tiers [name, price, description, hours]]
const SERVICES = {
  sipho: [
    ['Geyser replacement', 'plumbing', 'Geysers', 'fixed', 'Old geyser removed and a new one fitted with drip tray, vacuum breakers and a plumbing COC. Disposal included.', ['geyser-after'],
      [['100 L', 6200, '100 L geyser, valves and drip tray'], ['150 L', 7400, '150 L geyser, valves and drip tray'], ['200 L', 8900, '200 L geyser for bigger families']]],
    ['Unblock a drain', 'plumbing', 'Drains & blockages', 'fixed', 'Blocked sink, shower or outside drain cleared with a machine. If it needs more, I quote before I start.', ['pipe-repair'],
      [['Indoor drain', 650, 'Sink, basin or shower'], ['Outside drain', 950, 'Gully or main line up to 15 m']]],
    ['Fix a leaking tap or toilet', 'plumbing', 'Toilets & taps', 'hourly', 'Washers, cartridges, cisterns and flush valves. Parts charged at cost.', [],
      [['Per hour', 380, 'Most jobs take about an hour', 1]]],
  ],
  thandiwe: [
    ['Electrical COC for a house sale', 'electrical', 'COC certificates', 'fixed', 'Full inspection, test report and Certificate of Compliance for transfer. Small remedial work quoted separately.', ['db-board'],
      [['Up to 3 bedrooms', 1800, 'Inspection and certificate'], ['4+ bedrooms', 2400, 'Inspection and certificate']]],
    ['Install LED downlights', 'electrical', 'Lights & plugs', 'fixed', 'Supply and install warm-white LED downlights on an existing switch. Holes patched.', ['lights'],
      [['4 lights', 1600, ''], ['8 lights', 2900, '']]],
  ],
  johan: [
    ['Roof waterproofing', 'roofing', 'Waterproofing', 'quote', 'Flat roofs, parapets and flashings waterproofed with a 5-year written guarantee. I quote after a free site visit.', ['roof-after'], []],
    ['Gutter cleaning and repairs', 'roofing', 'Gutters', 'fixed', 'Gutters and downpipes cleared, joints resealed and loose brackets fixed.', ['gutters'],
      [['Single storey', 950, ''], ['Double storey', 1650, '']]],
  ],
  ayesha: [
    ['Paint a room', 'painting', 'Interior', 'fixed', 'Two coats on walls, cracks filled first, furniture covered. Paint included in a colour you choose.', ['paint-interior'],
      [['Small room', 2200, 'Up to 12 m²'], ['Large room', 3400, 'Up to 25 m²']]],
  ],
  lwazi: [
    ['Hang or replace doors', 'carpentry', 'Doors & windows', 'fixed', 'Interior doors hung, planed and fitted with handles and hinges.', ['cupboards'],
      [['1 door', 850, 'You supply the door'], ['3 doors', 2200, 'You supply the doors']]],
  ],
  nomvula: [
    ['Retile a bathroom floor', 'tiling', 'Floors', 'fixed', 'Old tiles lifted, floor levelled and your new tiles laid with waterproof grout.', ['tiling-after'],
      [['Up to 4 m²', 3800, ''], ['Up to 8 m²', 6500, '']]],
  ],
  pieter: [
    ['Driveway paving', 'building', 'Paving', 'quote', 'Interlocking or cobble paving with a compacted base and proper drainage. Free measure and quote.', ['paving'], []],
  ],
  fatima: [
    ['Washing machine repair', 'appliances', 'Washing machines', 'fixed', "Diagnosis and repair at your home. If it isn't worth fixing you only pay the call-out.", ['washing-machine'],
      [['Call-out and diagnosis', 350, 'Credited if you go ahead'], ['Pump or belt replaced', 950, 'Parts included']]],
  ],
  lerato: [
    ['Inverter and battery install', 'electrical', 'Solar & inverters', 'fixed', 'Inverter and lithium battery installed on essential circuits, with a COC.', ['db-board'],
      [['3 kVA + 2.4 kWh', 21500, 'Lights, Wi-Fi and TV'], ['5 kVA + 5 kWh', 34500, 'Adds fridge and plugs']]],
  ],
  tumelo: [
    ['Fix a leaking tap or toilet', 'plumbing', 'Toilets & taps', 'hourly', 'Leaks fixed fast in Soweto and surrounds. Parts at cost.', [], [['Per hour', 350, '', 1]]],
  ],
  sanele: [
    ['Build a braai area', 'building', 'Brickwork', 'quote', 'Face-brick or plastered braai with a work surface. Free site visit and quote.', ['paving'], []],
  ],
};

module.exports = { PLACES, HANDYMEN, CLIENTS, OPEN_JOBS, BOOKINGS, SERVICES };
