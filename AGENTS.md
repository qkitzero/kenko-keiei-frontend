<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design

Follow the design rules in `docs/design.md` when adding or changing UI. This is a back-office tool for business operators: favour information density and consistency over decoration. Use the shared components and semantic color tokens instead of copying class strings between pages.

# Domain

Read `docs/domain.md` before touching tenants, organizations, or measurements. It records what the concepts mean and where the upstream services behave unexpectedly.
