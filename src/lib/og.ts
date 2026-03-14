import { pillarConfig, siteConfig, type PillarKey } from './site';

type OgCardPayload = {
  title: string;
  description: string;
  pillar?: PillarKey;
  typeLabel: string;
  techStack?: string[];
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function wrapText(text: string, maxLength: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }

    currentLine = nextLine;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getPillarAccent(pillar?: PillarKey) {
  switch (pillar) {
    case 'data-journalism-civic-tech':
      return '#20b2aa';
    case 'scientific-environmental-modeling':
      return '#ff9f43';
    case 'geopolitical-network-analysis':
      return '#ff6b6b';
    case 'software-systems-architecture':
      return '#4dabf7';
    default:
      return '#20b2aa';
  }
}

export function renderOgSvg({
  title,
  description,
  pillar,
  typeLabel,
  techStack = [],
}: OgCardPayload) {
  const accent = getPillarAccent(pillar);
  const pillarLabel = pillar ? pillarConfig[pillar].title : 'Hybrid Portfolio';
  const titleLines = wrapText(title, 26).slice(0, 3);
  const descriptionLines = wrapText(description, 54).slice(0, 3);
  const badges = techStack.slice(0, 4);

  const badgeMarkup = badges
    .map((badge, index) => {
      const x = 56 + index * 170;
      return `
        <rect x="${x}" y="540" rx="18" ry="18" width="154" height="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" />
        <text x="${x + 18}" y="564" fill="#f3f7f8" font-size="20" font-family="Inter, Arial, sans-serif">${escapeXml(badge)}</text>
      `;
    })
    .join('');

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="#061014" />
          <stop offset="1" stop-color="#0d1419" />
        </linearGradient>
        <radialGradient id="flare" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1040 90) rotate(135) scale(420 420)">
          <stop stop-color="${accent}" stop-opacity="0.34" />
          <stop offset="1" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)" />
      <rect width="1200" height="630" fill="url(#flare)" />
      <rect x="36" y="36" width="1128" height="558" rx="30" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <rect x="56" y="56" width="260" height="42" rx="21" fill="${accent}" fill-opacity="0.14" />
      <text x="82" y="83" fill="${accent}" font-size="20" font-weight="700" font-family="Inter, Arial, sans-serif">${escapeXml(typeLabel)}</text>
      <text x="56" y="138" fill="#9fb2b8" font-size="24" font-family="Inter, Arial, sans-serif">${escapeXml(pillarLabel)}</text>

      ${titleLines
        .map(
          (line, index) => `
            <text x="56" y="${210 + index * 72}" fill="#f8fbfc" font-size="58" font-weight="700" font-family="'Space Grotesk', Arial, sans-serif">${escapeXml(line)}</text>
          `,
        )
        .join('')}

      ${descriptionLines
        .map(
          (line, index) => `
            <text x="56" y="${430 + index * 34}" fill="#b8c5c9" font-size="26" font-family="Inter, Arial, sans-serif">${escapeXml(line)}</text>
          `,
        )
        .join('')}

      ${badgeMarkup}

      <text x="56" y="612" fill="#6f848b" font-size="20" font-family="Inter, Arial, sans-serif">${escapeXml(siteConfig.personName)} • ${escapeXml(siteConfig.url.replace(/^https?:\/\//, ''))}</text>
    </svg>
  `;
}
