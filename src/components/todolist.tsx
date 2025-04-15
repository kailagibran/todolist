'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';
import { FaEdit, FaTrash, FaPlus, FaBook } from 'react-icons/fa';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(
        tasksData.sort(
          (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        )
      );
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return '⏰ Waktu habis';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}s`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Tugas',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Judul Tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const text = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement).value;
        return [text, deadline];
      },
    });

    if (formValues && formValues[0]?.trim() && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    } else {
      Swal.fire('Oops!', 'Semua bidang harus diisi', 'error');
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const formattedDeadline = new Date(task.deadline).toISOString().slice(0, 16);
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${formattedDeadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const text = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement).value;
        return [text, deadline];
      },
    });

    if (formValues && formValues[0]?.trim() && formValues[1]) {
      const updatedTask = {
        ...task,
        text: formValues[0],
        deadline: formValues[1],
      };

      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
    } else {
      Swal.fire('Oops!', 'Semua bidang harus diisi', 'error');
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div
      className="min-h-screen p-4 flex items-center justify-center"
      style={{ backgroundColor: '#6DE1D2' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800 flex items-center justify-center gap-2">
            <FaBook />
            Todo List
          </h1>

          <button
            onClick={addTask}
            className="mb-4 w-full bg-[#0118D8] text-white py-1.5 text-sm rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <FaPlus />
            Tambah Tugas
          </button>

          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`p-4 border rounded flex justify-between items-center ${
                  task.completed
                    ? 'bg-gray-200 line-through'
                    : timeRemaining[task.id] === '⏰ Waktu habis'
                      ? 'bg-red-100'
                      : 'bg-gray-50'
                }`}
              >
                <div onClick={() => toggleTask(task.id)} className="cursor-pointer flex-1 mr-4">
                  <p className="text-lg font-medium text-gray-800">{task.text}</p>
                  <p className="text-xs text-gray-500">📅 {new Date(task.deadline).toLocaleString()}</p>
                  <p className={`text-xs ${
                    timeRemaining[task.id] === '⏰ Waktu habis'
                      ? 'text-red-700 font-semibold'
                      : 'text-red-500'
                  }`}>
                    ⏳ {timeRemaining[task.id] || '...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editTask(task)}
                    className="flex items-center px-2 py-1 text-white text-xs rounded bg-[#399918] hover:bg-blue-700 transition"
                  >
                    <FaEdit className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex items-center px-2 py-1 text-white text-xs rounded bg-[#E83F25] hover:bg-blue-700 transition"
                  >
                    <FaTrash className="mr-1" />
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
