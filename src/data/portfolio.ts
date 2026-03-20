import type { ImageMetadata } from 'astro';

import aiFitCheckIcon from '../assets/images/projects/aifitcheckicon.webp';
import choreusIcon from '../assets/images/projects/choreusicon.webp';
import yeserIcon from '../assets/images/projects/yesericon.webp';

// Workplace Logos
import izmirBsbLogo from '../assets/images/workplaces/izmir-bsb.webp';
import izbetonLogo from '../assets/images/workplaces/izbeton.webp';
import birgunLogo from '../assets/images/workplaces/birgun.webp';
import dokuz8Logo from '../assets/images/workplaces/dokuz8.webp';
import sonsozLogo from '../assets/images/workplaces/sonsoz.webp';

export const resumeLinks = {
  master: '/anilkaraca.pdf',
} as const;

export const expertiseLanes = [
  {
    slug: 'data-journalism',
    title: 'Data Journalism',
    kicker: 'Reporting, analysis, and visual systems',
    summary:
      'I decode complex public datasets into investigations and interactive stories that make power, politics, and urban systems legible.',
  },
  {
    slug: 'developer',
    title: 'Product Engineer',
    kicker: 'Mobile, frontend, and systems delivery',
    summary:
      'I architect mobile apps and editorial interfaces with React Native and Astro, focused on performance and seamless product execution.',
  },
] as const;

export const journalismMethods = [
  'Deep investigations built from election records and civic micro-data',
  'Interactive features that merge field reporting with rigorous analysis',
  'Custom visual systems for making dense institutional data accessible',
] as const;

export const developerMethods = [
  'Consumer iOS applications shipped from concept to App Store release',
  'High-performance frontend systems and tailored editorial products',
  'Strategic use of AI to accelerate delivery without compromising integrity',
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
    impact: 'Proven track record of shipping real-world consumer mobile products.',
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
    impact: 'Evidence of product-first thinking in a competitive consumer space.',
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
    impact: 'Rapid experimentation with AI features integrated into a production UX.',
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
  'izmir-coronavirus-toplu-tasima',
] as const;

export const workplaces = [
  { name: 'Izmir Metropolitan Municipality', logo: izmirBsbLogo, url: 'https://www.izmir.bel.tr/' },
  { name: 'Izbeton', logo: izbetonLogo, url: 'https://www.izbeton.com.tr/' },
  { name: 'BirGun', logo: birgunLogo, url: 'https://www.birgun.net/' },
  { name: 'dokuz8HABER', logo: dokuz8Logo, url: 'https://www.dokuz8haber.net/' },
  { name: 'Egede SonSoz', logo: sonsozLogo, url: 'https://www.egedesonsoz.com/' },
] as const;

export const credibilityHighlights = [
  'A decade of experience bridging high-stakes journalism and product work',
  'Expertise in elections, civic data, and institutional accountability',
  'Full-stack product delivery across newsrooms and independent ventures',
] as const;

export type ExperienceEntry = {
  period: string;
  role: string;
  organization: string;
  context: string;
  summary: string;
  highlights: string[];
};

export const experienceEntries: ExperienceEntry[] = [
  {
    period: '2025 - Present',
    role: 'Independent app developer and data journalist',
    organization: 'Self-directed work',
    context: 'Mobile apps, interactive case studies, and public-interest reporting',
    summary:
      'Building consumer iOS apps while continuing reporting, data analysis, and editorial-style product work in one portfolio.',
    highlights: [
      'Shipped React Native and Expo apps as real App Store products',
      'Built case studies that connect reporting, interface design, and engineering',
      'Using independent work as proof of end-to-end product ownership',
    ],
  },
  {
    period: '2024',
    role: 'Communications advisor',
    organization: 'Izmir Metropolitan Municipality and Izbeton',
    context: 'Civic communications, digital content, and documentary production',
    summary:
      'Produced public-facing communication work for municipal institutions, with a mix of editorial structure, visual communication, and delivery.',
    highlights: [
      'Worked inside a civic institution context with public accountability',
      'Produced digital communication assets and documentary work',
      'Bridged reporting instincts with message clarity and execution',
    ],
  },
  {
    period: '2014 - 2024',
    role: 'Senior digital journalist',
    organization: 'BirGun, dokuz8HABER, and Egede SonSoz',
    context: 'Digital reporting, live publishing, and visual storytelling',
    summary:
      'Built a decade-long newsroom foundation across reporting, publishing, analysis, and multi-format storytelling, with a strong focus on politics, cities, and public systems.',
    highlights: [
      'Covered elections, civic systems, transportation, and political accountability',
      'Worked across fast newsroom publishing and deeper analytical formats',
      'Developed the reporting habits that now shape product and interface decisions',
    ],
  },
];

export type EducationEntry = {
  institution: string;
  degree: string;
  period: string;
  grade: string;
  notes?: string;
  skills?: string[];
};

export const educationEntries: EducationEntry[] = [
  {
    institution: 'Kadir Has University',
    degree: "Master's degree, New Media",
    period: '2017 - 2019',
    grade: 'GPA 3.68',
    skills: ['Data Analysis'],
  },
  {
    institution: 'Ege University',
    degree: "Bachelor's degree, Journalism",
    period: '2011 - 2015',
    grade: 'GPA 2.94',
    notes: 'Activities and societies: University club of Sci-Fi and Fantasy.',
  },
  {
    institution: 'University of Lodz',
    degree: "Bachelor's degree, Journalism",
    period: '2014',
    grade: 'GPA 3.75',
    notes: 'Erasmus programme.',
  },
];

export type PublicationEntry = {
  title: string;
  type: string;
  publisher: string;
  year: string;
  href: string;
  summary: string;
};

export const publicationEntries: PublicationEntry[] = [
  {
    title: "News readers' perception of clickbait news",
    type: "Master's thesis",
    publisher: 'Kadir Has University',
    year: '2019',
    href: 'https://hdl.handle.net/20.500.12469/2753',
    summary:
      'Graduate research on how online news readers perceive clickbait, combining survey data, open-ended responses, and interviews with digital news executives.',
  },
];

export const supportingVideo = {
  title: 'Ekmegimizi Buyutuyoruz, Adil Bolusuyoruz',
  description:
    'A municipal documentary produced end-to-end as a solo project, included here as supporting proof of story structure, interview framing, and visual communication.',
  videoId: 'iZtaIuGnjzU',
  url: 'https://www.youtube.com/watch?v=iZtaIuGnjzU',
};
