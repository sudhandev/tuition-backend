import { useState } from "react";
import { UserRoundPlus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function AddStudent({ students, setStudents }) {
  // 1. Define your dynamic API URL here
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Local state for all student details
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [dob, setDob] = useState("");
  const [fees, setFees] = useState("");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Create the new student object
    const newStudent = {
      name: name,
      studentClass: studentClass || "N/A",
      dob: dob || "N/A",
      fees: fees || "N/A",
      phone: phone || "N/A",
      joiningDate: joiningDate,
      status: "Present",
    };

    try {
      // 2. Use the dynamic API_URL in your fetch request
      const response = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the saved student (with backend ID) to master list
        setStudents([...students, data.student]);

        // Reset form fields
        setName("");
        setStudentClass("");
        setDob("");
        setFees("");
        setPhone("");
        setJoiningDate(new Date().toISOString().split("T")[0]);

        toast.success("Student added and saved to database successfully!");
      } else {
        toast.error("Failed to save student.");
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      toast.error("Could not connect to the backend server.");
    }
  };

  return (
    <div className="max-w-screen-md mx-auto bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-purple-800 mb-6 flex gap-3 items-center">
      <Link
        to="/"
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-purple-600 hover:border-purple-200 transition"
      >
        <ArrowLeft size={20} />
      </Link>
        <UserRoundPlus color="purple" size={30} strokeWidth={2} /> Add New
        Student
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Name */}
        <div>
          <label className="block text-sm font-medium text-purple-700 mb-1">
            Student Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Class / Standard */}
        <div>
          <label className="block text-sm font-medium text-purple-700 mb-1">
            Class / Standard
          </label>
          <input
            type="text"
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            placeholder="e.g. 10th Standard Math"
            className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Two-column layout for Date of Birth & Fees Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Fees Amount (₹)
            </label>
            <input
              type="text"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Two-column layout for Phone Number & Date of Joining */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter contact number"
              className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Date of Joining
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors mt-4"
        >
          Save Student Details
        </button>
      </form>
    </div>
  );
}