/*import { useState } from 'react';
import { signUp } from '../actions/auth';
import { toast } from 'react-toastify';
import router from 'next/router';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    try {
      await signUp(email, password);
      toast.success('Signup successful! Please log in.');
      router.push('/login');
    } catch (error: any) {
      toast.error('Error signing up: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded shadow">
      <h1 className="text-2xl mb-4 font-bold">Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-6 border rounded"
      />
      <button
        onClick={handleSignUp}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Sign Up
      </button>
    </div>
  );
}*/

import { useState } from 'react';
import { signUp } from '../actions/auth';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function SignUpPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      await signUp(email, password);
      toast.success('Signup successful! Please log in.');
      router.push('/login');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error('Error signing up: ' + errMsg);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded shadow">
      <h1 className="text-2xl mb-4 font-bold">Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-6 border rounded"
      />
      <button
        onClick={handleSignUp}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Sign Up
      </button>
    </div>
  );
}
