import React, { useState, useEffect, useRef } from 'react';
import { UserRole, UserProfile } from '../../types/database';
import { sendEmailOTP, verifyEmailOTP } from '../../lib/api';
import { 
  Eye, 
  Stethoscope, 
  User, 
  Mail, 
  ShieldCheck, 
  Hospital, 
  Award, 
  Phone, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  X,
  KeyRound,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialRole?: UserRole | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = null
}) => {
  // Step in Auth Flow: 1 = Role Select, 2 = Form Details, 3 = OTP Verification
  const [step, setStep] = useState<1 | 2 | 3>(initialRole ? 2 : 1);
  const [role, setRole] = useState<UserRole>(initialRole || 'patient');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentOtpCode, setSentOtpCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Patient Fields
  const [dateOfBirth, setDateOfBirth] = useState('1988-04-20');
  const [gender, setGender] = useState('Female');

  // Doctor Fields
  const [hospitalName, setHospitalName] = useState('Apex Vision Institute & Eye Hospital');
  const [licenseNumber, setLicenseNumber] = useState('MED-GLAUC-88912');
  const [specialization, setSpecialization] = useState('Glaucoma & Anterior Segment Specialist');

  // 6-digit OTP Inputs
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      setStep(2);
    } else {
      setStep(1);
    }
  }, [initialRole, isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Send OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      setError('Please provide your full name and valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sendEmailOTP({
        email,
        role,
        profileData: {
          fullName,
          phone,
          dateOfBirth,
          gender,
          hospitalName,
          licenseNumber,
          specialization
        }
      });

      setSentOtpCode(res.code);
      setStep(3);
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of complete 6-digit code
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 6) {
        const newDigits = pasted.split('');
        setOtpDigits(newDigits);
        handleAutoVerify(newDigits.join(''));
        return;
      }
    }

    const digit = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    if (newDigits.every(d => d !== '')) {
      handleAutoVerify(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleAutoVerify = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await verifyEmailOTP({ email, otp: code });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendEmailOTP({
        email,
        role,
        profileData: { fullName, phone, dateOfBirth, gender, hospitalName, licenseNumber, specialization }
      });
      setSentOtpCode(res.code);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                OcuTrust Secure Authentication
              </h2>
              <p className="text-xs text-slate-400">Email OTP Verification • MST Blockchain Provenance</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-bold">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: SELECT ROLE (Patient vs Hospital/Doctor)           */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Select Your Access Portal</h3>
                <p className="text-xs text-slate-400">
                  Please choose whether you are logging in as a patient or hospital clinician.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Patient Portal Card */}
                <button
                  type="button"
                  onClick={() => { setRole('patient'); setStep(2); }}
                  className="p-6 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/60 text-left transition-all group flex flex-col justify-between space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                      Patient Portal
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Upload fundus photos, view IOP records & receive blockchain-verified glaucoma reports.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 pt-2 border-t border-slate-800">
                    <span>Proceed as Patient</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Doctor / Hospital Portal Card */}
                <button
                  type="button"
                  onClick={() => { setRole('doctor'); setStep(2); }}
                  className="p-6 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/60 text-left transition-all group flex flex-col justify-between space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Hospital & Clinician Portal
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Optical disc CDR workstation, clinical triage queue & MST Blockchain report anchoring.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 pt-2 border-t border-slate-800">
                    <span>Proceed as Clinician</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: ENTER EMAIL & REGISTRATION DETAILS               */}
          {/* ========================================================= */}
          {step === 2 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Role</span>
                </button>

                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  role === 'patient' ? 'bg-teal-950 text-teal-300 border border-teal-500/30' : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {role === 'patient' ? 'Patient Portal' : 'Hospital Clinician Portal'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {role === 'doctor' ? 'Clinician Full Name' : 'Patient Full Name'} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'doctor' ? 'e.g. Dr. Marcus Vance, MD' : 'e.g. Sarah Jenkins'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (For Secure OTP Verification) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'patient@example.com'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* Patient Fields */}
              {role === 'patient' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Doctor Fields */}
              {role === 'doctor' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Medical License # *
                      </label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="e.g. MED-GLAUC-88912"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Hospital / Institution *
                      </label>
                      <div className="relative">
                        <Hospital className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={hospitalName}
                          onChange={(e) => setHospitalName(e.target.value)}
                          placeholder="e.g. Apex Vision Institute"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Specialization
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      <option value="Glaucoma & Anterior Segment Specialist">Glaucoma & Anterior Segment Specialist</option>
                      <option value="Consultant Ophthalmologist & Retinal Surgeon">Consultant Ophthalmologist & Retinal Surgeon</option>
                      <option value="General Ophthalmology Clinician">General Ophthalmology Clinician</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${
                  role === 'patient'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-500/25'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
                }`}
              >
                {loading ? (
                  <span>Generating Secure Verification Code...</span>
                ) : (
                  <>
                    <span>Send 6-Digit Email OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 3: 6-DIGIT EMAIL OTP VERIFICATION                   */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              
              {/* Sent Notification Banner */}
              <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
                    <KeyRound className="w-4 h-4 text-teal-400" />
                    <span>6-Digit Verification Code Sent</span>
                  </div>
                  <span className="text-[10px] text-teal-400 font-mono bg-teal-900/60 px-2 py-0.5 rounded border border-teal-500/30">
                    Live Email OTP
                  </span>
                </div>
                
                <p className="text-xs text-slate-300">
                  A verification code was dispatched to <strong className="text-white">{email}</strong>.
                </p>

                {/* Instant Test Helper Banner */}
                {sentOtpCode && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-teal-500/50 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-sans">Your Verification OTP:</span>
                    <span className="text-base font-mono font-extrabold text-cyan-300 tracking-widest bg-cyan-950 px-3 py-0.5 rounded border border-cyan-500/40">
                      {sentOtpCode}
                    </span>
                  </div>
                )}
              </div>

              {/* 6-Digit Input Boxes */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-semibold text-slate-300">
                  Enter 6-Digit Code:
                </label>

                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Actions: Verify & Resend */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={loading || otpDigits.some(d => d === '')}
                  onClick={() => handleAutoVerify(otpDigits.join(''))}
                  className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    role === 'patient'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-500/25 disabled:opacity-50'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 disabled:opacity-50'
                  }`}
                >
                  {loading ? (
                    <span>Verifying Cryptographic Session...</span>
                  ) : (
                    <>
                      <span>Verify & Enter {role === 'patient' ? 'Patient' : 'Clinician'} Portal</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="hover:text-white transition-colors"
                  >
                    ← Edit Details / Email
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResend}
                    className="text-teal-400 hover:text-teal-300 disabled:text-slate-600 font-semibold transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
