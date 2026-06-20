import { useState, useEffect, useMemo } from 'react';
import { FaBrain, FaChartLine, FaProjectDiagram, FaStar, FaLightbulb, FaRobot, FaFileExcel, FaFilePdf, FaGlobeAfrica, FaTag, FaSpinner } from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import { constructionService } from '../../services/constructionService';
import { mlService } from '../../services/mlService';
import type { ProjectEffectivenessResult } from '../../services/mlService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LeadScore {
    name: string; email: string; company: string; score: number; category: string; visits?: number;
}

interface ProjectInsight {
    name: string; effectiveness: number; status: string; type: string;
}

interface MLStatus {
    projectEffectiveness: 'idle' | 'loading' | 'loaded' | 'error';
    messageClassify: 'idle' | 'loading' | 'done' | 'error';
}

const MlInsights = () => {
    const { showToast } = useToast();
    const [visitorStats, setVisitorStats] = useState<any>(null);
    const [projectEffectiveness, setProjectEffectiveness] = useState<ProjectInsight[]>([]);
    const [mlStatus, setMlStatus] = useState<MLStatus>({ projectEffectiveness: 'idle', messageClassify: 'idle' });
    const [forecast, setForecast] = useState<{ trend: string; growth_rate: number; forecast: number[]; confidence: string } | null>(null);
    const [classifyInput, setClassifyInput] = useState('');
    const [classification, setClassification] = useState<{ category: string; confidence: number; label: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [vs, projRes] = await Promise.all([
                    profileService.getVisitorStats(),
                    constructionService.getProjects().catch(() => ({ data: [] })),
                ]);
                setVisitorStats(vs);

                const projects = projRes.data || [];
                if (projects.length > 0) {
                    setMlStatus(prev => ({ ...prev, projectEffectiveness: 'loading' }));
                    const results = await Promise.all(
                        projects.slice(0, 10).map(async (p: any) => {
                            try {
                                const result: ProjectEffectivenessResult = await mlService.predictProjectEffectiveness({
                                    name: p.name,
                                    description: p.description,
                                    category: p.type,
                                    hasUrl: !!p.images?.length,
                                    isFeatured: p.status === 'completed',
                                });
                                return {
                                    name: p.name,
                                    effectiveness: result.effectiveness_score,
                                    status: p.status || 'planning',
                                    type: p.type || 'construction',
                                };
                            } catch {
                                return {
                                    name: p.name,
                                    effectiveness: 50,
                                    status: p.status || 'planning',
                                    type: p.type || 'construction',
                                };
                            }
                        })
                    );
                    setProjectEffectiveness(results);
                    setMlStatus(prev => ({ ...prev, projectEffectiveness: 'loaded' }));
                } else {
                    setProjectEffectiveness([
                        { name: 'Commercial Buildings', effectiveness: 92, status: 'completed', type: 'construction' },
                        { name: 'Residential Complex', effectiveness: 78, status: 'in_progress', type: 'construction' },
                        { name: 'Office Renovation', effectiveness: 88, status: 'completed', type: 'renovation' },
                        { name: 'Highway Bridge', effectiveness: 65, status: 'in_progress', type: 'construction' },
                    ]);
                    setMlStatus(prev => ({ ...prev, projectEffectiveness: 'loaded' }));
                }

                if (vs?.last7Days != null && vs?.last30Days != null) {
                    const trendResult = await mlService.forecastVisitorTrend([vs.today || 0, vs.last7Days || 0, vs.last30Days || 0]);
                    setForecast(trendResult);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const leadScores: LeadScore[] = useMemo(() => {
        if (!visitorStats?.companies?.length) return [];
        const grouped: Record<string, number> = {};
        visitorStats.companies.forEach((c: any) => {
            const name = (c.company || '').trim().toLowerCase();
            if (name) grouped[name] = (grouped[name] || 0) + c.count;
        });
        const entries = Object.entries(grouped).map(([name, count]) => ({ name, count }));
        const maxCount = Math.max(...entries.map(x => x.count));
        return entries.map(c => ({
            name: c.name,
            email: '',
            company: c.name,
            score: Math.min(100, Math.round((c.count / maxCount) * 100)),
            category: c.count > 5 ? 'hot' : c.count > 2 ? 'warm' : 'cold',
            visits: c.count,
        })).sort((a: any, b: any) => b.score - a.score);
    }, [visitorStats]);

    const visitorTrend = visitorStats ? [
        { label: 'Today', value: visitorStats.today },
        { label: 'Last 7 Days', value: visitorStats.last7Days },
        { label: 'Last 30 Days', value: visitorStats.last30Days },
        { label: 'Total', value: visitorStats.total },
    ] : [];

    const stats = useMemo(() => ({
        totalLeads: leadScores.length,
        hotLeads: leadScores.filter(l => l.category === 'hot').length,
        warmLeads: leadScores.filter(l => l.category === 'warm').length,
        coldLeads: leadScores.filter(l => l.category === 'cold').length,
        avgEffectiveness: projectEffectiveness.length > 0
            ? Math.round(projectEffectiveness.reduce((s, p) => s + p.effectiveness, 0) / projectEffectiveness.length)
            : 0,
        todayVisitors: visitorStats?.today || 0,
    }), [leadScores, visitorStats]);

    const leadTableData = useMemo(() => leadScores.map((l, i) => [
        String(i + 1), l.company || 'Unknown', `${l.score}%`, l.category,
        String(l.visits || 0),
    ]), [leadScores, visitorStats]);

    const projectTableData = useMemo(() => projectEffectiveness.map((p, i) => [
        String(i + 1), p.name, p.type, p.status, `${p.effectiveness}%`,
    ]), [projectEffectiveness]);

    const downloadLeadPDF = () => {
        const doc = new jsPDF();
        const brown = '#8B4513';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });
        doc.setDrawColor(brown); doc.setLineWidth(0.8); doc.line(14, 34, pageW - 14, 34);

        doc.setFontSize(13); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('Lead Scoring Report', 14, 40);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 14, 40, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Company', 'Score', 'Category', 'Visits']],
            body: leadTableData,
            startY: 46,
            styles: { fontSize: 9, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
            didDrawPage: (data: any) => {
                doc.setDrawColor(brown); doc.setLineWidth(0.5);
                doc.line(14, pageH - 20, pageW - 14, pageH - 20);
                doc.setFontSize(8); doc.setTextColor(brown); doc.setFont('helvetica', 'normal');
                doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
            },
        });

        doc.save('lead_scoring.pdf');
    };

    const downloadLeadExcel = () => {
        const brown = '#8B4513';
        const headers = ['#', 'Company', 'Score', 'Category', 'Visits'];
        const rows = leadTableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0"><span>Lead Scoring Report</span><span>${new Date().toLocaleDateString()}</span></div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                <tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>${rows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
        </body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'lead_scoring.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    const downloadProjectPDF = () => {
        const doc = new jsPDF();
        const brown = '#8B4513';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });
        doc.setDrawColor(brown); doc.setLineWidth(0.8); doc.line(14, 34, pageW - 14, 34);

        doc.setFontSize(13); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('Project Effectiveness Report', 14, 40);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 14, 40, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Project', 'Type', 'Status', 'Effectiveness']],
            body: projectTableData,
            startY: 46,
            styles: { fontSize: 9, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
            didDrawPage: (data: any) => {
                doc.setDrawColor(brown); doc.setLineWidth(0.5);
                doc.line(14, pageH - 20, pageW - 14, pageH - 20);
                doc.setFontSize(8); doc.setTextColor(brown); doc.setFont('helvetica', 'normal');
                doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
            },
        });

        doc.save('project_effectiveness.pdf');
    };

    const downloadProjectExcel = () => {
        const brown = '#8B4513';
        const headers = ['#', 'Project', 'Type', 'Status', 'Effectiveness'];
        const rows = projectTableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0"><span>Project Effectiveness Report</span><span>${new Date().toLocaleDateString()}</span></div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                <tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>${rows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
        </body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'project_effectiveness.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="admin-page"><div className="inline-spinner">Loading insights...</div></div>;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaBrain style={{ color: 'var(--primary)' }} /> ML Insights
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.totalLeads}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Leads</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.hotLeads}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Hot</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.warmLeads}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Warm</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.coldLeads}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Cold</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.avgEffectiveness}%</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Avg Effectiveness</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.todayVisitors}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Today Visitors</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaStar style={{ color: '#f59e0b' }} />
                            <h3 style={{ margin: 0 }}>Lead Scoring</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="admin-btn" onClick={downloadLeadExcel} disabled={leadScores.length === 0} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, opacity: leadScores.length > 0 ? 1 : 0.5 }}>
                                <FaFileExcel /> Excel
                            </button>
                            <button className="admin-btn" onClick={downloadLeadPDF} disabled={leadScores.length === 0} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, opacity: leadScores.length > 0 ? 1 : 0.5 }}>
                                <FaFilePdf /> PDF
                            </button>
                        </div>
                    </div>
                    {leadScores.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Company</th><th>Score</th><th>Category</th><th>Visits</th></tr></thead>
                                <tbody>
                                    {leadScores.map((lead, i) => (
                                        <tr key={i}>
                                            <td><strong>{lead.company || 'Unknown'}</strong></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border-color)', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${lead.score}%`, height: '100%', borderRadius: 3,
                                                            background: lead.score >= 70 ? '#22c55e' : lead.score >= 40 ? '#f59e0b' : '#ef4444',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{lead.score}%</span>
                                                </div>
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                                    background: lead.category === 'hot' ? 'rgba(34,197,94,0.15)' : lead.category === 'warm' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: lead.category === 'hot' ? '#22c55e' : lead.category === 'warm' ? '#f59e0b' : '#ef4444',
                                                }}>{lead.category}</span>
                                            </td>
                                            <td>{lead.visits || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <FaRobot size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-muted)' }}>No lead data available yet. Visitor data will populate lead scores.</p>
                        </div>
                    )}
                </div>

                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaProjectDiagram style={{ color: 'var(--primary)' }} />
                            <h3 style={{ margin: 0 }}>Project Effectiveness</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="admin-btn" onClick={downloadProjectExcel} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FaFileExcel /> Excel
                            </button>
                            <button className="admin-btn" onClick={downloadProjectPDF} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FaFilePdf /> PDF
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Effectiveness</th></tr></thead>
                            <tbody>
                                {projectEffectiveness.map((p, i) => (
                                    <tr key={i}>
                                        <td><strong>{p.name}</strong></td>
                                        <td style={{ textTransform: 'capitalize' }}>{p.type}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                                color: '#fff', background: p.status === 'completed' ? '#22c55e' : p.status === 'in_progress' ? '#3b82f6' : '#6b7280',
                                            }}>{p.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 100, height: 6, borderRadius: 3, background: 'var(--border-color)', overflow: 'hidden' }}>
                                                    <div style={{ width: `${p.effectiveness}%`, height: '100%', borderRadius: 3, background: p.effectiveness >= 80 ? '#22c55e' : p.effectiveness >= 60 ? '#f59e0b' : '#ef4444' }} />
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.effectiveness}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 8, background: 'rgba(123,192,67,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaLightbulb style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <strong>Insight:</strong> Projects with effectiveness below 70% may benefit from additional resource allocation and timeline review.
                        </span>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <FaChartLine style={{ color: 'var(--primary)' }} />
                    <h3 style={{ margin: 0 }}>Visitor Trends</h3>
                </div>
                {visitorTrend.length > 0 ? (
                    <>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {visitorTrend.map(t => (
                                <div key={t.label} className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t.value}</div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{t.label}</div>
                                </div>
                            ))}
                        </div>
                        {forecast && (
                            <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(139,69,19,0.06)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <FaChartLine style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <strong>ML Forecast:</strong> Trend is <strong style={{ color: forecast.trend === 'up' ? '#22c55e' : forecast.trend === 'down' ? '#ef4444' : '#f59e0b' }}>{forecast.trend}</strong>
                                    {forecast.growth_rate !== 0 && <> ({forecast.growth_rate > 0 ? '+' : ''}{forecast.growth_rate.toFixed(1)}% growth rate)</>}
                                    {' '}(confidence: {forecast.confidence})
                                </span>
                            </div>
                        )}
                        {visitorStats?.locations && visitorStats.locations.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FaGlobeAfrica style={{ color: 'var(--primary)' }} /> Top Locations
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {visitorStats.locations.slice(0, 5).map((loc: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem', borderRadius: 6, background: 'var(--bg-body)', fontSize: '0.9rem' }}>
                                            <span>{loc.location}</span>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{loc.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <FaRobot size={48} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)' }}>Visitor trend data will appear once tracking is active.</p>
                    </div>
                )}
            </div>

            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <FaTag style={{ color: 'var(--primary)' }} />
                    <h3 style={{ margin: 0 }}>Message Classification (ML)</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Paste a contact message below to classify it using the Python ML service.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <textarea
                        value={classifyInput}
                        onChange={e => setClassifyInput(e.target.value)}
                        placeholder="Paste a message to classify..."
                        rows={3}
                        style={{
                            flex: 1, minWidth: 200, padding: '0.6rem', borderRadius: 6,
                            border: '1px solid var(--border-color)', background: 'var(--bg-body)',
                            color: 'var(--text-main)', fontSize: '0.85rem', resize: 'vertical',
                        }}
                    />
                    <button
                        className="btn-primary"
                        style={{ background: '#8B4513', alignSelf: 'flex-end', padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
                        disabled={mlStatus.messageClassify === 'loading' || !classifyInput.trim()}
                        onClick={async () => {
                            if (!classifyInput.trim()) return;
                            setMlStatus(prev => ({ ...prev, messageClassify: 'loading' }));
                            try {
                                const result = await mlService.classifyMessage(classifyInput.trim());
                                setClassification(result);
                                setMlStatus(prev => ({ ...prev, messageClassify: 'done' }));
                            } catch {
                                setMlStatus(prev => ({ ...prev, messageClassify: 'error' }));
                                showToast('Failed to classify message', 'error');
                            }
                        }}
                    >
                        {mlStatus.messageClassify === 'loading' ? <><FaSpinner className="fa-spin" /> Classifying...</> : 'Classify'}
                    </button>
                </div>
                {classification && (
                    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 8, background: 'rgba(139,69,19,0.06)', border: '1px solid rgba(139,69,19,0.2)' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{classification.category}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: classification.confidence > 0.7 ? '#22c55e' : classification.confidence > 0.4 ? '#f59e0b' : '#ef4444' }}>
                                    {(classification.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Label</span>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{classification.label}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MlInsights;
