(function () {
  'use strict';

  const products = window.DEK_MIT_PRODUCTS || [];
  const sectionsMeta = window.DEK_MIT_SECTIONS || {};

  // Application State
  const state = {
    dept: 'home', // 'home' | 'all' | 'fruits' | 'vegetables' | 'butchery' | 'seafood_dairy' | 'pantry_dry' | 'new_arrivals' | 'favorites'
    sectionCode: 'all',
    status: 'all',
    storage: 'all',
    search: '',
    sort: 'flow',
    viewMode: 'grid',
    pricingMode: localStorage.getItem('dekmit_pricing_mode') || 'market', // 'market' | 'smart' | 'custom'
    marginPercent: Number(localStorage.getItem('dekmit_margin') || 0),
    priceOverrides: JSON.parse(localStorage.getItem('dekmit_price_overrides') || '{}'), // { [code]: { price, stockStatus } }
    sheetUrl: localStorage.getItem('dekmit_sheet_url') || '',
    cart: JSON.parse(localStorage.getItem('dekmit_cart') || '{}'),
    favorites: JSON.parse(localStorage.getItem('dekmit_favs') || '[]'),
    location: localStorage.getItem('dekmit_loc') || 'Kampala — Kololo / Nakasero',
    timeSlot: localStorage.getItem('dekmit_slot') || 'Today, 2:00 PM – 4:00 PM',
    wednesdayOverride: localStorage.getItem('dekmit_wednesday_override') === 'true'
  };

  // Apply any persisted local price or stock overrides on boot
  function applyStoredOverrides() {
    products.forEach((p) => {
      const ov = state.priceOverrides[p.code];
      if (ov) {
        if (typeof ov.price === 'number' && ov.price > 0) {
          p.price = ov.price;
          recalcProductFinancials(p);
        }
        if (ov.stockStatus) {
          p.stockStatus = ov.stockStatus;
        }
      }
    });
  }

  function recalcProductFinancials(p) {
    const market = Number(p.price) || 1000;
    const slStr = String(p.shelfLife || '14').trim().toLowerCase();
    const sl = slStr === 'long' ? 365 : parseInt(slStr, 10) || 14;
    let wastagePct = 1;
    let grossMarginPct = 15;
    if (sl <= 3) {
      wastagePct = 12;
      grossMarginPct = 25;
    } else if (sl <= 10) {
      wastagePct = 7;
      grossMarginPct = 20;
    } else if (sl <= 30) {
      wastagePct = 4;
      grossMarginPct = 18;
    }
    const sourcingCost = Math.max(100, Math.round((market * 0.8) / 100) * 100);
    const proposed = Math.max(
      market,
      Math.round(sourcingCost / (1 - (grossMarginPct + wastagePct) / 100) / 100) * 100
    );
    p.sourcingCost = sourcingCost;
    p.proposedPrice = proposed;
    p.grossProfit = proposed - sourcingCost;
    p.grossMarginPct = grossMarginPct;
    p.wastagePct = wastagePct;
    p.netMarginPct = grossMarginPct - wastagePct;
  }

  // DOM References
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const deptNavBar = document.getElementById('deptNavBar');
  const storefrontHomeView = document.getElementById('storefrontHomeView');
  const homeCarouselsContainer = document.getElementById('homeCarouselsContainer');
  const aisleCatalogueSection = document.getElementById('aisleCatalogueSection');
  const aisleBreadcrumb = document.getElementById('aisleBreadcrumb');
  const aisleHeading = document.getElementById('aisleHeading');
  const sidebarSectionList = document.getElementById('sidebarSectionList');
  const resultsSummary = document.getElementById('resultsSummary');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const sortSelect = document.getElementById('sortSelect');
  const gridViewBtn = document.getElementById('gridViewBtn');
  const tableViewBtn = document.getElementById('tableViewBtn');
  const catalogueContainer = document.getElementById('catalogueContainer');

  const favoritesFilterBtn = document.getElementById('favoritesFilterBtn');
  const favCountLabel = document.getElementById('favCountLabel');
  const openCartBtn = document.getElementById('openCartBtn');
  const headerCartTotal = document.getElementById('headerCartTotal');
  const headerCartCount = document.getElementById('headerCartCount');

  const cartDialog = document.getElementById('cartDialog');
  const cartDialogSubtitle = document.getElementById('cartDialogSubtitle');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const freeBagProgressText = document.getElementById('freeBagProgressText');
  const freeBagProgressFill = document.getElementById('freeBagProgressFill');
  const ecoBagUpsell = document.getElementById('ecoBagUpsell');
  const addEcoBagBtn = document.getElementById('addEcoBagBtn');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartSlotSummary = document.getElementById('cartSlotSummary');
  const cartDeliveryFee = document.getElementById('cartDeliveryFee');
  const cartGrandTotal = document.getElementById('cartGrandTotal');
  const deliveryZoneSelect = document.getElementById('deliveryZoneSelect');
  const checkoutForm = document.getElementById('checkoutForm');
  const clearCartBtn = document.getElementById('clearCartBtn');

  const productDetailDialog = document.getElementById('productDetailDialog');
  const productDetailContent = document.getElementById('productDetailContent');

  const slotDialog = document.getElementById('slotDialog');
  const openSlotModalBtn = document.getElementById('openSlotModalBtn');
  const activeLocationLabel = document.getElementById('activeLocationLabel');
  const activeTimeSlotLabel = document.getElementById('activeTimeSlotLabel');
  const slotLocationSelect = document.getElementById('slotLocationSelect');
  const timeSlotButtons = document.getElementById('timeSlotButtons');

  const marginDialog = document.getElementById('marginDialog');
  const pricingToggleBtn = document.getElementById('pricingToggleBtn');
  const activeMarginLabel = document.getElementById('activeMarginLabel');
  const marginRange = document.getElementById('marginRange');
  const marginValuePreview = document.getElementById('marginValuePreview');
  const googleSheetUrlInput = document.getElementById('googleSheetUrlInput');
  const syncSheetBtn = document.getElementById('syncSheetBtn');
  const csvFileInput = document.getElementById('csvFileInput');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const resetCustomPricesBtn = document.getElementById('resetCustomPricesBtn');
  const syncStatusMsg = document.getElementById('syncStatusMsg');
  const quickPriceSearch = document.getElementById('quickPriceSearch');
  const quickPriceTableBody = document.getElementById('quickPriceTableBody');
  const toastContainer = document.getElementById('toastContainer');

  // Dek Mit Promotions & Programs DOM References
  const quickPromoTopBtn = document.getElementById('quickPromoTopBtn');
  const promotionsSection = document.getElementById('promotionsSection');
  const wednesdayLiveStatus = document.getElementById('wednesdayLiveStatus');
  const toggleWednesdayPreviewBtn = document.getElementById('toggleWednesdayPreviewBtn');
  const wednesdayToggleText = document.getElementById('wednesdayToggleText');

  const programModal = document.getElementById('programModal');
  const programModalTitle = document.getElementById('programModalTitle');
  const programModalSubtitle = document.getElementById('programModalSubtitle');
  const programSelect = document.getElementById('programSelect');
  const progFullName = document.getElementById('progFullName');
  const progPhone = document.getElementById('progPhone');
  const progLocationLabel = document.getElementById('progLocationLabel');
  const progLocation = document.getElementById('progLocation');
  const progLocationHint = document.getElementById('progLocationHint');
  const progNotesLabel = document.getElementById('progNotesLabel');
  const progNotes = document.getElementById('progNotes');
  const progSummaryBox = document.getElementById('progSummaryBox');
  const programForm = document.getElementById('programForm');
  const progSuccessBox = document.getElementById('progSuccessBox');
  const progSuccessMessage = document.getElementById('progSuccessMessage');
  const progWhatsAppLink = document.getElementById('progWhatsAppLink');
  const progResetFormBtn = document.getElementById('progResetFormBtn');

  // Currency Formatter
  function formatUGX(amount) {
    return 'UGX ' + Math.round(amount).toLocaleString('en-UG');
  }

  // Live Wednesday Half-Day Market Detector (Every Wednesday 8:00 AM – 1:00 PM)
  function isWednesdayHalfDay() {
    const now = new Date();
    // Wednesday is day 3 in JS getDay() (Sunday=0, Monday=1, Tuesday=2, Wednesday=3)
    return now.getDay() === 3 && now.getHours() >= 8 && now.getHours() < 13;
  }

  function isWednesdayDiscountActive() {
    return Boolean(state.wednesdayOverride || isWednesdayHalfDay());
  }

  // Base Retail / Sourced Price before Wednesday discounts
  function getProductBasePrice(product) {
    if (!product) return 0;
    if (state.pricingMode === 'smart') {
      return product.proposedPrice || product.price;
    }
    if (state.pricingMode === 'custom' && state.marginPercent > 0) {
      const raw = product.price * (1 + state.marginPercent / 100);
      return Math.round(raw / 100) * 100;
    }
    return product.price;
  }

  // Active Selling Price Calculation (with 50% discount on Wednesday half-day)
  function getProductPrice(product) {
    if (!product) return 0;
    const base = getProductBasePrice(product);
    if (isWednesdayDiscountActive()) {
      return Math.max(500, Math.round((base * 0.5) / 100) * 100);
    }
    return base;
  }

  function updateHeaderPricingLabel() {
    const overrideCount = Object.keys(state.priceOverrides).length;
    const suffix = overrideCount > 0 ? ` (${overrideCount} edited)` : '';
    if (state.pricingMode === 'smart') {
      activeMarginLabel.textContent = 'Smart Formula' + suffix;
    } else if (state.pricingMode === 'custom' && state.marginPercent > 0) {
      activeMarginLabel.textContent = `+${state.marginPercent}% Retail` + suffix;
    } else {
      activeMarginLabel.textContent = 'Market (0%)' + suffix;
    }
  }

  // Department Matcher for Top Nav
  function matchesDept(product, dept) {
    if (dept === 'all' || dept === 'home') return true;
    if (dept === 'new_arrivals') return product.status === 'NEW';
    if (dept === 'favorites') return state.favorites.includes(product.code);
    if (dept === 'fruits') return product.zoneId === 'fruits';
    if (dept === 'vegetables') return product.zoneId === 'vegetables';
    if (dept === 'butchery') return product.zoneId === 'butchery';
    if (dept === 'seafood_dairy') return ['5.1', '5.2', '5.3'].includes(product.sectionCode);
    if (dept === 'pantry_dry') return ['3.1', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9'].includes(product.sectionCode);
    return true;
  }

  // Storage Badge & Stage Tint Helper
  function getStorageInfo(storage) {
    if (storage.includes('Humidified')) {
      return { cls: 'st-humid', icon: 'droplet', short: 'Misted', tint: '#ecfdf5' };
    }
    if (storage.includes('Chilled')) {
      return { cls: 'st-chilled', icon: 'snowflake', short: '2–5°C', tint: '#f0f9ff' };
    }
    if (storage.includes('Frozen')) {
      return { cls: 'st-frozen', icon: 'ice', short: '≤-18°C', tint: '#ecfeff' };
    }
    if (storage.includes('Dry')) {
      return { cls: 'st-dry', icon: 'box', short: 'Pantry', tint: '#fafaf9' };
    }
    return { cls: 'st-ambient', icon: 'sun', short: 'Fresh', tint: '#fffbeb' };
  }

  // Mandatory Light-Dismiss Fallback for <dialog closedby="any">
  function setupDialogFallbacks() {
    document.querySelectorAll('dialog').forEach((dialog) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (isDialogContent) return;
          dialog.close();
        });
      }
    });

    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-dialog]');
      if (closeBtn) {
        const dlg = document.getElementById(closeBtn.dataset.closeDialog);
        if (dlg) dlg.close();
      }
    });
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'fd-toast';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function saveCart() {
    localStorage.setItem('dekmit_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function toggleFavorite(code) {
    const idx = state.favorites.indexOf(code);
    const p = products.find((item) => item.code === code);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
      showToast(`Removed ${p ? p.name : code} from My Lists`);
    } else {
      state.favorites.push(code);
      showToast(`Saved ${p ? p.emoji + ' ' + p.name : code} to My Lists`);
    }
    localStorage.setItem('dekmit_favs', JSON.stringify(state.favorites));
    favCountLabel.textContent = state.favorites.length;
    renderAll();
  }

  // Render a single FreshDirect Product Card
  function renderFDCard(p, opts = {}) {
    const qty = state.cart[p.code] || 0;
    const sellPrice = getProductPrice(p);
    const st = getStorageInfo(p.storage);
    const isNew = p.status === 'NEW';
    const isFav = state.favorites.includes(p.code);
    const stockSt = p.stockStatus || 'In Stock';
    const isOut = stockSt === 'Out of Stock';

    let imgAttrs = 'loading="lazy"';
    if (opts.isCarouselSlide) {
      imgAttrs = opts.index >= 4 ? 'fetchpriority="low" loading="lazy"' : '';
    }

    const fallbackIcon = `<span class="fd-card__flat-fallback">${window.getFlatIcon ? window.getFlatIcon('shopping-bag', 'fd-icon--xl') : ''}</span>`;
    const visualMedia = p.image
      ? `<img src="${p.image}" alt="${p.name}" class="fd-card__img" width="220" height="146" ${imgAttrs} onerror="this.outerHTML='${fallbackIcon.replace(/'/g, "\\'")}'">`
      : fallbackIcon;

    const minusIcon = window.getFlatIcon ? window.getFlatIcon('minus', 'fd-icon--sm') : '−';
    const plusIcon = window.getFlatIcon ? window.getFlatIcon('plus', 'fd-icon--sm') : '+';
    const sproutIcon = window.getFlatIcon ? window.getFlatIcon('sprout', 'fd-icon--sm') : '';
    const sparklesIcon = window.getFlatIcon ? window.getFlatIcon('sparkles', 'fd-icon--sm') : '';
    const sunIcon = window.getFlatIcon ? window.getFlatIcon('sun', 'fd-icon--sm') : '';
    const favIcon = isFav
      ? (window.getFlatIcon ? window.getFlatIcon('heart-fill', 'fd-icon--heart-active') : '♥')
      : (window.getFlatIcon ? window.getFlatIcon('heart', 'fd-icon--heart') : '♡');
    const stIconHtml = window.getFlatIcon ? window.getFlatIcon(st.icon, 'fd-icon--sm') : '';

    let actionHtml = '';
    if (isOut) {
      actionHtml = `<span class="fd-tag fd-tag--out">Out of Stock</span>`;
    } else if (qty > 0) {
      actionHtml = `<div class="fd-stepper" aria-label="Quantity in bag">
        <button type="button" class="fd-stepper__btn" data-qty-action="dec" data-code="${p.code}" aria-label="Decrease">${minusIcon}</button>
        <span class="fd-stepper__val">${qty}</span>
        <button type="button" class="fd-stepper__btn" data-qty-action="inc" data-code="${p.code}" aria-label="Increase">${plusIcon}</button>
      </div>`;
    } else {
      actionHtml = `<button type="button" class="fd-add-btn" data-qty-action="inc" data-code="${p.code}">${plusIcon} Add</button>`;
    }

    const basePrice = getProductBasePrice(p);
    const isWed = isWednesdayDiscountActive();
    const priceDisplayHtml = isWed
      ? `<div class="fd-card__price-box">
          <div class="fd-card__price-main">
            <span class="fd-card__price-orig">${formatUGX(basePrice)}</span>
            <span class="fd-card__price fd-card__price--sale">${formatUGX(sellPrice)}</span>
            <span class="fd-card__unit-sub">/${p.uom}</span>
          </div>
          <span class="fd-tag-wed-sale">50% WED</span>
        </div>`
      : `<div>
          <span class="fd-card__price">${formatUGX(sellPrice)}</span>
          <span class="fd-card__unit-sub">/${p.uom}</span>
        </div>`;

    return `
      <article class="fd-card ${isNew ? 'fd-card--new' : ''} ${isOut ? 'fd-card--out' : ''}" data-product-code="${p.code}">
        <div>
          <div class="fd-card__top-bar">
            <div class="fd-card__tag-group">
              ${isNew ? `<span class="fd-tag fd-tag--new">${sparklesIcon} NEW</span>` : ''}
              ${stockSt === 'Seasonal' ? `<span class="fd-tag fd-tag--seasonal">${sunIcon} Seasonal</span>` : ''}
            </div>
            <button type="button" class="fd-card__fav ${isFav ? 'is-fav' : ''}" data-fav-code="${p.code}" title="Save to My Lists" aria-label="Save ${p.name} to My Lists">
              ${favIcon}
            </button>
          </div>

          <div class="fd-card__visual" style="--stage-tint: ${st.tint};" data-detail-code="${p.code}">
            <span class="fd-card__storage-pill ${st.cls}">${stIconHtml} ${st.short}</span>
            ${visualMedia}
            <span class="fd-card__freshness">${sproutIcon} ${p.shelfLife === 'Long' ? 'Long-life' : p.shelfLife + 'd fresh'}</span>
          </div>

          <div class="fd-card__body">
            <div class="fd-card__dept">${p.section}</div>
            <h3 class="fd-card__title" data-detail-code="${p.code}">${p.name}</h3>
            <p class="fd-card__uom">${p.variant ? `${p.variant} — ` : ''}Sold per ${p.uom}</p>
          </div>
        </div>

        <div class="fd-card__footer">
          ${priceDisplayHtml}
          ${actionHtml}
        </div>
      </article>
    `;
  }

  // Render FreshDirect Storefront Home Carousels
  function renderHomeCarousels() {
    const carouselConfigs = [
      {
        title: 'Fresh at Dek Mit: 55 New Curated Additions',
        sub: 'In-house cold-pressed juices, Malakwang, Odii simsim paste, dressed local chicken & more',
        deptJump: 'new_arrivals',
        items: products.filter((p) => p.status === 'NEW').slice(0, 14)
      },
      {
        title: 'Peak-Season Ugandan Greens & Matooke',
        sub: 'Humidified leafy vegetables and farm-direct cooking bananas & tubers',
        deptJump: 'vegetables',
        items: products.filter((p) => ['2.1', '2.7'].includes(p.sectionCode)).slice(0, 14)
      },
      {
        title: 'Butcher’s Block & Lake Victoria Catch',
        sub: '2–5°C prime beef cuts, goat meat, dressed poultry, fresh Tilapia & Nile perch',
        deptJump: 'butchery',
        items: products.filter((p) => ['4.1', '4.2', '4.4', '5.1'].includes(p.sectionCode)).slice(0, 14)
      },
      {
        title: 'Northern Heritage, Pantry & Seasonal Delicacies',
        sub: 'Simsim Odii, Moo Yao shea butter oil, Nambale beans, local honey & Nsenene',
        deptJump: 'pantry_dry',
        items: products.filter((p) => ['5.5', '5.6', '5.8', '5.9'].includes(p.sectionCode)).slice(0, 14)
      }
    ];

    homeCarouselsContainer.innerHTML = carouselConfigs
      .map(
        (cfg) => `
        <section class="fd-carousel-block">
          <div class="fd-section-head">
            <div>
              <h2 class="fd-section-head__title">${cfg.title}</h2>
              <p class="fd-section-head__sub">${cfg.sub}</p>
            </div>
            <button type="button" class="fd-section-head__link" data-go-dept="${cfg.deptJump}">
              Shop All &rarr;
            </button>
          </div>
          <div class="fd-carousel-track">
            ${cfg.items.map((item, idx) => renderFDCard(item, { isCarouselSlide: true, index: idx })).join('')}
          </div>
        </section>
      `
      )
      .join('');
  }

  // Render Left Sidebar Aisle Tree
  function renderSidebarAisles() {
    const codes = Object.keys(sectionsMeta).filter((code) => {
      const dummyProduct = products.find((p) => p.sectionCode === code);
      if (!dummyProduct) return false;
      if (['all', 'home', 'new_arrivals', 'favorites'].includes(state.dept)) return true;
      return matchesDept(dummyProduct, state.dept);
    });

    let html = `
      <button type="button" class="fd-aisle-btn ${state.sectionCode === 'all' ? 'is-active' : ''}" data-section-btn="all">
        <span>All Aisles in View</span>
        <span>(${products.filter((p) => matchesDept(p, state.dept)).length})</span>
      </button>
    `;

    codes.forEach((code) => {
      const meta = sectionsMeta[code];
      const count = products.filter((p) => p.sectionCode === code && matchesDept(p, state.dept)).length;
      const activeCls = state.sectionCode === code ? 'is-active' : '';
      html += `
        <button type="button" class="fd-aisle-btn ${activeCls}" data-section-btn="${code}">
          <span>${meta.section}</span>
          <span>${count}</span>
        </button>
      `;
    });

    sidebarSectionList.innerHTML = html;
  }

  // Filter & Sort Products for the Main Catalogue Section
  function getFilteredProducts() {
    const q = state.search.trim().toLowerCase();

    const list = products.filter((p) => {
      if (!matchesDept(p, state.dept)) return false;
      if (state.sectionCode !== 'all' && p.sectionCode !== state.sectionCode) return false;
      if (state.status !== 'all' && p.status !== state.status) return false;
      if (state.storage !== 'all' && p.storage !== state.storage) return false;
      if (q) {
        const hay = `${p.name} ${p.variant} ${p.code} ${p.section} ${p.notes} ${p.uom}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (state.sort === 'price-asc') return getProductPrice(a) - getProductPrice(b);
      if (state.sort === 'price-desc') return getProductPrice(b) - getProductPrice(a);
      if (state.sort === 'name-asc') return a.name.localeCompare(b.name);
      if (state.sort === 'shelf-asc') {
        const sa = parseInt(a.shelfLife, 10) || 999;
        const sb = parseInt(b.shelfLife, 10) || 999;
        return sa - sb;
      }
      return a.order - b.order;
    });

    return list;
  }

  // Render Aisle Catalogue
  function renderCatalogue() {
    const showHome =
      state.dept === 'home' &&
      state.sectionCode === 'all' &&
      state.status === 'all' &&
      state.storage === 'all' &&
      state.search.trim() === '';

    storefrontHomeView.style.display = showHome ? 'block' : 'none';

    const deptTitles = {
      home: 'Complete Store Catalogue (247 Items in Flow Order)',
      all: 'All 27 Store Aisles (247 Items)',
      fruits: 'Fresh Fruits, Berries & Cold-Pressed Juices',
      vegetables: 'Leafy Greens, Vegetables, Herbs & Matooke',
      butchery: '2–5°C Chilled Butchery & Dressed Poultry',
      seafood_dairy: 'Lake Fish, Milk, Cheese & Farm Eggs',
      pantry_dry: 'Grains, Beans, Simsim Odii, Oils & Spices',
      new_arrivals: '55 New Curated Additions to Dek Mit',
      favorites: 'My Saved Reorder Lists'
    };

    const secTitle =
      state.sectionCode !== 'all' && sectionsMeta[state.sectionCode]
        ? sectionsMeta[state.sectionCode].section
        : deptTitles[state.dept] || 'Store Catalogue';

    aisleHeading.textContent = state.search.trim()
      ? `Search Results for “${state.search.trim()}”`
      : secTitle;

    aisleBreadcrumb.textContent =
      state.sectionCode !== 'all'
        ? `Dek Mit Direct › ${sectionsMeta[state.sectionCode]?.zone} › ${sectionsMeta[state.sectionCode]?.section}`
        : `Dek Mit Direct › ${deptTitles[state.dept] || 'All Departments'}`;

    const filtered = getFilteredProducts();

    const isFiltered =
      state.dept !== 'home' ||
      state.sectionCode !== 'all' ||
      state.status !== 'all' ||
      state.storage !== 'all' ||
      state.search.trim() !== '';

    resetFiltersBtn.hidden = !isFiltered;
    const modeDesc =
      state.pricingMode === 'smart'
        ? '(Smart Perishability & Wastage Formula)'
        : state.pricingMode === 'custom' && state.marginPercent > 0
        ? `(+${state.marginPercent}% retail markup)`
        : '(at survey market prices)';

    resultsSummary.innerHTML = `Showing <strong>${filtered.length}</strong> of ${products.length} items ${modeDesc}`;

    if (filtered.length === 0) {
      catalogueContainer.innerHTML = `
        <div style="background:#fff;border:1px solid var(--fd-border);border-radius:14px;padding:3rem;text-align:center;">
          <div style="color:var(--fd-green-primary);margin-bottom:0.5rem;">${window.getFlatIcon ? window.getFlatIcon('vegetable', 'fd-icon--xl') : ''}</div>
          <h3>No matching groceries found</h3>
          <p style="color:var(--fd-text-muted);font-size:0.86rem;margin-top:0.3rem;">Try clearing your search filter or switching departments.</p>
        </div>
      `;
      return;
    }

    const minusIcon = window.getFlatIcon ? window.getFlatIcon('minus', 'fd-icon--sm') : '−';
    const plusIcon = window.getFlatIcon ? window.getFlatIcon('plus', 'fd-icon--sm') : '+';

    if (state.viewMode === 'table') {
      const rows = filtered
        .map((p) => {
          const qty = state.cart[p.code] || 0;
          const sellPrice = getProductPrice(p);
          const basePrice = getProductBasePrice(p);
          const isWed = isWednesdayDiscountActive();
          const isNew = p.status === 'NEW';
          const isOut = p.stockStatus === 'Out of Stock';
          const thumbHtml = p.image
            ? `<img src="${p.image}" alt="${p.name}" class="fd-table-thumb" loading="lazy" width="40" height="40">`
            : `<span class="fd-icon--sm" style="display:inline-block;vertical-align:middle;margin-right:4px;">${window.getFlatIcon ? window.getFlatIcon('shopping-bag', 'fd-icon--sm') : ''}</span>`;
          return `
            <tr class="${isNew ? 'row--new' : ''}">
              <td><code>${p.code}</code></td>
              <td>
                <strong style="cursor:pointer;" data-detail-code="${p.code}">${thumbHtml}${p.name}</strong>
                ${isNew ? '<span class="fd-tag fd-tag--new" style="margin-left:4px;">NEW</span>' : ''}
              </td>
              <td>${p.variant || '—'}</td>
              <td>${p.uom}</td>
              <td>${formatUGX(p.sourcingCost || p.price * 0.8)}</td>
              <td>${p.wastagePct || 5}% / ${p.grossMarginPct || 20}%</td>
              <td>
                ${
                  isWed
                    ? `<span class="fd-card__price-orig">${formatUGX(basePrice)}</span><br><strong style="color:var(--fd-orange-cta);">${formatUGX(sellPrice)}</strong> <span class="fd-tag-wed-sale">50% OFF</span>`
                    : `<strong>${formatUGX(sellPrice)}</strong>`
                }
              </td>
              <td>
                ${
                  isOut
                    ? '<span class="fd-tag fd-tag--out">Out of Stock</span>'
                    : qty > 0
                    ? `<div class="fd-stepper">
                        <button type="button" class="fd-stepper__btn" data-qty-action="dec" data-code="${p.code}">${minusIcon}</button>
                        <span class="fd-stepper__val">${qty}</span>
                        <button type="button" class="fd-stepper__btn" data-qty-action="inc" data-code="${p.code}">${plusIcon}</button>
                      </div>`
                    : `<button type="button" class="fd-add-btn" data-qty-action="inc" data-code="${p.code}">${plusIcon} Add</button>`
                }
              </td>
            </tr>
          `;
        })
        .join('');

      catalogueContainer.innerHTML = `
        <div class="fd-table-wrap">
          <table class="fd-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item</th>
                <th>Variant</th>
                <th>UOM</th>
                <th>Sourcing Cost</th>
                <th>Wastage / Margin</th>
                <th>Active Price (UGX)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
      return;
    }

    if (state.sort === 'flow') {
      const groups = new Map();
      filtered.forEach((p) => {
        if (!groups.has(p.sectionCode)) groups.set(p.sectionCode, []);
        groups.get(p.sectionCode).push(p);
      });

      let html = '';
      let secIdx = 0;
      groups.forEach((items, secCode) => {
        const meta = sectionsMeta[secCode] || { section: 'Groceries', zone: 'Store' };
        const secIcon = window.getSectionIcon ? window.getSectionIcon(secCode) : '';
        const belowFoldClass = secIdx >= 2 ? 'is-below-fold' : '';
        secIdx++;

        html += `
          <section class="fd-shelf-section ${belowFoldClass}" aria-label="${meta.section}">
            <header class="fd-shelf-header">
              <h3 class="fd-shelf-header__title">
                <span>${meta.section}</span>
              </h3>
              <span style="font-size:0.78rem;color:var(--fd-text-muted);">${items.length} item${items.length === 1 ? '' : 's'}</span>
            </header>
            <div class="fd-product-grid">
              ${items.map((item) => renderFDCard(item)).join('')}
            </div>
          </section>
        `;
      });
      catalogueContainer.innerHTML = html;
    } else {
      catalogueContainer.innerHTML = `
        <div class="fd-product-grid">
          ${filtered.map((item) => renderFDCard(item)).join('')}
        </div>
      `;
    }
  }

  // Update Shopping Bag Drawer & Free Eco Bag Meter
  function updateCartUI() {
    const entries = Object.entries(state.cart).filter(([, qty]) => qty > 0);
    let totalUnits = 0;
    let subtotal = 0;

    entries.forEach(([code, qty]) => {
      const p = products.find((item) => item.code === code);
      if (p) {
        totalUnits += qty;
        subtotal += getProductPrice(p) * qty;
      }
    });

    headerCartCount.textContent = totalUnits;
    headerCartTotal.textContent = formatUGX(subtotal);
    cartDialogSubtitle.textContent = `${totalUnits} item${totalUnits === 1 ? '' : 's'} | ${state.timeSlot}`;
    cartSlotSummary.textContent = state.location.split('—')[0].trim();

    const threshold = 50000;
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    freeBagProgressFill.style.width = pct + '%';
    const giftIcon = window.getFlatIcon ? window.getFlatIcon('gift', 'fd-icon--sm') : '';
    if (subtotal >= threshold) {
      freeBagProgressText.innerHTML = `${giftIcon} <strong>Unlocked!</strong> Your order includes a <strong>FREE Reusable Dek Mit Shopping Bag!</strong>`;
    } else {
      const diff = threshold - subtotal;
      freeBagProgressText.innerHTML = `Add <strong>${formatUGX(diff)}</strong> more to unlock a <strong>FREE Reusable Dek Mit Bag!</strong>`;
    }

    if (ecoBagUpsell) {
      ecoBagUpsell.style.display = state.cart['3.1-04'] > 0 || subtotal >= threshold ? 'none' : 'flex';
    }

    const selectedOpt = deliveryZoneSelect.options[deliveryZoneSelect.selectedIndex];
    const deliveryFee = entries.length > 0 ? Number(selectedOpt?.dataset.fee || 0) : 0;

    cartSubtotal.textContent = formatUGX(subtotal);
    cartDeliveryFee.textContent = deliveryFee === 0 ? 'FREE (UGX 0)' : formatUGX(deliveryFee);
    cartGrandTotal.textContent = formatUGX(subtotal + deliveryFee);

    if (entries.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align:center;padding:2.5rem 1rem;color:var(--fd-text-muted);">
          <div style="color:var(--fd-green-primary);margin-bottom:0.4rem;">${window.getFlatIcon ? window.getFlatIcon('shopping-bag', 'fd-icon--xl') : ''}</div>
          <p><strong>Your Dek Mit Direct bag is empty</strong></p>
          <p style="font-size:0.8rem;margin-top:0.25rem;">Add fresh Ugandan fruits, misted leafy greens, prime meats, or pantry staples.</p>
        </div>
      `;
      return;
    }

    const minusIcon = window.getFlatIcon ? window.getFlatIcon('minus', 'fd-icon--sm') : '−';
    const plusIcon = window.getFlatIcon ? window.getFlatIcon('plus', 'fd-icon--sm') : '+';

    cartItemsContainer.innerHTML = entries
      .map(([code, qty]) => {
        const p = products.find((item) => item.code === code);
        if (!p) return '';
        const unitPrice = getProductPrice(p);
        const thumb = p.image
          ? `<img src="${p.image}" alt="${p.name}" class="fd-cart-thumb" width="46" height="46" fetchpriority="low">`
          : `<span class="fd-cart-thumb" style="display:inline-flex;align-items:center;justify-content:center;background:var(--fd-bg-page);border-radius:6px;width:46px;height:46px;color:var(--fd-green-primary);">${window.getFlatIcon ? window.getFlatIcon('shopping-bag', 'fd-icon--lg') : ''}</span>`;
        return `
          <div class="fd-cart-item">
            <div style="display:flex;align-items:center;gap:0.65rem;flex:1;">
              ${thumb}
              <div>
                <div style="font-size:0.88rem;font-weight:700;">${p.name} ${p.variant ? `<span style="color:var(--fd-text-muted);font-weight:500;">(${p.variant})</span>` : ''}</div>
                <div style="font-size:0.74rem;color:var(--fd-text-muted);">${formatUGX(unitPrice)} / ${p.uom} — <strong>${formatUGX(unitPrice * qty)}</strong></div>
              </div>
            </div>
            <div class="fd-stepper">
              <button type="button" class="fd-stepper__btn" data-qty-action="dec" data-code="${p.code}">${minusIcon}</button>
              <span class="fd-stepper__val">${qty}</span>
              <button type="button" class="fd-stepper__btn" data-qty-action="inc" data-code="${p.code}">${plusIcon}</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Open Product Detail Modal
  function openProductDetail(code) {
    const p = products.find((item) => item.code === code);
    if (!p) return;
    const sellPrice = getProductPrice(p);
    const qty = state.cart[p.code] || 0;
    const st = getStorageInfo(p.storage);

    const bannerImg = p.image
      ? `<img src="${p.image}" alt="${p.name}" class="fd-detail-banner" fetchpriority="low">`
      : '';

    const crossIcon = window.getFlatIcon ? window.getFlatIcon('cross', 'fd-icon--sm') : '✕';
    const sparklesIcon = window.getFlatIcon ? window.getFlatIcon('sparkles', 'fd-icon--sm') : '';
    const stIcon = window.getFlatIcon ? window.getFlatIcon(st.icon, 'fd-icon--sm') : '';
    const sproutIcon = window.getFlatIcon ? window.getFlatIcon('sprout', 'fd-icon--sm') : '';
    const plusIcon = window.getFlatIcon ? window.getFlatIcon('plus', 'fd-icon--sm') : '+';

    productDetailContent.innerHTML = `
      <header class="fd-modal__header">
        <div>
          <span class="fd-tag fd-tag--code">Item ${p.code}</span>
          <h2 id="detailDialogTitle" class="fd-modal__title" style="margin-top:0.3rem;">${p.name}</h2>
        </div>
        <button type="button" class="fd-modal__close" data-close-dialog="productDetailDialog" aria-label="Close">${crossIcon}</button>
      </header>
      <div class="fd-modal__body">
        ${bannerImg}
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.9rem;">
          <span class="fd-tag ${p.status === 'NEW' ? 'fd-tag--new' : 'fd-tag--code'}">
            ${p.status === 'NEW' ? `${sparklesIcon} NEW Suggested Addition` : 'Survey Catalogue Item'}
          </span>
          <span class="fd-tag fd-tag--code">${p.section}</span>
          <span class="fd-tag ${st.cls}">${stIcon} ${p.storage}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
          <div style="background:var(--fd-bg-page);padding:0.75rem;border-radius:10px;border:1px solid var(--fd-border);">
            <span style="font-size:0.72rem;color:var(--fd-text-muted);display:block;">Active Selling Price / ${p.uom}</span>
            <strong style="font-size:1.15rem;color:var(--fd-green-primary);">${formatUGX(sellPrice)}</strong>
          </div>
          <div style="background:var(--fd-bg-page);padding:0.75rem;border-radius:10px;border:1px solid var(--fd-border);">
            <span style="font-size:0.72rem;color:var(--fd-text-muted);display:block;">Survey Market / Smart Price</span>
            <strong style="font-size:0.92rem;">${formatUGX(p.price)} / ${formatUGX(p.proposedPrice || p.price)}</strong>
          </div>
          <div style="background:var(--fd-bg-page);padding:0.75rem;border-radius:10px;border:1px solid var(--fd-border);">
            <span style="font-size:0.72rem;color:var(--fd-text-muted);display:block;">Freshness &amp; Wastage Tier</span>
            <strong style="font-size:0.92rem;color:var(--fd-green-dark);">${sproutIcon} ${p.shelfLife === 'Long' ? 'Long-life' : p.shelfLife + 'd'} (${p.wastagePct || 5}% wastage buffer)</strong>
          </div>
          <div style="background:var(--fd-bg-page);padding:0.75rem;border-radius:10px;border:1px solid var(--fd-border);">
            <span style="font-size:0.72rem;color:var(--fd-text-muted);display:block;">Cold-Chain / Display</span>
            <strong style="font-size:0.92rem;">${p.storage}</strong>
          </div>
        </div>

        ${
          p.notes
            ? `<div style="background:#fffbeb;border:1px solid #fde68a;padding:0.75rem 0.9rem;border-radius:10px;font-size:0.82rem;color:#92400e;">
                <strong>Catalogue / Quality Note:</strong> ${p.notes}
              </div>`
            : ''
        }
      </div>
      <footer class="fd-modal__footer" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:0.76rem;color:var(--fd-text-muted);">In your bag:</span>
          <strong>${qty} ${p.uom}(s)</strong>
        </div>
        <button type="button" class="fd-btn fd-btn--green" data-qty-action="inc" data-code="${p.code}" style="display:inline-flex;align-items:center;gap:0.4rem;">
          ${plusIcon} Add to Bag (${formatUGX(sellPrice)})
        </button>
      </footer>
    `;

    productDetailDialog.showModal();
  }

  // Render Quick Price & Stock Editor Table inside the Live Pricing Modal
  function renderQuickPriceTable() {
    if (!quickPriceTableBody) return;
    const q = (quickPriceSearch?.value || '').trim().toLowerCase();
    const subset = products
      .filter((p) => !q || `${p.code} ${p.name} ${p.variant} ${p.section}`.toLowerCase().includes(q))
      .slice(0, 60);

    quickPriceTableBody.innerHTML = subset
      .map((p) => {
        const activeSell = getProductPrice(p);
        const stStatus = p.stockStatus || 'In Stock';
        return `
          <tr>
            <td><code>${p.code}</code></td>
            <td><strong>${p.name}</strong> ${p.variant ? `<small style="color:var(--fd-text-muted);">(${p.variant})</small>` : ''}</td>
            <td>${p.uom}</td>
            <td>${p.shelfLife === 'Long' ? 'Long' : p.shelfLife + 'd'}</td>
            <td>
              <input
                type="number"
                class="fd-price-input"
                step="100"
                min="100"
                value="${p.price}"
                data-edit-price-code="${p.code}"
                aria-label="Edit market price for ${p.name}"
              >
            </td>
            <td><strong style="color:var(--fd-green-primary);">${formatUGX(activeSell)}</strong></td>
            <td>
              <select class="fd-stock-select" data-edit-stock-code="${p.code}" aria-label="Stock status for ${p.name}">
                <option value="In Stock" ${stStatus === 'In Stock' ? 'selected' : ''}>In Stock</option>
                <option value="Seasonal" ${stStatus === 'Seasonal' ? 'selected' : ''}>Seasonal</option>
                <option value="Out of Stock" ${stStatus === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
              </select>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Parse CSV Text (from Google Sheets URL or uploaded .csv file) and update prices
  function parseCSVTextAndSync(csvText, sourceLabel) {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return 0;

    // Simple RFC4180 CSV line splitter
    function splitCsvRow(row) {
      const res = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          res.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      res.push(cur.trim());
      return res;
    }

    // Find header row containing "Item code"
    let headerIdx = 0;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].toLowerCase().includes('item code')) {
        headerIdx = i;
        break;
      }
    }

    const headers = splitCsvRow(lines[headerIdx]).map((h) => h.toLowerCase());
    const codeCol = headers.findIndex((h) => h.includes('item code'));
    const marketCol = headers.findIndex((h) => h.includes('market price'));
    const proposedCol = headers.findIndex((h) => h.includes('proposed selling'));
    const stockCol = headers.findIndex((h) => h.includes('stock status'));

    if (codeCol === -1) return 0;

    let updatedCount = 0;
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = splitCsvRow(lines[i]);
      const code = cols[codeCol];
      if (!code) continue;
      const prod = products.find((p) => p.code === code);
      if (!prod) continue;

      const rawPrice =
        proposedCol !== -1 && Number(cols[proposedCol]?.replace(/[^0-9]/g, '')) > 0
          ? Number(cols[proposedCol].replace(/[^0-9]/g, ''))
          : marketCol !== -1
          ? Number(cols[marketCol]?.replace(/[^0-9]/g, ''))
          : 0;

      if (rawPrice > 0) {
        prod.price = rawPrice;
        recalcProductFinancials(prod);
        state.priceOverrides[code] = state.priceOverrides[code] || {};
        state.priceOverrides[code].price = rawPrice;
        updatedCount++;
      }

      if (stockCol !== -1 && cols[stockCol]) {
        prod.stockStatus = cols[stockCol];
        state.priceOverrides[code] = state.priceOverrides[code] || {};
        state.priceOverrides[code].stockStatus = cols[stockCol];
      }
    }

    localStorage.setItem('dekmit_price_overrides', JSON.stringify(state.priceOverrides));
    updateHeaderPricingLabel();
    renderAll();
    renderQuickPriceTable();
    if (syncStatusMsg) {
      syncStatusMsg.hidden = false;
      const checkIco = window.getFlatIcon ? window.getFlatIcon('check', 'fd-icon--sm') : '';
      syncStatusMsg.innerHTML = `${checkIco} Synced ${updatedCount} product prices from ${sourceLabel} (${new Date().toLocaleTimeString()})`;
    }
    showToast(`Synced ${updatedCount} prices from ${sourceLabel}`);
    return updatedCount;
  }

  // ==========================================================================
  // Dek Mit Community Programs & Promotions Logic
  // ==========================================================================

  const programConfigs = {
    school: {
      title: 'School-Going Healthy Snack Delivery',
      subtitle: 'Hygienic fresh fruit cups, cold-pressed juices & wholesome snacks delivered directly to schools (within 5km)',
      summary: `${window.getFlatIcon ? window.getFlatIcon('apple', 'fd-icon--sm') : ''} <strong>Program Highlights:</strong> Pre-ordered custom snack packages replacing crisps and manufactured juices with cold-pressed natural juice, freshly sliced seasonal fruit cups, and roasted simsim snacks. Delivered chilled every morning before break time to schools within 5km of Kampala Central/Naguru.`,
      locationLabel: 'School Name, Campus & Child Grade',
      locationPlaceholder: 'e.g. Kampala Parents School (Naguru) – Grade 4',
      locationHint: 'Delivered directly to school administration every morning within a 5km radius.',
      notesLabel: 'Child Allergies, Preferences & Weekly Schedule',
      notesPlaceholder: 'e.g. Loves mango & passion juice, allergic to peanuts. Deliver Monday, Wednesday, Friday.'
    },
    nutritionist: {
      title: 'Personalized Nutritionist Meal Plan & Delivery',
      subtitle: '1-on-1 clinical nutrition consultations with scheduled doorstep deliveries for registered members',
      summary: `${window.getFlatIcon ? window.getFlatIcon('stethoscope', 'fd-icon--sm') : ''} <strong>Program Highlights:</strong> Certified clinical nutritionist designs a personalized 7 or 14-day rotational dietary blueprint for your family (diabetes, hypertension, prenatal care, fitness, child growth). Pre-portioned fresh ingredients delivered to your doorstep on a recurring schedule with member savings.`,
      locationLabel: 'Home Delivery Address & Area in Greater Kampala',
      locationPlaceholder: 'e.g. Plot 14, Prince Charles Drive, Kololo, Kampala',
      locationHint: 'Frequent recurring deliveries to registered member homes across Greater Kampala.',
      notesLabel: 'Health Targets, Dietary Restrictions & Family Size',
      notesPlaceholder: 'e.g. Low sodium for hypertension, family of 4. Need bi-weekly leafy greens (Nakati, Sukuma), tilapia and beans.'
    },
    chef: {
      title: 'Celebrity Chef Cooking Demo & Community Kitchen',
      subtitle: 'Live culinary demonstrations feeding vulnerable community members on the last Saturday of every month',
      summary: `${window.getFlatIcon ? window.getFlatIcon('chef', 'fd-icon--sm') : ''} <strong>Program Highlights:</strong> Renowned guest celebrity chefs cook live indigenous Ugandan dishes (Malakwang, steaming Matooke, sesame greens). 100% of freshly prepared meals are served freely to disadvantaged community members. Free public RSVP, volunteer slots, and ingredient sponsorship available.`,
      locationLabel: 'Your Residential Area / Organization',
      locationPlaceholder: 'e.g. Resident in Nakasero or volunteer coordinator with local NGO',
      locationHint: 'Held on the last Saturday of every month at 10:30 AM at Dek Mit Hub.',
      notesLabel: 'Participation Details (RSVP / Volunteer / Donate)',
      notesPlaceholder: 'e.g. RSVP for 2 attendees / Want to volunteer in meal serving / Want to sponsor 50 community meals.'
    },
    wednesday: {
      title: 'Wednesday 50% Off Market Day Reminders & Orders',
      subtitle: 'Receive early WhatsApp alerts and reserve peak-ripe market food at 50% discount',
      summary: `${window.getFlatIcon ? window.getFlatIcon('clock', 'fd-icon--sm') : ''} <strong>Program Highlights:</strong> Every Wednesday 8:00 AM – 1:00 PM is a half-day market day. Food and farm-fresh produce are sold at 50% discount to cut waste and support families. Subscribe for early 7:30 AM item alerts and pre-reserve high-demand bundles.`,
      locationLabel: 'Preferred Delivery Area or Pickup Location',
      locationPlaceholder: 'e.g. Delivery to Ntinda or in-person pickup at Dek Mit Hub',
      locationHint: 'Wednesday 50% discount runs from 8:00 AM to 1:00 PM every Wednesday.',
      notesLabel: 'Target Produce / Bulk Items for Wednesday',
      notesPlaceholder: 'e.g. Bulk tomatoes, ripe mangoes for batch juicing, beef cuts, matooke for the week.'
    }
  };

  function updateProgramModalFields(progKey) {
    const cfg = programConfigs[progKey] || programConfigs.school;
    if (programModalTitle) programModalTitle.textContent = cfg.title;
    if (programModalSubtitle) programModalSubtitle.textContent = cfg.subtitle;
    if (progLocationLabel) progLocationLabel.innerHTML = `${cfg.locationLabel} <span class="fd-req">*</span>`;
    if (progLocation) progLocation.placeholder = cfg.locationPlaceholder;
    if (progLocationHint) progLocationHint.textContent = cfg.locationHint;
    if (progNotesLabel) progNotesLabel.textContent = cfg.notesLabel;
    if (progNotes) progNotes.placeholder = cfg.notesPlaceholder;
    if (progSummaryBox) progSummaryBox.innerHTML = cfg.summary;
  }

  function openProgramModal(progKey = 'school') {
    if (!programModal) return;
    if (programSelect) programSelect.value = progKey;
    updateProgramModalFields(progKey);
    if (programForm) programForm.hidden = false;
    if (progSuccessBox) progSuccessBox.hidden = true;
    programModal.showModal();
  }

  function scrollToPromotions() {
    if (state.dept !== 'home') {
      state.dept = 'home';
      state.sectionCode = 'all';
      state.search = '';
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.hidden = true;
      if (deptNavBar) {
        deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'promotions'));
      }
      renderAll();
    }
    if (promotionsSection) {
      promotionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      promotionsSection.classList.add('is-highlighted');
      setTimeout(() => promotionsSection.classList.remove('is-highlighted'), 2000);
    }
  }

  function updateWednesdayUI() {
    if (!wednesdayLiveStatus || !wednesdayToggleText) return;
    const isWed = isWednesdayHalfDay();
    const isActive = isWednesdayDiscountActive();

    if (isWed) {
      wednesdayLiveStatus.textContent = 'ACTIVE TODAY (8 AM – 1 PM)';
      wednesdayLiveStatus.className = 'fd-live-pill is-active';
    } else if (state.wednesdayOverride) {
      wednesdayLiveStatus.textContent = '50% Preview Active';
      wednesdayLiveStatus.className = 'fd-live-pill is-active';
    } else {
      wednesdayLiveStatus.textContent = 'Next: Wednesday 8 AM';
      wednesdayLiveStatus.className = 'fd-live-pill';
    }

    if (isActive) {
      wednesdayToggleText.textContent = '50% Active (Click to Revert)';
    } else {
      wednesdayToggleText.textContent = 'Preview 50% Market Prices';
    }
  }

  function renderAll() {
    updateHeaderPricingLabel();
    updateWednesdayUI();
    renderHomeCarousels();
    renderSidebarAisles();
    renderCatalogue();
    updateCartUI();
  }

  function bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      clearSearchBtn.hidden = !state.search;
      renderCatalogue();
    });

    clearSearchBtn.addEventListener('click', () => {
      state.search = '';
      searchInput.value = '';
      clearSearchBtn.hidden = true;
      renderCatalogue();
    });

    document.getElementById('brandHomeLink').addEventListener('click', (e) => {
      e.preventDefault();
      state.dept = 'home';
      state.sectionCode = 'all';
      state.search = '';
      searchInput.value = '';
      clearSearchBtn.hidden = true;
      deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'home'));
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    deptNavBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dept]');
      if (!btn) return;
      const dept = btn.dataset.dept;
      if (dept === 'promotions') {
        scrollToPromotions();
        return;
      }
      state.dept = dept;
      state.sectionCode = 'all';
      favoritesFilterBtn.classList.remove('is-active');
      deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b === btn));
      renderAll();
      if (state.dept !== 'home') {
        aisleCatalogueSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    favoritesFilterBtn.addEventListener('click', () => {
      state.dept = state.dept === 'favorites' ? 'home' : 'favorites';
      state.sectionCode = 'all';
      favoritesFilterBtn.classList.toggle('is-active', state.dept === 'favorites');
      deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === state.dept));
      renderAll();
      if (state.dept === 'favorites') {
        aisleCatalogueSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    sidebarSectionList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-section-btn]');
      if (!btn) return;
      state.sectionCode = btn.dataset.sectionBtn;
      if (state.dept === 'home' && state.sectionCode !== 'all') {
        state.dept = 'all';
        deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'all'));
      }
      renderSidebarAisles();
      renderCatalogue();
    });

    document.querySelectorAll('input[name="statusFilter"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.status = e.target.value;
        renderCatalogue();
      });
    });

    document.querySelectorAll('input[name="storageFilter"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.storage = e.target.value;
        renderCatalogue();
      });
    });

    sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderCatalogue();
    });

    gridViewBtn.addEventListener('click', () => {
      state.viewMode = 'grid';
      gridViewBtn.classList.add('is-active');
      tableViewBtn.classList.remove('is-active');
      renderCatalogue();
    });

    tableViewBtn.addEventListener('click', () => {
      state.viewMode = 'table';
      tableViewBtn.classList.add('is-active');
      gridViewBtn.classList.remove('is-active');
      renderCatalogue();
    });

    resetFiltersBtn.addEventListener('click', () => {
      state.dept = 'home';
      state.sectionCode = 'all';
      state.status = 'all';
      state.storage = 'all';
      state.search = '';
      state.sort = 'flow';
      searchInput.value = '';
      clearSearchBtn.hidden = true;
      sortSelect.value = 'flow';
      favoritesFilterBtn.classList.remove('is-active');
      document.querySelector('input[name="statusFilter"][value="all"]').checked = true;
      document.querySelector('input[name="storageFilter"][value="all"]').checked = true;
      deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'home'));
      renderAll();
    });

    document.addEventListener('click', (e) => {
      const qtyBtn = e.target.closest('[data-qty-action]');
      if (qtyBtn) {
        const code = qtyBtn.dataset.code;
        const action = qtyBtn.dataset.qtyAction;
        const current = state.cart[code] || 0;
        const p = products.find((item) => item.code === code);

        if (action === 'inc') {
          state.cart[code] = current + 1;
          if (current === 0 && p) showToast(`Added ${p.emoji} ${p.name} to bag`);
        } else if (action === 'dec') {
          if (current <= 1) delete state.cart[code];
          else state.cart[code] = current - 1;
        }
        saveCart();
        renderHomeCarousels();
        renderCatalogue();
        if (productDetailDialog.open) openProductDetail(code);
        return;
      }

      const favBtn = e.target.closest('[data-fav-code]');
      if (favBtn) {
        toggleFavorite(favBtn.dataset.favCode);
        return;
      }

      const detailTrigger = e.target.closest('[data-detail-code]');
      if (detailTrigger) {
        openProductDetail(detailTrigger.dataset.detailCode);
        return;
      }

      const deptJump = e.target.closest('[data-go-dept]');
      if (deptJump) {
        state.dept = deptJump.dataset.goDept;
        state.sectionCode = 'all';
        deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === state.dept));
        renderAll();
        aisleCatalogueSection.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const secJump = e.target.closest('[data-go-section]');
      if (secJump) {
        state.dept = 'all';
        state.sectionCode = secJump.dataset.goSection;
        deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'all'));
        renderAll();
        aisleCatalogueSection.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const searchPreset = e.target.closest('[data-search-preset]');
      if (searchPreset) {
        state.dept = 'new_arrivals';
        state.sectionCode = 'all';
        deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'new_arrivals'));
        renderAll();
        aisleCatalogueSection.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const openProgBtn = e.target.closest('[data-open-program]');
      if (openProgBtn) {
        openProgramModal(openProgBtn.dataset.openProgram);
        return;
      }
    });

    document.getElementById('quickFilterNewTopBtn').addEventListener('click', () => {
      state.dept = 'new_arrivals';
      state.sectionCode = 'all';
      deptNavBar.querySelectorAll('.fd-dept-link').forEach((b) => b.classList.toggle('is-active', b.dataset.dept === 'new_arrivals'));
      renderAll();
      aisleCatalogueSection.scrollIntoView({ behavior: 'smooth' });
    });

    if (quickPromoTopBtn) {
      quickPromoTopBtn.addEventListener('click', scrollToPromotions);
    }

    if (toggleWednesdayPreviewBtn) {
      toggleWednesdayPreviewBtn.addEventListener('click', () => {
        state.wednesdayOverride = !state.wednesdayOverride;
        localStorage.setItem('dekmit_wednesday_override', String(state.wednesdayOverride));
        updateWednesdayUI();
        renderAll();
        if (state.wednesdayOverride) {
          showToast('Wednesday 50% Market Day discount applied across all 247 items!');
        } else {
          showToast('Standard catalogue pricing restored.');
        }
      });
    }

    if (programSelect) {
      programSelect.addEventListener('change', (e) => {
        updateProgramModalFields(e.target.value);
      });
    }

    if (programForm) {
      programForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const progType = programSelect.value;
        const progName = progFullName.value.trim();
        const progPh = progPhone.value.trim();
        const progLoc = progLocation.value.trim();
        const progN = progNotes.value.trim();
        const typeTitle = (programConfigs[progType] || {}).title || progType;

        const msg =
          `*Dek Mit Program Inquiry: ${typeTitle}*\n\n` +
          `*Name:* ${progName}\n` +
          `*Phone/WhatsApp:* ${progPh}\n` +
          `*Location/School:* ${progLoc}\n` +
          (progN ? `*Notes/Goals:* ${progN}\n` : '') +
          `\n_Sent via Dek Mit Direct Online Storefront_`;

        const waUrl = `https://wa.me/256700000000?text=${encodeURIComponent(msg)}`;
        if (progWhatsAppLink) progWhatsAppLink.href = waUrl;
        if (programForm) programForm.hidden = true;
        if (progSuccessBox) progSuccessBox.hidden = false;
        showToast(`Inquiry for ${typeTitle} prepared!`);
      });
    }

    if (progResetFormBtn) {
      progResetFormBtn.addEventListener('click', () => {
        if (programForm) {
          programForm.reset();
          programForm.hidden = false;
        }
        if (progSuccessBox) progSuccessBox.hidden = true;
        updateProgramModalFields(programSelect.value);
      });
    }

    // Cart Modal & Checkout
    openCartBtn.addEventListener('click', () => {
      updateCartUI();
      cartDialog.showModal();
    });

    deliveryZoneSelect.addEventListener('change', updateCartUI);

    addEcoBagBtn.addEventListener('click', () => {
      state.cart['3.1-04'] = (state.cart['3.1-04'] || 0) + 1;
      saveCart();
      renderAll();
      showToast('Added Reusable Dek Mit Shopping Bag');
    });

    clearCartBtn.addEventListener('click', () => {
      state.cart = {};
      saveCart();
      renderAll();
      showToast('Bag emptied');
    });

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entries = Object.entries(state.cart).filter(([, qty]) => qty > 0);
      if (entries.length === 0) {
        showToast('Your bag is empty!');
        return;
      }

      const fd = new FormData(checkoutForm);
      const name = fd.get('customerName');
      const phone = fd.get('customerPhone');
      const payment = fd.get('paymentMethod');
      const notes = fd.get('deliveryNotes') || 'Standard delivery';
      const selectedOpt = deliveryZoneSelect.options[deliveryZoneSelect.selectedIndex];
      const deliveryFee = Number(selectedOpt?.dataset.fee || 0);

      let subtotal = 0;
      const lines = entries.map(([code, qty]) => {
        const p = products.find((item) => item.code === code);
        const unit = getProductPrice(p);
        subtotal += unit * qty;
        return `${qty}x ${p.name} ${p.variant ? `(${p.variant})` : ''} — ${formatUGX(unit * qty)}`;
      });

      const grandTotal = subtotal + deliveryFee;
      const orderRef = 'DMD-' + Math.floor(100000 + Math.random() * 900000);

      const waMsg = encodeURIComponent(
        `*DEK MIT DIRECT ORDER (${orderRef})*\n` +
          `Customer: ${name} (${phone})\n` +
          `Area & Slot: ${state.location} (${state.timeSlot})\n` +
          `Payment: ${payment}\n` +
          `Notes: ${notes}\n\n` +
          `*Items:*\n${lines.join('\n')}\n\n` +
          `Subtotal: ${formatUGX(subtotal)}\n` +
          `Delivery: ${formatUGX(deliveryFee)}\n` +
          `*TOTAL: ${formatUGX(grandTotal)}*`
      );

      const checkIcon = window.getFlatIcon ? window.getFlatIcon('check', 'fd-icon--sm') : '✓';
      const waIcon = window.getFlatIcon ? window.getFlatIcon('whatsapp', 'fd-icon--sm') : '';

      cartItemsContainer.innerHTML = `
        <div style="background:var(--fd-green-tint);border:1px solid var(--fd-green-primary);padding:1.2rem;border-radius:12px;">
          <h3 style="color:var(--fd-green-dark);margin-bottom:0.3rem;display:flex;align-items:center;gap:0.4rem;">
            ${checkIcon} Order ${orderRef} Reserved!
          </h3>
          <p style="font-size:0.82rem;margin-bottom:0.65rem;">Thank you, <strong>${name}</strong>! Your delivery window (<strong>${state.timeSlot}</strong>) is confirmed.</p>
          <div style="background:#fff;padding:0.7rem;border-radius:8px;font-size:0.78rem;max-height:170px;overflow-y:auto;margin-bottom:0.8rem;">
            ${lines.map((l) => `<div>${l}</div>`).join('')}
            <hr style="margin:0.45rem 0;border:none;border-top:1px solid #ddd;">
            <strong>Total Payable: ${formatUGX(grandTotal)} (${payment})</strong>
          </div>
          <a href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener" class="fd-btn fd-btn--green fd-btn--full" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;">
            ${waIcon} Send Receipt to WhatsApp
          </a>
        </div>
      `;

      state.cart = {};
      localStorage.setItem('dekmit_cart', JSON.stringify(state.cart));
      headerCartCount.textContent = '0';
      headerCartTotal.textContent = 'UGX 0';
      renderHomeCarousels();
      renderCatalogue();
    });

    // Delivery Slot Modal
    function openSlotModal() {
      slotLocationSelect.value = state.location;
      slotDialog.showModal();
    }
    openSlotModalBtn.addEventListener('click', openSlotModal);
    document.getElementById('footerSlotBtn').addEventListener('click', openSlotModal);

    slotLocationSelect.addEventListener('change', (e) => {
      state.location = e.target.value;
      localStorage.setItem('dekmit_loc', state.location);
      activeLocationLabel.textContent = state.location;
      updateCartUI();
    });

    timeSlotButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-slot]');
      if (!btn) return;
      state.timeSlot = btn.dataset.slot;
      localStorage.setItem('dekmit_slot', state.timeSlot);
      activeTimeSlotLabel.textContent = state.timeSlot;
      timeSlotButtons.querySelectorAll('.fd-slot-option').forEach((b) => b.classList.toggle('is-selected', b === btn));
      updateCartUI();
    });

    // Live Pricing Hub & Google Sheets Sync Modal
    function openMarginModal() {
      const modeRadio = document.querySelector(`input[name="pricingMode"][value="${state.pricingMode}"]`);
      if (modeRadio) modeRadio.checked = true;
      marginRange.value = state.marginPercent;
      marginValuePreview.textContent = state.marginPercent === 0 ? '0% (Market Price)' : `+${state.marginPercent}% Retail Markup`;
      if (googleSheetUrlInput) googleSheetUrlInput.value = state.sheetUrl;
      renderQuickPriceTable();
      marginDialog.showModal();
    }
    pricingToggleBtn.addEventListener('click', openMarginModal);
    document.getElementById('footerMarginBtn').addEventListener('click', openMarginModal);

    document.querySelectorAll('input[name="pricingMode"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.pricingMode = e.target.value;
        localStorage.setItem('dekmit_pricing_mode', state.pricingMode);
        renderAll();
        renderQuickPriceTable();
      });
    });

    function setMargin(val) {
      state.pricingMode = 'custom';
      localStorage.setItem('dekmit_pricing_mode', 'custom');
      const customRadio = document.querySelector('input[name="pricingMode"][value="custom"]');
      if (customRadio) customRadio.checked = true;
      state.marginPercent = Number(val);
      localStorage.setItem('dekmit_margin', String(state.marginPercent));
      marginRange.value = state.marginPercent;
      marginValuePreview.textContent = state.marginPercent === 0 ? '0% (Market Price)' : `+${state.marginPercent}% Retail Markup`;
      renderAll();
      renderQuickPriceTable();
    }

    marginRange.addEventListener('input', (e) => setMargin(e.target.value));
    document.querySelectorAll('[data-margin-preset]').forEach((btn) => {
      btn.addEventListener('click', () => setMargin(btn.dataset.marginPreset));
    });

    // Quick Price & Stock Inline Editor Events
    if (quickPriceSearch) {
      quickPriceSearch.addEventListener('input', renderQuickPriceTable);
    }

    if (quickPriceTableBody) {
      quickPriceTableBody.addEventListener('change', (e) => {
        const priceInp = e.target.closest('[data-edit-price-code]');
        if (priceInp) {
          const code = priceInp.dataset.editPriceCode;
          const newVal = Number(priceInp.value);
          const p = products.find((item) => item.code === code);
          if (p && newVal >= 100) {
            p.price = newVal;
            recalcProductFinancials(p);
            state.priceOverrides[code] = state.priceOverrides[code] || {};
            state.priceOverrides[code].price = newVal;
            localStorage.setItem('dekmit_price_overrides', JSON.stringify(state.priceOverrides));
            renderAll();
            renderQuickPriceTable();
            showToast(`Updated ${p.name} market price to ${formatUGX(newVal)}`);
          }
          return;
        }

        const stockSel = e.target.closest('[data-edit-stock-code]');
        if (stockSel) {
          const code = stockSel.dataset.editStockCode;
          const newStatus = stockSel.value;
          const p = products.find((item) => item.code === code);
          if (p) {
            p.stockStatus = newStatus;
            state.priceOverrides[code] = state.priceOverrides[code] || {};
            state.priceOverrides[code].stockStatus = newStatus;
            localStorage.setItem('dekmit_price_overrides', JSON.stringify(state.priceOverrides));
            renderAll();
            showToast(`${p.name} marked as ${newStatus}`);
          }
        }
      });
    }

    // Google Sheets Live URL Sync
    if (syncSheetBtn) {
      syncSheetBtn.addEventListener('click', async () => {
        const url = (googleSheetUrlInput?.value || '').trim();
        if (!url) {
          showToast('Please paste a published Google Sheets CSV URL first');
          return;
        }
        state.sheetUrl = url;
        localStorage.setItem('dekmit_sheet_url', url);
        const refreshIco = window.getFlatIcon ? window.getFlatIcon('refresh', 'fd-icon--sm') : '';
        syncSheetBtn.innerHTML = `${refreshIco} Syncing...`;
        try {
          const resp = await fetch(url, { cache: 'no-store' });
          if (!resp.ok) throw new Error('Network error');
          const csvText = await resp.text();
          parseCSVTextAndSync(csvText, 'Google Sheets');
        } catch (err) {
          showToast('Could not fetch URL. Ensure the Google Sheet is Published to the Web as CSV.');
        } finally {
          syncSheetBtn.innerHTML = `${refreshIco} Sync Sheet Now`;
        }
      });
    }

    // Local CSV File Upload
    if (csvFileInput) {
      csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          parseCSVTextAndSync(String(reader.result || ''), file.name);
        };
        reader.readAsText(file);
      });
    }

    // Export Live Catalogue as Clean CSV
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        const headers = [
          'Item code', 'Display zone', 'Flow order', 'Section code', 'Display section',
          'Item', 'Size / variant', 'UOM', 'Storage / display condition', 'Shelf life (days)',
          'Market price – survey (UGX)', 'Proposed selling price (UGX)', 'Sourcing cost (UGX)',
          'Gross profit per unit (UGX)', 'Gross margin %', 'Wastage allowance %', 'Net margin %',
          'Stock status', 'Status', 'Notes'
        ];
        const rows = products.map((p) => [
          p.code,
          `"${p.zone}"`,
          p.order,
          p.sectionCode,
          `"${p.section}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${(p.variant || '').replace(/"/g, '""')}"`,
          p.uom,
          `"${p.storage}"`,
          p.shelfLife,
          p.price,
          getProductPrice(p),
          p.sourcingCost || Math.round((p.price * 0.8) / 100) * 100,
          getProductPrice(p) - (p.sourcingCost || Math.round((p.price * 0.8) / 100) * 100),
          `${p.grossMarginPct || 20}%`,
          `${p.wastagePct || 5}%`,
          `${p.netMarginPct || 15}%`,
          p.stockStatus || 'In Stock',
          p.status,
          `"${(p.notes || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `dek-mit-prices-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        showToast('Downloaded updated catalogue CSV!');
      });
    }

    // Reset Custom Price Overrides
    if (resetCustomPricesBtn) {
      resetCustomPricesBtn.addEventListener('click', () => {
        state.priceOverrides = {};
        localStorage.removeItem('dekmit_price_overrides');
        localStorage.removeItem('dekmit_sheet_url');
        window.location.reload();
      });
    }
  }

  async function init() {
    applyStoredOverrides();
    activeLocationLabel.textContent = state.location;
    activeTimeSlotLabel.textContent = state.timeSlot;
    favCountLabel.textContent = state.favorites.length;
    setupDialogFallbacks();
    renderAll();
    bindEvents();

    // Auto-sync from Google Sheets on page load if a published CSV URL is saved
    if (state.sheetUrl) {
      try {
        const resp = await fetch(state.sheetUrl, { cache: 'no-store' });
        if (resp.ok) {
          const text = await resp.text();
          parseCSVTextAndSync(text, 'Live Google Sheet');
        }
      } catch (_) {
        // Silent fallback to local products.js if offline
      }
    }
  }

  init();
})();
