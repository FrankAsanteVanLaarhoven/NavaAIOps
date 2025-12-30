'use client';

import { generateJSON } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Convert Markdown to TipTap JSON (client-side only)
export function markdownToJson(markdown: string): any {
  try {
    const json = generateJSON(markdown, [StarterKit]);
    return json;
  } catch (error) {
    // Fallback to simple paragraph
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: markdown,
            },
          ],
        },
      ],
    };
  }
}
