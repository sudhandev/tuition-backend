import { useState, useEffect } from 'react';
import { AlertCircle, IndianRupee, Search, UserX, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function FeesPending() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const checkFeeCycle = (joiningDate, monthlyFee = 0, paidMonthsCount = 0) => {
    if (!joiningDate) return { isDue: false, hasStarted: false, remainingMonths: 0, totalDueAmount: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const joinDate = new Date(joiningDate);
    joinDate.setHours(0, 0, 0, 0);

    if (today < joinDate) {
      return { isDue: false, hasStarted: false, remainingMonths: 0, totalDueAmount: 0 };
    }

    let totalCyclesPassed = 0;
    let testDate = new Date(joinDate);
    
    while (testDate <= today) {
      totalCyclesPassed++;
      testDate = new Date(joinDate);
      testDate.setMonth(joinDate.getMonth() + totalCyclesPassed);
    }

    const remainingMonths = Math.max(0, totalCyclesPassed - (paidMonthsCount || 0));
    const feeAmount = Number(monthlyFee) || 1000;
    const totalDueAmount = remainingMonths * feeAmount;

    return { 
      isDue: remainingMonths > 0, 
      hasStarted: true,
      remainingMonths, 
      totalDueAmount 
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
        toast.error('Failed to load pending fee records.');
      });
  }, [API_URL]);

  const studentPaidMonthsMap = {};
  Object.values(attendanceRecords).forEach((record) => {
    const feesMap = record?.feesPaid || record?.Morning?.feesPaid || record?.Evening?.feesPaid || {};
    Object.keys(feesMap).forEach((studentId) => {
      const count = feesMap[studentId] || 0;
      if (count > (studentPaidMonthsMap[studentId] || 0)) {
        studentPaidMonthsMap[studentId] = count;
      }
    });
  });

  const pendingStudents = students.filter((student) => {
    const paidMonths = studentPaidMonthsMap[student.id] || 0;
    const cycleInfo = checkFeeCycle(student.joiningDate, student.fees, paidMonths);
    return cycleInfo.hasStarted && cycleInfo.isDue;
  });

  const filteredStudents = pendingStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-red-100 transition shadow-sm">
          <ArrowLeft size={16} /> Back to Main Page
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-200">
            <AlertCircle size={28} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Fees Pending</h1>
            <p className="text-sm text-slate-400 mt-1">Students with outstanding fee balances</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex items-center gap-3 shadow-sm">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search pending students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm text-slate-700 outline-none bg-transparent"
          />
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const paidMonths = studentPaidMonthsMap[student.id] || 0;
              const cycleInfo = checkFeeCycle(student.joiningDate, student.fees, paidMonths);

              return (
                <div key={student.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{student.name}</h3>
                      <p className="text-xs text-slate-400">{student.studentClass || 'Standard N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-bold text-lg flex items-center justify-end">
                      <IndianRupee size={16} />
                      {cycleInfo.totalDueAmount}
                    </span>
                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-semibold uppercase">
                      {cycleInfo.remainingMonths} Month(s) Pending
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
            <UserX size={32} className="mx-auto text-red-500 mb-2" />
            <h3 className="font-bold text-slate-700">No pending fees!</h3>
            <p className="text-sm text-slate-400 mt-1">All active students have cleared their payments.</p>
          </div>
        )}
      </div>
    </main>
  );
}