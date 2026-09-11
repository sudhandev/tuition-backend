import { useState, useEffect } from "react";
import { Calendar, UserRound, ArrowLeft, Sun, Moon, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function AttendanceReport() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [students, setStudents] = useState([]);
  const [allAttendanceData, setAllAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSessionTab, setSelectedSessionTab] = useState('Morning'); // 'Morning' or 'Evening'
  const [filterDate, setFilterDate] = useState(''); // Specific date filter

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

  let recordedDates = Object.keys(allAttendanceData).sort().reverse();
  
  // Apply specific date filter if chosen
  if (filterDate) {
    recordedDates = recordedDates.filter(date => date === filterDate);
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header & Controls */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-purple-100 transition"
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Complete Attendance History
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Audit logs and past session sheets across recorded dates
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Specific Date Picker Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-sm">
              <Filter size={16} className="text-purple-600" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="text-slate-400 hover:text-slate-600"
                  title="Clear filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Report Session Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setSelectedSessionTab('Morning')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  selectedSessionTab === 'Morning' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sun size={14} /> Morning
              </button>
              <button
                onClick={() => setSelectedSessionTab('Evening')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  selectedSessionTab === 'Evening' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon size={14} /> Evening
              </button>
            </div>
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
              
              let sessionsToRender = {};
              if (dateRecord.attendance || dateRecord.feesPaid) {
                sessionsToRender = { Morning: dateRecord };
              } else {
                sessionsToRender = dateRecord;
              }

              const sessionPayload = sessionsToRender[selectedSessionTab];
              if (!sessionPayload) return null;

              const dayRecord = sessionPayload.attendance || {};
              const recordedStudentIds = Object.keys(dayRecord);

              if (recordedStudentIds.length === 0) return null;

              // Calculate total present and absent inside the map loop where dayRecord and recordedStudentIds are defined
              let totalPresent = 0;
              let totalAbsent = 0;
              recordedStudentIds.forEach((studentId) => {
                const record = dayRecord[studentId];
                const status = typeof record === "object" ? record.status : record;
                if (status === "Present") totalPresent++;
                if (status === "Absent") totalAbsent++;
              });

              return (
                <div
                  key={`${date}-${selectedSessionTab}`}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                    <div className ="flex flex-wrap items-center gap-10">
                      <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                        <Calendar size={18} />
                        <span>Sheet for: {date}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Present: {totalPresent}
                        </span>
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          Absent: {totalAbsent}
                        </span>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl w-fit ${
                      selectedSessionTab === 'Morning' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {selectedSessionTab === 'Morning' ? <Sun size={14} /> : <Moon size={14} />}
                      {selectedSessionTab} Session Report
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
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <Calendar
              size={40}
              className="mx-auto mb-3 opacity-40 text-purple-600"
            />
            <h3 className="font-bold text-slate-700 text-base">
              No attendance logs found for this filter
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Try clearing the date filter or choose another date.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}