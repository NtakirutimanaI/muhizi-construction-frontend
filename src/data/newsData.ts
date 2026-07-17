export interface NewsPost {
    slug: string;
    title: string;
    date: string;
    isoDate: string;
    category: string;
    summary: string;
    image: string;
    author: string;
    comments: number;
    readTime: string;
    content: string[];
}

export const NEWS_POSTS: NewsPost[] = [
    {
        slug: 'hassle-free-cross-border-shipping',
        title: 'A Guide to Hassle-Free Cross-Border Shipping',
        date: '30 MAY',
        isoDate: '2026-05-30',
        category: 'Logistics',
        summary: 'How we plan permits, customs, and logistics so imported materials reach your site on schedule.',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Admin',
        comments: 2,
        readTime: '4 min read',
        content: [
            'Importing steel, glazing, and specialist equipment for a construction project involves far more than placing an order and waiting for a delivery date. Every shipment has to clear customs, satisfy permit requirements, and arrive in a sequence that matches the build schedule on site.',
            'At Muhizi Construction, we plan cross-border logistics months ahead of the pour. Our procurement team works directly with freight partners and customs brokers to pre-clear documentation, so materials are never held up at the border while a crew waits idle on site.',
            'We also build buffer windows into every import schedule. Weather, port congestion, and paperwork delays are common in regional trade corridors, and a project timeline that assumes perfect conditions is a timeline that will slip. Buffer time protects both our clients and our subcontractors from the ripple effects of a single late container.',
            'The result is a supply chain that clients can rely on: materials arrive when the schedule says they will, inspected, documented, and ready to go straight into the build.',
        ],
    },
    {
        slug: 'why-timely-delivery-matters',
        title: 'Why Timely Delivery Matters: Building Customer Trust',
        date: '09 JUNE',
        isoDate: '2026-06-09',
        category: 'Project Management',
        summary: 'A look at how disciplined scheduling keeps every phase of a build on track and clients confident.',
        image: 'https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Admin',
        comments: 2,
        readTime: '5 min read',
        content: [
            'A construction schedule is a promise made up of hundreds of smaller promises: the foundation crew showing up on day one, the electrical rough-in finishing before drywall, the final inspection landing before handover. Miss enough of the small promises, and the big one — the completion date — falls apart with it.',
            'We treat scheduling as a discipline, not a formality. Every phase of a Muhizi Construction project is tracked against a master timeline that is reviewed weekly with site managers, subcontractors, and clients. When a risk to the schedule appears, we surface it immediately rather than letting it quietly compound.',
            'Timely delivery is also what earns repeat business. Clients remember whether a contractor kept its word on dates far more than they remember the finer details of the build. A track record of on-time handovers is, in a very real sense, our best marketing.',
            'That is why every project we take on starts with a realistic schedule, built from experience rather than optimism, and why we hold ourselves accountable to it at every phase.',
        ],
    },
    {
        slug: 'choosing-the-best-freight-solution',
        title: 'How to Choose the Best Freight Solution for Your Business',
        date: '23 APRIL',
        isoDate: '2026-04-23',
        category: 'Logistics',
        summary: 'Comparing freight options for heavy equipment and materials, and what to weigh before you commit.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Admin',
        comments: 3,
        readTime: '6 min read',
        content: [
            'Not every shipment needs the same freight solution. Heavy equipment, bulk aggregates, and finishing materials each come with different weight, timing, and handling requirements, and choosing the wrong option can quietly erode a project budget.',
            'For heavy machinery and structural steel, we generally favour road freight with specialised low-loaders, since it offers direct site delivery without the handling risk of intermodal transfers. For bulk materials arriving from overseas suppliers, sea freight remains the most cost-effective option, provided the import schedule allows for longer transit times.',
            'Air freight is reserved for genuinely time-critical items: a replacement part that would otherwise stall a crew, or specialist components with no local substitute. It costs more, but the cost of an idle site often costs more still.',
            'The right freight solution is rarely the cheapest one on paper. It is the one that gets the right material to the right place at the right time, without introducing new risk into the schedule.',
        ],
    },
    {
        slug: 'sustainable-building-materials-2026',
        title: 'Sustainable Building Materials Shaping Construction in 2026',
        date: '12 JULY',
        isoDate: '2026-07-12',
        category: 'Sustainability',
        summary: 'From low-carbon concrete to recycled steel, the materials redefining how we build responsibly.',
        image: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Admin',
        comments: 5,
        readTime: '5 min read',
        content: [
            'Sustainability in construction has moved from a marketing talking point to a genuine cost and compliance consideration. Clients are asking about embodied carbon, suppliers are publishing environmental product declarations, and regulators in more markets are beginning to require it.',
            'Low-carbon concrete mixes, which replace a portion of cement with supplementary materials like fly ash or slag, are now specified on the majority of our new commercial projects. They perform comparably to standard mixes while meaningfully reducing embodied emissions.',
            'Recycled steel is another area where the economics and the environmental case now align. Modern recycled steel meets the same structural standards as virgin steel, at a comparable price, making it an easy specification choice rather than a compromise.',
            'We expect this shift to accelerate. Building sustainably is no longer a premium feature — it is becoming the baseline expectation for any serious construction firm.',
        ],
    },
    {
        slug: 'site-safety-culture-that-works',
        title: 'Building a Site Safety Culture That Actually Works',
        date: '02 JUNE',
        isoDate: '2026-06-02',
        category: 'Safety',
        summary: 'Why safety compliance on paper is not the same as safety culture on site, and how we close that gap.',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Admin',
        comments: 1,
        readTime: '4 min read',
        content: [
            'Every construction site has a safety binder. Far fewer have a safety culture. The difference shows up not in the documentation, but in what workers actually do when a supervisor is not standing next to them.',
            'We built our safety programme around daily toolbox talks rather than one-off training sessions, because habits form through repetition, not annual refreshers. Every crew starts the day with a five-minute conversation about the specific risks on that site, that day.',
            'Reporting near-misses without blame is the other pillar. A crew that fears punishment for reporting a hazard will simply stop reporting it, and the hazard remains. We treat every near-miss report as valuable information, not a disciplinary event.',
            'The measure of a safety culture is not how clean the paperwork looks after an incident. It is how few incidents there are to write up in the first place.',
        ],
    },
    {
        slug: 'smart-technology-on-modern-job-sites',
        title: 'Smart Technology on Modern Job Sites',
        date: '18 MARCH',
        isoDate: '2026-03-18',
        category: 'Technology',
        summary: 'Drones, IoT sensors, and project management software are changing how we monitor progress and quality.',
        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Admin',
        comments: 4,
        readTime: '5 min read',
        content: [
            'Construction has historically lagged other industries in technology adoption, but that gap is closing fast. On our active sites, drone surveys now replace much of the manual progress photography that used to eat hours of a site manager\'s week.',
            'IoT sensors embedded in curing concrete give us real-time temperature and moisture data, letting us confirm strength milestones without guesswork or destructive testing. This alone has shaved days off several recent schedules by removing unnecessary waiting periods.',
            'Cloud-based project management software ties it all together, giving clients, subcontractors, and our own teams a single, live view of progress, budget, and outstanding issues, rather than a weekly report that is already outdated by the time it lands in an inbox.',
            'None of this technology replaces experienced site management. What it does is give experienced people better information, faster, so their judgment counts for more.',
        ],
    },
];

export function getNewsPostBySlug(slug: string): NewsPost | undefined {
    return NEWS_POSTS.find((post) => post.slug === slug);
}

export function slugify(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'post';
}
