
import React, { useState, useEffect } from 'react';

interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (data: { name?: string; email: string; password?: string }) => void;
  error?: string | null; // General error from parent (e.g., API error)
  loading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin, onSubmit, error: parentError, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [nameBlurred, setNameBlurred] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [confirmPasswordBlurred, setConfirmPasswordBlurred] = useState(false);

  const validateName = (currentName: string): boolean => {
    if (!isLogin) {
      if (!currentName.trim()) {
        setNameError('Full Name is required.');
        return false;
      }
      if (currentName.trim().length < 2) {
        setNameError('Full Name must be at least 2 characters.');
        return false;
      }
      if (!/^[A-Za-z\s.'-]+$/.test(currentName.trim())) {
        setNameError('Full Name can only contain letters, spaces, and basic punctuation.');
        return false;
      }
    }
    setNameError(null);
    return true;
  };

  const validateEmail = (currentEmail: string): boolean => {
    if (!currentEmail.trim()) {
      setEmailError('Email is required.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(currentEmail)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (currentPassword: string): boolean => {
    if (!currentPassword) {
      setPasswordError('Password is required.');
      return false;
    }
    if (currentPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (currentConfirmPassword: string, currentPassword: string): boolean => {
    if (!isLogin) {
      if (!currentConfirmPassword) {
        setConfirmPasswordError('Please confirm your password.');
        return false;
      }
      if (currentConfirmPassword !== currentPassword) {
        setConfirmPasswordError('Passwords do not match.');
        return false;
      }
    }
    setConfirmPasswordError(null);
    return true;
  };

  useEffect(() => {
    if (nameBlurred && !isLogin) validateName(name);
  }, [name, nameBlurred, isLogin]);

  useEffect(() => {
    if (emailBlurred) validateEmail(email);
  }, [email, emailBlurred]);

  useEffect(() => {
    if (passwordBlurred) validatePassword(password);
    // Re-validate confirm password if password changes
    if (confirmPasswordBlurred && !isLogin) validateConfirmPassword(confirmPassword, password);
  }, [password, passwordBlurred, confirmPassword, confirmPasswordBlurred, isLogin]);

  useEffect(() => {
    if (confirmPasswordBlurred && !isLogin) validateConfirmPassword(confirmPassword, password);
  }, [confirmPassword, confirmPasswordBlurred, password, isLogin]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger blur on all fields to show errors if not touched
    if (!isLogin) setNameBlurred(true);
    setEmailBlurred(true);
    setPasswordBlurred(true);
    if (!isLogin) setConfirmPasswordBlurred(true);

    const isNameValid = isLogin ? true : validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = isLogin ? true : validateConfirmPassword(confirmPassword, password);

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
       onSubmit({ name: isLogin ? undefined : name, email, password });
    }
  };
  
  const isSignupDisabled = loading || !!nameError || !!emailError || !!passwordError || !!confirmPasswordError || 
                           (!isLogin && (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || password !== confirmPassword || name.trim().length < 2));
  const isLoginDisabled = loading || !!emailError || !!passwordError || !email.trim() || !password.trim();


  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-primary mb-6">
        {isLogin ? 'Welcome Back!' : 'Create Account'}
      </h2>
      
      {parentError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{parentError}</span>
        </div>
      )}

      {!isLogin && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required={!isLogin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {setNameBlurred(true); validateName(name);}}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm 
                          ${nameError && nameBlurred ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
              placeholder="John Doe"
              aria-invalid={nameError && nameBlurred ? true : undefined}
              aria-describedby={nameError && nameBlurred ? "name-error" : undefined}
            />
          </div>
          {nameError && nameBlurred && <p id="name-error" className="mt-1 text-xs text-red-500">{nameError}</p>}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {setEmailBlurred(true); validateEmail(email);}}
            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm
                        ${emailError && emailBlurred ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
            placeholder="you@example.com"
            aria-invalid={emailError && emailBlurred ? true : undefined}
            aria-describedby={emailError && emailBlurred ? "email-error" : undefined}
          />
        </div>
        {emailError && emailBlurred && <p id="email-error" className="mt-1 text-xs text-red-500">{emailError}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => {setPasswordBlurred(true); validatePassword(password);}}
            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm
                        ${passwordError && passwordBlurred ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
            placeholder="••••••••"
            aria-invalid={passwordError && passwordBlurred ? true : undefined}
            aria-describedby={passwordError && passwordBlurred ? "password-error" : undefined}
          />
        </div>
        {passwordError && passwordBlurred && <p id="password-error" className="mt-1 text-xs text-red-500">{passwordError}</p>}
      </div>

      {!isLogin && (
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required={!isLogin}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => {setConfirmPasswordBlurred(true); validateConfirmPassword(confirmPassword, password);}}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm
                          ${confirmPasswordError && confirmPasswordBlurred ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
              placeholder="••••••••"
              aria-invalid={confirmPasswordError && confirmPasswordBlurred ? true : undefined}
              aria-describedby={confirmPasswordError && confirmPasswordBlurred ? "confirm-password-error" : undefined}
            />
          </div>
          {confirmPasswordError && confirmPasswordBlurred && <p id="confirm-password-error" className="mt-1 text-xs text-red-500">{confirmPasswordError}</p>}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLogin ? isLoginDisabled : isSignupDisabled}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 transition-colors"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;
