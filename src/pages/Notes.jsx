import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Check, StickyNote, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Notes() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

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

  const startEditing = (note) => {
    setEditingId(note._id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleUpdateNote = async (id) => {
    if (!editTitle.trim() || !editContent.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });
      const data = await response.json();
      if (response.ok) {
        setNotes(notes.map((n) => (n._id === id ? data : n)));
        toast.success('Note updated successfully!');
        cancelEditing();
      } else {
        toast.error('Failed to update note.');
      }
    } catch (err) {
      console.error('Error updating note:', err);
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
            {notes.map((note) => {
              const isEditing = editingId === note._id;

              return (
                <div key={note._id} className="bg-amber-50/60 border border-amber-200/60 rounded-3xl p-5 flex flex-col justify-between shadow-sm relative group">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full font-bold text-slate-800 text-sm outline-none bg-white border border-amber-300 rounded-xl px-3 py-1.5"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full text-xs text-slate-600 outline-none bg-white border border-amber-300 rounded-xl p-3 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEditing} className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                          <X size={14} /> Cancel
                        </button>
                        <button onClick={() => handleUpdateNote(note._id)} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-slate-800">{note.title}</h3>
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditing(note)} className="text-slate-400 hover:text-amber-600 transition p-1">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDeleteNote(note._id)} className="text-slate-400 hover:text-red-600 transition p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{note.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-4 block">{note.createdAt}</span>
                    </>
                  )}
                </div>
              );
            })}
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