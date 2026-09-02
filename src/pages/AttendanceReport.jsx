import { useState, useEffect } from "react";
import { Calendar, UserRound, ArrowLeft, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function AttendanceReport() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [students, setStudents] = useState([]);
  const [allAttendanceData, setAllAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/students`).then((res) => res.json()),
      fetch(`${API_URL}/api/all-attendance`).then((res) => res.json()),
    ])
      .then(([studentsData, attendanceData]) => {
        setStudents(studentsData || []);
        setAllAttendanceData(attendanceData || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching report data:", err);
        toast.error("Failed to load attendance history.");
        setLoading(false);
      });
  }, [API_URL]);

  const recordedDates = Object.keys(allAttendanceData).sort().reverse();

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header & Back Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-purple-100 transition"
            >
              <ArrowLeft size={16} /> Back to Daily Tracker
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Complete Attendance History
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Audit logs and past session sheets across all recorded dates
            </p>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <p className="text-sm font-medium">Loading attendance history...</p>
          </div>
        ) : recordedDates.length > 0 ? (
          <div className="space-y-6">
            {recordedDates.map((date) => {
              const dateRecord = allAttendanceData[date] || {};
              
              // Handle both legacy flat structure and new session-mapped structure
              const sessions = dateRecord.attendance 
                ? { Morning: dateRecord } 
                : dateRecord;

              return Object.keys(sessions).map((sessionName) => {
                const sessionPayload = sessions[sessionName] || {};
                const dayRecord = sessionPayload.attendance || {};
                const recordedStudentIds = Object.keys(dayRecord);

                if (recordedStudentIds.length === 0) return null;

                return (
                  <div
                    key={`${date}-${sessionName}`}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                        <Calendar size={18} />
                        <span>Sheet for: {date}</span>
                      </div>
                      
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl w-fit ${
                        sessionName === 'Morning' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {sessionName === 'Morning' ? <Sun size={14} /> : <Moon size={14} />}
                        {sessionName} Session
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {recordedStudentIds.map((studentId) => {
                        const record = dayRecord[studentId];
                        const status = typeof record === "object" ? record.status : record;

                        const activeMatch = students.find(
                          (s) => String(s.id) === String(studentId),
                        );
                        const studentName =
                          (typeof record === "object" && record.name) ||
                          activeMatch?.name ||
                          `Student #${String(studentId).slice(-4)}`;

                        const isPresent = status === "Present";
                        const isAbsent = status === "Absent";

                        return (
                          <div
                            key={studentId}
                            className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <UserRound size={16} />
                              </div>
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                                {studentName}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                                isPresent
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isAbsent
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {status || 'Not Marked'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <Calendar
              size={40}
              className="mx-auto mb-3 opacity-40 text-purple-600"
            />
            <h3 className="font-bold text-slate-700 text-base">
              No attendance logs found
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Mark and save attendance on your daily tracker to see history here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}