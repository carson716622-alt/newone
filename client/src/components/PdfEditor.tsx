import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Type,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Move,
  MousePointer,
  Undo2,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface TextField {
  id: string;
  pageIndex: number;
  x: number; // percentage of page width
  y: number; // percentage of page height
  width: number; // percentage
  height: number; // percentage
  value: string;
  fontSize: number;
}

interface PdfEditorProps {
  pdfUrl: string;
  onExport: (pdfBlob: Blob) => void;
  className?: string;
}

export default function PdfEditor({ pdfUrl, onExport, className = "" }: PdfEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "text">("text");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragFieldId, setDragFieldId] = useState<string | null>(null);

  // Load the PDF
  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      try {
        // Fetch the PDF bytes for both rendering and later export
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        setPdfBytes(arrayBuffer.slice(0));

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to load PDF:", error);
      }
      setIsLoading(false);
    };
    loadPdf();
  }, [pdfUrl]);

  // Render the current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d")!;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Generate unique ID
  const genId = () => `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Handle click on the canvas overlay to add text fields
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (tool !== "text") return;
      if (isDragging) return;

      // Don't add field if clicking on an existing field
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.closest("[data-field]")) return;

      const rect = overlayRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const newField: TextField = {
        id: genId(),
        pageIndex: currentPage,
        x,
        y,
        width: 25,
        height: 3.5,
        value: "",
        fontSize: 12,
      };

      setTextFields((prev) => [...prev, newField]);
      setActiveFieldId(newField.id);
    },
    [tool, currentPage, isDragging]
  );

  // Delete a text field
  const deleteField = (id: string) => {
    setTextFields((prev) => prev.filter((f) => f.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  };

  // Update a text field value
  const updateFieldValue = (id: string, value: string) => {
    setTextFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  // Update field font size
  const updateFieldFontSize = (id: string, fontSize: number) => {
    setTextFields((prev) => prev.map((f) => (f.id === id ? { ...f, fontSize } : f)));
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, fieldId: string) => {
    if (tool !== "select") return;
    e.preventDefault();
    e.stopPropagation();
    const rect = overlayRef.current!.getBoundingClientRect();
    const field = textFields.find((f) => f.id === fieldId);
    if (!field) return;

    const fieldX = (field.x / 100) * rect.width;
    const fieldY = (field.y / 100) * rect.height;

    setIsDragging(true);
    setDragFieldId(fieldId);
    setDragOffset({
      x: e.clientX - rect.left - fieldX,
      y: e.clientY - rect.top - fieldY,
    });
    setActiveFieldId(fieldId);
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !dragFieldId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = overlayRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      setTextFields((prev) =>
        prev.map((f) =>
          f.id === dragFieldId
            ? { ...f, x: Math.max(0, Math.min(90, x)), y: Math.max(0, Math.min(95, y)) }
            : f
        )
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragFieldId(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragFieldId, dragOffset]);

  // Resize field with handle
  const handleResize = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = overlayRef.current!.getBoundingClientRect();
    const field = textFields.find((f) => f.id === fieldId);
    if (!field) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = field.width;
    const startHeight = field.height;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setTextFields((prev) =>
        prev.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                width: Math.max(5, startWidth + dx),
                height: Math.max(2, startHeight + dy),
              }
            : f
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Export the filled PDF
  const handleExport = async () => {
    if (!pdfBytes) return;
    setIsExporting(true);

    try {
      const pdfDocLib = await PDFDocument.load(pdfBytes);
      const helvetica = await pdfDocLib.embedFont(StandardFonts.Helvetica);
      const pages = pdfDocLib.getPages();

      for (const field of textFields) {
        if (!field.value.trim()) continue;
        const pageIdx = field.pageIndex - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;

        const page = pages[pageIdx];
        const { width: pWidth, height: pHeight } = page.getSize();

        // Convert percentage positions to PDF coordinates
        const pdfX = (field.x / 100) * pWidth;
        // PDF coordinates are bottom-up, so invert Y
        const pdfY = pHeight - ((field.y / 100) * pHeight) - ((field.height / 100) * pHeight * 0.7);

        const fontSize = field.fontSize * (pWidth / (pageSize.width || 612));

        // Handle multi-line text
        const lines = field.value.split("\n");
        const lineHeight = fontSize * 1.2;

        lines.forEach((line, i) => {
          page.drawText(line, {
            x: pdfX + 2,
            y: pdfY - i * lineHeight,
            size: Math.max(6, Math.min(24, fontSize)),
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        });
      }

      const filledPdfBytes = await pdfDocLib.save();
      const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
      onExport(blob);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    }

    setIsExporting(false);
  };

  // Download preview
  const handleDownloadPreview = async () => {
    if (!pdfBytes) return;
    setIsExporting(true);

    try {
      const pdfDocLib = await PDFDocument.load(pdfBytes);
      const helvetica = await pdfDocLib.embedFont(StandardFonts.Helvetica);
      const pages = pdfDocLib.getPages();

      for (const field of textFields) {
        if (!field.value.trim()) continue;
        const pageIdx = field.pageIndex - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;

        const page = pages[pageIdx];
        const { width: pWidth, height: pHeight } = page.getSize();

        const pdfX = (field.x / 100) * pWidth;
        const pdfY = pHeight - ((field.y / 100) * pHeight) - ((field.height / 100) * pHeight * 0.7);
        const fontSize = field.fontSize * (pWidth / (pageSize.width || 612));

        const lines = field.value.split("\n");
        const lineHeight = fontSize * 1.2;

        lines.forEach((line, i) => {
          page.drawText(line, {
            x: pdfX + 2,
            y: pdfY - i * lineHeight,
            size: Math.max(6, Math.min(24, fontSize)),
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        });
      }

      const filledPdfBytes = await pdfDocLib.save();
      const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "filled_application.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download preview:", error);
    }

    setIsExporting(false);
  };

  // Undo last field
  const handleUndo = () => {
    setTextFields((prev) => prev.slice(0, -1));
    setActiveFieldId(null);
  };

  const currentPageFields = textFields.filter((f) => f.pageIndex === currentPage);
  const totalFields = textFields.length;
  const filledFields = textFields.filter((f) => f.value.trim()).length;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-[600px] bg-black/30 rounded-lg border border-white/10 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading PDF editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0a0f1a] rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-white/10 flex-wrap gap-2">
        {/* Left: Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant={tool === "text" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("text")}
            className={`h-8 px-3 text-xs ${tool === "text" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
            title="Click on the form to add text fields"
          >
            <Type className="w-3.5 h-3.5 mr-1.5" />
            Add Text
          </Button>
          <Button
            variant={tool === "select" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("select")}
            className={`h-8 px-3 text-xs ${tool === "select" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
            title="Select and move text fields"
          >
            <MousePointer className="w-3.5 h-3.5 mr-1.5" />
            Select
          </Button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={textFields.length === 0}
            className="h-8 px-2 text-muted-foreground hover:text-white disabled:opacity-30"
            title="Undo last field"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Center: Page nav */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-white font-medium min-w-[80px] text-center">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">
            {filledFields}/{totalFields} fields
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPreview}
            disabled={isExporting || totalFields === 0}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-white disabled:opacity-30"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting || filledFields === 0}
            className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-30"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Save & Submit
          </Button>
        </div>
      </div>

      {/* Instructions bar */}
      <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
        <p className="text-xs text-blue-300">
          {tool === "text" ? (
            <>Click anywhere on the form to add a text field. Type your information, then resize or move fields as needed.</>
          ) : (
            <>Click and drag text fields to reposition them. Drag the corner handle to resize.</>
          )}
        </p>
      </div>

      {/* Active field controls */}
      {activeFieldId && (
        <div className="px-4 py-2 bg-[#111827] border-b border-white/10 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Font size:</span>
          <input
            type="range"
            min="8"
            max="24"
            value={textFields.find((f) => f.id === activeFieldId)?.fontSize || 12}
            onChange={(e) => updateFieldFontSize(activeFieldId, parseInt(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-xs text-white min-w-[24px]">
            {textFields.find((f) => f.id === activeFieldId)?.fontSize || 12}px
          </span>
          <div className="w-px h-5 bg-white/10" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteField(activeFieldId)}
            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">Delete</span>
          </Button>
        </div>
      )}

      {/* PDF Canvas + Overlay */}
      <div
        ref={containerRef}
        className="overflow-auto bg-[#1a1a2e]"
        style={{ maxHeight: "700px" }}
      >
        <div className="flex justify-center p-4">
          <div className="relative inline-block shadow-2xl">
            <canvas ref={canvasRef} className="block" />
            {/* Overlay for text fields */}
            <div
              ref={overlayRef}
              className="absolute inset-0"
              style={{ cursor: tool === "text" ? "crosshair" : "default" }}
              onClick={handleOverlayClick}
            >
              {currentPageFields.map((field) => (
                <div
                  key={field.id}
                  data-field="true"
                  className={`absolute group ${
                    activeFieldId === field.id
                      ? "ring-2 ring-primary ring-offset-0"
                      : "ring-1 ring-blue-400/40 hover:ring-blue-400/70"
                  }`}
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                    minHeight: "20px",
                    cursor: tool === "select" ? "move" : "text",
                  }}
                  onMouseDown={(e) => tool === "select" && handleDragStart(e, field.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFieldId(field.id);
                  }}
                >
                  <textarea
                    value={field.value}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    onFocus={() => setActiveFieldId(field.id)}
                    placeholder="Type here..."
                    className="w-full h-full bg-blue-50/80 border-0 outline-none resize-none text-black p-0.5 placeholder:text-gray-400 placeholder:text-xs"
                    style={{
                      fontSize: `${field.fontSize}px`,
                      lineHeight: "1.2",
                      fontFamily: "Helvetica, Arial, sans-serif",
                      cursor: tool === "select" ? "move" : "text",
                      pointerEvents: tool === "select" ? "none" : "auto",
                    }}
                  />
                  {/* Resize handle */}
                  {activeFieldId === field.id && (
                    <>
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize z-10"
                        onMouseDown={(e) => handleResize(e, field.id)}
                      />
                      <button
                        className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs z-10 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteField(field.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div className="px-4 py-2 bg-[#111827] border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {totalFields === 0
            ? "Click on the form to start filling it out"
            : `${filledFields} of ${totalFields} fields filled`}
        </span>
        <div className="flex items-center gap-2">
          {totalFields > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${totalFields > 0 ? (filledFields / totalFields) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-green-400">
                {totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
