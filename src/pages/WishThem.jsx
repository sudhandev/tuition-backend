import { useState, useEffect } from 'react';
import { Gift, Calendar, UserRound, ArrowLeft, Cake, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function WishThem() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[today.getMonth()];

  useEffect(() => {
    fetch(`${API_URL}/api/students`)
      .then(res => res.json())
      .then(data => {
        setStudents(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        toast.error('Failed to load birthdays.');
        setLoading(false);
      });
  }, [API_URL]);

  const monthBirthdays = students.filter(student => {
    const dob = student.birthday || student.dob;
    if (!dob) return false;
    // Handles formats like YYYY-MM-DD or MM-DD
    const parts = dob.split('-');
    if (parts.length === 3) {
      return Number(parts[1]) === currentMonth;
    } else if (parts.length === 2) {
      return Number(parts[0]) === currentMonth;
    }
    return false;
  }).sort((a, b) => {
    const dobA = a.birthday || a.dob;
    const dobB = b.birthday || b.dob;
    const dayA = Number(dobA.split('-').pop());
    const dayB = Number(dobB.split('-').pop());
    return dayA - dayB;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-purple-100 transition shadow-sm">
              <ArrowLeft size={16} /> Back to Main Page
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
              <span>{currentMonthName} Birthdays</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                {monthBirthdays.length} Celebration(s)
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">All student birthdays scheduled for the month of {currentMonthName}</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <p className="text-sm font-medium animate-pulse">Loading birthday calendar...</p>
          </div>
        ) : monthBirthdays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthBirthdays.map((student) => {
              const dob = student.birthday || student.dob;
              const day = Number(dob.split('-').pop());
              const isToday = day === currentDay;

              return (
                <div 
                  key={student.id} 
                  className={`relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between ${
                    isToday 
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent shadow-md ring-4 ring-purple-200' 
                      : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:border-purple-300'
                  }`}
                >
                  {isToday && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles size={12} /> Today!
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isToday ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {isToday ? <Cake size={24} /> : <UserRound size={22} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-base truncate max-w-[180px]">{student.name}</h3>
                        <p className={`text-xs font-medium ${isToday ? 'text-purple-100' : 'text-purple-600'}`}>
                          {student.studentClass || 'Standard N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                    isToday ? 'border-white/20 text-purple-100' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} /> {currentMonthName} {day}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isToday ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isToday ? 'Happy Birthday! 🎂' : `Day ${day}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <Gift size={40} className="mx-auto mb-3 opacity-40 text-purple-600" />
            <h3 className="font-bold text-slate-700 text-base">No birthdays this month</h3>
            <p className="text-sm text-slate-400 mt-1">There are no student birthdays registered for {currentMonthName}.</p>
          </div>
        )}

      </div>
    </main>
  );
}