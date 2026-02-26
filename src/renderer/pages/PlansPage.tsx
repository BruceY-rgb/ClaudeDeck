import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Trash2,
  FileText,
  CheckSquare,
  Square,
  Search,
  RefreshCw,
  Edit3,
  Save,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { useTranslation } from "../i18n/LanguageContext";

interface PlanInfo {
  fileName: string;
  filePath: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  size: number;
  preview: string;
}

export function PlansPage(): JSX.Element {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [previewPlan, setPreviewPlan] = useState<PlanInfo | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 全屏预览状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 加载计划列表
  const loadPlans = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await window.electronAPI.plans.list();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // 过滤计划
  const filteredPlans = plans.filter((plan) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return plan.name.toLowerCase().includes(q) || plan.preview.toLowerCase().includes(q);
  });

  // 选择/取消选择
  const toggleSelect = (fileName: string): void => {
    const newSelected = new Set(selectedPlans);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedPlans(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = (): void => {
    if (selectedPlans.size === filteredPlans.length) {
      setSelectedPlans(new Set());
    } else {
      setSelectedPlans(new Set(filteredPlans.map((p) => p.fileName)));
    }
  };

  // 删除单个计划
  const handleDelete = async (fileName: string): Promise<void> => {
    if (!confirm(t("plans.deleteConfirm", { name: fileName.replace(".md", "") }))) {
      return;
    }

    const result = await window.electronAPI.plans.delete(fileName);
    if (result.success) {
      setPlans(plans.filter((p) => p.fileName !== fileName));
      setSelectedPlans((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
      if (previewPlan?.fileName === fileName) {
        setPreviewPlan(null);
        setPreviewContent(null);
        setIsEditing(false);
      }
    } else {
      alert(t("plans.deleteFailed", { error: result.error }));
    }
  };

  // 批量删除
  const handleBatchDelete = async (): Promise<void> => {
    if (!confirm(t("plans.batchDeleteConfirm", { count: selectedPlans.size }))) {
      return;
    }

    const result = await window.electronAPI.plans.batchDelete(Array.from(selectedPlans));

    if (result.success) {
      setPlans(plans.filter((p) => !selectedPlans.has(p.fileName)));
      setSelectedPlans(new Set());
      setPreviewPlan(null);
      setPreviewContent(null);
      setIsEditing(false);
    } else {
      alert(t("plans.deleteFailed", { error: result.errors.join(", ") }));
    }
  };

  // 加载预览
  const loadPreview = async (plan: PlanInfo): Promise<void> => {
    // 如果正在编辑，提示保存
    if (isEditing && previewPlan) {
      const unsaved = editContent !== previewContent;
      if (unsaved) {
        if (!confirm("您有未保存的更改，确定要切换吗？")) {
          return;
        }
      }
    }

    setPreviewPlan(plan);
    setIsEditing(false);
    setLoadingPreview(true);
    try {
      const content = await window.electronAPI.plans.read(plan.fileName);
      setPreviewContent(content);
      setEditContent(content || "");
    } catch {
      setPreviewContent(null);
      setEditContent("");
    } finally {
      setLoadingPreview(false);
    }
  };

  // 开始编辑
  const handleEdit = (): void => {
    setEditContent(previewContent || "");
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = (): void => {
    setEditContent(previewContent || "");
    setIsEditing(false);
  };

  // 保存编辑
  const handleSave = async (): Promise<void> => {
    if (!previewPlan) return;

    setIsSaving(true);
    try {
      const result = await window.electronAPI.plans.write(previewPlan.fileName, editContent);
      if (result.success) {
        setPreviewContent(editContent);
        setIsEditing(false);
        await loadPlans();
      } else {
        alert(t("plans.deleteFailed", { error: result.error }));
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 切换全屏
  const toggleFullscreen = (): void => {
    setIsFullscreen(!isFullscreen);
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 格式化时间
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="p-6">
      <PageHeader
        title={t("plans.title")}
        description={t("plans.description")}
        actions={
          <button
            onClick={loadPlans}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            title={t("common.refresh")}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        }
      />

      {/* 搜索和批量操作栏 */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("plans.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {selectedPlans.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">
              {t("plans.selected", { count: selectedPlans.size })}
            </span>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              {t("plans.batchDelete")}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">{t("common.loading")}</div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FileText className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
          <h2 className="text-xl font-semibold">{t("plans.noPlans")}</h2>
        </div>
      ) : (
        <div className={`grid gap-4 ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`} style={{ height: "calc(100vh - 280px)" }}>
          {/* 计划列表 - 全屏模式下隐藏 */}
          {!isFullscreen && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
              {/* 表头 */}
              <div className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
                <button onClick={toggleSelectAll} className="p-1">
                  {selectedPlans.size === filteredPlans.length && filteredPlans.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span className="text-sm font-medium">{t("plans.selectAll")}</span>
              </div>

              {/* 列表 - 内部滚动 */}
              <div ref={listRef} className="flex-1 overflow-y-auto">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.fileName}
                    className={`flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${
                      previewPlan?.fileName === plan.fileName ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                    onClick={() => loadPreview(plan)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(plan.fileName);
                      }}
                      className="p-1 shrink-0"
                    >
                      {selectedPlans.has(plan.fileName) ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{plan.name}</h3>
                      <p className="text-xs text-zinc-500 truncate">{plan.preview}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(plan.fileName);
                      }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-500 shrink-0"
                      title={t("common.delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 预览面板 */}
          <div
            className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col ${
              isFullscreen ? "fixed inset-0 z-50" : ""
            }`}
          >
            {!previewPlan ? (
              <div className="flex-1 flex items-center justify-center text-zinc-400 p-8">
                <p>{t("plans.selectToPreview")}</p>
              </div>
            ) : loadingPreview ? (
              <div className="flex-1 flex items-center justify-center text-zinc-400 p-8">
                <p>{t("common.loading")}</p>
              </div>
            ) : !previewContent ? (
              <div className="flex-1 flex items-center justify-center text-zinc-400 p-8">
                <p>{t("common.loading")}</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 预览头部信息 */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{previewPlan.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleFullscreen}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title={isFullscreen ? "退出全屏" : "全屏预览"}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <Maximize2 className="w-4 h-4" />
                        )}
                      </button>
                      {!isEditing ? (
                        <button
                          onClick={handleEdit}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-blue-500"
                            title="保存"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>
                      {t("plans.created")}: {formatTime(previewPlan.createdAt)}
                    </span>
                    <span>
                      {t("plans.modified")}: {formatTime(previewPlan.modifiedAt)}
                    </span>
                    <span>
                      {t("plans.size")}: {formatSize(previewPlan.size)}
                    </span>
                  </div>
                </div>

                {/* 预览内容 - 内部滚动 */}
                <div className={`flex-1 overflow-y-auto ${isFullscreen ? "p-6" : "p-4"}`}>
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {previewContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
