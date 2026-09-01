import { useState, useEffect } from 'react';
import { Plus, Trash2, StickyNote, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Notes() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/notes`)
      .then((res) => res.json())
      .then((data) => setNotes(data))
      .catch((err) => {
        console.error('Error fetching notes:', err);
        toast.error('Failed to load notes.');
      });
  }, [API_URL]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await response.json();
      if (response.ok) {
        setNotes([data, ...notes]);
        setTitle('');
        setContent('');
        toast.success('Note added successfully!');
      } else {
        toast.error('Failed to add note.');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Could not connect to server.');
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotes(notes.filter((n) => n._id !== id));
        toast.success('Note deleted!');
      } else {
        toast.error('Failed to delete note.');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      toast.error('Could not connect to server.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl mb-3 hover:bg-amber-100 transition shadow-sm">
          <ArrowLeft size={16} /> Back to Main Page
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <StickyNote size={28} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Keep Notes</h1>
            <p className="text-sm text-slate-400 mt-1">Jot down quick reminders, homework, or ideas</p>
          </div>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-bold text-slate-800 text-base outline-none bg-transparent border-b border-slate-100 pb-2"
            required
          />
          <textarea
            placeholder="Take a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full text-sm text-slate-600 outline-none bg-transparent resize-none"
            required
          />
          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition">
              <Plus size={16} /> Add Note
            </button>
          </div>
        </form>

        {/* Notes Grid */}
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div key={note._id} className="bg-amber-50/60 border border-amber-200/60 rounded-3xl p-5 flex flex-col justify-between shadow-sm relative group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-800">{note.title}</h3>
                    <button onClick={() => handleDeleteNote(note._id)} className="text-slate-400 hover:text-red-600 transition p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{note.content}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-4 block">{note.createdAt}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            <StickyNote size={36} className="mx-auto mb-2 text-amber-500 opacity-60" />
            <h3 className="font-bold text-slate-700">No notes yet</h3>
            <p className="text-sm text-slate-400 mt-1">Create your first note above!</p>
          </div>
        )}
      </div>
    </main>
  );
}