import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import our custom Sidebar component
import Navbar from './components/Navbar';
import MainPage from './pages/MainPage';
import AddStudent from './pages/AddStudent';
import RemoveStudent from './pages/RemoveStudent';
import Fees from './pages/Fees';
import TotalStudents from './pages/TotalStudents';
import TakeAttendance from './pages/TakeAttendance';
import AttendanceReport from './pages/AttendanceReport';
import PreviousStudents from './pages/PreviousStudents';
import WishThem from './pages/WishThem';
import FeesPaid from './pages/FeesPaid';
import FeesPending from './pages/FeesPending';
import Notes from './pages/Notes';
import FineTracker from './pages/FineTracker';

export default function App() {
  const [students, setStudents] = useState([]);

  return (
    <BrowserRouter>
      {/* Global Toast Notification System */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '1rem',
            fontSize: '13px',
            fontWeight: '600',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <Navbar />
      <div className="flex h-screen bg-gray-100">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto md:p-8 mt-24 ">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/add-student" element={<AddStudent students={students} setStudents={setStudents} />} />
            <Route path="/remove-student" element={<RemoveStudent students={students} setStudents={setStudents} />} />
            <Route path="/previous-students" element={<PreviousStudents />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/students" element={<TotalStudents />} />
            <Route path="/attendance" element={<TakeAttendance />} />
            <Route path="/attendance-report" element={<AttendanceReport />} />
            <Route path="/wish-them" element={<WishThem />} />
            <Route path='/fees-paid' element={<FeesPaid />} />
            <Route path='/fees-pending' element={<FeesPending />} />
            <Route path="/fines" element={<FineTracker />} />
            <Route path="/notes" element={<Notes />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}