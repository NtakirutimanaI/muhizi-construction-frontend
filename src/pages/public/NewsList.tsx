import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { LuUserRound, LuMessageCircle, LuArrowRight, LuClock } from 'react-icons/lu';
import { NEWS_POSTS } from '../../data/newsData';
import type { Profile } from '../../services/profileService';

const NewsList = () => {
  const outlet = useOutletContext<{ profile: Profile | null } | undefined>();
  const posts = outlet?.profile?.pageContent?.news && outlet.profile.pageContent.news.length > 0 ? outlet.profile.pageContent.news : NEWS_POSTS;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.category)))],
    [posts]
  );
  const [activeCategory, setActiveCategory] = useState('All');

  const [featured, ...rest] = posts;
  const filtered =
    activeCategory === 'All'
      ? rest
      : rest.filter((p) => p.category === activeCategory);
  const showFeatured = activeCategory === 'All';

  return (
    <>
      <style>{`
        .news-list-page { background: #F5F7FA; font-family: var(--font-main); min-height: 100vh; }

        .news-list-banner { position: relative; width: 100%; height: calc(260px + var(--nav-offset)); margin-top: calc(-1 * var(--nav-offset)); overflow: hidden; }
        .news-list-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .news-list-banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,10,20,0.55) 0%, rgba(8,10,20,0.7) 45%, rgba(8,10,20,0.88) 100%); }
        .news-list-banner-content { position: absolute; top: var(--nav-offset); left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; padding: 1rem; }
        .news-list-eyebrow { display: inline-flex; align-items: center; gap: 0.6rem; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; margin: 0 0 0.75rem; text-shadow: 0 2px 10px rgba(0,0,0,0.85); }
        .news-list-eyebrow-line { width: 30px; height: 0; border-top: 2px dashed #fff; display: inline-block; }
        .news-list-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(2rem, 4vw, 2.9rem); margin: 0; color: #fff; text-shadow: 0 4px 24px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.9); }
        .news-list-breadcrumb { margin-top: 0.85rem; font-size: 0.85rem; color: rgba(255,255,255,0.9); text-shadow: 0 2px 8px rgba(0,0,0,0.85); display: flex; align-items: center; gap: 0.5rem; }
        .news-list-breadcrumb a { color: rgba(255,255,255,0.75); text-decoration: none; }
        .news-list-breadcrumb a:hover { color: #fff; }

        .news-list-content { max-width: 1280px; margin: 0 auto; padding: 3.5rem 2.5rem 5rem; }

        .news-list-filters { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 2.75rem; }
        .news-list-filter-btn { border: 1px solid var(--border-color, #E2E4EA); background: #fff; color: var(--text-muted, #64748B); font-size: 0.82rem; font-weight: 600; padding: 0.55rem 1.15rem; border-radius: 9999px; cursor: pointer; transition: all 0.2s ease; }
        .news-list-filter-btn:hover { border-color: var(--accent); color: var(--accent); }
        .news-list-filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

        .news-featured { display: grid; grid-template-columns: 1.1fr 1fr; gap: 2.5rem; align-items: center; background: transparent; border-radius: 0; overflow: hidden; box-shadow: none; margin-bottom: 3.5rem; }
        .news-featured-image-wrap { position: relative; height: 100%; min-height: 340px; }
        .news-featured-image-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .news-featured-badge { position: absolute; top: 1.25rem; left: 1.25rem; background: var(--accent); color: #fff; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.4rem 0.85rem; border-radius: 6px; }
        .news-featured-body { padding: 1rem 2.5rem 1rem 0; }
        .news-featured-category { color: var(--accent); font-weight: 700; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 0.75rem; }
        .news-featured-title { font-family: var(--font-display); font-size: clamp(1.4rem, 2.4vw, 1.9rem); font-weight: 800; line-height: 1.3; color: #111827; margin: 0 0 1rem; }
        .news-featured-title a { color: inherit; text-decoration: none; }
        .news-featured-title a:hover { color: var(--accent); }
        .news-featured-desc { color: #64748B; font-size: 0.95rem; line-height: 1.75; margin: 0 0 1.5rem; }
        .news-featured-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 1.25rem; font-size: 0.82rem; color: #64748B; margin-bottom: 1.5rem; }
        .news-featured-meta span { display: inline-flex; align-items: center; gap: 0.4rem; }
        .news-featured-meta svg { color: var(--accent); }
        .news-read-more { display: inline-flex; align-items: center; gap: 0.75rem; padding: 0 0 0 1.75rem; background: var(--accent); color: #fff; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; text-decoration: none; transition: opacity 0.2s ease; }
        .news-read-more:hover { opacity: 0.88; }
        .news-read-more-circle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #16324F; color: #fff; font-size: 1.05rem; flex-shrink: 0; }

        .news-list-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
        .news-list-card { background: transparent; border-radius: 0; overflow: hidden; box-shadow: none; display: flex; flex-direction: column; transition: transform 0.25s ease; }
        .news-list-card:hover { transform: translateY(-4px); box-shadow: none; }
        .news-list-card-image-wrap { position: relative; display: block; height: 190px; }
        .news-list-card-image-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .news-list-card-date { position: absolute; bottom: 10px; right: 10px; background: #16324F; color: #fff; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 0.35rem 0.65rem; border-radius: 6px; }
        .news-list-card-body { padding: 1.5rem; display: flex; flex-direction: column; flex: 1; }
        .news-list-card-category { color: var(--accent); font-weight: 700; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 0.6rem; }
        .news-list-card-title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; line-height: 1.4; color: #111827; margin: 0 0 0.6rem; }
        .news-list-card-title a { color: inherit; text-decoration: none; }
        .news-list-card-title a:hover { color: var(--accent); }
        .news-list-card-desc { font-size: 0.75rem; color: #64748B; line-height: 1.4; margin: 0 0 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .news-list-card-divider { height: 1px; background: #EEF0F4; margin: 0 0 1rem; margin-top: auto; }
        .news-list-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.76rem; color: #64748B; }
        .news-list-card-footer span { display: inline-flex; align-items: center; gap: 0.4rem; }
        .news-list-card-footer svg { color: var(--accent); }

        .news-list-empty { text-align: center; padding: 4rem 1rem; color: #64748B; }

        @media (max-width: 960px) {
          .news-featured { grid-template-columns: 1fr; }
          .news-featured-body { padding: 0 1.75rem 1.75rem; }
          .news-featured-image-wrap { min-height: 260px; }
          .news-list-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .news-list-content { padding: 2.5rem 1.25rem 3.5rem; }
          .news-list-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="news-list-page">
        <div className="news-list-banner" data-nav-theme="dark">
          <img
            src="https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="Muhizi Construction news"
          />
          <div className="news-list-banner-content">
            <p className="news-list-eyebrow">
              <span className="news-list-eyebrow-line" />
              Our Blog &amp; News
            </p>
            <h1 className="news-list-title">All Articles</h1>
            <p className="news-list-breadcrumb">
              <Link to="/">Home</Link> / <span>News</span>
            </p>
          </div>
        </div>

        <div className="news-list-content" data-nav-theme="light">
          <div className="news-list-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`news-list-filter-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {showFeatured && (
            <article className="news-featured">
              <div className="news-featured-image-wrap">
                <img src={featured.image} alt={featured.title} />
                <span className="news-featured-badge">Featured</span>
              </div>
              <div className="news-featured-body">
                <p className="news-featured-category">{featured.category}</p>
                <h2 className="news-featured-title">
                  <Link to={`/news/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="news-featured-desc">{featured.summary}</p>
                <div className="news-featured-meta">
                  <span><LuUserRound /> By {featured.author}</span>
                  <span><LuClock /> {featured.readTime}</span>
                  <span><LuMessageCircle /> {String(featured.comments).padStart(2, '0')} Comments</span>
                </div>
                <Link to={`/news/${featured.slug}`} className="news-read-more">
                  READ MORE
                  <span className="news-read-more-circle"><LuArrowRight /></span>
                </Link>
              </div>
            </article>
          )}

          {filtered.length > 0 ? (
            <div className="news-list-grid">
              {filtered.map((post) => (
                <article key={post.slug} className="news-list-card">
                  <Link to={`/news/${post.slug}`} className="news-list-card-image-wrap">
                    <img src={post.image} alt={post.title} />
                    <span className="news-list-card-date">{post.date}</span>
                  </Link>
                  <div className="news-list-card-body">
                    <p className="news-list-card-category">{post.category}</p>
                    <h3 className="news-list-card-title">
                      <Link to={`/news/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="news-list-card-desc">{post.summary}</p>
                    <div className="news-list-card-divider" />
                    <div className="news-list-card-footer">
                      <span><LuUserRound /> By {post.author}</span>
                      <span><LuMessageCircle /> {String(post.comments).padStart(2, '0')} Comments</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="news-list-empty">No articles found in this category yet.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default NewsList;
