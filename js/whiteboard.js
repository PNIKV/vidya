// =============================================
//  PCB BOARD SVG GRAPHICS Definitions (Blue PCBs & Silver Terminals)
// =============================================
const svgs = {
    battery: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="0" width="12" height="12" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><rect x="83" y="0" width="12" height="12" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><circle cx="31" cy="0" r="5" fill="#ffffff"/><polygon points="83,0 89,-6 95,0" fill="#ffffff"/><rect x="5" y="12" width="110" height="103" rx="10" fill="#0f2b5c" stroke="#081836" stroke-width="2.5"/><rect x="5" y="12" width="110" height="28" rx="10" fill="#0056b3"/><text x="60" y="80" font-family="sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">9V</text><text x="31" y="32" font-family="sans-serif" font-size="22" fill="white" text-anchor="middle" font-weight="bold">+</text><text x="89" y="32" font-family="sans-serif" font-size="22" fill="white" text-anchor="middle" font-weight="bold">-</text></svg>`,
    led: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="27" y="60" width="8" height="30" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><rect x="85" y="60" width="8" height="30" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><path d="M 18 60 L 102 60 L 102 48 L 18 48 Z" fill="#800000"/><path d="M 18 48 C 18 -12 102 -12 102 48 Z" fill="#b30000" opacity="0.95"/><text x="31" y="108" font-family="sans-serif" font-size="26" fill="#ff4757" font-weight="bold" text-anchor="middle">+</text><text x="89" y="108" font-family="sans-serif" font-size="26" fill="#999" font-weight="bold" text-anchor="middle">-</text></svg>`,
    led_active: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="glow" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffcccc"/><stop offset="50%" stop-color="#ff0000"/><stop offset="100%" stop-color="#990000"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="3"/></filter></defs><rect x="27" y="60" width="8" height="30" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><rect x="85" y="60" width="8" height="30" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><path d="M 18 48 C 18 -12 102 -12 102 48 Z" fill="#ff0000" filter="url(#blur)" opacity="0.65"/><path d="M 18 60 L 102 60 L 102 48 L 18 48 Z" fill="#cc0000"/><path d="M 18 48 C 18 -12 102 -12 102 48 Z" fill="url(#glow)"/><path d="M 30 40 C 30 12 48 12 48 40 Z" fill="#ffffff" opacity="0.85"/><text x="31" y="108" font-family="sans-serif" font-size="26" fill="#ff4757" font-weight="bold" text-anchor="middle">+</text><text x="89" y="108" font-family="sans-serif" font-size="26" fill="#999" font-weight="bold" text-anchor="middle">-</text></svg>`,
    resistor: `<svg width="120" height="60" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="27" width="120" height="5" fill="#e0e0e0"/><path d="M 22 17 L 98 17 C 104 17 104 41 98 41 L 22 41 C 16 41 16 17 22 17 Z" fill="#d3a77a" stroke="#a67c52" stroke-width="2.5"/><rect x="35" y="17" width="7" height="24" fill="#cc0000"/><rect x="52" y="17" width="7" height="24" fill="#000000"/><rect x="69" y="17" width="7" height="24" fill="#cc0000"/><rect x="86" y="17" width="5" height="24" fill="#b8860b"/></svg>`,
    motor: `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="48" fill="#e0e0e0" stroke="#a0a0a0" stroke-width="2.5"/><circle cx="60" cy="60" r="30" fill="#f0f0f0" stroke="#c0c0c0" stroke-width="2"/><text x="60" y="70" font-family="sans-serif" font-size="28" font-weight="bold" fill="#555" text-anchor="middle">M</text><rect x="25" y="98" width="12" height="22" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/><rect x="83" y="98" width="12" height="22" fill="#e0e0e0" stroke="#b0b0b0" stroke-width="1"/></svg>`,
    ir_sensor: `<svg width="100" height="130" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="15" width="70" height="100" rx="8" fill="#0F3D7A" stroke="#082347" stroke-width="2.5"/><rect x="40" y="60" width="20" height="30" fill="#0056b3" rx="2"/><circle cx="50" cy="75" r="7" fill="#e0e0e0" stroke="#888" stroke-width="1"/><line x1="50" y1="68" x2="50" y2="82" stroke="#222" stroke-width="2"/><rect x="22" y="5" width="16" height="10" fill="#444"/><rect x="18" y="-12" width="24" height="22" fill="rgba(160, 196, 255, 0.4)" stroke="#a0c4ff" stroke-width="1" rx="3"/><path d="M 18 -12 C 18 -26 42 -26 42 -12 Z" fill="rgba(160, 196, 255, 0.4)" stroke="#a0c4ff" stroke-width="1"/><rect x="62" y="5" width="16" height="10" fill="#444"/><rect x="58" y="-12" width="24" height="22" fill="#0c0d10" rx="3" stroke="#222" stroke-width="1"/><path d="M 58 -12 C 58 -26 82 -26 82 -12 Z" fill="#0c0d10" stroke="#222" stroke-width="1"/><circle cx="25" cy="40" r="5" fill="#444"/><rect x="22" y="115" width="6" height="15" fill="#e0e0e0"/><rect x="47" y="115" width="6" height="15" fill="#e0e0e0"/><rect x="72" y="115" width="6" height="15" fill="#e0e0e0"/><text x="25" y="108" font-family="sans-serif" font-size="10" fill="#ddd" font-weight="bold" text-anchor="middle">V</text><text x="50" y="108" font-family="sans-serif" font-size="10" fill="#ddd" font-weight="bold" text-anchor="middle">G</text><text x="75" y="108" font-family="sans-serif" font-size="10" fill="#ddd" font-weight="bold" text-anchor="middle">S</text></svg>`
};

const componentImages = {};

