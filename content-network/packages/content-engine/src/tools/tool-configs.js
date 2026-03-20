/**
 * Tool configurations — 1 tool per nicchia
 * Ogni config è auto-sufficiente: contiene inputs, logica, outputs.
 * Il tool-generator converte questo in una pagina HTML standalone.
 */

export const TOOL_CONFIGS = {

  /* ─────────────────────────────────────────────────────────
     NICCHIA 1: Home Improvement Costs
     Tool: Project Cost Estimator
  ───────────────────────────────────────────────────────── */
  'home-improvement-costs': {
    slug: 'renovation-cost-calculator',
    title: 'Home Renovation Cost Calculator',
    headline: 'How Much Will Your Project Cost?',
    description: 'Get an instant, contractor-verified cost estimate for your home improvement project. Enter your project details and see a realistic budget range — broken down by labor, materials, and permits.',
    seoDescription: 'Free home renovation cost calculator. Estimate bathroom remodel, kitchen, roofing, flooring, HVAC, and deck costs based on size, materials, and your region.',
    type: 'calculator',
    ctaText: 'Get My Estimate',
    inputs: [
      {
        id: 'project',
        label: 'Project Type',
        type: 'select',
        options: [
          { value: 'bathroom', label: 'Bathroom Remodel' },
          { value: 'kitchen', label: 'Kitchen Remodel' },
          { value: 'roof', label: 'Roof Replacement' },
          { value: 'flooring', label: 'Flooring Installation' },
          { value: 'hvac', label: 'HVAC Replacement' },
          { value: 'deck', label: 'Deck / Patio Build' },
          { value: 'windows', label: 'Window Replacement' },
          { value: 'painting', label: 'Interior Painting' },
        ]
      },
      {
        id: 'size',
        label: 'Project Size (sq ft)',
        type: 'number',
        placeholder: 'e.g. 120',
        min: 10, max: 5000, default: 150,
        hint: 'For HVAC, enter your home\'s total sq ft. For windows, enter number of windows × 15.'
      },
      {
        id: 'quality',
        label: 'Material Quality',
        type: 'radio',
        options: [
          { value: 'basic', label: 'Basic', hint: 'Builder-grade, functional' },
          { value: 'mid', label: 'Mid-Range', hint: 'Most popular choice' },
          { value: 'premium', label: 'Premium', hint: 'High-end finishes' },
        ],
        default: 'mid'
      },
      {
        id: 'region',
        label: 'Your Region',
        type: 'select',
        options: [
          { value: 'northeast', label: 'Northeast (NY, MA, CT...)' },
          { value: 'south', label: 'South (TX, FL, GA...)' },
          { value: 'midwest', label: 'Midwest (IL, OH, MI...)' },
          { value: 'west', label: 'West (CA, WA, CO...)' },
        ]
      },
    ],
    // All costs in $/sqft. Formula: base × qualityMult × regionMult × size
    formula: `
      const BASE = {
        bathroom: { labor: 45, materials: 35, permits: 5 },
        kitchen:  { labor: 55, materials: 65, permits: 8 },
        roof:     { labor: 4,  materials: 5,  permits: 0.5 },
        flooring: { labor: 4,  materials: 6,  permits: 0 },
        hvac:     { labor: 1.2,materials: 2.8,permits: 0.2 },
        deck:     { labor: 18, materials: 20, permits: 3 },
        windows:  { labor: 12, materials: 18, permits: 1 },
        painting: { labor: 2,  materials: 1,  permits: 0 },
      };
      const QUALITY = { basic: 0.75, mid: 1.0, premium: 1.6 };
      const REGION  = { northeast: 1.20, south: 0.88, midwest: 0.95, west: 1.25 };
      const VARIATION = 0.22; // ±22% for low/high range

      const b = BASE[inputs.project];
      const qm = QUALITY[inputs.quality];
      const rm = REGION[inputs.region];
      const sz = parseFloat(inputs.size) || 150;

      const laborAvg    = b.labor    * qm * rm * sz;
      const materialsAvg= b.materials* qm * rm * sz;
      const permitsAvg  = b.permits  * rm * sz;
      const totalAvg    = laborAvg + materialsAvg + permitsAvg;
      const totalLow    = Math.round(totalAvg * (1 - VARIATION) / 100) * 100;
      const totalHigh   = Math.round(totalAvg * (1 + VARIATION) / 100) * 100;
      const totalMid    = Math.round(totalAvg / 100) * 100;

      return {
        totalLow, totalMid, totalHigh,
        labor:     Math.round(laborAvg),
        materials: Math.round(materialsAvg),
        permits:   Math.round(permitsAvg),
        sqft:      sz
      };
    `,
    outputs: [
      { id: 'range',     label: 'Estimated Cost Range', type: 'range-hero' },
      { id: 'labor',     label: 'Labor',     type: 'currency', percent: true },
      { id: 'materials', label: 'Materials', type: 'currency', percent: true },
      { id: 'permits',   label: 'Permits & Fees', type: 'currency', percent: true },
    ],
    disclaimer: 'Estimates are based on national averages and regional labor data. Actual costs vary based on site conditions, contractor availability, and material prices at time of purchase. Always get 3+ quotes from licensed contractors.',
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

};
