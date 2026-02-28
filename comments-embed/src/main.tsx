import React from 'react';
import ReactDOM from 'react-dom/client';
import CommentWidget from './CommentWidget';
import CommentCount from './CommentCount';
import { FUNCTIONS_URL } from './supabase';
import type { MemberstackMember, CountsResponse } from './types';
import './styles.css';

interface MemberstackDom {
  getCurrentMember: () => Promise<{
    data: { id: string; auth: { email: string }; customFields?: Record<string, string>; profileImage?: string } | null;
  }>;
  getMemberCookie: () => string | null;
  openModal: (type: string) => void;
}

async function init() {
  // Mount comment widget on #fegc-comments element
  const target = document.getElementById('fegc-comments');
  if (target) {
    const articleSlug = target.getAttribute('data-article-slug') ?? '';
    const collection = target.getAttribute('data-collection') ?? 'articles';

    let member: MemberstackMember | null = null;

    // Try to get Memberstack auth
    const ms = (window as unknown as Record<string, unknown>).$memberstackDom as MemberstackDom | undefined;
    if (ms) {
      try {
        const result = await ms.getCurrentMember();
        if (result?.data) {
          member = {
            id: result.data.id,
            auth: result.data.auth,
            customFields: result.data.customFields,
            profileImage: result.data.profileImage,
          };
        }
      } catch {
        // Not logged in
      }
    }

    // Fresh token getter — getMemberCookie() returns the Memberstack JWT
    const getToken = async (): Promise<string | null> => {
      if (!ms) return null;
      try {
        return ms.getMemberCookie() ?? null;
      } catch {
        return null;
      }
    };

    ReactDOM.createRoot(target).render(
      <React.StrictMode>
        <CommentWidget
          articleSlug={articleSlug}
          collection={collection}
          member={member}
          getToken={getToken}
        />
      </React.StrictMode>,
    );
  }

  // Mount comment count badges
  const countElements = document.querySelectorAll('.fegc-comment-count');
  if (countElements.length > 0) {
    const slugsByCollection = new Map<string, { slug: string; element: Element }[]>();

    countElements.forEach((el) => {
      const slug = el.getAttribute('data-article-slug') ?? '';
      const collection = el.getAttribute('data-collection') ?? 'articles';
      if (!slug) return;

      const list = slugsByCollection.get(collection) ?? [];
      list.push({ slug, element: el });
      slugsByCollection.set(collection, list);
    });

    // Batch fetch counts per collection
    for (const [collection, items] of slugsByCollection) {
      const slugs = items.map((i) => i.slug).join(',');
      try {
        const res = await fetch(
          `${FUNCTIONS_URL}/comments-count?slugs=${encodeURIComponent(slugs)}&collection=${encodeURIComponent(collection)}`,
        );
        const data: CountsResponse = await res.json();

        for (const item of items) {
          const count = data.counts[item.slug] ?? 0;
          ReactDOM.createRoot(item.element).render(
            <CommentCount count={count} />,
          );
        }
      } catch {
        // silently fail
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
