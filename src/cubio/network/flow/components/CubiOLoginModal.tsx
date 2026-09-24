/**
 * CubiO — Universal Spatial Operating Environment
 * Process 2: Interactive Sovereign Login & User Flow Modal Component
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Globe,
  Wallet,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  User,
  Compass,
  Layers,
} from 'lucide-react';
import { CubiOUserFlowManager } from '../userFlowManager';
import { CubiOUserSessionState } from '../types';
import { AuthenticationProviderType } from '../../auth/types';

export interface CubiOLoginModalProps {
  readonly flowManager: CubiOUserFlowManager;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: (state: CubiOUserSessionState) => void;
}

export const CubiOLoginModal: React.FC<CubiOLoginModalProps> = ({
  flowManager,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AuthenticationProviderType>('GOOGLE');
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('SovereignPass123!');
  const [walletAddress, setWalletAddress] = useState('0x71C...B98');
  const [isLoading, setIsLoading] = useState(false);
  const [flowState, setFlowState] = useState<CubiOUserSessionState>(flowManager.getState());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    return flowManager.subscribe(setFlowState);
  }, [flowManager]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let payload: Record<string, any> = {};

      if (selectedProvider === 'GOOGLE') {
        payload = {
          idToken: `google-sub-${username}-999`,
          email: `${username}@gmail.com`,
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
        };
      } else if (selectedProvider === 'CUBIO_NATIVE') {
        payload = {
          username,
          password,
        };
      } else if (selectedProvider === 'WEB3') {
        payload = {
          address: walletAddress,
          signature: '0xSIG_WEB3_MOCK_VERIFIED',
          mockVerified: true,
        };
      } else if (selectedProvider === 'PASSKEY') {
        payload = {
          credentialId: `passkey-${username}-device-01`,
          mockVerified: true,
        };
      }

      const finalState = await flowManager.authenticate({
        provider: selectedProvider,
        payload,
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
      });

      if (onSuccess) {
        onSuccess(finalState);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication flow failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { label: 'Provider Auth', active: flowState.stage !== 'UNAUTHENTICATED', done: flowState.stage !== 'UNAUTHENTICATED' && flowState.stage !== 'AUTHENTICATING' },
    { label: 'Sovereign ID', active: ['RESOLVING_IDENTITY', 'CREATING_SESSION', 'CHECKING_PERMISSIONS', 'RESOLVING_ACCOUNT', 'CONNECTING_COORDINATE', 'AUTHENTICATED_READY'].includes(flowState.stage), done: !!flowState.cubId },
    { label: 'Session Token', active: ['CREATING_SESSION', 'CHECKING_PERMISSIONS', 'RESOLVING_ACCOUNT', 'CONNECTING_COORDINATE', 'AUTHENTICATED_READY'].includes(flowState.stage), done: !!flowState.session },
    { label: 'Permissions', active: ['CHECKING_PERMISSIONS', 'RESOLVING_ACCOUNT', 'CONNECTING_COORDINATE', 'AUTHENTICATED_READY'].includes(flowState.stage), done: flowState.permissions.length > 0 },
    { label: 'CubiO Account', active: ['RESOLVING_ACCOUNT', 'CONNECTING_COORDINATE', 'AUTHENTICATED_READY'].includes(flowState.stage), done: !!flowState.account },
    { label: 'Coordinate', active: ['CONNECTING_COORDINATE', 'AUTHENTICATED_READY'].includes(flowState.stage), done: !!flowState.coordinateUri },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '520px',
          backgroundColor: '#070D1A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #131E35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0F172A',
                border: '1px solid #6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>CubiO Sovereign Login</h2>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>Process 2: End-to-End User Flow Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline Stage Visualizer */}
        <div style={{ padding: '16px 24px', backgroundColor: '#0A1122', borderBottom: '1px solid #131E35' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: step.done ? '#10B981' : step.active ? '#6366F1' : '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#FFF',
                  }}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '9px', color: step.done ? '#34D399' : step.active ? '#A5B4FC' : '#475569', fontWeight: 600 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Provider Selection Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {[
              { id: 'GOOGLE', label: 'Google', icon: Globe },
              { id: 'CUBIO_NATIVE', label: 'Native', icon: Key },
              { id: 'PASSKEY', label: 'Passkey', icon: Fingerprint },
              { id: 'WEB3', label: 'Web3', icon: Wallet },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedProvider(id as AuthenticationProviderType)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  backgroundColor: selectedProvider === id ? 'rgba(99, 102, 241, 0.15)' : '#0F172A',
                  border: selectedProvider === id ? '1px solid #6366F1' : '1px solid #1E293B',
                  color: selectedProvider === id ? '#A5B4FC' : '#94A3B8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Input Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Username / Identifier
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {selectedProvider === 'CUBIO_NATIVE' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {selectedProvider === 'WEB3' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Summary if Authenticated */}
          {flowState.isAuthenticated && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6EE7B7',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Connected as {flowState.account?.displayName} ({flowState.cubId})</span>
              </div>
              <div style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '10px' }}>
                Coordinate: {flowState.coordinateUri}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={flowState.isAuthenticated ? onClose : handleLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: flowState.isAuthenticated ? '#10B981' : '#6366F1',
              border: 'none',
              color: '#FFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{flowState.isAuthenticated ? 'Enter CubiO Workspace' : `Connect via ${selectedProvider}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
