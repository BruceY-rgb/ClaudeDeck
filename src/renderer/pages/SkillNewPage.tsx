import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSkillStore, type SkillFormData } from "../stores/skillStore";
import { PageHeader } from "../components/shared/PageHeader";
import { SkillEditor } from "../components/skills/SkillEditor";
import { useTranslation } from "../i18n/LanguageContext";

export function SkillNewPage(): JSX.Element {
  const navigate = useNavigate();
  const { createSkill } = useSkillStore();
  const { t } = useTranslation();

  const [saving, setSaving] = useState(false);

  const handleSave = async (data: SkillFormData) => {
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSaving(true);
    try {
      await createSkill(slug, data);
      navigate(`/skills/personal/${slug}`);
    } catch (error) {
      console.error("Failed to create skill:", error);
      alert("Failed to create skill");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/skills");
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t("skills.newTitle")}
        description={t("skills.newDescription")}
        backTo={{ label: t("skills.backToSkills"), path: "/skills" }}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          <SkillEditor
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