let wbCanvas = null;
let wbCtx = null;
let wbMode = 'move'; 
let wbCurrentColor = '#F0F2FF';
let wbCurrentComp = '';
let wbElements = [];
let wbCurrentPath = null;
let wbPreviewWire = null;
let wbIsDrawing = false;
let wbDraggingElement = null;
let wbSelectedElement = null; 
let wbLastPos = null;
let wbIsRunning = false;
let wbAnimationFrame = null;

// Undo/Redo stacks
let wbHistory = [];
let wbHistoryIndex = -1;

// =============================================
//  WEB AUDIO SYNTHESIZER (Sound Effects)
// =============================================
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(freq, type, duration, volume = 0.1) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch(e) {}
}

const soundClick = () => playTone(600, 'sine', 0.08, 0.15);
const soundSuccess = () => {
    playTone(523.25, 'sine', 0.12, 0.1); 
    setTimeout(() => playTone(659.25, 'sine', 0.15, 0.1), 100); 
};
const soundStop = () => {
    playTone(659.25, 'sine', 0.12, 0.1);
    setTimeout(() => playTone(523.25, 'sine', 0.15, 0.1), 100);
};
const soundBurn = () => {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
    } catch(e) {}
};
const soundError = () => {
    playTone(180, 'triangle', 0.2, 0.2);
};

// Continuous motor hum with tremolo
let motorOsc = null;
let motorGain = null;
function startMotorHum() {
    if (motorOsc) return;
    try {
        const ctx = getAudioContext();
        motorOsc = ctx.createOscillator();
        motorGain = ctx.createGain();
        motorOsc.type = 'sawtooth';
        motorOsc.frequency.setValueAtTime(65, ctx.currentTime); 
        
        const tremolo = ctx.createOscillator();
        const tremoloGain = ctx.createGain();
        tremolo.frequency.value = 14; 
        tremoloGain.gain.value = 9; 
        tremolo.connect(tremoloGain);
        tremoloGain.connect(motorOsc.frequency);
        
        motorGain.gain.setValueAtTime(0.08, ctx.currentTime);
        motorOsc.connect(motorGain);
        motorGain.connect(ctx.destination);
        
        tremolo.start();
        motorOsc.start();
    } catch(e) {}
}

function stopMotorHum() {
    if (motorOsc) {
        try {
            const ctx = getAudioContext();
            motorGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
            const localOsc = motorOsc;
            setTimeout(() => { localOsc.stop(); }, 120);
        } catch(e) {}
        motorOsc = null;
        motorGain = null;
    }
}

// =============================================
//  UNDO / REDO Snapshots
// =============================================
window.wbSaveState = () => {
    wbHistory = wbHistory.slice(0, wbHistoryIndex + 1);
    const snapshot = wbElements.map(el => {
        const copy = { ...el };
        if (el.type === 'freehand') {
            copy.points = el.points.map(pt => ({ ...pt }));
        }
        return copy;
    });
    wbHistory.push(snapshot);
    wbHistoryIndex = wbHistory.length - 1;
};

window.wbUndo = () => {
    if (wbHistoryIndex > 0) {
        wbHistoryIndex--;
        restoreFromHistoryState(wbHistory[wbHistoryIndex]);
        wbSelectedElement = null;
        if (window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
        if (!wbIsRunning) wbRedraw();
        else simulateCircuit();
    }
};

window.wbRedo = () => {
    if (wbHistoryIndex < wbHistory.length - 1) {
        wbHistoryIndex++;
        restoreFromHistoryState(wbHistory[wbHistoryIndex]);
        wbSelectedElement = null;
        if (window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
        if (!wbIsRunning) wbRedraw();
        else simulateCircuit();
    }
};

function restoreFromHistoryState(state) {
    wbElements = state.map(el => {
        const copy = { ...el };
        if (el.type === 'freehand') {
            copy.points = el.points.map(pt => ({ ...pt }));
        } else if (el.type === 'component' && el.compType === 'resistor') {
            window.wbRegenerateResistorImage(copy);
        }
        return copy;
    });
}

// =============================================
//  ROTATION & TERMINALS Snap Locking
// =============================================
function getRotatedTerminal(el, rx, ry) {
    const rot = el.rotation || 0;
    if (rot === 90) return { x: el.x - ry, y: el.y + rx };
    if (rot === 180) return { x: el.x - rx, y: el.y - ry };
    if (rot === 270) return { x: el.x + ry, y: el.y - rx };
    return { x: el.x + rx, y: el.y + ry };
}

window.wbRotateSelected = () => {
    if (wbSelectedElement && wbSelectedElement.type === 'component') {
        wbSelectedElement.rotation = ((wbSelectedElement.rotation || 0) + 90) % 360;
        wbSaveState();
        if (wbIsRunning) {
            simulateCircuit();
        } else {
            wbRedraw();
        }
    }
};

function getComponentTerminals(el) {
    if (el.compType === 'battery') {
        return [
            { name: '+', label: 'VCC (+)', ...getRotatedTerminal(el, -25, -50), el },
            { name: '-', label: 'GND (-)', ...getRotatedTerminal(el, 25, -50), el }
        ];
    } else if (el.compType === 'led') {
        return [
            { name: '+', label: 'Anode (+)', ...getRotatedTerminal(el, -25, 25), el },
            { name: '-', label: 'Cathode (-)', ...getRotatedTerminal(el, 25, 25), el }
        ];
    } else if (el.compType === 'resistor') {
        return [
            { name: '1', label: 'Pin 1', ...getRotatedTerminal(el, -50, 0), el },
            { name: '2', label: 'Pin 2', ...getRotatedTerminal(el, 50, 0), el }
        ];
    } else if (el.compType === 'motor') {
        return [
            { name: '1', label: 'Terminal 1', ...getRotatedTerminal(el, -25, 50), el },
            { name: '2', label: 'Terminal 2', ...getRotatedTerminal(el, 25, 50), el }
        ];
    } else if (el.compType === 'ir_sensor') {
        return [
            { name: 'VCC', label: 'VCC (+)', ...getRotatedTerminal(el, -25, 50), el },
            { name: 'GND', label: 'GND (-)', ...getRotatedTerminal(el, 0, 50), el },
            { name: 'OUT', label: 'Signal (OUT)', ...getRotatedTerminal(el, 25, 50), el }
        ];
    }
    return [];
}

function getAllTerminals() {
    let list = [];
    for (const el of wbElements) {
        if (el.type === 'component') {
            list.push(...getComponentTerminals(el));
        }
    }
    return list;
}

function findNearestTerminal(pos, threshold = 25) {
    const terms = getAllTerminals();
    let best = null;
    let bestDist = Infinity;
    for (const t of terms) {
        const dist = Math.hypot(t.x - pos.x, t.y - pos.y);
        if (dist < threshold && dist < bestDist) {
            bestDist = dist;
            best = t;
        }
    }
    return best;
}

function getAbsoluteObjPos(el) {
    const dy = el.objDistance || -80;
    const rad = (el.rotation || 0) * Math.PI / 180;
    const rx = -dy * Math.sin(rad);
    const ry = dy * Math.cos(rad);
    return { x: el.x + rx, y: el.y + ry };
}

function alertToast() {
    const container = document.getElementById('wbCanvasContainer');
    if (container) {
        container.style.borderColor = 'var(--red)';
        setTimeout(() => {
            container.style.borderColor = wbIsRunning ? 'var(--green)' : 'var(--border)';
        }, 350);
    }
}

// Keyboard listener
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        window.wbUndo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        window.wbRedo();
    }
});

