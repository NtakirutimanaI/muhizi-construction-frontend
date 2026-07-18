import { useEffect } from 'react';
import { Link, useParams, Navigate, useOutletContext } from 'react-router-dom';
import { LuUserRound, LuMessageCircle, LuClock, LuArrowLeft, LuArrowRight, LuCalendarDays } from 'react-icons/lu';
import { NEWS_POSTS } from '../../data/newsData';
import type { Profile } from '../../services/profileService';

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const outlet = useOutletContext<{ profile: Profile | null } | undefined>();
  const posts = outlet?.profile?.pageContent?.news && outlet.profile.pageContent.news.length > 0 ? outlet.profile.pageContent.news : NEWS_POSTS;
  const post = slug ? posts.find((p) => p.slug === slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <Navigate to="/news" replace />;
  }

  const currentIndex = posts.findIndex((p) => p.slug === post.slug);
  const related = posts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  const fallbackRelated = related.length > 0 ? related : posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const prevPost = posts[currentIndex - 1];
  const nextPost = posts[currentIndex + 1];

  return (
    <>
      <style>{`
        .article-page { background: #F5F7FA; font-family: var(--font-main); min-height: 100vh; }

        .article-banner { position: relative; width: 100%; height: calc(340px + var(--nav-offset)); margin-top: calc(-1 * var(--nav-offset)); overflow: hidden; }
        .article-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .article-banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,10,20,0.45) 0%, rgba(8,10,20,0.68) 45%, rgba(8,10,20,0.92) 100%); }
        .article-banner-content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; text-align: center; color: #fff; padding: 0 1rem 2.25rem; }
        .article-category { color: #fff; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 0.85rem; text-shadow: 0 2px 10px rgba(0,0,0,0.85); }
        .article-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(1.7rem, 3.6vw, 2.5rem); line-height: 1.25; margin: 0 0 1rem; max-width: 900px; color: #fff; text-shadow: 0 4px 24px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.9); }
        .article-meta-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.5rem; font-size: 0.85rem; color: rgba(255,255,255,0.92); text-shadow: 0 2px 8px rgba(0,0,0,0.85); }
        .article-meta-row span { display: inline-flex; align-items: center; gap: 0.45rem; }
        .article-meta-row svg { color: #fff; }

        .article-content-wrap { max-width: 900px; margin: 0 auto; padding: 3.5rem 2.5rem 5rem; }

        .article-breadcrumb { font-size: 0.85rem; color: #64748B; margin: 0 0 2rem; display: flex; align-items: center; gap: 0.5rem; }
        .article-breadcrumb a { color: #64748B; text-decoration: none; }
        .article-breadcrumb a:hover { color: var(--accent); }

        .article-body { background: #fff; border-radius: 0; padding: 2.75rem; box-shadow: 0 20px 45px rgba(15,18,34,0.07); }
        .article-body p { color: #4B5563; font-size: 1rem; line-height: 1.9; margin: 0 0 1.4rem; }
        .article-body p:last-child { margin-bottom: 0; }

        .article-divider { height: 1px; background: #EEF0F4; margin: 2.25rem 0; }

        .article-back-link { display: inline-flex; align-items: center; gap: 0.6rem; color: var(--accent); font-weight: 600; font-size: 0.85rem; text-decoration: none; margin-bottom: 2rem; }
        .article-back-link:hover { gap: 0.85rem; }

        .article-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2.5rem; }
        .article-nav-link { display: flex; flex-direction: column; gap: 0.4rem; padding: 1.25rem 1.5rem; background: #fff; border-radius: 0; box-shadow: 0 10px 25px rgba(15,18,34,0.06); text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .article-nav-link:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(15,18,34,0.1); }
        .article-nav-link.next { text-align: right; align-items: flex-end; }
        .article-nav-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); display: inline-flex; align-items: center; gap: 0.4rem; }
        .article-nav-title { font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: #111827; line-height: 1.4; }

        .article-related { margin-top: 3.5rem; }
        .article-related-heading { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0 0 1.5rem; }
        .article-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .article-related-card { background: #fff; border-radius: 0; overflow: hidden; box-shadow: 0 10px 25px rgba(15,18,34,0.06); text-decoration: none; display: block; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .article-related-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(15,18,34,0.1); }
        .article-related-card img { width: 100%; height: 130px; object-fit: cover; display: block; }
        .article-related-card-body { padding: 1rem 1.15rem 1.25rem; }
        .article-related-card-category { color: var(--accent); font-weight: 700; font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 0.4rem; }
        .article-related-card-title { font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; color: #111827; line-height: 1.4; margin: 0; }

        @media (max-width: 720px) {
          .article-content-wrap { padding: 2.5rem 1.25rem 3.5rem; }
          .article-body { padding: 1.75rem; }
          .article-nav { grid-template-columns: 1fr; }
          .article-related-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="article-page">
        <div className="article-banner" data-nav-theme="dark">
          <img src={post.image} alt={post.title} />
          <div className="article-banner-content">
            <p className="article-category">{post.category}</p>
            <h1 className="article-title">{post.title}</h1>
            <div className="article-meta-row">
              <span><LuUserRound /> By {post.author}</span>
              <span><LuCalendarDays /> {post.date}</span>
              <span><LuClock /> {post.readTime}</span>
              <span><LuMessageCircle /> {String(post.comments).padStart(2, '0')} Comments</span>
            </div>
          </div>
        </div>

        <div className="article-content-wrap" data-nav-theme="light">
          <p className="article-breadcrumb">
            <Link to="/">Home</Link> / <Link to="/news">News</Link> / <span>{post.title}</span>
          </p>

          <Link to="/news" className="article-back-link">
            <LuArrowLeft /> Back to all articles
          </Link>

          <div className="article-body">
            {post.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {(prevPost || nextPost) && (
            <div className="article-nav">
              {prevPost ? (
                <Link to={`/news/${prevPost.slug}`} className="article-nav-link prev">
                  <span className="article-nav-label"><LuArrowLeft /> Previous</span>
                  <span className="article-nav-title">{prevPost.title}</span>
                </Link>
              ) : <span />}
              {nextPost ? (
                <Link to={`/news/${nextPost.slug}`} className="article-nav-link next">
                  <span className="article-nav-label">Next <LuArrowRight /></span>
                  <span className="article-nav-title">{nextPost.title}</span>
                </Link>
              ) : <span />}
            </div>
          )}

          {fallbackRelated.length > 0 && (
            <div className="article-related">
              <h2 className="article-related-heading">You Might Also Like</h2>
              <div className="article-related-grid">
                {fallbackRelated.map((rp) => (
                  <Link key={rp.slug} to={`/news/${rp.slug}`} className="article-related-card">
                    <img src={rp.image} alt={rp.title} />
                    <div className="article-related-card-body">
                      <p className="article-related-card-category">{rp.category}</p>
                      <h3 className="article-related-card-title">{rp.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default NewsArticle;
