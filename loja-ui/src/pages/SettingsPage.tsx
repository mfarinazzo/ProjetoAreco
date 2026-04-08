import { type FormEvent, useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INITIAL_PASSWORD_FORM_VALUES: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [values, setValues] = useState<PasswordFormValues>(INITIAL_PASSWORD_FORM_VALUES);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(INITIAL_PASSWORD_FORM_VALUES);
    setError("");
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (values.newPassword.length < 8) {
      setError("New password must have at least 8 characters.");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    onSubmit();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
            <p className="mt-1 text-sm text-slate-500">Security action simulated in frontend only.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={values.currentPassword}
              onChange={(event) => setValues((state) => ({ ...state, currentPassword: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={values.newPassword}
              onChange={(event) => setValues((state) => ({ ...state, newPassword: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={values.confirmPassword}
              onChange={(event) => setValues((state) => ({ ...state, confirmPassword: event.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-lg border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800">
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Areco Commerce");
  const [supportEmail, setSupportEmail] = useState("support@areco.store");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState("USD");
  const [lowStockThreshold, setLowStockThreshold] = useState("25");

  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
  const [isWeeklyReportEnabled, setIsWeeklyReportEnabled] = useState(true);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);

  function handleSaveSettings() {
    setShowSavedBanner(true);
  }

  function handlePasswordUpdated() {
    setShowSavedBanner(true);
  }

  return (
    <>
      {showSavedBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Settings were saved locally. Backend persistence will be connected later.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
          <CardHeader className="border-b border-slate-100 px-4 py-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Store Configuration</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(event) => {
                  setStoreName(event.target.value);
                  setShowSavedBanner(false);
                }}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(event) => {
                  setSupportEmail(event.target.value);
                  setShowSavedBanner(false);
                }}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(event) => {
                    setCurrency(event.target.value);
                    setShowSavedBanner(false);
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  <option value="USD">USD</option>
                  <option value="BRL">BRL</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Timezone</label>
                <select
                  value={timezone}
                  onChange={(event) => {
                    setTimezone(event.target.value);
                    setShowSavedBanner(false);
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/Lisbon">Europe/Lisbon</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Low Stock Threshold</label>
              <input
                type="number"
                min="1"
                step="1"
                value={lowStockThreshold}
                onChange={(event) => {
                  setLowStockThreshold(event.target.value);
                  setShowSavedBanner(false);
                }}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
          <CardHeader className="border-b border-slate-100 px-4 py-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Notifications & Security</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <span>Email alerts</span>
              <input
                type="checkbox"
                checked={isEmailEnabled}
                onChange={(event) => {
                  setIsEmailEnabled(event.target.checked);
                  setShowSavedBanner(false);
                }}
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <span>SMS alerts</span>
              <input
                type="checkbox"
                checked={isSmsEnabled}
                onChange={(event) => {
                  setIsSmsEnabled(event.target.checked);
                  setShowSavedBanner(false);
                }}
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <span>Weekly report</span>
              <input
                type="checkbox"
                checked={isWeeklyReportEnabled}
                onChange={(event) => {
                  setIsWeeklyReportEnabled(event.target.checked);
                  setShowSavedBanner(false);
                }}
              />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-900">Security</p>
              <p className="mt-1 text-xs text-slate-500">Manage login access and password policies.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="mt-3 h-9 rounded-lg border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100"
              >
                <Shield className="size-4" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSaveSettings}
          className="h-10 rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800"
        >
          Save Settings
        </Button>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordUpdated}
      />
    </>
  );
}