// =============================================
//  CANVAS Initialization and Interactions
// =============================================
window.initWhiteboard = () => {
    wbCanvas = document.getElementById('whiteboardCanvas');
    if (!wbCanvas) return;
    wbCtx = wbCanvas.getContext('2d');
    
    // Preload SVG component images
    for (const [key, svgStr] of Object.entries(svgs)) {
        if (!componentImages[key]) {
            const img = new Image();
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
            componentImages[key] = img;
        }
    }
    
    if (wbAnimationFrame) cancelAnimationFrame(wbAnimationFrame);
    wbIsRunning = false;
    stopMotorHum();
    
    wbElements = [];
    wbHistory = [];
    wbHistoryIndex = -1;
    wbSaveState();
    
    const resizeCanvas = () => {
        if (!wbCanvas || !wbCanvas.parentElement) return;
        const rect = wbCanvas.parentElement.getBoundingClientRect();
        wbCanvas.width = rect.width;
        wbCanvas.height = rect.height;
        wbRedraw();
    };
    
    if (!window.wbResizeAttached) {
        window.addEventListener('resize', resizeCanvas);
        window.wbResizeAttached = true;
    }
    setTimeout(resizeCanvas, 50);

    const getPos = (e) => {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        const rect = wbCanvas.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        
        if (wbMode === 'component' || wbMode === 'wire' || wbMode === 'move') {
            x = Math.round(x / 25) * 25;
            y = Math.round(y / 25) * 25;
        }
        return { x, y };
    };

    const handleDown = (e) => {
        const pos = getPos(e);
        
        // Handle dragging interactive IR Sensor "OBJ" Dot
        if (wbIsRunning) {
            for (const el of wbElements) {
                if (el.type === 'component' && el.compType === 'ir_sensor') {
                    const objPos = getAbsoluteObjPos(el);
                    if (Math.hypot(objPos.x - pos.x, objPos.y - pos.y) < 18) {
                        wbDraggingElement = { type: 'ir_obj', sensor: el };
                        wbLastPos = pos;
                        wbIsDrawing = true;
                        return; 
                    }
                }
            }
        }

        if (wbMode === 'move') {
            const el = getElementAt(pos);
            wbSelectedElement = el; 
            if (window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
            
            if (el) {
                wbDraggingElement = el;
                wbDraggingElement._dragStartPos = { x: el.x, y: el.y }; 
                wbLastPos = pos;
                wbIsDrawing = true;
            }
        } else {
            wbSelectedElement = null;
            if (window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
            
            wbIsDrawing = true;
            if (wbMode === 'pen') {
                const rawPos = { x: e.clientX - wbCanvas.getBoundingClientRect().left, y: e.clientY - wbCanvas.getBoundingClientRect().top };
                wbCurrentPath = { type: 'freehand', color: wbCurrentColor, points: [rawPos] };
            } else if (wbMode === 'wire') {
                const term = findNearestTerminal(pos, 25);
                if (term) {
                    wbPreviewWire = { 
                        type: 'wire', color: wbCurrentColor, 
                        x1: term.x, y1: term.y, x2: term.x, y2: term.y, 
                        flowing: false, flowDir: 1, 
                        startTerm: { name: term.name, elId: wbElements.indexOf(term.el) } 
                    };
                    soundClick();
                } else {
                    soundError();
                    alertToast();
                    wbIsDrawing = false;
                    wbPreviewWire = null;
                }
            } else if (wbMode === 'component') {
                const el = { 
                    type: 'component', compType: wbCurrentComp, 
                    x: pos.x, y: pos.y, active: false, rotation: 0, burned: false,
                    triggerDistance: 100, objDistance: -80 
                };
                if (wbCurrentComp === 'resistor') {
                    el.resistance = 220;
                    if(window.wbRegenerateResistorImage) window.wbRegenerateResistorImage(el);
                }
                wbElements.push(el);
                wbSelectedElement = el; 
                wbSaveState(); 
                soundClick();
                if (window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
                if (!wbIsRunning) wbRedraw();
                wbIsDrawing = false; 
            } else if (wbMode === 'erase') {
                eraseElementAt(pos);
                wbIsDrawing = false;
            }
        }
    };

    const handleMove = (e) => {
        if (!wbIsDrawing) return;
        if (e.cancelable) e.preventDefault();
        const pos = getPos(e);

        if (wbDraggingElement && wbDraggingElement.type === 'ir_obj') {
            const sensor = wbDraggingElement.sensor;
            const dist = Math.hypot(pos.x - sensor.x, pos.y - sensor.y);
            sensor.objDistance = -Math.max(20, Math.min(220, dist));
            simulateCircuit(); 
            return;
        }

        if (wbMode === 'move' && wbDraggingElement) {
            const dx = pos.x - wbLastPos.x;
            const dy = pos.y - wbLastPos.y;
            if (dx !== 0 || dy !== 0) {
                offsetElement(wbDraggingElement, dx, dy);
                wbLastPos = pos;
                if (!wbIsRunning) wbRedraw();
            }
        } else if (wbMode === 'pen' && wbCurrentPath) {
            const rawPos = { x: e.clientX - wbCanvas.getBoundingClientRect().left, y: e.clientY - wbCanvas.getBoundingClientRect().top };
            wbCurrentPath.points.push(rawPos);
            if (!wbIsRunning) wbRedraw();
        } else if (wbMode === 'wire' && wbPreviewWire) {
            const term = findNearestTerminal(pos, 25);
            if (term) {
                wbPreviewWire.x2 = term.x;
                wbPreviewWire.y2 = term.y;
            } else {
                if (Math.abs(pos.x - wbPreviewWire.x1) > Math.abs(pos.y - wbPreviewWire.y1)) {
                    wbPreviewWire.x2 = pos.x;
                    wbPreviewWire.y2 = wbPreviewWire.y1;
                } else {
                    wbPreviewWire.x2 = wbPreviewWire.x1;
                    wbPreviewWire.y2 = pos.y;
                }
            }
            if (!wbIsRunning) wbRedraw();
        }
    };

    const handleUp = (e) => {
        if (!wbIsDrawing) return;
        wbIsDrawing = false;
        
        if (wbDraggingElement && wbDraggingElement.type === 'ir_obj') {
            wbDraggingElement = null;
            return;
        }

        if (wbMode === 'move' && wbDraggingElement) {
            const start = wbDraggingElement._dragStartPos;
            if (start && (wbDraggingElement.x !== start.x || wbDraggingElement.y !== start.y)) {
                wbSaveState();
            }
            delete wbDraggingElement._dragStartPos;
            wbDraggingElement = null;
        } else if (wbMode === 'pen' && wbCurrentPath) {
            wbElements.push(wbCurrentPath);
            wbSaveState();
            wbCurrentPath = null;
        } else if (wbMode === 'wire' && wbPreviewWire) {
            const term = findNearestTerminal({ x: wbPreviewWire.x2, y: wbPreviewWire.y2 }, 25);
            if (term && (term.x !== wbPreviewWire.x1 || term.y !== wbPreviewWire.y1)) {
                wbPreviewWire.x2 = term.x;
                wbPreviewWire.y2 = term.y;
                wbPreviewWire.endTerm = { name: term.name, elId: wbElements.indexOf(term.el) };
                wbElements.push(wbPreviewWire);
                wbSaveState();
                soundSuccess();
            } else {
                soundError();
                alertToast();
            }
            wbPreviewWire = null;
        }
        if (!wbIsRunning) wbRedraw();
    };

    wbCanvas.addEventListener('mousedown', handleDown);
    wbCanvas.addEventListener('mousemove', handleMove);
    wbCanvas.addEventListener('mouseup', handleUp);
    wbCanvas.addEventListener('mouseout', handleUp);
    wbCanvas.addEventListener('touchstart', handleDown, {passive: false});
    wbCanvas.addEventListener('touchmove', handleMove, {passive: false});
    wbCanvas.addEventListener('touchend', handleUp);
    wbCanvas.addEventListener('touchcancel', handleUp);
    
    wbRedraw();
};

window.wbSetMode = (mode, val) => {
    wbMode = mode;
    if (mode === 'pen' || mode === 'wire') wbCurrentColor = val;
    if (mode === 'component') wbCurrentComp = val;
    if (mode !== 'move') {
        wbSelectedElement = null;
        if(window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
    }
};

window.wbClear = () => {
    wbElements = [];
    wbSelectedElement = null;
    stopMotorHum();
    wbSaveState(); 
    if(window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
    if (!wbIsRunning) wbRedraw();
};

// =============================================
//  PHYSICS ENGINE (Loop Solver & Secondary Power Nodes)
// =============================================
function simulateCircuit() {
    // Reset component states
    for (const el of wbElements) {
        if (el.type === 'wire') {
            el.flowing = false;
            el.current = 0;
        }
        if (el.type === 'component') {
            el.active = false;
            el.current = 0;
            el.voltage = 0;
        }
    }

    const nodes = {}; 
    const edges = [];

    function addEdge(n1, n2, type, ref, directed=false) {
        if (!nodes[n1]) nodes[n1] = [];
        if (!nodes[n2]) nodes[n2] = [];
        const edge = { n1, n2, type, ref, directed };
        edges.push(edge);
        nodes[n1].push(edge);
        if (!directed) {
            nodes[n2].push({ n1: n2, n2: n1, type, ref, directed: false, originalEdge: edge });
        }
    }

    const batteries = [];
    const mainBatteries = [];

    for (const el of wbElements) {
        if (el.type === 'wire') {
            addEdge(`${el.x1},${el.y1}`, `${el.x2},${el.y2}`, 'wire', el, false);
        } else if (el.type === 'component') {
            if (el.compType === 'battery') {
                const posT = getRotatedTerminal(el, -25, -50);
                const negT = getRotatedTerminal(el, 25, -50);
                const batObj = { pos: `${posT.x},${posT.y}`, neg: `${negT.x},${negT.y}`, ref: el };
                batteries.push(batObj);
                mainBatteries.push(batObj);
            } else if (el.compType === 'led' && !el.burned) {
                const posT = getRotatedTerminal(el, -25, 25);
                const negT = getRotatedTerminal(el, 25, 25);
                addEdge(`${posT.x},${posT.y}`, `${negT.x},${negT.y}`, 'led', el, true); 
            } else if (el.compType === 'resistor') {
                const t1 = getRotatedTerminal(el, -50, 0);
                const t2 = getRotatedTerminal(el, 50, 0);
                addEdge(`${t1.x},${t1.y}`, `${t2.x},${t2.y}`, 'resistor', el, false);
            } else if (el.compType === 'motor') {
                const t1 = getRotatedTerminal(el, -25, 50);
                const t2 = getRotatedTerminal(el, 25, 50);
                addEdge(`${t1.x},${t1.y}`, `${t2.x},${t2.y}`, 'motor', el, false);
            } else if (el.compType === 'ir_sensor') {
                const vccT = getRotatedTerminal(el, -25, 50);
                const gndT = getRotatedTerminal(el, 0, 50);
                const outT = getRotatedTerminal(el, 25, 50);
                addEdge(`${vccT.x},${vccT.y}`, `${gndT.x},${gndT.y}`, 'ir_pow', el, false);
            }
        }
    }

    // Phase 1: Determine which IR Sensors are successfully powered
    for (const el of wbElements) {
        if (el.type === 'component' && el.compType === 'ir_sensor') {
            el.powered = false;
            el.detected = false;
            const vccT = getRotatedTerminal(el, -25, 50);
            const gndT = getRotatedTerminal(el, 0, 50);
            const vccStr = `${vccT.x},${vccT.y}`;
            const gndStr = `${gndT.x},${gndT.y}`;
            
            for (const bat of mainBatteries) {
                const hasVccPath = pathExists(bat.pos, vccStr, nodes);
                const hasGndPath = pathExists(gndStr, bat.neg, nodes);
                if (hasVccPath && hasGndPath) {
                    el.powered = true;
                    el.active = true;
                    // Trigger detection test
                    const dist = Math.abs(el.objDistance || -80);
                    const trigger = el.triggerDistance || 100;
                    if (dist <= trigger) {
                        el.detected = true;
                    }
                    break;
                }
            }
        }
    }

    // Phase 2: Treat powered & active OUT pins as secondary positive voltage sources
    for (const el of wbElements) {
        if (el.type === 'component' && el.compType === 'ir_sensor' && el.powered && el.detected) {
            const outT = getRotatedTerminal(el, 25, 50);
            for (const bat of mainBatteries) {
                batteries.push({ pos: `${outT.x},${outT.y}`, neg: bat.neg, ref: el });
            }
        }
    }

    let loopHasActiveMotor = false;

    // Phase 3: Solve series paths
    for (const bat of batteries) {
        const visited = new Set();
        const path = [];
        
        function dfs(currNode) {
            if (currNode === bat.neg) {
                let totalR = 5; 
                let loopLED = null;
                const pathComponents = [];
                
                for (const edge of path) {
                    pathComponents.push(edge);
                    if (edge.type === 'resistor') {
                        totalR += edge.ref.resistance || 220;
                    } else if (edge.type === 'motor') {
                        totalR += 15; 
                    } else if (edge.type === 'led') {
                        totalR += 2;  
                        loopLED = edge.ref;
                    }
                }
                
                const vDropLED = loopLED ? 2.0 : 0.0;
                const vNet = 9.0 - vDropLED;
                let current = 0;
                if (vNet > 0 && totalR > 0) {
                    current = vNet / totalR; 
                }
                
                if (loopLED && current > 0.08) {
                    loopLED.burned = true;
                    soundBurn();
                    current = 0; 
                }
                
                bat.ref.active = (current > 0);
                bat.ref.current = current;
                
                for (const edge of pathComponents) {
                    edge.ref.active = (current > 0);
                    edge.ref.current = current;
                    
                    if (edge.type === 'wire') {
                        const realEdge = edge.originalEdge || edge;
                        realEdge.ref.flowing = (current > 0);
                        realEdge.ref.flowDir = (realEdge.n1 === edge.n1) ? 1 : -1;
                    } else if (edge.type === 'motor' && current > 0) {
                        loopHasActiveMotor = true;
                    }
                }
                return true; 
            }
            
            visited.add(currNode);
            let found = false;
            if (nodes[currNode]) {
                for (const edge of nodes[currNode]) {
                    if (!visited.has(edge.n2)) {
                        path.push(edge);
                        if (dfs(edge.n2)) found = true; 
                        path.pop();
                    }
                }
            }
            visited.delete(currNode);
            return found;
        }
        dfs(bat.pos);
    }

    if (loopHasActiveMotor && wbIsRunning) {
        startMotorHum();
    } else {
        stopMotorHum();
    }
}

window.wbToggleRun = () => {
    wbIsRunning = !wbIsRunning;
    const btn = document.getElementById('wbRunBtn');
    if (wbIsRunning) {
        if (btn) {
            btn.innerHTML = '🛑 Stop Simulation';
            btn.style.background = 'var(--red)';
            btn.style.color = 'white';
            btn.style.boxShadow = '0 0 15px rgba(255,71,87,0.8)';
        }
        soundSuccess();
        simulateCircuit(); 
        wbAnimationLoop();
    } else {
        if (btn) {
            btn.innerHTML = '▶️ Run Circuit';
            btn.style.background = 'var(--green)';
            btn.style.color = 'black';
            btn.style.boxShadow = '0 0 10px rgba(0,255,136,0.5)';
        }
        soundStop();
        stopMotorHum();
        if (wbAnimationFrame) cancelAnimationFrame(wbAnimationFrame);
        for (const el of wbElements) {
            if (el.type === 'wire') el.flowing = false;
            if (el.type === 'component') el.active = false;
        }
        wbRedraw();
    }
    if (window.wbUpdatePropertiesPanel) window.wbUpdatePropertiesPanel();
};

function wbAnimationLoop() {
    if (!wbIsRunning) return;
    wbRedraw(); 
    const time = Date.now() / 1000; 
    const speed = 0.8; 
    
    for (const el of wbElements) {
        if (el.type === 'wire' && el.flowing) {
            const length = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
            if (length === 0) continue;
            const numDots = Math.max(1, Math.floor(length / 30)); 
            for (let i = 0; i < numDots; i++) {
                let t = ((time * speed) + (i / numDots)) % 1.0;
                if (el.flowDir === -1) t = 1 - t; 
                
                const dotX = el.x1 + (el.x2 - el.x1) * t;
                const dotY = el.y1 + (el.y2 - el.y1) * t;
                wbCtx.beginPath();
                wbCtx.arc(dotX, dotY, 4, 0, Math.PI * 2);
                
                // Active flow dots should contrast well with white background
                wbCtx.fillStyle = '#00CC66';
                wbCtx.shadowColor = '#00CC66';
                wbCtx.shadowBlur = 4;
                wbCtx.fill();
                wbCtx.shadowBlur = 0; 
            }
        }
    }
    wbAnimationFrame = requestAnimationFrame(wbAnimationLoop);
}

// Clean, high contrast Silver Solder Pads grid on white background
function drawPCBGrid() {
    if (!wbCtx || !wbCanvas) return;
    const gridSize = 25;
    wbCtx.fillStyle = 'rgba(160, 175, 195, 0.4)'; 
    for (let x = gridSize; x < wbCanvas.width; x += gridSize) {
        for (let y = gridSize; y < wbCanvas.height; y += gridSize) {
            wbCtx.beginPath();
            wbCtx.arc(x, y, 2.5, 0, Math.PI * 2);
            wbCtx.fill();
        }
    }
}

function wbRedraw() {
    if (!wbCtx || !wbCanvas) return;
    wbCtx.clearRect(0, 0, wbCanvas.width, wbCanvas.height);
    
    drawPCBGrid();
    
    wbCtx.lineCap = 'round';
    wbCtx.lineJoin = 'round';

    for (const el of wbElements) drawElement(el);
    if (wbCurrentPath) drawElement(wbCurrentPath);
    if (wbPreviewWire) drawElement(wbPreviewWire);
}

function drawElement(el) {
    if (el.type === 'freehand') {
        if (el.points.length < 2) return;
        wbCtx.beginPath();
        wbCtx.lineWidth = 3.5;
        wbCtx.strokeStyle = el.color;
        wbCtx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            wbCtx.lineTo(el.points[i].x, el.points[i].y);
        }
        wbCtx.stroke();
    } else if (el.type === 'wire') {
        wbCtx.beginPath();
        wbCtx.lineWidth = 6;
        wbCtx.strokeStyle = el.color;
        wbCtx.moveTo(el.x1, el.y1);
        wbCtx.lineTo(el.x2, el.y2);
        wbCtx.stroke();
        
        wbCtx.fillStyle = el.color;
        wbCtx.beginPath(); wbCtx.arc(el.x1, el.y1, 6, 0, Math.PI*2); wbCtx.fill();
        wbCtx.beginPath(); wbCtx.arc(el.x2, el.y2, 6, 0, Math.PI*2); wbCtx.fill();
    } else if (el.type === 'component') {
        drawComponent(el, el.x, el.y);
    }
}

function drawComponent(el, x, y) {
    wbCtx.save();
    wbCtx.translate(x, y);
    
    const rot = el.rotation || 0;
    if (rot !== 0) {
        wbCtx.rotate(rot * Math.PI / 180);
    }
    
    const type = el.compType;
    
    // Scale up components slightly (120x120 instead of 100x100)
    if (type === 'battery' && componentImages.battery?.complete) {
        wbCtx.drawImage(componentImages.battery, -60, -60, 120, 120);
    } else if (type === 'led') {
        if (el.burned) {
            wbCtx.drawImage(componentImages.led, -60, -60, 120, 120);
            
            wbCtx.beginPath();
            wbCtx.arc(0, -12, 44, 0, Math.PI * 2);
            wbCtx.fillStyle = 'rgba(50, 48, 48, 0.88)';
            wbCtx.fill();
            
            wbCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            wbCtx.lineWidth = 2.5;
            wbCtx.beginPath();
            wbCtx.moveTo(-18, -32); wbCtx.lineTo(2, -15); wbCtx.lineTo(-10, 8);
            wbCtx.moveTo(2, -15); wbCtx.lineTo(22, -2);
            wbCtx.stroke();
            
            wbCtx.fillStyle = '#ff3b30';
            wbCtx.font = 'bold 13px Courier New';
            wbCtx.fillText("BURNT!", -24, -18);
        } else if (el.active && wbIsRunning) {
            const currentMa = (el.current || 0) * 1000;
            const pulseGlow = 15 + Math.sin(Date.now() / 80) * 3;
            
            wbCtx.save();
            wbCtx.shadowColor = '#FF4757';
            wbCtx.shadowBlur = pulseGlow + (currentMa * 0.45); 
            wbCtx.drawImage(componentImages.led_active, -60, -60, 120, 120);
            wbCtx.restore();
        } else if (componentImages.led?.complete) {
            wbCtx.drawImage(componentImages.led, -60, -60, 120, 120);
        }
    } else if (type === 'resistor') {
        const img = el.customImage || componentImages.resistor;
        if (img && img.complete) {
            wbCtx.drawImage(img, -60, -30, 120, 60);
        }
    } else if (type === 'motor' && componentImages.motor?.complete) {
        wbCtx.drawImage(componentImages.motor, -60, -60, 120, 120);
        
        // Spin axle with vanes
        wbCtx.save();
        const rotAngle = el.active && wbIsRunning ? (Date.now() / 120) % (Math.PI * 2) : 0;
        wbCtx.rotate(rotAngle);
        
        wbCtx.fillStyle = '#C0C0C0'; // Metallic silver
        wbCtx.beginPath(); wbCtx.arc(0, 0, 16, 0, Math.PI*2); wbCtx.fill();
        
        wbCtx.strokeStyle = '#222';
        wbCtx.lineWidth = 4;
        wbCtx.beginPath();
        wbCtx.moveTo(-26, 0); wbCtx.lineTo(26, 0);
        wbCtx.moveTo(0, -26); wbCtx.lineTo(0, 26);
        wbCtx.stroke();
        wbCtx.restore();
    } else if (type === 'ir_sensor' && componentImages.ir_sensor?.complete) {
        // Draw the narrow and long IR Sensor PCB
        wbCtx.drawImage(componentImages.ir_sensor, -50, -65, 100, 130);
        
        if (wbIsRunning) {
            const beamDist = el.triggerDistance || 100;
            const grad = wbCtx.createLinearGradient(0, -25, 0, -25 - beamDist);
            grad.addColorStop(0, el.detected ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 71, 87, 0.22)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            wbCtx.fillStyle = grad;
            wbCtx.beginPath();
            wbCtx.moveTo(-15, -25);
            wbCtx.lineTo(-30, -25 - beamDist);
            wbCtx.lineTo(30, -25 - beamDist);
            wbCtx.lineTo(15, -25);
            wbCtx.fill();
            
            if (el.powered) {
                wbCtx.fillStyle = el.detected ? '#00FF88' : '#FF4757';
                wbCtx.shadowColor = el.detected ? '#00FF88' : '#FF4757';
                wbCtx.shadowBlur = 8;
                wbCtx.beginPath(); wbCtx.arc(-25, 40, 5, 0, Math.PI*2); wbCtx.fill();
                wbCtx.shadowBlur = 0;
            }
        }
    }
    
    // Highlight selection bounding box
    if (wbSelectedElement === el && wbMode === 'move') {
        wbCtx.strokeStyle = 'var(--cyan)';
        wbCtx.lineWidth = 2.5;
        wbCtx.setLineDash([5, 5]);
        
        let bW = 126;
        let bH = 126;
        if (type === 'resistor') { bW = 126; bH = 74; }
        else if (type === 'ir_sensor') { bW = 106; bH = 136; }
        
        wbCtx.strokeRect(-bW/2, -bH/2, bW, bH);
        wbCtx.setLineDash([]);
    }
    
    wbCtx.restore();

    // Draggable absolute object dot for active IR Sensors during simulation
    if (wbIsRunning && type === 'ir_sensor') {
        const objPos = getAbsoluteObjPos(el);
        
        wbCtx.strokeStyle = el.detected ? 'rgba(0, 180, 100, 0.45)' : 'rgba(0, 0, 0, 0.15)';
        wbCtx.lineWidth = 2.5;
        wbCtx.setLineDash([3, 3]);
        wbCtx.beginPath();
        wbCtx.moveTo(x, y);
        wbCtx.lineTo(objPos.x, objPos.y);
        wbCtx.stroke();
        wbCtx.setLineDash([]);

        wbCtx.beginPath();
        wbCtx.arc(objPos.x, objPos.y, 14, 0, Math.PI * 2);
        wbCtx.fillStyle = el.detected ? '#00FF88' : '#ff6b6b';
        wbCtx.strokeStyle = '#fff';
        wbCtx.lineWidth = 2.5;
        wbCtx.shadowColor = 'rgba(0,0,0,0.3)';
        wbCtx.shadowBlur = 6;
        wbCtx.fill();
        wbCtx.shadowBlur = 0;
        wbCtx.stroke();
        
        wbCtx.fillStyle = el.detected ? '#000' : '#fff';
        wbCtx.font = 'bold 9px monospace';
        wbCtx.textAlign = 'center';
        wbCtx.textBaseline = 'middle';
        wbCtx.fillText('OBJ', objPos.x, objPos.y);
    }
}

function getElementAt(pos) {
    const threshold = 22; 
    for (let i = wbElements.length - 1; i >= 0; i--) {
        const el = wbElements[i];
        if (el.type === 'freehand') {
            for (const pt of el.points) {
                if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < threshold) return el;
            }
        } else if (el.type === 'wire') {
            const dist = distToSegment(pos, {x: el.x1, y: el.y1}, {x: el.x2, y: el.y2});
            if (dist < threshold) return el;
        } else if (el.type === 'component') {
            const radius = el.compType === 'ir_sensor' ? 55 : 45;
            if (Math.hypot(el.x - pos.x, el.y - pos.y) < radius) return el;
        }
    }
    return null;
}

function eraseElementAt(pos) {
    const el = getElementAt(pos);
    if (el) {
        const index = wbElements.indexOf(el);
        if (index > -1) {
            wbElements.splice(index, 1);
            wbSaveState(); 
            soundClick();
            if (!wbIsRunning) wbRedraw();
            else simulateCircuit();
        }
    }
}

function offsetElement(el, dx, dy) {
    if (el.type === 'freehand') {
        for (const pt of el.points) {
            pt.x += dx;
            pt.y += dy;
        }
    } else if (el.type === 'wire') {
        el.x1 += dx;
        el.y1 += dy;
        el.x2 += dx;
        el.y2 += dy;
    } else if (el.type === 'component') {
        el.x += dx;
        el.y += dy;
    }
}

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
  let l2 = dist2(v, w);
  if (l2 === 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

// Properties panel UI
window.wbUpdatePropertiesPanel = () => {
    const panel = document.getElementById('wbPropertiesPanel');
    const rDiv = document.getElementById('wbPropResistor');
    const bDiv = document.getElementById('wbPropBattery');
    const irDiv = document.getElementById('wbPropIRSensor');
    const title = document.getElementById('wbPropTitle');
    if (!panel) return;

    const oldStats = document.getElementById('wbPropPhysicsStats');
    if (oldStats) oldStats.remove();

    if (!wbSelectedElement || wbSelectedElement.type !== 'component') {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    rDiv.style.display = 'none';
    bDiv.style.display = 'none';
    irDiv.style.display = 'none';
    title.innerText = wbSelectedElement.compType.toUpperCase();

    if (wbSelectedElement.compType === 'resistor') {
        title.innerText = 'Resistor';
        rDiv.style.display = 'flex';
        document.getElementById('wbResistorValue').value = wbSelectedElement.resistance || 220;
    } else if (wbSelectedElement.compType === 'battery') {
        title.innerText = '9V Battery';
        bDiv.style.display = 'flex';
    } else if (wbSelectedElement.compType === 'ir_sensor') {
        title.innerText = 'IR Sensor Module';
        irDiv.style.display = 'flex';
        const triggerDist = wbSelectedElement.triggerDistance || 100;
        document.getElementById('wbIRTriggerDist').value = triggerDist;
        document.getElementById('wbIRTriggerValue').innerText = `${triggerDist} px`;
    }

    // Generate real-time physics status display
    if (wbIsRunning) {
        const statsBox = document.createElement('div');
        statsBox.id = 'wbPropPhysicsStats';
        statsBox.className = 'wb-prop-group';
        statsBox.style.borderTop = '1px dashed var(--border)';
        statsBox.style.paddingTop = '10px';
        statsBox.style.marginTop = '10px';

        const currentMa = ((wbSelectedElement.current || 0) * 1000).toFixed(1);
        
        let statusText = `<label class="wb-prop-label">Loop Current:</label><span style="font-family:monospace; color:var(--green); font-size:1.1rem; font-weight:bold;">${currentMa} mA</span>`;
        
        if (wbSelectedElement.compType === 'led') {
            if (wbSelectedElement.burned) {
                statusText += `<br><span style="color:var(--red); font-weight:bold; font-size:0.95rem; text-shadow:0 0 5px rgba(255,0,0,0.2);">💥 STATUS: BURNED OUT (Overcurrent!)</span>`;
            } else if (wbSelectedElement.active) {
                statusText += `<br><span style="color:#FF4757; font-weight:bold; font-size:0.95rem;">💡 STATUS: GLOWING SAFE</span>`;
            } else {
                statusText += `<br><span style="color:var(--text-muted); font-size:0.95rem;">💤 STATUS: NO LOOP POWER</span>`;
            }
        } else if (wbSelectedElement.compType === 'motor') {
            if (wbSelectedElement.active) {
                statusText += `<br><span style="color:var(--cyan); font-weight:bold; font-size:0.95rem;">⚙️ STATUS: SPINNING ACTIVE</span>`;
            } else {
                statusText += `<br><span style="color:var(--text-muted); font-size:0.95rem;">💤 STATUS: INACTIVE</span>`;
            }
        } else if (wbSelectedElement.compType === 'ir_sensor') {
            const powStatus = wbSelectedElement.powered ? '<span style="color:var(--green); font-weight:bold;">YES</span>' : '<span style="color:var(--red); font-weight:bold;">NO</span>';
            const detStatus = wbSelectedElement.detected ? '<span style="color:var(--green); font-weight:bold;">DETECTED!</span>' : '<span style="color:var(--text-muted);">CLEAR</span>';
            const objDistVal = Math.round(Math.abs(wbSelectedElement.objDistance || -80));
            statusText = `
                <label class="wb-prop-label">Powered (VCC/GND):</label> ${powStatus}
                <br><label class="wb-prop-label">Object Distance:</label> <span style="font-family:monospace; color:var(--cyan);">${objDistVal} px</span>
                <br><label class="wb-prop-label">Detection Status:</label> ${detStatus}
            `;
        }
        
        statsBox.innerHTML = statusText;
        panel.appendChild(statsBox);
    }
};

window.wbUpdateComponent = () => {
    if (!wbSelectedElement) return;
    
    if (wbSelectedElement.compType === 'resistor') {
        let val = parseInt(document.getElementById('wbResistorValue').value);
        if (isNaN(val) || val < 1) val = 1;
        wbSelectedElement.resistance = val;
        window.wbRegenerateResistorImage(wbSelectedElement);
        wbSaveState(); 
        if (wbIsRunning) simulateCircuit();
        else wbRedraw();
    } else if (wbSelectedElement.compType === 'ir_sensor') {
        let val = parseInt(document.getElementById('wbIRTriggerDist').value);
        wbSelectedElement.triggerDistance = val;
        document.getElementById('wbIRTriggerValue').innerText = `${val} px`;
        wbSaveState(); 
        if (wbIsRunning) simulateCircuit();
        else wbRedraw();
    }
};

function getResistorBands(ohms) {
    const colors = ['#000000', '#8B4513', '#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#EE82EE', '#808080', '#FFFFFF'];
    let s = ohms.toString();
    let d1, d2, mult;
    if (ohms < 10) {
        d1 = 0;
        d2 = ohms;
        mult = 0;
    } else {
        d1 = parseInt(s[0]);
        d2 = parseInt(s[1]);
        mult = s.length - 2; 
    }
    if (mult > 9) mult = 9;
    return { c1: colors[d1], c2: colors[d2], c3: colors[mult], c4: '#b8860b' };
}

window.wbRegenerateResistorImage = (el) => {
    const bands = getResistorBands(el.resistance);
    const svgStr = `<svg width="120" height="60" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="27" width="120" height="5" fill="#e0e0e0"/><path d="M 22 17 L 98 17 C 104 17 104 41 98 41 L 22 41 C 16 41 16 17 22 17 Z" fill="#d3a77a" stroke="#a67c52" stroke-width="2.5"/><rect x="35" y="17" width="7" height="24" fill="${bands.c1}"/><rect x="52" y="17" width="7" height="24" fill="${bands.c2}"/><rect x="69" y="17" width="7" height="24" fill="${bands.c3}"/><rect x="86" y="17" width="5" height="24" fill="${bands.c4}"/></svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    img.onload = () => { if (!wbIsRunning) wbRedraw(); };
    el.customImage = img;
};
