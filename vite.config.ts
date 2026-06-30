import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const nodeModule = String.raw`node_modules[\\/]`;

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: new RegExp(`${nodeModule}(?:@vitejs[\\/]plugin-react|react|react-dom|scheduler)(?:[\\/]|$)`),
              priority: 40,
            },
            {
              name: "markdown-vendor",
              test: new RegExp(
                `${nodeModule}(?:react-markdown|remark-|rehype-|micromark|mdast-|hast-|unist-|vfile|bail|ccount|comma-separated-tokens|decode-named-character-reference|devlop|estree-util-|extend|hastscript|html-|is-|markdown-table|mdurl|property-information|space-separated-tokens|trim-lines|trough|unified|zwitch)(?:[\\/]|$)`,
              ),
              priority: 35,
            },
            {
              name: "katex",
              test: new RegExp(`${nodeModule}katex(?:[\\/]|$)`),
              priority: 34,
            },
            {
              name: "diagram-layout",
              test: new RegExp(`${nodeModule}(?:cytoscape|dagre|elkjs|graphlib)(?:[\\/]|$)`),
              priority: 33,
            },
            {
              name: "diagram-rendering",
              test: new RegExp(`${nodeModule}(?:d3|d3-|dompurify|khroma|roughjs)(?:[\\/]|$)`),
              priority: 32,
            },
          ],
        },
      },
    },
    // The only known chunk above 600 kB is Mermaid's lazy-loaded parser core.
    // scripts/verify-build-budget.mjs keeps initial chunks at 600 kB and
    // allows that reviewed parser chunk up to 700 kB.
    chunkSizeWarningLimit: 700,
  },
})
