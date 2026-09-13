import { useState, useEffect } from 'react';
import { CheckCircle2, IndianRupee, Search, UserCheck, ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function FeesPaid() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [students, setStudents] = useState([]);
  const [paidMonthsLog, setPaidMonthsLog] = useState({}); // { studentId: ["2026-08","2026-09"] }
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all'); // 'all', 'current_cycle'

  const currentMonthKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/students`).then((res) => res.json()),
      fetch(`${API_URL}/api/fees/paid-months`).then((res) => res.json()),
    ])
      .then(([studentData, paidMonthsData]) => {
        setStudents(studentData);
        setPaidMonthsLog(paidMonthsData);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        toast.error('Failed to load fee records.');
      });
  }, [API_URL]);

  const hasPaidThisMonth = (studentId) =>
    (paidMonthsLog[studentId] || []).includes(currentMonthKey);

  const totalMonthsPaid = (studentId) => (paidMonthsLog[studentId] || []).length;

  // "All Paid": students with at least one recorded payment, ever
  const paidStudents = students.filter((student) => totalMonthsPaid(student.id) > 0);

  const filteredStudents = paidStudents.filter((student) => {
    if (cycleFilter === 'current_cycle' && !hasPaidThisMonth(student.id)) return false;
    return student.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const currentMonthCount = paidStudents.filter((s) => hasPaidThisMonth(s.id)).length;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-green-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-green-100 transition shadow-sm">
          <ArrowLeft size={16} /> Back to Main Page
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle2 size={28} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Fees Paid Management</h1>
            <p className="text-sm text-slate-400 mt-1">Students with zero pending dues</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search paid students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm text-slate-700 outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 px-1">
              <Filter size={14} /> Filter By:
            </span>
            <button
              onClick={() => setCycleFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                cycleFilter === 'all'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Paid ({paidStudents.length})
            </button>
            <button
              onClick={() => setCycleFilter('current_cycle')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                cycleFilter === 'current_cycle'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Current Month Cleared ({currentMonthCount})
            </button>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const months = totalMonthsPaid(student.id);
              const paidThisMonth = hasPaidThisMonth(student.id);

              return (
                <div key={student.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{student.name}</h3>
                      <p className="text-xs text-slate-400">{student.studentClass || 'Standard N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-green-600 font-bold text-lg flex items-center justify-end">
                      <IndianRupee size={16} />
                      {student.fees || 1000}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold uppercase bg-green-50 text-green-600">
                      {paidThisMonth ? 'Current Month Cleared' : `Paid (${months}m total)`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
            <UserCheck size={32} className="mx-auto text-green-500 mb-2" />
            <h3 className="font-bold text-slate-700">No records found matching this filter</h3>
            <p className="text-sm text-slate-400 mt-1">Try switching your filter category above.</p>
          </div>
        )}
      </div>
    </main>
  );
}