import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { ArrowLeft, Save, Check } from '../../components/icons';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_gemini_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col p-6 lg:p-12">
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--color-border)] mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
            <Icon icon={ArrowLeft} size={18} />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">Settings</h2>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono">
              Local environment preferences and API key configuration
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto flex-1">
        <Card className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Gemini API Key (Optional)</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                By default, the platform routes through pre-configured school endpoints. You may provide your own Gemini API key for local development.
              </p>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                {saved ? 'Settings updated successfully' : ''}
              </span>
              <Button variant="primary" size="md" type="submit">
                <Icon icon={saved ? Check : Save} size={16} />
                <span>{saved ? 'Saved' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};
