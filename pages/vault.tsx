import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabaseClient';
import { fetchPasswords, addPassword, updatePassword, deletePassword, PasswordEntry } from '../actions/vault';
import type { User } from '@supabase/supabase-js';

const ENCRYPTION_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcXl0Y3Z0ZnZiaW5jbGVicG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3ODkwNCwiZXhwIjoyMDc1MTU0OTA0fQ.qrvzZP_gwRP_gkVpIXC3XgBrEKbXpt7IDFGglsErUAE';

export default function VaultPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [form, setForm] = useState({ title: '', username: '', password: '', url: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [genLength, setGenLength] = useState(12);
  const [genIncludeUpper, setGenIncludeUpper] = useState(true);
  const [genIncludeLower, setGenIncludeLower] = useState(true);
  const [genIncludeNumbers, setGenIncludeNumbers] = useState(true);
  const [genIncludeSymbols, setGenIncludeSymbols] = useState(true);
  const [genExcludeLookalikes, setGenExcludeLookalikes] = useState(true);

  const checkPasswordStrength = (password: string) => {
    if (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*()_+\[\]{}|;:,.<>?]/.test(password)
    ) {
      return 'Strong';
    }
    if (password.length === 0) return '';
    if (password.length < 6) return 'Weak';
    if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)) return 'Medium';
    if (/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) return 'Strong';
    return 'Medium';
  };

  const encrypt = (text: string) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();

  const decrypt = (ciphertext: string) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const loadPasswords = useCallback(
    async (userId: string) => {
      setLoading(true);
      try {
        const entries = await fetchPasswords(userId);
        const decrypted = entries.map((entry) => ({
          ...entry,
          password: entry.password ? decrypt(entry.password) : '',
        }));
        setPasswords(decrypted);
      } catch (error) {
        toast.error('Error loading passwords: ' + (error as Error).message);
      }
      setLoading(false);
    },
    [] // no dependencies, stable reference
  );

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        localStorage.setItem('loginTime', new Date().getTime().toString());
        await loadPasswords(user.id);
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    const sessionTimeoutMinutes = 30;

    const checkSessionTimeout = () => {
      const loginTimeStr = localStorage.getItem('loginTime');
      if (loginTimeStr) {
        const loginTime = parseInt(loginTimeStr);
        const now = new Date().getTime();
        const elapsedMinutes = (now - loginTime) / (1000 * 60);
        if (elapsedMinutes > sessionTimeoutMinutes) {
          supabase.auth.signOut().then(() => {
            localStorage.removeItem('loginTime');
            toast.info('Session expired. Please log in again.');
            router.push('/login');
          });
        }
      }
    };

    checkSessionTimeout();
    const intervalId = setInterval(checkSessionTimeout, 30 * 1000);

    const resetLoginTime = () => {
      localStorage.setItem('loginTime', new Date().getTime().toString());
    };
    window.addEventListener('mousemove', resetLoginTime);
    window.addEventListener('keydown', resetLoginTime);
    window.addEventListener('click', resetLoginTime);

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(intervalId);
      window.removeEventListener('mousemove', resetLoginTime);
      window.removeEventListener('keydown', resetLoginTime);
      window.removeEventListener('click', resetLoginTime);
    };
  }, [router, loadPasswords]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'password') {
      const strength = checkPasswordStrength(value);
      if (strength === 'Weak') {
        setFormErrors((prev) => ({ ...prev, password: 'Password is too weak' }));
      }
    }
  };

  const handleSubmit = async () => {
    const errors: { [key: string]: string } = {};

    if (!form.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!form.password.trim()) {
      errors.password = 'Password is required';
    } else {
      const strength = checkPasswordStrength(form.password);
      if (strength === 'Weak') {
        errors.password = 'Password is too weak';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      for (const key in errors) {
        toast.error(errors[key]);
      }
      return;
    }

    const encryptedPassword = encrypt(form.password);
    const entry: PasswordEntry = {
      user_id: user!.id,
      title: form.title,
      username: form.username,
      password: encryptedPassword,
      url: form.url,
      notes: form.notes,
    };

    setLoading(true);
    try {
      if (editingId) {
        await updatePassword(editingId, entry);
        setEditingId(null);
      } else {
        await addPassword(entry);
      }
      setForm({ title: '', username: '', password: '', url: '', notes: '' });
      await loadPasswords(user!.id);
      toast.success('Password saved successfully');
    } catch (error) {
      toast.error('Error saving password: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const handleEdit = (entry: PasswordEntry) => {
    setEditingId(entry.id || null);
    setForm({
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url || '',
      notes: entry.notes || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    setLoading(true);
    try {
      await deletePassword(id);
      await loadPasswords(user!.id);
    } catch (error) {
      toast.error('Error deleting password: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('Password copied to clipboard');
        setTimeout(() => {
          navigator.clipboard.writeText(''); // Clear clipboard after 10 seconds
        }, 10000);
      })
      .catch(() => toast.error('Failed to copy password'));
  };

  // Export vault data handler
  const handleExport = () => {
    if (passwords.length === 0) {
      toast.error('No passwords to export');
      return;
    }
    const passphrase = prompt('Enter a passphrase to encrypt the export file:');
    if (!passphrase) {
      toast.error('Export cancelled (passphrase required)');
      return;
    }
    const dataToExport = passwords.map(({ password, ...rest }) => ({
      ...rest,
      password,
    }));
    const jsonString = JSON.stringify(dataToExport);
    const encrypted = CryptoJS.AES.encrypt(jsonString, passphrase).toString();
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vault.enc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Encrypted vault file saved');
  };

  // Import vault data handler
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const passphrase = prompt('Enter the decryption passphrase:');
    if (!passphrase) {
      toast.error('Import cancelled (passphrase required)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const encryptedText = reader.result as string;
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
        const jsonString = decryptedBytes.toString(CryptoJS.enc.Utf8);
        const data: PasswordEntry[] = JSON.parse(jsonString);
        if (!Array.isArray(data)) throw new Error('Invalid file format');

        setLoading(true);
        for (const item of data) {
          const encryptedPassword = encrypt(item.password);
          await addPassword({
            user_id: user!.id,
            title: item.title,
            username: item.username,
            password: encryptedPassword,
            url: item.url,
            notes: item.notes,
          });
        }
        await loadPasswords(user!.id);
        toast.success('Vault imported successfully');
      } catch (err) {
        toast.error('Failed to decrypt/import: ' + (err as Error).message);
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  if (!user) return null;

 /* const generatePassword = () => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';

    if (genExcludeLookalikes) {
      upper = upper.replaceAll(/[OIL]/g, '');
      lower = lower.replaceAll(/[lo]/g, '');
      numbers = numbers.replaceAll(/[01]/g, '');
    }

    let pool = '';
    if (genIncludeUpper) pool += upper;
    if (genIncludeLower) pool += lower;
    if (genIncludeNumbers) pool += numbers;
    if (genIncludeSymbols) pool += symbols;
    if (pool.length === 0) return '';

    let password = '';
    // Guarantee one from each selected type for extra security
    if (genIncludeUpper) password += upper[Math.floor(Math.random() * upper.length)];
    if (genIncludeLower) password += lower[Math.floor(Math.random() * lower.length)];
    if (genIncludeNumbers) password += numbers[Math.floor(Math.random() * numbers.length)];
    if (genIncludeSymbols) password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < genLength; ++i) {
      password += pool[Math.floor(Math.random() * pool.length)];
    }
    // Shuffle for randomness
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  };*/
  const generatePassword = () => {
  const minLength = Math.max(genLength, 12); // enforce minimum length of 12
  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lower = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';

  if (genExcludeLookalikes) {
    upper = upper.replaceAll(/[OIL]/g, '');
    lower = lower.replaceAll(/[lo]/g, '');
    numbers = numbers.replaceAll(/[01]/g, '');
  }

  let pool = '';
  if (genIncludeUpper) pool += upper;
  if (genIncludeLower) pool += lower;
  if (genIncludeNumbers) pool += numbers;
  if (genIncludeSymbols) pool += symbols;
  if (pool.length === 0) return '';

  // Helper to shuffle a string
  const shuffle = (str: string) =>
    str
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

  // Generate candidate password until it is strong
  let password = '';
  do {
    password = '';
    // Guarantee one from each selected category
    if (genIncludeUpper) password += upper[Math.floor(Math.random() * upper.length)];
    if (genIncludeLower) password += lower[Math.floor(Math.random() * lower.length)];
    if (genIncludeNumbers) password += numbers[Math.floor(Math.random() * numbers.length)];
    if (genIncludeSymbols) password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill remaining length
    while (password.length < minLength) {
      password += pool[Math.floor(Math.random() * pool.length)];
    }

    password = shuffle(password);
  } while (checkPasswordStrength(password) !== 'Strong');

  return password;
};

  // Filter passwords based on searchTerm
  const filteredPasswords = passwords.filter((entry) => {
    const lowerTerm = searchTerm.toLowerCase();
    return (
      entry.title.toLowerCase().includes(lowerTerm) ||
      (entry.username && entry.username.toLowerCase().includes(lowerTerm)) ||
      (entry.url && entry.url.toLowerCase().includes(lowerTerm))
    );
  });

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to your Vault, {user.email}</h1>

      <div className="mb-6 border p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Password' : 'Add New Password'}</h2>
        <div className="mb-2">
          <input
            type="text"
            name="title"
            placeholder="Title *"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              setFormErrors((prev) => ({ ...prev, title: '' }));
            }}
            className={`w-full p-2 border rounded ${formErrors.title ? 'border-red-600' : 'border-gray-300'}`}
          />
          {formErrors.title && <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>}
        </div>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 mb-2 border rounded"
        />
        <div className="mb-2 flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2">
            Length:
            <input
              type="range"
              min={8}
              max={32}
              value={genLength}
              onChange={(e) => setGenLength(Number(e.target.value))}
              className="ml-2"
            />
            <span className="ml-2">{genLength}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={genIncludeUpper} onChange={() => setGenIncludeUpper(!genIncludeUpper)} />
            Uppercase
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={genIncludeLower} onChange={() => setGenIncludeLower(!genIncludeLower)} />
            Lowercase
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={genIncludeNumbers} onChange={() => setGenIncludeNumbers(!genIncludeNumbers)} />
            Numbers
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={genIncludeSymbols} onChange={() => setGenIncludeSymbols(!genIncludeSymbols)} />
            Symbols
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={genExcludeLookalikes}
              onChange={() => setGenExcludeLookalikes(!genExcludeLookalikes)}
            />
            Exclude Look-Alikes
          </label>
        </div>

        <div className="flex items-center mb-2">
          <input
            type={showFormPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password *"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 mb-2 border rounded"
          />
          <button type="button" onClick={() => setShowFormPassword((prev) => !prev)} className="ml-2 text-blue-600 hover:underline">
            {showFormPassword ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, password: generatePassword() })}
            className="ml-4 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Generate
          </button>
        </div>
        {form.password && (
          <p className={`text-sm ${formErrors.password ? 'text-red-600' : 'text-green-600'}`}>Strength: {checkPasswordStrength(form.password)}</p>
        )}
        {formErrors.password && <p className="text-red-600 text-sm">{formErrors.password}</p>}

        <input
          type="text"
          name="url"
          placeholder="URL"
          value={form.url}
          onChange={handleChange}
          className="w-full p-2 mb-2 border rounded"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          value={form.notes}
          onChange={handleChange}
          className="w-full p-2 mb-2 border rounded"
        />
        <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editingId ? 'Update' : 'Add'}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ title: '', username: '', password: '', url: '', notes: '' });
            }}
            className="ml-4 px-4 py-2 rounded border"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Export Vault Data
        </button>
        <input id="fileInput" type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => document.getElementById('fileInput')!.click()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Import Vault Data
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by title, username, or URL"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      <h2 className="text-2xl font-semibold mb-4">Saved Passwords</h2>

      {loading && <p>Loading...</p>}
      {!loading && filteredPasswords.length === 0 && <p>No password entries found.</p>}

      <ul>
        {filteredPasswords.map((entry) => (
          <li key={entry.id} className="border p-4 mb-2 rounded flex justify-between items-center">
            <div>
              <p>
                <strong>{entry.title}</strong>
              </p>
              {entry.username && <p>Username: {entry.username}</p>}
              <div className="flex items-center space-x-2">
                <p>Password: {visiblePasswords.has(entry.id || '') ? entry.password : '••••••••'}</p>
                <button onClick={() => entry.id && togglePasswordVisibility(entry.id)} className="text-blue-600 hover:underline">
                  {visiblePasswords.has(entry.id || '') ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => copyToClipboard(entry.password)} className="text-green-600 hover:underline">
                  Copy
                </button>
              </div>
              {entry.url && <p>URL: {entry.url}</p>}
              {entry.notes && <p>Notes: {entry.notes}</p>}
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(entry)} className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500">
                Edit
              </button>
              <button onClick={() => entry.id && handleDelete(entry.id)} className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
