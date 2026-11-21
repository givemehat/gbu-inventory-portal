import React from 'react';

/**
 * Pure SVG Code-128 Style Barcode Generator
 * Generates clean, crisp, scale-independent vector barcodes for item SKUs and store slips.
 */
export function BarcodeSvg({ code = 'GBU-STN-001', height = 40, showText = true, className = '' }) {
  // Generate deterministic bar widths based on code hash
  const bars = [];
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed = (seed * 31 + code.charCodeAt(i)) & 0xffffffff;
  }

  // Create quiet zone and start pattern (2,1,1,2,3,2)
  const pattern = [2, 1, 1, 2, 3, 2];
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    pattern.push((charCode % 3) + 1);
    pattern.push(((charCode >> 2) % 3) + 1);
    pattern.push(((charCode >> 4) % 2) + 1);
    pattern.push(((charCode >> 1) % 3) + 1);
  }
  // Stop pattern
  pattern.push(2, 3, 3, 1, 1, 1, 2);

  let currentX = 10;
  pattern.forEach((width, index) => {
    const isBar = index % 2 === 0;
    if (isBar) {
      bars.push(
        <rect
          key={index}
          x={currentX}
          y={0}
          width={width}
          height={height}
          fill="#14213D"
        />
      );
    }
    currentX += width;
  });

  const totalWidth = currentX + 10;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="overflow-visible"
        aria-label={`Barcode for ${code}`}
      >
        {bars}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-ink mt-1 uppercase">
          *{code}*
        </span>
      )}
    </div>
  );
}

/**
 * Store Bin Matrix QR Code SVG Placeholder
 * Used for bin labeling and mobile scanner validation
 */
export function BinQrSvg({ code = 'RACK-A1', size = 52, className = '' }) {
  // Deterministic 9x9 micro QR-like pattern
  const grid = [];
  const gridSize = 9;
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 37 + code.charCodeAt(i)) & 0xffff;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Corner finder patterns (3x3 corners)
      const isCornerTL = r < 3 && c < 3;
      const isCornerTR = r < 3 && c >= gridSize - 3;
      const isCornerBL = r >= gridSize - 3 && c < 3;
      const isCorner = isCornerTL || isCornerTR || isCornerBL;

      if (isCorner) {
        const isBorder = (r === 0 || r === 2 || c === 0 || c === 2) && isCornerTL;
        const isBorderTR = (r === 0 || r === 2 || c === gridSize - 3 || c === gridSize - 1) && isCornerTR;
        const isBorderBL = (r === gridSize - 3 || r === gridSize - 1 || c === 0 || c === 2) && isCornerBL;
        const isCenter = (r === 1 && c === 1) || (r === 1 && c === gridSize - 2) || (r === gridSize - 2 && c === 1);
        if (isBorder || isBorderTR || isBorderBL || isCenter) {
          grid.push({ r, c, fill: '#14213D' });
        }
      } else {
        // Pseudo-random data bits
        const bit = ((hash >> ((r * gridSize + c) % 16)) & 1) === 1;
        if (bit) grid.push({ r, c, fill: '#14213D' });
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`border border-line rounded bg-white p-1 shadow-2xs ${className}`}
      aria-label={`Bin QR code for ${code}`}
    >
      {grid.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill={cell.fill}
        />
      ))}
    </svg>
  );
}
