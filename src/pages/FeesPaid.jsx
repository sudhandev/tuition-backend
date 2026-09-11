import { useState, useEffect } from 'react';
import { CheckCircle2, IndianRupee, Search, UserCheck, ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function FeesPaid() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all'); // 'all', 'current_cycle'

  const checkFeeCycle = (joiningDate, monthlyFee = 0, paidMonthsCount = 0) => {
    if (!joiningDate) return { isDue: false, hasStarted: false, remainingMonths: 0, totalDueAmount: 0, expectedCycles: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const joinDate = new Date(joiningDate);
    joinDate.setHours(0, 0, 0, 0);

    if (today < joinDate) {
      return { isDue: false, hasStarted: false, remainingMonths: 0, totalDueAmount: 0, expectedCycles: 0 };
    }

    let yearsDiff = today.getFullYear() - joinDate.getFullYear();
    let monthsDiff = today.getMonth() - joinDate.getMonth();
    let expectedCycles = (yearsDiff * 12) + monthsDiff + 1;

    const isBillingDatePassed = today.getDate() >= joinDate.getDate();
    if (!isBillingDatePassed) {
      expectedCycles = Math.max(0, expectedCycles - 1);
    }

    const paid = Number(paidMonthsCount) || 0;
    const remainingMonths = Math.max(0, expectedCycles - paid);
    const feeAmount = Number(monthlyFee) || 1000;
    const totalDueAmount = remainingMonths * feeAmount;

    return { 
      isDue: remainingMonths > 0, 
      hasStarted: true,
      remainingMonths, 
      totalDueAmount,
      expectedCycles
    };
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/students`).then((res) => res.json()),
      fetch(`${API_URL}/api/all-attendance`).then((res) => res.json()),
    ])
      .then(([studentData, attendanceData]) => {
        setStudents(studentData);
        setAttendanceRecords(attendanceData);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        toast.error('Failed to load fee records.');
      });
  }, [API_URL]);

  // Extract the TRUE LATEST fee state by sorting dates newest first and avoiding Math.max accumulation
  const studentPaidMonthsMap = {};
  const sortedDates = Object.keys(attendanceRecords).sort().reverse();

  sortedDates.forEach((dateKey) => {
    const record = attendanceRecords[dateKey];
    const sources = [
      record?.feesPaid,
      record?.Morning?.feesPaid,
      record?.Evening?.feesPaid,
      record?.sessions?.Morning?.feesPaid,
      record?.sessions?.Evening?.feesPaid
    ];

    sources.forEach((feesMap) => {
      if (feesMap && typeof feesMap === 'object') {
        Object.keys(feesMap).forEach((studentId) => {
          if (studentPaidMonthsMap[studentId] === undefined) {
            studentPaidMonthsMap[studentId] = feesMap[studentId] || 0;
          }
        });
      }
    });
  });

  // "All Paid": Students with zero pending dues
  const paidStudents = students.filter((student) => {
    const paidMonths = studentPaidMonthsMap[student.id] || 0;
    const cycleInfo = checkFeeCycle(student.joiningDate, student.fees, paidMonths);
    return cycleInfo.hasStarted && !cycleInfo.isDue;
  });

  // Apply sub-filter for All Paid vs Current Month Cleared
  const filteredStudents = paidStudents.filter((student) => {
    const paidMonths = studentPaidMonthsMap[student.id] || 0;
    
    const today = new Date();
    const joinDate = new Date(student.joiningDate);
    const currentYearMonth = (today.getFullYear() * 12) + today.getMonth();
    const joinYearMonth = (joinDate.getFullYear() * 12) + joinDate.getMonth();
    const monthsSinceJoin = (currentYearMonth - joinYearMonth) + 1;

    const isAdvance = paidMonths > monthsSinceJoin;
    const isCurrentMonthCleared = paidMonths === monthsSinceJoin || (paidMonths >= monthsSinceJoin && !isAdvance);

    if (cycleFilter === 'current_cycle' && !isCurrentMonthCleared) return false;

    return student.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

        {/* Search & Filter Bar */}
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

          {/* Filter System Pills (Advance Filter Removed) */}
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
              Current Month Cleared
            </button>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const paidMonths = studentPaidMonthsMap[student.id] || 0;
              const today = new Date();
              const joinDate = new Date(student.joiningDate);
              const currentYearMonth = (today.getFullYear() * 12) + today.getMonth();
              const joinYearMonth = (joinDate.getFullYear() * 12) + joinDate.getMonth();
              const monthsSinceJoin = (currentYearMonth - joinYearMonth) + 1;
              const isAdvance = paidMonths > monthsSinceJoin;

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
                      {isAdvance ? `Paid (${paidMonths}m total)` : 'Current Month Cleared'}
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