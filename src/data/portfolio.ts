import type { ImageMetadata } from 'astro';

import aiFitCheckIcon from '../assets/images/projects/aifitcheckicon.jpg';
import choreusIcon from '../assets/images/projects/choreusicon.png';
import yeserIcon from '../assets/images/projects/icon.png';

export const resumeLinks = {
  master: '/anilkaraca-cv.pdf',
  dataJournalism: '/anil-karaca-data-journalism-cv.pdf',
  developer: '/anil-karaca-developer-cv.pdf',
} as const;

export const expertiseLanes = [
  {
    slug: 'data-journalism',
    title: 'Data Journalism',
    kicker: 'Reporting, analysis, and visual storytelling',
    summary:
      'I turn public-interest data into investigations, explainers, and interactive stories that help readers understand politics, cities, and social change.',
  },
  {
    slug: 'developer',
    title: 'Developer',
    kicker: 'Frontend, mobile, and product delivery',
    summary:
      'I design and ship apps, editorial interfaces, and product experiences with React Native, React, Astro, and pragmatic data workflows.',
  },
] as const;

export const journalismMethods = [
  'Investigations built from public data, election results, and civic records',
  'Interactive explainers that combine reporting, analysis, and scrollytelling',
  'Visual systems for making dense political or city data readable',
] as const;

export const developerMethods = [
  'React Native and Expo apps shipped from concept to App Store release',
  'Frontend systems and editorial products built with React and Astro',
  'AI-assisted workflows used to accelerate delivery, not replace engineering judgment',
] as const;

export type AppProject = {
  name: string;
  tagline: string;
  description: string;
  technicalSummary: string;
  role: string;
  impact: string;
  stack: string[];
  appStoreUrl: string;
  image: string | ImageMetadata;
};

export const appProjects: AppProject[] = [
  {
    name: 'Yeser',
    tagline: 'Gratitude journal',
    description:
      'A wellness app focused on repeat journaling, streaks, and lightweight reflection prompts.',
    technicalSummary:
      'Built as a consumer mobile product with React Native and Expo, focused on simple onboarding and repeat-use UX.',
    role: 'Product design, React Native implementation, release workflow',
    impact: 'Shows shipped mobile product work beyond prototypes or demos.',
    stack: ['React Native', 'Expo', 'Mobile UX'],
    appStoreUrl: 'https://apps.apple.com/us/app/ye%C5%9Fer/id6747253728',
    image: yeserIcon,
  },
  {
    name: 'ChoreUs',
    tagline: 'Gamified household app',
    description:
      'A family coordination app that turns chores into shared progress, points, and accountability loops.',
    technicalSummary:
      'Designed as a playful task product with mobile-first interaction patterns and retention-oriented mechanics.',
    role: 'Product strategy, interface implementation, app delivery',
    impact: 'Demonstrates consumer app thinking, not just engineering execution.',
    stack: ['React Native', 'Expo', 'Product Thinking'],
    appStoreUrl: 'https://apps.apple.com/us/app/choreus-gamify-boring-chores/id6755533194',
    image: choreusIcon,
  },
  {
    name: 'AI Fit Check',
    tagline: 'AI styling assistant',
    description:
      'An image-based fashion feedback app that turns photos into fast, opinionated style guidance.',
    technicalSummary:
      'Built as an AI-assisted mobile product with upload flows, feedback UX, and a playful consumer positioning.',
    role: 'Concept, app UX, integration, release workflow',
    impact: 'Shows experimentation with AI features inside a real app experience.',
    stack: ['React Native', 'Expo', 'AI Product'],
    appStoreUrl: 'https://apps.apple.com/tr/app/ai-fit-check-slay-or-nay/id6757414884',
    image: aiFitCheckIcon,
  },
];

export const dataJournalismProjectSlugs = [
  'crackdown-on-chp',
  'parliament-analysis',
] as const;

export const supportingProjectSlugs = ['attack-on-ozgur-ozel'] as const;

export const featuredArticleSlugs = [
  'izmir-trafik-kazasi-raporu',
  'turkey-elections-red-wave',
  'izmir-toplu-tasima',
] as const;

export const workplaces = [
  { name: 'Izmir Metropolitan Municipality', logo: '/images/workplaces/izmir-bsb.png', url: 'https://www.izmir.bel.tr/' },
  { name: 'Izbeton', logo: '/images/workplaces/izbeton.png', url: 'https://www.izbeton.com.tr/' },
  { name: 'BirGun', logo: '/images/workplaces/birgun.png', url: 'https://www.birgun.net/' },
  { name: 'dokuz8HABER', logo: '/images/workplaces/dokuz8.png', url: 'https://www.dokuz8haber.net/' },
  { name: 'Egede SonSoz', logo: '/images/workplaces/sonsoz.png', url: 'https://www.egedesonsoz.com/' },
] as const;

export const credibilityHighlights = [
  '10+ years across journalism, public communications, and product work',
  'Editorial work spanning elections, civic data, urban systems, and political accountability',
  'Shipped mobile apps and interactive sites alongside newsroom and communications work',
] as const;

export const careerTimeline = [
  {
    year: '2025 - Present',
    title: 'App developer and data journalist',
    description: 'Shipping mobile apps while continuing public-interest reporting and interactive analysis.',
  },
  {
    year: '2024',
    title: 'Communications advisor',
    description: 'Produced civic communications, digital content, and documentary work for municipal institutions.',
  },
  {
    year: '2019',
    title: 'Senior digital journalist',
    description: 'Led digital storytelling, visual reporting, and multi-format newsroom work.',
  },
  {
    year: '2014',
    title: 'Started in digital journalism',
    description: 'Built an editorial foundation in reporting, publishing, and audience-facing storytelling.',
  },
] as const;

export const supportingVideo = {
  title: 'Ekmegimizi Buyutuyoruz, Adil Bolusuyoruz',
  description:
    'A municipal documentary produced end-to-end as a solo project, included here as supporting proof of story structure, interview framing, and visual communication.',
  videoId: 'iZtaIuGnjzU',
  url: 'https://www.youtube.com/watch?v=iZtaIuGnjzU',
};

export const contactFocusAreas = [
  'Data journalism and newsroom roles',
  'Frontend, product, and mobile engineering roles',
  'Editorial product and storytelling-focused teams',
] as const;
