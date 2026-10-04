import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const data = await loginUser(email, password);
                login(data.token, data.user);
                navigate(data.user.role === 'ADMIN' ? '/demo' : '/');
            } else {
                await registerUser(name, email, password, '');
                const data = await loginUser(email, password);
                login(data.token, data.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--c-bg)',
            color: 'var(--c-text-primary)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '3rem',
                    backgroundColor: 'rgba(247, 244, 236, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid rgba(176,138,62,0.2)',
                    width: '100%',
                    maxWidth: '400px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <Clapperboard color="var(--c-gold)" size={32} />
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <div style={{ color: '#d32f2f', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                    <button type="submit" style={buttonStyle}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--c-text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'var(--c-gold-dark)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </span>
                </p>
            </motion.div>
        </div>
    );
};

const inputStyle = {
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit'
};

const buttonStyle = {
    padding: '1rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'var(--c-gold-dark)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s'
};

export default Login;
