---
name: mobile-design-ios
description: Use when the user asks to build iOS screens, SwiftUI views, UIKit layouts, mobile components, or any iOS app UI. Also use when styling, redesigning, or beautifying any iOS interface. Covers iOS 26 Liquid Glass design language, hierarchy, motion, and platform-native patterns.
---

This skill targets **iOS 26+** and its Liquid Glass design language. For apps targeting older iOS versions, fall back to standard Apple Human Interface Guidelines — those patterns are well-covered by general AI knowledge.

This skill guides creation of iOS interfaces that feel genuinely designed for the platform — avoiding the generic "template app" aesthetic that plagues AI-generated mobile UI. Every design decision should demonstrate understanding of iOS 26's Liquid Glass design language and the principles that separate professional apps from amateur ones.

The user provides iOS UI requirements: a screen, flow, component, or full app interface. They may include context about purpose, audience, or technical constraints.

## Design Thinking

Before generating any UI, commit to a clear design direction:
- **Purpose**: What does this screen accomplish? What's the user's emotional state when they arrive here?
- **Personality**: Pick a direction — serene/zen, bold/editorial, warm/organic, precise/technical, playful/energetic, luxurious/refined, minimal/focused. The app's personality should feel intentional and consistent.
- **Content-first**: iOS 26's entire philosophy is that content is the star. Glass floats above to serve content, never to compete with it. Design the content layer first, then add navigation.
- **Differentiation**: What makes this feel like a *designed* app rather than a default template? What single detail would a user notice and appreciate?

**CRITICAL**: Liquid Glass is not decoration — it's a hierarchy tool. Glass belongs exclusively on the navigation/controls layer (tab bars, toolbars, floating buttons, sheets). Content stays opaque and on the content layer. This single rule prevents the majority of amateur iOS 26 mistakes.

## iOS 26 Liquid Glass Design Guidelines

Focus on:
- **Hierarchy**: Strict two-layer model. The functional layer (navigation, toolbars, floating controls) uses Liquid Glass. The content layer uses standard opaque materials. Never put glass on content elements like cards, list rows, or backgrounds. Never stack glass on glass.
- **Glass Variants**: Use Regular glass by default — it blurs and adjusts luminosity for legibility. Use Clear glass only over visually rich media (photos, video) where dimming would harm the experience. Apply the `.interactive()` modifier only to primary interaction elements — it adds GPU cost.
- **Grouping**: Wrap multiple nearby glass elements in `GlassEffectContainer` — without it each element renders independently (poor performance) and they can't merge/morph fluidly. This is essential, not optional.
- **Typography**: Bolder and left-aligned in key moments. Section headers use title-style capitalization, not ALL-CAPS. Embrace Dynamic Type with emphasized weights. Minimum 11pt for any text. Body text stays SF Pro for full Dynamic Type support — but use a distinctive display font for hero headlines to avoid the "stock iOS" look.
- **Color on Glass**: Apply color sparingly to glass surfaces. Reserve tinting for a single prominent action (like a tinted Done button) or status indicators. If you want brand color, put it in the content layer, not on glass. Every glass element tinted equally = nothing stands out.
- **Iconography**: SF Symbols 7 provides 6,900+ symbols. Bars use icons over text labels — adopt this platform-wide shift. Use symbol animations (Draw, Variable Draw, Magic Replace) for state transitions. Render symbols with automatic gradient from a single source color.
- **Motion**: Glass elements materialize and dematerialize — they don't fade in/out. State changes use morphing transitions (tab bars shrink on scroll, buttons expand into popovers, sheets spring from source anchors). Motion should feel like gel-like flexibility, not mechanical animation. Pair haptics with motion: light impact for entrances, medium impact timed to morph completion.
- **Geometry**: Use concentric corner radii that match hardware curves (`ConcentricRectangle`). Sheets have increased corner radius with half-sheets inset from edges. Larger row heights, padding, and spacing than pre-iOS 26.
- **Depth**: Liquid Glass conveys depth through lensing/refraction, dynamic specular highlights, and context-aware shadows — not drop shadows or elevation values. Shadows automatically increase opacity over text for separation. Trust the system to handle depth.
- **Scroll Behavior**: Content scrolls under glass bars. Configure scroll-edge effects (blur/opacity increase as content approaches the bar). Tab bars shrink to compact form on scroll-down and expand when scrolling back up.
- **Sidebars & Sheets**: Sidebars are inset with glass, allowing content to flow behind them with a background extension blur effect. Half-sheets are inset from display edges with increased corner radius. Action sheets spring from their source element — never from screen bottom. Alerts expand directly from the triggering button.

## Accessibility is Non-Negotiable

- **4.5:1** minimum contrast for normal text, **3:1** for large text — on glass this means testing against scrolling backgrounds, not static mockups
- Detect `Reduce Transparency` and provide opaque fallbacks (use `.identity` glass variant)
- Respect `Reduce Motion` — disable morphing, lensing, elastic behaviors
- Respect `Increase Contrast` — stronger borders and foreground elements
- Touch targets minimum **44×44pt** regardless of visual shape
- Support both light and dark appearance — even single-appearance apps must provide both for glass adaptivity
- Respect the iOS 26.1 Tinted/Clear toggle (Settings → Display & Brightness → Liquid Glass) — users control glass opacity

## NEVER Do These (The iOS "AI Slop" Markers)

- Glass on content elements (cards, list rows, table cells, backgrounds) — this is the #1 amateur mistake
- Glass stacked on glass — Apple explicitly warns against this
- Custom opaque backgrounds on navigation bars or tab bars — they block Liquid Glass entirely
- ALL-CAPS section headers — iOS 26 uses title-style capitalization
- Ignoring the compact tab bar scroll behavior — fixed tab bars feel dated on iOS 26
- Stock blue tint on everything with no brand personality
- Identical spacing and padding on every element — vary density to create rhythm
- Static mockup-only contrast testing — glass changes appearance based on what scrolls behind it
- Using old `UIVisualEffectView` blur materials where Liquid Glass should be
- Action sheets appearing from screen bottom instead of springing from their source element
- The "blinking UI" problem — mixed light/dark content causing bars to rapidly flip appearance

## What Separates Professional from Template

Professional iOS 26 apps share these traits: glass appears only where it communicates "this floats above content as a control." Design tokens are centralized — consistent corner radii, padding, glass levels across every screen. `GlassEffectContainer` groups related glass elements into cohesive material. Tinting conveys semantic meaning, never decoration. Motion is purposeful — reserved for meaningful interactions, not constant spectacle. The Reduce Transparency path is as considered as the glass path itself.

Before asking "does this look good?", ask "what does this glass surface communicate about hierarchy?"

Remember: the best iOS 26 apps feel like Liquid Glass was always there. The worst ones feel like glass was applied as afterthought decoration. Design the content experience first. Let glass serve it.
