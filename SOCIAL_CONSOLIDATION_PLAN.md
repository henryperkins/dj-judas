# Social Components Consolidation Plan

## Executive Summary

The codebase currently contains multiple overlapping social, streaming, and sharing components with conflicting implementations. This plan outlines a systematic approach to consolidate these components into a unified, maintainable architecture.

## Current State Analysis

### Component Inventory

#### Primary Components
- **CreatorMediaPanel** (`src/react-app/components/CreatorMediaPanel.tsx`)
  - Main unified media hub with tabs: Listen, Watch, Social, Share
  - Most comprehensive implementation
  - Currently used in EnhancedLandingPageV2

- **DynamicSocialFeed** (`src/react-app/components/social/DynamicSocialFeed.tsx`)
  - Advanced social feed with shoppable posts
  - Supports Instagram & Facebook
  - Includes engagement tracking and analytics

- **Platform-Specific Embeds**
  - SpotifyEmbed - Advanced with auth, save, follow features
  - AppleMusicEmbed - Basic embed functionality
  - InstagramEmbed - oEmbed implementation with carousel support
  - FacebookPage, FacebookVideo - Separate Facebook components
  - SocialEmbed - Universal wrapper for multiple platforms

#### Duplicate/Conflicting Components
- **InstagramHub** vs **InstagramEmbed** - Two different Instagram implementations
- **FacebookHub** vs **FacebookPage/FacebookVideo** - Multiple Facebook approaches
- **SocialHub Page** (`/social` route) - Duplicates CreatorMediaPanel functionality
- **Multiple share implementations** - lib/share.ts vs inline in CreatorMediaPanel

### Dependency Map

```
CreatorMediaPanel
├── QrShareCard (react-qr-code)
├── SpotifyEmbed (Spotify iframe API)
├── AppleMusicEmbed (MusicKit JS)
├── FacebookVideo (Meta SDK)
├── FacebookPage (Meta SDK)
├── InstagramEmbed (Meta SDK + oEmbed API)
├── SocialEmbed (react-social-media-embed)
└── shareWithTracking (metaSdk.ts)

DynamicSocialFeed
├── socialMetrics.ts (analytics)
└── Backend API (/api/social/feed)

FacebookEvents
├── socialMetrics.ts
└── Backend API (/api/facebook/events)
```

### Analytics Integration
- **socialMetrics.ts** - Comprehensive tracking system
- Google Analytics (gtag)
- Facebook Pixel (fbq)
- Session tracking and conversion attribution

## Consolidation Strategy

### Phase 1: Component Unification

#### 1.1 Create Unified Social Module Structure
```
src/react-app/components/social/
├── index.ts                    # Public exports
├── types.ts                     # Shared TypeScript types
├── embeds/
│   ├── InstagramEmbed.tsx      # Merged Instagram functionality
│   ├── FacebookEmbed.tsx       # Unified Facebook component
│   ├── SpotifyEmbed.tsx        # Move from parent directory
│   ├── AppleMusicEmbed.tsx     # Move from parent directory
│   └── UniversalEmbed.tsx      # Renamed from SocialEmbed
├── feeds/
│   ├── DynamicSocialFeed.tsx   # Keep as-is
│   └── FacebookEvents.tsx      # Keep as-is
├── sharing/
│   ├── ShareManager.tsx        # New centralized share component
│   ├── QrShareCard.tsx         # Move from parent directory
│   └── ShareButton.tsx         # Extract from CreatorMediaPanel
└── utils/
    ├── socialMetrics.ts         # Move from utils/
    ├── metaSdk.ts              # Move from utils/
    └── platformDetection.ts    # Move from utils/
```

#### 1.2 Component Consolidation Tasks

**Instagram Consolidation:**
- Merge `InstagramHub` features into `InstagramEmbed`
- Retain: oEmbed, carousel, music discovery, engagement stats
- Remove: Duplicate embed logic, redundant UI elements

**Facebook Consolidation:**
- Create unified `FacebookEmbed` component
- Merge: FacebookHub, FacebookPage, FacebookVideo, FacebookPageEmbed
- Expose props for: video/page/events display modes
- Centralize Facebook SDK initialization

