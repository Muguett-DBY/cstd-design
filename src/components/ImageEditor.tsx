import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, RotateCw, Type, X } from "lucide-react";

export function ImageEditor({
  src,
  onSave,
  onClose,
  onNotice,
}: {
  src: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
  onNotice: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<{ x: number; y: number; size: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [texts, setTexts] = useState<{ x: number; y: number; text: string }[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const isRotated = rotation === 90 || rotation === 270;
    canvas.width = isRotated ? img.height : img.width;
    canvas.height = isRotated ? img.width : img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
    if (crop) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 200, 0, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);
      ctx.restore();
    }
    for (const t of texts) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(t.text, t.x, t.y);
    }
    if (textPos && textInput) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(textInput, textPos.x, textPos.y);
    }
  }, [rotation, crop, texts, textPos, textInput]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    return () => { img.onload = null; };
  }, [src, draw]);

  useEffect(() => { draw(); }, [rotation, crop, texts, textPos, textInput, draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    if (textInput) {
      setTexts((prev) => [...prev, { x, y, text: textInput }]);
      setTextInput("");
    } else {
      setTextPos({ x, y });
    }
  };

  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleCrop = () => {
    if (crop) {
      setCrop(null);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const size = Math.min(canvas.width, canvas.height) * 0.6;
      setCrop({
        x: (canvas.width - size) / 2,
        y: (canvas.height - size) / 2,
        size,
      });
    }
  };

  const applyCrop = () => {
    if (!crop) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = crop.size;
    tempCanvas.height = crop.size;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, crop.x, crop.y, crop.size, crop.size, 0, 0, crop.size, crop.size);
    imageRef.current = tempCanvas as unknown as HTMLImageElement;
    setRotation(0);
    setCrop(null);
    draw();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      } else {
        onNotice("保存失败。");
      }
    }, "image/png");
  };

  return (
    <div className="image-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="图片编辑器">
      <div className="image-editor" onClick={(e) => e.stopPropagation()}>
        <div className="image-editor-toolbar">
          <button type="button" className="icon-button" onClick={handleRotate} title="旋转 90°">
            <RotateCw size={16} />
          </button>
          <button type="button" className="icon-button" onClick={crop ? applyCrop : handleCrop} title={crop ? "应用裁剪" : "方形裁剪"}>
            <Crop size={16} />
          </button>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="输入文字后点击图片添加..."
            className="image-editor-text-input"
            aria-label="文字"
          />
          <button type="button" className="icon-button" onClick={() => setTextInput("")} title="清除文字输入">
            <Type size={16} />
          </button>
          <span className="image-editor-spacer" />
          <button type="button" className="primary-button" onClick={handleSave}>保存</button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <div className="image-editor-canvas-wrapper">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="image-editor-canvas"
          />
        </div>
        <div className="image-editor-info">
          {crop && <span>已选择裁剪区域，点击应用裁剪以确认。{texts.length > 0 && ` | ${texts.length} 个文字标注`}</span>}
          {!crop && texts.length > 0 && <span>{texts.length} 个文字标注</span>}
          {!crop && texts.length === 0 && <span>提示：点击图片任意位置添加文字（先在上方输入文字内容）</span>}
        </div>
      </div>
    </div>
  );
}
