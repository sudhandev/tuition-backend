import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Smile,
  Frown,
  Star,
  Users,
  Banknote,
  BanknoteX,
  ArrowRight,
  Cake,
  Sun,
  Moon,
  X,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

export default function MainPage() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [totalStudents, setTotalStudents] = useState(0);
  const [activeSession, setActiveSession] = useState('Morning');
  
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  
  const [feesPaidCount, setFeesPaidCount] = useState(0);
  const [feesPendingCount, setFeesPendingCount] = useState(0);
  const [birthdayCount, setBirthdayCount] = useState(0);

  const [rawAttendanceData, setRawAttendanceData] = useState({});
  const [allStudentsList, setAllStudentsList] = useState([]);
  
  // Modal State for viewing Present/Absent lists
  const [modalType, setModalType] = useState(null); // 'Present' | 'Absent' | null

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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

  const calculateSessionCounts = (allAttendance, sessionName) => {
    const todayRecord = allAttendance[todayDateStr] || {};
    let sessionAttendance = {};

    if (todayRecord.sessions) {
      sessionAttendance = todayRecord.sessions[sessionName]?.attendance || {};
    } else if (todayRecord[sessionName]) {
      sessionAttendance = todayRecord[sessionName]?.attendance || {};
    } else if (sessionName === 'Morning' && todayRecord.attendance) {
      sessionAttendance = todayRecord.attendance || {};
    }

    let present = 0;
    let absent = 0;

    Object.keys(sessionAttendance).forEach(studentId => {
      const record = sessionAttendance[studentId];
      const status = typeof record === 'object' ? record.status : record;
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
    });

    setPresentCount(present);
    setAbsentCount(absent);
  };

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, allAttendanceRes] = await Promise.all([
        fetch(`${API_URL}/api/students`),
        fetch(`${API_URL}/api/all-attendance`),
      ]);

      const students = await studentsRes.json();
      const allAttendance = await allAttendanceRes.json();

      setTotalStudents(students.length);
      setAllStudentsList(students);
      setRawAttendanceData(allAttendance);

      calculateSessionCounts(allAttendance, activeSession);

      let paid = 0;
      let pending = 0;
      const studentPaidMonthsMap = {};

      Object.values(allAttendance).forEach((record) => {
        const feesMap = record?.feesPaid || record?.Morning?.feesPaid || record?.Evening?.feesPaid || {};
        Object.keys(feesMap).forEach((studentId) => {
          const count = feesMap[studentId] || 0;
          if (count > (studentPaidMonthsMap[studentId] || 0)) {
            studentPaidMonthsMap[studentId] = count;
          }
        });
      });

      students.forEach((student) => {
        const paidMonths = studentPaidMonthsMap[student.id] || 0;
        const cycleInfo = checkFeeCycle(student.joiningDate, student.fees, paidMonths);
        
        if (cycleInfo.hasStarted) {
          if (cycleInfo.isDue) {
            pending++;
          } else {
            paid++;
          }
        }
      });

      setFeesPaidCount(paid);
      setFeesPendingCount(pending);

      const todayObj = new Date();
      const currentMonth = todayObj.getMonth() + 1;
      let bdays = 0;

      students.forEach((student) => {
        const bdayField = student.birthday || student.dob || '';
        if (bdayField) {
          const parts = bdayField.split('-');
          if (parts.length === 3 && Number(parts[1]) === currentMonth) {
            bdays++;
          } else if (parts.length === 2 && Number(parts[0]) === currentMonth) {
            bdays++;
          }
        }
      });
      setBirthdayCount(bdays);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
      toast.error("Failed to load dashboard metrics.");
    }
  };

  useEffect(() => {
    fetchDashboardData();

    window.addEventListener('focus', fetchDashboardData);
    return () => window.removeEventListener('focus', fetchDashboardData);
  }, [todayDateStr, API_URL]);

  const handleSessionSwitch = (sessionName) => {
    setActiveSession(sessionName);
    calculateSessionCounts(rawAttendanceData, sessionName);
  };

  // Get filtered students for the active session modal
  const getSessionAttendanceMap = () => {
    const todayRecord = rawAttendanceData[todayDateStr] || {};
    let sessionAttendance = {};

    if (todayRecord.sessions) {
      sessionAttendance = todayRecord.sessions[activeSession]?.attendance || {};
    } else if (todayRecord[activeSession]) {
      sessionAttendance = todayRecord[activeSession]?.attendance || {};
    } else if (activeSession === 'Morning' && todayRecord.attendance) {
      sessionAttendance = todayRecord.attendance || {};
    }
    return sessionAttendance;
  };

  const getModalStudents = () => {
    const sessionAttendance = getSessionAttendanceMap();
    return allStudentsList.filter(student => {
      const record = sessionAttendance[student.id];
      const status = typeof record === 'object' ? record.status : record;
      return status === modalType;
    });
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold">
            <CalendarDays size={18} strokeWidth={2.5} />
            Today
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-3">
            {todayFormatted}
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Keep track of today's student attendance
          </p>
        </div>

        <section className="bg-white/90 backdrop-blur rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-7 gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-purple-500 uppercase text-center sm:text-left">
                Attendance Overview
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 text-center sm:text-left">
                Today's Attendance
              </h2>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => handleSessionSwitch('Morning')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeSession === 'Morning' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sun size={14} /> Morning
              </button>
              <button
                onClick={() => handleSessionSwitch('Evening')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeSession === 'Evening' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon size={14} /> Evening
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div 
              onClick={() => setModalType('Present')}
              className="group rounded-2xl bg-green-50 border border-green-100 p-4 sm:p-6 text-center hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-100 flex items-center justify-center group-hover:scale-105 transition">
                <Smile size={30} className="text-green-600" strokeWidth={2} />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-green-700 mt-3">
                PRESENT ({activeSession})
              </p>

              <p className="text-3xl sm:text-5xl font-bold text-green-600 mt-1">
                {presentCount}
              </p>

              <p className="text-[11px] sm:text-xs text-green-600/60 mt-1 underline">
                Click to view list
              </p>
            </div>

            <div 
              onClick={() => setModalType('Absent')}
              className="group rounded-2xl bg-red-50 border border-red-100 p-4 sm:p-6 text-center hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-100 flex items-center justify-center group-hover:scale-105 transition">
                <Frown size={30} className="text-red-600" strokeWidth={2} />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-red-700 mt-3">
                ABSENT ({activeSession})
              </p>

              <p className="text-3xl sm:text-5xl font-bold text-red-600 mt-1">
                {absentCount}
              </p>

              <p className="text-[11px] sm:text-xs text-red-600/60 mt-1 underline">
                Click to view list
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-center mt-6">
          <Link
            to="/attendance"
            className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-7 py-4 rounded-2xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Star size={20} strokeWidth={2} />
            </div>

            <span>Take Attendance</span>

            <ArrowRight
              size={19}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <section className="mt-6">
          <Link to="/students">
            <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 hover:shadow-md transition-all duration-300">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-purple-100/60" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <Users size={30} className="text-purple-600" strokeWidth={2} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Students
                    </p>

                    <p className="text-lg sm:text-xl font-bold text-slate-700">
                      Total Students
                    </p>
                  </div>
                </div>

                <p className="text-4xl sm:text-5xl font-bold text-purple-600">
                  {totalStudents}
                </p>
              </div>
            </div>
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-6">
          <Link to="/fees-paid">
            <div className="group bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex flex-row sm:items-center gap-3">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                  <Banknote size={25} className="text-green-600" strokeWidth={2} />
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Fees Paid
                  </p>

                  <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1">
                    {feesPaidCount}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/fees-pending">
            <div className="group bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex flex-row sm:items-center gap-3">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <BanknoteX size={25} className="text-red-600" strokeWidth={2} />
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Fees Pending
                  </p>

                  <p className="text-xl sm:text-3xl font-bold text-red-600 mt-1">
                    {feesPendingCount}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/wish-them">
            <div className="group bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex flex-row sm:items-center gap-3">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Cake size={25} className="text-purple-600" strokeWidth={2} />
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Wish Them
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-purple-600 mt-1">
                    {birthdayCount}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </section>
      </div>

      {/* Pop-up Modal for Present / Absent Students */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className={`p-5 flex items-center justify-between border-b ${modalType === 'Present' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
              <div className="flex items-center gap-2 font-bold text-lg">
                {modalType === 'Present' ? <Smile size={22} className="text-green-600" /> : <Frown size={22} className="text-red-600" />}
                <span>{modalType} Students ({activeSession})</span>
              </div>
              <button 
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 transition shadow-xs"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {getModalStudents().length > 0 ? (
                getModalStudents().map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modalType === 'Present' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <UserRound size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{student.name}</h4>
                        <p className="text-xs text-slate-400">{student.studentClass || 'Standard N/A'}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${modalType === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {modalType}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p className="font-semibold text-slate-600">No students marked {modalType.toLowerCase()} yet</p>
                  <p className="text-xs mt-1">For the {activeSession} session on {todayFormatted}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}