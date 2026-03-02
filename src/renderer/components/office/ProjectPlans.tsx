import { useState } from "react";
import { Plus, FileText, Edit2, Trash2, Clock, X, Save } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type { ProjectPlan } from "@shared/types/project-config";

interface NewPlanForm {
  name: string;
  content: string;
}

export function ProjectPlans(): JSX.Element {
  const { t } = useTranslation();
  const plans = useProjectConfigStore((s) => s.plans);
  const loading = useProjectConfigStore((s) => s.loading.plans);
  const createPlan = useProjectConfigStore((s) => s.createPlan);
  const updatePlan = useProjectConfigStore((s) => s.updatePlan);
  const deletePlan = useProjectConfigStore((s) => s.deletePlan);

  const [selectedPlan, setSelectedPlan] = useState<ProjectPlan | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState<NewPlanForm>({
    name: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSelectPlan = (plan: ProjectPlan): void => {
    setSelectedPlan(plan);
    setEditing(false);
    setCreating(false);
  };

  const handleEdit = (): void => {
    if (!selectedPlan) return;
    setEditContent(selectedPlan.content);
    setEditing(true);
  };

  const handleCancelEdit = (): void => {
    setEditing(false);
    setEditContent("");
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      await updatePlan(selectedPlan.name, editContent);
      setSelectedPlan({ ...selectedPlan, content: editContent });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (plan: ProjectPlan): void => {
    if (confirm(t("office.projectPlans.deleteConfirm", { name: plan.name }))) {
      deletePlan(plan.name);
      if (selectedPlan?.name === plan.name) {
        setSelectedPlan(null);
        setEditing(false);
      }
    }
  };

  const handleStartCreate = (): void => {
    setCreating(true);
    setEditing(false);
    setSelectedPlan(null);
    setNewPlanForm({ name: "", content: "" });
  };

  const handleCancelCreate = (): void => {
    setCreating(false);
    setNewPlanForm({ name: "", content: "" });
  };

  const handleSaveNewPlan = async (): Promise<void> => {
    const trimmedName = newPlanForm.name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      await createPlan(trimmedName, newPlanForm.content);
      setCreating(false);
      setNewPlanForm({ name: "", content: "" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t("office.projectPlans.title")}
        </h2>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          onClick={handleStartCreate}
        >
          <Plus className="w-4 h-4" />
          {t("office.projectPlans.create")}
        </button>
      </div>

      {/* Empty state */}
      {plans.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-base font-medium">
            {t("office.projectPlans.empty")}
          </p>
          <p className="text-sm mt-1">
            {t("office.projectPlans.emptyHint")}
          </p>
        </div>
      )}

      {/* Two-panel layout */}
      {(plans.length > 0 || creating) && (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left panel: plan list */}
          <div className="w-1/3 min-w-[200px] border border-border rounded-lg overflow-y-auto">
            <div className="divide-y divide-border">
              {plans.map((plan) => (
                <button
                  key={plan.name}
                  className={`w-full text-left px-3 py-3 hover:bg-card transition-colors ${
                    selectedPlan?.name === plan.name && !creating
                      ? "bg-card border-l-2 border-l-primary"
                      : ""
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {plan.name}
                    </span>
                    <button
                      className="p-1 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(plan);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {plan.lastModified && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(plan.lastModified)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: preview / edit / create */}
          <div className="flex-1 border border-border rounded-lg flex flex-col min-h-0">
            {creating ? (
              /* New plan form */
              <div className="flex-1 flex flex-col p-4 min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("office.projectPlans.create")}
                  </h3>
                  <button
                    className="p-1 hover:bg-card rounded-md text-muted-foreground"
                    onClick={handleCancelCreate}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Plan name input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("office.projectPlans.planName")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newPlanForm.name}
                    onChange={(e) =>
                      setNewPlanForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder={t("office.projectPlans.namePlaceholder")}
                  />
                </div>

                {/* Plan content textarea */}
                <div className="flex-1 flex flex-col min-h-0 mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("office.projectPlans.planContent")}
                  </label>
                  <textarea
                    className="flex-1 w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newPlanForm.content}
                    onChange={(e) =>
                      setNewPlanForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="# Plan content..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-sm rounded-md border border-border hover:bg-card transition-colors"
                    onClick={handleCancelCreate}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    onClick={handleSaveNewPlan}
                    disabled={saving || !newPlanForm.name.trim()}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : selectedPlan ? (
              /* Preview / Edit mode */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Plan header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {editing
                        ? `${t("office.projectPlans.editing")}: ${selectedPlan.name}`
                        : selectedPlan.name}
                    </h3>
                    {selectedPlan.lastModified && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("office.projectPlans.lastModified")}:{" "}
                        {formatDate(selectedPlan.lastModified)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content area */}
                {editing ? (
                  <div className="flex-1 p-4 min-h-0 flex flex-col">
                    <textarea
                      className="flex-1 w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 p-4 overflow-y-auto min-h-0">
                    <pre className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
                      {selectedPlan.content}
                    </pre>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 px-4 pb-4 pt-2 border-t border-border">
                  {editing ? (
                    <>
                      <button
                        className="px-4 py-2 text-sm rounded-md border border-border hover:bg-card transition-colors"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-card transition-colors"
                        onClick={handleEdit}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(selectedPlan)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* No plan selected */
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">
                  {t("office.projectPlans.selectToPreview")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
