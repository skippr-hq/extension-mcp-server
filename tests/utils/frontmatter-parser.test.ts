import { describe, it, expect } from 'vitest';
import { parseIssueFrontmatter } from '../../src/utils/frontmatter-parser.js';

describe('frontmatter-parser', () => {
  describe('parseIssueFrontmatter', () => {
    it('should parse valid markdown with frontmatter', () => {
      const markdown = `---
id: "7b8efc72-0122-4589-bbaa-07fb53ec0e26"
reviewId: "5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0"
title: "Color is Used as a Primary Means of Conveying Information"
severity: "medium"
resolved: false
agentTypes: ["a11y"]
elementMetadata:
  selector: 'div.flex.flex-col.lg\:flex-row'
  bounding_box: [48, 451, 1184, 448]
createdAt: "2025-09-30T10:08:18.705465Z"
updatedAt: "2025-09-30T10:08:18.705465Z"
---

## Details

In the "TPM shortage" and "The Paige Solution" sections, list items are preceded by red 'X' icons.

## Agent Prompt

This is feedback from an AI Accessibility Expert.

**Task**: Add visually hidden text to the list items.`;

      const result = parseIssueFrontmatter(markdown);

      // Validate frontmatter
      expect(result.frontmatter.id).toBe('7b8efc72-0122-4589-bbaa-07fb53ec0e26');
      expect(result.frontmatter.reviewId).toBe('5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0');
      expect(result.frontmatter.title).toBe('Color is Used as a Primary Means of Conveying Information');
      expect(result.frontmatter.severity).toBe('medium');
      expect(result.frontmatter.resolved).toBe(false);
      expect(result.frontmatter.agentTypes).toEqual(['a11y']);
      expect(result.frontmatter.elementMetadata).toEqual({
        selector: 'div.flex.flex-col.lg:flex-row',
        bounding_box: [48, 451, 1184, 448],
      });

      // Validate raw content is preserved
      expect(result.content).toContain('## Details');
      expect(result.content).toContain('## Agent Prompt');
      expect(result.content).toContain('TPM shortage');
      expect(result.content).toContain('**Task**: Add visually hidden text');
    });

    it('should parse markdown without optional fields', () => {
      const markdown = `---
id: "7b8efc72-0122-4589-bbaa-07fb53ec0e26"
reviewId: "5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0"
title: "Simple Issue"
severity: "low"
agentTypes: ["ux"]
---

## Details

Simple issue details.`;

      const result = parseIssueFrontmatter(markdown);

      expect(result.frontmatter.id).toBe('7b8efc72-0122-4589-bbaa-07fb53ec0e26');
      expect(result.frontmatter.resolved).toBe(false); // default value
      expect(result.frontmatter.elementMetadata).toBeUndefined();
      expect(result.content).toContain('## Details');
      expect(result.content).toContain('Simple issue details.');
    });

    it('should handle multiple agent types', () => {
      const markdown = `---
id: "7b8efc72-0122-4589-bbaa-07fb53ec0e26"
reviewId: "5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0"
title: "Multi-agent Issue"
severity: "high"
agentTypes: ["ux", "a11y", "content"]
---

Issue found by multiple agents.`;

      const result = parseIssueFrontmatter(markdown);

      expect(result.frontmatter.agentTypes).toEqual(['ux', 'a11y', 'content']);
      expect(result.content).toContain('Issue found by multiple agents.');
    });

    it('should throw error for invalid severity', () => {
      const markdown = `---
id: "7b8efc72-0122-4589-bbaa-07fb53ec0e26"
reviewId: "5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0"
title: "Invalid Issue"
severity: "invalid"
agentTypes: ["ux"]
---

Test`;

      expect(() => parseIssueFrontmatter(markdown)).toThrow();
    });

    it('should throw error for invalid UUID', () => {
      const markdown = `---
id: "not-a-uuid"
reviewId: "5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0"
title: "Invalid Issue"
severity: "low"
agentTypes: ["ux"]
---

Test`;

      expect(() => parseIssueFrontmatter(markdown)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const markdown = `---
id: "7b8efc72-0122-4589-bbaa-07fb53ec0e26"
title: "Missing reviewId"
severity: "low"
agentTypes: ["ux"]
---

Test`;

      expect(() => parseIssueFrontmatter(markdown)).toThrow();
    });

    it('should preserve exact markdown formatting', () => {
      const markdown = `---
id: "7b8efc72-0122-4589-bbaa-07fb53ec0e26"
reviewId: "5ac5c81b-1634-4bd2-8e64-7d926a9ba1c0"
title: "Test"
severity: "info"
agentTypes: ["pm"]
---

## Agent Prompt

**Issue**: Button is wrong
**Task**: Fix it
- Step 1
- Step 2`;

      const result = parseIssueFrontmatter(markdown);

      // Content should preserve exact formatting including bullet points
      expect(result.content).toContain('**Issue**: Button is wrong');
      expect(result.content).toContain('- Step 1');
      expect(result.content).toContain('- Step 2');
    });
  });
});
