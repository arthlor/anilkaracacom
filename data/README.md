# Research data

This directory contains source inputs used to reproduce or validate portfolio
stories. Files here are versioned but are not shipped to the browser.

## Sources

- `sources/izmir-building-floors/` contains the municipality building-floor
  export and its raw JSON representation. The public derivatives live in
  `public/data/izmir-kat/`; `npm run validate:izmir-kat` reconciles them.
- `sources/izmir-public-transport/` contains the original İzmirim Kart
  transport statistics export. Browser-ready story data lives in
  `src/data/transit/`.

Do not edit source files merely to make a visualization convenient. Transform
or normalize them into `src/data/` or `public/data/` and keep validation rules
in `scripts/`.
