import { useRef, useState, useEffect } from 'react';
import { FaUndo, FaTrash } from 'react-icons/fa';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    savedSignature?: string;
    width?: number;
    height?: number;
}

const SignaturePad = ({ onSave, savedSignature, width = 400, height = 150 }: SignaturePadProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (savedSignature) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                setHasDrawn(true);
                onSave(savedSignature);
            };
            img.src = savedSignature;
        }
    }, [savedSignature, width, height]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const pos = getPos(e);
        lastPoint.current = pos;
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx || !lastPoint.current) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPoint.current = pos;
    };

    const stopDraw = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPoint.current = null;
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL('image/png'));
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onSave('');
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
                style={{
                    width: '100%',
                    maxWidth: width,
                    height,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'crosshair',
                    background: '#fff',
                    touchAction: 'none',
                }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button type="button" onClick={clear} style={{ padding: '4px 10px', fontSize: '0.72rem', border: '1px solid #ef4444', background: '#ef444418', color: '#ef4444', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaTrash size={10} />Clear
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
