import fs from 'node:fs';

const selected = new Set(process.argv.slice(2));
const failures = [];

const read = (path) => fs.readFileSync(path, 'utf8');
const enabled = (name) => selected.size === 0 || selected.has(name);
const assert = (name, condition, message) => {
  if (enabled(name) && !condition) {
    failures.push(`${name}: ${message}`);
  }
};

const facebookEvents = read('src/react-app/components/social/feeds/FacebookEvents.tsx');
const dynamicSocialFeed = read('src/react-app/components/social/feeds/DynamicSocialFeed.tsx');
const platformLauncher = read('src/react-app/components/PlatformLauncher.tsx');
const css = read('src/react-app/index.css');

assert(
  'facebook-events',
  facebookEvents.includes("@/components/ui/dialog") &&
    facebookEvents.includes('<Dialog open={!!selectedEvent}') &&
    !facebookEvents.includes('role="button"'),
  'FacebookEvents must use Radix Dialog and must not use role="button" card wrappers.'
);

assert(
  'dynamic-social-layouts',
  dynamicSocialFeed.includes('const renderPostCard') &&
    dynamicSocialFeed.includes('social-feed-carousel') &&
    dynamicSocialFeed.includes('social-feed-masonry') &&
    dynamicSocialFeed.includes('aria-roledescription="carousel"') &&
    !dynamicSocialFeed.includes('renderGrid()} {/* Simplified'),
  'DynamicSocialFeed must implement distinct masonry and carousel renderers.'
);

assert(
  'platform-classes',
  !platformLauncher.match(/platform-launcher-fab|fab-trigger|fab-menu|fab-platform-btn/) &&
    !css.match(/\.(?:platform-launcher-fab|fab-trigger|fab-menu|fab-platform-btn)\b/),
  'PlatformLauncher must not use legacy FAB class names.'
);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('UI review source contracts passed.');
