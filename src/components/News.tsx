import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuUserRound, LuMessageCircle, LuArrowRight } from 'react-icons/lu';
import { NEWS_POSTS } from '../data/newsData';
import { updatesService, type Update } from '../services/updatesService';
import type { Profile } from '../services/profileService';

interface NewsProps {
    profile?: Profile | null;
}

interface NewsPost {
    slug: string;
    title: string;
    summary: string;
    image: string;
    date: string;
    author: string;
    comments: number;
    category: string;
    readTime?: string;
    source?: 'news' | 'update';
}

const News: React.FC<NewsProps> = ({ profile }) => {
    const staticPosts = profile?.pageContent?.news && profile.pageContent.news.length > 0 ? profile.pageContent.news : NEWS_POSTS;
    const [updates, setUpdates] = useState<Update[]>([]);

    useEffect(() => {
        updatesService.getPublished()
            .then(data => setUpdates(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const updatePosts: NewsPost[] = updates.map(u => ({
        slug: u.slug,
        title: u.title,
        summary: u.summary || u.content || '',
        image: u.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        date: u.publishedAt || u.createdAt,
        author: u.author || 'Admin',
        comments: u.comments || 0,
        category: u.category || 'Update',
        readTime: u.readTime,
        source: 'update',
    }));

    const allPosts: NewsPost[] = [...updatePosts, ...staticPosts.map((p: any) => ({ ...p, source: 'news' as const }))];
    const displayPosts = allPosts.slice(0, 3);

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
                    {displayPosts.map((post) => (
                        <article key={post.slug} className="news-v2__card">
                            <Link to={post.source === 'update' ? `/news/${post.slug}` : `/news/${post.slug}`} className="news-v2__image-wrap">
                                <img src={post.image} alt={post.title} className="news-v2__image" />
                                <span className="news-v2__date-badge">{post.date}</span>
                            </Link>
                            <h3 className="news-v2__title">
                                <Link to={post.source === 'update' ? `/news/${post.slug}` : `/news/${post.slug}`} className="news-v2__title-link">{post.title}</Link>
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
