import { NavLink } from 'react-router-dom';

export default function CommentInstall() {
  return (
    <div>
      <nav className="page-tabs">
        <NavLink to="/comments" end className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Comments</NavLink>
        <NavLink to="/comments/collections" className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Collections</NavLink>
        <NavLink to="/comments/install" className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Install Guide</NavLink>
      </nav>

      {/* Overview */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 8px' }}>Overview</h3>
        <p style={{ margin: 0, color: '#444', lineHeight: 1.6 }}>
          The FEGC comment widget is a single JavaScript file that can be embedded on any Webflow page.
          It handles authentication via Memberstack, loads comments from Supabase, and renders a full
          commenting experience including rich text editing, image uploads, reactions, and threaded replies.
        </p>
      </div>

      {/* Prerequisites */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Prerequisites</h3>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: '#444' }}>
          <li>Memberstack 2.0 must be installed on the Webflow site (provides <code>window.$memberstackDom</code>)</li>
          <li>The CMS collection slug must be registered in the <strong>Collections</strong> tab and set to <strong>Enabled</strong></li>
          <li>Each CMS item needs a slug field used as the unique article identifier</li>
        </ol>
      </div>

      {/* Step 1: Register the collection */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Step 1: Register the Collection</h3>
        <p style={{ color: '#444', lineHeight: 1.6 }}>
          Go to <strong>Content &rarr; Collections</strong> in this admin panel. Add a new collection where
          the <strong>Slug</strong> matches your Webflow CMS collection slug exactly (e.g., <code>articles</code>, <code>courses</code>, <code>gear-reviews</code>).
          Make sure it is set to <strong>Enabled</strong>.
        </p>
      </div>

      {/* Step 2: Comment widget embed */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Step 2: Add the Comment Widget</h3>
        <p style={{ color: '#444', lineHeight: 1.6, marginBottom: 12 }}>
          On the CMS template page in Webflow, add an <strong>Embed</strong> element where you want the
          comments to appear. Paste the following code:
        </p>
        <pre style={{
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          padding: 16,
          borderRadius: 6,
          fontSize: 13,
          lineHeight: 1.6,
          overflowX: 'auto',
          whiteSpace: 'pre',
        }}>
{`<div id="fegc-comments"
     data-article-slug="{{slug}}"
     data-collection="YOUR_COLLECTION_SLUG">
</div>
<script src="https://dist-ecru-seven-95.vercel.app/comments/fegc-comments.js" defer></script>`}
        </pre>
        <p style={{ fontSize: 13, color: '#888', marginTop: 8, marginBottom: 0 }}>
          Replace <code>YOUR_COLLECTION_SLUG</code> with the slug you registered (e.g., <code>articles</code>).
          The <code>{'{{slug}}'}</code> value is the dynamic Webflow CMS field for the item's slug.
        </p>
      </div>

      {/* Step 3: Comment count badges */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Step 3: Add Comment Count Badges (Optional)</h3>
        <p style={{ color: '#444', lineHeight: 1.6, marginBottom: 12 }}>
          To display comment counts on collection list pages (e.g., an article index), add the following
          to each CMS item in the collection list:
        </p>
        <pre style={{
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          padding: 16,
          borderRadius: 6,
          fontSize: 13,
          lineHeight: 1.6,
          overflowX: 'auto',
          whiteSpace: 'pre',
        }}>
{`<span class="fegc-comment-count"
      data-article-slug="{{slug}}"
      data-collection="YOUR_COLLECTION_SLUG">
</span>`}
        </pre>
        <p style={{ fontSize: 13, color: '#888', marginTop: 8, marginBottom: 0 }}>
          The widget script batches all <code>.fegc-comment-count</code> elements on the page into a single
          API call for performance. The count number renders automatically.
        </p>
      </div>

      {/* Step 4: Deep linking */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Step 4: Deep Linking (Optional)</h3>
        <p style={{ color: '#444', lineHeight: 1.6 }}>
          The widget container uses <code>id="fegc-comments"</code>, so linking to
          {' '}<code>https://thefriedegg.com/your-article-slug#fegc-comments</code> will
          scroll directly to the comment section.
        </p>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#fff8e1', borderRadius: 8, border: '1px solid #ffe082' }}>
        <h3 style={{ margin: '0 0 12px' }}>Notes</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: '#444' }}>
          <li>The script tag only needs to appear <strong>once per page</strong>, even if you have both the comment widget and count badges</li>
          <li>The script is loaded with <code>defer</code> so it won't block page rendering</li>
          <li>Logged-out visitors see a CTA prompting them to join or log in</li>
          <li>Comments support rich text (bold, italic, links, lists, blockquotes, code), image attachments (up to 5), emoji reactions, and threaded replies</li>
          <li>Moderation (suspend, delete) is handled from the <strong>Comments</strong> tab in this admin panel</li>
          <li>To disable comments on an entire collection, toggle it off in <strong>Collections</strong></li>
        </ul>
      </div>

      {/* Script URL reference */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Script URL</h3>
        <code style={{ fontSize: 14, wordBreak: 'break-all' }}>
          https://dist-ecru-seven-95.vercel.app/comments/fegc-comments.js
        </code>
      </div>
    </div>
  );
}
