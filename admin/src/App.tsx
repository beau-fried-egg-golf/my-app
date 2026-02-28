import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase, supabaseAuth } from './supabase';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import CourseImport from './CourseImport';
import WriteupList from './WriteupList';
import WriteupDetail from './WriteupDetail';
import PhotoList from './PhotoList';
import PostList from './PostList';
import PostDetail from './PostDetail';
import UserList from './UserList';
import UserDetail from './UserDetail';
import MessageList from './MessageList';
import MeetupList from './MeetupList';
import MeetupForm from './MeetupForm';
import MeetupDetail from './MeetupDetail';
import FlagQueue from './FlagQueue';
import FEPostForm from './FEPostForm';
import EmailTemplates from './EmailTemplates';
import TeamList from './TeamList';
import GroupList from './GroupList';
import AnnotationList from './AnnotationList';
import AnnotationEditor from './AnnotationEditor';
import CancellationQueue from './CancellationQueue';
import ExperiencesDashboard from './ExperiencesDashboard';
import LocationList from './LocationList';
import LocationForm from './LocationForm';
import RoomTypeEditor from './RoomTypeEditor';
import InventoryCalendar from './InventoryCalendar';
import TeeTimeList from './TeeTimeList';
import TeeTimeManager from './TeeTimeManager';
import PackageList from './PackageList';
import PackageEditor from './PackageEditor';
import ReservationList from './ReservationList';
import ReservationDetail from './ReservationDetail';
import EventsDashboard from './EventsDashboard';
import EventList from './EventList';
import EventEditor from './EventEditor';
import EventBookingList from './EventBookingList';
import EventBookingDetail from './EventBookingDetail';
import EventWaitlist from './EventWaitlist';
import CommentList from './CommentList';
import CommentCollections from './CommentCollections';
import CommentDetail from './CommentDetail';
import CommentImport from './CommentImport';
import CommentInstall from './CommentInstall';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      if (!session) setAuthorized(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authed) {
      supabaseAuth.auth.getUser().then(({ data: { user } }) => {
        if (!user?.email) { setAuthorized(false); return; }
        supabase
          .from('admin_users')
          .select('id')
          .eq('email', user.email)
          .single()
          .then(({ data }) => setAuthorized(!!data));
      });
    }
  }, [authed]);

  if (authed === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  if (authorized === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Checking access...</div>;
  }

  if (!authorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 16 }}>
        <h2>Unauthorized</h2>
        <p style={{ color: '#888' }}>Your account does not have admin access.</p>
        <button className="btn" onClick={() => { supabaseAuth.auth.signOut(); setAuthed(false); setAuthorized(null); }}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/new" element={<CourseForm />} />
        <Route path="courses/:id/edit" element={<CourseForm />} />
        <Route path="courses/import" element={<CourseImport />} />
        <Route path="writeups" element={<WriteupList />} />
        <Route path="writeups/:id" element={<WriteupDetail />} />
        <Route path="photos" element={<PhotoList />} />
        <Route path="posts" element={<PostList />} />
        <Route path="posts/fe-post" element={<FEPostForm />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="users" element={<UserList />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="messages" element={<MessageList />} />
        <Route path="meetups" element={<MeetupList />} />
        <Route path="meetups/new" element={<MeetupForm />} />
        <Route path="meetups/:id" element={<MeetupDetail />} />
        <Route path="meetups/:id/edit" element={<MeetupForm />} />
        <Route path="flags" element={<FlagQueue />} />
        <Route path="cancellations" element={<CancellationQueue />} />
        <Route path="email-templates" element={<EmailTemplates />} />
        <Route path="team" element={<TeamList />} />
        <Route path="groups" element={<GroupList />} />
        <Route path="hole-annotations" element={<AnnotationList />} />
        <Route path="hole-annotations/:id/edit" element={<AnnotationEditor />} />
        <Route path="experiences" element={<ExperiencesDashboard />} />
        <Route path="experiences/locations" element={<LocationList />} />
        <Route path="experiences/locations/new" element={<LocationForm />} />
        <Route path="experiences/locations/:id/edit" element={<LocationForm />} />
        <Route path="experiences/locations/:id/rooms" element={<RoomTypeEditor />} />
        <Route path="experiences/locations/:id/inventory" element={<InventoryCalendar />} />
        <Route path="experiences/tee-times" element={<TeeTimeList />} />
        <Route path="experiences/tee-times/:courseId" element={<TeeTimeManager />} />
        <Route path="experiences/packages" element={<PackageList />} />
        <Route path="experiences/packages/new" element={<PackageEditor />} />
        <Route path="experiences/packages/:id/edit" element={<PackageEditor />} />
        <Route path="experiences/reservations" element={<ReservationList />} />
        <Route path="experiences/reservations/:id" element={<ReservationDetail />} />
        <Route path="events" element={<EventsDashboard />} />
        <Route path="events/list" element={<EventList />} />
        <Route path="events/new" element={<EventEditor />} />
        <Route path="events/:id/edit" element={<EventEditor />} />
        <Route path="events/:id/bookings" element={<EventBookingList />} />
        <Route path="events/:id/bookings/:bid" element={<EventBookingDetail />} />
        <Route path="events/:id/waitlist" element={<EventWaitlist />} />
        <Route path="comments" element={<CommentList />} />
        <Route path="comments/collections" element={<CommentCollections />} />
        <Route path="comments/import" element={<CommentImport />} />
        <Route path="comments/install" element={<CommentInstall />} />
        <Route path="comments/:id" element={<CommentDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
