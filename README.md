# Phase Out Village

_**Chill, baby! Chill!**_

Phase Out Village is a web game that explores scenarios for phasing out Norwegian oil and gas production

In this simulation, you can plan phase out for each field on the Norwegian continental shelf and see the impact on
emissions, production and on the Norwegian economy.

The simulation uses production data from the Norwegian Petroleum and emission data from Offshore Norway.

## Data provenance

Production data has been collected from [Norwegian Petroleum](https://www.norskpetroleum.no/fakta/felt/aasta-hansteen/)

Emission data has been collected
from [Offshore Norway emission reports](https://www.offshorenorge.no/faginnhold/rapporter/klima-og-miljo/feltspesifikke-utslipp/).
In what seems like an effort of data obstruction, this data in only published as individual PDFs for each oil field for
each year from 2012-2024.
The PDFs have painstakingly been scraped by volunteers at the Norwegian Green Party.

Geographic data has been collected from [Norwegian Offshore Directorate](https://factmaps.sodir.no/)

The data is collected into a [publicly available spreadsheet](https://docs.google.com/spreadsheets/d/1mHusVg0hu4YWcPycictRjjP3GAPjN1yC2V0eTaLupgo/edit?gid=0#gid=0)

As future production is secret and emission is tied to production, the following estimates are used for future values:

- Future production is based on the average of the last five years with a projected depletion of 10% per year
- Average emission intensity is set to the average of the last five years
  - For selected oil fields, the total emission is set to be constant as the emissions mainly based on constant
    factors
- For future electricity consumption, the future consumption uses the last known value scaled by production volume
- The user can select whether to use the USD 80 as a future oil price, adjust the oil price by a yearly percentage
  between -5% and +5% (official scenarios seem to be a bit above +2%) or set a price for each year
- Revenue is estimated as a percentage of the market price of the production volume, based on past trends.
  78% of the revenue is calculated as the tax revenue. We set an estimated dividend percentage for each oil field
  based on historical values

## Tech Stack

This project uses a modern, high-performance stack for rapid UI development and simulation:

- **Core:** React + Vite + TypeScript — Fast, modern, great ecosystem
- **State Management:** Zustand — Simple, performant, less boilerplate
- **UI Components & Styling:** Chakra UI — Accessible, easy theming, flexible
- **Data Visualization:** Recharts — Declarative, React-first, customizable
- **Map Rendering:** react-simple-maps — Lightweight, stylized, easy interactivity
- **Internationalization:** react-i18next — Standard, dynamic switching
- **Animations:** Framer Motion — Modern, easy, React-native
- **Testing:** Jest + React Testing Library — Standard, easy, good docs

## Features

- For each oil field, the user can select an phase out year between 2027 and 2040
- All Norwegian oil fields are displayed on a map with a shading that shows their emission intensity. When the user
  selects a phase out year for any field, the total contribution of each field determines the shading instead
- A graph displays the emission of the current projected production. When the user selects a production end data for an
  oil field, their production graph is displayed alongside the baseline
- Similarly to emissions, a graph of production for the baseline scenario and the user's planned scenario is displayed
- Similarly to emissions and production, a graph of revenue for the baseline scenario and the user's planned scenario is
  displayed. The revenue is divided into fund contributions and direct budget contributions
- When the user selects an oil field, the graphs are limited to that oil field

## Inspirational idea

![phase-out-village-sketch.png](phase-out-village-sketch.png)

## Technology

This game is a purely frontend application developed with React. OpenLayers are used for the maps and Chart.js for the
charts. The game is optimized for mobile display format.

The development language is English. The UI language is Norwegian.

## Design & Planning

This section documents the current game plan and wireframes for Phase Out Village. All diagrams are stored here for transparency and future reference.

### High-Level Screen Flow
```mermaid
flowchart TD
  A[Landing Page]
  B[Main Game Screen]
  C[Annual Status Popup]
  D[Endgame/Results Screen]

  A -- Play game --> B
  B -- Advance year --> C
  C -- Continue --> B
  B -- Game ends --> D
  D -- Restart --> A

  subgraph Main Game Screen Details
    B1[Map: Clickable Oil Fields]
    B2[Resource Bars: Emissions, Energy, Happiness, Equality, Revenue]
    B3[Investment Controls]
    B4[Timeline/Progress Bar]
    B5[Language Toggle]
    B6[Advance Year Button]
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5
    B --> B6
  end

  subgraph Annual Status Popup Details
    C1[Yearly Metrics Summary]
    C2[Paris Agreement Feedback]
    C3[Continue Button]
    C --> C1
    C --> C2
    C --> C3
  end

  subgraph Endgame/Results Screen Details
    D1[Final Summary]
    D2[Graphs of Metrics]
    D3[Narrative]
    D4[Restart Button]
    D --> D1
    D --> D2
    D --> D3
    D --> D4
  end
```

### Landing Page Wireframe
```mermaid
flowchart TD
  L1[Game Title: Phase Out Village]
  L2[Short Description]
  L3[Play Game Button]
  L4[Language Toggle (EN/NO)]
  L5[Inspirational Image/Sketch]
  L6[Credits/Links (optional)]

  L1 --> L2
  L2 --> L3
  L3 --> L4
  L1 --> L5
  L5 --> L6
```

### Main Game Screen Wireframe
```mermaid
flowchart TD
  M1[Map: Clickable Oil Fields]
  M2[Resource Bars: Emissions, Energy, Happiness, Equality, Revenue]
  M3[Investment Controls: Energy Efficiency, Oil, Renewables, Nuclear]
  M4[Timeline/Progress Bar (Years)]
  M5[Advance Year Button]
  M6[Language Toggle (EN/NO)]
  M7[Tooltip/Help Button]

  M1 --> M2
  M2 --> M3
  M3 --> M4
  M4 --> M5
  M2 --> M6
  M6 --> M7
```

### Annual Status Popup Wireframe
```mermaid
flowchart TD
  P1[Popup: Yearly Status]
  P2[Metrics Summary: Emissions, Energy, Happiness, Equality, Revenue]
  P3[Phase-Out Progress]
  P4[Investments Overview]
  P5[Paris Agreement Feedback]
  P6[Continue Button]

  P1 --> P2
  P2 --> P3
  P3 --> P4
  P4 --> P5
  P5 --> P6
```

### Endgame/Results Screen Wireframe
```mermaid
flowchart TD
  E1[Final Summary: Paris Agreement Compliance]
  E2[Graphs: Emissions, Energy, Happiness, Equality, Revenue Over Time]
  E3[Narrative Summary]
  E4[Restart Button]
  E5[Share/Export Option (optional)]

  E1 --> E2
  E2 --> E3
  E3 --> E4
  E4 --> E5
```

### Current Plan Summary
- The game is being built from scratch with a Vite + React + TypeScript stack.
- The user will phase out oil fields on a map, invest in energy options, and receive annual feedback on emissions, energy, happiness, equality, and revenue.
- The win condition is phasing out oil fields in line with the Paris Agreement.
- The UI will feature a clickable map, resource bars, investment controls, timeline, annual popups, and a language toggle (English/Norwegian).
- See `.cursor/scratchpad.md` for the full planning history and rationale.
