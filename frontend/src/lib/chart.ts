/**
 * How every chart series enters, in one place so all of them draw themselves in the same way.
 *
 * Every series in the app had animation switched **off**, so a route's charts simply appeared.
 * Recharts animates a series when it mounts, and a route change remounts the tree — so turning it
 * on is also what makes a chart redraw its entrance **every time** you land on the route, not just
 * on the first visit. The duration is short on purpose: Recharts' 1500ms default feels sluggish
 * for a page that is already on screen.
 *
 * Spread it onto each series: `<Bar dataKey="value" {...chartAnimation} />`.
 */
export const chartAnimation = {
  isAnimationActive: true,
  animationDuration: 800,
} as const
