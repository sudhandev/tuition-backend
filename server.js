import process from 'node:process';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://projoker1015_db_user:nYhpf1tPzXzESvDY@cluster0.kabe8ey.mongodb.net/tuitionDB?retryWrites=true&w=majority&appName=Cluster0';
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas Online Cloud!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Schemas & Models (Previous records remain completely safe and untouched) ---
const studentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: String,
  studentClass: String,
  joiningDate: String,
  fees: Number,
  birthday: String,
  dob: String,
  deletedAt: String
});

const Student = mongoose.model('Student', studentSchema);
const DeletedStudent = mongoose.model('DeletedStudent', studentSchema);

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  attendance: Object,
  feesPaid: Object,
  sessions: { type: Object, default: {} }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

const feeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  standard: String,
  amount: String
});
const Fee = mongoose.model('Fee', feeSchema);

const noteSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
});
const Note = mongoose.model('Note', noteSchema);

// --- New Fine Schema & Model (Added safely without affecting existing collections) ---
const fineSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentId: String,
  studentName: String,
  session: String,
  amount: Number,
  date: String,
  reason: String,
  status: { type: String, default: 'Pending' }
});
const Fine = mongoose.model('Fine', fineSchema);

// 1. GET: Fetch all active students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST: Add a new student
app.post('/api/students', async (req, res) => {
  try {
    const newStudent = new Student({
      id: Date.now(),
      ...req.body
    });
    await newStudent.save();
    res.status(201).json({ message: 'Student added successfully!', student: newStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE: Remove a student by ID and archive them
app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const student = await Student.findOne({ id: studentId });
    
    if (student) {
      const archivedData = student.toObject();
      delete archivedData._id;
      archivedData.deletedAt = new Date().toISOString().split('T')[0];

      await DeletedStudent.create(archivedData);
      await Student.deleteOne({ id: studentId });

      res.json({ message: 'Student archived successfully!', student: archivedData });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Permanently remove a student from both active and archived lists
app.delete('/api/students/permanent/:id', async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    await Student.deleteOne({ id: studentId });
    await DeletedStudent.deleteOne({ id: studentId });
    res.json({ message: 'Student permanently deleted from database!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT: Update an existing student by ID
app.put('/api/students/:id', async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const updatedStudent = await Student.findOneAndUpdate({ id: studentId }, req.body, { new: true });
    
    if (updatedStudent) {
      res.json({ message: 'Student updated successfully!', student: updatedStudent });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET: Fetch attendance (per session) & fee records
app.get('/api/attendance', async (req, res) => {
  try {
    const { date, session = 'Morning' } = req.query;
    const record = await Attendance.findOne({ date });
    
    if (!record) {
      return res.json({ attendance: {}, feesPaid: {} });
    }

    const sessionAttendance = (record.sessions && record.sessions[session] && record.sessions[session].attendance) 
      ? record.sessions[session].attendance 
      : (session === 'Morning' ? (record.attendance || {}) : {});

    const feesPaid = record.feesPaid || (record.sessions && record.sessions['Morning'] && record.sessions['Morning'].feesPaid) || {};

    res.json({
      attendance: sessionAttendance,
      feesPaid: feesPaid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST: Save attendance and fees safely
app.post('/api/attendance', async (req, res) => {
  try {
    const { date, session = 'Morning', attendanceData, feesPaidData } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    let record = await Attendance.findOne({ date });

    if (!record) {
      record = new Attendance({ date, sessions: {} });
    }

    if (!record.sessions) {
      record.sessions = {};
    }

    if (!record.sessions[session]) {
      record.sessions[session] = { attendance: {}, feesPaid: {} };
    }

    if (attendanceData && Object.keys(attendanceData).length > 0) {
      record.sessions[session].attendance = attendanceData;
      if (session === 'Morning') {
        record.attendance = attendanceData;
      }
    }

    if (feesPaidData) {
      record.feesPaid = feesPaidData;
      if (!record.sessions['Morning']) record.sessions['Morning'] = { attendance: {}, feesPaid: {} };
      if (!record.sessions['Evening']) record.sessions['Evening'] = { attendance: {}, feesPaid: {} };
      record.sessions['Morning'].feesPaid = feesPaidData;
      record.sessions['Evening'].feesPaid = feesPaidData;
    }

    record.markModified('sessions');
    await record.save();

    res.json({ message: `${session} session records saved successfully!` });
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. GET: Fetch all attendance records across all dates and sessions for reports
app.get('/api/all-attendance', async (req, res) => {
  try {
    const records = await Attendance.find();
    const formattedRecords = {};
    
    records.forEach(r => {
      if (r.sessions && Object.keys(r.sessions).length > 0) {
        formattedRecords[r.date] = r.sessions;
      } else {
        formattedRecords[r.date] = {
          Morning: { attendance: r.attendance, feesPaid: r.feesPaid }
        };
      }
    });

    res.json(formattedRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET: Fetch deleted/previous students archive
app.get('/api/deleted-students', async (req, res) => {
  try {
    const deleted = await DeletedStudent.find();
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Restore a deleted student back to active roster
app.post('/api/students/restore/:id', async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const student = await DeletedStudent.findOne({ id: studentId });

    if (student) {
      const restoredData = student.toObject();
      delete restoredData._id;
      delete restoredData.deletedAt;

      await Student.create(restoredData);
      await DeletedStudent.deleteOne({ id: studentId });

      res.json({ message: 'Student restored successfully!', student: restoredData });
    } else {
      res.status(404).json({ message: 'Archived student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FEES STRUCTURE ENDPOINTS ---

app.get('/api/fees', async (req, res) => {
  try {
    const fees = await Fee.find();
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fees', async (req, res) => {
  try {
    const newFee = new Fee({
      id: Date.now(),
      ...req.body
    });
    await newFee.save();
    res.status(201).json({ message: 'Fee plan added successfully!', feePlan: newFee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fees/:id', async (req, res) => {
  try {
    const feeId = Number(req.params.id);
    const result = await Fee.deleteOne({ id: feeId });
    if (result.deletedCount > 0) {
      res.json({ message: 'Fee plan deleted successfully!' });
    } else {
      res.status(404).json({ message: 'Fee plan not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- KEEP NOTES ENDPOINTS (Fixed for MongoDB ObjectId & Numeric ID support) ---

app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ _id: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const newNote = new Note({
      id: Date.now(),
      ...req.body
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    let updatedNote;

    if (mongoose.Types.ObjectId.isValid(paramId)) {
      updatedNote = await Note.findByIdAndUpdate(
        paramId,
        { title: req.body.title, content: req.body.content },
        { new: true }
      );
    } else {
      updatedNote = await Note.findOneAndUpdate(
        { id: Number(paramId) },
        { title: req.body.title, content: req.body.content },
        { new: true }
      );
    }

    if (updatedNote) {
      res.json(updatedNote);
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    let result;

    if (mongoose.Types.ObjectId.isValid(paramId)) {
      result = await Note.findByIdAndDelete(paramId);
    } else {
      result = await Note.deleteOne({ id: Number(paramId) });
    }

    if (result) {
      res.json({ message: 'Note deleted successfully!' });
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FINE TRACKER ENDPOINTS ---

app.get('/api/fines', async (req, res) => {
  try {
    const fines = await Fine.find().sort({ _id: -1 });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fines', async (req, res) => {
  try {
    const newFine = new Fine({
      id: Date.now().toString(),
      ...req.body
    });
    await newFine.save();
    res.status(201).json(newFine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fines/:id', async (req, res) => {
  try {
    const fineId = req.params.id;
    const updatedFine = await Fine.findOneAndUpdate({ id: fineId }, req.body, { new: true });
    if (updatedFine) {
      res.json({ message: 'Fine updated successfully!', fine: updatedFine });
    } else {
      res.status(404).json({ message: 'Fine record not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fines/:id', async (req, res) => {
  try {
    const fineId = req.params.id;
    const result = await Fine.deleteOne({ id: fineId });
    if (result.deletedCount > 0) {
      res.json({ message: 'Fine deleted successfully!' });
    } else {
      res.status(404).json({ message: 'Fine record not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const HOST_PORT = process.env.PORT || PORT;
app.listen(HOST_PORT, () => {
  console.log(`Backend server running on port ${HOST_PORT}`);
});