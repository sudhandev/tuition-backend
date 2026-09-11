import { useState, useEffect } from "react";
import { AlertCircle, Calendar, DollarSign, UserRound, ArrowLeft, Plus, Edit2, Trash2, Check, Sun, Moon, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function FineTracker() {
  const API_URL = import.meta.env.VITE_API_URL || 'https://tuition-backend-fwlw.onrender.com';

  const [students, setStudents] = useState([]);
  const [finesList, setFinesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sessionType, setSessionType] = useState('Morning');
  const [fineAmount, setFineAmount] = useState('50');
  const [fineDate, setFineDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Uninformed Leave');
  const [fineStatus, setFineStatus] = useState('Pending'); // 'Pending' or 'Paid'

  // Edit State
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const fetchData = async () => {
    try {
      const [studentsRes, finesRes] = await Promise.all([
        fetch(`${API_URL}/api/students`).then((res) => res.json()),
        fetch(`${API_URL}/api/fines`).then((res) => res.json()).catch(() => []),
      ]);

      setStudents(studentsRes || []);
      setFinesList(Array.isArray(finesRes) ? finesRes : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching fine data:", err);
      toast.error("Failed to load fine records from server.");
      setLoading(false);
    }
  };

  const handleSaveFine = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !fineAmount) {
      toast.error("Please select a student and enter fine amount.");
      return;
    }

    const studentObj = students.find(s => String(s.id) === String(selectedStudent));
    const finePayload = {
      studentId: selectedStudent,
      studentName: studentObj?.name || 'Unknown',
      session: sessionType,
      amount: Number(fineAmount),
      date: fineDate,
      reason,
      status: fineStatus,
    };

    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/api/fines/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finePayload),
        });
        if (!res.ok) throw new Error('Failed to update');
        
        toast.success("Fine record updated successfully!");
        setEditingId(null);
      } else {
        const res = await fetch(`${API_URL}/api/fines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finePayload),
        });
        if (!res.ok) throw new Error('Failed to create');
        
        toast.success("Fine added successfully!");
      }

      fetchData();
      setSelectedStudent('');
      setFineAmount('50');
      setReason('Uninformed Leave');
      setFineStatus('Pending');
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save fine to backend.");
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'Paid' ? 'Pending' : 'Paid';
    try {
      const res = await fetch(`${API_URL}/api/fines/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success(`Marked as ${newStatus}!`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update payment status.");
    }
  };

  const handleEdit = (fine) => {
    setEditingId(fine.id);
    setSelectedStudent(fine.studentId);
    setSessionType(fine.session || 'Morning');
    setFineAmount(fine.amount);
    setFineDate(fine.date);
    setReason(fine.reason || '');
    setFineStatus(fine.status || 'Pending');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fine record?")) {
      try {
        const res = await fetch(`${API_URL}/api/fines/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');

        toast.success("Fine deleted successfully.");
        fetchData();
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete fine.");
      }
    }
  };

  const totalCollected = finesList
    .filter(item => item.status === 'Paid')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalPending = finesList
    .filter(item => item.status !== 'Paid')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3.5 py-2 rounded-xl mb-4 hover:bg-purple-100 transition shadow-xs"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                Fine Tracker
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitor and record leave infractions for morning & evening sessions
              </p>
            </div>

            {/* Stat Pills */}
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200/80 px-3.5 py-2 rounded-2xl shadow-xs">
                <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Collected</p>
                <p className="text-sm font-extrabold text-slate-800">₹{totalCollected}</p>
              </div>
              <div className="bg-white border border-slate-200/80 px-3.5 py-2 rounded-2xl shadow-xs">
                <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider">Pending</p>
                <p className="text-sm font-extrabold text-slate-800">₹{totalPending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add / Edit Fine Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8 transition-all">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Plus size={18} />
            </div>
            {editingId ? "Edit Fine Record" : "Issue New Fine"}
          </h2>

          <form onSubmit={handleSaveFine} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Select Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition"
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentClass || 'Class N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Session Type</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSessionType('Morning')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    sessionType === 'Morning' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sun size={14} /> Morning
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('Evening')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    sessionType === 'Evening' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Moon size={14} /> Evening
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Fine Amount (₹)</label>
              <input
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition"
                placeholder="e.g. 50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Date</label>
              <input
                type="date"
                value={fineDate}
                onChange={(e) => setFineDate(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Payment Status</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFineStatus('Pending')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    fineStatus === 'Pending' ? 'bg-red-50 text-red-600 shadow-xs border border-red-100' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock size={14} /> Pending
                </button>
                <button
                  type="button"
                  onClick={() => setFineStatus('Paid')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    fineStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 shadow-xs border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 size={14} /> Paid
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Reason / Infraction</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition"
                placeholder="e.g. Uninformed Leave"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 mt-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setSelectedStudent(''); }}
                  className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-7 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-200 transition flex items-center gap-2"
              >
                {editingId ? <Check size={16} /> : <Plus size={16} />}
                {editingId ? "Update Fine Record" : "Add Fine Record"}
              </button>
            </div>
          </form>
        </div>

        {/* View Fines History List */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertCircle size={18} />
            </div>
            Recorded Fines History ({finesList.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading fines history...</div>
          ) : finesList.length > 0 ? (
            <div className="space-y-3.5">
              {finesList.map((item) => {
                const isPaid = item.status === 'Paid';
                return (
                  <div 
                    key={item.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl bg-slate-50/60 border border-slate-200/65 hover:border-purple-200 hover:bg-purple-50/20 transition-all gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5 shadow-xs">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm tracking-tight">{item.studentName}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            item.session === 'Evening' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {item.session === 'Evening' ? <Moon size={11} /> : <Sun size={11} />}
                            {item.session || 'Morning'}
                          </span>
                          
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar size={12} /> {item.date}
                          </span>

                          <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {item.reason || 'Uninformed Leave'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-800">
                          ₹{item.amount}
                        </span>
                        <div>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                              isPaid 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                            }`}
                            title="Click to toggle Paid/Pending"
                          >
                            {isPaid ? '✓ Paid' : '⏳ Pending'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition shadow-xs"
                          title="Edit Fine"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition shadow-xs"
                          title="Delete Fine"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <AlertCircle size={24} />
              </div>
              <p className="font-semibold text-slate-600 text-sm">No fine records found</p>
              <p className="text-xs mt-1 text-slate-400">Use the form above to add a fine for leave infractions.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}