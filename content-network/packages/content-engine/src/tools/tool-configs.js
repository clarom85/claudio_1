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
    slug: 'life-insurance-calculator',
    title: 'Life Insurance Needs Calculator',
    headline: 'How Much Life Insurance Do You Actually Need?',
    description: 'Calculate your true life insurance coverage needs based on income replacement, debts, dependents, and existing assets — not an agent\'s commission.',
    seoDescription: 'Free life insurance calculator. Find out exactly how much coverage you need based on your income, debts, and family situation. No email required.',
    type: 'calculator',
    ctaText: 'Calculate My Coverage Need',
    inputs: [
      {
        id: 'annualIncome',
        label: 'Annual Income ($)',
        type: 'number',
        placeholder: 'e.g. 80000',
        min: 10000, max: 1000000, default: 80000,
      },
      {
        id: 'yearsToReplace',
        label: 'Years of Income to Replace',
        type: 'select',
        options: [
          { value: '5',  label: '5 years (minimal)' },
          { value: '10', label: '10 years (standard)' },
          { value: '15', label: '15 years (family with young kids)' },
          { value: '20', label: '20 years (max protection)' },
        ],
      },
      {
        id: 'mortgage',
        label: 'Mortgage / Large Debt Balance ($)',
        type: 'number',
        placeholder: 'e.g. 250000',
        min: 0, max: 2000000, default: 250000,
      },
      {
        id: 'dependents',
        label: 'Number of Dependents',
        type: 'select',
        options: [
          { value: '0', label: 'None' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3+' },
        ],
      },
      {
        id: 'existingCoverage',
        label: 'Existing Life Insurance ($)',
        type: 'number',
        placeholder: 'e.g. 50000',
        min: 0, max: 5000000, default: 0,
        hint: 'Include employer-provided and any existing policies.',
      },
    ],
    formula: `
      const income   = parseFloat(inputs.annualIncome)     || 80000;
      const years    = parseInt(inputs.yearsToReplace)     || 10;
      const mortgage = parseFloat(inputs.mortgage)         || 0;
      const deps     = parseInt(inputs.dependents)         || 0;
      const existing = parseFloat(inputs.existingCoverage) || 0;

      const incomeReplacement = income * years;
      const dependentBuffer   = deps * 25000;
      const finalExpenses     = 15000;
      const totalNeed         = incomeReplacement + mortgage + dependentBuffer + finalExpenses;
      const coverageGap       = Math.max(0, totalNeed - existing);
      const premiumPer100k    = 8;
      const estMonthlyPremium = Math.round((coverageGap / 100000) * premiumPer100k);
      const usAvgCoverage     = 171000;

      let insight = '';
      if (coverageGap === 0) insight = 'You\'re fully covered — review your policy annually as income and debts change.';
      else if (coverageGap > 500000) insight = 'A 20-year term policy typically costs less than a streaming service per week for this coverage level.';
      else insight = 'Term life insurance is the most cost-effective option for income replacement — avoid whole life for pure coverage needs.';

      return {
        totalNeed:          Math.round(totalNeed),
        coverageGap:        Math.round(coverageGap),
        estMonthlyPremium,
        incomeReplacement:  Math.round(incomeReplacement),
        mortgage:           Math.round(mortgage),
        comparison: { yours: '$' + Math.round(totalNeed/1000) + 'k needed', average: '$' + Math.round(usAvgCoverage/1000) + 'k held' },
        insight,
      };
    `,
    outputs: [
      { id: 'totalNeed',         label: 'Coverage You Need',        type: 'currency-hero' },
      { id: 'coverageGap',       label: 'Coverage Gap',             type: 'currency' },
      { id: 'estMonthlyPremium', label: 'Est. Monthly Premium',     type: 'currency' },
      { id: 'incomeReplacement', label: 'Income Replacement',       type: 'currency' },
      { id: 'comparison',        label: 'Your Need vs US Average',  type: 'comparison' },
      { id: 'insight',           label: 'Expert Insight',           type: 'insight' },
    ],
    disclaimer: 'Estimates use DIME method. Premium estimates are illustrative for a healthy 35-year-old. Actual premiums vary by age, health, and insurer. Compare quotes from multiple carriers.',
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
