import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const izmirKatSourceDirectory = resolve(
  repositoryRoot,
  "data/sources/izmir-building-floors",
);

export const izmirKatPublicDirectory = resolve(
  repositoryRoot,
  "public/data/izmir-kat",
);
