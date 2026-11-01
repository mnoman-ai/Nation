const LOGO_SHAPES = ['sun','star','wheel','lotus','tree','torch','book','hand','bird','mountain','plough','rising-sun','shield','circle','diamond','leaf','lamp','bridge','anchor','eagle','grain','gear','flame','dove'];
const FLAG_LAYOUTS = ['horizontal-tricolour','vertical-tricolour','diagonal-split','rising-sun','central-disc','star-field','bordered-field','crossed-bands','chevron','wave-bands','quartered','single-stripe'];
export const PARTY_LOGO_CHOICES = LOGO_SHAPES.map((id) => ({ id, label: id.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }));
export const PARTY_FLAG_CHOICES = FLAG_LAYOUTS.map((id) => ({ id, label: id.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }));
const safe = (value) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#b88a32';
export function renderPartyLogoSVG(shape, primary = '#b88a32', secondary = '#173d35') {
  const a = safe(primary), b = safe(secondary);
  const symbol = {
    sun: '<circle cx="50" cy="50" r="22"/><path d="M50 8v14M50 78v14M8 50h14M78 50h14M20 20l10 10M70 70l10 10M80 20 70 30M30 70 20 80"/>',
    star: '<path d="m50 8 10 28 30 2-23 19 8 29-25-17-25 17 8-29L10 38l30-2z"/>',
    wheel: '<circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="8"/><path d="M50 16v26M50 58v26M16 50h26M58 50h26M26 26l18 18M56 56l18 18M74 26 56 44M44 56 26 74"/>',
    lotus: '<path d="M50 82Q12 56 30 30Q50 45 50 82Q50 45 70 30Q88 56 50 82M50 82Q22 82 16 58Q40 58 50 82Q60 58 84 58Q78 82 50 82"/>',
    tree: '<path d="M50 12 22 48h15L20 68h24v18h12V68h24L63 48h15z"/>',
    torch: '<path d="M38 42h24l-5 44H43zM50 8q22 19 0 34Q28 27 50 8z"/>',
    book: '<path d="M12 22q20-8 38 5 18-13 38-5v52q-20-8-38 5-18-13-38-5zM50 27v52"/>',
    hand: '<path d="M28 78 17 52q-3-9 5-12 7-2 11 8l4 8V20q0-9 8-9t8 9v28-19q0-9 8-9t8 9v22-13q0-8 8-8t8 8v24q0 24-23 24H43z"/>',
    bird: '<path d="M12 58q18-30 38-18 18-20 38-10-9 31-34 38-22 7-42-10zM48 40l-8-18 20 12"/>',
    mountain: '<path d="m8 78 25-46 13 22 13-36 33 60z"/>',
    plough: '<path d="M16 28h48l14 18-12 8H36L24 82M46 28l-4-14M64 46l14 28"/>',
    'rising-sun': '<circle cx="50" cy="48" r="24"/><path d="M10 78h80M20 66h60M50 8v12M18 24l9 9M82 24l-9 9"/>',
    shield: '<path d="M50 8 84 20v25q-2 28-34 47Q18 73 16 45V20z"/><path d="M32 49h36M50 30v38"/>',
    circle: '<circle cx="50" cy="50" r="35"/><circle cx="50" cy="50" r="20"/>',
    diamond: '<path d="M50 8 88 50 50 92 12 50z"/><path d="M50 24 74 50 50 76 26 50z"/>',
    leaf: '<path d="M18 78Q12 20 82 14Q88 78 18 78zM20 78 70 28"/>',
    lamp: '<path d="M28 48h44l-8 34H36zM24 48q2-27 26-35 24 8 26 35zM42 82h16v8H42z"/>',
    bridge: '<path d="M8 72h84M16 72V40h68v32M16 40q34-40 68 0M30 40v32M50 24v48M70 40v32"/>',
    anchor: '<path d="M50 10v62M30 28h40M18 58q0 30 32 30t32-30M38 18a12 12 0 1 0 24 0 12 12 0 1 0-24 0z"/>',
    eagle: '<path d="M50 34Q30 8 8 24l22 24-20 8 40 30 40-30-20-8 22-24Q70 8 50 34z"/>',
    grain: '<path d="M50 88V16M50 32q-28-4-26-24 24 0 26 24zM50 50q28-4 26-24-24 0-26 24zM50 68q-28-4-26-24 24 0 26 24zM50 82q28-4 26-24-24 0-26 24z"/>',
    gear: '<path d="M42 8h16l4 12 10 4 11-6 11 11-6 11 4 10 12 4v16l-12 4-4 10 6 11-11 11-11-6-10 4-4 12H42l-4-12-10-4-11 6L6 91l6-11-4-10-12-4V50l12-4 4-10-6-11 11-11 11 6 10-4z" transform="translate(8 -8) scale(.84)"/><circle cx="50" cy="50" r="13"/>',
    flame: '<path d="M52 8q14 24 0 34 22-6 25 20 0 25-27 30-27-5-27-30 0-17 15-32-1 18 8 20Q59 34 52 8z"/>',
    dove: '<path d="M10 58q28-8 38-38 12 20 32 18l10-10-4 24q-12 24-38 20L26 84l5-20zM48 20l-8-12 20 10"/>'
  }[shape] || '<path d="M50 10 88 50 50 90 12 50z"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="${b}"/><g fill="${a}" stroke="${a}" stroke-width="4" stroke-linejoin="round">${symbol}</g></svg>`;
}
export function renderPartyFlagSVG(layout, primary = '#b88a32', secondary = '#173d35') {
  const a = safe(primary), b = safe(secondary), white = '#f4ead4';
  const designs = {
    'horizontal-tricolour': `<path fill="${a}" d="M0 0h120v30H0z"/><path fill="${white}" d="M0 30h120v30H0z"/><path fill="${b}" d="M0 60h120v30H0z"/>`,
    'vertical-tricolour': `<path fill="${a}" d="M0 0h40v90H0z"/><path fill="${white}" d="M40 0h40v90H40z"/><path fill="${b}" d="M80 0h40v90H80z"/>`,
    'diagonal-split': `<path fill="${a}" d="M0 0h120v90H0z"/><path fill="${b}" d="M0 90 120 0v90z"/>`,
    'rising-sun': `<rect width="120" height="90" fill="${b}"/><circle cx="60" cy="45" r="22" fill="${a}"/><path stroke="${a}" stroke-width="5" d="M60 4v15M60 71v15M19 45h15M86 45h15M31 16l11 11M78 63l11 11M89 16 78 27M42 63 31 74"/>`,
    'central-disc': `<rect width="120" height="90" fill="${a}"/><circle cx="60" cy="45" r="24" fill="${white}"/><circle cx="60" cy="45" r="14" fill="${b}"/>`,
    'star-field': `<rect width="120" height="90" fill="${b}"/><path fill="${a}" d="m60 12 8 23 25 1-19 15 7 24-21-14-21 14 7-24-19-15 25-1z"/>`,
    'bordered-field': `<rect width="120" height="90" fill="${b}"/><rect x="10" y="10" width="100" height="70" fill="none" stroke="${a}" stroke-width="8"/>`,
    'crossed-bands': `<rect width="120" height="90" fill="${b}"/><path d="M0 0 120 90M120 0 0 90" stroke="${a}" stroke-width="15"/>`,
    chevron: `<rect width="120" height="90" fill="${b}"/><path fill="${a}" d="M0 0h45L90 45 45 90H0l45-45z"/>`,
    'wave-bands': `<rect width="120" height="90" fill="${b}"/><path d="M0 20q30-20 60 0t60 0v18q-30 20-60 0T0 38zM0 55q30-20 60 0t60 0v18q-30 20-60 0T0 73z" fill="${a}"/>`,
    quartered: `<path fill="${a}" d="M0 0h60v45H0zM60 45h60v45H60z"/><path fill="${b}" d="M60 0h60v45H60zM0 45h60v45H0z"/>`,
    'single-stripe': `<rect width="120" height="90" fill="${b}"/><rect y="34" width="120" height="22" fill="${a}"/>`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">${designs[layout] || designs['horizontal-tricolour']}</svg>`;
}
