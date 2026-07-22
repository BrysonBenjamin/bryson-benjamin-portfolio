import { useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useFeedItem } from "../hooks/useFeedItem";
import { SaSaScene, useSaSaPageAction, useSaSaSafeZone } from "../features/sa-sa/SaSaSceneProvider";
import TaskDetail from "./TaskDetail";

function TaskOverlay() {
  const { id } = useParams<{ id: string }>();
  const { item, status } = useFeedItem(id);
  const navigate = useNavigate();
  const panelRef = useSaSaSafeZone("task-overlay-panel");
  useSaSaPageAction("close-task-overlay", () => navigate(-1));
  const scene = {
    id: "task-overlay",
    priority: 100,
    anchors: [],
    safeZones: [{ id: "task-overlay-panel" }],
    content: id ? [{ type: "feed-item" as const, id }] : [],
    actions: [{ id: "close-task-overlay", label: "Close task detail" }]
  } as const;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        navigate(-1);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <div className="task-overlay-backdrop" onClick={() => navigate(-1)}>
      <SaSaScene scene={scene} />
      <div
        className="task-overlay-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={item?.title ?? "Task detail"}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="task-overlay-close"
          onClick={() => navigate(-1)}
          aria-label="Close task detail"
        >
          <X size={18} aria-hidden="true" />
        </button>
        {status === "loading" && <p className="task-overlay-state">Loading...</p>}
        {status === "not-found" && <p className="task-overlay-state">This task could not be found.</p>}
        {item && <TaskDetail item={item} />}
      </div>
    </div>
  );
}

export default TaskOverlay;
