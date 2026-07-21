import { useState, useEffect, useRef, useMemo } from 'react';
import { FaFileContract, FaUser, FaBuilding, FaCalendarAlt, FaMoneyBillWave, FaFilePdf, FaEye, FaPrint, FaSave, FaArrowLeft, FaCheck, FaSpinner, FaPlus, FaTimes as FaTimesIcon, FaFileAlt, FaHandshake, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';
import { contractsService } from '../../services/contractsService';
import { authService } from '../../services/authService';
import { profileService, type Profile } from '../../services/profileService';
import { insuranceService, type InsuranceSetting } from '../../services/insuranceService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';

const CONTRACT_TYPES = ['permanent', 'fixed_term', 'internship', 'contractor'];
const DEPARTMENTS = ['ADMIN', 'CONSTRUCTION', 'DESIGN', 'FINANCE', 'HR', 'SALES', 'ENGINEERING', 'OTHER'];
const PAYMENT_FREQUENCIES = ['monthly', 'bi-weekly', 'weekly', 'daily'];

const COMPANY_NAME = 'MUHIZI CONSTRUCTION';
const COMPANY_ADDRESS = 'Kigali, Rwanda';
const COMPANY_PHONE = '+250 788 000 000';
const COMPANY_EMAIL = 'info@muhiziconstruction.rw';
const CEO_NAME = 'UWIMANA Papias';
const CEO_TITLE = 'Founder (CEO) & Director of Finance';

const DEFAULT_RULES = `1. WORKING HOURS & SCHEDULE
The Company working hours are from 8:00 AM to 5:00 PM, Monday through Friday, with a one-hour lunch break from 12:00 PM to 1:00 PM. Saturday work may be required as needed and will be compensated accordingly. All employees are expected to arrive on time and be ready to work at the designated start time.

2. CODE OF CONDUCT
All employees shall conduct themselves in a professional manner at all times while on company premises or representing the company. This includes but is not limited to: maintaining a respectful workplace, following safety protocols, wearing appropriate personal protective equipment (PPE) as required, and refraining from any behavior that may endanger themselves or others.

3. ATTENDANCE & LEAVE POLICY
Employees must report any absence or tardiness to their immediate supervisor prior to the start of their shift. Annual leave entitlement is as per Rwandan labor law. Sick leave requires a medical certificate for absences exceeding two (2) consecutive days. Personal leave must be requested at least seven (7) days in advance.

4. HEALTH & SAFETY
The Company is committed to providing a safe working environment. All employees must comply with all safety rules, use provided protective equipment, and report any hazards or incidents immediately. Failure to comply with safety regulations may result in disciplinary action.

5. CONFIDENTIALITY
Employees shall not disclose any confidential company information, trade secrets, client data, or proprietary methods to any third party during or after employment without written authorization from management.

6. PROPERTY & EQUIPMENT
All company property, tools, equipment, and vehicles issued to employees must be used solely for company business. Employees are responsible for the proper care and maintenance of assigned equipment. Any loss or damage due to negligence must be compensated by the employee.

7. GRIEVANCE PROCEDURE
Any workplace concerns or grievances should be reported to the immediate supervisor. If unresolved, the matter may be escalated to the Human Resources department and subsequently to senior management.

8. TERMINATION
Either party may terminate this contract with written notice as stipulated in the employment terms below. The Company reserves the right to terminate employment for cause including, but not limited to, gross misconduct, repeated violation of company policies, or poor performance.`;

const DEFAULT_WORKING_CONDITIONS = `The Employee shall perform duties assigned by the Company at designated work sites as per project requirements. The Company may transfer the Employee to different project sites based on operational needs. All work shall be performed professionally and in accordance with applicable Rwandan labor laws and construction industry standards.`;

interface ContractEmployee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    nationalId?: string;
    gender?: string;
    educationLevel?: string;
    maritalStatus?: string;
    employmentCategory?: string;
    workShift?: string;
    medicalInsurance?: string;
    bankAccount?: string;
    role?: string;
    position?: string;
    department?: string;
    salary?: number;
    basicSalary?: number;
    profile?: { firstName?: string; lastName?: string; phone?: string; avatar?: string };
}

