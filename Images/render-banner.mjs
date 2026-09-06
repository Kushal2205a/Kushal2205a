// Rebuild with: node Images/render-banner.mjs
// Requires rsvg-convert and ImageMagick.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const directory = new URL('.', import.meta.url);
const source = readFileSync(new URL('profile-header.svg', directory), 'utf8');
const base = source.slice(0, source.indexOf('  <text x="742"'))
  .replace(/<desc id="desc">[\s\S]*?<\/desc>/, '<desc id="desc">An agent navigates a maze, encounters a wall, takes a detour, and reaches its goal.</desc>');
const temporary = mkdtempSync(join(tmpdir(), 'profile-maze-'));
const route = [[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[4,2],[5,2],[6,2],[6,1],[6,0]];
const frames = [];
const point = ([x,y]) => [786+x*48, 108+y*48];
for (let step=0; step<route.length; step++) {
  const complete = step === route.length-1;
  const caption = step<2 ? '01 / Head toward the goal' : step===2 ? '02 / Path blocked. Replan.' : complete ? '04 / Goal reached' : '03 / Take the open route';
  let diagram = '<text x="742" y="53" fill="#D6A17D" font-family="monospace" font-size="13" letter-spacing="2">PLAN / TEST / ADAPT</text>';
  for(let y=0;y<4;y++) for(let x=0;x<7;x++) {
    const wall=x===3 && y<3;
    diagram += `<rect x="${764+x*48}" y="${86+y*48}" width="44" height="44" rx="4" fill="${wall?'#4B5146':'#222721'}" stroke="${wall?'#6B7462':'#343C32'}"/>`;
    if(wall) diagram += `<path d="M${775+x*48} ${119+y*48}l22 -22" stroke="#7A826F" opacity=".6"/>`;
  }
  const points=route.slice(0,step+1).map(p=>point(p).join(',')).join(' ');
  if(step>0) diagram += `<polyline points="${points}" fill="none" stroke="#D6A17D" stroke-width="3" stroke-linejoin="round"/>`;
  if(step===2) diagram += '<path d="M892 204H914M909 198l12 12m0 -12l-12 12" stroke="#DA9A87" stroke-width="2"/>';
  diagram += '<path d="M1066 98v22m0 -22h15l-4 6 4 6h-15" stroke="#ADC69A" stroke-width="2"/>';
  const [cx,cy]=point(route[step]);
  diagram += `<circle cx="${cx}" cy="${cy}" r="14" fill="#191C1A" stroke="${complete?'#ADC69A':'#D6A17D'}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="5" fill="${complete?'#ADC69A':'#D6A17D'}"/>`;
  diagram += `<text x="742" y="298" fill="#EEECE4" font-family="Arial, sans-serif" font-size="18">${caption}</text><text x="742" y="324" fill="#929E90" font-family="monospace" font-size="12">Navigate a maze. Learn from the obstacle.</text>`;
  const svg=base+diagram+'\n</svg>\n';
  const svgPath=join(temporary, `${step}.svg`);
  const pngPath=join(temporary, `${step}.png`);
  writeFileSync(svgPath, svg);
  execFileSync('rsvg-convert',[svgPath,'-o',pngPath]);
  frames.push('-delay', String(step===2||complete?180:65),pngPath);
  if(complete) writeFileSync(new URL('profile-header.svg',directory),svg);
}
execFileSync('magick',[...frames,'-loop','0','-layers','Optimize',new URL('profile-header.gif',directory).pathname]);
console.log('Rendered 11 frames. Preview frames: '+temporary);
