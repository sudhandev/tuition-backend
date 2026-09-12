import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  UserPlus,
  UserMinus,
  Archive,
  Wallet,
  BookOpenCheck,
  NotebookPen,
  DollarSign,
} from "lucide-react";
export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Attendance", icon: <Calendar size={20} /> },
    {
      path: "/add-student",
      label: "Add New Student",
      icon: <UserPlus size={20} />,
    },
    {
      path: "/remove-student",
      label: "Remove Student",
      icon: <UserMinus size={20} />,
    },
    {
      path: "/previous-students",
      label: "Previous Students",
      icon: <Archive size={20} />,
    },
    { path: "/fees", label: "Fees Structures", icon: <Wallet size={20} /> },
    
    { path: "/fines", label: "Fine Tracker", icon: <DollarSign size={20} /> },
    { path: "/notes", label: "Notes", icon: <NotebookPen size={20} /> },
    {
      path: "/attendance-report",
      label: "Attendance Report",
      icon: <BookOpenCheck size={20} />,
    },
  ];

  return (
    <>
      <div className="navbar-container fixed top-0 left-0 w-full z-50 flex items-center justify-between  text-white shadow-md p-4">
        <div className="">
          {/* Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className=" z-50 p-3 h-14 w-14 rounded-xl text-xl  bg-purple-400 text-white shadow-lg hover:bg-purple-400 transition"
          >
            {isOpen ? "✕" : "☰"}
          </button>

          {/* Overlay */}
          {isOpen && (
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg- z-30"
            />
          )}

          <aside
            className={`fixed top-24 left-0 z-40 h-screen w-72  bg-slate-100 text-white shadow-xl transform transition-transform duration-300 ${
              isOpen ? "translate-x-0 shadow-purple-400" : "-translate-x-full"
            }`}
          >
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl transition-all  font-medium text-l text-purple-400  ${
                      isActive
                        ? "bg-purple-400 text-white! shadow-md"
                        : "text-purple-800 hover:bg-purple-600 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2 gap-5">
                      {link.icon}
                      {link.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
        <Link
          to="/"
          className="text-purple-600 hover:text-purple-800 transition"
        >
          <div className="name text-2xl font-bold text-purple-600 hover:text-purple-800 transition p-4 flex items-center gap-2">
            {<BookOpenCheck size={32} strokeWidth={2.5} />} <p>Attendance </p>
          </div>
        </Link>
      </div>
    </>
  );
}
