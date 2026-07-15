import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { whiteboardService } from '../services/whiteboardService';

interface UseWhiteboardProps {
  meetingId: string | undefined;
  canvasElement: HTMLCanvasElement | null;
  brushColor: string;
  brushSize: number;
  drawingTool: 'pen' | 'eraser' | 'rect' | 'circle' | 'text';
  onToast?: (message: string) => void;
  isFirebaseEnabled?: boolean;
}

export function useWhiteboard({
  meetingId,
  canvasElement,
  brushColor,
  brushSize,
  drawingTool,
  onToast,
  isFirebaseEnabled
}: UseWhiteboardProps) {
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const isRemoteUpdate = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Undo/Redo histories
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Debounced save canvas JSON to Firestore
  const saveCanvasDebounced = useCallback(() => {
    if (isRemoteUpdate.current || !fabricCanvasRef.current || !meetingId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (!fabricCanvasRef.current) return;
      const json = fabricCanvasRef.current.toJSON();
      
      // Update local history
      const jsonStr = JSON.stringify(json);
      setHistory(prev => {
        const sliced = prev.slice(0, historyIndex + 1);
        const nextHist = [...sliced, jsonStr];
        setHistoryIndex(nextHist.length - 1);
        return nextHist;
      });

      if (isFirebaseEnabled) {
        whiteboardService.saveWhiteboardState(meetingId, json);
      }
    }, 400);
  }, [meetingId, historyIndex, isFirebaseEnabled]);

  // Undo / Redo actions
  const undo = useCallback(async () => {
    if (historyIndex > 0 && fabricCanvasRef.current) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const jsonStr = history[prevIndex];
      
      isRemoteUpdate.current = true;
      await fabricCanvasRef.current.loadFromJSON(JSON.parse(jsonStr));
      fabricCanvasRef.current.renderAll();
      isRemoteUpdate.current = false;

      if (isFirebaseEnabled && meetingId) {
        whiteboardService.saveWhiteboardState(meetingId, JSON.parse(jsonStr));
      }
    }
  }, [history, historyIndex, meetingId, isFirebaseEnabled]);

  const redo = useCallback(async () => {
    if (historyIndex < history.length - 1 && fabricCanvasRef.current) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const jsonStr = history[nextIndex];

      isRemoteUpdate.current = true;
      await fabricCanvasRef.current.loadFromJSON(JSON.parse(jsonStr));
      fabricCanvasRef.current.renderAll();
      isRemoteUpdate.current = false;

      if (isFirebaseEnabled && meetingId) {
        whiteboardService.saveWhiteboardState(meetingId, JSON.parse(jsonStr));
      }
    }
  }, [history, historyIndex, meetingId, isFirebaseEnabled]);

  // Reset/Clear canvas
  const clearWhiteboard = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.set({ backgroundColor: '#FFFFFF' });
      fabricCanvasRef.current.renderAll();
      
      saveCanvasDebounced();
      if (onToast) {
        onToast("Whiteboard reset successfully.");
      }
    }
  }, [saveCanvasDebounced, onToast]);

  // Initialize and Bind Fabric Canvas
  useEffect(() => {
    if (!canvasElement) return;

    // Determine sizes based on container parent
    const parent = canvasElement.parentElement;
    const width = parent?.clientWidth || 500;
    const height = parent?.clientHeight || 450;

    const canvas = new fabric.Canvas(canvasElement, {
      isDrawingMode: drawingTool === 'pen' || drawingTool === 'eraser',
      width,
      height,
      backgroundColor: '#FFFFFF'
    });

    fabricCanvasRef.current = canvas;

    // Initialize initial canvas state
    const initialJson = JSON.stringify(canvas.toJSON());
    setHistory([initialJson]);
    setHistoryIndex(0);

    // Set brush settings
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = drawingTool === 'eraser' ? '#FFFFFF' : brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }

    // Dynamic resizing
    const resizeHandler = () => {
      if (!canvas || !parent) return;
      canvas.setDimensions({
        width: parent.clientWidth,
        height: parent.clientHeight
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', resizeHandler);

    // Setup interactive shape draw events
    let isMouseDown = false;
    let startX = 0;
    let startY = 0;
    let activeShape: any = null;

    canvas.on('mouse:down', (options) => {
      if (canvas.isDrawingMode) return;
      const activeTool = fabricCanvasRef.current?.get('drawingTool') || drawingTool;
      if (activeTool === 'pen' || activeTool === 'eraser') return;

      isMouseDown = true;
      const pointer = canvas.getScenePoint(options.e);
      startX = pointer.x;
      startY = pointer.y;

      const currentColor = fabricCanvasRef.current?.get('brushColor') || brushColor;
      const currentSize = fabricCanvasRef.current?.get('brushSize') || brushSize;

      if (activeTool === 'rect') {
        activeShape = new fabric.Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: currentColor,
          strokeWidth: currentSize
        });
        canvas.add(activeShape);
      } else if (activeTool === 'circle') {
        activeShape = new fabric.Circle({
          left: startX,
          top: startY,
          radius: 0,
          fill: 'transparent',
          stroke: currentColor,
          strokeWidth: currentSize
        });
        canvas.add(activeShape);
      } else if (activeTool === 'text') {
        const textObj = new fabric.IText('Double-click to edit', {
          left: startX,
          top: startY,
          fill: currentColor,
          fontSize: currentSize * 4
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        isMouseDown = false;
        activeShape = null;
        saveCanvasDebounced();
      }
    });

    canvas.on('mouse:move', (options) => {
      if (!isMouseDown || !activeShape) return;
      const pointer = canvas.getScenePoint(options.e);
      const currentX = pointer.x;
      const currentY = pointer.y;

      const activeTool = fabricCanvasRef.current?.get('drawingTool') || drawingTool;

      if (activeTool === 'rect') {
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);
        activeShape.set({
          width: w,
          height: h,
          left: Math.min(currentX, startX),
          top: Math.min(currentY, startY)
        });
      } else if (activeTool === 'circle') {
        const r = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) / 2;
        activeShape.set({
          radius: r,
          left: Math.min(currentX, startX),
          top: Math.min(currentY, startY)
        });
      }
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (isMouseDown) {
        isMouseDown = false;
        activeShape = null;
        saveCanvasDebounced();
      }
    });

    // Object creation / modification hooks for free-hand pen drawing
    canvas.on('object:added', () => {
      saveCanvasDebounced();
    });

    canvas.on('object:modified', () => {
      saveCanvasDebounced();
    });

    canvas.on('object:removed', () => {
      saveCanvasDebounced();
    });

    // Listen to real-time sync if online
    let unsubscribe: (() => void) | null = null;
    if (isFirebaseEnabled && meetingId) {
      unsubscribe = whiteboardService.listenToWhiteboard(meetingId, async (jsonStr) => {
        if (isRemoteUpdate.current) return;
        try {
          isRemoteUpdate.current = true;
          await canvas.loadFromJSON(JSON.parse(jsonStr));
          canvas.renderAll();
          
          // Also update local history buffer
          setHistory(prev => {
            const index = prev.indexOf(jsonStr);
            if (index !== -1) {
              setHistoryIndex(index);
              return prev;
            }
            return [...prev, jsonStr];
          });
        } catch (e) {
          console.error("Error loading whiteboard json:", e);
        } finally {
          isRemoteUpdate.current = false;
        }
      });
    }

    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (unsubscribe) unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      try {
        canvas.dispose();
      } catch (err) {
        console.error("Error disposing fabric canvas:", err);
      }
      fabricCanvasRef.current = null;
    };
  }, [meetingId, canvasElement, isFirebaseEnabled, saveCanvasDebounced]);

  // Sync state variables to the active fabric reference
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Attach current properties to the canvas object directly to keep mouse listeners updated
    canvas.set('drawingTool', drawingTool);
    canvas.set('brushColor', brushColor);
    canvas.set('brushSize', brushSize);

    canvas.set({ isDrawingMode: drawingTool === 'pen' || drawingTool === 'eraser' });

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = drawingTool === 'eraser' ? '#FFFFFF' : brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [drawingTool, brushColor, brushSize]);

  return {
    undo,
    redo,
    clearWhiteboard,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
