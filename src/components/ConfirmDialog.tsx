interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onCancel}
        >
            <div className="content-card" style={{ width: '100%', maxWidth: 380, padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.6rem' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onCancel} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>{cancelLabel}</button>
                    <button onClick={onConfirm} className="btn-primary" style={{ background: 'var(--primary-red)', borderColor: 'var(--primary-red)' }}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
