import { LuUserRound, LuMessageCircle, LuArrowRight } from 'react-icons/lu';

interface NewsPost {
    title: string;
    date: string;
    summary: string;
    image: string;
}

const NEWS_POSTS: NewsPost[] = [
    {
        title: 'A Guide to Hassle-Free Cross-Border Shipping',
        date: '30 MAY',
        summary: 'How we plan permits, customs, and logistics so imported materials reach your site on schedule.',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'Why Timely Delivery Matters: Building Customer Trust',
        date: '09 JUNE',
        summary: 'A look at how disciplined scheduling keeps every phase of a build on track and clients confident.',
        image: 'https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
        title: 'How to Choose the Best Freight Solution for Your Business',
        date: '23 APRIL',
        summary: 'Comparing freight options for heavy equipment and materials, and what to weigh before you commit.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
];

const News: React.FC = () => {
    return (
        <section data-nav-theme="light" className="section section-indicator" id="news">
            <div className="container">
                <div className="news-v2__header">
                    <div>
                        <p className="news-v2__eyebrow">
                            <span className="news-v2__eyebrow-line" />
                            Our Blog &amp; News
                        </p>
                        <h2 className="news-v2__heading">
                            Latest News Posts<br />And Articles
                        </h2>
                    </div>
                    <a href="#news" className="news-v2__cta">
                        VIEW ALL POST
                        <span className="news-v2__cta-circle">
                            <LuArrowRight />
                        </span>
                    </a>
                </div>

                <div className="news-v2__grid">
                    {NEWS_POSTS.map((post, i) => (
                        <article key={i} className="news-v2__card">
                            <div className="news-v2__image-wrap">
                                <img src={post.image} alt={post.title} className="news-v2__image" />
                                <span className="news-v2__date-badge">{post.date}</span>
                            </div>
                            <h3 className="news-v2__title">{post.title}</h3>
                            <p className="news-v2__desc">{post.summary}</p>
                            <div className="news-v2__divider" />
                            <div className="news-v2__footer">
                                <span className="news-v2__meta">
                                    <LuUserRound />
                                    By Admin
                                </span>
                                <span className="news-v2__meta">
                                    <LuMessageCircle />
                                    02 Comments
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default News;
