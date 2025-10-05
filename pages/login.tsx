/*import { useState } from 'react';
import { logIn } from '../actions/auth';
import { toast } from 'react-toastify';
import router from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await logIn(email, password);
      toast.success('Login successful!');
      router.push('/vault');
      // You can redirect the user to the protected vault page here
    } catch (error: any) {
      alert('Error logging in: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded shadow">
      <h1 className="text-2xl mb-4 font-bold">Log In</h1>
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
        onClick={handleLogin}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Log In
      </button>
    </div>
  );
}*/
import { useState } from 'react';
import { logIn } from '../actions/auth';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await logIn(email, password);
      toast.success('Login successful!');
      router.push('/vault');
      // You can redirect the user to the protected vault page here
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      alert('Error logging in: ' + errMsg);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded shadow">
      <h1 className="text-2xl mb-4 font-bold">Log In</h1>
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
        onClick={handleLogin}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Log In
      </button>
    </div>
  );
}

