import * as fs from "fs";
import * as path from "path";

const CLAUDE_DIR = path.join(process.env.HOME || "", ".claude");
const PLANS_DIR = path.join(CLAUDE_DIR, "plans");

export interface PlanInfo {
  fileName: string;
  filePath: string;
  name: string;
  createdAt: Date;
  modifiedAt: Date;
  size: number;
  preview: string;
}

class PlanService {
  /**
   * 获取所有计划文件列表
   */
  async listPlans(): Promise<PlanInfo[]> {
    if (!fs.existsSync(PLANS_DIR)) {
      return [];
    }

    const plans: PlanInfo[] = [];
    const files = fs.readdirSync(PLANS_DIR);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(PLANS_DIR, file);
      const stat = fs.statSync(filePath);

      // 读取文件内容用于预览
      let preview = "";
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        preview = content.slice(0, 500).replace(/\n/g, " ");
      } catch {
        preview = "";
      }

      // 解析文件名获取可读名称
      const name = file.replace(".md", "").replace(/-/g, " ");

      plans.push({
        fileName: file,
        filePath,
        name,
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
        size: stat.size,
        preview,
      });
    }

    // 按修改时间排序
    plans.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
    return plans;
  }

  /**
   * 读取单个计划文件内容
   */
  async readPlan(fileName: string): Promise<string | null> {
    const filePath = path.join(PLANS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, "utf-8");
  }

  /**
   * 写入/更新计划文件内容
   */
  async writePlan(fileName: string, content: string): Promise<{ success: boolean; error?: string }> {
    const filePath = path.join(PLANS_DIR, fileName);

    try {
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true };
    } catch (e) {
      return { success: false, error: `保存失败: ${e}` };
    }
  }

  /**
   * 删除单个计划
   */
  async deletePlan(fileName: string): Promise<{ success: boolean; error?: string }> {
    const filePath = path.join(PLANS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "计划文件不存在" };
    }

    try {
      fs.unlinkSync(filePath);
      return { success: true };
    } catch (e) {
      return { success: false, error: `删除失败: ${e}` };
    }
  }

  /**
   * 批量删除计划
   */
  async batchDeletePlans(
    fileNames: string[]
  ): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let deletedCount = 0;

    for (const fileName of fileNames) {
      const result = await this.deletePlan(fileName);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`${fileName}: ${result.error}`);
      }
    }

    return { success: errors.length === 0, deletedCount, errors };
  }
}

export const planService = new PlanService();
