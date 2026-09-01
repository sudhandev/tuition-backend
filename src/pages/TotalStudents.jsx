import { useState, useEffect } from "react";
import {
  Search,
  UserRound,
  Phone,
  Calendar,
  IndianRupee,
  BookOpen,
  Edit3,
  X,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function TotalStudents() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  // State for handling the Edit Modal
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    studentClass: "",
    dob: "",
    fees: "",
    phone: "",
    joiningDate: "",
  });

  // Fetch all students from backend on load
  useEffect(() => {
    fetch(`${API_URL}/api/students`)
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => {
        console.error("Error fetching students:", err);
        toast.error("Failed to load students directory.");
      });
  }, [API_URL]);

  // Filter students based on search input
  const currentStudents = Array.isArray(students) ? students : [];
  const filteredStudents = currentStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.studentClass &&
        student.studentClass.toLowerCase().includes(search.toLowerCase())),
  );

  // Open Edit Modal and pre-fill form data
  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || "",
      studentClass: student.studentClass || "",
      dob: student.dob || "",
      fees: student.fees || "",
      phone: student.phone || "",
      joiningDate: student.joiningDate || "",
    });
  };

  // Submit updated student details to backend
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const response = await fetch(
        `${API_URL}/api/students/${editingStudent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Update local state with the edited student data
        setStudents(
          currentStudents.map((s) =>
            s.id === editingStudent.id ? data.student : s,
          ),
        );
        setEditingStudent(null); // Close modal
        toast.success("Student details updated successfully!");
      } else {
        toast.error("Failed to update student details.");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Could not connect to the backend server.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-purple-100 transition shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Main Page
        </Link>
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Total Students Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage, view, and edit all active enrolled tuition students
            </p>
          </div>
          <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-2xl font-bold text-sm self-start sm:self-auto">
            Total Enrolled: {currentStudents.length}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Search Directory
          </label>
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or class..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition text-sm"
            />
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top info badge & Edit button */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <UserRound size={24} />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(student)}
                        className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition"
                        title="Edit Student"
                      >
                        <Edit3 size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Name & Class */}
                  <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">
                    {student.name}
                  </h3>
                  <p className="text-xs text-purple-600 font-medium flex items-center gap-1.5 mb-4">
                    <BookOpen size={14} /> {student.studentClass}
                  </p>

                  {/* Details metadata */}
                  <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone size={14} /> Phone:
                      </span>
                      <span className="font-medium text-slate-700">
                        {student.phone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <IndianRupee size={14} /> Fees:
                      </span>
                      <span className="font-medium text-slate-700">
                        ₹{student.fees}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={14} /> Joined:
                      </span>
                      <span className="font-medium text-slate-700">
                        {student.joiningDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            <UserRound
              size={40}
              className="mx-auto mb-3 opacity-40 text-purple-600"
            />
            <h3 className="font-bold text-slate-700 text-base">
              No students found
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {currentStudents.length === 0
                ? "You haven't added any students yet. Use 'Add New Student' to get started!"
                : "No students match your search criteria."}
            </p>
          </div>
        )}

        {/* EDIT MODAL POPUP */}
        {editingStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Student Details
                </h2>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Class / Standard
                  </label>
                  <input
                    type="text"
                    value={formData.studentClass}
                    onChange={(e) =>
                      setFormData({ ...formData, studentClass: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Fees Amount (₹)
                    </label>
                    <input
                      type="text"
                      value={formData.fees}
                      onChange={(e) =>
                        setFormData({ ...formData, fees: e.target.value })
                      }
                      className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          joiningDate: e.target.value,
                        })
                      }
                      className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="w-1/2 bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}