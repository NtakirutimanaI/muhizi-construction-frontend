import { useRef, useState, useEffect, useCallback } from 'react';
import { FaPen, FaUpload, FaEraser, FaCheck, FaTimes } from 'react-icons/fa';

interface ESignatureProps {
    value?: string;
    onChange: (dataUrl: string) => void;
    label?: string;
    width?: number;
    height?: number;
}

const ESignature = ({ value, onChange, label = 'Signature', width = 220, height = 80 }: ESignatureProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [mode, setMode] = useState<'draw' | 'upload'>('draw');
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        if (value) {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
            img.src = value;
        } else {
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [value]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode !== 'draw') return;
        setDrawing(true);
        lastPos.current = getPos(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || mode !== 'draw') return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !lastPos.current) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const endDraw = () => {
        setDrawing(false);
        lastPos.current = null;
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onChange('');
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const hasContent = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0);
        if (hasContent) onChange(canvas.toDataURL('image/png'));
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (!ctx || !canvas) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
                onChange(canvas.toDataURL('image/png'));
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: '0.75rem' }}>{label}</label>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                <div style={{ display: 'flex', gap: 2, padding: '3px 4px', background: '#faf9f7', borderBottom: '1px solid var(--border-color)' }}>
                    <button type="button" onClick={() => setMode('draw')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, background: mode === 'draw' ? 'var(--primary)' : 'transparent', color: mode === 'draw' ? '#fff' : 'var(--text-muted)' }}><FaPen size={8} /> Draw</button>
                    <button type="button" onClick={() => setMode('upload')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, background: mode === 'upload' ? 'var(--primary)' : 'transparent', color: mode === 'upload' ? '#fff' : 'var(--text-muted)' }}><FaUpload size={8} /> Upload</button>
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 5px', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: '0.65rem', background: 'transparent', color: 'var(--primary-red)' }}><FaEraser size={8} /> Clear</button>
                    <button type="button" onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 5px', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: '0.65rem', background: 'transparent', color: '#22c55e' }}><FaCheck size={8} /> Save</button>
                </div>
                <canvas ref={canvasRef} width={width * 2} height={height * 2} style={{ width: '100%', height, cursor: mode === 'draw' ? 'crosshair' : 'pointer', display: 'block', touchAction: 'none' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                {mode === 'upload' && <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} id={`sig-upload-${label}`} />}
                {mode === 'upload' && <label htmlFor={`sig-upload-${label}`} style={{ display: 'block', textAlign: 'center', padding: '4px', fontSize: '0.7rem', color: 'var(--primary)', cursor: 'pointer', background: '#faf9f7', borderTop: '1px solid var(--border-color)' }}>Click to choose image</label>}
            </div>
            {value && <div style={{ marginTop: 2, fontSize: '0.65rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 3 }}><FaCheck size={8} /> Signed</div>}
        </div>
    );
};

export default ESignature;
