import { useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useFeedItem } from "../hooks/useFeedItem";
import TaskDetail from "./TaskDetail";

function TaskOverlay() {
  const { id } = useParams<{ id: string }>();
  const { item, status } = useFeedItem(id);
  const navigate = useNavigate();

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
      <div
        className="task-overlay-panel"
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
