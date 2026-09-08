import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithGoogle, auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('该邮箱已被注册，请直接登录');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('邮箱或密码错误');
      } else if (err.code === 'auth/weak-password') {
        setError('密码强度太弱，请至少输入6位字符');
      } else {
        setError(isRegistering ? '注册失败，请稍后重试' : '登录失败，请检查网络或稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col items-center justify-center p-4 font-sans selection:bg-neutral-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
        <div className="p-8 pb-6 text-center">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="text-white font-bold text-3xl leading-none">D</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">DebtFree</h1>
          <p className="text-neutral-500 text-sm">
            智能债务管理与现金流追踪工具
          </p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start p-3 text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-100">
                <AlertCircle size={16} className="shrink-0 mt-0.5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="电子邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : isRegistering ? (
                '注册账号'
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              {isRegistering ? '已有账号？' : '还没有账号？'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-neutral-900 font-medium hover:underline"
            >
              {isRegistering ? '返回登录' : '立即注册'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">或</span>
            </div>
          </div>

          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center space-x-2 bg-white border border-neutral-200 text-neutral-900 px-6 py-3 rounded-xl font-medium hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>使用 Google 账号继续</span>
          </button>
        </div>
      </div>
    </div>
  );
}
