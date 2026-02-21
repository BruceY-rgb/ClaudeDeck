import { useTranslation } from "../../i18n/LanguageContext";

interface InstallDialogProps {
  open: boolean;
  pluginName: string;
  onClose: () => void;
  onConfirm: () => void;
  installing: boolean;
}

export function InstallDialog({
  open,
  pluginName,
  onClose,
  onConfirm,
  installing,
}: InstallDialogProps): JSX.Element | null {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
          {t("marketplace.installTitle")}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">
          {t("marketplace.installConfirm", { name: pluginName })}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {t("marketplace.installHint")}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={installing}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={installing}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {installing ? t("common.installing") : t("common.install")}
          </button>
        </div>
      </div>
    </div>
  );
}
