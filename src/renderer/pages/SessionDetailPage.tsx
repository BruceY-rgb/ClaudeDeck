import { useParams, useNavigate } from "react-router-dom";
import { SessionDetailView } from "../components/session-detail";

export function SessionDetailPage(): JSX.Element {
  const { projectDir, sessionId } = useParams<{
    projectDir: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();

  if (!projectDir || !sessionId) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        Missing parameters
      </div>
    );
  }

  return (
    <div className="h-full">
      <SessionDetailView
        projectDir={decodeURIComponent(projectDir)}
        sessionId={sessionId}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
