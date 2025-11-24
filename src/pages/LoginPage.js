import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { FormInput, FormButton } from '../components/common/FormElements';

const LoginPage = ({ auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError('Email ou senha inválidos. Por favor, tente novamente.');
            console.error("Erro de login:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="flex justify-center">
                    <img src="/logo-driva-positiva.png" alt="Logo Driva" className="h-12" />
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-800">Acesso ao PRM Driva</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <FormInput id="email" name="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <FormInput id="password" name="password" type="password" label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <div className="flex items-center">
                        <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Continuar logado</label>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <FormButton disabled={loading}>{loading ? 'A entrar...' : 'Entrar'}</FormButton>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
