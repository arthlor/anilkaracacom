import type { APIRoute } from "astro";

import { renderOgSvg } from "../../lib/og";
import { siteConfig } from "../../lib/site";

export const GET: APIRoute = () => {
  const svg = renderOgSvg({
    title: siteConfig.personName,
    description: siteConfig.description,
    typeLabel: "Portfolio",
    techStack: ["Data Journalism", "Frontend", "Mobile", "Civic Tech"],
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
