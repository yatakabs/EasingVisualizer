import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Configuration for annotations
// Place labels above the views with arrows pointing down into the view content
const annotations = [
  {
    text: 'Third Person ビュー',
    targetX: 200,   // Center of third person view
    targetY: 580,   // Point into the view content area
    labelX: 70,     // Left side label
    labelY: 490,    // Above the view
  },
  {
    text: 'First Person ビュー', 
    targetX: 590,   // Center of first person view
    targetY: 580,   // Point into the view content
    labelX: 430,    // Centered above first person view
    labelY: 490,    // Same height as others
  },
  {
    text: 'タイミンググラフ',
    targetX: 920,   // Center of timing graph (not the legend)
    targetY: 620,   // Point into graph area
    labelX: 810,    // Above timing graph
    labelY: 490,    // Same height as others
  },
];

// Arrow helper function - creates SVG path for arrow with proper arrowhead
function createArrowPath(x1, y1, x2, y2, headLength = 12, headAngle = 25) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headAngleRad = (headAngle * Math.PI) / 180;
  
  // Arrow line
  const linePath = `M ${x1} ${y1} L ${x2} ${y2}`;
  
  // Arrowhead points
  const head1X = x2 - headLength * Math.cos(angle - headAngleRad);
  const head1Y = y2 - headLength * Math.sin(angle - headAngleRad);
  const head2X = x2 - headLength * Math.cos(angle + headAngleRad);
  const head2Y = y2 - headLength * Math.sin(angle + headAngleRad);
  
  // Filled arrowhead (triangle)
  const arrowHeadPath = `M ${x2} ${y2} L ${head1X} ${head1Y} L ${head2X} ${head2Y} Z`;
  
  return { linePath, arrowHeadPath };
}

async function annotateScreenshot(inputPath, outputPath) {
  // Read the input image
  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width || 1400;
  const height = metadata.height || 900;
  
  console.log(`Image dimensions: ${width}x${height}`);
  
  // Generate SVG overlay with annotations
  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="black" flood-opacity="0.8"/>
      </filter>
      <style>
        @font-face {
          font-family: 'Noto Sans JP';
          src: local('Noto Sans JP'), local('Yu Gothic'), local('Meiryo'), local('MS Gothic');
        }
        .annotation-text {
          font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', 'MS Gothic', sans-serif;
          font-size: 18px;
          font-weight: bold;
          fill: #00E5FF;
          filter: url(#shadow);
        }
        .arrow-line {
          stroke: #00E5FF;
          stroke-width: 3;
          fill: none;
          filter: url(#shadow);
        }
        .arrow-head {
          fill: #00E5FF;
          stroke: none;
          filter: url(#shadow);
        }
        .text-stroke {
          font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', 'MS Gothic', sans-serif;
          font-size: 18px;
          font-weight: bold;
          fill: none;
          stroke: white;
          stroke-width: 4;
          stroke-linejoin: round;
        }
        .arrow-stroke {
          stroke: white;
          stroke-width: 7;
          fill: none;
        }
        .arrow-head-stroke {
          fill: white;
          stroke: white;
          stroke-width: 4;
        }
      </style>
    </defs>`;

  // Add annotations
  for (const ann of annotations) {
    // Calculate text width approximately (18px font * character count * 0.5-0.7)
    const textWidth = ann.text.length * 10;
    
    const { linePath, arrowHeadPath } = createArrowPath(
      ann.labelX + textWidth / 2, // Start from center of text
      ann.labelY + 15,  // Below the text
      ann.targetX,
      ann.targetY,
      14,
      30
    );
    
    // White stroke/outline for arrow (drawn first, behind)
    svgContent += `
      <path d="${linePath}" class="arrow-stroke"/>
      <path d="${arrowHeadPath}" class="arrow-head-stroke"/>`;
    
    // Cyan arrow line and head
    svgContent += `
      <path d="${linePath}" class="arrow-line"/>
      <path d="${arrowHeadPath}" class="arrow-head"/>`;
    
    // White stroke/outline for text (drawn first, behind)
    svgContent += `
      <text x="${ann.labelX}" y="${ann.labelY}" class="text-stroke">${ann.text}</text>`;
    
    // Cyan text
    svgContent += `
      <text x="${ann.labelX}" y="${ann.labelY}" class="annotation-text">${ann.text}</text>`;
  }
  
  svgContent += `</svg>`;
  
  // Save SVG for debugging
  fs.writeFileSync(inputPath.replace('.png', '-overlay.svg'), svgContent);
  
  // Create the overlay buffer
  const svgBuffer = Buffer.from(svgContent);
  
  // Composite the annotation overlay onto the screenshot
  await sharp(inputPath)
    .composite([{
      input: svgBuffer,
      top: 0,
      left: 0,
    }])
    .toFile(outputPath);
  
  console.log(`Annotated screenshot saved to: ${outputPath}`);
}

// Run the script
const inputPath = path.resolve('d:/Repos/BeatSaber/Utilities/EasingVisualizer/.playwright-mcp/scriptmapper-three-views.png');
const outputPath = path.resolve('d:/Repos/BeatSaber/Utilities/EasingVisualizer/wiki/screenshots/scriptmapper-mode-three-views.png');

annotateScreenshot(inputPath, outputPath).catch(console.error);
