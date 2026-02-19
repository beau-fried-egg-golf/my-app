# FEGC App — Architecture & Design System Reference

> This document describes the full navigation structure, page inventory, component library, data models, design tokens, and UI patterns of the Fried Egg Golf Club mobile app. Use it as the source of truth for creating a web-optimized design system.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Navigation Hierarchy](#navigation-hierarchy)
3. [Route Map](#route-map)
4. [Screen Inventory](#screen-inventory)
5. [Shared Components](#shared-components)
6. [Design Tokens](#design-tokens)
7. [Data Models](#data-models)
8. [Global State (Stores)](#global-state)
9. [UI Patterns & Conventions](#ui-patterns--conventions)
10. [Current Desktop Responsive State](#current-desktop-responsive-state)

---

## Tech Stack

- **Framework:** Expo (React Native) with Expo Router (file-based routing)
- **Runtime:** Hermes (mobile), standard JS (web)
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage)
- **Payments:** Stripe (checkout sessions for meetup fees, experience bookings)
- **Maps:** Mapbox (native via `@rnmapbox/maps`, web via `react-map-gl`)
- **State:** React Context (two providers: `StoreProvider` for community, `ExperienceStoreProvider` for bookings)
- **Fonts:** Grey LL (Regular, Medium, Bold) — custom typeface loaded from `public/fonts/`
- **Deployment:** Vercel (web), EAS (iOS/Android builds)

---

## Navigation Hierarchy

```
SafeAreaProvider
  StoreProvider
    ExperienceStoreProvider
      Root Stack (_layout.tsx)
        |
        +-- (auth) Stack .................. shown when session === null
        |     +-- login
        |     +-- signup
        |     +-- forgot-password
        |
        +-- (tabs) Tabs ................... shown when session exists
        |     Tab bar: floating pill, 340px wide, centered, iOS blur bg
        |     Visible tabs: HOME | COURSES | MEETUPS | GROUPS | MEMBERS | MORE(...)
        |     Hidden tabs (href:null): conversations, notifications
        |     Desktop: DesktopSidebar replaces tab bar
        |     +-- index (Feed/Newsfeed)
        |     +-- courses
        |     +-- meetups
        |     +-- groups
        |     +-- members
        |     +-- more (opens bottom sheet, no actual route)
        |     +-- conversations
        |     +-- notifications
        |
        +-- (experiences) Stack ........... golf booking/travel section
        |     ExperiencesTabBar (mobile only, hidden on desktop)
        |     Desktop: shares DesktopSidebar
        |     +-- index (Experiences Home)
        |     +-- location/[id]
        |     +-- package/[id]
        |     +-- lodging
        |     +-- room/[id]
        |     +-- tee-times
        |     +-- book-lodging
        |     +-- book-tee-time
        |     +-- book-package
        |     +-- reservations
        |     +-- reservation/[id]
        |
        +-- Detail Screens (Root Stack, push navigation)
        |     +-- course/[id]
        |     +-- writeup/[id]
        |     +-- post/[id]
        |     +-- member/[id]
        |     +-- group/[id]
        |     +-- meetup/[id]
        |     +-- conversation/[id] (1:1 DM chat)
        |     +-- group-chat/[id]
        |     +-- meetup-chat/[id]
        |
        +-- Modal Screens (presentation: modal or fullScreenModal)
              +-- profile
              +-- edit-profile
              +-- create-writeup
              +-- create-post
              +-- create-group
              +-- create-meetup
              +-- onboarding (fullScreenModal)
              +-- reset-password
```

---

## Route Map

### Auth Routes

| Route | File | Description |
|-------|------|-------------|
| `/login` | `(auth)/login.tsx` | Email + password login |
| `/signup` | `(auth)/signup.tsx` | Name + email + password registration |
| `/forgot-password` | `(auth)/forgot-password.tsx` | Email-based password reset |

### Tab Routes (Community)

| Route | File | Tab Visible | Description |
|-------|------|-------------|-------------|
| `/` | `(tabs)/index.tsx` | Yes | Activity feed (posts, reviews, events) |
| `/courses` | `(tabs)/courses.tsx` | Yes | Course directory with list/map views |
| `/meetups` | `(tabs)/meetups.tsx` | Yes | Meetup directory (my/upcoming) |
| `/groups` | `(tabs)/groups.tsx` | Yes | Groups directory (my/discover) |
| `/members` | `(tabs)/members.tsx` | Yes | Member directory |
| `/more` | `(tabs)/more.tsx` | Yes (opens modal) | Bottom sheet with Pro Shop, Trip Planning links |
| `/conversations` | `(tabs)/conversations.tsx` | No (header pill) | Unified inbox: DMs, Group chats, Meetup chats |
| `/notifications` | `(tabs)/notifications.tsx` | No (header pill) | Notification list |

### Experience Routes

| Route | File | Description |
|-------|------|-------------|
| `/(experiences)` | `(experiences)/index.tsx` | Experiences home — hero, featured packages, locations |
| `/(experiences)/location/[id]` | `(experiences)/location/[id].tsx` | Location detail (lodging, tee times, packages at location) |
| `/(experiences)/package/[id]` | `(experiences)/package/[id].tsx` | Package detail with itinerary, booking CTA |
| `/(experiences)/lodging` | `(experiences)/lodging.tsx` | Browse all lodging locations |
| `/(experiences)/room/[id]` | `(experiences)/room/[id].tsx` | Room type detail with gallery, booking |
| `/(experiences)/tee-times` | `(experiences)/tee-times.tsx` | Browse tee times by course and date |
| `/(experiences)/book-lodging` | `(experiences)/book-lodging.tsx` | Lodging booking flow |
| `/(experiences)/book-tee-time` | `(experiences)/book-tee-time.tsx` | Tee time booking flow |
| `/(experiences)/book-package` | `(experiences)/book-package.tsx` | Package booking flow |
| `/(experiences)/reservations` | `(experiences)/reservations.tsx` | My reservations (upcoming/past/cancelled) |
| `/(experiences)/reservation/[id]` | `(experiences)/reservation/[id].tsx` | Reservation detail with line items |

### Detail Routes (Root Stack)

| Route | File | Description |
|-------|------|-------------|
| `/course/[id]` | `app/course/[id].tsx` | Course detail: hero, reviews, photos, meetups |
| `/writeup/[id]` | `app/writeup/[id].tsx` | Review detail with reply thread |
| `/post/[id]` | `app/post/[id].tsx` | Post detail with reply thread |
| `/member/[id]` | `app/member/[id].tsx` | Member profile: stats, groups, passport |
| `/group/[id]` | `app/group/[id].tsx` | Group detail: members, join/leave, chat |
| `/meetup/[id]` | `app/meetup/[id].tsx` | Meetup detail: roster, payments, waitlist |
| `/conversation/[id]` | `app/conversation/[id].tsx` | 1:1 DM chat |
| `/group-chat/[id]` | `app/group-chat/[id].tsx` | Group chat with @mentions |
| `/meetup-chat/[id]` | `app/meetup-chat/[id].tsx` | Meetup chat with @mentions |

### Modal Routes

| Route | File | Presentation | Description |
|-------|------|-------------|-------------|
| `/profile` | `app/profile.tsx` | Modal | Own profile, settings, notification prefs |
| `/edit-profile` | `app/edit-profile.tsx` | Modal | Edit profile form |
| `/create-writeup` | `app/create-writeup.tsx` | Modal | Write a course review |
| `/create-post` | `app/create-post.tsx` | Modal | Create a social post |
| `/create-group` | `app/create-group.tsx` | Modal | Create/edit a group |
| `/create-meetup` | `app/create-meetup.tsx` | Modal | Create/edit a meetup |
| `/onboarding` | `app/onboarding.tsx` | fullScreenModal | New member setup |
| `/reset-password` | `app/reset-password.tsx` | Default | Password reset form |

---

## Screen Inventory

### Feed / Newsfeed (`(tabs)/index.tsx`)

**Purpose:** Main activity feed showing all member activity.

**UI Elements:**
- ALL / FOLLOWING filter tabs (segmented control)
- LinkedIn-style create bar on desktop (avatar + "Start a post..." pill + Review/Post/Invite actions)
- FlatList of ActivityItem cards (8 activity types: post, writeup, played, group_created, meetup_created, meetup_signup, post_reply, writeup_reply)
- "Members to Follow" recommendation ribbon (dismissable, shows top 3 unfollowed members)
- Floating + FAB (mobile only) opens bottom sheet: Review, Post, Invite
- Invite modal (email + personal note)
- TutorialPopup welcome message

**Data:** `activities`, `writeups`, `profiles`, `posts`, `followingIds`

**Navigation targets:** `/create-writeup`, `/create-post`, `/writeup/[id]`, `/post/[id]`, `/course/[id]`, `/group/[id]`, `/meetup/[id]`, `/members`

---

### Courses (`(tabs)/courses.tsx`)

**Purpose:** Full course directory with filtering, sorting, list/map toggle.

**UI Elements:**
- Toolbar: Open/Close Filters button (with active count badge), List/Map toggle, A-Z/Nearby sort
- Filter panel (collapsible): Access (all/public/private), Distance (<25/<50/<100 mi), Reviews, FE Profile
- FlatList with course cards: WordHighlight name, city/state, distance, review count, FE profile indicator, upcoming meetup callout
- Floating search bar (pill, positioned above tab bar on mobile, bottom-24 on desktop)
- Map view: Mapbox with orange dot pins, course selection bottom sheet
- Load More pagination (15 at a time)

**Data:** `courses`, `writeups`, `meetups`, user location (expo-location)

**Navigation targets:** `/course/[id]`, `/meetup/[id]`

---

### Meetups (`(tabs)/meetups.tsx`)

**Purpose:** Meetup directory with "My Meetups" and "Upcoming" sections.

**UI Elements:**
- DATE / NEARBY sort toggle
- LinkedIn-style create bar on desktop
- FlatList with MeetupRow: image, name, FE-coordinated badge, date/time, location, spots remaining, cost, distance
- Floating + FAB (mobile only)
- TutorialPopup

**Data:** `meetups`, `courses`, user location

**Navigation targets:** `/meetup/[id]`, `/create-meetup`

---

### Groups (`(tabs)/groups.tsx`)

**Purpose:** Groups directory with "My Groups" and "Discover" sections.

**UI Elements:**
- A-Z / NEARBY sort toggle
- LinkedIn-style create bar on desktop
- FlatList with GroupRow: image, name, member count, home course, location, distance
- Floating + FAB (mobile only)
- TutorialPopup

**Data:** `groups`, `courses`, user location

**Navigation targets:** `/group/[id]`, `/create-group`

---

### Members (`(tabs)/members.tsx`)

**Purpose:** Member directory with search and sort.

**UI Elements:**
- NEARBY / A-Z sort toggle
- FlatList with member rows: avatar, name, verified badge, city/state, review count, courses played, distance
- Floating search bar (same pill style as courses)

**Data:** `profiles`, `writeups`, `coursesPlayed`, `courses`

**Navigation targets:** `/member/[id]`, `/profile`

---

### Conversations (`(tabs)/conversations.tsx`)

**Purpose:** Unified inbox for DMs, group chats, and meetup chats.

**UI Elements:**
- 3-tab segmented control: DMS / GROUPS / MEETUPS (with unread dots)
- FlatList/SectionList of ConversationRow: avatar, name, member count, last message preview, timestamp, unread dot
- Meetups tab uses SectionList with UPCOMING / PAST sections
- TutorialPopup
- Polls every 5 seconds

**Data:** `conversationListItems`

**Navigation targets:** `/conversation/[id]`, `/group-chat/[id]`, `/meetup-chat/[id]`

---

### Notifications (`(tabs)/notifications.tsx`)

**Purpose:** Chronological notification list.

**UI Elements:**
- "MARK ALL READ" button (shown when unread exist)
- FlatList of NotificationItem: actor avatar or icon circle, rich text (bold/normal parts), timestamp, unread orange dot
- Unread items have tinted background (#FFF8F5)

**Notification types:** upvote, meetup_signup, group_join, meetup_reminder_7d, meetup_reminder_1d, post_reply, writeup_reply, waitlist_spot_available, cancellation_approved, cancellation_denied

**Data:** `notifications`, `hasUnreadNotifications`

**Navigation targets:** `/writeup/[id]`, `/post/[id]`, `/meetup/[id]`, `/group/[id]`

---

### Course Detail (`app/course/[id].tsx`)

**Purpose:** Full course page with reviews, photos, and meetups.

**UI Elements:**
- Hero image (FE hero, top member photo, or Mapbox satellite fallback)
- Course name (LetterSpacedHeader), address, attribute tags (WordHighlight: public/private, holes, par, est.)
- Description text
- FE profile section (EggRating, link to profile)
- "Mark Played" button with DateTimePicker modal
- 3-tab inner navigator: Reviews / Photos / Meetups
- Reviews: MOST LIKED, MOST LIKED VERIFIED, MOST RECENT sections with WriteupCard
- Photos: grid with fullscreen gallery modal (horizontal paging, upvote)
- Meetups: upcoming meetups at this course
- Report inaccuracy modal

**Data:** `courses`, `writeups`, `meetups`, `coursesPlayed`, user profile

---

### Member Profile (`app/member/[id].tsx`)

**Purpose:** Public member profile page.

**UI Elements:**
- DetailHeader with "MEMBER" title
- Avatar, name, verified badge, city/state
- Follow / Message action buttons
- Stats row: Followers / Following / Reviews / Courses
- Details: handicap, home course, member since
- Groups list (with images)
- Course Passport (PassportBook) if played any courses

**Data:** `profiles`, `writeups`, `coursesPlayed`, `courses`, `groups`, follows

---

### Meetup Detail (`app/meetup/[id].tsx`)

**Purpose:** Full meetup page with roster, payments, and waitlist.

**UI Elements:**
- DetailHeader with "MEETUP" title
- Hero image, name, FE-coordinated badge, date/time, location, cost
- Dynamic action buttons: Join / Reserve & Pay (Stripe) / Meetup Chat / Leave / Withdraw & Refund / Join Waitlist / Leave Waitlist / Request Cancellation
- Cancellation policy notice (7-day rule)
- Attendees roster with payment status badges (Paid/Pending/Free)
- Waitlist section with position
- Host controls: Edit, Delete, Add Members (search picker)

**Data:** `meetups`, `profiles`, meetup members, waitlist entries, cancellation requests

---

### Group Detail (`app/group/[id].tsx`)

**Purpose:** Group page with members and actions.

**UI Elements:**
- DetailHeader with "GROUP" title
- Hero image, name, location, member count
- Join/Leave + Group Chat buttons
- Creator, home course, description
- Full member roster with role badges (Creator/Admin)
- Creator controls: Edit, Delete

**Data:** `groups`, group members

---

### Chat Screens (`conversation/[id]`, `group-chat/[id]`, `meetup-chat/[id]`)

**Purpose:** Real-time messaging.

**UI Elements:**
- Custom header (back arrow, name/avatar, 3-dot menu for block/unblock on DMs)
- FlatList of MessageBubble components (own = black bg, other = light gray bg)
- Long-press context menu: 6 emoji reactions + Reply
- ReplyPreviewBar when replying
- EmojiPicker (grid of 40 emojis)
- MentionAutocomplete for group/meetup chats (@mentions)
- Text input with send button
- Polls every 5 seconds

---

### Writeup Detail (`app/writeup/[id].tsx`)

**Purpose:** Full review page with reply thread.

**UI Elements:**
- Title, author name, verified badge, course name (WordHighlight), date
- Content text
- Photo gallery with upvote
- Reaction buttons (like/love/fire/laugh with counts)
- Edit/delete for own writeups (inline editing mode)
- Reply thread (FlatList)
- Reply input bar

---

### Post Detail (`app/post/[id].tsx`)

**Purpose:** Full post page with reply thread.

**UI Elements:**
- Author, content, optional photos, optional link preview
- Reaction buttons
- Reply thread
- Reply input bar
- Edit/delete for own posts

---

### Profile (`app/profile.tsx`) — Modal

**Purpose:** Current user's settings and profile.

**UI Elements:**
- Avatar, name, city/state
- Stats row: Followers / Following / Reviews / Courses
- Details: handicap, home course, member since
- DMs toggle
- Notification settings: Push toggles (DMs, Activity, Nearby with radius selector), Email toggle
- Course Passport (PassportBook)
- Edit Profile / Sign Out buttons

---

### Experiences Home (`(experiences)/index.tsx`)

**Purpose:** Experiences landing page / dashboard.

**UI Elements:**
- Hero banner (image with overlay, "EXPERIENCES" LetterSpacedHeader, subtitle)
- Featured Packages (horizontal scroll of package cards)
- Browse tiles (Lodging, Tee Times — image tiles with overlay)
- Locations list (image, name, city/state, description)
- Upcoming Reservations strip
- TutorialPopup

---

### Create/Edit Modals

| Modal | Key Fields |
|-------|-----------|
| **create-writeup** | Course selector (searchable, distance-sorted), title, content, photos with captions |
| **create-post** | Content text, optional photos, optional link URL (with preview) |
| **create-meetup** | Name, description, course, location, date/time, cost, slots, image. Admin: FE-coordinated, Stripe URL |
| **create-group** | Name, description, home course, location, image |
| **edit-profile** | Photo, name, address, city, state, ZIP, handicap, home course, favorite ball |
| **onboarding** | Photo, address, city, state, ZIP, handicap, home course, favorite ball |

---

## Shared Components

### Brand / Identity

| Component | File | Description |
|-----------|------|-------------|
| `LetterSpacedHeader` | `components/LetterSpacedHeader.tsx` | Bold block-print heading — each letter in its own colored box. `variant: 'default'` (orange bg, black text) or `'experiences'` (black bg, white text) |
| `WordHighlight` | `components/WordHighlight.tsx` | Row of words, each in an orange pill/box. Used for course names, attribute tags |
| `EggRating` | `components/EggRating.tsx` | Fried Egg editorial rating display (0-3 eggs visual + label) |
| `VerifiedBadge` | `components/VerifiedBadge.tsx` | Green checkmark circle (Ionicons) for verified members |
| `PassportBook` | `components/PassportBook.tsx` | Horizontally-paged "Course Passport" showing stamp grid of courses played |
| `PassportStamp` | `components/PassportStamp.tsx` | SVG passport stamp for a single course (deterministic shape from courseId hash) |

### Navigation / Layout

| Component | File | Description |
|-----------|------|-------------|
| `DetailHeader` | `components/DetailHeader.tsx` | Back button + LetterSpacedHeader title bar for detail screens |
| `DesktopSidebar` | `components/DesktopSidebar.tsx` | 220px left nav sidebar (desktop only). COMMUNITY + EXPERIENCES sections |
| `ResponsiveContainer` | `components/ResponsiveContainer.tsx` | `maxWidth: 720` centered wrapper on desktop, passthrough on mobile |
| `DesktopCreateBar` | `components/DesktopCreateBar.tsx` | LinkedIn-style create bar (avatar + pill + action buttons) |
| `ExperiencesTabBar` | `components/experiences/ExperiencesTabBar.tsx` | Floating pill tab bar for Experiences section (mobile only) |
| `HapticTab` | `components/haptic-tab.tsx` | Tab bar button with haptic feedback |
| `PlatformPressable` | `components/PlatformPressable.tsx` | Cross-platform pressable (haptic on iOS, ripple on Android, plain on web) |

### Content Display

| Component | File | Description |
|-----------|------|-------------|
| `LinkPreview` | `components/LinkPreview.tsx` | OG-style link preview card (image, title, description, domain) |
| `TutorialPopup` | `components/TutorialPopup.tsx` | One-time modal popup persisted via AsyncStorage |
| `CourseMapSheet` | `components/course-map-sheet.tsx` | Bottom sheet when course selected on map |

### Map

| Component | File | Description |
|-----------|------|-------------|
| `CourseMap` (native) | `components/course-map.native.tsx` | Mapbox native map with orange pins |
| `CourseMap` (web) | `components/course-map.web.tsx` | Mapbox GL JS web map |

### Chat

| Component | File | Description |
|-----------|------|-------------|
| `MessageBubble` | `components/chat/MessageBubble.tsx` | Chat message bubble (own=black, other=lightGray). Supports @mention bolding, reply preview, reactions |
| `ReactionBadges` | `components/chat/ReactionBadges.tsx` | Emoji reaction counts below messages |
| `ReplyPreviewBubble` | `components/chat/ReplyPreview.tsx` | Quoted message inside a bubble |
| `ReplyPreviewBar` | `components/chat/ReplyPreview.tsx` | Bar above input when composing a reply |
| `EmojiPicker` | `components/chat/EmojiPicker.tsx` | Grid of 40 emoji options |
| `MentionAutocomplete` | `components/chat/MentionAutocomplete.tsx` | @mention dropdown for group/meetup chats |
| `MessageContextMenu` | `components/chat/MessageContextMenu.tsx` | Long-press menu: 6 quick reactions + Reply |

### Experiences / Booking

| Component | File | Description |
|-----------|------|-------------|
| `DateRangePicker` | `components/experiences/DateRangePicker.tsx` | 2-month inline calendar for check-in/out |
| `TeeTimeRow` | `components/experiences/TeeTimeRow.tsx` | Tee time slot row with player dots and price |
| `PackageCard` | `components/experiences/PackageCard.tsx` | Curated package card with hero image |
| `RoomCard` | `components/experiences/RoomCard.tsx` | Room type card with gallery, price, availability |
| `BookingSummary` | `components/experiences/BookingSummary.tsx` | Receipt-style line item summary |

### Icons (`components/icons/CustomIcons.tsx`)

All SVG, accept `{ size?: number; color?: string }`:

| Icon | Usage |
|------|-------|
| `ClubhouseIcon` | Newsfeed/Home tab |
| `CoursesIcon` | Courses tab |
| `MeetupsIcon` | Meetups tab |
| `GroupsIcon` | Groups tab |
| `MembersIcon` | Members tab |
| `MessagingIcon` | Messages tab |
| `NotificationsIcon` | Alerts tab |
| `GolfBagIcon` | Tee Times / Experiences |
| `SearchIcon` | Search bars |
| `EditIcon` | Edit actions |
| `SignOutIcon` | Sign out |
| `FlagIcon` | Golf flag |

---

## Design Tokens

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.black` | `#000000` | Primary text, button fills, chat own-bubbles |
| `Colors.white` | `#FFFFFF` | Backgrounds, surfaces |
| `Colors.gray` | `#888888` | Secondary text, muted labels, timestamps |
| `Colors.lightGray` | `#E5E5E5` | Borders, dividers, inactive backgrounds, placeholders |
| `Colors.darkGray` | `#333333` | Body text (slightly softer than black) |
| `Colors.border` | `#D0D0D0` | Input borders, card borders |
| `Colors.orange` | `#FE4D12` | Brand primary — active states, CTAs, badges, map pins, WordHighlight bg |
| `Colors.feYellow` | `#FFEE54` | Featured badges in Experiences |

**Semantic colors used inline (not tokenized):**

| Color | Hex | Usage |
|-------|-----|-------|
| Verified green | `#22C55E` | VerifiedBadge checkmark |
| Stripe purple | `#635BFF` | Stripe payment buttons |
| Unread bg | `#FFF8F5` | Unread notification row background |
| Active nav tint | `#FFF0EB` | Desktop sidebar active item background |
| Reaction active | `#E8E0FF` / `#8B5CF6` | Purple tint for active emoji reactions |
| Payment pending | `#FFF3CD` / `#856404` | Pending payment badge |
| Payment confirmed | `#D4EDDA` / `#155724` | Confirmed payment badge |
| Waitlist blue | `#E8F4FD` / `#0C5460` | Waitlist badge |
| Amber warning | `#D97706` | Limited availability dates, low room count |
| Red sold out | `#DC2626` | Sold out rooms |

### Typography

**Font Family:** Grey LL (custom)

| Token | iOS | Web | Android |
|-------|-----|-----|---------|
| `Fonts.sans` | `GreyLL-Regular` | `'Grey LL', system-ui, -apple-system, ...sans-serif` | `GreyLL-Regular` |
| `Fonts.sansMedium` | `GreyLL-Medium` | same stack | `GreyLL-Medium` |
| `Fonts.sansBold` | `GreyLL-Bold` | same stack | `GreyLL-Bold` |
| `Fonts.serif` | `ui-serif` | `Georgia, 'Times New Roman', serif` | `serif` |
| `Fonts.mono` | `ui-monospace` | `SFMono-Regular, Menlo, Monaco, ...monospace` | `monospace` |

**Font Weights:**

| Token | Value |
|-------|-------|
| `FontWeights.regular` | `'400'` |
| `FontWeights.medium` | `'500'` |
| `FontWeights.bold` | `'700'` |

**Common font size scale (observed from screens):**

| Size | Usage |
|------|-------|
| 11px | Tiny labels (filter count, letter spacing headers, status badges) |
| 12px | Timestamps, sort buttons, section headers, small meta |
| 13px | Secondary meta text, filter chips, group/meetup meta |
| 14px | Body-small, link preview description, post preview |
| 15px | Body text, notification text, chat messages, nav labels |
| 16px | List item titles (member name, group name, meetup name) |
| 18px | Section titles, empty state titles |
| 20px | Heading-medium |
| 24px | Heading-large (hero titles) |
| 32px | LetterSpacedHeader default size |

### Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Desktop breakpoint | `768px` | `useIsDesktop()` threshold |
| Content max-width | `720px` | `ResponsiveContainer` |
| Sidebar width | `220px` | `DesktopSidebar` |
| Desktop header height | `64px` | `DesktopTabHeader` |
| Mobile tab bar width | `340px` | Floating pill tab bar |
| Mobile tab bar height | `56px` | Floating pill tab bar |
| Tab bar border radius | `28px` | Pill shape |
| Standard horizontal padding | `16px` | Most screen content |
| Card border radius | `10-12px` | Cards, modals |
| Avatar sizes | `26, 30, 36, 40, 44, 48px` | Various contexts |
| FAB size | `52x52px` | Floating action button |
| FAB border radius | `26px` | Circle |

### Shadows

| Usage | Shadow |
|-------|--------|
| Tab bar / FAB / Search bar | `shadowColor: #000`, `shadowOffset: {0, 4}`, `shadowOpacity: 0.12`, `shadowRadius: 16`, `elevation: 8` |
| Header pill / Back button | `shadowColor: #000`, `shadowOffset: {0, 1}`, `shadowOpacity: 0.12`, `shadowRadius: 4`, `elevation: 2` |
| Package cards | `shadowColor: #000`, `shadowOffset: {0, 2}`, `shadowOpacity: 0.08`, `shadowRadius: 8`, `elevation: 3` |

---

## Data Models

### Core Community Models

```
Profile {
  id, name, image, street_address, city, state, zip,
  handicap, home_course_id, favorite_ball, member_since,
  is_verified, dms_disabled, suspended,
  expo_push_token, push_dm_enabled, push_notifications_enabled,
  push_nearby_enabled, push_nearby_radius_miles, email_notifications_enabled
}

Course {
  id, name, short_name, address, city, state, country,
  is_private, holes, par, year_established, description,
  latitude, longitude,
  fe_hero_image, fe_profile_url, fe_profile_author,
  fe_egg_rating (0-3 or null), fe_bang_for_buck, fe_profile_date
}

Writeup {  // Course review
  id, user_id, course_id, title, content, created_at, hidden,
  photos: Photo[], reactions: {like, love, fire, laugh},
  user_reactions: string[], reply_count, author_name, author_verified
}

Post {  // Social feed post
  id, user_id, content, created_at, hidden,
  photos: PostPhoto[], reactions, user_reactions, reply_count,
  link_url, link_title, link_description, link_image,
  author_name, author_verified
}

Activity {  // Feed event
  id, type, user_id, writeup_id, post_id, course_id,
  target_user_id, group_id, meetup_id, created_at,
  + enriched display fields (user_name, course_name, etc.)
  Types: writeup, upvote, played, post, group_created,
         meetup_created, meetup_signup, post_reply, writeup_reply
}

Group {
  id, name, description, creator_id, home_course_id,
  latitude, longitude, location_name, image,
  creator_name, home_course_name, member_count, is_member,
  _last_message, _last_message_at, _has_unread
}

Meetup {
  id, name, description, host_id, course_id, location_name,
  meetup_date, cost, total_slots, host_takes_slot, image,
  is_fe_coordinated, stripe_payment_url, cost_cents,
  host_name, member_count, waitlist_count, is_member,
  _last_message, _last_message_at, _has_unread
}

Conversation { id, user1_id, user2_id, other_user_name, other_user_image, last_message, unread }
Message { id, conversation_id, user_id, content, created_at, reply_to_id, reply_to, reactions }
GroupMessage { id, group_id, user_id, content, sender_name, sender_image, reply_to_id, reactions }
MeetupMessage { same as GroupMessage but meetup_id }

Notification {
  id, user_id, type, actor_id, writeup_id, post_id, meetup_id, group_id,
  is_read, created_at, + enriched display fields
}

Follow { id, follower_id, following_id }
CoursePlayed { id, user_id, course_id, date_played }
UserBlock { id, blocker_id, blocked_id }
CancellationRequest { id, meetup_id, user_id, member_id, note, status, admin_note }
WaitlistEntry { id, meetup_id, user_id, position, user_name, user_image }
```

### Experiences / Booking Models

```
ExperienceLocation {
  id, name, slug, type (lodge/course/resort/private_club/public_course/destination),
  description, short_description, city, state, latitude, longitude,
  hero_image, images[], amenities[], check_in_time, check_out_time,
  cancellation_policy (flexible/moderate/strict), is_active
}

RoomType {
  id, location_id, name, description, images[], max_occupancy,
  bed_configuration, amenities[], base_price_per_night (cents), sort_order
}

TeeTimeSlot {
  id, course_id, date, time, max_players, price_per_player (cents),
  is_blocked, booked_players (computed)
}

Package {
  id, name, slug, description, hero_image, images[], location_id,
  price_per_person (cents), max_group_size, min_group_size, duration_nights,
  is_featured, tags[], inclusions[], exclusions[], cancellation_policy
}

PackageItem {
  id, package_id, day_number, type (lodging/tee_time/meal/transport/other),
  title, description, room_type_id, course_id, start_time, end_time
}

Reservation {
  id, user_id, type (lodging/tee_time/package),
  status (pending/confirmed/cancelled/completed/no_show),
  check_in_date, check_out_date, total_price (cents),
  stripe_payment_intent_id, special_requests
}

ReservationItem {
  id, reservation_id, type (room_night/tee_time/meal/fee/discount),
  description, date, unit_price (cents), quantity, subtotal (cents)
}
```

---

## Global State

### `useStore()` — Community Store

**Loaded on mount (auto-refresh):** `courses`, `profiles`, `writeups`, `activities`, `posts`, `follows`, `coursesPlayed`, `conversations`, `groups`, `meetups`, `notifications`

**Key derived values:**
- `followingIds: Set<string>` — who current user follows
- `hasUnreadMessages: boolean` — any DM/group/meetup unread
- `hasUnreadNotifications: boolean`
- `conversationListItems: ConversationListItem[]` — unified sorted inbox
- `isAdmin: boolean`

**Key actions:** `signIn`, `signUp`, `signOut`, `saveUser`, `addWriteup`, `addPost`, `toggleFollow`, `joinGroup`, `leaveGroup`, `joinMeetup`, `leaveMeetup`, `sendMessage`, `sendGroupMessage`, `sendMeetupMessage`, `markNotificationRead`, `blockUser`, `unblockUser`, `createCheckoutSession`, `requestCancellation`, `joinWaitlist`, `leaveWaitlist`

### `useExperienceStore()` — Booking Store

**Data:** `locations`, `experienceCourses`, `packages`, `featuredPackages`, `myReservations`

**Key actions:** `checkLodgingAvailability`, `checkTeeTimeAvailability`, `checkPackageAvailability`, `createReservation`, `createPackageReservation`, `confirmReservation`, `cancelReservation`

---

## UI Patterns & Conventions

### Headers
- **Tab screens (mobile):** LetterSpacedHeader title (orange block-print) + HeaderRight pill (notifications, messages, profile avatar)
- **Tab screens (desktop):** No per-screen header; DesktopTabHeader shows HeaderRight pill only
- **Detail screens:** DetailHeader component (back button circle + LetterSpacedHeader)
- **Experiences screens:** Custom headers with back button and LetterSpacedHeader variant="experiences" (black blocks)
- **Chat screens:** Custom header with name, avatar, and menu

### Lists
- FlatList for flat data, SectionList for grouped data (meetup conversations)
- `ItemSeparatorComponent`: 1px lightGray line, often with left margin (64-72px) to clear avatars
- `ListEmptyComponent`: centered icon + title + subtitle
- `contentContainerStyle` for padding

### Cards
- White background, 1px lightGray border or subtle shadow
- `borderRadius: 10-12`
- Consistent padding: 12-16px

### Floating Elements
- **FAB:** 52x52 white circle, bottom-right, heavy shadow. Hidden on desktop (replaced by DesktopCreateBar)
- **Search bars:** Pill shape (borderRadius: 22), positioned absolute above tab bar on mobile, bottom-24 on desktop
- **Tab bar:** Floating pill, centered, iOS blur background

### Modals
- Bottom sheets: slide up with dark backdrop (rgba(0,0,0,0.3))
- Center modals: dark backdrop (rgba(0,0,0,0.5)), white card, borderRadius: 12, maxWidth: 400
- All use React Native Modal with `transparent` + `animationType="fade"`

### Active/Selected States
- Tab bar: orange tint color
- Sort buttons: orange background fill
- Filter chips: orange background fill
- Sidebar nav: light orange background (#FFF0EB) + orange text
- Segmented controls: black bottom border on active tab

### Badges & Indicators
- Unread dots: 8-9px orange circles
- Verified: green checkmark (VerifiedBadge)
- FE-coordinated: small FE icon image
- Payment status: colored pill badges (green=paid, yellow=pending, blue=waitlist)

### Reactions
- Emoji set: like (thumbs up), love (heart), fire, laugh
- Chat reactions: heart, thumbs up/down, laugh, !!, ?
- Active reaction: purple tint background

---

## Current Desktop Responsive State

The app has a basic desktop-responsive layer gated behind `useIsDesktop()` (>= 768px viewport):

### What exists:
- `DesktopSidebar` (220px) with COMMUNITY and EXPERIENCES nav sections
- `ResponsiveContainer` wrapping all tab screens and detail screens (720px max-width, centered)
- Bottom tab bar hidden on desktop
- Mobile headers hidden on desktop, replaced by `DesktopTabHeader` (just HeaderRight pill)
- FABs hidden on desktop, replaced by `DesktopCreateBar` (LinkedIn-style)
- Experiences layout also gets sidebar + hidden mobile tab bar
- Search bars repositioned (bottom-24 instead of above tab bar)

### What does NOT exist yet:
- No hover states or cursor changes
- No keyboard shortcuts
- No multi-column layouts (everything is single-column at 720px)
- No web-specific navigation (breadcrumbs, URL-driven state)
- No dark mode
- No responsive typography scaling
- Chat screens are full-screen (no sidebar panel pattern)
- Modals still use mobile bottom-sheet / center-modal patterns
- No web-optimized form inputs
- Auth screens not modified
- Profile modal not modified
- Create/edit modals not modified

---

## Asset Inventory

### Images
- `assets/images/FriedEggGolfClub_Horizontal_Black.png` — horizontal logo (sidebar, desktop header)
- `assets/images/FEGC App Icon.png` — app icon (splash, tutorial popup)
- `assets/images/fe-icon.png` — small FE badge icon
- `assets/images/experiences-hero.jpg` — experiences landing hero
- `assets/icons/egg-{0,1,2,3}.{svg,png}` — egg rating icons

### Fonts (loaded from `public/fonts/`)
- `GreyLLTT-Regular.ttf`
- `GreyLLTT-Medium.ttf`
- `GreyLLTT-Bold.ttf`
