import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, IndianRupee, UserRound, AlertCircle, AlertTriangle, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TakeAttendance() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('Morning'); // 'Morning' or 'Evening'
  const [attendance, setAttendance] = useState({});
  const [feesPaidRecords, setFeesPaidRecords] = useState({});
  const [allAttendanceRecords, setAllAttendanceRecords] = useState({});
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const isNotToday = selectedDate !== todayStr;

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/students`).then((res) => res.json()),
      fetch(`${API_URL}/api/all-attendance`).then((res) => res.json()),
    ])
      .then(([studentData, attendanceData]) => {
        setStudents(studentData);
        setAllAttendanceRecords(attendanceData);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        toast.error('Failed to load records.');
      });
  }, [API_URL]);

  // Load attendance and fee records strictly for the selected date and session
  useEffect(() => {
    setAttendance({});
    setFeesPaidRecords({});

    fetch(`${API_URL}/api/attendance?date=${selectedDate}&session=${session}`)
      .then(res => res.json())
      .then(sessionData => {
        const rawAttendance = sessionData && sessionData.attendance ? sessionData.attendance : {};
        const normalizedAttendance = {};
        
        Object.keys(rawAttendance).forEach(id => {
          const val = rawAttendance[id];
          if (val && typeof val === 'object' && val.status) {
            normalizedAttendance[id] = val.status;
          } else {
            normalizedAttendance[id] = val;
          }
        });
        setAttendance(normalizedAttendance);

        const feesMap = sessionData && sessionData.feesPaid ? sessionData.feesPaid : {};
        setFeesPaidRecords(feesMap);
      })
      .catch((err) => {
        console.error('Error fetching records:', err);
        toast.error('Failed to load records.');
      });
  }, [selectedDate, session, API_URL]);

  // Extract TRUE LATEST fee state across all dates (descending order) to match dashboard & pending lists
  const studentPaidMonthsMap = {};
  const sortedDates = Object.keys(allAttendanceRecords).sort().reverse();

  sortedDates.forEach((dateKey) => {
    const record = allAttendanceRecords[dateKey];
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

  const toggleSessionAttendee = (id, currentStudentName) => {
    if (isNotToday) return;

    const currentStatus = attendance[id];
    let nextStatus;
    
    if (!currentStatus) {
      nextStatus = 'Present';
    } else if (currentStatus === 'Present') {
      nextStatus = 'Absent';
    } else {
      nextStatus = undefined;
    }

    const updatedAttendance = { ...attendance };
    if (nextStatus) {
      updatedAttendance[id] = nextStatus;
    } else {
      delete updatedAttendance[id];
    }

    setAttendance(updatedAttendance);

    const namesSnapshot = {};
    students.forEach(s => { namesSnapshot[s.id] = s.name; });
    if (currentStudentName && !namesSnapshot[id]) {
      namesSnapshot[id] = currentStudentName;
    }

    saveDataToServer(updatedAttendance, feesPaidRecords, namesSnapshot);
  };

  const toggleFeeStatus = (id, cycleInfo, currentStudentName) => {
    if (isNotToday) return;
    const currentPaidMonths = feesPaidRecords[id] || studentPaidMonthsMap[id] || 0;
    
    const nextPaidMonths = currentPaidMonths + cycleInfo.remainingMonths;
    const updatedFees = { ...feesPaidRecords, [id]: nextPaidMonths };
    setFeesPaidRecords(updatedFees);

    const namesSnapshot = {};
    students.forEach(s => { namesSnapshot[s.id] = s.name; });
    if (currentStudentName && !namesSnapshot[id]) {
      namesSnapshot[id] = currentStudentName;
    }

    saveDataToServer(attendance, updatedFees, namesSnapshot);
    toast.success(`Fee paid (₹${cycleInfo.totalDueAmount})!`);
  };

  const handleUndoFee = (id, currentStudentName) => {
    if (isNotToday) return;
    
    const currentPaid = feesPaidRecords[id] || studentPaidMonthsMap[id] || 0;
    const undoMonths = Math.max(0, currentPaid - 1);
    
    const updatedFees = { ...feesPaidRecords, [id]: undoMonths };
    setFeesPaidRecords(updatedFees);

    const namesSnapshot = {};
    students.forEach(s => { namesSnapshot[s.id] = s.name; });
    if (currentStudentName && !namesSnapshot[id]) {
      namesSnapshot[id] = currentStudentName;
    }

    saveDataToServer(attendance, updatedFees, namesSnapshot);
    toast.success("Payment undone (Reverted to Pending).");
  };

  const saveDataToServer = (currentAttendance, currentFees, currentNames) => {
    fetch(`${API_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        date: selectedDate, 
        session: session,
        attendanceData: currentAttendance,
        feesPaidData: currentFees,
        studentNames: currentNames 
      })
    })
      .then((res) => {
        if (!res.ok) {
          toast.error('Failed to save records.');
        }
      })
      .catch(err => {
        console.error('Error saving data:', err);
        toast.error('Could not sync with server.');
      });
  };

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

    const remainingMonths = Math.max(0, totalCyclesPassed - (Number(paidMonthsCount) || 0));
    const feeAmount = Number(monthlyFee) || 1000;
    const totalDueAmount = remainingMonths * feeAmount;

    return { 
      isDue: remainingMonths > 0, 
      hasStarted: true,
      remainingMonths, 
      totalDueAmount 
    };
  };

  const displayedStudents = students.filter(student => {
    if (!student.joiningDate) return true;

    const studentJoinStr = student.joiningDate.split('T')[0];
    if (selectedDate < studentJoinStr) {
      return false;
    }

    const paidMonths = studentPaidMonthsMap[student.id] || 0;
    const cycleInfo = checkFeeCycle(student.joiningDate, student.fees, paidMonths);
    const isPending = cycleInfo.hasStarted && cycleInfo.isDue;

    if (filterPendingOnly) {
      return isPending;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header & Controls */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-purple-600 hover:border-purple-200 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Attendance & Fee Tracker</h1>
              <p className="text-sm text-slate-400 mt-1">Select students present for the active session</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Session Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setSession('Morning')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  session === 'Morning' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sun size={14} /> Morning
              </button>
              <button
                onClick={() => setSession('Evening')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  session === 'Evening' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon size={14} /> Evening
              </button>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
              <Calendar size={18} className="text-purple-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-semibold text-slate-700 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {isNotToday && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={18} /> You are viewing a past or future date. Edits are locked to today.
          </div>
        )}

        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <AlertTriangle size={18} className="text-amber-500" />
            <span>Showing students for <b>{session}</b> session ({selectedDate})</span>
          </div>

          <button
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterPendingOnly 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filterPendingOnly ? 'Showing Pending Fees Only' : 'Filter Pending Fees'}
          </button>
        </div>

        {/* Student List */}
        <div className="space-y-4">
          {displayedStudents.length > 0 ? (
            displayedStudents.map((student) => {
              const status = attendance[student.id];
              const paidMonths = studentPaidMonthsMap[student.id] || 0;
              const studentFeeAmount = Number(student.fees) || 1000;
              const cycleInfo = checkFeeCycle(student.joiningDate, studentFeeAmount, paidMonths);
              const isPending = cycleInfo.hasStarted && cycleInfo.isDue;

              return (
                <div key={student.id} className={`bg-white rounded-3xl border shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${status === 'Present' ? 'border-emerald-300 bg-emerald-50/10' : status === 'Absent' ? 'border-red-300 bg-red-50/10' : isPending ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <UserRound size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {student.name}
                        {isPending && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                            PENDING ({cycleInfo.remainingMonths}m due)
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-purple-600 font-medium">{student.studentClass || 'Standard N/A'}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Joined: {student.joiningDate || 'N/A'}
                        </span>
                        <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Fee: ₹{studentFeeAmount} / mo
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => toggleSessionAttendee(student.id, student.name)}
                      disabled={isNotToday}
                      className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
                        isNotToday ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' :
                        status === 'Present' 
                          ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600' 
                          : status === 'Absent'
                          ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'Present' ? <CheckCircle2 size={16} /> : status === 'Absent' ? <XCircle size={16} /> : null}
                      {status === 'Present' ? `Present (${session})` : status === 'Absent' ? `Absent (${session})` : 'Mark Attendance'}
                    </button>

                    {/* Fee Button */}
                    {isPending ? (
                      <button
                        onClick={() => toggleFeeStatus(student.id, cycleInfo, student.name)}
                        disabled={isNotToday}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
                          isNotToday ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 animate-pulse'
                        }`}
                      >
                        <IndianRupee size={15} />
                        Pay ₹{cycleInfo.totalDueAmount} ({cycleInfo.remainingMonths}m)
                      </button>
                    ) : (
                      <button
                        disabled={isNotToday}
                        onClick={() => handleUndoFee(student.id, student.name)}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
                          isNotToday ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                        }`}
                        title="Click to undo fee payment"
                      >
                        <CheckCircle2 size={15} />
                        Paid (Click to Undo)
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
              <Calendar size={40} className="mx-auto mb-3 opacity-40 text-purple-600" />
              <h3 className="font-bold text-slate-700 text-base">No students active on this date</h3>
              <p className="text-sm text-slate-400 mt-1">No students had joined by {selectedDate}.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}