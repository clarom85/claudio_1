/**
 * Tool configurations — 1 tool per nicchia
 * Ogni config è auto-sufficiente: contiene inputs, logica, outputs.
 * Il tool-generator converte questo in una pagina HTML standalone.
 */

export const TOOL_CONFIGS = {

  /* ─────────────────────────────────────────────────────────
     NICCHIA 1: Home Improvement Costs
     Tool: Project Cost Estimator (Enhanced — conditional inputs per project)
  ───────────────────────────────────────────────────────── */
  'home-improvement-costs': {
    slug: 'renovation-cost-calculator',
    title: 'Home Renovation Cost Calculator',
    headline: 'How Much Will Your Project Cost?',
    description: 'Get an instant, contractor-verified cost estimate for your home improvement project. Select your project type and see project-specific options — results include a low/mid/high range broken down by labor, materials, and permits.',
    seoDescription: 'Free home renovation cost calculator. Get a detailed estimate for bathroom remodel, kitchen, roofing, flooring, HVAC, deck, windows, and painting projects with material-specific cost breakdowns.',
    type: 'calculator',
    ctaText: 'Calculate My Cost',
    inputs: [
      // ── Always-visible base inputs ──────────────────────────
      {
        id: 'project',
        label: 'Project Type',
        type: 'select',
        options: [
          { value: 'bathroom', label: 'Bathroom Remodel' },
          { value: 'kitchen',  label: 'Kitchen Remodel' },
          { value: 'roof',     label: 'Roof Replacement' },
          { value: 'flooring', label: 'Flooring Installation' },
          { value: 'hvac',     label: 'HVAC Replacement' },
          { value: 'deck',     label: 'Deck / Patio Build' },
          { value: 'windows',  label: 'Window Replacement' },
          { value: 'painting', label: 'Interior Painting' },
        ]
      },
      {
        id: 'size',
        label: 'Project Size (sq ft)',
        type: 'number',
        placeholder: 'e.g. 150',
        min: 10, max: 10000, default: 150,
        hint: 'Bathroom/Kitchen/Flooring/Deck: sq ft of the space. Roof: home sq ft × 1.3. HVAC: total home sq ft. Windows: number of windows × 15. Painting: total wall sq ft.'
      },

      // ── Bathroom-specific ───────────────────────────────────
      {
        id: 'bathroomScope',
        label: 'Renovation Scope',
        type: 'radio',
        showWhen: { input: 'project', value: 'bathroom' },
        options: [
          { value: 'cosmetic',  label: 'Cosmetic', hint: 'Paint, fixtures, vanity' },
          { value: 'mid',       label: 'Full Remodel', hint: 'Tile, plumbing, layout same' },
          { value: 'gut',       label: 'Full Gut', hint: 'Move walls / plumbing' },
        ],
        default: 'mid'
      },
      {
        id: 'bathroomShower',
        label: 'Shower / Tub Type',
        type: 'radio',
        showWhen: { input: 'project', value: 'bathroom' },
        options: [
          { value: 'tub-combo',   label: 'Tub + Shower Combo' },
          { value: 'walk-in',     label: 'Walk-in Shower' },
          { value: 'curbless',    label: 'Curbless / Custom' },
        ],
        default: 'tub-combo'
      },
      {
        id: 'bathroomVanity',
        label: 'Vanity',
        type: 'radio',
        showWhen: { input: 'project', value: 'bathroom' },
        options: [
          { value: 'single', label: 'Single Sink' },
          { value: 'double', label: 'Double Sink' },
        ],
        default: 'single'
      },

      // ── Kitchen-specific ────────────────────────────────────
      {
        id: 'kitchenCabinets',
        label: 'Cabinet Style',
        type: 'radio',
        showWhen: { input: 'project', value: 'kitchen' },
        options: [
          { value: 'stock',       label: 'Stock / RTA',     hint: 'Ready-to-assemble' },
          { value: 'semi-custom', label: 'Semi-Custom',     hint: 'Most popular' },
          { value: 'custom',      label: 'Custom',          hint: 'Built to spec' },
        ],
        default: 'semi-custom'
      },
      {
        id: 'kitchenIsland',
        label: 'Kitchen Island',
        type: 'radio',
        showWhen: { input: 'project', value: 'kitchen' },
        options: [
          { value: 'no',  label: 'No Island' },
          { value: 'yes', label: 'Add Island' },
        ],
        default: 'no'
      },
      {
        id: 'kitchenAppliances',
        label: 'New Appliances Included?',
        type: 'radio',
        showWhen: { input: 'project', value: 'kitchen' },
        options: [
          { value: 'no',  label: 'No (keep existing)' },
          { value: 'yes', label: 'Yes (full package)' },
        ],
        default: 'no'
      },

      // ── Roof-specific ───────────────────────────────────────
      {
        id: 'roofMaterial',
        label: 'Roofing Material',
        type: 'select',
        showWhen: { input: 'project', value: 'roof' },
        options: [
          { value: 'asphalt-3tab',          label: 'Asphalt 3-Tab Shingles' },
          { value: 'asphalt-architectural', label: 'Architectural Shingles' },
          { value: 'metal-steel',           label: 'Metal — Steel Panels' },
          { value: 'metal-standing-seam',   label: 'Metal — Standing Seam' },
          { value: 'tile-concrete',         label: 'Concrete Tile' },
          { value: 'tile-clay',             label: 'Clay Tile' },
          { value: 'flat-epdm',             label: 'Flat / EPDM Rubber' },
        ]
      },
      {
        id: 'roofStories',
        label: 'Home Height',
        type: 'radio',
        showWhen: { input: 'project', value: 'roof' },
        options: [
          { value: '1', label: '1 Story' },
          { value: '2', label: '2 Stories' },
          { value: '3', label: '3+ Stories' },
        ],
        default: '1'
      },
      {
        id: 'roofTearoff',
        label: 'Remove Existing Roof?',
        type: 'radio',
        showWhen: { input: 'project', value: 'roof' },
        options: [
          { value: 'yes', label: 'Yes — full tear-off' },
          { value: 'no',  label: 'No — overlay install' },
        ],
        default: 'yes'
      },

      // ── Flooring-specific ───────────────────────────────────
      {
        id: 'flooringMaterial',
        label: 'Flooring Material',
        type: 'select',
        showWhen: { input: 'project', value: 'flooring' },
        options: [
          { value: 'solid-hardwood',      label: 'Solid Hardwood' },
          { value: 'engineered-hardwood', label: 'Engineered Hardwood' },
          { value: 'ceramic-tile',        label: 'Ceramic / Porcelain Tile' },
          { value: 'luxury-vinyl',        label: 'Luxury Vinyl Plank (LVP)' },
          { value: 'laminate',            label: 'Laminate' },
          { value: 'carpet',              label: 'Carpet' },
        ]
      },
      {
        id: 'flooringRemoval',
        label: 'Remove Existing Flooring?',
        type: 'radio',
        showWhen: { input: 'project', value: 'flooring' },
        options: [
          { value: 'no',  label: 'No — new space' },
          { value: 'yes', label: 'Yes — remove old floor' },
        ],
        default: 'no'
      },

      // ── HVAC-specific ───────────────────────────────────────
      {
        id: 'hvacSystem',
        label: 'System Type',
        type: 'select',
        showWhen: { input: 'project', value: 'hvac' },
        options: [
          { value: 'central-ac',       label: 'Central AC Only' },
          { value: 'heating-cooling',  label: 'Full Heating + Cooling System' },
          { value: 'mini-split',       label: 'Ductless Mini-Split' },
          { value: 'heat-pump',        label: 'Heat Pump (all-in-one)' },
        ]
      },
      {
        id: 'hvacDuctwork',
        label: 'Ductwork Condition',
        type: 'radio',
        showWhen: { input: 'project', value: 'hvac' },
        options: [
          { value: 'ok',      label: 'Existing ducts OK' },
          { value: 'partial', label: 'Needs partial repair' },
          { value: 'full',    label: 'Needs full replacement' },
        ],
        default: 'ok'
      },

      // ── Deck-specific ───────────────────────────────────────
      {
        id: 'deckMaterial',
        label: 'Decking Material',
        type: 'radio',
        showWhen: { input: 'project', value: 'deck' },
        options: [
          { value: 'pressure-treated', label: 'Pressure-Treated Wood', hint: 'Most affordable' },
          { value: 'composite',        label: 'Composite',             hint: 'Low maintenance' },
          { value: 'pvc',              label: 'PVC / Synthetic',       hint: 'Premium durability' },
        ],
        default: 'composite'
      },
      {
        id: 'deckCovered',
        label: 'Overhead Cover',
        type: 'radio',
        showWhen: { input: 'project', value: 'deck' },
        options: [
          { value: 'none',    label: 'None — open deck' },
          { value: 'pergola', label: 'Pergola / Shade structure' },
          { value: 'roof',    label: 'Full roof / covered porch' },
        ],
        default: 'none'
      },

      // ── Windows-specific ────────────────────────────────────
      {
        id: 'windowFrame',
        label: 'Frame Material',
        type: 'select',
        showWhen: { input: 'project', value: 'windows' },
        options: [
          { value: 'vinyl',      label: 'Vinyl (most popular)' },
          { value: 'fiberglass', label: 'Fiberglass' },
          { value: 'wood',       label: 'Wood' },
          { value: 'aluminum',   label: 'Aluminum' },
        ]
      },
      {
        id: 'windowGlazing',
        label: 'Glazing Type',
        type: 'radio',
        showWhen: { input: 'project', value: 'windows' },
        options: [
          { value: 'double', label: 'Double-Pane', hint: 'Standard' },
          { value: 'triple', label: 'Triple-Pane', hint: 'Best efficiency' },
        ],
        default: 'double'
      },

      // ── Painting-specific ───────────────────────────────────
      {
        id: 'paintingScope',
        label: 'Paint Coverage',
        type: 'radio',
        showWhen: { input: 'project', value: 'painting' },
        options: [
          { value: 'walls-only',    label: 'Walls Only' },
          { value: 'walls-ceiling', label: 'Walls + Ceilings' },
          { value: 'full',          label: 'Walls, Ceilings + Trim' },
        ],
        default: 'walls-only'
      },
      {
        id: 'paintingCoats',
        label: 'Coats of Paint',
        type: 'radio',
        showWhen: { input: 'project', value: 'painting' },
        options: [
          { value: '1', label: '1 Coat', hint: 'Touch-up / same color' },
          { value: '2', label: '2 Coats', hint: 'Standard repaint' },
        ],
        default: '2'
      },

      // ── Always-visible quality + region ────────────────────
      {
        id: 'quality',
        label: 'Material Quality',
        type: 'radio',
        options: [
          { value: 'basic',   label: 'Basic',     hint: 'Builder-grade' },
          { value: 'mid',     label: 'Mid-Range', hint: 'Most popular' },
          { value: 'premium', label: 'Premium',   hint: 'High-end finishes' },
        ],
        default: 'mid'
      },
      {
        id: 'region',
        label: 'Your Region',
        type: 'select',
        options: [
          { value: 'northeast', label: 'Northeast (NY, MA, CT, NJ...)' },
          { value: 'south',     label: 'South (TX, FL, GA, NC...)' },
          { value: 'midwest',   label: 'Midwest (IL, OH, MI, MN...)' },
          { value: 'west',      label: 'West (CA, WA, CO, AZ...)' },
        ]
      },
    ],

    formula: `
      // ── Base $/sqft by project type ───────────────────────────────────────
      const BASE = {
        bathroom: { labor: 48,  materials: 38,  permits: 5.5 },
        kitchen:  { labor: 58,  materials: 70,  permits: 9   },
        roof:     { labor: 4.2, materials: 5.5, permits: 0.5 },
        flooring: { labor: 4.0, materials: 6.5, permits: 0   },
        hvac:     { labor: 1.4, materials: 3.0, permits: 0.2 },
        deck:     { labor: 19,  materials: 22,  permits: 3.5 },
        windows:  { labor: 13,  materials: 20,  permits: 1.0 },
        painting: { labor: 2.2, materials: 1.1, permits: 0   },
      };

      // ── Quality + Region base multipliers ────────────────────────────────
      const QUALITY = { basic: 0.72, mid: 1.0, premium: 1.65 };
      const REGION  = { northeast: 1.22, south: 0.87, midwest: 0.94, west: 1.27 };

      // ── Project-specific multipliers ─────────────────────────────────────
      // Bathroom
      const BATH_SCOPE   = { cosmetic: 0.58, mid: 1.0, gut: 1.42 };
      const BATH_SHOWER  = { 'tub-combo': 1.0, 'walk-in': 1.18, curbless: 1.42 };
      const BATH_VANITY  = { single: 1.0, double: 1.13 };

      // Kitchen
      const KIT_CABINETS = { stock: 0.58, 'semi-custom': 1.0, custom: 1.72 };
      const KIT_ISLAND   = { no: 1.0, yes: 1.16 };
      const KIT_APPL     = { no: 1.0, yes: 1.28 };

      // Roof
      const ROOF_MAT     = {
        'asphalt-3tab': 0.82, 'asphalt-architectural': 1.0,
        'metal-steel': 1.65, 'metal-standing-seam': 2.05,
        'tile-concrete': 1.75, 'tile-clay': 1.95, 'flat-epdm': 0.88
      };
      const ROOF_STORIES = { '1': 1.0, '2': 1.10, '3': 1.22 };
      const ROOF_TEAROFF = { yes: 1.16, no: 0.88 };

      // Flooring
      const FLOOR_MAT    = {
        'solid-hardwood': 1.55, 'engineered-hardwood': 1.22,
        'ceramic-tile': 1.12, 'luxury-vinyl': 0.78,
        'laminate': 0.72, 'carpet': 0.68
      };
      const FLOOR_REMOVE = { no: 1.0, yes: 1.22 };

      // HVAC
      const HVAC_SYS     = {
        'central-ac': 0.68, 'heating-cooling': 1.0,
        'mini-split': 1.12, 'heat-pump': 1.08
      };
      const HVAC_DUCT    = { ok: 1.0, partial: 1.28, full: 1.58 };

      // Deck
      const DECK_MAT     = { 'pressure-treated': 0.72, composite: 1.0, pvc: 1.22 };
      const DECK_COVER   = { none: 1.0, pergola: 1.28, roof: 1.48 };

      // Windows
      const WIN_FRAME    = { vinyl: 1.0, fiberglass: 1.38, wood: 1.48, aluminum: 1.18 };
      const WIN_GLAZE    = { double: 1.0, triple: 1.25 };

      // Painting
      const PAINT_SCOPE  = { 'walls-only': 1.0, 'walls-ceiling': 1.22, full: 1.38 };
      const PAINT_COATS  = { '1': 0.88, '2': 1.0 };

      // ── Compute project-specific multiplier ──────────────────────────────
      const p = inputs.project || 'bathroom';
      let pm = 1.0; // project multiplier
      if (p === 'bathroom') {
        pm = (BATH_SCOPE[inputs.bathroomScope]  || 1) *
             (BATH_SHOWER[inputs.bathroomShower] || 1) *
             (BATH_VANITY[inputs.bathroomVanity] || 1);
      } else if (p === 'kitchen') {
        pm = (KIT_CABINETS[inputs.kitchenCabinets]   || 1) *
             (KIT_ISLAND[inputs.kitchenIsland]        || 1) *
             (KIT_APPL[inputs.kitchenAppliances]      || 1);
      } else if (p === 'roof') {
        pm = (ROOF_MAT[inputs.roofMaterial]   || 1) *
             (ROOF_STORIES[inputs.roofStories] || 1) *
             (ROOF_TEAROFF[inputs.roofTearoff] || 1);
      } else if (p === 'flooring') {
        pm = (FLOOR_MAT[inputs.flooringMaterial]    || 1) *
             (FLOOR_REMOVE[inputs.flooringRemoval]   || 1);
      } else if (p === 'hvac') {
        pm = (HVAC_SYS[inputs.hvacSystem]      || 1) *
             (HVAC_DUCT[inputs.hvacDuctwork]    || 1);
      } else if (p === 'deck') {
        pm = (DECK_MAT[inputs.deckMaterial]    || 1) *
             (DECK_COVER[inputs.deckCovered]    || 1);
      } else if (p === 'windows') {
        pm = (WIN_FRAME[inputs.windowFrame]    || 1) *
             (WIN_GLAZE[inputs.windowGlazing]   || 1);
      } else if (p === 'painting') {
        pm = (PAINT_SCOPE[inputs.paintingScope] || 1) *
             (PAINT_COATS[inputs.paintingCoats] || 1);
      }

      // ── Core calculation ─────────────────────────────────────────────────
      const b   = BASE[p];
      const qm  = QUALITY[inputs.quality] || 1.0;
      const rm  = REGION[inputs.region]   || 1.0;
      const sz  = Math.max(10, parseFloat(inputs.size) || 150);
      const VAR = 0.22; // ±22% range

      const laborAvg     = b.labor    * qm * rm * pm * sz;
      const materialsAvg = b.materials * qm * rm * pm * sz;
      const permitsAvg   = b.permits  * rm * sz;
      const totalAvg     = laborAvg + materialsAvg + permitsAvg;
      const totalLow     = Math.round(totalAvg * (1 - VAR) / 100) * 100;
      const totalHigh    = Math.round(totalAvg * (1 + VAR) / 100) * 100;
      const totalMid     = Math.round(totalAvg / 100) * 100;

      // ── Expert insight per project/material ─────────────────────────────
      const INSIGHTS = {
        roof: {
          'metal-steel':         'Metal roofs last 40–70 years vs. 20–30 for asphalt. The upfront premium typically pays off within 15 years in energy savings and avoided replacement costs.',
          'metal-standing-seam': 'Standing seam metal is the gold standard for longevity (50–70 years) and comes with strong wind/weather warranties. Best ROI for long-term ownership.',
          'asphalt-3tab':        '3-tab shingles are the lowest-cost option but only last 15–20 years. Architectural shingles cost 20–30% more and last twice as long — usually the better value.',
          'tile-clay':           'Clay tile lasts 50–100 years and adds significant resale value in warm-climate markets (FL, CA, AZ). Very heavy — verify your roof framing can support the load.',
          'flat-epdm':           'EPDM rubber membranes last 20–30 years and are ideal for flat or low-slope roofs. Seam quality during installation is the #1 factor in long-term performance.',
          default:               'Get at least 3 contractor bids — roofing prices vary 30–40% between contractors for identical work. Verify licensing and check for manufacturer-certified installers.'
        },
        kitchen: {
          custom:      'Custom cabinets account for 35–45% of the total kitchen budget. Consider semi-custom for 80% of the customization at roughly 50% of the cost.',
          stock:       'Stock cabinets can look premium with quality hardware and a professional paint finish. Budget $800–$2,000 for hardware upgrades — high ROI.',
          default:     'Keeping the existing plumbing/electrical layout (no wall moves) saves $3,000–$10,000 vs. a full gut. The kitchen layout change is rarely worth the added cost.'
        },
        flooring: {
          'solid-hardwood':      'Solid hardwood can be sanded and refinished 4–6 times over its lifetime. Refinishing ($3–$5/sqft) vs. full replacement ($10–$20/sqft) makes it cost-effective long-term.',
          'luxury-vinyl':        'LVP is 100% waterproof, DIY-friendly, and costs 60–70% less than hardwood while closely mimicking the look. Top choice for kitchens, bathrooms, and basements.',
          'ceramic-tile':        'Tile lasts 50–100 years and is the most durable choice for high-moisture areas. Budget for a quality tile setter — poor installation is the #1 cause of premature failure.',
          default:               'Order 10% extra material beyond your measured sq ft to account for cuts, waste, and future repairs. Matching dye lots later can be difficult.'
        },
        bathroom: {
          gut:      'A full gut remodel typically recovers 60–70% of its cost at resale — one of the best ROI renovations. The key is avoiding over-improving for the neighborhood price ceiling.',
          cosmetic: 'A cosmetic refresh (paint, vanity, fixtures, mirror) can transform a bathroom for $2,000–$6,000 and recovers 80–90% at resale. Best value-for-money option.',
          default:  'Moving plumbing add $500–$3,000 per fixture relocation. Keeping pipes in place dramatically reduces cost and risk of hidden issues.'
        },
        hvac: {
          'mini-split':    'Ductless mini-splits are 25–40% more energy-efficient than central systems and avoid costly ductwork. Federal tax credits (up to $2,000) may apply under the Inflation Reduction Act.',
          'heat-pump':     'Heat pumps provide both heating and cooling in one unit. Modern cold-climate models work efficiently down to -15°F. IRA tax credits cover 30% of cost up to $2,000.',
          full:            'Full ductwork replacement adds $3,000–$7,000 but ensures optimal airflow and efficiency. Consider spray foam sealing ducts to reduce energy loss by 20–30%.',
          default:         'Replace your HVAC before complete failure — emergency replacement costs 15–25% more and limits your contractor choices. A system 12+ years old is a candidate for proactive replacement.'
        },
        deck: {
          composite:        'Composite decking costs 30–50% more upfront but requires virtually zero maintenance vs. pressure-treated wood needing annual staining ($300–$600/year). Break-even is typically 7–10 years.',
          'pressure-treated':'PT wood is the most affordable option. Budget $200–$500/year for cleaning, sealing, and staining to maximize its 15–25 year lifespan.',
          default:          'A well-built deck recovers 60–80% of its cost at resale and adds year-round livable space. Composite materials have the highest resale ROI in most markets.'
        },
        windows: {
          default: 'Energy Star–certified windows can save $100–$350/year on energy bills. Under the Inflation Reduction Act, the federal tax credit covers 30% of window costs (up to $600/year).'
        },
        painting: {
          default: 'DIY interior painting costs $200–$600 in materials vs. $1,500–$4,000 professionally. Worth hiring out for ceilings, stairwells, and trim — the prep and cutting-in work is where pros earn their keep.'
        },
      };

      const projectInsights = INSIGHTS[p] || {};
      const materialKey = inputs.roofMaterial || inputs.flooringMaterial || inputs.hvacSystem || inputs.deckMaterial || inputs.windowFrame || inputs.kitchenCabinets || inputs.bathroomScope || inputs.hvacDuctwork || '';
      const insight = projectInsights[materialKey] || projectInsights.default || '';

      return {
        totalLow, totalMid, totalHigh,
        labor:     Math.round(laborAvg),
        materials: Math.round(materialsAvg),
        permits:   Math.round(permitsAvg),
        sqft:      sz,
        insight,
      };
    `,

    outputs: [
      { id: 'range',     label: 'Estimated Cost Range',  type: 'range-hero' },
      { id: 'labor',     label: 'Labor',                 type: 'currency', percent: true },
      { id: 'materials', label: 'Materials',             type: 'currency', percent: true },
      { id: 'permits',   label: 'Permits & Fees',        type: 'currency', percent: true },
      { id: 'insight',   label: 'Expert Insight',        type: 'insight' },
    ],
    disclaimer: 'Estimates are based on national averages, RS Means construction data, and regional labor indexes. Actual costs vary based on site conditions, local permit requirements, contractor availability, and material prices at the time of purchase. Always obtain 3+ quotes from licensed, insured contractors before committing to a project.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 2: Pet Care by Breed
     Tool: Annual Pet Cost Calculator
  ───────────────────────────────────────────────────────── */
  'pet-care-by-breed': {
    slug: 'pet-cost-calculator',
    title: 'Annual Pet Care Cost Calculator',
    headline: 'How Much Does Your Pet Cost Per Year?',
    description: 'Calculate the real annual cost of owning your pet — including food, vet visits, grooming, toys, and insurance. Based on breed size and age.',
    seoDescription: 'Free pet cost calculator. Find out how much it costs to own a dog or cat per year, broken down by breed size, age, and care category.',
    type: 'calculator',
    ctaText: 'Calculate My Pet Costs',
    inputs: [
      {
        id: 'petType',
        label: 'Pet Type',
        type: 'radio',
        options: [
          { value: 'dog', label: 'Dog' },
          { value: 'cat', label: 'Cat' },
        ],
        default: 'dog'
      },
      {
        id: 'size',
        label: 'Breed Size',
        type: 'select',
        options: [
          { value: 'small',  label: 'Small (under 25 lbs)' },
          { value: 'medium', label: 'Medium (25–60 lbs)' },
          { value: 'large',  label: 'Large (60–100 lbs)' },
          { value: 'xl',     label: 'Extra Large (100+ lbs)' },
        ],
        showWhen: { input: 'petType', value: 'dog' }
      },
      {
        id: 'ageGroup',
        label: 'Age',
        type: 'radio',
        options: [
          { value: 'puppy',  label: 'Puppy / Kitten (under 1 yr)' },
          { value: 'adult',  label: 'Adult (1–7 yrs)' },
          { value: 'senior', label: 'Senior (7+ yrs)' },
        ],
        default: 'adult'
      },
      {
        id: 'insurance',
        label: 'Pet Insurance?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no',  label: 'No' },
        ],
        default: 'no'
      },
    ],
    formula: `
      const isCat = inputs.petType === 'cat';
      const sz = isCat ? 'small' : (inputs.size || 'medium');
      const age = inputs.ageGroup || 'adult';

      const FOOD = { small:480, medium:720, large:1080, xl:1440 };
      const VET_BASE = { puppy:600, adult:300, senior:600 };
      const GROOM = isCat
        ? { small:120, medium:120, large:120, xl:120 }
        : { small:240, medium:360, large:480, xl:600 };
      const TOYS_TREATS = { small:200, medium:280, large:320, xl:360 };
      const INSURANCE_COST = { small:300, medium:420, large:540, xl:660 };

      const food      = isCat ? 480 : FOOD[sz];
      const vet       = VET_BASE[age] + (isCat ? 50 : 0);
      const grooming  = GROOM[sz];
      const toysTreats= TOYS_TREATS[sz] || 280;
      const insurance = inputs.insurance === 'yes' ? (INSURANCE_COST[sz] || 420) : 0;
      const misc      = 150; // litter/beds/misc

      const total = food + vet + grooming + toysTreats + insurance + misc;

      return { total, food, vet, grooming, toysTreats, insurance, misc };
    `,
    outputs: [
      { id: 'total',      label: 'Total Annual Cost', type: 'currency-hero' },
      { id: 'food',       label: 'Food & Treats',   type: 'currency', percent: true },
      { id: 'vet',        label: 'Vet & Medical',   type: 'currency', percent: true },
      { id: 'grooming',   label: 'Grooming',         type: 'currency', percent: true },
      { id: 'toysTreats', label: 'Toys & Enrichment',type: 'currency', percent: true },
      { id: 'insurance',  label: 'Pet Insurance',    type: 'currency', percent: true },
      { id: 'misc',       label: 'Supplies & Misc',  type: 'currency', percent: true },
    ],
    disclaimer: 'Estimates are national averages. Costs vary significantly by location, veterinarian, breed-specific health needs, and individual pet behavior.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 3: Software Error Fixes
     Tool: Error Fix Finder (wizard)
  ───────────────────────────────────────────────────────── */
  'software-error-fixes': {
    slug: 'error-fix-finder',
    title: 'Software Error Fix Finder',
    headline: 'Find the Fix for Your Error',
    description: 'Answer 4 quick questions about your error and we\'ll show you the most likely cause and the exact steps to fix it.',
    seoDescription: 'Free software error fix finder. Diagnose Windows, Mac, browser, and app errors in seconds with our step-by-step troubleshooting wizard.',
    type: 'wizard',
    ctaText: 'Find My Fix',
    inputs: [
      {
        id: 'os',
        label: 'Operating System',
        type: 'select',
        options: [
          { value: 'windows11', label: 'Windows 11' },
          { value: 'windows10', label: 'Windows 10' },
          { value: 'mac',       label: 'macOS' },
          { value: 'android',   label: 'Android' },
          { value: 'ios',       label: 'iOS / iPadOS' },
        ]
      },
      {
        id: 'software',
        label: 'Where does the error occur?',
        type: 'select',
        options: [
          { value: 'browser',  label: 'Web Browser' },
          { value: 'office',   label: 'Microsoft Office / Word / Excel' },
          { value: 'system',   label: 'System / Windows itself' },
          { value: 'game',     label: 'Game or Gaming Platform' },
          { value: 'app',      label: 'Other App' },
        ]
      },
      {
        id: 'symptom',
        label: 'What is the error doing?',
        type: 'select',
        options: [
          { value: 'crash',    label: 'App crashes or closes suddenly' },
          { value: 'freeze',   label: 'App or PC freezes / hangs' },
          { value: 'notopen',  label: 'App won\'t open at all' },
          { value: 'slow',     label: 'App is extremely slow' },
          { value: 'message',  label: 'Error message on screen' },
          { value: 'network',  label: 'Can\'t connect / network error' },
        ]
      },
      {
        id: 'tried',
        label: 'Have you tried restarting?',
        type: 'radio',
        options: [
          { value: 'no',  label: 'Not yet' },
          { value: 'yes', label: 'Yes, still broken' },
        ],
        default: 'no'
      },
    ],
    // Returns an array of fix steps
    formula: `
      const fixes = {
        crash:   { cause: 'Memory leak or corrupt app data', steps: ['Close all background apps', 'Clear app cache (Settings → Apps → [App] → Clear Cache)', 'Uninstall and reinstall the app', 'Run Windows Memory Diagnostic (search: mdsched)'] },
        freeze:  { cause: 'CPU/RAM overload or driver conflict', steps: ['Check Task Manager for high CPU/RAM usage (Ctrl+Shift+Esc)', 'Update display drivers (Device Manager → Display Adapters)', 'Disable startup programs', 'Run SFC scan: open CMD as admin, type sfc /scannow'] },
        notopen: { cause: 'Missing DLL, permissions, or corrupt install', steps: ['Right-click the app → Run as Administrator', 'Check Windows Event Viewer for specific error', 'Repair the installation (Settings → Apps → Modify)', 'Reinstall with a fresh download from official source'] },
        slow:    { cause: 'Insufficient resources or background processes', steps: ['Check available disk space (need at least 15% free)', 'Disable visual effects (System → Advanced → Performance)', 'Add to antivirus exclusions temporarily to test', 'Consider upgrading RAM if under 8GB'] },
        message: { cause: 'Specific error code — look up exact code for precise fix', steps: ['Screenshot or write down the exact error code', 'Search: [error code] + your OS for specific solutions', 'Check the app\'s official support pages', 'Run the program compatibility troubleshooter'] },
        network: { cause: 'DNS, firewall, or network adapter issue', steps: ['Run: ipconfig /flushdns in Command Prompt', 'Toggle airplane mode on/off', 'Reset network settings (Settings → Network → Reset)', 'Check Windows Firewall isn\'t blocking the app'] },
      };

      const result = fixes[inputs.symptom] || fixes['message'];
      const restartNote = inputs.tried === 'no'
        ? '⚡ First: restart your device — this fixes ~40% of errors instantly.'
        : '';

      return { ...result, restartNote, os: inputs.os, software: inputs.software };
    `,
    outputs: [{ id: 'wizard', type: 'wizard-result' }],
    disclaimer: 'These steps cover the most common causes. For persistent errors, consult official support documentation or a certified technician.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 4: Diet-Specific Recipes
     Tool: Daily Macro Calculator
  ───────────────────────────────────────────────────────── */
  'diet-specific-recipes': {
    slug: 'macro-calculator',
    title: 'Daily Macro & Calorie Calculator',
    headline: 'Find Your Daily Calorie & Macro Targets',
    description: 'Calculate your personalized daily calorie needs and macro targets (protein, carbs, fat) based on your body and goals. Adjusted for your specific diet.',
    seoDescription: 'Free macro calculator. Find your daily calorie, protein, carb, and fat targets for weight loss, muscle gain, or maintenance. Supports keto, paleo, vegan, and more.',
    type: 'calculator',
    ctaText: 'Calculate My Macros',
    inputs: [
      {
        id: 'gender',
        label: 'Biological Sex',
        type: 'radio',
        options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
        default: 'male'
      },
      {
        id: 'age',
        label: 'Age',
        type: 'number',
        placeholder: 'e.g. 35',
        min: 15, max: 90, default: 35
      },
      {
        id: 'weight',
        label: 'Weight (lbs)',
        type: 'number',
        placeholder: 'e.g. 170',
        min: 80, max: 500, default: 170
      },
      {
        id: 'height',
        label: 'Height (inches)',
        type: 'number',
        placeholder: 'e.g. 67',
        min: 48, max: 96, default: 67
      },
      {
        id: 'activity',
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: '1.2',  label: 'Sedentary (desk job, little exercise)' },
          { value: '1.375',label: 'Lightly active (1–3 workouts/week)' },
          { value: '1.55', label: 'Moderately active (3–5 workouts/week)' },
          { value: '1.725',label: 'Very active (hard training 6–7 days)' },
        ]
      },
      {
        id: 'goal',
        label: 'Goal',
        type: 'radio',
        options: [
          { value: 'lose',    label: 'Lose Weight' },
          { value: 'maintain',label: 'Maintain Weight' },
          { value: 'gain',    label: 'Build Muscle' },
        ],
        default: 'maintain'
      },
      {
        id: 'diet',
        label: 'Diet Type',
        type: 'select',
        options: [
          { value: 'balanced', label: 'Balanced / Standard' },
          { value: 'keto',     label: 'Ketogenic (low-carb)' },
          { value: 'paleo',    label: 'Paleo' },
          { value: 'vegan',    label: 'Vegan / Plant-based' },
          { value: 'highprot', label: 'High Protein' },
        ]
      },
    ],
    formula: `
      const w = parseFloat(inputs.weight) * 0.453592; // kg
      const h = parseFloat(inputs.height) * 2.54;     // cm
      const a = parseFloat(inputs.age);
      const act = parseFloat(inputs.activity);

      // Mifflin-St Jeor BMR
      const bmr = inputs.gender === 'male'
        ? 10*w + 6.25*h - 5*a + 5
        : 10*w + 6.25*h - 5*a - 161;

      const tdee = Math.round(bmr * act);

      const GOAL_ADJ = { lose: -500, maintain: 0, gain: 300 };
      const calories = tdee + GOAL_ADJ[inputs.goal];

      // Macro splits by diet
      const SPLITS = {
        balanced: { p:0.30, f:0.30, c:0.40 },
        keto:     { p:0.25, f:0.70, c:0.05 },
        paleo:    { p:0.30, f:0.40, c:0.30 },
        vegan:    { p:0.20, f:0.25, c:0.55 },
        highprot: { p:0.40, f:0.25, c:0.35 },
      };
      const split = SPLITS[inputs.diet] || SPLITS.balanced;

      const protein = Math.round((calories * split.p) / 4);
      const fat     = Math.round((calories * split.f) / 9);
      const carbs   = Math.round((calories * split.c) / 4);

      return { calories, protein, fat, carbs, tdee, bmr: Math.round(bmr) };
    `,
    outputs: [
      { id: 'calories', label: 'Daily Calories', type: 'number-hero', unit: 'kcal' },
      { id: 'protein',  label: 'Protein',  type: 'number', unit: 'g/day' },
      { id: 'carbs',    label: 'Carbs',    type: 'number', unit: 'g/day' },
      { id: 'fat',      label: 'Fat',      type: 'number', unit: 'g/day' },
      { id: 'tdee',     label: 'Maintenance Calories', type: 'number', unit: 'kcal' },
    ],
    disclaimer: 'These are estimates based on established formulas (Mifflin-St Jeor). Individual needs vary. Consult a registered dietitian before making significant dietary changes.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 5: Small Town Tourism
     Tool: Weekend Trip Budget Planner
  ───────────────────────────────────────────────────────── */
  'small-town-tourism': {
    slug: 'trip-budget-calculator',
    title: 'Weekend Trip Budget Calculator',
    headline: 'Plan Your Perfect Weekend Trip Budget',
    description: 'Calculate a realistic budget for your small-town weekend getaway. Covers accommodation, food, activities, and travel — customized to your travel style.',
    seoDescription: 'Free weekend trip budget calculator. Plan your small-town getaway costs including hotels, food, activities, and gas. Instant estimate by travel style.',
    type: 'calculator',
    ctaText: 'Plan My Budget',
    inputs: [
      {
        id: 'travelers',
        label: 'Number of Travelers',
        type: 'radio',
        options: [
          { value: '1', label: 'Solo' },
          { value: '2', label: 'Couple' },
          { value: '4', label: 'Family (4)' },
          { value: '6', label: 'Group (6+)' },
        ],
        default: '2'
      },
      {
        id: 'nights',
        label: 'Number of Nights',
        type: 'radio',
        options: [
          { value: '1', label: '1 night' },
          { value: '2', label: '2 nights' },
          { value: '3', label: '3 nights' },
        ],
        default: '2'
      },
      {
        id: 'accommodation',
        label: 'Accommodation Style',
        type: 'select',
        options: [
          { value: 'camping',  label: 'Camping / Glamping' },
          { value: 'bnb',      label: 'B&B or Inn' },
          { value: 'hotel',    label: 'Mid-range Hotel' },
          { value: 'airbnb',   label: 'Vacation Rental (Airbnb)' },
          { value: 'boutique', label: 'Boutique / Upscale Hotel' },
        ]
      },
      {
        id: 'foodStyle',
        label: 'Dining Style',
        type: 'radio',
        options: [
          { value: 'budget',   label: 'Budget (diner, self-catering)' },
          { value: 'mid',      label: 'Mid-range (local restaurants)' },
          { value: 'upscale',  label: 'Upscale (farm-to-table, fine dining)' },
        ],
        default: 'mid'
      },
      {
        id: 'activities',
        label: 'Activity Budget',
        type: 'select',
        options: [
          { value: 'free',   label: 'Mostly free (hiking, exploring)' },
          { value: 'some',   label: 'Some paid activities' },
          { value: 'full',   label: 'Full itinerary (tours, tastings, events)' },
        ]
      },
    ],
    formula: `
      const n = parseInt(inputs.travelers) || 2;
      const nights = parseInt(inputs.nights) || 2;

      const ACCOMM_PER_NIGHT = { camping:60, bnb:140, hotel:160, airbnb:180, boutique:260 };
      const FOOD_PER_PERSON_DAY = { budget:35, mid:70, upscale:130 };
      const ACTIVITIES_PER_PERSON = { free:20, some:80, full:180 };
      const GAS_FLAT = 60;

      const accommodation = ACCOMM_PER_NIGHT[inputs.accommodation] * nights;
      const food = FOOD_PER_PERSON_DAY[inputs.foodStyle] * n * (nights + 1);
      const activities = ACTIVITIES_PER_PERSON[inputs.activities] * n;
      const transport = GAS_FLAT + (n > 2 ? 40 : 0);
      const misc = Math.round(n * 25); // souvenirs, tips, etc.

      const total = accommodation + food + activities + transport + misc;
      const perPerson = Math.round(total / n);

      return { total, perPerson, accommodation, food, activities, transport, misc };
    `,
    outputs: [
      { id: 'total',         label: 'Total Trip Budget',  type: 'currency-hero' },
      { id: 'perPerson',     label: 'Per Person',         type: 'currency' },
      { id: 'accommodation', label: 'Accommodation',      type: 'currency', percent: true },
      { id: 'food',          label: 'Food & Dining',      type: 'currency', percent: true },
      { id: 'activities',    label: 'Activities',         type: 'currency', percent: true },
      { id: 'transport',     label: 'Gas & Transport',    type: 'currency', percent: true },
      { id: 'misc',          label: 'Souvenirs & Tips',   type: 'currency', percent: true },
    ],
    disclaimer: 'Estimates based on US national averages. Costs vary significantly by destination, season, and personal spending habits.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 6: Personal Finance
     Tool: Savings Rate & Emergency Fund Calculator
  ───────────────────────────────────────────────────────── */
  'personal-finance': {
    slug: 'savings-rate-calculator',
    title: 'Savings Rate & Emergency Fund Calculator',
    headline: 'Are You Saving Enough?',
    description: 'Calculate your savings rate, see how you compare to national averages, and find out exactly how many months of emergency fund you have.',
    seoDescription: 'Free savings rate calculator. Find out if you\'re saving enough, how your savings rate compares to the national average, and how to reach your goals faster.',
    type: 'calculator',
    ctaText: 'Calculate My Savings Rate',
    inputs: [
      {
        id: 'income',
        label: 'Monthly Take-Home Income ($)',
        type: 'number',
        placeholder: 'e.g. 5000',
        min: 500, max: 50000, default: 5000,
      },
      {
        id: 'savings',
        label: 'Monthly Savings (401k + savings account + investments)',
        type: 'number',
        placeholder: 'e.g. 750',
        min: 0, max: 20000, default: 750,
      },
      {
        id: 'expenses',
        label: 'Monthly Essential Expenses ($)',
        type: 'number',
        placeholder: 'e.g. 3500',
        min: 0, max: 20000, default: 3500,
        hint: 'Rent/mortgage, utilities, food, transport — not discretionary spending.',
      },
      {
        id: 'emergencyFund',
        label: 'Current Emergency Fund ($)',
        type: 'number',
        placeholder: 'e.g. 8000',
        min: 0, max: 500000, default: 8000,
      },
    ],
    formula: `
      const income   = parseFloat(inputs.income)   || 5000;
      const savings  = parseFloat(inputs.savings)  || 0;
      const expenses = parseFloat(inputs.expenses) || 3500;
      const ef       = parseFloat(inputs.emergencyFund) || 0;

      const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
      const efMonths    = expenses > 0 ? (ef / expenses).toFixed(1) : 0;
      const efTarget    = expenses * 6;
      const efGap       = Math.max(0, efTarget - ef);
      const monthsToFundEF = savings > 0 && efGap > 0 ? Math.ceil(efGap / savings) : 0;

      const usAvgRate = 5;

      let insight = '';
      if (savingsRate >= 20) insight = 'Your savings rate is excellent — you\'re on track for financial independence ahead of schedule.';
      else if (savingsRate >= 10) insight = 'Good progress. Bumping savings by even 3-5% could cut years off your timeline.';
      else if (savingsRate > 0) insight = 'You\'re saving, but below the 10-15% threshold financial planners recommend. Look for one recurring expense to cut.';
      else insight = 'Start with automating even $50/month — savers who automate deposit 2.5× more than those who transfer manually.';

      return {
        savingsRate,
        efMonths: parseFloat(efMonths),
        efGap,
        monthsToFundEF,
        monthlySavings: Math.round(savings),
        comparison: { yours: savingsRate + '%', average: usAvgRate + '%' },
        insight,
      };
    `,
    outputs: [
      { id: 'savingsRate',    label: 'Your Savings Rate',        type: 'number-hero', unit: '% of income' },
      { id: 'efMonths',       label: 'Emergency Fund Coverage',  type: 'number',      unit: 'months' },
      { id: 'efGap',          label: 'Gap to 6-Month Fund',      type: 'currency' },
      { id: 'monthsToFundEF', label: 'Months to Full E-Fund',    type: 'number',      unit: 'months' },
      { id: 'comparison',     label: 'Savings Rate vs US Avg',   type: 'comparison' },
      { id: 'insight',        label: 'Expert Insight',           type: 'insight' },
    ],
    disclaimer: 'Based on your inputs and national averages. Consult a certified financial planner for personalized advice.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 7: Insurance Guide
     Tool: Life Insurance Needs Calculator
  ───────────────────────────────────────────────────────── */
  'insurance-guide': {
    slug: 'insurance-calculator',
    title: 'Insurance Premium Calculator',
    headline: 'How Much Should You Pay for Insurance in Your State?',
    description: 'Get a data-driven estimate of your auto, home, health, or life insurance premium — adjusted for your state, coverage profile, and risk factors. Compare to national and state averages.',
    seoDescription: 'Free insurance premium calculator by state. Estimate auto, home, health, and life insurance costs based on your profile, location, and coverage needs. Updated with 2025 rate data.',
    type: 'calculator',
    ctaText: 'Calculate My Premium',
    inputs: [
      {
        id: 'insuranceType',
        label: 'Type of Insurance',
        type: 'select',
        options: [
          { value: 'auto',   label: 'Auto Insurance' },
          { value: 'home',   label: 'Homeowners Insurance' },
          { value: 'health', label: 'Health Insurance (ACA)' },
          { value: 'life',   label: 'Term Life Insurance' },
        ],
        default: 'auto',
      },
      {
        id: 'state',
        label: 'Your State',
        type: 'select',
        options: [
          {value:'AL',label:'Alabama'},{value:'AK',label:'Alaska'},{value:'AZ',label:'Arizona'},
          {value:'AR',label:'Arkansas'},{value:'CA',label:'California'},{value:'CO',label:'Colorado'},
          {value:'CT',label:'Connecticut'},{value:'DE',label:'Delaware'},{value:'FL',label:'Florida'},
          {value:'GA',label:'Georgia'},{value:'HI',label:'Hawaii'},{value:'ID',label:'Idaho'},
          {value:'IL',label:'Illinois'},{value:'IN',label:'Indiana'},{value:'IA',label:'Iowa'},
          {value:'KS',label:'Kansas'},{value:'KY',label:'Kentucky'},{value:'LA',label:'Louisiana'},
          {value:'ME',label:'Maine'},{value:'MD',label:'Maryland'},{value:'MA',label:'Massachusetts'},
          {value:'MI',label:'Michigan'},{value:'MN',label:'Minnesota'},{value:'MS',label:'Mississippi'},
          {value:'MO',label:'Missouri'},{value:'MT',label:'Montana'},{value:'NE',label:'Nebraska'},
          {value:'NV',label:'Nevada'},{value:'NH',label:'New Hampshire'},{value:'NJ',label:'New Jersey'},
          {value:'NM',label:'New Mexico'},{value:'NY',label:'New York'},{value:'NC',label:'North Carolina'},
          {value:'ND',label:'North Dakota'},{value:'OH',label:'Ohio'},{value:'OK',label:'Oklahoma'},
          {value:'OR',label:'Oregon'},{value:'PA',label:'Pennsylvania'},{value:'RI',label:'Rhode Island'},
          {value:'SC',label:'South Carolina'},{value:'SD',label:'South Dakota'},{value:'TN',label:'Tennessee'},
          {value:'TX',label:'Texas'},{value:'UT',label:'Utah'},{value:'VT',label:'Vermont'},
          {value:'VA',label:'Virginia'},{value:'WA',label:'Washington'},{value:'WV',label:'West Virginia'},
          {value:'WI',label:'Wisconsin'},{value:'WY',label:'Wyoming'},{value:'DC',label:'Washington D.C.'},
        ],
        default: 'TX',
        hint: 'State is a major pricing factor — rates can vary by 200%+ across states.',
      },
      // ── AUTO ──────────────────────────────────────────────────────────────
      {
        id: 'driverAge',
        label: 'Primary Driver Age',
        type: 'select',
        options: [
          { value: '18', label: '16–24 (young driver)' },
          { value: '30', label: '25–34' },
          { value: '40', label: '35–54' },
          { value: '58', label: '55–64' },
          { value: '68', label: '65+' },
        ],
        default: '40',
        showWhen: { input: 'insuranceType', value: 'auto' },
      },
      {
        id: 'drivingRecord',
        label: 'Driving Record (past 3 years)',
        type: 'select',
        options: [
          { value: 'clean',    label: 'Clean — no violations or claims' },
          { value: 'minor',    label: 'Minor violation (speeding, etc.)' },
          { value: 'accident', label: 'At-fault accident' },
          { value: 'dui',      label: 'DUI / Major violation' },
        ],
        default: 'clean',
        showWhen: { input: 'insuranceType', value: 'auto' },
      },
      {
        id: 'vehicleType',
        label: 'Vehicle Type',
        type: 'select',
        options: [
          { value: 'economy',  label: 'Economy / Compact (Honda Civic, Toyota Corolla)' },
          { value: 'midsize',  label: 'Mid-size Sedan (Camry, Accord)' },
          { value: 'suv',      label: 'SUV / Crossover (RAV4, CR-V)' },
          { value: 'truck',    label: 'Pickup Truck (F-150, Silverado)' },
          { value: 'luxury',   label: 'Luxury / Sports (BMW, Mercedes, Corvette)' },
          { value: 'ev',       label: 'Electric Vehicle (Tesla, EV models)' },
        ],
        default: 'suv',
        showWhen: { input: 'insuranceType', value: 'auto' },
      },
      {
        id: 'vehicleAge',
        label: 'Vehicle Age',
        type: 'select',
        options: [
          { value: 'new',  label: '0–3 years (new)' },
          { value: 'mid',  label: '4–8 years' },
          { value: 'old',  label: '9–15 years' },
          { value: 'aged', label: '15+ years' },
        ],
        default: 'mid',
        showWhen: { input: 'insuranceType', value: 'auto' },
      },
      {
        id: 'autoCoverage',
        label: 'Coverage Level',
        type: 'select',
        options: [
          { value: 'min',   label: 'State minimum (liability only)' },
          { value: 'basic', label: 'Liability + collision' },
          { value: 'full',  label: 'Full coverage (liability + collision + comprehensive)' },
        ],
        default: 'full',
        hint: 'Full coverage required by most lenders on financed vehicles.',
        showWhen: { input: 'insuranceType', value: 'auto' },
      },
      {
        id: 'creditTier',
        label: 'Credit Score Tier',
        type: 'select',
        options: [
          { value: 'excellent', label: 'Excellent (750+)' },
          { value: 'good',      label: 'Good (670–749)' },
          { value: 'fair',      label: 'Fair (580–669)' },
          { value: 'poor',      label: 'Poor (below 580)' },
        ],
        default: 'good',
        hint: 'Used in most states. CA, HI, MA, MI prohibit credit-based pricing.',
        showWhen: { input: 'insuranceType', value: 'auto' },
      },
      // ── HOME ─────────────────────────────────────────────────────────────
      {
        id: 'homeValue',
        label: 'Home Replacement Value ($)',
        type: 'number',
        placeholder: 'e.g. 350000',
        min: 50000, max: 3000000, default: 350000,
        hint: 'Use replacement cost (rebuild cost), not market value.',
        showWhen: { input: 'insuranceType', value: 'home' },
      },
      {
        id: 'homeAge',
        label: 'Year Built',
        type: 'select',
        options: [
          { value: 'new',  label: 'After 2010 (new)' },
          { value: 'mid',  label: '1990–2010' },
          { value: 'old',  label: '1970–1989' },
          { value: 'vold', label: 'Before 1970' },
        ],
        default: 'mid',
        showWhen: { input: 'insuranceType', value: 'home' },
      },
      {
        id: 'roofAge',
        label: 'Roof Age',
        type: 'select',
        options: [
          { value: 'new',  label: 'Under 5 years' },
          { value: 'mid',  label: '5–15 years' },
          { value: 'old',  label: '15–25 years' },
          { value: 'aged', label: '25+ years (replacement may be required)' },
        ],
        default: 'mid',
        showWhen: { input: 'insuranceType', value: 'home' },
      },
      {
        id: 'constructionType',
        label: 'Construction Type',
        type: 'select',
        options: [
          { value: 'masonry', label: 'Masonry / Brick / Concrete block' },
          { value: 'frame',   label: 'Wood frame (most common)' },
          { value: 'superior',label: 'Fire-resistive / Steel frame' },
        ],
        default: 'frame',
        showWhen: { input: 'insuranceType', value: 'home' },
      },
      {
        id: 'homeCoverage',
        label: 'Coverage Type',
        type: 'select',
        options: [
          { value: 'rcv', label: 'Replacement Cost Value (full rebuild)' },
          { value: 'acv', label: 'Actual Cash Value (depreciated)' },
        ],
        default: 'rcv',
        hint: 'RCV costs ~10% more but pays full rebuild cost after a loss.',
        showWhen: { input: 'insuranceType', value: 'home' },
      },
      // ── HEALTH ───────────────────────────────────────────────────────────
      {
        id: 'healthAge',
        label: 'Age of Primary Enrollee',
        type: 'select',
        options: [
          { value: '27', label: '18–30' },
          { value: '35', label: '31–40' },
          { value: '45', label: '41–50' },
          { value: '55', label: '51–60' },
          { value: '62', label: '61–64' },
        ],
        default: '35',
        showWhen: { input: 'insuranceType', value: 'health' },
      },
      {
        id: 'planTier',
        label: 'Metal Tier',
        type: 'select',
        options: [
          { value: 'bronze',   label: 'Bronze — lowest premium, 40% cost-share' },
          { value: 'silver',   label: 'Silver — moderate, 30% cost-share (CSR eligible)' },
          { value: 'gold',     label: 'Gold — higher premium, 20% cost-share' },
          { value: 'platinum', label: 'Platinum — max premium, 10% cost-share' },
        ],
        default: 'silver',
        hint: 'Silver is required for Cost-Sharing Reduction (CSR) subsidies.',
        showWhen: { input: 'insuranceType', value: 'health' },
      },
      {
        id: 'healthCoverage',
        label: 'Coverage Scope',
        type: 'select',
        options: [
          { value: 'individual', label: 'Individual only' },
          { value: 'couple',     label: 'Individual + spouse / partner' },
          { value: 'parent',     label: 'Individual + children' },
          { value: 'family',     label: 'Full family' },
        ],
        default: 'individual',
        showWhen: { input: 'insuranceType', value: 'health' },
      },
      {
        id: 'tobaccoHealth',
        label: 'Tobacco Use',
        type: 'radio',
        options: [
          { value: 'no',  label: 'Non-smoker' },
          { value: 'yes', label: 'Tobacco user' },
        ],
        default: 'no',
        hint: 'ACA allows up to 1.5x surcharge for tobacco users in most states.',
        showWhen: { input: 'insuranceType', value: 'health' },
      },
      // ── LIFE ─────────────────────────────────────────────────────────────
      {
        id: 'lifeAge',
        label: 'Your Age',
        type: 'select',
        options: [
          { value: '25', label: '25–29' },
          { value: '30', label: '30–34' },
          { value: '35', label: '35–39' },
          { value: '40', label: '40–44' },
          { value: '45', label: '45–49' },
          { value: '50', label: '50–54' },
          { value: '55', label: '55–59' },
          { value: '60', label: '60–64' },
        ],
        default: '35',
        showWhen: { input: 'insuranceType', value: 'life' },
      },
      {
        id: 'lifeGender',
        label: 'Gender',
        type: 'radio',
        options: [
          { value: 'male',   label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        default: 'male',
        hint: 'Females pay 20–30% less on average due to longer life expectancy.',
        showWhen: { input: 'insuranceType', value: 'life' },
      },
      {
        id: 'healthClass',
        label: 'Health Classification',
        type: 'select',
        options: [
          { value: 'preferred_plus', label: 'Preferred Plus — excellent health, no issues' },
          { value: 'preferred',      label: 'Preferred — very good health, minor issues' },
          { value: 'standard_plus',  label: 'Standard Plus — good health, controlled conditions' },
          { value: 'standard',       label: 'Standard — average health' },
          { value: 'substandard',    label: 'Substandard — significant health history' },
        ],
        default: 'preferred',
        hint: 'Insurers assign class after medical underwriting. Use your best estimate.',
        showWhen: { input: 'insuranceType', value: 'life' },
      },
      {
        id: 'tobaccoLife',
        label: 'Tobacco / Nicotine Use',
        type: 'radio',
        options: [
          { value: 'no',  label: 'Non-user (5+ years)' },
          { value: 'yes', label: 'Current user or quit <5 years' },
        ],
        default: 'no',
        hint: 'Tobacco roughly doubles life insurance premiums.',
        showWhen: { input: 'insuranceType', value: 'life' },
      },
      {
        id: 'coverageAmount',
        label: 'Death Benefit',
        type: 'select',
        options: [
          { value: '100000',  label: '$100,000' },
          { value: '250000',  label: '$250,000' },
          { value: '500000',  label: '$500,000' },
          { value: '750000',  label: '$750,000' },
          { value: '1000000', label: '$1,000,000' },
          { value: '2000000', label: '$2,000,000' },
        ],
        default: '500000',
        showWhen: { input: 'insuranceType', value: 'life' },
      },
      {
        id: 'termLength',
        label: 'Term Length',
        type: 'select',
        options: [
          { value: '10', label: '10 years' },
          { value: '15', label: '15 years' },
          { value: '20', label: '20 years' },
          { value: '25', label: '25 years' },
          { value: '30', label: '30 years' },
        ],
        default: '20',
        showWhen: { input: 'insuranceType', value: 'life' },
      },
    ],
    formula: `
      const type  = inputs.insuranceType || 'auto';
      const state = inputs.state || 'TX';

      // State multipliers by insurance type (source: NAIC 2024, KFF, IIHS)
      const AUTO_STATE  = {AL:0.96,AK:0.95,AZ:1.12,AR:0.88,CA:1.33,CO:1.30,CT:1.42,DE:1.43,FL:1.84,GA:1.18,HI:0.94,ID:0.80,IL:1.10,IN:0.85,IA:0.81,KS:1.22,KY:0.86,LA:2.12,ME:0.77,MD:1.48,MA:1.15,MI:2.31,MN:1.14,MS:0.89,MO:0.97,MT:0.82,NE:0.87,NV:1.72,NH:0.78,NJ:1.19,NM:0.91,NY:1.61,NC:1.03,ND:0.92,OH:1.02,OK:1.15,OR:1.08,PA:1.05,RI:1.16,SC:1.44,SD:0.84,TN:0.98,TX:1.21,UT:0.90,VT:0.79,VA:1.01,WA:1.38,WV:1.00,WI:0.99,WY:0.83,DC:1.55};
      const HOME_STATE  = {AL:1.60,AK:0.80,AZ:0.88,AR:1.50,CA:0.78,CO:1.28,CT:0.88,DE:0.80,FL:3.50,GA:1.32,HI:0.58,ID:0.82,IL:1.10,IN:1.00,IA:1.05,KS:1.90,KY:1.12,LA:2.90,ME:0.72,MD:0.80,MA:0.90,MI:1.00,MN:1.15,MS:1.70,MO:1.22,MT:0.90,NE:1.40,NV:0.88,NH:0.70,NJ:0.90,NM:0.88,NY:0.92,NC:1.18,ND:1.02,OH:0.92,OK:2.20,OR:0.80,PA:0.80,RI:0.92,SC:1.32,SD:1.10,TN:1.22,TX:2.10,UT:0.80,VT:0.70,VA:0.90,WA:0.82,WV:0.90,WI:0.80,WY:0.80,DC:0.90};
      const HEALTH_STATE= {AL:1.30,AK:2.10,AZ:1.00,AR:1.20,CA:0.90,CO:0.95,CT:1.10,DE:1.15,FL:1.10,GA:1.18,HI:0.80,ID:1.00,IL:1.00,IN:1.10,IA:1.15,KS:1.20,KY:1.10,LA:1.28,ME:1.10,MD:0.85,MA:0.85,MI:0.95,MN:0.95,MS:1.40,MO:1.20,MT:1.30,NE:1.50,NV:1.00,NH:1.00,NJ:0.90,NM:0.95,NY:0.95,NC:1.10,ND:1.15,OH:1.00,OK:1.30,OR:0.90,PA:0.90,RI:0.85,SC:1.15,SD:1.40,TN:1.15,TX:1.20,UT:1.00,VT:1.00,VA:0.95,WA:0.85,WV:1.30,WI:1.00,WY:1.80,DC:0.75};

      let annualPremium = 0, monthlyPremium = 0, nationalAvg = 0, stateAvg = 0;
      let insight = '', savingsTip = '', stateNote = '';

      // ── AUTO ────────────────────────────────────────────────────────────
      if (type === 'auto') {
        const AGE_BASE   = {18:3200,30:1680,40:1420,58:1280,68:1460};
        const RECORD     = {clean:1.00,minor:1.32,accident:1.68,dui:2.28};
        const VEHICLE    = {economy:0.88,midsize:1.00,suv:1.10,truck:1.08,luxury:1.52,ev:1.22};
        const VEH_AGE    = {new:1.15,mid:1.00,old:0.85,aged:0.72};
        const COV        = {min:0.48,basic:0.80,full:1.00};
        const CREDIT     = {excellent:0.88,good:1.00,fair:1.24,poor:1.52};
        // States where credit scoring is prohibited
        const NO_CREDIT  = ['CA','HI','MA','MI'];

        const ageBase    = AGE_BASE[parseInt(inputs.driverAge)] || 1420;
        const recFactor  = RECORD[inputs.drivingRecord] || 1.00;
        const vehFactor  = VEHICLE[inputs.vehicleType] || 1.00;
        const vehAgeFac  = VEH_AGE[inputs.vehicleAge] || 1.00;
        const covFactor  = COV[inputs.autoCoverage] || 1.00;
        const creditFac  = NO_CREDIT.includes(state) ? 1.00 : (CREDIT[inputs.creditTier] || 1.00);
        const stateFac   = AUTO_STATE[state] || 1.00;

        nationalAvg      = 1760;
        const baseNational = ageBase * recFactor * vehFactor * vehAgeFac * covFactor * creditFac;
        annualPremium    = Math.round(baseNational * stateFac);
        stateAvg         = Math.round(nationalAvg * stateFac);

        const liability    = Math.round(annualPremium * 0.44);
        const collision    = inputs.autoCoverage !== 'min' ? Math.round(annualPremium * 0.33) : 0;
        const comprehensive= inputs.autoCoverage === 'full' ? Math.round(annualPremium * 0.23) : 0;

        if (NO_CREDIT.includes(state)) stateNote = state + ' prohibits credit-based auto insurance pricing.';
        else if (['MI','LA','FL'].includes(state)) stateNote = state + ' is among the most expensive auto insurance states in the U.S.';
        else if (['ME','VT','NH','ID'].includes(state)) stateNote = state + ' is among the most affordable auto insurance states.';

        insight    = recFactor > 1.3 ? 'A violation/accident typically affects rates for 3–5 years. Consider a defensive driving course — many insurers offer a 5–10% discount.' : 'Your clean record is your biggest pricing asset. Request a loyalty discount if you\'ve been with your insurer 3+ years.';
        savingsTip = 'Shopping 3+ carriers at renewal saves an average of $412/year. Bundle auto + home for an additional 10–25% discount.';
      }

      // ── HOME ────────────────────────────────────────────────────────────
      else if (type === 'home') {
        const value       = parseFloat(inputs.homeValue) || 350000;
        const YEAR_FACTOR = {new:0.0026,mid:0.0032,old:0.0040,vold:0.0048};
        const ROOF_FACTOR = {new:0.90,mid:1.00,old:1.18,aged:1.42};
        const CONSTR      = {masonry:0.88,frame:1.00,superior:0.80};
        const COV_FACTOR  = {rcv:1.00,acv:0.88};
        const stateFac    = HOME_STATE[state] || 1.00;

        const perDollarRate = (YEAR_FACTOR[inputs.homeAge] || 0.0032)
          * (ROOF_FACTOR[inputs.roofAge] || 1.00)
          * (CONSTR[inputs.constructionType] || 1.00)
          * (COV_FACTOR[inputs.homeCoverage] || 1.00)
          * stateFac;

        nationalAvg   = 1428;
        annualPremium = Math.round(value * perDollarRate);
        stateAvg      = Math.round(nationalAvg * stateFac);

        if (['FL','LA','TX','OK','KS'].includes(state)) stateNote = state + ' has elevated rates due to high catastrophic weather risk (hurricane/tornado/hail). Many carriers require separate windstorm or flood policies.';
        else if (state === 'CA') stateNote = 'California: wildfire risk has driven many major carriers to exit the state — FAIR Plan may be the only option in high-risk areas.';

        insight    = inputs.roofAge === 'aged' ? 'A roof over 25 years old may trigger non-renewal or require replacement. New roof typically reduces premium by 15–25% and qualifies for discounts.' : 'Raising your deductible from $1,000 to $2,500 typically reduces premiums by 10–15% with minimal real-world risk to most homeowners.';
        savingsTip = 'Bundling home + auto with one carrier saves 10–25%. Install monitored security/smoke detectors for an additional 5–15% discount.';
      }

      // ── HEALTH ──────────────────────────────────────────────────────────
      else if (type === 'health') {
        const AGE_BASE    = {27:388,35:512,45:698,55:920,62:1180};
        const TIER_FACTOR = {bronze:0.72,silver:1.00,gold:1.38,platinum:1.68};
        const SCOPE_FACTOR= {individual:1.00,couple:1.90,parent:1.70,family:2.40};
        const TOBACCO_FAC = inputs.tobaccoHealth === 'yes' ? 1.50 : 1.00;
        // States that ban tobacco surcharge
        const NO_TOBACCO  = ['CA','CT','DC','MA','NJ','NY','RI','VT','WA'];
        const tobaccoAdj  = NO_TOBACCO.includes(state) ? 1.00 : TOBACCO_FAC;
        const stateFac    = HEALTH_STATE[state] || 1.00;

        nationalAvg     = 621; // monthly individual silver
        const base      = (AGE_BASE[parseInt(inputs.healthAge)] || 512)
          * (TIER_FACTOR[inputs.planTier] || 1.00)
          * (SCOPE_FACTOR[inputs.healthCoverage] || 1.00)
          * tobaccoAdj
          * stateFac;
        monthlyPremium  = Math.round(base);
        annualPremium   = monthlyPremium * 12;
        const stateMonthly = Math.round(nationalAvg * stateFac);
        stateAvg        = stateMonthly * 12;

        const tier = inputs.planTier || 'silver';
        const deductible   = {bronze:7500,silver:4500,gold:1800,platinum:500}[tier];
        const oopMax       = {bronze:9450,silver:7350,gold:4200,platinum:2000}[tier];

        if (state === 'AK') stateNote = 'Alaska has the highest ACA premiums in the U.S. — nearly 3x the national average. Tax credits can significantly reduce costs.';
        else if (state === 'WY') stateNote = 'Wyoming has very limited insurer competition on the ACA marketplace, resulting in above-average premiums.';
        else if (['MA','MD','RI'].includes(state)) stateNote = state + ' has some of the lowest ACA premiums due to strong competition and a large insurer pool.';
        if (NO_TOBACCO.includes(state) && inputs.tobaccoHealth === 'yes') stateNote += (stateNote ? ' ' : '') + state + ' prohibits tobacco surcharges on ACA plans.';

        insight    = tier === 'bronze' ? 'Bronze + HSA is the most tax-efficient strategy for healthy adults. Contribute the maximum HSA amount ($4,150 individual) to offset the high deductible.' : tier === 'gold' || tier === 'platinum' ? 'Higher-tier plans cost less overall if you expect frequent medical care — calculate break-even by dividing premium difference by deductible gap.' : 'Silver is the only tier eligible for Cost-Sharing Reduction (CSR) subsidies if your income is 100–250% of the federal poverty level.';
        savingsTip = 'Check HealthCare.gov for premium tax credits — households up to 400% FPL may qualify. Open enrollment runs Nov 1 – Jan 15.';
      }

      // ── LIFE ────────────────────────────────────────────────────────────
      else if (type === 'life') {
        // Rate per $1,000 of coverage per month (non-tobacco, preferred)
        const MALE_RATE   = {25:0.09,30:0.10,35:0.13,40:0.18,45:0.30,50:0.48,55:0.76,60:1.22};
        const FEMALE_ADJ  = 0.78; // females pay ~22% less
        const HEALTH_ADJ  = {preferred_plus:0.85,preferred:1.00,standard_plus:1.20,standard:1.50,substandard:2.20};
        const TOBACCO_ADJ = inputs.tobaccoLife === 'yes' ? 2.10 : 1.00;
        const TERM_FACTOR = {10:0.80,15:0.90,20:1.00,25:1.12,30:1.28};

        const coverage     = parseInt(inputs.coverageAmount) || 500000;
        const age          = parseInt(inputs.lifeAge) || 35;
        const baseRate     = MALE_RATE[age] || 0.13;
        const genderAdj    = inputs.lifeGender === 'female' ? FEMALE_ADJ : 1.00;
        const healthAdj    = HEALTH_ADJ[inputs.healthClass] || 1.00;
        const termFactor   = TERM_FACTOR[parseInt(inputs.termLength)] || 1.00;
        const coverageUnits= coverage / 1000;

        nationalAvg      = 480; // annual, $500k 20yr preferred male 35
        monthlyPremium   = Math.round(baseRate * genderAdj * healthAdj * TOBACCO_ADJ * termFactor * coverageUnits);
        annualPremium    = monthlyPremium * 12;
        stateAvg         = nationalAvg; // life insurance has minimal state variation

        const costPer100k = Math.round((monthlyPremium / (coverage/100000)) * 100) / 100;

        insight    = inputs.tobaccoLife === 'yes' ? 'Quitting tobacco for 12+ consecutive months before applying can cut your premium by 40–50%. Most insurers re-classify you after 12 months tobacco-free.' : age >= 45 ? 'Buying now locks in your current health class. Each 5 years you wait increases premiums by 30–60%. A $500k 20-year policy purchased at 45 costs roughly $200/month more than at 35.' : 'Term life is the most cost-efficient pure protection product. Avoid whole life or universal life for income replacement purposes — the investment component rarely outperforms low-cost index funds.';
        savingsTip = 'Ladder multiple policies (e.g., $500k/10yr + $500k/20yr) to reduce costs as your financial obligations decrease over time. Total coverage at year 1 is $1M; at year 11 it steps down to $500k automatically.';
      }

      if (!monthlyPremium) monthlyPremium = Math.round(annualPremium / 12);
      const vsNational = annualPremium < nationalAvg * 0.95 ? 'below national average' : annualPremium > nationalAvg * 1.10 ? 'above national average' : 'near national average';
      const stateLabel = state || 'your state';

      return { annualPremium, monthlyPremium, nationalAvg, stateAvg, vsNational, insight, savingsTip, stateNote };
    `,
    outputs: [
      { id: 'annualPremium', label: 'Estimated Annual Premium',     type: 'currency-hero' },
      { id: 'monthlyPremium',label: 'Monthly Cost',                 type: 'currency' },
      { id: 'stateAvg',      label: 'State Average',                type: 'currency' },
      { id: 'nationalAvg',   label: 'National Average',             type: 'currency' },
      { id: 'vsNational',    label: 'Your Estimate',                type: 'insight' },
      { id: 'stateNote',     label: 'State-Specific Note',          type: 'insight' },
      { id: 'insight',       label: 'Expert Insight',               type: 'insight' },
      { id: 'savingsTip',    label: 'How to Save',                  type: 'insight' },
    ],
    disclaimer: `IMPORTANT DISCLAIMER: This calculator provides educational estimates only. It does not constitute insurance advice, a binding quote, or a recommendation to purchase any specific policy. CoveragePriceGuide.com is not a licensed insurance agent, broker, or financial advisor.

Estimates are derived from 2024–2025 national and state-level average data compiled from NAIC (National Association of Insurance Commissioners), Kaiser Family Foundation (KFF) health insurance data, IIHS, and industry actuarial surveys. Actual premiums are determined by individual underwriting criteria including full application review, credit reports (where permitted), motor vehicle reports, medical records, and insurer-specific rating algorithms.

State regulations vary significantly. In some states, certain rating factors (such as credit score, gender, or tobacco use) are prohibited. Contact your state's Department of Insurance for state-specific rules.

For health insurance, this tool does not calculate ACA premium tax credits or Cost-Sharing Reductions. Visit HealthCare.gov for official enrollment, subsidy eligibility, and plan comparison tools.

Always obtain quotes from multiple licensed carriers and consult a licensed insurance professional before making coverage decisions. Insurance needs change over time — review your policies annually.`,
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 8: Legal Advice
     Tool: Legal Case Cost Estimator
  ───────────────────────────────────────────────────────── */
  'legal-advice': {
    slug: 'legal-cost-estimator',
    title: 'Legal Cost Estimator',
    headline: 'How Much Will Your Legal Matter Cost?',
    description: 'Get a realistic cost range for your legal case before hiring an attorney. Based on case type, complexity, and your location.',
    seoDescription: 'Free legal cost estimator. Find out what a lawyer costs for divorce, personal injury, estate planning, business contracts, and more.',
    type: 'calculator',
    ctaText: 'Estimate My Legal Costs',
    inputs: [
      {
        id: 'caseType',
        label: 'Type of Legal Matter',
        type: 'select',
        options: [
          { value: 'divorce',     label: 'Divorce / Family Law' },
          { value: 'personal',    label: 'Personal Injury' },
          { value: 'estate',      label: 'Estate Planning / Will' },
          { value: 'business',    label: 'Business / Contract' },
          { value: 'realestate',  label: 'Real Estate Transaction' },
          { value: 'criminal',    label: 'Criminal Defense' },
          { value: 'employment',  label: 'Employment / Discrimination' },
          { value: 'immigration', label: 'Immigration' },
        ],
      },
      {
        id: 'complexity',
        label: 'Case Complexity',
        type: 'radio',
        options: [
          { value: 'simple',   label: 'Simple',   hint: 'Uncontested, straightforward' },
          { value: 'moderate', label: 'Moderate', hint: 'Some disputes or negotiation' },
          { value: 'complex',  label: 'Complex',  hint: 'Contested, litigation likely' },
        ],
        default: 'moderate',
      },
      {
        id: 'region',
        label: 'Your Region',
        type: 'select',
        options: [
          { value: 'northeast', label: 'Northeast (NY, MA, CT…)' },
          { value: 'south',     label: 'South (TX, FL, GA…)' },
          { value: 'midwest',   label: 'Midwest (IL, OH, MI…)' },
          { value: 'west',      label: 'West (CA, WA, CO…)' },
        ],
      },
    ],
    formula: `
      const BASE_HOURS = {
        divorce:     { simple:15, moderate:40,  complex:100 },
        personal:    { simple:0,  moderate:0,   complex:0   },
        estate:      { simple:4,  moderate:8,   complex:20  },
        business:    { simple:5,  moderate:15,  complex:40  },
        realestate:  { simple:3,  moderate:6,   complex:15  },
        criminal:    { simple:20, moderate:60,  complex:150 },
        employment:  { simple:0,  moderate:0,   complex:0   },
        immigration: { simple:8,  moderate:20,  complex:50  },
      };
      const HOURLY_RATE = { northeast:380, south:280, midwest:300, west:400 };
      const REGION_MUL  = { northeast:1.2, south:0.85, midwest:0.90, west:1.25 };

      const ct  = inputs.caseType   || 'divorce';
      const cpx = inputs.complexity || 'moderate';
      const reg = inputs.region     || 'south';
      const isContingency = ct === 'personal' || ct === 'employment';

      let totalLow, totalHigh, note;
      if (isContingency) {
        const avgSettlement = ct === 'personal' ? 52900 : 40000;
        totalLow  = Math.round(avgSettlement * 0.33);
        totalHigh = Math.round(avgSettlement * 0.40);
        note = 'No upfront cost — attorney takes 33-40% of settlement. You only pay if you win.';
      } else {
        const hours   = BASE_HOURS[ct][cpx];
        const rate    = HOURLY_RATE[reg] * REGION_MUL[reg];
        const baseAmt = hours * rate;
        totalLow  = Math.round(baseAmt * 0.75 / 100) * 100;
        totalHigh = Math.round(baseAmt * 1.30 / 100) * 100;
        note = '';
      }

      const totalMid  = Math.round((totalLow + totalHigh) / 2 / 100) * 100;
      const courtFees = isContingency ? 0 : Math.round(totalMid * 0.08);
      const usAvg     = { divorce:15000, personal:11000, estate:1500, business:8000, realestate:2500, criminal:25000, employment:9000, immigration:5000 };
      const insight   = isContingency
        ? 'Get a free consultation with 3+ attorneys — contingency rates are negotiable, especially on strong cases.'
        : 'Most attorneys offer a free or low-cost consultation. Ask for a flat-fee quote if the scope is well-defined.';

      return {
        totalLow, totalMid, totalHigh, courtFees,
        contingencyNote: note,
        comparison: { yours: '$' + totalMid.toLocaleString(), average: '$' + (usAvg[ct]||10000).toLocaleString() },
        insight,
      };
    `,
    outputs: [
      { id: 'range',      label: 'Estimated Total Cost',    type: 'range-hero' },
      { id: 'courtFees',  label: 'Filing & Court Fees',     type: 'currency' },
      { id: 'comparison', label: 'Your Estimate vs US Avg', type: 'comparison' },
      { id: 'insight',    label: 'Expert Insight',          type: 'insight' },
    ],
    disclaimer: 'Estimates are based on national averages and vary significantly by attorney, jurisdiction, and case facts. Always consult a licensed attorney.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 9: Real Estate Investing
     Tool: Rental Property ROI Calculator
  ───────────────────────────────────────────────────────── */
  'real-estate-investing': {
    slug: 'rental-roi-calculator',
    title: 'Rental Property ROI Calculator',
    headline: 'Is This Rental Property Worth Buying?',
    description: 'Calculate cap rate, cash-on-cash return, and annual cash flow for any rental property. See if the numbers actually work before you make an offer.',
    seoDescription: 'Free rental property ROI calculator. Calculate cap rate, cash-on-cash return, and monthly cash flow. Know if a rental property is a good investment before you buy.',
    type: 'calculator',
    ctaText: 'Analyze This Property',
    inputs: [
      {
        id: 'purchasePrice',
        label: 'Purchase Price ($)',
        type: 'number',
        placeholder: 'e.g. 280000',
        min: 10000, max: 5000000, default: 280000,
      },
      {
        id: 'downPayment',
        label: 'Down Payment (%)',
        type: 'radio',
        options: [
          { value: '20', label: '20%' },
          { value: '25', label: '25%' },
          { value: '30', label: '30%' },
        ],
        default: '20',
      },
      {
        id: 'monthlyRent',
        label: 'Expected Monthly Rent ($)',
        type: 'number',
        placeholder: 'e.g. 2000',
        min: 100, max: 50000, default: 2000,
      },
      {
        id: 'interestRate',
        label: 'Mortgage Interest Rate (%)',
        type: 'number',
        placeholder: 'e.g. 7.2',
        min: 3, max: 15, default: 7.2,
      },
      {
        id: 'expenses',
        label: 'Monthly Expenses (taxes + insurance + mgmt)',
        type: 'number',
        placeholder: 'e.g. 600',
        min: 0, max: 5000, default: 600,
        hint: 'Include property tax, insurance, property management, and maintenance reserves.',
      },
    ],
    formula: `
      const price    = parseFloat(inputs.purchasePrice) || 280000;
      const dpPct    = parseFloat(inputs.downPayment)   || 20;
      const rent     = parseFloat(inputs.monthlyRent)   || 2000;
      const rate     = parseFloat(inputs.interestRate)  || 7.2;
      const expenses = parseFloat(inputs.expenses)      || 600;

      const downAmt      = price * (dpPct / 100);
      const loanAmt      = price - downAmt;
      const monthlyRate  = rate / 100 / 12;
      const nPayments    = 360;

      const mortgage = monthlyRate > 0
        ? Math.round(loanAmt * monthlyRate * Math.pow(1+monthlyRate,nPayments) / (Math.pow(1+monthlyRate,nPayments)-1))
        : Math.round(loanAmt / nPayments);

      const vacancyLoss    = Math.round(rent * 0.08);
      const effectiveRent  = rent - vacancyLoss;
      const noi            = (effectiveRent - expenses) * 12;
      const capRate        = ((noi / price) * 100).toFixed(2);
      const annualCashFlow = noi - (mortgage * 12);
      const monthlyCashFlow= Math.round(annualCashFlow / 12);
      const cashOnCash     = ((annualCashFlow / downAmt) * 100).toFixed(2);

      let insight = '';
      if (parseFloat(capRate) >= 8) insight = 'Strong cap rate — this property clears the 8% threshold many investors target for residential rentals.';
      else if (parseFloat(capRate) >= 6) insight = 'Acceptable cap rate in most markets. Verify your expense estimate includes 1-2% of purchase price for annual maintenance.';
      else insight = 'Below 6% cap rate — common in expensive metros. Factor in appreciation potential if holding long-term.';

      return {
        capRate: parseFloat(capRate),
        cashOnCash: parseFloat(cashOnCash),
        monthlyCashFlow,
        annualCashFlow: Math.round(annualCashFlow),
        mortgage,
        downAmt: Math.round(downAmt),
        comparison: { yours: capRate + '% cap rate', average: '6.0% benchmark' },
        insight,
      };
    `,
    outputs: [
      { id: 'capRate',         label: 'Cap Rate',                   type: 'number-hero', unit: '%' },
      { id: 'cashOnCash',      label: 'Cash-on-Cash Return',        type: 'number',      unit: '%' },
      { id: 'monthlyCashFlow', label: 'Monthly Cash Flow',          type: 'currency' },
      { id: 'mortgage',        label: 'Monthly Mortgage',           type: 'currency' },
      { id: 'downAmt',         label: 'Down Payment Required',      type: 'currency' },
      { id: 'comparison',      label: 'Your Cap Rate vs Benchmark', type: 'comparison' },
      { id: 'insight',         label: 'Expert Insight',             type: 'insight' },
    ],
    disclaimer: 'Simplified model for initial analysis only. Does not account for taxes, depreciation, or capital expenditures. Consult a real estate attorney and CPA before investing.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 10: Health Symptoms
     Tool: Symptom Triage Wizard
  ───────────────────────────────────────────────────────── */
  'health-symptoms': {
    slug: 'symptom-triage-checker',
    title: 'Symptom Triage Checker',
    headline: 'Should You See a Doctor?',
    description: 'Answer 4 quick questions about your symptoms and find out the urgency level and what type of care is appropriate.',
    seoDescription: 'Free symptom triage checker. Find out if your symptoms need emergency care, a doctor visit, or can be treated at home.',
    type: 'wizard',
    ctaText: 'Check My Symptoms',
    inputs: [
      {
        id: 'bodySystem',
        label: 'Which area is affected?',
        type: 'select',
        options: [
          { value: 'chest',   label: 'Chest / Heart / Breathing' },
          { value: 'head',    label: 'Head / Neurological' },
          { value: 'abdomen', label: 'Abdomen / Stomach' },
          { value: 'skin',    label: 'Skin / Rash' },
          { value: 'joints',  label: 'Joints / Muscles / Back' },
          { value: 'general', label: 'General (fever, fatigue, etc.)' },
          { value: 'mental',  label: 'Mental / Emotional' },
        ],
      },
      {
        id: 'severity',
        label: 'How severe are your symptoms?',
        type: 'radio',
        options: [
          { value: 'mild',     label: 'Mild — noticeable but manageable' },
          { value: 'moderate', label: 'Moderate — affecting daily activity' },
          { value: 'severe',   label: 'Severe — difficult to function' },
        ],
        default: 'mild',
      },
      {
        id: 'duration',
        label: 'How long have you had symptoms?',
        type: 'select',
        options: [
          { value: 'hours',  label: 'A few hours (sudden onset)' },
          { value: 'days',   label: '1–3 days' },
          { value: 'week',   label: '4–7 days' },
          { value: 'weeks',  label: '1–4 weeks' },
          { value: 'months', label: 'More than 1 month' },
        ],
      },
      {
        id: 'redFlags',
        label: 'Any of these?',
        type: 'select',
        options: [
          { value: 'none',      label: 'None of the below' },
          { value: 'breathing', label: 'Difficulty breathing / shortness of breath' },
          { value: 'chestpain', label: 'Chest pain or pressure' },
          { value: 'confusion', label: 'Sudden confusion or speech difficulty' },
          { value: 'bleeding',  label: 'Uncontrolled bleeding' },
          { value: 'faint',     label: 'Fainting or loss of consciousness' },
        ],
      },
    ],
    formula: `
      const TRIAGE = {
        er:       { urgency:'Emergency Room — Now',             cause:'Your symptoms include warning signs that require immediate medical evaluation.',                                               steps:['Call 911 or have someone drive you to the ER immediately','Do NOT drive yourself if experiencing chest pain, confusion, or difficulty breathing','Bring a list of current medications if possible','Tell emergency staff your most severe symptom first'] },
        urgent:   { urgency:'Urgent Care or Doctor Today',      cause:'Your symptoms warrant same-day evaluation — not an emergency, but should not wait.',                                          steps:['Call your primary care doctor first — many have same-day slots','Urgent care is a good option if your doctor is unavailable','Avoid the ER unless symptoms worsen significantly','Monitor for any red flag symptoms'] },
        schedule: { urgency:'Schedule a Doctor Appointment',    cause:'Your symptoms are not immediately dangerous, but should be evaluated by a professional.',                                     steps:['Book an appointment within the next 1-2 weeks','Keep a symptom diary (when it occurs, triggers, severity changes)','Note any medications, supplements, or recent changes','If symptoms worsen, escalate to urgent care'] },
        home:     { urgency:'Home Care Appropriate',            cause:'Your symptoms appear mild and manageable at home with standard self-care.',                                                   steps:['Rest, hydrate, and monitor for changes','OTC medications (ibuprofen, antihistamines) may help','See a doctor if symptoms persist beyond 7-10 days or worsen','Telehealth is a convenient option for professional reassurance'] },
      };

      const rf  = inputs.redFlags   || 'none';
      const sev = inputs.severity   || 'mild';
      const dur = inputs.duration   || 'days';
      const sys = inputs.bodySystem || 'general';
      const emergencyRedFlags = ['breathing','chestpain','confusion','bleeding','faint'];

      let level;
      if (emergencyRedFlags.includes(rf) || (sys==='chest' && sev==='severe')) level = 'er';
      else if (sev==='severe' || (sev==='moderate' && dur==='hours')) level = 'urgent';
      else if (dur==='weeks' || dur==='months' || (sev==='moderate' && dur==='week')) level = 'schedule';
      else level = 'home';

      return { ...TRIAGE[level], restartNote:'' };
    `,
    outputs: [{ id: 'wizard', type: 'wizard-result' }],
    disclaimer: 'This tool is NOT a medical diagnosis. Always consult a licensed healthcare provider for medical decisions. In a life-threatening emergency, call 911 immediately.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 11: Credit Cards & Banking
     Tool: Credit Card Rewards Optimizer
  ───────────────────────────────────────────────────────── */
  'credit-cards-banking': {
    slug: 'credit-card-rewards-calculator',
    title: 'Credit Card Rewards Calculator',
    headline: 'How Much Could You Earn in Credit Card Rewards?',
    description: 'Calculate your annual rewards earnings based on your spending habits and compare flat-rate, travel, and category cashback cards.',
    seoDescription: 'Free credit card rewards calculator. Find out how much cash back or points you could earn based on your spending. Compare flat-rate, category, and travel cards.',
    type: 'calculator',
    ctaText: 'Calculate My Rewards',
    inputs: [
      { id: 'dining',     label: 'Monthly Dining & Restaurants ($)', type: 'number', placeholder: 'e.g. 400', min: 0, max: 5000,  default: 400 },
      { id: 'groceries',  label: 'Monthly Groceries ($)',            type: 'number', placeholder: 'e.g. 600', min: 0, max: 5000,  default: 600 },
      { id: 'travel',     label: 'Monthly Travel ($)',               type: 'number', placeholder: 'e.g. 200', min: 0, max: 10000, default: 200 },
      { id: 'gas',        label: 'Monthly Gas ($)',                  type: 'number', placeholder: 'e.g. 150', min: 0, max: 2000,  default: 150 },
      { id: 'other',      label: 'Monthly Other Spending ($)',       type: 'number', placeholder: 'e.g. 800', min: 0, max: 10000, default: 800 },
    ],
    formula: `
      const dining    = parseFloat(inputs.dining)    || 0;
      const groceries = parseFloat(inputs.groceries) || 0;
      const travel    = parseFloat(inputs.travel)    || 0;
      const gas       = parseFloat(inputs.gas)       || 0;
      const other     = parseFloat(inputs.other)     || 0;
      const total     = dining + groceries + travel + gas + other;

      const flatRate       = Math.round(total * 12 * 0.02);
      const travelCard     = Math.round((dining*3 + travel*3 + groceries*2 + gas*2 + other*1) * 12 * 0.015);
      const travelCardNet  = travelCard - 95;
      const groceryCapped  = Math.min(groceries, 500);
      const categoryCard   = Math.round((groceryCapped*6 + gas*3 + dining*2 + other*1) * 12 * 0.01);
      const categoryCardNet= categoryCard - 95;
      const bestEstimate   = Math.max(flatRate, travelCardNet, categoryCardNet);
      const usAvgRewards   = 420;

      let insight = '';
      if (total < 500) insight = 'With under $500/month in card spend, a no-fee 2% flat-rate card likely outperforms premium rewards cards after fees.';
      else if (dining + travel > groceries + gas) insight = 'Your spending skews dining and travel — a travel points card with 3x categories will likely outperform flat-rate.';
      else insight = 'Heavy grocery and gas spend? A category card can earn 3-6x in those categories — often beating travel cards for home-focused spenders.';

      return {
        flatRate, travelCardNet, categoryCardNet,
        totalMonthly: Math.round(total),
        bestEstimate,
        comparison: { yours: '$' + bestEstimate + '/yr potential', average: '$' + usAvgRewards + '/yr earned' },
        insight,
      };
    `,
    outputs: [
      { id: 'bestEstimate',    label: 'Best Potential Rewards',      type: 'currency-hero', unit: 'per year' },
      { id: 'flatRate',        label: 'Flat 2% Card',                type: 'currency', unit: '/yr' },
      { id: 'travelCardNet',   label: 'Travel Card (after fee)',      type: 'currency', unit: '/yr' },
      { id: 'categoryCardNet', label: 'Category Card (after fee)',    type: 'currency', unit: '/yr' },
      { id: 'comparison',      label: 'Your Potential vs US Average', type: 'comparison' },
      { id: 'insight',         label: 'Expert Insight',               type: 'insight' },
    ],
    disclaimer: 'Rewards estimates are based on advertised earning rates and average redemption values. Actual value varies by card, redemption method, and spending habits.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 12: Weight Loss & Fitness
     Tool: Weight Loss Timeline Calculator
  ───────────────────────────────────────────────────────── */
  'weight-loss-fitness': {
    slug: 'weight-loss-timeline-calculator',
    title: 'Weight Loss Timeline Calculator',
    headline: 'How Long Will It Take to Reach Your Goal Weight?',
    description: 'Get a realistic, science-based timeline for your weight loss goal based on your body, activity level, and calorie deficit.',
    seoDescription: 'Free weight loss timeline calculator. Find out how long it will take to lose weight based on your calorie deficit, BMI, and activity level.',
    type: 'calculator',
    ctaText: 'Calculate My Timeline',
    inputs: [
      { id: 'gender',        label: 'Biological Sex', type: 'radio', options: [{ value:'male', label:'Male' }, { value:'female', label:'Female' }], default: 'male' },
      { id: 'age',           label: 'Age',                    type: 'number', placeholder: 'e.g. 38', min: 18, max: 80,  default: 38 },
      { id: 'currentWeight', label: 'Current Weight (lbs)',   type: 'number', placeholder: 'e.g. 210', min: 90, max: 500, default: 210 },
      { id: 'goalWeight',    label: 'Goal Weight (lbs)',      type: 'number', placeholder: 'e.g. 180', min: 80, max: 400, default: 180 },
      { id: 'height',        label: 'Height (inches)',        type: 'number', placeholder: 'e.g. 70',  min: 48, max: 96,  default: 70 },
      {
        id: 'activity',
        label: 'Activity Level',
        type: 'select',
        options: [
          { value: '1.2',   label: 'Sedentary (mostly sitting)' },
          { value: '1.375', label: 'Lightly active (1–3 workouts/wk)' },
          { value: '1.55',  label: 'Moderately active (3–5 workouts/wk)' },
          { value: '1.725', label: 'Very active (daily exercise)' },
        ],
      },
    ],
    formula: `
      const gender = inputs.gender || 'male';
      const age    = parseFloat(inputs.age)           || 38;
      const curWt  = parseFloat(inputs.currentWeight) || 210;
      const goalWt = parseFloat(inputs.goalWeight)    || 180;
      const height = parseFloat(inputs.height)        || 70;
      const act    = parseFloat(inputs.activity)      || 1.375;

      const wKg = curWt * 0.453592;
      const hCm = height * 2.54;
      const bmr = gender === 'male' ? 10*wKg + 6.25*hCm - 5*age + 5 : 10*wKg + 6.25*hCm - 5*age - 161;
      const tdee = Math.round(bmr * act);

      const weightToLose  = Math.max(0, curWt - goalWt);
      const weeksNeeded   = weightToLose > 0 ? Math.ceil(weightToLose / 1.0) : 0;
      const monthsNeeded  = (weeksNeeded / 4.33).toFixed(1);
      const dailyCals     = tdee - 500;
      const heightInSq    = height * height;
      const bmi           = ((curWt / heightInSq) * 703).toFixed(1);
      const goalBmi       = ((goalWt / heightInSq) * 703).toFixed(1);

      let insight = '';
      if (weightToLose <= 0) insight = 'You\'re already at or below your goal weight. Focus on body composition (strength training) rather than the scale.';
      else if (weeksNeeded <= 12) insight = 'Achievable in under 3 months with a consistent 500 cal/day deficit. Prioritize protein (0.8g/lb) to preserve muscle.';
      else insight = 'For goals over 30 lbs, plan for diet breaks every 8-12 weeks — metabolic adaptation is real and short breaks prevent plateaus.';

      return {
        tdee, dailyCals, weeksNeeded,
        monthsNeeded: parseFloat(monthsNeeded),
        weightToLose,
        bmi: parseFloat(bmi),
        comparison: { yours: bmi + ' BMI now', average: goalBmi + ' BMI goal' },
        insight,
      };
    `,
    outputs: [
      { id: 'monthsNeeded', label: 'Estimated Time to Goal',         type: 'number-hero', unit: 'months' },
      { id: 'weeksNeeded',  label: 'Weeks at 1 lb/wk pace',         type: 'number',      unit: 'weeks' },
      { id: 'tdee',         label: 'Your Maintenance Calories',      type: 'number',      unit: 'kcal/day' },
      { id: 'dailyCals',    label: 'Target Calories (500 deficit)',  type: 'number',      unit: 'kcal/day' },
      { id: 'comparison',   label: 'Current vs Goal BMI',           type: 'comparison' },
      { id: 'insight',      label: 'Expert Insight',                 type: 'insight' },
    ],
    disclaimer: 'Provides estimates for planning purposes. Weight loss is non-linear. Consult your physician before starting any weight loss program.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 13: Automotive Guide
     Tool: True Cost of Car Ownership Calculator
  ───────────────────────────────────────────────────────── */
  'automotive-guide': {
    slug: 'car-ownership-cost-calculator',
    title: 'True Cost of Car Ownership Calculator',
    headline: 'What Does That Car Really Cost Per Year?',
    description: 'See the full cost of owning a car — depreciation, insurance, fuel, maintenance, and financing — not just the monthly payment.',
    seoDescription: 'Free car ownership cost calculator. Find out the true annual cost of owning any car including depreciation, insurance, gas, and maintenance.',
    type: 'calculator',
    ctaText: 'Calculate True Cost',
    inputs: [
      {
        id: 'vehiclePrice',
        label: 'Vehicle Purchase Price ($)',
        type: 'number',
        placeholder: 'e.g. 35000',
        min: 5000, max: 200000, default: 35000,
      },
      {
        id: 'vehicleType',
        label: 'Vehicle Type',
        type: 'select',
        options: [
          { value: 'sedan',  label: 'Sedan / Coupe' },
          { value: 'suv',    label: 'SUV / Crossover' },
          { value: 'truck',  label: 'Pickup Truck' },
          { value: 'ev',     label: 'Electric Vehicle' },
          { value: 'luxury', label: 'Luxury / Premium' },
        ],
      },
      {
        id: 'milesPerYear',
        label: 'Miles Driven Per Year',
        type: 'select',
        options: [
          { value: '8000',  label: '8,000 (low)' },
          { value: '12000', label: '12,000 (average)' },
          { value: '18000', label: '18,000 (high)' },
          { value: '25000', label: '25,000 (very high)' },
        ],
      },
      {
        id: 'financed',
        label: 'Purchase Method',
        type: 'radio',
        options: [
          { value: 'cash',     label: 'Cash / Paid off' },
          { value: 'financed', label: 'Financed (loan)' },
        ],
        default: 'financed',
      },
    ],
    formula: `
      const price  = parseFloat(inputs.vehiclePrice) || 35000;
      const type   = inputs.vehicleType  || 'sedan';
      const miles  = parseInt(inputs.milesPerYear)   || 12000;
      const fin    = inputs.financed || 'financed';

      const DEP_RATE   = { sedan:0.15, suv:0.14, truck:0.12, ev:0.18, luxury:0.20 };
      const INS_BASE   = { sedan:1800, suv:2100, truck:2000, ev:2400, luxury:3200 };
      const MPG        = { sedan:32,   suv:27,   truck:20,   ev:0,    luxury:24   };
      const MAINT      = { sedan:900,  suv:1000, truck:1100, ev:700,  luxury:1400 };

      const depreciation = Math.round(price * (DEP_RATE[type] || 0.15));
      const insurance    = INS_BASE[type] || 2000;
      const fuel         = type === 'ev'
        ? Math.round((miles / 3.5) * 0.14)
        : Math.round((miles / MPG[type]) * 3.40);
      const maintenance  = MAINT[type] || 900;
      const finCost      = fin === 'financed' ? Math.round(price * 0.065 * 0.5) : 0;
      const totalAnnual  = depreciation + insurance + fuel + maintenance + finCost;
      const costPerMile  = (totalAnnual / miles).toFixed(2);
      const usAvg        = 12000;

      let insight = '';
      if (type === 'ev') insight = 'EVs save on fuel and maintenance, but often have higher insurance and steeper depreciation. Break-even vs gas typically hits at year 3-5.';
      else if (type === 'luxury') insight = 'Luxury vehicles often cost 40-60% more annually than mainstream brands — depreciation and insurance are the biggest drivers.';
      else insight = 'The biggest cost surprises are usually depreciation (often 50%+ of total cost) and insurance — not the monthly payment.';

      return {
        totalAnnual, depreciation, insurance, fuel, maintenance, finCost,
        costPerMile: parseFloat(costPerMile),
        comparison: { yours: '$' + totalAnnual.toLocaleString() + '/yr', average: '$' + usAvg.toLocaleString() + '/yr' },
        insight,
      };
    `,
    outputs: [
      { id: 'totalAnnual',  label: 'True Annual Cost',    type: 'currency-hero' },
      { id: 'costPerMile',  label: 'Cost Per Mile',       type: 'number',   unit: '$/mile' },
      { id: 'depreciation', label: 'Depreciation',        type: 'currency', percent: true },
      { id: 'insurance',    label: 'Insurance',           type: 'currency', percent: true },
      { id: 'fuel',         label: 'Fuel / Energy',       type: 'currency', percent: true },
      { id: 'maintenance',  label: 'Maintenance',         type: 'currency', percent: true },
      { id: 'finCost',      label: 'Financing Interest',  type: 'currency', percent: true },
      { id: 'comparison',   label: 'Your Cost vs US Avg', type: 'comparison' },
      { id: 'insight',      label: 'Expert Insight',      type: 'insight' },
    ],
    disclaimer: 'Based on national averages from AAA. Actual costs vary by location, driving habits, and individual vehicle condition.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 14: Online Education
     Tool: Degree & Certification ROI Calculator
  ───────────────────────────────────────────────────────── */
  'online-education': {
    slug: 'education-roi-calculator',
    title: 'Degree & Certification ROI Calculator',
    headline: 'Is This Degree or Certification Worth the Cost?',
    description: 'Calculate your return on investment for any degree or online certification. See how long it takes to break even and your 10-year salary gain.',
    seoDescription: 'Free education ROI calculator. Find out if a degree, bootcamp, or certification is worth the cost based on your salary increase and time to break even.',
    type: 'calculator',
    ctaText: 'Calculate My ROI',
    inputs: [
      {
        id: 'programType',
        label: 'Program Type',
        type: 'select',
        options: [
          { value: 'associates', label: "Associate's Degree (2 yr)" },
          { value: 'bachelors',  label: "Bachelor's Degree (4 yr)" },
          { value: 'masters',    label: "Master's Degree (2 yr)" },
          { value: 'bootcamp',   label: 'Coding / Tech Bootcamp (3-6 mo)' },
          { value: 'cert',       label: 'Professional Certification (1-3 mo)' },
          { value: 'mba',        label: 'MBA (2 yr)' },
        ],
      },
      {
        id: 'totalCost',
        label: 'Total Program Cost ($)',
        type: 'number',
        placeholder: 'e.g. 45000',
        min: 500, max: 300000, default: 45000,
        hint: 'Include tuition, fees, books, and living expenses.',
      },
      {
        id: 'currentSalary',
        label: 'Current Annual Salary ($)',
        type: 'number',
        placeholder: 'e.g. 52000',
        min: 0, max: 500000, default: 52000,
      },
      {
        id: 'expectedSalary',
        label: 'Expected Salary After Program ($)',
        type: 'number',
        placeholder: 'e.g. 78000',
        min: 10000, max: 1000000, default: 78000,
        hint: 'Check BLS.gov or LinkedIn Salary for your target role.',
      },
    ],
    formula: `
      const type       = inputs.programType  || 'bachelors';
      const cost       = parseFloat(inputs.totalCost)       || 45000;
      const curSal     = parseFloat(inputs.currentSalary)   || 52000;
      const newSal     = parseFloat(inputs.expectedSalary)  || 78000;

      const DURATION_YRS = { associates:2, bachelors:4, masters:2, bootcamp:0.4, cert:0.15, mba:2 };
      const durationYrs  = DURATION_YRS[type] || 2;

      const salaryGain      = Math.max(0, newSal - curSal);
      const opportunityCost = curSal * durationYrs * 0.5;
      const totalInvestment = cost + opportunityCost;
      const yearsToBreakeven= salaryGain > 0 ? (totalInvestment / salaryGain).toFixed(1) : 0;
      const tenYearGain     = salaryGain * 10 - totalInvestment;
      const roi10yr         = totalInvestment > 0 ? Math.round((tenYearGain / totalInvestment) * 100) : 0;

      const AVG_ROI = { associates:120, bachelors:180, masters:200, bootcamp:350, cert:400, mba:250 };
      const avgRoi  = AVG_ROI[type] || 200;

      let insight = '';
      if (roi10yr >= 300) insight = 'Excellent ROI — this program pays back more than 3× its cost in 10 years. Prioritize starting ASAP.';
      else if (roi10yr >= 150) insight = 'Solid return. Make sure to verify job placement rates — not all programs deliver their advertised salary outcomes.';
      else if (roi10yr >= 0) insight = 'Modest return. Consider whether a shorter, cheaper certification covers the same skill gap before committing to a full degree.';
      else insight = 'Negative ROI at 10 years — reconsider the program cost or look for more affordable alternatives.';

      return {
        salaryGain,
        totalInvestment: Math.round(totalInvestment),
        yearsToBreakeven: parseFloat(yearsToBreakeven) || 0,
        tenYearGain: Math.round(tenYearGain),
        roi10yr,
        comparison: { yours: roi10yr + '% ROI', average: avgRoi + '% avg for ' + type },
        insight,
      };
    `,
    outputs: [
      { id: 'roi10yr',          label: '10-Year ROI',                       type: 'number-hero', unit: '%' },
      { id: 'salaryGain',       label: 'Annual Salary Gain',                type: 'currency',    unit: '/yr' },
      { id: 'yearsToBreakeven', label: 'Years to Break Even',               type: 'number',      unit: 'years' },
      { id: 'tenYearGain',      label: '10-Year Net Gain',                  type: 'currency' },
      { id: 'totalInvestment',  label: 'Total Investment (incl. opp. cost)',type: 'currency' },
      { id: 'comparison',       label: 'Your ROI vs Program Average',       type: 'comparison' },
      { id: 'insight',          label: 'Expert Insight',                    type: 'insight' },
    ],
    disclaimer: 'Salary projections are estimates. Actual outcomes depend on job market, location, and individual performance. Verify salary data with BLS.gov.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 15: Cybersecurity & Privacy
     Tool: Personal Security Risk Assessment
  ───────────────────────────────────────────────────────── */
  'cybersecurity-privacy': {
    slug: 'security-risk-assessment',
    title: 'Personal Security Risk Assessment',
    headline: 'How Vulnerable Are You Online?',
    description: 'Answer 5 quick questions about your digital habits and get a personalized security risk score with the most impactful fixes.',
    seoDescription: 'Free personal cybersecurity risk assessment. Find out how vulnerable your accounts and data are, and get the specific steps to protect yourself.',
    type: 'wizard',
    ctaText: 'Check My Risk Level',
    inputs: [
      {
        id: 'passwords',
        label: 'How do you manage passwords?',
        type: 'select',
        options: [
          { value: 'reuse',     label: 'I reuse the same password on multiple sites' },
          { value: 'variation', label: 'I use variations of the same password' },
          { value: 'manual',    label: 'I create unique passwords but remember them manually' },
          { value: 'manager',   label: 'I use a password manager (1Password, Bitwarden, etc.)' },
        ],
      },
      {
        id: 'mfa',
        label: 'Multi-factor authentication (2FA)',
        type: 'select',
        options: [
          { value: 'none',    label: "I don't use 2FA anywhere" },
          { value: 'sms',     label: 'I use SMS/text-based 2FA on some accounts' },
          { value: 'partial', label: 'I use an authenticator app on some accounts' },
          { value: 'full',    label: 'I use an authenticator app on all critical accounts' },
        ],
      },
      {
        id: 'publicWifi',
        label: 'Public WiFi usage',
        type: 'radio',
        options: [
          { value: 'often',  label: 'I use it regularly without a VPN' },
          { value: 'rarely', label: 'I use it occasionally' },
          { value: 'never',  label: 'I avoid it or always use a VPN' },
        ],
        default: 'often',
      },
      {
        id: 'updates',
        label: 'Software updates',
        type: 'radio',
        options: [
          { value: 'ignore', label: 'I often ignore or delay updates' },
          { value: 'manual', label: 'I update manually when I remember' },
          { value: 'auto',   label: 'Updates install automatically' },
        ],
        default: 'manual',
      },
      {
        id: 'phishing',
        label: 'Have you clicked a suspicious link or attachment in the past year?',
        type: 'radio',
        options: [
          { value: 'yes',    label: 'Yes' },
          { value: 'unsure', label: 'Not sure' },
          { value: 'no',     label: 'No' },
        ],
        default: 'unsure',
      },
    ],
    formula: `
      const pwScore  = { reuse:40, variation:25, manual:10, manager:0 };
      const mfaScore = { none:30, sms:15, partial:8, full:0 };
      const wifiScore= { often:15, rarely:5, never:0 };
      const updScore = { ignore:10, manual:5, auto:0 };
      const phiScore = { yes:20, unsure:10, no:0 };

      const score = (pwScore[inputs.passwords]   || 25)
                  + (mfaScore[inputs.mfa]        || 15)
                  + (wifiScore[inputs.publicWifi] || 10)
                  + (updScore[inputs.updates]    || 5)
                  + (phiScore[inputs.phishing]   || 10);

      let urgency, cause, steps;
      if (score >= 70) {
        urgency = 'High Risk — Act This Week';
        cause   = 'Your current habits leave you highly vulnerable to account takeovers, data theft, and phishing attacks.';
        steps   = ['1. Set up a free password manager today (Bitwarden is free and open-source) — this single step eliminates your biggest risk','2. Enable authenticator-based 2FA on email, banking, and social media immediately','3. Run a breach check at haveibeenpwned.com — change any exposed passwords first','4. Enable auto-updates on your phone and computer','5. Never enter credentials on a site you reached via a link — always type the URL directly'];
      } else if (score >= 35) {
        urgency = 'Moderate Risk — Improve Your Posture';
        cause   = 'You have some protections in place but gaps remain that attackers actively exploit.';
        steps   = ['1. Upgrade SMS 2FA to an authenticator app for email and banking — SIM swapping can bypass SMS','2. Audit reused passwords and replace the top 10','3. Use a VPN on public WiFi (ProtonVPN has a solid free tier)','4. Enable automatic updates everywhere — 60% of breaches exploit known, patchable vulnerabilities','5. Install uBlock Origin browser extension to block malicious ads'];
      } else {
        urgency = 'Low Risk — Maintain Your Habits';
        cause   = 'Your security practices are above average. Focus on maintaining habits and staying current.';
        steps   = ['1. Review your password manager for old or duplicate entries quarterly','2. Consider a hardware security key (YubiKey) for highest-value accounts','3. Enable account activity alerts on banking and email','4. Freeze your credit at the 3 bureaus — free and the most powerful identity theft prevention','5. Run an annual breach check at haveibeenpwned.com'];
      }

      return { urgency, cause, steps, restartNote:'' };
    `,
    outputs: [{ id: 'wizard', type: 'wizard-result' }],
    disclaimer: 'This assessment provides general guidance based on your responses. It is not a professional security audit.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 16: Mental Health & Wellness
     Tool: Burnout Risk Checker
  ───────────────────────────────────────────────────────── */
  'mental-health-wellness': {
    slug: 'burnout-risk-checker',
    title: 'Burnout Risk Checker',
    headline: 'Are You on the Path to Burnout?',
    description: 'Answer 5 questions about your work habits, energy, and emotional state to get an honest burnout risk assessment and science-backed recovery steps.',
    seoDescription: 'Free burnout risk assessment. Find out if you\'re experiencing early, moderate, or severe burnout — with specific, evidence-based recovery strategies.',
    type: 'wizard',
    ctaText: 'Check My Burnout Risk',
    inputs: [
      { id: 'energy',     label: "How's your energy at end of a typical workday?",   type: 'radio', options: [{ value:'1', label:'Completely drained — I have nothing left' }, { value:'2', label:'Tired but functional' }, { value:'3', label:'Reasonably okay — still have some energy' }], default:'2' },
      { id: 'motivation', label: 'How do you feel about your work?',                 type: 'radio', options: [{ value:'1', label:'Cynical or detached — just going through the motions' }, { value:'2', label:"Neutral — it's okay but not engaged" }, { value:'3', label:'Mostly engaged — still find meaning in it' }], default:'2' },
      { id: 'sleep',      label: 'How is your sleep quality?',                       type: 'radio', options: [{ value:'1', label:'Poor — wake up exhausted regardless of hours' }, { value:'2', label:'Inconsistent — good some nights, bad others' }, { value:'3', label:'Generally good — wake up rested most days' }], default:'2' },
      { id: 'boundaries', label: 'Work-life boundaries',                             type: 'radio', options: [{ value:'1', label:'Non-existent — work bleeds into all hours' }, { value:'2', label:'Weak — I try but often fail to disconnect' }, { value:'3', label:'Reasonably maintained — I can switch off' }], default:'2' },
      { id: 'physical',   label: 'Physical symptoms (headaches, tension, illness)',  type: 'radio', options: [{ value:'1', label:'Frequent — noticeably worse than a year ago' }, { value:'2', label:'Occasional — not disabling' }, { value:'3', label:'Rare or none' }], default:'2' },
    ],
    formula: `
      const score = parseInt(inputs.energy||'2') + parseInt(inputs.motivation||'2') +
                    parseInt(inputs.sleep||'2')  + parseInt(inputs.boundaries||'2') +
                    parseInt(inputs.physical||'2');

      let urgency, cause, steps;
      if (score <= 7) {
        urgency = 'High Burnout Risk — Intervention Needed';
        cause   = 'Your scores suggest significant depletion across energy, engagement, and physical wellness — characteristic of clinical burnout.';
        steps   = ['Speak with your doctor or a therapist — burnout has measurable physiological effects that benefit from professional support','Negotiate a temporary reduction in workload if possible — burnout recovery takes weeks to months','Eliminate one major commitment this week — protecting your recovery is the priority','Prioritize sleep above all else — 7-9 hours is the single highest-ROI recovery activity','Consider whether this role/environment is structurally incompatible with your wellbeing long-term'];
      } else if (score <= 11) {
        urgency = 'Moderate Risk — Address Now Before It Worsens';
        cause   = "You're showing multiple burnout signals. Early action is far more effective than recovery after full burnout.";
        steps   = ['Identify your top energy drains (specific tasks, people, meetings) and minimize them this week','Schedule 2+ non-negotiable recovery activities per week (exercise, nature, social, creative)','Practice "work shutdown rituals" — a consistent end-of-day routine that signals your brain work is done','Communicate your bandwidth honestly with your manager before it becomes a performance issue','Check in on sleep, nutrition, and exercise — these are the foundation, not extras'];
      } else {
        urgency = 'Low Risk — Maintain Your Balance';
        cause   = 'Your current habits suggest healthy resilience. Maintain your boundaries and recovery practices proactively.';
        steps   = ['Continue protecting your non-work time — say no early and often','Check in on your workload each quarter — creep is subtle and cumulative','Invest in social connection — it\'s the strongest buffer against burnout','Notice early warning signs in yourself (irritability, reduced enjoyment) before they escalate','Model healthy boundaries for your team — managers who do this reduce team burnout rates'];
      }

      return { urgency, cause, steps, restartNote:'' };
    `,
    outputs: [{ id: 'wizard', type: 'wizard-result' }],
    disclaimer: 'For informational and educational purposes only. Not a clinical diagnosis. If experiencing a mental health crisis, contact a licensed professional or call 988 (Suicide & Crisis Lifeline).',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 17: Home Security Systems
     Tool: Home Security System Cost Estimator
  ───────────────────────────────────────────────────────── */
  'home-security-systems': {
    slug: 'security-system-cost-calculator',
    title: 'Home Security System Cost Calculator',
    headline: 'How Much Does a Home Security System Cost?',
    description: 'Get an accurate cost estimate for a home security system based on your home size, monitoring preferences, and installation type.',
    seoDescription: 'Free home security system cost calculator. Find out what a monitored alarm system costs for your home — equipment, installation, and monthly fees.',
    type: 'calculator',
    ctaText: 'Estimate My System Cost',
    inputs: [
      {
        id: 'homeSize',
        label: 'Home Size',
        type: 'select',
        options: [
          { value: 'small',  label: 'Small (under 1,500 sq ft)' },
          { value: 'medium', label: 'Medium (1,500–2,500 sq ft)' },
          { value: 'large',  label: 'Large (2,500–4,000 sq ft)' },
          { value: 'xlarge', label: 'Extra Large (4,000+ sq ft)' },
        ],
      },
      {
        id: 'systemType',
        label: 'System Type',
        type: 'radio',
        options: [
          { value: 'diy', label: 'DIY Install', hint: 'Self-install, you own equipment' },
          { value: 'pro', label: 'Professional Install', hint: 'Tech installs, sometimes leased' },
        ],
        default: 'diy',
      },
      {
        id: 'monitoring',
        label: 'Monitoring Plan',
        type: 'select',
        options: [
          { value: 'none',     label: 'Self-monitoring only (free)' },
          { value: 'basic',    label: 'Basic 24/7 monitoring ($10-20/mo)' },
          { value: 'standard', label: 'Standard with video ($25-45/mo)' },
          { value: 'premium',  label: 'Premium with smart home ($50-80/mo)' },
        ],
      },
      {
        id: 'cameras',
        label: 'Number of Security Cameras',
        type: 'radio',
        options: [
          { value: '0', label: 'None' },
          { value: '2', label: '2 (entry points)' },
          { value: '4', label: '4 (standard coverage)' },
          { value: '8', label: '8 (full coverage)' },
        ],
        default: '4',
      },
    ],
    formula: `
      const size    = inputs.homeSize   || 'medium';
      const sysType = inputs.systemType || 'diy';
      const monitor = inputs.monitoring || 'standard';
      const cameras = parseInt(inputs.cameras) || 4;

      const BASE_EQUIP  = { small:300, medium:500, large:700, xlarge:1000 };
      const MONTHLY_MON = { none:0, basic:15, standard:35, premium:65 };

      const cameraUnitCost = sysType === 'diy' ? 80 : 200;
      const equipment      = BASE_EQUIP[size] + (cameras * cameraUnitCost);
      const installation   = sysType === 'pro' ? (300 + cameras * 50) : 0;
      const upfront        = equipment + installation;
      const monthly        = MONTHLY_MON[monitor];
      const annualTotal    = upfront + (monthly * 12);
      const fiveYearTotal  = upfront + (monthly * 60);
      const usAvgUpfront   = 700;

      let insight = '';
      if (sysType === 'diy' && monitor !== 'none') insight = 'DIY systems like Ring Alarm and SimpliSafe offer professional-grade 24/7 monitoring at 40-60% less than traditional alarm companies — without contracts.';
      else if (sysType === 'pro') insight = 'Professional installs often bundle equipment with a 2-3 year monitoring contract. Ask about equipment ownership — some systems are leased, not owned.';
      else insight = 'Without professional monitoring, response times depend entirely on you. Consider at minimum a local siren for deterrence.';

      return {
        upfront, equipment, installation, monthly, annualTotal, fiveYearTotal,
        comparison: { yours: '$' + upfront.toLocaleString() + ' upfront', average: '$' + usAvgUpfront.toLocaleString() + ' avg upfront' },
        insight,
      };
    `,
    outputs: [
      { id: 'upfront',       label: 'Upfront Equipment + Install', type: 'currency-hero' },
      { id: 'monthly',       label: 'Monthly Monitoring Fee',       type: 'currency',    unit: '/mo' },
      { id: 'annualTotal',   label: 'Year 1 Total Cost',            type: 'currency' },
      { id: 'fiveYearTotal', label: '5-Year Total Cost',            type: 'currency' },
      { id: 'comparison',    label: 'Your Upfront vs US Average',   type: 'comparison' },
      { id: 'insight',       label: 'Expert Insight',               type: 'insight' },
    ],
    disclaimer: 'Estimates based on national averages from Consumer Reports and industry data. Actual quotes vary by provider, location, and promotions.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 18: Solar Energy
     Tool: Solar Panel Savings Calculator
  ───────────────────────────────────────────────────────── */
  'solar-energy': {
    slug: 'solar-savings-calculator',
    title: 'Solar Panel Savings Calculator',
    headline: 'How Much Can You Save With Solar Panels?',
    description: 'Calculate your solar installation cost, annual savings, and break-even point based on your energy usage, location, and available incentives.',
    seoDescription: 'Free solar panel savings calculator. Find out how much a solar system costs, how much you\'ll save on electricity, and when solar pays for itself.',
    type: 'calculator',
    ctaText: 'Calculate My Solar Savings',
    inputs: [
      {
        id: 'monthlyBill',
        label: 'Current Monthly Electric Bill ($)',
        type: 'number',
        placeholder: 'e.g. 180',
        min: 20, max: 2000, default: 180,
      },
      {
        id: 'sunZone',
        label: 'Your Sun Zone',
        type: 'select',
        options: [
          { value: 'low',    label: 'Low sun (Pacific Northwest, New England)' },
          { value: 'medium', label: 'Medium sun (Midwest, Mid-Atlantic)' },
          { value: 'high',   label: 'High sun (Southeast, Texas, Plains)' },
          { value: 'best',   label: 'Best sun (Southwest, AZ, CA, NV, FL)' },
        ],
      },
      {
        id: 'roofType',
        label: 'Roof Condition',
        type: 'radio',
        options: [
          { value: 'good',     label: 'Good (under 10 years old)' },
          { value: 'moderate', label: 'Moderate (10–20 years)' },
          { value: 'replace',  label: 'Needs replacement (20+ years)' },
        ],
        default: 'good',
      },
      {
        id: 'incentive',
        label: 'Federal Tax Credit Eligibility',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes — I pay federal income tax' },
          { value: 'no',  label: 'No / Unsure' },
        ],
        default: 'yes',
      },
    ],
    formula: `
      const bill      = parseFloat(inputs.monthlyBill) || 180;
      const sun       = inputs.sunZone   || 'medium';
      const roof      = inputs.roofType  || 'good';
      const taxCredit = inputs.incentive === 'yes';

      const annualKwh  = (bill / 0.13) * 12;
      const SUN_FACTOR = { low:0.80, medium:1.0, high:1.15, best:1.30 };
      const systemKw   = (annualKwh / (1400 * SUN_FACTOR[sun])).toFixed(1);

      const baseCost  = parseFloat(systemKw) * 1000 * 3.00;
      const roofAdder = roof === 'replace' ? 10000 : 0;
      const grossCost = baseCost + roofAdder;
      const itcCredit = taxCredit ? Math.round(grossCost * 0.30) : 0;
      const netCost   = Math.round(grossCost - itcCredit);

      const annualSavings    = Math.round(bill * 12 * 0.90);
      const breakEvenYears   = annualSavings > 0 ? (netCost / annualSavings).toFixed(1) : 0;
      const twentyYearSavings= annualSavings * 20 - netCost;
      const usAvgNet         = 14000;

      let insight = '';
      if (parseFloat(breakEvenYears) <= 7) insight = 'Excellent break-even — solar systems typically last 25-30 years, so you\'re looking at 15-20+ years of pure savings after payback.';
      else if (parseFloat(breakEvenYears) <= 12) insight = 'Solid investment. Add any state/utility incentives (dsireusa.org) — they can cut another $1,000-5,000 off your net cost.';
      else insight = 'Longer payback — worth revisiting if your roof needs replacement or if local electricity rates rise significantly.';

      return {
        systemKw: parseFloat(systemKw),
        grossCost: Math.round(grossCost),
        itcCredit, netCost, annualSavings,
        breakEvenYears: parseFloat(breakEvenYears) || 0,
        twentyYearSavings: Math.round(twentyYearSavings),
        comparison: { yours: '$' + netCost.toLocaleString() + ' net cost', average: '$' + usAvgNet.toLocaleString() + ' US avg' },
        insight,
      };
    `,
    outputs: [
      { id: 'netCost',            label: 'Net System Cost (after incentives)', type: 'currency-hero' },
      { id: 'systemKw',           label: 'Recommended System Size',            type: 'number',   unit: 'kW' },
      { id: 'itcCredit',          label: '30% Federal Tax Credit',             type: 'currency' },
      { id: 'annualSavings',      label: 'Estimated Annual Savings',           type: 'currency', unit: '/yr' },
      { id: 'breakEvenYears',     label: 'Break-Even Point',                   type: 'number',   unit: 'years' },
      { id: 'twentyYearSavings',  label: '20-Year Net Savings',                type: 'currency' },
      { id: 'comparison',         label: 'Your Cost vs US Average',            type: 'comparison' },
      { id: 'insight',            label: 'Expert Insight',                     type: 'insight' },
    ],
    disclaimer: 'Based on national averages from NREL and EnergySage. Actual costs and savings vary by installer, equipment, utility rates, and local incentives. Get 3+ quotes.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 19: Senior Care & Medicare
     Tool: Medicare Cost Estimator
  ───────────────────────────────────────────────────────── */
  'senior-care-medicare': {
    slug: 'medicare-cost-estimator',
    title: 'Medicare Cost Estimator',
    headline: 'What Will Medicare Actually Cost You?',
    description: 'Estimate your annual Medicare costs based on your plan type, income, and healthcare usage. Compare Original Medicare vs Medicare Advantage.',
    seoDescription: 'Free Medicare cost estimator. Find out what Medicare Parts A, B, C, and D will cost you based on your income and health needs.',
    type: 'calculator',
    ctaText: 'Estimate My Medicare Costs',
    inputs: [
      {
        id: 'planType',
        label: 'Medicare Plan Type',
        type: 'radio',
        options: [
          { value: 'original',   label: 'Original Medicare (Parts A + B)' },
          { value: 'advantage',  label: 'Medicare Advantage (Part C)' },
          { value: 'supplement', label: 'Original + Medigap Supplement' },
        ],
        default: 'original',
      },
      {
        id: 'income',
        label: 'Annual Individual Income ($)',
        type: 'number',
        placeholder: 'e.g. 45000',
        min: 0, max: 500000, default: 45000,
        hint: 'Used to calculate IRMAA surcharges (higher incomes pay more for Part B & D).',
      },
      {
        id: 'healthUsage',
        label: 'Expected Healthcare Usage',
        type: 'radio',
        options: [
          { value: 'low',    label: 'Low — healthy, few doctor visits' },
          { value: 'medium', label: 'Medium — 1-2 conditions, regular care' },
          { value: 'high',   label: 'High — multiple conditions, frequent care' },
        ],
        default: 'medium',
      },
      {
        id: 'partD',
        label: 'Prescription Drug Coverage (Part D)',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes — I need regular prescriptions' },
          { value: 'no',  label: 'No — I take few/no medications' },
        ],
        default: 'yes',
      },
    ],
    formula: `
      const plan   = inputs.planType    || 'original';
      const income = parseFloat(inputs.income)  || 45000;
      const usage  = inputs.healthUsage || 'medium';
      const partD  = inputs.partD === 'yes';

      let partBMonthly = 185;
      if (income > 213000) partBMonthly = 628;
      else if (income > 160000) partBMonthly = 511;
      else if (income > 133000) partBMonthly = 394;
      else if (income > 106000) partBMonthly = 278;
      const partBannual = partBMonthly * 12;

      const partDAnnual   = partD ? (46 * 12) : 0;
      const OOP           = { original:{low:800,medium:2500,high:6000}, advantage:{low:500,medium:1800,high:4500}, supplement:{low:200,medium:600,high:1200} };
      const oop           = OOP[plan][usage];
      const medigapAnnual = plan === 'supplement' ? 2100 : 0;
      const advantagePrem = plan === 'advantage'  ? 300  : 0;
      const totalAnnual   = partBannual + partDAnnual + oop + medigapAnnual + advantagePrem;
      const usAvg         = 6500;

      let insight = '';
      if (plan === 'supplement') insight = 'Medigap plans offer the most predictable costs — ideal if you travel or want freedom to use any Medicare-accepting provider nationwide.';
      else if (plan === 'advantage') insight = 'Medicare Advantage often has $0 premiums but check the network carefully — many plans restrict you to local providers.';
      else insight = 'Original Medicare has no out-of-pocket maximum — a serious illness can cost $20k+. Consider a Medigap plan to cap your exposure.';

      return {
        totalAnnual, partBannual, partDAnnual, oop, medigapAnnual, partBMonthly,
        comparison: { yours: '$' + totalAnnual.toLocaleString() + '/yr', average: '$' + usAvg.toLocaleString() + '/yr avg' },
        insight,
      };
    `,
    outputs: [
      { id: 'totalAnnual',   label: 'Estimated Annual Medicare Cost', type: 'currency-hero' },
      { id: 'partBannual',   label: 'Part B Premiums',                type: 'currency', percent: true },
      { id: 'partDAnnual',   label: 'Part D Premiums',                type: 'currency', percent: true },
      { id: 'oop',           label: 'Out-of-Pocket Costs',            type: 'currency', percent: true },
      { id: 'medigapAnnual', label: 'Medigap Premiums',               type: 'currency', percent: true },
      { id: 'comparison',    label: 'Your Cost vs Avg Beneficiary',   type: 'comparison' },
      { id: 'insight',       label: 'Expert Insight',                 type: 'insight' },
    ],
    disclaimer: 'Based on 2025 Medicare rates. IRMAA brackets and plan premiums change annually. Consult Medicare.gov or a licensed Medicare advisor for plan selection.',
    relatedArticles: true,
  },

  /* ─────────────────────────────────────────────────────────
     NICCHIA 20: Business Startup
     Tool: Startup Cost Calculator
  ───────────────────────────────────────────────────────── */
  'business-startup': {
    slug: 'startup-cost-calculator',
    title: 'Startup Cost Calculator',
    headline: 'How Much Does It Cost to Start a Business?',
    description: 'Get a realistic first-year cost estimate for your business type. Covers formation, licensing, equipment, marketing, staffing, and operating expenses.',
    seoDescription: 'Free startup cost calculator. Estimate how much money you need to start a business — by industry, scale, and operating model.',
    type: 'calculator',
    ctaText: 'Estimate My Startup Costs',
    inputs: [
      {
        id: 'businessType',
        label: 'Business Type',
        type: 'select',
        options: [
          { value: 'service',    label: 'Service Business (consulting, cleaning, etc.)' },
          { value: 'retail',     label: 'Retail Store (physical location)' },
          { value: 'ecommerce',  label: 'E-Commerce / Online Store' },
          { value: 'restaurant', label: 'Restaurant / Food Service' },
          { value: 'saas',       label: 'Software / SaaS / App' },
          { value: 'franchise',  label: 'Franchise' },
        ],
      },
      {
        id: 'scale',
        label: 'Business Scale',
        type: 'radio',
        options: [
          { value: 'solo',   label: 'Solo / Home-based', hint: 'Just you, no staff' },
          { value: 'small',  label: 'Small (1-5 employees)' },
          { value: 'medium', label: 'Medium (6-15 employees)' },
        ],
        default: 'solo',
      },
      {
        id: 'location',
        label: 'Business Location',
        type: 'radio',
        options: [
          { value: 'home',   label: 'Home-based / Remote' },
          { value: 'shared', label: 'Shared space / Co-working' },
          { value: 'leased', label: 'Leased commercial space' },
        ],
        default: 'home',
      },
      {
        id: 'runway',
        label: 'Operating Runway Needed',
        type: 'radio',
        options: [
          { value: '3',  label: '3 months (lean launch)' },
          { value: '6',  label: '6 months (standard)' },
          { value: '12', label: '12 months (conservative)' },
        ],
        default: '6',
      },
    ],
    formula: `
      const type   = inputs.businessType || 'service';
      const scale  = inputs.scale        || 'solo';
      const loc    = inputs.location     || 'home';
      const runway = parseInt(inputs.runway) || 6;

      const FORMATION = 1200;
      const EQUIP = {
        service:    { solo:2000,  small:8000,   medium:20000  },
        retail:     { solo:15000, small:40000,  medium:100000 },
        ecommerce:  { solo:2500,  small:8000,   medium:20000  },
        restaurant: { solo:80000, small:150000, medium:300000 },
        saas:       { solo:5000,  small:25000,  medium:80000  },
        franchise:  { solo:25000, small:80000,  medium:200000 },
      };
      const MONTHLY_OP = {
        service:    { solo:1500, small:8000,  medium:25000 },
        retail:     { solo:5000, small:15000, medium:40000 },
        ecommerce:  { solo:2000, small:6000,  medium:18000 },
        restaurant: { solo:0,    small:25000, medium:60000 },
        saas:       { solo:2000, small:10000, medium:30000 },
        franchise:  { solo:6000, small:20000, medium:50000 },
      };
      const LOC_ADJ = { home:0, shared:500*runway, leased:2000*runway };

      const equipment     = EQUIP[type][scale];
      const monthlyOp     = MONTHLY_OP[type][scale];
      const operatingCost = monthlyOp * runway + LOC_ADJ[loc];
      const marketing     = Math.round(monthlyOp * runway * 0.10);
      const reserve       = Math.round((equipment + operatingCost) * 0.15);
      const totalFirstYear= FORMATION + equipment + operatingCost + marketing + reserve;

      const sbaAvg = type==='restaurant' ? 275000 : type==='franchise' ? 100000 : 30000;

      let insight = '';
      if (type === 'restaurant') insight = 'Restaurants have the highest startup costs and lowest survival rates — 60% fail in year 1. Stress-test your model at 50% projected capacity.';
      else if (type === 'saas') insight = 'SaaS businesses can be started very lean solo — focus on reaching $1k MRR before investing in team or infrastructure.';
      else if (scale === 'solo') insight = 'Solo businesses can often launch for 30-50% less by delaying hires, using shared spaces, and starting with services before products.';
      else insight = 'Most small businesses underestimate working capital needs. Plan for 6-12 months before cash-flow positive — especially for retail and food.';

      return {
        totalFirstYear: Math.round(totalFirstYear),
        formation: FORMATION,
        equipment: Math.round(equipment),
        operatingCost: Math.round(operatingCost),
        marketing: Math.round(marketing),
        reserve: Math.round(reserve),
        comparison: { yours: '$' + Math.round(totalFirstYear).toLocaleString(), average: '$' + sbaAvg.toLocaleString() + ' SBA avg' },
        insight,
      };
    `,
    outputs: [
      { id: 'totalFirstYear', label: 'Estimated First-Year Cost',  type: 'currency-hero' },
      { id: 'equipment',      label: 'Equipment & Setup',          type: 'currency', percent: true },
      { id: 'operatingCost',  label: 'Operating Costs (runway)',   type: 'currency', percent: true },
      { id: 'marketing',      label: 'Marketing Budget',           type: 'currency', percent: true },
      { id: 'reserve',        label: 'Contingency Reserve (15%)',  type: 'currency', percent: true },
      { id: 'formation',      label: 'Formation & Legal',          type: 'currency', percent: true },
      { id: 'comparison',     label: 'Your Cost vs SBA Average',   type: 'comparison' },
      { id: 'insight',        label: 'Expert Insight',             type: 'insight' },
    ],
    disclaimer: 'Estimates based on SBA data and industry averages. Actual costs vary significantly by location, industry, and individual decisions. Consult a business advisor before committing capital.',
    relatedArticles: true,
  },

};
