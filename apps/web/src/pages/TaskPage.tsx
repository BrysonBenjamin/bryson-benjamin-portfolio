import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFeedItem } from "../hooks/useFeedItem";
import TaskDetail from "../components/TaskDetail";
import {
  SaSaScene,
  useSaSaAnchor,
  useSaSaPageAction,
  useSaSaSafeZone
} from "../features/sa-sa/SaSaSceneProvider";
import { isEmptySaSaPageActionInput } from "../features/sa-sa/pageActions";

function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const { item, status } = useFeedItem(id);
  const navigate = useNavigate();
  const dockAnchorRef = useSaSaAnchor("task-detail-dock");
  const readingRef = useSaSaSafeZone("task-detail-reading");
  useSaSaPageAction("return-to-log", () => navigate("/"), isEmptySaSaPageActionInput);
  const scene = {
    id: "task-detail",
    priority: 20,
    anchors: [{ id: "task-detail-dock", placement: "block-end", availability: "desktop" }],
    safeZones: [{ id: "task-detail-reading" }],
    content: id ? [{ type: "feed-item" as const, id }] : [],
    actions: [{ id: "return-to-log", label: "Return to build log" }]
  } as const;

  return (
    <section className="task-page" aria-label="Task detail" ref={readingRef}>
      <SaSaScene scene={scene} />
      <Link className="task-page-back" ref={dockAnchorRef} to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to log</span>
      </Link>
      {status === "loading" && <p className="task-overlay-state">Loading...</p>}
      {status === "not-found" && <p className="task-overlay-state">This task could not be found.</p>}
      {item && <TaskDetail item={item} />}
    </section>
  );
}

export default TaskPage;
