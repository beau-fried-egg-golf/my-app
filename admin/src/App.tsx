import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
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
import FlagQueue from './FlagQueue';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authed === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/new" element={<CourseForm />} />
        <Route path="courses/:id/edit" element={<CourseForm />} />
        <Route path="writeups" element={<WriteupList />} />
        <Route path="writeups/:id" element={<WriteupDetail />} />
        <Route path="photos" element={<PhotoList />} />
        <Route path="posts" element={<PostList />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="users" element={<UserList />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="messages" element={<MessageList />} />
        <Route path="meetups" element={<MeetupList />} />
        <Route path="meetups/new" element={<MeetupForm />} />
        <Route path="meetups/:id/edit" element={<MeetupForm />} />
        <Route path="flags" element={<FlagQueue />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