**Share Consolidation:**
- Create `ShareManager` component
- Merge: lib/share.ts functionality, CreatorMediaPanel share logic
- Features: UTM tracking, native share, social platforms, QR codes
- Consistent analytics integration

### Phase 2: Code Cleanup

#### 2.1 Remove Deprecated Components
- [x] Delete `/social` route from App.tsx
- [ ] Remove `SocialHub` page component
- [ ] Delete `InstagramHub` component
- [ ] Delete `FacebookHub` component
- [ ] Delete `FacebookPageEmbed` component
- [ ] Remove `lib/share.ts`
- [ ] Clean up `useFacebookEmbed` hook if redundant

#### 2.2 Update Imports
- [ ] Update all imports in `EnhancedLandingPageV2`
- [ ] Update imports in `CreatorMediaPanel`
- [ ] Update any other components using social features
- [ ] Update barrel exports in component directories

### Phase 3: Integration & Testing

#### 3.1 Update CreatorMediaPanel
```typescript
// New structure
import {
  SpotifyEmbed,
  AppleMusicEmbed,
  FacebookEmbed,
  InstagramEmbed,
  UniversalEmbed,
  ShareManager,
  QrShareCard
} from './social';
```

#### 3.2 Simplify Props & Configuration
- Standardize embed props across all platforms
- Create consistent theming approach
- Centralize API configuration

#### 3.3 Testing Checklist
- [ ] Spotify playback and authentication
- [ ] Apple Music embed rendering
- [ ] Instagram post/reel embedding
- [ ] Facebook page/video/events display
- [ ] Universal embed for TikTok, YouTube, etc.
- [ ] Share functionality with UTM tracking
- [ ] QR code generation
- [ ] Analytics tracking (socialMetrics)
- [ ] Mobile responsiveness
- [ ] Accessibility (WCAG AA)

### Phase 4: Documentation & Optimization

#### 4.1 Documentation
- [ ] Update CLAUDE.md with new social architecture
- [ ] Create component usage examples
- [ ] Document props and configuration options
- [ ] Add inline code comments

#### 4.2 Performance Optimization
- [ ] Implement lazy loading for embeds
- [ ] Add loading skeletons
- [ ] Optimize bundle size (tree shaking)
- [ ] Cache API responses where appropriate

#### 4.3 Accessibility Improvements
- [ ] Ensure all embeds have proper ARIA labels
- [ ] Add keyboard navigation support
- [ ] Provide fallback content for failed embeds
- [ ] Test with screen readers

## Implementation Timeline

### Week 1: Component Unification
- Day 1-2: Create new social module structure
- Day 3-4: Consolidate Instagram components
- Day 5: Consolidate Facebook components

### Week 2: Integration & Cleanup
- Day 1-2: Create ShareManager component
- Day 3: Remove deprecated components
- Day 4-5: Update imports and test integration

### Week 3: Testing & Documentation
- Day 1-2: Comprehensive testing
- Day 3: Fix issues and optimize
- Day 4-5: Documentation and code review

## Risk Mitigation

### Potential Issues & Solutions

1. **Meta SDK Conflicts**
   - Risk: Multiple SDK initializations
   - Solution: Centralize SDK init in metaSdk.ts

2. **Breaking Changes**
   - Risk: Existing implementations break
   - Solution: Create compatibility layer during transition

3. **Analytics Disruption**
   - Risk: Loss of tracking data
   - Solution: Maintain existing event names and data structure

4. **Performance Degradation**
   - Risk: Increased bundle size
   - Solution: Implement code splitting and lazy loading

## Success Metrics

- **Code Reduction**: Target 30% reduction in social component code
- **Bundle Size**: No increase in main bundle size
- **Performance**: Maintain or improve Core Web Vitals
- **Test Coverage**: Achieve 80% test coverage for social components
- **Developer Experience**: Reduce time to implement new social features by 50%

## Next Steps

1. Review and approve this consolidation plan
2. Create feature branch: `feature/social-consolidation`
3. Begin Phase 1 implementation
4. Set up monitoring for analytics continuity
5. Schedule code review checkpoints

## Notes

- All deprecated components will be archived before deletion
- Existing functionality must be preserved
- Mobile-first approach must be maintained
- Accessibility standards (WCAG AA) must be met
- Consider creating Storybook stories for new components
