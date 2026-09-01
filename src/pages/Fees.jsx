import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  IndianRupee,
  BookOpen,
  Trash2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Fees() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [feesPlans, setFeesPlans] = useState([]);
  const [newStandard, setNewStandard] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Fetch fee plans from backend on load
  useEffect(() => {
    fetch(`${API_URL}/api/fees`)
      .then((res) => res.json())
      .then((data) => setFeesPlans(data))
      .catch((err) => {
        console.error('Error fetching fees:', err);
        toast.error('Failed to load fee plans.');
      });
  }, [API_URL]);

  const handleAddFee = async (e) => {
    e.preventDefault();

    if (!newStandard.trim() || !newAmount.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standard: newStandard, amount: newAmount }),
      });
      const data = await response.json();

      if (response.ok) {
        setFeesPlans((prev) => [...prev, data.feePlan]);
        setNewStandard('');
        setNewAmount('');
        toast.success('Fee plan added successfully!');
      } else {
        toast.error('Failed to add fee plan.');
      }
    } catch (err) {
      console.error('Error adding fee plan:', err);
      toast.error('Could not connect to server.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/fees/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFeesPlans((prev) => prev.filter((plan) => plan.id !== id));
        toast.success('Fee plan deleted successfully!');
      } else {
        toast.error('Failed to delete fee plan.');
      }
    } catch (err) {
      console.error('Error deleting fee plan:', err);
      toast.error('Could not connect to server.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-200">
              <Wallet size={28} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Fees Structures
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage monthly tuition fees by class
              </p>
            </div>
          </div>
        </div>

        {/* ================= ADD FEE ================= */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Plus size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Add New Fee Plan</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create a monthly fee structure
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAddFee}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Standard */}
            <div className="relative">
              <BookOpen
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={newStandard}
                onChange={(e) => setNewStandard(e.target.value)}
                placeholder="Class / Subject"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
                required
              />
            </div>

            {/* Amount */}
            <div className="relative">
              <IndianRupee
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Monthly amount"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition"
                required
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              className="group bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl font-semibold transition-all duration-300 shadow-md shadow-purple-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Plus
                size={19}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              Add Fee Plan
            </button>
          </form>
        </section>

        {/* ================= SECTION TITLE ================= */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Current Fee Plans
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {feesPlans.length} active plan
              {feesPlans.length !== 1 && 's'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-purple-500 bg-purple-50 px-3 py-2 rounded-full">
            <Sparkles size={14} />
            Active Plans
          </div>
        </div>

        {/* ================= FEE CARDS ================= */}
        {feesPlans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feesPlans.map((plan) => (
              <div
                key={plan.id}
                className="group bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <BookOpen size={21} className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-base sm:text-lg truncate">
                        {plan.standard}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Monthly payment
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="w-9 h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200 shrink-0"
                    title="Delete fee plan"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Monthly Fee
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <IndianRupee
                        size={20}
                        className="text-purple-600"
                        strokeWidth={2.5}
                      />
                      <span className="text-2xl font-bold text-purple-600">
                        {plan.amount}
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase">
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center">
              <Wallet size={26} className="text-purple-500" />
            </div>
            <h3 className="font-bold text-slate-700 mt-4">No fee plans yet</h3>
            <p className="text-sm text-slate-400 mt-1">
              Add your first fee plan using the form above.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}