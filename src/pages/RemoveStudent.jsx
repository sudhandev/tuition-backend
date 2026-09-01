import { useState, useEffect } from 'react';
import {
  Search,
  UserRound,
  Trash2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RemoveStudent({ students, setStudents }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [search, setSearch] = useState('');

  // 1. Fetch students from the backend API when the page loads
  useEffect(() => {
    fetch(`${API_URL}/api/students`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data); // Updates the master list with data from backend database
      })
      .catch((err) => {
        console.error('Error fetching students:', err);
        toast.error('Failed to load students.');
      });
  }, [setStudents, API_URL]);

  // 2. Ensure students is an array before filtering
  const currentStudents = Array.isArray(students) ? students : [];

  const filteredStudents = currentStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.studentClass && student.studentClass.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRemove = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${student.name}?`
    );

    if (confirmed) {
      try {
        // Send a DELETE request to your backend API using the unique student ID
        const response = await fetch(`${API_URL}/api/students/${student.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Update the screen instantly by filtering out the deleted student
          const updatedStudents = currentStudents.filter((s) => s.id !== student.id);
          setStudents(updatedStudents);

          toast.success('Student removed and archived successfully!');
        } else {
          toast.error('Failed to remove student from database.');
        }
      } catch (error) {
        console.error('Error connecting to backend:', error);
        toast.error('Could not connect to the backend server.');
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-purple-600 hover:border-purple-200 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Remove Student
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Remove a student from your records
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={21} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-700">Important</p>
            <p className="text-sm text-red-600/80 mt-1">
              Removing a student will archive them into the previous students list. Make sure you select the correct student.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Search Student
          </label>
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or class..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
            />
          </div>
        </div>

        {/* Student List */}
        <div className="mt-6 space-y-3">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                      <UserRound size={23} className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-800 truncate">
                        {student.name}
                      </h2>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-slate-400">
                          Class: {student.studentClass}
                        </span>
                        <span className="text-xs text-slate-400">
                          Phone: {student.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(student)}
                    className="shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                  >
                    <Trash2 size={18} />
                    <span className="hidden sm:block font-semibold text-sm">
                      Remove
                    </span>
                  </button>

                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                <Search size={25} className="text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mt-4">
                No student found
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Try searching with a different name or class.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}