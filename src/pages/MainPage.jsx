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
} from "lucide-react";
import toast from "react-hot-toast";

export default function MainPage() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [totalStudents, setTotalStudents] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [feesPaidCount, setFeesPaidCount] = useState(0);
  const [feesPendingCount, setFeesPendingCount] = useState(0);
  const [birthdayCount, setBirthdayCount] = useState(0);

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const checkFeeCycle = (joiningDate, paidMonthsCount = 0) => {
    if (!joiningDate) return { isDue: false };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const joinDate = new Date(joiningDate);
    joinDate.setHours(0, 0, 0, 0);

    if (today < joinDate) return { isDue: false };

    let totalCyclesPassed = 0;
    let testDate = new Date(joinDate);

    while (testDate <= today) {
      totalCyclesPassed++;
      testDate = new Date(joinDate);
      testDate.setMonth(joinDate.getMonth() + totalCyclesPassed);
    }

    const dueCyclesCount = Math.max(1, totalCyclesPassed);
    const remainingMonths = Math.max(0, dueCyclesCount - (paidMonthsCount || 0));
    return { isDue: remainingMonths > 0 };
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [studentsRes, attendanceRes, allAttendanceRes] = await Promise.all([
          fetch(`${API_URL}/api/students`),
          fetch(`${API_URL}/api/attendance?date=${todayDateStr}`),
          fetch(`${API_URL}/api/all-attendance`),
        ]);

        const students = await studentsRes.json();
        const todayAttendance = await attendanceRes.json();
        const allAttendance = await allAttendanceRes.json();

        setTotalStudents(students.length);

        let present = 0;
        let absent = 0;
        students.forEach((student) => {
          const status = todayAttendance?.attendance?.[student.id];
          if (status === "Present") present++;
          else if (status === "Absent") absent++;
        });
        setPresentCount(present);
        setAbsentCount(absent);

        let paid = 0;
        let pending = 0;

        const studentPaidMonthsMap = {};
        Object.values(allAttendance).forEach((record) => {
          const feesMap = record?.feesPaid || {};
          Object.keys(feesMap).forEach((studentId) => {
            const count = feesMap[studentId] || 0;
            if (count > (studentPaidMonthsMap[studentId] || 0)) {
              studentPaidMonthsMap[studentId] = count;
            }
          });
        });

        students.forEach((student) => {
          const paidMonths = studentPaidMonthsMap[student.id] || 0;
          const cycleInfo = checkFeeCycle(student.joiningDate, paidMonths);
          
          if (cycleInfo.isDue) {
            pending++;
          } else {
            paid++;
          }
        });

        setFeesPaidCount(paid);
        setFeesPendingCount(pending);

        // Fixed Birthday Count for Current Month instead of Today Only
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
    }

    fetchDashboardData();
  }, [todayDateStr, API_URL]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="text-center mb-7">
            <p className="text-xs font-bold tracking-[0.2em] text-purple-500 uppercase">
              Attendance Overview
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
              Today's Attendance
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="group rounded-2xl bg-green-50 border border-green-100 p-4 sm:p-6 text-center hover:shadow-md transition-all duration-300">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-100 flex items-center justify-center group-hover:scale-105 transition">
                <Smile size={30} className="text-green-600" strokeWidth={2} />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-green-700 mt-3">
                PRESENT
              </p>

              <p className="text-3xl sm:text-5xl font-bold text-green-600 mt-1">
                {presentCount}
              </p>

              <p className="text-[11px] sm:text-xs text-green-600/60 mt-1">
                Students present
              </p>
            </div>

            <div className="group rounded-2xl bg-red-50 border border-red-100 p-4 sm:p-6 text-center hover:shadow-md transition-all duration-300">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-100 flex items-center justify-center group-hover:scale-105 transition">
                <Frown size={30} className="text-red-600" strokeWidth={2} />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-red-700 mt-3">
                ABSENT
              </p>

              <p className="text-3xl sm:text-5xl font-bold text-red-600 mt-1">
                {absentCount}
              </p>

              <p className="text-[11px] sm:text-xs text-red-600/60 mt-1">
                Students absent
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
    </main>
  );
}