import { Link } from 'react-router-dom';
import { LuUserRound, LuMessageCircle, LuArrowRight } from 'react-icons/lu';
import { NEWS_POSTS } from '../data/newsData';

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
                    <Link to="/news" className="news-v2__cta">
                        VIEW ALL POST
                        <span className="news-v2__cta-circle">
                            <LuArrowRight />
                        </span>
                    </Link>
                </div>

                <div className="news-v2__grid">
                    {NEWS_POSTS.slice(0, 3).map((post) => (
                        <article key={post.slug} className="news-v2__card">
                            <Link to={`/news/${post.slug}`} className="news-v2__image-wrap">
                                <img src={post.image} alt={post.title} className="news-v2__image" />
                                <span className="news-v2__date-badge">{post.date}</span>
                            </Link>
                            <h3 className="news-v2__title">
                                <Link to={`/news/${post.slug}`} className="news-v2__title-link">{post.title}</Link>
                            </h3>
                            <p className="news-v2__desc">{post.summary}</p>
                            <div className="news-v2__divider" />
                            <div className="news-v2__footer">
                                <span className="news-v2__meta">
                                    <LuUserRound />
                                    By {post.author}
                                </span>
                                <span className="news-v2__meta">
                                    <LuMessageCircle />
                                    {String(post.comments).padStart(2, '0')} Comments
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
