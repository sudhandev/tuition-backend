import { useState, useEffect } from 'react';
import { UserX, Calendar, ArrowLeft, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PreviousStudents() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [deletedStudents, setDeletedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/deleted-students`)
      .then(res => res.json())
      .then(data => {
        setDeletedStudents(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching deleted students:', err);
        toast.error('Failed to load archive.');
        setLoading(false);
      });
  }, [API_URL]);

  const handleRestore = (id) => {
    fetch(`${API_URL}/api/students/restore/${id}`, {
      method: 'POST',
    })
      .then(res => res.json())
      .then((data) => {
        setDeletedStudents(deletedStudents.filter(student => student.id !== id));
        toast.success(data.message || 'Student restored successfully!');
      })
      .catch(err => {
        console.error('Error restoring student:', err);
        toast.error('Could not connect to server.');
      });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header & Back Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to="/attendance" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-purple-100 transition">
              <ArrowLeft size={16} /> Back to Daily Tracker
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Previous Students Archive</h1>
            <p className="text-sm text-slate-400 mt-1">View records of students who have left or restore them back to active classes</p>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <p className="text-sm font-medium">Loading archive...</p>
          </div>
        ) : deletedStudents.length > 0 ? (
          <div className="space-y-4">
            {deletedStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <UserX size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{student.name}</h3>
                    <p className="text-xs text-purple-600 font-medium">{student.studentClass || 'Standard N/A'}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Joined: {student.joiningDate || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <Calendar size={12} /> Left on: {student.deletedAt || 'N/A'}
                      </span>
                      <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Fee: ₹{student.fees || 1000} / mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Restore Button */}
                <button
                  onClick={() => handleRestore(student.id)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition shrink-0"
                >
                  <UserCheck size={16} /> Restore Student
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <UserX size={40} className="mx-auto mb-3 opacity-40 text-purple-600" />
            <h3 className="font-bold text-slate-700 text-base">No previous students found</h3>
            <p className="text-sm text-slate-400 mt-1">Students deleted from your active roster will appear here automatically.</p>
          </div>
        )}

      </div>
    </main>
  );
}