interface ContractForm {
    employeeId: string;
    employeeName: string;
    department: string;
    contractType: string;
    startDate: string;
    endDate: string;
    basicSalary: string;
    netSalary: string;
    paymentFrequency: string;
    rulesAndRegulations: string;
    workingConditions: string;
}

const emptyForm: ContractForm = {
    employeeId: '', employeeName: '', department: 'CONSTRUCTION', contractType: 'permanent',
    startDate: '', endDate: '', basicSalary: '', netSalary: '',
    paymentFrequency: 'monthly', rulesAndRegulations: DEFAULT_RULES, workingConditions: DEFAULT_WORKING_CONDITIONS,
};

const InfoCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.2rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            {icon}{title}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{children}</div>
    </div>
);

const CreateContract = () => {
    const { showToast } = useToast();
    const [employees, setEmployees] = useState<ContractEmployee[]>([]);
    const [form, setForm] = useState<ContractForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [insuranceSettings, setInsuranceSettings] = useState<InsuranceSetting[]>([]);
    const [totalDeduction, setTotalDeduction] = useState(0);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        authService.getAllUsers().then((data: any[]) => {
            setEmployees(data.filter((u: any) => u.employmentStatus === 'employed'));
        }).catch(() => {});
        profileService.getPublicProfile().then(r => setProfile(r.data || r)).catch(() => {});
        insuranceService.getActive().then(res => {
            setInsuranceSettings(res.data);
        }).catch(() => {});
        insuranceService.getDeduction().then(res => {
            setTotalDeduction(res.data.totalDeduction || 0);
        }).catch(() => {});
    }, []);

    const selectedEmployee = useMemo(() =>
        employees.find(e => e.id === form.employeeId),
        [employees, form.employeeId]
    );

    const handleEmployeeSelect = (empId: string) => {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
            const basic = emp.salary || emp.basicSalary || 0;
            const net = basic > 0 ? Math.max(0, basic - totalDeduction) : 0;
            setForm(p => ({
                ...p,
                employeeId: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                department: emp.department || emp.employmentCategory?.toUpperCase() || 'CONSTRUCTION',
                basicSalary: String(basic || ''),
                netSalary: String(net || ''),
            }));
        }
    };

    const formatMoney = (val: string) => {
        const n = parseFloat(val);
        return isNaN(n) ? '0' : n.toLocaleString('en-RW');
    };

    const buildContractText = (): string => {
        const start = form.startDate ? new Date(form.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '________';
        const end = form.endDate ? new Date(form.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Indefinite';
        const basic = formatMoney(form.basicSalary);
        const net = formatMoney(form.netSalary);
        const typeLabel = form.contractType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return `This Employment Contract ("Agreement") is entered into on ${start}, between:

THE EMPLOYER:
${COMPANY_NAME}
${COMPANY_ADDRESS}
Phone: ${COMPANY_PHONE}
Email: ${COMPANY_EMAIL}

AND THE EMPLOYEE:
Name: ${form.employeeName || '________________________________'}
Position: ${selectedEmployee?.position || '________________________________'}
Department: ${form.department}
National ID: ${selectedEmployee?.nationalId || '________________________________'}
Phone: ${selectedEmployee?.phone || '________________________________'}
Address: ${selectedEmployee?.address || '________________________________'}

TERMS AND CONDITIONS:

1. CONTRACT TYPE
${typeLabel}

2. DURATION
Start Date: ${start}
End Date: ${end}

3. COMPENSATION
Basic Salary: RWF ${basic} per ${form.paymentFrequency}
Net Salary: RWF ${net} per ${form.paymentFrequency}
The salary shall be paid through bank transfer on the last working day of each ${form.paymentFrequency} period.

4. HEALTH INSURANCE BENEFITS
The Company shall provide the Employee with health insurance coverage through ${insuranceSettings.length > 0 ? insuranceSettings.map(s => s.label).join(', ') : 'the applicable company insurance scheme'}. The details of the insurance coverage are as follows:

${insuranceSettings.length > 0 ? insuranceSettings.map(s => `   - Provider: ${s.provider} (${s.label})
   - Monthly Employee Deduction: RWF ${Number(s.employeeAmount).toLocaleString('en-RW')}
   - Monthly Employer Contribution: RWF ${Number(s.employerAmount).toLocaleString('en-RW')}`).join('\n') : '   - Insurance details to be confirmed upon enrollment.'}

The total monthly insurance deduction of RWF ${totalDeduction.toLocaleString('en-RW')} has been factored into the Net Salary calculation above.

HOUSEHOLD MEMBER COVERAGE:
The Employee's company-paid health insurance coverage may be extended to household members, defined as the Employee's lawful spouse (Husband or Wife) and dependent children, subject to the following conditions:
   a) The extension applies only to persons who are recognized as the Employee's household members (dependents) under applicable Rwandan family law.
   b) Eligible household members are limited to: the Employee's Husband or Wife (lawful spouse), and Children (biological or legally adopted) who are dependents of the Employee.
   c) Any additional premium or cost incurred by the Company for extending coverage to household members shall be subject to separate agreement between the Employee and the Company.
   d) The Employee must submit proper documentation (marriage certificate for spouse, birth certificates for children) to the Human Resources department to activate household member coverage.
   e) The Company reserves the right to modify the terms of household member coverage in accordance with changes to insurance provider policies or applicable law.

5. OTHER BENEFITS
The Employee shall be entitled to additional benefits as per company policy and Rwandan labor law, including but not limited to: annual leave, public holidays, and any other statutory entitlements.

6. WORKING CONDITIONS
${form.workingConditions}

7. RULES AND REGULATIONS
${form.rulesAndRegulations}

8. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the Republic of Rwanda.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.`;
    };

    const buildFooterText = (): string => {
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        return `Signed on ${today}

EMPLOYEE:                                    EMPLOYER:

_________________________                    _________________________
${form.employeeName || ''}                  ${CEO_NAME}
                                               ${CEO_TITLE}
Date: ____/____/______                        Date: ${today}

                                               ${COMPANY_NAME}
                                               ${COMPANY_ADDRESS}
                                               Tel: ${COMPANY_PHONE}`;
    };

    const generatePDF = (): jsPDF => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentW = pageW - margin * 2;
        let y = margin;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(COMPANY_NAME, pageW / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${COMPANY_ADDRESS}  |  Tel: ${COMPANY_PHONE}  |  ${COMPANY_EMAIL}`, pageW / 2, y, { align: 'center' });
        y += 5;
        doc.setDrawColor(27, 32, 66);
        doc.setLineWidth(0.8);
        doc.line(margin, y, pageW - margin, y);
        y += 4;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EMPLOYMENT CONTRACT', pageW / 2, y, { align: 'center' });
        y += 10;

        const text = buildContractText();
        const lines = text.split('\n');

        doc.setFontSize(10);
        for (const line of lines) {
            if (y > 270) { doc.addPage(); y = margin; }
            if (line.match(/^\d+\.\s[A-Z]/)) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text(line, margin, y);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                y += 5;
            } else if (line.startsWith('   ')) {
                doc.text(line.trim(), margin + 3, y);
                y += 4.5;
            } else if (line === '') {
                y += 3;
            } else {
                const split = doc.splitTextToSize(line, contentW);
                doc.text(split, margin, y);
                y += split.length * 4.5;
            }
        }

        if (y > 220) { doc.addPage(); y = margin; }
        y += 8;
        doc.setDrawColor(27, 32, 66);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('SIGNATURES & STAMP', pageW / 2, y, { align: 'center' });
        y += 12;

        const footerText = buildFooterText();
        const footerLines = footerText.split('\n');
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        for (const line of footerLines) {
            if (y > 270) { doc.addPage(); y = margin; }
            if (line.includes('_________________________')) {
                doc.text('_________________________', margin, y);
                doc.text('_________________________', pageW / 2 + 5, y);
                y += 5;
            } else if (line.includes('EMPLOYEE:') || line.includes('EMPLOYER:')) {
                doc.setFont('helvetica', 'bold');
                doc.text(line.trim(), pageW / 2, y, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                y += 6;
            } else if (line.trim() === '') {
                y += 3;
            } else {
                const parts = line.split('                    ').filter(Boolean);
                if (parts.length >= 2) {
                    doc.text(parts[0].trim(), margin, y);
                    doc.text(parts[1].trim(), pageW / 2 + 5, y);
                } else {
                    doc.text(line.trim(), margin, y);
                }
                y += 5;
            }
        }

        y += 5;
        doc.setDrawColor(27, 32, 66);
        doc.setLineWidth(0.3);
        doc.roundedRect(pageW / 2 + 5, y, 55, 30, 2, 2);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Company Stamp', pageW / 2 + 32.5, y + 18, { align: 'center' });

        return doc;
    };

    const handleDownload = () => {
        const doc = generatePDF();
        doc.save(`Contract_${form.employeeName.replace(/\s+/g, '_')}_${form.startDate}.pdf`);
        showToast('Contract PDF downloaded', 'success');
    };

    const handleSave = async () => {
        if (!form.employeeId || !form.startDate || !form.basicSalary) {
            showToast('Please fill in employee, start date, and salary', 'error');
            return;
        }
        setSaving(true);
        try {
            const doc = generatePDF();
            const pdfBlob = doc.output('blob');
            const body = buildContractText();
            const footer = buildFooterText();
            const title = `Employment Contract - ${form.employeeName}`;

            await contractsService.create({
                title, employeeId: form.employeeId, employeeName: form.employeeName,
                department: form.department, type: form.contractType,
                startDate: form.startDate, endDate: form.endDate || undefined,
                status: 'active', basicSalary: parseFloat(form.basicSalary),
                netSalary: parseFloat(form.netSalary) || 0,
                paymentFrequency: form.paymentFrequency,
                workingConditions: form.workingConditions,
                body, footer, fileSize: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
            });
            showToast('Contract saved successfully', 'success');
            setShowFormModal(false);
            setShowPreview(true);
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to save contract', 'error');
        } finally {
            setSaving(false);
        }
    };

    const headerBg = '#1B2042';
    const accentGold = '#d4a853';

    return (
        <div className="admin-page">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.3rem 0' }}>
                        <FaFileContract style={{ color: 'var(--primary)' }} /> Employment Contracts
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Manage and generate employment agreements for MUHIZI CONSTRUCTION employees.</p>
                </div>
                <button className="admin-btn" onClick={() => { setForm(emptyForm); setShowFormModal(true); }} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaPlus /> Create Contract
                </button>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <InfoCard icon={<FaFileAlt style={{ color: '#3b82f6' }} />} title="Employment Agreements">
                    Every employment contract issued by MUHIZI CONSTRUCTION is a legally binding agreement between the company and the employee. It outlines the terms of employment, compensation, working conditions, and company policies in compliance with Rwandan labor law.
                </InfoCard>
                <InfoCard icon={<FaHandshake style={{ color: '#22c55e' }} />} title="Mutual Obligations">
                    Both the employer and employee have defined responsibilities. The company commits to providing fair compensation, a safe work environment, and statutory benefits. The employee agrees to perform duties diligently, follow company rules, and maintain professional standards.
                </InfoCard>
                <InfoCard icon={<FaShieldAlt style={{ color: '#f59e0b' }} />} title="Legal Compliance">
                    All contracts are governed by the laws of the Republic of Rwanda. Termination, dispute resolution, and employee rights are handled in accordance with applicable labor statutes. Contracts should be reviewed periodically and updated as needed.
                </InfoCard>
            </div>

            {/* Contract Preview */}
            {showPreview && form.employeeId && (
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}><FaEye style={{ color: 'var(--primary)' }} /> Contract Preview — {form.employeeName}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={handleDownload}><FaPrint style={{ marginRight: 4 }} /> Download PDF</button>
                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => { setShowPreview(false); }}><FaArrowLeft style={{ marginRight: 4 }} /> Back</button>
                        </div>
                    </div>

                    <div ref={previewRef} style={{ padding: '0', fontFamily: "'Georgia', serif", fontSize: '0.88rem', lineHeight: 1.75, color: '#222' }}>
                        {/* Styled Header */}
                        <div style={{ background: headerBg, color: '#fff', padding: '2rem 2.5rem 1.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8 }}>
                                {profile?.companyLogo && <img src={profile.companyLogo} alt="Logo" style={{ height: 48, width: 48, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />}
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: 2, color: '#fff' }}>{COMPANY_NAME}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', letterSpacing: 1, textTransform: 'uppercase' }}>Building Rwanda's Future</div>
                                </div>
                            </div>
                            <div style={{ width: 60, height: 2, background: accentGold, margin: '0 auto 10px' }} />
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                {COMPANY_ADDRESS} &nbsp;|&nbsp; Tel: {COMPANY_PHONE} &nbsp;|&nbsp; {COMPANY_EMAIL}
                            </div>
                        </div>

                        {/* Title Bar */}
                        <div style={{ background: '#f8f8f8', borderBottom: `2px solid ${headerBg}`, padding: '0.8rem 2.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: headerBg }}>Employment Contract</div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.8rem 2.5rem', whiteSpace: 'pre-wrap' }}>
                            {buildContractText().split('\n').map((line, i) => {
                                if (line.match(/^\d+\.\s[A-Z]/)) return <div key={i} style={{ fontWeight: 700, marginTop: 14, color: headerBg, fontSize: '0.9rem' }}>{line}</div>;
                                if (line.startsWith('THE EMPLOYER:') || line.startsWith('AND THE EMPLOYEE:') || line.startsWith('TERMS AND CONDITIONS:')) return <div key={i} style={{ fontWeight: 700, marginTop: 14, color: '#333' }}>{line}</div>;
                                if (line.startsWith('   ')) return <div key={i} style={{ paddingLeft: 16, color: '#444' }}>{line.trim()}</div>;
                                if (line === '') return <div key={i} style={{ height: 4 }} />;
                                return <div key={i} style={{ color: '#333' }}>{line}</div>;
                            })}
                        </div>

                        {/* Signature Footer */}
                        <div style={{ borderTop: `2px solid ${headerBg}`, margin: '0 2.5rem', paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
                            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: headerBg, marginBottom: 20, letterSpacing: 1 }}>SIGNATURES & STAMP</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '0 1rem' }}>
                                {/* Employee Side */}
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', marginBottom: 40 }}>EMPLOYEE</div>
                                    <div style={{ borderTop: '1px solid #999', paddingTop: 6, fontSize: '0.8rem', color: '#444' }}>
                                        <div style={{ fontWeight: 600 }}>{form.employeeName}</div>
                                        <div>{selectedEmployee?.position || ''}</div>
                                    </div>
                                    <div style={{ marginTop: 20, fontSize: '0.8rem', color: '#666' }}>Date: ____/____/______</div>
                                </div>
                                {/* Employer Side */}
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', marginBottom: 40 }}>EMPLOYER</div>
                                    <div style={{ borderTop: '1px solid #999', paddingTop: 6, fontSize: '0.8rem', color: '#444' }}>
                                        <div style={{ fontWeight: 600 }}>{CEO_NAME}</div>
                                        <div>{CEO_TITLE}</div>
                                        <div style={{ marginTop: 4, color: '#666' }}>{COMPANY_NAME}</div>
                                        <div style={{ color: '#666' }}>{COMPANY_ADDRESS}</div>
                                        <div style={{ color: '#666' }}>Tel: {COMPANY_PHONE}</div>
                                    </div>
                                    <div style={{ marginTop: 20, fontSize: '0.8rem', color: '#666' }}>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>
                            {/* Stamp */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingRight: '1rem' }}>
                                <div style={{ border: `1px solid ${headerBg}`, borderRadius: 6, width: 120, height: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '0.7rem', fontStyle: 'italic', background: '#fafafa' }}>
                                    Company Stamp
                                </div>
                            </div>
                        </div>

                        {/* Bottom accent */}
                        <div style={{ height: 6, background: `linear-gradient(90deg, ${headerBg}, ${accentGold})` }} />
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showFormModal && (
                <div className="admin-modal-overlay" onClick={() => setShowFormModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header">
                            <h3><FaFileContract style={{ marginRight: 8 }} /> New Employment Contract</h3>
                            <button onClick={() => setShowFormModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaUser size={11} /> Select Employee *</label>
                                    <select className="form-select" value={form.employeeId} onChange={e => handleEmployeeSelect(e.target.value)}>
                                        <option value="">-- Choose Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.position || emp.department || emp.role || ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBuilding size={11} /> Department</label>
                                    <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Contract Type</label>
                                    <select className="form-select" value={form.contractType} onChange={e => setForm(p => ({ ...p, contractType: e.target.value }))}>
                                        {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Frequency</label>
                                    <select className="form-select" value={form.paymentFrequency} onChange={e => setForm(p => ({ ...p, paymentFrequency: e.target.value }))}>
                                        {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f.replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaCalendarAlt size={11} /> Start Date *</label>
                                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaCalendarAlt size={11} /> End Date (blank = indefinite)</label>
                                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaMoneyBillWave size={11} /> Basic Salary (RWF) *</label>
                                    <input type="number" className="form-input" value={form.basicSalary} onChange={e => setForm(p => ({ ...p, basicSalary: e.target.value }))} placeholder="e.g. 500000" />
                                    {form.basicSalary && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RWF {formatMoney(form.basicSalary)}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaMoneyBillWave size={11} /> Net Salary (RWF)</label>
                                    <input type="number" className="form-input" value={form.netSalary} onChange={e => setForm(p => ({ ...p, netSalary: e.target.value }))} placeholder="e.g. 425000" />
                                    {form.netSalary && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RWF {formatMoney(form.netSalary)}</span>}
                                </div>

                                {selectedEmployee && (
                                    <div style={{ gridColumn: '1 / -1', background: 'var(--bg-body)', borderRadius: 8, padding: '0.8rem 1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem 1.2rem', fontSize: '0.82rem' }}>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Full Name</strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Email</strong>{selectedEmployee.email || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Phone</strong>{selectedEmployee.phone || selectedEmployee.profile?.phone || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>National ID</strong>{selectedEmployee.nationalId || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Gender</strong>{selectedEmployee.gender || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Address</strong>{selectedEmployee.address || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Role</strong>{selectedEmployee.role?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Education</strong>{selectedEmployee.educationLevel || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Employment Category</strong>{selectedEmployee.employmentCategory || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Work Shift</strong>{selectedEmployee.workShift === 'day' ? 'Day Worker' : selectedEmployee.workShift === 'night' ? 'Night Worker' : '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Medical Insurance</strong>{selectedEmployee.medicalInsurance || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Bank Account</strong>{selectedEmployee.bankAccount || '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Basic Salary (RWF)</strong>{(selectedEmployee.salary || selectedEmployee.basicSalary) ? Number(selectedEmployee.salary || selectedEmployee.basicSalary).toLocaleString('en-RW') : '—'}</div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Insurance Deduction / Month</strong><span style={{ color: '#ef4444', fontWeight: 600 }}>RWF {totalDeduction.toLocaleString('en-RW')}</span></div>
                                            <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Net Salary (RWF)</strong><span style={{ color: '#22c55e', fontWeight: 600 }}>RWF {((selectedEmployee.salary || selectedEmployee.basicSalary || 0) - totalDeduction).toLocaleString('en-RW')}</span></div>
                                            <div style={{ gridColumn: '1 / -1', marginTop: 4, padding: '0.5rem 0.7rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                                                <div style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}><FaInfoCircle /> <strong>Household Coverage:</strong>&nbsp;This insurance can be extended to the employee's household members (Husband, Wife, Children) as dependents.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Working Conditions</label>
                                    <textarea className="form-input" rows={3} value={form.workingConditions} onChange={e => setForm(p => ({ ...p, workingConditions: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Rules & Regulations</label>
                                    <textarea className="form-input" rows={8} value={form.rulesAndRegulations} onChange={e => setForm(p => ({ ...p, rulesAndRegulations: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.82rem' }} />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                            <button className="admin-btn admin-btn--secondary" onClick={() => { if (form.employeeId) { handleDownload(); } }} disabled={!form.employeeId}><FaFilePdf style={{ marginRight: 4 }} /> Download PDF</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff' }}>
                                {saving ? <><FaSpinner className="animate-spin" style={{ marginRight: 4 }} /> Saving...</> : <><FaSave style={{ marginRight: 4 }} /> Save & Preview</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateContract;
